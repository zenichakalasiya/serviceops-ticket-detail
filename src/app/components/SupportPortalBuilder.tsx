import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Check, ChevronDown, ChevronLeft, Eye, HelpCircle, RotateCcw,
  Palette, PanelRight, Paintbrush, Pencil, Plus, Redo2, Undo2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AiSparkle } from './AiSparkle';
import { SupportPortalPreview } from './SupportPortalPreview';
import { AdminSupportPortalSettings } from './AdminSupportPortalSettings';
import { SupportPortalAddPanel } from './SupportPortalAddPanel';
import { PortalBrandingPanel } from './PortalBrandingPanel';
import { PRESETS, isRowAxis, presetOf } from './PortalSectionLayout';
import type { PresetId } from './PortalSectionLayout';
import { PortalThemePanel, DEFAULT_THEME, buttonOf, packOf, paletteOf, swatchesOf, faceOf, ThemeModeToggle } from './PortalThemePanel';
import { setPortalColorMode } from './portalStyleResolver';
import type { PortalTheme } from './PortalThemePanel';
import { PortalElementPanel } from './PortalElementPanel';
import { CanvasProvider } from './PortalCanvas';
import {
  BLOCK_ORDER_V2, ROW_ORDER_V2, RAIL_V2, MAIN_V2,
  DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, moveIn, nodeById, parseItemId,
  placedType, registerPlaced, isLockedRow,
  MAX_COLUMNS, addNeighbour, addNeighbourAt, addSibling, neighbourBlockedBecause, rowTargetOf, boxOfElement, findBox, isBoxId, freeLeaves, isBranch, mapBox, parentOfBox, registerTree, removeBox,
  sectionElements, sectionFromRows, sectionIdOfBox, sectionRebuild, sectionRows, setBoxDir, setBoxEl,
  splitBlockedBecause, splitBox,
} from './portalPageModel';
import { PortalBuilderTour } from './PortalBuilderTour';
import { PortalWidgetDrawer } from './PortalWidgetDrawer';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById, structureSpecId } from './portalWidgetSpec';
import type { Cfg, WidgetSpec } from './portalWidgetSpec';
import type { Box, BoxDir, CustomSection, NodeStyle, PlacedElement, PortalPageContent, PortalStyles } from './portalPageModel';
import { PORTAL_ELEMENTS, PORTAL_EMPTY_WIDGETS, PORTAL_TEMPLATES } from './supportPortalData';
import { IconPopover } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';
import type { PortalPage } from './supportPortalData';

/* Support Portal page builder.
 *
 * Full-screen on purpose: the admin sidebar and the product header both give way to the builder's
 * own top bar, because a canvas competing with two navigations has nowhere to be. Leaving is the
 * back arrow, which is why the trail can be dropped.
 *
 * Layout is canvas → design panel → icon rail. The panel is dragged from its LEFT edge and clamped
 * to 340-600px: 340 is the floor, and 600 the ceiling because past it the canvas stops representing
 * the page a requester sees. */

const MIN_W = 340;
const MAX_W = 600;

interface SupportPortalBuilderProps {
  page: PortalPage;
  /** Hero tint from the template this page was started from. */
  accent?: string;
  onRename: (name: string) => void;
  onPublish: () => void;
  /** Commits the page without making it live — the split CTA's second option. */
  onSaveDraft?: () => void;
  onExit: () => void;
}

type RailKey = 'add' | 'theme' | 'branding' | 'settings' | 'ai';

const RAIL: { key: RailKey; label: string; icon: (on: boolean) => ReactNode }[] = [
  /* ⚠️ "Widgets", not "Add". The rail names PLACES, not verbs — Theme, Branding, Templates are all
     nouns, and "Add" made one item read as an action while its neighbours read as destinations. */
  { key: 'add', label: 'Widgets', icon: () => <Plus size={18} /> },
  { key: 'theme', label: 'Theme', icon: () => <Paintbrush size={18} /> },
  { key: 'branding', label: 'Branding', icon: () => <Palette size={18} /> },
  /* ⚠️ Settings is OFF the rail (25 Aug 2026). It used to sit below Branding on the reasoning that
     what a requester may DO on this portal is a property of this portal — but the rail is where you
     go while you are ARRANGING a page, and a nine-accordion permissions screen is not a thing you
     reach for mid-layout. The panel, its `PANEL_COPY` entry and the `RailKey` union all stay, so
     bringing it back is one line here. */
  /* Hidden 21 Aug 2026 — see future-tasks.md §1. Uncomment to bring the panel back; the union,
     PANEL_COPY entry and the rail's gradient treatment for this key are all still in place. */
  // { key: 'ai', label: 'AI', icon: (on) => <AiSparkle size={18} className={on ? '' : 'opacity-90'} /> },
];

/** Each panel says what it is for rather than that it is unfinished — an empty state is a
 *  description of the panel's job, not an apology for it. */
const PANEL_COPY: Record<RailKey, { title: string; body: string }> = {
  add: {
    // Add is a real panel now — this entry only supplies the header title.
    title: 'Widgets',
    body: 'Everything you can put on the page.',
  },
  /* ⚠️ Every rail panel is titled with the NAME OF ITS RAIL ITEM, and carries one line under it.
     They had drifted into three different shapes — an imperative ("Brand this page"), a noun phrase
     ("Site styles") and a bare label — so which panel you were in read as a different kind of place
     each time, on a rail whose items are all the same kind of thing. */
  theme: {
    title: 'Theme',
    body: 'Style the support portal page.',
  },
  branding: {
    /* ⚠️ "Branding", not "Brand this page". The brand is org-wide — page-scoped wording promised a
       per-page override that has never existed. */
    title: 'Branding',
    body: 'The organisation identity, shared by every portal.',
  },
  settings: {
    title: 'Settings',
    body: 'What a requester can do on this portal.',
  },
  ai: {
    title: 'Build with AI',
    body: 'Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you.',
  },
};

/* ── Illustration ────────────────────────────────────────────────────────── */

