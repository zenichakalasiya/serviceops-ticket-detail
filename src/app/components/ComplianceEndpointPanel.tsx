/* The compliance RULE side panel — one panel, drilled IN PLACE.
 *
 * An endpoint opens its own full detail page (ComplianceEndpointDrawer); a RULE opens here:
 *
 *   policy › Rules tab › rule  → the endpoints it Passed / Failed on → one endpoint's result
 *   endpoint page › a rule      → that endpoint's result for the rule
 *   result (Fail)               → Request exception (one level deeper)
 *
 * Every result view is "Result on this endpoint" over the rule's own tabs (Summary · Audit ·
 * Remediation · References · Controls). The back arrow steps back out; Escape steps back
 * one level, then closes. The header and the 20px margins are the product's side-panel standard
 * (as Patch › Impacted Endpoints). It also exports the pieces the endpoint page reads with:
 * the numbered Compliance Breakdown (1 · 1.1 · 1.3.1, from the benchmark's groups), the
 * Failed Rules by Severity strip and the result pill.
 *
 * Every number is the same findings the rest of the module counts (findingsOf), so this panel,
 * the policy's tabs and the endpoint page always agree. */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Circle, Download, Eye, EyeOff, Lock, MinusCircle, X, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { StatsCardsRow } from './AssetStatsRow';
import { ckpi, RuleDetailBody, RuleFactsRow, SeverityPill } from './ComplianceShared';
import { HeaderKpiRow } from './HeaderKpiRow';
import { benchmarksUsingRule, BENCHMARKS_SEED, numberedGroups, ruleById, ruleNumbers, SEVERITIES, SEVERITY_PILL } from './complianceData';
import type { Benchmark, ComplianceRule, NumberedRule, Severity } from './complianceData';
import {
  benchmarkOf, complianceEndpoint, endpointResults, EXCEPTION_REASONS, exceptionFor, exceptionStore, findingsOf, fmtStamp, getPolicy, resolvedEndpoints, runHistory, useExceptions, usePolicies,
} from './compliancePolicyData';
import type { ComplianceEndpoint, ComplianceException, CompliancePolicy, ExceptionReason, Finding } from './compliancePolicyData';
import { ErrorText, FieldLabel, RuleSelect, inputCls as formInputCls } from './FormRuleControls';
import { scoreColor, SEVERITY_COLOR } from './complianceVizData';
import { NoMatch, TabListToolbar } from './ComplianceTabFilter';

const pct = (a: number, n: number) => (n ? Math.round((a / n) * 100) : null);
const DIM = '#94A3B8';

function ResultIcon({ passed }: { passed: boolean | null }) {
  if (passed === null) return <MinusCircle size={15} className="text-[#B6C0CC]" />;
  return passed ? <CheckCircle2 size={15} className="text-[#22C55E]" /> : <XCircle size={15} className="text-[#DC2626]" />;
}

/** No previous scan — the policy's first scan of this endpoint. */
function FirstScanIcon() {
  return <span className="inline-flex"><Circle size={15} strokeDasharray="3 3" className="text-[#B6C0CC]" /></span>;
}

/** What the Previous → Last icons say, in words (their tooltip). */
function ScanChangeTip({ prev, last }: { prev: boolean | null; last: boolean | null }) {
  const word = (v: boolean | null) => (v === null ? 'Not checked' : v ? 'Pass' : 'Fail');
  const tone = (v: boolean | null) => (v === null ? 'text-white/70' : v ? 'text-[#86EFAC]' : 'text-[#FCA5A5]');
  return (
    <div className="space-y-1 text-[12px] leading-[1.5]">
      <div className="flex justify-between gap-6"><span className="text-white/70">Previous scan</span><span className={`font-medium ${tone(prev)}`}>{prev === null && last !== null ? 'None (first scan)' : word(prev)}</span></div>
      <div className="flex justify-between gap-6"><span className="text-white/70">Last scan</span><span className={`font-medium ${tone(last)}`}>{word(last)}</span></div>
    </div>
  );
}

