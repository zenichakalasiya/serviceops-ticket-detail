import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Calendar,
  ChartGantt,
  GripVertical,
  Check,
  ListChecks,
  ListTree,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Clock,
  Diamond,
  Filter,
  List as ListIcon,
  Plus,
  Search,
  SquarePen,
  Trash2,
  User,
  Waypoints,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from './ProjectsListPage';
import { DepGraphModal, DepPickerPanel } from './PlanDependencies';
import { ProjectGanttView } from './ProjectGanttView';

/* ── Project Planning tab ────────────────────────────────────────────────────
   Replaces the product's two-screen "Edit Planning" flow: everything — tasks,
   summary tasks, milestones, the project window — is added, edited and deleted
   INLINE in this tab, in List or Gantt view. */

export type PlanKind = 'summary' | 'task' | 'milestone';
export interface PlanItem {
  id: string;
  kind: PlanKind;
  name: string;
  assignee: string | null;
  start: Date;
  end: Date; // milestone: end === start
  progress: number; // 0-100
  status: 'Open' | 'In Progress' | 'Pending' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  /** Task dot color — user-pickable label color (tasks only; milestones stay amber). */
  color?: string;
  /** Dependency links: ids of items THIS one depends on (its predecessors). */
  preds?: string[];
  parentId: string | null;
}

const TASK_DOT_COLORS = ['#3D8BD0', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#0D9488', '#64748B'];

export const PLAN_STATUS_DOT: Record<PlanItem['status'], string> = {
  Open: '#3D8BD0',
  'In Progress': '#6366F1',
  Pending: '#fb923c',
  Closed: '#22A06B',
};
export const PLAN_PRIORITY_DOT: Record<PlanItem['priority'], string> = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#F97316',
  Urgent: '#DC2626',
};

const ASSIGNEES = ['Arjun Mehta', 'Priya Sharma', 'Rahul Deshmukh', 'Sneha Iyer', 'Vikram Singh', 'Kavita Rao', 'Rohan Mehta', 'Neha Raje'];
const AVATAR_COLORS = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const DAY = 864e5;
const dayFloor = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDY = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromInput = (s: string, fallback: Date) => (s ? new Date(`${s}T09:00`) : fallback);
const durLabel = (a: Date, b: Date) => {
  const days = Math.max(1, Math.round((dayFloor(b).getTime() - dayFloor(a).getTime()) / DAY) + 1);
  return `${days} day${days > 1 ? 's' : ''}`;
};

/* Deterministic seed: three delivery phases inside the project window, each
   with tasks and a closing milestone — stable per project id. */
const seedPlan = (project: Project | null): PlanItem[] => {
  const h = project ? [...project.id].reduce((a, c) => a + c.charCodeAt(0), 0) : 7;
  const start = project?.start ?? new Date();
  const end = project?.end ?? new Date(start.getTime() + 90 * DAY);
  const span = Math.max(20 * DAY, end.getTime() - start.getTime());
  const at = (f: number) => new Date(start.getTime() + span * f);
  const phases: { name: string; tasks: string[]; milestone: string }[] = [
    {
      name: 'Planning & Design',
      tasks: ['Finalize scope with the business sponsor', 'Solution architecture sign-off', 'Resource and budget allocation'],
      milestone: 'Charter approved',
    },
    {
      name: 'Implementation',
      tasks: ['Environment build-out', 'Core configuration and integration', 'Data migration dry run', 'Security review'],
      milestone: 'UAT sign-off',
    },
    {
      name: 'Rollout & Handover',
      tasks: ['Pilot group rollout', 'Production cutover', 'Ops handover and documentation'],
      milestone: 'Go-live complete',
    },
  ];
  const items: PlanItem[] = [];
  let n = 0;
  const bounds = [
    [0, 0.3],
    [0.3, 0.75],
    [0.75, 1],
  ];
  /* The plan is driven by the project's OWN completion, not a fixed progression: work
     finishes in schedule order, so everything that ends before the completion mark is
     closed, whatever straddles it is in progress, and the rest has not started. Without
     this a project the record calls 100% complete showed a half-done plan — and the
     listing's hover card, which prints both the percentage and these counts, put the
     contradiction on one line. */
  const doneAt = Math.max(0, Math.min(1, (project?.completion ?? 0) / 100));
  const progFor = (a: number, b: number) =>
    doneAt >= b ? 100 : doneAt <= a ? 0 : Math.round(((doneAt - a) / Math.max(b - a, 1e-6)) * 100);
  phases.forEach((ph, pi) => {
    const [f0, f1] = bounds[pi];
    const sumId = `TA-${7600 + h % 40 + n++}`;
    items.push({ id: sumId, kind: 'summary', name: ph.name, assignee: null, start: at(f0), end: at(f1), progress: 0, status: 'Open', priority: 'Medium', parentId: null });
    ph.tasks.forEach((t, ti) => {
      const tf0 = f0 + ((f1 - f0) * ti) / ph.tasks.length;
      const tf1 = f0 + ((f1 - f0) * (ti + 1.15)) / ph.tasks.length;
      const prog = progFor(tf0, Math.min(tf1, f1));
      items.push({
        id: `TA-${7600 + h % 40 + n++}`,
        kind: 'task',
        name: t,
        assignee: ASSIGNEES[(h + n) % ASSIGNEES.length],
        start: at(tf0),
        end: at(Math.min(tf1, f1)),
        progress: prog,
        status: prog === 100 ? 'Closed' : prog > 0 ? 'In Progress' : 'Open',
        priority: (['High', 'Medium', 'Medium', 'Low', 'Urgent'] as const)[(h + n) % 5],
        parentId: sumId,
      });
      /* Sub-tasks live UNDER a task (parentId = the task) — the first task of the
         Implementation and Rollout phases carries a few, mixed done/undone. */
      const SUBS: Record<string, string[]> = {
        'Environment build-out': ['Provision virtual servers', 'Configure VLANs and firewall rules', 'Install base OS images'],
        'Pilot group rollout': ['Select the pilot cohort', 'Collect pilot feedback'],
      };
      const tid = items[items.length - 1].id;
      (SUBS[t] ?? []).forEach((name, si, all) => {
        /* A sub-task takes its share of its parent's span, and the same rule decides
           whether it is done — so a parent at 40% cannot hold three finished children. */
        const sa = tf0 + ((Math.min(tf1, f1) - tf0) * si) / all.length;
        const sb = tf0 + ((Math.min(tf1, f1) - tf0) * (si + 1)) / all.length;
        const prog2 = progFor(sa, sb);
        items.push({
          id: `TA-${7600 + h % 40 + n++}`,
          kind: 'task',
          name,
          assignee: ASSIGNEES[(h + n + si) % ASSIGNEES.length],
          start: at(sa),
          end: at(sb),
          progress: prog2,
          status: prog2 === 100 ? 'Closed' : prog2 > 0 ? 'In Progress' : 'Open',
          priority: 'Medium',
          parentId: tid,
        });
      });
    });
    items.push({
      id: `TA-${7600 + h % 40 + n++}`,
      kind: 'milestone',
      name: ph.milestone,
      assignee: ASSIGNEES[(h + n) % ASSIGNEES.length],
      start: at(f1),
      end: at(f1),
      /* A milestone is a POINT: it is reached or it is not. */
      progress: doneAt >= f1 ? 100 : 0,
      status: doneAt >= f1 ? 'Closed' : 'Open',
      priority: 'Medium',
      parentId: sumId,
    });
  });
  return items;
};

