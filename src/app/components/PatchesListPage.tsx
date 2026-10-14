import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, FileText, Download, RefreshCw, History, Columns3, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatchesTable } from './PatchesTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';

export type Severity = 'Critical' | 'Important' | 'Moderate' | 'Low' | 'Unspecified';
export type RebootRequired = 'Yes' | 'No' | 'May be';
export type ApprovalStatus = 'Approved' | 'Not Approved';

export interface Patch {
  id: string;
  name: string;
  severity: Severity;
  releaseDate: string;
  /** number of systems missing this patch, or null = --- */
  missingSystem: number | null;
  /** number of systems where it is installed, or null = --- */
  installedSystem: number | null;
  rebootRequired: RebootRequired;
  approvalStatus: ApprovalStatus;
  /** Patch catalog category (Updates / Security Updates / …). Defaults to "Updates". */
  category?: string;
  /** Optional release notes — only some patches carry one (shown on the detail Overview). */
  description?: string;
  /** The vendor advisory page for this record. Set by adapters that can work it out (a KB
   *  article, or the CVE's NVD entry for third-party software); the detail panel falls back
   *  to its mock URL when absent. */
  supportUri?: string;
  /** Present ONLY when the record is a Patch DEPLOYMENT opened via deploymentToPatchShape —
   *  carries the real run properties so the deployment drawer's header KPIs stay data-driven. */
  deployment?: { status: string; policy: string; installAfter: string | null; expiryDate: string | null; deploymentType?: string };
  /** Present ONLY when the record is an ENDPOINT opened via endpointToPatchShape —
   *  carries the agent/health values so the endpoint drawer's header KPIs stay data-driven. */
  endpoint?: { agentOnline: boolean; systemHealth: 'Healthy' | 'Warning' | 'Critical' | null; osName?: string; ipAddress?: string; osVersion?: string | null };
  /** Present ONLY when the record is a TASK opened via taskToPatchShape —
   *  carries the listing's real values so the task drawer's header KPIs stay data-driven. */
  task?: { status: string; priority: string; taskType: string; assignee: string; reference: string | null; referenceModule?: string; overdueBy?: string; dueDate: string };
  /** Present ONLY when the record is a DETECTED CVE opened via cveToPatchShape —
   *  carries the CVE facts so the CVE drawer's Overview (metrics/references) stays data-driven. */
  cve?: { severity: string; cweId: string; cvssScore: number; exploitStatus: string; patchAvailability: string; nvdStatus: string };
  /** Set ONLY when the endpoint was opened from the BOM module — makes the endpoint drawer land
   *  on its BOM tab. The same endpoint opened from Patch/Vulnerability lands on Overview. */
  bomMode?: boolean;
  /** Present ONLY when the record is a KNOWLEDGE ARTICLE opened via knowledgeToPatchShape —
   *  drives the Knowledge header KPIs (Created By · Created · Folder · Total Read). */
  knowledge?: { author: string; created: string; folder: string; totalRead: number };
}

