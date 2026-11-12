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
import { setExtraCreateOpen, useCreateFormUi } from './createFormUi';
import { BENCHMARKS_SEED, COMPLIANCE_TYPES, benchmarkRuleIds, profileLabel } from './complianceData';
import type { ComplianceType } from './complianceData';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';
import { DEPLOYMENT_POLICIES_185 } from './data185';
import {
  benchmarkOf, deviceTagsOf, endpointsForBenchmark, fmtStamp, getPolicy, needsConfigType, nextRun, officesOf, openPolicyEditor,
  policyStore, resolvedEndpoints, scheduleLabel, usePolicyEditor, WEEKDAYS,
} from './compliancePolicyData';
import type { ComplianceEndpoint, CompliancePolicy, ConfigFileType, DeviceAxis, Frequency, PolicySchedule } from './compliancePolicyData';

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
const FREQS: { value: Frequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
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
    <div>
      {/* One switch: on = scheduled, off = it runs only by hand (the line below says so). */}
      {/* "Schedule" on the left, its switch at the row's right edge. */}
      <label className={'flex cursor-pointer items-center justify-between gap-3 ' + (half ? 'w-[calc(50%-4px)]' : 'w-full')}>
        <span className="text-[13px] font-medium text-[#364658]">Schedule</span>
        <ToggleSwitch
          on={f !== 'none'}
          onChange={(on) => onChange(!on ? { frequency: 'none' } : {
            frequency: 'daily',
            startDate: value.startDate ?? new Date().toISOString().slice(0, 10),
            time: value.time ?? '02:00',
            weekday: value.weekday ?? 0,
            monthday: value.monthday ?? 1,
          })}
          title={f !== 'none' ? 'Turn off the schedule' : 'Schedule this policy'}
        />
      </label>
      {f === 'none' && (
        /* The icon sits on the FIRST line of the sentence, however many lines it wraps to. */
        <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-[18px] text-[#64748B]">
          <Info size={13} className="mt-[2.5px] flex-shrink-0 text-[#7B8FA5]" />
          This policy runs only when someone presses Run Now — on the policy page or from its row in the listing.
        </p>
      )}
      {f !== 'none' && (
        <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4">
          {/* Row 1: how often (a dropdown) and, for weekly / monthly, which day.
              Row 2: from when, at what time. */}
          <div>
            <FieldLabel required>Frequency</FieldLabel>
            <RuleSelect className="!rounded" value={[f]} options={FREQS.filter((o) => o.value !== 'none')} onChange={(v) => v[0] && onChange({ ...value, frequency: v[0] as Frequency })} />
          </div>
          {f === 'weekly' && (
            <div>
              <FieldLabel required>Day of Week</FieldLabel>
              <RuleSelect className="!rounded" value={[String(value.weekday ?? 0)]} options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))} onChange={(v) => set({ weekday: Number(v[0]) })} />
            </div>
          )}
          {f === 'monthly' && (
            <div>
              <FieldLabel required>Day of Month</FieldLabel>
              <RuleSelect className="!rounded" value={[String(value.monthday ?? 1)]} options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} onChange={(v) => set({ monthday: Number(v[0]) })} />
            </div>
          )}
          {(f === 'once' || f === 'daily') && <div />}
          <div>
            <FieldLabel required>{f === 'once' ? 'Run On' : 'Start Date'}</FieldLabel>
            <input type="date" value={value.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <FieldLabel required>Time</FieldLabel>
            <input type="time" value={value.time ?? ''} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
          </div>
        </div>
      )}
      {f !== 'none' && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#64748B]">
          <CalendarClock size={13} className="text-[#7B8FA5]" />
          {scheduleLabel(value)} · next scan <span className="font-medium text-[#364658]">{next ? fmtStamp(next) : '—'}</span>
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
  name: '', description: '', benchmarkId: BENCHMARKS_SEED[0]?.id ?? '', configType: null, axis: 'endpoint',
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
  /* OS Type comes first and decides which benchmarks are offered. It is not stored on the
     policy — the chosen benchmark already carries it — so it opens on that benchmark's type. */
  const [osType, setOsType] = useState<ComplianceType | ''>(() => benchmarkOf(source?.benchmarkId ?? blank().benchmarkId)?.type ?? '');
  const [picking, setPicking] = useState(false);
  const [pickingOffices, setPickingOffices] = useState(false);
  const [previewOffice, setPreviewOffice] = useState<string | null>(null);
  const [tried, setTried] = useState<null | 'publish' | 'draft'>(null);

  const benchmark = benchmarkOf(d.benchmarkId);
  const showConfig = needsConfigType(benchmark);
  const pool = useMemo(() => endpointsForBenchmark(benchmark), [benchmark]);
  const resolved = useMemo(() => resolvedEndpoints(d), [d]);

  const osTypeOptions = COMPLIANCE_TYPES.map((t) => ({ value: t, label: t }));
  /* Many benchmarks per type, so the menu searches and groups them under their OS version. */
  const benchOptions = useMemo(() => BENCHMARKS_SEED
    .filter((b) => b.type === osType)
    .sort((a, b) => a.osVersion.localeCompare(b.osVersion) || a.name.localeCompare(b.name))
    .map((b) => ({ value: b.id, label: b.name })), [osType]);

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
    set({ benchmarkId: id, endpointIds: [], offices: [], deviceTags: [], configType: needsConfigType(b) ? (d.configType ?? 'running') : null });
  };

  /* A different OS Type means none of the old type's benchmarks apply, so the benchmark and the
     endpoints chosen for it are cleared — the same rule changing the benchmark itself follows. */
  const changeOsType = (t: ComplianceType) => {
    if (t === osType) return;
    setOsType(t);
    const b = benchmarkOf(d.benchmarkId);
    if (b && b.type === t) return;
    const had = d.endpointIds.length + d.offices.length + d.deviceTags.length;
    if (had) toast('The benchmark and endpoint selection were cleared — they were for a different OS Type');
    set({ benchmarkId: '', endpointIds: [], offices: [], deviceTags: [], configType: null });
  };

  /* ── Validation, keyed by field so every layout can say which part is missing. ── */
  const errs: Record<string, string> = {};
  if (!d.name.trim()) errs.name = 'Enter a name';
  if (!osType) errs.osType = 'Choose an OS Type';
  else if (!d.benchmarkId) errs.benchmark = 'Choose a benchmark';
  if (showConfig && !d.configType) errs.config = 'Choose a Config File Type';
  if (benchmark && resolved.length === 0) errs.targets = 'Add a remote office or an endpoint';
  if (scheduleIncomplete) errs.schedule = 'Complete the schedule — a start date and a time';
  /** Which form section each problem sits in. */
  const SEC_OF: Record<string, string> = { name: 'Policy Details', osType: 'Benchmark', benchmark: 'Benchmark', config: 'Benchmark', targets: 'Target Endpoints', schedule: 'Schedule & Notifications' };

  /* ── Layout (V1–V5, the header's switch — createFormUi.ts) ── */
  const ui = useCreateFormUi();
  useEffect(() => { setExtraCreateOpen('compliance-policy'); return () => setExtraCreateOpen(null); }, []);
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
        ? `“${d.name.trim()}” published`
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

  const title = mode === 'edit' ? 'Edit Compliance Policy' : mode === 'clone' ? 'Clone Compliance Policy' : 'Create Compliance Policy';
  const pickReason = !benchmark ? 'Choose a benchmark first — only endpoints it is written for can be assessed' : pool.length === 0 ? `No endpoint runs ${benchmark.osVersion} yet` : undefined;
  /** Publish ▾ Save as Draft — one primary CTA with a dropdown (Zeni, 12 Nov 2026). */
  const split = [{ label: 'Publish', onClick: () => save('publish') }, { label: 'Save as Draft', onClick: () => save('draft') }];

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
      <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Write a description" rows={1} className={`${inputCls} resize-y py-2 leading-[18px]`} />
    </div>
  );
  const benchmarkEl = (
    <>
      <div className="grid grid-cols-2 gap-x-2 gap-y-4">
        <div>
          <FieldLabel required>OS Type</FieldLabel>
          <RuleSelect className="!rounded" value={osType ? [osType] : []} options={osTypeOptions} onChange={(v) => v[0] && changeOsType(v[0] as ComplianceType)} invalid={!!show('osType')} placeholder="Select" />
          <ErrorText>{show('osType')}</ErrorText>
        </div>
        <div>
          <FieldLabel required>Benchmark</FieldLabel>
          <RuleSelect className="!rounded" searchable value={d.benchmarkId ? [d.benchmarkId] : []} options={benchOptions} onChange={(v) => v[0] && changeBenchmark(v[0])} invalid={!!show('benchmark')} disabled={!osType} placeholder={!osType ? 'Choose an OS Type first' : benchOptions.length ? 'Select' : `No ${osType} benchmark yet`} />
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
          <thead><tr className="border-b border-[#EEF1F4]">{['Remote Office', 'Endpoints', 'Agent Status', ''].map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {officeRows.filter((o) => d.offices.includes(o.id)).map((o) => (
              <tr key={o.id} className="group/row">
                <td className="px-4 py-2.5"><span className="flex min-w-0 items-center gap-2"><Building2 size={15} className="flex-shrink-0 text-[#7B8FA5]" /><span className="truncate text-[13px] text-[#364658]">{o.id}</span></span></td>
                <td className="px-4 py-2.5 text-[13px] tabular-nums text-[#64748B]">{o.total}</td>
                <td className="px-4 py-2.5"><AgentSplit online={o.online} offline={o.offline} /></td>
                <td className="px-2 py-1.5">
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
              <thead><tr className="border-b border-[#EEF1F4]">{['Endpoint', 'IP Address', 'Operating System', 'Remote Office', ''].map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
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
                    <td className="px-2 py-1.5 text-right"><RemoveBtn onClick={() => set({ endpointIds: d.endpointIds.filter((x) => x !== e.id) })} /></td>
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
        <FieldLabel>Notify Team</FieldLabel>
        <RuleSelect className="!rounded" multi value={d.notify} options={NOTIFY_OPTIONS} onChange={(v) => set({ notify: v })} placeholder="Technicians or groups" />
      </div>
      {/* Beside Notify Team (Zeni, 12 Nov 2026) — the same list the Automatic Patch Deployment form offers. */}
      <div>
        <FieldLabel>Deployment Policy</FieldLabel>
        <RuleSelect className="!rounded" value={d.deploymentPolicy ? [d.deploymentPolicy] : []} options={DEPLOYMENT_POLICIES_185.map((x) => ({ value: x, label: x }))} onChange={(v) => set({ deploymentPolicy: v[0] })} placeholder="Select" />
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
      all: <div className="grid grid-cols-2 gap-x-2 gap-y-4">{nameEl}{descEl}</div>,
      lines: [...(d.name.trim() ? [{ label: 'Policy Name', value: d.name.trim() }] : []), ...(d.description.trim() ? [{ label: 'Description', value: d.description.trim() }] : [])],
      keys: ['name'],
    },
    {
      title: 'Benchmark', sub: 'Choose the OS Type, then the ONE benchmark the policy assesses. Its OS version decides which endpoints can be chosen.',
      req: benchmarkEl, all: benchmarkEl,
      lines: [...(osType ? [{ label: 'OS Type', value: osType }] : []), ...(benchmark ? [{ label: 'Benchmark', value: benchmark.name }] : [])],
      keys: ['osType', 'benchmark', 'config'],
    },
    {
      title: 'Target Endpoints', sub: 'Add whole remote offices, individual endpoints, or both. An endpoint picked both ways is assessed once.',
      req: targetsEl, all: targetsEl,
      lines: [...(d.offices.length ? [{ label: 'Remote Offices', value: `${d.offices.length} added` }] : []), ...(picked.length ? [{ label: 'Endpoints', value: `${picked.length} added` }] : []), ...(resolved.length ? [{ label: 'Assessed', value: `${resolved.length} endpoints` }] : [])],
      keys: ['targets'],
    },
    {
      title: 'Schedule & Notifications', sub: 'When the policy scans on its own, and who hears about the result.',
      opt: <div className="space-y-4">{notifyEl}{scheduleEl}</div>, optNames: ['Notify Team', 'Deployment Policy', 'Schedule'],
      all: <div className="space-y-4">{notifyEl}{scheduleEl}</div>,
      lines: [...(d.notify.length ? [{ label: 'Notify Team', value: d.notify.length > 2 ? `${d.notify.slice(0, 2).join(', ')} +${d.notify.length - 2}` : d.notify.join(', ') }] : []), ...(d.deploymentPolicy ? [{ label: 'Deployment Policy', value: d.deploymentPolicy }] : []), ...(d.schedule.frequency !== 'none' ? [{ label: 'Schedule', value: scheduleLabel(d.schedule) }] : [])],
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
    const Shell = ui === 'v3' ? SteppedDrawerShell : SteppedPageShell;
    return (
      <Shell title={title} onBack={onClose} error={headerError} overlays={overlays}
        final={split[0]} split={split}
        steps={items} current={cur} onStep={setStep}
        onNext={() => { setChecked((x) => (x.includes(cur) ? x : [...x, cur])); if (!stepErrs[cur].length) setStep(cur + 1); }}
        help={guide(ui === 'v3', (titles) => { const i = stepDefs.findIndex((x) => x.sections.some((t) => titles.includes(t))); if (i >= 0) setStep(i); })}>
        <div className="space-y-8">
          {st.sections.map((t) => (
            <Section key={t} title={st.sections.length > 1 ? t : st.title} sub={st.sections.length > 1 ? partOf(t).sub : st.sub} marker={t}>{partOf(t).all}</Section>
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
      <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} split={split} overlays={overlays}
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
      <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} overlays={overlays}
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
    <CreatePageShell title={title} onBack={onClose} error={headerError} actions={[]} split={split} overlays={overlays} aside={guide()}>
      {parts.map((p) => <Section key={p.title} title={p.title} sub={p.sub}>{p.all}</Section>)}
    </CreatePageShell>
  );
}
