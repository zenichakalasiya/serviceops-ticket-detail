import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChangeToolbar } from './ChangeToolbar';
import { ChangeTable } from './ChangeTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { ChangeDrawer } from './ChangeDrawer';

export interface Change {
  id: string;
  subject: string;
  requester: string;
  createdDate: Date;
  assignee: { name: string; initials: string; color: string };
  status:
    | 'Submitted: Requested'
    | 'Approval: Pending'
    | 'Planning: In Progress'
    | 'Planning: Pre Approval'
    | 'Implementation: In Progress'
    | 'Submitted: Rejected'
    | 'Completed: Closed';
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'Low' | 'Medium' | 'High' | 'Urgent';
  changeType: 'Standard' | 'Normal' | 'Emergency' | null;
  changeRisk: 'Low' | 'Medium' | 'High' | null;
}

/* ── Planned change window ───────────────────────────────────────────────────
   One deterministic schedule per change, shared by the detail page's Planning tab
   ("Change Schedule") and the Change listing's calendar, so the two can never
   disagree. Most changes are short evening windows; some run into the next
   morning; a few are multi-day rollouts, and one is a week-long freeze — the
   realistic Outlook-style mix a change calendar has to render. */
export const changeScheduleOf = (c: Change): { start: Date; end: Date } => {
  let i = mockChanges.findIndex((x) => x.id === c.id);
  if (i < 0) i = c.id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 97, 7);
  const start = new Date(c.createdDate);
  start.setDate(start.getDate() + (i % 6) + 1);
  start.setHours(i % 7 === 3 ? 9 + (i % 4) : 17 + (i % 3), (i % 4) * 15, 0, 0);
  /* Every third change lands in one release window — the freeze-weekend pile-up that
     makes June 2026 the busiest month and exercises the calendar's "+N more" overflow. */
  if (i % 3 === 0) {
    start.setFullYear(2026, 5, 15);
    start.setHours([9, 11, 14, 16, 18, 19, 20, 21, 22][Math.floor(i / 3) % 9], (i % 4) * 15, 0, 0);
  }
  const p = i % 10;
  const durH =
    p < 5 ? 2 + (i % 3)        // a same-evening window, 2–4 h
    : p < 8 ? 26 + (i % 14)    // an overnight-into-next-day window
    : p === 8 ? 72 + (i % 9)   // a multi-day rollout
    : 148;                     // the week-long freeze
  return { start, end: new Date(start.getTime() + durH * 3600e3) };
};

/* The schedule's impact statement — what this window MEANS for users. Themed to the
   subject so a firewall change talks about sessions and a patch run about reboots.
   Shared by the Planning tab's Impact field, the calendar tooltip and the calendar
   rail, so all three always tell the same story. */
