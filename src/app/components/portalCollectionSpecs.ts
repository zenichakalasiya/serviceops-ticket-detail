/* Support Portal builder — the collection widgets (spec §7.9, §7.15–7.19).
 *
 * Kept apart from the flat widgets because they carry a second and third editing layer: the widget,
 * its items, and an item's sub-elements. The SHAPE is identical for all six — that is the §4
 * contract — so what differs here is only the item's own fields and the widget's own styling.
 *
 * Seeds matter (§8.4 rule 4): a new item arrives with plausible copy, never `Untitled`, so the page
 * reads as something on the day it is dropped and the list rows are scannable.
 */

import type { Cfg, WidgetField, WidgetSpec } from './portalWidgetSpec';

/* Shared option sets, declared ABOVE every spec that uses them.
   ⚠️ Position matters: these are module-level consts referenced inside spec object literals, so
   declaring them further down the file is a temporal-dead-zone crash at import time — and esbuild
   does not typecheck, so the build stays green while the page goes blank. */
const FONTS = ['Inherit from theme', 'Inter', 'Poppins', 'Roboto', 'Source Sans 3', 'Merriweather'];
const WEIGHTS = ['Light', 'Normal', 'Medium', 'Semibold', 'Bold'];
const FORMATS = ['Bold', 'Underline', 'Italic'];
const ALIGN_4 = [
  { value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' },
];

let seq = 0;
export const nextItemId = () => `k${(seq += 1)}`;

/* ── §7.16 FAQ ───────────────────────────────────────────────────────────── */

const FAQ_SEEDS: Cfg[] = [
  {
    q: 'How do I reset my password?',
    a: 'Use AD Self Service on the portal home. If your account is locked, raise an incident and the service desk will unlock it.',
  },
  {
    q: 'How long until someone picks up my ticket?',
    a: 'A P3 request is picked up within one working day. P1 and P2 are picked up inside the hour, around the clock.',
  },
  {
    q: 'How do I request new software?',
    a: 'Request it from the service catalog. Anything with a licence cost goes to your line manager for approval first.',
  },
];

const FAQ_NEW: Cfg[] = [
  { q: 'Who do I contact out of hours?', a: 'The on-call service desk number is on the Contact Us card.' },
  { q: 'Can I track a request I raised for someone else?', a: 'Yes — switch My Open Requests to “Raised for me”.' },
  { q: 'How do I get access to a shared mailbox?', a: 'Raise a service request; the mailbox owner approves it.' },
];

export const FAQ_SPEC: WidgetSpec = {
  id: 'faq', name: 'FAQ', group: 'Content', reuse: 'many', family: 'collection',
  /* ⚠️ A Title and nothing else. Out went the BEHAVIOUR group (show-first-open, allow-multi-open)
     and the whole ACCORDION style group — item container, divider, chevron position, chevron
     rotation, question padding, answer indent, open-item background, expand animation. Thirteen
     controls for a list of questions, and not one of them was a decision worth making twice.
     Design is now **Style** + **Spacing**, which is exactly the Accordion's panel — the two widgets
     now behave identically by design (see the note below). Every removed value stays in `defaults`
     and is still read by the renderer, so the FAQ on the canvas is unchanged: flat, dividers on,
     chevron right, rotating. */
  fields: [
    { key: 'title', label: 'Title', control: 'text', group: 'Content' },
  ],
  packs: ['P1'],
  /* ⚠️ Said ONCE, here: the platform has no FAQ entity, so this content is authored and the drawer
     must never imply a data source. Anything needing review or versioning is a knowledge article. */
  notes: [{
    tone: 'info',
    text: 'These questions are written here, not fetched from anywhere — the platform has no FAQ records. Anything that needs review, an owner or version history belongs in a knowledge article instead.',
  }],
  collection: {
    key: 'items', group: 'Questions', addLabel: 'Add question',
    emptyHint: 'No questions yet. A FAQ with nothing in it is invisible on the portal.',
    /* Same as the Accordion: a question you just chose to add waits for YOUR question. */
    blankOnAdd: true,
    label: (it) => String(it.q ?? ''),
    meta: (it) => String(it.a ?? '').replace(/<[^>]+>/g, '').slice(0, 60),
    seed: (i) => ({ ...FAQ_NEW[i % FAQ_NEW.length] }),
    fields: [
      { key: 'q', label: 'Question', control: 'text', group: 'Content', placeholder: 'How do I reset my password?' },
      { key: 'a', label: 'Answer', control: 'rich', group: 'Content', placeholder: 'Answer it in a sentence or two.', help: 'Links and lists matter here.' },
      /* ⚠️ "Open by default" went with the widget toggle it existed to OVERRIDE. A per-item override
         of a setting nobody can set any more is a control answering a question that cannot be
         asked. The renderer still honours the key, so a question already flagged open stays open. */
    ],
    packs: ['P1'],
    subElements: [
      { key: 'q', name: 'Question', role: 'subtitle' },
      { key: 'a', name: 'Answer', role: 'body' },
    ],
  },
  /* ⚠️ Every one of these is still READ by the renderer — they are what keep the card looking
     exactly as it did once the controls went. Deleting them would restyle every existing FAQ.
     `allowMultiOpen` is gone entirely rather than defaulted: the FAQ now opens one answer at a time
     the way the Accordion does, which is what "work the same as our accordion" asked for. */
  defaults: {
    title: 'Frequently asked questions',
    openFirst: false,
    itemContainer: 'flat', itemDivider: true, chevron: 'right', chevronRotates: true,
    qPad: 12, aIndent: 0, animation: 'normal',
    items: FAQ_SEEDS.map((s, i) => ({ id: `faq${i}`, ...s })),
  },
};

/* ── §7.15 Card ──────────────────────────────────────────────────────────── */

export const CARD_SPEC: WidgetSpec = {
  id: 'card', name: 'Card', group: 'Content', reuse: 'many', family: 'collection',
  fields: [
    {
      /* ⚠️ Layout is in CONTENT, beside the picture and the words it arranges — the same place the
         action card keeps its templates. Shape stays in Design: how a picture is CROPPED is a look,
         but where it sits is the shape of the thing you are filling in. */
      key: 'template', label: 'Card templates', control: 'templates', group: 'Card properties',
      help: 'Where the image sits is the real question, so pick it by looking rather than by reading.',
      /* ⚠️ Leaving Icon top while the shape is Banner would strand a full-width bar beside the
         title. The shape falls back to Circle and the drawer SAYS it did — a silent repair is how
         people lose a setting they never saw change. */
      consequence: (v, c) => (v !== 'top' && c.imageShape === 'wide'
        ? { patch: { imageShape: 'circle' }, say: 'Banner needs the Icon top layout — the shape went back to Circle' }
        : undefined),
    },
    { key: 'image', label: 'Image', control: 'upload', group: 'Card properties', when: (c) => c.template !== 'none' },
    {
      key: 'imageShape', label: 'Shape', control: 'shape', tab: 'style', group: 'Card',
      when: (c) => c.template !== 'none',
      // Banner is a full-width bar, so it is only OFFERED on Icon top — it has nowhere to go beside text.
      options: (c) => (c.template === 'top'
        ? [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'wide', label: 'Banner' }]
        : [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }]),
    },
    { key: 'title', label: 'Card title', control: 'text', group: 'Card properties' },
    { key: 'body', label: 'Description', control: 'textarea', group: 'Card properties' },
    { key: 'link', label: 'Link', control: 'text', group: 'Card properties', help: 'Leave blank to make it read-only.' },
    { key: 'newTab', label: 'Open in a new tab', control: 'toggle', group: 'Card properties', when: (c) => !!c.link },

    {
      key: 'contentAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Card',
      options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }],
    },
  ],
  /* ⚠️ No P5 Media. An image's crop, ratio and focal point are edited on the IMAGE, not from the
     card that happens to hold one — a Media section here styled something the card does not own. */
  packs: ['P1', 'P2', 'P4'],
  collection: {
    key: 'children', group: 'Extra content', addLabel: 'Add a block',
    emptyHint: 'A card is a container. Add a Text, Image or Button block to put something else inside it.',
    /* A child block is an ORDINARY widget — it opens the same panels its type opens out on the
       page, which is why the item carries a `type` the drawer routes on. */
    childTypes: [
      { type: 'text', label: 'Text' },
      { type: 'image', label: 'Image' },
      { type: 'button', label: 'Button' },
    ],
    label: (it) => String(it.label ?? it.title ?? it.html ?? 'Block').replace(/<[^>]+>/g, '').slice(0, 44),
    meta: (it) => String(it.type ?? ''),
    seed: () => ({ type: 'text', html: 'A line of supporting copy.' }),
    fields: [],
  },
  defaults: {
    template: 'left', imageShape: 'circle', title: 'Custom card', body: 'Add card description',
    link: '', newTab: true, pad: 16, border: 'line', contentAlign: 'left', children: [],
  },
};

