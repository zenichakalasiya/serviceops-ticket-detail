/* Support Portal builder — the BANNER's layout: which of its items sit side by side and which stack.
 *
 * The banner holds ITEMS — the Text group (`hero-copy`), the Search (`hero-search`) and every widget
 * placed on it (`el-N`, from `rowExtras.hero`). How they are arranged is a small tree stored on the
 * hero's config as `bannerTree`: a leaf is an item id, a branch is a row (side by side) or a column
 * (stacked) of leaves and branches.
 *
 * ⚠️ The stored tree is a PREFERENCE, never the truth about what is on the banner. Every read goes
 * through `normalizeTree`, which drops leaves whose item has gone and appends items the tree has not
 * met yet. So deleting a widget, turning the search off or adding a widget from anywhere needs no
 * bookkeeping here — the arrangement repairs itself on the next render.
 *
 * ⚠️ PRESETS are built from the CURRENT item order (the tree's leaves left to right, top to bottom),
 * so picking one rearranges the same items rather than asking which item goes where. The set on
 * offer depends on how many items there are — two items have two arrangements, four have seven. */

export type BannerNode = string | { d: 'row' | 'column'; c: BannerNode[] };

const branch = (d: 'row' | 'column', c: BannerNode[]): BannerNode => ({ d, c });

export const leavesOf = (n: BannerNode | null | undefined): string[] =>
  !n ? [] : typeof n === 'string' ? [n] : n.c.flatMap(leavesOf);

/** Removes leaves not in `items` and collapses a branch left holding one child. */
function prune(n: BannerNode, items: Set<string>): BannerNode | null {
  if (typeof n === 'string') return items.has(n) ? n : null;
  const c = n.c.map((k) => prune(k, items)).filter((k): k is BannerNode => k !== null);
  if (!c.length) return null;
  if (c.length === 1) return c[0];
  /* A branch holding a branch of the same direction is one branch. */
  return branch(n.d, c.flatMap((k) => (typeof k !== 'string' && k.d === n.d ? k.c : [k])));
}

/** Where a newly arrived section goes when nobody has said: a NEW ROW at the foot of the banner.
 *
 * ⚠️ A row, never beside. The banner's shape is the PRESET the admin chose, and a widget that inserted itself
 * into that shape would rearrange a layout they had picked on purpose. Landing underneath leaves the preset
 * intact and hands the new section the one thing it needs — somewhere to be — which is then split into columns
 * by dragging it onto an edge or with the + handles. */
function append(t: BannerNode | null, id: string): BannerNode {
  if (!t) return id;
  if (typeof t !== 'string' && t.d === 'column') return branch('column', [...t.c, id]);
  return branch('column', [t, id]);
}

/** The most SECTIONS one banner holds. Beyond four, no arrangement of them reads cleanly. */
export const MAX_BANNER_SECTIONS = 4;

/** The Text & Search section's node id. Title, one-liner and search are ONE section of the banner. */
export const TEXT_SECTION = 'hero-content';

/** A stored tree from before the section model named the heading and the search as two items; both
 *  are now the one Text & Search section, so the first of them becomes it and the second goes. */
function mergeWords(n: BannerNode): BannerNode {
  let seen = false;
  const walk = (k: BannerNode): BannerNode | null => {
    if (typeof k === 'string') {
      if (k !== 'hero-copy' && k !== 'hero-search' && k !== TEXT_SECTION) return k;
      if (seen) return null;
      seen = true;
      return TEXT_SECTION;
    }
    const c = k.c.map(walk).filter((x): x is BannerNode => x !== null);
    return c.length === 0 ? null : c.length === 1 ? c[0] : branch(k.d, c);
  };
  return walk(n) ?? TEXT_SECTION;
}

/** The arrangement actually drawn: the stored tree, repaired against the items really on the banner. */
export function normalizeTree(stored: unknown, items: string[]): BannerNode | null {
  const set = new Set(items);
  let t = isNode(stored) ? prune(mergeWords(stored), set) : null;
  const have = new Set(leavesOf(t));
  /* The Text group first, so a fresh banner builds the way it always looked: words, then search, then widgets. */
  items.filter((i) => !have.has(i)).forEach((i) => { t = append(t, i); });
  return t;
}

function isNode(n: unknown): n is BannerNode {
  if (typeof n === 'string') return true;
  return !!n && typeof n === 'object' && ((n as { d?: string }).d === 'row' || (n as { d?: string }).d === 'column')
    && Array.isArray((n as { c?: unknown[] }).c) && (n as { c: unknown[] }).c.every(isNode);
}

/** True once any two items sit side by side — the banner is then a grid, not a single stack. */
export const hasRow = (n: BannerNode | null): boolean => !!n && typeof n !== 'string' && (n.d === 'row' || n.c.some(hasRow));

/* ── Presets ─────────────────────────────────────────────────────────────── */

