/* Manage dashboards — route #/dashboards. The same product frame + dashboard shell as a board
 * (DashFrame), with the full listing in the content area. */
import { DashFrame } from './DashboardPage';
import { ManageDashboards } from './components/ManageDashboards';

export function ManageDashboardsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <DashFrame activePage="dashboards" onNavigate={onNavigate}>
      <ManageDashboards />
    </DashFrame>
  );
}
