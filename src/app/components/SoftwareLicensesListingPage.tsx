/* ── Software Licenses listing ───────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockLicenses
   pool: moduleCols="license" columns (Product · License Type · Purchase /
   Allocation / Installation Count · Expiry Date) and a KPI strip telling the
   License DETAIL page's story estate-wide — seats purchased/allocated/installed,
   utilization compliance, expiring licenses. Clicks open the real
   SoftwareLicenseDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { pctGrade, type StatCard } from './AssetStatsRow';
import { LICENSE_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { LICENSE_FILTER_ATTRS } from './licenseFilterAttrs';
import { mockLicenses, type SoftwareLicense } from './SoftwareLicensesListPage';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, CalendarClock, KeyRound, Users } from 'lucide-react';

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = x[field];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const DAY = 864e5;
const parseDMY = (s: string | null): Date | null => {
  if (!s) return null;
  const [d, m, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d);
};

const LI: { rows: Ticket[]; byId: Map<string, SoftwareLicense> } = (() => {
  const byId = new Map<string, SoftwareLicense>();
  const today = new Date();
  const rows = mockLicenses.map((l) => {
    byId.set(l.id, l);
    const exp = parseDMY(l.expiryDate);
    const days = exp ? Math.ceil((exp.getTime() - today.getTime()) / DAY) : null;
    /* The detail page's compliance rule: util > 100 over, < 60 under, no purchase
       count (free licenses) → not tracked. */
    const util = l.purchaseCount ? Math.round(((l.allocationCount ?? 0) / l.purchaseCount) * 100) : null;
    const compliance = util === null ? 'Not Tracked' : util > 100 ? 'Over-utilized' : util < 60 ? 'Under-utilized' : 'Compliant';
    const expiryBand = !exp ? 'Perpetual' : days! <= 0 ? 'Expired' : days! <= 30 ? 'Expiring soon' : 'Active';
    const created = exp ? new Date(exp.getTime() - 365 * DAY) : new Date(2026, 0, 15);
    return {
      id: l.id,
      subject: l.name,
      requester: l.product,
      dueBy: exp ?? created,
      createdBy: created,
      assignedTo: { name: 'Unassigned', initials: '' },
      status: 'In Use',
      priority: 'Medium',
      x_product: l.product,
      x_licenseType: l.licenseType,
      x_purchaseCount: l.purchaseCount,
      x_allocationCount: l.allocationCount,
      x_installationCount: l.installationCount,
      /* A real Date, not the mock's "24/07/2026" string: the grid prints it in the house
         format like every other date (see dateFormat.ts) AND sorts it chronologically. */
      x_expiryDate: exp ?? undefined,
      /* The same value under the key the Expiry Date FILTER reads. */
      expiryOn: exp ?? undefined,
      x_compliance: compliance,
      x_expiryBand: expiryBand,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the License detail page's Overview (Purchase / Allocation /
   Installation / Available / Pending Install) + header compliance, estate-wide. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const products = new Set(t.map((x) => x.x_product).filter(Boolean)).size;
  const purchased = t.reduce((n, x) => n + (x.x_purchaseCount ?? 0), 0);
  const allocated = t.reduce((n, x) => n + (x.x_allocationCount ?? 0), 0);
  const installed = t.reduce((n, x) => n + (x.x_installationCount ?? 0), 0);
  const over = t.filter((x) => x.x_compliance === 'Over-utilized').length;
  const under = t.filter((x) => x.x_compliance === 'Under-utilized').length;
  const tracked = t.filter((x) => x.x_compliance !== 'Not Tracked').length;
  const compliantPct = tracked ? Math.round(((tracked - over - under) / tracked) * 100) : 100;
  const expSoon = t.filter((x) => x.x_expiryBand === 'Expiring soon').length;
  const expired = t.filter((x) => x.x_expiryBand === 'Expired').length;
  const one = (field: string, values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Total licenses', value: total, sub: `across ${products} products` },
    { label: 'Purchased seats', value: purchased.toLocaleString('en-IN'), sub: 'across paid licenses' },
    {
      label: 'Allocated seats',
      value: allocated.toLocaleString('en-IN'),
      sub: purchased ? `${Math.round((allocated / purchased) * 100)}% of purchased` : '—',
    },
    {
      label: 'Installed',
      value: installed.toLocaleString('en-IN'),
      sub: `${Math.max(allocated - installed, 0).toLocaleString('en-IN')} pending install`,
    },
    {
      label: 'License compliance',
      value: `${compliantPct}%`,
      sub: `${tracked - over - under} compliant of ${tracked} tracked`,
      valueColor: pctGrade(compliantPct),
    },
    {
      label: 'Over-utilized',
      value: over,
      sub: 'allocations past purchased seats',
      hint: 'Show over-utilized licenses',
      filter: one('x_compliance', ['Over-utilized']),
      valueColor: over > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Under-utilized',
      value: under,
      sub: 'below 60% utilization',
      hint: 'Show under-utilized licenses',
      filter: one('x_compliance', ['Under-utilized']),
      valueColor: under > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Expiring soon',
      value: expSoon,
      sub: expired ? `within 30 days · ${expired} already expired` : 'within 30 days',
      hint: 'Show licenses expiring within 30 days',
      filter: one('x_expiryBand', ['Expiring soon']),
      valueColor: expSoon > 0 ? '#B45309' : undefined,
    },
  ];
};

