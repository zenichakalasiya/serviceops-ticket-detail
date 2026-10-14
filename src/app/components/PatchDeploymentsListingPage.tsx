/* ── Patch Deployments listing ───────────────────────────────────────────────
   The shared register chrome over the real `mockPatchDeployments`, replacing the module's
   hand-rolled table: the same columns it always showed, now with the filter builder, saved
   views, grouping, multi-sort and the two layouts the module needs.

   TWO layouts — **List + KPI** and **Dashboard**. Both answer what the DEPLOYMENT DETAIL page
   opens with (see PatchDeploymentDrawer's header: Status · Install Progress · Patches ·
   Install After · Expiry, and an Overview of Success / Failed / In Progress / Other), so the
   run list and a single run tell the same story.

   ⚠️ The dashboard's headline tile is **windows that closed without completing**. A run whose expiry
   has passed while it still reads "Ready to Deploy" or "In Progress" has failed silently —
   nothing errored, it simply never went out — and no single stored field says so. */
import { useMemo, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CreatePatchDeployment } from './CreatePatchDeployment';
import { CheckCircle, CircleDot, Layers, PlayCircle, Timer } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { PATCH_DEPLOY_FILTER_ATTRS, PATCH_DEPLOY_QUICK_FILTERS } from './patchFilterAttrs';
import {
  deployCreatedByOf, deployCreatedDateOf, deployEndpointCountOf, deployExpiringOf,
  deployOriginOf, deployPatchCountOf, deployTaskTypeOf, deployUpdatedByOf, deployUpdatedDateOf,
  deployWindowOf, deploymentToPatchShape, mockPatchDeployments, parseDeployDate,
  type PatchDeployment,
} from './PatchDeploymentsListPage';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const STATUS_COLOR: Record<string, string> = {
  Draft: '#94A3B8', 'Ready to Deploy': '#3D8BD0', 'In Progress': '#F59E0B',
  Completed: '#22C55E', Cancelled: '#64748B', Expired: '#DC2626',
};
const WINDOW_COLOR: Record<string, string> = {
  'Live now': '#F59E0B', Scheduled: '#3D8BD0', 'Window closed': '#DC2626', 'No window': '#94A3B8',
};

/* One run → one grid row. A function rather than a one-off map so a run created from this page
   (our Create Patch Deployment form) lands in the grid the same way the seeded ones do. */
const toRow = (d: PatchDeployment): Ticket => {
    const created = deployCreatedDateOf(d);
    return {
      id: d.id,
      subject: d.name,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: parseDeployDate(d.expiryDate) ?? created,
      createdBy: created,
      /* The run's own lifecycle, through the shared status cell. */
      status: d.status as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_policy: d.deploymentPolicy,
      x_installAfter: parseDeployDate(d.installAfter),
      x_expiry: parseDeployDate(d.expiryDate),
      x_taskType: deployTaskTypeOf(d),
      x_patchCount: deployPatchCountOf(d),
      x_endpointCount: deployEndpointCountOf(d),
      x_createdBy: deployCreatedByOf(d),
      x_updatedBy: deployUpdatedByOf(d),
      x_createdDate: created,
      x_lastUpdatedDate: deployUpdatedDateOf(d),
      x_window: deployWindowOf(d),
      /* Window closed AND never finished — see the x_lapsed note in patchFilterAttrs. */
      x_lapsed: deployWindowOf(d) === 'Window closed' && !['Completed', 'Cancelled'].includes(d.status) ? 'Yes' : 'No',
      /* The KPI strip's own two cuts — see deployExpiringOf / deployOriginOf. */
      x_expiring: deployExpiringOf(d),
      x_origin: deployOriginOf(d),
    } as unknown as Ticket;
};
const DEPLOYMENTS: { rows: Ticket[]; byId: Map<string, PatchDeployment> } = {
  rows: mockPatchDeployments.map(toRow),
  byId: new Map(mockPatchDeployments.map((d) => [d.id, d])),
};

const statusOf = (t: Ticket) => String(t.status ?? '');
const windowOf = (t: Ticket) => String((t as any).x_window ?? '');
/* A run that never finished AND whose window has closed. Neither field says this alone:
   the status still reads "In Progress", the expiry has simply gone by. */
const lapsed = (t: Ticket) => (t as any).x_lapsed === 'Yes';

/* The operator's shift, in the product's own terms: what went out, what is going out now,
   what is queued, what is about to run out of window, and what a technician pushed by hand
   rather than a schedule. Every card filters the list to exactly the rows it counted. */
