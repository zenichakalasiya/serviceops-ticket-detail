import { useEffect, useState } from 'react';
import { Search, X, Filter, Settings, History } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Pagination } from './Pagination';
import { ReportsTable, type ReportRow } from './ReportsTable';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';
import {
  IconRequest, IconProblem, IconChange, IconRelease, IconAssets, IconCMDB,
  IconPatch, IconPackage, IconProject, IconTask, IconVulnerability,
} from './SidebarIcons';
import { ShoppingCart, FileText, KeySquare, Monitor, Bot, LayoutGrid, Laptop, AppWindow, Armchair, Boxes } from 'lucide-react';

/* Reports listing — the report catalog behind the sidebar's Report icon.
 *
 * Layout mirrors the product: a category rail on the left (one entry per module, the Asset
 * group with its four sub-types indented) and the selected category's reports on the right,
 * in the standard list-table language with the shared Pagination underneath. */

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Indented under the Asset group. */
  child?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'request', label: 'Request', icon: <IconRequest size={16} /> },
  { id: 'service-catalog', label: 'Service Catalog', icon: <LayoutGrid size={16} /> },
  { id: 'problem', label: 'Problem', icon: <IconProblem size={16} /> },
  { id: 'change', label: 'Change', icon: <IconChange size={16} /> },
  { id: 'release', label: 'Release', icon: <IconRelease size={16} /> },
  { id: 'asset', label: 'Asset', icon: <IconAssets size={16} /> },
  { id: 'hardware-asset', label: 'Hardware Asset', icon: <Laptop size={16} />, child: true },
  { id: 'software-asset', label: 'Software Asset', icon: <AppWindow size={16} />, child: true },
  { id: 'non-it-asset', label: 'Non-IT Asset', icon: <Armchair size={16} />, child: true },
  { id: 'consumable-asset', label: 'Consumable Asset', icon: <Boxes size={16} />, child: true },
  { id: 'cmdb', label: 'CMDB', icon: <IconCMDB size={16} /> },
  { id: 'contract', label: 'Contract', icon: <FileText size={16} /> },
  { id: 'purchase', label: 'Purchase', icon: <ShoppingCart size={16} /> },
  { id: 'patch', label: 'Patch', icon: <IconPatch size={16} /> },
  { id: 'deployment', label: 'Deployment', icon: <IconPackage size={16} /> },
  { id: 'vulnerability', label: 'Vulnerability', icon: <IconVulnerability size={16} /> },
  { id: 'project', label: 'Project', icon: <IconProject size={16} /> },
  { id: 'agent', label: 'Agent', icon: <Bot size={16} /> },
  { id: 'task', label: 'Task', icon: <IconTask size={16} /> },
  { id: 'software-license', label: 'Software License', icon: <KeySquare size={16} /> },
  { id: 'os-deployment', label: 'OS Deployment', icon: <Monitor size={16} /> },
];

/* Realistic report catalog per category. The Request set is intentionally the deepest (monthly
 * operational reports accumulate there in real deployments) so the pagination has work to do. */
const r = (name: string, createdDate: string, createdBy: string, type: ReportRow['type'] = 'Tabular Report', archived = false): Omit<ReportRow, 'id'> =>
  ({ name, createdDate, createdBy, type, archived });

