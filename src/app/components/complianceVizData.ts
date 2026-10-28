/* Compliance Visualization — every figure the Overview, Policies and Explorer tabs show,
 * rolled up from ONE source: the live policy store and its findings (findingsOf). Nothing here
 * is stored, so a Run Now, an edit or a disabled policy moves every chart at once, and two
 * widgets can never disagree — a rule's failing endpoints add up to the endpoints' failed
 * checks, and the severity tiles add up to the failed checks.
 *
 * Content follows the ObserveOps compliance prototype (Overview · Policies · Explorer); the
 * "resource" it talks about is a ServiceOps ENDPOINT. */
import { benchmarkOf, endpointResults, findingsOf, NOW, scoreOf } from './compliancePolicyData';
import type { ComplianceEndpoint, CompliancePolicy, Finding } from './compliancePolicyData';
import { BENCHMARKS_SEED, benchmarkRuleIds, ruleById, SEVERITIES } from './complianceData';
import type { Benchmark, ComplianceRule, Severity } from './complianceData';

/* ── Posture: how clean one endpoint (or policy) is, in four bands ─────────────────────── */

export type Posture = 'Secure' | 'Moderate' | 'Poor' | 'Vulnerable';
export const POSTURES: { label: Posture; min: number; color: string; range: string }[] = [
  { label: 'Secure', min: 90, color: '#22C55E', range: '90–100%' },
  { label: 'Moderate', min: 70, color: '#F59E0B', range: '70–89%' },
  { label: 'Poor', min: 50, color: '#F97316', range: '50–69%' },
  { label: 'Vulnerable', min: 0, color: '#DC2626', range: 'under 50%' },
];
export const postureOf = (score: number | null): Posture | null =>
  score === null ? null : POSTURES.find((p) => score >= p.min)!.label;
export const postureColor = (p: Posture | null | string) => POSTURES.find((x) => x.label === p)?.color ?? '#94A3B8';
/** A score's colour — the same four bands. */
export const scoreColor = (s: number | null) => (s === null ? '#94A3B8' : postureColor(postureOf(s)));

export const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: '#DC2626', High: '#F97316', Medium: '#F59E0B', Low: '#22C55E', Info: '#3D8BD0',
};

/** The score the estate is held to — drawn as the dashed line on the trend. */
export const TARGET_SCORE = 85;

const pct = (passed: number, total: number) => (total ? Math.round((passed / total) * 100) : null);
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/* ── Per policy ─────────────────────────────────────────────────────────────────────────── */

export interface PolicyStat {
  policy: CompliancePolicy;
  benchmark?: Benchmark;
  score: number | null;
  endpoints: number;
  compliant: number;
  nonCompliant: number;
  notScanned: number;
  passed: number;
  failed: number;
  /** Endpoints per posture band, on the last scan. */
  postures: Record<Posture, number>;
}

export function policyStat(p: CompliancePolicy): PolicyStat {
  const res = endpointResults(p);
  const postures = { Secure: 0, Moderate: 0, Poor: 0, Vulnerable: 0 } as Record<Posture, number>;
  for (const r of res) { const band = postureOf(r.score); if (band && r.outcome !== 'Not Scanned') postures[band]++; }
  return {
    policy: p,
    benchmark: benchmarkOf(p.benchmarkId),
    score: scoreOf(p.lastScan),
    endpoints: res.length,
    compliant: p.lastScan?.compliant ?? 0,
    nonCompliant: p.lastScan?.nonCompliant ?? 0,
    notScanned: res.filter((r) => r.outcome === 'Not Scanned').length,
    passed: p.lastScan?.passed ?? 0,
    failed: p.lastScan?.failed ?? 0,
    postures,
  };
}

/* ── Per endpoint (the Explorer's Resources) ───────────────────────────────────────────── */

export interface EndpointStat {
  endpoint: ComplianceEndpoint;
  /** Policies that assess it. */
  policies: CompliancePolicy[];
  passed: number;
  failed: number;
  score: number | null;
  posture: Posture | null;
  /** Newest scan that reached it, across its policies. */
  lastScan: string | null;
  /** The agent was offline — no policy could score it. */
  notReached: boolean;
  /** Checks that passed on the previous scan and fail now. */
  newFailures: number;
  prevPassed: number;
  prevFailed: number;
}