/** What a group's pass-rate icon means (its tooltip). */
function GroupScoreTip({ ok, total, main }: { ok: number; total: number; main: boolean }) {
  const what = main ? 'group' : 'sub-group';
  if (!total) return <div className="text-[12px]">No rule in this {what} was checked on the last scan.</div>;
  const pct = Math.round((ok / total) * 100);
  const failing = total - ok;
  const status = ok === total ? `Every rule passes, so this ${what} is compliant.`
    : pct >= 50 ? `${failing} still ${failing === 1 ? 'fails' : 'fail'}, so this ${what} is partly compliant.`
    : `Under half pass, so this ${what} is failing.`;
  return (
    <div className="space-y-1 text-[12px] leading-[1.5]">
      <div><span className="font-semibold">{ok} of {total}</span> rules pass ({pct}%)</div>
      <div className="text-white/85">{status}</div>
    </div>
  );
}

/** A group's pass rate as a coloured icon: red under 50%, amber 50–99%, green at 100%. */
const scoreTone = (ok: number, total: number) => (!total ? '#94A3B8' : ok === total ? '#15803D' : ok / total >= 0.5 ? '#B45309' : '#DC2626');
function ScoreIcon({ ok, total }: { ok: number; total: number }) {
  if (!total) return <MinusCircle size={15} className="text-[#B6C0CC]" />;
  if (ok === total) return <CheckCircle2 size={15} className="text-[#22C55E]" />;
  return ok / total >= 0.5 ? <AlertCircle size={15} className="text-[#F59E0B]" /> : <XCircle size={15} className="text-[#DC2626]" />;
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
    <section className="overflow-hidden rounded-lg border border-[#E5E7EB]">
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

/* ── Export of one endpoint's assessment result (the breakdown view) ───────────────────────
   The popup is the product's Download popup (the Audit Trail one): Format · Password Protected ·
   Download / Cancel — with only the two formats a shared result needs, PDF and CSV. */

type ResultRow = { number: string; rule: string; severity: string; previous: string; last: string };
const resultWord = (v: boolean | null | undefined) => (v == null ? 'Not Scanned' : v ? 'Pass' : 'Fail');
const byNumber = (a: string, b: string) => {
  const x = a.split('.').map(Number); const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? -1) - (y[i] ?? -1); if (d) return d; }
  return 0;
};
function resultRows(benchmark: Benchmark, mine: Finding[]): ResultRow[] {
  const nums = ruleNumbers(benchmark);
  return [...nums.entries()]
    .map(([id, number]) => {
      const r = ruleById(id); const f = mine.find((x) => x.ruleId === id);
      return { number, rule: r?.name ?? id, severity: r?.severity ?? '', previous: resultWord(f?.prevPassed), last: resultWord(f ? f.passed : null) };
    })
    .sort((a, b) => byNumber(a.number, b.number));
}
export const fileSafe = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));

/** One table as a file: CSV downloads; PDF opens a print-ready page whose print dialog saves it
 *  as a PDF. `head` is the label/value summary above the table; Pass / Fail and the outcome words
 *  are coloured in the PDF wherever they appear. */
