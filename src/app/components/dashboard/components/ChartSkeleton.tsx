/**
 * ChartSkeleton — wireframe charts for the layout preview.
 *
 * NOT ChartIcon. That one is a 64x64 identifying glyph on a fixed artboard, drawn to be
 * recognised in a picker. This one is a small PORTRAIT of the real chart: the same
 * anatomy ECharts renders for us — value axis, gridlines, category labels, series
 * markers — drawn in grey. (No legend: at preview scale it read as a smudge.) Bare shapes were the first attempt and they read as
 * decoration; what makes a skeleton look like a chart is the chrome around the data, not
 * the data.
 *
 * Each kind mirrors what the board actually draws:
 *   line    → gridded plot, ringed point markers               (ChartTile's line)
 *   bar     → gridded plot, one series, no rounded caps        (ChartTile's column)
 *   hbar    → the same turned on its side: categories down the left, bars across
 *   donut   → ring with the centre total, as every pie tile on the board renders
 *   stack   → gridded plot, four series stacked per category
 * The donut carries no axes, because that chart has none.
 *
 * ── Two mechanics worth knowing ─────────────────────────────────────────────────
 * 1. The plot SVGs take `preserveAspectRatio="none"` so they stretch to any card shape.
 *    That would stretch the strokes with them, so every stroke sets `vector-effect:
 *    non-scaling-stroke` and stays the width written here.
 * 2. A round MARKER cannot be a <circle> for the same reason — it would render as an
 *    ellipse. Each one is a zero-length path with a round cap, which the renderer draws
 *    as a disc in screen units and the distortion cannot touch.
 *
 * The ramp is ChartIcon's idiom: steps of `currentColor`, so the call site's `color`
 * drives the whole drawing and both themes work from one declaration.
 */
import './ChartSkeleton.css';

/* Axis tick labels: ONE small width on both axes. Varied widths (a stubby zero, wider
   category labels) were tried and read as noise at this size; an even row of short pills
   reads as an axis. No legend either — at preview scale it was a smudge under the plot. */
const TICK = 10;
const Y_TICKS = Array(5).fill(TICK);
const X_TICKS_LINE = Array(6).fill(TICK);
const X_TICKS_BAR = Array(4).fill(TICK);

/* One series, four categories, as the reference draws it — and all four the SAME tone.
   Inking the tallest was tried; a single-series chart colours every bar alike, and the
   odd one out read as a selection. */
/* Centred in four equal slots (12.5 / 37.5 / 62.5 / 87.5), at a bar width near a third
   of the slot — the proportion the real chart draws. Wider bars read as a stacked block
   rather than a series. */
const BARS = [
  { x: 8, y: 10, h: 50 },
  { x: 33, y: 35, h: 25 },
  { x: 58, y: 24, h: 36 },
  { x: 83, y: 47, h: 13 },
];
/* Stacked: the reference's four categories × four statuses, in its own proportions
   (Low 3·1·2·5, Medium 3·3·3·8, High 3·3·2·6, Urgent 1·1·1·3 on an 18 axis). Segments
   are laid bottom-up, and each series keeps ONE tone across every column — that is what
   makes it read as four series stacked, not as sixteen unrelated blocks.
   Four series, four distinct tones — see .cs-s1..4 — ordered so no two neighbours match. */
const STACK = [[3, 1, 2, 5], [3, 3, 3, 8], [3, 3, 2, 6], [1, 1, 1, 3]];
const STACK_TONE = ['cs-s1', 'cs-s2', 'cs-s3', 'cs-s4'];
const STACK_SEGS = STACK.flatMap((col, ci) => {
  let y = 60;
  return col.map((v, si) => {
    const h = (v / 18) * 58;
    y -= h;
    return { x: ci * 25 + 8, y, h, cls: STACK_TONE[si], key: `${ci}-${si}` };
  });
});
/* Horizontal bars (ChartTile's `hbar`): four categories down the side, each bar centred in
   a 15-unit slot and about a third of it thick, growing from the value axis at x=0. The
   grid turns with the chart — vertical rules, since the VALUE axis now runs across. */