const REPORTS_BY_CATEGORY: Record<string, Omit<ReportRow, 'id'>[]> = {
  'request': [
    r('SLA Breach Summary — July', 'Fri, Jul 31, 2026 06:15 PM', 'Rakesh Rathod', 'Tabular Report'),
    r('Open Requests by Technician Group', 'Tue, Jul 28, 2026 11:40 AM', 'Sarah Johnson', 'Matrix Report'),
    r('Reopened Requests — Quarterly', 'Mon, Jul 20, 2026 03:05 PM', 'Priya Nair', 'Summary Report'),
    r('First Response Time by Priority', 'Thu, Jul 16, 2026 09:22 AM', 'Vikram Sethi', 'Plugin Report'),
    r('Requests Created vs Resolved — Weekly', 'Mon, Jul 13, 2026 10:00 AM', 'Rakesh Rathod', 'Query Report'),
    r('Ageing Requests (Older Than 7 Days)', 'Fri, Jul 10, 2026 05:48 PM', 'Neha Raje', 'Tabular Report', true),
    r('VIP Requester Activity', 'Wed, Jul 08, 2026 02:30 PM', 'Karan Malhotra'),
    r('Escalation Trend by Department', 'Mon, Jul 06, 2026 12:12 PM', 'Sarah Johnson', 'Summary Report'),
    r('Requests by Source Channel', 'Wed, Jul 01, 2026 04:55 PM', 'Rosy Fernandes', 'Plugin Report'),
    r('Customer Satisfaction — June', 'Tue, Jun 30, 2026 06:00 PM', 'Priya Nair', 'Summary Report'),
    r('SLA Breach Summary — June', 'Tue, Jun 30, 2026 05:45 PM', 'Rakesh Rathod', 'Summary Report'),
    r('Pending Approval Requests', 'Thu, Jun 25, 2026 10:35 AM', 'Tabrez Khan', 'Query Report'),
    r('Hourly Intake — Service Desk', 'Mon, Jun 22, 2026 08:20 AM', 'Vikram Sethi', 'Tabular Report', true),
    r('Requests Linked to Problems', 'Wed, Jun 17, 2026 01:15 PM', 'Neha Raje', 'Query Report'),
    r('Transferred Requests by Group', 'Fri, Jun 12, 2026 03:40 PM', 'Karan Malhotra', 'Matrix Report'),
    r('Requests Created vs Resolved — May', 'Sun, May 31, 2026 07:10 PM', 'Rakesh Rathod'),
    r('Breached OLA Detail', 'Tue, May 26, 2026 11:05 AM', 'Sarah Johnson', 'Tabular Report', true),
    r('Top 10 Requesters by Volume', 'Wed, May 20, 2026 02:00 PM', 'Rosy Fernandes', 'Summary Report'),
  ],
  'service-catalog': [
    r('Catalog Requests by Item', 'Wed, Jul 29, 2026 06:33 PM', 'Priya Nair', 'Matrix Report'),
    r('Fulfilment Time by Catalog Category', 'Thu, Jul 23, 2026 06:23 PM', 'Sarah Johnson'),
    r('Onboarding Bundle Usage', 'Thu, Jul 16, 2026 12:14 PM', 'Rakesh Rathod', 'Plugin Report'),
    r('Rejected Catalog Requests', 'Wed, Jul 08, 2026 02:46 PM', 'Neha Raje', 'Tabular Report', true),
    r('Catalog Item Approval Cycle Time', 'Mon, Jun 29, 2026 05:38 PM', 'Vikram Sethi', 'Summary Report'),
    r('Most Requested Items — Quarterly', 'Fri, Jun 12, 2026 07:35 PM', 'Karan Malhotra'),
  ],
  'problem': [
    r('Open Problems by Root Cause', 'Mon, Jul 27, 2026 04:20 PM', 'Vikram Sethi', 'Matrix Report'),
    r('Known Errors With Workarounds', 'Tue, Jul 14, 2026 10:45 AM', 'Sarah Johnson'),
    r('Problem Ageing — 30/60/90', 'Thu, Jul 02, 2026 09:30 AM', 'Rakesh Rathod', 'Summary Report'),
    r('Recurring Incidents Rolled Into Problems', 'Mon, Jun 15, 2026 03:25 PM', 'Priya Nair', 'Query Report'),
  ],
  'change': [
    r('Changes by Risk and Outcome', 'Fri, Jul 24, 2026 05:10 PM', 'Karan Malhotra', 'Matrix Report'),
    r('Emergency Changes — Quarterly', 'Fri, Jul 10, 2026 11:55 AM', 'Rakesh Rathod'),
    r('CAB Approval Turnaround', 'Tue, Jun 23, 2026 02:35 PM', 'Neha Raje', 'Summary Report'),
    r('Failed Changes With Rollback', 'Wed, Jun 10, 2026 04:05 PM', 'Vikram Sethi', 'Tabular Report', true),
  ],
  'release': [
    r('Releases by Go-Live Status', 'Wed, Jul 22, 2026 06:40 PM', 'Priya Nair'),
    r('Release Calendar — Quarterly', 'Mon, Jun 29, 2026 10:15 AM', 'Sarah Johnson', 'Summary Report'),
  ],
  'asset': [
    r('Assets by Status and Location', 'Thu, Jul 30, 2026 03:50 PM', 'Tabrez Khan', 'Matrix Report'),
    r('Warranty Expiring in 90 Days', 'Mon, Jul 20, 2026 09:10 AM', 'Rakesh Rathod'),
    r('Unassigned Assets', 'Wed, Jul 08, 2026 01:25 PM', 'Rosy Fernandes', 'Query Report'),
    r('Asset Audit Variance — July', 'Wed, Jul 01, 2026 05:30 PM', 'Sarah Johnson', 'Tabular Report', true),
  ],
  'hardware-asset': [
    r('Laptops Due for Refresh (4+ Years)', 'Tue, Jul 28, 2026 02:15 PM', 'Tabrez Khan'),
    r('Hardware by Manufacturer and Model', 'Wed, Jul 15, 2026 11:20 AM', 'Vikram Sethi', 'Matrix Report'),
    r('Devices Missing Antivirus', 'Fri, Jul 03, 2026 04:45 PM', 'Sarah Johnson', 'Query Report'),
  ],
  'software-asset': [
    r('Unmanaged Software Discovered', 'Mon, Jul 27, 2026 10:05 AM', 'Neha Raje', 'Query Report'),
    r('Software by Category and Version', 'Thu, Jul 09, 2026 03:55 PM', 'Priya Nair', 'Matrix Report'),
  ],
  'non-it-asset': [
    r('Non-IT Assets by Department', 'Tue, Jul 21, 2026 12:30 PM', 'Rosy Fernandes'),
  ],
  'consumable-asset': [
    r('Consumables Below Reorder Level', 'Fri, Jul 24, 2026 09:40 AM', 'Karan Malhotra', 'Query Report'),
    r('Consumable Allocation — Monthly', 'Tue, Jun 30, 2026 06:05 PM', 'Tabrez Khan'),
  ],
  'cmdb': [
    r('CIs Without an Owner', 'Wed, Jul 29, 2026 11:00 AM', 'Vikram Sethi', 'Query Report'),
    r('CI Relationship Coverage', 'Tue, Jul 14, 2026 04:25 PM', 'Rakesh Rathod', 'Summary Report'),
  ],
  'contract': [
    r('Contracts Expiring This Quarter', 'Mon, Jul 27, 2026 05:20 PM', 'Priya Nair'),
    r('Contract Spend by Vendor', 'Fri, Jul 10, 2026 02:50 PM', 'Karan Malhotra', 'Matrix Report'),
  ],
  'purchase': [
    r('Open Purchase Orders by Vendor', 'Thu, Jul 23, 2026 10:30 AM', 'Rosy Fernandes'),
    r('Outstanding vs Paid — Monthly', 'Tue, Jun 30, 2026 07:15 PM', 'Rakesh Rathod', 'Summary Report'),
  ],
  'patch': [
    r('Missing Critical Patches by Endpoint', 'Fri, Jul 31, 2026 08:45 AM', 'Sarah Johnson', 'Matrix Report'),
    r('Patch Compliance — Monthly', 'Tue, Jun 30, 2026 06:30 PM', 'Vikram Sethi', 'Summary Report'),
    r('Declined Patches With Reason', 'Thu, Jun 18, 2026 01:40 PM', 'Neha Raje', 'Tabular Report', true),
  ],
  'deployment': [
    r('Deployment Success Rate by Office', 'Wed, Jul 22, 2026 03:35 PM', 'Rakesh Rathod', 'Matrix Report'),
    r('Failed Installations — Last 30 Days', 'Wed, Jul 08, 2026 09:55 AM', 'Tabrez Khan', 'Query Report'),
  ],
  'vulnerability': [
    r('Exploited CVEs Without a Patch', 'Thu, Jul 30, 2026 08:20 AM', 'Sarah Johnson', 'Query Report'),
    r('Vulnerability Ageing by Severity', 'Wed, Jul 15, 2026 02:10 PM', 'Vikram Sethi', 'Matrix Report'),
  ],
  'project': [
    r('Projects by Phase and Owner', 'Tue, Jul 21, 2026 11:45 AM', 'Karan Malhotra', 'Matrix Report'),
  ],
  'agent': [
    r('Agents Offline Over 7 Days', 'Mon, Jul 27, 2026 09:05 AM', 'Tabrez Khan', 'Query Report'),
    r('Agent Version Distribution', 'Fri, Jul 17, 2026 04:00 PM', 'Neha Raje', 'Plugin Report'),
  ],
  'task': [
    r('Overdue Tasks by Assignee', 'Fri, Jul 31, 2026 10:25 AM', 'Rakesh Rathod', 'Matrix Report'),
    r('Task Completion Time by Type', 'Thu, Jul 16, 2026 03:15 PM', 'Sarah Johnson', 'Summary Report'),
  ],
  'software-license': [
    r('Over-Utilised Licences', 'Wed, Jul 29, 2026 12:40 PM', 'Priya Nair', 'Query Report'),
    r('Licence Spend vs Utilisation', 'Fri, Jul 10, 2026 05:05 PM', 'Rakesh Rathod', 'Matrix Report'),
  ],
  'os-deployment': [
    r('OS Rollout Progress — Windows 11', 'Tue, Jul 28, 2026 01:55 PM', 'Vikram Sethi', 'Summary Report'),
  ],
};

