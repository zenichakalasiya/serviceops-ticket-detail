import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, RefreshCw, Columns3, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PackageDeploymentsTable } from './PackageDeploymentsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { relativeStamp } from './dateFormat';
import type { Patch } from './PatchesListPage';

/* Package module — "Package Deployments" listing (opened from the Package sidebar flyout).
 * Columns: ID (CDR-##) · Name · Status · Deployment Policy · Install After · Expiry Date ·
 * Created Date. Cloned from the Patch Deployments list page; separate file so the two can
 * diverge (packages roll out applications, not patches). */

export type PackageDeploymentStatus = 'Ready to Deploy' | 'In Progress' | 'Completed' | 'Cancelled' | 'Expired' | 'Draft';

export interface PackageDeployment {
  id: string;
  /** The software package this run installs (product + version). */
  name: string;
  status: PackageDeploymentStatus;
  deploymentPolicy: string;
  /** Scheduled install-after datetime, or null = --- (deploys immediately). */
  installAfter: string | null;
  /** Deployment window expiry, or null = --- (no expiry). */
  expiryDate: string | null;
  createdDate: string;
}

// Realistic package rollouts — named after the application + version being pushed.
// ⚠️ The runs still Ready to Deploy / In Progress state their window RELATIVE to today
// (`relativeStamp`) so they sit against the real clock — see mockPatchDeployments.
export const mockPackageDeployments: PackageDeployment[] = [
  { id: 'CDR-42', name: 'AnyDesk 8.0.11 — Support Team Workstations', status: 'Ready to Deploy', deploymentPolicy: '24x7 Deployment Policy', installAfter: null, expiryDate: relativeStamp(1, 17, 42), createdDate: 'Wed, Jul 29, 2026 05:43 PM' },
  { id: 'CDR-41', name: 'Google Chrome Enterprise 124.0.6367', status: 'In Progress', deploymentPolicy: 'Business Hours Deployment Policy', installAfter: relativeStamp(-2, 21), expiryDate: relativeStamp(12, 21), createdDate: 'Tue, Jul 21, 2026 11:18 AM' },
  { id: 'CDR-40', name: 'Zoom Workplace 6.0.10 — Conference Room PCs', status: 'Ready to Deploy', deploymentPolicy: 'After Business Hours Policy', installAfter: relativeStamp(2, 23), expiryDate: null, createdDate: 'Mon, Jul 20, 2026 04:05 PM' },
  { id: 'CDR-39', name: 'Microsoft Teams 24004.1309 — All Workstations', status: 'Completed', deploymentPolicy: 'Now', installAfter: null, expiryDate: 'Tue, Aug 04, 2026 02:31 PM', createdDate: 'Mon, Jul 20, 2026 02:32 PM' },
  { id: 'CDR-38', name: 'Slack Desktop 4.37.101 — Sales Department', status: 'Cancelled', deploymentPolicy: 'Business Hours Deployment Policy', installAfter: null, expiryDate: 'Tue, Aug 04, 2026 12:44 PM', createdDate: 'Mon, Jul 20, 2026 12:45 PM' },
  { id: 'CDR-37', name: 'Adobe Acrobat Reader DC 24.002.20857', status: 'Expired', deploymentPolicy: 'Now', installAfter: null, expiryDate: 'Tue, Aug 04, 2026 11:55 AM', createdDate: 'Mon, Jul 20, 2026 11:56 AM' },
  { id: 'CDR-36', name: '7-Zip 24.05 (x64) — Fleet-wide', status: 'Completed', deploymentPolicy: '24x7 Deployment Policy', installAfter: 'Wed, Jul 15, 2026 08:00 PM', expiryDate: 'Wed, Jul 29, 2026 08:00 PM', createdDate: 'Mon, Jul 13, 2026 09:22 AM' },
  { id: 'CDR-35', name: 'Visual Studio Code 1.89.1 — Engineering', status: 'Completed', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: 'Fri, Jul 24, 2026 05:40 PM', createdDate: 'Thu, Jul 09, 2026 05:40 PM' },
  { id: 'CDR-34', name: 'Git for Windows 2.45.1 — Developer Machines', status: 'Completed', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: 'Fri, Jul 24, 2026 05:39 PM', createdDate: 'Thu, Jul 09, 2026 05:40 PM' },
  { id: 'CDR-33', name: 'Node.js 20.12.2 LTS — Build Agents', status: 'Completed', deploymentPolicy: 'App Servers — Maintenance Window', installAfter: 'Sun, Jul 05, 2026 02:00 AM', expiryDate: null, createdDate: 'Wed, Jul 01, 2026 03:47 PM' },
  { id: 'CDR-32', name: 'Docker Desktop 4.29.0 — Engineering Workstations', status: 'In Progress', deploymentPolicy: 'After Business Hours Policy', installAfter: relativeStamp(-3, 22), expiryDate: relativeStamp(1, 22), createdDate: 'Mon, Jun 29, 2026 10:14 AM' },
  { id: 'CDR-31', name: 'Notepad++ 8.6.5 — All Workstations', status: 'Cancelled', deploymentPolicy: '24x7 Deployment Policy', installAfter: null, expiryDate: 'Tue, Jul 28, 2026 12:28 PM', createdDate: 'Mon, Jun 22, 2026 12:29 PM' },
  { id: 'CDR-30', name: 'FileZilla Client 3.67.0 — IT Operations', status: 'Completed', deploymentPolicy: 'Now', installAfter: null, expiryDate: null, createdDate: 'Thu, Jun 18, 2026 02:55 PM' },
  { id: 'CDR-29', name: 'PuTTY 0.81 — Network Team', status: 'Completed', deploymentPolicy: 'Now', installAfter: null, expiryDate: 'Wed, Jul 01, 2026 09:10 AM', createdDate: 'Wed, Jun 17, 2026 09:11 AM' },
  { id: 'CDR-28', name: 'VLC Media Player 3.0.20 — Media Workstations', status: 'Expired', deploymentPolicy: 'Weekend Deployment Policy', installAfter: 'Sat, Jun 13, 2026 11:00 PM', expiryDate: 'Sat, Jun 27, 2026 11:00 PM', createdDate: 'Wed, Jun 10, 2026 04:31 PM' },
  { id: 'CDR-27', name: 'Mozilla Firefox ESR 115.11 — Kiosk Devices', status: 'Completed', deploymentPolicy: 'Kiosk Devices — Overnight Only', installAfter: 'Tue, Jun 09, 2026 01:00 AM', expiryDate: null, createdDate: 'Fri, Jun 05, 2026 11:26 AM' },
  { id: 'CDR-26', name: 'Microsoft Power BI Desktop 2.128 — Finance', status: 'Completed', deploymentPolicy: 'Business Hours Deployment Policy', installAfter: null, expiryDate: 'Fri, Jun 19, 2026 03:12 PM', createdDate: 'Mon, Jun 01, 2026 03:13 PM' },
  { id: 'CDR-25', name: 'TeamViewer 15.53 — Field Support Laptops', status: 'Draft', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: null, expiryDate: null, createdDate: 'Thu, May 28, 2026 05:08 PM' },
  { id: 'CDR-24', name: 'Postman 11.2.0 — API Development Team', status: 'Completed', deploymentPolicy: 'Developer Tools — Self Service', installAfter: null, expiryDate: 'Wed, Jun 10, 2026 10:45 AM', createdDate: 'Wed, May 27, 2026 10:46 AM' },
  { id: 'CDR-23', name: 'Zoho Assist Unattended Agent 4.2 — Service Desk', status: 'Completed', deploymentPolicy: 'Now', installAfter: null, expiryDate: null, createdDate: 'Mon, May 25, 2026 01:37 PM' },
  { id: 'CDR-22', name: 'AutoCAD 2026 — Design Team Workstations', status: 'Completed', deploymentPolicy: 'Weekend Deployment Policy', installAfter: 'Sat, May 23, 2026 09:00 PM', expiryDate: 'Sat, Jun 06, 2026 09:00 PM', createdDate: 'Tue, May 19, 2026 09:52 AM' },
  { id: 'CDR-21', name: 'Wireshark 4.2.5 — Network Operations', status: 'Cancelled', deploymentPolicy: 'After Business Hours Policy', installAfter: null, expiryDate: 'Fri, May 29, 2026 06:20 PM', createdDate: 'Fri, May 15, 2026 06:21 PM' },
  { id: 'CDR-20', name: 'Microsoft Project 2024 — PMO Team', status: 'Completed', deploymentPolicy: 'Business Hours Deployment Policy', installAfter: null, expiryDate: 'Thu, May 21, 2026 11:04 AM', createdDate: 'Thu, May 07, 2026 11:05 AM' },
  { id: 'CDR-19', name: 'OpenVPN Connect 3.4.6 — Remote Workforce', status: 'Completed', deploymentPolicy: 'Remote Offices — Bandwidth Throttled', installAfter: 'Mon, May 04, 2026 08:30 PM', expiryDate: null, createdDate: 'Wed, Apr 29, 2026 02:40 PM' },
  { id: 'CDR-18', name: 'Sophos Endpoint Agent 2024.2 — Fleet-wide', status: 'Completed', deploymentPolicy: 'Now', installAfter: null, expiryDate: 'Fri, May 08, 2026 09:15 AM', createdDate: 'Fri, Apr 24, 2026 09:16 AM' },
  { id: 'CDR-17', name: 'Python 3.12.3 Runtime — Data Science Team', status: 'Expired', deploymentPolicy: 'Developer Tools — Self Service', installAfter: 'Tue, Apr 21, 2026 07:00 PM', expiryDate: 'Tue, May 05, 2026 07:00 PM', createdDate: 'Fri, Apr 17, 2026 04:12 PM' },
  { id: 'CDR-16', name: 'Citrix Workspace App 2402 — Warehouse Terminals', status: 'Completed', deploymentPolicy: 'Kiosk Devices — Overnight Only', installAfter: 'Wed, Apr 15, 2026 01:00 AM', expiryDate: null, createdDate: 'Mon, Apr 13, 2026 10:33 AM' },
  { id: 'CDR-15', name: 'Tableau Desktop 2024.1 — Business Intelligence', status: 'Completed', deploymentPolicy: 'Business Hours Deployment Policy', installAfter: null, expiryDate: 'Thu, Apr 23, 2026 03:28 PM', createdDate: 'Thu, Apr 09, 2026 03:29 PM' },
];

