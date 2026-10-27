import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Play, X } from 'lucide-react';
import { DrawerTabStrip } from './DrawerTabStrip';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderCopyButton } from './HeaderCopyButton';
import { StatsCardsRow } from './AssetStatsRow';
import { AuditTrailsTabContent } from './AuditTrailsTabContent';
import type { AuditEntry } from './AuditTrailsTabContent';
import { SeverityPill } from './ComplianceShared';
import { ComplianceBreakdown, ComplianceEndpointPanel, FailedBySeverity, severityCounts } from './ComplianceEndpointPanel';
import { ruleById, ruleNumbers, SEVERITIES } from './complianceData';
import {
  benchmarkOf, complianceEndpoint, endpointResults, findingsOf, fmtStamp, getPolicy, policyStore, resolvedEndpoints,
  useExceptions, usePolicies,
} from './compliancePolicyData';
import type { EndpointOutcome, Finding } from './compliancePolicyData';
import { scoreColor } from './complianceVizData';
import { useDrawerStack } from './DrawerStack';

/* Compliance › Endpoint — the endpoint's detail page. Opened from wherever an endpoint is
 * clicked in the Compliance module (the Endpoints page, a policy's Endpoints tab, the Dashboard)
 * through the shared DrawerStack, so it is a tab in the same drawer every other record opens in.
 * A RULE opens the rule side panel over it (ComplianceEndpointPanel), never another page.
 *
 * Tabs: Policies · Audit Trail — rules are read PER POLICY: a Policies row opens that policy's
 * rule groups with this endpoint's Pass/Fail, headed by the policy. Compliance % is not shown here — it lives on the
 * Policy page's Endpoints tab only.
 * A Policies row opens a side drawer: that policy's rule groups with this endpoint's Pass/Fail.
 *
 * Opened FROM A POLICY (id "EP-512@CP-101") it is the endpoint × that policy page: everything
 * reads one policy, the Policies tab drops out, it lands on Rules, and the header links to the
 * endpoint's own page and to the policy.
 * Compliance-only endpoints (network devices, servers not in the Endpoints module) get the same
 * tabs; only the agent-only properties are left out of the right panel.
 *
 * Read only, and LIVE: it reads the policy store, so Scan Now (or a scan anywhere) shows here. */

type Tab = 'policies' | 'audit';
const TABS: [Tab, string][] = [['policies', 'Policies'], ['audit', 'Audit Trail']];
const OUTCOME_TONE: Record<EndpointOutcome, { bg: string; text: string }> = {
  Compliant: { bg: '#ECFDF3', text: '#15803D' },
  'Non-Compliant': { bg: '#FEF3F2', text: '#B42318' },
  'Not Scanned': { bg: '#F1F5F9', text: '#64748B' },
};
const DIM = '#94A3B8';
const pct = (a: number, n: number) => (n ? Math.round((a / n) * 100) : null);

