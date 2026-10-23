import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Barcode, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Columns3, Download, Eye, EyeOff, FileOutput, Filter, GripVertical, Import, LayoutDashboard, LayoutGrid, LayoutList, LayoutPanelTop, Lock, Pin, Rows3, MoreVertical, Plus, RefreshCw, ScanBarcode, ScanQrCode, Search, Settings2, SquareKanban, UserRound, Users, CalendarDays, ChartGantt, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket } from './TicketListPage';
import { TicketFilterBar, TECH_GROUPS, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, KANBAN_GROUPS, cardFieldsFor, kanbanFieldsFor, type KanbanGroup } from './TicketKanban';
import { ColumnManager } from './TicketTable';
import { AiSparkle } from './upstream/AiSparkle';
import { Info } from 'lucide-react';
import { CURRENT_USER, isMyCustomView, loadCustomViews, upsertCustomView, type TicketView, type ViewStore } from './TicketViewsPanel';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Toolbar directly above the grid — the controls that act ON the grid live with the grid,
   not up in the page header. Left: find and narrow. Right: refresh, sort, display. */


const SORTABLE: { field: keyof Ticket; label: string }[] = [
  { field: 'id', label: 'ID' },
  { field: 'subject', label: 'Subject' },
  { field: 'requester', label: 'Requester' },
  { field: 'assignedTo', label: 'Assigned to' },
  { field: 'dueBy', label: 'SLA Status' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
  { field: 'createdBy', label: 'Created Date' },
];

const EXPORT_FIELDS = [
  'Request Id', 'Subject', 'Request Type', 'Requester', 'Created Date', 'Source', 'Assignee',
  'Technician Group', 'Status', 'Priority', 'Urgency', 'Impact', 'Category', 'Service Catalog',
  'Service Category', 'Department', 'Location', 'Support Level', 'Resolved By', 'Closed By',
  'Last Updated Date', 'Last Updated By', 'Due By', 'Resolution Time', 'Approval Status', 'Tags',
];
/* Ticked by default: what a technician exports most often (mirrors the grid's own columns). */
const EXPORT_DEFAULTS = [
  'Subject', 'Requester', 'Created Date', 'Assignee', 'Status', 'Priority', 'Category', 'Department',
];

const ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]';
const POPUP = 'app-menu absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl';

const AUTO_REF_OPTS = [
  { key: 'Off', label: 'None' },
  { key: '5m', label: '5 Minutes' },
  { key: '10m', label: '10 Minutes' },
  { key: '20m', label: '20 Minutes' },
  { key: '25m', label: '25 Minutes' },
  { key: '30m', label: '30 Minutes' },
];
const AUTO_REF_MS: Record<string, number> = { '5m': 3e5, '10m': 6e5, '20m': 1.2e6, '25m': 1.5e6, '30m': 1.8e6 };

/* List + KPI leads — it is the layout a queue opens on, so it reads first. */
const LAYOUTS = [
  { key: 'list-kpi' as const, label: 'List + KPI', Icon: LayoutPanelTop },
  { key: 'list' as const, label: 'List', Icon: LayoutList },
  { key: 'kanban' as const, label: 'Kanban', Icon: SquareKanban },
  { key: 'dashboard' as const, label: 'Dashboard', Icon: LayoutDashboard },
];
/** Opt-in extra — only the Views Lab passes `showCalendar`. */
const CALENDAR_LAYOUT = { key: 'calendar' as const, label: 'Calendar', Icon: CalendarDays };
/** Layout key → label, for the "default layout" confirmation toast. */
const LAYOUT_LABEL: Record<string, string> = {
  list: 'List', 'list-kpi': 'List + KPI', kanban: 'Kanban', dashboard: 'Dashboard', calendar: 'Calendar', gantt: 'Gantt', tiles: 'Tiles',
};
/** Opt-in extra — a register whose records read best as cards (Compliance Visualization's
    Policies) passes `showTiles`. Sits right after List, since it is the same rows drawn as cards. */
const TILES_LAYOUT = { key: 'tiles' as const, label: 'Tiles', Icon: LayoutGrid };
/** Opt-in extra — only the Release listing passes `showGantt`. */
const GANTT_LAYOUT = { key: 'gantt' as const, label: 'Gantt', Icon: ChartGantt };

/** Closes a popup on any outside click — shared by the three right-hand menus. */
function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

