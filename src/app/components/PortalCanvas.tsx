import { cloneElement, createContext, isValidElement, Children, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById } from './portalWidgetSpec';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical,
  AlignLeft, AlignRight, AlignStartHorizontal, AlignStartVertical, StretchHorizontal, StretchVertical, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUp, Baseline, Bold, Check, ChevronDown, ChevronRight, Columns2, Copy, GripHorizontal, GripVertical, Italic, Link2, Rows2,
  Braces, Highlighter, Maximize2, UnfoldVertical, Move, MoveHorizontal, MoveVertical, Plus, RemoveFormatting,
  PaintBucket, Replace, SquareDashed, Trash2, Underline, X, ImagePlus, Palette, LayoutDashboard, Columns3,
} from 'lucide-react';
import { BannerFillEditor, BannerPresetPicker, TilePresetPicker } from './PortalBannerTools';
import { bannerBoxId, flipRoot, groupOf, presetsFor } from './portalBannerLayout';
import type { BannerNode } from './portalBannerLayout';
import { BANNER_GROUPS, bannerGroupGap } from './portalPageModel';
// ArrowLeft stays in use by the card toolbar's "Move left".
import { toast } from 'sonner';
import { fillsFromConfig, HEADING_SIZE, PORTAL_FONTS, SECTION_LAYOUTS, SPLITTABLE_BANDS, TEXT_STYLES, ZERO_BOX, COMPOSABLE, BANNER_BLOCKS, inBanner, dragIdOf, isContactChild, isServiceTile, boxInfo, canAddBeside, defaultAlignH, nodeById, paintsOwnShadow, paintsOwnSurface, toolbarCaps, nodePath, placedIn, placedType } from './portalPageModel';
import { DEFAULT_THEME } from './PortalThemePanel';
import type { PortalTheme } from './PortalThemePanel';
import { boxCss, containerCss } from './portalStyleResolver';
import { PORTAL_ELEMENTS, PORTAL_ELEMENT_GROUPS, isPredefinedElement, isPredefinedType } from './supportPortalData';
import type { PortalElement } from './supportPortalData';
import { elementIcon } from './SupportPortalAddPanel';
import { PortalColorPicker } from './PortalColorPicker';
import type { BoxDir, NodeStyle, PortalStyles, SpacingBox } from './portalPageModel';

/* Canvas selection layer.
 *
 * Selection is explicit — every selectable thing wraps itself in <Sel id="…"> and the registry in
 * portalPageModel says what it is. Clicking stops propagation, so the innermost wrapper wins and
 * the chip's ❯ steps back up; that is the whole "blocks + their key children" model.
 *
 * The floating toolbar is KIND-AWARE, the way Duda's is: a section gets ↓↑ because that is the axis
 * it can move on, a card gets ←→, and text swaps the light bar for the dark rich-text one. Showing
 * a section the same buttons as a paragraph would be quicker to build and wrong. */

interface CanvasCtx {
  /** False in Preview, where the page must behave like the real portal. */
  enabled: boolean;
  selectedId: string | null;
  hoverId: string | null;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  /** Adds a section with `layout` after the block at `afterId`. */
  addSection: (afterId: string, rows: number[][]) => void;
  /** Splits a column, keeping every column in that row equal width. */
  addBeside: (boxId: string, side: 'left' | 'right' | 'top' | 'bottom') => void;
  /** Is the row holding this box already at its column cap? Suppresses the edge zones. */
  columnsFull: (boxId: string) => boolean;
  /** The blue line's drop: make the box it promised and put the element in it. */
  dropBeside: (
    boxId: string,
    payload: { type: string } | { move: string },
    side: 'left' | 'right' | 'above' | 'below',
  ) => void;
  /** Drops a catalogue element into a column. */
  dropInColumn: (columnId: string, elementType: string) => void;
  /** Drops onto a seam — builds a new one-column section there and puts the element in it. */
  dropAtSeam: (afterId: string, elementType: string) => void;
  /** Moves an element ALREADY on the page onto a seam, into a new section of its own. */
  moveToSeam: (id: string, afterId: string) => void;
  /** Adds one of a container's own block types inside it — the card's "Extra content" list. */
  addChildBlock: (id: string, type: string) => void;
  /** Contact Us: put an empty slot beside this block on the same line. */
  splitChildBlock?: (id: string) => void;
  /** Contact Us: turn an empty slot into a Button, Text or Icon. */
  fillChildBlock?: (id: string, type: string) => void;
  /** The Quick Actions row's one addable card — see `toolbarCaps`. */
  addLinkCard?: () => void;
  /** The first split of a BUILT-IN band — see `splitBand` in the builder. */
  splitBand?: (bandId: string, side: 'left' | 'right' | 'top' | 'bottom') => void;
  /** True once a band lives inside a hosting section, so its box owns the adders instead. */
  bandHosted?: (bandId: string) => boolean;
  /** ⚠️ The seam the first-run tour is pointing at, held open while its card is on screen. A seam
   *  is a hover affordance — it is 12px of nothing until the pointer finds it — so the one step
   *  that exists to say "this is here" would otherwise spotlight an empty gap. */
  tourSeam?: string | null;
  /** Drops into a built-in row, alongside the cards already there. */
  dropInRow: (rowId: string, elementType: string) => void;
  /** The banner: put an empty cell beside one of its items (left/right = a column, top/bottom = a row). */
  addBannerCell?: (anchorId: string, side: 'left' | 'right' | 'top' | 'bottom') => void;
  /** The banner's arrangement as drawn — its item tree, repaired against what is on it. */
  heroTree?: () => BannerNode | null;
  /** Catalogue ids of the PREDEFINED widgets the page is already carrying — one instance each, so
   *  the Add and Replace pickers must not offer them a second time. */
  placedPredefined?: Set<string>;
  /** What a section is already committed to — see `sectionKind` in the builder. */
  sectionKind?: (id: string) => 'empty' | 'predefined' | 'other';
  /** Moves something already on the page onto the banner: into an empty slot, beside/swapped with an item, or onto the banner itself. */
  moveToBanner?: (sourceId: string, anchorId: string, side?: 'left' | 'right' | 'top' | 'bottom') => void;
  /** Drops a NEW element from the library onto the banner, at the same kinds of anchor. */
  dropIntoBanner?: (elementType: string, anchorId: string, side?: 'left' | 'right' | 'top' | 'bottom') => void;
  /* ── toolbar actions ── */
  moveNode: (id: string, dir: 'prev' | 'next') => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  /** True when this node has an identity that can be cloned. */
  canDuplicate: (id: string) => boolean;
  addInside: (id: string, elementType?: string) => void;
  /** Opens the icon grid against a node, on the canvas — the inline half of the icon field. */
  pickIcon: (id: string, anchor: DOMRect) => void;
  /** Swaps a placed element for a different kind, in the same spot. */
  replaceElement: (id: string, elementType: string) => void;
  /** Toggles the banner's background onto the page — the toolbar half of the panel's toggle. */
  /** Drops `sourceId` at `targetId`'s position — the grip's drag-to-reorder. */
  moveTo: (sourceId: string, targetId: string) => void;
  /** True when the two ids sit in the same list, so a drop between them is meaningful. */
  areSiblings: (a: string, b: string) => boolean;
  /** Writes a text node's words back to whichever store owns them — the inline-edit path. */
  setText: (id: string, text: string) => void;
  /* Writes a widget's CONFIG from the canvas — the inline half of a panel field.
     ⚠️ Mirrors `setText` deliberately. An element that can be filled in place needs to write the
     same key its drawer writes, or the canvas and the panel end up owning different copies of one
     value; routing both through the builder's `patchCfg` is what keeps them the same value. */
  setCfg: (id: string, patch: Record<string, unknown>) => void;
  /* Reads a widget's resolved config — the toolbar's button-style menu needs to show what is set,
     and a control that cannot read its own value can only ever guess which option to light. */
  cfg?: (id: string) => Record<string, unknown>;
  /** Adds one of the six in the slot beside an element. */
  addSibling?: (elementId: string, type: string) => void;
  /* The live theme. ⚠️ Only the text toolbar's font picker reads it, and it reads it to NAME the two
     faces rather than to apply them — the faces themselves are applied as CSS variables set on the
     canvas wrapper, so a themed block re-renders on a theme change without anything re-reading
     this. Passing the theme down is what keeps the dropdown's labels from going stale. */
  theme: PortalTheme;
}

/* The canvas with everything switched off — selection, drag, every mutation a no-op.
 *
 * ⚠️ EXPORTED, and it is the whole read-only rendering mode. `SupportPortalPreview` reads per-node
 * STYLE off this context rather than from a prop, so anything that renders the portal outside the
 * builder — Preview, the template showcase — has to supply a context or every seeded `columns`,
 * fill and radius silently resolves to nothing. Spread it and override `styles` + `theme`:
 * the no-ops are what make "read-only" mean read-only rather than thirty hand-written stubs that
 * drift the next time `CanvasCtx` grows a member. */
export const READONLY_CANVAS: CanvasCtx = {
  enabled: false, selectedId: null, hoverId: null,
  select: () => {}, setHover: () => {}, styles: {}, setStyle: () => {}, setText: () => {}, setCfg: () => {},
  addSection: () => {}, addBeside: () => {}, dropBeside: () => {}, columnsFull: () => false, dropInColumn: () => {}, dropAtSeam: () => {}, dropInRow: () => {}, moveToSeam: () => {}, addChildBlock: () => {},
  moveNode: () => {}, duplicateNode: () => {}, deleteNode: () => {}, canDuplicate: () => false, addInside: () => {},
  moveTo: () => {}, areSiblings: () => false, replaceElement: () => {}, pickIcon: () => {},
  theme: DEFAULT_THEME,
};

const Ctx = createContext<CanvasCtx>(READONLY_CANVAS);

/** Reads a dragged catalogue element off a drop event, or null when it isn't one of ours. */
export const draggedElement = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-element') || null;
/** Reads a node being dragged by its grip. Same caveat: only readable on `drop`. */
export const draggedNode = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-move') || null;
export const MOVE_MIME = 'text/portal-move';

/* ⚠️ While ANYTHING is being dragged, the floating toolbars step aside. A selected element's toolbar
   sits over whatever is above it, so a drag started from that toolbar's own grip had its drop target
   covered by the toolbar itself — the line never appeared and the drop landed on nothing. The body
   flag is set by the document-level dragstart (after the element has written its payload) and cleared
   on dragend or drop; the rule at the foot of theme.css answers it. */
/* ⚠️ CAPTURE phase, and for every drag. Cells stop dragstart from bubbling (so a nested grip is not
   re-claimed by its ancestors), which meant a bubbling listener never heard a drag start at all; and
   at capture time the payload has not been written yet, so there is nothing to test — a drag anywhere
   on this page is a drag the toolbars should get out of the way of. v2 key: a listener installed by an
   earlier build of this module must not block this one. */
if (typeof document !== 'undefined' && !(window as unknown as { __portalDragFlag3?: boolean }).__portalDragFlag3) {
  (window as unknown as { __portalDragFlag3?: boolean }).__portalDragFlag3 = true;
  const clear = () => { delete document.body.dataset.portalDragging; };
  /* A tick LATER: changing the drag source's own styles inside dragstart makes Chrome cancel the drag. */
  document.addEventListener('dragstart', () => { window.setTimeout(() => { document.body.dataset.portalDragging = '1'; }, 0); }, true);
  document.addEventListener('dragend', clear, true);
  document.addEventListener('drop', () => window.setTimeout(clear, 0), true);
}

export const CanvasProvider = Ctx.Provider;
export const useCanvas = () => useContext(Ctx);

/* Style for a node, as inline CSS the preview spreads onto its element.
 *
 * ⚠️ RESOLVED, not own-only: a value set on a section now paints on every descendant that has not
 * overridden it, which is the §1.1 inheritance model. `containerCss` skips anything whose nearest
 * source is the theme, so the page's resting look still comes from its Tailwind classes and only
 * deliberate edits paint. See the note in portalStyleResolver.
 *
 * Vertical padding is px and horizontal is %, the units the spacing matrix edits in. Margin is
 * applied by sizeOf() on the WRAPPER; only padding belongs on the painted element. A dragged height
 * is a FLOOR (minHeight), never a fixed height, so content is never clipped. */
export function styleOf(styles: PortalStyles, id: string): React.CSSProperties {
  return containerCss(styles, id);
}

/* Size lives on the SELECTION WRAPPER, not on the painted element inside it.
 *
 * Two reasons. The outline and handles are drawn on the wrapper, so with the size on the child the
 * box you see and the box you drag drift apart. And a dragged height is a FLOOR, not a fixed
 * height — `minHeight` lets an element grow when its content needs more room, so resizing never
 * clips or squashes what is inside it. `maxWidth: 100%` keeps a resized card inside its grid cell
 * instead of bursting out of the layout. */
