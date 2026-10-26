/**
 * ChartTile — Apache ECharts renderer for widget tiles.
 *
 * Chart kinds: 'bar' | 'hbar' | 'line' | 'donut'. ECharts' built-in legend is
 * disabled; the legend is our own markup so it can evolve independently.
 *
 * Why ECharts (Apache-2.0): ServiceOps ships on-prem, so any chart library we
 * embed is *redistributed* to customers. Commercial libraries treat that as
 * OEM licensing. See docs/chart-library-and-competitor-dashboard-research.md.
 *
 * LEGEND MODES (docs/legend-and-topn-design.md). When a chart exceeds
 * HIGH_CARD entities, store.ui.legendStyle picks one of three strategies:
 *   2 Top-N + Other  bounded series set, explicit Other, rank pill
 *   4 Overflow chip  8 inline + "+N more" to reveal the rest
 *   6 Merged ② + ④   rank pill + 8 inline + "+N more"
 * Below HIGH_CARD every chart renders mode 0: a plain, complete legend.
 *
 * The two pills answer two different questions and must not overlap:
 *   rank pill  WHICH series?  → popover: rank window + the series it plots
 *   "+N more"  SHOW the rest  → expands the legend in place; where a rank pill
 *              exists, revealing everything means the filter now reads All
 * Clicking any legend entry (or any row in the popover) disables that series and
 * pulls its data out of the chart; it stays listed, struck through, to come back.
 *
 * The doc still describes re-encode / series-manager / cardinality-gate — they
 * were prototyped, compared, and cut.
 *
 * Port note: vue-echarts' <VChart> is replaced by the small `EChart` below — echarts/core
 * directly, `setOption(option, { replaceMerge: ['series'] })` and a ResizeObserver
 * autoresize, which is exactly what <VChart :update-options autoresize> did.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, FunnelChart, HeatmapChart, GaugeChart, MapChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, GraphicComponent, GeoComponent } from 'echarts/components';
import { store } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { Icon, Dropdown, DashPortal } from '../ui/primitives';
import { SeriesManager } from './SeriesManager';
import { chartData } from '../data/records.js';
import { CHART_OPT, NEW_KINDS } from '../data/chartOptions.js';
import './ChartTile.css';

const { use, registerMap, getMap } = echarts as any;

// Register only what we render. MarkLine/MarkArea come back with SLA threshold
// bands; DataZoom went out with the ranked-bar re-encode. Heatmap+VisualMap (heatmap),
// Gauge (gauge) and Graphic (the donut centre total) are the PMG-ACT-01 additions.
use([CanvasRenderer, BarChart, LineChart, PieChart, FunnelChart, HeatmapChart, GaugeChart, MapChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, GraphicComponent, GeoComponent]);

/* The India geo (§4.6 Map Bubble) is ~175KB, so it is code-split and registered on
 * demand — only when a map tile actually renders, never in the main bundle. */
async function ensureIndiaMap() {
  if (getMap('india')) return true;
  const mod: any = await import('../data/indiaMap.json');
  if (!getMap('india')) registerMap('india', mod.default);
  return true;
}

/* ── EChart: the <VChart> stand-in ─────────────────────────────────────────────
 * Autoresize SKIPS the observer's first callback when the box already matches the chart
 * (vue-echarts does the same): a resize re-lays-out the series and SNAPS a running
 * entrance animation to its end state. That is why the bars and the pie once appeared
 * fully formed while only the line (whose clip animation survives a relayout) looked
 * animated. Later size changes are throttled to ~100ms. */
function EChart({ option, style, className, instRef }: any) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inst = echarts.init(el.current!, null, { renderer: 'canvas' });
    instRef.current = inst;
    let first = true, timer: any = null;
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      const box = el.current;
      if (!box) return;
      if (first) { first = false; if (box.offsetWidth === inst.getWidth() && box.offsetHeight === inst.getHeight()) return; }
      if (timer) return;
      timer = setTimeout(() => { timer = null; if (!inst.isDisposed()) inst.resize(); }, 100);
    });
    ro?.observe(el.current!);
    return () => { ro?.disconnect(); clearTimeout(timer); inst.dispose(); instRef.current = null; };
  }, []);
  useEffect(() => { instRef.current?.setOption(option, { replaceMerge: ['series'] }); }, [option]);
  return <div ref={el} className={className} style={style} />;
}

/* Categorical palette: every adjacent pair must be separable at a 9px legend
 * swatch and as a thin donut arc. The old palette opened with two blues
 * (#3d8bd0, #3279be) that were indistinguishable — anti-pattern 14 in
 * docs/chart-library-and-competitor-dashboard-research.md.
 * Beyond 10 series colour stops carrying meaning; the legend must.
 *
 * The values live in the tokens as --chart-1..10 / --chart-other, with a lifted
 * dark set. They used to be hardcoded here, which made the chart palette the one
 * part of the UI that ignored the theme. Read them through `tokens` (below) so a theme
 * switch repaints the chart; never reintroduce a literal hex in this file. */
const PAL_STOPS = 10;

/* Priority and Status are ordinal/semantic, not nominal — painting P1 calm-blue
 * because it happens to be slice 0 is confidently wrong. These win over PAL.
 * Values are token *names* resolved per-theme, not hexes. P4 shares the slate
 * stop: a semantic chart never also spends nominal stop 8, so they can't collide. */