/* ── §7.17 Table ─────────────────────────────────────────────────────────── */

/* An escalation matrix — exactly the case §7.17 says a static table is right for: short, stable
   content that is not already a record in the system. */
const TABLE_SEED = [
  ['Tier', 'Contact', 'Response'],
  ['L1 · Service Desk', 'servicedesk@acme.com', '30 min'],
  ['L2 · Infrastructure', 'infra@acme.com', '2 hrs'],
];

export const TABLE_SPEC: WidgetSpec = {
  id: 'table', name: 'Table', group: 'Content', reuse: 'many', family: 'collection',
  fields: [
    /* Size leads: you decide the shape before you fill it, and the picker is the only control here
       that changes what the other fields are even editing. */
    /* ⚠️ One CTA, not a size sweeper plus a row list. The sheet decides its own size by what you
       type into it, so asking for R × C first was asking a question the content already answers. */
    /* ⚠️ SIZE first, content second — you decide the shape before you fill it, and the picker is
       the only control here that changes what the sheet below is even editing. */
    { key: 'table', label: 'Select row / column cells', control: 'tableSize', group: 'Content' },
    /* ⚠️ The sheet editor is GONE. It was the second way to type into this table, and the canvas is
       now the first — you click a cell and type. Two editors for one grid is how the panel and the
       page start disagreeing, and the one reachable only through a dialog was the worse of the two.
       ⚠️ No "Optional." under the title either: every field on this panel is optional, so saying it
       on one of them implies the rest are not. */
    { key: 'title', label: 'Title', control: 'text', group: 'Content' },
    /* ⚠️ The two header switches sit TOGETHER, in Content (§6). "First column" used to live under
       Border in the Style tab, which put one half of a pair of questions two tabs away from the
       other — and both are about what the table MEANS, not what it looks like.
       Each is also reachable from its own handle menu on the canvas; both write these keys, so the
       switch and the menu item cannot disagree. */
    { key: 'headerRow', label: 'First row is a header', control: 'toggle', group: 'Content' },
    { key: 'firstColumn', label: 'First column is a header', control: 'toggle', group: 'Content' },
    /* §7.17's column list. Width and alignment live HERE rather than in a second Styling block —
       reordering a column and setting its width are the same act of shaping the table, and the
       spec's own rule forbids two controls for one value. */
    /* ⚠️ No per-column width/alignment list. Columns are equal by construction now, and one
       Alignment row under Table governs every cell — a per-column editor was a second, finer answer
       to two questions the table already answers once. */
    /* ── Table ──
     * ⚠️ THREE groups left this panel at once, each for the same reason: the canvas answers it
     * better. **Text style** was fourteen controls — header and row background, font, weight, size,
     * colour and format — for a look you now set per cell from the cell's own menu, where you can
     * see what you are changing. **Alignment** goes because the cell menu aligns per cell and per
     * selection, which is the only scale at which a table's alignment is ever really decided. And
     * **Border** drew a frame round a grid whose lines the cells already draw.
     * ⚠️ Every removed value stays in `defaults` and is still read by the renderer, so no table on
     * any page moved — the controls simply stopped being duplicated. */
    { key: 'cellPad', label: 'Cell padding', control: 'sliderUnit', tab: 'style', group: 'Table', min: 4, max: 24, unit: 'px' },
    /* ⚠️ "Horizontal scroll on narrow screens" is GONE, and unlike the other removals this one took
       its stored value with it. It is not a look an admin chooses — it is what a wide table has to
       do on a phone, and asking every author to decide it put a question on the panel that has only
       one sensible answer. The renderer now scrolls unconditionally, so there is no key left to
       hold a value nothing can set. */

  ],
  /* ⚠️ No P1. The table's fill, border and radius are answered by Frame and by the Header/Rows
     backgrounds — a Style section on top of those is a third place to set the same box. */
  packs: ['P2'],
  /* The 10×10 cap is not technical. It is the point past which a static table wants search, sorting
     and paging — which means it wants to be a knowledge article. */
  notes: [{
    tone: 'info',
    text: 'This binds to nothing, which is exactly when it is right: short, stable content that is not already a record. Past about ten rows it wants search and sorting — which means it wants to be a knowledge article.',
  }],
  /* ⚠️ No row COLLECTION. Rows are edited in the sheet, so a second list of them in the panel
     would be two editors for one grid — and the one that could only add a row at a time was the
     worse of the two. */
  defaults: {
    title: '', headerRow: true, firstColumn: true,
    styleTab: 'header', headBg: '#F9FAFB', headFont: 'Inherit from theme', headWeight: 'Semibold', headSize: 13, headColor: '#364658', headFormat: [],
    evenBg: '#FFFFFF', oddBg: '#FFFFFF', rowFont: 'Inherit from theme', rowWeight: 'Normal', rowSize: 13, rowColor: '#364658', rowFormat: [],
    /* ⚠️ Even widths are the DEFAULT. Off, the table falls back to the per-column widths from the
       columns editor, which is a deliberate choice rather than the resting state — a fresh table
       whose columns each sized to their own longest cell is the ragged thing this fixes. */
    /* ⚠️ `firstColumn` is seeded TRUE beside `headerRow` above; this line used to set it back to
       false further down the same object, so the later one won and the toggle shipped off. */
    cellAlign: 'left',
    frameBorderWidth: 1, frameBorderColor: '#E5E7EB', shadowOn: false,
    cellPad: 8,
    rows: TABLE_SEED.map((cells, i) => ({ id: `r${i}`, cells })),
    cols: 3,
    // Equal widths and left alignment until someone decides otherwise (§7.17 defaults).
    widths: [34, 33, 33],
    aligns: ['left', 'left', 'left'],
  },
};

