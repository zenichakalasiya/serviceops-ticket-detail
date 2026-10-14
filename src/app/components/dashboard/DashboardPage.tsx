/* The Dashboard module inside the PRODUCT frame — route #/dashboard/<id>.
 *
 * The product's own Sidebar + Header replace the prototype's ModuleRail / AppTopbar; inside the
 * content area a `.dash-root` holds the prototype's two-column body: the collapsible "Dashboards"
 * listing (ListingFlyout) beside the board. Everything the prototype's App.vue mounted once — the
 * layout drawer, the create/edit panel and the tour — is mounted here by `DashFrame`, which the
 * Manage page shares, so neither screen can lose one of them.
 *
 * No id in the route → open the default dashboard, as the prototype's router did. */
import { useEffect, type ReactNode } from 'react';
import './dashboard.css';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { store } from './store.js';
import { useDashStore } from './reactivity.js';
import { router } from './nav.js';
import { ListingFlyout } from './components/ListingFlyout';
import { DashboardView } from './components/DashboardView';
import { LayoutDrawer } from './components/LayoutDrawer';
import { CreateDashboardPanel } from './components/CreateDashboardPanel';
import { TourGuide } from './components/TourGuide';

/** The prototype's router default: the default board, else the first live one. */
export function defaultBoardPath() {
  const d = store.dashboards.find((x: any) => x.default && !x.archived) || store.dashboards.find((x: any) => !x.archived);
  return d ? `/dashboard/${d.id}` : '/dashboards';
}

/** Product frame + the prototype's dashboard shell (listing · scroller · global drawers). */
export function DashFrame({ activePage, onNavigate, children }: { activePage: string; onNavigate: (p: string) => void; children: ReactNode }) {
  useDashStore();
  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} onOpenAdmin={() => onNavigate('admin')} />
        <div className="dash-root min-h-0 flex-1" data-theme={store.ui.theme}>
          {/* The AI identity gradient, as an SVG paint server — lucide icons are strokes, so an
              AI glyph references `stroke: url(#ai-grad)`. It has to exist in the document. */}
          <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="ai-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4cb1fe" />
                <stop offset="45%" stopColor="#731efb" />
                <stop offset="100%" stopColor="#f911e3" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex h-full min-h-0" style={{ background: 'var(--bg)' }}>
            {/* the "listing based sidebar": the dashboards catalogue */}
            {store.ui.listingOpen && (
              <div className="h-full flex-none">
                <ListingFlyout onClose={() => { store.ui.listingOpen = false; }} />
              </div>
            )}
            <div className="main flex min-w-0 flex-1 flex-col overflow-auto" style={{ background: 'var(--bg)' }}>
              {children}
            </div>
          </div>
          {/* ONE layout drawer for the whole module */}
          {store.ui.layoutOpen && <LayoutDrawer />}
          {store.ui.createOpen && <CreateDashboardPanel />}
          <TourGuide />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({ onNavigate, dashboardId }: { onNavigate: (p: string) => void; dashboardId?: string }) {
  useDashStore();
  /* Deferred a tick: on a cold load this effect runs BEFORE App's own effects (children commit
     first), so App's hashchange listener does not exist yet and its canonicalise effect would
     write `#/dashboard` straight back over the redirect. */
  useEffect(() => {
    if (dashboardId) return;
    const t = setTimeout(() => router.replace(defaultBoardPath()), 0);
    return () => clearTimeout(t);
  }, [dashboardId]);
  return (
    <DashFrame activePage="dashboard" onNavigate={onNavigate}>
      {dashboardId && <DashboardView key={dashboardId} id={dashboardId} />}
    </DashFrame>
  );
}
