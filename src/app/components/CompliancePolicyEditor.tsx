import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Building2, CalendarClock, Info, Monitor, Plus, Wifi, X } from 'lucide-react';
import { ErrorText, FieldLabel, RuleSelect, inputCls as formInputCls } from './FormRuleControls';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { matchRules, optionsOf, selectAttr } from './ComplianceShared';
import type { SelectOption } from './FormRuleControls';
import { PickerDrawer } from './CreatePatchDeployment';
import type { PickerColumn } from './CreatePatchDeployment';
import { TagCell } from './ComplianceShared';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BENCHMARKS_SEED, COMPLIANCE_TYPES, benchmarkRuleIds, profileLabel } from './complianceData';
import type { ComplianceType } from './complianceData';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';
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

/** The product's segmented control — a pill on a track, the chosen option lifted out in white. */
function Pills<T extends string>({ value, options, onChange, disabled }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={`pill-track ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** A section of the form: its name and one line, then its fields. No icon and no divider —
 *  the gap between sections (space-y-10 on the column) is what separates them. */
function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[#364658]">{title}</h2>
        <p className="mt-px text-[12px] text-[#7B8FA5]">{sub}</p>
      </div>
      {children}
    </section>
  );
}

/** "No endpoints yet": a monitor with an empty, dashed screen and a magnifier that found
 *  nothing — the policy has nothing to assess until endpoints are added. */
function EmptyEndpointsArt() {
  return (
    <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="74" cy="56" rx="64" ry="42" fill="#F3F7FC" />
      <rect x="22" y="22" width="52" height="36" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      <path d="M40 64 H56 M48 58 V64" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="44" y="30" width="62" height="44" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="50" y="36" width="50" height="30" rx="2.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <path d="M66 81 H84 M75 74 V81" stroke="#CBD5E1" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="56" y="44" width="20" height="2.4" rx="1.2" fill="#E2E8F0" />
      <rect x="56" y="50" width="30" height="2.4" rx="1.2" fill="#EEF2F6" />
      <circle cx="108" cy="62" r="13" fill="#FFFFFF" stroke="#3D8BD0" strokeWidth="2.25" />
      <path d="M117.5 71.5 L126 80" stroke="#3D8BD0" strokeWidth="3" strokeLinecap="round" />
      <path d="M103.5 57.5 L112.5 66.5 M112.5 57.5 L103.5 66.5" stroke="#9DC3E8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Schedule — shared by the form and the row's Schedule shortcut ───────────────────── */

export function ScheduleFields({ value, onChange }: { value: PolicySchedule; onChange: (s: PolicySchedule) => void }) {
  const f = value.frequency;
  const set = (patch: Partial<PolicySchedule>) => onChange({ ...value, ...patch });
  const next = nextRun(value);
  return (
    <div>
      <FieldLabel>Run</FieldLabel>
      {/* Manual or on a schedule first; only a schedule has anything more to set. */}
      <Pills
        value={f === 'none' ? 'manual' : 'scheduled'}
        options={[{ value: 'manual', label: 'Manual' }, { value: 'scheduled', label: 'Scheduled' }]}
        onChange={(v) => onChange(v === 'manual' ? { frequency: 'none' } : {
          frequency: 'daily',
          startDate: value.startDate ?? new Date().toISOString().slice(0, 10),
          time: value.time ?? '02:00',
          weekday: value.weekday ?? 0,
          monthday: value.monthday ?? 1,
        })}
      />
      {f === 'none' && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#64748B]">
          <Info size={13} className="flex-shrink-0 text-[#7B8FA5]" />
          This policy runs only when someone presses Run Now — on the policy page or from its row in the listing.
        </p>
      )}
      {f !== 'none' && (
        <div className="mt-4">
          <FieldLabel>Frequency</FieldLabel>
          <Pills
            value={f}
            options={FREQS.filter((o) => o.value !== 'none')}
            onChange={(v) => onChange({ ...value, frequency: v })}
          />
        </div>
      )}
      {f !== 'none' && (
        <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4">
          <div>
            <FieldLabel required>{f === 'once' ? 'Run On' : 'Start Date'}</FieldLabel>
            <input type="date" value={value.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <FieldLabel required>Time</FieldLabel>
            <input type="time" value={value.time ?? ''} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
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
  const [tried, setTried] = useState(false);

  const benchmark = benchmarkOf(d.benchmarkId);
  const showConfig = needsConfigType(benchmark);
  const pool = useMemo(() => endpointsForBenchmark(benchmark), [benchmark]);
  const resolved = useMemo(() => resolvedEndpoints(d), [d]);

  const osTypeOptions = COMPLIANCE_TYPES.map((t) => ({ value: t, label: t }));
  /* Many benchmarks per type, so the menu searches and groups them under their OS version. */
  const benchOptions = useMemo(() => BENCHMARKS_SEED
    .filter((b) => b.type === osType)
    .sort((a, b) => a.osVersion.localeCompare(b.osVersion) || a.name.localeCompare(b.name))
    .map((b) => ({ value: b.id, label: b.name, hint: `${profileLabel(b.profile)} · ${b.origin}`, group: b.osVersion })), [osType]);

  /* The endpoint picker's filters — the same filter bar the Attach Rules picker uses. */
  const [pickRules, setPickRules] = useState<FilterRule[]>([]);
  const pickAttrs = useMemo(() => [
    selectAttr('office', 'Remote Office', Building2, optionsOf(pool, (e) => e.office).map(({ label }) => ({ label }))),
    selectAttr('agent', 'Agent Status', Wifi, [{ label: 'Online', color: '#22C55E' }, { label: 'Offline', color: '#F59E0B' }]),
    selectAttr('os', 'Operating System', Monitor, optionsOf(pool, (e) => e.osName).map(({ label }) => ({ label }))),
  ], [pool]);
  const pickQuick = useMemo<QuickFilterDef[]>(() => [
    { field: 'office', icon: Building2, tip: 'Filter by remote office', title: 'Remote Office is', width: 220, row: 'plain', options: pickAttrs[0].options! },
    { field: 'agent', icon: Wifi, tip: 'Filter by agent status', title: 'Agent Status is', width: 180, row: 'dot', options: pickAttrs[1].options! },
    { field: 'os', icon: Monitor, tip: 'Filter by operating system', title: 'Operating System is', width: 240, row: 'plain', options: pickAttrs[2].options! },
  ], [pickAttrs]);
  const pickRows = useMemo(() => matchRules(pool, pickRules, (e, k) => (k === 'office' ? e.office : k === 'agent' ? (e.agentOnline ? 'Online' : 'Offline') : k === 'os' ? e.osName : '')), [pool, pickRules]);

  const officeOptions = officesOf(pool).map((o) => ({ value: o, label: `${o} (${pool.filter((e) => e.office === o).length})` }));

  const scheduleIncomplete = d.schedule.frequency !== 'none' && (!d.schedule.startDate || !d.schedule.time);
  const reason =
    !d.name.trim() ? 'The policy needs a name'
      : !osType ? 'Choose an OS Type'
      : !d.benchmarkId ? 'Choose the benchmark it assesses'
        : showConfig && !d.configType ? 'Choose a Config File Type'
          : resolved.length === 0 ? 'Choose at least one endpoint to assess'
            : scheduleIncomplete ? 'Complete the schedule — a start date and a time'
              : '';

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

  const save = () => {
    setTried(true);
    if (reason) return;
    const id = policyStore.save({ ...d, name: d.name.trim(), description: d.description.trim(), configType: showConfig ? d.configType : null, id: mode === 'edit' ? sourceId : undefined });
    toast.success(mode === 'edit'
      ? `“${d.name.trim()}” updated`
      : `“${d.name.trim()}” created — it assesses ${resolved.length} endpoint${resolved.length === 1 ? '' : 's'} against ${benchmark!.name}`);
    onClose();
    return id;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.key === 'Escape' && !picking && !document.querySelector('[data-rule-menu]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const title = mode === 'edit' ? 'Edit Compliance Policy' : mode === 'clone' ? 'Clone Compliance Policy' : 'Create Compliance Policy';
  const pickReason = !benchmark ? 'Choose a benchmark first — only endpoints it is written for can be assessed' : pool.length === 0 ? `No endpoint runs ${benchmark.osVersion} yet` : undefined;

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

  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#DFE5ED] px-4 py-3">
        <button type="button" onClick={onClose} title="Back" className="-ml-1.5 flex size-[30px] flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={16} />
        </button>
        <h1 className="truncate text-[16px] font-medium text-[#364658]">{title}</h1>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          {tried && reason && <span className="text-[12px] text-[#F25C4E]">{reason}</span>}
          <button type="button" onClick={onClose} className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          <button type="button" onClick={save} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">{mode === 'edit' ? 'Update Policy' : 'Create Policy'}</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[840px] space-y-10 px-4 py-6">
          <Section title="Policy Details" sub="What the policy is called and what it is for.">
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
              <div>
                <FieldLabel required>Policy Name</FieldLabel>
                <input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Must be unique" className={`${inputCls} ${tried && !d.name.trim() ? '!border-[#F25C4E]' : ''}`} />
                <ErrorText>{tried && !d.name.trim() ? 'Enter a name' : ''}</ErrorText>
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Write a description" rows={1} className={`${inputCls} resize-y py-2 leading-[18px]`} />
              </div>
            </div>
          </Section>

          <Section title="Benchmark" sub="Choose the OS Type, then the ONE benchmark the policy assesses. Its OS version decides which endpoints can be chosen.">
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
              <div>
                <FieldLabel required>OS Type</FieldLabel>
                <RuleSelect className="!rounded" value={osType ? [osType] : []} options={osTypeOptions} onChange={(v) => v[0] && changeOsType(v[0] as ComplianceType)} invalid={tried && !osType} placeholder="Select" />
                <ErrorText>{tried && !osType ? 'Choose an OS Type' : ''}</ErrorText>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <FieldLabel required>Benchmark</FieldLabel>
                  {/* The chosen benchmark's facts live behind this icon, not in a strip under the
                      field — they describe the choice, they are not part of the form. */}
                  {benchmark && (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <span className="-mt-1 inline-grid cursor-help place-items-center text-[#9CA3AF] hover:text-[#3D8BD0]" aria-label="Benchmark details"><Info size={13} /></span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="w-[240px] text-wrap p-3">
                        <div className="mb-2 text-[12px] font-semibold leading-snug">{benchmark.name}</div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                          {[
                            ['Type', benchmark.type],
                            ['Version', benchmark.osVersion],
                            ['Profile', profileLabel(benchmark.profile)],
                            ['Origin', benchmark.origin],
                            ['Rules', String(benchmarkRuleIds(benchmark).length)],
                            ['Endpoints', String(pool.length)],
                          ].map(([k, v]) => (
                            <div key={k} className="contents"><dt className="text-white/60">{k}</dt><dd className="font-medium">{v}</dd></div>
                          ))}
                        </dl>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <RuleSelect className="!rounded" searchable value={d.benchmarkId ? [d.benchmarkId] : []} options={benchOptions} onChange={(v) => v[0] && changeBenchmark(v[0])} invalid={tried && !!osType && !d.benchmarkId} disabled={!osType} placeholder={!osType ? 'Choose an OS Type first' : benchOptions.length ? 'Select' : `No ${osType} benchmark yet`} />
                <ErrorText>{tried && osType && !d.benchmarkId ? 'Choose a benchmark' : ''}</ErrorText>
              </div>
            </div>
            {showConfig && (
              <div className="mt-4">
                <FieldLabel required>Config File Type</FieldLabel>
                <Pills value={(d.configType ?? 'running') as ConfigFileType} options={[{ value: 'startup', label: 'Startup' }, { value: 'running', label: 'Running' }]} onChange={(v) => set({ configType: v })} />
                <p className="mt-1.5 text-[12px] text-[#7B8FA5]">Startup checks the configuration the device boots with; Running checks what it is running now.</p>
              </div>
            )}
          </Section>

          <Section title="Endpoints" sub="Which endpoints the policy assesses — whole remote offices (new machines there join on their own), endpoints added one by one, or both.">
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
              <div>
                <FieldLabel>Remote Offices</FieldLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <RuleSelect
                        className="!rounded"
                        multi
                        disabled={!!pickReason}
                        value={d.offices}
                        options={officeOptions}
                        onChange={(v) => set({ offices: v })}
                        placeholder="Select remote offices"
                        invalid={tried && resolved.length === 0}
                      />
                    </div>
                  </TooltipTrigger>
                  {pickReason && <TooltipContent className="text-wrap max-w-[260px]">{pickReason}</TooltipContent>}
                </Tooltip>
                <ErrorText>{tried && benchmark && resolved.length === 0 ? 'Choose a remote office or add an endpoint' : ''}</ErrorText>
              </div>
            </div>

            {/* What will actually be assessed, whichever axis chose it. */}
            <div className={`mt-4 rounded-lg border ${tried && resolved.length === 0 ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
              <div className="flex min-h-[48px] items-center gap-3 border-b border-[#EEF1F4] bg-[#F6F9FC] px-4 py-2">
                <span className="text-[13px] font-semibold text-[#364658]">Endpoints to assess <span className="ml-1 rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{resolved.length}</span></span>
                {resolved.some((e) => !e.agentOnline) && (
                  <span className="text-[12px] text-[#B45309]">{resolved.filter((e) => !e.agentOnline).length} offline — skipped until their agent reports in</span>
                )}
                {/* Once some are added, the CTA moves up here so more can be added. */}
                {resolved.length > 0 && (
                  <button type="button" onClick={() => setPicking(true)} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"><Plus size={14} /> Add Endpoints</button>
                )}
              </div>
              {resolved.length === 0 ? (
                <div className="flex flex-col items-center px-4 pb-7 pt-5 text-center">
                  <EmptyEndpointsArt />
                  <p className="mt-3 max-w-[600px] text-[13px] leading-[1.55] text-[#64748B]">
                    {pickReason
                      ? pickReason
                      : <>No endpoints yet — choose remote offices above, or add the <span className="font-medium text-[#364658]">{benchmark!.osVersion}</span> endpoints this policy should assess one by one.</>}
                  </p>
                  {(
                    <button
                      type="button"
                      disabled={!!pickReason}
                      onClick={() => setPicking(true)}
                      className="mt-4 inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50"
                    ><Plus size={14} /> Add Endpoints</button>
                  )}
                </div>
              ) : (
                <table className="w-full table-fixed">
                  <colgroup><col className="w-[22%]" /><col className="w-[14%]" /><col className="w-[20%]" /><col /><col className="w-[124px]" /><col className="w-[48px]" /></colgroup>
                  <thead><tr className="border-b border-[#EEF1F4]">{['Host Name', 'IP Address', 'Operating System', 'Remote Office', 'Added By', ''].map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#EEF1F4]">
                    {resolved.slice(0, 8).map((e) => (
                      <tr key={e.id} className="group/row">
                        <td className="px-4 py-2.5"><span className="flex min-w-0 items-center gap-2"><span className={`size-2 flex-shrink-0 rounded-full ${e.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} /><span className="truncate text-[13px] text-[#364658]">{e.hostName}</span></span></td>
                        <td className="px-4 py-2.5 text-[13px] tabular-nums text-[#64748B]">{e.ip}</td>
                        <td className="px-4 py-2.5"><span className="block truncate text-[13px] text-[#64748B]">{e.osName}</span></td>
                        <td className="px-4 py-2.5"><span className="block truncate text-[13px] text-[#64748B]">{e.office}</span></td>
                        {/* Where it came from: an office it sits in, or added by hand. */}
                        <td className="px-4 py-2.5">
                          <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${d.offices.includes(e.office) ? 'bg-[#EEF2F6] text-[#475569]' : 'bg-[#EBF5FF] text-[#3D8BD0]'}`}>{d.offices.includes(e.office) ? 'Remote Office' : 'Endpoint'}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {d.offices.includes(e.office) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex size-7 cursor-help items-center justify-center rounded text-[#CBD5E1] opacity-0 group-hover/row:opacity-100"><X size={15} /></span>
                              </TooltipTrigger>
                              <TooltipContent className="text-wrap max-w-[240px]">Comes from {e.office} — remove the office above to drop it</TooltipContent>
                            </Tooltip>
                          ) : (
                            <button type="button" title="Remove" onClick={() => set({ endpointIds: d.endpointIds.filter((x) => x !== e.id) })} className="inline-flex size-7 items-center justify-center rounded text-[#7B8FA5] opacity-0 transition-opacity hover:bg-[#EEF2F6] hover:text-[#364658] focus:opacity-100 group-hover/row:opacity-100"><X size={15} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {resolved.length > 8 && <p className="border-t border-[#EEF1F4] px-4 py-2 text-[12px] text-[#7B8FA5]">and {resolved.length - 8} more</p>}
            </div>
          </Section>

          <Section title="Schedule & Notifications" sub="When the policy scans on its own, and who hears about the result.">
            <div className="space-y-4">
              <div>
                <FieldLabel>Notify Team</FieldLabel>
                <RuleSelect className="!rounded" multi value={d.notify} options={NOTIFY_OPTIONS} onChange={(v) => set({ notify: v })} placeholder="Technicians or groups" />
                <p className="mt-1.5 text-[12px] text-[#7B8FA5]">Told when a scan finishes and when an endpoint turns non-compliant.</p>
              </div>
              <ScheduleFields value={d.schedule} onChange={(s) => set({ schedule: s })} />
            </div>
          </Section>
        </div>
      </div>

      <PickerDrawer<ComplianceEndpoint>
        isOpen={picking}
        title="Select Endpoints"
        subtitle={benchmark ? `Endpoints running ${benchmark.osVersion}` : ''}
        rows={pickRows}
        columns={columns}
        selected={d.endpointIds}
        filterBar={<TicketFilterBar rules={pickRules} setRules={setPickRules} noun="endpoint" attrs={pickAttrs} quickFilters={pickQuick} showFilterBuilder={false} />}
        searchOf={(e) => [e.id, e.hostName, e.ip, e.osName, e.office].join(' ')}
        onClose={() => { setPicking(false); setPickRules([]); }}
        onApply={(ids) => { set({ endpointIds: ids }); setPicking(false); setPickRules([]); }}
      />
    </div>
  );
}
