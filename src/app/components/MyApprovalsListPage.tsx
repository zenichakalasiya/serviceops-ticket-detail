/* ── My Approvals listing ────────────────────────────────────────────────────
   Everything waiting on the signed-in approver, across modules — the shared
   listing chrome (data-grid, KPI strip, views rail, filters, multi-sort,
   grouping, pagination) over the approvals pool.

   Two module-specific things: the grid's `approval` column set ends in an
   ACTIONS cell (approve / reject / refer back, plus open-the-record), and a row
   opens the REFERENCED record's own detail page — the module varies per row, so
   each approval carries its own `module`.

   The product's status tabs (Pending / Approved / Rejected / Ignored / Referred
   Back) live as saved views + clickable KPI cards rather than a second tab row,
   so this page behaves exactly like every other listing. */
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ChevronUp, CircleCheck, CircleX, Clock, EyeOff, CornerUpLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable, useOpenFromUrl } from './TicketTable';
import { StatsCardsRow, type StatCard } from './AssetStatsRow';
import { TicketGridToolbar } from './TicketGridToolbar';
import { APPROVAL_VIEWS, type TicketView } from './TicketViewsPanel';
import { APPROVAL_FILTER_ATTRS, applyFilters, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, type KanbanGroup } from './TicketKanban';
import { Pagination } from './Pagination';
import { useDrawerStack, type StackModule } from './DrawerStack';
import type { Ticket } from './TicketListPage';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Ignored' | 'Referred Back';

export interface ApprovalRow {
  /** Approval record id — unique per row, since one record can need several. */
  id: string;
  /** The record awaiting a decision. */
  recordId: string;
  recordSubject: string;
  /** Which module's detail page the record opens in. */
  module: StackModule;
  /** What kind of record it is, as the product labels it. */
  type: string;
  requestedBy: string;
  /** The approval's own subject line. */
  subject: string;
  /** The APPROVAL's state — what you decide. */
  status: ApprovalStatus;
  /** The RECORD's own status — a different fact entirely (a change can be In
     Progress while its approval is still Pending). */
  recordStatus: string;
  created: Date;
}

/* Realistic desk traffic: change windows, access requests, asset verifications,
   purchase orders and a release sign-off — the things that actually queue up on
   an approver. Dates run back from "today" so Created Date reads naturally. */
const d = (daysAgo: number, h: number, m: number) => {
  const x = new Date();
  x.setDate(x.getDate() - daysAgo);
  x.setHours(h, m, 0, 0);
  return x;
};

