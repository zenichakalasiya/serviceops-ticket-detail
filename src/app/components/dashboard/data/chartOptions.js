/**
 * chartOptions.js — ECharts option builders for the PMG-ACT-01 additional chart
 * kinds. Each `opt*` takes (out, spec, t):
 *   out  — the engine output from records.js `chartData(spec)`
 *   spec — the tile's chartSpec (kind + its per-kind config)
 *   t    — theme tokens { ink, ink2, muted, border, surface, font, pal[], other }
 * and returns a plain ECharts option. ChartTile owns registration + rendering and
 * dispatches new kinds here via CHART_OPT; the legacy kinds stay in ChartTile.
 *
 * NEW_KINDS is the authority for "is this a chartData/CHART_OPT kind?" — ChartTile
 * uses it to decide whether to compute from a spec or from labels/series, and the
 * builder uses it to pick the right config sections. Grows one batch at a time.
 */
import { gaugeBands, niceCeil } from './records.js'

export const NEW_KINDS = new Set(['stack', 'grouped', 'multiline', 'combo', 'hist', 'funnel', 'heatmap', 'gauge', 'mapbubble'])

// a native ECharts legend, styled to match the product (used by the multi-series
// new kinds; single-series kinds omit it, funnel prints its labels on the bands)
const nativeLegend = (t) => ({
  show: true, type: 'scroll', bottom: 0, icon: 'roundRect',
  itemWidth: 9, itemHeight: 9, itemGap: 12,
  textStyle: { color: t.muted, fontSize: 11.5, fontFamily: t.font }, inactiveColor: t.border,
})

// shared chrome — mirrors the cartesian idioms in ChartTile.vue so the additional
// kinds read as the same product, not a bolt-on.
const dot = (c) => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:7px"></span>`
const tipBox = (t) => ({
  backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, padding: [6, 10],
  extraCssText: 'box-shadow: 0 8px 28px rgba(27,28,46,.18); border-radius: 8px;',
  textStyle: { color: t.ink2, fontSize: 12, fontFamily: t.font },
})
const axisChrome = (t) => ({
  axisLine: { show: false }, axisTick: { show: false },
  axisLabel: { color: t.muted, fontSize: 11, fontFamily: t.font },
})
const dashedSplit = (t) => ({ show: true, lineStyle: { color: t.border, type: 'dashed', opacity: 0.7 } })

const ENTER_DELAY = 260   // hold the draw until the card has faded in (matches ChartTile)

// ── Stacked / Grouped (§4.1) ─────────────────────────────────────────────────────
// One series per Split-by value. Stacked → one column per X value, square corners,
// stack:'total'. Grouped → drop the stack key, bars side by side with rounded tops.
export function optStacked(out, spec, t) {
  const grouped = spec.stackMode === 'grouped'
  const labels = out.labels || []
  const series = out.series || []
  const step = (n) => Math.min(70, Math.max(18, 500 / Math.max(1, n)))
  return {
    tooltip: {
      ...tipBox(t), trigger: 'axis', axisPointer: { type: 'shadow', lineStyle: { color: t.border } },
      formatter: (ps) => {
        const head = `<div style="color:${t.ink};font-weight:600;margin-bottom:3px">${ps[0]?.axisValueLabel ?? ''}</div>`
        const body = ps.map((p) => `<div style="white-space:nowrap">${dot(p.color)}${p.seriesName}: <b style="color:${t.ink}">${p.value}</b></div>`).join('')
        return head + body
      },
    },
    // native, interactive legend — clicking a name drops that series and rescales
    legend: {
      show: true, type: 'scroll', bottom: 0, icon: 'roundRect',
      itemWidth: 9, itemHeight: 9, itemGap: 12,
      textStyle: { color: t.muted, fontSize: 11.5, fontFamily: t.font }, inactiveColor: t.border,
    },
    grid: { left: 6, right: 14, top: 14, bottom: 30, containLabel: true },
    xAxis: { type: 'category', data: labels, ...axisChrome(t), boundaryGap: true },
    yAxis: { type: 'value', ...axisChrome(t), splitLine: dashedSplit(t) },
    series: series.map((s, si) => ({
      name: s.name, type: 'bar', data: s.values,
      ...(grouped ? {} : { stack: 'total' }),
      barMaxWidth: grouped ? 26 : 40,
      itemStyle: { color: t.pal[si % t.pal.length], borderRadius: grouped ? [3, 3, 0, 0] : [0, 0, 0, 0] },
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      animationDelay: (i) => ENTER_DELAY + i * step(s.values.length) + si * 90,
      emphasis: { focus: 'series' }, blur: { itemStyle: { opacity: 0.18 } },
    })),
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0,
  }
}

