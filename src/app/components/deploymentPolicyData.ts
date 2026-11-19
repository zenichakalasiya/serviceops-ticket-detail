import { useSyncExternalStore } from 'react';

/* Deployment Policies — Admin › Patch Management › Deployment Management (Zeni, 18 Nov 2026).
 *
 * The content (fields, seeds, defaults, wording) is PMG's "deployment-policies.html". This file is the
 * ONE model the three create layouts (V1 / V2 / V3, deploymentPolicyUi.ts) edit, so switching layout
 * never changes what a policy is — only how it is asked for. */

export type SchedType = 'weekly' | 'pt' | 'calendar';
export type Week = 'every' | '1' | '2' | '3' | '4' | 'last';
export type IntervalKey = '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '1d';

/** A popup the user sees on the endpoint (reboot before, app in use, reboot after). */
export interface Prompt {
  notify: boolean;
  title: string;
  message: string;
  allowPostpone: boolean;
  maxPostpone: number;
  intervals: IntervalKey[];
  allowSkip: boolean;
}

export interface ScriptRow { id: string; action: 'install' | 'uninstall'; file: string; cmd: string; exit: string; proceed: boolean }

export interface DeploymentPolicy {
  id: number;
  name: string;
  desc: string;
  // Schedule
  schedType: SchedType;
  weeks: Week[];
  days: number[]; // 0 = Sunday
  offsets: number[]; // days after Patch Tuesday, 0..27
  dates: (number | 'last')[];
  allDay: boolean;
  slots: { from: string; to: string }[];
  download: 'early' | 'window';
  // Before
  preReboot: boolean;
  preRebootWhen: 'pending' | 'always';
  prePrompt: Prompt;
  preScript: boolean;
  preScripts: ScriptRow[];
  notifyOn: boolean;
  nStart: number; nStartUnit: 'h' | 'd';
  nFreq: number; nFreqUnit: 'm' | 'h' | 'd';
  nCount: number; nTimeout: number;
  nTitle: string; nMsg: string;
  // During
  inUse: 'ask' | 'force' | 'skip';
  inUsePrompt: Prompt;
  showProgress: boolean;
  // After
  postReboot: boolean;
  postAction: 'restart' | 'shutdown';
  postWhen: 'required' | 'always';
  postPrompt: Prompt;
  postScript: boolean;
  postScripts: ScriptRow[];
  // Listing
  applied: number;
  mod: string;
  by: string;
}

/* ── option lists ── */
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKS: [Week, string][] = [['every', 'Every week'], ['1', '1st week'], ['2', '2nd week'], ['3', '3rd week'], ['4', '4th week'], ['last', 'Last week']];
export const INTERVALS: [IntervalKey, string][] = [['5m', '5 min'], ['15m', '15 min'], ['30m', '30 min'], ['1h', '1 hour'], ['2h', '2 hours'], ['4h', '4 hours'], ['8h', '8 hours'], ['1d', '1 day']];
export const intervalLabel = (k: IntervalKey) => INTERVALS.find(([v]) => v === k)?.[1] ?? k;
export const SCHED_TYPES: { value: SchedType; label: string }[] = [
  { value: 'weekly', label: 'Weeks & Days' },
  { value: 'pt', label: 'Patch Tuesday Offset' },
  { value: 'calendar', label: 'Calendar Dates' },
];
export const IN_USE: { value: DeploymentPolicy['inUse']; label: string; hint: string }[] = [
  { value: 'ask', label: 'Ask user to close it or postpone', hint: 'Popup with Postpone and Close & Install. The user has 5 minutes to choose.' },
  { value: 'force', label: 'Close it forcefully, then install', hint: 'No warning. Unsaved work may be lost.' },
  { value: 'skip', label: "Don't install while it is in use", hint: 'Waits until the application is closed.' },
];

/* ── Patch Tuesday (2nd Tuesday of the month) ── */
export function patchTuesday(y: number, m: number): Date {
  const f = new Date(y, m, 1);
  return new Date(f.getFullYear(), f.getMonth(), 1 + ((2 - f.getDay() + 7) % 7) + 7);
}
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** The cycle the next PT window belongs to — this month's PT unless its 4 weeks are over. */
export function currentCycle(): Date {
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const pt = patchTuesday(t.getFullYear(), t.getMonth());
  if (t < pt) { const prev = patchTuesday(t.getFullYear(), t.getMonth() - 1); return dayDiff(t, prev) <= 27 ? prev : pt; }
  return dayDiff(t, pt) <= 27 ? pt : patchTuesday(t.getFullYear(), t.getMonth() + 1);
}
/** "PT +4 · Sat" — the dropdown's option label for an offset. */
export function offsetLabel(off: number): string {
  if (off === 0) return 'Patch Tuesday';
  return `PT +${off} · ${DAY_SHORT[(2 + off) % 7]}`;
}
export function offsetDate(off: number): string {
  const d = addDays(currentCycle(), off);
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;
}

