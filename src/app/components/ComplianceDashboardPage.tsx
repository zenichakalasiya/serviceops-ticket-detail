/* Compliance › Dashboard — #/compliance-dashboard, the first page of the sidebar's Compliance
 * flyout. The estate at a glance: posture, trend, failures by severity, the worst policies and
 * endpoints. It READS; the Compliance Policy page acts (create, run, schedule, edit).
 *
 * The body is ComplianceVizOverview, built from the Dashboard module's widget pieces. A policy
 * opens its detail page in the shared drawer; an endpoint opens its compliance side panel. */
import { useMemo, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ComplianceVizOverview } from './ComplianceVizOverview';
import { ComplianceEndpointPanel } from './ComplianceEndpointPanel';
import { getPolicy, usePolicies } from './compliancePolicyData';
import { vizSnapshot } from './complianceVizData';
import { useDrawerStack } from './DrawerStack';

export function ComplianceDashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const policies = usePolicies();
  const v = useMemo(() => vizSnapshot(policies), [policies]);
  const { open } = useDrawerStack();
  const [endpoint, setEndpoint] = useState<string | null>(null);

  const openPolicy = (id: string) => {
    const p = getPolicy(id);
    if (p) open('compliance-policies', p.id, p.name, p);
  };

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="compliance-dashboard" onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} />
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-3">
          <h1 className="text-[17px] font-semibold text-[#1E293B]">Compliance Dashboard</h1>
          <span className="text-[12px] text-[#7B8FA5]">
            {v.stats.filter((s) => s.score !== null).length} of {v.stats.length} policies scanned · latest results
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FB]">
          <ComplianceVizOverview onOpenPolicy={openPolicy} onOpenEndpoint={setEndpoint} />
        </div>
      </div>
      {endpoint && <ComplianceEndpointPanel endpointId={endpoint} onClose={() => setEndpoint(null)} />}
    </div>
  );
}
