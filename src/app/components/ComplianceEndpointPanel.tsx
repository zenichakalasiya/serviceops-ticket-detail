/* One endpoint's compliance results — the drill-in under a policy.
 *
 * Opened from the policy detail page's Endpoints tab (that policy) and from the Explorer's
 * Resources and the Overview's endpoint links (every policy that assesses it — a policy switch
 * at the top). Drawn the way the product's device-compliance page reads: KPI cards
 * (Compliance · Passed · Failed · New Failures), Failed by Severity, then the Compliance
 * Breakdown — the benchmark's sections, each with its passed / checked rules and score, each
 * rule with its previous → current result. A rule row opens the rule's own detail panel.
 *
 * Every number is the same findings the rest of the module counts (findingsOf), so this panel,
 * the policy's Endpoints tab and the Explorer always agree. */
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, MinusCircle, X, XCircle } from 'lucide-react';
import { StatsCardsRow } from './AssetStatsRow';
import { RuleDetailPanel, SeverityPill } from './ComplianceShared';
import { benchmarksUsingRule, BENCHMARKS_SEED, ruleById, SEVERITIES } from './complianceData';
import type { ComplianceRule } from './complianceData';
import { benchmarkOf, complianceEndpoint, findingsOf, fmtStamp, resolvedEndpoints, usePolicies } from './compliancePolicyData';
import type { Finding } from './compliancePolicyData';
import { scoreColor, SEVERITY_COLOR } from './complianceVizData';

const pct = (a: number, n: number) => (n ? Math.round((a / n) * 100) : null);

function ResultIcon({ passed }: { passed: boolean | null }) {
  if (passed === null) return <MinusCircle size={15} className="text-[#B6C0CC]" />;
  return passed ? <CheckCircle2 size={15} className="text-[#22C55E]" /> : <XCircle size={15} className="text-[#DC2626]" />;
}

