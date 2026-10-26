import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DrawerTabStrip } from './DrawerTabStrip';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderCopyButton } from './HeaderCopyButton';
import { StatsCardsRow } from './AssetStatsRow';
import { RuleDetailPanel, TagCell } from './ComplianceShared';
import { FailedBySeverity, FailedOnCell, RuleGroupTree, severityCounts } from './ComplianceEndpointPanel';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { benchmarksUsingRule, BENCHMARKS_SEED, fmtDate, ruleById, ruleNumbers } from './complianceData';
import { endpointResults, findingsOf, fmtStamp, getPolicy, scoreOf, statusOf, usePolicies } from './compliancePolicyData';
import type { ComplianceEndpoint, EndpointOutcome } from './compliancePolicyData';
import { scoreColor, vizSnapshot } from './complianceVizData';
import { useDrawerStack } from './DrawerStack';

/* Compliance › Benchmark — a benchmark's detail page, opened from the Benchmark listing through
 * the shared DrawerStack. Read only for the technician (the admin owns benchmarks).
 *
 * One policy runs ONE benchmark; one benchmark can be run by many policies — so everything here
 * reads across every policy that uses it.
 * Tabs: Overview (the auditor's numbers) · Rules (its rule groups, 1 · 1.1 · 1.3.1, each rule
 * "Failed on N of M"; a rule opens its metadata + results) · Endpoints (every endpoint those
 * policies check; a row opens the Endpoint page) · Policies (a row opens the Policy page). */