// Realistic Windows / third-party patch catalog (mock).
export const mockPatches: Patch[] = [
  { id: 'PCH-4834', category: 'Critical Updates', name: 'Manual Patch — Internal Tooling Hotfix', severity: 'Critical', releaseDate: 'Wed, Jul 08, 2026 03:24 PM', missingSystem: null, installedSystem: null, rebootRequired: 'Yes', approvalStatus: 'Approved', description: 'Emergency hotfix packaged by the Platform Engineering team to address a privilege-escalation flaw in the internal agent updater service. A local user could place a crafted binary on the update path and have it executed under the SYSTEM account.\n\nThis is a manually uploaded package and is not distributed through the vendor catalog, so it must be approved and deployed by an administrator. A restart is required for the replacement service binary to load.' },
  { id: 'PCH-4833', name: 'Update for Microsoft 365 Apps (MonthlyEnterpriseChannel) Version 2404', severity: 'Low', releaseDate: 'Tue, Apr 14, 2026 04:55 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'No', approvalStatus: 'Not Approved', description: 'This update rolls the Monthly Enterprise Channel build of Microsoft 365 Apps forward to Version 2404 (Build 17531.20152). It bundles the security fixes shipped in the April servicing release for Word, Excel, Outlook and PowerPoint, including two remote-code-execution issues in the Office graphics component that could be triggered by a specially crafted document.\n\nAlongside the security content, this build resolves a long-standing defect where Outlook could stop syncing shared calendars after a network interruption, and improves start-up time for Excel workbooks that contain large pivot caches. No configuration changes are required after installation.\n\nThe update installs in place and does not require a restart, though any open Office applications must be closed for servicing to complete. Devices that have Office deployed via the Office Deployment Tool will pick up the change automatically on their next scheduled update check.' },
  { id: 'PCH-4832', category: 'Security Updates', name: '2023-07 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5028166)', severity: 'Critical', releaseDate: 'Tue, Jul 11, 2023 05:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4824', name: 'Google Chrome 124.0.6367.79 Security Update', severity: 'Important', releaseDate: 'Tue, May 05, 2026 12:27 PM', missingSystem: null, installedSystem: null, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4813', name: '2026-04 Cumulative Update for .NET Framework 3.5 and 4.8 for Windows 11 (KB5036893)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 8, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4812', name: '2026-04 Cumulative Update for .NET Framework 4.8.1 for Windows Server 2022', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 3, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4811', category: 'Security Updates', name: '2026-04 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5036894)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 12, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved', description: 'Monthly quality and security rollup for Windows 11, version 23H2. It addresses vulnerabilities in the Windows Kernel, Secure Boot, Windows Media and the Remote Desktop Client, including several elevation-of-privilege and remote-code-execution issues rated Critical.\n\nThe rollup also fixes a regression that could cause File Explorer to stop responding when browsing network shares, and corrects a rendering problem on multi-monitor setups running mixed display scaling. This update supersedes the March cumulative update; installing it makes the earlier package unnecessary.\n\nA restart is required to complete installation on most devices.' },
  { id: 'PCH-4810', name: '2026-04 Cumulative Update for .NET Framework 3.5 and 4.8 for Windows 10 (KB5036892)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 6, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4809', name: '2026-04 Cumulative Update for .NET Framework 4.8 for Windows Server 2019', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 2, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4808', name: '2026-04 Cumulative Update for .NET Framework 4.7.2 for Windows Server 2016', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 1, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4807', name: '2026-04 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5036892)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 15, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4806', name: '2026-04 Cumulative Update for .NET Framework 3.5 for Windows Server 2022', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 4, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4804', category: 'Update Rollups', name: '2026-03 Cumulative Update Preview for Windows 11 Version 24H2 (KB5035942)', severity: 'Unspecified', releaseDate: 'Thu, Mar 26, 2026 09:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4801', name: '2026-03 Cumulative Update for Windows Server 2022 (KB5035857)', severity: 'Unspecified', releaseDate: 'Sat, Mar 21, 2026 09:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4800', name: '2026-03 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5035853)', severity: 'Critical', releaseDate: 'Tue, Mar 10, 2026 05:00 PM', missingSystem: 9, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4799', name: '2026-02 Cumulative Update Preview for Windows 10 Version 22H2 (KB5034843)', severity: 'Unspecified', releaseDate: 'Tue, Feb 24, 2026 06:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4797', name: '2026-02 Cumulative Update for Windows 11 Version 24H2 for x64 (KB5034765)', severity: 'Critical', releaseDate: 'Tue, Feb 10, 2026 06:00 PM', missingSystem: 7, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4795', name: '2026-02 Cumulative Update for Windows Server 2019 (KB5034768)', severity: 'Critical', releaseDate: 'Tue, Feb 10, 2026 06:00 PM', missingSystem: 2, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4794', name: '2026-01 Cumulative Update Preview for Windows 11 Version 23H2 (KB5034204)', severity: 'Unspecified', releaseDate: 'Thu, Jan 29, 2026 10:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4793', name: '2026-01 Cumulative Update Preview for Windows 10 Version 22H2 (KB5034203)', severity: 'Unspecified', releaseDate: 'Thu, Jan 29, 2026 10:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4792', name: 'Mozilla Firefox 125.0.2 Security & Stability Update', severity: 'Important', releaseDate: 'Mon, Apr 21, 2026 11:00 AM', missingSystem: 5, installedSystem: 3, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4790', category: 'Security Updates', name: 'Adobe Acrobat Reader DC 2024.002.20933 Security Update', severity: 'Critical', releaseDate: 'Tue, Apr 08, 2026 09:30 PM', missingSystem: 11, installedSystem: 4, rebootRequired: 'No', approvalStatus: 'Approved', description: 'Security update for Adobe Acrobat Reader DC that resolves multiple out-of-bounds read and use-after-free vulnerabilities which could lead to arbitrary code execution when opening a malicious PDF. Adobe rates this update as priority 1 and recommends applying it as soon as possible.' },
  { id: 'PCH-4788', name: 'Security Update for Microsoft Edge (Chromium) 124.0.2478.51', severity: 'Important', releaseDate: 'Fri, Apr 18, 2026 02:00 PM', missingSystem: 6, installedSystem: 8, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4785', category: 'Definition Updates', name: 'Microsoft Defender Antimalware Platform Update 4.18.24030', severity: 'Moderate', releaseDate: 'Wed, Apr 02, 2026 07:15 AM', missingSystem: 1, installedSystem: 22, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4782', name: '7-Zip 24.05 (x64) Update', severity: 'Low', releaseDate: 'Mon, Mar 24, 2026 10:10 AM', missingSystem: 3, installedSystem: 9, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4780', name: 'Oracle Java SE 8 Update 411 (JRE) Security Patch', severity: 'Critical', releaseDate: 'Tue, Feb 18, 2026 08:00 PM', missingSystem: 4, installedSystem: 2, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4778', name: 'Zoom Client for Meetings 5.17.11 Security Update', severity: 'Important', releaseDate: 'Thu, Feb 27, 2026 03:45 PM', missingSystem: 7, installedSystem: 12, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4775', category: 'Update Rollups', name: 'Servicing Stack Update for Windows Server 2022 (KB5034439)', severity: 'Moderate', releaseDate: 'Tue, Jan 14, 2026 06:00 PM', missingSystem: 2, installedSystem: 5, rebootRequired: 'Yes', approvalStatus: 'Approved' },
  { id: 'PCH-4772', name: 'Notepad++ 8.6.5 (64-bit) Update', severity: 'Low', releaseDate: 'Fri, Mar 07, 2026 09:20 AM', missingSystem: null, installedSystem: 6, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4769', name: 'VLC media player 3.0.20 Security Update', severity: 'Moderate', releaseDate: 'Wed, Jan 22, 2026 01:00 PM', missingSystem: 5, installedSystem: 4, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4766', name: 'Git for Windows 2.44.0 Update', severity: 'Low', releaseDate: 'Tue, Mar 18, 2026 04:30 PM', missingSystem: 2, installedSystem: 7, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4763', category: 'Security Updates', name: 'PuTTY 0.81 Security Update (CVE-2024-31497)', severity: 'Critical', releaseDate: 'Mon, Apr 15, 2026 05:40 PM', missingSystem: 3, installedSystem: 1, rebootRequired: 'No', approvalStatus: 'Not Approved', description: 'Upgrades PuTTY to 0.81 to remediate CVE-2024-31497, a biased-nonce weakness in the NIST P-521 ECDSA signature generation that can allow an attacker who observes a number of signatures to recover the private key. Any P-521 keys used with an affected PuTTY build should be treated as compromised and rotated after updating.' },
  /* The managed fleet runs Ubuntu, RHEL and macOS (see mockEndpoints) but the catalogue had
     nothing for any of them — so those machines appeared to need no patches at all, and the
     listing's Platform filter had two options that matched nothing. These are the real
     advisories for the builds those endpoints are on. */
  { id: 'PCH-4760', category: 'Security Updates', name: 'Ubuntu 22.04 LTS — linux-image-generic 6.8.0-45 Security Update (USN-7021-1)', severity: 'Important', releaseDate: 'Thu, Sep 18, 2025 11:30 AM', missingSystem: 2, installedSystem: 1, rebootRequired: 'Yes', approvalStatus: 'Approved', description: 'Kernel update for Ubuntu 22.04 LTS addressing a use-after-free in the netfilter subsystem that could allow a local attacker to escalate privileges. A reboot is required for the new kernel to take effect.' },
  { id: 'PCH-4759', category: 'Security Updates', name: 'Red Hat Enterprise Linux 9 — openssl 3.0.7 Security Update (RHSA-2025:8842)', severity: 'Critical', releaseDate: 'Tue, Aug 26, 2025 06:15 PM', missingSystem: 1, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4758', name: 'macOS 14 Sonoma 14.7.1 Security Update', severity: 'Important', releaseDate: 'Mon, Oct 06, 2025 09:00 PM', missingSystem: 1, installedSystem: 1, rebootRequired: 'Yes', approvalStatus: 'Approved' },
  { id: 'PCH-4757', category: 'Updates', name: 'macOS 15 Sequoia 15.5 Combo Update', severity: 'Moderate', releaseDate: 'Wed, Jul 02, 2025 08:45 PM', missingSystem: 1, installedSystem: null, rebootRequired: 'Yes', approvalStatus: 'Not Approved' },
];

// Toolbar tailored to the Patches list (title + view + action icons + Create Patch CTA).
function PatchesToolbar({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
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
          <h1 className="text-[16px] font-semibold text-[#364658]">Patches</h1>
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>Missing Patches</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn title="New"><FileText size={16} /></IconBtn>
          <IconBtn title="Export"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="Download"><Download size={16} /></IconBtn>
          <IconBtn title="History"><History size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          <button className="ml-2 flex h-[34px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
            <Plus size={15} />
            Create Patch
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

/* ── Derived patch attributes ─────────────────────────────────────────────────
   The catalogue stores the facts a patch is identified by; the listing filters on a few more
   that are read OFF those facts rather than stored. Derived here, once, so the listing row
   and the detail page it opens cannot disagree. */

/** "…for x64 (KB5036894)" → "KB5036894". Third-party advisories carry no KB. */
export const patchKbOf = (p: Patch): string => {
  const kb = p.name.match(/\bKB(\d+)\b/)?.[1];
  return kb ? `KB${kb}` : '—';
};

/** Microsoft ships patches by KB; everything else is a third-party package. */
export const patchTypeOf = (p: Patch): string =>
  /\bKB\d+\b/.test(p.name) || /^(microsoft|windows|\d{4}-\d{2} cumulative|security update for (microsoft|windows))/i.test(p.name)
    ? 'Microsoft Patch' : 'Third Party Patch';

/** The build a patch targets — stated in the title where it matters, else the fleet default. */
export const patchArchOf = (p: Patch): string => (/\b(x86|32[- ]?bit)\b/i.test(p.name) ? '32 BIT' : '64 BIT');

/** A patch is superseded once a newer cumulative replaces it — true of the older releases. */
export const patchSupersededOf = (p: Patch): 'Yes' | 'No' => {
  const year = p.releaseDate.match(/\b(20\d{2})\b/)?.[1];
  if (year && Number(year) <= 2024) return 'Yes';
  return [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 4 === 0 ? 'Yes' : 'No';
};

/* Whether the binary made it to the file server. A patch nobody has downloaded cannot
   deploy, which is why it is worth filtering on separately from approval. */
export const patchDownloadOf = (p: Patch): string => {
  const h = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 11 === 0 ? 'Failed' : h % 7 === 0 ? 'Pending' : 'Success';
};

const patchSeed = (p: Patch) => [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);

/** The catalogue's own key for the file — vendor-slug + platform + arch + build. */
export const patchUuidOf = (p: Patch): string => {
  const slug = p.name.toLowerCase()
    .replace(/\(kb\d+\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-').slice(0, 4).join('_');
  const kb = p.name.match(/\bKB(\d+)\b/)?.[1];
  return `${slug}-windows-${patchArchOf(p) === '32 BIT' ? 'x86' : 'x64'}-${kb ? `kb${kb}` : 'exe'}`;
};

/** The OS family the patch installs on. */
export const patchPlatformOf = (p: Patch): string =>
  /\b(ubuntu|red ?hat|linux|debian|centos)\b/i.test(p.name) ? 'Linux'
    : /\b(macos|mac os|safari)\b/i.test(p.name) ? 'Mac'
      : 'Windows';

/* How the patch got into the catalogue. Most arrive from a scan; a hand-built hotfix is
   uploaded, and the vendor feed brings the rest. */
export const patchSourceOf = (p: Patch): string =>
  /\bmanual\b/i.test(p.name) ? 'Manual Upload' : patchSeed(p) % 6 === 0 ? 'Vendor Sync' : 'Patch Scanning';

/** Whether the catalogue entry itself is live, still being prepared, or retired. */
export const patchStatusOf = (p: Patch): string =>
  patchSupersededOf(p) === 'Yes' ? 'Archived' : patchSeed(p) % 9 === 0 ? 'Draft' : 'Published';

/* Upload = the binary reaching the file server. It tracks the download but is not the same
   fact: a download can succeed and the upload to a distributed server still be running. */
export const patchUploadOf = (p: Patch): string => {
  const dl = patchDownloadOf(p);
  if (dl === 'Failed') return 'Not Uploaded';
  if (dl === 'Pending') return 'In Progress';
  return patchSeed(p) % 13 === 0 ? 'In Progress' : 'Uploaded';
};

/** Has anyone actually tested it in a pilot ring before it goes wide? */
export const patchTestStatusOf = (p: Patch): string =>
  p.approvalStatus === 'Approved'
    ? (patchSeed(p) % 5 === 0 ? 'Failed' : 'Tested')
    : (patchSeed(p) % 3 === 0 ? 'Tested' : 'Not Tested');

const PATCH_EDITORS = ['System', 'Rakesh Rathod', 'Sarah Johnson', 'Chintan Makwana', 'Priya Nair'];
/** A scanned patch is created by the system; an uploaded one by whoever uploaded it. */
export const patchCreatedByOf = (p: Patch): string =>
  patchSourceOf(p) === 'Manual Upload' ? PATCH_EDITORS[1 + (patchSeed(p) % 4)] : 'System';
export const patchUpdatedByOf = (p: Patch): string => PATCH_EDITORS[patchSeed(p) % PATCH_EDITORS.length];

/** Catalogue entries are revised after release — approval, test results, a re-download. */
export const patchUpdatedDateOf = (p: Patch): Date => {
  const base = new Date(p.releaseDate.replace(/^[A-Za-z]{3},\s*/, ''));
  if (Number.isNaN(base.getTime())) return new Date();
  base.setDate(base.getDate() + 3 + (patchSeed(p) % 60));
  return base;
};

/* The CVEs this patch closes. Security updates carry several, a definition update none —
   which is the honest shape, and it is what the Vulnerabilities tab of the detail page
   lists for the same record. */
export const patchResolvedCvesOf = (p: Patch): string[] => {
  const cat = p.category ?? 'Updates';
  if (cat === 'Definition Updates' || cat === 'Tools') return [];
  const h = patchSeed(p);
  const n = cat === 'Security Updates' || cat === 'Critical Updates' ? 2 + (h % 3) : h % 3;
  const year = p.releaseDate.match(/\b(20\d{2})\b/)?.[1] ?? '2026';
  return Array.from({ length: n }, (_, i) => `CVE-${year}-${21000 + ((h * 7 + i * 131) % 8999)}`);
};

const PATCH_TAG_POOL = ['patch-tuesday', 'security', 'third-party', 'pilot-ring', 'servers', 'workstations', 'urgent'];
export const patchTagsOf = (p: Patch): string[] => {
  const h = patchSeed(p);
  if (h % 4 === 0) return [];
  const a = PATCH_TAG_POOL[h % PATCH_TAG_POOL.length];
  const b = PATCH_TAG_POOL[(h * 3) % PATCH_TAG_POOL.length];
  return a === b ? [a] : [a, b];
};

export function PatchesListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [patches] = useState<Patch[]>(mockPatches);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Patch | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenPatch = (patch: Patch) => {
    openInStack('patches', patch.id, patch.name, patch);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(patches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };
  const handleSort = (column: keyof Patch) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  let filtered = patches;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = patches.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.severity.toLowerCase().includes(q) ||
      p.releaseDate.toLowerCase().includes(q) ||
      p.rebootRequired.toLowerCase().includes(q) ||
      p.approvalStatus.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aStr = String(a[sortColumn] ?? '');
      const bStr = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="patches" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <PatchesToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <PatchesTable
              patches={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onPatchClick={handleOpenPatch}
            />
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sorted.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
      </div>
    </div>
  );
}