// ── Multi-line (§4.2) ─────────────────────────────────────────────────────────────
// One line per Split-by value across a shared X-Axis; native interactive legend.
export function optMultiline(out, spec, t) {
  const labels = out.labels || []
  const series = out.series || []
  const color = (i) => t.pal[i % t.pal.length]
  return {
    tooltip: { ...tipBox(t), trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: t.border } } },
    legend: {
      show: true, type: 'scroll', bottom: 0, icon: 'roundRect',
      itemWidth: 9, itemHeight: 9, itemGap: 12,
      textStyle: { color: t.muted, fontSize: 11.5, fontFamily: t.font }, inactiveColor: t.border,
    },
    grid: { left: 6, right: 14, top: 14, bottom: 30, containLabel: true },
    // boundaryGap:false so the first point sits on the axis, not inset half a band
    xAxis: { type: 'category', data: labels, boundaryGap: false, ...axisChrome(t) },
    yAxis: { type: 'value', ...axisChrome(t), splitLine: dashedSplit(t) },
    series: series.map((s, i) => ({
      name: s.name, type: 'line', data: s.values,
      smooth: 0.35, showSymbol: true, symbolSize: 7,
      lineStyle: { width: 2.5, cap: 'round', join: 'round', color: color(i) },
      itemStyle: { color: color(i) },
      emphasis: { focus: 'series' },
      blur: { lineStyle: { opacity: 0.18 }, itemStyle: { opacity: 0.18 } },
      animation: true, animationDuration: 1500, animationEasing: 'cubicOut', animationDelay: ENTER_DELAY,
    })),
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0,
  }
}

// ── Combo (§4.3) ──────────────────────────────────────────────────────────────────
// Count bars on the primary (left) value axis + an aggregate line on a SECOND value
// axis (no split lines, so the two grids never fight). Line nulls are genuine gaps.
export function optCombo(out, spec, t) {
  const barColor = t.pal[0], lineColor = t.pal[4]   // blue bars, violet line — separable
  const axis = axisChrome(t)
  const step = (n) => Math.min(70, Math.max(18, 500 / Math.max(1, n)))
  const series = (out.series || []).map((s) => {
    if (s.role === 'line') {
      return {
        name: s.name, type: 'line', yAxisIndex: 1, data: s.values,
        connectNulls: true, smooth: 0.35, symbolSize: 7,
        lineStyle: { width: 2.5, cap: 'round', join: 'round', color: lineColor },
        itemStyle: { color: lineColor },
        emphasis: { focus: 'series' }, blur: { lineStyle: { opacity: 0.18 }, itemStyle: { opacity: 0.18 } },
        animation: true, animationDuration: 1500, animationEasing: 'cubicOut', animationDelay: ENTER_DELAY,
      }
    }
    return {
      name: s.name, type: 'bar', yAxisIndex: 0, data: s.values, barMaxWidth: 26,
      itemStyle: { borderRadius: [3, 3, 0, 0], color: barColor },
      emphasis: { focus: 'series' }, blur: { itemStyle: { opacity: 0.18 } },
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      animationDelay: (i) => ENTER_DELAY + i * step(s.values.length),
    }
  })
  return {
    tooltip: {
      ...tipBox(t), trigger: 'axis', axisPointer: { type: 'shadow', lineStyle: { color: t.border } },
      formatter: (ps) => {
        const head = `<div style="color:${t.ink};font-weight:600;margin-bottom:3px">${ps[0]?.axisValueLabel ?? ''}</div>`
        const body = ps.map((p) => {
          const raw = (p.value == null || p.value === '-') ? '—' : p.value
          return `<div style="white-space:nowrap">${dot(p.color)}${p.seriesName}: <b style="color:${t.ink}">${raw}</b></div>`
        }).join('')
        return head + body
      },
    },
    legend: nativeLegend(t),
    grid: { left: 6, right: 14, top: 14, bottom: 30, containLabel: true },
    xAxis: { type: 'category', data: out.labels, boundaryGap: true, ...axis },
    yAxis: [
      { type: 'value', ...axis, splitLine: dashedSplit(t) },
      { type: 'value', ...axis, splitLine: { show: false } },   // aggregate axis — no grid
    ],
    series,
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0,
  }
}

