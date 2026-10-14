import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable, useOpenFromUrl } from './TicketTable';
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, ChevronUp, X } from 'lucide-react';

import { TicketGroupSuggestions } from './TicketGroupSuggestions';
import { TicketStatsRow } from './TicketStatsRow';
import { TicketGridToolbar } from './TicketGridToolbar';
import { TicketViewsSidebar, getDefaultView, type TicketView } from './TicketViewsPanel';
import { applyFilters, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, TicketKanban, type KanbanGroup } from './TicketKanban';
import { TicketDashboardView } from './TicketDashboardView';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { TicketDrawer } from './TicketDrawer';

export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  dueBy: Date;
  /** Optional planned END of the record's window (the Change queue's schedule). */
  dueEnd?: Date;
  /** What the window means for users — the Change Schedule's impact statement. */
  windowNote?: string;
  /** Counts the timeline's hover card shows INSTEAD of an impact statement, for a record
      that reports a plan rather than a disruption (a project's tasks). Figures scan where
      a sentence has to be read. */
  stats?: { label: string; value: number | string; color?: string }[];
  /** The bar above those counts, 0-100. */
  statsProgress?: number;
  /** The record's lifecycle stage + status ("Planning: In Progress") — Change and
      Release rows carry it; surfaces show it in place of the flattened status. */
  stageStatus?: string;
  /** Module taxonomy (Change Type/Risk, Release Type/Risk) — Change and Release
      rows carry these; null = not set yet. */
  changeType?: string | null;
  changeRisk?: string | null;
  /** Hardware-asset columns — only asset rows carry these (moduleCols="asset"). */
  assetType?: string;
  hostName?: string;
  ipAddress?: string;
  usedByLabel?: string;
  usedByMore?: number;
  managedByGroup?: string;
  serialNo?: string;
  /** Planned rollout + downtime sub-windows (Release rows) — drive the Gantt's
      segmented bars and the hover card's phase rows. */
  rollout?: { start: Date; end: Date; note?: string };
  downtime?: { start: Date; end: Date; note: string };
  createdBy: Date;
  assignedTo: {
    name: string;
    initials: string;
    avatar?: string;
  };
  status: 'Open' | 'In Progress' | 'Completed' | 'Pending' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  /** Optional-column value; unset rows derive it deterministically in the grid. */
  impact?: string;
  /** Unread conversation replies — drives the blue chip + bold subject on the listing. */
  unread?: number;
  lastMsg?: { from: string; snippet: string; time: string };
  /** Task progress mirrored from the detail page (every request seeds 3-4; INC-35 = 13 staged). */
  tasksDone?: number;
  tasksTotal?: number;
  /** A pending approval on the detail page — the amber chip on the listing. */
  approval?: { approver: string; level: number; totalLevels: number; waiting: string };
}

// Mock data
/* Requests per day across 19 Apr – 2 May 2022, shaped like a real intake week:
   busy at the start of the week, quiet over the weekend (indexes 5-6 and 12-13). */
const DAY_VOLUME = [11, 8, 9, 6, 7, 2, 1, 12, 10, 7, 5, 6, 2, 1];
const DAY_SPREAD: number[] = DAY_VOLUME.flatMap((count, day) => Array.from({ length: count }, () => day));

