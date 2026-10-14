/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../Pagination';
import { Search, X, Monitor, LayoutGrid, List as ListIcon, Network, Filter, Check, ChevronDown, Minimize2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import type { PatchInstallation, InstallationStatus } from './PatchComputersTab';
import { INITIAL_COMPUTERS } from './PatchComputersTab';
import { OsBadge } from '../OsBadge';
import { DeploymentTopologyView, PACKAGE_DEPLOY_SCENARIOS, REGISTRY_DEPLOY_SCENARIOS } from './DeploymentTopologyView';
import { EndpointConfigFlow } from './EndpointConfigFlow';

// Full set of installation-status values the filter can pick from (superset of what's in the data).
const STATUS_FILTER_OPTIONS = [
  'Yet to Receive', 'Partially Installed', 'In Progress', 'Success', 'Failed',
  'Cancelled', 'Not Applicable', 'Not Ready', 'Received', 'Resolving Dependency',
];

// Clean status-badge palette (soft tint bg + strong text + dot) per installation status.
const STATUS_META: Record<InstallationStatus, { bg: string; text: string; dot: string }> = {
  'Yet to Receive': { bg: '#F2F4F7', text: '#475467', dot: '#667085' },
  'In Progress': { bg: '#FFF8EB', text: '#B54708', dot: '#F79009' },
  'Success': { bg: '#ECFDF3', text: '#067647', dot: '#12B76A' },
  'Failed': { bg: '#FEF3F2', text: '#B42318', dot: '#F04438' },
};

function StatusPill({ status }: { status: InstallationStatus }) {
  const m = STATUS_META[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12px] font-medium cursor-default" style={{ backgroundColor: m.bg, color: m.text }}>
          <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.dot }} />
          {status}
        </span>
      </TooltipTrigger>
      <TooltipContent>Installation Status</TooltipContent>
    </Tooltip>
  );
}

const downloadDot = (s: string) => (s === 'Success' ? '#22C55E' : s === 'Failed' ? '#EF4444' : '#64748B');

const sevDot = (s?: string) =>
  s === 'Critical' ? '#EF4444' : s === 'Important' ? '#F59E0B' : s === 'Moderate' ? '#EAB308' : '#64748B';

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

// Deployment rows reference endpoints by agent id — resolve the OS from the fleet mock for the
// OS badge (EP-426 exists only in the deployment matrix; matrix extras default to Windows).
const OS_BY_AGENT = new Map<string, string>(INITIAL_COMPUTERS.map((c) => [c.id, c.osName]));
OS_BY_AGENT.set('EP-426', 'Microsoft Windows 11 Pro');
const osFor = (agentId: string) => OS_BY_AGENT.get(agentId) ?? 'Microsoft Windows 11 Pro';

interface PatchInstallationTabProps {
  installations: PatchInstallation[];
  setInstallations: Dispatch<SetStateAction<PatchInstallation[]>>;
  /** Called when a deployment's status turns Success → moves the agent into the Installed bucket. */
  onInstalled: (agentId: string) => void;
  /** Show the Topology view toggle — Patch DEPLOYMENT page only (opt-in). */
  showTopology?: boolean;
  /** Package Deployment page: the matrix rows carry PACKAGES, not patches — the column reads
   *  "Package ID" and the patch-only Severity column is dropped. */
  packageMode?: boolean;
  /** Registry Deployment page: rows carry a registry TEMPLATE (one name column, no id pill),
   *  and there is no per-endpoint download step. */
  registryMode?: boolean;
}

