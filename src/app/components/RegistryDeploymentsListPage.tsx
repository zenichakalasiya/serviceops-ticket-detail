import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, RefreshCw, Columns3, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RegistryDeploymentsTable } from './RegistryDeploymentsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { relativeStamp } from './dateFormat';
import type { Patch } from './PatchesListPage';

/* Package module — "Registry Deployments" listing (opened from the Package sidebar flyout).
 * Columns: ID (CDR-###) · Name · Status · Install After · Expiry Date · Total Installations ·
 * Created By · Configuration Type. Cloned from the Package Deployments list page; separate file
 * so the two can diverge (registry runs push keys/values, not application packages). */

export type RegistryDeploymentStatus = 'Ready to Deploy' | 'In Progress' | 'Completed' | 'Cancelled' | 'Expired' | 'Draft';

export interface RegistryDeployment {
  id: string;
  /** The registry configuration this run applies. */
  name: string;
  status: RegistryDeploymentStatus;
  /** Scheduled install-after datetime, or null = --- (applies immediately). */
  installAfter: string | null;
  /** Deployment window expiry, or null = --- (no expiry). */
  expiryDate: string | null;
  /** Endpoints the configuration has been applied to, or null = --- (nothing run yet). */
  totalInstallations: number | null;
  createdBy: string;
  configurationType: 'Install' | 'Uninstall';
}

