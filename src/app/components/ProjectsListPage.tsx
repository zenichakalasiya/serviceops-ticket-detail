import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { ProjectsTable } from './ProjectsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';

export type ProjectStatus = 'Open' | 'Planning' | 'Implementation' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  /** owner display name, or null = Unassigned */
  owner: string | null;
  start: Date | null;
  end: Date | null;
  /** 0–100 */
  completion: number;
  tasksDone: number;
  tasksTotal: number;
  milestonesDone: number;
  milestonesTotal: number;
}

const D = (s: string) => new Date(s.replace(' ', 'T'));

/* Realistic enterprise IT programme portfolio — the same world the asset,
   patch and release mocks live in (fleet refreshes, upgrades, compliance,
   office builds), staggered from late 2025 into 2027. */
export const mockProjects: Project[] = [
  { id: 'PRJ-148', name: 'Windows 11 Fleet Migration – Wave 2', status: 'Implementation', priority: 'Critical', owner: 'Arjun Mehta', start: D('2026-03-02 09:00'), end: D('2026-09-30 18:00'), completion: 58, tasksDone: 21, tasksTotal: 36, milestonesDone: 3, milestonesTotal: 6 },
  { id: 'PRJ-147', name: 'Zero Trust Network Access Rollout', status: 'Implementation', priority: 'Critical', owner: 'Priya Sharma', start: D('2026-04-13 10:00'), end: D('2026-11-27 18:00'), completion: 34, tasksDone: 12, tasksTotal: 35, milestonesDone: 2, milestonesTotal: 7 },
  { id: 'PRJ-146', name: 'SAP S/4HANA Platform Upgrade', status: 'Planning', priority: 'Critical', owner: 'Vikram Singh', start: D('2026-06-01 09:30'), end: D('2027-02-26 18:00'), completion: 12, tasksDone: 5, tasksTotal: 42, milestonesDone: 1, milestonesTotal: 8 },
  { id: 'PRJ-145', name: 'Disaster Recovery Site Build – Chennai', status: 'Implementation', priority: 'High', owner: 'Rahul Deshmukh', start: D('2026-01-19 09:00'), end: D('2026-08-14 18:00'), completion: 71, tasksDone: 32, tasksTotal: 45, milestonesDone: 4, milestonesTotal: 6 },
  { id: 'PRJ-144', name: 'Endpoint Patch Automation Rollout', status: 'Implementation', priority: 'High', owner: 'Sneha Iyer', start: D('2026-05-04 09:00'), end: D('2026-07-31 18:00'), completion: 46, tasksDone: 13, tasksTotal: 28, milestonesDone: 2, milestonesTotal: 4 },
  { id: 'PRJ-143', name: 'Service Desk AI Assistant Pilot', status: 'Open', priority: 'High', owner: 'Kavita Rao', start: D('2026-07-06 09:30'), end: D('2026-10-16 18:00'), completion: 4, tasksDone: 1, tasksTotal: 22, milestonesDone: 0, milestonesTotal: 4 },
  { id: 'PRJ-142', name: 'Pune Office IT Build-Out', status: 'Implementation', priority: 'High', owner: 'Rohan Mehta', start: D('2026-02-09 09:00'), end: D('2026-06-30 18:00'), completion: 88, tasksDone: 29, tasksTotal: 33, milestonesDone: 5, milestonesTotal: 6 },
  { id: 'PRJ-141', name: 'Identity Governance Implementation', status: 'Planning', priority: 'High', owner: 'Neha Raje', start: D('2026-06-15 09:00'), end: D('2027-01-15 18:00'), completion: 8, tasksDone: 3, tasksTotal: 30, milestonesDone: 0, milestonesTotal: 6 },
  { id: 'PRJ-140', name: 'ISO 27001 Certification Programme', status: 'Implementation', priority: 'Critical', owner: 'Priya Sharma', start: D('2025-11-03 09:00'), end: D('2026-10-30 18:00'), completion: 62, tasksDone: 40, tasksTotal: 64, milestonesDone: 5, milestonesTotal: 9 },
  { id: 'PRJ-139', name: 'Network Segmentation – Phase 2', status: 'On Hold', priority: 'High', owner: 'Arjun Mehta', start: D('2026-03-23 09:00'), end: D('2026-09-11 18:00'), completion: 27, tasksDone: 9, tasksTotal: 31, milestonesDone: 1, milestonesTotal: 5 },
  { id: 'PRJ-138', name: 'Backup Modernization (Immutable Storage)', status: 'Implementation', priority: 'High', owner: 'Vikram Singh', start: D('2026-04-06 09:00'), end: D('2026-08-28 18:00'), completion: 52, tasksDone: 14, tasksTotal: 26, milestonesDone: 2, milestonesTotal: 4 },
  { id: 'PRJ-137', name: 'Laptop Refresh – Wave 3 (Engineering)', status: 'Open', priority: 'Medium', owner: 'Jainam Shah', start: D('2026-08-03 09:00'), end: D('2026-11-20 18:00'), completion: 0, tasksDone: 0, tasksTotal: 18, milestonesDone: 0, milestonesTotal: 3 },
  { id: 'PRJ-136', name: 'Monitoring Stack Consolidation', status: 'Implementation', priority: 'Medium', owner: 'Sneha Iyer', start: D('2026-02-23 09:00'), end: D('2026-07-17 18:00'), completion: 64, tasksDone: 16, tasksTotal: 24, milestonesDone: 3, milestonesTotal: 5 },
  { id: 'PRJ-135', name: 'Branch SD-WAN Rollout – North Region', status: 'Implementation', priority: 'High', owner: 'Rahul Deshmukh', start: D('2026-01-05 09:00'), end: D('2026-12-18 18:00'), completion: 43, tasksDone: 22, tasksTotal: 52, milestonesDone: 3, milestonesTotal: 8 },
  { id: 'PRJ-134', name: 'Self-Service Portal Redesign', status: 'Planning', priority: 'Medium', owner: 'Kavita Rao', start: D('2026-07-20 09:30'), end: D('2026-12-04 18:00'), completion: 6, tasksDone: 2, tasksTotal: 25, milestonesDone: 0, milestonesTotal: 5 },
  { id: 'PRJ-133', name: 'CMDB Data Quality Initiative', status: 'Implementation', priority: 'Medium', owner: 'Neha Raje', start: D('2026-03-09 09:00'), end: D('2026-08-07 18:00'), completion: 55, tasksDone: 17, tasksTotal: 30, milestonesDone: 2, milestonesTotal: 4 },
  { id: 'PRJ-132', name: 'Office 365 Tenant Consolidation', status: 'On Hold', priority: 'Medium', owner: null, start: D('2026-05-11 09:00'), end: D('2026-10-02 18:00'), completion: 18, tasksDone: 6, tasksTotal: 27, milestonesDone: 1, milestonesTotal: 5 },
  { id: 'PRJ-131', name: 'Cloud Cost Optimization Programme', status: 'Implementation', priority: 'Medium', owner: 'Rohan Mehta', start: D('2026-04-27 09:00'), end: D('2026-09-25 18:00'), completion: 39, tasksDone: 11, tasksTotal: 24, milestonesDone: 1, milestonesTotal: 4 },
  { id: 'PRJ-130', name: 'Intune Co-management Rollout', status: 'Open', priority: 'High', owner: null, start: D('2026-08-17 09:00'), end: D('2027-01-29 18:00'), completion: 0, tasksDone: 0, tasksTotal: 21, milestonesDone: 0, milestonesTotal: 4 },
  { id: 'PRJ-129', name: 'Security Awareness Training FY27', status: 'Open', priority: 'Low', owner: 'Kavita Rao', start: D('2026-09-01 09:00'), end: D('2027-03-31 18:00'), completion: 0, tasksDone: 0, tasksTotal: 12, milestonesDone: 0, milestonesTotal: 4 },
  { id: 'PRJ-128', name: 'Database Platform Upgrade (PostgreSQL 17)', status: 'Planning', priority: 'High', owner: 'Vikram Singh', start: D('2026-06-22 09:00'), end: D('2026-11-13 18:00'), completion: 10, tasksDone: 3, tasksTotal: 26, milestonesDone: 0, milestonesTotal: 5 },
  { id: 'PRJ-127', name: 'Warehouse Wi-Fi 6E Upgrade', status: 'Implementation', priority: 'Medium', owner: 'Arjun Mehta', start: D('2026-05-18 09:00'), end: D('2026-07-24 18:00'), completion: 76, tasksDone: 19, tasksTotal: 24, milestonesDone: 3, milestonesTotal: 4 },
  { id: 'PRJ-126', name: 'Contract Renewal Automation', status: 'Cancelled', priority: 'Low', owner: null, start: D('2026-02-02 09:00'), end: D('2026-05-29 18:00'), completion: 22, tasksDone: 5, tasksTotal: 20, milestonesDone: 1, milestonesTotal: 4 },
  { id: 'PRJ-125', name: 'VPN Replacement with ZTNA Gateway', status: 'Completed', priority: 'High', owner: 'Priya Sharma', start: D('2025-10-06 09:00'), end: D('2026-03-27 18:00'), completion: 100, tasksDone: 28, tasksTotal: 28, milestonesDone: 5, milestonesTotal: 5 },
  { id: 'PRJ-124', name: 'Knowledge Base Revamp & Migration', status: 'Completed', priority: 'Medium', owner: 'Sneha Iyer', start: D('2025-11-17 09:00'), end: D('2026-04-10 18:00'), completion: 100, tasksDone: 22, tasksTotal: 22, milestonesDone: 4, milestonesTotal: 4 },
  { id: 'PRJ-123', name: 'Data Center Network Refresh', status: 'Completed', priority: 'Critical', owner: 'Rahul Deshmukh', start: D('2025-08-04 09:00'), end: D('2026-02-27 18:00'), completion: 100, tasksDone: 47, tasksTotal: 47, milestonesDone: 7, milestonesTotal: 7 },
  { id: 'PRJ-122', name: 'Asset Lifecycle Refresh FY26', status: 'Completed', priority: 'Medium', owner: 'Jainam Shah', start: D('2025-07-14 09:00'), end: D('2026-01-30 18:00'), completion: 100, tasksDone: 31, tasksTotal: 31, milestonesDone: 6, milestonesTotal: 6 },
  { id: 'PRJ-121', name: 'Vendor Consolidation Programme', status: 'Completed', priority: 'Low', owner: 'Neha Raje', start: D('2025-06-02 09:00'), end: D('2025-12-19 18:00'), completion: 100, tasksDone: 18, tasksTotal: 18, milestonesDone: 3, milestonesTotal: 3 },
];

export function ProjectsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [projects] = useState<Project[]>(mockProjects);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Project | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenProject = (p: Project) => openInStack('projects', p.id, p.name, p);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id));
      setSelected(ids);
    } else {
      setSelected(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  const handleSort = (column: keyof Project) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = projects;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = projects.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.priority.toLowerCase().includes(q) ||
      (p.owner ?? 'unassigned').toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const av = a[sortColumn];
      const bv = b[sortColumn];
      // Dates and numbers compare numerically; everything else as text.
      const an = av instanceof Date ? av.getTime() : typeof av === 'number' ? av : null;
      const bn = bv instanceof Date ? bv.getTime() : typeof bv === 'number' ? bv : null;
      const cmp = an !== null && bn !== null ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="projects" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Projects" viewLabel="All Projects" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ProjectsTable
              projects={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onProjectClick={handleOpenProject}
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