/* What the plan ADDS UP TO — the four numbers a project is reported by. Exported so the
   listing's Gantt hover card can show the SAME figures the Planning tab does: both read
   this one seed, so the card can never promise a count the tab then contradicts. */
export interface PlanSummary {
  tasks: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  milestones: number;
  milestonesDone: number;
  /** Mean task progress, 0-100 — what the card's bar fills to. */
  progress: number;
}
export const planSummaryOf = (project: Project | null): PlanSummary => {
  const items = seedPlan(project);
  const tasks = items.filter((i) => i.kind === 'task');
  const stones = items.filter((i) => i.kind === 'milestone');
  const closed = tasks.filter((t) => t.status === 'Closed').length;
  return {
    tasks: tasks.length,
    completed: closed,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    /* Pending reads as "not started" to anyone looking at a summary — it is work that has
       not begun, whatever the reason it is parked. */
    notStarted: tasks.filter((t) => t.status === 'Open' || t.status === 'Pending').length,
    milestones: stones.length,
    milestonesDone: stones.filter((m) => m.status === 'Closed').length,
    progress: tasks.length ? Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length) : 0,
  };
};

/** The Planning tab switches to its Gantt when this fires — see the listing card's
 *  "View project Gantt", which opens the record straight onto that view. */
export const PROJECT_GANTT_EVENT = 'open-project-gantt';

interface Draft {
  name: string;
  assignee: string;
  start: string;
  end: string;
  progress: string;
  status: string;
  priority: string;
}

