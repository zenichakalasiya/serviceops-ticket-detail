/* Compliance, technician side — the register ROWS the Benchmark and Endpoints pages draw, and
 * the rule-results table their side panels show. One file so the two pages (and a benchmark's
 * rule drill-in) read a rule or an endpoint the same way. Nothing here is stored: every row is
 * rebuilt from vizSnapshot(), so a Run Now moves them all at once. */
import { complianceEndpoint, endpointResults, findingsOf } from './compliancePolicyData';
import type { CompliancePolicy } from './compliancePolicyData';
import type { ComplianceRule } from './complianceData';
import { profileLabel, ruleCode } from './complianceData';
import type { BenchmarkStat, EndpointStat, RuleEndpointResult, RuleStat } from './complianceVizData';
import { ruleScore } from './complianceVizData';
import { scoreBand } from './complianceFilterAttrs';
import type { Ticket } from './TicketListPage';
import { mockEndpoints } from './EndpointsListPage';
import type { ComplianceEndpoint } from './compliancePolicyData';

/* The inventory columns the Endpoints listing offers in column selection (Zeni, 17 Nov 2026).
   A machine from the Endpoints module keeps what that module knows of it (architecture, service
   pack, health, reboot); everything else is DERIVED from the endpoint's id, so a row reads the same
   on every load. Sample data — no real inventory feed behind it. */
const h32 = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const OFFICE_CODE: Record<string, string> = { 'Ahmedabad HQ': 'AHM', 'Mumbai Office': 'MUM', 'Bengaluru Campus': 'BLR', 'Hyderabad Office': 'HYD', 'Pune Development Center': 'PUN', 'Delhi NCR Office': 'DEL', 'Chennai Office': 'CHN', 'Dubai Office': 'DXB', 'Muscat Office': 'MCT' };
const LINUX_USERS = ['root', 'svc-deploy', 'ansible', 'ubuntu', 'ec2-user'];
const WIN_USERS = ['MOTADATA\\administrator', 'MOTADATA\\kavit.gohel', 'MOTADATA\\neha.shah', 'MOTADATA\\svc-backup', 'MOTADATA\\dharti.patel'];
const MONTHS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function auditTally(e: EndpointStat) {
  let ok = 0, bad = 0, none = 0;
  for (const p of e.policies) {
    const r = endpointResults(p).find((x) => x.endpoint.id === e.endpoint.id);
    if (!r || r.outcome === 'Not Scanned') none++; else if (r.outcome === 'Compliant') ok++; else bad++;
  }
  return { x_cpAuditOk: ok, x_cpAuditBad: bad, x_cpAuditNone: none };
}
function inventoryOf(e: ComplianceEndpoint) {
  const real = mockEndpoints.find((m) => m.id === e.id);
  const h = h32(e.id);
  const num = Number(e.id.replace(/\D/g, '')) || h % 900;
  const win = e.type === 'Windows';
  const day = 1 + (h % 27), hr = h % 24, mi = (h >>> 5) % 60;
  return {
    x_arch: real?.architecture ?? '64 BIT',
    x_servicePack: real?.servicePack ?? 'None',
    x_assetId: `AST-${4000 + num}`,
    x_ciId: `CI-${num}`,
    x_poller: `${OFFICE_CODE[e.office] ?? 'AHM'}-POLLER-0${1 + (h % 2)}`,
    x_agentVersion: `9.${2 + (h % 2)}.${(h >>> 3) % 6}`,
    x_credProfile: win ? 'Windows Domain Admin' : e.type === 'Linux' ? 'Linux SSH Key' : 'Network SSH Read-only',
    x_health: real?.systemHealth ?? (!e.agentOnline ? 'Not reported' : h % 7 === 0 ? 'Warning' : 'Healthy'),
    x_language: h % 9 === 0 ? 'English (UK)' : 'English (US)',
    x_lastReboot: `${String(day).padStart(2, '0')} ${MONTHS3[(h >>> 7) % 2 ? 9 : 10]} 2026, ${String(((hr + 11) % 12) + 1).padStart(2, '0')}:${String(mi).padStart(2, '0')} ${hr < 12 ? 'AM' : 'PM'}`,
    x_reboot: real?.rebootRequired ?? (h % 5 === 0 ? 'Yes' : 'No'),
    x_lastUser: (win ? WIN_USERS : LINUX_USERS)[(h >>> 4) % 5],
  };
}