// Realistic registry rollouts — hardening baselines and policy keys pushed to the fleet.
// ⚠️ The runs still Ready to Deploy / In Progress state their window RELATIVE to today
// (`relativeStamp`) so they sit against the real clock — see mockPatchDeployments.
export const mockRegistryDeployments: RegistryDeployment[] = [
  { id: 'CDR-133', name: 'Disable SMBv1 Protocol — Fleet-wide Hardening', status: 'Cancelled', installAfter: 'Thu, Nov 06, 2025 12:28 PM', expiryDate: 'Thu, Nov 30, 2028 12:28 PM', totalInstallations: 144, createdBy: 'Jay Vegda', configurationType: 'Install' },
  { id: 'CDR-131', name: 'Enable Windows Defender Tamper Protection', status: 'In Progress', installAfter: relativeStamp(-2, 21), expiryDate: relativeStamp(1, 21), totalInstallations: 82, createdBy: 'Priya Nair', configurationType: 'Install' },
  { id: 'CDR-128', name: 'Set Screen Lock Timeout — 10 Minutes', status: 'Completed', installAfter: 'Mon, Jul 13, 2026 08:30 PM', expiryDate: null, totalInstallations: 213, createdBy: 'Karan Malhotra', configurationType: 'Install' },
  { id: 'CDR-124', name: 'Enforce TLS 1.2 for .NET Applications', status: 'Completed', installAfter: 'Sat, Jul 04, 2026 11:00 PM', expiryDate: 'Sat, Jul 18, 2026 11:00 PM', totalInstallations: 96, createdBy: 'Rahul Verma', configurationType: 'Install' },
  { id: 'CDR-121', name: 'Enable PowerShell Script Block Logging', status: 'Ready to Deploy', installAfter: relativeStamp(1, 22), expiryDate: null, totalInstallations: null, createdBy: 'Neha Raje', configurationType: 'Install' },
  { id: 'CDR-118', name: 'Disable Autorun on Removable Media', status: 'Completed', installAfter: 'Wed, Jun 24, 2026 07:45 PM', expiryDate: 'Wed, Jul 08, 2026 07:45 PM', totalInstallations: 187, createdBy: 'Vikram Sethi', configurationType: 'Install' },
  { id: 'CDR-115', name: 'Restrict Anonymous SAM Enumeration — Servers', status: 'Completed', installAfter: 'Sun, Jun 21, 2026 02:00 AM', expiryDate: null, totalInstallations: 41, createdBy: 'Farah Sheikh', configurationType: 'Install' },
  { id: 'CDR-112', name: 'Configure Corporate Proxy Settings — Remote Offices', status: 'In Progress', installAfter: relativeStamp(-3, 18, 30), expiryDate: relativeStamp(11, 18, 30), totalInstallations: 34, createdBy: 'Rohan Mehta', configurationType: 'Install' },
  { id: 'CDR-109', name: 'Disable LLMNR and NetBIOS Name Resolution', status: 'Expired', installAfter: 'Tue, May 19, 2026 09:00 PM', expiryDate: 'Tue, Jun 02, 2026 09:00 PM', totalInstallations: 58, createdBy: 'Meeral Pithwa (Archived)', configurationType: 'Install' },
  { id: 'CDR-106', name: 'Legacy Java Applet Trust Keys — Cleanup', status: 'Completed', installAfter: 'Mon, May 11, 2026 08:00 PM', expiryDate: null, totalInstallations: 63, createdBy: 'Diya Kapoor', configurationType: 'Uninstall' },
  { id: 'CDR-103', name: 'Enable Credential Guard — Executive Laptops', status: 'Completed', installAfter: 'Sat, May 02, 2026 10:00 PM', expiryDate: 'Sat, May 16, 2026 10:00 PM', totalInstallations: 27, createdBy: 'Siddharth Rao', configurationType: 'Install' },
  { id: 'CDR-99', name: 'Configure NTP Server — Domain Controllers', status: 'Completed', installAfter: 'Sun, Apr 26, 2026 03:00 AM', expiryDate: null, totalInstallations: 8, createdBy: 'Ananya Iyer', configurationType: 'Install' },
  { id: 'CDR-95', name: 'Disable Cortana and Web Search in Start Menu', status: 'Cancelled', installAfter: null, expiryDate: null, totalInstallations: null, createdBy: 'pramod (Archived)', configurationType: 'Install' },
  { id: 'CDR-92', name: 'Set Event Log Retention — 90 Days', status: 'Completed', installAfter: 'Fri, Apr 17, 2026 09:30 PM', expiryDate: 'Fri, May 01, 2026 09:30 PM', totalInstallations: 174, createdBy: 'Priya Nair', configurationType: 'Install' },
  { id: 'CDR-88', name: 'Disable USB Mass Storage — Finance Department', status: 'Completed', installAfter: 'Tue, Apr 07, 2026 08:00 PM', expiryDate: null, totalInstallations: 46, createdBy: 'Karan Malhotra', configurationType: 'Install' },
  { id: 'CDR-84', name: 'Windows Update Deferral Policy — Production Servers', status: 'Expired', installAfter: 'Wed, Mar 25, 2026 11:00 PM', expiryDate: 'Wed, Apr 08, 2026 11:00 PM', totalInstallations: 52, createdBy: 'Rahul Verma', configurationType: 'Install' },
  { id: 'CDR-80', name: 'Enable BitLocker Pre-Boot PIN Requirement', status: 'Completed', installAfter: 'Sat, Mar 14, 2026 10:00 PM', expiryDate: null, totalInstallations: 118, createdBy: 'Neha Raje', configurationType: 'Install' },
  { id: 'CDR-76', name: 'Disable Remote Desktop — Kiosk Devices', status: 'Completed', installAfter: 'Mon, Mar 02, 2026 01:00 AM', expiryDate: 'Mon, Mar 16, 2026 01:00 AM', totalInstallations: 22, createdBy: 'Vikram Sethi', configurationType: 'Install' },
  { id: 'CDR-72', name: 'Set Google Chrome Homepage and Startup Policy', status: 'Draft', installAfter: null, expiryDate: null, totalInstallations: null, createdBy: 'Farah Sheikh', configurationType: 'Install' },
  { id: 'CDR-68', name: 'Deprecated Antivirus Exclusion Keys — Removal', status: 'Completed', installAfter: 'Thu, Feb 19, 2026 09:00 PM', expiryDate: null, totalInstallations: 91, createdBy: 'Rohan Mehta', configurationType: 'Uninstall' },
  { id: 'CDR-64', name: 'Enable Audit Logon Events — Domain Workstations', status: 'Completed', installAfter: 'Fri, Feb 06, 2026 08:30 PM', expiryDate: 'Fri, Feb 20, 2026 08:30 PM', totalInstallations: 201, createdBy: 'Diya Kapoor', configurationType: 'Install' },
  { id: 'CDR-60', name: 'Configure SNMP Community String — Network Devices', status: 'Cancelled', installAfter: null, expiryDate: null, totalInstallations: null, createdBy: 'Ashish (Archived)', configurationType: 'Install' },
  { id: 'CDR-56', name: 'Set Power Plan — High Performance for Servers', status: 'Completed', installAfter: 'Sun, Jan 25, 2026 02:00 AM', expiryDate: null, totalInstallations: 39, createdBy: 'Siddharth Rao', configurationType: 'Install' },
  { id: 'CDR-52', name: 'Registry Baseline for Windows Server 2022', status: 'In Progress', installAfter: 'Thu, Jun 13, 2026 06:43 PM', expiryDate: null, totalInstallations: 1, createdBy: 'Meeral Pithwa (Archived)', configurationType: 'Install' },
  { id: 'CDR-49', name: 'Disable NTLMv1 Authentication', status: 'Expired', installAfter: 'Thu, May 09, 2026 10:34 AM', expiryDate: 'Fri, May 10, 2026 10:34 AM', totalInstallations: 5, createdBy: 'pramod (Archived)', configurationType: 'Install' },
];