type Tab = 'overview' | 'rules' | 'endpoints' | 'policies';
const TABS: [Tab, string][] = [['overview', 'Overview'], ['rules', 'Rules'], ['endpoints', 'Endpoints'], ['policies', 'Policies']];
const OUTCOME_TONE: Record<EndpointOutcome, { bg: string; text: string }> = {
  Compliant: { bg: '#ECFDF3', text: '#15803D' },
  'Non-Compliant': { bg: '#FEF3F2', text: '#B42318' },
  'Not Scanned': { bg: '#F1F5F9', text: '#64748B' },
};
const DIM = '#94A3B8';
const th = 'px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
const pct = (a: number, n: number) => (n ? Math.round((a / n) * 100) : null);

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

  const [tabLocal, setTabLocal] = useState<Tab>('overview');
  const remembered = stackActiveTab ?? tabLocal;
  const tab: Tab = TABS.some(([t]) => t === remembered) ? (remembered as Tab) : 'overview';
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
    const m = new Map<string, { endpoint: ComplianceEndpoint; outcome: EndpointOutcome; passed: number; failed: number; policies: number }>();
    const rank: Record<EndpointOutcome, number> = { 'Non-Compliant': 2, Compliant: 1, 'Not Scanned': 0 };
    for (const p of mine) {
      for (const r of endpointResults(p)) {
        const cur = m.get(r.endpoint.id) ?? { endpoint: r.endpoint, outcome: 'Not Scanned' as EndpointOutcome, passed: 0, failed: 0, policies: 0 };
        cur.passed += r.passed; cur.failed += r.failed; cur.policies += 1;
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
  const passedChecks = findings.filter((f) => f.passed).length;
  const score = pct(passedChecks, findings.length);
  const reached = findings.length > 0;
  const ruleIds = [...numbers.keys()];
  const failingRules = ruleIds.filter((id) => (byRule.get(id)?.failed ?? 0) > 0).length;
  const worstRules = ruleIds.filter((id) => (byRule.get(id)?.failed ?? 0) > 0).sort((x, y) => (byRule.get(y)!.failed - byRule.get(x)!.failed)).slice(0, 5);
  const openPolicy = (id: string) => { const p = getPolicy(id); if (p) openInStack('compliance-policies', p.id, p.name, p); };
  const openRule = ruleId ? ruleById(ruleId) : undefined;

  const kpis = [
    kpi('type', 'Type', b.type, `Type: ${b.type}`),
    kpi('version', 'Version', b.osVersion, `Version: ${b.osVersion}`),
    kpi('profile', 'Profile', b.profile, b.profile === 'L1' ? 'Level 1 — must-have rules only' : 'Level 2 — Level 1 rules plus good-to-have rules'),
    kpi('rules', 'Rules', ruleIds.length, `${ruleIds.length} rules`),
    kpi('policies', 'Policies', mine.length, mine.length ? mine.map((p) => p.name).join(', ') : 'No policy runs this benchmark'),
    kpi('score', 'Compliance', score === null ? '—' : <span style={{ color: scoreColor(score) }}>{score}%</span>, 'Checks passed across the policies that run it'),
  ];
  const fields: [string, React.ReactNode][] = [
    ['Type', b.type],
    ['Version', b.osVersion],
    ['Profile', b.profile === 'L1' ? 'Level 1' : 'Level 2'],
    ['Origin', b.origin],
    ['Rules', ruleIds.length],
    ['Tags', b.tags.length ? <TagCell tags={b.tags} /> : '—'],
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
              <span className="truncate">{b.name}</span>
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
              {tab === 'overview' && (
                <div className="pb-6 pt-5">
                  <StatsCardsRow
                    rules={[]}
                    onApplyFilter={() => {}}
                    cards={[
                      { label: 'Compliance', value: reached ? `${score}%` : '—', sub: reached ? `${passedChecks} of ${findings.length} checks pass` : 'Not scanned', valueColor: reached ? scoreColor(score) : DIM },
                      { label: 'Endpoints Assessed', value: endpoints.filter((e) => e.outcome !== 'Not Scanned').length, sub: `of ${endpoints.length} in scope` },
                      { label: 'Failed Checks', value: reached ? findings.length - passedChecks : '—', sub: `of ${findings.length} run`, valueColor: reached && findings.length - passedChecks ? '#DC2626' : DIM },
                      { label: 'Failing Rules', value: reached ? failingRules : '—', sub: `of ${ruleIds.length} rules`, valueColor: reached && failingRules ? '#B42318' : DIM },
                    ]}
                  />
                  <div className="space-y-4 px-6">
                    {reached ? (
                      <FailedBySeverity counts={severityCounts(ruleIds.filter((id) => byRule.has(id)).map((id) => ({ ruleId: id, passed: byRule.get(id)!.failed === 0 })))} />
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#DFE5ED] px-4 py-8 text-center text-[13px] text-[#7B8FA5]">
                        {mine.length ? 'No policy using this benchmark has been scanned yet.' : 'No policy runs this benchmark yet.'}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <section className="rounded-lg border border-[#E5E7EB]">
                        <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
                          <span className="text-[13px] font-semibold text-[#364658]">Compliance by Policy</span>
                          <button type="button" onClick={() => setTab('policies')} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">View all</button>
                        </header>
                        <div className="space-y-1 p-2">
                          {mine.length === 0 && <p className="px-2 py-4 text-center text-[13px] text-[#9CA3AF]">No policy runs this benchmark.</p>}
                          {mine.map((p) => {
                            const s = scoreOf(p.lastScan);
                            return (
                              <button key={p.id} type="button" onClick={() => openPolicy(p.id)} className="group flex w-full flex-col gap-1 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F5F7FA]">
                                <span className="flex items-baseline gap-2 text-[12.5px]">
                                  <span className="truncate font-medium text-[#364658] group-hover:text-[#3D8BD0]">{p.name}</span>
                                  <span className="ml-auto flex-shrink-0 font-semibold tabular-nums" style={{ color: s === null ? DIM : scoreColor(s) }}>{s === null ? 'Not Scanned' : `${s}%`}</span>
                                </span>
                                <span className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
                                  <span className="block h-full rounded-full" style={{ width: `${s ?? 0}%`, backgroundColor: s === null ? DIM : scoreColor(s) }} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                      <section className="rounded-lg border border-[#E5E7EB]">
                        <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
                          <span className="text-[13px] font-semibold text-[#364658]">Rules Failing Most</span>
                          <button type="button" onClick={() => setTab('rules')} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">View all rules</button>
                        </header>
                        {worstRules.length === 0 ? (
                          <p className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">{reached ? 'Every rule passed on every scanned endpoint.' : 'Results appear here after the first scan.'}</p>
                        ) : (
                          <ul className="divide-y divide-[#EEF1F4]">
                            {worstRules.map((id) => {
                              const r = ruleById(id)!;
                              const t = byRule.get(id)!;
                              return (
                                <li key={id}>
                                  <button type="button" onClick={() => setRuleId(id)} className="group flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]">
                                    <span className="w-[40px] flex-shrink-0 text-[12px] tabular-nums text-[#7B8FA5]">{numbers.get(id)}</span>
                                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658] group-hover:text-[#3D8BD0]" title={r.name}>{r.name}</span>
                                    <span className="flex-shrink-0 text-[12px] font-medium tabular-nums text-[#B42318]">{t.failed} of {t.failed + t.passed}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'rules' && (
                <div className="px-6 py-4">
                  <RuleGroupTree
                    benchmark={b}
                    title="Rule Groups"
                    onRule={setRuleId}
                    resultOf={(id) => byRule.get(id) ?? null}
                    right={(_, t) => <FailedOnCell t={t} />}
                  />
                </div>
              )}

              {tab === 'endpoints' && (
                <div className="px-6 py-4">
                  {endpoints.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy using this benchmark checks any endpoint.</p>
                  ) : (
                    <table className="w-full table-fixed">
                      <colgroup><col className="w-[30%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[15%]" /><col className="w-[11%]" /><col /></colgroup>
                      <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'IP Address', 'Remote Office', 'Result', 'Compliance', 'Policies'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {endpoints.map((e) => {
                          const s = pct(e.passed, e.passed + e.failed);
                          return (
                            <tr key={e.endpoint.id} onClick={() => openEndpoint(e.endpoint.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                              <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><IdPill id={e.endpoint.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{e.endpoint.hostName}</span></span></td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{e.endpoint.ip}</td>
                              <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{e.endpoint.office}</span></td>
                              <td className="px-4 py-3"><OutcomePill outcome={e.outcome} /></td>
                              <td className="px-4 py-3 text-[13px] font-medium tabular-nums text-[#364658]">{s === null ? '—' : `${s}%`}</td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{e.policies}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === 'policies' && (
                <div className="px-6 py-4">
                  {mine.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy runs this benchmark yet.</p>
                  ) : (
                    <table className="w-full table-fixed">
                      <colgroup><col /><col className="w-[150px]" /><col className="w-[110px]" /><col className="w-[100px]" /><col className="w-[190px]" /></colgroup>
                      <thead><tr className="border-b border-[#e5e7eb]">{['Policy', 'Status', 'Compliance', 'Endpoints', 'Last Scan'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {mine.map((p) => {
                          const s = scoreOf(p.lastScan);
                          return (
                            <tr key={p.id} onClick={() => openPolicy(p.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                              <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><IdPill id={p.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{p.name}</span></span></td>
                              <td className="px-4 py-3 text-[13px] text-[#364658]">{statusOf(p)}</td>
                              <td className="px-4 py-3 text-[13px] font-medium tabular-nums" style={{ color: s === null ? DIM : scoreColor(s) }}>{s === null ? '—' : `${s}%`}</td>
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{endpointResults(p).length}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#64748B]">{fmtStamp(p.lastScan?.at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Benchmark Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border border-[#e5e7eb]">
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
