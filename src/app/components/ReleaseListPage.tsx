import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReleaseToolbar } from './ReleaseToolbar';
import { ReleaseTable } from './ReleaseTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { ReleaseDrawer } from './ReleaseDrawer';

export interface Release {
  id: string;
  subject: string;
  requester: string;
  createdDate: Date;
  assignee: { name: string; initials: string; color: string };
  status:
    | 'Planning: In Progress'
    | 'Submitted: Requested'
    | 'Planning: Cancelled'
    | 'Review: Failed'
    | 'Approval: Pending'
    | 'Deployment: In Progress'
    | 'Build: In Progress'
    | 'Testing: In Progress'
    | 'Completed: Closed';
  priority: 'P1' | 'P2' | 'High' | 'Medium';
  releaseType: 'Minor' | 'Major' | 'Standard' | 'Significant' | null;
  releaseRisk: 'Low' | 'Medium' | 'High' | null;
}

const UN = { name: 'Unassigned', initials: 'UN', color: '#9CA3AF' };

/* ── Planned go-live window ──────────────────────────────────────────────────
   One deterministic schedule per release, shared by the listing's calendar, rail,
   tooltip and Gantt. Unlike a change (an evening window), a release RUNS: build,
   staged deploy, verify — days to weeks. Every release is planned into the
   May–July 2026 release train, June heaviest, so the Gantt shows a realistic
   quarter of overlapping rollouts rather than two years of archaeology. */
export const releaseScheduleOf = (r: Release): { start: Date; end: Date } => {
  let i = mockReleases.findIndex((x) => x.id === r.id);
  if (i < 0) i = r.id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 97, 7);
  const start = new Date(2026, [5, 5, 4, 5, 6][i % 5], 1 + ((i * 7) % 27));
  start.setHours([9, 11, 14, 17, 19, 21][i % 6], (i % 4) * 15, 0, 0);
  const q = i % 10;
  const durH =
    q === 0 ? 8 + (i % 10)          // the odd same-day hotfix window
    : q < 4 ? 24 * 2 + (i % 24)     // a 2–3 day deploy-and-verify window
    : q < 7 ? 24 * 5 + (i % 48)     // a 5–7 day staged rollout
    : q < 9 ? 24 * 10 + (i % 96)    // a 1.5–2 week phased program
    : 24 * 21 + (i % 48);           // a three-week ramp, ring by ring
  return { start, end: new Date(start.getTime() + durH * 3600e3) };
};

/* What the go-live window MEANS for users — themed to what the release touches
   and written for a PHASED, multi-day process (waves, rings, cohorts), matching
   the longer windows above. Shared by the calendar tooltip and the rail. */
export const releaseImpactOf = (r: Release): string => {
  const s = r.subject.toLowerCase();
  if (/kubernetes|cluster/.test(s))
    return 'The cluster upgrades in waves over several days — control plane first, then node pools one by one, so pods reschedule with brief restarts while the API stays up. Capacity runs one node short per wave, and autoscaling stays frozen until the final pool completes.';
  if (/hotfix/.test(s))
    return 'A same-day window: the fix ships dark behind a flag, is verified against the reported case in the morning, then ramps to all tenants through the afternoon. A targeted service restart (~2 min) applies it; rollback is a flag flip, not a redeploy.';
  if (/mobile|app release/.test(s))
    return 'The build ramps through the app stores across the window — 10% on day one, 50% mid-week, 100% at close — halting automatically if crash rates rise. The API serves both app versions throughout, so users update at their own pace with no forced upgrade.';
  if (/security|patch deployment/.test(s))
    return 'The fleet patches in nightly batches across the window; each batch reboots behind failover, verifies, and returns to the pool before the next begins. Users see reduced single-node capacity overnight and no daytime interruptions.';
  if (/sso|identity|sign-on|entra/.test(s))
    return 'Sign-in switches to the new provider in cohorts across the window; each cohort re-authenticates once and existing sessions stay valid until natural expiry. The legacy provider stays on as fallback until the final cohort completes.';
  if (/payment|gateway/.test(s))
    return 'Transactions migrate to the new gateway in traffic slices across the window, with dual-running reconciliation at every step. A slice rolls back independently if decline rates rise; settlement reports may arrive split across both processors mid-window.';
  if (/esg|reporting|analytics|warehouse|etl|data/.test(s))
    return 'Pipelines cut over stage by stage across the window; scheduled reports queue at each step and run once that stage is live. Dashboards may show partial data for up to a day mid-window while historical loads backfill against the new schema.';
  if (/observability|telemetry|monitoring|logging/.test(s))
    return 'Agents roll out fleet-wide in daily waves; hosts report to both stacks during their wave, so dashboards stay continuous. Alert routing switches per service as its wave verifies — expect duplicate notifications for a short overlap.';
  if (/infrastructure|server/.test(s))
    return 'Workloads move to the upgraded infrastructure in planned batches over the window, each batch a sub-minute failover with automatic failback verification. Batch processing pauses during its own slot only; the wider service keeps running throughout.';
  if (/upgrade|version|platform/.test(s))
    return 'The platform upgrades ring by ring across the window — internal users first, then customer cohorts — so issues surface small. Each ring sees one forced re-login at its switch, and background jobs pause briefly per ring at the version boundary.';
  if (/deployment|rollout|module|pipeline|api|framework/.test(s))
    return 'Blue-green waves across the window: each service group flips traffic sub-second with an instant rollback path, soak-tests for a day, then the next group follows. API consumers see no contract changes at any wave.';
  return 'Low user impact expected across the window; the rollout advances in verified stages with an agreed hold point each day. The service desk gets a stage-by-stage notice, and the release team reviews health checks before each stage proceeds.';
};

