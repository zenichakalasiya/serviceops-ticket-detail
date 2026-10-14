import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, Download, RefreshCw, Columns3, MoreVertical, FileOutput } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { VulnerabilitiesTable } from './VulnerabilitiesTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { ApprovalStatus, Patch, RebootRequired } from './PatchesListPage';

/* Vulnerabilities listing — opened from the Vulnerability sidebar flyout's "Vulnerabilities"
 * item. A clone of the Patches list page: the rows are DETECTED VULNERABILITY PATCHES (patches
 * whose CVEs were found on scanned endpoints), so ids stay PCH-#### and several rows reference
 * the same patches the Patch module carries. */

export type VulnSeverity = 'Critical' | 'Important' | 'Moderate' | 'Low' | 'Unspecified';

export interface Vulnerability {
  id: string;
  name: string;
  severity: VulnSeverity;
  /** CVEs with known in-the-wild exploitation. Empty = --- */
  exploitedCves: string[];
  /** CVEs addressed by the patch with no known exploitation. Empty = --- */
  nonExploitedCves: string[];
  category: string;
  /** CVSS 3.1 base score of the highest-rated CVE (0 = not yet scored). */
  cvssScore: number;
  publishedDate: string;
  impactedEndpoints: number;
}

// Realistic detected-vulnerability catalog (mock) — highest-risk first-ish, real CVE style.
export const mockVulnerabilities: Vulnerability[] = [
  { id: 'PCH-4811', name: '2026-04 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5036894)', severity: 'Critical', exploitedCves: ['CVE-2026-21412'], nonExploitedCves: ['CVE-2026-26234', 'CVE-2026-28899', 'CVE-2026-20693'], category: 'Security Updates', cvssScore: 9.8, publishedDate: 'Tue, Apr 14, 2026 05:00 PM', impactedEndpoints: 12 },
  { id: 'PCH-4807', name: '2026-04 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5036892)', severity: 'Critical', exploitedCves: [], nonExploitedCves: ['CVE-2026-26234', 'CVE-2026-21447', 'CVE-2026-29988'], category: 'Security Updates', cvssScore: 8.8, publishedDate: 'Tue, Apr 14, 2026 05:00 PM', impactedEndpoints: 15 },
  { id: 'PCH-4813', name: '2026-04 Cumulative Update for .NET Framework 3.5 and 4.8 for Windows 11 (KB5036893)', severity: 'Critical', exploitedCves: [], nonExploitedCves: ['CVE-2026-21409', 'CVE-2026-24080'], category: 'Security Updates', cvssScore: 8.1, publishedDate: 'Tue, Apr 14, 2026 05:00 PM', impactedEndpoints: 8 },
  { id: 'PCH-4790', name: 'Adobe Acrobat Reader DC 2024.002.20933 Security Update', severity: 'Critical', exploitedCves: ['CVE-2026-30303'], nonExploitedCves: ['CVE-2026-30304', 'CVE-2026-30305'], category: 'Security Updates', cvssScore: 8.6, publishedDate: 'Tue, Apr 08, 2026 09:30 PM', impactedEndpoints: 11 },
  { id: 'PCH-4841', name: 'Security Update for Microsoft Exchange Server 2019 CU14 (KB5037224)', severity: 'Critical', exploitedCves: ['CVE-2026-21410'], nonExploitedCves: ['CVE-2026-21413'], category: 'Security Updates', cvssScore: 9.8, publishedDate: 'Tue, Mar 10, 2026 06:00 PM', impactedEndpoints: 2 },
  { id: 'PCH-4763', name: 'PuTTY 0.81 Security Update (CVE-2024-31497)', severity: 'Critical', exploitedCves: ['CVE-2024-31497'], nonExploitedCves: [], category: 'Third Party Updates', cvssScore: 5.9, publishedDate: 'Mon, Apr 15, 2026 05:40 PM', impactedEndpoints: 3 },
  { id: 'PCH-4780', name: 'Oracle Java SE 8 Update 411 (JRE) Security Patch', severity: 'Critical', exploitedCves: [], nonExploitedCves: ['CVE-2026-21068', 'CVE-2026-21094'], category: 'Third Party Updates', cvssScore: 7.4, publishedDate: 'Tue, Feb 18, 2026 08:00 PM', impactedEndpoints: 4 },
  { id: 'PCH-4795', name: '2026-02 Cumulative Update for Windows Server 2019 (KB5034768)', severity: 'Critical', exploitedCves: ['CVE-2026-21338'], nonExploitedCves: ['CVE-2026-21351'], category: 'Security Updates', cvssScore: 7.8, publishedDate: 'Tue, Feb 10, 2026 06:00 PM', impactedEndpoints: 2 },
  { id: 'PCH-4824', name: 'Google Chrome 124.0.6367.79 Security Update', severity: 'Important', exploitedCves: ['CVE-2026-4671'], nonExploitedCves: ['CVE-2026-4670', 'CVE-2026-4672'], category: 'Third Party Updates', cvssScore: 8.8, publishedDate: 'Tue, May 05, 2026 12:27 PM', impactedEndpoints: 14 },
  { id: 'PCH-4788', name: 'Security Update for Microsoft Edge (Chromium) 124.0.2478.51', severity: 'Important', exploitedCves: [], nonExploitedCves: ['CVE-2026-29057', 'CVE-2026-29065'], category: 'Security Updates', cvssScore: 7.5, publishedDate: 'Fri, Apr 18, 2026 02:00 PM', impactedEndpoints: 9 },
  { id: 'PCH-4849', name: '2026-06 Cumulative Update Preview for Windows 11, version 25H2 for x64-based Systems (KB5095093)', severity: 'Unspecified', exploitedCves: [], nonExploitedCves: ['CVE-2026-48563', 'CVE-2026-49201'], category: 'Updates', cvssScore: 9.8, publishedDate: 'Tue, Jun 23, 2026 05:00 PM', impactedEndpoints: 1 },
  { id: 'PCH-4792', name: 'Mozilla Firefox 125.0.2 Security & Stability Update', severity: 'Important', exploitedCves: [], nonExploitedCves: ['CVE-2026-3852', 'CVE-2026-3854'], category: 'Third Party Updates', cvssScore: 7.5, publishedDate: 'Mon, Apr 21, 2026 11:00 AM', impactedEndpoints: 5 },
  { id: 'PCH-4778', name: 'Zoom Client for Meetings 5.17.11 Security Update', severity: 'Important', exploitedCves: [], nonExploitedCves: ['CVE-2026-24691'], category: 'Third Party Updates', cvssScore: 7.3, publishedDate: 'Thu, Feb 27, 2026 03:45 PM', impactedEndpoints: 7 },
  { id: 'PCH-4832', name: '2023-07 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5028166)', severity: 'Critical', exploitedCves: ['CVE-2023-32046'], nonExploitedCves: ['CVE-2023-32049', 'CVE-2023-35311'], category: 'Security Updates', cvssScore: 7.8, publishedDate: 'Tue, Jul 11, 2023 05:00 PM', impactedEndpoints: 1 },
  { id: 'PCH-4782', name: '7-Zip 24.05 (x64) Update', severity: 'Important', exploitedCves: ['CVE-2025-0411'], nonExploitedCves: [], category: 'Third Party Updates', cvssScore: 7.0, publishedDate: 'Mon, Mar 24, 2026 10:10 AM', impactedEndpoints: 3 },
  { id: 'PCH-4769', name: 'VLC media player 3.0.20 Security Update', severity: 'Moderate', exploitedCves: [], nonExploitedCves: ['CVE-2026-11154'], category: 'Third Party Updates', cvssScore: 5.5, publishedDate: 'Wed, Jan 22, 2026 01:00 PM', impactedEndpoints: 5 },
  { id: 'PCH-4785', name: 'Microsoft Defender Antimalware Platform Update 4.18.24030', severity: 'Moderate', exploitedCves: [], nonExploitedCves: ['CVE-2026-24974'], category: 'Updates', cvssScore: 5.9, publishedDate: 'Wed, Apr 02, 2026 07:15 AM', impactedEndpoints: 1 },
  { id: 'PCH-4602', name: 'Security Update for Microsoft Office Online Server (KB3213659)', severity: 'Important', exploitedCves: ['CVE-2017-11826'], nonExploitedCves: [], category: 'Security Updates', cvssScore: 7.8, publishedDate: 'Tue, Oct 10, 2017 05:00 PM', impactedEndpoints: 1 },
  { id: 'PCH-4601', name: 'Security Update for Microsoft Office Online Server (KB3127895)', severity: 'Important', exploitedCves: [], nonExploitedCves: ['CVE-2017-0195'], category: 'Security Updates', cvssScore: 0, publishedDate: 'Tue, Apr 11, 2017 05:00 PM', impactedEndpoints: 1 },
  { id: 'PCH-4766', name: 'Git for Windows 2.44.0 Update', severity: 'Low', exploitedCves: [], nonExploitedCves: ['CVE-2026-23672'], category: 'Third Party Updates', cvssScore: 4.2, publishedDate: 'Tue, Mar 18, 2026 04:30 PM', impactedEndpoints: 2 },
];

