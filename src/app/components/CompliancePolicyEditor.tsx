import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Building2, CalendarClock, Eye, Info, Monitor, Plus, Search, Wifi, X } from 'lucide-react';
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

/** The product's segmented control — a pill on a track, the chosen option lifted out in white. */
function Pills<T extends string>({ value, options, onChange, disabled }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={`pill-track !inline-flex w-fit [&>button]:!flex-none [&>button]:!px-4 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
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

/** "No remote offices yet": two office buildings on the same soft ground as the endpoints art. */
function EmptyOfficesArt() {
  return (
    <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="74" cy="56" rx="64" ry="42" fill="#F3F7FC" />
      <rect x="30" y="38" width="34" height="44" rx="3" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      {[46, 56, 66].map((y) => <path key={y} d={`M38 ${y} H44 M50 ${y} H56`} stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />)}
      <rect x="56" y="22" width="44" height="60" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      {[32, 43, 54].map((y) => <path key={y} d={`M65 ${y} H72 M84 ${y} H91`} stroke="#CBD5E1" strokeWidth="2.25" strokeLinecap="round" />)}
      <rect x="72" y="66" width="12" height="16" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" />
      <path d="M22 82 H126" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="108" cy="36" r="11" fill="#FFFFFF" stroke="#3D8BD0" strokeWidth="2.25" />
      <path d="M108 31 V41 M103 36 H113" stroke="#3D8BD0" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

/** One way of choosing what to assess: a titled box with its count, an empty state that says what
 *  the box is for, and — once it holds something — its rows with the Add CTA moved to the header. */
function TargetBox({ title, count, addLabel, onAdd, addReason, invalid, emptyArt, emptyText, children }: {
  title: string; count: number; addLabel: string; onAdd: () => void; addReason?: string; invalid?: boolean;
  emptyArt: React.ReactNode; emptyText: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border ${invalid ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
      <div className="flex min-h-[48px] items-center gap-3 border-b border-[#EEF1F4] bg-[#F6F9FC] px-4 py-2">
        <span className="text-[13px] font-semibold text-[#364658]">{title} <span className="ml-1 rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{count}</span></span>
        {count > 0 && (
          <button type="button" onClick={onAdd} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"><Plus size={14} /> {addLabel}</button>
        )}
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center px-4 pb-6 pt-4 text-center">
          {emptyArt}
          <p className="mt-2 max-w-[560px] text-[13px] leading-[1.55] text-[#64748B]">{emptyText}</p>
          <button
            type="button"
            disabled={!!addReason}
            onClick={onAdd}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50"
          ><Plus size={14} /> {addLabel}</button>
        </div>
      ) : <div className="overflow-x-auto">{children}</div>}
    </div>
  );
}

/** "12 online · 2 offline" — the agent dots the endpoint rows use. */
function AgentSplit({ online, offline }: { online: number; offline: number }) {
  return (
    <span className="flex items-center gap-3 text-[13px] text-[#64748B]">
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#22C55E]" />{online} online</span>
      {offline > 0 && <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#F59E0B]" />{offline} offline</span>}
    </span>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" title="Remove" onClick={onClick} className="inline-flex size-7 items-center justify-center rounded text-[#7B8FA5] opacity-0 transition-opacity hover:bg-[#EEF2F6] hover:text-[#364658] focus:opacity-100 group-hover/row:opacity-100"><X size={15} /></button>
  );
}

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

export function ScheduleFields({ value, onChange }: { value: PolicySchedule; onChange: (s: PolicySchedule) => void }) {
  const f = value.frequency;
  const set = (patch: Partial<PolicySchedule>) => onChange({ ...value, ...patch });
  const next = nextRun(value);
  return (
    <div>
      {/* One switch: on = scheduled, off = it runs only by hand (the line below says so). */}
      <label className="inline-flex cursor-pointer items-center gap-2.5">
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
        <span className="text-[13px] font-medium text-[#364658]">Schedule</span>
      </label>
      {f === 'none' && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#64748B]">
          <Info size={13} className="flex-shrink-0 text-[#7B8FA5]" />
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
      if (e.key === 'Escape' && !picking && !pickingOffices && !previewOffice && !document.querySelector('[data-rule-menu]')) onClose();
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
                <FieldLabel required>Benchmark</FieldLabel>
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

          <Section title="Target Endpoints" sub="Add whole remote offices, individual endpoints, or both. An endpoint picked both ways is assessed once.">
            <div className="space-y-4">
              <TargetBox
                title="Remote Offices"
                count={d.offices.length}
                addLabel="Add Remote Offices"
                onAdd={() => setPickingOffices(true)}
                addReason={pickReason}
                invalid={tried && resolved.length === 0}
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
                invalid={tried && resolved.length === 0}
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
                <ErrorText>{tried && benchmark ? 'Add a remote office or an endpoint' : ''}</ErrorText>
              )}
            </div>
          </Section>

          <Section title="Schedule & Notifications" sub="When the policy scans on its own, and who hears about the result.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-2">
                <div>
                  <FieldLabel>Notify Team</FieldLabel>
                  <RuleSelect className="!rounded" multi value={d.notify} options={NOTIFY_OPTIONS} onChange={(v) => set({ notify: v })} placeholder="Technicians or groups" />
                </div>
              </div>
              <ScheduleFields value={d.schedule} onChange={(s) => set({ schedule: s })} />
            </div>
          </Section>
        </div>
      </div>

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
    </div>
  );
}