/** Adapt a package deployment onto the Patch shape the cloned PackageDeploymentDrawer body
 *  expects (same pattern as the drawer clone chain's XToShape adapters). */
/* ── Derived run attributes ───────────────────────────────────────────────────
   Same shape as the patch-deployment derivations — the two run lists are the same kind of
   record. Derived here, once, so the listing row and the record it opens agree. */

export const parsePkgDate = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

/* Where the run sits against the clock — the cut `status` alone cannot make, since a run can
   read "Ready to Deploy" with a window that closed last week. */
export const pkgWindowOf = (d: PackageDeployment): string => {
  const start = parsePkgDate(d.installAfter);
  const end = parsePkgDate(d.expiryDate);
  if (!start && !end) return 'No window';
  const now = Date.now();
  if (end && end.getTime() < now) return 'Window closed';
  if (start && start.getTime() > now) return 'Scheduled';
  return 'Live now';
};

/* Still Ready to Deploy or In Progress, with a window that closes inside the next 48 hours.
   Two conditions, one field — the listing's "Expiring in 48h" card reads it. */
export const pkgExpiringOf = (d: PackageDeployment): string => {
  if (!['Ready to Deploy', 'In Progress'].includes(d.status)) return 'No';
  const end = parsePkgDate(d.expiryDate);
  if (!end) return 'No';
  const left = end.getTime() - Date.now();
  return left > 0 && left <= 48 * 36e5 ? 'Yes' : 'No';
};

