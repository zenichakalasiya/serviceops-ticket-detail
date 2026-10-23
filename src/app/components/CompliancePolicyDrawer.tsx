import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Copy, Loader2, MoreVertical, Pencil, Play, Power, Trash2, X } from 'lucide-react';
import { DrawerTabStrip } from './DrawerTabStrip';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderCopyButton } from './HeaderCopyButton';
import { RuleDetailPanel, SeverityPill, TagCell } from './ComplianceShared';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { benchmarkRuleIds, benchmarksUsingRule, BENCHMARKS_SEED } from './complianceData';
import { mockEndpoints, endpointToPatchShape } from './EndpointsListPage';
import { useDrawerStack } from './DrawerStack';
import {
  benchmarkOf, endpointResults, fmtStamp, nextRun, openPolicyEditor, policyStore, POLICY_STATUS_OPTIONS, ruleResults,
  scheduleLabel, scoreOf, statusOf, usePolicies,
} from './compliancePolicyData';
import type { CompliancePolicy, EndpointOutcome } from './compliancePolicyData';
import { PolicyScheduleDrawer } from './CompliancePolicyEditor';
import { ComplianceEndpointPanel } from './ComplianceEndpointPanel';

/* Compliance Policy — the detail page. Opened from the listing through the shared DrawerStack,
 * so it is a tab in the same drawer every other module's record opens in (tab strip, minimise to
 * the rail, full / small view, close). Read only; Edit opens the full-screen form.
 *
 * It reads the policy LIVE from the store by id — Run Now, a schedule change or an edit made
 * elsewhere shows here at once. Tabs: Overview · Endpoints · Rules. The two result
 * visualisations (static drill-down, any-to-any) are a later tab. */

type Tab = 'overview' | 'endpoints' | 'rules';
const OUTCOME_TONE: Record<EndpointOutcome, { bg: string; text: string }> = {
  Compliant: { bg: '#ECFDF3', text: '#15803D' },
  'Non-Compliant': { bg: '#FEF3F2', text: '#B42318' },
  'Not Scanned': { bg: '#F1F5F9', text: '#64748B' },
};
const statusColor = (s: string) => POLICY_STATUS_OPTIONS.find((o) => o.label === s)?.color ?? '#94A3B8';
const boxedBtn = 'inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50';
const AXIS_LABEL = { endpoint: 'Endpoint', office: 'Remote Office', tag: 'Tag' } as const;

function kpi(key: string, label: string, value: React.ReactNode, tip: string, dot?: string): HeaderKpiItem {
  return {
    key, tip, node: (
      <span className="inline-flex items-center gap-1.5">
        {dot && <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />}
        <span className="text-[11px] text-[#7B8FA5]">{label}</span>
        <span className="text-[12px] font-medium text-[#364658]">{value}</span>
      </span>
    ),
  };
}

function OutcomePill({ outcome }: { outcome: EndpointOutcome }) {
  const t = OUTCOME_TONE[outcome];
  return <span className="inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: t.bg, color: t.text }}>{outcome}</span>;
}

/** The score as a ring — the one figure the Overview leads with. */
function ScoreRing({ score }: { score: number | null }) {
  const r = 34, c = 2 * Math.PI * r;
  const color = score === null ? '#CBD5E1' : score >= 90 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#DC2626';
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#EEF2F6" strokeWidth="8" />
      {score !== null && <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 42 42)" />}
      <text x="42" y="47" textAnchor="middle" fontSize="16" fontWeight="600" fill="#364658">{score === null ? '—' : `${score}%`}</text>
    </svg>
  );
}

