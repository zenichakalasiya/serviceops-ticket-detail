import { ArrowLeft, Check, X } from 'lucide-react';
import type { ShellAction } from './CreateFormKit';
import { SplitCta } from './CreateFormKit';

/* The two STEPPED create-form shells (createFormUi.ts): V2 = full page with a vertical stepper on the
 * left; V3 = a side drawer with a stepper across its top. Both show ONE step at a time, its help on
 * the right, and Back / Next at the foot — the main action (Create, Publish…) is the last step's Next,
 * so there is one primary button on screen, never two. Save as Draft stays reachable from every step. */

export type StepState = 'done' | 'error' | 'todo';
export interface StepItem { title: string; sub: string; state: StepState }

const btn2 = 'h-8 rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]';
const btn1 = 'h-8 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]';

function Badge({ n, state, current }: { n: number; state: StepState; current: boolean }) {
  const cls = state === 'error' ? 'bg-[#FEF3F2] text-[#D92D20] ring-1 ring-[#F5C2C2]'
    : current ? 'bg-[#3D8BD0] text-white'
      : state === 'done' ? 'bg-[#E7F6EC] text-[#16A34A]'
        : 'bg-white text-[#64748B] ring-1 ring-[#DFE5ED]';
  return (
    <span className={'flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold tabular-nums ' + cls}>
      {state === 'done' && !current ? <Check size={13} strokeWidth={2.5} /> : state === 'error' ? '!' : n}
    </span>
  );
}

/** Back · Next: <step> (or the main action on the last step). */
function StepNav({ current, steps, onStep, onNext, final, split }: { current: number; steps: StepItem[]; onStep: (i: number) => void; onNext: () => void; final: ShellAction; split?: ShellAction[] }) {
  const last = current === steps.length - 1;
  return (
    <div className="flex items-center gap-2">
      {current > 0 && <button type="button" className={btn2} onClick={() => onStep(current - 1)}>Back</button>}
      {last && split ? <SplitCta options={split} up /> : (
        <button type="button" className={btn1} onClick={last ? final.onClick : onNext}>
          {last ? final.label : `Next: ${steps[current + 1].title}`}
        </button>
      )}
    </div>
  );
}