/* ── Rollout window + planned downtime ──────────────────────────────────────
   Deterministic sub-windows INSIDE the go-live schedule: the Planned Rollout is
   the middle stretch of the window, and roughly four releases in five carry a
   short planned DOWNTIME inside that rollout (the cutover moment) — blue-green
   style releases have none. Shared by the Planning tab and the Gantt's
   segmented bars, so detail page and timeline always agree. */
export const releaseRolloutOf = (r: Release): { start: Date; end: Date } => {
  let i = mockReleases.findIndex((x) => x.id === r.id);
  if (i < 0) i = r.id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 97, 7);
  const { start, end } = releaseScheduleOf(r);
  const span = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() + span * (0.15 + (i % 4) * 0.05)),
    end: new Date(start.getTime() + span * (0.6 + (i % 5) * 0.07)),
  };
};
/* The Planning tab's ROLLOUT PLAN paragraph — subject-themed like the impact
   statements, so the detail page and the Gantt segment tooltip tell one story. */
export const releaseRolloutPlanOf = (r: Release): string => {
  let i = mockReleases.findIndex((x) => x.id === r.id);
  if (i < 0) i = r.id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 97, 7);
  const first = ['a 5% canary ring', 'the IT pilot group', 'one region at a time', 'a 10% early cohort'][i % 4];
  const s2 = r.subject.toLowerCase();
  if (/gateway|api/.test(s2))
    return `Blue-green rollout: the new build runs in parallel and traffic shifts to ${first} first, then 25% and 100% as error rates hold steady. Routes flip back instantly if latency regresses.`;
  if (/database|warehouse|etl|storage|data/.test(s2))
    return `Staged migration: replicas upgrade first and ${first} validates against them before the primary cutover after the final sync. The old cluster stays warm as a read-only fallback until sign-off.`;
  if (/security|patch|hardening|compliance|firewall/.test(s2))
    return `Ringed deployment: ${first} takes the update first with a soak period between rings; monitoring gates each promotion and any blocking alert pauses the next ring automatically.`;
  if (/network|vpn|wifi|wireless/.test(s2))
    return `Site-by-site rollout during low-traffic windows, starting with ${first}. Rollback configuration is staged on every device so a failed site reverts in minutes without touching the rest.`;
  if (/portal|app|application|module|platform|upgrade/.test(s2))
    return `Feature-flagged rollout: the release ships dark, then enables for ${first} and widens to all users once health checks and session metrics stay green for the soak window.`;
  return `Wave-based rollout starting with ${first}; each wave soak-tests before the next proceeds, and the deployment pipeline halts automatically on failed health checks.`;
};

export const releaseDowntimeOf = (r: Release): { start: Date; end: Date; note: string } | null => {
  let i = mockReleases.findIndex((x) => x.id === r.id);
  if (i < 0) i = r.id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 97, 7);
  if (i % 5 === 4) return null;
  const { start, end } = releaseRolloutOf(r);
  const span = end.getTime() - start.getTime();
  const ds = start.getTime() + span * (0.35 + (i % 3) * 0.18);
  const de = Math.min(ds + (1 + (i % 4)) * 3600e3, end.getTime());
  const s2 = r.subject.toLowerCase();
  const note = /gateway|api/.test(s2)
    ? 'Traffic cutover — API responses pause while routes flip to the new gateway.'
    : /database|warehouse|etl|storage/.test(s2)
      ? 'Final data sync — writes are frozen while the last delta copies across.'
      : /portal|app|application|module/.test(s2)
        ? 'Switchover window — the application is briefly unavailable while versions swap.'
        : 'Service window — the system restarts onto the new build.';
  return { start: new Date(ds), end: new Date(de), note };
};

