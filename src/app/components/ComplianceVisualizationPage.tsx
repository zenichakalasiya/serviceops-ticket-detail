/* Compliance Visualization — what the compliance policies' scans FOUND.
 * Route #/compliance-visualization[/<tab>[/<sub-tab>]], reached from the sidebar's Compliance
 * flyout (below Compliance Policy). Three tabs over the same live store:
 *
 *   Overview  — a dashboard of the estate (ComplianceVizOverview, built from the Dashboard
 *               module's widget pieces).
 *   Policies  — the shared listing (filters, quick filters, saved views, columns, pagination),
 *               List by default with a Tiles layout; a policy opens its detail page in the
 *               shared drawer, and an endpoint there opens its rule breakdown.
 *   Explorer  — Rules · Resources sub-tabs, each the shared listing with its own filters; a rule
 *               opens its results + detail, an endpoint its results.
 *
 * This page LOOKS; the Compliance Policy module acts (create, run, schedule, edit). */
import { useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetRegisterPage } from './AssetRegisterPage';
import { ComplianceVizOverview } from './ComplianceVizOverview';
import { ComplianceEndpointPanel } from './ComplianceEndpointPanel';
import { RuleDetailPanel } from './ComplianceShared';
import { benchmarksUsingRule, BENCHMARKS_SEED } from './complianceData';
import { findingsOf, getPolicy, statusOf, usePolicies, complianceEndpoint } from './compliancePolicyData';
import { postureColor, scoreColor, vizSnapshot } from './complianceVizData';
import type { PolicyStat } from './complianceVizData';
import {
  VIZ_POLICY_FILTER_ATTRS, VIZ_POLICY_QUICK_FILTERS, VIZ_RESOURCE_FILTER_ATTRS, VIZ_RESOURCE_QUICK_FILTERS,
  VIZ_RULE_FILTER_ATTRS, VIZ_RULE_QUICK_FILTERS,
} from './complianceFilterAttrs';
import { useDrawerStack } from './DrawerStack';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';
import { formatHash } from '../routes';

type Tab = 'overview' | 'policies' | 'explorer';
type Sub = 'rules' | 'resources';
const TABS: [Tab, string][] = [['overview', 'Overview'], ['policies', 'Policies'], ['explorer', 'Explorer']];

const tabBtn = (on: boolean, small = false) =>
  `-mb-px whitespace-nowrap border-b-2 px-2 ${small ? 'py-2.5 text-[13px]' : 'py-3 text-[14px]'} font-medium transition-colors ${
    on ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'
  }`;

/* A register row is the grid's Ticket shape; only the fields the grid reads are real. */
const base = (id: string, subject: string): Ticket => ({
  id, subject, requester: '', assignedTo: { name: '', initials: '' },
  dueBy: new Date(), createdBy: new Date(), status: 'Open' as Ticket['status'], priority: 'Medium' as Ticket['priority'],
} as unknown as Ticket);

const policyRow = (s: PolicyStat): Ticket => ({
  ...base(s.policy.id, s.policy.name),
  status: statusOf(s.policy) as Ticket['status'],
  x_cpPolicy: true,
  x_benchmark: s.benchmark?.name ?? '—',
  x_type: s.benchmark?.type ?? '',
  x_osVersion: s.benchmark?.osVersion ?? '',
  x_profile: s.benchmark?.profile ?? '',
  x_cpScore: s.score,
  x_posture: s.score === null ? 'Not assessed' : postureOf(s.score),
  x_endpoints: s.endpoints,
  x_nonCompliant: s.nonCompliant,
  x_failedChecks: s.failed,
  x_lastExecution: s.policy.lastScan ? new Date(s.policy.lastScan.at) : null,
  x_tags: s.policy.tags.join(', '),
} as unknown as Ticket);

const postureOf = (score: number) => (score >= 90 ? 'Secure' : score >= 70 ? 'Moderate' : score >= 50 ? 'Poor' : 'Vulnerable');

/* ── Policy tile — the Tiles layout ─────────────────────────────────────────────────────── */

