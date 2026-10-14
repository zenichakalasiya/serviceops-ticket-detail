/**
 * ChartLoaderScene — MULTI-chart loaders: little scenes where two or three charts from
 * the Create Widget catalogue interact, in the product's monochrome slate, with smooth
 * (no-overshoot) motion. The single-chart loaders live in ChartLoader; these are the
 * "story" set.
 *
 *   assemble — a mini dashboard assembles: KPI counts up, columns grow, donut fills, line draws
 *   chomp    — a pie chomps along a line chart, eating the points; a KPI keeps score
 *   funnel   — dots pour through a funnel chart and stack into a stacked-column chart
 *   pulse    — a combo chart (bars + line) scrolls like a monitor; a gauge reads it live
 *   heatdrop — heatmap cells ripple, then drop into histogram columns, and float back
 *   race     — three lines of a multi-line chart race to a waving flag; a KPI runs to 100%
 *
 * PLAYABLE: a tap/click squashes and bounces the whole scene ("boop") — a small reward for
 * poking it while you wait. Shades are solid mixes of --picker-ico against the surface
 * (#7186A8 — the empty-group artwork's colour), so it follows the theme.
 */
import { useEffect, useRef, useState } from 'react';
import './ChartLoaderScene.css';

const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const LINES: Record<string, string[]> = {
  assemble: ['Laying out your dashboard…', 'Placing the widgets…', 'Almost there…'],
  chomp: ['Munching through the data…', 'Chomping every point…', 'Nom nom… nearly done'],
  funnel: ['Pouring in the records…', 'Filtering through…', 'Stacking the results…'],
  pulse: ['Checking the pulse…', 'Reading the vitals…', 'Steady and healthy…'],
  heatdrop: ['Warming up the heatmap…', 'Dropping into buckets…', 'Sorting it out…'],
  race: ['The lines are racing…', 'Neck and neck…', 'Crossing the finish…'],
};

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/* ── chomp: a pie travelling along a line of points, eating them (cycle 3.4s) ── */
const CH_XS = [34, 52, 70, 88, 106, 124, 142];
const chY = (x: number) => 56 + Math.sin(((x - 34) / 18) * 0.9) * 9;
const CH_PTS = CH_XS.map((x) => [x, chY(x)]);
const CH_LINE = CH_PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1].toFixed(1)}`).join(' ');

/* ── pulse: the combo scrolls in CSS; the gauge reads a wandering value ── */
const PU_BARS = [18, 30, 22, 40, 26, 34, 16, 28];
const puTops = [...PU_BARS, ...PU_BARS].map((h, i) => [12 + i * 12 + 4, 84 - h]);
const PU_LINE = puTops.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
const GA_HALF = Math.PI * 20;

/* ── heatdrop: which cells exist, and how far each falls to stack into its column ── */
const HD_PRESENT = [[1, 3], [0, 1, 2, 3], [0, 2, 3], [2], [0, 1, 3]];   // rows kept per column (top→bottom)
const hdCells = HD_PRESENT.flatMap((rows, c) => {
  const kept = [...rows].sort((a, b) => b - a);                        // bottom-most first
  return kept.map((r, k) => {
    const x = 39 + c * 17, y = 14 + r * 13;
    const ty = 88 - 10 - k * 11;
    return { key: `${c}-${r}`, x, y, dy: ty - y, shade: ((c + r) % 5) + 1, dl: (c + r) * 0.07 };
  });
});

/* ── race: three lines, three easings, one finish flag; a KPI runs to 100% ── */
const RACE = [
  { d: 'M10 78 C 40 70, 60 40, 90 46 S 124 26, 140 22', shade: 1, ease: [0.5, 0, 0.3, 1] },
  { d: 'M10 82 C 36 80, 64 60, 92 62 S 122 44, 140 40', shade: 3, ease: [0.2, 0.6, 0.4, 1] },
  { d: 'M10 86 C 44 84, 70 76, 96 74 S 124 62, 140 58', shade: 2, ease: [0.7, 0, 0.2, 1] },
];

const AS_BARS: [number, number, string][] = [[92, 14, 'var(--m2)'], [106, 22, 'var(--m1)'], [120, 10, 'var(--m3)'], [134, 26, 'var(--m2)']];
const FU_COLS = [[8, 10, 7], [12, 6, 9], [6, 9, 11]];

export function ChartLoaderScene({ variant = 'assemble', speed = 1, caption = true, size = 110 }: any) {
  const [lineIdx, setLineIdx] = useState(0);
  const capText = (LINES[variant] || LINES.assemble)[lineIdx % 3];

  /* ── one clock for the JS-driven bits (KPI counters, the chomper, the gauge) ── */
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = setInterval(() => setLineIdx((n) => n + 1), 2200 / speed);
    if (!reduce) {
      const t0 = performance.now();
      const loop = (now: number) => { setT(((now - t0) / 1000) * speed); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(raf); clearInterval(tick); };
  }, [speed, variant]);

  /* ── assemble: the KPI card counts up after it pops in (cycle 4s) ── */
  const kpi = Math.round(easeOut(((t % 4) - 0.35) / 1.1) * 248);

  /* ── chomp ── */
  const chP = (t % 3.4) / 3.4;
  const chX = 16 + Math.min(1, chP / 0.72) * 138;
  const chVisible = chP < 0.8;
  const eaten = CH_XS.map((x) => chP < 0.9 && chX > x - 3);
  const eatenN = eaten.filter(Boolean).length;
  const chMouth = 4 + 32 * Math.abs(Math.sin(t * 11));
  const chPie = (() => {
    const x = chX, y = chY(x), r = 11, a = (chMouth * Math.PI) / 180;
    return `M${x.toFixed(1)},${y.toFixed(1)} L${(x + r * Math.cos(a)).toFixed(1)},${(y - r * Math.sin(a)).toFixed(1)} A${r},${r} 0 1 0 ${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)} Z`;
  })();
  const chEye = [chX + 1, chY(chX) - 5.5];

  /* ── pulse gauge ── */
  const gv = Math.min(0.97, Math.max(0.08, 0.55 + 0.25 * Math.sin(t * 1.6) + 0.08 * Math.sin(t * 4.1)));
  const gAngle = -90 + gv * 180;

  const racePct = Math.round(Math.min(1, ((t % 3.4) / 3.4) / 0.7) * 100);

  /* ── playable: a tap squashes and bounces the scene ── */
  const [boop, setBoop] = useState(false);
  const boopT = useRef<any>(null);
  function poke() {
    setBoop(false);
    requestAnimationFrame(() => setBoop(true));
    clearTimeout(boopT.current); boopT.current = setTimeout(() => setBoop(false), 650);
  }
  useEffect(() => () => clearTimeout(boopT.current), []);

  return (
    <div className={`cs dc-ChartLoaderScene cs-${variant}${reduce ? ' still' : ''}`} style={{ '--spd': speed, '--cs-w': size + 'px' } as any}
      role="status" aria-live="polite" aria-label={capText}>
      <svg className={`cs-svg${boop ? ' boop' : ''}`} viewBox="0 0 160 100" fill="none" aria-hidden="true" onClick={poke}>
        {/* ── ASSEMBLE: KPI · column · donut · line, four cards filling in turn ── */}
        {variant === 'assemble' && (
          <>
            <g className="as-card" style={{ '--dl': '0s' } as any}>
              <rect x="6" y="6" width="72" height="40" rx="6" className="card" />
              <text x="42" y="31" className="as-kpi">{kpi}</text>
              <rect x="30" y="35" width="24" height="3" rx="1.5" fill="var(--m4)" />
            </g>
            <g className="as-card" style={{ '--dl': '.3s' } as any}>
              <rect x="82" y="6" width="72" height="40" rx="6" className="card" />
              <path d="M88 40 H148" className="axis" />
              {AS_BARS.map((b, i) => (
                <rect key={'ab' + i} className="as-bar" x={b[0]} y={40 - b[1]} width="8" height={b[1]} rx="1.5" fill={b[2]}
                  style={{ '--dl2': (0.3 + 0.18 + i * 0.08) + 's' } as any} />
              ))}
            </g>
            <g className="as-card" style={{ '--dl': '.6s' } as any}>
              <rect x="6" y="54" width="72" height="40" rx="6" className="card" />
              <circle cx="42" cy="74" r="11" className="as-track" />
              <circle cx="42" cy="74" r="11" className="as-arc" stroke="var(--m1)" style={{ '--len': 48, '--off': 0 } as any} />
              <circle cx="42" cy="74" r="11" className="as-arc" stroke="var(--m3)" style={{ '--len': 19, '--off': -50 } as any} />
            </g>
            <g className="as-card" style={{ '--dl': '.9s' } as any}>
              <rect x="82" y="54" width="72" height="40" rx="6" className="card" />
              <path d="M88 88 H148" className="axis" />
              <path d="M90 84 L102 76 L114 80 L126 68 L138 72 L148 62" className="as-line" pathLength="1" />
            </g>
          </>
        )}

        {/* ── CHOMP: a pie eats its way along a line chart ── */}
        {variant === 'chomp' && (
          <>
            <path d="M14 90 H150" className="axis" />
            <path d={CH_LINE} className="ch-line" />
            {CH_PTS.map((p, i) => (
              <circle key={'cp' + i} cx={p[0]} cy={p[1]} r="3.2" fill="var(--m2)" className={`ch-dot${eaten[i] ? ' gone' : ''}`} />
            ))}
            <g className={`ch-pie${!chVisible ? ' hide' : ''}`}>
              <path d={chPie} fill="var(--m1)" />
              <circle cx={chEye[0]} cy={chEye[1]} r="1.4" fill="var(--surface)" />
            </g>
            {/* the score, as a tiny KPI */}
            <g className="ch-kpi">
              <rect x="112" y="8" width="40" height="18" rx="5" className="card" />
              <text x="132" y="21" className="ch-score">×{eatenN}</text>
            </g>
          </>
        )}

        {/* ── FUNNEL: dots pour through a funnel and stack into columns ── */}
        {variant === 'funnel' && (
          <>
            <polygon points="18,30 78,30 70,44 26,44" fill="var(--m4)" />
            <polygon points="27,46 69,46 62,58 34,58" fill="var(--m3)" />
            <polygon points="35,60 61,60 56,70 40,70" fill="var(--m2)" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <circle key={'fd' + i} r="2.6" fill="var(--m1)" className="fu-drop"
                style={{ '--x0': (22 + i * 8) + 'px', '--xc': (100 + ((i - 1) % 3) * 18 + 6) + 'px', '--dl': ((i - 1) * 0.5) + 's' } as any} />
            ))}
            <path d="M94 86 H154" className="axis" />
            {FU_COLS.map((col, ci) => col.map((h, si) => (
              <rect key={'fs' + ci + si} className="fu-seg" x={100 + ci * 18} width="12" rx="1.5"
                y={86 - col.slice(0, si + 1).reduce((a, b) => a + b + 1, 0)} height={h}
                fill={['var(--m1)', 'var(--m3)', 'var(--m2)'][si]} style={{ '--dl': (0.5 + si * 0.9 + ci * 0.25) + 's' } as any} />
            )))}
          </>
        )}

        {/* ── PULSE: a scrolling combo chart + a live gauge ── */}
        {variant === 'pulse' && (
          <>
            <defs><clipPath id="csPuClip"><rect x="8" y="18" width="96" height="68" /></clipPath></defs>
            <path d="M8 84 H104" className="axis" />
            <g clipPath="url(#csPuClip)">
              <g className="pu-track">
                {[...PU_BARS, ...PU_BARS].map((h, i) => (
                  <rect key={'pb' + i} x={12 + i * 12} y={84 - h} width="8" height={h} rx="1.5" fill="var(--m4)" />
                ))}
                <path d={PU_LINE} className="pu-line" />
              </g>
            </g>
            <circle cx="104" cy="44" r="2.6" fill="var(--m1)" />
            <circle cx="104" cy="44" r="2.6" className="pu-ping" />
            {/* gauge */}
            <path d="M112 70 A20 20 0 0 1 152 70" className="ga-track" />
            <path d="M112 70 A20 20 0 0 1 152 70" className="ga-val" style={{ strokeDasharray: `${(gv * GA_HALF).toFixed(1)} ${GA_HALF.toFixed(1)}` }} />
            <g style={{ transform: `rotate(${gAngle}deg)`, transformOrigin: '132px 70px' }}><path d="M132 70 V54" className="ga-needle" /></g>
            <circle cx="132" cy="70" r="2.6" fill="var(--m1)" />
            <text x="132" y="86" className="ga-num">{Math.round(gv * 100)}</text>
          </>
        )}

        {/* ── HEATDROP: heatmap ripples, then falls into a histogram ── */}
        {variant === 'heatdrop' && (
          <>
            <path d="M34 88 H126" className="axis hd-axis" />
            {hdCells.map((c) => (
              <rect key={'hc' + c.key} x={c.x} y={c.y} width="14" height="10" rx="2"
                fill={`var(--m${c.shade})`} className="hd-cell" style={{ '--dy': c.dy + 'px', '--dl': c.dl + 's' } as any} />
            ))}
          </>
        )}

        {/* ── RACE: three lines race to the flag; a KPI runs to 100% ── */}
        {variant === 'race' && (
          <>
            <path d="M10 90 H146" className="axis" />
            {RACE.map((r, i) => (
              <path key={'rl' + i} d={r.d} className="ra-line" pathLength="1"
                stroke={`var(--m${r.shade})`} style={{ animationTimingFunction: `cubic-bezier(${r.ease.join(',')})` }} />
            ))}
            {!reduce && (
              <g>
                {RACE.map((r, i) => (
                  <circle key={'rd' + i} r="3" fill={`var(--m${r.shade})`} stroke="var(--surface)" strokeWidth="1.2">
                    <animateMotion dur={(3.4 / speed) + 's'} repeatCount="indefinite" path={r.d}
                      keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="spline" keySplines={`${r.ease.join(' ')};0 0 1 1`} />
                  </circle>
                ))}
              </g>
            )}
            {/* finish flag */}
            <path d="M148 14 V42" className="ra-pole" />
            <path d="M148 15 L160 19 L148 23 Z" fill="var(--m2)" className="ra-flag" />
            <g>
              <rect x="8" y="8" width="38" height="18" rx="5" className="card" />
              <text x="27" y="21" className="ra-kpi">{racePct}%</text>
            </g>
          </>
        )}
      </svg>
      {/* keyed on the line, so each new caption remounts and plays its fade-in */}
      {caption && <p key={capText} className="cs-cap">{capText}</p>}
    </div>
  );
}
