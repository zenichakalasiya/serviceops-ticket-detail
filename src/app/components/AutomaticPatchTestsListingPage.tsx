/* ── Automatic Patch Tests listing ───────────────────────────────────────────
   The shared register chrome over `mockAutomaticPatchTests`. The module's own columns —
   ID · Name · Total/Pending/Completed Tests · Last and Next Execution Time · Enable ·
   Actions — now with the filter builder, saved views, grouping and multi-sort.

   TWO layouts, List + KPI and Dashboard, like the rest of the Patch module. A test schedule
   is read for one thing: is the pilot ring actually validating patches, or has it quietly
   stopped? So the strip leads with what is enabled, what is still pending and what has never
   run at all. */
import { useMemo, useState } from 'react';
import { CheckCircle, ListChecks, Power, PowerOff, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { AutomaticPatchTestPanel, runsFor } from './AutomaticPatchTestPanel';
import {
  APT_FILTER_ATTRS, APT_QUICK_FILTERS, aptProgressOf, mockAutomaticPatchTests,
  type AutomaticPatchTest,
} from './automaticPatchTests';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* "Tue, Sep 29, 2026 02:00 AM" → a real Date, so the column sorts chronologically and the
   date buckets read the true value. */
const parseExec = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

/* What the schedule's runs have produced, read off the SAME `runsFor` set the side panel
   renders — so the strip's Patches Tested / Under Observation / Failed Tests and the panel's
   tiles count the same runs. Counts for the headline figures, Yes/No bands for the filters
   (a schedule can hold all three outcomes at once, so one field could not say it). */
const testOutcomesOf = (t: AutomaticPatchTest) => {
  const runs = runsFor(t);
  const passed = runs.filter((r) => r.testStatus === 'Passed').length;
  const failed = runs.filter((r) => r.testStatus === 'Failed').length;
  const observing = runs.filter((r) => r.testStatus === 'In Progress').length;
  return {
    x_testedCount: passed + failed,
    x_passedCount: passed,
    x_failedCount: failed,
    x_observingCount: observing,
    x_tested: passed + failed > 0 ? 'Yes' : 'No',
    x_observing: observing > 0 ? 'Yes' : 'No',
    x_failedTests: failed > 0 ? 'Yes' : 'No',
  };
};

const toRow = (t: AutomaticPatchTest): Ticket => ({
  id: t.id,
  subject: t.name,
  requester: '',
  assignedTo: { name: '', initials: '' },
  dueBy: parseExec(t.nextExecution) ?? new Date(),
  createdBy: parseExec(t.lastExecution) ?? new Date(),
  status: 'Open' as Ticket['status'],
  priority: 'Medium' as Ticket['priority'],
  /* Counts stay NULL where the schedule has none — the grid prints a dash, which is the
     module's own answer for "never built out", not a zero claiming no tests exist. */
  x_totalTests: t.totalTests,
  x_pendingTests: t.pendingTests,
  x_completedTests: t.completedTests,
  x_lastExecution: parseExec(t.lastExecution),
  x_nextExecution: parseExec(t.nextExecution),
  x_enabled: t.enabled ? 'Enabled' : 'Disabled',
  x_createdBy: t.createdBy,
  x_progress: aptProgressOf(t),
  ...testOutcomesOf(t),
} as unknown as Ticket);

const enabledOf = (t: Ticket) => (t as any).x_enabled === 'Enabled';
const pendingOf = (t: Ticket) => Number((t as any).x_pendingTests ?? 0);

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/* Reads as "is the pilot ring doing its job", in the product's own terms: how many schedules
   are live, how many patches they have put through a test, how many are still under
   observation, and how many failed. The three run counts come from the same `runsFor` set
   the side panel renders; clicking one narrows the list to the schedules holding those runs,
   and the sub-line says how many that is. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const sum = (key: string) => rows.reduce((a, t) => a + Number((t as any)[key] ?? 0), 0);
  const holding = (key: string) => rows.filter((t) => (t as any)[key] === 'Yes').length;
  const on = rows.filter(enabledOf);
  const tested = sum('x_testedCount');
  const observing = sum('x_observingCount');
  const failed = sum('x_failedCount');
  return [
    {
      label: 'Active Patch Tests', value: on.length, sub: `${rows.length - on.length} disabled`,
      valueColor: on.length ? '#15803D' : undefined,
      filter: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }],
    },
    {
      label: 'Patches Tested', value: tested, sub: `${sum('x_passedCount')} passed · in ${plural(holding('x_tested'), 'schedule')}`,
      filter: [{ field: 'x_tested', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'Under Observation', value: observing, sub: `results pending in ${plural(holding('x_observing'), 'schedule')}`,
      valueColor: observing ? '#B45309' : undefined,
      filter: [{ field: 'x_observing', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'Failed Tests', value: failed, sub: `in ${plural(holding('x_failedTests'), 'schedule')}`,
      valueColor: failed ? '#DC2626' : undefined,
      filter: [{ field: 'x_failedTests', condition: 'is', values: ['Yes'] }],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;

  const progressSegs = ['All tests passed', 'Tests pending', 'Never run']
    .map((label) => ({
      label,
      value: by((t) => (t as any).x_progress === label),
      color: label === 'All tests passed' ? '#22C55E' : label === 'Tests pending' ? '#F59E0B' : '#94A3B8',
      filter: [{ field: 'x_progress', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const enableRows = ['Enabled', 'Disabled']
    .map((label) => ({
      label, value: by((t) => (t as any).x_enabled === label),
      color: label === 'Enabled' ? '#22C55E' : '#94A3B8',
      filter: [{ field: 'x_enabled', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  const ownerRows = [...new Set(rows.map((t) => String((t as any).x_createdBy)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_createdBy === label), color: '#3D8BD0',
      filter: [{ field: 'x_createdBy', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  /* The schedules with the most outstanding cases — where validation is furthest behind. */
  const backlog = [...rows]
    .filter((t) => pendingOf(t) > 0)
    .sort((a, b) => pendingOf(b) - pendingOf(a))
    .map((t) => ({ label: t.id, value: pendingOf(t), color: '#8B5CF6' }));

  const totalCases = rows.reduce((a, t) => a + Number((t as any).x_totalTests ?? 0), 0);
  const doneCases = rows.reduce((a, t) => a + Number((t as any).x_completedTests ?? 0), 0);
  return {
    tiles: [
      { icon: Power, color: '#22C55E', label: 'Enabled', value: by(enabledOf), sub: `of ${rows.length} schedules`, filter: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }] },
      { icon: PowerOff, color: '#94A3B8', label: 'Disabled', value: rows.length - by(enabledOf), sub: 'will not run again', filter: [{ field: 'x_enabled', condition: 'is', values: ['Disabled'] }] },
      { icon: ListChecks, color: '#F59E0B', label: 'Tests pending', value: rows.reduce((a, t) => a + pendingOf(t), 0), sub: 'cases still to run' },
      { icon: Timer, color: '#DC2626', label: 'Never run', value: by((t) => (t as any).x_progress === 'Never run'), sub: 'scheduled but never executed', filter: [{ field: 'x_progress', condition: 'is', values: ['Never run'] }] },
      { icon: CheckCircle, color: '#3D8BD0', label: 'Cases completed', value: doneCases, sub: `of ${totalCases} across all schedules` },
    ],
    sections: [
      { kind: 'donut', title: 'By test progress', sub: 'Where each schedule stands', centerLabel: 'Schedules', segs: progressSegs },
      { kind: 'columns', title: 'Enable state', sub: 'What is live and what is switched off', rows: enableRows },
      { kind: 'bars', title: 'By owner', sub: 'Who maintains the schedules', rows: ownerRows.slice(0, 6), allRows: ownerRows, panelSubject: 'schedules', panelColumnLabel: 'Created By', panelCountLabel: 'Schedules' },
      { kind: 'bars', title: 'Largest backlogs', sub: 'Schedules with the most cases outstanding', rows: backlog.slice(0, 6), allRows: backlog, panelSubject: 'schedules', panelColumnLabel: 'Schedule', panelCountLabel: 'Pending' },
      {
        kind: 'gauge', title: 'Validation coverage', sub: 'Test cases completed across every schedule',
        pct: totalCases ? Math.round((doneCases / totalCases) * 100) : 0,
        caption: `${doneCases} of ${totalCases} cases completed`,
      },
    ],
  };
};