export function ProjectPlanningTab({ project, drawerWidth }: { project: Project | null; drawerWidth: number }) {
  const [view, setView] = useState<'list' | 'gantt'>('list');
  /* Arriving from the listing's "View project Gantt" — the record opens on this tab, and
     this lands it on the right VIEW of it. An event rather than a prop because the drawer
     is mounted by the shared stack host, which knows nothing about planning. */
  useEffect(() => {
    const toGantt = () => setView('gantt');
    window.addEventListener(PROJECT_GANTT_EVENT, toGantt);
    return () => window.removeEventListener(PROJECT_GANTT_EVENT, toGantt);
  }, []);
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<'all' | 'tasks' | 'milestones' | 'unassigned' | 'overdue'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [items, setItems] = useState<PlanItem[]>(() => seedPlan(project));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  /* Which parent TASKS have their sub-task group folded (default: open). */
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  /* Dependency UI: the picker (per task + direction) and the graph modal. */
  const [depPicker, setDepPicker] = useState<{ id: string; dir: 'pred' | 'succ' } | null>(null);
  const [depGraphId, setDepGraphId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', assignee: '', start: '', end: '', progress: '0', status: 'Open', priority: 'Medium' });
  const freshRef = useRef<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [projStart, setProjStart] = useState(() => toInput(project?.start ?? new Date()));
  const [projEnd, setProjEnd] = useState(() => toInput(project?.end ?? new Date(Date.now() + 90 * DAY)));
  const lastProjectId = useRef(project?.id);
  if (project?.id !== lastProjectId.current) {
    lastProjectId.current = project?.id;
    setItems(seedPlan(project));
    setCollapsed(new Set());
    setCollapsedTasks(new Set());
    setDepPicker(null);
    setDepGraphId(null);
    setEditingId(null);
    setProjStart(toInput(project?.start ?? new Date()));
    setProjEnd(toInput(project?.end ?? new Date(Date.now() + 90 * DAY)));
  }

  const wide = drawerWidth > 1080;
  const today = dayFloor(new Date());

  const summaries = items.filter((i) => i.kind === 'summary');
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id);
  const topLevel = items.filter((i) => i.kind !== 'summary' && !i.parentId);

  const summaryMeta = (s: PlanItem) => {
    const kids = childrenOf(s.id);
    if (!kids.length) return { start: s.start, end: s.end, progress: s.progress };
    return {
      start: new Date(Math.min(...kids.map((k) => k.start.getTime()))),
      end: new Date(Math.max(...kids.map((k) => k.end.getTime()))),
      progress: Math.round(kids.reduce((a, k) => a + k.progress, 0) / kids.length),
    };
  };

  const matches = (i: PlanItem) => {
    if (i.kind !== 'summary' && planFilter !== 'all') {
      if (planFilter === 'tasks' && i.kind !== 'task') return false;
      if (planFilter === 'milestones' && i.kind !== 'milestone') return false;
      if (planFilter === 'unassigned' && i.assignee) return false;
      if (planFilter === 'overdue' && !(i.status !== 'Closed' && dayFloor(i.end).getTime() < today.getTime())) return false;
    }
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return i.name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s);
  };

  const nextId = () => {
    const max = items.reduce((m, i) => Math.max(m, parseInt(i.id.replace('TA-', ''), 10) || 0), 7600);
    return `TA-${max + 1}`;
  };

  const beginEdit = (i: PlanItem) => {
    setEditingId(i.id);
    setDraft({ name: i.name, assignee: i.assignee ?? '', start: toInput(i.start), end: toInput(i.end), progress: String(i.progress), status: i.status, priority: i.priority });
  };

  const addItem = (kind: PlanKind, parentId: string | null) => {
    const base = fromInput(projStart, new Date());
    const item: PlanItem = {
      id: nextId(),
      kind,
      name: '',
      assignee: null,
      start: base,
      end: kind === 'milestone' ? base : new Date(base.getTime() + 4 * DAY),
      progress: 0,
      status: 'Open',
      priority: 'Medium',
      parentId,
    };
    setItems((prev) => [...prev, item]);
    freshRef.current = item.id;
    beginEdit(item);
    setShowAddMenu(false);
    if (parentId) setCollapsed((prev) => { const n = new Set(prev); n.delete(parentId); return n; });
  };

  const cancelEdit = () => {
    if (freshRef.current === editingId) setItems((prev) => prev.filter((i) => i.id !== editingId));
    freshRef.current = null;
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!draft.name.trim()) {
      toast.error('Give it a name before saving');
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== editingId) return i;
        const start = fromInput(draft.start, i.start);
        let end = i.kind === 'milestone' ? start : fromInput(draft.end, i.end);
        if (end.getTime() < start.getTime()) end = start;
        const progress = Math.max(0, Math.min(100, parseInt(draft.progress, 10) || 0));
        const status = (draft.status || i.status) as PlanItem['status'];
        return {
          ...i,
          name: draft.name.trim(),
          assignee: draft.assignee || null,
          start,
          end,
          /* Closed and 100% imply each other — the card can never contradict itself. */
          progress: status === 'Closed' ? 100 : progress,
          status: progress === 100 ? 'Closed' : status,
          priority: (draft.priority || i.priority) as PlanItem['priority'],
        };
      }),
    );
    freshRef.current = null;
    setEditingId(null);
  };

  /* Drag-to-reorder (native DnD, the grid/tab-strip recipe): grip starts the
     drag with the whole card as ghost; hovering a card shows a blue line on the
     nearer half; dropping re-inserts there — and adopts that card's phase, so
     dragging between summaries just works. */
  /* Card meta chips (the ticket Tasks-tab recipe): one menu open at a time. */
  const [openMenu, setOpenMenu] = useState<{ id: string; field: 'status' | 'priority' | 'assignee' | 'dates' | 'color' | 'more' } | null>(null);

  /* 3-dot actions — kind-aware option sets (visual-only, like Add/Edit). */
  const moreMenu = (id: string, kind: PlanKind) => {
    const moreOpen = openMenu?.id === id && openMenu.field === 'more';
    const options: [typeof ListChecks, string, (() => void) | null][] =
      kind === 'summary'
        ? [
            [ListChecks, 'Add Task', null],
            [Diamond, 'Add Milestone', null],
          ]
        : [
            [ListTree, 'Add Sub Task', null],
            [ArrowLeftToLine, 'Add Predecessors', () => setDepPicker({ id, dir: 'pred' })],
            [ArrowRightToLine, 'Add Successors', () => setDepPicker({ id, dir: 'succ' })],
          ];
    return (
      <span className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu((m) => (m?.id === id && m.field === 'more' ? null : { id, field: 'more' }));
          }}
          title="More actions"
          className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EBEFF3] hover:text-[#364658]"
        >
          <MoreVertical size={13} />
        </button>
        {moreOpen && (
          <>
            <span className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} />
            <div className="app-menu absolute right-0 top-full z-50 mt-1 w-[184px] rounded-lg border border-[#DFE5ED] bg-white py-1.5 shadow-lg">
              {options.map(([Icon, label, action]) => (
                <button
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(null);
                    action?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <Icon size={14} className="flex-shrink-0 text-[#7B8FA5]" />
                  <span className="text-[13px] text-[#364658]">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </span>
    );
  };
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ id: string; after: boolean } | null>(null);
  const moveItem = (srcId: string, dstId: string, after: boolean) => {
    setItems((prev) => {
      const src = prev.find((i) => i.id === srcId);
      const dst = prev.find((i) => i.id === dstId);
      if (!src || !dst || srcId === dstId || src.kind === 'summary' || dst.kind === 'summary') return prev;
      const rest = prev.filter((i) => i.id !== srcId);
      const di = rest.findIndex((i) => i.id === dstId);
      rest.splice(di + (after ? 1 : 0), 0, { ...src, parentId: dst.parentId });
      return rest;
    });
  };

  const setField = (id: string, patch: Partial<PlanItem>) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  /* The checkbox IS the status: checked = Closed (100%), unchecked reopens. */
  const toggleDone = (i: PlanItem, done: boolean) =>
    setField(i.id, done ? { status: 'Closed', progress: 100 } : { status: 'In Progress' });

  const removeItem = (i: PlanItem) => {
    setItems((prev) => prev.filter((x) => x.id !== i.id && x.parentId !== i.id));
    toast.success(`${i.kind === 'summary' ? 'Summary task' : i.kind === 'milestone' ? 'Milestone' : 'Task'} deleted`);
  };

  /* ── Shared bits ── */
  const kindIcon = (i: PlanItem) =>
    i.kind === 'milestone' ? (
      <Diamond size={12} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
    ) : i.kind === 'summary' ? null : (
      <span className="size-2 flex-shrink-0 rounded-full bg-[#3D8BD0]" />
    );

  const overdueOf = (i: PlanItem, progress: number) =>
    (i.kind === 'summary' ? progress < 100 : i.status !== 'Closed') && dayFloor(i.end).getTime() < today.getTime();

  const inlineEditor = (i: PlanItem) => (
    <div
      className="flex flex-wrap items-center gap-2 rounded bg-[#F5FAFF] px-3 py-2.5 ring-1 ring-inset ring-[#3D8BD0]/30"
      onKeyDown={(e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
      }}
    >
      {kindIcon(i)}
      <input
        autoFocus
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder={i.kind === 'summary' ? 'Summary task name...' : i.kind === 'milestone' ? 'Milestone name...' : 'Task name...'}
        className="h-8 min-w-[160px] flex-1 rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
      />
      {i.kind !== 'summary' && (
        <select
          value={draft.assignee}
          onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))}
          className="app-select h-8 cursor-pointer rounded border border-[#DFE5ED] bg-white pl-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
        >
          <option value="">Unassigned</option>
          {ASSIGNEES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      )}
      {i.kind !== 'summary' && (
        <>
          <select
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            className="app-select h-8 cursor-pointer rounded border border-[#DFE5ED] bg-white pl-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
          >
            {Object.keys(PLAN_STATUS_DOT).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
            className="app-select h-8 cursor-pointer rounded border border-[#DFE5ED] bg-white pl-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
          >
            {Object.keys(PLAN_PRIORITY_DOT).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </>
      )}
      <input
        type="date"
        value={draft.start}
        onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
        className="h-8 rounded border border-[#DFE5ED] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
      />
      {i.kind !== 'milestone' && (
        <>
          <span className="text-[11px] text-[#9CA3AF]">→</span>
          <input
            type="date"
            value={draft.end}
            onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
            className="h-8 rounded border border-[#DFE5ED] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
          />
        </>
      )}
      {i.kind === 'task' && (
        <span className="inline-flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={draft.progress}
            onChange={(e) => setDraft((d) => ({ ...d, progress: e.target.value }))}
            className="h-8 w-[58px] rounded border border-[#DFE5ED] bg-white px-2 text-[12px] tabular-nums text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
          />
          <span className="text-[11px] text-[#7B8FA5]">%</span>
        </span>
      )}
      <span className="ml-auto flex items-center gap-1">
        <button onClick={saveEdit} title="Save" className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-white transition-colors hover:bg-[#2F7AB8]">
          <Check size={15} />
        </button>
        <button onClick={cancelEdit} title="Cancel" className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FA]">
          <X size={15} />
        </button>
      </span>
    </div>
  );

  const itemRow = (i: PlanItem, depth = 0, subCard = false) => {
    if (editingId === i.id) return <div key={i.id} className={depth === 1 ? 'ml-7' : depth >= 2 ? 'ml-14' : ''}>{inlineEditor(i)}</div>;
    const od = overdueOf(i, i.progress);
    return (
      <div
        key={i.id}
        data-plan-card
        draggable
        onDragStart={(e) => {
          setDragId(i.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDragId(null);
          setDragOver(null);
        }}
        onDragOver={(e) => {
          if (!dragId || dragId === i.id) return;
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          setDragOver({ id: i.id, after: e.clientY > r.top + r.height / 2 });
        }}
        onDragLeave={() => setDragOver((d) => (d?.id === i.id ? null : d))}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId && dragOver?.id === i.id) moveItem(dragId, i.id, dragOver.after);
          setDragId(null);
          setDragOver(null);
        }}
        className={`group/row relative flex items-center gap-3 rounded-lg border border-[#E6EAF0] py-4 pl-12 pr-4 transition-all hover:border-[#D5DDE7] hover:shadow-[0_1px_3px_rgba(16,24,40,0.06)] ${subCard ? 'bg-[#FAFBFC]' : 'bg-white'} ${depth === 1 ? 'ml-7' : depth >= 2 ? 'ml-14' : ''} ${dragId === i.id ? 'opacity-40' : ''}`}
      >
        {dragOver?.id === i.id && !dragOver.after && (
          <span className="pointer-events-none absolute inset-x-2 -top-[6px] h-[3px] rounded-full bg-[#3D8BD0]" />
        )}
        {dragOver?.id === i.id && dragOver.after && (
          <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-[3px] rounded-full bg-[#3D8BD0]" />
        )}
        {/* Parent tasks trade the grip for the expand/collapse chevron (the whole
            card is the drag surface anyway); leaf cards keep the hover grip. */}
        {i.kind === 'task' && childrenOf(i.id).length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsedTasks((prev) => {
                const n = new Set(prev);
                n.has(i.id) ? n.delete(i.id) : n.add(i.id);
                return n;
              });
            }}
            title={collapsedTasks.has(i.id) ? 'Expand sub tasks' : 'Collapse sub tasks'}
            className="absolute left-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EBEFF3]"
          >
            {collapsedTasks.has(i.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span
            title="Drag to reorder"
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab p-0.5 text-[#9CA3AF] opacity-0 transition-opacity active:cursor-grabbing group-hover/row:opacity-100"
          >
            <GripVertical size={13} />
          </span>
        )}
        {/* Two-line body: identity on top, meta beneath — stays readable at any width. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-4 flex-shrink-0 items-center justify-center">
              {i.kind === 'milestone' ? (
                <Diamond size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu((m) => (m?.id === i.id && m.field === 'color' ? null : { id: i.id, field: 'color' }));
                  }}
                  title="Task color"
                  className="size-2.5 rounded-full transition-shadow hover:ring-2 hover:ring-[#CBD5E1] hover:ring-offset-1"
                  style={{ backgroundColor: i.color ?? '#3D8BD0' }}
                />
              )}
              {openMenu?.id === i.id && openMenu.field === 'color' && (
                <>
                  <span className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} />
                  <div className="app-menu absolute left-0 top-full z-50 mt-2 rounded-lg border border-[#DFE5ED] bg-white p-2.5 shadow-lg">
                    <div className="grid grid-cols-5 gap-1.5">
                      {TASK_DOT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            setField(i.id, { color: c });
                            setOpenMenu(null);
                          }}
                          title={c}
                          className="flex size-5 items-center justify-center rounded-full transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        >
                          {(i.color ?? '#3D8BD0') === c && <Check size={11} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </span>
            <input
              type="checkbox"
              checked={i.status === 'Closed'}
              onChange={(e) => toggleDone(i, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              title={i.status === 'Closed' ? 'Reopen' : 'Mark as done'}
              className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
            />
            <span className="whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{i.id}</span>
            <span className={`min-w-0 truncate text-[13px] font-medium ${i.status === 'Closed' ? 'text-[#94A3B8] line-through' : 'text-[#364658]'}`}>{i.name}</span>
            {(() => {
              const subs = childrenOf(i.id);
              if (!subs.length) return null;
              const done = subs.filter((x) => x.status === 'Closed').length;
              return (
                <span
                  title="Sub tasks"
                  className={`inline-flex flex-shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${done === subs.length ? 'bg-[#E7F6EE] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'}`}
                >
                  <ListTree size={11} />
                  {done}/{subs.length}
                </span>
              );
            })()}
            {od && (
              <span className="flex-shrink-0 rounded-sm bg-[#FDECEC] px-1.5 py-0.5 text-[10px] font-medium text-[#DC2626]">Overdue</span>
            )}
            {(() => {
              const total = (i.preds ?? []).length + items.filter((x) => (x.preds ?? []).includes(i.id)).length;
              if (!total) return null;
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDepGraphId(i.id);
                  }}
                  title="View dependencies"
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-sm bg-[#EEF4FB] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#3D8BD0] transition-colors hover:bg-[#DCEBFA]"
                >
                  <Waypoints size={11} />
                  {total}
                </button>
              );
            })()}
          </div>
          {/* pl = shape slot (16) + gap (8) + checkbox (14) + gap (8) — flush with the ID chip. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[46px]">
            {(() => {
              const menuOn = (field: 'status' | 'priority' | 'assignee' | 'dates') =>
                openMenu?.id === i.id && openMenu.field === field;
              const toggleMenu = (field: 'status' | 'priority' | 'assignee' | 'dates') =>
                setOpenMenu((m) => (m?.id === i.id && m.field === field ? null : { id: i.id, field }));
              const menuShell = (children: React.ReactNode, width = 'min-w-[160px]') => (
                <>
                  <span className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} />
                  <div className={`app-menu absolute left-0 top-full z-50 mt-1 ${width} rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg`}>
                    {children}
                  </div>
                </>
              );
              return (
                <>
                  {/* Assignee */}
                  <span className="group/f relative w-[150px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMenu('assignee'); }}
                      title="Assignee"
                      className="-ml-1.5 flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-[#F5F7FA]"
                    >
                      {i.assignee ? (
                        <span className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[8px] font-semibold text-white" style={{ backgroundColor: avatarColor(i.assignee) }}>
                          {initials(i.assignee)}
                        </span>
                      ) : (
                        <User size={13} className="flex-shrink-0 text-[#9CA3AF]" />
                      )}
                      <span className={`min-w-0 flex-1 truncate text-left text-[13px] font-medium ${i.assignee ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{i.assignee ?? 'Unassigned'}</span>
                      <ChevronDown size={11} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/f:opacity-100" />
                    </button>
                    {menuOn('assignee') &&
                      menuShell(
                        <>
                          <button
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                            onClick={(e) => { e.stopPropagation(); setField(i.id, { assignee: null }); setOpenMenu(null); }}
                          >
                            <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#f3f4f6] text-[#9ca3af]"><User size={11} /></span>
                            <span className="text-[13px] text-[#364658]">Unassigned</span>
                            {!i.assignee && <Check size={14} className="ml-auto flex-shrink-0 text-[#3D8BD0]" />}
                          </button>
                          {ASSIGNEES.map((a) => (
                            <button
                              key={a}
                              className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                              onClick={(e) => { e.stopPropagation(); setField(i.id, { assignee: a }); setOpenMenu(null); }}
                            >
                              <span className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white" style={{ backgroundColor: avatarColor(a) }}>
                                {initials(a)}
                              </span>
                              <span className="text-[13px] text-[#364658]">{a}</span>
                              {i.assignee === a && <Check size={14} className="ml-auto flex-shrink-0 text-[#3D8BD0]" />}
                            </button>
                          ))}
                        </>,
                        'min-w-[190px] max-h-[240px] overflow-y-auto',
                      )}
                  </span>
                  {/* Status */}
                  <span className="group/f relative w-[110px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMenu('status'); }}
                      title="Status"
                      className="-ml-1.5 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-[#F5F7FA]"
                    >
                      <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PLAN_STATUS_DOT[i.status] }} />
                      <span className="text-[13px] font-medium text-[#364658]">{i.status}</span>
                      <ChevronDown size={11} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/f:opacity-100" />
                    </button>
                    {menuOn('status') &&
                      menuShell(
                        (Object.keys(PLAN_STATUS_DOT) as PlanItem['status'][]).map((o) => (
                          <button
                            key={o}
                            className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setField(i.id, o === 'Closed' ? { status: o, progress: 100 } : { status: o });
                              setOpenMenu(null);
                            }}
                          >
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PLAN_STATUS_DOT[o] }} />
                            <span className="text-[13px] text-[#364658]">{o}</span>
                            {i.status === o && <Check size={14} className="ml-auto flex-shrink-0 text-[#3D8BD0]" />}
                          </button>
                        )),
                      )}
                  </span>
                  {/* Priority */}
                  <span className="group/f relative w-[95px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMenu('priority'); }}
                      title="Priority"
                      className="-ml-1.5 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-[#F5F7FA]"
                    >
                      <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PLAN_PRIORITY_DOT[i.priority] }} />
                      <span className="text-[13px] font-medium text-[#364658]">{i.priority}</span>
                      <ChevronDown size={11} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/f:opacity-100" />
                    </button>
                    {menuOn('priority') &&
                      menuShell(
                        (Object.keys(PLAN_PRIORITY_DOT) as PlanItem['priority'][]).map((o) => (
                          <button
                            key={o}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setField(i.id, { priority: o });
                              setOpenMenu(null);
                            }}
                          >
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PLAN_PRIORITY_DOT[o] }} />
                            <span className="text-[13px] text-[#364658]">{o}</span>
                            {i.priority === o && <Check size={14} className="ml-auto flex-shrink-0 text-[#3D8BD0]" />}
                          </button>
                        )),
                        'min-w-[140px]',
                      )}
                  </span>
                  {/* Dates */}
                  <span className="group/f relative w-[195px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMenu('dates'); }}
                      title={i.kind === 'milestone' ? 'Date' : 'Start – End'}
                      className="-ml-1.5 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-[#F5F7FA]"
                    >
                      <Calendar size={13} className="flex-shrink-0 text-[#7B8FA5]" />
                      <span className="text-[13px] font-medium text-[#364658]">
                        {i.kind === 'milestone' ? fmtDY(i.start) : `${fmtD(i.start)} – ${fmtDY(i.end)}`}
                      </span>
                      <ChevronDown size={11} className="flex-shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover/f:opacity-100" />
                    </button>
                    {menuOn('dates') &&
                      menuShell(
                        <div className="space-y-2 px-3 py-1" onClick={(e) => e.stopPropagation()}>
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-[#7B8FA5]">{i.kind === 'milestone' ? 'Date' : 'Start Date'}</span>
                            <input
                              type="date"
                              value={toInput(i.start)}
                              onChange={(e) => {
                                const start = fromInput(e.target.value, i.start);
                                const end = i.kind === 'milestone' ? start : i.end.getTime() < start.getTime() ? start : i.end;
                                setField(i.id, { start, end });
                              }}
                              className="h-8 w-full rounded border border-[#DFE5ED] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
                            />
                          </label>
                          {i.kind !== 'milestone' && (
                            <label className="block">
                              <span className="mb-1 block text-[11px] text-[#7B8FA5]">End Date</span>
                              <input
                                type="date"
                                value={toInput(i.end)}
                                onChange={(e) => {
                                  let end = fromInput(e.target.value, i.end);
                                  if (end.getTime() < i.start.getTime()) end = i.start;
                                  setField(i.id, { end });
                                }}
                                className="h-8 w-full rounded border border-[#DFE5ED] bg-white px-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
                              />
                            </label>
                          )}
                        </div>,
                        'w-[220px]',
                      )}
                  </span>
                  {i.kind !== 'milestone' && (
                    <span className="inline-flex w-[70px] items-center gap-1 text-[12px] text-[#7B8FA5]">
                      <Clock size={12} />
                      {durLabel(i.start, i.end)}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        {/* Right cluster mirrors the card's two lines: actions on top, progress beneath. */}
        <span className="flex flex-shrink-0 flex-col items-end justify-center gap-2">
          <span className={`flex items-center gap-0.5 ${openMenu?.id === i.id && openMenu.field === 'more' ? 'visible' : 'invisible group-hover/row:visible'}`}>
            <button onClick={(e) => e.stopPropagation()} title="Edit" className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EBEFF3] hover:text-[#3D8BD0]">
              <SquarePen size={13} />
            </button>
            <button onClick={() => removeItem(i)} title="Delete" className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#FDECEC] hover:text-[#DC2626]">
              <Trash2 size={13} />
            </button>
            {moreMenu(i.id, i.kind)}
          </span>
          {/* Tasks AND milestones share the same meter, so the column reads uniformly. */}
          <span className="flex w-[92px] items-center gap-2">
            <span className="block h-[4px] flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
              <span className="block h-full rounded-full" style={{ width: `${i.progress}%`, backgroundColor: i.progress === 100 ? '#16A34A' : '#3D8BD0' }} />
            </span>
            <span className="w-8 text-right text-[11px] tabular-nums text-[#64748B]">{i.progress}%</span>
          </span>
        </span>
      </div>
    );
  };

  /* A task and its sub-tasks render as ONE visual group: the parent card, then
     its sub-cards indented on a connector spine (elbow into each card), softly
     tinted and packed tighter than unrelated cards. */
  const taskGroup = (k: PlanItem, depth: number) => {
    const subs = childrenOf(k.id).filter(matches);
    if (!subs.length) return <div key={k.id}>{itemRow(k, depth)}</div>;
    return (
      /* Padding (not margin — margins collapse) gives a group extra air on both
         sides, so parent+subs read apart from neighbouring single tasks. */
      <div key={k.id} className="space-y-3 py-1.5">
        {itemRow(k, depth)}
        {!collapsedTasks.has(k.id) && (
        <div className={`space-y-3 ${depth === 1 ? 'ml-[68px]' : 'ml-10'}`}>
          {subs.map((st, si) => (
            <div key={st.id} className="relative">
              <span
                className={`pointer-events-none absolute -left-[18px] -top-3 w-px bg-[#DFE5ED] ${si === subs.length - 1 ? 'h-[38px]' : '-bottom-3'}`}
              />
              <span className={`pointer-events-none absolute -left-[18px] w-[18px] top-[26px] h-px bg-[#DFE5ED]`} />
              {itemRow(st, 0, true)}
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  /* ── List view ── */
  const listView = (
    <div className="space-y-3">
      {summaries.map((s) => {
        const meta = summaryMeta(s);
        const kids = childrenOf(s.id).filter(matches);
        if ((q.trim() && !matches(s) && kids.length === 0) || (planFilter !== 'all' && kids.length === 0)) return null;
        const open = !collapsed.has(s.id);
        const od = overdueOf(s, meta.progress);
        return (
          <div key={s.id} className="rounded-lg border border-[#E5E7EB]">
            {editingId === s.id ? (
              <div className="p-2">{inlineEditor(s)}</div>
            ) : (
              <div
                onClick={() => setCollapsed((prev) => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                className="group/row flex cursor-pointer items-center gap-2.5 rounded-t-lg bg-[#F8FAFC] px-3 py-4"
              >
                <button
                  className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EBEFF3]"
                >
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                {/* Two-line header, matching the task cards: identity, then schedule. */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="min-w-0 truncate text-[13px] font-semibold text-[#364658]">{s.name}</span>
                    <span className="flex-shrink-0 rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#64748B] ring-1 ring-inset ring-[#E5E7EB]">
                      {childrenOf(s.id).length} items
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#7B8FA5]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {fmtD(meta.start)} – {fmtDY(meta.end)}
                    </span>
                    {od && <span className="rounded-sm bg-[#FDECEC] px-1.5 py-0.5 text-[10px] font-medium text-[#DC2626]">Overdue</span>}
                  </div>
                </div>
                <span className="flex flex-shrink-0 flex-col items-end justify-center gap-2">
                  <span className={`flex items-center gap-0.5 ${openMenu?.id === s.id && openMenu.field === 'more' ? 'visible' : 'invisible group-hover/row:visible'}`}>
                    <button onClick={(e) => e.stopPropagation()} title="Edit" className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EBEFF3] hover:text-[#3D8BD0]">
                      <SquarePen size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(s); }} title="Delete summary + items" className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#FDECEC] hover:text-[#DC2626]">
                      <Trash2 size={13} />
                    </button>
                    {moreMenu(s.id, 'summary')}
                  </span>
                  <span className="flex w-[92px] items-center gap-2">
                    <span className="block h-[4px] flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
                      <span className="block h-full rounded-full" style={{ width: `${meta.progress}%`, backgroundColor: meta.progress === 100 ? '#16A34A' : '#3D8BD0' }} />
                    </span>
                    <span className="w-8 text-right text-[11px] tabular-nums text-[#64748B]">{meta.progress}%</span>
                  </span>
                </span>
              </div>
            )}
            {open && (
              <div className="space-y-3 px-3 py-3">
                {kids.map((k) => taskGroup(k, 1))}
                {/* Inline add — no second screen, ever. */}
                <div className="ml-7 flex items-center gap-4 px-3 py-1.5">
                  <button onClick={() => {}} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]">
                    <Plus size={13} /> Add task
                  </button>
                  <button onClick={() => {}} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]">
                    <Plus size={13} /> Add milestone
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {topLevel.filter(matches).length > 0 && (
        <div className="space-y-3">{topLevel.filter(matches).map((k) => taskGroup(k, 0))}</div>
      )}
      {q.trim() && summaries.every((s) => !matches(s) && childrenOf(s.id).filter(matches).length === 0) && topLevel.filter(matches).length === 0 && (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-[#F5F7FA]">
              <Search className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="mb-1 text-[14px] font-semibold text-[#364658]">No matching plan items</h3>
            <p className="text-[13px] text-[#7B8FA5]">Try different keywords, or clear the search.</p>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Gantt view — the release-listing Gantt design, cloned for plan items
     (ProjectGanttView): Week/Month/Quarter grains, brush/pinch zoom, frozen
     rail with search, hover cards. Natural height — rows scroll with the PAGE
     (no internal vertical scrollbar); only the timeline pans horizontally. ── */
  const ganttView = (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <ProjectGanttView items={items} />
    </div>
  );

  return (
    <div className="px-6 py-5">
      {/* Toolbar: view toggle · search · project window · Add — sticky under the
          ~48px main tab strip while the plan scrolls (the V2 Conversation-row
          recipe: full-bleed -mx-6 + white bg so rows pass cleanly beneath). */}
      <div className="sticky top-[48px] z-30 -mx-6 mb-2 flex flex-wrap items-center gap-2 bg-white px-6 py-3">
        {/* Icon-expand search — Tasks-tab recipe. FULL view expands inline
            (240px, in flow); SMALL view instead OVERLAYS the whole left
            cluster (filter + Project window, up to the view toggles) so the
            sticky row never wraps to a second line. */}
        {(() => {
          const smallView = drawerWidth <= 1080;
          const field = (
            <>
              <Search size={15} className="flex-shrink-0 text-[#7B8FA5]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQ('');
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search plan..."
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#364658] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQ('');
                }}
                className="rounded p-0.5 transition-colors hover:bg-[#F5F7FA]"
              >
                <X size={14} className="text-[#7B8FA5]" />
              </button>
            </>
          );
          if (!smallView && searchOpen) {
            return <div className="flex h-8 w-[240px] items-center gap-2 rounded border border-[#DFE5ED] bg-white px-3">{field}</div>;
          }
          return (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                title="Search"
                className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
              >
                <Search size={16} />
              </button>
              {smallView && searchOpen && (
                <div className="absolute left-6 right-[200px] top-1/2 z-20 flex h-8 -translate-y-1/2 items-center gap-2 rounded border border-[#DFE5ED] bg-white px-3 shadow-[0_4px_12px_rgba(16,24,40,0.10)]">
                  {field}
                </div>
              )}
            </>
          );
        })()}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            title="Filter plan"
            className={`flex size-8 items-center justify-center rounded border transition-colors ${
              planFilter !== 'all'
                ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]'
                : 'border-[#DFE5ED] text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658]'
            }`}
          >
            <Filter size={16} />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
              <div className="app-menu absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg">
                {(
                  [
                    ['all', 'All'],
                    ['tasks', 'Task Only'],
                    ['milestones', 'Milestone Only'],
                    ['unassigned', 'Unassigned'],
                    ['overdue', 'Overdue'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setPlanFilter(id);
                      setShowFilterMenu(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#364658] transition-colors hover:bg-[#F5F7FA] ${
                      planFilter === id ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                    }`}
                  >
                    {label}
                    {planFilter === id && <Check size={16} className="text-[#3D8BD0]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {planFilter !== 'all' && (
          <span className="inline-flex h-8 items-center gap-1 rounded-md bg-[#EAF2FB] pl-2.5 pr-1.5 text-[12px] font-medium text-[#3D8BD0]">
            {planFilter === 'tasks' ? 'Task Only' : planFilter === 'milestones' ? 'Milestone Only' : planFilter === 'unassigned' ? 'Unassigned' : 'Overdue'}
            <button onClick={() => setPlanFilter('all')} title="Clear filter" className="rounded p-0.5 transition-colors hover:bg-[#3D8BD0]/10">
              <X size={13} />
            </button>
          </span>
        )}
        {/* The project window, edited RIGHT HERE — the old flow hid it behind Edit Planning. */}
        <span className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2">
          <span className="text-[11px] text-[#7B8FA5]">{wide ? 'Project window' : 'Window'}</span>
          <input type="date" value={projStart} onChange={(e) => setProjStart(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker?.(); } catch {} }} className="h-6 cursor-pointer rounded bg-transparent text-[12px] text-[#364658] focus:outline-none" />
          <span className="text-[11px] text-[#9CA3AF]">→</span>
          <input type="date" value={projEnd} onChange={(e) => setProjEnd(e.target.value)} onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker?.(); } catch {} }} className="h-6 cursor-pointer rounded bg-transparent text-[12px] text-[#364658] focus:outline-none" />
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {(
              [
                ['list', 'List view', ListIcon],
                ['gantt', 'Gantt view', ChartGantt],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className={`flex size-8 items-center justify-center rounded border transition-colors ${
                  view === id
                    ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]'
                    : 'border-[#DFE5ED] text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
            >
              <Plus size={15} />
              Add
              <ChevronDown size={14} />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-[190px] rounded-lg border border-[#DFE5ED] bg-white py-1.5 shadow-lg">
                  {(
                    [
                      ['task', 'Task', 'A single piece of work'],
                      ['summary', 'Summary Task', 'A phase that groups items'],
                      ['milestone', 'Milestone', 'A date that marks a gate'],
                    ] as const
                  ).map(([kind, label, hint]) => (
                    <button
                      key={kind}
                      onClick={() => setShowAddMenu(false)}
                      className="flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <span className="text-[13px] font-medium text-[#364658]">{label}</span>
                      <span className="text-[11px] text-[#7B8FA5]">{hint}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {view === 'list' ? listView : ganttView}

      {depPicker &&
        (() => {
          const t = items.find((x) => x.id === depPicker.id);
          if (!t) return null;
          const existing =
            depPicker.dir === 'pred'
              ? new Set(t.preds ?? [])
              : new Set(items.filter((x) => (x.preds ?? []).includes(t.id)).map((x) => x.id));
          return (
            <DepPickerPanel
              task={t}
              dir={depPicker.dir}
              candidates={items.filter((x) => x.kind === 'task' && x.id !== t.id)}
              existing={existing}
              onClose={() => setDepPicker(null)}
              onApply={(addIds, removeIds) => {
                if (depPicker.dir === 'pred') {
                  setField(t.id, { preds: [...(t.preds ?? []).filter((id) => !removeIds.includes(id)), ...addIds] });
                } else {
                  setItems((prev) =>
                    prev.map((x) =>
                      addIds.includes(x.id)
                        ? { ...x, preds: [...(x.preds ?? []), t.id] }
                        : removeIds.includes(x.id)
                          ? { ...x, preds: (x.preds ?? []).filter((pid) => pid !== t.id) }
                          : x,
                    ),
                  );
                }
                setDepPicker(null);
              }}
            />
          );
        })()}
      {depGraphId &&
        (() => {
          const t = items.find((x) => x.id === depGraphId);
          if (!t) return null;
          const preds = (t.preds ?? []).map((id) => items.find((x) => x.id === id)).filter(Boolean) as PlanItem[];
          const succs = items.filter((x) => (x.preds ?? []).includes(t.id));
          return (
            <DepGraphModal
              task={t}
              preds={preds}
              succs={succs}
              onClose={() => setDepGraphId(null)}
              onRemove={(id, dir) => {
                if (dir === 'pred') {
                  setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, preds: (x.preds ?? []).filter((p) => p !== id) } : x)));
                } else {
                  setItems((prev) => prev.map((x) => (x.id === id ? { ...x, preds: (x.preds ?? []).filter((p) => p !== t.id) } : x)));
                }
                toast.success(`${id} removed as ${dir === 'pred' ? 'predecessor' : 'successor'} of ${t.id}`);
              }}
            />
          );
        })()}
    </div>
  );
}
