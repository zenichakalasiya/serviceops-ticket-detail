import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronsLeftRight, ChevronsRightLeft, Flag, GripVertical, Maximize2, MessageSquare, ListChecks, Pin, PinOff, UserCheck, X } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { extraValue, slaInfoOf, SlaPill } from './TicketTable';
import { describeSubject, descriptionImageAfter, fullDescriptionFor } from './requestDescriptions';
import { DescriptionInlineImage } from './DescriptionInlineImage';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* Kanban view of the same requests the grid shows. Columns come from the chosen group
   field; a card can be dragged to another column to change that field, which is the whole
   point of a board — triage by moving, not by opening each record. */

const fmtShortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/* Blocks the card draws in their own designed slot rather than as a label/value row. */
export const KANBAN_BUILTINS = new Set(['id', 'reference', 'subject', 'description', 'sla', 'signals', 'status', 'priority', 'assignedTo']);

export const KANBAN_FIELDS: { key: string; label: string }[] = [
  { key: 'id', label: 'ID' },
  /* Only modules whose rows carry one (Tasks) ever draw it — the card skips it otherwise. */
  { key: 'reference', label: 'Reference' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'sla', label: 'SLA status' },
  { key: 'signals', label: 'Activity signals' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'requester', label: 'Requester' },
  { key: 'createdBy', label: 'Created date' },
  { key: 'dueByDate', label: 'Due by' },
  { key: 'techGroup', label: 'Technician group' },
  { key: 'department', label: 'Department' },
  { key: 'source', label: 'Source' },
  { key: 'location', label: 'Location' },
  { key: 'tags', label: 'Tags' },
  { key: 'impact', label: 'Impact' },
  { key: 'urgency', label: 'Urgency' },
  { key: 'supportLevel', label: 'Support level' },
  { key: 'requestAge', label: 'Request age' },
  { key: 'approvalStatus', label: 'Approval status' },
];

/** The base selection — everything a card can show, including the field the board
    happens to be grouped by right now. Order is the card order.
    Description is deliberately NOT here: two lines of body text per card is the single
    biggest thing standing between a board and a scannable one, and the subject already
    says what the request is. It stays available in Card fields for anyone who wants it. */
export const DEFAULT_CARD_FIELDS = ['id', 'sla', 'subject', 'signals', 'assignedTo', 'status', 'priority'];

/** Fields worth offering for a board grouped this way — the axis is never offered. */
export const kanbanFieldsFor = (group: string) => KANBAN_FIELDS.filter((f) => f.key !== group);

/** What the card actually renders: the base minus whatever the column heading says. */
export const cardFieldsFor = (fields: string[], group: string) => fields.filter((k) => k !== group);

export const cardFieldValue = (t: Ticket, key: string): string => {
  switch (key) {
    case 'requester':
      return t.requester || '---';
    case 'status':
      return t.status;
    case 'priority':
      return t.priority;
    case 'assignedTo':
      return t.assignedTo.name || 'Unassigned';
    case 'createdBy':
      return fmtShortDate(t.createdBy);
    default:
      return extraValue(key, t);
  }
};

export type KanbanGroup = 'status' | 'priority' | 'assignedTo' | 'requester' | 'sla';

export const KANBAN_GROUPS: { key: KanbanGroup; label: string }[] = [
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'sla', label: 'SLA Status' },
];

/** Per-group column order the user dragged into place. */
const COL_ORDER_KEY = 'kanbanColumnOrder';
/** Per-group columns pinned to the left — the board's frozen columns. */
const COL_PIN_KEY = 'kanbanPinnedColumns';

/* Every status the product uses across modules, in lifecycle order. A board only shows the
   values its own data holds, so a request board is unchanged by the task-only states. */
const STATUS_ORDER = ['Open', 'In Progress', 'Pending', 'Rejected', 'Resolved', 'Completed', 'Closed', 'Cancelled'];
const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'];
const SLA_ORDER = ['Breached', 'Due soon', 'On track', 'Met'];

const DOT: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#3D8BD0',
  Pending: '#fb923c',
  Rejected: '#ef4444',
  Resolved: '#22c55e',
  Completed: '#22c55e',
  Closed: '#6b7280',
  Cancelled: '#ef4444',
  Low: '#22c55e',
  Medium: '#fb923c',
  High: '#ef4444',
  Urgent: '#dc2626',
  Breached: '#ef4444',
  'Due soon': '#f59e0b',
  'On track': '#22c55e',
  Met: '#94a3b8',
};