/** A register row is the grid's Ticket shape; only the fields the grid reads are real. */
export const baseRow = (id: string, subject: string): Ticket => ({
  id, subject, requester: '', assignedTo: { name: '', initials: '' },
  dueBy: new Date(), createdBy: new Date(), status: 'Open' as Ticket['status'], priority: 'Medium' as Ticket['priority'],
} as unknown as Ticket);

export const benchmarkRow = (s: BenchmarkStat): Ticket => ({
  ...baseRow(s.benchmark.id, s.benchmark.name),
  x_type: s.benchmark.type,
  x_osVersion: s.benchmark.osVersion,
  x_profile: profileLabel(s.benchmark.profile),
  x_origin: s.benchmark.origin,
  x_rules: s.rules,
  x_policies: s.policies.length,
  x_policyNames: s.policies.map((p) => p.name).join(', '),
  x_inUse: s.policies.length ? 'In use' : 'Unused',
  x_endpoints: s.endpoints,
  x_failingRules: s.score === null ? null : s.failingRules,
  x_cpScore: s.score,
  x_posture: s.posture ?? 'Not assessed',
  x_lastExecution: s.lastScan ? new Date(s.lastScan) : null,
} as unknown as Ticket);

/** A rule row. A rule no policy has checked yet still lists, with dashes rather than zeros —
 *  "0 failing" would claim it passed. */
export const ruleRow = (rule: ComplianceRule, stat?: RuleStat, eps?: RuleEndpointResult[]): Ticket => ({
  ...baseRow(rule.id, rule.name),
  x_ruleCode: ruleCode(rule.id),
  x_desc: rule.description,
  x_severity: rule.severity,
  x_type: rule.type,
  x_platform: rule.platform,
  x_version: rule.version,
  x_assessment: rule.assessment,
  x_osVersion: `${rule.platform} ${rule.version}`,
  // Endpoint-level: one endpoint counts once, Fail when any policy fails it there.
  x_endpoints: eps ? eps.length : 0,
  x_passing: eps ? eps.filter((r) => r.result === 'Pass').length : 0,
  x_failingEps: eps ? eps.filter((r) => r.result === 'Fail').length : 0,
  x_profile: rule.profile,
  x_section: `${rule.section[0]} ${rule.section[1]}`,
  x_policies: stat?.policies.length ?? 0,
  x_policyNames: stat?.policies.map((p) => p.name).join(', ') ?? '',
  x_checked: stat?.checked ?? null,
  x_failing: stat ? stat.failing : null,
  x_cpScore: eps ? ruleScore(eps) : (stat?.score ?? null),
  x_scoreBand: scoreBand(eps ? ruleScore(eps) : (stat?.score ?? null), 'Not checked'),
  x_result: !stat ? 'Not checked' : stat.failing ? 'Failing' : 'All passing',
} as unknown as Ticket);

export const endpointRow = (e: EndpointStat): Ticket => ({
  ...baseRow(e.endpoint.id, e.endpoint.hostName),
  x_idDot: e.endpoint.agentOnline ? '#22C55E' : '#F59E0B',
  x_idDotTip: e.endpoint.agentOnline ? 'Agent online' : 'Agent offline',
  x_ip: e.endpoint.ip,
  x_type: e.endpoint.type,
  x_osName: e.endpoint.osName,
  x_osVersion: e.endpoint.osVersion,
  /* Across its audits: Non-Compliant when any check failed on the last scan; a dash before any scan. */
  x_cpResult: e.score === null ? null : e.failed > 0 ? 'Non-Compliant' : 'Compliant',
  /* How its audits came out on this endpoint — the Compliance Result tooltip (Zeni, 18 Nov 2026). */
  ...auditTally(e),
  ...inventoryOf(e.endpoint),
  x_office: e.endpoint.office,
  x_posture: e.posture ?? 'Not assessed',
  x_policies: e.policies.length,
  x_policyNames: e.policies.map((p) => p.name).join(', '),
  x_failedChecks: e.score === null ? null : e.failed,
  x_cpScore: e.score,
  x_scoreBand: scoreBand(e.score),
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