function kpi(key: string, label: string, value: React.ReactNode, tip: string): HeaderKpiItem {
  return {
    key, tip, node: (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[11px] text-[#7B8FA5]">{label}</span>
        <span className="text-[12px] font-medium text-[#364658]">{value}</span>
      </span>
    ),
  };
}
function OutcomePill({ outcome }: { outcome: EndpointOutcome }) {
  const t = OUTCOME_TONE[outcome];
  return <span className="inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: t.bg, color: t.text }}>{outcome}</span>;
}
const th = 'px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
const IdPill = ({ id }: { id: string }) => <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{id}</span>;

export function ComplianceEndpointDrawer({
  activeAssetId, data, stackTabs, onCloseTab, onTabChange, onClose, stackWidth, onStackWidthChange, stackMinimized, onStackMinimizedChange,
  stackActiveTab, onStackActiveTabChange,
}: {
  activeAssetId: string;
  data?: unknown;
  stackTabs?: { id: string; subject?: string }[];
  onCloseTab?: (id: string) => void;
  onTabChange?: (id: string) => void;
  onClose: () => void;
  stackWidth?: number;
  onStackWidthChange?: (w: number) => void;
  stackMinimized?: boolean;
  onStackMinimizedChange?: (m: boolean) => void;
  stackActiveTab?: string;
  onStackActiveTabChange?: (t: string) => void;
}) {
  const policies = usePolicies();
  const exceptions = useExceptions();
  /* "EP-512@CP-101" = this endpoint within one policy. */
  const [epId, lockPolicy] = activeAssetId.split('@');
  const ep = complianceEndpoint(epId);
  const { open: openInStack } = useDrawerStack();
  const tabList = TABS;

  const [tabLocal, setTabLocal] = useState<Tab>('policies');
  const tab = ((stackActiveTab as Tab) && tabList.some(([t]) => t === stackActiveTab) ? stackActiveTab : tabLocal) as Tab;
  const setTab = (t: Tab) => { setTabLocal(t); onStackActiveTabChange?.(t); };
  const [widthLocal, setWidthLocal] = useState(stackWidth ?? 99999);
  const full = (stackWidth ?? widthLocal) > 1080;
  const toggleFull = () => { const w = full ? 1080 : 99999; setWidthLocal(w); onStackWidthChange?.(w); };
  /** The rule whose result is open in the side panel, and the policy it is read against. */
  const [openRule, setOpenRule] = useState<{ ruleId: string; policyId: string } | null>(null);
  /** The policy whose rule groups (with this endpoint's Pass/Fail) are open in the side drawer. */
  const [policyDrawer, setPolicyDrawer] = useState<string | null>(null);

  /* Every policy that assesses this endpoint, with its result here. */
  const mine = useMemo(
    () => policies
      .filter((p) => (!lockPolicy || p.id === lockPolicy) && resolvedEndpoints(p).some((e) => e.id === epId))
      .map((p) => ({ policy: p, result: endpointResults(p).find((r) => r.endpoint.id === epId)! })),
    [policies, epId, lockPolicy],
  );
  const [pid, setPid] = useState(lockPolicy ?? mine.find((m) => m.policy.lastScan)?.policy.id ?? mine[0]?.policy.id ?? '');
  useEffect(() => { if (!mine.some((m) => m.policy.id === pid)) setPid(mine[0]?.policy.id ?? ''); }, [mine, pid]);

  /* All of this endpoint's findings, across its policies (the Overview), and per policy (Rules). */
  const allFindings = useMemo(() => mine.flatMap((m) => findingsOf(m.policy).filter((f) => f.endpointId === epId)), [mine, epId]);
  const sel = mine.find((m) => m.policy.id === pid);
  const selFindings = useMemo(() => (sel ? findingsOf(sel.policy).filter((f) => f.endpointId === epId) : []), [sel, epId]);
  const myExceptions = exceptions.filter((x) => x.endpointId === epId && (!lockPolicy || x.policyId === lockPolicy));

  const tabs = stackTabs ?? (ep ? [{ id: activeAssetId, subject: ep.hostName }] : []);
  if (!ep) return null;
  if (stackMinimized) {
    return <MinimizedDrawerRail items={tabs} activeId={activeAssetId} onSelect={(id) => { onTabChange?.(id); onStackMinimizedChange?.(false); }} onRestore={() => onStackMinimizedChange?.(false)} />;
  }

  const passed = allFindings.filter((f) => f.passed).length;
  const failedRules = new Set(allFindings.filter((f) => !f.passed).map((f) => f.ruleId)).size;
  const fresh = allFindings.filter((f) => f.prevPassed === true && !f.passed).length;
  const reached = allFindings.length > 0;
  const lastScan = mine.map((m) => m.policy.lastScan?.at).filter(Boolean).sort().pop();
  const scanning = mine.some((m) => m.policy.scanning);
  const runnable = mine.filter((m) => m.policy.enabled);

  const scanNow = () => {
    runnable.forEach((m) => policyStore.run(m.policy.id));
    toast.success(`Scanning ${ep.hostName} — ${runnable.length} polic${runnable.length === 1 ? 'y' : 'ies'}`);
  };
  const openPolicy = (id: string) => { const p = getPolicy(id); if (p) openInStack('compliance-policies', p.id, p.name, p); };

  const kpis = [
    kpi('failed', 'Failed Rules', reached ? failedRules : '—', 'Rules failing on the last scan'),
    kpi('new', 'New Failures', reached ? fresh : '—', 'Passed on the previous scan, fail now'),
    kpi('policies', 'Policies', mine.length, mine.map((m) => m.policy.name).join(', ') || 'No policy assesses it'),
    kpi('last', 'Last Scan', fmtStamp(lastScan), 'The newest scan that reached it'),
  ];

  const fields: [string, React.ReactNode][] = [
    ['IP Address', ep.ip],
    ['Operating System', ep.osName],
    ['Version', ep.osVersion],
    ['Type', ep.type],
    ['Remote Office', ep.office],
    ...(ep.real ? [['Agent Status', <span key="a" className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: ep.agentOnline ? '#22C55E' : '#F59E0B' }} />{ep.agentOnline ? 'Online' : 'Offline'}</span>] as [string, React.ReactNode]] : []),
  ];

  const audit: AuditEntry[] = [
    ...myExceptions.map((x, i) => ({
      id: `x${i}`, timestamp: x.requestedAt.replace('T', ' ') + ':00', user: 'You', userInitials: 'YO', userColor: '#3D8BD0',
      action: 'Exception Requested', details: `${ruleById(x.ruleId)?.name ?? x.ruleId} — ${x.reason}, expires ${x.expiresOn}`, changes: [],
    })),
    ...mine.filter((m) => m.policy.lastScan).map((m, i) => ({
      id: `s${i}`, timestamp: m.policy.lastScan!.at.replace('T', ' ') + ':00', user: 'System', userInitials: 'SY', userColor: '#64748B',
      action: 'Scan Completed', details: `${m.policy.name}: ${m.result.outcome}`,
      changes: [],
    })),
    ...mine.map((m, i) => ({
      id: `p${i}`, timestamp: m.policy.createdAt.replace('T', ' ') + ':00', user: m.policy.createdBy, userInitials: m.policy.createdBy.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase(), userColor: '#8B5CF6',
      action: 'Added to Policy', details: `Assessed by ${m.policy.name}`, changes: [],
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <>
      <div className={`fixed right-0 top-0 z-50 flex h-screen flex-col bg-white shadow-2xl ${full ? '' : 'border-l border-[#e5e7eb]'}`} style={{ width: full ? '100vw' : 1080 }} data-drawer>
        <div className="flex items-center border-b border-[#e5e7eb] bg-[#f9fafb]">
          <DrawerTabStrip items={tabs} activeId={activeAssetId} onSelect={(id) => onTabChange?.(id)} onClose={(id) => onCloseTab?.(id)} />
          <button onClick={() => onStackMinimizedChange?.(true)} className="border-l border-[#e5e7eb] p-2 hover:bg-[#e5e7eb]" title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="#364658" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <button onClick={toggleFull} className="p-2 hover:bg-[#e5e7eb]" title={full ? 'Switch to small view' : 'Switch to full view'}>
            {full ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="12" height="12" rx="1.5" stroke="#364658" strokeWidth="2" /><path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5H18A1.5 1.5 0 0 1 19.5 6.5V15A1.5 1.5 0 0 1 18 16.5H16" stroke="#364658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="1.5" stroke="#364658" strokeWidth="2" /></svg>
            )}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[#e5e7eb]" title="Close"><X size={18} className="text-[#364658]" /></button>
        </div>

        {/* Header — agent dot (agent endpoints), ID pill + host name, the KPI strip, actions right. */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-[18px] font-semibold text-[#364658]">
              {ep.real && <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: ep.agentOnline ? '#22C55E' : '#F59E0B' }} title={ep.agentOnline ? 'Agent online' : 'Agent offline'} />}
              <HeaderIdPill id={ep.id} />
              <span className="truncate">{ep.hostName}</span>
            </h1>
            <HeaderKpiRow items={kpis} />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <HeaderCopyButton variant="link" value={`/compliance-endpoints?open=${activeAssetId}`} label="Copy Endpoint URL" />
            <button
              type="button"
              disabled={scanning || !runnable.length}
              onClick={scanNow}
              title={!runnable.length ? 'No enabled policy assesses this endpoint' : 'Run every enabled policy that assesses it'}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-60"
            >{scanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}{scanning ? 'Scanning…' : 'Scan Now'}</button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-shrink-0 gap-2.5 border-b border-[#e5e7eb] px-6">
              {tabList.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
                >
                  {label}
                  {id === 'policies' && <span className="ml-1.5 rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold text-[#3D8BD0]">{mine.length}</span>}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* ── Policies: every policy that assesses it ── */}
              {tab === 'policies' && (
                <div className="px-6 py-4">
                  <table className="w-full table-fixed">
                    <colgroup><col /><col className="w-[32%]" /><col className="w-[150px]" /><col className="w-[190px]" /></colgroup>
                    <thead><tr className="border-b border-[#e5e7eb]">{['Policy', 'Benchmark', 'Result', 'Last Scan'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {mine.map(({ policy, result }) => (
                        <tr key={policy.id} onClick={() => setPolicyDrawer(policy.id)} className="group/row cursor-pointer transition-colors hover:bg-[#f9fafb]">
                          <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><IdPill id={policy.id} /><span className="truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]">{policy.name}</span></span></td>
                          <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]" title={benchmarkOf(policy.benchmarkId)?.name}>{benchmarkOf(policy.benchmarkId)?.name ?? '—'}</span></td>
                          <td className="px-4 py-3"><OutcomePill outcome={result.outcome} /></td>
                          <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#64748B]">{fmtStamp(policy.lastScan?.at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mine.length === 0 && <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No policy assesses this endpoint.</p>}
                </div>
              )}

              {tab === 'audit' && <AuditTrailsTabContent entries={audit} />}
            </div>
          </div>

          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Endpoint Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] px-4 py-3 text-[14px] font-semibold text-[#364658]">Endpoint Fields</div>
                <dl className="space-y-3.5 px-4 py-4">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[12px] text-[#64748B]">{label}</dt>
                      <dd className="mt-0.5 text-[13px] leading-[1.55] text-[#364658]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {policyDrawer && (
        <ComplianceEndpointPanel
          key={`policy|${policyDrawer}`}
          endpointId={ep.id}
          policyId={policyDrawer}
          headBy="policy"
          onClose={() => setPolicyDrawer(null)}
          onOpenPolicy={openPolicy}
        />
      )}
      {openRule && (
        <ComplianceEndpointPanel
          key={`${openRule.policyId}|${openRule.ruleId}`}
          endpointId={ep.id}
          ruleId={openRule.ruleId}
          policyId={openRule.policyId}
          onClose={() => setOpenRule(null)}
        />
      )}
    </>
  );
}

/** Opens an endpoint's compliance detail page in the shared drawer — the one entry point every
 *  Compliance page uses, so a click on an endpoint lands in the same place from anywhere. */
export function useOpenComplianceEndpoint() {
  const { open } = useDrawerStack();
  /** inPolicy: open the endpoint × that policy page instead of the endpoint's own page. */
  return (id: string, inPolicy?: string) => {
    const e = complianceEndpoint(id);
    if (!e) return;
    const p = inPolicy ? getPolicy(inPolicy) : undefined;
    if (p) open('compliance-endpoints', `${e.id}@${p.id}`, `${e.hostName} · ${p.name}`);
    else open('compliance-endpoints', e.id, e.hostName);
  };
}
