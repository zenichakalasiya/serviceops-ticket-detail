/* Support Portal builder — structure and chrome (spec §7.20–7.24, build step 7).
 *
 * The Banner, the Section, the Page, the left rail and the top bar. These differ from §7's widgets
 * in one way that shapes everything: they are not things an admin ADDS, they are things the page
 * already is. So none of them can be deleted from the palette's point of view, and two of them —
 * the rail and the bar — hold destinations the product owns rather than content the admin writes.
 */

import type { WidgetSpec } from './portalWidgetSpec';

/* ── §7.20 Banner ────────────────────────────────────────────────────────── */

/* §7.20's search sub-element — its own layer, so clicking the search bar edits the SEARCH.
 *
 * ⚠️ It writes the BANNER's config keys (ownerOf strips -search), because there is one search
 * and one set of settings for it. Two stores would let the banner's "Show the search bar" and this
 * panel's disagree about whether there is a search at all.
 * ⚠️ "Show the search bar" USED to be repeated here, on the reasoning that it is the same control in
 * the place you are standing when you decide you do not want it. Removed on request: the panel is
 * the placeholder and nothing else, and hiding the search is done from the banner. */
export const SEARCH_SPEC: WidgetSpec = {
  id: 'search', name: 'Search', group: 'Structure', reuse: 'single', family: 'flat',
  panel: {
    /* ⚠️ ONE field. Scope and Suggestions describe what the search ENGINE does — the product's
       answer, not this page's. Show-the-search-bar went too: it is the one control here that is not
       about the search at all, it decides whether the banner HAS one, and it already exists on the
       Hero's panel. ⚠️ The consequence, stated because it is a real cost: hiding the search now
       means selecting the BANNER, not the search bar you are looking at. */
    content: [
      { key: 'searchPlaceholder', label: 'Placeholder', control: 'text' },
    ],
    accordions: [
      {
        id: 'style', open: true,
        fields: [
          { key: 'searchWidth', label: 'Width', control: 'slider', min: 40, max: 100, unit: '%' },
          { key: 'searchRadius', label: 'Corner radius', control: 'radius' },
        ],
      },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  /* Nothing in the palette can put the banner's search back, so removing it is the toggle above. */
  noDelete: true,
  fields: [], packs: [],
  defaults: { searchPlaceholder: 'How can we help you?', searchScope: 'knowledge', searchSuggestions: true, showSearch: true, searchWidth: 70, searchRadius: 4 },
};

export const HERO_SPEC: WidgetSpec = {
  id: 'hero', name: 'Banner', group: 'Structure', reuse: 'single', family: 'collection',
  fields: [
    { key: 'heading', label: 'Heading', control: 'text', group: 'Content' },
    { key: 'sub', label: 'Sub-heading', control: 'text', group: 'Content' },
    { key: 'showSearch', label: 'Show the search bar', control: 'toggle', group: 'Content' },
    { key: 'searchPlaceholder', label: 'Search placeholder', control: 'text', group: 'Content', when: (c) => c.showSearch !== false },
    /* ⚠️ FOUR named sizes, not a 120–600px slider. A banner has about four useful heights — enough
       for a line of text, the standard band, something you notice, and a near-full screen — and the
       slider invited a precision nobody wants: 347px is not a decision anyone made on purpose, and
       it is a decision that has to be re-made on every portal. The values are still plain pixels
       underneath, so the renderer is unchanged and an existing custom height keeps rendering; it
       simply is not typed by hand any more. */
    {
      key: 'height', label: 'Height', control: 'segmented', tab: 'style', group: 'Banner',
      options: [
        { value: '180', label: 'Short' },
        { value: '260', label: 'Standard' },
        { value: '360', label: 'Tall' },
        { value: '480', label: 'Full' },
      ],
    },
    /* ⚠️ Background is TWO TABS — Image or Colour — with image the default, because a banner is a
       picture first and the colour is what you fall back to. It replaced Fill's None / Colour /
       Image: "None" was never a real answer for a band whose whole job is to be a backdrop, and
       having the choice in two places (here and the shared Style pack) meant the two could disagree
       about what the band was showing. */
    {
      key: 'bgKind', label: 'Background', control: 'segmented', tab: 'style', group: 'Banner',
      options: [{ value: 'image', label: 'Image' }, { value: 'color', label: 'Colour' }],
    },
    {
      /* ⚠️ 1600 × 400 — the band is full-width and about 200px tall, so this is a 2× asset that
         stays sharp on a retina screen without being a photograph nobody needs. */
      key: 'bannerImage', label: 'Banner image', control: 'bannerUpload', suggested: '1600 × 400', tab: 'style', group: 'Banner',
      when: (c) => (c.bgKind ?? 'image') === 'image',
    },
    {
      key: 'bannerColor', label: 'Banner colour', control: 'color', tab: 'style', group: 'Banner',
      when: (c) => c.bgKind === 'color',
    },
    /* ⚠️ "Also use behind the whole page" is GONE, from the panel and from the canvas toolbar at the
       same time. It put one BLOCK in charge of the whole page's background — a change you make while
       looking at the banner and then find everywhere else — and the page already has its own
       background in Theme, which is where a page-wide decision belongs. The `bgWholePage` key and
       the renderer branch that reads it stay, so a portal that had it on still renders that way;
       nothing sets it any more. */
    /* Removed on request: Stretch to the page edges, Content max width, Heading colour, and with the
       colour gone the Contrast guard that measured it — and later Image fit, Focal point and Darken
       for text. ⚠️ "Tile the image" went with them rather than being kept: it was gated on Image fit
       being "Original size", so with that control gone it could never appear again — a field nothing
       can reveal is worse than an absent one, because it reads as a bug to whoever finds it in the
       spec. The renderer still reads the same cfg keys and the DEFAULTS below still declare them,
       so each falls back to its default and the band looks exactly as it did — cover, centred,
       unshaded. Putting any of them back is one line here, not a rebuild. */
    { key: 'searchWidth', label: 'Search width', control: 'slider', tab: 'style', group: 'Search', min: 40, max: 100, unit: '%', when: (c) => c.showSearch !== false },
    { key: 'searchRadius', label: 'Search corner radius', control: 'slider', tab: 'style', group: 'Search', min: 0, max: 24, when: (c) => c.showSearch !== false },
  ],
  /* ⚠️ NO P1. That pack opens with Fill (None / Colour / Image), which is the same question the
     Background tabs above already ask — two controls for one value, and the loser is whichever you
     did not touch last. The banner keeps its border, radius and spacing through its own rows. */
  packs: [],
  /* §7.20 — nothing in the palette can put a banner back, so Duplicate and Delete would be a
     one-way door. The overflow carries Move up / Move down / Reset to default only. */
  noDelete: true,
  /* ⚠️ No Parts collection. The heading, sub-heading and search bar are each wrapped in <Sel> on
     the canvas, so they are reached by clicking the words themselves — a list of them here was a
     second route to the same three places, and it was the only "collection" in the file with
     nothing to add, reorder or delete. */
  defaults: {
    heading: 'Welcome to Support Portal',
    sub: 'Search our support center knowledge base',
    showSearch: true,
    searchPlaceholder: 'How can we help you?',
    fullBleed: false,
    height: 260, contentAlign: 'center', contentMaxWidth: 70,
    bgKind: 'image', bannerColor: '#3D8BD0', bgWholePage: false,
    bannerFit: 'cover', bannerPos: 'center', bannerRepeat: false, bannerShade: 0,
    headingColor: '#FFFFFF', searchWidth: 70, searchRadius: 4,
    // §7.20's search sub-element.
    searchScope: 'knowledge', searchSuggestions: true,
  },
};

/** L6 — the Search bar's own drawer. Reached by selecting the search field on the canvas. */
/* ⚠️ `HERO_SEARCH_FIELDS` was deleted here. It described the search panel and NOTHING read it —
   the panel comes from `SEARCH_SPEC.panel.content` above — so it was a second definition of one
   screen, and the obvious place to make an edit that would have no effect. */

/* ── §7.21 Section ───────────────────────────────────────────────────────── */

export const SECTION_SPEC: WidgetSpec = {
  id: 'section', name: 'Section', group: 'Structure', reuse: 'many', family: 'container',
  /* The accordion model. ⚠️ NO Typography — a section has no type of its own; its children carry
     the text. And the STYLE accordion is three mutually exclusive fills, not a pile of always-on
     rows: None hides everything, Colour shows background + border + radius, Image shows the upload
     with border + radius only. Fields that do not apply are removed, never greyed. */
  panel: {
    content: [
      /* ⚠️ ONLY on the Quick Actions row. `__quickRow` is seeded by `cfgFor` for that one node, so
         every other section's Content section stays empty and drops out entirely — the same
         `hasContentSection` rule that hides a heading introducing nothing.
         ⚠️ This does NOT reopen `LOCKED_ROWS`. The row still refuses everything the palette can
         offer, by drag or by click; it gains ONE card, from its own panel, with a fixed destination.
         A locked row and a row with one door are different things. */
      { key: '__addLink', label: '', control: 'addLinkCard', when: (c) => c.__quickRow === true },
      /* ⚠️ NO Name field. It was editor-only — "Only you see this" — and NOTHING read it: the hover
         chip, the breadcrumb and the drawer title all take their words from `nodeById`, which
         hard-codes them, which is why the panel says "Cards Row / Section" whatever you typed. A
         text box that changes nothing anywhere, sitting first in the panel above the controls that
         do. ⚠️ Columns never had one, so nothing nested is affected: `sec-N-cM` resolves to
         `COLUMN_SPEC`, which is fields-only and has no Content section at all.
         Card templates is chosen HERE, on the parent, so every card in the row shares a shape. A
         row of cards that do not agree reads as an accident, which is why the card has no Layout
         accordion. */
      /* ⚠️ Card templates is NOT here any more — it lives on each action card's own panel.
         It sat on the parent so every card in a row would share a shape, and a row of cards that do
         not agree does read as an accident. Per-card is the deliberate trade: the row can now hold
         four different shapes, and whoever builds it owns that. The section's `cardTemplate` default
         below stays, because the renderer still falls back to it for a card that has never been
         given one — so an untouched row still comes out uniform. */
    ],
    /* ⚠️ Layout and Size are gone from the SECTION as well, for the same reason they left the widget
       drawer: the column adders on the canvas set the count, the drag handles set the height, and a
       panel copy of either meant two controls for one value. The gap survives inside Layout nowhere
       — it moved out with the accordion, because a row's gap is visible on the canvas the moment you
       change a column and nobody reaches for a slider to find it.
       ⚠️ Shadow is gone too. It was one toggle producing one fixed drop shadow on a band that spans
       the page — an effect nobody was asking a full-width section for, sitting in the same list as
       the fill that actually changes how the page reads. */
    accordions: [
      /* ⚠️ Layout is BACK on the section, because it now does something. It left when its only rows
         were a column count the canvas already set and an alignment nothing read; what replaces it
         is a preset row that rewrites the section's shape and reflows its contents, with the two
         alignment rows underneath following whichever axis that shape produced. */
      {
        id: 'layout', open: true,
        /* ⚠️ NO Behaviour row. The Row/Column control that decided which way a section lays its
           children out is off the panel across the whole module — removed 25 Aug. The tree model
           behind it stays (`Box.dir`, `splitBox`, the axis-aware adders), so nothing on the canvas
           changed and putting the control back is one field; it simply is not a panel decision
           while the section work is parked. */
        fields: [
          { key: 'preset', label: 'Presets', control: 'sectionPreset', when: (c) => Number(c.__count ?? 0) > 1 },
          /* ⚠️ On the PARENT, not on each column — the same reason Card templates sits here. How a
             row redistributes is a property of the row: two columns in one section answering that
             question differently is not a layout, it is an argument. Every section gets it, empty
             ones included, because a section's first column is resizable the moment it exists.
             ⚠️ Switching modes CLEARS the widths already dragged onto this section's columns (see
             `patchCfg` in the builder). Fill stores a share of the row and Fixed stores a width of
             its own; a value left behind by the other mode is read by the wrong rule, which collapses
             or overflows the row. Redistributing is also the honest answer to "what does this row do
             now" — you changed the rule it distributes by. */
          { key: 'resize', label: 'Responsive behaviour', control: 'select',
            options: [
              { value: 'fill', label: 'Fill items' },
              { value: 'fixed', label: 'Fixed items' },
            ],
            info: 'Fill — dragging one column re-flows its siblings so the row always fills the section. Fixed — every column keeps its own width, and dragging one leaves the others exactly where they are.' },
          { key: 'distribute', label: 'Content alignment', control: 'distribute', when: (c) => Number(c.__count ?? 0) > 1 },
          { key: 'valign', label: '', control: 'valign', when: (c) => Number(c.__count ?? 0) > 1 },
        ],
      },
      {
        id: 'style',
        fields: [
          /* ⚠️ NO Image fill — None and Colour only, the same two P1 already offers everywhere else.
             A background photograph behind a card or a band is not a fill, it is artwork: it needs a
             crop, a focal point and a contrast guard to stay readable, and a segmented control can
             offer none of the three. Where a picture genuinely belongs — the banner, an action
             card's icon slot — it has its own field that does all three properly.
             ⚠️ `bgImage` stays in `defaults` and the renderer still reads it, so anything already
             carrying one keeps drawing it; there is simply no longer a way to set one here. */
          { key: 'fill', label: 'Fill', control: 'segmented',
            options: [{ value: 'none', label: 'None' }, { value: 'color', label: 'Colour' }] },
          { key: 'bg', label: 'Background colour', control: 'color', when: (c) => c.fill === 'color' },
          { key: 'borderWidth', label: 'Border', control: 'borderRow', when: (c) => c.fill !== 'none' },
          { key: 'radius', label: 'Corner radius', control: 'radius', when: (c) => c.fill !== 'none' },
        ],
      },
      { id: 'spacing', spacing: 'both' },
      /* ⚠️ There is NO separate Alignment accordion any more. It held the same two rows Layout
         holds, writing the same two keys — so a section had two Content-alignment controls that
         could show different things depending on which one you had touched last. They belong with
         the preset, because the preset is what decides which axis the words even refer to. */
    ],
  },
  noDelete: true,
  fields: [], packs: [],
  /* ⚠️ NO cols/padTop/padBottom default — a spec default is shared by EVERY section, and the bands
     do not share a column count. Seeded per node in the builder instead. */
  /* ⚠️ `bg` needs a default of its own. Without one the panel's colour field fell back to its
     control default while the canvas fell back to white — so the swatch said one colour and the
     band painted another, and the fill looked broken when it was only unset. */
  defaults: { cardTemplate: 'left', resize: 'fill', colGap: 16, fill: 'none', bg: '#FFFFFF', borderWidth: 0, borderColor: '#E5E7EB', radius: 8, minHeight: 0 },
};

/** L2 — a column owns its width and the alignment of the blocks inside it. Nothing else (§7.21). */
export const COLUMN_SPEC: WidgetSpec = {
  id: 'column', name: 'Column', group: 'Structure', reuse: 'many', family: 'container',
  /* ⚠️ BOTH fields are gated on the box having something in it, which drops the whole Column group
     for an empty one — a group with no visible fields is not rendered at all.
     "Align the blocks inside" is the obvious case: there are no blocks. Width goes with it because
     an empty column has no content to be a width OF — it is a placeholder waiting to be filled, and
     a panel offering to size a placeholder is asking a question about nothing. Both come back the
     moment anything lands in it, and the drag handles set the width either way. */
  fields: [
    {
      key: 'width', label: 'Width', control: 'slider', tab: 'style', group: 'Column', min: 10, max: 90, unit: '%',
      when: (c) => c.hasContent !== false,
    },
    {
      key: 'blockAlign', label: 'Align the blocks inside', control: 'segmented', tab: 'style', group: 'Column',
      options: [{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }],
      when: (c) => c.hasContent !== false,
    },
  ],
  packs: ['P1'],
  noDelete: true,
  notes: [{ tone: 'info', text: 'A column owns its width and how the blocks inside it sit. Everything else belongs to the section above it or the blocks within it.' }],
  defaults: { width: 50, blockAlign: 'start' },
};

/* ── §7.22 Page ──────────────────────────────────────────────────────────── */

export const PAGE_SPEC: WidgetSpec = {
  id: 'page', name: 'Page', group: 'Structure', reuse: 'single', family: 'container',
  fields: [
  ],
  packs: ['P1'],
  noDelete: true,
  /* ⚠️ Typeface, text scale and the palette USED to live here as three colour fields. They moved to
     the Theme panel in the rail when a theme became mode + palette + type + button shape — a page is
     one of the things a theme paints, not the place the theme is kept. */
  notes: [{ tone: 'info', text: 'Typeface and colours are set once for the whole portal in Theme, in the right-hand rail. This page keeps its own background and spacing.' }],
  defaults: {},
};

/* ── §7.23 Left rail ─────────────────────────────────────────────────────── */

const RAIL_ITEMS = [
  { id: 'r1', name: 'Requests', route: '/requests' },
  { id: 'r2', name: 'Changes', route: '/changes' },
  { id: 'r3', name: 'My Assets', route: '/assets' },
  { id: 'r4', name: 'My CIs', route: '/cis', perm: 'Allow Requester to Access My CI' },
  { id: 'r5', name: 'Knowledge', route: '/knowledge', perm: 'Allow Requester To Access Knowledge' },
  { id: 'r6', name: 'My Approvals', route: '/approvals', perm: 'Allow Requester To Access My Approvals' },
  { id: 'r7', name: 'My Team', route: '/team' },
  { id: 'r8', name: 'Tasks', route: '/tasks' },
];

/* ── the top bar's action icons ────────────────────────────────────────────
 *
 * ⚠️ NO Design section at all — no Style, no Spacing — for the same reason the left rail has none:
 * these are the PRODUCT's actions. Ask AI, the create button, notifications and the avatar appear on
 * every screen of every portal, and an admin who could restyle or re-space them could make the one
 * control that is everywhere look unlike the product it belongs to.
 * ⚠️ It needs a spec at all because without one it fell through to the LEGACY `PortalElementPanel`,
 * which hands every unrecognised node a generic Style and Spacing block — the two sections that
 * should never have been on offer here. A node with no spec does not get "no panel", it gets the
 * default one. */
/* The bar's arrangeable actions, in their real order.
   ⚠️ Ask AI, Create and the profile avatar are deliberately NOT here. They flank the cluster and
   are fixed: Ask AI is a labelled button rather than a glyph, Create is the product's one primary
   action, and an avatar at the far right is where every application in this suite puts it. A list
   that showed all nine would offer three rows that refuse to move, which is worse than not offering
   them — the panel would be describing a freedom the bar does not have. */
const HEADER_ACTION_ITEMS = [
  { id: 'type', name: 'Text', route: 'Font size' },
  { id: 'chat', name: 'Conversations', route: 'Messages' },
  { id: 'bell', name: 'Notifications', route: 'Alerts' },
  { id: 'keys', name: 'Shortcuts', route: 'Keyboard' },
  { id: 'home', name: 'Home', route: 'Portal home' },
  { id: 'info', name: 'Help', route: 'Support' },
];

/* ── The top bar's action cluster ─────────────────────────────────────────────
 *
 * ⚠️ It now has the SAME panel the left rail has, and for the same reason: these are the product's
 * own controls, so their ORDER is the admin's and nothing else is. Earlier this spec deliberately
 * offered no list at all — the cluster was treated as one indivisible unit — but an admin who can
 * drag the icons on the canvas and cannot see them anywhere in the panel has a gesture with no
 * inventory: no way to know what is there, in what order, or that reordering was ever possible.
 * The list is the canvas drag written down.
 *
 * ⚠️ The list and the canvas write the SAME value (`items` on this node). Two orders — one stored
 * and one in a component's local state — is exactly the fault the bar used to carry: the icons
 * moved, nothing was saved, and reopening the page put them back. */
export const HEADER_ACTIONS_SPEC: WidgetSpec = {
  id: 'header_actions', name: 'Actions', group: 'Chrome', reuse: 'single', family: 'collection',
  fields: [],
  packs: [],
  noDelete: true,
  notes: [{
    tone: 'info',
    text: 'These belong to the product and look the same on every portal. You can reorder them — here or by dragging them in the bar — but not add, remove or restyle them. What a requester can reach through them is set by their permissions, not here.',
  }],
  collection: {
    key: 'items', group: 'Actions', addLabel: '', emptyHint: '',
    /* FLAT for the rail's reason — this panel is one list and nothing else, so a collapsible group
       would put a chevron above the only thing there is to see. */
    flat: true,
    noAdd: true, noOpen: true,
    label: (it) => String(it.name ?? ''),
    meta: (it) => String(it.route ?? ''),
    seed: () => ({}),
    fields: [],
  },
  defaults: { items: HEADER_ACTION_ITEMS },
};

export const RAIL_SPEC: WidgetSpec = {
  id: 'rail', name: 'Left rail', group: 'Chrome', reuse: 'single', family: 'collection',
  /* ⚠️ CONTENT only — no Design section at all. The rail is the product's own navigation: an admin
     who could set its width, icon size, active-item treatment and spacing could make the one control
     that appears on every screen of the portal look unlike the product it belongs to. The single
     visual decision that is genuinely theirs is WHERE the icons sit, so that is the only one here,
     and it lives with the destinations it arranges rather than in a styling section of its own. */
  fields: [],
  packs: [],
  noDelete: true,
  /* §7.23 — order and visibility are the admin's; the destinations are the product's. So the list
     has no Add and no Delete, and a permission the requester lacks is not something to "enable"
     from here. */
  notes: [{
    tone: 'info',
    text: 'These destinations belong to the product — you can reorder them, but not add, remove or hide them. A destination the requester is not permitted to reach never appears, whatever the order.',
  }],
  collection: {
    key: 'items', group: 'Destinations', addLabel: '', emptyHint: '',
    /* ⚠️ FLAT. This panel is one list and nothing else, so wrapping it in a collapsible group put a
       header and a chevron above the only thing there is to see — and left it possible to close the
       panel's entire content while the panel stayed open. */
    flat: true,
    /* ⚠️ NOT hideable. The eye was the only per-row action on this list, and what it offered was
       removing a product destination from the one navigation that appears on every screen of the
       portal — the same power `noAdd` already withholds at the other end. The ORDER is the admin's;
       which destinations exist is not. The note above says so, so the rule is legible rather than
       just enforced. */
    noAdd: true, noOpen: true,
    label: (it) => String(it.name ?? ''),
    meta: (it) => String(it.route ?? ''),
    seed: () => ({}),
    fields: [],
  },
  defaults: { items: RAIL_ITEMS },
};

/* ── §7.24 Top bar ───────────────────────────────────────────────────────── */

/* Every action the real top bar carries, in its real order. ⚠️ The four NAVIGATION links were
   removed (the left rail already reaches all of them) — the ACTIONS were not, and rebuilding the
   bar from this list is what makes reordering the logo against them actually work. */
const NAV_ITEMS = [
  { id: 'n0', name: 'Logo', kind: 'logo', fixedVisible: true },
  { id: 'n1', name: 'Ask AI', kind: 'action' },
  { id: 'n2', name: 'Create', kind: 'action' },
  { id: 'n3', name: 'Text', kind: 'action' },
  { id: 'n4', name: 'Conversations', kind: 'action' },
  { id: 'n5', name: 'Notifications', kind: 'action' },
  { id: 'n6', name: 'Shortcuts', kind: 'action' },
  { id: 'n7', name: 'Home', kind: 'action' },
  { id: 'n8', name: 'Help', kind: 'action' },
  { id: 'n9', name: 'Profile', kind: 'action' },
];

/* ── The logo ────────────────────────────────────────────────────────────────
 *
 * ⚠️ Its own spec, so selecting the logo edits the LOGO. It used to resolve to the top bar, which
 * meant clicking the one image on the page opened the bar's background colour, height and divider —
 * and the upload you were aiming at sat third in a list about something else.
 * ⚠️ NO Layout accordion. Where the logo sits is `logoPos` on the BAR, because it is a position
 * relative to the actions beside it — a layout section here would be a second control for a value
 * that is not even this node's to hold. */
export const LOGO_SPEC: WidgetSpec = {
  id: 'logo', name: 'Logo', group: 'Chrome', reuse: 'single', family: 'flat',
  panel: {
    /* ⚠️ 240 × 64 — the top bar renders the mark at about 28px tall, so this is the 2× of a
       comfortable wordmark. Wider than tall, because every logo in that bar is. */
    content: [{ key: 'logoSrc', label: 'Logo image', control: 'upload', suggested: '240 × 64', noun: 'logo' }],
    /* ⚠️ NO Design section. A logo is one supplied image sitting in the product's own bar: filling
       it, bordering it or rounding it styles a mark somebody else's brand guidelines own, and its
       spacing belongs to the bar — which is already why `logoPos` lives there. The panel is the
       upload and nothing else, which is the whole truth about this layer. */
    accordions: [],
  },
  noDelete: true,
  notes: [{ tone: 'info', text: 'Where the logo sits against the actions is set on the top bar, since it is a position relative to them.' }],
  fields: [], packs: [],
  defaults: {},
};

export const NAVBAR_SPEC: WidgetSpec = {
  id: 'navbar', name: 'Top bar', group: 'Chrome', reuse: 'single', family: 'container',
  /* ⚠️ NO item list. The bar is two things, not ten: the logo, and the actions AS ONE BLOCK.
     Letting someone drag Bell between Home and Help is a freedom nobody wants and a bar nobody can
     read — the action cluster is a unit that belongs top-right. What IS worth arranging is where
     the logo sits against it, which is the one control below. */
  panel: {
    content: [
      { key: 'logoSrc', label: 'Logo', control: 'upload' },
      {
        key: 'logoPos', label: 'Logo position', control: 'segmented',
        options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }],
      },
    ],
    accordions: [
      {
        id: 'style', open: true,
        fields: [
          { key: 'barBg', label: 'Background colour', control: 'color' },
          { key: 'barHeight', label: 'Bar height', control: 'sliderUnit', min: 48, max: 96, unit: 'px' },
          /* ⚠️ "Divider under the bar" is gone, and `barDivider` stays in `defaults` where the
             renderer still reads it — so every bar keeps the line it already draws. A hairline
             between the product's own top bar and the page under it is not a decision worth a
             switch: with it the bar reads as chrome, without it the bar and the banner run into
             each other, and only one of those is ever the answer. */
          /* ⚠️ NO Shadow control. A full-width band at the very top of the page is the one surface
             where a drop shadow reads as a rendering artefact rather than as depth. The four
             `shadow*` keys stay in `defaults` and the renderer still reads them, so a bar that
             already carries one keeps drawing it — there is simply no longer a way to set one. */
        ],
      },
      { id: 'spacing', spacing: 'both' },
    ],
  },
  noDelete: true,
  fields: [], packs: [],
  defaults: {
    logoSrc: '', logoPos: 'left',
    barBg: '#FFFFFF', barHeight: 56, barDivider: true,
    shadowOn: false, shadowColor: '#0F172A', shadowType: 'outer', shadowPos: 'bottom',
  },
};

export const STRUCTURE_SPECS: WidgetSpec[] = [
  HERO_SPEC, SEARCH_SPEC, SECTION_SPEC, COLUMN_SPEC, PAGE_SPEC, RAIL_SPEC, NAVBAR_SPEC, LOGO_SPEC,
  HEADER_ACTIONS_SPEC,
];