/* ── §7.18 Media Slider ──────────────────────────────────────────────────── */

export const SLIDER_SPEC: WidgetSpec = {
  id: 'media_slider', name: 'Media Slider', group: 'Content', reuse: 'many', family: 'collection',
  fields: [
    { key: 'title', label: 'Title', control: 'text', group: 'Content', help: 'Optional — hidden when blank.' },
    { key: 'autoplay', label: 'Autoplay', control: 'toggle', group: 'Playback' },
    { key: 'interval', label: 'Interval', control: 'number', group: 'Playback', min: 2, max: 20, when: (c) => c.autoplay === true },
    { key: 'pauseOnHover', label: 'Pause on hover', control: 'toggle', group: 'Playback', when: (c) => c.autoplay === true },
    { key: 'loop', label: 'Loop', control: 'toggle', group: 'Playback' },
    { key: 'arrows', label: 'Show arrows', control: 'toggle', group: 'Navigation' },
    { key: 'dots', label: 'Show dots', control: 'toggle', group: 'Navigation' },
    { key: 'swipe', label: 'Allow swipe / drag', control: 'toggle', group: 'Navigation' },
    // Accessibility floor, not an option (§8.5).
    { key: 'keyboard', label: 'Keyboard navigation', control: 'lockedToggle', group: 'Navigation', help: 'Always on. A slider nobody can tab through is a slider some people cannot use.' },
    { key: 'perView', label: 'Slides per view', control: 'number', tab: 'style', group: 'Track', min: 1, max: 4 },
    { key: 'trackGap', label: 'Gap between slides', control: 'slider', tab: 'style', group: 'Track', min: 0, max: 32 },
    {
      key: 'transition', label: 'Transition', control: 'segmented', tab: 'style', group: 'Track',
      options: [{ value: 'slide', label: 'Slide' }, { value: 'fade', label: 'Fade' }],
    },
    {
      key: 'speed', label: 'Transition speed', control: 'segmented', tab: 'style', group: 'Track',
      options: [{ value: 'fast', label: 'Fast' }, { value: 'normal', label: 'Normal' }, { value: 'slow', label: 'Slow' }],
    },
    { key: 'slideMaxWidth', label: 'Content max width', control: 'slider', tab: 'style', group: 'Slide', min: 30, max: 100, unit: '%' },
    { key: 'slideOverlay', label: 'Text-over-media overlay', control: 'slider', tab: 'style', group: 'Slide', min: 0, max: 80, unit: '%' },
    {
      key: 'arrowPlacement', label: 'Arrow placement', control: 'segmented', tab: 'style', group: 'Arrows',
      options: [{ value: 'inside', label: 'Inside' }, { value: 'outside', label: 'Outside' }, { value: 'over', label: 'Over media' }],
    },
    {
      key: 'dotPlacement', label: 'Dot placement', control: 'segmented', tab: 'style', group: 'Dots',
      options: [{ value: 'over', label: 'Over media' }, { value: 'below', label: 'Below' }],
    },
    {
      key: 'dotStyle', label: 'Dot style', control: 'segmented', tab: 'style', group: 'Dots',
      options: [{ value: 'dots', label: 'Dots' }, { value: 'bars', label: 'Bars' }, { value: 'numbers', label: 'Numbers' }],
    },
  ],
  packs: ['P1', 'P2', 'P5'],
  collection: {
    key: 'slides', group: 'Slides', addLabel: 'Add slide', max: 10, hideable: true,
    emptyHint: 'No slides yet. A slider with nothing in it renders as an empty band.',
    label: (it, i) => String(it.heading ?? '') || `Slide ${i + 1}`,
    meta: (it) => (it.src ? 'Image set' : 'No media yet'),
    seed: (i) => ({ kind: 'image', heading: `Slide ${i + 2}`, caption: 'A line about what this slide is for.', ctaEnabled: false }),
    fields: [
      {
        key: 'kind', label: 'Media type', control: 'segmented', group: 'Media',
        options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }],
      },
      { key: 'src', label: 'Source', control: 'upload', group: 'Media' },
      {
        key: 'alt', label: 'Alt text', control: 'text', group: 'Media', when: (c) => c.kind !== 'video',
        warnWhenBlank: 'No alt text yet — screen-reader users will hear nothing where this slide’s image is.',
      },
      { key: 'poster', label: 'Poster image', control: 'upload', group: 'Media', when: (c) => c.kind === 'video' },
      { key: 'heading', label: 'Heading', control: 'text', group: 'Text style' },
      { key: 'caption', label: 'Caption', control: 'textarea', group: 'Text style' },
      { key: 'ctaEnabled', label: 'Call to action', control: 'toggle', group: 'Action' },
      { key: 'ctaLabel', label: 'CTA label', control: 'text', group: 'Action', when: (c) => c.ctaEnabled === true },
      {
        key: 'ctaAction', label: 'CTA opens', control: 'select', group: 'Action', when: (c) => c.ctaEnabled === true,
        options: [
          { value: 'url', label: 'External link' }, { value: 'page', label: 'A page in this portal' },
          /* ⚠️ "Compose an email" removed here too — the Opens dropdown is one control wherever it
             appears, and leaving it in one spec would mean two lists claiming to be the same one. */
          { value: 'download', label: 'Download a file' },
          { value: 'phone', label: 'Call a number' },
        ],
      },
      { key: 'ctaUrl', label: 'URL', control: 'text', group: 'Action', when: (c) => c.ctaEnabled === true && c.ctaAction === 'url' },
    ],
    packs: ['P5'],
    subElements: [
      { key: 'heading', name: 'Heading', role: 'title' },
      { key: 'caption', name: 'Caption', role: 'body' },
    ],
  },
  defaults: {
    title: '', autoplay: false, interval: 5, pauseOnHover: true, loop: true,
    arrows: true, dots: true, swipe: true,
    perView: 1, trackGap: 0, transition: 'slide', speed: 'normal',
    slideMaxWidth: 60, slideOverlay: 30, arrowPlacement: 'over', dotPlacement: 'over', dotStyle: 'dots',
    slides: [{ id: 's0', kind: 'image', heading: 'Tell people what matters this week', caption: 'A short line under the heading.', ctaEnabled: false }],
  },
};

