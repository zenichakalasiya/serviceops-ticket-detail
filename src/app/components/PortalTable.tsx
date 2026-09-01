/* The Table element — a spreadsheet-grade editor on the canvas, not a grid filled in from a panel.
 *
 * Everything structural is a gesture here: the grid picker on insert, the row and column handles,
 * drag-to-reorder, the boundary resize, the extend buttons, the rectangular cell selection and the
 * floating toolbar. The panel keeps what a gesture cannot express (TABLE-ELEMENT-PROMPT.md §6).
 *
 * ⚠️ THE HANDLES ARE AN OVERLAY, not table children. A <div> anywhere between <table>, <tbody> and
 * <tr> takes the row out of the table box model — each row becomes its own anonymous table, the
 * columns stop lining up and every cell sizes to its own longest word. This project has already
 * been bitten by exactly that (the note on `Sel` never wrapping a <tr>). So the rails are absolutely
 * positioned over a measured geometry, and the <table> underneath stays a real, unpolluted table.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowDownAZ, ArrowDownZA, ArrowLeft, ArrowRight,
  ArrowUp, ChevronRight, Copy, Eraser, Group, GripHorizontal, GripVertical, Heading, Maximize2,
  Palette, Plus, Table as TableIcon, Trash2, Ungroup,
} from 'lucide-react';
import { useCanvas } from './PortalCanvas';
import {
  MAX_DIM, addColumnAfter, addColumnBefore, addColumnBlocked, addRowAfter, addRowBefore,
  addRowBlocked, cellAt, cellStarts, clearCells, clearColumnContent, clearRowContent, columnCount,
  deleteColumn, deleteColumnBlocked, deleteRow, deleteRowBlocked, duplicateColumn, duplicateRow,
  fitTableToWidth, insertTable, isMerged, mergeBlockedBecause, mergeCells, moveColumn, moveRow,
  reorderColumn, reorderRow, resizeColumn, setCellAttribute, setCellContent, sortByColumn, splitCell,
  tableFrom, toggleHeaderCell,
} from './portalTableModel';
import type { CellAlign, TableModel, VertAlign } from './portalTableModel';

type Cfg = Record<string, unknown>;

/* ── the 10 × 10 insert picker ───────────────────────────────────────────── */

/** ⚠️ TEN, not the brief's eight — the task says 10×10 and the same number is the hard ceiling on
 *  every later insert, so the picker cannot offer a shape the table would then refuse to keep. */
