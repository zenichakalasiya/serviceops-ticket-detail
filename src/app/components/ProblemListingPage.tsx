/* ── Problem listing ─────────────────────────────────────────────────────────
   The ticket-listing recipe cloned onto the Problem queue: the shared listing chrome
   with List, List + KPI, Kanban and Dashboard over the REAL mockProblems pool, every
   click opening the real ProblemDrawer. The AI-SUGGESTED problem from the request-
   grouping engine keeps its slot — an AI-gradient strip pinned above the grid that can
   be created as a real problem or dismissed in place.
   File-per-module clone, per the project rule — divergence here can never break Requests. */
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable, useOpenFromUrl } from './TicketTable';
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, ChevronUp, X } from 'lucide-react';

import { TicketStatsRow } from './TicketStatsRow';
import { TicketGridToolbar } from './TicketGridToolbar';
import { TicketViewsSidebar, getDefaultView, type TicketView } from './TicketViewsPanel';
import { applyFilters, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, TicketKanban, type KanbanGroup } from './TicketKanban';
import { TicketDashboardView } from './TicketDashboardView';
import { TicketCalendarView } from './TicketCalendarView';
import { mockProblems, type Problem } from './ProblemListPage';
import { AiSparkle } from './upstream/AiSparkle';
import { TicketGroupSuggestions } from './TicketGroupSuggestions';
import { CURRENT_USER, CURRENT_USER_INITIALS } from './technicianRoster';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { TicketDrawer } from './upstream/TicketDrawer';

// The Ticket shape stays canonical — imported, never re-declared, so the bench and the
// real listing can never drift apart on what a request IS.
import type { Ticket } from './TicketListPage';


/* A drill-down REPLACES the listing's own header rather than stacking on top of it. Arriving
   from a dashboard tile, the answer to "what am I looking at" is the tile — not "All Requests",
   not the queue-wide KPI strip, and not the AI grouping banner, all of which describe the whole
   queue and quietly contradict a filtered list. So this occupies the title row: the parent crumb
   doubles as the way back, the tile's own words become the page title, and the count says how
   much of the queue survived the filter. */
function DrillCrumb({
  label,
  shown,
  total,
  onBack,
}: {
  label: string;
  shown: number;
  total: number;
  onBack: () => void;
}) {
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2.5 px-6 py-3">
        <button
          onClick={onBack}
          title="Back to the dashboard"
          className="group inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
        >
          <ArrowLeft size={15} className="flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
          Dashboard
        </button>
        <ChevronRight size={16} className="flex-shrink-0 text-[#CBD5E1]" />
        <h1 className="truncate text-[17px] font-semibold text-[#1E293B]">{label}</h1>
        <span className="h-4 w-px flex-shrink-0 bg-[#E5E7EB]" />
        <span className="flex-shrink-0 text-[12px] text-[#7B8FA5]">
          <span className="font-medium tabular-nums text-[#364658]">{shown}</span> of {total} problems
        </span>
      </div>
    </div>
  );
}

/* The queue: mockProblems mapped onto the Ticket shape the shared chrome renders, with
   the ORIGINAL Problem kept aside so clicks open the real ProblemDrawer. */
const PROBLEM_STATUS = (st: string): Ticket['status'] =>
  /qa|pending/i.test(st)
    ? 'Pending'
    : /progress/i.test(st)
      ? 'In Progress'
      : /resolved/i.test(st)
        ? 'Completed'
        : /closed/i.test(st)
          ? 'Closed'
          : 'Open';
const PROBLEMS: { rows: Ticket[]; byId: Map<string, Problem> } = (() => {
  const byId = new Map<string, Problem>();
  const rows = mockProblems.map((c, i) => {
    byId.set(c.id, c);
    return {
      id: c.id,
      subject: c.subject,
      requester: c.requester,
      dueBy: c.createdDate,
      createdBy: c.createdDate,
      /* A slice of the queue belongs to the signed-in technician, so the "My …" views
         and the dashboard's My-view scope have something real to show. */
      assignedTo:
        i % 5 === 2
          ? { name: CURRENT_USER, initials: CURRENT_USER_INITIALS }
          : { name: c.assignee.name, initials: c.assignee.initials },
      status: PROBLEM_STATUS(c.status),
      priority: c.priority,
    } as Ticket;
  });
  return { rows, byId };
})();

