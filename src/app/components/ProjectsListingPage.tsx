/* ── Projects listing ────────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the real `mockProjects`, replacing
   the module's old hand-rolled table: moduleCols="project" keeps the column set it always
   had (ID · Name · Status · Priority · Owner · Start · End · Due By · Completion · Tasks ·
   Milestones) and adds the filter builder, saved views, grouping, multi-sort and inline
   editing every other listing has.

   TWO layouts only — **List** and **Gantt**. A project is a WINDOW, not a moment: the
   list answers "what is in the portfolio", and the timeline answers "what overlaps what",
   which is the question a portfolio actually raises. No board (a project's status is not
   a column you drag it between) and no KPI strip or dashboard.

   Clicks open the real ProjectDrawer through the DrawerStack, exactly as before. */
import { useMemo } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import {
  PROJECT_DEPENDENT_OPTIONS, PROJECT_FILTER_ATTRS, PROJECT_LOCATION_OPTIONS, PROJECT_OWNERS,
  PROJECT_QUICK_FILTERS, PROJECT_RISK_OPTIONS, PROJECT_SOURCE_OPTIONS, PROJECT_TAG_OPTIONS,
  PROJECT_TYPE_OPTIONS, PROJECT_VENDOR_OPTIONS,
} from './projectFilterAttrs';
import { mockProjects, type Project } from './ProjectsListPage';
import { PROJECT_GANTT_EVENT, planSummaryOf } from './ProjectPlanningTab';
import { useDrawerStack } from './DrawerStack';
import type { Ticket } from './TicketListPage';

const initialsOf = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const DAY = 864e5;
/* "2 months 1 week" — the two largest units, the same phrasing the module's old Due By
   column used, so the pill reads as it always did. */
const humanize = (ms: number) => {
  const units: [string, number][] = [['month', 30 * DAY], ['week', 7 * DAY], ['day', DAY], ['hour', 3600e3]];
  const parts: string[] = [];
  let rest = Math.abs(ms);
  for (const [name, size] of units) {
    if (parts.length === 2) break;
    const n = Math.floor(rest / size);
    if (n > 0) { parts.push(`${n} ${name}${n > 1 ? 's' : ''}`); rest -= n * size; }
  }
  return parts.length ? parts.join(' ') : 'less than an hour';
};
/* "2d 4h" — the compact form the shared SLA pill reads in. */
const short = (s: string) =>
  s.replace(/(\d+)\s*months?/gi, '$1mo')
    .replace(/(\d+)\s*weeks?/gi, '$1w')
    .replace(/(\d+)\s*days?/gi, '$1d')
    .replace(/(\d+)\s*hours?/gi, '$1h')
    .trim();

