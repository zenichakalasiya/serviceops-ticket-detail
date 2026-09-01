import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WIDGET_FOR_NODE, WIDGET_FOR_TYPE, specById } from './portalWidgetSpec';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical,
  AlignLeft, AlignRight, AlignStartHorizontal, AlignStartVertical, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUp, Baseline, Bold, Check, ChevronDown, ChevronRight, Columns2, Copy, GripHorizontal, GripVertical, Italic, Link2, Rows2,
  Braces, Highlighter, Maximize2, UnfoldVertical, Move, MoveHorizontal, MoveVertical, Plus, RemoveFormatting,
  Replace, SquareDashed, Trash2, Underline, X,
} from 'lucide-react';
// ArrowLeft stays in use by the card toolbar's "Move left".
import { toast } from 'sonner';
import { HEADING_SIZE, PORTAL_FONTS, SECTION_LAYOUTS, TEXT_STYLES, ZERO_BOX, COMPOSABLE, boxInfo, canAddBeside, defaultAlignH, nodeById, paintsOwnSurface, toolbarCaps, nodePath, placedIn, placedType } from './portalPageModel';
import { DEFAULT_THEME } from './PortalThemePanel';
import type { PortalTheme } from './PortalThemePanel';
import { boxCss, containerCss } from './portalStyleResolver';
import { PORTAL_ELEMENTS, PORTAL_ELEMENT_GROUPS } from './supportPortalData';
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
  /** The Quick Actions row's one addable card — see `toolbarCaps`. */
  addLinkCard?: () => void;
  /** ⚠️ The seam the first-run tour is pointing at, held open while its card is on screen. A seam
   *  is a hover affordance — it is 12px of nothing until the pointer finds it — so the one step
   *  that exists to say "this is here" would otherwise spotlight an empty gap. */
  tourSeam?: string | null;
  /** Drops into a built-in row, alongside the cards already there. */
  dropInRow: (rowId: string, elementType: string) => void;
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

const Ctx = createContext<CanvasCtx>({
  enabled: false, selectedId: null, hoverId: null,
  select: () => {}, setHover: () => {}, styles: {}, setStyle: () => {}, setText: () => {}, setCfg: () => {},
  addSection: () => {}, addBeside: () => {}, dropBeside: () => {}, columnsFull: () => false, dropInColumn: () => {}, dropAtSeam: () => {}, dropInRow: () => {}, moveToSeam: () => {}, addChildBlock: () => {},
  moveNode: () => {}, duplicateNode: () => {}, deleteNode: () => {}, canDuplicate: () => false, addInside: () => {},
  moveTo: () => {}, areSiblings: () => false, replaceElement: () => {}, pickIcon: () => {},
  theme: DEFAULT_THEME,
});

/** Reads a dragged catalogue element off a drop event, or null when it isn't one of ours. */
export const draggedElement = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-element') || null;
/** Reads a node being dragged by its grip. Same caveat: only readable on `drop`. */
export const draggedNode = (e: React.DragEvent) => e.dataTransfer.getData('text/portal-move') || null;
export const MOVE_MIME = 'text/portal-move';

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
  if (s.alignY !== undefined) {
    css.alignSelf = ({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const)[s.alignY];
  }
  if (s.align === 'stretch') { css.flexGrow = 1; css.width = '100%'; }
  if (s.margin) {
    /* ⚠️ Per side, and only where set — an unset side must not emit 0 and beat the class. */
    if (s.margin.top !== undefined) css.marginTop = `${s.margin.top}px`;
    if (s.margin.bottom !== undefined) css.marginBottom = `${s.margin.bottom}px`;
    if (s.margin.left !== undefined) css.marginLeft = `${s.margin.left}%`;
    if (s.margin.right !== undefined) css.marginRight = `${s.margin.right}%`;
  }
  return css;
}

/* ── toolbars ────────────────────────────────────────────────────────────── */

const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
/** How far an element may ride up over the one above it. */
const MAX_OVERLAP = 120;