/* ── §7.19 Photo Gallery ─────────────────────────────────────────────────── */

export const GALLERY_SPEC: WidgetSpec = {
  id: 'photo_gallery', name: 'Photo Gallery', group: 'Content', reuse: 'many', family: 'collection',
  fields: [
    { key: 'title', label: 'Title', control: 'text', group: 'Content', help: 'Optional — hidden when blank.' },
    { key: 'lightbox', label: 'Open in lightbox on click', control: 'toggle', group: 'Behaviour' },
    { key: 'lightboxCaptions', label: 'Show captions in lightbox', control: 'toggle', group: 'Behaviour', when: (c) => c.lightbox !== false },
    {
      key: 'showMoreAfter', label: 'Show more / paginate after', control: 'number', group: 'Behaviour',
      min: 0, max: 24, help: '0 shows every photo.',
    },
    {
      key: 'gridLayout', label: 'Layout', control: 'segmented', tab: 'style', group: 'Grid',
      options: [{ value: 'grid', label: 'Grid' }, { value: 'masonry', label: 'Masonry' }, { value: 'justified', label: 'Justified' }],
    },
    { key: 'gridColumns', label: 'Columns', control: 'number', tab: 'style', group: 'Grid', min: 1, max: 6 },
    { key: 'gridGap', label: 'Gap', control: 'slider', tab: 'style', group: 'Grid', min: 0, max: 32 },
    {
      key: 'hoverEffect', label: 'Hover effect', control: 'segmented', tab: 'style', group: 'Hover',
      options: [{ value: 'none', label: 'None' }, { value: 'zoom', label: 'Zoom' }, { value: 'dim', label: 'Dim' }, { value: 'reveal', label: 'Reveal' }],
    },
  ],
  packs: ['P1', 'P2', 'P4', 'P5'],
  collection: {
    key: 'photos', group: 'Photos', addLabel: 'Add photo', max: 24, hideable: true, bulkAdd: true,
    emptyHint: 'No photos yet. Use “Add photo” once, or drop several files at a time.',
    label: (it, i) => String(it.caption ?? '') || `Photo ${i + 1}`,
    meta: (it) => (it.src ? 'Image set' : 'No image yet'),
    seed: (i) => ({ caption: `Photo ${i + 1}`, span: 1 }),
    fields: [
      { key: 'src', label: 'Image', control: 'upload', group: 'Content' },
      {
        key: 'alt', label: 'Alt text', control: 'text', group: 'Content',
        warnWhenBlank: 'No alt text yet — screen-reader users will hear nothing where this photo is.',
      },
      { key: 'caption', label: 'Caption', control: 'text', group: 'Content' },
      { key: 'link', label: 'Link', control: 'text', group: 'Content', help: 'Overrides the lightbox for this photo.' },
      { key: 'span', label: 'Column span', control: 'number', tab: 'style', group: 'Tile', min: 1, max: 3 },
    ],
    packs: ['P5'],
    subElements: [{ key: 'caption', name: 'Caption', role: 'meta' }],
  },
  defaults: {
    title: '', lightbox: true, lightboxCaptions: true, showMoreAfter: 0,
    gridLayout: 'grid', gridColumns: 3, gridGap: 8, hoverEffect: 'zoom',
    photos: [],
  },
};