/** Adapt a registry deployment onto the Patch shape the cloned RegistryDeploymentDrawer body
 *  expects (same pattern as the drawer clone chain's XToShape adapters). */
/* ── Derived run attributes ───────────────────────────────────────────────────
   The record already carries Created By, the Configuration Type and a real installation
   count; what is missing is the clock-relative window, who last touched it, and the dates. */

export const parseRegDate = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const regWindowOf = (d: RegistryDeployment): string => {
  const start = parseRegDate(d.installAfter);
  const end = parseRegDate(d.expiryDate);
  if (!start && !end) return 'No window';
  const now = Date.now();
  if (end && end.getTime() < now) return 'Window closed';
  if (start && start.getTime() > now) return 'Scheduled';
  return 'Live now';
};

/* Still Ready to Deploy or In Progress, with a window that closes inside the next 48 hours.
   Two conditions, one field — the listing's "Expiring in 48h" card reads it. */
export const regExpiringOf = (d: RegistryDeployment): string => {
  if (!['Ready to Deploy', 'In Progress'].includes(d.status)) return 'No';
  const end = parseRegDate(d.expiryDate);
  if (!end) return 'No';
  const left = end.getTime() - Date.now();
  return left > 0 && left <= 48 * 36e5 ? 'Yes' : 'No';
};

const regSeed = (d: RegistryDeployment) => [...d.id].reduce((a, c) => a + c.charCodeAt(0), 0);
const REG_OWNERS = ['Rakesh Rathod', 'Sarah Johnson', 'Chintan Makwana', 'Priya Nair', 'Siddharth Rao'];
/** Created By is REAL on this record; only the last editor is derived. */
export const regUpdatedByOf = (d: RegistryDeployment): string =>
  ['Cancelled', 'Expired', 'In Progress'].includes(d.status)
    ? REG_OWNERS[(regSeed(d) + 2) % REG_OWNERS.length]
    : d.createdBy;

/* Created before the window it schedules — a run cannot be made after it starts. */
export const regCreatedDateOf = (d: RegistryDeployment): Date => {
  const anchor = parseRegDate(d.installAfter) ?? parseRegDate(d.expiryDate) ?? new Date();
  const out = new Date(anchor);
  out.setDate(out.getDate() - (2 + (regSeed(d) % 18)));
  return out;
};
export const regUpdatedDateOf = (d: RegistryDeployment): Date => {
  const out = new Date(regCreatedDateOf(d));
  out.setHours(out.getHours() + 2 + (regSeed(d) % 60));
  return out;
};

export const registryDeploymentToPatchShape = (d: RegistryDeployment): Patch => ({
  id: d.id,
  name: d.name,
  severity: 'Unspecified',
  releaseDate: d.installAfter ?? '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: d.status === 'Draft' || d.status === 'Cancelled' ? 'Not Approved' : 'Approved',
  category: 'Registry Deployment',
  deployment: { status: d.status, policy: d.configurationType, installAfter: d.installAfter, expiryDate: d.expiryDate },
});

// Toolbar tailored to the Registry Deployments list (title + view + action icons + CTA).
function RegistryDeploymentsToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
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
          <h1 className="text-[16px] font-semibold text-[#364658]">Registry Deployments</h1>
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
            Create Registry Deployment
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

export function RegistryDeploymentsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [deployments] = useState<RegistryDeployment[]>(mockRegistryDeployments);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenDeployment = (d: RegistryDeployment) => {
    openInStack('registry-deployments', d.id, d.name, registryDeploymentToPatchShape(d));
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
      (d.installAfter ?? '').toLowerCase().includes(q) ||
      (d.expiryDate ?? '').toLowerCase().includes(q) ||
      String(d.totalInstallations ?? '').includes(q) ||
      d.createdBy.toLowerCase().includes(q) ||
      d.configurationType.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map((d) => d.id);
  const allCurrentSelected = currentPageIds.every((id) => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="registry-deployments" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <RegistryDeploymentsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto bg-white">
            <RegistryDeploymentsTable
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
