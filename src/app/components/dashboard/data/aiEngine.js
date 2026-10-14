/**
 * aiEngine — the deterministic, GROUNDED, no-LLM core behind the AI showcase.
 *
 * Principle (from the research): the model never computes numbers. A deterministic
 * layer computes every fact — breach counts, week-over-week deltas, z-score
 * outliers — and a language layer only PHRASES them. In this prototype that
 * language layer is a set of JS string templates (no real LLM), which is exactly
 * the "graceful no-LLM fallback" every feature must degrade to on-prem. Swapping
 * in a 7B model later changes the phrasing, not the numbers.
 *
 * Shared by P1-D (Focus summary), P3-B (Anomaly badge) and P2-A (Deep-dive).
 */
import { chartData } from './records.js'

// ---------------------------------------------------------------------------
// Anomaly — a robust z-score over a KPI's own recent history.
// A value is flagged only when it sits > THRESH standard deviations from its
// trailing mean. THRESH is set so the demo's Overdue spike trips while the SLA
// near-miss deliberately does NOT (the restraint proof — no crying wolf).
// ---------------------------------------------------------------------------
const THRESH = 3.0

export function anomalyFor(tile) {
  if (tile.type !== 'kpi' || !Array.isArray(tile.history) || tile.history.length < 4) return null
  const h = tile.history
  const mean = h.reduce((a, b) => a + b, 0) / h.length
  const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length) || 1
  const value = Number(tile.value)
  const z = (value - mean) / sd
  if (Math.abs(z) < THRESH) return null
  const pctVsMean = Math.round(((value - mean) / mean) * 100)
  return {
    z: +z.toFixed(1),
    dir: z > 0 ? 'up' : 'down',
    mean: +mean.toFixed(mean < 100 ? 0 : 0),
    value,
    pctVsMean,
    // severity: a "bad"-status KPI that spikes is bad; otherwise scale by z
    severity: tile.status === 'bad' ? 'bad' : Math.abs(z) > 5 ? 'bad' : 'warn',
    // templated narration (the LLM's job in production; a template here)
    text: `${tile.title} is ${value}${tile.unit || ''} — ${z > 0 ? 'well above' : 'well below'} its recent range (avg ${Math.round(mean)}${tile.unit || ''}). That's ${Math.abs(z).toFixed(1)}× the normal week-to-week swing.`,
    how: `z-score over the last ${h.length} periods: (value − mean) ÷ std-dev = (${value} − ${mean.toFixed(1)}) ÷ ${sd.toFixed(1)} = ${z.toFixed(1)}. Flagged because |z| ≥ ${THRESH}.`,
    history: h,
  }
}

export function anomalies(board) {
  return board.tiles.map((t) => ({ tile: t, anomaly: anomalyFor(t) })).filter((x) => x.anomaly)
}

// ---------------------------------------------------------------------------
// Role-aware ranking — the heart of "for your role".
// Each fact type is weighted differently per persona; a technician cares most
// about imminent breaches, an exec about trend deltas.
// ---------------------------------------------------------------------------
export const ROLE_WEIGHTS = {
  technician: { breach: 1.4, anomaly: 1.1, delta: 0.8, backlog: 0.7 },
  manager: { breach: 1.0, anomaly: 1.2, delta: 1.1, backlog: 1.1 },
  exec: { breach: 0.7, anomaly: 1.0, delta: 1.4, backlog: 1.2 },
}
export const ROLES = [
  { key: 'technician', label: 'L1/L2 Technician' },
  { key: 'manager', label: 'Service-desk Manager' },
  { key: 'exec', label: 'Executive' },
]
const SEV = { bad: 3, warn: 2, good: 1 }

// ---------------------------------------------------------------------------
// Facts — everything worth surfacing, computed deterministically from the board.
// ---------------------------------------------------------------------------
export function facts(board, role = 'technician') {
  const out = []

  // 1. Breach imminence — from the P1 worklist (records due Today).
  const wl = board.tiles.find((t) => t.type === 'shortcut')
  if (wl) {
    const dueIdx = wl.columns.indexOf('Due')
    const prIdx = wl.columns.indexOf('Priority')
    const due = wl.rows.filter((r) => /today/i.test(r[dueIdx] || '') && /p1/i.test(r[prIdx] || ''))
    if (due.length) {
      out.push({
        id: 'breach', kind: 'breach', tileId: wl.id, severity: 'bad',
        text: `${due.length} P1 request${due.length > 1 ? 's' : ''} breach SLA today`,
        chip: 'My Open P1 Requests', base: 100,
        how: `Count of rows in “${wl.title}” where Priority = P1 and Due is today (${due.length} of ${wl.rows.length}).`,
      })
    }
  }

  // 2. Anomalies — a spiking/dropping KPI vs its own history.
  for (const { tile, anomaly } of anomalies(board)) {
    out.push({
      id: 'anom-' + (tile.metric || tile.id), kind: 'anomaly', tileId: tile.id, severity: anomaly.severity,
      text: `${tile.title} spiked to ${anomaly.value}${tile.unit || ''} — ${anomaly.pctVsMean > 0 ? '+' : ''}${anomaly.pctVsMean}% vs its ${anomaly.mean}${tile.unit || ''} average`,
      chip: tile.title, base: 80, how: anomaly.how,
    })
  }

  // 3. Notable week-over-week deltas (warn/bad KPIs not already an anomaly).
  for (const t of board.tiles.filter((t) => t.type === 'kpi' && t.delta)) {
    if (out.some((f) => f.tileId === t.id)) continue
    if (t.status === 'good') continue
    out.push({
      id: 'delta-' + (t.metric || t.id), kind: 'delta', tileId: t.id, severity: t.status === 'bad' ? 'bad' : 'warn',
      text: `${t.title} ${t.delta.dir === 'up' ? 'up' : 'down'} ${t.delta.pct}% week-over-week`,
      chip: t.title, base: 50,
      how: `Change vs the prior window for “${t.title}”: ${t.delta.dir === 'up' ? '+' : '−'}${t.delta.pct}%.`,
    })
  }

  // score & rank by role
  const W = ROLE_WEIGHTS[role] || ROLE_WEIGHTS.technician
  out.forEach((f) => { f.score = f.base * (W[f.kind] || 1) * SEV[f.severity] })
  return out.sort((a, b) => b.score - a.score)
}

// Confidence is deterministic (data completeness), NOT model-derived.
export function confidence(board) {
  const kpis = board.tiles.filter((t) => t.type === 'kpi')
  const withHist = kpis.filter((t) => Array.isArray(t.history) && t.history.length >= 4).length
  const ratio = kpis.length ? withHist / kpis.length : 0
  return ratio >= 0.75 ? 'high' : ratio >= 0.4 ? 'medium' : 'low'
}

// A stable "updated N min ago" without Date.now() (blocked in some contexts); the
// showcase is a demo, so a fixed freshness label reads honestly enough.
export const FRESHNESS = 'just now'

// ---------------------------------------------------------------------------
// dashboardNarrative — a WRITTEN, plain-language summary of the dashboard (what it is,
// what it shows, how it reads right now) — prose, not a list of ticket facts.
// ---------------------------------------------------------------------------
export function dashboardNarrative(board, role = 'technician') {
  const t = board.tiles || []
  const kpis = t.filter((x) => x.type === 'kpi')
  const charts = t.filter((x) => x.type === 'chart')
  const shorts = t.filter((x) => x.type === 'shortcut')
  const names = (arr, n = 3) => {
    const s = arr.map((x) => x.title).slice(0, n)
    const extra = arr.length - s.length
    return s.join(', ') + (extra > 0 ? ` and ${extra} more` : '')
  }
  const lens = role === 'exec' ? 'a leadership' : role === 'manager' ? 'a team' : 'a day-to-day'
  const parts = [
    `“${board.name}” is ${lens} view of your service desk, built from ${kpis.length} headline KPIs, ${charts.length} charts and ${shorts.length} record ${shorts.length === 1 ? 'list' : 'lists'}.`,
  ]
  if (kpis.length) parts.push(`The KPIs track ${names(kpis)}, giving you the current state at a glance.`)
  if (charts.length) parts.push(`The charts trend it over time — ${names(charts, 2)} — and the ${shorts.length ? `worklist (${names(shorts, 1)})` : 'lists'} surfaces the individual records that need a technician’s hands.`)
  const fs = facts(board, role)
  const bad = fs.filter((f) => f.severity === 'bad').length
  parts.push(fs.length
    ? `Overall it’s reading as ${bad ? 'needs-attention' : 'slightly stretched'} right now, with the most pressure on SLA and overdue work — a good place to start.`
    : 'Overall everything is sitting within its normal range right now, so there’s no immediate action to take.')
  return parts.join(' ')
}

// dashboardSummaryPoints — the written summary as grouped, relatable bullet points
// (the ClickUp-Brain style): "what this covers" + "how it reads right now".
export function dashboardSummaryPoints(board, role = 'technician') {
  const t = board.tiles || []
  // A board the user just created has nothing to describe yet — say that plainly
  // rather than inventing a reading of widgets that don't exist.
  if (!t.length) return [
    { title: 'What this dashboard covers', points: [`“${board.name}” has no widgets yet — there’s nothing for me to read.`] },
    { title: 'What to do next', points: ['Add a widget and I’ll summarise what it shows, flag anything unusual, and track how it moves.'] },
  ]
  const kpis = t.filter((x) => x.type === 'kpi')
  const charts = t.filter((x) => x.type === 'chart')
  const shorts = t.filter((x) => x.type === 'shortcut')
  const names = (arr, n = 3) => {
    const s = arr.map((x) => x.title).slice(0, n)
    const e = arr.length - s.length
    return s.join(', ') + (e > 0 ? ` and ${e} more` : '')
  }
  const fs = facts(board, role)
  const bad = fs.filter((f) => f.severity === 'bad')
  const warn = fs.filter((f) => f.severity === 'warn')
  const covers = [
    kpis.length && `${kpis.length} headline KPIs — ${names(kpis)}`,
    charts.length && `${charts.length} charts trending ${names(charts, 2)}`,
    shorts.length && `A worklist: ${names(shorts, 1)}`,
  ].filter(Boolean)
  const state = []
  if (bad.length) state.push(`${bad.length} thing${bad.length > 1 ? 's' : ''} need action now — top of the list is ${bad[0].chip}`)
  if (warn.length) state.push(`${warn.length} more worth watching: ${warn.map((f) => f.chip).slice(0, 2).join(', ')}`)
  if (!fs.length) state.push('Everything is within its normal range')
  state.push(bad.length ? 'Most of the pressure is on SLA and overdue work' : 'Overall the board is steady')
  return [
    { title: 'What this dashboard covers', points: covers },
    { title: 'How it reads right now', points: state },
  ]
}

