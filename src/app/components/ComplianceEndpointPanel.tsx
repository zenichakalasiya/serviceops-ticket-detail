/* The compliance RULE side panel — one panel, drilled IN PLACE.
 *
 * An endpoint opens its own full detail page (ComplianceEndpointDrawer); a RULE opens here:
 *
 *   policy › Rules tab › rule  → the endpoints it Passed / Failed on → one endpoint's result
 *   endpoint page › a rule      → that endpoint's result for the rule
 *   result (Fail)               → Request exception (one level deeper)
 *
 * Every result view is "Result on this endpoint" over the rule's own tabs (Summary · Audit ·
 * Remediation · References · Controls · Tags). The back arrow steps back out; Escape steps back
 * one level, then closes. The header and the 20px margins are the product's side-panel standard
 * (as Patch › Impacted Endpoints). It also exports the pieces the endpoint page reads with:
 * the numbered Compliance Breakdown (1 · 1.1 · 1.3.1, from the benchmark's groups), the
 * Failed Rules by Severity strip and the result pill.
 *
 * Every number is the same findings the rest of the module counts (findingsOf), so this panel,
 * the policy's tabs and the endpoint page always agree. */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ChevronRight, MinusCircle, X, XCircle } from 'lucide-react';
import { StatsCardsRow } from './AssetStatsRow';
import { RuleDetailBody, SeverityPill } from './ComplianceShared';
import { benchmarksUsingRule, BENCHMARKS_SEED, numberedGroups, ruleById, ruleNumbers, SEVERITIES, SEVERITY_PILL } from './complianceData';
import type { Benchmark, ComplianceRule, NumberedRule, Severity } from './complianceData';
import {
  benchmarkOf, complianceEndpoint, EXCEPTION_REASONS, exceptionFor, exceptionStore, findingsOf, fmtStamp, getPolicy, resolvedEndpoints, useExceptions, usePolicies,
} from './compliancePolicyData';
import type { ComplianceException, ExceptionReason, Finding } from './compliancePolicyData';
import { ErrorText, FieldLabel, RuleSelect, inputCls as formInputCls } from './FormRuleControls';
import { scoreColor, SEVERITY_COLOR } from './complianceVizData';

const pct = (a: number, n: number) => (n ? Math.round((a / n) * 100) : null);
const DIM = '#94A3B8';

function ResultIcon({ passed }: { passed: boolean | null }) {
  if (passed === null) return <MinusCircle size={15} className="text-[#B6C0CC]" />;
  return passed ? <CheckCircle2 size={15} className="text-[#22C55E]" /> : <XCircle size={15} className="text-[#DC2626]" />;
}