const slaLabelOf = (t: Ticket) => {
  const tone = slaInfoOf(t).tone;
  return tone === 'breached' ? 'Breached' : tone === 'due' ? 'Due soon' : tone === 'done' ? 'Met' : 'On track';
};

const PEOPLE_GROUP = (g: KanbanGroup) => g === 'assignedTo' || g === 'requester';

/** Tinted value chip — one shape for status and priority so slots stay interchangeable. */
/** Wraps any card element with the standard tooltip. */
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function ValueChip({ label, color, big, tip }: { label: string; color: string; big?: boolean; tip?: string }) {
  const chip = (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1 font-medium ${big ? 'rounded px-2 py-0.5 text-[12px]' : 'rounded-sm px-1.5 py-0.5 text-[11px]'}`}
      style={{ background: `${color}1A`, color }}
    >
      <span className={big ? 'size-2 rounded-full' : 'size-1.5 rounded-full'} style={{ background: color }} />
      {label}
    </span>
  );
  return tip ? <Tip text={tip}>{chip}</Tip> : chip;
}
const AVATAR_BG = (g: KanbanGroup) => (g === 'requester' ? '#E67E22' : '#3D8BD0');

const groupValue = (t: Ticket, g: KanbanGroup) =>
  g === 'assignedTo' ? t.assignedTo.name : g === 'sla' ? slaLabelOf(t) : (t[g] as string);

const initialsOf = (name: string) => {
  const p = name.split(' ').filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
};


const DROPPABLE = (g: KanbanGroup) => g === 'status' || g === 'priority' || g === 'assignedTo';
const fieldPatch = (g: KanbanGroup, value: string): Partial<Ticket> =>
  g === 'assignedTo' ? { assignedTo: { name: value, initials: initialsOf(value) } } : ({ [g]: value } as Partial<Ticket>);

function CardFieldValue({ t, k }: { t: Ticket; k: string }) {
  const v = cardFieldValue(t, k);
  if (v === '---' || v === '') return <span className="text-[#B6C2D1]">---</span>;

  if (k === 'tags') {
    const tags = v.split(', ').filter(Boolean);
    const shown = tags.slice(0, 2);
    const extra = tags.length - shown.length;
    return (
      <span className="flex min-w-0 items-center gap-1">
        {shown.map((tag) => (
          <span key={tag} className="max-w-[86px] truncate rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#475569]">
            {tag}
          </span>
        ))}
        {extra > 0 && (
          <Tip text={tags.join(', ')}>
            <span className="flex-shrink-0 rounded bg-[#F1F5F9] px-1 py-0.5 text-[10px] font-semibold text-[#475569]">+{extra}</span>
          </Tip>
        )}
      </span>
    );
  }

  // Anything on the priority/status scale carries its dot, as it does in the grid.
  if (k === 'urgency' || k === 'status' || k === 'priority') {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[v] ?? '#94A3B8' }} />
        <span className="truncate">{v}</span>
      </span>
    );
  }

  if (k === 'requester') {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="flex size-4 flex-shrink-0 items-center justify-center rounded bg-[#E67E22] text-[8px] font-semibold text-white">
          {initialsOf(v)}
        </span>
        <span className="truncate">{v}</span>
      </span>
    );
  }

  return <span className="truncate">{v}</span>;
}

/* Description + its expand control. The control OVERLAYS the last line on card hover so it
   costs the board no height — but it is an icon-only button on a solid white chip, not blue
   words fading out of the sentence. That was the readability problem: the old link merged
   into the text it sat on. A bordered chip reads as a control sitting on top of the text,
   covers ~2 words instead of a third of the line, and carries a tooltip in place of a label.
   It only renders when the text is genuinely cut off, measured rather than guessed, because
   the clamp depends on whatever width the user has dragged the column to. */
function CardDescription({ text, onExpand }: { text: string; onExpand: () => void }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setClamped(el.scrollHeight - el.clientHeight > 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className="relative mt-1.5">
      <p ref={ref} className="line-clamp-2 text-[12px] leading-[1.5] text-[#64748B]">
        {text}
      </p>
      {clamped && (
        <span className="pointer-events-none absolute -bottom-0.5 right-0 hidden items-end bg-gradient-to-l from-white from-65% to-transparent pl-8 group-hover/card:flex">
          <Tip text="Read the full description">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="pointer-events-auto flex size-6 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] shadow-sm transition-colors hover:border-[#9EC5E8] hover:bg-[#EBF5FF] hover:text-[#3D8BD0]"
            >
              <Maximize2 size={12} />
            </button>
          </Tip>
        </span>
      )}
    </div>
  );
}

export function TicketKanban({
  tickets,
  group,
  subGroup = null,
  cardFields = DEFAULT_CARD_FIELDS,
  onLanesChange,
  onTicketClick,
  onOpenReference,
  onUpdateTicket,
  noun = 'request',
}: {
  tickets: Ticket[];
  group: KanbanGroup;
  /** Optional second axis: each value becomes a horizontal swimlane of columns. */
  subGroup?: KanbanGroup | null;
  /** Extra fields shown on every card, in the order they were added. */
  cardFields?: string[];
  /** Reports the lane list so the page footer can offer "Jump to group". */
  onLanesChange?: (info: { label: string; total: number; groups: number; list: { key: string; count: number }[] } | null) => void;
  onTicketClick: (t: Ticket) => void;
  /** Opens the record a card's Reference points at. Without it the pill is not drawn. */
  onOpenReference?: (t: Ticket) => void;
  onUpdateTicket?: (id: string, patch: Partial<Ticket>) => void;
  /** What one record is called — the Change listing renders this board as "changes". */
  noun?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  /* Column order is per GROUP — the sequence you want for Status says nothing about the one
     you want for Priority — and it outlives the session, because re-dragging five columns
     back into place on every visit is worse than not being able to drag them at all. */
  const [colOrder, setColOrder] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(COL_ORDER_KEY) ?? '{}');
    } catch {
      return {};
    }
  });
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<{ col: string; after: boolean } | null>(null);
  /* Frozen columns, per group and persisted like the order — pinning "Open" for the
     status board shouldn't freeze anything on the priority board. */
  const [pinnedMap, setPinnedMap] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(COL_PIN_KEY) ?? '{}');
    } catch {
      return {};
    }
  });
  const togglePin = (col: string) =>
    setPinnedMap((m) => {
      const cur = m[group] ?? [];
      const next = cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col];
      const map = { ...m, [group]: next };
      try {
        localStorage.setItem(COL_PIN_KEY, JSON.stringify(map));
      } catch {
        /* private mode — pins just won't survive the session */
      }
      return map;
    });
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const [laneBodyMax, setLaneBodyMax] = useState(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!subGroup || !el) return;
    // Viewport height minus the lane heading, the column header and the panel padding.
    const measure = () => setLaneBodyMax(Math.max(240, el.clientHeight - 100));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [subGroup]);
  const toggleCol = (col: string) =>
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  const toggleLane = (lane: string) =>
    setCollapsedLanes((prev) => {
      const next = new Set(prev);
      if (next.has(lane)) next.delete(lane);
      else next.add(lane);
      return next;
    });
  // Full-description popup (opened from the hover expand on a card).
  const [descTicket, setDescTicket] = useState<Ticket | null>(null);
  useEffect(() => {
    if (!descTicket) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDescTicket(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [descTicket]);

  // Value set for an axis: a fixed lifecycle order where one exists, else what is present.
  const valuesFor = (g: KanbanGroup) => {
    const present = Array.from(new Set(tickets.map((t) => groupValue(t, g))));
    const order =
      g === 'status' ? STATUS_ORDER : g === 'priority' ? PRIORITY_ORDER : g === 'sla' ? SLA_ORDER : null;
    return order ? order.filter((v) => present.includes(v)) : present.sort((a, b) => a.localeCompare(b));
  };
  /* Saved order first (minus anything no longer present), then any value the data has that
     the saved order has never seen — a new status must appear, not vanish. */
  const columns = (() => {
    const vals = valuesFor(group);
    const saved = colOrder[group];
    if (!saved?.length) return vals;
    const known = saved.filter((v) => vals.includes(v));
    return [...known, ...vals.filter((v) => !known.includes(v))];
  })();

  /* Pinned columns surface first, in the order they were pinned — like the listing's
     frozen columns, freezing IS a statement about position. */
  const pinned = (pinnedMap[group] ?? []).filter((c) => columns.includes(c));
  const displayCols = [...pinned, ...columns.filter((c) => !pinned.includes(c))];
  /* Sticky offset for pinned column N = the real widths of the pinned columns before it
     (a collapsed rail is 44px, a full column 388px) plus the 4px gaps. */
  const pinOffset = (col: string) => {
    let x = 0;
    for (const c of pinned) {
      if (c === col) break;
      x += (collapsedCols.has(c) ? 44 : 388) + 4;
    }
    return x;
  };

  const moveColumn = (from: string, to: string, after: boolean) => {
    if (from === to) return;
    const next = displayCols.filter((c) => c !== from);
    // Dropping onto the frozen block lands the column right after it, never inside.
    const at = Math.max(next.indexOf(to), pinned.filter((c) => c !== from).length);
    if (next.indexOf(to) < 0) return;
    next.splice(after ? at + 1 : at, 0, from);
    const map = { ...colOrder, [group]: next };
    setColOrder(map);
    try {
      localStorage.setItem(COL_ORDER_KEY, JSON.stringify(map));
    } catch {
      /* private mode — the order just won't survive the session */
    }
  };
  const lanes = subGroup ? valuesFor(subGroup) : [];

  const laneCount = (lane: string) => tickets.filter((t) => groupValue(t, subGroup as KanbanGroup) === lane).length;
  const laneSig = subGroup ? lanes.map((l) => `${l}:${laneCount(l)}`).join('|') : '';
  useEffect(() => {
    if (!onLanesChange) return;
    if (!subGroup) {
      onLanesChange(null);
      return;
    }
    onLanesChange({
      label: KANBAN_GROUPS.find((g) => g.key === subGroup)?.label ?? '',
      total: tickets.length,
      groups: lanes.length,
      list: lanes.map((l) => ({ key: l, count: laneCount(l) })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subGroup, laneSig, tickets.length, onLanesChange]);

  /* The footer bar dispatches a lane key: open it if folded, scroll it under the
     toolbar, and flash the heading so the eye lands on the right one. */
  const [flashLane, setFlashLane] = useState<string | null>(null);
  useEffect(() => {
    const onJump = (e: Event) => {
      const key = String((e as CustomEvent).detail ?? '');
      setCollapsedLanes((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      window.requestAnimationFrame(() => {
        const el = rootRef.current?.querySelector(`[data-lane-block="${CSS.escape(key)}"]`) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      setFlashLane(key);
      window.setTimeout(() => setFlashLane((cur) => (cur === key ? null : cur)), 1800);
    };
    window.addEventListener('jump-to-group', onJump as EventListener);
    return () => window.removeEventListener('jump-to-group', onJump as EventListener);
  }, []);

  // Only fields the card actually owns can be set by dropping.
  const canDrop = DROPPABLE(group);

  /* A drop sets the column value — and in swimlane mode the lane value too, so moving
     a card across both axes at once does what it looks like it does. */
  const drop = (col: string, laneKey: string | null) => {
    setOverCol(null);
    if (!dragId || !canDrop || !onUpdateTicket) return;
    const t = tickets.find((x) => x.id === dragId);
    setDragId(null);
    if (!t) return;
    const patch: Partial<Ticket> = {};
    if (groupValue(t, group) !== col) Object.assign(patch, fieldPatch(group, col));
    if (laneKey && subGroup && DROPPABLE(subGroup) && groupValue(t, subGroup) !== laneKey)
      Object.assign(patch, fieldPatch(subGroup, laneKey));
    if (Object.keys(patch).length) onUpdateTicket(t.id, patch);
  };

  /* One column — a full-height scrolling lane on the plain board, or an auto-height
     section inside a swimlane row. */
  const renderColumn = (col: string, laneKey: string | null, laneCards: Ticket[], scroll: boolean) => {
        const cards = laneCards.filter((t) => groupValue(t, group) === col);
        const dropKey = `${laneKey ?? ''}|${col}`;
        const isOver = overCol === dropKey && canDrop;
        const collapsed = collapsedCols.has(col);
        const pinIdx = pinned.indexOf(col);
        const isPinned = pinIdx >= 0;
        const lastPinned = isPinned && pinIdx === pinned.length - 1;
        return (
          <div
            key={col}
            onDragOver={(e) => {
              /* A column drag and a card drag land on the same element — whichever is in
                 flight wins, so a column being moved never also looks like a card drop. */
              if (dragCol) {
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                setDropCol({ col, after: e.clientX > r.left + r.width / 2 });
                return;
              }
              if (!canDrop) return;
              e.preventDefault();
              setOverCol(dropKey);
            }}
            onDragLeave={() => {
              if (dragCol) return setDropCol((d) => (d?.col === col ? null : d));
              setOverCol((c) => (c === dropKey ? null : c));
            }}
            onDrop={() => {
              if (dragCol) {
                if (dropCol) moveColumn(dragCol, dropCol.col, dropCol.after);
                setDragCol(null);
                setDropCol(null);
                return;
              }
              drop(col, laneKey);
            }}
            className={`group/col flex flex-shrink-0 flex-col ${
              isPinned ? 'sticky z-30 bg-[#F7F9FB]' : 'relative'
            } ${collapsed ? 'w-11' : 'w-[388px]'} ${scroll ? 'h-full min-h-0' : ''} ${
              dragCol === col ? 'opacity-40' : ''
            }`}
            style={
              isPinned
                ? {
                    left: pinOffset(col),
                    boxShadow: lastPinned && !collapsed ? '10px 0 14px -10px rgba(16,24,40,0.16)' : undefined,
                  }
                : undefined
            }
          >
            {isPinned && (
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-0 right-full bg-[#F7F9FB] ${pinned[0] === col ? 'w-10' : 'w-1'}`}
              />
            )}
            {/* Full-height insertion line, on the side the pointer is closest to, so "move it
                to the end" is a real drop and not a guess. */}
            {dragCol && dragCol !== col && dropCol?.col === col && (
              <span
                className={`pointer-events-none absolute inset-y-0 z-20 w-0.5 rounded-full bg-[#3D8BD0] ${
                  dropCol.after ? '-right-1' : '-left-1'
                }`}
              />
            )}
            {collapsed ? (
              /* Folded: a slim rail that still names the column and its size — click to reopen. */
              <Tip text={`Show ${col}`}>
                <button
                  onClick={() => toggleCol(col)}
                  style={{ boxShadow: lastPinned ? '10px 0 14px -10px rgba(16,24,40,0.16)' : undefined }}
                  className={`mt-4 flex ${
                    scroll ? 'min-h-0 flex-1' : 'min-h-[140px] flex-1'
                  } flex-col items-center gap-2.5 rounded-lg border border-[#EEF1F4] bg-white py-3 transition-colors hover:border-[#DFE5ED] hover:bg-[#FBFCFD] ${
                    isOver ? '!border-[#3D8BD0] !bg-[#EBF5FF]' : ''
                  }`}
                >
                  <span
                    className="size-2 flex-shrink-0 rounded-full"
                    style={{ background: DOT[col] ?? '#94A3B8' }}
                  />
                  <span className="max-h-[220px] truncate text-[12px] font-semibold text-[#364658] [writing-mode:vertical-rl]">
                    {col}
                  </span>
                  <span className="text-[12px] font-medium tabular-nums text-[#94A3B8]">{cards.length}</span>
                  <ChevronsLeftRight size={14} className="mt-auto flex-shrink-0 text-[#94A3B8]" />
                </button>
              </Tip>
            ) : (
              <>
            {/* Column header — the value, its count, a drag handle and a hover control to
                fold it away. Only the HEADER is draggable: making the whole column a handle
                would fight the card drag that lives inside it. */}
            <div
              draggable={!isPinned}
              onDragStart={(e) => {
                if (isPinned) return;
                setDragCol(col);
                e.dataTransfer.effectAllowed = 'move';
                /* The browser's default ghost is a screenshot of the whole 388px column. A
                   small labelled chip is legible and says exactly what is moving. */
                const ghost = document.createElement('div');
                ghost.textContent = col;
                ghost.style.cssText =
                  'position:fixed;top:-1000px;left:-1000px;padding:6px 12px;border-radius:6px;' +
                  'background:#fff;border:1px solid #DFE5ED;border-left:3px solid #3D8BD0;' +
                  'font:600 12px system-ui;color:#364658;box-shadow:0 4px 12px rgba(16,24,40,.12)';
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 12, 16);
                setTimeout(() => ghost.remove(), 0);
              }}
              onDragEnd={() => {
                setDragCol(null);
                setDropCol(null);
              }}
              className="flex flex-shrink-0 cursor-grab items-center gap-2 px-4 pb-2 pt-4 active:cursor-grabbing">
              {PEOPLE_GROUP(group) ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                    style={{ background: AVATAR_BG(group) }}
                  >
                    {initialsOf(col)}
                  </span>
                  <span className="max-w-[240px] truncate text-[12px] font-semibold text-[#364658]">{col}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[col] ?? '#94A3B8' }} />
                  <span className="max-w-[240px] truncate">{col}</span>
                </span>
              )}
              <span className="text-[12px] font-medium tabular-nums text-[#94A3B8]">{cards.length}</span>
              {/* Column controls live together in the right corner — pin, hide, drag — the
                  same hover-revealed size-6 slot each, in flow after ml-auto so appearing
                  never shifts the title. The pin STAYS visible once set: a frozen column
                  should say so at a glance, and the lit pin is also the way back out. */}
              <Tip text={isPinned ? 'Unpin column' : 'Pin column to the left'}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(col);
                  }}
                  className={`ml-auto flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors ${
                    isPinned
                      ? 'text-[#3D8BD0] hover:bg-[#E9EEF4]'
                      : 'invisible text-[#94A3B8] hover:bg-[#E9EEF4] hover:text-[#364658] group-hover/col:visible'
                  }`}
                >
                  {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                </button>
              </Tip>
              <Tip text={`Hide ${col}`}>
                <button
                  onClick={() => toggleCol(col)}
                  className="invisible flex size-6 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#E9EEF4] hover:text-[#364658] group-hover/col:visible"
                >
                  <ChevronsRightLeft size={13} />
                </button>
              </Tip>
              {!isPinned && (
              <Tip text="Drag to reorder">
                <span className="invisible flex size-6 flex-shrink-0 cursor-grab items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#E9EEF4] hover:text-[#364658] active:cursor-grabbing group-hover/col:visible">
                  <GripVertical size={13} />
                </span>
              </Tip>
              )}
            </div>

            <div
              className={`space-y-2.5 overflow-y-auto rounded-lg border-2 border-dashed px-2 py-2 transition-colors ${
                scroll ? 'min-h-0 flex-1' : ''
              } ${isOver ? 'border-[#3D8BD0] bg-[#EBF5FF]/60' : 'border-transparent'}`}
              style={scroll ? undefined : { maxHeight: laneBodyMax || undefined }}
            >
              {cards.map((t) => {
                const done = t.tasksDone ?? 0;
                const total = t.tasksTotal ?? 0;
                const fields = cardFieldsFor(cardFields, group);
                const show = (k: string) => fields.includes(k);
                const extras = fields.filter((k) => !KANBAN_BUILTINS.has(k));
                /* The ranked attributes all sit together under the title, in whatever order
                   Card fields puts them in — SLA beside priority reads as one judgement about
                   the request, where SLA-up-top and priority-down-bottom read as two. */
                const metaKeys = fields.filter((k) => k === 'sla' || k === 'status' || k === 'priority');
                /* Who owns it belongs in the corner, not in the same row as what it is. */
                const showAvatar = show('assignedTo');
                const chipFor = (k: string) =>
                  k === 'status'
                    ? { value: t.status, tip: `Status: ${t.status}` }
                    : { value: t.priority, tip: `Priority: ${t.priority}` };
                const hasSignals = show('signals') && ((t.unread ?? 0) > 0 || !!t.approval || total > 0);
                return (
                  <div
                    key={t.id}
                    draggable={canDrop}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onTicketClick(t)}
                    /* One soft shadow at rest, not two stacked — on a dense board the doubled
                       shadow read as weight around every card. The lift stays on hover. */
                    className={`group/card cursor-pointer rounded-[6px] border border-[#EEF1F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all hover:border-[#DFE5ED] hover:shadow-[0_2px_4px_rgba(16,24,40,0.06),0_6px_16px_rgba(16,24,40,0.10)] ${
                      dragId === t.id ? 'opacity-40' : ''
                    }`}
                  >
                    {(show('id') || showAvatar || (show('reference') && (t as any).x_reference)) && (
                      <div className="flex items-center gap-2">
                        {show('id') && (
                          /* Plain text, not a filled pill: every card carries an id, so tinting
                             each one is pure repetition — an id is a reference you read, not a
                             value worth highlighting. It raises NO hover preview either: the
                             card already shows what the preview would, and a popup over a
                             board you are dragging cards around is in the way. */
                          <span className="text-[11px] font-medium text-[#94A3B8]">{t.id}</span>
                        )}
                        {show('reference') && onOpenReference && (t as any).x_reference && (
                          /* The grid's reference pill, card-sized: the id a task hangs off,
                             its parent's NAME on hover, and a click that opens that record
                             rather than this card. */
                          <Tip text={(t as any).x_referenceSubject || (t as any).x_reference}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenReference(t); }}
                              className="max-w-[150px] flex-shrink-0 truncate rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                            >
                              {(t as any).x_reference}
                            </button>
                          </Tip>
                        )}
                        {showAvatar && (
                          <Tip text={t.assignedTo.name === 'Unassigned' ? 'Unassigned' : `Assigned to ${t.assignedTo.name}`}>
                            {t.assignedTo.name === 'Unassigned' ? (
                              /* The grid's ownerless mark — dashed circle, not an empty blue box. */
                              <span className="ml-auto size-5 flex-shrink-0 rounded-full border-2 border-dashed border-[#9CA3AF]" />
                            ) : (
                              <span className="ml-auto flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                                {t.assignedTo.initials}
                              </span>
                            )}
                          </Tip>
                        )}
                      </div>
                    )}

                    {show('subject') && (
                      <div className={`mt-1.5 line-clamp-2 text-[13px] text-[#364658] ${(t.unread ?? 0) > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {t.subject}
                      </div>
                    )}

                    {/* Same themed description the quick peek shows — two quiet lines. */}
                    {show('description') && (
                      <CardDescription text={describeSubject(t.subject).short} onExpand={() => setDescTicket(t)} />
                    )}

                    {/* ONE quiet meta line closes the card. It used to be two — a chip rail and
                        a bordered footer — which put something in all four corners and made a
                        three-field card read as five stacked blocks. Alerts sit left (they are
                        the reason to look), identity sits right. */}
                    {/* One row under the title carrying everything ranked about the request:
                        SLA next to priority, then the activity signals. Read left to right it
                        goes when it is due → how bad it is → what has happened since. */}
                    {(metaKeys.length > 0 || hasSignals) && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        {metaKeys.map((k) =>
                          k === 'sla' ? (
                            <SlaPill key={k} ticket={t} className="h-[22px]" compact />
                          ) : (
                            /* Dot + label, not a second filled pill: the SLA chip beside it is
                               the one thing on the card that is genuinely time-critical, and two
                               tinted pills side by side would flatten that difference. */
                            <Tip key={k} text={chipFor(k).tip}>
                              <span className="inline-flex h-[22px] min-w-0 items-center gap-1.5 rounded border border-[#EEF1F4] bg-white px-2">
                                <span
                                  className="size-1.5 flex-shrink-0 rounded-full"
                                  style={{ background: DOT[chipFor(k).value] ?? '#94A3B8' }}
                                />
                                <span className="truncate text-[11px] font-medium text-[#64748B]">{chipFor(k).value}</span>
                              </span>
                            </Tip>
                          ),
                        )}

                        {hasSignals && (t.unread ?? 0) > 0 && (
                          <Tip text={`${t.unread} unread ${t.unread === 1 ? 'reply' : 'replies'}${t.lastMsg ? ` from ${t.lastMsg.from}` : ''}`}>
                            <span className="inline-flex h-[22px] items-center gap-1 rounded bg-[#EBF5FF] px-2 text-[11px] font-medium text-[#3D8BD0]">
                              <MessageSquare size={11} />
                              {t.unread} new
                            </span>
                          </Tip>
                        )}
                        {hasSignals && t.approval && (
                          <Tip
                            text={`Waiting on ${t.approval.approver} · Level ${t.approval.level} of ${t.approval.totalLevels} · ${t.approval.waiting}`}
                          >
                            <span className="inline-flex h-[22px] items-center gap-1 rounded bg-[#FEF3C7] px-2 text-[11px] font-medium text-[#B45309]">
                              <UserCheck size={11} />
                              Approval
                            </span>
                          </Tip>
                        )}
                        {/* Task progress is a fact, not an alert — no fill, so the chips that DO
                            need attention stay the loudest things on the line. */}
                        {hasSignals && total > 0 && (
                          <Tip text={`${done} of ${total} tasks completed`}>
                            <span
                              className={`inline-flex h-[22px] items-center gap-1 rounded border border-[#EEF1F4] bg-white px-2 text-[11px] font-medium ${
                                done === total ? 'text-[#15803D]' : 'text-[#94A3B8]'
                              }`}
                            >
                              <ListChecks size={11} />
                              {done}/{total}
                            </span>
                          </Tip>
                        )}
                      </div>
                    )}

                    {/* Fields added in "Card fields" append BELOW the default card rather
                        than splitting it — the hairline marks where the card the product
                        designed ends and the columns this user asked for begin. */}
                    {extras.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-[#F1F5F9] pt-2.5">
                        {extras.map((k) => (
                          <div key={k} className="flex items-baseline gap-2 text-[11px]">
                            <span className="w-[104px] flex-shrink-0 truncate text-[#94A3B8]">
                              {KANBAN_FIELDS.find((x) => x.key === k)?.label ?? k}
                            </span>
                            <span className="flex min-w-0 flex-1 items-center font-medium text-[#364658]">
                              <CardFieldValue t={t} k={k} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#DFE5ED] bg-white/50 py-7 text-center text-[12px] text-[#94A3B8]">
                  {canDrop ? `Drop a ${noun} here` : `No ${noun}s`}
                </div>
              )}
            </div>
              </>
            )}
          </div>
        );
  };

  /* Lane heading — the sub-group value in the same language its column header uses. */
  const laneLabel = (lane: string) =>
    subGroup && PEOPLE_GROUP(subGroup) ? (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
          style={{ background: AVATAR_BG(subGroup) }}
        >
          {initialsOf(lane)}
        </span>
        <span className="max-w-[260px] truncate text-[12px] font-semibold text-[#364658]">{lane}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">
        <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[lane] ?? '#94A3B8' }} />
        <span className="max-w-[260px] truncate">{lane}</span>
      </span>
    );

  return (
    <div
      ref={rootRef}
      className={`min-h-0 flex-1 ${
        subGroup ? 'pb-4 overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden pl-6 pr-4'
      }`}
    >
      <div
        className={`${
          subGroup ? 'w-full space-y-7 pb-2' : 'flex h-full w-max min-w-full gap-1 rounded-lg bg-[#F7F9FB] px-4 pb-4'
        }`}
      >
      {subGroup
        ? lanes.map((lane) => {
            const laneCards = tickets.filter((t) => groupValue(t, subGroup) === lane);
            const collapsed = collapsedLanes.has(lane);
            return (
              <div key={lane} data-lane-block={lane} className="scroll-mt-1">
                {/* Lane header — click anywhere on it to fold the lane away. */}
                <div className="sticky top-0 z-30 bg-white pb-1.5 pl-6 pt-0.5">
                <button
                  onClick={() => toggleLane(lane)}
                  className={`flex items-center gap-2 rounded px-1 py-1.5 text-left transition-colors ${
                    flashLane === lane ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'
                  }`}
                >
                  <ChevronDown
                    size={14}
                    className={`flex-shrink-0 text-[#94A3B8] transition-transform ${collapsed ? '-rotate-90' : ''}`}
                  />
                  {laneLabel(lane)}
                  <span className="rounded-sm bg-[#E9EEF4] px-1.5 text-[11px] font-semibold tabular-nums text-[#64748B]">
                    {laneCards.length}
                  </span>
                </button>
                </div>
                {!collapsed && (
                  <div className="overflow-x-auto pl-6 pr-4">
                    <div className="flex w-max min-w-full gap-1 rounded-lg bg-[#F7F9FB] px-4 pb-4">
                      {displayCols.map((col) => renderColumn(col, lane, laneCards, false))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        : displayCols.map((col) => renderColumn(col, null, tickets, true))}
      {descTicket &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDescTicket(null);
            }}
          >
            <div className="w-[560px] max-w-full overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-2xl">
              <div className="border-b border-[#F0F2F5] px-5 pb-3 pt-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{descTicket.id}</span>
                  <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#1E293B]">{descTicket.subject}</h3>
                  <button
                    onClick={() => setDescTicket(null)}
                    className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
                  >
                    <X size={16} className="text-[#64748B]" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Tip text={`Status: ${descTicket.status}`}>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#364658]">
                      <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[descTicket.status] ?? '#94A3B8' }} />
                      {descTicket.status}
                    </span>
                  </Tip>
                  <span className="h-3 w-px flex-shrink-0 bg-[#E5E7EB]" />
                  <Tip text={`Assignee: ${descTicket.assignedTo.name || 'Unassigned'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#364658]">
                      <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                        {descTicket.assignedTo.initials || 'UA'}
                      </span>
                      <span className="truncate">{descTicket.assignedTo.name || 'Unassigned'}</span>
                    </span>
                  </Tip>
                  <span className="h-3 w-px flex-shrink-0 bg-[#E5E7EB]" />
                  <Tip text={`Priority: ${descTicket.priority}`}>
                    <span className="inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#364658]">
                      <Flag size={12} fill="currentColor" style={{ color: DOT[descTicket.priority] }} />
                      {descTicket.priority}
                    </span>
                  </Tip>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Description</div>
                <div className="space-y-3">
                  {fullDescriptionFor(descTicket.id, descTicket.subject).map((p, i) => (
                    <Fragment key={i}>
                      <p className="text-[13px] leading-relaxed text-[#364658]">{p}</p>
                      {i === descriptionImageAfter(descTicket.id) && <DescriptionInlineImage />}
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#F0F2F5] px-5 py-3">
                <button
                  onClick={() => setDescTicket(null)}
                  className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onTicketClick(descTicket);
                    setDescTicket(null);
                  }}
                  className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
                >
                  Open request
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