// ---------------------------------------------------------------------------
// widgetBrief — a tiny grounded summary + two type-specific suggestive actions for a
// single tile, shown on hover of its AI sparkle. Works on any real tile (KPI / chart /
// shortcut), degrading gracefully when history/delta aren't present.
// ---------------------------------------------------------------------------
export function widgetBrief(tile) {
  const t = tile || {}
  const u = t.unit || ''
  if (t.type === 'kpi') {
    const a = anomalyFor(t)
    const wow = t.delta ? ` and is ${t.delta.dir} ${t.delta.pct}% week-over-week` : ''
    const parts = [`${t.title} is ${t.value}${u}${wow}.`]
    if (a) parts.push(`That's ${a.pctVsMean > 0 ? 'well above' : 'well below'} its usual ~${a.mean}${u} (${a.pctVsMean > 0 ? '+' : ''}${a.pctVsMean}%) — a clear outlier, roughly ${Math.abs(a.z)}× the normal week-to-week swing, so it's worth a look now.`)
    else if (t.status === 'bad') parts.push(`It's flagged as needing attention, so it's the kind of number to act on rather than watch.`)
    else if (t.status === 'warn') parts.push(`It's sitting just outside the comfortable range — not alarming yet, but worth keeping an eye on.`)
    else if (t.delta) parts.push(`That keeps it within its normal range, so nothing here needs action right now.`)
    return { summary: parts.join(' '), actions: [
      { label: 'Deep dive', intent: 'drill', text: `Show the records behind ${t.title}` },
      { label: 'What needs attention', intent: 'explain', text: `What needs attention in ${t.title}?` },
    ] }
  }
  if (t.type === 'shortcut') {
    const rows = t.rows || []
    const cols = t.columns || []
    const prIdx = cols.indexOf('Priority')
    const stIdx = cols.indexOf('Status')
    const p1 = prIdx >= 0 ? rows.filter((r) => /p1|urgent/i.test(r[prIdx] || '')).length : 0
    const open = stIdx >= 0 ? rows.filter((r) => /open|new/i.test(r[stIdx] || '')).length : 0
    const parts = [`This list holds ${rows.length} record${rows.length === 1 ? '' : 's'}.`]
    if (p1) parts.push(`${p1} ${p1 === 1 ? 'is' : 'are'} top-priority${open ? ` and ${open} still ${open === 1 ? 'sits' : 'sit'} unactioned` : ''}, so the highest-priority work is already at the top.`)
    else if (open) parts.push(`${open} ${open === 1 ? 'is' : 'are'} still open, sorted with the most recent first.`)
    else parts.push('Everything here is in hand — nothing is flagged as urgent.')
    return { summary: parts.join(' '), actions: [
      { label: 'Deep dive', intent: 'drill', text: `Prioritize ${t.title}` },
      { label: 'What needs attention', intent: 'explain', text: `What needs attention in ${t.title}?` },
    ] }
  }
  // chart — a WRITTEN summary of the shape of the data, not a copy of the legend.
  // Additional PMG-ACT-01 kinds carry a chartSpec instead of labels/series; the
  // {labels,series}-shaped ones recompute from the engine so the summary is real.
  const ch = t.chart || {}
  const derived = ch.spec ? chartData(ch.spec) : null
  const series = ch.series || derived?.series || []
  const labels = ch.labels || derived?.labels || []
  const summary = chartSummary(ch, series, labels)
  return { summary, actions: [
    { label: 'Deep dive', intent: 'drill', text: `Break down ${t.title} by category` },
    { label: 'What needs attention', intent: 'explain', text: `What needs attention in ${t.title}?` },
  ] }
}

/* boardWidgetDigest — every widget on the board read in one pass.
 *
 * The summary CARD has room for an overview only, so the widget-by-widget detail lives
 * here and is asked for explicitly. Each entry carries the tile's own headline reading
 * (the number, the shape of the chart, the makeup of the list) plus its status, so the
 * panel can render the whole board without the user opening fifteen hover cards. */
export function boardWidgetDigest(board) {
  const tiles = board?.tiles || []
  return tiles.map((t) => {
    const brief = widgetBrief(t)
    const a = t.type === 'kpi' ? anomalyFor(t) : null
    return {
      id: t.id,
      title: t.title,
      kind: t.type === 'kpi' ? 'KPI' : t.type === 'shortcut' ? 'Record list' : `${t.chart?.kind || 'chart'} chart`,
      // the one number/phrase that IS the widget, shown beside its name
      headline: t.type === 'kpi'
        ? `${t.value}${t.unit || ''}${t.delta ? ` · ${t.delta.dir === 'up' ? '▲' : '▼'} ${t.delta.pct}%` : ''}`
        : t.type === 'shortcut'
          ? `${(t.rows || []).length} record${(t.rows || []).length === 1 ? '' : 's'}`
          : `${(t.chart?.labels || []).length} categories`,
      summary: brief.summary,
      status: a ? 'bad' : (t.status || 'info'),
    }
  })
}

// chartSummary — turn a chart's numbers into 2–3 plain-language sentences (leader + share +
// concentration for part-to-whole; trend + peak for time series; the gap for multi-series).
function chartSummary(ch, series, labels) {
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString()
  // part-to-whole (pie / donut): who leads, by how much, and how concentrated it is
  if (['pie', 'donut', 'funnel', 'pyramid'].includes(ch.kind)) {
    const vals = series[0]?.values || []
    const total = vals.reduce((a, b) => a + b, 0)
    if (!total) return 'No data in range for this breakdown yet.'
    const idx = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a])
    const pct = (i) => Math.round((vals[i] / total) * 100)
    const lead = idx[0], second = idx[1]
    const topK = Math.min(3, idx.length)
    const cum = idx.slice(0, topK).reduce((s, i) => s + vals[i], 0)
    const cumPct = Math.round((cum / total) * 100)
    const parts = [`${labels[lead] || 'The top category'} leads at ${pct(lead)}% (${fmt(vals[lead])} of ${fmt(total)})${second != null && vals[second] ? `, with ${labels[second]} next at ${pct(second)}%` : ''}.`]
    if (idx.length > 3) parts.push(`The top ${topK} of ${idx.length} account for ${cumPct}% — ${cumPct >= 75 ? 'the rest is a long, thin tail' : 'the spread is fairly even'}.`)
    return parts.join(' ')
  }
  // multi-series bar/line: contrast the two series by total, and name the widest gap
  if (series.length >= 2) {
    const tot = (s) => (s.values || []).reduce((a, b) => a + b, 0)
    const a = series[0], b = series[1]
    const ta = tot(a), tb = tot(b)
    const hi = ta >= tb ? a : b, lo = ta >= tb ? b : a
    const diffPct = tb + ta ? Math.round((Math.abs(ta - tb) / Math.max(ta, tb)) * 100) : 0
    let gapAt = 0, gapVal = -1
    labels.forEach((_, i) => { const g = Math.abs((a.values?.[i] || 0) - (b.values?.[i] || 0)); if (g > gapVal) { gapVal = g; gapAt = i } })
    const parts = [`Across ${labels.length} points, ${hi.name} runs ${diffPct}% ${diffPct ? 'ahead of' : 'level with'} ${lo.name} overall.`]
    if (gapVal > 0 && labels[gapAt]) parts.push(`The gap is widest at ${labels[gapAt]} (${fmt(a.values?.[gapAt] || 0)} vs ${fmt(b.values?.[gapAt] || 0)}).`)
    if (series.length > 2) parts.push(`${series.length} series in all.`)
    return parts.join(' ')
  }
  // single series
  const s = series[0]
  if (!s) return 'No data in range for this widget yet.'
  const v = s.values || []
  const total = v.reduce((a, b) => a + b, 0)
  if (!total) return 'No data in range for this widget yet.'
  const maxI = v.indexOf(Math.max(...v))
  // categorical bars → leader + concentration; time-like line/area → trend + peak
  const temporal = ['line', 'area'].includes(ch.kind)
  if (temporal) {
    const first = v[0], last = v[v.length - 1]
    const dir = last > first ? 'risen' : last < first ? 'fallen' : 'held flat'
    const chg = first ? Math.round(((last - first) / first) * 100) : 0
    return `${s.name} has ${dir}${dir !== 'held flat' ? ` ${Math.abs(chg)}%` : ''} over ${v.length} points, from ${fmt(first)} to ${fmt(last)}, peaking at ${fmt(v[maxI])}${labels[maxI] ? ` (${labels[maxI]})` : ''}.`
  }
  const topPct = Math.round((v[maxI] / total) * 100)
  const nonZero = v.filter((x) => x > 0).length
  return `${labels[maxI] || 'The top category'} is highest at ${fmt(v[maxI])} (${topPct}% of ${fmt(total)}) across ${labels.length} categories${nonZero < labels.length ? `, though only ${nonZero} have any activity` : ''}.`
}

// Detect a semantic dimension from a chart's labels, so the explanation can REASON
// about it (priority breaches fastest, status = working backlog), not just recite %.
function semanticKind(labels) {
  const s = labels.map((l) => String(l).toLowerCase())
  if (s.some((l) => /\b(urgent|high|medium|low)\b|\bp[1-4]\b/.test(l))) return 'priority'
  if (s.some((l) => /open|in progress|pending|resolved|closed|on hold|new/.test(l))) return 'status'
  return null
}