/* ── V2: full page, stepper on the left ── */
export function SteppedPageShell({ title, onBack, error, secondary, final, split, steps, current, onStep, onNext, help, children, overlays }: {
  title: string; onBack: () => void; error?: string; secondary?: ShellAction; final: ShellAction;
  /** One primary CTA with a dropdown (Publish ▾ Save as Draft) in place of the final button + secondary. */
  split?: ShellAction[];
  steps: StepItem[]; current: number; onStep: (i: number) => void; onNext: () => void;
  help: React.ReactNode; children: React.ReactNode; overlays?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#DFE5ED] px-4 py-3">
        <button type="button" onClick={onBack} title="Back" className="-ml-1.5 flex size-[30px] flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]"><ArrowLeft size={16} /></button>
        <h1 className="truncate text-[16px] font-medium text-[#364658]">{title}</h1>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          {error && <span className="text-[12px] text-[#F25C4E]">{error}</span>}
          <button type="button" onClick={onBack} className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          {secondary && !split && <button type="button" onClick={secondary.onClick} className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]">{secondary.label}</button>}
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* The stepper: every step's name and what it decides, so the whole form is readable at a
            glance while only one step's fields are on screen. Any step can be opened. */}
        <nav aria-label="Steps" className="w-[272px] flex-shrink-0 overflow-y-auto border-r border-[#EEF2F6] p-4">
          <ol className="flex flex-col">
            {steps.map((s, i) => {
              const on = i === current;
              return (
                <li key={s.title} className="relative">
                  {i < steps.length - 1 && <span className={'absolute bottom-[-8px] left-[23px] top-[38px] w-px ' + (s.state === 'done' ? 'bg-[#86CFA0]' : 'bg-[#E2E8F0]')} />}
                  <button type="button" onClick={() => onStep(i)} aria-current={on ? 'step' : undefined}
                    className={'relative flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ' + (on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F7F9FC]')}>
                    <Badge n={i + 1} state={s.state} current={on} />
                    <span className="min-w-0 flex-1">
                      <span className={'block text-[13px] ' + (on ? 'font-semibold text-[#1D2A3E]' : 'font-medium text-[#364658]')}>{s.title}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-[#7B8FA5]">{s.sub}</span>
                    </span>
                  </button>
                  {i < steps.length - 1 && <span className="block h-4" />}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div data-create-scroll className="min-h-0 flex-1 overflow-y-auto">
            <div className="max-w-[760px] px-6 py-6">{children}</div>
          </div>
          <div className="flex flex-shrink-0 items-center border-t border-[#EEF2F6] px-6 py-3">
            <span className="text-[12px] tabular-nums text-[#7B8FA5]">Step {current + 1} of {steps.length}</span>
            <div className="ml-auto"><StepNav current={current} steps={steps} onStep={onStep} onNext={onNext} final={final} split={split} /></div>
          </div>
        </div>
        <div className="w-[360px] flex-shrink-0 xl:w-[400px]">{help}</div>
      </div>
      {overlays}
    </div>
  );
}

/* ── V3: side drawer. The guide runs the FULL height of the drawer from its top edge, level with the
   title (Zeni, 12 Nov 2026); the title, the stepper and the fields sit to its left, the footer spans both. ── */
export function SteppedDrawerShell({ title, onBack, error, secondary, final, split, steps, current, onStep, onNext, help, children, overlays }: {
  title: string; onBack: () => void; error?: string; secondary?: ShellAction; final: ShellAction;
  /** One primary CTA with a dropdown (Publish ▾ Save as Draft) in place of the final button + secondary. */
  split?: ShellAction[];
  steps: StepItem[]; current: number; onStep: (i: number) => void; onNext: () => void;
  help: React.ReactNode; children: React.ReactNode; overlays?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000]">
      <div className="absolute inset-0 bg-[#0F172A]/30" onClick={onBack} />
      <div className="absolute inset-y-0 right-0 flex w-[min(1180px,calc(100vw-72px))] flex-col bg-white shadow-2xl">
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex flex-shrink-0 items-center gap-2 px-5 pb-2 pt-4">
              <h1 className="min-w-0 flex-1 truncate text-[16px] font-medium text-[#1D2A3E]">{title}</h1>
              {error && <span className="text-[12px] text-[#F25C4E]">{error}</span>}
            </div>
            {/* The stepper across the top: names only, the step's own line sits over its fields. */}
            <nav aria-label="Steps" className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[#EEF2F6] px-5 pb-3">
              {steps.map((s, i) => {
                const on = i === current;
                return (
                  <div key={s.title} className="flex min-w-0 items-center gap-2">
                    <button type="button" onClick={() => onStep(i)} aria-current={on ? 'step' : undefined}
                      className={'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors ' + (on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F7F9FC]')}>
                      <Badge n={i + 1} state={s.state} current={on} />
                      <span className={'whitespace-nowrap text-[13px] ' + (on ? 'font-semibold text-[#1D2A3E]' : 'font-medium text-[#475569]')}>{s.title}</span>
                    </button>
                    {i < steps.length - 1 && <span className={'h-px w-6 flex-shrink-0 ' + (s.state === 'done' ? 'bg-[#86CFA0]' : 'bg-[#DFE5ED]')} />}
                  </div>
                );
              })}
            </nav>
            <div data-create-scroll className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              <div className="px-5 py-5">{children}</div>
            </div>
          </div>
          {/* The guide, from the drawer's top edge down; the close X sits in its corner, so its title row keeps room for it. */}
          <div className="relative w-[360px] flex-shrink-0 border-l border-[#EEF2F6] [&>aside>div:first-child]:pr-12 [&>aside>div:first-child]:pt-[18px]">
            {help}
            <button type="button" onClick={onBack} title="Close" className="absolute right-3 top-3.5 flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6]"><X size={16} /></button>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 border-t border-[#EEF2F6] px-5 py-3">
          <button type="button" onClick={onBack} className={btn2 + ' text-[#7B8FA5]'}>Cancel</button>
          {secondary && !split && <button type="button" onClick={secondary.onClick} className={btn2}>{secondary.label}</button>}
          <span className="ml-auto text-[12px] tabular-nums text-[#7B8FA5]">Step {current + 1} of {steps.length}</span>
          <StepNav current={current} steps={steps} onStep={onStep} onNext={onNext} final={final} split={split} />
        </div>
      </div>
      {overlays}
    </div>
  );
}
