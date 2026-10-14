import { useEffect, useRef, useState } from 'react';
import type { Ticket } from './TicketListPage';
import { slaToneOf } from './TicketTable';
import type { FilterRule } from './TicketFilterBar';

/* KPI strip above the ticket listing — the numbers a service-desk lead scans before
   touching a single row, ordered by urgency: workload → SLA risk → money at stake →
   things waiting on people → flow. Every countable value derives from the SAME ticket
   set the grid renders (and the grid's own SLA rule), so strip and table always agree.
   The row scrolls horizontally; on ultra-wide screens the cards stretch to fill. */

const isOpen = (t: Ticket) => t.status !== 'Closed' && t.status !== 'Completed' && t.status !== 'Cancelled';


/** A card's filter, minus the ids the bar assigns when it is applied. */
type CardFilter = Omit<FilterRule, 'id'>[];
const OPEN_STATES = ['Open', 'In Progress', 'Pending'];

/** True when the bar is currently showing exactly this card's filter. */
const isApplied = (rules: FilterRule[], label: string, card?: CardFilter) =>
  !!card &&
  rules.length === card.length &&
  card.every((c, i) =>
    rules[i].id.startsWith(`kpi-${label}-`) &&
    rules[i].field === c.field &&
    rules[i].condition === c.condition &&
    rules[i].values.length === c.values.length &&
    c.values.every((v) => rules[i].values.includes(v)),
  );

