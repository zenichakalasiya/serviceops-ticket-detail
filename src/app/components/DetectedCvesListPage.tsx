import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, Download, RefreshCw, Columns3, MoreVertical, FileOutput } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DetectedCvesTable } from './DetectedCvesTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';

/* Detected CVEs listing — opened from the Vulnerability sidebar flyout's "Detected CVEs" item.
 * Same grid design as the other list pages; rows are the CVEs found on scanned endpoints. */

export type CveSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface DetectedCve {
  id: string;
  description: string;
  severity: CveSeverity;
  cweId: string;
  impactedEndpoints: number;
  patchAvailability: 'Yes' | 'No';
  cvssScore: number;
  exploitStatus: 'Yes' | 'No';
  publishedDate: string;
  status: 'Modified' | 'Analyzed' | 'Awaiting Analysis';
}

// Realistic detected-CVE catalog (mock) — June 2024 Windows Patch-Tuesday style entries.
export const mockDetectedCves: DetectedCve[] = [
  { id: 'CVE-2024-30099', description: 'Windows Kernel Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-367', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30076', description: 'Windows Container Manager Service Elevation of Privilege Vulnerability', severity: 'Medium', cweId: 'CWE-59', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 6.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30063', description: 'Windows Distributed File System (DFS) Remote Code Execution Vulnerability', severity: 'Medium', cweId: 'CWE-641', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 6.7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30085', description: 'Windows Cloud Files Mini Filter Driver Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30094', description: 'Windows Routing and Remote Access Service (RRAS) Remote Code Execution Vulnerability', severity: 'High', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30068', description: 'Windows Kernel Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-125', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 8.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30082', description: 'Win32k Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-416', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30096', description: 'Windows Cryptographic Services Information Disclosure Vulnerability', severity: 'Medium', cweId: 'CWE-200', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 5.5, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30090', description: 'Microsoft Streaming Service Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-822', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30065', description: 'Windows Themes Denial of Service Vulnerability', severity: 'Medium', cweId: 'CWE-59', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 5.5, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30088', description: 'Windows Kernel Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-367', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Analyzed' },
  { id: 'CVE-2024-30091', description: 'Win32k Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-38213', description: 'Windows Mark of the Web Security Feature Bypass Vulnerability', severity: 'Medium', cweId: 'CWE-693', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 6.5, exploitStatus: 'Yes', publishedDate: 'Tue, Aug 13, 2024 11:45 PM', status: 'Analyzed' },
  { id: 'CVE-2024-30067', description: 'Winlogon Elevation of Privilege Vulnerability', severity: 'Medium', cweId: 'CWE-190', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 5.5, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30066', description: 'Winlogon Elevation of Privilege Vulnerability', severity: 'Medium', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 5.5, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30077', description: 'Windows OLE Remote Code Execution Vulnerability', severity: 'High', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30087', description: 'Win32k Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-20', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30095', description: 'Windows Routing and Remote Access Service (RRAS) Remote Code Execution Vulnerability', severity: 'High', cweId: 'CWE-122', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30069', description: 'Windows Remote Access Connection Manager Information Disclosure Vulnerability', severity: 'Medium', cweId: 'CWE-126', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 4.7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30089', description: 'Microsoft Streaming Service Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-416', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30097', description: 'Microsoft Speech Application Programming Interface (SAPI) Remote Code Execution Vulnerability', severity: 'High', cweId: 'CWE-415', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 8.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-35250', description: 'Windows Kernel-Mode Driver Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-822', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:46 PM', status: 'Analyzed' },
  { id: 'CVE-2024-35265', description: 'Windows Perception Service Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-367', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:46 PM', status: 'Modified' },
  { id: 'CVE-2024-30080', description: 'Microsoft Message Queuing (MSMQ) Remote Code Execution Vulnerability', severity: 'Critical', cweId: 'CWE-416', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 9.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-38063', description: 'Windows TCP/IP Remote Code Execution Vulnerability', severity: 'Critical', cweId: 'CWE-191', impactedEndpoints: 2, patchAvailability: 'Yes', cvssScore: 9.8, exploitStatus: 'No', publishedDate: 'Tue, Aug 13, 2024 11:45 PM', status: 'Analyzed' },
  { id: 'CVE-2024-38112', description: 'Windows MSHTML Platform Spoofing Vulnerability', severity: 'High', cweId: 'CWE-668', impactedEndpoints: 1, patchAvailability: 'Yes', cvssScore: 7.5, exploitStatus: 'Yes', publishedDate: 'Tue, Jul 09, 2024 10:45 PM', status: 'Analyzed' },
  { id: 'CVE-2024-30078', description: 'Windows Wi-Fi Driver Remote Code Execution Vulnerability', severity: 'High', cweId: 'CWE-420', impactedEndpoints: 3, patchAvailability: 'Yes', cvssScore: 8.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Modified' },
  { id: 'CVE-2024-30064', description: 'Windows Kernel Elevation of Privilege Vulnerability', severity: 'High', cweId: 'CWE-908', impactedEndpoints: 1, patchAvailability: 'No', cvssScore: 8.8, exploitStatus: 'No', publishedDate: 'Tue, Jun 11, 2024 10:45 PM', status: 'Awaiting Analysis' },
];

// Toolbar tailored to the Detected CVEs list (title + view dropdown + action icons).
function DetectedCvesToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
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
          <h1 className="text-[16px] font-semibold text-[#364658]">Detected CVEs</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>Detected Vulnerabilities</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="Export"><FileOutput size={16} /></IconBtn>
          <IconBtn title="Download"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          <IconBtn title="More"><MoreVertical size={16} /></IconBtn>
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

/* ── Derived CVE attributes ───────────────────────────────────────────────────
   The product's listing filters on a wider record than the mock stores — the CNA title, the
   vulnerability type, all four CVSS generations and an approval state. Each is derived HERE,
   once, so the listing row and the detail page it opens read the same values. */

/** The CNA that assigned the CVE. Every record in this catalogue is a Microsoft advisory,
 *  which is exactly what the product's own grid shows in its Title column. */
export const cveTitleOf = (_c: DetectedCve): string => 'secure@microsoft.com';

/* OS vs Application. This catalogue is a Windows Patch-Tuesday set, so most of it is the
   operating system proper; the exceptions are the installable COMPONENTS that ship with
   Windows but are not the core OS — MSHTML, MSMQ, the Speech API, the Streaming Service —
   which scanners do categorise separately. Named explicitly rather than guessed, because
   "contains Windows" would have swept the whole list into one bucket. */
const APP_COMPONENTS = /\b(mshtml|message queuing|msmq|speech application|sapi|streaming service|edge|chromium|office|outlook|word|excel|sharepoint)\b/i;
export const cveVulnTypeOf = (c: DetectedCve): string =>
  APP_COMPONENTS.test(c.description) ? 'Application' : 'OS';

/* CVSS by generation. v2 was retired for anything published after 2015, so a 2024 CVE
   genuinely has none — the column reads "—" and that is the true answer, not a gap. The v3.0
   and v3.1 BASE formulas are identical, so where NVD carries both the number is the same.
   v4.0 is still being adopted, so only a deterministic share of records carry one. */
export const cveScoreOf = (c: DetectedCve, gen: '2.0' | '3.0' | '3.1' | '4.0'): number | null => {
  if (gen === '2.0') return null;
  if (gen === '3.1' || gen === '3.0') return c.cvssScore || null;
  const h = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  if (h % 5 >= 2 || !c.cvssScore) return null;          // ~40% carry a v4.0 score
  return Math.min(10, Math.round((c.cvssScore + (h % 3 === 0 ? 0.2 : -0.3)) * 10) / 10);
};

/** A plausible base vector for a score, in the requested generation's own notation. */
export const cveVectorOf = (c: DetectedCve, gen: '2.0' | '3.0' | '3.1' | '4.0'): string => {
  const n = cveScoreOf(c, gen);
  if (n === null) return '—';
  if (gen === '4.0') {
    /* v4.0 renamed the impact metrics (VC/VI/VA) and added Attack Requirements. */
    return n >= 9 ? 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H'
      : n >= 7 ? 'CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N'
        : 'CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:P/VC:L/VI:L/VA:N';
  }
  const metrics =
    n >= 9.5 ? 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
      : n >= 8.5 ? 'AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H'
        : n >= 7.6 ? 'AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H'
          : n >= 7 ? 'AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H'
            : n >= 4 ? 'AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N'
              : 'AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:N/A:N';
  return `CVSS:${gen}/${metrics}`;
};

/** NVD revises a record after publication; "Analyzed" means that pass is done. */
export const cveLastUpdatedOf = (c: DetectedCve): string => {
  const base = new Date(c.publishedDate.replace(/^[A-Za-z]{3},\s*/, ''));
  if (Number.isNaN(base.getTime())) return c.publishedDate;
  const h = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  base.setDate(base.getDate() + (c.status === 'Awaiting Analysis' ? 0 : 20 + (h % 90)));
  return base.toISOString();
};

/* Approved = cleared for remediation. Anything under active exploitation is approved on
   sight; the rest wait on a review, which is what the filter is for. */
export const cveApprovalOf = (c: DetectedCve): 'Approved' | 'Not Approved' => {
  if (c.exploitStatus === 'Yes') return 'Approved';
  const h = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return c.severity === 'Critical' || h % 3 === 0 ? 'Approved' : 'Not Approved';
};

/** Maps a DetectedCve onto the Patch shape so the cloned DetectedCveDrawer body compiles. */
export const cveToPatchShape = (c: DetectedCve): Patch => ({
  id: c.id,
  name: c.description,
  severity: c.severity === 'High' ? 'Important' : c.severity === 'Medium' ? 'Moderate' : c.severity,
  releaseDate: c.publishedDate,
  missingSystem: c.impactedEndpoints,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: cveApprovalOf(c),
  category: 'Security Updates',
  // NVD-style long description for the Overview tab, composed from the record's real facts.
  description: `${c.description}. Tracked as ${c.id} (${c.cweId}), this vulnerability was published on ${c.publishedDate} and carries a CVSS 3.1 base score of ${c.cvssScore}. ${c.exploitStatus === 'Yes' ? 'Exploitation in the wild has been reported — remediation should be prioritized.' : 'No in-the-wild exploitation has been reported so far.'} A vendor patch is ${c.patchAvailability === 'Yes' ? 'available and can be deployed through the linked patches' : 'not yet available'}, and ${c.impactedEndpoints} managed endpoint${c.impactedEndpoints === 1 ? ' is' : 's are'} currently impacted.`,
  cve: { severity: c.severity, cweId: c.cweId, cvssScore: c.cvssScore, exploitStatus: c.exploitStatus, patchAvailability: c.patchAvailability, nvdStatus: c.status },
});

export function DetectedCvesListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [cves] = useState<DetectedCve[]>(mockDetectedCves);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenCve = (c: DetectedCve) => {
    openInStack('detected-cves', c.id, c.description, cveToPatchShape(c));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(cves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => c.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = cves;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = cves.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.severity.toLowerCase().includes(q) ||
      c.cweId.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.publishedDate.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(c => c.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="detected-cves" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <DetectedCvesToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <DetectedCvesTable
              cves={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onCveClick={handleOpenCve}
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