export const mockApprovals: ApprovalRow[] = [
  { id: 'APR-4021', recordId: 'CHG-2091', recordSubject: 'Core switch firmware upgrade — DC1', module: 'change', type: 'Change', requestedBy: 'Imran Qureshi', subject: 'Approval required for CHG-2091 — maintenance window', status: 'Pending', recordStatus: 'In Progress', created: d(0, 10, 35) },
  { id: 'APR-4022', recordId: 'PBM-625', recordSubject: 'Network connectivity dropping intermittently', module: 'problem', type: 'Problem', requestedBy: 'Ashini Sharma', subject: 'Approval required for PBM-625 — permanent fix plan', status: 'Pending', recordStatus: 'Open', created: d(0, 9, 48) },
  { id: 'APR-4020', recordId: 'REQ-00812735', recordSubject: 'Employee Onboarding', module: 'request', type: 'Service Request', requestedBy: 'Rakesh Rathod', subject: 'Approval required for REQ-00812735 — new joiner access', status: 'Pending', recordStatus: 'Open', created: d(0, 9, 12) },
  { id: 'APR-4019', recordId: 'PO-2606-132', recordSubject: 'Datacenter SSD Storage Expansion', module: 'purchases', type: 'Purchase Order', requestedBy: 'Vikram Sethi', subject: 'Approval required for PO-2606-132 — ₹18.4 L', status: 'Pending', recordStatus: 'Open', created: d(1, 16, 40) },
  { id: 'APR-4018', recordId: 'INC-35', recordSubject: 'Request for Apple MacBook Pro Allocation', module: 'request', type: 'Service Request', requestedBy: 'Kavit Gohel', subject: 'Approval required for INC-35 — hardware allocation', status: 'Pending', recordStatus: 'Open', created: d(1, 14, 5) },
  { id: 'APR-4017', recordId: 'AST-003', recordSubject: 'Dell PowerEdge R750 — Virtualization Host', module: 'hardware-assets', type: 'Hardware Asset', requestedBy: 'Sarah Johnson', subject: 'Asset self-verification', status: 'Pending', recordStatus: 'In Progress', created: d(2, 11, 49) },
  { id: 'APR-4016', recordId: 'REL-56', recordSubject: 'ServiceOps platform patch upgrade to v8.7.4.22', module: 'release', type: 'Release', requestedBy: 'Rohan Mehta', subject: 'Approval required for REL-56 — go-live sign-off', status: 'Pending', recordStatus: 'In Progress', created: d(2, 9, 20) },
  { id: 'APR-4015', recordId: 'CON-104', recordSubject: 'Core Switch AMC', module: 'contracts', type: 'Contract', requestedBy: 'Farah Sheikh', subject: 'Approval required for CON-104 — renewal', status: 'Pending', recordStatus: 'Open', created: d(3, 15, 30) },
  { id: 'APR-4014', recordId: 'REQ-00812740', recordSubject: 'Request access to Salesforce CRM', module: 'request', type: 'Service Request', requestedBy: 'Jainam Shah', subject: 'Approval required for REQ-00812740 — licence cost', status: 'Pending', recordStatus: 'Pending', created: d(4, 12, 18) },
  { id: 'APR-4013', recordId: 'CHG-976', recordSubject: 'Firewall rule change for the DMZ', module: 'change', type: 'Change', requestedBy: 'Neha Raje', subject: 'Approval required for CHG-976 — security review', status: 'Approved', recordStatus: 'Completed', created: d(5, 10, 2) },
  { id: 'APR-4012', recordId: 'PO-2604-126', recordSubject: 'Annual Antivirus License Renewal', module: 'purchases', type: 'Purchase Order', requestedBy: 'Tabrez Khan', subject: 'Approval required for PO-2604-126 — ₹6.2 L', status: 'Approved', recordStatus: 'Closed', created: d(6, 17, 44) },
  { id: 'APR-4011', recordId: 'AST-009', recordSubject: 'Dell PowerEdge R650 — Database Server', module: 'hardware-assets', type: 'Hardware Asset', requestedBy: 'Vikram Sethi', subject: 'Asset self-verification', status: 'Approved', recordStatus: 'Completed', created: d(7, 11, 11) },
  { id: 'APR-4010', recordId: 'INC-32', recordSubject: 'My Internet Down', module: 'request', type: 'Request', requestedBy: 'Darshak Modi', subject: 'Approval required for INC-32 — vendor callout', status: 'Rejected', recordStatus: 'Closed', created: d(8, 13, 26) },
  { id: 'APR-4009', recordId: 'PO-2603-122', recordSubject: 'Replacement Laptop Batch', module: 'purchases', type: 'Purchase Order', requestedBy: 'Priya Nair', subject: 'Approval required for PO-2603-122 — over budget', status: 'Rejected', recordStatus: 'Cancelled', created: d(9, 9, 58) },
  { id: 'APR-4008', recordId: 'CHG-2088', recordSubject: 'Patch the Exchange servers to the April rollup', module: 'change', type: 'Change', requestedBy: 'Siddharth Rao', subject: 'Approval required for CHG-2088 — window clash', status: 'Referred Back', recordStatus: 'Pending', created: d(10, 15, 3) },
  { id: 'APR-4007', recordId: 'REQ-00812718', recordSubject: 'Request for an additional monitor', module: 'request', type: 'Service Request', requestedBy: 'Hetal Mori', subject: 'Approval required for REQ-00812718 — justification needed', status: 'Referred Back', recordStatus: 'Pending', created: d(12, 10, 41) },
  { id: 'APR-4006', recordId: 'SWAST-26911', recordSubject: 'AnyDesk', module: 'software-assets', type: 'Software Asset', requestedBy: 'Meera Iyer', subject: 'Approval required — unapproved remote-access tool', status: 'Ignored', recordStatus: 'Open', created: d(15, 14, 22) },
  { id: 'APR-4005', recordId: 'CON-77', recordSubject: 'ServiceOps Support', module: 'contracts', type: 'Contract', requestedBy: 'Ananya Iyer', subject: 'Approval required for CON-77 — auto-renewal', status: 'Ignored', recordStatus: 'Open', created: d(18, 16, 9) },
  { id: 'APR-4004', recordId: 'REL-63', recordSubject: 'Customer portal redesign rollout — wave 2', module: 'release', type: 'Release', requestedBy: 'Karan Malhotra', subject: 'Approval required for REL-63 — pilot cohort', status: 'Approved', recordStatus: 'Completed', created: d(21, 11, 37) },
];

