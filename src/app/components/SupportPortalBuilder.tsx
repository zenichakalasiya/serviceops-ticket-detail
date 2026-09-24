import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, Eye, HelpCircle, RotateCcw,
  Palette, PanelRight, Paintbrush, Pencil, Plus, Redo2, Undo2, X, LayoutPanelTop,
} from 'lucide-react';
import { PortalBannersPanel } from './PortalBannersPanel';
import { SCRATCH_BANNER_ID, TEMPLATE_HERO_KEYS, TEMPLATE_PAGE_KEYS, TEMPLATE_STYLE_IDS, bannerTemplate, instantiateBanner, scratchBanner } from './portalBannerTemplates';
import type { BannerTemplate } from './portalBannerTemplates';
import { BannerStartDialog } from './PortalBannerStart';
import type { BannerStart } from './PortalBannerStart';
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
  bandSection, sectionElements, sectionFromRows, sectionIdOfBox, sectionRebuild, sectionRows, setBoxDir, setBoxEl,
  splitBlockedBecause, splitBox,
  BANNER_BLOCK_TYPES, SINGLE_BANNER_BLOCKS, mintBox,
} from './portalPageModel';
import { PortalBuilderTour } from './PortalBuilderTour';
import { PortalWidgetDrawer } from './PortalWidgetDrawer';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById, structureSpecId } from './portalWidgetSpec';
import type { Cfg, WidgetSpec } from './portalWidgetSpec';
import { BANNER_GROUPS } from './portalPageModel';
import type { Box, BoxDir, CustomSection, NodeStyle, PlacedElement, PortalPageContent, PortalStyles } from './portalPageModel';
import { PORTAL_ELEMENTS, PORTAL_EMPTY_WIDGETS, PORTAL_TEMPLATES, bannerLayout, bannerShape, isPredefinedElement, isPredefinedType } from './supportPortalData';
import type { ShapeNode } from './supportPortalData';
import { toneVars } from './portalTone';
import { MAX_BANNER_CARDS, MAX_BANNER_SECTIONS, addToGroup, appendGroup, bannerBoxId, branchNode, defaultTreeFor, groupOf, insertAtEdge, insertBeside, isBannerBox, isBannerGroup, leavesOf, normalizeTree, removeBranch, removeLeaf, replaceLeaf, shiftLeaf, swapLeaves, TEXT_SECTION, unitsOf } from './portalBannerLayout';
import type { BannerNode } from './portalBannerLayout';
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

type RailKey = 'add' | 'theme' | 'branding' | 'banners' | 'settings' | 'ai';

