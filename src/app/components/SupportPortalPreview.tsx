import { Fragment, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Bell, Check, Info, Keyboard, KeyRound, House, MessageSquare, MessagesSquare, Plus, PanelLeft,
  Link2, RotateCcw, Search, ShoppingCart, Type, X, ChevronsRight, LayoutGrid,
  HardDrive, Server,
} from 'lucide-react';
import { AnnouncementsRender, ContactRender, FavouriteServicesRender, FeaturedServicesRender } from './PortalCollectionRender';
import { MotadataLogo } from './Header';
import { AiSparkle } from './AiSparkle';
import {
  IconRequest, IconChange, IconAssets, IconCMDB, IconKnowledge, IconMyApproval, IconMyTeam, IconTask,
} from './SidebarIcons';
import {
  PORTAL_APPROVALS, PORTAL_ARTICLES, PORTAL_OPEN_REQUESTS, statusTone,
} from './supportPortalData';
import { AddSectionSeam, ColumnAdders, MOVE_MIME, Sel, draggedElement, draggedNode, styleOf, useCanvas } from './PortalCanvas';
import { HUGS_CONTENT } from './portalPageModel';
import { PAGE_ID, chosen, roleStyle } from './portalStyleResolver';
import { shadowCss } from './PortalBoxControls';
import { PortalPlacedElement } from './PortalPlacedElement';
import { DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER, fillCss, isBranch, nodePath, isLockedRow, hasFixedTitle, rowOf } from './portalPageModel';
import type { Box, BoxDir, CustomSection, PlacedElement, PortalPageContent } from './portalPageModel';
import { iconNode, isImageChoice } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';

/* The Support Portal page — what an end user sees, rendered inside the builder canvas.
 *
 * Everything editable comes from `content`, and every selectable block wraps itself in <Sel>. That
 * is what makes an edit in the right-hand panel show up here immediately: there is one source for
 * the value and the canvas is just a view of it. */

interface SupportPortalPreviewProps {
  accent?: string;
  content?: PortalPageContent;
  /** Sections the admin has added, keyed to the block they sit after. */
  sections?: { afterId: string; section: CustomSection }[];
  /** Per-placed-element icon and text, so a configured element stops looking blank. */
  icons?: Record<string, IconChoice | undefined>;
  placedText?: Record<string, { title?: string; desc?: string }>;
  /** Page order and membership, rewritten by the toolbar move/delete actions. */
  blockOrder?: string[];
  rowOrder?: Record<string, string[]>;
  removed?: string[];
  /** Elements dropped into a built-in row, rendered after that row's own cards. */
  rowExtras?: Record<string, PlacedElement[]>;
  /* ⚠️ A BLANK portal — started from scratch rather than from a template. The product's own chrome
     stays (the top bar and the left rail are undeletable navigation; a portal with no way to reach
     My Requests is not a portal) and everything that is PAGE CONTENT goes: no banner, no action
     cards, no data widgets, no seeded sections. What is left says so and offers the first block. */
  blank?: boolean;
  /* The work-band members that stack into a right-hand RAIL instead of standing as cards of their
     own, in the order they stack. Undefined means the flat row every layout had before.
     ⚠️ A LIST, not a boolean. The rail is three specific blocks in a specific order, and the page
     that wants it should say which — a flag would have put the choice in the renderer, where the
     next layout that wants a different rail could not reach it. */
  rail?: string[];
  /* The page's own background image, set in Theme › Home page background. The page paints it on the
     theme wrapper; this is here only so the BANNER can stand aside for it — a full-bleed artwork
     under an opaque band is an upload nobody can see. */
  pageImage?: string;
  /* Resolved widget config per node (spec §9). Every field in the drawer reads back through this,
     which is what makes "live apply" real — a control that looks right and changes nothing teaches
     people to distrust the panel. */
  cfg?: (id: string) => Record<string, unknown>;
  /* Writes a widget's config back. Only the header uses it so far — the logo's placement is a drag
     on the CANVAS, and a drag has to commit where the panel's fields commit or the two disagree. */
  setCfg?: (id: string, patch: Record<string, unknown>) => void;
}

/* ── how a widget's config reaches its rendering ─────────────────────────── */

const EMPTY_CFG: Record<string, unknown> = {};

/* The 9-point picker maps onto text-align plus auto margins — the block moves AND its text follows,
   which is what "content alignment" means on a banner. */
const heroAlignX = (p: string): 'left' | 'center' | 'right' =>
  (p.includes('left') ? 'left' : p.includes('right') ? 'right' : 'center');
const heroML = (p: string) => (p.includes('left') ? '0' : 'auto');
const heroMR = (p: string) => (p.includes('right') ? '0' : 'auto');

/** A list card's chrome, resolved through the inheritance chain (P4). */
function useListChrome(id: string) {
  const { styles } = useCanvas();
  const density = chosen(styles, id, 'density') ?? 'comfortable';
  return {
    dividers: chosen(styles, id, 'dividers') !== false,
    gap: chosen(styles, id, 'gap'),
    rowPad: density === 'compact' ? 6 : 10,
  };
}

/* An added section: rows of equal-height columns, each empty until something is dropped in. The
   grey `+` is the resting affordance; selecting or hovering the column reveals the blue ones that
   split it left/right. */
/* A built-in row that accepts drops.
 *
 * Every section takes an element, not just the ones an admin added — otherwise "add anything
 * anywhere" is only true in half the page. A drop lands in that row alongside the cards already
 * there, sharing the row the same way they do. */
function RowDrop({ rowId, className, style, resize, children }: {
  rowId: string; className: string; style?: React.CSSProperties; children: ReactNode;
  /** 'fill' | 'fixed' — read back by the resize handles off this element. */
  resize?: string;
}) {
  const { dropInRow } = useCanvas();
  const [over, setOver] = useState(false);
  /* ⚠️ A locked row does not call preventDefault on dragover, so the cursor stays "no drop" the whole
     way across it. Accepting the drag and then refusing the drop would tell you it worked right up
     until the moment it didn't. */
  const locked = isLockedRow(rowId);
  return (
    <div
      style={style}
      data-resize={resize}
      onDragOver={(e) => {
        if (locked) return;
        if (e.dataTransfer.types.includes('text/portal-element')) { e.preventDefault(); setOver(true); }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const type = draggedElement(e);
        setOver(false);
        if (!type || locked) return;
        e.preventDefault();
        e.stopPropagation();
        dropInRow(rowId, type);
      }}
      className={`${className} ${over ? 'rounded outline-2 outline-dashed -outline-offset-4 outline-[#3D8BD0]' : ''}`}
    >{children}</div>
  );
}

/* ── the blue placement line ────────────────────────────────────────────────
 *
 * Duda's visual language, measured off its live editor, with our own edge-drop mechanic behind it.
 * Three layers at once, because a line alone says WHERE and not WHAT IT LANDS INSIDE: with columns
 * side by side, a line at a boundary is ambiguous until the box around it is outlined.
 *
 * ⚠️ The line is inset to the CONTENT box, not the border box. A line running the full width reads
 * as belonging to the section rather than to the box it is actually about.
 *
 * ⚠️ The orientation rule is not a preference, it is what the geometry means: a line ACROSS a stack
 * is horizontal, a line WITHIN a row is vertical. */
const LINE = '#188DF8';

type Zone = 'left' | 'right' | 'above' | 'below' | 'in';

/* ⚠️ 8px of HYSTERESIS on every boundary: once a zone is entered the pointer must travel 8px back
   out of it before the line switches. Without this the line strobes between two states whenever the
   pointer rests on a boundary, which is the single most common way this feature reads as broken. */
const HYST = 8;

function zoneFor(r: DOMRect, x: number, y: number, held: Zone | null, edgesOff: boolean): Zone {
  const px = x - r.left;
  const py = y - r.top;
  const edge = Math.min(r.width * 0.25, 56);
  const grow = (z: Zone) => (held === z ? HYST : 0);
  /* ⚠️ The edge zones are SUPPRESSED when the row is already at its column cap. A vertical line
     promising a column the row cannot take is a lie; it falls back to the horizontal rule. */
  if (!edgesOff) {
    if (px < edge + grow('left')) return 'left';
    if (px > r.width - edge - grow('right')) return 'right';
  }
  return py < r.height / 2 + (held === 'above' ? HYST : held === 'below' ? -HYST : 0) ? 'above' : 'below';
}

/** The line, the outline and the chip for one hovered box. */
function DropLine({ zone, inset }: { zone: Zone; inset: number }) {
  if (zone === 'in') return null;
  const vertical = zone === 'left' || zone === 'right';
  const label = vertical ? 'Insert in new column' : 'Insert in new row';
  const pos: React.CSSProperties = vertical
    ? { top: inset, bottom: inset, width: 3, [zone === 'left' ? 'left' : 'right']: -1.5 }
    : { left: inset, right: inset, height: 3, [zone === 'above' ? 'top' : 'bottom']: -1.5 };
  return (
    <>
      {/* Layer 2 — the box that will receive the drop. */}
      <span className="pointer-events-none absolute inset-0 z-30 rounded" style={{ outline: `3px solid ${LINE}`, outlineOffset: -1 }} />
      {/* Layer 3 — the line itself, at the gap the drop lands in. */}
      <span className="pointer-events-none absolute z-30 rounded-full" style={{ ...pos, background: LINE }} />
      {/* Layer 4 — the chip. ⚠️ THREE strings, not Duda's one: our gesture makes rows AND columns,
          and an admin about to split a row needs to know that before they let go. */}
      <span
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-sm px-3 py-[3px] text-[12px] font-bold text-white"
        style={{ background: LINE, top: -24 }}
      >{label}</span>
    </>
  );
}

/* A column: empty and dashed until something is dropped in, then just the element on the section's
   own surface. No wrapper card — the element brings whatever chrome it actually needs. */