const btnOn = 'flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]';

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

function ElementPicker({ mode, onPick, onClose, only }: {
  mode: 'add' | 'replace'; onPick: (type: string) => void; onClose: () => void;
  /** A container's own block types. When present this IS the list — see the note below. */
  only?: { type: string; label: string }[];
}) {
  const [q, setQ] = useState('');
  if (only?.length) {
    return (
      <>
        <span className="fixed inset-0 z-[60]" onClick={onClose} />
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-1/2 top-[calc(100%+8px)] z-[61] w-[200px] -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
        >
          {/* ⚠️ No search. Three options do not need one, and a search box over three rows is a
              control that costs a line to say nothing. */}
          {only.map((ct) => (
            <button
              key={ct.type}
              onClick={() => onPick(ct.type)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            ><Plus size={13} className="text-[#9CA3AF]" /> {ct.label}</button>
          ))}
        </div>
      </>
    );
  }
  const groups = PORTAL_ELEMENT_GROUPS.map((g) => ({
    group: g,
    items: PORTAL_ELEMENTS.filter((e) => e.group === g && !e.onPage
      && (!q || `${e.name} ${e.keywords ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
  })).filter((g) => g.items.length);

  return (
    <>
      {/* Clicking anywhere else closes it — a popover that only closes from its own ✕ is a modal
          pretending not to be one. */}
      <span className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-[calc(100%+8px)] z-[61] max-h-[340px] w-[260px] -translate-x-1/2 overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10),0_4px_6px_-2px_rgba(16,24,40,0.06)]"
      >
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
        {!groups.length && <p className="px-3 py-4 text-center text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
      </div>
    </>
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
      e.dataTransfer.setData(MOVE_MIME, id);
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
  const { styles, setStyle, moveNode, duplicateNode, deleteNode, canDuplicate, addInside, replaceElement, addChildBlock, splitNode, splitInfo, addLinkCard, addSibling } = useCanvas();
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [axis, setAxis] = useState<'h' | 'v' | null>(null);
  const caps = toolbarCaps(id);

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
  const sixOnly = composable ? COMPOSABLE.map((t) => ({ type: t, label: elementLabel(t) })) : undefined;
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
      className="relative flex items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1 py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.06),0_12px_16px_-4px_rgba(16,24,40,0.10)]"
    >
      {tip && (
        <span
          style={{ left: tip.x }}
          className="pointer-events-none absolute top-full z-[80] mt-1.5 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[11px] leading-[16px] text-white shadow-[0_4px_10px_rgba(16,24,40,0.18)]"
        >{tip.label}</span>
      )}
      {/* The grip drags the element itself — pick it up here, drop it on a sibling to reorder. */}
      <span
        {...useNodeDragHandle(id)}
        data-tip="Drag to move"
        className="flex size-7 cursor-grab items-center justify-center text-[#9CA3AF] active:cursor-grabbing"
      ><GripVertical size={14} /></span>
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
        <div className="relative">
          <button className={btn} data-tip="Add a widget beside this one" onClick={() => setAdding((v) => !v)}>
            <Plus size={15} />
          </button>
          {adding && (
            <ElementPicker
              only={sixOnly}
              mode="add"
              onPick={(type) => { setAdding(false); addSibling?.(id, type); }}
              onClose={() => setAdding(false)}
            />
          )}
        </div>
      )}
      {caps.add !== false && (canAdd || placed || kind === 'card') && (
        <div className="relative">
          <button
            className={btn}
            data-tip={childTypes?.length && !sixOnly ? 'Add a block inside' : swaps ? 'Replace widget' : 'Add widget'}
            onClick={() => setPicking((v) => !v)}
          >{swaps ? <Replace size={15} /> : <Plus size={15} />}</button>
          {picking && (
            <ElementPicker
              /* On the six, Replace offers the six. Everywhere else it offers what it always did. */
              only={sixOnly ?? (swaps ? undefined : childTypes)}
              mode={swaps ? 'replace' : 'add'}
              onPick={(type) => {
                setPicking(false);
                if (childTypes?.length && !sixOnly) addChildBlock(id, type);
                else if (swaps && swapTarget) replaceElement(swapTarget, type);
                else addInside(id, type);
              }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
      )}
      {/* ⚠️ The button's STYLE, on the toolbar. It is the one thing about a button an admin changes
          more than once while looking at the page — the panel still owns everything else, so this is
          a shortcut to one field rather than a second place the value lives. */}
      {placedType(id) === 'b-button' && <ButtonStyleMenu id={id} />}
      {/* The one thing you author on these without opening the panel. */}
      {(placedType(id) === 'b-accordion' || placedType(id) === 'c-faq') && (
        <AddItemMenu id={id} type={placedType(id)!} />
      )}
      {placedType(id) === 'v-image' && <CaptionMenu id={id} />}
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
      <button
        className="flex size-7 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
        data-tip="Delete"
        onClick={() => deleteNode(id)}
      ><Trash2 size={14} /></button>
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

function SelectionHandles({ id, elRef }: { id: string; elRef: React.RefObject<HTMLDivElement | null> }) {
  const { styles, setStyle } = useCanvas();
  const [live, setLive] = useState<{ kind: 'size' | 'padY' | 'padX' | 'gap'; label: string } | null>(null);
  const drag = useRef<{
    kind: 'size' | 'padY' | 'padX' | 'gap'; corner: string; x: number; y: number;
    w: number; h: number; pad: SpacingBox; gap: number; parentW: number;
    /** How tall this element may become before it outgrows the section holding it. */
    maxH: number;
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
        if (horiz && d.fixed) {
          const px = d.corner.includes('w') ? d.w - dx : d.w + dx;
          /* ⚠️ The ceiling is this card's OWN TRACK, not the row's free space. A fixed row is a grid
             of equal tracks, so a card cannot borrow width from a neighbour even when the neighbour
             is not using it — which is the whole promise of Fixed, and it makes the clamp a local
             fact rather than a sum over siblings that a single wrap could poison.
             ⚠️ The percentage is OF THE TRACK too, because that is what `width: N%` resolves
             against inside a grid cell. Measured against the row it would come out four times too
             small on a four-column band. */
          const room = Math.max(MIN_COL, d.track - 1);
          const v = Math.max(MIN_COL, Math.min(room, Math.round(px)));
          /* ⚠️ `flex` is cleared in the same write. It is the Fill representation, it is read FIRST
             by `sizeOf`, and a leftover from an earlier Fill drag would win over the width you are
             setting right now — the handle would move and the column would not. */
          setStyle(id, {
            widthPct: Math.max(1, Math.floor((v / Math.max(d.track, 1)) * 1000) / 10),
            flex: undefined,
            width: undefined,
          });
          setLive({ kind: 'size', label: `${v}px` });
        } else if (horiz && d.inRow && d.siblings.length > 1) {
          const total = d.widths.reduce((a, b) => a + b, 0);
          const i = d.index;
          const floor = 60;
          const target = Math.max(floor, Math.min(d.widths[i] + (d.corner.includes('w') ? -dx : dx), total - floor * (d.siblings.length - 1)));
          const rest = total - target;
          const othersTotal = total - d.widths[i];
          d.siblings.forEach((sib, j) => {
            const w = j === i ? target : othersTotal > 0 ? (d.widths[j] / othersTotal) * rest : rest / (d.siblings.length - 1);
            /* ⚠️ `widthPct` cleared alongside — it is the Fixed representation, and `sizeOf` reads
               `flex` first only for as long as nothing else claims the width. A column that was
               dragged while the row was Fixed has to rejoin the row when it goes back to Fill. */
            setStyle(sib, { flex: Math.round(w), widthPct: undefined, width: undefined });
          });
          setLive({ kind: 'size', label: `${Math.round((target / total) * 100)}% of row` });
        } else if (horiz) {
          const px = d.corner.includes('w') ? d.w - dx : d.w + dx;
          patch.widthPct = Math.max(5, Math.min(100, Math.round((px / Math.max(d.parentW, 1)) * 100)));
          setLive({ kind: 'size', label: `${patch.widthPct}% of parent` });
        }

        /* ⚠️ Clamped to the SECTION, not to the viewport. A widget taller than the band holding it
           either spills over the block below it or silently stretches the band — both of which mean
           the height you dragged is not the height you get. The ceiling is captured once at
           mousedown: the section's own height follows its tallest child, so measuring it live would
           let the element chase a limit it was itself pushing upward. */
        /* ⚠️ The TOP BAR grows by padding, not by height. Its contents are a logo and a row of
           controls, both vertically centred — giving the band a taller height just pushes empty
           space to the outside of them, which is not what "make the navbar taller" means. Adding
           padding moves the bar's own edges away from its contents, so the bar breathes instead of
           the page gaining a gap. Half the drag per side, so the edge tracks the cursor. */
        if (id === 'header' && (d.corner.includes('s') || d.corner.includes('n'))) {
          const delta = d.corner.includes('n') ? -dy : dy;
          const v = Math.max(0, Math.min(64, Math.round(d.pad.top + delta / 2)));
          patch.padding = { ...d.pad, top: v, bottom: v };
          setLive({ kind: 'padY', label: `${v}px` });
        } else {
          if (d.corner.includes('s')) patch.height = Math.max(24, Math.min(d.maxH, Math.round(d.h + dy)));
          if (d.corner.includes('n')) patch.height = Math.max(24, Math.min(d.maxH, Math.round(d.h - dy)));
        }
        if (Object.keys(patch).length) {
          setStyle(id, patch);
          if ((!horiz || d.siblings.length <= 1) && !d.fixed) {
            setLive({ kind: 'size', label: `${patch.width ?? Math.round(d.w)} × ${patch.height ?? Math.round(d.h)}` });
          }
        }
      } else if (d.kind === 'gap') {
        /* One level of negative: far enough to sit an element over the band above it, not so far
           that it can be dragged off the top of the page and lost. */
        const v = Math.max(-MAX_OVERLAP, Math.min(240, Math.round(d.gap + dy)));
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
      parentW: el.parentElement?.getBoundingClientRect().width ?? r.width,
      siblings: row.map((c) => c.dataset.node!),
      widths: row.map((c) => c.getBoundingClientRect().width),
      index: row.indexOf(el),
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
    <span className="pointer-events-none absolute inset-0 z-20">
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
          ⚠️ It goes NEGATIVE by one step (down to -120px), which is what lets a card ride
          up over the band above it — the overlap the hero's action cards already use, offered to
          everything else rather than hard-coded in one place. */}
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

function TextToolbar({ id }: { id: string }) {
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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseOver={readTip}
      onMouseMove={readTip}
      onMouseLeave={() => setTip(null)}
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

      <button className={tBtn(s.bold)} data-tip="Bold" onClick={() => setStyle(id, { bold: !s.bold })}><Bold size={14} /></button>
      <button className={tBtn(s.italic)} data-tip="Italic" onClick={() => setStyle(id, { italic: !s.italic })}><Italic size={14} /></button>
      <button className={tBtn(s.underline)} data-tip="Underline" onClick={() => setStyle(id, { underline: !s.underline })}><Underline size={14} /></button>

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
        onChange={(e) => setStyle(id, { font: e.target.value || undefined })}
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
        onChange={(e) => setStyle(id, { fontSize: Number(e.target.value) })}
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
          onChange={(v) => setStyle(id, { color: v })}
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
          onChange={(v) => setStyle(id, { textBg: v })}
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
        onClick={() => {
          setStyle(id, { bold: undefined, italic: undefined, underline: undefined, color: undefined, fontSize: undefined, heading: undefined, align: undefined });
          toast.success('Formatting cleared');
        }}
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

      const GAP = 8;
      const above = el.top - b.height - 6;
      const below = el.bottom + 6;
      /* Above by default; below when there is no room — the banner's heading sits within 44px of
         the canvas top, and the overflow there is vertical, which no horizontal clamp can fix. */
      const wantBelow = toolbarBelow === 'under' || above < box.top + GAP;
      const top = wantBelow ? below : above;

      let left = el.left;
      if (left + b.width > box.right - GAP) left = box.right - GAP - b.width;
      if (left < box.left + GAP) left = box.left + GAP;

      setPos({ top, left });
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

export function ColumnAdders({ columnId, filled }: { columnId: string; filled?: boolean }) {
  const { addBeside, addInside } = useCanvas();
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
  const sides = [
    { side: 'top' as const, title: 'Add a row above', cls: `${side} absolute -top-3 left-1/2 z-20 -translate-x-1/2`, spin: '-rotate-90' },
    { side: 'left' as const, title: 'Add a column to the left', cls: `${side} absolute -left-3 top-1/2 z-20 -translate-y-1/2`, spin: '-scale-x-100' },
    { side: 'right' as const, title: 'Add a column to the right', cls: `${side} absolute -right-3 top-1/2 z-20 -translate-y-1/2`, spin: '' },
    { side: 'bottom' as const, title: 'Add a row below', cls: `${side} absolute -bottom-3 left-1/2 z-20 -translate-x-1/2`, spin: 'rotate-90' },
  ];

  return (
    <>
      {sides.slice(0, 2).map((s) => (
        <button
          key={s.side}
          onClick={(e) => { e.stopPropagation(); addBeside(columnId, s.side); }}
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
          onClick={(e) => { e.stopPropagation(); addBeside(columnId, s.side); }}
          title={s.title}
          className={s.cls}
        ><span className={s.spin}><ColumnAddIcon size={15} /></span></button>
      ))}
    </>
  );
}

/* ── selection wrapper ───────────────────────────────────────────────────── */

export function Sel({ id, children, className = '', toolbarBelow = false, style: baseStyle }: {
  id: string;
  children: ReactNode;
  className?: string;
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
  const { enabled, selectedId, hoverId, select, setHover, styles, setStyle, moveTo, setText } = useCanvas();
  const ref = useRef<HTMLDivElement>(null);
  const [moveOver, setMoveOver] = useState(false);
  const node = nodeById(id);
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
  const ownSurface = paintsOwnSurface(id);
  /* ⚠️ PADDING only. Height used to be withheld here too, and that is what made a dragged handle
     resize the wrong thing on most of the catalogue: the wrapper kept its natural size while the
     card inside was left to honour the number itself, which only `Surface` ever did — a Table, an
     Accordion, an Image, a Video and every collection ignored it completely, so their handles moved
     the outline and nothing else. The wrapper carries the height for every kind now and the painted
     content fills it, which is the same rule the banner follows.
     Padding stays withheld, and for the original reason: padding on a wrapper is grey space AROUND
     a card, not breathing room inside it. */
  const drop = (x: React.CSSProperties): React.CSSProperties =>
    (ownSurface ? Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('padding'))) : x);
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
  const body = hasH || hasW
    ? (
      <div className={`flex min-h-0 w-full flex-1 flex-col ${hasH ? '[&>*]:min-h-0 [&>*]:flex-1 ' : ''}${hasW ? '[&>*]:w-full' : ''}`}>
        {children}
      </div>
    )
    : children;
  if (!enabled || !node) return <div style={size} className={className}>{body}</div>;

  const on = selectedId === id;
  const hov = hoverId === id && !on;

  /* ⚠️ FREE PLACEMENT, banner children only. Everything else on this page is laid out — a card is in
     a row, a row is in a section — and letting those be dragged anywhere would break the layout that
     makes them line up. The banner is the one block that is a CANVAS rather than a stack: its
     heading, subtext and search have no siblings to align with, so where they sit is the design.
     Stored as a % of the band so the placement survives the banner being made taller or the panel
     being dragged. */
  const freePlaced = /^hero-(title|subtitle|search)$/.test(id);
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
      style={{ ...size, ...freeStyle }}
      /* ⚠️ `cursor: move` — the four-arrow glyph — so the affordance is visible before the drag,
         not discovered by trying. It is the one cursor that means "pick this up and put it
         anywhere", which is exactly what this element can do and what its neighbours cannot. */
      onMouseDown={freePlaced ? beginFree : undefined}
      onMouseOver={(e) => { e.stopPropagation(); setHover(id); }}
      onMouseOut={(e) => { e.stopPropagation(); setHover(null); }}
      onClick={(e) => { e.stopPropagation(); select(id); }}
      /* Grip-drag drop target. The dragged id is unreadable during dragover, so accept broadly
         here and let moveTo decide whether the two are actually siblings. */
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(MOVE_MIME)) return;
        e.preventDefault();
        e.stopPropagation();
        setMoveOver(true);
      }}
      onDragLeave={() => setMoveOver(false)}
      onDrop={(e) => {
        setMoveOver(false);
        const src = draggedNode(e);
        if (!src || src === id) return;
        e.preventDefault();
        e.stopPropagation();
        moveTo(src, id);
      }}
      /* No display change here — call sites pass their own layout classes (the header is a flex
         row), so forcing flex-col on every wrapper would rearrange the page. The painted child
         gets the same minHeight instead, which keeps the two boxes the same size. */
      className={`relative outline -outline-offset-1 transition-[outline-color] ${ring} ${freePlaced && enabled && on ? 'cursor-move' : ''} ${className}`}
    >
      {/* Name chip on HOVER only. Once selected, the toolbar and handles say what you have, and the
          panel's breadcrumb handles stepping up — a chip on top of that is one label too many. */}
      {hov && (
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

      {on && freePlaced && (
        <span
          onMouseDown={(e) => beginFree(e, true)}
          title="Drag to place this anywhere in the banner"
          className="absolute -top-3 left-1/2 z-40 flex size-6 -translate-x-1/2 cursor-move items-center justify-center rounded-full border border-[#3D8BD0] bg-white text-[#3D8BD0] shadow-sm"
        ><Move size={13} /></span>
      )}
      {on && <SelectionHandles id={id} elRef={ref} />}

      {/* ⚠️ The BANNER gets no floating toolbar. It is the full-width block behind everything else,
          so its bar had nowhere to sit that was not on top of its own heading — and every action it
          carried (background, stretch, whole-page, padding, delete) is a panel decision, not a
          nudge you make while looking at the page. Its handles stay: size is the one thing you do
          want to judge by eye. */}
      {/* ⚠️ Product chrome gets no floating toolbar — the banner, the left rail, the top bar and
          everything the bar contains. Every action on it (move, duplicate, align, delete) is either
          disabled or a lie over navigation the admin does not own. */}
      {on && id !== 'hero' && id !== 'rail' && !/^header/.test(id) && (
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
          {node.kind === 'text' ? (
            /^el-[0-9]+$/.test(id) ? (
              <span className="flex flex-col items-center gap-1">
                <TextToolbar id={id} />
                <ElementToolbar id={id} kind={node.kind} name={node.name} />
              </span>
            ) : <TextToolbar id={id} />
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
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            /* ⚠️ A RICH node commits its markup. Reading textContent here would throw away the
               bold, the link and the list the moment you clicked away — the formatting would apply
               while you looked at it and vanish when you stopped. */
            const el = e.currentTarget as HTMLElement;
            setText(id, node.rich ? el.innerHTML : (el.textContent ?? '').trim());
          }}
          onKeyDown={(e) => {
            /* Enter commits a LABEL and breaks a line in a PARAGRAPH. A caption is prose; a heading
               is not, and inserting a line break into one is never what Enter meant there. */
            if (e.key === 'Enter' && !node.rich) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
            if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur();
          }}
          className="outline-none"
        >{children}</div>
      ) : body}
    </div>
  );
}
