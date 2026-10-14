/* ── Purchases listing ───────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockPurchases
   pool: moduleCols="purchase" columns (Order Number · Status · Owner · Vendor ·
   Required By) and a KPI strip telling the Purchase-Order DETAIL page's story
   pipeline-wide — open orders, approvals, overdue deliveries, outstanding vs
   total payable. Clicks open the real PurchaseDrawer via the DrawerStack. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { type StatCard } from './AssetStatsRow';
import { PURCHASE_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { PURCHASE_FILTER_ATTRS } from './purchaseFilterAttrs';
import { INVOICE_RECEIVED_OPTIONS, PAYMENT_STATUS_OPTIONS } from './upstream/AssetFields';
import { mockPurchases, type Purchase } from './PurchasesListPage';
import type { Ticket } from './TicketListPage';
import { AlertTriangle, Hourglass, PackageOpen, ShoppingCart } from 'lucide-react';

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = field === 'assignedTo' ? x.assignedTo?.name : x[field];
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
const hash = (id: string) => id.split('').reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
/** Deterministic PO value — the detail page's line-items total, per order. */
const orderValueOf = (id: string) => 45000 + (hash(id) % 96) * 8500;
const OPEN_STATUSES = ['Generated', 'Sent For Approval', 'Approved', 'Ordered', 'Partially Received'];
/* Money, formatted the way the Contract register formats it, so the grid's money chip
   reads the same in both. */
const fmtMoney = (n: number) => `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR`;
/* The money clock: how much of the order has been invoiced, and how much of that paid.
   Both are derived from the SAME deterministic hash as the order value, and the Invoice
   Received / Payment Status fields are read back OFF those amounts — so "Payment Status
   is Paid" and a payment amount equal to the total can never contradict each other. */
const INVOICED_FRACTION = [0, 0.5, 1];
const paidFractionOf = (invoiced: number, n: number) => (invoiced === 0 ? 0 : [0, 0.4, 1][n % 3] * invoiced);