export const changeImpactOf = (c: Change): string => {
  const s = c.subject.toLowerCase();
  if (/firewall|waf|dmz/.test(s))
    return 'Active sessions through the affected rules drop briefly (~2 min) while the new set propagates across both firewall pairs. Site-to-site tunnels renegotiate automatically; partner-facing APIs may see a short burst of retries, and no data loss is expected at any point.';
  if (/patch|security patching|os /.test(s))
    return 'Rolling node reboots inside the window; services stay up behind failover with reduced single-node capacity. Batch jobs scheduled during the window are queued and resume automatically, and users may notice slightly slower responses while each node drains and rejoins the cluster.';
  if (/migrat|cutover|cluster/.test(s))
    return 'Short service freeze at cutover (up to 15 min) while the final delta sync completes; users may need to sign in again on the new platform. Mail in transit is queued by the upstream gateway and delivered after cutover, so nothing is lost — delivery is simply delayed for the freeze window.';
  if (/certificate|ssl|tls/.test(s))
    return 'A brief TLS blip (<1 min) as the new certificate loads across the load-balancer fleet; cached sessions may prompt one refresh. Legacy clients pinning the old intermediate chain will need the updated bundle, which has been pre-published to the endpoint management baseline.';
  if (/storage|san|capacity/.test(s))
    return 'No planned outage — the expansion is online; brief latency spikes possible while volumes rebalance across the new shelves. Thin-provisioned datastores will report changed capacity as the pool grows, and replication to the DR array pauses briefly at each rebalance checkpoint before resuming.';
  if (/schema|active directory/.test(s))
    return 'Directory writes pause briefly during the schema extension; sign-ins and reads continue unaffected throughout. Downstream provisioning jobs that write new attributes are held until replication converges on every domain controller, expected within 30 minutes of completion.';
  if (/decommission|retire|legacy/.test(s))
    return 'The retiring system goes read-only, then offline; historical data stays available from the archive share. Integrations still pointing at the old endpoints will begin failing after shutdown, so the final dependency sweep must be clear before the power-down step is approved.';
  if (/dns|network|switch|wireless|access point|vpn/.test(s))
    return 'Short connectivity blips (1–5 min) as devices re-home to the new configuration; remote users may need to reconnect once. Voice and video calls in progress during a blip may drop and need redialling; the rollout is sequenced site by site to keep the blast radius small.';
  if (/database|index|sql/.test(s))
    return 'Queries may run slower while online maintenance executes; no downtime and writes are never blocked. Reporting extracts that touch the affected tables are expected to run 20–30% longer during the window, and replication lag to read replicas may grow temporarily before catching up.';
  if (/backup|retention/.test(s))
    return 'No user-facing impact; backup jobs run longer on the first cycle while the new policy takes effect. Restore points created under the old retention scheme stay valid until natural expiry, and storage consumption steps down gradually as the shortened windows roll through.';
  if (/deploy|release|module|application|portal|policy/.test(s))
    return 'Blue-green switchover — a sub-second traffic flip, with an instant rollback path if error rates rise. In-flight transactions complete on the old version before it drains, background workers restart against the new build, and API consumers see no contract changes in this release.';
  return 'Low user impact expected; short interruptions possible inside the window, monitored end to end. The service desk has a heads-up notice prepared, monitoring thresholds are tightened for the duration, and the implementation team stays on the bridge until post-change checks pass.';
};

