/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState } from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface TicketTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
  penaltyAmount?: number;
  status?: string;
}

/** Colored pill styling for the current ticket status. */
function ticketStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (/closed/.test(s)) return { bg: '#F3F4F6', text: '#4B5563', dot: '#6B7280' };
  if (/resolved|completed/.test(s)) return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
  if (/in progress/.test(s)) return { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' };
  if (/on hold/.test(s)) return { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' };
  if (/pending/.test(s)) return { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' };
  return { bg: '#EFF8FF', text: '#175CD3', dot: '#3D8BD0' }; // Open / default
}

type Seg = { label: string; seconds: number; color: string };
type Row = { user: string; date: string; from: string; to: string; duration: string };

// ---- Mock transition data (prototype) ----
const STATUS_SEGS: Seg[] = [
  { label: 'Open', seconds: 16344, color: '#86C08A' },
  { label: 'On Hold', seconds: 368880, color: '#8B9DE8' },
];
const STATUS_ROWS: Row[] = [
  { user: 'System', date: 'Thu, Jul 02, 2026 11:45 AM', from: 'None', to: 'Open', duration: '4 hours 32 minutes 24 seconds' },
  { user: 'Coco', date: 'Thu, Jul 02, 2026 04:17 PM', from: 'Open', to: 'On Hold', duration: '4 days 6 hours 28 minutes' },
];

const TECH_SEGS: Seg[] = [
  { label: 'Unassigned', seconds: 3, color: '#9DC88D' },
  { label: 'George', seconds: 368880, color: '#A78BFA' },
  { label: 'zeni', seconds: 664, color: '#9CA3AF' },
  { label: 'Irfan', seconds: 15684, color: '#5EEAD4' },
];
const TECH_ROWS: Row[] = [
  { user: 'System', date: 'Thu, Jul 02, 2026 11:45 AM', from: 'None', to: 'Unassigned', duration: '1 second' },
  { user: 'System', date: 'Thu, Jul 02, 2026 11:45 AM', from: 'Unassigned', to: 'zeni', duration: '11 minutes 4 seconds' },
  { user: 'Irfan', date: 'Thu, Jul 02, 2026 11:56 AM', from: 'zeni', to: 'Irfan', duration: '4 hours 21 minutes 24 seconds' },
  { user: 'Coco', date: 'Thu, Jul 02, 2026 04:17 PM', from: 'Irfan', to: 'Unassigned', duration: '2 seconds' },
  { user: 'Coco', date: 'Thu, Jul 02, 2026 04:17 PM', from: 'Unassigned', to: 'George', duration: '4 days 6 hours 28 minutes' },
];

const GROUP_SEGS: Seg[] = [
  { label: 'Unassigned', seconds: 16349, color: '#F9A8D4' },
  { label: 'Hardware', seconds: 368880, color: '#EC4899' },
];
const GROUP_ROWS: Row[] = [
  { user: 'System', date: 'Thu, Jul 02, 2026 11:45 AM', from: 'None', to: 'Unassigned', duration: '4 hours 32 minutes 29 seconds' },
  { user: 'Coco', date: 'Thu, Jul 02, 2026 04:17 PM', from: 'Unassigned', to: 'Hardware', duration: '4 days 6 hours 28 minutes' },
];

function fmtTotal(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [] as string[];
  if (d) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  return parts.join(' ') || '0 minutes';
}

/** Aggregate raw segments by label, preserving first-seen color/order. */
function aggregate(segs: Seg[]): Seg[] {
  const map = new Map<string, Seg>();
  for (const s of segs) {
    const e = map.get(s.label);
    if (e) e.seconds += s.seconds;
    else map.set(s.label, { ...s });
  }
  return [...map.values()];
}

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
const userColor = (name: string) => name === 'System' ? '#94A3B8' : ['#3D8BD0', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'][Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) % 5];

/** Time-in-each-state summary: total + a segmented bar + a legend with durations and %.
 *  When `onSelect` is provided, the bar segments and legend rows become clickable to filter. */
function TimeDistribution({ segments, selected, onSelect }: { segments: Seg[]; selected?: string | null; onSelect?: (label: string) => void }) {
  const agg = aggregate(segments);
  const total = agg.reduce((s, x) => s + x.seconds, 0) || 1;
  const interactive = !!onSelect;
  const dim = (label: string) => (selected != null && selected !== label ? 'opacity-30' : 'opacity-100');
  return (
    <div className="rounded-xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[12px] font-medium text-[#6B7280]">Time spent in each state{interactive ? ' — tap to filter the timeline' : ''}</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658] flex-shrink-0">
          <Clock size={13} className="text-[#9CA3AF]" /> {fmtTotal(total)}
        </span>
      </div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[#F1F3F6]">
        {agg.map((s, i) => {
          const w = `${Math.max((s.seconds / total) * 100, s.seconds > 0 ? 1.5 : 0)}%`;
          return (
            <Tooltip key={i} delayDuration={700}>
              <TooltipTrigger asChild>
                {interactive ? (
                  <button onClick={() => onSelect!(s.label)} className={`h-full transition-opacity cursor-pointer hover:opacity-90 ${dim(s.label)}`} style={{ width: w, backgroundColor: s.color }} />
                ) : (
                  <div className="h-full" style={{ width: w, backgroundColor: s.color }} />
                )}
              </TooltipTrigger>
              <TooltipContent className="z-[10002]">
                <span className="font-semibold">{s.label}</span> · {fmtTotal(s.seconds)} · {Math.round((s.seconds / total) * 100)}%
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-1">
        {agg.map((s, i) => {
          const content = (
            <>
              <span className="inline-flex items-center gap-2 text-[12px] text-[#364658] min-w-0">
                <span className="size-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="text-[12px] text-[#7B8FA5] whitespace-nowrap flex-shrink-0">
                {fmtTotal(s.seconds)} <span className="text-[#CBD5E1]">·</span> {Math.round((s.seconds / total) * 100)}%
              </span>
            </>
          );
          return interactive ? (
            <button key={i} onClick={() => onSelect!(s.label)} className={`flex items-center justify-between gap-3 text-left rounded -mx-1 px-1 py-1 hover:bg-[#F9FAFB] transition-all ${dim(s.label)}`}>{content}</button>
          ) : (
            <div key={i} className="flex items-center justify-between gap-3 py-0.5">{content}</div>
          );
        })}
      </div>
    </div>
  );
}

/** A distribution bar + a timeline for one dimension; clicking a bar segment filters the timeline. */
function TransitionSection({ title, timelineLabel, segments, rows, durationPrefix }: { title?: string; timelineLabel: string; segments: Seg[]; rows: Row[]; /** Reads "<prefix> <state>" — "Time in Open" for statuses, "Time with George" for people. */ durationPrefix?: string }) {
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = filter ? rows.filter((r) => r.from === filter || r.to === filter) : rows;
  return (
    <div className="space-y-4">
      {title && <div className="text-[14px] font-semibold text-[#364658]">{title}</div>}
      <TimeDistribution segments={segments} selected={filter} onSelect={(l) => setFilter((f) => (f === l ? null : l))} />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-[13px] font-semibold text-[#364658]">{timelineLabel}</div>
        {filter && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#EAF2FB] text-[#3D8BD0] text-[11px] font-medium pl-2 pr-1 py-0.5">
            {filter}
            <button onClick={() => setFilter(null)} title="Clear filter" className="p-0.5 rounded-full hover:bg-[#3D8BD0]/10"><X size={11} /></button>
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="text-[13px] text-[#7B8FA5] py-4">No transitions for this filter.</div>
      ) : (
        <Timeline rows={filtered} segments={segments} durationPrefix={durationPrefix} />
      )}
    </div>
  );
}

/**
 * Vertical transition timeline. Each node is a state change (from → to), and the duration is the
 * time spent in the state the record moved INTO — so it is deliberately NOT rendered beside the
 * arrow, where it reads as belonging to the transition or to the state being left. It gets its own
 * footer row, named and colour-dotted, borrowing the distribution legend's `● Label … duration`
 * grammar from directly above so the same pattern means the same thing twice on one screen.
 */
function Timeline({ rows, segments, durationPrefix = 'Time in' }: { rows: Row[]; segments: Seg[]; durationPrefix?: string }) {
  const colorFor = (label: string) => segments.find((s) => s.label === label)?.color || '#9CA3AF';
  return (
    <div className="relative pl-0.5">
      {rows.map((r, i) => {
        const c = colorFor(r.to);
        const last = i === rows.length - 1;
        return (
          <div key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-[#E8EDF3]" />}
            <div className="relative z-10 size-[26px] rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c}22` }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: c }} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Who made the change, and when — the event header, sitting above the card the way
                  an activity feed heads each entry. Its 26px height matches the timeline dot, so
                  the two line up without nudging either. */}
              <div className="flex h-[26px] min-w-0 items-center gap-1.5 text-[12px] text-[#7B8FA5]">
                <span className="flex size-4 flex-shrink-0 items-center justify-center rounded-[4px] text-[8px] font-semibold text-white" style={{ backgroundColor: userColor(r.user) }}>{initials(r.user)}</span>
                <span className="flex-shrink-0 font-medium text-[#364658]">{r.user}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span className="truncate">{r.date}</span>
                {/* What changed, at the far end of the same line — the header now reads as one
                    sentence: who, when, and what they did. */}
                <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 pl-3 text-[13px]">
                  <span className="text-[#9CA3AF]">{r.from}</span>
                  <ArrowRight size={13} className="flex-shrink-0 text-[#CBD5E1]" />
                  <span className="font-semibold" style={{ color: c }}>{r.to}</span>
                </span>
              </div>
              {/* How long the record then sat in that state. The duration follows its label
                  directly — the pair reads as one phrase, so keeping them adjacent matters more
                  than lining the durations up in a column. */}
              <div className="mt-1 flex min-w-0 items-center gap-2 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] px-3.5 py-2 text-[12px] transition-colors hover:border-[#DDE3EC]">
                <span className="inline-flex items-center gap-2 text-[#7B8FA5]">
                  <span className="size-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: c }} />
                  <span className="truncate">{durationPrefix} <span className="font-medium text-[#364658]">{r.to}</span></span>
                </span>
                <span className="flex-shrink-0 text-[#CBD5E1]">·</span>
                <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#364658]">
                  <Clock size={11} className="flex-shrink-0 text-[#9CA3AF]" />
                  <span className="truncate">{r.duration}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, valueColor, subColor, labelFirst }: { label: string; value?: string; sub?: string; valueColor?: string; subColor?: string; labelFirst?: boolean }) {
  const valueEl = value ? <div className="text-[20px] font-semibold leading-none" style={{ color: valueColor || '#111827' }}>{value}</div> : null;
  const labelEl = <div className="text-[12px] text-[#6B7280]">{label}</div>;
  return (
    <div className="rounded-lg border border-[#EEF1F5] bg-white p-3.5">
      {value
        ? (labelFirst
            ? <>{labelEl}<div className="mt-1.5">{valueEl}</div></>
            : <>{valueEl}<div className="mt-1.5">{labelEl}</div></>)
        : labelEl}
      {sub && <div className="text-[11px] mt-1" style={{ color: subColor || '#DC2626' }}>{sub}</div>}
    </div>
  );
}

/** SLA KPI card — label (+ optional outcome pill on the right), a larger value, an optional
 *  sub-line, and the exact date/time on hover. */
function SlaCard({ label, value, valueColor, when, sub, badge }: { label: string; value: string; valueColor: string; when: string; sub?: string; badge?: { text: string; color: string } }) {
  return (
    <div className="rounded-lg border border-[#EEF1F5] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] text-[#6B7280]">{label}</div>
        {badge && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: `${badge.color}1A`, color: badge.color }}>{badge.text}</span>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="mt-1.5 inline-block text-[15px] font-semibold cursor-default" style={{ color: valueColor }}>{value}</span>
        </TooltipTrigger>
        <TooltipContent className="z-[10002]">{when}</TooltipContent>
      </Tooltip>
      {sub && <div className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</div>}
    </div>
  );
}

/** Total elapsed = time the request spent across all statuses (shared by every tab). */
const TOTAL_ELAPSED = fmtTotal(STATUS_SEGS.reduce((s, x) => s + x.seconds, 0));

export function TicketTransitionModal({ isOpen, onClose, ticketId, penaltyAmount = 0, status = 'Open' }: TicketTransitionModalProps) {
  const [tab, setTab] = useState<'overview' | 'status' | 'assignment'>('overview');
  // A closed ticket has finished its lifecycle, so SLA targets read as outcomes (met/breached) rather than "due in".
  const closed = /closed|resolved|completed/i.test(status);
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[10000] transition-opacity duration-300" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-[880px] max-w-[97vw] bg-white shadow-2xl z-[10001] flex flex-col transition-transform duration-300"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="text-[17px] font-semibold text-[#111827]">Request Transition{ticketId ? `: ${ticketId}` : ''}</h2>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
        </div>

        {/* Tabs — same style as the main ticket tabs (Conversation, Tasks, …) */}
        <div className="flex items-center gap-4 px-6 border-b border-[#e5e7eb] flex-shrink-0">
          {([['overview', 'Overview'], ['status', 'Status'], ['assignment', 'Assignment']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-1 py-3 text-[14px] font-medium whitespace-nowrap ${tab === key ? 'text-[#3D8BD0] border-b-2 border-[#3D8BD0]' : 'text-[#6b7280] hover:text-[#364658]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5 @container">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <div className="text-[14px] font-semibold text-[#364658] mb-2.5">Time Elapsed Analysis</div>
                <div className="space-y-3">
                  {/* Total time elapsed + current status — so the elapsed time reads as final (closed) or still running */}
                  {(() => {
                    const ss = ticketStatusStyle(status);
                    return (
                      <div className="rounded-lg border border-[#EEF1F5] bg-white p-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[20px] font-semibold text-[#111827] leading-none">{TOTAL_ELAPSED}</div>
                          <div className="text-[12px] text-[#6B7280] mt-1.5">Total Time Elapsed</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: ss.bg, color: ss.text }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />{status}
                          </span>
                          <span className="text-[11px]" style={{ color: closed ? '#9CA3AF' : '#D97706' }}>
                            {closed ? 'Full lifecycle · start to close' : 'Still running — not yet closed'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  {/* SLA sub-heading — so the cards below are clearly identified as SLA metrics */}
                  <div className="pt-1.5">
                    <span className="text-[14px] font-semibold text-[#364658]">SLA Status</span>
                  </div>
                  {/* SLA KPIs — penalty (when incurred) + the 3 SLAs, in one full-width row (cards grow equally regardless of count).
                      Closed tickets show the FINAL outcome (met/breached) instead of a running "due in" countdown. */}
                  <div className="flex flex-wrap gap-3 [&>*]:flex-1 [&>*]:basis-0 [&>*]:min-w-[150px]">
                    {closed ? (
                      <>
                        <SlaCard label="First response" value="2 hours" valueColor="#364658" sub="Target: 5 hours" when="Responded Thursday, February 20, 2026 at 12:30 AM" badge={{ text: 'Met', color: '#16A34A' }} />
                        {penaltyAmount > 0 ? (
                          <SlaCard label="Resolution" value="4 days 6 hours" valueColor="#364658" sub="Target: 3 days" when="Resolved Friday, February 27, 2026 at 03:15 PM" badge={{ text: 'Breached', color: '#DC2626' }} />
                        ) : (
                          <SlaCard label="Resolution" value="2 days 4 hours" valueColor="#364658" sub="Target: 3 days" when="Resolved Tuesday, February 24, 2026 at 05:30 PM" badge={{ text: 'Met', color: '#16A34A' }} />
                        )}
                        <SlaCard label="OLA" value="5 hours" valueColor="#364658" sub="Target: 1 week" when="Met Thursday, February 20, 2026 at 04:00 PM" badge={{ text: 'Met', color: '#16A34A' }} />
                      </>
                    ) : (
                      <>
                        <SlaCard label="First response due in" value="3 days 5 hours" valueColor="#16A34A" sub="Target: 4 days" when="Thursday, February 20, 2026 at 12:30 AM" />
                        <SlaCard label="Resolution overdue in" value="1 week 4 days" valueColor="#DC2626" sub="Target: 5 days" when="Tuesday, February 25, 2026 at 06:00 PM" />
                        <SlaCard label="OLA due in" value="4 hours" valueColor="#D97706" sub="Target: 1 week" when="Thursday, February 20, 2026 at 04:00 PM" />
                      </>
                    )}
                    {penaltyAmount > 0 && <StatCard label="Penalty" value={`$${penaltyAmount.toFixed(2)}`} valueColor="#8B5CF6" sub="For SLA breach" subColor="#9CA3AF" labelFirst />}
                  </div>
                </div>
              </div>
              {/* Distributions — the SAME data & view as the Status / Assignment tabs */}
              <div className="space-y-5">
                <div>
                  <div className="text-[14px] font-semibold text-[#364658] mb-2.5">Status</div>
                  <TimeDistribution segments={STATUS_SEGS} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#364658] mb-2.5">Technician Group</div>
                  <TimeDistribution segments={GROUP_SEGS} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#364658] mb-2.5">Technician</div>
                  <TimeDistribution segments={TECH_SEGS} />
                </div>
              </div>
            </div>
          )}

          {tab === 'status' && (
            <TransitionSection timelineLabel="Status timeline" segments={STATUS_SEGS} rows={STATUS_ROWS} />
          )}

          {tab === 'assignment' && (
            <div className="space-y-8">
              <TransitionSection title="Technician" timelineLabel="Assignment timeline" segments={TECH_SEGS} rows={TECH_ROWS} durationPrefix="Time with" />
              <div className="pt-5 border-t border-[#F0F1F3]">
                <TransitionSection title="Technician Group" timelineLabel="Group timeline" segments={GROUP_SEGS} rows={GROUP_ROWS} durationPrefix="Time with" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[#E5E7EB] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Done</button>
        </div>
      </div>
    </>
  );
}
