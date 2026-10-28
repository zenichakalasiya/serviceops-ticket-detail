/* Compliance › Rules — #/compliance-rules, second page of the sidebar's Compliance flyout.
 * The technician's READ of the rule catalogue: the admin Rules columns, plus how each rule fares
 * across the estate — how many endpoints check it, and the Rule Score (endpoints passing ÷
 * endpoints checked). A row opens the rule in a side panel whose FIRST tab is Endpoints: one row
 * per endpoint (Fail when any policy fails it there), with search and filters, then the rule's
 * metadata tabs. An endpoint row opens the Endpoint page. */
import { useMemo, useState } from 'react';
import { Building2, CircleDot, Monitor, Search, ShieldCheck } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { StatsCardsRow } from './AssetStatsRow';
import type { StatCard } from './AssetStatsRow';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { matchRules, optionsOf, RuleDetailPanel, selectAttr } from './ComplianceShared';
import { ResultPill } from './ComplianceEndpointPanel';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { BENCHMARKS_SEED, benchmarksUsingRule, RULES, ruleById } from './complianceData';
import type { ComplianceRule } from './complianceData';
import { usePolicies } from './compliancePolicyData';
import { ruleEndpointResults, ruleScore, vizSnapshot } from './complianceVizData';
import type { RuleEndpointResult, RuleResult } from './complianceVizData';
import { ruleRow } from './complianceRows';
import { VIZ_RULE_FILTER_ATTRS, VIZ_RULE_QUICK_FILTERS } from './complianceFilterAttrs';
import type { Ticket } from './TicketListPage';

const DIM = '#94A3B8';
const th = 'px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
const RESULT_OPTIONS = [{ label: 'Fail', color: '#EF4444' }, { label: 'Pass', color: '#22C55E' }, { label: 'Not Scanned', color: '#94A3B8' }];
const IdPill = ({ id }: { id: string }) => <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{id}</span>;