const startsWithin24h = (t: Ticket) => {
  const start = (t as any).x_installAfter as Date | null;
  if (!start) return false;
  const left = start.getTime() - Date.now();
  return left > 0 && left <= 24 * 36e5;
};
const buildCards = (rows: Ticket[]): StatCard[] => {
  const done = rows.filter((t) => statusOf(t) === 'Completed');
  const running = rows.filter((t) => statusOf(t) === 'In Progress');
  const queued = rows.filter((t) => statusOf(t) === 'Ready to Deploy');
  const soon = queued.filter(startsWithin24h).length;
  const expiring = rows.filter((t) => (t as any).x_expiring === 'Yes');
  const manual = rows.filter((t) => (t as any).x_origin === 'Manual Remote Deploy');
  return [
    {
      label: 'Successful', value: done.length, sub: `of ${rows.length} runs`,
      valueColor: done.length ? '#15803D' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['Completed'] }],
    },
    {
      label: 'In progress', value: running.length, sub: 'running now',
      valueColor: running.length ? '#B45309' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['In Progress'] }],
    },
    {
      label: 'Scheduled', value: queued.length, sub: `${soon} start in next 24h`,
      valueColor: queued.length ? '#3D8BD0' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }],
    },
    {
      label: 'Expiring in 48h', value: expiring.length, sub: 'window closes soon',
      valueColor: expiring.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_expiring', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'Manual Remote Deploy', value: manual.length, sub: 'created by a technician',
      filter: [{ field: 'x_origin', condition: 'is', values: ['Manual Remote Deploy'] }],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;

  const statusSegs = ['Completed', 'In Progress', 'Ready to Deploy', 'Draft', 'Cancelled', 'Expired']
    .map((label) => ({
      label, value: by((t) => statusOf(t) === label), color: STATUS_COLOR[label],
      filter: [{ field: 'status', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const windowRows = ['Live now', 'Scheduled', 'Window closed', 'No window']
    .map((label) => ({
      label, value: by((t) => windowOf(t) === label), color: WINDOW_COLOR[label],
      filter: [{ field: 'x_window', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  const policyRows = [...new Set(rows.map((t) => String((t as any).x_policy)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_policy === label), color: '#3D8BD0',
      filter: [{ field: 'x_policy', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  /* The runs touching the most machines — where a failure costs the most. */
  const reach = [...rows]
    .sort((a, b) => Number((b as any).x_endpointCount ?? 0) - Number((a as any).x_endpointCount ?? 0))
    .map((t) => ({ label: t.id, value: Number((t as any).x_endpointCount ?? 0), color: '#8B5CF6' }));

  const done = by((t) => statusOf(t) === 'Completed');
  const missed = by(lapsed);
  return {
    tiles: [
      { icon: PlayCircle, color: '#F59E0B', label: 'In progress', value: by((t) => statusOf(t) === 'In Progress'), sub: 'rolling out now', filter: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
      { icon: CircleDot, color: '#3D8BD0', label: 'Ready to deploy', value: by((t) => statusOf(t) === 'Ready to Deploy'), sub: 'queued', filter: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }] },
      { icon: Timer, color: '#DC2626', label: 'Missed their window', value: missed, sub: 'expired without completing', filter: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
      { icon: CheckCircle, color: '#22C55E', label: 'Completed', value: done, sub: `of ${rows.length} runs`, filter: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
      { icon: Layers, color: '#8B5CF6', label: 'Patches deployed', value: rows.reduce((a, t) => a + Number((t as any).x_patchCount ?? 0), 0), sub: 'summed across runs' },
    ],
    sections: [
      { kind: 'donut', title: 'By status', sub: 'Where every run stands', centerLabel: 'Runs', segs: statusSegs },
      { kind: 'columns', title: 'By deployment window', sub: 'What is live, queued, or already closed', rows: windowRows },
      { kind: 'bars', title: 'By policy', sub: 'Which rollout rules are in use', rows: policyRows.slice(0, 6), allRows: policyRows, panelSubject: 'deployments', panelColumnLabel: 'Policy', panelCountLabel: 'Runs' },
      { kind: 'bars', title: 'Widest rollouts', sub: 'Runs targeting the most endpoints', rows: reach.slice(0, 6), allRows: reach, panelSubject: 'deployments', panelColumnLabel: 'Deployment', panelCountLabel: 'Endpoints' },
      /* Drafts are excluded from the denominator — a run nobody has scheduled yet has not
         failed to complete, and counting it would make the rate read worse than it is. */
      {
        kind: 'gauge', title: 'Completion rate', sub: 'Runs that finished, of those that were meant to',
        pct: Math.round((done / Math.max(1, rows.length - by((t) => statusOf(t) === 'Draft'))) * 100),
        caption: `${done} of ${rows.length - by((t) => statusOf(t) === 'Draft')} runs completed`,
        note: missed ? `${missed} missed their window without completing` : undefined,
      },
    ],
  };
};

export function PatchDeploymentsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* Create opens THIS project's form (CreatePatchDeployment — Patch / OS Upgrade categories) in
     place of the grid; a run made there is prepended to the list. */
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<PatchDeployment[]>([]);
  const rows = useMemo(() => [...created.map(toRow), ...DEPLOYMENTS.rows], [created]);
  const recordOf = (id: string) => {
    const dep = created.find((d) => d.id === id) ?? DEPLOYMENTS.byId.get(id);
    return dep ? deploymentToPatchShape(dep) : undefined;
  };
  if (creating) {
    return (
      <div className="flex h-screen bg-[#f9fafb]">
        <Sidebar activePage="patch-deployments" onNavigate={onNavigate} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header selectedCount={0} />
          <CreatePatchDeployment
            onCancel={() => setCreating(false)}
            onCreate={(d) => { setCreated((p) => [d, ...p]); setCreating(false); }}
          />
        </div>
      </div>
    );
  }
  return (
    <AssetRegisterPage
      activePage="patch-deployments"
      stackModule="patch-deployments"
      viewsStore="patchdeploy"
      noun="deployment"
      moduleCols="patch-deployment"
      defaultViewName="All Deployments"
      footerNoun="deployments"
      rows={rows}
      recordOf={recordOf}
      filterAttrs={PATCH_DEPLOY_FILTER_ATTRS}
      quickFilters={PATCH_DEPLOY_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_policy', 'x_createdBy', 'x_taskType']}
      /* Same placement as the Patches page: the one control that MAKES something sits on the
         title line, not in the tool rail that narrows the list. */
      primaryAction={{ label: 'Create', onClick: () => setCreating(true) }}
      primaryActionInTitle
      /* A run's status is its own lifecycle — the system moves it from Ready to Deploy to
         In Progress to Completed as the rollout actually happens. Nobody picks it from a
         dropdown, so the cell is read-only here (dot + word, no picker). */
      lockedCells={['status']}
      moreActions={[]}
      onNavigate={onNavigate}
    />
  );
}
