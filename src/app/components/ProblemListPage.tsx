import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProblemToolbar } from './ProblemToolbar';
import { ProblemTable } from './ProblemTable';
import { TicketGroupSuggestions } from './TicketGroupSuggestions';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { ProblemDrawer } from './ProblemDrawer';

export interface Problem {
  id: string;
  subject: string;
  requester: string;
  createdDate: Date;
  assignee: { name: string; initials: string; color: string };
  status: 'Open' | 'In Progress' | 'Pending' | 'Pending QA' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  urgency: 'Low' | 'Medium' | 'High';
}

export const mockProblems: Problem[] = [
  { id: 'PBM-627', subject: 'WiFi dropping connection on 3rd floor repeatedly',        requester: 'Sophie Laurent',   createdDate: new Date(2026,5,5,13,59),  assignee: { name: 'fazu',             initials: 'FA', color: '#F59E0B' }, status: 'Pending',    priority: 'High',   urgency: 'Low' },
  { id: 'PBM-626', subject: 'Email server not receiving incoming messages',            requester: 'Ajith Kumar',      createdDate: new Date(2026,5,3,14,29),  assignee: { name: 'Jay Vegda',        initials: 'JV', color: '#6366F1' }, status: 'Resolved',   priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-625', subject: 'Network connectivity dropping intermittently',            requester: 'Ashini Sharma',    createdDate: new Date(2026,4,21,10,39), assignee: { name: 'naitik',           initials: 'NA', color: '#10B981' }, status: 'Open',       priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-624', subject: 'Application login failure for multiple users',            requester: 'Arjun Mehta',      createdDate: new Date(2026,4,20,13,52), assignee: { name: 'Hardik',           initials: 'HA', color: '#3D8BD0' }, status: 'Open',       priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-622', subject: 'Outbound email delivery failures to external domains',   requester: 'Dharti Patel',     createdDate: new Date(2026,4,1,1,0),    assignee: { name: 'Prerana',          initials: 'PR', color: '#8B5CF6' }, status: 'Pending QA', priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-621', subject: 'Printer on floor 2 not responding to print jobs',        requester: 'Manuel Rodrigues', createdDate: new Date(2026,3,14,7,54),  assignee: { name: 'dhaval',           initials: 'DH', color: '#EF4444' }, status: 'Resolved',   priority: 'High',   urgency: 'Low' },
  { id: 'PBM-620', subject: 'Active Directory sync errors causing login delays',       requester: 'Dharati Shah',     createdDate: new Date(2026,2,27,14,25), assignee: { name: 'Navin Gadhvi',     initials: 'NG', color: '#F97316' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-618', subject: 'DNS resolution failure on internal corporate network',    requester: 'Mark Harrison',    createdDate: new Date(2026,2,13,19,6),  assignee: { name: 'Rosy',             initials: 'RO', color: '#EC4899' }, status: 'In Progress',priority: 'High',   urgency: 'Low' },
  { id: 'PBM-617', subject: 'System performance degraded during peak business hours',  requester: 'Ravi Nair',        createdDate: new Date(2026,1,19,10,31), assignee: { name: 'Udit',             initials: 'UD', color: '#14B8A6' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-616', subject: 'SSL certificate expired on customer-facing web portal',   requester: 'Pooja Verma',      createdDate: new Date(2026,1,19,10,29), assignee: { name: 'Tabrez',           initials: 'TA', color: '#64748B' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-615', subject: 'Remote desktop connections refused for remote employees', requester: 'Vaibhav Prajapati',createdDate: new Date(2026,1,15,21,7),  assignee: { name: 'hemal',            initials: 'HE', color: '#84CC16' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-614', subject: 'User accounts locked after password policy enforcement',  requester: 'Sara Mitchell',    createdDate: new Date(2026,1,9,11,12),  assignee: { name: 'vaibhav prajapati',initials: 'VA', color: '#A78BFA' }, status: 'Resolved',   priority: 'High',   urgency: 'Low' },
  { id: 'PBM-613', subject: 'File server inaccessible from remote office locations',   requester: 'Amit Kulkarni',    createdDate: new Date(2026,1,4,15,44),  assignee: { name: 'Kavit Gohel',      initials: 'KA', color: '#F59E0B' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-612', subject: 'Nightly database backup job failing consistently',        requester: 'Sakshi Gupta',     createdDate: new Date(2026,1,2,19,34),  assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-611', subject: 'CPU usage at 100% on primary production server',          requester: 'Sakshi Joshi',     createdDate: new Date(2026,1,2,19,31),  assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-610', subject: 'Switch port errors causing packet loss in server room',   requester: 'Khoi Nguyen',      createdDate: new Date(2026,1,2,17,38),  assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-609', subject: 'Antivirus definitions not updating on endpoint devices',  requester: 'Kevin Thomas',     createdDate: new Date(2026,1,2,17,36),  assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'High',   urgency: 'Low' },
  { id: 'PBM-608', subject: 'Laptop not working for 2 days after OS update',           requester: 'Sameer Ambalkar',  createdDate: new Date(2026,0,16,12,47), assignee: { name: 'Praveen Kumar',    initials: 'PK', color: '#3D8BD0' }, status: 'In Progress',priority: 'Medium', urgency: 'High' },
  { id: 'PBM-607', subject: 'Hard disk failure detected on finance workstation',       requester: 'Vasu Hirpara',     createdDate: new Date(2026,0,8,17,32),  assignee: { name: 'vaibhav prajapati',initials: 'VA', color: '#A78BFA' }, status: 'Resolved',   priority: 'High',   urgency: 'Low' },
  { id: 'PBM-601', subject: 'Video conferencing audio cutting out during meetings',    requester: 'Paul Kent',        createdDate: new Date(2025,10,19,16,21),assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-600', subject: 'Shared drive permissions not applying after migration',   requester: 'James Morrison',   createdDate: new Date(2025,10,19,16,12),assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Open',       priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-599', subject: 'Server crash on prod',    requester: 'Alex Turner',      createdDate: new Date(2025,10,10,9,15), assignee: { name: 'Rahul Shukla',     initials: 'RS', color: '#6366F1' }, status: 'In Progress',priority: 'Urgent', urgency: 'High' },
  { id: 'PBM-598', subject: 'Database performance',    requester: 'Nina Patel',       createdDate: new Date(2025,9,28,14,0),  assignee: { name: 'Keetion Dale',     initials: 'KD', color: '#10B981' }, status: 'Pending',    priority: 'High',   urgency: 'Medium' },
  { id: 'PBM-597', subject: 'Memory leak in app',      requester: 'Carlos Rivera',    createdDate: new Date(2025,9,15,11,30), assignee: { name: 'Shreyak Dalal',    initials: 'SD', color: '#EF4444' }, status: 'Resolved',   priority: 'Medium', urgency: 'Low' },
  { id: 'PBM-596', subject: 'VPN connectivity issue',  requester: 'Priya Mehta',      createdDate: new Date(2025,8,5,8,45),   assignee: { name: 'Amou Desai',       initials: 'AD', color: '#F97316' }, status: 'Closed',     priority: 'Low',    urgency: 'Low' },
];

export function ProblemListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [problems] = useState<Problem[]>(mockProblems);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Problem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openProblems, setOpenProblems] = useState<Problem[]>([]);
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenProblem = (problem: Problem) => {
    openInStack('problem', problem.id, problem.subject, problem);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenProblem({ ...mockProblems[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockProblems.length], id: rel.ticketId, subject: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenProblems([]); setActiveProblemId(null); };

  const handleCloseTab = (problemId: string) => {
    const updated = openProblems.filter(p => p.id !== problemId);
    setOpenProblems(updated);
    if (activeProblemId === problemId) {
      setActiveProblemId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (problemId: string) => setActiveProblemId(problemId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(problems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id));
      setSelectedProblems(ids);
    } else {
      setSelectedProblems(new Set());
    }
  };

  const handleSelectProblem = (problemId: string, checked: boolean) => {
    const next = new Set(selectedProblems);
    checked ? next.add(problemId) : next.delete(problemId);
    setSelectedProblems(next);
  };

  const handleSort = (column: keyof Problem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = problems;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = problems.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.subject.toLowerCase().includes(q) ||
      p.requester.toLowerCase().includes(q) ||
      p.assignee.name.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.priority.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];
      if (sortColumn === 'assignee') { aVal = a.assignee.name; bVal = b.assignee.name; }
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selectedProblems.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="problem" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedProblems.size} />
        <ProblemToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ProblemTable
              problems={paginated}
              selectedProblems={selectedProblems}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelectProblem={handleSelectProblem}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onProblemClick={handleOpenProblem}
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
        <TicketGroupSuggestions panelOnly />
      </div>
      <ProblemDrawer
        openProblems={openProblems}
        activeProblemId={activeProblemId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
