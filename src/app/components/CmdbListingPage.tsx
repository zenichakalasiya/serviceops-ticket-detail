/* ── CMDB (Base CI) listing ──────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockCis pool, with
   the module's own columns unchanged — ID · Name (agent-health dot) · CI Type ·
   Status · Host Name · IP Address · Used By · Managed By Group · Managed By.

   What is new is the CI-CLASS RAIL down the left: a configuration database is
   navigated by class, so picking "Network Device" or "Virtualization" narrows the
   grid to those CIs, with a count on every node. Picking a parent includes
   everything beneath it — a CI recorded against the parent class is still one of
   those things. The class filter is separate from the filter bar on purpose: the
   rail answers "what kind of thing", the filter bar answers everything else, and
   the two compose.

   Clicks open the real CmdbDrawer (the dependency-map-first CI page) via the
   DrawerStack, exactly as the old listing did. */
import { useMemo, useState } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { CI_ROOT, CmdbCategoryRail, typesForClass } from './CmdbCategoryRail';
import { type DashConfig } from './AssetDashboardView';
import { pctGrade, type StatCard } from './AssetStatsRow';
import { CMDB_QUICK_FILTERS, type FilterRule } from './TicketFilterBar';
import { CMDB_FILTER_ATTRS } from './cmdbFilterAttrs';
import { mockCis, type Ci } from './CmdbListPage';
import type { Ticket } from './TicketListPage';
import { Boxes, FileStack, HeartPulse, Import, Server, ShieldCheck } from 'lucide-react';

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

/* The dot the Name column carries is the agent's health, so it reads back as a value the
   filter and the KPI cards can both use. A CI with no agent (a service, a rack, a cloud
   subscription) has no dot at all — that is not a fault, it is a class with nothing to
   install an agent on. */
const healthOf = (dot?: string) => (dot === '#22C55E' ? 'Healthy' : dot === '#EAB308' ? 'Warning' : 'No Agent');

/* Who uses a CI, the way the hardware register reads it: a primary name plus a "+N" for
   everyone else. The two cases are genuinely different, so they are answered differently —
   a laptop or a phone belongs to ONE person (the mock names them, or the roster supplies
   one), while a server, a switch or a service is used by the team that runs it and a long
   tail beyond. Deterministic per id, so the count never moves between renders. */
const PERSONAL_CLASS = /laptop|desktop|mobile|tablet/i;
const USERS = [
  'Aarav Sharma', 'Priya Nair', 'Karan Malhotra', 'Diya Kapoor', 'Ananya Iyer',
  'Meera Joshi', 'Siddharth Rao', 'Rahul Verma',
];
const ENVIRONMENTS = ['Production', 'Staging', 'Development', 'DR'];
const LOCATIONS = ['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote'];

