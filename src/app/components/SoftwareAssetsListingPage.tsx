/* ── Software Assets listing ─────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL software
   mockAssets pool: moduleCols="software" columns (Version · Software Type ·
   Status · Category · Managed By Group · Managed By · Impact) and a KPI strip
   telling the software DETAIL page's story fleet-wide — Managed vs Discovered,
   license compliance/utilization, expiring licenses, org-impact apps.
   Every click opens the real SoftwareAssetDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { pctGrade, type StatCard } from './AssetStatsRow';
import { SOFTWARE_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { SOFTWARE_FILTER_ATTRS } from './softwareFilterAttrs';
import { mockAssets, type SoftwareAsset } from './SoftwareAssetsListPage';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, AppWindow, CalendarClock, Import, ShieldCheck } from 'lucide-react';

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = x[field];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const hash = (id: string) => id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);

/* The catalog mapped onto the Ticket shape, the ORIGINAL record kept aside so
   clicks open the real drawer. License health (utilization compliance, expiry)
   is seeded deterministically per id — the detail page's own recipe — and lands
   on the row as x_ bands the KPIs and saved views filter on. */
/* Software Type is the product's classification tree (Software > OS > Linux …), so it
   is read off the product NAME rather than stored per mock row. Managed vs Discovered
   is a different fact — how the record got here — and rides on Origin. */
const swTypeOf = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('sql server')) return 'SQLServer';
  if (n.includes('mysql')) return 'MySQL';
  if (n.includes('apache')) return 'Apache';
  if (n.includes('iis')) return 'IIS';
  if (n.includes('whatsapp')) return 'Mobile Application';
  if (n.includes('windowsstore') || n.includes('winapp') || n.includes('windows')) return 'Microsoft';
  if (n.includes('ubuntu') || n.includes('linux')) return 'Linux';
  if (n.includes('macos')) return 'MacOS';
  return 'Application';
};

const SW: { rows: Ticket[]; byId: Map<string, SoftwareAsset> } = (() => {
  const byId = new Map<string, SoftwareAsset>();
  const rows = mockAssets.map((a) => {
    byId.set(a.id, a);
    const h = hash(a.id);
    const created = new Date(2026, h % 8, 1 + (h % 27), 9 + (h % 8), (h % 4) * 15);
    const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const compliance =
      a.softwareType === 'Discovered'
        ? 'Not Tracked'
        : h % 9 === 2
          ? 'Over-utilized'
          : h % 7 === 3
            ? 'Under-utilized'
            : 'Compliant';
    const expDays = (h % 340) - 30;
    const expiryBand =
      a.softwareType === 'Discovered' ? 'No license' : expDays <= 0 ? 'Expired' : expDays <= 30 ? 'Expiring soon' : 'Active';
    return {
      id: a.id,
      subject: a.name,
      requester: a.managedBy.name,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: a.managedBy.name, initials: a.managedBy.initials ?? initials(a.managedBy.name) },
      status: a.status as Ticket['status'],
      priority: 'Medium',
      managedByGroup: a.managedByGroup,
      x_version: a.version,
      x_softwareType: swTypeOf(a.name),
      origin: a.softwareType === 'Discovered' ? 'Agent Scan' : 'Purchased',
      x_softwareCategory: a.softwareCategory === '---' ? '' : a.softwareCategory,
      x_impact: a.impact,
      x_compliance: compliance,
      x_expiryBand: expiryBand,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the software detail page's header story (Status · Compliance ·
   Utilization · License Expiry · Impact) rolled up across the catalog. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const categories = new Set(t.map((x) => x.x_softwareCategory).filter(Boolean)).size;
  const managed = t.filter((x) => x.origin !== 'Agent Scan').length;
  const discovered = t.filter((x) => x.origin === 'Agent Scan').length;
  const over = t.filter((x) => x.x_compliance === 'Over-utilized').length;
  const under = t.filter((x) => x.x_compliance === 'Under-utilized').length;
  const tracked = t.filter((x) => x.x_compliance && x.x_compliance !== 'Not Tracked').length;
  const compliantPct = tracked ? Math.round(((tracked - over - under) / tracked) * 100) : 100;
  const expSoon = t.filter((x) => x.x_expiryBand === 'Expiring soon').length;
  const expired = t.filter((x) => x.x_expiryBand === 'Expired').length;
  const orgImpact = t.filter((x) => x.x_impact === 'On Organization').length;
  const one = (field: string, value: string): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values: [value] }];
  return [
    { label: 'Total software', value: total, sub: `across ${categories} categories` },
    {
      label: 'Managed',
      value: managed,
      sub: total ? `${Math.round((managed / total) * 100)}% purchased or added by IT` : '—',
      hint: 'Show managed software',
      filter: one('origin', 'Purchased'),
    },
    {
      label: 'Discovered',
      value: discovered,
      sub: 'found by agent scans',
      hint: 'Show discovered software',
      filter: one('origin', 'Agent Scan'),
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
      hint: 'Show over-utilized software',
      filter: one('x_compliance', 'Over-utilized'),
      valueColor: over > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Under-utilized',
      value: under,
      sub: 'seats sitting unused',
      hint: 'Show under-utilized software',
      filter: one('x_compliance', 'Under-utilized'),
      valueColor: under > 0 ? '#B45309' : undefined,
    },
    {
      label: 'License expiring',
      value: expSoon,
      sub: expired ? `within 30 days · ${expired} already expired` : 'within 30 days',
      hint: 'Show licenses expiring soon',
      filter: one('x_expiryBand', 'Expiring soon'),
      valueColor: expSoon > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Business-critical',
      value: orgImpact,
      sub: 'impact on the organization',
      hint: 'Show organization-impact software',
      filter: one('x_impact', 'On Organization'),
    },
  ];
};

