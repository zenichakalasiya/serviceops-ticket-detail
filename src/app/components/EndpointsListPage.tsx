import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, FileText, Download, RefreshCw, Columns3 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EndpointsTable } from './EndpointsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';

export interface Endpoint {
  id: string;
  /** Agent reachable right now — drives the small green/amber dot before the id pill. */
  agentOnline: boolean;
  hostName: string;
  ipAddress: string;
  osName: string;
  /** OS build, or null = --- (agent has not reported an inventory yet) */
  version: string | null;
  servicePack: string | null;
  architecture: '64 BIT' | '32 BIT';
  remoteOffice: string | null;
  systemHealth: 'Healthy' | 'Warning' | 'Critical' | null;
  tags: string[];
  rebootRequired: 'Yes' | 'No';
}

// Realistic corporate fleet (mirrors the Patch Endpoint tab's naming/offices — no test data).
export const mockEndpoints: Endpoint[] = [
  { id: 'EP-408', agentOnline: true, hostName: 'FIN-LT-0188', ipAddress: '10.20.22.188', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8328', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Mumbai Office', systemHealth: 'Healthy', tags: ['finance'], rebootRequired: 'No' },
  { id: 'EP-406', agentOnline: true, hostName: 'SAL-LT-0204', ipAddress: '10.20.23.204', osName: 'Microsoft Windows 10 Enterprise', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Bengaluru Campus', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-400', agentOnline: true, hostName: 'ENG-LT-0312', ipAddress: '10.20.19.112', osName: 'Ubuntu Linux 22.04 LTS', version: '6.8.0-45-generic', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Hyderabad Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'Yes' },
  { id: 'EP-397', agentOnline: true, hostName: 'Jevyjava-LT', ipAddress: '192.168.112.75', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8655', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-396', agentOnline: false, hostName: 'DESKTOP-A19KJ', ipAddress: '10.20.41.40', osName: 'Microsoft Windows 10 Pro', version: null, servicePack: null, architecture: '64 BIT', remoteOffice: 'Mumbai Office', systemHealth: null, tags: [], rebootRequired: 'No' },
  { id: 'EP-392', agentOnline: true, hostName: 'DHRUVPANCHAL', ipAddress: '10.20.40.202', osName: 'macOS 14 Sonoma', version: '14.7.1 (23H222)', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-391', agentOnline: true, hostName: 'Adarsh-PC', ipAddress: '192.168.1.11', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Bengaluru Campus', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-389', agentOnline: false, hostName: 'DESKTOP-N81KQ', ipAddress: '10.20.41.103', osName: 'Red Hat Enterprise Linux 9', version: '5.14.0-427.el9', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Delhi NCR Office', systemHealth: 'Warning', tags: [], rebootRequired: 'Yes' },
  { id: 'EP-388', agentOnline: true, hostName: 'PARTH-UPADHYAY', ipAddress: '10.20.40.182', osName: 'macOS 15 Sequoia', version: '15.5 (24F74)', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-386', agentOnline: true, hostName: 'DESKTOP-DK09P', ipAddress: '192.168.0.104', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Bengaluru Campus', systemHealth: 'Healthy', tags: ['vip'], rebootRequired: 'No' },
  { id: 'EP-384', agentOnline: true, hostName: 'ARJUN-CHAUHAN', ipAddress: '192.168.1.14', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Pune Development Center', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-383', agentOnline: false, hostName: 'DESKTOP-5F2AL', ipAddress: '192.168.29.101', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Delhi NCR Office', systemHealth: null, tags: [], rebootRequired: 'No' },
  { id: 'EP-382', agentOnline: true, hostName: 'ACI10068-LP', ipAddress: '20.0.20.32', osName: 'Microsoft Windows 10 Enterprise', version: '10.0.19045.6216', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-381', agentOnline: true, hostName: 'ACI10053-LP', ipAddress: '20.0.20.77', osName: 'Microsoft Windows 10 Enterprise', version: '10.0.19045.6396', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Warning', tags: [], rebootRequired: 'Yes' },
  { id: 'EP-380', agentOnline: true, hostName: 'ACIWSUSV-01', ipAddress: '192.168.1.13', osName: 'Microsoft Windows Server 2022 Standard', version: '10.0.20348.2762', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: ['server', 'wsus'], rebootRequired: 'No' },
  { id: 'EP-378', agentOnline: false, hostName: 'DESKTOP-BFUU5TA', ipAddress: '10.20.40.85', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6456', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', systemHealth: null, tags: [], rebootRequired: 'No' },
  { id: 'EP-374', agentOnline: true, hostName: 'Dharati-Bhimani', ipAddress: '10.20.40.205', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6456', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-372', agentOnline: true, hostName: 'Suryatop-Sasmal', ipAddress: '172.20.10.2', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Dubai Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-368', agentOnline: true, hostName: 'DESKTOP-A3RMK1H', ipAddress: '10.20.40.67', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Dubai Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-367', agentOnline: true, hostName: 'Krutarth-Desktop', ipAddress: '10.20.41.23', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.6899', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-361', agentOnline: true, hostName: 'HR-DT-0142', ipAddress: '10.20.21.142', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.6216', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-357', agentOnline: false, hostName: 'REC-DT-0023', ipAddress: '10.20.21.23', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.5011', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', systemHealth: 'Critical', tags: ['kiosk'], rebootRequired: 'Yes' },
  { id: 'EP-352', agentOnline: true, hostName: 'DC1-APP-01', ipAddress: '10.20.40.21', osName: 'Microsoft Windows Server 2019 Datacenter', version: '10.0.17763.6893', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: ['server'], rebootRequired: 'No' },
  { id: 'EP-351', agentOnline: true, hostName: 'DC1-DB-01', ipAddress: '10.20.40.33', osName: 'Microsoft Windows Server 2022 Datacenter', version: '10.0.20348.2762', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', systemHealth: 'Healthy', tags: ['server', 'database'], rebootRequired: 'No' },
  { id: 'EP-349', agentOnline: true, hostName: 'DESKTOP-1KQZ9', ipAddress: '10.59.98.96', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.6101', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-346', agentOnline: true, hostName: 'SUP-LT-0108', ipAddress: '10.20.24.108', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.6300', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Mumbai Office', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-341', agentOnline: false, hostName: 'OFC-PRT-0207', ipAddress: '10.20.30.207', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.5011', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Dubai Office', systemHealth: 'Warning', tags: ['kiosk'], rebootRequired: 'No' },
  { id: 'EP-338', agentOnline: true, hostName: 'MKT-LT-0221', ipAddress: '10.20.25.221', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8328', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Bengaluru Campus', systemHealth: 'Healthy', tags: [], rebootRequired: 'No' },
  { id: 'EP-334', agentOnline: true, hostName: 'ENG-LT-0284', ipAddress: '10.20.19.84', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8037', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Pune Development Center', systemHealth: 'Healthy', tags: [], rebootRequired: 'Yes' },
  { id: 'EP-329', agentOnline: true, hostName: 'FIN-DT-0067', ipAddress: '10.20.22.67', osName: 'Microsoft Windows 10 Enterprise', version: '10.0.19045.6396', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Mumbai Office', systemHealth: 'Healthy', tags: ['finance'], rebootRequired: 'No' },
];

// Toolbar tailored to the Endpoints list (title + view + action icons; no create CTA).
function EndpointsToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
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
          <h1 className="text-[16px] font-semibold text-[#364658]">Endpoints</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>All Endpoints</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="Export"><FileText size={16} /></IconBtn>
          <IconBtn title="Download"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
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

/* ── Derived endpoint attributes ──────────────────────────────────────────────
   The product's listing filters on a wider record than the mock stores — the domain, the
   subnet, and the vulnerability scan results. Derived HERE, once, so the listing row and the
   detail page it opens read the same values. */

/** Windows machines are domain-joined; the Linux and macOS fleet is not. */
export const endpointDomainOf = (e: Endpoint): string =>
  !e.version ? '—' : /windows/i.test(e.osName) ? 'motadata.local' : 'WORKGROUP';

/** The /24 the address sits in — the unit remote offices are actually allocated in. */
export const endpointIpRangeOf = (e: Endpoint): string => {
  const m = e.ipAddress.match(/^(\d+)\.(\d+)\.(\d+)\.\d+$/);
  return m ? `${m[1]}.${m[2]}.${m[3]}.0/24` : '—';
};

/* Scan results. An endpoint that has never reported an inventory (no OS build) has never
   been scanned either — it reads "—" and 0, which is the true answer rather than a zero
   that would claim a clean machine. Counts are deterministic per id and weighted by health,
   so the fleet's worst machines are also its most vulnerable ones. */
const scanSeed = (e: Endpoint) => [...e.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
export const endpointScanned = (e: Endpoint): boolean => !!e.version;
export const endpointOsVulnsOf = (e: Endpoint): number => {
  if (!endpointScanned(e)) return 0;
  const weight = e.systemHealth === 'Critical' ? 18 : e.systemHealth === 'Warning' ? 9 : 3;
  return weight + (scanSeed(e) % Math.max(2, Math.round(weight / 2)));
};
export const endpointSoftwareVulnsOf = (e: Endpoint): number => {
  if (!endpointScanned(e)) return 0;
  const weight = e.systemHealth === 'Critical' ? 11 : e.systemHealth === 'Warning' ? 6 : 2;
  return weight + ((scanSeed(e) * 3) % Math.max(2, weight));
};
export const endpointVulnCountOf = (e: Endpoint): number =>
  endpointOsVulnsOf(e) + endpointSoftwareVulnsOf(e);

/** Last vulnerability scan, staggered so a fleet does not all scan at once. Most of the fleet
 *  scanned inside the week; roughly one machine in four has not been reached for 8–17 days —
 *  the "Not Scanned in 7 Days" cut the listing's KPI strip makes. */
export const endpointScanDateOf = (e: Endpoint): Date | null => {
  if (!endpointScanned(e)) return null;
  const h = scanSeed(e) % 17;
  const hoursAgo = h < 13 ? 1 + h * 12 : 24 * (8 + (h - 13) * 3);
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d;
};

/** Patches the scanner found missing on this machine — weighted by System Health like the
 *  vulnerability counts, so the fleet's unhealthiest machines are also its least patched. A
 *  machine that has never reported an inventory has never been scanned: 0, not a guess. */
export const endpointMissingPatchesOf = (e: Endpoint): number => {
  if (!endpointScanned(e)) return 0;
  const s = scanSeed(e);
  if (e.systemHealth === 'Critical') return 9 + (s % 6);
  if (e.systemHealth === 'Warning') return 4 + (s % 4);
  return s % 3 === 0 ? 1 + (s % 2) : 0;
};

/** Adapt an endpoint onto the Patch shape the cloned EndpointDrawer body expects
 *  (same pattern as the deployment adapter). */
export const endpointToPatchShape = (e: Endpoint): Patch => ({
  id: e.id,
  name: e.hostName,
  severity: 'Unspecified',
  releaseDate: '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: e.rebootRequired === 'Yes' ? 'Yes' : 'No',
  approvalStatus: 'Approved',
  category: 'Endpoint',
  /* `osVersion` is the reported BUILD — the OS Lifecycle card needs it to tell 22H2 from
     25H2, which the OS name alone never says. */
  endpoint: { agentOnline: e.agentOnline, systemHealth: e.systemHealth, osName: e.osName, ipAddress: e.ipAddress, osVersion: e.version },
});

export function EndpointsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [endpoints] = useState<Endpoint[]>(mockEndpoints);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenEndpoint = (e: Endpoint) => {
    openInStack('endpoints', e.id, e.hostName, endpointToPatchShape(e));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(endpoints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(e => e.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = endpoints;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = endpoints.filter(e =>
      e.id.toLowerCase().includes(q) ||
      e.hostName.toLowerCase().includes(q) ||
      e.ipAddress.toLowerCase().includes(q) ||
      e.osName.toLowerCase().includes(q) ||
      (e.version ?? '').toLowerCase().includes(q) ||
      (e.remoteOffice ?? '').toLowerCase().includes(q) ||
      (e.systemHealth ?? '').toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(e => e.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="endpoints" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <EndpointsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <EndpointsTable
              endpoints={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onEndpointClick={handleOpenEndpoint}
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