// ---------------------------------------------------------------------------
// explainTile — the deep, reasoned answer for ANY widget (KPI / chart / shortcut).
// Returns { tile, anomaly, lines[] }: a few grounded sentences that state the number,
// break down the shape of the data, and REASON about what it means — the substance
// behind "Explain …". Everything is computed here; a language model would only rephrase.
// ---------------------------------------------------------------------------
export function explainTile(tile) {
  const t = tile || {}
  const u = t.unit || ''
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString()
  const out = []

  // ---- KPI ----
  if (t.type === 'kpi') {
    const a = anomalyFor(t)
    const wow = t.delta ? `, ${t.delta.dir === 'up' ? 'up' : t.delta.dir === 'down' ? 'down' : 'flat'} ${t.delta.pct}% vs last week` : ''
    out.push(`${t.title} is currently ${t.value}${u}${wow}.`)
    if (a) {
      out.push(`That's ${a.pctVsMean > 0 ? 'well above' : 'well below'} its usual ~${a.mean}${u} — a ${a.pctVsMean > 0 ? '+' : ''}${a.pctVsMean}% deviation.`)
      out.push(`Reasoning: across the last ${(t.history || []).length} periods it moved around ${a.mean}${u}; ${t.value}${u} is about ${Math.abs(a.z)}× the normal week-to-week swing, which is why it reads as a real anomaly and not routine noise.`)
      out.push(t.status === 'bad' ? 'Given its status, act on this now — start with the records behind it.' : 'Worth a look to confirm it isn’t the start of a trend.')
    } else if (Array.isArray(t.history) && t.history.length >= 4) {
      const mean = Math.round(t.history.reduce((s, x) => s + x, 0) / t.history.length)
      out.push(`Its recent baseline is about ${mean}${u}, so ${t.value}${u} sits inside the normal week-to-week range — no anomaly here.`)
      out.push(t.status === 'bad' ? 'It’s still flagged for attention, so keep it on your radar even though the movement itself is routine.' : t.status === 'warn' ? 'It’s in a watch state — close to the edge, but nothing is breaking pattern.' : 'Nothing here needs action right now.')
    } else {
      out.push(t.status === 'bad' ? 'It’s flagged as needing attention — this is one to act on rather than watch.' : t.status === 'warn' ? 'It’s in a watch state; keep an eye on it.' : 'It’s reading healthy.')
    }
    if (t.info) out.push(`For context, this counts ${String(t.info).replace(/\.$/, '').replace(/^[A-Z]/, (c) => c.toLowerCase())}.`)
    return { tile: t, anomaly: a, lines: out }
  }

  // ---- SHORTCUT (record list) ----
  if (t.type === 'shortcut') {
    const rows = t.rows || [], cols = t.columns || []
    const prIdx = cols.indexOf('Priority'), stIdx = cols.indexOf('Status')
    out.push(`${t.title} lists ${rows.length} record${rows.length === 1 ? '' : 's'} right now.`)
    if (prIdx >= 0) {
      const byPr = {}
      rows.forEach((r) => { const p = (r[prIdx] || '').trim(); if (p) byPr[p] = (byPr[p] || 0) + 1 })
      const top = Object.entries(byPr).sort((a, b) => b[1] - a[1])
      if (top.length) out.push(`By priority: ${top.map(([k, v]) => `${v} ${k}`).join(', ')}.`)
      const urgent = rows.filter((r) => /p1|urgent/i.test(r[prIdx] || '')).length
      if (urgent) out.push(`Reasoning: the ${urgent} highest-priority item${urgent === 1 ? '' : 's'} ${urgent === 1 ? 'is' : 'are'} what to clear first — they carry the tightest SLAs.`)
    }
    if (stIdx >= 0) {
      const open = rows.filter((r) => /^open$|new/i.test((r[stIdx] || '').trim())).length
      const prog = rows.filter((r) => /in progress|active/i.test(r[stIdx] || '')).length
      if (open || prog) out.push(`${prog} already in progress, ${open} not yet started.`)
    }
    return { tile: t, anomaly: null, lines: out }
  }

  // ---- CHART ----
  const ch = t.chart || {}
  const series = ch.series || [], labels = ch.labels || []
  const sem = semanticKind(labels)

  // part-to-whole (pie / donut / funnel)
  if (['pie', 'donut', 'funnel', 'pyramid'].includes(ch.kind)) {
    const vals = series[0]?.values || []
    const total = vals.reduce((a, b) => a + b, 0)
    if (!total) { out.push(`${t.title} has no data in the current range.`); return { tile: t, anomaly: null, lines: out } }
    const idx = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a])
    const pct = (i) => Math.round((vals[i] / total) * 100)
    const lead = idx[0], second = idx[1], last = idx[idx.length - 1]
    out.push(`${t.title} splits ${fmt(total)} across ${idx.length} ${sem === 'priority' ? 'priorities' : sem === 'status' ? 'statuses' : 'categories'}.`)
    out.push(`${labels[lead]} leads at ${pct(lead)}% (${fmt(vals[lead])})${second != null && vals[second] ? `, then ${labels[second]} at ${pct(second)}%` : ''}; the smallest is ${labels[last]} at ${pct(last)}%.`)
    const topK = Math.min(3, idx.length)
    const cumPct = Math.round((idx.slice(0, topK).reduce((s, i) => s + vals[i], 0) / total) * 100)
    if (idx.length > 3) out.push(`The top ${topK} account for ${cumPct}% — ${cumPct >= 75 ? 'so a handful of categories drive the whole picture' : 'the load is fairly evenly spread'}.`)
    if (sem === 'priority') {
      const hi = labels.map((l, i) => ({ l: String(l).toLowerCase(), i })).filter((x) => /urgent|high|p1|p2/.test(x.l))
      const hiPct = Math.round((hi.reduce((s, x) => s + vals[x.i], 0) / total) * 100)
      out.push(`Reasoning: ${hiPct}% sits in the higher priorities (${hi.map((x) => labels[x.i]).join(' + ') || 'none'}). ${hiPct <= 25 ? 'That’s a healthy shape — most volume is low-priority, and the higher-priority slice is the one to watch since it breaches fastest.' : 'That’s a heavier high-priority load than ideal, so expect SLA pressure.'}`)
    } else if (sem === 'status') {
      const openish = labels.map((l, i) => ({ l: String(l).toLowerCase(), i })).filter((x) => /open|in progress|pending|new/.test(x.l))
      const openPct = Math.round((openish.reduce((s, x) => s + vals[x.i], 0) / total) * 100)
      out.push(`Reasoning: ${openPct}% is still in flight (${openish.map((x) => labels[x.i]).join(', ')}) — that’s the live backlog, versus the resolved/closed share that’s already cleared.`)
    }
    return { tile: t, anomaly: null, lines: out }
  }

  // multi-series bar/line
  if (series.length >= 2) {
    const tot = (s) => (s.values || []).reduce((a, b) => a + b, 0)
    const sorted = [...series].sort((a, b) => tot(b) - tot(a))
    const hi = sorted[0], lo = sorted[sorted.length - 1]
    out.push(`${t.title} compares ${series.length} series across ${labels.length} points.`)
    out.push(`${hi.name} carries the most overall (${fmt(tot(hi))}); ${lo.name} the least (${fmt(tot(lo))}).`)
    let gapAt = 0, gapVal = -1
    labels.forEach((_, i) => { const g = Math.abs((series[0].values?.[i] || 0) - (series[1].values?.[i] || 0)); if (g > gapVal) { gapVal = g; gapAt = i } })
    if (gapVal > 0 && labels[gapAt]) out.push(`Reasoning: the series pull apart the most at ${labels[gapAt]} — that’s where the difference is worth a look.`)
    return { tile: t, anomaly: null, lines: out }
  }

  // single-series
  const s = series[0]
  if (!s || !(s.values || []).some((v) => v)) { out.push(`${t.title} has no data in the current range.`); return { tile: t, anomaly: null, lines: out } }
  const v = s.values, total = v.reduce((a, b) => a + b, 0)
  const maxI = v.indexOf(Math.max(...v))
  if (['line', 'area'].includes(ch.kind)) {
    const first = v[0], lastv = v[v.length - 1]
    const dir = lastv > first ? 'risen' : lastv < first ? 'fallen' : 'held flat'
    const chg = first ? Math.round(((lastv - first) / first) * 100) : 0
    out.push(`${t.title}: ${s.name} has ${dir}${dir !== 'held flat' ? ` ${Math.abs(chg)}%` : ''} over ${v.length} points, from ${fmt(first)} to ${fmt(lastv)}, peaking at ${fmt(v[maxI])}${labels[maxI] ? ` (${labels[maxI]})` : ''}.`)
    out.push(`Reasoning: ${dir === 'risen' ? 'the upward slope means volume is building — worth getting ahead of.' : dir === 'fallen' ? 'the downward slope means it’s easing off.' : 'it’s stable, so there’s no trend to chase.'}`)
    return { tile: t, anomaly: null, lines: out }
  }
  const topPct = Math.round((v[maxI] / total) * 100)
  const nonZero = v.filter((x) => x > 0).length
  out.push(`${t.title}: ${labels[maxI]} is highest at ${fmt(v[maxI])} (${topPct}% of ${fmt(total)}) across ${labels.length} categories.`)
  if (nonZero < labels.length) out.push(`Only ${nonZero} of ${labels.length} categories have any activity in this range.`)
  out.push(`Reasoning: ${topPct >= 40 ? `${labels[maxI]} dominates, so it’s the main driver here.` : 'the load is spread across several categories rather than concentrated in one.'}`)
  return { tile: t, anomaly: null, lines: out }
}

/* ---------------------------------------------------------------------------
 * Answers for the follow-ups that used to be routed at a generic summary. Each
 * one answers ITS OWN question, grounded in the same computed facts.
 * ------------------------------------------------------------------------- */

// "Draft a status update" — a copy-ready update, not a list of metrics
export function statusUpdate(board, role = 'technician') {
  const fs = facts(board, role)
  const bad = fs.filter((f) => f.severity === 'bad')
  const warn = fs.filter((f) => f.severity === 'warn')
  const wl = board.tiles.find((t) => t.type === 'shortcut')
  const head = bad[0] || warn[0] || null
  const subject = head
    ? `${board.name} — ${bad.length ? `${bad.length} item${bad.length > 1 ? 's' : ''} needing attention` : 'a few things to watch'}`
    : `${board.name} — all clear`
  const body = []
  body.push(head
    ? `Where we are: ${head.text}.${bad.length > 1 ? ` ${bad.length - 1} other item${bad.length > 2 ? 's are' : ' is'} also outside its normal range.` : ''}`
    : `Where we are: every widget on “${board.name}” is reading within its normal range.`)
  if (warn.length) body.push(`Also watching: ${warn.slice(0, 2).map((f) => f.chip).join(' and ')}.`)
  if (wl) {
    const prIdx = (wl.columns || []).indexOf('Priority')
    const p1 = prIdx >= 0 ? (wl.rows || []).filter((r) => /p1|urgent/i.test(r[prIdx] || '')).length : 0
    body.push(`Work in hand: ${(wl.rows || []).length} record${(wl.rows || []).length === 1 ? '' : 's'} on “${wl.title}”${p1 ? `, ${p1} at top priority` : ''}.`)
  }
  body.push(head
    ? 'What happens next: the highest-priority items are being picked up first, and anything still unowned gets escalated.'
    : 'What happens next: nothing needed right now — I’ll flag anything that breaks out of range.')
  body.push('Next update: end of shift, or sooner if something breaches.')
  return { subject, body }
}