/** Pass / Fail as the module's result pill; null = no result on the last scan. */
export function ResultPill({ passed }: { passed: boolean | null }) {
  if (passed === null) return <span className="inline-block rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#64748B]">Not Scanned</span>;
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[12px] font-medium ${passed ? 'bg-[#ECFDF3] text-[#15803D]' : 'bg-[#FEF3F2] text-[#B42318]'}`}>{passed ? 'Pass' : 'Fail'}</span>;
}

/** Failed Rules by Severity — five columns of failed / checked. Shared with the policy page. */
export function FailedBySeverity({ title = 'Failed Rules by Severity', counts }: {
  title?: string;
  counts: Record<Severity, { failed: number; total: number }>;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB]">
      <header className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[13px] font-semibold text-[#364658]">{title}</header>
      <div className="grid grid-cols-5 divide-x divide-[#EEF2F6]">
        {SEVERITIES.map((s) => {
          const { failed, total } = counts[s];
          return (
            <div key={s} className="px-4 py-3">
              <span className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <span className="size-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />{s}
              </span>
              <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: failed ? SEVERITY_COLOR[s] : '#364658' }}>{failed}<span className="text-[12px] font-normal text-[#94A3B8]"> / {total}</span></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Tally findings (or anything carrying a rule id and a pass flag) by the rule's severity. */
export function severityCounts(items: { ruleId: string; passed: boolean }[]) {
  const out = Object.fromEntries(SEVERITIES.map((s) => [s, { failed: 0, total: 0 }])) as Record<Severity, { failed: number; total: number }>;
  for (const it of items) {
    const s = ruleById(it.ruleId)?.severity;
    if (!s) continue;
    out[s].total += 1;
    if (!it.passed) out[s].failed += 1;
  }
  return out;
}

type View =
  /** One endpoint against one policy: its rule groups with Pass/Fail (the Endpoint page's Policies tab). */
  | { kind: 'breakdown'; endpointId: string }
  | { kind: 'rule'; ruleId: string }
  | { kind: 'result'; endpointId: string; ruleId: string }
  /** Request exception — one level below a failed result, in the same panel. */
  | { kind: 'exception'; endpointId: string; ruleId: string };

export function ComplianceEndpointPanel({ endpointId, ruleId, policyId, onClose, onOpenEndpoint, onOpenPolicy }: {
  /** With ruleId: open straight on this endpoint's result for the rule (the endpoint page).
      Without ruleId: open on this endpoint's rule groups for the policy. */
  endpointId?: string;
  /** Without endpointId: open on the rule's results across the policy's endpoints. */
  ruleId?: string;
  /** The policy the results are read against. */
  policyId: string;
  onClose: () => void;
  /** "Open endpoint" on a result — offered from the rule lens, not from the endpoint's own page. */
  onOpenEndpoint?: (endpointId: string) => void;
  /** "Open policy" in the breakdown view's header. */
  onOpenPolicy?: (policyId: string) => void;
}) {
  usePolicies();
  const [stack, setStack] = useState<View[]>(() =>
    endpointId && ruleId ? [{ kind: 'result', endpointId, ruleId }]
      : endpointId ? [{ kind: 'breakdown', endpointId }]
      : [{ kind: 'rule', ruleId: ruleId ?? '' }],
  );
  const view = stack[stack.length - 1];
  const push = (v: View) => setStack((s) => [...s, v]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const policy = getPolicy(policyId);
  const benchmark = policy ? benchmarkOf(policy.benchmarkId) : undefined;
  const findings = useMemo(() => (policy ? findingsOf(policy) : []), [policy]);
  const numbers = useMemo(() => (benchmark ? ruleNumbers(benchmark) : new Map<string, string>()), [benchmark]);
  const exceptions = useExceptions();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (stack.length > 1) back(); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, stack.length]);

  if (!view) return null;

  const ep = view.kind !== 'rule' ? complianceEndpoint(view.endpointId) : undefined;
  const rule = view.kind !== 'breakdown' ? ruleById(view.ruleId) : undefined;
  if (view.kind !== 'breakdown' && !rule) return null;
  if (view.kind !== 'rule' && !ep) return null;
  const number = rule ? numbers.get(rule.id) : undefined;

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/50" onClick={onClose}>
      <div className="flex h-full w-[920px] max-w-[95vw] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* ── header: back (one level in or deeper) · title · close — the product's side-panel header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="flex min-w-0 items-start gap-2">
            {stack.length > 1 && (
              <button type="button" onClick={back} aria-label="Back" title="Back" className="-mt-1 flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><ArrowLeft size={18} /></button>
            )}
            <div className="min-w-0">
              {view.kind === 'breakdown' && ep && (
                <>
                  <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
                    {ep.real && <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: ep.agentOnline ? '#22C55E' : '#F59E0B' }} title={ep.agentOnline ? 'Agent online' : 'Agent offline'} />}
                    <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{ep.id}</span>
                    <span className="truncate">{ep.hostName}</span>
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-[#7B8FA5]">
                    <span>{policy?.name}</span>
                    {benchmark && <span>· {benchmark.name}</span>}
                    {onOpenPolicy && policy && <button type="button" onClick={() => { onClose(); onOpenPolicy(policy.id); }} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Open policy ↗</button>}
                  </p>
                </>
              )}
              {rule && (
                <>
                  <h3 className="flex min-w-0 items-start gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
                    <span className="mt-1 h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[rule.severity].bar }} title={rule.severity} />
                    {number && <span className="flex-shrink-0 tabular-nums text-[#7B8FA5]">{number}</span>}
                    <span>{rule.name}</span>
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <SeverityPill severity={rule.severity} />
                    {[rule.profile, rule.checkIn, `${rule.platform} ${rule.version}`].map((t) => (
                      <span key={t} className="rounded-sm border border-[#E5E7EB] px-1.5 py-0.5 text-[12px] text-[#64748B]">{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        {view.kind === 'breakdown' && ep && policy && benchmark && (() => {
          const mine = findings.filter((f) => f.endpointId === ep.id);
          const ok = mine.filter((f) => f.passed).length;
          const got = mine.length > 0;
          const sp = pct(ok, mine.length);
          return (
            <div className="flex-1 overflow-y-auto pb-5">
              <div className="-ml-1 mr-1 pt-4">
                <StatsCardsRow
                  rules={[]}
                  onApplyFilter={() => {}}
                  cards={[
                    { label: 'Compliance', value: got ? `${sp}%` : '—', sub: got ? `${ok} of ${mine.length} checks pass` : 'Not scanned', valueColor: got ? scoreColor(sp) : DIM },
                    { label: 'Passed', value: got ? ok : '—', sub: 'rules', valueColor: got ? '#15803D' : DIM },
                    { label: 'Failed', value: got ? mine.length - ok : '—', sub: 'rules', valueColor: got && mine.length - ok ? '#DC2626' : DIM },
                    { label: 'New Failures', value: got ? mine.filter((f) => f.prevPassed === true && !f.passed).length : '—', sub: 'passed last scan, fail now', valueColor: DIM },
                  ]}
                />
              </div>
              <div className="space-y-4 px-5">
                {got ? (
                  <>
                    <FailedBySeverity counts={severityCounts(mine)} />
                    <ComplianceBreakdown benchmark={benchmark} findings={mine} onRule={(rid) => push({ kind: 'result', endpointId: ep.id, ruleId: rid })} />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#DFE5ED] px-4 py-10 text-center text-[13px] text-[#7B8FA5]">
                    {policy.lastScan ? 'The agent was offline on the last scan — this endpoint has no results.' : 'This policy has not been scanned yet.'}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {view.kind === 'rule' && rule && policy && (
          <RuleView
            rule={rule}
            endpoints={resolvedEndpoints(policy)}
            findings={findings.filter((f) => f.ruleId === rule.id)}
            scanned={!!policy.lastScan}
            onEndpoint={(eid) => push({ kind: 'result', endpointId: eid, ruleId: rule.id })}
          />
        )}

        {view.kind === 'result' && rule && ep && (
          <div className="flex min-h-0 flex-1 flex-col">
            <RuleDetailBody
              rule={rule}
              usedIn={benchmarksUsingRule(BENCHMARKS_SEED, rule.id).map((b) => b.name)}
              lead={
                <ResultCard
                  rule={rule}
                  endpoint={ep}
                  finding={findings.find((f) => f.endpointId === ep.id && f.ruleId === rule.id)}
                  lastScan={policy?.lastScan?.at}
                  exception={policy ? exceptionFor(exceptions, policy.id, ep.id, rule.id) : undefined}
                  onRequestException={policy ? () => push({ kind: 'exception', endpointId: ep.id, ruleId: rule.id }) : undefined}
                  onOpenEndpoint={onOpenEndpoint ? () => { onClose(); onOpenEndpoint(ep.id); } : undefined}
                />
              }
            />
          </div>
        )}

        {view.kind === 'exception' && rule && ep && policy && (
          <ExceptionForm
            policy={{ id: policy.id, name: policy.name }}
            endpoint={ep}
            rule={rule}
            onCancel={back}
            onDone={back}
          />
        )}
      </div>
    </div>
  );
}

/* ── the numbered rule-group tree — every page that expands a benchmark's rules ───────────
 * The benchmark's own groups, numbered the admin's way (numberedGroups): group 1 · its rules
 * 1.1, 1.2 · a sub-group 1.3 · its rules 1.3.1. One tree for every page; what a page knows
 * about a rule comes in through `resultOf`:
 *   one endpoint  → passed 1 / failed 0 (or the reverse)      — ComplianceBreakdown
 *   a policy / a benchmark → endpoints passed / failed on it    — the Rules tabs
 * A group or sub-group shows rules passing (no failure anywhere) / rules checked, and its
 * score; groups with a failure start open. `right` draws the end of a rule row. */

export interface RuleTally { passed: number; failed: number }

export function RuleGroupTree({ benchmark, resultOf, right, onRule, title = 'Rules', note, show }: {
  benchmark: Benchmark;
  /** What this page knows about a rule — null when it was not checked. */
  resultOf: (ruleId: string) => RuleTally | null;
  /** The end of a rule row (Pass/Fail icons, or "Failed on 3 of 4"). */
  right: (ruleId: string, t: RuleTally | null) => React.ReactNode;
  onRule: (ruleId: string) => void;
  title?: string;
  /** A short line at the right of the header (e.g. "Previous → Last scan"). */
  note?: string;
  /** Narrows the tree (a count card's filter): rules it rejects are hidden, and so is any
      group or sub-group left with none. */
  show?: (ruleId: string) => boolean;
}) {
  const visible = (rules: NumberedRule[]) => (show ? rules.filter((r) => show(r.id)) : rules);
  const tree = useMemo(() => numberedGroups(benchmark), [benchmark]);
  const tally = (rules: NumberedRule[]) => {
    let ok = 0, total = 0, failed = false;
    for (const r of rules) {
      const t = resultOf(r.id);
      if (!t || t.passed + t.failed === 0) continue;
      total += 1;
      if (t.failed) failed = true; else ok += 1;
    }
    return { ok, total, failed };
  };
  const sig = tree.map((g) => [g, ...g.children].map((x) => tally('rules' in x ? x.rules : []).failed).join()).join('|');
  const [open, setOpen] = useState<Set<string>>(new Set());
  useEffect(() => {
    const keys: string[] = [];
    for (const g of tree) {
      const subsFailed = g.children.filter((s) => tally(s.rules).failed);
      if (tally(g.rules).failed || subsFailed.length) keys.push(g.key);
      keys.push(...subsFailed.map((s) => s.key));
    }
    setOpen(new Set(keys));
  }, [tree, sig]);
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const head = (key: string, number: string, name: string, rules: NumberedRule[], depth: 0 | 1) => {
    const { ok, total } = tally(rules);
    const sp = pct(ok, total);
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        className={`flex w-full items-center gap-2 py-2.5 pr-4 text-left transition-colors hover:bg-[#F9FAFB] ${depth ? 'pl-9' : 'pl-4'}`}
      >
        <ChevronRight size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open.has(key) ? 'rotate-90' : ''}`} />
        <span className="w-[40px] flex-shrink-0 text-[13px] font-semibold tabular-nums text-[#364658]">{number}</span>
        <span className={`min-w-0 flex-1 truncate text-[13px] text-[#364658] ${depth ? '' : 'font-medium'}`}>{name}</span>
        <span className="text-[12px] tabular-nums text-[#7B8FA5]" title="Rules passing / rules checked">{ok}/{total}</span>
        <span className="w-[42px] text-right text-[12px] font-semibold tabular-nums" style={{ color: scoreColor(sp) }}>{sp ?? '—'}%</span>
        <ResultIcon passed={total ? ok === total : null} />
      </button>
    );
  };
  const ruleRow = (nr: NumberedRule, depth: 1 | 2) => {
    const r = ruleById(nr.id);
    if (!r) return null;
    return (
      <button
        key={r.id}
        type="button"
        onClick={() => onRule(r.id)}
        className={`group/rule flex w-full items-center gap-3 py-2 pr-4 text-left transition-colors hover:bg-[#F5F7FA] ${depth === 2 ? 'pl-[84px]' : 'pl-[60px]'}`}
      >
        <span className="h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[r.severity] }} title={r.severity} />
        <span className="w-[44px] flex-shrink-0 text-[12px] tabular-nums text-[#7B8FA5]">{nr.number}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658] group-hover/rule:text-[#3D8BD0]">{r.name}</span>
        <SeverityPill severity={r.severity} />
        {right(r.id, resultOf(r.id))}
        <ChevronRight size={14} className="flex-shrink-0 text-[#B6C0CC] group-hover/rule:text-[#3D8BD0]" />
      </button>
    );
  };

  return (
    <section className="rounded-lg border border-[#E5E7EB]">
      <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[#364658]">{title}</span>
        {note && <span className="text-[11px] text-[#7B8FA5]">{note}</span>}
      </header>
      {tree.map((g) => {
        const subs = g.children.filter((s) => visible(s.rules).length);
        if (!visible(g.rules).length && !subs.length) return null;
        return (
          <div key={g.key} className="border-b border-[#EEF2F6] last:border-b-0">
            {head(g.key, g.number, g.name, [...g.rules, ...g.children.flatMap((s) => s.rules)], 0)}
            {(open.has(g.key) || !!show) && (
              <>
                {visible(g.rules).map((r) => ruleRow(r, 1))}
                {subs.map((s) => (
                  <div key={s.key}>
                    {head(s.key, s.number, s.name, s.rules, 1)}
                    {(open.has(s.key) || !!show) && visible(s.rules).map((r) => ruleRow(r, 2))}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** One endpoint's results as the tree — Previous → Last scan on each rule. */
export function ComplianceBreakdown({ benchmark, findings, onRule }: {
  benchmark: Benchmark;
  /** This endpoint's findings for the policy. */
  findings: Finding[];
  onRule: (ruleId: string) => void;
}) {
  const byRule = useMemo(() => new Map(findings.map((f) => [f.ruleId, f])), [findings]);
  return (
    <RuleGroupTree
      benchmark={benchmark}
      title="Compliance Breakdown"
      note="Previous → Last scan"
      onRule={onRule}
      resultOf={(id) => { const f = byRule.get(id); return f ? { passed: f.passed ? 1 : 0, failed: f.passed ? 0 : 1 } : null; }}
      right={(id) => {
        const f = byRule.get(id);
        return (
          <span className="flex w-[64px] items-center justify-end gap-1.5">
            <ResultIcon passed={f?.prevPassed ?? null} />
            <span className="text-[11px] text-[#B6C0CC]">→</span>
            <ResultIcon passed={f ? f.passed : null} />
          </span>
        );
      }}
    />
  );
}

/** Across many endpoints (a policy, a benchmark): "Failed on 3 of 4" at the end of each rule. */
export function FailedOnCell({ t }: { t: RuleTally | null }) {
  if (!t || t.passed + t.failed === 0) return <span className="w-[130px] text-right text-[12px] text-[#9CA3AF]">Not checked</span>;
  return (
    <span className={`w-[130px] text-right text-[12px] tabular-nums ${t.failed ? 'font-medium text-[#B42318]' : 'text-[#15803D]'}`}>
      {t.failed ? `Failed on ${t.failed} of ${t.passed + t.failed}` : `Passed on all ${t.passed}`}
    </span>
  );
}

/* ── rule view: Passed On / Failed On cards over the endpoints, then the rule's tabs ──────── */

function RuleView({ rule, endpoints, findings, scanned, onEndpoint }: {
  rule: ComplianceRule;
  endpoints: { id: string; hostName: string; ip: string; office: string; agentOnline: boolean }[];
  findings: Finding[];
  scanned: boolean;
  onEndpoint: (endpointId: string) => void;
}) {
  const byEp = new Map(findings.map((f) => [f.endpointId, f]));
  const passedOn = findings.filter((f) => f.passed).length;
  const failedOn = findings.length - passedOn;
  const notScanned = endpoints.length - findings.length;
  /* Failed first — the rule is opened to see where it broke. */
  const rows = [...endpoints].sort((a, b) => rank(byEp.get(a.id)) - rank(byEp.get(b.id)));
  const ends = (n: number) => `endpoint${n === 1 ? '' : 's'}`;

  const table = (
    <table className="w-full table-fixed">
      <colgroup><col /><col className="w-[140px]" /><col className="w-[180px]" /><col className="w-[120px]" /><col className="w-[36px]" /></colgroup>
      <thead><tr className="border-b border-[#e5e7eb]">{['Endpoint', 'IP Address', 'Remote Office', 'Result', ''].map((h, i) => <th key={i} className="px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#e5e7eb]">
        {rows.map((e) => {
          const f = byEp.get(e.id);
          return (
            <tr key={e.id} onClick={() => onEndpoint(e.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
              <td className="px-3 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`size-2 flex-shrink-0 rounded-full ${e.agentOnline ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                  <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{e.id}</span>
                  <span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{e.hostName}</span>
                </span>
              </td>
              <td className="px-3 py-3 text-[13px] tabular-nums text-[#64748B]">{e.ip}</td>
              <td className="px-3 py-3"><span className="block truncate text-[13px] text-[#64748B]">{e.office}</span></td>
              <td className="px-3 py-3"><ResultPill passed={f ? f.passed : null} /></td>
              <td className="px-3 py-3"><ChevronRight size={14} className="text-[#B6C0CC] group-hover/row:text-[#3D8BD0]" /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <RuleDetailBody
        rule={rule}
        usedIn={benchmarksUsingRule(BENCHMARKS_SEED, rule.id).map((b) => b.name)}
        lead={
          <>
          <div className="-mb-3 -ml-6 -mr-4">
            <StatsCardsRow
              rules={[]}
              onApplyFilter={() => {}}
              cards={[
                { label: 'Passed On', value: scanned ? passedOn : '—', sub: ends(passedOn), valueColor: scanned ? '#15803D' : DIM },
                { label: 'Failed On', value: scanned ? failedOn : '—', sub: ends(failedOn), valueColor: scanned && failedOn ? '#DC2626' : DIM },
                { label: 'Not Scanned', value: notScanned, sub: ends(notScanned), valueColor: notScanned ? '#64748B' : DIM },
              ]}
            />
          </div>
          <div className="mt-4 rounded-lg border border-[#E5E7EB]">
            <header className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[13px] font-semibold text-[#364658]">Endpoints</header>
            <div className="px-1">{scanned ? table : <p className="py-8 text-center text-[13px] text-[#9CA3AF]">This policy has not been scanned yet.</p>}</div>
          </div>
          </>
        }
      />
    </div>
  );
}
const rank = (f?: Finding) => (f ? (f.passed ? 1 : 0) : 2);

/* ── result view lead: one endpoint × one rule ─────────────────────────────────────────── */

function ResultCard({ rule, endpoint, finding, lastScan, exception, onRequestException, onOpenEndpoint }: {
  rule: ComplianceRule;
  endpoint: { id: string; hostName: string };
  finding?: Finding;
  lastScan?: string;
  exception?: ComplianceException;
  /** Offered only on a Fail with no request yet. */
  onRequestException?: () => void;
  onOpenEndpoint?: () => void;
}) {
  const label = 'text-[12px] text-[#7B8FA5]';
  return (
    <section className="rounded-lg border border-[#E5E7EB]">
      <header className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[#364658]">Result on this endpoint</span>
        <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
          <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{endpoint.id}</span>{endpoint.hostName}
          {onOpenEndpoint && (
            <button type="button" onClick={onOpenEndpoint} className="ml-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">Open endpoint ↗</button>
          )}
        </span>
      </header>
      <div className="grid grid-cols-3 gap-x-6 gap-y-3 px-4 py-3">
        <div><div className={label}>Result</div><div className="mt-1"><ResultPill passed={finding ? finding.passed : null} /></div></div>
        <div><div className={label}>Previous Scan</div><div className="mt-1">{finding?.prevPassed == null ? <span className="text-[13px] text-[#94A3B8]">—</span> : <ResultPill passed={finding.prevPassed} />}</div></div>
        <div><div className={label}>Last Scan</div><div className="mt-1 text-[13px] text-[#364658]">{fmtStamp(lastScan)}</div></div>
        <div className="col-span-3">
          <div className={label}>Required</div>
          <div className="mt-1 whitespace-pre-wrap rounded bg-[#F9FAFB] px-3 py-2 font-mono text-[12px] leading-[1.6] text-[#364658]">{rule.remediationValue}</div>
        </div>
        {exception && (
          <div className="col-span-3">
            <div className={label}>Exception</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#364658]">
              <span className="inline-block rounded-sm bg-[#FFFAEB] px-1.5 py-0.5 text-[12px] font-medium text-[#B54708]">{exception.status}</span>
              <span>{exception.reason}</span>
              <span className="text-[#7B8FA5]">· Expires On {fmtDate(exception.expiresOn)}</span>
            </div>
          </div>
        )}
      </div>
      {!exception && finding && !finding.passed && onRequestException && (
        <div className="flex justify-end border-t border-[#E5E7EB] px-4 py-3">
          <button type="button" onClick={onRequestException} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Request exception</button>
        </div>
      )}
    </section>
  );
}

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isoIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const inputCls = formInputCls.replace('rounded-md', 'rounded');

/* ── Request exception — the form, one level below a failed result ─────────────────────── */

function ExceptionForm({ policy, endpoint, rule, onCancel, onDone }: {
  policy: { id: string; name: string };
  endpoint: { id: string; hostName: string };
  rule: ComplianceRule;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState<ExceptionReason | ''>('');
  const [expiresOn, setExpiresOn] = useState(isoIn(90));
  const [justification, setJustification] = useState('');
  const [tried, setTried] = useState(false);
  const today = isoIn(0);
  const errs = {
    reason: !reason ? 'Select a reason' : '',
    expiresOn: !expiresOn ? 'Select a date' : expiresOn <= today ? 'Pick a date after today' : '',
    justification: !justification.trim() ? 'Explain why this rule cannot be applied' : '',
  };
  const submit = () => {
    setTried(true);
    if (errs.reason || errs.expiresOn || errs.justification) return;
    exceptionStore.request({ policyId: policy.id, endpointId: endpoint.id, ruleId: rule.id, reason: reason as ExceptionReason, expiresOn, justification: justification.trim(), requestedBy: 'Current user' });
    toast.success('Exception requested — waiting for the security admin');
    onDone();
  };
  const read = (k: string, v: React.ReactNode) => (
    <div><div className="text-[12px] text-[#7B8FA5]">{k}</div><div className="mt-1 text-[13px] text-[#364658]">{v}</div></div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <h4 className="text-[14px] font-semibold text-[#364658]">Request exception</h4>
        <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-3 rounded-lg bg-[#F9FAFB] p-4">
          {read('Policy', <span className="flex items-center gap-1.5"><span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{policy.id}</span><span className="truncate">{policy.name}</span></span>)}
          {read('Endpoint', <span className="flex items-center gap-1.5"><span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{endpoint.id}</span>{endpoint.hostName}</span>)}
          {read('Rule', <span className="line-clamp-2">{rule.name}</span>)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <FieldLabel required>Reason</FieldLabel>
            <RuleSelect className="!rounded" value={reason ? [reason] : []} options={EXCEPTION_REASONS.map((r) => ({ value: r, label: r }))} onChange={(v) => setReason((v[0] as ExceptionReason) ?? '')} invalid={tried && !!errs.reason} placeholder="Select reason" />
            <ErrorText>{tried ? errs.reason : ''}</ErrorText>
          </div>
          <div>
            <FieldLabel required>Expires On</FieldLabel>
            <input type="date" value={expiresOn} min={isoIn(1)} onChange={(e) => setExpiresOn(e.target.value)} className={`${inputCls} ${tried && errs.expiresOn ? '!border-[#F25C4E]' : ''}`} />
            <ErrorText>{tried ? errs.expiresOn : ''}</ErrorText>
          </div>
          <div className="col-span-2">
            <FieldLabel required>Justification</FieldLabel>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={4} placeholder="Why this rule cannot be applied on this endpoint, and what reduces the risk meanwhile" className={`${inputCls} !h-auto resize-y py-2 leading-[18px] ${tried && errs.justification ? '!border-[#F25C4E]' : ''}`} />
            <ErrorText>{tried ? errs.justification : ''}</ErrorText>
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#DFE5ED] px-5 py-3">
        <button type="button" onClick={onCancel} className="h-8 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]">Cancel</button>
        <button type="button" onClick={submit} className="h-8 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">Request</button>
      </div>
    </div>
  );
}
