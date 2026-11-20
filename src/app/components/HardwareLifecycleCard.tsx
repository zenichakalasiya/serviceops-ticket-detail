/* ── Warranty + End of Service Lifecycle cards (Hardware asset Overview, Zeni 19–20 Nov 2026) ──
   Two cards in the Endpoint page's OS Lifecycle card layout (OsLifecycleCard): icon-badge header
   (title + the asset's name), a verdict line in the state's colour with its date, one sentence, a
   proportional timeline with Today on it, then the milestone dates with their distance from now.

     Warranty                    Warranty Start Date · Warranty Expiration Date · Warranty Last Sync Date
     End of Service Lifecycle    End Of Sale · End Of Support · End Of Life · EOSL Last Sync Date

   Matched to Zeni's reference image (20 Nov 2026), dates as dd/mm/yyyy.
   ⚠️ Shown ONLY on the first five hardware assets (AST-001…AST-005), which show them IN PLACE of
   the KPI cards. AST-004 carries the reference image's exact dates; the other four are varied so
   every state shows. All dates are mock — a real build reads them from Lifecycle Sync. */
import type { ReactNode } from 'react';
import { HardDrive, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { relativeDay } from './osLifecycle';

export interface HardwareLifecycle {
  warrantyStart: Date;
  warrantyEnd: Date;
  warrantySync: Date;
  /** `null` = the vendor has not published it yet (a STATE, not missing data). */
  endOfSale: Date | null;
  endOfSupport: Date | null;
  endOfLife: Date | null;
  eoslSync: Date;
}

const d = (s: string) => { const [dd, mm, yy] = s.split('/'); return new Date(`${yy}-${mm}-${dd}T00:00:00`); };

const HW_LIFECYCLE: Record<string, HardwareLifecycle> = {
  /* Warranty expired · past end of life. */
  'AST-001': { warrantyStart: d('26/10/2023'), warrantyEnd: d('25/10/2026'), warrantySync: d('18/11/2026'), endOfSale: d('17/01/2023'), endOfSupport: d('30/06/2025'), endOfLife: d('31/10/2026'), eoslSync: d('18/11/2026') },
  /* Warranty expiring soon · still on sale. */
  'AST-002': { warrantyStart: d('15/06/2023'), warrantyEnd: d('14/12/2026'), warrantySync: d('19/11/2026'), endOfSale: d('31/03/2027'), endOfSupport: d('31/03/2030'), endOfLife: d('31/03/2032'), eoslSync: d('19/11/2026') },
  /* Warranty active · sale ended, still supported. */
  'AST-003': { warrantyStart: d('16/03/2022'), warrantyEnd: d('15/03/2029'), warrantySync: d('17/11/2026'), endOfSale: d('30/05/2025'), endOfSupport: d('31/05/2029'), endOfLife: d('31/05/2031'), eoslSync: d('17/11/2026') },
  /* The reference image's exact dates: warranty expired · past end of support, before end of life. */
  'AST-004': { warrantyStart: d('09/03/2021'), warrantyEnd: d('08/03/2024'), warrantySync: d('31/08/2026'), endOfSale: d('30/09/2023'), endOfSupport: d('31/08/2026'), endOfLife: d('28/02/2027'), eoslSync: d('31/08/2026') },
  /* Warranty active · EOSL dates not published yet. */
  'AST-005': { warrantyStart: d('14/02/2023'), warrantyEnd: d('13/02/2028'), warrantySync: d('19/11/2026'), endOfSale: null, endOfSupport: null, endOfLife: null, eoslSync: d('19/11/2026') },
};

export const hardwareLifecycleOf = (assetId?: string | null): HardwareLifecycle | null =>
  (assetId && HW_LIFECYCLE[assetId]) || null;

/** dd/mm/yyyy, as the reference image writes dates. */
const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;

/** "2 years 6 months" / "5 months" / "12 days" — the headline's distance, finer than relativeDay. */
const span = (a: Date, b: Date) => {
  const [from, to] = a < b ? [a, b] : [b, a];
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  if (months < 1) { const days = Math.round((to.getTime() - from.getTime()) / 864e5); return `${days} day${days === 1 ? '' : 's'}`; }
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y} year${y === 1 ? '' : 's'}`, m && `${m} month${m === 1 ? '' : 's'}`].filter(Boolean).join(' ');
};

const GREEN = '#22C55E', AMBER = '#F59E0B', RED = '#DC2626', BLUE = '#3D8BD0', GREY = '#94A3B8';
/** Time spent past an end date — soft red, as the reference image draws it. */
const RED_TAIL = '#F0A59D';
const TEXT = { green: '#15803D', amber: '#B45309', red: '#B42318', slate: '#475569' };

interface Segment { from: Date; to: Date; color: string }
interface Milestone { label: string; date: Date | null; color: string }

/** The shared body: verdict, sentence, timeline with Today, milestones. */
function LifecycleCard({ title, subtitle, icon, tone, head, date, body, start, end, segments, milestones, wide, open }: {
  title: string; subtitle: string; icon: ReactNode; tone: string; head: string; date: Date | null; body: string;
  start: Date | null; end: Date | null; segments: Segment[]; milestones: Milestone[]; wide: boolean; open?: boolean;
}) {
  const now = new Date();
  const t0 = start?.getTime() ?? now.getTime();
  const t1 = end?.getTime() ?? now.getTime();
  const total = Math.max(1, t1 - t0);
  const pos = (dt: Date) => Math.max(0, Math.min(100, ((dt.getTime() - t0) / total) * 100));
  const todayPct = open ? 78 : pos(now);
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${tone}1A`, color: tone }}>{icon}</span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
          <div className="truncate text-[12px] text-[#64748B]">{subtitle}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[15px] font-semibold" style={{ color: tone === GREEN ? TEXT.green : tone === AMBER ? TEXT.amber : tone === RED ? TEXT.red : TEXT.slate }}>{head}</span>
        {date && (
          <span className="flex items-baseline gap-x-1.5">
            <span className="text-[13px] text-[#CBD5E1]">·</span>
            <span className="text-[13px] font-medium text-[#64748B]">{fmt(date)}</span>
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">{body}</p>

      <div className="mt-5">
        <div className="relative">
          <div className="pointer-events-none absolute -top-5 z-10 text-[11px] font-medium text-[#364658]"
            style={{ left: `${todayPct}%`, transform: todayPct < 6 ? 'translateX(0)' : todayPct > 94 ? 'translateX(-100%)' : 'translateX(-50%)' }}>Today</div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            {open ? (
              <span className="flex-1" style={{ background: 'repeating-linear-gradient(90deg, #CBD5E1 0 4px, transparent 4px 9px)' }} />
            ) : segments.map((s, i) => {
              /* Each segment is solid up to today and tinted after it — the part still ahead
                 should not read as time already served. */
              const a = pos(s.from), b = pos(s.to), w = Math.max(0, b - a);
              const done = w ? Math.max(0, Math.min(100, ((todayPct - a) / w) * 100)) : 0;
              return <span key={i} style={{ width: `${w}%`, background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${done}%, ${s.color}59 ${done}%)` }} />;
            })}
          </div>
          <span className="pointer-events-none absolute -top-0.5 h-3 w-0.5 bg-[#364658]" style={{ left: `calc(${todayPct}% - 1px)` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>{start ? fmt(start) : 'Not published'}</span>
          <span>{end && !open ? fmt(end) : 'Not published'}</span>
        </div>
      </div>

      <div className={`mt-5 grid ${wide ? (milestones.length === 4 ? 'grid-cols-4' : 'grid-cols-3') : 'grid-cols-2'} gap-x-6 gap-y-4 border-t border-[#F0F2F5] pt-4`}>
        {milestones.map((m) => (
          <div key={m.label} className="flex min-w-0 gap-1.5">
            <span className="mt-[5px] size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: m.date ? m.color : '#CBD5E1' }} />
            <div className="min-w-0">
              <div className={`truncate text-[12px] ${m.date ? 'text-[#64748B]' : 'text-[#A3AEBE]'}`} title={m.label}>{m.label}</div>
              {m.date ? (
                <>
                  <div className="mt-1 text-[13px] font-medium leading-[1.15] text-[#364658]">{fmt(m.date)}</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="mt-1 block w-fit cursor-help text-[11px] leading-[1.15] text-[#94A3B8]">{relativeDay(m.date, now)}</span>
                    </TooltipTrigger>
                    <TooltipContent>{m.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <div className="mt-1 text-[13px] font-medium leading-[1.15] text-[#A3AEBE]">Not published</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Warranty — start → expiration; once expired the bar runs on to today in red. */
export function WarrantyLifecycleCard({ assetId, assetName, wide }: { assetId?: string | null; assetName: string; wide: boolean }) {
  const l = hardwareLifecycleOf(assetId);
  if (!l) return null;
  const now = new Date();
  const daysLeft = Math.round((l.warrantyEnd.getTime() - now.getTime()) / 864e5);
  const expired = daysLeft < 0;
  const soon = !expired && daysLeft <= 30;
  const tone = expired ? RED : soon ? AMBER : GREEN;
  const head = expired ? `Warranty expired ${span(l.warrantyEnd, now)} ago` : `Warranty expires in ${span(now, l.warrantyEnd)}`;
  const body = expired
    ? `Coverage ended on ${fmt(l.warrantyEnd)}. Renew the warranty or plan a replacement.`
    : soon ? `Coverage ends on ${fmt(l.warrantyEnd)}. Renew it before then to avoid a coverage gap.`
    : `Covered until ${fmt(l.warrantyEnd)}.`;
  const end = expired ? now : l.warrantyEnd;
  return (
    <LifecycleCard title="Warranty" subtitle={assetName} icon={<ShieldCheck size={16} />} tone={tone} head={head} date={l.warrantyEnd} body={body}
      start={l.warrantyStart} end={end}
      segments={expired ? [{ from: l.warrantyStart, to: l.warrantyEnd, color: GREEN }, { from: l.warrantyEnd, to: now, color: RED_TAIL }]
        : [{ from: l.warrantyStart, to: l.warrantyEnd, color: soon ? AMBER : GREEN }]}
      milestones={[
        { label: 'Warranty Start Date', date: l.warrantyStart, color: GREEN },
        { label: 'Warranty Expiration Date', date: l.warrantyEnd, color: RED },
        { label: 'Warranty Last Sync Date', date: l.warrantySync, color: BLUE },
      ]} wide={wide} />
  );
}

/** End of Service Lifecycle — end of sale → end of support → end of life. */
export function EoslLifecycleCard({ assetId, assetName, wide }: { assetId?: string | null; assetName: string; wide: boolean }) {
  const l = hardwareLifecycleOf(assetId);
  if (!l) return null;
  const now = new Date();
  const { endOfSale: sale, endOfSupport: support, endOfLife: life } = l;
  const milestones: Milestone[] = [
    { label: 'End Of Sale', date: sale, color: BLUE },
    { label: 'End Of Support', date: support, color: AMBER },
    { label: 'End Of Life', date: life, color: RED },
    { label: 'EOSL Last Sync Date', date: l.eoslSync, color: GREY },
  ];
  const common = { title: 'End of Service Lifecycle', subtitle: assetName, icon: <HardDrive size={16} />, milestones, wide };

  if (!sale || !support || !life) {
    return <LifecycleCard {...common} tone={GREY} head="No end-of-service dates published" date={null} open
      body={`The vendor has not published end-of-sale, support or life dates for this model yet. They appear here once the EOSL sync finds them (last checked ${fmt(l.eoslSync)}).`}
      start={null} end={null} segments={[]} />;
  }
  const pastLife = now >= life;
  const pastSupport = now >= support;
  const onSale = now < sale;
  const tone = pastLife ? RED : pastSupport ? AMBER : GREEN;
  const head = pastLife ? `End of life reached ${span(life, now)} ago`
    : pastSupport ? `End of life in ${span(now, life)}`
    : `End of support in ${span(now, support)}`;
  const date = pastLife || pastSupport ? life : support;
  const body = pastLife ? `No vendor support since ${fmt(life)}. Replace this asset.`
    : pastSupport ? `End of support was reached on ${fmt(support)}. Plan a replacement before end of life.`
    : onSale ? `Still on sale until ${fmt(sale)}. Fully supported until ${fmt(support)}.`
    : `Sales ended on ${fmt(sale)}. Fully supported until ${fmt(support)}.`;
  /* The bar runs end of sale → end of life (or on to today once life has passed). An asset still
     on sale starts the bar at today rather than at a date in the future. */
  const start = onSale ? now : sale;
  const end = pastLife ? now : life;
  const segments: Segment[] = [
    { from: start, to: support, color: GREEN },
    { from: support, to: life, color: AMBER },
    ...(pastLife ? [{ from: life, to: now, color: RED_TAIL }] : []),
  ];
  return <LifecycleCard {...common} tone={tone} head={head} date={date} body={body} start={start} end={end} segments={segments} />;
}