export const mockReleases: Release[] = [
  { id: 'REL-63', subject: 'Customer portal redesign rollout - wave 1',            requester: 'Ronak Patel',            createdDate: new Date(2026,5,4,10,12),   assignee: { name: 'Dilip Mehta',        initials: 'DM', color: '#6366F1' }, status: 'Build: In Progress',      priority: 'High',   releaseType: 'Major',       releaseRisk: 'Medium' },
  { id: 'REL-62', subject: 'Payment gateway v2 migration',                         requester: 'Sakshi Gupta',           createdDate: new Date(2026,5,2,15,40),   assignee: { name: 'Shiv Sharma',        initials: 'SH', color: '#10B981' }, status: 'Approval: Pending',       priority: 'P1',     releaseType: 'Major',       releaseRisk: 'Medium'   },
  { id: 'REL-61', subject: 'SSO provider migration to Entra ID',                   requester: 'Saahil Joshi',           createdDate: new Date(2026,4,28,11,25),  assignee: { name: 'Manasvi Shah',       initials: 'MS', color: '#F97316' }, status: 'Testing: In Progress',    priority: 'High',   releaseType: 'Significant', releaseRisk: 'High' },
  { id: 'REL-60', subject: 'Observability stack rollout (OpenTelemetry)',          requester: 'Pavan Mehta',            createdDate: new Date(2026,4,26,9,50),   assignee: { name: 'Vaibhav Prajapati',  initials: 'VP', color: '#A78BFA' }, status: 'Deployment: In Progress', priority: 'Medium', releaseType: 'Standard',    releaseRisk: 'Low'    },
  { id: 'REL-59', subject: 'Data warehouse ETL platform upgrade',                  requester: 'Sharad Patil',           createdDate: new Date(2026,4,22,14,5),   assignee: UN,                                                              status: 'Planning: In Progress',   priority: 'P2',     releaseType: 'Major',       releaseRisk: 'Medium' },
  { id: 'REL-58', subject: 'API rate-limit policy release for partner tier',       requester: 'Shailendra Verma',       createdDate: new Date(2026,4,20,17,30),  assignee: { name: 'Dilip Mehta',        initials: 'DM', color: '#6366F1' }, status: 'Review: Failed',          priority: 'P2',     releaseType: 'Minor',       releaseRisk: 'Low'    },
  { id: 'REL-57', subject: 'Monitoring agent fleet upgrade to v12',                requester: 'Ashutosh Kumar',         createdDate: new Date(2026,4,18,12,10),  assignee: { name: 'Mehmet Can Dut',     initials: 'MD', color: '#6366F1' }, status: 'Submitted: Requested',    priority: 'Medium', releaseType: 'Standard',    releaseRisk: 'Low'    },
  { id: 'REL-56', subject: 'ServiceOps platform patch upgrade to v8.7.4.22',              requester: 'Diksha Patel',          createdDate: new Date(2026,5,1,18,16),   assignee: { name: 'Dilip Mehta',        initials: 'DM', color: '#6366F1' }, status: 'Planning: In Progress',   priority: 'High',   releaseType: 'Minor',       releaseRisk: 'Medium'   },
  { id: 'REL-55', subject: 'Kubernetes cluster upgrade to v1.29',                         requester: 'Manasvi Shah',           createdDate: new Date(2026,4,29,17,4),   assignee: { name: 'Manasvi Shah',       initials: 'MS', color: '#F97316' }, status: 'Submitted: Requested',    priority: 'Medium', releaseType: 'Major',          releaseRisk: 'Low'   },
  { id: 'REL-53', subject: 'Production server infrastructure upgrade',                    requester: 'Pavan Mehta',            createdDate: new Date(2026,3,22,11,31),  assignee: { name: 'Pavan Mehta',        initials: 'PM', color: '#10B981' }, status: 'Planning: Cancelled',     priority: 'P1',     releaseType: 'Major',       releaseRisk: 'High'   },
  { id: 'REL-52', subject: 'Authentication service hotfix rollout',                       requester: 'Saahil Joshi',           createdDate: new Date(2026,1,2,16,6),    assignee: UN,                                                              status: 'Review: Failed',          priority: 'P2',     releaseType: 'Significant',          releaseRisk: 'Medium'   },
  { id: 'REL-43', subject: 'Mobile application release v3.2.1',                          requester: 'Sakshi Gupta',           createdDate: new Date(2025,10,25,19,24), assignee: UN,                                                              status: 'Review: Failed',          priority: 'P2',     releaseType: 'Standard',          releaseRisk: 'Low'   },
  { id: 'REL-42', subject: 'Server security patch deployment - Oct 2025',                 requester: 'Ashutosh Kumar',         createdDate: new Date(2025,9,15,12,44),  assignee: UN,                                                              status: 'Approval: Pending',       priority: 'P1',     releaseType: 'Major',       releaseRisk: 'Low'   },
  { id: 'REL-40', subject: 'ESG module latest version deployment',                        requester: 'Shailendra Verma',       createdDate: new Date(2025,9,12,22,44),  assignee: { name: 'Vaibhav Prajapati', initials: 'VP', color: '#A78BFA' }, status: 'Deployment: In Progress', priority: 'P2',     releaseType: 'Minor',       releaseRisk: 'Medium'   },
  { id: 'REL-39', subject: 'ESG reporting engine version upgrade',                        requester: 'Sharad Patil',           createdDate: new Date(2025,9,12,22,40),  assignee: UN,                                                              status: 'Approval: Pending',       priority: 'P2',     releaseType: 'Standard',    releaseRisk: 'Low'   },
  { id: 'REL-37', subject: 'Critical patch release for application servers - Sep 2025',   requester: 'Rahul Dev',              createdDate: new Date(2025,8,30,16,4),   assignee: { name: 'Hemal Joshi',        initials: 'HJ', color: '#84CC16' }, status: 'Build: In Progress',      priority: 'P1',     releaseType: 'Major',       releaseRisk: 'Low'   },
  { id: 'REL-36', subject: 'API gateway rate limiting configuration update',              requester: 'Saahil Joshi',           createdDate: new Date(2025,8,1,14,12),   assignee: { name: 'Tabrez Khan',        initials: 'TK', color: '#64748B' }, status: 'Approval: Pending',       priority: 'P2',     releaseType: 'Significant',          releaseRisk: 'High'   },
  { id: 'REL-35', subject: 'Frontend dashboard performance optimization release',         requester: 'Saahil Joshi',           createdDate: new Date(2025,8,1,14,12),   assignee: { name: 'Hemal Joshi',        initials: 'HJ', color: '#84CC16' }, status: 'Planning: In Progress',   priority: 'P2',     releaseType: 'Standard',          releaseRisk: 'Low'   },
  { id: 'REL-33', subject: 'QA-validated regression fix release - Q3 2025',               requester: 'Sanat Patel',            createdDate: new Date(2025,7,6,17,8),    assignee: { name: 'Hetal Mori',         initials: 'HM', color: '#EC4899' }, status: 'Testing: In Progress',    priority: 'P2',     releaseType: 'Minor',          releaseRisk: 'Low'   },
  { id: 'REL-32', subject: 'CI/CD pipeline integration release build 123',                requester: 'Dewmi Ranathunga',       createdDate: new Date(2025,6,9,11,22),   assignee: { name: 'Jerry Varghese',     initials: 'JV', color: '#14B8A6' }, status: 'Planning: In Progress',   priority: 'P2',     releaseType: 'Minor',       releaseRisk: 'Medium'   },
  { id: 'REL-31', subject: 'Motadata ServiceOps New Release 1',                           requester: 'Hetal Mori',             createdDate: new Date(2025,2,11,18,13),  assignee: { name: 'Akshay Patel',       initials: 'AP', color: '#3D8BD0' }, status: 'Approval: Pending',       priority: 'P2',     releaseType: 'Major',          releaseRisk: 'Low'   },
  { id: 'REL-30', subject: 'Web portal minor update and bug fixes',                       requester: 'Sakshi Joshi',           createdDate: new Date(2025,0,23,15,5),   assignee: { name: 'Mahak Goyal',        initials: 'MG', color: '#F59E0B' }, status: 'Deployment: In Progress', priority: 'P2',     releaseType: 'Minor',       releaseRisk: 'Low'   },
  { id: 'REL-29', subject: 'Analytics service dependency update',                         requester: 'Simran Arora',           createdDate: new Date(2025,0,23,15,0),   assignee: UN,                                                              status: 'Approval: Pending',       priority: 'P2',     releaseType: 'Significant',          releaseRisk: 'Medium'   },
  { id: 'REL-27', subject: 'Security patch release for application servers - Nov 2024',   requester: 'Parita Singh',           createdDate: new Date(2024,10,22,14,22), assignee: { name: 'Abhishek Tiwari',    initials: 'AT', color: '#6366F1' }, status: 'Approval: Pending',       priority: 'High',   releaseType: 'Standard',    releaseRisk: 'High'},
  { id: 'REL-25', subject: 'Hardware refresh for datacenter rack A',                      requester: 'Akshay Sharma',          createdDate: new Date(2024,10,5,17,27),  assignee: UN,                                                              status: 'Planning: In Progress',   priority: 'P2',     releaseType: 'Minor',          releaseRisk: 'Low'   },
  { id: 'REL-24', subject: 'Application release update - Q4 2024',                        requester: 'Akshay Sharma',          createdDate: new Date(2024,10,5,16,23),  assignee: UN,                                                              status: 'Submitted: Requested',    priority: 'P2',     releaseType: 'Significant', releaseRisk: 'Medium'   },
  { id: 'REL-23', subject: 'Network configuration release for new office branch',         requester: 'Urja Patel',             createdDate: new Date(2024,10,5,17,21),  assignee: UN,                                                              status: 'Submitted: Requested',    priority: 'P2',     releaseType: 'Standard',    releaseRisk: 'Low'   },
  { id: 'REL-22', subject: 'Smoke test release for staging pipeline validation',          requester: 'Demo User',              createdDate: new Date(2024,9,23,15,3),   assignee: UN,                                                              status: 'Submitted: Requested',    priority: 'P2',     releaseType: 'Standard',    releaseRisk: 'Low'   },
  { id: 'REL-21', subject: 'Load testing framework upgrade to k6',                        requester: 'Nandini Patel',          createdDate: new Date(2024,9,10,10,30),  assignee: UN,                                                              status: 'Planning: In Progress',   priority: 'P2',     releaseType: 'Minor',       releaseRisk: 'Medium'   },
  { id: 'REL-20', subject: 'Database backup and recovery validation release',             requester: 'Jay Vegda',              createdDate: new Date(2024,9,1,9,15),    assignee: { name: 'Marco Logan',        initials: 'ML', color: '#64748B' }, status: 'Completed: Closed',       priority: 'P2',     releaseType: 'Standard',    releaseRisk: 'Low'   },
];

