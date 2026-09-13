import { useEffect, useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListPage } from './components/ProblemListPage';
import { ChangeListPage } from './components/ChangeListPage';
import { ReleaseListPage } from './components/ReleaseListPage';
import { HardwareAssetsListPage } from './components/HardwareAssetsListPage';
import { SoftwareAssetsListPage } from './components/SoftwareAssetsListPage';
import { NonItAssetsListPage } from './components/NonItAssetsListPage';
import { ConsumableAssetsListPage } from './components/ConsumableAssetsListPage';
import { SoftwareLicensesListPage } from './components/SoftwareLicensesListPage';
import { ContractsListPage } from './components/ContractsListPage';
import { PurchasesListPage } from './components/PurchasesListPage';
import { CmdbListPage } from './components/CmdbListPage';
import { PatchesListPage } from './components/PatchesListPage';
import { PatchDeploymentsListPage } from './components/PatchDeploymentsListPage';
import { EndpointsListPage } from './components/EndpointsListPage';
import { VulnerabilitiesListPage } from './components/VulnerabilitiesListPage';
import { DetectedCvesListPage } from './components/DetectedCvesListPage';
import { BomInventoryListPage } from './components/BomInventoryListPage';
import { AdminPage } from './components/AdminPage';
import { DrawerStackProvider } from './components/DrawerStack';
import { GlobalSearch } from './components/GlobalSearch';
import { Toaster } from 'sonner';
import { formatHash, parseHash, titleFor } from './routes';
import type { Page, Route } from './routes';

export default function App() {
  /* The URL is the source of truth for which screen is open — see routes.ts for why it lives in
     the hash. State is seeded from it so a shared link lands on the right screen with no flash of
     the default page. */
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
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
      {activePage === 'problem' && <ProblemListPage onNavigate={navigate} />}
      {activePage === 'change' && <ChangeListPage onNavigate={navigate} />}
      {activePage === 'release' && <ReleaseListPage onNavigate={navigate} />}
      {activePage === 'hardware-assets' && <HardwareAssetsListPage onNavigate={navigate} />}
      {activePage === 'software-assets' && <SoftwareAssetsListPage onNavigate={navigate} initialOpenId={pendingSoftwareAssetId} onInitialOpenConsumed={() => setPendingSoftwareAssetId(null)} />}
      {activePage === 'non-it-assets' && <NonItAssetsListPage onNavigate={navigate} />}
      {activePage === 'consumable-assets' && <ConsumableAssetsListPage onNavigate={navigate} />}
      {activePage === 'software-licenses' && <SoftwareLicensesListPage onNavigate={navigate} onOpenSoftwareAsset={openSoftwareAsset} />}
      {activePage === 'contracts' && <ContractsListPage onNavigate={navigate} />}
      {activePage === 'purchases' && <PurchasesListPage onNavigate={navigate} />}
      {activePage === 'cmdb' && <CmdbListPage onNavigate={navigate} />}
      {activePage === 'patches' && <PatchesListPage onNavigate={navigate} />}
      {activePage === 'patch-deployments' && <PatchDeploymentsListPage onNavigate={navigate} />}
      {activePage === 'endpoints' && <EndpointsListPage onNavigate={navigate} />}
      {activePage === 'vulnerabilities' && <VulnerabilitiesListPage onNavigate={navigate} />}
      {activePage === 'detected-cves' && <DetectedCvesListPage onNavigate={navigate} />}
      {activePage === 'bom' && <BomInventoryListPage onNavigate={navigate} />}
      {activePage === 'admin' && (
        <AdminPage
          onNavigate={navigate}
          moduleSlug={route.admin}
          portalSlug={route.portal}
          onModuleChange={(slug) => go({ page: 'admin', admin: slug })}
          onPortalChange={(portal) => go({ page: 'admin', admin: 'support-portal', portal })}
        />
      )}
      {/* Mounted once, inside the drawer host, so search works on every page and can open any
          module's real detail drawer as a tab. */}
      <GlobalSearch activePage={activePage} onNavigate={navigate} />
      <Toaster position="top-right" />
    </DrawerStackProvider>
  );
}
