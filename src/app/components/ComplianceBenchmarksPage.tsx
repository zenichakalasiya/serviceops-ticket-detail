/* Compliance › Benchmark — #/compliance-benchmarks, second page of the sidebar's Compliance
 * flyout. The technician's READ of the benchmark catalogue: one row per benchmark (the admin
 * owns them — Admin › Compliance › Benchmark — so there is no create or edit here), scored from
 * the policies that run it.
 *
 * A row opens the benchmark's rules as a side panel: every rule in it, with how it did on the
 * endpoints those policies checked. A rule opens its detail with a Results tab; an endpoint there
 * opens its compliance panel. The rule list is the same register the old Compliance
 * Visualization page's Explorer › Rules tab was, narrowed to one benchmark. */
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { ComplianceEndpointPanel } from './ComplianceEndpointPanel';
import { RuleDetailPanel } from './ComplianceShared';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { benchmarkRuleIds, benchmarksUsingRule, BENCHMARKS_SEED, ruleById } from './complianceData';
import { usePolicies } from './compliancePolicyData';
import { scoreColor, vizSnapshot } from './complianceVizData';
import type { BenchmarkStat } from './complianceVizData';
import { benchmarkRow, ruleRow, RuleResults } from './complianceRows';
import {
  VIZ_BENCHMARK_FILTER_ATTRS, VIZ_BENCHMARK_QUICK_FILTERS, VIZ_RULE_FILTER_ATTRS, VIZ_RULE_QUICK_FILTERS,
} from './complianceFilterAttrs';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const buildCards = (rows: Ticket[]): StatCard[] => {
  const used = rows.filter((t) => (t as any).x_inUse === 'In use');
  const scored = rows.filter((t) => (t as any).x_cpScore !== null && (t as any).x_cpScore !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((a, t) => a + Number((t as any).x_cpScore), 0) / scored.length) : null;
  const below = rows.filter((t) => ['Moderate', 'Poor', 'Vulnerable'].includes((t as any).x_posture));
  return [
    { label: 'Benchmarks', value: rows.length, sub: `${used.length} used by a policy`, filter: [{ field: 'x_inUse', condition: 'is', values: ['In use'] }] },
    { label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: 'across benchmarks in use', valueColor: avg === null ? undefined : scoreColor(avg) },
    { label: 'Below Target', value: below.length, sub: 'benchmarks under 90%', valueColor: below.length ? '#B45309' : undefined, filter: [{ field: 'x_posture', condition: 'is', values: ['Moderate', 'Poor', 'Vulnerable'] }] },
    { label: 'Failing Rules', value: rows.reduce((a, t) => a + Number((t as any).x_failingRules ?? 0), 0), sub: 'failing on at least one endpoint', valueColor: '#DC2626' },
  ];
};

const kpi = (key: string, label: string, value: React.ReactNode, tip: string): HeaderKpiItem => ({
  key, tip, node: (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[11px] text-[#7B8FA5]">{label}</span>
      <span className="text-[12px] font-medium text-[#364658]">{value}</span>
    </span>
  ),
});

/** One benchmark's rules, with results — a side panel over the listing. */
function BenchmarkRulesPanel({ stat, ruleStats, onClose, onOpenRule }: {
  stat: BenchmarkStat;
  ruleStats: Map<string, import('./complianceVizData').RuleStat>;
  onClose: () => void;
  onOpenRule: (id: string) => void;
}) {
  const b = stat.benchmark;
  const rows = useMemo(
    () => benchmarkRuleIds(b).map((id) => ruleById(id)).filter(Boolean).map((r) => {
      /* A rule can sit in several benchmarks; its results here count only THIS benchmark's policies. */
      const s = ruleStats.get(r!.id);
      const mine = s ? { ...s, policies: s.policies.filter((p) => p.benchmarkId === b.id) } : undefined;
      return ruleRow(r!, mine && mine.policies.length ? mine : undefined);
    }),
    [b, ruleStats],
  );
  const kpis = [
    kpi('type', 'Type', b.type, `Type: ${b.type}`),
    kpi('version', 'Version', b.osVersion, `Version: ${b.osVersion}`),
    kpi('profile', 'Profile', b.profile, b.profile === 'L1' ? 'Level 1 — must-have rules only' : 'Level 2 — Level 1 rules plus good-to-have rules'),
    kpi('rules', 'Rules', stat.rules, `${stat.rules} rules`),
    kpi('policies', 'Policies', stat.policies.length, stat.policies.length ? stat.policies.map((p) => p.name).join(', ') : 'No policy runs this benchmark'),
    kpi('score', 'Compliance', stat.score === null ? '—' : <span style={{ color: scoreColor(stat.score) }}>{stat.score}%</span>, 'Checks passed across the policies that run it'),
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-[1180px] max-w-[96vw] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold text-[#364658]">
              <HeaderIdPill id={b.id} />
              <span className="truncate">{b.name}</span>
            </h3>
            <HeaderKpiRow items={kpis} />
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AssetRegisterPage
            key={b.id}
            embedded
            showViews={false}
            activePage="compliance-benchmarks"
            stackModule="compliance-policies"
            viewsStore="cviz-rule"
            noun="rule"
            moduleCols="cviz-rule"
            defaultViewName="Rules"
            footerNoun="rules"
            rows={rows}
            recordOf={() => null}
            filterAttrs={VIZ_RULE_FILTER_ATTRS}
            quickFilters={VIZ_RULE_QUICK_FILTERS}
            searchFields={['x_section', 'x_policyNames']}
            hideSelection
            moreActions={[]}
            onOpenRow={(t) => onOpenRule(t.id)}
          />
        </div>
      </div>
    </div>
  );
}

export function ComplianceBenchmarksPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const rows = useMemo(() => v.benchmarks.map(benchmarkRow), [v]);
  const ruleStats = useMemo(() => new Map(v.rules.map((r) => [r.rule.id, r])), [v]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  const stat = openId ? v.benchmarks.find((s) => s.benchmark.id === openId) : undefined;
  const openRule = ruleId ? ruleById(ruleId) : undefined;
  /* Inside a benchmark, a rule's results are that benchmark's policies only. */
  const scope = stat ? stat.policies : policies;

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-benchmarks"
        stackModule="compliance-policies"
        viewsStore="cviz-benchmark"
        noun="benchmark"
        moduleCols="cviz-benchmark"
        defaultViewName="All Benchmarks"
        footerNoun="benchmarks"
        rows={rows}
        recordOf={() => null}
        filterAttrs={VIZ_BENCHMARK_FILTER_ATTRS}
        quickFilters={VIZ_BENCHMARK_QUICK_FILTERS}
        layouts={['list-kpi', 'list']}
        buildCards={buildCards}
        searchFields={['x_osVersion', 'x_policyNames', 'x_tags']}
        hideSelection
        moreActions={[]}
        onOpenRow={(t) => setOpenId(t.id)}
        onNavigate={onNavigate}
      />
      {stat && <BenchmarkRulesPanel stat={stat} ruleStats={ruleStats} onClose={() => setOpenId(null)} onOpenRule={setRuleId} />}
      {openRule && (
        <RuleDetailPanel
          rule={openRule}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((b) => b.name)}
          results={<RuleResults ruleId={openRule.id} policies={scope} onOpenEndpoint={(id) => { setRuleId(null); setEndpoint(id); }} />}
          onClose={() => setRuleId(null)}
        />
      )}
      {endpoint && <ComplianceEndpointPanel endpointId={endpoint} onClose={() => setEndpoint(null)} />}
    </>
  );
}
