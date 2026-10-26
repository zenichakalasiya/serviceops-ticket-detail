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
import { ShieldCheck } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { postureColor, postureOf, scoreColor } from './complianceVizData';
import { POLICY_FILTER_ATTRS, POLICY_QUICK_FILTERS, takeComplianceDrill } from './complianceFilterAttrs';
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
  const score = scoreOf(p.lastScan);
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
    x_osVersion: b?.osVersion ?? '',
    x_profile: b?.profile ?? '',
    x_endpoints: resolvedEndpoints(p).length,
    x_cpScore: score,
    x_posture: postureOf(score) ?? 'Not assessed',
    x_nonCompliant: p.lastScan?.nonCompliant ?? 0,
    x_failedChecks: p.lastScan?.failed ?? 0,
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

/* ── Policy tile — the Tiles layout (moved here from the old Compliance Visualization page's
   Policies tab, 23 Oct 2026). Name and benchmark on top, the score and the endpoint count as
   the two numbers, the last scan's failed checks at the foot. ───────────────────────────── */
function PolicyTile({ row, onOpen }: { row: Ticket; onOpen: () => void }) {
  const r = row as any;
  const score: number | null = r.x_cpScore;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition-all hover:border-[#C9D4E0] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3D8BD0]"
    >
      <header className="flex items-start gap-2.5 px-4 pb-3 pt-3.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0]/10 text-[#3D8BD0]"><ShieldCheck size={15} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{row.id}</span>
            <h3 className="truncate text-[14px] font-semibold text-[#1E293B]" title={row.subject}>{row.subject}</h3>
          </div>
          <div className="mt-1 truncate text-[12px] text-[#64748B]" title={r.x_benchmark}>{r.x_benchmark}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {r.x_type && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#475569]">{r.x_type}</span>}
            {r.x_osVersion && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#475569]">{r.x_osVersion}</span>}
            {r.x_profile && <span className={`rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${r.x_profile === 'L1' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F3EEFF] text-[#7C3AED]'}`}>{r.x_profile}</span>}
            {r.x_enabled === 'Disabled' && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#94A3B8]">Disabled</span>}
          </div>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1.5 text-[12px] text-[#4A5568]" title="Posture on the last scan">
          <span className="size-2 rounded-full" style={{ backgroundColor: postureColor(r.x_posture) }} />{r.x_posture}
        </span>
      </header>

      <div className="grid grid-cols-2 border-t border-[#EEF2F6]">
        <div className="px-4 py-3">
          <div className="text-[12px] text-[#64748B]">Compliance</div>
          <div className="mt-0.5 text-[24px] font-semibold leading-8 tabular-nums" style={{ color: score === null ? '#94A3B8' : scoreColor(score) }}>
            {score === null ? '—' : score}{score !== null && <span className="ml-0.5 text-[13px] font-medium">%</span>}
          </div>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#EEF2F6]">
            <span className="block h-full rounded-full" style={{ width: `${score ?? 0}%`, backgroundColor: scoreColor(score) }} />
          </span>
        </div>
        <div className="border-l border-[#EEF2F6] px-4 py-3">
          <div className="text-[12px] text-[#64748B]">Endpoints</div>
          <div className="mt-0.5 text-[24px] font-semibold leading-8 tabular-nums text-[#1E293B]">{r.x_endpoints}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">{r.x_nonCompliant} non-compliant</div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between bg-[#F7F9FC] px-4 py-2.5">
        <span className="text-[12px] text-[#64748B]">Failed checks on the last scan</span>
        <span className={`text-[18px] font-semibold tabular-nums ${score !== null && r.x_failedChecks ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>{score === null ? '—' : r.x_failedChecks}</span>
      </footer>
    </article>
  );
}

export function CompliancePoliciesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const rows = useMemo(() => policies.map(toRow), [policies]);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  /* A Dashboard click lands here already filtered (read once). */
  const [drill] = useState(() => takeComplianceDrill('compliance-policies'));

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-policies"
        stackModule="compliance-policies"
        initialFilters={drill}
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
        /* Tiles sits beside List and KPI in the layout switch; List & KPI stays the default. */
        renderTiles={(tiles, openRow) => (
          tiles.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3 px-6 py-3">
              {tiles.map((t) => <PolicyTile key={t.id} row={t} onOpen={() => openRow(t)} />)}
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-[13px] text-[#9CA3AF]">No policy matches this search and filter.</div>
          )
        )}
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
