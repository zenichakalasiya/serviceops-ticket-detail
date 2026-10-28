/* Compliance › Benchmark — #/compliance-benchmarks, second page of the sidebar's Compliance
 * flyout. The technician's READ of the benchmark catalogue: one row per benchmark (the admin
 * owns them — Admin › Compliance › Benchmark — so there is no create or edit here), scored from
 * the policies that run it. A row opens the benchmark's detail page (ComplianceBenchmarkDrawer:
 * Overview · Rules · Endpoints · Policies) in the shared drawer. */
import { ComplianceVersionMenu } from './ComplianceVersionMenu';
import { useMemo } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { usePolicies } from './compliancePolicyData';
import { vizSnapshot } from './complianceVizData';
import { benchmarkRow } from './complianceRows';
import { VIZ_BENCHMARK_FILTER_ATTRS, VIZ_BENCHMARK_QUICK_FILTERS } from './complianceFilterAttrs';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';
import { useDrawerStack } from './DrawerStack';

/* The catalogue at a glance — how many benchmarks, which are in use, and what they cover.
   Compliance, posture and failing rules are read on a policy, not here. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const used = rows.filter((t) => (t as any).x_inUse === 'In use');
  const network = rows.filter((t) => ['Router', 'Switch', 'Firewall'].includes((t as any).x_type));
  return [
    { label: 'Benchmarks', value: rows.length, sub: 'in the catalogue' },
    { label: 'In Use', value: used.length, sub: 'run by a policy', valueColor: used.length ? '#15803D' : undefined, filter: [{ field: 'x_inUse', condition: 'is', values: ['In use'] }] },
    { label: 'Unused', value: rows.length - used.length, sub: 'no policy runs them', filter: [{ field: 'x_inUse', condition: 'is', values: ['Unused'] }] },
    { label: 'Network Devices', value: network.length, sub: 'router, switch, firewall', filter: [{ field: 'x_type', condition: 'is', values: ['Router', 'Switch', 'Firewall'] }] },
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
        titleExtra={<ComplianceVersionMenu />}
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
      searchFields={['x_osVersion', 'x_policyNames']}
      hideSelection
      moreActions={[]}
      onOpenRow={(t) => { const s = v.benchmarks.find((x) => x.benchmark.id === t.id); if (s) open('compliance-benchmarks', s.benchmark.id, s.benchmark.name); }}
      onNavigate={onNavigate}
    />
  );
}
