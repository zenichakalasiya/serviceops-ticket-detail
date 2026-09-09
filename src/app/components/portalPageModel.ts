import type { CSSProperties } from 'react';
/* Support Portal builder — the page model.
 *
 * Three things live here and nothing else does:
 *   1. NODES     — every selectable thing on the canvas, and its parent, so the chip's chevron can
 *                  step up a level. Selection is EXPLICIT rather than DOM-walked: a fixed registry
 *                  is what lets the panel know which editor to show and the toolbar know which
 *                  actions apply.
 *   2. CONTENT   — the editable values the canvas renders. The panel writes here, the preview reads
 *                  here, so an edit is visible immediately and the two cannot drift.
 *   3. STYLE     — per-node visual overrides, applied by the preview.
 */

export type NodeKind =
  | 'section'   // a page band: hero, a card block, the footer
  | 'column'    // a column inside an added section
  | 'card'      // a tile inside a row (a quick-action card)
  | 'text'      // an editable string — gets the rich-text toolbar
  | 'search'    // the hero search field
  | 'nav'       // the header's link row
  | 'rail'      // the left icon rail
  | 'list';     // a data list inside a card block

/** Which content editor the panel renders for a node. */
export type ContentKind =
  | 'hero' | 'quickActions' | 'actionCard' | 'requests' | 'approvals'
  | 'knowledge' | 'assets' | 'cis' | 'text' | 'nav' | 'search' | 'row' | 'placed'
  | 'item' | 'subelement' | 'none';

export interface PortalNodeDef {
  id: string;
  /** Shown in the canvas chip and as the panel title. */
  name: string;
  /** Text nodes only: its value is HTML, so inline editing commits markup and Enter breaks a line. */
  rich?: boolean;
  kind: NodeKind;
  /** Parent node id — drives the chip's ❯ step-up and the panel breadcrumb. */
  parent?: string;
  content: ContentKind;
}

/* ⚠️ Every id here must be rendered by SupportPortalPreview with the same id, or the chip will name
 *    something the panel cannot edit. Keep the two in step. */
export const PORTAL_NODES: PortalNodeDef[] = [
  /* L0 — the page itself. Not drawn on the canvas, but it OWNS the theme, so it needs a node or
     its drawer has nothing to describe. */
  { id: 'page', name: 'Page', kind: 'section', content: 'none' },

  // ── chrome ──
  { id: 'header', name: 'Header', kind: 'section', content: 'none' },
  { id: 'header-logo', name: 'Logo', kind: 'card', parent: 'header', content: 'none' },
  { id: 'header-actions', name: 'Actions', kind: 'card', parent: 'header', content: 'none' },
  { id: 'rail', name: 'Sidebar', kind: 'rail', content: 'none' },

  // ── hero ──
  { id: 'hero', name: 'Hero', kind: 'section', content: 'hero' },
  { id: 'hero-title', name: 'Heading', kind: 'text', parent: 'hero', content: 'text' },
  { id: 'hero-subtitle', name: 'Subtitle', kind: 'text', parent: 'hero', content: 'text' },
  { id: 'hero-search', name: 'Search', kind: 'search', parent: 'hero', content: 'search' },

  /* ── quick actions ──
   * The row IS the section — full width, left edge to right edge — and each tile is a column
   * inside it. That is what lets an admin restyle or re-lay-out the whole band at once instead of
   * three cards one at a time. */
  { id: 'quick', name: 'Quick Actions', kind: 'section', content: 'quickActions' },
  { id: 'quick-incident', name: 'New Incident', kind: 'card', parent: 'quick', content: 'actionCard' },
  { id: 'quick-service', name: 'Request Service', kind: 'card', parent: 'quick', content: 'actionCard' },
  { id: 'quick-knowledge', name: 'Knowledge', kind: 'card', parent: 'quick', content: 'actionCard' },
  /* ⚠️ Declared but NOT in DEFAULT_CONTENT.quick — the node has to exist for selection and for the
     drawer to describe it, while the page stays three cards until an admin adds the fourth. */
  { id: 'quick-ad', name: 'AD Self Service', kind: 'card', parent: 'quick', content: 'actionCard' },
  /* ⚠️ DECLARED even though the page does not ship with one. A card that is not a node still
     RENDERS — `Sel` falls back to a plain div — but it cannot be selected, cannot be named in the
     breadcrumb and opens a blank panel: exactly what "I added a card and nothing happened" looks
     like from the outside, with the card sitting there in plain sight. Same reason `quick-ad` is
     declared here and only sometimes on the page. */
  { id: 'quick-link', name: 'External link', kind: 'card', parent: 'quick', content: 'actionCard' },

  /* ── the two service rows ──
   * ⚠️ Fixed page blocks, NOT palette elements. What they list is chosen by the REQUESTER — their
   * pinned services, and what the organisation asks for most — so an admin adding or removing the
   * section would be arranging a list they do not populate. That is why neither appears in the
   * widget library and why neither can be deleted: the section is the product's, its contents are
   * the requester's, and only the tile's shape is the admin's. */
  { id: 'favourites', name: 'Favourite Services', kind: 'card', content: 'row' },
  { id: 'services', name: 'Most Used Services', kind: 'card', content: 'row' },

  // ── the work row — one section, three cards ──
  { id: 'work', name: 'Cards Row', kind: 'section', content: 'row' },
  /* ⚠️ The work band's two REGIONS, as sections of their own. The band holds a main area of work
     cards and a rail beside it, and until now both were anonymous divs — so the only Layout panel
     anywhere near them belonged to the band, and it described five cards that are really two groups.
     As nodes they are each selectable and each carry their own Layout, which is what lets the 2×2
     be re-laid-out without touching the rail and the other way round. */
  { id: 'work-main', name: 'Work Cards', kind: 'section', parent: 'work', content: 'row' },
  { id: 'work-rail', name: 'Side Rail', kind: 'section', parent: 'work', content: 'row' },
  { id: 'requests', name: 'My Requests', kind: 'card', parent: 'work', content: 'requests' },
  /* ⚠️ No '-title' nodes for these three — see hasFixedTitle. A node nothing renders is a
     breadcrumb waiting to name a layer that is not there. */
  /* ⚠️ There is no 'requests-list' node. The rows inside My Open Requests were their own selectable
     layer with their own panel — Statuses, Scope, Show — which was a second place to configure the
     same widget, reachable only by clicking the rows rather than the card. It also contradicted the
     widget above it: the card's own panel is gone now because the backend decides what this list
     shows, so a nested layer still offering to filter it was offering something that no longer
     existed anywhere else. Clicking the rows selects the CARD, which is the thing you can act on. */

  { id: 'approvals', name: 'Approvals', kind: 'card', parent: 'work', content: 'approvals' },

  { id: 'knowledge', name: 'Knowledge', kind: 'card', parent: 'work', content: 'knowledge' },

  /* Records row — Assets and CIs were floating as their own bands. Every card now lives inside a
     parent section, so the whole row can be styled, spaced and re-laid-out as one thing. */
  /* The v2 rail. ⚠️ Announcements and Contact Us existed only as PLACEABLE elements, so a page
     could carry them but no page shipped with them and nothing could address them by name. As
     nodes they can sit in a fixed rail, be selected, styled and ordered like every other block —
     and they render through the very same renderers the placed elements use, so there is one
     Announcements in this product rather than two that drift. */
  { id: 'news', name: 'Announcements', kind: 'card', parent: 'work', content: 'row' },
  { id: 'contact', name: 'Contact Us', kind: 'card', parent: 'work', content: 'row' },

  { id: 'records', name: 'Records Row', kind: 'section', content: 'row' },
  { id: 'assets', name: 'My Assets', kind: 'card', parent: 'records', content: 'assets' },
  { id: 'cis', name: 'My CIs', kind: 'card', parent: 'records', content: 'cis' },
];

/* Sections an admin adds are not in the static registry — their ids carry their own shape:
 *   sec-3        a section
 *   sec-3-c0     column 0 of that section
 * so a node can be described without threading the sections array through the canvas. */
/** Placed elements register here so `nodeById` can describe them without a lookup table. */
const PLACED: Record<string, { name: string; type: string; parent: string }> = {};
export const registerPlaced = (id: string, name: string, type: string, parent: string) => {
  PLACED[id] = { name, type, parent };
};
/* Boxes register their place in the tree so `nodeById` stays a pure lookup.
 *
 * ⚠️ This replaces a REGEX. The old ids carried their own shape (`sec-3-c0` was column 0 of
 * section 3), which is what let the canvas describe a node without being handed the sections array.
 * A tree has no such shape — depth and parentage are not recoverable from `sec-3-b7` — so the
 * renderer registers each box as it draws it. Same pattern, same file, no new concept.
 *
 * ⚠️ `parentDir` is the PARENT's direction, because that is what names the box: a child of a row is
 * a Column, a child of a column is a Row. Derived, never stored, so flipping a parent renames its
 * children and the words can never go stale. */
const BOXES: Record<string, { parent?: string; parentDir: BoxDir; depth: number }> = {};
export const registerBox = (id: string, parentDir: BoxDir, depth: number, parent?: string) => {
  BOXES[id] = { parent, parentDir, depth };
};
export const boxInfo = (id: string) => BOXES[id];

