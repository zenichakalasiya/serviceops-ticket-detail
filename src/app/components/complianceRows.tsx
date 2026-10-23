/* Compliance, technician side — the register ROWS the Benchmark and Endpoints pages draw, and
 * the rule-results table their side panels show. One file so the two pages (and a benchmark's
 * rule drill-in) read a rule or an endpoint the same way. Nothing here is stored: every row is
 * rebuilt from vizSnapshot(), so a Run Now moves them all at once. */
import { complianceEndpoint, findingsOf } from './compliancePolicyData';
import type { CompliancePolicy } from './compliancePolicyData';
import type { ComplianceRule } from './complianceData';
import type { BenchmarkStat, EndpointStat, RuleStat } from './complianceVizData';
import type { Ticket } from './TicketListPage';

/** A register row is the grid's Ticket shape; only the fields the grid reads are real. */
export const baseRow = (id: string, subject: string): Ticket => ({
  id, subject, requester: '', assignedTo: { name: '', initials: '' },
  dueBy: new Date(), createdBy: new Date(), status: 'Open' as Ticket['status'], priority: 'Medium' as Ticket['priority'],
} as unknown as Ticket);

export const benchmarkRow = (s: BenchmarkStat): Ticket => ({
  ...baseRow(s.benchmark.id, s.benchmark.name),
  x_type: s.benchmark.type,
  x_osVersion: s.benchmark.osVersion,
  x_profile: s.benchmark.profile,
  x_origin: s.benchmark.origin,
  x_rules: s.rules,
  x_policies: s.policies.length,
  x_policyNames: s.policies.map((p) => p.name).join(', '),
  x_inUse: s.policies.length ? 'In use' : 'Unused',
  x_endpoints: s.endpoints,
  x_failingRules: s.score === null ? null : s.failingRules,
  x_cpScore: s.score,
  x_posture: s.posture ?? 'Not assessed',
  x_tags: s.benchmark.tags.join(', '),
  x_lastExecution: s.lastScan ? new Date(s.lastScan) : null,
} as unknown as Ticket);

/** A rule row. A rule no policy has checked yet still lists, with dashes rather than zeros —
 *  "0 failing" would claim it passed. */
export const ruleRow = (rule: ComplianceRule, stat?: RuleStat): Ticket => ({
  ...baseRow(rule.id, rule.name),
  x_severity: rule.severity,
  x_type: rule.type,
  x_osVersion: `${rule.platform} ${rule.version}`,
  x_profile: rule.profile,
  x_section: `${rule.section[0]} ${rule.section[1]}`,
  x_policies: stat?.policies.length ?? 0,
  x_policyNames: stat?.policies.map((p) => p.name).join(', ') ?? '',
  x_checked: stat?.checked ?? null,
  x_failing: stat ? stat.failing : null,
  x_cpScore: stat?.score ?? null,
  x_result: !stat ? 'Not checked' : stat.failing ? 'Failing' : 'All passing',
} as unknown as Ticket);

export const endpointRow = (e: EndpointStat): Ticket => ({
  ...baseRow(e.endpoint.id, e.endpoint.hostName),
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
} as unknown as Ticket);

/** A rule's Results tab: every endpoint it ran on, failing first. `only` narrows it to the
 *  policies of one benchmark; a row click opens that endpoint. */
export function RuleResults({ ruleId, policies, onOpenEndpoint }: {
  ruleId: string;
  policies: CompliancePolicy[];
  onOpenEndpoint: (endpointId: string) => void;
}) {
  const rows = policies.flatMap((p) => findingsOf(p).filter((f) => f.ruleId === ruleId).map((f) => ({ f, p })))
    .sort((a, b) => Number(a.f.passed) - Number(b.f.passed));
  const fail = rows.filter((x) => !x.f.passed).length;
  if (!rows.length) {
    return <p className="rounded-lg border border-dashed border-[#DFE5ED] px-4 py-8 text-center text-[13px] text-[#7B8FA5]">No policy has checked this rule yet.</p>;
  }
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
            <tr key={`${p.id}-${f.endpointId}`} className="cursor-pointer hover:bg-[#f9fafb]" onClick={() => onOpenEndpoint(f.endpointId)}>
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
}

