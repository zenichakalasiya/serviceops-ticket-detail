import { useEffect, useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListingPage } from './components/ProblemListingPage';
import { ReleaseListingPage } from './components/ReleaseListingPage';
import { HardwareAssetsListingPage } from './components/HardwareAssetsListingPage';
import { SoftwareAssetsListingPage } from './components/SoftwareAssetsListingPage';
import { NonItAssetsListingPage } from './components/NonItAssetsListingPage';
import { ConsumableAssetsListingPage } from './components/ConsumableAssetsListingPage';
import { SoftwareLicensesListingPage } from './components/SoftwareLicensesListingPage';
import { SoftwareMeterListingPage } from './components/SoftwareMeterListingPage';
import { ContractsListingPage } from './components/ContractsListingPage';
import { PurchasesListingPage } from './components/PurchasesListingPage';
import { ProjectsListingPage } from './components/ProjectsListingPage';
import { MyApprovalsListPage } from './components/MyApprovalsListPage';
import { CmdbListingPage } from './components/CmdbListingPage';
import { PatchesListingPage } from './components/PatchesListingPage';
import { PatchDeploymentsListingPage } from './components/PatchDeploymentsListingPage';
import { AutomaticPatchTestsListingPage } from './components/AutomaticPatchTestsListingPage';
import { AutomaticPatchDeploymentsListingPage } from './components/AutomaticPatchDeploymentsListingPage';
import { PackageDeploymentsListingPage } from './components/PackageDeploymentsListingPage';
import { RegistryDeploymentsListingPage } from './components/RegistryDeploymentsListingPage';
import { KnowledgeListingPage } from './components/KnowledgeListingPage';
import { TasksListingPage } from './components/TasksListingPage';
import { ReportsListingPage } from './components/ReportsListingPage';
import { MyTeamListingPage } from './components/MyTeamListingPage';
import { IconGalleryPage } from './components/IconGalleryPage';
import { ViewsLabListPage } from './components/ViewsLabListPage';
import { ChangeListingPage } from './components/ChangeListingPage';
import { EndpointsListingPage } from './components/EndpointsListingPage';
import { VulnerabilitiesListingPage } from './components/VulnerabilitiesListingPage';
import { DetectedCvesListingPage } from './components/DetectedCvesListingPage';
import { BomInventoryListPage } from './components/BomInventoryListPage';
import { AdminPage } from './components/AdminPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ManageDashboardsPage } from './components/dashboard/ManageDashboardsPage';
import { DrawerStackProvider } from './components/DrawerStack';
import { GlobalSearch } from './components/GlobalSearch';
import { Toaster } from 'sonner';
import { formatHash, parseHash, titleFor } from './routes';
import type { Page, Route } from './routes';
import { GlobalShortcutsPanel } from './components/GlobalShortcutsPanel';
import { GlobalHelpGuide } from './components/GlobalHelpGuide';