// "Turn this into a recovery plan" — ordered steps, each with the reason it's there
export function recoveryPlan(board, role = 'technician') {
  const fs = facts(board, role)
  const steps = []
  const breach = fs.find((f) => f.kind === 'breach')
  const anom = fs.find((f) => f.kind === 'anomaly')
  const unassigned = board.tiles.find((t) => t.type === 'kpi' && /unassigned/i.test(t.title || ''))
  if (breach) steps.push({ title: 'Clear what breaches today', body: `${breach.text}. Give each one an owner and a committed fix time before starting anything else — these are the only items with a deadline today.` })
  if (anom) steps.push({ title: `Work out what moved ${anom.chip}`, body: `${anom.text} Confirm whether that's genuine demand or a routing change; adding capacity to a routing problem just moves the queue.` })
  if (unassigned && Number(unassigned.value) > 0) steps.push({ title: 'Get everything owned', body: `${unassigned.value} items still have no assignee. Nothing recovers while work is unowned, so assign before you re-prioritise.` })
  const rest = fs.filter((f) => f.kind === 'delta').slice(0, 1)
  if (rest.length) steps.push({ title: `Stop ${rest[0].chip} drifting`, body: `${rest[0].text}. It isn't urgent today, but left alone it becomes next week's breach list.` })
  steps.push({ title: 'Re-check in two hours', body: 'Come back to this board. If the counters haven’t moved, escalate rather than keep waiting — a flat recovery curve is the signal to ask for help.' })
  const intro = fs.length
    ? `Here's how I'd work “${board.name}” back to green, hardest deadline first:`
    : `“${board.name}” is already within range — there's nothing to recover, so this is just how I'd keep it there:`
  return { intro, steps }
}

// "What should I work on first?" — a ranked queue, with why each sits where it does
export function workOrder(board, role = 'technician') {
  return facts(board, role).slice(0, 5).map((f, i) => ({
    rank: i + 1, text: f.text, chip: f.chip, severity: f.severity, tileId: f.tileId,
    why: f.kind === 'breach' ? 'Tightest deadline — these are the ones that breach first.'
      : f.kind === 'anomaly' ? 'Broke out of its normal range, so this isn’t routine load.'
        : 'Moving the wrong way week-over-week.',
  }))
}

// ---------------------------------------------------------------------------
// "What changed since your last visit" — grounded in each KPI's own delta + status,
// plus a worklist change. A fixed last-visit label keeps the demo honest without a clock.
// This is the ITSM flow: a technician returning to their board sees, at a glance, which
// metrics moved and which need action — no re-scanning every widget.
// ---------------------------------------------------------------------------
export function changesSinceLastVisit(board) {
  const items = board.tiles
    .filter((t) => t.type === 'kpi' && t.delta)
    .map((t) => ({
      widget: t.title,
      dir: t.delta.dir,
      delta: `${t.delta.dir === 'up' ? '+' : t.delta.dir === 'down' ? '−' : ''}${t.delta.pct}%`,
      value: `${t.value}${t.unit || ''}`,
      severity: t.status,                       // good | warn | bad
      note: t.status === 'bad'
        ? `${t.title} broke out of its normal range while you were away`
        : '',
    }))
  // the worklist gained new records — the thing a technician most needs to know
  const wl = board.tiles.find((t) => t.type === 'shortcut')
  if (wl) items.push({
    widget: wl.title, dir: 'up', delta: '+4 new', value: `${wl.rows.length} open`,
    severity: 'bad', note: '4 new P1 requests were assigned to you since your last visit',
  })
  // A new or freshly-built board has no earlier snapshot — report that honestly
  // instead of rendering an empty diff.
  if (!items.length) {
    const n = (board.tiles || []).length
    items.push({
      widget: board.name, dir: 'up', delta: n ? 'new' : '—',
      value: n ? `${n} widget${n === 1 ? '' : 's'}` : 'empty',
      severity: 'good',
      note: n
        ? 'This board is new, so there’s no earlier snapshot to compare against yet. I’ll start tracking movement from here.'
        : 'Nothing to compare yet — add a widget and I’ll track how it moves.',
    })
    return { lastVisit: 'no earlier snapshot', items }
  }
  // rank so the things that need action lead
  const rank = { bad: 0, warn: 1, good: 2 }
  items.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3))
  return { lastVisit: '2 days ago · Mon, 18 Jul at 9:12 AM', items }
}

// ---------------------------------------------------------------------------
// Deep-dive (P2-A). Given a fact, derive: editable scope chips, the record set
// behind it, and 1–3 next-best-actions. The "3-tier honest drill" — because most
// tiles have no per-record rows in mock, we degrade gracefully:
//   tier 1  records      → the fact maps to a worklist; show its filtered rows
//   tier 2  sibling rows → a KPI has no rows; show the related worklist + a note
//   tier 3  scoped chart → nothing to list; scope the chart (not needed in demo)
// ---------------------------------------------------------------------------
export function applyChips(rows, columns, chips) {
  return rows.filter((r) => chips.every((c) => {
    const idx = columns.indexOf(c.field)
    if (idx < 0) return true                 // chip isn't a table column (e.g. Metric) → informational only
    const cell = String(r[idx]).toLowerCase()
    return cell.includes(String(c.value).toLowerCase())
  }))
}

// Record/drill-level next-best-actions (catalog section C). The last two — find-similar
// and suggest-KB — are the ticket-level actions that used to sit (wrongly) on the
// dashboard card; they belong HERE, once you've drilled into the records.
const RESOLVE_ACTIONS = [
  { id: 'similar', icon: 'copy', label: 'Find similar tickets', confirm: 'Pull resolved look-alikes and the fixes that worked?', danger: false },
  { id: 'kb', icon: 'file-text', label: 'Suggest resolution / KB', confirm: 'Surface the likely root cause and steps from resolved tickets?', danger: false },
]
function actionsFor(fact) {
  if (fact.kind === 'breach') return [
    { id: 'reassign', icon: 'team', label: 'Reassign stalled P1s to on-call', confirm: 'Reassign the stalled P1 requests to the on-call technician?' },
    { id: 'escalate', icon: 'trend', label: 'Escalate all to Major Incident', confirm: 'Escalate these P1 requests to the Major Incident process?' },
    { id: 'notify', icon: 'mail', label: 'Notify affected stakeholders', confirm: 'Send a status note to the affected stakeholders?', danger: false },
    ...RESOLVE_ACTIONS,
  ]
  if (fact.kind === 'anomaly') return [
    { id: 'problem', icon: 'alert', label: 'Open a problem record for the spike', confirm: 'Open a problem record to investigate this spike?' },
    { id: 'escalate', icon: 'trend', label: 'Escalate to the shift lead', confirm: 'Escalate this anomaly to the current shift lead?' },
    { id: 'snooze', icon: 'clock', label: 'Snooze this anomaly for 24h', confirm: 'Snooze this anomaly alert for 24 hours?', danger: false },
    ...RESOLVE_ACTIONS,
  ]
  return [
    { id: 'review', icon: 'eye', label: 'Review in the source module', confirm: 'Open this insight in its source module?', danger: false },
    ...RESOLVE_ACTIONS,
  ]
}

// drillNarrative — the WRITTEN, plain-language answer for an "Investigate" (replaces the
// records table). Grounded: it counts the same rows the table would have shown and phrases
// them — how many, the priority/status split, which records are closest to breaching, and
// (for an anomaly) the z-score reasoning folded in. Degrades to a short line when a fact has
// no worklist behind it. Returns an array of sentences so the UI can render them as prose.
export function drillNarrative(board, fact) {
  const wl = board.tiles.find((t) => t.type === 'shortcut')
  const factTile = board.tiles.find((t) => t.id === fact.tileId)
  const out = []

  // Lead with the metric's OWN reasoning — so investigating a KPI or chart answers with
  // that widget's actual numbers, not only the worklist. (Skip when the fact IS a worklist.)
  if (factTile && factTile.type !== 'shortcut') {
    out.push(...explainTile(factTile).lines.slice(0, 2))
  } else if (fact.kind === 'anomaly') {
    const a = anomalyFor(factTile)
    if (a) out.push(a.text)
  }

  if (!wl) {
    if (!out.length) out.push('There is no record list behind this metric to open, so act on it from its source module.')
    return out
  }
  const relatedList = factTile && factTile.type !== 'shortcut'   // records come from a *related* list, not this tile
  const cols = wl.columns
  const iOf = (c) => cols.indexOf(c)
  const prIdx = iOf('Priority'), stIdx = iOf('Status'), dueIdx = iOf('Due'), subjIdx = iOf('Subject'), reqIdx = iOf('Requester')
  const rows = wl.rows

  // Scope the rows the same way the table would have (by fact kind).
  let scoped = rows
  if (fact.kind === 'breach') scoped = rows.filter((r) => /p1/i.test(r[prIdx] || ''))
  const dueToday = dueIdx >= 0 ? scoped.filter((r) => /today/i.test(r[dueIdx] || '')) : []
  const p1 = prIdx >= 0 ? scoped.filter((r) => /p1/i.test(r[prIdx] || '')).length : 0
  const inProg = stIdx >= 0 ? scoped.filter((r) => /in progress/i.test(r[stIdx] || '')).length : 0
  const open = stIdx >= 0 ? scoped.filter((r) => /^open$/i.test((r[stIdx] || '').trim())).length : 0

  // Sentence 1 — the shape of the record set.
  const lead = relatedList ? `The closest record list, “${wl.title}”, holds ${scoped.length} item${scoped.length === 1 ? '' : 's'}` : `${scoped.length} record${scoped.length === 1 ? '' : 's'} sit behind this in “${wl.title}”`
  const parts = [lead]
  if (p1) parts.push(`${p1} at P1`)
  if (dueToday.length) parts.push(`${dueToday.length} due today`)
  out.push(parts.join(', ') + '.')

  // Sentence 2 — name the ones closest to breaching (the actionable detail).
  const top = (dueToday.length ? dueToday : scoped).slice(0, 2).map((r) => {
    const s = subjIdx >= 0 ? r[subjIdx] : 'a request'
    const who = reqIdx >= 0 && r[reqIdx] ? ` (${r[reqIdx]})` : ''
    return `${s}${who}`
  })
  if (top.length) out.push(`${dueToday.length ? 'Closest to breach' : 'Top of the list'}: ${top.join(' and ')}.`)

  // Sentence 3 — the status split, so it reads like a briefing not a dump.
  if (inProg || open) {
    const bits = []
    if (inProg) bits.push(`${inProg} already in progress`)
    if (open) bits.push(`${open} still unactioned`)
    out.push(bits.join(', ') + ' — ' + (inProg >= open ? 'work is under way but not finished.' : 'most have not been picked up yet.'))
  }
  return out
}

