/* Compliance › Rules — #/compliance-rules, second page of the sidebar's Compliance flyout.
 * The technician's READ of the rule catalogue: the admin Rules columns, plus how each rule fares
 * across the estate — how many endpoints check it, and the Rule Score (endpoints passing ÷
 * endpoints checked). A row opens the rule in a side panel whose FIRST tab is Endpoints: one row
 * per endpoint (Fail when any policy fails it there), with search and filters, then the rule's
 * metadata tabs. An endpoint row opens the Endpoint page. */
import { ComplianceVersionMenu } from './ComplianceVersionMenu';
import { useMemo, useState } from 'react';
import { Building2, CircleDot, Monitor, Search, ShieldCheck } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { StatsCardsRow } from './AssetStatsRow';
import type { StatCard } from './AssetStatsRow';
import { ColumnFilterSearch, useColumnFilter } from './ColumnFilterSearch';
import type { ColumnField } from './ColumnFilterSearch';
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
import { useUncheckedRuleUi } from './complianceUncheckedRuleUi';

/** A rule no audit has run yet: the rule sheet waits beside an endpoint nothing has scanned. */
function RuleNotRunArt() {
  return (
    <svg width="168" height="116" viewBox="0 0 168 116" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="84" cy="62" rx="72" ry="46" fill="#F3F7FC" />
      {/* the endpoint, behind — dashed screen: never scanned */}
      <rect x="86" y="30" width="56" height="40" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="92" y="36" width="44" height="28" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <path d="M106 77 H122 M114 70 V77" stroke="#CBD5E1" strokeWidth="1.75" strokeLinecap="round" />
      {/* a dotted path from the rule to the endpoint — the run that has not happened */}
      <path d="M70 52 C 78 52, 80 50, 88 50" stroke="#9DC3E8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
      {/* the rule sheet, in front */}
      <rect x="26" y="24" width="48" height="62" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="33" y="33" width="3" height="10" rx="1.5" fill="#F59E0B" />
      <rect x="40" y="34" width="26" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="40" y="40" width="18" height="2.5" rx="1.25" fill="#E2E8F0" />
      {[52, 60, 68].map((y) => (
        <g key={y}>
          <rect x="33" y={y - 2.5} width="5" height="5" rx="1.2" stroke="#CBD5E1" strokeWidth="1.1" />
          <rect x="42" y={y - 1.25} width={y === 60 ? 18 : 24} height="2.5" rx="1.25" fill="#EEF2F6" />
        </g>
      ))}
      {/* the clock: waiting for its first scan */}
      <circle cx="70" cy="82" r="12" fill="#FFFFFF" stroke="#3D8BD0" strokeWidth="2" />
      <path d="M70 76 V82 L74 85" stroke="#3D8BD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** V2: the Endpoints tab of a rule no audit has run. */
function RuleNotRunEmpty() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <RuleNotRunArt />
      <p className="mt-4 text-[14px] font-semibold text-[#364658]">Not run on any endpoint yet</p>
      <p className="mt-1 max-w-[560px] text-[13px] leading-[1.6] text-[#7B8FA5]">Results appear here once a compliance audit that includes this rule scans its endpoints.</p>
    </div>
  );
}

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

const RULE_EP_FIELDS: ColumnField<RuleEndpointResult>[] = [
  { label: 'Endpoint ID', get: (r) => r.endpoint.id },
  { label: 'Host Name', get: (r) => r.endpoint.hostName },
  { label: 'OS Type', get: (r) => r.endpoint.type },
  { label: 'IP Address', get: (r) => r.endpoint.ip },
  { label: 'Remote Office', get: (r) => r.endpoint.office },
  { label: 'Policies', get: (r) => r.policies.map((p) => p.name) },
  { label: 'Result', get: (r) => r.result },
];