export function PatchInstallationTab({ installations, showTopology = false, packageMode = false, registryMode = false }: PatchInstallationTabProps) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'card' | 'topology'>('card');
  // Full screen — the whole tab (any view) promoted to a fixed overlay (Superseded-tab pattern).
  const [isFull, setIsFull] = useState(false);
  // "View Configuration" → the endpoint's individual deployment-chain flow (center popup).
  const [configFor, setConfigFor] = useState<PatchInstallation | null>(null);
  // Ctrl+F focuses the topology node search (the placeholder advertises it, like the Superseded map).
  const topoSearchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (view !== 'topology') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        topoSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);
  const [filterOpen, setFilterOpen] = useState(false);
  // Which tab of the filter popup is showing (CMDB dependency-map Filter-pill pattern) —
  // opening lands on the tab that has an active filter.
  const [filterTab, setFilterTab] = useState<'status' | 'patch'>('status');
  // Status filter — empty = "All" (show everything); otherwise only the picked statuses.
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  // Patch filter — Patch DEPLOYMENT page only (rows there are a patch × endpoint matrix, so each
  // carries a patchId). Selecting patches shows only the endpoints that patch was deployed to.
  const [patchFilter, setPatchFilter] = useState<string[]>([]);
  // The unique patches present in the rows — feeds the filter's "Patch" section. Empty on the
  // plain Patch page (its rows carry no patchId), which hides the section entirely.
  const patchOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; severity?: string }>();
    installations.forEach((r) => {
      if (r.patchId && !seen.has(r.patchId)) seen.set(r.patchId, { id: r.patchId, name: r.patchName ?? r.patchId, severity: r.patchSeverity });
    });
    return [...seen.values()];
  }, [installations]);
  const hasPatchCols = patchOptions.length > 0;
  const filterActive = statusFilter.length > 0 || patchFilter.length > 0;
  const selCount = statusFilter.length + patchFilter.length;
  const filterLabel = selCount === 0 ? 'All' : `${statusFilter[0] ?? patchFilter[0]}${selCount > 1 ? ` +${selCount - 1}` : ''}`;
  const toggleStatus = (s: string) => setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const togglePatch = (p: string) => setPatchFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const clearFilters = () => { setStatusFilter([]); setPatchFilter([]); };

  const q = search.trim().toLowerCase();
  const rows = installations
    .filter((r) => statusFilter.length === 0 || statusFilter.includes(r.installationStatus))
    .filter((r) => patchFilter.length === 0 || (!!r.patchId && patchFilter.includes(r.patchId)))
    .filter((r) =>
      !q ||
      r.agentId.toLowerCase().includes(q) ||
      r.hostName.toLowerCase().includes(q) ||
      r.ipAddress.toLowerCase().includes(q) ||
      r.installationStatus.toLowerCase().includes(q) ||
      r.taskType.toLowerCase().includes(q) ||
      (r.patchId ?? '').toLowerCase().includes(q) ||
      (r.patchName ?? '').toLowerCase().includes(q)
    );

  // Pagination — one deployment record is created per (patch, endpoint) pair, so this list grows quickly.
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, patchFilter, view]);
  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const pageRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={`@container ${isFull ? 'fixed inset-0 z-[10000] overflow-y-auto bg-white px-6 py-4' : 'px-6 py-4'}`}>
      {/* Search + status filter + card/list/topology view toggle. In topology mode the same
          search/filter SPOTLIGHT the canvas (matching nodes stay lit, the rest fade). */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {view === 'topology' ? (
          <>
            {/* Compact node search — same recipe as the Superseded map toolbar */}
            <div className="relative w-full max-w-[280px] flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                ref={topoSearchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearch(''); e.currentTarget.blur(); } }}
                placeholder="Search...   Ctrl + F | Esc to clear"
                className="h-8 w-full rounded border border-[#DFE5ED] pl-9 pr-8 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
              )}
            </div>
          </>
        ) : (
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Select field to search..."
            className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
        )}
        {/* Filter by installation status — "All" by default; picking statuses shows them as pills */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              if (!filterOpen) setFilterTab(statusFilter.length === 0 && patchFilter.length > 0 ? 'patch' : 'status');
              setFilterOpen((v) => !v);
            }}
            title="Filter by status"
            className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors ${filterActive ? 'border-[#3D8BD0] bg-[#F0F8FF] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6]'}`}
          >
            <Filter size={15} className={filterActive ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            <span className="max-w-[160px] truncate">{filterLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''} ${filterActive ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className={`app-menu absolute right-0 top-full mt-1.5 z-50 ${hasPatchCols ? 'w-[340px]' : 'w-[260px]'} bg-white rounded-lg shadow-lg border border-[#DFE5ED]`}>
                {/* Selected pills — statuses + patch ids together */}
                {filterActive && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-[#F0F2F5]">
                    {statusFilter.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
                        {s}
                        <button onClick={() => toggleStatus(s)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
                      </span>
                    ))}
                    {patchFilter.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
                        {p}
                        <button onClick={() => togglePatch(p)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Tabs — Status | Patch (CMDB dependency-map Filter-pill pattern); a blue dot on
                    a tab label marks an active filter hidden behind the other tab. The plain
                    Patch page has no patch options, so it keeps the single flat status list. */}
                {hasPatchCols && (
                  <div className="flex border-b border-[#EEF1F4]">
                    <button
                      onClick={() => setFilterTab('status')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${filterTab === 'status' ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                    >
                      Status
                      {statusFilter.length > 0 && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
                    </button>
                    <button
                      onClick={() => setFilterTab('patch')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${filterTab === 'patch' ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                    >
                      {registryMode ? 'Registry Template' : packageMode ? 'Package' : 'Patch'}
                      {patchFilter.length > 0 && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
                    </button>
                  </div>
                )}
                <div className="max-h-[340px] overflow-y-auto py-1">
                  {(!hasPatchCols || filterTab === 'status') ? (
                    <>
                      {/* "All" clears this tab's filter */}
                      <button
                        onClick={() => setStatusFilter([])}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors ${statusFilter.length === 0 ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        <span className="text-[#364658]">All</span>
                        {statusFilter.length === 0 && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {STATUS_FILTER_OPTIONS.map((opt) => {
                        const on = statusFilter.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleStatus(opt)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors ${on ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                          >
                            <span className="text-[#364658]">{opt}</span>
                            {on && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {/* Patch tab — deployment page only (the rows are a patch × endpoint matrix);
                          picking a patch shows only the endpoints it was deployed to */}
                      <button
                        onClick={() => setPatchFilter([])}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors ${patchFilter.length === 0 ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        <span className="text-[#364658]">All</span>
                        {patchFilter.length === 0 && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {patchOptions.map((p) => {
                        const on = patchFilter.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePatch(p.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${on ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                          >
                            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: sevDot(p.severity) }} />
                            <span className="inline-block flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{p.id}</span>
                            <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]" title={p.name}>{p.name}</span>
                            {on && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#F0F2F5]">
                  <button onClick={clearFilters} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear all</button>
                  <button onClick={() => setFilterOpen(false)} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Done</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Topology: filter sits right after the search; spacer pushes the view toggle to the edge */}
        {view === 'topology' && <div className="flex-1" />}

        {/* View toggle — Card · List (· Topology only on the Patch Deployment page).
            Hidden in full screen: fullscreen is entered from the topology canvas, and switching
            views inside the overlay would strand the user without that exit control. */}
        {!isFull && (
        <div className="flex flex-shrink-0 overflow-hidden rounded border border-[#DFE5ED]">
          {([
            { key: 'card', icon: <LayoutGrid size={15} />, tip: 'Card view' },
            { key: 'list', icon: <ListIcon size={15} />, tip: 'List view' },
            ...(showTopology ? [{ key: 'topology' as const, icon: <Network size={15} />, tip: 'Topology view' }] : []),
          ] as const).map((v, i) => (
            <Tooltip key={v.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setView(v.key); setSearch(''); clearFilters(); }}
                  className={`flex h-8 w-9 items-center justify-center transition-colors ${i > 0 ? 'border-l border-[#DFE5ED]' : ''} ${view === v.key ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#364658] hover:bg-[#F3F4F6]'}`}
                >
                  {v.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>{v.tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        )}
        {/* Fullscreen EXIT — top-right corner of the expanded view (the canvas card only ENTERS
            fullscreen; once expanded, the restore control moves up here like a window control). */}
        {isFull && view === 'topology' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsFull(false)}
                className='inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#3D8BD0] bg-[#3D8BD0] text-white transition-colors hover:bg-[#2d6ca0]'
              >
                <Minimize2 size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exit full screen</TooltipContent>
          </Tooltip>
        )}
      </div>

      {view === 'topology' ? (
        /* Topology view — the deployment architecture canvas (records don't gate it) */
        <DeploymentTopologyView search={search} statusFilter={statusFilter} patchFilter={patchFilter} fullscreen={isFull} scenarios={packageMode ? PACKAGE_DEPLOY_SCENARIOS : registryMode ? REGISTRY_DEPLOY_SCENARIOS : undefined} countLabel={packageMode ? 'Package Count' : registryMode ? 'Registry Count' : undefined} onToggleFullscreen={() => setIsFull((v) => !v)} storeFlavor={packageMode ? 'packages' : registryMode ? 'configurations' : 'patches'} />
      ) : installations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#F5F7FA] mb-3">
            <Monitor className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="text-[14px] font-medium text-[#364658]">No deployments yet</p>
          <p className="text-[13px] text-[#7B8FA5] mt-1">Select endpoints in the Endpoint tab and click <span className="font-medium">Install Patch</span> to deploy this patch.</p>
        </div>
      ) : view === 'list' ? (
        /* List (table) view */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {(hasPatchCols
                  ? (registryMode
                      ? ['Endpoint ID', 'Host Name', 'Registry Template', 'Deployment Date', 'Installation Status', 'Retry Status', 'Result', 'Actions']
                      : packageMode
                      ? ['Endpoint ID', 'Host Name', 'Package ID', 'Name', 'Deployment Date', 'Installation Status', 'Retry Status', 'Download Status', 'Result', 'Actions']
                      : ['Endpoint ID', 'Host Name', 'Patch ID', 'Name', 'Severity', 'Deployment Date', 'Installation Status', 'Retry Status', 'Download Status', 'Result', 'Actions'])
                  : ['Agent ID', 'Host Name', 'IP Address', 'Configuration Type', 'Deployment Date', 'Installation Status', 'Retry Status', 'Download Status', 'Task Type', 'Actions']
                ).map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {rows.length === 0 ? (
                <tr><td colSpan={hasPatchCols ? (registryMode ? 8 : packageMode ? 10 : 11) : 10} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No deployments match your search.</td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                  {/* Endpoint / Agent ID with health dot */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <OsBadge osName={osFor(r.agentId)} dotColor="#EAB308" size="sm" />
                      <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{r.agentId}</button>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[140px] truncate">{r.hostName}</span></td>
                  {hasPatchCols ? (
                    <>
                      {/* What this deployment row carries. Registry runs show ONE template-name
                          column; patch/package runs show an id pill + name. */}
                      {!registryMode && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.patchId}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[240px] truncate" title={r.patchName}>{r.patchName}</span></td>
                      {/* Severity is patch-only — packages and registry templates have none. */}
                      {!packageMode && !registryMode && (
                        <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                          <span className="inline-flex items-center gap-1.5 text-[#364658]">
                            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: sevDot(r.patchSeverity) }} />
                            {r.patchSeverity}
                          </span>
                        </td>
                      )}
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.ipAddress}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.configType}</td>
                    </>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.deploymentDate === '---' ? <Dash /> : r.deploymentDate}</td>

                  {/* Installation Status — clean status pill */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusPill status={r.installationStatus} />
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.retryStatus}</td>
                  {!registryMode && (
                    <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                      <span className="inline-flex items-center gap-1.5 text-[#364658]">
                        <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: downloadDot(r.downloadStatus) }} />
                        {r.downloadStatus}
                      </span>
                    </td>
                  )}
                  {hasPatchCols ? (
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{!r.result || r.result === '---' ? <Dash /> : r.result}</td>
                  ) : (
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[170px] truncate">{r.taskType}</span></td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => setConfigFor(r)} className="inline-block rounded bg-[#e8f4fd] px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">View Configuration</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#9CA3AF]">No deployments match your search.</div>
      ) : (
        /* Card view — container-query responsive; stays 1 column in the narrow drawer so cards
           never crowd (2 columns only from @2xl, 3 from @4xl). */
        <div className="grid gap-4 grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {pageRows.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4 hover:border-[#3D8BD0] hover:shadow-sm transition-all">
              {/* Header: icon badge · (health dot + Agent ID + host) · status pill.
                  flex-wrap lets the pill drop below on very narrow cards instead of squashing. */}
              <div className="flex items-start gap-3 flex-wrap">
                <OsBadge osName={osFor(r.agentId)} dotColor="#EAB308" size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{r.agentId}</span>
                  </div>
                  <button className="block mt-1 text-[13px] font-semibold text-[#3D8BD0] hover:underline truncate text-left max-w-full" title={r.hostName}>{r.hostName}</button>
                </div>
                <span className="flex-shrink-0"><StatusPill status={r.installationStatus} /></span>
              </div>

              {/* What this deployment row carries (× endpoint matrix — deployment pages).
                  Registry runs have no id pill, so the strip is LABELLED ("Registry Template")
                  — otherwise the bare name reads as an unexplained string on the card. */}
              {r.patchId && (registryMode ? (
                <div className="mt-3 min-w-0 rounded border border-[#EEF2F6] bg-[#F8FAFC] px-2.5 py-2">
                  <div className="text-[11px] text-[#9CA3AF]">Registry Template</div>
                  <div className="mt-0.5 truncate text-[12px] font-medium text-[#364658]" title={r.patchName}>{r.patchName}</div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded border border-[#EEF2F6] bg-[#F8FAFC] px-2.5 py-2 min-w-0">
                  <span className="inline-block flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{r.patchId}</span>
                  {!packageMode && <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: sevDot(r.patchSeverity) }} />}
                  <span className="min-w-0 truncate text-[12px] text-[#364658]" title={r.patchName}>{r.patchName}</span>
                </div>
              ))}

              {/* Details */}
              <div className="mt-3 pt-3 border-t border-[#F0F2F5] grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">IP Address</div><div className="text-[12px] text-[#364658] truncate">{r.ipAddress}</div></div>
                {!registryMode && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Configuration Type</div><div className="text-[12px] text-[#364658] truncate">{r.configType}</div></div>}
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Deployment Date</div><div className="text-[12px] truncate" style={{ color: r.deploymentDate === '---' ? '#9ca3af' : '#364658' }}>{r.deploymentDate}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Retry Status</div><div className="text-[12px] text-[#364658]">{r.retryStatus}</div></div>
                {!registryMode && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Download Status</div><div className="text-[12px] text-[#364658] inline-flex items-center gap-1.5"><span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: downloadDot(r.downloadStatus) }} />{r.downloadStatus}</div></div>}
                {r.patchId ? (
                  <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Result</div><div className="text-[12px] truncate" style={{ color: !r.result || r.result === '---' ? '#9ca3af' : '#364658' }}>{r.result ?? '---'}</div></div>
                ) : (
                  <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Task Type</div><div className="text-[12px] text-[#364658] truncate" title={r.taskType}>{r.taskType}</div></div>
                )}
              </div>

              <div className="mt-3">
                <button onClick={() => setConfigFor(r)} className="w-full rounded bg-[#e8f4fd] px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">View Configuration</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination — sticky to the bottom of the scroll viewport (card and list views only) */}
      {view !== 'topology' && installations.length > 0 && (
        <div className="sticky bottom-0 z-30 -mx-6 -mb-4 mt-4 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={rows.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
          />
        </div>
      )}

      {/* Individual endpoint deployment-chain flow (center popup) */}
      {configFor && <EndpointConfigFlow record={configFor} onClose={() => setConfigFor(null)} sharedDirSource={packageMode} noExternalSource={registryMode} />}
    </div>
  );
}