/* The Dashboard layout — the software detail page's story as charts, every
   segment drilling into the filtered list. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string, ...values: string[]) => ({
    label, value, color, filter: ruleIs(field, ...(values.length ? values : [label])),
  });
  return {
    tiles: [
      { icon: AppWindow, color: '#3D8BD0', label: 'Total software', value: t.length, sub: 'in the catalog' },
      {
        icon: ShieldCheck, color: '#22C55E', label: 'Managed', value: n((x) => x.origin !== 'Agent Scan'),
        sub: 'under IT control', filter: ruleIs('origin', 'Purchased'), hint: 'Show managed software',
      },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Over-utilized', value: n((x) => x.x_compliance === 'Over-utilized'),
        sub: 'past purchased seats', filter: ruleIs('x_compliance', 'Over-utilized'), hint: 'Show over-utilized software',
      },
      {
        icon: CalendarClock, color: '#F59E0B', label: 'License expiring', value: n((x) => x.x_expiryBand === 'Expiring soon'),
        sub: 'within 30 days', filter: ruleIs('x_expiryBand', 'Expiring soon'), hint: 'Show licenses expiring soon',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Lifecycle', centerLabel: 'software',
        segs: [
          seg('In Use', n((x) => x.status === 'In Use'), '#22C55E', 'status'),
          seg('In Stock', n((x) => x.status === 'In Stock'), '#3D8BD0', 'status'),
          seg('Retired', n((x) => x.status === 'Retired'), '#94A3B8', 'status'),
        ],
      },
      {
        kind: 'donut', title: 'Managed vs Discovered', centerLabel: 'software',
        segs: [
          seg('Managed', n((x) => x.origin !== 'Agent Scan'), '#3D8BD0', 'origin', 'Purchased'),
          seg('Discovered', n((x) => x.origin === 'Agent Scan'), '#F59E0B', 'origin', 'Agent Scan'),
        ],
      },
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
        kind: 'donut', title: 'License expiry', centerLabel: 'licenses',
        segs: [
          seg('Active', n((x) => x.x_expiryBand === 'Active'), '#22C55E', 'x_expiryBand'),
          seg('Expiring soon', n((x) => x.x_expiryBand === 'Expiring soon'), '#F59E0B', 'x_expiryBand'),
          seg('Expired', n((x) => x.x_expiryBand === 'Expired'), '#DC2626', 'x_expiryBand'),
          seg('No license', n((x) => x.x_expiryBand === 'No license'), '#94A3B8', 'x_expiryBand'),
        ],
      },
      {
        kind: 'bars', title: 'Top categories', sub: 'by installed software',
        rows: countBy(t, 'x_softwareCategory').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_softwareCategory', label),
        })),
      },
      {
        kind: 'donut', title: 'Impact', centerLabel: 'software',
        segs: [
          seg('On Organization', n((x) => x.x_impact === 'On Organization'), '#8B5CF6', 'x_impact'),
          seg('On Department', n((x) => x.x_impact === 'On Department'), '#3D8BD0', 'x_impact'),
          seg('On Users', n((x) => x.x_impact === 'On Users'), '#22C55E', 'x_impact'),
        ],
      },
    ],
  };
};

export function SoftwareAssetsListingPage({
  onNavigate,
  initialOpenId,
  onInitialOpenConsumed,
}: {
  onNavigate?: (page: string) => void;
  initialOpenId?: string | null;
  onInitialOpenConsumed?: () => void;
}) {
  return (
    <AssetRegisterPage
      activePage="software-assets"
      stackModule="software-assets"
      viewsStore="swasset"
      noun="asset"
      moduleCols="software"
      defaultViewName="All Software IT Assets"
      footerNoun="assets"
      rows={SW.rows}
      recordOf={(id) => SW.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_version', 'x_softwareType', 'x_softwareCategory']}
      /* The module's own attributes, quick cuts and ⋮ items — see softwareFilterAttrs.ts. */
      showBarcodeTools
      filterAttrs={SOFTWARE_FILTER_ATTRS}
      quickFilters={SOFTWARE_QUICK_FILTERS}
      moreActions={[{ key: 'import-software', label: 'Import Software', icon: Import }]}
      initialOpenId={initialOpenId}
      onInitialOpenConsumed={onInitialOpenConsumed}
      onNavigate={onNavigate}
    />
  );
}