const PU: { rows: Ticket[]; byId: Map<string, Purchase> } = (() => {
  const byId = new Map<string, Purchase>();
  const today = new Date();
  const rows = mockPurchases.map((p) => {
    byId.set(p.id, p);
    const req = parseDMY(p.requiredBy)!;
    const days = Math.ceil((req.getTime() - today.getTime()) / DAY);
    const dueBand = p.status === 'Received' ? 'Delivered' : days < 0 ? 'Overdue' : days <= 14 ? 'Due soon' : 'Scheduled';
    const created = new Date(req.getTime() - 45 * DAY);
    const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const h = hash(p.id);
    const total = orderValueOf(p.id);
    const invFrac = INVOICED_FRACTION[h % 3];
    const invoiced = Math.round(total * invFrac);
    const paid = Math.round(paidFractionOf(invFrac, h >> 2) * total);
    return {
      id: p.id,
      subject: p.name,
      requester: p.vendor.split(': ')[1] ?? p.vendor,
      dueBy: req,
      createdBy: created,
      assignedTo: p.owner ? { name: p.owner, initials: initials(p.owner) } : { name: 'Unassigned', initials: '' },
      status: p.status as Ticket['status'],
      priority: 'Medium',
      x_orderNumber: p.orderNumber,
      x_vendor: p.vendor,
      /* A real Date, not the mock's "24/06/2026" string: the grid prints it in the house
         format like every other date (see dateFormat.ts) AND sorts it chronologically. */
      x_requiredBy: req,
      /* The same value under the key the Required By FILTER reads. */
      requiredOn: req,
      x_totalCost: fmtMoney(total),
      x_invoiceAmount: fmtMoney(invoiced),
      x_paymentAmount: fmtMoney(paid),
      invoiceReceived: INVOICE_RECEIVED_OPTIONS[h % 3],
      paymentStatus: invoiced === 0 ? PAYMENT_STATUS_OPTIONS[0]
        : paid === 0 ? PAYMENT_STATUS_OPTIONS[1]
        : paid < invoiced ? PAYMENT_STATUS_OPTIONS[2]
        : PAYMENT_STATUS_OPTIONS[3],
      x_dueBand: dueBand,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — the Purchase detail page's header story (Status · Required By ·
   Outstanding · Total Payable · Vendor) rolled up across the pipeline. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const total = tickets.length;
  const t = tickets as (Ticket & Record<string, any>)[];
  const vendors = new Set(t.map((x) => x.x_vendor).filter(Boolean)).size;
  const open = t.filter((x) => OPEN_STATUSES.includes(x.status as string));
  const awaiting = t.filter((x) => (x.status as string) === 'Sent For Approval').length;
  const overdue = t.filter((x) => x.x_dueBand === 'Overdue').length;
  const received = t.filter((x) => (x.status as string) === 'Received').length;
  const outstanding = open.reduce((n, x) => n + orderValueOf(x.id), 0);
  const payable = t.reduce((n, x) => n + orderValueOf(x.id), 0);
  const one = (field: string, values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Purchase orders', value: total, sub: `across ${vendors} vendors` },
    {
      label: 'Open orders',
      value: open.length,
      sub: 'not yet fully received',
      hint: 'Show open purchase orders',
      filter: one('status', OPEN_STATUSES),
    },
    {
      label: 'Awaiting approval',
      value: awaiting,
      sub: 'sent for approval',
      hint: 'Show orders awaiting approval',
      filter: one('status', ['Sent For Approval']),
      valueColor: awaiting > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Overdue deliveries',
      value: overdue,
      sub: 'required-by date has passed',
      hint: 'Show overdue deliveries',
      filter: one('x_dueBand', ['Overdue']),
      valueColor: overdue > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Received',
      value: received,
      sub: 'fully delivered and closed out',
      hint: 'Show received orders',
      filter: one('status', ['Received']),
    },
    { label: 'Outstanding', value: fmtINR(outstanding), sub: 'committed on open orders', valueColor: outstanding > 0 ? '#B45309' : undefined },
    { label: 'Total payable', value: fmtINR(payable), sub: 'across every order' },
  ];
};

/* The Dashboard layout — the PO pipeline and its delivery risk. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  return {
    tiles: [
      { icon: ShoppingCart, color: '#3D8BD0', label: 'Purchase orders', value: t.length, sub: 'in the pipeline' },
      {
        icon: PackageOpen, color: '#8B5CF6', label: 'Open orders', value: n((x) => OPEN_STATUSES.includes(x.status)),
        sub: 'not yet fully received', filter: [{ field: 'status', condition: 'is', values: OPEN_STATUSES }], hint: 'Show open orders',
      },
      {
        icon: AlertTriangle, color: '#DC2626', label: 'Overdue deliveries', value: n((x) => x.x_dueBand === 'Overdue'),
        sub: 'required-by date passed', filter: ruleIs('x_dueBand', 'Overdue'), hint: 'Show overdue deliveries',
      },
      {
        icon: Hourglass, color: '#F59E0B', label: 'Awaiting approval', value: n((x) => x.status === 'Sent For Approval'),
        sub: 'stuck at the approver', filter: ruleIs('status', 'Sent For Approval'), hint: 'Show orders awaiting approval',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Order pipeline', centerLabel: 'orders',
        segs: [
          seg('Generated', n((x) => x.status === 'Generated'), '#94A3B8', 'status'),
          seg('Sent For Approval', n((x) => x.status === 'Sent For Approval'), '#F59E0B', 'status'),
          seg('Approved', n((x) => x.status === 'Approved'), '#3D8BD0', 'status'),
          seg('Ordered', n((x) => x.status === 'Ordered'), '#8B5CF6', 'status'),
          seg('Partially Received', n((x) => x.status === 'Partially Received'), '#F97316', 'status'),
          seg('Received', n((x) => x.status === 'Received'), '#22C55E', 'status'),
        ],
      },
      {
        kind: 'donut', title: 'Delivery outlook', centerLabel: 'orders',
        segs: [
          seg('Scheduled', n((x) => x.x_dueBand === 'Scheduled'), '#3D8BD0', 'x_dueBand'),
          seg('Due soon', n((x) => x.x_dueBand === 'Due soon'), '#F59E0B', 'x_dueBand'),
          seg('Overdue', n((x) => x.x_dueBand === 'Overdue'), '#DC2626', 'x_dueBand'),
          seg('Delivered', n((x) => x.x_dueBand === 'Delivered'), '#22C55E', 'x_dueBand'),
        ],
      },
      {
        kind: 'bars', title: 'Vendors', sub: 'orders per vendor',
        rows: countBy(t, 'x_vendor').slice(0, 6).map(([label, value]) => ({
          label: label.split(': ')[1] ?? label, value, color: '#3D8BD0', filter: ruleIs('x_vendor', label),
        })),
      },
      {
        kind: 'bars', title: 'Owners', sub: 'orders per owner',
        rows: countBy(t, 'assignedTo').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#8B5CF6', filter: [{ field: 'assignedTo', condition: 'is', values: [label] }],
        })),
      },
    ],
  };
};

export function PurchasesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="purchases"
      stackModule="purchases"
      viewsStore="purchase"
      noun="purchase"
      moduleCols="purchase"
      defaultViewName="All Purchase Orders"
      footerNoun="orders"
      rows={PU.rows}
      recordOf={(id) => PU.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      mineHint="No purchase orders are owned by you yet — switch back to Overall."
      filterAttrs={PURCHASE_FILTER_ATTRS}
      /* Status is the order's POSITION IN THE WORKFLOW — it moves by approving, ordering
         and receiving, never by picking from a list. The cell reads as plain text. */
      lockedCells={['status']}
      /* One cut: where the order sits in the pipeline. */
      quickFilters={PURCHASE_QUICK_FILTERS}
      searchFields={['x_orderNumber', 'x_vendor', 'x_requiredBy', 'x_totalCost']}
      onNavigate={onNavigate}
    />
  );
}