/* ── wording ── */
export const fmtT = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const ord = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
const list = (a: string[]) => (a.length <= 1 ? a[0] ?? '' : `${a.slice(0, -1).join(', ')} & ${a[a.length - 1]}`);

export function scheduleText(p: DeploymentPolicy): string {
  if (p.schedType === 'pt') {
    if (!p.offsets.length) return 'No days picked yet';
    return [...p.offsets].sort((a, b) => a - b).map((o) => (o === 0 ? 'Patch Tuesday' : `PT +${o} (${DAY_SHORT[(2 + o) % 7]})`)).join(', ');
  }
  if (p.schedType === 'calendar') {
    if (!p.dates.length) return 'No dates picked yet';
    const nums = p.dates.filter((d): d is number => d !== 'last').sort((a, b) => a - b).map(ord);
    return `${list([...nums, ...(p.dates.includes('last') ? ['last day'] : [])])} of the month`;
  }
  if (!p.days.length) return 'No days picked yet';
  const days = [...p.days].sort();
  const dayTxt = days.length === 7 ? 'day' : days.join() === '1,2,3,4,5' ? 'weekday (Mon–Fri)' : days.join() === '0,6' ? 'Saturday & Sunday' : list(days.map((d) => DAY_LONG[d]));
  if (p.weeks.includes('every') || !p.weeks.length) return `Every ${dayTxt}`;
  const wk = list(p.weeks.map((w) => (w === 'last' ? 'last' : ord(Number(w)))));
  return `${wk} ${dayTxt} of the month`;
}
export function windowText(p: DeploymentPolicy): string {
  if (p.allDay) return 'All day';
  return p.slots.map((s) => `${fmtT(s.from)} – ${fmtT(s.to)}${s.to && s.from && toMin(s.to) <= toMin(s.from) ? ' (next day)' : ''}`).join(', ');
}
export function rebootText(p: DeploymentPolicy): string {
  if (!p.postReboot) return 'No reboot';
  const what = p.postAction === 'shutdown' ? 'Shut down' : 'Reboot';
  return p.postWhen === 'always' ? `${what} always` : `${what} if required`;
}
export function promptText(pr: Prompt): string {
  if (!pr.allowPostpone) return pr.allowSkip ? 'can skip' : 'no postpone';
  return `postpone up to ${pr.maxPostpone}× (${pr.intervals.map(intervalLabel).join(', ') || 'no intervals'})${pr.allowSkip ? ', then skip' : ''}`;
}

/** Plain-English lines the live summary reads back (V2 / V3). */
export function summaryLines(p: DeploymentPolicy): { title: string; lines: string[] }[] {
  const before: string[] = [];
  if (p.preReboot) before.push(`Reboots first ${p.preRebootWhen === 'pending' ? 'if one is pending' : 'every time'}${p.prePrompt.notify ? `, after a notice — user can ${promptText(p.prePrompt)}` : ', without a notice'}.`);
  if (p.preScript) before.push(`Runs ${p.preScripts.length} script${p.preScripts.length === 1 ? '' : 's'} before installing.`);
  before.push(p.notifyOn ? `Reminds users ${p.nCount}× — starting ${p.nStart} ${p.nStartUnit === 'd' ? 'day' : 'hour'}${p.nStart === 1 ? '' : 's'} before, every ${p.nFreq} ${({ m: 'min', h: 'hour', d: 'day' } as const)[p.nFreqUnit]}${p.nFreq === 1 || p.nFreqUnit === 'm' ? '' : 's'}.` : 'Users are not reminded before.');
  const during = [
    p.inUse === 'ask' ? `If an app is open, asks the user — they can ${promptText(p.inUsePrompt)}.` : p.inUse === 'force' ? 'Closes open apps without warning, then installs.' : 'Waits until the app is closed.',
    p.showProgress ? 'Shows an installation popup.' : 'Installs silently.',
  ];
  const after: string[] = [];
  if (p.postReboot) after.push(`${p.postAction === 'shutdown' ? 'Shuts down' : 'Reboots'} ${p.postWhen === 'required' ? 'only if a patch needs it' : 'every time'}${p.postPrompt.notify ? ` — user can ${promptText(p.postPrompt)}` : ', without a notice'}.`);
  else after.push('Does not reboot.');
  if (p.postScript) after.push(`Runs ${p.postScripts.length} script${p.postScripts.length === 1 ? '' : 's'} after patching.`);
  return [
    { title: 'When', lines: [`${scheduleText(p)}, ${windowText(p).toLowerCase() === 'all day' ? 'all day' : windowText(p)}.`, p.download === 'early' ? 'Downloads patches as early as possible.' : 'Downloads during the window.'] },
    { title: 'Before', lines: before },
    { title: 'During', lines: during },
    { title: 'After', lines: after },
  ];
}

