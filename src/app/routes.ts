/* URL routing — the one place that says what a screen is called in the address bar.
 *
 * ⚠️ HASH routing, deliberately. This deploys as a static build to GitHub Pages, which has no
 * SPA rewrite: a real path like /serviceops-ticket-detail/admin/os-upgrade would 404 the moment
 * anyone opened it directly or refreshed. A hash never reaches the server, so every link here
 * works on a cold load with no server config at all.
 *
 * Shape: #/<page>  ·  #/admin/<module>  ·  #/admin/support-portal/<portal>
 *
 * Add a module by adding it in ONE place — a `Page` for a technician-portal listing, or an
 * `ADMIN_ROUTES` row for an admin screen. App reads this, AdminPage reads this; neither keeps
 * its own copy, so a slug can't mean two things.
 */

export type Page =
  | 'request' | 'problem' | 'change' | 'release'
  | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets'
  | 'software-licenses' | 'contracts' | 'purchases'
  | 'cmdb'
  | 'patches' | 'patch-deployments' | 'endpoints'
  | 'vulnerabilities' | 'detected-cves'
  | 'bom'
  | 'admin';

/** The page a bare URL lands on. */
export const DEFAULT_PAGE: Page = 'request';

/* Page ids ARE the slugs — they were already written that way, so there is no second naming
 * scheme to keep in step. This list only exists so an unknown slug can be rejected. */
const PAGES: readonly Page[] = [
  'request', 'problem', 'change', 'release',
  'hardware-assets', 'software-assets', 'non-it-assets', 'consumable-assets',
  'software-licenses', 'contracts', 'purchases',
  'cmdb',
  'patches', 'patch-deployments', 'endpoints',
  'vulnerabilities', 'detected-cves',
  'bom',
  'admin',
];

/** An admin destination that owns a screen, addressed as #/admin/<slug>. */
export interface AdminRoute {
  slug: string;
  /** The `ADMIN_SECTIONS` title AdminPage.select() expects. */
  section: string;
  /** The level-2 card, where the screen belongs to one rather than to the section. */
  card?: string;
}

/* Only screens that actually exist. A section that is still a card grid has no slug, because a
 * URL promising a screen that isn't built is worse than no URL. */
export const ADMIN_ROUTES: readonly AdminRoute[] = [
  { slug: 'os-upgrade', section: 'Patch Management', card: 'OS Upgrade' },
  { slug: 'support-portal', section: 'Support Channels', card: 'Support Portal' },
  { slug: 'bom-management', section: 'BOM Management' },
  { slug: 'bom-licensing', section: 'BOM Management', card: 'BOM Licensing' },
  { slug: 'bom-scheduler', section: 'BOM Management', card: 'BOM Scheduler' },
  { slug: 'bom-retention', section: 'BOM Management', card: 'BOM Retention' },
];

export const adminRouteBySlug = (slug: string): AdminRoute | undefined =>
  ADMIN_ROUTES.find((r) => r.slug === slug);

/** Reverse lookup for what the admin shell just opened, so it can report its own address. */
export const adminSlugFor = (section: string, card?: string): string | undefined =>
  (ADMIN_ROUTES.find((r) => r.section === section && r.card === card)
    ?? (card ? undefined : ADMIN_ROUTES.find((r) => r.section === section && !r.card)))?.slug;

export interface Route {
  page: Page;
  /** Admin module slug, when the page is 'admin' and a module is open. */
  admin?: string;
  /* A record INSIDE an admin module — today only a support portal, which is why it is named for
     what it is rather than a generic `id`. A second module wanting one should widen this
     deliberately rather than inherit a name that stopped describing it. */
  portal?: string;
}

/** The address of one portal, as a slug. Names are unique (see `uniquePageName`), so the slug is
 *  too — and it is far more use in a shared link than `spp-3`. */
export const portalSlug = (name: string, id: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id.toLowerCase();

/** Read the address bar. Anything unrecognised falls back to the default page rather than
 *  rendering nothing — a mistyped link should land somewhere, not on a blank screen. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const page = parts[0] as Page | undefined;
  if (!page || !PAGES.includes(page)) return { page: DEFAULT_PAGE };
  if (page !== 'admin') return { page };
  const slug = parts[1];
  if (!slug || !adminRouteBySlug(slug)) return { page };
  /* ⚠️ A third segment only means something for the one module that has records. Anywhere else it
     is ignored rather than rejected — a stray segment should still land you on the module, not on
     the default page with no explanation. */
  return { page, admin: slug, portal: slug === 'support-portal' ? parts[2] : undefined };
}

export function formatHash(route: Route): string {
  if (route.page === 'admin' && route.admin) {
    return route.portal ? `#/admin/${route.admin}/${route.portal}` : `#/admin/${route.admin}`;
  }
  return `#/${route.page}`;
}

// ── Document title ─────────────────────────────────────────────────────────

/* What the browser tab, the bookmark and the history entry are called. The module leads, because
 * that is the part someone scanning a row of tabs is looking for. */
export const PRODUCT = 'Motadata ServiceOps';

const PAGE_TITLES: Record<Page, string> = {
  request: 'Requests',
  problem: 'Problems',
  change: 'Changes',
  release: 'Releases',
  'hardware-assets': 'Hardware Assets',
  'software-assets': 'Software Assets',
  'non-it-assets': 'Non-IT Assets',
  'consumable-assets': 'Consumable Assets',
  'software-licenses': 'Software Licenses',
  contracts: 'Contracts',
  purchases: 'Purchases',
  cmdb: 'CMDB',
  patches: 'Patches',
  'patch-deployments': 'Patch Deployments',
  endpoints: 'Endpoints',
  vulnerabilities: 'Vulnerabilities',
  'detected-cves': 'Detected CVEs',
  bom: 'BOM Inventory',
  admin: 'Admin',
};

/* An admin screen is named by its CARD where it has one, otherwise by its section — the same
 * words the sidebar uses, so the tab agrees with the nav rather than inventing a third name. */
export function titleFor(route: Route): string {
  const r = route.page === 'admin' && route.admin ? adminRouteBySlug(route.admin) : undefined;
  const name = r ? (r.card ?? r.section) : PAGE_TITLES[route.page];
  return `${name} · ${PRODUCT}`;
}

/** The absolute link to a portal — what Copy link puts on the clipboard. Built from the page's own
 *  origin and path so it is correct on localhost, on Pages and behind any base path. */
export const portalLink = (slug: string) =>
  `${window.location.origin}${window.location.pathname}#/admin/support-portal/${slug}`;