// Toolbar tailored to the Vulnerabilities list (title + view dropdown + action icons).
function VulnerabilitiesToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
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
          <h1 className="text-[16px] font-semibold text-[#364658]">Vulnerabilities</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>Detected Vulnerability Patches</span>
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

/* ── Derived advisory attributes ──────────────────────────────────────────────
   The product's listing filters on KB number, support URI, reboot requirement, approval
   status and the CVSS vector. None of them is a free field on a detected patch — each is
   read off the advisory — so they are DERIVED here, once, and the adapter below feeds the
   same values to the detail page. Hard-coding them in two places is how a listing starts
   disagreeing with the record it opens. */

/** "…for x64 (KB5036894)" → "KB5036894". Third-party advisories carry no KB. */
export const vulnKbOf = (v: Vulnerability): string => {
  const kb = v.name.match(/\(KB(\d+)\)/)?.[1];
  return kb ? `KB${kb}` : '—';
};

/** The vendor page a technician actually opens: Microsoft's KB article, else NVD's CVE record. */
export const vulnSupportUriOf = (v: Vulnerability): string => {
  const kb = v.name.match(/\(KB(\d+)\)/)?.[1];
  if (kb) return `https://support.microsoft.com/help/${kb}`;
  const cve = v.exploitedCves[0] ?? v.nonExploitedCves[0];
  return cve ? `https://nvd.nist.gov/vuln/detail/${cve}` : '—';
};

