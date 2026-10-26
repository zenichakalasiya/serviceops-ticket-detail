/* Compliance › Dashboard — #/compliance-dashboard, the first page of the sidebar's Compliance
 * flyout. The estate at a glance: posture, trend, failures by severity, the worst policies and
 * endpoints. It READS; the Compliance Policy page acts (create, run, schedule, edit).
 *
 * The body is ComplianceVizOverview, built from the Dashboard module's widget pieces. Every
 * number and chart clicks through:
 *   · a KPI card, or an Endpoint Posture slice → the Compliance Policy / Endpoints page, opened
 *     already filtered (the filter is handed over with setComplianceDrill, read once on arrival);
 *   · a Rule Assessment slice or a Failed by Severity row → the rule list, filtered, as a side
 *     panel over the dashboard (rules live inside benchmarks, so there is no all-rules page);
 *   · a Top Failed Rules row → that rule's results; a policy → its detail page in the shared
 *     drawer; an endpoint (id pill or Top Endpoints bar) → its compliance detail page. */
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ComplianceVizOverview } from './ComplianceVizOverview';
import type { ComplianceDrill } from './ComplianceVizOverview';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { AssetRegisterPage } from './AssetRegisterPage';
import { RuleDetailPanel } from './ComplianceShared';
import { benchmarksUsingRule, BENCHMARKS_SEED, ruleById } from './complianceData';
import { getPolicy, usePolicies } from './compliancePolicyData';
import { vizSnapshot } from './complianceVizData';
import { ruleRow } from './complianceRows';
import { setComplianceDrill, VIZ_RULE_FILTER_ATTRS, VIZ_RULE_QUICK_FILTERS } from './complianceFilterAttrs';
import { useDrawerStack } from './DrawerStack';

type RulesDrill = Extract<ComplianceDrill, { to: 'rules' }>;

export function ComplianceDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const { open } = useDrawerStack();
  const openEndpoint = useOpenComplianceEndpoint();
  const [rulesDrill, setRulesDrill] = useState<RulesDrill | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(null);

  const openPolicy = (id: string) => {
    const p = getPolicy(id);
    if (p) open('compliance-policies', p.id, p.name, p);
  };

  const onDrill = (d: ComplianceDrill) => {
    if (d.to === 'rule') return setRuleId(d.ruleId);
    if (d.to === 'rules') return setRulesDrill(d);
    const page = d.to === 'policies' ? 'compliance-policies' : 'compliance-endpoints';
    if (d.rules?.length) setComplianceDrill(page, d.rules);
    onNavigate?.(page);
  };

  /* Every rule any policy runs, with its results across those policies. */
  const ruleRows = useMemo(() => v.rules.map((s) => ruleRow(s.rule, s.policies.length ? s : undefined)), [v]);
  const openRule = ruleId ? ruleById(ruleId) : undefined;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="compliance-dashboard" onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} />
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-3">
          <h1 className="text-[17px] font-semibold text-[#1E293B]">Compliance Dashboard</h1>
          <span className="text-[12px] text-[#7B8FA5]">
            {v.stats.filter((s) => s.score !== null).length} of {v.stats.length} policies scanned · latest results
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FB]">
          <ComplianceVizOverview onOpenPolicy={openPolicy} onOpenEndpoint={(id) => openEndpoint(id)} onDrill={onDrill} />
        </div>
      </div>

      {rulesDrill && (
        <div className="fixed inset-0 z-[10000] flex justify-end bg-black/50" onClick={() => setRulesDrill(null)}>
          <div className="flex h-full w-[1180px] max-w-[96vw] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
              <h3 className="text-[16px] font-semibold text-[#364658]">{rulesDrill.title}</h3>
              <button type="button" onClick={() => setRulesDrill(null)} aria-label="Close" className="-mt-1 flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <AssetRegisterPage
                key={rulesDrill.title}
                embedded
                showViews={false}
                activePage="compliance-dashboard"
                stackModule="compliance-policies"
                viewsStore="cviz-rule"
                noun="rule"
                moduleCols="cviz-rule"
                defaultViewName="Rules"
                footerNoun="rules"
                rows={ruleRows}
                recordOf={() => null}
                initialFilters={rulesDrill.rules}
                filterAttrs={VIZ_RULE_FILTER_ATTRS}
                quickFilters={VIZ_RULE_QUICK_FILTERS}
                searchFields={['x_section', 'x_policyNames']}
                hideSelection
                moreActions={[]}
                onOpenRow={(t) => setRuleId(t.id)}
              />
            </div>
          </div>
        </div>
      )}

      {openRule && (
        <RuleDetailPanel
          rule={openRule}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((b) => b.name)}
          onClose={() => setRuleId(null)}
        />
      )}
    </div>
  );
}
