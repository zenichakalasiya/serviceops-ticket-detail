/* ── Hardware Assets listing ─────────────────────────────────────────────────
   The shared listing chrome over the REAL mockAssets pool: the data-grid with the
   Hardware Assets' OWN columns (moduleCols="asset" — Asset Type · Status · Host Name ·
   IP · Used By · Managed By Group · Managed By · Serial) and an asset KPI strip
   (AssetStatsRow: fleet lifecycle + the detail page's Warranty / Patch / Antivirus /
   Impact story rolled up). Layouts are List + List & KPI — an asset register has no
   work-in-flight axis, so Kanban/Dashboard/Calendar/Gantt are deliberately not offered.
   Every click opens the real HardwareAssetDrawer.
   File-per-module clone, per the project rule — divergence here can never break Requests. */
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable, useOpenFromUrl } from './TicketTable';
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, ChevronUp, X } from 'lucide-react';

import { AssetStatsRow, assetHealthOf } from './AssetStatsRow';
import { HARDWARE_FILTER_ATTRS } from './assetFilterAttrs';
import { AssetDashboardView, type DashConfig } from './AssetDashboardView';
import { AlertTriangle, CalendarClock, CheckCircle2, FlaskConical, Import, Monitor } from 'lucide-react';
import { TicketGridToolbar } from './TicketGridToolbar';
import { TicketViewsSidebar, getDefaultView, type TicketView } from './TicketViewsPanel';
import { ASSET_QUICK_FILTERS, applyFilters, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, TicketKanban, type KanbanGroup } from './TicketKanban';
import { TicketDashboardView } from './TicketDashboardView';
import { TicketCalendarView } from './TicketCalendarView';
import { mockAssets, type HardwareAsset } from './HardwareAssetsListPage';
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
          <span className="font-medium tabular-nums text-[#364658]">{shown}</span> of {total} assets
        </span>
      </div>
    </div>
  );
}

/* The queue: mockAssets mapped onto the Ticket shape the shared chrome renders, with
   the ORIGINAL HardwareAsset kept aside so clicks open the real HardwareAssetDrawer.
   Asset statuses ride t.status AS-IS ('In Use'/'Available'/'In Store') — the asset
   column set renders them with its own palette, and the views/KPIs filter on the
   raw values, so no lossy translation is needed. */
const HW: { rows: Ticket[]; byId: Map<string, HardwareAsset> } = (() => {
  const byId = new Map<string, HardwareAsset>();
  const hash = (id: string) => id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
  const rows = mockAssets.map((a, i) => {
    byId.set(a.id, a);
    const h = hash(a.id);
    const created = new Date(2026, h % 8, 1 + (h % 27), 9 + (h % 8), (h % 4) * 15);
    const usedByName = a.usedBy ? a.usedBy.label.split(' (')[0] : 'Unassigned';
    const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return {
      id: a.id,
      subject: a.name,
      requester: usedByName,
      dueBy: created,
      createdBy: created,
      /* A slice of the fleet is managed by the signed-in technician, so the
         "Assets Managed by Me" view has something real to show. */
      assignedTo:
        i % 5 === 2
          ? { name: CURRENT_USER, initials: CURRENT_USER_INITIALS }
          : { name: a.managedBy.name, initials: a.managedBy.initials ?? initials(a.managedBy.name) },
      /* mockAssets only knows In Use / Available / In Store — translate onto the
         product's real catalog (In Stock covers the shelf states) and sprinkle a
         deterministic few of the lifecycle states so the register reads lived-in. */
      status: (() => {
        let st: string = a.status === 'In Use' ? 'In Use' : 'In Stock';
        if (st === 'In Use') {
          if (h % 8 === 1) st = 'In Repair';
          else if (h % 9 === 4) st = 'Faulty';
          else if (h % 10 === 7) st = 'Retired';
          else if (h % 12 === 5) st = 'Missing';
        }
        return st;
      })() as Ticket['status'],
      priority: 'Medium',
      assetType: a.assetType,
      hostName: a.hostName,
      ipAddress: a.ipAddress,
      usedByLabel: a.usedBy?.label ?? '',
      usedByMore: a.usedBy?.more,
      managedByGroup: a.managedByGroup,
      serialNo: a.serialNumber,
      /* Health bands from the shared per-asset seed, plus location (seeded) and
         vendor (read off the asset's own name), as ROW FIELDS so the dashboard's
         segments (and KPI cards) can drill into them. */
      ...(() => {
        const hh = assetHealthOf(a.id);
        const nm = a.name.toLowerCase();
        const vendor = nm.includes('macbook') || nm.includes('imac')
          ? 'Apple'
          : nm.includes('dell')
            ? 'Dell Technologies'
            : nm.includes('hpe') || nm.includes('proliant')
              ? 'HPE'
              : nm.includes('hp ')
                ? 'HP Inc.'
                : nm.includes('lenovo') || nm.includes('thinkpad')
                  ? 'Lenovo'
                  : nm.includes('cisco') || nm.includes('catalyst')
                    ? 'Cisco Systems'
                    : nm.includes('fortinet') || nm.includes('fortigate')
                      ? 'Fortinet'
                      : 'Other OEMs';
        const LOCATIONS = ['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote'];
        return {
          x_warrantyBand: hh.warrantyDays <= 0 ? 'Expired' : hh.warrantyDays <= 30 ? 'Expiring soon' : 'Covered',
          x_patchBand: hh.patchesMissing > 0 ? 'Missing patches' : 'Patched',
          x_avBand: hh.avOff ? 'Unprotected' : 'Protected',
          x_location: LOCATIONS[h % LOCATIONS.length],
          x_vendor: vendor,
        };
      })(),
    } as Ticket;
  });
  return { rows, byId };
})();