/* Rows on the Ticket shape the shared chrome renders, with the original approval
   kept aside so a click can open the right module's detail page. */
const APPROVALS: { rows: Ticket[]; byId: Map<string, ApprovalRow> } = (() => {
  const byId = new Map<string, ApprovalRow>();
  const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const rows = mockApprovals.map((a) => {
    byId.set(a.id, a);
    return {
      /* Just the record id — it reads as a clean pill like every other listing;
         the record's own name is one click away and the Subject column already
         says what the approval is about. */
      id: a.recordId,
      subject: a.subject,
      requester: a.requestedBy,
      dueBy: a.created,
      createdBy: a.created,
      assignedTo: { name: a.requestedBy, initials: initials(a.requestedBy) },
      /* Status column = the RECORD's status. The approval's own state is a
         separate field, and it is what the views, KPI cards and row actions read. */
      status: a.recordStatus as Ticket['status'],
      priority: 'Medium',
      x_approvalState: a.status,
      x_type: a.type,
      /* The approval's own id rides along so actions and the drawer can find the
         original record behind the row. */
      x_approvalId: a.id,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip carries the product's status tabs — each card filters the grid,
   so the counts and the switching are the same gesture. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const n = (s: string) => tickets.filter((t) => (t as any).x_approvalState === s).length;
  const pending = n('Pending');
  /* No "total" card — an approver's queue is about what each outcome bucket holds,
     and the pagination footer already says how many rows are in view. */
  return [
    {
      label: 'Pending',
      value: pending,
      sub: 'waiting on your decision',
      hint: 'Show approvals waiting on you',
      valueColor: pending > 0 ? '#B45309' : '#15803D',
    },
    { label: 'Approved', value: n('Approved'), sub: 'decided in favour', hint: 'Show approved' },
    { label: 'Rejected', value: n('Rejected'), sub: 'turned down', hint: 'Show rejected' },
    { label: 'Referred back', value: n('Referred Back'), sub: 'sent back for detail', hint: 'Show referred back' },
    { label: 'Ignored', value: n('Ignored'), sub: 'left undecided', hint: 'Show ignored' },
  ];
};

/** KPI card label → the approval state it selects. */
const CARD_STATE: [string, string][] = [
  ['Pending', 'Pending'],
  ['Approved', 'Approved'],
  ['Rejected', 'Rejected'],
  ['Referred back', 'Referred Back'],
  ['Ignored', 'Ignored'],
];

export function MyApprovalsListPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(APPROVALS.rows);
  const updateTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ label: string; groups: number; total: number; list?: { key: string; count: number }[] } | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');
  const [clearGroupTick, setClearGroupTick] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sorts, setSorts] = useState<{ column: keyof Ticket; dir: 'asc' | 'desc' }[]>([]);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  /* The approval state is the page's TAB, not a filter chip: it lands on Pending,
     the KPI cards and the views rail switch it, and the filter bar stays empty for
     the user's own filters. */
  const [state, setState] = useState<string | null>('Pending');
  const [view, setView] = useState<'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar'>('list-kpi');
  const [dashScope, setDashScope] = useState<'all' | 'mine'>('all');
  const [kanbanGroup, setKanbanGroup] = useState<KanbanGroup>('status');
  const [kanbanSubGroup, setKanbanSubGroup] = useState<KanbanGroup | null>(null);
  const [cardFields, setCardFields] = useState<string[]>(DEFAULT_CARD_FIELDS);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(0);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const measure = () => setStickyH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sortColumn = sorts[0]?.column ?? null;
  const sortDirection = sorts[0]?.dir ?? 'asc';
  /* Tracks which status cut is showing — it names a saved view, not the page. */
  const [activeView, setActiveView] = useState('Pending Approvals');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  /* A row IS an approval, but the thing you need to read is the record behind it —
     so a click opens that record's detail page. It routes through the `approval`
     module (`ApprovalDrawer`), NOT the record's own module, so the approver's
     detail experience can diverge without touching the Request / Change /
     Release / Asset pages. */
  const openRecord = (ticket: Ticket) => {
    const a = APPROVALS.byId.get((ticket as any).x_approvalId);
    if (!a) return;
    openInStack('approval', a.recordId, a.recordSubject, a);
  };
  useOpenFromUrl(tickets, openRecord);

  const decide = (ticket: Ticket, action: 'view' | 'asset-update' | 'approve' | 'reject' | 'refer') => {
    if (action === 'view') return openRecord(ticket);
    const a = APPROVALS.byId.get((ticket as any).x_approvalId);
    /* Opens the asset-update form in the product — left as a stub here, but it must
       never fall through to a decision. */
    if (action === 'asset-update') return void toast(`Asset update for ${a?.recordId ?? ticket.id} — coming soon`);
    const next = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Referred Back';
    updateTicket(ticket.id, { x_approvalState: next } as Partial<Ticket>);
    toast.success(`${a?.recordId ?? ticket.id} ${next === 'Referred Back' ? 'referred back' : next.toLowerCase()}`);
  };

  /* A decision taken from the detail page's header lands back here, so the row, the
     KPI tabs and the grid's own action cell all tell the same story. */
  useEffect(() => {
    const onDecided = (e: Event) => {
      const d = (e as CustomEvent).detail as { recordId?: string; next?: string } | undefined;
      if (!d?.recordId || !d.next) return;
      updateTicket(d.recordId, { x_approvalState: d.next } as Partial<Ticket>);
    };
    window.addEventListener('approval-decision', onDecided as EventListener);
    return () => window.removeEventListener('approval-decision', onDecided as EventListener);
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t) => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };
  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const next = new Set(selectedTickets);
    if (checked) next.add(ticketId);
    else next.delete(ticketId);
    setSelectedTickets(next);
  };
  const handleSort = (column: keyof Ticket, dir?: 'asc' | 'desc') => {
    setCurrentPage(1);
    setSorts((prev) => {
      const i = prev.findIndex((s) => s.column === column);
      if (dir) {
        if (i < 0) return [...prev, { column, dir }];
        const next = [...prev];
        next[i] = { column, dir };
        return next;
      }
      if (i < 0) return [...prev, { column, dir: 'asc' }];
      if (prev[i].dir === 'asc') {
        const next = [...prev];
        next[i] = { column, dir: 'desc' };
        return next;
      }
      return prev.filter((s) => s.column !== column);
    });
  };

  let filteredTickets = state ? tickets.filter((t) => (t as any).x_approvalState === state) : tickets;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTickets = tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q) ||
        String((t as any).x_approvalState ?? '').toLowerCase().includes(q) ||
        String((t as any).x_type ?? '').toLowerCase().includes(q),
    );
  }
  filteredTickets = applyFilters(filteredTickets, filterRules);

  const sortedTickets = [...filteredTickets];
  if (sorts.length) {
    sortedTickets.sort((a, b) => {
      for (const { column, dir } of sorts) {
        let aVal: any = a[column];
        let bVal: any = b[column];
        if (column === 'assignedTo') {
          aVal = (a.assignedTo as any).name;
          bVal = (b.assignedTo as any).name;
        }
        let cmp = 0;
        if (aVal instanceof Date && bVal instanceof Date) cmp = aVal.getTime() - bVal.getTime();
        else if (typeof aVal === 'string' && typeof bVal === 'string') cmp = aVal.localeCompare(bVal);
        else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageTickets = paginatedTickets.map((t) => t.id);
  const allCurrentPageSelected = currentPageTickets.every((id) => selectedTickets.has(id)) && currentPageTickets.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="my-approvals" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Toolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              /* The page keeps ONE name — the status tabs narrow the list, they do
                 not rename the page. (The rail still tracks the selected view.) */
              activeView="My Approvals"
            />
            <main className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 bg-white min-h-0 overflow-auto [scrollbar-gutter:stable]" style={{ ['--tb' as any]: `${stickyH}px` }}>
                <div className="sticky left-0 bg-white pt-0.5">
                  {view === 'list-kpi' && (
                    <StatsCardsRow
                      cards={buildCards(tickets)}
                      rules={filterRules}
                      onApplyFilter={setFilterRules}
                      activeLabel={CARD_STATE.find(([, st]) => st === state)?.[0] ?? null}
                      onCardClick={(c) => {
                        /* A tab, not a toggle: clicking the lit card keeps the list
                           where it is rather than dropping back to everything. */
                        const next = CARD_STATE.find(([label]) => label === c.label)?.[1];
                        if (!next || next === state) return;
                        setState(next);
                        setActiveView(APPROVAL_VIEWS.find((v) => v.rules[0]?.values[0] === next)?.name ?? 'All Approvals');
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
                <div ref={stickyRef} className="sticky left-0 top-0 z-[45] bg-white pt-0.5">
                  <TicketGridToolbar
                    noun="approval"
                    viewsStore="approval"
                    layouts={['list', 'list-kpi']}
                    searchQuery={searchQuery}
                    setSearchQuery={(v) => {
                      setSearchQuery(v);
                      setCurrentPage(1);
                    }}
                    rules={filterRules}
                    setRules={(r) => {
                      setFilterRules(r);
                      setCurrentPage(1);
                    }}
                    sorts={sorts}
                    onSort={handleSort}
                    onClearSorts={() => setSorts([])}
                    activeView={activeView}
                    onViewSaved={(v: TicketView) => setActiveView(v.name)}
                    onRemoveSort={(column) => setSorts((prev) => prev.filter((s) => s.column !== column))}
                    onReorderSorts={(order) => setSorts((prev) => order.map((c) => prev.find((s) => s.column === c)!).filter(Boolean))}
                    listGroupLabel={isGrouped ? groupInfo?.label ?? null : null}
                    view={view}
                    setView={setView}
                    kanbanGroup={kanbanGroup}
                    setKanbanGroup={setKanbanGroup}
                    kanbanSubGroup={kanbanSubGroup}
                    setKanbanSubGroup={setKanbanSubGroup}
                    cardFields={cardFields}
                    setCardFields={setCardFields}
                    dashScope={dashScope}
                    setDashScope={setDashScope}
                    dashScopeSwitch={false}
                    /* An approval has no assignee, SLA or priority of its own. */
                    showQuickFilters={false}
                    filterAttrs={APPROVAL_FILTER_ATTRS}
                    /* Export + Refresh only — see the prop's note on why an approver
                       gets no layout, sort, auto-refresh or import controls. */
                    minimalTools
                  />
                </div>
                <TicketTable
                  noun="approval"
                  moduleCols="approval"
                  openPage="my-approvals"
                  /* An approver decides — they don't edit the record from here, and
                     the column set is the module's, not theirs to restructure. */
                  lockedCells={['requester', 'status', 'x_approvalState']}
                  allowColumnEdit={false}
                  tickets={paginatedTickets}
                  selectedTickets={selectedTickets}
                  allSelected={allCurrentPageSelected}
                  onSelectAll={handleSelectAll}
                  onSelectTicket={handleSelectTicket}
                  onSort={handleSort}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  sorts={sorts}
                  onTicketClick={openRecord}
                  onRowAction={decide}
                  onUpdateTicket={updateTicket}
                  allTickets={sortedTickets}
                  onGroupedChange={(g, info) => {
                    setIsGrouped(g);
                    setGroupInfo(g ? info ?? null : null);
                  }}
                  clearGroupingSignal={clearGroupTick}
                  emptyFiltered={searchQuery.trim() !== '' || filterRules.length > 0 || !!state}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setFilterRules([]);
                    setState('Pending');
                    setActiveView('Pending Approvals');
                    setCurrentPage(1);
                  }}
                />
              </div>
              {!isGrouped && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={sortedTickets.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                />
              )}
              {isGrouped && groupInfo && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-6 py-2.5">
                  <span className="text-[12px] text-[#64748B] tabular-nums">
                    Showing <span className="font-medium text-[#364658]">{groupInfo.total}</span> approvals in{' '}
                    <span className="font-medium text-[#364658]">{groupInfo.groups}</span> groups
                  </span>
                  <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
                    {(groupInfo.list?.length ?? 0) > 1 && (
                      <span className="relative mr-1">
                        <button
                          onClick={() => {
                            setJumpOpen((v) => !v);
                            setJumpQuery('');
                          }}
                          className="inline-flex h-7 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5FAFF]"
                        >
                          Jump to group
                          <ChevronUp size={13} className={`text-[#9CA3AF] transition-transform ${jumpOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {jumpOpen && (
                          <div className="app-menu absolute bottom-full right-0 z-50 mb-1.5 w-[280px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl">
                            <div className="p-2">
                              <input
                                autoFocus
                                value={jumpQuery}
                                onChange={(e) => setJumpQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setJumpOpen(false);
                                }}
                                onBlur={() => setJumpOpen(false)}
                                placeholder={'Search ' + (groupInfo.label ?? '').toLowerCase() + '...'}
                                className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto pb-1">
                              {(() => {
                                const q = jumpQuery.trim().toLowerCase();
                                const rowsL = (groupInfo.list ?? []).filter((g) => !q || g.key.toLowerCase().includes(q));
                                if (!rowsL.length) return <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching groups</div>;
                                return rowsL.map((g) => (
                                  <button
                                    key={g.key}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      window.dispatchEvent(new CustomEvent('jump-to-group', { detail: g.key }));
                                      setJumpOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{g.key}</span>
                                    <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#64748B]">{g.count}</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </span>
                    )}
                    Grouped by <span className="font-medium text-[#364658]">{groupInfo.label}</span>
                    <button
                      onClick={() => setClearGroupTick((t) => t + 1)}
                      className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
                    >
                      Clear
                    </button>
                  </span>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Icons kept beside the module so the KPI copy and any future empty state can
   reuse the same visual language as the status palette. */
export const APPROVAL_STATUS_ICON = { Pending: Clock, Approved: CircleCheck, Rejected: CircleX, Ignored: EyeOff, 'Referred Back': CornerUpLeft };
