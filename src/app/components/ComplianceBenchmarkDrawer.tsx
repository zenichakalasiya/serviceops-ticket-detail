import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DrawerTabStrip } from './DrawerTabStrip';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderCopyButton } from './HeaderCopyButton';
import { StatsCardsRow } from './AssetStatsRow';
import { ckpi, RuleDetailPanel } from './ComplianceShared';
import { RuleGroupTree, ruleTreeCount } from './ComplianceEndpointPanel';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { benchmarksUsingRule, BENCHMARKS_SEED, fmtDate, profileLabel, ruleById, ruleNumbers } from './complianceData';
import { endpointResults, findingsOf, fmtStamp, getPolicy, POLICY_STATUS_OPTIONS, statusOf, usePolicies } from './compliancePolicyData';
import type { ComplianceEndpoint, EndpointOutcome } from './compliancePolicyData';
import { vizSnapshot } from './complianceVizData';
import { useDrawerStack } from './DrawerStack';
import { anyFilter, cardActive, cardToggle, matchesFilter, matchesSearch, NoMatch, optionsFrom, TabListToolbar } from './ComplianceTabFilter';
import type { FilterValue } from './ComplianceTabFilter';
import { SEVERITIES } from './complianceData';
import { SEVERITY_COLOR } from './complianceVizData';

/* Compliance › Benchmark — a benchmark's detail page, opened from the Benchmark listing through
 * the shared DrawerStack. Read only for the technician (the admin owns benchmarks).
 *
 * One policy runs ONE benchmark; one benchmark can be run by many policies — so everything here
 * reads across every policy that uses it.
 * Tabs: Rules (its rule groups, 1 · 1.1 · 1.3.1 — numbers and names only; a rule opens its
 * metadata) · Endpoints (every endpoint those policies check; a row opens the Endpoint page) ·
 * Policies (status count cards over the list; a row opens the Policy page). */

type Tab = 'rules' | 'endpoints' | 'policies';
const TABS: [Tab, string][] = [['rules', 'Rules'], ['endpoints', 'Endpoints'], ['policies', 'Policies']];
const POLICY_STATUSES = ['Compliant', 'Non-Compliant', 'Scanning', 'Not Scanned'] as const;
const OUTCOME_TONE: Record<EndpointOutcome, { bg: string; text: string }> = {
  Compliant: { bg: '#ECFDF3', text: '#15803D' },
  'Non-Compliant': { bg: '#FEF3F2', text: '#B42318' },
  'Not Scanned': { bg: '#F1F5F9', text: '#64748B' },
};
const DIM = '#94A3B8';
const th = 'px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
const statusColor = (s: string) => POLICY_STATUS_OPTIONS.find((o) => o.label === s)?.color ?? DIM;

