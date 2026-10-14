/* ── Contracts listing ───────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockContracts
   pool: moduleCols="contract" columns (Contract Type · Status · Vendor · Cost ·
   Start / End Date) and a KPI strip telling the Contract DETAIL page's story
   portfolio-wide — active/expiring/expired, recorded value, vendors under
   management. Clicks open the real ContractDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { type StatCard } from './AssetStatsRow';
import { CONTRACT_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { CONTRACT_FILTER_ATTRS } from './contractFilterAttrs';
import { mockContracts, type Contract } from './ContractsListPage';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, CalendarClock, CheckCircle2, FileText } from 'lucide-react';

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
const fmtINR = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${n.toLocaleString('en-IN')}`;

const CT: { rows: Ticket[]; byId: Map<string, Contract> } = (() => {
  const byId = new Map<string, Contract>();
  const today = new Date();
  const rows = mockContracts.map((c) => {
    byId.set(c.id, c);
    const start = parseDMY(c.startDate)!;
    const end = parseDMY(c.endDate)!;
    const days = Math.ceil((end.getTime() - today.getTime()) / DAY);
    /* The header-chip rule: Expires surfaces only when ≤30 days or past. */
    const expiryBand = c.status === 'Expired' || days <= 0 ? 'Expired' : days <= 30 ? 'Expiring soon' : 'Active window';
    return {
      id: c.id,
      subject: c.name,
      requester: c.vendor.split(': ')[1] ?? c.vendor,
      dueBy: end,
      createdBy: start,
      assignedTo: { name: 'Unassigned', initials: '' },
      status: c.status as Ticket['status'],
      priority: 'Medium',
      x_contractType: c.contractType,
      x_contractNumber: c.contractNumber,
      x_vendor: c.vendor,
      x_cost: c.cost,
      /* Real Dates, not the mock's "01/06/2027" strings: the grid prints them in the house
         format like every other date (see dateFormat.ts) AND sorts them chronologically —
         as text, "24/07/2026" sorted before "30/06/2026". */
      x_startDate: start,
      x_endDate: end,
      /* The same values under the keys the Contract Start / End Date FILTERS read. */
      startOn: start,
      endOn: end,
      x_expiryBand: expiryBand,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the Contract detail page's header story (Status · Expires ·
   Vendor · Cost · Type) rolled up across the portfolio. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const types = new Set(t.map((x) => x.x_contractType).filter(Boolean)).size;
  const active = t.filter((x) => (x.status as string) === 'Active').length;
  const expSoon = t.filter((x) => x.x_expiryBand === 'Expiring soon').length;
  const expired = t.filter((x) => (x.status as string) === 'Expired' || x.x_expiryBand === 'Expired').length;
  const notStarted = t.filter((x) => (x.status as string) === 'Not Started').length;
  const withCost = t.filter((x) => x.x_cost);
  const value = withCost.reduce((n, x) => n + (parseFloat(String(x.x_cost).replace(/[^\d.]/g, '')) || 0), 0);
  const vendors = new Set(t.map((x) => x.x_vendor).filter(Boolean)).size;
  const one = (field: string, values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Total contracts', value: total, sub: `across ${types} contract types` },
    /* Money sits second, not buried at the end: what the portfolio COSTS is the number
       the page is read for, and the average tells you the shape of that spend. */
    {
      label: 'Contract value',
      value: fmtINR(value),
      sub: withCost.length ? `avg ${fmtINR(Math.round(value / withCost.length))} per contract` : 'no recorded cost',
    },
    {
      label: 'Active',
      value: active,
      sub: total ? `${Math.round((active / total) * 100)}% of the portfolio` : '—',
      hint: 'Show active contracts',
      filter: one('status', ['Active']),
    },
    {
      label: 'Expiring soon',
      value: expSoon,
      sub: 'within 30 days — renew or renegotiate',
      hint: 'Show contracts expiring within 30 days',
      filter: one('x_expiryBand', ['Expiring soon']),
      valueColor: expSoon > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Expired',
      value: expired,
      sub: 'past their end date',
      hint: 'Show expired contracts',
      filter: one('status', ['Expired']),
      valueColor: expired > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Not started',
      value: notStarted,
      sub: 'signed, window yet to open',
      hint: 'Show contracts not yet started',
      filter: one('status', ['Not Started']),
    },
    { label: 'Vendors', value: vendors, sub: 'under management' },
  ];
};

/* The Dashboard layout — the contract portfolio's renewal story. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  return {
    tiles: [
      { icon: FileText, color: '#3D8BD0', label: 'Total contracts', value: t.length, sub: 'in the portfolio' },
      {
        icon: CheckCircle2, color: '#22C55E', label: 'Active', value: n((x) => x.status === 'Active'),
        sub: 'currently in force', filter: ruleIs('status', 'Active'), hint: 'Show active contracts',
      },
      {
        icon: CalendarClock, color: '#F59E0B', label: 'Expiring soon', value: n((x) => x.x_expiryBand === 'Expiring soon'),
        sub: 'within 30 days', filter: ruleIs('x_expiryBand', 'Expiring soon'), hint: 'Show contracts expiring soon',
      },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Expired', value: n((x) => x.status === 'Expired' || x.x_expiryBand === 'Expired'),
        sub: 'past their end date', filter: ruleIs('status', 'Expired'), hint: 'Show expired contracts',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Status', centerLabel: 'contracts',
        segs: [
          seg('Active', n((x) => x.status === 'Active'), '#22C55E', 'status'),
          seg('Not Started', n((x) => x.status === 'Not Started'), '#F59E0B', 'status'),
          seg('Expired', n((x) => x.status === 'Expired'), '#DC2626', 'status'),
        ],
      },
      {
        kind: 'donut', title: 'Renewal window', centerLabel: 'contracts',
        segs: [
          seg('Active window', n((x) => x.x_expiryBand === 'Active window'), '#22C55E', 'x_expiryBand'),
          seg('Expiring soon', n((x) => x.x_expiryBand === 'Expiring soon'), '#F59E0B', 'x_expiryBand'),
          seg('Expired', n((x) => x.x_expiryBand === 'Expired'), '#DC2626', 'x_expiryBand'),
        ],
      },
      {
        kind: 'bars', title: 'Contract types', sub: 'by count',
        rows: countBy(t, 'x_contractType').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_contractType', label),
        })),
      },
      {
        kind: 'bars', title: 'Vendors', sub: 'contracts per vendor',
        rows: countBy(t, 'x_vendor').slice(0, 6).map(([label, value]) => ({
          label: label.split(': ')[1] ?? label, value, color: '#8B5CF6', filter: ruleIs('x_vendor', label),
        })),
      },
    ],
  };
};

export function ContractsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="contracts"
      stackModule="contracts"
      viewsStore="contract"
      noun="contract"
      moduleCols="contract"
      defaultViewName="All Contracts"
      footerNoun="contracts"
      rows={CT.rows}
      recordOf={(id) => CT.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      mineHint="Contracts carry no personal assignment — switch back to Overall."
      filterAttrs={CONTRACT_FILTER_ATTRS}
      /* Contract Status is DERIVED — a contract is Not Started until its start date, Active
         inside its window and Expired past its end date. Nobody sets it by hand, so the cell
         reads as plain text: changing the dates is what moves it. */
      lockedCells={['status']}
      /* One cut: what kind of agreement this is. */
      quickFilters={CONTRACT_QUICK_FILTERS}
      searchFields={['x_contractType', 'x_contractNumber', 'x_vendor', 'x_endDate']}
      onNavigate={onNavigate}
    />
  );
}
