import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Copy, ListChecks, Loader2, MoreVertical, Pencil, Play, Power, Trash2, X } from 'lucide-react';
import { DrawerTabStrip } from './DrawerTabStrip';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderCopyButton } from './HeaderCopyButton';
import { ckpi, RuleDetailPanel } from './ComplianceShared';
import { StatsCardsRow } from './AssetStatsRow';
import { scoreColor } from './complianceVizData';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { benchmarkRuleIds, benchmarksUsingRule, BENCHMARKS_SEED, ruleById, ruleNumbers } from './complianceData';
import { useDrawerStack } from './DrawerStack';
import {
  benchmarkOf, endpointResults, fmtStamp, nextRun, openPolicyEditor, policyStore, POLICY_STATUS_OPTIONS, ruleResults,
  runHistory, scheduleLabel, scoreOf, statusOf, useExceptions, usePolicies,
} from './compliancePolicyData';
import type { CompliancePolicy, EndpointOutcome } from './compliancePolicyData';
import { PolicyScheduleDrawer } from './CompliancePolicyEditor';
import { ComplianceEndpointPanel, RuleGroupTree, ruleTreeCount } from './ComplianceEndpointPanel';
import { AuditTrailsTabContent } from './AuditTrailsTabContent';
import type { AuditEntry } from './AuditTrailsTabContent';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { anyFilter, cardActive, cardToggle, matchesFilter, matchesSearch, NoMatch, optionsFrom, TabListToolbar } from './ComplianceTabFilter';
import type { FilterValue } from './ComplianceTabFilter';
import { findingsOf } from './compliancePolicyData';
import { SEVERITIES } from './complianceData';
import { SEVERITY_COLOR } from './complianceVizData';

/* Compliance Policy — the detail page. Opened from the listing through the shared DrawerStack,
 * so it is a tab in the same drawer every other module's record opens in (tab strip, minimise to
 * the rail, full / small view, close). Read only; Edit opens the full-screen form.
 *
 * It reads the policy LIVE from the store by id — Run Now, a schedule change or an edit made
 * elsewhere shows here at once. Tabs: Endpoints (the one place compliance % is shown; count
 * cards filter the list) · Rules (the benchmark's rules, 1 · 1.1 · 1.3.1, names only) · Run
 * History · Audit Trail. An endpoint row (or its View rule results action) opens the side panel
 * of that device's rule results — a rule there opens its metadata in place, with a back arrow;
 * the EP ID opens the endpoint's own page. A rule in the Rules tab opens the rule side panel. */