export function sizeOf(styles: PortalStyles, id: string): React.CSSProperties {
  /* P2's outer spacing and width share resolve through the chain; the drag-set values below are
     deliberately OWN-only — a px width dragged on one card is about that card, and inheriting it
     would resize every sibling that had never been touched. */
  const css: React.CSSProperties = { ...boxCss(styles, id) };
  const s = styles[id];
  if (!s) return css;
  /* A row member takes a SHARE, not a width: every sibling carries one, so the row always adds up
     to 100% and stays aligned however you drag. A standalone element still takes a plain width. */
  if (s.flex !== undefined) css.flex = `${s.flex} 1 0%`;
  /* ⚠️ A dragged width is a PERCENTAGE OF THE PARENT, not a pixel count.
     Three things were wrong with px. It could only ever shrink — `maxWidth: 100%` capped growth at
     the element's own current box, so dragging outward past the content did nothing and the handle
     read as broken. It did not respond: a width fixed in pixels stayed put when its section, its
     column or the panel beside it changed size, so a layout built at one width fell apart at
     another. And it let a small element ask for more room than its parent had. A share of the parent
     fixes all three at once: 100% is the parent's full width and is reachable by dragging, and every
     value in between stays true when the parent moves. */
  else if (s.widthPct !== undefined) { css.width = `${s.widthPct}%`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  else if (s.width !== undefined) { css.width = `${s.width}px`; css.maxWidth = '100%'; css.flex = '0 0 auto'; }
  /* ⚠️ HEIGHT, not min-height, and the overflow is hidden with it. As a floor, dragging the bottom
     edge of a five-row list did nothing visible — the content already exceeded the number you were
     setting, so the box kept its content height and the handle felt broken. A widget given a height
     shows what fits in it and crops the rest, which is the whole point of dragging the edge: you are
     deciding how much of a long list this part of the page gets to spend. */
  if (s.height !== undefined) {
    /* ⚠️ The wrapper becomes a flex COLUMN when it takes a height. Its child card carries `h-full`,
       and a percentage height inside a plain block resolves against the wrong box — the card came
       out 664px inside a 386px wrapper, so the visible 386px was the card's empty lower half and the
       list appeared to vanish. As a flex column the child fills exactly the height that was set, and
       the clip lands where the handle was dropped. */
    css.height = `${s.height}px`;
    /* ⚠️ NO `overflow: hidden` here. The selection chrome — the floating toolbar at `-top-11`, the
       handles at `-3px` — are children of this same wrapper, so clipping it clipped THEM: the moment
       a widget had a dragged height its toolbar vanished and its handles were squeezed inside the
       card. The clip belongs to the content alone, and `Sel` puts it on an inner box (see `clipped`
       below) that the chrome sits outside of. */
    css.display = 'flex';
    css.flexDirection = 'column';
  }
  /* ⚠️ Alignment is applied to the element as a flex ITEM, not to its children. "Align this card
     bottom" is a statement about where the card sits in the row, and `alignSelf` is the only
     property that says it — text-align inside the card would move the words instead. */
  /* ⚠️ Except where the alignment is about what is INSIDE: a service tile, a Contact Us block and a
     KPI read their own align/alignY and place their content with it — moving the wrapper as well
     would shrink a tile out of its grid cell. */
  /* A widget on the BANNER is placed by its cell (see the arranged banner), so its alignment is not applied to itself. */
  const alignsInside = /-tile$/.test(id) || isContactChild(id) || placedType(id) === 'c-records' || (/^el-\d+$/.test(id) && nodeById(id)?.parent === 'hero');
  if (s.alignY !== undefined && !alignsInside) {
    css.alignSelf = ({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const)[s.alignY];
  }
  if (s.align === 'stretch' && !alignsInside) { css.flexGrow = 1; css.width = '100%'; }
  if (s.margin) {
    /* ⚠️ Per side, and only where set — an unset side must not emit 0 and beat the class. */
    if (s.margin.top !== undefined) css.marginTop = `${s.margin.top}px`;
    if (s.margin.bottom !== undefined) css.marginBottom = `${s.margin.bottom}px`;
    if (s.margin.left !== undefined) css.marginLeft = `${s.margin.left}%`;
    if (s.margin.right !== undefined) css.marginRight = `${s.margin.right}%`;
  }
  return css;
}

/* ── INLINE text formatting ─────────────────────────────────────────────────
 *
 * A text node is edited in two modes. Selecting it selects the FRAME (the element toolbar, or the text
 * toolbar acting on the whole node); clicking into the words starts EDITING, and then the text toolbar's
 * bold / italic / underline / colour / highlight / font / size apply to the SELECTED WORDS only.
 * ⚠️ The selection is SAVED on every change, because pressing a toolbar control — a select, a colour
 * spectrum — moves focus out of the words and the browser drops the selection with it. It is restored
 * into the words before each command. */
const INLINE_RANGES: Record<string, Range> = {};
/** True while the pointer went down on a toolbar or a popover it opened — that blur is not "done editing". */
let toolbarPointer = false;
if (typeof document !== 'undefined' && !(window as unknown as { __portalInlineWatch?: boolean }).__portalInlineWatch) {
  (window as unknown as { __portalInlineWatch?: boolean }).__portalInlineWatch = true;
  document.addEventListener('selectionchange', () => {
    const s = window.getSelection();
    if (!s || !s.rangeCount) return;
    const host = (s.anchorNode instanceof Element ? s.anchorNode : s.anchorNode?.parentElement)?.closest?.('[data-inline-edit]') as HTMLElement | null;
    if (host) INLINE_RANGES[host.dataset.inlineEdit!] = s.getRangeAt(0).cloneRange();
  });
  document.addEventListener('mousedown', (e) => {
    const t = e.target as Element | null;
    toolbarPointer = !!t?.closest?.('[data-portal-toolbar],[data-portal-popover]');
  }, true);
}
/** The words are selected (not just a caret) inside this node's editor. */
const hasInlineSelection = (id: string) => {
  const r = INLINE_RANGES[id];
  return !!r && !r.collapsed && !!document.querySelector(`[data-inline-edit="${id}"]`)?.contains(r.commonAncestorContainer);
};
/** Runs a formatting command on the saved word selection. False when there is none — the caller then styles the whole node. */
function applyInline(id: string, run: (host: HTMLElement) => void): boolean {
  const host = document.querySelector(`[data-inline-edit="${id}"]`) as HTMLElement | null;
  if (!host || !hasInlineSelection(id)) return false;
  host.focus();
  const s = window.getSelection();
  s?.removeAllRanges();
  s?.addRange(INLINE_RANGES[id]);
  document.execCommand('styleWithCSS', false, 'true');
  run(host);
  if (s && s.rangeCount) INLINE_RANGES[id] = s.getRangeAt(0).cloneRange();
  return true;
}
/** Wraps the selection in a span carrying one CSS property (font size / family have no execCommand of their own that writes CSS). */
const wrapInline = (host: HTMLElement, prop: 'fontSize' | 'fontFamily', value: string) => {
  document.execCommand('fontSize', false, '7');
  host.querySelectorAll('font[size="7"], span[style*="xxx-large"]').forEach((f) => {
    const span = document.createElement('span');
    span.style[prop] = value;
    if (f instanceof HTMLElement && f.tagName === 'SPAN') { f.style.fontSize = ''; f.style[prop] = value; return; }
    span.innerHTML = f.innerHTML;
    f.replaceWith(span);
  });
};
/* Stored words that carry inline markup render AS markup. Anything else stays a plain string. */
const INLINE_MARKUP = /<(span|b|i|u|strong|em|font)\b/i;
function richify(n: ReactNode): ReactNode {
  return Children.map(n, (c) => {
    if (typeof c === 'string' && INLINE_MARKUP.test(c)) return <span dangerouslySetInnerHTML={{ __html: c }} />;
    if (isValidElement(c) && typeof c.type === 'string' && (c.props as { children?: ReactNode }).children !== undefined) {
      return cloneElement(c, undefined, richify((c.props as { children?: ReactNode }).children));
    }
    return c;
  });
}

/* ── toolbars ────────────────────────────────────────────────────────────── */

const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
/** How far an element may ride up over the one above it. */
const MAX_OVERLAP = 120;

const btnOn = 'flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]';
/* A cap, not an absence: the button stays where it was and carries the reason on hover. */
const btnOff = 'flex size-7 cursor-not-allowed items-center justify-center rounded text-[#C3CBD6]';
/** The hairline that groups a toolbar — see the note at the LOOK group. */
const Rule = () => <span className="mx-0.5 h-4 w-px flex-shrink-0 bg-[#E5E7EB]" />;

/* One axis of alignment: a button showing what is set, and a popup of the four ways to set it.
   ⚠️ The trigger shows the CURRENT option's glyph, not a generic "align" symbol. A fixed icon would
   make the bar say only "alignment lives here", where this one answers "and it is currently left". */
function AlignAxis({ axis, value, options, open, onToggle, onPick }: {
  axis: 'h' | 'v';
  value: string;
  options: [string, string, ReactNode][];
  open: boolean;
  onToggle: () => void;
  onPick: (v: string) => void;
}) {
  const current = options.find(([v]) => v === value) ?? options[0];
  return (
    <div className="relative">
      <button
        className={open ? btnOn : btn}
        /* data-tip, like every other action on this bar — the alignment control sits IN the toolbar,
           so a slower tooltip here would make one glyph in the row behave unlike its neighbours. */
        data-tip={`${axis === 'h' ? 'Horizontal' : 'Vertical'} alignment — ${current[1].toLowerCase()}`}
        onClick={onToggle}
      >{current[2]}</button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={onToggle} />
          {/* Below the bar, so the options never cover the element you are aligning. */}
          <div className="absolute left-1/2 top-[calc(100%+6px)] z-[61] flex -translate-x-1/2 items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]">
            {options.map(([v, label, ic]) => (
              <button
                key={v}
                className={value === v ? btnOn : btn}
                data-tip={label}
                onClick={() => onPick(v)}
              >{ic}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* The element library, on the canvas.
 *
 * ⚠️ Same catalogue as the Add panel, deliberately — two lists of "everything you can put on a page"
 * would drift the first time one gained an element. Components already on the page are disabled
 * here for the same reason they are there: no portal has two "My Requests".  */
/** A container's own child block types, read from the widget spec its panel is built from. */
function childTypesOf(id: string): { type: string; label: string }[] | undefined {
  const type = placedType(id);
  const specId = (type && WIDGET_FOR_TYPE[type]) || WIDGET_FOR_NODE[id];
  return specId ? specById(specId)?.collection?.childTypes : undefined;
}

function ElementPicker({ mode, onPick, onClose, only, allow, anchorRef, targetId }: {
  mode: 'add' | 'replace'; onPick: (type: string) => void; onClose: () => void;
  /** A container's own block types. When present this IS the list — see the note below. */
  only?: { type: string; label: string }[];
  /* Which catalogue elements this picker may offer.
   *
   * ⚠️ A PREDICATE over the grouped list, not a flat `only` array. The grouped branch is the page's
   * picker — search, group headings, thirty-odd elements — and handing it a flat list would trade
   * all of that for a scroll of unlabelled rows. What changes here is WHAT IS IN the groups, never
   * how they are drawn. */
  allow?: (e: PortalElement) => boolean;
  /** The "+" button's wrapper — where the list is anchored FROM. */
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** The node the toolbar belongs to — what the list must not COVER.
      ⚠️ Passed as an id and looked up, NOT found with `closest` from the button: the toolbar is
      not rendered inside the element's own `[data-node]` wrapper, so the walk finds nothing and
      the list silently anchors to the 28px button instead — which lands it back on top of the
      section, exactly the fault this placement exists to fix. */
  targetId: string;
}) {
  const [q, setQ] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const width = only?.length ? 200 : 260;
  const maxH = 340;

  /* ⚠️ Placed against the VIEWPORT and portalled to the body. As an absolutely-positioned child of
     the toolbar it was trapped inside the canvas's own scroll box, so opening one near the foot of
     the page cut the list off at the bottom edge with no way to reach the rest of it — the same
     clipping trap the listing kebab and the table's column menus already carry notes about. */
  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      const box = boxRef.current;
      if (!anchor || !box) return;
      const GAP = 8;
      const EDGE = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const btn = anchor.getBoundingClientRect();
      /* The thing the new widget is going INTO, and therefore the thing to stay clear of.
         ⚠️ The SELECTED node, not its parent section. Clearing the whole section pushed the list
         out past the canvas and onto the design panel — technically clear of the target and so
         far from it that it read as belonging to something else. Beside the sibling column is
         near, and the sibling is not what you are filling. */
      const node = document.querySelector(`[data-node="${targetId}"]`) as HTMLElement | null;
      const el = node?.getBoundingClientRect() ?? btn;
      const w = box.offsetWidth || width;
      const h = Math.min(box.offsetHeight || maxH, Math.min(maxH, vh - EDGE * 2));
      /* Under the "+" and clamped, which is what stops the bottom being cut off. */
      const left = Math.max(EDGE, Math.min(btn.left + btn.width / 2 - w / 2, vw - w - EDGE));
      /* ⚠️ ABOVE FIRST. The toolbar sits above the element, so the space over it is the closest
         place the list can go that is still clear of what you are filling — it opens right beside
         the "+" that was pressed. Preferring a side instead was correct and felt wrong: on a wide
         section the only side with room is past the canvas edge, so the list appeared over the
         design panel, a long way from the thing it was adding to.
         ⚠️ Cleared of the TOOLBAR, not just the element — `btn.top` is above `el.top`, and landing
         on the bar you just clicked hides the control that opened it. */
      /* ⚠️ A toolbar that sits INSIDE its element anchors to the BUTTON, and opens BELOW it.
         The banner's bar is drawn just inside the band's top edge (`toolbarBelow`), so the element
         surrounds the "+" and "clear of what you are filling" cannot be satisfied at all — the rule
         below resolved it by dropping past the band's BOTTOM, which on a 540px banner put the list
         half a screen from the button that opened it. Where covering is unavoidable, nearness is
         what is left: directly under the "+", which is also where a menu is expected. */
      const inside = btn.top >= el.top - 1 && btn.bottom <= el.bottom + 1;
      if (inside) {
        if (vh - btn.bottom - GAP - EDGE >= h) { setPos({ left, top: btn.bottom + GAP }); return; }
        if (btn.top - GAP - EDGE >= h) { setPos({ left, top: btn.top - GAP - h }); return; }
        setPos({ left, top: Math.max(EDGE, Math.min(btn.bottom + GAP, vh - h - EDGE)) });
        return;
      }
      const overhead = Math.min(el.top, btn.top);
      if (overhead - GAP - EDGE >= h) { setPos({ left, top: overhead - GAP - h }); return; }
      if (vh - el.bottom - GAP - EDGE >= h) { setPos({ left, top: el.bottom + GAP }); return; }
      /* No room over or under it — a tall element. Now a side, level with the toolbar. */
      const top = Math.max(EDGE, Math.min(btn.top, vh - h - EDGE));
      if (vw - el.right - GAP - EDGE >= w) { setPos({ left: el.right + GAP, top }); return; }
      if (el.left - GAP - EDGE >= w) { setPos({ left: el.left - GAP - w, top }); return; }
      /* Taller than every gap around it. Nothing can avoid the element now, so only the clamp
         matters — being readable beats being polite. */
      setPos({ left, top: Math.max(EDGE, Math.min(btn.bottom + GAP, vh - h - EDGE)) });
    };
    place();
    /* The canvas scrolls under it, and the design panel resizes beside it. */
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [q, only, anchorRef, width, targetId]);

  const groups = PORTAL_ELEMENT_GROUPS.map((g) => ({
    group: g,
    /* ⚠️ `!e.hidden` was MISSING here, so every withheld element — Spacer, Advanced Tabs, Action
       Card, KPI — was reachable from the canvas toolbar while the Widgets panel refused it. Two
       pickers over one catalogue disagreeing about what exists is worse than either answer. */
    items: PORTAL_ELEMENTS.filter((e) => e.group === g && !e.onPage && !e.hidden
      && (!allow || allow(e))
      && (!q || `${e.name} ${e.keywords ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
  })).filter((g) => g.items.length);

  return createPortal(
    <>
      {/* Clicking anywhere else closes it — a popover that only closes from its own ✕ is a modal
          pretending not to be one. */}
      <span className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          left: pos?.left ?? 0,
          top: pos?.top ?? 0,
          width,
          maxHeight: maxH,
          /* ⚠️ Hidden rather than unmounted for the first paint: the placement needs the box's real
             height, and a list rendered at 0,0 for one frame is a flash in the corner. */
          visibility: pos ? 'visible' : 'hidden',
        }}
        className={`fixed z-[9999] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)] ${only?.length ? 'p-1.5' : 'py-1'}`}
      >
        {only?.length ? (
          <>
            {/* ⚠️ No search. Three options do not need one, and a search box over three rows is a
                control that costs a line to say nothing. */}
            {/* ⚠️ The flat list obeys `allow` too. It is the BANNER's list, and a predefined widget
                is one to a page wherever it is offered from — Announcements and Contact Us are Data,
                so once one is on the banner the row has to go, exactly as it does on the page. */}
            {/* ⚠️ Each element's OWN icon, in the same badge the full library draws — every row used
                to carry the same grey "+", so seven widgets read as seven copies of one thing and the
                glyph said "add", which the whole popup already says. One catalogue, one picture per
                element, whichever list you meet it in.
                A container's child types are not catalogue elements, so those keep the "+". */}
            {only.filter((ct) => {
              const def = PORTAL_ELEMENTS.find((e) => e.id === ct.type);
              /* A container's child types are not catalogue elements — nothing to withhold. */
              return !def || !allow || allow(def);
            }).map((ct) => {
              const def = PORTAL_ELEMENTS.find((e) => e.id === ct.type);
              return (
                <button
                  key={ct.type}
                  onClick={() => onPick(ct.type)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                >
                  <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#64748B]">
                    {def ? elementIcon(def.icon) : <Plus size={13} className="text-[#9CA3AF]" />}
                  </span>
                  <span className="truncate">{ct.label}</span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-white px-2 pb-1.5 pt-1">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={mode === 'replace' ? 'Replace with…' : 'Search elements'}
                className="h-8 w-full rounded border border-[#DFE5ED] px-2.5 text-[12px] outline-none focus:border-[#3D8BD0]"
              />
            </div>
            {groups.map(({ group, items }) => (
              <div key={group}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{group}</p>
                {items.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => onPick(el.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F9FD]"
                  >
                    <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#64748B]">
                      {elementIcon(el.icon)}
                    </span>
                    <span className="truncate">{el.name}</span>
                  </button>
                ))}
              </div>
            ))}
            {/* ⚠️ Two different empty states, because they mean two different things. "Nothing
                matches" is about the SEARCH and clears when you delete it; the other is about the
                page — every predefined widget is already on it — and says so, or the admin is left
                looking at a blank box wondering what broke. */}
            {!groups.length && (q
              ? <p className="px-3 py-4 text-center text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>
              : <p className="px-3 py-4 text-center text-[12px] leading-[1.5] text-[#9CA3AF]">Every widget of this kind is already on the page.</p>
            )}
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

/* Light toolbar for everything that isn't text. Icons only: Content and Style both live in the
   right panel, so a "Design" pill here would be a second door to a room you are already in.
   Every button does the thing it says — nothing here is a placeholder. */
/** The drag props a toolbar grip needs. Shared, so the light and dark bars cannot drift apart. */
function useNodeDragHandle(id: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      /* `dragIdOf`: the banner's heading, subheading and search move their BLOCK, not the text node. */
      e.dataTransfer.setData(MOVE_MIME, dragIdOf(id));
      e.dataTransfer.effectAllowed = 'move';
    },
  };
}

/* Where this element sits among its siblings, measured off the page rather than inferred.
 *
 * ⚠️ MEASURED, because the declared kind was getting it wrong. Every box reports kind 'column', and
 * the fallback treated 'card' and 'column' as horizontal — so the Favourite Services BAND, which is
 * the full width of the page with nothing beside it, offered Move left / Move right, and so did the
 * Contact Us card stacked in the right-hand rail. Both were wrong about the page in front of you.
 * A sibling that overlaps this element vertically IS beside it; that is what "horizontal" means and
 * it needs no lookup table to stay true as the layout changes.
 *
 * ⚠️ The EDGES are measured too, not counted from the model. Built-in rows are ordered with CSS
 * `order`, so a card's index in `rowOrder` is not where it appears — the first card on screen can
 * be the third in the array. Position is the only reading that matches what an admin is looking at
 * when they press Move left. */
function useSiblingSpan(id: string, open: boolean) {
  const [span, setSpan] = useState<{ horizontal: boolean | null; first: boolean; last: boolean; alone: boolean }>(
    { horizontal: null, first: false, last: false, alone: false },
  );
  useLayoutEffect(() => {
    if (!open) return;
    const self = document.querySelector(`[data-node="${id}"]`) as HTMLElement | null;
    /* ⚠️ A PLACED element is measured by its BOX, not by itself. Each dropped widget sits alone
       inside its own `sec-N-bM`, so at the DOM level it never has a sibling however many widgets
       are beside it on screen — the neighbours are the boxes. Measuring the element found nothing
       next to it and hid the move arrows even after a "+" had visibly put a widget alongside.
       Everything else measures itself: a band, a card or a region IS the thing with neighbours. */
    const box = /^el-[0-9]+$/.test(id)
      ? (self?.parentElement?.closest('[data-node]') as HTMLElement | null)
      : null;
    const el = box && /^sec-[0-9]+-b[0-9]+$/.test(box.dataset.node ?? '') ? box : self;
    const parent = el?.parentElement;
    if (!el || !parent) { setSpan({ horizontal: null, first: false, last: false, alone: false }); return; }

    const measure = () => {
      const r = el.getBoundingClientRect();
      /* Only siblings that are DRAWN — a seam, an adder or a zero-size overlay is not something this
         element can be moved past. */
      const sibs = [...parent.children]
        .filter((s) => s !== el)
        .map((s) => s.getBoundingClientRect())
        .filter((q) => q.width > 0 && q.height > 0);
      /* ⚠️ ALONE — a one-column section, or the only child of anything. There is no order to change,
         so the two move buttons are HIDDEN rather than shown disabled. That is the opposite of the
         edge rule beside it, deliberately: at the end of a row there IS a row, and a disabled arrow
         with the reason on it says "this is as far left as it goes". With nothing beside it there is
         no row to be at the end of, and two permanently dead arrows on every single-column section
         are furniture rather than information. */
      if (!sibs.length) { setSpan({ horizontal: null, first: true, last: true, alone: true }); return; }
      const beside = sibs.filter((q) => Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > Math.min(r.height, q.height) * 0.5);
      const horizontal = beside.length > 0;
      const line = horizontal ? beside : sibs;
      setSpan({
        horizontal,
        alone: false,
        first: !line.some((q) => (horizontal ? q.left < r.left - 1 : q.top < r.top - 1)),
        last: !line.some((q) => (horizontal ? q.left > r.left + 1 : q.top > r.top + 1)),
      });
    };

    measure();
    /* ⚠️ RE-MEASURED when the neighbourhood changes, not once on selection. Adding a widget beside a
       lone element gives it a sibling, so the move arrows should appear — but the deps are the id
       and nothing else, and the toolbar re-renders without remounting, so the arrows stayed hidden
       while the "+" had visibly added a neighbour. That reads as the add having failed.
       The observers catch the new sibling AND any reflow that moves this element onto another line,
       which is the other way this answer goes stale. */
    const mo = new MutationObserver(measure);
    mo.observe(parent, { childList: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(parent);
    return () => { mo.disconnect(); ro.disconnect(); };
  }, [id, open]);
  return span;
}

/** A palette element's own name, so the restricted picker says "Accordion" rather than "b-accordion". */
const elementLabel = (type: string) => PORTAL_ELEMENTS.find((e) => e.id === type)?.name ?? type;

/* The button's four styles, on the toolbar.
 *
 * ⚠️ The SAME four the Button's panel offers, read from the same `style` key — not a second set
 * invented here. A toolbar shortcut that wrote a different value, or offered a fifth option the
 * panel had never heard of, would be a second control for one setting and the two would disagree
 * the first time either changed.
 * ⚠️ It shows the CURRENT style as its label rather than a generic word, so the bar answers "what
 * is this button?" without being opened. */
const BUTTON_STYLES: [string, string][] = [
  ['primary', 'Primary'], ['outline', 'Outline'], ['link', 'Link'], ['icon', 'Icon'],
];

/* ⚠️ DRAWN, not borrowed from lucide. The set has no drop-shadow glyph: `Square` is a shape and read
   as one, and the two that do show an offset pair — `Copy` and `SquareStack` — already mean copy in
   this product, one of them on the very same toolbar. A shadow icon has to show the ONE thing a
   shadow is: a shape, and the same shape spread behind it.
   ⚠️ CENTRED, not offset down-right. An offset pair is the drawing `Copy` already owns, so at 15px
   the two were told apart only by a fill — and the icon has to stand for the whole control, where
   three of the four presets differ by how far the shadow spreads rather than by where it falls. An
   even halo on all four sides says "shadow" and says nothing about a direction nobody picks. */
function ShadowGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* ⚠️ The FIGURE is the square, and it has to be the size every other glyph's figure is.
          It was 10 units across inside a 20-unit halo — so the thing your eye reads as the icon was
          42% of the box where lucide's Square is 75%, and the whole glyph looked smaller than its
          neighbours however even the boxes were. The square now matches Square's own 3..21 box, and
          the halo grew past it to stay a halo: the mark reads at full size and the shadow is the
          bleed around it.
          ⚠️ The halo is the one mark here that cannot be a stroke — a shadow is a soft mass, not an
          outline — so it is a filled rect at low opacity. */}
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="currentColor" opacity="0.24" />
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#FFFFFF" stroke="currentColor"
        strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* Border / stroke. ⚠️ A RING, not a plain square. lucide's `Square` is the shape itself and reads as
   one — it said nothing about the edge, which is the only thing this button controls. Drawing the
   outline as a band with real thickness is what a weight, a style and a colour are FOR, and it is
   what tells this apart from the Shadow beside it (a soft halo) and the Radius beside that (one
   corner). Filled with an even-odd knockout so the ring stays crisp at 15px, where a 3px stroke
   would blur. */
function StrokeGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7Zm4-.5h10A1.5 1.5 0 0 1 18.5 8v8a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 16V8A1.5 1.5 0 0 1 7 6.5Z"
      />
    </svg>
  );
}

/* ── The drawn glyphs ──────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ ALL OF THEM ARE ON LUCIDE'S GRID: a 24×24 viewBox, 2px stroke, round caps and joins, no fill.
 * That is the whole of why the bar now looks even. They were drawn on a 16 viewBox, so at the same
 * `size` prop the mark filled nearly the whole box while every lucide icon beside it draws inside
 * 24 with its own ~2px of air — two icons the same nominal size, one visibly bigger and heavier.
 * An icon set is a grid and a stroke weight before it is a set of pictures.
 * ⚠️ This is also why nothing is imported from outside: a glyph from another family, however good,
 * arrives on a different grid at a different weight, which is the problem rather than the fix.
 * Where lucide HAS the icon (Square for Border, PaintBucket for Colour) it is used as-is. */

/* Corner radius. ⚠️ ONE corner, not a rounded square: the control is about how sharp a corner is,
   and a full outline draws three corners that are not the point plus an edge that belongs to
   Border. The bare rounded elbow is what every design tool uses for this. */
function RadiusGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20v-9a7 7 0 0 1 7-7h9" />
    </svg>
  );
}

/* A popup on the bar, sized and chromed like Presets and Shadow so the three read as one family. */
function BarPop({ w = 236, title, children }: { w?: number; title: string; children: ReactNode }) {
  return (
    <div
      className="absolute left-0 top-[calc(100%+6px)] z-[61] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
      style={{ width: w }}
    >
      <p className="mb-2 text-[12px] font-medium text-[#364658]">{title}</p>
      {children}
    </div>
  );
}

const SLIDER = 'h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[#E5E7EB] accent-[#3D8BD0]';

/* ── BORDER, on the toolbar ────────────────────────────────────────────────────────────────────
 *
 * ⚠️ Weight, style and colour behind ONE icon. They are three answers to one question — what the
 * edge of this box looks like — and a box's edge is judged against the page behind it, which is
 * where the canvas is and the sidebar is not.
 * ⚠️ Same two-store routing as the background (`fillsFromConfig`), and the keys happen to be the
 * same on both sides: `borderWidth`, `borderColor`, `borderStyle`. Only the store differs. */
const BORDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

function BorderMenu({ id }: { id: string }) {
  const { styles, setStyle, cfg, setCfg } = useCanvas();
  const [open, setOpen] = useState(false);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<DOMRect | null>(null);
  const viaCfg = fillsFromConfig(id);
  const own = (viaCfg ? cfg?.(id) : styles[id]) ?? {};
  const width = Number(own.borderWidth ?? 0);
  const color = String(own.borderColor ?? '#E5E7EB');
  const stroke = String(own.borderStyle ?? 'solid');
  /* The corner radius is read here ONLY so the no-border line can mention square corners when
     both are zero — the control itself is the next button along. */
  const radius = Number(own.radius ?? 8);
  const write = (patch: Record<string, unknown>) => {
    if (viaCfg) setCfg?.(id, patch);
    else setStyle(id, patch as never);
  };
  return (
    <div className="relative">
      <button className={open ? btnOn : btn} data-tip="Border" onClick={() => setOpen((x) => !x)}>
        <StrokeGlyph />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => { setOpen(false); setAt(null); }} />
          <BarPop title="Border">
            {/* WEIGHT first: at 0 the other two describe nothing, so it is the question that decides
                whether the rest are worth asking. */}
            <p className="mb-1 text-[11px] text-[#7B8FA5]">Weight</p>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="range" min={0} max={8} value={width}
                onChange={(e) => write({ borderWidth: Number(e.target.value) })}
                className={SLIDER}
              />
              <span className="w-9 text-right text-[12px] tabular-nums text-[#364658]">{width}px</span>
            </div>
            {/* ⚠️ Style and colour are REMOVED at weight 0, not disabled — the §2.2 rule this builder
                follows everywhere: absent and greyed mean different things, and a dashed-vs-dotted
                choice over an edge that is not drawn is a control describing nothing.
                ⚠️ A LINE takes their place rather than nothing at all. A popup that shrinks to one
                slider on its own reads as half-loaded; one quiet sentence says the state is a state
                somebody chose. It is the whole of the empty state — no icon, no card, no button —
                because there is nothing to do here except move the slider above it. */}
            {width === 0 && (
              <p className="text-[11.5px] leading-[1.5] text-[#9AA6B6]">
                No border.{radius === 0 ? ' Square corners.' : ''}
              </p>
            )}
            {width > 0 && (
              <>
                <p className="mb-1 text-[11px] text-[#7B8FA5]">Style</p>
                <div className="mb-3 flex gap-1 rounded bg-[#F1F5F9] p-0.5">
                  {BORDER_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => write({ borderStyle: s.value })}
                      className={`flex-1 rounded py-1.5 text-[12px] font-medium transition-colors ${
                        stroke === s.value ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
                      }`}
                    >{s.label}</button>
                  ))}
                </div>
                <p className="mb-1 text-[11px] text-[#7B8FA5]">Colour</p>
                <button
                  ref={swatchRef}
                  onClick={() => setAt(at ? null : swatchRef.current!.getBoundingClientRect())}
                  className="flex h-8 w-full items-center gap-2 rounded border border-[#DFE5ED] px-2 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                >
                  <span className="size-4 flex-shrink-0 rounded-[3px] border border-[#CBD5E1]" style={{ background: color }} />
                  <span className="truncate">{color}</span>
                </button>
              </>
            )}
          </BarPop>
          {at && (
            <PortalColorPicker value={color} anchor={at} onChange={(v) => write({ borderColor: v })} onClose={() => setAt(null)} />
          )}
        </>
      )}
    </div>
  );
}

/* ── CORNER RADIUS, beside it ──────────────────────────────────────────────────────────────────
 * ⚠️ Its OWN icon rather than a fourth row inside Border. A corner is not an edge — you can round a
 * box that has no border at all — and putting it under Border's weight gate would have hidden it
 * exactly when it is the only one of the two that applies. */
function RadiusMenu({ id }: { id: string }) {
  const { styles, setStyle, cfg, setCfg } = useCanvas();
  const [open, setOpen] = useState(false);
  const viaCfg = fillsFromConfig(id);
  const own = (viaCfg ? cfg?.(id) : styles[id]) ?? {};
  const value = Number(own.radius ?? 8);
  const write = (v: number) => (viaCfg ? setCfg?.(id, { radius: v }) : setStyle(id, { radius: v }));
  return (
    <div className="relative">
      <button className={open ? btnOn : btn} data-tip="Corner radius" onClick={() => setOpen((x) => !x)}>
        <RadiusGlyph />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <BarPop w={220} title="Corner radius">
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={32} value={value}
                onChange={(e) => write(Number(e.target.value))}
                className={SLIDER}
              />
              <span className="w-9 text-right text-[12px] tabular-nums text-[#364658]">{value}px</span>
            </div>
          </BarPop>
        </>
      )}
    </div>
  );
}

/* ── The container's BACKGROUND, on the toolbar ────────────────────────────────────────────────
 *
 * ⚠️ It left the sidebar's Style group on all 30 panels that had it. Fill was two tabs — None and
 * Colour — over a colour field, which is three controls for one question, and a background is the
 * one property of a box you pick by looking at it against the page rather than by reading a hex.
 * ⚠️ NO "None" tab. Transparent is a colour like any other now: drag the picker's opacity to 0.
 * A separate None is a second way to express the same value, and the one people reach for by
 * accident when they wanted white.
 * ⚠️ TWO STORES, and which one a node uses is not a detail: sections, the built-in bands and the
 * action cards keep their fill in widget CONFIG (`fill` / `bg`, read by `fillCss`), everything else
 * in the STYLE store (`bgFill` / `bg`, read by `containerCss`). Writing the wrong one saves a value
 * the canvas never looks at — the exact fault `fillCss` was written to fix. */
function ColorMenu({ id }: { id: string }) {
  const { styles, setStyle, cfg, setCfg } = useCanvas();
  const ref = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<DOMRect | null>(null);
  const viaCfg = fillsFromConfig(id);
  /* One bag, read by key. The two stores have different TYPES but the same shape here, and a union
     of them types every read as "not on one of these" — `Record` says what is actually true: this
     reads keys out of whichever store owns this node. */
  const own = (viaCfg ? cfg?.(id) : styles[id]) as Record<string, unknown> | undefined ?? {};
  const filled = viaCfg ? own.fill === 'color' : own.bgFill === 'color';
  /* ⚠️ An UNFILLED container opens the picker on opaque white, not on transparent. The picker keeps
     the alpha of the value it was handed, so opening on `rgba(255,255,255,0)` meant the first colour
     anybody chose came out invisible — a hex typed in, a swatch pressed, and nothing on the canvas.
     "No fill" is said by the chequered swatch on the button; the picker is where you pick a colour,
     and transparency is reached by dragging its opacity down from something you can see. */
  const value = filled ? String(own.bg ?? '#FFFFFF') : '#FFFFFF';
  const write = (v: string) => {
    if (viaCfg) setCfg?.(id, { fill: 'color', bg: v });
    else setStyle(id, { bgFill: 'color', bg: v });
  };
  return (
    <>
      <button
        ref={ref}
        className={at ? btnOn : btn}
        data-tip="Background colour"
        onClick={() => setAt(at ? null : ref.current!.getBoundingClientRect())}
      >
        {/* ⚠️ ONE glyph, no swatch bar under it. The stacked pair was two rows inside a size-7
            button, which read taller than every single glyph beside it — half of why the bar looked
            uneven. A paint bucket is the SaaS convention for "fill this with a colour" and says what
            the button does rather than what the value currently is; the value is in the picker, one
            click away, where it can also be changed. */}
        <PaintBucket size={15} />
      </button>
      {at && (
        <PortalColorPicker value={value} anchor={at} onChange={write} onClose={() => setAt(null)} />
      )}
    </>
  );
}

/* ── SHADOW, as four presets ───────────────────────────────────────────────────────────────────
 *
 * ⚠️ PRESETS, not the four controls the panel had. A shadow is chosen by looking at the block
 * against the page behind it, and "outer, #0F172A at 12%, bottom" is a sentence nobody composes —
 * they want it soft, or they want it to lift off the page. None / Soft / Medium / Strong says that
 * in one click and leaves nothing to get wrong.
 * ⚠️ They differ only in the COLOUR's opacity, so `shadowString` is unchanged and no new key had to
 * be stored. A page that already carries a hand-set colour, an inner shadow or an off-centre
 * position still RENDERS it — the presets simply cannot produce one any more.
 * ⚠️ `shadowType: 'outer'` and `shadowPos: 'bottom'` are written EXPLICITLY on every preset, or a
 * block that had once been given an inner shadow would keep it while the tile said "Soft". */
const SHADOW_PRESETS: { key: string; label: string; color: string | null }[] = [
  { key: 'none', label: 'None', color: null },
  { key: 'soft', label: 'Soft', color: 'rgba(16,24,40,0.06)' },
  { key: 'medium', label: 'Medium', color: 'rgba(16,24,40,0.12)' },
  { key: 'strong', label: 'Strong', color: 'rgba(16,24,40,0.20)' },
];

function ShadowMenu({ id }: { id: string }) {
  const { styles, setStyle } = useCanvas();
  const [open, setOpen] = useState(false);
  const own = styles[id] ?? {};
  const current = own.shadowOn !== true
    ? 'none'
    : SHADOW_PRESETS.find((s) => s.color === String(own.shadowColor ?? ''))?.key ?? 'custom';
  const pick = (s: (typeof SHADOW_PRESETS)[number]) => {
    setStyle(id, s.color === null
      ? { shadowOn: false }
      : { shadowOn: true, shadowColor: s.color, shadowType: 'outer', shadowPos: 'bottom' });
    setOpen(false);
  };
  return (
    <div className="relative">
      <button className={open ? btnOn : btn} data-tip="Shadow" onClick={() => setOpen((x) => !x)}>
        <ShadowGlyph />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+6px)] z-[61] w-[236px] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]">
            <p className="mb-2 text-[12px] font-medium text-[#364658]">Shadow</p>
            <div className="flex gap-2">
              {SHADOW_PRESETS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => pick(s)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  {/* The tile IS the effect — a white card on the page's own grey, wearing the
                      shadow it will apply. A swatch of grey would say nothing about a shadow. */}
                  <span
                    className={`flex h-[34px] w-full items-center justify-center rounded border-2 bg-[#F4F6FA] ${
                      current === s.key ? 'border-[#3D8BD0]' : 'border-transparent'
                    }`}
                  >
                    <span
                      className="h-[18px] w-[26px] rounded-[3px] border border-[#E5E7EB] bg-white"
                      style={s.color ? { boxShadow: `0 3px 8px 0 ${s.color}` } : undefined}
                    />
                  </span>
                  <span className={`truncate text-[11px] ${current === s.key ? 'font-medium text-[#3D8BD0]' : 'text-[#64748B]'}`}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ButtonStyleMenu({ id }: { id: string }) {
  const { cfg, setCfg } = useCanvas();
  const [open, setOpen] = useState(false);
  const current = String(cfg?.(id)?.style ?? 'primary');
  const label = BUTTON_STYLES.find(([v]) => v === current)?.[1] ?? 'Primary';
  return (
    <div className="relative">
      <button
        className="flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]"
        data-tip="Button style"
        onClick={() => setOpen((v) => !v)}
      >{label}<ChevronDown size={12} className="text-[#9CA3AF]" /></button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-[calc(100%+8px)] z-[61] w-[150px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
          >
            {BUTTON_STYLES.map(([v, l]) => (
              <button
                key={v}
                onClick={() => { setCfg(id, { style: v }); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                <span className="flex size-3.5 flex-shrink-0 items-center justify-center">
                  {v === current && <Check size={12} className="text-[#3D8BD0]" />}
                </span>
                {l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Add item — the Accordion's and the FAQ's one inline authoring action ────────────────────
 *
 * ⚠️ A LABELLED CTA, not a glyph. "+" already means "put a widget beside this one" two buttons
 * along; a second plus meaning "put a question inside this one" would be the same symbol for two
 * different structural moves on one bar.
 *
 * ⚠️ The two widgets name their item fields DIFFERENTLY — the Accordion stores `title`/`body`, the
 * FAQ `q`/`a` — so the keys are read from the type rather than assumed. Writing the Accordion's
 * names into an FAQ would append an item that renders blank and cannot be told apart from a bug. */
const ITEM_FIELDS: Record<string, { keys: [string, string]; labels: [string, string] }> = {
  'b-accordion': { keys: ['title', 'body'], labels: ['Title', 'Description'] },
  'c-faq': { keys: ['q', 'a'], labels: ['Question', 'Answer'] },
};

function AddItemMenu({ id, type }: { id: string; type: string }) {
  const { cfg, setCfg } = useCanvas();
  const [open, setOpen] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const spec = ITEM_FIELDS[type];
  if (!spec) return null;
  const commit = () => {
    /* ⚠️ Nothing is appended for an empty first field. An item with no question is a row the
       renderer draws as an empty disclosure — visible, clickable and saying nothing. */
    if (!a.trim()) return;
    const items = (cfg?.(id)?.items as Record<string, unknown>[] | undefined) ?? [];
    setCfg(id, { items: [...items, { [spec.keys[0]]: a.trim(), [spec.keys[1]]: b.trim() }] });
    setA(''); setB(''); setOpen(false);
    toast.success('Item added');
  };
  return (
    <div className="relative">
      <button
        className="flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
        data-tip={`Add a ${spec.labels[0].toLowerCase()} to this list`}
        onClick={() => setOpen((v) => !v)}
      ><Plus size={13} /> Add item</button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-[calc(100%+8px)] z-[61] w-[300px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-2.5 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
          >
            <label className="mb-1 block text-[11px] font-medium text-[#7B8FA5]">{spec.labels[0]}</label>
            <input
              autoFocus
              value={a}
              onChange={(e) => setA(e.target.value)}
              /* Enter commits from the first field only — in the second it would fight the fact that
                 an answer is often more than one line. */
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
              className="mb-2 h-8 w-full rounded border border-[#d1d5db] px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <label className="mb-1 block text-[11px] font-medium text-[#7B8FA5]">{spec.labels[1]}</label>
            <textarea
              rows={3}
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="mb-2.5 w-full rounded border border-[#d1d5db] px-2 py-1.5 text-[12px] leading-[1.5] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="inline-flex h-7 items-center rounded border border-[#DFE5ED] px-2.5 text-[12px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
              <button
                onClick={commit}
                disabled={!a.trim()}
                className="inline-flex h-7 items-center rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white hover:bg-[#3480c4] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
              >Add</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Add caption — the Image's one inline authoring action ───────────────────────────────────
 *
 * ⚠️ The label says which of the two it will do. A caption already written is EDITED here, not
 * added again, and a button that reads "Add caption" over a picture that has one is describing the
 * wrong action — you press it expecting a second line and get your own words back. */
function CaptionMenu({ id }: { id: string }) {
  const { cfg, setCfg } = useCanvas();
  const [open, setOpen] = useState(false);
  const current = String(cfg?.(id)?.caption ?? '');
  const [v, setV] = useState(current);
  return (
    <div className="relative">
      <button
        className="flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
        data-tip="The line of words under this picture"
        onClick={() => { setV(String(cfg?.(id)?.caption ?? '')); setOpen((x) => !x); }}
      ><Plus size={13} /> {current ? 'Edit caption' : 'Add caption'}</button>
      {open && (
        <>
          <span className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-[calc(100%+8px)] z-[61] w-[300px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-2.5 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
          >
            <label className="mb-1 block text-[11px] font-medium text-[#7B8FA5]">Caption</label>
            <input
              autoFocus
              value={v}
              onChange={(e) => setV(e.target.value)}
              placeholder="What this picture shows"
              onKeyDown={(e) => { if (e.key === 'Enter') { setCfg(id, { caption: v }); setOpen(false); } }}
              className="mb-2.5 h-8 w-full rounded border border-[#d1d5db] px-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <div className="flex justify-end gap-2">
              {/* Clearing is how a caption is REMOVED — an empty value is the absence of one, so a
                  separate delete would be a second control for the same state. */}
              <button onClick={() => setOpen(false)} className="inline-flex h-7 items-center rounded border border-[#DFE5ED] px-2.5 text-[12px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
              <button
                onClick={() => { setCfg(id, { caption: v }); setOpen(false); }}
                className="inline-flex h-7 items-center rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white hover:bg-[#3480c4]"
              >Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ElementToolbar({ id, kind, name }: { id: string; kind: string; name: string }) {
  /* The two "+" buttons. The picker is portalled to the body now, so it needs a real element to
     measure itself against — the wrapper it used to be positioned inside. */
  const besideRef = useRef<HTMLDivElement>(null);
  const insideRef = useRef<HTMLDivElement>(null);
  const swapRef = useRef<HTMLDivElement>(null);
  const { styles, setStyle, moveNode, duplicateNode, deleteNode, canDuplicate, addInside, replaceElement, addChildBlock, splitNode, splitInfo, addLinkCard, addSibling, cfg, setCfg, splitChildBlock, select, heroTree, placedPredefined, sectionKind } = useCanvas();
  const [colsOpen, setColsOpen] = useState(false);
  const onHero = /^el-\d+$/.test(id) && nodeById(id)?.parent === 'hero';
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [axis, setAxis] = useState<'h' | 'v' | null>(null);
  /* A Custom Data Widget drawn as a KPI takes both alignments — it places its number and title inside itself. The list form keeps none. */
  const kpi = placedType(id) === 'c-records' && cfg?.(id)?.display === 'kpi';
  const caps = kpi ? { ...toolbarCaps(id), alignH: undefined, alignV: undefined } : toolbarCaps(id);

  /* Side-by-side things move on the horizontal axis; stacked bands move on the vertical one.
     ⚠️ The MEASURED answer wins — see `useSiblingSpan`. The box's declared direction is the next
     best thing, and the kind is the last resort for a node with nothing beside it to measure. */
  const span = useSiblingSpan(id, true);
  const parentDir = boxInfo(id)?.parentDir;
  const horizontal = span.horizontal ?? (parentDir ? parentDir === 'row' : (kind === 'card' || kind === 'column'));
  /* ⚠️ The edge move is DISABLED, not hidden, with the reason on it — a control that disappears on
     the first and last item of a row reads as a bug, and one that silently does nothing reads as a
     broken one. This is the rule the Split button already follows. */
  const moves: [string, ReactNode, 'prev' | 'next', boolean][] = horizontal
    ? [
      ['Move left', <ArrowLeft key="l" size={15} />, 'prev', span.first],
      ['Move right', <ArrowRight key="r" size={15} />, 'next', span.last],
    ]
    : [
      ['Move down', <ArrowDown key="d" size={15} />, 'next', span.last],
      ['Move up', <ArrowUp key="u" size={15} />, 'prev', span.first],
    ];

  /* ⚠️ A CARD is not on this list any more. A widget occupies its slot completely — "add an element
     inside My Assets" was an offer the model could never honour, and it was the only thing the
     button said on every built-in block. Sections, columns and navs genuinely hold children; a card
     holds itself, so it gets Replace. */
  const canAdd = kind === 'section' || kind === 'column' || kind === 'nav';
  /** A dropped element — for these, the action means swap this for another kind, in place. */
  const placed = /^el-[0-9]+$/.test(id);
  /* ⚠️ Add and REPLACE are one slot showing one of two icons, because they are the same intent
     aimed at two states: an empty container has room for something, a full one already has the
     something. A "+" over a filled column promised an addition it could never make — a column holds
     one element — and the click either replaced silently or fell through to a new section elsewhere
     on the page. The icon now says which of the two will happen before you press it. */
  /* ⚠️ Only a COLUMN can be "full" — it holds exactly one element, so once something is in it the
     only thing "+" could honestly mean is swap. A section, card, nav or built-in row can always take
     another child, so they keep Add however much is already inside them. Testing "does this contain
     anything" instead of "can this contain more" put Replace on the Quick Actions row, which has
     room for a fourth card. */
  const occupant = /^sec-[0-9]+-b[0-9]+$/.test(id) || /^sec-[0-9]+$/.test(id) ? placedIn(id) : null;
  const childTypes = childTypesOf(id);
  const swaps = !childTypes?.length && (placed || !!occupant || kind === 'card');
  const swapTarget = placed ? id : occupant ?? (kind === 'card' ? id : null);
  const dupOk = canDuplicate(id);
  /* One of the six a section is composed from — see `COMPOSABLE`. These get BOTH actions: "+" puts
     another of the six in the slot BESIDE this one, Replace swaps this one. Everything else keeps
     the single Add-or-Replace slot it always had. */
  const composable = canAddBeside(id);
  /* ⚠️ ON THE BANNER both pickers offer the banner's curated blocks and nothing else — the same list
     the builder's gate enforces, so the list never offers something the drop would then refuse. */
  const onBanner = inBanner(id);
  const sixOnly = onHero
    ? BANNER_SIDE_WIDGETS
    : onBanner && (composable || placed || canAdd)
    ? BANNER_BLOCKS
    /* ⚠️ Filtered by `hidden`. A withheld element is withheld everywhere — the palette refusing
       Accordion while the "+ beside" button still handed it out is two pickers over one catalogue
       disagreeing about what exists, which is the fault this file already carries a note about. */
    : composable ? COMPOSABLE.filter((t) => !PORTAL_ELEMENTS.find((e) => e.id === t)?.hidden)
      .map((t) => ({ type: t, label: elementLabel(t) })) : undefined;
  /* ── What the page's Add and Replace pickers may offer here ──────────────────────────────────
   *
   * Two classes of widget, and they never mix in one picker. **PREDEFINED** (Data, Actions, plus the
   * two service rows that carry a `node`) are the product's single-instance widgets: one to a page,
   * one to a section, and a section holding one takes nothing else. **OTHER** (Basic, Visual,
   * Custom) is repeatable — several to a section, and it swaps only for its own kind.
   *
   * ⚠️ A predefined widget already ON the page is never offered again, by either picker. The palette
   * greys such a row and ticks it, because that is a catalogue you browse; this is a list of what
   * you can put HERE right now, so the row is gone rather than dead.
   * ⚠️ The BANNER is exempt end to end — `sixOnly` answers first with `BANNER_SIDE_WIDGETS`, and the
   * banner's sections have their own rules about what may sit on them. */
  const isButton = placedType(id) === 'b-button';
  const swapType = swaps && swapTarget ? placedType(swapTarget) : undefined;
  const secKind = sectionKind?.(id) ?? 'empty';
  const allow = (e: PortalElement) => {
    const pre = isPredefinedElement(e);
    if (pre && placedPredefined?.has(e.id)) return false;
    /* ⚠️ The BANNER stops here. Its curated list IS its rule — it mixes the two classes on purpose
       (words, a card, a counter and a picture on one band) — but "one to a page" is about the PAGE,
       so a predefined widget already placed is withheld there like anywhere else. */
    if (onHero || onBanner) return true;
    /* Replacing: the same class as the thing being replaced. */
    if (swapType) return pre === isPredefinedType(swapType);
    /* Adding: a section already holding an ordinary widget can only take more of those. An empty
       one takes either, and a section a predefined widget owns never reaches here (see below). */
    return secKind === 'other' ? !pre : true;
  };
  /* ⚠️ DISABLED with the reason on it, the rule every other cap in this builder follows — a "+"
     that opens an empty list, or silently vanishes, both read as a bug rather than as a limit. */
  const addBlocked = !swaps && !childTypes?.length && !onHero && !onBanner && secKind === 'predefined'
    ? 'This section holds a predefined widget, so it takes nothing else — replace it, or add to another section'
    : null;

  /* Null for anything that is not a box, which is how Split stays off cards, text and page bands. */
  const split = splitInfo?.(id) ?? null;

  /* ⚠️ THREE buttons, not one that cycles. A cycling control makes you read the tooltip to find out
     what state you are in and click up to twice to reach the one you want — for three mutually
     exclusive options that are each one glyph wide, showing all three costs two slots and removes
     both problems. The lit one is also the answer to "how is this aligned?", which the single
     button could only tell you in a tooltip. */
  /* ⚠️ TWO axis buttons, each opening its own options — not six buttons in the bar. An element has
     two independent alignments and they answer different questions ("where across?" and "where
     down?"); laying all six out flat makes one row of near-identical glyphs where the pairing is
     invisible, and doubles a toolbar that already competes for width. The axis button shows the
     option currently set, so the bar still answers both questions at a glance. */
  const alignH = String(styles[id]?.align ?? defaultAlignH(id));
  const alignV = String(styles[id]?.alignY ?? 'start');
  const H_OPTS: [string, string, ReactNode][] = [
    ['left', 'Left', <AlignStartVertical key="l" size={15} />],
    ['center', 'Centre', <AlignCenterVertical key="c" size={15} />],
    ['right', 'Right', <AlignEndVertical key="r" size={15} />],
    ['stretch', 'Stretch', <MoveHorizontal key="s" size={15} />],
  ];
  const V_OPTS: [string, string, ReactNode][] = [
    ['start', 'Top', <AlignStartHorizontal key="t" size={15} />],
    ['center', 'Middle', <AlignCenterHorizontal key="m" size={15} />],
    ['end', 'Bottom', <AlignEndHorizontal key="b" size={15} />],
    ['stretch', 'Stretch', <MoveVertical key="s" size={15} />],
  ];

  /* ⚠️ INSTANT tooltips, and `data-tip` rather than `title`. A native title waits about a second
     before it appears, which on a row of seven unlabelled glyphs means you either already know what
     they do or you hover and wait — and the delay is set by the OS, so it cannot be shortened while
     the attribute is what carries the label. Reading the label off data-tip and drawing it here
     makes it appear on contact, and leaves nothing behind to show a second, slower copy.
     ⚠️ ONE listener on the container, not a wrapper per button: the toolbar is rebuilt for every
     selection, and delegation keeps the label a property of the button rather than of extra markup
     around it. It renders BELOW the bar — the toolbar already sits above the element, so anything
     above IT is the likeliest thing to be clipped at the top of the canvas. */
  const [tip, setTip] = useState<{ label: string; x: number } | null>(null);
  const readTip = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement)?.closest?.('[data-tip]') as HTMLElement | null;
    if (!el) { setTip(null); return; }
    const label = el.getAttribute('data-tip');
    if (!label) { setTip(null); return; }
    setTip({ label, x: el.offsetLeft + el.offsetWidth / 2 });
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseOver={readTip}
      onMouseMove={readTip}
      onMouseLeave={() => setTip(null)}
      data-portal-toolbar
      className="relative flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {tip && (
        <span
          style={{ left: tip.x }}
          className="pointer-events-none absolute top-full z-[80] mt-1.5 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[11px] leading-[16px] text-white shadow-[0_4px_10px_rgba(16,24,40,0.18)]"
        >{tip.label}</span>
      )}
      {/* The grip drags the element itself — pick it up here, drop it on a sibling to reorder. */}
      {caps.drag !== false && (
        <span
          {...useNodeDragHandle(id)}
          data-tip="Drag to move"
          className="flex size-7 cursor-grab items-center justify-center text-[#9CA3AF] active:cursor-grabbing"
        ><GripVertical size={14} /></span>
      )}
      {caps.splitItem && (
        <button className={btn} data-tip="Split column — add a slot beside this" onClick={() => splitChildBlock?.(id)}><Columns2 size={15} /></button>
      )}
      {/* ⚠️ NOTHING ON THIS BAR IS EVER SHOWN DISABLED. A move that cannot happen is not rendered,
          the same way the pair disappears entirely when an element has no siblings at all.
          This replaces an earlier rule — "disabled with the reason on it" — which was applied
          because a control that vanishes can read as a bug. On a bar of seven small glyphs it does
          not: the greyed arrows were indistinguishable from the live ones at a glance, so the row
          looked the same whether or not you could act on it, and the reason was a tooltip nobody
          hovers a dead button to read. One rule now, everywhere: if it is on the bar, pressing it
          does something. */}
      {caps.move !== false && !span.alone && moves
        .filter(([, , , atEdge]) => !atEdge)
        .map(([label, ic, dir]) => (
          <button key={label} className={btn} data-tip={label} onClick={() => moveNode(id, dir)}>{ic}</button>
        ))}
      {/* SPLIT — the one structural operation, identical at every level: a leaf becomes two, a
          branch grows one more child, and the direction is always the box's own.
          ⚠️ The label says what will HAPPEN, not what the button is. "Split" alone leaves you to
          work out which way from the icon, and the answer depends on a setting two panels away.
          ⚠️ At the depth or column limit it stays VISIBLE and disabled with the reason on it —
          missing controls read as bugs, and a silent no-op reads as a broken one. */}
      {split && !split.blocked && (
        <button
          className={btn}
          data-tip={split.dir === 'row' ? 'Split into columns' : 'Split into rows'}
          onClick={() => splitNode(id)}
        >{split.dir === 'row' ? <Columns2 size={15} /> : <Rows2 size={15} />}</button>
      )}
      {/* ⚠️ "+" opens the list HERE rather than swapping the side panel to it. Sending you to
          another surface to pick, then back to the canvas to see the result, is three steps for one
          decision — and on a FILLED element the same gesture means swap, which is a change you want
          to make while looking at what you are replacing. */}
      {/* ⚠️ On the six, ADD means "beside", not "inside". A Text holds words, not widgets — the only
          honest thing a "+" on one can do is put the next element in the slot next to it, which is
          also what gives the move arrows something to move past. */}
      {composable && (
        <div ref={besideRef} className="relative">
          <button className={btn} data-tip="Add a widget beside this one" onClick={() => setAdding((v) => !v)}>
            <Plus size={15} />
          </button>
          {adding && (
            <ElementPicker
              only={sixOnly}
              mode="add"
              onPick={(type) => { setAdding(false); addSibling?.(id, type); }}
              onClose={() => setAdding(false)}
              anchorRef={besideRef}
              targetId={id}
            />
          )}
        </div>
      )}
      {/* ⚠️ SELECT THE ROW, from any card inside a gathered one. The row's outline now hugs its
          cards edge to edge, so the only bare pixels left to click are the gaps between them — and
          at a gap of 0 there are none at all, which would leave the row's Presets, Delete, handles
          and panel unreachable. The chip's step-up arrow was removed long ago (it was
          `pointer-events-none`, so it looked like a control and behaved like an illustration), so
          this is the one route up and it belongs on the bar rather than on a hover target. */}
      {(() => {
        const g = onHero ? groupOf(heroTree?.() ?? null, id) : null;
        if (!g) return null;
        return (
          <button className={btn} data-tip="Select the row" onClick={() => select(bannerBoxId(g))}>
            <SquareDashed size={15} />
          </button>
        );
      })()}
      {/* REPLACE, for a banner widget that is also a CONTAINER.
          ⚠️ Contact Us is the case: its spec declares `childTypes` (Button, Text, Icon), so the one
          add-or-replace slot below resolves to "Add a block inside" and the widget had no way to be
          swapped for another — every other banner widget gets Replace there, and this one silently did
          not. It is its OWN button rather than a relabel of that one, because both actions are real
          here: the card still takes blocks inside it, and the banner section it occupies can still
          become something else.
          ⚠️ The list is `BANNER_SIDE_WIDGETS` — only what the banner accepts, the same list the
          builder's own gate enforces, so the picker can never offer something the drop would refuse. */}
      {onHero && placed && !!childTypes?.length && (
        <div ref={swapRef} className="relative">
          <button className={btn} data-tip="Replace this widget" onClick={() => setSwapping((v) => !v)}>
            <Replace size={15} />
          </button>
          {swapping && (
            <ElementPicker
              only={BANNER_SIDE_WIDGETS}
              allow={allow}
              mode="replace"
              onPick={(type) => { setSwapping(false); replaceElement(id, type); }}
              onClose={() => setSwapping(false)}
              anchorRef={swapRef}
              targetId={id}
            />
          )}
        </div>
      )}
      {/* ⚠️ A banner CONTAINER gets no "+". Contact Us is the one — its spec declares childTypes, so
          the slot below would render as Add; but on the banner `sixOnly` is in force, so what it
          offered to put INSIDE the card was the banner's seven section widgets. An Announcements
          card inside Contact Us is not something the card can hold, and the dedicated Replace button
          above already covers the action that is real here. On the PAGE the "+" stays: there the
          list is the card's own Button, Text and Icon blocks, which it genuinely takes. */}
      {caps.add !== false && !(onHero && placed && !!childTypes?.length) && (canAdd || placed || kind === 'card') && (
        <div ref={insideRef} className="relative">
          <button
            className={addBlocked ? btnOff : btn}
            disabled={!!addBlocked}
            data-tip={addBlocked ?? (childTypes?.length && !sixOnly ? 'Add a block inside' : swaps ? 'Replace widget' : 'Add widget')}
            onClick={() => { if (!addBlocked) setPicking((v) => !v); }}
          >{swaps ? <Replace size={15} /> : <Plus size={15} />}</button>
          {picking && (
            <ElementPicker
              /* ⚠️ On the PAGE, Replace offers the whole of the widget's own class, never the six.
                 `COMPOSABLE` is the list of things a section is BUILT from, which is the right answer
                 for the "+ put another beside me" button above and the wrong one here: swapping a
                 Text for an Image is the same intent as swapping it for a Table or a Custom Card,
                 and six of the twenty-three could offer no reason for the other seventeen's absence.
                 The BANNER keeps its own lists — `sixOnly` answers first there. */
              only={!onHero && !onBanner && swaps ? undefined : sixOnly ?? (swaps ? undefined : childTypes)}
              allow={allow}
              mode={swaps ? 'replace' : 'add'}
              onPick={(type) => {
                setPicking(false);
                if (childTypes?.length && !sixOnly) addChildBlock(id, type);
                else if (swaps && swapTarget) replaceElement(swapTarget, type);
                else addInside(id, type);
              }}
              onClose={() => setPicking(false)}
              anchorRef={insideRef}
              targetId={id}
            />
          )}
        </div>
      )}
      {/* ⚠️ The button's STYLE, on the toolbar. It is the one thing about a button an admin changes
          more than once while looking at the page — the panel still owns everything else, so this is
          a shortcut to one field rather than a second place the value lives. */}
      {/* ⚠️ SHADOW, as four presets behind ONE icon. It was four controls in the panel — a switch, a
          colour, Outer/Inner and a 3×3 position — for an effect a support portal almost never wants,
          and the one property of a block you judge by eye against the page behind it rather than by
          reading a number. The tiles are not offered up front: the bar stays one glyph wide and the
          choice opens on demand, the way Presets and the colour popup already work.
          ⚠️ Not on a TEXT child. A shadow on a run of words is a box drawn round nothing the reader
          can see — the rule the panel group already had. */}
      {placedType(id) === 'b-button' && <ButtonStyleMenu id={id} />}
      {/* The one thing you author on these without opening the panel. */}
      {(placedType(id) === 'b-accordion' || placedType(id) === 'c-faq') && (
        <AddItemMenu id={id} type={placedType(id)!} />
      )}
      {placedType(id) === 'v-image' && <CaptionMenu id={id} />}
      {/* Cards laid out across — the SAME skeleton presets the panel shows, so the toolbar says what each
          choice looks like instead of offering bare numbers. */}
      {/* ⚠️ A GATHERED ROW gets the SAME control, and it is the same question: how many of these cards
          sit across before the rest wrap under them. Its count comes out of its id, which is built
          from the cards it holds. */}
      {(placedType(id) === 'x-actions' || placedType(id) === 'x-kpis' || /^hero-gp-/.test(id)) && (() => {
        const own = cfg?.(id) ?? {};
        const group = /^hero-gp-/.test(id);
        const count = group
          ? id.slice(8).split('|').length
          : Array.isArray(own.items)
            ? (own.items as { hidden?: boolean }[]).filter((it) => !it.hidden).length
            : Number(own.__tileCount ?? 4);
        const cols = Number(own.cols ?? Math.min(count, 4));
        return (
          <div className="relative">
            <button className={colsOpen ? btnOn : btn} data-tip="Presets" onClick={() => setColsOpen((x) => !x)}><Columns3 size={15} /></button>
            {colsOpen && (
              <>
                <span className="fixed inset-0 z-[60]" onClick={() => setColsOpen(false)} />
                <div className="absolute left-0 top-[calc(100%+6px)] z-[61] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]" style={{ width: Math.min(4, count) * 80 + 24 }}>
                  <p className="mb-2 text-[12px] font-medium text-[#364658]">Presets</p>
                  <TilePresetPicker count={count} value={cols} onChange={(c) => { setCfg?.(id, { cols: String(c) }); setColsOpen(false); }} />
                </div>
              </>
            )}
          </div>
        );
      })()}
      {/* ⚠️ A LABELLED action, not a "+". The Quick Actions row takes exactly one thing and it is a
          specific card — a plus would promise the palette, which this row is fenced against, and an
          icon would have to be guessed at. The words are the whole point of it. */}
      {caps.extLink && (
        <button
          className="flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
          data-tip="Add a card that opens a link of your choosing"
          onClick={() => addLinkCard?.()}
        ><Plus size={13} /> External link</button>
      )}
      {/* A layout block has no instance to clone, so the button is absent rather than greyed. */}
      {caps.copy !== false && dupOk && (
        <button className={btn} data-tip="Copy" onClick={() => duplicateNode(id)}><Copy size={14} /></button>
      )}
      {/* ⚠️ The banner's globe button is GONE. "Also use this background behind the whole page" put
          one block in charge of the page's background — a change you make while looking at the
          banner and then see everywhere else — and the page has its own background in Theme, which
          is where a page-wide decision belongs. Removed from the toolbar and from the panel at the
          same time, so there is no half of it left. */}
      {/* ⚠️ No clear-all-padding button. It was a one-way shortcut for something the Spacing panel
          already does per side, and its glyph said nothing about padding — so it read as an unknown
          action on a toolbar where every other button is a movement or a duplicate. Zeroing four
          sides is not common enough to earn a permanent seat next to Delete. */}
      {/* ── LOOK ─────────────────────────────────────────────────────────────────────────────────
          ⚠️ One group, fenced by rules: where the block sits, what colour it is and whether it
          lifts off the page are all "what does this look like", where everything to the left is
          "where does this go and how many are there". The three used to be scattered — alignment
          at the end, shadow beside Copy, colour not on the bar at all — so the bar read as a list
          of unrelated glyphs rather than as two answers with a line between them. */}
      {(caps.alignH !== false || caps.alignV !== false || kind !== 'text' || placed) && <Rule />}
      {caps.alignH !== false && (
        <AlignAxis
          axis="h"
          value={alignH}
          options={H_OPTS}
          open={axis === 'h'}
          onToggle={() => setAxis((a) => (a === 'h' ? null : 'h'))}
          onPick={(v) => { setStyle(id, { align: v as never }); setAxis(null); }}
        />
      )}
      {caps.alignV !== false && (
        <AlignAxis
          axis="v"
          value={alignV}
          options={V_OPTS}
          open={axis === 'v'}
          onToggle={() => setAxis((a) => (a === 'v' ? null : 'v'))}
          onPick={(v) => { setStyle(id, { alignY: v as never }); setAxis(null); }}
        />
      )}
      {/* ⚠️ Not on a text CHILD, the same rule Shadow follows: a heading's colour is its TYPE colour,
          set on the text toolbar over the words, and a background behind a run of words inside a
          card is a box nobody asked for. A placed Text element is a widget and keeps both. */}
      {/* ⚠️ Alignment gets its own fence. WHERE a block sits and WHAT IT LOOKS LIKE are two
          questions, and running them together made one long row of eight glyphs with a rule only at
          each end — which groups nothing. Three fences, four groups: move it · place it · style it ·
          remove it. */}
      {(caps.alignH !== false || caps.alignV !== false) && (kind !== 'text' || placed) && !isButton && <Rule />}
      {/* ⚠️ A BUTTON is excluded from all three. It draws itself entirely from widget CONFIG —
          `cfg.fillColor`, `cfg.radius`, its own border — so these three, which write the STYLE
          store for a placed element, would have written values the button never reads. Its look is
          the `ButtonStyleMenu` two slots along and its own panel group, which are the controls that
          actually reach it. An inert button on a toolbar is worse than no button. */}
      {(kind !== 'text' || placed) && !isButton && <ColorMenu id={id} />}
      {(kind !== 'text' || placed) && !isButton && <BorderMenu id={id} />}
      {(kind !== 'text' || placed) && !isButton && <RadiusMenu id={id} />}
      {(kind !== 'text' || placed) && <ShadowMenu id={id} />}
      {caps.remove !== false && <Rule />}
      {caps.remove !== false && (
        <button
          className="flex size-7 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
          data-tip="Delete"
          onClick={() => deleteNode(id)}
        ><Trash2 size={14} /></button>
      )}
    </div>
  );
}

/* Resize handles — functional.
 *
 * SQUARES resize the element (width / height in px). The two PILLS drag SPACING instead: the bottom
 * pill sets vertical padding, the left pill horizontal. That split is deliberate — an element's size
 * and the space inside it are different intentions, so they get different-looking grips, and the
 * magenta guides + live badge appear only for spacing, where you need to see what you are setting. */
/** The narrowest a dragged column may become — below this it stops being a column you can aim at. */
const MIN_COL = 40;
/* ⚠️ The BANNER stops at its own smallest stop, 260 — the S the height rail offers, so the drag and
   the rail agree about how small a banner goes. Below it the band's own minHeight took over and the
   picture kept its height while the wrapper shrank, so the artwork spilled out of the outline and
   the action cards underneath climbed into it. The cards ride up onto the banner when their OWN top
   grip is dragged; a banner that has run out of height must stop, not push the row below it up. */
const MIN_BANNER_H = 260;
/** The floor a south / north drag may take this node to. */
const minHeightFor = (id: string) => (id === 'hero' ? MIN_BANNER_H : 24);

function SelectionHandles({ id, elRef }: { id: string; elRef: React.RefObject<HTMLDivElement | null> }) {
  const { styles, setStyle } = useCanvas();
  const [live, setLive] = useState<{ kind: 'size' | 'padY' | 'padX' | 'gap'; label: string } | null>(null);
  const drag = useRef<{
    kind: 'size' | 'padY' | 'padX' | 'gap'; corner: string; x: number; y: number;
    w: number; h: number; pad: SpacingBox; gap: number; parentW: number;
    /** How tall this element may become before it outgrows the section holding it. */
    maxH: number;
    /** The floor — 24 for anything on the page, the banner's own smallest stop for the banner. */
    minH: number;
    /** True when the parent lays its children out in a line, so widths are shares of it. */
    inRow: boolean;
    /** The row is set to Fixed items: this column resizes alone, inside the room the row has left. */
    fixed: boolean;
    /** Each row member's top edge, so a wrapped line can be told apart from this one. */
    tops: number[];
    /** This element's own track — the ceiling a Fixed resize may not pass. */
    track: number;
    /** Node ids sharing this row, their starting widths, and where the dragged one sits. */
    siblings: string[]; widths: number[]; index: number;
    /** The parent's CONTENT width — what `width: N%` and `margin-left: N%` resolve against. */
    contentW: number;
    /** The margins the element starts with, in px, and its stored margin (so a drag keeps the other sides). */
    ml: number; mr: number; mt: number; margin: SpacingBox;
    /** Centred (or end-aligned) in a flex column: the first resize pins it to where it sits, so one edge moves. */
    pin: boolean;
  } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;

      if (d.kind === 'size') {
        const patch: Partial<NodeStyle> = {};
        const horiz = d.corner.includes('e') || d.corner.includes('w');

        /* Widening one card in a row must narrow its neighbours, or the row stops adding up and
           the cards fall out of alignment. Everyone in the row gets a share; the dragged one takes
           what it asked for and the rest split the remainder in their existing proportions. */
        /* ⚠️ `d.inRow` — not "has siblings". The hero's heading, subtitle and search box are three
           [data-node] children of one STACKED block, so counting siblings called them a row and sent
           the drag down the flex-share path: it wrote `flex` on all three, which does nothing in a
           block container, and dragging the heading's edge appeared completely dead. A share only
           means something when the parent actually lays its children out in a line. */
        /* ── Fixed items ── the column takes a width of its OWN and nothing else moves.
           ⚠️ Clamped to the room the row has LEFT: its own width minus what its siblings already
           hold and the gaps between them. Without that clamp, growing a fixed column has to come
           from somewhere — either a sibling shrinks (which is the thing Fixed promises will not
           happen) or the row overflows the section (which is the other thing). So it grows into
           free space and stops when there is none, and shrinking is what creates more.
           ⚠️ Stored as a PERCENTAGE of the row, like every other dragged width here: a px value
           stays put when the panel beside it is dragged or the section is restyled, so a row built
           at one width falls apart at another. */
        /* ⚠️ EVERY EDGE MOVES ALONE. The edge you hold follows the pointer and the opposite edge stays
           exactly where it was — that is what a resize handle promises, and it is what the left and top
           handles were not doing: a width is laid out from the LEFT, so shrinking it from the left edge
           pulled the right edge in instead, and growing it pushed the element rightward. The left edge
           therefore moves the element's own left MARGIN by the same amount the width changes, and the
           top edge does the same with its top margin — so nothing beside or below it moves either. */
        const west = d.corner.includes('w');
        const north = d.corner.includes('n');
        const pct = (px: number, of: number) => Math.round((px / Math.max(of, 1)) * 1000) / 10;
        const margin: SpacingBox = { ...d.margin };
        let marginTouched = false;

        if (horiz && d.fixed) {
          /* A Fixed row: the card resizes inside its own track, and its free edge moves inside the track. */
          const room = Math.max(MIN_COL, d.track);
          if (west) {
            const px = Math.max(MIN_COL, Math.min(d.w + d.ml, Math.round(d.w - dx)));
            margin.left = pct(d.ml + (d.w - px), d.track); marginTouched = true;
            setStyle(id, { widthPct: Math.max(1, pct(px, d.track)), flex: undefined, width: undefined });
            setLive({ kind: 'size', label: `${px}px` });
          } else {
            const px = Math.max(MIN_COL, Math.min(room - d.ml, Math.round(d.w + dx)));
            setStyle(id, { widthPct: Math.max(1, pct(px, d.track)), flex: undefined, width: undefined });
            setLive({ kind: 'size', label: `${px}px` });
          }
        } else if (horiz && d.inRow && d.siblings.length > 1) {
          /* A Fill row: the edge you hold trades width with the neighbour ON THAT SIDE only, so the cards
             beyond it do not move. The outermost edges have no neighbour — there the card makes room
             beside itself instead (its margin grows), and the rest of the row keeps its widths. */
          const i = d.index;
          const floor = 60;
          const nb = west ? i - 1 : i + 1;
          const next = d.widths.slice();
          if (nb >= 0 && nb < d.widths.length) {
            const pair = d.widths[i] + d.widths[nb];
            next[i] = Math.max(floor, Math.min(pair - floor, d.widths[i] + (west ? -dx : dx)));
            next[nb] = pair - next[i];
          } else if (west) {
            next[i] = Math.max(floor, Math.min(d.widths[i] + d.ml, d.widths[i] - dx));
            margin.left = pct(Math.max(0, d.ml + (d.widths[i] - next[i])), d.contentW); marginTouched = true;
          } else {
            next[i] = Math.max(floor, Math.min(d.widths[i] + d.mr, d.widths[i] + dx));
            margin.right = pct(Math.max(0, d.mr + (d.widths[i] - next[i])), d.contentW); marginTouched = true;
          }
          /* ⚠️ Shares in px of the widths they should come out at: with every sibling's share equal to its
             own width, the row lays out to exactly those widths whatever the margins and gaps are. */
          d.siblings.forEach((sib, j) => setStyle(sib, { flex: Math.round(next[j]), widthPct: undefined, width: undefined }));
          const total = d.widths.reduce((a, b) => a + b, 0);
          setLive({ kind: 'size', label: `${Math.round((next[i] / Math.max(total, 1)) * 100)}% of row` });
        } else if (horiz) {
          /* On its own in its parent: a share of the parent's content width, moved from the edge you hold. */
          if (west) {
            const px = Math.max(MIN_COL, Math.min(d.w + d.ml, d.w - dx));
            margin.left = pct(Math.max(0, d.ml + (d.w - px)), d.contentW); marginTouched = true;
            patch.widthPct = Math.max(1, Math.min(100, pct(px, d.contentW)));
          } else {
            const px = Math.max(MIN_COL, Math.min(d.contentW - d.ml, d.w + dx));
            patch.widthPct = Math.max(1, Math.min(100, pct(px, d.contentW)));
            if (d.pin) { margin.left = pct(d.ml, d.contentW); marginTouched = true; }
          }
          if (d.pin) patch.alignY = 'start';
          setLive({ kind: 'size', label: `${patch.widthPct}% of parent` });
        }

        /* ⚠️ The TOP BAR grows by padding, not by height — its contents are vertically centred, so a taller
           height only pushes empty space outside them. Half the drag per side, so the edge tracks the cursor. */
        if (id === 'header' && (d.corner.includes('s') || north)) {
          const delta = north ? -dy : dy;
          const val = Math.max(0, Math.min(64, Math.round(d.pad.top + delta / 2)));
          patch.padding = { ...d.pad, top: val, bottom: val };
          setLive({ kind: 'padY', label: `${val}px` });
        } else {
          if (d.corner.includes('s')) patch.height = Math.max(d.minH, Math.min(d.maxH, Math.round(d.h + dy)));
          if (north) {
            /* The bottom edge stays: the element grows UP into the space above it, by the same amount. */
            const hh = Math.max(d.minH, Math.min(d.maxH, Math.round(d.h - dy)));
            patch.height = hh;
            margin.top = Math.round(d.mt - (hh - d.h)); marginTouched = true;
          }
        }
        if (marginTouched) patch.margin = margin;
        if (Object.keys(patch).length) {
          setStyle(id, patch);
          if (!horiz && !d.fixed) {
            setLive({ kind: 'size', label: `${patch.width ?? Math.round(d.w)} × ${patch.height ?? Math.round(d.h)}` });
          }
        }
      } else if (d.kind === 'gap') {
        /* ⚠️ It STOPS at zero. It used to go one level negative (-120px) so a card could ride up
           over the band above it — but a negative gap is two sections sharing the same pixels, and
           the whole point of the row-and-column model is that they do not. Dragging up now closes
           the gap and holds there, with the two outlines touching, which is the honest floor. */
        const v = Math.max(0, Math.min(240, Math.round(d.gap + dy)));
        setStyle(id, { margin: { ...(styles[id]?.margin ?? ZERO_BOX), top: v } });
        setLive({ kind: 'gap', label: `${v}px` });
      } else if (d.kind === 'padY') {
        const v = Math.max(0, Math.min(200, Math.round(d.pad.top + dy)));
        setStyle(id, { padding: { ...d.pad, top: v, bottom: v } });
        setLive({ kind: 'padY', label: `${v}px` });
      } else {
        const v = Math.max(0, Math.min(45, Math.round(d.pad.left + (dx / Math.max(d.parentW, 1)) * 100)));
        setStyle(id, { padding: { ...d.pad, left: v, right: v } });
        setLive({ kind: 'padX', label: `${v}%` });
      }
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      setLive(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [id, setStyle]);

  const begin = (e: React.MouseEvent, kind: 'size' | 'padY' | 'padX' | 'gap', corner = '') => {
    e.preventDefault();
    e.stopPropagation();
    const el = elRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Row members are the direct [data-node] children of this element's parent, on this line.
    const all = [...(el.parentElement?.children ?? [])].filter((c) => c instanceof HTMLElement && c.dataset.node) as HTMLElement[];
    /* ⚠️ ONLY the members on the SAME LINE. A wrapped flex row is one DOM parent but several visual
       rows, and every member was being treated as a sibling to share width with — so dragging My
       Assets narrower also shrank My CIs, which sits on the line BELOW it and has nothing to do with
       how wide its neighbour is. Width is shared with what is beside you, and a card on another line
       is not beside you.
       The tops were already captured for exactly this and never consulted; 4px of tolerance covers
       sub-pixel layout, and it is measured against THIS element's top rather than the first one's,
       because the dragged element is not always on the first line. */
    const myTop = r.top;
    const row = all.filter((cEl) => Math.abs(cEl.getBoundingClientRect().top - myTop) < 4);
    /* ⚠️ The mode is read off the ROW's own DOM node, not out of the widget config. The handles sit
       inside the canvas and have no idea which section they are in; the row does, it is rendered
       from that config, and reading it here means the drag and the page cannot disagree about which
       rule is in force. Same reason `inRow` is measured rather than looked up. */
    const rowEl = el.parentElement;
    const rowFixed = rowEl?.dataset.resize === 'fixed';
    drag.current = {
      kind, corner, x: e.clientX, y: e.clientY, w: r.width, h: r.height,
      pad: styles[id]?.padding ?? ZERO_BOX,
      /* The gap it starts from: its own set margin, or the one the layout is already giving it. */
      gap: styles[id]?.margin?.top ?? Math.round(parseFloat(getComputedStyle(el).marginTop) || 0),
      /* ⚠️ NO CEILING. This used to cap at the band's own bottom, and the note that stood here
         already contained the reason that cannot work: a band is as tall as its tallest child, so an
         element that fills its band caps at exactly its current height. In practice that made every
         handle feel broken — an 80px drag on a Button, a Text block or an Accordion moved it 12px,
         which is just the section's bottom padding, and then stopped dead.
         A section GROWS with its content, so "the section's current bottom" was never a real limit;
         it was a measurement of the thing being dragged. A page can be any length — the same reason
         a top-level block was already uncapped — so there is no honest ceiling to enforce here, and
         inventing one produces a control that ignores half of what you ask it. The 24px floor stays:
         an element with no height at all is not a smaller element, it is a missing one. */
      maxH: Number.POSITIVE_INFINITY,
      minH: minHeightFor(id),
      inRow: (() => {
        const ps = el.parentElement ? getComputedStyle(el.parentElement) : null;
        return !!ps && (ps.display === 'flex' || ps.display === 'inline-flex') && !ps.flexDirection.startsWith('column');
      })(),
      fixed: rowFixed && row.length > 0,
      tops: row.map((c) => c.getBoundingClientRect().top),
      /* ⚠️ From the GRID, when there is one. A fixed row's tracks are equal and independent of what
         is currently in them, so the ceiling has to come from the track rather than from the
         element — otherwise shrinking once would lower the ceiling and the card could never grow
         back, the ratchet this file has already been bitten by twice. */
      track: (() => {
        const ps = rowEl ? getComputedStyle(rowEl) : null;
        const cols = ps?.gridTemplateColumns?.split(' ').filter(Boolean) ?? [];
        if (cols.length) return parseFloat(cols[Math.min(row.indexOf(el), cols.length - 1)]) || r.width;
        return r.width;
      })(),
      /* ⚠️ The banner's search is sized as a share of its COLUMN (its cell hugs it), so its width is
         measured against the nearest box container rather than the cell it fills. */
      parentW: ((id === 'hero-search' ? el.closest('[data-width-root]') : null) as HTMLElement | null ?? el.parentElement)?.getBoundingClientRect().width ?? r.width,
      siblings: row.map((c) => c.dataset.node!),
      widths: row.map((c) => c.getBoundingClientRect().width),
      index: row.indexOf(el),
      ...(() => {
        const cs = getComputedStyle(el);
        const host = (id === 'hero-search' ? el.closest('[data-width-root]') : null) as HTMLElement | null ?? el.parentElement;
        const hs = host ? getComputedStyle(host) : null;
        const hw = host?.getBoundingClientRect().width ?? r.width;
        return {
          /* ⚠️ In a GRID a width and a margin resolve against the element's own TRACK, not the grid's width —
             measured against the grid, a left-edge drag on one card of a three-card row moved its right edge 168px. */
          contentW: hs?.display === 'grid' || hs?.display === 'inline-grid'
            ? (() => { const cols = hs.gridTemplateColumns.split(' ').filter(Boolean); return parseFloat(cols[Math.min(Math.max(row.indexOf(el), 0), cols.length - 1)]) || r.width; })()
            : hs ? hw - (parseFloat(hs.paddingLeft) || 0) - (parseFloat(hs.paddingRight) || 0) : hw,
          /* ⚠️ The OFFSET from the parent's content edge, not the computed margin: a flex item centred by
             `align-items` has a margin of 0 while sitting 100px in, and resizing from that 0 dragged the
             element back to the edge. In a grid the margin IS the offset inside the track. */
          ...(() => {
            const grid = hs?.display === 'grid' || hs?.display === 'inline-grid';
            const cm = parseFloat(cs.marginLeft) || 0;
            const cmr = parseFloat(cs.marginRight) || 0;
            if (grid || !host || !hs) return { ml: cm, mr: cmr, pin: false };
            const hr = host.getBoundingClientRect();
            const offL = r.left - hr.left - (parseFloat(hs.borderLeftWidth) || 0) - (parseFloat(hs.paddingLeft) || 0);
            const offR = hr.right - r.right - (parseFloat(hs.borderRightWidth) || 0) - (parseFloat(hs.paddingRight) || 0);
            const column = (hs.display === 'flex' || hs.display === 'inline-flex') && hs.flexDirection.startsWith('column');
            return { ml: Math.max(0, offL), mr: Math.max(0, offR), pin: column && Math.abs(offL - cm) > 1 };
          })(),
          mt: styles[id]?.margin?.top ?? (parseFloat(cs.marginTop) || 0),
          margin: { ...(styles[id]?.margin ?? {}) },
        };
      })(),
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = kind === 'padY' || kind === 'gap' ? 'ns-resize'
      : kind === 'padX' ? 'ew-resize'
      : corner === 'n' || corner === 's' ? 'ns-resize'
      : corner === 'e' || corner === 'w' ? 'ew-resize'
      : corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';
  };

  const sq = 'absolute size-[7px] rounded-[1px] border border-[#3D8BD0] bg-white';
  const pad = styles[id]?.padding ?? ZERO_BOX;
  const corners: [string, string][] = [
    ['nw', '-left-[3px] -top-[3px] cursor-nwse-resize'],
    ['ne', '-right-[3px] -top-[3px] cursor-nesw-resize'],
    ['sw', '-bottom-[3px] -left-[3px] cursor-nesw-resize'],
    ['se', '-bottom-[3px] -right-[3px] cursor-nwse-resize'],

    /* ⚠️ The BOTTOM-centre grip was missing: height could only be dragged from a corner, which also
       changes the width, so "make this list taller" was not a gesture the canvas offered. */
    ['s', '-bottom-[3px] left-1/2 -translate-x-1/2 cursor-ns-resize'],
    ['e', '-right-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize'],
    /* ⚠️ A SQUARE, matching the right edge. The left edge carried a rounded pill that dragged
        horizontal PADDING — so the two sides of one element looked like different controls and did
        different things, and the side that looked like a resize handle was the only one that was.
        Both edges resize now; padding is set in the panel's Spacing matrix, where it is numeric and
        labelled rather than guessed from a 6px grip. */
    ['w', '-left-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize'],
  ];

  return (
    /* ⚠️ pointer-events-none on the WRAPPER, auto on each handle. Without it this overlay covers
       the whole selected element and swallows clicks on its children — so selecting a section made
       everything inside it unreachable. */
    /* ⚠️ z-[35]: above the add-section strip between bands (z-30), which otherwise covers the corner
       handles on the top and bottom edges and turns a corner drag into a section drag. */
    <span className="pointer-events-none absolute inset-0 z-[35]">
      {/* Magenta guides mark the padded edges while you drag them. */}
      {live?.kind === 'padY' && (
        <>
          <span className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#EC4899]" style={{ top: pad.top }} />
          <span className="pointer-events-none absolute inset-x-0 h-[2px] bg-[#EC4899]" style={{ bottom: pad.bottom }} />
        </>
      )}
      {live?.kind === 'gap' && (
        /* Drawn ABOVE the element, in the space being set — a line inside the box would mark the
           one edge this drag is not moving. */
        <span
          className="pointer-events-none absolute left-1/2 w-[3px] -translate-x-1/2 bg-[#EC4899]"
          style={{ bottom: '100%', height: Math.max(0, parseInt(live.label, 10)) }}
        />
      )}
      {live?.kind === 'padX' && (
        <>
          <span className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#EC4899]" style={{ left: `${pad.left}%` }} />
          <span className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#EC4899]" style={{ right: `${pad.right}%` }} />
        </>
      )}

      {corners.map(([c, cls]) => (
        <span key={c} onMouseDown={(e) => begin(e, 'size', c)} className={`${sq} ${cls} pointer-events-auto`} />
      ))}

      {/* ⚠️ The TOP-centre grip drags the GAP above this element, not its height.
          Height is what the bottom edge is for, and dragging the top to make something taller grows
          it upward into the block above — which reads as moving, not resizing. The space between two
          stacked things is the question people actually have at that edge, so that is what it asks.
          ⚠️ It STOPS at ZERO. A negative gap is two sections sharing the same pixels, which is what
          the row-and-column model exists to prevent — so dragging up closes the gap and holds there,
          with the two outlines touching. */}
      <span
        onMouseDown={(e) => begin(e, 'gap')}
        title="Drag to change the gap above"
        className="pointer-events-auto absolute -top-[3px] left-1/2 h-[6px] w-[18px] -translate-x-1/2 cursor-ns-resize rounded-full border border-[#3D8BD0] bg-white"
      />

      {/* ⚠️ There is NO bottom padding pill any more. It sat at exactly `-bottom-[3px] left-1/2` —
          the same point as the height grip — and being painted after it, it won every click: dragging
          the bottom edge of a list silently added vertical padding instead of making the widget
          taller. Two grips cannot share one edge, and on a list of data the edge means height.
          Vertical padding is still fully editable, in the panel's Spacing matrix, where it is
          labelled and numeric rather than guessed from a 6px pill. */}


      {live && (
        <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
          {live.label}
        </span>
      )}
    </span>
  );
}

/** Dark rich-text toolbar — Duda's treatment, and every control here is real. */
/* ⚠️ WHITE, like every other floating toolbar. It was dark — a deliberate "text gets its own bar"
 * signal that stopped being worth its cost: two toolbars in two colour schemes made the canvas look
 * like two products, and on a dark bar the colour control could not show the colour it sets, which
 * is the one thing that control has to do. */
/* ⚠️ The same instant-tooltip reader the element toolbar uses. The text bar was left on native
   `title` — so half the floating toolbars in this builder answered on contact and half made you
   wait a second, on glyphs (A with a bar, Tx, the align set) that are considerably less obvious
   than move-left and delete. */
function useToolbarTip() {
  const [tip, setTip] = useState<{ label: string; x: number } | null>(null);
  const readTip = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement)?.closest?.('[data-tip]') as HTMLElement | null;
    const label = el?.getAttribute('data-tip');
    if (!el || !label) { setTip(null); return; }
    setTip({ label, x: el.offsetLeft + el.offsetWidth / 2 });
  };
  return { tip, setTip, readTip };
}

function TextToolbar({ id, editing = false }: { id: string; editing?: boolean }) {
  const drag = useNodeDragHandle(id);
  const { tip, setTip, readTip } = useToolbarTip();
  const { styles, setStyle, setText } = useCanvas();
  const [pop, setPop] = useState<'link' | 'ph' | null>(null);
  /* The trigger's rect, captured on click — a fixed popover has to be told where its button is. */
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const linkRef = useRef<HTMLButtonElement>(null);
  const phRef = useRef<HTMLButtonElement>(null);
  const [pickColor, setPickColor] = useState<DOMRect | null>(null);
  const colorRef = useRef<HTMLButtonElement>(null);
  const [pickHilite, setPickHilite] = useState<DOMRect | null>(null);
  const hiliteRef = useRef<HTMLButtonElement>(null);
  const s: NodeStyle = styles[id] ?? {};
  const tBtn = (on?: boolean) => (on ? btnOn : btn);
  const sel = 'h-7 cursor-pointer rounded border border-[#E5E7EB] bg-white px-1.5 text-[12px] text-[#364658] outline-none hover:border-[#3D8BD0]';
  const color = s.color ?? '#364658';
  /* ⚠️ Selected words win: while you are editing with words selected, a control formats THOSE words;
     otherwise it formats the whole text, as it always has. */
  const inline = (run: (host: HTMLElement) => void, whole: () => void) => { if (!(editing && applyInline(id, run))) whole(); };

  return (
    <div
      /* Pressing a button must not take focus out of the words — that drops the word selection. */
      onMouseDown={(e) => { const t = e.target as HTMLElement; if (!t.closest('select,input')) e.preventDefault(); }}
      onClick={(e) => e.stopPropagation()}
      onMouseOver={readTip}
      onMouseMove={readTip}
      onMouseLeave={() => setTip(null)}
      data-portal-toolbar
      className="relative flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {tip && (
        <span
          style={{ left: tip.x }}
          className="pointer-events-none absolute top-full z-[80] mt-1.5 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[11px] leading-[16px] text-white shadow-[0_4px_10px_rgba(16,24,40,0.18)]"
        >{tip.label}</span>
      )}
      <span {...drag} className="flex size-7 cursor-grab items-center justify-center text-[#9CA3AF] active:cursor-grabbing"><GripVertical size={14} /></span>
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />

      <button className={tBtn(s.bold)} data-tip="Bold" onClick={() => inline(() => document.execCommand('bold'), () => setStyle(id, { bold: !s.bold }))}><Bold size={14} /></button>
      <button className={tBtn(s.italic)} data-tip="Italic" onClick={() => inline(() => document.execCommand('italic'), () => setStyle(id, { italic: !s.italic }))}><Italic size={14} /></button>
      <button className={tBtn(s.underline)} data-tip="Underline" onClick={() => inline(() => document.execCommand('underline'), () => setStyle(id, { underline: !s.underline }))}><Underline size={14} /></button>

      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />

      {/* Theme style. The * is Duda's override marker — it means this text no longer follows the
          theme, which is the one thing that makes a theme panel trustworthy. */}
      <select
        value={s.heading ?? 'PAR'}
        onChange={(e) => setStyle(id, { heading: e.target.value, fontSize: undefined })}
        className={sel}
      >
        {TEXT_STYLES.map((t) => <option key={t} value={t}>{t}{s.fontSize ? '*' : ''}</option>)}
      </select>

      {/* ⚠️ A plain FONT-FAMILY picker over the six families in `PORTAL_FONTS`.
          It used to offer the theme's two ROLES, so a bound text followed the theme when the theme
          changed. Swapped on request for a direct picker — the trade being that a family chosen here
          now stays put when the theme changes, which is what a direct picker always means.
          ⚠️ Each option is rendered IN its own face, which is the whole reason a font picker is a
          list rather than a text field: you choose by looking, not by recognising a name. That only
          works because all six are loaded in fonts.css. */}
      <select
        value={s.font ?? ''}
        onChange={(e) => { const fid = e.target.value; const css = PORTAL_FONTS.find((f) => f.id === fid)?.css; inline((h) => css && wrapInline(h, 'fontFamily', css), () => setStyle(id, { font: fid || undefined })); }}
        className={`${sel} max-w-[136px]`}
        title="Font"
      >
        <option value="">Default</option>
        {PORTAL_FONTS.map((f) => (
          <option key={f.id} value={f.id} style={{ fontFamily: f.css }}>{f.name}</option>
        ))}
      </select>

      <select
        value={s.fontSize ?? HEADING_SIZE[s.heading ?? 'PAR']}
        onChange={(e) => { const n = Number(e.target.value); inline((h) => wrapInline(h, 'fontSize', `${n}px`), () => setStyle(id, { fontSize: n })); }}
        className={`${sel} w-[52px]`}
      >
        {[12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>

      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />

      {/* ⚠️ A BUTTON opening the product's picker, not a native `<input type="color">` overlaid at
          `absolute inset-0`. The UA stylesheet gives that input its own width, which beats the
          left/right pair of `inset-0` — so it spilled out of its 28px label and sat on top of the
          alignment buttons beside it. That is why clicking "align left" opened a colour picker.
          ⚠️ And the glyph is Canva's: an A with a bar UNDER it painted in the colour it will apply.
          A neutral icon makes you open the control to find out what it is currently set to. */}
      <button
        ref={colorRef}
        className={tBtn()}
        data-tip="Text colour"
        onClick={() => setPickColor(pickColor ? null : colorRef.current!.getBoundingClientRect())}
      >
        <span className="flex flex-col items-center gap-[2px] leading-none">
          <Baseline size={13} />
          <span className="h-[3px] w-[14px] rounded-[1px]" style={{ background: color }} />
        </span>
      </button>
      {pickColor && (
        <PortalColorPicker
          value={color}
          anchor={pickColor}
          onChange={(v) => inline(() => document.execCommand('foreColor', false, v), () => setStyle(id, { color: v }))}
          onClose={() => setPickColor(null)}
        />
      )}

      {/* ⚠️ HIGHLIGHT, not a second text colour. The glyph is a marker over a filled bar — the same
          shape every office editor uses — so the two colour buttons are told apart by what they
          show rather than by their tooltips. The swatch under it is the CURRENT highlight, which is
          what makes "is anything highlighted?" answerable without clicking. */}
      <button
        ref={hiliteRef}
        className={tBtn(!!s.textBg)}
        data-tip="Highlight colour"
        onClick={() => setPickHilite(pickHilite ? null : hiliteRef.current!.getBoundingClientRect())}
      >
        <span className="flex flex-col items-center gap-[2px] leading-none">
          <Highlighter size={13} />
          <span
            className="h-[3px] w-[14px] rounded-[1px] border border-[#E5E7EB]"
            style={{ background: s.textBg ?? 'transparent' }}
          />
        </span>
      </button>
      {pickHilite && (
        <PortalColorPicker
          value={s.textBg ?? '#FDE68A'}
          anchor={pickHilite}
          onChange={(v) => inline(() => document.execCommand('hiliteColor', false, v), () => setStyle(id, { textBg: v }))}
          onClose={() => setPickHilite(null)}
        />
      )}

      {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Ic]) => (
        <button key={a} className={tBtn(s.align === a)} data-tip={`Align ${a}`} onClick={() => setStyle(id, { align: a })}>
          <Ic size={14} />
        </button>
      ))}
      {/* ⚠️ CLEAR FORMATTING sits with the character toggles it undoes, not at the end of the bar.
          It is the escape hatch for B / I / U / size / colour, so it belongs where those are — and it
          DELETES those keys rather than writing new ones, which is what makes the text fall back to
          the theme instead of to a hard-coded default that would drift from it. */}
      <button
        className={tBtn()}
        data-tip="Clear formatting"
        onClick={() => inline(() => document.execCommand('removeFormat'), () => {
          setStyle(id, { bold: undefined, italic: undefined, underline: undefined, color: undefined, fontSize: undefined, heading: undefined, align: undefined });
          toast.success('Formatting cleared');
        })}
      ><RemoveFormatting size={14} /></button>

      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />

      <button
        ref={linkRef}
        className={pop === 'link' ? btnOn : btn}
        data-tip="Link"
        onClick={() => { setAnchor(linkRef.current?.getBoundingClientRect() ?? null); setPop(pop === 'link' ? null : 'link'); }}
      ><Link2 size={14} /></button>
      {pop === 'link' && anchor && <LinkPopover anchor={anchor} onClose={() => setPop(null)} />}
      {/* ⚠️ A LABELLED button, not a glyph. "Placeholder" is the one action here whose result is a
          token rather than a visible change, so an icon alone would be a guess — and it is the
          control a support-portal admin reaches for most, because a banner that greets someone by
          name is much of the reason this text is editable at all. */}
      <button
        ref={phRef}
        className={`flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium transition-colors ${
          pop === 'ph' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#364658]'
        }`}
        onClick={() => { setAnchor(phRef.current?.getBoundingClientRect() ?? null); setPop(pop === 'ph' ? null : 'ph'); }}
      ><Braces size={14} /> Placeholder</button>
      {pop === 'ph' && anchor && <PlaceholderPopover anchor={anchor} onPick={(t) => { setText(id, t); setPop(null); }} onClose={() => setPop(null)} />}
    </div>
  );
}

/* ── Link ────────────────────────────────────────────────────────────────────
 *
 * ⚠️ URL, then the words, then the target — the order the sentence is spoken in. "Open in new tab"
 * is a checkbox rather than a toggle because it is a property of the link being written, not a
 * setting being switched on somewhere else. */
/* ⚠️ PORTALLED to document.body and positioned FIXED, exactly as the icon picker already is.
   Rendered `absolute` inside the toolbar these two were laid out relative to a bar that is itself
   absolutely positioned near the top of the canvas — so they were clipped by its stacking context
   and, on a text node high on the page, ran off the edge with no way to reach the rest. Anything
   that opens FROM the floating toolbar has to escape it; the toolbar is not a container, it is a
   thing hovering over the content.
   ⚠️ Clamped on BOTH axes, and flipped above the trigger when there is no room below — a popover
   that opens off-screen is the same bug in a different direction. */
function AnchoredPopover({ anchor, width, height, children }: {
  anchor: DOMRect; width: number; height: number; children: React.ReactNode;
}) {
  const below = anchor.bottom + 8;
  const fitsBelow = below + height <= window.innerHeight - 8;
  const top = fitsBelow ? below : Math.max(8, anchor.top - height - 8);
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8));
  return createPortal(
    <div style={{ top, left, width }} className="fixed z-[10001] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
      {children}
    </div>,
    document.body,
  );
}

function LinkPopover({ anchor, onClose }: { anchor: DOMRect; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [blank, setBlank] = useState(false);
  const inp = 'h-9 w-full rounded border border-[#d1d5db] px-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]';
  return (
    <>
      {createPortal(<span className="fixed inset-0 z-[10000]" onClick={onClose} />, document.body)}
      <AnchoredPopover anchor={anchor} width={300} height={250}>
      <div className="p-3">
        <p className="mb-1 text-[12px] text-[#7B8FA5]">URL</p>
        <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className={inp} />
        <p className="mb-1 mt-3 text-[12px] text-[#7B8FA5]">Text</p>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="The words that carry the link" className={inp} />
        <label className="mt-3 flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} className="size-4 accent-[#3D8BD0]" />
          <span className="text-[13px] text-[#364658]">Open in new tab</span>
        </label>
        <div className="mt-3 flex justify-end">
          <button
            disabled={!url.trim()}
            onClick={() => { toast.success(`Linked to ${url}`); onClose(); }}
            className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:opacity-40"
          >Insert</button>
        </div>
      </div>
      </AnchoredPopover>
    </>
  );
}

/* ── Placeholders ────────────────────────────────────────────────────────────
 *
 * ⚠️ Grouped by the RECORD they come from, not listed flat. "Service Name" and "Requester Name" are
 * the same shape of thing and mean entirely different things; the group is what tells them apart,
 * and a flat list of thirty tokens makes you read every one to find the one you meant. */
const PLACEHOLDERS: { group: string; items: string[] }[] = [
  { group: 'Request', items: ['Service Name', 'Service Category', 'Service Cost'] },
  { group: 'Requester', items: ['Requester Name', 'Created By Name'] },
  { group: 'Request Custom Fields', items: ['New Number', 'New Dropdown', 'Assets', 'CI', 'Service'] },
];

function PlaceholderPopover({ anchor, onPick, onClose }: { anchor: DOMRect; onPick: (token: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const groups = PLACEHOLDERS
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.toLowerCase().includes(q.toLowerCase())) }))
    .filter((g) => g.items.length);
  return (
    <>
      {createPortal(<span className="fixed inset-0 z-[10000]" onClick={onClose} />, document.body)}
      <AnchoredPopover anchor={anchor} width={300} height={340}>
      <div className="max-h-[340px] overflow-y-auto rounded-lg">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#F0F2F5] bg-white px-3 py-2.5">
          <span className="text-[13px] font-semibold text-[#364658]">Placeholders</span>
          <button onClick={onClose} className="ml-auto flex size-6 items-center justify-center rounded text-[#64748B] hover:bg-[#F3F4F6]"><X size={14} /></button>
        </div>
        <div className="px-3 pt-2.5">
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
            className="h-8 w-full rounded border border-[#d1d5db] px-2.5 text-[12px] outline-none focus:border-[#3D8BD0]"
          />
        </div>
        {groups.map((g) => (
          <div key={g.group} className="px-3 pb-1 pt-3">
            <p className="mb-1.5 border-b border-[#F0F2F5] pb-1 text-[12px] font-medium text-[#7B8FA5]">{g.group}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((i) => (
                <button
                  key={i}
                  onClick={() => onPick('%{' + i.toLowerCase().replace(/ /g, '_') + '}')}
                  className="rounded bg-[#EEF2F6] px-2 py-1 text-[12px] text-[#364658] transition-colors hover:bg-[#DDE6EF]"
                >{i}</button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <p className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">Nothing matches that.</p>}
      </div>
      </AnchoredPopover>
    </>
  );
}

/* Keeps the floating toolbar on screen.
 *
 * ⚠️ It is anchored `left-0` to the element, which is right for everything except an element near
 * the right edge — a card in the last column put its toolbar half outside the canvas, and the buttons
 * that fell off were the ones at the end (delete, align) rather than the ones nobody minds losing.
 * ⚠️ Measured, not guessed: the toolbar's width depends on which kind it is (the text bar is far
 * wider than the element bar) and the canvas width changes as the design panel is dragged, so a
 * fixed offset would be wrong for most of the cases it exists to fix. A layout effect reads both
 * after render and shifts by exactly the overhang, which is why it never overcorrects into the
 * element's own left edge. */
/* The floating toolbar's shell.
 *
 * ⚠️ PORTALLED to document.body and positioned FIXED. Rendered inside the element it belongs to, it
 * was clipped by the first ancestor with a non-visible overflow — which is every data widget, since
 * a card that scrolls or truncates its rows has to hide its overflow. So selecting a widget heading
 * drew its text toolbar INSIDE the card, half of it cut off. A toolbar is not part of the thing it
 * edits; it hovers over the page, and it has to escape every box between the two.
 *
 * ⚠️ It follows the element on scroll and resize. Fixed positioning means the toolbar no longer
 * moves with the page on its own, so it is re-measured while it is open — otherwise it would sit
 * where the element USED to be the moment anything scrolled. */
/* ── The BANNER's floating toolbar ────────────────────────────────────────────────────────────
 *
 * Align the heading, subheading and search (both axes) · add a widget beside them · put an image
 * behind the banner · colour it (solid or gradient) · delete the banner. Every one writes the same
 * hero config the panel's Style section edits, so the two are one control in two places.
 * ⚠️ No drag handle: the banner is the top of the page, there is nowhere for it to go. */
/* ⚠️ The SINGLE Action Card and the SINGLE KPI, never the blocks that hold a set of them.
   This list renders its own rows and so bypasses the catalogue's `hidden` flag — which is how
   `x-actions` and `x-kpis` went on being offered here for weeks after they were withheld from
   the palette, leaving the banner the one surface in the builder still handing out a widget the
   rest of the product had stopped believing in.
   The reasons are the ones that hid them: a card added one at a time can be removed one at a time,
   which a block of four cannot, and the KPI set is what the Custom Data Widget is for. */
/** One to a page, wherever the picker is: a predefined widget already placed is never offered.
 *  The banner pickers render their own flat list, so they take this rather than the class rule. */
const notPlaced = (placed?: Set<string>) => (e: PortalElement) => !(isPredefinedElement(e) && placed?.has(e.id));

export const BANNER_SIDE_WIDGETS: { type: string; label: string }[] = [
  { type: 'c-announcements', label: 'Announcements' },
  { type: 'x-kpi', label: 'KPI' },
  { type: 'c-contact', label: 'Contact Us' },
  { type: 'x-action-card', label: 'Action Card' },
  /* ⚠️ Quick links is the CUSTOM CARD on its Links layout, not the plain List. A row of links is a
     glyph, a destination and the arrow that says it goes somewhere — which is what the Links layout
     already draws, down to the hairlines between rows — where a List is a title over a paragraph.
     The plain List left the banner with the name: two rows in this popup both meaning "a list of
     links" is the one-widget-two-names trap, and List is still on the palette for the page. */
  { type: 'x-card', label: 'Quick links' },
  { type: 'v-image', label: 'Image' },
  { type: 'b-text', label: 'Text' },
];

function BannerToolbar() {
  const { cfg, setCfg, deleteNode, dropInRow, heroTree, placedPredefined } = useCanvas();
  const hero = cfg?.('hero') ?? {};
  const [axis, setAxis] = useState<'h' | 'v' | null>(null);
  const [adding, setAdding] = useState(false);
  const [fill, setFill] = useState(false);
  const [layout, setLayout] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { tip, setTip, readTip } = useToolbarTip();
  const alignH = String(hero.contentAlign ?? 'center');
  const h = alignH.includes('left') ? 'left' : alignH.includes('right') ? 'right' : 'center';
  const vAlign = String(hero.contentAlignY ?? 'center');
  const H: [string, string, ReactNode][] = [
    ['left', 'Left', <AlignStartVertical key="l" size={15} />],
    ['center', 'Centre', <AlignCenterVertical key="c" size={15} />],
    ['right', 'Right', <AlignEndVertical key="r" size={15} />],
  ];
  const V: [string, string, ReactNode][] = [
    ['start', 'Top', <AlignStartHorizontal key="t" size={15} />],
    ['center', 'Middle', <AlignCenterHorizontal key="m" size={15} />],
    ['end', 'Bottom', <AlignEndHorizontal key="b" size={15} />],
  ];
  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast.error('Choose an image file — PNG, JPG, SVG or WebP'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('That image is over 5 MB — choose a smaller one'); return; }
    const r = new FileReader();
    /* An image background turns the colour layer on, so the words stay readable over the picture. */
    r.onload = () => { setCfg?.('hero', { bgKind: 'image', bannerImage: String(r.result), overlayOn: hero.overlayOn ?? true }); toast.success('Banner image added'); };
    r.readAsDataURL(file);
  };
  return (
    <div
      data-portal-toolbar
      onClick={(e) => e.stopPropagation()}
      onMouseOver={readTip}
      onMouseMove={readTip}
      onMouseLeave={() => setTip(null)}
      className="relative flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {tip && (
        <span style={{ left: tip.x }} className="pointer-events-none absolute top-full z-[80] mt-1.5 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[11px] leading-[16px] text-white shadow-[0_4px_10px_rgba(16,24,40,0.18)]">{tip.label}</span>
      )}
      <AlignAxis axis="h" value={h} options={H} open={axis === 'h'} onToggle={() => { setFill(false); setAxis((a) => (a === 'h' ? null : 'h')); }} onPick={(x) => { setCfg?.('hero', { contentAlign: x }); setAxis(null); }} />
      <AlignAxis axis="v" value={vAlign} options={V} open={axis === 'v'} onToggle={() => { setFill(false); setAxis((a) => (a === 'v' ? null : 'v')); }} onPick={(x) => { setCfg?.('hero', { contentAlignY: x }); setAxis(null); }} />
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
      {/* ⚠️ Withheld while the banner holds ONE section. There is no arrangement of a single thing, so the
          popup would open on the empty-state note — a control that exists to tell you it has nothing to offer.
          It returns the moment a second section lands. */}
      {(presetsFor(heroTree?.() ?? null).length > 0) && (
      <div className="relative">
        <button className={layout ? btnOn : btn} data-tip="Arrange the banner's sections" onClick={() => { setAxis(null); setFill(false); setAdding(false); setLayout((x) => !x); }}><LayoutDashboard size={15} /></button>
        {layout && (
          <>
            <span className="fixed inset-0 z-[60]" onClick={() => setLayout(false)} />
            <div className="absolute left-0 top-[calc(100%+6px)] z-[61] w-[300px] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]">
              <p className="mb-2 text-[12px] font-medium text-[#364658]">Arrangement</p>
              <BannerPresetPicker tree={heroTree?.() ?? null} onPick={(t) => setCfg?.('hero', { bannerTree: t })} />
            </div>
          </>
        )}
      </div>
      )}
      <div ref={addRef} className="relative">
        <button className={btn} data-tip="Add a widget to the banner" onClick={() => { setAxis(null); setFill(false); setLayout(false); setAdding((x) => !x); }}><Plus size={15} /></button>
        {adding && (
          <ElementPicker
            only={BANNER_SIDE_WIDGETS}
            allow={notPlaced(placedPredefined)}
            mode="add"
            onPick={(t) => { setAdding(false); dropInRow('hero', t); }}
            onClose={() => setAdding(false)}
            anchorRef={addRef}
            targetId="hero"
          />
        )}
      </div>
      <button className={btn} data-tip={hero.bannerImage ? 'Replace the banner image' : 'Add a banner image'} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /></button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="relative">
        <button className={fill ? btnOn : btn} data-tip="Banner colour — solid or gradient" onClick={() => { setAxis(null); setAdding(false); setFill((x) => !x); }}><Palette size={15} /></button>
        {fill && (
          <>
            <span className="fixed inset-0 z-[60]" onClick={() => setFill(false)} />
            {/* ⚠️ 320px, and a scroll once it is tall. This popup holds the SAME gradient editor the
                panel does, and the editor is a row of four controls over a list of stops — at 240px
                the type select read "L" and every stop colour read "#…", which is a control you have
                to open to find out what it says. The colour picker it opens is portalled to the body,
                so the scroll box cannot clip it. */}
            <div className="absolute left-1/2 top-[calc(100%+6px)] z-[61] max-h-[min(70vh,540px)] w-[320px] -translate-x-1/2 overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]">
              <BannerFillEditor cfg={hero} setCfg={(patch) => setCfg?.('hero', patch)} />
            </div>
          </>
        )}
      </div>
      {/* ⚠️ The banner's OWN border and corners, beside its colour — the same three questions every
          other block answers on its bar, in the same order. They were a "Corners & border" group in
          the panel, which is the copy you are not looking at while you are looking at the banner. */}
      <BannerEdgeMenus />
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
      <button className="flex size-7 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]" data-tip="Delete the banner" onClick={() => deleteNode('hero')}><Trash2 size={14} /></button>
    </div>
  );
}

/* Border + Corner radius for the BANNER.
 *
 * ⚠️ Its own component rather than reusing `BorderMenu` / `RadiusMenu`: the banner keeps these under
 * its own key names (`bannerBorderWidth`, `bannerBorderColor`, `bannerBorderStyle`, `bannerRadius`)
 * in hero config, because a banner's border is painted on the BAND while every other block's is
 * painted by `containerCss` from `borderWidth`/`radius`. Same controls, same popups, different keys
 * — pretending otherwise would have written values the band never reads. */
function BannerEdgeMenus() {
  const { cfg, setCfg } = useCanvas();
  const hero = cfg?.('hero') ?? {};
  const [open, setOpen] = useState<'border' | 'radius' | null>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<DOMRect | null>(null);
  const width = Number(hero.bannerBorderWidth ?? 0);
  const color = String(hero.bannerBorderColor ?? '#E5E7EB');
  const stroke = String(hero.bannerBorderStyle ?? 'solid');
  const radius = Number(hero.bannerRadius ?? 0);
  const set = (patch: Record<string, unknown>) => setCfg?.('hero', patch);
  return (
    <>
      <div className="relative">
        <button className={open === 'border' ? btnOn : btn} data-tip="Border"
          onClick={() => { setAt(null); setOpen((x) => (x === 'border' ? null : 'border')); }}>
          <StrokeGlyph />
        </button>
        {open === 'border' && (
          <>
            <span className="fixed inset-0 z-[60]" onClick={() => { setOpen(null); setAt(null); }} />
            <BarPop title="Border">
              <p className="mb-1 text-[11px] text-[#7B8FA5]">Weight</p>
              <div className="mb-3 flex items-center gap-2">
                <input type="range" min={0} max={8} value={width}
                  onChange={(e) => set({ bannerBorderWidth: Number(e.target.value) })} className={SLIDER} />
                <span className="w-9 text-right text-[12px] tabular-nums text-[#364658]">{width}px</span>
              </div>
              {width === 0 && (
                <p className="text-[11.5px] leading-[1.5] text-[#9AA6B6]">
                  No border.{radius === 0 ? ' Square corners.' : ''}
                </p>
              )}
              {width > 0 && (
                <>
                  <p className="mb-1 text-[11px] text-[#7B8FA5]">Style</p>
                  <div className="mb-3 flex gap-1 rounded bg-[#F1F5F9] p-0.5">
                    {BORDER_STYLES.map((s) => (
                      <button key={s.value} onClick={() => set({ bannerBorderStyle: s.value })}
                        className={`flex-1 rounded py-1.5 text-[12px] font-medium transition-colors ${
                          stroke === s.value ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
                        }`}
                      >{s.label}</button>
                    ))}
                  </div>
                  <p className="mb-1 text-[11px] text-[#7B8FA5]">Colour</p>
                  <button ref={swatchRef}
                    onClick={() => setAt(at ? null : swatchRef.current!.getBoundingClientRect())}
                    className="flex h-8 w-full items-center gap-2 rounded border border-[#DFE5ED] px-2 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                  >
                    <span className="size-4 flex-shrink-0 rounded-[3px] border border-[#CBD5E1]" style={{ background: color }} />
                    <span className="truncate">{color}</span>
                  </button>
                </>
              )}
            </BarPop>
            {at && (
              <PortalColorPicker value={color} anchor={at}
                onChange={(v) => set({ bannerBorderColor: v })} onClose={() => setAt(null)} />
            )}
          </>
        )}
      </div>
      <div className="relative">
        <button className={open === 'radius' ? btnOn : btn} data-tip="Corner radius"
          onClick={() => setOpen((x) => (x === 'radius' ? null : 'radius'))}>
          <RadiusGlyph />
        </button>
        {open === 'radius' && (
          <>
            <span className="fixed inset-0 z-[60]" onClick={() => setOpen(null)} />
            <BarPop w={220} title="Corner radius">
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={40} value={radius}
                  onChange={(e) => set({ bannerRadius: Number(e.target.value) })} className={SLIDER} />
                <span className="w-9 text-right text-[12px] tabular-nums text-[#364658]">{radius}px</span>
              </div>
            </BarPop>
          </>
        )}
      </div>
    </>
  );
}

/* ── The banner's GROUP toolbar (Text group, Content group) ───────────────────────────────────────
 * The three questions an auto-layout frame asks and nothing else: which way the items run, and how
 * they line up across that direction. The gap is dragged on the canvas (the pink bands) or typed in
 * the panel — a third place for one number would be one too many. */
function GroupToolbar({ id }: { id: string }) {
  const { cfg, setCfg, heroTree } = useCanvas();
  const c = cfg?.(id) ?? {};
  /* ⚠️ The Text & Search section's direction is its OWN — whether the words and the search run stacked or
     side by side. The banner's arrangement of its sections is the presets' job, not this toggle's. */
  void heroTree;
  const dir = String(c.dir ?? 'column');
  const setDir = (d: string) => setCfg?.(id, { dir: d });
  const textSection = id === 'hero-content';
  const [open, setOpen] = useState(false);
  const [openY, setOpenY] = useState(false);
  const { tip, setTip, readTip } = useToolbarTip();
  const A = dir === 'row'
    ? ([['start', 'Top', <AlignStartHorizontal key="t" size={15} />], ['center', 'Middle', <AlignCenterHorizontal key="m" size={15} />], ['end', 'Bottom', <AlignEndHorizontal key="b" size={15} />]] as [string, string, ReactNode][])
    : ([['start', 'Left', <AlignStartVertical key="l" size={15} />], ['center', 'Centre', <AlignCenterVertical key="c" size={15} />], ['end', 'Right', <AlignEndVertical key="r" size={15} />]] as [string, string, ReactNode][]);
  const hero = cfg?.('hero') ?? {};
  const bandA = String(hero.contentAlign ?? 'center');
  const align = String(c.align ?? (bandA.includes('left') ? 'start' : bandA.includes('right') ? 'end' : 'center'));
  return (
    <div
      data-portal-toolbar
      onClick={(e) => e.stopPropagation()}
      onMouseOver={readTip}
      onMouseMove={readTip}
      onMouseLeave={() => setTip(null)}
      className="relative flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {tip && (
        <span style={{ left: tip.x }} className="pointer-events-none absolute top-full z-[80] mt-1.5 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[11px] leading-[16px] text-white shadow-[0_4px_10px_rgba(16,24,40,0.18)]">{tip.label}</span>
      )}
      {textSection && (
        /* ⚠️ A GRIP, so the banner's words move the same way its widgets do — press and drag it onto another
           section's edge to make a column or a row there. Without one the Text & Search section was the one
           thing on the banner that could only be moved by picking a preset. */
        <span
          draggable
          data-tip="Drag to move this section"
          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData(MOVE_MIME, id); e.dataTransfer.effectAllowed = 'move'; }}
          className="flex size-7 cursor-grab items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] active:cursor-grabbing"
        ><GripVertical size={15} /></span>
      )}
      <button className={dir === 'column' ? btnOn : btn} data-tip="Vertical — items stack" aria-pressed={dir === 'column'} onClick={() => setDir('column')}><Rows2 size={15} /></button>
      <button className={dir === 'row' ? btnOn : btn} data-tip="Horizontal — items side by side" aria-pressed={dir === 'row'} onClick={() => setDir('row')}><Columns2 size={15} /></button>
      <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
      {textSection ? (
        <>
          {/* Two axes, always both: where the items sit across the section, and down it. STRETCH on the vertical
              axis pins the words to the top and the search to the bottom; on the horizontal one (side by side) it
              spreads them to the two edges. */}
          <AlignAxis axis="h" value={String(c.align ?? align)} open={open} onToggle={() => { setOpenY(false); setOpen((x) => !x); }} onPick={(x) => { setCfg?.(id, { align: x }); setOpen(false); }}
            options={[['start', 'Left', <AlignStartVertical key="l" size={15} />], ['center', 'Centre', <AlignCenterVertical key="c" size={15} />], ['end', 'Right', <AlignEndVertical key="r" size={15} />], ['stretch', dir === 'row' ? 'Spread to both edges' : 'Stretch across', <StretchHorizontal key="s" size={15} />]] as [string, string, ReactNode][]} />
          <AlignAxis axis="v" value={String(c.alignY ?? cfg?.('hero')?.contentAlignY ?? 'center')} open={openY} onToggle={() => { setOpen(false); setOpenY((x) => !x); }} onPick={(x) => { setCfg?.(id, { alignY: x }); setOpenY(false); }}
            options={[['start', 'Top', <AlignStartHorizontal key="t" size={15} />], ['center', 'Middle', <AlignCenterHorizontal key="m" size={15} />], ['end', 'Bottom', <AlignEndHorizontal key="b" size={15} />], ['stretch', 'Stretch — words top, search bottom', <StretchVertical key="s" size={15} />]] as [string, string, ReactNode][]} />
        </>
      ) : (
        <AlignAxis axis={dir === 'row' ? 'v' : 'h'} value={align} options={A} open={open} onToggle={() => setOpen((x) => !x)} onPick={(x) => { setCfg?.(id, { align: x }); setOpen(false); }} />
      )}
    </div>
  );
}

/* ── GAP BANDS — Figma's pink spacing handles ────────────────────────────────────────────────────
 * Drawn between the direct children of a selected group (or, on the banner, between its text and
 * the widgets beside it). Each band shows the value; dragging one changes the gap for all of them,
 * exactly as the panel's Gap field does — the same key, so the two never disagree.
 * ⚠️ MEASURED from the rendered children, never computed from the value: alignment, wrapping and
 * hugging all decide where the space actually is. */
const GAP_PINK = '#FF24BD';
/* The built-in bands whose gap is draggable on the canvas. ⚠️ Each one must also mark the container it
   lays out in with `data-gap-parent="<its id>"` in the preview — the strips are measured off the real
   children, so a band that does not say which box arranges them simply has no strips. */
export const GAP_BAND_NODES = new Set(['quick', 'favourites', 'services', 'work', 'work-main', 'work-rail', 'records']);

function GapBands({ id, host }: { id: string; host: React.RefObject<HTMLDivElement | null> }) {
  const { cfg, setCfg } = useCanvas();
  const c = cfg?.(id) ?? {};
  /* On an ARRANGED banner the bands are the arrangement's, and they edit the Content group's gap. */
  const treeMode = id === 'hero' && !!host.current?.querySelector('[data-banner-root]');
  const isHero = id === 'hero' && !treeMode;
  const gapOwner = treeMode ? 'hero' : id;
  const dir = isHero ? 'row' : String(c.dir ?? 'column');
  const gap = isHero ? Number(c.sideGap ?? 32) : treeMode ? Number(c.sectionGapX ?? 20) : bannerGroupGap(gapOwner, c);
  /* The arrangement has TWO gaps: between side-by-side items and between stacked ones. */
  const gapY = treeMode ? Number(c.sectionGapY ?? 20) : gap;
  const gapFor = (d: string) => (treeMode && d === 'column' ? gapY : gap);
  /* A SECTION or a box in one: bands for every row and column inside it, each editing the gap of the box
     that lays it out — the columns' gap along a row, the rows' gap down a column. */
  const boxMode = /^sec-\d+(-b\d+)?$/.test(id);
  /* A built-in BAND — Quick Actions, the two service rows, the work and records rows.
   *
   * ⚠️ They were the one kind of container with NO bands: an added section had them, the banner had
   * them, and the rows that hold the product's own cards did not — so the one place a page is mostly
   * made of was the one place the gap could only be typed, and on the service rows not even that. The
   * band's gap is the SAME pair `secGapCss` renders (`colGap` / `rowGap`), so the pink strip and the
   * panel's Gap field write the same two numbers. */
  const bandMode = GAP_BAND_NODES.has(id);
  const [bands, setBands] = useState<{ x: number; y: number; w: number; h: number; dir: string; owner: string }[]>([]);
  const valueOf = (b: { dir: string; owner: string }) => (boxMode
    ? Number(cfg?.(b.owner)?.[b.dir === 'row' ? '__gapX' : '__gapY'] ?? 16)
    : bandMode
      ? Number(cfg?.(b.owner)?.[b.dir === 'row' ? 'colGap' : 'rowGap'] ?? 16)
      : gapFor(b.dir));
  const [drag, setDrag] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const sig = `${dir}|${gap}|${gapY}|${String(c.align ?? '')}|${JSON.stringify(cfg?.('hero')?.bannerTree ?? null)}|${JSON.stringify(cfg?.('hero')?.bannerBleed ?? null)}`;
  /* ⚠️ A node created and selected in the SAME render mounts these bands before its own element ref is
     attached (a child's layout effect runs first), so the first pass finds no host — try again next frame. */
  const [retry, setRetry] = useState(0);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) { const f = requestAnimationFrame(() => setRetry((n) => n + 1)); return () => cancelAnimationFrame(f); }
    const measure = () => {
      /* ⚠️ A band's own element can BE the box that lays its cards out — the work rail is a `Sel` with the
         gap on it — and `querySelectorAll` only ever returns DESCENDANTS, so those bands measured nothing
         and showed no strips at all. Look at the host itself first. */
      const ownParent = bandMode && el.matches(`[data-gap-parent="${id}"]`) ? el : null;
      const first = boxMode ? el.querySelector<HTMLElement>('[data-gap-parent^="sec-"]')
        : bandMode ? ownParent ?? el.querySelector<HTMLElement>(`[data-gap-parent="${id}"]`)
        : treeMode ? el.querySelector<HTMLElement>('[data-banner-root]')
        : isHero ? el.querySelector<HTMLElement>('[data-gap-parent="hero"]') : el;
      if (!first) { setBands([]); return; }
      /* The Content group's nested rows and columns share its one gap, so each gets its own bands. */
      const parents = boxMode
        ? Array.from(el.querySelectorAll<HTMLElement>('[data-gap-parent^="sec-"]'))
        /* A band can lay out in more than one container — the services row draws a grid of tiles under a
           heading, the work row a grid and a rail — so every container that carries this band's name gets
           its own strips. */
        : bandMode ? [...(ownParent ? [ownParent] : []), ...Array.from(el.querySelectorAll<HTMLElement>(`[data-gap-parent="${id}"]`))]
        : [...new Set([first, ...(treeMode ? Array.from(el.querySelectorAll<HTMLElement>('[data-gap-parent="hero-sections"]')) : [])])];
      const o = el.getBoundingClientRect();
      const next: { x: number; y: number; w: number; h: number; dir: string; owner: string }[] = [];
      for (const parent of parents) {
      const pdir = isHero ? 'row' : getComputedStyle(parent).flexDirection.startsWith('row') ? 'row' : 'column';
      /* ⚠️ A GRID is not a flex box, and `flexDirection` on one still reads "row" — its initial value — so
         two full-width cards STACKED in a grid were measured as though they sat side by side, and the strip
         came out as a thin vertical sliver down their right edge instead of a band between them. The same
         is true of a wrapped flex row, whose second line is stacked however the container is laid out.
         So a band's pairs are judged by GEOMETRY: whichever way two cards actually sit is the gap they
         have. Sorted in reading order — down, then across — for the same reason. */
      const geo = bandMode;
      const owner = parent.dataset.gapParent ?? id;
      const kids = Array.from(parent.children).filter((k): k is HTMLElement =>
        k instanceof HTMLElement && (k.hasAttribute('data-node') || k.hasAttribute('data-gap-item')) && k.getBoundingClientRect().width > 0);
      const rs = kids.map((k) => k.getBoundingClientRect()).sort((a, b) => (geo
        ? (Math.abs(a.top - b.top) > 2 ? a.top - b.top : a.left - b.left)
        : pdir === 'row' ? a.left - b.left : a.top - b.top));
      for (let i = 0; i < rs.length - 1; i++) {
        const a = rs[i];
        const b = rs[i + 1];
        /* Side by side when the next card starts after this one ACROSS and the two share any height. */
        const pairDir = geo ? (b.left >= a.right - 2 && b.top < a.bottom - 2 ? 'row' : 'column') : pdir;
        if (pairDir === 'row') {
          const top = Math.min(a.top, b.top);
          const bottom = Math.max(a.bottom, b.bottom);
          next.push({ x: a.right - o.left, y: top - o.top, w: Math.max(0, b.left - a.right), h: bottom - top, dir: pairDir, owner });
        } else {
          const left = Math.min(a.left, b.left);
          const right = Math.max(a.right, b.right);
          next.push({ x: left - o.left, y: a.bottom - o.top, w: right - left, h: Math.max(0, b.top - a.bottom), dir: pairDir, owner });
        }
      }
      }
      setBands((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.querySelectorAll('[data-node],[data-gap-item]')).forEach((k) => ro.observe(k));
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [host, isHero, treeMode, boxMode, bandMode, id, sig, retry]);

  const begin = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    const bdir = bands[i]?.dir ?? dir;
    const start = bdir === 'row' ? e.clientX : e.clientY;
    const band = bands[i];
    const from = band ? valueOf(band) : gapFor(bdir);
    setDrag(true);
    setHot(i);
    document.body.style.cursor = bdir === 'row' ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => {
      const d = (bdir === 'row' ? ev.clientX : ev.clientY) - start;
      const nextGap = Math.max(0, Math.min(200, Math.round(from + d)));
      if (boxMode && band) { setCfg?.(band.owner, bdir === 'row' ? { gapX: nextGap } : { gapY: nextGap }); return; }
      /* ⚠️ Through `gapPairX`/`gapPairY`, the keys the panel's own Gap field writes — `patchCfg`
         redirects those to `colGap`/`rowGap` for a band. Writing the final keys here instead would be a
         second route into the same value, and the day the redirect changes only one of them would follow. */
      if (bandMode && band) { setCfg?.(band.owner, bdir === 'row' ? { gapPairX: nextGap } : { gapPairY: nextGap }); return; }
      setCfg?.(gapOwner, isHero ? { sideGap: nextGap } : treeMode ? (bdir === 'column' ? { sectionGapY: nextGap } : { sectionGapX: nextGap }) : { gap: nextGap });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDrag(false);
      setHot(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <>
      {bands.map((b, i) => {
        const lit = drag || hot === i;
        const dir = b.dir;
        /* A zero gap still needs something to grab — the hit area never shrinks below 8px. */
        const hitW = dir === 'row' ? Math.max(b.w, 8) : b.w;
        const hitH = dir === 'row' ? b.h : Math.max(b.h, 8);
        return (
          <span
            key={i}
            data-gap-band
            onMouseDown={(e) => begin(e, i)}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => !drag && setHot(i)}
            onMouseLeave={() => !drag && setHot(null)}
            title={`Gap ${valueOf(b)}px — drag to change`}
            className="absolute z-40 flex items-center justify-center"
            style={{
              left: b.x + (b.w - hitW) / 2,
              top: b.y + (b.h - hitH) / 2,
              width: hitW,
              height: hitH,
              cursor: dir === 'row' ? 'ew-resize' : 'ns-resize',
              backgroundColor: lit ? 'rgba(255,36,189,0.14)' : 'transparent',
              backgroundImage: lit ? `repeating-linear-gradient(45deg, rgba(255,36,189,0.35) 0 1px, transparent 1px 6px)` : undefined,
            }}
          >
            {/* The short pink line Figma draws across the middle of a gap. */}
            <span
              className="pointer-events-none absolute rounded-full"
              style={dir === 'row'
                ? { width: 2, height: Math.min(16, Math.max(8, b.h * 0.3)), backgroundColor: GAP_PINK }
                : { height: 2, width: Math.min(16, Math.max(8, b.w * 0.3)), backgroundColor: GAP_PINK }}
            />
            {lit && (
              <span className="pointer-events-none absolute z-10 whitespace-nowrap rounded-sm px-1 text-[10px] font-semibold leading-[15px] text-white" style={{ backgroundColor: GAP_PINK }}>{valueOf(b)}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

/* ── Cropping the BANNER image ────────────────────────────────────────────────────────────────────
 * The whole picture is shown — faded where it runs past the banner, sharp inside it. Drag the picture to
 * move it, drag a corner to scale it (the opposite corner stays put), Fill / Fit for the two usual
 * answers. It writes `bannerCrop` = { scale: the picture's width as a % of the banner, x / y: where it
 * sits, as CSS background-position %s } live, so the banner behind updates as you drag. */
function BannerCropper({ hostRef, onClose }: { hostRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const { cfg, setCfg } = useCanvas();
  const hero = cfg?.('hero') ?? {};
  const src = String(hero.bannerImage ?? '');
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  useLayoutEffect(() => {
    const measure = () => {
      const host = hostRef.current;
      const band = host?.querySelector('[data-banner-band]');
      if (!host || !band) return;
      const hr = host.getBoundingClientRect();
      const br = band.getBoundingClientRect();
      setBox((p) => { const n = { l: br.left - hr.left, t: br.top - hr.top, w: br.width, h: br.height }; return p && JSON.stringify(p) === JSON.stringify(n) ? p : n; });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [hostRef]);
  /* Enter / Escape, or a press anywhere that is not the picture or its bar, finishes. */
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); };
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || barRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener('keydown', key);
    document.addEventListener('mousedown', down, true);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('mousedown', down, true); };
  }, [onClose]);
  if (!nat || !box) return null;

  const aspect = nat.h / nat.w;
  /* Cover: the picture as wide as the banner, or wider when that is what it takes to fill its height. */
  const coverScale = Math.max(1, box.h / aspect / box.w) * 100;
  const containScale = Math.min(1, box.h / aspect / box.w) * 100;
  const saved = hero.bannerCrop as { scale?: number; x?: number; y?: number } | undefined;
  const crop = { scale: Number(saved?.scale ?? coverScale), x: Number(saved?.x ?? 50), y: Number(saved?.y ?? 50) };
  const imgW = (box.w * crop.scale) / 100;
  const imgH = imgW * aspect;
  const left = ((box.w - imgW) * crop.x) / 100;
  const top = ((box.h - imgH) * crop.y) / 100;
  const write = (c: { scale: number; x: number; y: number }) => setCfg?.('hero', { bannerCrop: c });
  /* An offset → a background-position %. Clamped, so the picture never slides off an edge it can fill. */
  const pctOf = (off: number, free: number) => (Math.abs(free) < 0.5 ? 50 : Math.max(0, Math.min(100, (off / free) * 100)));

  const start = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const s = { left, top, w: imgW, h: imgH, scale: crop.scale };
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (mode === 'move') {
        write({ scale: s.scale, x: pctOf(s.left + dx, box.w - s.w), y: pctOf(s.top + dy, box.h - s.h) });
        return;
      }
      const grow = mode.includes('e') ? dx : -dx;
      const nw = Math.max(box.w * 0.2, s.w + grow);
      const nh = nw * aspect;
      const nl = mode.includes('w') ? s.left + (s.w - nw) : s.left;
      const nt = mode.includes('n') ? s.top + (s.h - nh) : s.top;
      write({ scale: (nw / box.w) * 100, x: pctOf(nl, box.w - nw), y: pctOf(nt, box.h - nh) });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* The sharp copy is clipped to the banner, measured from the picture's own box. */
  const clip = `inset(${-top}px ${imgW - box.w + left}px ${imgH - box.h + top}px ${-left}px)`;
  const corner = 'absolute size-[10px] rounded-[2px] border border-[#3D8BD0] bg-white';
  const barBtn = 'h-7 rounded px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]';
  return (
    <>
      <div
        ref={rootRef}
        data-banner-cropper=""
        onMouseDown={(e) => start(e, 'move')}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute z-[45] cursor-move outline outline-1 outline-[#3D8BD0]"
        style={{ left: box.l + left, top: box.t + top, width: imgW, height: imgH }}
      >
        <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full select-none opacity-40" />
        <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" style={{ clipPath: clip }} />
        <span onMouseDown={(e) => start(e, 'nw')} className={`${corner} -left-[5px] -top-[5px] cursor-nwse-resize`} />
        <span onMouseDown={(e) => start(e, 'ne')} className={`${corner} -right-[5px] -top-[5px] cursor-nesw-resize`} />
        <span onMouseDown={(e) => start(e, 'sw')} className={`${corner} -bottom-[5px] -left-[5px] cursor-nesw-resize`} />
        <span onMouseDown={(e) => start(e, 'se')} className={`${corner} -bottom-[5px] -right-[5px] cursor-nwse-resize`} />
      </div>
      {/* The banner's own edge, drawn over everything while cropping, so the frame the picture must fill is visible. */}
      <span className="pointer-events-none absolute z-[46] outline outline-2 outline-[#EC4899]" style={{ left: box.l, top: box.t, width: box.w, height: box.h }} />
      <div
        ref={barRef}
        data-portal-toolbar
        onClick={(e) => e.stopPropagation()}
        className="absolute z-[47] flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white p-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
        style={{ left: box.l + 8, top: box.t + 8 }}
      >
        <span className="px-2 text-[12px] text-[#7B8FA5]">Crop image</span>
        <span className="mx-0.5 h-4 w-px bg-[#E5E7EB]" />
        <button className={barBtn} onClick={() => write({ scale: coverScale, x: 50, y: 50 })}>Fill banner</button>
        <button className={barBtn} onClick={() => write({ scale: containScale, x: 50, y: 50 })}>Fit whole image</button>
        <button className={barBtn} onClick={() => setCfg?.('hero', { bannerCrop: undefined })}>Reset</button>
        <button className="h-7 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#2d6ca0]" onClick={onClose}>Done</button>
      </div>
    </>
  );
}

function ToolbarSlot({ toolbarBelow, children }: { toolbarBelow?: boolean | 'under'; children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      const bar = barRef.current;
      if (!anchor || !bar) return;
      const host = anchor.parentElement;
      if (!host) return;
      const el = host.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      /* The canvas, not the window: the design panel occupies the right of the screen, so a toolbar
         that merely fits the viewport can still sit underneath the panel. */
      const canvas = host.closest('[data-portal-canvas]') ?? document.body;
      const box = canvas.getBoundingClientRect();
      /* ⚠️ The canvas CARD is the horizontal bound and the wrong vertical one: it is the page
         itself, so it scrolls, and on a long page its top sits far above the screen. What is
         actually on view is the SCROLL PORT around it — so that is what holds the bar top and
         bottom. Clamping to the card let a scrolled banner take its toolbar up over the
         builder's top bar, which is exactly what the clamp exists to prevent. */
      let port: HTMLElement | null = canvas.parentElement as HTMLElement | null;
      while (port) {
        const o = getComputedStyle(port).overflowY;
        if (o === 'auto' || o === 'scroll') break;
        port = port.parentElement;
      }
      const view = (port ?? canvas).getBoundingClientRect();

      const GAP = 8;
      const above = el.top - b.height - 6;
      const below = el.bottom + 6;
      /* Above by default; below when there is no room — the banner's heading sits within 44px of
         the canvas top, and the overflow there is vertical, which no horizontal clamp can fix. */
      const wantBelow = toolbarBelow === 'under' || above < box.top + GAP;
      /* `true` means JUST INSIDE the element's own top edge — the banner's promise. Above it the bar lands on
         the builder's own top bar, which is not part of the canvas at all. */
      let top = toolbarBelow === true ? el.top + GAP : wantBelow ? below : above;

      let left = el.left;
      if (left + b.width > box.right - GAP) left = box.right - GAP - b.width;
      if (left < box.left + GAP) left = box.left + GAP;

      /* ⚠️ CLAMPED VERTICALLY TOO, and this is the whole reason the bar is worth measuring: it is
         `position: fixed` on the BODY, so nothing clips it. Left and right were held inside the
         canvas from the start, while the top was left to follow the element — so scrolling a tall
         selected element (a banner, a full-height column) carried its toolbar straight up out of
         the canvas and across the builder's top bar and the product header, painting over
         navigation it has nothing to do with. Held at the canvas's own edges it stays with the
         thing it belongs to.
         ⚠️ `minTop` wins the clamp: on a short canvas the two bounds cross, and of the two
         "just inside the top" is the one that keeps the bar reachable. */
      const minTop = view.top + GAP;
      const maxTop = view.bottom - GAP - b.height;
      top = Math.max(minTop, Math.min(top, maxTop));

      /* ⚠️ And GONE once the element itself has scrolled out of the canvas. A toolbar pinned to the
         canvas edge for an element nobody can see is a set of controls floating over somebody
         else's content — the selection is still real, so it comes back the moment the element
         does. */
      const onScreen = el.bottom > view.top + GAP && el.top < view.bottom - GAP;
      setPos(onScreen ? { top, left } : null);
    };
    place();
    /* Capture, so a scroll inside ANY ancestor moves it, not just the window. */
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [children, toolbarBelow]);

  return (
    <>
      {/* A zero-size marker left in the tree, so the toolbar can find the element it belongs to
          without that element having to pass its own rect down. */}
      <span ref={anchorRef} className="pointer-events-none absolute left-0 top-0 h-0 w-0" />
      {createPortal(
        <div
          ref={barRef}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
          className="z-[9999]"
        >{children}</div>,
        document.body,
      )}
    </>
  );
}

/* ── add-section seam ────────────────────────────────────────────────────── */

/** Wireframe tile drawn FROM the layout data, so it can't promise a shape you don't get. */
function LayoutTile({ rows }: { rows: number[][] }) {
  return (
    <span className="flex h-[34px] w-[46px] flex-col gap-[3px] rounded-[3px] border border-[#364658] p-[3px]">
      {rows.map((row, i) => (
        <span key={i} className="flex flex-1 gap-[3px]">
          {row.map((w, j) => <span key={j} style={{ flex: w }} className="rounded-[1px] border border-[#364658]" />)}
        </span>
      ))}
    </span>
  );
}

/* The seam between two sections: an invisible strip that becomes a blue bar on hover, carrying the
   "+ Add Section" pill and a drag grip for stretching the section above it. */
export function AddSectionSeam({ afterId }: { afterId: string }) {
  const { enabled, addSection, setStyle, dropAtSeam, moveToSeam, hoverId, tourSeam } = useCanvas();
  const [hover, setHover] = useState(false);
  const [picking, setPicking] = useState(false);
  const [live, setLive] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);

  /* The bar IS the bottom edge of the block above — dragging it stretches that block. */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      const h = Math.max(60, Math.round(drag.current.h + (e.clientY - drag.current.y)));
      setStyle(afterId, { height: h });
      setLive(h);
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      setLive(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [afterId, setStyle]);

  /* Clicking away closes the picker — that replaces the Back arrow, which was a second way to do
     what dismissing already does. */
  useEffect(() => {
    if (!picking) return;
    const away = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) { setPicking(false); setHover(false); }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPicking(false); setHover(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [picking]);

  if (!enabled) return null;

  const beginResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = document.querySelector(`[data-node="${afterId}"]`);
    if (!prev) return;
    drag.current = { y: e.clientY, h: prev.getBoundingClientRect().height };
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  /* The seam belongs to the section ABOVE it, so hovering anywhere in that section offers the
     "+ Add Section" CTA — hunting for a hairline between two bands is a worse way to find "add a
     section here" than simply being over the section you want to add after.
     ⚠️ The blue rule is NOT part of that offer: it is the section's bottom EDGE, i.e. the resize
     handle. Drawing it across the page every time the pointer crossed a section made the canvas
     flash a thick line on every move, for a grip nobody had reached for. It appears only once you
     are actually at the seam, beside the CTA — where dragging it is the next thing you'd do. */
  const withinSection = hoverId === afterId;
  const held = tourSeam === afterId;
  const showPill = hover || picking || withinSection || !!live || held;
  const showLine = hover || picking || !!live || held;

  return (
    <div
      /* The tour picks the first seam on the page and reads which block it follows off this. */
      data-tour="seam"
      data-seam-after={afterId}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      /* Dropping on the seam builds its own section — an element doesn't have to be aimed into an
         existing one, which would make adding anything a two-step job. */
      /* ⚠️ A seam takes an element being MOVED as well as one being added. "Drop it anywhere and
         it finds a home" has to include the gap between two blocks — that is the most obvious place
         to aim at when what you want is "put it here, on its own". */
      onDragOver={(e) => {
        const t = e.dataTransfer.types;
        if (t.includes('text/portal-element') || t.includes(MOVE_MIME)) { e.preventDefault(); setDropping(true); }
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        setDropping(false);
        const moving = draggedNode(e);
        const type = draggedElement(e);
        if (!moving && !type) return;
        e.preventDefault();
        e.stopPropagation();
        if (moving) moveToSeam(moving, afterId); else dropAtSeam(afterId, type!);
      }}
      className={`relative z-30 -my-1 h-3 ${dropping ? 'z-40' : ''}`}
    >
      {dropping && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-[#3D8BD0] shadow-[0_0_0_4px_rgba(61,139,208,0.25)]" />
      )}
      {showLine && (
        <>
          {/* The bar IS the section's bottom edge — drag it to stretch. */}
          <div
            onMouseDown={beginResize}
            className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 cursor-ns-resize bg-[#3D8BD0]"
            title="Drag to resize the section above"
          >
            <span className="absolute right-[18%] top-1/2 -translate-y-1/2 text-white/70"><GripHorizontal size={14} /></span>
          </div>
          {live !== null && (
            <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
              {live}px
            </span>
          )}
        </>
      )}
      {showPill && (
        /* ⚠️ The stretch handle rides WITH the CTA rather than only on the hairline. Dragging the
           seam has always worked, but you had to find a 5px strip to discover it — so the one
           gesture that resizes a section was the least visible thing on the canvas. Pairing it with
           the button people already aim at makes both reachable from the same place. */
        <span className="absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          <button
            onClick={() => setPicking((p) => !p)}
            className="inline-flex h-7 items-center rounded-full bg-[#3D8BD0] px-3.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"
          >+ Add Section</button>
          <span
            onMouseDown={beginResize}
            data-tip="Drag to stretch the section above"
            title="Drag to stretch the section above"
            /* The same ns-resize cursor the panel's own stretch handles use — one gesture, one
               cursor, wherever you meet it. */
            className="inline-flex size-7 cursor-ns-resize items-center justify-center rounded-full bg-[#3D8BD0] text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"
          ><UnfoldVertical size={14} /></span>
        </span>
      )}

      {picking && (
        /* Always above the CTA. A seam near the page bottom had nowhere to open downward, and a
           picker that sometimes flips is harder to aim at than one that never moves. */
        <div ref={popRef} className="absolute bottom-7 left-1/2 z-40 w-[430px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
          <div className="mb-3 text-center text-[13px] font-medium text-[#364658]">Choose a layout for your section</div>
          <div className="grid grid-cols-5 gap-2">
            {SECTION_LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => { addSection(afterId, l.rows); setPicking(false); setHover(false); }}
                className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-[#F1F5F9]"
              ><LayoutTile rows={l.rows} /></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The `+` affordances on an empty column: sides insert a sibling column, centre adds an element. */
/** Add a column — a solid track beside a dashed one waiting to be filled.
 *
 * ⚠️ Drawn rather than borrowed from the icon set. Every "+" in a lucide-shaped glyph says *add
 * something*; this has to say *add a COLUMN*, and the only way a small mark says that is by showing
 * the tracks. The dashed one is the new column, so mirroring the icon on the left button makes it
 * point the way it will actually grow.
 *
 * ⚠️ Artwork supplied by the designer — a 24-unit box with a NARROW solid track and a WIDER dashed
 * one. The first attempt drew two equal tracks at 16 units, which read as a busy grid rather than
 * "here, and one more beside it": at this size the difference between the two columns has to be the
 * loudest thing in the glyph. Keep the geometry; only the rendered size varies. */
function ColumnAddIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="6.5" height="18" rx="1.5" />
      <rect x="12.5" y="3" width="8.5" height="18" rx="1.5" strokeDasharray="3 2.6" />
      <path d="M16.75 10v4M14.75 12h4" />
    </svg>
  );
}

/* An EMPTY cell on the banner, made by its + adders. It asks what goes here and becomes it; on the
   published portal it draws nothing. */
export function BannerSlot({ id }: { id: string }) {
  const { enabled, replaceElement, placedPredefined } = useCanvas();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  if (!enabled) return null;
  return (
    <div ref={ref} className="flex min-h-[88px] w-full items-center justify-center rounded-lg border border-dashed border-white/60 bg-white/10">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((x) => !x); }}
        className="flex h-8 items-center gap-1.5 rounded bg-white px-3 text-[12px] font-medium text-[#364658] shadow-sm transition-colors hover:text-[#3D8BD0]"
      ><Plus size={14} /> Add to banner</button>
      {open && (
        <ElementPicker
          only={BANNER_SIDE_WIDGETS}
          allow={notPlaced(placedPredefined)}
          mode="add"
          onPick={(t) => { setOpen(false); replaceElement(id, t); }}
          onClose={() => setOpen(false)}
          anchorRef={ref}
          targetId={id}
        />
      )}
    </div>
  );
}

export function ColumnAdders({ columnId, filled, onSide, outer }: {
  columnId: string; filled?: boolean; onSide?: (side: 'left' | 'right' | 'top' | 'bottom') => void;
  /* ⚠️ The BANNER's four adders take the OUTER track — a quarter of the way down each edge instead of the
     middle — because the section inside it sits at the same edges and its adders were landing on the same
     four points. Two controls on one point go to whichever painted last, which is how "add a column beside
     the banner" kept adding a section inside it. Both are still offered; they no longer overlap. */
  outer?: boolean;
}) {
  const { addBeside, addInside } = useCanvas();
  /* ⚠️ ONE component for both callers. A built-in band that has never been split is not a box yet,
     so its four handles run `splitBand` instead of `addBeside` — but they have to be the same
     four handles, in the same places, with the same words, or "add a column to the right" would
     mean one thing on a band and another one box down. */
  const act = onSide ?? ((side: 'left' | 'right' | 'top' | 'bottom') => addBeside(columnId, side));
  /* ⚠️ SECONDARY buttons — white, bordered, dark icon — not blue dots. Adding a column is a
     structural move made while you are looking at content, and three blue dots on a live column
     competed with the page for attention every time the cursor passed over it. A secondary control
     is the honest weight for something you reach for occasionally and deliberately. */
  const side = 'flex size-6 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#1E293B] shadow-sm transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]';

  /* ⚠️ FOUR adders, and the SIDE decides what you get: left and right add a COLUMN beside this box,
     top and bottom add a ROW above or below it. One control, one meaning, at every level.
     They used to be two, chosen by the PARENT's axis — so the same button added a column here and a
     row one level down, and on a section laid out as columns there was no way to ask for a row at
     all. The tree wraps a box when the axis it is asked for is not the one it is in, which is what
     makes the promise keepable everywhere rather than only where the shape already agreed.
     ⚠️ A new row arrives FULL WIDTH and empty. Subdividing it is the same four buttons again, one
     level in — you are never asked to choose a layout before you have anything to lay out. */
  const along = outer ? 'top-1/4' : 'top-1/2';
  const across = outer ? 'left-1/4' : 'left-1/2';
  const what = outer ? ' beside the banner' : '';
  const sides = [
    { side: 'top' as const, title: outer ? 'Add a row above the banner' : 'Add a row above', cls: `${side} absolute -top-3 ${across} z-20 -translate-x-1/2`, spin: '-rotate-90' },
    { side: 'left' as const, title: `Add a column to the left${what}`, cls: `${side} absolute -left-3 ${along} z-20 -translate-y-1/2`, spin: '-scale-x-100' },
    { side: 'right' as const, title: `Add a column to the right${what}`, cls: `${side} absolute -right-3 ${along} z-20 -translate-y-1/2`, spin: '' },
    { side: 'bottom' as const, title: outer ? 'Add a row below the banner' : 'Add a row below', cls: `${side} absolute -bottom-3 ${across} z-20 -translate-x-1/2`, spin: 'rotate-90' },
  ];

  return (
    <>
      {sides.slice(0, 2).map((s) => (
        <button
          key={s.side}
          onClick={(e) => { e.stopPropagation(); act(s.side); }}
          title={s.title}
          className={s.cls}
        ><span className={s.spin}><ColumnAddIcon size={15} /></span></button>
      ))}

      {/* The middle one swaps the right panel to the element library — the list you pick from is
          the answer to "add what?", so it takes the panel rather than opening a second surface. */}
      {/* ⚠️ Only on an EMPTY column. On a filled one it would sit on top of the element it is
          offering to replace, and a column holds one thing — so the side adders, which make room
          rather than compete for it, are the whole offer there. */}
      {!filled && (
        <button
          onClick={(e) => { e.stopPropagation(); addInside(columnId); }}
          title="Add an element here"
          className="absolute left-1/2 top-1/2 z-20 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#3D8BD0] text-white shadow-sm transition-colors hover:bg-[#2d6ca0]"
        ><Plus size={14} /></button>
      )}

      {sides.slice(2).map((s) => (
        <button
          key={s.side}
          onClick={(e) => { e.stopPropagation(); act(s.side); }}
          title={s.title}
          className={s.cls}
        ><span className={s.spin}><ColumnAddIcon size={15} /></span></button>
      ))}
    </>
  );
}

/* ── selection wrapper ───────────────────────────────────────────────────── */

export function Sel({ id, children, className = '', toolbarBelow = false, surfaceOff = false, style: baseStyle }: {
  id: string;
  children: ReactNode;
  className?: string;
  /* The node draws its surface somewhere INSIDE itself, so this wrapper must not draw one too.
     ⚠️ Set by a card whose heading has moved onto the page: the wrapper then holds the heading AND
     the card, so a fill painted here tints the words outside the card and a border draws a box
     around a heading that is meant to be outside one. Only the SURFACE is withheld — width, height
     and margin stay, because those say where the card sits, which has not changed. */
  surfaceOff?: boolean;
  /* Where the toolbar goes when there is no room above the element.
     `true`  — just inside its own top edge, for a tall band like the hero whose top strip is empty.
     'under' — fully below its bottom edge, for a short dense bar like the portal's top navigation,
               where "just inside the top" is directly on top of the logo and the actions. */
  toolbarBelow?: boolean | 'under';
  /** Layout defaults from the page (a row member's default share). sizeOf overrides these. */
  style?: React.CSSProperties;
}) {
  /* ⚠️ `setStyle` belongs here. `beginFree` calls it, and without it the free-drag threw a
     ReferenceError on the very first mousedown — swallowed into the console, so the handler looked
     attached, the cursor looked right, and nothing moved. Three attempts at fixing the drag failed
     because I was reading the rendered output instead of the console. */
  const { enabled, selectedId, hoverId, select, setHover, styles, setStyle, moveTo, setText, splitBand, bandHosted, addBannerCell, cfg: readCfg, moveToBanner, dropIntoBanner } = useCanvas();
  /* The banner's image is being cropped (double-click the banner). */
  const [cropping, setCropping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [moveOver, setMoveOver] = useState(false);
  const node = nodeById(id);
  /* Frame selected vs. editing the words inside it — see INLINE text formatting. */
  const [editing, setEditing] = useState(false);
  /* Bumped after the words are committed, so the text is REBUILT from what was stored rather than React
     reconciling against DOM the browser's formatting commands have already rearranged. */
  const [textVer, setTextVer] = useState(0);
  const editRef = useRef<HTMLDivElement>(null);
  const isOn = selectedId === id;
  useEffect(() => { if (!isOn) setEditing(false); }, [isOn]);
  /* Clicking anywhere that is not these words, their toolbar or a popover it opened ends the edit. */
  useEffect(() => {
    if (!editing) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (editRef.current?.contains(t) || t?.closest?.('[data-portal-toolbar],[data-portal-popover]')) return;
      commitWordsRef.current?.();
      setEditing(false);
    };
    document.addEventListener('mousedown', down, true);
    return () => document.removeEventListener('mousedown', down, true);
  }, [editing]);
  const commitWordsRef = useRef<(() => void) | null>(null);
  /* ⚠️ A TEXT node also renders `containerCss`, which is where bold / italic / underline / size /
     colour from the floating toolbar live. Every other node type has a call site that spreads
     `st(id)` itself, but a text child of a placed element has none — so the toolbar wrote its
     styles and nothing ever read them back, and pressing B on a selected card subtitle did exactly
     nothing. Restricted to text so a container cannot pick up a second background here. */
  /* ⚠️ SPACING is spread for EVERY node, not just text. The Spacing matrix writes padding and
     margin into styles[id] for whatever is selected, but only the text branch below ever read that
     back — so seventeen of the eighteen catalogue elements had a Spacing control that stored its
     value and painted nothing. The rest of containerCss stays behind the text gate on purpose: a
     card paints its own background and border from its config, and spreading those here would give
     it a second surface underneath the one it draws. */
  /* Applied whole, for every kind. It used to be text-only, which is why the call sites each
     grew their own copy — and why removing theirs would have broken everything but text. */
  /* ⚠️ An element that paints its own card keeps its padding and height OFF this wrapper — the card
     applies them itself, so the space lands inside the border and a dragged height grows the card
     rather than cropping it. Margin and width stay here: those are about where the element sits and
     how much room it takes, which is the wrapper's business either way. */
  const ownSurface = paintsOwnSurface(id) || id === 'hero';
  const ownShadow = paintsOwnShadow(id);
  /* ⚠️ PADDING only. Height used to be withheld here too, and that is what made a dragged handle
     resize the wrong thing on most of the catalogue: the wrapper kept its natural size while the
     card inside was left to honour the number itself, which only `Surface` ever did — a Table, an
     Accordion, an Image, a Video and every collection ignored it completely, so their handles moved
     the outline and nothing else. The wrapper carries the height for every kind now and the painted
     content fills it, which is the same rule the banner follows.
     Padding stays withheld, and for the original reason: padding on a wrapper is grey space AROUND
     a card, not breathing room inside it. */
  /* ⚠️ The SHADOW is withheld from the wrapper for the same reason as padding: the wrapper is a
     square box around a rounded card, so a shadow here showed square corners behind round ones —
     and the card paints the same shadow itself, so leaving it here drew it twice as dark. */
  const isSurface = (k: string) => k.startsWith('background') || k.startsWith('border') || k === 'boxShadow' || k.startsWith('padding');
  const drop = (x: React.CSSProperties): React.CSSProperties =>
    Object.fromEntries(Object.entries(x).filter(([k]) => !(ownSurface && k.startsWith('padding')) && !(ownShadow && k === 'boxShadow') && !(surfaceOff && isSurface(k))));
  const size = {
    ...baseStyle,
    ...drop(sizeOf(styles, id)),
    ...drop(styleOf(styles, id)),
  };
  /* ⚠️ A dragged height now STRETCHES its content instead of cropping it. The old box was
     `overflow-hidden`, so a taller Button was a 36px button with 80px of nothing under it and a
     taller Text block simply hid its own last lines — the element you dragged never changed size,
     only the amount of it you could see. "Resize the widget, not the box around it" is the whole
     point of a handle, so the child is made a flex item that fills the height that was set.
     ⚠️ On an INNER box, not the wrapper: the floating toolbar at `-top-11` and the handles at
     `-3px` are children of the wrapper, so anything applied there reaches them too — which is how
     clipping used to eat a widget's own toolbar the moment it had a height.
     ⚠️ `[&>*]` reaches the ONE root each renderer draws. It has to be a descendant selector rather
     than a class on that root, because those roots live in a dozen different components and half of
     them are collection renderers this file cannot see. */
  /* ⚠️ WIDTH counts as sized, not only height. A Button hugs its own text (`HUGS_CONTENT`), so
     dragging its side widened the wrapper and left the button the size of its label sitting in the
     corner of a big empty selection — the same "the outline moved and the thing did not" the height
     fix was for, on the other axis.
     ⚠️ The child is stretched on the axis that was actually SET. `flex-1` fills the height and is
     applied only when a height exists, because on an unsized box it would stretch a button to
     whatever its neighbour happens to be; `w-full` fills the width the same way. */
  const hasH = styles[id]?.height !== undefined;
  const hasW = styles[id]?.widthPct !== undefined || styles[id]?.width !== undefined;
  /* ⚠️ NEVER for the banner's auto-layout groups. The wrapper becomes the children's flex parent, so the
     direction, gap and alignment the group sets on its own box stop reaching them: dragging the Text & Search
     section narrower left its search pinned to the left edge while the heading stayed centred. A group is a
     flex container in its own right — it carries the size itself. */
  const body = (hasH || hasW) && !BANNER_GROUPS.has(id)
    ? (
      <div className={`flex min-h-0 w-full flex-1 flex-col ${hasH ? '[&>*]:min-h-0 [&>*]:flex-1 ' : ''}${hasW ? '[&>*]:w-full' : ''}`}>
        {children}
      </div>
    )
    : children;
  /* ⚠️ A shared tile id renders once PER TILE, so its toolbar would paint four times. Only the FIRST
     tile on the page carries it — measured after mount, since which one is first is a DOM fact.
     ⚠️ ABOVE the early return below: hooks after a conditional return change count between renders
     ("Rendered fewer hooks than expected") and blank the whole canvas. */
  const [firstTile, setFirstTile] = useState(false);
  useEffect(() => {
    if (!enabled || !/-tile$/.test(id) || !isServiceTile(id)) return;
    setFirstTile(document.querySelector(`[data-node="${id}"]`) === ref.current);
  });
  if (!enabled || !node) return <div style={size} className={className}>{node?.kind === 'text' && !node.rich ? richify(body) : body}</div>;

  const on = selectedId === id;
  const hov = hoverId === id && !on;
  /* One of the banner's items — the Text group, the Search, or a widget placed on the banner. */
  const heroItem = id === 'hero-content' || (/^el-\d+$/.test(id) && nodeById(id)?.parent === 'hero');
  const sharedTile = /-tile$/.test(id);

  /* ⚠️ FREE PLACEMENT, banner children only. Everything else on this page is laid out — a card is in
     a row, a row is in a section — and letting those be dragged anywhere would break the layout that
     makes them line up. The banner is the one block that is a CANVAS rather than a stack: its
     heading, subtext and search have no siblings to align with, so where they sit is the design.
     Stored as a % of the band so the placement survives the banner being made taller or the panel
     being dragged. */
  /* ⚠️ …but NOT on a SHAPED banner. There the heading, subheading and search are blocks in the banner's
     rows, and pinning one at an absolute spot takes it out of those rows — it floats over its
     neighbours and no longer moves with them. A shaped banner's parts are MOVED instead: their drag
     carries the block (`dragIdOf`) into another row or column. */
  const bannerPart = /^hero-(title|subtitle|search)$/.test(id) && dragIdOf(id) !== id;
  /* ⚠️ OFF: the heading, subheading and search are laid out by their auto-layout GROUPS now, and pinning one
     at an absolute spot would take it out of the group it belongs to. */
  const freePlaced = false as boolean;
  const free = styles[id];
  const freeStyle: React.CSSProperties = freePlaced && (free?.freeX !== undefined || free?.freeY !== undefined)
    ? { position: 'absolute', left: `${free?.freeX ?? 50}%`, top: `${free?.freeY ?? 50}%`, transform: 'translate(-50%, -50%)', margin: 0 }
    : {};

  /* ⚠️ The WHOLE element is the handle, not only the grip. `cursor: move` was painted across the
     block while a 24px dot was the one thing that actually moved it — so the affordance promised
     something the element did not do: you pressed the heading, dragged, and nothing happened.
     ⚠️ A 4px THRESHOLD is what lets grabbing anywhere coexist with inline editing. Under 4px the
     press stays a click and the caret lands where you pressed; past it the press becomes a drag.
     Arming on mousedown alone would make the text uneditable, and requiring the grip made the
     banner feel stuck. And while the text IS being edited we stay out entirely, so selecting a
     word still selects a word rather than flinging the heading across the banner. */
  const beginFree = (e: React.MouseEvent, immediate = false) => {
    if (!freePlaced || !enabled) return;
    const host = ref.current;
    if (!immediate && host && document.activeElement instanceof HTMLElement
      && host.contains(document.activeElement) && document.activeElement.isContentEditable) return;
    /* ⚠️ Resolved from the DOCUMENT, not from this node upward. Walking up with `closest` was
       silently returning null — the grip is portalled outside its own wrapper in the stacking order —
       and a null band made the whole drag return before it registered a single listener, which is why
       the handler was attached and nothing ever moved. There is exactly one banner on a page. */
    const band = document.querySelector('[data-node="hero"]') as HTMLElement | null;
    if (!band) return;
    e.stopPropagation();
    if (immediate) e.preventDefault();
    const box = band.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    let live = immediate;
    const arm = () => { select(id); document.body.style.cursor = 'move'; document.body.style.userSelect = 'none'; };
    const apply = (ev: MouseEvent) => setStyle(id, {
      freeX: Math.max(4, Math.min(96, Math.round(((ev.clientX - box.left) / box.width) * 100))),
      freeY: Math.max(6, Math.min(94, Math.round(((ev.clientY - box.top) / box.height) * 100))),
    });
    const move = (ev: MouseEvent) => {
      if (!live) {
        if (Math.abs(ev.clientX - sx) < 4 && Math.abs(ev.clientY - sy) < 4) return;
        live = true;
        arm();
      }
      apply(ev);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (immediate) arm();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const ring = on
    ? 'outline-2 outline-[#3D8BD0]'
    : hov ? 'outline-1 outline-[#3D8BD0]/60' : 'outline-1 outline-transparent';

  return (
    <div
      ref={ref}
      data-node={id}
      /* ⚠️ A BAND lays its own cards out, so its element IS the box the gap strips are measured in.
         `Sel` does not forward unknown props, so marking it at the call site did nothing at all — the
         attribute simply never reached the DOM and the rail and the work grid showed no strips. */
      data-gap-parent={GAP_BAND_NODES.has(id) ? id : undefined}
      style={{ ...size, ...freeStyle }}
      /* ⚠️ `cursor: move` — the four-arrow glyph — so the affordance is visible before the drag,
         not discovered by trying. It is the one cursor that means "pick this up and put it
         anywhere", which is exactly what this element can do and what its neighbours cannot. */
      onMouseDown={freePlaced ? beginFree : undefined}
      /* The banner's SEARCH is not edited in place, so the whole field is its drag handle — press it and drag it into another row. */
      draggable={enabled && bannerPart && id === 'hero-search' ? true : undefined}
      onDragStart={enabled && bannerPart && id === 'hero-search' ? (e) => { e.stopPropagation(); e.dataTransfer.setData(MOVE_MIME, dragIdOf(id)); e.dataTransfer.effectAllowed = 'move'; } : undefined}
      onMouseOver={(e) => { e.stopPropagation(); setHover(id); }}
      onMouseOut={(e) => { e.stopPropagation(); setHover(null); }}
      onClick={(e) => { e.stopPropagation(); select(id); }}
      onDoubleClick={id === 'hero' ? (e) => {
        /* Double-clicking the banner's BACKGROUND (not a word or a widget on it) crops its image. */
        if ((e.target as Element).closest('[data-node]')?.getAttribute('data-node') !== 'hero') return;
        const h = readCfg?.('hero') ?? {};
        if (h.bgKind === 'color' || !h.bannerImage) { toast('Add a banner image to crop it — the image button on the banner toolbar'); return; }
        e.stopPropagation();
        select('hero');
        setCropping(true);
      } : undefined}
      /* Grip-drag drop target. The dragged id is unreadable during dragover, so accept broadly
         here and let moveTo decide whether the two are actually siblings. */
      onDragOver={(e) => {
        /* ⚠️ ON THE BANNER a NEW element from the library is accepted too — the banner has no columns of its
           own to drop into, so its cells and its background are the drop targets. */
        const onBannerArea = id === 'hero' || !!(e.currentTarget as HTMLElement).closest('[data-banner-cell]');
        const fromLibrary = e.dataTransfer.types.includes('text/portal-element');
        if (!e.dataTransfer.types.includes(MOVE_MIME) && !(fromLibrary && onBannerArea)) return;
        e.preventDefault();
        e.stopPropagation();
        setMoveOver(true);
      }}
      onDragLeave={() => setMoveOver(false)}
      onDrop={(e) => {
        setMoveOver(false);
        /* The banner cell this drop landed in (a widget, the text group, the search, an empty slot) — or the
           banner's own background. Those go to the banner's arrangement rather than to a page list. */
        const cell = (e.currentTarget as HTMLElement).closest('[data-banner-cell]') as HTMLElement | null;
        const bannerAnchor = cell?.dataset.bannerCell ?? (id === 'hero' ? 'hero' : null);
        const type = draggedElement(e);
        if (type && bannerAnchor) {
          e.preventDefault();
          e.stopPropagation();
          dropIntoBanner?.(type, bannerAnchor);
          return;
        }
        const src = draggedNode(e);
        if (!src || src === id) return;
        e.preventDefault();
        e.stopPropagation();
        if (bannerAnchor && moveToBanner) { moveToBanner(src, bannerAnchor); return; }
        moveTo(src, id);
      }}
      /* No display change here — call sites pass their own layout classes (the header is a flex
         row), so forcing flex-col on every wrapper would rearrange the page. The painted child
         gets the same minHeight instead, which keeps the two boxes the same size. */
      className={`relative outline -outline-offset-1 transition-[outline-color] ${ring} ${freePlaced && enabled && on ? 'cursor-move' : ''} ${className}`}
    >
      {/* Name chip on HOVER only. Once selected, the toolbar and handles say what you have, and the
          panel's breadcrumb handles stepping up — a chip on top of that is one label too many. */}
      {hov && !sharedTile && (
        <span
          /* Sits fully ABOVE the element, clear of its top edge. Straddling the border put the
             chip inside the card and covered the content it was meant to label. */
          /* ⚠️ SECONDARY, not primary. Blue is this builder's "you did something / this is active"
             colour — a blue chip on every hover competed with the actual selection for attention,
             on an element you had not chosen yet. Slate says the same word more quietly.
             ⚠️ The step-up chevron is gone with it: the chip is pointer-events-none, so the arrow
             was never clickable — it looked like a control and behaved like an illustration. Moving
             up a level is the panel breadcrumb's job, where it actually works. */
          /* ⚠️ An OUTLINE chip on white — the secondary treatment, matching every other quiet
             control in this builder. A filled badge of any colour reads as a state you have entered;
             this is a label for something the pointer is merely passing over. */
          className={`pointer-events-none absolute left-0 z-30 flex items-center rounded-sm border border-[#DFE5ED] bg-white px-1.5 text-[10px] font-medium leading-[16px] text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${
            toolbarBelow === 'under' ? 'top-full' : toolbarBelow ? 'top-0' : '-top-[18px]'
          }`}
        >
          {node.name}
        </span>
      )}

      {moveOver && <span className="pointer-events-none absolute inset-0 z-30 rounded ring-2 ring-[#3D8BD0] ring-offset-2" />}

      {/* On a shaped banner the same badge is a real DRAG handle for the block — drop it on any row. */}
      {on && bannerPart && enabled && (
        <span
          draggable
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData(MOVE_MIME, dragIdOf(id));
            e.dataTransfer.effectAllowed = 'move';
          }}
          title="Drag to move into another row or column of the banner"
          className="absolute -top-3 left-1/2 z-40 flex size-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#3D8BD0] bg-white text-[#3D8BD0] shadow-sm active:cursor-grabbing"
        ><Move size={13} /></span>
      )}
      {on && freePlaced && (
        <span
          onMouseDown={(e) => beginFree(e, true)}
          title="Drag to place this anywhere in the banner"
          className="absolute -top-3 left-1/2 z-40 flex size-6 -translate-x-1/2 cursor-move items-center justify-center rounded-full border border-[#3D8BD0] bg-white text-[#3D8BD0] shadow-sm"
        ><Move size={13} /></span>
      )}
      {/* ⚠️ Not on data cards: every tile in a widget is ONE node, so handles, a toolbar or a name chip
          would paint once per tile. The outline alone says all of them are selected. */}
      {/* ⚠️ A group HUGS its items, so it has no size of its own to drag — no handles. */}
      {/* ⚠️ NO handles on a banner ROW or COLUMN. The banner sizes the columns of a row by WEIGHT
          (`weight()` in the preview), so a dragged `widthPct` would be a number nothing reads — the
          handle would move and the column would not. Stretching them needs weights in the tree first. */}
      {/* ⚠️ A structural banner ROW (`hero-bx-`) has none: the banner sizes those by WEIGHT, so a
          dragged width would be a number nothing reads. A GATHERED ROW (`hero-gp-`) keeps them —
          its padding now sits on a wrapper outside it, so the node itself is free to take a width,
          a height and a top margin, and every one of those lands. */}
      {on && !sharedTile && !/^hero-bx-/.test(id) && <SelectionHandles id={id} elRef={ref} />}
      {/* ⚠️ The banner's ITEMS get the four + adders the section boxes have, on hover — left/right put an
          empty cell beside the item as a column, top/bottom as a row. Hover, not selection, for the reason
          the box adders give: a selected item carries resize handles on these very edges. */}
      {enabled && heroItem && !on && !!hoverId && nodePath(hoverId).some((n) => n.id === id) && (
        <ColumnAdders columnId={id} filled onSide={(side) => addBannerCell?.(id, side)} />
      )}
      {/* Figma's pink gap bands: on a selected group, and on the banner once widgets sit beside its text. */}
      {/* ⚠️ NO GAP BANDS. Gap stopped being a control at all — the pink strips went the same day the
          ~13 panel fields did, so a section's spacing is now the design's rather than a number on
          every block. What is left for arranging two sections inside a parent is the alignment
          menu's STRETCH, which spreads them to the parent's edges (`space-between`) instead of
          filling them; the space between the two IS the answer, and there is one way to set it.
          `GapBands` and the `colGap` / `rowGap` / `gapX` / `gapY` keys all stay and are all still
          READ, so every page keeps the spacing it has and restoring the strips is this one line. */}

      {/* ⚠️ A built-in band gets the SAME four handles an empty box does — that is the whole point
          of hosting it in a section tree. This branch covers only the FIRST split, while the band
          is still a plain block; once it is hosted, the box holding it draws its own adders and
          this one steps aside (`bandHosted`), or both would paint on the same four edges.
          ⚠️ HOVER, not selection — the rule a box's adders already follow, and for the same reason:
          a selected node carries eight resize handles on these very edges, and two controls on one
          point go to whichever painted last. Matched against the PATH so hovering something inside
          the band still counts as hovering the band. */}
      {enabled && SPLITTABLE_BANDS.has(id) && !bandHosted?.(id)
        && !(selectedId && nodePath(selectedId).some((n) => n.id === id))
        && !!hoverId && nodePath(hoverId).some((n) => n.id === id) && (
        <ColumnAdders columnId={id} filled onSide={(side) => splitBand?.(id, side)} />
      )}

      {/* ⚠️ The BANNER gets no floating toolbar. It is the full-width block behind everything else,
          so its bar had nowhere to sit that was not on top of its own heading — and every action it
          carried (background, stretch, whole-page, padding, delete) is a panel decision, not a
          nudge you make while looking at the page. Its handles stay: size is the one thing you do
          want to judge by eye. */}
      {/* ⚠️ Product chrome gets no floating toolbar — the banner, the left rail, the top bar and
          everything the bar contains. Every action on it (move, duplicate, align, delete) is either
          disabled or a lie over navigation the admin does not own. */}
      {on && enabled && id === 'hero' && !cropping && (
        <ToolbarSlot toolbarBelow={toolbarBelow}><BannerToolbar /></ToolbarSlot>
      )}
      {/* ⚠️ The banner's OWN four adders, on hovering the banner itself — left/right add a column at the
          banner's edge, top/bottom a row. Its items keep theirs, which add beside the item. */}
      {/* ⚠️ The banner's edge + adds a PAGE column beside (or row above/below) the banner — it hosts the band in a
          section, the way every built-in band splits. Sections INSIDE the banner come from its toolbar's + and
          from the + beside each section. */}
      {enabled && id === 'hero' && !on && !cropping && hoverId === 'hero' && !bandHosted?.('hero') && (
        <ColumnAdders columnId="hero" filled outer onSide={(side) => splitBand?.('hero', side)} />
      )}
      {cropping && <BannerCropper hostRef={ref} onClose={() => setCropping(false)} />}
      {on && enabled && BANNER_GROUPS.has(id) && (
        <ToolbarSlot><GroupToolbar id={id} /></ToolbarSlot>
      )}
      {on && (!sharedTile || firstTile) && id !== 'hero' && !BANNER_GROUPS.has(id) && id !== 'rail' && !/^header/.test(id) && (
        <ToolbarSlot toolbarBelow={toolbarBelow}>
          {/* ⚠️ A PLACED text gets BOTH bars; a text CHILD gets only the formatting one.
              The rule used to be "kind === text → formatting bar", which is right for a widget's
              heading or a card's subtitle — those are words inside something else and there is no
              element there to move, copy or delete. A dropped Text element is a different thing
              wearing the same kind: it is a widget in its own right, and with only the formatting
              bar it could not be duplicated, replaced, reordered or even deleted from the canvas at
              all. Two questions are being asked of it — "what do these words look like" and "what
              is this block doing here" — so it carries the two bars that answer them.
              ⚠️ Formatting on TOP, element bar underneath and nearest the element. The lower bar is
              the one that points at the thing it acts on, and the element bar is the one whose
              actions move it. */}
          {/* ⚠️ A placed Text shows its ELEMENT toolbar while its frame is selected, and swaps to the TEXT
              toolbar once you click into the words — two bars stacked put the formatting controls in front
              of you before you had chosen any words to format. A text child has no element to move, so it
              keeps the text toolbar in both modes, formatting the whole line or just the selected words. */}
          {node.kind === 'text' && !isContactChild(id) ? (
            /^el-[0-9]+$/.test(id) && !editing
              ? <ElementToolbar id={id} kind={node.kind} name={node.name} />
              : <TextToolbar id={id} editing={editing} />
          ) : <ElementToolbar id={id} kind={node.kind} name={node.name} />}
        </ToolbarSlot>
      )}

      {/* ── Inline editing ──────────────────────────────────────────────────────
          A selected TEXT node becomes editable in place, so the words can be changed where you are
          looking at them rather than only in the panel.

          ⚠️ It writes on BLUR, not on every keystroke. React re-rendering a contentEditable while
          you type puts the caret back at the start — the bug this codebase already hit twice, in
          the approval-comment editor and the rich composer. Blur-sync means the sidebar catches up
          the moment you click away, and the caret never moves under you.
          ⚠️ `suppressContentEditableWarning` is required because the children ARE React nodes; the
          alternative is rendering the text as a bare string and losing its styling. */}
      {on && node.kind === 'text' ? (
        <div
          key={textVer}
          ref={editRef}
          data-inline-edit={id}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            /* ⚠️ The commit reads the EDITOR, so it is (re)bound here where the editor exists. */
            commitWordsRef.current = () => {
              const el = editRef.current;
              if (!el) return;
              /* ⚠️ A RICH node commits its markup whole. A plain line commits the markup INSIDE its innermost
                 text element (so a heading does not store its own <h2> wrapper), and only when the words carry
                 formatting of their own — otherwise the plain words, exactly as before. */
              let value: string;
              if (node.rich) value = el.innerHTML;
              else {
                let leaf: Element = el;
                while (leaf.children.length === 1 && ![...leaf.childNodes].some((c) => c.nodeType === 3 && (c.textContent ?? '').trim())) leaf = leaf.children[0];
                value = leaf.querySelector('span,b,i,u,strong,em,font') ? leaf.innerHTML : (el.textContent ?? '').trim();
              }
              setText(id, value);
              setTextVer((x) => x + 1);
            };
            setEditing(true);
          }}
          onBlur={() => {
            /* A blur caused by pressing the toolbar or its popover is not the end of the edit. */
            if (toolbarPointer) return;
            commitWordsRef.current?.();
            setEditing(false);
          }}
          onKeyDown={(e) => {
            /* Enter commits a LABEL and breaks a line in a PARAGRAPH. A caption is prose; a heading
               is not, and inserting a line break into one is never what Enter meant there. */
            if (e.key === 'Enter' && !node.rich) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
            if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur();
          }}
          className="outline-none"
        >{node.rich ? children : richify(children)}</div>
      ) : node.kind === 'text' && !node.rich ? richify(body) : body}
    </div>
  );
}
