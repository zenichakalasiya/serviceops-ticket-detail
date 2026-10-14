/* ── Package Deployments listing ─────────────────────────────────────────────
   The shared register chrome over the real `mockPackageDeployments`, replacing the module's
   hand-rolled table: the same columns it always showed, now with the filter builder, saved
   views, grouping, multi-sort and the two layouts the module needs.

   TWO layouts — **List + KPI** and **Dashboard**, the same pair the Patch Deployment listing
   uses, because these are the same kind of record: a run with a window, a scope and a
   lifecycle. The KPIs follow the DETAIL page (see PackageDeploymentDrawer's header: Status ·
   Failed · Packages · Endpoints · Install After · Expiry). */
import { useMemo } from 'react';
import { CheckCircle, CircleDot, Package, PlayCircle, Timer } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { PACKAGE_DEPLOY_FILTER_ATTRS, PACKAGE_DEPLOY_QUICK_FILTERS } from './packageFilterAttrs';
import {
  mockPackageDeployments, packageDeploymentToPatchShape, parsePkgDate, pkgCreatedByOf,
  pkgEndpointCountOf, pkgExpiringOf, pkgPackageCountOf, pkgConfigTypeOf, pkgUpdatedByOf,
  pkgUpdatedDateOf, pkgWindowOf, type PackageDeployment,
} from './PackageDeploymentsListPage';
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

const DEPLOYMENTS: { rows: Ticket[]; byId: Map<string, PackageDeployment> } = (() => {
  const byId = new Map<string, PackageDeployment>();
  const rows = mockPackageDeployments.map((d) => {
    byId.set(d.id, d);
    const created = parsePkgDate(d.createdDate) ?? new Date();
    return {
      id: d.id,
      subject: d.name,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: parsePkgDate(d.expiryDate) ?? created,
      createdBy: created,
      status: d.status as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_policy: d.deploymentPolicy,
      x_installAfter: parsePkgDate(d.installAfter),
      x_expiry: parsePkgDate(d.expiryDate),
      x_configType: pkgConfigTypeOf(d),
      x_packageCount: pkgPackageCountOf(d),
      x_endpointCount: pkgEndpointCountOf(d),
      x_createdBy: pkgCreatedByOf(d),
      x_updatedBy: pkgUpdatedByOf(d),
      x_createdDate: created,
      x_lastUpdatedDate: pkgUpdatedDateOf(d),
      x_window: pkgWindowOf(d),
      /* Window closed AND never finished — one field for a two-condition fact, so the KPI
         card's number and the list its click produces can never disagree. */
      x_lapsed: pkgWindowOf(d) === 'Window closed' && !['Completed', 'Cancelled'].includes(d.status) ? 'Yes' : 'No',
      /* The KPI strip's "Expiring in 48h" — see pkgExpiringOf. */
      x_expiring: pkgExpiringOf(d),
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const statusOf = (t: Ticket) => String(t.status ?? '');
const windowOf = (t: Ticket) => String((t as any).x_window ?? '');
const lapsed = (t: Ticket) => (t as any).x_lapsed === 'Yes';

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
      label: 'Successful', value: done.length, sub: `of ${rows.length} rollouts`,
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

  const reach = [...rows]
    .sort((a, b) => Number((b as any).x_endpointCount ?? 0) - Number((a as any).x_endpointCount ?? 0))
    .map((t) => ({ label: t.id, value: Number((t as any).x_endpointCount ?? 0), color: '#8B5CF6' }));

  const done = by((t) => statusOf(t) === 'Completed');
  const missed = by(lapsed);
  const scheduled = Math.max(1, rows.length - by((t) => statusOf(t) === 'Draft'));
  return {
    tiles: [
      { icon: PlayCircle, color: '#F59E0B', label: 'In progress', value: by((t) => statusOf(t) === 'In Progress'), sub: 'rolling out now', filter: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
      { icon: CircleDot, color: '#3D8BD0', label: 'Ready to deploy', value: by((t) => statusOf(t) === 'Ready to Deploy'), sub: 'queued', filter: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }] },
      { icon: Timer, color: '#DC2626', label: 'Missed their window', value: missed, sub: 'expired without completing', filter: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
      { icon: CheckCircle, color: '#22C55E', label: 'Completed', value: done, sub: `of ${rows.length} runs`, filter: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
      { icon: Package, color: '#8B5CF6', label: 'Packages deployed', value: rows.reduce((a, t) => a + Number((t as any).x_packageCount ?? 0), 0), sub: 'summed across runs' },
    ],
    sections: [
      { kind: 'donut', title: 'By status', sub: 'Where every rollout stands', centerLabel: 'Runs', segs: statusSegs },
      { kind: 'columns', title: 'By deployment window', sub: 'What is live, queued, or already closed', rows: windowRows },
      { kind: 'bars', title: 'By policy', sub: 'Which rollout rules are in use', rows: policyRows.slice(0, 6), allRows: policyRows, panelSubject: 'deployments', panelColumnLabel: 'Policy', panelCountLabel: 'Runs' },
      { kind: 'bars', title: 'Widest rollouts', sub: 'Runs targeting the most endpoints', rows: reach.slice(0, 6), allRows: reach, panelSubject: 'deployments', panelColumnLabel: 'Deployment', panelCountLabel: 'Endpoints' },
      /* Drafts are out of the denominator — a run nobody has scheduled has not failed to
         complete, and counting it would make the rate read worse than it is. */
      {
        kind: 'gauge', title: 'Completion rate', sub: 'Runs that finished, of those that were meant to',
        pct: Math.round((done / scheduled) * 100),
        caption: `${done} of ${scheduled} runs completed`,
        note: missed ? `${missed} missed their window without completing` : undefined,
      },
    ],
  };
};

export function PackageDeploymentsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => DEPLOYMENTS.rows, []);
  return (
    <AssetRegisterPage
      activePage="package-deployments"
      stackModule="package-deployments"
      viewsStore="pkgdeploy"
      noun="deployment"
      moduleCols="package-deployment"
      defaultViewName="All Package Deployments"
      footerNoun="deployments"
      rows={rows}
      recordOf={(id) => { const dep = DEPLOYMENTS.byId.get(id); return dep ? packageDeploymentToPatchShape(dep) : undefined; }}
      filterAttrs={PACKAGE_DEPLOY_FILTER_ATTRS}
      quickFilters={PACKAGE_DEPLOY_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_policy', 'x_createdBy', 'x_configType']}
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