export function AutomaticPatchTestsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* A schedule has no detail DRAWER — it opens as a side panel, which is what the module
     does and what its two tabs fit. `onOpenRow` is the register's hook for exactly this
     (My Team uses it for the profile panel). */
  const [open, setOpen] = useState<AutomaticPatchTest | null>(null);
  /* The Enable switch writes back, so the rows are state rather than a constant — toggling a
     schedule off has to move it out of the "Enabled" KPI and any applied filter. */
  const [rows, setRows] = useState<Ticket[]>(() => mockAutomaticPatchTests.map(toRow));
  const byId = useMemo(() => new Map(mockAutomaticPatchTests.map((t) => [t.id, t])), []);

  return (
    <>
    <AssetRegisterPage
      activePage="automatic-patch-tests"
      stackModule="automatic-patch-tests"
      viewsStore="apt"
      noun="test schedule"
      moduleCols="apt"
      defaultViewName="Automatic Patch Tests"
      footerNoun="test schedules"
      rows={rows}
      recordOf={(id) => byId.get(id)}
      filterAttrs={APT_FILTER_ATTRS}
      quickFilters={APT_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_createdBy', 'x_enabled']}
      /* No views rail — the panel toggle beside the title goes with it. `APT_VIEWS` stays
         defined (and the store with it), so flipping this back restores them. */
      showViews={false}
      /* No rule builder: a schedule carries a handful of fields and the only cut anyone makes
         here is on/off, which the quick filter already is. The catalogue stays wired, so the
         KPI cards and saved views keep filtering on test progress. */
      showFilterBuilder={false}
      /* ⚠️ Dropping the gear also drops the LAYOUT PICKER and Manage columns with it, so the
         Dashboard built below is no longer reachable from the UI and the optional columns
         cannot be added. The wiring is left in place — removing this one entry brings both
         back. (Same trade-off My Team makes.) */
      hideTools={['export', 'settings']}
      moreActions={[]}
      primaryAction={{ label: 'Create' }}
      primaryActionInTitle
      /* The Enable switch is the one thing this grid edits in place. */
      onUpdateTicket={(id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
      onRowAction={(t, action) => {
        if (action === 'edit') toast(`Edit ${t.id} — coming soon`);
      }}
      /* Clicking the id or the name opens the schedule's panel. */
      onOpenRow={(t) => setOpen(byId.get(t.id) ?? null)}
      onNavigate={onNavigate}
    />
    <AutomaticPatchTestPanel isOpen={!!open} onClose={() => setOpen(null)} test={open} />
    </>
  );
}
