/* Compliance Visualization — Overview tab.
 *
 * Built from the DASHBOARD module's own widget pieces, so it reads as one more board: the
 * widget card (`.dc-WidgetCard` — header band, title, info, body), the KPI number, the ECharts
 * `ChartTile` and the `DataTable`. The board-only furniture a WidgetCard carries (Edit, Delete
 * card, Move to group, per-widget date range) is left out — this page is fixed, not authored.
 *
 * What it answers, top to bottom (content from the ObserveOps compliance prototype):
 *   how compliant is the estate, and is it getting better?   → KPIs · trend
 *   what failed, and how bad is it?                        → pass/fail · failed by severity
 *   which policies and which endpoints are worst?           → policy scores · posture · top endpoints
 *   what changed since the last scan, and which rules break most? → two tables
 * Every number comes from vizSnapshot(), so the widgets always agree. */
import { useMemo } from 'react';
import { Info } from 'lucide-react';
import './dashboard/dashboard.css';
import { ChartTile } from './dashboard/components/ChartTile';
import { DataTable } from './dashboard/components/DataTable';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SEVERITIES } from './complianceData';
import type { Severity } from './complianceData';
import { usePolicies } from './compliancePolicyData';
import { POSTURES, scoreColor, SEVERITY_COLOR, TARGET_SCORE, vizSnapshot } from './complianceVizData';

const TOP_N = 10;

