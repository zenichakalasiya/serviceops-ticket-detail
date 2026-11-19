import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, CalendarClock, ChevronDown, Eye, Info, Plus, X } from 'lucide-react';
import { ErrorText, FieldLabel, RuleSelect, ToggleSwitch, inputCls as formInputCls } from './FormRuleControls';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { matchRules, optionsOf, selectAttr } from './ComplianceShared';
import type { SelectOption } from './FormRuleControls';
import { PickerDrawer } from './CreatePatchDeployment';
import { ColumnFilterSearch, useColumnFilter } from './ColumnFilterSearch';
import type { ColumnField } from './ColumnFilterSearch';
import { Paginated } from './Paginated';
import type { PickerColumn } from './CreatePatchDeployment';
import { TagCell } from './ComplianceShared';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AgentSplit, CreatePageShell, EmptyEndpointsArt, EmptyOfficesArt, Pills, RemoveBtn, Section, TargetBox } from './CreateFormKit';
import { SteppedDrawerShell, SteppedPageShell } from './CreateFormStepped';
import type { StepItem } from './CreateFormStepped';
import { SummaryAside } from './CreateFormOneScreen';
import type { SummaryGroup, SummaryLine } from './CreateFormOneScreen';
import { CreateFormHelp } from './CreateFormHelp';
import { FORM_STEPS } from './createFormSteps';
import type { CreateFormUi } from './createFormUi';
import { BENCHMARKS_SEED, benchmarkRuleIds, platformOf, profileLabel } from './complianceData';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';
import { NotifyPicker } from './NotifyPicker';
import { DEPLOYMENT_POLICIES_185 } from './data185';
import {
  benchmarkOf, deviceTagsOf, endpointsForBenchmark, fmtStamp, getPolicy, needsConfigType, nextRun, officesOf, openPolicyEditor,
  OCCURRENCES, policyStore, resolvedEndpoints, scheduleLabel, usePolicyEditor, weekDays, WEEKDAYS,
} from './compliancePolicyData';
import type { ComplianceEndpoint, CompliancePolicy, ConfigFileType, DeviceAxis, Frequency, MonthMode, Occurrence, PolicySchedule } from './compliancePolicyData';

/* Compliance Policy — the full-screen Create / Edit / Clone form.
 *
 * Mounted ONCE by App (CompliancePolicyEditorHost), opened through `openPolicyEditor`, so the
 * listing's Create, a row's Edit / Clone and the detail drawer's Edit all land on the same page.
 * The product header stays; the page sits over the module the way the Form Rule editor does.
 *
 * Content follows the ObserveOps compliance-settings prototype — Policy Name, Description,
 * OS Type, Benchmark, Device Filter + Select, Config File Type (network
 * benchmarks only), Schedule, Notify Team — laid out in the product's sections. One policy
 * assesses ONE benchmark; the endpoint pool is that benchmark's Type + OS version only. */

const inputCls = formInputCls.replace('rounded-md', 'rounded');
/** The Actions column stays pinned at the right while the other columns scroll (Zeni, 17 Nov 2026). */
const STICKY_END = 'sticky right-0 z-[1] bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]';

/* The columns each side drawer can be filtered by (ColumnFilterSearch). */
const agentOf = (e: ComplianceEndpoint) => (e.agentOnline ? 'Online' : 'Offline');
const EP_FIELDS: ColumnField<ComplianceEndpoint>[] = [
  { label: 'Endpoint ID', get: (e) => e.id },
  { label: 'Host Name', get: (e) => e.hostName },
  { label: 'IP Address', get: (e) => e.ip },
  { label: 'Operating System', get: (e) => e.osName },
  { label: 'Remote Office', get: (e) => e.office },
  { label: 'Agent Status', get: agentOf },
];
const PREVIEW_FIELDS = EP_FIELDS.filter((f) => f.label !== 'Remote Office');
const OFFICE_FIELDS: ColumnField<{ id: string; total: number }>[] = [
  { label: 'Remote Office', get: (o) => o.id },
  { label: 'Endpoints', get: (o) => String(o.total) },
];
const AXES: { value: DeviceAxis; label: string }[] = [
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'office', label: 'Remote Office' },
];
/* Monday first, as the product lists them; the value is the JS weekday (0 = Sunday). */
const DAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ value: String(i), label: WEEKDAYS[i] }));
const HOURS = Array.from({ length: 24 }, (_, i) => { const v = String(i).padStart(2, '0'); return { value: v, label: v }; });
const MINUTES = Array.from({ length: 60 }, (_, i) => { const v = String(i).padStart(2, '0'); return { value: v, label: v }; });
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_OPTIONS = MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }));
const ALL_MONTHS = MONTH_NAMES.map((_, i) => i);
const FREQS: { value: Frequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'interval', label: 'Interval' },
];
const NOTIFY_OPTIONS: SelectOption[] = [
  ...TECH_GROUPS.map((g) => ({ value: g, label: g, group: 'Technician groups' })),
  ...TECHNICIANS.map((t) => ({ value: t.name, label: t.name, group: 'Technicians', avatar: { initials: t.initials, color: '#3D8BD0' } })),
];


