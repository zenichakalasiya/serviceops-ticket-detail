/* Compliance › Endpoints — #/compliance-endpoints, the last page of the sidebar's Compliance
 * flyout. Every endpoint some policy assesses, read across all its policies: posture, failed
 * checks, whether the last scan reached it. A row opens the endpoint's compliance side panel
 * (its rule-by-rule breakdown per policy). It was the old Compliance Visualization page's
 * Explorer › Resources tab. */
import { useMemo, useState } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { ComplianceEndpointPanel } from './ComplianceEndpointPanel';
import { usePolicies } from './compliancePolicyData';
import { scoreColor, vizSnapshot } from './complianceVizData';
import { endpointRow } from './complianceRows';
import { VIZ_RESOURCE_FILTER_ATTRS, VIZ_RESOURCE_QUICK_FILTERS } from './complianceFilterAttrs';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* What a technician checks first: how many machines are in scope, how clean they are on
   average, which are in trouble, and which the scan never reached. Each card filters the list. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const scored = rows.filter((t) => (t as any).x_cpScore !== null && (t as any).x_cpScore !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((a, t) => a + Number((t as any).x_cpScore), 0) / scored.length) : null;
  const bad = rows.filter((t) => ['Poor', 'Vulnerable'].includes((t as any).x_posture));
  const unreached = rows.filter((t) => (t as any).x_scanStatus === 'Not reached');
  return [
    { label: 'Endpoints', value: rows.length, sub: `${scored.length} scanned` },
    { label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: 'across scanned endpoints', valueColor: avg === null ? undefined : scoreColor(avg) },
    { label: 'Poor or Vulnerable', value: bad.length, sub: 'endpoints under 70%', valueColor: bad.length ? '#DC2626' : undefined, filter: [{ field: 'x_posture', condition: 'is', values: ['Poor', 'Vulnerable'] }] },
    { label: 'Not Reached', value: unreached.length, sub: 'agent offline on the last scan', valueColor: unreached.length ? '#B45309' : undefined, filter: [{ field: 'x_scanStatus', condition: 'is', values: ['Not reached'] }] },
  ];
};

export function ComplianceEndpointsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const rows = useMemo(() => vizSnapshot(policies).endpoints.map(endpointRow), [policies]);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-endpoints"
        stackModule="endpoints"
        viewsStore="cviz-resource"
        noun="endpoint"
        moduleCols="cviz-resource"
        defaultViewName="All Endpoints"
        footerNoun="endpoints"
        rows={rows}
        recordOf={() => null}
        filterAttrs={VIZ_RESOURCE_FILTER_ATTRS}
        quickFilters={VIZ_RESOURCE_QUICK_FILTERS}
        layouts={['list-kpi', 'list']}
        buildCards={buildCards}
        searchFields={['x_ip', 'x_osVersion', 'x_office', 'x_policyNames']}
        hideSelection
        moreActions={[]}
        onOpenRow={(t) => setEndpoint(t.id)}
        onNavigate={onNavigate}
      />
      {endpoint && <ComplianceEndpointPanel endpointId={endpoint} onClose={() => setEndpoint(null)} />}
    </>
  );
}
