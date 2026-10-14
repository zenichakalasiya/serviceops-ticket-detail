/* ── Tasks listing ───────────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockTasks:
   moduleCols="task" columns (Subject · Reference · Task Type · Status · Priority · SLA
   Status), with the module's own filter catalogue, quick filters and saved views.

   No navigation rail: a task is found by what it IS (status, priority, whose it is), not by
   where it lives — the quick filters and the views rail cover that.

   Clicks open the real TaskDrawer through the DrawerStack, and the Reference cell opens the
   record the task hangs off, exactly as the old table did. */
import { useMemo } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { TASK_QUICK_FILTERS } from './TicketFilterBar';
import { TASK_FILTER_ATTRS } from './taskFilterAttrs';
import { mockTasks, taskToPatchShape, type TaskRow } from './TasksListPage';
import { toast } from 'sonner';
import { useDrawerStack } from './DrawerStack';
import { CURRENT_USER } from './technicianRoster';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const initialsOf = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/* A task names its parent's MODULE; the drawer stack names relation TYPES. */
const REF_TYPE: Record<string, string> = { request: 'Request', problem: 'Problem', change: 'Change', release: 'Release' };

/* What each parent record is actually CALLED. A reference id alone ("PRB-1004") says
   nothing about what the task is in aid of, so the cell shows this on hover and the parent
   opens under its own name rather than borrowing the task's. */
const REF_SUBJECTS: Record<string, string> = {
  'REQ-00812718': 'Access to the finance reporting dashboard',
  'REQ-00812735': 'Employee onboarding — Priya Deshmukh',
  'REQ-00812740': 'New starter equipment for the Pune office',
  'INC-27': 'Shared drive not reachable from the second floor',
  'INC-31': 'Employee Onboarding',
  'INC-32': 'My Internet Down',
  'PRB-599': 'Payment module fails intermittently after deploy',
  'PRB-627': 'Mailbox migrations stall overnight',
  'PRB-1002': 'Payroll database backups unverified',
  'PRB-1004': 'Packet loss on the third-floor switch',
  'CHG-976': 'Firewall rule change for the DMZ',
  'CHG-2085': 'Retire the legacy file server',
  'CHG-2088': 'Upgrade the core switch firmware',
  'CHG-2091': 'Quarterly infrastructure maintenance window',
  'KB-1': 'Connecting to the Company VPN',
};

/* Tasks carry no created date of their own, so the grid's date column is seeded from the id:
   the ids run newest-first, which is the order a queue is read in anyway. */
const createdOf = (id: string, i: number) => new Date(2026, 6, 31, 18, 0) - i * 36e5;

/* "2 days 4 hours overdue" → "2d 4h": the compact form the SLA pill reads in. */
const shortDuration = (s: string) =>
  s.replace(/\s*overdue\s*$/i, '')
    .replace(/(\d+)\s*weeks?/gi, '$1w')
    .replace(/(\d+)\s*days?/gi, '$1d')
    .replace(/(\d+)\s*hours?/gi, '$1h')
    .replace(/(\d+)\s*minutes?/gi, '$1m')
    .trim();