function PolicyTile({ row, onOpen }: { row: Ticket; onOpen: () => void }) {
  const r = row as any;
  const score: number | null = r.x_cpScore;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition-all hover:border-[#C9D4E0] hover:shadow-sm"
    >
      <header className="flex items-start gap-2.5 px-4 pb-3 pt-3.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0]/10 text-[#3D8BD0]"><ShieldCheck size={15} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{row.id}</span>
            <h3 className="truncate text-[14px] font-semibold text-[#1E293B]" title={row.subject}>{row.subject}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {r.x_type && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#475569]">{r.x_type}</span>}
            {r.x_osVersion && <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#475569]">{r.x_osVersion}</span>}
            {r.x_profile && <span className={`rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${r.x_profile === 'L1' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F3EEFF] text-[#7C3AED]'}`}>{r.x_profile}</span>}
          </div>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1.5 text-[12px] text-[#4A5568]" title="Posture on the last scan">
          <span className="size-2 rounded-full" style={{ backgroundColor: postureColor(r.x_posture) }} />{r.x_posture}
        </span>
      </header>

      <div className="grid grid-cols-2 border-t border-[#EEF2F6]">
        <div className="px-4 py-3">
          <div className="text-[12px] text-[#64748B]">Compliance</div>
          <div className="mt-0.5 text-[24px] font-semibold leading-8 tabular-nums" style={{ color: score === null ? '#94A3B8' : scoreColor(score) }}>
            {score === null ? '—' : score}{score !== null && <span className="ml-0.5 text-[13px] font-medium">%</span>}
          </div>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#EEF2F6]">
            <span className="block h-full rounded-full" style={{ width: `${score ?? 0}%`, backgroundColor: scoreColor(score) }} />
          </span>
        </div>
        <div className="border-l border-[#EEF2F6] px-4 py-3">
          <div className="text-[12px] text-[#64748B]">Endpoints</div>
          <div className="mt-0.5 text-[24px] font-semibold leading-8 tabular-nums text-[#1E293B]">{r.x_endpoints}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">{r.x_nonCompliant} non-compliant</div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between bg-[#F7F9FC] px-4 py-2.5">
        <span className="text-[12px] text-[#64748B]">Last Failed Scan</span>
        <span className={`text-[18px] font-semibold tabular-nums ${r.x_failedChecks ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>{score === null ? '—' : r.x_failedChecks}</span>
      </footer>
    </article>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────────────────── */

export function ComplianceVisualizationPage({ tab: tabRoute, onNavigate }: { tab?: string; onNavigate?: (page: string) => void }) {
  const [tabPart, subPart] = (tabRoute ?? '').split('/');
  const tab: Tab = (['policies', 'explorer'] as string[]).includes(tabPart) ? (tabPart as Tab) : 'overview';
  const sub: Sub = subPart === 'resources' ? 'resources' : 'rules';
  const go = (t: Tab, s?: Sub) => {
    window.location.hash = formatHash({ page: 'compliance-visualization', viz: t === 'overview' ? undefined : t === 'explorer' ? `explorer/${s ?? sub}` : t });
  };

  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const { open } = useDrawerStack();
  const [endpoint, setEndpoint] = useState<string | null>(null);
  /* The listings' saved-views rail, toggled from the page's own title row. */
  const [viewsOpen, setViewsOpen] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(null);

  const openPolicy = (id: string) => {
    const p = getPolicy(id);
    if (p) open('compliance-policies', p.id, p.name, p);
  };

  /* ── Policies ── */
  const policyRows = useMemo(() => v.stats.map(policyRow), [v]);
  const policyCards = (rows: Ticket[]): StatCard[] => {
    const scored = rows.filter((t) => (t as any).x_cpScore !== null);
    const avg = scored.length ? Math.round(scored.reduce((a, t) => a + Number((t as any).x_cpScore), 0) / scored.length) : null;
    const below = rows.filter((t) => ['Poor', 'Vulnerable'].includes((t as any).x_posture));
    return [
      { label: 'Policies', value: rows.length, sub: `${scored.length} scanned` },
      { label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: 'across scanned policies', valueColor: avg === null ? undefined : scoreColor(avg) },
      { label: 'Poor or Vulnerable', value: below.length, sub: 'policies under 70%', valueColor: below.length ? '#DC2626' : undefined, filter: [{ field: 'x_posture', condition: 'is', values: ['Poor', 'Vulnerable'] }] },
      { label: 'Failed Checks', value: rows.reduce((a, t) => a + Number((t as any).x_failedChecks ?? 0), 0), sub: 'in the last scans', valueColor: '#DC2626' },
    ];
  };

  /* ── Explorer · Rules ── */
  const ruleRows = useMemo(() => v.rules.map((r) => ({
    ...base(r.rule.id, r.rule.name),
    x_severity: r.rule.severity,
    x_type: r.rule.type,
    x_osVersion: `${r.rule.platform} ${r.rule.version}`,
    x_profile: r.rule.profile,
    x_section: `${r.rule.section[0]} ${r.rule.section[1]}`,
    x_policies: r.policies.length,
    x_policyNames: r.policies.map((p) => p.name).join(', '),
    x_checked: r.checked,
    x_failing: r.failing,
    x_cpScore: r.score,
    x_result: r.failing ? 'Failing' : 'All passing',
  } as unknown as Ticket)), [v]);

  /* ── Explorer · Resources ── */
  const resourceRows = useMemo(() => v.endpoints.map((e) => ({
    ...base(e.endpoint.id, e.endpoint.hostName),
    x_idDot: e.endpoint.agentOnline ? '#22C55E' : '#F59E0B',
    x_idDotTip: e.endpoint.agentOnline ? 'Agent online' : 'Agent offline',
    x_ip: e.endpoint.ip,
    x_type: e.endpoint.type,
    x_osVersion: e.endpoint.osVersion,
    x_office: e.endpoint.office,
    x_posture: e.posture ?? 'Not assessed',
    x_policies: e.policies.length,
    x_policyNames: e.policies.map((p) => p.name).join(', '),
    x_failedChecks: e.score === null ? null : e.failed,
    x_cpScore: e.score,
    x_scanStatus: e.notReached ? 'Not reached' : e.lastScan ? 'Success' : 'Not scanned',
    x_lastExecution: e.lastScan ? new Date(e.lastScan) : null,
  } as unknown as Ticket)), [v]);

  /* A rule's Results tab: every endpoint it ran on, failing first. */
  const ruleResultsEl = (id: string) => {
    const rows = policies.flatMap((p) => findingsOf(p).filter((f) => f.ruleId === id).map((f) => ({ f, p })))
      .sort((a, b) => Number(a.f.passed) - Number(b.f.passed));
    const fail = rows.filter((x) => !x.f.passed).length;
    return (
      <div>
        <p className="mb-3 text-[13px] text-[#64748B]">
          Failing on <span className="font-semibold text-[#DC2626]">{fail}</span> of {rows.length} endpoints checked.
        </p>
        <table className="w-full table-fixed text-left">
          <thead className="border-b border-[#e5e7eb]">
            <tr>{['Endpoint', 'Host Name', 'Policy', 'Result'].map((h) => <th key={h} className="px-3 py-2 text-[12px] font-semibold text-[#364658]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {rows.map(({ f, p }) => (
              <tr key={`${p.id}-${f.endpointId}`} className="cursor-pointer hover:bg-[#f9fafb]" onClick={() => { setRuleId(null); setEndpoint(f.endpointId); }}>
                <td className="px-3 py-2.5"><span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{f.endpointId}</span></td>
                <td className="truncate px-3 py-2.5 text-[13px] text-[#364658]">{complianceEndpoint(f.endpointId)?.hostName}</td>
                <td className="truncate px-3 py-2.5 text-[13px] text-[#364658]" title={p.name}>{p.name}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-sm px-1.5 py-0.5 text-[12px] font-medium ${f.passed ? 'bg-[#ECFDF3] text-[#15803D]' : 'bg-[#FEF3F2] text-[#B42318]'}`}>{f.passed ? 'Pass' : 'Fail'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  const openRule = ruleId ? v.rules.find((r) => r.rule.id === ruleId)?.rule : null;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="compliance-visualization" onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} />
        <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between px-6 pb-1 pt-3">
            <div className="flex items-center gap-3">
              {tab !== 'overview' && (
                <button
                  type="button"
                  onClick={() => setViewsOpen((o) => !o)}
                  title={viewsOpen ? 'Hide views' : 'Show views'}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded border transition-colors ${viewsOpen ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#6b7280] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
                >
                  {viewsOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                </button>
              )}
              <h1 className="text-[17px] font-semibold text-[#1E293B]">Compliance Visualization</h1>
            </div>
            <span className="text-[12px] text-[#7B8FA5]">
              {v.stats.filter((s) => s.score !== null).length} of {v.stats.length} policies scanned · latest results
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-6">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => go(id)} className={tabBtn(tab === id)}>{label}</button>
            ))}
          </div>
        </div>
        {tab === 'explorer' && (
          /* The sub-tabs are the Relations tab's filter pills (ticket detail page): bordered,
             the chosen one light blue with a filled count badge. */
          <div className="flex flex-shrink-0 items-center gap-2 bg-white px-6 pt-4">
            {([['rules', 'Rules', ruleRows.length], ['resources', 'Resources', resourceRows.length]] as [Sub, string, number][]).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                onClick={() => go('explorer', id)}
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${sub === id ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'}`}
              >
                {label}
                <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${sub === id ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>{n}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'overview' && (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FB]">
            <ComplianceVizOverview onOpenPolicy={openPolicy} onOpenEndpoint={setEndpoint} />
          </div>
        )}

        {tab === 'policies' && (
          <AssetRegisterPage
            key="policies"
            embedded
            viewsOpen={viewsOpen}
            onViewsOpenChange={setViewsOpen}
            activePage="compliance-visualization"
            stackModule="compliance-policies"
            viewsStore="cviz-policy"
            noun="policy"
            moduleCols="cviz-policy"
            defaultViewName="All Policies"
            footerNoun="policies"
            rows={policyRows}
            recordOf={(id) => getPolicy(id)}
            filterAttrs={VIZ_POLICY_FILTER_ATTRS}
            quickFilters={VIZ_POLICY_QUICK_FILTERS}
            layouts={['list', 'list-kpi']}
            buildCards={policyCards}
            renderTiles={(rows, openRow) => (
              rows.length ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3 px-6 py-3">
                  {rows.map((t) => <PolicyTile key={t.id} row={t} onOpen={() => openRow(t)} />)}
                </div>
              ) : (
                <div className="px-6 py-16 text-center text-[13px] text-[#9CA3AF]">No policy matches this search and filter.</div>
              )
            )}
            searchFields={['x_benchmark', 'x_osVersion', 'x_tags']}
            lockedCells={['status']}
            hideSelection
            moreActions={[]}
            onNavigate={onNavigate}
          />
        )}

        {tab === 'explorer' && sub === 'rules' && (
          <AssetRegisterPage
            key="rules"
            embedded
            viewsOpen={viewsOpen}
            onViewsOpenChange={setViewsOpen}
            activePage="compliance-visualization"
            stackModule="compliance-policies"
            viewsStore="cviz-rule"
            noun="rule"
            moduleCols="cviz-rule"
            defaultViewName="All Rules"
            footerNoun="rules"
            rows={ruleRows}
            recordOf={() => null}
            filterAttrs={VIZ_RULE_FILTER_ATTRS}
            quickFilters={VIZ_RULE_QUICK_FILTERS}
            searchFields={['x_section', 'x_osVersion', 'x_policyNames']}
            hideSelection
            moreActions={[]}
            onOpenRow={(t) => setRuleId(t.id)}
            onNavigate={onNavigate}
          />
        )}

        {tab === 'explorer' && sub === 'resources' && (
          <AssetRegisterPage
            key="resources"
            embedded
            viewsOpen={viewsOpen}
            onViewsOpenChange={setViewsOpen}
            activePage="compliance-visualization"
            stackModule="endpoints"
            viewsStore="cviz-resource"
            noun="endpoint"
            moduleCols="cviz-resource"
            defaultViewName="All Endpoints"
            footerNoun="endpoints"
            rows={resourceRows}
            recordOf={() => null}
            filterAttrs={VIZ_RESOURCE_FILTER_ATTRS}
            quickFilters={VIZ_RESOURCE_QUICK_FILTERS}
            searchFields={['x_ip', 'x_osVersion', 'x_office', 'x_policyNames']}
            hideSelection
            moreActions={[]}
            onOpenRow={(t) => setEndpoint(t.id)}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {endpoint && <ComplianceEndpointPanel endpointId={endpoint} onClose={() => setEndpoint(null)} />}
      {openRule && (
        <RuleDetailPanel
          rule={openRule}
          usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((b) => b.name)}
          results={ruleResultsEl(openRule.id)}
          onClose={() => setRuleId(null)}
        />
      )}
    </div>
  );
}