export const generateMockTickets = (): Ticket[] => {
  /* Indices 0–16 are fixed: they are the members of the AI suggested groups and the
     three requests with bespoke detail-page content (INC-32/33/35). The rest are a
     realistic spread of service-desk work so the queue never reads as one repeated row. */
  const subjects = [
    "Outlook keeps crashing when opening attachments",
    "Employee Onboarding",
    "My Internet Down",
    "WiFi is not working",
    "Employee Onboarding",
    "Request for Apple MacBook Pro Allocation",
    "Employee Onboarding",
    "Unable to log in to the HR portal",
    "Employee Onboarding",
    "Laptop charger not working",
    "WiFi is not working",
    "Internet dropping every few minutes",
    "Charger stopped charging the laptop",
    "Cannot open shared drive from Floor 3",
    "Password reset for Active Directory account",
    "Employee Onboarding",
    "Burnt smell from power adapter",
    "VPN disconnects when working from home",
    "Request access to Salesforce CRM",
    "Printer on 2nd floor not responding",
    "Outlook not syncing emails since morning",
    "New laptop setup for marketing hire",
    "Software license renewal — Adobe Creative Cloud",
    "Blue screen error on Windows startup",
    "Microsoft Teams audio not working in meetings",
    "Request for an additional monitor",
    "Shared mailbox access for finance team",
    "SAP login fails with authentication error",
    "Slow system performance after latest update",
    "Mobile device enrollment for new phone",
    "Request for Zoom license upgrade",
    "Email quota exceeded — unable to send mail",
    "Data restore request from last week's backup",
    "Employee Offboarding — access revocation",
    "Website not loading on corporate network",
    "Request for additional OneDrive storage",
    "Keyboard keys not responding on laptop",
    "Two-factor authentication device replacement",
    "Conference room projector not connecting",
    "Bulk user creation for new department"
  ];
  
  const requesters = ['Jainam Shah', 'Nandini Patel', 'Darshak Modi', 'Meera Iyer', 'Samuel Githugu', 'Kavit Gohel', 'Hetal Mori', 'Rohit Kulkarni', 'Ersin Sevinç'];
  const assignees = [
    { name: 'Amou Desai', initials: 'AD' },
    { name: 'Keetion Dale', initials: 'KD' },
    { name: 'Shreyak Dalal', initials: 'SD' },
    { name: 'Kaison Potai', initials: 'KP' },
    { name: 'Novak Potai', initials: 'NP' },
    { name: 'Rahul Shukla', initials: 'RS' },
    { name: 'Sarah Johnson', initials: 'SJ' },
    { name: 'Pratik Patial', initials: 'PP' }
  ];
  
  const statuses: Ticket['status'][] = ['Open', 'In Progress', 'Completed', 'Pending', 'Closed'];
  const priorities: Ticket['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
  
  const MSG_SNIPPETS = [
    "I'm still seeing the same error after the restart — sharing a screenshot now.",
    'This started happening again after the latest update. Can someone take a look today?',
    'Thanks for the quick fix yesterday — unfortunately it is back again this morning.',
    'Adding my manager here. We need this resolved before the client call at 4 PM.',
    'Tried the steps you shared, but step 3 fails with "access denied".',
  ];
  /* A queue's new replies come from BOTH sides of the desk — the listing colours
     its unread dot by which, so the mock has to carry both voices. */
  const TECH_SNIPPETS = [
    'Ran a fresh scan on the endpoint — pushing the driver update now, please keep the machine on.',
    'Raised this with the network team; the switch port is being replaced this evening.',
    'I have applied the workaround on your profile. Could you sign out and back in to confirm?',
    'Parts have arrived — booking a desk visit for tomorrow morning if that suits you.',
    'Escalated to the vendor with the logs attached. Will update as soon as they respond.',
  ];
  const MSG_TIMES = ['8m ago', '24m ago', '1h ago', '2h ago', '4h ago'];
  const APPROVERS = ['Rakesh Rathod', 'Priya Nair', 'Vikram Sethi', 'Sarah Johnson'];
  const APPROVAL_WAITS = ['2d', '5h', '1d', '3d'];

  return Array.from({ length: 84 }, (_, i) => {
    const requester = requesters[i % requesters.length];
    const assignee = assignees[i % assignees.length];
    // New replies on a handful of rows per page — badges should be the exception a
    // technician scans FOR, not row furniture.
    const unread = i % 7 === 0 ? (i % 14 === 0 ? 3 : 2) : 0;
    // Tasks exist on roughly half the queue (irregular spacing so it reads organic);
    // counts vary 2-5, 13 staged on INC-35. No-task rows show no Tasks row in the peek.
    const hasTasks = i === 5 || [0, 2, 6, 9].includes(i % 11);
    const tasksTotal = i === 5 ? 13 : hasTasks ? 2 + (i % 4) : 0;
    const status = i === 9 ? ('Closed' as const) : i === 2 ? ('Open' as const) : statuses[i % statuses.length]; // INC-39 (index 9) should be Closed, INC-32 (index 2) should be Open
    // A pending approval blocks OPEN work only — settled rows never carry one.
    const hasApproval =
      i % 11 === 3 && status !== 'Closed' && status !== 'Completed';
    /* Fresh intake nobody has picked up yet — only OPEN work can be ownerless, and the
       first 17 indices stay assigned (they anchor the AI groups and bespoke demos). */
    const unassigned =
      i >= 17 && (i % 9 === 7 || i % 9 === 2) && (status === 'Open' || status === 'In Progress' || status === 'Pending');
    return {
      id: `INC-${String(i + 30).padStart(2, '0')}`,
      subject: subjects[i % subjects.length],
      requester,
      dueBy: new Date(2022, 3, 20 + (i % 10), 2 + (i % 12), 34),
      createdBy: new Date(2022, 3, 19 + DAY_SPREAD[i % DAY_SPREAD.length], 3 + (i % 12), 30),
      assignedTo: unassigned ? { name: 'Unassigned', initials: '' } : assignee,
      status,
      priority: priorities[i % priorities.length],
      unread,
      lastMsg: unread > 0
        ? /* Every third unread row is a TECHNICIAN reply, so both dot colours
             (orange requester / blue technician) show up in the queue. */
          i % 3 === 1 && !unassigned
          ? { from: assignee.name, snippet: TECH_SNIPPETS[i % TECH_SNIPPETS.length], time: MSG_TIMES[i % MSG_TIMES.length] }
          : { from: requester, snippet: MSG_SNIPPETS[i % MSG_SNIPPETS.length], time: MSG_TIMES[i % MSG_TIMES.length] }
        : undefined,
      tasksTotal: hasTasks ? tasksTotal : undefined,
      tasksDone: !hasTasks ? undefined : i === 5 ? 6 : i % (tasksTotal + 1),
      approval: hasApproval
        ? { approver: APPROVERS[i % APPROVERS.length], level: 1 + (i % 2), totalLevels: 2, waiting: APPROVAL_WAITS[i % APPROVAL_WAITS.length] }
        : undefined,
    };
  });
};

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
          <span className="font-medium tabular-nums text-[#364658]">{shown}</span> of {total} requests
        </span>
      </div>
    </div>
  );
}

