/* Compliance › Benchmark — #/compliance-benchmarks, second page of the sidebar's Compliance
 * flyout. The technician's READ of the benchmark catalogue: one row per benchmark (the admin
 * owns them — Admin › Compliance › Benchmark — so there is no create or edit here), scored from
 * the policies that run it. A row opens the benchmark's detail page (ComplianceBenchmarkDrawer:
 * Overview · Rules · Endpoints · Policies) in the shared drawer. */
import { useMemo } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { usePolicies } from './compliancePolicyData';
import { scoreColor, vizSnapshot } from './complianceVizData';
import { benchmarkRow } from './complianceRows';
import { VIZ_BENCHMARK_FILTER_ATTRS, VIZ_BENCHMARK_QUICK_FILTERS } from './complianceFilterAttrs';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';
import { useDrawerStack } from './DrawerStack';

const buildCards = (rows: Ticket[]): StatCard[] => {
  const used = rows.filter((t) => (t as any).x_inUse === 'In use');
  const scored = rows.filter((t) => (t as any).x_cpScore !== null && (t as any).x_cpScore !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((a, t) => a + Number((t as any).x_cpScore), 0) / scored.length) : null;
  const below = rows.filter((t) => ['Moderate', 'Poor', 'Vulnerable'].includes((t as any).x_posture));
  return [
    { label: 'Benchmarks', value: rows.length, sub: `${used.length} used by a policy`, filter: [{ field: 'x_inUse', condition: 'is', values: ['In use'] }] },
    { label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: 'across benchmarks in use', valueColor: avg === null ? undefined : scoreColor(avg) },
    { label: 'Below Target', value: below.length, sub: 'benchmarks under 90%', valueColor: below.length ? '#B45309' : undefined, filter: [{ field: 'x_posture', condition: 'is', values: ['Moderate', 'Poor', 'Vulnerable'] }] },
    { label: 'Failing Rules', value: rows.reduce((a, t) => a + Number((t as any).x_failingRules ?? 0), 0), sub: 'failing on at least one endpoint', valueColor: '#DC2626' },
  ];
};

export function ComplianceBenchmarksPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const rows = useMemo(() => v.benchmarks.map(benchmarkRow), [v]);
  const { open } = useDrawerStack();

  return (
    <AssetRegisterPage
      activePage="compliance-benchmarks"
      stackModule="compliance-benchmarks"
      viewsStore="cviz-benchmark"
      noun="benchmark"
      moduleCols="cviz-benchmark"
      defaultViewName="All Benchmarks"
      footerNoun="benchmarks"
      rows={rows}
      recordOf={() => null}
      filterAttrs={VIZ_BENCHMARK_FILTER_ATTRS}
      quickFilters={VIZ_BENCHMARK_QUICK_FILTERS}
      layouts={['list-kpi', 'list']}
      buildCards={buildCards}
      searchFields={['x_osVersion', 'x_policyNames', 'x_tags']}
      hideSelection
      moreActions={[]}
      onOpenRow={(t) => { const s = v.benchmarks.find((x) => x.benchmark.id === t.id); if (s) open('compliance-benchmarks', s.benchmark.id, s.benchmark.name); }}
      onNavigate={onNavigate}
    />
  );
}