function kpi(key: string, label: string, value: React.ReactNode, tip: string): HeaderKpiItem {
  return {
    key, tip, node: (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[11px] text-[#7B8FA5]">{label}</span>
        <span className="text-[12px] font-medium text-[#364658]">{value}</span>
      </span>
    ),
  };
}
const OutcomePill = ({ outcome }: { outcome: EndpointOutcome }) => (
  <span className="inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: OUTCOME_TONE[outcome].bg, color: OUTCOME_TONE[outcome].text }}>{outcome}</span>
);
const IdPill = ({ id }: { id: string }) => <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{id}</span>;

export function ComplianceBenchmarkDrawer({
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
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const stat = v.benchmarks.find((s) => s.benchmark.id === activeAssetId);
  const b = stat?.benchmark ?? BENCHMARKS_SEED.find((x) => x.id === activeAssetId);
  const { open: openInStack } = useDrawerStack();
  const openEndpoint = useOpenComplianceEndpoint();

  const [tabLocal, setTabLocal] = useState<Tab>('rules');
  const remembered = stackActiveTab ?? tabLocal;
  const tab: Tab = TABS.some(([t]) => t === remembered) ? (remembered as Tab) : 'rules';
  /** Search + Filter per tab (ComplianceTabFilter). The Policies status cards set polF.status. */
  const [ruleQ, setRuleQ] = useState('');
  const [ruleF, setRuleF] = useState<FilterValue>({});
  const [epQ, setEpQ] = useState('');
  const [epF, setEpF] = useState<FilterValue>({});
  const [polQ, setPolQ] = useState('');
  const [polF, setPolF] = useState<FilterValue>({});
  useEffect(() => { setRuleQ(''); setRuleF({}); setEpQ(''); setEpF({}); setPolQ(''); setPolF({}); }, [activeAssetId]);
  const setTab = (t: Tab) => { setTabLocal(t); onStackActiveTabChange?.(t); };
  const [widthLocal, setWidthLocal] = useState(stackWidth ?? 99999);
  const full = (stackWidth ?? widthLocal) > 1080;
  const toggleFull = () => { const w = full ? 1080 : 99999; setWidthLocal(w); onStackWidthChange?.(w); };
  const [ruleId, setRuleId] = useState<string | null>(null);

  const mine = stat?.policies ?? [];
  const findings = useMemo(() => mine.flatMap(findingsOf), [mine]);
  /* Per rule: endpoints it passed / failed on, across this benchmark's policies. */
  const byRule = useMemo(() => {
    const m = new Map<string, { passed: number; failed: number }>();
    for (const f of findings) {
      const t = m.get(f.ruleId) ?? { passed: 0, failed: 0 };
      if (f.passed) t.passed += 1; else t.failed += 1;
      m.set(f.ruleId, t);
    }
    return m;
  }, [findings]);
  /* Per endpoint, across those policies: the worst result, and checks passed / failed. */
  const endpoints = useMemo(() => {
    const m = new Map<string, { endpoint: ComplianceEndpoint; outcome: EndpointOutcome; passed: number; failed: number; policies: number; policyNames: string[] }>();
    const rank: Record<EndpointOutcome, number> = { 'Non-Compliant': 2, Compliant: 1, 'Not Scanned': 0 };
    for (const p of mine) {
      for (const r of endpointResults(p)) {
        const cur = m.get(r.endpoint.id) ?? { endpoint: r.endpoint, outcome: 'Not Scanned' as EndpointOutcome, passed: 0, failed: 0, policies: 0, policyNames: [] as string[] };
        cur.passed += r.passed; cur.failed += r.failed; cur.policies += 1; cur.policyNames.push(p.name);
        if (rank[r.outcome] > rank[cur.outcome]) cur.outcome = r.outcome;
        m.set(r.endpoint.id, cur);
      }
    }
    return [...m.values()].sort((x, y) => y.failed - x.failed);
  }, [mine]);

  const tabs = stackTabs ?? (b ? [{ id: b.id, subject: b.name }] : []);
  if (!b) return null;
  if (stackMinimized) {
    return <MinimizedDrawerRail items={tabs} activeId={b.id} onSelect={(id) => { onTabChange?.(id); onStackMinimizedChange?.(false); }} onRestore={() => onStackMinimizedChange?.(false)} />;
  }

  const numbers = ruleNumbers(b);
  const ruleIds = [...numbers.keys()];
  /* ── Rules ── a rule FAILS here when any endpoint of any policy running this benchmark failed it. */
  const ruleResult = (id: string) => { const t = byRule.get(id); return !t ? 'Not Checked' : t.failed ? 'Fail' : 'Pass'; };
  const ruleGroups = [
    { key: 'result', label: 'Result', options: [{ value: 'Fail', dot: '#EF4444' }, { value: 'Pass', dot: '#22C55E' }, { value: 'Not Checked', dot: '#94A3B8' }] },
    { key: 'severity', label: 'Severity', options: SEVERITIES.map((s) => ({ value: s, dot: SEVERITY_COLOR[s] })) },
    { key: 'assessment', label: 'Assessment', options: [{ value: 'Automated' }, { value: 'Manual' }] },
    { key: 'profile', label: 'Profile', options: [{ value: 'L1' }, { value: 'L2' }] },
  ];
  const ruleShow = anyFilter('', ruleF) ? (id: string) => {
    const r = ruleById(id);
    return !!r &&
      matchesFilter(ruleF, (k) => (k === 'result' ? ruleResult(id) : k === 'severity' ? r.severity : k === 'profile' ? r.profile : r.assessment));
  } : undefined;
  const ruleHits = anyFilter(ruleQ, ruleF) && b ? ruleTreeCount(b, ruleShow, ruleQ) : -1;
  /* ── Endpoints ── */
  const epGroups = [
    { key: 'result', label: 'Result', options: (['Compliant', 'Non-Compliant', 'Not Scanned'] as EndpointOutcome[]).map((o) => ({ value: o, dot: OUTCOME_TONE[o].text })) },
    { key: 'office', label: 'Office', options: optionsFrom(endpoints.map((e) => e.endpoint.office)) },
    { key: 'policy', label: 'Policy', options: optionsFrom(mine.map((p) => p.name)) },
  ];
  const shownEndpoints = endpoints.filter((e) => matchesSearch(epQ, [e.endpoint.id, e.endpoint.hostName, e.endpoint.ip]) &&
    matchesFilter(epF, (k) => (k === 'result' ? e.outcome : k === 'office' ? e.endpoint.office : e.policyNames)));
  /* ── Policies ── */
  const polGroups = [
    { key: 'status', label: 'Status', options: POLICY_STATUSES.map((s) => ({ value: s, dot: statusColor(s) })) },
    { key: 'run', label: 'Run', options: [{ value: 'Manual' }, { value: 'Scheduled' }] },
  ];
  const shownPolicies = mine.filter((p) => matchesSearch(polQ, [p.id, p.name]) &&
    matchesFilter(polF, (k) => (k === 'status' ? statusOf(p) : p.schedule.frequency === 'none' ? 'Manual' : 'Scheduled')));
  const openPolicy = (id: string) => { const p = getPolicy(id); if (p) openInStack('compliance-policies', p.id, p.name, p); };
  const openRule = ruleId ? ruleById(ruleId) : undefined;

  const kpis = [
    ckpi('type', 'Type', b.type),
    ckpi('version', 'Version', b.osVersion, { chip: 'neutral' }),
    ckpi('rules', 'Rules', ruleIds.length, { color: '#3D8BD0', tip: `${ruleIds.length} rules` }),
  ];
  /* Type, Version, Profile and the rule count are in the header — not repeated here. */
  const fields: [string, React.ReactNode][] = [
    ['Origin', b.origin],
    ['Description', b.description || '—'],
    ['Created By', b.createdBy],
    ['Last Updated', fmtDate(b.updatedAt)],
  ];

  return (
    <>
      <div className={`fixed right-0 top-0 z-50 flex h-screen flex-col bg-white shadow-2xl ${full ? '' : 'border-l border-[#e5e7eb]'}`} style={{ width: full ? '100vw' : 1080 }} data-drawer>
        <div className="flex items-center border-b border-[#e5e7eb] bg-[#f9fafb]">
          <DrawerTabStrip items={tabs} activeId={b.id} onSelect={(id) => onTabChange?.(id)} onClose={(id) => onCloseTab?.(id)} />
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

        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-[18px] font-semibold text-[#364658]">
              <HeaderIdPill id={b.id} />
              <span className="line-clamp-2 break-words">{b.name}</span>
            </h1>
            <HeaderKpiRow items={kpis} />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <HeaderCopyButton variant="link" value={`/compliance-benchmarks?open=${b.id}`} label="Copy Benchmark URL" />
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
                  {id === 'rules' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{ruleIds.length}</span>}
                  {id === 'endpoints' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{endpoints.length}</span>}
                  {id === 'policies' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{mine.length}</span>}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'rules' && (
                <div className="px-6 py-4">
                  <TabListToolbar search={ruleQ} onSearch={setRuleQ} groups={ruleGroups} value={ruleF} onChange={setRuleF} />
                  {ruleHits !== 0 && <RuleGroupTree benchmark={b} title="Rule Groups" onRule={setRuleId} plain show={ruleShow} query={ruleQ} />}
                  {ruleHits === 0 && <NoMatch what="rules" onClear={() => { setRuleQ(''); setRuleF({}); }} />}
                </div>
              )}

              {tab === 'endpoints' && (
                <div className="px-6 py-4">
                  {endpoints.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy using this benchmark checks any endpoint.</p>
                  ) : (
                    <>
                    <TabListToolbar search={epQ} onSearch={setEpQ} groups={epGroups} value={epF} onChange={setEpF} />
                    <table className="w-full table-fixed">
                      <colgroup><col className="w-[34%]" /><col className="w-[16%]" /><col className="w-[20%]" /><col className="w-[16%]" /><col /></colgroup>
                      <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'IP Address', 'Remote Office', 'Result', 'Policies'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {shownEndpoints.map((e) => {
                          return (
                            <tr key={e.endpoint.id} onClick={() => openEndpoint(e.endpoint.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                              <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><IdPill id={e.endpoint.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{e.endpoint.hostName}</span></span></td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{e.endpoint.ip}</td>
                              <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{e.endpoint.office}</span></td>
                              <td className="px-4 py-3"><OutcomePill outcome={e.outcome} /></td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{e.policies}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {shownEndpoints.length === 0 && <NoMatch what="endpoints" onClear={() => { setEpQ(''); setEpF({}); }} />}
                    </>
                  )}
                </div>
              )}

              {tab === 'policies' && (
                <div className="pb-6 pt-4">
                  {mine.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy runs this benchmark yet.</p>
                  ) : (
                    <>
                      <StatsCardsRow
                        rules={[]}
                        onApplyFilter={() => {}}
                        activeLabel={cardActive(polF, 'status')}
                        onCardClick={(c) => setPolF(cardToggle(polF, 'status', c.label))}
                        cards={POLICY_STATUSES.map((s) => {
                          const n = mine.filter((p) => statusOf(p) === s).length;
                          return { label: s, value: n, sub: `polic${n === 1 ? 'y' : 'ies'}`, valueColor: n ? statusColor(s) : DIM, hint: `Show only ${s} policies` };
                        })}
                      />
                      <div className="px-6">
                        <TabListToolbar search={polQ} onSearch={setPolQ} groups={polGroups} value={polF} onChange={setPolF} />
                        <table className="w-full table-fixed">
                          <colgroup><col /><col className="w-[170px]" /><col className="w-[110px]" /><col className="w-[190px]" /></colgroup>
                          <thead><tr className="border-b border-[#e5e7eb]">{['Policy', 'Status', 'Endpoints', 'Last Scan'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-[#e5e7eb]">
                            {shownPolicies.map((p) => {
                              const st = statusOf(p);
                              return (
                                <tr key={p.id} onClick={() => openPolicy(p.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                                  <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><IdPill id={p.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{p.name}</span></span></td>
                                  <td className="px-4 py-3"><span className="flex items-center gap-2 text-[13px] text-[#364658]"><span className="size-2 rounded-full" style={{ backgroundColor: statusColor(st) }} />{st}</span></td>
                                  <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{endpointResults(p).length}</td>
                                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#64748B]">{fmtStamp(p.lastScan?.at)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {shownPolicies.length === 0 && <NoMatch what="policies" onClear={() => { setPolQ(''); setPolF({}); }} />}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Benchmark Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] px-4 py-3 text-[14px] font-semibold text-[#364658]">Benchmark Fields</div>
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

      {openRule && (
        <RuleDetailPanel
          rule={openRule}
          number={numbers.get(openRule.id)}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((x) => x.name)}
          onClose={() => setRuleId(null)}
        />
      )}
    </>
  );
}