export function TicketListPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(generateMockTickets());
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
  const startView = getDefaultView();
  const [filterRules, setFilterRules] = useState<FilterRule[]>(
    () => startView?.rules.map((r, i) => ({ ...r, id: `view-${startView.name}-${i}` })) ?? [],
  );
  const [view, setView] = useState<'list' | 'list-kpi' | 'kanban' | 'dashboard'>('list-kpi');
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
  const [activeView, setActiveView] = useState(startView?.name ?? 'All Requests');
  const [viewsOpen, setViewsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenTicket = (ticket: Ticket) => {
    // INC-33 opens the SECOND design option of the detail page (TicketDrawerV2);
    // every other ticket keeps the existing V1 TicketDrawer.
    openInStack(ticket.id === 'INC-33' ? 'request-v2' : 'request', ticket.id, ticket.subject, ticket);
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
      <Sidebar activePage="request" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} onOpenAdmin={() => onNavigate('admin')} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Its toggle lives in the header a drill-down replaces, so the rail steps aside too
              rather than sitting there unclosable. `viewsOpen` is untouched — going back
              restores it exactly as it was. */}
          {viewsOpen && !drillFrom && (
            <TicketViewsSidebar
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
              view === 'kanban' ? 'flex flex-col overflow-hidden' : 'overflow-auto [scrollbar-gutter:stable]'
            }`}
            style={{ ['--tb' as any]: `${stickyH}px` }}
          >
          <div className="sticky left-0 bg-white pt-0.5">
          {/* Both of these speak for the WHOLE queue, so a drill-down hides them — leaving one
              screen that is only ever about the thing the user clicked. */}
          {view === 'list-kpi' && !drillFrom && (
            <TicketStatsRow
              tickets={tickets}
              rules={filterRules}
              onApplyFilter={(r) => { setFilterRules(r); setCurrentPage(1); }}
            />
          )}
          {!drillFrom && <TicketGroupSuggestions />}
          </div>
          <div ref={stickyRef} className="sticky left-0 top-0 z-[45] bg-white pt-0.5">
          <TicketGridToolbar
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
            /* Dashboard is not offered on the Requests queue — the KPI strip already
               answers the same questions in-place. The view's code below stays put,
               so putting it back is a one-word change to this list. */
            layouts={['list', 'list-kpi', 'kanban']}
          />
          </div>
          {view === 'kanban' ? (
            <TicketKanban
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
              openPage="request"
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
                  Showing <span className="font-medium text-[#364658]">{footerGroup.total}</span> requests in{' '}
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
export const MOCK_TICKETS: Ticket[] = generateMockTickets();
