import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, FileText, Download, RefreshCw, History, Columns3, Plus, Pin, Star } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatchDeploymentsTable } from './PatchDeploymentsTable';
import { CreatePatchDeployment } from './CreatePatchDeployment';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { relativeStamp } from './dateFormat';
import type { Patch } from './PatchesListPage';

export type DeploymentStatus = 'Ready to Deploy' | 'In Progress' | 'Completed' | 'Cancelled' | 'Expired' | 'Draft';

/** What a run actually delivers. A patch run pushes KB/app patches; an OS Upgrade run pushes an
 *  uploaded ISO from Admin › Patch Management › OS Upgrade — which is why it can only install. */
export type DeploymentType = 'Patch' | 'OS Upgrade';

export interface PatchDeployment {
  id: string;
  name: string;
  status: DeploymentStatus;
  deploymentType: DeploymentType;
  deploymentPolicy: string;
  /** Scheduled install-after datetime, or null = --- (deploy immediately / not scheduled) */
  installAfter: string | null;
  /** Deployment window expiry, or null = --- (no expiry) */
  expiryDate: string | null;
  /** Archived runs are hidden from every view except "Archived Deployments". */
  archived?: boolean;
}

/* Realistic deployment runs: named after the patch wave they roll out, scoped by ring/policy.
 * `deploymentType` is stated only where it isn't the norm — a run is a Patch run unless it says
 * otherwise, and the default is applied once below rather than repeated on 30 rows. */
