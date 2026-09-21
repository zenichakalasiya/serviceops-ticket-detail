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

/* ⚠️ A branch may be a GROUP (`g`) — one SET of cards, which is ONE section however many cards
   are in it. Without it the banner had no way to say "these belong together": every card was a
   section of its own, so four of them filled a banner that holds four sections and left no room for
   anything else, and any preset would scatter them into separate rows. It is the banner's answer to
   the page's GATHERING rule, and it is what lets a row of cards be arranged, moved and counted as
   the one thing the admin thinks they placed. */
export type BannerNode = string | { d: 'row' | 'column'; c: BannerNode[]; g?: true };

/* ⚠️ ONE constructor, and the key order is always d, c, g — `activePreset` compares trees by
   JSON.stringify, which preserves insertion order, so two ways of building the same node would read
   as two different layouts. */
const branch = (d: 'row' | 'column', c: BannerNode[], g?: true): BannerNode => (g ? { d, c, g } : { d, c });

export const leavesOf = (n: BannerNode | null | undefined): string[] =>
  !n ? [] : typeof n === 'string' ? [n] : n.c.flatMap(leavesOf);

/** A branch the builder made to hold one set of cards. */
export const isGroup = (n: BannerNode | null | undefined): n is { d: 'row' | 'column'; c: BannerNode[]; g: true } =>
  !!n && typeof n !== 'string' && n.g === true;

/** The banner's SECTIONS — its leaves, except that a group of cards counts as one.
 *  This is what the four-section cap counts and what the presets arrange. */
export const unitsOf = (n: BannerNode | null | undefined): BannerNode[] =>
  !n ? [] : typeof n === 'string' ? [n] : isGroup(n) ? [n] : n.c.flatMap(unitsOf);

/** The group holding this item, while it is in one. */
export function groupOf(tree: BannerNode | null | undefined, id: string): BannerNode | null {
  if (!tree || typeof tree === 'string') return null;
  if (isGroup(tree) && leavesOf(tree).includes(id)) return tree;
  for (const k of tree.c) { const f = groupOf(k, id); if (f) return f; }
  return null;
}

/** Puts `newId` in `anchor`'s group, making one of the two if `anchor` is on its own.
 *  ⚠️ A ROW: cards gather ACROSS. Stacking them is what the section's own column preset is for,
 *  and that is a control you can change, where a shape chosen by the act of adding is not. */
export function addToGroup(tree: BannerNode | null, anchor: string, newId: string): BannerNode {
  if (!tree) return branch('row', [anchor, newId], true);
  const walk = (n: BannerNode): BannerNode => {
    if (typeof n === 'string') return n === anchor ? branch('row', [n, newId], true) : n;
    if (isGroup(n) && n.c.includes(anchor)) return branch(n.d, [...n.c, newId], true);
    return branch(n.d, n.c.map(walk), n.g);
  };
  return walk(tree);
}

/** The most cards one gathered row holds — the page's own four-columns-to-a-row rule. */
export const MAX_BANNER_CARDS = 4;