/** The rule panel's first tab — every endpoint the rule is checked on, one row each. */
function RuleEndpointsTab({ results, onOpened }: { results: RuleEndpointResult[]; onOpened: () => void }) {
  const open = useOpenComplianceEndpoint();
  /* The endpoint page opens in the shared drawer, which sits under this panel — so the panel steps aside. */
  const openEndpoint = (id: string) => { onOpened(); open(id); };
  const [card, setCard] = useState<RuleResult | null>(null);
  /* Type to search every column, or click the box to filter one column: field → operator → value. */
  const f = useColumnFilter(results, RULE_EP_FIELDS);
  const shown = useMemo(() => f.filtered.filter((r) => !card || r.result === card), [f.filtered, card]);

  if (!results.length) return <RuleNotRunEmpty />;

  const n = (r: RuleResult) => results.filter((x) => x.result === r).length;
  const score = ruleScore(results);
  const cards: StatCard[] = [
    { label: 'Rule Score', value: score === null ? '—' : `${score}%`, sub: '', static: true, valueColor: score === null ? DIM : score >= 85 ? '#15803D' : score >= 60 ? '#B45309' : '#B42318' },
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
        <ColumnFilterSearch className="min-w-0 flex-1" rows={results} fields={RULE_EP_FIELDS} query={f.query} onQuery={f.setQuery} conditions={f.conditions} onConditions={f.setConditions} />
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] table-fixed">
        <colgroup><col className="w-[30%]" /><col className="w-[11%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col /><col className="w-[110px]" /></colgroup>
        <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'OS Type', 'IP Address', 'Remote Office', 'Policies', 'Result'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {shown.map((r) => (
            <tr key={r.endpoint.id} onClick={() => openEndpoint(r.endpoint.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
              <td className="px-4 py-3">
                <span className="flex min-w-0 items-center gap-2"><IdPill id={r.endpoint.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{r.endpoint.hostName}</span></span>
              </td>
              <td className="px-4 py-3 text-[13px] text-[#64748B]">{r.endpoint.type}</td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-[#64748B]">{r.endpoint.ip}</td>
              <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]">{r.endpoint.office}</span></td>
              <td className="px-4 py-3"><span className="block text-[13px] tabular-nums text-[#64748B]" title={r.policies.map((p) => p.name).join(', ')}>{r.policies.length}</span></td>
              <td className="px-4 py-3"><ResultPill passed={r.result === 'Not Scanned' ? null : r.result === 'Pass'} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {!shown.length && <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No endpoint matches these filters.</p>}
    </div>
  );
}

export function ComplianceRulesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  /* Default order mixes the two kinds (Zeni, 17 Nov 2026): three rules an audit has run (endpoints and a
     Rule Score), then one no audit has run yet (its empty state), and so on — the catalogue's own order put
     the unrun AlmaLinux / Amazon Linux rules first, so page one had no results at all. */
  const rows = useMemo(() => {
    const all = RULES.map((r) => { const eps = ruleEndpointResults(r.id, policies); return { row: ruleRow(r, v.rules.find((s) => s.rule.id === r.id), eps), ran: eps.length > 0 }; });
    const ran = all.filter((x) => x.ran), idle = all.filter((x) => !x.ran);
    const out: typeof all = [];
    while (ran.length || idle.length) { out.push(...ran.splice(0, 3)); if (idle.length) out.push(idle.shift()!); }
    return out.map((x) => x.row);
  }, [v, policies]);
  const [openId, setOpenId] = useState<string | null>(null);
  const rule: ComplianceRule | undefined = openId ? ruleById(openId) : undefined;
  /* A rule no audit has run: V1 drops the Endpoints tab, V2 keeps it with an empty state (Zeni, 17 Nov 2026). */
  const unchecked = useUncheckedRuleUi();
  const ruleResults = rule ? ruleEndpointResults(rule.id, policies) : [];
  const showEndpointsTab = ruleResults.length > 0 || unchecked === 'v2';

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-rules"
        titleExtra={<ComplianceVersionMenu />}
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
        searchFields={['x_ruleCode', 'x_desc', 'x_platform']}
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
          firstTab={showEndpointsTab ? { label: 'Endpoints', node: <RuleEndpointsTab results={ruleResults} onOpened={() => setOpenId(null)} /> } : undefined}
        />
      )}
    </>
  );
}