/* The catalogue at a glance. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const checked = rows.filter((t) => (t as any).x_endpoints > 0);
  const failing = rows.filter((t) => (t as any).x_failingEps > 0);
  return [
    { label: 'Rules', value: rows.length, sub: 'in the catalogue' },
    { label: 'Checked', value: checked.length, sub: 'run on at least one endpoint' },
    { label: 'Failing', value: failing.length, sub: 'fail on at least one endpoint', valueColor: failing.length ? '#B42318' : undefined, filter: [{ field: 'x_result', condition: 'is', values: ['Failing'] }] },
    { label: 'Not Checked', value: rows.length - checked.length, sub: 'no policy runs them', filter: [{ field: 'x_result', condition: 'is', values: ['Not checked'] }] },
  ];
};

/** The rule panel's first tab — every endpoint the rule is checked on, one row each. */
function RuleEndpointsTab({ results, onOpened }: { results: RuleEndpointResult[]; onOpened: () => void }) {
  const open = useOpenComplianceEndpoint();
  /* The endpoint page opens in the shared drawer, which sits under this panel — so the panel steps aside. */
  const openEndpoint = (id: string) => { onOpened(); open(id); };
  const [q, setQ] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [card, setCard] = useState<RuleResult | null>(null);

  const valueOf = (r: RuleEndpointResult, k: string): string | string[] =>
    k === 'office' ? r.endpoint.office : k === 'result' ? r.result : k === 'type' ? r.endpoint.type : k === 'policy' ? r.policies.map((p) => p.name) : '';
  const attrs = useMemo(() => [
    selectAttr('office', 'Remote Office', Building2, optionsOf(results, (r) => r.endpoint.office).map(({ label }) => ({ label }))),
    selectAttr('result', 'Result', CircleDot, RESULT_OPTIONS),
    selectAttr('policy', 'Policy', ShieldCheck, optionsOf(results, (r) => r.policies.map((p) => p.name)).map(({ label }) => ({ label }))),
    selectAttr('type', 'Type', Monitor, optionsOf(results, (r) => r.endpoint.type).map(({ label }) => ({ label }))),
  ], [results]);
  const quick = useMemo<QuickFilterDef[]>(() => [
    { field: 'office', icon: Building2, tip: 'Filter by remote office', title: 'Remote Office is', width: 220, row: 'plain', options: attrs[0].options! },
    { field: 'result', icon: CircleDot, tip: 'Filter by result', title: 'Result is', width: 180, row: 'dot', options: attrs[1].options! },
    { field: 'policy', icon: ShieldCheck, tip: 'Filter by policy', title: 'Policy is', width: 260, row: 'plain', options: attrs[2].options! },
    { field: 'type', icon: Monitor, tip: 'Filter by type', title: 'Type is', width: 180, row: 'plain', options: attrs[3].options! },
  ], [attrs]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return matchRules(results, rules, valueOf)
      .filter((r) => !card || r.result === card)
      .filter((r) => !s || [r.endpoint.id, r.endpoint.hostName, r.endpoint.ip, r.endpoint.office].some((x) => x.toLowerCase().includes(s)));
  }, [results, rules, card, q]);

  if (!results.length) return <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy checks this rule on any endpoint yet.</p>;

  const n = (r: RuleResult) => results.filter((x) => x.result === r).length;
  const score = ruleScore(results);
  const cards: StatCard[] = [
    { label: 'Rule Score', value: score === null ? '—' : `${score}%`, sub: 'of checked endpoints pass', static: true, valueColor: score === null ? DIM : score >= 85 ? '#15803D' : score >= 60 ? '#B45309' : '#B42318' },
    { label: 'Pass', value: n('Pass'), sub: 'endpoints', valueColor: n('Pass') ? '#15803D' : DIM, hint: 'Show only endpoints that pass' },
    { label: 'Fail', value: n('Fail'), sub: 'endpoints', valueColor: n('Fail') ? '#B42318' : DIM, hint: 'Show only endpoints that fail' },
    { label: 'Not Scanned', value: n('Not Scanned'), sub: 'endpoints', valueColor: DIM, hint: 'Show only endpoints not scanned yet' },
  ];

  return (
    <div className="-mx-5 -mt-4">
      <div className="pt-4">
        <StatsCardsRow rules={[]} onApplyFilter={() => {}} activeLabel={card} onCardClick={(c) => setCard(c.label === card ? null : (c.label as RuleResult))} cards={cards} />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-1">
        <label className="flex h-8 w-[280px] items-center gap-2 rounded border border-[#DFE5ED] px-2.5 focus-within:border-[#3D8BD0]">
          <Search size={14} className="flex-shrink-0 text-[#9CA3AF]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF]" />
        </label>
        <TicketFilterBar rules={rules} setRules={setRules} noun="endpoint" attrs={attrs} quickFilters={quick} showFilterBuilder={false} />
        <span className="ml-auto text-[12px] text-[#7B8FA5]">{shown.length} of {results.length} endpoints</span>
      </div>
      <table className="w-full table-fixed">
        <colgroup><col className="w-[30%]" /><col className="w-[11%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col /><col className="w-[110px]" /></colgroup>
        <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'Type', 'IP Address', 'Remote Office', 'Policies', 'Result'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {shown.map((r) => (
            <tr key={r.endpoint.id} onClick={() => openEndpoint(r.endpoint.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
              <td className="px-4 py-3">
                <span className="flex min-w-0 items-center gap-2"><IdPill id={r.endpoint.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{r.endpoint.hostName}</span></span>
              </td>
              <td className="px-4 py-3 text-[13px] text-[#64748B]">{r.endpoint.type}</td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{r.endpoint.ip}</td>
              <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{r.endpoint.office}</span></td>
              <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]" title={r.policies.map((p) => p.name).join(', ')}>{r.policies.map((p) => p.name).join(', ')}</span></td>
              <td className="px-4 py-3"><ResultPill passed={r.result === 'Not Scanned' ? null : r.result === 'Pass'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!shown.length && <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No endpoint matches these filters.</p>}
    </div>
  );
}

export function ComplianceRulesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const rows = useMemo(() => RULES.map((r) => ruleRow(r, v.rules.find((s) => s.rule.id === r.id), ruleEndpointResults(r.id, policies))), [v, policies]);
  const [openId, setOpenId] = useState<string | null>(null);
  const rule: ComplianceRule | undefined = openId ? ruleById(openId) : undefined;

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-rules"
        stackModule="compliance-rules"
        viewsStore="cviz-rule"
        noun="rule"
        moduleCols="cviz-rule"
        defaultViewName="All Rules"
        footerNoun="rules"
        rows={rows}
        recordOf={() => null}
        filterAttrs={VIZ_RULE_FILTER_ATTRS}
        quickFilters={VIZ_RULE_QUICK_FILTERS}
        layouts={['list-kpi', 'list']}
        buildCards={buildCards}
        searchFields={['x_desc', 'x_platform']}
        hideSelection
        moreActions={[]}
        onOpenRow={(t) => setOpenId(t.id)}
        onNavigate={onNavigate}
      />
      {rule && (
        <RuleDetailPanel
          rule={rule}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, rule.id).map((b) => b.name)}
          onClose={() => setOpenId(null)}
          wide
          firstTab={{ label: 'Endpoints', node: <RuleEndpointsTab results={ruleEndpointResults(rule.id, policies)} onOpened={() => setOpenId(null)} /> }}
        />
      )}
    </>
  );
}
