import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowLeft, CalendarDays, Check, ChevronDown, FileCode2, MessageSquareText, Pencil, Plus,
  RefreshCw, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import { RuleSelect, ToggleSwitch, ErrorText } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { CreatePageShell, FormField, Pills, Section, inputCls } from './CreateFormKit';
import { SteppedPageShell } from './CreateFormStepped';
import type { StepItem } from './CreateFormStepped';
import { CreateFormHelpPanel } from './CreateFormHelp';
import type { FormHelp } from './createFormGuides';
import { useDeployPolicyUi } from './deploymentPolicyUi';
import {
  DAY_LONG, INTERVALS, IN_USE, MON_SHORT, PRESETS, SCHED_TYPES, WEEKS, addDays, blankPolicy, currentCycle,
  intervalLabel, newScript, offsetDate, offsetLabel, policyStore, promptText, rebootText, scheduleText,
  summaryLines, warningsOf, windowText,
} from './deploymentPolicyData';
import type { DeploymentPolicy, IntervalKey, Prompt, ScriptRow, Week } from './deploymentPolicyData';

/* Create / Edit Deployment Policy — three layouts over ONE model (deploymentPolicyUi.ts):
 *   V1  PMG's four steps, every field simplified, the help guide on the right, PT calendar visible.
 *   V2  Details & Schedule · Deployment Actions · User Experience (prompts asked ONCE, a matrix) · Review,
 *       with a live plain-English summary on the right instead of a guide.
 *   V3  Pick a preset, then edit summary rows on one page; the live summary on the right.
 *
 * Rules every layout keeps (Zeni, 18 Nov 2026): at most ONE level of reveal — a toggle may open a block,
 * nothing inside it opens another indented block; chip walls become dropdowns / multi-selects; message
 * wording is folded behind "Edit message"; postpone intervals are a multi-select of presets. */

type P = DeploymentPolicy;
type SetP = (patch: Partial<P>) => void;

const numCls = 'h-8 w-[64px] rounded border border-[#DFE5ED] bg-white px-2 text-center text-[13px] tabular-nums text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const linkBtn = 'inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline';
const sel = '!rounded';

/* ───────────────────────── validation ───────────────────────── */

type Err = Partial<Record<'name' | 'schedule' | 'window' | 'preScripts' | 'postScripts' | 'prompts' | 'messages', string>>;
const STEP_OF: Record<keyof Err, number> = { name: 0, schedule: 0, window: 0, preScripts: 1, postScripts: 3, prompts: 2, messages: 1 };

function validate(p: P): Err {
  const e: Err = {};
  if (!p.name.trim()) e.name = 'Enter a policy name';
  if (p.schedType === 'weekly' && !p.days.length) e.schedule = 'Pick at least one day';
  if (p.schedType === 'weekly' && !p.weeks.length) e.schedule = 'Pick at least one week';
  if (p.schedType === 'pt' && !p.offsets.length) e.schedule = 'Pick at least one day after Patch Tuesday';
  if (p.schedType === 'calendar' && !p.dates.length) e.schedule = 'Pick at least one date';
  if (!p.allDay && p.slots.some((s) => !s.from || !s.to)) e.window = 'Every time slot needs a From and a To';
  if (p.preScript && (!p.preScripts.length || p.preScripts.some((s) => !s.file))) e.preScripts = 'Attach a file to every script';
  if (p.postScript && (!p.postScripts.length || p.postScripts.some((s) => !s.file))) e.postScripts = 'Attach a file to every script';
  const prompts = [p.preReboot && p.prePrompt, p.inUse === 'ask' && p.inUsePrompt, p.postReboot && p.postPrompt].filter(Boolean) as Prompt[];
  if (prompts.some((x) => x.allowPostpone && !x.intervals.length)) e.prompts = 'Pick at least one postpone interval';
  const msgs = [p.preReboot && p.prePrompt.notify && p.prePrompt, p.postReboot && p.postPrompt.notify && p.postPrompt].filter(Boolean) as Prompt[];
  if (msgs.some((x) => !x.title.trim() || !x.message.trim()) || (p.notifyOn && (!p.nTitle.trim() || !p.nMsg.trim()))) e.messages = 'A notification needs a title and a message';
  return e;
}

/* ───────────────────────── small pieces ───────────────────────── */

/** A toggle with its label and one line — the head of a block that opens below it. */
function ToggleRow({ on, onChange, label, sub, children }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="pt-0.5"><ToggleSwitch on={on} onChange={onChange} title={label} /></div>
        <button type="button" onClick={() => onChange(!on)} className="min-w-0 flex-1 text-left">
          <span className="block text-[13px] font-medium text-[#364658]">{label}</span>
          {sub && <span className="block text-[12px] text-[#7B8FA5]">{sub}</span>}
        </button>
      </div>
      {on && children && <div className="mt-4 space-y-4 pl-[46px]">{children}</div>}
    </div>
  );
}

