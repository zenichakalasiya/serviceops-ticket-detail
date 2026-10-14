/* ── OS Lifecycle card (Endpoint Overview) ───────────────────────────────────
   An endpoint stops being safe the day its OS stops getting fixes, not the day it breaks.
   This card answers that in one glance: which phase the machine is in now, how long until
   the next cliff, and the four dates behind it.

   Everything is derived from the endpoint's OWN reported OS and build (`osLifecycleOf`),
   so the card can never contradict the OS Name in the header or the right panel. A machine
   whose agent has never reported a build renders nothing at all rather than a guess. */
import { CalendarClock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  PHASE_TONE, hasExtendedPhase, lifecyclePhaseOf, osLifecycleOf, relativeDay,
} from './osLifecycle';
import { fmtGridDate } from './dateFormat';

/** Where `now` sits between two dates, as a 0-1 fraction, clamped. */
const frac = (now: number, from: number, to: number) => Math.max(0, Math.min(1, (now - from) / (to - from)));

export function OsLifecycleCard({ osName, osVersion, wide }: { osName?: string | null; osVersion?: string | null; wide: boolean }) {
  const life = osLifecycleOf(osName, osVersion);
  /* No published calendar for this OS (or no build reported yet) — say nothing rather than
     render an empty frame or invent dates. */
  if (!life) return null;

  const now = new Date();
  const phase = lifecyclePhaseOf(life, now);
  const tone = PHASE_TONE[phase];
  const extended = hasExtendedPhase(life);

  const t0 = life.released.getTime();
  /* With no announced end there is nothing to scale against, so the bar runs released →
     today and carries on as an open-ended dashed tail. */
  const open = !life.securityEnd;
  const tEnd = life.securityEnd ? life.securityEnd.getTime() : now.getTime();
  const span = Math.max(1, tEnd - t0);
  /* The bar is the whole published life, so the two segments are PROPORTIONAL — a release
     with a long ESU tail visibly has one, which a fixed 50/50 split would hide. */
  const activePct = life.activeEnd ? ((Math.min(life.activeEnd.getTime(), tEnd) - t0) / span) * 100 : 100;
  const todayPct = open ? 100 : frac(now.getTime(), t0, tEnd) * 100;

  /* The headline: the next cliff that actually matters from where we stand today — or the
     plain fact that there is no cliff to plan against yet. "in 6 months" tells you the
     urgency; the DATE tells you what to put in the change calendar, so it rides alongside
     in a quieter weight rather than making you hunt the milestones for it.
     `sep` is false where the date is already part of the sentence's grammar. */
  const head: { text: string; date: string | null; sep: boolean } =
    phase === 'unpublished' ? { text: 'No end-of-support date announced', date: null, sep: false }
    : phase === 'eol' ? { text: 'Unsupported since', date: fmtGridDate(life.securityEnd!), sep: false }
    : phase === 'security-only'
      ? life.securityEnd
        ? { text: `All support ends ${relativeDay(life.securityEnd, now)}`, date: fmtGridDate(life.securityEnd), sep: true }
        : { text: 'Security updates only — no end date announced', date: null, sep: false }
      : { text: `Active support ends ${relativeDay(life.activeEnd!, now)}`, date: fmtGridDate(life.activeEnd!), sep: true };

  /* The body never repeats the headline's date — each line earns its place by adding
     something the one above it did not say. */
  const body =
    phase === 'unpublished'
      ? `${life.vendor} has not published lifecycle dates for this release yet (released ${fmtGridDate(life.released)}, ${relativeDay(life.released, now)}). They will appear here as soon as they do.`
      : phase === 'eol'
        ? `${life.family} ${life.release} receives no further security fixes — plan a migration.`
        : phase === 'security-only'
          ? life.securityEnd
            ? `Active support ended ${fmtGridDate(life.activeEnd!)}. It now gets security fixes only, no bug fixes or feature updates.`
            : `Active support ended ${fmtGridDate(life.activeEnd!)}. It gets security fixes only — ${life.vendor} has not announced when those stop.`
          : extended
            ? `Security fixes then continue until ${life.securityEnd ? fmtGridDate(life.securityEnd) : 'a date the vendor has not announced'}.`
            : 'Servicing ends on that date — no security fixes after it.';

  /* One milestone per real date. A release with no extended phase has two, not three with a
     duplicate — the same date twice would read as two separate deadlines. An unannounced
     date still gets its row, saying so: "not published" is an answer, a missing row is not. */
  const milestones: { label: string; date: Date | null; color: string }[] = [
    { label: 'Released', date: life.released, color: '#22C55E' },
    { label: extended ? 'End of active support' : 'End of servicing', date: life.activeEnd, color: '#F59E0B' },
    ...(extended ? [{ label: life.extendedLabel, date: life.securityEnd, color: '#DC2626' }] : []),
  ];

  return (
    <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-5">
      {/* Header — the house icon-badge + title. No phase pill: the headline below already
          states the phase, in the phase's own colour, so a pill repeated it. */}
      <div className="mb-4 flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${tone.bar}1A` }}>
          <CalendarClock size={16} style={{ color: tone.bar }} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[#364658]">OS Lifecycle</h3>
          <div className="truncate text-[12px] text-[#64748B]">{life.family} · {life.release}</div>
        </div>
      </div>

      {/* The verdict, in the phase's own colour, with the exact date trailing it in a
          quieter weight — baseline-aligned so the two read as one line, and wrapping as a
          unit on a narrow drawer rather than orphaning the date. */}
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[15px] font-semibold" style={{ color: tone.text }}>{head.text}</span>
        {head.date && (
          <span className="flex items-baseline gap-x-1.5">
            {head.sep && <span className="text-[13px] text-[#CBD5E1]">·</span>}
            <span className="text-[13px] font-medium text-[#64748B]">{head.date}</span>
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">{body}</p>

      {/* Timeline — released → active end → security end, with today marked on it. */}
      <div className="mt-5">
        <div className="relative">
          {/* The Today flag rides ABOVE the bar so it never sits on top of a segment
              boundary, and clamps at both ends: a release at the very start or end of its
              life would otherwise lose half the label off the edge. */}
          {phase !== 'eol' && (() => {
            const at = open ? todayPct * 0.78 : todayPct;
            return (
              <div
                className="pointer-events-none absolute -top-5 z-10 text-[11px] font-medium text-[#364658]"
                style={{
                  left: `${at}%`,
                  transform: at < 6 ? 'translateX(0)' : at > 94 ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                Today
              </div>
            );
          })()}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            {open ? (
              <>
                {/* Served time, then an OPEN tail: dashes rather than a solid block,
                    because a filled bar would imply a known length the vendor has not
                    given. It simply runs off the end. */}
                <span style={{ width: `${todayPct * 0.78}%`, backgroundColor: '#22C55E' }} />
                <span
                  className="flex-1"
                  style={{ background: 'repeating-linear-gradient(90deg, #CBD5E1 0 4px, transparent 4px 9px)' }}
                />
              </>
            ) : (
              <>
                {/* Active phase. */}
                <span style={{ width: `${activePct}%`, backgroundColor: '#22C55E' }} />
                {/* Security-only tail, tinted rather than solid where it has not been
                    reached yet — the part of the life still ahead should not read as time
                    served. */}
                {extended && life.activeEnd && life.securityEnd && (
                  <span
                    className="flex-1"
                    style={{
                      background: phase === 'active'
                        ? '#F59E0B33'
                        : `linear-gradient(to right, #F59E0B 0%, #F59E0B ${frac(now.getTime(), life.activeEnd.getTime(), tEnd) * 100}%, #F59E0B33 ${frac(now.getTime(), life.activeEnd.getTime(), tEnd) * 100}%)`,
                    }}
                  />
                )}
              </>
            )}
          </div>
          {/* The marker itself — a hairline through the bar at today's position. */}
          {phase !== 'eol' && (
            <span
              className="pointer-events-none absolute top-0 h-2 w-px bg-[#364658]"
              style={{ left: `${open ? todayPct * 0.78 : todayPct}%` }}
            />
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>{fmtGridDate(life.released)}</span>
          <span>{life.securityEnd ? fmtGridDate(life.securityEnd) : 'End date not published'}</span>
        </div>
      </div>

      {/* Milestones. Each date carries its distance from today, because "Oct 2028" only
          means something once you know it is two years out. */}
      <div className={`mt-5 grid ${wide ? 'grid-cols-3' : 'grid-cols-2'} gap-x-6 gap-y-4 border-t border-[#F0F2F5] pt-4`}>
        {milestones.map((m) => (
          /* The dot sits OUTSIDE the text block rather than inline with the label, so the
             date and its distance line up with the label's first letter instead of with
             the dot. Keeping it structural (a flex sibling) rather than a padding guess
             means the three stay aligned if the dot ever changes size. */
          /* An unannounced milestone is greyed THROUGHOUT — dot, label and value — so the
             eye skips it rather than reading a real deadline that happens to say words. */
          <div key={m.label} className="flex min-w-0 gap-1.5">
            <span className="mt-[5px] size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: m.date ? m.color : '#CBD5E1' }} />
            <div className="min-w-0">
              <div className={`truncate text-[12px] ${m.date ? 'text-[#64748B]' : 'text-[#A3AEBE]'}`} title={m.label}>{m.label}</div>
              {/* The date and its distance are ONE fact, so they sit tighter to each other
                  than to the label above. Most of the old gap was the lines' own leading
                  (a 13px line at the default 1.5 carries ~7px of it), so the line height is
                  what gets trimmed here — shaving the margin alone barely moved it. */}
              {m.date ? (
                <>
                  <div className="mt-1 text-[13px] font-medium leading-[1.15] text-[#364658]">{fmtGridDate(m.date)}</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* `block w-fit`, not `inline-block`: an inline-block sits in an
                          anonymous line box sized by the PARENT's strut, so it kept ~7px of
                          leading above it no matter what margin or line-height it carried.
                          As a block its own margin is the gap. `w-fit` keeps the tooltip's
                          hit area on the words rather than the full column. */}
                      <span className="mt-1 block w-fit cursor-help text-[11px] leading-[1.15] text-[#94A3B8]">{relativeDay(m.date, now)}</span>
                    </TooltipTrigger>
                    <TooltipContent>{m.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                /* No second line here: "Not published" has no distance from today to
                   report, and a dash under it would be a second way of saying nothing. */
                <div className="mt-1 text-[13px] font-medium leading-[1.15] text-[#A3AEBE]">Not published</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