/* ── §7.9 Feedback ───────────────────────────────────────────────────────── */

export const FEEDBACK_SPEC: WidgetSpec = {
  id: 'feedback', name: 'Feedback', group: 'Data', reuse: 'single', family: 'collection',
  gate: { kind: 'permission', setting: 'Allow Requester To Submit Feedback', section: 'Organization' },
  fields: [
    { key: 'title', label: 'Title', control: 'text', group: 'Content' },
    /* ⚠️ Keyed `sub`, labelled Prompt. The inline child node for a widget's second line is
       `<id>-sub` and it edits the key of that name — under `prompt` the two were the same words in
       two stores, so the drawer opened blank while the canvas showed text, and typing in either
       place left the other stale. The LABEL is what the admin reads; the key just has to match. */
    { key: 'sub', label: 'Prompt', control: 'text', group: 'Content' },
    {
      key: 'scale', label: 'Scale', control: 'segmented', group: 'Content',
      options: [{ value: 'stars', label: 'Stars' }, { value: 'number', label: '1–5' }],
    },
    { key: 'askFollowUp', label: 'Ask follow-up questions after the rating', control: 'toggle', group: 'Content' },
    {
      key: 'askWhen', label: 'Ask when', control: 'select', group: 'Behaviour', when: (c) => c.askFollowUp === true,
      options: [
        { value: 'always', label: 'After every rating' },
        { value: 'low', label: 'Only when the rating is 3 or below' },
      ],
      help: 'Asking only on low scores keeps the happy path to one click.',
    },
    { key: 'markSize', label: 'Mark size', control: 'slider', tab: 'style', group: 'Rating', min: 16, max: 40 },
    { key: 'markFilled', label: 'Mark colour — filled', control: 'color', tab: 'style', group: 'Rating' },
    { key: 'markEmpty', label: 'Mark colour — empty', control: 'color', tab: 'style', group: 'Rating' },
    {
      key: 'ratingAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Rating',
      options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }],
    },
  ],
  packs: ['P1', 'P2', 'P4'],
  notes: [{
    tone: 'info',
    text: 'A requester only sees this once they have a resolved request to rate. The canvas always shows its resting state, because that is what you are composing.',
  }],
  collection: {
    key: 'questions', group: 'Questions', addLabel: 'Add question', max: 5,
    // The list only exists once follow-ups are on — a question set nobody will be asked is clutter.
    when: (c) => c.askFollowUp === true,
    emptyHint: 'No follow-up questions yet. A rating alone gives you a score and never a reason.',
    label: (it, i) => String(it.q ?? '') || `Question ${i + 1}`,
    meta: (it) => String(it.type ?? 'text'),
    seed: () => ({ q: 'What could we have done better?', type: 'text', required: false }),
    fields: [
      { key: 'q', label: 'Question', control: 'text', group: 'Content' },
      {
        key: 'type', label: 'Answer type', control: 'segmented', group: 'Content',
        options: [{ value: 'text', label: 'Free text' }, { value: 'choice', label: 'Choose one' }, { value: 'yesno', label: 'Yes / No' }],
      },
      { key: 'options', label: 'Options', control: 'chipEditor', group: 'Content', when: (c) => c.type === 'choice' },
      { key: 'required', label: 'Required', control: 'toggle', group: 'Content' },
    ],
    packs: ['P4'],
  },
  defaults: {
    title: 'How are we doing?', sub: 'Rate your last resolved request',
    scale: 'stars', askFollowUp: false, askWhen: 'always',
    markSize: 20, markFilled: '#F59E0B', markEmpty: '#E5E7EB', ratingAlign: 'left',
    questions: [{ id: 'q0', q: 'What could we have done better?', type: 'choice', options: ['Speed', 'Clarity', 'The fix itself', 'Communication'], required: false }],
  },
};