const CM: { rows: Ticket[]; byId: Map<string, Ci> } = (() => {
  const byId = new Map<string, Ci>();
  const rows = mockCis.map((c) => {
    byId.set(c.id, c);
    const h = hash(c.id);
    const personal = PERSONAL_CLASS.test(c.ciType);
    /* Discovery dates, newest ids first — the list reads as a database that has been
       filling up rather than one seeded in a single afternoon. */
    const created = new Date(2026, h % 9, 1 + (h % 27), 8 + (h % 9), (h % 4) * 15);
    return {
      id: c.id,
      subject: c.name,
      requester: c.usedBy ?? 'Unassigned',
      dueBy: created,
      createdBy: created,
      assignedTo: c.managedBy
        ? { name: c.managedBy.name, initials: c.managedBy.initials ?? '' }
        : { name: 'Unassigned', initials: '' },
      status: c.status as Ticket['status'],
      priority: 'Medium',
      managedByGroup: c.managedByGroup,
      x_nameDot: c.nameDot,
      x_agentHealth: healthOf(c.nameDot),
      x_ciType: c.ciType,
      x_hostName: c.hostName,
      x_ipAddress: c.ipAddress,
      /* Used By is the hardware register's multi-user cell, which reads the label and the
         "+N" count off the row (see PERSONAL_CLASS above). */
      usedByLabel: personal ? c.usedBy ?? USERS[h % USERS.length] : c.usedBy ?? c.managedByGroup,
      /* Capped by the roster the picker offers — the grid reads the real names back off
         this count, so a number larger than the roster could never be selected. */
      usedByMore: personal ? 0 : 2 + (h % 14),
      x_environment: ENVIRONMENTS[h % ENVIRONMENTS.length],
      x_location: LOCATIONS[h % LOCATIONS.length],
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip — what the database holds, and where it is unreliable. A CMDB is only
   worth what its weakest records are worth, so the cards lead with the gaps: agents that
   stopped reporting, CIs with no state, CIs with no owner. */
const buildCards = (tickets: Ticket[]): StatCard[] => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const classes = new Set(t.map((x) => x.x_ciType).filter(Boolean)).size;
  const operational = t.filter((x) => (x.status as string) === 'Operational').length;
  const down = t.filter((x) => (x.status as string) === 'Non-Operational').length;
  const maint = t.filter((x) => (x.status as string) === 'In Maintenance').length;
  const retired = t.filter((x) => (x.status as string) === 'Retired').length;
  const agented = t.filter((x) => x.x_agentHealth !== 'No Agent');
  const warning = t.filter((x) => x.x_agentHealth === 'Warning').length;
  const unowned = t.filter((x) => x.assignedTo?.name === 'Unassigned').length;
  const healthyPct = agented.length
    ? Math.round((agented.filter((x) => x.x_agentHealth === 'Healthy').length / agented.length) * 100)
    : 100;
  const opPct = t.length ? Math.round((operational / t.length) * 100) : 0;
  const one = (field: string, ...values: string[]): Omit<FilterRule, 'id'>[] => [{ field, condition: 'is', values }];
  return [
    { label: 'Configuration items', value: t.length, sub: `across ${classes} CI types` },
    {
      label: 'Operational',
      value: operational,
      sub: `${opPct}% of the database`,
      hint: 'Show operational CIs',
      filter: one('status', 'Operational'),
      valueColor: pctGrade(opPct),
    },
    {
      label: 'Non-operational',
      value: down,
      sub: 'down and still on the books',
      hint: 'Show non-operational CIs',
      filter: one('status', 'Non-Operational'),
      valueColor: down > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'In maintenance',
      value: maint,
      sub: 'under planned work',
      hint: 'Show CIs in maintenance',
      filter: one('status', 'In Maintenance'),
      valueColor: maint > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Retired',
      value: retired,
      sub: 'out of service, not yet removed',
      hint: 'Show retired CIs',
      filter: one('status', 'Retired'),
    },
    {
      label: 'Agent health',
      value: `${healthyPct}%`,
      sub: `${agented.length} CIs report an agent`,
      valueColor: pctGrade(healthyPct),
    },
    {
      label: 'Agent warnings',
      value: warning,
      sub: 'last check-in went stale',
      hint: 'Show CIs whose agent is warning',
      filter: one('x_agentHealth', 'Warning'),
      valueColor: warning > 0 ? '#B45309' : '#15803D',
    },
    {
      label: 'No owner',
      value: unowned,
      sub: 'nobody accountable for the CI',
      hint: 'Show CIs with no owner',
      filter: one('assignedTo', 'Unassigned'),
      valueColor: unowned > 0 ? '#B45309' : undefined,
    },
  ];
};

/* The Dashboard layout — the shape of the database and the state of its records. */
const buildDashboard = (tickets: Ticket[]): DashConfig => {
  const t = tickets as (Ticket & Record<string, any>)[];
  const n = (f: (x: any) => boolean) => t.filter(f).length;
  const seg = (label: string, value: number, color: string, field: string) => ({
    label, value, color, filter: ruleIs(field, label),
  });
  return {
    tiles: [
      { icon: Boxes, color: '#3D8BD0', label: 'Configuration items', value: t.length, sub: 'in the database' },
      {
        icon: ShieldCheck, color: '#22C55E', label: 'Operational', value: n((x) => x.status === 'Operational'),
        sub: 'running as expected', filter: ruleIs('status', 'Operational'), hint: 'Show operational CIs',
      },
      {
        icon: HeartPulse, color: '#F59E0B', label: 'Agent warnings', value: n((x) => x.x_agentHealth === 'Warning'),
        sub: 'check-in went stale', filter: ruleIs('x_agentHealth', 'Warning'), hint: 'Show CIs whose agent is warning',
      },
      {
        icon: Server, color: '#8B5CF6', label: 'No owner', value: n((x) => x.assignedTo?.name === 'Unassigned'),
        sub: 'nobody accountable', filter: ruleIs('assignedTo', 'Unassigned'), hint: 'Show CIs with no owner',
      },
    ],
    sections: [
      {
        kind: 'donut', title: 'Status', centerLabel: 'CIs',
        segs: [
          seg('Operational', n((x) => x.status === 'Operational'), '#22C55E', 'status'),
          seg('Non-Operational', n((x) => x.status === 'Non-Operational'), '#DC2626', 'status'),
          seg('In Maintenance', n((x) => x.status === 'In Maintenance'), '#F59E0B', 'status'),
          seg('Retired', n((x) => x.status === 'Retired'), '#94A3B8', 'status'),
        ],
      },
      {
        kind: 'donut', title: 'Agent health', centerLabel: 'CIs',
        segs: [
          seg('Healthy', n((x) => x.x_agentHealth === 'Healthy'), '#22C55E', 'x_agentHealth'),
          seg('Warning', n((x) => x.x_agentHealth === 'Warning'), '#EAB308', 'x_agentHealth'),
          seg('No Agent', n((x) => x.x_agentHealth === 'No Agent'), '#94A3B8', 'x_agentHealth'),
        ],
      },
      {
        kind: 'bars', title: 'CI types', sub: 'items per type',
        rows: countBy(t, 'x_ciType').slice(0, 8).map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_ciType', label),
        })),
        allRows: countBy(t, 'x_ciType').map(([label, value]) => ({
          label, value, color: '#3D8BD0', filter: ruleIs('x_ciType', label),
        })),
      },
      {
        kind: 'bars', title: 'Managed by group', sub: 'items per group',
        rows: countBy(t, 'managedByGroup').slice(0, 6).map(([label, value]) => ({
          label, value, color: '#8B5CF6', filter: ruleIs('managedByGroup', label),
        })),
      },
    ],
  };
};

export function CmdbListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* The selected CI class — the rail's state, held here so the page can hand the register
     an already-narrowed set of rows. It starts at the root, Base CI, which every CI hangs
     off: the database opens showing all of itself, with the class tree beneath it. */
  const [ciClass, setCiClass] = useState<string | null>(CI_ROOT);

  /* Counts are taken from the WHOLE database, not the current slice: a rail whose numbers
     moved every time you clicked it would be unreadable. */
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    CM.rows.forEach((r) => {
      const k = (r as any).x_ciType as string;
      if (k) m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, []);

  const rows = useMemo(() => {
    /* The root is the whole database — filtered by its own leaves it would drop any CI
       whose class the tree has not caught up with yet, which is the one thing a CMDB must
       never do quietly. */
    if (!ciClass || ciClass === CI_ROOT) return CM.rows;
    const types = typesForClass(ciClass);
    if (!types) return CM.rows;
    const set = new Set(types);
    return CM.rows.filter((r) => set.has((r as any).x_ciType));
  }, [ciClass]);

  return (
    <AssetRegisterPage
      /* Paging, selection and any drill-down reset when the class changes — landing on page
         7 of a 4-row class would just look broken. Deliberately NOT a `key`: remounting
         would take the rail down with it and forget which branches were open. */
      resetKey={ciClass}
      activePage="cmdb"
      stackModule="cmdb"
      viewsStore="cmdb"
      noun="CI"
      moduleCols="cmdb"
      defaultViewName={ciClass ?? 'All CI'}
      footerNoun="CIs"
      rows={rows}
      recordOf={(id) => CM.byId.get(id)}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      filterAttrs={CMDB_FILTER_ATTRS}
      quickFilters={CMDB_QUICK_FILTERS}
      /* The module's own ⋮ actions, replacing the generic "Import <noun>". */
      moreActions={[
        { key: 'ci-in-stage', label: 'CI In Stage', icon: FileStack },
        { key: 'import-ci', label: 'Import CI', icon: Import },
      ]}
      searchFields={['x_ciType', 'x_hostName', 'x_ipAddress', 'usedByLabel']}
      rail={({ collapsed, expand }) => (
        <CmdbCategoryRail
          counts={counts}
          active={ciClass}
          onSelect={setCiClass}
          forceCollapsed={collapsed}
          onExpand={expand}
        />
      )}
      railLabel="CMDB"
      onNavigate={onNavigate}
    />
  );
}