const RAIL: { key: RailKey; label: string; icon: (on: boolean) => ReactNode }[] = [
  /* ⚠️ "Widgets", not "Add". The rail names PLACES, not verbs — Theme, Branding, Templates are all
     nouns, and "Add" made one item read as an action while its neighbours read as destinations. */
  { key: 'add', label: 'Widgets', icon: () => <Plus size={18} /> },
  { key: 'theme', label: 'Theme', icon: () => <Paintbrush size={18} /> },
  { key: 'branding', label: 'Branding', icon: () => <Palette size={18} /> },
  /* Every banner from the layout gallery, built with this editor — horizontal and vertical. */
  { key: 'banners', label: 'Banners', icon: () => <LayoutPanelTop size={18} /> },
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
    body: 'Add, configure, and arrange portal components.',
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
    body: 'Manage your organization’s branding across the Support Portal.',
  },
  banners: {
    title: 'Banners',
    body: 'Pick a banner for the top of this portal. Only the banner changes — every section below stays as it is.',
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

/* The two elements that GATHER rather than each taking a place of their own — see the note at the
   foot of `addElement` for the page, and `dropInRow` for the banner. Both are one tile of a set by
   nature, and nobody wants four of them in four full-width sections.
   ⚠️ MODULE scope. It used to be declared among the callbacks, 500 lines BELOW the first function
   that now reads it — safe only because a callback body runs after the component has, which is
   exactly the kind of ordering that breaks the day somebody adds it to a dependency array. */
const GATHERING = ['x-action-card', 'x-kpi'];

const HERO_LAYOUT_KEYS = [
  'heading', 'sub', 'note', 'bgKind', 'bannerStyle', 'bannerColor', 'bannerImage',
  'headingColor', 'heroInk', 'contentAlign', 'contentMaxWidth', 'searchWidth', 'searchRadius',
  'height', 'heroArt', 'searchPlacement', 'fullBleed', 'bgWholePage',
];

export function SupportPortalBuilder({ page, accent, onRename, onPublish, onSaveDraft, onExit, openOn, onOpenConsumed, templatePreview }: SupportPortalBuilderProps & {
  /* Opened from the create popup's Preview: land in full-page preview with Back + Use template.
     "Use template" leaves preview in THIS instance, so the editor opens on exactly what was shown. */
  templatePreview?: { name: string; onBack: () => void; onUse: () => void };
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
  const [preview, setPreview] = useState(() => !!templatePreview);
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
  const [content, setContent] = useState<PortalPageContent>(() => {
    /* ⚠️ Reads the SEED as well as the layout: the records row is one column in the rail shape, and
       a template asking for that shape has to get the column count with it or My Assets and My CIs
       come out as two narrow cards inside a region built for full-width rows. */
    const base: PortalPageContent = page.layout === 'v2' || seed?.rail
      ? { ...DEFAULT_CONTENT, cols: { ...DEFAULT_CONTENT.cols, records: 1 } }
      : DEFAULT_CONTENT;
    /* ⚠️ `quick-link` is deliberately absent from `DEFAULT_CONTENT` (see `LINK_CARD_ID`) — a template
       that wants the row's fifth, admin-owned tile has to say so itself. Without this, a seed that
       lists it in `rowOrder.quick` would still lose the card: `quickCards` in the preview drops any
       id with no matching `content.quick` entry, so the row would silently render one tile short of
       what the template promised. The placeholder text matches `addLinkCard`'s own default — the
       seed's own `cfg` overrides it with real copy, the same way it overrides any other card's title.
       ⚠️ This also makes `__hasLink` true for a page seeded this way, which is CORRECT: the page
       already carries its one external-link card, exactly as if an admin had pressed "Add" themselves. */
    return seed?.rowOrder?.quick?.includes(LINK_CARD_ID) && !base.quick.some((q) => q.id === LINK_CARD_ID)
      ? { ...base, quick: [...base.quick, { id: LINK_CARD_ID, title: 'External link', desc: 'Where this link goes' }] }
      : base;
  });
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
    /* ⚠️ On a SHAPED banner the search's width belongs to its CELL, which hugs the field. Writing it
       on the field would size the field inside a cell that stays put — an outline wider than the thing
       it outlines, which is exactly what hugging exists to prevent. */
    if (id === 'hero-search' && p.widthPct !== undefined) {
      const shaped = sectionsRef.current.find((s) => s.section.banner)?.section;
      let cell: string | undefined;
      const walk = (b: Box) => { if (b.el?.type === 'bn-search') cell = b.id; b.children?.forEach(walk); };
      if (shaped) walk(shaped.root);
      if (cell) {
        const { widthPct, width: _w, flex: _f, ...rest } = p;
        setStyles((prev) => ({
          ...prev,
          [cell!]: { ...prev[cell!], widthPct },
          ...(Object.keys(rest).length ? { [id]: { ...prev[id], ...rest } } : {}),
        }));
        return;
      }
    }
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
  /* ⚠️ A REF, not the state, because `cfgFor` reads it: §7.8 keeps a card block's column count in
     the STYLE store, and the Gap pair has to know how many cards sit across to say which gaps the
     block has. Through the ref it is always current without putting `styles` in `cfgFor`'s deps,
     where every colour drag would rebuild a callback the whole canvas depends on. */
  const stylesRef = useRef<PortalStyles>({} as PortalStyles);
  /* Filled once the banner helpers below exist — `cfgFor` is declared above them. */
  const heroTreeRef = useRef<(() => ReturnType<typeof normalizeTree>) | null>(null);
  /* ⚠️ Seeded, so a template's hero and column counts are the page's OWN config rather than a
     branch in the renderer. Everything here is a value the panel can already edit, which is what
     makes a template a starting point instead of a mode. */
  const [widgetCfg, setWidgetCfg] = useState<Record<string, Cfg>>(() => ({ ...(seed?.cfg ?? {}) } as Record<string, Cfg>));
  /* ⚠️ Declared ABOVE their first assignment. Put after it, the assignment ran against an
     undefined binding and took the whole builder down on mount. */
  widgetCfgRef.current = widgetCfg;
  stylesRef.current = styles;

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
  /* ⚠️ `logo` belongs here for the same reason `title` does: `header-logo` is a CHILD of the top
     bar with its own panel, so its VALUE lives on the bar's config while its PANEL is its own.
     It was missing, so the Logo panel's upload stored under `widgetCfg['header-logo']` and
     `PortalHeader` read `wc('header')` — a control that saved a value nothing rendered, which is
     why uploading a logo appeared to do nothing at all. */
  /* ⚠️ A banner ROW or COLUMN owns itself. Its id ENDS in the id of the last section it holds, and one
     of those can be `hero-search` — which the suffix stripper would read as a search child and hand back
     a node that does not exist. */
  const ownerOf = (id: string) => (isBannerBox(id) ? id : parseItemId(id)?.widget ?? id.replace(/-(title|sub|label|viewall|icon|search|caption|logo|tile|cl\d+|cv\d+)$/, ''));

  const specForNode = useCallback((id: string | null): WidgetSpec | undefined => {
    if (!id) return undefined;
    /* ⚠️ The ORIGINAL id first. A card's Title node shares its CONFIG with the card — that is what
       `ownerOf` is for — but it must not share its PANEL, or clicking the title opens the card and
       the one thing you aimed at is the one thing you cannot edit. Config and panel resolve
       differently here on purpose. */
    const own = structureSpecId(id);
    if (['card_title', 'card_sub', 'card_icon', 'list_title', 'list_label', 'list_link', 'search', 'image_caption', 'logo', 'data_tile'].includes(own ?? '')) return specById(own);

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

  /* The effective column / row gap of a section, a box or a built-in band, for the panel's Gap pair.
     ⚠️ A box without its own gap takes its SECTION's, and a section reads "Mixed" once any row or
     column inside it has a gap of its own that differs. */
  /* How many cards a block draws and how many sit ACROSS — the two numbers that decide which gaps it
     has. A band's cards are its row members; a card block's are its own contents, and the two service
     rows and the tile cards take their column count from the STYLE store (§7.8) rather than config.
     ⚠️ Returns null for anything that is not a block of cards, which is what keeps the Gap pair off
     every other widget's panel. */
  /* ⚠️ `rest` is the gap the block RENDERS at before anybody sets one, and it differs per block —
     the record tiles sit at 10 where the card grids sit at 12. Seeding them all from one number put
     12 in a field over a page drawing 10, which is the panel disagreeing with the canvas about a
     distance both of them show. */
  function tileShape(owner: string): { count: number; cols: number; rest: number } | null {
    const all = widgetCfgRef.current;
    const cfg = all[owner] ?? {};
    const type = placedType(owner);
    const styleCols = Number((stylesRef.current[owner] as { columns?: number } | undefined)?.columns ?? NaN);
    /* A column count a HUMAN set, from either store, else the block's natural one. */
    const colsOf = (natural: number) => {
      const n = Number(cfg.cols ?? (Number.isFinite(styleCols) ? styleCols : cfg.columns) ?? NaN);
      return Math.max(1, Number.isFinite(n) && n > 0 ? n : Math.max(1, natural));
    };
    if (type === 'x-actions' || owner === 'quick') {
      const count = content.quick.length;
      /* A banner template's compact ROW look rests tighter than its card look. */
      return { count, cols: colsOf(count), rest: String(cfg.look ?? '') === 'row' ? 10 : 12 };
    }
    if (type === 'x-kpis') {
      const items = (cfg.items as unknown[]) ?? (specForNode(owner)?.defaults.items as unknown[]) ?? [];
      const count = items.length;
      return { count, cols: colsOf(count), rest: 12 };
    }
    /* The two service rows: four favourites, and Most Used shows what its `show` says. */
    if (owner === 'favourites') return { count: 4, cols: colsOf(4), rest: 12 };
    if (owner === 'services') return { count: Math.max(1, Number(cfg.show ?? 4)), cols: colsOf(Number(cfg.show ?? 4)), rest: 12 };
    /* ⚠️ My Assets and My CIs draw a HARD four tiles — see `RecordTiles` — whatever `show` says, so
       the axes are read from four rather than from a number the grid does not use. */
    if (owner === 'assets' || owner === 'cis') return { count: 4, cols: colsOf(2), rest: 10 };
    return null;
  }

  function gapSeed(owner: string): Cfg {
    const all = widgetCfgRef.current;
    if (!/^sec-\d+(-b\d+)?$/.test(owner)) {
      const shape = tileShape(owner);
      if (shape) {
        /* ⚠️ `tileGap` is the LEGACY single number and is still read as the fallback for both axes,
           so a block that already carries one keeps the spacing it has. New writes go to the same
           `colGap` / `rowGap` every band and section uses, which is what makes this field and the
           canvas's pink strips one setting rather than two that drift. */
        const legacy = Number(all[owner]?.tileGap ?? NaN);
        const base = Number.isFinite(legacy) ? legacy : shape.rest;
        const col = Number(all[owner]?.colGap ?? base);
        return {
          __gapX: col,
          __gapY: Number(all[owner]?.rowGap ?? col),
          /* Cards side by side have a gap between COLUMNS; cards that wrap onto a second line have
             one between ROWS; a block one card across has only rows, and one row of cards only
             columns. The preset decides both, which is the whole point of asking it here. */
          __hasCols: shape.cols > 1,
          __hasRows: shape.count > shape.cols,
        };
      }
      if (!['work', 'records'].includes(owner)) return {};
      const col = Number(all[owner]?.colGap ?? 16);
      const items = rowOrderRef.current[owner]?.length ?? 0;
      const cols = Math.max(1, Number(all[owner]?.cols ?? items));
      return {
        __gapX: col,
        __gapY: Number(all[owner]?.rowGap ?? col),
        __hasCols: cols > 1,
        __hasRows: items > cols,
      };
    }
    const secId = owner.replace(/-b[0-9]+$/, '');
    const sec = sectionsRef.current.find((s) => s.section.id === secId)?.section;
    const box = sec ? (owner === secId ? sec.root : findBox(sec.root, owner)) : undefined;
    const gx = Number(all[owner]?.gapX ?? all[secId]?.gapX ?? 16);
    const gy = Number(all[owner]?.gapY ?? all[secId]?.gapY ?? 16);
    let mixedX = false;
    let mixedY = false;
    if (sec && owner === secId) {
      const walk = (b: Box) => {
        if (b.id !== secId && b.children?.length) {
          if (all[b.id]?.gapX !== undefined && Number(all[b.id].gapX) !== gx) mixedX = true;
          if (all[b.id]?.gapY !== undefined && Number(all[b.id].gapY) !== gy) mixedY = true;
        }
        (b.children ?? []).forEach(walk);
      };
      walk(sec.root);
    }
    /* The same question for a section: a branch laid out as a row means columns, one laid out as a column
       means rows, and a section that is only one of the two never shows the other's gap. */
    let hasCols = false;
    let hasRows = false;
    const axes = (b: Box) => {
      if ((b.children?.length ?? 0) > 1) { if (b.dir === 'row') hasCols = true; else hasRows = true; }
      (b.children ?? []).forEach(axes);
    };
    if (box) axes(box);
    return { __gapX: gx, __gapY: gy, __gapMixedX: mixedX, __gapMixedY: mixedY, __branch: !!box?.children?.length, __hasCols: hasCols, __hasRows: hasRows };
  }

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
      /* A band of data cards: presets only, no content alignment — the cards fill the row. */
      __dataBand: ['quick', 'favourites', 'services', 'records'].includes(owner),
      ...gapSeed(owner),
      /* ⚠️ Which section is allowed the external-link CTA, and whether it already has one. Seeded
         here rather than tested in the spec, because a spec is data and has no way to look at the
         page. `__hasLink` is what disables the CTA with a reason instead of letting a second card
         land in a row sized for one. */
      ...(owner === 'quick'
        ? { __quickRow: true, __hasLink: content.quick.some((q) => q.id === LINK_CARD_ID) }
        : {}),
      /* The banner's Text & Search section gets its own alignment controls in the panel. */
      ...(owner === 'hero-content' ? { __textSection: true } : {}),
      /* ⚠️ Whether a HUMAN chose the column count, which a merged config cannot tell you: every card block
         carries a spec default, so `cols ?? auto` always read the default and the banner's auto rule never
         applied. The renderer needs the question answered from the raw store, which only lives here. */
      ...(placedType(owner) === 'x-actions' || placedType(owner) === 'x-kpis'
        ? { __colsSet: widgetCfgRef.current[owner]?.cols !== undefined }
        : {}),
      /* The Action cards block's column presets are drawn from how many cards it holds. */
      ...(placedType(owner) === 'x-actions' ? { __tileCount: content.quick.length } : {}),
      /* ⚠️ Two facts the banner's panel cannot work out for itself, seeded the same way
         `__quickRow` is: a spec is DATA and has no way to look at the page.
         `__blankPage` is what lets the layout picker offer VERTICAL layouts — choosing one turns
         the page into two columns, so it is a from-scratch decision rather than a style tweak on
         a portal that already has content. `__layoutHasImage` is what puts the picture field on
         the one layout that has somewhere to put a picture. */
      ...(owner === 'hero'
        ? {
            __blankPage: page.start === 'blank',
            /* Which SHAPE the banner is, for the layout row's preview and for the picker it opens.
               ⚠️ Read from the PAGE, not from the banner: a vertical banner is the page in two
               columns, so `heroPlacement` is where that fact actually lives. */
            __vertical: widgetCfgRef.current.page?.heroPlacement === 'left',
            __layoutHasImage: bannerLayout(String(widgetCfg.hero?.bannerLayout ?? 'classic'))?.hasImage === true,
            __hasSide: (rowExtrasRef.current.hero?.length ?? 0) > 0,
            /* The arrangement as drawn, for the preset picker; the gap it shares with the Content group. */
            __bannerTree: heroTreeRef.current?.() ?? null,
            /* ⚠️ A banner carrying nothing but its Text & Search section has no arrangement to choose and no
               gap between sections to set — one section cannot be laid out against anything. The whole Layout
               presets group is withheld until a second section arrives. */
            ...(() => {
              const t = heroTreeRef.current?.() ?? null;
              let cols = false;
              let rows = false;
              const walk = (n: BannerNode) => {
                if (typeof n === 'string') return;
                if (n.c.length > 1) { if (n.d === 'row') cols = true; else rows = true; }
                n.c.forEach(walk);
              };
              if (t) walk(t);
              return { __bannerSections: leavesOf(t).length, __hasCols: cols, __hasRows: rows };
            })(),
            __contentGap: Number(widgetCfgRef.current.hero?.sectionGapX ?? 20),
            __contentGapY: Number(widgetCfgRef.current.hero?.sectionGapY ?? 20),
            __rootRow2: (() => { const t = heroTreeRef.current?.(); return !!t && typeof t !== 'string' && t.d === 'row' && t.c.length === 2; })(),
          }
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
  }, [specForNode, widgetCfg, sectionHasContent, boxHasContent, theme.mode, content]);

  /* The two service rows share their tile shape. ⚠️ Mirrored HERE, at the one place widget config
     is written, rather than by giving the field a second home — every route into a widget's config
     goes through this function, so there is no path that sets one and misses the other. It is the
     only key in the builder that behaves this way, which is why it is named rather than inferred. */
  const patchCfg = useCallback((id: string, patch: Cfg) => {
    /* The panel's Gap pair. A built-in band keeps `colGap` / `rowGap`; a section or box keeps `gapX` / `gapY`,
       and setting it on a SECTION sets every row and column inside it back to that one value. */
    if (patch.gapPairX !== undefined || patch.gapPairY !== undefined) {
      const { gapPairX, gapPairY, ...rest } = patch;
      const boxy = /^sec-/.test(id);
      const kx = boxy ? 'gapX' : 'colGap';
      const ky = boxy ? 'gapY' : 'rowGap';
      setWidgetCfg((prev) => {
        const next: Record<string, Cfg> = { ...prev, [id]: { ...(prev[id] ?? {}), ...(gapPairX !== undefined ? { [kx]: gapPairX } : {}), ...(gapPairY !== undefined ? { [ky]: gapPairY } : {}) } };
        if (/^sec-\d+$/.test(id)) {
          const sec = sectionsRef.current.find((s) => s.section.id === id)?.section;
          const walk = (b: Box) => {
            if (b.id !== id && next[b.id]) {
              const c = { ...next[b.id] };
              if (gapPairX !== undefined) delete c.gapX;
              if (gapPairY !== undefined) delete c.gapY;
              next[b.id] = c;
            }
            (b.children ?? []).forEach(walk);
          };
          if (sec) walk(sec.root);
        }
        return next;
      });
      if (!Object.keys(rest).length) return;
      patch = rest;
    }
    /* ⚠️ The banner panel's "Gap between items" IS the Content group's gap — one value, written where the
       canvas's pink gap bands write it, so the two can never show different numbers. */
    if (id === 'hero' && (patch.contentGap !== undefined || patch.contentGapY !== undefined)) {
      const { contentGap, contentGapY, ...rest } = patch;
      /* The gaps BETWEEN the banner's sections — the banner's own keys, one per axis. */
      setWidgetCfg((prev) => ({ ...prev, hero: {
        ...(prev.hero ?? {}),
        ...(contentGap !== undefined ? { sectionGapX: contentGap } : {}),
        ...(contentGapY !== undefined ? { sectionGapY: contentGapY } : {}),
      } }));
      if (!Object.keys(rest).length) return;
      patch = rest;
    }
    /* ⚠️ Behaviour is TREE state, so it is applied there and REMOVED from the patch rather than
       written to both. Two copies of the property everything is laid out by is the one thing this
       model exists to avoid — and a stored `dir` would win in `cfgFor` the moment the two drifted. */
    /* ⚠️ …except the banner's auto-layout GROUPS, which are not in any section tree: their direction
       is ordinary config, so it is stored like every other key. */
    if (patch.dir !== undefined && !BANNER_GROUPS.has(id)) {
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
    /* ⚠️ …and NEITHER does a page started from a TEMPLATE. A seed is a description of the page the
       template produces; appending fifteen example sections under it contradicts that description
       line by line — the admin picked a layout and got the layout plus a catalogue of everything
       they did not pick, sitting below the last band. Exactly the argument the line above already
       makes for a blank page: the examples exist so an UNTOUCHED page shows what the palette can
       do, and a page built from a template is not untouched.
       ⚠️ Keyed on the SEED, not on this one template — every seeded template has the same claim to
       describing its own page, and Search Spotlight was carrying the gallery for the same reason. */
    if (page.start === 'blank' || seed) return [];
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
    /* CARDS GATHER ON THE BANNER TOO. On the page a second Action Card lands beside the first and
       the row grows across; on the banner it used to take a whole section of its own, so four cards
       filled a banner that holds four sections and left no room for the words to share it with
       anything. The second one joins the first's GROUP — one section however many cards are in it,
       arranged, moved and counted as the one thing you placed (see `addToGroup`).
       ⚠️ Checked BEFORE `bannerFull`: joining a row adds no section, so the cap has nothing to
       refuse, and refusing here would be refusing the very thing gathering exists to allow.
       ⚠️ The LAST card of that type is the anchor, so cards keep arriving at the end of the row
       rather than after whichever one happened to be added first. */
    /* ⚠️ "Action Card" on the BANNER means THE SET. The four are the product's own destinations and
       a portal has one of each — the palette ticks them as already added, and AD Self Service is a
       fixed key that cannot exist twice — so picking this MOVES them rather than minting copies:
       four individually selectable cards in ONE group row, laid out as columns inside it, and the
       page's Quick Actions row stands down exactly as it does when the Action cards BLOCK is placed.
       Delete them and the row comes back, because `actionsMoved` is derived.
       ⚠️ Each clone carries `fromQuick`, the id of the card it IS. That is what the preview reads to
       know the set has moved, and it is what keeps a card's destination and icon its own after the
       move — a card that arrived wearing the factory defaults would be a fourth "Action Card" beside
       three real ones. */
    if (rowId === 'hero' && type === 'x-action-card') {
      const here = rowExtrasRef.current.hero ?? [];
      if (here.some((e) => !!widgetCfgRef.current[e.id]?.fromQuick)) {
        toast.error('The action cards are already on this banner');
        return;
      }
      const cards = contentRef.current.quick;
      if (!cards.length) { toast.error('There are no action cards to move'); return; }
      if (bannerFull()) return;
      const made = cards.map((c) => {
        const el = makeElement(type, rowId);
        /* The card's own name, so the canvas chip and the breadcrumb say which one this is. */
        return { el: { ...el, name: String(c.title ?? el.name) }, from: c.id, entry: c };
      });
      setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), ...made.map((m) => m.el)] }));
      /* ⚠️ Seeded from the RESOLVED config, not the raw store: an untouched card keeps its title,
         subtitle, icon and destination in its spec's defaults, so the raw store is empty and a copy
         of it would be blank. */
      setWidgetCfg((prev) => {
        const next = { ...prev };
        made.forEach(({ el, from, entry }) => {
          next[el.id] = {
            ...cfgFor(from),
            ...(entry.title ? { title: entry.title } : null),
            ...(entry.desc ? { sub: entry.desc } : null),
            fromQuick: from,
          };
        });
        return next;
      });
      setIcons((prev) => {
        const next = { ...prev };
        made.forEach(({ el, from }) => { if (prev[from]) next[el.id] = prev[from]; });
        return next;
      });
      setStyles((prev) => {
        const next = { ...prev };
        made.forEach(({ el, from }) => {
          if (prev[from]) next[el.id] = { ...prev[from] };
          ['-title', '-sub', '-icon'].forEach((s) => { if (prev[from + s]) next[el.id + s] = { ...prev[from + s] }; });
        });
        return next;
      });
      patchCfg('hero', { bannerTree: appendGroup(heroTreeRef.current?.() ?? null, made.map((m) => m.el.id)) });
      /* ⚠️ NOTHING is selected: you placed a SET, and selecting the first of four says the
         opposite. The toast is what reports the move, and the next click picks whichever card the
         admin actually wants to edit. */
      toast.success('Action cards moved to the banner');
      return;
    }
    if (rowId === 'hero' && GATHERING.includes(type)) {
      const host = [...(rowExtrasRef.current.hero ?? [])].reverse().find((e) => e.type === type)?.id;
      if (host) {
        const tree = heroTreeRef.current?.() ?? null;
        const grp = groupOf(tree, host);
        if (grp && leavesOf(grp).length >= MAX_BANNER_CARDS) {
          toast.error(`A row holds up to ${MAX_BANNER_CARDS} cards — remove one to add another`);
          return;
        }
        const card = makeElement(type, rowId);
        setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), card] }));
        patchCfg('hero', { bannerTree: addToGroup(tree, host, card.id) });
        select(card.id);
        toast.success(`${card.name} added beside the others`);
        return;
      }
    }
    if (rowId === 'hero' && bannerFull()) return;
    const el = makeElement(type, rowId);
    setRowExtras((prev) => ({ ...prev, [rowId]: [...(prev[rowId] ?? []), el] }));
    if (rowId === 'hero') seedBannerItem(el.id, type);
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, patchCfg, select]);

  /* ── The BANNER's items and their arrangement ────────────────────────────────────────────────
   * Items = the Text group, the Search (while it sits in the band) and every widget placed on the banner.
   * ⚠️ Read from the REFS, so the toolbar and the panel see the arrangement as it is right now. */
  const heroItems = (): string[] => ['hero-content', ...(rowExtrasRef.current.hero ?? []).map((e) => e.id)];
  /* ⚠️ A banner holds at most four SECTIONS (the Text & Search section and three more). Refused at the moment of
     adding, with the reason — past four, no arrangement of them reads cleanly. An empty slot being FILLED adds
     nothing, so it is never refused. */
  const bannerFull = () => {
    /* ⚠️ SECTIONS, not items: a gathered row of cards is ONE section, so a banner carrying the
       words and four action cards has two sections and room for two more. Counting leaves made
       every card cost a section and put the cap four cards short of what it means. */
    if (unitsOf(heroTree()).length < MAX_BANNER_SECTIONS) return false;
    toast.error(`A banner holds up to ${MAX_BANNER_SECTIONS} sections — remove one to add another`);
    return true;
  };
  const heroTree = () => normalizeTree(widgetCfgRef.current.hero?.bannerTree, heroItems());
  heroTreeRef.current = heroTree;

  /* What a widget starts as when it lands on the BANNER rather than on the page: the action cards stack
     in one column beside the words, and Announcements becomes the image carousel, filling to the edge. */
  function seedBannerItem(elId: string, type: string) {
    /* ⚠️ No column count is seeded any more: on the banner it follows the SHAPE of the section the block
       landed in (see `bannerCols` in the preview) — all the way across a strip, stacked in a narrow column —
       and a stored '1' would freeze it as stacked wherever it was later moved. */
    /* ⚠️ Announcements no longer arrives as the IMAGE CAROUSEL. That seed outlived the card type it
       named: "Image with carousel" was withdrawn from the Card-type tiles, so an Announcements
       dropped on the banner landed in a shape nothing could offer and nothing could change it to —
       an upload zone over a dark strip, with no tile lit in its own panel. It takes the spec's
       default (`regular`) like every other Announcements now. */
    /* ⚠️ The Custom Card arrives on the banner as QUICK LINKS — that is the name the "+" offered it
       under, so it has to land on the Links layout or the admin gets a picture-and-paragraph card
       they did not ask for. The three links themselves are the card's OWN defaults; only the layout,
       the heading and the empty subtext are seeded here.
       ⚠️ `sub: ''` is deliberate, not an omission: the card's default subtext is a sentence about the
       service desk, which under a heading reading "Quick links" describes nothing on the card. An
       empty string draws nothing and the field is still there to type into. */
    if (type === 'x-card') patchCfg(elId, { layout: 'links', title: 'Quick links', sub: '' });
  }

  /** How many SECTIONS the banner holds — the words plus the widgets beside them.
   *
   * Picking a count lays the banner out at its default arrangement for that count with EMPTY cells in
   * every section the admin has not filled, and each cell then asks what goes in it. That is the whole
   * of the banner's "+": choosing a widget first put it somewhere before there was a somewhere, and the
   * arrangement had to be corrected afterwards.
   * ⚠️ It only ever ADDS. A count below what the banner holds is disabled in the picker, so nothing here
   * has to decide which of the admin's filled sections it would have deleted. */
  const setBannerSections = useCallback((n: number, remove?: string[]) => {
    const units = unitsOf(heroTree());
    const want = Math.max(2, Math.min(n, MAX_BANNER_SECTIONS));
    if (want === units.length) return;

    if (want > units.length) {
      const slots = Array.from({ length: want - units.length }, () => makeElement('bn-slot', 'hero'));
      const tree = defaultTreeFor([...units, ...slots.map((s) => s.id)]);
      if (!tree) return;
      setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), ...slots] }));
      patchCfg('hero', { bannerTree: tree });
      /* ⚠️ Nothing is selected. The admin asked for a shape, not for one of the cells in it — selecting the
         first would take the panel over with an empty slot's settings and say the wrong thing about what
         just happened. The cells themselves are what to click next, and they say so. */
      return;
    }

    /* ── GOING DOWN ──────────────────────────────────────────────────────────────────────────────
     * It used to be refused: a lower count was disabled with "delete one to go back to 2", because
     * applying it would have to decide which of the admin's sections to throw away. That is the right
     * answer to "delete something without asking" and the wrong answer to the question, which is that
     * two of the four cases destroy nothing at all.
     *
     * ⚠️ EMPTY CELLS GO FIRST, and silently. A `bn-slot` holds nothing, so removing one deletes nothing
     * — asking permission to delete nothing is a dialog that teaches people to dismiss dialogs. A banner
     * laid out at four and never filled therefore goes back to two with one click, which is the case
     * this whole change is about.
     * ⚠️ Only what is left after that is ASKED about, and the panel does the asking: `remove` arrives
     * carrying the sections the admin chose. Without enough of them nothing happens — this never picks
     * a filled section on its own.
     * ⚠️ The TEXT & SEARCH section is never a candidate, here or in the panel. It is the banner's words;
     * a count control is not where a banner loses them. */
    const heroList = rowExtrasRef.current.hero ?? [];
    const typeOf = (id: string) => heroList.find((e) => e.id === id)?.type;
    const idOf = (u: BannerNode) => (typeof u === 'string' ? u : bannerBoxId(u));
    const need = units.length - want;
    const empties = units.filter((u) => typeof u === 'string' && u !== TEXT_SECTION && typeOf(u) === 'bn-slot').map(idOf);
    const chosen = (remove ?? []).filter((id) => id !== TEXT_SECTION && !empties.includes(id));
    const drop = [...empties, ...chosen].slice(0, need);
    if (drop.length < need) return;

    /* ONE pass over both stores. A loop calling `deleteNode` would be N toasts, N renders and N reads of
       a tree that is being rewritten underneath it. */
    let tree = heroTree();
    const gone = new Set<string>();
    for (const id of drop) {
      const node = branchNode(tree, id);
      if (node) { leavesOf(node).forEach((l) => gone.add(l)); tree = removeBranch(tree, id); }
      else { gone.add(id); tree = removeLeaf(tree, id); }
    }
    setRowExtras((prev) => ({ ...prev, hero: (prev.hero ?? []).filter((e) => !gone.has(e.id)) }));
    patchCfg('hero', { bannerTree: tree });
    /* ⚠️ The selection is cleared ONLY when what was selected is what just went. A blanket `select(null)`
       here deselected the BANNER — whose toolbar is holding the popup you are working in — so the popup
       vanished mid-edit and the count you had just set could not be followed by an arrangement. */
    if (selectedId && (gone.has(selectedId) || drop.includes(selectedId))) select(null);
  }, [makeElement, patchCfg, select, selectedId]);

  /** The banner's + adders: an empty cell beside an item — a column to its left or right, a row above or below. */
  const addBannerCell = useCallback((anchorId: string, side: 'left' | 'right' | 'top' | 'bottom') => {
    if (bannerFull()) return;
    const el = makeElement('bn-slot', 'hero');
    /* The banner's own adders put the cell at the banner's EDGE; an item's adders put it beside that item. */
    const tree = anchorId === 'hero' ? insertAtEdge(heroTree(), el.id, side) : insertBeside(heroTree(), anchorId, el.id, side);
    setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), el] }));
    patchCfg('hero', { bannerTree: tree });
    select(el.id);
  }, [makeElement, patchCfg, select]);


  /* ⚠️ Read from the REF, not from state: this is called from inside a dragover handler, many times
     a second, and it must answer about the tree as it is right now. */
  const columnsFull = useCallback((boxId: string) => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(boxId))?.section;
    if (!sec) return false;
    const parent = parentOfBox(sec.root, boxId);
    return !!parent && parent.dir === 'row' && (parent.children?.length ?? 0) >= MAX_COLUMNS;
  }, []);

  /* What the BANNER refuses, and why — or null when the drop is fine.
   *
   * ⚠️ ONE gate, called by every route onto a box: palette drag, click-to-add, drop-beside, move and
   * Replace. A banner that accepted a Pending Approvals list by drag but refused it by click would
   * be two rules for one place. `replacing` is the element being swapped out, so replacing the
   * heading with a heading is not refused as a second heading. */
  const bannerRefusal = (boxId: string, type: string, replacing?: string): string | null => {
    const sec = sectionsRef.current.find((s) => s.section.id === sectionIdOfBox(boxId))?.section;
    const name = PORTAL_ELEMENTS.find((e) => e.id === type)?.name ?? 'That widget';
    /* The banner's own blocks draw the banner's words — off the banner they would have nothing to show. */
    if (!sec?.banner) return type.startsWith('bn-') ? `The ${name.toLowerCase()} stays on the banner` : null;
    if (!BANNER_BLOCK_TYPES.has(type)) return `${name} stays on the page — a banner holds short blocks only`;
    if (SINGLE_BANNER_BLOCKS.has(type) && sectionElements(sec).some((e) => e.type === type && e.id !== replacing)) {
      return `The banner already has its ${name.toLowerCase()}`;
    }
    return null;
  };

  const dropInColumn = useCallback((columnId: string, type: string) => {
    const refused = bannerRefusal(columnId, type);
    if (refused) { toast.error(refused); return; }
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

  /** Is this band already living inside a hosting section? Read by the canvas to decide whether a
   *  band shows its OWN adders or its box's — showing both would put two controls on one point. */
  const bandHosted = useCallback((bandId: string) => sectionsRef.current.some((s) => s.section.band === bandId), []);

  /** The FIRST + click on a built-in band — the one case that is not already an ordinary box.
   *
   * ⚠️ It builds a section that HOSTS the band rather than moving anything: the band keeps its node
   * id, its panel, its place in `blockOrder` and its `order`, and simply starts being drawn inside
   * a box. That is what makes every LATER click plain `addBeside` on a plain box — there is exactly
   * one special case, at the boundary, instead of a parallel set of band-shaped operations.
   * ⚠️ Guarded on "already hosted" and silent about it, because the guard can only be hit by a race:
   * once a band is hosted its handles are the box's, so this is not reachable from the UI twice. */
  const splitBand = useCallback((bandId: string, side: 'left' | 'right' | 'top' | 'bottom') => {
    if (sectionsRef.current.some((s) => s.section.band === bandId)) return;
    const dir: BoxDir = side === 'left' || side === 'right' ? 'row' : 'column';
    const before = side === 'left' || side === 'top';
    const section = bandSection(`sec-${nextSectionId.current++}`, bandId, dir, before);
    /* `afterId` is bookkeeping only — a hosting section is filtered OUT of the anchored-sections
       loop and drawn in the band's own slot instead. It names the band so the row still reads
       correctly to anything walking `sections`. */
    setSections((prev) => [...prev, { afterId: bandId, section }]);
    toast.success(dir === 'row' ? 'Column added' : 'Row added');
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
  /* ⚠️ A blank page starts with its banner REMOVED, which is what makes "add a Banner" a real
     action rather than a no-op. The preview already declined to draw any band on a blank page;
     routing that through `removed` instead means one flag answers "is the banner on this page",
     the palette tick and the canvas read the same value, and adding one is just un-removing it. */
  const [removed, setRemoved] = useState<string[]>(() => (page.start === 'blank' ? ['hero'] : []));

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
    /* ⚠️ The BANNER and its SEARCH, counted the same way every other predefined block is — and
       with NO `isBlank` branch, because `removed` already answers the question on both kinds of
       page: a blank one starts with the banner removed, a normal one starts with it present.
       ⚠️ The search is the BANNER'S OWN field, so it is only "on the page" when there is a banner
       to hold it. That is the whole single-instance rule: one search, and the banner owns it, so
       turning the banner's toggle off puts the palette row back rather than leaving a Search
       element ticked against a band that is not showing one. */
    if (!removed.includes('hero')) {
      nodes.add('hero');
      /* A SHAPED banner carries its search as a block, so the block is the answer there. */
      const shaped = sections.find((s) => s.section.banner)?.section;
      if (shaped ? sectionElements(shaped).some((e) => e.type === 'bn-search') : widgetCfg.hero?.showSearch !== false) nodes.add('hero-search');
    }
    /* ⚠️ Only what the page actually DRAWS. A section is painted after its anchor band, and the
       preview skips it when that band is not on the page — the default (v2) portal seeds its example
       sections after `records`, a band the v2 layout never renders, so Announcements, Contact Us and
       both service rows sat in invisible sections and stayed ticked after the visible card was
       deleted. These tests mirror `after()` / `band()` in SupportPortalPreview. */
    const bandShown = (id: string) => blockOrder.includes(id) && !removed.includes(id);
    const anchorShown = (a: string) => (isBlank
      ? ['hero', 'quick', 'favourites', 'services', 'work', 'records'].includes(a)
      : a === 'quick' || a === 'work' || bandShown(a));
    const rowShown = (r: string) => (r === 'hero' ? !removed.includes('hero')
      : r.startsWith('work') ? bandShown('work')
      : DEFAULT_BLOCK_ORDER.includes(r) || blockOrder.includes(r) ? bandShown(r) : true);
    const types = new Set<string>();
    sections
      .filter((s) => (s.section.band ? bandShown(s.section.band) : anchorShown(s.afterId)))
      .forEach((s) => sectionElements(s.section).forEach((el) => types.add(el.type)));
    Object.entries(rowExtras).forEach(([r, list]) => { if (rowShown(r)) list.forEach((el) => types.add(el.type)); });
    /* ⚠️ The rule itself lives in `supportPortalData` — the palette's tick, the canvas's Add and its
       Replace all ask the same question, and three copies of "what counts as predefined" is three
       chances for one surface to disagree with the other two. */
    return new Set(PORTAL_ELEMENTS
      .filter((e) => isPredefinedElement(e) && ((e.node && nodes.has(e.node)) || types.has(e.id)))
      .map((e) => e.id));
  }, [rowOrder, removed, content.quick, blockOrder, sections, rowExtras, isBlank, widgetCfg]);

  /* What a section is already COMMITTED to, which is what decides the list its "+" may offer.
   *
   * ⚠️ Computed in the BUILDER from the live `sections` array, then read by the canvas — the same
   * "the builder decides, the canvas reads" split `placedPredefined`, `splitInfo` and `canDuplicate`
   * already follow. The alternative was walking the `PLACED` registry from the canvas, which is
   * keyed by id and keeps entries for elements that have since been deleted, so a section could
   * report itself committed to a widget nobody could see.
   * ⚠️ 'predefined' means the section holds one of the product's single-instance widgets, and that
   * is the whole of it: nothing may be added beside it, because a Data or Actions widget owns the
   * section it lands in. 'other' means Basic/Visual/Custom, which stack as many to a section as
   * they like. */
  const sectionKind = useCallback((id: string): 'empty' | 'predefined' | 'other' => {
    const secId = /^sec-\d+/.exec(id)?.[0];
    const sec = secId ? sectionsRef.current.find((s) => s.section.id === secId)?.section : undefined;
    if (!sec) return 'empty';
    const types = sectionElements(sec).map((e) => e.type);
    if (!types.length) return 'empty';
    return types.some(isPredefinedType) ? 'predefined' : 'other';
  }, []);

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
      /* ⚠️ At one widget (or none) a preset means "give me this many columns", not "lay one widget out":
         `grid.rows(1)` is a single full-width cell, so picking Grid on a section holding one block changed
         nothing and the control looked dead. Asking for the shape's own nominal cells makes Grid two columns
         and Three across three, with the widget in the first and the rest empty for the next one. */
      const n = Math.max(ordered.length, cells, 1);
      const rows = n <= 1 && preset !== 'cols' ? PRESETS[preset].rows(0) : PRESETS[preset].rows(n);
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
  /* Apply a banner STARTING SHAPE — or change to another one, keeping what is already there.
   *
   * ⚠️ It builds the banner's section tree from the shape, READY-FILLED: every slot gets a real block
   * with its starting config, so the banner lands complete and the admin replaces rather than builds.
   * ⚠️ Switching shape KEEPS content. Each slot first takes an existing block of the same type, in
   * order, so the heading you typed and the search you set move into the new arrangement. A block the
   * new shape has no slot for is NOT deleted — it lands in a row of its own at the foot of the banner,
   * and the toast says so. Losing someone's announcement because they tried a different shape is the
   * one outcome this must never have.
   * ⚠️ The section is minted fresh (new box ids) but the ELEMENTS keep their ids, so every stored
   * config, style, icon and text keyed by element id comes with them. */
  const applyBannerShape = useCallback((shapeId: string) => {
    const shape = bannerShape(shapeId);
    if (!shape) return;
    const current = sectionsRef.current.find((s) => s.section.banner)?.section;
    const pool = current ? [...sectionElements(current)] : [];
    const take = (type: string) => {
      const i = pool.findIndex((e) => e.type === type);
      return i >= 0 ? pool.splice(i, 1)[0] : undefined;
    };
    const id = `sec-${nextSectionId.current++}`;
    const section: CustomSection = { id, root: { id, dir: 'row', weight: 1 }, next: 0, banner: true };
    const seeds: Record<string, Cfg> = {};
    const fill = (n: ShapeNode, box: Box): Box => {
      if ('el' in n) {
        const kept = take(n.el);
        const el = kept ?? makeElement(n.el, box.id);
        if (!kept && n.cfg) seeds[el.id] = n.cfg as Cfg;
        return { ...box, el };
      }
      return { ...box, dir: n.dir, children: n.children.map((c) => fill(c, mintBox(section, 'column', c.weight ?? 1))) };
    };
    section.root = fill(shape.tree, section.root);
    const leftover = pool.length;
    if (leftover) {
      /* A row of their own at the foot, one cell each. */
      const tail: Box = { ...mintBox(section, 'row'), children: pool.map((el) => ({ ...mintBox(section, 'column'), el })) };
      section.root = section.root.dir === 'column'
        ? { ...section.root, children: [...(section.root.children ?? []), tail] }
        : { id, dir: 'column', weight: 1, children: [{ ...section.root, id: `${id}-b${section.next++}` }, tail] };
    }
    /* Every element's PARENT is the box it now sits in — `nodeById` reads this registry. */
    const walk = (b: Box) => { if (b.el) registerPlaced(b.el.id, b.el.name, b.el.type, b.id); b.children?.forEach(walk); };
    walk(section.root);
    setSections((prev) => [...prev.filter((s) => !s.section.banner), { afterId: 'hero', section }]);
    if (Object.keys(seeds).length) setWidgetCfg((prev) => ({ ...prev, ...seeds }));
    setRemoved((r) => r.filter((x) => x !== 'hero'));
    patchCfg('hero', { bannerShape: shape.id, ...(shape.hero ?? {}) });
    select('hero');
    if (!current) toast.success(`${shape.name} banner added — replace any block you don't need`);
    else if (leftover) toast.success(`Changed to ${shape.name}. ${leftover === 1 ? 'One block' : `${leftover} blocks`} had no place in it, so ${leftover === 1 ? 'it is' : 'they are'} in a new row at the bottom`);
    else toast.success(`Changed to ${shape.name} — your content moved with it`);
  }, [makeElement, patchCfg, select]);

  /* Put one block on the banner in a row of its own at the foot — the route for adding a search to a
     banner that does not have one yet. */
  const appendToBanner = useCallback((type: string) => {
    const current = sectionsRef.current.find((s) => s.section.banner)?.section;
    if (!current) return false;
    const refused = bannerRefusal(current.id, type);
    if (refused) { toast.error(refused); return true; }
    const section: CustomSection = { ...current, root: { ...current.root } };
    const cell = mintBox(section, 'column');
    const el = makeElement(type, cell.id);
    const leaf: Box = { ...cell, el };
    section.root = section.root.dir === 'column' && section.root.children?.length
      ? { ...section.root, children: [...section.root.children, leaf] }
      : { id: section.id, dir: 'column', weight: 1, children: [{ ...current.root, id: `${section.id}-b${section.next++}` }, leaf] };
    setSections((prev) => prev.map((s) => (s.section.banner ? { ...s, section } : s)));
    select(el.id);
    toast.success(`${el.name} added to the banner`);
    return true;
  }, [makeElement, select]);

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
    /* ⚠️ The BANNER is not a placed element — it is the page's own band, turned back on. Dropping
       a stand-in into a column would give you a second banner inside the page rather than the
       band every reference portal opens with, and none of its controls would reach it. */
    /* ⚠️ A blank page's banner lands READY-FILLED from the first shape, and the panel opens on the
       shape picker — so "add a banner" produces a finished banner, not an empty band to build. */
    if (type === 'x-banner') {
      /* ⚠️ ASKS first. Orientation is not a style — a vertical banner turns the page into two
         columns and moves every section beside it — so it cannot be a control you find afterwards,
         and it decides which banners there are to choose from. The dialog answers both in the order
         they depend on each other; see PortalBannerStart. */
      setBannerStart('add');
      return;
    }
    /* ⚠️ The SEARCH is the banner's own field, so it needs a banner. Refusing WITH THE REASON at
       the moment you try is the rule this builder follows everywhere a limit has one instance —
       a silent no-op reads as a broken palette row. */
    if (type === 'x-search') {
      /* On a shaped banner the search is a BLOCK, so it goes on as one. */
      if (appendToBanner('bn-search')) return;
      if (removed.includes('hero')) {
        toast.error('Add a Banner first — the search bar lives in it');
        return;
      }
      patchCfg('hero', { showSearch: true });
      setSelectedId('hero-search');
      toast.success('Search added to the banner');
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
      /* ⚠️ On the banner a refused block does NOT fall through to a new section somewhere else — you
         aimed it at the banner, so the answer is the reason, not a surprise further down the page. */
      if (sec.banner) {
        const refused = bannerRefusal(sec.id, type);
        if (refused) { toast.error(refused); return; }
      }
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

    /* CARDS GATHER. An action card and a KPI are one tile of a set — nobody wants four of them in
       four full-width sections down the page — so the second one lands BESIDE the first, in that
       section, and the row grows across.
       ⚠️ Only as a FALLBACK: an explicit aim (a selected column, a drop, a "+" on a box) has already
       returned above. This is what a plain click on the palette does when nothing says otherwise.
       ⚠️ The column cap is checked BEFORE trying, not caught afterwards — `dropBeside` refuses a
       fifth column with a toast, which would leave the click having done nothing at all. Full, the
       card starts a new section instead, which is the honest next place for it. */
    if (GATHERING.includes(type)) {
      let host: string | null = null;
      const scan = (b: Box) => {
        if (b.el?.type === type) host = b.id;
        b.children?.forEach(scan);
      };
      sectionsRef.current.forEach((x) => scan(x.section.root));
      if (host) {
        const sec = sectionsRef.current.find((x) => x.section.id === sectionIdOfBox(host!))?.section;
        if (sec && !neighbourBlockedBecause(sec.root, host, 'row')) {
          dropBesideRef.current?.(host, { type }, 'right');
          return;
        }
      }
    }
    const last = blockOrder.filter((b) => !removed.includes(b)).slice(-1)[0] ?? 'hero';
    dropAtSeam(last, type);
  }, [content.quick, selectedId, sections, rowOrder, blockOrder, removed, placedPredefined, dropInColumn, dropInRow, dropAtSeam, select, patchCfg, applyBannerShape, appendToBanner]);
  /* Add the row's one external-link card.
   *
   * ⚠️ It appends to `content.quick` — a REAL fifth action card, not a placed element standing in
   * for one. That is the only way it comes out identical to the four beside it: same renderer, same
   * templates, same share of the row. It also widens the row to five, because a fifth card in a
   * four-column row wraps to a full-width row of its own, which is a different block that happens
   * to look like a card. */
  /* ⚠️ Every hero key a layout can set, so applying one can CLEAR the outgoing layout's values
     before writing its own. A merge would leave Broadside's cream ground under Front Desk's navy
     and Portico's left alignment under Broadside's centred copy — a banner nobody picked.
     ⚠️ `showSearch`, `searchPlaceholder` and `sideImage` are deliberately NOT here: whether the
     search shows, what it says and which picture is yours are the admin's, not the layout's. */

  /* Applying a banner layout — the one action that writes three stores at once.
 *
 * ⚠️ It REPLACES rather than merges. A layout is a finished banner, so every key it does not
 * mention has to go back to its default — otherwise "Classic" would keep the last layout's
 * colour and height and would not be classic. `KEEP` is the short list of things that are the
 * admin's rather than the layout's: whether the search shows at all, and the words in it.
 * ⚠️ It CONFIRMS only when there is something to lose — copy the admin actually typed, or widgets
 * in the band. Switching between layouts on an untouched banner is a thing people do repeatedly
 * while looking, and a dialog on every click of a picker teaches them to dismiss dialogs. */
  const [pendingLayout, setPendingLayout] = useState<string | null>(null);
  /* The banner picker. `add` is the two-step flow, open only while the page has NO banner (see
     `addElement`); `edit` is the same dialog opened from the banner's own panel with the shape
     already settled, so it skips the first question and offers that shape's layouts.
     ⚠️ ONE state, not two booleans: they are two modes of one dialog, and two flags can both be true. */
  const [bannerStart, setBannerStart] = useState<'add' | 'edit' | null>(null);


  const runBannerLayout = useCallback((id: string) => {
    const l = bannerLayout(id);
    const stamp = Date.now();
    if (!l) return;
    /* ⚠️ The hero's config is REBUILT, not patched — see above. `patchCfg` merges, so the reset
       has to be an explicit undefined for every key the outgoing layout could have set. */
    const wipe: Record<string, unknown> = {};
    for (const k of HERO_LAYOUT_KEYS) wipe[k] = undefined;
    patchCfg('hero', { ...wipe, ...l.hero, bannerLayout: id });
    /* Placement is the PAGE's, not the band's — a vertical banner turns the whole page into two
       columns, which is a fact about the page. Horizontal layouts clear those keys. */
    patchCfg('page', {
      heroPlacement: undefined, heroWidth: undefined, heroSticky: undefined, quickLook: undefined,
      heroInk: undefined, heroArt: undefined,
      ...(l.page ?? {}),
    });
    /* ⚠️ The band's widgets are REPLACED wholesale. Merging would leave the previous layout's
       counters sitting beside the new one's, which is a banner nobody chose. */
    /* ⚠️ The ids are minted ONCE, here, and used by both writes. Building them inside each
       `set…` call meant two `Date.now()` readings — a millisecond apart is enough for the config
       to land on keys no element has, so every tile would render its defaults and the layout's
       labels and sources would be silently dropped. */
    const placed = (l.widgets ?? []).map((w, i) => ({
      id: `hero-w${stamp}-${i}`,
      type: w.type,
      name: PORTAL_ELEMENTS.find((e) => e.id === w.type)?.name ?? w.type,
      cfg: w.cfg ?? {},
    }));
    /* ⚠️ REGISTER them, exactly as `dropInRow` does. Writing `rowExtras` straight is not enough:
       `nodeById` reads a registry, so an element that never registered has no node — its `Sel`
       renders without a `data-node`, and the widget is on the page, visible, and impossible to
       click. Every counter a layout placed was unselectable for exactly this reason. */
    placed.forEach((w) => registerPlaced(w.id, w.name, w.type, 'hero'));
    setRowExtras((prev) => ({ ...prev, hero: placed.map(({ id, type, name }) => ({ id, type, name })) }));
    setWidgetCfg((prev) => {
      const next = { ...prev };
      placed.forEach((w) => { next[w.id] = { ...w.cfg }; });
      return next;
    });
    toast.success(`${l.name} applied`);
  }, [patchCfg]);

  /* ── Banner TEMPLATES (the Banners menu) ───────────────────────────────────────────────────────
   * ⚠️ A template REPLACES the banner and nothing else. Hero config keys a template owns are cleared before
   * its own are written (a merge would leave the last banner's colour under the new one's words), the
   * banner's widgets are swapped wholesale, and the page keys only a vertical banner sets are cleared by
   * every horizontal one. Every other key — the search's scope, the sections below — is untouched.
   * ⚠️ "Default" restores the banner exactly as the page OPENED, captured once at mount — not the
   * product's generic banner, because a page started from a template opened with that template's. */
  const defaultBannerRef = useRef<{
    hero: Cfg; copy: Cfg | undefined; content: Cfg | undefined; page: Cfg;
    styles: Record<string, NodeStyle | undefined>; extras: PlacedElement[]; extraCfg: Record<string, Cfg>;
  } | null>(null);
  if (!defaultBannerRef.current) {
    const extras = rowExtras.hero ?? [];
    defaultBannerRef.current = {
      hero: { ...(widgetCfg.hero ?? {}) },
      copy: widgetCfg['hero-copy'], content: widgetCfg['hero-content'],
      page: Object.fromEntries(TEMPLATE_PAGE_KEYS.map((k) => [k, widgetCfg.page?.[k]])),
      styles: Object.fromEntries(TEMPLATE_STYLE_IDS.map((id) => [id, styles[id]])),
      extras, extraCfg: Object.fromEntries(extras.map((e) => [e.id, widgetCfg[e.id] ?? {}])),
    };
  }

  const clean = (o: Cfg): Cfg => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  /* ⚠️ A VERTICAL banner carries the action cards down its column, one per row — four across in a 320px
     rail were four unreadable slivers. The row's own column count is remembered and handed back the moment a
     horizontal banner (or Default) takes over, so choosing a rail never quietly rewrites the page's cards. */
  const quickFor = (prevQuick: Cfg | undefined, vertical: boolean): Cfg => {
    const q: Cfg = { ...(prevQuick ?? {}) };
    if (vertical) {
      if (q.railCols !== true) q.railColsPrev = q.cols ?? null;
      q.cols = '1';
      q.railCols = true;
    } else if (q.railCols === true) {
      if (q.railColsPrev === null || q.railColsPrev === undefined) delete q.cols; else q.cols = q.railColsPrev;
      delete q.railCols;
      delete q.railColsPrev;
    }
    return q;
  };

  /* ⚠️ Takes a TEMPLATE as well as an id, so the blank start lands through the same path rather
     than through writes of its own — see `startBanner`. The Banners panel still hands it an id. */
  const applyBannerTemplate = useCallback((pick: string | BannerTemplate) => {
    const t = typeof pick === 'string' ? bannerTemplate(pick) : pick;
    if (!t) return;
    const applied = instantiateBanner(t, Date.now());
    applied.widgets.forEach((w) => registerPlaced(w.id, w.name, w.type, 'hero'));
    setWidgetCfg((prev) => {
      const next: Record<string, Cfg> = { ...prev };
      /* The outgoing banner's widgets leave with their config. */
      (rowExtrasRef.current.hero ?? []).forEach((e) => { delete next[e.id]; });
      const keep = Object.fromEntries(Object.entries(prev.hero ?? {}).filter(([k]) => !TEMPLATE_HERO_KEYS.includes(k)));
      next.hero = clean({ ...keep, ...applied.hero });
      delete next['hero-copy'];
      next['hero-content'] = clean(applied.content);
      const keepPage = Object.fromEntries(Object.entries(prev.page ?? {}).filter(([k]) => !TEMPLATE_PAGE_KEYS.includes(k)));
      next.page = clean({ ...keepPage, ...applied.page });
      next.quick = quickFor(prev.quick, t.orientation === 'vertical');
      applied.widgets.forEach((w) => { next[w.id] = { ...w.cfg }; });
      return next;
    });
    setStyles((prev) => {
      const next = { ...prev };
      Object.entries(applied.styles).forEach(([sid, s]) => { next[sid] = s; });
      return next;
    });
    setRowExtras((prev) => ({ ...prev, hero: applied.widgets.map(({ id: wid, type, name }) => ({ id: wid, type, name })) }));
    setRemoved((r) => r.filter((x) => x !== 'hero'));
    /* ⚠️ The blank one says what happened, not what it is called: "Start from scratch banner
       applied" reads as the name of a banner somebody shipped. */
    toast.success(t.id === SCRATCH_BANNER_ID ? 'Banner added — design it in the panel' : `${t.name} banner applied`);
  }, []);

  /* ── Adding a banner ───────────────────────────────────────────────────────────────────────
   * ⚠️ ONE applier for both answers. A scratch banner is a `BannerTemplate` like any other (see
   * `scratchBanner`), so it goes through `applyBannerTemplate` — the path that already wipes every
   * key the outgoing banner could have set, swaps the band's widgets wholesale and hands the action
   * cards' column count back when a horizontal banner takes over. Writing the blank one by hand here
   * is how it ends up carrying a stale colour from the banner before it. */
  const startBanner = useCallback((c: BannerStart) => {
    setBannerStart(null);
    applyBannerTemplate(c.templateId ?? scratchBanner(c.orientation));
    /* ⚠️ `select`, not `setSelectedId`. The rail's Widgets list is open — that is where the Banner
       was just clicked — and only `select` stands it down, so the panel answers with the banner's
       own settings rather than leaving the library up over the thing it has just added. */
    select('hero');
  }, [applyBannerTemplate, select]);

  const restoreDefaultBanner = useCallback(() => {
    const d = defaultBannerRef.current;
    if (!d) return;
    d.extras.forEach((e) => registerPlaced(e.id, e.name, e.type, 'hero'));
    setWidgetCfg((prev) => {
      const next: Record<string, Cfg> = { ...prev };
      (rowExtrasRef.current.hero ?? []).forEach((e) => { delete next[e.id]; });
      next.hero = { ...d.hero };
      if (d.copy) next['hero-copy'] = d.copy; else delete next['hero-copy'];
      if (d.content) next['hero-content'] = d.content; else delete next['hero-content'];
      const keepPage = Object.fromEntries(Object.entries(prev.page ?? {}).filter(([k]) => !TEMPLATE_PAGE_KEYS.includes(k)));
      next.page = clean({ ...keepPage, ...d.page });
      if (d.page.heroPlacement !== 'left') next.quick = quickFor(prev.quick, false);
      Object.entries(d.extraCfg).forEach(([eid, c]) => { next[eid] = c; });
      return next;
    });
    setStyles((prev) => {
      const next = { ...prev };
      Object.entries(d.styles).forEach(([sid, s]) => { if (s) next[sid] = s; else delete next[sid]; });
      return next;
    });
    setRowExtras((prev) => ({ ...prev, hero: d.extras }));
    toast.success('Default banner restored');
  }, []);

  const applyBannerLayout = useCallback((id: string) => {
    const current = bannerLayout(String(widgetCfgRef.current.hero?.bannerLayout ?? 'classic'));
    const hero = widgetCfgRef.current.hero ?? {};
    /* Authored = the copy differs from what the CURRENT layout seeded. That is the only test that
       distinguishes "they wrote this" from "the last layout wrote this". */
    const authored = (k: string) => hero[k] !== undefined && hero[k] !== (current?.hero as Record<string, unknown> | undefined)?.[k];
    const lose = authored('heading') || authored('sub') || (rowExtras.hero?.length ?? 0) > 0;
    if (lose) { setPendingLayout(id); return; }
    runBannerLayout(id);
  }, [rowExtras, runBannerLayout]);

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
    /* A banner item moves earlier or later in the arrangement, keeping its shape. */
    if ((rowExtrasRef.current.hero ?? []).some((e) => e.id === id)) {
      patchCfg('hero', { bannerTree: shiftLeaf(heroTree(), id, step) });
      return;
    }
    // A top-level band moves within the page.
    if (blockOrder.includes(id)) { setBlockOrder((o) => moveIn(o, id, step)); return; }
    // A card moves within its row.
    const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
    if (row) { setRowOrder((o) => ({ ...o, [row]: moveIn(o[row], id, step) })); return; }
    /* An added section moves up or down THE PAGE.
     *
     * ⚠️ It used to swap two entries in `sections`, which only ever reordered sections pinned to the SAME
     * band — so the common case (one section under a band of its own) had nothing to swap with and the
     * arrows did nothing at all, silently. A section's place on the page is its ANCHOR (`afterId`, the band
     * it sits under) and then its position among the sections sharing that anchor, so moving past the first
     * or last of its group re-anchors it to the neighbouring band. */
    if (/^sec-\d+$/.test(id)) {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.section.id === id);
        if (i < 0) return prev;
        const me = prev[i];
        const group = prev.filter((s) => s.afterId === me.afterId && !s.section.band && !s.section.banner);
        const at = group.findIndex((s) => s.section.id === id);
        const swapWith = group[at + step];
        if (swapWith) {
          const j = prev.findIndex((s) => s.section.id === swapWith.section.id);
          const next = [...prev];
          [next[i], next[j]] = [next[j], next[i]];
          return next;
        }
        /* At the edge of its group: hop to the band before or after this one. */
        const bands = blockOrder.filter((b) => !removed.includes(b));
        const a = bands.indexOf(me.afterId);
        const to = bands[a + step];
        if (a < 0 || !to) { toast.error(step < 0 ? 'This is already the first section on the page' : 'This is already the last section on the page'); return prev; }
        const moved = { ...me, afterId: to };
        const rest = prev.filter((s) => s.section.id !== id);
        /* Going UP it lands at the END of the band above; going DOWN, at the START of the band below — in
           both cases immediately beside where it came from. */
        let lastOfTo = -1;
        rest.forEach((s, k) => { if (s.afterId === to) lastOfTo = k; });
        const firstOfTo = rest.findIndex((s) => s.afterId === to);
        const idx = step < 0 ? lastOfTo + 1 : Math.max(firstOfTo, 0);
        const next = [...rest];
        next.splice(idx, 0, moved);
        return next;
      });
      return;
    }
    /* ⚠️ A PLACED ELEMENT moves with the BOX it sits in. Everything below reads `id` as a box or a
       band, so a widget — the Action cards block above all — fell past every branch and landed on the
       "nothing to swap it with" message while sitting in a row with three siblings. An element is not a
       box; it is the box's content, and what moves is the box. */
    for (const s of sectionsRef.current) {
      const box = boxOfElement(s.section.root, id);
      if (!box) continue;
      const parent = parentOfBox(s.section.root, box.id);
      if (!parent?.children) { toast.success('This element sits on its own — nothing to swap it with'); return; }
      setSections((prev) => prev.map((x) => (
        x.section.id !== s.section.id ? x : {
          ...x,
          section: { ...x.section, root: mapBox(x.section.root, parent.id, (p) => ({ ...p, children: moveIn(p.children!, p.children!.find((c) => c.id === box.id)!, step) })) },
        }
      )));
      return;
    }
    /* An element dropped straight into a built-in row moves within that row — the extras render in
       array order, so the array IS the order. */
    const host = Object.keys(rowExtrasRef.current).find((r) => (rowExtrasRef.current[r] ?? []).some((e) => e.id === id));
    if (host) {
      setRowExtras((prev) => {
        const list = prev[host] ?? [];
        const item = list.find((e) => e.id === id);
        return item ? { ...prev, [host]: moveIn(list, item, step) } : prev;
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
  }, [blockOrder, rowOrder, removed]);

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
    const refusedMove = bannerRefusal(destCol, placedType(id) ?? '', id);
    if (refusedMove) { toast.error(refusedMove); return; }
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
    const refusedDrop = bannerRefusal(boxId, 'move' in payload ? placedType(payload.move) ?? '' : payload.type, 'move' in payload ? payload.move : undefined);
    if (refusedDrop) { toast.error(refusedDrop); return; }
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
      /* ⚠️ `isBoxId`, not `-c\d+`: columns have been minted `sec-N-bM` since the section tree, and the old
         pattern made every drop onto a column resolve to its whole SECTION — which has no slot — so dragging
         anything onto a column was refused with "Drop it on a section…". */
      if (/^el-\d+$/.test(cur) || /^sec-\d+$/.test(cur) || isBoxId(cur) || listOf(cur)) return cur;
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

  /* Contact Us — "Split column": an EMPTY slot lands beside the block, on the same line. The slot offers
     Button, Text and Icon; deleting it takes the line back to one column. */
  const splitChildBlock = useCallback((id: string) => {
    const p = parseItemId(id);
    if (!p) return;
    setWidgetCfg((prev) => {
      const cfg = prev[p.widget] ?? {};
      const list = (cfg.children as Cfg[]) ?? [];
      const at = list.findIndex((x) => x.id === p.item);
      if (at < 0) return prev;
      /* One slot per line: a block already paired is not split again. */
      if (list[at].beside || list[at + 1]?.beside) { toast.error('This line already has two columns'); return prev; }
      const slot = { id: `${Date.now().toString(36)}s`, type: 'empty', beside: true };
      return { ...prev, [p.widget]: { ...cfg, children: [...list.slice(0, at + 1), slot, ...list.slice(at + 1)] } };
    });
  }, []);

  const fillChildBlock = useCallback((id: string, type: string) => {
    const p = parseItemId(id);
    if (!p) return;
    const spec = specForNode(p.widget);
    const seed = spec?.collection?.seed?.(0) ?? {};
    setWidgetCfg((prev) => {
      const cfg = prev[p.widget] ?? {};
      const list = (cfg.children as Cfg[]) ?? [];
      return { ...prev, [p.widget]: { ...cfg, children: list.map((x) => (x.id === p.item ? { ...seed, id: x.id, beside: x.beside, type } : x)) } };
    });
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

  /* ── Moving onto the BANNER ─────────────────────────────────────────────────────────────────────
   * The banner is not a column or a row, so `moveTo` had no idea where a drop on it should go and refused
   * every one. Its anchors are its ITEMS: an EMPTY SLOT is taken over (the widget lands exactly where the
   * slot was and the slot goes), another banner item is SWAPPED with a banner item or joined BESIDE by
   * something from the page, and the banner's own background adds the widget to the banner. */
  /* A built-in BLOCK dragged onto the banner — My Open Requests, Announcements, Favourite Services, the Quick
   * Actions row… They are not placed elements, so they cannot simply be relocated: the banner carries widgets.
   * Each one has a palette element that renders the same card (`PortalElement.node` names the block it stands
   * for), so the block becomes THAT widget on the banner and leaves the page.
   * ⚠️ Its config travels with it, or a card that had been given a title and a row count would land on the
   * banner wearing the product's defaults and read as a different card.
   * ⚠️ The Quick Actions ROW maps to the Action cards block, which already MOVES the four cards (`actionsMoved`
   * hides the row), so that one is not added to `removed` — it would hide the row twice and one of them would
   * still be hiding it after the block was deleted from the banner. */
  const blockAsWidget = (blockId: string): string | null => {
    if (blockId === 'quick') return 'x-actions';
    return PORTAL_ELEMENTS.find((e) => e.node === blockId && e.group !== 'Actions')?.id ?? null;
  };

  const moveToBanner = useCallback((source: string, anchor: string, side?: 'left' | 'right' | 'top' | 'bottom') => {
    /* ⚠️ A GATHERED ROW moves as ONE, and it is the only thing here that is not a leaf. Its cards are
       the row — dragging it has to carry all of them or it is not that row any more — so it is lifted
       out as a NODE and put back beside the section you aimed at, which is why `insertBeside` takes a
       node rather than an id. */
    if (isBannerGroup(source)) {
      const node = branchNode(heroTree(), source);
      if (!node || anchor === 'hero' || leavesOf(node).includes(anchor)) return;
      const rest = removeBranch(heroTree(), source);
      patchCfg('hero', { bannerTree: insertBeside(rest, anchor, node, side ?? 'right') });
      toast.success(side === 'top' || side === 'bottom' ? 'Moved into a new row' : 'Moved into a new column');
      return;
    }
    /* A built-in block first: it arrives on the banner as the widget that draws the same card. */
    const asWidget = /^el-\d+$/.test(source) || source === 'hero-content' ? null : blockAsWidget(source);
    if (asWidget) { bringBlockToBanner(source, asWidget, anchor, side); return; }
    const src = /^el-\d+$/.test(source) || source === 'hero-content' ? source : null;
    if (!src) {
      toast.error(/^quick-/.test(source)
        ? 'Drag the whole Quick Actions row onto the banner, or add an Action card from the widgets panel'
        : 'Sections stay on the page — drag a widget or a card onto the banner');
      return;
    }
    if (src === anchor) return;
    const heroList = rowExtrasRef.current.hero ?? [];
    const onBanner = src === 'hero-content' || heroList.some((e) => e.id === src);
    const slot = heroList.find((e) => e.id === anchor && e.type === 'bn-slot');
    let tree = heroTree();

    if (onBanner) {
      if (anchor === 'hero') return;
      if (slot) {
        /* The widget leaves its old place and takes the slot's; the slot is removed. */
        tree = replaceLeaf(removeLeaf(tree, src), anchor, src);
        setRowExtras((prev) => ({ ...prev, hero: (prev.hero ?? []).filter((e) => e.id !== anchor) }));
        toast.success('Moved into the empty slot');
      } else if (side) {
        /* ⚠️ Aimed at an EDGE: it leaves where it was and lands as that section's new column or row —
           the line on screen is the promise, so a swap here would be telling a different story. */
        tree = insertBeside(removeLeaf(tree, src), anchor, src, side);
        toast.success(side === 'left' || side === 'right' ? 'Moved into a new column' : 'Moved into a new row');
      } else {
        tree = swapLeaves(tree, src, anchor);
        toast.success('Swapped places');
      }
      patchCfg('hero', { bannerTree: tree });
      select(src);
      return;
    }

    /* From elsewhere on the page: lift it out of its home first, then give it a place on the banner. */
    if (!slot && bannerFull()) return;
    const moving = detachElement(src);
    if (!moving) return;
    registerPlaced(moving.id, moving.name, moving.type, 'hero');
    setRowExtras((prev) => ({
      ...prev,
      hero: [...(prev.hero ?? []).filter((e) => !(slot && e.id === anchor)), moving],
    }));
    if (slot) tree = replaceLeaf(tree, anchor, moving.id);
    else if (anchor !== 'hero') tree = insertBeside(tree, anchor, moving.id, side ?? 'right');
    if (anchor !== 'hero') patchCfg('hero', { bannerTree: tree });
    select(moving.id);
    toast.success(`${moving.name} moved onto the banner`);
  }, [detachElement, patchCfg, select]);

  /** A built-in block becoming a banner widget: the same card, now a section of the banner. */
  const bringBlockToBanner = useCallback((blockId: string, type: string, anchor: string, side?: 'left' | 'right' | 'top' | 'bottom') => {
    const heroList = rowExtrasRef.current.hero ?? [];
    const slot = heroList.find((e) => e.id === anchor && e.type === 'bn-slot');
    if (!slot && bannerFull()) return;
    const el = makeElement(type, 'hero');
    let tree = heroTree();
    if (slot) tree = replaceLeaf(tree, anchor, el.id);
    else if (anchor !== 'hero') tree = insertBeside(tree, anchor, el.id, side ?? 'right');
    setRowExtras((prev) => ({
      ...prev,
      hero: [...(prev.hero ?? []).filter((e) => !(slot && e.id === anchor)), el],
    }));
    /* Whatever the block was told to show, the widget shows — the defaults underneath it are the same. */
    setWidgetCfg((prev) => (prev[blockId] ? { ...prev, [el.id]: { ...prev[blockId] } } : prev));
    seedBannerItem(el.id, type);
    if (anchor !== 'hero' || slot) patchCfg('hero', { bannerTree: tree });
    /* The block leaves the page — the Action cards block already hides the Quick Actions row by itself. */
    if (type !== 'x-actions') setRemoved((r) => (r.includes(blockId) ? r : [...r, blockId]));
    select(el.id);
    toast.success(`${el.name} moved onto the banner`);
  }, [makeElement, patchCfg, select]);

  /** A NEW element dropped from the library onto the banner. */
  const dropIntoBanner = useCallback((type: string, anchor: string, side?: 'left' | 'right' | 'top' | 'bottom') => {
    const heroList = rowExtrasRef.current.hero ?? [];
    const slot = heroList.find((e) => e.id === anchor && e.type === 'bn-slot');
    if (slot) { replaceElement(slot.id, type); return; }
    if (anchor === 'hero' || !heroItems().includes(anchor)) { dropInRow('hero', type); return; }
    if (bannerFull()) return;
    const el = makeElement(type, 'hero');
    const tree = insertBeside(heroTree(), anchor, el.id, side ?? 'right');
    setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), el] }));
    seedBannerItem(el.id, type);
    patchCfg('hero', { bannerTree: tree });
    select(el.id);
    toast.success(`${el.name} added`);
  }, [makeElement, patchCfg, select, dropInRow]);

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
    /* ⚠️ A BANNER item clones INTO ITS OWN SECTION. `placedParent` only knows about section boxes,
       so a banner widget fell straight past every branch here and Duplicate did nothing at all —
       which is the one route the KPI has to a second tile. `addToGroup` puts the copy beside the
       original, making the group if the original was alone, so "duplicate" reads as "another one of
       these, here" rather than "another section". */
    const onBanner = (rowExtrasRef.current.hero ?? []).find((e) => e.id === id);
    if (onBanner) {
      const tree = heroTreeRef.current?.() ?? null;
      const grp = groupOf(tree, id);
      if (grp && leavesOf(grp).length >= MAX_BANNER_CARDS) {
        toast.error(`A row holds up to ${MAX_BANNER_CARDS} cards — remove one to add another`);
        return;
      }
      const copy = makeElement(onBanner.type, 'hero');
      setRowExtras((prev) => ({ ...prev, hero: [...(prev.hero ?? []), copy] }));
      /* Same content, same design — the rule every other clone here follows. */
      setWidgetCfg((m) => (m[id] ? { ...m, [copy.id]: { ...m[id] } } : m));
      setStyles((m) => {
        if (!m[id] && !['-title', '-sub', '-icon'].some((s) => m[id + s])) return m;
        const next = { ...m };
        if (m[id]) next[copy.id] = { ...m[id] };
        ['-title', '-sub', '-icon'].forEach((s) => { if (m[id + s]) next[copy.id + s] = { ...m[id + s] }; });
        return next;
      });
      setPlacedText((m) => (m[id] ? { ...m, [copy.id]: { ...m[id] } } : m));
      setIcons((m) => (m[id] ? { ...m, [copy.id]: m[id] } : m));
      patchCfg('hero', { bannerTree: addToGroup(tree, id, copy.id) });
      select(copy.id);
      toast.success(`${copy.name} copied`);
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
  }, [select, patchCfg]);

  const deleteNode = useCallback((id: string) => {
    /* ⚠️ On a SHAPED banner the search field is the inner node of a Search BLOCK. Deleting the field
       therefore deletes the block — otherwise the toggle it used to flip goes off while the block still
       draws the field, and Delete appears to do nothing. */
    if (id === 'hero-search') {
      const shaped = sectionsRef.current.find((s) => s.section.banner)?.section;
      const block = shaped && sectionElements(shaped).find((e) => e.type === 'bn-search');
      if (block) { deleteNode(block.id); return; }
    }
    /* ⚠️ A GATHERED ROW deletes as ONE. Its cards arrived together — placing "Action Card" on the
       banner places the product's four — so leaving three of them behind would be the row half
       removed, which is not a state anybody asked for. Both stores go in the same pass: the leaves
       leave `rowExtras.hero` and the branch leaves the tree. */
    if (isBannerGroup(id)) {
      const node = branchNode(heroTree(), id);
      const gone = new Set(leavesOf(node));
      patchCfg('hero', { bannerTree: removeBranch(heroTree(), id) });
      setRowExtras((prev) => ({ ...prev, hero: (prev.hero ?? []).filter((e) => !gone.has(e.id)) }));
      select(null);
      toast.success(`${nodeById(id)?.name ?? 'Cards'} removed`);
      return;
    }
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
    } else if (parseItemId(id) && !parseItemId(id)!.part) {
      /* ⚠️ A block INSIDE a widget (a Contact Us Button, Text or Icon). It lives in its widget's own
         list, so it is removed from that list — this used to fall through to `removed`, which hides
         page bands, so the toast said Removed and the block stayed. A slot left beside nothing takes
         the line back to one column. */
      const { widget, item } = parseItemId(id)!;
      setWidgetCfg((prev) => {
        const cfg = prev[widget] ?? {};
        const key = Object.keys(cfg).find((k) => Array.isArray(cfg[k]) && (cfg[k] as Cfg[]).some((x) => x?.id === item));
        if (!key) return prev;
        const list = cfg[key] as Cfg[];
        const at = list.findIndex((x) => x.id === item);
        const next = list.filter((x) => x.id !== item);
        /* The block that sat BESIDE this one now leads its own line. */
        if (!list[at].beside && next[at]?.beside) next[at] = { ...next[at], beside: false };
        return { ...prev, [widget]: { ...cfg, [key]: next } };
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
    /* ⚠️ The banner's two lines FIRST: 'hero-title' also matches the card pattern below, which wrote the
       heading to `title` — a key the banner never reads — so an inline edit of the heading never showed. */
    if (id === 'hero-title') { patchCfg('hero', { heading: text }); return; }
    if (id === 'hero-subtitle') { patchCfg('hero', { sub: text }); return; }
    const card = /^(.*)-(title|sub)$/.exec(id);
    if (card) { patchCfg(card[1], { [card[2] === 'title' ? 'title' : 'sub']: text }); return; }

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
      /* ⚠️ The SEEDED list, read through `cfgFor`, as the fallback. `setWidgetCfg` sees the RAW
         store, where a widget nobody has edited yet holds nothing at all — so an untouched card's
         first inline edit found no list, mapped over `[]` and wrote one back, deleting every seeded
         item the canvas was showing. Typing in a link emptied the card. */
      const seeded = (cfgFor(owner)[specForNode(owner)?.collection?.key ?? 'items'] as Cfg[]) ?? [];
      setWidgetCfg((prev) => {
        const cfg = prev[owner] ?? {};
        /* ⚠️ The collection's OWN key, read from the widget's spec. It was hard-coded to 'items',
           which is the key List and Accordion happen to use — so an inline edit of any other
           collection (a Custom Card's links, a slider's slides) was written into an `items` array
           that widget does not have, and the words on the canvas snapped back the moment it
           re-rendered. */
        const key = specForNode(owner)?.collection?.key ?? 'items';
        const list = (cfg[key] as Cfg[]) ?? seeded;
        return {
          ...prev,
          [owner]: { ...cfg, [key]: list.map((it, i) => (String(it.id ?? i) === item.item ? { ...it, [item.part ?? 'title']: text } : it)) },
        };
      });
    }
  }, [patchCfg, specForNode, cfgFor]);

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
    const refusedSwap = bannerRefusal(home, type, id);
    if (refusedSwap) { toast.error(refusedSwap); return; }
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
      /* On the banner the replacement takes the replaced item's place in the arrangement. */
      if (home === 'hero') {
        patchCfg('hero', { bannerTree: replaceLeaf(heroTree(), id, made.id) });
        seedBannerItem(made.id, type);
      }
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
  /* ⚠️ The id may ALREADY be the icon's node — a collection item's icon is `<widget>~i<n>~icon`,
     a node in its own right — in which case appending the suffix again makes `~icon-icon`, which is
     nothing, and the selection lands on no node at all. */
  const pickIcon = useCallback((id: string, anchor: DOMRect) => {
    /* An ITEM's icon selects the ITEM. A link is one node carrying a glyph, a label and a
       destination — splitting the glyph off would open a drawer titled "icon" holding the link's
       other two fields, which reads as the panel having lost track of what you clicked. */
    setSelectedId(/~icon$/.test(id) ? id.replace(/~icon$/, '') : /-icon$/.test(id) ? id : `${id}-icon`);
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
    addBannerCell, setBannerSections, heroTree, moveToBanner, dropIntoBanner,
    addSection, addBeside, splitBand, bandHosted, dropBeside, columnsFull, splitNode, setNodeDir, splitInfo, addLinkCard, dropInColumn, dropAtSeam, dropInRow,
    addSibling: addSiblingElement, cfg: cfgFor,
    moveNode, duplicateNode, deleteNode, canDuplicate, addInside, moveTo, moveToSeam, addChildBlock, splitChildBlock, fillChildBlock, areSiblings, replaceElement, pickIcon, applyPreset, placedPredefined, sectionKind,
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
    /* The theme's TINTS — the ID pill, the icon badge, an asset tile and the hairline round a
       tinted block are all tones of the one main colour (see portalTone). ⚠️ Derived from
       `themeAccent`, which already resolves a hand-edited primary, so dragging that colour in the
       panel re-tones the whole page live rather than leaving the old hue painted behind the new. */
    ...toneVars(themeAccent),
    /* ⚠️ The page's ground, handed DOWN rather than only painted here. This wrapper is behind the
       portal, and the portal's own root painted `bg-white` over the whole of it — so the theme's
       page colour and the page IMAGE were both set correctly and both invisible, every time. The
       root reads this variable instead, with white as its fallback for the one call site that
       renders the portal outside a theme (the create dialog's thumbnail).
       ⚠️ `transparent` while an image is set: the picture is on THIS element, so a colour on the
       root would be painted straight over it. */
    '--portal-page-bg': pageImg ? 'transparent' : themeSw[0],
  } as React.CSSProperties;
  /* ⚠️ A confirm, not a toast-with-undo. Applying a layout rewrites the copy, the treatment and
     the widgets in the band at once — too much to describe in a toast and too much to expect
     somebody to notice in time to undo. It only appears when there is authored copy or a widget
     to lose; see `applyBannerLayout`. */
  const layoutConfirm = pendingLayout && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-[440px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">
            Replace the banner with “{bannerLayout(pendingLayout)?.name}”?
          </h2>
          <button
            onClick={() => setPendingLayout(null)}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
          ><X size={18} /></button>
        </div>
        <p className="px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">
          A layout brings its own heading, sub-heading, colours and the cards that sit in the band.
          The words you have written here will be replaced. Everything else on the page is untouched.
        </p>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button
            onClick={() => setPendingLayout(null)}
            className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >Cancel</button>
          <button
            onClick={() => { runBannerLayout(pendingLayout); setPendingLayout(null); }}
            className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3178B8]"
          >Replace banner</button>
        </div>
      </div>
    </div>
  );

  const themeClass = `portal-themed ${theme.mode === 'dark' ? 'portal-dark' : ''}`;

  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
  const divider = <span className="mx-1 h-5 w-px bg-[#E5E7EB]" />;

  // ── preview ───────────────────────────────────────────────────────────────
  if (preview) {
    /* ⚠️ Below the 56px PRODUCT header, exactly where the editor sits — the preview is still inside the
       product, so its header stays on screen instead of being covered by the portal page. */
    return (
      <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9500] flex flex-col bg-[#EEF1F5]">
        {templatePreview ? (
          /* The TEMPLATE preview bar: back to the gallery on the left, the one decision on the right. */
          <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4">
            <button
              onClick={templatePreview.onBack}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]"
            ><ArrowLeft size={17} /> Templates</button>
            <span className="h-5 w-px bg-[#E5E7EB]" />
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[14px] font-semibold text-[#1E293B]">{templatePreview.name === 'Default portal' ? 'Support Portal' : templatePreview.name}</span>
              <span className="flex-shrink-0 rounded-md bg-[#EBF5FF] px-2 py-0.5 text-[11.5px] font-medium text-[#3D8BD0]">Template preview</span>
            </div>
            <button
              onClick={() => { setPreview(false); templatePreview.onUse(); }}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3D8BD0] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-colors hover:bg-[#2F77B8]"
            >Use template <ArrowRight size={15} /></button>
          </div>
        ) : (
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
        )}
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
          {iconPick && (() => {
            /* ⚠️ A collection ITEM's icon lives on the item, inside its widget's config — not in the
               shared `icons` store, which is keyed by widget: six links would have shared one glyph,
               and picking on any of them would have changed all six. Same popover, same picker, a
               different place to put the answer. */
            const it = parseItemId(iconPick.id);
            if (it?.part === 'icon') {
              const key = specForNode(it.widget)?.collection?.key ?? 'items';
              const list = ((cfgFor(it.widget)[key] as Cfg[]) ?? []);
              const idx = list.findIndex((x, i) => String(x.id ?? i) === it.item);
              return (
                <IconPopover
                  value={idx >= 0 ? (list[idx].icon as IconChoice | undefined) : undefined}
                  anchor={iconPick.rect}
                  onPick={(c) => {
                    if (idx >= 0) patchCfg(it.widget, { [key]: list.map((x, i) => (i === idx ? { ...x, icon: c } : x)) });
                    setIconPick(null);
                  }}
                  onClose={() => setIconPick(null)}
                />
              );
            }
            return (
              <IconPopover
                value={icons[iconPick.id]}
                anchor={iconPick.rect}
                onPick={(c) => { setIcons((m) => ({ ...m, [iconPick.id]: c })); setIconPick(null); }}
                onClose={() => setIconPick(null)}
              />
            );
          })()}
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
              <div className="min-h-0 flex-1">
                <SupportPortalAddPanel
                  onAdd={(type, keepOpen) => {
                    addElement(type);
                    /* ⚠️ `keepOpen` is the row's "+". The add still SELECTS what it placed — you
                       want to see what landed, and the canvas outline is how — but the panel goes
                       straight back to the library, because "+" means "another one" and a trip
                       back to Widgets after every single add is exactly what the old bulk-pick
                       mode existed to avoid.
                       ⚠️ This runs AFTER `addElement` in the same batch, so it wins over the
                       `setActive(null)` that `select()` does on the way past. */
                    if (keepOpen) { setActive('add'); setCollapsed(false); }
                  }}
                  placed={placedPredefined}
                />
              </div>
            ) : active === 'theme' ? (
              <div className="flex min-h-0 flex-1 flex-col"><PortalThemePanel theme={theme} onChange={(patch) => setTheme((t) => ({ ...t, ...patch }))} /></div>
            ) : active === 'branding' ? (
              <div className="min-h-0 flex-1"><PortalBrandingPanel /></div>
            ) : active === 'banners' ? (
              <div className="min-h-0 flex-1"><PortalBannersPanel activeId={bannerTemplate(String(widgetCfg.hero?.bannerTemplate ?? '')) ? String(widgetCfg.hero?.bannerTemplate) : null} onApply={applyBannerTemplate} onDefault={restoreDefaultBanner} /></div>
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
                  onApplyBannerLayout={applyBannerLayout}
                  onApplyBannerShape={applyBannerShape}
                  onChangeBanner={() => setBannerStart('edit')}
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
      {layoutConfirm}
      {bannerStart && (
        <BannerStartDialog
          onPick={startBanner}
          onClose={() => setBannerStart(null)}
          /* ⚠️ EDIT is locked to the shape the page is already built around, read from the PAGE
             rather than from a second copy of the answer, so it cannot disagree with what is on
             screen. */
          lockTo={bannerStart === 'edit' ? (widgetCfg.page?.heroPlacement === 'left' ? 'vertical' : 'horizontal') : undefined}
          activeId={bannerStart === 'edit' ? String(widgetCfg.hero?.bannerTemplate ?? '') : undefined}
        />
      )}
    </div>
  );
}