/** Combinations an admin should look at twice. */
export function warningsOf(p: DeploymentPolicy): string[] {
  const w: string[] = [];
  if (p.inUse === 'force') w.push('Open apps are closed without warning — unsaved work may be lost. Use it for servers and kiosks only.');
  if (p.postReboot && p.postWhen === 'always' && !p.postPrompt.notify) w.push('Endpoints restart after every run with no notice to the user.');
  if (!p.allDay) for (const s of p.slots) {
    if (!s.from || !s.to) continue;
    let d = toMin(s.to) - toMin(s.from); if (d <= 0) d += 1440;
    if (d < 60) { w.push('A deployment window shorter than an hour may not fit large patches.'); break; }
  }
  return w;
}

/* ── defaults, presets, seeds ── */
export const prompt = (o: Partial<Prompt> = {}): Prompt => ({ notify: true, title: '', message: '', allowPostpone: true, maxPostpone: 3, intervals: ['15m', '1h', '4h'], allowSkip: false, ...o });
let sid = 0;
export const newScript = (): ScriptRow => ({ id: `s${++sid}`, action: 'install', file: '', cmd: '', exit: '0', proceed: false });

export function blankPolicy(): DeploymentPolicy {
  return {
    id: 0, name: '', desc: '',
    schedType: 'weekly', weeks: ['every'], days: [0, 6], offsets: [], dates: [], allDay: false, slots: [{ from: '22:00', to: '06:00' }], download: 'early',
    preReboot: false, preRebootWhen: 'pending',
    prePrompt: prompt({ title: 'Restart required before installing updates', message: 'Your computer will restart in {countdown} so updates can install. Save your work now.' }),
    preScript: false, preScripts: [],
    notifyOn: true, nStart: 1, nStartUnit: 'd', nFreq: 4, nFreqUnit: 'h', nCount: 3, nTimeout: 5,
    nTitle: 'Updates scheduled for {window_start}', nMsg: 'Updates for {app_names} will be installed on {window_start}. Save your work before then.',
    inUse: 'ask', inUsePrompt: prompt({ notify: true }), showProgress: true,
    postReboot: true, postAction: 'restart', postWhen: 'required',
    postPrompt: prompt({ title: 'Restart required to finish updates', message: 'Your computer will restart in {countdown} to finish installing updates. Save your work now.' }),
    postScript: false, postScripts: [],
    applied: 0, mod: 'Just now', by: 'Sarah Johnson',
  };
}

const quiet = (pr: Prompt): Prompt => ({ ...pr, notify: false, allowPostpone: false, allowSkip: false });

/** Starting points for V3 — the shapes PMG's own sample policies take. */
export interface Preset { id: string; name: string; for: string; points: string[]; build: () => Partial<DeploymentPolicy> }
export const PRESETS: Preset[] = [
  {
    id: 'servers', name: 'Servers – Weekend after Patch Tuesday', for: 'Production servers, after a pilot ring.',
    points: ['Sat & Sun after Patch Tuesday, 11 PM – 5 AM', 'No user prompts', 'Always reboots'],
    build: () => {
      const b = blankPolicy();
      return { schedType: 'pt', offsets: [4, 5], slots: [{ from: '23:00', to: '05:00' }], notifyOn: false, inUse: 'force', inUsePrompt: quiet(b.inUsePrompt), showProgress: false, postReboot: true, postWhen: 'always', postPrompt: quiet(b.postPrompt) };
    },
  },
  {
    id: 'business', name: 'Business Hours – No Reboot', for: 'Office desktops while people work.',
    points: ['Weekdays, 9 AM – 6 PM', '3 reminders · postpone up to 3', 'Never reboots'],
    build: () => ({ schedType: 'weekly', weeks: ['every'], days: [1, 2, 3, 4, 5], slots: [{ from: '09:00', to: '18:00' }], inUse: 'ask', postReboot: false }),
  },
  {
    id: 'anytime', name: '24×7 – User Intervention Allowed', for: 'Laptops that are rarely online at night.',
    points: ['Every day, all day', '3 reminders · postpone up to 3', 'Reboots if a patch needs it'],
    build: () => ({ schedType: 'weekly', weeks: ['every'], days: [0, 1, 2, 3, 4, 5, 6], allDay: true, inUse: 'ask', postReboot: true, postWhen: 'required' }),
  },
  {
    id: 'kiosk', name: 'Branch Kiosks – Fixed Dates', for: 'Machines with dates agreed with operations.',
    points: ['1st & 15th of the month, 1 AM – 5 AM', 'No reminders', 'Reboots if required, no notice'],
    build: () => {
      const b = blankPolicy();
      return { schedType: 'calendar', dates: [1, 15], slots: [{ from: '01:00', to: '05:00' }], notifyOn: false, inUse: 'force', inUsePrompt: quiet(b.inUsePrompt), postPrompt: quiet(b.postPrompt) };
    },
  },
];