export interface BannerPreset { id: string; label: string; tree: BannerNode }

/* ── PRESETS ─────────────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ A FIXED set of eight shapes, taken from the arrangements that actually repeat across the 37 layout
 * templates — not every combination the current sections could be put in. A list that grew with each widget
 * added (2 sections → 2 presets, 4 → 13) offered a wall of near-identical tiles and asked the admin to pick a
 * layout out of arithmetic; these are the layouts somebody designed.
 *
 * Each shape is written in SLOTS: slot 0 is the first section (the Text & Search section on every banner that
 * has one), and the rest fill in reading order. A preset with more slots than there are sections simply drops
 * the empty ones, and sections past the last slot are appended as their own full-width ROWS at the foot — so a
 * preset never hides a section and never has to be re-chosen after adding one.
 *
 * ⚠️ Deliberately ONE list for every banner. The tiles are the same eight wherever you are, which is what makes
 * them recognisable; what changes is the picture inside each tile, drawn from the sections you actually have. */

type Shape = number | { d: 'row' | 'column'; c: Shape[] };
const R = (...c: Shape[]): Shape => ({ d: 'row', c });
const C = (...c: Shape[]): Shape => ({ d: 'column', c });

const PRESET_SHAPES: { id: string; label: string; s: Shape }[] = [
  { id: 'single', label: 'Stacked', s: 0 },
  { id: 'text-widget', label: 'Two columns', s: R(0, 1) },
  { id: 'widget-text', label: 'Two columns, text right', s: R(1, 0) },
  { id: 'text-two', label: 'Text left, two stacked right', s: R(0, C(1, 2)) },
  { id: 'text-row', label: 'Text over a row', s: C(0, R(1, 2, 3)) },
  { id: 'row-text', label: 'Row over text', s: C(R(1, 2, 3), 0) },
  { id: 'three', label: 'Three across', s: R(1, 0, 2) },
  { id: 'two-strip', label: 'Two columns, strip below', s: C(R(0, 1), 2) },
];

/** A branch holding a branch of the same direction is one branch — the repair `prune` makes, so a preset's
 *  tree is spelled exactly as the drawn tree will be and `activePreset` can match it. */
function flat(n: BannerNode): BannerNode {
  if (typeof n === 'string') return n;
  const c = n.c.map(flat).flatMap((k) => (typeof k !== 'string' && k.d === n.d ? k.c : [k]));
  return c.length === 1 ? c[0] : branch(n.d, c);
}

/** Fills a shape with the sections there are: empty slots collapse, and the rest become rows underneath. */
function fill(s: Shape, ids: string[]): BannerNode | null {
  const used = new Set<number>();
  const walk = (k: Shape): BannerNode | null => {
    if (typeof k === 'number') {
      if (!ids[k]) return null;
      used.add(k);
      return ids[k];
    }
    const c = k.c.map(walk).filter((x): x is BannerNode => x !== null);
    return c.length === 0 ? null : c.length === 1 ? c[0] : branch(k.d, c);
  };
  const body = walk(s);
  if (!body) return null;
  const rest = ids.filter((_, i) => !used.has(i));
  return flat(rest.length ? branch('column', [body, ...rest]) : body);
}

/** The eight presets, drawn for the sections this banner holds. Two shapes that come out identical at this
 *  section count are shown once — two tiles promising the same layout is a choice that is not one. */
export function presetsFor(tree: BannerNode | null): BannerPreset[] {
  const ids = leavesOf(tree);
  if (ids.length < 2) return [];
  const seen = new Set<string>();
  const out: BannerPreset[] = [];
  PRESET_SHAPES.forEach((p) => {
    const t = fill(p.s, ids);
    if (!t) return;
    const key = JSON.stringify(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: p.id, label: p.label, tree: t });
  });
  return out;
}

/** The preset the drawn tree matches, if any. */
export function activePreset(tree: BannerNode | null): string | null {
  const key = JSON.stringify(tree ? flat(tree) : tree);
  return presetsFor(tree).find((p) => JSON.stringify(p.tree) === key)?.id ?? null;
}

/* ── Edits ───────────────────────────────────────────────────────────────── */

/** Puts `newId` beside `anchor`: left/right make a column beside it, top/bottom a row above or below. */
export function insertBeside(tree: BannerNode | null, anchor: string, newId: string, side: 'left' | 'right' | 'top' | 'bottom'): BannerNode {
  if (!tree) return newId;
  const d = side === 'left' || side === 'right' ? 'row' : 'column';
  const before = side === 'left' || side === 'top';
  const walk = (n: BannerNode): BannerNode => {
    if (typeof n === 'string') {
      return n === anchor ? branch(d, before ? [newId, n] : [n, newId]) : n;
    }
    const i = n.c.indexOf(anchor);
    /* Already in a branch of the asked direction — join it rather than nesting a new one. */
    if (i >= 0 && n.d === d) return branch(d, [...n.c.slice(0, before ? i : i + 1), newId, ...n.c.slice(before ? i : i + 1)]);
    return branch(n.d, n.c.map(walk));
  };
  const next = walk(tree);
  return leavesOf(next).includes(newId) ? next : branch(d, before ? [newId, tree] : [tree, newId]);
}