/** A plain checkbox line — the deepest a setting may go (no further reveal under it). */
function CheckLine({ on, onChange, children, disabled, title }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode; disabled?: boolean; title?: string }) {
  return (
    <label title={title} className={'flex items-center gap-2.5 text-[13px] text-[#364658] ' + (disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#3D8BD0]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

const intervalOpts: SelectOption[] = INTERVALS.map(([value, label]) => ({ value, label }));
const timesOpts: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} time${i ? 's' : ''}` }));

/** "Allow postpone up to [3 times], waiting [15 min, 1 hour]" — the whole postpone setting as one line. */
function PostponeLine({ pr, onChange, what }: { pr: Prompt; onChange: (pr: Prompt) => void; what: string }) {
  return (
    <div className="space-y-3">
      <CheckLine on={pr.allowPostpone} onChange={(v) => onChange({ ...pr, allowPostpone: v })}>Allow the user to postpone the {what}</CheckLine>
      {pr.allowPostpone && (
        <div className="flex flex-wrap items-center gap-2 pl-[26px] text-[13px] text-[#64748B]">
          <span>Up to</span>
          <div className="w-[110px]"><RuleSelect className={sel} value={[String(pr.maxPostpone)]} options={timesOpts} onChange={(v) => onChange({ ...pr, maxPostpone: Number(v[0]) })} /></div>
          <span>, choosing from</span>
          <div className="w-[220px]"><RuleSelect className={sel} multi value={pr.intervals} options={intervalOpts} placeholder="Pick intervals" invalid={!pr.intervals.length} onChange={(v) => onChange({ ...pr, intervals: v as IntervalKey[] })} /></div>
        </div>
      )}
      <CheckLine on={pr.allowSkip} onChange={(v) => onChange({ ...pr, allowSkip: v })}>Allow the user to skip the {what}{pr.allowPostpone ? ' after the last postpone' : ''}</CheckLine>
    </div>
  );
}

/* ───────── messages: folded behind "Edit message", edited in a dialog with a preview ───────── */

const VARS: Record<string, string> = { '{countdown}': '5 minutes', '{app_names}': 'Chrome, Zoom', '{window_start}': 'Sat 21 Nov, 10:00 PM' };
const fill = (s: string) => Object.entries(VARS).reduce((t, [k, v]) => t.split(k).join(v), s);

function MessageRow({ label, title, message, vars, onSave }: { label: string; title: string; message: string; vars: string[]; onSave: (t: string, m: string) => void }) {
  const [open, setOpen] = useState(false);
  const empty = !title.trim() || !message.trim();
  return (
    <>
      <div className={'flex items-center gap-3 rounded border px-3 py-2 ' + (empty ? 'border-[#F5C2C2] bg-[#FEF3F2]' : 'border-[#EEF2F6] bg-[#F9FAFB]')}>
        <MessageSquareText size={15} className="flex-shrink-0 text-[#7B8FA5]" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-[#7B8FA5]">{label}</div>
          <div className="truncate text-[13px] text-[#364658]">{empty ? <span className="text-[#D92D20]">No message yet</span> : fill(title)}</div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={linkBtn}>Edit message</button>
      </div>
      {open && <MessageDialog label={label} title={title} message={message} vars={vars} onClose={() => setOpen(false)} onSave={(t, m) => { onSave(t, m); setOpen(false); }} />}
    </>
  );
}

function MessageDialog({ label, title, message, vars, onClose, onSave }: { label: string; title: string; message: string; vars: string[]; onClose: () => void; onSave: (t: string, m: string) => void }) {
  const [t, setT] = useState(title);
  const [m, setM] = useState(message);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  const insert = (v: string) => {
    const el = area.current; if (!el) { setM((x) => x + v); return; }
    const a = el.selectionStart, b = el.selectionEnd;
    setM((x) => x.slice(0, a) + v + x.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + v.length, a + v.length); });
  };
  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#0F172A]/40 p-4" onMouseDown={onClose}>
      <div className="w-[640px] max-w-full rounded-lg bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-[#EEF2F6] px-5 py-3.5">
          <h3 className="flex-1 text-[15px] font-semibold text-[#1D2A3E]">{label}</h3>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-[1fr_230px] gap-5 px-5 py-4">
          <div className="space-y-3">
            <FormField label="Title" required><input className={inputCls} value={t} maxLength={80} onChange={(e) => setT(e.target.value)} /></FormField>
            <FormField label="Message" required>
              <textarea ref={area} value={m} maxLength={300} onChange={(e) => setM(e.target.value)} rows={4} className="w-full rounded border border-[#DFE5ED] px-3 py-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            </FormField>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#7B8FA5]">Insert</span>
              {vars.map((v) => <button key={v} type="button" onClick={() => insert(v)} className="rounded bg-[#EEF2F6] px-1.5 py-0.5 font-mono text-[11px] text-[#475569] hover:bg-[#E2E8F0]">{v}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] text-[#7B8FA5]">What the user sees</div>
            <div className="rounded-lg border border-[#DFE5ED] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.10)]">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1D2A3E]"><RefreshCw size={12} className="text-[#3D8BD0]" />{fill(t) || 'Title'}</div>
              <p className="mt-1.5 text-[11.5px] leading-[1.5] text-[#475569]">{fill(m) || 'Message'}</p>
              <div className="mt-3 flex justify-end gap-1.5">
                <span className="rounded border border-[#DFE5ED] px-2 py-0.5 text-[10.5px] text-[#475569]">Postpone</span>
                <span className="rounded bg-[#3D8BD0] px-2 py-0.5 text-[10.5px] text-white">OK</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#EEF2F6] px-5 py-3">
          <button type="button" onClick={onClose} className="h-8 rounded border border-[#DFE5ED] px-3 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
          <button type="button" disabled={!t.trim() || !m.trim()} onClick={() => onSave(t, m)} className="h-8 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white hover:bg-[#3478B5] disabled:opacity-50">Save message</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ───────────────────────── schedule ───────────────────────── */

const DAY_OPTS: SelectOption[] = DAY_LONG.map((d, i) => ({ value: String(i), label: d }));
const WEEK_OPTS: SelectOption[] = WEEKS.filter(([w]) => w !== 'every').map(([value, label]) => ({ value, label }));
const DATE_OPTS: SelectOption[] = [...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}` })), { value: 'last', label: 'Last day of the month' }];
function ptOpts(): SelectOption[] {
  return Array.from({ length: 28 }, (_, off) => ({ value: String(off), label: offsetLabel(off), hint: offsetDate(off), group: `Week ${Math.floor(off / 7) + 1}` }));
}