function seed(id: number, name: string, desc: string, o: Partial<DeploymentPolicy>, applied: number, mod: string, by: string): DeploymentPolicy {
  return { ...blankPolicy(), ...o, id, name, desc, applied, mod, by };
}
const P = (id: string) => PRESETS.find((x) => x.id === id)!.build();
const SEED: DeploymentPolicy[] = [
  seed(9, 'Servers – Weekend after Patch Tuesday', 'Production servers, after the pilot ring has had 3 days.', P('servers'), 4, 'Today, 10:42 AM', 'Juli Gopani'),
  seed(8, 'Business Hours Deployment – No Reboot', 'Office desktops during working hours.', P('business'), 6, '2 days ago', 'Juli Gopani'),
  seed(7, '24x7 Deployment Policy – User Intervention Allowed', '', P('anytime'), 3, '1 week ago', 'Sarah Johnson'),
  seed(6, '24x7 Deployment Policy – Startup Triggered', 'Installs at system startup.', { ...P('anytime'), notifyOn: false }, 2, '2 weeks ago', 'Sarah Johnson'),
  seed(5, 'Riya Lab Deployment Policy', 'Lab machines.', { weeks: ['2', '4'], days: [6], slots: [{ from: '22:00', to: '04:00' }], nCount: 2, inUsePrompt: prompt({ allowPostpone: false }) }, 1, '1 month ago', 'Riya Shah'),
  seed(4, 'Branch Kiosks – 1st & 15th', 'Fixed dates agreed with branch operations.', P('kiosk'), 0, '1 month ago', 'Juli Gopani'),
  seed(3, 'QA-Skip-Notify-NoReboot', '', { days: [0, 1, 2, 3, 4, 5, 6], allDay: true, notifyOn: false, postReboot: false }, 1, '2 months ago', 'QA Team'),
  seed(2, 'Now', '', { days: [0, 1, 2, 3, 4, 5, 6], allDay: true, notifyOn: false, postReboot: false }, 0, '3 months ago', 'Sarah Johnson'),
  seed(1, '56', '', { days: [0], slots: [{ from: '00:00', to: '23:59' }], notifyOn: false, postReboot: false }, 0, '3 months ago', 'Sarah Johnson'),
];

/* ── store (globalThis, so a hot reload can't split it in two) ── */
type Store = { list: DeploymentPolicy[]; next: number; subs: Set<() => void> };
const G = globalThis as unknown as { __deployPolicyStore?: Store };
const store: Store = G.__deployPolicyStore ??= { list: SEED, next: 10, subs: new Set() };
const emit = () => store.subs.forEach((f) => f());

export const policyStore = {
  save(p: DeploymentPolicy): DeploymentPolicy {
    const saved = { ...p, id: p.id || store.next++, mod: 'Just now', by: 'Sarah Johnson' };
    store.list = p.id ? store.list.map((x) => (x.id === p.id ? saved : x)) : [saved, ...store.list];
    emit();
    return saved;
  },
  duplicate(id: number): DeploymentPolicy | undefined {
    const src = store.list.find((x) => x.id === id);
    if (!src) return undefined;
    const copy = { ...structuredClone(src), id: store.next++, name: `Copy of ${src.name}`, applied: 0, mod: 'Just now', by: 'Sarah Johnson' };
    store.list = [copy, ...store.list];
    emit();
    return copy;
  },
  remove(id: number) { store.list = store.list.filter((x) => x.id !== id); emit(); },
  restore(p: DeploymentPolicy, at: number) { const l = [...store.list]; l.splice(at, 0, p); store.list = l; emit(); },
  get: (id: number) => store.list.find((x) => x.id === id),
};

export function useDeploymentPolicies(): DeploymentPolicy[] {
  return useSyncExternalStore((f) => { store.subs.add(f); return () => store.subs.delete(f); }, () => store.list);
}