/* ── List ────────────────────────────────────────────────────────────────────
 *
 * A list is a collection whose items are two lines: a title and a description. It lands with four
 * real points rather than empty rows, because a list you have to fill before you can see it is a
 * list you cannot judge the design of.
 *
 * ⚠️ ITEM STYLE is one group, not per-item controls. Every point in a list has to look like every
 * other point — that is what makes it a list — so the title and description faces are set once on
 * the widget and every item follows. A per-item font is how a list stops reading as one. */
const LIST_NEW: Cfg[] = [
  { title: 'Raise it in the portal', desc: 'Requests logged here reach the right team straight away.' },
  { title: 'Add what you have already tried', desc: 'It saves the first round of questions back.' },
  { title: 'Attach a screenshot', desc: 'A picture of the error resolves most tickets faster.' },
  { title: 'Track it from My Open Requests', desc: 'Every update lands there and in your email.' },
];

/** One typography block, authored once and applied to a named part of every item. */
const typeFields = (part: 'title' | 'desc', group: string, size: number): WidgetField[] => [
  { key: `${part}Font`, label: 'Font', control: 'select', tab: 'style', group,
    options: ['Inherit from theme', 'Inter', 'Poppins', 'Roboto', 'Source Sans 3', 'Merriweather'] },
  { key: `${part}Weight`, label: 'Font weight', control: 'select', tab: 'style', group,
    options: ['Light', 'Normal', 'Medium', 'Semibold', 'Bold'] },
  { key: `${part}Size`, label: 'Font size', control: 'sliderUnit', tab: 'style', group, min: 10, max: 48, unit: 'px' },
  { key: `${part}Color`, label: 'Font colour', control: 'color', tab: 'style', group },
  { key: `${part}Format`, label: 'Font format', control: 'chips', tab: 'style', group, options: ['Bold', 'Underline', 'Italic'] },
  { key: `${part}Align`, label: 'Alignment', control: 'segmented', tab: 'style', group,
    options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' }] },
];

export const LIST_SPEC: WidgetSpec = {
  id: 'list_el', name: 'List', group: 'Basic', reuse: 'many', family: 'collection',
  fields: [
    /* Optional on purpose — a list inside a section that already has a heading does not want a
       second one, and an empty title renders nothing rather than an empty line. */
    { key: 'title', label: 'List title', control: 'text', group: 'Content', help: 'Optional — leave blank for a bare list.' },
    {
      key: 'marker', label: 'Bullet', control: 'segmented', tab: 'style', group: 'Text style',
      options: [{ value: 'disc', label: 'Dot' }, { value: 'number', label: 'Number' }, { value: 'none', label: 'None' }],
    },
    ...typeFields('title', 'Item Title', 23),
    ...typeFields('desc', 'Item Description', 16),
    /* The §7.20-style divider, as its own group: a rule between points is a property of the LIST,
       not of any one item, and the width slider is meaningless until there is a line to widen. */
    { key: 'dividerOn', label: 'Divider between items', control: 'toggle', tab: 'style', group: 'Divider' },
    { key: 'dividerStyle', label: 'Layout', control: 'lineStyle', tab: 'style', group: 'Divider', when: (c) => c.dividerOn === true },
    { key: 'dividerColor', label: 'Colour', control: 'color', tab: 'style', group: 'Divider', when: (c) => c.dividerOn === true },
    { key: 'dividerWidth', label: 'Thickness', control: 'sliderUnit', tab: 'style', group: 'Divider', min: 1, max: 8, unit: 'px', when: (c) => c.dividerOn === true },
    { key: 'dividerGap', label: 'Space below', control: 'sliderUnit', tab: 'style', group: 'Divider', min: 0, max: 40, unit: 'px', when: (c) => c.dividerOn === true },
  ],
  /* The same design a section gets: Style, Size, Spacing come from the packs; Alignment is per-part
     inside Item Style, because a list aligns its text rather than itself. */
  packs: ['P1', 'P2'],
  collection: {
    key: 'items', group: 'Items', addLabel: 'Add item',
    emptyHint: 'No points yet. A list with nothing in it is invisible on the portal.',
    hideable: true,
    label: (it) => String(it.title ?? ''),
    meta: (it) => String(it.desc ?? '').slice(0, 60),
    seed: (i) => ({ ...LIST_NEW[i % LIST_NEW.length] }),
    fields: [
      { key: 'title', label: 'Item', control: 'text', group: 'Content' },
      { key: 'desc', label: 'Item description', control: 'textarea', group: 'Content', help: 'Optional second line.' },
    ],
    subElements: [
      { key: 'title', name: 'Item', role: 'subtitle' },
      { key: 'desc', name: 'Description', role: 'body' },
    ],
  },
  defaults: {
    title: '',
    marker: 'disc',
    titleFont: 'Inherit from theme', titleWeight: 'Medium', titleSize: 15, titleColor: '#364658', titleFormat: [], titleAlign: 'left',
    descFont: 'Inherit from theme', descWeight: 'Normal', descSize: 13, descColor: '#7B8FA5', descFormat: [], descAlign: 'left',
    dividerOn: false, dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: 1, dividerGap: 12,
    items: LIST_NEW.map((it) => ({ ...it })),
  },
};

/* ── Accordion ───────────────────────────────────────────────────────────────
 *
 * ⚠️ Its own spec, no longer an alias of FAQ. They look alike and are not the same thing: a FAQ is
 * questions and answers, an accordion is any content that folds away — so an accordion styles its
 * COLLAPSED and EXPANDED states separately, which is the whole reason it needs a panel of its own.
 *
 * ⚠️ The two style groups are per-STATE, not per-item. A row that looked different closed from its
 * neighbours would read as broken rather than styled, so the face is set once and every row obeys. */
const ACC_SEEDS: Cfg[] = [
  { title: 'How do I reset my password?', body: 'Use AD Self Service on the portal home. If your account is locked, raise an incident and the service desk will unlock it.' },
  { title: 'How long until someone picks up my ticket?', body: 'A P3 request is picked up within one working day. P1 and P2 are picked up inside the hour, around the clock.' },
  { title: 'How do I request new software?', body: 'Request it from the service catalog. Anything with a licence cost goes to your line manager for approval first.' },
];


export const ACCORDION_SPEC: WidgetSpec = {
  id: 'accordion', name: 'Accordion', group: 'Layout', reuse: 'many', family: 'collection',
  /* ⚠️ NO fields at all. The Design section is now exactly two accordions — **Style** (the shared P1
     pack) and **Spacing** — and Content is the item list, nothing else.
     What went: the two Display-rules toggles (one-at-a-time, first-item-expanded) from Content, and
     four whole style groups from Design — Text style, Expansion icon, Text style — expanded, and
     Alignment. That is roughly twenty controls for a widget whose job is to hold a list of questions.
     ⚠️ Every removed value stays in `defaults`, so the accordion on the canvas is pixel-identical:
     the renderer reads the same keys it always did, they simply stopped being editable. Restoring
     any one of them is a line in `fields`. */
  fields: [],
  packs: ['P1'],
  collection: {
    key: 'items', group: 'Items', addLabel: 'Add item',
    emptyHint: 'No items yet. An accordion with nothing in it is invisible on the portal.',
    hideable: true,
    label: (it) => String(it.title ?? ''),
    meta: (it) => String(it.body ?? '').replace(/<[^>]+>/g, '').slice(0, 60),
    seed: (i) => ({ ...ACC_SEEDS[i % ACC_SEEDS.length] }),
    blankOnAdd: true,
    fields: [
      { key: 'title', label: 'Title or question', control: 'text', group: 'Textual content', placeholder: 'How do I reset my password?' },
      {
        key: 'body', label: 'Description', control: 'rich', group: 'Textual content',
        placeholder: 'Answer it in a sentence or two.',
        help: 'Bullets, bold and links all work here.',
      },
      /* ⚠️ Reached by the "+ Add link" CTA at the foot of the inline editor, not by a field sitting
         permanently under Description. Most rows never get one, and an empty URL box on every item
         is a question asked of every question. Once a link exists the two fields stay visible, so
         removing one is as reachable as adding it. */
      { key: 'linkLabel', label: 'Link text', control: 'text', group: 'Textual content', when: (c) => c.hasLink === true },
      { key: 'linkUrl', label: 'Link address', control: 'text', group: 'Textual content', when: (c) => c.hasLink === true },
    ],
    /* The inline editor's bottom-left CTA. `flag` is the key it switches on, so the same mechanism
       serves any collection that wants an optional extra. */
    inlineCta: { label: 'Add link', flag: 'hasLink', removeLabel: 'Remove link', clears: ['linkLabel', 'linkUrl'] },
    subElements: [
      { key: 'title', name: 'Title', role: 'subtitle' },
      { key: 'body', name: 'Body text', role: 'body' },
    ],
  },
  defaults: {
    oneAtATime: true, firstOpen: false,
    titleType: 'h4', titleFont: 'Inherit from theme', titleSize: 16, titleColor: '#364658', titleFormat: ['Bold'], titleAlign: 'left',
    headBg: '#FFFFFF', headBorderWidth: 0, headBorderColor: '#E5E7EB',
    iconColor: '#7B8FA5', iconSize: 18, iconBg: 'transparent', iconPad: 4, iconRadius: 50,
    bodyFont: 'Inherit from theme', bodySize: 13, bodyColor: '#7B8FA5', bodyFormat: [], bodyAlign: 'left',
    bodyBg: 'transparent', bodyBorderWidth: 0, bodyBorderColor: '#E5E7EB',
    contentAlign: 'left',
    items: ACC_SEEDS.map((s, i) => ({ id: `acc${i}`, ...s })),
  },
};

/* ── Text with Image ─────────────────────────────────────────────────────────
 *
 * ⚠️ Not a collection — one image and one body of text, so it has no item list. It lives in this
 * file only because that is where the shared FONTS/WEIGHTS/FORMATS sets are declared.
 *
 * ⚠️ Image position is a CONTENT decision, not a styling one: which side the picture sits on changes
 * what the block says, the way a pull-quote's side does. It stays with the image it moves. */
export const TEXT_IMAGE_SPEC: WidgetSpec = {
  id: 'text_image', name: 'Text with Image', group: 'Basic', reuse: 'many', family: 'flat',
  fields: [
    {
      key: 'imagePos', label: 'Image position', control: 'segmented', group: 'Content',
      options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
    },
    /* The upload control already carries its own replace and remove actions, so there is no separate
       Replace button — one control for one image. */
    { key: 'image', label: 'Select image', control: 'upload', group: 'Content' },
    {
      key: 'alt', label: 'Alt text', control: 'text', group: 'Content',
      warnWhenBlank: 'Without alt text this image is invisible to a screen reader. Leave it blank only if it is decorative.',
    },
    { key: 'body', label: 'Paragraph', control: 'rich', group: 'Content' },

    // ── Image style ──
    { key: 'imageWidth', label: 'Image size', control: 'sliderUnit', tab: 'style', group: 'Image style', min: 20, max: 80, unit: '%' },
    { key: 'imageRadius', label: 'Corner radius', control: 'radius', tab: 'style', group: 'Image style' },
    { key: 'imageBorderWidth', label: 'Border', control: 'borderRow', tab: 'style', group: 'Image style' },

    // ── Text style — the same six rows every other widget's text block gets ──
    { key: 'font', label: 'Font', control: 'select', tab: 'style', group: 'Text style', options: FONTS },
    { key: 'weight', label: 'Font weight', control: 'select', tab: 'style', group: 'Text style', options: WEIGHTS },
    { key: 'size', label: 'Font size', control: 'sliderUnit', tab: 'style', group: 'Text style', min: 10, max: 32, unit: 'px' },
    { key: 'color', label: 'Font colour', control: 'color', tab: 'style', group: 'Text style' },
    { key: 'format', label: 'Font format', control: 'chips', tab: 'style', group: 'Text style', options: FORMATS },
    { key: 'textAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Text style', options: ALIGN_4 },

    { key: 'contentAlign', label: 'Alignment', control: 'segmented', tab: 'style', group: 'Alignment', options: ALIGN_4 },
  ],
  // P1 carries the block's own fill, border and PADDING — the Spacing the panel asks for.
  packs: ['P1'],
  defaults: {
    imagePos: 'left',
    image: '',
    alt: '',
    body: 'Pair a picture with the words that explain it. The text wraps around the image, so a long paragraph keeps its shape whichever side the image sits on.',
    imageWidth: 40, imageRadius: 8, imageBorderWidth: 0, imageBorderColor: '#E5E7EB',
    font: 'Inherit from theme', weight: 'Normal', size: 15, color: '#364658', format: [], textAlign: 'left',
    contentAlign: 'left',
  },
};

export const COLLECTION_SPECS: WidgetSpec[] = [
  FAQ_SPEC, CARD_SPEC, TABLE_SPEC, SLIDER_SPEC, GALLERY_SPEC, FEEDBACK_SPEC, LIST_SPEC, ACCORDION_SPEC,
  TEXT_IMAGE_SPEC,
];
