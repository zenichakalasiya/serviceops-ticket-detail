/* ── Asset dashboard ─────────────────────────────────────────────────────────
   The Dashboard layout for the asset/procurement listings — the TICKET
   dashboard's visual chrome (widget cards with the light title band, headline
   tiles, hover-linked donut + legend, labelled bar rows, the semi-circle gauge)
   rebuilt CONFIG-DRIVEN: each module hands in its tiles and chart sections,
   built from the same rows its grid renders, and every segment carries the
   filter its click drills into. Cloned primitives, not imports — the ticket
   dashboard stays free to diverge. */
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, ChevronRight, Inbox, Map as MapIcon } from 'lucide-react';
import { BreakdownPanel } from './BreakdownPanel';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { FilterRule } from './TicketFilterBar';

export type DashSeg = {
  label: string;
  value: number;
  color: string;
  /** Rules the click applies — a segment without rules is informational only. */
  filter?: Omit<FilterRule, 'id'>[];
};
export type DashTile = {
  icon: LucideIcon;
  color: string;
  label: string;
  value: string | number;
  sub?: string;
  filter?: Omit<FilterRule, 'id'>[];
  hint?: string;
};
export type DashSection =
  | { kind: 'donut'; title: string; sub?: string; centerLabel: string; segs: DashSeg[] }
  | { kind: 'bars'; title: string; sub?: string; rows: DashSeg[]; allRows?: DashSeg[]; panelSubject?: string; panelColumnLabel?: string; panelCountLabel?: string }
  | { kind: 'gauge'; title: string; sub?: string; pct: number; caption: string; note?: string }
  /** Vertical rounded-top column chart (Recharts) — clicks drill like everything else.
      `mapGeo` (label → [lat, lng]) adds a chart/map toggle whose map view is the
      REAL OpenStreetMap embed the detail page's Current-Location widget uses,
      with clickable count pins overlaid per site. */
  | { kind: 'columns'; title: string; sub?: string; rows: DashSeg[]; allRows?: DashSeg[]; mapGeo?: Record<string, [number, number]>; panelSubject?: string; panelColumnLabel?: string; panelCountLabel?: string }
  /** Gradient area trend (Recharts) — informational, no drill. */
  | { kind: 'area'; title: string; sub?: string; color?: string; points: { label: string; value: number }[] }
  /** One 100%-stacked segmented bar with a legend — compact composition read. */
  | { kind: 'stack'; title: string; sub?: string; segs: DashSeg[] };
export type DashConfig = { tiles: DashTile[]; sections: DashSection[] };

/* ── Cloned chrome (TicketDashboardView recipes) ─────────────────────────── */