/** Swaps one item for another in the same spot (Replace). */
export const replaceLeaf = (tree: BannerNode | null, from: string, to: string): BannerNode | null =>
  !tree ? tree : typeof tree === 'string' ? (tree === from ? to : tree) : branch(tree.d, tree.c.map((k) => replaceLeaf(k, from, to)!));

/** Flips the outermost arrangement between side by side and stacked, keeping every item and its order. */
export const flipRoot = (tree: BannerNode | null): BannerNode | null =>
  !tree || typeof tree === 'string' ? tree : branch(tree.d === 'row' ? 'column' : 'row', tree.c);

/** Moves an item one place earlier or later in reading order, keeping the arrangement's shape. */
export function shiftLeaf(tree: BannerNode | null, id: string, by: -1 | 1): BannerNode | null {
  const ids = leavesOf(tree);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= ids.length) return tree;
  const swapped = ids.slice();
  [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
  let k = 0;
  const rebuild = (n: BannerNode): BannerNode => (typeof n === 'string' ? swapped[k++] : branch(n.d, n.c.map(rebuild)));
  return tree ? rebuild(tree) : tree;
}

/** Which banner edges a node touches, for items that fill to the banner's edge. */
export type Edges = { top: boolean; right: boolean; bottom: boolean; left: boolean };
export const ALL_EDGES: Edges = { top: true, right: true, bottom: true, left: true };
export function childEdges(parent: { d: 'row' | 'column'; c: BannerNode[] }, i: number, e: Edges): Edges {
  const first = i === 0;
  const last = i === parent.c.length - 1;
  return parent.d === 'row'
    ? { top: e.top, bottom: e.bottom, left: e.left && first, right: e.right && last }
    : { left: e.left, right: e.right, top: e.top && first, bottom: e.bottom && last };
}

/** A stable key for one cell of a row — its items, joined. */
export const cellKey = (n: BannerNode) => leavesOf(n).join('|');

/** A card grid of EXACTLY `cols` equal columns. ⚠️ It used to drop to fewer columns below a minimum card
 *  width, so 3 and 4 silently came out as 2 in a banner column — the count you pick is the count you get;
 *  a narrow banner stacks its rows instead (see `.portal-banner`). */
export const colsTemplate = (cols: number, _gap?: number, _min?: number) => `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`;

/** The column presets a set of `count` cards can take: all in one row, fewer per row, or stacked. */
export function tilePresets(count: number): { cols: number; label: string }[] {
  const n = Math.max(1, Math.min(count, 4));
  const out: { cols: number; label: string }[] = [{ cols: n, label: n === 1 ? 'One column' : 'All in one row' }];
  [3, 2, 1].forEach((c) => { if (c < n) out.push({ cols: c, label: c === 1 ? 'Stacked' : `${c} per row` }); });
  return out;
}

/** The block types that sit in a narrow column beside the words by default. */
export const COMPACT_BANNER_TYPES = new Set(['x-actions', 'x-kpis', 'c-contact']);

/** Puts `newId` at an EDGE of the whole banner: left/right add a column, top/bottom a row. */
export function insertAtEdge(tree: BannerNode | null, newId: string, side: 'left' | 'right' | 'top' | 'bottom'): BannerNode {
  if (!tree) return newId;
  const d = side === 'left' || side === 'right' ? 'row' : 'column';
  const before = side === 'left' || side === 'top';
  if (typeof tree !== 'string' && tree.d === d) return branch(d, before ? [newId, ...tree.c] : [...tree.c, newId]);
  return branch(d, before ? [newId, tree] : [tree, newId]);
}

/** Swaps two items' places, keeping the arrangement's shape. */
export const swapLeaves = (tree: BannerNode | null, a: string, b: string): BannerNode | null =>
  !tree ? tree : typeof tree === 'string' ? (tree === a ? b : tree === b ? a : tree) : branch(tree.d, tree.c.map((k) => swapLeaves(k, a, b)!));

/** Removes one item from the arrangement (its branch collapses if it is left holding one). */
export const removeLeaf = (tree: BannerNode | null, id: string): BannerNode | null => {
  if (!tree) return tree;
  if (typeof tree === 'string') return tree === id ? null : tree;
  const c = tree.c.map((k) => removeLeaf(k, id)).filter((k): k is BannerNode => k !== null);
  return c.length === 0 ? null : c.length === 1 ? c[0] : branch(tree.d, c);
};
