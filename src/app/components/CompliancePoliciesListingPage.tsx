/* ── Compliance Policies listing ─────────────────────────────────────────────
   The shared register chrome (saved views, filter builder, quick filters, multi-sort,
   grouping, pagination, List + KPI) over the live policy store.

   A policy is ONE benchmark bound to endpoints and a schedule — the only compliance record
   that RUNS. So the row answers: what it assesses, against how many machines, how the last
   scan went, when it runs next, and whether it is on. Row actions: Run Now · Schedule · Edit
   · ⋮ (Clone, Delete); the Enable switch is its own column. Create opens the full-screen
   form; a row click opens the policy's detail page in the shared drawer. */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { POLICY_FILTER_ATTRS, POLICY_QUICK_FILTERS } from './complianceFilterAttrs';
import {
  benchmarkOf, getPolicy, nextRun, openPolicyEditor, policyStore, resolvedEndpoints, scheduleLabel, scoreOf, statusOf, usePolicies,
} from './compliancePolicyData';
import type { CompliancePolicy } from './compliancePolicyData';
import { PolicyScheduleDrawer } from './CompliancePolicyEditor';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const toRow = (p: CompliancePolicy): Ticket => {
  const b = benchmarkOf(p.benchmarkId);
  const created = new Date(p.createdAt);
  return {
    id: p.id,
    subject: p.name,
    requester: '',
    assignedTo: { name: '', initials: '' },
    dueBy: created,
    createdBy: created,
    status: statusOf(p) as Ticket['status'],
    priority: 'Medium' as Ticket['priority'],
    x_cpPolicy: true,
    x_benchmark: b?.name ?? '—',
    x_type: b?.type ?? '',
    x_endpoints: resolvedEndpoints(p).length,
    x_cpScore: scoreOf(p.lastScan),
    x_nonCompliant: p.lastScan?.nonCompliant ?? 0,
    x_lastExecution: p.lastScan ? new Date(p.lastScan.at) : null,
    x_nextExecution: p.enabled ? nextRun(p.schedule) : null,
    x_schedule: scheduleLabel(p.schedule),
    x_scheduled: p.schedule.frequency === 'none' ? 'Not scheduled' : 'Scheduled',
    x_enabled: p.enabled ? 'Enabled' : 'Disabled',
    x_scanning: !!p.scanning,
    x_tags: p.tags.join(', '),
    x_createdBy: p.createdBy,
  } as unknown as Ticket;
};

const num = (t: Ticket, k: string) => Number((t as any)[k] ?? 0);

/* What a compliance lead checks first: how much is on, how clean the estate is, how many
   machines are failing, and what has never been looked at. Each card filters the list to
   exactly the rows it counted. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const on = rows.filter((t) => (t as any).x_enabled === 'Enabled');
  const scored = rows.filter((t) => (t as any).x_cpScore !== null && (t as any).x_cpScore !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((a, t) => a + num(t, 'x_cpScore'), 0) / scored.length) : null;
  const failingPolicies = rows.filter((t) => t.status === ('Non-Compliant' as Ticket['status']));
  const failingEndpoints = rows.reduce((a, t) => a + num(t, 'x_nonCompliant'), 0);
  const never = rows.filter((t) => t.status === ('Not Scanned' as Ticket['status']));
  return [
    {
      label: 'Active Policies', value: on.length, sub: `${rows.length - on.length} disabled`,
      valueColor: on.length ? '#15803D' : undefined,
      filter: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }],
    },
    {
      label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: `across ${scored.length} scanned polic${scored.length === 1 ? 'y' : 'ies'}`,
      valueColor: avg === null ? undefined : avg >= 90 ? '#15803D' : avg >= 70 ? '#B45309' : '#DC2626',
    },
    {
      label: 'Non-Compliant Endpoints', value: failingEndpoints, sub: `in ${failingPolicies.length} polic${failingPolicies.length === 1 ? 'y' : 'ies'}`,
      valueColor: failingEndpoints ? '#DC2626' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['Non-Compliant'] }],
    },
    {
      label: 'Never Scanned', value: never.length, sub: 'policies waiting for a first scan',
      valueColor: never.length ? '#64748B' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['Not Scanned'] }],
    },
  ];
};

export function CompliancePoliciesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const rows = useMemo(() => policies.map(toRow), [policies]);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-policies"
        stackModule="compliance-policies"
        viewsStore="compliance"
        noun="policy"
        moduleCols="compliance-policy"
        defaultViewName="All Compliance Policies"
        footerNoun="policies"
        rows={rows}
        recordOf={(id) => getPolicy(id)}
        filterAttrs={POLICY_FILTER_ATTRS}
        quickFilters={POLICY_QUICK_FILTERS}
        layouts={['list-kpi', 'list']}
        buildCards={buildCards}
        searchFields={['x_benchmark', 'x_tags', 'x_createdBy']}
        /* Status is the result of the last scan — the system sets it, nobody picks it. */
        lockedCells={['status']}
        moreActions={[]}
        primaryAction={{ label: 'Create Policy', onClick: () => openPolicyEditor({ mode: 'create' }) }}
        primaryActionInTitle
        onUpdateRow={(id, patch) => {
          const en = (patch as any).x_enabled;
          if (en) {
            policyStore.toggle(id, en === 'Enabled');
            toast.success(`“${getPolicy(id)?.name}” ${en === 'Enabled' ? 'enabled' : 'disabled'}`);
          }
        }}
        onRowAction={(t, action) => {
          const p = getPolicy(t.id);
          if (!p) return;
          if (action === 'edit') openPolicyEditor({ mode: 'edit', id: p.id });
          else if (action === 'duplicate') openPolicyEditor({ mode: 'clone', id: p.id });
          else if (action === 'schedule') setScheduleFor(p.id);
          else if (action === 'run') {
            toast(`Scanning “${p.name}” — ${resolvedEndpoints(p).length} endpoints`);
            policyStore.run(p.id, (done) => toast.success(`“${done.name}” scanned — ${scoreOf(done.lastScan) ?? 0}% compliant`));
          } else if (action === 'delete') {
            policyStore.remove(p.id);
            toast.success(`“${p.name}” deleted`);
          }
        }}
        onNavigate={onNavigate}
      />
      {scheduleFor && <PolicyScheduleDrawer policyId={scheduleFor} onClose={() => setScheduleFor(null)} />}
    </>
  );
}