function Card({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-[#DFE5ED] bg-white">
      <div className="flex items-center gap-2 rounded-t-[7px] border-b border-[#F0F2F5] bg-[#F8FAFC] px-4 py-2.5">
        <div className="min-w-0 flex-1 text-[13px] font-semibold text-[#1E293B]" title={sub}>
          {title}
        </div>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

function Tile({ tile, onDrill }: { tile: DashTile; onDrill: (rules: Omit<FilterRule, 'id'>[], label: string) => void }) {
  const Icon = tile.icon ?? Inbox;
  const body = (
    <div
      className={`flex items-start gap-3 rounded-lg border border-[#DFE5ED] bg-white p-3.5 text-left transition-all ${
        tile.filter ? 'cursor-pointer hover:border-[#C9D4E0] hover:shadow-[0_2px_10px_rgba(16,24,40,0.07)]' : ''
      }`}
    >
      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${tile.color}1A` }}>
        <Icon size={16} style={{ color: tile.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-[#64748B]">{tile.label}</div>
        <div className="mt-0.5 text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums">{tile.value}</div>
        {tile.sub && <div className="truncate text-[11px] text-[#94A3B8]">{tile.sub}</div>}
      </div>
    </div>
  );
  if (!tile.filter) return body;
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <button onClick={() => onDrill(tile.filter!, tile.label)} className="block w-full">
          {body}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tile.hint ?? 'Open in list view'}</TooltipContent>
    </Tooltip>
  );
}

/* Exported so a PANEL can wear the same donut as the dashboards rather than growing a
   second one. Segments without a `filter` render non-clickable, which is what a read-only
   panel wants. */
export function Donut({ segs, total, centerLabel, size = 148, active = null }: { segs: DashSeg[]; total: number; centerLabel: string; size?: number; active?: string | null }) {
  const hot = active ? segs.find((s) => s.label === active) ?? null : null;
  let acc = 0;
  const stops = segs
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = (acc / total) * 360;
      acc += s.value;
      const paint = !hot || hot.label === s.label ? s.color : `${s.color}24`;
      return `${paint} ${from}deg ${(acc / total) * 360}deg`;
    })
    .join(', ');
  return (
    <div
      className="relative flex-shrink-0 rounded-full"
      style={{ width: size, height: size, background: total > 0 ? `conic-gradient(${stops})` : '#F1F5F9' }}
    >
      <div className="absolute flex flex-col items-center justify-center rounded-full bg-white px-3" style={{ inset: Math.round(size * 0.16) }}>
        <span className="text-[20px] font-semibold leading-none tabular-nums transition-colors" style={{ color: hot ? hot.color : '#1E293B' }}>
          {hot ? hot.value : total}
        </span>
        <span className="mt-1 w-full truncate text-center text-[10px] text-[#7B8FA5]">{hot ? hot.label : centerLabel}</span>
      </div>
    </div>
  );
}

export function Legend({
  segs,
  total,
  onPick,
  active = null,
  onHover,
}: {
  segs: DashSeg[];
  total: number;
  onPick?: (s: DashSeg) => void;
  active?: string | null;
  onHover?: (label: string | null) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5" onMouseLeave={onHover ? () => onHover(null) : undefined}>
      {segs.map((s) => {
        const dim = !!active && active !== s.label;
        const clickable = !!onPick && !!s.filter;
        return (
          <button
            key={s.label}
            onClick={clickable ? () => onPick!(s) : undefined}
            onMouseEnter={onHover ? () => onHover(s.label) : undefined}
            onFocus={onHover ? () => onHover(s.label) : undefined}
            onBlur={onHover ? () => onHover(null) : undefined}
            className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-[12px] transition-all duration-150 ${
              clickable ? 'hover:bg-[#F5F7FA]' : 'cursor-default'
            } ${dim ? 'opacity-40' : ''} ${active === s.label ? 'bg-[#F5F7FA]' : ''}`}
          >
            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className={`min-w-0 max-w-[160px] truncate text-left ${active === s.label ? 'text-[#364658]' : 'text-[#64748B]'}`}>{s.label}</span>
            <span className="font-semibold tabular-nums text-[#364658]">{s.value}</span>
            <span className="text-[11px] tabular-nums text-[#94A3B8]">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </button>
        );
      })}
    </div>
  );
}