const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDateTime = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  return `${LONG[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};
/* How long a task of each priority is given — the "Total time" the pill's hover states. */
const TASK_TARGET: Record<string, string> = { Urgent: '4 hours', High: '1 day', Medium: '3 days', Low: '5 days' };

/* The task's OWN SLA, rather than the request queue's derivation from an id: a finished task
   has met it, an overdue one has breached it by the amount the row already records, and the
   rest sit due-soon or on-track by priority. The grid reads this straight off the row. */
const slaOf = (t: TaskRow, due: Date) => {
  const name = `Task SLA — ${t.priority}`;
  const target = TASK_TARGET[t.priority] ?? '3 days';
  if (t.overdueBy) {
    return { tone: 'breached', label: shortDuration(t.overdueBy), name, target, when: `Overdue since ${longDateTime(due)}` };
  }
  if (['Closed', 'Resolved', 'Rejected'].includes(t.status)) {
    return { tone: 'done', label: 'Met', name, target, when: `Met ${longDateTime(due)}` };
  }
  const when = `Due by ${longDateTime(due)}`;
  const n = Number(t.id.replace(/\D/g, ''));
  if (t.priority === 'Urgent' || t.priority === 'High') {
    return { tone: 'due', label: ['4h', '1h 20m', '45m', '2h 10m'][n % 4], name, target, when };
  }
  return { tone: 'ok', label: ['1d 6h', '2d 3h', '1w 2d', '5d 6h'][n % 4], name, target, when };
};

const TASKS: { rows: Ticket[]; byId: Map<string, TaskRow> } = (() => {
  const byId = new Map<string, TaskRow>();
  const rows = mockTasks.map((t, i) => {
    byId.set(t.id, t);
    const created = new Date(createdOf(t.id, i));
    return {
      id: t.id,
      subject: t.subject,
      requester: t.assignee,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: t.assignee, initials: initialsOf(t.assignee) },
      status: t.status as Ticket['status'],
      priority: t.priority as Ticket['priority'],
      x_reference: t.reference ?? '',
      /* The parent's own name — the cell shows it on hover. */
      x_referenceSubject: t.reference ? REF_SUBJECTS[t.reference] ?? '' : '',
      x_taskType: t.taskType,
      x_overdueBy: t.overdueBy ?? '',
      /* The SLA the pill renders, and the filterable word for the same fact. */
      x_sla: slaOf(t, created),
      x_overdue: { breached: 'Breached', due: 'Due soon', ok: 'On track', done: 'Met' }[slaOf(t, created).tone],
    } as Ticket;
  });
  return { rows, byId };
})();

/* The KPI strip: what a technician wants to know about the queue before working it — how
   much is live, what has slipped, what is theirs, what is waiting on someone else. Each card
   applies the filter it describes, so the number and the list can never disagree. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const open = rows.filter((t) => !['Closed', 'Resolved', 'Rejected'].includes(t.status as string));
  const overdue = rows.filter((t) => (t as any).x_overdue === 'Breached');
  const mine = open.filter((t) => t.assignedTo.name === CURRENT_USER);
  const urgent = open.filter((t) => (t.priority as string) === 'Urgent' || (t.priority as string) === 'High');
  const held = rows.filter((t) => (t.status as string) === 'Pending');
  return [
    { label: 'Open tasks', value: open.length, sub: `of ${rows.length} total`,
      filter: [{ field: 'status', condition: 'is not', values: ['Closed', 'Resolved', 'Rejected'] }] },
    { label: 'SLA breached', value: overdue.length, sub: 'past their due date', valueColor: overdue.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_overdue', condition: 'is', values: ['Breached'] }] },
    { label: 'Assigned to me', value: mine.length, sub: 'still open',
      filter: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }, { field: 'status', condition: 'is not', values: ['Closed', 'Resolved', 'Rejected'] }] },
    { label: 'Urgent or high', value: urgent.length, sub: `of ${open.length} open`,
      filter: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }, { field: 'status', condition: 'is not', values: ['Closed', 'Resolved', 'Rejected'] }] },
    { label: 'Pending', value: held.length, sub: 'waiting on someone else',
      filter: [{ field: 'status', condition: 'is', values: ['Pending'] }] },
  ];
};

export function TasksListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => TASKS.rows, []);
  const { openRelation } = useDrawerStack();

  return (
    <AssetRegisterPage
      activePage="tasks"
      stackModule="tasks"
      viewsStore="task"
      noun="task"
      moduleCols="task"
      defaultViewName="All Tasks"
      footerNoun="tasks"
      rows={rows}
      recordOf={(id) => { const t = TASKS.byId.get(id); return t ? taskToPatchShape(t) : undefined; }}
      filterAttrs={TASK_FILTER_ATTRS}
      quickFilters={TASK_QUICK_FILTERS}
      /* Three layouts, as on the request listing: the KPI strip for the shape of the queue,
         the plain list to work it, and the board for where everything stands. No Dashboard —
         a task has no SLA or cost story to chart. */
      layouts={['list-kpi', 'list', 'kanban']}
      buildCards={buildCards}
      /* A task card leads with the record it hangs off — "what is this for?" is the first
         question a board of tasks raises. */
      defaultCardFields={['id', 'reference', 'sla', 'subject', 'assignedTo', 'status', 'priority']}
      searchFields={['x_reference', 'x_referenceSubject', 'x_taskType', 'x_overdueBy']}
      primaryAction={{ label: 'Create' }}
      primaryActionInTitle
      /* Tasks are raised from the record they belong to, not imported in bulk — so the ⋮ has
         nothing to hold and goes with its items. */
      moreActions={[]}
      /* The Reference cell is the one row control here: it opens the parent record.
         It goes through `openRelation` rather than `open`, so the parent arrives seeded from
         its own module's mock pool — opening it with an empty record renders a blank drawer. */
      onRowAction={(row, action) => {
        if (action === 'edit' || action === 'delete') {
          toast(`${action === 'edit' ? 'Edit' : 'Delete'} task — ${row.id}`, { description: 'Coming soon' });
          return;
        }
        if (action !== 'open-reference') return;
        const t = TASKS.byId.get(row.id);
        if (!t?.reference || !t.referenceModule) return;
        openRelation({
          ticketId: t.reference,
          subject: REF_SUBJECTS[t.reference] ?? t.subject,
          type: REF_TYPE[t.referenceModule],
          status: t.status,
          priority: t.priority,
          assignedTo: { name: t.assignee },
        });
      }}
      onNavigate={onNavigate}
    />
  );
}
