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

/** Where a newly arrived item goes when nobody has said: the search under the words, anything else beside. */
function append(t: BannerNode | null, id: string): BannerNode {
  if (!t) return id;
  if (id === 'hero-search') {
    if (t === 'hero-copy') return branch('column', ['hero-copy', 'hero-search']);
    const put = (n: BannerNode): BannerNode => {
      if (typeof n === 'string') return n === 'hero-copy' ? branch('column', ['hero-copy', 'hero-search']) : n;
      const i = n.c.indexOf('hero-copy');
      if (i >= 0 && n.d === 'column') return branch('column', [...n.c.slice(0, i + 1), 'hero-search', ...n.c.slice(i + 1)]);
      return branch(n.d, n.c.map(put));
    };
    const next = put(t);
    return leavesOf(next).includes('hero-search') ? next : branch('column', [t, 'hero-search']);
  }
  if (typeof t !== 'string' && t.d === 'row') return branch('row', [...t.c, id]);
  return branch('row', [t, id]);
}

/** The arrangement actually drawn: the stored tree, repaired against the items really on the banner. */
export function normalizeTree(stored: unknown, items: string[]): BannerNode | null {
  const set = new Set(items);
  let t = isNode(stored) ? prune(stored, set) : null;
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

type Shape = number | { d: 'row' | 'column'; c: Shape[] };
const R = (...c: Shape[]): Shape => ({ d: 'row', c });
const C = (...c: Shape[]): Shape => ({ d: 'column', c });
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

function shapesFor(n: number): { id: string; label: string; s: Shape }[] {
  if (n <= 1) return [{ id: 'one', label: 'One item', s: 0 }];
  if (n === 2) return [
    { id: 'row', label: 'Side by side', s: R(0, 1) },
    { id: 'stack', label: 'Stacked', s: C(0, 1) },
  ];
  if (n === 3) return [
    { id: 'stack-beside', label: 'Two stacked, one beside', s: R(C(0, 1), 2) },
    { id: 'beside-stack', label: 'One, two stacked beside', s: R(0, C(1, 2)) },
    { id: 'two-over-one', label: 'Two side by side, one below', s: C(R(0, 1), 2) },
    { id: 'one-over-two', label: 'One on top, two below', s: C(0, R(1, 2)) },
    { id: 'row', label: 'Three across', s: R(0, 1, 2) },
    { id: 'stack', label: 'Stacked', s: C(0, 1, 2) },
  ];
  if (n === 4) return [
    { id: 'two-stacks', label: 'Two stacks', s: R(C(0, 1), C(2, 3)) },
    { id: 'grid', label: 'Two by two', s: C(R(0, 1), R(2, 3)) },
    { id: 'stack-beside', label: 'Three stacked, one beside', s: R(C(0, 1, 2), 3) },
    { id: 'beside-stack', label: 'One, three stacked beside', s: R(0, C(1, 2, 3)) },
    { id: 'three-over-one', label: 'Three side by side, one below', s: C(R(0, 1, 2), 3) },
    { id: 'row', label: 'Four across', s: R(0, 1, 2, 3) },
    { id: 'stack', label: 'Stacked', s: C(0, 1, 2, 3) },
  ];
  const half = Math.ceil(n / 2);
  return [
    { id: 'two-stacks', label: 'Two stacks', s: R(C(...range(0, half)), C(...range(half, n))) },
    { id: 'stack-beside', label: 'Stack, one beside', s: R(C(...range(0, n - 1)), n - 1) },
    { id: 'row-over-one', label: 'Row, one below', s: C(R(...range(0, n - 1)), n - 1) },
    { id: 'stack', label: 'Stacked', s: C(...range(0, n)) },
  ];
}

const build = (s: Shape, ids: string[]): BannerNode => (typeof s === 'number' ? ids[s] : branch(s.d, s.c.map((k) => build(k, ids))));

/** The arrangements on offer for these items, in their current order. */
export function presetsFor(tree: BannerNode | null): BannerPreset[] {
  const ids = leavesOf(tree);
  return shapesFor(ids.length).map((p) => ({ id: p.id, label: p.label, tree: build(p.s, ids) }));
}

/** The preset the drawn tree matches, if any. */
export function activePreset(tree: BannerNode | null): string | null {
  const key = JSON.stringify(tree);
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