type Tab = 'endpoints' | 'rules' | 'runs' | 'audit';
const TABS: [Tab, string][] = [['endpoints', 'Endpoints'], ['rules', 'Rules'], ['runs', 'Run History'], ['audit', 'Audit Trail']];
const fmtDuration = (s: number | null) => (s === null ? '—' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`);
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

const initials = (n: string) => n.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

function OutcomePill({ outcome }: { outcome: EndpointOutcome }) {
  const t = OUTCOME_TONE[outcome];
  return <span className="inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: t.bg, color: t.text }}>{outcome}</span>;
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
  const [tabLocal, setTabLocal] = useState<Tab>('endpoints');
  const remembered = stackActiveTab ?? tabLocal;
  const tab: Tab = TABS.some(([t]) => t === remembered) ? (remembered as Tab) : 'endpoints';
  const setTab = (t: Tab) => { setTabLocal(t); onStackActiveTabChange?.(t); };
  const [widthLocal, setWidthLocal] = useState(stackWidth ?? 99999);
  const full = (stackWidth ?? widthLocal) > 1080;
  const toggleFull = () => { const w = full ? 1080 : 99999; setWidthLocal(w); onStackWidthChange?.(w); };
  const [menu, setMenu] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Search + Filter per tab (ComplianceTabFilter). The Endpoints count cards set epF.result. */
  const [epQ, setEpQ] = useState('');
  const [epF, setEpF] = useState<FilterValue>({});
  const [ruleQ, setRuleQ] = useState('');
  const [ruleF, setRuleF] = useState<FilterValue>({});
  const [runQ, setRunQ] = useState('');
  const [runF, setRunF] = useState<FilterValue>({});
  useEffect(() => { setEpQ(''); setEpF({}); setRuleQ(''); setRuleF({}); setRunQ(''); setRunF({}); }, [activeAssetId]);
  /** The endpoint whose rule results are open in the side panel. */
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const { open: openInStack } = useDrawerStack();
  const exceptions = useExceptions();
  const openComplianceEndpoint = useOpenComplianceEndpoint();

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
    ckpi('status', 'Status', status, { dot: statusColor(status), tip: `Status: ${status}` }),
    ckpi('score', 'Compliance', score === null ? '—' : `${score}%`, { color: score === null ? '#94A3B8' : scoreColor(score), tip: 'Checks passed of checks run, on the last scan' }),
    ckpi('endpoints', 'Endpoints', results.length, { color: '#3D8BD0', tip: `${results.length} endpoints assessed` }),
    ckpi('benchmark', 'Benchmark', benchmark?.osVersion ?? '—', { chip: 'neutral', tip: benchmark?.name ?? '' }),
    ckpi('last', 'Last Scan', fmtStamp(p.lastScan?.at), { tip: 'When the last scan finished' }),
    ckpi('next', 'Next Scan', p.enabled ? (next ? fmtStamp(next) : 'Not scheduled') : 'Disabled', { color: p.enabled && next ? '#364658' : '#94A3B8', tip: p.enabled ? scheduleLabel(p.schedule) : 'A disabled policy never runs on schedule' }),
  ];

  const fields: [string, React.ReactNode][] = [
    /* Version and the endpoint count are in the header — not repeated here. */
    ['Benchmark', benchmark?.name ?? '—'],
    ...(p.configType ? [['Config File Type', p.configType === 'startup' ? 'Startup' : 'Running'] as [string, React.ReactNode]] : []),
    ...(p.offices.length ? [['Remote Offices', p.offices.join(', ')] as [string, React.ReactNode]] : []),
    ...(p.endpointIds.length ? [['Endpoints Added', p.endpointIds.length] as [string, React.ReactNode]] : []),
  ];
  /* Schedule is drawn as its own highlighted card between these two lists (with Reschedule). The
     enabled flag is not a field — the header's Status already says it. */
  const fieldsAfter: [string, React.ReactNode][] = [
    ['Notify Team', p.notify.length ? p.notify.join(', ') : '—'],
    ['Description', p.description || '—'],
    ['Created', `${fmtStamp(p.createdAt)} by ${p.createdBy}`],
  ];

  /* An EP ID opens the endpoint's own detail page. */
  const openEndpoint = (id: string) => openComplianceEndpoint(id);
  /* ── Endpoints tab ── */
  const epGroups = [
    { key: 'result', label: 'Result', options: (['Compliant', 'Non-Compliant', 'Not Scanned'] as EndpointOutcome[]).map((o) => ({ value: o, dot: OUTCOME_TONE[o].text })) },
    { key: 'office', label: 'Office', options: optionsFrom(results.map((r) => r.endpoint.office)) },
    { key: 'agent', label: 'Agent', options: [{ value: 'Online', dot: '#22C55E' }, { value: 'Offline', dot: '#F59E0B' }] },
    { key: 'os', label: 'OS', options: optionsFrom(results.map((r) => r.endpoint.osName)) },
  ];
  const shownResults = results.filter((r) =>
    matchesSearch(epQ, [r.endpoint.id, r.endpoint.hostName, r.endpoint.ip]) &&
    matchesFilter(epF, (k) => (k === 'result' ? r.outcome : k === 'office' ? r.endpoint.office : k === 'agent' ? (r.endpoint.agentOnline ? 'Online' : 'Offline') : r.endpoint.osName)));
  /* ── Rules tab: a rule FAILS here when any endpoint failed it on the last scan ── */
  const findings = findingsOf(p);
  const ruleNums = benchmark ? ruleNumbers(benchmark) : new Map<string, string>();
  const ruleResult = (id: string) => {
    const fs = findings.filter((f) => f.ruleId === id);
    return !fs.length ? 'Not Checked' : fs.some((f) => !f.passed) ? 'Fail' : 'Pass';
  };
  const ruleGroups = [
    { key: 'result', label: 'Result', options: [{ value: 'Fail', dot: '#EF4444' }, { value: 'Pass', dot: '#22C55E' }, { value: 'Not Checked', dot: '#94A3B8' }] },
    { key: 'severity', label: 'Severity', options: SEVERITIES.map((s) => ({ value: s, dot: SEVERITY_COLOR[s] })) },
    { key: 'assessment', label: 'Assessment', options: [{ value: 'Automated' }, { value: 'Manual' }] },
  ];
  const ruleShow = anyFilter('', ruleF) ? (id: string) => {
    const r = ruleById(id);
    return !!r &&
      matchesFilter(ruleF, (k) => (k === 'result' ? ruleResult(id) : k === 'severity' ? r.severity : r.assessment));
  } : undefined;
  const ruleHits = anyFilter(ruleQ, ruleF) && benchmark ? ruleTreeCount(benchmark, ruleShow, ruleQ) : -1;
  const allRuns = runHistory(p);
  const runGroups = [
    { key: 'trigger', label: 'Triggered By', options: optionsFrom(allRuns.map((r) => r.trigger)) },
    { key: 'status', label: 'Status', options: optionsFrom(allRuns.map((r) => r.status)) },
  ];
  const runs = allRuns.filter((r) => matchesSearch(runQ, [r.id, fmtStamp(r.at)]) && matchesFilter(runF, (k) => (k === 'trigger' ? r.trigger : r.status)));
  const audit: AuditEntry[] = [
    ...exceptions.filter((x) => x.policyId === p.id).map((x, i) => ({
      id: `x${i}`, timestamp: x.requestedAt.replace('T', ' ') + ':00', user: 'You', userInitials: 'YO', userColor: '#3D8BD0',
      action: 'Exception Requested', details: `${x.endpointId} · ${ruleById(x.ruleId)?.name ?? x.ruleId} — ${x.reason}, expires ${x.expiresOn}`, changes: [],
    })),
    ...(p.lastScan ? [{
      id: 'scan', timestamp: p.lastScan.at.replace('T', ' ') + ':00', user: 'System', userInitials: 'SY', userColor: '#64748B',
      action: 'Scan Completed', details: `${results.length} endpoints assessed — ${score ?? 0}% compliant`,
      changes: [{ field: 'Compliance', oldValue: '—', newValue: `${score ?? 0}%` }],
    }] : []),
    ...(p.updatedAt !== p.createdAt ? [{
      id: 'upd', timestamp: p.updatedAt.replace('T', ' ') + ':00', user: p.createdBy, userInitials: initials(p.createdBy), userColor: '#F59E0B',
      action: 'Policy Updated', details: `Schedule: ${scheduleLabel(p.schedule)}`, changes: [],
    }] : []),
    {
      id: 'new', timestamp: p.createdAt.replace('T', ' ') + ':00', user: p.createdBy, userInitials: initials(p.createdBy), userColor: '#8B5CF6',
      action: 'Policy Created', details: `Benchmark ${benchmark?.name ?? '—'} · ${results.length} endpoints`, changes: [],
    },
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

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
              {TABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
                >
                  {label}
                  {id === 'endpoints' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{results.length}</span>}
                  {id === 'rules' && benchmark && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{benchmarkRuleIds(benchmark).length}</span>}
                  {id === 'runs' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{allRuns.length}</span>}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* ── Endpoints: slim filter cards, then the list ── */}
              {tab === 'endpoints' && (
                <div className="pb-6 pt-4">
                  <StatsCardsRow
                    rules={[]}
                    onApplyFilter={() => {}}
                    activeLabel={cardActive(epF, 'result')}
                    onCardClick={(c) => setEpF(cardToggle(epF, 'result', c.label))}
                    cards={[
                      {
                        label: 'Average Compliance', value: score === null ? '—' : `${score}%`,
                        sub: p.lastScan ? `${p.lastScan.passed} of ${p.lastScan.passed + p.lastScan.failed} checks pass` : 'not scanned yet',
                        valueColor: score === null ? '#94A3B8' : scoreColor(score), static: true,
                      },
                      ...(['Compliant', 'Non-Compliant', 'Not Scanned'] as EndpointOutcome[]).map((o) => {
                        const n = results.filter((r) => r.outcome === o).length;
                        return { label: o, value: n, sub: `endpoint${n === 1 ? '' : 's'}`, valueColor: n ? OUTCOME_TONE[o].text : '#94A3B8', hint: `Show only ${o} endpoints` };
                      }),
                    ]}
                  />
                  <div className="px-6">
                    <TabListToolbar search={epQ} onSearch={setEpQ} groups={epGroups} value={epF} onChange={setEpF} />
                    <div className="overflow-x-auto"><table className="w-full min-w-[1000px] table-fixed">
                      <colgroup><col className="w-[23%]" /><col className="w-[12%]" /><col className="w-[13%]" /><col className="w-[140px]" /><col className="w-[10%]" /><col /><col className="w-[169px]" /></colgroup>
                      <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'IP Address', 'Remote Office', 'Result', 'Compliance', 'Checks', 'Actions'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {shownResults.map((r) => (
                          <tr key={r.endpoint.id} onClick={() => setResultsFor(r.endpoint.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                            <td className="px-4 py-3">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className={`size-2 flex-shrink-0 rounded-full ${r.endpoint.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} title={r.endpoint.agentOnline ? 'Agent online' : 'Agent offline'} />
                                {/* The EP ID opens the endpoint's own detail page; the rest of the row opens its rule results. */}
                                <button type="button" onClick={(e) => { e.stopPropagation(); openEndpoint(r.endpoint.id); }} title="Open endpoint details" className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0] hover:underline">{r.endpoint.id}</button>
                                <span className="truncate text-[13px] text-[#364658]" title={r.endpoint.osName}>{r.endpoint.hostName}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{r.endpoint.ip}</td>
                            <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{r.endpoint.office}</span></td>
                            <td className="px-4 py-3"><OutcomePill outcome={r.outcome} /></td>
                            <td className="px-4 py-3 text-[13px] font-medium tabular-nums" style={{ color: r.score === null ? '#94A3B8' : scoreColor(r.score) }}>{r.score === null ? '—' : `${r.score}%`}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#64748B]">{r.outcome === 'Not Scanned' ? (r.endpoint.agentOnline ? 'Not scanned yet' : 'Agent offline') : <><span className="text-[#15803D]">{r.passed} passed</span> · <span className={r.failed ? 'text-[#B42318]' : ''}>{r.failed} failed</span></>}</td>
                            <td className="px-4 py-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); setResultsFor(r.endpoint.id); }} className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><ListChecks size={14} /> View rule results</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    {shownResults.length === 0 && results.length > 0 && <NoMatch what="endpoints" onClear={() => { setEpQ(''); setEpF({}); }} />}
                  </div>
                </div>
              )}

              {/* ── Rules: the benchmark's rules, numbered, nothing else ── */}
              {tab === 'rules' && (
                <div className="px-6 py-4">
                  <TabListToolbar search={ruleQ} onSearch={setRuleQ} groups={ruleGroups} value={ruleF} onChange={setRuleF} />
                  {benchmark && ruleHits !== 0 && <RuleGroupTree benchmark={benchmark} title={benchmark.name} onRule={setRuleId} plain show={ruleShow} query={ruleQ} />}
                  {ruleHits === 0 && <NoMatch what="rules" onClear={() => { setRuleQ(''); setRuleF({}); }} />}
                </div>
              )}

              {/* ── Run History: every scan run, newest first ── */}
              {tab === 'runs' && (
                <div className="pb-6 pt-4">
                  <div className="px-6">
                    {allRuns.length > 0 && <TabListToolbar search={runQ} onSearch={setRunQ} groups={runGroups} value={runF} onChange={setRunF} />}
                    {allRuns.length > 0 && runs.length === 0 ? (
                      <NoMatch what="runs" onClear={() => { setRunQ(''); setRunF({}); }} />
                    ) : runs.length === 0 ? (
                      <p className="py-10 text-center text-[13px] text-[#9CA3AF]">This policy has not run yet. Press Run Now, or wait for its schedule.</p>
                    ) : (
                      <div className="overflow-x-auto"><table className="w-full min-w-[1060px] table-fixed">
                        <colgroup><col className="w-[130px]" /><col className="w-[190px]" /><col className="w-[120px]" /><col className="w-[90px]" /><col className="w-[110px]" /><col /><col className="w-[110px]" /><col className="w-[110px]" /></colgroup>
                        <thead><tr className="border-b border-[#e5e7eb]">{['Run ID', 'Scan Date', 'Triggered By', 'Duration', 'Endpoints', 'Checks', 'Compliance', 'Status'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-[#e5e7eb]">
                          {runs.map((r) => (
                            <tr key={r.id} className="transition-colors hover:bg-[#f9fafb]">
                              <td className="px-4 py-3"><span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{r.id}</span></td>
                              <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{fmtStamp(r.at)}</td>
                              <td className="px-4 py-3 text-[13px] text-[#64748B]">{r.trigger}</td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{fmtDuration(r.duration)}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-[#364658]" title={r.notScanned ? `${r.notScanned} not scanned — agent offline on this run` : undefined}>{r.notScanned > 0 ? <span className="text-[#B45309]">{r.endpoints - r.notScanned} of {r.endpoints}</span> : r.endpoints}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#64748B]">{r.status === 'Running' ? '—' : <><span className="text-[#15803D]">{r.passed} passed</span> · <span className={r.failed ? 'text-[#B42318]' : ''}>{r.failed} failed</span></>}</td>
                              <td className="px-4 py-3 text-[13px] font-medium tabular-nums" style={{ color: r.score === null ? '#94A3B8' : scoreColor(r.score) }}>{r.score === null ? '—' : `${r.score}%`}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium ${r.status === 'Running' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#ECFDF3] text-[#15803D]'}`}>
                                  {r.status === 'Running' && <Loader2 size={12} className="animate-spin" />}{r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'audit' && <AuditTrailsTabContent entries={audit} />}
            </div>
          </div>

          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Policy Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] px-4 py-3 text-[14px] font-semibold text-[#364658]">Policy Fields</div>
                <dl className="space-y-3.5 px-4 py-4">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[12px] text-[#64748B]">{label}</dt>
                      <dd className="mt-0.5 text-[13px] leading-[1.55] text-[#364658]">{value}</dd>
                    </div>
                  ))}
                  {/* Schedule — highlighted, with the way to change it right on it. */}
                  <div className="rounded-lg border border-[#CFE3F6] bg-[#F3F8FD] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-1.5 text-[12px] font-medium text-[#2F74B5]"><CalendarClock size={14} />Schedule</dt>
                      <button type="button" onClick={() => setScheduleOpen(true)} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Reschedule</button>
                    </div>
                    <dd className="mt-1 text-[14px] font-semibold text-[#364658]">{scheduleLabel(p.schedule)}</dd>
                    <div className="mt-0.5 text-[12px] text-[#64748B]">
                      {!p.enabled ? 'Policy disabled — it does not run on schedule' : next ? <>Next scan <span className="font-medium text-[#364658]">{fmtStamp(next)}</span></> : 'No upcoming scan'}
                    </div>
                  </div>
                  {fieldsAfter.map(([label, value]) => (
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

      {/* A rule opens its details only — results live on the Endpoints tab. */}
      {ruleId && ruleById(ruleId) && (
        <RuleDetailPanel
          rule={ruleById(ruleId)!}
          number={benchmark ? ruleNumbers(benchmark).get(ruleId) : undefined}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, ruleId).map((b) => b.name)}
          onClose={() => setRuleId(null)}
        />
      )}
      {resultsFor && <ComplianceEndpointPanel key={resultsFor} endpointId={resultsFor} policyId={p.id} onClose={() => setResultsFor(null)} onOpenEndpoint={openEndpoint} />}
      {scheduleOpen && <PolicyScheduleDrawer policyId={p.id} onClose={() => setScheduleOpen(false)} />}
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
