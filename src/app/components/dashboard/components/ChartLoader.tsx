/**
 * ChartLoader — widget loading states that are small CHARTS BUILDING THEMSELVES rather
 * than a spinner. The idea (borrowed from the better motion sites — Stripe, Linear,
 * Vercel): the wait should read as the chart being prepared for you, so there is
 * something to watch, not something to wait out.
 *
 * Every variant draws in the product's own chart palette (--chart-1..8, which already has
 * a dark-theme set), on one 160×100 artboard, so any of them drops into a widget body.
 * Durations scale with `speed`; captions rotate short, friendly lines that say what the
 * chart is "doing". prefers-reduced-motion swaps the motion for a gentle opacity breath.
 *
 * Variants
 *   morph     — one chart becoming the next: columns → dots + trend line → donut →
 *               loose dots gathering into a trend → blocks dropping into columns
 *   flow      — CONTINUOUS: morph's five charts, each built out of the last one —
 *               columns → line → donut → scatter → stacked → columns, nothing swaps out
 *   equalizer — colour bars dancing like an audio meter
 *   trend     — a line drawing itself, a glowing dot riding its tip, the area filling in
 *   orbit     — donut arcs growing in turn while the ring turns, a counter ticking up
 *   slices    — pie slices flying in, snapping together, breathing apart
 *   scatter   — loose dots that gather into a trend and draw their own line
 *   blocks    — stacked blocks dropping into columns with a little bounce
 *   gauge     — a gauge whose needle settles, with a live value
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import './ChartLoader.css';

/* Solid shades mixed against the card surface rather than alpha: overlapping parts (the
   stacked blocks, the dots gathering on the line) stay clean instead of darkening where
   they cross. Neighbours alternate dark/light so adjacent bars always read apart. */
const MONO = [88, 58, 38, 74, 28, 50, 34, 66];
const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── captions: what the chart is "doing", rotated ── */
const LINES: Record<string, string[]> = {
  morph: ['Stacking the columns…', 'Tracing the trend…', 'Slicing the donut…', 'Finding the pattern…', 'Filling the columns…'],
  equalizer: ['Tuning the numbers…', 'Balancing the bars…', 'Almost in rhythm…'],
  trend: ['Tracing the trend…', 'Connecting the dots…', 'Reading the curve…'],
  orbit: ['Counting every slice…', 'Rounding it up…', 'Closing the ring…'],
  slices: ['Slicing the pie…', 'Fitting the pieces…', 'Serving it up…'],
  scatter: ['Gathering the data points…', 'Finding the pattern…', 'Drawing the line…'],
  blocks: ['Stacking the blocks…', 'Filling the columns…', 'Levelling up…'],
  gauge: ['Taking a reading…', 'Settling the needle…', 'Checking the range…'],
};

/* ── morph: a five-phase cycle driven from JS (CSS does the tweening) ──
   0 columns · 1 trend line · 2 donut · 3 find the pattern · 4 block drop */
const PHASES = 5;
const BARS = [40, 62, 34, 70, 50];
const bx = (i: number) => 22 + i * 28;
const TOPS = BARS.map((h, i) => [bx(i) + 8, 88 - h]);
const TREND_D = TOPS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
const RING = 2 * Math.PI * 30;
const SEGS = [0.3, 0.24, 0.2, 0.15, 0.11];

/* ── flow: ONE set of shapes that physically becomes each chart in turn ───────────────
 * The same five charts as morph — column → line → donut → scatter → stacked — but nothing
 * is swapped: 15 pieces (five data slices × three parts) are each a closed polygon of 16
 * points (two 8-point edges, A out and B back), and every chart is just a different
 * placement of those points. The loop glides every point to its next placement:
 *   column → line     each column tips over into its stretch of the line
 *   line → donut      the line curls round into the ring
 *   donut → scatter   each slice shatters into its three dots, and the trend draws
 *   scatter → stacked the dots drop and square off into blocks, stacking up
 *   stacked → column  the gaps close and each stack melts into one solid column
 * A piece's three parts sit seamlessly (a hair of overlap) wherever they are one shape. */