/** Line-art design surface + stylus. Inline so the panel carries no image asset. */
function SelectElementArt() {
  return (
    <svg viewBox="0 0 140 106" className="h-[106px] w-[140px]" aria-hidden>
      <g fill="none" stroke="#A3AFBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="24" y="12" width="84" height="64" rx="6" />
        <rect x="9" y="30" width="14" height="38" rx="4" fill="#FFFFFF" />
        <path d="M13 38h6M13 45h6M13 52h6" />
        <path d="M34 24h30" />
        <path d="M34 54h44M34 63h32" />
        <path d="M96 88l22-22 7 7-22 22-9.5 2.5z" />
        <path d="M111 73l7 7" />
      </g>
      <rect x="34" y="34" width="34" height="11" rx="3" fill="#C3E059" />
      <path d="M114 20l2.2 4.8 4.8 2.2-4.8 2.2-2.2 4.8-2.2-4.8-4.8-2.2 4.8-2.2z" fill="#DCE3EC" />
    </svg>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

function PanelEmptyState({ active }: { active: RailKey | null }) {
  if (!active) {
    return (
      <div className="flex flex-col items-center px-8 pt-16 text-center">
        <SelectElementArt />
        <p className="mt-5 text-[16px] font-semibold text-[#475467]">Select an element to start</p>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">
          It’ll show the design panel with all the design options for that element right here.
        </p>
      </div>
    );
  }
  const copy = PANEL_COPY[active];
  const item = RAIL.find((r) => r.key === active)!;
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#7B8FA5]">
        {item.icon(false)}
      </span>
      <p className="mt-4 text-[16px] font-semibold text-[#475467]">{copy.title}</p>
      <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.55] text-[#5B7A99]">{copy.body}</p>
    </div>
  );
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

/* The Quick Actions row's ONE addable card.
 *
 * ⚠️ A FIXED id, not a minted one. The row holds at most one of these, the panel disables its CTA by
 * testing for exactly this id, and `WIDGET_FOR_NODE` maps it to the spec — three places that have
 * to agree, so the name is written once. */
export const LINK_CARD_ID = 'quick-link';

export function SupportPortalBuilder({ page, accent, onRename, onPublish, onSaveDraft, onExit, openOn, onOpenConsumed }: SupportPortalBuilderProps & {
  /* Which rail panel to land on. The listing's "Portal settings" action opens the portal AT its
     settings rather than at the canvas — asking for settings and being given a blank widget library
     is the builder answering a different question from the one you pressed. */
  openOn?: RailKey;
  onOpenConsumed?: () => void;
}) {
  /* ⚠️ ONE layout decision, taken at mount and held in state — never re-read from the prop on each
     render. `blockOrder` and `rowOrder` are `useState` INITIALISERS, so they answer the question
     once; anything that answered it again per render could disagree with them the moment the page
     object was replaced without its `layout` field, and did: the bands came out in the v2 order
     while the rail was undefined, so Announcements and Contact Us silently rendered nowhere.
     A seed is a fact about how this session STARTED. Reading it twice is what let it change. */
  const [layout] = useState<'v1' | 'v2'>(() => (page.layout === 'v2' ? 'v2' : 'v1'));
  const isV2 = layout === 'v2';

  /* ⚠️ The template a page was STARTED from, resolved once, for the same reason `layout` is: these
     feed `useState` initialisers, and anything that answered the question again per render could
     disagree with them the moment the page object was replaced.
     `page.source` holds the template's NAME — it is what the listing already reads to find the
     accent — so the name is the join and there is no second id to keep in step. */
  const [seed] = useState(() => PORTAL_TEMPLATES.find((t) => t.name === page.source)?.seed);
  /* ⚠️ The RAIL SHAPE — a main region beside a tall right-hand rail — was reachable only by being
     the v2 page. It is a layout, not an identity, so a template can ask for it: a seed that names a
     rail gets the whole shape, including the one-column records row that goes with it. Without this
     a template could list the rail's cards and have them render as three more cards in a flat row,
     which is a different page that happens to contain the same widgets. */
  const railShape = !!seed?.rail || isV2;
  /* Started from scratch rather than from a template or the default. Read in one place so the
     palette, the canvas and the empty state cannot disagree about whether the page has anything. */
  const isBlank = page.start === 'blank';

  const [width, setWidth] = useState(MIN_W);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<RailKey | null>(openOn ?? null);
  /* ⚠️ Consumed ONCE, on mount. Left standing, every later close of the panel would be undone by the
     next render and the rail item could never be switched off. */
  useEffect(() => { if (openOn) onOpenConsumed?.(); }, []);
  const [preview, setPreview] = useState(false);
  /* The split CTA's menu. Closed by default — the chevron is an admission that a second option
     exists, not an invitation to read it every time. */
  const [pubMenu, setPubMenu] = useState(false);
  /* Which action the split button's main half is currently offering. Publish by default.
     ⚠️ The memory only ever runs in the SAFE direction here. The default is the live one, so the
     only thing remembering can do is leave the button on "Save as draft" — pressing it expecting to
     publish then costs you a click, not a portal that went live before you meant it to. If the
     default were ever flipped the other way this would have to go. */
  const [pubMode, setPubMode] = useState<'publish' | 'draft'>('publish');
  /* The portal's own style system. It lives HERE rather than in the panel because the canvas has to
     paint with it — a theme panel that only changed itself would be a colour picker with no page. */
  const [theme, setTheme] = useState<PortalTheme>(DEFAULT_THEME);

  /* ── Undo / redo ───────────────────────────────────────────────────────────
   *
   * ⚠️ SNAPSHOTS of the whole page, not a log of commands. This builder has eleven independent state
   * atoms and edits arrive from four surfaces — the canvas, the drawer, the rail panels and inline
   * text — so a command log would need every one of them to remember to record itself, and the first
   * one that forgot would make undo quietly skip a step. A snapshot cannot be forgotten: an effect
   * watches the state and records whatever it finds.
   *
   * ⚠️ The effect must not record its OWN restore, or undo would push the state it just popped and
   * you could never get further back than one step — `applying` is what stops that.
   * ⚠️ It also compares against the top of the stack before pushing: React re-runs effects on
   * unrelated renders, and an identical snapshot would fill the history with steps that change
   * nothing, so undo would appear to do nothing several times in a row. */
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const applying = useRef(false);
  const [histTick, setHistTick] = useState(0);

  // ── canvas state ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /* ⚠️ v2's records row is ONE column, which is what makes My Assets and My CIs full-width bands
     stacked down the page rather than two narrow cards side by side. It is a column COUNT, not a
     different renderer — the same cards, given the whole width. */
  const [content, setContent] = useState<PortalPageContent>(() => (
    /* ⚠️ Reads the SEED as well as the layout: the records row is one column in the rail shape, and
       a template asking for that shape has to get the column count with it or My Assets and My CIs
       come out as two narrow cards inside a region built for full-width rows. */
    page.layout === 'v2' || PORTAL_TEMPLATES.find((t) => t.name === page.source)?.seed?.rail
      ? { ...DEFAULT_CONTENT, cols: { ...DEFAULT_CONTENT.cols, records: 1 } }
      : DEFAULT_CONTENT
  ));
  /* ⚠️ Read by `addLinkCard`, which must know whether the row already HAS its one link card before
     the state settles. Reading `content` inside the updater only works while that hook's queue is
     empty — the same trap `detachElement` records. */
  const contentRef = useRef(content);
  contentRef.current = content;
  /* ⚠️ Seeded from the template, exactly as `widgetCfg` is. Some of what a template arranges —
     a widget's column count, chiefly — lives in the style store rather than in config, and a
     template that could only reach one of the two could not describe its own layout. */
  const [styles, setStyles] = useState<PortalStyles>(() => ({ ...(seed?.styles ?? {}) } as PortalStyles));

  const setStyle = useCallback((id: string, p: Partial<NodeStyle>) => {
    setStyles((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  /* Replaces a node's whole style object — how Revert DELETES a key. A patch cannot express
     "unset", and writing the parent's current value instead would be a copy, not a link. */
  const replaceStyle = useCallback((id: string, next: NodeStyle) => {
    setStyles((prev) => ({ ...prev, [id]: next }));
  }, []);

  /* ── widget config (spec §9) ──────────────────────────────────────────────
   *
   * One store for every widget instance, fixed page block and dropped element alike, keyed by node
   * id. Defaults live on the spec, so a node that has never been edited holds nothing at all and
   * `cfgFor` composes it — which is what makes Reset to default a one-line delete. */
  const rowOrderRef = useRef<Record<string, string[]>>(DEFAULT_ROW_ORDER);
  const widgetCfgRef = useRef<Record<string, Cfg>>({});
  /* ⚠️ Seeded, so a template's hero and column counts are the page's OWN config rather than a
     branch in the renderer. Everything here is a value the panel can already edit, which is what
     makes a template a starting point instead of a mode. */
  const [widgetCfg, setWidgetCfg] = useState<Record<string, Cfg>>(() => ({ ...(seed?.cfg ?? {}) } as Record<string, Cfg>));
  /* ⚠️ Declared ABOVE their first assignment. Put after it, the assignment ran against an
     undefined binding and took the whole builder down on mount. */
  widgetCfgRef.current = widgetCfg;

  /** The widget spec behind a node, whether it is a fixed block or something an admin dropped.
   *  ⚠️ Both routes must land on the SAME spec, or one widget would edit two different ways. */
  /* ⚠️ An ITEM belongs to its widget's config, not its own. `el-3~i2` resolves to el-3's spec and
     el-3's cfg; the drawer slices the item out of the collection. Keying config by the item id would
     scatter one widget's content across N stores and break Reset, duplicate and reorder. */
  /* A card's Title/Subtext node edits the CARD's config — the words live on the card, not on a
     store of their own, or the canvas and the panel would hold two copies of one sentence. */
  /* ⚠️ `-viewall` strips too. The link's label is a key on the WIDGET's config, so its own node has
     to resolve to the widget for reading and writing — the panel it opens is separate (see
     `specForNode`), which is the whole point: same value, different editor. */
  const ownerOf = (id: string) => parseItemId(id)?.widget ?? id.replace(/-(title|sub|label|viewall|icon|search|caption|cl\d+|cv\d+)$/, '');

  const specForNode = useCallback((id: string | null): WidgetSpec | undefined => {
    if (!id) return undefined;
    /* ⚠️ The ORIGINAL id first. A card's Title node shares its CONFIG with the card — that is what
       `ownerOf` is for — but it must not share its PANEL, or clicking the title opens the card and
       the one thing you aimed at is the one thing you cannot edit. Config and panel resolve
       differently here on purpose. */
    const own = structureSpecId(id);
    if (['card_title', 'card_sub', 'card_icon', 'list_title', 'list_label', 'list_link', 'search', 'image_caption'].includes(own ?? '')) return specById(own);

    const owner = ownerOf(id);
    const direct = WIDGET_FOR_NODE[owner];
    if (direct) return specById(direct);
    const t = placedType(owner);
    if (t && WIDGET_FOR_TYPE[t]) return specById(WIDGET_FOR_TYPE[t]);
    /* Structure and chrome last: a widget that happens to live in a section must resolve to the
       widget, not to the section it sits in. */
    const structure = structureSpecId(owner);
    return structure ? specById(structure) : undefined;
  }, []);

  /* Per-NODE seeds, for values a shared spec default cannot express. The page's bands each have
     their own column count, so the Section spec deliberately carries none — it would have to be
     wrong for two of the three. */
  const sectionsRef = useRef<{ afterId: string; section: CustomSection }[]>([]);

  const NODE_CFG_SEED: Record<string, Cfg> = {
    /* ⚠️ `hasCards` is what gates the Card-templates control. Only the Quick Actions band holds
       action cards, so only it gets the picker — offering a card layout on a section with no cards
       is a control that cannot do anything. Seeded per NODE because the section SPEC is shared by
       every band and every added section. */
    quick: { cols: '4', hasCards: true },
    work: { cols: '3' },
    /* ⚠️ ONE column on v2, which is what makes My Assets and My CIs full-width bands stacked down
       the page. The count belongs HERE, not in the renderer's fallback: this seed is what
       `secCols` reads first, so a fallback set anywhere else was a second answer that could never
       win — the records row stayed two columns however the layout was described elsewhere. */
    records: { cols: railShape ? '1' : '2' },
  };

  /* ⚠️ `hasContent` is DERIVED, never stored. It gates the Alignment accordion, and a stored flag
     would have to be updated by every path that adds or removes an element — drop, click-to-add,
     replace, delete, undo — and the first one that forgot would leave a section claiming to be empty
     while holding something, or the reverse. Reading the current shape each time cannot go stale. */
  /* ⚠️ Read through a REF, not the state directly. `cfgFor` is declared above `sections`, so naming
     the state here — even only in a dependency array — is a use-before-initialisation that throws at
     module evaluation and blanks the page. The ref is assigned on every render just below the state,
     so it is always current by the time anything calls this. */
  const sectionHasContent = useCallback((id: string) => {
    const sec = sectionsRef.current.find((s) => s.section.id === id)?.section;
    if (sec) return sectionElements(sec).length > 0;
    // A built-in band always holds its own widgets.
    return true;
  }, []);

  /* ⚠️ DERIVED, like `hasContent` — the preset row lights from the section's actual shape rather
     than from a stored id, so a layout changed by the canvas adders and one changed by the preset
     row cannot disagree about which tile is current. The double underscore marks these as read-only
     view keys: nothing writes them back. */
  /* Does this BOX hold anything — an element, or children? Everything that is not a box answers
     true, because `hasContent` gates controls on several node kinds and only a box can be empty in
     the sense the Column panel cares about.
     ⚠️ Read through the REF, like `sectionHasContent` beside it: `cfgFor` is declared above
     `sections`, so the state itself is not in scope here. */
  const boxHasContent = useCallback((id: string) => {
    if (!/^sec-\d+-b\d+$/.test(id)) return true;
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(id))?.section;
    const box = sec ? findBox(sec.root, id) : null;
    return !!box && (!!box.el || isBranch(box));
  }, []);

  const sectionShape = useCallback((id: string) => {
    const sec = sectionsRef.current.find((x) => x.section.id === id)?.section;
    if (sec) {
      /* ⚠️ Same substitution the preset itself makes, or the tile ROW and the tile ACTION disagree:
         an empty two-row section reported 0 and was offered the two-item tile set, so the shape it
         already had was not among the shapes it could be given. */
      const rows = sectionRows(sec);
      const cells = rows.reduce((a, r) => a + r.length, 0);
      return {
        __count: Math.max(sectionElements(sec).length, cells),
        __preset: presetOf(rows),
        __rowAxis: isRowAxis(rows),
      };
    }
    /* ⚠️ A BUILT-IN band, whose shape is a column COUNT on its config rather than a `rows` array.
       This used to return a hard-coded `{ count: 0, preset: 'cols' }`, which broke the preset row
       in two visible ways at once: the tile row never lit the preset you were actually on — pick
       Stacked and the canvas restacked while Columns stayed selected — and `count: 0` meant
       presetsFor() offered the two-item set, so a three-card band was missing a tile it had earned.
       The current preset has to be DERIVED from the same number applyPreset writes, or the control
       is describing a section other than the one in front of you. */
    /* ⚠️ On the rail layout the work band holds TWO things, not five. Its members are counted out
       of `rowOrder`, which lists every card in it — but four of those live in the main region and
       three in the rail, and the band itself only ever arranges the two REGIONS. Counting the cards
       gave the parent a five-cell preset row describing a shape it does not have; two children mean
       the two-preset set, which is the honest offer.
       The regions carry their own counts for the same reason: each is a section now, and each has
       its own Layout panel describing what IT holds. */
    const REGIONS: Record<string, number> = { work: 2, 'work-main': 4, 'work-rail': 3 };
    const items = (isV2 && REGIONS[id] !== undefined)
      ? REGIONS[id]
      : rowOrderRef.current[id]?.length ?? 0;
    if (!items) return { __count: 0, __preset: 'cols' as PresetId, __rowAxis: true };
    const cols = Number(widgetCfgRef.current[id]?.cols ?? items);
    const preset: PresetId = cols <= 1 ? 'stack' : cols >= items ? 'cols' : cols === 3 ? 'three' : 'grid';
    return { __count: items, __preset: preset, __rowAxis: cols > 1 };
  }, [isV2]);

  /* ⚠️ Through the REF, like `sectionHasContent` beside it: `cfgFor` is declared above `sections`,
     so naming the state here is a use-before-initialisation that throws at module evaluation and
     blanks the page. */
  const boxDirOf = useCallback((id: string): BoxDir | undefined => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(id))?.section;
    return sec ? findBox(sec.root, id)?.dir : undefined;
  }, []);

  const cfgFor = useCallback((id: string): Cfg => {
    const owner = ownerOf(id);
    /* ⚠️ Light is the BARE key and dark is `dark:<key>` — the theme panel's convention, so a page
       that has never been given a dark variant stores nothing extra and renders exactly as before.
       In dark mode the dark value is promoted onto the base key, which is what every renderer reads,
       and the ORIGINAL light value is stashed under `light:<key>` so the picker's light tab can
       still show it. Without that stash the light tab would fall back to the base key it had just
       been overwritten by, and both tabs would read dark. */
    const merged: Cfg = {
      ...(specForNode(owner)?.defaults ?? {}),
      ...(NODE_CFG_SEED[owner] ?? {}),
      /* ⚠️ Built-in bands get the shape as well. They were handed a bare `__rowAxis: true` with no
         `__preset` and no `__count`, so the preset row had nothing to light and nothing to size
         itself from — the two symptoms above. */
      ...(/^sec-\d+$/.test(owner)
        ? { hasContent: sectionHasContent(owner), ...sectionShape(owner) }
        : { hasContent: boxHasContent(owner), ...sectionShape(owner) }),
      /* ⚠️ Whether this widget has any records, so the panel can stand down the controls that only
         describe records. Arranging nothing is not a setting, it is a control with no referent. */
      /* ⚠️ The ROW's card template, seeded so the card's own picker opens on the shape it is
         actually wearing. widgetCfg[owner] is spread after this, so a card that has chosen its
         own still wins — this only fills the gap before it chooses. */
      ...(/^quick-/.test(owner) ? { cardTemplate: widgetCfgRef.current.quick?.cardTemplate ?? 'left' } : {}),
      __noData: PORTAL_EMPTY_WIDGETS.has(owner),
      /* ⚠️ Which section is allowed the external-link CTA, and whether it already has one. Seeded
         here rather than tested in the spec, because a spec is data and has no way to look at the
         page. `__hasLink` is what disables the CTA with a reason instead of letting a second card
         land in a row sized for one. */
      ...(owner === 'quick'
        ? { __quickRow: true, __hasLink: content.quick.some((q) => q.id === LINK_CARD_ID) }
        : {}),
      ...(widgetCfg[owner] ?? {}),
      /* ⚠️ LAST, and read from the TREE — the behaviour control's value is the box's own `dir`, and
         config must not be able to answer over the top of it. A stored copy would be a second
         source of truth for the one property the whole layout is laid out by: flip the box on the
         canvas and the panel would go on showing what config remembered. `patchCfg` writes this
         key into the tree and never stores it, so there is nothing here to go stale. */
      ...(boxDirOf(owner) ? { dir: boxDirOf(owner) } : {}),
    };
    if (theme.mode !== 'dark') return merged;
    /* `Object.keys` is a snapshot, so the `light:` keys added inside the loop are not re-visited —
       and none of them starts with `dark:` anyway. */
    for (const k of Object.keys(merged)) {
      if (!k.startsWith('dark:')) continue;
      const base = k.slice(5);
      merged[`light:${base}`] = merged[base];
      merged[base] = merged[k];
    }
    return merged;
  }, [specForNode, widgetCfg, sectionHasContent, boxHasContent, theme.mode]);

  /* The two service rows share their tile shape. ⚠️ Mirrored HERE, at the one place widget config
     is written, rather than by giving the field a second home — every route into a widget's config
     goes through this function, so there is no path that sets one and misses the other. It is the
     only key in the builder that behaves this way, which is why it is named rather than inferred. */
  const patchCfg = useCallback((id: string, patch: Cfg) => {
    /* ⚠️ Behaviour is TREE state, so it is applied there and REMOVED from the patch rather than
       written to both. Two copies of the property everything is laid out by is the one thing this
       model exists to avoid — and a stored `dir` would win in `cfgFor` the moment the two drifted. */
    if (patch.dir !== undefined) {
      const secId = sectionIdOfBox(id);
      setSections((prev) => prev.map((s) => (
        s.section.id === secId ? { ...s, section: setBoxDir(s.section, id, patch.dir as BoxDir) } : s
      )));
      const rest = { ...patch };
      delete rest.dir;
      if (!Object.keys(rest).length) return;
      patch = rest;
    }
    const SERVICE_ROWS = ['favourites', 'services'];
    if (SERVICE_ROWS.includes(id) && patch.cardTemplate !== undefined) {
      const other = SERVICE_ROWS.find((rr) => rr !== id)!;
      setWidgetCfg((prev) => ({ ...prev, [other]: { ...(prev[other] ?? {}), cardTemplate: patch.cardTemplate } }));
    }
    /* ⚠️ Responsive behaviour CLEARS the widths already dragged onto this section's first-layer
       columns. Fill stores a share of the row (`flex`) and Fixed stores a width of its own
       (`widthPct`); a value left behind by the other mode is read by the wrong rule and the row
       either collapses or overflows. Redistributing is also the truthful answer to "what does this
       row do now" — the rule it distributes by is exactly what you changed.
       ⚠️ The columns are found in the DOM rather than from state, because a section's first layer
       has three different shapes — an added section's `rows`, a built-in band's card list, and
       whatever has been dropped alongside them — and the rendered page is the one place all three
       agree. A direct child is one whose nearest `[data-node]` ancestor is this section. */
    if (patch.resize !== undefined) {
      const host = document.querySelector(`[data-node="${id}"]`);
      const cols = host
        ? [...host.querySelectorAll<HTMLElement>('[data-node]')]
            .filter((k) => k.parentElement?.closest('[data-node]') === host)
            .map((k) => k.dataset.node!)
        : [];
      if (cols.length) {
        setStyles((prev) => {
          const next = { ...prev };
          let touched = false;
          cols.forEach((c) => {
            const s = next[c];
            if (!s || (s.flex === undefined && s.widthPct === undefined && s.width === undefined)) return;
            const { flex, widthPct, width, ...rest } = s;
            next[c] = rest;
            touched = true;
          });
          return touched ? next : prev;
        });
      }
    }
    setWidgetCfg((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  /** Selecting an element takes over the panel — the design panel IS the element editor. */
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) { setActive(null); setCollapsed(false); }
  }, []);

  /** Sections the admin has added, each pinned to the block it was inserted after. */
  /* ⚠️ EVERY catalogue element is on the page from the start, two to a section, appended after the
     last built-in band. This is a design prototype whose whole job is letting someone open a widget,
     change a field and watch the page answer — and a control you cannot see the effect of is a
     control nobody can review. Seeding them makes the page long, which is the price of every widget
     being one click from its own live example instead of needing to be placed first.
     ⚠️ registerPlaced is called HERE, not at render: it is what lets nodeById() name a dropped
     element, and the normal add path calls it at ADD time — a seeded element never goes through
     that path, so without this every seeded node would open a drawer with no identity. */
  const [sections, setSections] = useState<{ afterId: string; section: CustomSection }[]>(() => {
    /* ⚠️ ONE element per section, one column wide. Two to a row made each element share its width
       and its baseline with an unrelated neighbour, so a Divider sat beside a Table and neither was
       being shown at the size it will really be used at. Full width down a single column is how the
       portal page itself is built, and it means every element can be selected, resized and styled
       without its partner moving at the same time. */
    /* ⚠️ A BLANK portal seeds NOTHING. The example sections exist so an untouched page shows what
       the palette can do; on a page somebody asked to be empty they are the opposite of that — the
       first thing you would have to do is delete fifteen sections you did not add. */
    if (page.start === 'blank') return [];
    const pool = PORTAL_ELEMENTS.filter((e) => !e.onPage && !e.hidden);
    return pool.map((def, i) => {
      const id = `sec-${i + 1}`;
      const section = sectionFromRows(id, [[1]]);
      const inst: PlacedElement = { id: `el-${i + 1}`, type: def.id, name: def.name };
      /* ⚠️ An unsplit section IS its own single cell, so the element goes on the ROOT box and its
         parent is the section id. There is no separate column to put it in until something splits. */
      section.root.el = inst;
      registerPlaced(inst.id, inst.name, inst.type, id);
      return { afterId: 'records', section };
    });
  });
  sectionsRef.current = sections;
  /* ⚠️ Every box re-registers whenever the trees change. `nodeById` used to read a column straight
     off its id shape; a tree has no shape to read, so the boxes have to tell it. Done here, beside
     the ref assignment that is already a render-time sync, so there is one place that keeps the
     registry and the state in step. */
  sections.forEach((s) => registerTree(s.section));
  const nextSectionId = useRef(sectionsRef.current.length + 1);
  /* ⚠️ Past the seeded ids. Starting at 1 would mint an `el-1` that already exists, and config and
     style are keyed by id — the new element would silently wear the seeded one's settings. */
  const seededElements = sectionsRef.current.reduce((n, x) => n + sectionElements(x.section).length, 0);

  const addSection = useCallback((afterId: string, rows: number[][]) => {
    const section = sectionFromRows(`sec-${nextSectionId.current++}`, rows);
    setSections((prev) => {
      /* ⚠️ When the seam belongs to an ADDED section, the new one goes directly after it and
         inherits its anchor. Pushing to the end of the array put it at the foot of the page
         instead — you clicked between two bands and it appeared somewhere else entirely. */
      const at = prev.findIndex((x) => x.section.id === afterId);
      if (at < 0) return [...prev, { afterId, section }];
      const next = [...prev];
      next.splice(at + 1, 0, { afterId: prev[at].afterId, section });
      return next;
    });
    select(section.id);
    toast.success('Section added');
  }, [select]);

  /** Per-placed-element icon and text. Kept beside the sections so the canvas can render them. */
  const [icons, setIcons] = useState<Record<string, IconChoice | undefined>>({});
  /* ⚠️ ONE icon store, written from two places. The canvas popover and the panel's icon field both
     land here, so an icon changed inline is the same icon the panel then shows — the alternative is
     two truths for one glyph. */
  const [iconPick, setIconPick] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [placedText, setPlacedText] = useState<Record<string, { title?: string; desc?: string }>>({});

  const nextElementId = useRef(seededElements + 1);
  /** Builds the instance and registers it so the canvas and panel can describe it. */
  const makeElement = useCallback((type: string, parent: string) => {
    const def = PORTAL_ELEMENTS.find((e) => e.id === type);
    const el: PlacedElement = { id: `el-${nextElementId.current++}`, type, name: def?.name ?? 'Element' };
    registerPlaced(el.id, el.name, el.type, parent);
    return el;
  }, []);

  /** Elements dropped straight into a built-in row (Quick Actions, Cards Row, Records Row). */
  const [rowExtras, setRowExtras] = useState<Record<string, PlacedElement[]>>({});
  /* ⚠️ Read by `detachElement`, which must know what it is holding BEFORE the state settles. */
  const rowExtrasRef = useRef<Record<string, PlacedElement[]>>({});
  rowExtrasRef.current = rowExtras;

  const dropInRow = useCallback((rowId: string, type: string) => {
    /* ⚠️ Gated HERE because this is the single funnel — drag-and-drop, click-to-add's row fallback
       and the replace-a-built-in path all end up in this function. Guarding the drop target alone
       would leave the other two routes open. */
    if (isLockedRow(rowId)) {
      toast.error('Quick Actions holds its four action cards and nothing else');
      return;
    }
    const el = makeElement(type, rowId);
    setRowExtras((prev) => ({ ...prev, [rowId]: [...(prev[rowId] ?? []), el] }));
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, select]);


  /* ⚠️ Read from the REF, not from state: this is called from inside a dragover handler, many times
     a second, and it must answer about the tree as it is right now. */
  const columnsFull = useCallback((boxId: string) => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(boxId))?.section;
    if (!sec) return false;
    const parent = parentOfBox(sec.root, boxId);
    return !!parent && parent.dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS;
  }, []);

  const dropInColumn = useCallback((columnId: string, type: string) => {
    const sectionId = sectionIdOfBox(columnId);
    const el = makeElement(type, columnId);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: setBoxEl(s.section, columnId, el) } : s
    )));
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, select]);

  /* Dropping on a seam builds the section for you — one column, the element inside it. */
  const dropAtSeam = useCallback((afterId: string, type: string) => {
    const section = sectionFromRows(`sec-${nextSectionId.current++}`, [[1]]);
    const el = makeElement(type, section.id);
    section.root.el = el;
    setSections((prev) => [...prev, { afterId, section }]);
    select(el.id);
    toast.success(`${el.name} added in a new section`);
  }, [makeElement, select]);

  /* The axis-aware "+". `side` is 'left'/'right' on a row and reads as above/below on a column —
     one call, because "add a sibling before me" is the same operation whichever way the parent
     happens to be laid out. */
  /* ⚠️ FOUR sides, not two, and the axis is what the side means: left and right add a COLUMN beside
     this box, top and bottom add a ROW above or below it. It used to be `addSibling` alone, which
     could only ever insert along the parent's existing axis — so on a section laid out as columns
     there was no way to ask for a row, and the two adders quietly changed meaning depending on the
     shape you happened to be standing in. `addNeighbour` wraps when it has to, so one control means
     one thing at every level.
     ⚠️ Blocked with the REASON on it rather than failing silently, like Split. */
  /* Puts one of the six in the slot BESIDE an element — what "+" means on a Text or a Button.
   *
   * ⚠️ It routes through `dropBeside`, the drag-and-drop path, rather than growing a second way to
   * do the same thing. That function already splits the box, honours the column cap with its
   * reason, and places the element; a parallel implementation here would be a second set of rules
   * to keep in step with it, and the first one to drift would be the one nobody dragged. */
  const addSiblingElement = useCallback((elementId: string, type: string) => {
    const box = sectionsRef.current
      .map((s) => boxOfElement(s.section.root, elementId))
      .find(Boolean);
    /* No box means it is not in a custom section — a built-in row member. Those grow by the row's
       own rules, so the "+" simply does not apply and saying nothing is better than guessing. */
    if (!box) return;
    /* ⚠️ 'below', not 'right'. Same reason the clone stacks: a "+" on a paragraph should put the
       next thing under it inside that paragraph's own box, not split the section around it into
       two columns and halve the width of what was already there. */
    dropBesideRef.current?.(box.id, { type }, 'below');
  }, []);

  const addBeside = useCallback((boxId: string, side: 'left' | 'right' | 'top' | 'bottom') => {
    const sectionId = sectionIdOfBox(boxId);
    const dir: BoxDir = side === 'left' || side === 'right' ? 'row' : 'column';
    const before = side === 'left' || side === 'top';
  /* ⚠️ The reason is read from the REF, before the state update — never assigned inside the updater
     and checked after it. `setSections` does not run its callback until React renders, so
     `if (blocked)` on the next line always saw the initial value: the cap worked (nothing was
     added) and said nothing, which is the silent no-op every limit in this builder is written to
     avoid. Caught by counting columns after a fifth click and finding four columns and no toast. */
    const current = sectionsRef.current.find((s) => s.section.id === sectionId)?.section;
    /* ⚠️ A ROW is added at the SECTION's top level, not beside the box that was clicked — see
       `rowTargetOf`. A COLUMN divides the row it is in, so it stays on the clicked box. */
    const target = current && dir === 'column' ? rowTargetOf(current.root, boxId) : boxId;
    const blocked = current ? neighbourBlockedBecause(current.root, target, dir) : null;
    if (blocked) { toast.error(blocked); return; }
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: addNeighbour(s.section, target, dir, before) } : s
    )));
  }, []);

  /* Split — the ONE structural operation, identical at every level. A leaf becomes two, a branch
     grows one more child, and the direction is always the box's own. */
  const splitNode = useCallback((boxId: string) => {
    const sectionId = sectionIdOfBox(boxId);
    /* ⚠️ Same fix as `addBeside` above, and the same bug: the reason was assigned inside the
       `setSections` updater and read on the line after it, which runs first. Split has been
       refusing at the depth and column caps without ever saying why. */
    const current = sectionsRef.current.find((s) => s.section.id === sectionId)?.section;
    const blocked = current ? splitBlockedBecause(current.root, boxId) : null;
    if (blocked) { toast.error(blocked); return; }
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: splitBox(s.section, boxId) } : s
    )));
  }, []);

  /* Behaviour — the note's "how user wants to treat sec? row / column". ⚠️ Non-destructive by
     construction: the children and their order are untouched and only the axis changes, which is
     what makes "rearrange to top & bottom" one click rather than a rebuild. */
  const setNodeDir = useCallback((boxId: string, dir: BoxDir) => {
    const sectionId = sectionIdOfBox(boxId);
    setSections((prev) => prev.map((s) => (
      s.section.id === sectionId ? { ...s, section: setBoxDir(s.section, boxId, dir) } : s
    )));
  }, []);

  /* ── page order & membership — what the toolbar's move/delete rewrite ── */
  /* ⚠️ SEEDED FROM THE RECORD, not from one global constant. Every portal in the listing used to
     open the identical arrangement, so two portals could differ by name and address and by nothing
     a requester would ever see. The seed is read once, as an initialiser — after that the state is
     the page's own and every edit behaves exactly as it did. */
  /* ⚠️ The seed wins over the layout default, and the layout default wins over v1. A template that
     says nothing about the bands falls through to exactly what it would have got. */
  const [blockOrder, setBlockOrder] = useState<string[]>(() => seed?.blockOrder ?? (isV2 ? BLOCK_ORDER_V2 : DEFAULT_BLOCK_ORDER));
  /* ⚠️ MERGED over the defaults, not replaced. A seed names only the rows it rearranges; `records`
     is still consulted by `rowOf` even when the band is not on the page, and a seed that replaced
     the map wholesale would leave those cards unable to move — with nothing on screen saying why. */
  const [rowOrder, setRowOrder] = useState<Record<string, string[]>>(() => (
    seed?.rowOrder
      ? { ...(isV2 ? ROW_ORDER_V2 : DEFAULT_ROW_ORDER), ...seed.rowOrder }
      : (isV2 ? ROW_ORDER_V2 : DEFAULT_ROW_ORDER)
  ));
  rowOrderRef.current = rowOrder;
  const [removed, setRemoved] = useState<string[]>([]);

  /* Which PREDEFINED elements this page currently carries.
   *
   * ⚠️ DERIVED, never stored. `PortalElement.onPage` says a block ships with the portal, which is a
   * fact about the catalogue and never changes; this answers "is it on THIS page right now", and
   * the two stop agreeing the moment somebody deletes a block. A palette row that greys out has to
   * track the page to be truthful — remove My Assets and its row becomes addable again.
   *
   * ⚠️ Two homes, because the page has two kinds of predefined block: the live-data cards live in
   * `rowOrder` (minus anything `removed`), and the action cards are members of `content.quick`. */
  const placedPredefined = useMemo(() => {
    const nodes = new Set<string>();
    /* ⚠️ A BLANK page has none of the fixed blocks, however full `blockOrder` and `rowOrder` look.
       Those two are seeded with the standard arrangement whatever the page's start was, and the
       preview simply does not render them when `blank` — so the state said "My Open Requests is on
       the page" while the canvas showed an empty portal, and every predefined row in the palette was
       greyed out with a tick on a page carrying nothing. What a blank page HAS is whatever has since
       been dropped into it, which is the `types` set below. */
    if (!isBlank) {
      Object.values(rowOrder).forEach((ids) => ids.forEach((id) => { if (!removed.includes(id)) nodes.add(id); }));
      content.quick.forEach((q) => nodes.add(q.id));
    }
    /* ⚠️ Top-level BANDS too, not just cards inside a row. Favourite Services and Most Used Services
       are their own blocks in `blockOrder` rather than members of a row, so counting only row
       members left both of them addable while the page was already carrying them. */
    if (!isBlank) blockOrder.forEach((id) => { if (!removed.includes(id)) nodes.add(id); });
    /* ⚠️ A THIRD home, and it is the one that keeps the mark honest end to end. Delete My Assets and
       the row goes addable; click it and the widget lands as a PLACED element in a new section
       rather than restoring the fixed block. Counting only the fixed block would leave the row
       saying "addable" with the widget sitting on the page — so a second click gives you two, a
       third gives you three, and the mark means nothing. */
    const types = new Set<string>();
    sections.forEach((s) => sectionElements(s.section).forEach((el) => types.add(el.type)));
    Object.values(rowExtras).forEach((list) => list.forEach((el) => types.add(el.type)));
    /* ⚠️ PREDEFINED is a GROUP rule, not a fixed-block rule. Data and Actions are the product's
       own single-instance widgets; everything in Basic, Visual and Custom is repeatable by design.
       Gating on `node` alone was too narrow: **Announcements** is Data with no fixed page block
       — it is only ever placed — so it could never be marked however many copies the page carried,
       while its five neighbours in the same group all were. One group, two behaviours, for a reason
       nobody looking at the panel could see.
       The two service rows keep their `node` because they sit in Custom, where the group rule does
       not reach — they are the exception the flag exists for. */
    const predefined = (e: (typeof PORTAL_ELEMENTS)[number]) =>
      e.group === 'Data' || e.group === 'Actions' || !!e.node;
    return new Set(PORTAL_ELEMENTS
      .filter((e) => predefined(e) && ((e.node && nodes.has(e.node)) || types.has(e.id)))
      .map((e) => e.id));
  }, [rowOrder, removed, content.quick, blockOrder, sections, rowExtras, isBlank]);

  /* Reset to default — every store the canvas reads, back to its seed.
     ⚠️ It must clear ALL of them. Missing one leaves the page in a state that is neither the
     default nor what you built: an added section whose widget config was wiped, or a block still
     hidden by `removed` after its content came back. The list is the state list, in order. */
  /* Everything an edit can touch, in one string. ⚠️ Order matters only in that it must be STABLE —
     the recorder compares snapshots by value to decide whether anything actually changed. */
  const snapshot = JSON.stringify({
    content, styles, widgetCfg, sections, placedText, rowExtras, icons, blockOrder, rowOrder, removed, theme,
  });

  useEffect(() => {
    /* ⚠️ The flag is CLEARED on a timeout, not here. Clearing it in the effect assumed the effect
       always runs after a restore — but if the restored state happens to equal the current one,
       React skips the re-render, the effect never fires, and the flag stays raised forever. From
       that point every real edit is silently swallowed by this guard and undo appears to stop
       working. The timeout always fires, whether or not anything re-rendered. */
    if (applying.current) return;
    if (past.current[past.current.length - 1] === snapshot) return;
    past.current.push(snapshot);
    /* A new edit ends the redo branch — you cannot redo into a future that no longer follows from
       the present. Every editor works this way and quietly not doing it is how redo starts
       reapplying changes from a page the user already abandoned. */
    if (future.current.length) future.current = [];
    setHistTick((n) => n + 1);
  }, [snapshot]);

  const restore = useCallback((raw: string) => {
    const v = JSON.parse(raw);
    applying.current = true;
    // Effects flush before a 0 ms timeout, so the recorder has already seen the flag by now.
    setTimeout(() => { applying.current = false; }, 0);
    setContent(v.content); setStyles(v.styles); setWidgetCfg(v.widgetCfg);
    setSections(v.sections); setPlacedText(v.placedText); setRowExtras(v.rowExtras);
    setIcons(v.icons); setBlockOrder(v.blockOrder); setRowOrder(v.rowOrder);
    setRemoved(v.removed); setTheme(v.theme);
  }, []);

  /* ⚠️ The stack holds states, not diffs, so the CURRENT state is its last entry — undo pops that,
     keeps it for redo, and restores the one beneath. Treating the top as "the thing to go back to"
     is the classic off-by-one that makes the first undo do nothing. */
  const canUndo = past.current.length > 1;
  const canRedo = future.current.length > 0;
  const undo = useCallback(() => {
    if (past.current.length < 2) return;
    const cur = past.current.pop()!;
    future.current.push(cur);
    restore(past.current[past.current.length - 1]);
    setHistTick((n) => n + 1);
    select(null);
  }, [restore]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(next);
    restore(next);
    setHistTick((n) => n + 1);
    select(null);
  }, [restore]);

  /* Ctrl/⌘+Z and Ctrl/⌘+Shift+Z — ignored while typing, or the shortcut would fight the field's own
     undo and win, throwing away a sentence to undo a layout change. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const resetPage = useCallback(() => {
    setContent(DEFAULT_CONTENT);
    setStyles({});
    setWidgetCfg({});
    setSections([]);
    setIcons({});
    setPlacedText({});
    setRowExtras({});
    setBlockOrder(DEFAULT_BLOCK_ORDER);
    setRowOrder(DEFAULT_ROW_ORDER);
    setRemoved([]);
    setSelectedId(null);
    toast.success('Page reset to default');
  }, []);

  const placedParent = (id: string) => nodeById(id)?.parent;

  /* ⚠️ A preset RESTRUCTURES, and the widgets come with it. Reading the items out in cell order and
     writing them back into the new cells in the same order is what makes "3 across → stacked" keep
     A, B, C as A, B, C — rebuilding the rows alone would leave every item keyed to a column id that
     no longer exists, which is a section that empties itself when you change its shape.
     ⚠️ The new shape is sized to the CONTENT, not to the preset's nominal cell count, so nothing is
     ever dropped: four widgets in "three across" become 3 + 1, not 3 and a deletion. */
  const applyPreset = useCallback((sectionId: string, preset: PresetId) => {
    /* ⚠️ A BUILT-IN band is not in `sections` — its shape is a column COUNT on its config, not a
       `rows` array — so the reflow below found nothing and the preset silently did nothing on the
       three bands that ship with the page. They are the sections most people will ever touch, so
       "sections" here has to mean both kinds. One preset, two storage shapes. */
    if (!/^sec-[0-9]+$/.test(sectionId)) {
      const n = Object.keys(NODE_CFG_SEED[sectionId] ?? {}).length ? Number(cfgFor(sectionId).cols ?? 3) : 3;
      const cols = preset === 'stack' ? '1' : preset === 'grid' ? '2' : preset === 'three' ? '3' : String(Math.max(2, n));
      patchCfg(sectionId, { cols });
      toast.success(`${PRESETS[preset].title} layout applied`);
      return;
    }
    setSections((prev) => prev.map((entry) => {
      if (entry.section.id !== sectionId) return entry;
      const sec = entry.section;
      const ordered = sectionElements(sec);
      const cells = sectionRows(sec).reduce((a, r) => a + r.length, 0);
      const rows = PRESETS[preset].rows(Math.max(ordered.length, cells, 1));
      const next = sectionRebuild(sec, rows, ordered);
      /* Every element now sits in a NEW cell, so each has to be told its new parent — without this
         the panel breadcrumb keeps naming a column that no longer exists. */
      ordered.forEach((el) => {
        const box = boxOfElement(next.root, el.id);
        if (box) registerPlaced(el.id, el.name, el.type, box.id);
      });
      return { ...entry, section: next };
    }));
    toast.success(`${PRESETS[preset].title} layout applied`);
  }, []);

  /** Every cell in the section that can still take something, in reading order. */
  const openCells = (s: CustomSection) => freeLeaves(s.root).map((b) => b.id);

  /* Click-to-add. The library is not a catalogue you can only drag out of.
   *
   * ⚠️ Clicking a row used to mark it "added" and place nothing — the worst of both, because the
   * one signal saying it worked was the signal that lied. An add now always lands somewhere real:
   * the column whose "+" aimed it, else a free column in the section you are in, else the row you
   * are in, else its own new section at the foot of the page. Selecting the result is the proof. */
  const addElement = useCallback((type: string, anchorOverride?: string) => {
    /* ⚠️ An action card is not a generic placed element — it is a member of the Quick Actions row,
       and the row is what gives it its shape, its share of the width and its editor. So adding one
       appends to the row's CONTENT rather than dropping a stand-in element somewhere; that is the
       only way the fourth card comes out identical to the three beside it instead of merely
       similar. */
    /* ⚠️ The palette already disables these rows, but a DRAG can still deliver one — a drop target
       does not know which row it came from — and this is the one funnel both routes pass through.
       Refusing here, with the reason, is what keeps the two consistent. */
    const def = PORTAL_ELEMENTS.find((e) => e.id === type);
    if (def && placedPredefined.has(def.id)) {
      toast.error(`${def.name} is already on this page`);
      return;
    }

    if (type === 'act-ad') {
      if (content.quick.some((q) => q.id === 'quick-ad')) { toast.error('AD Self Service is already on the page'); return; }
      setContent((c) => ({ ...c, quick: [...c.quick, { id: 'quick-ad', title: 'AD Self Service', desc: 'Reset your domain password' }] }));
      setRowOrder((o) => ({ ...o, quick: [...(o.quick ?? DEFAULT_ROW_ORDER.quick), 'quick-ad'] }));
      /* ⚠️ Widen the row to four. The section is three columns, so a fourth card would wrap to a
         full-width row of its own — which is not 'a fourth action card', it is a different block
         that happens to look like one. The Columns control still overrides this afterwards. */
      patchCfg('quick', { cols: '4' });
      select('quick-ad');
      toast.success('AD Self Service added');
      return;
    }

    // A placed element stands in for the column it sits in, so "add another" means "add beside me".
    /* ⚠️ The anchor can be passed IN. The canvas picker adds from the toolbar of the thing you
       clicked "+" on, and `selectedId` has not re-rendered yet at that point — reading state here
       would aim the add at whatever was selected before. */
    const sel = anchorOverride ?? selectedId;
    const anchor = sel && /^el-\d+$/.test(sel) ? placedParent(sel) ?? sel : sel;

    const secId = anchor ? /^sec-\d+/.exec(anchor)?.[0] : undefined;
    const sec = secId ? sections.find((s) => s.section.id === secId)?.section : undefined;
    if (sec) {
      /* ⚠️ The aimed cell has to be a LEAF that is empty — a branch has no content of its own, and
         a full leaf would mean silently replacing somebody's element. */
      const aimedBox = anchor ? findBox(sec.root, anchor) : undefined;
      const aimed = aimedBox && !isBranch(aimedBox) && !aimedBox.el ? aimedBox.id : undefined;
      const target = aimed ?? openCells(sec)[0];
      // Every column full falls through: a new section beats silently replacing someone's element.
      if (target) { dropInColumn(target, type); return; }
    }

    /* ⚠️ A locked row falls THROUGH rather than refusing. You clicked a library row, so something
       has to appear — it just cannot appear here; the seam below gives it its own section, which is
       what clicking with nothing selected already does. */
    const row = anchor && (rowOrder[anchor] ? anchor : Object.keys(rowOrder).find((r) => rowOrder[r].includes(anchor)));
    if (row && !isLockedRow(row)) { dropInRow(row, type); return; }

    const last = blockOrder.filter((b) => !removed.includes(b)).slice(-1)[0] ?? 'hero';
    dropAtSeam(last, type);
  }, [content.quick, selectedId, sections, rowOrder, blockOrder, removed, placedPredefined, dropInColumn, dropInRow, dropAtSeam, select, patchCfg]);

  /* Add the row's one external-link card.
   *
   * ⚠️ It appends to `content.quick` — a REAL fifth action card, not a placed element standing in
   * for one. That is the only way it comes out identical to the four beside it: same renderer, same
   * templates, same share of the row. It also widens the row to five, because a fifth card in a
   * four-column row wraps to a full-width row of its own, which is a different block that happens
   * to look like a card. */
  const addLinkCard = useCallback(() => {
    if (contentRef.current.quick.some((q) => q.id === LINK_CARD_ID)) {
      toast.error('This row already has its external-link card');
      return;
    }
    setContent((c) => ({ ...c, quick: [...c.quick, { id: LINK_CARD_ID, title: 'External link', desc: 'Where this link goes' }] }));
    setRowOrder((o) => ({ ...o, quick: [...(o.quick ?? DEFAULT_ROW_ORDER.quick), LINK_CARD_ID] }));
    patchCfg('quick', { cols: String((rowOrderRef.current.quick ?? DEFAULT_ROW_ORDER.quick).length + 1) });
    select(LINK_CARD_ID);
    toast.success('External link card added');
  }, [select, patchCfg]);

  const moveNode = useCallback((id: string, dir: 'prev' | 'next') => {
    const step = dir === 'prev' ? -1 : 1;
    // A top-level band moves within the page.
    if (blockOrder.includes(id)) { setBlockOrder((o) => moveIn(o, id, step)); return; }
    // A card moves within its row.
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) { setRowOrder((o) => ({ ...o, [row]: moveIn(o[row], id, step) })); return; }
    // An added section moves among the sections pinned to the same anchor.
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.section.id === id);
        const j = i + step;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
      return;
    }
    /* A BOX moves among its siblings. ⚠️ This is new with the tree: under the flat model a column
       had no ordered list of its own to move within, so every column landed on the message below.
       'prev'/'next' read as left/right on a row and up/down on a column, which is the same question
       the toolbar's arrows already ask by axis. */
    const secId = sectionIdOfBox(id);
    const sec = sectionsRef.current.find((s) => s.section.id === secId)?.section;
    const parent = sec ? parentOfBox(sec.root, id) : undefined;
    if (sec && parent) {
      setSections((prev) => prev.map((s) => (
        s.section.id !== secId ? s : {
          ...s,
          section: { ...s.section, root: mapBox(s.section.root, parent.id, (p) => ({ ...p, children: moveIn(p.children!, p.children!.find((c) => c.id === id)!, step) })) },
        }
      )));
      return;
    }
    toast.success('This element sits on its own — nothing to swap it with');
  }, [blockOrder, rowOrder]);

  /* What the toolbar's Split button needs to know: which way this box splits, and why it cannot.
     ⚠️ Returns a REASON rather than a boolean, so the button can stay visible and disabled with the
     reason on it — the way every other cap in this product behaves. Null for anything that is not a
     box, which is how the toolbar knows not to offer Split at all. */
  const splitInfo = useCallback((id: string): { dir: BoxDir; blocked: string | null } | null => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(id))?.section;
    const box = sec ? findBox(sec.root, id) : undefined;
    return box ? { dir: box.dir, blocked: splitBlockedBecause(sec!.root, id) } : null;
  }, []);

  /** Which ordered list an id lives in, so a drag knows what it can be dropped among. */
  const listOf = useCallback((id: string): 'block' | 'section' | string | null => {
    if (blockOrder.includes(id)) return 'block';
    if (/^sec-\d+$/.test(id)) return 'section';
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    return row ?? null;
  }, [blockOrder, rowOrder]);

  const areSiblings = useCallback((a: string, b: string) => {
    const la = listOf(a);
    return !!la && la === listOf(b);
  }, [listOf]);

  /* Lift a placed element out of whichever home holds it, and hand it back.
     ⚠️ Detach must clear BOTH homes for the same reason delete does — a column and a built-in row
     are two different stores, and an element that half-moves is an element that gets duplicated. */
  const detachElement = useCallback((id: string): PlacedElement | null => {
    /* ⚠️ Found from the REFS, not from inside the state updaters. The updaters were where `taken`
       used to be assigned, and React only runs an updater eagerly when that hook's queue is empty —
       so detaching from a SECTION happened to work and detaching from a built-in ROW returned null.
       The caller then bailed out after the element had already been removed: it vanished off the
       page with no toast and no home. Reading first and writing second cannot half-move anything. */
    let taken: PlacedElement | null = null;
    for (const sec of sectionsRef.current) {
      const box = boxOfElement(sec.section.root, id);
      if (box) { taken = box.el!; break; }
    }
    if (!taken) {
      const rows = rowExtrasRef.current;
      const hit = Object.keys(rows).find((r) => rows[r].some((e) => e.id === id));
      if (hit) taken = rows[hit].find((e) => e.id === id) ?? null;
    }
    if (!taken) return null;

    /* Clear BOTH homes — a column and a built-in row are two different stores, and an element that
       half-moves is an element that gets duplicated. */
    setSections((prev) => prev.map((sec) => {
      const box = boxOfElement(sec.section.root, id);
      return box ? { ...sec, section: setBoxEl(sec.section, box.id, undefined) } : sec;
    }));
    setRowExtras((prev) => {
      const hit = Object.keys(prev).find((r) => prev[r].some((e) => e.id === id));
      if (!hit) return prev;
      return { ...prev, [hit]: prev[hit].filter((e) => e.id !== id) };
    });
    return taken;
  }, []);

  /* Move a placed element into a column, anywhere on the page.
     ⚠️ A column holds ONE element, so landing on an occupied one SWAPS the two rather than
     overwriting — dropping onto a filled column used to be the one gesture that could destroy work,
     and a swap is what you meant by dragging one thing onto another anyway. */
  const relocateElement = useCallback((id: string, destCol: string) => {
    const destSec = sectionIdOfBox(destCol);
    let occupant: PlacedElement | null = null;
    let sourceCol: string | null = null;
    /* ⚠️ Read from the REF before anything is written. Reading inside an updater only works while
       that hook's queue is empty, which is what made a move out of a built-in row return null. */
    sectionsRef.current.forEach((sec) => {
      const box = boxOfElement(sec.section.root, id);
      if (box) sourceCol = box.id;
      if (sec.section.id === destSec) {
        const dest = findBox(sec.section.root, destCol);
        if (dest?.el) occupant = dest.el;
      }
    });
    const moving = detachElement(id);
    if (!moving) return;
    setSections((prev) => prev.map((sec) => (
      sec.section.id === destSec ? { ...sec, section: setBoxEl(sec.section, destCol, moving) } : sec
    )));
    registerPlaced(moving.id, moving.name, moving.type, destCol);
    if (occupant && sourceCol) {
      const srcSec = sectionIdOfBox(sourceCol);
      setSections((prev) => prev.map((sec) => (
        sec.section.id === srcSec ? { ...sec, section: setBoxEl(sec.section, sourceCol!, occupant!) } : sec
      )));
      registerPlaced(occupant.id, occupant.name, occupant.type, sourceCol);
    }
    select(id);
    toast.success(occupant ? 'Swapped places' : `${moving.name} moved`);
  }, [detachElement, select]);

  /* ── the split-drop ────────────────────────────────────────────────────────
   *
   * One action behind the blue line, whatever it was that was dragged. `payload` is either a
   * catalogue TYPE (a new element from the library) or a MOVE of something already on the page —
   * the two differ only in where the element comes from, and everything after that is identical:
   * make the box the line promised, put the element in it.
   *
   * ⚠️ A drop lands on the box you AIMED at, both axes. That is the one place it differs from the
   * four `+` adders, which send a row to the section's top level — an adder sits on a section's
   * edge and promises a band, a drag promises "here". It is also what makes a row inside a column
   * possible at all, which is the shape the whole brief is built around: an image on the left with
   * a title and a description stacked beside it.
   * ⚠️ The move case DETACHES first and only then adds. Adding first would leave the element in two
   * boxes for one render, and the source box is found by searching for the element. */
  const dropBeside = useCallback((
    boxId: string,
    payload: { type: string } | { move: string },
    side: 'left' | 'right' | 'above' | 'below',
  ) => {
    const sectionId = sectionIdOfBox(boxId);
    const current = sectionsRef.current.find((s) => s.section.id === sectionId)?.section;
    if (!current) return;
    const dir: BoxDir = side === 'left' || side === 'right' ? 'row' : 'column';
    const before = side === 'left' || side === 'above';
    /* ⚠️ The DROP targets the box you aimed at — NOT `rowTargetOf`. That helper sends a row to the
       section's top level, which is right for the four `+` adders: they sit on a section's edge and
       promise a full-width band. A drag promises something else — "put it HERE" — and routing it to
       the top level is what made "row inside a column" impossible: dropping under an element inside
       a two-column row jumped the new row across the whole section instead of stacking it in the
       column you were pointing at. Two gestures, two meanings, and the line you can see is the one
       that decides. */
    const blocked = neighbourBlockedBecause(current.root, boxId, dir);
    if (blocked) { toast.error(blocked); return; }

    /* Where the moved element lives RIGHT NOW, read before anything is written. */
    let srcSection: string | null = null;
    let srcBox: string | null = null;
    let srcEl: PlacedElement | null = null;
    if ('move' in payload) {
      sectionsRef.current.forEach((s) => {
        const box = boxOfElement(s.section.root, payload.move);
        if (box) { srcSection = s.section.id; srcBox = box.id; srcEl = box.el ?? null; }
      });
    }
    const within = 'move' in payload && srcSection === sectionId && !!srcEl && !!srcBox;

    /* Coming from ANOTHER section, or out of a built-in row: `detachElement` owns those stores, and
       because the removal lands in a different slice than the add there is no ordering hazard. */
    if ('move' in payload && !within) {
      const moved = detachElement(payload.move);
      if (!moved) return;
      setSections((prev) => prev.map((s) => {
        if (s.section.id !== sectionId) return s;
        const made = addNeighbourAt(s.section, boxId, dir, before);
        if (!made.id) return s;
        registerPlaced(moved.id, moved.name, moved.type, made.id);
        return { ...s, section: setBoxEl(made.section, made.id, moved) };
      }));
      select(moved.id);
      toast.success(dir === 'row' ? `${moved.name} moved into a new column` : `${moved.name} moved into a new row`);
      return;
    }

    const el = within ? srcEl! : makeElement((payload as { type: string }).type, boxId);
    /* ⚠️ ONE updater, doing the remove and the add together — this is the whole of the copy bug.
       `detachElement` SCHEDULES a state update; `sectionsRef` is only reassigned during the next
       render, so reading it on the very next line handed back the tree as it was BEFORE the
       removal. The element was then written into its new box on a copy that still had it in the old
       one, and both survived. A move is one transition and has to be one write.
       ⚠️ ADD FIRST, THEN clear the source. Removing first can collapse a branch and take the target
       id with it — the box you were about to add beside stops existing mid-operation. */
    setSections((prev) => prev.map((s) => {
      if (s.section.id !== sectionId) return s;
      const made = addNeighbourAt(s.section, boxId, dir, before);
      if (!made.id) return s;
      let next = setBoxEl(made.section, made.id, el);
      if (within && srcBox) {
        next = setBoxEl(next, srcBox, undefined);
        /* ⚠️ And the emptied box GOES, so its neighbours reflow — that is the "other widgets
           rearrange automatically" half of a move. A root has no parent and cannot be removed: an
           unsplit section keeps its one empty cell, which is the offer to put something back. */
        if (parentOfBox(next.root, srcBox)) next = removeBox(next, srcBox);
      }
      registerPlaced(el.id, el.name, el.type, made.id);
      return { ...s, section: next };
    }));
    select(el.id);
    const verb = within ? 'moved into' : 'placed in';
    toast.success(dir === 'row' ? `${el.name} ${verb} a new column` : `${el.name} ${verb} a new row`);
  }, [detachElement, makeElement, select]);

  /** Drag-to-reorder: lift `source` out of its list and drop it at `target`'s index. */
  /* ⚠️ Resolve a dragged or dropped node to the thing that can actually BE placed.
     A drag aims at what you can see, and what you can see is usually a CHILD: a card's title, an
     image's caption, a widget's heading. None of those has a home of its own — they are parts of
     the element that owns them — so a drop on one used to fall through every branch below and end
     at "Drop it on a column, or on something in the same row", which is an error message about a
     rule the person had not broken. Walking up to the owner makes "I dragged the words" mean "move
     the thing the words belong to", which is the only reading that can be honoured. */
  const placeable = useCallback((id: string): string => {
    let cur = id;
    for (let i = 0; i < 6; i += 1) {
      if (/^el-\d+$/.test(cur) || /^sec-\d+(-c\d+)?$/.test(cur) || listOf(cur)) return cur;
      const parent = nodeById(cur)?.parent;
      if (!parent || parent === cur) break;
      cur = parent;
    }
    return cur;
  }, [listOf]);

  /** Where a node lives: a section column, or a built-in row. Null for a page-level band. */
  /* ⚠️ A cell is any LEAF box, at any depth — and the section ROOT is one until it is split, which
     is why the test is "does this section have a leaf with this id" rather than a pattern on the id.
     A branch is deliberately excluded: it has no content of its own, only children, so dropping an
     element on one has nowhere to land. */
  const cellId = useCallback((id: string) => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(id))?.section;
    const box = sec ? findBox(sec.root, id) : undefined;
    return !!box && !isBranch(box);
  }, []);

  const homeOf = useCallback((id: string): { kind: 'col' | 'row'; id: string } | null => {
    if (cellId(id)) return { kind: 'col', id };
    if (/^el-\d+$/.test(id)) {
      const p = nodeById(id)?.parent;
      if (p && cellId(p)) return { kind: 'col', id: p };
      if (p && rowOrderRef.current[p]) return { kind: 'row', id: p };
    }
    const row = listOf(id);
    if (row && row !== 'block' && row !== 'section') return { kind: 'row', id: row };
    return null;
  }, [listOf, cellId]);

  /* Moving a placed element into a built-in row — Quick Actions, the work row, the records row.
     ⚠️ Detach first, in both stores: an element that half-moves is an element that gets duplicated. */
  const moveIntoRow = useCallback((id: string, rowId: string) => {
    const moving = detachElement(id);
    if (!moving) return;
    setRowExtras((prev) => ({ ...prev, [rowId]: [...(prev[rowId] ?? []), moving] }));
    registerPlaced(moving.id, moving.name, moving.type, rowId);
    select(id);
    toast.success(`${moving.name} moved`);
  }, [detachElement, select]);

  /* A drop on a SEAM builds the element its own section there — the same courtesy dropping a NEW
     element on a seam already gets. Without it the only way to move something out of a crowded
     column was to delete it and drag a fresh one from the library, losing everything it carried. */
  const addChildBlock = useCallback((id: string, type: string) => {
    const owner = ownerOf(id);
    const spec = specForNode(owner);
    const key = spec?.collection?.key;
    if (!key) return;
    const seed = spec!.collection!.seed?.(0) ?? {};
    setWidgetCfg((prev) => {
      const cfg = prev[owner] ?? {};
      const list = ((cfg[key] as Cfg[]) ?? []);
      /* ⚠️ An ID, minted the same way the panel's Add mints one. Every item in a collection is
         keyed by it — React's list key, the node id its drawer opens under, and the row the
         reorder/duplicate/delete actions act on. A child added from the canvas with no id was a
         child none of those could address. Same shape as `addItem`, so the two doors produce the
         same item. */
      const item = { id: `${Date.now().toString(36)}${list.length}`, ...seed, type };
      return { ...prev, [owner]: { ...cfg, [key]: [...list, item] } };
    });
    toast.success(`${type[0].toUpperCase()}${type.slice(1)} added`);
  }, [specForNode]);

  const moveToSeam = useCallback((id: string, afterId: string) => {
    const moving = detachElement(id);
    if (!moving) return;
    const section = sectionFromRows(`sec-${nextSectionId.current++}`, [[1]]);
    section.root.el = moving;
    registerPlaced(moving.id, moving.name, moving.type, section.id);
    setSections((prev) => [...prev, { afterId, section }]);
    select(id);
    toast.success(`${moving.name} moved to a new section`);
  }, [detachElement, select]);

  const moveTo = useCallback((source: string, target: string) => {
    /* Both ends resolve to something placeable first — see the note on `placeable`. */
    const src = placeable(source);
    const dst = placeable(target);
    if (src === dst) return;

    /* ⚠️ A placed element is not confined to the list it started in. Reordering handles siblings;
       everything else is a RELOCATION, which is what dragging across sections has to mean — the
       old code refused it with "drop it on something in the same row", so the only way to move an
       element between sections was to delete it and build it again. */
    if (/^el-[0-9]+$/.test(src)) {
      const home = homeOf(dst);
      /* A column takes it directly; landing on an occupant swaps the two. */
      if (home?.kind === 'col') { relocateElement(src, home.id); return; }
      /* A built-in card, or the row it sits in — join that row rather than refusing. This is the
         "find a column on its own" case: you aimed at a place on the page, not at a slot. */
      if (home?.kind === 'row') { moveIntoRow(src, home.id); return; }
    }
    const list = listOf(src);
    if (!list || list !== listOf(dst)) {
      /* ⚠️ Nothing left to try, so say what WOULD work rather than restating the rule that failed.
         Every other route above is now open, so reaching here means the two really have no common
         ground — a page band dropped onto a card, say. */
      toast.error('Drop it on a section, a column, or a seam between blocks');
      return;
    }
    const reorder = (arr: string[]) => {
      const from = arr.indexOf(src);
      const to = arr.indexOf(dst);
      if (from < 0 || to < 0) return arr;
      const next = [...arr];
      next.splice(from, 1);
      next.splice(to, 0, src);
      return next;
    };
    if (list === 'block') setBlockOrder(reorder);
    else if (list === 'section') {
      setSections((prev) => {
        const ids = prev.map((s) => s.section.id);
        const order = reorder(ids);
        return order.map((sid) => prev.find((s) => s.section.id === sid)!);
      });
    } else setRowOrder((o) => ({ ...o, [list]: reorder(o[list]) }));
    toast.success('Moved');
  }, [listOf, relocateElement, placeable, homeOf, moveIntoRow]);

  /** Only things with their own identity can be cloned; a fixed page band has none. */
  /** The palette type that renders the same widget as a fixed page block, so it can be cloned. */
  /* ⚠️ NO action cards here. Duplicating one cloned it as a placed element INTO the Quick Actions
     row — which is exactly the standalone placement that is not allowed any more, and the row itself
     now refuses new elements, so the clone would have had nowhere to go. `canDuplicate` reads this
     map, so dropping the four entries is what disables the toolbar button for them: it goes grey
     with its reason rather than vanishing, because the bar is shared and a button that disappears
     for one kind of element reads as a bug in the toolbar. */
  const CLONE_TYPE: Record<string, string> = {
    requests: 'c-requests', approvals: 'c-approvals', knowledge: 'c-knowledge',
    assets: 'c-assets', cis: 'c-cis',
  };

  const canDuplicate = useCallback(
    (id: string) => /^sec-\d+$/.test(id) || /^el-\d+$/.test(id) || !!CLONE_TYPE[id],
    [],
  );

  const duplicateNode = useCallback((id: string) => {
    /* A fixed page block — clone it as a placed element of the equivalent palette type, into the
       row it already sits in, carrying everything that makes it look like itself. */
    const cloneType = CLONE_TYPE[id];
    if (cloneType) {
      const row = Object.keys(rowOrderRef.current).find((r) => rowOrderRef.current[r].includes(id));
      if (!row) return;
      const el = makeElement(cloneType, row);
      setRowExtras((prev) => ({ ...prev, [row]: [...(prev[row] ?? []), el] }));
      /* ⚠️ The config, the style and the words are copied TOO. Cloning the placement alone produced
         a card wearing the widget's factory defaults beside one the admin had spent ten minutes on,
         which reads as the button having done the wrong thing rather than half of the right one. */
      setWidgetCfg((prev) => ({ ...prev, [el.id]: { ...prev[id] } }));
      setStyles((prev) => {
        const next = { ...prev };
        if (prev[id]) next[el.id] = { ...prev[id] };
        /* Its child text nodes carry their own styles under their own ids. */
        ['-title', '-sub', '-viewall', '-icon'].forEach((suffix) => {
          if (prev[id + suffix]) next[el.id + suffix] = { ...prev[id + suffix] };
        });
        return next;
      });
      setPlacedText((prev) => (prev[id] ? { ...prev, [el.id]: { ...prev[id] } } : prev));
      setIcons((prev) => (prev[id] ? { ...prev, [el.id]: prev[id] } : prev));
      select(el.id);
      toast.success(`${el.name} copied`);
      return;
    }
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const found = prev.find((s) => s.section.id === id);
        if (!found) return prev;
        const copyId = `sec-${nextSectionId.current++}`;
        /* ⚠️ The copy is built from the ORIGINAL's shape, so nesting at any depth comes across
           intact — `sectionRows` would only describe the top two levels, which is right for a
           preset and wrong for a duplicate. Box ids are re-minted under the new section id; the
           elements are cloned because two sections cannot both hold the same instance. */
        const clone = (b: Box): Box => ({
          ...b,
          id: b.id === found.section.id ? copyId : b.id.replace(found.section.id, copyId),
          children: b.children?.map(clone),
          el: b.el ? { ...b.el, id: `el-${nextElementId.current++}` } : undefined,
        });
        const section: CustomSection = { id: copyId, root: clone(found.section.root), next: found.section.next };
        sectionElements(section).forEach((el) => {
          const box = boxOfElement(section.root, el.id);
          if (box) registerPlaced(el.id, el.name, el.type, box.id);
        });
        return [...prev, { afterId: found.afterId, section }];
      });
      toast.success('Section duplicated');
      return;
    }
    // A placed element clones into a fresh column beside its own.
    const col = placedParent(id);
    if (!col) return;
    const secId = sectionIdOfBox(col);
    let cloneId: string | null = null;
    setSections((prev) => prev.map((s) => {
      if (s.section.id !== secId) return s;
      const src = findBox(s.section.root, col)?.el;
      if (!src) return s;
      /* ⚠️ A clone lands in a ROW UNDER the original, inside that element's own box — not in a new
         column of the section around it. Copying a paragraph produced a two-column section with the
         original squeezed into half the width: the section it belonged to was restructured to hold
         its own copy, so the page moved everywhere except where the copy was wanted. Stacking keeps
         both at full width and keeps the change inside the box that was copied.
         ⚠️ `addNeighbourAt` with an explicit `'column'` rather than `addSibling`, which inherits the
         parent's direction — and the parent of a leaf is a row by default, which is exactly how the
         columns were appearing. */
      const grownAt = addNeighbourAt(s.section, col, 'column', false);
      if (!grownAt.id) return s;
      const grown = grownAt.section;
      const slot = freeLeaves(grown.root).find((b) => b.id === grownAt.id) ?? freeLeaves(grown.root)[0];
      if (!slot) return s;
      const clone = { ...src, id: `el-${nextElementId.current++}` };
      registerPlaced(clone.id, clone.name, clone.type, slot.id);
      cloneId = clone.id;
      return { ...s, section: setBoxEl(grown, slot.id, clone) };
    }));
    /* ⚠️ A copy has to arrive as a COPY — same content, same design, and open for editing. Cloning
       the placement alone produced a blank element wearing the original's name, and left the panel
       pointing at what you copied FROM, so the next edit landed on the wrong element. Config and
       style are both keyed by node id, so each is copied across explicitly. */
    if (cloneId) {
      setWidgetCfg((m) => (m[id] ? { ...m, [cloneId!]: { ...m[id] } } : m));
      setStyles((m) => (m[id] ? { ...m, [cloneId!]: { ...m[id] } } : m));
      select(cloneId);
    }
    toast.success('Element duplicated');
  }, [select]);

  const deleteNode = useCallback((id: string) => {
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => prev.filter((s) => s.section.id !== id));
    } else if (/^sec-\d+-b\d+$/.test(id)) {
      /* ⚠️ A COLUMN, which is what you actually have selected when you click an empty section —
         the column is the innermost selectable thing inside it. Delete used to fall through to the
         `removed` branch here and silently do nothing, which is why deleting an empty section
         appeared broken. Removing the last column removes the section: a section with no columns
         is not an empty section, it is nothing. */
      const secId = sectionIdOfBox(id);
      setSections((prev) => prev.map((s) => (
        /* ⚠️ `removeBox` collapses a branch left holding ONE child into that child, so deleting the
           second of two columns returns the section to the single cell it started as rather than
           leaving a branch that looks like a leaf but answers differently to every structural
           question. The section itself is never removed here — a root has no parent to be removed
           from, and deleting the section is the `sec-N` branch above. */
        s.section.id === secId ? { ...s, section: removeBox(s.section, id) } : s
      )));
    } else if (/^el-\d+$/.test(id)) {
      /* ⚠️ A placed element has TWO possible homes — a section column, or a built-in row via
         `rowExtras`. Delete only ever looked in the columns, so anything dropped into Quick Actions
         or a cards row reported "Removed" and stayed on the page. Both homes are cleared; an element
         lives in one of them, so the other pass is a no-op. */
      setSections((prev) => prev.map((s) => {
        const box = boxOfElement(s.section.root, id);
        return box ? { ...s, section: setBoxEl(s.section, box.id, undefined) } : s;
      }));
      setRowExtras((prev) => {
        const hit = Object.keys(prev).find((r) => prev[r].some((e) => e.id === id));
        return hit ? { ...prev, [hit]: prev[hit].filter((e) => e.id !== id) } : prev;
      });
    } else {
      const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
      if (row) setRowOrder((o) => ({ ...o, [row]: o[row].filter((x) => x !== id) }));
      else setRemoved((r) => [...r, id]);
    }
    select(null);
    toast.success('Removed');
  }, [rowOrder, select]);

  /* "+" opens the element library — the one place elements come from.
     It also SELECTS the target, so the canvas still shows where the next add is aimed while the
     panel is showing the list, and `addElement` knows where a click should land. Not via select(),
     which would clear the panel it just opened. */
  /* ⚠️ A ref, not a direct call: `addElement` is declared after this and closes over state that
     changes every render, so capturing it in this callback's deps would either be a use-before-
     declaration or a stale copy. */
  /* ⚠️ Through a ref: `dropBeside` is declared ~450 lines below `addSiblingElement`, and naming it
     directly there is the temporal-dead-zone crash this file has already taken once (see the note
     on `dropBeside` and `detachElement`). */
  const dropBesideRef = useRef<((b: string, p: { type: string }, s: 'left' | 'right' | 'above' | 'below') => void) | null>(null);
  const addElementRef = useRef<((type: string, anchor?: string) => void) | null>(null);

  const addInside = useCallback((id: string, type?: string) => {
    setSelectedId(id);
    /* The canvas toolbar picks a type itself, so there is nothing left to choose — placing it and
       swapping the panel to the library would send you somewhere you no longer needed to go. */
    if (type) { addElementRef.current?.(type, id); return; }
    setActive('add');
    setCollapsed(false);
    toast.success('Pick an element to add here — click it, or drag it onto the page');
  }, []);

  /* Inline text edits, routed to whichever store actually owns the words.
   *
   * ⚠️ There is no single text store, and that is deliberate — a card's title belongs to the card's
   * CONFIG, the hero's heading to page CONTENT, a dropped Text element to its own config. Writing
   * to one place would give the canvas and the panel two copies of the same sentence, which is the
   * thing this builder has kept avoiding. So the router mirrors exactly how the panel reads them,
   * and both surfaces stay views of one value.
   *
   * ⚠️ `-title` / `-sub` suffixes are card text nodes; `ownerOf` already strips them for config, so
   * the same rule decides the KEY here. */
  const setText = useCallback((id: string, text: string) => {
    /* An image's caption — markup, on the image's own config, which is the key its panel writes. */
    const cap = /^(.+)-caption$/.exec(id);
    if (cap) { patchCfg(cap[1], { caption: text }); return; }
    const card = /^(.*)-(title|sub)$/.exec(id);
    if (card) { patchCfg(card[1], { [card[2] === 'title' ? 'title' : 'sub']: text }); return; }

    if (id === 'hero-title') { patchCfg('hero', { heading: text }); return; }
    /* A "View all" label, edited on the canvas. Same key the panel writes. */
    const link = /^(.+)-viewall$/.exec(id);
    if (link) { patchCfg(link[1], { viewAllLabel: text }); return; }
    if (id === 'hero-subtitle') { patchCfg('hero', { sub: text }); return; }

    // Every list widget's heading owns a `title` on its own widget.
    if (/-title$/.test(id)) {
      patchCfg(id.replace(/-title$/, ''), { title: text });
      return;
    }

    // A dropped Text element keeps its words as HTML on its own config.
    if (/^el-\d+$/.test(id)) { patchCfg(id, { html: text }); return; }

    /* A placed element's own words — a KPI's label, a custom card's title or subtext. The suffix IS
       the config key, which is why these need no per-type branch. */
    const placedTxt = /^(el-\d+)-(title|sub|label)$/.exec(id);
    if (placedTxt) { patchCfg(placedTxt[1], { [placedTxt[2]]: text }); return; }

    // An item's sub-element — the words live on the item, inside its widget's config.
    const item = parseItemId(id);
    if (item) {
      const owner = item.widget;
      setWidgetCfg((prev) => {
        const cfg = prev[owner] ?? {};
        const list = (cfg[item.key ?? 'items'] as Cfg[]) ?? [];
        return {
          ...prev,
          [owner]: { ...cfg, [item.key ?? 'items']: list.map((it, i) => (String(it.id ?? i) === item.item ? { ...it, [item.part ?? 'title']: text } : it)) },
        };
      });
    }
  }, [patchCfg]);

  /* Replace a placed element with a different kind, in the same spot.
     ⚠️ It takes a NEW id rather than mutating the old one's type: config and style are keyed by id,
     so reusing it would leave a Divider wearing a Button's stored padding and font. A replacement is
     a different element in the same place, and its settings should start clean. */
  const replaceElement = useCallback((id: string, type: string) => {
    /* ⚠️ A built-in widget can be replaced too. It has no `el-` identity to swap, so the swap is
       expressed the only way the model can express it: hide the block and drop the replacement into
       the row it occupied. Without this, a filled slot could only ever offer "add inside", which is
       a promise a one-widget slot cannot keep. */
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) {
      setRemoved((prev) => (prev.includes(id) ? prev : [...prev, id]));
      dropInRow(row, type);
      return;
    }
    const home = nodeById(id)?.parent ?? null;
    if (!home) return;
    const made = makeElement(type, home);
    /* ⚠️ `isBoxId`, not a regex written here. This tested `-c\d+` — the box naming from BEFORE
       task 23 minted ids — so it had matched nothing since, and every Replace on an element inside
       a custom section fell through to the `rowExtras` branch, found no entry for that home, and
       returned having done nothing. */
    if (isBoxId(home)) {
      setSections((prev) => prev.map((sec) => (
        findBox(sec.section.root, home)?.el?.id === id
          ? { ...sec, section: setBoxEl(sec.section, home, made) }
          : sec
      )));
    } else {
      setRowExtras((prev) => (
        prev[home] ? { ...prev, [home]: prev[home].map((e) => (e.id === id ? made : e)) } : prev
      ));
    }
    select(made.id);
    toast.success(`Replaced with ${made.name}`);
  }, [makeElement, select, rowOrder, dropInRow]);

  addElementRef.current = addElement;
  dropBesideRef.current = dropBeside;

  /* ⚠️ It selects the ICON node, not the card that owns the icon. The canvas already called
     `select('<card>-icon')` before this ran, and this overwrote it with the card's own id — so the
     picker opened while the outline and the sidebar both showed the parent, which is the one thing
     clicking an icon must not do. The VALUE still keys off the card (`icons[ownerOf(id)]`), because
     that is where the glyph is stored; only the selection differs. */
  const pickIcon = useCallback((id: string, anchor: DOMRect) => {
    setSelectedId(`${id}-icon`);
    setIconPick({ id, rect: anchor });
  }, []);

  /* ⚠️ ASKED FOR, never automatic. It used to open once on a first visit and remember that in
     localStorage; it now runs only from the ? beside undo/redo. An admin who came here to change one
     thing gets to change it, and the tour is where somebody who wants it will look.
     ⚠️ Nothing is stored. With no auto-open there is no "have they seen it" to remember, and a flag
     nothing reads is state you have to keep correct forever in exchange for nothing. */
  const [tour, setTour] = useState(false);
  const [tourSeam, setTourSeam] = useState<string | null>(null);
  const endTour = useCallback(() => { setTour(false); setTourSeam(null); }, []);

  const canvasCtx = {
    selectedId, hoverId, select, setHover: setHoverId, styles, setStyle, setText, setCfg: patchCfg,
    addSection, addBeside, dropBeside, columnsFull, splitNode, setNodeDir, splitInfo, addLinkCard, dropInColumn, dropAtSeam, dropInRow,
    addSibling: addSiblingElement, cfg: cfgFor,
    moveNode, duplicateNode, deleteNode, canDuplicate, addInside, moveTo, moveToSeam, addChildBlock, areSiblings, replaceElement, pickIcon, applyPreset,
    tourSeam,
    /* The text toolbar names the theme fonts, so it needs the live theme. */
    theme,
  };

  /* ⚠️ A file dropped OUTSIDE a zone must do nothing. The browser's default for a dropped file is
     to navigate to it — so a near miss on any dropzone in this builder replaced the whole canvas
     with the raw image, losing everything unsaved. The zones themselves stopPropagation, so this
     only ever fires for a genuine miss. */
  useEffect(() => {
    const swallow = (e: DragEvent) => { e.preventDefault(); };
    document.addEventListener('dragover', swallow);
    document.addEventListener('drop', swallow);
    return () => {
      document.removeEventListener('dragover', swallow);
      document.removeEventListener('drop', swallow);
    };
  }, []);

  // Title — inline edit, committed on Enter or blur, abandoned on Escape.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(page.name); }, [page.name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  /** 'saving' for a beat after a change, so the check means something. */
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useCallback(() => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('saved'), 900);
  }, []);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === page.name) { setDraft(page.name); return; }
    onRename(next);
    touch();
  };

  // ── panel resize ──────────────────────────────────────────────────────────
  const drag = useRef<{ x: number; w: number } | null>(null);
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { x: e.clientX, w: width };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      // Dragging LEFT widens the panel, so the delta is inverted.
      const next = drag.current.w + (drag.current.x - e.clientX);
      setWidth(Math.min(MAX_W, Math.max(MIN_W, next)));
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  /* See the note on the panel below — the library is the resting state, not an empty page. */
  const panelKey: RailKey | null = active ?? (selectedId ? null : 'add');

  const openPanel = (key: RailKey) => {
    /* ⚠️ Clicking the LIT item closes the panel outright — the rail is the switch, so it has to
       switch off as well as on. This has to run BEFORE `setCollapsed(false)`; putting the toggle
       after it meant every click re-opened the panel first and the close never survived the same
       tick. */
    if (key === active && !collapsed) { setActive(null); setCollapsed(true); return; }
    setCollapsed(false);
    /* ⚠️ Theme is its OWN panel, not the Page drawer. It was routed there while it was three colour
       fields; a theme is now mode + palette + type + button shape, which is a surface of its own —
       and the Page layer's own theme fields were removed with this change so there is still one door. */
    // Clicking the lit icon again returns to the design panel rather than doing nothing.
    setActive((prev) => (prev === key && !collapsed ? null : key));
  };

  /* ⚠️ The theme paints through ONE wrapper, not by rewriting every block: font + page colour are
     inline, and dark mode is a class the stylesheet answers, so a widget that never asked about the
     theme still obeys it. */
  /* ⚠️ Set during render, BEFORE the canvas below reads any style. `resolve` has forty-odd call
     sites and only ever serves one portal at a time, so the mode lives in that module rather than
     being threaded through every one of them — a parameter that missed a single call site would
     leave one control quietly reading the wrong half of a colour pair. */
  setPortalColorMode(theme.mode);
  const themeSw = swatchesOf(theme);
  /* ⚠️ The accent is the PALETTE's accent slot, full stop. Deferring to the page's own `accent` prop
     for one palette meant picking ServiceOps-light silently produced a different colour from the one
     shown in its swatch strip — a palette you cannot trust to be the palette. */
  const themeAccent = themeSw[3];
  /* ⚠️ The page's own background image. It rides on the SAME wrapper the page colour does, so it
     obeys `background-size: cover` across the whole portal rather than tiling per band — and it is
     read from the unscoped key, because one artwork does not have a dark variant. */
  const pageImg = theme.custom?.pageBgKind === 'image' ? theme.custom?.pageBgImage : undefined;
  const themeWrap = {
    fontFamily: faceOf(theme, 'body').css,
    backgroundColor: themeSw[0],
    ...(pageImg
      ? { backgroundImage: `url(${pageImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
      : null),
    color: themeSw[4],
    '--portal-heading': faceOf(theme, 'heading').css,
    '--portal-accent': themeAccent,
    '--portal-btn-radius': `${buttonOf(theme).radius}px`,
  } as React.CSSProperties;
  const themeClass = `portal-themed ${theme.mode === 'dark' ? 'portal-dark' : ''}`;

  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
  const divider = <span className="mx-1 h-5 w-px bg-[#E5E7EB]" />;

  // ── preview ───────────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="fixed inset-0 z-[9500] flex flex-col bg-[#EEF1F5]">
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4">
          <div className="flex items-center gap-2 text-[13px] text-[#7B8FA5]">
            <Eye size={16} className="text-[#3D8BD0]" />
            Previewing <span className="font-medium text-[#364658]">{page.name}</span> as a requester sees it
          </div>
          <button
            onClick={() => setPreview(false)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          ><X size={14} /> Exit preview</button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${themeClass}`} style={themeWrap}>
          {/* Preview must behave like the real portal — selection off. */}
          <CanvasProvider value={{ ...canvasCtx, enabled: false, selectedId: null, hoverId: null, select: () => {}, setHover: () => {} }}>
            <SupportPortalPreview accent={themeAccent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} rowExtras={rowExtras} cfg={cfgFor} blank={page.start === 'blank'} rail={seed?.rail ?? (isV2 ? RAIL_V2 : undefined)} />
          </CanvasProvider>
        </div>
      </div>
    );
  }

  return (
    /* ⚠️ Starts BELOW the 56px product header rather than at inset-0. The header is still on the
       page while the builder is open, so covering it would leave the logo and global search
       painted over by a canvas that has no use for that strip. */
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-[#EEF1F5]">
      {/* ── Top bar ── the builder's own chrome; the admin sidebar is deliberately gone. */}
      <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white pl-2 pr-3">
        <button onClick={onExit} title="Back to Support Portal" className={iconBtn}>
          <ArrowLeft size={18} />
        </button>

        {/* Inline title */}
        <div className="flex min-w-0 items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') { setDraft(page.name); setEditing(false); }
              }}
              className="h-8 w-[260px] rounded border border-[#3D8BD0] bg-white px-2 text-[14px] font-medium text-[#364658] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Rename page"
              className="group/title flex min-w-0 items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="truncate text-[14px] font-medium text-[#364658]">{page.name}</span>
              <Pencil size={13} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/title:opacity-100" />
            </button>
          )}
          <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
            page.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
          }`}>{page.status}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Nothing has been edited yet, so these say so rather than clicking into nowhere. */}
          <Tooltip><TooltipTrigger asChild>
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            ><Undo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>{canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            ><Redo2 size={17} /></button>
          </TooltipTrigger><TooltipContent>{canRedo ? 'Redo (Ctrl+Shift+Z)' : 'Nothing to redo'}</TooltipContent></Tooltip>
          {/* ⚠️ The ONLY way into the tour. Nothing opens it on arrival any more, so this is not a
              way back to something — it is the entry point, and the reason it sits in the top bar
              rather than in a menu.
              ⚠️ A BUTTON, not a popover. The plan had it opening a small menu with the tour and a
              keyboard-shortcuts sheet, but the builder has no shortcuts sheet, and a menu with one
              real item is a second click in front of the only thing it offers. */}
          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => setTour(true)} aria-label="Take the tour" className={iconBtn}>
              <HelpCircle size={17} />
            </button>
          </TooltipTrigger><TooltipContent>Take the tour</TooltipContent></Tooltip>

          {/* ── Light / dark, for the whole canvas ──────────────────────────────────────────────
              ⚠️ It used to sit on the THEME panel's title row, which put it three clicks away from
              every OTHER panel. Mode is not a theme setting — it decides what every colour on the
              page resolves to, so an admin picking a card's background needs to flip it while that
              card's picker is open, rather than navigating away from the thing they are colouring
              and back. Beside undo/redo it belongs to the canvas, which is what it changes.
              ⚠️ Same component and same state as before, so the Theme panel's palette and every
              style picker's Light/Dark tabs still read the mode from one place. */}
          <span className="ml-1 mr-0.5"><ThemeModeToggle mode={theme.mode} onChange={(m) => setTheme((t) => ({ ...t, mode: m }))} /></span>

          {divider}

          {/* ⚠️ Bordered secondary, not a third plain text button. Reset throws away every edit on
              the page, so it must not sit in the same visual class as Preview, which throws away
              nothing — the weight is the warning. */}
          <button
            onClick={resetPage}
            title="Put every block, style and setting back to the page's default"
            className="ml-1 inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Reset to default</button>
          {/* ⚠️ The same bordered secondary as Reset to default. It was the only bare-text control in a
              row of three, so the bar read as two buttons and a word rather than as a set of
              actions — and the least destructive of the three looked the least like something you
              could press. */}
          {/* ⚠️ ONE anchor around Preview AND Publish. They are the two ends of a single decision —
              look at it as a requester, then hand it to them — so a spotlight on either alone tells
              half the story the last step is there to tell. */}
          <span data-tour="publish" className="ml-1 inline-flex h-8 items-center gap-1">
          <button
            onClick={() => setPreview(true)}
            className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Preview</button>
          {/* ── The primary action, and the one alternative to it ──────────────────────────────
              ⚠️ A SPLIT button, not two buttons side by side. Publishing and saving a draft are the
              same act — committing what is on the canvas — differing only in whether anybody else
              sees it, and two equally-weighted buttons would ask that question every single time.
              The main half does the thing you almost always want; the chevron admits there is
              another way without spending a second primary on it.
              ⚠️ The main half REMEMBERS the last thing you picked. This was built the other way
              first — a face that never changed — on the reasoning that a swapping split button is
              how somebody publishes a portal they meant to keep private. That reasoning does not
              apply in this direction: the default is the LIVE action, so remembering can only ever
              leave the button on the safer of the two. The failure it guards against would need the
              default to be "Save as draft", and it is not. */}
          <div className="relative inline-flex h-8">
            <button
              onClick={() => (pubMode === 'draft' ? onSaveDraft?.() : onPublish())}
              /* The product's primary blue — the same #3D8BD0 every other primary in this app uses.
                 It was slate, which made the one irreversible action on the page the only button in
                 the builder that did not look like this product's buttons. */
              className="inline-flex h-8 items-center rounded-l bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3480c4]"
            >{pubMode === 'draft' ? 'Save as draft' : 'Publish'}</button>
            <button
              onClick={() => setPubMenu((v) => !v)}
              title="More save options"
              aria-label="More save options"
              className="inline-flex h-8 w-7 items-center justify-center rounded-r border-l border-white/25 bg-[#3D8BD0] text-white transition-colors hover:bg-[#3480c4]"
            ><ChevronDown size={14} className={pubMenu ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
            {pubMenu && (
              <>
                {/* A popover that only closes from its own trigger is a modal pretending not to be one. */}
                <span className="fixed inset-0 z-[80]" onClick={() => setPubMenu(false)} />
                <div className="absolute right-0 top-[calc(100%+4px)] z-[81] w-[176px] rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
                  {/* ⚠️ Publish is listed too, and ticked. The menu has to say which of the two the
                      big half does, or the chevron reads as "the other option" and the button as
                      something separate from it. */}
                  {/* ⚠️ NAMES ONLY. Both rows carried a line saying what they do to the live portal,
                      which is the genuinely useful fact — but this is a two-item menu on a button
                      somebody presses several times an hour, and by the third time the sentences are
                      furniture you read past to reach the words underneath. The two names are
                      unambiguous on their own. */}
                  {/* ⚠️ Picking a row DOES the thing and becomes the button's face, in one click.
                      Selecting an action from a menu and then having to press the button beside it
                      to make it happen is two gestures for one intention — and the row you just
                      chose gives no sign it is waiting for a second one.
                      ⚠️ The tick marks the CURRENT mode, so the menu always says what the big half
                      is about to do. Without it the chevron reads as "the other option" and the
                      button as something unrelated to the list under it. */}
                  {([['publish', 'Publish'], ['draft', 'Save as draft']] as const).map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => {
                        setPubMenu(false);
                        setPubMode(m);
                        if (m === 'draft') onSaveDraft?.(); else onPublish();
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                    >
                      {pubMode === m
                        ? <Check size={14} className="flex-shrink-0 text-[#3D8BD0]" />
                        /* Holds the tick's column so both labels line up whichever is active. */
                        : <span className="size-[14px] flex-shrink-0" />}
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </span>

        </div>
      </div>

      {/* ── Work area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        {/* ⚠️ A flex COLUMN, so the page card below can be told to fill. The scroller was a plain
            block, which left the card at its content height — and on an empty portal that meant the
            canvas ended a few hundred pixels down with the app's background running on underneath.
            Flex is what makes "fill the space" expressible without a magic number for the padding. */}
        <div data-tour="canvas" className="relative flex min-w-0 flex-1 flex-col overflow-y-auto p-5">
          <div
            /* The box a floating toolbar must stay inside — the design panel owns the space to its right. */
            data-portal-canvas
            /* ⚠️ `flex-1` with `min-h-0` off: the card fills the scroller when the page is short
               and still GROWS past it when the page is long, because a flex item's automatic minimum
               size is its content. One rule for both, rather than a height for one and an override
               for the other. */
            className={`mx-auto w-full max-w-[1600px] flex-1 rounded-lg border border-[#E1E6ED] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)] ${themeClass}`}
            style={themeWrap}
          >
            <CanvasProvider value={{ ...canvasCtx, enabled: true }}>
              <SupportPortalPreview accent={themeAccent} content={content} sections={sections} icons={icons} placedText={placedText} blockOrder={blockOrder} rowOrder={rowOrder} removed={removed} rowExtras={rowExtras} cfg={cfgFor} setCfg={patchCfg} blank={page.start === 'blank'} rail={seed?.rail ?? (isV2 ? RAIL_V2 : undefined)} pageImage={pageImg} />
            </CanvasProvider>
          </div>

          {/* With the panel hidden the rail is the only way back to it — this restores the last one. */}
          {/* The inline half of the icon field. Anchored to the icon that was clicked, writing the
              same store the panel writes. */}
          {iconPick && (
            <IconPopover
              value={icons[iconPick.id]}
              anchor={iconPick.rect}
              onPick={(c) => { setIcons((m) => ({ ...m, [iconPick.id]: c })); setIconPick(null); }}
              onClose={() => setIconPick(null)}
            />
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Show design panel"
              className="fixed right-[72px] top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-l border border-r-0 border-[#E1E6ED] bg-white text-[#64748B] shadow-sm transition-colors hover:text-[#3D8BD0]"
            ><ChevronLeft size={16} /></button>
          )}
        </div>

        {/* Drag handle — its own 5px strip so the 1px seam is still easy to grab. */}
        {!collapsed && (
          <div
            onMouseDown={startDrag}
            title="Drag to resize"
            className="group/rz relative w-[5px] flex-shrink-0 cursor-col-resize bg-[#E5E7EB] transition-colors hover:bg-[#3D8BD0]"
          >
            <span className="absolute left-1/2 top-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C3CBD6] transition-colors group-hover/rz:bg-white" />
          </div>
        )}

        {/* Design panel */}
        {!collapsed && (
          <aside data-tour="panel" style={{ width }} className="flex flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            {/* ⚠️ DERIVED, not a second piece of state. With nothing selected and no rail panel open
                the panel shows the Widgets library — on arrival and again every time you deselect.
                Holding it in state would mean every path that clears a selection had to remember to
                put the library back, and the first one that forgot would leave a blank panel. */}
            {/* ⚠️ NO header bar. It carried a close button and a divider above every panel — a second
                way to dismiss something the rail already dismisses, and a rule across the top that
                separated the panel from the one thing naming what you had selected. Reset is the only
                action that belonged here, and it belongs BESIDE the name of the thing it resets, not
                floating above it. A rail panel still needs its own title, so it keeps one line. */}
            {panelKey && (
              <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-[13px] font-semibold text-[#364658]">{PANEL_COPY[panelKey].title}</p>
                  {/* Light / dark used to live here; it is a canvas-wide switch, so it moved to the
                      top bar beside undo/redo — see the note there. */}
                </div>
                {PANEL_COPY[panelKey].body && (
                  <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">{PANEL_COPY[panelKey].body}</p>
                )}
              </div>
            )}

            {/* A rail panel wins while one is open; otherwise the panel is the element editor,
                falling back to the "select something" empty state. */}
            {panelKey === 'add' ? (
              <div className="min-h-0 flex-1"><SupportPortalAddPanel onAdd={addElement} placed={placedPredefined} /></div>
            ) : active === 'theme' ? (
              <div className="flex min-h-0 flex-1 flex-col"><PortalThemePanel theme={theme} onChange={(patch) => setTheme((t) => ({ ...t, ...patch }))} /></div>
            ) : active === 'branding' ? (
              <div className="min-h-0 flex-1"><PortalBrandingPanel /></div>
            ) : active === 'settings' ? (
              <div className="min-h-0 flex-1 overflow-y-auto"><AdminSupportPortalSettings compact /></div>
            ) : active ? (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={active} /></div>
            ) : selectedId && specForNode(selectedId) ? (
              /* A widget the specification covers gets the spec-driven drawer. Everything else in
                 the 65-element palette keeps the editor it already had — this adds, it does not
                 take away. */
              <div className="min-h-0 flex-1">
                <PortalWidgetDrawer
                  nodeId={selectedId}
                  spec={specForNode(selectedId)!}
                  cfg={cfgFor(selectedId)}
                  onAddLinkCard={addLinkCard}
                  setCfg={(patch) => patchCfg(ownerOf(selectedId), patch)}
                  styles={styles}
                  setStyle={setStyle}
                  replaceStyle={replaceStyle}
                  onSelect={select}
                  onReset={() => { replaceStyle(selectedId, {}); setWidgetCfg((m) => { const n = { ...m }; delete n[ownerOf(selectedId)]; return n; }); toast.success('Element reset'); }}
                  applyPreset={applyPreset}
                  icon={icons[ownerOf(selectedId)]}
                  setIcon={(c) => setIcons((p) => ({ ...p, [ownerOf(selectedId)]: c }))}
                  canDuplicate={canDuplicate(selectedId)}
                  onDuplicate={() => duplicateNode(selectedId)}
                  onDelete={() => deleteNode(selectedId)}
                  onOpenSetting={(section, card) =>
                    toast.success(`This lives in Admin › ${section}${card ? ` › ${card}` : ''}`)}
                />
              </div>
            ) : selectedId ? (
              <div className="min-h-0 flex-1">
                <PortalElementPanel
                  nodeId={selectedId}
                  content={content}
                  setContent={(fn) => setContent((c) => fn(c))}
                  styles={styles}
                  setStyle={setStyle}
                  onSelect={select}
                  icons={icons}
                  setIcon={(id, c) => setIcons((p) => ({ ...p, [id]: c }))}
                  placedText={placedText}
                  setPlacedText={(id, patch) => setPlacedText((p) => ({ ...p, [id]: { ...p[id], ...patch } }))}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto"><PanelEmptyState active={null} /></div>
            )}
          </aside>
        )}

        {/* Icon rail — the right-most edge of the builder. Sized to the longest label
            ("Templates") so no caption spills past its own highlight.

            AI sits apart at the BOTTOM and carries a standing gradient tint: it is not a fifth
            panel of the same kind, it is the shortcut past all four, so it reads as its own thing
            rather than the last item of a list. */}
        <div data-tour="rail" className="flex w-[72px] flex-shrink-0 flex-col items-center gap-3 border-l border-[#e5e7eb] bg-white py-4">
          {RAIL.map((r) => {
            const on = active === r.key && !collapsed;
            const ai = r.key === 'ai';
            return (
              <button
                key={r.key}
                onClick={() => openPanel(r.key)}
                className={`flex w-[60px] flex-col items-center gap-1.5 rounded py-2 transition-all ${
                  ai ? 'mt-auto border' : ''
                } ${
                  ai
                    ? on
                      ? 'border-[#C4B5FD] bg-gradient-to-b from-[#EDE9FE] to-[#FCE7F3] text-[#6D28D9] shadow-[0_0_0_3px_rgba(124,58,237,0.10)]'
                      : 'border-[#EDE9FE] bg-gradient-to-b from-[#F5F3FF] to-[#FDF2F8] text-[#7C3AED] hover:border-[#C4B5FD] hover:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
                    : on
                      ? 'bg-[#EBF5FF] text-[#3D8BD0]'
                      : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >
                {r.icon(on)}
                <span className="text-[11px] font-medium leading-none">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⚠️ Mounted INSIDE the builder shell and after everything it points at, so its targets are
          in the DOM by the time it measures them. It is below the preview early-return, so opening
          Preview takes the tour off screen with the rest of the chrome — a spotlight over a page
          being viewed as a requester would be pointing at controls that are no longer there. */}
      {tour && (
        <PortalBuilderTour
          selectedId={selectedId}
          onSelect={select}
          onSeamHold={setTourSeam}
          onDone={endTour}
        />
      )}
    </div>
  );
}