export function ComplianceEndpointPanel({ endpointId, policyId, onClose }: {
  endpointId: string;
  /** Read against this policy only. Omitted = every policy that assesses the endpoint. */
  policyId?: string;
  onClose: () => void;
}) {
  const policies = usePolicies();
  const ep = complianceEndpoint(endpointId);
  const mine = useMemo(
    () => policies.filter((p) => (policyId ? p.id === policyId : resolvedEndpoints(p).some((e) => e.id === endpointId))),
    [policies, policyId, endpointId],
  );
  const [pid, setPid] = useState(policyId ?? mine.find((p) => p.lastScan)?.id ?? mine[0]?.id ?? '');
  useEffect(() => { if (!mine.some((p) => p.id === pid)) setPid(mine[0]?.id ?? ''); }, [mine, pid]);
  const policy = mine.find((p) => p.id === pid);
  const benchmark = policy ? benchmarkOf(policy.benchmarkId) : undefined;

  const [ruleId, setRuleId] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ruleId) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, ruleId]);

  const findings = useMemo(
    () => (policy ? findingsOf(policy).filter((f) => f.endpointId === endpointId) : []),
    [policy, endpointId],
  );
  const byRule = useMemo(() => new Map(findings.map((f) => [f.ruleId, f])), [findings]);
  const passed = findings.filter((f) => f.passed).length;
  const failed = findings.length - passed;
  const fresh = findings.filter((f) => f.prevPassed === true && !f.passed).length;
  const score = pct(passed, findings.length);
  const reached = findings.length > 0;

  /* The benchmark's rules grouped by their CIS section (subsections inside), in order. */
  const sections = useMemo(() => {
    if (!benchmark) return [];
    const ids = benchmark.groups.flatMap((g) => [...g.ruleIds, ...(g.children ?? []).flatMap((c) => c.ruleIds)]);
    const map = new Map<string, { key: string; title: string; rules: ComplianceRule[] }>();
    for (const id of ids) {
      const r = ruleById(id);
      if (!r) continue;
      const key = r.section[0];
      const s = map.get(key) ?? { key, title: `${r.section[0]} ${r.section[1]}`, rules: [] };
      s.rules.push(r);
      map.set(key, s);
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  }, [benchmark]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  /* Sections with a failure start open — the breakdown is read for what broke. */
  useEffect(() => {
    setOpen(new Set(sections.filter((s) => s.rules.some((r) => byRule.get(r.id)?.passed === false)).map((s) => s.key)));
  }, [sections, byRule]);

  const openRule = ruleId ? ruleById(ruleId) : null;
  if (!ep) return null;
  const dim = '#94A3B8';

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-[920px] max-w-[95vw] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* ── header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#364658]">
              <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: ep.agentOnline ? '#22C55E' : '#F59E0B' }} title={ep.agentOnline ? 'Agent online' : 'Agent offline'} />
              <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{ep.id}</span>
              <span className="truncate">{ep.hostName}</span>
            </h3>
            <p className="mt-1 text-[12px] text-[#7B8FA5]">{ep.ip} · {ep.osName} · {ep.office}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── which policy it is read against ── */}
          <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
            <span className="text-[12px] text-[#7B8FA5]">Policy</span>
            {mine.length > 1 ? (
              <div className="pill-track">
                {mine.map((p) => (
                  <button key={p.id} type="button" aria-pressed={p.id === pid} onClick={() => setPid(p.id)}>{p.name}</button>
                ))}
              </div>
            ) : (
              <span className="text-[13px] font-medium text-[#364658]">{policy?.name ?? '—'}</span>
            )}
            {benchmark && <span className="ml-auto text-[12px] text-[#7B8FA5]">{benchmark.name} · Last scan {fmtStamp(policy?.lastScan?.at)}</span>}
          </div>

          {/* ── KPI cards ── */}
          <div className="pt-3">
            <StatsCardsRow
              rules={[]}
              onApplyFilter={() => {}}
              cards={[
                { label: 'Compliance', value: reached ? `${score}%` : '—', sub: reached ? `${passed} of ${findings.length} checks pass` : 'Not scanned', valueColor: reached ? scoreColor(score) : dim },
                { label: 'Passed', value: reached ? passed : '—', sub: 'rules', valueColor: reached ? '#15803D' : dim },
                { label: 'Failed', value: reached ? failed : '—', sub: 'rules', valueColor: reached && failed ? '#DC2626' : dim },
                { label: 'New Failures', value: reached ? fresh : '—', sub: 'passed last scan, fail now', valueColor: reached && fresh ? '#B45309' : dim },
              ]}
            />
          </div>

          {!reached ? (
            <div className="mx-6 rounded-lg border border-dashed border-[#DFE5ED] px-4 py-10 text-center text-[13px] text-[#7B8FA5]">
              {policy?.lastScan ? 'The agent was offline on the last scan — this endpoint has no results.' : 'This policy has not been scanned yet.'}
            </div>
          ) : (
            <>
              {/* ── failed by severity ── */}
              <section className="mx-6 rounded-lg border border-[#E5E7EB]">
                <header className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[13px] font-semibold text-[#364658]">Failed Rules by Severity</header>
                <div className="grid grid-cols-5 divide-x divide-[#EEF2F6]">
                  {SEVERITIES.map((s) => {
                    const all = findings.filter((f) => ruleById(f.ruleId)?.severity === s);
                    const bad = all.filter((f) => !f.passed).length;
                    return (
                      <div key={s} className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                          <span className="size-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />{s}
                        </span>
                        <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: bad ? SEVERITY_COLOR[s] : '#364658' }}>{bad}<span className="text-[12px] font-normal text-[#94A3B8]"> / {all.length}</span></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── compliance breakdown ── */}
              <section className="mx-6 my-4 rounded-lg border border-[#E5E7EB]">
                <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-[#364658]">Compliance Breakdown</span>
                  <span className="text-[11px] text-[#7B8FA5]">Previous → Last scan</span>
                </header>
                {sections.map((s) => {
                  const res = s.rules.map((r) => byRule.get(r.id)).filter(Boolean) as Finding[];
                  const ok = res.filter((f) => f.passed).length;
                  const sp = pct(ok, res.length);
                  const isOpen = open.has(s.key);
                  return (
                    <div key={s.key} className="border-b border-[#EEF2F6] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpen((o) => { const n = new Set(o); if (n.has(s.key)) n.delete(s.key); else n.add(s.key); return n; })}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                      >
                        <ChevronRight size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#364658]">{s.title}</span>
                        <span className="text-[12px] tabular-nums text-[#7B8FA5]">{ok}/{res.length}</span>
                        <span className="w-[42px] text-right text-[12px] font-semibold tabular-nums" style={{ color: scoreColor(sp) }}>{sp ?? '—'}%</span>
                        <ResultIcon passed={res.length ? ok === res.length : null} />
                      </button>
                      {isOpen && s.rules.map((r) => {
                        const f = byRule.get(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRuleId(r.id)}
                            className="flex w-full items-center gap-3 py-2 pl-11 pr-4 text-left transition-colors hover:bg-[#F5F7FA]"
                          >
                            <span className="h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[r.severity] }} title={r.severity} />
                            <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{r.name}</span>
                            <SeverityPill severity={r.severity} />
                            <span className="flex w-[64px] items-center justify-end gap-1.5">
                              <ResultIcon passed={f?.prevPassed ?? null} />
                              <span className="text-[11px] text-[#B6C0CC]">→</span>
                              <ResultIcon passed={f ? f.passed : null} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </div>

      {openRule && (
        <div onClick={(e) => e.stopPropagation()}>
          <RuleDetailPanel rule={openRule} usedIn={benchmarksUsingRule(BENCHMARKS_SEED, openRule.id).map((b) => b.name)} onClose={() => setRuleId(null)} />
        </div>
      )}
    </div>
  );
}