export function ReleaseListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [releases] = useState<Release[]>(mockReleases);
  const [selectedReleases, setSelectedReleases] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Release | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openReleases, setOpenReleases] = useState<Release[]>([]);
  const [activeReleaseId, setActiveReleaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenRelease = (release: Release) => {
    openInStack('release', release.id, release.subject, release);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenRelease({ ...mockReleases[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockReleases.length], id: rel.ticketId, subject: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenReleases([]); setActiveReleaseId(null); };

  const handleCloseTab = (releaseId: string) => {
    const updated = openReleases.filter(r => r.id !== releaseId);
    setOpenReleases(updated);
    if (activeReleaseId === releaseId) {
      setActiveReleaseId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (releaseId: string) => setActiveReleaseId(releaseId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(releases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => r.id));
      setSelectedReleases(ids);
    } else {
      setSelectedReleases(new Set());
    }
  };

  const handleSelectRelease = (releaseId: string, checked: boolean) => {
    const next = new Set(selectedReleases);
    checked ? next.add(releaseId) : next.delete(releaseId);
    setSelectedReleases(next);
  };

  const handleSort = (column: keyof Release) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = releases;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = releases.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.requester.toLowerCase().includes(q) ||
      r.assignee.name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.priority.toLowerCase().includes(q)
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
  const currentPageIds = paginated.map(r => r.id);
  const allCurrentSelected = currentPageIds.every(id => selectedReleases.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="release" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedReleases.size} />
        <ReleaseToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ReleaseTable
              releases={paginated}
              selectedReleases={selectedReleases}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelectRelease={handleSelectRelease}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onReleaseClick={handleOpenRelease}
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
      <ReleaseDrawer
        openReleases={openReleases}
        activeReleaseId={activeReleaseId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
