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

/* ⚠️ Presets arrange the banner's MAIN GROUPS, not its individual items. The Text group and the search are
   one group — they read as one sentence and are never pulled apart by a preset — and every widget on the
   banner is a group of its own. A banner holds at most THREE COLUMNS (beyond that nothing is readable),
   but any number of rows, so the set on offer is every way of laying the groups out as:
     · columns (1–3), each column stacking its groups, or
     · rows of up to three groups each, stacked.
   Order is always kept — a preset rearranges the same groups in the same reading order. */

/** Ordered ways to split `n` into parts, each part ≤ `maxPart`, using at most `maxParts` parts. */
function compositions(n: number, maxPart: number, maxParts: number): number[][] {
  const out: number[][] = [];
  const walk = (left: number, acc: number[]) => {
    if (left === 0) { out.push(acc); return; }
    if (acc.length >= maxParts) return;
    for (let p = 1; p <= Math.min(maxPart, left); p++) walk(left - p, [...acc, p]);
  };
  walk(n, []);
  return out;
}

/** A branch holding a branch of the same direction is one branch — the same repair `prune` makes, so a
 *  preset's tree is spelled exactly as the drawn tree will be. */
function flat(n: BannerNode): BannerNode {
  if (typeof n === 'string') return n;
  const c = n.c.map(flat).flatMap((k) => (typeof k !== 'string' && k.d === n.d ? k.c : [k]));
  return c.length === 1 ? c[0] : branch(n.d, c);
}

/** The banner's groups in reading order: Text + Search together, then each widget. */
function groupsOf(tree: BannerNode | null): BannerNode[] {
  const ids = leavesOf(tree);
  const out: BannerNode[] = [];
  let wordsAt = -1;
  ids.forEach((id) => {
    if (id === 'hero-copy' || id === 'hero-search') {
      if (wordsAt < 0) { wordsAt = out.length; out.push(id); }
      else { const w = out[wordsAt] as string; out[wordsAt] = branch('column', w === 'hero-copy' ? [w, id] : [id, w]); }
      return;
    }
    out.push(id);
  });
  return out;
}

const split = (items: BannerNode[], parts: number[]) => {
  let i = 0;
  return parts.map((p) => { const s = items.slice(i, i + p); i += p; return s; });
};
const one = (d: 'row' | 'column', list: BannerNode[]): BannerNode => (list.length === 1 ? list[0] : branch(d, list));

/** Every arrangement of the banner's groups: up to three columns, rows of up to three. */
function presetList(groups: BannerNode[]): BannerPreset[] {
  const n = groups.length;
  if (n <= 1) return [];
  const seen = new Set<string>();
  const out: BannerPreset[] = [];
  const add = (id: string, label: string, t: BannerNode) => {
    const tree = flat(t);
    const key = JSON.stringify(tree);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id, label, tree });
  };
  /* Columns — each column a stack of its groups. */
  for (let k = Math.min(3, n); k >= 2; k--) {
    compositions(n, n, k).filter((p) => p.length === k).forEach((parts) => {
      const cols = split(groups, parts).map((g) => one('column', g));
      const label = parts.every((p) => p === 1) ? `${k} columns` : `${k} columns · ${parts.join(' + ')}`;
      add(`cols-${parts.join('-')}`, label, branch('row', cols));
    });
  }
  /* Rows — each row up to three groups side by side. Past four groups only the even fills are offered, so
     the list stays a choice rather than a catalogue. */
  compositions(n, 3, n)
    .filter((p) => p.length >= 2)
    .filter((p) => n <= 4 || p.every((x, i) => i === 0 || x <= p[i - 1]))
    .forEach((parts) => {
      const rows = split(groups, parts).map((g) => one('row', g));
      const label = parts.every((p) => p === 1) ? 'Stacked' : `Rows · ${parts.join(' then ')}`;
      add(`rows-${parts.join('-')}`, label, branch('column', rows));
    });
  return out;
}

/** The arrangements on offer for these items, in their current order. */
export function presetsFor(tree: BannerNode | null): BannerPreset[] {
  return presetList(groupsOf(tree));
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