/** The dashboard's widget card, minus the board's authoring actions. */
function Widget({ title, info, span, height, flush, children }: {
  title: string; info?: string; span: number; height?: number; flush?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="dc-WidgetCard tile card" style={{ gridColumn: `span ${span}`, minHeight: height }}>
      <div className="thead" style={{ cursor: 'default', minHeight: 34 }}>
        <div className="left">
          <span className="title ellip">{title}</span>
          {info && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span className="inline-grid cursor-help place-items-center text-[#9CA3AF] hover:text-[#3D8BD0]"><Info size={13} /></span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-wrap">{info}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="tbody" style={flush ? { padding: 0 } : undefined}>{children}</div>
    </div>
  );
}

/** The dashboard KPI tile's number, with an optional line under it. */
function Kpi({ value, unit, color, sub }: { value: React.ReactNode; unit?: string; color?: string; sub?: React.ReactNode }) {
  return (
    <div className="kpi" style={{ padding: '10px 12px' }}>
      <div className="kpinum" style={{ color, fontSize: 40 }}>{value}{unit && <span className="unit">{unit}</span>}</div>
      {sub && <div className="mt-2 text-[12px] text-[#7B8FA5]">{sub}</div>}
    </div>
  );
}

export function ComplianceVizOverview({ onOpenPolicy, onOpenEndpoint }: {
  onOpenPolicy: (policyId: string) => void;
  onOpenEndpoint: (endpointId: string) => void;
}) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);

  const scanned = v.endpoints.filter((e) => e.score !== null);
  const notReached = v.endpoints.filter((e) => e.notReached);

  const trendChart = useMemo(() => ({
    kind: 'line',
    labels: v.trend.map((t) => t.day),
    series: [
      { name: 'Compliance %', values: v.trend.map((t) => t.score) },
      { name: `Target ${TARGET_SCORE}%`, values: v.trend.map(() => TARGET_SCORE) },
    ],
    colors: { 'Compliance %': '#3D8BD0', [`Target ${TARGET_SCORE}%`]: '#B6C0CC' },
  }), [v]);

  const resultChart = {
    kind: 'donut', labels: ['Passed', 'Failed'], series: [{ name: 'Checks', values: [v.passed, v.failed] }],
    colors: { Passed: '#22C55E', Failed: '#DC2626' },
  };

  const postureChart = useMemo(() => {
    const counts = POSTURES.map((p) => scanned.filter((e) => e.posture === p.label).length);
    return {
      kind: 'donut',
      labels: [...POSTURES.map((p) => p.label), 'Not reached'],
      series: [{ name: 'Endpoints', values: [...counts, notReached.length] }],
      colors: { ...Object.fromEntries(POSTURES.map((p) => [p.label, p.color])), 'Not reached': '#94A3B8' },
    };
  }, [v]);

  /* Lowest first — the reason to read this widget is "which policy is worst". */
  const policyRows = v.stats.filter((s) => s.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 8);

  const topEndpoints = [...scanned].sort((a, b) => b.failed - a.failed || (a.score ?? 0) - (b.score ?? 0)).slice(0, TOP_N);
  const topEndpointChart = {
    kind: 'bar',
    labels: topEndpoints.map((e) => e.endpoint.hostName),
    series: [{ name: 'Failed checks', values: topEndpoints.map((e) => e.failed) }],
    colors: { 'Failed checks': '#F97316' },
  };

  const newFailures = scanned.filter((e) => e.newFailures > 0).sort((a, b) => b.newFailures - a.newFailures).slice(0, TOP_N);
  const topRules = v.rules.filter((r) => r.failing > 0).sort((a, b) => b.failing - a.failing || (a.score ?? 0) - (b.score ?? 0)).slice(0, TOP_N);

  /* DataTable hands every cell to this slot: an endpoint id becomes the product's id pill
     (it opens that endpoint's results), a severity gets its dot, the rest prints plain. */
  const cell = ({ value }: { value: any }) => {
    if (typeof value === 'string' && /^EP-\d+$/.test(value)) {
      return (
        <button type="button" onClick={() => onOpenEndpoint(value)} className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9]">
          {value}
        </button>
      );
    }
    if (typeof value === 'string' && (SEVERITIES as string[]).includes(value)) {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[value as Severity] }} />
          {value}
        </span>
      );
    }
    return value;
  };

  const sevTotal = Math.max(1, v.failed);

  return (
    <div className="dash-root" data-theme="light" style={{ background: 'transparent' }}>
      <div className="grid grid-cols-12 gap-3 px-6 pb-8 pt-4">
        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <Widget title="Compliance Score" span={3} info="Checks passed of checks run, across every endpoint every policy assessed on its last scan.">
          <Kpi value={v.score ?? '—'} unit={v.score === null ? undefined : '%'} color={scoreColor(v.score)} sub={`Target ${TARGET_SCORE}%`} />
        </Widget>
        <Widget title="Endpoints Assessed" span={3} info="Endpoints at least one policy scanned on its last run.">
          <Kpi value={scanned.length} sub={`of ${v.endpoints.length} in scope`} />
        </Widget>
        <Widget title="Failed Checks" span={3} info="Rule checks that failed on the last scan, across every policy.">
          <Kpi value={v.failed.toLocaleString('en-US')} color={v.failed ? '#DC2626' : undefined} sub={`of ${(v.passed + v.failed).toLocaleString('en-US')} run`} />
        </Widget>
        <Widget title="Endpoints Not Reached" span={3} info="Endpoints whose agent was offline — counted in scope, never scored.">
          <Kpi value={notReached.length} color={notReached.length ? '#B45309' : undefined} sub={notReached.length ? notReached.slice(0, 2).map((e) => e.endpoint.hostName).join(', ') + (notReached.length > 2 ? ` +${notReached.length - 2}` : '') : 'Every agent answered'} />
        </Widget>

        {/* ── trend + results ──────────────────────────────────────────────── */}
        <Widget title="Compliance Trend" span={8} height={290} info={`Daily compliance score for the last 30 days, against the ${TARGET_SCORE}% target.`}>
          <ChartTile chart={trendChart} height={232} />
        </Widget>
        <Widget title="Rule Assessment Results" span={4} height={290} info="Every check run on the last scan — passed or failed.">
          <ChartTile chart={resultChart} height={232} />
        </Widget>

        {/* ── severity + policies ──────────────────────────────────────────── */}
        <Widget title="Failed by Severity" span={4} height={300} info="Failed checks by the severity of the rule they broke.">
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            {SEVERITIES.map((s) => {
              const n = v.failedBySeverity[s];
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="flex w-[78px] items-center gap-2 text-[12px] text-[#364658]">
                    <span className="size-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />{s}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF2F6]">
                    <span className="block h-full rounded-full" style={{ width: `${(n / sevTotal) * 100}%`, backgroundColor: SEVERITY_COLOR[s] }} />
                  </span>
                  <span className="w-[34px] text-right text-[13px] font-semibold tabular-nums text-[#364658]">{n}</span>
                  <span className="w-[34px] text-right text-[11px] tabular-nums text-[#7B8FA5]">{Math.round((n / sevTotal) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </Widget>
        <Widget title="Policy Scores" span={8} height={300} info="Each scanned policy's compliance, lowest first. Click one to open it.">
          <div className="flex flex-1 flex-col justify-center gap-1">
            {policyRows.map((s) => (
              <button
                key={s.policy.id}
                type="button"
                onClick={() => onOpenPolicy(s.policy.id)}
                className="group flex flex-col gap-1 rounded px-2 py-1 text-left transition-colors hover:bg-[#F5F7FA]"
              >
                <span className="flex items-baseline gap-2 text-[12.5px]">
                  <span className="truncate font-medium text-[#364658] group-hover:text-[#3D8BD0]">{s.policy.name}</span>
                  <span className="flex-shrink-0 text-[11px] text-[#9CA3AF]">{s.endpoints} endpoints</span>
                  <span className="ml-auto flex-shrink-0 font-semibold tabular-nums" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
                  <span className="block h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: scoreColor(s.score) }} />
                </span>
              </button>
            ))}
          </div>
        </Widget>

        {/* ── posture + top endpoints ──────────────────────────────────────── */}
        <Widget title="Endpoint Posture" span={4} height={300} info="Endpoints by how many of their checks pass: Secure 90%+, Moderate 70–89%, Poor 50–69%, Vulnerable under 50%.">
          <ChartTile chart={postureChart} height={240} />
        </Widget>
        <Widget title={`Top ${TOP_N} Endpoints Failed in Last Scan`} span={8} height={300} info="Endpoints with the most failed checks on their last scan.">
          <ChartTile chart={topEndpointChart} height={240} legend={false} />
        </Widget>

        {/* ── tables ───────────────────────────────────────────────────────── */}
        <Widget title={`Top ${TOP_N} Endpoints with New Failures`} span={6} flush info="Checks that passed on the previous scan and fail now — counted check by check, so an endpoint that broke rules and fixed as many still shows.">
          <DataTable
            columns={['Endpoint', 'Host Name', 'Previous Scan', 'Last Scan', 'New Failures']}
            rows={newFailures.map((e) => [e.endpoint.id, e.endpoint.hostName, `${e.prevPassed} pass · ${e.prevFailed} fail`, `${e.passed} pass · ${e.failed} fail`, e.newFailures])}
            emptyText="No endpoint has a new failure"
            slotCell={cell}
          />
        </Widget>
        <Widget title={`Top ${TOP_N} Failed Rules`} span={6} flush info="Rules failing on the most endpoints.">
          <DataTable
            columns={['Rule', 'Severity', 'Failing On']}
            rows={topRules.map((r) => [r.rule.name, r.rule.severity, `${r.failing} of ${r.checked}`])}
            emptyText="No rule is failing"
            slotCell={cell}
          />
        </Widget>
      </div>
    </div>
  );
}