/** Install or Uninstall — a removal run says so in its name. The product calls this the
 *  Configuration Type, the same as on the registry list. */
export const pkgConfigTypeOf = (d: PackageDeployment): string =>
  /\b(uninstall|rollback|remove|removal|revert)\b/i.test(d.name) ? 'Uninstall' : 'Install';

const pkgSeed = (d: PackageDeployment) => [...d.id].reduce((a, c) => a + c.charCodeAt(0), 0);
/* Scope. The record carries no counts of its own — the detail page builds them from its
   package × endpoint matrix — so they are derived per id here and stay stable across loads. */
export const pkgPackageCountOf = (d: PackageDeployment): number => 1 + (pkgSeed(d) % 6);
export const pkgEndpointCountOf = (d: PackageDeployment): number => 5 + ((pkgSeed(d) * 7) % 220);

const PKG_OWNERS = ['Rakesh Rathod', 'Sarah Johnson', 'Chintan Makwana', 'Priya Nair', 'Siddharth Rao'];
export const pkgCreatedByOf = (d: PackageDeployment): string => PKG_OWNERS[pkgSeed(d) % PKG_OWNERS.length];
/** A run someone has since touched (paused, rescheduled, cancelled) carries their name. */
export const pkgUpdatedByOf = (d: PackageDeployment): string =>
  ['Cancelled', 'Expired', 'In Progress'].includes(d.status)
    ? PKG_OWNERS[(pkgSeed(d) + 2) % PKG_OWNERS.length]
    : pkgCreatedByOf(d);