export function TableGridPicker({ onPick, onCancel }: { onPick: (rows: number, cols: number) => void; onCancel?: () => void }) {
  const [over, setOver] = useState<{ r: number; c: number } | null>(null);
  const label = over ? `${over.r} × ${over.c}` : '';
  return (
    <div className="inline-block w-[228px] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]">
      <p className="mb-2 text-[13px] font-semibold text-[#364658]">Insert table</p>
      {/* ⚠️ A CONTIGUOUS grid — cells sharing their borders, the way a table's cells do. Spaced
          squares read as a set of buttons; the thing you are sizing is a grid, so the picker is one.
          The border comes from the wrapper plus each cell's right and bottom edge, which is what
          keeps the outer rule a single line rather than a doubled one. */}
      <div
        className="grid overflow-hidden rounded-[3px] border border-[#D9E0EA]"
        style={{ gridTemplateColumns: `repeat(${MAX_DIM}, 1fr)` }}
        onMouseLeave={() => setOver(null)}
      >
        {Array.from({ length: MAX_DIM * MAX_DIM }).map((_, i) => {
          const r = Math.floor(i / MAX_DIM) + 1;
          const c = (i % MAX_DIM) + 1;
          const on = !!over && r <= over.r && c <= over.c;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${r} by ${c}`}
              onMouseEnter={() => setOver({ r, c })}
              onClick={() => onPick(r, c)}
              className={`h-[18px] border-b border-r border-[#E8ECF1] transition-colors last:border-r-0 ${
                on ? 'bg-[#3D8BD0]' : 'bg-white hover:bg-[#EBF5FF]'
              } ${c === MAX_DIM ? 'border-r-0' : ''} ${r === MAX_DIM ? 'border-b-0' : ''}`}
            />
          );
        })}
      </div>
      {/* ⚠️ The footer reads the LIVE dimensions while you hover and names the action when you are
          not, so the number is decided before the click rather than discovered after it. */}
      <div className="mt-2.5 flex items-center gap-2 border-t border-[#F1F5F9] pt-2.5">
        <TableIcon size={15} className="flex-shrink-0 text-[#3D8BD0]" />
        <span className="flex-1 text-[12px] font-medium text-[#364658]">
          {over ? label : 'Choose row and column'}
        </span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[12px] text-[#6B7280] hover:text-[#364658]">Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ── geometry, measured ──────────────────────────────────────────────────── */

interface Geo { x: number[]; w: number[]; y: number[]; h: number[]; width: number; height: number }

/* ── the menu, with submenus ──────────────────────────────────────────────── */

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  run?: () => void;
  /** Disabled WITH a reason on it — never hidden, never inert (§10.6). */
  blocked?: string | null;
  divider?: boolean;
  /** Opens a flyout instead of acting. */
  children?: React.ReactNode;
}

/** Named colours, the way a document editor offers them.
 *
 * ⚠️ NAMES, not a spectrum. This is a table cell, not a brand palette — you are marking one value
 * as a warning or a total, and "Red" says that where #DC2626 does not. The portal's own colour
 * picker is still the right tool for anything that IS a design decision. */
const CELL_COLORS: [string, string][] = [
  ['Default', ''], ['Gray', '#6B7280'], ['Brown', '#92400E'], ['Orange', '#C2410C'],
  ['Yellow', '#A16207'], ['Green', '#15803D'], ['Blue', '#1D4ED8'], ['Purple', '#6D28D9'],
  ['Pink', '#BE185D'], ['Red', '#B91C1C'],
];
const CELL_BGS: [string, string][] = [
  ['None', ''], ['Gray', '#F3F4F6'], ['Brown', '#F5EFE9'], ['Orange', '#FFF1E7'],
  ['Yellow', '#FEF7E0'], ['Green', '#ECFDF3'], ['Blue', '#EFF6FF'], ['Purple', '#F5F0FF'],
  ['Pink', '#FDF2F8'], ['Red', '#FEF2F2'],
];

function ColorFlyout({ onText, onBg }: { onText: (c: string) => void; onBg: (c: string) => void }) {
  return (
    <div className="max-h-[300px] w-[190px] overflow-y-auto py-1">
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Text colour</p>
      {CELL_COLORS.map(([name, hex]) => (
        <button
          key={`t${name}`}
          type="button"
          onClick={() => onText(hex)}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]"
        >
          <span className="flex size-4 items-center justify-center text-[13px] font-semibold" style={{ color: hex || '#364658' }}>A</span>
          {name} text
        </button>
      ))}
      <div className="my-1 h-px bg-[#F1F5F9]" />
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Background</p>
      {CELL_BGS.map(([name, hex]) => (
        <button
          key={`b${name}`}
          type="button"
          onClick={() => onBg(hex)}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]"
        >
          <span
            className="size-4 flex-shrink-0 rounded-[3px] border border-[#E5E7EB]"
            style={{ background: hex || '#FFFFFF' }}
          />
          {name}
        </button>
      ))}
    </div>
  );
}

function AlignFlyout({ onH, onV }: { onH: (v: CellAlign) => void; onV: (v: VertAlign) => void }) {
  const row = 'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]';
  return (
    <div className="w-[168px] py-1">
      <button type="button" className={row} onClick={() => onH('left')}><AlignLeft size={14} /> Align left</button>
      <button type="button" className={row} onClick={() => onH('center')}><AlignCenter size={14} /> Align centre</button>
      <button type="button" className={row} onClick={() => onH('right')}><AlignRight size={14} /> Align right</button>
      <div className="my-1 h-px bg-[#F1F5F9]" />
      <button type="button" className={row} onClick={() => onV('top')}><ArrowUp size={14} /> Align top</button>
      <button type="button" className={row} onClick={() => onV('middle')}><AlignCenter size={14} className="rotate-90" /> Align middle</button>
      <button type="button" className={row} onClick={() => onV('bottom')}><ArrowDown size={14} /> Align bottom</button>
    </div>
  );
}

/** The viewport rect of the thing a menu acts on. The menu must never cover it. */
export interface AvoidRect { left: number; top: number; right: number; bottom: number }

function HandleMenu({ items, avoid, axis, onClose }: {
  items: MenuItem[];
  avoid: AvoidRect;
  /** 'x' = the target is a vertical strip (a column, a selection) → the menu goes beside it.
   *  'y' = the target is a horizontal band (a row) → the menu goes above or below it. */
  axis: 'x' | 'y';
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  /** Viewport rect of the row whose flyout is open — the flyout is portalled, so it needs one. */
  const [subAt, setSubAt] = useState<{ left: number; top: number } | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', away);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('mousedown', away); window.removeEventListener('keydown', esc); };
  }, [onClose]);

  /* ⚠️ THE MENU MUST NOT COVER THE CELLS IT IS ABOUT. It used to drop from the rail straight down
     the column, or from the row's top edge straight across the row — so the one thing you needed
     to see while choosing "Sort A → Z" or "Colour" was hidden behind the menu, and you were picking
     an action for data you could no longer read.
     The rule is the target's SHAPE. A column is a vertical strip, so the menu goes to its side; a
     row is a horizontal band, so the menu goes under it, or over it when there is no room below.
     Either way the selection stays fully visible and only its neighbours are covered.
     ⚠️ Measured AFTER mount, in a layout effect, because a flip needs the menu's real height and
     the row, column and cell menus are three different lengths. It renders hidden-but-laid-out for
     that one pass — `visibility`, never `display`, or there is nothing to measure. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const GAP = 6;
    const EDGE = 8;
    let left: number;
    let top: number;
    if (axis === 'y') {
      left = Math.min(Math.max(EDGE, avoid.left), window.innerWidth - EDGE - w);
      top = avoid.bottom + GAP;
      if (top + h > window.innerHeight - EDGE) {
        const above = avoid.top - GAP - h;
        /* Only when NEITHER side fits does it clamp and accept an overlap — a menu pushed off the
           window is worse than one covering what it is about. */
        top = above >= EDGE ? above : Math.max(EDGE, window.innerHeight - EDGE - h);
      }
    } else {
      top = Math.min(Math.max(EDGE, avoid.top), window.innerHeight - EDGE - h);
      left = avoid.right + GAP;
      if (left + w > window.innerWidth - EDGE) {
        const l = avoid.left - GAP - w;
        left = l >= EDGE ? l : Math.max(EDGE, window.innerWidth - EDGE - w);
      }
    }
    setPos({ left, top });
  }, [axis, avoid.left, avoid.top, avoid.right, avoid.bottom, items.length]);

  /* ⚠️ PORTALLED, and positioned in VIEWPORT coordinates. The table wrapper scrolls horizontally,
     and an absolutely-positioned menu inside an `overflow-x-auto` box is clipped at its edge — the
     same trap that took the Colour and Alignment flyouts, the drawer tab strip and the listing
     kebab. Moving the menu beside a column would have walked straight back into it. */
  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? 'visible' : 'hidden',
      }}
      /* ⚠️ A capped height with its own scroll. The column menu is twelve items and the table can
         sit anywhere on a long page — without this the last few rows fall off the bottom of the
         canvas, which is exactly where Delete lives. */
      /* ⚠️ `overflow-x-visible` next to `overflow-y-auto` DOES NOTHING — CSS forbids one axis being
         visible while the other scrolls, so the x axis silently computes to `auto` as well and the
         Colour and Alignment flyouts were clipped at the menu's edge. They open in a PORTAL now,
         positioned from the trigger's own rect, so the menu can keep its scroll and the flyout can
         leave it. */
      className="z-[10000] max-h-[320px] min-w-[214px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) => (
        <div key={it.label + i} className="relative">
          {it.divider && <div className="my-1 h-px bg-[#F1F5F9]" />}
          <button
            type="button"
            role="menuitem"
            disabled={!!it.blocked}
            title={it.blocked ?? undefined}
            /* ⚠️ HOVER opens it, and the rect is measured at the same moment. Requiring a click on
               a row that only has children was the thing that made Colour and Alignment feel dead:
               you hovered, nothing happened, and the row looked like a disabled item. */
            onMouseEnter={(ev) => {
              if (!it.children) { setOpenSub(null); return; }
              const b = (ev.currentTarget as HTMLElement).getBoundingClientRect();
              setSubAt({ left: b.right, top: b.top - 6 });
              setOpenSub(it.label);
            }}
            onClick={() => {
              if (it.blocked) return;
              if (it.children) { setOpenSub((s) => (s === it.label ? null : it.label)); return; }
              it.run?.();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] ${
              it.blocked ? 'cursor-not-allowed text-[#C3CBD6]' : 'text-[#364658] hover:bg-[#F5F7FA]'
            }`}
          >
            <span className="flex size-4 flex-shrink-0 items-center justify-center text-current">{it.icon}</span>
            <span className="flex-1">{it.label}</span>
            {it.children && <ChevronRight size={13} className="flex-shrink-0 text-[#9CA3AF]" />}
          </button>
          {it.children && openSub === it.label && subAt && createPortal(
            /* ⚠️ Flipped to the LEFT when the right would run off the window, and clamped so the
               bottom of a long colour list stays on screen. It is portalled to the body, so neither
               the menu's scroll nor the canvas's own clipping can cut it. */
            <div
              style={{
                position: 'fixed',
                left: subAt.left + 214 + 190 > window.innerWidth ? subAt.left - 190 - 4 : subAt.left + 4,
                top: Math.min(subAt.top, Math.max(8, window.innerHeight - 320)),
              }}
              className="z-[10001] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_16px_-4px_rgba(16,24,40,0.10)]"
              onMouseEnter={() => setOpenSub(it.label)}
              onMouseLeave={() => setOpenSub(null)}
              onClick={(e) => e.stopPropagation()}
            >{it.children}</div>,
            document.body,
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* ── the element ─────────────────────────────────────────────────────────── */

export function PortalTable({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { enabled, setCfg } = useCanvas();
  const model = useMemo(() => tableFrom(cfg), [cfg]);
  const cols = columnCount(model);
  const rows = model.rows.length;

  /* ⚠️ Every write goes through here, so the whole table is ONE config key. Undo already snapshots
     widget config, which is what makes a merge or a reorder a single Ctrl+Z rather than one step
     per cell touched. */
  const write = useCallback((m: TableModel) => setCfg?.(nodeId, { table: m }), [setCfg, nodeId]);

  /* A table that has never been given a size shows the picker instead of a default 3×3 — the shape
     is the first decision, and guessing it means the first act is always to correct the guess. */
  const [picking, setPicking] = useState(false);
  const fresh = !cfg.table && !(cfg.rows as unknown[])?.length;

  const wrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  /* ⚠️ Read by the drag handler, which must measure against the CURRENT layout rather than the one
     that existed when the press began — the table reflows the moment a row is lifted. */
  const geoRef = useRef<Geo | null>(null);
  geoRef.current = geo;
  /** Where the dragged ghost sits, in viewport coordinates. Null when nothing is being dragged. */
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  /* ⚠️ The table-level affordances — the select-all corner and the two extend buttons — appear on
     table hover. The row and column GRIPS do not: they follow the hovered CELL (see below). */
  const [overTable, setOverTable] = useState(false);

  /* ⚠️ ONE row grip and ONE column grip at a time — the hovered cell's, not the whole rail's.
     `hoverRow`/`hoverCol` are the coordinates of the cell under the pointer, set by the cell itself,
     so hovering the first cell lights the first row and the first column and nothing else. Gating
     this on "is the pointer anywhere over the table" — which is what it did — put a grip on every
     row and every column at once, which says nothing about where you are and buries the one you
     were reaching for in a rail of identical bars.
     A grip stays visible while its row or column is SELECTED, because otherwise moving the pointer
     away would hide the only thing showing what is selected. */
  const colLit = (i: number) =>
    hoverCol === i
    || (drag?.kind === 'col' && drag.from === i)
    || (!!sel && Math.min(sel.c0, sel.c1) <= i && i <= Math.max(sel.c0, sel.c1));
  const colOn = (i: number) =>
    (drag?.kind === 'col' && drag.from === i)
    || (!!sel && Math.min(sel.c0, sel.c1) <= i && i <= Math.max(sel.c0, sel.c1));
  const rowLit = (i: number) =>
    hoverRow === i
    || (drag?.kind === 'row' && drag.from === i)
    || (!!sel && Math.min(sel.r0, sel.r1) <= i && i <= Math.max(sel.r0, sel.r1));
  const rowOn = (i: number) =>
    (drag?.kind === 'row' && drag.from === i)
    || (!!sel && Math.min(sel.r0, sel.r1) <= i && i <= Math.max(sel.r0, sel.r1));
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  /* ⚠️ An avoid-RECT, not a point. The menu works out where to sit from the shape of what it acts
     on (see HandleMenu), so a call site says WHAT is selected rather than guessing where the menu
     should go — which is how three call sites came to make three different guesses, two of them
     landing the menu on top of the very cells it was about. */
  const [menu, setMenu] = useState<
    { kind: 'row' | 'col' | 'cell'; index: number; avoid: AvoidRect; axis: 'x' | 'y' } | null
  >(null);
  const [sel, setSel] = useState<{ r0: number; c0: number; r1: number; c1: number } | null>(null);
  /* ⚠️ BELOW `sel`, not beside colLit/colOn. Those are arrow functions and are not evaluated until
     something calls them, so they can sit above the state they read; this is a plain expression
     evaluated where it stands, and one line higher it is a temporal-dead-zone crash esbuild does
     not typecheck for and never reports.
     The corner selects everything, so its lit weight is "everything IS selected" — the question
     colOn/rowOn ask about one band, asked about the whole table. */
  const allSelected = !!sel
    && Math.min(sel.r0, sel.r1) === 0 && Math.max(sel.r0, sel.r1) === rows - 1
    && Math.min(sel.c0, sel.c1) === 0 && Math.max(sel.c0, sel.c1) === cols - 1;
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: 'row' | 'col'; from: number; to: number } | null>(null);
  const dragRef = useRef<typeof drag>(null);
  dragRef.current = drag;

  /* ── measure ──
     ⚠️ Read off the RENDERED cells, not computed from colWidths. The two agree in the simple case,
     but a percentage of a container that has not laid out yet is zero — and the rails would then
     draw at the left edge for one frame every time the panel is resized. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const table = tableRef.current;
    if (!wrap || !table) return;
    const base = wrap.getBoundingClientRect();
    const firstRow = table.tBodies[0]?.rows[0] ?? table.tHead?.rows[0];
    if (!firstRow) return;
    const x: number[] = []; const w: number[] = [];
    [...firstRow.cells].forEach((c) => {
      const r = c.getBoundingClientRect();
      x.push(r.left - base.left); w.push(r.width);
    });
    const y: number[] = []; const h: number[] = [];
    const allRows = [...(table.tHead?.rows ?? []), ...(table.tBodies[0]?.rows ?? [])];
    allRows.forEach((tr) => {
      const r = tr.getBoundingClientRect();
      y.push(r.top - base.top); h.push(r.height);
    });
    const tr = table.getBoundingClientRect();
    setGeo({ x, w, y, h, width: tr.width, height: tr.height });
  }, []);

  useLayoutEffect(() => { measure(); }, [measure, model, cfg]);
  useEffect(() => {
    if (!enabled) return undefined;
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [enabled, measure]);

  /* ── selection helpers ── */
  const selIds = useMemo(() => {
    if (!sel) return [] as string[];
    const ids: string[] = [];
    const [r0, r1] = [Math.min(sel.r0, sel.r1), Math.max(sel.r0, sel.r1)];
    const [c0, c1] = [Math.min(sel.c0, sel.c1), Math.max(sel.c0, sel.c1)];
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const cell = model.rows[r] && cellAt(model.rows[r], c);
        if (cell && !ids.includes(cell.id)) ids.push(cell.id);
      }
    }
    return ids;
  }, [sel, model]);

  const selRect = useMemo(() => {
    if (!sel || !geo) return null;
    const [r0, r1] = [Math.min(sel.r0, sel.r1), Math.max(sel.r0, sel.r1)];
    const [c0, c1] = [Math.min(sel.c0, sel.c1), Math.max(sel.c0, sel.c1)];
    if (geo.x[c0] === undefined || geo.y[r0] === undefined) return null;
    return {
      left: geo.x[c0],
      top: geo.y[r0],
      width: (geo.x[c1] ?? 0) + (geo.w[c1] ?? 0) - geo.x[c0],
      height: (geo.y[r1] ?? 0) + (geo.h[r1] ?? 0) - geo.y[r0],
    };
  }, [sel, geo]);

  /* ── drag to reorder a row or a column ──
   *
   * ⚠️ A 4px THRESHOLD before it becomes a drag. The handle is also the menu button, and without a
   * threshold every press started a drag — so a plain click reordered nothing, opened the menu on
   * release, and felt like the drag had failed. Nothing moves until the pointer has actually
   * travelled, which is what makes one control do both jobs.
   * ⚠️ `geo` is read from a REF, not from the closure. The value captured at mousedown is a
   * snapshot: the first `setDrag` re-renders, the table reflows around the lifted row, and the
   * handler goes on measuring against geometry that no longer exists — which is why the drop
   * indicator drifted one column off partway across a wide table.
   * ⚠️ Listeners go on the WINDOW and `preventDefault` is called on the move, so a drag that leaves
   * the table — or the browser's own text selection — cannot swallow it. */
  const startReorder = (kind: 'row' | 'col', index: number) => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX; const sy = e.clientY;
    let live = false;

    const at = (ev: MouseEvent) => {
      const wrap = wrapRef.current; const g = geoRef.current;
      if (!wrap || !g) return index;
      const base = wrap.getBoundingClientRect();
      if (kind === 'col') {
        const px = ev.clientX - base.left;
        const i = g.x.findIndex((x, n) => px < x + g.w[n] / 2);
        return i < 0 ? g.x.length - 1 : i;
      }
      const py = ev.clientY - base.top;
      const i = g.y.findIndex((y, n) => py < y + g.h[n] / 2);
      return i < 0 ? g.y.length - 1 : i;
    };

    const move = (ev: MouseEvent) => {
      if (!live) {
        if (Math.abs(ev.clientX - sx) < 4 && Math.abs(ev.clientY - sy) < 4) return;
        live = true;
        setDrag({ kind, from: index, to: index });
      }
      ev.preventDefault();
      setGhost({ x: ev.clientX, y: ev.clientY });
      const to = at(ev);
      setDrag((d) => (d ? { ...d, to } : d));
    };

    const up = () => {
      const d = dragRef.current;
      if (live && d && d.to !== d.from) {
        write(d.kind === 'col' ? reorderColumn(model, d.from, d.to) : reorderRow(model, d.from, d.to));
      }
      setDrag(null);
      setGhost(null);
      /* ⚠️ Swallow the click that a real press-and-release always fires afterwards, or every drag
         would end by opening the menu it just used as a handle. Only after a drag — a plain click
         must still reach the button. */
      if (live) window.addEventListener('click', (c) => { c.stopPropagation(); c.preventDefault(); }, { capture: true, once: true });
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── drag a column boundary ── */
  const startResize = (col: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const total = geo?.width || 1;
    const base = model;
    const move = (ev: MouseEvent) => {
      const deltaPct = ((ev.clientX - startX) / total) * 100;
      write(resizeColumn(base, col, deltaPct));
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── cell mouse: click to edit, drag to select a rectangle ── */
  const cellDown = (r: number, c: number) => (e: React.MouseEvent) => {
    if (!enabled) return;
    e.stopPropagation();
    if (editing) return;
    if (e.shiftKey && sel) { setSel({ ...sel, r1: r, c1: c }); return; }
    setSel({ r0: r, c0: c, r1: r, c1: c });
    let moved = false;
    const move = (ev: MouseEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const td = el?.closest?.('[data-cell]') as HTMLElement | null;
      if (!td) return;
      const rr = Number(td.dataset.r); const cc = Number(td.dataset.c);
      if (rr !== r || cc !== c) moved = true;
      setSel((s) => (s ? { ...s, r1: rr, c1: cc } : s));
    };
    const up = () => {
      /* A click that never left its cell is an EDIT, not a one-cell selection. Word, Sheets and
         Tiptap all behave this way and it saves a double-click on the commonest action there is. */
      if (!moved) { const cell = cellAt(model.rows[r], c); if (cell) setEditing(cell.id); }
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ── keyboard ── */
  const onCellKey = (r: number, c: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const back = e.shiftKey;
      let nr = r; let nc = c + (back ? -1 : 1);
      if (nc >= cols) { nc = 0; nr = r + 1; }
      if (nc < 0) { nc = cols - 1; nr = r - 1; }
      /* ⚠️ Tab out of the LAST cell appends a row (§7) — unless the table is at its ceiling, in
         which case it simply stops rather than silently doing nothing somewhere else. */
      if (nr >= rows) {
        if (addRowBlocked(model)) return;
        write(addRowAfter(model, rows - 1));
        setTimeout(() => setEditing(null), 0);
        return;
      }
      if (nr < 0) return;
      const cell = model.rows[nr] && cellAt(model.rows[nr], nc);
      if (cell) setEditing(cell.id);
      return;
    }
    if (e.key === 'Escape') { (e.target as HTMLElement).blur(); setEditing(null); }
  };

  useEffect(() => {
    if (!enabled || editing || !sel) return undefined;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        write(clearCells(model, selIds));
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [enabled, editing, sel, selIds, model, write]);

  /* ── the picker, for a table that has no shape yet ── */
  if (fresh || picking) {
    return (
      <div className="flex flex-col items-start gap-3" onClick={(e) => e.stopPropagation()}>
        <TableGridPicker
          onPick={(r, c) => { write(insertTable({ rows: r, cols: c, withHeaderRow: cfg.headerRow !== false })); setPicking(false); }}
          onCancel={picking ? () => setPicking(false) : undefined}
        />
      </div>
    );
  }

  /* ── menus ── */
  const colorItems = (ids: string[]) => (
    <ColorFlyout
      onText={(c) => write(setCellAttribute(model, ids, 'color', c || undefined))}
      onBg={(c) => write(setCellAttribute(model, ids, 'bg', c || undefined))}
    />
  );
  const alignItems = (ids: string[]) => (
    <AlignFlyout
      onH={(v) => write(setCellAttribute(model, ids, 'textAlign', v))}
      onV={(v) => write(setCellAttribute(model, ids, 'verticalAlign', v))}
    />
  );
  /** Every cell id in one row / one column — what a handle menu's Colour and Alignment act on. */
  const rowIds = (i: number) => (model.rows[i]?.cells ?? []).map((c) => c.id);
  const colIds = (c: number) => model.rows.map((r) => cellAt(r, c)?.id).filter(Boolean) as string[];

  const rowMenu = (i: number): MenuItem[] => [
    { label: 'Insert row above', icon: <ArrowUp size={14} />, blocked: addRowBlocked(model), run: () => write(addRowBefore(model, i)) },
    { label: 'Insert row below', icon: <ArrowDown size={14} />, blocked: addRowBlocked(model), run: () => write(addRowAfter(model, i)) },
    { label: 'Move up', icon: <ArrowUp size={14} />, divider: true, blocked: i === 0 ? 'Already the first row' : null, run: () => write(moveRow(model, i, 'up')) },
    { label: 'Move down', icon: <ArrowDown size={14} />, blocked: i === rows - 1 ? 'Already the last row' : null, run: () => write(moveRow(model, i, 'down')) },
    { label: 'Colour', icon: <Palette size={14} />, divider: true, children: colorItems(rowIds(i)) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(rowIds(i)) },
    { label: 'Duplicate row', icon: <Copy size={14} />, divider: true, blocked: addRowBlocked(model), run: () => write(duplicateRow(model, i)) },
    /* ⚠️ Writes the CONFIG key, not the model — the panel's "First row is a header" switch writes
       the same one, so the menu item and the switch are two ways to reach one value rather than two
       values that drift. `tableFrom` applies it to the model on every read. */
    { label: model.headerRow ? 'Remove header row' : 'Make header row', icon: <Heading size={14} />, divider: true, blocked: i === 0 ? null : 'Only the first row can be the header', run: () => setCfg?.(nodeId, { headerRow: !model.headerRow }) },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearRowContent(model, i)) },
    { label: 'Delete row', icon: <Trash2 size={14} />, divider: true, blocked: deleteRowBlocked(model), run: () => write(deleteRow(model, i)) },
  ];

  /* What a SELECTION can be given. ⚠️ Deliberately short: everything structural belongs to a whole
     row or column, and offering "insert" or "delete" against an arbitrary rectangle would raise a
     question the model has no answer to. */
  const cellMenu = (): MenuItem[] => {
    const r0 = sel ? Math.min(sel.r0, sel.r1) : 0;
    const r1 = sel ? Math.max(sel.r0, sel.r1) : 0;
    const c0 = sel ? Math.min(sel.c0, sel.c1) : 0;
    const c1 = sel ? Math.max(sel.c0, sel.c1) : 0;
    /* ⚠️ ONE slot, showing merge or split by what is selected — they are the same intent aimed at
       two states, and two permanently-visible items would leave one of them dead whichever cell you
       had. The reason for a refusal rides on the disabled control, where you can read it before you
       reach for it rather than after. */
    const one = selIds.length === 1 && isMerged(model, selIds[0]);
    const why = mergeBlockedBecause(model, r0, r1, c0, c1);
    return [
    one
      ? { label: 'Split cell', icon: <Ungroup size={14} />, run: () => write(splitCell(model, selIds[0])) }
      : { label: 'Merge cells', icon: <Group size={14} />, blocked: why, run: () => write(mergeCells(model, r0, r1, c0, c1)) },
    { label: 'Colour', icon: <Palette size={14} />, divider: true, children: colorItems(selIds) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(selIds) },
    { label: selIds.length > 1 ? 'Toggle header cells' : 'Toggle header cell', icon: <Heading size={14} />, divider: true, run: () => { let m = model; selIds.forEach((id) => { m = toggleHeaderCell(m, id); }); write(m); } },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearCells(model, selIds, { resetAttrs: true })) },
    ];
  };

  const colMenu = (i: number): MenuItem[] => [
    { label: 'Insert column left', icon: <ArrowLeft size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnBefore(model, i)) },
    { label: 'Insert column right', icon: <ArrowRight size={14} />, blocked: addColumnBlocked(model), run: () => write(addColumnAfter(model, i)) },
    { label: 'Move left', icon: <ArrowLeft size={14} />, divider: true, blocked: i === 0 ? 'Already the first column' : null, run: () => write(moveColumn(model, i, 'left')) },
    { label: 'Move right', icon: <ArrowRight size={14} />, blocked: i === cols - 1 ? 'Already the last column' : null, run: () => write(moveColumn(model, i, 'right')) },
    /* ⚠️ Sorting a table with ONE body row is a no-op, so it says so rather than doing nothing. */
    { label: 'Sort column A → Z', icon: <ArrowDownAZ size={14} />, divider: true, blocked: rows - (model.headerRow ? 1 : 0) < 2 ? 'Nothing to sort — one row' : null, run: () => write(sortByColumn(model, i, 'asc')) },
    { label: 'Sort column Z → A', icon: <ArrowDownZA size={14} />, blocked: rows - (model.headerRow ? 1 : 0) < 2 ? 'Nothing to sort — one row' : null, run: () => write(sortByColumn(model, i, 'desc')) },
    { label: 'Colour', icon: <Palette size={14} />, divider: true, children: colorItems(colIds(i)) },
    { label: 'Alignment', icon: <AlignLeft size={14} />, children: alignItems(colIds(i)) },
    { label: 'Duplicate column', icon: <Copy size={14} />, divider: true, blocked: addColumnBlocked(model), run: () => write(duplicateColumn(model, i)) },
    { label: model.headerColumn ? 'Remove header column' : 'Make header column', icon: <Heading size={14} />, divider: true, blocked: i === 0 ? null : 'Only the first column can be the header', run: () => setCfg?.(nodeId, { firstColumn: !model.headerColumn }) },
    { label: 'Clear contents', icon: <Eraser size={14} />, run: () => write(clearColumnContent(model, i)) },
    { label: 'Fit columns to width', icon: <Maximize2 size={14} />, run: () => write(fitTableToWidth(model)) },
    { label: 'Delete column', icon: <Trash2 size={14} />, divider: true, blocked: deleteColumnBlocked(model), run: () => write(deleteColumn(model, i)) },
  ];

  /* ── styling from the panel ── */
  const pad = Number(cfg.cellPad ?? 8);
  const fmt = (v: unknown) => {
    const on = Array.isArray(v) ? (v as string[]) : [];
    return {
      fontWeight: on.includes('Bold') ? 700 : undefined,
      textDecoration: on.includes('Underline') ? 'underline' : undefined,
      fontStyle: on.includes('Italic') ? 'italic' : undefined,
    };
  };
  const face = (p: 'head' | 'row'): CSSProperties => ({
    fontFamily: cfg[`${p}Font`] === 'Inherit from theme' ? undefined : (cfg[`${p}Font`] as string),
    fontWeight: ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[
      String(cfg[`${p}Weight`] ?? (p === 'head' ? 'Semibold' : 'Normal'))],
    fontSize: Number(cfg[`${p}Size`] ?? 13),
    color: String(cfg[`${p}Color`] ?? '#364658'),
    ...fmt(cfg[`${p}Format`]),
  });
  const bw = Number(cfg.frameBorderWidth ?? 1);
  const bc = String(cfg.frameBorderColor ?? '#E5E7EB');

  const RAIL = 14;
  const inSel = (r: number, c: number) => !!sel
    && r >= Math.min(sel.r0, sel.r1) && r <= Math.max(sel.r0, sel.r1)
    && c >= Math.min(sel.c0, sel.c1) && c <= Math.max(sel.c0, sel.c1);

  return (
    /* ⚠️ NEGATIVE MARGIN against the padding, so the rails hang OUTSIDE the element's box and the
       table's own left edge lands exactly where every other element's does. As padding alone it
       pushed the table 18px in from the section edge — so a table was the one element that did not
       line up with the cards above it, and worse, the inset existed only in the BUILDER: `enabled`
       is false on the published page, so the canvas and the portal disagreed about where the table
       started. The padding stays because every handle position below is measured from it. */
    <div
      className="relative"
      style={enabled ? {
        paddingTop: RAIL + 4,
        paddingLeft: RAIL + 4,
        marginTop: -(RAIL + 4),
        marginLeft: -(RAIL + 4),
      } : undefined}
      onMouseEnter={() => setOverTable(true)}
      onMouseLeave={() => { setOverTable(false); setHoverRow(null); setHoverCol(null); }}
    >
      {/* ⚠️ ALWAYS scrollable. This was an admin toggle, which made "does a wide table fit on a
          phone" a question every table put to its author — and the only answer anyone wants is
          yes. It belongs to the product, so it is unconditional and stores no value at all. */}
      <div ref={wrapRef} className="relative overflow-x-auto">
        {/* ⚠️ A real <table> with a real <colgroup> and `table-fixed`. Column width is a property of
            the column; without both halves the browser sizes from content and the colgroup is
            ignored entirely. */}
        <table ref={tableRef} className="w-full table-fixed border-collapse">
          <colgroup>
            {model.colWidths.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
          </colgroup>
          {model.headerRow && (
            <thead>
              <tr>{model.rows[0].cells.map((cell, ci) => (
                <TableCellView
                  key={cell.id} tag="th" cell={cell} r={0} c={cellStarts(model.rows[0])[ci]}
                  pad={pad} bw={bw} bc={bc} face={face('head')} enabled={enabled}
                  editing={editing === cell.id} selected={inSel(0, cellStarts(model.rows[0])[ci])}
                  defaultAlign={cfg.cellAlign as CellAlign}
                  onDown={cellDown(0, cellStarts(model.rows[0])[ci])}
                  onKey={onCellKey(0, cellStarts(model.rows[0])[ci])}
                  onCommit={(v) => { write(setCellContent(model, cell.id, v)); setEditing(null); }}
                  onHover={(r, c) => { setHoverRow(r); setHoverCol(c); }}
                />
              ))}</tr>
            </thead>
          )}
          <tbody>
            {model.rows.slice(model.headerRow ? 1 : 0).map((row, bi) => {
              const ri = bi + (model.headerRow ? 1 : 0);
              const starts = cellStarts(row);
              const bodyIndex = model.headerRow ? ri - 1 : ri;
              const stripe = String((bodyIndex % 2 === 0 ? cfg.evenBg : cfg.oddBg) ?? '#FFFFFF');
              return (
                /* ⚠️ NEVER wrapped. A div between <tbody> and <tr> makes every row its own anonymous
                   table — the columns stop aligning and the colgroup stops applying. */
                <tr key={row.id} style={{ background: stripe }}>
                  {row.cells.map((cell, ci) => (
                    <TableCellView
                      key={cell.id}
                      tag={cell.isHeader || (model.headerColumn && ci === 0) ? 'th' : 'td'}
                      scope={model.headerColumn && ci === 0 ? 'row' : undefined}
                      cell={cell} r={ri} c={starts[ci]}
                      pad={pad} bw={bw} bc={bc}
                      face={face(cell.isHeader || (model.headerColumn && ci === 0) ? 'head' : 'row')}
                      enabled={enabled}
                      editing={editing === cell.id} selected={inSel(ri, starts[ci])}
                      defaultAlign={cfg.cellAlign as CellAlign}
                      onDown={cellDown(ri, starts[ci])}
                      onKey={onCellKey(ri, starts[ci])}
                      onCommit={(v) => { write(setCellContent(model, cell.id, v)); setEditing(null); }}
                      onHover={(r, c) => { setHoverRow(r); setHoverCol(c); }}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── the selection region: ONE stroke around the outside, not a border per cell ── */}
        {/* ⚠️ ONE stroke around the outside, not a border per cell — and it is 1px, not 2px. At 2px
            the selection outweighed the table's own 1px grid, so selecting a column redrew the table
            with one column apparently built to a different spec; the ring has only to say where the
            range ENDS, and the wash inside says which cells are in it. */}
        {enabled && selRect && (
          <span
            className="pointer-events-none absolute z-[40] rounded-[2px]"
            style={{ ...selRect, boxShadow: 'inset 0 0 0 1px var(--tt-table-selected-stroke, #3D8BD0)' }}
          />
        )}
      </div>

      {/* ── overlay: rails, drop indicator, resize grips, extend buttons ── */}
      {enabled && geo && (
        <>
          {/* column rail */}
          {geo.x.map((x, i) => (
            <button
              key={`ch${i}`}
              type="button"
              aria-label={`Column ${i + 1} options`}
              onMouseEnter={() => setHoverCol(i)}
              onMouseDown={startReorder('col', i)}
              onClick={(e) => {
                e.stopPropagation();
                setSel({ r0: 0, c0: i, r1: rows - 1, c1: i });
                /* The grip spans the column's width, so its rect already IS the column's horizontal
                   extent; the cells run from under the rail to the foot of the table. */
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const w = wrapRef.current!.getBoundingClientRect();
                setMenu({
                  kind: 'col', index: i, axis: 'x',
                  avoid: { left: b.left, right: b.right, top: b.bottom, bottom: w.bottom },
                });
              }}
              style={{ left: x + RAIL + 4, width: geo.w[i] - 2, top: 0, height: RAIL, cursor: drag?.kind === 'col' ? 'grabbing' : 'grab' }}
              /* ⚠️ A GRIP, not a chevron. The bar is a drag handle first and a menu button second —
                 a chevron says "this opens something" and says nothing at all about picking it up,
                 which is exactly the half of the control people could not find. */
              /* ⚠️ SIX DOTS, on the hovered cell's column only — and the DOTS carry the state, not a
                 slab behind them. A filled pill was a saturated bar sitting above every column the
                 pointer crossed: the loudest thing on a canvas whose whole subject is the content
                 underneath it, and at RAIL height it read as a UI element the table had grown rather
                 than a handle offered to the pointer.
                 Three weights, all of them quiet: grey dots on nothing while the column is merely
                 lit; a pale grey ground the moment the pointer is actually ON the grip, because a
                 button with no ground at all gives you nothing to aim at; and a pale ACCENT ground
                 with accent dots once the column is selected or being dragged. The two-weight story
                 the pill was telling survives — it is just told in tint instead of fill.
                 ⚠️ `transition`, not `transition-opacity transition-colors`. Both set
                 `transition-property`, so the second silently won and the grip's fade-in never ran. */
              className={`absolute z-[50] flex items-center justify-center rounded transition ${
                colLit(i) ? 'opacity-100' : 'pointer-events-none opacity-0'
              } ${colOn(i) ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-transparent text-[#B6C2D5] hover:bg-[#F1F5F9] hover:text-[#7B8FA5]'}`}
            ><GripHorizontal size={12} /></button>
          ))}
          {/* row rail */}
          {geo.y.map((y, i) => (
            <button
              key={`rh${i}`}
              type="button"
              aria-label={`Row ${i + 1} options`}
              onMouseEnter={() => setHoverRow(i)}
              onMouseDown={startReorder('row', i)}
              onClick={(e) => {
                e.stopPropagation();
                setSel({ r0: i, c0: 0, r1: i, c1: cols - 1 });
                /* The grip spans the row's height, so its rect IS the band's vertical extent; the
                   row itself runs the full width of the table. */
                const w = wrapRef.current!.getBoundingClientRect();
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenu({
                  kind: 'row', index: i, axis: 'y',
                  avoid: { left: w.left + RAIL, right: w.right, top: b.top, bottom: b.bottom },
                });
              }}
              style={{ top: y + RAIL + 4, height: geo.h[i] - 2, left: 0, width: RAIL, cursor: drag?.kind === 'row' ? 'grabbing' : 'grab' }}
              className={`absolute z-[50] flex items-center justify-center rounded transition ${
                rowLit(i) ? 'opacity-100' : 'pointer-events-none opacity-0'
              } ${rowOn(i) ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-transparent text-[#B6C2D5] hover:bg-[#F1F5F9] hover:text-[#7B8FA5]'}`}
            ><GripVertical size={12} /></button>
          ))}

          {/* select-all corner */}
          <button
            type="button"
            aria-label="Select the whole table"
            onClick={(e) => { e.stopPropagation(); setSel({ r0: 0, c0: 0, r1: rows - 1, c1: cols - 1 }); }}
            style={{ width: RAIL, height: RAIL }}
            /* Same three weights as the grips, so the corner reads as one of them rather than as a
               fourth kind of control in the same 14px rail. */
            className={`absolute left-0 top-0 z-[50] rounded transition ${
              overTable || drag ? 'opacity-100' : 'opacity-0'
            } ${allSelected ? 'bg-[#EBF5FF]' : 'bg-[#F1F5F9] hover:bg-[#E4EAF1]'}`}
          />

          {/* live drop indicator while reordering */}
          {drag && drag.to !== drag.from && (
            drag.kind === 'col'
              ? <span className="pointer-events-none absolute z-[60] w-[2px] bg-[#3D8BD0]" style={{ left: geo.x[drag.to] + RAIL + 4 + (drag.to > drag.from ? geo.w[drag.to] : 0), top: RAIL + 4, height: geo.height }} />
              : <span className="pointer-events-none absolute z-[60] h-[2px] bg-[#3D8BD0]" style={{ top: geo.y[drag.to] + RAIL + 4 + (drag.to > drag.from ? geo.h[drag.to] : 0), left: RAIL + 4, width: geo.width }} />
          )}

          {/* column-boundary resize grips */}
          {geo.x.slice(0, -1).map((x, i) => (
            <span
              key={`rz${i}`}
              onMouseDown={startResize(i)}
              style={{ left: x + geo.w[i] + RAIL + 4 - 3, top: RAIL + 4, height: geo.height }}
              className="absolute z-[55] w-[6px] cursor-col-resize hover:bg-[#3D8BD0]/30"
            />
          ))}

          {/* extend by one, at the right and bottom edges */}
          <button
            type="button"
            aria-label="Add a column"
            title={addColumnBlocked(model) ?? 'Add a column'}
            disabled={!!addColumnBlocked(model)}
            onClick={(e) => { e.stopPropagation(); write(addColumnAfter(model, cols - 1)); }}
            style={{ left: RAIL + 6 + geo.width + 4, top: RAIL + 4 + geo.height / 2 - 9 }}
            className="absolute z-[50] flex size-[18px] items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[#6B7280] shadow-sm transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0] disabled:cursor-not-allowed disabled:opacity-40"
          ><Plus size={12} /></button>
          <button
            type="button"
            aria-label="Add a row"
            title={addRowBlocked(model) ?? 'Add a row'}
            disabled={!!addRowBlocked(model)}
            onClick={(e) => { e.stopPropagation(); write(addRowAfter(model, rows - 1)); }}
            style={{ left: RAIL + 4 + geo.width / 2 - 9, top: RAIL + 6 + geo.height + 4 }}
            className="absolute z-[50] flex size-[18px] items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[#6B7280] shadow-sm transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0] disabled:cursor-not-allowed disabled:opacity-40"
          ><Plus size={12} /></button>

          {/* ⚠️ Cell padding is dragged from the BOTTOM edge, as asked. It writes the SAME `cellPad`
              key the panel slider writes, so the two are one value with two affordances rather than
              two controls that can disagree. */}
          <span
            onMouseDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              const startY = e.clientY; const start = pad;
              const move = (ev: MouseEvent) => {
                const next = Math.min(28, Math.max(2, Math.round(start + (ev.clientY - startY) / (rows * 2))));
                setCfg?.(nodeId, { cellPad: next });
              };
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }}
            title="Drag to change cell padding"
            style={{ left: RAIL + 4, top: RAIL + 4 + geo.height - 3, width: geo.width }}
            className="absolute z-[45] h-[6px] cursor-row-resize hover:bg-[#3D8BD0]/30"
          />

          {/* ⚠️ A GHOST under the cursor, so a drag looks like carrying something rather than like
              nothing happening. It is the row or column's own text at 70% on a white card — enough
              to recognise WHICH one you picked up, which a plain grey rectangle cannot say.
              ⚠️ `position: fixed` with viewport coordinates: the table sits inside a scrolling
              canvas, so anything positioned against the wrapper lags the cursor the moment the page
              scrolls under it. */}
          {drag && ghost && (
            <span
              className="pointer-events-none fixed z-[9999] max-w-[220px] truncate rounded border border-[#3D8BD0] bg-white px-2.5 py-1.5 text-[12px] text-[#364658] opacity-90 shadow-[0_8px_20px_rgba(16,24,40,0.18)]"
              style={{ left: ghost.x + 12, top: ghost.y + 12 }}
            >
              {drag.kind === 'col'
                ? (cellAt(model.rows[0], drag.from)?.content || `Column ${drag.from + 1}`)
                : (model.rows[drag.from]?.cells[0]?.content || `Row ${drag.from + 1}`)}
            </span>
          )}

          {menu && (
            <HandleMenu
              items={menu.kind === 'row' ? rowMenu(menu.index) : menu.kind === 'cell' ? cellMenu() : colMenu(menu.index)}
              avoid={menu.avoid} axis={menu.axis}
              onClose={() => setMenu(null)}
            />
          )}

          {/* ── the selection's own handle ──
              ⚠️ This REPLACES the floating toolbar. That bar hovered above the selection and, on any
              cell in the top row, sat directly over the column rail — so the rail's handles could
              not be clicked at all while a cell was selected, which is how the drag came to look
              broken. It also duplicated the handle menus: two surfaces offering Colour, Alignment
              and Clear, which is the trap this builder keeps having to close.
              One round grip on the selection's right edge, and the same menu the rails use. */}
          {sel && !editing && selRect && (
            <button
              type="button"
              aria-label="Cell options"
              onClick={(e) => {
                e.stopPropagation();
                const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenu({
                  kind: 'cell', index: 0, axis: 'x',
                  avoid: { left: b.left, right: b.right, top: b.top, bottom: b.bottom },
                });
              }}
              style={{ left: selRect.left + RAIL + 4 + selRect.width - 4.5, top: selRect.top + RAIL + 4 + selRect.height / 2 - 4.5 }}
              className="absolute z-[60] size-[9px] rounded-full border-2 border-white bg-[#3D8BD0] shadow-[0_1px_2px_rgba(16,24,40,0.16)] transition-transform hover:scale-125"
            />
          )}
        </>
      )}
    </div>
  );
}

/* ── one cell ────────────────────────────────────────────────────────────── */

function TableCellView({
  tag, scope, cell, r, c, pad, bw, bc, face, enabled, editing, selected, defaultAlign, onDown, onKey, onCommit, onHover,
}: {
  tag: 'td' | 'th';
  scope?: 'row' | 'col';
  cell: { id: string; content: string; colspan: number; rowspan: number; bg?: string; textAlign?: CellAlign; verticalAlign?: VertAlign };
  r: number; c: number; pad: number; bw: number; bc: string; face: CSSProperties;
  enabled: boolean; editing: boolean; selected: boolean; defaultAlign?: CellAlign;
  onDown: (e: React.MouseEvent) => void;
  onKey: (e: React.KeyboardEvent) => void;
  onCommit: (v: string) => void;
  onHover: (r: number, c: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = tag as 'td';

  /* ⚠️ UNCONTROLLED, and mirrored only while unfocused. Writing the value back into a
     contentEditable on every keystroke resets the caret to the start — which is the reversed-typing
     bug this codebase has hit in the approval composer and again in the rich-text control.
     ⚠️ `tag` IS A DEPENDENCY, and it is not obvious why. Switching a cell between <td> and <th>
     keeps the same component instance — same key, same component type — so React does not remount
     it and this effect does not re-run; but the returned ELEMENT type changed, so React tears down
     the DOM subtree and builds a new one. `ref.current` then points at a brand-new empty div that
     nothing ever fills. Turning on "First column is a header" blanked every cell in that column,
     silently, with no error: the model still held the text and the DOM had thrown it away. */
  useEffect(() => {
    if (!editing && ref.current && ref.current.textContent !== cell.content) ref.current.textContent = cell.content;
  }, [cell.content, editing, tag]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges(); sel?.addRange(range);
    }
  }, [editing]);

  return (
    <Tag
      data-cell
      data-r={r}
      data-c={c}
      scope={scope ?? (tag === 'th' ? 'col' : undefined)}
      colSpan={cell.colspan > 1 ? cell.colspan : undefined}
      rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
      aria-selected={selected || undefined}
      onMouseEnter={() => onHover(r, c)}
      onMouseDown={onDown}
      style={{
        padding: pad,
        textAlign: cell.textAlign ?? defaultAlign ?? 'left',
        verticalAlign: cell.verticalAlign ?? 'middle',
        background: cell.bg,
        ...(bw > 0 ? { border: `${bw}px solid ${bc}` } : {}),
        wordBreak: 'break-word',
        ...face,
        /* ⚠️ AFTER `face`, or the panel's Header/Rows colour wins and the per-cell one is stored and
           never seen. The panel sets what the whole table looks like; a cell colour is the override
           you reached for on top of it, so it has to be the last word. `undefined` leaves `face`
           alone, which is what "Default text" means. */
        ...(cell.color ? { color: cell.color } : {}),
        /* ⚠️ A WASH, not a fill. This was #EBF5FF — the product's ID-pill blue, which is sized for a
           chip a few characters wide and becomes a solid blue block the moment it covers a whole
           table. Selection has to be legible, not loud: the thin ring above draws the boundary and
           this only has to tell you which side of it a cell is on. */
        ...(selected ? { background: cell.bg ?? 'var(--tt-table-selected-bg, #F4F8FD)' } : {}),
      }}
    >
      <div
        ref={ref}
        contentEditable={enabled && editing}
        suppressContentEditableWarning
        onKeyDown={onKey}
        onBlur={(e) => onCommit(e.currentTarget.textContent ?? '')}
        className="min-h-[1.2em] outline-none"
        style={{ cursor: enabled ? 'text' : undefined }}
      />
    </Tag>
  );
}