/* The Dashboard layout — the license estate's compliance and expiry story. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  const purchased = t.reduce((s, x) => s + (x.x_purchaseCount ?? 0), 0);
  const allocated = t.reduce((s, x) => s + (x.x_allocationCount ?? 0), 0);
  const utilPct = purchased ? Math.min(Math.round((allocated / purchased) * 100), 100) : 0;
  return {
    tiles: [
      { icon: KeyRound, color: '#3D8BD0', label: 'Total licenses', value: t.length, sub: 'in the estate' },
      { icon: Users, color: '#22C55E', label: 'Purchased seats', value: purchased.toLocaleString('en-IN'), sub: `${allocated.toLocaleString('en-IN')} allocated` },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Over-utilized', value: n((x) => x.x_compliance === 'Over-utilized'),
        sub: 'past purchased seats', filter: ruleIs('x_compliance', 'Over-utilized'), hint: 'Show over-utilized licenses',
      },
      {
        icon: CalendarClock, color: '#F59E0B', label: 'Expiring soon', value: n((x) => x.x_expiryBand === 'Expiring soon'),
        sub: 'within 30 days', filter: ruleIs('x_expiryBand', 'Expiring soon'), hint: 'Show licenses expiring soon',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'License compliance', centerLabel: 'licenses',
        segs: [
          seg('Compliant', n((x) => x.x_compliance === 'Compliant'), '#22C55E', 'x_compliance'),
          seg('Over-utilized', n((x) => x.x_compliance === 'Over-utilized'), '#DC2626', 'x_compliance'),
          seg('Under-utilized', n((x) => x.x_compliance === 'Under-utilized'), '#F59E0B', 'x_compliance'),
          seg('Not Tracked', n((x) => x.x_compliance === 'Not Tracked'), '#94A3B8', 'x_compliance'),
        ],
      },
      {
        kind: 'donut', title: 'Expiry outlook', centerLabel: 'licenses',
        segs: [
          seg('Active', n((x) => x.x_expiryBand === 'Active'), '#22C55E', 'x_expiryBand'),
          seg('Expiring soon', n((x) => x.x_expiryBand === 'Expiring soon'), '#F59E0B', 'x_expiryBand'),
          seg('Expired', n((x) => x.x_expiryBand === 'Expired'), '#DC2626', 'x_expiryBand'),
          seg('Perpetual', n((x) => x.x_expiryBand === 'Perpetual'), '#94A3B8', 'x_expiryBand'),
        ],
      },
      {
        kind: 'bars', title: 'License types', sub: 'by count',
        rows: countBy(t, 'x_licenseType').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_licenseType', label),
        })),
      },
      {
        kind: 'gauge', title: 'Seat utilization', pct: utilPct, caption: 'seats allocated',
        note: `${allocated.toLocaleString('en-IN')} of ${purchased.toLocaleString('en-IN')} purchased seats are allocated across the estate.`,
      },
    ],
  };
};

export function SoftwareLicensesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="software-licenses"
      stackModule="software-licenses"
      viewsStore="license"
      noun="license"
      moduleCols="license"
      defaultViewName="All Software Licenses"
      footerNoun="licenses"
      rows={LI.rows}
      recordOf={(id) => LI.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      mineHint="Licenses carry no personal assignment — switch back to Overall."
      filterAttrs={LICENSE_FILTER_ATTRS}
      /* One cut: what kind of licence. A licence has no assignee, SLA or priority. */
      quickFilters={LICENSE_QUICK_FILTERS}
      primaryAction={{ label: 'Add License' }}
      /* On the title line, at the page's top-right — the rail below it narrows what you are
         looking at, which is a different job from adding a licence. */
      primaryActionInTitle
      searchFields={['x_product', 'x_licenseType', 'x_expiryDate']}
      onNavigate={onNavigate}
    />
  );
}
