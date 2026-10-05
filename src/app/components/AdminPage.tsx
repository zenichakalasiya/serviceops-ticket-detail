import { useEffect, useRef, useState } from 'react';
import { adminRouteBySlug, adminSlugFor } from '../routes';
import { Header } from './Header';
import { AdminSidebar } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { ADMIN_SECTIONS, sectionByTitle } from './adminData';
import { AdminBomModule } from './AdminBomModule';
import type { BomAdminScreen } from './AdminBomModule';
import { AdminOsUpgradeModule } from './AdminOsUpgradeModule';
import { AdminSupportPortalModule } from './AdminSupportPortalModule';
import { AdminRequestFormModule } from './AdminRequestFormModule';
import { AdminUserSurveyModule } from './AdminUserSurveyModule';

/** Sections that have a real module behind them rather than only a card grid. Selecting one in
 *  the sidebar opens that module; everything else still scrolls the Overview. */
const MODULE_TITLES = ['BOM Management'];

/** Which screen each level-2 nav item opens. The nav, the Overview cards and the module's own
 *  landing all route through this one map, so they can never disagree about where a card goes. */
const BOM_SCREEN_FOR: Record<string, BomAdminScreen> = {
  'BOM Licensing': 'licensing',
  'BOM Scheduler': 'scheduler',
  'BOM Retention': 'retention',
};

/** Level-2 cards that own a module even though their SECTION doesn't, keyed "<section>/<card>".
 *  Patch Management is still a card grid — OS Upgrade is the one entry with a real screen behind
 *  it, so only that row swaps the pane. */
const CARD_MODULES: Record<string, string> = {
  'Patch Management/OS Upgrade': 'OS Upgrade',
  /* Both rows land on ONE page with two tabs — the form and the rules that act on it are one
     subject. Which tab opens is read from the card (activeCard). */
  'Request Management/Request Form': 'Request Form',
  'Request Management/Request Form Rule': 'Request Form',
  /* ⚠️ Support Channels, not Organization. The portal's settings already lived here, so putting its
     customization anywhere else meant two homes for one subject. The card that used to open this
     from Organization is gone rather than left as a second door. */
  'Support Channels/Support Portal': 'Support Portal',
  'User Survey/User Surveys': 'User Surveys',
};

/* Admin hub — the settings surface. Its own shell: the product's left icon rail is replaced by a
 * grouped settings nav, with "Back to app" as the way out.
 *
 * The sidebar and the Overview share one section list, and selecting in the sidebar scrolls the
 * Overview rather than swapping the pane — the whole point of a hub is that it is one surface. */

interface AdminPageProps {
  onNavigate: (page: string) => void;
  /** Module slug from the URL (#/admin/<slug>), or undefined for the Overview. */
  moduleSlug?: string;
  /** Reports where the admin navigated itself, so the address bar follows the pane. */
  onModuleChange?: (slug: string | undefined) => void;
  /** Which portal is open inside the Support Portal module, and a way to report a change back. */
  portalSlug?: string;
  onPortalChange?: (slug: string | undefined) => void;
}

