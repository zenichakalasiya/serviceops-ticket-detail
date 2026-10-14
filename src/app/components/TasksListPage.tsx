import { useEffect, useState } from 'react';
import { Search, X, ChevronDown, Plus, Star, RefreshCw, Columns3, Filter, FileDown, Download, MoreVertical } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Pagination } from './Pagination';
import { TasksTable } from './TasksTable';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';
// Signed-in identity comes from the roster so Tasks, saved views and My view agree.
import { CURRENT_USER } from './technicianRoster';

/* Task listing — every task across the service desk, independent of the record it belongs to.
 * Built from the same parts as the other list pages (Sidebar · Header · toolbar · grid ·
 * Pagination) so it reads as the same product rather than a bolt-on. */

export interface TaskRow {
  id: string;
  subject: string;
  /** Parent record, e.g. "REQ-00812735". Tasks raised standalone have none. */
  reference: string | null;
  /** Which module the reference belongs to, so the row can open the right drawer. */
  referenceModule?: 'request' | 'problem' | 'change' | 'release';
  taskType:
    | 'Implementation' | 'Install/Uninstall' | 'Maintainance' | 'Planning' | 'Release'
    | 'Replacement/Repair' | 'Testing' | 'Troubleshooting' | 'Milestone';
  status: 'Open' | 'In Progress' | 'Pending' | 'Rejected' | 'Resolved' | 'Closed';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  assignee: string;
  /** Set only when the task has missed its due date, e.g. "2 weeks 3 days overdue". */
  overdueBy?: string;
}

/* Realistic service-desk tasks — the work that actually hangs off requests, problems and changes,
   spread across types, statuses and priorities so every column has something to show. */