// ── Histogram (§4.4) ────────────────────────────────────────────────────────────────
// Single series over gap-free, equal-width bands; bars nearly touch (no barMaxWidth).
export function optHist(out, spec, t) {
  const labels = out.labels || []
  const s0 = out.series?.[0] || { name: 'Records', values: [] }
  const values = s0.values || [], name = s0.name || 'Records'
  const total = values.reduce((a, b) => a + b, 0) || 1
  const step = Math.min(70, Math.max(18, 500 / Math.max(1, values.length)))
  return {
    tooltip: {
      ...tipBox(t), trigger: 'axis', axisPointer: { type: 'shadow', lineStyle: { color: t.border } },
      formatter: (ps) => {
        const p = ps[0]; if (!p) return ''
        const pct = ((p.value / total) * 100).toFixed(2)
        return `<div style="color:${t.ink};font-weight:600;margin-bottom:3px">${p.axisValueLabel ?? ''}</div>`
          + `<div style="white-space:nowrap">${dot(p.color)}${name}: ${pct}% <b style="color:${t.ink}">(${p.value})</b></div>`
      },
    },
    legend: { show: false },
    grid: { left: 6, right: 14, top: 14, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: true, ...axisChrome(t) },
    yAxis: { type: 'value', ...axisChrome(t), splitLine: dashedSplit(t) },
    series: [{
      name, type: 'bar', data: values, barCategoryGap: '8%',
      itemStyle: { borderRadius: [3, 3, 0, 0], color: t.pal[0] },
      emphasis: { focus: 'series' }, blur: { itemStyle: { opacity: 0.18 } },
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      animationDelay: (i) => ENTER_DELAY + i * step,
    }],
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0,
  }
}

// ── Funnel (§4.7) ─────────────────────────────────────────────────────────────────
// Cumulative stage bands in the field's DEFINED order; each labelled with its count
// and its share of the FIRST stage (never a slice-of-total). Self-labelling — no legend.
const FUNNEL_SEMANTIC = {
  p1: 4, p2: 3, p3: 1, p4: 8,
  open: 1, 'in progress': 3, pending: 1,
  resolved: 2, closed: 2, compliant: 2,
  breached: 4, overdue: 4, failed: 4, critical: 4,
}
export function optFunnel(out, spec, t) {
  const labels = out?.labels || [], values = out?.values || [], shares = out?.shares || []
  const pal = t.pal || []
  const colorFor = (name, i) => {
    const sem = FUNNEL_SEMANTIC[String(name).toLowerCase()]
    return (sem ? pal[sem - 1] : null) || pal[i % (pal.length || 1)] || t.ink
  }
  const data = labels.map((name, i) => ({
    name, value: values[i] == null ? 0 : values[i], share: shares[i] == null ? 0 : shares[i],
    itemStyle: { color: colorFor(name, i), borderColor: t.surface, borderWidth: 2 },
  }))
  const step = Math.min(70, Math.max(18, 500 / Math.max(1, data.length)))
  return {
    tooltip: {
      ...tipBox(t), trigger: 'item',
      formatter: (p) => `${dot(p.color)}${p.name}: ${p.data.share}% of first <b style="color:${t.ink}">(${p.value})</b>`,
    },
    legend: { show: false },
    series: [{
      type: 'funnel', left: '8%', right: '8%', top: 10, bottom: 10,
      sort: 'descending', funnelAlign: 'center', gap: 2, minSize: '12%',
      label: {
        show: true, position: 'inside', color: '#fff', fontWeight: 600,
        fontSize: 11, fontFamily: t.font, formatter: (p) => `${p.value} · ${p.data.share}%`,
      },
      labelLine: { show: false },
      itemStyle: { borderColor: t.surface, borderWidth: 2 },
      emphasis: { focus: 'self' }, blur: { itemStyle: { opacity: 0.18 } },
      data,
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      animationDelay: (i) => ENTER_DELAY + i * step,
    }],
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0,
  }
}

// ── Heatmap (§4.5) ────────────────────────────────────────────────────────────────
// Columns × Rows grid; each cell coloured on a hidden 0→max visualMap ramp and
// printed with its own value. First row sits at the TOP (yAxis inverse).
export function optHeatmap(out, spec, t) {
  const maxVal = Math.max(1, out.max)   // stable ramp even for an all-zero / single-value grid
  return {
    tooltip: {
      ...tipBox(t),
      formatter: (p) => {
        const col = out.cols[p.value[0]], row = out.rows[p.value[1]]
        return `<div style="color:${t.ink};font-weight:600;margin-bottom:2px">${row} × ${col}</div>`
          + `<div style="white-space:nowrap;color:${t.ink2}">${p.value[2]}${out.unit}</div>`
      },
    },
    grid: { left: 6, right: 14, top: 14, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category', data: out.cols, splitArea: { show: false },
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 11, fontFamily: t.font },
    },
    yAxis: {
      type: 'category', data: out.rows, inverse: true, splitArea: { show: false },
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 11, fontFamily: t.font },
    },
    visualMap: { show: false, min: 0, max: maxVal, calculable: false, dimension: 2, inRange: { color: ['#eef4fb', t.primary] } },
    series: [{
      type: 'heatmap', data: out.data,
      label: { show: true, fontSize: 10, fontFamily: t.font, color: t.ink2, formatter: (p) => `${p.value[2]}` },
      itemStyle: { borderColor: t.surface, borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(27,28,46,.20)' } },
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
    }],
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut',
  }
}

