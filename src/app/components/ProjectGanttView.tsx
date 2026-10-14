import { cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Diamond, Layers, ListChecks, Search, X } from 'lucide-react';
import { dayFloor, fmtDay } from './TicketCalendarView';
import { useDrawerStack } from './DrawerStack';
import { planItemToTaskPatch } from './PlanDependencies';
import type { PlanItem } from './ProjectPlanningTab';

/* ── Project plan Gantt ──────────────────────────────────────────────────────
   The release-listing Gantt (TicketGanttView) cloned for the Planning tab, so
   every Gantt in the product shares one design and one behavior set:
   Week/Month/Quarter grains + the calendar period nav (opens on the busiest
   month), brush drag-to-zoom, Ctrl+wheel pinch zoom, double-click to widen,
   frozen 280px rail with the icon-expand search, sticky axis header, weekend
   wash + today rule, date labels above the bars, white hover cards.

   Project flavor: rows keep the PLAN HIERARCHY (phase → task → sub-task,
   indented in the rail) instead of a start-date sort; task bars wear the
   item's STATUS color with a solid progress fill inside; summaries are slim
   grey span bars; milestones are amber diamonds. Clicking a task opens the
   Task detail drawer (same adapter as the dependency map's ↗). */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_MS = 864e5;
const RAIL_W = 280;
const WD3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* Local palette copies — runtime imports back into ProjectPlanningTab would be
   a direct two-file cycle (it renders this component). */
const STATUS_DOT: Record<string, string> = { Open: '#3D8BD0', 'In Progress': '#6366F1', Pending: '#fb923c', Closed: '#22A06B' };
const PRIORITY_DOT: Record<string, string> = { Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Urgent: '#DC2626' };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type Grain = 'week' | 'month' | 'quarter';

type Row = {
  item: PlanItem;
  depth: number;
  /** Bar window in ms — end is EXCLUSIVE (plan dates are day-granular). */
  startMs: number;
  endMs: number;
  /** Inclusive end date, for labels. */
  endIncl: Date;
  progress: number;
  overdue: boolean;
};

/* The dependency-map hover card's content, on the Gantt's tooltip surface.
   A PHASE (summary) card stays lighter: layers icon, no id, no
   assignee/status/priority — just the window and its progress. */
