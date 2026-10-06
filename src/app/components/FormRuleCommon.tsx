import { useState } from 'react';
import { ChevronRight, History, Split, Workflow } from 'lucide-react';

/* "Common trigger, conditions & actions": what every similar rule shares with yours, said ONCE.
 * Shared by the similar-rules sidebar and A's Rule check rail so the two cannot drift. It imports
 * nothing from the other form-rule views, so neither of them gets an import cycle. */

export interface CondGroupView { join: 'And' | 'Or'; conds: { join: 'And' | 'Or'; text: string }[] }

export function CommonTriggerCard({ count, eventText, execution, applies, groups, actions, defaultOpen = false, className = '' }: {
  /** How many similar rules share it — said in the header. */
  count: number;
  eventText: string;
  execution: string;
  applies: string;
  groups: CondGroupView[];
  actions: string[];
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  /* Each row leads with the builder's own step badge (When / Check if / Then) — icon only. */
  const row = (icon: React.ReactNode, tone: string, badge: string, lead: string, body: React.ReactNode) => (
    <div className="flex items-start gap-2.5">
      <span title={lead} aria-label={lead} className="mt-[3px] flex flex-shrink-0 items-center rounded-full p-1" style={{ backgroundColor: badge, color: tone }}>{icon}</span>
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
  const joinWord = (j: 'And' | 'Or') => <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">{j === 'Or' ? 'or' : 'and'}</span>;
  return (
    <div className={'flex-shrink-0 overflow-hidden rounded-lg border border-[#E8EDF3] bg-white ' + className}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-start gap-2 px-2 py-2 text-left transition-colors hover:bg-[#F9FAFB]">
        <ChevronRight size={15} className={'mt-[2px] flex-shrink-0 text-[#7B8FA5] transition-transform ' + (open ? 'rotate-90' : '')} />
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[#1D2A3E]">Common trigger, conditions &amp; actions</span>
          <span className="block text-[12px] text-[#98A2B3]">shared by your rule and all {count} similar rule{count === 1 ? '' : 's'}</span>
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2.5 border-t border-[#EEF2F6] bg-[#F9FAFB] px-2 py-2">
          {row(<History size={12} />, '#3D8BD0', '#E2EDF5', 'When',
            /* The trigger's three parts, each its own value, split by hairline dividers. */
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-[3px] text-[12px] text-[#364658]">
              <span>{eventText || '—'}</span>
              <span className="h-3.5 w-px bg-[#DFE5ED]" />
              <span>{execution || '—'}</span>
              <span className="h-3.5 w-px bg-[#DFE5ED]" />
              <span>{applies || 'Anyone'}</span>
            </span>)}
          {row(<Split size={12} className="rotate-180" />, '#F58518', 'rgba(245,133,24,0.1)', 'Check if',
            groups.length
              ? <span className="flex flex-wrap items-center gap-1.5">
                  {groups.map((g, gi) => (
                    <span key={gi} className="contents">
                      {gi > 0 && <span className="rounded bg-[#FFF1E3] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#C2620E]">{g.join === 'Or' ? 'Or' : 'And'}</span>}
                      <span className="inline-flex flex-wrap items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-[12px] text-[#364658]">
                        {g.conds.map((x, ci) => <span key={ci} className="contents">{ci > 0 && joinWord(x.join)}<span>{x.text}</span></span>)}
                      </span>
                    </span>
                  ))}
                </span>
              : <span className="pt-[3px] text-[12px] text-[#7B8FA5]">Every matching event</span>)}
          {row(<Workflow size={12} />, '#89C540', '#F3F9EC', 'Then',
            actions.length
              ? <span className="flex flex-wrap gap-1.5">{actions.map((l) => <span key={l} className="rounded-md bg-[#EBF5FF] px-2 py-1 text-[12px] text-[#2C6CA8]">{l}</span>)}</span>
              : <span className="pt-[3px] text-[12px] text-[#7B8FA5]">No actions yet</span>)}
        </div>
      )}
    </div>
  );
}
