/* ── Automatic Patch Test — detail side panel ────────────────────────────────
   Opened from the listing's ID or Name. Two tabs:

   • **Patch Deployment** — the deployment runs this schedule has produced, with the search
     and status filter the module's own grid has.
   • **Analytics** — the same runs read as numbers over the chosen timeframe: six tiles, two
     donuts and a per-remote-office result breakdown.

   Both tabs read ONE derived set of runs (`runsFor`), so the grid and the charts can never
   disagree, and that set is derived from the schedule's own totals — a schedule the listing
   says has 21 completed cases shows 21 completed here too.

   Its own file, and the house chrome throughout: the side-popup shell the Impacted-Endpoints
   panel uses, the drawer's underline tabs, the dashboards' donut + legend, and the listing's
   count chips. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Check, Funnel, GripVertical, Search, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Donut, Legend } from './AssetDashboardView';
import { fmtGridDateTime } from './dateFormat';
import type { AutomaticPatchTest } from './automaticPatchTests';

/* ── The runs a schedule has produced ──────────────────────────────────────── */

type RunStatus = 'Draft' | 'Ready to Deploy' | 'In Progress' | 'Completed' | 'Partial Completed' | 'Expired' | 'Cancelled';
type TestStatus = 'Passed' | 'Failed' | 'In Progress' | 'Pending';
type Severity = 'Critical' | 'Important' | 'Moderate' | 'Low' | 'Unspecified';

export interface TestRun {
  id: string;
  name: string;
  status: RunStatus;
  testStatus: TestStatus;
  severity: Severity;
  created: Date;
  observationStart: Date | null;
  /** Hours left on the approval clock, or null when nothing is waiting on an approver. */
  approvalHoursLeft: number | null;
  /** The site the run landed on — the Patch Deployment page's own five. */
  remoteOffice: string;
}

/* The same five sites the Patch Deployment overview breaks its status down by, in the same
   order, so one fleet is not described by two different lists of offices. */
const REMOTE_OFFICES = ['Ahmedabad HQ', 'Mumbai Office', 'Bengaluru Campus', 'Pune Data Center', 'Local Office'];
/* Drawn weighted rather than round-robin: a branch runs a fraction of HQ's endpoints, and a
   flat five-way split would claim every site tests the same volume. */
const OFFICE_DRAW = [
  'Ahmedabad HQ', 'Ahmedabad HQ', 'Ahmedabad HQ', 'Mumbai Office', 'Mumbai Office',
  'Bengaluru Campus', 'Bengaluru Campus', 'Pune Data Center', 'Local Office', 'Local Office',
];

const RUN_STATUS_COLOR: Record<RunStatus, string> = {
  Draft: '#94A3B8', 'Ready to Deploy': '#3D8BD0', 'In Progress': '#F59E0B',
  Completed: '#22C55E', 'Partial Completed': '#EAB308', Expired: '#DC2626', Cancelled: '#64748B',
};
const TEST_STATUS_COLOR: Record<TestStatus, string> = {
  Passed: '#22C55E', Failed: '#DC2626', 'In Progress': '#3D8BD0', Pending: '#94A3B8',
};
const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: '#DC2626', Important: '#F97316', Moderate: '#F59E0B', Low: '#22C55E', Unspecified: '#94A3B8',
};

const PATCH_NAMES = [
  'Cumulative Update for Windows 11 Version 23H2',
  'Security Update for Microsoft Defender Platform',
  '.NET Framework 4.8.1 Security Rollup',
  'Google Chrome Enterprise Security Update',
  'Servicing Stack Update for Windows Server 2022',
  'Microsoft Edge (Chromium) Security Update',
  'Oracle Java SE Critical Patch Update',
  'Adobe Acrobat Reader DC Security Update',
  'Mozilla Firefox ESR Security Update',
  '7-Zip Security Update',
];

/* Deterministic per schedule, and FAITHFUL to its counts: one run per completed case (passed,
   bar a deterministic few that failed) plus one per pending case still in flight. A schedule
   that has never run produces none, which is why the grid shows an empty state rather than
   invented history. */