export function TicketStatsRow({
  tickets,
  rules,
  onApplyFilter,
  noun = 'request',
}: {
  tickets: Ticket[];
  rules: FilterRule[];
  onApplyFilter: (rules: FilterRule[]) => void;
  /** What one record is called — the Change listing renders this row as "changes". */
  noun?: string;
}) {
  const ns = `${noun}s`;
  /* Edge fades: a soft white gradient at whichever side still hides cards — the
     scroll hint that replaced the scrollbar. Recomputed on scroll and resize. */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeL, setFadeL] = useState(false);
  const [fadeR, setFadeR] = useState(false);
  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeL(el.scrollLeft > 2);
    setFadeR(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };
  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = tickets.filter(isOpen);
  const openOnly = tickets.filter((t) => t.status === 'Open');
  const closed = tickets.length - open.length;
  const breached = open.filter((t) => slaToneOf(t) === 'breached').length;
  const dueSoon = open.filter((t) => slaToneOf(t) === 'due').length;
  const pendingApproval = open.filter((t) => t.approval).length;
  const waitingRequester = open.filter((t) => t.status === 'Pending').length;
  const unreadRows = tickets.filter((t) => (t.unread ?? 0) > 0);
  const unreadTotal = unreadRows.reduce((n, t) => n + (t.unread ?? 0), 0);
  const taskRows = open.filter((t) => (t.tasksTotal ?? 0) - (t.tasksDone ?? 0) > 0);
  const openTasks = taskRows.reduce((n, t) => n + ((t.tasksTotal ?? 0) - (t.tasksDone ?? 0)), 0);
  const urgent = open.filter((t) => t.priority === 'Urgent').length;

  const label = 'text-[12px] text-[#64748B] whitespace-nowrap';
  const valueCls = 'mt-1 text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums';
  const subCls = 'text-[12px] text-[#94A3B8] whitespace-nowrap';

  /* Declarative cards keep the KPIs readable; every card is the SAME shape —
     label, headline value, supporting line — so no card reads differently. */
  const cards: {
    label: string;
    value: string | number;
    sub: React.ReactNode;
    filter?: CardFilter;
    hint?: string;
  }[] = [
    {
      label: `Open ${ns}`,
      value: openOnly.length,
      sub: `${open.length} unresolved · ${tickets.length} total`,
      filter: [{ field: 'status', condition: 'is', values: ['Open'] }],
      hint: `Show ${ns} with status Open`,
    },
    {
      /* The count IS the card, so the title names it; the denominator rides the
         supporting line like every other card (due-soon has its own tile). */
      label: 'SLA breached',
      value: breached,
      sub: `of ${open.length} unresolved`,
      filter: [{ field: 'sla', condition: 'is', values: ['Breached'] }],
      hint: `Show breached ${ns}`,
    },
    {
      label: 'Due today',
      value: dueSoon,
      sub: <span className="text-[#B45309]">resolution due &lt; 24h</span>,
      filter: [{ field: 'sla', condition: 'is', values: ['Due soon'] }],
      hint: `Show ${ns} due within 24 hours`,
    },
    {
      label: 'Urgent priority',
      value: urgent,
      sub: `of ${open.length} unresolved`,
      filter: [
        { field: 'priority', condition: 'is', values: ['Urgent'] },
        { field: 'status', condition: 'is', values: OPEN_STATES },
      ],
      hint: `Show unresolved urgent ${ns}`,
    },
    {
      label: 'Pending approval',
      value: pendingApproval,
      sub: 'awaiting approvers',
      filter: [{ field: 'approval', condition: 'is', values: ['Pending approval'] }],
      hint: `Show ${ns} awaiting an approver`,
    },
    {
      label: 'Waiting on requester',
      value: waitingRequester,
      sub: 'no reply yet',
      filter: [{ field: 'status', condition: 'is', values: ['Pending'] }],
      hint: `Show ${ns} waiting on the requester`,
    },
    {
      label: 'Unread updates',
      value: unreadTotal,
      sub: `across ${unreadRows.length} ${ns}`,
      filter: [{ field: 'unread', condition: 'is', values: ['Has unread'] }],
      hint: `Show ${ns} with unread replies`,
    },
    {
      label: 'Open tasks',
      value: openTasks,
      sub: `in ${taskRows.length} ${ns}`,
      filter: [
        { field: 'openTasks', condition: 'is', values: ['Has open tasks'] },
        { field: 'status', condition: 'is', values: OPEN_STATES },
      ],
      hint: `Show unresolved ${ns} with open tasks`,
    },
    // Flow: how much is leaving the queue and how fast (resolution avg from the detail page).
    {
      label: 'Resolved',
      value: closed,
      sub: 'avg 4d 11h to resolve',
      filter: [{ field: 'status', condition: 'is', values: ['Completed', 'Closed'] }],
      hint: `Show resolved and closed ${ns}`,
    },
  ];

  return (
    <div className="relative">
      <div ref={scrollRef} onScroll={updateFades} className="no-scrollbar-ever flex gap-3 overflow-x-auto pb-3 pl-6 pr-4">
      {cards.map((c) => {
        const on = isApplied(rules, c.label, c.filter);
        return (
        <div
          key={c.label}
          role={c.filter ? 'button' : undefined}
          tabIndex={c.filter ? 0 : undefined}
          title={c.filter ? (on ? 'Showing this view — click to clear' : c.hint) : undefined}
          onClick={() => c.filter && onApplyFilter(on ? [] : c.filter.map((r, i) => ({ ...r, id: `kpi-${c.label}-${i}` })))}
          onKeyDown={(e) => {
            if (c.filter && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onApplyFilter(on ? [] : c.filter.map((r, i) => ({ ...r, id: `kpi-${c.label}-${i}` })));
            }
          }}
          className={`flex flex-[1_0_196px] items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
            on
              ? 'border-[#3D8BD0] bg-[#F5FAFF] shadow-[0_1px_3px_rgba(61,139,208,0.15)]'
              : 'border-[#E5E7EB] bg-white'
          } ${c.filter ? 'cursor-pointer hover:border-[#C9D4E0] hover:shadow-sm' : ''}`}
        >
          <div>
            <div className={label}>{c.label}</div>
            <div className={valueCls}>{c.value}</div>
            <div className={subCls}>{c.sub}</div>
          </div>
        </div>
        );
      })}
      </div>
      {fadeL && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />
      )}
      {fadeR && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
      )}
    </div>
  );
}