export const mockTasks: TaskRow[] = [
  { id: 'TA-7648', subject: 'Image laptop and install the standard build', reference: 'REQ-00812735', referenceModule: 'request', taskType: 'Install/Uninstall', status: 'In Progress', priority: 'High', assignee: 'Tabrez Khan' },
  { id: 'TA-7647', subject: 'Create Active Directory account for new joiner', reference: 'REQ-00812735', referenceModule: 'request', taskType: 'Implementation', status: 'Open', priority: 'High', assignee: 'Sarah Johnson' },
  { id: 'TA-7646', subject: 'Assign Microsoft 365 E3 licence', reference: 'REQ-00812735', referenceModule: 'request', taskType: 'Install/Uninstall', status: 'Open', priority: 'Medium', assignee: 'Vikram Sethi' },
  { id: 'TA-7645', subject: 'Verify VPN access from the corporate network', reference: 'INC-31', referenceModule: 'request', taskType: 'Testing', status: 'In Progress', priority: 'Urgent', assignee: 'Rahul Verma', overdueBy: '2 days 4 hours overdue' },
  { id: 'TA-7644', subject: 'Replace faulty docking station at desk 4-B', reference: 'INC-32', referenceModule: 'request', taskType: 'Replacement/Repair', status: 'Open', priority: 'High', assignee: 'Neha Raje' },
  { id: 'TA-7643', subject: 'Capture packet trace on the third-floor switch', reference: 'PRB-1004', referenceModule: 'problem', taskType: 'Troubleshooting', status: 'In Progress', priority: 'High', assignee: 'Siddharth Rao' },
  { id: 'TA-7642', subject: 'Draft the post-incident review document', reference: 'PRB-1002', referenceModule: 'problem', taskType: 'Planning', status: 'Pending', priority: 'Medium', assignee: 'Ananya Iyer' },
  { id: 'TA-7639', subject: 'Obtain change advisory board approval', reference: 'CHG-2091', referenceModule: 'change', taskType: 'Milestone', status: 'Rejected', priority: 'High', assignee: 'Karan Malhotra' },
  { id: 'TA-7638', subject: 'Schedule the maintenance window with the business', reference: 'CHG-2091', referenceModule: 'change', taskType: 'Planning', status: 'Open', priority: 'Medium', assignee: 'Priya Nair' },
  { id: 'TA-7637', subject: 'Roll back the payment module deployment', reference: 'PRB-599', referenceModule: 'problem', taskType: 'Release', status: 'Resolved', priority: 'Urgent', assignee: 'Rakesh Rathod' },
  { id: 'TA-7636', subject: 'Review firewall rule change for the DMZ', reference: 'CHG-976', referenceModule: 'change', taskType: 'Planning', status: 'In Progress', priority: 'High', assignee: 'Farah Sheikh' },
  { id: 'TA-7635', subject: 'Order replacement SSD for the finance workstation', reference: null, taskType: 'Replacement/Repair', status: 'Rejected', priority: 'Low', assignee: 'Diya Kapoor' },
  { id: 'TA-7634', subject: 'Update the VPN knowledge article for the new client', reference: 'KB-1', taskType: 'Maintainance', status: 'Open', priority: 'Low', assignee: 'Juli Mathew' },
  { id: 'TA-7633', subject: 'Validate backup restore for the payroll database', reference: 'PRB-1002', referenceModule: 'problem', taskType: 'Testing', status: 'In Progress', priority: 'Medium', assignee: 'Rohan Mehta', overdueBy: '1 day 6 hours overdue' },
  { id: 'TA-7632', subject: 'Decommission the retired file server', reference: 'CHG-2091', referenceModule: 'change', taskType: 'Maintainance', status: 'Pending', priority: 'Medium', assignee: 'Tabrez Khan' },
  { id: 'TA-7631', subject: 'Collect signed acceptable-use acknowledgement', reference: 'REQ-00812740', referenceModule: 'request', taskType: 'Milestone', status: 'Resolved', priority: 'Low', assignee: 'Meera Krishnan' },
  { id: 'TA-7613', subject: 'Patch the Exchange servers to the April rollup', reference: 'CHG-2088', referenceModule: 'change', taskType: 'Maintainance', status: 'In Progress', priority: 'Urgent', assignee: 'Vikram Sethi', overdueBy: '2 weeks 3 days overdue' },
  { id: 'TA-7527', subject: 'Confirm the QoS policy update on the core switches', reference: 'PRB-627', referenceModule: 'problem', taskType: 'Testing', status: 'Pending', priority: 'Medium', assignee: 'Siddharth Rao' },
  { id: 'TA-7373', subject: 'Reconcile the software licence count for Adobe', reference: null, taskType: 'Maintainance', status: 'Open', priority: 'Low', assignee: 'Farah Sheikh' },
  { id: 'TA-7304', subject: 'Enrol the replacement phone in device management', reference: 'REQ-00812735', referenceModule: 'request', taskType: 'Install/Uninstall', status: 'Open', priority: 'High', assignee: 'Rohan Mehta' },
  { id: 'TA-7303', subject: 'Hand over the asset and capture the signature', reference: 'REQ-00812735', referenceModule: 'request', taskType: 'Milestone', status: 'Open', priority: 'Medium', assignee: 'Neha Raje', overdueBy: '2 weeks 3 days 5 hours overdue' },
  { id: 'TA-7298', subject: 'Restore the mailbox from the nightly backup', reference: 'INC-27', referenceModule: 'request', taskType: 'Troubleshooting', status: 'Resolved', priority: 'High', assignee: 'Sarah Johnson' },
  { id: 'TA-7291', subject: 'Test the failover link to the secondary ISP', reference: 'CHG-2085', referenceModule: 'change', taskType: 'Testing', status: 'Closed', priority: 'Medium', assignee: 'Rahul Verma' },
  { id: 'TA-7286', subject: 'Approve the additional monitor request', reference: 'REQ-00812718', referenceModule: 'request', taskType: 'Milestone', status: 'Closed', priority: 'Low', assignee: 'Karan Malhotra' },
  { id: 'TA-7280', subject: 'Document the new starter onboarding checklist', reference: null, taskType: 'Planning', status: 'Pending', priority: 'Low', assignee: 'Ananya Iyer' },
];

/** Saved views, matching the filter each one applies. */
const TASK_VIEWS = [
  { id: 'open', label: 'All Open Tasks', chip: 'Status Not In Not Started, Closed' },
  { id: 'all', label: 'All Tasks', chip: null },
  { id: 'overdue', label: 'Overdue Tasks', chip: 'Due By Status Is Overdue' },
  { id: 'mine', label: 'My Tasks', chip: `Assignee Is ${CURRENT_USER}` },
] as const;

/* Map a task onto the Patch shape so the cloned PatchDrawer body compiles unchanged. Severity
   carries the task's priority, so the cloned severity treatments read as priority for now. */