export const runsFor = (t: AutomaticPatchTest): TestRun[] => {
  if (!t.totalTests || !t.lastExecution) return [];
  const seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = new Date(t.lastExecution.replace(/^[A-Za-z]{3},\s*/, ''));
  const anchor = Number.isNaN(base.getTime()) ? new Date() : base;
  const sevs: Severity[] = ['Critical', 'Important', 'Moderate', 'Low', 'Unspecified'];

  const out: TestRun[] = [];
  const total = t.totalTests;
  for (let i = 0; i < total; i++) {
    const h = seed + i * 37;
    const done = i < (t.completedTests ?? 0);
    /* Roughly one in seven completed runs failed its test — enough to make the Failed tile
       and the red donut slice mean something without drowning the set. */
    const failed = done && h % 7 === 0;
    const testStatus: TestStatus = done ? (failed ? 'Failed' : 'Passed') : (h % 3 === 0 ? 'Pending' : 'In Progress');
    const status: RunStatus = done
      ? (failed ? 'Partial Completed' : 'Completed')
      : testStatus === 'Pending'
        ? (h % 5 === 0 ? 'Draft' : 'Ready to Deploy')
        : 'In Progress';
    const created = new Date(anchor);
    created.setHours(created.getHours() - (i * 9 + (h % 11)));
    const observationStart = status === 'Draft' ? null : new Date(created.getTime() + 36e5 * (1 + (h % 4)));
    out.push({
      /* A PDR id, because these ARE patch deployments — that is the tab's name. The old
         "APT-14-R01" form also wrapped onto three lines in its column. */
      id: `PDR-${1200 + ((seed * 13 + i * 29) % 800)}`,
      name: PATCH_NAMES[h % PATCH_NAMES.length],
      status,
      testStatus,
      severity: sevs[h % sevs.length],
      created,
      observationStart,
      /* Only a run waiting on an approver has a clock running. */
      approvalHoursLeft: status === 'Ready to Deploy' ? 4 + (h % 68) : null,
      remoteOffice: OFFICE_DRAW[(h * 7) % OFFICE_DRAW.length],
    });
  }
  return out;
};

const RUN_STATUSES: RunStatus[] = ['Draft', 'Ready to Deploy', 'In Progress', 'Completed', 'Partial Completed', 'Expired', 'Cancelled'];
/* The module's own six. Two of them are CALENDAR-relative, not rolling — "This Week" means
   since Monday, not the last seven days — so each option carries its own start rather than a
   day count, which would have quietly made them the same cut. */
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const TIMEFRAMES: { label: string; from: () => Date }[] = [
  { label: 'Today', from: () => startOfDay(new Date()) },
  { label: 'Last 7 Days', from: () => new Date(Date.now() - 7 * 864e5) },
  { label: 'Last 15 Days', from: () => new Date(Date.now() - 15 * 864e5) },
  { label: 'Last 30 Days', from: () => new Date(Date.now() - 30 * 864e5) },
  {
    label: 'This Week',
    from: () => {
      const d = startOfDay(new Date());
      /* Week starts Monday; getDay() calls Sunday 0, so it rolls back six days, not one. */
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d;
    },
  },
  { label: 'This Month', from: () => { const d = startOfDay(new Date()); d.setDate(1); return d; } },
];
/** The product opens on Last 7 Days. */
const DEFAULT_TIMEFRAME = TIMEFRAMES[1];

/** "2d 4h" — the shape an approval clock is read in. */
const fmtRemaining = (h: number | null) => {
  if (h === null) return null;
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
};

/* The panel grid's columns. Widths are the STARTING point — every one is drag-resizable from
   its header edge, like the listing grids. Sized so "Partial Completed" and the full date
   stamp both fit on one line before anyone touches them. */
const PANEL_COLS = [
  { key: 'id', label: 'ID', w: 110 },
  { key: 'name', label: 'Name', w: 300 },
  { key: 'status', label: 'Status', w: 165 },
  { key: 'testStatus', label: 'Test Status', w: 130 },
  { key: 'created', label: 'Created Date', w: 180 },
  { key: 'observation', label: 'Observation Start Time', w: 195 },
  { key: 'approval', label: 'Remaining Approval Time', w: 200 },
  /* One icon now, so just wide enough for its own heading. */
  { key: 'actions', label: 'Actions', w: 84 },
] as const;
const MIN_COL_W = 72;