export function AdminPage({ onNavigate, moduleSlug, onModuleChange, portalSlug, onPortalChange }: AdminPageProps) {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  // Only the first section starts open, mirroring the live admin.
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set([ADMIN_SECTIONS[0].key]));
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** Title of the module currently open, or null for the Overview. */
  const [module, setModule] = useState<string | null>(null);
  const [bomScreen, setBomScreen] = useState<BomAdminScreen>('landing');
  /** The portal builder is a canvas — it takes the whole screen, so the admin shell stands down. */
  const [builderOpen, setBuilderOpen] = useState(false);

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  /** Level-2 module inside the active section, when one is selected. Drives the nav highlight. */
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const applySelect = (title: string, card?: string) => {
    const cardModule = card ? CARD_MODULES[`${title}/${card}`] : undefined;
    // A nav row that opens nothing must not stay highlighted while the Overview shows behind it.
    const opensSomething = !!cardModule || (!!card && MODULE_TITLES.includes(title));
    setActive(title);
    setActiveCard(opensSomething ? card! : null);

    if (cardModule) {
      setModule(cardModule);
      return;
    }

    // A level-2 module opens its listing on the right. Level 1 only expands the branch, which
    // the sidebar handles on its own — it never reaches here for a tree section.
    if (card && MODULE_TITLES.includes(title)) {
      setModule(title);
      setBomScreen(BOM_SCREEN_FOR[card] ?? 'landing');
      return;
    }
    if (MODULE_TITLES.includes(title)) {
      setModule(title);
      setBomScreen('landing');
      return;
    }
    setModule(null);
    if (title === 'Overview') {
      sectionRefs.current[ADMIN_SECTIONS[0].key]?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('[data-admin-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const s = sectionByTitle(title);
    if (!s) return;
    // Opening it first means the scroll lands on content, not on a collapsed strip.
    setOpenKeys((prev) => new Set(prev).add(s.key));
    requestAnimationFrame(() => {
      sectionRefs.current[s.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /* The slug this shell last put in the URL. Without it the address bar's answer comes straight
     back down as `moduleSlug` and re-runs the selection on every render. */
  const pushedRef = useRef<string | undefined>(undefined);

  /** Everything the user clicks goes through here, so the URL can never lag behind the pane. */
  const select = (title: string, card?: string) => {
    applySelect(title, card);
    const slug = adminSlugFor(title, card);
    pushedRef.current = slug;
    onModuleChange?.(slug);
  };

  /* Deep link → open that module on arrival, and follow browser back/forward within admin.
     A slug with no screen behind it is already filtered out by routes.ts, so this only ever
     resolves to something real. */
  useEffect(() => {
    if (moduleSlug === pushedRef.current) return;
    pushedRef.current = moduleSlug;
    const r = moduleSlug ? adminRouteBySlug(moduleSlug) : undefined;
    if (r) { applySelect(r.section, r.card); return; }
    setModule(null);
    setActive('Overview');
    setActiveCard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug]);

  return (
    <div className="flex h-screen flex-col bg-[#F7F9FC]">
      {/* The product header STAYS while the builder is open — the logo, global search and the
          account menu are the app, not the admin section, and losing them made the builder feel
          like a different product. Only the admin sidebar gives way: a canvas competing with a
          second navigation has nowhere to be. */}
      <Header selectedCount={0} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!builderOpen && (
          <AdminSidebar active={active} activeCard={activeCard} onSelect={select} onBackToApp={() => onNavigate('request')} />
        )}
        <div data-admin-scroll className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {module === 'BOM Management' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC]">
              {/* The module's own navigation (its landing cards, its breadcrumb) reports back so
                  the nav highlight follows — the sidebar must never say you are somewhere you
                  have already navigated away from. */}
              <AdminBomModule
                screen={bomScreen}
                onScreen={(s) => {
                  setBomScreen(s);
                  const card = Object.keys(BOM_SCREEN_FOR).find((k) => BOM_SCREEN_FOR[k] === s);
                  setActiveCard(card ?? null);
                  const slug = adminSlugFor('BOM Management', card);
                  pushedRef.current = slug;
                  onModuleChange?.(slug);
                }}
              />
            </div>
          ) : module === 'OS Upgrade' ? (
            /* White, not the hub's grey: an admin LISTING is the same surface as a technician
               portal list page — head, search, then a full-bleed table with no card around it. */
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminOsUpgradeModule />
            </div>
          ) : module === 'Request Form' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminRequestFormModule
                tab={activeCard === 'Request Form' ? 'builder' : 'rules'}
                onTab={(t) => select('Request Management', t === 'builder' ? 'Request Form' : 'Request Form Rule')}
                onEditor={setBuilderOpen}
              />
            </div>
          ) : module === 'User Surveys' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminUserSurveyModule />
            </div>
          ) : module === 'Support Portal' ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <AdminSupportPortalModule
                onBuilder={setBuilderOpen}
                openPortal={portalSlug}
                onOpenPortalChange={onPortalChange}
              />
            </div>
          ) : (
            <AdminOverview
              openKeys={openKeys}
              onToggle={toggle}
              query={query}
              onQuery={setQuery}
              registerSection={(key, el) => { sectionRefs.current[key] = el; }}
              onOpenCard={(sectionTitle, cardTitle) => {
                // A card that owns a module opens it, so the Overview and the nav agree.
                if (CARD_MODULES[`${sectionTitle}/${cardTitle}`]) {
                  select(sectionTitle, cardTitle);
                  return true;
                }
                // A BOM card on the Overview jumps straight into that screen, rather than
                // making the admin land on the module and click again.
                if (sectionTitle !== 'BOM Management') return false;
                select('BOM Management', cardTitle);
                return true;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
