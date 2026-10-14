/* ── Consumable Assets listing ───────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL consumable
   mockAssets pool: moduleCols="consumable" columns (Asset Type · Available Qty ·
   Asset Group · Department · Location · Managed By · Created Date) and a KPI
   strip telling the Consumable DETAIL page's story store-wide — total units,
   out-of-stock, low stock, stock availability. Clicks open the real
   ConsumableAssetDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { pctGrade, type StatCard } from './AssetStatsRow';
import { CONSUMABLE_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { CONSUMABLE_FILTER_ATTRS } from './consumableFilterAttrs';
import { mockAssets, type ConsumableAsset } from './ConsumableAssetsListPage';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, Boxes, Package, TriangleAlert } from 'lucide-react';

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = x[field];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

/* "Wed, May 27, 2026" → Date. Strip the weekday via the FIRST comma — the
   documented date-parse recipe for these mock strings. */
const parseCreated = (s: string) => new Date(s.slice(s.indexOf(',') + 1).trim());

const CO: { rows: Ticket[]; byId: Map<string, ConsumableAsset> } = (() => {
  const byId = new Map<string, ConsumableAsset>();
  const rows = mockAssets.map((a) => {
    byId.set(a.id, a);
    const created = parseCreated(a.createdDate);
    const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const stockBand = a.availableQuantity === 0 ? 'Out of stock' : a.availableQuantity <= 10 ? 'Low stock' : 'Healthy';
    return {
      id: a.id,
      subject: a.name,
      requester: a.managedBy.name,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: a.managedBy.name, initials: a.managedBy.initials ?? initials(a.managedBy.name) },
      status: 'In Stock',
      priority: 'Medium',
      managedByGroup: a.managedByGroup,
      x_assetType: a.assetType,
      x_availableQty: a.availableQuantity,
      x_assetGroup: a.assetGroup === 'Unassigned' ? '' : a.assetGroup,
      x_department: a.department === 'Select' ? '' : a.department,
      x_location: a.location === '---' ? '' : a.location,
      x_stockBand: stockBand,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the Consumable detail page's story (Stock · Available ·
   Quantity & Allocation) rolled up across the store. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const types = new Set(t.map((x) => x.x_assetType).filter(Boolean)).size;
  const units = t.reduce((n, x) => n + (x.x_availableQty ?? 0), 0);
  const out = t.filter((x) => x.x_stockBand === 'Out of stock').length;
  const low = t.filter((x) => x.x_stockBand === 'Low stock').length;
  const healthy = t.filter((x) => x.x_stockBand === 'Healthy').length;
  const stockedPct = total ? Math.round(((total - out) / total) * 100) : 100;
  const one = (field: string, values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Total consumables', value: total, sub: `across ${types} item types` },
    { label: 'Units in stock', value: units.toLocaleString('en-IN'), sub: 'available across the store' },
    {
      label: 'Stock availability',
      value: `${stockedPct}%`,
      sub: `${out} item${out === 1 ? '' : 's'} out of stock`,
      valueColor: pctGrade(stockedPct),
    },
    {
      label: 'Out of stock',
      value: out,
      sub: 'reorder needed now',
      hint: 'Show out-of-stock items',
      filter: one('x_stockBand', ['Out of stock']),
      valueColor: out > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Low stock',
      value: low,
      sub: '10 units or fewer left',
      hint: 'Show low-stock items',
      filter: one('x_stockBand', ['Low stock']),
      valueColor: low > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Healthy stock',
      value: healthy,
      sub: 'comfortably stocked',
      hint: 'Show healthy-stock items',
      filter: one('x_stockBand', ['Healthy']),
    },
  ];
};

/* The Dashboard layout — the store's stock health as charts. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  const units = t.reduce((s, x) => s + (x.x_availableQty ?? 0), 0);
  return {
    tiles: [
      { icon: Package, color: '#3D8BD0', label: 'Item types', value: t.length, sub: 'in the store' },
      { icon: Boxes, color: '#22C55E', label: 'Units in stock', value: units.toLocaleString('en-IN'), sub: 'available to allocate' },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Out of stock', value: n((x) => x.x_stockBand === 'Out of stock'),
        sub: 'reorder needed now', filter: ruleIs('x_stockBand', 'Out of stock'), hint: 'Show out-of-stock items',
      },
      {
        icon: TriangleAlert, color: '#F59E0B', label: 'Low stock', value: n((x) => x.x_stockBand === 'Low stock'),
        sub: '10 units or fewer left', filter: ruleIs('x_stockBand', 'Low stock'), hint: 'Show low-stock items',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Stock health', centerLabel: 'items',
        segs: [
          seg('Healthy', n((x) => x.x_stockBand === 'Healthy'), '#22C55E', 'x_stockBand'),
          seg('Low stock', n((x) => x.x_stockBand === 'Low stock'), '#F59E0B', 'x_stockBand'),
          seg('Out of stock', n((x) => x.x_stockBand === 'Out of stock'), '#DC2626', 'x_stockBand'),
        ],
      },
      {
        kind: 'bars', title: 'Item types', sub: 'by count',
        rows: countBy(t, 'x_assetType').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_assetType', label),
        })),
      },
      {
        kind: 'bars', title: 'Asset groups', sub: 'where the stock lives',
        rows: countBy(t, 'x_assetGroup').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#8B5CF6', filter: ruleIs('x_assetGroup', label),
        })),
      },
      {
        kind: 'bars', title: 'Departments', sub: 'who the stock serves',
        rows: countBy(t, 'x_department').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#0EA5E9', filter: ruleIs('x_department', label),
        })),
      },
    ],
  };
};

export function ConsumableAssetsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="consumable-assets"
      stackModule="consumable-assets"
      viewsStore="consumable"
      noun="asset"
      moduleCols="consumable"
      defaultViewName="All Consumable Assets"
      footerNoun="items"
      rows={CO.rows}
      recordOf={(id) => CO.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      mineHint="Consumables carry no personal assignment — switch back to Overall."
      searchFields={['x_assetType', 'x_assetGroup', 'x_department', 'x_location']}
      /* The module's own attributes — see consumableFilterAttrs.ts. */
      filterAttrs={CONSUMABLE_FILTER_ATTRS}
      /* One quick cut: the kind of item. The service-desk trio (assignee / SLA /
         priority) means nothing on stock, and every consumable row is In Stock, so a
         status filter would be a control with one answer. */
      quickFilters={CONSUMABLE_QUICK_FILTERS}
      onNavigate={onNavigate}
    />
  );
}