export const pkgUpdatedDateOf = (d: PackageDeployment): Date => {
  const base = parsePkgDate(d.createdDate) ?? new Date();
  const out = new Date(base);
  out.setHours(out.getHours() + 2 + (pkgSeed(d) % 72));
  return out;
};

export const packageDeploymentToPatchShape = (d: PackageDeployment): Patch => ({
  id: d.id,
  name: d.name,
  severity: 'Unspecified',
  releaseDate: d.installAfter ?? '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: d.status === 'Draft' || d.status === 'Cancelled' ? 'Not Approved' : 'Approved',
  category: 'Package Deployment',
  deployment: { status: d.status, policy: d.deploymentPolicy, installAfter: d.installAfter, expiryDate: d.expiryDate },
});

// Toolbar tailored to the Package Deployments list (title + view + action icons + CTA).
function PackageDeploymentsToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  const IconBtn = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]" title={title}>
      {children}
    </button>
  );
  return (
    <div className="bg-white">
      {/* First Row: Title + view dropdown + actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-semibold text-[#364658]">Package Deployments</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>Pending Deployments</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          <button className="ml-2 flex h-[34px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
            <Plus size={15} />
            Create Package Deployment
          </button>
        </div>
      </div>

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"
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

export function PackageDeploymentsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [deployments] = useState<PackageDeployment[]>(mockPackageDeployments);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenDeployment = (d: PackageDeployment) => {
    openInStack('package-deployments', d.id, d.name, packageDeploymentToPatchShape(d));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(deployments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((d) => d.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = deployments;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = deployments.filter((d) =>
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.deploymentPolicy.toLowerCase().includes(q) ||
      (d.installAfter ?? '').toLowerCase().includes(q) ||
      (d.expiryDate ?? '').toLowerCase().includes(q) ||
      d.createdDate.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map((d) => d.id);
  const allCurrentSelected = currentPageIds.every((id) => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="package-deployments" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <PackageDeploymentsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto bg-white">
            <PackageDeploymentsTable
              deployments={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onDeploymentClick={handleOpenDeployment}
            />
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
      </div>
    </div>
  );
}
