/* ── Non-IT Assets listing ───────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL non-IT
   mockAssets pool: moduleCols="nonit" columns (Asset Type · Status · Used By ·
   Impact · Managed By Group · Managed By) and a KPI strip telling the Non-IT
   DETAIL page's story fleet-wide — lifecycle, warranty, book value, incidents.
   Every click opens the real NonItAssetDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { assetHealthOf, type StatCard } from './AssetStatsRow';
import { NONIT_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { NONIT_FILTER_ATTRS } from './nonItFilterAttrs';
import { mockAssets, type NonItAsset } from './NonItAssetsListPage';
import { CURRENT_USER, CURRENT_USER_INITIALS } from './technicianRoster';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, Boxes, CalendarClock, CheckCircle2, FlaskConical, Import } from 'lucide-react';

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = field === 'assignedTo' ? x.assignedTo?.name : x[field];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const hash = (id: string) => id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
const fmtINR = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${n.toLocaleString('en-IN')}`;
/** Deterministic current book value per asset — the Financials tab's recipe rolled up. */
export const bookValueOf = (id: string) => 8000 + (hash(id) % 90) * 4200;

const NI: { rows: Ticket[]; byId: Map<string, NonItAsset> } = (() => {
  const byId = new Map<string, NonItAsset>();
  const rows = mockAssets.map((a, i) => {
    byId.set(a.id, a);
    const h = hash(a.id);
    const created = new Date(2026, h % 8, 1 + (h % 27), 9 + (h % 8), (h % 4) * 15);
    const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return {
      id: a.id,
      subject: a.name,
      requester: a.usedBy ? a.usedBy.split(' (')[0] : 'Unassigned',
      dueBy: created,
      createdBy: created,
      /* A slice of the register is managed by the signed-in technician, so the
         "Assets Managed by Me" view has something real to show. */
      assignedTo:
        i % 5 === 2
          ? { name: CURRENT_USER, initials: CURRENT_USER_INITIALS }
          : { name: a.managedBy.name, initials: a.managedBy.initials ?? initials(a.managedBy.name) },
      status: a.status as Ticket['status'],
      priority: 'Medium',
      managedByGroup: a.managedByGroup,
      usedByLabel: a.usedBy ?? '',
      x_assetType: a.assetType,
      x_impact: a.impact,
      /* Warranty band from the shared per-asset health seed, as a ROW FIELD so
         the KPI cards and dashboard segments can drill into it. */
      x_warrantyBand: (() => {
        const d = assetHealthOf(a.id).warrantyDays;
        return d <= 0 ? 'Expired' : d <= 30 ? 'Expiring soon' : 'Covered';
      })(),
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the Non-IT detail page's header story (Status · Warranty ·
   Book Value · Impact) rolled up across the register. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const types = new Set(t.map((x) => x.x_assetType).filter(Boolean)).size;
  const inUse = t.filter((x) => (x.status as string) === 'In Use').length;
  const shelf = t.filter((x) => ['In Stock', 'In Store'].includes(x.status as string)).length;
  const broken = t.filter((x) => (x.status as string) === 'Not Working').length;
  const health = t.map((x) => assetHealthOf(x.id));
  const expSoon = health.filter((hh) => hh.warrantyDays > 0 && hh.warrantyDays <= 30).length;
  const expired = health.filter((hh) => hh.warrantyDays <= 0).length;
  const bookValue = t.reduce((n, x) => n + bookValueOf(x.id), 0);
  const impacted = health.filter((hh) => hh.incidents > 0).length;
  const openIncidents = health.reduce((n, hh) => n + hh.incidents, 0);
  const one = (field: string, values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Total assets', value: total, sub: `across ${types} asset types` },
    {
      label: 'In Use',
      value: inUse,
      sub: total ? `${Math.round((inUse / total) * 100)}% of the register` : '—',
      hint: 'Show assets in use',
      filter: one('status', ['In Use']),
    },
    {
      label: 'In Stock / In Store',
      value: shelf,
      sub: 'ready to allocate',
      hint: 'Show shelf stock',
      filter: one('status', ['In Stock', 'In Store']),
    },
    {
      label: 'Not Working',
      value: broken,
      sub: 'awaiting repair or disposal',
      hint: 'Show assets that are not working',
      filter: one('status', ['Not Working']),
      valueColor: broken > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Warranty expiring',
      value: expSoon,
      sub: expired ? `within 30 days · ${expired} already expired` : 'within 30 days',
      hint: 'Show warranty expiring soon',
      filter: one('x_warrantyBand', ['Expiring soon']),
      valueColor: expSoon > 0 ? '#B45309' : undefined,
    },
    { label: 'Book value', value: fmtINR(bookValue), sub: 'current depreciated value' },
    {
      label: 'Active incidents',
      value: openIncidents,
      sub: `open records on ${impacted} asset${impacted === 1 ? '' : 's'}`,
      valueColor: openIncidents > 0 ? '#B42318' : undefined,
    },
  ];
};

/* The Dashboard layout — the Non-IT detail page's story as charts. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  return {
    tiles: [
      { icon: Boxes, color: '#3D8BD0', label: 'Total assets', value: t.length, sub: 'in the register' },
      {
        icon: CheckCircle2, color: '#22C55E', label: 'In Use', value: n((x) => x.status === 'In Use'),
        sub: 'allocated and working', filter: ruleIs('status', 'In Use'), hint: 'Show assets in use',
      },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Not Working', value: n((x) => x.status === 'Not Working'),
        sub: 'awaiting repair or disposal', filter: ruleIs('status', 'Not Working'), hint: 'Show assets that are not working',
      },
      {
        icon: CalendarClock, color: '#F59E0B', label: 'Warranty expiring', value: n((x) => x.x_warrantyBand === 'Expiring soon'),
        sub: 'within 30 days', filter: ruleIs('x_warrantyBand', 'Expiring soon'), hint: 'Show warranty expiring soon',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Lifecycle', centerLabel: 'assets',
        segs: [
          seg('In Use', n((x) => x.status === 'In Use'), '#22C55E', 'status'),
          seg('In Stock', n((x) => x.status === 'In Stock'), '#3D8BD0', 'status'),
          seg('In Store', n((x) => x.status === 'In Store'), '#0EA5E9', 'status'),
          seg('Not Working', n((x) => x.status === 'Not Working'), '#DC2626', 'status'),
        ],
      },
      {
        kind: 'donut', title: 'Warranty', centerLabel: 'assets',
        segs: [
          seg('Covered', n((x) => x.x_warrantyBand === 'Covered'), '#22C55E', 'x_warrantyBand'),
          seg('Expiring soon', n((x) => x.x_warrantyBand === 'Expiring soon'), '#F59E0B', 'x_warrantyBand'),
          seg('Expired', n((x) => x.x_warrantyBand === 'Expired'), '#DC2626', 'x_warrantyBand'),
        ],
      },
      {
        kind: 'bars', title: 'Asset types', sub: 'by count',
        rows: countBy(t, 'x_assetType').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_assetType', label),
        })),
      },
      {
        kind: 'bars', title: 'Managed by group', sub: 'ownership spread',
        rows: countBy(t, 'managedByGroup').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#8B5CF6', filter: ruleIs('managedByGroup', label),
        })),
      },
      {
        kind: 'donut', title: 'Impact', centerLabel: 'assets',
        segs: [
          seg('On Organization', n((x) => x.x_impact === 'On Organization'), '#8B5CF6', 'x_impact'),
          seg('On Department', n((x) => x.x_impact === 'On Department'), '#3D8BD0', 'x_impact'),
          seg('On Users', n((x) => x.x_impact === 'On Users'), '#22C55E', 'x_impact'),
        ],
      },
    ],
  };
};

export function NonItAssetsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="non-it-assets"
      stackModule="non-it-assets"
      viewsStore="nonit"
      noun="asset"
      moduleCols="nonit"
      defaultViewName="All Non-IT Assets"
      footerNoun="assets"
      rows={NI.rows}
      recordOf={(id) => NI.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_assetType', 'x_impact', 'usedByLabel', 'managedByGroup']}
      /* Same toolbar as the hardware / software registers: the module's own attributes,
         quick cuts, label tools and 3-dot items. */
      filterAttrs={NONIT_FILTER_ATTRS}
      quickFilters={NONIT_QUICK_FILTERS}
      showBarcodeTools
      moreActions={[
        { key: 'asset-in-stage', label: 'Asset in Stage', icon: FlaskConical },
        { key: 'import-asset', label: 'Import Asset', icon: Import },
      ]}
      onNavigate={onNavigate}
    />
  );
}