export function drillFor(board, fact) {
  const wl = board.tiles.find((t) => t.type === 'shortcut')
  const columns = wl ? wl.columns : []
  const baseRows = wl ? wl.rows : []
  let chips = []
  let tier = 3
  let tierNote = ''

  if (fact.kind === 'breach') {
    chips = [
      { field: 'Priority', op: '=', value: 'P1', locked: true },
      { field: 'Status', op: 'is', value: 'Open' },
      { field: 'Due', op: '=', value: 'Today' },
    ]
    tier = 1
  } else if (fact.kind === 'anomaly') {
    chips = [
      { field: 'Metric', op: '=', value: fact.chip, locked: true },
      { field: 'Priority', op: '=', value: 'P1' },
    ]
    tier = 2
    tierNote = `“${fact.chip}” is a single number with no record list of its own — showing the related P1 worklist so you can act on it.`
  } else {
    chips = [{ field: 'Priority', op: '=', value: 'P1' }]
    tier = 2
    tierNote = 'Showing the related worklist for this insight.'
  }
  return { chips, baseRows, columns, tier, tierNote, actions: actionsFor(fact), sourceTitle: wl?.title || '' }
}

/* =====================================================================
 * The two universal CTAs — Deep dive · What needs attention
 * =====================================================================
 * The same pair at board level and widget level; only the scope changes.
 *
 * Both return STRUCTURE, not paragraphs:
 *
 *   deepDive… → { verdict, readings, drivers, meaning }
 *                a stated verdict, the numbers behind it, what is DRIVING it, and the
 *                one non-obvious consequence. The drivers and the meaning are the
 *                insight; the readings are only the receipts.
 *
 *   focus…    → { lead, items[], notes[] }
 *                each item carries WHY IT MATTERS and the STEPS to take. A signal with
 *                no step is not an item — it belongs in `notes`, which is the other half
 *                of the answer: what is already moving the right way (or is too small to
 *                act on), so nobody spends the morning on it.
 *
 * Restating a delta is not attention-worthy. "Unassigned down 6%" is a backlog measure
 * moving in the RIGHT direction — ranking it as a criticality is exactly the noise that
 * makes an AI panel feel like a threshold rule with a sparkle on it.
 */

const pctOf = (n, d) => (d ? Math.round((n / d) * 100) : 0)

/* Backlog-shaped measures are BAD when they rise and GOOD when they fall. Direction
 * alone is meaningless without knowing which kind of measure it is — that judgement is
 * the difference between an insight and a restated number. */
const BACKLOG_RE = /overdue|unassigned|open|backlog|breach|urgent|pending|due|aging|ageing|escalat/i
const isImprovement = (title, dir) => (BACKLOG_RE.test(title) ? dir === 'down' : dir === 'up')

/* A move smaller than this is not a finding. Ranking "Open Requests +4%" next to a
 * breach is what makes an attention list read as noise — the judgement about what is
 * NOT worth acting on is half the answer. */
const ACT_PCT = 5

/* What a metric IS decides both why it matters and what to do about it. Without this
 * every item gets the same sentence and the same advice, which is the tell that nothing
 * intelligent produced them. Order matters: "Urgent Open Requests" is urgent work, not
 * backlog volume. */
const METRIC_CLASSES = [
  { key: 'overdue', re: /overdue|past due|breach/i },
  { key: 'due', re: /due\b|24 ?h|next \d+ ?h/i },
  { key: 'urgent', re: /urgent|\bp1\b|critical/i },
  { key: 'unassigned', re: /unassigned|unowned|untriaged/i },
  { key: 'backlog', re: /open|backlog|pending|active/i },
]
const classOf = (title) => METRIC_CLASSES.find((m) => m.re.test(title || ''))?.key || 'generic'

/* why it matters + what to do, per metric class — both as PROSE. Putting the
 * recommendation on a button ("Rebalance the queue") reduces the advice to three words
 * and buries the reasoning that makes it worth taking. A next step the user cannot
 * evaluate is not an insight; the sentence has to carry why this step and not another. */
function adviceFor(cls, { n, pctMove, biggest }) {
  const lead = biggest ? `At +${pctMove}% this is the largest move on the board. ` : ''
  switch (cls) {
    case 'overdue': return {
      why: `${lead}All ${n} are already past their SLA date — each is a reportable miss whether or not it is resolved later. A rise here grows the miss count, not just the queue.`,
      next: `Work the oldest first rather than the newest: the miss is already booked on all ${n}, so the only thing still moving is how far past due each one gets. Put them with the on-call technician today, and if the same queue is back next week treat it as an intake problem rather than an effort one.`,
    }
    case 'due': return {
      why: `${lead}These ${n} have a deadline inside the current window. Untouched today they become tomorrow’s overdue number — this is the queue that feeds it.`,
      next: `Bring the ones closest to their due time to the front of today’s queue. This is the cheapest work on the board: every one cleared before end of day is an overdue request that never gets created, and none of them needs escalation to fix.`,
    }
    case 'urgent': return {
      why: `${lead}Urgent work consumes the capacity everything below it needs, so a rise here slows queues whose own numbers still look flat. ${n} in play right now.`,
      next: `Clear these before touching the wider backlog — while they are open they are taking technicians away from everything else, so the other queues will keep drifting no matter what is done to them directly. If ${n} is more than the shift can absorb, escalate to the shift lead for a second pair of hands rather than re-prioritising twice.`,
    }
    case 'unassigned': return {
      why: `${lead}Nobody owns these ${n}, so the SLA clock runs with no one watching them. This is the one backlog measure where the fix is routing, not capacity.`,
      next: `Auto-assign by skill group rather than round-robin — round-robin clears the number but sends work to people who then reassign it, which shows up as churn a week later. Adding people will not help here; the requests are not slow, they are unowned.`,
    }
    case 'backlog': return {
      why: `${lead}${n} in the queue and rising. Volume climbing while resolution stays flat means arrival is outpacing the desk — a capacity question rather than a queue that is misbehaving.`,
      next: `Compare arrival against resolution for the week before adding anyone. If arrival is flat and the queue still grows, the constraint is throughput and more staff will not move it; if arrival is up, the useful question is what changed upstream to send more work in.`,
    }
    default: return {
      why: `${lead}Now at ${n}. It has not broken its normal range, so this is a trend to confirm rather than an incident to handle.`,
      next: `Leave it one more cycle before acting. One week outside comfortable is a wobble; two consecutive weeks in the same direction is the point at which it is worth spending someone’s time on.`,
    }
  }
}

/* One shape for every chart tile, whatever era it came from.
 *
 * A legacy tile carries { labels, series } on `chart`; a PMG-ACT-01 tile carries a
 * `chart.spec` and computes from records.js. Without this both CTAs would silently read
 * an empty series for every new kind and answer "nothing stands out" about a chart that
 * plainly shows something — the same class of bug as the placed-tile "no data" state. */
function chartShape(tile) {
  const ch = tile?.chart || {}
  if (!ch.spec) return { kind: ch.kind, labels: ch.labels || [], series: ch.series || [] }
  const out = chartData(ch.spec) || {}
  const kind = ch.spec.kind
  if (kind === 'gauge') return { kind, gauge: out }
  if (kind === 'heatmap') return { kind, heat: out }
  if (kind === 'mapbubble') return { kind, map: out }
  // funnel returns cumulative stage values rather than a series
  if (kind === 'funnel') return { kind, labels: out.labels || [], series: [{ name: 'Records', values: out.values || [] }], shares: out.shares || [] }
  return { kind, labels: out.labels || [], series: out.series || [] }
}

/* Our gauge bands are FRACTIONS of max with a colour (records.js gaugeBands), and the
 * direction is already baked in by `higherIsBetter` — so the tone comes from the band’s
 * COLOUR, never from its index. Reading index 0 as "healthy" (as a bands-are-ordered
 * model would) inverts the verdict on every higher-is-better meter. */
const BAND_TONE = { '#1f9d63': 'good', '#d98a0b': 'warn', '#e0483d': 'bad' }
function gaugeRead(g) {
  const max = g?.max || 0
  const value = g?.value == null ? 0 : g.value
  const bands = g?.bands || []
  const hit = bands.find((b) => value <= b.to * max) || bands[bands.length - 1]
  const tone = BAND_TONE[hit?.color] || 'good'
  // the nearest edges that would change the reading — the only actionable numbers here
  const edges = bands.map((b) => Math.round(b.to * max * 10) / 10).filter((e) => e > 0 && e < max)
  const nextEdge = edges.filter((e) => e > value).sort((a, b) => a - b)[0]
  const prevEdge = edges.filter((e) => e < value).sort((a, b) => b - a)[0]
  return { value, max, unit: g?.unit || '', tone, nextEdge, prevEdge }
}

// ---- Deep dive -------------------------------------------------------------