const SEMANTIC_TOKEN: Record<string, number> = {
  p1: 4, p2: 3, p3: 1, p4: 8,
  open: 1, 'in progress': 3, pending: 1,
  resolved: 2, closed: 2, compliant: 2,
  breached: 4, overdue: 4, failed: 4, critical: 4,
};

/* The theme tokens live on the board's `.dash-root` (in the prototype they were on :root),
 * so they are read from the nearest one — the theme this chart is actually painted in. */
const tokenHost = (el?: Element | null) => (el?.closest?.('.dash-root') || document.querySelector('.dash-root') || document.documentElement) as Element;
/* --chart-1..10 categorical stops + --chart-other; per-stop fallbacks (the light values),
 * so a missing token degrades to something legible rather than ten identical blues. */
const PAL_FALLBACK = [
  '#3d8bd0', '#1f9d63', '#b7740a', '#e0483d', '#7c4ddb',
  '#0e8fa0', '#c93b7d', '#5d7189', '#6b8600', '#b8560f',
];

const HIGH_CARD = 12;
/* Part-of-whole charts name *slices*; cartesian charts name *series*, because
 * their categories already sit on the axis and need no key. */
const SLICE_KINDS = ['pie', 'donut', 'funnel', 'pyramid'];

/* All first, as the prototype orders them: it is the unfiltered state, so reading
 * left-to-right the list narrows rather than starting narrowed. */
const RANKS = [
  { id: 'all', label: 'All' },
  { id: 'top', label: 'Top N' },
  { id: 'bottom', label: 'Bottom N' },
];
// the prototype offers N as a select rather than a free number field
const RANK_NS = [5, 10, 15, 20, 25, 50];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));

const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Hold the chart back until its card has faded in (the board staggers cards in over
 * ~0.2s). Draw it sooner and the animation plays out behind an opacity-0 card. */
const ENTER_DELAY = 260;
/* Everything AFTER the entrance — hiding a series, moving the rank window, switching
 * type — updates quickly and must NOT replay the entrance. ECharts only honours these
 * if the option is MERGED; `notMerge: true` makes every setOption look like a first
 * render, which would re-run the full 1.5s draw on every legend click. */
const UPDATE_ANIM = { animationDurationUpdate: 300, animationEasingUpdate: 'cubicOut', animationDelayUpdate: 0 };

const dot = (c: string) => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:7px"></span>`;

/* --- legend rendering decisions --- */
const INLINE_CAP = 8;
const ROW_H = 22;          // one legend row, incl. gap — keep in step with .lg-side
/* see ecSide: a name plus its percentage, before ellipsis bites */
const LEGEND_MIN = 132;
const POP_W = 380;
const POP_H = 560;
const BLANK = { left: '0px', top: 'auto', bottom: '0px', maxH: POP_H + 'px', arrow: '0px', below: false };

/* Anchor a floating panel to a trigger, in viewport coords: centred on it,
 * clamped to the edges, flipped below when there is no room above.
 * Above the trigger we pin the *bottom* edge — pinning `top` at
 * `trigger.top - maxH` only lands flush for panels that actually fill maxH,
 * and leaves shorter ones floating away from their arrow. */
function anchor(el: Element | null, W: number, cap: number) {
  const r = el?.getBoundingClientRect();
  if (!r) return null;
  const GAP = 8, EDGE = 8;
  const roomAbove = r.top - EDGE;
  const roomBelow = window.innerHeight - r.bottom - EDGE;
  const below = roomAbove < 200 && roomBelow > roomAbove;
  const maxH = Math.min(cap, Math.max(170, (below ? roomBelow : roomAbove) - GAP));
  const left = Math.max(EDGE, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - EDGE));
  return {
    left: left + 'px',
    top: below ? r.bottom + GAP + 'px' : 'auto',
    bottom: below ? 'auto' : window.innerHeight - r.top + GAP + 'px',
    maxH: maxH + 'px',
    below,
    arrow: r.left + r.width / 2 - left + 'px',
  };
}