function ColumnBody({ id, item, live, dir, icons, placedText, cfg }: { id: string; item?: PlacedElement; live: boolean; dir?: BoxDir; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }>; cfg?: (id: string) => Record<string, unknown> }) {
  const { styles, dropInColumn, dropBeside, addInside, columnsFull } = useCanvas();
  const [over, setOver] = useState(false);
  /* Which zone the pointer is in, held across renders so the hysteresis has a previous answer. */
  const [zone, setZone] = useState<Zone | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  /* ⚠️ BOTH payloads. A drag is either a new element from the library or one already on the page
     being moved; the line has to appear for each, and the drop has to tell them apart. */
  const payloadOf = (e: React.DragEvent): { type: string } | { move: string } | null => {
    const t = draggedElement(e);
    if (t) return { type: t };
    const mv = draggedNode(e);
    return mv ? { move: mv } : null;
  };
  const accepts = (e: React.DragEvent) =>
    e.dataTransfer.types.includes('text/portal-element') || e.dataTransfer.types.includes(MOVE_MIME);

  /* ── The RESERVED SPACE ────────────────────────────────────────────────────────────────────────
   *
   * ⚠️ A line says WHERE; it does not say WHAT YOU GET. Dropping beside a full-width card turns one
   * column into two, and until you let go the only evidence of that was a 3px rule at one edge — so
   * the layout you were about to make was something you had to picture rather than see. The box
   * now opens a gap the size of the thing being dropped and the content already there moves over
   * into what is left, which is the whole shape of the result, live.
   * ⚠️ It is PADDING on the box, not a change to the model. Nothing is inserted, split or reordered
   * until the drop — a preview that mutated the page would have to be undone on every dragleave,
   * and a dragleave that fires while crossing a child (see below) would undo it mid-gesture.
   * ⚠️ HALF for a column and a fixed band for a row, because the two are different promises: a new
   * column takes a share of the width, while a new row takes as much height as its content needs
   * and cannot be known before it lands. */
  const reserve = over && zone && zone !== 'in' ? zone : null;
  const sideways = reserve === 'left' || reserve === 'right';
  const gap: React.CSSProperties = !reserve ? {}
    : sideways
      ? { [reserve === 'left' ? 'paddingLeft' : 'paddingRight']: '50%' }
      : { [reserve === 'above' ? 'paddingTop' : 'paddingBottom']: 72 };

  return (
    <div
      ref={boxRef}
      /* ⚠️ CAPTURE phase, both of them. `Sel` wraps the element INSIDE this box and has its own
         MOVE_MIME handlers that `stopPropagation` — so on the bubble phase the inner Sel answered
         first and this box never saw a move-drag at all: the line appeared for a palette drag and
         not for dragging something already on the page, which is half the gesture. Capturing runs
         the ancestor first, so the line decides, and the drop is consumed here.
         The consequence, deliberately: dragging one element onto another now SPLITS at the edge you
         aimed at rather than swapping the two. The line is the promise on screen, and a gesture that
         showed a line and then swapped would be lying about what it was going to do. */
      onDragOverCapture={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
        /* ⚠️ An EMPTY box takes no line — a line is a statement about a neighbour and there is no
           neighbour. It gets the tinted fill instead. */
        if (!item) { setZone('in'); return; }
        const r = boxRef.current?.getBoundingClientRect();
        if (!r) return;
        setZone((held) => zoneFor(r, e.clientX, e.clientY, held, columnsFull(id)));
      }}
      onDragLeave={(e) => {
        /* ⚠️ Only when the pointer really left. dragleave fires crossing onto a CHILD too, and
           clearing on that made the line flicker off every time it passed over the element. */
        if (boxRef.current?.contains(e.relatedTarget as Node)) return;
        setOver(false); setZone(null);
      }}
      onDropCapture={(e) => {
        const payload = payloadOf(e);
        const z = zone;
        setOver(false); setZone(null);
        if (!payload) return;
        e.preventDefault();
        e.stopPropagation();
        if (!z || z === 'in') {
          if ('type' in payload) dropInColumn(id, payload.type);
          return;
        }
        /* ⚠️ Dropping an element onto ITSELF is a no-op, not a split. Without this the source box
           is detached and then asked to be its own neighbour, which loses the element. */
        if ('move' in payload && item?.id === payload.move) return;
        dropBeside(id, payload, z);
      }}
      /* ⚠️ No styleOf here either — Sel applies the node style once, above. */
      /* ⚠️ justify comes from the column's OWN setting. It was hard-coded to `justify-center`, so the
         spec's "Align the blocks inside" (Top / Middle / Bottom) wrote a value nothing read and every
         column centred its contents whatever you picked.
         ⚠️ …but ONLY once there are blocks to align. An empty column's `+` is not content, it is the
         offer to add some, and "Align the blocks inside: Top" was pinning it to the ceiling of a box
         it is asking you to fill — so it sat in a corner of a large empty rectangle instead of in
         the middle of it. With nothing inside, the setting has nothing to act on and the placeholder
         is centred both ways, which is also where the live column's own centre button appears. */
      /* ⚠️ A section that has never been SPLIT draws no column of its own. Its root box IS the
         section — same id, same bounds — so the dashed 120px frame was a second container drawn
         inside the first: an empty section came out as a box inside a box, with two borders and two
         sets of padding describing one place. `dir` is undefined exactly when this box has no
         parent, which is the same thing as "this is the section itself", so it is the test.
         The "+" stays either way: it is the offer to put something here, and without it an empty
         section would be a blank gap on the page. */
      className={`relative flex h-full flex-col ${
        item && HUGS_CONTENT.has(item.type) ? 'items-start ' : ''
      }${
        !item ? 'justify-center'
          : ({ start: 'justify-start', center: 'justify-center', end: 'justify-end' } as Record<string, string>)[String(cfg?.(id)?.blockAlign ?? 'center')] ?? 'justify-center'
      } rounded transition-colors ${
        item ? '' : dir ? 'min-h-[120px] items-center border border-dashed' : 'min-h-[88px] items-center'
      } ${over ? 'border border-dashed border-[#3D8BD0] bg-[#EBF5FF]' : item || !dir ? '' : 'border-[#C3CBD6]'} ${
        /* ⚠️ GRAB, so the affordance matches what the box can do. Duda shows a hand over anything
           you may pick up, and the only thing that carried one here was the toolbar's 14px grip —
           an element you can move looked exactly like one you cannot.
           ⚠️ Not on TEXT. A text element is edited in place, and a draggable body swallows the
           selection you need to edit it, so the grip stays its only handle. */
        item && item.type !== 'b-text' ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      draggable={live && !!item && item.type !== 'b-text'}
      onDragStart={item ? (e) => {
        /* The same payload the toolbar grip sends, so one gesture has one meaning wherever it is
           started from. */
        e.stopPropagation();
        e.dataTransfer.setData(MOVE_MIME, item.id);
        e.dataTransfer.effectAllowed = 'move';
      } : undefined}
      style={{ ...gap, transition: 'padding 130ms ease' }}
    >
      {/* ⚠️ The element gets its OWN Sel. Without one the column was the innermost selectable thing,
          so clicking a collection widget selected the column — and with items now selectable inside
          it, the widget itself became reachable only through the breadcrumb. */}
      {item ? (
        <>
          {/* ⚠️ `w-fit` for anything that sizes to its own content, `w-full` otherwise — and the
              COLUMN has to stop stretching it too, which is what `items-start` below does: a flex
              column stretches its children across by default, so `w-fit` alone would have been
              overruled and the outline would still have spanned the column. Two changes, one
              effect; either on its own does nothing. */}
          <Sel id={item.id} className={HUGS_CONTENT.has(item.type) ? 'w-fit max-w-full' : 'w-full'}>
            <PortalPlacedElement item={item} icon={icons?.[item.id]} text={placedText?.[item.id]} cfg={cfg?.(item.id)} />
          </Sel>
          {/* ⚠️ A FILLED column keeps its adders too. They used to appear only on an empty column,
              so the moment you put something in one — or selected what was already there — the way
              to add a column beside it vanished, and the only remaining route was to empty it. */}
          {live && <ColumnAdders columnId={id} filled />}
        </>
      ) : (
        live ? <ColumnAdders columnId={id} /> : (
          /* Unselected columns stay grey but are NOT dead — clicking still opens the element
             library, so you can fill any column without selecting it first. */
          <button
            onClick={(e) => { e.stopPropagation(); addInside(id); }}
            title="Add an element here"
            className="flex size-6 items-center justify-center rounded-full bg-[#C3CBD6] text-white transition-colors hover:bg-[#3D8BD0]"
          ><Plus size={14} /></button>
        )
      )}
      {/* ⚠️ The empty-box treatment and the LINE are mutually exclusive — one says "this box takes
          it", the other says "a new box beside this one takes it", and showing both at once is the
          ambiguity the outline exists to remove. */}
      {over && zone === 'in' && (
        <span className="pointer-events-none absolute inset-0 rounded ring-2 ring-[#3D8BD0]" />
      )}
      {/* The space itself — a tinted, dashed box exactly where the element will land. */}
      {reserve && (
        <span
          className="pointer-events-none absolute z-20 rounded-md"
          style={{
            ...(sideways
              ? { top: 8, bottom: 8, width: 'calc(50% - 12px)', [reserve === 'left' ? 'left' : 'right']: 8 }
              : { left: 8, right: 8, height: 56, [reserve === 'above' ? 'top' : 'bottom']: 8 }),
            background: 'rgba(24,141,248,0.10)',
            border: `2px dashed ${LINE}`,
          }}
        />
      )}
      {over && zone && zone !== 'in' && <DropLine zone={zone} inset={8} />}
    </div>
  );
}

/* ⚠️ ONE rhythm for every section, built in or added: 24px left and right, HALF that top and
   bottom, and no margin between them. Three things were wrong before. The built-in bands each
   carried their own margin (`mt-5`, `mt-4`, `mt-4`) on top of their padding, so the vertical gap
   was inconsistent AND larger than the horizontal one — a page that breathed more between its
   blocks than around them. And an added section put its padding on an INNER div while the built-ins
   put theirs on the `Sel`, so a new section's selection outline ran the full width while every
   other one was inset by 24px: it looked unaligned because it WAS, by exactly the padding.
   Half-vertical is the whole point — the horizontal gutter is the page's widest measure, so tying
   the vertical to it makes the page one rhythm rather than two. */
export const SECTION_PAD = 'px-6 py-3';

/* The Style accordion's four keys, as CSS. Shared by the built-in bands and added sections so a
   section painted one way in one place cannot come out another way in the other. */
/* ⚠️ Applied to the SECTION WRAPPER, not to the content row inside it. On the inner box the colour
   stopped at the section's own padding, so a filled band came out as a tinted rectangle floating in
   a white gutter — which is not what "give this section a background" means to anyone. On the
   wrapper it runs the full width of the band and the padding sits inside the colour, where it reads
   as breathing room rather than a margin. */
/* Re-exported from the model so the many call sites here keep their import. */
export { fillCss };

const BOX_GAP = 16;

/* One box, drawn. A section, a column, a row and the cell a widget sits in are the same thing in
 * four positions, so there is ONE renderer for all four — which is what makes "all level
 * feasibility in row, col. split" a property of the model rather than four features kept in step.
 *
 * ⚠️ `weight` sizes the ROW axis only. A row's columns share a measured width, so a share means
 * something there; a column's rows are content-height, and giving them flex shares would need the
 * section to have a height of its own — which it does not, and should not. Stacked boxes take the
 * height of what is in them, exactly as the page does today. */
function BoxView({
  box, parentDir, resize, icons, placedText, cfg, siblings,
}: {
  box: Box;
  /** The PARENT's direction — what decides whether this box is a Column or a Row, and which way
   *  its `+` adders point. `undefined` on a section root, which has no siblings to add. */
  parentDir?: BoxDir;
  resize: string;
  icons?: Record<string, IconChoice | undefined>;
  placedText?: Record<string, { title?: string; desc?: string }>;
  cfg?: (id: string) => Record<string, unknown>;
  /** The weights of every child in this row, for the basis calculation. */
  siblings: number[];
}) {
  const { selectedId, hoverId } = useCanvas();
  const branch = isBranch(box);

  /* Blue adders belong to ONE box at a time — the one the pointer is over.
     ⚠️ NOT while it is SELECTED. A selected box carries eight resize handles on the same four edges
     the adders sit on, so both together put two controls on one point and the click went to
     whichever was painted last. Selection means "I am sizing this"; hover means "I am adding beside
     this", and they are different intentions that were sharing a surface.
     ⚠️ Hover is matched against the whole PATH, not the id: with an element selected inside a box
     the pointer is over the element, not the box, and an exact match silently took the affordance
     away. Same rule "+ Add Section" already follows on section hover. */
  const live = !nodeSelectedWithin(selectedId, box.id) && !!hoverId && nodePath(hoverId).some((n) => n.id === box.id);

  const total = siblings.reduce((a, b) => a + b, 0) || 1;
  /* ⚠️ Fixed columns need a real BASIS, not `flex: weight`. That shorthand is "grow by weight from a
     basis of zero" — turn grow off and a zero-basis column is a column of zero width, so every one
     would vanish the moment the section was switched. Written as the share it already had, the
     switch is invisible, which is the point. */
  const style: CSSProperties = parentDir === 'row'
    ? { flex: `${resize === 'fixed' ? 0 : box.weight} ${resize === 'fixed' ? 0 : 1} calc((100% - ${(siblings.length - 1) * BOX_GAP}px) * ${box.weight / total})` }
    : {};

  return (
    <Sel id={box.id} className="min-w-0" style={style}>
      {branch ? (
        <BoxChildren box={box} resize={resize} icons={icons} placedText={placedText} cfg={cfg} />
      ) : (
        <ColumnBody id={box.id} item={box.el} live={live} dir={parentDir} icons={icons} placedText={placedText} cfg={cfg} />
      )}
    </Sel>
  );
}

/** A branch's children, laid out along its own `dir`. Shared by `BoxView` and the section root so
 *  the root is not a second, slightly different renderer for the same job. */
function BoxChildren({ box, resize, icons, placedText, cfg }: {
  box: Box;
  resize: string;
  icons?: Record<string, IconChoice | undefined>;
  placedText?: Record<string, { title?: string; desc?: string }>;
  cfg?: (id: string) => Record<string, unknown>;
}) {
  const kids = box.children ?? [];
  const weights = kids.map((c) => c.weight);
  return (
    <div
      className="flex min-w-0"
      /* `dir` IS `flex-direction`. That is the whole of the behaviour setting: a row lays its
         children left-to-right so each reads as a column, a column stacks them so each reads as a
         row. Flipping it moves nothing and destroys nothing. */
      style={{ flexDirection: box.dir, gap: BOX_GAP, alignItems: box.dir === 'row' ? 'stretch' : undefined }}
      data-dir={box.dir}
    >
      {kids.map((child) => (
        <BoxView
          key={child.id}
          box={child}
          parentDir={box.dir}
          resize={resize}
          icons={icons}
          placedText={placedText}
          cfg={cfg}
          siblings={weights}
        />
      ))}
    </div>
  );
}

/** Is the selection this box, or anything inside it?
 *
 *  ⚠️ The PATH, not the id — the same test hover already uses, and for the same reason. Selecting an
 *  element inside a column leaves `selectedId` on the element, so an id test said the column was not
 *  selected and kept its four adders — sitting on exactly the four edges the element's own resize
 *  handles were drawn on. Two controls, one point, and the click went to whichever painted last.
 *  Once anything in a box is selected you are working inside it, so its adders step aside. */
const nodeSelectedWithin = (selectedId: string | null, boxId: string) =>
  !!selectedId && nodePath(selectedId).some((n) => n.id === boxId);

function AddedSection({ section, icons, placedText, cfg }: { section: CustomSection; icons?: Record<string, IconChoice | undefined>; placedText?: Record<string, { title?: string; desc?: string }>; cfg?: (id: string) => Record<string, unknown> }) {
  const { selectedId, hoverId } = useCanvas();
  /* An added section answers Responsive behaviour exactly as a built-in band does — it is the same
     Section spec, so an empty section you just dropped in has the control from its first column. */
  const resize = String(cfg?.(section.id)?.resize ?? 'fill');
  const root = section.root;
  /* Hover only — see the note on BoxView. A selected section is being sized, not added to. */
  const live = !nodeSelectedWithin(selectedId, root.id) && !!hoverId && nodePath(hoverId).some((n) => n.id === root.id);

  return (
    /* ⚠️ A section paints NOTHING by default — no white card, no border, no radius. A divider, a
       line of text or a button dropped on the page should sit on the page, the way it does in every
       website editor. A surface is something you ADD: Style → Fill paints one.
       ⚠️ Padding stays. Without it a dropped element would touch the page edge, and the page's own
       gutter is not the section's to borrow.
       ⚠️ No style on an inner box — `Sel` applies the node style ONCE, here. It used to be spread
       again inside, so every padding value was applied around the section and again within it. */
    <Sel id={section.id} className={SECTION_PAD} style={fillCss(cfg?.(section.id) ?? {})}>
      {isBranch(root) ? (
        <BoxChildren box={root} resize={resize} icons={icons} placedText={placedText} cfg={cfg} />
      ) : (
        /* A section nobody has split yet IS a single cell — it just has nothing beside it. It gets
           the same body a leaf gets anywhere else; the way to give it a neighbour is Split, since
           the root has no parent for a sibling to go into. */
        <ColumnBody id={root.id} item={root.el} live={live} icons={icons} placedText={placedText} cfg={cfg} />
      )}
    </Sel>
  );
}

/* The banner search — a real control, not a picture of one.
 *
 * ⚠️ Every setting on its panel does something you can see. Placeholder is the prompt; Scope paints
 * the pill that says what the search looks through AND decides which results come back; "Show
 * suggestions as they type" is the dropdown. A settings panel whose switches only store values is
 * worse than no panel: it teaches people the whole surface is decorative.
 *
 * ⚠️ On the CANVAS the field is read-only, because a click there has to mean "select this element"
 * — you are arranging a page, not searching it. In Preview and on the live portal it is a real
 * input. The scope pill shows in both, so the setting is legible while you are choosing it. */
function HeroSearch({ cfg, fallback, style }: {
  cfg: Record<string, unknown>; fallback: string; style: React.CSSProperties;
}) {
  const { enabled, styles } = useCanvas();
  /* ⚠️ Padding and height are applied HERE, on the white field, because `paintsOwnSurface` makes
     Sel withhold them. `h-11` becomes a MINIMUM so a dragged height can grow the box and the
     contents stay centred in it rather than being pinned to the top. */
  const own = styles['hero-search'] ?? {};
  const p = own.padding;
  const box: React.CSSProperties = {
    ...style,
    minHeight: own.height ?? 44,
    ...(p?.top !== undefined ? { paddingTop: p.top } : {}),
    ...(p?.bottom !== undefined ? { paddingBottom: p.bottom } : {}),
    ...(p?.left !== undefined ? { paddingLeft: `${p.left}%` } : {}),
    ...(p?.right !== undefined ? { paddingRight: `${p.right}%` } : {}),
  };
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const scope = String(cfg.searchScope ?? 'knowledge');
  const suggestOn = cfg.searchSuggestions !== false;
  const hits = q.trim()
    ? SEARCH_SUGGESTIONS
      .filter((s) => (scope === 'knowledge' ? s.kind === 'Knowledge' : true))
      .filter((s) => s.title.toLowerCase().includes(q.trim().toLowerCase()))
      .slice(0, 5)
    : [];
  return (
    <div className="relative">
      <div style={box} className="flex items-center gap-2 bg-white px-4">
        {/* ⚠️ Truncate, never wrap. Narrowed, the placeholder broke onto a second line and pushed
            the search box to double height — the one control on the page whose shape people
            recognise. Content inside a resized element gives way to the element's size. */}
        {enabled ? (
          <span className="min-w-0 flex-1 truncate text-left text-[14px] text-[#9CA3AF]">
            {String(cfg.searchPlaceholder ?? fallback)}
          </span>
        ) : (
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={String(cfg.searchPlaceholder ?? fallback)}
            className="min-w-0 flex-1 truncate bg-transparent text-left text-[14px] text-[#364658] outline-none placeholder:text-[#9CA3AF]"
          />
        )}
        {/* ⚠️ No scope pill. It sat INSIDE the field, so a search bar came with a grey chip
            permanently occupying the space just before its own icon — a label for a setting, on the
            one control a requester is meant to type into without reading anything. The scope still
            works: it decides which results come back, and it is still set in the panel. What is gone
            is the badge announcing it on the page.
            ⚠️ `scope` is still read below by `hits` — the setting is intact, only its display went. */}
        <Search size={18} className="flex-shrink-0 text-[#64748B]" />
      </div>
      {!enabled && suggestOn && open && hits.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded border border-[#E5E7EB] bg-white py-1 text-left shadow-lg">
          {hits.map((s) => (
            <button
              key={s.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setQ(s.title); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F5F7FA]"
            >
              <Search size={13} className="flex-shrink-0 text-[#9CA3AF]" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{s.title}</span>
              <span className="flex-shrink-0 text-[11px] text-[#9CA3AF]">{s.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* What the banner search offers back. Knowledge entries are the ones an "only knowledge" scope
   keeps, so switching the setting visibly changes the results rather than only the pill. */
const SEARCH_SUGGESTIONS: { title: string; kind: string }[] = [
  { title: 'How to Reset Your Password', kind: 'Knowledge' },
  { title: 'Connecting to Company VPN', kind: 'Knowledge' },
  { title: 'Reporting a Hardware Fault', kind: 'Knowledge' },
  { title: 'Request a new laptop', kind: 'Service' },
  { title: 'Report an incident', kind: 'Service' },
  { title: 'INC-187 Cannot Create KB Article', kind: 'Request' },
  { title: 'AST-13 DESKTOP-5JPPI6F', kind: 'Asset' },
];

/* ── Chrome ──────────────────────────────────────────────────────────────── */

const RAIL_ITEMS = [
  { key: 'requests', label: 'Requests', Icon: ({ size = 19 }: { size?: number }) => <IconRequest size={size} /> },
  { key: 'catalog', label: 'Service Catalog', Icon: ({ size = 19 }: { size?: number }) => <ShoppingCart size={size} strokeWidth={1.7} /> },
  { key: 'changes', label: 'Changes', Icon: ({ size = 19 }: { size?: number }) => <IconChange size={size} /> },
  { key: 'assets', label: 'My Assets', Icon: ({ size = 19 }: { size?: number }) => <IconAssets size={size} /> },
  { key: 'cis', label: 'My CIs', Icon: ({ size = 19 }: { size?: number }) => <IconCMDB size={size} /> },
  { key: 'knowledge', label: 'Knowledge', Icon: ({ size = 19 }: { size?: number }) => <IconKnowledge size={size} /> },
  { key: 'approvals', label: 'My Approvals', Icon: ({ size = 19 }: { size?: number }) => <IconMyApproval size={size} /> },
  { key: 'team', label: 'My Team', Icon: ({ size = 19 }: { size?: number }) => <IconMyTeam size={size} /> },
  { key: 'tasks', label: 'Tasks', Icon: ({ size = 19 }: { size?: number }) => <IconTask size={size} /> },
];

/* §7.23 — the rail's ORDER and VISIBILITY are the admin's; the destinations are the product's. The
   items array is matched against the rail's own glyphs by index, so hiding or reordering in the
   drawer moves the real rail. */
function PortalRail({ cfg = EMPTY_CFG, onOrder }: {
  cfg?: Record<string, unknown>;
  /** Commits a canvas reorder to the rail's own `items`, the same list the panel edits. */
  onOrder?: (names: string[]) => void;
}) {
  const { enabled } = useCanvas();
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const width = Number(cfg.railWidth ?? 60);
  const iconSize = Number(cfg.railIconSize ?? 18);
  const spacing = Number(cfg.railSpacing ?? 4);
  const withLabels = cfg.railLabels === 'both';
  const items = (cfg.items as { id: string; name: string; hidden?: boolean }[]) ?? [];
  /* A destination the requester cannot reach never appears, whatever the order (§7.23) — here that
     is the `hidden` flag, which is the only lever an admin has over the set. */
  const order = items.length
    ? items.filter((i) => !i.hidden).map((i) => RAIL_ITEMS.find((r) => r.label === i.name)).filter(Boolean) as typeof RAIL_ITEMS
    : RAIL_ITEMS;

  /* ⚠️ The reorder writes the FULL stored list, hidden rows included — `order` above has already
     dropped them, so committing that would delete a destination as a side effect of moving another.
     The dragged name is spliced within the stored order instead. */
  const moveTo = (srcLabel: string, dstLabel: string) => {
    if (!onOrder || srcLabel === dstLabel) return;
    const names = (items.length ? items.map((i) => i.name) : RAIL_ITEMS.map((r) => r.label)) as string[];
    const next = names.filter((n) => n !== srcLabel);
    const at = next.indexOf(dstLabel);
    next.splice(at < 0 ? next.length : at, 0, srcLabel);
    onOrder(next);
  };

  return (
    <Sel id="rail" className="flex flex-shrink-0 flex-col items-center border-r border-[#e5e7eb] bg-white py-3" style={{ width }}>
      <div className="flex flex-1 flex-col items-center" style={{ gap: spacing }}>
        {order.map(({ key, label, Icon }) => (
          /* ⚠️ Same gesture, same MIME and same visual language as the top bar's icons — one drag to
             learn, not two. `NAV_MIME` keeps it off the element MIME, so a rail drag can never land
             on the canvas as a dropped widget. */
          <span
            key={key}
            title={enabled ? `${label} — drag to reorder` : label}
            draggable={enabled}
            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData(NAV_MIME, label); e.dataTransfer.effectAllowed = 'move'; setDragKey(label); }}
            onDragEnd={() => { setDragKey(null); setOverKey(null); }}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(NAV_MIME)) return;
              e.preventDefault(); e.stopPropagation(); setOverKey(label);
            }}
            onDragLeave={() => setOverKey((k) => (k === label ? null : k))}
            onDrop={(e) => {
              const src = e.dataTransfer.getData(NAV_MIME);
              e.preventDefault(); e.stopPropagation();
              setOverKey(null); setDragKey(null);
              if (src) moveTo(src, label);
            }}
            /* ⚠️ NO `stopPropagation` on the click, unlike the top bar's icons. There the cluster is
               its own selectable node sitting in a bar you can also select, so an icon has to say
               which of the two you meant. The rail has no inner node — the rail IS the thing — so
               swallowing the click would leave it reachable only by its few pixels of padding, and
               clicking the navigation would select nothing at all. A drag never fires a click, so
               the two gestures do not compete. */
            className={`flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[#6b7280] ${
              enabled ? 'cursor-grab active:cursor-grabbing' : ''
            } ${dragKey === label ? 'opacity-35' : ''} ${
              overKey === label && dragKey !== label ? 'ring-1 ring-[#3D8BD0]' : ''
            }`}
          >
            <Icon size={iconSize} />
            {withLabels && <span className="max-w-full truncate text-[9px] leading-none">{label}</span>}
          </span>
        ))}
      </div>
      <span className="mt-3 flex size-8 items-center justify-center">
        <svg viewBox="0 0 24 24" className="size-6">
          <circle cx="12" cy="12" r="10" fill="#F1F5F9" />
          <path d="M12 2a10 10 0 0 1 10 10h-10z" fill="#E11D48" />
          <path d="M12 12v10A10 10 0 0 1 2 12z" fill="#1F2937" />
        </svg>
      </span>
    </Sel>
  );
}

/** Reordering payload, kept off the element MIME so a nav drag can never land on the canvas. */
const NAV_MIME = 'text/portal-nav';

/** The four built-in anchors a section can be attached to. A blank page renders none of them, so
 *  it collects everything anchored to any of them under its own single seam. */
const BUILT_IN_ANCHORS = new Set(['hero', 'quick', 'favourites', 'services', 'work', 'records']);

function PortalHeader({ cfg = EMPTY_CFG, actionsCfg = EMPTY_CFG, onLogoPos, onActionOrder }: {
  content?: PortalPageContent; cfg?: Record<string, unknown>;
  /** The action cluster's own config — a separate node, so a separate bag. */
  actionsCfg?: Record<string, unknown>;
  /** Commits the logo's placement — the bar owns it, so the write goes back up to the bar's config. */
  onLogoPos?: (p: 'left' | 'center' | 'right') => void;
  /** Commits a canvas reorder of the action icons to `header-actions`' own config. */
  onActionOrder?: (ids: string[]) => void;
}) {
  const { styles, enabled } = useCanvas();
  /* ⚠️ The order is CONFIG, not local state. It used to be a `useState` seeded with the six keys,
     which meant the canvas drag worked, looked right, and was gone the moment the component
     remounted — and the panel could not show it at all, because there was nothing to read. Panel
     and canvas now move ONE value. */
  const actionItems = (actionsCfg.items as { id: string; name?: string }[] | undefined) ?? [];
  const order = actionItems.length ? actionItems.map((i) => i.id) : ['type', 'chat', 'bell', 'keys', 'home', 'info'];
  const setOrder = (fn: (o: string[]) => string[]) => onActionOrder?.(fn(order));
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [logoDrag, setLogoDrag] = useState(false);
  /** Where the logo would land if you let go now — drawn as a drop marker in the bar. */
  const [logoHint, setLogoHint] = useState<'left' | 'center' | 'right' | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const barHeight = Number(cfg.barHeight ?? 56);
  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#6b7280]';
  const pos = String(cfg.logoPos ?? 'left');

  /* Two units, not ten. The action cluster is ONE selectable block pinned top-right — dragging
     Bell between Home and Help is a freedom nobody wants and a bar nobody can read. What moves is
     the LOGO, against that fixed cluster. */
  /* ⚠️ Dragged along the BAR, and only the bar. The logo's placement is the one visual decision in
     this header that is genuinely the admin's, and a dropdown of left/centre/right made you pick a
     word for something you can see — while the actions, which have to move out of its way, never
     appeared in the choice at all. Dragging is the whole gesture: pick the logo up, put it where you
     want it, and the action cluster takes the space that is left.
     ⚠️ Clamped to three POSITIONS rather than a free x. A logo at 37% of a bar is not a design
     decision, it is an accident that survives to production — and left / centre / right are the
     only three placements the actions can be arranged around. Which one you get is decided by where
     you LET GO, against the bar's own thirds, so the gesture is free and the result is tidy. */
  const dragLogo = (e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    const bar = (e.currentTarget as HTMLElement).closest('[data-node="header"]') as HTMLElement | null;
    if (!bar) return;
    setLogoDrag(true);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => {
      const r = bar.getBoundingClientRect();
      const t = (ev.clientX - r.left) / Math.max(r.width, 1);
      setLogoHint(t < 0.34 ? 'left' : t > 0.66 ? 'right' : 'center');
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setLogoDrag(false);
      setLogoHint(null);
      const r = bar.getBoundingClientRect();
      const t = (ev.clientX - r.left) / Math.max(r.width, 1);
      const next = t < 0.34 ? 'left' : t > 0.66 ? 'right' : 'center';
      if (next !== pos) onLogoPos?.(next);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const logo = (
    <Sel id="header-logo" className="flex min-w-0 flex-shrink items-center overflow-hidden">
      <span
        onMouseDown={dragLogo}
        title={enabled ? 'Drag the logo along the bar' : undefined}
        className={`flex items-center ${enabled ? (logoDrag ? 'cursor-grabbing' : 'cursor-grab') : ''} ${logoDrag ? 'opacity-60' : ''}`}
      >
        {cfg.logoSrc ? <img src={String(cfg.logoSrc)} alt="" className="max-h-7 object-contain" /> : <MotadataLogo />}
      </span>
    </Sel>
  );

  /* ⚠️ The bar's icons are NOT selectable and carry NO styling of their own. They are the product's
     own controls — an admin who could restyle the notification bell one shade off the help icon
     would produce a header that looks broken, and the settings would have to exist on nine nodes to
     do it. The one thing worth changing is ORDER, so that is the only thing offered.
     ⚠️ And order only WITHIN the cluster: dragging Bell to sit before the logo is not a rearranged
     header, it is a different header. The drop is refused outside the group rather than silently
     doing nothing, so the constraint is visible while you drag. */
  const ICONS: { key: string; el: ReactNode }[] = [
    { key: 'type', el: <Type size={17} /> },
    { key: 'chat', el: <MessagesSquare size={17} /> },
    { key: 'bell', el: <Bell size={17} /> },
    { key: 'keys', el: <Keyboard size={17} /> },
    { key: 'home', el: <House size={17} /> },
    { key: 'info', el: <Info size={17} /> },
  ];
  const ordered = order.map((k) => ICONS.find((i) => i.key === k)!).filter(Boolean);

  const actions = (
    <Sel id="header-actions" className="flex flex-shrink-0 items-center gap-1.5">
      <span className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] px-2.5 text-[13px] font-medium text-[#364658]"><AiSparkle size={14} /> Ask AI</span>
      <span className="flex size-8 items-center justify-center rounded bg-[#1E293B] text-white"><Plus size={17} /></span>
      {ordered.map((ic) => (
        <span
          key={ic.key}
          draggable={enabled}
          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData(NAV_MIME, ic.key); e.dataTransfer.effectAllowed = 'move'; setDragKey(ic.key); }}
          onDragEnd={() => { setDragKey(null); setOverKey(null); }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(NAV_MIME)) return;
            e.preventDefault(); e.stopPropagation(); setOverKey(ic.key);
          }}
          onDragLeave={() => setOverKey((k) => (k === ic.key ? null : k))}
          onDrop={(e) => {
            const src = e.dataTransfer.getData(NAV_MIME);
            e.preventDefault(); e.stopPropagation();
            setOverKey(null); setDragKey(null);
            if (!src || src === ic.key) return;
            setOrder((o) => {
              const next = o.filter((k) => k !== src);
              next.splice(next.indexOf(ic.key), 0, src);
              return next;
            });
          }}
          onClick={(e) => e.stopPropagation()}
          /* ⚠️ It no longer stays inside its group. Dropping at another element's edge splits there,
             which is the whole of the new gesture — so the old tooltip described a rule the drag had
             stopped following, and a tooltip that lies is worse than none. */
          title={enabled ? 'Drag to move — drop at an edge to split' : undefined}
          className={`${iconBtn} ${enabled ? 'cursor-grab active:cursor-grabbing' : ''} ${
            dragKey === ic.key ? 'opacity-35' : ''
          } ${overKey === ic.key && dragKey !== ic.key ? 'ring-1 ring-[#3D8BD0]' : ''}`}
        >{ic.el}</span>
      ))}
      <span className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white">YG</span>
    </Sel>
  );

  const gap = <span className="flex-1" />;

  return (
    <Sel
      id="header"
      /* 'under', not the hero's `true`: the bar is ~60px of logo and actions edge to edge, so a
         toolbar placed just inside its top edge lands squarely on the logo it is meant to let you
         edit. Below the bar it covers the page instead, which is empty at that moment anyway. */
      toolbarBelow="under"
      style={{
        /* ⚠️ minHeight, not height. A fixed height is a ceiling, so the padding added by dragging
           the bar's bottom edge had nowhere to go — the bar grew five pixels and stopped. The bar
           still starts at its configured height and now grows when something inside asks it to. */
        minHeight: barHeight,
        background: String(cfg.barBg ?? '#FFFFFF'),
        borderBottomWidth: cfg.barDivider === false ? 0 : 1,
        boxShadow: shadowCss({
          on: cfg.shadowOn === true,
          color: String(cfg.shadowColor ?? '#0F172A'),
          type: (cfg.shadowType as 'outer' | 'inner') ?? 'outer',
          pos: String(cfg.shadowPos ?? 'bottom'),
        }),
        ...styleOf(styles, 'header'),
      }}
      className="flex flex-shrink-0 items-center border-b border-[#e5e7eb] px-4"
    >
      {/* ⚠️ The clip lives on this INNER row, not on the Sel itself. On the Sel it also clipped the
          selection toolbar, which now hangs below the bar — the bar's contents still have to be
          clipped when the design panel is dragged wide, but a floating control must escape. */}
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className={iconBtn}><PanelLeft size={18} /></span>
        {/* ⚠️ While dragging, the bar shows where the logo WILL sit rather than following the
            cursor. A logo tracking the pointer would drag the action cluster around with it on
            every pixel — the thing you are aiming at would keep moving out from under you. */}
        {(logoHint ?? pos) === 'left' && <>{logo}{gap}{actions}</>}
        {(logoHint ?? pos) === 'center' && <>{gap}{logo}{gap}{actions}</>}
        {(logoHint ?? pos) === 'right' && <>{actions}{gap}{logo}</>}
      </div>
    </Sel>
  );
}

function HeroArtwork() {
  const nodes = [
    [14, 46, 20], [22, 18, 13], [34, 62, 15], [50, 34, 30], [50, 78, 11],
    [64, 16, 14], [69, 58, 13], [78, 30, 12], [88, 46, 15], [93, 74, 12], [8, 78, 10], [41, 22, 9],
  ];
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [5, 7], [6, 8], [7, 8], [8, 9], [0, 10], [1, 11], [11, 3]];
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#94A3B8" strokeWidth="0.12" opacity="0.5" />
      ))}
      {nodes.map(([x, y, r], i) => (
        <g key={i} opacity={i === 3 ? 0.28 : 0.16}>
          <circle cx={x} cy={y} r={r / 10} fill="#CBD5E1" opacity="0.35" />
          <circle cx={x} cy={y} r={r / 18} fill="none" stroke="#CBD5E1" strokeWidth="0.15" />
        </g>
      ))}
    </svg>
  );
}

/* ⚠️ A SECOND artwork, not a replacement for the one above. The line-work belongs to the DEFAULT
   band — faint grey nodes read as texture on a deep colour and vanish entirely on a pale one, so a
   light banner needs a composition with its own weight. This is that composition: a tilted guide
   card with geometric solids around it.
   ⚠️ Pure CSS. No asset to ship, nothing to 404, and it re-tints by editing this one function —
   which is also what makes it the SLOT a real render drops into later: replace the contents and
   keep the wrapper, and the hero's layout does not move.
   ⚠️ Hidden below md. At 640px the copy already fills the band, and a composition squeezed into
   the last 90px of it is clutter rather than artwork. */
function HeroShapes() {
  const shadow = (b: number) => `drop-shadow(0 ${b}px ${b + 6}px rgba(15,51,39,.26))`;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] min-w-[320px] overflow-hidden md:block">
      {/* mint pill */}
      <span className="absolute" style={{ left: '8%', top: '13%', width: 50, height: 25, borderRadius: 999, background: '#C4E1D3', transform: 'rotate(-16deg)' }} />
      {/* dark triangle */}
      <span className="absolute" style={{ right: '5%', top: '4%', width: 0, height: 0, borderLeft: '38px solid transparent', borderRight: '38px solid transparent', borderBottom: '54px solid #1B3A2E', transform: 'rotate(14deg)', filter: shadow(12) }} />
      {/* peach half-circle */}
      <span className="absolute" style={{ right: '2%', bottom: '8%', width: 56, height: 56, borderRadius: '0 0 56px 56px', background: 'linear-gradient(180deg,#F0C6A8,#E0A783)', transform: 'rotate(12deg)', filter: shadow(9) }} />
      {/* terracotta dome */}
      <span className="absolute" style={{ right: '7%', top: '42%', width: 84, height: 42, borderRadius: '84px 84px 0 0', background: 'linear-gradient(160deg,#D98C6A,#B4593A)', transform: 'rotate(-8deg)', filter: shadow(11) }} />
      {/* the guide card, tilted — the object the solids are arranged around */}
      <span
        className="absolute flex flex-col rounded-md bg-white"
        style={{ left: '14%', top: '19%', width: '58%', padding: '20px 18px', transform: 'rotate(-9deg)', boxShadow: '0 16px 36px -12px rgba(15,51,39,.34), 0 2px 6px rgba(15,51,39,.10)' }}
      >
        <span className="text-[12px] font-bold tracking-tight text-[#0F3327]">Motadata</span>
        <svg viewBox="0 0 130 84" fill="none" stroke="#A6BEB2" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" className="mx-auto my-3 block h-auto w-full max-w-[130px]">
          <path d="M36 70 58 26 80 70Z" />
          <path d="M80 26h18a15 15 0 0 1 0 30H80z" />
          <circle cx="24" cy="32" r="11" />
          <path d="M92 70h22" />
        </svg>
        <span className="self-end text-[8px] font-semibold tracking-[0.16em] text-[#A9BCB2]">SERVICEOPS</span>
      </span>
      {/* blue prism, in front of the card's lower-left corner */}
      <span className="absolute" style={{ left: '2%', bottom: '10%', width: 72, height: 82, background: 'linear-gradient(118deg,#4E93C9 0 48%,#2E6FA8 48%)', clipPath: 'polygon(50% 0,100% 100%,0 100%)', transform: 'rotate(-6deg)', filter: shadow(12) }} />
    </span>
  );
}

/* ⚠️ A THIRD artwork, ported shape-for-shape from the Counter reference (`Support Portal Layout
   System.dc.html`, artboard #3c): a large faint RING bleeding in from the left — drawn oversized and
   mostly off-canvas so only its arc shows behind the heading, never a full circle — a solid accent
   circle clipped at the top edge, and a barely-visible rotated square tucked into the bottom-right
   corner. `inset-0` (not a right-half slot like `HeroShapes`), because the reference's shapes are
   spread across the FULL band rather than confined to one side.
   ⚠️ Sizes are the reference's own, scaled to roughly 70% — this hero is a shorter band than the
   reference's (which had the action tiles built into the same div), so the untouched reference
   pixel sizes read as oversized here; `overflow-hidden` on the wrapper still does the real cropping. */
function HeroCounterShapes() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute rounded-full" style={{ width: 480, height: 480, left: -160, top: -200, border: '60px solid rgba(255,255,255,0.06)' }} />
      <span className="absolute" style={{ width: 200, height: 200, right: -50, bottom: -90, borderRadius: 32, background: 'rgba(255,255,255,0.05)', transform: 'rotate(18deg)' }} />
      <span className="absolute rounded-full" style={{ width: 90, height: 90, right: 140, top: -30, background: '#D9A84C', opacity: 0.9 }} />
    </span>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────────── */

/* The spine colour per card, for the templates that use the spine treatment.
 *
 * ⚠️ Mapped by card ID, not by index or by row position. A colour that moved when the admin
 * reordered the row would be decoration; keyed to the card it names a KIND — blue is your work,
 * amber is waiting on you, green is something to read — and it stays that whatever position the
 * card is dragged to.
 * ⚠️ These are the product's own status hues, not new ones: the same blue the ID pills use, the
 * same amber a Pending badge wears, the same green a healthy state gets. A fresh palette here
 * would have been a second colour language on a page that already has one. */
const SPINE: Record<string, string> = {
  requests: '#3D8BD0',
  approvals: '#F58518',
  knowledge: '#22A06B',
  news: '#8B5CF6',
  assets: '#0EA5E9',
  cis: '#6366F1',
  contact: '#64748B',
  favourites: '#F59E0B',
  services: '#14B8A6',
};

/* The list-card header: title, optional count, optional "View all".
 *
 * Every switch here comes from the widget's own config, so unticking "Show total count" in the
 * drawer removes the badge on the canvas immediately. `nodeId` drives the typography roles, which
 * resolve up the chain — a colour set on the Cards Row lands on all three of its cards. */
function CardShell({ nodeId, titleNodeId, title, count, cfg = EMPTY_CFG, hideHead, children }: {
  nodeId?: string; titleNodeId?: string; title: string; count: number;
  cfg?: Record<string, unknown>; hideHead?: boolean; children: ReactNode;
}) {
  const { styles } = useCanvas();
  const rid = nodeId ?? titleNodeId ?? '';
  /* ⚠️ Every card heading is a node, whether or not the call site remembered to ask. The editable
     title used to depend on a caller passing titleNodeId, so the three cards that did got inline
     editing and My Assets and My CIs — which go through EmptyCard — did not. Same words, same job,
     two behaviours decided by a prop nobody could see. Derived from the card id instead. */
  /* ⚠️ undefined for a product-owned heading, which is what makes the words render bare instead of
     inside a Sel. Deciding it HERE rather than at each call site is why every card through this
     shell behaves the same — the last time a heading rule was written per-caller, three cards got
     inline editing and two did not. */
  const titleId = hasFixedTitle(nodeId) ? undefined : (titleNodeId ?? (nodeId ? nodeId + '-title' : undefined));
  const titleCss = rid ? roleStyle(styles, rid, 'title') : undefined;
  const linkCss = rid ? roleStyle(styles, rid, 'link') : undefined;
  const showCount = cfg.showCount !== false;
  const plain = cfg.countStyle === 'plain';
  const showViewAll = cfg.showViewAll !== false;

  /* ⚠️ `@container`, not a viewport breakpoint. A card is resized by dragging ITS edge, so it has to
     respond to its own width — the window never changed. Same mechanism the Software card grid uses.
     The header is one line at any width: the title truncates, the count and the link never shrink,
     and the "View all" WORD drops below 240px so the chevron alone carries the affordance rather
     than the whole row wrapping to two lines. */
  /* ⚠️ A PROP, not a config key. Whether this card shows its own heading is a decision the
     LAYOUT makes — inside a tabbed container the tab label already says which list this is, and
     printing it twice one line apart is the same words competing with themselves. An admin never
     asked for it, so it does not belong in their config. */
  if (hideHead) return <div className="@container flex min-w-0 flex-col pt-1">{children}</div>;
  return (
    <div className="@container flex min-w-0 flex-col">
      <div className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {titleId ? (
            <Sel id={titleId} className="min-w-0 px-0.5">
              <span style={{ ...titleCss, ...styleOf(styles, titleId) }} className="block truncate text-[15px] font-semibold text-[#364658]">{title}</span>
            </Sel>
          ) : (
            <span style={titleCss} className="min-w-0 truncate text-[15px] font-semibold text-[#364658]">{title}</span>
          )}
          {showCount && (
            plain
              ? <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">{count}</span>
              : (
                <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
                  {count}
                </span>
              )
          )}
        </span>
        {showViewAll && (
          <span style={linkCss} className="flex flex-shrink-0 items-center gap-1 text-[#7B8FA5]">
            {/* ⚠️ Tailwind v4 arbitrary container queries are `@min-[…]`, not the v3 plugin's
                `@[…]` — the old form compiles to nothing and the label never hides. */}
            {/* ⚠️ The LABEL is its own node, the chevron is not. The words are the admin's to rewrite;
                the chevron is the affordance that says "this goes somewhere" and belongs to the
                product. Wrapping both would offer to edit an arrow. */}
            {/* ⚠️ `hasFixedTitle` gates the LINK as well as the heading. A predefined widget's
                words are the product's — that rule was applied to the title and missed here, so the
                one thing still editable on My Open Requests was "View all", which is the last text
                on the card anybody should be renaming. Same predicate, so the two cannot drift: if a
                widget's heading is fixed, its link is too.
                A Record List and anything else an admin builds keeps both, because there the words
                genuinely are theirs. */}
            {cfg.viewAllLabel && rid && !hasFixedTitle(rid) ? (
              <Sel id={`${rid}-viewall`} className="hidden px-0.5 @min-[240px]:inline-block">
                <span className="text-[12px] font-medium">{String(cfg.viewAllLabel)}</span>
              </Sel>
            ) : cfg.viewAllLabel ? (
              <span className="hidden text-[12px] font-medium @min-[240px]:inline">{String(cfg.viewAllLabel)}</span>
            ) : null}
            <ChevronsRight size={16} />
          </span>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1 px-4 pb-3">{children}</div>
    </div>
  );
}

/* One live row's ID pill — placement is a per-widget decision, so it is drawn in one place.
   ⚠️ `max-w-full truncate` rather than a bare `whitespace-nowrap`: a long one like
   "AST-13: DESKTOP-5JPPI6F" would otherwise set a min-content floor that pushes the card wider than
   its column and defeats every width the section asks for. */
const IdPill = ({ children }: { children: ReactNode }) => (
  <span className="max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]">{children}</span>
);

/** The rows container — P4's dividers and gap, resolved. */
function ListBody({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  const { dividers, gap } = useListChrome(nodeId);
  return (
    <div
      style={gap !== undefined ? { display: 'flex', flexDirection: 'column', gap: `${gap}px` } : undefined}
      className={dividers ? 'divide-y divide-[#F0F2F5] border-t border-[#F0F2F5]' : 'border-t border-[#F0F2F5]'}
    >{children}</div>
  );
}

/** One row — P4's density decides how much air it gets. */
function Row({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  const { rowPad } = useListChrome(nodeId);
  return <div style={{ paddingTop: rowPad, paddingBottom: rowPad }}>{children}</div>;
}

/* ── The page ────────────────────────────────────────────────────────────── */

export function SupportPortalPreview({ accent = '#0F172A', content = DEFAULT_CONTENT, sections = [], icons, placedText, blockOrder = DEFAULT_BLOCK_ORDER, rowOrder = DEFAULT_ROW_ORDER, removed = [], rowExtras, cfg, setCfg, blank = false, rail, pageImage }: SupportPortalPreviewProps) {
  const { styles, enabled, select, pickIcon } = useCanvas();
  /* Which mode the surrounding theme wrapper is in. Inline styles cannot be answered by the dark
     stylesheet, so the few values that are data rather than utilities read it here. */
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const read = () => setDarkMode(!!document.querySelector('.portal-dark'));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  const st = (id: string) => styleOf(styles, id);
  /* A node's OWN padding and dragged height, for the elements that paint their own card and
     therefore have to apply both themselves. Vertical is px, horizontal is %, as everywhere else. */
  const padCss = (id: string): React.CSSProperties => {
    const pad = styles[id]?.padding;
    const h = styles[id]?.height;
    return {
      ...(pad?.top !== undefined ? { paddingTop: pad.top } : {}),
      ...(pad?.bottom !== undefined ? { paddingBottom: pad.bottom } : {}),
      ...(pad?.left !== undefined ? { paddingLeft: `${pad.left}%` } : {}),
      ...(pad?.right !== undefined ? { paddingRight: `${pad.right}%` } : {}),
      ...(h !== undefined ? { minHeight: h } : {}),
    };
  };
  /* ⚠️ A card given its OWN padding or height stops being stretched to the row's height.
     Without this, padding ONE action card made every card in the row grow with it: a row is
     `align-items: stretch`, so the tallest child sets the height and the rest follow it. The other
     cards' padding never changed — they just became as tall as the one that did — but on screen
     that is indistinguishable from "the padding applied to all three", which is exactly how it was
     reported. `align-self` is the standard flexbox answer to "this one item is sized differently":
     the card you edited grows, its neighbours keep the height their own content asks for, and an
     untouched row still renders as the tidy equal-height row it always did. */
  const hasOwnSize = (id: string) => !!styles[id]?.padding || styles[id]?.height !== undefined;
  /* Once ANY member of a row has been sized by hand, the row stops stretching its cards to a common
     height and each one takes the height its own content asks for. An untouched row still renders as
     the tidy equal-height row it always did — this only fires after somebody has said one card is
     different. ⚠️ An explicit Columns-alignment on the section always wins: it is the more specific
     decision, and silently overriding a control the admin set is worse than the stretch was. */
  const rowFits = (ids: string[], sectionId: string): React.CSSProperties =>
    (wc(sectionId).valign === undefined && ids.some(hasOwnSize) ? { alignItems: 'flex-start' } : {});

  /** A widget's resolved config, or its rendering defaults when the builder passes none. */
  const wc = (id: string) => cfg?.(id) ?? EMPTY_CFG;
  /* §7.22 — the page layer. Its primary colour drives the hero gradient, so a preset visibly
     retints the page rather than only changing a swatch in the panel. */
  const pageCfg = wc(PAGE_ID);
  const pageAccent = String(pageCfg.primary ?? accent);

  /* A row member's DEFAULT share, before anyone drags it. Rows are flex rather than grid so a
     resize can hand shares around between siblings; grid tracks would ignore them. */
  /* ⚠️ `grow` is what Fixed items turns off — and ONLY grow. The basis stays exactly what it was,
     so switching a row to Fixed changes nothing on screen: the columns hold the widths they already
     had, and from that point only what you drag moves. A mode that visibly rearranged the page the
     moment you chose it would be read as having done something wrong. */
  const share = (cols: number, gap = 16, grow = 1): React.CSSProperties => ({ flex: `${grow} ${grow} calc((100% - ${(cols - 1) * gap}px) / ${cols})` });

  /* §7.21 — a section owns its column count, its gap and the air above and below it. Read through
     the widget config so the drawer's sliders move the real band. */
  const secCols = (id: string, fallback: number) => Number(wc(id).cols ?? fallback);
  const secGap = (id: string) => Number(wc(id).colGap ?? 16);
  /* §Responsive behaviour — how this section's first-layer columns share their row. */
  const secResize = (id: string) => String(wc(id).resize ?? 'fill');
  const secGrow = (id: string) => (secResize(id) === 'fixed' ? 0 : 1);
  /* ⚠️ Padding is applied only when it has actually been SET. A spec default here would silently
     add space to every band the day the control shipped — the same reason `containerCss` skips
     theme-sourced values. */
  /* A hero text node's own placement.
     ⚠️ Its `align` comes from the floating toolbar and beats the band's `contentAlign`, because it
     is the more specific decision — you selected THAT heading and pressed left. Falling back to the
     band keeps an untouched hero behaving exactly as before.
     ⚠️ The max-width is applied HERE, with margins keyed to the same alignment: a capped line that
     kept auto margins would centre itself no matter which button you pressed, which is precisely
     the bug this replaces. */
  /* The banner's background, resolved once — the band and (when asked) the page share it. */
  const heroCfg = wc('hero');
  const heroImg = String(heroCfg.bannerImage ?? '');
  /* ⚠️ Colour REPLACES the image, it does not tint it. `background` alone leaves any
     `background-image` already on the box in place, so picking a colour painted UNDER the artwork
     and came out as a tinted photograph — which is not what choosing "Colour" means. Setting
     `backgroundImage: 'none'` explicitly is what makes the two tabs mutually exclusive. */
  /* ⚠️ Every image setting resolves HERE, in one place. Fit, focal point, tiling and the darkening
     shade are four separate questions and they were all previously hard-coded to "cover, centre,
     no shade" — the panel could store them and the band ignored them.
     ⚠️ The shade is a gradient layered ABOVE the artwork in the same `background-image`, not an
     overlay element: an extra div would sit between the band and its own heading, and the heading
     has to stay on top of the thing darkening the picture behind it. */
  const heroFit = String(heroCfg.bannerFit ?? 'cover');
  const heroShade = Number(heroCfg.bannerShade ?? 0) / 100;
  /* ⚠️ The keys are the NinePoint control's own values — 'top left', with a SPACE. Written as
     'top-left' the lookup missed on every corner and silently fell back to centre, so the focal
     point stored a value and the band never moved. */
  const NINE: Record<string, string> = {
    'top left': 'left top', top: 'center top', 'top right': 'right top',
    left: 'left center', center: 'center center', right: 'right center',
    'bottom left': 'left bottom', bottom: 'center bottom', 'bottom right': 'right bottom',
  };
  /* ⚠️ A full-page picture and a banner picture are two artworks competing for one screen, and the
     banner is on top — so the page background an admin just uploaded would be entirely invisible.
     The banner falls back to its COLOUR here rather than being blanked: a transparent band would
     drop the search field onto the artwork with no contrast guarantee at all, which is the one thing
     `portalContrast` exists to prevent. The panel says this will happen before it happens. */
/* ── Template LOOKS ──────────────────────────────────────────────────────────
   Three keys, and every one of them is a decision a template makes about the whole page rather
   than a colour. They live in config, so a template stays a preset — see the note on the seed —
   and the panel can expose them later without any of this moving.

   ⚠️ Deliberately NOT a "theme". A theme changes hue and typeface; these change SHAPE — where the
   search lives, what a card is made of, what the banner is. That is the difference between a
   recolour and a template, and the first pass at Spotlight got it wrong by only doing the former. */
  /* Where the search sits. `floating` lifts it OUT of the banner and lands it across the bottom
     edge, half on the colour and half on the page — so the field reads as the page's subject
     rather than as furniture inside a picture, and it is the first thing under the fold too. */
  const searchFloats = String(wc('hero').searchPlacement ?? 'in-banner') === 'floating';
  /* A third value on the same key, not a new one — see the note on `searchPlacement` above.
     `side` pairs the heading block with the search box on one row (`align-items:flex-end`, mirroring
     the reference this was built from) instead of stacking the search below the subtitle. */
  const searchSide = String(wc('hero').searchPlacement ?? 'in-banner') === 'side';
  /* What a card is. `spine` drops the hairline box for a tinted panel with a coloured edge — the
     colour names the KIND of card at a glance, which a page of identical white boxes cannot do. */
  const cardLook = String(pageCfg.cardLook ?? 'panel');
  const spineCards = cardLook === 'spine';
  /* ⚠️ Five more, and each is independently useful — a light banner needs dark ink whatever else
     the page does, and a tabbed work band is a decision on its own. Behind one `skin` key they
     could only ever move together, which is a TEMPLATE's job (it bundles them in its seed), not a
     config's. Same rule the three above already follow: these change SHAPE, not hue. */
  /* Ink ON the banner. A pale band with the default white heading is an invisible heading, so
     this travels with any light `bannerColor` — it is not tied to one template. */
  const darkHeroInk = String(pageCfg.heroInk ?? 'light') === 'dark';
  /* Action cards as centred TILES — icon above the words — and the arrow moves to the top-right
     corner on hover. A permanent link at the foot of every card is four links competing; a hover
     affordance in the corner is one, and only while you are pointing at it. */
  const tileActions = String(pageCfg.quickLook ?? 'row') === 'tile';
  /* A third `quickLook` value, not a new key — same rule `bannerStyle`'s `light` follows. `glass`
     is the band CONTINUING past the heading rather than a card treatment: no climb (the row already
     sits flush against the hero, painted the same colour by its own `cfg.bg`, so there is nothing to
     climb toward), no forced centring and no hover arrow (both are `tile`'s, and a card here picks
     its own layout via `cardTemplate` instead — see `stackedLeft`). Independent of the hero's own
     `searchSide` layout: a template could want one without the other. */
  /* ⚠️ Both looks put the cards INSIDE the banner, which is what this flag actually gates — the
     two differ only in the shape of the card, and that is decided per-card by the seed. */
  const quickOnBanner = String(pageCfg.quickLook ?? 'row') === 'glass' || String(pageCfg.quickLook ?? 'row') === 'rail';
  /* Services on a tinted PANEL rather than loose on the page ground. */
  const servicesPanel = String(pageCfg.servicesLook ?? 'plain') === 'panel';
  /* ⚠️ Where the rail LIVES, not what is in it — membership is still the `rail` array. Beside the
     services panel the rail reads as "what the desk wants you to know"; beside the work cards it
     reads as more of your own records, which is not what Announcements and Contact are. */
  const railInServices = String(pageCfg.railHome ?? 'work') === 'services';
  /* Requests, Approvals and Most Read in ONE container. See the branch — each panel still mounts
     the real card node, so all three keep their selection and their widget drawer. */
  const workTabs = String(pageCfg.workLook ?? 'cards') === 'tabs';
  /* Contact Us as the page's one dark surface, so it reads as the last resort. */
  const darkHelp = String(pageCfg.helpLook ?? 'plain') === 'dark';
  /* Which artwork the banner carries. `shapes` is the geometric composition — see `HeroShapes`;
     the default line-work only ever showed on an untouched band, so a template that sets a colour
     had no way to ask for artwork at all. */
  const heroShapes = String(pageCfg.heroArt ?? 'auto') === 'shapes';
  /* A third `heroArt` value, not a new key — same rule `bannerStyle`'s `light` follows. */
  const heroCounterShapes = String(pageCfg.heroArt ?? 'auto') === 'counter';
  /* Favourite Services and Most Used Services SIDE BY SIDE rather than stacked as two full-width
     bands. They are the same object with two sort orders, so two full-width rows of four is the
     same content read twice down the page; at half width each they read as one browse area.
     ⚠️ Drawn from the FAVOURITES band and the services band then renders nothing — the same
     render-in-one-place rule `railHome` follows, and the only way to guarantee the page cannot
     carry either section twice. */
  const browseSplit = String(pageCfg.browseLook ?? 'stacked') === 'split';
  /* ⚠️ A new page ARCHETYPE, not a banner variant: the hero stops being a band across the top and
     becomes a full-height column beside everything else. The page then divides once — the rail is
     what you DO (identity, search, the actions), the right column is what you HAVE.
     ⚠️ Implemented as `contents` when off, so the default layout renders the identical tree it
     always did — an extra wrapper div around every page would have changed spacing on all of them
     to buy one template a row. */
  const heroSide = String(pageCfg.heroPlacement ?? 'top') === 'left';
  /* Action cards as full-width ROWS inside the rail — icon, label, chevron. A rail is a column, so
     a card that is wider than it is tall is the only shape that fits it. */
  const quickRail = String(pageCfg.quickLook ?? 'row') === 'rail';
  /* Service tiles as rounded PILLS on the page ground rather than cards in a grid. A service is a
     link, and a row of links does not need four boxes to say so. */
  const servicesChips = String(pageCfg.servicesLook ?? 'plain') === 'chips';
  /* ⚠️ Contact Us into the HERO. It is the one card on the page that is not a record — it is the
     fallback for when nothing else worked — so on a rail layout it belongs with the greeting and
     the opening hours rather than among the requester's own things. Keeping it in the right column
     would also leave that column ending on a one-third-width oddity. */
  const contactInHero = String(pageCfg.contactHome ?? 'work') === 'hero';
  /* The rail's members as a ROW BENEATH the work cards instead of a column beside them. Same
     membership question the `rail` array already answers; only the placement differs — which is
     exactly what `railHome` was added for. */
  const railBelow = String(pageCfg.railHome ?? 'work') === 'below';
  /* ⚠️ Whether the WORK band draws a rail — which is not the same question as whether the page has
     one. Once the rail has moved beside the services panel this band has no rail to draw, and
     testing `rail` alone left it rendering an empty second column and squeezing its three cards
     into a third of the width. */
  /* ⚠️ Three placements now, so the work band's own question is the narrow one: does IT draw a
     rail? Not "does the page have one" — the rail may have moved beside services or below the
     cards, and in both cases this band must lay out as a flat row or it renders an empty column. */
  const workRail = rail && !railInServices && !railBelow;
  /* Which of the three work tabs is open. Local, because it is a reading position rather than a
     property of the page — nothing an admin sets and nothing to persist. */
  const [workTab, setWorkTab] = useState('requests');

  const heroBg: React.CSSProperties = pageImage
    ? { backgroundColor: String(heroCfg.bannerColor ?? '#3D8BD0'), backgroundImage: 'none' }
    : heroCfg.bgKind === 'color'
    /* ⚠️ A flat fill and a GRADIENT fill are the same "Colour" tab, one key apart. A second tab
       would have made the admin choose a kind before choosing a colour, when the colour is the
       thing they came to set — so `bannerStyle` sits beside it and deepens the same value.
       The glow is a radial highlight offset to the upper left, which is what keeps a large flat
       band from reading as a printed rectangle. */
    /* ⚠️ A THIRD value on the same key, not a new one. `gradient` deepens toward navy, which is
       correct for a dark band and wrong for a pale one — it would drag light green to near-black.
       `light` runs the falloff the other way: the same one hex, lifted toward white. */
    ? (String(heroCfg.bannerStyle ?? 'flat') === 'light'
      ? {
        backgroundColor: String(heroCfg.bannerColor ?? '#D5E9DE'),
        backgroundImage: `radial-gradient(120% 150% at 82% 8%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 58%), linear-gradient(158deg, ${String(heroCfg.bannerColor ?? '#D5E9DE')} 0%, #EEF7F2 54%, #E2F0E9 100%)`,
      }
      : String(heroCfg.bannerStyle ?? 'flat') === 'gradient'
      ? {
        backgroundColor: String(heroCfg.bannerColor ?? '#3D8BD0'),
        backgroundImage: `radial-gradient(120% 140% at 18% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, ${String(heroCfg.bannerColor ?? '#3D8BD0')} 0%, #0B1B3F 100%)`,
      }
      : { backgroundColor: String(heroCfg.bannerColor ?? '#3D8BD0'), backgroundImage: 'none' })
    : heroImg
      ? {
        backgroundImage: heroShade > 0
          ? `linear-gradient(rgba(0,0,0,${heroShade}),rgba(0,0,0,${heroShade})), url("${heroImg}")`
          : `url("${heroImg}")`,
        backgroundSize: heroFit === 'stretch' ? '100% 100%' : heroFit === 'auto' ? 'auto' : heroFit,
        backgroundPosition: NINE[String(heroCfg.bannerPos ?? 'center')] ?? 'center center',
        backgroundRepeat: heroFit === 'auto' && heroCfg.bannerRepeat === true ? 'repeat' : 'no-repeat',
      }
      : { backgroundColor: 'transparent', backgroundImage: `linear-gradient(135deg, ${pageAccent} 0%, #050B18 100%)` };

  const heroLine = (nodeId: string): React.CSSProperties => {
    const own = styles[nodeId]?.align;
    const a = String(own ?? heroAlignX(String(wc('hero').contentAlign ?? 'center')));
    const cap = `${Number(wc('hero').contentMaxWidth ?? 70)}%`;
    return {
      textAlign: a as React.CSSProperties['textAlign'],
      maxWidth: cap,
      marginLeft: a === 'right' ? 'auto' : a === 'center' ? 'auto' : 0,
      marginRight: a === 'left' ? 'auto' : a === 'center' ? 'auto' : 0,
    };
  };

  /* ⚠️ Which CSS property an alignment writes DEPENDS ON THE AXIS. On a row of columns "Content
     alignment" runs along the main axis (justify) and "Columns alignment" across it (align); the
     moment the section is stacked those two swap, because the main axis is now vertical. Mapping
     them unconditionally meant every control on a stacked section drove the wrong direction — the
     row that said "Left" moved things up. */
  const secRowAxis = (id: string, fallback: number) => secCols(id, fallback) > 1;
  /* ⚠️ A card with flex-grow 1 fills every pixel, so there is no free space and justify-content can
     do NOTHING — which is why Content alignment looked dead however it was wired. Packing the row
     is therefore part of choosing an alignment that is not "fill", not a separate setting: the
     class goes on exactly when the chosen value needs room to move within. */
  const secPacked = (id: string, fallback: number) => {
    const rowAxis = secRowAxis(id, fallback);
    return rowAxis && String(wc(id).distribute ?? 'start') !== 'start';
  };
  /* ⚠️ Only on a ROW. A stacked section has one column per row, so there are no tracks to hold
     still and a grid would be the same layout described a harder way. */
  const secGrid = (id: string, fallback: number): React.CSSProperties => {
    if (secResize(id) !== 'fixed' || !secRowAxis(id, fallback)) return {};
    const n = Math.max(1, secCols(id, fallback));
    return { display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  };

  const secBox = (id: string, fallback = 3): React.CSSProperties => ({
    paddingTop: wc(id).padTop === undefined ? undefined : Number(wc(id).padTop) || undefined,
    paddingBottom: wc(id).padBottom === undefined ? undefined : Number(wc(id).padBottom) || undefined,
    /* Columns alignment — how the cards sit on the CROSS axis. `stretch` is the odd one out: it is
       the flex default the row already has, so it is expressed as `undefined` rather than a value. */
    flexDirection: secRowAxis(id, fallback) ? undefined : 'column',
    alignItems: ({ start: 'flex-start', center: 'center', end: 'flex-end', stretch: undefined, between: undefined, around: undefined } as
      Record<string, string | undefined>)[String(
        secRowAxis(id, fallback) ? (wc(id).valign ?? 'stretch') : (wc(id).distribute ?? 'stretch'),
      )],
    /* Content alignment — how the cards distribute along the MAIN axis. Inert until now: the
       control wrote the key and nothing read it. */
    justifyContent: ({ start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', stretch: undefined } as
      Record<string, string | undefined>)[String(
        secRowAxis(id, fallback) ? (wc(id).distribute ?? 'start') : (wc(id).valign ?? 'start'),
      )],
    /* Size › Height. minHeight not height, so a band still grows when its content needs more room —
       a fixed height would clip the cards the moment someone raised the icon size. */
    minHeight: Number(wc(id).minHeight) || undefined,
  });

  /* Statuses is a DISPLAY toggle, not a row filter: unticking one hides that status badge from the
     rows that carry it, and the request itself stays listed. Filtering rows out instead would make
     "Show 5" and the status list fight over how many rows appear. */
  const visibleRequests = PORTAL_OPEN_REQUESTS.slice(0, Number(wc('requests').show ?? content.requests.show));
  const visibleApprovals = PORTAL_APPROVALS.slice(0, Number(wc('approvals').show ?? content.approvals.show));
  const visibleArticles = PORTAL_ARTICLES.slice(0, Number(wc('knowledge').show ?? content.knowledge.show));

  /* The seam under a block, plus any sections added there.
     ⚠️ It MUST carry its own `order`. The bands are sequenced with CSS order inside a flex column,
     and a child without one defaults to 0 — which silently collapsed every seam to the top of the
     page and made the lower ones disappear. Bands take even slots, seams the odd slot after them. */
  const slot = (id: string) => blockOrder.indexOf(id) * 2;
  /* ⚠️ A band not in `blockOrder` is NOT ON THE PAGE. The bands were rendered unconditionally and
     only took their POSITION from the order, so a layout that left one out still drew it — at
     `indexOf === -1`, which is order -2, i.e. FIRST. Dropping Most Used Services from the v2 seed
     moved it to the top of the page instead of removing it.
     ⚠️ `hero` is deliberately not gated: it is in no layout's `blockOrder`, because the banner is
     not a block you reorder. */
  const band = (id: string, node: ReactNode) =>
    (blockOrder.includes(id) && !removed.includes(id) ? node : null);
  /* ⚠️ The gutter belongs to the SEAM, not to this wrapper. With `px-6` here, every added section
     rendered inside it inherited a second 24px inset on top of its own — so a new section sat 24px
     right of every built-in band and looked unaligned, because it was. The seam keeps the gutter so
     its rule still lines up with the sections above and below it.
     ⚠️ A JSX comment cannot be the first thing inside a parenthesised return — it is an expression
     slot, not a child slot yet. */
  const after = (id: string) => (
    <div style={{ order: slot(id) + 1 }}>
      <div className="px-6"><AddSectionSeam afterId={id} /></div>
      {/* ⚠️ Every added section gets its OWN seam too, not just the four built-in bands. Without
          one, the page could only ever grow at the four original anchors: you could add a section
          under the hero but never under the section you had just added, and the CTA a section
          offers on hover had nowhere to appear. The seam's `afterId` is the section itself, which
          is also what makes `addSection` splice the next one in directly below it. */}
      {sections.filter((s) => (blank ? BUILT_IN_ANCHORS.has(s.afterId) : s.afterId === id)).map((s) => (
        <Fragment key={s.section.id}>
          <AddedSection section={s.section} icons={icons} placedText={placedText} cfg={cfg} />
          <div className="px-6"><AddSectionSeam afterId={s.section.id} /></div>
        </Fragment>
      ))}
    </div>
  );

  /* Order and removal are handled HERE, once, for every card on the page.
     CSS `order` reorders flex siblings without moving the JSX, which keeps a move action to one
     number instead of a structural rewrite of the page body. */
  /* ⚠️ `orderAt` overrides the order a card takes from its own row list. Two lists both start at
     0, so the main region — which draws two cards from `work` and two from `records` — came out
     as 0, 1, 0, 1 and CSS interleaved them: Requests, Assets, Approvals, CIs. An order is only
     meaningful within ONE list, and this region mixes two. */
  /* ⚠️ The rail's two cards, built in ONE place because they now have TWO possible homes — beside
     the services panel or inside the work band. Authoring them at each call site is two places for
     a fix to land in one, which is the same reason the work band builds its cards as consts.
     (It calls `card` below; a const arrow is only read at call time, and every call happens
     during render, long after both are initialised.) */
  const railCard = (id: string) => {
    if (id === 'news') return card('news', <div className="p-4"><AnnouncementsRender nodeId="news" cfg={{ title: 'Announcements', ...wc('news') }} /></div>, 1, secGap('work'), 1);
    /* ⚠️ Counter's right-hand rail — Assets stacked under Approvals. RecordsCard, not RecordTiles:
       the tile grid is built for a WIDE row, and a narrow rail column wants the same compact list
       treatment `records` already uses when there is no rail at all. */
    if (id === 'assets') return card('assets', <RecordsCard nodeId="assets" titleFallback={content.assets.title} cfg={wc('assets')} rows={MY_ASSETS} />, 1, secGap('work'), 1);
    if (id !== 'contact') return null;
    const body = <ContactRender nodeId="contact" cfg={{ title: 'Contact Us', ...wc('contact') }} />;
    /* ⚠️ `bare` on the dark one, or the card paints a white surface and the dark panel sits
       inside it with a white ring showing at every corner. The panel IS the card here. */
    return darkHelp
      ? card('contact', <div className="portal-help-dark rounded-xl bg-[linear-gradient(152deg,#1E3050_0%,#16233A_62%,#101B2E_100%)] p-4">{body}</div>, 1, secGap('work'), 1, undefined, { bare: true })
      : card('contact', <div className="p-4">{body}</div>, 1, secGap('work'), 1);
  };

  const card = (id: string, body: ReactNode, cols?: number, gap = 16, grow = 1, orderAt?: number, look?: { full?: boolean; bare?: boolean }) => {
    if (removed.includes(id)) return null;
    /* ⚠️ Membership comes from `rowOf` — the STATIC map of which row a card belongs to — not from
       searching the live `rowOrder`. Deleting a fixed card takes it out of `rowOrder`, so a search
       of the live order finds no row for it and the guard below had nothing to test:
         const row = Object.keys(rowOrder).find((r) => rowOrder[r].includes(id));
         if (row && !rowOrder[row].includes(id)) return null;
       The second line could never fire — `row` was found by that very test — so a deleted card fell
       through and rendered anyway, at order 0. Delete reported "Removed", the toolbar and the
       palette both believed it, and the card stayed on the page. */
    const home = rowOf(id);
    if (home && !(rowOrder[home] ?? []).includes(id)) return null;
    const order = orderAt ?? (home ? (rowOrder[home] ?? []).indexOf(id) : 0);
    return cardInner(id, body, cols, order, gap, grow, look);
  };

  const cardInner = (id: string, body: ReactNode, cols: number | undefined, order: number, gap = 16, grow = 1, look?: { full?: boolean; bare?: boolean }) => (
    /* ⚠️ No overflow-hidden here. The chip sits at -top-4 and the toolbar at -top-11, both OUTSIDE
       the wrapper — clipping it silently removes the card's hover outline and quick actions. */
    /* ⚠️ `min-w-0` is what makes the row honour its column count. Without it a card's widest
       unbreakable content — the "AST-13: DESKTOP-5JPPI6F" pill, a long subject — sets a min-content
       floor above the flex basis, and the third card wraps to its own line however many columns the
       section says it has. */
    /* ⚠️ styleOf BELONGS HERE. Every widget panel writes its Spacing and Size into styles[id],
       but this call site spread only the flex share and the order — so padding, margin, width and
       height set on a card were stored and never read, and the controls looked inert while working
       perfectly. Spread before order, which is this row own concern and must win. */
    /* ⚠️ `gridColumn: 1 / -1` for a full-width card, NOT a bigger flex share. The region that holds
       these is a GRID — `share()` writes flex properties a grid ignores, which is why a card asking
       for two columns still came out in one cell. The grid needs to be told in its own language.
       ⚠️ EVERY card is white with a hairline, including these two. Tinting the card and leaving its
       tiles white was tried and reversed: it made My Assets and My CIs the only two cards on the
       page built differently from the four around them, so the page had two card languages and the
       difference read as a state rather than as a kind. The contrast the tiles need comes from
       filling the TILES instead — see `RecordTiles` — which keeps one card treatment for everything
       and still separates the items inside these two. */
    /* ⚠️ ONE card treatment for the whole page, chosen by the template. The alternative — letting
       each card pick — is the two-card-languages problem the note above already records: a
       difference between cards reads as a STATE ("this one is selected/urgent") rather than as a
       kind, and nobody can tell you which. */
    <Sel
      id={id}
      /* ⚠️ `bare` paints NO surface. A card mounted inside a container that already draws a
         border and a background would otherwise draw a second one 1px inside the first — which is
         what a tabbed work band looked like before this existed. */
      className={look?.bare
        ? 'min-w-0'
        : spineCards
        ? 'min-w-0 overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.14)]'
        : 'min-w-0 rounded-xl border border-[#E5E7EB] bg-white'}
      style={{ ...(cols ? share(cols, gap, grow) : {}), ...(look?.full ? { gridColumn: '1 / -1' } : {}), order }}
    >
      {/* No overflow-hidden: a card must be free to grow past a dragged height rather than clip
          its own rows. The radius is on the Sel wrapper, which keeps the corners.
          ⚠️ The spine is a LEFT BORDER on this inner box, not a pseudo-element or an absolute bar:
          it has to survive a dragged height and a card that grows past it, and a border is the one
          thing that always runs the full height of what it is on. Its colour comes from the card's
          own id, so the kind of card is legible before a word is read. */}
      <div
        style={{ ...(spineCards ? { borderLeft: `3px solid ${SPINE[id] ?? '#3D8BD0'}` } : {}), ...st(id) }}
        className={spineCards ? 'rounded-[14px]' : 'rounded-xl'}
      >{body}</div>
    </Sel>
  );

  /* Order and membership come from state, so the toolbar's move and delete actually rewrite what
     the page renders rather than only what it remembers. */
  const inRow = (row: string) => (rowOrder[row] ?? []).filter((x) => !removed.includes(x));
  const quickCards = inRow("quick")
    .map((cid) => content.quick.find((q) => q.id === cid))
    .filter((q): q is typeof content.quick[number] => !!q);

  /* ⚠️ Built ONCE and placed in ONE of two spots — literally INSIDE the hero band's own colored div
     when `quickOnBanner`, or in its normal position below the hero otherwise — the same "one card,
     two possible homes" pattern the work-band's `requestsCard`/`approvalsCard` consts already use.
     Counter's whole point is that the tiles are not merely colour-matched to LOOK like part of the
     banner while remaining a separate sibling section underneath it — they have to actually BE inside
     the hero's own DOM node, or a canvas that lets you hover/select "Hero" as its own bounded region
     keeps reading as two bands however well the colours line up. */
  const quickSection = (
    <Sel id="quick" className={`relative z-10 ${SECTION_PAD} ${blockOrder.indexOf("quick") === 0 && !searchFloats && !tileActions && !quickOnBanner ? "-mt-[62px]" : ""} ${searchFloats ? "pt-[52px]" : ""} ${tileActions || quickOnBanner ? "pt-6" : ""}`} style={{ order: slot("quick"), ...fillCss(wc('quick')), ...(quickOnBanner ? { marginTop: -1 } : {}) }}>
      <RowDrop rowId="quick" resize={secResize("quick")} className={`flex flex-wrap${secPacked("quick", 4) ? " portal-row-packed" : ""}`} style={{ gap: secGap("quick"), ...secBox("quick", 4), ...rowFits(inRow("quick"), "quick"), ...secGrid("quick", 4) }}>
        {quickCards.map((a) => {
          const c = wc(a.id);
          /* ⚠️ The CARD's own template wins; the row's is the default it starts from.
             Read the other way round the card's picker was dead — see the note in fixB. */
          /* ⚠️ The tile look changes the DEFAULT, never the card's own choice — a card that
             has picked a template still wins, which is the rule the line already followed. */
          const tpl = String(c.cardTemplate ?? wc('quick').cardTemplate ?? c.iconPos ?? (tileActions ? 'top' : 'left'));
          const cardImage = isImageChoice(icons?.[a.id]) ? icons![a.id]!.src : null;
          const top = tpl === 'top';
          /* ⚠️ A SEPARATE value from `top`, not a variant of it — `top` deliberately always
             centres (see the note on `centre` below), so a card that wants the icon stacked
             ABOVE the words while both stay LEFT-aligned (the reference's glass tiles) needs
             its own branch rather than a flag that would also loosen every existing `top`
             card's forced centring. */
          const stackedLeft = tpl === 'stackedLeft';
          const iconRight = tpl === 'right';
          /* ⚠️ "Text only" is a real template, and the picker has always offered it — the
             card just never read it, so choosing the fourth tile changed the highlight and
             nothing else. Where the icon sits and whether there IS one are one question with
             four answers, which is exactly why they share a control. */
          const noIcon = tpl === 'none';
          /* ⚠️ Icon top ALWAYS centres — the words as well as the icon. Picking the stacked
             tile IS the decision to centre; there is no reading of it where the icon sits in
             the middle and the text hugs the left edge, which is what you got when this
             deferred to the card's own `contentAlign`. That check could not tell "nobody
             chose" from "chose start", so any card carrying a left-ish value quietly
             out-voted the template it was told to follow — and the result looked like the
             icon had fallen out of the row rather than like an arrangement anyone picked. */
          const centre = top || tileActions || c.contentAlign === 'center';
          // P6: the icon's size, colour and container are style; WHICH icon is content.
          const iconSize = chosen(styles, a.id, 'iconSize') ?? 22;
          const iconColor = chosen(styles, a.id, 'iconColor');
          const iconShape = chosen(styles, a.id, 'iconShape');
          const iconFill = chosen(styles, a.id, 'iconFill');
          return (
            <Sel key={a.id} id={a.id} className="@container min-w-0 rounded-lg" style={{ ...share(secCols("quick", content.cols.quick), secGap("quick"), secGrow("quick")) }}>
              <div
                /* ⚠️ fillCss AFTER st(): the card's Style accordion writes fill / colour /
                   image / border / radius into its CONFIG, and this div was reading only the
                   style store — so every one of those controls saved a value the canvas never
                   looked at. Config last, because it is the more specific decision. */
                /* ⚠️ padCss LAST, and `p-4` KEPT. Sel withholds padding for this node
                   (paintsOwnSurface) so it has to land here — but dropping the class the
                   moment any side was set collapsed the sides the slider had NOT touched to
                   zero: setting a left inset silently removed the card's 16px top and
                   bottom. An inline side beats the class on its own edge and leaves the
                   other three resting where they were, which is what "set one side" means. */
                style={{ ...st(a.id), ...fillCss(c), ...padCss(a.id), minHeight: Number(c.minHeight) || undefined }}
                /* ⚠️ The action cards follow the PAGE's card look too. Left on the hairline
                   treatment while the record cards below had gone borderless, the page ended
                   up with two card languages one band apart — which is the exact fault the
                   note in `cardInner` warns about, committed by the template that quoted it.
                   ⚠️ No SPINE on these, though. A spine names a kind of record; an action
                   card is a destination, and colouring four of them in four hues would be
                   inventing a taxonomy the product does not have. Same surface, no stripe. */
                className={`group/act relative flex h-full gap-3 p-4 @max-[230px]:gap-2 @max-[230px]:p-3 ${tileActions ? 'items-center justify-center px-5 py-6 text-center transition-[transform,box-shadow] hover:-translate-y-0.5' : ''} ${
                  spineCards
                    ? 'rounded-[14px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.14)]'
                    : 'rounded-lg border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)]'
                } ${
                  top ? 'flex-col' : stackedLeft ? 'flex-col justify-between' : iconRight ? 'flex-row-reverse items-center' : 'items-center'
                } ${centre ? 'items-center text-center' : ''}`}
              >
                {tileActions && (
                  <span aria-hidden className="pointer-events-none absolute right-3 top-3 flex size-8 items-center justify-center rounded-[9px] bg-[#1E7A5A] text-white opacity-0 transition-opacity duration-150 group-hover/act:opacity-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-[15px]">
                      <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" />
                    </svg>
                  </span>
                )}
                {!noIcon && <Sel id={`${a.id}-icon`} className="flex-shrink-0 @max-[230px]:scale-90 @max-[160px]:hidden">
                <span
                  role={enabled ? 'button' : undefined}
                  onClick={enabled ? (ev) => { ev.stopPropagation(); select(`${a.id}-icon`); pickIcon(a.id, (ev.currentTarget as HTMLElement).getBoundingClientRect()); } : undefined}
                  title={enabled ? 'Click to change this icon' : undefined}
                  style={{
                    color: iconColor as string | undefined,
                    background: cardImage
                      ? undefined
                      : iconShape === 'none' ? 'transparent' : (iconFill as string | undefined),
                    backgroundImage: cardImage ? `url(${cardImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: iconShape === 'circle' ? 999 : undefined,
                    width: Number(iconSize) + 22, height: Number(iconSize) + 22,
                  }}
                  className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded text-[#475467] ${
                    cardImage ? '' : 'bg-[#F1F5F9]'
                  } ${enabled ? 'cursor-pointer outline outline-1 outline-transparent transition-[outline-color] hover:outline-[#3D8BD0]' : ''}`}
                >
                  {cardImage || noIcon ? null : iconNode(icons?.[a.id], Number(iconSize))
                    ?? (a.id === 'quick-incident' ? <IconRequest size={Number(iconSize)} />
                      : a.id === 'quick-service' ? <ShoppingCart size={Number(iconSize) - 1} strokeWidth={1.7} />
                      : a.id === 'quick-ad' ? <KeyRound size={Number(iconSize)} strokeWidth={1.7} />
                      : a.id === 'quick-link' ? <Link2 size={Number(iconSize)} strokeWidth={1.7} />
                      : <IconKnowledge size={Number(iconSize)} />)}
                </span>
                </Sel>}
                <span className={`min-w-0 flex-1 ${centre ? 'w-full' : ''}`}>
                  <span style={{ ...roleStyle(styles, `${a.id}-title`, 'title'), ...(centre && !styles[`${a.id}-title`]?.align ? { textAlign: 'center' as const } : {}) }} className="block truncate text-[16px] font-semibold text-[#364658]">{String(c.title ?? a.title)}</span>
                  {String(c.sub ?? a.desc) !== '' && (
                    <Sel id={`${a.id}-sub`}>
                      <span style={{ ...roleStyle(styles, `${a.id}-sub`, 'body'), ...(centre && !styles[`${a.id}-sub`]?.align ? { textAlign: 'center' as const } : {}) }} className="block truncate text-[13px] text-[#7B8FA5]">{String(c.sub ?? a.desc)}</span>
                    </Sel>
                  )}
                </span>
              </div>
            </Sel>
          );
        })}

        {(rowExtras?.['quick'] ?? []).map((el) => (
          <Sel key={el.id} id={el.id} style={share(secCols("quick", content.cols.quick), secGap("quick"), secGrow("quick"))}>
            <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
          </Sel>
        ))}
      </RowDrop>
    </Sel>
  );

  return (
    <div
      className="flex min-h-full flex-col bg-white"
      /* §7.22 — the PAGE layer. The typeface cascades normally; the text scale uses `zoom` because
         this page is built from px sizes, so a root font-size would move nothing. The spec's own
         words are "scales every size together", which is what zoom does. It stops at 90–115%
         because past that the layout breaks — which is why the slider stops there too. */
      style={{
        fontFamily: pageCfg.typeface ? String(pageCfg.typeface) : undefined,
        zoom: pageCfg.fontScale ? Number(pageCfg.fontScale) / 100 : undefined,
        ...styleOf(styles, PAGE_ID),
      }}
      /* Clicking bare canvas clears the selection — an editor with no way out of a selection
         traps you in whatever you touched last. */
      onClick={() => enabled && select(null)}
    >
      <PortalHeader
        content={content}
        cfg={wc("header")}
        actionsCfg={wc("header-actions")}
        onLogoPos={(p) => setCfg?.('header', { logoPos: p })}
        /* The canvas drag commits the same `items` list the panel edits, ORDER-ONLY: the stored
           rows are re-sorted, never rebuilt, so each keeps its name and its sub-line. */
        onActionOrder={(ids) => {
          const cur = (wc("header-actions").items as { id: string }[] | undefined) ?? [];
          if (!cur.length) return;
          setCfg?.('header-actions', { items: ids.map((id) => cur.find((i) => i.id === id)).filter(Boolean) });
        }}
      />

      <div className="flex min-h-0 flex-1">
        <PortalRail
          cfg={wc("rail")}
          onOrder={(names) => {
            const cur = (wc("rail").items as { name: string }[] | undefined) ?? [];
            if (!cur.length) return;
            setCfg?.('rail', { items: names.map((n) => cur.find((i) => i.name === n)).filter(Boolean) });
          }}
        />

        {/* ⚠️ The page takes the SAME resolved background, not a second copy of the setting — one
            upload, two surfaces, and no way for them to drift. `bg-[#F4F6FA]` stays as the class so
            an untouched page is unchanged; the inline style only exists while the toggle is on. */}
        <div
          className="min-w-0 flex-1 bg-[#F4F6FA]"
          style={heroCfg.bgWholePage === true ? { ...heroBg, backgroundAttachment: 'fixed' } : undefined}
        >
          {/* ⚠️ On a blank portal the whole content area is replaced by ONE empty state and its
              seam. Rendering the bands and hiding them individually would leave four invisible
              anchors on the page, each still offering "+ Add Section" on hover — an empty page that
              answers four different places you never put anything. */}
          {blank ? (
            /* ⚠️ `h-full`, not a `min-h-[420px]` guess. The content area already stretches to the
                canvas, so a fixed floor left the empty state sitting in a short band with the page
                colour running on underneath it — the one screen where there is nothing else to look
                at was the one that did not fill the screen. */
            <div className={sections.length ? 'px-6 py-8' : 'flex h-full min-h-[520px] flex-col items-center justify-center px-6 py-16'}>
              {sections.length === 0 && (
              /* ⚠️ NO dashed box. A dotted rectangle in the middle of an empty page reads as a drop
                  ZONE — a specific place the widget has to land — and the page will take a drop
                  anywhere. The invitation is the words; the border was drawing a target that does
                  not exist. */
              <div className="flex w-full max-w-[560px] flex-col items-center text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-white text-[#3D8BD0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-12px_rgba(16,24,40,0.18)]">
                  <LayoutGrid size={28} strokeWidth={1.6} />
                </span>
                <p className="mt-5 text-[17px] font-semibold text-[#364658]">Your portal is empty</p>
                <p className="mt-2 max-w-[420px] text-[13.5px] leading-[1.65] text-[#7B8FA5]">
                  Pick a widget from the panel on the right and drag it onto the page — or add a
                  section first and drop widgets into it.
                </p>
              </div>
              )}
              {/* The one anchor a blank page has. Everything added lands after it, and every added
                  section then carries a seam of its own. */}
              <div className={sections.length ? '' : 'mt-6'}>{after('hero')}</div>
            </div>
          ) : (
          <>
          {/* ⚠️ `contents` when the hero is a top band — the wrapper leaves the layout entirely, so
              every existing page renders the tree it always did. Only the rail archetype turns it
              into a real flex row, and `items-stretch` is what gives the rail the page's height
              rather than its own content's. */}
          <div className={heroSide ? 'flex min-h-full items-stretch' : 'contents'}>
          {/* ── Hero ── */}
          {/* Full bleed ignores the page's side inset (§7.20); the 9-point picker places the
              content block, and the heading colour is the one the contrast guard measures. */}
          <Sel id="hero" toolbarBelow className={`${wc('hero').fullBleed === true ? '-mx-0' : ''} ${heroSide ? 'w-[380px] flex-none self-stretch' : ''}`}>
            {/* ⚠️ The band is a flex COLUMN centred on its cross axis, so the heading and subtext sit
                in the middle of the banner however tall it is made. Fixed `pt-14` pinned them near
                the top and left the growing half of the band empty underneath — a taller banner
                pushed its own content further off centre, which is the opposite of what raising the
                height is for. */}
            <div
              /* ⚠️ A RAIL reads top-down. Centring is right for a band — the copy sits in the middle
                 of the colour however tall it is made — and wrong for a column, where it pushes the
                 greeting to the vertical middle of the page and the action rows off the bottom. */
              className={`relative flex flex-col ${heroSide ? 'justify-start pt-10 pb-10' : `justify-center ${(tileActions || quickOnBanner) && !searchFloats ? 'pb-10' : 'pb-[86px]'}`} ${searchFloats ? 'overflow-visible' : 'overflow-hidden'}`}
              style={{
                /* ⚠️ The tabs decide, in one place. Image wins when one is uploaded; Colour paints
                   flat; and with neither the band keeps its gradient, so a portal nobody has touched
                   still looks designed rather than blank. */
                ...heroBg,
                minHeight: Number(wc('hero').height ?? 260),
                /* ⚠️ FILL THE WRAPPER. A dragged height is written into `styles.hero` and applied by
                   `sizeOf` on the Sel WRAPPER — this inner div is what actually paints the banner,
                   and it was still sizing itself from `minHeight` alone. So stretching the banner
                   grew the outline and the eight handles while the artwork stayed exactly where it
                   was, leaving a band of page showing underneath: the selection said one thing and
                   the picture said another.
                   ⚠️ `100%` resolves to auto while the wrapper has no explicit height, so an
                   untouched banner still sizes from its minHeight and nothing moved. */
                height: '100%',
                ...st('hero'),
              }}
            >
              {/* The decorative line-work belongs to the DEFAULT band. Over a chosen colour it reads
                  as dirt on the colour, and over a photograph as a scratch on the photograph. */}
              {/* ⚠️ Its own clip. The band drops `overflow-hidden` while the search floats, so the
                  decorative line-work would otherwise run past the banner and across the page. */}
              {heroCfg.bgKind !== 'color' && !heroImg && !heroShapes && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden"><HeroArtwork /></span>
              )}
              {/* ⚠️ Its own clip too, for the same reason — and it sits BEHIND the copy, which is
                  why the hero's `contentMaxWidth` is what keeps the two from meeting. */}
              {heroShapes && <span className="pointer-events-none absolute inset-0 overflow-hidden"><HeroShapes /></span>}
              {heroCounterShapes && <HeroCounterShapes />}
              {/* ⚠️ SIDE-BY-SIDE, a wholly separate branch from the stacked layout below — never
                  taken unless a hero explicitly asks for it (`searchPlacement: 'side'`), so no
                  existing template's hero is touched by this existing. Mirrors the reference's own
                  `align-items:flex-end` pairing: the heading block and the search box share a
                  bottom edge rather than the search sitting BELOW the subtitle. */}
              {searchSide ? (
                <div className="relative flex w-full items-end gap-10 px-6 py-6">
                  <div className="min-w-0 flex-1">
                    <Sel id="hero-title" className="block w-full px-1">
                      <h2
                        style={{ ...roleStyle(styles, 'hero', 'title'), color: String(wc('hero').headingColor ?? '#FFFFFF'), ...st('hero-title') }}
                        className="text-[30px] font-semibold leading-tight"
                      >
                        {String(wc('hero').heading ?? content.hero.title)}
                      </h2>
                    </Sel>
                    <Sel id="hero-subtitle" className="mt-2 block w-full px-1">
                      <p style={{ ...roleStyle(styles, 'hero', 'subtitle'), ...(darkHeroInk ? { color: 'rgba(15,51,39,0.72)' } : null), ...st('hero-subtitle') }} className={`text-[15px] ${darkHeroInk ? '' : 'text-white/85'}`}>
                        {String(wc('hero').sub ?? content.hero.subtitle)}
                      </p>
                    </Sel>
                  </div>
                  {wc('hero').showSearch !== false && (
                    <div className="w-full flex-shrink-0" style={{ maxWidth: `${Number(wc('hero').searchWidth ?? 32)}%` }}>
                      <Sel id="hero-search" className="block w-full">
                        <HeroSearch
                          cfg={wc('hero')}
                          fallback={content.hero.placeholder}
                          style={{ borderRadius: Number(wc('hero').searchRadius ?? 4), ...st('hero-search') }}
                        />
                      </Sel>
                    </div>
                  )}
                </div>
              ) : (
              <>
              {/* ⚠️ FULL WIDTH. The block used to be capped at 70% and centred with auto margins,
                  which meant a heading aligned left landed at the left edge of that centred column —
                  15% in from the banner — and no setting could reach the banner's own edges. The cap
                  now limits the LINE (see `heroLine`), not the column, so alignment moves text
                  across the whole band and the 9-point picker still places the group. */}
              <div
                className="relative w-full px-6 py-6"
                style={{ textAlign: heroAlignX(String(wc('hero').contentAlign ?? 'center')) }}
              >
                {/* ⚠️ BLOCK, not inline-block. Both were inline-block, so the subtitle sat on the
                    same line as the heading and the band read as one run-on sentence — "Welcome to
                    Support Portal Search our support center knowledge base". A heading and its
                    subtext are two lines; the wrapper has to say so. */}
                <Sel id="hero-title" className="block w-full px-1" style={heroLine('hero-title')}>
                  <h2
                    /* ⚠️ `headingColor` AFTER `roleStyle`, never before it. `roleStyle` returns an
                       explicit `color: undefined` whenever the colour is still the theme's — and a
                       spread `undefined` DELETES the key it lands on, so the banner's own heading
                       colour was being thrown away and the text fell back to the page's near-black.
                       On an indigo band that measured 1.72:1, against the 4.5 this product's own
                       contrast meter demands. Same trap `fillCss` carries a warning about. */
                    style={{ ...roleStyle(styles, 'hero', 'title'), color: String(wc('hero').headingColor ?? '#FFFFFF'), ...st('hero-title') }}
                    className="text-[30px] font-semibold leading-tight"
                  >
                    {String(wc('hero').heading ?? content.hero.title)}
                  </h2>
                </Sel>
                <Sel id="hero-subtitle" className="mt-2 block w-full px-1" style={heroLine('hero-subtitle')}>
                  {/* ⚠️ The heading has `headingColor`; the line under it had a hard-coded
                      white/85 and no control at all — so a light banner printed a legible title
                      over an invisible subtitle. It follows the same ink decision. */}
                  <p style={{ ...roleStyle(styles, 'hero', 'subtitle'), ...(darkHeroInk ? { color: 'rgba(15,51,39,0.72)' } : null), ...st('hero-subtitle') }} className={`text-[15px] ${darkHeroInk ? '' : 'text-white/85'}`}>
                    {String(wc('hero').sub ?? content.hero.subtitle)}
                  </p>
                </Sel>
                {/* ⚠️ Rendered here ONLY while it belongs to the banner. When it floats it is the
                    same `Sel`, the same id and the same config — moved, not duplicated, because two
                    search bars in the tree would be two things to keep in step and one of them
                    would eventually be edited while the other showed. */}
                {wc('hero').showSearch !== false && !searchFloats && (
                  <Sel
                    id="hero-search"
                    className="mt-5 w-full"
                    /* ⚠️ The field follows the BAND's alignment. It was hard-centred, so a hero set
                       to left-align printed its heading and subtitle on the left and then dropped
                       the search in the middle — one band with two alignments, and the control was
                       the odd one out. `heroLine` already answers this question for the two lines
                       above it; this is the same answer applied to the third. */
                    style={{ maxWidth: `${Number(wc('hero').searchWidth ?? 70)}%`, ...(() => {
                      const a = String(styles['hero-search']?.align ?? heroAlignX(String(wc('hero').contentAlign ?? 'center')));
                      return { marginLeft: a === 'left' ? 0 : 'auto', marginRight: a === 'right' ? 0 : 'auto' };
                    })() }}
                  >
                    <HeroSearch
                      cfg={wc('hero')}
                      fallback={content.hero.placeholder}
                      style={{ borderRadius: Number(wc('hero').searchRadius ?? 4), ...st('hero-search') }}
                    />
                  </Sel>
                )}
              </div>
              {/* ⚠️ INSIDE the band and pinned to its bottom edge with a negative margin, so half
                  the field sits on the colour and half on the page. Placed after the text block and
                  outside its padded column, because it is no longer part of the sentence above it —
                  it is the page's own control, resting on the banner. */}
              {/* ⚠️ ABSOLUTE against the band's bottom edge and pulled down by half its own height,
                  rather than a negative margin in the flow. In the flow it sat above the band's
                  86px of reserved bottom padding — measured 96px clear of the edge, which is not
                  straddling anything, it is just a search bar low in a banner. Anchoring it to the
                  edge makes the effect independent of whatever padding the band is carrying.
                  ⚠️ Needs `overflow-visible` on the band above, or the half hanging out is clipped
                  off and the whole idea silently becomes an inset field again. */}
              {wc('hero').showSearch !== false && searchFloats && (
                <div className="absolute inset-x-0 bottom-0 z-20 w-full translate-y-1/2 px-6">
                  <Sel
                    id="hero-search"
                    className="block w-full"
                    /* ⚠️ The field follows the BAND's alignment. It was hard-centred, so a hero set
                       to left-align printed its heading and subtitle on the left and then dropped
                       the search in the middle — one band with two alignments, and the control was
                       the odd one out. `heroLine` already answers this question for the two lines
                       above it; this is the same answer applied to the third. */
                    style={{ maxWidth: `${Number(wc('hero').searchWidth ?? 70)}%`, ...(() => {
                      const a = String(styles['hero-search']?.align ?? heroAlignX(String(wc('hero').contentAlign ?? 'center')));
                      return { marginLeft: a === 'left' ? 0 : 'auto', marginRight: a === 'right' ? 0 : 'auto' };
                    })() }}
                  >
                    <HeroSearch
                      cfg={wc('hero')}
                      fallback={content.hero.placeholder}
                      style={{
                        borderRadius: Number(wc('hero').searchRadius ?? 4),
                        /* The shadow is what makes it read as lifted off the banner rather than cut
                           into it. Tight and low-opacity — a heavy one would look like a modal. */
                        boxShadow: '0 12px 28px -8px rgba(11,27,63,0.35), 0 2px 6px rgba(11,27,63,0.12)',
                        ...st('hero-search'),
                      }}
                    />
                  </Sel>
                </div>
              )}
              </>
              )}
              {/* ⚠️ INSIDE the hero's own colored div, not below it — this is what makes Counter's
                  tiles genuinely PART of the banner rather than a separate section merely painted to
                  match it. See the note beside where `quickSection` is built, right before this
                  component's `return`. */}
              {quickOnBanner && quickSection}
              {/* ⚠️ `mt-auto` pins it to the FOOT of the rail — a last resort belongs at the end of
                  the column, not in the middle of it. `bare` because the rail is already a dark
                  surface: a card would paint a second one inside it. `portal-help-dark` is the
                  same class the dark Contact card uses, so the recolour rules are shared. */}
              {contactInHero && (
                <div className="portal-help-dark mt-auto w-full border-t border-white/15 px-7 pt-5">
                  {card('contact', <ContactRender nodeId="contact" cfg={{ title: 'Contact Us', ...wc('contact') }} />, 1, 16, 1, undefined, { bare: true })}
                </div>
              )}
            </div>
          </Sel>

          {/* No horizontal padding here: a SECTION runs from the page's left edge to its right
              edge, so each one carries its own inset instead of sitting inside a padded column. */}
          <div className={`flex flex-col pb-8 ${heroSide ? 'min-w-0 flex-1' : ''}`}>
            {/* ⚠️ NO seam under the hero. The action cards ride up into the banner by 62px, so a
                section inserted between them would land inside an overlap and split a join that is
                deliberately one unit — visually the banner and its cards are a single band, and the
                CTA offered to break it in the one place it cannot be broken. Every other join keeps
                its seam. */}

            {/* ── Quick actions ──
                ⚠️ Rendered here ONLY while `quickOnBanner` is false — Counter mounts the SAME
                `quickSection` element inside the hero band's own div instead (see the note where it
                is built, right before this component's `return`). Never both: a card in two places
                in the tree is two things to keep in step, which is exactly what building it once and
                choosing its home was meant to prevent. */}
            {/* ⚠️ The hero overlap is the ONE margin that survives: it is a relationship with the
                banner above it, not spacing of its own, and it only applies while the row is first. */}
            {/* ⚠️ The 62px climb is dropped when the search floats. Two things cannot occupy the
                banner's bottom edge — the cards would land on top of the field, and the one control
                the template is built around would be the thing that got covered. */}
            {/* ⚠️ `tileActions` also drops the 62px climb. Two objects cannot straddle one edge,
                and a template that keeps its banner intact wants the cards clear of it — the hero
                then has one job and every breakpoint has one less thing to solve. */}
            {!quickOnBanner && quickSection}

            {after('quick')}

            {/* ── The two service rows ──
                ⚠️ Each is ONE card, not a row of cards: the grid inside is the widget's own, so the
                section wrapper only has to place it and paint its surface. That is also why they
                take `card()` rather than `RowDrop` — nothing else can be dropped beside them, the
                same rule Quick Actions follows. */}
            {band('favourites', (
              browseSplit ? (
                /* ⚠️ BOTH sections, drawn here. Each keeps its own `Sel`, so Favourite Services and
                   Most Used Services are still two separate selectable blocks with their own
                   panels — only the row they sit in is shared. */
                <div
                  className={`flex flex-wrap items-stretch ${SECTION_PAD}`}
                  style={{ order: slot("favourites"), gap: secGap('favourites') }}
                >
                  <Sel id="favourites" className="min-w-[300px] flex-1" style={fillCss(wc('favourites'))}>
                    <FavouriteServicesRender nodeId="favourites" cfg={servicesChips ? { tileLook: 'chips', ...wc('favourites') } : wc('favourites')} />
                  </Sel>
                  {blockOrder.includes('services') && !removed.includes('services') && (
                    <Sel id="services" className="min-w-[300px] flex-1" style={fillCss(wc('services'))}>
                      <FeaturedServicesRender nodeId="services" cfg={servicesChips ? { tileLook: 'chips', ...wc('services') } : wc('services')} />
                    </Sel>
                  )}
                </div>
              ) : (
              <Sel id="favourites" className={SECTION_PAD} style={{ order: slot("favourites"), ...fillCss(wc('favourites')) }}>
                <FavouriteServicesRender nodeId="favourites" cfg={servicesChips ? { tileLook: 'chips', ...wc('favourites') } : wc('favourites')} />
              </Sel>
              )
            ))}
            {band('favourites', after('favourites'))}

            {/* ⚠️ Renders NOTHING while the browse row is split — the favourites band above draws
                both. Returning null here rather than dropping the band from `blockOrder` keeps
                Most Used Services a real member of the page, so deleting it, reordering it and its
                widget panel all behave exactly as they do on every other layout. */}
            {!browseSplit && band('services', (
              <Sel id="services" className={SECTION_PAD} style={{ order: slot("services"), ...fillCss(wc('services')) }}>
                {(() => {
                  const list = <FeaturedServicesRender nodeId="services" cfg={servicesChips ? { tileLook: 'chips', ...wc('services') } : wc('services')} />;
                  /* A tinted panel HOLDING white tiles, rather than tiles loose on the page ground
                     — which is what lets the row read as one section instead of four cards that
                     happen to be adjacent. */
                  const panel = servicesPanel
                    ? <div className="flex h-full flex-col rounded-xl border border-[#E4EAF0] bg-[#EFF4F8] p-5">{list}</div>
                    : list;
                  if (!railInServices) return panel;
                  /* ⚠️ 1.85 : 1, the same share the work band gives its main region — so the rail is
                     the same width wherever it lands and the page has one rail measure, not two. */
                  return (
                    <div className="flex flex-wrap items-stretch" style={{ gap: secGap('services') }}>
                      <div className="min-w-[320px] flex-[1.85_1_0%]">{panel}</div>
                      <div className="flex min-w-[240px] flex-1 flex-col" style={{ gap: secGap('services') }}>
                        {(rail ?? []).map((id) => <Fragment key={id}>{railCard(id)}</Fragment>)}
                      </div>
                    </div>
                  );
                })()}
              </Sel>
            ))}
            {!browseSplit && band('services', after('services'))}

            {/* ── Work row ── */}
            {/* ── Work row ── one section, three cards, full width. */}
            <Sel id="work" className={SECTION_PAD} style={{ order: slot("work"), ...fillCss(wc('work')) }}>
              <RowDrop rowId="work" resize={secResize("work")} className={`flex flex-wrap${secPacked("work", 3) ? " portal-row-packed" : ""}`} style={{ gap: secGap("work"), ...secBox("work", 3), ...rowFits(inRow("work"), "work"), ...secGrid("work", 3) }}>
              {(() => {
              /* ⚠️ Every work-band card is built as a CONST and PLACED afterwards, because the rail
                 layout puts them in two regions and the flat one puts them in a row — same cards,
                 two arrangements. Authoring each twice is two places for a fix to land in one. */
              const requestsCard = card('requests', (
                <CardShell nodeId="requests" titleNodeId="requests-title" title={String(wc('requests').title ?? content.requests.title)} count={visibleRequests.length} cfg={wc('requests')} hideHead={workTabs}>
                  <ListBody nodeId="requests">
                      {visibleRequests.map((r) => {
                        const c = wc('requests');
                        const tone = statusTone(r.status, darkMode);
                        /* ⚠️ Statuses is a DISPLAY toggle, not a row filter: unticking one hides
                           that badge from the rows carrying it, and the request stays listed.
                           Filtering rows out would put "Rows to show" and the status list in a
                           fight over how many rows appear. */
                        const statusOn = c.showStatus !== false
                          && ((c.statuses as string[]) ?? content.requests.statuses).includes(r.status);
                        const neutral = c.statusTone === 'neutral';
                        const below = c.idPlacement === 'below';
                        const stacked = c.rowLayout === 'stacked';
                        return (
                          <Row key={r.id} nodeId="requests">
                            <div className={stacked ? '' : 'flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1'}>
                              {c.showId !== false && !below && <IdPill>{r.id}</IdPill>}
                              <span style={roleStyle(styles, 'requests', 'body')} className={`min-w-0 ${stacked ? 'block' : 'flex-1 truncate'} text-[13px] text-[#364658]`}>{r.subject}</span>
                              {statusOn && (
                                <span
                                  className={`${stacked ? 'mt-1 inline-block' : 'flex-shrink-0'} whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium`}
                                  style={neutral ? { color: '#64748B', background: '#F1F5F9' } : { color: tone.fg, background: tone.bg }}
                                >{r.status}</span>
                              )}
                            </div>
                            {(c.showId !== false && below) && <div className="mt-1"><IdPill>{r.id}</IdPill></div>}
                            {c.showDate !== false && <div style={roleStyle(styles, 'requests', 'meta')} className="mt-1 text-[12px] text-[#7B8FA5]">{r.at}</div>}
                          </Row>
                        );
                      })}
                  </ListBody>
                </CardShell>
              ), rail ? 2 : secCols("work", content.cols.work), secGap("work"), secGrow("work"));
              const approvalsCard = card('approvals', (
                <CardShell nodeId="approvals" titleNodeId="approvals-title" title={String(wc('approvals').title ?? content.approvals.title)} count={visibleApprovals.length} cfg={wc('approvals')} hideHead={workTabs}>
                  <ListBody nodeId="approvals">
                    {visibleApprovals.map((a) => (
                      <Row key={a.id} nodeId="approvals">
                        <div className="flex flex-wrap items-center gap-2">
                          {wc('approvals').showId !== false && <IdPill>{a.id}: {a.subject}</IdPill>}
                          <span className="min-w-0 text-[12px] text-[#64748B]">{a.reason}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            {wc('approvals').showDate !== false && <div style={roleStyle(styles, 'approvals', 'meta')} className="text-[12px] text-[#7B8FA5]">{a.at}</div>}
                            {wc('approvals').showRequester !== false && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: a.color }}>{a.initials}</span>
                                <span style={roleStyle(styles, 'approvals', 'body')} className="truncate text-[13px] text-[#364658]">{a.by}</span>
                              </div>
                            )}
                          </div>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#ECFDF3] text-[#22A06B]"><Check size={15} /></span>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#FEF3F2] text-[#DC2626]"><X size={15} /></span>
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#FEF3C7] text-[#B45309]"><RotateCcw size={14} /></span>
                        </div>
                      </Row>
                    ))}
                  </ListBody>
                </CardShell>
              ), rail ? 2 : secCols("work", content.cols.work), secGap("work"), secGrow("work"));
              const knowledgeCard = card('knowledge', (
                <CardShell nodeId="knowledge" titleNodeId="knowledge-title" title={String(wc('knowledge').title ?? content.knowledge.title)} count={visibleArticles.length} cfg={wc('knowledge')} hideHead={workTabs}>
                  <ListBody nodeId="knowledge">
                    {visibleArticles.map((k) => {
                      const c = wc('knowledge');
                      const below = c.idPlacement === 'below';
                      return (
                        /* ⚠️ The row answers to the WIDGET's width, not the window's — `@container`,
                            the same mechanism the software card grid uses. Dragging this card narrow
                            used to squeeze the icon and truncate the title to two characters while
                            the date and the tag sat on one long line, because every breakpoint here
                            was either absent or keyed to a viewport that had not changed.
                            Below ~230px the icon goes (it repeats for every row and carries no
                            information the title does not) and the meta line stacks; above it, the
                            row is exactly what it was. */
                        <Row key={k.id} nodeId="knowledge">
                          <div className="@container min-w-0">
                            <div className="flex min-w-0 gap-2 @[230px]:gap-3">
                              <span className="hidden size-9 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] @[230px]:flex"><IconKnowledge size={18} /></span>
                              <span className="min-w-0 flex-1">
                                {/* ⚠️ NOT flex-wrap. A wrapping row lets an item move to a new line instead of
                                    shrinking, so the title kept its natural width and pushed the card into
                                    horizontal overflow — the exact opposite of responsive. No wrap plus
                                    min-w-0 is what makes truncation the pressure valve. */}
                                <span className={c.rowLayout === 'single' ? 'flex min-w-0 items-center gap-2' : 'block'}>
                                  {c.showId !== false && !below && <IdPill>{k.id}</IdPill>}
                                  {/* ⚠️ `w-0` with `flex-1`, not `min-w-0` alone. A flex item's basis is its CONTENT by
                                      default, so it refuses to go below its natural width and pushes the card
                                      into overflow instead of truncating. Zeroing the basis is what makes the
                                      ellipsis the thing that gives way. */}
                                  <span style={roleStyle(styles, 'knowledge', 'body')} className="w-0 min-w-0 flex-1 truncate text-[13px] text-[#364658]">{k.title}</span>
                                </span>
                                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                  {c.showId !== false && below && <IdPill>{k.id}</IdPill>}
                                  {c.showDate !== false && <span style={roleStyle(styles, 'knowledge', 'meta')} className="truncate text-[12px] text-[#7B8FA5]">{k.at}</span>}
                                  {c.showCategory !== false && <span className="max-w-full truncate rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#64748B]">{k.tag}</span>}
                                </span>
                              </span>
                            </div>
                          </div>
                        </Row>
                      );
                    })}
                  </ListBody>
                </CardShell>
              ), workRail ? 1 : secCols("work", content.cols.work), secGap("work"), secGrow("work"), undefined, workTabs ? { bare: true } : undefined);
              /* ⚠️ ONE container, three tabs — and each panel MOUNTS THE REAL CARD. The strip
                 decides which of the three is in the tree; it does not redraw any of them. So each
                 keeps its node id, its selection, its widget drawer and its removal, and "tabs" is
                 a LOOK rather than the second renderer the seed note forbids.
                 ⚠️ The tab list is filtered by the LIVE row order, so deleting Most Read removes
                 its tab too — a strip offering a tab that opens nothing is worse than no tab. */
              if (workTabs) {
                const order = rowOrder['work'] ?? [];
                const tabs = [
                  { id: 'requests', label: String(wc('requests').title ?? content.requests.title), n: visibleRequests.length, node: requestsCard },
                  { id: 'approvals', label: String(wc('approvals').title ?? content.approvals.title), n: visibleApprovals.length, node: approvalsCard },
                  { id: 'knowledge', label: String(wc('knowledge').title ?? content.knowledge.title), n: visibleArticles.length, node: knowledgeCard },
                ].filter((t) => order.includes(t.id) && t.node);
                if (!tabs.length) return null;
                const active = tabs.find((t) => t.id === workTab) ?? tabs[0];
                return (
                  <div className="w-full min-w-0 rounded-xl border border-[#E5E7EB] bg-white">
                    <div className="flex gap-1 overflow-x-auto border-b border-[#E5E7EB] px-2" role="tablist">
                      {tabs.map((t) => {
                        const on = t.id === active.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            /* ⚠️ stopPropagation, or clicking a tab selects the band behind it and
                               the panel you were reading swaps for a Layout editor. */
                            onClick={(e) => { e.stopPropagation(); setWorkTab(t.id); }}
                            className={`-mb-px inline-flex flex-none items-center gap-2 border-b-2 px-3.5 py-3 text-[14px] font-semibold transition-colors ${on ? 'border-[#1E7A5A] text-[#166049]' : 'border-transparent text-[#7B8FA5] hover:text-[#364658]'}`}
                          >
                            {t.label}
                            {/* ⚠️ The count rides IN the label. A tabbed container that hides its
                                counts hides the reason to open the other two tabs. */}
                            <span className={`rounded-full px-1.5 py-px text-[11px] font-semibold ${on ? 'bg-[#DFEEE6] text-[#166049]' : 'bg-[#F1F5F9] text-[#7B8FA5]'}`}>{t.n}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-1 pb-2">{active.node}</div>
                  </div>
                );
              }
              /* One resolver, because the work band's members come from two builders — three cards
                 built as consts above, and Announcements/Contact through `railCard`. Without it
                 every arrangement below would need to know which is which. */
              const workCard = (id: string) =>
                id === 'requests' ? requestsCard
                  : id === 'approvals' ? approvalsCard
                    : id === 'knowledge' ? knowledgeCard
                      : railCard(id);
              /* ⚠️ TWO ROWS, and the split is the `rail` array — membership, exactly as it means
                 everywhere else. The first row is everything else at the band's own column count;
                 the second gives its first member two shares to the rest's one, which is the same
                 1.85:1-ish measure the side rail uses, turned on its side. */
              if (railBelow) {
                const order = rowOrder['work'] ?? [];
                const inRail = new Set(rail ?? []);
                /* ⚠️ Excluded from BOTH rows when the hero has it — a card rendered twice is the
                   fault every placement key in this file guards against. */
                const skip = (id: string) => contactInHero && id === 'contact';
                const main = order.filter((id) => !inRail.has(id) && !skip(id));
                const below = (rail ?? []).filter((id) => order.includes(id) && !skip(id));
                return (
                  <div className="flex w-full min-w-0 flex-col" style={{ gap: secGap('work'), gridColumn: '1 / -1' }}>
                    <div
                      className="grid min-w-0"
                      style={{ gap: secGap('work'), gridTemplateColumns: `repeat(${secCols('work', 3)}, minmax(0, 1fr))` }}
                    >
                      {main.map((id) => <Fragment key={id}>{workCard(id)}</Fragment>)}
                    </div>
                    {below.length > 0 && (
                      <div className="flex min-w-0 flex-wrap items-stretch" style={{ gap: secGap('work') }}>
                        {below.map((id, i) => (
                          <div key={id} className="flex min-w-[260px] flex-col" style={{ flex: i === 0 ? '2 1 0%' : '1 1 0%' }}>
                            {workCard(id)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (!workRail) return <>{requestsCard}{approvalsCard}{knowledgeCard}</>;
              /* ⚠️ TWO REGIONS, not five cards in one wrapping row. The page reads as a MAIN area of
                 work cards beside a tall rail, and a flat row cannot say that: the rail is long
                 because three cards are stacked in it, so anything sharing its line stretched to its
                 height — and the two emptiest cards on the page came out the tallest.
                 The main region takes TWO shares to the rail's one, which is what makes its cards
                 half its own width and the rail a third of the section.
                 ⚠️ `items-start` + `content-start` are what let a card fit its CONTENT. A flex row
                 stretches its children by default, and that is exactly where the acres of empty
                 space under My Assets came from.
                 ⚠️ Each member still goes through `card()`, so removal, ordering and selection work
                 on a card in either region exactly as they do on one standing alone. */
              return (
                <>
                {/* ⚠️ A GRID, not a wrapping flex row, and this is what makes all four cards the
                    same height. `items-start` let each card fit its own content — which fixed the
                    stretched-to-the-rail problem but left four different heights, so the block read
                    as four cards that happened to be near each other rather than one panel.
                    Flex can only equalise WITHIN a line: `items-stretch` would give line 1 the
                    height of the taller of Requests/Approvals and line 2 its own, still two
                    different heights. `grid-auto-rows: 1fr` makes both rows equal and stretches
                    every cell into them, which is the only way to say "these four match".
                    ⚠️ The flex basis `card()` writes is inert on a grid item, which is fine — the
                    two tracks own the width now. CSS `order` still applies, so the explicit
                    `orderAt` sequence still holds. */}
                {/* ⚠️ A SECTION of its own, so it carries its own Layout panel. Its column count
                    comes from its OWN config rather than a hard-coded pair of tracks — otherwise
                    the Layout presets on this region would move a control and change nothing. */}
                <Sel
                  id="work-main"
                  className="grid min-w-0"
                  style={{
                    flex: '2 1 0%',
                    gap: secGap("work-main"),
                    gridTemplateColumns: `repeat(${secCols("work-main", 2)}, minmax(0, 1fr))`,
                    /* ⚠️ `auto`, not `1fr`. Equal rows made every row as tall as the TALLEST one on
                       the grid — fine while all four cards were half-width lists of similar length,
                       and wrong the moment My Assets and My CIs became full-width rows of their own:
                       each inherited the height of the request list two rows up and carried about
                       200px of empty space under its tiles.
                       ⚠️ The two cards that DO share a row are still the same height — a grid
                       stretches items within a row by default, which is the behaviour that was
                       actually wanted here; `1fr` was reaching across rows to get it. */
                    gridAutoRows: 'auto',
                  }}
                >
                  {requestsCard}
                  {/* ⚠️ Counter moves Approvals into the side rail instead — see `rail.includes` below.
                     Both regions read the SAME `rail` array so a card can never render twice. */}
                  {!rail.includes('approvals') && approvalsCard}
                  {/* ⚠️ FULL WIDTH and stacked, not side by side. Two half-width tile cards put four
                      tiles into 354px, which is where the "resizing one shrinks the other" complaint
                      came from — they were competing for one row. Given the whole width each, the
                      tiles inside get room to spread and the two cards stop fighting.
                      ⚠️ Counter moves Assets into the side rail (as a compact list, not this tile
                      grid) — skipped here for the same reason Approvals is. */}
                  {!rail.includes('assets') && card('assets', <RecordTiles nodeId="assets" titleFallback={content.assets.title} cfg={wc('assets')} rows={MY_ASSETS} icon={<HardDrive size={17} />} />, undefined, secGap("work"), 1, 2, { full: true })}
                  {card('cis', <RecordTiles nodeId="cis" titleFallback={content.cis.title} cfg={wc('cis')} rows={MY_CIS} icon={<Server size={17} />} />, undefined, secGap("work"), 1, 3, { full: true })}
                </Sel>
                {/* ⚠️ A SECTION too, and for the same reason: the rail owns how its three cards
                    stack, and that is a different question from how the four beside it are laid
                    out. One Layout panel could not answer both. */}
                <Sel
                  id="work-rail"
                  className="flex min-w-0 flex-col"
                  style={{ flex: '1 1 0%', gap: secGap("work-rail") }}
                >
                  {rail.map((id) => (
                    id === 'knowledge' ? <Fragment key={id}>{knowledgeCard}</Fragment>
                      /* ⚠️ Counter's two rail members. Approvals reuses the pre-built const, exactly
                         like Knowledge above; Assets has no such const to reuse (it is normally a
                         `records`-row tile grid, not a rail card) so it goes through `railCard`,
                         which renders it as the compact list instead.
                         ⚠️ Both are wrapped in a DIV carrying an explicit `order`, not just a
                         `Fragment` — `card()` sets each card's CSS order from ITS OWN row list
                         (`approvals` from `work`, `assets` from `records`), and comparing those
                         indices as one shared order was what stacked Assets above Approvals however
                         `rail` was written, the same "an order is only meaningful within ONE list"
                         trap the work-main region's own comment already names. Overriding it here
                         with the position in the RAIL array itself is what makes `rail: [id, id]`
                         the actual top-to-bottom order, for whichever ids end up in it. */
                      : id === 'approvals' ? <div key={id} style={{ order: rail.indexOf(id) }}>{approvalsCard}</div>
                      : id === 'assets' ? <div key={id} style={{ order: rail.indexOf(id) }}>{railCard('assets')}</div>
                      /* ⚠️ A title is SPREAD IN FIRST, so a title the admin sets still wins. These
                         two have no widget spec behind the node — they were only ever placeable
                         elements — so without a seeded title they render an untitled card, and the
                         rail reads as two anonymous boxes under Announcements' first line. */
                      /* ⚠️ Wrapped in the card's own PADDING. Most Read goes through `CardShell`,
                         which brings `p-4` with it; these two are element renderers dropped straight
                         into `cardInner`, which paints a border and a background and no inset at
                         all — so their titles sat 1px from the card edge beside Most Read's 17px,
                         and three cards stacked in one rail had two different insets. Measured
                         before and after, which is the only way that kind of difference gets
                         noticed at all. */
                      /* ⚠️ Built by `railCard`, and SKIPPED entirely once the rail has moved beside
                         the services panel — without which the page would carry Announcements and
                         Contact twice, once in each home. */
                      : (id === 'news' || id === 'contact')
                        ? (railInServices ? null : <Fragment key={id}>{railCard(id)}</Fragment>)
                          : null
                  ))}
                </Sel>
                </>
              );
              })()}

                {(rowExtras?.['work'] ?? []).map((el) => (
                  <Sel key={el.id} id={el.id} style={share(secCols("work", content.cols.work), secGap("work"), secGrow("work"))}>
                    <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
                  </Sel>
                ))}
              </RowDrop>
            </Sel>

            {after('work')}

            {/* ── Records row ── Assets and CIs, in a parent section like every other card.
                ⚠️ v1 ONLY. The rail layout draws these two inside the work band's main region, so
                `records` is absent from its `blockOrder` and `band()` drops the whole thing —
                without which the page would carry each card twice, once in each place. */}
            {band('records', (
            <Sel id="records" className={SECTION_PAD} style={{ order: slot("records"), ...fillCss(wc('records')) }}>
              <RowDrop rowId="records" resize={secResize("records")} className={`flex flex-wrap${secPacked("records", 2) ? " portal-row-packed" : ""}`} style={{ gap: secGap("records"), ...secBox("records", 2), ...rowFits(inRow("records"), "records"), ...secGrid("records", 2) }}>
                {/* ⚠️ TILES on the rail layout, list rows otherwise — one `rows` shape, two
                    presentations, chosen by the page rather than by either widget. */}
                {card('assets', rail
                  ? <RecordTiles nodeId="assets" titleFallback={content.assets.title} cfg={wc('assets')} rows={MY_ASSETS} icon={<HardDrive size={17} />} />
                  : <RecordsCard nodeId="assets" titleFallback={content.assets.title} cfg={wc('assets')} rows={MY_ASSETS} />,
                  secCols("records", content.cols.records), secGap("records"), secGrow("records"))}
                {/* ⚠️ My CIs stays EMPTY on the original layout, on purpose (§7.4): it is empty on
                    most real instances, so its empty state is the state most requesters will see.
                    The v2 page is a copy of an instance that HAS them, where an empty card would
                    misrepresent that one instead — so the rows follow the layout, not the widget. */}
                {card('cis', rail
                  ? <RecordTiles nodeId="cis" titleFallback={content.cis.title} cfg={wc('cis')} rows={MY_CIS} icon={<Server size={17} />} />
                  : <EmptyCard nodeId="cis" title={String(wc('cis').title ?? content.cis.title)} cfg={wc('cis')} />,
                  secCols("records", content.cols.records), secGap("records"), secGrow("records"))}

                {(rowExtras?.['records'] ?? []).map((el) => (
                  <Sel key={el.id} id={el.id} style={share(secCols("records", content.cols.records), secGap("records"), secGrow("records"))}>
                    <PortalPlacedElement item={el} icon={icons?.[el.id]} text={placedText?.[el.id]} cfg={wc(el.id)} />
                  </Sel>
                ))}
              </RowDrop>
            </Sel>
            ))}
            {band('records', after('records'))}
          </div>
          </div>
          </>
          )}
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end pr-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#1E3A5F] text-white shadow-lg">
          <MessageSquare size={22} />
        </span>
      </div>
    </div>
  );
}

/* The requester's own kit. ⚠️ Two assets, not twenty — this is what one person has been issued, so
   a long scrolling list would misrepresent the widget. */
const MY_ASSETS = [
  { id: 'AST-3', name: 'Dell Latitude 5440', type: 'Laptop' },
  { id: 'AST-1', name: 'Dell UltraSharp U2723QE', type: 'Monitor' },
  { id: 'AST-7', name: 'Logitech MX Master 3S', type: 'Mouse' },
  { id: 'AST-12', name: 'Jabra Evolve2 65', type: 'Headset' },
  { id: 'AST-9', name: 'iPhone 14', type: 'Mobile' },
];

/* ⚠️ My CIs has REAL rows now, for the v2 page only. It was deliberately empty — an instance where
   nobody has been given a CI is the state most requesters see, and inventing rows made the widget
   look like something it usually is not. That reasoning still holds for v1, which is why the empty
   card is still what that layout renders; the v2 page is a copy of a live instance that does have
   them, and showing it empty would misrepresent that one instead. */
const MY_CIS = [
  { id: 'CI-8', name: 'hostname', type: 'Base CI' },
  { id: 'CI-7', name: 'P1', type: 'Base CI' },
  { id: 'CI-5', name: 'localhost.localdomain', type: 'Linux Desktop' },
  /* ⚠️ A FOURTH, so the card fills the same 2×2 My Assets does. Three tiles left the bottom-right
     cell empty beside a card that had none, and two cards of the same kind side by side reading as
     two different shapes is the thing this whole layout pass keeps closing. */
  { id: 'CI-3', name: 'app-prod-01', type: 'Server' },
];

/* A records TILE: the icon block, the blue ID pill and the type beside it, the name underneath.
 *
 * ⚠️ A tile, not a list row — the same records, laid out the way the live portal lays them out. It
 * takes the SAME `rows` shape `RecordsCard` takes, so the two are two presentations of one thing
 * and a page can choose between them without the data knowing which was chosen. */
function RecordTiles({ nodeId, titleFallback, cfg, rows, icon }: {
  nodeId: string; titleFallback: string; cfg: Record<string, unknown>;
  rows: { id: string; name: string; type: string }[];
  icon: ReactNode;
}) {
  const { styles } = useCanvas();
  /* ⚠️ FOUR tiles, and the badge counts them ALL. Five wrapped to a second line that was almost
     entirely empty — one tile beside three tile-widths of nothing — and a card whose whole job is a
     glance does not earn a second row for its fifth item. The badge already says how many there
     are, which is the same contract every other live card on this page keeps: show a few, count all
     of them, and "View all" is the way to the rest. */
  /* ⚠️ A HARD four, not a fallback. The widget spec carries a stored "show" default — 5 for My
     Assets — and a stored value beats a fallback every time, so the fifth tile went on wrapping to
     a second line that was three tile-widths of nothing. The LIST variant on the other layout still
     honours the setting; the tile variant is a 2x2 block by shape, which is a different promise. */
  const shown = rows.slice(0, 4);
  /* ⚠️ The track count is READABLE now. It was `grid-cols-1 @[290px]:grid-cols-2` and nothing else,
     so the Columns control wrote a value this widget never looked at — the same defect `ServiceTiles`
     had. An explicit value wins; with none set the responsive pair below is still the default, so no
     existing page moves. ONE column turns the 2x2 block into a list of records, which is the shape a
     full-width records row wants — the note above about two being the ceiling is about how narrow a
     tile may get, and one column only ever makes them wider.
     ⚠️ `chosen` first, cfg second — §7.8 puts columns in the STYLE store because the Content tab and
     the Arrangement pack both write there. */
  const tileCols = Number(chosen(styles, nodeId, 'columns') ?? cfg.columns) || 0;
  if (!shown.length) return <EmptyCard nodeId={nodeId} title={String(cfg.title ?? titleFallback)} cfg={cfg} />;
  return (
    <CardShell nodeId={nodeId} title={String(cfg.title ?? titleFallback)} count={rows.length} cfg={cfg}>
      {/* ⚠️ `@container`, not a viewport breakpoint — the tiles answer to the CARD's width, which is
          what lets this row be dragged narrow or dropped into a column and still lay out sensibly.
          Every other grid in this builder that had to survive a resize does the same. */}
      <div className="@container">
        {/* ⚠️ TWO is the ceiling, at every width. A four-track grid was tried once the card went
            full width — the arithmetic said ~170px a tile, which is what the two-up tiles used to
            measure — but a tile is not just its box: at that width "Dell UltraSharp U2723QE" and
            "localhost.localdomain" both truncate to a few characters, and a tile whose NAME is
            unreadable has lost the one thing it leads with. Wider tiles and two rows beat four
            columns of ellipsis.
            ⚠️ `@container`, not a viewport breakpoint — the tiles answer to the CARD's width, which
            is what lets this card be dragged narrow or dropped into a column and still lay out. */}
        <div
          className={tileCols ? 'grid gap-2.5' : 'grid grid-cols-1 gap-2.5 @[290px]:grid-cols-2'}
          style={tileCols ? { gridTemplateColumns: `repeat(${tileCols}, minmax(0, 1fr))` } : undefined}
        >
          {shown.map((r) => (
            /* ⚠️ FILLED, not outlined. The card is white like every other card on the page, so the
               tiles are what has to separate itself — and a fill does that without adding a second
               line inside a box that already has one around it. Four hairline rectangles inside a
               hairline rectangle is the "box inside a box" that made the tinted-card version look
               wrong from the other direction.
               ⚠️ The icon badge is WHITE on the filled tile. It was the tint when the tile was white;
               swapping the two keeps the badge a step away from whatever it sits on, which is the
               only thing that makes it read as a badge rather than as part of the background. */
            /* ⚠️ NO hover. A hover state is a promise that something happens on click, and these
               tiles do nothing — the card's "View all" is what opens the list. A row that lights up
               under the pointer and then ignores the press is worse than one that never moved.
               ⚠️ `items-start`, so the badge sits against the NAME rather than floating between the
               two text lines. Centred, it lined up with the gap between the name and the meta line —
               so the one element that should anchor the top-left corner of the tile was the only
               thing not aligned to anything. */
            <div key={r.id} className="flex min-w-0 items-start gap-2.5 rounded-lg bg-[#F9FAFB] p-3">
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-md bg-white text-[#5A6B80]">{icon}</span>
              {/* ⚠️ The NAME leads. It was third — under the ID pill and the type — so the tile
                  opened with a reference number and made you read past it to find out what the thing
                  actually is. What identifies an asset to a person is its name; the id is how the
                  system refers to it and the type is a qualifier on the name, so both belong on the
                  quieter line beneath.
                  ⚠️ ONE meta line, not two stacked rows. With the name carrying the weight, the id
                  and the type are the same rank as each other and a dot between them says so in a
                  line instead of a column — which also holds the tile to two lines whatever the
                  words are, so four of them stay the same height. */}
              <span className="flex min-w-0 flex-1 flex-col">
                <span style={roleStyle(styles, nodeId, 'body')} className="truncate text-[13px] font-medium leading-snug text-[#364658]">{r.name}</span>
                <span className="mt-1 flex min-w-0 items-center gap-1.5">
                  {cfg.showId !== false && (
                    <span className="flex-shrink-0 truncate whitespace-nowrap rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{r.id}</span>
                  )}
                  {cfg.showId !== false && cfg.showType !== false && (
                    <span className="flex-shrink-0 text-[11px] text-[#C3CBD6]">·</span>
                  )}
                  {cfg.showType !== false && (
                    <span style={roleStyle(styles, nodeId, 'meta')} className="min-w-0 truncate text-[11.5px] text-[#7B8FA5]">{r.type}</span>
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

/** A records row: blue ID pill · name · the type, right-aligned and muted. */
function RecordsCard({ nodeId, titleFallback, cfg, rows }: {
  nodeId: string; titleFallback: string; cfg: Record<string, unknown>;
  rows: { id: string; name: string; type: string }[];
}) {
  const { styles } = useCanvas();
  const shown = rows.slice(0, Number(cfg.show ?? 5));
  if (!shown.length) return <EmptyCard nodeId={nodeId} title={String(cfg.title ?? titleFallback)} cfg={cfg} />;
  return (
    <CardShell nodeId={nodeId} title={String(cfg.title ?? titleFallback)} count={shown.length} cfg={cfg}>
      <ListBody nodeId={nodeId}>
        {shown.map((r) => (
          <Row key={r.id} nodeId={nodeId}>
            <div className="flex items-center gap-2.5">
              {cfg.showId !== false && (
                <span className="max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{r.id}</span>
              )}
              <span style={roleStyle(styles, nodeId, 'body')} className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{r.name}</span>
              {cfg.showType !== false && (
                <span style={roleStyle(styles, nodeId, 'meta')} className="flex-shrink-0 text-[12px] text-[#7B8FA5]">{r.type}</span>
              )}
            </div>
          </Row>
        ))}
      </ListBody>
    </CardShell>
  );
}

/* P8's empty state, for real. My CIs is commonly empty on live instances, so this IS the state most
   requesters see — the message is editable and "hide the whole widget" is a legitimate answer. */
function EmptyCard({ nodeId, title, cfg = EMPTY_CFG }: { nodeId?: string; title: string; cfg?: Record<string, unknown> }) {
  const { styles, enabled } = useCanvas();
  const mode = nodeId ? chosen(styles, nodeId, 'emptyMode') : undefined;
  const msg = (nodeId ? chosen(styles, nodeId, 'emptyMsg') : undefined) ?? 'No Data Found';
  // Hidden means hidden on the published portal — on the canvas it stays visible but marked, or
  // the block you are composing would vanish from under you.
  if (mode === 'hide' && !enabled) return null;
  return (
    <CardShell nodeId={nodeId} title={title} count={0} cfg={cfg}>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-[#F0F2F5] py-10 text-[14px] text-[#7B8FA5]">
        <span className="flex items-center gap-2"><Info size={16} className="text-[#9CA3AF]" /> {String(msg)}</span>
        {mode === 'hide' && enabled && (
          <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#64748B]">Hidden when empty on the live portal</span>
        )}
      </div>
    </CardShell>
  );
}