/** The element sitting inside this container, if one is. A column holds at most one. */
export const placedIn = (parentId: string) => Object.keys(PLACED).find((k) => PLACED[k].parent === parentId) ?? null;

/* Collection items and their sub-elements (spec §4).
 *
 * An item's id carries its whole lineage — `el-3~i2` is item 2 of widget el-3, `el-3~i2~answer` is
 * that item's Answer sub-element — so a node can be described without threading the collection
 * through the canvas, exactly the way added sections already work.
 *
 * ⚠️ Names are REGISTERED rather than derived. §2.1 says an item is titled by its own text ("How do
 * I reset my password?"), which lives in the widget's config; a registry keeps `nodeById` a pure
 * lookup instead of giving it a dependency on the config store. */
const ITEM_NAMES: Record<string, string> = {};
export const registerItemName = (id: string, name: string) => { ITEM_NAMES[id] = name; };

export const itemNodeId = (widgetId: string, itemId: string) => `${widgetId}~i${itemId}`;
export const subNodeId = (itemNode: string, part: string) => `${itemNode}~${part}`;
/** `el-3~i2` → `{ widget: 'el-3', item: '2' }`, or null when the id is not an item. */
export function parseItemId(id: string): { widget: string; item: string; part?: string } | null {
  const m = /^(.+?)~i([^~]+)(?:~(.+))?$/.exec(id);
  return m ? { widget: m[1], item: m[2], part: m[3] } : null;
}

export function nodeById(id: string): PortalNodeDef | undefined {
  const found = PORTAL_NODES.find((n) => n.id === id);
  if (found) return found;
  const placed = PLACED[id];
  if (placed) {
    return { id, name: placed.name, kind: renderSpec(placed.type).kind, parent: placed.parent, content: 'placed' };
  }
  const item = parseItemId(id);
  if (item) {
    return item.part
      ? { id, name: ITEM_NAMES[id] ?? item.part, kind: 'text', parent: itemNodeId(item.widget, item.item), content: 'subelement' }
      : { id, name: ITEM_NAMES[id] ?? 'Item', kind: 'card', parent: item.widget, content: 'item' };
  }
  /* A quick-action card carries its own text nodes, so the words are edited by clicking them.
     ⚠️ Only CONFIGURED copy gets a node. A live-data row — a request, an approval, an article —
     comes from the backend and is not the admin's to rewrite, so it is never selectable. */
  /* A list widget's heading and "View all" link — selectable in their own right so the drawer can
     answer about them rather than about the widget they sit in. */
  /* ⚠️ `label` and `sub` belong here too. A KPI's caption and a card's subtext are the same kind
     of thing as a widget heading — words the admin wrote — and leaving them out of this list is why
     they could be seen on the canvas but never edited there. */
  /* ⚠️ `cl0` / `cv0` are a contact line's LABEL and VALUE. A widget with a fixed set of authored
     rows needs a node per part, and the four generic suffixes could not name six things. They are
     numbered rather than named because the rows are positional — line 0 is line 0 whatever it is
     currently called, which is what lets the label itself be editable. */
  /* An image's caption. Its own node, so clicking the words under a picture edits THE WORDS —
     before this the caption was reachable only from the image's panel, three fields down. */
  const cap = /^(.+)-caption$/.exec(id);
  if (cap) return { id, name: 'Caption', kind: 'text', rich: true, parent: cap[1], content: 'text' };
  const listTxt = /^(.+)-(title|sub|label|viewall|cl\d+|cv\d+)$/.exec(id);
  if (listTxt && !/^quick-/.test(id)) {
    return {
      id,
      name: (/^cl/.test(listTxt[2]) ? 'Label' : /^cv/.test(listTxt[2]) ? 'Value'
        : ({ title: 'Heading', sub: 'Subtext', label: 'Label', viewall: 'Link' } as Record<string, string>)[listTxt[2]]),
      kind: 'text',
      parent: listTxt[1],
      content: 'text',
    };
  }
  const ico = /^(.+)-icon$/.exec(id);
  if (ico) return { id, name: 'Icon', kind: 'icon', parent: ico[1], content: 'none' };
  const txt = /^(quick-[a-z]+)-(title|sub)$/.exec(id);
  if (txt) {
    return {
      id,
      name: txt[2] === 'title' ? 'Title' : 'Subtext',
      kind: 'text',
      parent: txt[1],
      content: 'text',
    };
  }
  /* ⚠️ A box is named by its PARENT’s direction — a child of a row is a Column, a child of a
     column is a Row — so a section flipped from row to column renames every child for free.
     Storing the name would leave "Column" written on something that is now stacked. */
  const box = BOXES[id];
  if (box) return { id, name: box.parentDir === 'row' ? 'Column' : 'Row', kind: 'column', parent: box.parent, content: 'none' };
  if (/^sec-\d+$/.test(id)) return { id, name: 'Section', kind: 'section', content: 'none' };
  return undefined;
}

/** The catalogue type behind a placed node, for the panel's content editor. */
export const placedType = (id: string) => PLACED[id]?.type;

/** ['hero', 'hero-title'] — root first, for the panel breadcrumb. */
export function nodePath(id: string): PortalNodeDef[] {
  const out: PortalNodeDef[] = [];
  let cur = nodeById(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parent ? nodeById(cur.parent) : undefined;
  }
  return out;
}

/* ── Content ─────────────────────────────────────────────────────────────── */

/** The statuses a requester's list can be filtered to — ServiceOps' own set. */
export const REQUEST_STATUSES = ['Open', 'In Progress', 'Pending', 'On Hold', 'Resolved', 'Closed', 'Reopened'];
export const REQUEST_SCOPES = ['Raised by me', 'Raised for me', 'All in my department', 'Everything I can view'];

export interface PortalPageContent {
  /** Columns each full-width row is laid out in — the section's own layout. */
  cols: { quick: number; work: number; records: number };
  hero: { title: string; subtitle: string; placeholder: string; showSearch: boolean };
  quick: { id: string; title: string; desc: string }[];
  requests: { title: string; statuses: string[]; scope: string; show: number };
  approvals: { title: string; show: number };
  knowledge: { title: string; show: number };
  assets: { title: string };
  cis: { title: string };
}

/* Page order and membership — what the toolbar's move / delete actions actually rewrite.
 *
 * The hero is not in the list: the quick-actions row overlaps it by a negative margin, so it is the
 * one band whose position is structural rather than a preference. */
/* ⚠️ Both service rows sit directly under Quick Actions. Everything a requester can START is then
   in the top third — the four action cards, their pinned services, the ones everyone asks for —
   and the lists of things already in flight follow underneath. */
export const DEFAULT_BLOCK_ORDER = ['quick', 'favourites', 'services', 'work', 'records'];

/* ── v2: the live product's arrangement ──────────────────────────────────────
 *
 * ⚠️ Seeds, not a second renderer. Everything below is the SAME bands, cards and widgets the page
 * has always had, in a different order with a different column count — which is the whole reason
 * the arrangement is data. A layout that needed its own rendering path would be a second page to
 * maintain, and the two would drift the first time a widget changed.
 *
 * The differences from v1, all of them:
 *   • no Most Used Services row
 *   • the work band is Requests + Approvals beside a stacked RAIL of Announcements, Most Read and
 *     Contact Us, instead of three equal cards
 *   • My Assets and My CIs are full-width rows of tiles rather than two columns of list rows */
/* ⚠️ NO `records` band. My Assets and My CIs moved INTO the work band, because the page reads as
   two regions and not four bands: a MAIN area of work cards on the left and a tall rail on the
   right. Left as their own full-width band underneath, they ran the whole page width while the rail
   beside them was still going — so the rail ended level with nothing, and the two widest cards on
   the page were the two with the least in them. */
export const BLOCK_ORDER_V2 = ['quick', 'favourites', 'work'];

export const ROW_ORDER_V2: Record<string, string[]> = {
  quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
  /* The rail's three ride in the same list, so reordering and removal work on them exactly as they
     do on the two cards beside them. Which of them the rail holds is `RAIL_V2`. */
  /* ⚠️ Assets and CIs stay in `records`, NOT in `work`, even though v2 DRAWS them inside the work
     band. `rowOf` searches both layouts' maps and returns the first row that claims an id, so
     listing them under `work` made `rowOf('assets')` answer "work" for v1 too — and v1 renders
     them in the records band, where `card()` then found them absent from `rowOrder.work` and
     returned null. Membership is which LIST reorders a card; where it is painted is the layout's
     business, and the two are not the same question. */
  work: ['requests', 'approvals', 'news', 'knowledge', 'contact'],
  records: ['assets', 'cis'],
};

/** The work-band members that stack into the right-hand rail, in the order they stack. */
export const RAIL_V2 = ['news', 'knowledge', 'contact'];

/** The work-band members in the MAIN area, laid out two to a line beside the rail. */
export const MAIN_V2 = ['requests', 'approvals', 'assets', 'cis'];

export const DEFAULT_ROW_ORDER: Record<string, string[]> = {
  quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
  work: ['requests', 'approvals', 'knowledge'],
  records: ['assets', 'cis'],
};