export const mockChanges: Change[] = [
  { id: 'CHG-993', subject: 'Firewall rule update for production DMZ',          requester: 'Sophie Laurent',   createdDate: new Date(2026,5,9,15,2),   assignee: { name: 'Unassigned',       initials: 'UN', color: '#D1D5DB' }, status: 'Submitted: Requested',       priority: 'P1',     changeType: 'Normal',        changeRisk: 'Low'  },
  { id: 'CHG-992', subject: 'Database server OS security patching',             requester: 'Sakshi Gupta',     createdDate: new Date(2026,4,27,18,56), assignee: { name: 'Mehmet Can Dut',   initials: 'MD', color: '#6366F1' }, status: 'Approval: Pending',          priority: 'Medium', changeType: 'Standard',        changeRisk: 'Medium'  },
  { id: 'CHG-991', subject: 'Email server migration to new cluster',            requester: 'Sakshi Joshi',     createdDate: new Date(2026,4,27,18,3),  assignee: { name: 'Shiv Sharma',      initials: 'SH', color: '#10B981' }, status: 'Approval: Pending',          priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'  },
  { id: 'CHG-990', subject: 'SSL certificate renewal for customer web portal',  requester: 'Ashish Dhamelia',  createdDate: new Date(2026,4,27,17,52), assignee: { name: 'Manuel Rodrigues', initials: 'MA', color: '#F97316' }, status: 'Approval: Pending',          priority: 'Medium', changeType: 'Emergency',        changeRisk: 'High'  },
  { id: 'CHG-989', subject: 'Core firewall policy change for branch VPN',       requester: 'Ashini Sharma',    createdDate: new Date(2026,4,21,10,28), assignee: { name: 'Pradeep Attri',    initials: 'PA', color: '#8B5CF6' }, status: 'Planning: In Progress',      priority: 'Medium', changeType: 'Standard',        changeRisk: 'Medium'  },
  { id: 'CHG-988', subject: 'Network switch firmware upgrade',                  requester: 'Vasu Hirpara',     createdDate: new Date(2026,4,15,13,11), assignee: { name: 'Vraj Chauhan',     initials: 'VC', color: '#EF4444' }, status: 'Approval: Pending',          priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'  },
  { id: 'CHG-987', subject: 'Active Directory schema extension',                requester: 'Pavan Mehta',      createdDate: new Date(2026,4,6,17,53),  assignee: { name: 'Darshan Dabgar',   initials: 'DD', color: '#EC4899' }, status: 'Approval: Pending',          priority: 'P1',     changeType: 'Standard',  changeRisk: 'Low'  },
  { id: 'CHG-986', subject: 'HR onboarding system integration update',          requester: 'Agasp Latayada',   createdDate: new Date(2026,3,28,15,30), assignee: { name: 'Jay Vegda',        initials: 'JV', color: '#14B8A6' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Standard',        changeRisk: 'Medium'   },
  { id: 'CHG-985', subject: 'Load balancer reconfiguration for API gateway',    requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,32), assignee: { name: 'Isaac Muasya',     initials: 'IM', color: '#64748B' }, status: 'Planning: Pre Approval',     priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'   },
  { id: 'CHG-984', subject: 'Storage SAN capacity expansion',                   requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,32), assignee: { name: 'Mohammed Afsal',   initials: 'MA', color: '#84CC16' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Emergency',        changeRisk: 'Low'   },
  { id: 'CHG-983', subject: 'Backup retention policy update',                   requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,31), assignee: { name: 'Eric Muema',       initials: 'EM', color: '#A78BFA' }, status: 'Approval: Pending',          priority: 'Medium', changeType: 'Standard',        changeRisk: 'High'   },
  { id: 'CHG-982', subject: 'VPN gateway configuration change',                 requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,30), assignee: { name: 'Donald Ogonda',    initials: 'DO', color: '#F59E0B' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'   },
  { id: 'CHG-981', subject: 'DNS server consolidation',                         requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,30), assignee: { name: 'Ibrahim Sarikaya', initials: 'IS', color: '#3D8BD0' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'   },
  { id: 'CHG-980', subject: 'Antivirus platform migration',                     requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,27,12,30), assignee: { name: 'George Mwanda',    initials: 'GM', color: '#6366F1' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Standard',        changeRisk: 'Medium'   },
  { id: 'CHG-979', subject: 'Bulk laptop provisioning for new hires',           requester: 'Sophie Laurent',   createdDate: new Date(2026,3,22,9,2),   assignee: { name: 'Jay Vegda',        initials: 'JV', color: '#14B8A6' }, status: 'Submitted: Requested',       priority: 'Medium', changeType: 'Normal',        changeRisk: 'Low'   },
  { id: 'CHG-978', subject: 'Legacy CRM application decommission',              requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,16,11,18), assignee: { name: 'Utsab Upreti',     initials: 'UU', color: '#EF4444' }, status: 'Submitted: Rejected',        priority: 'High',   changeType: 'Emergency',        changeRisk: 'Low'  },
  { id: 'CHG-977', subject: 'Office 365 tenant security policy update',         requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,16,11,17), assignee: { name: 'Jeremy Collins',   initials: 'JC', color: '#F97316' }, status: 'Submitted: Requested',       priority: 'High',   changeType: 'Standard',        changeRisk: 'Medium'   },
  { id: 'CHG-976', subject: 'Production payment module deployment v2.3',        requester: 'Vaibhav Prajapati',createdDate: new Date(2026,3,16,11,16), assignee: { name: 'Sanket Ganhane',   initials: 'SG', color: '#8B5CF6' }, status: 'Approval: Pending',          priority: 'High',   changeType: 'Normal',        changeRisk: 'High'  },
  { id: 'CHG-975', subject: 'Application database index rebuild',               requester: 'Nandini Patel',    createdDate: new Date(2026,3,11,11,22), assignee: { name: 'Jay Vegda',        initials: 'JV', color: '#14B8A6' }, status: 'Submitted: Requested',       priority: 'High',   changeType: 'Normal',        changeRisk: 'Low'   },
  { id: 'CHG-974', subject: 'New monitoring agent rollout',                     requester: 'Jay Vegda',        createdDate: new Date(2026,3,11,11,18), assignee: { name: 'Marco Logan',      initials: 'ML', color: '#64748B' }, status: 'Submitted: Requested',       priority: 'High',   changeType: 'Standard',        changeRisk: 'Medium'  },
  { id: 'CHG-973', subject: 'Disaster recovery failover test',                  requester: 'Priya Mehta',      createdDate: new Date(2026,2,31,18,23), assignee: { name: 'Joseph Romero',    initials: 'JR', color: '#A78BFA' }, status: 'Implementation: In Progress',priority: 'High',   changeType: 'Standard',  changeRisk: 'Low'  },
  { id: 'CHG-972', subject: 'Wireless access point deployment - Floor 3',       requester: 'Kruna Shah',       createdDate: new Date(2026,2,25,14,12), assignee: { name: 'Rahul Shukla',     initials: 'RS', color: '#10B981' }, status: 'Planning: In Progress',      priority: 'Medium', changeType: 'Normal',    changeRisk: 'Medium'},
  { id: 'CHG-971', subject: 'Core router replacement in primary datacenter',    requester: 'Carlos Rivera',    createdDate: new Date(2026,2,18,9,45),  assignee: { name: 'Keetion Dale',     initials: 'KD', color: '#F59E0B' }, status: 'Approval: Pending',          priority: 'P1',     changeType: 'Emergency', changeRisk: 'Medium' },
  { id: 'CHG-970', subject: 'Server room cooling maintenance window',           requester: 'Nina Patel',       createdDate: new Date(2026,2,12,16,30), assignee: { name: 'Amou Desai',       initials: 'AD', color: '#EC4899' }, status: 'Planning: Pre Approval',     priority: 'Medium', changeType: 'Normal',    changeRisk: 'Medium'},
  { id: 'CHG-969', subject: 'Web application firewall rule tuning',             requester: 'Alex Turner',      createdDate: new Date(2026,2,5,10,15),  assignee: { name: 'Shreyak Dalal',    initials: 'SD', color: '#6366F1' }, status: 'Completed: Closed',          priority: 'Low',    changeType: 'Standard',  changeRisk: 'High'  },
];

export function ChangeListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [changes] = useState<Change[]>(mockChanges);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Change | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openChanges, setOpenChanges] = useState<Change[]>([]);
  const [activeChangeId, setActiveChangeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenChange = (change: Change) => {
    openInStack('change', change.id, change.subject, change);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenChange({ ...mockChanges[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockChanges.length], id: rel.ticketId, subject: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenChanges([]); setActiveChangeId(null); };

  const handleCloseTab = (changeId: string) => {
    const updated = openChanges.filter(c => c.id !== changeId);
    setOpenChanges(updated);
    if (activeChangeId === changeId) {
      setActiveChangeId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (changeId: string) => setActiveChangeId(changeId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(changes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => c.id));
      setSelectedChanges(ids);
    } else {
      setSelectedChanges(new Set());
    }
  };

  const handleSelectChange = (changeId: string, checked: boolean) => {
    const next = new Set(selectedChanges);
    checked ? next.add(changeId) : next.delete(changeId);
    setSelectedChanges(next);
  };

  const handleSort = (column: keyof Change) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = changes;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = changes.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.requester.toLowerCase().includes(q) ||
      c.assignee.name.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.priority.toLowerCase().includes(q)
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
  const currentPageIds = paginated.map(c => c.id);
  const allCurrentSelected = currentPageIds.every(id => selectedChanges.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="change" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedChanges.size} />
        <ChangeToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ChangeTable
              changes={paginated}
              selectedChanges={selectedChanges}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onChangeClick={handleOpenChange}
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
      <ChangeDrawer
        openChanges={openChanges}
        activeChangeId={activeChangeId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