const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (d: Date) => `${LONG[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

/* The project's OWN "SLA": its end date against the clock. The grid's Due By pill and the
   Gantt's bar colour both read this one derivation (`dueBySla` honours a row-supplied
   `x_sla`), so the two views can never disagree about what has slipped. */
const dueOf = (p: Project) => {
  const name = `${p.priority} priority project`;
  const target = p.start && p.end ? humanize(p.end.getTime() - p.start.getTime()) : '—';
  if (!p.end || p.status === 'Cancelled') {
    return { band: 'Met', sla: { tone: 'done' as const, label: '—', name, target, when: 'No end date set' } };
  }
  const when = `Ends ${longDate(p.end)}`;
  if (p.status === 'Completed') {
    return { band: 'Met', sla: { tone: 'done' as const, label: 'Met', name, target, when: `Delivered ${longDate(p.end)}` } };
  }
  const diff = p.end.getTime() - Date.now();
  if (diff < 0) return { band: 'Overdue', sla: { tone: 'breached' as const, label: short(humanize(diff)), name, target, when: `Overdue since ${longDate(p.end)}` } };
  if (diff < 30 * DAY) return { band: 'Due soon', sla: { tone: 'due' as const, label: short(humanize(diff)), name, target, when } };
  return { band: 'On track', sla: { tone: 'ok' as const, label: short(humanize(diff)), name, target, when } };
};

const progressBand = (pct: number) =>
  pct >= 100 ? 'Complete' : pct === 0 ? 'Not started' : pct < 25 ? 'Under 25%' : pct <= 75 ? '25–75%' : 'Over 75%';

/* Health, not lifecycle: is this project going to land? Derived from the two facts that
   actually decide it — how much time is left against how much is done — so the column can
   never contradict the Due By pill or the progress bar sitting beside it. */
const healthOf = (p: Project, band: string) => {
  if (p.status === 'Completed') return 'Delivered';
  if (p.status === 'Cancelled') return 'Delayed';
  if (band === 'Overdue') return 'Delayed';
  if (!p.start || !p.end) return 'On Track';
  const elapsed = (Date.now() - p.start.getTime()) / (p.end.getTime() - p.start.getTime());
  /* More than 15 points behind where the calendar says it should be. */
  return elapsed * 100 - p.completion > 15 ? 'At Risk' : 'On Track';
};

/* Everything the product's attribute list offers that the mock does not store is DERIVED
   from the project id — stable, so a filter cuts the list the same way every time, and
   spread across the option lists so no value is left with nothing in it. */
const hashOf = (id: string) => {
  let n = 7;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  return n;
};
const pick = <T,>(list: T[], h: number, salt: number) => list[(h + salt) % list.length];
const shiftDays = (d: Date, days: number) => new Date(d.getTime() + days * DAY);

const PROJECTS: { rows: Ticket[]; byId: Map<string, Project> } = (() => {
  const byId = new Map<string, Project>();
  const rows = mockProjects.map((p) => {
    byId.set(p.id, p);
    const owner = p.owner ?? 'Unassigned';
    const due = dueOf(p);
    const h = hashOf(p.id);
    /* The project's plan, exactly as the detail page's Planning tab builds it. */
    const plan = planSummaryOf(p);
    /* The Gantt needs a window on every row; a project with no dates gets a same-day one
       rather than crashing the timeline's `dueBy.getTime()`. */
    const start = p.start ?? new Date();
    const end = p.end ?? start;
    return {
      id: p.id,
      subject: p.name,
      requester: owner,
      assignedTo: { name: owner, initials: owner === 'Unassigned' ? '' : initialsOf(owner) },
      /* dueBy/dueEnd ARE the project window — that is what the Gantt draws. */
      dueBy: start,
      dueEnd: end,
      createdBy: start,
      status: p.status as Ticket['status'],
      priority: p.priority as Ticket['priority'],
      /* What the window CONTAINS, as the four numbers a project is reported by — read off
         the very plan the detail page's Planning tab builds, so the card and the tab can
         never disagree. ("Impact" is a change/release word: what a window does to users.
         A project's window is a plan, so the card shows the plan.) */
      stats: [
        { label: 'Tasks', value: plan.tasks },
        { label: 'Completed', value: plan.completed, color: plan.completed ? '#15803D' : undefined },
        { label: 'In progress', value: plan.inProgress, color: plan.inProgress ? '#B45309' : undefined },
        { label: 'Not started', value: plan.notStarted },
        { label: 'Milestones', value: `${plan.milestonesDone}/${plan.milestones}` },
      ],
      statsProgress: p.completion,
      /* The same facts as a sentence, for the rail meter's hover where a stat row has no
         room. */
      windowNote: `${plan.completed} of ${plan.tasks} tasks done · ${plan.milestonesDone} of ${plan.milestones} milestones reached.`,
      x_startDate: p.start,
      x_endDate: p.end,
      x_dueBand: due.band,
      x_sla: due.sla,
      x_completion: p.completion,
      x_progressBand: progressBand(p.completion),
      /* Off the PLAN, like the hover card and the drawer's own header chips — the record
         carries summary fields of its own, but a Tasks column that disagrees with the
         Planning tab you open from it is worse than no column. */
      x_tasks: `${plan.completed}/${plan.tasks}`,
      x_milestones: `${plan.milestonesDone}/${plan.milestones}`,
      /* ── The rest of the product's attribute list. Everything is derivable from the
         project, so every filter cuts the list honestly and an added column shows a true
         value rather than a dash. */
      x_projectStatus: healthOf(p, due.band),
      x_vendor: pick(PROJECT_VENDOR_OPTIONS, h, 0).label,
      x_source: pick(PROJECT_SOURCE_OPTIONS, h, 1).label,
      x_location: pick(PROJECT_LOCATION_OPTIONS, h, 2).label,
      x_risk: p.priority === 'Critical' ? 'High' : p.priority === 'Low' ? 'Low' : pick(PROJECT_RISK_OPTIONS, h, 3).label,
      x_projectType: pick(PROJECT_TYPE_OPTIONS, h, 4).label,
      /* Two tags, never the same one twice. */
      x_tags: [pick(PROJECT_TAG_OPTIONS, h, 5).label, pick(PROJECT_TAG_OPTIONS, h, 8).label]
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', '),
      x_createdBy: pick(PROJECT_OWNERS, h, 6),
      x_lastUpdatedBy: pick(PROJECT_OWNERS, h, 7),
      /* A project is raised a few weeks before it starts, planning runs up to the start,
         and implementation begins a stretch into it — the real shape of a plan. */
      x_createdDate: shiftDays(start, -(14 + (h % 30))),
      x_planningStart: shiftDays(start, -(7 + (h % 14))),
      x_implStart: shiftDays(start, Math.round(((end.getTime() - start.getTime()) / DAY) * 0.2)),
      x_lastUpdatedDate: new Date(Date.now() - (h % 20) * DAY),
      x_closedDate: p.status === 'Completed' || p.status === 'Cancelled' ? end : undefined,
      x_attachment: h % 3 === 0 ? 'No' : 'Yes',
      /* The four admin-created custom fields. */
      x_checkbox: h % 2 === 0 ? 'Yes' : 'No',
      x_textInput: `REF-${1000 + (h % 8999)}`,
      x_dependent: pick(PROJECT_DEPENDENT_OPTIONS, h, 9).label,
      x_datetime: shiftDays(start, h % 21),
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

export function ProjectsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => PROJECTS.rows, []);
  const { open: openInStack } = useDrawerStack();

  return (
    <AssetRegisterPage
      activePage="projects"
      stackModule="projects"
      viewsStore="project"
      noun="project"
      moduleCols="project"
      defaultViewName="All Projects"
      footerNoun="projects"
      rows={rows}
      recordOf={(id) => PROJECTS.byId.get(id)}
      filterAttrs={PROJECT_FILTER_ATTRS}
      /* List and Gantt, and nothing else — the two ways a portfolio is actually read. */
      layouts={['list']}
      showGantt
      /* Projects run for six to twelve months — on the Month grain every bar would start
         and end off-screen. Quarter shows a whole project at once. */
      ganttGrain="quarter"
      /* The rail reports COMPLETION rather than status: the bar is already coloured by
         where the project stands against its end date, so repeating the status there said
         the same thing twice and left the one number a portfolio is read for off screen. */
      ganttProgressOf={(t) => (t as unknown as { x_completion?: number }).x_completion ?? null}
      /* The way out of the hover card: open that project and land on its OWN Gantt — the
         portfolio timeline answers "how do these overlap", its plan answers "what is in
         this one", and this is the step between the two. The drawer opens on Planning by
         itself; the event switches that tab from its list to its Gantt once it mounts. */
      ganttCardAction={{
        label: 'View project Gantt →',
        onClick: (t) => {
          const p = PROJECTS.byId.get(t.id);
          if (!p) return;
          openInStack('projects', p.id, p.name, p);
          /* After the drawer has mounted its Planning tab — the listener lives there. */
          setTimeout(() => window.dispatchEvent(new CustomEvent(PROJECT_GANTT_EVENT)), 120);
        },
      }}
      /* Status and Priority, one click each — the two cuts a portfolio is worked by. */
      quickFilters={PROJECT_QUICK_FILTERS}
      searchFields={['x_dueBand', 'x_progressBand']}
      primaryAction={{ label: 'Create' }}
      primaryActionInTitle
      moreActions={[]}
      onNavigate={onNavigate}
    />
  );
}