type Pt = [number, number];
const FLOW_N = 8;
const lerpPts = (a: Pt, b: Pt, n = FLOW_N): Pt[] => Array.from({ length: n }, (_, k) => [a[0] + (b[0] - a[0]) * (k / (n - 1)), a[1] + (b[1] - a[1]) * (k / (n - 1))]);
const arcPts = (cx: number, cy: number, R: number, a0: number, a1: number, n = FLOW_N): Pt[] => Array.from({ length: n }, (_, k) => { const a = a0 + (a1 - a0) * (k / (n - 1)); return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
const poly = (A: Pt[], B: Pt[]) => [...A, ...[...B].reverse()];
const rectV = (x: number, y: number, w: number, h: number) => poly(lerpPts([x, y + h], [x, y]), lerpPts([x + w, y + h], [x + w, y]));
const dotP = (cx: number, cy: number, r: number) => poly(arcPts(cx, cy, r, Math.PI, 2 * Math.PI), arcPts(cx, cy, r, Math.PI, 0));
const segQ = (p: Pt, q: Pt, t: number) => {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = (-dy / L) * t / 2, ny = (dx / L) * t / 2;
  return poly(lerpPts([p[0] - nx, p[1] - ny], [q[0] - nx, q[1] - ny]), lerpPts([p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny]));
};
const FLOW_G = 5, FLOW_P = 3;                                  // five slices × three parts
const FLOW_IDX = Array.from({ length: FLOW_G * FLOW_P }, (_, p) => ({ g: Math.floor(p / FLOW_P), l: p % FLOW_P }));
const FRAC = [0.3, 0.24, 0.2, 0.15, 0.11];
const COL_H = [40, 62, 34, 70, 50];
const colX = (g: number) => 22 + g * 26;
const LINE_P: Pt[] = [[20, 66], [44, 44], [68, 54], [92, 30], [116, 40], [140, 24]];
const SPLIT = [[0.5, 0.3, 0.2], [0.4, 0.35, 0.25], [0.45, 0.3, 0.25], [0.36, 0.34, 0.3], [0.5, 0.26, 0.24]];
const JIT = [6, -5, 3, -7, 5, -3, 7, -4, 2, -6, 4, -2, 6, -5, 3];
const TREND_A: Pt = [18, 78], TREND_B: Pt = [142, 26];
const FLOW_STATES: Pt[][][] = (() => {
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // 0 · column — each column in three seamless parts
  const cols = FLOW_IDX.map(({ g, l }) => { const h = COL_H[g] / 3; return rectV(colX(g), 88 - (l + 1) * h, 16, h + 0.4); });
  // 1 · line — each segment in three seamless parts
  const line = FLOW_IDX.map(({ g, l }) => segQ(lerp(LINE_P[g], LINE_P[g + 1], l / 3 - (l ? 0.02 : 0)), lerp(LINE_P[g], LINE_P[g + 1], (l + 1) / 3), 3.2));
  // 2 · donut — each slice in three seamless arcs; the gap sits between slices only
  const starts = FRAC.reduce((acc, f, i) => [...acc, acc[i] + f * 2 * Math.PI], [-Math.PI / 2]);
  const donut = FLOW_IDX.map(({ g, l }) => {
    const A0 = starts[g] + 0.035, A1 = starts[g + 1] - 0.035, w = (A1 - A0) / 3;
    const a0 = A0 + l * w - (l ? 0.01 : 0), a1 = A0 + (l + 1) * w;
    return poly(arcPts(80, 50, 33, a0, a1), arcPts(80, 50, 20, a0, a1));
  });
  // 3 · scatter — fifteen dots loosely along a rising trend
  const scatter = FLOW_IDX.map((_, p) => {
    const x = 24 + p * 8.2, y = TREND_A[1] + (TREND_B[1] - TREND_A[1]) * ((x - TREND_A[0]) / (TREND_B[0] - TREND_A[0])) + JIT[p];
    return dotP(x, y, 4.2);
  });
  // 4 · stacked — the same columns, cut into three blocks with a gap between them
  const stacked = FLOW_IDX.map(({ g, l }) => {
    const H = COL_H[g] - 4, below = SPLIT[g].slice(0, l).reduce((s, f) => s + f, 0) * H + l * 2, h = SPLIT[g][l] * H;
    return rectV(colX(g), 88 - below - h, 16, h);
  });
  return [cols, line, donut, scatter, stacked];
})();
// the x-axis sits under every chart but the donut
const FLOW_AXIS = [1, 1, 0, 1, 1];
const FLOW_DOTS = [0, 1, 0, 0, 0];
const FLOW_TREND = [0, 0, 0, 1, 0];
const FLOW_STAGGER = 0.4;
const FLOW_LINES = LINES.morph;

/* ── slices: wedge geometry, each flies in along its own mid-angle ── */
const PIE = [0.28, 0.22, 0.2, 0.17, 0.13];
/* ── scatter: each dot has a loose home and a place on the trend ── */
const TREND = 'M14 70 C 34 62, 44 78, 62 58 S 92 64, 104 40 S 132 36, 146 20';
const DOT_HOMES = [
  [18, 30, 26, 78], [46, 82, 44, 70], [70, 20, 62, 61], [98, 70, 80, 52],
  [120, 26, 98, 44], [140, 76, 116, 35], [34, 56, 134, 27], [108, 88, 150, 18],
];
/* ── blocks: 4 columns, falling in turn ── */
const COLS = [[18, 16, 12], [22, 14], [14, 20, 10], [12, 18, 16]];

export function ChartLoader({
  variant = 'morph',
  speed = 1,
  caption = true,
  // monochrome: the product's slate (--picker-ico, #7186A8 — the empty-group artwork's
  // colour) in stepped SOLID shades instead of the chart palette
  mono = false,
  // softer motion: no overshoot/bounce, longer eases, charts fade out as the next arrives
  smooth = false,
  // max drawing width in px
  size = 76,
}: any) {
  const C = (i: number) => (mono
    ? `color-mix(in srgb, var(--picker-ico) ${MONO[(i - 1) % MONO.length]}%, var(--surface))`
    : `var(--chart-${i})`);

  const [lineIdx, setLineIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  // the phase just left, for a short moment — lets the pattern and blocks FADE OUT instead of
  // snapping away when their class drops (removing an animation can't be transitioned)
  const [prev, setPrev] = useState(-1);
  const phaseRef = useRef(0);
  const [flowState, setFlowState] = useState(0);
  const [flowK, setFlowK] = useState(1);                     // 0 → 1 across the current morph
  /* ── orbit + gauge: a live number ── */
  const [count, setCount] = useState(0);
  const [needle, setNeedle] = useState(-70);

  useEffect(() => {
    let prevT: any = null, raf = 0;
    const period = 2000 / speed;
    const tick = setInterval(() => {
      const ph = phaseRef.current;
      phaseRef.current = (ph + 1) % PHASES;
      setPrev(ph); setPhase(phaseRef.current);
      setLineIdx((n) => n + 1);
      clearTimeout(prevT); prevT = setTimeout(() => setPrev(-1), 500 / speed);
    }, period);
    if (!reduce) {
      const t0 = performance.now();
      const loop = (now: number) => {
        // clamped: a frame's timestamp can predate t0 by a hair, and a negative t made the
        // flow index -1 on the very first frame
        const t = Math.max(0, ((now - t0) / 1000) * speed);
        // flow: 2s per chart — the first 1.3s is the morph, the rest a short hold
        const fs = Math.floor(t / 2), fe = t - fs * 2;
        setFlowState(fs % FLOW_STATES.length);
        setFlowK(Math.min(1, fe / 1.3));
        // orbit: 0 → 100 over each 2.4s turn, then again
        setCount(Math.round(((t % 2.4) / 2.4) * 100));
        // gauge: a needle that hunts and settles — two sines, never a metronome
        setNeedle(-10 + Math.sin(t * 1.3) * 48 + Math.sin(t * 3.1) * 12);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => { clearInterval(tick); cancelAnimationFrame(raf); clearTimeout(prevT); };
  }, [speed, variant]);

  // morph's caption names the chart on screen; the others rotate through their three lines
  const capText = variant === 'flow' ? FLOW_LINES[flowState]
    : variant === 'morph' ? LINES.morph[phase] : (LINES[variant] || LINES.morph)[lineIdx % 3];

  const segs = useMemo(() => SEGS.reduce((acc: any[], f, i) => {
    const off = acc.reduce((s, x) => s + x.len, 0);
    acc.push({ len: f * RING - 2, off, color: C(i + 1), i });
    return acc;
  }, []), [mono]);

  // a piece's shade per chart: the slice's own shade, except the stacked chart, where each
  // level shares one shade so the stacks read as series
  const FLOW_FILL = useMemo(() => FLOW_STATES.map((_, s) => FLOW_IDX.map(({ g, l }) => (s === 4 ? C(l + 1) : C(g + 1)))), [mono]);

  const flowPrev = (flowState + FLOW_STATES.length - 1) % FLOW_STATES.length;
  const flowAt = (p: number) => {                             // piece p's eased progress (staggered)
    const k = Math.min(1, Math.max(0, flowK * (1 + FLOW_STAGGER) - (p / (FLOW_IDX.length - 1)) * FLOW_STAGGER));
    return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  };
  const flowPaths = variant === 'flow' ? (() => {
    const cur = FLOW_STATES[flowState], prv = FLOW_STATES[flowPrev];
    return cur.map((pts, i) => {
      const k = flowAt(i);
      return 'M' + pts.map((p, j) => `${(prv[i][j][0] + (p[0] - prv[i][j][0]) * k).toFixed(2)},${(prv[i][j][1] + (p[1] - prv[i][j][1]) * k).toFixed(2)}`).join(' L') + ' Z';
    });
  })() : [];
  // cross-fade a per-state flag: what is leaving goes at once, what is arriving waits until
  // the pieces have nearly landed — the line's points never float ahead of the line
  const flowFade = (arr: number[]) => {
    const s = flowState, p = flowPrev;
    if (arr[s] === arr[p]) return arr[s];
    const k = arr[s] > arr[p] ? Math.min(1, Math.max(0, (flowK - 0.6) / 0.4)) : Math.min(1, flowK * 3);
    return arr[p] + (arr[s] - arr[p]) * k;
  };
  // the scatter's trend draws itself once the dots have landed, and fades as they drop
  const flowTrendDraw = flowState === 3 ? Math.min(1, Math.max(0, (flowK - 0.55) / 0.45)) : 1;

  const gaugeVal = Math.round(((needle + 90) / 180) * 100);

  const wedges = useMemo(() => {
    let a0 = -Math.PI / 2;
    return PIE.map((f, i) => {
      const a1 = a0 + f * 2 * Math.PI;
      const r = 34, cx = 80, cy = 50;
      const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      const mid = (a0 + a1) / 2;
      const w = { d: `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`,
        dx: (Math.cos(mid) * 26).toFixed(1) + 'px', dy: (Math.sin(mid) * 26).toFixed(1) + 'px',
        ex: (Math.cos(mid) * 4).toFixed(1) + 'px', ey: (Math.sin(mid) * 4).toFixed(1) + 'px', color: C(i + 1), i };
      a0 = a1;
      return w;
    });
  }, [mono]);

  const DOTS = DOT_HOMES.map(([x1, y1, x2, y2], i) => ({ x1, y1, x2, y2, color: C((i % 7) + 1), i }));

  const blocks = COLS.flatMap((col, ci) => {
    let y = 88;
    return col.map((h, bi) => { y -= h + 2; return { x: 26 + ci * 30, y, h, color: C(bi + 1 + (ci % 2) * 3), d: ci * 0.12 + bi * 0.42, key: `${ci}-${bi}` }; });
  });

  const cls = ['cl', 'dc-ChartLoader', `cl-${variant}`, reduce && 'still', mono && 'mono', smooth && 'smooth'].filter(Boolean).join(' ');
  const dur = (2.6 / speed) + 's';

  return (
    <div className={cls} style={{ '--spd': speed, '--cl-w': size + 'px' } as any} role="status" aria-live="polite" aria-label={capText}>
      <svg className="cl-svg" viewBox="0 0 160 100" fill="none" aria-hidden="true">
        {/* ── MORPH ── columns → dots + trend → donut */}
        {variant === 'morph' && (
          <>
            {/* the x-axis belongs to the axis charts only: it fades out for the donut */}
            <path d="M14 88 H146" className={`cl-base mbase${phase === 2 ? ' off' : ''}`} />
            {BARS.map((h, i) => (
              <rect key={'mb' + i} className={`mb${phase !== 0 ? ' down' : ''}`}
                x={bx(i)} y={88 - h} width="16" height={h} rx="3" fill={C(i + 1)} style={{ transitionDelay: (i * 60) + 'ms' }} />
            ))}
            <path d={TREND_D} className={`mt${phase === 1 ? ' on' : ''}`} pathLength="1" />
            {TOPS.map((p, i) => (
              <circle key={'md' + i} className={`mdot${phase === 1 ? ' on' : ''}`}
                cx={p[0]} cy={p[1]} r="3.6" fill={C(i + 1)} style={{ transitionDelay: (120 + i * 70) + 'ms' }} />
            ))}
            <g className={`mring${phase === 2 ? ' on' : ''}`}>
              <circle cx="80" cy="50" r="30" className="mring-track" />
              {segs.map((s: any) => (
                <circle key={'ms' + s.i} cx="80" cy="50" r="30" className="mseg" stroke={s.color}
                  style={{ '--len': s.len, '--off': -s.off, '--circ': RING, transitionDelay: (s.i * 110) + 'ms' } as any} />
              ))}
            </g>
            {/* 3 · find the pattern: loose dots appear, drift into a trend, the line draws */}
            <g className={`msc${phase === 3 || prev === 3 ? ' on' : ''}${prev === 3 ? ' leaving' : ''}`}>
              <path d="M26 78 L150 18" className="msc-line" pathLength="1" />
              {DOTS.map((p) => (
                <circle key={'mp' + p.i} r="4" fill={p.color} className="msc-dot"
                  style={{ '--x1': p.x1 + 'px', '--y1': p.y1 + 'px', '--x2': p.x2 + 'px', '--y2': p.y2 + 'px', '--dl': (p.i * 0.04) + 's' } as any} />
              ))}
            </g>
            {/* 4 · block drop: blocks fall into their columns with a small bounce */}
            <g className={`mbk${phase === 4 || prev === 4 ? ' on' : ''}${prev === 4 ? ' leaving' : ''}`}>
              {blocks.map((b) => (
                <rect key={'mk' + b.key} className="mbk-b" x={b.x} y={b.y} width="20" height={b.h} rx="3"
                  fill={b.color} style={{ '--dl': (b.d * 0.4) + 's' } as any} />
              ))}
            </g>
          </>
        )}

        {/* ── FLOW ── five shapes that become each chart in turn */}
        {variant === 'flow' && (
          <>
            <path d="M14 88 H146" className="cl-base" style={{ opacity: flowFade(FLOW_AXIS) }} />
            {flowPaths.map((d, i) => (
              <path key={'fl' + i} d={d} className="fl-pc" style={{ fill: FLOW_FILL[flowState][i] }} />
            ))}
            {/* the scatter's trend, drawn through the dots once they land */}
            <path d={`M${TREND_A[0]} ${TREND_A[1]} L${TREND_B[0]} ${TREND_B[1]}`} className="fl-trend" pathLength="1"
              stroke={C(1)} style={{ opacity: flowFade(FLOW_TREND), strokeDashoffset: 1 - flowTrendDraw }} />
            {/* the line chart's points, only while it is a line */}
            {LINE_P.map((p, i) => (
              <circle key={'fp' + i} cx={p[0]} cy={p[1]} r="3.4" fill={C(Math.min(i, 4) + 1)}
                stroke="var(--surface)" strokeWidth="1.4" style={{ opacity: flowFade(FLOW_DOTS) }} />
            ))}
          </>
        )}

        {/* ── EQUALIZER ── */}
        {variant === 'equalizer' && (
          <>
            <path d="M14 90 H146" className="cl-base" />
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={'eq' + i} className="eq" x={16 + (i - 1) * 19} y="18" width="12" height="72" rx="4"
                fill={C(i)} style={{ '--d': (0.72 + ((i * 37) % 5) * 0.11) + 's', '--dl': (-i * 0.13) + 's' } as any} />
            ))}
          </>
        )}

        {/* ── TREND ── line draws, dot rides the tip, area fills */}
        {variant === 'trend' && (
          <>
            <defs>
              <linearGradient id="clTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--chart-1)" stopOpacity=".32" />
                <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M14 88 H146" className="cl-base" />
            <path d={TREND} className="tr-ghost" />
            <path d={TREND + ' L146 88 L14 88 Z'} className="tr-area" fill="url(#clTrendFill)" />
            <path d={TREND} className="tr-line" pathLength="1" />
            {/* the dot rides the curve with SVG's own path motion (sturdier than CSS
                offset-path on SVG), timed to the draw: reach the end at 65%, hold, fade */}
            {!reduce && (
              <g>
                <circle className="tr-halo" r="9">
                  <animateMotion dur={dur} repeatCount="indefinite" path={TREND}
                    keyPoints="0;1;1" keyTimes="0;0.65;1" calcMode="spline" keySplines=".45 0 .25 1;0 0 1 1" />
                  <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values=".22;.22;0" keyTimes="0;0.88;1" />
                </circle>
                <circle className="tr-dot" r="4">
                  <animateMotion dur={dur} repeatCount="indefinite" path={TREND}
                    keyPoints="0;1;1" keyTimes="0;0.65;1" calcMode="spline" keySplines=".45 0 .25 1;0 0 1 1" />
                  <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="1;1;0" keyTimes="0;0.88;1" />
                </circle>
              </g>
            )}
          </>
        )}

        {/* ── ORBIT ── donut arcs grow in turn while the ring turns; a counter ticks */}
        {variant === 'orbit' && (
          <>
            <circle cx="80" cy="50" r="32" className="or-track" />
            <g className="or-spin">
              {segs.map((s: any) => (
                <circle key={'os' + s.i} cx="80" cy="50" r="32" className="or-seg" stroke={s.color}
                  style={{ '--len': (s.len * 32) / 30, '--off': (-s.off * 32) / 30, '--circ': 2 * Math.PI * 32, '--dl': (s.i * 0.22) + 's' } as any} />
              ))}
            </g>
            <text x="80" y="54" className="or-num">{count}<tspan className="or-pct">%</tspan></text>
          </>
        )}

        {/* ── SLICES ── fly in, snap, breathe apart */}
        {variant === 'slices' && (
          <>
            {wedges.map((w) => (
              <path key={'sl' + w.i} d={w.d} fill={w.color} className="sl"
                style={{ '--dx': w.dx, '--dy': w.dy, '--ex': w.ex, '--ey': w.ey, '--dl': (w.i * 0.14) + 's' } as any} />
            ))}
            <circle cx="80" cy="50" r="13" className="sl-hole" />
          </>
        )}

        {/* ── SCATTER ── loose points gather into a trend */}
        {variant === 'scatter' && (
          <>
            <path d="M14 88 H146" className="cl-base" />
            <path d="M26 78 L150 18" className="sc-line" pathLength="1" />
            {DOTS.map((p) => (
              <circle key={'sd' + p.i} r="4" fill={p.color} className="sc-dot"
                style={{ '--x1': p.x1 + 'px', '--y1': p.y1 + 'px', '--x2': p.x2 + 'px', '--y2': p.y2 + 'px', '--dl': (p.i * 0.05) + 's' } as any} />
            ))}
          </>
        )}

        {/* ── BLOCKS ── stacked blocks drop in with a bounce */}
        {variant === 'blocks' && (
          <>
            <path d="M14 90 H146" className="cl-base" />
            {blocks.map((b) => (
              <rect key={'bk' + b.key} className="bk" x={b.x} y={b.y} width="20" height={b.h} rx="3"
                fill={b.color} style={{ '--dl': b.d + 's' } as any} />
            ))}
          </>
        )}

        {/* ── GAUGE ── a needle that hunts and settles */}
        {variant === 'gauge' && (
          <>
            <path d="M30 78 A50 50 0 0 1 63 30.5" className="ga-band" stroke="var(--chart-2)" />
            <path d="M66.5 29.3 A50 50 0 0 1 106 32.7" className="ga-band" stroke="var(--chart-3)" />
            <path d="M109 34.5 A50 50 0 0 1 130 78" className="ga-band" stroke="var(--chart-4)" />
            <g style={{ transform: `rotate(${needle}deg)` }} className="ga-needle">
              <path d="M80 78 L80 36" />
            </g>
            <circle cx="80" cy="78" r="5" className="ga-hub" />
            <text x="80" y="96" className="ga-val">{gaugeVal}</text>
          </>
        )}
      </svg>
      {/* `caption` here is the PROP (show captions?), `capText` the line itself. Keyed on the
          line, so each new caption remounts and plays its fade-in (Vue's <transition>). */}
      {caption && <p key={capText} className="cl-cap">{capText}</p>}
    </div>
  );
}