const HBARS = [
  { y: 3.5, w: 82 },
  { y: 18.5, w: 46 },
  { y: 33.5, w: 64 },
  { y: 48.5, w: 27 },
];
const GRID_X = [0, 25, 50, 75, 100];
const LINE_PTS = [[6, 38], [23.6, 26], [41.2, 30], [58.8, 16], [76.4, 20], [94, 12]];
const LINE_D = LINE_PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
const GRID_Y = [2, 16.5, 31, 45.5, 60];

export function ChartSkeleton({
  // line | bar | hbar | stack | donut
  kind,
}: any) {
  const plotted = kind === 'line' || kind === 'bar' || kind === 'stack' || kind === 'hbar';
  return (
    <div className="cs dc-ChartSkeleton" aria-hidden="true">
      {/* ── LINE and BAR: the same gridded frame, a different series ── */}
      {plotted && (
        <>
          <div className="cs-plot">
            {/* hbar: one category pill per bar, centred on it; otherwise the value ticks */}
            <div className={`cs-yax${kind === 'hbar' ? ' cat' : ''}`}>
              {(kind === 'hbar' ? X_TICKS_BAR : Y_TICKS).map((w, i) => (
                <span key={i} className="cs-stub" style={{ width: w + 'px' }} />
              ))}
            </div>
            <svg className="cs-canvas" viewBox="0 0 100 60" preserveAspectRatio="none">
              {/* gridlines first, so the series sits over them — vertical for hbar */}
              {kind === 'hbar' ? (
                <>
                  {GRID_X.map((x, i) => (
                    <path key={'gx' + i} className="cs-grid" d={`M${x},0 V60`} vectorEffect="non-scaling-stroke" />
                  ))}
                  {HBARS.map((b, i) => (
                    <rect key={'hb' + i} className="cs-col" x="0" y={b.y} width={b.w} height="8" />
                  ))}
                </>
              ) : (
                GRID_Y.map((y, i) => (
                  <path key={'g' + i} className="cs-grid" d={`M0,${y} H100`} vectorEffect="non-scaling-stroke" />
                ))
              )}
              {kind === 'hbar' ? null : kind === 'bar' ? (
                BARS.map((b, i) => <rect key={'b' + i} className="cs-col" x={b.x} y={b.y} width="9" height={b.h} />)
              ) : kind === 'stack' ? (
                STACK_SEGS.map((s) => <rect key={s.key} className={s.cls} x={s.x} y={s.y} width="9" height={s.h} />)
              ) : (
                <>
                  <path className="cs-series" d={LINE_D} vectorEffect="non-scaling-stroke" />
                  {/* ringed markers: a disc in the series tone, then a smaller one in the
                      card colour punched out of it */}
                  {LINE_PTS.map((p, i) => (
                    <path key={'m' + i} className="cs-mark" d={`M${p[0]},${p[1]} l0.01,0`} vectorEffect="non-scaling-stroke" />
                  ))}
                  {LINE_PTS.map((p, i) => (
                    <path key={'mi' + i} className="cs-mark-in" d={`M${p[0]},${p[1]} l0.01,0`} vectorEffect="non-scaling-stroke" />
                  ))}
                </>
              )}
            </svg>
          </div>
          {/* A CATEGORY axis centres each label in its slot, under the bar it names; a value
              axis runs its first and last labels to the ends of the plot, under the first
              and last point. Same row, two different alignments, and using one for both
              puts every bar label off its bar. */}
          <div className={`cs-xax ${kind === 'line' || kind === 'hbar' ? 'val' : 'cat'}`}>
            {(kind === 'line' ? X_TICKS_LINE : kind === 'hbar' ? Y_TICKS : X_TICKS_BAR).map((w, i) => (
              <span key={i} className="cs-slot"><i className="cs-stub" style={{ width: w + 'px' }} /></span>
            ))}
          </div>
        </>
      )}

      {/* ── DONUT: a ring with the centre total, the way every pie tile renders ── */}
      {!plotted && kind === 'donut' && (
        <div className="cs-donut-wrap">
          <div className="cs-donut">
            <div className="cs-hole">
              <span className="cs-stub cs-total" />
              <span className="cs-stub cs-total-lbl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