/** The 4-week Patch Tuesday grid (PMG's), toggling the same offsets the dropdown does. */
function PtGrid({ offsets, onChange }: { offsets: number[]; onChange: (o: number[]) => void }) {
  const cyc = currentCycle();
  const cols = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  return (
    <div className="grid grid-cols-[52px_repeat(7,minmax(44px,1fr))] gap-1.5">
      <span />
      {cols.map((c) => <span key={c} className="text-center text-[11px] font-medium uppercase text-[#7B8FA5]">{c}</span>)}
      {Array.from({ length: 4 }, (_, w) => (
        <div key={w} className="contents">
          <span className="self-center text-[12px] text-[#7B8FA5]">Week {w + 1}</span>
          {Array.from({ length: 7 }, (_, c) => {
            const off = w * 7 + c; const d = addDays(cyc, off); const on = offsets.includes(off);
            return (
              <button key={off} type="button" aria-pressed={on} onClick={() => onChange(on ? offsets.filter((x) => x !== off) : [...offsets, off])}
                className={'grid place-items-center rounded border py-1 leading-tight transition-colors ' + (on ? 'border-[#3D8BD0] bg-[#EBF5FF]' : off === 0 ? 'border-dashed border-[#DFE5ED] hover:border-[#B9D3EA]' : 'border-[#DFE5ED] hover:border-[#B9D3EA]')}>
                <b className={'text-[12px] font-semibold ' + (on ? 'text-[#3D8BD0]' : off === 0 ? 'text-[#B45F06]' : 'text-[#364658]')}>{off === 0 ? 'PT' : `+${off}`}</b>
                <small className={'text-[10px] ' + (on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]')}>{d.getDate()} {MON_SHORT[d.getMonth()]}</small>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** "View on calendar" — the same grid, in a popover instead of always on the page (V2 / V3). */
function PtCalendarPopover({ offsets, onChange }: { offsets: number[]; onChange: (o: number[]) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (!open) return;
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(r.right - 470, window.innerWidth - 480)), top: r.bottom + 6 });
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <>
      <button ref={btn} type="button" onClick={() => setOpen((o) => !o)} className={linkBtn}><CalendarDays size={13} />View on calendar</button>
      {open && createPortal(
        <div ref={box} style={pos} className="fixed z-[10050] w-[470px] rounded-lg border border-[#DFE5ED] bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#1D2A3E]">Days after Patch Tuesday</span>
            <span className="text-[11px] text-[#7B8FA5]">Dates shown for this month's cycle</span>
          </div>
          <PtGrid offsets={offsets} onChange={onChange} />
        </div>,
        document.body,
      )}
    </>
  );
}

function ScheduleFields({ p, set, err, calendar }: { p: P; set: SetP; err: Err; calendar: 'inline' | 'popover' }) {
  const specific = !p.weeks.includes('every');
  const daysQuick = (
    <span className="flex gap-2.5">
      {([['Weekdays', [1, 2, 3, 4, 5]], ['Weekends', [0, 6]], ['Every day', [0, 1, 2, 3, 4, 5, 6]]] as [string, number[]][]).map(([l, d]) => (
        <button key={l} type="button" onClick={() => set({ days: d })} className={linkBtn}>{l}</button>
      ))}
    </span>
  );
  return (
    <div className="space-y-5">
      <FormField label="Schedule Type" required>
        <Pills value={p.schedType} options={SCHED_TYPES} onChange={(v) => set({ schedType: v })} />
      </FormField>

      {p.schedType === 'weekly' && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="Repeat" required>
            <RuleSelect className={sel} value={[specific ? 'specific' : 'every']} options={[{ value: 'every', label: 'Every week' }, { value: 'specific', label: 'Specific weeks of the month' }]}
              onChange={(v) => set({ weeks: v[0] === 'every' ? ['every'] : ['2'] })} />
          </FormField>
          {specific ? (
            <FormField label="Weeks of the Month" required>
              <RuleSelect className={sel} multi value={p.weeks} options={WEEK_OPTS} placeholder="Pick weeks" invalid={!p.weeks.length} onChange={(v) => set({ weeks: v as Week[] })} />
            </FormField>
          ) : <div />}
          <FormField label="Days of the Week" required action={daysQuick} error={err.schedule} hint={p.days.length ? scheduleText(p) : undefined}>
            <RuleSelect className={sel} multi value={p.days.map(String)} options={DAY_OPTS} placeholder="Pick days" invalid={!!err.schedule} onChange={(v) => set({ days: v.map(Number).sort() })} />
          </FormField>
        </div>
      )}

      {p.schedType === 'pt' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-6">
            <FormField label="Days After Patch Tuesday" required error={err.schedule}
              action={calendar === 'popover' ? <PtCalendarPopover offsets={p.offsets} onChange={(o) => set({ offsets: o })} /> : <button type="button" onClick={() => set({ offsets: [4, 5] })} className={linkBtn}>First weekend</button>}
              hint={p.offsets.length ? `Next: ${[...p.offsets].sort((a, b) => a - b).slice(0, 3).map(offsetDate).join(', ')}` : 'Patch Tuesday is the 2nd Tuesday of the month, when Microsoft releases updates.'}>
              <RuleSelect className={sel} multi searchable value={p.offsets.map(String)} options={ptOpts()} placeholder="Pick days" menuWidth={260} invalid={!!err.schedule} onChange={(v) => set({ offsets: v.map(Number) })} />
            </FormField>
          </div>
          {calendar === 'inline' && <PtGrid offsets={p.offsets} onChange={(o) => set({ offsets: o })} />}
        </div>
      )}

      {p.schedType === 'calendar' && (
        <div className="grid grid-cols-2 gap-x-6">
          <FormField label="Dates of the Month" required error={err.schedule} hint={p.dates.length ? scheduleText(p) : undefined}>
            <RuleSelect className={sel} multi searchable value={p.dates.map(String)} options={DATE_OPTS} placeholder="Pick dates" invalid={!!err.schedule}
              onChange={(v) => set({ dates: v.map((x) => (x === 'last' ? 'last' : Number(x))) })} />
          </FormField>
        </div>
      )}

      <FormField label="Deployment Window" required error={err.window}
        action={<label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#364658]"><ToggleSwitch on={p.allDay} onChange={(v) => set({ allDay: v })} />All day</label>}>
        {p.allDay ? (
          <p className="text-[12px] text-[#7B8FA5]">Patches may install at any time on the days above.</p>
        ) : (
          <div className="space-y-2">
            {p.slots.map((s, k) => (
              <div key={k} className="flex items-center gap-2">
                <input type="time" value={s.from} onChange={(e) => set({ slots: p.slots.map((x, i) => (i === k ? { ...x, from: e.target.value } : x)) })} className={inputCls + ' !w-[140px]'} />
                <span className="text-[12px] text-[#7B8FA5]">to</span>
                <input type="time" value={s.to} onChange={(e) => set({ slots: p.slots.map((x, i) => (i === k ? { ...x, to: e.target.value } : x)) })} className={inputCls + ' !w-[140px]'} />
                {s.from && s.to && s.to <= s.from && <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] text-[#64748B]">ends next day</span>}
                {p.slots.length > 1 && <button type="button" title="Remove time slot" onClick={() => set({ slots: p.slots.filter((_, i) => i !== k) })} className="flex size-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#FEF3F2] hover:text-[#EF4444]"><Trash2 size={14} /></button>}
              </div>
            ))}
            {p.slots.length < 3 && <button type="button" onClick={() => set({ slots: [...p.slots, { from: '12:00', to: '14:00' }] })} className={linkBtn}><Plus size={13} />Add time slot</button>}
          </div>
        )}
      </FormField>
    </div>
  );
}

function DownloadField({ p, set }: { p: P; set: SetP }) {
  return (
    <FormField label="Download Patches" hint={p.download === 'early' ? 'Downloads before the window, so installation starts on time. Recommended.' : 'Downloads only once the window opens.'}>
      <Pills value={p.download} options={[{ value: 'early', label: 'As early as possible' }, { value: 'window', label: 'During the window' }]} onChange={(v) => set({ download: v })} />
    </FormField>
  );
}

/* ───────────────────────── scripts: a compact row each ───────────────────────── */

function Scripts({ list, onChange, kind, error }: { list: ScriptRow[]; onChange: (l: ScriptRow[]) => void; kind: 'pre' | 'post'; error?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const upd = (id: string, patch: Partial<ScriptRow>) => onChange(list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const proceed = kind === 'pre' ? 'Continue the deployment even if this script fails' : 'Mark the deployment successful even if this script fails';
  return (
    <div className="space-y-2">
      {list.map((s, i) => (
        <div key={s.id} className="rounded border border-[#DFE5ED]">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[11px] font-semibold text-[#64748B]">{i + 1}</span>
            {s.file ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded bg-[#F9FAFB] px-2 py-1 text-[12px] text-[#364658]"><FileCode2 size={13} className="text-[#7B8FA5]" /><span className="truncate">{s.file}</span>
                <button type="button" title="Remove file" onClick={() => upd(s.id, { file: '' })} className="text-[#9CA3AF] hover:text-[#EF4444]"><X size={12} /></button></span>
            ) : (
              <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded border border-[#DFE5ED] px-2.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">
                <Upload size={13} />Attach file
                <input type="file" hidden accept=".ps1,.bat,.cmd,.vbs,.sh,.exe,.msi" onChange={(e) => e.target.files?.[0] && upd(s.id, { file: e.target.files[0].name })} />
              </label>
            )}
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[12px] text-[#7B8FA5]">{s.action === 'install' ? 'Install' : 'Uninstall'}{s.cmd ? ` · ${s.cmd}` : ''}</span>
              <button type="button" title={open === s.id ? 'Hide options' : 'Options'} onClick={() => setOpen(open === s.id ? null : s.id)} className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-[#F3F4F6]"><ChevronDown size={15} className={open === s.id ? 'rotate-180' : ''} /></button>
              <button type="button" title="Remove script" onClick={() => onChange(list.filter((x) => x.id !== s.id))} className="flex size-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#FEF3F2] hover:text-[#EF4444]"><Trash2 size={14} /></button>
            </div>
          </div>
          {open === s.id && (
            <div className="grid grid-cols-[auto_1fr_120px] items-end gap-4 border-t border-[#EEF2F6] bg-[#FCFDFE] px-3 py-3">
              <FormField label="Action"><Pills value={s.action} options={[{ value: 'install', label: 'Install' }, { value: 'uninstall', label: 'Uninstall' }]} onChange={(v) => upd(s.id, { action: v })} /></FormField>
              <FormField label="Command Argument"><input className={inputCls} value={s.cmd} placeholder="e.g. /quiet" onChange={(e) => upd(s.id, { cmd: e.target.value })} /></FormField>
              <FormField label="Exit Code"><input className={inputCls} value={s.exit} onChange={(e) => upd(s.id, { exit: e.target.value })} /></FormField>
              <div className="col-span-3"><CheckLine on={s.proceed} onChange={(v) => upd(s.id, { proceed: v })}>{proceed}</CheckLine></div>
            </div>
          )}
        </div>
      ))}
      {list.length < 5 && <button type="button" onClick={() => { const n = newScript(); onChange([...list, n]); }} className={linkBtn}><Plus size={13} />Add script</button>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/* ───────────────────────── the sections, shared by all three layouts ───────────────────────── */

function DetailsFields({ p, set, err }: { p: P; set: SetP; err: Err }) {
  return (
    <div className="space-y-4">
      <div className="max-w-[520px]"><FormField label="Policy Name" required error={err.name}><input className={inputCls + (err.name ? ' !border-[#F25C4E]' : '')} value={p.name} maxLength={80} placeholder="e.g. Servers – Weekend after Patch Tuesday" onChange={(e) => set({ name: e.target.value })} /></FormField></div>
      <FormField label="Description"><textarea value={p.desc} maxLength={500} rows={2} placeholder="Who this policy is for and why" onChange={(e) => set({ desc: e.target.value })} className="w-full rounded border border-[#DFE5ED] px-3 py-2 text-[12px] text-[#364658] placeholder:text-[#364658]/60 focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" /></FormField>
    </div>
  );
}

const NOTIFY_VARS = ['{app_names}', '{window_start}'];
const REBOOT_VARS = ['{countdown}'];

/** The reminders sent before the window — one sentence of four numbers, the wording behind Edit message. */
function RemindersFields({ p, set }: { p: P; set: SetP }) {
  return (
    <ToggleRow on={p.notifyOn} onChange={(v) => set({ notifyOn: v })} label="Remind users before deployment" sub="A popup with OK and Install Now.">
      {/* Three short sentences, one question each — four bare numbers in a row read as a formula. */}
      <div className="grid grid-cols-[96px_auto] items-center gap-x-3 gap-y-2.5 text-[13px] text-[#64748B]">
        <span>Start</span>
        <div className="flex items-center gap-2">
          <input type="number" min={1} className={numCls} value={p.nStart} onChange={(e) => set({ nStart: Number(e.target.value) })} />
          <div className="w-[96px]"><RuleSelect className={sel} value={[p.nStartUnit]} options={[{ value: 'h', label: 'hours' }, { value: 'd', label: 'days' }]} onChange={(v) => set({ nStartUnit: v[0] as 'h' | 'd' })} /></div>
          <span>before the window</span>
        </div>
        <span>Repeat every</span>
        <div className="flex items-center gap-2">
          <input type="number" min={1} className={numCls} value={p.nFreq} onChange={(e) => set({ nFreq: Number(e.target.value) })} />
          <div className="w-[104px]"><RuleSelect className={sel} value={[p.nFreqUnit]} options={[{ value: 'm', label: 'minutes' }, { value: 'h', label: 'hours' }, { value: 'd', label: 'days' }]} onChange={(v) => set({ nFreqUnit: v[0] as 'm' | 'h' | 'd' })} /></div>
          <span>up to</span>
          <input type="number" min={1} max={10} className={numCls} value={p.nCount} onChange={(e) => set({ nCount: Number(e.target.value) })} /><span>times</span>
        </div>
        <span>Close after</span>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={60} className={numCls} value={p.nTimeout} onChange={(e) => set({ nTimeout: Number(e.target.value) })} /><span>minutes if the user does nothing</span>
        </div>
      </div>
      <MessageRow label="Reminder message" title={p.nTitle} message={p.nMsg} vars={NOTIFY_VARS} onSave={(t, m) => set({ nTitle: t, nMsg: m })} />
    </ToggleRow>
  );
}

const inUseOpts: SelectOption[] = IN_USE.map((o) => ({ value: o.value, label: o.label + (o.value === 'ask' ? ' (Recommended)' : ''), tip: { desc: o.hint } }));

function InUseSelect({ p, set }: { p: P; set: SetP }) {
  return (
    <FormField label="If the application being patched is in use" hint={IN_USE.find((o) => o.value === p.inUse)?.hint}>
      <div className="max-w-[420px]"><RuleSelect className={sel} value={[p.inUse]} options={inUseOpts} menuWidth={360} onChange={(v) => set({ inUse: v[0] as P['inUse'] })} /></div>
    </FormField>
  );
}

function RebootBeforeHead({ p, set }: { p: P; set: SetP }) {
  return (
    <FormField label="Reboot When">
      <Pills value={p.preRebootWhen} options={[{ value: 'pending', label: 'Only if a reboot is pending' }, { value: 'always', label: 'Always' }]} onChange={(v) => set({ preRebootWhen: v })} />
    </FormField>
  );
}
function RebootAfterHead({ p, set }: { p: P; set: SetP }) {
  return (
    <div className="flex flex-wrap gap-6">
      <FormField label="Action"><Pills value={p.postAction} options={[{ value: 'restart', label: 'Reboot' }, { value: 'shutdown', label: 'Shut down' }]} onChange={(v) => set({ postAction: v })} /></FormField>
      <FormField label="When"><Pills value={p.postWhen} options={[{ value: 'required', label: 'Only if a patch needs it' }, { value: 'always', label: 'Always' }]} onChange={(v) => set({ postWhen: v })} /></FormField>
    </div>
  );
}
const afterWord = (p: P) => (p.postAction === 'shutdown' ? 'shutdown' : 'reboot');

/** V1: a user-prompt block under its own action — notify toggle → message row, then the postpone line. */
function PromptFields({ pr, onChange, what, notifyLabel }: { pr: Prompt; onChange: (pr: Prompt) => void; what: string; notifyLabel?: string }) {
  return (
    <div className="space-y-3">
      {notifyLabel && <CheckLine on={pr.notify} onChange={(v) => onChange({ ...pr, notify: v })}>{notifyLabel}</CheckLine>}
      {notifyLabel && pr.notify && <div className="pl-[26px]"><MessageRow label={`${what[0].toUpperCase()}${what.slice(1)} message`} title={pr.title} message={pr.message} vars={REBOOT_VARS} onSave={(t, m) => onChange({ ...pr, title: t, message: m })} /></div>}
      {(!notifyLabel || pr.notify) && <PostponeLine pr={pr} what={what} onChange={onChange} />}
    </div>
  );
}

/* ───────────────────────── V2: user prompts asked once ───────────────────────── */

function PromptMatrix({ p, set, err }: { p: P; set: SetP; err: Err }) {
  const cols: { key: 'pre' | 'use' | 'post'; label: string; on: boolean; off: string; pr: Prompt; patch: (pr: Prompt) => Partial<P>; fixedNotify?: boolean }[] = [
    { key: 'pre', label: 'Reboot before', on: p.preReboot, off: 'Reboot before deployment is off', pr: p.prePrompt, patch: (pr) => ({ prePrompt: pr }) },
    { key: 'use', label: 'App in use', on: p.inUse === 'ask', off: p.inUse === 'force' ? 'Apps are closed without asking' : 'Install waits for the app to close', pr: p.inUsePrompt, patch: (pr) => ({ inUsePrompt: pr }), fixedNotify: true },
    { key: 'post', label: `${afterWord(p)[0].toUpperCase()}${afterWord(p).slice(1)} after`, on: p.postReboot, off: 'Reboot after deployment is off', pr: p.postPrompt, patch: (pr) => ({ postPrompt: pr }) },
  ];
  const live = cols.filter((c) => c.on);
  /* Postpone limits are shared: the same answer to "how long may a user delay us" everywhere. */
  const shared = live[0]?.pr ?? p.inUsePrompt;
  const setShared = (patch: Partial<Prompt>) => set({ prePrompt: { ...p.prePrompt, ...patch }, inUsePrompt: { ...p.inUsePrompt, ...patch }, postPrompt: { ...p.postPrompt, ...patch } });
  const anyPostpone = live.some((c) => c.pr.allowPostpone);
  const Cell = ({ c, field }: { c: typeof cols[number]; field: 'notify' | 'allowPostpone' | 'allowSkip' }) => {
    if (!c.on) return <td className="px-3 py-2.5 text-center text-[#CBD5E1]">–</td>;
    const fixed = field === 'notify' && c.fixedNotify;
    const blocked = field !== 'notify' && !c.pr.notify;
    return (
      <td className="px-3 py-2.5 text-center">
        <input type="checkbox" aria-label={`${c.label}: ${field}`} disabled={fixed || blocked} checked={fixed ? true : blocked ? false : c.pr[field]}
          title={fixed ? 'The user is always asked when the app is open' : blocked ? 'Turn on the notification first' : undefined}
          onChange={(e) => set(c.patch({ ...c.pr, [field]: e.target.checked }))} className="size-4 accent-[#3D8BD0] disabled:opacity-40" />
      </td>
    );
  };
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-[#DFE5ED]">
        <table className="w-full text-[13px]">
          <thead className="bg-[#F7F9FC]">
            <tr>
              <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#364658]">The user…</th>
              {cols.map((c) => (
                <th key={c.key} className="w-[130px] px-3 py-2.5 text-center text-[12px] font-semibold text-[#364658]" title={c.on ? undefined : c.off}>
                  <span className={c.on ? '' : 'text-[#9CA3AF]'}>{c.label}</span>
                  {!c.on && <span className="block text-[10.5px] font-normal text-[#9CA3AF]">not in use</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            <tr><td className="px-3 py-2.5 text-[#364658]">sees a notification</td>{cols.map((c) => <Cell key={c.key} c={c} field="notify" />)}</tr>
            <tr><td className="px-3 py-2.5 text-[#364658]">can postpone</td>{cols.map((c) => <Cell key={c.key} c={c} field="allowPostpone" />)}</tr>
            <tr><td className="px-3 py-2.5 text-[#364658]">can skip after the last postpone</td>{cols.map((c) => <Cell key={c.key} c={c} field="allowSkip" />)}</tr>
          </tbody>
        </table>
      </div>
      {!live.length && <p className="text-[12px] text-[#7B8FA5]">Nothing here asks the user anything — turn on a reboot, or “Ask user” for open apps, in Deployment Actions.</p>}
      {anyPostpone && (
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#64748B]">
            <span>Postpone up to</span>
            <div className="w-[110px]"><RuleSelect className={sel} value={[String(shared.maxPostpone)]} options={timesOpts} onChange={(v) => setShared({ maxPostpone: Number(v[0]) })} /></div>
            <span>, choosing from</span>
            <div className="w-[230px]"><RuleSelect className={sel} multi value={shared.intervals} options={intervalOpts} invalid={!shared.intervals.length} placeholder="Pick intervals" onChange={(v) => setShared({ intervals: v as IntervalKey[] })} /></div>
          </div>
          <p className="mt-1 text-[12px] text-[#7B8FA5]">Applies to every prompt above that allows postponing.</p>
          <ErrorText>{err.prompts}</ErrorText>
        </div>
      )}
      {(p.preReboot && p.prePrompt.notify) || (p.postReboot && p.postPrompt.notify) ? (
        <div className="space-y-2">
          <div className="text-[12px] text-[#7B8FA5]">Messages</div>
          {p.preReboot && p.prePrompt.notify && <MessageRow label="Reboot before deployment" title={p.prePrompt.title} message={p.prePrompt.message} vars={REBOOT_VARS} onSave={(t, m) => set({ prePrompt: { ...p.prePrompt, title: t, message: m } })} />}
          {p.postReboot && p.postPrompt.notify && <MessageRow label={`${afterWord(p)[0].toUpperCase()}${afterWord(p).slice(1)} after deployment`} title={p.postPrompt.title} message={p.postPrompt.message} vars={REBOOT_VARS} onSave={(t, m) => set({ postPrompt: { ...p.postPrompt, title: t, message: m } })} />}
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── live summary (V2 / V3) ───────────────────────── */

function LiveSummary({ p, onJump }: { p: P; onJump?: (section: string) => void }) {
  const warns = warningsOf(p);
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-[#DFE5ED] bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-3 pt-3.5">
        <span className="h-[18px] w-[3px] rounded-full bg-[#1D2A3E]" />
        <h2 className="flex-1 text-[16px] font-medium text-[#1D2A3E]">Policy summary</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="text-[12.5px] leading-[1.6] text-[#64748B]">What this policy will do, in plain words. It updates as you fill the form.</p>
        {warns.length > 0 && (
          <div className="mt-3 space-y-1.5 rounded-lg border border-[#FDE3B5] bg-[#FFF8EB] px-3 py-2.5">
            {warns.map((w) => <div key={w} className="flex gap-2 text-[12.5px] leading-[1.5] text-[#8A5300]"><AlertTriangle size={13} className="mt-[3px] flex-shrink-0" />{w}</div>)}
          </div>
        )}
        <div className="mt-4 space-y-4">
          {summaryLines(p).map((s) => (
            <section key={s.title}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">{s.title}</span>
                {onJump && <button type="button" onClick={() => onJump(s.title)} className="text-[11.5px] font-medium text-[#3D8BD0] hover:underline">Edit</button>}
              </div>
              <ul className="space-y-1">
                {s.lines.map((l) => <li key={l} className="flex gap-2 text-[12.5px] leading-[1.55] text-[#364658]"><span className="mt-[8px] size-1 flex-shrink-0 rounded-full bg-[#94A3B8]" />{l}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ───────────────────────── V1 help guide ───────────────────────── */

const HELP: FormHelp = {
  noun: 'Deployment Policy',
  intro: 'A deployment policy decides when patches install and what users see on their computer. Many deployments can reuse one policy.',
  before: [],
  steps: [
    { section: ['Basic Details', 'Deployment Schedule', 'Patch Download'], title: 'Name it and set the schedule', text: 'Pick when patches may install: days of the week, days after Patch Tuesday, or fixed dates, and the hours of the window.', tips: ['If To is earlier than From, the window ends the next day.', 'Choose hours when users are away.'] },
    { section: ['Pre-Deployment Activities', 'Pre-Deployment Notification'], title: 'Before deployment', text: 'Optionally reboot first, run scripts, and remind users. Message wording is behind Edit message.', tips: ['{app_names} fills in with the applications being updated.'] },
    { section: ['At Installation Time'], title: 'During deployment', text: 'Decide what happens when an application being patched is open.', tips: ['Use “Close it forcefully” only for kiosks and servers.'] },
    { section: ['Post-Deployment Activities'], title: 'After deployment', text: 'Reboot or shut down, and scripts that run after patching.', tips: ['If no user is signed in, the endpoint restarts without a notification.'] },
  ],
  fields: [
    ['Patch Tuesday Offset', 'Days after Microsoft’s monthly release (the 2nd Tuesday). +4 is the Saturday after.'],
    ['Allow skip', 'After the last postpone, the 5-minute warning also shows Skip. Skipping moves it to the next window.'],
    ['{countdown}', 'Time left before the restart. Fixed at 5 minutes.'],
  ],
  example: { title: 'Servers on the weekend after Patch Tuesday', rows: [['Schedule', 'PT +4 (Sat), +5 (Sun)'], ['Window', '11:00 PM – 5:00 AM'], ['App in use', 'Close it forcefully'], ['After', 'Always reboot']] },
  mistakes: ['A window shorter than an hour — large patches may not finish.', 'Turning off notifications while forcing a reboot every time.'],
};

/* ───────────────────────── the editor ───────────────────────── */

export function DeploymentPolicyEditor({ policy, onClose, onSaved }: { policy?: DeploymentPolicy; onClose: () => void; onSaved: (p: DeploymentPolicy) => void }) {
  const ui = useDeployPolicyUi();
  const [p, setPolicy] = useState<P>(() => (policy ? structuredClone(policy) : blankPolicy()));
  const set: SetP = (patch) => setPolicy((x) => ({ ...x, ...patch }));
  const [tried, setTried] = useState(false);
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [preset, setPreset] = useState<string | null>(policy ? 'edit' : null);
  const errAll = useMemo(() => validate(p), [p]);
  const err: Err = tried ? errAll : {};
  const title = policy ? `Edit ${policy.name}` : 'Create Deployment Policy';
  const firstErr = (Object.values(errAll) as string[])[0];

  const save = () => {
    setTried(true);
    if (firstErr) { toast.error(firstErr); return; }
    const saved = policyStore.save(p);
    toast.success(policy ? `Saved “${saved.name}”` : `Created “${saved.name}”`);
    onSaved(saved);
  };
  const go = (i: number) => { setStep(i); setVisited((v) => new Set(v).add(i)); document.querySelector('[data-create-scroll]')?.scrollTo({ top: 0 }); };

  /* ── V1 / V2: stepped ── */
  if (ui === 'v1' || ui === 'v2') {
    const v2 = ui === 'v2';
    const titles = v2 ? ['Details & Schedule', 'Deployment Actions', 'User Experience', 'Review'] : ['Details & Schedule', 'Before Deployment', 'During Deployment', 'After Deployment'];
    const subs = v2
      ? ['Name it and set when patches may install.', 'What runs before, during and after installing.', 'Reminders, and how much a user may postpone.', 'Read it back before you create it.']
      : ['Name the policy and set when patches may install.', 'Reboot, scripts and reminders before installing.', 'What happens when an app being patched is open.', 'Reboot or shut down, and scripts after patching.'];
    const stepOfErr = (k: keyof Err) => (v2 ? ({ name: 0, schedule: 0, window: 0, preScripts: 1, postScripts: 1, prompts: 2, messages: 2 } as const)[k] : STEP_OF[k]);
    const steps: StepItem[] = titles.map((t, i) => ({
      title: t, sub: subs[i],
      state: tried && (Object.keys(errAll) as (keyof Err)[]).some((k) => stepOfErr(k) === i) ? 'error' : visited.has(i) && i !== step ? 'done' : 'todo',
    }));
    const jump = (s: string) => go({ When: 0, Before: 1, During: v2 ? 1 : 2, After: v2 ? 1 : 3 }[s] ?? 0);

    const body = v2 ? (
      <div className="space-y-10">
        {step === 0 && <>
          <Section title="Basic Details"><DetailsFields p={p} set={set} err={err} /></Section>
          <Section title="Deployment Schedule" sub="When patches may install."><ScheduleFields p={p} set={set} err={err} calendar="popover" /></Section>
          <Section title="Patch Download"><DownloadField p={p} set={set} /></Section>
        </>}
        {step === 1 && <>
          <Section title="Before Deployment" sub="Prompts for these are set in User Experience.">
            <div className="space-y-5">
              <ToggleRow on={p.preReboot} onChange={(v) => set({ preReboot: v })} label="Reboot before deployment" sub="Clears a pending restart before patching."><RebootBeforeHead p={p} set={set} /></ToggleRow>
              <ToggleRow on={p.preScript} onChange={(v) => set({ preScript: v, preScripts: v && !p.preScripts.length ? [newScript()] : p.preScripts })} label="Run custom scripts before deployment"><Scripts kind="pre" list={p.preScripts} onChange={(l) => set({ preScripts: l })} error={err.preScripts} /></ToggleRow>
            </div>
          </Section>
          <Section title="During Deployment">
            <div className="space-y-5">
              <InUseSelect p={p} set={set} />
              <ToggleRow on={p.showProgress} onChange={(v) => set({ showProgress: v })} label="Show an installation popup to the user" />
            </div>
          </Section>
          <Section title="After Deployment">
            <div className="space-y-5">
              <ToggleRow on={p.postReboot} onChange={(v) => set({ postReboot: v })} label="Reboot or shut down after deployment"><RebootAfterHead p={p} set={set} /></ToggleRow>
              <ToggleRow on={p.postScript} onChange={(v) => set({ postScript: v, postScripts: v && !p.postScripts.length ? [newScript()] : p.postScripts })} label="Run custom scripts after deployment" sub="Runs after patching, before the restart."><Scripts kind="post" list={p.postScripts} onChange={(l) => set({ postScripts: l })} error={err.postScripts} /></ToggleRow>
            </div>
          </Section>
        </>}
        {step === 2 && <>
          <Section title="Reminders" sub="Sent before the deployment window opens."><RemindersFields p={p} set={set} /></Section>
          <Section title="User Prompts" sub="Answer once what the user may do at each moment."><PromptMatrix p={p} set={set} err={err} /></Section>
        </>}
        {step === 3 && <Section title="Review" sub="Everything this policy will do. Fix anything from the step it belongs to.">
          <ReviewCards p={p} onEdit={(i) => go(i)} errs={tried ? errAll : {}} />
        </Section>}
      </div>
    ) : (
      <div className="space-y-10">
        {step === 0 && <>
          <Section title="Basic Details"><DetailsFields p={p} set={set} err={err} /></Section>
          <Section title="Deployment Schedule" sub="When patches may install."><ScheduleFields p={p} set={set} err={err} calendar="inline" /></Section>
          <Section title="Patch Download"><DownloadField p={p} set={set} /></Section>
        </>}
        {step === 1 && <>
          <Section title="Pre-Deployment Activities">
            <div className="space-y-5">
              <ToggleRow on={p.preReboot} onChange={(v) => set({ preReboot: v })} label="Reboot before deployment" sub="Clears a pending restart before patching.">
                <RebootBeforeHead p={p} set={set} />
                <PromptFields pr={p.prePrompt} onChange={(pr) => set({ prePrompt: pr })} what="reboot" notifyLabel="Show a reboot notification" />
                <ErrorText>{err.prompts}</ErrorText>
              </ToggleRow>
              <ToggleRow on={p.preScript} onChange={(v) => set({ preScript: v, preScripts: v && !p.preScripts.length ? [newScript()] : p.preScripts })} label="Run custom scripts"><Scripts kind="pre" list={p.preScripts} onChange={(l) => set({ preScripts: l })} error={err.preScripts} /></ToggleRow>
            </div>
          </Section>
          <Section title="Pre-Deployment Notification"><RemindersFields p={p} set={set} /></Section>
        </>}
        {step === 2 && <Section title="At Installation Time">
          <div className="space-y-5">
            <InUseSelect p={p} set={set} />
            {p.inUse === 'ask' && <div className="rounded-lg bg-[#F7F9FC] px-4 py-3"><PostponeLine pr={p.inUsePrompt} what="installation" onChange={(pr) => set({ inUsePrompt: pr })} /><ErrorText>{err.prompts}</ErrorText></div>}
            <ToggleRow on={p.showProgress} onChange={(v) => set({ showProgress: v })} label="Show an installation popup to the user" />
          </div>
        </Section>}
        {step === 3 && <Section title="Post-Deployment Activities">
          <div className="space-y-5">
            <ToggleRow on={p.postReboot} onChange={(v) => set({ postReboot: v })} label="Reboot or shut down after deployment">
              <RebootAfterHead p={p} set={set} />
              <PromptFields pr={p.postPrompt} onChange={(pr) => set({ postPrompt: pr })} what={afterWord(p)} notifyLabel={`Show a ${afterWord(p)} notification`} />
              <ErrorText>{err.prompts}</ErrorText>
            </ToggleRow>
            <ToggleRow on={p.postScript} onChange={(v) => set({ postScript: v, postScripts: v && !p.postScripts.length ? [newScript()] : p.postScripts })} label="Run custom scripts" sub="Runs after patching, before the restart."><Scripts kind="post" list={p.postScripts} onChange={(l) => set({ postScripts: l })} error={err.postScripts} /></ToggleRow>
          </div>
        </Section>}
      </div>
    );

    return (
      <SteppedPageShell
        title={title} onBack={onClose} error={tried ? firstErr : undefined}
        final={{ label: policy ? 'Save Policy' : 'Create Policy', onClick: save }}
        steps={steps} current={step} onStep={go} onNext={() => go(step + 1)}
        help={v2 ? <LiveSummary p={p} onJump={jump} /> : <CreateFormHelpPanel help={HELP} available={['Basic Details', 'Deployment Schedule', 'Patch Download', 'Pre-Deployment Activities', 'Pre-Deployment Notification', 'At Installation Time', 'Post-Deployment Activities']}
          onOpen={(t) => go(HELP.steps.findIndex((s) => s.section.some((x) => t.includes(x))))} />}
      >{body}</SteppedPageShell>
    );
  }

  /* ── V3: preset first ── */
  if (!preset) {
    return (
      <CreatePageShell title={title} onBack={onClose} actions={[]}>
        <div>
          <h2 className="text-[15px] font-semibold text-[#364658]">Start from a preset</h2>
          <p className="mt-px text-[12px] text-[#7B8FA5]">Pick the closest match. Every setting can still be changed on the next screen.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {PRESETS.map((pr) => (
              <button key={pr.id} type="button" onClick={() => { setPolicy({ ...blankPolicy(), ...pr.build(), name: pr.name, desc: pr.for }); setPreset(pr.id); }}
                className="group rounded-lg border border-[#DFE5ED] bg-white p-4 text-left transition-colors hover:border-[#3D8BD0] hover:bg-[#F7FBFF]">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]"><Sparkles size={14} /></span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#1D2A3E]">{pr.name}</div>
                    <div className="text-[12px] text-[#7B8FA5]">{pr.for}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 pl-[38px]">
                  {pr.points.map((x) => <li key={x} className="flex gap-2 text-[12px] text-[#475569]"><Check size={13} className="mt-[2px] flex-shrink-0 text-[#16A34A]" />{x}</li>)}
                </ul>
              </button>
            ))}
            <button type="button" onClick={() => setPreset('blank')}
              className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] py-4 text-[13px] font-medium text-[#475569] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
              <Plus size={15} />Start from scratch
            </button>
          </div>
        </div>
      </CreatePageShell>
    );
  }

  return (
    <CreatePageShell title={title} onBack={onClose} error={tried ? firstErr : undefined}
      actions={[{ label: policy ? 'Save Policy' : 'Create Policy', onClick: save, primary: true }]}
      aside={<LiveSummary p={p} onJump={(s) => document.querySelector(`[data-row="${s}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}>
      <SummaryRows p={p} set={set} err={err} tried={tried} errs={errAll} presetName={PRESETS.find((x) => x.id === preset)?.name} onChangePreset={policy ? undefined : () => setPreset(null)} />
    </CreatePageShell>
  );
}

/* ───────────────────────── V2 review ───────────────────────── */

function ReviewCards({ p, onEdit, errs }: { p: P; onEdit: (step: number) => void; errs: Err }) {
  const rows: { t: string; step: number; v: string; bad?: boolean }[] = [
    { t: 'Name', step: 0, v: p.name || '—', bad: !!errs.name },
    { t: 'Schedule', step: 0, v: `${scheduleText(p)} · ${windowText(p)}`, bad: !!errs.schedule || !!errs.window },
    { t: 'Before', step: 1, v: [p.preReboot && `Reboot ${p.preRebootWhen === 'pending' ? 'if pending' : 'always'}`, p.preScript && `${p.preScripts.length} script(s)`].filter(Boolean).join(' · ') || 'Nothing', bad: !!errs.preScripts },
    { t: 'App in use', step: 1, v: IN_USE.find((o) => o.value === p.inUse)!.label },
    { t: 'After', step: 1, v: [rebootText(p), p.postScript && `${p.postScripts.length} script(s)`].filter(Boolean).join(' · '), bad: !!errs.postScripts },
    { t: 'Reminders', step: 2, v: p.notifyOn ? `${p.nCount}× from ${p.nStart} ${p.nStartUnit === 'd' ? 'day(s)' : 'hour(s)'} before` : 'Off', bad: !!errs.messages },
    { t: 'User prompts', step: 2, v: [p.preReboot && `Reboot before: ${p.prePrompt.notify ? promptText(p.prePrompt) : 'no notice'}`, p.inUse === 'ask' && `App in use: ${promptText(p.inUsePrompt)}`, p.postReboot && `After: ${p.postPrompt.notify ? promptText(p.postPrompt) : 'no notice'}`].filter(Boolean).join(' · ') || 'None', bad: !!errs.prompts },
  ];
  return (
    <div className="divide-y divide-[#EEF2F6] rounded-lg border border-[#DFE5ED]">
      {rows.map((r) => (
        <div key={r.t} className="flex items-start gap-4 px-4 py-3">
          <span className="w-[110px] flex-shrink-0 text-[12px] text-[#7B8FA5]">{r.t}</span>
          <span className={'min-w-0 flex-1 text-[13px] ' + (r.bad ? 'text-[#D92D20]' : 'text-[#364658]')}>{r.v}</span>
          <button type="button" title={`Edit ${r.t}`} onClick={() => onEdit(r.step)} className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-[#F3F4F6]"><Pencil size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── V3: summary rows ───────────────────────── */

function SummaryRows({ p, set, err, tried, errs, presetName, onChangePreset }: { p: P; set: SetP; err: Err; tried: boolean; errs: Err; presetName?: string; onChangePreset?: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  type Row = { id: string; title: string; summary: string; bad?: boolean; body: React.ReactNode };
  const rows: Row[] = [
    { id: 'When', title: 'Schedule', summary: `${scheduleText(p)} · ${windowText(p)} · download ${p.download === 'early' ? 'early' : 'in the window'}`, bad: !!errs.schedule || !!errs.window,
      body: <div className="space-y-5"><ScheduleFields p={p} set={set} err={err} calendar="popover" /><DownloadField p={p} set={set} /></div> },
    { id: 'Before', title: 'Before deployment', summary: [p.preReboot ? `Reboot ${p.preRebootWhen === 'pending' ? 'if pending' : 'always'}${p.prePrompt.notify ? `, ${promptText(p.prePrompt)}` : ', no notice'}` : 'No reboot', p.preScript ? `${p.preScripts.length} script(s)` : null, p.notifyOn ? `${p.nCount} reminders` : 'No reminders'].filter(Boolean).join(' · '),
      bad: !!errs.preScripts || (!!errs.messages && (p.notifyOn || p.preReboot)),
      body: (
        <div className="space-y-5">
          <ToggleRow on={p.preReboot} onChange={(v) => set({ preReboot: v })} label="Reboot before deployment" sub="Clears a pending restart before patching.">
            <RebootBeforeHead p={p} set={set} />
            <PromptFields pr={p.prePrompt} onChange={(pr) => set({ prePrompt: pr })} what="reboot" notifyLabel="Show a reboot notification" />
          </ToggleRow>
          <ToggleRow on={p.preScript} onChange={(v) => set({ preScript: v, preScripts: v && !p.preScripts.length ? [newScript()] : p.preScripts })} label="Run custom scripts"><Scripts kind="pre" list={p.preScripts} onChange={(l) => set({ preScripts: l })} error={err.preScripts} /></ToggleRow>
          <RemindersFields p={p} set={set} />
        </div>
      ) },
    { id: 'During', title: 'During deployment', summary: `${IN_USE.find((o) => o.value === p.inUse)!.label}${p.inUse === 'ask' ? ` — ${promptText(p.inUsePrompt)}` : ''} · ${p.showProgress ? 'shows progress' : 'silent'}`, bad: !!errs.prompts && p.inUse === 'ask',
      body: (
        <div className="space-y-5">
          <InUseSelect p={p} set={set} />
          {p.inUse === 'ask' && <div className="rounded-lg bg-[#F7F9FC] px-4 py-3"><PostponeLine pr={p.inUsePrompt} what="installation" onChange={(pr) => set({ inUsePrompt: pr })} /></div>}
          <ToggleRow on={p.showProgress} onChange={(v) => set({ showProgress: v })} label="Show an installation popup to the user" />
        </div>
      ) },
    { id: 'After', title: 'After deployment', summary: [rebootText(p) + (p.postReboot ? (p.postPrompt.notify ? `, ${promptText(p.postPrompt)}` : ', no notice') : ''), p.postScript ? `${p.postScripts.length} script(s)` : null].filter(Boolean).join(' · '), bad: !!errs.postScripts,
      body: (
        <div className="space-y-5">
          <ToggleRow on={p.postReboot} onChange={(v) => set({ postReboot: v })} label="Reboot or shut down after deployment">
            <RebootAfterHead p={p} set={set} />
            <PromptFields pr={p.postPrompt} onChange={(pr) => set({ postPrompt: pr })} what={afterWord(p)} notifyLabel={`Show a ${afterWord(p)} notification`} />
          </ToggleRow>
          <ToggleRow on={p.postScript} onChange={(v) => set({ postScript: v, postScripts: v && !p.postScripts.length ? [newScript()] : p.postScripts })} label="Run custom scripts" sub="Runs after patching, before the restart."><Scripts kind="post" list={p.postScripts} onChange={(l) => set({ postScripts: l })} error={err.postScripts} /></ToggleRow>
        </div>
      ) },
  ];
  return (
    <>
      <Section title="Basic Details" sub={presetName ? undefined : 'Name the policy.'}>
        {presetName && (
          <div className="mb-4 flex items-center gap-2 rounded bg-[#F3F8FD] px-3 py-2 text-[12px] text-[#475569]">
            <Sparkles size={13} className="text-[#3D8BD0]" />Started from <b className="font-semibold text-[#1D2A3E]">{presetName}</b>
            {onChangePreset && <button type="button" onClick={onChangePreset} className={linkBtn + ' ml-auto'}><ArrowLeft size={12} />Change preset</button>}
          </div>
        )}
        <DetailsFields p={p} set={set} err={err} />
      </Section>
      <Section title="Settings" sub="Each row says what happens. Open one to change it.">
        <div className="divide-y divide-[#EEF2F6] rounded-lg border border-[#DFE5ED]">
          {rows.map((r) => {
            const on = open === r.id;
            const bad = tried && r.bad;
            return (
              <div key={r.id} data-row={r.id} className="scroll-mt-4">
                <button type="button" onClick={() => setOpen(on ? null : r.id)} aria-expanded={on} className={'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ' + (on ? 'bg-[#F7F9FC]' : 'hover:bg-[#F9FAFB]')}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1D2A3E]">{r.title}{bad && <span className="rounded-sm bg-[#FEF3F2] px-1.5 text-[11px] font-medium text-[#D92D20]">Needs attention</span>}</div>
                    {!on && <div className="mt-0.5 text-[12.5px] text-[#64748B]">{r.summary}</div>}
                  </div>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0]">{on ? 'Done' : 'Edit'}<ChevronDown size={14} className={on ? 'rotate-180' : ''} /></span>
                </button>
                {on && <div className="border-t border-[#EEF2F6] px-4 py-5">{r.body}</div>}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
