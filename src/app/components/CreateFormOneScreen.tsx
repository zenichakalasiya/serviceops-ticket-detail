import { useState } from 'react';
import { SplitCta } from './CreateFormKit';
import type { ShellAction } from './CreateFormKit';
import { Check, ChevronRight } from 'lucide-react';

/* V5's right panel (createFormUi.ts): the record being built, read back live. Each group of the form
 * lists what has been filled and what is still missing; a group or a missing item scrolls the form to
 * it. Create sits at its foot, so the review IS the place you submit from — no separate review step.
 * A Guide tab keeps the full help guide one click away for anyone who wants it. */

export interface SummaryLine { label: string; value: string }
export interface SummaryGroup {
  title: string;
  /** Filled values, in form order. */
  lines: SummaryLine[];
  /** Required things still empty, by label. */
  missing: string[];
  /** The group asks for nothing required. */
  optional: boolean;
}

const SHOW = 4;

export function SummaryAside({ groups, onJump, cta, onCreate, secondary, onSecondary, guide, noun, split }: {
  /** One primary CTA with a dropdown (Publish ▾ Save as Draft) in place of the two buttons. */
  split?: ShellAction[];
  groups: SummaryGroup[];
  onJump: (i: number) => void;
  cta: string; onCreate: () => void;
  secondary?: string; onSecondary?: () => void;
  guide?: React.ReactNode;
  noun: string;
}) {
  /* No Summary tab (Zeni, 30 Oct 2026): the panel is the guide; the summary list shows only for a form with no guide. */
  const tab: 'summary' | 'guide' = guide ? 'guide' : 'summary';
  const [more, setMore] = useState<number[]>([]);
  const required = groups.filter((g) => !g.optional);
  const ready = required.filter((g) => !g.missing.length).length;
  const left = groups.reduce((n, g) => n + g.missing.length, 0);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-[#DFE5ED] bg-white" aria-label={`${noun} summary`}>
      {tab === 'summary' && <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-3 pt-3.5">
        <span className="h-[18px] w-[3px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
        <h2 className="min-w-0 flex-1 truncate text-[16px] font-medium text-[#1D2A3E]">{noun} summary</h2>
      </div>}

      {tab === 'guide' && guide ? (
        /* The guide brings its own frame; drop its border so it sits inside this panel. */
        <div className="min-h-0 flex-1 [&>aside]:border-l-0">{guide}</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ol className="flex flex-col gap-2">
            {groups.map((g, i) => {
              const done = !g.missing.length;
              const open = more.includes(i);
              const lines = open ? g.lines : g.lines.slice(0, SHOW);
              return (
                <li key={g.title} className="rounded-lg bg-[#F7F9FC] px-3 py-2.5">
                  <button type="button" onClick={() => onJump(i)} className="group flex w-full items-center gap-2 text-left">
                    <span className={'flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold tabular-nums '
                      + (g.optional && !g.lines.length ? 'bg-white text-[#94A3B8] ring-1 ring-[#DFE5ED]' : done ? 'bg-[#E7F6EC] text-[#16A34A]' : 'bg-white text-[#64748B] ring-1 ring-[#DFE5ED]')}>
                      {done && (!g.optional || g.lines.length) ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658] group-hover:text-[#3D8BD0]">{g.title}</span>
                    {g.optional && <span className="text-[11px] text-[#94A3B8]">Optional</span>}
                    <ChevronRight size={14} className="flex-shrink-0 text-[#94A3B8] group-hover:text-[#3D8BD0]" />
                  </button>
                  {(lines.length > 0 || g.missing.length > 0) && (
                    <dl className="mt-1.5 flex flex-col gap-1 pl-7">
                      {lines.map((l) => (
                        <div key={l.label} className="flex min-w-0 gap-2 text-[12px]">
                          <dt className="w-[128px] flex-shrink-0 truncate text-[#7B8FA5]" title={l.label}>{l.label}</dt>
                          <dd className="min-w-0 flex-1 truncate text-[#1D2A3E]" title={l.value}>{l.value}</dd>
                        </div>
                      ))}
                      {g.lines.length > SHOW && (
                        <button type="button" onClick={() => setMore((x) => (open ? x.filter((n) => n !== i) : [...x, i]))} className="self-start text-[12px] font-medium text-[#3D8BD0] hover:underline">
                          {open ? 'Show less' : `+${g.lines.length - SHOW} more`}
                        </button>
                      )}
                      {g.missing.map((m) => (
                        <button key={m} type="button" onClick={() => onJump(i)} className="flex items-center gap-2 text-left text-[12px] text-[#B45309] hover:underline">
                          <span className="size-1.5 flex-shrink-0 rounded-full bg-[#F59E0B]" />{m}
                        </button>
                      ))}
                    </dl>
                  )}
                  {!lines.length && !g.missing.length && <p className="mt-1 pl-7 text-[12px] text-[#94A3B8]">Nothing added</p>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* The one place the record is submitted from. */}
      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[#EEF2F6] px-4 py-3">
        <p className="text-[12px] text-[#7B8FA5]">
          {left ? <><span className="font-semibold text-[#B45309]">{left} required {left === 1 ? 'item' : 'items'}</span> left · {ready} of {required.length} parts ready</>
            : <span className="font-medium text-[#16A34A]">Everything required is filled in</span>}
        </p>
        {split ? <SplitCta options={split} up full /> : <div className="flex gap-2">
          {secondary && <button type="button" onClick={onSecondary} className="h-8 rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]">{secondary}</button>}
          <button type="button" onClick={onCreate} className="h-8 flex-1 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">{cta}</button>
        </div>}
      </div>
    </aside>
  );
}