// ── Gauge (§4.8) ──────────────────────────────────────────────────────────────────
// A single measurement on a coloured-band arc. Max auto-ceilings ~25% above the value
// (Percentage pins to 100); bands come from records.js gaugeBands (the KPI-Highlights
// analog). out = chartData(gauge spec) = measurement(...) enriched.
export function optGauge(out, spec, t) {
  const m = spec.measure || {}
  const isPct = m.mode === 'percentage'
  const val = out?.value == null ? 0 : out.value
  const unit = out?.unit || ''
  const userMax = Number(spec.gaugeMax)
  const max = isPct ? 100 : (userMax > 0 ? userMax : niceCeil(val * 1.25))
  const bands = gaugeBands(max, spec.warnAt, spec.badAt, spec.invert)
  const stops = bands.length ? bands.map((b) => [b.to, b.color]) : [[1, t.muted]]
  return {
    animation: true, animationDuration: 1400, animationEasing: 'cubicOut', animationDelay: ENTER_DELAY,
    series: [{
      type: 'gauge', startAngle: 205, endAngle: -25, min: 0, max, radius: '92%', center: ['50%', '60%'],
      progress: { show: false },
      axisLine: { lineStyle: { width: 14, color: stops } },
      pointer: { length: '62%', width: 5, itemStyle: { color: t.ink } },
      anchor: { show: true, size: 14, showAbove: true, itemStyle: { color: t.surface, borderColor: t.ink, borderWidth: 2 } },
      axisTick: { distance: -14, length: 4, lineStyle: { color: t.surface, width: 1 } },
      splitLine: { distance: -14, length: 14, lineStyle: { color: t.surface, width: 2 } },
      splitNumber: 5,
      axisLabel: { distance: 16, color: t.muted, fontSize: 10, fontFamily: t.font },
      title: { show: false },
      detail: {
        valueAnimation: true, offsetCenter: [0, '40%'],
        formatter: (v) => `${(v == null ? 0 : v).toFixed(1)}${unit}`,
        color: t.ink, fontSize: 30, fontWeight: 700, fontFamily: t.font,
      },
      data: [{ value: val }],
    }],
  }
}

// ── Map Bubble (§4.6) ─────────────────────────────────────────────────────────────
// One bubble per Site, positioned by [lng,lat] on the registered India geo, sized by
// the mapped value. The 'india' map must be registered (ChartTile does this lazily)
// before this option renders. Geographic dimension is fixed to Site.
export function optMapBubble(out, spec, t) {
  const points = out?.points || []
  const maxVal = Math.max(1, out?.max || 1)
  const caption = out?.caption || 'Value'
  const unit = out?.unit || ''
  return {
    tooltip: {
      ...tipBox(t), trigger: 'item',
      formatter: (p) => `<div style="color:${t.ink};font-weight:600;margin-bottom:2px">${p.name}</div>`
        + `<div style="white-space:nowrap;color:${t.ink2}">${caption}: <b style="color:${t.ink}">${p.value[2]}${unit}</b></div>`,
    },
    geo: {
      map: 'india', roam: false, layoutCenter: ['50%', '52%'], layoutSize: '122%',
      itemStyle: { areaColor: '#eef4fb', borderColor: t.border, borderWidth: 0.5 },
      emphasis: { itemStyle: { areaColor: '#e3edf7' }, label: { show: false } },
    },
    series: [{
      type: 'scatter', coordinateSystem: 'geo',
      data: points.map((p) => ({ name: p.name, value: [p.coord[0], p.coord[1], p.value] })),
      symbolSize: (val) => 9 + 26 * (val[2] / maxVal),
      itemStyle: { color: t.primary, opacity: 0.85, borderColor: '#fff', borderWidth: 1.5 },
      label: { show: true, formatter: '{b}', position: 'right', fontSize: 10.5, fontFamily: t.font, color: t.ink2 },
      emphasis: { scale: 1.25, itemStyle: { opacity: 1 } },
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      animationDelay: (i) => ENTER_DELAY + i * 70,
    }],
    animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut',
  }
}

// kind → option builder. ChartTile calls CHART_OPT[kind](out, spec, t). Grows per batch.
export const CHART_OPT = {
  stack: optStacked,
  /* Grouped is Stacked's other reading of the same two-dimension data — same engine,
   * same option builder, bars side by side instead of piled. It is its own KIND rather
   * than a mode of Stacked so the picker can offer it as a peer, which is also why the
   * mode is forced here: the kind IS the choice, and a spec that disagreed with its own
   * kind would draw a "Grouped" widget stacked. */
  grouped: (out, spec, t) => optStacked(out, { ...spec, stackMode: 'grouped' }, t),
  multiline: optMultiline,
  combo: optCombo,
  hist: optHist,
  funnel: optFunnel,
  heatmap: optHeatmap,
  gauge: optGauge,
  mapbubble: optMapBubble,
}