export default function App() {
  /* The URL is the source of truth for which screen is open — see routes.ts for why it lives in
     the hash. State is seeded from it so a shared link lands on the right screen with no flash of
     the default page. */
  /* A listing row's "open in a new tab" link (from the upstream grids) carries ?page=<slug>&open=<id>
     rather than a hash. With no hash, the query names the page; the grid itself reads ?open. */
  const [route, setRoute] = useState<Route>(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('page');
    return parseHash(!window.location.hash && fromQuery ? `#/${fromQuery}` : window.location.hash);
  });
  const activePage = route.page;

  // Back/forward, and any hash we write ourselves, both arrive here — one way in.
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* Keep the address bar naming the screen you are actually looking at — it stamps a bare load,
     and rewrites anything unrecognised to the route it fell back to (#/nonsense showing the
     request list is exactly the lie this whole scheme exists to prevent). replaceState, not
     assignment: correcting a URL must not leave a history entry you can press Back into. */
  useEffect(() => {
    const canonical = formatHash(route);
    if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }, [route]);

  /* Name the tab after the screen. Without this every tab, bookmark and history entry reads
     "Ticket Listing & Full Detail page" whatever you are looking at.
     ⚠️ This CANNOT fix a chat-app link preview: an unfurl is generated server-side, and the
     fragment is never sent to the server — so a crawler only ever sees index.html's static
     <title>. That one is now the product name, which at least reads correctly for every link. */
  useEffect(() => { document.title = titleFor(route); }, [route]);

  const go = (next: Route) => {
    const hash = formatHash(next);
    // Assigning fires hashchange, which sets the state; an identical hash fires nothing, so that
    // case updates directly rather than silently doing nothing.
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(next);
  };
  const navigate = (page: string) => go({ page: page as Page });

  // A software asset id requested from elsewhere (e.g. the Software License "Managed Softwares" card),
  // consumed by the Software Assets list page to auto-open that asset's detail drawer.
  const [pendingSoftwareAssetId, setPendingSoftwareAssetId] = useState<string | null>(null);
  const openSoftwareAsset = (id: string) => { setPendingSoftwareAssetId(id); go({ page: 'software-assets' }); };

  return (
    <DrawerStackProvider activePage={activePage}>
      {activePage === 'request' && <TicketListPage onNavigate={navigate} />}
      {activePage === 'views-lab' && <ViewsLabListPage onNavigate={navigate} />}
      {activePage === 'problem' && <ProblemListingPage onNavigate={navigate} />}
      {activePage === 'change' && <ChangeListingPage onNavigate={navigate} />}
      {activePage === 'release' && <ReleaseListingPage onNavigate={navigate} />}
      {activePage === 'hardware-assets' && <HardwareAssetsListingPage onNavigate={navigate} />}
      {activePage === 'software-assets' && <SoftwareAssetsListingPage onNavigate={navigate} initialOpenId={pendingSoftwareAssetId} onInitialOpenConsumed={() => setPendingSoftwareAssetId(null)} />}
      {activePage === 'non-it-assets' && <NonItAssetsListingPage onNavigate={navigate} />}
      {activePage === 'consumable-assets' && <ConsumableAssetsListingPage onNavigate={navigate} />}
      {activePage === 'software-licenses' && <SoftwareLicensesListingPage onNavigate={navigate} />}
      {activePage === 'software-meter' && <SoftwareMeterListingPage onNavigate={navigate} />}
      {activePage === 'contracts' && <ContractsListingPage onNavigate={navigate} />}
      {activePage === 'purchases' && <PurchasesListingPage onNavigate={navigate} />}
      {activePage === 'projects' && <ProjectsListingPage onNavigate={navigate} />}
      {activePage === 'my-approvals' && <MyApprovalsListPage onNavigate={navigate} />}
      {activePage === 'cmdb' && <CmdbListingPage onNavigate={navigate} />}
      {activePage === 'patches' && <PatchesListingPage onNavigate={navigate} />}
      {activePage === 'patch-deployments' && <PatchDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'automatic-patch-tests' && <AutomaticPatchTestsListingPage onNavigate={navigate} />}
      {activePage === 'automatic-patch-deployments' && <AutomaticPatchDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'package-deployments' && <PackageDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'registry-deployments' && <RegistryDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'knowledge' && <KnowledgeListingPage onNavigate={navigate} />}
      {activePage === 'tasks' && <TasksListingPage onNavigate={navigate} />}
      {activePage === 'reports' && <ReportsListingPage onNavigate={navigate} />}
      {activePage === 'my-team' && <MyTeamListingPage onNavigate={navigate} />}
      {activePage === 'icons' && <IconGalleryPage onNavigate={navigate} />}
      {activePage === 'endpoints' && <EndpointsListingPage onNavigate={navigate} />}
      {activePage === 'vulnerabilities' && <VulnerabilitiesListingPage onNavigate={navigate} />}
      {activePage === 'detected-cves' && <DetectedCvesListingPage onNavigate={navigate} />}
      {activePage === 'bom' && <BomInventoryListPage onNavigate={navigate} />}
      {activePage === 'dashboard' && <DashboardPage onNavigate={navigate} dashboardId={route.dashboard} />}
      {activePage === 'dashboards' && <ManageDashboardsPage onNavigate={navigate} />}
      {activePage === 'admin' && (
        <AdminPage
          onNavigate={navigate}
          moduleSlug={route.admin}
          portalSlug={route.portal}
          ruleId={route.rule}
          onModuleChange={(slug) => go({ page: 'admin', admin: slug })}
          onPortalChange={(portal) => go({ page: 'admin', admin: 'support-portal', portal })}
        />
      )}
      {/* Mounted once, inside the drawer host, so search works on every page and can open any
          module's real detail drawer as a tab. */}
      <GlobalSearch activePage={activePage} onNavigate={navigate} />
      {/* ONE Keyboard shortcuts panel for the whole product — header icon, `?`, and the builder's rail. */}
      <GlobalShortcutsPanel page={activePage} />
      <GlobalHelpGuide />
      <Toaster position="top-right" />
    </DrawerStackProvider>
  );
}