export function deepDiveBoard(board, role = 'technician') {
  const tiles = board?.tiles || []
  if (!tiles.length) {
    return {
      verdict: { tone: 'good', headline: 'Nothing to read yet', sub: `“${board?.name}” has no widgets on it.` },
      readings: [], drivers: [], meaning: 'Add a widget and I’ll tell you what it says.',
    }
  }
  const fs = facts(board, role)
  const bad = fs.filter((f) => f.severity === 'bad')
  const warn = fs.filter((f) => f.severity === 'warn')
  const kpis = tiles.filter((t) => t.type === 'kpi')

  // --- verdict: state a position, don't describe the furniture
  const verdict = bad.length
    ? { tone: 'bad', headline: `${bad.length} thing${bad.length > 1 ? 's need' : ' needs'} action now`, sub: `Pressure is concentrated on ${bad.slice(0, 2).map((f) => `**${f.chip}**`).join(' and ')}${warn.length ? `, with ${warn.length} more worth watching` : ''}.` }
    : warn.length
      ? { tone: 'warn', headline: 'Stretched, but nothing is breaking', sub: `${warn.length} signal${warn.length > 1 ? 's are' : ' is'} outside comfortable range — none of them urgent.` }
      : { tone: 'good', headline: 'Steady across the board', sub: `All ${tiles.length} widgets are inside their normal range.` }

  // --- readings: the receipts, as scannable chips rather than a paragraph
  const readings = kpis.slice(0, 4).map((t) => ({
    label: t.title,
    value: `${t.value}${t.unit || ''}`,
    delta: t.delta ? `${t.delta.dir === 'up' ? '+' : '−'}${t.delta.pct}%` : '',
    dir: t.delta?.dir || '',
    severity: anomalyFor(t) ? 'bad' : (t.status === 'info' ? 'good' : t.status || 'good'),
  }))

  // --- drivers: what is actually causing the verdict
  const drivers = []
  const breach = fs.find((f) => f.kind === 'breach')
  if (breach) drivers.push({ title: breach.text, body: `${breach.how} These are the records that breach first if nothing moves today.` })

  fs.filter((f) => f.kind === 'anomaly').slice(0, 2).forEach((f) => {
    const t = tiles.find((x) => x.id === f.tileId)
    const a = t ? anomalyFor(t) : null
    drivers.push({ title: f.text, body: a ? `At ${Math.abs(a.z)}× its normal week-to-week swing this is a break in pattern, not noise — it started moving before anything else on this board did.` : f.how })
  })

  // rising backlog measures, read TOGETHER — one climbing is a number, several
  // climbing at once is a cause
  const rising = kpis.filter((t) => t.delta && !isImprovement(t.title, t.delta.dir) && BACKLOG_RE.test(t.title))
  if (rising.length >= 2) {
    const top = [...rising].sort((a, b) => b.delta.pct - a.delta.pct)
    drivers.push({
      title: `${rising.length} backlog measures are climbing together`,
      lines: top.slice(0, 4).map((t) => `**${t.title}** +${t.delta.pct}%`),
      more: rising.length > 4 ? rising.length - 4 : 0,
      body: 'When they move as a group the cause is usually upstream — intake or capacity — rather than any single queue.',
    })
  }

  /* The reasoning line claims every widget was read, so the drivers have to come from
   * more than the KPI row — a board-level answer built only from KPIs is one the user
   * could have assembled by looking at the top of the page. */
  let worst = null
  tiles.filter((t) => t.type === 'chart').forEach((t) => {
    const sh = chartShape(t)
    if (sh.gauge || sh.heat || sh.map) return
    if ((sh.series || []).length !== 1) return
    const labels = sh.labels || [], vals = sh.series[0].values || []
    if (labels.length <= 2) return
    const total = vals.reduce((a, b) => a + (b || 0), 0)
    if (!total) return
    const maxV = Math.max(...vals)
    const ratio = (maxV / total) / (1 / labels.length)
    if (!worst || ratio > worst.ratio) worst = { tile: t, label: labels[vals.indexOf(maxV)], v: maxV, total, ratio, n: labels.length }
  })
  /* Two guards, both learned the hard way. The ratio test alone fires on any long-tailed
   * chart — across 63 technicians an even split is 1.6%, so a 12% leader reads as "7.4×
   * concentrated" when it is just the shape of a big list. It needs a real share as well
   * as a relative one, and few enough categories for "concentrated" to mean anything. */
  if (worst && worst.ratio >= 1.5 && worst.n <= 12 && pctOf(worst.v, worst.total) >= 25) {
    drivers.push({
      title: `${worst.label} holds ${pctOf(worst.v, worst.total)}% of ${worst.tile.title}`,
      body: `${worst.v} of ${worst.total} across ${worst.n} categories — ${Math.round(worst.ratio * 10) / 10}× an even split. Moving that chart means moving ${worst.label}; the rest are too small to change the total.`,
    })
  }

  const wl = tiles.find((t) => t.type === 'shortcut' && (t.rows || []).length)
  if (wl && !breach) {
    const cols = wl.columns || []
    const stIdx = cols.indexOf('Status')
    if (stIdx >= 0) {
      const by = {}
      wl.rows.forEach((r) => { const s = r[stIdx] || '—'; by[s] = (by[s] || 0) + 1 })
      const ranked = Object.entries(by).sort((a, b) => b[1] - a[1])
      if (ranked.length) drivers.push({
        title: `${wl.title} is mostly ${ranked[0][0]}`,
        lines: ranked.map(([k, v]) => `**${k}** ${v}`),
        body: `${ranked[0][1]} of ${wl.rows.length} records. That is where the hands-on work actually sits.`,
      })
    }
  }

  if (!drivers.length) drivers.push({ title: 'No single driver stands out', body: 'Every measure is inside its own range, so there is nothing on this board pulling the others.' })

  // --- meaning: the one consequence that is NOT visible on the tiles
  const falling = kpis.filter((t) => t.delta && isImprovement(t.title, t.delta.dir))
  let meaning
  if (rising.length && falling.length) {
    meaning = `${falling.map((t) => `**${t.title}**`).join(' and ')} improving while ${rising.slice(0, 2).map((t) => `**${t.title}**`).join(' and ')} climb usually means work is moving rather than being finished — the queue is draining into a later stage, not out of the system. Worth confirming before this reads as an improvement in a status report.`
  } else if (rising.length) {
    meaning = 'Every moving measure is moving the wrong way at once, which points at intake or capacity rather than any one queue. Fixing the biggest single number here will not move the others.'
  } else if (falling.length) {
    meaning = 'The measures that are moving are all moving the right way. The useful question this week is whether that holds, not what to fix.'
  } else {
    meaning = 'Nothing is moving enough to draw a conclusion from. Come back when a measure breaks its range.'
  }
  return { verdict, readings, drivers, meaning }
}