const DEPLOYMENTS_SEED: (Omit<PatchDeployment, 'deploymentType'> & { deploymentType?: DeploymentType })[] = [
  { id: 'PDR-1437', name: 'Windows 11 25H2 Enterprise Upgrade — IT Pilot Ring', status: 'Ready to Deploy', deploymentType: 'OS Upgrade', deploymentPolicy: 'Pilot Ring — Early Validation', installAfter: 'Fri, Aug 14, 2026 09:00 PM', expiryDate: 'Fri, Aug 28, 2026 09:00 PM' },
  { id: 'PDR-1436', name: 'Windows 11 24H2 Pro Upgrade — Sales Laptops', status: 'In Progress', deploymentType: 'OS Upgrade', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: 'Mon, Aug 10, 2026 08:00 PM', expiryDate: 'Mon, Aug 24, 2026 08:00 PM' },
  { id: 'PDR-1435', name: 'Ubuntu Server 24.04 LTS Upgrade — Build Agents', status: 'Completed', deploymentType: 'OS Upgrade', deploymentPolicy: 'App Servers — Maintenance Window', installAfter: 'Sun, Jul 12, 2026 02:00 AM', expiryDate: null },
  { id: 'PDR-1434', name: 'Windows 11 25H2 Enterprise Upgrade — Finance Wave 1', status: 'Draft', deploymentType: 'OS Upgrade', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: null, expiryDate: null },
  { id: 'PDR-1433', name: 'April 2026 Patch Tuesday — Production Servers Wave 2', status: 'Ready to Deploy', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Jul 25, 2026 10:00 PM', expiryDate: 'Fri, Jul 31, 2026 06:00 AM' },
  { id: 'PDR-1432', name: 'Chrome 124 Security Update — All Workstations', status: 'Ready to Deploy', deploymentPolicy: 'Browser Updates — Silent Install', installAfter: 'Thu, Jul 23, 2026 08:00 PM', expiryDate: null },
  { id: 'PDR-1431', name: 'KB5036894 Cumulative Update — Finance Department', status: 'In Progress', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: 'Tue, Jul 21, 2026 09:00 PM', expiryDate: 'Tue, Jul 28, 2026 09:00 PM' },
  { id: 'PDR-1430', name: 'Defender Platform 4.18.24030 — Fleet-wide', status: 'In Progress', deploymentPolicy: 'Security Definitions — Immediate', installAfter: null, expiryDate: null },
  { id: 'PDR-1429', name: 'Internal Agent Updater Hotfix — Priority Rollout', status: 'Completed', deploymentPolicy: 'Critical Security — Immediate', installAfter: 'Wed, Jul 08, 2026 06:30 PM', expiryDate: 'Fri, Jul 10, 2026 06:30 PM' },
  { id: 'PDR-1428', name: 'Acrobat Reader DC Security Update — Design Team', status: 'Completed', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: 'Mon, Jul 06, 2026 10:00 PM', expiryDate: null },
  { id: 'PDR-1427', name: 'April 2026 Patch Tuesday — Pilot Ring', status: 'Completed', deploymentPolicy: 'Pilot Ring — Early Validation', installAfter: 'Thu, Apr 16, 2026 09:00 PM', expiryDate: 'Thu, Apr 23, 2026 09:00 PM' },
  { id: 'PDR-1426', name: '.NET Framework 4.8.1 Rollup — Application Servers', status: 'Ready to Deploy', deploymentPolicy: 'App Servers — Maintenance Window', installAfter: relativeStamp(1, 2), expiryDate: relativeStamp(1, 23, 30) },
  { id: 'PDR-1425', name: 'Edge 124 Security Update — Kiosk Devices', status: 'Draft', deploymentPolicy: 'Kiosk Devices — Overnight Only', installAfter: null, expiryDate: null },
  { id: 'PDR-1424', name: 'PuTTY 0.81 (CVE-2024-31497) — Engineering Workstations', status: 'Completed', deploymentPolicy: 'Critical Security — Immediate', installAfter: 'Wed, Apr 16, 2026 11:00 AM', expiryDate: 'Fri, Apr 18, 2026 11:00 AM' },
  { id: 'PDR-1423', name: 'Firefox 125.0.2 Update — Support Team', status: 'Cancelled', deploymentPolicy: 'Browser Updates — Silent Install', installAfter: 'Wed, Apr 22, 2026 08:30 PM', expiryDate: null },
  { id: 'PDR-1422', name: 'March 2026 Cumulative — Windows Server 2022 Fleet', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Mar 28, 2026 11:00 PM', expiryDate: 'Sat, Apr 04, 2026 06:00 AM' },
  { id: 'PDR-1421', name: 'Servicing Stack Update KB5034439 — Server Ring 1', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Feb 21, 2026 11:30 PM', expiryDate: null },
  { id: 'PDR-1420', name: 'Zoom Client 5.17.11 — Conference Room PCs', status: 'Expired', deploymentPolicy: 'Shared Devices — Overnight Only', installAfter: 'Mon, Mar 09, 2026 01:00 AM', expiryDate: 'Mon, Mar 16, 2026 01:00 AM' },
  { id: 'PDR-1419', name: 'Java SE 8u411 Security Patch — Legacy App Hosts', status: 'Expired', deploymentPolicy: 'Legacy Systems — Manual Approval', installAfter: 'Tue, Mar 03, 2026 09:00 PM', expiryDate: 'Tue, Mar 10, 2026 09:00 PM' },
  { id: 'PDR-1418', name: 'February 2026 Patch Tuesday — Remote Office Mumbai', status: 'Completed', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: 'Fri, Feb 13, 2026 10:00 PM', expiryDate: 'Fri, Feb 20, 2026 10:00 PM' },
  { id: 'PDR-1417', name: 'February 2026 Patch Tuesday — Remote Office Pune', status: 'Completed', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: 'Sat, Feb 14, 2026 10:00 PM', expiryDate: 'Sat, Feb 21, 2026 10:00 PM' },
  { id: 'PDR-1416', name: 'VLC 3.0.20 Security Update — Media Workstations', status: 'Cancelled', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: null, expiryDate: null },
  { id: 'PDR-1415', name: 'Windows 11 24H2 Feature Enablement — IT Pilot', status: 'Draft', deploymentType: 'OS Upgrade', deploymentPolicy: 'Pilot Ring — Early Validation', installAfter: 'Mon, Aug 03, 2026 09:00 PM', expiryDate: 'Mon, Aug 17, 2026 09:00 PM' },
  { id: 'PDR-1414', name: 'January 2026 Cumulative — Domain Controllers', status: 'Completed', deploymentPolicy: 'Domain Controllers — One at a Time', installAfter: 'Sun, Jan 18, 2026 03:00 AM', expiryDate: 'Sun, Jan 25, 2026 03:00 AM' },
  { id: 'PDR-1413', name: 'Git for Windows 2.44 — Developer Machines', status: 'Completed', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: null },
  { id: 'PDR-1412', name: '7-Zip 24.05 Update — All Workstations', status: 'Ready to Deploy', deploymentPolicy: 'Third-Party Apps — Weekly Window', installAfter: relativeStamp(5, 20), expiryDate: null },
  { id: 'PDR-1411', name: 'January 2026 Patch Tuesday — HR & Finance Ring', status: 'Completed', deploymentPolicy: 'Workstations — Business Hours Safe', installAfter: 'Fri, Jan 16, 2026 09:30 PM', expiryDate: 'Fri, Jan 23, 2026 09:30 PM' },
  { id: 'PDR-1410', name: 'Notepad++ 8.6.5 Update — Engineering Workstations', status: 'Cancelled', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: null },
  { id: 'PDR-1409', name: 'December 2025 Cumulative — Warehouse Terminals', status: 'Expired', deploymentPolicy: 'Shared Devices — Overnight Only', installAfter: 'Sat, Dec 20, 2025 01:00 AM', expiryDate: 'Sat, Dec 27, 2025 01:00 AM' },
  { id: 'PDR-1408', name: 'December 2025 Patch Tuesday — Production Servers Wave 1', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Dec 13, 2025 11:00 PM', expiryDate: 'Sat, Dec 20, 2025 06:00 AM' },
  { id: 'PDR-1407', name: 'Defender Definition Refresh — VPN-only Laptops', status: 'Completed', deploymentPolicy: 'Security Definitions — Immediate', installAfter: null, expiryDate: null },
  { id: 'PDR-1406', name: 'November 2025 Cumulative — Executive Laptops', status: 'Completed', deploymentPolicy: 'VIP Devices — Manual Approval', installAfter: 'Mon, Nov 17, 2025 08:00 PM', expiryDate: 'Mon, Nov 24, 2025 08:00 PM' },

  // Archived — kept for the record, out of every other view.
  { id: 'PDR-1405', name: 'October 2025 Patch Tuesday — Production Servers', status: 'Completed', deploymentPolicy: 'Production Servers — Staged Rollout', installAfter: 'Sat, Oct 18, 2025 11:00 PM', expiryDate: 'Sat, Oct 25, 2025 06:00 AM', archived: true },
  { id: 'PDR-1404', name: 'Windows 10 21H2 Upgrade — Retired Kiosk Fleet', status: 'Cancelled', deploymentType: 'OS Upgrade', deploymentPolicy: 'Kiosk Devices — Overnight Only', installAfter: null, expiryDate: null, archived: true },
  { id: 'PDR-1403', name: 'September 2025 Cumulative — Warehouse Terminals', status: 'Expired', deploymentPolicy: 'Shared Devices — Overnight Only', installAfter: 'Sat, Sep 20, 2025 01:00 AM', expiryDate: 'Sat, Sep 27, 2025 01:00 AM', archived: true },
];

export const mockPatchDeployments: PatchDeployment[] = DEPLOYMENTS_SEED.map((d) => ({
  ...d,
  deploymentType: d.deploymentType ?? 'Patch',
}));

/* ── Saved views ───────────────────────────────────────────────────────────
 * The view dropdown on the listing. Each view is a named filter; `chip` is the plain-English
 * predicate shown next to the star, so what is being hidden is never invisible. */
export interface DeploymentView {
  id: string;
  label: string;
  /** Filter chip text; empty means the view shows everything. */
  chip: string;
  match: (d: PatchDeployment) => boolean;
}

export const DEPLOYMENT_VIEWS: DeploymentView[] = [
  { id: 'pending', label: 'Pending Deployments', chip: 'Status In Ready to Deploy, In Progress', match: (d) => d.status === 'Ready to Deploy' || d.status === 'In Progress' },
  { id: 'draft', label: 'Draft Deployments', chip: 'Status In Draft', match: (d) => d.status === 'Draft' },
  { id: 'canceled', label: 'Canceled Deployments', chip: 'Status In Cancelled', match: (d) => d.status === 'Cancelled' },
  { id: 'expired', label: 'Expired Deployments', chip: 'Status In Expired', match: (d) => d.status === 'Expired' },
  { id: 'os-upgrade', label: 'OS Upgrade Deployments', chip: 'Deployment Category In OS Upgrade', match: (d) => d.deploymentType === 'OS Upgrade' },
  { id: 'all', label: 'All Deployments', chip: '', match: () => true },
  { id: 'archived', label: 'Archived Deployments', chip: 'Archived In Yes', match: (d) => !!d.archived },
];

/** Archived rows belong to exactly one view. Keeping that rule here — rather than in every
 *  `match` — is why a new view can't accidentally resurrect them. */
export const inView = (d: PatchDeployment, view: DeploymentView) =>
  view.id === 'archived' ? !!d.archived : !d.archived && view.match(d);

// Toolbar tailored to the Patch Deployments list (title + view + action icons + CTA).
function PatchDeploymentsToolbar({ searchQuery, setSearchQuery, view, onView, onCreate }: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  view: DeploymentView;
  onView: (v: DeploymentView) => void;
  onCreate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewQuery, setViewQuery] = useState('');
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [defaultView, setDefaultView] = useState('pending');

  const IconBtn = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]" title={title}>
      {children}
    </button>
  );

  const q = viewQuery.trim().toLowerCase();
  // Pinned views float to the top; the rest keep the authored order.
  const views = [...DEPLOYMENT_VIEWS]
    .filter((v) => !q || v.label.toLowerCase().includes(q))
    .sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id)));

  const closeMenu = () => { setOpen(false); setViewQuery(''); };
  const togglePin = (id: string) => setPinned((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="bg-white">
      {/* First Row: Title + view dropdown + actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-semibold text-[#364658]">Patch Deployments</h1>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]"
            >
              <span>{view.label}</span>
              <ChevronDown size={16} className={`text-[#6b7280] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeMenu} />
                <div className="absolute left-0 top-full z-50 mt-2 w-[300px] rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg">
                  <div className="px-3 pb-2">
                    <input
                      type="text"
                      autoFocus
                      value={viewQuery}
                      onChange={(e) => setViewQuery(e.target.value)}
                      placeholder="Search"
                      className="h-9 w-full rounded border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {views.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">No views match “{viewQuery}”.</div>
                    ) : views.map((v) => {
                      const active = v.id === view.id;
                      return (
                        <div
                          key={v.id}
                          className={`group flex items-center gap-2 px-4 py-2 transition-colors ${active ? 'bg-[#EBF5FF]' : 'hover:bg-[#F9FAFB]'}`}
                        >
                          <button
                            onClick={() => { onView(v); closeMenu(); }}
                            className={`min-w-0 flex-1 truncate text-left text-[13px] ${active ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}
                          >{v.label}</button>
                          {/* Fixed slot, hidden not removed, so rows never shift on hover */}
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(v.id); }}
                            title={pinned.has(v.id) ? 'Unpin view' : 'Pin view'}
                            className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-white ${
                              pinned.has(v.id) ? 'text-[#3D8BD0]' : 'text-[#9CA3AF] opacity-0 group-hover:opacity-100'
                            }`}
                          ><Pin size={14} className={pinned.has(v.id) ? 'fill-current' : ''} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="New"><FileText size={16} /></IconBtn>
          <IconBtn title="Export"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="History"><History size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          <button
            onClick={onCreate}
            className="ml-2 flex h-[34px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]"
          >
            <Plus size={15} />
            Create Patch Deployment
          </button>
        </div>
      </div>

      {/* Active view — star marks the default, the chip says what is being filtered out */}
      {view.chip && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-2.5">
          <button
            onClick={() => setDefaultView(view.id)}
            title={defaultView === view.id ? 'Default view' : 'Set as default view'}
            className="flex size-6 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
          >
            <Star size={15} className={defaultView === view.id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#9CA3AF]'} />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded bg-[#EEF2F6] py-1 pl-2.5 pr-1.5 text-[12px] text-[#364658]">
            {view.chip}
            <button
              onClick={() => onView(DEPLOYMENT_VIEWS.find((v) => v.id === 'all')!)}
              title="Clear filter"
              className="flex size-4 items-center justify-center rounded-full text-[#7B8FA5] transition-colors hover:bg-white hover:text-[#364658]"
            ><X size={12} /></button>
          </span>
        </div>
      )}

      {/* Second Row: Full-width Search */}
      <div className="px-6 pb-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Select field to search..."
            className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658] transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Derived deployment attributes ────────────────────────────────────────────
   The record stores the run's own fields; the listing filters on a few more that are read
   OFF them. Derived here, once, so the row and the record it opens cannot disagree. */

export const parseDeployDate = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

/* Where the run sits against the clock, which `status` alone cannot answer: a run can read
   "Ready to Deploy" with a window that closed last week, and that is exactly the row an
   operator needs to find. */
export const deployWindowOf = (d: PatchDeployment): string => {
  const start = parseDeployDate(d.installAfter);
  const end = parseDeployDate(d.expiryDate);
  if (!start && !end) return 'No window';
  const now = Date.now();
  if (end && end.getTime() < now) return 'Window closed';
  if (start && start.getTime() > now) return 'Scheduled';
  return 'Live now';
};

/** Install or Uninstall — a rollback run says so in its name. */
export const deployTaskTypeOf = (d: PatchDeployment): string =>
  /\b(uninstall|rollback|remove|revert)\b/i.test(d.name) ? 'Uninstall' : 'Install';

/* Where the run came from. The recurring patch families — definitions, browsers, runtimes,
   the servicing stack, third-party apps — are what Automatic Patch Deployment schedules exist
   to ship; a Patch Tuesday wave, a pilot, a hotfix or a rollback is a technician's hand on
   the button. The listing's "Manual Remote Deploy" card reads this, and a schedule-made run
   is created by "System" (see deployCreatedByOf). */
const AUTOMATIC_FAMILIES = /defender|chrome|edge \d|firefox|zoom|java|\.net framework|acrobat|servicing stack|7-zip|vlc|notepad\+\+|git for windows|putty/i;
export const deployOriginOf = (d: PatchDeployment): string =>
  AUTOMATIC_FAMILIES.test(d.name) && deployTaskTypeOf(d) === 'Install' ? 'Automatic Patch Deployment' : 'Manual Remote Deploy';

/* Still Ready to Deploy or In Progress, with a window that closes inside the next 48 hours —
   the run an operator has to watch tonight. Two conditions, one field (see `x_lapsed`). */
export const deployExpiringOf = (d: PatchDeployment): string => {
  if (!['Ready to Deploy', 'In Progress'].includes(d.status)) return 'No';
  const end = parseDeployDate(d.expiryDate);
  if (!end) return 'No';
  const left = end.getTime() - Date.now();
  return left > 0 && left <= 48 * 36e5 ? 'Yes' : 'No';
};

/* Scope. The record carries no counts of its own — the detail page builds them from its
   patch × endpoint matrix — so they are derived deterministically per id here and stay
   stable across reloads. */
const deploySeed = (d: PatchDeployment) => [...d.id].reduce((a, c) => a + c.charCodeAt(0), 0);
export const deployPatchCountOf = (d: PatchDeployment): number => 1 + (deploySeed(d) % 12);
export const deployEndpointCountOf = (d: PatchDeployment): number => 3 + ((deploySeed(d) * 7) % 180);

/** Who set the run up, and when it was created / last touched. */
const DEPLOY_OWNERS = ['Rakesh Rathod', 'Sarah Johnson', 'Chintan Makwana', 'Priya Nair', 'Siddharth Rao'];
/* A schedule-created run has no human creator — the same "System" the patch catalogue uses
   for a scanned patch, and the grid's Created By cell drops the avatar for it. */
export const deployCreatedByOf = (d: PatchDeployment): string =>
  deployOriginOf(d) === 'Automatic Patch Deployment' ? 'System' : DEPLOY_OWNERS[deploySeed(d) % DEPLOY_OWNERS.length];
/* Usually the same person who set it up; a run that someone else has since touched (paused,
   rescheduled, cancelled) carries their name instead. */
export const deployUpdatedByOf = (d: PatchDeployment): string =>
  ['Cancelled', 'Expired', 'In Progress'].includes(d.status)
    ? DEPLOY_OWNERS[(deploySeed(d) + 2) % DEPLOY_OWNERS.length]
    : deployCreatedByOf(d);
export const deployCreatedDateOf = (d: PatchDeployment): Date => {
  /* Created before the window it schedules — a run cannot be made after it starts. */
  const anchor = parseDeployDate(d.installAfter) ?? parseDeployDate(d.expiryDate) ?? new Date();
  const out = new Date(anchor);
  out.setDate(out.getDate() - (2 + (deploySeed(d) % 21)));
  return out;
};
export const deployUpdatedDateOf = (d: PatchDeployment): Date => {
  const out = new Date(deployCreatedDateOf(d));
  out.setHours(out.getHours() + 2 + (deploySeed(d) % 60));
  return out;
};

/** Adapt a deployment record onto the Patch shape the cloned PatchDeploymentDrawer body expects
 *  (same pattern as the drawer clone chain's XToAssetShape adapters). */
export const deploymentToPatchShape = (d: PatchDeployment): Patch => ({
  id: d.id,
  name: d.name,
  severity: 'Unspecified',
  releaseDate: d.installAfter ?? '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: d.status === 'Draft' || d.status === 'Cancelled' ? 'Not Approved' : 'Approved',
  category: 'Deployment',
  deployment: { status: d.status, policy: d.deploymentPolicy, installAfter: d.installAfter, expiryDate: d.expiryDate, deploymentType: d.deploymentType },
});

export function PatchDeploymentsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [deployments, setDeployments] = useState<PatchDeployment[]>(mockPatchDeployments);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<DeploymentView>(DEPLOYMENT_VIEWS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, view]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenDeployment = (d: PatchDeployment) => {
    openInStack('patch-deployments', d.id, d.name, deploymentToPatchShape(d));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(deployments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(d => d.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = deployments.filter((d) => inView(d, view));
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.deploymentPolicy.toLowerCase().includes(q) ||
      (d.installAfter ?? '').toLowerCase().includes(q) ||
      (d.expiryDate ?? '').toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(d => d.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="patch-deployments" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        {creating ? (
          <CreatePatchDeployment
            onCancel={() => setCreating(false)}
            onCreate={(d) => {
              setDeployments((prev) => [d, ...prev]);
              setCreating(false);
              // Land on a view that can actually show what was just created.
              setView(DEPLOYMENT_VIEWS.find((v) => inView(d, v)) ?? DEPLOYMENT_VIEWS[0]);
            }}
          />
        ) : (
        <>
        <PatchDeploymentsToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          view={view}
          onView={setView}
          onCreate={() => setCreating(true)}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            {paginated.length === 0 ? (
              <div className="px-6 py-16 text-center text-[13px] text-[#9CA3AF]">
                No deployments in “{view.label}”{searchQuery.trim() ? ` match “${searchQuery}”` : ''}.
              </div>
            ) : (
              <PatchDeploymentsTable
                deployments={paginated}
                selected={selected}
                allSelected={allCurrentSelected}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onDeploymentClick={handleOpenDeployment}
              />
            )}
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
        </>
        )}
      </div>
    </div>
  );
}
