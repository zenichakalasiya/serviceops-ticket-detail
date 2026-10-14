/* ── Registry Deployments listing ────────────────────────────────────────────
   The shared register chrome over the real `mockRegistryDeployments`. Same columns the
   module always showed — including the real Total Installations count and the Configuration
   Type — now with the filter builder, saved views, grouping and multi-sort.

   TWO layouts — **List + KPI** and **Dashboard**, matching its Package and Patch siblings.
   ⚠️ Unlike those two, **Total Installations is REAL data on the record**, so "Endpoints
   configured" is a true sum rather than a derived figure — and a run that has applied to
   nothing yet carries `null`, which stays a dash rather than becoming a zero. */
import { useMemo } from 'react';
import { CheckCircle, CircleDot, Monitor, PlayCircle, Timer } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { REGISTRY_DEPLOY_FILTER_ATTRS, REGISTRY_DEPLOY_QUICK_FILTERS } from './packageFilterAttrs';
import {
  mockRegistryDeployments, parseRegDate, regCreatedDateOf, regExpiringOf, regUpdatedByOf,
  regUpdatedDateOf, regWindowOf, registryDeploymentToPatchShape, type RegistryDeployment,
} from './RegistryDeploymentsListPage';
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

const DEPLOYMENTS: { rows: Ticket[]; byId: Map<string, RegistryDeployment> } = (() => {
  const byId = new Map<string, RegistryDeployment>();
  const rows = mockRegistryDeployments.map((d) => {
    byId.set(d.id, d);
    const created = regCreatedDateOf(d);
    return {
      id: d.id,
      subject: d.name,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: parseRegDate(d.expiryDate) ?? created,
      createdBy: created,
      status: d.status as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_configType: d.configurationType,
      x_installAfter: parseRegDate(d.installAfter),
      x_expiry: parseRegDate(d.expiryDate),
      /* Real on the record — null means nothing has run yet, which the cell prints as a dash
         rather than a zero that would claim the configuration applied to no machine. */
      x_installations: d.totalInstallations,
      x_createdBy: d.createdBy,
      x_updatedBy: regUpdatedByOf(d),
      x_createdDate: created,
      x_lastUpdatedDate: regUpdatedDateOf(d),
      x_window: regWindowOf(d),
      x_lapsed: regWindowOf(d) === 'Window closed' && !['Completed', 'Cancelled'].includes(d.status) ? 'Yes' : 'No',
      /* The KPI strip's "Expiring in 48h" — see regExpiringOf. */
      x_expiring: regExpiringOf(d),
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const statusOf = (t: Ticket) => String(t.status ?? '');
const windowOf = (t: Ticket) => String((t as any).x_window ?? '');
const lapsed = (t: Ticket) => (t as any).x_lapsed === 'Yes';
const installsOf = (t: Ticket) => Number((t as any).x_installations ?? 0);

/* The operator's shift, in the product's own terms: what went out, what is going out now,
   what is queued, and what is about to run out of window. Every card filters the list to
   exactly the rows it counted. */
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
  return [
    {
      label: 'Successful', value: done.length, sub: `of ${rows.length} configurations`,
      valueColor: done.length ? '#15803D' : undefined,
      filter: [{ field: 'status', condition: 'is', values: ['Completed'] }],
    },
    {
      label: 'In progress', value: running.length, sub: 'applying now',
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

  /* A registry run has no policy; what it DOES is the cut worth charting instead. */
  const typeRows = ['Install', 'Uninstall']
    .map((label) => ({
      label, value: by((t) => (t as any).x_configType === label),
      color: label === 'Install' ? '#3D8BD0' : '#F59E0B',
      filter: [{ field: 'x_configType', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  const reach = [...rows]
    .filter((t) => installsOf(t) > 0)
    .sort((a, b) => installsOf(b) - installsOf(a))
    .map((t) => ({ label: t.id, value: installsOf(t), color: '#8B5CF6' }));

  const done = by((t) => statusOf(t) === 'Completed');
  const missed = by(lapsed);
  const scheduled = Math.max(1, rows.length - by((t) => statusOf(t) === 'Draft'));
  return {
    tiles: [
      { icon: PlayCircle, color: '#F59E0B', label: 'In progress', value: by((t) => statusOf(t) === 'In Progress'), sub: 'applying now', filter: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
      { icon: CircleDot, color: '#3D8BD0', label: 'Ready to deploy', value: by((t) => statusOf(t) === 'Ready to Deploy'), sub: 'queued', filter: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }] },
      { icon: Timer, color: '#DC2626', label: 'Missed their window', value: missed, sub: 'expired without completing', filter: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
      { icon: CheckCircle, color: '#22C55E', label: 'Completed', value: done, sub: `of ${rows.length} runs`, filter: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
      { icon: Monitor, color: '#8B5CF6', label: 'Endpoints configured', value: rows.reduce((a, t) => a + installsOf(t), 0), sub: 'summed across runs' },
    ],
    sections: [
      { kind: 'donut', title: 'By status', sub: 'Where every run stands', centerLabel: 'Runs', segs: statusSegs },
      { kind: 'columns', title: 'By deployment window', sub: 'What is live, queued, or already closed', rows: windowRows },
      { kind: 'stack', title: 'Configuration type', sub: 'Applying a key versus removing one', segs: typeRows },
      { kind: 'bars', title: 'Widest rollouts', sub: 'Runs applied to the most endpoints', rows: reach.slice(0, 6), allRows: reach, panelSubject: 'deployments', panelColumnLabel: 'Deployment', panelCountLabel: 'Endpoints' },
      {
        kind: 'gauge', title: 'Completion rate', sub: 'Runs that finished, of those that were meant to',
        pct: Math.round((done / scheduled) * 100),
        caption: `${done} of ${scheduled} runs completed`,
        note: missed ? `${missed} missed their window without completing` : undefined,
      },
    ],
  };
};

export function RegistryDeploymentsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => DEPLOYMENTS.rows, []);
  return (
    <AssetRegisterPage
      activePage="registry-deployments"
      stackModule="registry-deployments"
      viewsStore="regdeploy"
      noun="deployment"
      moduleCols="registry-deployment"
      defaultViewName="All Registry Deployments"
      footerNoun="deployments"
      rows={rows}
      recordOf={(id) => { const dep = DEPLOYMENTS.byId.get(id); return dep ? registryDeploymentToPatchShape(dep) : undefined; }}
      filterAttrs={REGISTRY_DEPLOY_FILTER_ATTRS}
      quickFilters={REGISTRY_DEPLOY_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_createdBy', 'x_configType']}
      /* A run's status is its own lifecycle — the system moves it from Ready to Deploy to
         In Progress to Completed as the rollout actually happens. Nobody picks it from a
         dropdown, so the cell is read-only here (dot + word, no picker). */
      lockedCells={['status']}
      moreActions={[]}
      primaryAction={{ label: 'Create' }}
      primaryActionInTitle
      onNavigate={onNavigate}
    />
  );
}