/* ── Per rule (the Explorer's Rules) ──────────────────────────────────────────────────── */

export interface RuleStat {
  rule: ComplianceRule;
  policies: CompliancePolicy[];
  /** Endpoints the rule was checked on, and how many of them fail it. */
  checked: number;
  failing: number;
  score: number | null;
}

/* ── One rule across the estate, ONE row per endpoint (the technician's Rules page) ──────── */

export type RuleResult = 'Pass' | 'Fail' | 'Not Scanned';
export interface RuleEndpointResult {
  endpoint: ComplianceEndpoint;
  /** Fail when ANY policy checking it here fails it; Not Scanned when none reached it. */
  result: RuleResult;
  policies: CompliancePolicy[];
}

const ruleEpCache = new WeakMap<CompliancePolicy[], Map<string, RuleEndpointResult[]>>();
/** Every endpoint a rule is checked on, through every policy whose benchmark carries it. */
export function ruleEndpointResults(ruleId: string, policies: CompliancePolicy[]): RuleEndpointResult[] {
  let byRule = ruleEpCache.get(policies);
  if (!byRule) { byRule = new Map(); ruleEpCache.set(policies, byRule); }
  const hit = byRule.get(ruleId);
  if (hit) return hit;
  const m = new Map<string, RuleEndpointResult>();
  for (const p of policies) {
    const b = benchmarkOf(p.benchmarkId);
    if (!b || !benchmarkRuleIds(b).includes(ruleId)) continue;
    const fs = findingsOf(p).filter((f) => f.ruleId === ruleId);
    for (const r of endpointResults(p)) {
      const f = fs.find((x) => x.endpointId === r.endpoint.id);
      const here: RuleResult = f ? (f.passed ? 'Pass' : 'Fail') : 'Not Scanned';
      const cur = m.get(r.endpoint.id) ?? { endpoint: r.endpoint, result: 'Not Scanned' as RuleResult, policies: [] };
      cur.policies.push(p);
      if (here === 'Fail' || (here === 'Pass' && cur.result === 'Not Scanned')) cur.result = here;
      m.set(r.endpoint.id, cur);
    }
  }
  const rank: Record<RuleResult, number> = { Fail: 0, Pass: 1, 'Not Scanned': 2 };
  const out = [...m.values()].sort((a, z) => rank[a.result] - rank[z.result] || a.endpoint.hostName.localeCompare(z.endpoint.hostName));
  byRule.set(ruleId, out);
  return out;
}
/** Rule score = endpoints passing ÷ endpoints checked (Not Scanned left out); null when none checked. */
export const ruleScore = (rs: RuleEndpointResult[]) => {
  const pass = rs.filter((r) => r.result === 'Pass').length;
  const fail = rs.filter((r) => r.result === 'Fail').length;
  return pct(pass, pass + fail);
};

/* ── Per benchmark (the technician's Benchmark page) ───────────────────────────────────── */

export interface BenchmarkStat {
  benchmark: Benchmark;
  /** Policies that run this benchmark. */
  policies: CompliancePolicy[];
  rules: number;
  /** Distinct endpoints those policies assess. */
  endpoints: number;
  checked: number;
  failing: number;
  /** Rules failing on at least one endpoint. */
  failingRules: number;
  score: number | null;
  posture: Posture | null;
  /** Newest scan among its policies. */
  lastScan: string | null;
}

/* ── The whole estate ─────────────────────────────────────────────────────────────────── */

export interface VizSnapshot {
  stats: PolicyStat[];
  benchmarks: BenchmarkStat[];
  findings: Finding[];
  passed: number;
  failed: number;
  score: number | null;
  failedBySeverity: Record<Severity, number>;
  endpoints: EndpointStat[];
  rules: RuleStat[];
  /** 30 daily points ending today, for the trend line. */
  trend: { day: string; score: number }[];
}

const snapCache = new WeakMap<CompliancePolicy[], VizSnapshot>();

/** Everything at once, cached per store snapshot — the store hands out a new array on every
 *  change, so a cache keyed by the array is invalidated exactly when it should be. */