export function TicketGridToolbar({
  searchQuery,
  setSearchQuery,
  rules,
  setRules,
  sorts,
  onSort,
  activeView,
  onViewSaved,
  onRemoveSort,
  onReorderSorts,
  onClearSorts,
  listGroupLabel,
  view,
  setView,
  dashScope,
  dashScopeSwitch = true,
  showQuickFilters = true,
  showFilterBuilder = true,
  allowColumnEdit = true,
  quickFilters,
  filterAttrs,
  setDashScope,
  showCalendar = false,
  showGantt = false,
  showTiles = false,
  kanbanGroup,
  setKanbanGroup,
  kanbanSubGroup,
  setKanbanSubGroup,
  cardFields,
  setCardFields,
  noun = 'request',
  viewsStore = 'ticket',
  layouts,
  minimalTools = false,
  hideTools,
  showBarcodeTools = false,
  moreActions,
  primaryAction,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  rules: FilterRule[];
  setRules: (r: FilterRule[]) => void;
  sorts: { column: keyof Ticket; dir: 'asc' | 'desc' }[];
  onSort: (column: keyof Ticket, dir?: 'asc' | 'desc') => void;
  onRemoveSort: (column: keyof Ticket) => void;
  /** Name of the applied view — a save can overwrite it when the user owns it. */
  activeView: string;
  onViewSaved: (view: TicketView) => void;
  onReorderSorts: (order: (keyof Ticket)[]) => void;
  onClearSorts: () => void;
  /** Current list grouping label, or null when ungrouped. */
  listGroupLabel?: string | null;
  view: 'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar' | 'gantt' | 'tiles';
  setView: (v: 'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar' | 'gantt' | 'tiles') => void;
  dashScope: 'all' | 'mine';
  /** false hides the Overall/My switch (asset registers are always overall) and
      shows a quiet dashboard byline in its place so the row stays anchored. */
  dashScopeSwitch?: boolean;
  /** false drops the filter bar's Assignee / SLA / Priority quick filters. */
  showQuickFilters?: boolean;
  /** false drops the filter bar's rule builder ("Filters" + its picker), keeping the quick
      filters and their chips. */
  showFilterBuilder?: boolean;
  /** false drops the gear menu's Columns row and its reset — for a listing whose column
      set is fixed by the module rather than chosen by the reader. */
  allowColumnEdit?: boolean;
  /** The module's own quick filters — see QuickFilterDef in TicketFilterBar. */
  quickFilters?: React.ComponentProps<typeof TicketFilterBar>['quickFilters'];
  /** The module's filter attribute catalog (defaults to the request set). */
  filterAttrs?: React.ComponentProps<typeof TicketFilterBar>['attrs'];
  setDashScope: (s: 'all' | 'mine') => void;
  /** Offer the prototype Calendar layout (Views Lab only). */
  showCalendar?: boolean;
  /** Offer the Gantt timeline layout (Release listing only). */
  showGantt?: boolean;
  /** Offer the Tiles layout — the same rows as cards. */
  showTiles?: boolean;
  kanbanGroup: KanbanGroup;
  setKanbanGroup: (g: KanbanGroup) => void;
  kanbanSubGroup: KanbanGroup | null;
  setKanbanSubGroup: (g: KanbanGroup | null) => void;
  cardFields: string[];
  setCardFields: (f: string[]) => void;
  /** What one record is called — the Change listing renders this toolbar as "changes". */
  noun?: string;
  /** Which module's saved-view storage the Save-view actions write to. */
  viewsStore?: ViewStore;
  /** Restrict the layout picker — the Asset listing offers list + list-kpi only. */
  layouts?: ('list' | 'list-kpi' | 'kanban' | 'dashboard')[];
  /** Asset registers scan and print labels from the listing — barcode tools sit ahead
      of the export controls, the way the product groups them. */
  showBarcodeTools?: boolean;
  /** The page's create action, rendered as a filled button before the ⋮ menu. */
  primaryAction?: { label: string; onClick?: () => void };
  /** The module's own ⋮ menu items, replacing the default Import entries. */
  /** The ⋮ menu's items. An empty array hides the ⋮ button itself. */
  /** `onSelect` lets the module handle its own item — it receives the ⋮ button's rect so a
      panel can open anchored to it. Without one the item toasts, as before. */
  moreActions?: { key: string; label: string; icon: typeof Import; onSelect?: (anchor: DOMRect) => void }[];
  /** Cuts the right-hand rail down to Export + Refresh (My Approvals): an approver
      reads the queue and decides — layout, sort, auto-refresh and import are not
      theirs to set, and the status cards already carry the only cuts that matter. */
  minimalTools?: boolean;
  /** Controls this module has no use for. A knowledge base is read and written, not
      exported or polled, so it drops those two rather than carrying buttons nobody presses. */
  hideTools?: ('export' | 'refresh' | 'settings')[];
}) {
  // Search stays collapsed to an icon until used — it costs nothing at rest and
  // expands in place, so the toolbar never carries a permanently empty field.
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Merged Export + Download popup (one icon, two tabs — Download lands first).
  const [expOpen, setExpOpen] = useState(false);
  // Minimal rail calls the control "Export", so the popup opens on that tab.
  const [expTab, setExpTab] = useState<'download' | 'export'>(minimalTools ? 'export' : 'download');
  const [expFormat, setExpFormat] = useState<'Excel' | 'CSV'>('Excel');
  const [expPw, setExpPw] = useState(false);
  const [expShowPw, setExpShowPw] = useState(false);
  const [expPassword, setExpPassword] = useState('');
  const [expQuery, setExpQuery] = useState('');
  const [expFields, setExpFields] = useState<string[]>(EXPORT_DEFAULTS);
  const expBtnRef = useRef<HTMLButtonElement>(null);
  const expWrapRef = useRef<HTMLDivElement>(null);
  const expPopRef = useRef<HTMLDivElement>(null);
  const [expMaxH, setExpMaxH] = useState(520);
  const [expPos, setExpPos] = useState({ top: 0, right: 0 });
  const expQ = expQuery.trim().toLowerCase();
  const expShown = EXPORT_FIELDS.filter((fl) => !expQ || fl.toLowerCase().includes(expQ));
  const expAllOn = expShown.length > 0 && expShown.every((fl) => expFields.includes(fl));
  useEffect(() => {
    if (!expOpen) return;
    const fit = () => {
      const r = expBtnRef.current?.getBoundingClientRect();
      if (!r) return;
      setExpPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
      // 6px popup offset + 16px breathing room above the window edge.
      setExpMaxH(Math.max(260, window.innerHeight - r.bottom - 24));
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', fit, true);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('scroll', fit, true);
    };
  }, [expOpen, expTab]);
  // Save view — appears once the grid has been narrowed, mirroring Save Search.
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const savePopRef = useRef<HTMLDivElement>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveVis, setSaveVis] = useState<'My Self' | 'All Technician' | 'Technician In Group'>('My Self');
  const [saveGroup, setSaveGroup] = useState('');
  const [savePos, setSavePos] = useState({ top: 0, left: 0 });
  /* The copy's noun, capitalised where a label needs it. */
  const ns = `${noun}s`;
  const hidden = (t: 'export' | 'refresh' | 'settings') => !!hideTools?.includes(t);
  /* The layouts THIS module offers — the shared four narrowed by `layouts`, plus the two
     opt-in extras. Computed once: the gear menu both renders it and decides, from its
     length, whether a picker is worth showing. */
  const layoutTiles = [
    ...LAYOUTS.filter((l) => !layouts || layouts.includes(l.key)),
    ...(showTiles ? [TILES_LAYOUT] : []),
    ...(showCalendar ? [CALENDAR_LAYOUT] : []),
    ...(showGantt ? [GANTT_LAYOUT] : []),
  ];
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const canUpdate = isMyCustomView(activeView, viewsStore);
  /* Default layout — a module remembers how you like to SEE it, the same way the
     views rail remembers a default view. Stored per module so Requests can open
     on Kanban while Contracts opens on List + KPI. */
  const layoutKey = `${viewsStore}LayoutDefault`;
  const [defaultLayout, setDefaultLayout] = useState<string | null>(() => {
    try {
      return localStorage.getItem(layoutKey);
    } catch {
      return null;
    }
  });
  const pinLayout = (key: string) => {
    const next = defaultLayout === key ? null : key;
    setDefaultLayout(next);
    try {
      if (next) localStorage.setItem(layoutKey, next);
      else localStorage.removeItem(layoutKey);
    } catch { /* private mode — the choice just won't survive the session */ }
    toast.success(next ? `${LAYOUT_LABEL[key] ?? key} is now the default for ${ns}` : 'Default layout cleared');
  };
  /* Land on the remembered layout when the module opens — once, and only if this
     page still offers it. */
  const layoutRestored = useRef(false);
  useEffect(() => {
    if (layoutRestored.current) return;
    layoutRestored.current = true;
    if (!defaultLayout || defaultLayout === view) return;
    const offered =
      (LAYOUTS.some((l) => l.key === defaultLayout) && (!layouts || layouts.includes(defaultLayout as 'list'))) ||
      (defaultLayout === 'calendar' && showCalendar) ||
      (defaultLayout === 'tiles' && showTiles) ||
      (defaultLayout === 'gantt' && showGantt);
    if (offered) setView(defaultLayout as typeof view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* The AI grouping menu — labels must match the grid registry's labels (checks),
     keys must match its axis keys (the set-group-by event). */
  const AI_GROUP_MENU = [
    { key: 'similarity', label: 'Similarity', tip: `Stacks ${ns} that share one underlying cause, so you can merge them or raise a problem instead of working each one.` },
    { key: 'efforts', label: 'Efforts', tip: `Bands ${ns} by estimated effort — start with Quick Resolve and clear a run of sub-20-minute wins in one sitting.` },
    { key: 'breachRisk', label: 'SLA Breach Risk', tip: `Forecasts which ${ns} will miss SLA — time left weighed against estimated effort — so you start the ones that can still be saved.` },
    { key: 'sentiment', label: 'Sentiment', tip: `Reads each conversation's tone and surfaces frustrated requesters before they escalate.` },
    { key: 'automation', label: 'Automation', tip: `Flags ${ns} the bot can close on its own, with an AI draft ready for the rest.` },
  ];
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const isList = view === 'list' || view === 'list-kpi';
  useEffect(() => {
    if (!saveOpen) return;
    setSaveName('');
    const r = saveBtnRef.current?.getBoundingClientRect();
    if (r) setSavePos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 372) });
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (saveBtnRef.current?.contains(t) || savePopRef.current?.contains(t)) return;
      setSaveOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveOpen]);

  /** Persist the CURRENT filters as a view — new when saving as, in place when updating. */
  const commitView = (mode: 'saveAs' | 'update') => {
    const name = mode === 'update' ? activeView : saveName.trim();
    if (mode === 'saveAs' && saveVis === 'Technician In Group' && !saveGroup) return;
    if (!name) return;
    const prev = mode === 'update' ? loadCustomViews(viewsStore).find((v) => v.name === name) : undefined;
    const view: TicketView = {
      name,
      rules: rules.map(({ field, condition, values }) => ({ field, condition, values })),
      custom: true,
      owner: CURRENT_USER,
      visibility: mode === 'update' ? (prev?.visibility ?? 'My Self') : saveVis,
      ...(mode === 'update'
        ? prev?.group
          ? { group: prev.group }
          : {}
        : saveVis === 'Technician In Group'
          ? { group: saveGroup }
          : {}),
    };
    upsertCustomView(view, viewsStore);
    onViewSaved(view);
    setSaveOpen(false);
    toast.success(mode === 'update' ? `“${name}” updated` : `“${name}” saved`);
  };

  const [sortQuery, setSortQuery] = useState('');
  const [sortDrag, setSortDrag] = useState<string | null>(null);
  const [sortOver, setSortOver] = useState<string | null>(null);
  const [gearOpen, setGearOpen] = useState(false);
  // The gear opens as the view switcher; "Group by" swaps the card in place.
  const [gearView, setGearView] = useState<'main' | 'group' | 'subgroup'>('main');
  const [fieldMgr, setFieldMgr] = useState<{ right: number; bottom: number } | null>(null);
  // Mirrors the grid's visible-column set so the row states what it opens onto.
  const [gridCols, setGridCols] = useState<{ key: string; label: string; sortField?: string }[]>([]);
  useEffect(() => {
    const onCols = (e: Event) => setGridCols(((e as CustomEvent).detail as { key: string; label: string; sortField?: string }[]) ?? []);
    window.addEventListener('grid-columns', onCols as EventListener);
    return () => window.removeEventListener('grid-columns', onCols as EventListener);
  }, []);
  /* You can only sort by what the grid is SHOWING — offering the request module's eight
     fields on a CMDB or a knowledge listing sorted by columns that were not on screen. The
     grid publishes its own columns and the field each one sorts on; the request set is the
     fallback for the moment before the first of those events arrives. */
  const sortable: { field: keyof Ticket; label: string }[] = gridCols.length
    ? gridCols.filter((c) => c.sortField).map((c) => ({ field: c.sortField as keyof Ticket, label: c.label }))
    : SORTABLE;
  // The group list mirrors the grid, so it needs a search once many columns are shown.
  const [groupQuery, setGroupQuery] = useState('');
  const [spinning, setSpinning] = useState(false);

  const sortRef = useOutside<HTMLDivElement>(sortOpen, () => setSortOpen(false));
  const gearRef = useOutside<HTMLDivElement>(gearOpen, () => setGearOpen(false));
  const moreRef = useOutside<HTMLDivElement>(moreOpen, () => setMoreOpen(false));
  const saveMenuRef = useOutside<HTMLDivElement>(saveMenuOpen, () => setSaveMenuOpen(false));
  const [autoRef, setAutoRef] = useState('5m');
  const [autoRefOpen, setAutoRefOpen] = useState(false);
  const autoRefRef = useOutside<HTMLDivElement>(autoRefOpen, () => setAutoRefOpen(false));
  useEffect(() => {
    if (!expOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (expWrapRef.current?.contains(t) || expPopRef.current?.contains(t)) return;
      setExpOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [expOpen]);

  const refresh = () => {
    setSpinning(true);
    window.setTimeout(() => setSpinning(false), 700);
    toast.success(`${Noun}s refreshed`);
  };

  useEffect(() => {
    // No interval control on the minimal rail, so nothing silently ticks behind it.
    if (minimalTools || autoRef === 'Off') return;
    const t = window.setInterval(() => {
      setSpinning(true);
      window.setTimeout(() => setSpinning(false), 700);
    }, AUTO_REF_MS[autoRef]);
    return () => window.clearInterval(t);
  }, [autoRef]);

  return (
    <div className="flex items-start gap-2 pb-2.5 pl-6 pr-4">
      {/* ── Left: find and narrow. Search sits OUTSIDE the wrapping group so the second
           row of chips starts under the first chip, not under the search. ── */}
      {/* Searching rows has nothing to act on in the dashboard. */}
      {view === 'dashboard' ? null : searchOpen || searchQuery ? (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => !searchQuery && setSearchOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                setSearchOpen(false);
              }
            }}
            placeholder={`Search ${ns}...`}
            className="h-8 w-[260px] rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#364658]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => setSearchOpen(true)} className={ICON_BTN} title="Search">
          <Search size={16} />
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pr-11">
      {/* The dashboard scopes itself with the Overall/Mine switch instead of ad-hoc filter
          rules — two ways to narrow the same charts would contradict each other, and a
          filtered dashboard with the filter row hidden would be a silent lie. */}
      {view === 'dashboard' && !dashScopeSwitch ? (
        /* No scope to switch — the register is always overall. A quiet byline
           holds the slot and teaches the one interaction the page has. */
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2.5">
          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#EAF2FB]">
            <LayoutDashboard size={14} className="text-[#3D8BD0]" />
          </span>
          <span className="text-[13px] font-medium text-[#364658]">{Noun} overview</span>
          <span className="h-3.5 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <span className="truncate text-[12px] text-[#94A3B8]">
            Snapshot of every {noun} — click any chart to drill into the list
          </span>
        </div>
      ) : view === 'dashboard' ? (
        <div className="flex flex-shrink-0 items-center gap-0.5 rounded border border-[#DFE5ED] bg-[#F8FAFC] p-0.5">
          {([
            { key: 'all', label: 'Overall view', Icon: Users, hint: `Every ${noun} across the desk` },
            { key: 'mine', label: 'My view', Icon: UserRound, hint: `Only ${ns} assigned to ${CURRENT_USER}` },
          ] as const).map((o) => {
            const on = dashScope === o.key;
            return (
              <Tooltip key={o.key} delayDuration={400}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDashScope(o.key)}
                    className={`inline-flex h-7 items-center gap-1.5 rounded px-3 text-[12px] font-medium transition-colors ${
                      on ? 'bg-white text-[#3D8BD0] shadow-sm' : 'text-[#64748B] hover:text-[#364658]'
                    }`}
                  >
                    <o.Icon size={13} className="flex-shrink-0" />
                    {o.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{o.hint}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ) : (
        <TicketFilterBar rules={rules} setRules={setRules} noun={noun} showQuickFilters={showQuickFilters} showFilterBuilder={showFilterBuilder} quickFilters={quickFilters} attrs={filterAttrs} />
      )}

      {saveOpen &&
        createPortal(
          <div
            ref={savePopRef}
            style={{ top: savePos.top, left: savePos.left }}
            className="app-menu fixed z-[9999] w-[360px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white p-4 shadow-xl"
          >
            <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">
              Save view <span className="text-[#EF4444]">*</span>
            </label>
            <input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName.trim() && commitView('saveAs')}
              placeholder="Name"
              className="mb-4 h-9 w-full rounded border border-[#DFE5ED] px-2.5 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">Visibility</label>
            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {(['My Self', 'All Technician', 'Technician In Group'] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    setSaveVis(o);
                    if (o !== 'Technician In Group') setSaveGroup('');
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <span className={`flex size-4 items-center justify-center rounded-full border-2 transition-colors ${saveVis === o ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>
                    {saveVis === o && <span className="size-2 rounded-full bg-[#3D8BD0]" />}
                  </span>
                  <span className="text-[13px] text-[#364658]">{o}</span>
                </button>
              ))}
            </div>
            {saveVis === 'Technician In Group' && (
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">
                  Group <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={saveGroup}
                  onChange={(e) => setSaveGroup(e.target.value)}
                  className="app-select h-9 w-full rounded border border-[#DFE5ED] bg-white pl-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                >
                  <option value="">Select group</option>
                  {TECH_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-[#F0F1F3] pt-3">
              <button
                disabled={!saveName.trim() || (saveVis === 'Technician In Group' && !saveGroup)}
                onClick={() => commitView('saveAs')}
                className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setSaveOpen(false)}
                className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}

      </div>

      {/* ── Right: refresh, sort, display — never pushed to a second row ── */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {(rules.length > 0 || sorts.length > 0) && (
          <div className="relative" ref={saveMenuRef}>
            <button
              ref={saveBtnRef}
              onClick={() => setSaveMenuOpen((v) => !v)}
              className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${
                saveMenuOpen ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'
              }`}
            >
              <Bookmark size={14} />
              Save
              <ChevronDown size={13} className={`transition-transform ${saveMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {saveMenuOpen && (
              <div className={`${POPUP} w-[208px] py-1`}>
                <button
                  disabled={!canUpdate}
                  title={canUpdate ? undefined : 'Only your own saved views can be updated'}
                  onClick={() => {
                    setSaveMenuOpen(false);
                    commitView('update');
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#B6C2D1] disabled:hover:bg-white"
                >
                  Update this view
                </button>
                <button
                  onClick={() => {
                    setSaveMenuOpen(false);
                    setSaveOpen(true);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                >
                  Create as a new view
                </button>
              </div>
            )}
          </div>
        )}
        {/* Label tools — generate a barcode for the selected assets, or scan one to jump
            straight to a record. Ahead of the export controls, as the product groups them. */}
        {showBarcodeTools && isList && (
        <>
          {([
            { key: 'generate', label: 'Generate Barcode', Icon: Barcode },
            { key: 'scan-bar', label: 'Scan Barcode', Icon: ScanBarcode },
            { key: 'scan-qr', label: 'Scan QR Code', Icon: ScanQrCode },
          ] as const).map(({ key, label, Icon }) => (
            <Tooltip key={key} delayDuration={400}>
              <TooltipTrigger asChild>
                <button onClick={() => toast(`${label} — coming soon`)} className={ICON_BTN}>
                  <Icon size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </>
        )}

        {/* Export + Download — merged into ONE control (the Report page pattern): two tabs in
            one popup instead of two near-identical icons the user has to choose between. */}
        {/* Exporting rows is a list action — no rows to export on a board or a dashboard. */}
        {isList && !hidden('export') && (
        <div className="relative" ref={expWrapRef}>
          <button
            ref={expBtnRef}
            onClick={() => setExpOpen((v) => !v)}
            className={`${ICON_BTN} ${expOpen ? '!border-[#3D8BD0] !bg-[#EBF5FF] !text-[#3D8BD0]' : ''}`}
            title={minimalTools ? 'Export' : 'Export / Download'}
          >
            {/* The product's own Export glyph (the Vulnerabilities/CVE toolbars use it);
                the merged control keeps the tray arrow where Download leads. */}
            {minimalTools ? <FileOutput size={16} /> : <Download size={16} />}
          </button>
          {expOpen && createPortal(
            <div
              ref={expPopRef}
              className="app-menu fixed z-[9999] flex w-[360px] flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
              style={{ top: expPos.top, right: expPos.right, maxHeight: expMaxH }}
            >
              <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-[#E5E7EB] px-4">
                {(['download', 'export'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setExpTab(t)}
                    className={`border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors ${expTab === t ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'}`}
                  >
                    {t === 'download' ? 'Download' : 'Export'}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Pinned controls: Format, search and Select-all ride in ONE sticky
                    wrapper, so the band never needs a hand-measured top offset. */}
                <div className="sticky top-0 z-20 bg-white">
                  <div className="px-4 pb-4 pt-4">
                    <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">Format</label>
                    <div className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
                      {(['Excel', 'CSV'] as const).map((fm) => (
                        <button
                          key={fm}
                          onClick={() => {
                            setExpFormat(fm);
                            if (fm === 'CSV') { setExpPw(false); setExpPassword(''); }
                          }}
                          className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${expFormat === fm ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}
                        >
                          {fm}
                        </button>
                      ))}
                    </div>
                  </div>
                  {expTab === 'export' && (
                    <>
                      <div className="px-4 pb-2">
                        <div className="relative">
                          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            value={expQuery}
                            onChange={(e) => setExpQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setExpQuery('')}
                            placeholder="Search fields..."
                            className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 border-y border-[#F0F2F5] bg-[#F8FAFC] px-4 py-2">
                        <input
                          type="checkbox"
                          checked={expAllOn}
                          onChange={() =>
                            setExpFields((prev) =>
                              expAllOn ? prev.filter((fl) => !expShown.includes(fl)) : Array.from(new Set([...prev, ...expShown])),
                            )
                          }
                          className="flex-shrink-0"
                        />
                        <span className="flex-1 text-[13px] font-medium text-[#364658]">Select all fields</span>
                        <span className="text-[11px] text-[#7B8FA5]">{expFields.length} selected</span>
                      </label>
                    </>
                  )}
                </div>

                {/* Export tab picks the COLUMNS that travel; Download takes the grid as shown. */}
                {expTab === 'export' && (
                  <div className="px-2 py-1">
                    {expShown.map((fl) => (
                      <label key={fl} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[#F9FAFB]">
                        <input
                          type="checkbox"
                          checked={expFields.includes(fl)}
                          onChange={() =>
                            setExpFields((prev) => (prev.includes(fl) ? prev.filter((x) => x !== fl) : [...prev, fl]))
                          }
                          className="flex-shrink-0"
                        />
                        <span className="flex-1 truncate text-[13px] text-[#364658]">{fl}</span>
                      </label>
                    ))}
                    {expShown.length === 0 && (
                      <div className="px-2 py-5 text-center text-[12px] text-[#9CA3AF]">No fields match “{expQuery.trim()}”</div>
                    )}
                  </div>
                )}
              </div>
              {expFormat !== 'CSV' && (
                <div className="flex-shrink-0 border-t border-[#F0F1F3] px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#364658]">
                      <Lock size={13} className="text-[#7B8FA5]" />
                      Password Protected
                    </span>
                    <button
                      onClick={() => setExpPw((v) => !v)}
                      role="switch"
                      aria-checked={expPw}
                      className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${expPw ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}
                    >
                      <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${expPw ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                  {expPw && (
                    <div className="relative mt-2">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type={expShowPw ? 'text' : 'password'}
                        value={expPassword}
                        onChange={(e) => setExpPassword(e.target.value)}
                        placeholder="Attachment Password"
                        className="w-full rounded border border-[#DFE5ED] py-2 pl-9 pr-9 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                      />
                      <button onClick={() => setExpShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]">
                        {expShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#F0F1F3] px-4 py-3">
                  <button
                    disabled={expTab === 'export' && expFields.length === 0}
                    onClick={() => {
                      toast.success(
                        expTab === 'download'
                          ? `Downloading requests as ${expFormat}`
                          : `Exporting ${expFields.length} field${expFields.length > 1 ? 's' : ''} as ${expFormat}`,
                      );
                      setExpOpen(false);
                    }}
                    className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {expTab === 'download' ? 'Download' : 'Export'}
                  </button>
                  <button
                    onClick={() => setExpOpen(false)}
                    className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                  >
                    Cancel
                  </button>
              </div>
            </div>,
            document.body,
          )}
        </div>
        )}

        {/* Refresh + auto-refresh interval merged into one split control (Dashboard pattern) —
            minimal rail drops the interval and keeps the plain button. */}
        {hidden('refresh') ? null : minimalTools ? (
          <button onClick={refresh} className={ICON_BTN} title="Refresh">
            <RefreshCw size={16} className={spinning ? 'animate-spin' : ''} />
          </button>
        ) : (
        <div className="relative" ref={autoRefRef}>
          <div className="inline-flex h-8 items-stretch overflow-hidden rounded border border-[#DFE5ED] bg-white">
            <button
              onClick={refresh}
              className="inline-flex w-8 items-center justify-center text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
              title="Refresh"
            >
              <RefreshCw size={16} className={spinning ? 'animate-spin' : ''} />
            </button>
            <span className="w-px flex-shrink-0 bg-[#E5E7EB]" />
            <button
              onClick={() => setAutoRefOpen((v) => !v)}
              className="inline-flex items-center gap-0.5 pl-2 pr-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              title="Auto refresh interval"
            >
              {autoRef === 'Off' ? 'None' : autoRef}
              <ChevronDown size={13} className={`transition-transform ${autoRefOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {autoRefOpen && (
            <div className={`${POPUP} w-[124px] py-1`}>
              <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Auto refresh</div>
              {AUTO_REF_OPTS.map((o) => {
                const on = o.key === autoRef;
                return (
                  <button
                    key={o.key}
                    onClick={() => {
                      setAutoRef(o.key);
                      setAutoRefOpen(false);
                      toast.success(o.key === 'Off' ? 'Auto refresh turned off' : `Auto refresh every ${o.label.toLowerCase()}`);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors ${
                      on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {o.label}
                    {on && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Exporting rows and column sorting mean nothing on a dashboard. */}
        {!minimalTools && view !== 'dashboard' && view !== 'calendar' && view !== 'gantt' && (
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className={`${ICON_BTN} ${sorts.length ? '!border-[#3D8BD0] !bg-[#EBF5FF] !text-[#3D8BD0]' : ''}`}
            title="Sort"
          >
            <ArrowUpDown size={16} />
          </button>
          {sortOpen && (
            <div className={`${POPUP} w-[288px]`}>
              {(() => {
                const q = sortQuery.trim().toLowerCase();
                const match = (label: string) => !q || label.toLowerCase().includes(q);
                /* Applied sorts keep CHAIN order (first breaks ties first); the rest stay in
                   catalog order so the list never reshuffles while you read it. */
                const chosen = sorts
                  .map((entry) => ({ entry, meta: sortable.find((s) => s.field === entry.column) }))
                  .filter((r) => r.meta && match(r.meta.label));
                const rest = sortable.filter((s) => !sorts.some((x) => x.column === s.field) && match(s.label));

                const drop = (target: string) => {
                  if (!sortDrag || sortDrag === target) return;
                  const order = sorts.map((s) => String(s.column));
                  const from = order.indexOf(sortDrag);
                  const to = order.indexOf(target);
                  if (from < 0 || to < 0) return;
                  order.splice(to, 0, ...order.splice(from, 1));
                  onReorderSorts(order as (keyof Ticket)[]);
                };

                return (
                  <>
                    {/* Search — the Filters-dropdown recipe, so both menus read the same. */}
                    <div className="border-b border-[#F0F2F5] p-2">
                      <div className="relative">
                        <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                          autoFocus
                          value={sortQuery}
                          onChange={(e) => setSortQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Escape' && setSortQuery('')}
                          placeholder="Search columns..."
                          className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto py-1">
                      {chosen.length > 0 && (
                        <>
                          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            Selected sort
                          </div>
                          {chosen.map(({ entry, meta }) => (
                            <div
                              key={String(entry.column)}
                              draggable
                              onDragStart={() => setSortDrag(String(entry.column))}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setSortOver(String(entry.column));
                              }}
                              onDrop={() => {
                                drop(String(entry.column));
                                setSortDrag(null);
                                setSortOver(null);
                              }}
                              onDragEnd={() => {
                                setSortDrag(null);
                                setSortOver(null);
                              }}
                              className={`group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[#F9FAFB] ${sortDrag === String(entry.column) ? 'opacity-40' : ''} ${sortOver === String(entry.column) && sortDrag !== String(entry.column) ? 'border-t-2 border-[#3D8BD0]' : 'border-t-2 border-transparent'}`}
                            >
                              <GripVertical size={13} className="flex-shrink-0 cursor-grab text-[#CBD5E1] group-hover:text-[#94A3B8]" />
                              <input
                                type="checkbox"
                                checked
                                onChange={() => onRemoveSort(entry.column)}
                                className="flex-shrink-0"
                              />
                              <span className="flex-1 truncate text-[13px] font-medium text-[#364658]">{meta!.label}</span>
                              {/* One click flips this column between ascending and descending. */}
                              <button
                                onClick={() => onSort(entry.column, entry.dir === 'asc' ? 'desc' : 'asc')}
                                className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#EBF5FF] hover:text-[#3D8BD0]"
                                title={entry.dir === 'asc' ? 'Ascending — click for descending' : 'Descending — click for ascending'}
                              >
                                {entry.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                              </button>
                            </div>
                          ))}
                          {rest.length > 0 && <div className="my-1.5 border-t border-[#F0F2F5]" />}
                        </>
                      )}

                      {/* Available columns — ticking one moves it up into the chain. */}
                      {rest.map((s) => (
                        <button
                          key={String(s.field)}
                          onClick={() => onSort(s.field, 'asc')}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[#F9FAFB]"
                        >
                          <input type="checkbox" checked={false} readOnly className="pointer-events-none flex-shrink-0" />
                          <span className="flex-1 truncate text-[13px] text-[#64748B]">{s.label}</span>
                        </button>
                      ))}

                      {chosen.length === 0 && rest.length === 0 && (
                        <div className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">No columns match “{sortQuery.trim()}”</div>
                      )}
                    </div>
                  </>
                );
              })()}
              {sorts.length > 0 && (
                <div className="border-t border-[#F0F2F5] px-3 py-2">
                  <button
                    onClick={() => {
                      onClearSorts();
                      setSortQuery('');
                      setSortOpen(false);
                    }}
                    className="text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
                  >
                    Clear sorting
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {!minimalTools && !hidden('settings') && (
        <div className="relative" ref={gearRef}>
          <button
            onClick={() => {
              setGearOpen((v) => !v);
              setGearView('main');
            }}
            className={ICON_BTN}
            title="View settings"
          >
            <Settings2 size={16} />
          </button>
          {gearOpen && (
            <div className={`${POPUP} w-[280px]`}>
              {gearView === 'main' ? (
                <>
                  {/* Layout tiles sit UPFRONT — switching view is the most common thing this
                      menu is opened for, and hiding four options behind a fifth click was a
                      hop nobody needed. Picking one keeps the menu open: the highlight moves,
                      the page changes behind it, and the other settings stay in reach.
                      A module with only ONE layout shows no picker at all: a chooser with a
                      single choice is furniture. */}
                  {layoutTiles.length > 1 && (
                  <>
                  <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                    Layout
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
                    {layoutTiles.map(({ key, label, Icon }) => {
                      const isDefault = defaultLayout === key;
                      return (
                      <div key={key} className="group/lay relative">
                        <Tooltip delayDuration={400}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setView(key)}
                              className={`flex w-full flex-col items-center gap-1.5 rounded border py-2.5 text-[12px] font-medium transition-colors ${
                                view === key
                                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                                  : 'border-transparent bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#364658]'
                              }`}
                            >
                              <Icon size={17} />
                              {label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Switch to the {label} layout</TooltipContent>
                        </Tooltip>
                        {/* Pin = "open this module here next time". A fixed slot (invisible,
                            never removed) so tiles never resize; the pinned one stays lit. */}
                        <Tooltip delayDuration={400}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); pinLayout(key); }}
                              className={`absolute right-1 top-1 flex size-5 items-center justify-center rounded transition-colors ${
                                isDefault
                                  ? 'text-[#3D8BD0] hover:bg-white/70'
                                  : 'invisible text-[#9CA3AF] hover:bg-white/70 hover:text-[#3D8BD0] group-hover/lay:visible'
                              }`}
                            >
                              <Pin size={14} className={isDefault ? 'fill-current' : ''} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isDefault ? `Default for ${ns} — click to unpin` : `Make ${label} the default for ${ns}`}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-[#F0F2F5]" />
                  </>
                  )}
                  {view === 'kanban' && (
                    <button
                      onClick={() => setGearView('group')}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <Columns3 size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                      <span className="flex-1 text-[13px] text-[#364658]">Group by</span>
                      <span className="text-[13px] font-medium text-[#3D8BD0]">
                        {KANBAN_GROUPS.find((g) => g.key === kanbanGroup)?.label}
                      </span>
                      <ChevronRight size={14} className="text-[#9CA3AF]" />
                    </button>
                  )}
                  {view === 'kanban' && (
                    <button
                      onClick={() => setGearView('subgroup')}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <Rows3 size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                      <span className="flex-1 text-[13px] text-[#364658]">Sub group</span>
                      {kanbanSubGroup ? (
                        <span className="text-[13px] font-medium text-[#3D8BD0]">
                          {KANBAN_GROUPS.find((g) => g.key === kanbanSubGroup)?.label}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#94A3B8]">None</span>
                      )}
                      <ChevronRight size={14} className="text-[#9CA3AF]" />
                    </button>
                  )}
                  {view === 'kanban' && (
                    <button
                      onClick={() => {
                        const r = gearRef.current?.getBoundingClientRect();
                        setGearOpen(false);
                        if (r) setFieldMgr({ right: r.right, bottom: r.bottom });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <Columns3 size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                      <span className="flex-1 text-[13px] text-[#364658]">Card fields</span>
                      {cardFields.length ? (
                        <span className="text-[13px] font-medium text-[#3D8BD0]">{cardFields.length} shown</span>
                      ) : (
                        <span className="text-[13px] text-[#94A3B8]">None</span>
                      )}
                      <ChevronRight size={14} className="text-[#9CA3AF]" />
                    </button>
                  )}
                  {isList && (
                    <button
                      onClick={() => {
                        setGroupQuery('');
                        setGearView('group');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <Columns3 size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                      <span className="flex-1 text-[13px] text-[#364658]">Group by</span>
                      {listGroupLabel ? (
                        <span className="text-[13px] font-medium text-[#3D8BD0]">{listGroupLabel}</span>
                      ) : (
                        <span className="text-[13px] text-[#9CA3AF]">None</span>
                      )}
                      <ChevronRight size={14} className="text-[#9CA3AF]" />
                    </button>
                  )}
                  {isList && allowColumnEdit && (
                  <button
                    onClick={() => {
                      // The grid owns the column manager; the toolbar just asks for it.
                      window.dispatchEvent(new CustomEvent('open-column-manager'));
                      setGearOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                  >
                    <Settings2 size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                    <span className="flex-1 text-[13px] text-[#364658]">Columns</span>
                    {gridCols.length > 0 && (
                      <span className="text-[13px] font-medium text-[#3D8BD0]">{gridCols.length} selected</span>
                    )}
                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                  </button>
                  )}
                  {isList && allowColumnEdit && (
                    <>
                  <div className="border-t border-[#F0F2F5]" />
                  <button
                    onClick={() => {
                      localStorage.removeItem('ticketListColumnsV2');
                      toast.success('Columns reset to default — reloading');
                      window.setTimeout(() => window.location.reload(), 600);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#64748B] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]"
                  >
                    Reset columns to default
                  </button>
                    </>
                  )}
                </>
              ) : gearView === 'subgroup' ? (
                <>
                  <div className="flex items-center gap-1.5 border-b border-[#F0F2F5] px-2 py-2">
                    <button
                      onClick={() => setGearView('main')}
                      className="flex size-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-[13px] font-semibold text-[#1E293B]">Sub group</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setKanbanSubGroup(null);
                        setGearView('main');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                    >
                      <span className="flex-1">None</span>
                      {!kanbanSubGroup && <Check size={14} className="text-[#3D8BD0]" />}
                    </button>
                    {/* The column axis cannot also be the lane axis. */}
                    {KANBAN_GROUPS.filter((g) => g.key !== kanbanGroup).map((g) => (
                      <button
                        key={g.key}
                        onClick={() => {
                          setKanbanSubGroup(g.key);
                          setGearView('main');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                      >
                        <span className="flex-1 truncate">{g.label}</span>
                        {kanbanSubGroup === g.key && <Check size={14} className="flex-shrink-0 text-[#3D8BD0]" />}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 border-b border-[#F0F2F5] px-2 py-2">
                    <button
                      onClick={() => setGearView('main')}
                      className="flex size-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-[13px] font-semibold text-[#1E293B]">Group by</span>
                  </div>
                  {isList && gridCols.length > 7 && (
                    <div className="border-b border-[#F0F2F5] p-2">
                      <input
                        autoFocus
                        value={groupQuery}
                        onChange={(e) => setGroupQuery(e.target.value)}
                        placeholder="Search columns..."
                        className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}
                  <div className="max-h-[300px] overflow-y-auto py-1">
                    {isList ? (
                      <>
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('set-group-by', { detail: null }));
                            setGearView('main');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                        >
                          <span className="flex-1">None</span>
                          {!listGroupLabel && <Check size={14} className="text-[#3D8BD0]" />}
                        </button>
                        {/* The AI axes are not columns — they answer a different question
                            from the field groupings, so they live in ONE softly AI-tinted
                            zone (4% product gradient). The rows render from AI_GROUP_MENU:
                            a future axis is one more entry here + one registry entry in
                            the grid — the zone grows, the visual weight doesn't. */}
                        {noun === 'request' && AI_GROUP_MENU.some((o) => o.label.toLowerCase().includes(groupQuery.trim().toLowerCase())) && (
                          <div
                            className="mx-1.5 my-1 overflow-hidden rounded-md pb-1"
                            style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.04) 0%, rgba(115, 30, 251, 0.04) 41.49%, rgba(249, 17, 227, 0.04) 100%), #FFF' }}
                          >
                            <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                              <AiSparkle size={12} className="flex-shrink-0" />
                              AI Grouping
                            </div>
                            {AI_GROUP_MENU.filter((o) => o.label.toLowerCase().includes(groupQuery.trim().toLowerCase())).map((o) => (
                              <button
                                key={o.key}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('set-group-by', { detail: o.key }));
                                  setGearView('main');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-white/70"
                              >
                                <span className="truncate">{o.label}</span>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex size-5 flex-shrink-0 cursor-default items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-white/70 hover:text-[#64748B]"
                                    >
                                      <Info size={13} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" sideOffset={10} className="max-w-[248px] text-wrap">
                                    {o.tip}
                                  </TooltipContent>
                                </Tooltip>
                                <span className="flex-1" />
                                {listGroupLabel === o.label && <Check size={14} className="flex-shrink-0 text-[#3D8BD0]" />}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Group by any column currently in the grid. */}
                        {gridCols
                          .filter((c) => c.key !== 'id' && c.key !== 'subject')
                          .some((c) => c.label.toLowerCase().includes(groupQuery.trim().toLowerCase())) && (
                          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            Fields
                          </div>
                        )}
                        {gridCols
                          // ID and Subject are unique per request — never groupable.
                          .filter((c) => c.key !== 'id' && c.key !== 'subject')
                          .filter((c) => c.label.toLowerCase().includes(groupQuery.trim().toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.key}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('set-group-by', { detail: c.key }));
                                setGearView('main');
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                            >
                              <span className="flex-1 truncate">{c.label}</span>
                              {listGroupLabel === c.label && <Check size={14} className="flex-shrink-0 text-[#3D8BD0]" />}
                            </button>
                          ))}
                      </>
                    ) : (
                      KANBAN_GROUPS.map((g) => (
                        <button
                          key={g.key}
                          onClick={() => {
                            setKanbanGroup(g.key);
                            setGearView('main');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                        >
                          <span className="flex-1">{g.label}</span>
                          {kanbanGroup === g.key && <Check size={14} className="text-[#3D8BD0]" />}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* The page's own create action — the one thing on this rail that MAKES something,
            so it is a filled primary beside the icon tools rather than a seventh glyph. */}
        {primaryAction && (
          <button
            onClick={() => (primaryAction.onClick ? primaryAction.onClick() : toast(`${primaryAction.label} — coming soon`))}
            className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
          >
            <Plus size={15} />
            {primaryAction.label}
          </button>
        )}

        {/* An EMPTY moreActions means the module has no such actions — the button goes with
            them rather than opening on nothing. */}
        {!minimalTools && (moreActions?.length ?? 1) > 0 && (
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`${ICON_BTN} ${moreOpen ? '!border-[#3D8BD0] !bg-[#EBF5FF] !text-[#3D8BD0]' : ''}`}
            title="More actions"
          >
            <MoreVertical size={16} />
          </button>
          {moreOpen && (
            <div className={`${POPUP} w-[228px] py-1`}>
              {(moreActions ?? (noun === 'request'
                ? [
                    { key: 'import-incident', label: 'Import Incident', icon: Import },
                    { key: 'import-sr', label: 'Import Service Request', icon: Import },
                  ]
                : [{ key: 'import-record', label: `Import ${Noun}`, icon: Import }])
              ).map((a) => (
                <button
                  key={a.key}
                  onClick={() => {
                    setMoreOpen(false);
                    const anchor = moreRef.current?.getBoundingClientRect();
                    if (a.onSelect && anchor) a.onSelect(anchor);
                    else toast(`${a.label} — coming soon`);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                >
                  <a.icon size={15} className="flex-shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate">{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {fieldMgr && (
        <ColumnManager
          anchor={fieldMgr}
          catalog={kanbanFieldsFor(kanbanGroup).map((f) => (f.label === 'Request age' ? { ...f, label: `${Noun} age` } : f))}
          active={cardFieldsFor(cardFields, kanbanGroup)}
          /* The designed card is not negotiable — its fields pin on top, locked; the
             user arranges only what THEY added below. The group axis is already out
             of both lists, so it is never offered or locked. */
          lockedKeys={cardFieldsFor(DEFAULT_CARD_FIELDS, kanbanGroup)}
          title="Card fields"
          shownLabel="Shown on card"
          searchPlaceholder="Search fields..."
          onApply={(keys) => {
            const at = cardFields.indexOf(kanbanGroup);
            if (at < 0) return setCardFields(keys);
            const back = Math.min(at, keys.length);
            setCardFields([...keys.slice(0, back), kanbanGroup, ...keys.slice(back)]);
          }}
          onClose={() => setFieldMgr(null)}
          onBack={() => {
            setFieldMgr(null);
            setGearView('main');
            setGearOpen(true);
          }}
        />
      )}
    </div>
  );
}