export function exportTable({ format, name, title, head, columns, rows }: {
  format: 'PDF' | 'CSV';
  name: string;
  title: string;
  head: string[][];
  columns: string[];
  rows: string[][];
}) {
  if (format === 'CSV') {
    const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [...head.map((h) => h.map(q).join(',')), '', columns.map(q).join(','), ...rows.map((r) => r.map(q).join(','))];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${name}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const w = window.open('', '_blank');
  if (!w) { toast.error('Allow pop-ups for this site to export a PDF'); return; }
  const tone = (v: string) => (/^(Pass|Compliant)$/.test(v) ? 'color:#15803D;font-weight:600' : /^(Fail|Non-Compliant)$/.test(v) ? 'color:#B42318;font-weight:600' : /^Not Scanned$/.test(v) ? 'color:#64748B' : '');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:13px Inter,Arial,sans-serif;color:#364658;margin:32px}h1{font-size:18px;margin:0 0 12px}
dl{display:grid;grid-template-columns:140px 1fr;gap:4px 12px;margin:0 0 20px}dt{color:#7B8FA5}dd{margin:0}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #E5E7EB}
th{font-size:12px;background:#F7F9FC}</style></head><body>
<h1>${esc(title)}</h1><dl>${head.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
<table><thead><tr>${columns.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
${rows.map((r) => `<tr>${r.map((v) => `<td style="${tone(v)}">${esc(v)}</td>`).join('')}</tr>`).join('')}
</tbody></table></body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

/** The Export icon + popup — the product's Download popup (Audit Trail): Format PDF | CSV,
 *  Password Protected, Export / Cancel. `onExport` builds the file. */
export function ExportButton({ title = 'Export', onExport, className = '' }: {
  title?: string;
  onExport: (format: 'PDF' | 'CSV', passwordProtected: boolean) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [pw, setPw] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const run = () => {
    if (pw && !password.trim()) { toast.error('Enter an attachment password'); return; }
    onExport(format, pw);
    setOpen(false);
  };
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} title={title} aria-label={title} className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]"><Download size={14} /> Export</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-lg">
            <h4 className="mb-3 text-[15px] font-semibold text-[#3D8BD0]">Export</h4>
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">Format</label>
              <div className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
                {(['PDF', 'CSV'] as const).map((fm) => (
                  <button key={fm} type="button" onClick={() => setFormat(fm)} className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${format === fm ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}>{fm}</button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">Password Protected</label>
              <button type="button" onClick={() => setPw((v) => !v)} role="switch" aria-checked={pw} className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${pw ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}>
                <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${pw ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
            {pw && (
              <div className="mb-1">
                <label className="mb-1.5 block text-[13px] text-[#7B8FA5]">Attachment Password <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Attachment Password" className="w-full rounded border border-[#DFE5ED] py-2 pl-9 pr-9 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#F0F1F3] pt-3">
              <button type="button" onClick={run} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]">Export</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExportResultButton({ ep, policy, benchmark, mine }: { ep: ComplianceEndpoint; policy: CompliancePolicy; benchmark: Benchmark; mine: Finding[] }) {
  return (
    <ExportButton
      title="Export assessment result"
      onExport={(format, pw) => {
        const pass = mine.filter((x) => x.passed).length;
        exportTable({
          format,
          name: `${fileSafe(ep.id)}-${fileSafe(policy.id)}-assessment`,
          title: `Assessment result — ${ep.hostName}`,
          head: [
            ['Endpoint', `${ep.id} · ${ep.hostName}`], ['IP Address', ep.ip], ['Policy', `${policy.id} · ${policy.name}`],
            ['Benchmark', benchmark.name], ['Last Scan', policy.lastScan ? fmtStamp(policy.lastScan.at) : '—'],
            ['Result', `${pass} passed · ${mine.length - pass} failed`],
          ],
          columns: ['Number', 'Rule', 'Severity', 'Previous Scan', 'Last Scan'],
          rows: resultRows(benchmark, mine).map((r) => [r.number, r.rule, r.severity, r.previous, r.last]),
        });
        toast.success(`Assessment result exported as ${format}${pw ? ' (password protected)' : ''}`);
      }}
    />
  );
}

export function ComplianceEndpointPanel({ endpointId, ruleId, policyId, onClose, onOpenEndpoint, onOpenPolicy, headBy = 'endpoint' }: {
  /** Whose ID + name heads the breakdown: the endpoint (opened from a policy) or the POLICY
      (opened from the endpoint's own page, where the endpoint is already the page). */
  headBy?: 'endpoint' | 'policy';
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
  /** Search over the breakdown's rules (number, name, group name). */
  const [bdQ, setBdQ] = useState('');

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
              {view.kind === 'breakdown' && ep && headBy === 'policy' && policy && (
                <>
                  <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
                    {onOpenPolicy ? (
                      <button type="button" onClick={() => { onClose(); onOpenPolicy(policy.id); }} title="Open policy" className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:underline">{policy.id}</button>
                    ) : (
                      <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{policy.id}</span>
                    )}
                    <span className="truncate">{policy.name}</span>
                  </h3>
                </>
              )}
              {view.kind === 'breakdown' && ep && headBy === 'endpoint' && (
                <>
                  <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
                    {ep.real && <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: ep.agentOnline ? '#22C55E' : '#F59E0B' }} title={ep.agentOnline ? 'Agent online' : 'Agent offline'} />}
                    {onOpenEndpoint ? (
                      <button type="button" onClick={() => { onClose(); onOpenEndpoint(ep.id); }} title="Open endpoint details" className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:underline">{ep.id}</button>
                    ) : (
                      <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{ep.id}</span>
                    )}
                    <span className="truncate">{ep.hostName}</span>
                  </h3>
                  {/* One line that says how this endpoint did: result · score · worst failing · when. */}
                  {policy && (() => {
                    const res = endpointResults(policy).find((r) => r.endpoint.id === ep.id);
                    const failing = findings.filter((f) => f.endpointId === ep.id && !f.passed);
                    const bySev = SEVERITIES.map((s) => [s, failing.filter((f) => ruleById(f.ruleId)?.severity === s).length] as const).filter(([, n]) => n);
                    const tone = res?.outcome === 'Compliant' ? { bg: '#ECFDF3', text: '#15803D' } : res?.outcome === 'Non-Compliant' ? { bg: '#FEF3F2', text: '#B42318' } : { bg: '#F1F5F9', text: '#64748B' };
                    // Label · value pairs split by dividers, as every detail header reads. The score
                    // is a KPI card below, not part of this line.
                    return (
                      <HeaderKpiRow gap="mt-[3px]" items={[
                        ckpi('status', 'Status', res?.outcome ?? '—', { color: tone.text }),
                        ...(res?.outcome !== 'Not Scanned'
                          ? [ckpi('failing', 'Failing Rules', bySev.length ? bySev.map(([s, n]) => `${n} ${s}`).join(', ') : 'None', { color: bySev.length ? '#B42318' : '#15803D' })]
                          : []),
                        ckpi('scan', 'Last Scan', policy.lastScan ? fmtStamp(policy.lastScan.at) : 'Not scanned yet'),
                      ]} />
                    );
                  })()}
                </>
              )}
              {rule && (
                <>
                  <h3 className="flex min-w-0 items-start gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
                    <span className="mt-1 h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[rule.severity].bar }} title={rule.severity} />
                    {number && <span className="flex-shrink-0 tabular-nums text-[#7B8FA5]">{number}</span>}
                    <span>{rule.name}</span>
                  </h3>
                  {/* The same facts row as the Rule details panel. */}
                  <RuleFactsRow rule={rule} />
                </>
              )}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-start gap-1.5">
            <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
          </div>
        </div>

        {view.kind === 'breakdown' && ep && policy && benchmark && (() => {
          const mine = findings.filter((f) => f.endpointId === ep.id);
          const ok = mine.filter((f) => f.passed).length;
          const got = mine.length > 0;
          const fresh = mine.filter((f) => f.prevPassed === true && !f.passed).length;
          return (
            <div className="flex-1 overflow-y-auto pb-5">
              <div className="-ml-1 mr-1 pt-4">
                <StatsCardsRow
                  rules={[]}
                  onApplyFilter={() => {}}
                  cards={[
                    // The endpoint's score on this policy: the share of its checked rules that pass.
                    { label: 'Average Compliance', value: got ? `${Math.round((ok / mine.length) * 100)}%` : '—', sub: got ? `${ok} of ${mine.length} rules pass` : 'not scanned', valueColor: got ? scoreColor(Math.round((ok / mine.length) * 100)) : DIM, static: true },
                    { label: 'Passed', value: got ? ok : '—', sub: 'rules', valueColor: got ? '#15803D' : DIM },
                    { label: 'Failed', value: got ? mine.length - ok : '—', sub: 'rules', valueColor: got && mine.length - ok ? '#DC2626' : DIM },
                    { label: 'New Failures', value: got ? fresh : '—', sub: 'passed last scan, fail now', valueColor: got && fresh ? '#B45309' : DIM },
                  ]}
                />
              </div>
              <div className="space-y-4 px-5">
                {got ? (
                  <>
                    <div className="flex items-center gap-3 pt-2">
                      <TabListToolbar className="min-w-0 flex-1" search={bdQ} onSearch={setBdQ} groups={[]} value={{}} onChange={() => {}} placeholder="Search rules..." />
                      <ExportResultButton ep={ep} policy={policy} benchmark={benchmark} mine={mine} />
                    </div>
                    {ruleTreeCount(benchmark, undefined, bdQ) === 0
                      ? <NoMatch what="rules" onClear={() => setBdQ('')} />
                      : <ComplianceBreakdown benchmark={benchmark} findings={mine} query={bdQ} onRule={(rid) => push({ kind: 'result', endpointId: ep.id, ruleId: rid })} />}
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
                  prevScan={policy ? runHistory(policy).filter((r) => r.status === 'Completed')[1]?.at : undefined}
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

/** The searched words, marked yellow inside a name (the Emails popup's highlight). */
export function Hl({ text, q }: { text: string; q?: string }) {
  const s = q?.trim();
  if (!s) return <>{text}</>;
  const i = text.toLowerCase().indexOf(s.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded-sm bg-[#FDE68A] px-0 text-inherit">{text.slice(i, i + s.length)}</mark>{text.slice(i + s.length)}</>;
}

/* How a search reads the tree: a rule matches on its own number or name, OR because its group
   (or sub-group) matches — a group found by name comes up with every rule it holds. */
const hits = (q: string, ...texts: string[]) => texts.some((t) => t.toLowerCase().includes(q));
/** Rules the tree will show for this search + filter — the caller's "nothing matches" test. */
export function ruleTreeCount(benchmark: Benchmark, show: ((id: string) => boolean) | undefined, query: string): number {
  const q = query.trim().toLowerCase();
  let n = 0;
  for (const g of numberedGroups(benchmark)) {
    const gHit = !!q && hits(q, g.number, g.name);
    const count = (rules: NumberedRule[], groupHit: boolean) => rules.filter((r) => (!show || show(r.id)) && (!q || groupHit || hits(q, r.number, ruleById(r.id)?.name ?? ''))).length;
    n += count(g.rules, gHit);
    for (const s of g.children) n += count(s.rules, gHit || (!!q && hits(q, s.number, s.name)));
  }
  return n;
}

export function RuleGroupTree({ benchmark, resultOf = () => null, right, onRule, title = 'Rules', note, show, plain = false, query = '', linkRows = true, scoreHeads = false }: {
  benchmark: Benchmark;
  /** What this page knows about a rule — null when it was not checked. */
  resultOf?: (ruleId: string) => RuleTally | null;
  /** The end of a rule row (Pass/Fail icons, or "Failed on 3 of 4"). */
  right?: (ruleId: string, t: RuleTally | null) => React.ReactNode;
  /** The rules and nothing else — numbers and names, no results, no severity (the Policy and
      Benchmark Rules tabs). Every group starts open. */
  plain?: boolean;
  onRule: (ruleId: string) => void;
  /** Rows read like the Rules listing: no arrow, the name takes a dotted underline on hover. */
  linkRows?: boolean;
  /** One endpoint's results (View rule results): a group head reads "n/n rules pass · %" with an
      icon coloured by that % (red under 50, amber 50–99, green at 100), and a rule's severity
      sits right after its name. */
  scoreHeads?: boolean;
  title?: string;
  /** A short line at the right of the header (e.g. "Previous → Last scan"). */
  note?: string;
  /** Narrows the tree (a count card's filter): rules it rejects are hidden, and so is any
      group or sub-group left with none. */
  show?: (ruleId: string) => boolean;
  /** The search text: matching rules show under their groups, a group matched by its own name
      shows with all its rules, and the matched words are highlighted. */
  query?: string;
}) {
  const q = query.trim().toLowerCase();
  const narrowing = !!show || !!q;
  const visible = (rules: NumberedRule[], groupHit = false) =>
    rules.filter((r) => (!show || show(r.id)) && (!q || groupHit || hits(q, r.number, ruleById(r.id)?.name ?? '')));
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
    if (plain) { setOpen(new Set(tree.flatMap((g) => [g.key, ...g.children.map((s) => s.key)]))); return; }
    for (const g of tree) {
      const subsFailed = g.children.filter((s) => tally(s.rules).failed);
      if (tally(g.rules).failed || subsFailed.length) keys.push(g.key);
      keys.push(...subsFailed.map((s) => s.key));
    }
    setOpen(new Set(keys));
  }, [tree, sig, plain]);
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const head = (key: string, number: string, name: string, rules: NumberedRule[], depth: 0 | 1) => {
    const { ok, total } = tally(rules);
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        className={`flex w-full items-center gap-2 py-2.5 pr-4 text-left transition-colors ${scoreHeads && !depth ? 'bg-[#F4F7FB] hover:bg-[#EDF2F8]' : 'hover:bg-[#F9FAFB]'} ${depth ? 'pl-9' : 'pl-4'}`}
      >
        <ChevronRight size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open.has(key) ? 'rotate-90' : ''}`} />
        <span className="w-[40px] flex-shrink-0 text-[13px] font-semibold tabular-nums text-[#364658]"><Hl text={number} q={query} /></span>
        <span className={`min-w-0 flex-1 truncate text-[13px] text-[#364658] ${depth ? '' : 'font-medium'}`}><Hl text={name} q={query} /></span>
        {!plain && scoreHeads && (
          <>
            <span className="whitespace-nowrap text-[12px] tabular-nums text-[#64748B]" title="Rules passing / rules checked">
              {ok}/{total}{depth ? '' : ' rules pass'}
              {total > 0 && <> · <span className="font-semibold" style={{ color: scoreTone(ok, total) }}>{Math.round((ok / total) * 100)}%</span></>}
            </span>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild><span className="inline-flex"><ScoreIcon ok={ok} total={total} /></span></TooltipTrigger>
              <TooltipContent side="left" className="max-w-[280px] text-wrap">
                <GroupScoreTip ok={ok} total={total} main={!depth} />
              </TooltipContent>
            </Tooltip>
          </>
        )}
        {!plain && !scoreHeads && (
          <>
            <span className="text-[12px] tabular-nums text-[#7B8FA5]" title="Rules passing / rules checked">{ok}/{total}</span>
            <ResultIcon passed={total ? ok === total : null} />
          </>
        )}
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
        {!plain && <span className="h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[r.severity] }} title={r.severity} />}
        <span className="w-[44px] flex-shrink-0 text-[12px] tabular-nums text-[#7B8FA5]"><Hl text={nr.number} q={query} /></span>
        {scoreHeads ? (
          /* The severity finishes the sentence: it follows the name, not the row's end. */
          <span className="min-w-0 flex-1 text-[13px] leading-[1.6] text-[#364658]">
            <span className="decoration-[#94A3B8] decoration-dotted underline-offset-[3px] group-hover/rule:underline"><Hl text={r.name} q={query} /></span>
            <span className="ml-2 inline-block align-middle"><SeverityPill severity={r.severity} /></span>
          </span>
        ) : (
          <span className={`line-clamp-2 min-w-0 flex-1 break-words text-[13px] text-[#364658] ${linkRows ? "decoration-[#94A3B8] decoration-dotted underline-offset-[3px] group-hover/rule:underline" : "group-hover/rule:text-[#3D8BD0]"}`}><Hl text={r.name} q={query} /></span>
        )}
        {!plain && !scoreHeads && <SeverityPill severity={r.severity} />}
        {!plain && right?.(r.id, resultOf(r.id))}
        {!linkRows && <ChevronRight size={14} className="flex-shrink-0 text-[#B6C0CC] group-hover/rule:text-[#3D8BD0]" />}
      </button>
    );
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#E5E7EB]">
      <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[#364658]">{title}</span>
        {note && <span className="text-[11px] text-[#7B8FA5]">{note}</span>}
      </header>
      {tree.map((g) => {
        const gHit = !!q && hits(q, g.number, g.name);
        const sHit = (s: { number: string; name: string }) => gHit || (!!q && hits(q, s.number, s.name));
        const subs = g.children.filter((s) => visible(s.rules, sHit(s)).length);
        if (!visible(g.rules, gHit).length && !subs.length) return null;
        return (
          <div key={g.key} className="border-b border-[#EEF2F6] last:border-b-0">
            {head(g.key, g.number, g.name, [...g.rules, ...g.children.flatMap((s) => s.rules)], 0)}
            {(open.has(g.key) || narrowing) && (
              <>
                {visible(g.rules, gHit).map((r) => ruleRow(r, 1))}
                {subs.map((s) => (
                  <div key={s.key}>
                    {head(s.key, s.number, s.name, s.rules, 1)}
                    {(open.has(s.key) || narrowing) && visible(s.rules, sHit(s)).map((r) => ruleRow(r, 2))}
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
export function ComplianceBreakdown({ benchmark, findings, onRule, query }: {
  benchmark: Benchmark;
  /** This endpoint's findings for the policy. */
  findings: Finding[];
  /** Search text — highlighted, matches shown under their groups. */
  query?: string;
  onRule: (ruleId: string) => void;
}) {
  const byRule = useMemo(() => new Map(findings.map((f) => [f.ruleId, f])), [findings]);
  return (
    <RuleGroupTree
      benchmark={benchmark}
      title="Compliance Breakdown"
      note="Previous → Last scan"
      query={query}
      onRule={onRule}
      linkRows
      scoreHeads
      resultOf={(id) => { const f = byRule.get(id); return f ? { passed: f.passed ? 1 : 0, failed: f.passed ? 0 : 1 } : null; }}
      right={(id) => {
        const f = byRule.get(id);
        return (
          <span className="flex flex-shrink-0 items-center gap-3">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="flex w-[64px] items-center justify-end gap-1.5">
                  {/* A first scan has nothing before it: the dashed circle says so. */}
                  {f && f.prevPassed === null ? <FirstScanIcon /> : <ResultIcon passed={f?.prevPassed ?? null} />}
                  <span className="text-[11px] text-[#B6C0CC]">→</span>
                  <ResultIcon passed={f ? f.passed : null} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="w-[260px] text-wrap">
                <ScanChangeTip prev={f ? f.prevPassed : null} last={f ? f.passed : null} />
              </TooltipContent>
            </Tooltip>
            <span className="w-[84px] text-right"><ResultPill passed={f ? f.passed : null} /></span>
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
    <div className="overflow-x-auto"><table className="w-full min-w-[640px] table-fixed">
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
    </table></div>
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
          <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E7EB]">
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

function ResultCard({ rule, endpoint, finding, lastScan, prevScan, exception, onRequestException, onOpenEndpoint }: {
  rule: ComplianceRule;
  endpoint: { id: string; hostName: string };
  finding?: Finding;
  lastScan?: string;
  /** When the policy ran before the last scan (the run the Previous result comes from). */
  prevScan?: string;
  exception?: ComplianceException;
  /** Offered only on a Fail with no request yet. */
  onRequestException?: () => void;
  onOpenEndpoint?: () => void;
}) {
  const label = 'text-[12px] text-[#7B8FA5]';
  return (
    <section className="overflow-hidden rounded-lg border border-[#E5E7EB]">
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
        {/* The previous result, with WHEN that scan ran beside it. */}
        <div><div className={label}>Previous Scan</div><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">{finding?.prevPassed == null
          ? <span className="text-[13px] text-[#94A3B8]">None (first scan)</span>
          : <><ResultPill passed={finding.prevPassed} /><span className="text-[13px] text-[#364658]">{prevScan ? fmtStamp(prevScan) : '—'}</span></>}</div></div>
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
      {/* No Request exception here — exceptions are not part of this flow (Zeni, 28 Oct 2026). */}
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