/** Which row a fixed card belongs to, so a move knows which list to reorder.
 *
 *  ⚠️ Both layouts' rows are searched. `news` and `contact` are members of the work row only in
 *  v2, and a lookup that knew about v1 alone would return undefined for them — which is how a card
 *  ends up unable to move, with nothing on screen saying why. */
export function rowOf(nodeId: string): string | undefined {
  const rows = { ...DEFAULT_ROW_ORDER, ...ROW_ORDER_V2 };
  return Object.keys(rows).find((row) => rows[row].includes(nodeId));
}

/** Moves `id` one step inside `list`, returning a new array. */
export function moveIn(list: string[], id: string, dir: -1 | 1): string[] {
  const i = list.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export const DEFAULT_CONTENT: PortalPageContent = {
  cols: { quick: 4, work: 3, records: 2 },
  hero: {
    title: 'Welcome to Support Portal',
    subtitle: 'Search our support center knowledge base',
    placeholder: 'How can we help you?',
    showSearch: true,
  },
  quick: [
    { id: 'quick-incident', title: 'New Incident', desc: 'Report an incident' },
    { id: 'quick-service', title: 'Request Service', desc: 'Browse the services offered' },
    { id: 'quick-knowledge', title: 'Knowledge', desc: 'Browse knowledge' },
    /* ⚠️ A FOURTH card, shipped by default. `quick-ad` was already declared as a node and already
       had a spec — it was simply absent from the content, so the one action a requester most often
       wants was the one they had to add by hand. It belongs to Quick Actions like the other three,
       not as a loose element dropped elsewhere. */
    { id: 'quick-ad', title: 'AD Self Service', desc: 'Reset your domain password' },
  ],
  requests: { title: 'My Open Requests', statuses: ['Open', 'In Progress'], scope: 'Raised by me', show: 5 },
  approvals: { title: 'Pending Approvals', show: 2 },
  knowledge: { title: 'Most Read', show: 3 },
  assets: { title: 'My Assets' },
  cis: { title: 'My CIs' },
};

/* ── Style ───────────────────────────────────────────────────────────────── */

/** One side of the spacing matrix. Vertical sides are px, horizontal are % — Duda's defaults. */
/* ⚠️ Every side is OPTIONAL, and undefined means "untouched", not zero. With four required numbers
   the matrix had to seed a box of zeros, so the first slider you moved wrote all four — dragging a
   section's vertical padding silently zeroed its 24px side gutters and threw its content against
   the page edge. A side nobody has set has no opinion, and the element keeps whatever it rested at. */
export interface SpacingBox { top?: number; right?: number; bottom?: number; left?: number }
export const ZERO_BOX: SpacingBox = { top: 0, right: 0, bottom: 0, left: 0 };

/* The five typography ROLES (spec P3). Exposed per role rather than per element, so a widget shows
   only the roles it actually has — a Count tile has a `title` and a `meta` and nothing else. */
export type TypeRole = 'title' | 'subtitle' | 'body' | 'meta' | 'link';

export interface RoleType {
  /** 'inherit' or a theme font key. Defaults to inherit and must STAY there — a per-widget
   *  typeface is an escape hatch for one pull-quote, not a way to build a page in six fonts. */
  font?: string;
  /** % of the role's base size, 80–200. */
  size?: number;
  weight?: 'regular' | 'medium' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  /** 0 = no clamp. */
  maxLines?: number;
}

export interface NodeStyle {
  align?: 'left' | 'center' | 'right' | 'stretch';
  /** Dragged width as a PERCENTAGE of the parent, 5–100. See the note in `sizeOf`. */
  widthPct?: number;
  /** Free placement inside the banner, as a % of the band. Own-only, like height and padding. */
  freeX?: number;
  freeY?: number;
  /** The second axis. `stretch` fills the row's height, which is what makes short cards match tall
      ones without anybody typing a number. */
  alignY?: 'start' | 'center' | 'end' | 'stretch';
  /* ── P1 Container ── */
  bgFill?: 'none' | 'color' | 'image';
  bgImage?: string;
  /** 0–80 %. Exists only for image fills — its job is keeping text readable over artwork. */
  bgOverlay?: number;
  /** Sections only. 'page' MOVES the background behind every section (see §7.21). */
  bgScope?: 'section' | 'page';
  borderMode?: 'none' | 'line' | 'shadow';
  elevation?: 'none' | 'subtle' | 'raised';
  /* ── P2 Size & position ── */
  /** % of its column, 10–100. Distinct from `width`, which is the px a resize drag produced. */
  widthPct?: number;
  spaceTop?: number;
  spaceBottom?: number;
  /** Per-side border strokes, set from the Border gear. */
  borderSides?: { top: number; right: number; bottom: number; left: number };
  shadowOn?: boolean;
  shadowColor?: string;
  shadowType?: string;
  shadowPos?: string;
  /** Size: height follows width while this is on. */
  keepRatio?: boolean;
  /* ── P3 Typography, per role ── */
  type?: Partial<Record<TypeRole, RoleType>>;
  /* ── P4 List & grid ── */
  arrangement?: 'list' | 'grid';
  columns?: number;
  gap?: number;
  density?: 'compact' | 'comfortable';
  dividers?: boolean;
  itemAlign?: 'left' | 'center';
  equalHeight?: boolean;
  /* ── P5 Media ── */
  ratio?: string;
  fit?: 'cover' | 'contain';
  focal?: string;
  shape?: 'rectangle' | 'rounded' | 'circle';
  mediaRadius?: number;
  mediaOverlay?: number;
  captionPos?: 'below' | 'overlay' | 'hidden';
  /* ── P6 Icon ── */
  iconSize?: number;
  iconColor?: string;
  iconShape?: 'none' | 'square' | 'circle';
  iconFill?: string;
  iconPos?: 'left' | 'top' | 'right';
  /* ── P7 Interactive states ── */
  hover?: 'none' | 'lift' | 'tint' | 'outline';
  pressed?: 'none' | 'tint';
  transition?: 'none' | 'fast' | 'normal';
  /* ── P8 Empty, loading, error ── */
  emptyMsg?: string;
  emptyMode?: 'show' | 'hide';
  loading?: 'skeleton' | 'spinner';
  errorMsg?: string;
  /** Outer spacing. Vertical in px, horizontal in %. */
  margin?: SpacingBox;
  /** Inner spacing. Same units. */
  padding?: SpacingBox;
  /** A text run's highlight — the background behind the words, not the block's fill. */
  textBg?: string;
  /** Horizontal sides move together until this is broken — the matrix's link toggle. */
  marginLinked?: boolean;
  paddingLinked?: boolean;
  /** Set by dragging a resize handle, in px. */
  width?: number;
  height?: number;
  /** Share of its row, set by a horizontal drag. Siblings carry one too, so the row always fills. */
  flex?: number;
  /** Per-corner radius; when set it overrides the single `radius`. */
  corners?: { tl: number; tr: number; br: number; bl: number };
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  /** Section background, as a CSS colour. */
  bg?: string;
  radius?: number;
  /** Vertical padding, px. */
  padY?: number;
  // text-only
  color?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** DFLT / PAR / H1…H6 — the theme style this text is bound to. */
  heading?: string;
  /* The font family this text is set in — a `PORTAL_FONTS` id.
   *
   * ⚠️ This USED to store a role ('heading' | 'body') so a bound text followed the theme. Changed on
   * request: the toolbar is a plain font picker now and the theme section is being reworked
   * separately. The consequence is worth knowing — a text given a family here KEEPS it when the
   * theme changes, which is the trade a direct picker always makes. Unset still follows the theme,
   * so an untouched block behaves exactly as before. */
  font?: string;
}

/* The portal's font library — six families, and the only ones anything here offers.
 *
 * ⚠️ Deliberately SHORT. A long list is how a page ends up in a face nobody chose on purpose, and
 * every family costs a webfont request on a page requesters load cold. Six covers the range a
 * support portal actually needs: three neutral sans, one geometric, one serif, one technical.
 * ⚠️ It lives HERE, not in the theme panel, because two places now read it — the Theme panel's own
 * face pickers and the canvas text toolbar. Two copies of one list is two places for a family to be
 * added and only half-supported. `PortalThemePanel` re-exports it as `FONT_FACES` so its existing
 * call sites are untouched.
 * ⚠️ Every family here MUST be loaded in `src/styles/fonts.css`. Only Inter was, so the other five
 * silently fell back to the generic sans and the picker offered six options that rendered
 * identically — a control that looks broken rather than one that does nothing. */
export const PORTAL_FONTS = [
  { id: 'inter', name: 'Inter', css: 'Inter, sans-serif', note: 'Neutral and highly legible.' },
  { id: 'poppins', name: 'Poppins', css: 'Poppins, sans-serif', note: 'Geometric and friendly.' },
  { id: 'source', name: 'Source Sans 3', css: '"Source Sans 3", sans-serif', note: 'Humanist. Good at small sizes.' },
  { id: 'merri', name: 'Merriweather', css: 'Merriweather, serif', note: 'Serif. Editorial and calm.' },
  { id: 'roboto', name: 'Roboto', css: 'Roboto, sans-serif', note: 'Tight and compact.' },
  { id: 'plex', name: 'IBM Plex Sans', css: '"IBM Plex Sans", sans-serif', note: 'Technical and even.' },
];

/** The CSS family for a stored font id, or undefined when it names nothing we ship. */
export const fontCss = (id?: string) => PORTAL_FONTS.find((f) => f.id === id)?.css;

/* Widgets whose HEADING belongs to the product, not to the page.
 *
 * Their content comes from the backend and their panels no longer offer a Title, so a heading you
 * could still retype on the canvas was the last way to make a card lie about what it lists — "My
 * Open Requests" renamed to "Closed tickets" while it goes on listing open ones.
 *
 * ⚠️ Listed EXPLICITLY rather than inferred from the group. Which widgets are the product's is a
 * product decision, and the two things that look like rules here both have exceptions: FAQ and
 * Feedback sit in the same groups but their words are genuinely authored, and the action cards'
 * SUBTITLES stay editable while their titles do not.
 * ⚠️ Both spellings are covered — the fixed page nodes AND the catalogue types — because the same
 * widget dropped from the library gets an `el-N` id and has to behave identically. */
/* ⚠️ `quick-link` is deliberately ABSENT. Every other card in this row is a product destination
   whose name the product owns; that one exists to say where an admin's link goes, so its title is
   theirs to write — which is the whole difference between it and the four beside it. */
/* ⚠️ BOTH SETS ARE NOW EMPTY — every predefined widget's heading is editable again, on the canvas
   and in its panel, which is what the two halves of this decision have to agree on.
   The argument above was that a heading you could retype was the last way to make a card lie about
   what it lists. What it produced instead was a card nobody could label in their own words: a
   portal that calls a request a "ticket", or runs in a language this product does not ship, had no
   way to say so — and the rename it was guarding against is visible on the canvas the moment it is
   made, by the person making it, on their own portal.
   ⚠️ Only the WORDS moved. What each card LISTS is still the backend's: the live-data cards keep
   their empty `fields` for statuses, scope and row counts, and the four action cards still have no
   destination control. Renaming "My Open Requests" changes the heading, never the query.
   ⚠️ Kept as a mechanism rather than deleted, with its five call sites intact — putting any widget
   back to a fixed heading is adding its id to one of these sets. */
const FIXED_TITLE_NODES = new Set<string>([]);
const FIXED_TITLE_TYPES = new Set<string>([]);

/** True when this widget's heading is fixed — render the words, do not wrap them in a Sel. */
export function hasFixedTitle(nodeId?: string): boolean {
  if (!nodeId) return false;
  if (FIXED_TITLE_NODES.has(nodeId)) return true;
  const t = placedType(nodeId);
  return !!t && FIXED_TITLE_TYPES.has(t);
}

/** The built-in bands that can be split into rows and columns like an added section.
 *
 * ⚠️ Listed EXPLICITLY rather than inferred. The hero is deliberately absent: it is a full-bleed
 * band that the page's own archetypes already move, size and place (`heroPlacement`, `heroWidth`,
 * `heroSticky`), and a second way to put something beside it would be two answers to one question.
 * The top bar and the left rail are the product's chrome, not page content. */
export const SPLITTABLE_BANDS = new Set(['quick', 'favourites', 'services', 'work', 'records']);

/* The predefined data cards whose "View all" / "Browse catalog" LINK is the product's words.
 *
 * ⚠️ A SEPARATE set from `FIXED_TITLE_*`, not the same one read twice. The link used to be gated on
 * `hasFixedTitle`, on the reasoning that a widget with a fixed heading has a fixed link — which
 * held only while the two were always decided together. They are not: a card's TITLE is now the
 * admin's, so they can name the card in their own words, while the link stays the product's,
 * because it names a DESTINATION the admin cannot change. Sharing one predicate meant opening the
 * title opened the link with it.
 * ⚠️ These are the nine cards whose backing query the backend owns. Anything an admin builds — the
 * Record List above all — is absent by construction and keeps both, because there the words and
 * the destination genuinely are theirs. */
const FIXED_VIEWALL_NODES = new Set([
  'requests', 'approvals', 'knowledge', 'assets', 'cis', 'news', 'services', 'favourites', 'contact',
]);
const FIXED_VIEWALL_TYPES = new Set([
  'c-requests', 'c-approvals', 'c-assets', 'c-cis', 'c-announcements', 'c-knowledge',
  'c-services', 'c-favourites', 'c-contact',
]);

/** True when this widget's "View all" link is fixed — render the words, do not wrap them in a Sel. */
export function hasFixedViewAll(nodeId?: string): boolean {
  if (!nodeId) return false;
  if (FIXED_VIEWALL_NODES.has(nodeId)) return true;
  const t = placedType(nodeId);
  return !!t && FIXED_VIEWALL_TYPES.has(t);
}

export type PortalStyles = Record<string, NodeStyle>;

export const TEXT_STYLES = ['PAR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

/** Sizes the H-levels map to, so picking a level visibly changes the canvas. */
export const HEADING_SIZE: Record<string, number> = {
  PAR: 15, H1: 34, H2: 28, H3: 22, H4: 18, H5: 16, H6: 13,
};

/* ── Added sections ──────────────────────────────────────────────────────── */

/** A layout is rows of column weights, so the picker tile and the section it creates are drawn
 *  from the SAME data — a tile can never promise a shape the section doesn't produce. */
export interface SectionLayout { id: string; rows: number[][] }

export const SECTION_LAYOUTS: SectionLayout[] = [
  { id: 'l1', rows: [[1]] },
  { id: 'l2', rows: [[1, 1]] },
  { id: 'l3', rows: [[1], [1]] },
  { id: 'l4', rows: [[1, 1, 1]] },
  { id: 'l5', rows: [[1], [1], [1]] },
  { id: 'l6', rows: [[1, 2]] },
  { id: 'l7', rows: [[2, 1]] },
  { id: 'l8', rows: [[1, 1], [1]] },
  { id: 'l9', rows: [[1], [1, 1]] },
  { id: 'l10', rows: [[1, 1], [1, 1]] },
];

/** An element the admin dropped on the canvas. Blank by design — content and style are theirs. */
export interface PlacedElement {
  /** Instance id, e.g. `el-3`. */
  id: string;
  /** Catalogue id from PORTAL_ELEMENTS, e.g. `b-text`. */
  type: string;
  name: string;
}

/* ── The section tree ─────────────────────────────────────────────────────
 *
 * ONE node type does all of it: a BOX. A section is a box, a column is a box, a row is a box, and
 * the cell a widget sits in is a box. They are not four things — they are one thing in four
 * positions.
 *
 * ⚠️ That is the whole design, and it is what the note's "all level feasibility in row, col. split"
 * asks for. The moment there are three kinds of container, "split" has to mean three different
 * things, the panel has to choose between three editors, and one feature becomes three that drift
 * apart. One type, one split, one panel. See SECTION-TREE-SPEC.md.
 */

/** How a box lays its CHILDREN out. Literally `flex-direction`, and literally the note's
 *  "section's behaviour — how user wants to treat sec? row / column".
 *
 *  `row`    children run left → right, so each child reads as a COLUMN and Split adds a column.
 *  `column` children run top → bottom, so each child reads as a ROW and Split adds a row. */
export type BoxDir = 'row' | 'column';

export interface Box {
  /** Stable, minted ONCE — never positional. See the note on `mintBox`. */
  id: string;
  dir: BoxDir;
  /** Share of the parent's main axis. Siblings are reset to equal on split. */
  weight: number;
  /** A BRANCH. Mutually exclusive with `el` — a box is a branch or a leaf, never both. */
  children?: Box[];
  /** A LEAF holding one widget. An empty leaf has neither. */
  el?: PlacedElement;
  /** A LEAF that HOSTS a built-in band (`quick`, `work`, …) rather than a placed element.
   *
   * ⚠️ This is what lets a predefined band be split into rows and columns with the SAME machinery
   * an added section uses. The alternative was a parallel "band aside" model, which would have
   * meant a second implementation of split, weights, adders and delete that had to be kept in step
   * with this one — and the first divergence would be invisible until someone split a band twice.
   * The band keeps its own node id, its own `Sel`, its own panel and its own place in
   * `blockOrder`; only its POSITION on the page moves inside this box. */
  band?: string;
}

export interface CustomSection {
  id: string;
  /** The section IS the root box of its own tree. */
  root: Box;
  /** Monotonic counter behind `mintBox`. Only ever increases, including across deletes. */
  next: number;
  /** Set when this section exists only to HOST a built-in band — see `Box.band`.
   *
   * ⚠️ A hosting section is NOT drawn by the normal "sections anchored after block X" loop. It is
   * drawn where the band itself would have been, taking the band's own `order`, so splitting a
   * band never moves it down the page. Filtering it out of that loop is what stops it rendering
   * twice — once in place and once as a free section underneath. */
  band?: string;
}

/* ⚠️ Ids are MINTED, never derived from position.
 *
 * The old model numbered columns across the whole section (`sec-3-c0`), so inserting one renamed
 * every column after it and `addColumn` had to re-key `items` to compensate — the comment on that
 * function records Duplicate once writing a clone straight over its neighbour because of exactly
 * this: one element gained, one destroyed, no error, no way back.
 *
 * In a TREE that failure gets much worse. `widgetCfg`, `styles`, `placedText` and `icons` are all
 * keyed by node id, so a split near the top would silently renumber a whole subtree and every
 * stored value would land on the wrong box — a page that quietly rearranges its own styling, which
 * is the hardest class of bug there is to report. Position lives in the tree; identity does not. */
export function mintBox(section: { id: string; next: number }, dir: BoxDir, weight = 1): Box {
  return { id: `${section.id}-b${section.next++}`, dir, weight };
}

/** Depth cap, counted BELOW the section: Section > Column > Row > Column > Row. */
export const MAX_BOX_DEPTH = 4;
/** Columns in one row. */
export const MAX_COLUMNS = 8;
/** Rows stacked in one column.
 *  ⚠️ Rows used to be UNCAPPED, on the reasoning that a tall column costs nothing while a wide row
 *  costs readability. That is still true of the page, but not of the CONTROLS: an uncapped axis has
 *  no state in which its adder is disabled, so the one axis with a limit looked arbitrary beside the
 *  one without. Both are 8 now, which is the number the brief asks for and reads as a rule rather
 *  than as a quirk of whichever axis someone thought about first. */
export const MAX_ROWS = 8;

export const isBranch = (b: Box) => Array.isArray(b.children) && b.children.length > 0;

/** Every box in the tree, root first. */
export function boxList(root: Box): Box[] {
  const out: Box[] = [];
  const walk = (b: Box) => { out.push(b); b.children?.forEach(walk); };
  walk(root);
  return out;
}

/** Root → … → the box with this id. Empty when it is not in this tree. */
export function boxPath(root: Box, id: string): Box[] {
  const walk = (b: Box, trail: Box[]): Box[] | null => {
    const next = [...trail, b];
    if (b.id === id) return next;
    for (const c of b.children ?? []) { const hit = walk(c, next); if (hit) return hit; }
    return null;
  };
  return walk(root, []) ?? [];
}

export const findBox = (root: Box, id: string): Box | undefined => boxList(root).find((b) => b.id === id);
export const parentOfBox = (root: Box, id: string): Box | undefined => boxPath(root, id).at(-2);
/** 0 for the section root. */
export const boxDepth = (root: Box, id: string): number => Math.max(0, boxPath(root, id).length - 1);

/** Rebuilds the tree with `fn` applied to the box with this id. Structural sharing is not the point
 *  — a new object every time is what makes React re-render the branch that changed. */
export function mapBox(root: Box, id: string, fn: (b: Box) => Box): Box {
  const walk = (b: Box): Box => (b.id === id ? fn(b) : (b.children ? { ...b, children: b.children.map(walk) } : b));
  return walk(root);
}

/** Equal shares. Split resets rather than inheriting, the way the old `addColumn` did — an even row
 *  is the whole point of the affordance, so carrying the old weights forward would be wrong. */
const evenly = (boxes: Box[]) => boxes.map((b) => ({ ...b, weight: 1 }));

/** Why Split is unavailable on this box, or null when it is available.
 *
 *  ⚠️ Returns a REASON, not a boolean. At a limit the control stays visible and disabled with the
 *  reason on it — never missing, never a silent no-op — which is how every other cap in this
 *  product behaves (the OS-upgrade single-select, a collection's `max`). */
export function splitBlockedBecause(root: Box, id: string): string | null {
  const box = findBox(root, id);
  if (!box) return null;
  const depth = boxDepth(root, id);
  /* A LEAF split adds a level, so it needs room below it; a BRANCH split adds a sibling at the
     level its children already occupy, so it needs room for them. Same check either way. */
  if (depth + 1 > MAX_BOX_DEPTH) return `Nested as deep as a section goes (${MAX_BOX_DEPTH} levels)`;
  if (box.dir === 'row' && isBranch(box) && box.children!.length >= MAX_COLUMNS) {
    return `A row holds ${MAX_COLUMNS} columns at most`;
  }
  if (box.dir === 'column' && isBranch(box) && box.children!.length >= MAX_ROWS) {
    return `A column holds ${MAX_ROWS} rows at most`;
  }
  return null;
}

/** Split, the ONE structural operation, identical at every level.
 *
 *  On a LEAF the box becomes a branch of two: whatever was in it moves into the first child, the
 *  second is empty. ⚠️ The element is never destroyed — Word, Figma and Duda all preserve it, and
 *  nobody expects splitting a cell to throw its contents away.
 *
 *  On a BRANCH one more empty child is appended.
 *
 *  The DIRECTION is always the box's own `dir`. Nothing else decides it — not where you clicked,
 *  not what is inside, not the depth. */
export function splitBox(section: CustomSection, id: string): CustomSection {
  if (splitBlockedBecause(section.root, id)) return section;
  const next = { ...section };
  const root = mapBox(section.root, id, (b) => {
    if (isBranch(b)) return { ...b, children: evenly([...b.children!, mintBox(next, flip(b.dir))]) };
    /* The leaf's own content moves down a level. Its `dir` stays on the box being split — that is
       what the split is along — and the two new children take the opposite direction, so the next
       split one level down goes the other way without anyone choosing it. */
    /* ⚠️ `band` travels with `el`. A hosted band is this leaf's CONTENT — miss it here and
       splitting a band silently empties it: the box divides, the band is gone from both halves,
       and nothing errors because an empty leaf is a legal box. */
    const kept = { ...mintBox(next, flip(b.dir)), el: b.el, band: b.band };
    return { id: b.id, dir: b.dir, weight: b.weight, children: [kept, mintBox(next, flip(b.dir))] };
  });
  return { ...next, root };
}

export const flip = (d: BoxDir): BoxDir => (d === 'row' ? 'column' : 'row');

/** Flip a box's behaviour. ⚠️ Non-destructive by construction: the children and their order are
 *  untouched and only the axis changes, which is what makes the note's "sub section as column, but
 *  I can rearrange to top & bottom" one click rather than a rebuild. */
export const setBoxDir = (section: CustomSection, id: string, dir: BoxDir): CustomSection =>
  ({ ...section, root: mapBox(section.root, id, (b) => ({ ...b, dir })) });

/** Insert an empty sibling beside `id`. This is what the axis-aware `+` adders call — `before` is
 *  left on a row and above on a column, which is the same question asked once. */
export function addSibling(section: CustomSection, id: string, before: boolean): CustomSection {
  const parent = parentOfBox(section.root, id);
  if (!parent) return section;
  if (parent.dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS) return section;
  /* ⚠️ Both axes, or this function is a hole in the cap: every route that goes through
     `neighbourBlockedBecause` is guarded, and a direct call here was not. */
  if (parent.dir === 'column' && (parent.children?.length ?? 0) >= MAX_ROWS) return section;
  const next = { ...section };
  const fresh = mintBox(next, flip(parent.dir));
  const root = mapBox(section.root, parent.id, (b) => {
    const at = b.children!.findIndex((c) => c.id === id) + (before ? 0 : 1);
    const kids = [...b.children!];
    kids.splice(at, 0, fresh);
    return { ...b, children: evenly(kids) };
  });
  return { ...next, root };
}

/** Why a neighbour cannot be added on this axis, or null when it can.
 *
 *  ⚠️ A REASON, not a boolean — at a limit the adder stays visible and disabled with the reason on
 *  it, the way Split and every other cap in this product behave. */
export function neighbourBlockedBecause(root: Box, id: string, dir: BoxDir): string | null {
  const parent = parentOfBox(root, id);
  if (parent && parent.dir === dir) {
    if (dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS) {
      return `A row holds ${MAX_COLUMNS} columns at most`;
    }
    if (dir === 'column' && (parent.children?.length ?? 0) >= MAX_ROWS) {
      return `A column holds ${MAX_ROWS} rows at most`;
    }
    return null;
  }
  /* Wrapping puts a level below this box, so it needs the room a split would need. */
  if (boxDepth(root, id) + 1 > MAX_BOX_DEPTH) return `Nested as deep as a section goes (${MAX_BOX_DEPTH} levels)`;
  return null;
}

/** The direct child of the section root that contains this box — the level a full-width row is at. */
export function topLevelBoxOf(root: Box, id: string): string {
  const path = boxPath(root, id);
  return path.length >= 2 ? path[1].id : root.id;
}

/** Which box a full-width ROW should actually be added beside, given the box whose adder was clicked.
 *
 *  ⚠️ A ROW IS THE WIDTH OF THE SECTION. Adding one used to operate on the clicked box itself, so
 *  asking for a row below a column got a row INSIDE that column — the width of that column, stacked
 *  under its own content, while the column beside it carried on past both. That is a split, not a
 *  row, and it is not what an adder on the bottom edge says it will do.
 *
 *  Rows and columns are not symmetric, which is why this exists and its horizontal twin does not:
 *  a column divides the row it is in, so it belongs beside the box you clicked; a row spans
 *  everything, so it belongs at the top level however deep the click came from.
 *
 *  Two cases, which are the same sentence read twice:
 *    • the root already STACKS its children, so they are full-width rows already — the new one
 *      joins them beside whichever branch the click came from
 *    • the root does not, so the ROOT is what gets wrapped, which is the thing that turns the whole
 *      section into a stack in the first place */
export function rowTargetOf(root: Box, id: string): string {
  if (isBranch(root) && root.dir === 'column') return topLevelBoxOf(root, id);
  return root.id;
}

/** Add an empty neighbour on a given AXIS, whatever axis the parent happens to lay out along.
 *
 *  This is what lets ONE control mean the same thing at every level: left and right always add a
 *  column, top and bottom always add a row, and neither has to ask what shape it is standing in.
 *
 *  ⚠️ Two cases, and the second is why this is not just `addSibling`. When the parent already runs
 *  along `dir`, the new box is a plain sibling. When it does not — or there is no parent at all,
 *  which is every unsplit section — the box is WRAPPED in a new box of that direction and the empty
 *  neighbour joins it there. Without the wrap, "add a row below" on a section laid out as columns
 *  had nowhere to go and did nothing.
 *
 *  ⚠️ The OUTER box keeps the original id. Anything selected, styled or configured against it still
 *  resolves — the same rule `removeBox`'s collapse follows, and the reason a wrap is not visible as
 *  a loss of everything the admin had set on that box. */
/** ⚠️ Returns the NEW BOX's id as well as the section. A drop that splits has to put the element
 *  into the box it just made, and the id was previously unknowable from outside: the wrap branch
 *  mints twice, so `section.next` read beforehand is right in one branch and off by one in the
 *  other. Guessing it is the kind of arithmetic that works until somebody adds a mint. */
export function addNeighbourAt(
  section: CustomSection, id: string, dir: BoxDir, before: boolean,
): { section: CustomSection; id: string | null } {
  if (neighbourBlockedBecause(section.root, id, dir)) return { section, id: null };
  const parent = parentOfBox(section.root, id);
  if (parent && parent.dir === dir) {
    const minted = `${section.id}-b${section.next}`;
    return { section: addSibling(section, id, before), id: minted };
  }
  /* The wrap branch mints the KEPT box first and the empty neighbour second. */
  const mintedId = `${section.id}-b${section.next + 1}`;
  return { section: addNeighbour(section, id, dir, before), id: mintedId };
}

export function addNeighbour(section: CustomSection, id: string, dir: BoxDir, before: boolean): CustomSection {
  if (neighbourBlockedBecause(section.root, id, dir)) return section;
  const parent = parentOfBox(section.root, id);
  if (parent && parent.dir === dir) return addSibling(section, id, before);

  const next = { ...section };
  const root = mapBox(section.root, id, (b) => {
    /* The box's own content moves down a level, keeping its direction and children so nothing
       inside it is rearranged; only a level is added above it. */
    const kept: Box = { ...mintBox(next, b.dir), el: b.el, band: b.band, children: b.children };
    const fresh = mintBox(next, flip(dir));
    return {
      id: b.id,
      dir,
      weight: b.weight,
      children: evenly(before ? [fresh, kept] : [kept, fresh]),
    };
  });
  return { ...next, root };
}

/** Remove a box. ⚠️ A branch left with ONE child collapses into it, so deleting the second of two
 *  columns returns the section to the single column it started as rather than leaving a branch that
 *  looks and behaves exactly like a leaf but answers differently to every structural question. */
export function removeBox(section: CustomSection, id: string): CustomSection {
  const parent = parentOfBox(section.root, id);
  if (!parent) return section;
  const root = mapBox(section.root, parent.id, (b) => {
    const kids = evenly((b.children ?? []).filter((c) => c.id !== id));
    if (kids.length === 0) return { id: b.id, dir: b.dir, weight: b.weight };
    if (kids.length === 1) {
      /* Collapse: the survivor's CONTENT moves up, but the surviving box keeps the PARENT's id so
         anything selected or styled against it still resolves. */
      const only = kids[0];
      return { id: b.id, dir: only.dir, weight: b.weight, children: only.children, el: only.el };
    }
    return { ...b, children: kids };
  });
  return { ...section, root };
}

/** Put an element into a leaf. Returns the section unchanged when the target is a branch — a branch
 *  has no content of its own, only children. */
export const setBoxEl = (section: CustomSection, id: string, el: PlacedElement | undefined): CustomSection =>
  ({ ...section, root: mapBox(section.root, id, (b) => (isBranch(b) ? b : { ...b, el })) });

/** Every empty leaf, in reading order — what "the first free column" means to click-to-add. */
export const freeLeaves = (root: Box): Box[] => boxList(root).filter((b) => !isBranch(b) && !b.el);
/** Every leaf that holds something. */
export const filledLeaves = (root: Box): Box[] => boxList(root).filter((b) => !isBranch(b) && !!b.el);

/** `rows: number[][]` → a tree, with no visual change to any existing layout.
 *
 *  ⚠️ A SINGLE-row layout flattens: the root becomes the row itself rather than a column holding one
 *  row. Otherwise the commonest shape on the page — two columns — would arrive a level deeper than
 *  it needs, and its breadcrumb would read `Section > Row > Column > Text` for the simplest thing
 *  anyone builds. */
/** A section built to HOST a band, with one empty box beside or under it.
 *
 * The band takes one leaf and the new neighbour takes the other, so the very first click on a
 * band's + handle produces exactly the shape an added section would have after one split — which
 * is what makes every click AFTER it ordinary `addBeside` on an ordinary box. */
export function bandSection(id: string, band: string, dir: BoxDir, before: boolean): CustomSection {
  const section: CustomSection = { id, root: { id, dir, weight: 1 }, next: 0, band };
  const host: Box = { ...mintBox(section, flip(dir)), band };
  const fresh = mintBox(section, flip(dir));
  section.root.children = before ? [fresh, host] : [host, fresh];
  return section;
}

export function sectionFromRows(id: string, rows: number[][], startAt = 0): CustomSection {
  /* ⚠️ `startAt` is not decoration. Rebuilding a section (a Layout preset) must not restart the
     counter, or the new cells take ids the old cells already own and every id-keyed store —
     config, style, text, icons — silently applies the old cell's settings to the new one. */
  const section: CustomSection = { id, root: { id, dir: 'row', weight: 1 }, next: startAt };
  const cells = (weights: number[], dir: BoxDir) => weights.map((w) => ({ ...mintBox(section, flip(dir)), weight: w }));

  if (rows.length <= 1) {
    const row = rows[0] ?? [1];
    /* One cell is a plain leaf — a root with a single child is a branch that behaves like a leaf. */
    section.root = row.length <= 1
      ? { id, dir: 'row', weight: 1 }
      : { id, dir: 'row', weight: 1, children: cells(row, 'row') };
    return section;
  }

  section.root = {
    id,
    dir: 'column',
    weight: 1,
    children: rows.map((row) => (row.length <= 1
      ? { ...mintBox(section, 'row'), weight: row[0] ?? 1 }
      : { ...mintBox(section, 'row'), children: cells(row, 'row') })),
  };
  return section;
}



/** `sec-3-b7` and `sec-3` both belong to section `sec-3`. ⚠️ One function, because the ROOT box
 *  carries the section's own id with no suffix — every call site that split the id itself got the
 *  root wrong. */
export const sectionIdOfBox = (boxId: string) => boxId.replace(/-b[0-9]+$/, '');

/* ⚠️ ONE test for "this id names a box inside a section", because the shape has already changed
 * once. Task 23 renamed boxes from the positional `sec-3-c0` to the minted `sec-3-b7`, and a
 * `-c\d+` regex left behind in `replaceElement` stopped matching anything — so Replace fell through
 * to a branch that could not find the element, and silently did nothing at all. Nothing errored;
 * the widget simply stayed what it was. A named predicate is the only way the next rename touches
 * one line instead of however many copies have been written by then. */
export const isBoxId = (id: string) => /^sec-[0-9]+-b[0-9]+$/.test(id);

/** Register a whole tree, so `nodeById` can name every box in it.
 *
 * ⚠️ The ROOT is deliberately NOT registered. Its id is the section id, and `nodeById` answers
 *  that with 'Section' — registering it too would shadow that and label the section a Column. */
export function registerTree(section: CustomSection) {
  const walk = (b: Box, parentDir: BoxDir, depth: number, parent?: string) => {
    if (parent) registerBox(b.id, parentDir, depth, parent);
    b.children?.forEach((c) => walk(c, b.dir, depth + 1, b.id));
  };
  walk(section.root, 'row', 0);
}

/* ── Reading a tree the way the old flat model was read ───────────────────
 *
 * The Layout PRESETS ("Columns", "Grid", "Three across", "Stacked") are whole-section restructures,
 * and they have always been expressed as `rows: number[][]`. They stay that way: a preset is a
 * top-level shape, so it is described at the top level and rebuilt from there.
 *
 * ⚠️ Applying a preset therefore FLATTENS any nesting below the first two levels — which is what
 * "a preset is not a picture of a layout, it IS the layout" has always meant. It rewrites the shape
 * and reflows what is inside; it does not merge with what was there. */
export function sectionRows(section: CustomSection): number[][] {
  const root = section.root;
  if (!isBranch(root)) return [[1]];
  if (root.dir === 'row') return [root.children!.map((c) => c.weight)];
  return root.children!.map((c) => (isBranch(c) && c.dir === 'row' ? c.children!.map((g) => g.weight) : [c.weight]));
}

/** Every placed element in the section, in reading order. */
export const sectionElements = (section: CustomSection): PlacedElement[] =>
  filledLeaves(section.root).map((b) => b.el!);

/** The leaf holding this element, if the section has it. */
export const boxOfElement = (root: Box, elementId: string): Box | undefined =>
  boxList(root).find((b) => b.el?.id === elementId);

/** Rebuild a section to `rows`, pouring `els` back into the new leaves in order.
 *
 * ⚠️ Ids are MINTED FRESH here, and that is correct rather than careless: a preset is a new shape,
 * so its cells are new cells. Keeping the old ids would carry a two-column section's per-column
 * padding onto the three cells of a "Three across" that has no third column to inherit from. The
 * ELEMENTS keep their ids — their config and styling are theirs, and they are only being moved. */
export function sectionRebuild(section: CustomSection, rows: number[][], els: PlacedElement[]): CustomSection {
  /* ⚠️ Minted ids CONTINUE from where this section had got to — they do not restart. Restarting
     would hand the new cells ids the old ones already own, and every store keyed by node id
     (config, style, text, icons) would then apply the old cell’s settings to the new one. */
  const next = sectionFromRows(section.id, rows, section.next);
  const slots = freeLeaves(next.root);
  els.slice(0, slots.length).forEach((el, i) => { slots[i].el = el; });
  return next;
}

/* Catalogue type → how the canvas treats it.
 *
 * `bare` is the important flag: a Text or a Title drops straight onto the section's own surface
 * with only the section's padding around it. Wrapping every element in a white card would give the
 * page a boundary the designer never asked for. Only things that genuinely ARE a card say so. */
export interface ElementRenderSpec { kind: NodeKind; bare: boolean }

const CARD_TYPES = new Set([
  /* ⚠️ 'c-favourites' belongs here beside 'c-services'. The two render the same grid and sit on
     the same page: without it Favourite Services drew its tiles straight onto the page background
     while Most Used Services sat in a white card, so two identical grids read as two different
     kinds of thing for no reason anyone could name. */
  /* ⚠️ 'c-records' belongs here for the same reason 'c-favourites' does, one line up. It is a live
     card — it renders the header, the count, the View-all and the rows that My Open Requests does —
     so drawing it straight onto the page background put two cards of the same kind on one page
     reading as two different kinds of thing: one in a white bordered box, one floating on the
     canvas with no boundary at all. */
  'c-records',
  'c-services', 'c-favourites', 'c-categories', 'c-requests', 'c-approvals', 'c-assets', 'c-tasks',
  'c-announcements', 'c-knowledge', 'c-faq', 'c-contact',
  'b-card', 'b-table', 'b-accordion', 'b-text-image',
  /* ⚠️ Listed, or removing it from SELF_SURFACED changes nothing: renderSpec falls through to a
     bare default, so the KPI stayed flat by a different route than the one that was fixed. */
  'x-kpi',
]);

/* ⚠️ These two are NOT in CARD_TYPES, deliberately. `Surface` wraps a card-shaped element in a
   white box with a border and 16px of padding — and both of these already render exactly that
   themselves, from their own config, so they came out as a card inside a card: a hard white
   boundary and a ring of padding nobody chose, with the outer one ignoring every fill and radius
   the panel offered. An element that paints its own surface must be bare. */
/* Every element that renders AS an action card — the page's four fixed destinations plus the
 * palette's own configurable one.
 *
 * ⚠️ AD Self Service was missing from the renderer while its SPEC already promised "the identical
 * card UI as the other three". The other three are built-in page blocks, so they are drawn by the
 * preview and looked right; AD Self Service is the only one you can place, so it fell through to
 * the generic icon-and-title placeholder — no white card, and a Style section writing keys that
 * branch never read. Naming the set once is what stops the two halves drifting again. */
export const ACTION_TYPES = new Set(['x-action-card', 'act-incident', 'act-service', 'act-ad', 'act-knowledge']);

/* Rows that hold a FIXED cast and take nothing else.
 *
 * ⚠️ Quick Actions is the product's four destinations, laid out as one row that reads as a set. An
 * arbitrary Text or Image dropped among them does not join the set — it breaks the one thing the row
 * is: four of the same thing.
 *
 * A DRAG is refused by not accepting the dragover at all, so the cursor reads "no drop" the whole way
 * across the row — the conventional signal, and better than accepting the drag and erroring on
 * release, which tells you it worked right up until it did not. Every other route (click-to-add,
 * replace-a-built-in) is refused inside dropInRow with a message, because THOSE would otherwise fail
 * silently with nothing to explain them.
 *
 * Declared here, beside ACTION_TYPES, so the renderer and the builder read one rule instead of two
 * copies of a string. */
export const LOCKED_ROWS = new Set(['quick']);
export const isLockedRow = (rowId: string) => LOCKED_ROWS.has(rowId);

/* ⚠️ An action card paints its OWN surface from config, so wrapping it in Surface gives a card
   inside a card. A KPI does not — its configured body is an icon beside a number, with no box of
   any kind — so it sits in CARD_TYPES instead. Membership is about whether the element draws a
   surface, not about which group it sits in. */
const SELF_SURFACED = ACTION_TYPES;

const TEXT_TYPES = new Set(['b-text', 'b-large-title', 'b-small-title']);

/** Elements whose natural size IS their content — they hug it rather than filling their column.
 *
 * ⚠️ A placed element used to be `w-full`, so a two-word sentence claimed the whole column and its
 * selection outline and eight handles came with it: the box said "this text is 540px wide" about
 * something 74px wide. Everything you can do to a selected element — resize it, see where it ends,
 * judge its padding — is a lie while the outline is describing the column instead.
 *
 * ⚠️ It is a LIST, not a rule derived from `bare` or from the group, because the question is not
 * "does this paint a card" but "does this have a width of its own". A divider is bare and spans by
 * definition; a table is a card and spans too; a button is neither and does not. Only the things
 * that genuinely size to their content are here, and everything absent keeps the full width it
 * always had — which is why adding one to this set is a deliberate act rather than a side effect. */
export const HUGS_CONTENT = new Set([
  'b-text', 'b-large-title', 'b-small-title', 'b-button', 'v-icon', 'v-shape',
]);

export function renderSpec(type: string): ElementRenderSpec {
  if (TEXT_TYPES.has(type)) return { kind: 'text', bare: true };
  if (SELF_SURFACED.has(type)) return { kind: 'card', bare: true };
  if (CARD_TYPES.has(type)) return { kind: 'card', bare: false };
  if (type === 'c-search') return { kind: 'search', bare: true };
  if (type === 'b-list') return { kind: 'list', bare: true };
  return { kind: 'card', bare: true };
}

/** Column id for the nth column of a section, counted across all its rows. */
/* True when the element draws its OWN white card, so its padding and its dragged height belong to
 * THAT card rather than to the wrapper around it.
 *
 * ⚠️ Padding on the wrapper is grey space AROUND a card, not breathing room INSIDE it — which is
 * both why the padding sliders looked like they were insetting the whole widget and why dragging a
 * section taller clipped the card: the height went on the wrapper, the card kept its own size, and
 * the overflow box cut it off. The painted box has to own both values. */
/* ── What each node's floating toolbar offers ────────────────────────────────
 *
 * The bar is one component, so without this every node got every action — and most of them were
 * offers the page could not honour: an Add on a row that is fenced against the palette, a Replace
 * on a widget whose content belongs to the product, a vertical alignment on a band that is as tall
 * as its own content.
 *
 * ⚠️ A cap of `false` REMOVES the button; it does not disable it. Disabling is for something
 * normally available that is not right now — the leftmost card's Move left — where the reason can
 * be put on the control. An action a node can NEVER take has no reason to state, and a permanently
 * greyed button on every selection is noise the eye has to learn to skip.
 *
 * ⚠️ Unlisted nodes get everything their KIND allows, unchanged. This is a list of exceptions, not
 * a registry every new node has to be added to. */
export interface ToolbarCaps {
  move?: boolean;
  add?: boolean;
  copy?: boolean;
  alignH?: boolean;
  alignV?: boolean;
  /** The Quick Actions row's one addable card, offered as a named action rather than a glyph. */
  extLink?: boolean;
}

/** The four-card main region and the three-card rail. */
const WORK_REGIONS = new Set(['work-main', 'work-rail']);
/** Widgets the product owns: their content is fixed, so there is nothing to add or swap. */
const LIVE_WIDGETS = new Set(['requests', 'approvals', 'assets', 'cis', 'news', 'knowledge', 'contact']);

/* The six an admin composes a section out of: words, a call to action, a picture, a clip, a
 * disclosure list and a grid.
 *
 * ⚠️ This is the set the "+" and Replace pickers offer ON THESE SIX. Their toolbars used to open the
 * whole palette, so "replace this paragraph" listed Announcements, AD Self Service and Favourite
 * Services — product widgets carrying their own data and their own place on the page. Swapping a
 * paragraph for one of those is not a formatting change, it is a different page, and the palette is
 * where that decision belongs.
 * ⚠️ Add and Replace draw from the same list, because it is the same question twice: what goes in
 * this slot, and what goes in the slot beside it. */
export const COMPOSABLE = ['b-text', 'b-button', 'v-image', 'v-video', 'b-accordion', 'b-table'];
const COMPOSABLE_SET = new Set(COMPOSABLE);

/* Who OFFERS the six is a wider set than who IS one.
 * ⚠️ The FAQ carries the "+" without being in the list it offers. It is a Custom widget — it holds
 * questions rather than being one of the building blocks — but an admin composing a section around
 * one still wants the next element beside it, and "go back to the palette" is a longer way round
 * for the same intent. Two sets rather than one, because "can add a neighbour" and "is a neighbour
 * worth offering" are different questions and folding them together would have put FAQ in the
 * Replace list of every Text on the page. */
const CAN_ADD_BESIDE = new Set([...COMPOSABLE, 'c-faq']);

/** True for one of the six — the elements that OFFER each other. */
export const isComposable = (id: string): boolean => {
  const t = placedType(id);
  return !!t && COMPOSABLE_SET.has(t);
};

/** True for anything that may put one of the six in the slot beside it. */
export const canAddBeside = (id: string): boolean => {
  const t = placedType(id);
  return !!t && CAN_ADD_BESIDE.has(t);
};

export function toolbarCaps(id: string): ToolbarCaps {
  /* The banner's search field: one place inside the hero, nothing to duplicate it into, nowhere to
     move to. The grip and Delete are the only two things that were ever true of it. */
  if (id === 'hero-search') return { move: false, add: false, copy: false, alignH: false, alignV: false };
  /* Quick Actions. Fenced against the palette (LOCKED_ROWS), so Add can only mislead; a full-width
     band, so there is no vertical alignment to make; and the one thing it CAN take is the
     external-link card, which is a named action rather than a "+". */
  /* ⚠️ `extLink` is now FALSE. The panel's "External link card" CTA was withheld, and the floating
     toolbar carried the very same action — so removing one and keeping the other would have left
     the row with a second door onto the card that is no longer offered. The `extLink` capability,
     its toolbar button and `addLinkCard` all stay, so restoring the pair is two flags. */
  if (id === 'quick') return { add: false, copy: false, alignV: false, extLink: false };
  /* An action card. Its content belongs to the product, so Replace cannot be honoured; moving it
     along the row is the whole of what an admin decides here. */
  if (/^quick-/.test(id)) return { add: false };
  /* Favourite / Most Used services — a full-width band: nothing to swap it with, nothing to copy it
     into, and no vertical alignment inside a block as tall as its own content. */
  if (id === 'favourites' || id === 'services') return { add: false, copy: false, alignV: false };
  /* The band holding every predefined widget. It arranges its two regions and nothing else. */
  if (id === 'work') return { add: false, copy: false, alignH: false, alignV: false };
  /* Those regions. They hold widgets in an order the admin sets by moving the WIDGETS — a region
     itself only ever swaps sides with its neighbour. */
  if (WORK_REGIONS.has(id)) return { add: false, copy: false, alignH: false, alignV: false };
  /* ⚠️ No COPY either. Each of these is the product's own widget with a fixed place on the page —
     a second My Open Requests is not a second card, it is the same query drawn twice, and the
     palette already refuses to place one because these are predefined. Copy was the one door left
     open into the state that rule exists to prevent. */
  if (LIVE_WIDGETS.has(id)) return { add: false, copy: false, alignH: false, alignV: false };
  /* A PLACED widget, judged by what it IS rather than where it sits.
     ⚠️ The alignment pair goes from the Record List and the Accordion for the reason it went from
     the live cards: they fill the column they are dropped into, so both axes were reporting a
     position nothing was in a position to take. The other four keep theirs — a Text, a Button, an
     Image or a Video genuinely can sit left, centre or right of the space it is given. */
  /* ⚠️ Alignment goes from everything that FILLS the column it is dropped into. A Record List, an
     Accordion, an FAQ, a Video, a Table and a KPI are all as wide as the space they are given, so
     both axes were reporting a position nothing was in a position to take. What is left with the
     control is Text, Button and Image — the three that genuinely can sit left, centre or right of
     the room they have.
     ⚠️ The KPI has no "+" either, and needs no cap to say so: the plus belongs to `canAddBeside`
     and the KPI is not in it. A cap here would have removed its Replace as well, which is a swap
     rather than an add and is the one structural thing it should still offer. */
  const t = placedType(id);
  /* ⚠️ `l-divider` joins them for the same reason and one of its own: a rule fills the column it is
     dropped into, so neither axis had a position to report — and its sidebar Alignment accordion
     was removed for exactly that, so leaving the toolbar pair would have kept a second copy of a
     control that never worked. Direction replaces both. */
  if (t && ['c-records', 'b-accordion', 'c-faq', 'v-video', 'b-table', 'x-kpi', 'l-divider'].includes(t)) {
    return { alignH: false, alignV: false };
  }
  return {};
}

/* ⚠️ DISPLAY ONLY — what the toolbar lights when nobody has chosen an alignment, not a value
 * written into styles. The Quick Actions cards and the service tiles are stretched by their row's
 * own CSS, so a bar reporting "left" described a layout that does not exist. Writing `stretch`
 * into the store instead would have been a change to every page carrying one of these rows, made
 * to leave them looking exactly as they already look. */
export const defaultAlignH = (id: string): string =>
  (id === 'quick' || id === 'favourites' || id === 'services' ? 'stretch' : 'left');

export function paintsOwnSurface(id: string): boolean {
  /* ⚠️ The built-in quick-action cards too. Their Sel is a bare wrapper and the white card is a div
     INSIDE it, so padding applied to the wrapper landed between the selection outline and the card
     — visible as a growing gap around a card that never got roomier, which is not what padding
     means anywhere else on this page. A placed Action Card was already covered; these three were
     the same shape of thing reached by a different code path. */
  if (/^quick-/.test(id)) return true;
  /* ⚠️ The banner SEARCH too. Its Sel is a bare wrapper and the white field is a div inside it, so
     padding landed between the selection outline and the box — visible as a growing blue gutter
     around a search bar that never got roomier — and a dragged height grew the wrapper while the
     field stayed 44px. Both belong to the thing that is painted. */
  if (id === 'hero-search') return true;
  const t = placedType(id);
  if (!t) return false;
  /* ⚠️ SELF_SURFACED types count too. They are marked `bare` because they must not be wrapped in
     the generic Surface — they draw their OWN card — but "bare" was being read as "has no box", so
     an Action Card's padding went onto the wrapper and appeared outside the card it was supposed to
     be inside. Bare means nobody wraps it; it does not mean there is nothing to pad. */
  return ACTION_TYPES.has(t) || !renderSpec(t).bare;
}

/* The container styling a widget writes through its own CONFIG — fill, background image, border and
 * radius (spec §7.20/§7.21).
 *
 * ⚠️ It lives here, not in the preview, because two different renderers paint action cards — the
 * built-in quick cards and a dropped Action Card element — and they were painting from two different
 * places. The panel writes these keys into widget config; the built-in card was reading `styleOf`,
 * which is the STYLE store, so Fill, Background colour and Image were saved and never shown. One
 * function, both call sites, no way for them to disagree again. */
export function fillCss(c: Record<string, unknown>): CSSProperties {
  const fill = String(c.fill ?? 'none');
  const width = Number(c.borderWidth ?? 0);
  const css: CSSProperties = {
    /* ⚠️ backgroundColor, NOT the `background` shorthand. The shorthand resets backgroundImage,
       Size and Position, so mixing the two in one object makes React warn and makes the image fill
       fight the colour fill depending on which rendered last. Long-hand, the four are independent. */
    backgroundColor: fill === 'color' ? String(c.bg ?? '#FFFFFF') : undefined,
    backgroundImage: fill === 'image' && c.bgImage ? `url(${String(c.bgImage)})` : undefined,
    backgroundSize: fill === 'image' ? 'cover' : undefined,
    backgroundPosition: fill === 'image' ? 'center' : undefined,
    /* ⚠️ Border and radius only once there IS a fill — the panel gates its own fields the same way,
       and a 1px rule around a transparent band is a box drawn round nothing. */
    borderWidth: fill !== 'none' && width ? width : undefined,
    borderStyle: fill !== 'none' && width ? 'solid' : undefined,
    borderColor: fill !== 'none' && width ? String(c.borderColor ?? '#E5E7EB') : undefined,
    borderRadius: fill !== 'none' ? Number(c.radius ?? 0) || undefined : undefined,
  };
  /* ⚠️ UNSET keys are dropped, not returned as undefined. Spread over a base object, an explicit
     undefined DELETES whatever the base set — so a card whose fill is 'none' had its default white
     background and border stripped by the very function meant to leave them alone. The tell is a
     lone `border-image: none` left in the inline style where the border used to be. */
  return Object.fromEntries(Object.entries(css).filter(([, v]) => v !== undefined));
}
