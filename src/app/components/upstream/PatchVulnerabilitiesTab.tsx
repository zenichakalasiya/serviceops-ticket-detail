/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '../Pagination';
import { PatchVulnEndpointsPanel } from './PatchVulnEndpointsPanel';
import { INITIAL_COMPUTERS, type PatchComputer } from './PatchComputersTab';

export type VulnBucket = 'Approved' | 'Declined';

export interface Vulnerability {
  cveId: string;
  title: string;
  description: string;
  exploitStatus: 'Yes' | 'No';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  vulnerabilityType: string;
  patchAvailability: 'Yes' | 'No';
  impactedEndpoints: number;
  cvssScore: string;
  publishedDate: string;
  lastUpdatedDate: string;
  bucket: VulnBucket;
}

const PUB = 'Tue, Jun 09, 2026 10:47 PM';
const UPD = 'Wed, Jul 15, 2026 08:22 PM';

// Realistic CVE records tied to this patch (mock).
export const VULNERABILITIES: Vulnerability[] = [
  { cveId: 'CVE-2026-48583', title: 'secure@microsoft.com', description: 'Use after free in Windows Kernel allows an authorized attacker to elevate privileges locally', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.8', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48578', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48576', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48575', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48574', title: 'secure@microsoft.com', description: 'Heap-based buffer overflow in Windows Media allows an unauthorized attacker to execute code locally', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.8', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48573', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48570', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48568', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Secure Boot allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-48563', title: 'secure@microsoft.com', description: 'Heap-based buffer overflow in Remote Desktop Client allows an unauthorized attacker to execute code over a network', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.5', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-47656', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows Boot Manager allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.9', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-47652', title: 'secure@microsoft.com', description: 'Out-of-bounds read in Windows Hyper-V allows an unauthorized attacker to disclose information locally', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '8.2', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-47648', title: 'secure@microsoft.com', description: 'Untrusted search path in Windows Storage allows an authorized attacker to elevate privileges locally', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-47291', title: 'secure@microsoft.com', description: 'Integer overflow or wraparound in Windows HTTP.sys allows an unauthorized attacker to execute code over a network', exploitStatus: 'No', severity: 'Critical', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '9.8', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-45658', title: 'secure@microsoft.com', description: 'Protection mechanism failure in Windows BitLocker allows an unauthorized attacker to bypass a security feature', exploitStatus: 'No', severity: 'High', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '7.8', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },
  { cveId: 'CVE-2026-45657', title: 'secure@microsoft.com', description: 'Use after free in Windows Kernel allows an unauthorized attacker to elevate privileges locally', exploitStatus: 'No', severity: 'Critical', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 3, cvssScore: '9.8', publishedDate: PUB, lastUpdatedDate: UPD, bucket: 'Approved' },

  { cveId: 'CVE-2026-44120', title: 'secure@microsoft.com', description: 'Information disclosure in Windows Print Spooler allows an authorized attacker to disclose information locally', exploitStatus: 'No', severity: 'Medium', status: 'Analyzed', vulnerabilityType: 'OS', patchAvailability: 'No', impactedEndpoints: 1, cvssScore: '5.5', publishedDate: 'Thu, Apr 16, 2026 06:12 PM', lastUpdatedDate: 'Mon, Jun 22, 2026 11:04 AM', bucket: 'Declined' },
  { cveId: 'CVE-2026-43877', title: 'secure@microsoft.com', description: 'Denial of service in Windows DNS Client allows an unauthorized attacker to deny service over a network', exploitStatus: 'Yes', severity: 'Medium', status: 'Awaiting Analysis', vulnerabilityType: 'OS', patchAvailability: 'Yes', impactedEndpoints: 2, cvssScore: '6.2', publishedDate: 'Tue, Mar 24, 2026 09:30 PM', lastUpdatedDate: 'Fri, May 29, 2026 03:45 PM', bucket: 'Declined' },
  { cveId: 'CVE-2026-42019', title: 'secure@microsoft.com', description: 'Improper input validation in Microsoft Edge (Chromium) allows an unauthorized attacker to spoof content over a network', exploitStatus: 'No', severity: 'Low', status: 'Modified', vulnerabilityType: 'Application', patchAvailability: 'Yes', impactedEndpoints: 1, cvssScore: '3.7', publishedDate: 'Wed, Feb 11, 2026 05:20 PM', lastUpdatedDate: 'Thu, Apr 30, 2026 01:15 PM', bucket: 'Declined' },
];

const BUCKETS: VulnBucket[] = ['Approved', 'Declined'];

const severityDot = (s: Vulnerability['severity']) =>
  s === 'Critical' ? '#EF4444' : s === 'High' ? '#F59E0B' : s === 'Medium' ? '#EAB308' : '#22C55E';

/** Deterministically pick which endpoints a record impacts, so the popup is stable across
 *  opens — and so the listing's Impacted Endpoints popup names the SAME machines this tab
 *  does for the same id. Exported for the Vulnerability-module listings. */
export function endpointsForCve(cveId: string, count: number, pool: PatchComputer[]): PatchComputer[] {
  if (!pool.length) return [];
  const seed = [...cveId].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const picked: PatchComputer[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) picked.push(pool[(seed + i * 7) % pool.length]);
  // Guard against the stride colliding on small pools.
  return Array.from(new Map(picked.map((e) => [e.id, e])).values());
}

interface PatchVulnerabilitiesTabProps {
  /** Live endpoint list from the drawer; falls back to the seed data when not supplied. */
  endpoints?: PatchComputer[];
}

export function PatchVulnerabilitiesTab({ endpoints = INITIAL_COMPUTERS }: PatchVulnerabilitiesTabProps = {}) {
  const [endpointsForVuln, setEndpointsForVuln] = useState<Vulnerability | null>(null);
  const [bucket, setBucket] = useState<VulnBucket>('Approved');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [list, setList] = useState<Vulnerability[]>(VULNERABILITIES);
  const [showActions, setShowActions] = useState(false);

  const clearSelection = () => setSelected(new Set());
  // Bulk action — Approved rows can be Declined, Declined rows can be Approved.
  const moveSelected = (to: VulnBucket) => {
    const n = selected.size;
    setList((prev) => prev.map((v) => (selected.has(v.cveId) ? { ...v, bucket: to } : v)));
    clearSelection();
    const noun = `${n} ${n > 1 ? 'vulnerabilities' : 'vulnerability'}`;
    if (to === 'Declined') toast.error(`${noun} declined`);
    else toast.success(`${noun} approved`);
  };
  const actions = bucket === 'Approved'
    ? [{ key: 'decline', label: 'Decline', icon: X, run: () => moveSelected('Declined') }]
    : [{ key: 'approve', label: 'Approve', icon: Check, run: () => moveSelected('Approved') }];

  const counts: Record<VulnBucket, number> = { Approved: 0, Declined: 0 };
  list.forEach((v) => { counts[v.bucket] += 1; });

  const q = search.trim().toLowerCase();
  const rows = list.filter((v) => v.bucket === bucket).filter((v) =>
    !q ||
    v.cveId.toLowerCase().includes(q) ||
    v.description.toLowerCase().includes(q) ||
    v.severity.toLowerCase().includes(q) ||
    v.status.toLowerCase().includes(q) ||
    v.vulnerabilityType.toLowerCase().includes(q)
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  useEffect(() => { setCurrentPage(1); }, [bucket, search]);
  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const pageRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const headers = ['CVE ID', 'Title', 'Description', 'Exploit Status', 'Severity', 'Status', 'Vulnerability Type', 'Patch Availability', 'Impacted Endpoints', 'CVSS 3.1 Score', 'Published Date', 'Last Updated Date'];

  return (
    <div className="px-6 py-4">
      {/* Filter pills — Approved / Declined (same style as the Computers tab) */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {BUCKETS.map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${bucket === b ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            {b}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${bucket === b ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
              {counts[b]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
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

      {/* Bulk-action bar — appears when rows are selected (same pattern as the Endpoint tab) */}
      {selected.size > 0 && (
        <div className="animate-slide-up relative z-30 mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[#E3E8EF] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_6px_rgba(16,24,40,0.06)]">
          <div className="relative">
            <button
              onClick={() => setShowActions((v) => !v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded border bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors ${showActions ? 'border-[#3D8BD0] bg-[#F8FAFC]' : 'border-[#DFE5ED] hover:bg-[#F5F7FA]'}`}
            >
              Take Action <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${showActions ? 'rotate-180' : ''}`} />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                <div className="app-menu absolute left-0 top-full mt-1 z-50 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
                  {actions.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => { a.run(); setShowActions(false); }}
                      className="w-full px-4 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 text-[#364658] hover:bg-[#F9FAFB]"
                    >
                      <span className="flex-shrink-0 text-[#6B7280]"><a.icon size={15} /></span>
                      <span className="flex-1">{a.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#EAF2FB] text-[#3D8BD0] text-[12px] font-semibold tabular-nums">{selected.size}</span>
            <span className="text-[#64748B]">{selected.size === 1 ? 'record' : 'records'} selected</span>
            <span className="h-4 w-px bg-[#E3E8EF]" />
            <button onClick={clearSelection} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Unselect all</button>
          </div>
        </div>
      )}

      {/* Table — standard borderless style */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1750px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <th className="w-[40px] px-4 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={pageRows.length > 0 && pageRows.every((v) => selected.has(v.cveId))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(pageRows.map((v) => v.cveId)) : new Set())}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </th>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={headers.length + 1} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No {bucket.toLowerCase()} vulnerabilities found.</td></tr>
            ) : pageRows.map((v) => (
              <tr key={v.cveId} className="group hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(v.cveId)}
                    onChange={(e) => toggleRow(v.cveId, e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                </td>

                {/* CVE ID + hover open-external icon */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{v.cveId}</button>
                    <button title="Open in NVD" className="text-[#7B8FA5] hover:text-[#3D8BD0] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={14} />
                    </button>
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.title}</td>
                <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[300px] truncate" title={v.description}>{v.description}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.exploitStatus}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-[#364658]">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: severityDot(v.severity) }} />
                    {v.severity}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.status}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.vulnerabilityType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.patchAvailability}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  <button
                    onClick={() => setEndpointsForVuln(v)}
                    title="View impacted endpoints"
                    className="inline-flex items-center justify-center min-w-[24px] rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors"
                  >
                    {v.impactedEndpoints}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] font-medium text-[#364658]">{v.cvssScore}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.publishedDate}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{v.lastUpdatedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — sticky to the bottom of the scroll viewport */}
      <div className="sticky bottom-0 z-30 -mx-6 -mb-4 bg-white">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={rows.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
        />
      </div>

      {/* Impacted-endpoints side popup (opened from the count pill) */}
      <PatchVulnEndpointsPanel
        isOpen={!!endpointsForVuln}
        onClose={() => setEndpointsForVuln(null)}
        cveId={endpointsForVuln?.cveId}
        endpoints={endpointsForVuln ? endpointsForCve(endpointsForVuln.cveId, endpointsForVuln.impactedEndpoints, endpoints) : []}
      />
    </div>
  );
}