/** Stable ids per category so React keys and future deep-links stay predictable. */
export const REPORTS: Record<string, ReportRow[]> = Object.fromEntries(
  Object.entries(REPORTS_BY_CATEGORY).map(([cat, rows]) => [
    cat,
    rows.map((row, i) => ({ id: `${cat}-rep-${i + 1}`, ...row })),
  ]),
);

/* The Report detail page is (for now) a KnowledgeDrawer clone, so a report opens through the
   same knowledge-shaped adapter — author/created/folder ride in the knowledge payload. */
export const reportToKnowledgeShape = (row: ReportRow, categoryLabel: string): Patch => ({
  id: row.id.toUpperCase().replace(/-rep-/, '-REP-'),
  name: row.name,
  severity: 'Unspecified',
  releaseDate: '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: 'Approved',
  category: row.type,
  knowledge: {
    author: row.createdBy,
    created: row.createdDate,
    folder: categoryLabel,
    totalRead: 0,
  },
});

export function ReportsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [categoryId, setCategoryId] = useState('request');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const category = CATEGORIES.find((c) => c.id === categoryId)!;
  const { open: openInStack } = useDrawerStack();
  const openReport = (row: ReportRow) => openInStack('report', row.id.toUpperCase().replace(/-rep-/, '-REP-'), row.name, reportToKnowledgeShape(row, category.label));
  const all = REPORTS[categoryId] ?? [];
  const q = searchQuery.trim().toLowerCase();
  const filtered = q ? all.filter((row) => (row.name + row.createdBy + row.type).toLowerCase().includes(q)) : all;
  const pageRows = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); setSearchQuery(''); }, [categoryId]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="reports" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} />

        {/* Page bar — title left, report-level actions right. */}
        <div className="bg-white">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-6 py-3">
            <h1 className="flex-shrink-0 text-[16px] font-semibold text-[#364658]">Reports</h1>
            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              <button className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">
                <History size={14} />
                View History
              </button>
              <button className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]">
                Create
              </button>
              <button title="Report settings" className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]">
                <Settings size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Category rail — one entry per module, Asset's sub-types indented beneath it. */}
          <div className="w-[232px] flex-shrink-0 overflow-y-auto border-r border-[#e5e7eb] bg-white py-2">
            {CATEGORIES.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex w-[calc(100%-16px)] items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] transition-colors ${c.child ? 'ml-6 w-[calc(100%-40px)]' : 'mx-2'} ${
                    active ? 'bg-[#EAF2FB] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <span className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{c.icon}</span>
                  <span className="min-w-0 truncate">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected category's reports. */}
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <div className="flex-shrink-0 px-6 pt-4">
              <h2 className="text-[16px] font-semibold text-[#3D8BD0]">{category.label}</h2>
              <div className="mt-3 flex items-center gap-2 pb-3">
                <div className="relative w-[280px]">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded hover:bg-[#F3F4F6]">
                      <X size={13} className="text-[#7B8FA5]" />
                    </button>
                  )}
                </div>
                <button title="Filter" className="flex size-9 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <ReportsTable reports={pageRows} onReportClick={openReport} />
            </div>

            <div className="flex-shrink-0 border-t border-[#e5e7eb]">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(filtered.length / itemsPerPage))}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
