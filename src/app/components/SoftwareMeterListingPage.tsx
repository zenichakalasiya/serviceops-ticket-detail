/* ── Software Meter listing ──────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the metered applications:
   moduleCols="meter" columns (Asset Type · Status · Version · Software Type ·
   Managed By Group · Managed By · Created Date), on the same data-grid every
   other asset register uses.

   The catalogue is the page: the filter builder and Manage-columns list offer
   exactly the attributes the product shows on a metered application — nothing
   inferred, nothing the record cannot answer.

   A metered application IS a software asset, so a click opens the real
   SoftwareAssetDrawer via the DrawerStack, with the record adapted to its shape. */
import { AssetRegisterPage } from './AssetRegisterPage';
import { type DashConfig } from './AssetDashboardView';
import { pctGrade, type StatCard } from './AssetStatsRow';
import { METER_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { METER_FILTER_ATTRS } from './softwareMeterFilterAttrs';
import type { SoftwareAsset } from './SoftwareAssetsListPage';
import type { Ticket } from './TicketListPage';
import { AppWindow, CirclePlay, Gauge, UserRoundX } from 'lucide-react';

export interface MeteredSoftware {
  id: string;
  name: string;
  /** The product's software classification (Application / Microsoft / Linux / …). */
  softwareType: string;
  status: 'In Use' | 'In Stock' | 'Retired';
  version: string;
  managedByGroup: string;
  managedBy: { name: string; initials?: string };
  /** DD/MM/YYYY — when metering started on this application. */
  createdOn: string;
}

/* A real desktop estate: browsers and Office at the top, the security agents that
   run constantly, the engineering tools a handful of people open daily, and the
   long tail nobody has launched since it was pushed — which is the point of the page.
   Versions are the genuine current builds of each product. */
export const mockMeteredSoftware: MeteredSoftware[] = [
  { id: 'AST-563', name: 'Google Chrome', softwareType: 'Application', status: 'In Use', version: '151.0.7922.138', managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta', initials: 'RM' }, createdOn: '13/08/2026' },
  { id: 'AST-561', name: 'Microsoft Edge', softwareType: 'Microsoft', status: 'In Use', version: '139.0.3405.86', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK' }, createdOn: '13/08/2026' },
  { id: 'AST-558', name: 'Microsoft Outlook', softwareType: 'Microsoft', status: 'In Use', version: '16.0.18827.20102', managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta', initials: 'RM' }, createdOn: '02/08/2026' },
  { id: 'AST-556', name: 'Microsoft Excel', softwareType: 'Microsoft', status: 'In Use', version: '16.0.18827.20102', managedByGroup: 'End User Computing', managedBy: { name: 'Neha Raje', initials: 'NR' }, createdOn: '02/08/2026' },
  { id: 'AST-554', name: 'Microsoft Teams', softwareType: 'Microsoft', status: 'In Use', version: '24350.207.3397.6852', managedByGroup: 'End User Computing', managedBy: { name: 'Neha Raje', initials: 'NR' }, createdOn: '28/07/2026' },
  { id: 'AST-551', name: 'CrowdStrike Falcon Sensor', softwareType: 'Application', status: 'In Use', version: '7.22.19507', managedByGroup: 'IT Operations', managedBy: { name: 'Sarah Johnson', initials: 'SJ' }, createdOn: '24/07/2026' },
  { id: 'AST-549', name: 'Adobe Acrobat Reader', softwareType: 'Application', status: 'In Use', version: '25.001.20521', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK' }, createdOn: '24/07/2026' },
  { id: 'AST-546', name: 'Zoom Workplace', softwareType: 'Application', status: 'In Use', version: '6.4.12.51849', managedByGroup: 'End User Computing', managedBy: { name: 'Neha Raje', initials: 'NR' }, createdOn: '19/07/2026' },
  { id: 'AST-544', name: 'Slack', softwareType: 'Application', status: 'In Use', version: '4.42.115', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '19/07/2026' },
  { id: 'AST-541', name: 'Visual Studio Code', softwareType: 'Application', status: 'In Use', version: '1.99.3', managedByGroup: 'IT Operations', managedBy: { name: 'Vikram Sethi', initials: 'VS' }, createdOn: '11/07/2026' },
  { id: 'AST-539', name: 'Git for Windows', softwareType: 'Application', status: 'In Use', version: '2.49.0', managedByGroup: 'IT Operations', managedBy: { name: 'Vikram Sethi', initials: 'VS' }, createdOn: '11/07/2026' },
  { id: 'AST-536', name: 'AnyDesk', softwareType: 'Application', status: 'In Use', version: '8.1.3', managedByGroup: 'Service Desk', managedBy: { name: 'Imran Qureshi', initials: 'IQ' }, createdOn: '06/07/2026' },
  { id: 'AST-534', name: '7-Zip', softwareType: 'Application', status: 'In Use', version: '24.09', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '06/07/2026' },
  { id: 'AST-531', name: 'Notepad++', softwareType: 'Application', status: 'In Use', version: '8.7.9', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '28/06/2026' },
  { id: 'AST-529', name: 'Docker Desktop', softwareType: 'Application', status: 'In Use', version: '4.39.0', managedByGroup: 'Datacenter Team', managedBy: { name: 'Vikram Sethi', initials: 'VS' }, createdOn: '28/06/2026' },
  { id: 'AST-526', name: 'Postman', softwareType: 'Application', status: 'In Use', version: '11.42.3', managedByGroup: 'IT Operations', managedBy: { name: 'Farah Sheikh', initials: 'FS' }, createdOn: '21/06/2026' },
  { id: 'AST-524', name: 'MySQL Workbench', softwareType: 'MySQL', status: 'In Use', version: '8.0.42', managedByGroup: 'Datacenter Team', managedBy: { name: 'Farah Sheikh', initials: 'FS' }, createdOn: '21/06/2026' },
  { id: 'AST-521', name: 'SQL Server Management Studio', softwareType: 'SQLServer', status: 'In Use', version: '20.2.1', managedByGroup: 'Datacenter Team', managedBy: { name: 'Farah Sheikh', initials: 'FS' }, createdOn: '14/06/2026' },
  { id: 'AST-519', name: 'PuTTY', softwareType: 'Application', status: 'In Use', version: '0.83', managedByGroup: 'Network Team', managedBy: { name: 'Tabrez Khan', initials: 'TK' }, createdOn: '14/06/2026' },
  { id: 'AST-516', name: 'WinSCP', softwareType: 'Application', status: 'In Use', version: '6.5.1', managedByGroup: 'Network Team', managedBy: { name: 'Unassigned' }, createdOn: '07/06/2026' },
  { id: 'AST-514', name: 'TeamViewer', softwareType: 'Application', status: 'In Use', version: '15.63.4', managedByGroup: 'Service Desk', managedBy: { name: 'Imran Qureshi', initials: 'IQ' }, createdOn: '07/06/2026' },
  { id: 'AST-511', name: 'IntelliJ IDEA Ultimate', softwareType: 'Application', status: 'In Use', version: '2025.1.2', managedByGroup: 'IT Operations', managedBy: { name: 'Vikram Sethi', initials: 'VS' }, createdOn: '30/05/2026' },
  { id: 'AST-509', name: 'Adobe Photoshop', softwareType: 'Application', status: 'In Use', version: '26.4.0', managedByGroup: 'End User Computing', managedBy: { name: 'Neha Raje', initials: 'NR' }, createdOn: '30/05/2026' },
  { id: 'AST-506', name: 'AutoCAD LT 2026', softwareType: 'Application', status: 'In Use', version: '25.0.46.0', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '23/05/2026' },
  { id: 'AST-504', name: 'VLC media player', softwareType: 'Application', status: 'In Use', version: '3.0.21', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '23/05/2026' },
  { id: 'AST-501', name: 'FileZilla', softwareType: 'Application', status: 'In Stock', version: '3.68.1', managedByGroup: 'Network Team', managedBy: { name: 'Unassigned' }, createdOn: '16/05/2026' },
  { id: 'AST-498', name: 'Forcepoint DLP Endpoint', softwareType: 'Application', status: 'In Use', version: '25.03.1234', managedByGroup: 'IT Operations', managedBy: { name: 'Sarah Johnson', initials: 'SJ' }, createdOn: '16/05/2026' },
  { id: 'AST-495', name: 'Mozilla Firefox ESR', softwareType: 'Application', status: 'In Stock', version: '128.12.0', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '09/05/2026' },
  { id: 'AST-492', name: 'Skype for Business', softwareType: 'Microsoft', status: 'Retired', version: '16.0.17328.20550', managedByGroup: 'End User Computing', managedBy: { name: 'Unassigned' }, createdOn: '09/05/2026' },
  { id: 'AST-489', name: 'Oracle VM VirtualBox', softwareType: 'Application', status: 'Retired', version: '7.1.6', managedByGroup: 'Datacenter Team', managedBy: { name: 'Unassigned' }, createdOn: '02/05/2026' },
];

const ruleIs = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
const countBy = (t: (Ticket & Record<string, any>)[], field: string) => {
  const m = new Map<string, number>();
  t.forEach((x) => {
    const v = field === 'assignedTo' ? x.assignedTo?.name : x[field];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const parseDMY = (s: string): Date => {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d, 12, 32);
};
const ME: { rows: Ticket[]; byId: Map<string, SoftwareAsset> } = (() => {
  const byId = new Map<string, SoftwareAsset>();
  const rows = mockMeteredSoftware.map((m) => {
    /* The record the drawer opens — a metered application is a software asset. */
    byId.set(m.id, {
      id: m.id,
      name: m.name,
      assetType: 'Application',
      status: m.status,
      version: m.version,
      softwareType: m.softwareType === 'Application' ? 'Discovered' : 'Managed',
      managedByGroup: m.managedByGroup,
      managedBy: m.managedBy,
      impact: 'On Users',
      softwareCategory: '---',
    } as SoftwareAsset);
    const created = parseDMY(m.createdOn);
    return {
      id: m.id,
      subject: m.name,
      requester: m.managedBy.name,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: m.managedBy.name, initials: m.managedBy.initials ?? '' },
      status: m.status as Ticket['status'],
      priority: 'Medium',
      managedByGroup: m.managedByGroup,
      x_assetType: 'Application',
      x_version: m.version,
      x_softwareType: m.softwareType,
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — metering's own story: what runs, what does not, and what that
   costs in seats nobody is using. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const st = (s: string) => t.filter((x) => (x.status as string) === s).length;
  const inUse = st('In Use');
  const retired = st('Retired');
  const unowned = t.filter((x) => x.assignedTo?.name === 'Unassigned').length;
  const types = new Set(t.map((x) => x.x_softwareType).filter(Boolean)).size;
  const groups = new Set(t.map((x) => x.managedByGroup).filter(Boolean)).size;
  const deployedPct = t.length ? Math.round((inUse / t.length) * 100) : 0;
  const one = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Metered applications', value: t.length, sub: `across ${types} software types` },
    {
      label: 'In use',
      value: inUse,
      sub: `${deployedPct}% of the metered estate`,
      hint: 'Show applications in use',
      filter: one('status', 'In Use'),
      valueColor: pctGrade(deployedPct),
    },
    {
      label: 'In stock',
      value: st('In Stock'),
      sub: 'metered but not deployed',
      hint: 'Show applications in stock',
      filter: one('status', 'In Stock'),
    },
    {
      label: 'Retired still installed',
      value: retired,
      sub: 'past end of life, still on endpoints',
      hint: 'Show retired applications',
      filter: one('status', 'Retired'),
      valueColor: retired > 0 ? '#B45309' : '#15803D',
    },
    {
      label: 'No owner',
      value: unowned,
      sub: 'nobody accountable for the app',
      hint: 'Show applications with no owner',
      filter: one('assignedTo', 'Unassigned'),
      valueColor: unowned > 0 ? '#B45309' : undefined,
    },
    { label: 'Managing groups', value: groups, sub: 'teams holding these applications' },
  ];
};

/* The Dashboard layout — what is metered, of what kind, and who holds it. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  return {
    tiles: [
      { icon: Gauge, color: '#3D8BD0', label: 'Metered applications', value: t.length, sub: 'under metering' },
      {
        icon: CirclePlay, color: '#22C55E', label: 'In use', value: n((x) => x.status === 'In Use'),
        sub: 'deployed on endpoints', filter: ruleIs('status', 'In Use'), hint: 'Show applications in use',
      },
      {
        icon: AppWindow, color: '#8B5CF6', label: 'Retired installed', value: n((x) => x.status === 'Retired'),
        sub: 'past end of life', filter: ruleIs('status', 'Retired'), hint: 'Show retired applications',
      },
      {
        icon: UserRoundX, color: '#F59E0B', label: 'No owner', value: n((x) => x.assignedTo?.name === 'Unassigned'),
        sub: 'nobody accountable', filter: ruleIs('assignedTo', 'Unassigned'), hint: 'Show applications with no owner',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Lifecycle', centerLabel: 'applications',
        segs: [
          seg('In Use', n((x) => x.status === 'In Use'), '#22C55E', 'status'),
          seg('In Stock', n((x) => x.status === 'In Stock'), '#3D8BD0', 'status'),
          seg('Retired', n((x) => x.status === 'Retired'), '#94A3B8', 'status'),
        ],
      },
      {
        kind: 'bars', title: 'Software types', sub: 'applications per type',
        rows: countBy(t, 'x_softwareType').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_softwareType', label),
        })),
      },
      {
        kind: 'bars', title: 'Managed by group', sub: 'applications per group',
        rows: countBy(t, 'managedByGroup').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#8B5CF6', filter: ruleIs('managedByGroup', label),
        })),
      },
      {
        kind: 'bars', title: 'Owners', sub: 'applications per owner',
        rows: countBy(t, 'assignedTo').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#22C55E', filter: [{ field: 'assignedTo', condition: 'is', values: [label] }],
        })),
      },
    ],
  };
};

export function SoftwareMeterListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <AssetRegisterPage
      activePage="software-meter"
      stackModule="software-assets"
      viewsStore="meter"
      noun="application"
      moduleCols="meter"
      defaultViewName="All Metered Software"
      footerNoun="applications"
      rows={ME.rows}
      recordOf={(id) => ME.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      filterAttrs={METER_FILTER_ATTRS}
      /* The column set is fixed by the module — no Columns picker in the gear menu, and no
         Insert / Change Column in a column's header menu. */
      allowColumnEdit={false}
      /* Nothing is imported into a meter — the agent reports what it finds — so the ⋮
         menu has no actions, and goes. */
      moreActions={[]}
      /* Status, then how hard the application is actually being used. */
      quickFilters={METER_QUICK_FILTERS}
      searchFields={['x_version', 'x_softwareType']}
      onNavigate={onNavigate}
    />
  );
}