export const taskToPatchShape = (t: TaskRow): Patch => ({
  id: t.id,
  name: t.subject,
  severity: (t.priority === 'Urgent' ? 'Critical' : t.priority) as Patch['severity'],
  releaseDate: 'Mon, Aug 17, 2026 05:00 PM',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: 'Approved',
  category: t.taskType,
  task: {
    status: t.status,
    priority: t.priority,
    taskType: t.taskType,
    assignee: t.assignee,
    reference: t.reference,
    referenceModule: t.referenceModule,
    overdueBy: t.overdueBy,
    dueDate: t.overdueBy ? 'Sun, Jul 26, 2026' : 'Mon, Aug 17, 2026',
  },
});

export function TasksListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [tasks] = useState<TaskRow[]>(mockTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewId, setViewId] = useState<(typeof TASK_VIEWS)[number]['id']>('open');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const view = TASK_VIEWS.find((v) => v.id === viewId)!;

  useEffect(() => { setCurrentPage(1); setSelected(new Set()); }, [searchQuery, viewId]);

  const { open: openInStack } = useDrawerStack();
  const openTask = (t: TaskRow) => openInStack('tasks', t.id, t.subject, taskToPatchShape(t));
  const openReference = (t: TaskRow) => {
    if (!t.reference || !t.referenceModule) return;
    openInStack(t.referenceModule, t.reference, t.subject, {});
  };

  // The saved view filters first; the search then narrows whatever it returned.
  let filtered = tasks.filter((t) =>
    viewId === 'open' ? t.status !== 'Not Started' && t.status !== 'Closed'
      : viewId === 'overdue' ? !!t.overdueBy
        : viewId === 'mine' ? t.assignee === CURRENT_USER
          : true,
  );
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) =>
      t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) ||
      (t.reference ?? '').toLowerCase().includes(q) || t.taskType.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) || t.priority.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q),
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageIds = paginated.map((t) => t.id);
  const allCurrentSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const handleSelectAll = (checked: boolean) => setSelected(checked ? new Set(pageIds) : new Set());
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  const toolbarIcons = [
    { label: 'Refresh', icon: <RefreshCw size={16} /> },
    { label: 'Manage columns', icon: <Columns3 size={16} /> },
    { label: 'Filter', icon: <Filter size={16} /> },
    { label: 'Export as PDF', icon: <FileDown size={16} /> },
    { label: 'Download', icon: <Download size={16} /> },
    { label: 'More', icon: <MoreVertical size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="tasks" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />

        {/* Toolbar — title + saved-view picker on the left, actions on the right. */}
        <div className="bg-white">
          <div className="flex items-center gap-3 px-6 py-3">
            <h1 className="flex-shrink-0 text-[16px] font-semibold text-[#364658]">Tasks</h1>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-[14px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                {view.label}
                <ChevronDown size={15} className="text-[#6b7280]" />
              </button>
              {showViewMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowViewMenu(false)} />
                  <div className="app-menu absolute left-0 top-full z-20 mt-1 w-[220px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                    {TASK_VIEWS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setViewId(v.id); setShowViewMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-[13px] transition-colors hover:bg-[#F5F7FA] ${viewId === v.id ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}
                      >{v.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto flex flex-shrink-0 items-center gap-1">
              <button className="mr-2 flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]">
                <Plus size={15} />
                Create Task
              </button>
              {toolbarIcons.map((a) => (
                <Tooltip key={a.label}>
                  <TooltipTrigger asChild>
                    <button className="flex size-8 items-center justify-center rounded text-[#6b7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
                      {a.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{a.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Search row, with the view's own filter shown as a removable chip inside it. */}
          <div className="px-6 pb-3">
            <div className="flex h-[36px] items-center gap-2 rounded border border-[#d1d5db] bg-white px-2 focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0]">
              <Star size={15} className="flex-shrink-0 fill-[#3D8BD0] text-[#3D8BD0]" />
              {view.chip && (
                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded bg-[#EEF2F6] py-0.5 pl-2 pr-1 text-[12px] text-[#364658]">
                  {view.chip}
                  <button onClick={() => setViewId('all')} className="rounded p-0.5 hover:bg-[#DFE5ED]">
                    <X size={12} className="text-[#7B8FA5]" />
                  </button>
                </span>
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Select field or enter a keyword to search..."
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="flex-shrink-0 text-[#9ca3af] transition-colors hover:text-[#364658]"><X size={16} /></button>
              ) : (
                <Search className="flex-shrink-0 text-[#9ca3af]" size={16} />
              )}
            </div>
          </div>
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <TasksTable
              tasks={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onReferenceClick={openReference}
              onTaskClick={openTask}
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