/* The trend chart's series, declared ONCE so the stacked bars and the legend below them read
   the same list — a chart whose key is written out separately is a colour mismatch waiting
   to happen. Order is the stacking order, bottom to top. */
const TREND_SERIES = [
  { key: 'Success', color: '#22C55E' },
  { key: 'Fail', color: '#DC2626' },
  { key: 'In Progress', color: '#3D8BD0' },
  { key: 'Other', color: '#94A3B8' },
] as const;

/* ── Small shared bits, in the house treatment ─────────────────────────────── */

const CHIP = 'inline-flex items-center rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#364658]';
const Dot = ({ color }: { color: string }) => (
  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
);

/* The dark breakdown tooltip the Patch Deployment overview uses (`CatTooltip` there) —
   written out rather than imported, because that component lives inside a 5k-line drawer
   this listing has no other reason to pull in. Title, a dot-label-value row per series,
   then a ruled Total, so the day's shape and its size read in one stop. */
const TrendTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: Record<string, number | string> }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = TREND_SERIES.reduce((n, s) => n + (d[s.key] as number), 0);
  return (
    <div className="min-w-[160px] rounded-md bg-[#111827] px-3 py-2 text-white shadow-xl">
      <div className="mb-1.5 text-[12px] font-semibold">{d.label}</div>
      {TREND_SERIES.map((s) => (
        <div key={s.key} className="flex items-center gap-2 py-0.5 text-[11px]">
          <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="flex-1 text-white/85">{s.key}</span>
          <span className="font-semibold tabular-nums">{d[s.key]}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-white/15 pt-1 text-[11px]">
        <span className="text-white/85">Total</span>
        <span className="font-semibold tabular-nums">{total}</span>
      </div>
    </div>
  );
};

function Tile({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="text-[12px] text-[#64748B]">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tabular-nums" style={{ color: color ?? '#1E293B' }}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[#94A3B8]">{sub}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-[#DFE5ED] bg-white">
      {/* Same banded header the dashboard widgets use (AssetDashboardView's Card). */}
      <div className="rounded-t-[7px] border-b border-[#F0F2F5] bg-[#F8FAFC] px-4 py-2.5 text-[13px] font-semibold text-[#1E293B]">
        {title}
      </div>
      <div className="flex flex-1 p-4">{children}</div>
    </div>
  );
}

/* A donut and its key, sharing one hover: pointing at a legend row paints every OTHER
   slice back to a tint and moves the centre figure onto the one you asked about — the
   dashboard's own `DonutWithLegend` behaviour, which both `Donut` and `Legend` already
   support through `active`/`onHover`. The state has to live here because the two halves
   are siblings. */
function DonutCard({ title, segs, total, centerLabel }: { title: string; segs: { label: string; value: number; color: string }[]; total: number; centerLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Card title={title}>
      <div className="flex flex-1 items-center justify-center gap-8">
        <Donut segs={segs} total={total} centerLabel={centerLabel} active={active} />
        <Legend segs={segs} total={total} active={active} onHover={setActive} />
      </div>
    </Card>
  );
}

type TrendRow = { label: string; Success: number; Fail: number; 'In Progress': number; Other: number };

/* Office names are two words and would collide on a shared axis, so they break over two
   lines on the first space — the Patch Deployment page's own `CatTick`. */
const OfficeTick = ({ x, y, payload }: any) => {
  const words = String(payload.value).split(' ');
  const rest = words.slice(1).join(' ');
  return (
    <g>
      <text x={x} y={y + 12} textAnchor="middle" fontSize={10} fill="#94A3B8">{words[0]}</text>
      {rest && <text x={x} y={y + 23} textAnchor="middle" fontSize={10} fill="#94A3B8">{rest}</text>}
    </g>
  );
};

/* The stacked per-office chart and its key, hovering together like the donuts above it —
   point at a series and the other bands drop back to a tint so one colour reads across
   the sites on its own. */
function TrendCard({ trend }: { trend: TrendRow[] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Card title="Patch Test Results by Remote Office">
      {/* Card's content wrapper is a flex ROW — the chart and its key have to be
          one child, or the legend lands beside the chart instead of under it. */}
      <div className="w-full">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
              <CartesianGrid vertical={false} stroke="#F0F2F5" />
              <XAxis dataKey="label" tick={<OfficeTick />} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={34} />
              <RTooltip cursor={{ fill: '#F9FAFB' }} content={<TrendTooltip />} />
              {TREND_SERIES.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="a"
                  fill={s.color}
                  fillOpacity={active && active !== s.key ? 0.14 : 1}
                  isAnimationActive={false}
                  /* Only the top band of the stack gets the rounded cap. */
                  radius={i === TREND_SERIES.length - 1 ? [3, 3, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* The key, reading from the SAME series list the bars do, so a colour can
            never say one thing in the chart and another underneath. Each entry
            carries its total for the window — the two donut legends beside it
            show counts too, and a bare colour key would say less. */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-3" onMouseLeave={() => setActive(null)}>
          {TREND_SERIES.map((s) => {
            const total = trend.reduce((n, r) => n + (r[s.key] as number), 0);
            const dim = !!active && active !== s.key;
            return (
              <button
                key={s.key}
                type="button"
                onMouseEnter={() => setActive(s.key)}
                onFocus={() => setActive(s.key)}
                onBlur={() => setActive(null)}
                className={`flex cursor-default items-center gap-2 rounded px-2 py-0.5 text-[12px] transition-all duration-150 hover:bg-[#F5F7FA] ${
                  dim ? 'opacity-40' : ''
                } ${active === s.key ? 'bg-[#F5F7FA]' : ''}`}
              >
                <Dot color={s.color} />
                <span className={active === s.key ? 'text-[#364658]' : 'text-[#64748B]'}>{s.key}</span>
                <span className="font-semibold tabular-nums text-[#364658]">{total}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ── The panel ─────────────────────────────────────────────────────────────── */

export function AutomaticPatchTestPanel({
  isOpen,
  onClose,
  test,
}: {
  isOpen: boolean;
  onClose: () => void;
  test: AutomaticPatchTest | null;
}) {
  const [tab, setTab] = useState<'runs' | 'analytics'>('runs');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RunStatus[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME);
  const [showTf, setShowTf] = useState(false);
  /* Dragged column widths. Seeded from PANEL_COLS so a width tweak there still takes effect. */
  const [colW, setColW] = useState<Record<string, number>>(
    () => Object.fromEntries(PANEL_COLS.map((c) => [c.key, c.w])),
  );
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  /* Clicking a heading sorts: ascending, then descending, then back to the natural order —
     a third click should return what you started with, not strand you in a sort. */
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key !== key ? { key, dir: 'asc' } : prev.dir === 'asc' ? { key, dir: 'desc' } : null));

  /* Listeners live on the WINDOW, not the handle: the pointer leaves the 12px grip the moment
     a drag starts, and a handle-bound listener would drop it. */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setColW((prev) => ({ ...prev, [d.key]: Math.max(MIN_COL_W, d.startW + (e.clientX - d.startX)) }));
    };
    const up = () => { dragRef.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const startResize = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { key, startX: e.clientX, startW: colW[key] };
    /* Hold the resize cursor and kill text selection for the whole drag. */
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const totalW = PANEL_COLS.reduce((n, c) => n + colW[c.key], 0);

  /* Each schedule opens fresh — a filter left from the last one would silently hide rows. */
  useEffect(() => {
    setTab('runs'); setSearch(''); setStatusFilter([]); setShowStatus(false);
    setTimeframe(DEFAULT_TIMEFRAME); setShowTf(false); setSort(null);
  }, [test?.id, isOpen]);

  const runs = useMemo(() => (test ? runsFor(test) : []), [test]);

  if (!isOpen || !test) return null;

  const q = search.trim().toLowerCase();
  const filtered = runs.filter((r) =>
    (statusFilter.length === 0 || statusFilter.includes(r.status)) &&
    (!q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)));

  /* Dates sort chronologically and counts numerically — a string compare would put
     "9 Sep" after "29 Sep" and a missing value above a real one. */
  const sortVal = (r: TestRun, key: string): string | number => {
    switch (key) {
      case 'id': return r.id;
      case 'name': return r.name;
      case 'status': return r.status;
      case 'testStatus': return r.testStatus;
      case 'created': return r.created.getTime();
      case 'observation': return r.observationStart?.getTime() ?? -Infinity;
      case 'approval': return r.approvalHoursLeft ?? -Infinity;
      default: return '';
    }
  };
  const gridRows = sort
    ? [...filtered].sort((a, b) => {
        const x = sortVal(a, sort.key); const y = sortVal(b, sort.key);
        const n = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return sort.dir === 'asc' ? n : -n;
      })
    : filtered;

  /* Analytics reads the SAME runs, narrowed to the chosen window. */
  const cutoff = timeframe.from().getTime();
  const scoped = runs.filter((r) => r.created.getTime() >= cutoff);
  const count = (p: (r: TestRun) => boolean) => scoped.filter(p).length;
  const passed = count((r) => r.testStatus === 'Passed');
  const failed = count((r) => r.testStatus === 'Failed');
  const running = count((r) => r.testStatus === 'In Progress');

  const statusSegs = RUN_STATUSES
    .map((s) => ({ label: s, value: count((r) => r.status === s), color: RUN_STATUS_COLOR[s] }))
    .filter((s) => s.value > 0);
  const sevSegs = (['Critical', 'Important', 'Moderate', 'Low', 'Unspecified'] as Severity[])
    .map((s) => ({ label: s, value: count((r) => r.severity === s), color: SEVERITY_COLOR[s] }))
    .filter((s) => s.value > 0);

  /* Results by remote office. Every site in `REMOTE_OFFICES` gets a column, including the
     ones that ran nothing in this window — an empty column says "Pune tested nothing this
     week", which is an answer; dropping the site hides the question. */
  const byOffice = REMOTE_OFFICES.map((office) => {
    const row = { label: office, Success: 0, Fail: 0, 'In Progress': 0, Other: 0 };
    for (const r of scoped) {
      if (r.remoteOffice !== office) continue;
      if (r.testStatus === 'Passed') row.Success += 1;
      else if (r.testStatus === 'Failed') row.Fail += 1;
      else if (r.testStatus === 'In Progress') row['In Progress'] += 1;
      else row.Other += 1;
    }
    return row;
  });

  /* Sticky lives on the TH, not the THEAD: a background set on <thead> is not painted for a
     sticky header, so rows scrolled underneath showed straight through the headings. The
     inset shadow draws the bottom hairline, because a border-collapse border is dropped on a
     sticky cell. Same recipe as the listing grid. */
  const th = 'sticky top-0 z-20 whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wide text-[#64748B] shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)]';
  const td = 'overflow-hidden px-4 py-3 text-[12px] text-[#364658]';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[1080px] max-w-[96vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold text-[#364658]">
            <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{test.id}</span>
            <span className="truncate">{test.name}</span>
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs — the product's content-tab treatment, not a segmented control. */}
        <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] px-5">
          {([['runs', 'Patch Deployment'], ['analytics', 'Analytics']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-2 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? 'border-[#3D8BD0] text-[#3D8BD0]'
                  : 'border-transparent text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#F9FAFB] hover:text-[#364658]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'runs' ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-8 w-[260px] rounded border border-[#E5E7EB] bg-white pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowStatus((v) => !v)}
                  className={`flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] transition-colors ${
                    statusFilter.length
                      ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                      : 'border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Funnel size={14} />
                  {statusFilter.length ? `${statusFilter[0]}${statusFilter.length > 1 ? ` +${statusFilter.length - 1}` : ''}` : 'Status'}
                </button>
                {showStatus && (
                  <>
                    {/* Above the grid's STICKY header, which also sits at z-20 and — being
                        later in the DOM — won the tie and painted over this menu. */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatus(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 w-[210px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                      {RUN_STATUSES.map((s) => {
                        const on = statusFilter.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => setStatusFilter((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                          >
                            <Dot color={RUN_STATUS_COLOR[s]} />
                            <span className="flex-1 truncate">{s}</span>
                            <Check size={14} className={`flex-shrink-0 text-[#3D8BD0] ${on ? '' : 'invisible'}`} />
                          </button>
                        );
                      })}
                      {statusFilter.length > 0 && (
                        <button
                          onClick={() => { setStatusFilter([]); setShowStatus(false); }}
                          className="mt-1 w-full border-t border-[#F0F2F5] px-3 py-1.5 text-left text-[12px] text-[#64748B] hover:bg-[#F5F7FA]"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <span className="ml-auto text-[12px] text-[#94A3B8]">
                {gridRows.length} of {runs.length} deployment{runs.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Grid */}
            <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
              {/* `table-fixed` + an explicit <colgroup> is what makes the widths draggable —
                  without it the browser re-flows every column from its content and a drag
                  does nothing. */}
              <table className="w-full table-fixed" style={{ minWidth: totalW }}>
                <colgroup>
                  {PANEL_COLS.map((c) => <col key={c.key} style={{ width: colW[c.key] }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {PANEL_COLS.map((c) => {
                      const sortable = c.key !== 'actions';
                      const active = sort?.key === c.key;
                      return (
                        <th
                          key={c.key}
                          title={c.label}
                          onClick={sortable ? () => toggleSort(c.key) : undefined}
                          /* The listing grid's header recipe: a light-grey wash and a darker
                             label on hover, so the row reads as something you can act on
                             rather than a static caption. */
                          className={`${th} group/th relative transition-colors ${
                            sortable ? 'cursor-pointer hover:bg-[#F7F9FB] hover:text-[#364658]' : ''
                          } ${active ? 'bg-[#F7F9FB] text-[#364658]' : 'bg-white'}`}
                        >
                          {/* Grip — the "this column is draggable" affordance, on hover. */}
                          <GripVertical size={12} className="pointer-events-none absolute left-[3px] top-1/2 -translate-y-1/2 text-[#9CA3AF] opacity-0 transition-opacity group-hover/th:opacity-100" />
                          <span className="flex items-center gap-0.5 overflow-hidden">
                            <span className="truncate">{c.label}</span>
                            {sortable && (
                              <span className={`flex h-5 flex-shrink-0 items-center justify-center rounded px-0.5 transition-all ${active ? '' : 'opacity-0 group-hover/th:opacity-100'}`}>
                                {active
                                  ? (sort!.dir === 'asc' ? <ArrowUp size={12} className="text-[#3D8BD0]" /> : <ArrowDown size={12} className="text-[#3D8BD0]" />)
                                  : <ArrowUpDown size={12} className="text-[#9CA3AF]" />}
                              </span>
                            )}
                          </span>
                          {/* Nothing at rest — the rule only appears when you reach the edge,
                              exactly as the listing grid's handle behaves. */}
                          <span
                            onMouseDown={(e) => startResize(e, c.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="group/rz absolute right-0 top-0 z-10 flex h-full w-3 cursor-col-resize items-center justify-end"
                            title="Drag to resize column"
                          >
                            <span className="h-full w-[2px] bg-transparent transition-colors group-hover/rz:bg-[#3D8BD0]" />
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((r) => (
                    <tr key={r.id} className="border-b border-[#F0F2F5] transition-colors hover:bg-[#F9FAFB]">
                      <td className={`${td} whitespace-nowrap`}>{/* The listing grid's id pill, to the pixel — px-2 / 12px / semibold. It was a
                              smaller, lighter variant, so the same id read as two different things
                              on the two surfaces. */}
                        <span className="inline-block whitespace-nowrap rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.id}</span></td>
                      <td className={td}><span className="block truncate">{r.name}</span></td>
                      {/* One line, always. "Partial Completed" wrapped onto two and made its
                          row taller than every other — a status that reflows is a status you
                          cannot scan down the column. */}
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          <Dot color={RUN_STATUS_COLOR[r.status]} />
                          <span className="truncate whitespace-nowrap">{r.status}</span>
                        </span>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          <Dot color={TEST_STATUS_COLOR[r.testStatus]} />
                          <span className="truncate whitespace-nowrap">{r.testStatus}</span>
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtGridDateTime(r.created)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {r.observationStart ? fmtGridDateTime(r.observationStart) : <span className="text-[#B6C0CC]">—</span>}
                      </td>
                      <td className={td}>
                        {/* Only a run waiting on an approver has a clock; under a day it reads
                            amber, because that is the one worth acting on today. */}
                        {r.approvalHoursLeft === null
                          ? <span className="text-[#B6C0CC]">—</span>
                          : <span className={CHIP} style={r.approvalHoursLeft < 24 ? { backgroundColor: '#FEF3C7', color: '#B45309' } : undefined}>{fmtRemaining(r.approvalHoursLeft)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {/* A cross, not a bin: this takes the deployment off THIS test — the
                            patch and its run both carry on existing. The ticket Relations
                            tab's remove exactly: red at rest, the wash only on hover. */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="flex size-7 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEE2E2]"><X size={15} /></button>
                          </TooltipTrigger>
                          <TooltipContent>Remove from this test</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gridRows.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-1 py-20 text-center">
                  <div className="text-[14px] font-medium text-[#364658]">
                    {runs.length === 0 ? 'No deployments yet' : 'No deployments match'}
                  </div>
                  <div className="text-[12px] text-[#94A3B8]">
                    {runs.length === 0
                      ? 'This schedule has not run, so it has produced no patch deployments.'
                      : 'Try a different search or clear the status filter.'}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
            {/* Timeframe */}
            <div className="flex justify-end">
              <div className="relative">
                <button
                  onClick={() => setShowTf((v) => !v)}
                  className="flex h-8 items-center gap-2 rounded border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                >
                  {timeframe.label}
                  <ChevronDown size={14} className="text-[#9CA3AF]" />
                </button>
                {showTf && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTf(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-[170px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                      {TIMEFRAMES.map((t) => (
                        <button
                          key={t.label}
                          onClick={() => { setTimeframe(t); setShowTf(false); }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                        >
                          <span className="flex-1">{t.label}</span>
                          <Check size={14} className={`text-[#3D8BD0] ${timeframe.label === t.label ? '' : 'invisible'}`} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tiles — every one derived from the SAME runs the grid lists. */}
            <div className="grid grid-cols-3 gap-3">
              <Tile label="Patches Tested" value={scoped.length} sub="in this window" />
              <Tile label="Successfully Tested" value={passed} color={passed ? '#22A06B' : undefined} sub="passed validation" />
              <Tile label="Failed Tests" value={failed} color={failed ? '#DC2626' : undefined} sub="need investigation" />
              <Tile label="In Progress Tests" value={running} color={running ? '#3D8BD0' : undefined} sub="still running" />
              <Tile
                label="Auto Approved"
                value={`${scoped.length ? Math.round((passed / scoped.length) * 100) : 0}%`}
                color="#22A06B"
                sub="passed and cleared automatically"
              />
              <Tile label="Active Tests" value={test.enabled ? 1 : 0} color={test.enabled ? '#3D8BD0' : '#94A3B8'} sub={test.enabled ? 'schedule is enabled' : 'schedule is switched off'} />
            </div>

            {scoped.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] bg-white py-20 text-center">
                <div className="text-[14px] font-medium text-[#364658]">Nothing ran in this window</div>
                <div className="text-[12px] text-[#94A3B8]">Widen the timeframe to see earlier results.</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <DonutCard title="Automatic Patch Test Status" segs={statusSegs} total={scoped.length} centerLabel="Runs" />
                  <DonutCard title="Patch Test Severity Distribution" segs={sevSegs} total={scoped.length} centerLabel="Patches" />
                </div>

                <TrendCard trend={byOffice} />
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-[#DFE5ED] px-5 py-3">
          <button
            onClick={onClose}
            className="h-8 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