function DonutWithLegend({ segs, centerLabel, onPick }: { segs: DashSeg[]; centerLabel: string; onPick: (s: DashSeg) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const total = segs.reduce((n, s) => n + s.value, 0);
  return (
    <div className="flex flex-1 items-center justify-center gap-8">
      <Donut segs={segs} total={total} centerLabel={centerLabel} active={active} />
      <Legend segs={segs} total={total} onPick={onPick} active={active} onHover={setActive} />
    </div>
  );
}

function BarRow({ seg, max, onClick }: { seg: DashSeg; max: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded px-1 py-1 text-[12px] ${onClick ? 'transition-colors hover:bg-[#F5F7FA]' : 'cursor-default'}`}
    >
      <span className="w-[128px] flex-shrink-0 truncate text-left text-[#64748B]">{seg.label}</span>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
        <span className="block h-full rounded-full transition-all" style={{ width: `${max ? (seg.value / max) * 100 : 0}%`, backgroundColor: seg.color }} />
      </span>
      <span className="w-7 flex-shrink-0 text-right font-semibold tabular-nums text-[#364658]">{seg.value}</span>
    </button>
  );
}

/** House chart tooltip: white card, bold dark value — never a tinted default box. */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="app-menu min-w-[132px] rounded-lg border border-[#DFE5ED] bg-white px-3 py-2 shadow-lg">
      {label !== undefined && <div className="mb-1 text-[11px] font-medium text-[#7B8FA5]">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p: any) => {
          const dot = p.color || p.payload?.color || p.payload?.fill;
          return (
            <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[12px]">
              {dot && <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
              <span className="text-[#64748B]">{p.name === 'value' ? 'Count' : p.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-[#1E293B]">{p.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColumnsChart({ rows, onPick }: { rows: DashSeg[]; onPick: (s: DashSeg) => void }) {
  const data = rows.map((r) => ({ name: r.label, value: r.value, color: r.color, seg: r }));
  return (
    <div className="h-[224px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="name"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tick={{ fontSize: 10, fill: '#64748B' }}
            tickFormatter={(v: string) => (v.length > 11 ? `${v.slice(0, 10)}…` : v)}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
          <RTooltip content={<ChartTip />} cursor={{ fill: '#F5F7FA' }} />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            onClick={(d: any) => d?.payload?.seg?.filter && onPick(d.payload.seg)}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} style={d.seg.filter ? { cursor: 'pointer' } : undefined} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaTrend({ points, color = '#3D8BD0', id }: { points: { label: string; value: number }[]; color?: string; id: string }) {
  return (
    <div className="h-[224px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points.map((p) => ({ name: p.label, value: p.value }))} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id={`dashfade-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#E5E7EB' }} tick={{ fontSize: 10, fill: '#64748B' }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
          <RTooltip content={<ChartTip />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#dashfade-${id})`} dot={{ r: 2.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** One 100%-stacked bar + legend — the composition read at a glance. */
function StackBar({ segs, onPick }: { segs: DashSeg[]; onPick: (s: DashSeg) => void }) {
  const total = segs.reduce((n, s) => n + s.value, 0);
  const live = segs.filter((s) => s.value > 0);
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="flex h-4 w-full gap-[3px] overflow-hidden rounded-full">
        {live.map((s) => (
          <Tooltip key={s.label} delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={s.filter ? () => onPick(s) : undefined}
                className={`h-full min-w-[8px] transition-[filter] first:rounded-l-full last:rounded-r-full ${s.filter ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}
                style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              />
            </TooltipTrigger>
            <TooltipContent>
              {s.label}: {s.value} ({total ? Math.round((s.value / total) * 100) : 0}%)
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <Legend segs={segs} total={total} onPick={onPick} />
    </div>
  );
}

/* ── Location map — the REAL map, the Current-Location widget's recipe ────
   An OpenStreetMap embed (same iframe the hardware detail page uses) frozen
   under a click-capture layer, with our own count pins overlaid per site via
   a Web-Mercator projection of each lat/lng into the fixed bbox. Sites with
   no geography (e.g. "Remote") dock as chips in the corner. */
function GeoMap({
  rows,
  geo,
  onPick,
}: {
  rows: DashSeg[];
  geo: Record<string, [number, number]>;
  onPick: (s: DashSeg) => void;
}) {
  // Fixed viewport over the sites (India). The overlay math depends on it.
  const B = { lonMin: 62, latMin: 5, lonMax: 96, latMax: 36 };
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const yTop = mercY(B.latMax);
  const yBot = mercY(B.latMin);
  const posOf = ([lat, lng]: [number, number]) => ({
    left: ((lng - B.lonMin) / (B.lonMax - B.lonMin)) * 100,
    top: ((yTop - mercY(lat)) / (yTop - yBot)) * 100,
  });
  const placed = rows.filter((r) => geo[r.label]);
  const offMap = rows.filter((r) => !geo[r.label]);
  return (
    <div className="relative h-[224px] w-full overflow-hidden rounded-md border border-[#EEF1F4]">
      <iframe
        title="Assets by location"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${B.lonMin}%2C${B.latMin}%2C${B.lonMax}%2C${B.latMax}&layer=mapnik`}
        className="h-full w-full"
        style={{ border: 0 }}
        loading="lazy"
      />
      {/* Click-capture layer — freezes the embed's pan/zoom so the overlay
          pins can never drift off their cities. */}
      <div className="absolute inset-0" />
      {placed.map((s) => {
        const p = posOf(geo[s.label]);
        return (
          <Tooltip key={s.label} delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={s.filter ? () => onPick(s) : undefined}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${s.filter ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ left: `${p.left}%`, top: `${p.top}%` }}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[#3D8BD0] text-[12px] font-semibold text-white shadow-[0_2px_6px_rgba(16,24,40,0.35)] ring-2 ring-white transition-transform hover:scale-110">
                  {s.value}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {s.label} — {s.value} asset{s.value === 1 ? '' : 's'}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {offMap.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
          {offMap.map((s) => (
            <button
              key={s.label}
              onClick={s.filter ? () => onPick(s) : undefined}
              className="flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white/95 px-2 py-1 text-[11px] font-medium text-[#364658] shadow-sm transition-colors hover:border-[#3D8BD0]"
            >
              {s.label}
              <span className="font-semibold tabular-nums text-[#3D8BD0]">{s.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Gauge({ pct, caption }: { pct: number; caption: string }) {
  const r = 70;
  const len = Math.PI * r;
  const color = pct >= 90 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative h-[100px] w-[168px] flex-shrink-0">
      <svg width="168" height="94" viewBox="0 0 168 94" aria-hidden>
        <path d="M14 84 A70 70 0 0 1 154 84" fill="none" stroke="#E9EEF4" strokeWidth="18" strokeLinecap="round" />
        <path
          d="M14 84 A70 70 0 0 1 154 84"
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${(len * pct) / 100} ${len}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center leading-none">
        <span className="text-[28px] font-semibold text-[#1E293B] tabular-nums">{pct}</span>
        <span className="text-[13px] font-medium text-[#64748B]">%</span>
        <div className="mt-1 text-[11px] text-[#94A3B8]">{caption}</div>
      </div>
    </div>
  );
}

/* ── The dashboard ──────────────────────────────────────────────────────── */

export function AssetDashboardView({
  config,
  empty,
  onDrillDown,
}: {
  config: DashConfig;
  /** Friendly line when the current scope has no rows ("Mine" on an unowned register). */
  empty?: string | null;
  onDrillDown: (rules: Omit<FilterRule, 'id'>[], label: string) => void;
}) {
  if (empty) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-white p-6">
        <div className="text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Inbox className="size-8 text-[#7B8FA5]" />
          </div>
          <h3 className="mb-1 text-[14px] font-semibold text-[#364658]">Nothing here for this scope</h3>
          <p className="text-[13px] text-[#7B8FA5]">{empty}</p>
        </div>
      </div>
    );
  }
  const pick = (title: string) => (s: DashSeg) => {
    if (s.filter) onDrillDown(s.filter, `${title}: ${s.label}`);
  };
  /* "View all" side panel — the ticket dashboard's BreakdownPanel, fed with a
     section's FULL list once the card can only show its top few. */
  const [panel, setPanel] = useState<{
    title: string;
    subject: string;
    columnLabel: string;
    countLabel: string;
    rows: DashSeg[];
  } | null>(null);
  /* Chart ⇄ map toggle, per card (keyed by title) — the drawers' segmented
     icon-pair recipe. */
  const [mapOn, setMapOn] = useState<Record<string, boolean>>({});
  const mapToggle = (title: string) => {
    const on = !!mapOn[title];
    const btn = (active: boolean, Icon: LucideIcon, label: string, next: boolean) => (
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setMapOn((m) => ({ ...m, [title]: next }))}
            className={`flex size-6 items-center justify-center transition-colors ${
              active ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#7B8FA5] hover:text-[#364658]'
            }`}
          >
            <Icon size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
    return (
      <span className="flex flex-shrink-0 items-center overflow-hidden rounded border border-[#DFE5ED] [&>button+button]:border-l [&>button+button]:border-[#DFE5ED]">
        {btn(!on, BarChart3, 'Chart view', false)}
        {btn(on, MapIcon, 'Map view', true)}
      </span>
    );
  };
  const viewAll = (sec: Extract<DashSection, { kind: 'columns' | 'bars' }>) =>
    sec.allRows && sec.allRows.length > sec.rows.length ? (
      <button
        onClick={() =>
          setPanel({
            title: sec.title,
            subject: sec.panelSubject ?? 'entries',
            columnLabel: sec.panelColumnLabel ?? 'Name',
            countLabel: sec.panelCountLabel ?? 'Assets',
            rows: sec.allRows!,
          })
        }
        className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
      >
        View all
        <ChevronRight size={13} />
      </button>
    ) : undefined;
  return (
    /* Same frame as the ticket dashboard; the RIGHT edge is pr-4 to line up
       with the grid toolbar's icon cluster (pl-6 pr-4), the KPI strip's rule. */
    <div className="space-y-4 bg-white pb-8 pl-6 pr-4 pt-4">
      {/* Headline tiles — each drills straight into the filtered list. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {config.tiles.map((t) => (
          <Tile key={t.label} tile={t} onDrill={onDrillDown} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {config.sections.map((sec) => (
          <Card
            key={sec.title}
            title={sec.title}
            sub={sec.sub}
            action={
              sec.kind === 'columns' || sec.kind === 'bars' ? (
                <span className="flex flex-shrink-0 items-center gap-2.5">
                  {sec.kind === 'columns' && sec.mapGeo ? mapToggle(sec.title) : null}
                  {viewAll(sec)}
                </span>
              ) : undefined
            }
          >
            {sec.kind === 'donut' ? (
              <DonutWithLegend segs={sec.segs} centerLabel={sec.centerLabel} onPick={pick(sec.title)} />
            ) : sec.kind === 'columns' ? (
              sec.mapGeo && mapOn[sec.title] ? (
                /* The map shows EVERY location — a pin costs less than a column. */
                <GeoMap rows={sec.allRows ?? sec.rows} geo={sec.mapGeo} onPick={pick(sec.title)} />
              ) : (
                <ColumnsChart rows={sec.rows} onPick={pick(sec.title)} />
              )
            ) : sec.kind === 'area' ? (
              <AreaTrend points={sec.points} color={sec.color} id={sec.title.replace(/\W+/g, '-')} />
            ) : sec.kind === 'stack' ? (
              <StackBar segs={sec.segs} onPick={pick(sec.title)} />
            ) : sec.kind === 'bars' ? (
              <div className="flex flex-1 flex-col justify-center space-y-1">
                {sec.rows.map((r) => (
                  <BarRow
                    key={r.label}
                    seg={r}
                    max={Math.max(...sec.rows.map((x) => x.value), 1)}
                    onClick={r.filter ? () => onDrillDown(r.filter!, `${sec.title}: ${r.label}`) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-6">
                <Gauge pct={sec.pct} caption={sec.caption} />
                {sec.note && <div className="max-w-[180px] text-[12px] leading-5 text-[#64748B]">{sec.note}</div>}
              </div>
            )}
          </Card>
        ))}
      </div>
      {panel && (
        <BreakdownPanel
          title={panel.title}
          subject={panel.subject}
          columnLabel={panel.columnLabel}
          countLabel={panel.countLabel}
          rows={panel.rows.map((r) => ({ label: r.label, value: r.value }))}
          onClose={() => setPanel(null)}
          onPick={(label) => {
            const s = panel.rows.find((r) => r.label === label);
            if (s?.filter) {
              setPanel(null);
              onDrillDown(s.filter, `${panel.title}: ${label}`);
            }
          }}
        />
      )}
    </div>
  );
}