/* The Dashboard layout — the hardware detail page's Overview KPIs (lifecycle,
   warranty, patch, antivirus, ownership) as fleet-wide charts, every segment
   drilling into the filtered list. */
const buildHwDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const is = (field: string, ...values: string[]) => [{ field, condition: 'is' as const, values }];
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: is(field, label),
  });
  const countBy = (field: string) => {
    const m = new Map<string, number>();
    t.forEach((x) => {
      const v = x[field];
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const ATTENTION = ['In Repair', 'Faulty', 'Missing', 'Theft'];
  return {
    tiles: [
      { icon: Monitor, color: '#3D8BD0', label: 'Total assets', value: t.length, sub: 'in the fleet' },
      {
        icon: CheckCircle2, color: '#22C55E', label: 'In Use', value: n((x) => x.status === 'In Use'),
        sub: 'allocated and working', filter: is('status', 'In Use'), hint: 'Show assets in use',
      },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Needs attention', value: n((x) => ATTENTION.includes(x.status)),
        sub: 'in repair · faulty · missing', filter: is('status', ...ATTENTION), hint: 'Show assets needing attention',
      },
      {
        icon: CalendarClock, color: '#F59E0B', label: 'Warranty expiring', value: n((x) => x.x_warrantyBand === 'Expiring soon'),
        sub: 'within 30 days', filter: is('x_warrantyBand', 'Expiring soon'), hint: 'Show warranty expiring soon',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Asset by Status', centerLabel: 'assets',
        segs: [
          seg('In Use', n((x) => x.status === 'In Use'), '#22C55E', 'status'),
          seg('In Stock', n((x) => x.status === 'In Stock'), '#3D8BD0', 'status'),
          seg('In Repair', n((x) => x.status === 'In Repair'), '#6366F1', 'status'),
          seg('Faulty', n((x) => x.status === 'Faulty'), '#EF4444', 'status'),
          seg('Missing', n((x) => x.status === 'Missing'), '#DC2626', 'status'),
          seg('Retired', n((x) => x.status === 'Retired'), '#F59E0B', 'status'),
        ],
      },
      {
        /* Composition at a glance — one segmented bar reads faster than a third ring. */
        kind: 'stack', title: 'Warranty', sub: 'coverage across the fleet',
        segs: [
          seg('Covered', n((x) => x.x_warrantyBand === 'Covered'), '#22C55E', 'x_warrantyBand'),
          seg('Expiring soon', n((x) => x.x_warrantyBand === 'Expiring soon'), '#F59E0B', 'x_warrantyBand'),
          seg('Expired', n((x) => x.x_warrantyBand === 'Expired'), '#DC2626', 'x_warrantyBand'),
        ],
      },
      {
        kind: 'area', title: 'Asset intake', sub: 'assets registered per month', color: '#3D8BD0',
        points: (() => {
          const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
          const byMonth = MONTHS.map((label) => ({ label, value: 0 }));
          t.forEach((x) => {
            const m = (x.createdBy as Date)?.getMonth?.() ?? 0;
            if (m < byMonth.length) byMonth[m].value += 1;
          });
          return byMonth;
        })(),
      },
      ...(() => {
        /* Top-N charts carry their FULL lists too, so the card's "View all"
           opens the breakdown side panel with everything beyond the top few. */
        const types = countBy('assetType').map(([label, value]) => ({ label, value, color: '#3D8BD0', filter: is('assetType', label) }));
        const locations = countBy('x_location').map(([label, value]) => ({ label, value, color: '#0EA5E9', filter: is('x_location', label) }));
        const vendors = countBy('x_vendor').map(([label, value]) => ({ label, value, color: '#F59E0B', filter: is('x_vendor', label) }));
        return [
          {
            kind: 'columns' as const, title: 'Asset types', sub: 'by count',
            rows: types.slice(0, 5), allRows: types,
            panelSubject: 'asset types', panelColumnLabel: 'Asset Type', panelCountLabel: 'Assets',
          },
          {
            kind: 'columns' as const, title: 'Assets by location', sub: 'where the fleet sits',
            mapGeo: {
              'Ahmedabad HQ': [23.0225, 72.5714] as [number, number],
              'Pune Office': [18.5204, 73.8567] as [number, number],
              'Chennai DC': [13.0827, 80.2707] as [number, number],
              'Bengaluru Office': [12.9716, 77.5946] as [number, number],
            },
            rows: locations.slice(0, 4), allRows: locations,
            panelSubject: 'locations', panelColumnLabel: 'Location', panelCountLabel: 'Assets',
          },
          {
            kind: 'bars' as const, title: 'Assets by vendor', sub: 'who supplied the fleet',
            rows: vendors.slice(0, 5), allRows: vendors,
            panelSubject: 'vendors', panelColumnLabel: 'Vendor', panelCountLabel: 'Assets',
          },
        ];
      })(),
    ],
  };
};

export function HardwareAssetsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(HW.rows);
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
  const startView = getDefaultView('hwasset');
  const [filterRules, setFilterRules] = useState<FilterRule[]>(
    () => startView?.rules.map((r, i) => ({ ...r, id: `view-${startView.name}-${i}` })) ?? [],
  );
  const [view, setView] = useState<'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar'>('list');
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
  const [activeView, setActiveView] = useState(startView?.name ?? 'All Hardware IT Assets');
  const [viewsOpen, setViewsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenTicket = (ticket: Ticket) => {
    // Every row is an asset — open the real HardwareAssetDrawer with the original record.
    openInStack('hardware-assets', ticket.id, ticket.subject, HW.byId.get(ticket.id) ?? ticket);
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
      <Sidebar activePage="hardware-assets" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Its toggle lives in the header a drill-down replaces, so the rail steps aside too
              rather than sitting there unclosable. `viewsOpen` is untouched — going back
              restores it exactly as it was. */}
          {viewsOpen && !drillFrom && (
            <TicketViewsSidebar
              store="hwasset"
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
              view === 'kanban' || view === 'calendar' ? 'flex flex-col overflow-hidden' : 'overflow-auto [scrollbar-gutter:stable]'
            }`}
            style={{ ['--tb' as any]: `${stickyH}px` }}
          >
          <div className="sticky left-0 bg-white pt-0.5">
          {/* Both of these speak for the WHOLE queue, so a drill-down hides them — leaving one
              screen that is only ever about the thing the user clicked. */}
          {view === 'list-kpi' && !drillFrom && (
            <AssetStatsRow
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
            noun="asset"
            viewsStore="hwasset"
            /* The product's own asset attributes — see assetFilterAttrs.ts. */
            filterAttrs={HARDWARE_FILTER_ATTRS}
            /* Assignee / SLA / Priority are service-desk cuts; an asset register is
               worked by lifecycle state and kind of machine. */
            quickFilters={ASSET_QUICK_FILTERS}
            /* Assets carry physical labels: generate one, or scan one to find the record. */
            showBarcodeTools
            /* The asset register's own ⋮ menu. Auto refresh is NOT here — it stays merged
               into the refresh button, the way the request listing has it. */
            moreActions={[
              { key: 'asset-in-stage', label: 'Asset in Stage', icon: FlaskConical },
              { key: 'import-asset', label: 'Import Asset', icon: Import },
            ]}
            layouts={['list', 'dashboard']}
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
            dashScopeSwitch={false}
          />
          </div>
          {view === 'calendar' ? (
            <TicketCalendarView tickets={sortedTickets} noun="asset" onTicketClick={handleOpenTicket} />
          ) : view === 'kanban' ? (
            <TicketKanban
              noun="asset"
              tickets={sortedTickets}
              group={kanbanGroup}
              subGroup={kanbanSubGroup}
              cardFields={cardFields}
              onLanesChange={setKanbanLanes}
              onTicketClick={handleOpenTicket}
              onUpdateTicket={updateTicket}
            />
          ) : view === 'dashboard' ? (
            <AssetDashboardView
              /* Deliberately the UNFILTERED set: the dashboard narrows itself with
                 the Overall/Mine switch, never with the list filters. */
              config={buildHwDashboard(
                dashScope === 'mine' ? tickets.filter((t) => t.assignedTo.name === CURRENT_USER) : tickets,
              )}
              empty={
                dashScope === 'mine' && !tickets.some((t) => t.assignedTo.name === CURRENT_USER)
                  ? `Nothing here is managed by ${CURRENT_USER} yet.`
                  : null
              }
              onDrillDown={(r, label) => {
                /* Remember what the list looked like BEFORE the drill — a saved view's rules
                   would otherwise be lost, and "back" has to put them back. */
                setDrillFrom({ label, rules: filterRules });
                setFilterRules(r.map((x, i) => ({ ...x, id: `dash-${x.field}-${i}` })));
                setCurrentPage(1);
                setView('list');
              }}
            />
          ) : (
            <TicketTable
              openPage="hardware-assets"
              noun="asset"
              moduleCols="asset"
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
                  Showing <span className="font-medium text-[#364658]">{footerGroup.total}</span> assets in{' '}
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