/** Removes leaves not in `items` and collapses a branch left holding one child. */
function prune(n: BannerNode, items: Set<string>): BannerNode | null {
  if (typeof n === 'string') return items.has(n) ? n : null;
  const c = n.c.map((k) => prune(k, items)).filter((k): k is BannerNode => k !== null);
  if (!c.length) return null;
  if (c.length === 1) return c[0];
  /* A branch holding a branch of the same direction is one branch — unless the child is a GROUP,
     which is one section and has to stay whole.
     ⚠️ A group left holding ONE card is not a group: the c.length === 1 line above returns that
     card, so deleting cards down to the last one hands its section back with nothing to clean up. */
  return branch(n.d, c.flatMap((k) => (typeof k !== 'string' && !k.g && k.d === n.d ? k.c : [k])), n.g);
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
    return c.length === 0 ? null : c.length === 1 ? c[0] : branch(k.d, c, k.g);
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

/* ⚠️ The set is chosen by HOW MANY sections the banner holds, and every shape in it is a different
 * ARRANGEMENT — never the same arrangement mirrored. A banner takes at most four sections, so these
 * ten shapes are the whole vocabulary; anything else on offer was a tile that re-placed the same
 * sections in the same relationship and asked the admin to tell two identical layouts apart.
 * Slot 0 is the first section — the Text & Search one on every banner that has it. */
const PRESET_SHAPES: Record<number, { id: string; label: string; s: Shape }[]> = {
  2: [
    { id: 'two-rows', label: 'Two rows', s: C(0, 1) },
    { id: 'two-cols', label: 'Two columns', s: R(0, 1) },
  ],
  3: [
    { id: 'three-rows', label: 'Three rows', s: C(0, 1, 2) },
    { id: 'three-cols', label: 'Three columns', s: R(0, 1, 2) },
    { id: 'two-cols-row', label: 'Two columns, then a row', s: C(R(0, 1), 2) },
    { id: 'col-two-rows', label: 'A column, and two rows beside it', s: R(0, C(1, 2)) },
  ],
  4: [
    { id: 'four-rows', label: 'Four rows', s: C(0, 1, 2, 3) },
    { id: 'two-cols-two-rows', label: 'Two columns, then two rows', s: C(R(0, 1), 2, 3) },
    { id: 'three-cols-row', label: 'Three columns, then a row', s: C(R(0, 1, 2), 3) },
    { id: 'split-col-row', label: 'Two columns — the second split — then a row', s: C(R(0, C(1, 2)), 3) },
  ],
};

/** A branch holding a branch of the same direction is one branch — the repair `prune` makes, so a preset's
 *  tree is spelled exactly as the drawn tree will be and `activePreset` can match it. */
function flat(n: BannerNode): BannerNode {
  if (typeof n === 'string') return n;
  /* A group is one section — flattening it into its parent spills the cards across the banner. */
  if (n.g) return branch(n.d, n.c.map(flat), n.g);
  const c = n.c.map(flat).flatMap((k) => (typeof k !== 'string' && !k.g && k.d === n.d ? k.c : [k]));
  return c.length === 1 ? c[0] : branch(n.d, c);
}

/** Fills a shape with the sections there are: empty slots collapse, and the rest become rows underneath.
 *  ⚠️ A section is a NODE, not an id — a gathered row of cards is one section and is placed whole. */
function fill(s: Shape, units: BannerNode[]): BannerNode | null {
  const used = new Set<number>();
  const walk = (k: Shape): BannerNode | null => {
    if (typeof k === 'number') {
      if (!units[k]) return null;
      used.add(k);
      return units[k];
    }
    const c = k.c.map(walk).filter((x): x is BannerNode => x !== null);
    return c.length === 0 ? null : c.length === 1 ? c[0] : branch(k.d, c);
  };
  const body = walk(s);
  if (!body) return null;
  const rest = units.filter((_, i) => !used.has(i));
  return flat(rest.length ? branch('column', [body, ...rest]) : body);
}

/** The presets for the number of sections this banner holds. Two shapes that come out identical at this
 *  section count are shown once — two tiles promising the same layout is a choice that is not one. */
export function presetsFor(tree: BannerNode | null): BannerPreset[] {
  /* ⚠️ SECTIONS, not leaves: a gathered row of cards is one thing to arrange, so four cards beside
     the words offer the TWO-section shapes rather than falling off the end of the set. */
  const ids = unitsOf(tree);
  if (ids.length < 2) return [];
  /* ⚠️ Above four there is no set, because `MAX_BANNER_SECTIONS` is four — a banner that somehow
     carries more falls back to the four-section shapes, and `fill` appends the extras as rows. */
  const shapes = PRESET_SHAPES[Math.min(ids.length, 4)] ?? [];
  const seen = new Set<string>();
  const out: BannerPreset[] = [];
  shapes.forEach((p) => {
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
    /* ⚠️ A GROUP is ATOMIC here: aiming at one of its cards lands the new item beside the WHOLE
       row of them, never inside it. A group is the set of cards somebody gathered, and an
       Announcements dropped into the middle of it would be a section that is partly a card row. */
    if (isGroup(n)) return leavesOf(n).includes(anchor) ? branch(d, before ? [newId, n] : [n, newId]) : n;
    const i = n.c.indexOf(anchor);
    /* Already in a branch of the asked direction — join it rather than nesting a new one. */
    if (i >= 0 && n.d === d) return branch(d, [...n.c.slice(0, before ? i : i + 1), newId, ...n.c.slice(before ? i : i + 1)], n.g);
    return branch(n.d, n.c.map(walk), n.g);
  };
  const next = walk(tree);
  return leavesOf(next).includes(newId) ? next : branch(d, before ? [newId, tree] : [tree, newId]);
}

/** Swaps one item for another in the same spot (Replace). */
export const replaceLeaf = (tree: BannerNode | null, from: string, to: string): BannerNode | null =>
  !tree ? tree : typeof tree === 'string' ? (tree === from ? to : tree) : branch(tree.d, tree.c.map((k) => replaceLeaf(k, from, to)!), tree.g);

/** Flips the outermost arrangement between side by side and stacked, keeping every item and its order. */
export const flipRoot = (tree: BannerNode | null): BannerNode | null =>
  !tree || typeof tree === 'string' ? tree : branch(tree.d === 'row' ? 'column' : 'row', tree.c, tree.g);

/** Moves an item one place earlier or later in reading order, keeping the arrangement's shape. */
export function shiftLeaf(tree: BannerNode | null, id: string, by: -1 | 1): BannerNode | null {
  const ids = leavesOf(tree);
  const i = ids.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= ids.length) return tree;
  const swapped = ids.slice();
  [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
  let k = 0;
  const rebuild = (n: BannerNode): BannerNode => (typeof n === 'string' ? swapped[k++] : branch(n.d, n.c.map(rebuild), n.g));
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
export const cellKey = (n: BannerNode) => leavesOf(n).join("|");

/* ── A banner ROW or COLUMN as a selectable node ────────────────────────────────
 *
 * ⚠️ The id is built from the SECTIONS the branch holds, never from its position in the tree. A
 * branch IS its sections — that is the whole of what it is — so an id made this way survives a
 * sibling arriving, a preset being re-picked, and the branch moving up or down the banner, and it
 * changes exactly when the branch stops being the same branch. The positional ids the page boxes
 * abandoned (`sec-3-c0`) are the cautionary tale: they renamed every box after an insert, and
 * every stored value landed on the wrong one. */
export const bannerBoxId = (n: BannerNode) => "hero-bx-" + cellKey(n);
export const isBannerBox = (id: string) => id.startsWith("hero-bx-");

/** The branch this id names, while the tree still holds one. */
export function bannerBranch(tree: BannerNode | null | undefined, id: string): { d: "row" | "column"; c: BannerNode[] } | null {
  if (!tree || typeof tree === "string") return null;
  if (bannerBoxId(tree) === id) return tree;
  for (const k of tree.c) { const f = bannerBranch(k, id); if (f) return f; }
  return null;
}

/** Flips one branch between laying its sections across and stacking them — children and order untouched. */
export function setBannerBoxDir(tree: BannerNode, id: string, d: "row" | "column"): BannerNode {
  if (typeof tree === "string") return tree;
  if (bannerBoxId(tree) === id) return branch(d, tree.c, tree.g);
  return branch(tree.d, tree.c.map((k) => setBannerBoxDir(k, id, d)), tree.g);
}

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
export const COMPACT_BANNER_TYPES = new Set(['x-actions', 'x-kpis', 'x-action-card', 'x-kpi', 'c-contact']);

/** Puts `newId` at an EDGE of the whole banner: left/right add a column, top/bottom a row. */
export function insertAtEdge(tree: BannerNode | null, newId: string, side: 'left' | 'right' | 'top' | 'bottom'): BannerNode {
  if (!tree) return newId;
  const d = side === 'left' || side === 'right' ? 'row' : 'column';
  const before = side === 'left' || side === 'top';
  /* ⚠️ Never INTO a group: the banner's own edge adders put a section beside the cards, not among them. */
  if (typeof tree !== 'string' && !tree.g && tree.d === d) return branch(d, before ? [newId, ...tree.c] : [...tree.c, newId]);
  return branch(d, before ? [newId, tree] : [tree, newId]);
}

/** Swaps two items' places, keeping the arrangement's shape. */
export const swapLeaves = (tree: BannerNode | null, a: string, b: string): BannerNode | null =>
  !tree ? tree : typeof tree === 'string' ? (tree === a ? b : tree === b ? a : tree) : branch(tree.d, tree.c.map((k) => swapLeaves(k, a, b)!), tree.g);

/** Removes one item from the arrangement (its branch collapses if it is left holding one). */
export const removeLeaf = (tree: BannerNode | null, id: string): BannerNode | null => {
  if (!tree) return tree;
  if (typeof tree === 'string') return tree === id ? null : tree;
  const c = tree.c.map((k) => removeLeaf(k, id)).filter((k): k is BannerNode => k !== null);
  return c.length === 0 ? null : c.length === 1 ? c[0] : branch(tree.d, c, tree.g);
};