/* Matches how the patch catalogue itself is populated: OS and framework cumulative updates
   are "May be" (it depends on what the servicing stack replaces), server products demand a
   restart outright, and user-space applications do not. */
export const vulnRebootOf = (v: Vulnerability): RebootRequired =>
  /exchange server|office online server/i.test(v.name) ? 'Yes'
    : /cumulative update|\.net framework|windows server/i.test(v.name) ? 'May be'
      : 'No';

/* Approved = cleared for deployment. An advisory with active exploitation gets approved on
   sight, and so is a critical one — except the one in four still sitting in review, which is
   exactly the row the listing's "Critical, Not Approved" card exists to surface (every critical
   auto-approved left that card reading 0 for ever). The rest wait on a review. */
export const vulnApprovalOf = (v: Vulnerability): ApprovalStatus => {
  if (v.exploitedCves.length > 0) return 'Approved';
  const h = [...v.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (v.severity === 'Critical') return h % 4 === 0 ? 'Not Approved' : 'Approved';
  return h % 3 === 0 ? 'Approved' : 'Not Approved';
};

/* A plausible CVSS 3.1 base vector for the score the advisory carries — graded so the
   vector and the number tell the same story rather than contradicting each other. */
export const vulnCvssVectorOf = (v: Vulnerability): string => {
  const n = v.cvssScore;
  if (n <= 0) return '—';
  const metrics =
    n >= 9.5 ? 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
      : n >= 8.5 ? 'AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H'
        : n >= 7.6 ? 'AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H'
          : n >= 7 ? 'AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H'
            : n >= 4 ? 'AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N'
              : 'AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:N/A:N';
  return `CVSS:3.1/${metrics}`;
};

/** Maps a Vulnerability onto the Patch shape so the cloned VulnerabilityDrawer body compiles. */
export const vulnerabilityToPatchShape = (v: Vulnerability): Patch => ({
  id: v.id,
  name: v.name,
  severity: v.severity,
  releaseDate: v.publishedDate,
  missingSystem: v.impactedEndpoints,
  installedSystem: null,
  rebootRequired: vulnRebootOf(v),
  approvalStatus: vulnApprovalOf(v),
  category: v.category,
  supportUri: vulnSupportUriOf(v),
});

export function VulnerabilitiesListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [vulnerabilities] = useState<Vulnerability[]>(mockVulnerabilities);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenVulnerability = (v: Vulnerability) => {
    openInStack('vulnerabilities', v.id, v.name, vulnerabilityToPatchShape(v));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(vulnerabilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(v => v.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  let filtered = vulnerabilities;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = vulnerabilities.filter(v =>
      v.id.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q) ||
      v.severity.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.exploitedCves.some(c => c.toLowerCase().includes(q)) ||
      v.nonExploitedCves.some(c => c.toLowerCase().includes(q)) ||
      v.publishedDate.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(v => v.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="vulnerabilities" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <VulnerabilitiesToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <VulnerabilitiesTable
              vulnerabilities={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onVulnerabilityClick={handleOpenVulnerability}
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