export function deepDiveTile(tile) {
  const t = tile || {}
  const readings = []
  const drivers = []
  let verdict = { tone: 'good', headline: t.title || 'This widget', sub: '' }
  let meaning = ''

  if (t.type === 'text') {
    return {
      verdict: { tone: 'good', headline: 'This is a note, not a measure', sub: 'Free Text tiles have no data behind them.' },
      readings: [], drivers: [{ title: 'Nothing to read', body: 'There is no query behind this widget, so there is nothing for me to analyse.' }],
      meaning: 'Ask about a widget with data behind it and I can tell you what it is doing.',
    }
  }

  if (t.type === 'kpi') {
    const a = anomalyFor(t)
    const hist = Array.isArray(t.history) ? t.history : []
    verdict = a
      ? { tone: a.severity, headline: `${t.value}${t.unit || ''} — outside its normal range`, sub: `${Math.abs(a.z)}× its usual week-to-week swing, against a ~${a.mean}${t.unit || ''} average.` }
      : { tone: t.status === 'bad' ? 'bad' : t.status === 'warn' ? 'warn' : 'good', headline: `${t.value}${t.unit || ''}${t.delta ? ` · ${t.delta.dir === 'up' ? '+' : '−'}${t.delta.pct}% week over week` : ''}`, sub: t.status === 'good' ? 'Inside its normal range.' : 'Outside comfortable range, but not an outlier.' }
    if (hist.length) readings.push({ label: 'Recent readings', value: hist.join(' → '), delta: '', dir: '', severity: a ? a.severity : 'good' })
    if (a) readings.push({ label: 'Baseline', value: `${a.mean}${t.unit || ''} avg`, delta: `${a.pctVsMean > 0 ? '+' : ''}${a.pctVsMean}%`, dir: a.dir, severity: a.severity })
    if (hist.length >= 3) {
      const first = hist[0], last = hist[hist.length - 1]
      drivers.push({ title: last > first ? `Climbing for ${hist.length} periods` : last < first ? `Falling for ${hist.length} periods` : 'Flat across the window', body: `${first}${t.unit || ''} → ${last}${t.unit || ''}. ${a ? 'The latest reading is the break, not the trend — the trend was already pointing this way.' : 'The movement is gradual, which is why it has not tripped as an outlier.'}` })
    }
    meaning = a
      ? `A single reading this far out is worth acting on now — waiting a cycle to confirm costs a week of ${(t.title || '').toLowerCase()} you cannot get back.`
      : 'Nothing here justifies action on its own. It is worth watching only if it keeps moving the same way.'
  } else if (t.type === 'shortcut') {
    const rows = t.rows || [], cols = t.columns || []
    const prIdx = cols.indexOf('Priority'), stIdx = cols.indexOf('Status'), dueIdx = cols.indexOf('Due')
    const p1 = prIdx >= 0 ? rows.filter((r) => /p1|urgent/i.test(r[prIdx] || '')) : []
    const today = dueIdx >= 0 ? rows.filter((r) => /today/i.test(r[dueIdx] || '')) : []
    const both = rows.filter((r) => prIdx >= 0 && /p1|urgent/i.test(r[prIdx] || '') && dueIdx >= 0 && /today/i.test(r[dueIdx] || ''))
    verdict = both.length
      ? { tone: 'bad', headline: `${both.length} record${both.length > 1 ? 's are' : ' is'} both top-priority and due today`, sub: `Out of ${rows.length} in the list — this is the set that breaches first.` }
      : { tone: p1.length ? 'warn' : 'good', headline: `${rows.length} records, ${p1.length} top priority`, sub: p1.length ? 'None of them are due today.' : 'Nothing here is flagged urgent.' }
    readings.push({ label: 'Total', value: String(rows.length), delta: '', dir: '', severity: 'good' })
    if (p1.length) readings.push({ label: 'Top priority', value: `${p1.length} (${pctOf(p1.length, rows.length)}%)`, delta: '', dir: '', severity: 'warn' })
    if (today.length) readings.push({ label: 'Due today', value: String(today.length), delta: '', dir: '', severity: 'bad' })
    if (stIdx >= 0) {
      const byStatus = {}
      rows.forEach((r) => { const s = r[stIdx] || '—'; byStatus[s] = (byStatus[s] || 0) + 1 })
      const ranked = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
      if (ranked.length) drivers.push({ title: `Most of this list sits in ${ranked[0][0]}`, body: `${ranked[0][1]} of ${rows.length} records. ${ranked.map(([k, v]) => `${k} ${v}`).join(' · ')}.` })
    }
    if (both.length) drivers.push({ title: 'Priority and deadline overlap', body: `${both.length} record${both.length > 1 ? 's carry' : ' carries'} both, which is what makes this list urgent rather than just long.` })
    meaning = both.length
      ? `The length of this list is not the problem — the overlap is. Clearing the ${both.length} that are both P1 and due today removes the breach risk without touching the other ${rows.length - both.length}.`
      : 'Nothing in this list is close to breaching, so it can be worked in priority order rather than by deadline.'
  } else {
    const sh = chartShape(t)

    if (sh.gauge) {
      const g = gaugeRead(sh.gauge)
      verdict = { tone: g.tone, headline: `${g.value}${g.unit} — ${g.tone === 'good' ? 'in the healthy band' : g.tone === 'warn' ? 'in the warning band' : 'in the critical band'}`, sub: g.nextEdge != null ? `${Math.round((g.nextEdge - g.value) * 10) / 10}${g.unit} from the next threshold.` : 'No threshold above the current reading.' }
      readings.push({ label: 'Value', value: `${g.value}${g.unit}`, delta: '', dir: '', severity: g.tone })
      readings.push({ label: 'Scale', value: `0–${g.max}${g.unit}`, delta: '', dir: '', severity: 'good' })
      drivers.push({ title: 'The bands are a choice, not a measurement', body: `This meter reads ${g.tone === 'good' ? 'healthy' : g.tone === 'warn' ? 'warning' : 'critical'} because of where the thresholds were set${g.nextEdge != null ? `, and the next one is at ${g.nextEdge}${g.unit}` : ''}. Moving the threshold moves the verdict without anything changing underneath it.` })
      meaning = g.nextEdge != null
        ? 'The gap to the next threshold is the only actionable number on a meter — it says how much movement actually changes the reading.'
        : 'There is no headroom left to gain here; the useful work is holding it.'
    } else if (sh.heat) {
      const h = sh.heat
      const cells = (h.data || []).map(([x, y, v]) => ({ col: h.cols?.[x], row: h.rows?.[y], v: v || 0 }))
      const total = cells.reduce((a, c) => a + c.v, 0)
      const hot = [...cells].sort((a, b) => b.v - a.v)[0]
      const empty = cells.filter((c) => !c.v).length
      verdict = hot && total
        ? { tone: pctOf(hot.v, total) >= 25 ? 'warn' : 'good', headline: `${hot.row} × ${hot.col} is the hottest cell at ${hot.v}${h.unit || ''}`, sub: `Across ${cells.length} cells${empty ? `, ${empty} of which are empty` : ''}.` }
        : { tone: 'good', headline: 'The grid is empty', sub: 'No cell has a value in the current range.' }
      ;[...cells].sort((a, b) => b.v - a.v).slice(0, 4).forEach((c) => readings.push({ label: `${c.row} × ${c.col}`, value: `${c.v}${h.unit || ''}`, delta: '', dir: '', severity: c === hot ? 'warn' : 'good' }))
      if (hot && total) drivers.push({ title: `${hot.row} carries the peak`, body: `${hot.v}${h.unit || ''} at ${hot.col}, against an even ${Math.round((total / cells.length) * 10) / 10} per cell. A grid is worth reading for its hot cell, not its total.` })
      if (empty) drivers.push({ title: `${empty} cell${empty > 1 ? 's are' : ' is'} empty`, body: 'An empty cell is either a real gap in the data or a combination that cannot occur. The two look identical here, and only one of them is worth reporting.' })
      meaning = 'A heatmap earns its space by showing where two dimensions intersect badly. If the peak is not meaningfully above the rest, the same data is easier to read as a bar chart.'
    } else if (sh.map) {
      const pts = [...(sh.map.points || [])].sort((a, b) => b.value - a.value)
      const total = pts.reduce((a, p) => a + p.value, 0)
      const top = pts[0]
      verdict = top
        ? { tone: pctOf(top.value, total) >= 40 ? 'warn' : 'good', headline: `${top.name} leads at ${top.value}${sh.map.unit || ''}`, sub: `${pts.length} site${pts.length > 1 ? 's' : ''} with records in range.` }
        : { tone: 'good', headline: 'No sites in range', sub: 'Nothing matched the current conditions.' }
      pts.slice(0, 4).forEach((p) => readings.push({ label: p.name, value: `${p.value}${sh.map.unit || ''}`, delta: total ? `${pctOf(p.value, total)}%` : '', dir: '', severity: p === top ? 'warn' : 'good' }))
      if (top) drivers.push({ title: 'Geography is the split here', body: `${sh.map.caption || 'Value'} ranges from ${pts[pts.length - 1].value}${sh.map.unit || ''} at ${pts[pts.length - 1].name} to ${top.value}${sh.map.unit || ''} at ${top.name}. A spread that wide across sites is usually staffing or routing, not demand.` })
      meaning = 'A map is only worth reading when the spread is uneven. If every bubble were the same size, the same numbers belong in a table.'
    } else if ((sh.series || []).length === 1 && (sh.labels || []).length) {
      const vals = sh.series[0].values || []
      const total = vals.reduce((a, b) => a + (b || 0), 0)
      const pairs = sh.labels.map((l, i) => ({ l, v: vals[i] || 0 })).sort((a, b) => b.v - a.v)
      const share = pctOf(pairs[0].v, total)
      const even = 100 / pairs.length
      const ratio = Math.round((share / even) * 10) / 10
      const heavy = share >= even * 1.5
      verdict = heavy
        ? { tone: 'warn', headline: `${pairs[0].l} carries ${share}% of the total`, sub: `${ratio}× an even split across ${pairs.length} categories.` }
        : { tone: 'good', headline: 'No category dominates', sub: `The largest, ${pairs[0].l}, is at ${share}% against an even ${Math.round(even)}%.` }
      pairs.slice(0, 4).forEach((p) => readings.push({ label: p.l, value: String(p.v), delta: `${pctOf(p.v, total)}%`, dir: '', severity: p.v === pairs[0].v && heavy ? 'warn' : 'good' }))
      const topThree = pairs.slice(0, 3).reduce((a, b) => a + b.v, 0)
      if (pairs.length > 3) drivers.push({ title: `The top 3 hold ${pctOf(topThree, total)}% of everything`, body: `${pairs.slice(0, 3).map((p) => `${p.l} ${p.v}`).join(', ')} — against ${total - topThree} spread across the remaining ${pairs.length - 3}.` })
      const empty = pairs.filter((p) => p.v === 0)
      if (empty.length) drivers.push({ title: `${empty.map((p) => p.l).join(', ')} ${empty.length > 1 ? 'are' : 'is'} empty`, body: 'No records at all. Worth confirming that is real and not a filter or a data gap.' })
      meaning = heavy
        ? `Anything that improves this widget has to come out of ${pairs[0].l}. Work spread across the smaller categories will not move the total enough to see.`
        : 'There is no single lever here — the spread is close to even, so improvement means moving several categories at once or accepting the shape.'
    } else if ((sh.series || []).length > 1) {
      const totals = sh.series.map((s) => ({ name: s.name, total: (s.values || []).reduce((a, b) => a + (b || 0), 0) })).sort((a, b) => b.total - a.total)
      const sum = totals.reduce((a, b) => a + b.total, 0)
      const share = pctOf(totals[0].total, sum)
      const even = 100 / totals.length
      const heavy = share >= even * 1.5
      verdict = heavy
        ? { tone: 'warn', headline: `${totals[0].name} carries ${share}% of the total`, sub: `${Math.round((share / even) * 10) / 10}× an even split across ${totals.length} series.` }
        : { tone: 'good', headline: 'The series are fairly balanced', sub: `Largest is ${totals[0].name} at ${share}%, against an even ${Math.round(even)}%.` }
      totals.slice(0, 4).forEach((x) => readings.push({ label: x.name, value: String(x.total), delta: `${pctOf(x.total, sum)}%`, dir: '', severity: 'good' }))
      const lo = totals[totals.length - 1]
      drivers.push({ title: `${totals[0].name} against ${lo.name}`, body: `${totals[0].total} versus ${lo.total} — a ${lo.total ? Math.round((totals[0].total / lo.total) * 10) / 10 : totals[0].total}× gap. That gap is the story here, not the shape of any single line.` })
      meaning = 'Comparing the series is only meaningful if they share a denominator — check that before reading the gap as performance.'
    }
  }

  if (!drivers.length) drivers.push({ title: 'Nothing stands out in this widget', body: widgetBrief(t).summary })
  return { verdict, readings, drivers, meaning }
}

// ---- What needs attention --------------------------------------------------
// Every item carries WHY IT MATTERS and the STEPS to take. A signal with no step is
// not an item — it goes in `notes`, so nobody works on something already fixing
// itself. This is the whole difference between an insight and a restated threshold.

