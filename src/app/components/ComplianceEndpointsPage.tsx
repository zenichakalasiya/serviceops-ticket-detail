/* Compliance › Endpoints — #/compliance-endpoints, the last page of the sidebar's Compliance
 * flyout. Every endpoint some policy assesses, read across all its policies: posture, failed
 * checks, whether the last scan reached it. A row opens the endpoint's compliance detail page
 * (Overview · Rules · Policies · Exceptions · Audit Trail). It was the old Compliance Visualization page's
 * Explorer › Resources tab. */
import { ComplianceVersionMenu } from './ComplianceVersionMenu';
import { useMemo, useState } from 'react';
import { useOpenComplianceEndpoint } from './ComplianceEndpointDrawer';
import { AssetRegisterPage } from './AssetRegisterPage';
import { usePolicies } from './compliancePolicyData';
import { scoreColor, vizSnapshot } from './complianceVizData';
import { endpointRow } from './complianceRows';
import { takeComplianceDrill, VIZ_RESOURCE_FILTER_ATTRS, VIZ_RESOURCE_QUICK_FILTERS } from './complianceFilterAttrs';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* What a technician checks first: how many machines are in scope, how clean they are on
   average, and which the scan never reached. Each card filters the list. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const scored = rows.filter((t) => (t as any).x_cpScore !== null && (t as any).x_cpScore !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((a, t) => a + Number((t as any).x_cpScore), 0) / scored.length) : null;
  const unreached = rows.filter((t) => (t as any).x_scanStatus === 'Not reached');
  return [
    { label: 'Endpoints', value: rows.length, sub: `${scored.length} scanned` },
    { label: 'Average Compliance', value: avg === null ? '—' : `${avg}%`, sub: 'across scanned endpoints', valueColor: avg === null ? undefined : scoreColor(avg) },
    { label: 'Not Reached', value: unreached.length, sub: 'agent offline on the last scan', valueColor: unreached.length ? '#B45309' : undefined, filter: [{ field: 'x_scanStatus', condition: 'is', values: ['Not reached'] }] },
  ];
};

export function ComplianceEndpointsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const rows = useMemo(() => vizSnapshot(policies).endpoints.map(endpointRow), [policies]);
  const openEndpoint = useOpenComplianceEndpoint();
  /* A Dashboard click lands here already filtered (read once). */
  const [drill] = useState(() => takeComplianceDrill('compliance-endpoints'));

  return (
    <>
      <AssetRegisterPage
        activePage="compliance-endpoints"
        titleExtra={<ComplianceVersionMenu />}
        stackModule="endpoints"
        initialFilters={drill}
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
        onOpenRow={(t) => openEndpoint(t.id)}
        onNavigate={onNavigate}
      />
    </>
  );
}
