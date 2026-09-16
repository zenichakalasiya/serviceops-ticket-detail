/* Section layout — presets that restructure, and alignment that follows the shape.
 *
 * ⚠️ A preset is not a picture of a layout, it IS the layout: picking one rewrites the section's
 * `rows` and reflows what is already inside it. The old control wrote a number that nothing read,
 * which is why alignment felt inert — you were aiming at cells the section did not have.
 *
 * ⚠️ The preset SET is context-dependent. A section holding two widgets has no useful "three across"
 * — it would draw an empty third cell — so the row offers only the shapes that can hold what is
 * there, plus one more for growing into. Showing four tiles when two of them make an empty column is
 * how a layout picker teaches people to distrust it. */

export type PresetId = 'cols' | 'grid' | 'three' | 'stack';

export interface Preset { id: PresetId; title: string; rows: (n: number) => number[][] }

/** Every shape, as the `rows` data a section is actually built from. */
export const PRESETS: Record<PresetId, Preset> = {
  /* One row, every cell equal. `n` cells for `n` widgets — a column each. */
  cols: { id: 'cols', title: 'Columns', rows: (n) => [Array.from({ length: Math.max(1, n) }, () => 1)] },
  /* Pairs. ⚠️ An odd count leaves ONE full-width cell at the end rather than a half-empty pair —
     a lone box beside a gap reads as a mistake; a lone box across the width reads as a decision. */
  grid: {
    id: 'grid',
    title: 'Grid',
    rows: (n) => {
      const out: number[][] = [];
      for (let i = 0; i < n; i += 2) out.push(n - i === 1 ? [1] : [1, 1]);
      return out.length ? out : [[1, 1]];
    },
  },
  three: {
    id: 'three',
    title: 'Three across',
    rows: (n) => {
      const out: number[][] = [];
      for (let i = 0; i < n; i += 3) out.push(Array.from({ length: Math.min(3, n - i) }, () => 1));
      return out.length ? out : [[1, 1, 1]];
    },
  },
  /* One cell per row, full width. */
  stack: { id: 'stack', title: 'Stacked', rows: (n) => Array.from({ length: Math.max(1, n) }, () => [1]) },
};

/** Which presets are worth offering for a section holding `n` widgets.
 *
 * ⚠️ A section holding ONE widget is offered the column shapes too — the Action cards block dropped on
 * its own is the common case, and the question "split this into two or three columns" is exactly what
 * an admin asks there next. The extra cells arrive empty, which is what the + handles and a drag fill.
 * `stack` is dropped at that count because it draws the identical single cell `cols` already shows, and
 * two tiles promising the same shape is a choice that is not one. */
export function presetsFor(n: number): Preset[] {
  if (n >= 4) return [PRESETS.cols, PRESETS.grid, PRESETS.three, PRESETS.stack];
  if (n === 3) return [PRESETS.cols, PRESETS.grid, PRESETS.stack];
  if (n <= 1) return [PRESETS.cols, PRESETS.grid, PRESETS.three];
  return [PRESETS.cols, PRESETS.stack];
}

/** The shape a section currently has, matched back to a preset so the row can light one. */
export function presetOf(rows: number[][]): PresetId {
  if (rows.length === 1) return 'cols';
  if (rows.every((r) => r.length === 1)) return 'stack';
  if (rows.some((r) => r.length >= 3)) return 'three';
  return 'grid';
}

/** True when the section lays its cells out side by side — which decides the alignment vocabulary. */
export const isRowAxis = (rows: number[][]) => rows.some((r) => r.length > 1);

/* ── The tiles ───────────────────────────────────────────────────────────────
   Drawn from the same `rows` the preset produces, so a tile can never promise a shape you do not
   get — the rule the card-template picker already follows. */
function Tile({ rows, on }: { rows: number[][]; on: boolean }) {
  const fill = on ? 'bg-[#364658]' : 'bg-[#C3CBD6]';
  return (
    <span className="flex h-[13px] w-[15px] flex-col gap-[2px]">
      {rows.slice(0, 3).map((row, i) => (
        <span key={i} className="flex flex-1 gap-[2px]">
          {row.map((_, j) => <span key={j} className={`flex-1 rounded-[1px] ${fill}`} />)}
        </span>
      ))}
    </span>
  );
}

export function SectionPresets({ count, current, onPick }: {
  count: number; current: PresetId; onPick: (p: PresetId) => void;
}) {
  const list = presetsFor(count);
  return (
    <div className="flex items-center gap-1 rounded bg-[#F1F5F9] p-0.5">
      {list.map((p) => (
        <button
          key={p.id}
          onClick={() => onPick(p.id)}
          title={p.title}
          className={`flex h-7 flex-1 items-center justify-center rounded transition-colors ${
            current === p.id ? 'bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'hover:bg-white/60'
          }`}
        ><Tile rows={p.rows(count <= 1 ? (p.id === 'cols' || p.id === 'stack' ? 1 : 0) : Math.max(count, 2))} on={current === p.id} /></button>
      ))}
    </div>
  );
}

/* ── Alignment vocabularies ──────────────────────────────────────────────────
 *
 * ⚠️ The OPTIONS change with the axis, not just the icons. On a row of columns "centre" means the
 * columns sit in the middle of the band; on a stack it means each block is centred across the width.
 * They are different questions, and offering the same five words for both is what made the old
 * control read as decorative — half its options could not do anything in half the layouts. */
export const ACROSS_ROW = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Right' },
  { value: 'between', label: 'Space between' },
  { value: 'around', label: 'Space around' },
];

export const ACROSS_STACK = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Right' },
  { value: 'stretch', label: 'Full width' },
];

export const DOWN_ROW = [
  { value: 'start', label: 'Top' },
  { value: 'center', label: 'Middle' },
  { value: 'end', label: 'Bottom' },
  { value: 'stretch', label: 'Equal height' },
];

export const DOWN_STACK = [
  { value: 'start', label: 'Top' },
  { value: 'center', label: 'Middle' },
  { value: 'end', label: 'Bottom' },
  { value: 'between', label: 'Space between' },
  { value: 'around', label: 'Space around' },
];