function PlanTip({ row, children }: { row: Row; children: React.ReactElement }) {
  const it = row.item;
  const milestone = it.kind === 'milestone';
  const summary = it.kind === 'summary';
  /* Cursor-anchored: the card opens at the POINTER's spot (clamped to the
     viewport, flipping below near the top) — a center-anchored tooltip on a
     long bar can land far from the cursor or offscreen. Once shown it stays
     put so it reads calmly; body portal so no ancestor re-bases `fixed`. */
  const [tip, setTip] = useState<{ x: number; top: number; below: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);
  const posRef = useRef({ x: 0, top: 0, bottom: 0 });
  const show = () => {
    shownRef.current = true;
    const { x, top, bottom } = posRef.current;
    const below = top < 280;
    setTip({ x: Math.min(Math.max(x, 155), window.innerWidth - 155), top: below ? bottom : top, below });
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    shownRef.current = false;
    setTip(null);
  };
  const childProps = children.props as {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  };
  const trigger = cloneElement(children as React.ReactElement<any>, {
    onMouseEnter: (e: React.MouseEvent) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      posRef.current = { x: e.clientX, top: r.top, bottom: r.bottom };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(show, 300);
      childProps.onMouseEnter?.(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      // Track the pointer until the card opens, then hold still.
      if (!shownRef.current) posRef.current.x = e.clientX;
      childProps.onMouseMove?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      childProps.onMouseLeave?.(e);
    },
  });
  const card = tip && (
    <div
      className="pointer-events-none fixed z-[10001] w-[290px] rounded-lg border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
      style={{
        left: tip.x,
        top: tip.below ? tip.top + 10 : tip.top - 10,
        transform: tip.below ? 'translateX(-50%)' : 'translate(-50%, -100%)',
      }}
    >
      {/* Anchor arrow pointing at the hover spot */}
      <span
        className={`absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-white ${
          tip.below ? '-top-[5px] border-l border-t border-[#E5E7EB]' : '-bottom-[5px] border-b border-r border-[#E5E7EB]'
        }`}
      />
        <div className="w-[290px] p-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-7 flex-shrink-0 items-center justify-center rounded-md ${
                summary ? 'bg-[#F1F5F9]' : milestone ? 'bg-[#FEF3C7]' : 'bg-[#EAF2FB]'
              }`}
            >
              {summary ? (
                <Layers size={14} className="text-[#64748B]" />
              ) : milestone ? (
                <Diamond size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
              ) : (
                <ListChecks size={14} className="text-[#3D8BD0]" />
              )}
            </span>
            <div className="min-w-0">
              {!summary && <div className="text-[10px] font-medium text-[#64748B]">{it.id}</div>}
              <div className="truncate text-[12px] font-semibold leading-snug text-[#1E293B]">{it.name}</div>
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5 border-t border-[#F0F1F3] pt-2.5 text-[12px]">
            {!summary && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#7B8FA5]">Assignee</span>
                  <span className={`truncate font-medium ${it.assignee ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{it.assignee ?? 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#7B8FA5]">Status</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#364658]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[it.status] ?? '#94A3B8' }} />
                    {it.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#7B8FA5]">Priority</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#364658]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: PRIORITY_DOT[it.priority] ?? '#94A3B8' }} />
                    {it.priority}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#7B8FA5]">{milestone ? 'Date' : 'Start – End'}</span>
              <span className="font-medium text-[#364658]">
                {milestone ? fmtDay(it.start) : `${fmtDay(it.start)} – ${fmtDay(row.endIncl)}`}
              </span>
            </div>
            {!milestone && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7B8FA5]">Progress</span>
                <span className={`font-medium tabular-nums ${row.overdue ? 'text-[#DC2626]' : 'text-[#364658]'}`}>
                  {row.progress}%{row.overdue ? ' · Overdue' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
  return (
    <>
      {trigger}
      {card ? createPortal(card, document.body) : null}
    </>
  );
}

export function ProjectGanttView({ items }: { items: PlanItem[] }) {
  const today = new Date();
  const { open: openInStack } = useDrawerStack();
  const openTask = (it: PlanItem) => openInStack('tasks', it.id, it.name, planItemToTaskPatch(it));

  /* Plan-order rows: phases, their tasks, sub-tasks under each task, then any
     top-level items — the reading order the List view establishes. */
  const allRows = useMemo<Row[]>(() => {
    const kids = (id: string) => items.filter((x) => x.parentId === id);
    const mk = (it: PlanItem, depth: number): Row => {
      let start = it.start;
      let end = it.end;
      let progress = it.progress;
      if (it.kind === 'summary') {
        const sub = kids(it.id);
        if (sub.length) {
          start = new Date(Math.min(...sub.map((k) => k.start.getTime())));
          end = new Date(Math.max(...sub.map((k) => k.end.getTime())));
          progress = Math.round(sub.reduce((a, k) => a + k.progress, 0) / sub.length);
        }
      }
      const milestone = it.kind === 'milestone';
      const endIncl = milestone ? start : end;
      const overdue =
        !milestone && it.status !== 'Closed' && progress < 100 && dayFloor(endIncl).getTime() + DAY_MS < dayFloor(today).getTime();
      return {
        item: it,
        depth,
        startMs: dayFloor(start).getTime(),
        endMs: dayFloor(endIncl).getTime() + DAY_MS,
        endIncl,
        progress,
        overdue,
      };
    };
    const out: Row[] = [];
    const walk = (it: PlanItem, depth: number) => {
      out.push(mk(it, depth));
      kids(it.id).forEach((k) => walk(k, depth + 1));
    };
    items.filter((i) => i.kind === 'summary').forEach((s) => walk(s, 0));
    items.filter((i) => i.kind !== 'summary' && !i.parentId).forEach((k) => walk(k, 0));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* Open on the month with the most item starts — the calendar's rule. */
  const busiest = useMemo(() => {
    const counts = new Map<string, { d: Date; n: number }>();
    for (const it of items) {
      if (it.kind === 'summary') continue;
      const k = `${it.start.getFullYear()}-${it.start.getMonth()}`;
      const cur = counts.get(k);
      if (cur) cur.n += 1;
      else counts.set(k, { d: new Date(it.start.getFullYear(), it.start.getMonth(), 1), n: 1 });
    }
    let best: { d: Date; n: number } | null = null;
    counts.forEach((v) => {
      if (!best || v.n > best.n) best = v;
    });
    return best?.d ?? new Date();
  }, [items]);

  const [grain, setGrain] = useState<Grain>('month');
  const [cursor, setCursor] = useState<Date>(busiest);
  /* Collapsed phases — their child rows hide, the header keeps the span bar. */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [brush, setBrush] = useState<{ a: number; b: number } | null>(null);
  const [railSearchOpen, setRailSearchOpen] = useState(false);
  const [railSearch, setRailSearch] = useState('');
  const railSearchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didBrushRef = useRef(false);

  const range = useMemo(() => {
    if (customRange) return customRange;
    if (grain === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    if (grain === 'month') {
      return {
        start: new Date(cursor.getFullYear(), cursor.getMonth(), 1),
        end: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
      };
    }
    const q = Math.floor(cursor.getMonth() / 3) * 3;
    return { start: new Date(cursor.getFullYear(), q, 1), end: new Date(cursor.getFullYear(), q + 3, 0) };
  }, [cursor, grain, customRange]);

  const rangeStartMs = customRange ? range.start.getTime() : dayFloor(range.start).getTime();
  const spanMs = customRange
    ? Math.max(DAY_MS, range.end.getTime() - range.start.getTime())
    : (Math.round((dayFloor(range.end).getTime() - dayFloor(range.start).getTime()) / DAY_MS) + 1) * DAY_MS;
  const dayCount = Math.ceil((rangeStartMs + spanMs - dayFloor(range.start).getTime()) / DAY_MS);
  const dayPct = (DAY_MS / spanMs) * 100;
  const days = useMemo(
    () =>
      Array.from(
        { length: dayCount },
        (_, i) => new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate() + i),
      ),
    [range, dayCount],
  );
  const weeks = useMemo(() => days.filter((d) => d.getDay() === 0), [days]);
  const presGrain: Grain = customRange ? (dayCount <= 10 ? 'week' : dayCount <= 45 ? 'month' : 'quarter') : grain;
  const spanDays = spanMs / DAY_MS;
  const tlMin = Math.round(
    customRange
      ? spanDays * Math.max(18, Math.min(120, 2280 / spanDays))
      : dayCount * (presGrain === 'week' ? 120 : presGrain === 'month' ? 76 : 18),
  );

  /* Rows touching the period, in plan order; the rail search filters them
     (a matching child keeps its phase header for context), and a collapsed
     phase hides every row beneath it. */
  const rows = useMemo(() => {
    const q = railSearch.trim().toLowerCase();
    const hit = (r: Row) => !q || r.item.name.toLowerCase().includes(q) || r.item.id.toLowerCase().includes(q);
    const searched = !q
      ? allRows
      : allRows.filter(
          (r) =>
            hit(r) ||
            (r.item.kind === 'summary' && allRows.some((c) => c.item.parentId === r.item.id && hit(c))),
        );
    const hiddenByCollapse = (it: PlanItem) => {
      let p = it.parentId;
      while (p) {
        if (collapsed.has(p)) return true;
        p = items.find((x) => x.id === p)?.parentId ?? null;
      }
      return false;
    };
    return searched
      .filter((r) => !hiddenByCollapse(r.item))
      .filter((r) => r.startMs < rangeStartMs + spanMs && r.endMs > rangeStartMs);
  }, [allRows, railSearch, rangeStartMs, spanMs, collapsed, items]);
  const itemCount = rows.filter((r) => r.item.kind !== 'summary').length;

  const title = customRange
    ? `${fmtDay(days[0])} – ${fmtDay(days[days.length - 1])}, ${days[days.length - 1].getFullYear()}`
    : grain === 'week'
      ? days[0].getMonth() === days[6].getMonth()
        ? `${MONTHS[days[0].getMonth()]} ${days[0].getDate()} – ${days[6].getDate()}, ${days[0].getFullYear()}`
        : `${MONTHS[days[0].getMonth()]} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()]} ${days[6].getDate()}, ${days[6].getFullYear()}`
      : grain === 'month'
        ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
        : `Q${Math.floor(cursor.getMonth() / 3) + 1} ${cursor.getFullYear()} · ${MONTHS[Math.floor(cursor.getMonth() / 3) * 3].slice(0, 3)} – ${MONTHS[Math.floor(cursor.getMonth() / 3) * 3 + 2].slice(0, 3)}`;

  const step = (dir: 1 | -1) => {
    if (customRange) {
      setCustomRange({
        start: new Date(customRange.start.getTime() + dir * spanMs),
        end: new Date(customRange.end.getTime() + dir * spanMs),
      });
      return;
    }
    if (grain === 'week') {
      const d = new Date(cursor);
      d.setDate(d.getDate() + dir * 7);
      setCursor(d);
      return;
    }
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir * (grain === 'month' ? 1 : 3), 1));
  };

  /* Brush-to-zoom on the rows canvas (release-Gantt gesture, verbatim). */
  const tlFrac = (clientX: number) => {
    const el = bodyRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const w = r.width - RAIL_W;
    if (w <= 0) return null;
    return Math.max(0, Math.min(1, (clientX - r.left - RAIL_W) / w));
  };
  const onBrushDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = bodyRef.current;
    if (!el) return;
    if (e.clientX - el.getBoundingClientRect().left < RAIL_W) return;
    const a0 = tlFrac(e.clientX);
    if (a0 === null) return;
    const startClientX = e.clientX;
    let started = false;
    const move = (ev: MouseEvent) => {
      if (!started && Math.abs(ev.clientX - startClientX) < 5) return;
      started = true;
      ev.preventDefault();
      const b = tlFrac(ev.clientX);
      if (b !== null) setBrush({ a: a0, b });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      setBrush(null);
      if (!started) return;
      didBrushRef.current = true;
      const b = tlFrac(ev.clientX) ?? a0;
      const lo = Math.min(a0, b);
      const hi = Math.max(a0, b);
      const s0 = dayFloor(new Date(rangeStartMs + lo * spanMs));
      const e0 = dayFloor(new Date(rangeStartMs + Math.max(hi * spanMs - 1, lo * spanMs)));
      const eDay = e0.getTime() < s0.getTime() ? s0 : e0;
      setCustomRange({ start: s0, end: new Date(eDay.getTime() + DAY_MS - 1) });
      setCursor(new Date(s0));
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  useEffect(() => {
    if (railSearchOpen) railSearchRef.current?.focus();
  }, [railSearchOpen]);

  /* Ctrl+wheel pinch zoom around the cursor. */
  const pinchRef = useRef({ rangeStartMs, spanMs });
  pinchRef.current = { rangeStartMs, spanMs };
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const body = bodyRef.current;
      if (!body) return;
      const r = body.getBoundingClientRect();
      const w = r.width - RAIL_W;
      if (w <= 0) return;
      const f = Math.max(0, Math.min(1, (e.clientX - r.left - RAIL_W) / w));
      const { rangeStartMs: startMs, spanMs: span } = pinchRef.current;
      const scale = Math.exp(e.deltaY * 0.0045);
      const newSpan = Math.max(DAY_MS, Math.min(366 * DAY_MS, span * scale));
      if (Math.abs(newSpan - span) < 1) return;
      const anchor = startMs + f * span;
      const s0 = anchor - f * newSpan;
      setCustomRange({ start: new Date(s0), end: new Date(s0 + newSpan - 1) });
      setCursor(new Date(s0));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomOut = (e: React.MouseEvent) => {
    const el = bodyRef.current;
    if (!el || e.clientX - el.getBoundingClientRect().left < RAIL_W) return;
    const newSpan = Math.min(dayCount * 2, 366);
    const s0 = dayFloor(new Date(rangeStartMs + spanMs / 2 - (newSpan / 2) * DAY_MS));
    setCustomRange({ start: s0, end: new Date(s0.getTime() + newSpan * DAY_MS - 1) });
    setCursor(new Date(s0));
  };

  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - rangeStartMs) / spanMs) * 100));
  const pctRaw = (ms: number) => ((ms - rangeStartMs) / spanMs) * 100;
  const todayPct =
    dayFloor(today).getTime() >= rangeStartMs && dayFloor(today).getTime() <= dayFloor(range.end).getTime()
      ? ((dayFloor(today).getTime() + DAY_MS / 2 - rangeStartMs) / spanMs) * 100
      : null;

  const segBtn = (g: Grain, label: string) => (
    <button
      key={g}
      onClick={() => {
        setCustomRange(null);
        setGrain(g);
      }}
      className={`h-7 rounded px-3 text-[12px] font-medium transition-colors ${
        !customRange && grain === g ? 'bg-white text-[#3D8BD0] shadow-sm' : 'text-[#64748B] hover:text-[#364658]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Toolbar — period left, navigation and grain right; the calendar's recipe. */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-6 py-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-[#1E293B]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in this {customRange ? 'range' : grain}
            {customRange ? ' · pinch or double-click to zoom out' : ' · drag or pinch the timeline to zoom'}
          </div>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {customRange && (
            <button
              onClick={() => setCustomRange(null)}
              title="Back to the Week / Month / Quarter grains"
              className="inline-flex h-8 items-center gap-1 rounded border border-[#3D8BD0] bg-[#F5FAFF] px-2.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
            >
              <X size={13} />
              Reset zoom
            </button>
          )}
          <div className="flex items-center overflow-hidden rounded border border-[#DFE5ED]">
            <button
              onClick={() => step(-1)}
              className="inline-flex h-8 w-8 items-center justify-center border-r border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => step(1)}
              className="inline-flex h-8 w-8 items-center justify-center bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-[#DFE5ED] bg-[#F8FAFC] p-0.5">
            {segBtn('week', 'Week')}
            {segBtn('month', 'Month')}
            {segBtn('quarter', 'Quarter')}
          </div>
        </div>
      </div>

      {/* Horizontal-only scroller: the timeline pans under the frozen rail while
          the rows grow to natural height and ride the PAGE scroll. */}
      <div ref={scrollerRef} className="overflow-x-auto">
        <div className="relative" style={{ minWidth: RAIL_W + tlMin }}>
          {/* Axis header */}
          <div className="sticky top-0 z-30 flex border-b border-[#E5E7EB] bg-white">
            <div
              className="sticky left-0 z-10 flex flex-shrink-0 items-center justify-between gap-2 border-r border-[#E5E7EB] bg-white px-4"
              style={{ width: RAIL_W }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Plan</span>
              <button
                onClick={() => setRailSearchOpen(true)}
                title="Search the plan"
                className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F5F8] hover:text-[#3D8BD0]"
              >
                <Search size={14} />
              </button>
              {railSearchOpen && (
                <div className="absolute inset-0 z-10 flex items-center gap-2 border-r border-[#E5E7EB] bg-white pl-4 pr-3 shadow-[inset_0_-2px_0_#3D8BD0]">
                  <Search size={14} className="flex-shrink-0 text-[#3D8BD0]" />
                  <input
                    ref={railSearchRef}
                    value={railSearch}
                    onChange={(e) => setRailSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setRailSearch('');
                        setRailSearchOpen(false);
                      }
                    }}
                    onBlur={() => {
                      if (!railSearch.trim()) setRailSearchOpen(false);
                    }}
                    placeholder="Search the plan..."
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setRailSearch('');
                      setRailSearchOpen(false);
                    }}
                    className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F5F8] hover:text-[#364658]"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="relative h-[44px] min-w-0 flex-1">
              {presGrain !== 'quarter'
                ? days.map((d) => {
                    const isToday = sameDay(d, today);
                    const wknd = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <div
                        key={d.getTime()}
                        className="absolute inset-y-0 flex flex-col items-center justify-center gap-0.5"
                        style={{ left: `${pctRaw(dayFloor(d).getTime())}%`, width: `${dayPct}%` }}
                      >
                        <span className="text-[9px] font-semibold uppercase text-[#C3CDD9]">
                          {presGrain === 'week' ? WD3[d.getDay()] : 'SMTWTFS'[d.getDay()]}
                        </span>
                        <span
                          className={`inline-flex size-[18px] items-center justify-center rounded-full text-[11px] tabular-nums ${
                            isToday ? 'bg-[#3D8BD0] font-semibold text-white' : wknd ? 'text-[#B6C2D1]' : 'text-[#64748B]'
                          }`}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })
                : weeks.map((d) => (
                    <div
                      key={d.getTime()}
                      className="absolute inset-y-0 flex items-center pl-2 text-[11px] font-medium text-[#64748B]"
                      style={{ left: `${pctRaw(dayFloor(d).getTime())}%` }}
                    >
                      {fmtDay(d)}
                    </div>
                  ))}
            </div>
          </div>

          {/* Body — rows over one shared grid layer; also the brush-zoom canvas. */}
          <div
            ref={bodyRef}
            onMouseDown={onBrushDown}
            onDoubleClick={zoomOut}
            onClickCapture={(e) => {
              if (didBrushRef.current) {
                didBrushRef.current = false;
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={`relative cursor-crosshair ${brush ? 'select-none [&_*]:pointer-events-none' : ''}`}
          >
            <div className="pointer-events-none absolute inset-y-0 right-0" style={{ left: RAIL_W }}>
              {presGrain !== 'quarter' &&
                days
                  .filter((d) => d.getDay() === 0 || d.getDay() === 6)
                  .map((d) => (
                    <span
                      key={`w${d.getTime()}`}
                      className="absolute inset-y-0 bg-[#FAFBFC]"
                      style={{ left: `${pctRaw(dayFloor(d).getTime())}%`, width: `${dayPct}%` }}
                    />
                  ))}
              {(presGrain === 'quarter' ? weeks : days).map((d) => (
                <span
                  key={d.getTime()}
                  className="absolute inset-y-0 border-l border-[#F5F7FA]"
                  style={{ left: `${pctRaw(dayFloor(d).getTime())}%` }}
                />
              ))}
              {todayPct !== null && (
                <span className="absolute inset-y-0 w-px bg-[#3D8BD0]" style={{ left: `${todayPct}%` }} />
              )}
            </div>

            {rows.map((row) => {
              const it = row.item;
              const milestone = it.kind === 'milestone';
              const tone = row.overdue ? '#DC2626' : STATUS_DOT[it.status] ?? '#3D8BD0';
              const left = pct(row.startMs);
              const width = Math.max(pct(row.endMs) - left, 0.5);
              const contL = row.startMs < rangeStartMs;
              const contR = row.endMs > rangeStartMs + spanMs;
              const clickable = it.kind === 'task';
              /* Phase header — its own compact tinted row; the whole header
                 toggles collapse (the List-view accordion behavior). */
              if (it.kind === 'summary') {
                const isCollapsed = collapsed.has(it.id);
                const count = items.filter((x) => x.parentId === it.id).length;
                return (
                  <div
                    key={it.id}
                    className="group relative flex h-[44px] items-center border-b border-[#EDF1F5] bg-[#F8FAFC] transition-colors hover:bg-[#F3F5F8]"
                  >
                    <button
                      onClick={() => toggleCollapse(it.id)}
                      title={isCollapsed ? 'Expand phase' : 'Collapse phase'}
                      className="sticky left-0 z-20 flex h-full flex-shrink-0 items-center gap-2 border-r border-[#E5E7EB] bg-[#F8FAFC] px-3 text-left transition-colors group-hover:bg-[#F3F5F8]"
                      style={{ width: RAIL_W }}
                    >
                      <ChevronDown
                        size={14}
                        className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#1E293B]">{it.name}</span>
                      {row.overdue && <span className="size-1.5 flex-shrink-0 rounded-full bg-[#DC2626]" />}
                      <span className="flex-shrink-0 text-[10.5px] font-medium tabular-nums text-[#94A3B8]">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                      <span className="w-8 flex-shrink-0 text-right text-[10.5px] font-medium tabular-nums text-[#64748B]">
                        {Math.min(row.progress, 100)}%
                      </span>
                    </button>
                    <div className="relative h-full min-w-0 flex-1">
                      <PlanTip row={row}>
                        <span
                          onClick={() => toggleCollapse(it.id)}
                          className={`absolute top-1/2 h-[6px] -translate-y-1/2 cursor-pointer bg-[#64748B]/50 transition-colors hover:bg-[#64748B]/70 ${
                            contL ? '' : 'rounded-l-full'
                          } ${contR ? '' : 'rounded-r-full'}`}
                          style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                        />
                      </PlanTip>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={it.id}
                  className="group relative flex h-[76px] items-center border-b border-[#F5F7FA] transition-colors hover:bg-[#64748B]/[0.05]"
                >
                  <button
                    onClick={clickable ? () => openTask(it) : undefined}
                    className={`sticky left-0 z-20 flex h-full flex-shrink-0 flex-col justify-center border-r border-[#E5E7EB] bg-white px-4 text-left transition-colors group-hover:bg-[#F3F5F8] ${
                      clickable ? '' : 'cursor-default'
                    }`}
                    style={{ width: RAIL_W, paddingLeft: 16 + row.depth * 14 }}
                  >
                    <span className="flex w-full items-center gap-2">
                      {milestone ? (
                        <span className="block size-[9px] flex-shrink-0 rotate-45 rounded-[2px] bg-[#F59E0B]" />
                      ) : (
                        <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone }} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#364658]">{it.name}</span>
                    </span>
                    <span className="mt-1 flex w-full items-center gap-1.5 pl-[14px]">
                      <span className="flex-shrink-0 text-[10.5px] font-medium text-[#94A3B8]">{it.id}</span>
                      {row.overdue && (
                        <>
                          <span className="text-[10px] text-[#CBD5E1]">·</span>
                          <span className="truncate text-[10px] font-medium text-[#DC2626]">Overdue</span>
                        </>
                      )}
                      {!milestone && (
                        <span className="ml-auto flex-shrink-0 text-[10.5px] font-medium tabular-nums text-[#64748B]">
                          {Math.min(row.progress, 100)}%
                        </span>
                      )}
                    </span>
                    {!milestone && (
                      <span
                        className="mt-1.5 ml-[14px] block h-[4px] overflow-hidden rounded-full bg-[#EEF1F4]"
                        style={{ width: RAIL_W - 32 - 14 - row.depth * 14 }}
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.min(row.progress, 100)}%`, backgroundColor: tone }}
                        />
                      </span>
                    )}
                  </button>
                  <div className="relative h-full min-w-0 flex-1">
                    {milestone ? (
                      <PlanTip row={row}>
                        <span
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-default"
                          style={{ left: `${pct(row.startMs + DAY_MS / 2)}%` }}
                        >
                          <span className="block size-[13px] rotate-45 rounded-[2px] bg-[#F59E0B] ring-2 ring-white shadow-[0_1px_2px_rgba(16,24,40,0.15)]" />
                        </span>
                      </PlanTip>
                    ) : (
                      <div
                        className="absolute top-1/2 h-[22px] -translate-y-1/2"
                        style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                      >
                        <PlanTip row={row}>
                          <button
                            onClick={() => openTask(it)}
                            style={{ backgroundColor: `${tone}40` }}
                            className={`absolute inset-0 block overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[filter] hover:brightness-95 ${
                              contL ? '' : 'rounded-l'
                            } ${contR ? '' : 'rounded-r'}`}
                          >
                            {/* Solid progress fill — the project Gantt's core read. */}
                            <span
                              className="absolute inset-y-0 left-0 block"
                              style={{ width: `${Math.min(row.progress, 100)}%`, backgroundColor: tone }}
                            />
                          </button>
                        </PlanTip>
                      </div>
                    )}
                    {/* Date label above the bar — the release recipe. */}
                    <span
                      className="pointer-events-none absolute z-[1] flex items-center gap-1.5 whitespace-nowrap text-[10.5px] font-medium text-[#64748B]"
                      style={{
                        left: milestone ? `calc(${pct(row.startMs + DAY_MS / 2)}% + 10px)` : `${left}%`,
                        top: milestone ? 'calc(50% - 8px)' : 'calc(50% - 29px)',
                      }}
                    >
                      {!milestone && <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone }} />}
                      <span className="tabular-nums">
                        {milestone || sameDay(it.start, row.endIncl)
                          ? fmtDay(it.start)
                          : `${fmtDay(it.start)} – ${fmtDay(row.endIncl)}`}
                      </span>
                      {contR && <span className="text-[10px]">→ {fmtDay(row.endIncl)}</span>}
                    </span>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="px-6 py-16 text-center text-[13px] text-[#94A3B8]">
                {railSearch.trim()
                  ? `No plan items match "${railSearch.trim()}"`
                  : `Nothing scheduled in this ${customRange ? 'range' : grain}.`}
              </div>
            )}
            {brush && (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-30" style={{ left: RAIL_W }}>
                <div
                  className="absolute inset-y-0 border-x-2 border-[#3D8BD0]/60 bg-[#3D8BD0]/10"
                  style={{
                    left: `${Math.min(brush.a, brush.b) * 100}%`,
                    width: `${Math.abs(brush.b - brush.a) * 100}%`,
                  }}
                >
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md">
                    {fmtDay(new Date(rangeStartMs + Math.min(brush.a, brush.b) * spanMs))} –{' '}
                    {fmtDay(new Date(rangeStartMs + Math.max(brush.a, brush.b) * spanMs))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