/** Preview of one remote office: the endpoints it brings into the policy, read-only. */
function OfficePreviewDrawer({ office, rows, osVersion, onClose }: { office: string; rows: ComplianceEndpoint[]; osVersion?: string; onClose: () => void }) {
  const f = useColumnFilter(rows, PREVIEW_FIELDS);
  const shown = f.filtered;
  useEffect(() => {
    /* Escape closes the drawer — unless the column menu is open, which takes its own Escape first. */
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const online = rows.filter((e) => e.agentOnline).length;
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onMouseDown={onClose}>
      <div className="flex h-full w-[760px] max-w-[95vw] flex-col bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#364658]"><Building2 size={17} className="text-[#7B8FA5]" />{office}</h3>
            <p className="mt-0.5 text-[12px] text-[#7B8FA5]">{rows.length} endpoint{rows.length === 1 ? '' : 's'}{osVersion ? ` running ${osVersion}` : ''} · assessed while this office is in the policy</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-3 border-b border-[#F0F2F5] px-5 py-3">
          <ColumnFilterSearch className="min-w-0 flex-1" rows={rows} fields={PREVIEW_FIELDS} query={f.query} onQuery={f.setQuery} conditions={f.conditions} onConditions={f.setConditions} />
          <span className="flex-shrink-0"><AgentSplit online={online} offline={rows.length - online} /></span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#7B8FA5]">No endpoint matches these filters.</p>
          ) : (
            <Paginated rows={shown} perPage={20} sticky>
              {(page) => (
                <table className="w-full table-fixed">
                  <colgroup><col className="w-[38%]" /><col className="w-[18%]" /><col /></colgroup>
                  <thead><tr className="border-b border-[#EEF1F4]">{['Endpoint', 'IP Address', 'Operating System'].map((h) => <th key={h} className="whitespace-nowrap px-5 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#EEF1F4]">
                    {page.map((e) => (
                      <tr key={e.id} className="hover:bg-[#f9fafb]">
                        <td className="px-5 py-2.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={`size-2 flex-shrink-0 rounded-full ${e.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} title={e.agentOnline ? 'Agent online' : 'Agent offline'} />
                            <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{e.id}</span>
                            <span className="truncate text-[13px] text-[#364658]">{e.hostName}</span>
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-[13px] tabular-nums text-[#64748B]">{e.ip}</td>
                        <td className="px-5 py-2.5"><span className="block truncate text-[13px] text-[#64748B]">{e.osName}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Paginated>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Schedule — shared by the form and the row's Schedule shortcut ───────────────────── */

export function ScheduleFields({ value, onChange, half }: { value: PolicySchedule; onChange: (s: PolicySchedule) => void; /** The switch ends where a half-width field beside it ends (the form's Notify Team). */ half?: boolean }) {
  const f = value.frequency;
  const set = (patch: Partial<PolicySchedule>) => onChange({ ...value, ...patch });
  const next = nextRun(value);
  return (
    /* Its own panel, set apart from Notify Team, with a bigger switch so it is seen (Zeni, 17 Nov 2026).
       The schedule's fields open inside the same panel. */
    <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3.5">
      <label className="flex w-full cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#EEF2F6] text-[#64748B]"><CalendarClock size={17} /></span>
          <span className="text-[14px] font-semibold text-[#364658]">Schedule</span>
        </span>
        <ToggleSwitch
          size="lg"
          on={f !== 'none'}
          onChange={(on) => onChange(!on ? { frequency: 'none' } : {
            frequency: 'daily',
            startDate: value.startDate ?? new Date().toISOString().slice(0, 10),
            time: value.time ?? '02:00',
            weekday: value.weekday ?? 1, // Monday — the first day the product lists
            monthday: value.monthday ?? 1,
          })}
          title={f !== 'none' ? 'Turn off the schedule' : 'Schedule this policy'}
        />
      </label>
      {/* No line under the switch when it is off (Zeni, 15 Nov 2026). The fields and their options are the
          product's Automatic Patch Deployment Schedule, read on .185 (Zeni, 17 Nov 2026). */}
      {f !== 'none' && (
        <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4">
          <div>
            <FieldLabel required>Schedule Type</FieldLabel>
            <RuleSelect className="!rounded" value={[f]} options={FREQS.filter((o) => o.value !== 'none')} onChange={(v) => v[0] && onChange({ ...value, frequency: v[0] as Frequency })} />
          </div>
          <div />
          {f === 'monthly' && (
            <div className="col-span-2">
              <FieldLabel required>When should this scheduler run?</FieldLabel>
              <Pills value={value.monthMode ?? 'date'} options={[{ value: 'date' as MonthMode, label: 'On Specific Date' }, { value: 'day' as MonthMode, label: 'On Specific Day' }]} onChange={(v) => set({ monthMode: v })} />
            </div>
          )}
          <div>
            <FieldLabel required>Start At</FieldLabel>
            {f === 'once' || f === 'interval'
              ? <input type="datetime-local" value={value.startDate ? `${value.startDate}T${value.time ?? '00:00'}` : ''} onChange={(e) => set({ startDate: e.target.value.slice(0, 10), time: e.target.value.slice(11, 16) })} className={inputCls} />
              : <input type="date" value={value.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />}
          </div>
          {f === 'interval' && (
            <div>
              <FieldLabel required>Interval</FieldLabel>
              <div className="flex">
                <input type="number" min={1} value={value.interval ?? 1} onChange={(e) => set({ interval: Math.max(1, Number(e.target.value) || 1) })} className={`${inputCls} !rounded-r-none`} />
                <RuleSelect className="!w-[110px] flex-shrink-0 !rounded-l-none !border-l-0 !rounded-r" value={[value.intervalUnit ?? 'Hours']} options={[{ value: 'Hours', label: 'Hours' }, { value: 'Days', label: 'Days' }]} onChange={(v) => v[0] && set({ intervalUnit: v[0] as 'Hours' | 'Days' })} />
              </div>
            </div>
          )}
          {f === 'weekly' && (
            <div>
              <FieldLabel required>Day</FieldLabel>
              {/* Several days can be picked (Zeni, 17 Nov 2026); at least one stays chosen. */}
              <RuleSelect className="!rounded" multi value={weekDays(value).map(String)} options={DAYS_MON_FIRST} onChange={(v) => v.length && set({ weekdays: v.map(Number) })} placeholder="Select" />
            </div>
          )}
          {(f === 'daily' || f === 'weekly' || f === 'monthly') && (
            <div className={f === 'weekly' ? 'col-start-1' : ''}>
              <FieldLabel>Time</FieldLabel>
              <div className="flex items-center gap-2">
                <RuleSelect className="!rounded flex-1" value={[(value.time ?? '00:00').slice(0, 2)]} options={HOURS} onChange={(v) => set({ time: `${v[0]}:${(value.time ?? '00:00').slice(3, 5)}` })} />
                <span className="text-[13px] text-[#64748B]">:</span>
                <RuleSelect className="!rounded flex-1" value={[(value.time ?? '00:00').slice(3, 5)]} options={MINUTES} onChange={(v) => set({ time: `${(value.time ?? '00:00').slice(0, 2)}:${v[0]}` })} />
              </div>
            </div>
          )}
          {f === 'once' && <div />}
          {f === 'monthly' && (value.monthMode ?? 'date') === 'date' && (
            <div className="col-start-1">
              <FieldLabel required>Date</FieldLabel>
              <RuleSelect className="!rounded" value={[String(value.monthday ?? 1)]} options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} onChange={(v) => set({ monthday: Number(v[0]) })} />
            </div>
          )}
          {f === 'monthly' && value.monthMode === 'day' && (
            <>
              <div className="col-start-1">
                <FieldLabel required>Occurrence</FieldLabel>
                <RuleSelect className="!rounded" value={[value.occurrence ?? 'First']} options={OCCURRENCES.map((o) => ({ value: o, label: o }))} onChange={(v) => v[0] && set({ occurrence: v[0] as Occurrence })} />
              </div>
              <div>
                <FieldLabel required>Weekday</FieldLabel>
                <RuleSelect className="!rounded" value={[String(value.weekday ?? 1)]} options={DAYS_MON_FIRST} onChange={(v) => set({ weekday: Number(v[0]) })} />
              </div>
            </>
          )}
          {f === 'monthly' && (
            <div className="col-start-1">
              <FieldLabel required>Month</FieldLabel>
              <RuleSelect className="!rounded" multi value={(value.months ?? ALL_MONTHS).map(String)} options={MONTH_OPTIONS} onChange={(v) => set({ months: v.map(Number).sort((x, y) => x - y) })} placeholder="Select" />
            </div>
          )}
        </div>
      )}
      {f !== 'none' && (
        <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-[18px] text-[#64748B]">
          <CalendarClock size={13} className="mt-[2.5px] flex-shrink-0 text-[#7B8FA5]" />
          <span className="min-w-0">{scheduleLabel(value)} · next scan <span className="whitespace-nowrap font-medium text-[#364658]">{next ? fmtStamp(next) : '—'}</span></span>
        </p>
      )}
    </div>
  );
}

/** The row's Schedule shortcut — the same fields, in a right side panel. */
export function PolicyScheduleDrawer({ policyId, onClose }: { policyId: string; onClose: () => void }) {
  const p = getPolicy(policyId);
  const [draft, setDraft] = useState<PolicySchedule>(p?.schedule ?? { frequency: 'none' });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!p) return null;
  const incomplete = draft.frequency !== 'none' && (!draft.startDate || !draft.time);
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onMouseDown={onClose}>
      <div className="flex h-full w-[520px] max-w-[95vw] flex-col bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Schedule</h3>
            <p className="mt-0.5 truncate text-[12px] text-[#7B8FA5]">{p.name}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5"><ScheduleFields value={draft} onChange={setDraft} /></div>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button type="button" onClick={onClose} className="h-8 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
          <button
            type="button"
            disabled={incomplete}
            onClick={() => { policyStore.setSchedule(p.id, draft); toast.success(`Schedule updated — ${scheduleLabel(draft)}`); onClose(); }}
            className="h-8 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50"
          >Save Schedule</button>
        </div>
      </div>
    </div>
  );
}

/* ── The form ────────────────────────────────────────────────────────────────────────── */

type Draft = Omit<CompliancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'lastScan' | 'createdBy' | 'scanning'>;
/** A new policy starts on the first benchmark, so endpoints can be added straight away. */
const blank = (): Draft => ({
  /* A new audit starts with no benchmark, so the Benchmark menu opens on all of them (Zeni, 17 Nov 2026). */
  name: '', description: '', benchmarkId: '', configType: null, axis: 'endpoint',
  endpointIds: [], offices: [], deviceTags: [], schedule: { frequency: 'none' }, notify: [], enabled: true,
});

/** Mount once (App). Renders the form whenever something opens it. */
export function CompliancePolicyEditorHost() {
  const ed = usePolicyEditor();
  if (!ed) return null;
  return <CompliancePolicyForm key={ed.mode + ('id' in ed ? ed.id : '')} mode={ed.mode} sourceId={'id' in ed ? ed.id : undefined} onClose={() => openPolicyEditor(null)} />;
}

function CompliancePolicyForm({ mode, sourceId, onClose }: { mode: 'create' | 'edit' | 'clone'; sourceId?: string; onClose: () => void }) {
  const source = sourceId ? getPolicy(sourceId) : undefined;
  const [d, setD] = useState<Draft>(() => {
    if (!source) return blank();
    const { id, createdAt, updatedAt, lastScan, createdBy, scanning, ...rest } = source;
    return { ...rest, name: mode === 'clone' ? `Copy of ${source.name}` : source.name };
  });
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  /* OS Platform and OS Version narrow the benchmarks offered (Zeni, 17 Nov 2026 — they replace
     OS Type). Neither is stored on the policy: the chosen benchmark already carries both, so they
     open on that benchmark's, and picking a benchmark fills them in. */
  const initial = platformOf(benchmarkOf(source?.benchmarkId ?? blank().benchmarkId)?.osVersion ?? '');
  const [platform, setPlatform] = useState(initial.platform);
  const [osVer, setOsVer] = useState(initial.version);
  const [picking, setPicking] = useState(false);
  const [pickingOffices, setPickingOffices] = useState(false);
  const [previewOffice, setPreviewOffice] = useState<string | null>(null);
  const [tried, setTried] = useState<null | 'publish' | 'draft'>(null);

  const benchmark = benchmarkOf(d.benchmarkId);
  const showConfig = needsConfigType(benchmark);
  const pool = useMemo(() => endpointsForBenchmark(benchmark), [benchmark]);
  const resolved = useMemo(() => resolvedEndpoints(d), [d]);

  /* Network devices (Router / Switch / Firewall) are not offered (Zeni, 16 Nov 2026). An
     existing audit already on one keeps its benchmark so the field does not read empty. */
  const offered = useMemo(() => BENCHMARKS_SEED.filter((b) => b.type === 'Linux' || b.type === 'Windows' || b.id === source?.benchmarkId), [source?.benchmarkId]);
  const platformOptions = useMemo(() => [...new Set(offered.map((b) => platformOf(b.osVersion).platform))].sort((a, b) => a.localeCompare(b)).map((p) => ({ value: p, label: p })), [offered]);
  const versionOptions = useMemo(() => [...new Set(offered.filter((b) => platformOf(b.osVersion).platform === platform).map((b) => platformOf(b.osVersion).version))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((v) => ({ value: v, label: v })), [offered, platform]);
  /* Every benchmark is offered (about 50) until a platform or version narrows them; the menu
     searches and groups them under their OS version. */
  const benchOptions = useMemo(() => offered
    .filter((b) => { const p = platformOf(b.osVersion); return (!platform || p.platform === platform) && (!osVer || p.version === osVer); })
    .sort((a, b) => a.osVersion.localeCompare(b.osVersion, undefined, { numeric: true }) || a.name.localeCompare(b.name))
    .map((b) => ({ value: b.id, label: b.name, group: b.osVersion })), [offered, platform, osVer]);

  /* The endpoint picker's filters — the same filter bar the Attach Rules picker uses. */
  /* Both pickers search with the column filter: type to search, or click for field → operator → value. */
  const epFilter = useColumnFilter(pool, EP_FIELDS);
  const pickRows = epFilter.filtered;

  /* Every office the benchmark's endpoints sit in, with how many of them — the office picker's rows. */
  const officeRows = useMemo(() => officesOf(pool).map((o) => {
    const here = pool.filter((e) => e.office === o);
    const online = here.filter((e) => e.agentOnline).length;
    return { id: o, total: here.length, online, offline: here.length - online };
  }), [pool]);
  /* The endpoints added one by one — the Endpoints box lists only these. */
  const picked = useMemo(() => pool.filter((e) => d.endpointIds.includes(e.id)), [pool, d.endpointIds]);
  const officeFilter = useColumnFilter(officeRows, OFFICE_FIELDS);

  const scheduleIncomplete = d.schedule.frequency !== 'none' && (!d.schedule.startDate || !d.schedule.time);
  const changeBenchmark = (id: string) => {
    if (id === d.benchmarkId) return;
    const had = d.endpointIds.length + d.offices.length + d.deviceTags.length;
    if (had) toast('The endpoint selection was cleared — the new benchmark is written for a different set of endpoints');
    const b = benchmarkOf(id);
    if (b) { const p = platformOf(b.osVersion); setPlatform(p.platform); setOsVer(p.version); }
    set({ benchmarkId: id, endpointIds: [], offices: [], deviceTags: [], configType: needsConfigType(b) ? (d.configType ?? 'running') : null });
  };

  /* A different OS Platform or OS Version means the chosen benchmark no longer fits, so it and the
     endpoints chosen for it are cleared — the same rule changing the benchmark itself follows. */
  const clearIfOff = (p: string, v: string) => {
    const cur = platformOf(benchmarkOf(d.benchmarkId)?.osVersion ?? '');
    if (!d.benchmarkId || (cur.platform === p && (!v || cur.version === v))) return;
    const had = d.endpointIds.length + d.offices.length + d.deviceTags.length;
    if (had) toast('The benchmark and endpoint selection were cleared — they were for a different OS');
    set({ benchmarkId: '', endpointIds: [], offices: [], deviceTags: [], configType: null });
  };
  const changePlatform = (p: string) => {
    if (p === platform) return;
    setPlatform(p); setOsVer('');
    clearIfOff(p, '');
  };
  const changeVersion = (v: string) => {
    if (v === osVer) return;
    setOsVer(v);
    clearIfOff(platform, v);
  };

  /* ── Validation, keyed by field so every layout can say which part is missing. ── */
  const errs: Record<string, string> = {};
  if (!d.name.trim()) errs.name = 'Enter a name';
  if (!d.benchmarkId) errs.benchmark = 'Choose a benchmark';
  if (!platform) errs.platform = 'Choose an OS Platform';
  if (!osVer) errs.osVersion = 'Choose an OS Version';
  if (showConfig && !d.configType) errs.config = 'Choose a Config File Type';
  if (benchmark && resolved.length === 0) errs.targets = 'Add a remote office or an endpoint';
  if (scheduleIncomplete) errs.schedule = 'Complete the schedule — a start date and a time';
  /** Which form section each problem sits in. */
  const SEC_OF: Record<string, string> = { name: 'Policy Details', platform: 'Benchmark', osVersion: 'Benchmark', benchmark: 'Benchmark', config: 'Benchmark', targets: 'Target Endpoints', schedule: 'Schedule & Notifications' };

  /* ── Layout (V1–V5, the header's switch — createFormUi.ts) ── */
  /* V1 is FINAL for Create Audit (Zeni, 19 Nov 2026): always the full page with the stepper on the left
     (pill "V1" = id 'v2'), and the header's V1 | V2 switch is not shown here (no setExtraCreateOpen).
     Restoring the switch = `useCreateFormUi()` + the setExtraCreateOpen effect. */
  const ui = 'v2' as CreateFormUi;
  const stepDefs = FORM_STEPS['compliance-policy'];
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<number[]>([]);
  const [moreOpen, setMoreOpen] = useState<string[]>([]);
  const toggleMore = (t: string) => setMoreOpen((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const stepOfSec = (sec: string) => Math.max(0, stepDefs.findIndex((st) => st.sections.includes(sec)));
  const stepErrs = stepDefs.map((st) => Object.keys(errs).filter((k) => st.sections.includes(SEC_OF[k])));
  /** An error is shown once Publish was pressed, or once Next was pressed on its step. */
  const show = (k: string) => (tried === 'publish' || (tried === 'draft' && k === 'name') || checked.includes(stepOfSec(SEC_OF[k])) ? errs[k] ?? '' : '');
  const first = Object.keys(errs)[0];

  const save = (via: 'publish' | 'draft') => {
    setTried(via);
    const bad = via === 'publish' ? !!first : !!errs.name;
    if (bad) {
      const k = via === 'publish' ? first! : 'name';
      setStep(stepOfSec(SEC_OF[k]));
      if (!moreOpen.includes(SEC_OF[k])) setMoreOpen((x) => [...x, SEC_OF[k]]);
      return;
    }
    policyStore.save({ ...d, name: d.name.trim(), description: d.description.trim(), configType: showConfig ? d.configType : null, draft: via === 'draft', id: mode === 'edit' ? sourceId : undefined });
    toast.success(via === 'draft'
      ? `“${d.name.trim()}” saved as draft`
      : mode === 'edit'
        ? `“${d.name.trim()}” updated`
        : `“${d.name.trim()}” published — it assesses ${resolved.length} endpoint${resolved.length === 1 ? '' : 's'} against ${benchmark!.name}`);
    onClose();
  };
  const headerError = tried === 'publish' && first ? errs[first] : tried === 'draft' && errs.name ? 'Give it a name before saving a draft' : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save('publish'); }
      if (e.key === 'Escape' && !picking && !pickingOffices && !previewOffice && !document.querySelector('[data-rule-menu]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const title = mode === 'edit' ? 'Edit Compliance Policy' : mode === 'clone' ? 'Clone Compliance Policy' : 'Create Audit';
  const pickReason = !benchmark ? 'Choose a benchmark first — only endpoints it is written for can be assessed' : pool.length === 0 ? `No endpoint runs ${benchmark.osVersion} yet` : undefined;
  /** Publish ▾ Save as Draft — one primary CTA with a dropdown (Zeni, 12 Nov 2026). Editing an
   *  audit reads Update ▾ Save as Draft (Zeni, 17 Nov 2026). */
  const split = [{ label: mode === 'edit' ? 'Update' : 'Publish', onClick: () => save('publish') }, { label: 'Save as Draft', onClick: () => save('draft') }];

  const columns: PickerColumn<ComplianceEndpoint>[] = [
    {
      header: 'Host Name', cell: (e) => (
        <span className="flex items-center gap-2">
          <span className={`size-2 flex-shrink-0 rounded-full ${e.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} title={e.agentOnline ? 'Agent online' : 'Agent offline'} />
          <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{e.id}</span>
          <span className="whitespace-nowrap text-[13px] font-medium">{e.hostName}</span>
        </span>
      ),
    },
    { header: 'IP Address', cell: (e) => <span className="tabular-nums">{e.ip}</span> },
    { header: 'Operating System', cell: (e) => <span className="whitespace-nowrap">{e.osName}</span> },
    { header: 'Remote Office', cell: (e) => <span className="whitespace-nowrap">{e.office}</span> },
  ];

  /* ── The form's parts, written once and placed by every layout ── */
  const nameEl = (
    <div>
      <FieldLabel required>Policy Name</FieldLabel>
      <input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Must be unique" className={`${inputCls} ${show('name') ? '!border-[#F25C4E]' : ''}`} />
      <ErrorText>{show('name')}</ErrorText>
    </div>
  );
  const descEl = (
    <div>
      <FieldLabel>Description</FieldLabel>
      <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Write a description" rows={3} className={`${inputCls} !h-auto resize-y py-2 leading-[18px]`} />
    </div>
  );
  const benchmarkEl = (
    <>
      <div className="grid grid-cols-2 gap-x-2 gap-y-4">
        <div>
          <FieldLabel required>OS Platform</FieldLabel>
          <RuleSelect className="!rounded" searchable value={platform ? [platform] : []} options={platformOptions} onChange={(v) => v[0] && changePlatform(v[0])} invalid={!!show('platform')} placeholder="Select" />
          <ErrorText>{show('platform')}</ErrorText>
        </div>
        <div>
          <FieldLabel required>OS Version</FieldLabel>
          <RuleSelect className="!rounded" value={osVer ? [osVer] : []} options={versionOptions} onChange={(v) => v[0] && changeVersion(v[0])} invalid={!!show('osVersion')} disabled={!platform} placeholder={!platform ? 'Choose an OS Platform first' : 'Select'} />
          <ErrorText>{show('osVersion')}</ErrorText>
        </div>
        <div className="col-span-2">
          <FieldLabel required>Benchmark</FieldLabel>
          <RuleSelect className="!rounded" searchable value={d.benchmarkId ? [d.benchmarkId] : []} options={benchOptions} onChange={(v) => v[0] && changeBenchmark(v[0])} invalid={!!show('benchmark')} placeholder={benchOptions.length ? 'Search or select a benchmark' : 'No benchmark for this OS yet'} />
          <ErrorText>{show('benchmark')}</ErrorText>
        </div>
      </div>
      {showConfig && (
        <div className="mt-4">
          <FieldLabel required>Config File Type</FieldLabel>
          <Pills value={(d.configType ?? 'running') as ConfigFileType} options={[{ value: 'startup', label: 'Startup' }, { value: 'running', label: 'Running' }]} onChange={(v) => set({ configType: v })} />
          <p className="mt-1.5 text-[12px] text-[#7B8FA5]">Startup checks the configuration the device boots with; Running checks what it is running now.</p>
        </div>
      )}
    </>
  );
  const targetsInvalid = !!show('targets');
  const targetsEl = (
    <div className="space-y-4">
      <TargetBox
        title="Remote Offices"
        count={d.offices.length}
        addLabel="Add Remote Offices"
        onAdd={() => setPickingOffices(true)}
        addReason={pickReason}
        invalid={targetsInvalid}
        emptyArt={<EmptyOfficesArt />}
        emptyText={pickReason ?? 'No remote offices yet — every endpoint in an office you add is assessed, including machines that join it later.'}
      >
        <table className="w-full min-w-[620px] table-fixed">
          <colgroup><col /><col className="w-[18%]" /><col className="w-[30%]" /><col className="w-[132px]" /></colgroup>
          <thead><tr className="border-b border-[#EEF1F4]">{['Remote Office', 'Endpoints', 'Agent Status', ''].map((h, i) => <th key={i} className={`whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658] ${i === 3 ? STICKY_END : ''}`}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {officeRows.filter((o) => d.offices.includes(o.id)).map((o) => (
              <tr key={o.id} className="group/row">
                <td className="px-4 py-2.5"><span className="flex min-w-0 items-center gap-2"><Building2 size={15} className="flex-shrink-0 text-[#7B8FA5]" /><span className="truncate text-[13px] text-[#364658]">{o.id}</span></span></td>
                <td className="px-4 py-2.5 text-[13px] tabular-nums text-[#64748B]">{o.total}</td>
                <td className="px-4 py-2.5"><AgentSplit online={o.online} offline={o.offline} /></td>
                <td className={`px-2 py-1.5 ${STICKY_END}`}>
                  <span className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setPreviewOffice(o.id)} className="inline-flex h-7 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"><Eye size={13} /> Preview</button>
                    <RemoveBtn onClick={() => set({ offices: d.offices.filter((x) => x !== o.id) })} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TargetBox>

      <TargetBox
        title="Endpoints"
        count={picked.length}
        addLabel="Add Endpoints"
        onAdd={() => setPicking(true)}
        addReason={pickReason}
        invalid={targetsInvalid}
        emptyArt={<EmptyEndpointsArt />}
        emptyText={pickReason ?? <>No endpoints added one by one — add the <span className="font-medium text-[#364658]">{benchmark?.osVersion}</span> endpoints this policy should assess, wherever they sit.</>}
      >
        <Paginated rows={picked} perPage={10}>
          {(rows) => (
            <table className="w-full min-w-[760px] table-fixed">
              <colgroup><col className="w-[30%]" /><col className="w-[15%]" /><col className="w-[22%]" /><col /><col className="w-[48px]" /></colgroup>
              <thead><tr className="border-b border-[#EEF1F4]">{['Endpoint', 'IP Address', 'Operating System', 'Remote Office', ''].map((h, i) => <th key={i} className={`whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658] ${i === 4 ? STICKY_END : ''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#EEF1F4]">
                {rows.map((e) => (
                  <tr key={e.id} className="group/row">
                    <td className="px-4 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`size-2 flex-shrink-0 rounded-full ${e.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} title={e.agentOnline ? 'Agent online' : 'Agent offline'} />
                        <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{e.id}</span>
                        <span className="truncate text-[13px] text-[#364658]">{e.hostName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] tabular-nums text-[#64748B]">{e.ip}</td>
                    <td className="px-4 py-2.5"><span className="block truncate text-[13px] text-[#64748B]">{e.osName}</span></td>
                    <td className="px-4 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[13px] text-[#64748B]">{e.office}</span>
                        {d.offices.includes(e.office) && (
                          <Tooltip>
                            <TooltipTrigger asChild><span className="flex-shrink-0 cursor-help rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">Office added</span></TooltipTrigger>
                            <TooltipContent className="text-wrap max-w-[240px]">{e.office} is in Remote Offices too, so this endpoint is already assessed through it — it is counted once.</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </td>
                    <td className={`px-2 py-1.5 text-right ${STICKY_END}`}><RemoveBtn onClick={() => set({ endpointIds: d.endpointIds.filter((x) => x !== e.id) })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Paginated>
      </TargetBox>

      {/* The one number that matters: what the policy will actually scan. */}
      {resolved.length > 0 ? (
        <p className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
          <Info size={13} className="flex-shrink-0 text-[#7B8FA5]" />
          <span><span className="font-semibold text-[#364658]">{resolved.length}</span> endpoint{resolved.length === 1 ? '' : 's'} will be assessed
            {resolved.some((e) => !e.agentOnline) && <span className="text-[#B45309]"> · {resolved.filter((e) => !e.agentOnline).length} offline, skipped until their agent reports in</span>}
          </span>
        </p>
      ) : (
        <ErrorText>{show('targets')}</ErrorText>
      )}
    </div>
  );
  const notifyEl = (
    <div className="grid grid-cols-2 gap-x-2">
      <div>
        <FieldLabel>Notify To</FieldLabel>
        {/* The admin workflow's recipient popup, in product styles (NotifyPicker) — Zeni, 17 Nov 2026. */}
        <NotifyPicker value={d.notify} onChange={(v) => set({ notify: v })} />
      </div>
      {/* Beside Notify To (Zeni, 12 Nov 2026) — the same list the Automatic Patch Deployment form offers. */}
      <div>
        <FieldLabel>Deployment Policy</FieldLabel>
        <RuleSelect className="!rounded" searchable value={d.deploymentPolicy ? [d.deploymentPolicy] : []} options={DEPLOYMENT_POLICIES_185.map((x) => ({ value: x, label: x }))} onChange={(v) => set({ deploymentPolicy: v[0] })} placeholder="Select" />
      </div>
    </div>
  );
  const scheduleEl = (
    <>
      <ScheduleFields value={d.schedule} onChange={(s) => set({ schedule: s })} half />
      <ErrorText>{show('schedule')}</ErrorText>
    </>
  );

  /* Each section: what is REQUIRED, what is optional (V4 hides it behind More options), and its read-back for V5. */
  interface Part { title: string; sub: string; req?: React.ReactNode; opt?: React.ReactNode; optNames?: string[]; all: React.ReactNode; lines: SummaryLine[]; keys: string[] }
  const parts: Part[] = [
    {
      title: 'Policy Details', sub: 'What the policy is called and what it is for.',
      req: nameEl, opt: descEl, optNames: ['Description'],
      /* Name across the whole form, the description as a text area under it (Zeni, 17 Nov 2026). */
      all: <div className="space-y-4">{nameEl}{descEl}</div>,
      lines: [...(d.name.trim() ? [{ label: 'Policy Name', value: d.name.trim() }] : []), ...(d.description.trim() ? [{ label: 'Description', value: d.description.trim() }] : [])],
      keys: ['name'],
    },
    {
      title: 'Benchmark', sub: 'Choose the ONE benchmark the policy assesses — narrow the list by OS Platform and OS Version. Its OS version decides which endpoints can be chosen.',
      req: benchmarkEl, all: benchmarkEl,
      lines: [...(platform ? [{ label: 'OS Platform', value: platform }] : []), ...(osVer ? [{ label: 'OS Version', value: osVer }] : []), ...(benchmark ? [{ label: 'Benchmark', value: benchmark.name }] : [])],
      keys: ['platform', 'osVersion', 'benchmark', 'config'],
    },
    {
      title: 'Target Endpoints', sub: 'Add whole remote offices, individual endpoints, or both. An endpoint picked both ways is assessed once.',
      req: targetsEl, all: targetsEl,
      lines: [...(d.offices.length ? [{ label: 'Remote Offices', value: `${d.offices.length} added` }] : []), ...(picked.length ? [{ label: 'Endpoints', value: `${picked.length} added` }] : []), ...(resolved.length ? [{ label: 'Assessed', value: `${resolved.length} endpoints` }] : [])],
      keys: ['targets'],
    },
    {
      title: 'Schedule & Notifications', sub: '', // no one-liner (Zeni, 15 Nov 2026)
      opt: <div className="space-y-6">{notifyEl}{scheduleEl}</div>, optNames: ['Notify To', 'Deployment Policy', 'Schedule'],
      all: <div className="space-y-6">{notifyEl}{scheduleEl}</div>,
      lines: [...(d.notify.length ? [{ label: 'Notify To', value: d.notify.length > 2 ? `${d.notify.slice(0, 2).join(', ')} +${d.notify.length - 2}` : d.notify.join(', ') }] : []), ...(d.deploymentPolicy ? [{ label: 'Deployment Policy', value: d.deploymentPolicy }] : []), ...(d.schedule.frequency !== 'none' ? [{ label: 'Schedule', value: scheduleLabel(d.schedule) }] : [])],
      keys: ['schedule'],
    },
  ];
  const partOf = (t: string) => parts.find((p) => p.title === t)!;

  const overlays = (
    <>
      {previewOffice && (
        <OfficePreviewDrawer office={previewOffice} rows={pool.filter((e) => e.office === previewOffice)} osVersion={benchmark?.osVersion} onClose={() => setPreviewOffice(null)} />
      )}
      <PickerDrawer<{ id: string; total: number; online: number; offline: number }>
        isOpen={pickingOffices}
        title="Select Remote Offices"
        subtitle={benchmark ? `Offices with endpoints running ${benchmark.osVersion} — machines that join them later are assessed too` : ''}
        rows={officeFilter.filtered}
        columns={[
          { header: 'Remote Office', cell: (o) => <span className="flex items-center gap-2"><Building2 size={15} className="flex-shrink-0 text-[#7B8FA5]" /><span className="whitespace-nowrap text-[13px] font-medium">{o.id}</span></span> },
          { header: 'Endpoints', cell: (o) => <span className="tabular-nums">{o.total}</span> },
          { header: 'Agent Status', cell: (o) => <AgentSplit online={o.online} offline={o.offline} /> },
        ]}
        selected={d.offices}
        searchOf={(o) => o.id}
        searchSlot={<ColumnFilterSearch className="w-full" rows={officeRows} fields={OFFICE_FIELDS} query={officeFilter.query} onQuery={officeFilter.setQuery} conditions={officeFilter.conditions} onConditions={officeFilter.setConditions} />}
        onClose={() => { setPickingOffices(false); officeFilter.reset(); }}
        onApply={(ids) => { set({ offices: ids }); setPickingOffices(false); officeFilter.reset(); }}
      />
      <PickerDrawer<ComplianceEndpoint>
        isOpen={picking}
        title="Select Endpoints"
        subtitle={benchmark ? `Endpoints running ${benchmark.osVersion}` : ''}
        rows={pickRows}
        columns={columns}
        selected={d.endpointIds}
        searchOf={(e) => [e.id, e.hostName, e.ip, e.osName, e.office].join(' ')}
        searchSlot={<ColumnFilterSearch className="w-full" rows={pool} fields={EP_FIELDS} query={epFilter.query} onQuery={epFilter.setQuery} conditions={epFilter.conditions} onConditions={epFilter.setConditions} />}
        onClose={() => { setPicking(false); epFilter.reset(); }}
        onApply={(ids) => { set({ endpointIds: ids }); setPicking(false); epFilter.reset(); }}
      />
    </>
  );
  const guide = (bare?: boolean, onOpen?: (titles: string[]) => void) => (
    <CreateFormHelp moduleId="compliance-policy" bare={bare} available={parts.map((p) => p.title)} onOpen={onOpen} />
  );

  /* V2 / V3 — one step at a time. */
  if (ui === 'v2' || ui === 'v3') {
    const cur = Math.min(step, stepDefs.length - 1);
    const st = stepDefs[cur];
    const items: StepItem[] = stepDefs.map((x, i) => ({
      title: x.title, sub: x.sub,
      state: stepErrs[i].length && (tried === 'publish' || checked.includes(i)) ? 'error' : !stepErrs[i].length && (i < cur || checked.includes(i)) ? 'done' : 'todo',
    }));
    /* Edit and Clone open as a proper full page in both layouts (Zeni, 17 Nov 2026) — the side
       drawer over a detail page left that page showing around it. */
    const full = mode !== 'create';
    const Shell = ui === 'v3' && !full ? SteppedDrawerShell : SteppedPageShell;
    return (
      /* Two CTAs, not a split button (Zeni, 17 Nov 2026): Publish / Update primary, Save as Draft outlined beside it. */
      <Shell title={title} onBack={onClose} error={headerError} overlays={overlays} {...(full ? { fullScreen: true } : {})}
        final={split[0]} secondary={split[1]} secondaryBeside
        steps={items} current={cur} onStep={setStep}
        onNext={() => { setChecked((x) => (x.includes(cur) ? x : [...x, cur])); if (!stepErrs[cur].length) setStep(cur + 1); }}
        help={guide(ui === 'v3', (titles) => { const i = stepDefs.findIndex((x) => x.sections.some((t) => titles.includes(t))); if (i >= 0) setStep(i); })}>
        <div className="space-y-8">
          {st.sections.map((t) => (
            /* Section header = its name only, no one-liner (Zeni, 17 Nov 2026). */
            <Section key={t} title={st.sections.length > 1 ? t : st.title} marker={t}>{partOf(t).all}</Section>
          ))}
        </div>
      </Shell>
    );
  }

  /* V4 — essentials first: each part shows what is required; the rest waits behind "More options";
     a part with nothing required is a "+ Add" chip at the foot. A part with an error is opened. */
  if (ui === 'v4') {
    const core = parts.filter((p) => p.req);
    const extra = parts.filter((p) => !p.req);
    return (
      <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} split={split} overlays={overlays} fullScreen={mode !== 'create'}
        aside={guide(false, (titles) => titles.forEach((t) => { if (extra.some((p) => p.title === t) && !moreOpen.includes(t)) toggleMore(t); }))}>
        <p className="!mb-6 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><Info size={13} className="flex-shrink-0" />Only what is needed is shown. Everything else is one click away under each part.</p>
        {core.map((p) => {
          const open = moreOpen.includes(p.title);
          return (
            <Section key={p.title} title={p.title} sub={p.sub}>
              {p.req}
              {p.opt && (open ? (
                <div className="mt-4 rounded-lg bg-[#F7F9FC] p-3">
                  <div className="mb-3 flex items-center">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">More options</span>
                    <button type="button" onClick={() => toggleMore(p.title)} className="ml-auto text-[12px] font-medium text-[#3D8BD0] hover:underline">Hide</button>
                  </div>
                  {p.opt}
                </div>
              ) : (
                <button type="button" onClick={() => toggleMore(p.title)} className="mt-3 flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] text-[#3D8BD0] hover:bg-[#EBF5FF]">
                  <ChevronDown size={14} className="flex-shrink-0" />
                  <span className="flex-shrink-0 font-medium">More options ({p.optNames!.length})</span>
                  <span className="truncate text-[#7B8FA5]">· {p.optNames!.join(', ')}</span>
                </button>
              ))}
            </Section>
          );
        })}
        {extra.filter((p) => moreOpen.includes(p.title) || p.keys.some((k) => show(k))).map((p) => (
          <section key={p.title} data-section-title={p.title}>
            <div className="mb-4 flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold text-[#364658]">{p.title} <span className="text-[12px] font-normal text-[#94A3B8]">· Optional</span></h2>
                <p className="mt-px text-[12px] text-[#7B8FA5]">{p.sub}</p>
              </div>
              <button type="button" title="Hide" onClick={() => toggleMore(p.title)} className="flex size-7 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#F3F4F6]"><X size={14} /></button>
            </div>
            {p.opt}
          </section>
        ))}
        {extra.some((p) => !moreOpen.includes(p.title) && !p.keys.some((k) => show(k))) && (
          <section>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Optional — add only if you need it</p>
            <div className="flex flex-wrap gap-2">
              {extra.filter((p) => !moreOpen.includes(p.title)).map((p) => (
                <button key={p.title} type="button" onClick={() => toggleMore(p.title)} title={p.sub}
                  className="flex h-8 items-center gap-1.5 rounded border border-dashed border-[#CBD5E1] px-3 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
                  <Plus size={13} />{p.title}
                </button>
              ))}
            </div>
          </section>
        )}
      </CreatePageShell>
    );
  }

  /* V5 — every part open and numbered; the guide on the right holds the CTA. */
  if (ui === 'v5') {
    const summary: SummaryGroup[] = parts.map((p) => ({
      title: p.title, lines: p.lines,
      missing: p.keys.filter((k) => errs[k]).map((k) => errs[k]),
      optional: !p.req,
    }));
    const jump = (i: number) => document.getElementById(`cp-group-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return (
      <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} overlays={overlays} fullScreen={mode !== 'create'}
        aside={<SummaryAside groups={summary} onJump={jump} cta="Publish" onCreate={() => save('publish')} split={split} guide={guide(true)} noun="Compliance Policy" />}>
        {parts.map((p, i) => (
          <section key={p.title} id={`cp-group-${i}`} data-section-title={p.title} className="scroll-mt-4">
            <div className="mb-4 flex items-start gap-2.5">
              <span className="mt-px flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[11.5px] font-semibold tabular-nums text-[#64748B]">{i + 1}</span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[#364658]">{p.title}{!p.req && <span className="text-[12px] font-normal text-[#94A3B8]"> · Optional</span>}</h2>
                <p className="mt-px text-[12px] text-[#7B8FA5]">{p.sub}</p>
              </div>
            </div>
            <div className="pl-[34px]">{p.all}</div>
          </section>
        ))}
      </CreatePageShell>
    );
  }

  /* V1 — the full page, every section, the guide pinned right. */
  return (
    <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} split={split} overlays={overlays} aside={guide()} fullScreen={mode !== 'create'}>
      {parts.map((p) => <Section key={p.title} title={p.title} sub={p.sub}>{p.all}</Section>)}
    </CreatePageShell>
  );
}
