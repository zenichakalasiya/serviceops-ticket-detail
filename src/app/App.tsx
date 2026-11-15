import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { DrawerStackProvider } from './components/DrawerStack';
import { Toaster } from 'sonner';
import { formatHash, parseHash, titleFor } from './routes';
import type { Page, Route } from './routes';

/* Every screen is its own file, fetched only when its link is opened — so a shared link to one
   module downloads that module, not the whole product. Named exports go through this helper. */
const page = <P,>(load: () => Promise<Record<string, any>>, name: string) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType<P> }))) as ComponentType<any>;
const TicketListPage = page(() => import('./components/TicketListPage'), 'TicketListPage');
const ProblemListingPage = page(() => import('./components/ProblemListingPage'), 'ProblemListingPage');
const ReleaseListingPage = page(() => import('./components/ReleaseListingPage'), 'ReleaseListingPage');
const HardwareAssetsListingPage = page(() => import('./components/HardwareAssetsListingPage'), 'HardwareAssetsListingPage');
const SoftwareAssetsListingPage = page(() => import('./components/SoftwareAssetsListingPage'), 'SoftwareAssetsListingPage');
const NonItAssetsListingPage = page(() => import('./components/NonItAssetsListingPage'), 'NonItAssetsListingPage');
const ConsumableAssetsListingPage = page(() => import('./components/ConsumableAssetsListingPage'), 'ConsumableAssetsListingPage');
const SoftwareLicensesListingPage = page(() => import('./components/SoftwareLicensesListingPage'), 'SoftwareLicensesListingPage');
const SoftwareMeterListingPage = page(() => import('./components/SoftwareMeterListingPage'), 'SoftwareMeterListingPage');
const ContractsListingPage = page(() => import('./components/ContractsListingPage'), 'ContractsListingPage');
const PurchasesListingPage = page(() => import('./components/PurchasesListingPage'), 'PurchasesListingPage');
const ProjectsListingPage = page(() => import('./components/ProjectsListingPage'), 'ProjectsListingPage');
const MyApprovalsListPage = page(() => import('./components/MyApprovalsListPage'), 'MyApprovalsListPage');
const CmdbListingPage = page(() => import('./components/CmdbListingPage'), 'CmdbListingPage');
const PatchesListingPage = page(() => import('./components/PatchesListingPage'), 'PatchesListingPage');
const PatchDeploymentsListingPage = page(() => import('./components/PatchDeploymentsListingPage'), 'PatchDeploymentsListingPage');
const AutomaticPatchTestsListingPage = page(() => import('./components/AutomaticPatchTestsListingPage'), 'AutomaticPatchTestsListingPage');
const AutomaticPatchDeploymentsListingPage = page(() => import('./components/AutomaticPatchDeploymentsListingPage'), 'AutomaticPatchDeploymentsListingPage');
const PackageDeploymentsListingPage = page(() => import('./components/PackageDeploymentsListingPage'), 'PackageDeploymentsListingPage');
const RegistryDeploymentsListingPage = page(() => import('./components/RegistryDeploymentsListingPage'), 'RegistryDeploymentsListingPage');
const ComplianceDashboardPage = page(() => import('./components/ComplianceDashboardPage'), 'ComplianceDashboardPage');
const ComplianceBenchmarksPage = page(() => import('./components/ComplianceBenchmarksPage'), 'ComplianceBenchmarksPage');
const ComplianceRulesPage = page(() => import('./components/ComplianceRulesPage'), 'ComplianceRulesPage');
const ComplianceEndpointsPage = page(() => import('./components/ComplianceEndpointsPage'), 'ComplianceEndpointsPage');
const CompliancePoliciesListingPage = page(() => import('./components/CompliancePoliciesListingPage'), 'CompliancePoliciesListingPage');
const CompliancePolicyEditorHost = page(() => import('./components/CompliancePolicyEditor'), 'CompliancePolicyEditorHost');
const ModuleCreatePageHost = page(() => import('./components/ModuleCreatePage'), 'ModuleCreatePageHost');
const KnowledgeListingPage = page(() => import('./components/KnowledgeListingPage'), 'KnowledgeListingPage');
const TasksListingPage = page(() => import('./components/TasksListingPage'), 'TasksListingPage');
const ReportsListingPage = page(() => import('./components/ReportsListingPage'), 'ReportsListingPage');
const MyTeamListingPage = page(() => import('./components/MyTeamListingPage'), 'MyTeamListingPage');
const IconGalleryPage = page(() => import('./components/IconGalleryPage'), 'IconGalleryPage');
const ViewsLabListPage = page(() => import('./components/ViewsLabListPage'), 'ViewsLabListPage');
const ChangeListingPage = page(() => import('./components/ChangeListingPage'), 'ChangeListingPage');
const EndpointsListingPage = page(() => import('./components/EndpointsListingPage'), 'EndpointsListingPage');
const VulnerabilitiesListingPage = page(() => import('./components/VulnerabilitiesListingPage'), 'VulnerabilitiesListingPage');
const DetectedCvesListingPage = page(() => import('./components/DetectedCvesListingPage'), 'DetectedCvesListingPage');
const BomInventoryListPage = page(() => import('./components/BomInventoryListPage'), 'BomInventoryListPage');
const AdminPage = page(() => import('./components/AdminPage'), 'AdminPage');
const RequesterPortalPage = page(() => import('./components/RequesterPortalPage'), 'RequesterPortalPage');
const DashboardPage = page(() => import('./components/dashboard/DashboardPage'), 'DashboardPage');
const ManageDashboardsPage = page(() => import('./components/dashboard/ManageDashboardsPage'), 'ManageDashboardsPage');
const GlobalSearch = page(() => import('./components/GlobalSearch'), 'GlobalSearch');
const GlobalShortcutsPanel = page(() => import('./components/GlobalShortcutsPanel'), 'GlobalShortcutsPanel');
const GlobalHelpGuide = page(() => import('./components/GlobalHelpGuide'), 'GlobalHelpGuide');