export function ProblemListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(PROBLEMS.rows);
  /* The AI-suggested problem: expanded strip, parked as the toolbar pill after
     "Not now" (still one click away), or 'done' once it has been created or
     ignored in the review panel — resolved suggestions never come back. */
  const [aiStrip, setAiStrip] = useState<'open' | 'pill' | 'done'>('open');
  const openSuggestedGroup = () =>
    window.dispatchEvent(new CustomEvent('open-suggested-group', { detail: 'grp-2' }));
  // Assignee / Status / Priority are editable straight from the grid.
  const updateTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  // While the grid is grouped it pages per group — the outer bar becomes a pinned summary.
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ label: string; groups: number; total: number; list?: { key: string; count: number }[] } | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');
  const [clearGroupTick, setClearGroupTick] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  /* Multi-column sort: an ORDERED chain, first entry wins ties-first. A bare header
     click cycles that column asc → desc → off, appending to the chain rather than
     replacing it, so sorting by assignee THEN priority is one click each. */
  const [sorts, setSorts] = useState<{ column: keyof Ticket; dir: 'asc' | 'desc' }[]>([]);
  const startView = getDefaultView('problem');
  const [filterRules, setFilterRules] = useState<FilterRule[]>(
    () => startView?.rules.map((r, i) => ({ ...r, id: `view-${startView.name}-${i}` })) ?? [],
  );
  const [view, setView] = useState<'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar'>('list-kpi');
  /* Set only when the list was reached by clicking something on the dashboard. It carries the
     trail back: what was clicked, and the filters that were in force before the drill. */
  const [drillFrom, setDrillFrom] = useState<{ label: string; rules: FilterRule[] } | null>(null);
  const backToDashboard = () => {
    if (drillFrom) setFilterRules(drillFrom.rules);
    setDrillFrom(null);
    setCurrentPage(1);
    setView('dashboard');
  };
  /* Dashboard scope. Lives here rather than in the dashboard because the toolbar owns the
     switch and the dashboard owns the charts. */
  const [dashScope, setDashScope] = useState<'all' | 'mine'>('all');
  const [kanbanGroup, setKanbanGroup] = useState<KanbanGroup>('status');
  const [kanbanSubGroup, setKanbanSubGroup] = useState<KanbanGroup | null>(null);
  // Extra fields on every kanban card, in the order the user added them.
  const [cardFields, setCardFields] = useState<string[]>(DEFAULT_CARD_FIELDS);
  const [kanbanLanes, setKanbanLanes] = useState<{ label: string; total: number; groups: number; list: { key: string; count: number }[] } | null>(null);
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
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState(startView?.name ?? 'All Problems');
  const [viewsOpen, setViewsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenTicket = (ticket: Ticket) => {
    // Every row is a problem — open the real ProblemDrawer with the original record.
    openInStack('problem', ticket.id, ticket.subject, PROBLEMS.byId.get(ticket.id) ?? ticket);
  };

  /* A row opened in a new browser tab lands here with ?open=<id>. */
  useOpenFromUrl(tickets, handleOpenTicket);

  const handleCloseDrawer = () => {
    setOpenTickets([]);
    setActiveTicketId(null);
  };

  const handleCloseTab = (ticketId: string) => {
    const newOpenTickets = openTickets.filter(t => t.id !== ticketId);
    setOpenTickets(newOpenTickets);
    
    // If closing active ticket, switch to another tab or close drawer
    if (activeTicketId === ticketId) {
      if (newOpenTickets.length > 0) {
        setActiveTicketId(newOpenTickets[newOpenTickets.length - 1].id);
      } else {
        setActiveTicketId(null);
      }
    }
  };

  const handleTabChange = (ticketId: string) => {
    setActiveTicketId(ticketId);
  };

  // Open a clicked relation (Problem / Change / Release / Asset …) as a new tab in the same drawer.
  const handleOpenRelation = (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => {
    const mapStatus = (s: string): Ticket['status'] => {
      const v = (s || '').toLowerCase();
      if (v.includes('progress')) return 'In Progress';
      if (v.includes('resolved') || v.includes('complete')) return 'Completed';
      if (v.includes('pending')) return 'Pending';
      if (v.includes('closed')) return 'Closed';
      if (v.includes('cancel')) return 'Cancelled';
      return 'Open';
    };
    const mapPriority = (p: string): Ticket['priority'] => {
      const v = (p || '').toLowerCase();
      if (v.includes('urgent') || v === 'p1') return 'Urgent';
      if (v.includes('high') || v === 'p2') return 'High';
      if (v.includes('low') || v === 'p4') return 'Low';
      return 'Medium';
    };
    const name = rel.assignedTo?.name || 'Unassigned';
    handleOpenTicket({
      id: rel.ticketId,
      subject: rel.subject,
      requester: name,
      dueBy: new Date(),
      createdBy: new Date(),
      assignedTo: { name, initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() },
      status: mapStatus(rel.status),
      priority: mapPriority(rel.priority),
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentTicketIds = new Set(
        tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(t => t.id)
      );
      setSelectedTickets(currentTicketIds);
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  /* `dir` comes from the column header menu ("Sort A → Z" / "Z → A"); a bare click on a
     sortable header still toggles. */
  const handleSort = (column: keyof Ticket, dir?: "asc" | "desc") => {
    setCurrentPage(1);
    setSorts((prev) => {
      const i = prev.findIndex((s) => s.column === column);
      // Menu picks an explicit direction: set it in place, or append the column.
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
      // Third click drops the column out of the chain — no dead end.
      return prev.filter((s) => s.column !== column);
    });
  };

  // Filter tickets based on search query
  let filteredTickets = tickets;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredTickets = tickets.filter(ticket => {
      // Search by ticket ID
      if (ticket.id.toLowerCase().includes(query)) return true;
      // Search by subject
      if (ticket.subject.toLowerCase().includes(query)) return true;
      // Search by requester
      if (ticket.requester.toLowerCase().includes(query)) return true;
      // Search by assignee name
      if (ticket.assignedTo.name.toLowerCase().includes(query)) return true;
      // Search by status
      if (ticket.status.toLowerCase().includes(query)) return true;
      // Search by priority
      if (ticket.priority.toLowerCase().includes(query)) return true;
      return false;
    });
  }

  filteredTickets = applyFilters(filteredTickets, filterRules);

  // Sort tickets
  let sortedTickets = [...filteredTickets];
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

  // Paginate
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentPageTickets = paginatedTickets.map(t => t.id);
  const allCurrentPageSelected = currentPageTickets.every(id => selectedTickets.has(id)) && currentPageTickets.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="problem" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Its toggle lives in the header a drill-down replaces, so the rail steps aside too
              rather than sitting there unclosable. `viewsOpen` is untouched — going back
              restores it exactly as it was. */}
          {viewsOpen && !drillFrom && (
            <TicketViewsSidebar
              store="problem"
              active={activeView}
              onSelect={(v: TicketView) => {
                setActiveView(v.name);
                setFilterRules(v.rules.map((r, i) => ({ ...r, id: `view-${v.name}-${i}` })));
                setCurrentPage(1);
                // Picking a view is a fresh start — the dashboard trail no longer applies.
                setDrillFrom(null);
              }}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {drillFrom ? (
          <DrillCrumb
            label={drillFrom.label}
            shown={sortedTickets.length}
            total={tickets.length}
            onBack={backToDashboard}
          />
        ) : (
          <Toolbar
            suggestPill={aiStrip === 'pill' ? { label: 'Suggested problem', count: 1, onClick: openSuggestedGroup } : undefined}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeView={activeView}
            viewsOpen={viewsOpen}
            onToggleViews={() => setViewsOpen((v) => !v)}
          />
        )}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div
            className={`flex-1 bg-white min-h-0 ${
              view === 'kanban' || view === 'calendar' ? 'flex flex-col overflow-hidden' : 'overflow-auto [scrollbar-gutter:stable]'
            }`}
            style={{ ['--tb' as any]: `${stickyH}px` }}
          >
          <div className="sticky left-0 bg-white pt-0.5">
          {/* Both of these speak for the WHOLE queue, so a drill-down hides them — leaving one
              screen that is only ever about the thing the user clicked. */}
          {view === 'list-kpi' && !drillFrom && (
            <TicketStatsRow
              noun="problem"
              tickets={tickets}
              rules={filterRules}
              onApplyFilter={(r) => { setFilterRules(r); setCurrentPage(1); }}
            />
          )}
          {/* The AI grouping banner is about triaging a QUEUE — on a calendar its four
              clusters have no place to land, and it eats the height the month grid
              needs. Hidden there, kept everywhere else. */}
          </div>
          <div ref={stickyRef} className="sticky left-0 top-0 z-[45] bg-white pt-0.5">
          <TicketGridToolbar
            noun="problem"
            viewsStore="problem"
            searchQuery={searchQuery}
            setSearchQuery={(v) => { setSearchQuery(v); setCurrentPage(1); }}
            rules={filterRules}
            setRules={(r) => { setFilterRules(r); setCurrentPage(1); }}
            sorts={sorts}
            onSort={handleSort}
            onClearSorts={() => setSorts([])}
            activeView={activeView}
            onViewSaved={(v: TicketView) => setActiveView(v.name)}
            onRemoveSort={(column) => setSorts((prev) => prev.filter((s) => s.column !== column))}
            onReorderSorts={(order) =>
              setSorts((prev) => order.map((c) => prev.find((s) => s.column === c)!).filter(Boolean))
            }
            listGroupLabel={isGrouped ? groupInfo?.label ?? null : null}
            view={view}
            setView={(v) => {
              /* Reaching the dashboard by the view switcher has to undo the drill too —
                 otherwise the charts would silently redraw over the drilled-down subset. */
              if (v === 'dashboard' && drillFrom) return backToDashboard();
              setView(v);
            }}
            kanbanGroup={kanbanGroup}
            setKanbanGroup={(g) => {
              setKanbanGroup(g);
              // The columns and the lanes can never be the same field.
              if (kanbanSubGroup === g) setKanbanSubGroup(null);
            }}
            kanbanSubGroup={kanbanSubGroup}
            setKanbanSubGroup={setKanbanSubGroup}
            cardFields={cardFields}
            setCardFields={setCardFields}
            dashScope={dashScope}
            setDashScope={setDashScope}
          />
          </div>
          {/* The AI-suggested problem — the request-grouping engine's proposal, pinned
              above the queue. The WHOLE row is the click target and opens the group
              review popup (the engine's panel, Create Problem only on this page); the
              lone inline action is "Not now", which parks the suggestion as a quiet
              top-right pill instead of losing it. Hidden on board/dashboard and drills. */}
          {!drillFrom && (view === 'list' || view === 'list-kpi') && aiStrip === 'open' && (
            <div
              role="button"
              tabIndex={0}
              onClick={openSuggestedGroup}
              onKeyDown={(e) => e.key === 'Enter' && openSuggestedGroup()}
              className="cursor-pointer border-b border-[#EFE4FE] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(115,30,251,0.25)]"
              style={{ background: 'linear-gradient(90deg, rgba(76,177,254,0.05) 0%, rgba(115,30,251,0.05) 41.49%, rgba(249,17,227,0.05) 100%), #FFF' }}
            >
              <div className="flex min-w-0 items-center gap-3 px-6 py-2">
                <span
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-[12px] font-semibold text-[#731EFB]"
                  style={{ background: 'rgba(115, 30, 251, 0.08)' }}
                >
                  <AiSparkle size={12} />
                  AI
                </span>
                <span className="min-w-0 truncate text-[12px] font-medium text-[#364658]">
                  Onboarding requests stalled at AD account creation
                </span>
                <span className="flex-shrink-0 rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-semibold text-[#B45309]">
                  Medium · 78%
                </span>
                <span className="hidden h-3 w-px flex-shrink-0 bg-[#E5E7EB] sm:block" />
                <span className="hidden flex-shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#731EFB] sm:inline-flex">
                  <span className="size-2 rounded-full bg-[#731EFB]" />
                  Suggested
                </span>
                <span className="hidden flex-shrink-0 text-[12px] text-[#64748B] md:block">5h ago</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAiStrip('pill');
                  }}
                  className="ml-auto h-7 flex-shrink-0 rounded px-2.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-white/70 hover:text-[#364658]"
                >
                  Not now
                </button>
              </div>
            </div>
          )}
          {view === 'calendar' ? (
            <TicketCalendarView tickets={sortedTickets} noun="problem" onTicketClick={handleOpenTicket} />
          ) : view === 'kanban' ? (
            <TicketKanban
              noun="problem"
              tickets={sortedTickets}
              group={kanbanGroup}
              subGroup={kanbanSubGroup}
              cardFields={cardFields}
              onLanesChange={setKanbanLanes}
              onTicketClick={handleOpenTicket}
              onUpdateTicket={updateTicket}
            />
          ) : view === 'dashboard' ? (
            <TicketDashboardView
              /* Deliberately the UNFILTERED set: the dashboard narrows itself with the
                 Overall/Mine switch, and its filter row is hidden, so honouring list
                 filters here would silently redraw every chart with no way to see why. */
              tickets={tickets}
              scope={dashScope}
              noun="problem"
              onTicketClick={handleOpenTicket}
              onDrillDown={(r, label) => {
                /* Remember what the list looked like BEFORE the drill — a saved view's rules
                   would otherwise be lost, and "back" has to put them back. */
                setDrillFrom({ label, rules: filterRules });
                setFilterRules(r.map((x, i) => ({ ...x, id: `dash-${x.field}-${i}` })));
                setCurrentPage(1);
                setView('list-kpi');
              }}
            />
          ) : (
            <TicketTable
              openPage="problem"
              noun="problem"
              tickets={paginatedTickets}
              selectedTickets={selectedTickets}
              allSelected={allCurrentPageSelected}
              onSelectAll={handleSelectAll}
              onSelectTicket={handleSelectTicket}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              sorts={sorts}
              onTicketClick={handleOpenTicket}
              onUpdateTicket={updateTicket}
              allTickets={sortedTickets}
              onGroupedChange={(g, info) => { setIsGrouped(g); setGroupInfo(g ? info ?? null : null); }}
              clearGroupingSignal={clearGroupTick}
              emptyFiltered={searchQuery.trim() !== '' || filterRules.length > 0}
              onClearFilters={() => { setSearchQuery(''); setFilterRules([]); setCurrentPage(1); }}
            />
          )}
            
          </div>
            {!isGrouped && (view === 'list' || view === 'list-kpi') && (
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
            {/* Grouped mode keeps a PINNED footer — paging lives inside the groups, so
                this bar summarises the grouping instead of duplicating page controls. */}
            {(() => {
              // The dashboard has no rows and no groups, so it gets no grouping footer.
              const footerGroup =
                view === 'dashboard'
                  ? null
                  : view === 'kanban'
                    ? kanbanSubGroup
                      ? kanbanLanes
                      : null
                    : isGrouped
                      ? groupInfo
                      : null;
              const clearGrouping = () =>
                view === 'kanban' ? setKanbanSubGroup(null) : setClearGroupTick((t) => t + 1);
              return (
            footerGroup && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-6 py-2.5">
                <span className="text-[12px] text-[#64748B] tabular-nums">
                  Showing <span className="font-medium text-[#364658]">{footerGroup.total}</span> problems in{' '}
                  <span className="font-medium text-[#364658]">{footerGroup.groups}</span> groups
                </span>
                <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
                  {(footerGroup.list?.length ?? 0) > 1 && (
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
                              placeholder={'Search ' + footerGroup.label.toLowerCase() + '...'}
                              className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                            />
                          </div>
                          {/* onMouseDown beats the input blur so the pick lands. */}
                          <div className="max-h-[300px] overflow-y-auto pb-1">
                            {(() => {
                              const q = jumpQuery.trim().toLowerCase();
                              const rows = (footerGroup.list ?? []).filter((g) => !q || g.key.toLowerCase().includes(q));
                              if (!rows.length) return <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching groups</div>;
                              return rows.map((g) => (
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
                  Grouped by <span className="font-medium text-[#364658]">{footerGroup.label}</span>
                  <button
                    onClick={clearGrouping}
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
                  >
                    Clear
                  </button>
                </span>
              </div>
            )
              );
            })()}
        </main>
          </div>
        </div>
      </div>

      {/* The group-review popup — listens for open-suggested-group; on this page it
          offers Create Problem only (panelOnly hides Merge Requests). */}
      <TicketGroupSuggestions panelOnly soloMode onGroupConsumed={() => setAiStrip('done')} />
      <TicketDrawer
        openTickets={openTickets}
        activeTicketId={activeTicketId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}