export function focusBoard(board, role = 'technician') {
  const tiles = board?.tiles || []
  const fs = facts(board, role)
  const kpis = tiles.filter((t) => t.type === 'kpi')
  const items = []
  const notes = []                       // everything deliberately NOT on the action list

  // the biggest wrong-way mover, so ONE item can say so rather than all of them claiming it
  const movers = kpis.filter((t) => t.delta && !isImprovement(t.title, t.delta.dir))
  const biggestId = movers.length ? [...movers].sort((a, b) => b.delta.pct - a.delta.pct)[0].id : null

  fs.forEach((f) => {
    const tile = tiles.find((x) => x.id === f.tileId)

    if (f.kind === 'breach') {
      const n = parseInt(f.text, 10) || 0
      items.push({
        id: f.id, severity: 'bad', tileId: f.tileId, title: f.text, deadline: true,
        why: 'These breach today, not this week. Every hour they sit is SLA window spent, and a breached P1 is reportable whether or not it is resolved afterwards.',
        next: `Reassign ${n === 1 ? 'it' : `all ${n}`} to the on-call technician now and tell the affected stakeholders before they ask — a breach that was flagged early reads very differently in a review than one found afterwards. Do this before anything else on this list; everything below it will still be there in an hour, and ${n === 1 ? 'this one' : 'these'} will not.`,
      })
      return
    }

    if (f.kind === 'anomaly') {
      const a = tile ? anomalyFor(tile) : null
      items.push({
        id: f.id, severity: f.severity, tileId: f.tileId, title: f.text, deadline: false,
        why: `${a ? `At ${Math.abs(a.z)}× its normal swing this` : 'This'} is a change in behaviour, not a busy week — whatever caused it is still in place, so the number keeps climbing until it is found. That makes it worth a cause hunt rather than more hands.`,
        next: 'Open a problem record and look for what changed around the point it broke pattern — a release, a routing rule, a member of staff out. Throwing capacity at it clears today’s queue and leaves the cause running, so the same spike returns next week with a week of backlog behind it.',
      })
      return
    }

    // a delta. Two judgements before it earns a place: is it moving the right way,
    // and is it big enough to act on at all.
    const dir = tile?.delta?.dir
    const pctMove = tile?.delta?.pct ?? 0
    if (tile && dir && isImprovement(tile.title, dir)) {
      notes.push({ tone: 'good', text: `${tile.title} ${dir} ${pctMove}% — moving the right way` })
      return
    }
    if (f.severity !== 'bad' && pctMove < ACT_PCT) {
      notes.push({ tone: 'muted', text: `${tile?.title || f.chip} ${dir === 'up' ? 'up' : 'down'} ${pctMove}% — below the ${ACT_PCT}% move I’d act on` })
      return
    }
    const cls = classOf(tile?.title || f.chip)
    const adv = adviceFor(cls, { n: `${tile?.value ?? '—'}${tile?.unit || ''}`, pctMove, biggest: tile?.id === biggestId })
    items.push({
      id: f.id, severity: f.severity, tileId: f.tileId, title: f.text, deadline: cls === 'due' || cls === 'overdue',
      why: adv.why, next: adv.next,
    })
  })

  /* Rank by what has a DEADLINE first, then by severity. The panel says it ranked that
   * way and the lead sentence counts on it — leaving the order to `facts()` scoring put
   * a dated item third under a lead claiming the top two were the dated ones. */
  const SEV_ORDER = { bad: 0, warn: 1, good: 2 }
  items.sort((a, b) => (b.deadline ? 1 : 0) - (a.deadline ? 1 : 0) || SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
  items.forEach((it, i) => { it.rank = i + 1 })

  const dated = items.filter((i) => i.deadline).length
  const lead = !items.length
    ? 'Nothing on this board needs action right now.'
    : dated
      ? `${dated === 1 ? 'One of these has' : `The first ${dated} have`} a deadline attached — start there. The rest are trends, and they will keep until the stand-up.`
      : 'None of these has a deadline attached, so they are ranked by how far outside normal they are. Work them in order rather than at once.'
  return { lead, items: items.slice(0, 5), notes }
}

export function focusTile(tile) {
  const t = tile || {}
  if (t.type === 'text') return { lead: 'A Free Text tile has no data behind it, so there is nothing to act on.', items: [], notes: [] }
  const items = []
  const notes = []
  const keep = (text) => notes.push({ tone: 'good', text })
  const add = (severity, title, why, next) => items.push({ id: `${t.id}-${items.length}`, rank: items.length + 1, severity, tileId: t.id, title, why, next })

  if (t.type === 'shortcut') {
    const rows = t.rows || [], cols = t.columns || []
    const prIdx = cols.indexOf('Priority'), stIdx = cols.indexOf('Status'), dueIdx = cols.indexOf('Due')
    const isP1 = (r) => prIdx >= 0 && /p1|urgent/i.test(r[prIdx] || '')
    const dueToday = (r) => dueIdx >= 0 && /today/i.test(r[dueIdx] || '')
    const open = (r) => stIdx >= 0 && /open|new|assigned/i.test(r[stIdx] || '')
    const both = rows.filter((r) => isP1(r) && dueToday(r))
    const p1Open = rows.filter((r) => isP1(r) && open(r) && !dueToday(r))
    if (both.length) add('bad', `${both.length} record${both.length > 1 ? 's are' : ' is'} P1 and due today`,
      `Highest priority and closest deadline in one set — ${both.length} of ${rows.length}. These breach before anything else in the list, and clearing them removes the risk without touching the other ${rows.length - both.length}.`,
      `Put ${both.length === 1 ? 'it' : `all ${both.length}`} with the on-call technician before picking anything else out of this list. The other ${rows.length - both.length} records have no deadline today, so time spent on them is time the breach window keeps running.`)
    if (p1Open.length) add('warn', `${p1Open.length} further P1${p1Open.length > 1 ? 's are' : ' is'} unactioned`,
      'Top priority but no deadline pressure yet. Left alone through the week they become tomorrow’s due-today set, which is how this list grows.',
      'Schedule them into today’s queue rather than leaving them to be picked up. They are the cheapest work here — no escalation, no deadline pressure — and clearing them now is what stops this list growing a due-today set by tomorrow.')
    if (!items.length) keep(`Nothing in this list is urgent — all ${rows.length} records are lower priority or already in hand`)
  } else if (t.type === 'kpi') {
    const a = anomalyFor(t)
    if (a) add(a.severity, `${t.title} is ${a.pctVsMean > 0 ? 'well above' : 'well below'} its normal range`,
      `${t.value}${t.unit || ''} against a ~${a.mean}${t.unit || ''} average — ${Math.abs(a.z)}× the normal week-to-week swing. A break this size does not correct on its own.`,
      'Look for what changed around the point it broke pattern rather than adding capacity — a break this size has a cause that is still running, and clearing the queue without finding it just buys a week.')
    else if (t.delta && isImprovement(t.title, t.delta.dir)) keep(`${t.title} ${t.delta.dir} ${t.delta.pct}% — moving the right way`)
    else if (t.status === 'bad' || t.status === 'warn') add(t.status, `${t.title} is flagged ${t.status === 'bad' ? 'for action' : 'to watch'}`,
      `${t.value}${t.unit || ''}${t.delta ? `, ${t.delta.dir} ${t.delta.pct}% week over week` : ''}. It has not broken its range, so this is a capacity question rather than an incident.`,
      'Watch it one more cycle before spending anyone’s time on it. If it moves the same way again that is a trend worth staffing; a single week outside comfortable is usually just the week.')
    else keep(`${t.title} is inside its normal range`)
  } else {
    const sh = chartShape(t)

    if (sh.gauge) {
      const g = gaugeRead(sh.gauge)
      if (g.tone === 'good') keep(`${t.title} is at ${g.value}${g.unit} — inside the healthy band`)
      else add(g.tone, `${t.title} is in the ${g.tone === 'warn' ? 'warning' : 'critical'} band`,
        `At ${g.value}${g.unit} on a 0–${g.max}${g.unit} scale${g.prevEdge != null ? `, ${Math.round((g.value - g.prevEdge) * 10) / 10}${g.unit} past the threshold that changed the reading` : ''}. The gap to the nearest threshold is the only number here that changes the verdict — anything smaller is invisible on the meter.`,
        'Decide whether the band is right before working the number. Thresholds on a meter are a choice someone made, and if this one has been amber for weeks without consequence, the honest fix is the threshold rather than the queue behind it.')
    } else if (sh.heat) {
      const h = sh.heat
      const cells = (h.data || []).map(([x, y, v]) => ({ col: h.cols?.[x], row: h.rows?.[y], v: v || 0 }))
      const total = cells.reduce((a, c) => a + c.v, 0)
      const hot = [...cells].sort((a, b) => b.v - a.v)[0]
      const empty = cells.filter((c) => !c.v)
      if (hot && total && pctOf(hot.v, total) >= 25) add('warn', `${hot.row} × ${hot.col} holds ${pctOf(hot.v, total)}% of this grid`,
        `${hot.v}${h.unit || ''} in one cell of ${cells.length}, against an even ${Math.round((total / cells.length) * 10) / 10}. A grid this concentrated is really a single finding wearing a matrix.`,
        `Work the ${hot.row} / ${hot.col} intersection specifically rather than the whole row or column. Treating the row as the problem spreads effort across cells that are already fine, and the total will barely move.`)
      else if (hot) keep(`No cell dominates — the hottest, ${hot.row} × ${hot.col}, is at ${hot.v}${h.unit || ''}`)
      if (empty.length) add('warn', `${empty.length} cell${empty.length > 1 ? 's have' : ' has'} no records`,
        'An empty cell is either a real gap or a combination that cannot occur, and the two look identical on a heatmap. Reading a gap as a finding when it is a data artefact is the usual way a matrix misleads.',
        'Check the widget’s conditions before reading anything into the gaps. If the combination genuinely cannot occur, the honest fix is a different pair of dimensions rather than an explanation for the hole.')
    } else if (sh.map) {
      const pts = [...(sh.map.points || [])].sort((a, b) => b.value - a.value)
      const total = pts.reduce((a, p) => a + p.value, 0)
      const top = pts[0]
      if (top && total && pctOf(top.value, total) >= 40) add('warn', `${top.name} carries ${pctOf(top.value, total)}% of the total`,
        `${top.value}${sh.map.unit || ''} at ${top.name} against ${pts[pts.length - 1].value}${sh.map.unit || ''} at ${pts[pts.length - 1].name}. A spread this wide across sites is usually routing or staffing rather than demand.`,
        `Compare ${top.name}’s staffing against its share before treating this as a demand problem. If the site is carrying the load with the same headcount as the others, the fix is routing; if it genuinely has more work arriving, it is a staffing conversation.`)
      else if (top) keep(`No site dominates — the largest, ${top.name}, is at ${pctOf(top.value, total)}%`)
    } else if ((sh.series || []).length === 1 && (sh.labels || []).length) {
      const vals = sh.series[0].values || []
      const total = vals.reduce((a, b) => a + (b || 0), 0)
      const pairs = sh.labels.map((l, i) => ({ l, v: vals[i] || 0 })).sort((a, b) => b.v - a.v)
      const share = pctOf(pairs[0].v, total)
      const even = 100 / pairs.length
      if (share >= even * 1.5) add('warn', `${pairs[0].l} carries ${share}% of ${t.title}`,
        `${pairs[0].v} of ${total} records, ${Math.round((share / even) * 10) / 10}× an even split across ${pairs.length} categories. Work spread across the smaller categories will not move the total enough to see — this is the only lever with leverage.`,
        `Put the effort into ${pairs[0].l} and leave the rest alone. Moving a small category by half still will not show on this chart, while a few percent off ${pairs[0].l} is visible immediately — that is the whole argument for starting there.`)
      else keep(`No category dominates — the largest, ${pairs[0].l}, is at ${share}% against an even ${Math.round(even)}%`)
      const empty = pairs.filter((p) => p.v === 0)
      if (empty.length) add('warn', `${empty.map((p) => p.l).join(', ')} ${empty.length > 1 ? 'have' : 'has'} no records at all`,
        'An empty category is either real or a broken filter, and the two look identical on the chart. It is worth ruling out the second before reading anything into the first.',
        'Check the widget’s conditions before reading anything into it. A genuinely empty category and a filter that excludes everything look identical on a chart, and only one of them is worth reporting.')
    } else if ((sh.series || []).length > 1) {
      const totals = sh.series.map((s) => ({ name: s.name, total: (s.values || []).reduce((a, b) => a + (b || 0), 0) })).sort((a, b) => b.total - a.total)
      const sum = totals.reduce((a, b) => a + b.total, 0)
      const share = pctOf(totals[0].total, sum)
      const even = 100 / totals.length
      if (share >= even * 1.5) add('warn', `${totals[0].name} carries ${share}% of ${t.title}`,
        `${totals[0].total} of ${sum} across the series, against ${totals[totals.length - 1].total} in ${totals[totals.length - 1].name}. The imbalance is the finding — a single series this dominant usually means the split is not the one worth plotting.`,
        'Check whether this split is the one worth plotting. When a single series is this dominant the chart mostly shows that one series’ shape, and a different grouping usually says more about what is actually happening.')
      else keep(`The series are fairly balanced — largest is ${totals[0].name} at ${share}%`)
    }
  }

  items.forEach((it, i) => { it.rank = i + 1 })
  const lead = items.length
    ? (items[0].severity === 'bad' ? 'One thing here is already at its deadline — start there.' : 'Nothing here is urgent; this is where the leverage is.')
    : 'Nothing in this widget needs action right now.'
  return { lead, items, notes }
}