/* Shown only for the moment a screen's file is arriving. */
function PageLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="size-6 animate-spin rounded-full border-2 border-[#DFE5ED] border-t-[#3D8BD0]" aria-label="Loading" />
    </div>
  );
}

/* Rendered inside the page's Suspense, so its effect runs only once the screen is on show — that
   is when the global helpers (search, shortcuts, help, create forms) start loading, behind it. */
function Shown({ onShown }: { onShown: () => void }) {
  useEffect(() => { onShown(); }, [onShown]);
  return null;
}

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
  const [shown, setShown] = useState(false);
  const markShown = useState(() => () => setShown(true))[0];

  const [pendingSoftwareAssetId, setPendingSoftwareAssetId] = useState<string | null>(null);
  const openSoftwareAsset = (id: string) => { setPendingSoftwareAssetId(id); go({ page: 'software-assets' }); };

  return (
    <DrawerStackProvider activePage={activePage}>
      <Suspense fallback={<PageLoading />}>
      <Shown onShown={markShown} />
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
      {activePage === 'compliance-dashboard' && <ComplianceDashboardPage onNavigate={navigate} />}
      {activePage === 'compliance-rules' && <ComplianceRulesPage onNavigate={navigate} />}
      {activePage === 'compliance-benchmarks' && <ComplianceBenchmarksPage onNavigate={navigate} />}
      {activePage === 'compliance-policies' && <CompliancePoliciesListingPage onNavigate={navigate} />}
      {activePage === 'compliance-endpoints' && <ComplianceEndpointsPage onNavigate={navigate} />}
      {activePage === 'knowledge' && <KnowledgeListingPage onNavigate={navigate} />}
      {activePage === 'tasks' && <TasksListingPage onNavigate={navigate} />}
      {activePage === 'reports' && <ReportsListingPage onNavigate={navigate} />}
      {activePage === 'my-team' && <MyTeamListingPage onNavigate={navigate} />}
      {activePage === 'icons' && <IconGalleryPage onNavigate={navigate} />}
      {activePage === 'endpoints' && <EndpointsListingPage onNavigate={navigate} />}
      {activePage === 'vulnerabilities' && <VulnerabilitiesListingPage onNavigate={navigate} />}
      {activePage === 'detected-cves' && <DetectedCvesListingPage onNavigate={navigate} />}
      {activePage === 'portal' && <RequesterPortalPage onBack={() => window.history.length > 1 ? window.history.back() : navigate('request')} />}
      {activePage === 'bom' && <BomInventoryListPage onNavigate={navigate} />}
      {activePage === 'dashboard' && <DashboardPage onNavigate={navigate} dashboardId={route.dashboard} />}
      {activePage === 'dashboards' && <ManageDashboardsPage onNavigate={navigate} />}
      {activePage === 'admin' && (
        <AdminPage
          onNavigate={navigate}
          moduleSlug={route.admin}
          portalSlug={route.portal}
          ruleId={route.rule}
          workflowId={route.workflow}
          onWorkflowChange={(workflow) => go({ page: 'admin', admin: 'workflow', workflow })}
          onModuleChange={(slug) => go({ page: 'admin', admin: slug })}
          onPortalChange={(portal) => go({ page: 'admin', admin: 'support-portal', portal })}
        />
      )}
      </Suspense>
      {shown && <Suspense fallback={null}>
      {/* Mounted once, inside the drawer host, so search works on every page and can open any
          module's real detail drawer as a tab. */}
      <GlobalSearch activePage={activePage} onNavigate={navigate} />
      {/* The Compliance Policy form — one full-screen page, opened from the listing or a policy's detail drawer. */}
      <CompliancePolicyEditorHost />
      <ModuleCreatePageHost />
      {/* ONE Keyboard shortcuts panel for the whole product — header icon, `?`, and the builder's rail. */}
      <GlobalShortcutsPanel page={activePage} />
      <GlobalHelpGuide />
      </Suspense>}
      <Toaster position="top-right" />
    </DrawerStackProvider>
  );
}
