/* ── EOSL Support Lifecycle card (Hardware asset Overview, Zeni 19 Nov 2026) ──────────────
   The hardware twin of the Endpoint page's OS Lifecycle card (OsLifecycleCard): same layout —
   icon-badge header, a verdict line in the phase's colour, a proportional timeline with Today on
   it, then the milestone dates with their distance from now — over FOUR hardware milestones:

     GA (general availability) → EOS (end of sale) → EOSL (end of service life) → Last support.

   ⚠️ Shown ONLY on the first five hardware assets (AST-001…AST-005), which show it IN PLACE of
   the KPI cards (Zeni's call). The dates below are illustrative mock values per model — a real
   build reads them from the EOSL sync (Admin › Supplier Management › Lifecycle Sync). */
import { HardDrive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { relativeDay } from './osLifecycle';
import { fmtGridDate } from './dateFormat';

export interface HardwareLifecycle {
  vendor: string;
  model: string;
  ga: Date;
  /** End of sale. `null` = the vendor has not announced it yet (a STATE, not missing data). */
  eos: Date | null;
  /** End of service life — standard vendor support stops. */
  eosl: Date | null;
  /** Last day of extended / paid support. */
  lastSupport: Date | null;
}

const d = (s: string) => new Date(`${s}T00:00:00`);

/* One row per asset, keyed by asset id. Picked so the five cover every phase: on sale,
   sale ended, extended support only, and dates not announced. */
const HW_LIFECYCLE: Record<string, HardwareLifecycle> = {
  'AST-001': { vendor: 'Apple', model: 'MacBook Pro 16" (M1 Pro, 2021)', ga: d('2021-10-26'), eos: d('2023-01-17'), eosl: d('2028-01-17'), lastSupport: d('2030-01-17') },
  'AST-002': { vendor: 'Dell', model: 'Latitude 7440', ga: d('2023-05-09'), eos: d('2027-03-31'), eosl: d('2030-03-31'), lastSupport: d('2032-03-31') },
  'AST-003': { vendor: 'Dell', model: 'PowerEdge R750', ga: d('2021-03-16'), eos: d('2025-05-30'), eosl: d('2029-05-31'), lastSupport: d('2031-05-31') },
  'AST-004': { vendor: 'HPE', model: 'ProLiant DL380 Gen10', ga: d('2017-07-11'), eos: d('2023-03-01'), eosl: d('2026-01-31'), lastSupport: d('2029-01-31') },
  'AST-005': { vendor: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 11', ga: d('2023-02-14'), eos: null, eosl: null, lastSupport: null },
};

export const hardwareLifecycleOf = (assetId?: string | null): HardwareLifecycle | null =>
  (assetId && HW_LIFECYCLE[assetId]) || null;

type Phase = 'on-sale' | 'sale-ended' | 'extended' | 'eosl' | 'unpublished';

const TONE: Record<Phase, { text: string; bar: string }> = {
  'on-sale': { text: '#15803D', bar: '#22C55E' },
  'sale-ended': { text: '#15803D', bar: '#22C55E' },
  extended: { text: '#B45309', bar: '#F59E0B' },
  eosl: { text: '#B42318', bar: '#DC2626' },
  /* Slate, not amber: an unannounced date is an unknown, not a warning. */
  unpublished: { text: '#475569', bar: '#64748B' },
};

const phaseOf = (l: HardwareLifecycle, now: Date): Phase => {
  if (!l.eos) return 'unpublished';
  if (now < l.eos) return 'on-sale';
  if (!l.eosl || now < l.eosl) return 'sale-ended';
  if (!l.lastSupport || now < l.lastSupport) return 'extended';
  return 'eosl';
};

const frac = (now: number, from: number, to: number) => Math.max(0, Math.min(1, (now - from) / (to - from)));

export function HardwareLifecycleCard({ assetId, wide }: { assetId?: string | null; wide: boolean }) {
  const life = hardwareLifecycleOf(assetId);
  if (!life) return null;

  const now = new Date();
  const phase = phaseOf(life, now);
  const tone = TONE[phase];
  const open = !life.lastSupport;
  const t0 = life.ga.getTime();
  const tEnd = life.lastSupport ? life.lastSupport.getTime() : now.getTime();
  const span = Math.max(1, tEnd - t0);
  const at = (dt: Date | null) => (dt ? ((Math.min(dt.getTime(), tEnd) - t0) / span) * 100 : 100);
  const todayPct = open ? 78 : frac(now.getTime(), t0, tEnd) * 100;

  const head: { text: string; date: string | null } =
    phase === 'unpublished' ? { text: 'No end-of-sale date announced', date: null }
    : phase === 'on-sale' ? { text: `Sales end ${relativeDay(life.eos!, now)}`, date: fmtGridDate(life.eos!) }
    : phase === 'sale-ended'
      ? life.eosl ? { text: `Standard support ends ${relativeDay(life.eosl, now)}`, date: fmtGridDate(life.eosl) }
        : { text: 'Sale ended — end of support not announced', date: null }
    : phase === 'extended'
      ? life.lastSupport ? { text: `All support ends ${relativeDay(life.lastSupport, now)}`, date: fmtGridDate(life.lastSupport) }
        : { text: 'Extended support only — no end date announced', date: null }
    : { text: 'Unsupported since', date: fmtGridDate(life.lastSupport!) };

  const body =
    phase === 'unpublished'
      ? `${life.vendor} has not published end-of-sale or support dates for this model yet (released ${fmtGridDate(life.ga)}, ${relativeDay(life.ga, now)}). They appear here once the EOSL sync finds them.`
      : phase === 'on-sale'
        ? `Still sold and fully supported. Standard support then runs until ${life.eosl ? fmtGridDate(life.eosl) : 'a date not yet announced'}.`
        : phase === 'sale-ended'
          ? `No longer sold since ${fmtGridDate(life.eos!)}. Parts, repairs and firmware fixes continue until end of service life.`
          : phase === 'extended'
            ? `Reached end of service life on ${fmtGridDate(life.eosl!)}. Only paid extended support remains — plan a replacement.`
            : `${life.vendor} ${life.model} receives no further support — replace it.`;

  const milestones: { label: string; date: Date | null; color: string }[] = [
    { label: 'General availability', date: life.ga, color: '#22C55E' },
    { label: 'End of sale', date: life.eos, color: '#3D8BD0' },
    { label: 'End of service life (EOSL)', date: life.eosl, color: '#F59E0B' },
    { label: 'Last day of support', date: life.lastSupport, color: '#DC2626' },
  ];

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4 flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${tone.bar}1A` }}>
          <HardDrive size={16} style={{ color: tone.bar }} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[#364658]">EOSL Support Lifecycle</h3>
          <div className="truncate text-[12px] text-[#64748B]">{life.vendor} · {life.model}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[15px] font-semibold" style={{ color: tone.text }}>{head.text}</span>
        {head.date && (
          <span className="flex items-baseline gap-x-1.5">
            {phase !== 'eosl' && <span className="text-[13px] text-[#CBD5E1]">·</span>}
            <span className="text-[13px] font-medium text-[#64748B]">{head.date}</span>
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">{body}</p>

      {/* Timeline — GA → EOS → EOSL → last support, segments proportional, Today marked. */}
      <div className="mt-5">
        <div className="relative">
          {phase !== 'eosl' && (
            <div className="pointer-events-none absolute -top-5 z-10 text-[11px] font-medium text-[#364658]"
              style={{ left: `${todayPct}%`, transform: todayPct < 6 ? 'translateX(0)' : todayPct > 94 ? 'translateX(-100%)' : 'translateX(-50%)' }}>Today</div>
          )}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            {open ? (
              <>
                <span style={{ width: `${todayPct}%`, backgroundColor: '#22C55E' }} />
                <span className="flex-1" style={{ background: 'repeating-linear-gradient(90deg, #CBD5E1 0 4px, transparent 4px 9px)' }} />
              </>
            ) : (
              <>
                {/* GA → EOS (on sale), EOS → EOSL (supported), EOSL → last (extended). Each part
                    still ahead of today is tinted rather than solid. */}
                {[
                  { from: 0, to: at(life.eos), color: '#22C55E' },
                  { from: at(life.eos), to: at(life.eosl), color: '#86EFAC' },
                  { from: at(life.eosl), to: 100, color: '#F59E0B' },
                ].map((seg, i) => {
                  const w = Math.max(0, seg.to - seg.from);
                  const done = Math.max(0, Math.min(1, (todayPct - seg.from) / (w || 1))) * 100;
                  return <span key={i} style={{ width: `${w}%`, background: `linear-gradient(to right, ${seg.color} 0%, ${seg.color} ${done}%, ${seg.color}40 ${done}%)` }} />;
                })}
              </>
            )}
          </div>
          {phase !== 'eosl' && <span className="pointer-events-none absolute top-0 h-2 w-px bg-[#364658]" style={{ left: `${todayPct}%` }} />}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>{fmtGridDate(life.ga)}</span>
          <span>{life.lastSupport ? fmtGridDate(life.lastSupport) : 'End date not published'}</span>
        </div>
      </div>

      <div className={`mt-5 grid ${wide ? 'grid-cols-4' : 'grid-cols-2'} gap-x-6 gap-y-4 border-t border-[#F0F2F5] pt-4`}>
        {milestones.map((m) => (
          <div key={m.label} className="flex min-w-0 gap-1.5">
            <span className="mt-[5px] size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: m.date ? m.color : '#CBD5E1' }} />
            <div className="min-w-0">
              <div className={`truncate text-[12px] ${m.date ? 'text-[#64748B]' : 'text-[#A3AEBE]'}`} title={m.label}>{m.label}</div>
              {m.date ? (
                <>
                  <div className="mt-1 text-[13px] font-medium leading-[1.15] text-[#364658]">{fmtGridDate(m.date)}</div>
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