export function vizSnapshot(policies: CompliancePolicy[]): VizSnapshot {
  const hit = snapCache.get(policies);
  if (hit) return hit;

  const stats = policies.map(policyStat);
  const findings = policies.flatMap(findingsOf);
  const passed = findings.filter((f) => f.passed).length;
  const failed = findings.length - passed;

  const failedBySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of findings) if (!f.passed) failedBySeverity[ruleById(f.ruleId)!.severity]++;

  /* Endpoints: the union of every policy's endpoints. */
  const byEp = new Map<string, EndpointStat>();
  for (const p of policies) {
    for (const r of endpointResults(p)) {
      const cur = byEp.get(r.endpoint.id) ?? {
        endpoint: r.endpoint, policies: [], passed: 0, failed: 0, score: null, posture: null,
        lastScan: null, notReached: !r.endpoint.agentOnline, newFailures: 0, prevPassed: 0, prevFailed: 0,
      };
      cur.policies.push(p);
      if (r.outcome !== 'Not Scanned' && p.lastScan && (!cur.lastScan || p.lastScan.at > cur.lastScan)) cur.lastScan = p.lastScan.at;
      byEp.set(r.endpoint.id, cur);
    }
  }
  for (const f of findings) {
    const e = byEp.get(f.endpointId);
    if (!e) continue;
    if (f.passed) e.passed++; else e.failed++;
    if (f.prevPassed !== null) { if (f.prevPassed) e.prevPassed++; else e.prevFailed++; }
    if (f.prevPassed === true && !f.passed) e.newFailures++;
  }
  for (const e of byEp.values()) { e.score = pct(e.passed, e.passed + e.failed); e.posture = postureOf(e.score); }

  /* Rules: every rule some policy's benchmark carries. */
  const byRule = new Map<string, RuleStat>();
  for (const f of findings) {
    const cur = byRule.get(f.ruleId) ?? { rule: ruleById(f.ruleId)!, policies: [], checked: 0, failing: 0, score: null };
    cur.checked++;
    if (!f.passed) cur.failing++;
    if (!cur.policies.some((p) => p.id === f.policyId)) cur.policies.push(policies.find((p) => p.id === f.policyId)!);
    byRule.set(f.ruleId, cur);
  }
  for (const r of byRule.values()) r.score = pct(r.checked - r.failing, r.checked);

  /* Benchmarks: every one the catalogue holds, scored from the policies that run it. A benchmark
     no policy uses still lists — the technician can see it is there and unused. */
  const benchmarks: BenchmarkStat[] = BENCHMARKS_SEED.map((b) => {
    const ps = policies.filter((p) => p.benchmarkId === b.id);
    const fs = ps.flatMap(findingsOf);
    const failingIds = new Set(fs.filter((f) => !f.passed).map((f) => f.ruleId));
    const eps = new Set(ps.flatMap((p) => endpointResults(p).map((r) => r.endpoint.id)));
    const okCount = fs.filter((f) => f.passed).length;
    const bScore = pct(okCount, fs.length);
    const lastScan = ps.reduce<string | null>((acc, p) => (p.lastScan && (!acc || p.lastScan.at > acc) ? p.lastScan.at : acc), null);
    return {
      benchmark: b, policies: ps, rules: benchmarkRuleIds(b).length, endpoints: eps.size,
      checked: fs.length, failing: fs.length - okCount, failingRules: failingIds.size,
      score: bScore, posture: postureOf(bScore), lastScan,
    };
  });

  const score = pct(passed, findings.length);
  const snap: VizSnapshot = {
    stats, benchmarks, findings, passed, failed, score, failedBySeverity,
    endpoints: [...byEp.values()],
    rules: [...byRule.values()],
    trend: trendTo(score ?? 0),
  };
  snapCache.set(policies, snap);
  return snap;
}

/** A believable month of daily scores that ends exactly on today's — climbing slowly, with
 *  the odd dip where a new policy or a regression landed. Deterministic. */
function trendTo(today: number) {
  const out: { day: string; score: number }[] = [];
  const start = Math.max(20, today - 9);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(NOW); d.setDate(d.getDate() - i);
    const t = (29 - i) / 29;
    const wobble = ((hash(`trend|${i}`) % 300) / 100) - 1.5 - (i === 17 || i === 9 ? 2.4 : 0);
    const v = i === 0 ? today : Math.round((start + (today - start) * t + wobble) * 10) / 10;
    out.push({ day: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })}`, score: Math.max(0, Math.min(100, v)) });
  }
  return out;
}