export function CompliancePolicyDrawer({
  activeAssetId, stackTabs, onCloseTab, onTabChange, onClose, stackWidth, onStackWidthChange, stackMinimized, onStackMinimizedChange,
  stackActiveTab, onStackActiveTabChange,
}: {
  activeAssetId: string;
  stackTabs?: { id: string; subject?: string }[];
  onCloseTab?: (id: string) => void;
  onTabChange?: (id: string) => void;
  onClose: () => void;
  stackWidth?: number;
  onStackWidthChange?: (w: number) => void;
  stackMinimized?: boolean;
  onStackMinimizedChange?: (m: boolean) => void;
  stackActiveTab?: string;
  onStackActiveTabChange?: (t: string) => void;
}) {
  const policies = usePolicies();
  const p = policies.find((x) => x.id === activeAssetId);
  const [tabLocal, setTabLocal] = useState<Tab>('overview');
  const tab = (stackActiveTab as Tab) ?? tabLocal;
  const setTab = (t: Tab) => { setTabLocal(t); onStackActiveTabChange?.(t); };
  const [widthLocal, setWidthLocal] = useState(stackWidth ?? 99999);
  const full = (stackWidth ?? widthLocal) > 1080;
  const toggleFull = () => { const w = full ? 1080 : 99999; setWidthLocal(w); onStackWidthChange?.(w); };
  const [menu, setMenu] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(null);
  /** The endpoint whose results (rule breakdown) are open over this page. */
  const [resultFor, setResultFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { open: openInStack } = useDrawerStack();

  // A policy deleted elsewhere takes its tab with it.
  useEffect(() => { if (!p) onCloseTab?.(activeAssetId); }, [p, activeAssetId, onCloseTab]);

  const tabs = stackTabs ?? (p ? [{ id: p.id, subject: p.name }] : []);
  if (!p) return null;
  if (stackMinimized) {
    return <MinimizedDrawerRail items={tabs} activeId={p.id} onSelect={(id) => { onTabChange?.(id); onStackMinimizedChange?.(false); }} onRestore={() => onStackMinimizedChange?.(false)} />;
  }

  const benchmark = benchmarkOf(p.benchmarkId);
  const status = statusOf(p);
  const score = scoreOf(p.lastScan);
  const next = p.enabled ? nextRun(p.schedule) : null;
  const results = endpointResults(p);
  const run = () => policyStore.run(p.id, (done) => toast.success(`“${done.name}” scanned — ${scoreOf(done.lastScan) ?? 0}% compliant`));

  const kpis = [
    kpi('status', 'Status', status, `Status: ${status}`, statusColor(status)),
    kpi('benchmark', 'Benchmark', benchmark?.osVersion ?? '—', benchmark?.name ?? ''),
    kpi('endpoints', 'Endpoints', results.length, `${results.length} endpoints assessed`),
    kpi('score', 'Compliance', score === null ? '—' : `${score}%`, 'Checks passed of checks run, on the last scan'),
    kpi('last', 'Last Scan', fmtStamp(p.lastScan?.at), 'When the last scan finished'),
    kpi('next', 'Next Scan', p.enabled ? (next ? fmtStamp(next) : 'Not scheduled') : 'Disabled', p.enabled ? scheduleLabel(p.schedule) : 'A disabled policy never runs on schedule'),
  ];

  const fields: [string, React.ReactNode][] = [
    ['Benchmark', benchmark?.name ?? '—'],
    ['Type', benchmark?.type ?? '—'],
    ['Version', benchmark?.osVersion ?? '—'],
    ...(p.configType ? [['Config File Type', p.configType === 'startup' ? 'Startup' : 'Running'] as [string, React.ReactNode]] : []),
    ['Device Filter', AXIS_LABEL[p.axis]],
    [p.axis === 'endpoint' ? 'Endpoints' : p.axis === 'office' ? 'Remote Offices' : 'Tags Selected', p.axis === 'endpoint' ? `${p.endpointIds.length} selected` : <TagCell tags={p.axis === 'office' ? p.offices : p.deviceTags} />],
    ['Schedule', scheduleLabel(p.schedule)],
    ['Notify Team', p.notify.length ? p.notify.join(', ') : '—'],
    ['Tags', p.tags.length ? <span className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">{t}</span>)}</span> : '—'],
    ['Description', p.description || '—'],
    ['Enable', p.enabled ? 'Enabled' : 'Disabled'],
    ['Created By', p.createdBy],
    ['Created', fmtStamp(p.createdAt)],
    ['Last Updated', fmtStamp(p.updatedAt)],
  ];

  const openEndpoint = (id: string) => {
    const e = mockEndpoints.find((x) => x.id === id);
    if (e) openInStack('endpoints', e.id, e.hostName, endpointToPatchShape(e));
  };
  const rules = ruleResults(p);
  const openRule = ruleId ? rules.find((r) => r.rule.id === ruleId)?.rule : undefined;

  return (
    <>
      <div className={`fixed right-0 top-0 z-50 flex h-screen flex-col bg-white shadow-2xl ${full ? '' : 'border-l border-[#e5e7eb]'}`} style={{ width: full ? '100vw' : 1080 }} data-drawer>
        <div className="flex items-center border-b border-[#e5e7eb] bg-[#f9fafb]">
          <DrawerTabStrip items={tabs} activeId={p.id} onSelect={(id) => onTabChange?.(id)} onClose={(id) => onCloseTab?.(id)} />
          <button onClick={() => onStackMinimizedChange?.(true)} className="border-l border-[#e5e7eb] p-2 hover:bg-[#e5e7eb]" title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="#364658" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <button onClick={toggleFull} className="p-2 hover:bg-[#e5e7eb]" title={full ? 'Switch to small view' : 'Switch to full view'}>
            {full ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="12" height="12" rx="1.5" stroke="#364658" strokeWidth="2" /><path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5H18A1.5 1.5 0 0 1 19.5 6.5V15A1.5 1.5 0 0 1 18 16.5H16" stroke="#364658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="1.5" stroke="#364658" strokeWidth="2" /></svg>
            )}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[#e5e7eb]" title="Close"><X size={18} className="text-[#364658]" /></button>
        </div>

        {/* Header — ID pill + name, the KPI strip, actions right. */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-[18px] font-semibold text-[#364658]">
              <HeaderIdPill id={p.id} />
              <span className="truncate">{p.name}</span>
            </h1>
            <HeaderKpiRow items={kpis} />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <HeaderCopyButton variant="link" value={`/compliance-policies?open=${p.id}`} label="Copy Policy URL" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={() => openPolicyEditor({ mode: 'edit', id: p.id })} aria-label="Edit policy" className={boxedBtn}><Pencil size={16} /></button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    disabled={!!p.scanning || !p.enabled}
                    onClick={run}
                    className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-60"
                  >{p.scanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}{p.scanning ? 'Scanning…' : 'Run Now'}</button>
                </span>
              </TooltipTrigger>
              {!p.enabled && <TooltipContent>Enable the policy to run it</TooltipContent>}
            </Tooltip>
            <div className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} aria-label="More actions" className={boxedBtn}><MoreVertical size={16} /></button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-[210px] rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
                    {([
                      ['Clone', <Copy size={15} />, () => openPolicyEditor({ mode: 'clone', id: p.id })],
                      ['Schedule', <CalendarClock size={15} />, () => setScheduleOpen(true)],
                      [p.enabled ? 'Disable' : 'Enable', <Power size={15} />, () => { policyStore.toggle(p.id); toast.success(`“${p.name}” ${p.enabled ? 'disabled' : 'enabled'}`); }],
                    ] as [string, React.ReactNode, () => void][]).map(([label, icon, fn]) => (
                      <button key={label} type="button" onClick={() => { setMenu(false); fn(); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]">
                        <span className="text-[#7B8FA5]">{icon}</span>{label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-[#F1F5F9]" />
                    <button type="button" onClick={() => { setMenu(false); setConfirmDelete(true); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]"><Trash2 size={15} /> Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-shrink-0 gap-2.5 border-b border-[#e5e7eb] px-6">
              {([['overview', 'Overview'], ['endpoints', 'Endpoints'], ['rules', 'Rules']] as [Tab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
                >
                  {label}
                  {id === 'endpoints' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{results.length}</span>}
                  {id === 'rules' && benchmark && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{benchmarkRuleIds(benchmark).length}</span>}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {tab === 'overview' && <Overview p={p} score={score} results={results} rules={rules} onTab={setTab} />}

              {tab === 'endpoints' && (
                <table className="w-full table-fixed">
                  <colgroup><col className="w-[28%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[14%]" /><col className="w-[11%]" /><col /></colgroup>
                  <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'IP Address', 'Remote Office', 'Result', 'Compliance', 'Checks'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {results.map((r) => (
                      <tr key={r.endpoint.id} onClick={() => setResultFor(r.endpoint.id)} className="cursor-pointer transition-colors hover:bg-[#f9fafb]">
                        <td className="px-4 py-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={`size-2 flex-shrink-0 rounded-full ${r.endpoint.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} title={r.endpoint.agentOnline ? 'Agent online' : 'Agent offline'} />
                            {/* The id opens the endpoint's own record (Endpoints module); the row opens its results here. */}
                            <span
                              onClick={(e) => { if (!r.endpoint.real) return; e.stopPropagation(); openEndpoint(r.endpoint.id); }}
                              title={r.endpoint.real ? 'Open the endpoint' : undefined}
                              className={`flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0] ${r.endpoint.real ? 'hover:bg-[#d0e8f9]' : ''}`}
                            >{r.endpoint.id}</span>
                            <span className="truncate text-[13px] text-[#364658]" title={r.endpoint.osName}>{r.endpoint.hostName}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{r.endpoint.ip}</td>
                        <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{r.endpoint.office}</span></td>
                        <td className="px-4 py-3"><OutcomePill outcome={r.outcome} /></td>
                        <td className="px-4 py-3 text-[13px] font-medium tabular-nums text-[#364658]">{r.score === null ? '—' : `${r.score}%`}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#64748B]">{r.outcome === 'Not Scanned' ? (r.endpoint.agentOnline ? 'Not scanned yet' : 'Agent offline') : <><span className="text-[#15803D]">{r.passed} passed</span> · <span className={r.failed ? 'text-[#B42318]' : ''}>{r.failed} failed</span></>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'rules' && (
                <table className="w-full table-fixed">
                  <colgroup><col /><col className="w-[110px]" /><col className="w-[160px]" /><col className="w-[160px]" /></colgroup>
                  <thead><tr className="border-b border-[#e5e7eb]">{['Rule', 'Severity', 'Passed On', 'Failed On'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {rules.map(({ rule, passed, failed }) => (
                      <tr key={rule.id} onClick={() => setRuleId(rule.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                        <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]" title={rule.name}>{rule.name}</span></td>
                        <td className="px-4 py-3"><SeverityPill severity={rule.severity} /></td>
                        <td className="px-4 py-3 text-[13px] tabular-nums text-[#15803D]">{p.lastScan ? `${passed} endpoint${passed === 1 ? '' : 's'}` : '—'}</td>
                        <td className={`px-4 py-3 text-[13px] tabular-nums ${failed ? 'font-medium text-[#B42318]' : 'text-[#64748B]'}`}>{p.lastScan ? `${failed} endpoint${failed === 1 ? '' : 's'}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Policy Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] px-4 py-3 text-[14px] font-semibold text-[#364658]">Policy Fields</div>
                <dl className="space-y-3.5 px-4 py-4">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[12px] text-[#64748B]">{label}</dt>
                      <dd className="mt-0.5 text-[13px] leading-[1.55] text-[#364658]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {resultFor && <ComplianceEndpointPanel endpointId={resultFor} policyId={p.id} onClose={() => setResultFor(null)} />}
      {scheduleOpen && <PolicyScheduleDrawer policyId={p.id} onClose={() => setScheduleOpen(false)} />}
      {openRule && <RuleDetailPanel rule={openRule} usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((b) => b.name)} onClose={() => setRuleId(null)} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setConfirmDelete(false)}>
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Delete “{p.name}”?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">The policy and its scan results are removed. The benchmark and the endpoints are not touched.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button type="button" onClick={() => { const n = p.name; setConfirmDelete(false); policyStore.remove(p.id); toast.success(`“${n}” deleted`); }} className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]">Delete policy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Overview — the last scan read as four counts, the score, and the rules failing most. */
function Overview({ p, score, results, rules, onTab }: {
  p: CompliancePolicy;
  score: number | null;
  results: ReturnType<typeof endpointResults>;
  rules: ReturnType<typeof ruleResults>;
  onTab: (t: Tab) => void;
}) {
  const n = (o: EndpointOutcome) => results.filter((r) => r.outcome === o).length;
  const worst = useMemo(() => [...rules].filter((r) => r.failed > 0).sort((a, b) => b.failed - a.failed).slice(0, 5), [rules]);
  const cards: [string, number, string][] = [
    ['Endpoints Assessed', results.length, '#364658'],
    ['Compliant', n('Compliant'), '#15803D'],
    ['Non-Compliant', n('Non-Compliant'), '#B42318'],
    ['Not Scanned', n('Not Scanned'), '#64748B'],
  ];
  return (
    <div className="space-y-5">
      {!p.lastScan && (
        <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#64748B]">
          This policy has not been scanned yet. Press <span className="font-medium text-[#364658]">Run Now</span> to assess its {results.length} endpoint{results.length === 1 ? '' : 's'}{p.schedule.frequency !== 'none' ? `, or wait for its schedule — ${scheduleLabel(p.schedule).toLowerCase()}` : ''}.
        </div>
      )}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div className="flex items-center gap-4 rounded-lg border border-[#e5e7eb] px-5 py-4">
          <ScoreRing score={score} />
          <div>
            <div className="text-[12px] text-[#7B8FA5]">Compliance score</div>
            <div className="mt-0.5 text-[13px] text-[#364658]">{p.lastScan ? <><span className="font-medium">{p.lastScan.passed}</span> of {p.lastScan.passed + p.lastScan.failed} checks passed</> : 'No scan yet'}</div>
            <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{p.lastScan ? `Scanned ${fmtStamp(p.lastScan.at)}` : ''}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 @container lg:grid-cols-4">
          {cards.map(([label, value, color]) => (
            <button key={label} type="button" onClick={() => onTab('endpoints')} className="rounded-lg border border-[#e5e7eb] px-4 py-3 text-left transition-colors hover:border-[#CBD5E1] hover:shadow-sm">
              <div className="text-[12px] text-[#7B8FA5]">{label}</div>
              <div className="mt-1 text-[20px] font-semibold tabular-nums" style={{ color: value ? color : '#94A3B8' }}>{value}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#e5e7eb]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <span className="text-[14px] font-semibold text-[#364658]">Rules failing most</span>
          <button type="button" onClick={() => onTab('rules')} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">View all rules</button>
        </div>
        {worst.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">{p.lastScan ? 'Every rule passed on every scanned endpoint.' : 'Results appear here after the first scan.'}</p>
        ) : (
          <ul className="divide-y divide-[#EEF1F4]">
            {worst.map(({ rule, failed }) => (
              <li key={rule.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]" title={rule.name}>{rule.name}</span>
                <SeverityPill severity={rule.severity} />
                <span className="w-[120px] flex-shrink-0 text-right text-[13px] font-medium tabular-nums text-[#B42318]">{failed} endpoint{failed === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