export function ChartTile({
  chart,
  // An explicit px height. The tile MEASURES its body and passes the live value so the
  // chart tracks the real widget size and the side legend paginates to the space actually
  // available. ECharts needs a definite (pixel) height — a flex-filled height does not
  // propagate to its canvas through the nested flex levels.
  height = 180,
  legend = true,
  dataLabels = false,   // print values on the slices themselves
  onPick,               // host app: (label) => void when a slice / bar / point is clicked
}: any) {
  useDashStore();
  const rootEl = useRef<HTMLDivElement>(null);
  /* A content signature for `chart`: the resets below fire when the chart CHANGES, not when
   * a parent re-render hands us an equal object (Vue's watch only fired on a new reference,
   * and its computeds cached; React re-creates objects on every render). */
  const chartSig = useMemo(() => { try { return JSON.stringify(chart ?? null); } catch { return String(Math.random()); } }, [chart]);

  /* Theme tokens read at runtime. A theme switch bumps themeTick AFTER the DOM has the new
   * data-theme (an effect runs post-commit), so the re-read sees the new values. Not on mount:
   * a second setOption right after init would cut the entrance animation short — and the
   * first read already finds the board's `.dash-root`. */
  const [themeTick, setThemeTick] = useState(0);
  const themeSeen = useRef(store.ui.theme);
  useEffect(() => {
    if (themeSeen.current === store.ui.theme) return;
    themeSeen.current = store.ui.theme;
    setThemeTick((n) => n + 1);
  }, [store.ui.theme]);
  const cssVar = (n: string, f: string) => getComputedStyle(tokenHost(rootEl.current)).getPropertyValue(n).trim() || f;
  const pal = useMemo(() => PAL_FALLBACK.map((f, i) => cssVar(`--chart-${i + 1}`, f)), [themeTick]);
  const otherColor = useMemo(() => cssVar('--chart-other', '#7d8ea3'), [themeTick]);

  const kind: string = chart?.kind || 'bar';
  /* The additional PMG-ACT-01 kinds render from a stored `chartSpec` through the
   * chartData engine + a CHART_OPT builder, not from labels/series. They carry their
   * own (native) legend, so the custom legend/rank machinery below sits them out. */
  const isNewKind = (NEW_KINDS as Set<string>).has(kind);
  /* Map Bubble needs the India geo registered first (lazy). mapReady flips true once
   * it is, which re-runs the option to draw the real map. */
  const [mapReady, setMapReady] = useState(() => !!getMap('india'));
  useEffect(() => {
    if (kind === 'mapbubble' && !mapReady) ensureIndiaMap().then(() => setMapReady(true));
  }, [kind]);
  const labels: any[] = chart?.labels || [];
  const series: any[] = chart?.series || [];
  const sliceBased = SLICE_KINDS.includes(kind);

  /* --- entities: the things a legend would name. Slices for single-series
   * charts, series for multi-series charts. Everything below works on these. --- */
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  function baseColor(name: any, i: number) {
    const sem = SEMANTIC_TOKEN[String(name).toLowerCase()];
    /* `chart.colors` (name → colour) lets a host fix colours that carry meaning — Compliance
     * Visualization paints Passed green and Vulnerable red whatever order they arrive in. No board
     * tile sets it, so board charts are unaffected. */
    return overrides[name] || chart?.colors?.[name] || (sem ? pal[sem - 1] : null) || pal[i % PAL_STOPS];
  }
  const entities = useMemo(() => {
    if (sliceBased) {
      const vals = series[0]?.values || [];
      return labels.map((name, i) => ({ key: name, name, value: vals[i] ?? 0, color: baseColor(name, i) }));
    }
    return series.map((s, i) => ({
      key: s.name, name: s.name,
      value: s.values.reduce((a: number, b: number) => a + b, 0),
      color: baseColor(s.name, i),
    }));
  }, [chartSig, overrides, pal]);

  /* THE denominator. Always the pre-truncation total — a Top-10 view of 63
   * categories must still report "% of all tickets", never "% of the shown 10". */
  const trueTotal = entities.reduce((a, e) => a + e.value, 0) || 1;

  const isHighCard = entities.length > HIGH_CARD;
  /* Low-cardinality charts ignore the demo entirely and render as they always did. */
  const mode: number = isHighCard ? store.ui.legendStyle : 0;

  /* --- disabled series. One verb: toggle. A disabled entity stays in the legend,
   * struck through, and its data leaves the chart. --- */
  const [hidden, setHidden] = useState<Set<any>>(() => new Set());
  function toggle(key: any) {
    const s = new Set(hidden);
    s.has(key) ? s.delete(key) : s.add(key);
    setHidden(s);
  }
  function resetSeries() { setHidden(new Set()); }
  function recolor({ key, color }: any) { setOverrides((o) => ({ ...o, [key]: color })); }

  /* --- mode 2: the rank window. "Top N" is one window onto a sorted list;
   * bottom is the other. "All" drops the window entirely. --- */
  const [rankMode, setRankMode] = useState<'top' | 'bottom' | 'all'>('top');
  const [rankN, setRankN] = useState(10);

  // a new chart, a new legend strategy (switching starts from a clean series selection), or a
  // new rank window (a new visible set — stale hidden keys would silently persist)
  const skipFirst = useRef(true);
  useEffect(() => { if (skipFirst.current) { skipFirst.current = false; return; } setHidden(new Set()); }, [chartSig, mode, rankMode, rankN]);

  const sortedDesc = [...entities].sort((a, b) => b.value - a.value);
  const windowed = (() => {
    const s = sortedDesc, n = s.length;
    if (!n) return s;
    if (rankMode === 'all') return s;
    if (rankMode === 'bottom') return s.slice(n - clamp(rankN, 1, n));
    return s.slice(0, clamp(rankN, 1, n));
  })();
  const otherCount = entities.length - windowed.length;
  const otherValue = trueTotal - windowed.reduce((a, e) => a + e.value, 0);
  const otherRow = { key: '__other', name: `Other (${otherCount})`, value: otherValue, color: otherColor };
  const censusLabel = (() => {
    const n = windowed.length, t = entities.length;
    if (rankMode === 'all') return `All ${t}`;
    if (rankMode === 'bottom') return `Bottom ${n} of ${t}`;
    return `Top ${n} of ${t}`;
  })();

  /* Modes that bound the series set to a rank window (Top/Bottom/Range/Coverage). */
  const rankModes = mode === 2 || mode === 6;

  /* Everything the legend names — hidden entries included, so a disabled series
   * stays on screen (struck through) and can be switched back on. This is also
   * exactly what the series panel lists: one set, one source of truth. */
  const manageable = (() => {
    if (!rankModes) return entities;
    const rows = [...windowed];
    if (otherCount > 0) rows.push(otherRow);
    return rows;
  })();

  /* Disabling a series removes it from the chart in every mode. */
  const plotted = manageable.filter((e) => !hidden.has(e.key));

  /* --- theme: chart text/surface tokens. Repaints via themeTick. --- */
  const tokens = useMemo(() => ({
    ink: cssVar('--ink', '#364658'), ink2: cssVar('--ink-2', '#4f6075'),
    muted: cssVar('--muted', '#7b8fa5'), border: cssVar('--border', '#dfe5ed'),
    surface: cssVar('--surface', '#ffffff'), font: cssVar('--font', 'Poppins, sans-serif'),
    primary: cssVar('--primary', '#3d8bd0'),
  }), [themeTick]);
  /* Token bundle the CHART_OPT builders expect: the theme tokens plus the categorical
   * palette + Other stop, so an additional kind paints from the same --chart-* stops
   * (and repaints on a theme switch via themeTick, which `tokens` already reads). */
  const chartT = { ...tokens, pal, other: otherColor };

  /* --- legend hover → native ECharts highlight/downplay --- */
  const chartRef = useRef<any>(null);
  const [legendHover, setLegendHover] = useState<any>(null);
  function emphasise(key: any) {
    setLegendHover(key);
    const inst = chartRef.current; if (!inst) return;
    const i = plotted.findIndex((e) => e.key === key); if (i < 0) return;
    if (sliceBased) inst.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: i });
    else inst.dispatchAction({ type: 'highlight', seriesIndex: i });
  }
  function relax() { setLegendHover(null); chartRef.current?.dispatchAction({ type: 'downplay' }); }

  /* Optional click-through (host app): a click on a slice / bar / point reports its label.
   * The ECharts instance is created by <EChart> after this tile mounts, so wait a frame for it. */
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  useEffect(() => {
    if (!onPick) return;
    let raf = 0; let inst: any = null;
    const handler = (p: any) => { if (p?.name != null) onPickRef.current?.(String(p.name)); };
    const attach = () => {
      inst = chartRef.current;
      if (!inst) { raf = requestAnimationFrame(attach); return; }
      inst.on('click', handler);
      inst.getZr?.().setCursorStyle?.('pointer');
    };
    attach();
    return () => { cancelAnimationFrame(raf); inst?.off('click', handler); };
  }, [!!onPick]);

  const pctOf = (v: number) => ((v / trueTotal) * 100).toFixed(2);

  const option = useMemo(() => {
    // additional PMG-ACT-01 kinds: recompute display data from the stored spec and
    // hand it to the matching option builder. Everything below is the legacy path.
    if (isNewKind) {
      // the map needs its geo registered first — hold an empty option until then
      if (kind === 'mapbubble' && !mapReady) return {};
      const spec = chart?.spec;
      const build = (CHART_OPT as any)[kind];
      if (spec && build) return build(chartData(spec), spec, chartT);
    }

    const t = tokens;
    const k = kind;
    const rows = plotted;

    const tip = {
      backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, padding: [6, 10],
      extraCssText: 'box-shadow: 0 8px 28px rgba(27,28,46,.18); border-radius: 4px;',
      textStyle: { color: t.ink2, fontSize: 12, fontFamily: t.font },
    };
    const axis = {
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 11, fontFamily: t.font },
    };
    /* ---- Entrance animation ------------------------------------------------------
     * Each type draws itself in the way its own geometry implies, slowly enough to
     * actually be seen:
     *
     *   column   bars grow bottom → top, stepping left → right
     *   bar      bars grow left → right, stepping top → bottom
     *   line     the path draws itself left → right (ECharts clips it from the left)
     *   pie      the ring sweeps round from twelve o'clock
     *   funnel   the bands widen out, stepping down
     *
     * ENTER_DELAY holds the chart back until its card has faded in. Without it the
     * chart finished drawing while the card was still at opacity 0 — which is exactly
     * why the charts appeared to pop in fully formed with no animation at all.
     *
     * The stagger tightens as the series grows, so a 63-slice donut doesn't take ten
     * seconds to arrive. */
    const anim = (count: number): any => {
      if (reduceMotion) return { animation: false };
      const step = Math.min(70, Math.max(18, 500 / Math.max(1, count)));
      if (k === 'line' || k === 'area') {
        return { animation: true, animationDuration: 1500, animationEasing: 'cubicOut', animationDelay: ENTER_DELAY };
      }
      if (k === 'pie' || k === 'donut') {
        return { animation: true, animationType: 'expansion', animationDuration: 1400, animationEasing: 'cubicOut', animationDelay: ENTER_DELAY };
      }
      // bar | hbar | funnel — all grow from their baseline, so the delay is what
      // turns them into a sweep rather than a simultaneous pop
      return { animation: true, animationDuration: 900, animationEasing: 'cubicOut', animationDelay: (i: number) => ENTER_DELAY + i * step };
    };

    const sliceTip = { ...tip, trigger: 'item', formatter: (p: any) => `${dot(p.color)}${p.name}: ${pctOf(p.value)}% <b style="color:${t.ink}">(${p.value})</b>` };
    const sliceData = rows.map((e) => ({ name: e.name, value: e.value, itemStyle: { color: e.color } }));

    /* Pie / Doughnut — same series, different inner radius. The Donut toggle (§4 pie)
     * lives on the tile as chart.donut; legacy seeded tiles have kind:'donut' and no
     * flag, so they stay rings (undefined → default from the kind). A ring shows the
     * record total in the hole via a stable-id graphic; a flat pie removes that id. */
    if (k === 'pie' || k === 'donut') {
      const isDonut = chart?.donut === undefined ? (k === 'donut') : chart.donut === true;
      const centre = {
        type: 'group', id: 'donut-total', left: 'center', top: 'middle', silent: true,
        children: [
          { type: 'text', left: 'center', top: -15, style: { text: String(trueTotal), fill: t.ink, font: '700 26px ' + t.font, textAlign: 'center' } },
          { type: 'text', left: 'center', top: 16, style: { text: 'Total', fill: t.muted, font: '500 12px ' + t.font, textAlign: 'center' } },
        ],
      };
      return {
        tooltip: sliceTip,
        legend: { show: false },
        /* Declared always, hidden on a flat pie. It used to be deleted with
         * `{ id: 'donut-total', $action: 'remove' }`, which throws on a pie's FIRST
         * render: nothing carries that id yet, and ECharts dereferences the element it
         * was told to remove (`__ec_inner_*` of undefined). Declaring it and toggling
         * `invisible` keeps the id stable, so switching Pie ↔ Doughnut still updates one
         * element instead of adding one. */
        graphic: [{ ...centre, invisible: !isDonut }],
        series: [{
          type: 'pie',
          radius: isDonut ? ['52%', '78%'] : ['0%', '74%'],
          center: ['50%', '50%'],   // the legend is its own flex column, so the plot area is already narrowed
          // data labels sit *inside* the slice: leader lines outside would fight the
          // side legend for the same strip of space
          label: dataLabels
            ? { show: true, position: 'inside', formatter: '{c}', fontSize: 10, fontFamily: t.font, color: '#fff', fontWeight: 600 }
            : { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          emphasis: { focus: 'self', scale: true, scaleSize: 4 },
          blur: { itemStyle: { opacity: 0.18 } },
          data: sliceData,
          ...anim(sliceData.length),
        }],
        ...UPDATE_ANIM,
      };
    }

    /* Funnel / Pyramid — the same series, sorted the other way up. */
    if (k === 'funnel' || k === 'pyramid') {
      return {
        tooltip: sliceTip,
        legend: { show: false },
        series: [{
          type: 'funnel',
          left: '8%', right: '8%', top: 10, bottom: 10,
          sort: k === 'funnel' ? 'descending' : 'ascending',
          gap: 2, minSize: '12%',
          label: { show: false },
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          emphasis: { focus: 'self' },
          blur: { itemStyle: { opacity: 0.18 } },
          data: sliceData,
          ...anim(sliceData.length),
        }],
        ...UPDATE_ANIM,
      };
    }

    const splitLine = { show: true, lineStyle: { color: t.border, type: 'dashed', opacity: 0.7 } };

    /* Cartesian: bar (column) | hbar (horizontal) | line | area.
     * Here entities are *series*, so hiding one drops it from the plot. */
    const shown = series.filter((s) => !hidden.has(s.name));
    const isArea = k === 'area';
    const isLine = k === 'line' || isArea;
    const horizontal = k === 'hbar';
    const cat = { type: 'category', data: labels, ...axis, boundaryGap: !isLine, ...(horizontal ? { inverse: true } : {}) };
    const val = { type: 'value', ...axis, splitLine };
    return {
      tooltip: {
        ...tip, trigger: 'axis', axisPointer: { type: isLine ? 'line' : 'shadow', lineStyle: { color: t.border } },
        formatter: (ps: any[]) => {
          const head = `<div style="color:${t.ink};font-weight:600;margin-bottom:3px">${ps[0]?.axisValueLabel ?? ''}</div>`;
          const body = ps.map((p) => `<div style="white-space:nowrap">${dot(p.color)}${shown.length > 1 ? p.seriesName : ps[0]?.axisValueLabel ?? ''}: ${pctOf(p.value)}% <b style="color:${t.ink}">(${p.value})</b></div>`).join('');
          return shown.length > 1 ? head + body : body;
        },
      },
      legend: { show: false },
      grid: { left: 6, right: 14, top: 14, bottom: 4, containLabel: true },
      xAxis: horizontal ? val : cat,
      yAxis: horizontal ? cat : val,
      series: shown.map((s, si) => ({
        name: s.name, type: isLine ? 'line' : 'bar', data: s.values,
        barMaxWidth: 26,
        itemStyle: { borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0], color: baseColor(s.name, series.indexOf(s)) },
        lineStyle: isLine ? { width: 2.5, cap: 'round', join: 'round' } : undefined,
        // the fill is what separates Area from Line
        areaStyle: isArea ? { opacity: 0.18 } : undefined,
        smooth: isLine ? 0.35 : undefined,
        symbolSize: isLine ? 7 : undefined,
        // a grouped bar's second series starts a beat after the first, so the pair
        // sweeps across rather than landing together
        ...(() => {
          const a = anim(s.values.length);
          if (!a.animation || typeof a.animationDelay !== 'function') return a;
          const base = a.animationDelay;
          return { ...a, animationDelay: (i: number) => base(i) + si * 90 };
        })(),
        emphasis: { focus: 'series' },
        blur: { itemStyle: { opacity: 0.18 }, lineStyle: { opacity: 0.18 }, areaStyle: { opacity: 0.04 } },
      })),
      ...UPDATE_ANIM,
    };
    // everything the option reads: the chart, the visible set (hidden / rank window /
    // legend mode / overrides), the theme, the lazy map and the data-label flag
  }, [chartSig, hidden, rankMode, rankN, mode, overrides, themeTick, mapReady, dataLabels]);

  const chipModes = mode === 4 || mode === 6;
  const showInlineLegend = legend;

  /* The "+N more" chip expands the legend in place rather than opening a second
   * panel. Two popovers answering the same question ("which series?") was the
   * confusion; now the rank pill owns the filter and the chip owns the reveal. */
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [mode, chartSig]);
  // leaving All re-truncates the legend — the rank pill is the way back
  useEffect(() => { if (rankMode !== 'all') setExpanded(false); }, [rankMode]);

  const truncating = chipModes && !expanded;
  const inlineEntries = truncating ? manageable.slice(0, INLINE_CAP) : manageable;
  /* Count against the manageable set, not the plotted one: disabling series shrinks
   * `plotted`, and measured that way the chip would delete itself and strand the
   * user with no route back to the rest. */
  const overflowCount = truncating ? Math.max(0, manageable.length - inlineEntries.length) : 0;
  // clicking ANY legend entry (any chart, any cardinality) disables that series/slice
  // and pulls its data out of the chart — it stays listed, struck through, to come back.
  const legendClickable = true;

  /* ---- Side legend (part-of-whole charts) -------------------------------------
   * A pie/donut names slices, and slice names are long. Laid out centre-bottom they
   * wrap into a paragraph and eat the chart's height. Stacked to the RIGHT they read
   * as a list, one per line — but then only as many fit as the chart is tall, so the
   * rest paginate. Grow the widget and more fit per page; the page count falls out.
   *
   * Cartesian charts keep the bottom legend: they name *series*, of which there are
   * usually two or three, and a side column would steal width from the plot. */
  // new kinds (e.g. the engine-driven funnel) carry their own legend/labels in the
  // option, so they sit out the custom side legend even when their kind is slice-based
  const sideLegend = sliceBased && legend && !isNewKind;

  const legendCol = useRef<HTMLDivElement>(null);
  const [colH, setColH] = useState(0);
  const [page, setPage] = useState(0);

  /* ── The donut's square, measured rather than declared ──────────────────────
   * A part-of-whole chart is drawn as a circle whose diameter is 78% of the SHORTER
   * side of its canvas — so on a wide, short tile the drawing is only as big as the
   * row's height, and every extra pixel of canvas width is dead space. That dead space
   * is what pushed the donut left of centre and opened a visible gulf before the legend.
   *
   * The CSS aspect-ratio that was supposed to collapse it never could: ECharts writes an
   * inline width on its own container, and a flex item with flex-basis:auto takes that
   * inline width as its max-content contribution — so the box stayed as wide as whatever
   * ECharts last measured, which was itself derived from the box. A feedback loop.
   * Measuring the row and setting the side explicitly is what breaks it.
   *
   * The square is capped so the legend always keeps LEGEND_MIN for its names. Truncating
   * every label to "In P…" to buy a bigger circle trades the half of the chart that says
   * WHAT each slice is for the half that says how big it is. */
  const chartRow = useRef<HTMLDivElement>(null);
  const [rowBox, setRowBox] = useState({ w: 0, h: 0 });
  const ecSide = (() => {
    if (!sideLegend) return null;
    const { w, h } = rowBox;
    if (!w || !h) return null;
    return Math.max(104, Math.min(h, w - LEGEND_MIN - 10));   // 10 = the row gap
  })();

  /* Below this the legend cannot hold a name AND a percentage, and rendering both anyway
   * produced a column of stubs — "In P…" over a percentage clipped to "38.71⁹". Two
   * half-truncated facts are worth less than one whole one, so the compact form drops the
   * NAME and keeps swatch + percentage: the swatch still maps the row to its slice, the
   * number is still exact, and the name is one hover away in the row's own title. */
  const legendCompact = (() => {
    const { w } = rowBox;
    if (!w || !ecSide) return false;
    return w - ecSide - 10 < 110;
  })();

  // measure the legend column (rows that fit) and the chart row (the donut's square)
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !legendCol.current) return;
    const ro = new ResizeObserver(([e]) => setColH(e.contentRect.height));
    ro.observe(legendCol.current);
    return () => ro.disconnect();
  }, [sideLegend]);
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !chartRow.current) return;
    const ro = new ResizeObserver(([e]) => setRowBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(chartRow.current);
    return () => ro.disconnect();
  }, []);

  const sideEntries = manageable;
  /* How many rows fit. The rank pill and pager both live in the footer, which is a
   * sibling of the measured list — so colH already excludes them and the count is a
   * straight divide, no reserving. */
  const perPage = !colH ? (sideEntries.length || 1) : Math.max(1, Math.floor(colH / ROW_H));
  const pageCount = Math.max(1, Math.ceil(sideEntries.length / perPage));
  const paged = sideEntries.slice(page * perPage, page * perPage + perPage);
  // resizing the tile changes how many fit — never strand the user past the last page
  useEffect(() => { if (page > pageCount - 1) setPage(pageCount - 1); }, [pageCount]);
  useEffect(() => { setPage(0); }, [chartSig, mode, rankMode]);

  /* Reveal every legend. Where there is a rank pill it *is* the filter, so showing
   * all the legends means the filter now reads All — the pill must not keep
   * claiming "Top 11 of 63" while all 63 sit beneath it. */
  function expandAll() {
    if (rankModes) setRankMode('all');   // resets `hidden`, then:
    setExpanded(true);
  }

  /* One panel, one trigger: the rank pill. The rank window and the series list are
   * the same question — "which series are on this chart?" — so they live together:
   * tabs and field on top, the resulting series underneath. The panel is sized so
   * the series list, not the chrome, is what the space goes to.
   *
   * It has to be teleported: anchored inside .chart it gets clipped by the card's
   * overflow:hidden and follows the chart box instead of the pill. */
  const [panelOpen, setPanelOpen] = useState(false);
  const panelAnchor = useRef<Element | null>(null);
  const rankBtn = useRef<HTMLButtonElement>(null);
  const [pop, setPop] = useState<any>({ ...BLANK });
  const panelOpenRef = useRef(false);
  panelOpenRef.current = panelOpen;

  function reflow() { if (!panelOpenRef.current) return; const p = anchor(panelAnchor.current, POP_W, POP_H); if (p) setPop(p); }

  function togglePanel(el: Element | null) {
    if (panelOpen && panelAnchor.current === el) { setPanelOpen(false); return; }
    panelAnchor.current = el;
    setPanelOpen(true);
  }
  function closePops() { setPanelOpen(false); }

  useEffect(() => {
    if (!panelOpen) return;
    requestAnimationFrame(reflow);
    const onDocKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePops(); };
    addEventListener('scroll', reflow, true);   // capture: the board scrolls, not the window
    addEventListener('resize', reflow);
    addEventListener('keydown', onDocKey);
    return () => {
      removeEventListener('scroll', reflow, true);
      removeEventListener('resize', reflow);
      removeEventListener('keydown', onDocKey);
    };
  }, [panelOpen]);
  useEffect(() => { closePops(); }, [mode]);
  // hiding series reflows the inline legend, which moves the chip under the panel
  const inlineSig = inlineEntries.map((e) => e.key).join('\u0000') + '|' + hidden.size;
  useEffect(() => { requestAnimationFrame(reflow); }, [inlineSig]);

  /* the backdrop swallows wheel scrolling (Vue's @wheel.prevent) — React's wheel listeners
     are passive, so preventDefault has to go on a native, non-passive one */
  const backRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = backRef.current; if (!el) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, [panelOpen]);

  const legendTitle = (e: any) => (legendClickable ? (hidden.has(e.key) ? `Show ${e.name} on the chart` : `Hide ${e.name} from the chart`) : e.name);
  const lgCls = (e: any, extra = '') => ['lg', extra, legendHover !== null && legendHover !== e.key && 'faded', hidden.has(e.key) && 'off', legendClickable && 'click'].filter(Boolean).join(' ');

  return (
    <div ref={rootEl} className="chart dc-ChartTile" style={{ height: height + 'px' }}>
      <div ref={chartRow} className={`chart-row${sideLegend ? ' has-side' : ''}`}>
        <EChart instRef={chartRef} className="ec" option={option} style={ecSide ? { width: ecSide + 'px' } : undefined} />

        {/* Part-of-whole charts: legend to the RIGHT, one slice per line, paged to
            whatever the widget's height can hold. Taller widget → more per page. */}
        {sideLegend && (
          <aside className={`legend-side${legendCompact ? ' compact' : ''}`}>
            <div ref={legendCol} className="ls-list">
              {paged.map((e) => (
                <span
                  key={e.key} className={lgCls(e, 'lg-side')} title={legendTitle(e)}
                  onMouseEnter={() => emphasise(e.key)} onMouseLeave={() => relax()}
                  onClick={() => legendClickable && toggle(e.key)}
                >
                  <i style={{ background: e.color }} />
                  <span className="ls-nm">{e.name}</span>
                  <b>{pctOf(e.value)}%</b>
                </span>
              ))}
            </div>

            {/* The rank pill and the pager share one footer row, pinned to the bottom.
                Keeping the pill out of the top gives the list an extra row, and pairing
                it with the pager means the chrome costs one line, not two. */}
            {(rankModes || pageCount > 1) && (
              <footer className="ls-foot">
                {rankModes && (
                  <button
                    ref={rankBtn} className={`cs-chip side${panelOpen ? ' on' : ''}`}
                    title="Choose which slice of the ranking to plot" onClick={(ev) => { ev.stopPropagation(); togglePanel(rankBtn.current); }}
                  >
                    <span className="cs-lbl">{censusLabel}</span>
                    <Icon name="chevron-down" size={13} />
                  </button>
                )}

                {pageCount > 1 && (
                  <div className="ls-pager">
                    <button disabled={page === 0} title="Previous" onClick={() => setPage(page - 1)}><Icon name="chevron-left" size={14} /></button>
                    <span>{page + 1} / {pageCount}</span>
                    <button disabled={page >= pageCount - 1} title="Next" onClick={() => setPage(page + 1)}><Icon name="chevron-right" size={14} /></button>
                  </div>
                )}
              </footer>
            )}
          </aside>
        )}
      </div>

      {/* ② only: the "Other" residue spelled out beneath the chart */}
      {mode === 2 && !sideLegend && (
        <div className="census">
          {otherCount > 0 && (
            <span className="cs-note">
              <i style={{ background: otherColor }} /> Other = {otherCount} more ({pctOf(otherValue)}% of total)
            </span>
          )}
        </div>
      )}

      {/* bottom legend — cartesian charts only (classic ⓪, bounded ②, truncated ④, merged ⑥).
          New kinds carry their own native legend inside the option, so they sit this out. */}
      {showInlineLegend && !sideLegend && !isNewKind && (
        <div className="legend">
          {/* the rank pill states the truncation and opens the one panel that can
              change it. It sits outside the scroll box so it never scrolls away. */}
          {rankModes && (
            <button
              ref={rankBtn} className={`cs-chip${panelOpen ? ' on' : ''}`}
              title="Choose which slice of the ranking to plot" onClick={(ev) => { ev.stopPropagation(); togglePanel(rankBtn.current); }}
            >
              <Icon name="filter" size={12} /> {censusLabel}
              <Icon name="chevron-down" size={13} />
            </button>
          )}

          <div className={`lg-wrap${expanded ? ' scroller' : ''}`}>
            {inlineEntries.map((e) => (
              <span
                key={e.key} className={lgCls(e)} title={legendTitle(e)}
                onMouseEnter={() => emphasise(e.key)} onMouseLeave={() => relax()}
                onClick={() => legendClickable && toggle(e.key)}
              ><i style={{ background: e.color }} />{e.name}
                {sliceBased && <b>{pctOf(e.value)}%</b>}
              </span>
            ))}

            {/* nothing is hidden without saying so. Clicking reveals the rest —
                and, where there is a rank pill, moves the filter to All. */}
            {overflowCount > 0 && (
              <button
                className="more"
                title={rankModes
                  ? `Show all ${entities.length} series — switches the filter to All`
                  : `Show all ${entities.length} series`}
                onClick={(ev) => { ev.stopPropagation(); expandAll(); }}
              >
                +{overflowCount} more
              </button>
            )}
          </div>
        </div>
      )}

      {panelOpen && (
        <DashPortal>
          <div className="dc-ChartTile">
            <div ref={backRef} className="more-back" onClick={closePops} />

            {/* One panel: pick the slice of the ranking, then see exactly the
                series that slice puts on the chart. Floats over the tile. */}
            <div
              className={`more-pop${pop.below ? ' below' : ''}`}
              style={{ left: pop.left, top: pop.top, bottom: pop.bottom, width: POP_W + 'px', maxHeight: pop.maxH }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="mp-arrow" style={{ left: pop.arrow }} />
              <header className="mp-h">
                Legend Filter
                <button className="mp-x" onClick={closePops}><Icon name="x" size={14} /></button>
              </header>

              {rankModes && (
                /* Sort Order and Value side by side, as the prototype lays them out */
                <div className="rp-row">
                  <div className="rp-col">
                    <span className="rp-l">Sort Order</span>
                    {/* the product's segmented control */}
                    <div className="pill-track">
                      {RANKS.map((r) => (
                        <button key={r.id} aria-pressed={rankMode === r.id} onClick={() => setRankMode(r.id as any)}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rp-col n">
                    <span className="rp-l">Value</span>
                    {/* disabled on All: there is no N to pick when nothing is windowed */}
                    <div className="rp-selw">
                      <Dropdown modelValue={rankN} options={RANK_NS} disabled={rankMode === 'all'} onUpdateModelValue={(v: any) => setRankN(Number(v))} />
                    </div>
                  </div>
                </div>
                /* The "colour stops carrying meaning past about 10" warning used to sit
                   here. It fired on every wide chart, said the same thing every time, and
                   warned about a state the user had just deliberately chosen (All) — so it
                   read as the tool arguing with the request rather than helping. The rank
                   window itself is the answer; it does not need a caption. */
              )}

              {/* the series that slice actually plots — click one to drop it from the chart.
                  Search is offered only on the All tab: on Top/Bottom/Range/Coverage the
                  rank window has already narrowed the list, so searching it would hunt
                  through a set the filter chose rather than the data. */}
              <SeriesManager
                compact entities={manageable} hidden={hidden} total={trueTotal}
                searchable={rankMode === 'all'}
                onToggle={toggle} onReset={resetSeries} onRecolor={recolor}
              />
            </div>
          </div>
        </DashPortal>
      )}
    </div>
  );
}
