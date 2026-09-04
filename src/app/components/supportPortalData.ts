/* Support Portal — Admin › Support Channels.
 *
 * Two data sets live here and nothing else does:
 *   1. the PAGES an admin has built (the listing's rows, created by the builder), and
 *   2. the TEMPLATES the "Use Template" gallery offers.
 *
 * The portal CONTENT below (requests, approvals, knowledge) is what the builder canvas renders as
 * the default layout. It is the requester's real dashboard, so the numbers in a card's header and
 * the rows beneath it are read from the SAME array — a count and its list can never disagree.
 */

export type PortalPageStatus = 'Published' | 'Draft';

export interface PortalPage {
  id: string;
  name: string;
  /** System pages ship with the product; Custom ones are built here. */
  type: 'System' | 'Custom';
  status: PortalPageStatus;
  /** 'Blank layout' for a from-scratch page, otherwise the template it was started from. */
  source: string;
  audience: string;
  modifiedAt: string;
  modifiedBy: string;
  /** Edited since it was last published — the amber chip on the listing. */
  dirty?: boolean;
  /* ⚠️ How the page was STARTED, not merely which template it resembles. `source` is prose for the
     listing; this is the fact the builder acts on — a blank portal must not seed the default page's
     banner, cards and widgets, and nothing else can tell it apart. */
  start?: 'blank' | 'template';
  /* Step 1 of Create Support Portal. Held on the record because they are facts about the PORTAL,
     not about its layout — the Branding panel shows the same values once it is open. */
  company?: string;
  url?: string;
  idp?: string;
  ssoOnly?: boolean;
  /* Which LAYOUT this portal opens on.
   *
   * ⚠️ A portal's arrangement used to be global constants, so every record in this listing opened
   * the identical page — two portals could differ by name and address and by nothing you could see.
   * The seed lives on the record now, which is the smallest thing that makes two portals genuinely
   * two portals. Edits inside a session still behave exactly as they did.
   *
   *   v2  the live product's page — no Most Used Services row, a right-hand rail beside the work
   *       cards, and My Assets / My CIs as full-width rows of tiles
   *   v1  the arrangement this builder shipped with, kept intact on "Support Portal - 2" */
  layout?: 'v1' | 'v2';
}

/* ⚠️ `portal` is not a template layout like the others — it is a PICTURE OF THIS PORTAL. The
   Default tile used to borrow `classic`, a generic three-column wireframe, so the one tile that
   promises "the page your requesters see today" was showing a page nobody has. It draws the real
   thing: banner and search, the four action cards straddling its lower edge, the two service rows,
   and the work cards below them. */
export type TemplateLayout = 'portal' | 'classic' | 'spotlight' | 'catalog' | 'knowledge' | 'minimal' | 'status' | 'verdant' | 'counter' | 'deskrail';

export interface PortalTemplate {
  id: string;
  name: string;
  desc: string;
  category: 'IT Support' | 'HR' | 'Facilities' | 'General';
  layout: TemplateLayout;
  /** Tints the hero of the page this template produces, so picking one is visibly a choice. */
  accent: string;
  badge?: string;
  /** What the template drops onto the canvas — read on the gallery's detail rail. */
  blocks: string[];
  /* ⚠️ The page this template actually PRODUCES — and it is DATA, not a renderer.
     The page is already config all the way down: band order, row order, column counts, the hero's
     height, colour, alignment and search width, per-node styles and the theme. A template is a
     bundle of those values, which is the same rule `BLOCK_ORDER_V2` states as "Seeds, not a second
     renderer": a layout with its own rendering path is a second page to maintain, and the two drift
     the first time a widget changes.
     ⚠️ A template with no `seed` still works — the gallery lists it and the page opens on the
     default arrangement. It just has nothing of its own to say yet. */
  seed?: TemplateSeed;
  /* ⚠️ Withheld from the gallery, NOT deleted — the same rule `PortalElement.hidden` follows.
     A template with no `seed` produces the default arrangement under a different name and a
     recoloured thumbnail, which is a promise the gallery cannot keep: six tiles that all open the
     same page. They stay in the file with their names, categories, accents and block lists intact,
     and each one comes back the moment it has a design behind it — one word per template.
     ⚠️ The DEFAULT tile is not in this list. It is the portal that already exists, rendered from
     the live page, so nothing here can hide it. */
  hidden?: boolean;
}

export interface TemplateSeed {
  /** Bands, top to bottom. Anything absent is not on the page — and stays addable from the palette. */
  blockOrder?: string[];
  rowOrder?: Record<string, string[]>;
  /** Per-node config: the hero's own settings, each band's column count. */
  cfg?: Record<string, Record<string, unknown>>;
  /** The right-hand rail, where the layout has one. */
  rail?: string[];
  /* ⚠️ Per-node STYLE, for the handful of values that do not live in config. Columns is the one
     that forced this: §7.8 puts it in the style store on purpose, because the Content tab and the
     Arrangement pack are two controls for one value and both write there — so a template setting
     `columns` in cfg was writing to a key the renderer does not read, and the control looked
     inert while working perfectly. A template arranges the page; it has to be able to reach every
     value the page is arranged by.
     ⚠️ Typed loosely on purpose — `NodeStyle` lives in portalPageModel and importing it here
     would point the data file at the renderer it is supposed to know nothing about. */
  styles?: Record<string, Record<string, unknown>>;
}

/* ── Templates ───────────────────────────────────────────────────────────── */

/** The templates a person may actually pick — everything not withheld by `hidden`.
 *
 * ⚠️ Read by the gallery, the create dialog and the "Browse N templates" count. `PORTAL_TEMPLATES`
 * stays the full list because `accentFor` resolves a page's `source` through it, and a portal
 * built from a template that has since been withheld must keep its accent rather than losing it. */
export const VISIBLE_TEMPLATES = (): PortalTemplate[] => PORTAL_TEMPLATES.filter((t) => !t.hidden);

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  {
    id: 'tpl-classic',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'Classic Service Desk',
    desc: 'The default ServiceOps portal — hero search, three quick actions, and the requester’s own work below.',
    category: 'IT Support',
    layout: 'classic',
    accent: '#0F172A',
    badge: 'Most used',
    blocks: ['Hero search', 'Quick actions', 'My Open Requests', 'Pending Approvals', 'Most Read', 'My Assets', 'My CIs'],
  },
  {
    id: 'tpl-spotlight',
    name: 'Search Spotlight',
    desc: 'Puts deflection first: a full-bleed search hero with popular articles surfaced before any form.',
    category: 'IT Support',
    layout: 'spotlight',
    accent: '#1E3A8A',
    blocks: ['Full-bleed search', 'Popular articles', 'Quick actions', 'My Open Requests'],
    /* ── Search Spotlight ──────────────────────────────────────────────────
       The question this page asks is "what are you trying to do?", and nothing else until it is
       answered. Every value below serves that one sentence.

       ⚠️ A FLAT field, not the default gradient. The gradient is the nicer picture and it is
       exactly the problem: it competes with the search bar sitting on top of it. Flat colour makes
       the input the only bright object in the first viewport, which is the whole point of the
       template.
       ⚠️ Taller band, WIDER and fully-rounded field. At 260px with a 70% input the search reads as
       a control on a banner; at 340 with a pill it reads as the subject of the page.
       ⚠️ Most Read Knowledge moves to the FIRST card position, ahead of My Open Requests. That one
       reorder is the thesis: this portal answers before it files.
       ⚠️ Favourite Services and Most Used Services come OFF the page — not out of the product. Two
       browse rows above the fold is the opposite of one question, and both stay in the palette.
       ⚠️ My Open Requests and Pending Approvals STAY. A portal that only searches is a help centre
       with a logo on it; the requester's own work is the reason they signed in. */
    seed: {
      /* ⚠️ EVERY card the default portal carries, in the structure the default portal uses — the
         main region beside a tall rail, the four action cards, Favourite Services, and My Assets
         and My CIs as full-width rows. An earlier pass dropped four of them on the argument that a
         spotlight page should be short. That is a decision about what a customer's portal contains,
         and it is not a template's to make: a template arranges and styles what the product ships,
         and anything it hides has to be a thing the admin turned off.
         ⚠️ What is left of the "deflection first" idea is the one move that costs nothing: Most Read
         leads the RAIL instead of sitting second in it. The thesis survives; the content does not
         get edited to fit it. */
      blockOrder: ['quick', 'favourites', 'work'],
      rowOrder: {
        quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
        /* ⚠️ Most Read leads the RAIL, and it is THIS list that puts it there — not the `rail`
           array below, which decides membership. The rail renders its members in row order, so a
           promotion has to happen where the order lives or it silently does nothing. */
        work: ['requests', 'approvals', 'knowledge', 'news', 'contact'],
        /* Membership, not placement — the rail shape DRAWS these two inside the work band, and this
           is still the list that reorders them. See the note on ROW_ORDER_V2. */
        records: ['assets', 'cis'],
      },
      rail: ['knowledge', 'news', 'contact'],
      cfg: {
        hero: {
          heading: 'What do you need help with?',
          sub: 'Search the knowledge base, or start a request below.',
          searchPlaceholder: 'Describe your issue — “VPN not connecting”',
          /* ⚠️ SHORTER than the default 260, not taller. The first pass made it 340 and centred the
             text in it, which put a third of the first viewport into empty colour — the banner was
             the biggest thing on a page whose subject is a text field. It is a backdrop now. */
          height: 210,
          bgKind: 'color',
          /* Deepened by the gradient into #0B1B3F, with a soft highlight off the top-left. A large
             flat rectangle of one colour reads as printed; the falloff is what gives it a light
             source and keeps the white field on top of it looking lit rather than pasted. */
          bannerStyle: 'gradient',
          bannerColor: '#1E3A8A',
          headingColor: '#FFFFFF',
          /* ⚠️ The search LEAVES the banner and lands across its bottom edge. This is the template's
             real idea: in the default portal the field is furniture inside a picture, and here it is
             the page's own control resting on one. Wider and pill-shaped, because it is now the
             largest object above the fold and should look like the thing to use. */
          searchPlacement: 'floating',
          searchWidth: 64,
          searchRadius: 999,
          contentAlign: 'center',
        },
        quick: { cols: '4', hasCards: true },
        work: { cols: '3' },
        /* ⚠️ A PAGE-level choice, not a per-card one. One card treatment for everything on the page
           — see the note in `cardInner`: a difference between two cards reads as a state rather
           than as a kind. */
        page: { cardLook: 'spine' },
      },
    },
  },
  {
    id: 'tpl-verdant',
    name: 'Verdant Service Desk',
    desc: 'A light banner instead of a dark one, actions that stay off it, and the requester’s work in one tabbed panel rather than three cards.',
    category: 'IT Support',
    layout: 'verdant',
    /* The tile and the page both read green, but the BANNER is the pale end of it — see
       `bannerStyle: 'light'`. This value tints the gallery chrome, not the band. */
    accent: '#1E7A5A',
    badge: 'New',
    blocks: ['Light hero', 'Quick actions', 'Most Used Services', 'Announcements', 'Contact us', 'Work tabs', 'My Assets', 'My CIs'],
    /* ── Verdant Service Desk ──────────────────────────────────────────────
       Five decisions, and every one of them is about SHAPE rather than hue — which is the line the
       "Template LOOKS" note in the preview draws between a template and a recolour.

       ⚠️ The banner is LIGHT, so the ink inverts. `bannerStyle: 'light'` is a third value beside
       flat and gradient rather than a new key: it is still the Colour tab, still one hex, and the
       falloff simply runs pale instead of deepening to navy. A light band with the default white
       heading is an invisible heading, so `heroInk: 'dark'` travels with it.
       ⚠️ The quick actions come OFF the banner's edge. Two objects cannot straddle one edge, and
       here the hero already owns its own bottom — so the cards get their own band and every
       breakpoint has one less thing to solve.
       ⚠️ Announcements and Contact leave the work band and sit beside SERVICES. That is what
       `railHome` says; the rail's MEMBERSHIP is still the `rail` array, exactly as before.
       ⚠️ Requests, Approvals and Most Read become one TABBED container. Each panel still mounts the
       real card node, so all three stay selectable and keep their own widget drawer — the tab strip
       decides which one is mounted, nothing else changes.
       ⚠️ Favourite Services is OFF the page, and this is the one content decision here: the service
       tiles carry a STAR, and a star is the favourites mechanism. Two rows listing the same four
       services is what it removes. It stays in the palette, like everything else a template drops. */
    seed: {
      blockOrder: ['quick', 'services', 'work', 'records'],
      rowOrder: {
        quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
        work: ['requests', 'approvals', 'knowledge', 'news', 'contact'],
        records: ['assets', 'cis'],
      },
      rail: ['news', 'contact'],
      /* ⚠️ Two columns, and it has to be said HERE rather than in `cfg` — see the note on the
         field. Four service tiles in one row is the default; at two they are wide enough for a
         long name like "New Employee Onboarding" to stay on one line. */
      styles: { services: { columns: 2 } },
      cfg: {
        hero: {
          height: 300,
          bgKind: 'color',
          bannerStyle: 'light',
          bannerColor: '#D5E9DE',
          headingColor: '#0F3327',
          contentAlign: 'left',
          contentMaxWidth: 54,
          searchWidth: 46,
          searchRadius: 14,
        },
        quick: { cols: '4', cardTemplate: 'top' },
        /* ⚠️ Per CARD, not just on the row. `iconPos: 'left'` is a spec DEFAULT on every action
           card and it is read before the row's template — so setting this on the row alone left
           the tile look switched on and invisible. The card's own key is first in that chain. */
        'quick-incident': { cardTemplate: 'top', contentAlign: 'center' },
        'quick-service': { cardTemplate: 'top', contentAlign: 'center' },
        'quick-ad': { cardTemplate: 'top', contentAlign: 'center' },
        'quick-knowledge': { cardTemplate: 'top', contentAlign: 'center' },
        services: { cols: '1' },
        records: { cols: '2' },
        page: {
          heroInk: 'dark',
          quickLook: 'tile',
          servicesLook: 'panel',
          railHome: 'services',
          /* ⚠️ NO `workLook: 'tabs'` here, deliberately. The option exists and works, but three
             lists behind one strip means two of them are never seen — a requester who has an
             approval waiting has no reason to look for it. They are three cards.
             Any template that wants the tabbed container sets the key; this one does not. */
          helpLook: 'dark',
          heroArt: 'shapes',
        },
      },
    },
  },
  {
    id: 'tpl-counter',
    name: 'Action Counter',
    desc: 'Every action lives inside the banner itself as a glass tile, with Report an Incident inverted to solid white — the heading pairs with the search on one line, and the requester’s own work sits beside a stacked side rail below.',
    category: 'IT Support',
    layout: 'counter',
    accent: '#3D8BD0',
    badge: 'New',
    blocks: ['Hero search', 'Quick actions (glass tiles)', 'Favourite Services', 'Most Used Services', 'My Open Requests', 'Pending Approvals', 'Announcements', 'Most Read', 'Contact Us', 'My Assets', 'My CIs'],
    /* ── Action Counter ────────────────────────────────────────────────────
       Two ideas, matched to the reference this was built from (`Support Portal Layout System.dc.html`,
       artboard #3c "Counter") card-treatment and banner shape by shape, not by borrowing an existing
       template LOOK and recolouring it — see `quickLook: 'glass'` and `searchPlacement: 'side'` below,
       both NEW page-level flags added for this template and left off every other one.

       ⚠️ FLAT banner, not the usual gradient. A flat fill is a colour Quick Actions can borrow
       exactly (`bg: '#3D8BD0'` on the section below matches `bannerColor` character for character);
       a gradient reads differently a few hundred pixels down, and the seam this template exists to
       remove would come back as a visible colour step where the two bands actually meet.
       ⚠️ Copy is the product's OWN default hero text ("Welcome to Support Portal" + its subtitle) —
       no `heading`/`sub`/`searchPlaceholder` override here at all, so it falls through to
       `content.hero.title`/`.subtitle`/`.placeholder` like an untouched page. The reference's own
       words ("Kestrel Manufacturing · Plant Services", "Shop floor support desk", "Search or scan an
       asset tag") are a manufacturing mock persona and a barcode-scan flow this product does not have;
       reusing our own real copy in the reference's POSITION is the whole instruction.
       ⚠️ Four tiles, not five. The reference shows a fifth ("Track a Request"), but this product's
       fixed Quick Actions are exactly Incident/Service/AD/Knowledge — there is no real destination
       to put in a fifth slot, and the generic addable "external link" card was tried and explicitly
       REMOVED (invented copy, "IT Status Page", that named nothing real).
       ⚠️ Report an Incident is the only quick-action card left WHITE and the only one on the default
       `cardTemplate` ('left' — icon-left row, unchanged from every other template): a solid, opaque
       ROW tile amid three translucent COLUMN ones is what "primary action" looks like without a label
       saying so. The other three get `cardTemplate: 'stackedLeft'` (icon top, text below, BOTH left-
       aligned — see the note on `stackedLeft` in SupportPortalPreview.tsx; `'top'` was not reused
       because it deliberately always centres) plus `fill: 'color'` at 14% white with a 22% white
       hairline, `sub: ''` (the reference's secondary tiles carry no description line at all — an
       empty string, not omitting the key, is what skips the line; see the note where it's read) and
       `styles[id].iconFill: 'transparent'` (removes the icon's badge square, leaving a bare glyph —
       glass tiles have no icon container, only the icon floating on the colour). NO hover arrow
       anywhere on this template, primary tile included — `quickLook: 'glass'` never sets the `tile`
       hover-arrow affordance, which is `tileActions`-only and untouched by this template.
       ⚠️ Approvals and Assets move into the WORK-RAIL, not the work band's own two-up grid — a
       genuinely new placement (`rail: ['approvals', 'assets']`), not just a recolour. Requests keeps
       the whole main region to itself (`'work-main': { cols: 1 }`), so the band reads as one wide
       card of the requester's own work beside a narrow stack of what else needs them. */
    seed: {
      /* ── The page below the banner, in four rows ──
         browse · work · help · records. Every data card the product ships has a place, which is
         what the reference artboard could not show: #3c draws four cards and stops, so the other
         five had to be given a home that reads as part of the same page rather than appended to it. */
      blockOrder: ['quick', 'favourites', 'services', 'work', 'records'],
      rowOrder: {
        quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
        /* Row 2 is the first three at three columns; row 3 is the `rail` pair below them. The
           ORDER here is what puts Requests first and Announcements third — `rail` only decides
           which two drop to the second row. */
        work: ['requests', 'approvals', 'news', 'knowledge', 'contact'],
        /* ⚠️ BOTH now. My CIs was dropped while Assets lived in the side rail — a single record card
           in a column has no partner to sit beside, and a rail is not where an inventory belongs.
           Given their own row they are a pair again, which is the shape they were designed as. */
        records: ['assets', 'cis'],
      },
      /* ⚠️ Membership, and the placement is `railHome: 'below'`. These two are the help row: Most
         Read takes two shares and Contact Us one, so the reading material leads and the last resort
         sits beside it rather than under it. */
      rail: ['knowledge', 'contact'],
      cfg: {
        hero: {
          /* `side` pairs the heading block with the search box on one row instead of stacking the
             search below the subtitle — see the note on `searchSide` in SupportPortalPreview.tsx. */
          searchPlacement: 'side',
          height: 190,
          bgKind: 'color',
          bannerStyle: 'flat',
          bannerColor: '#3D8BD0',
          headingColor: '#FFFFFF',
        },
        /* Same flat colour as the hero (see the note above) plus the new `glass` look, which is what
           removes the climb, tightens the padding and leaves each card free to pick its own
           `cardTemplate` — none of which `tile` would have allowed. */
        quick: { cols: '4', fill: 'color', bg: '#3D8BD0' },
        'quick-incident': { fill: 'color', bg: '#FFFFFF', radius: 14 },
        'quick-service': { fill: 'color', bg: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', radius: 14, cardTemplate: 'stackedLeft', sub: '', minHeight: 100 },
        'quick-ad': { fill: 'color', bg: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', radius: 14, cardTemplate: 'stackedLeft', sub: '', minHeight: 100 },
        'quick-knowledge': { fill: 'color', bg: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', radius: 14, cardTemplate: 'stackedLeft', sub: '', minHeight: 100 },
        /* Four tiles each, two across — so both sections are the same object at the same size and
           the row reads as one browse area rather than as two lists of different lengths. */
        favourites: { show: 4 },
        services: { show: 4 },
        work: { cols: '3' },
        records: { cols: '2' },
        page: { quickLook: 'glass', heroArt: 'counter', browseLook: 'split', railHome: 'below' },
      },
      /* Per-card text/icon colour — the CONFIG keys above paint the tile itself, these paint what
         sits on top of it. Kept apart because `fillCss` reads config while `roleStyle`/`chosen` read
         style, exactly the split every other template in this file already respects.
         ⚠️ A title/subtitle colour is NOT a flat `color` key — `roleStyle` resolves it through
         `NodeStyle.type[role].color` (P3's per-role type system), keyed by the TEXT node's own id
         (`${cardId}-title` / `${cardId}-sub`) and role ('title' / 'body'). A flat `{ color }` here
         would sit at a key `resolveType` never reads and stay silently inert.
         ⚠️ `iconColor`/`iconFill` are flat, by contrast — `chosen(styles, cardId, key)` reads them
         straight off the CARD's own id, not through the type-role system, and off the STYLE store
         rather than `cfg` (setting them in the config entries above would be exactly as inert, the
         same trap `fillCss`'s own note warns about one level up). `iconFill: 'transparent'` on the
         three glass tiles is what removes their icon's badge square, leaving a bare glyph on the
         colour — Report an Incident keeps its badge, so it is left unset there. */
      styles: {
        /* ⚠️ `columns` lives in the STYLE store, not in cfg — §7.8 puts it there because the
           Content tab and the Arrangement pack are two controls for one value. Set in cfg it is
           written to a key the renderer does not read. */
        favourites: { columns: 2 },
        services: { columns: 2 },
        /* ONE column each, so My Assets and My CIs read as a list of records rather than a 2×2 of
           tiles — the anatomy stays the tile's (icon box · name · id · kind), only the track count
           changes. */
        assets: { columns: 1 },
        cis: { columns: 1 },
        'quick-incident-title': { type: { title: { color: '#0B2545' } } },
        'quick-incident-sub': { type: { body: { color: '#5A6B81' } } },
        'quick-service-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-ad-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-knowledge-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-incident': { iconColor: '#FFFFFF', iconFill: '#0B2545' },
        'quick-service': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        'quick-ad': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        'quick-knowledge': { iconColor: '#FFFFFF', iconFill: 'transparent' },
      },
    },
  },
  {
    id: 'tpl-deskrail',
    name: 'Service Counter',
    desc: 'The banner turns on its side — a full-height navy rail carrying the greeting, the search and the three doors, with everything the requester owns in the column beside it.',
    category: 'IT Support',
    layout: 'deskrail',
    accent: '#16233A',
    badge: 'New',
    blocks: ['Side rail hero', 'Search', 'Quick actions (rows)', 'My Open Requests', 'Pending Approvals', 'Announcements', 'Most Read', 'Favourite Services', 'Most Used Services', 'My Assets', 'My CIs'],
    /* ── Service Counter ───────────────────────────────────────────────────
       ⚠️ A new page ARCHETYPE, not a banner variant — `heroPlacement: 'left'`. The hero stops
       being a band across the top and becomes a column beside everything else, so the page divides
       exactly once: the rail is what you DO, the right column is what you HAVE. Every other
       template here is top-down; this is the only one that is not.
       ⚠️ The reference image carries no search at all. It is added back into the rail, under the
       subtitle — a portal whose catalogue is 300 services and whose only affordance is three doors
       makes the fourth thing you might want unreachable.
       ⚠️ FOUR action rows, not the image's three. Knowledge is one of this product's four fixed
       quick actions; dropping it because a mock showed three would be letting the picture decide
       what the product ships.

       WHERE THE MISSING CARDS WENT — the image shows Requests, Approvals, Announcements and one
       services row, and stops. The rest are placed by what they ARE, not by what fits:
       • Most Read sits BESIDE Announcements (2:1). Both are reading material and both are lists of
         links, so the page gets one "what to read" band instead of two — and it stops Announcements
         being a full-width card holding two lines.
       • Favourite and Most Used are two labelled CHIP rows, stacked. Chips wrap, so neither leaves
         a hole at any count, and two rows of pills read as one browse area rather than as two grids.
       • My Assets and My CIs pair on their own row, which is the shape they were designed as.
       The result reads work → read → browse → own, and nothing is orphaned or full-width-and-sparse.
       ⚠️ Contact Us is the one card NOT in the right column. It is not a record — it is the
       fallback when nothing else on the page worked — and the rail is already the dark surface
       carrying the opening hours, which is the same kind of information. Putting it there keeps the
       right column purely about the requester's own records. It rides in the rail via `rail` +
       `railHome: 'hero'`. */
    seed: {
      blockOrder: ['quick', 'work', 'favourites', 'services', 'records'],
      rowOrder: {
        quick: ['quick-incident', 'quick-service', 'quick-ad', 'quick-knowledge'],
        /* Row 1 is Requests | Approvals; row 2 is the `rail` pair, Announcements leading at two
           shares to Most Read's one. */
        /* ⚠️ `contact` is a MEMBER here even though the hero draws it — `card()` gates on row
           membership, so a card missing from this list renders nowhere at all. */
        work: ['requests', 'approvals', 'news', 'knowledge', 'contact'],
        records: ['assets', 'cis'],
      },
      rail: ['news', 'knowledge'],
      cfg: {
        hero: {
          /* Copy from the reference. The hours line is the product's own `sub`; the greeting and
             the sentence under it are what the image says, because they are the words that make a
             counter read as a counter. */
          heading: 'Welcome to Support Portal',
          sub: 'Report a fault, request a service, or reset your account. No appointment needed.',
          bgKind: 'color',
          bannerStyle: 'gradient',
          bannerColor: '#1E3050',
          headingColor: '#FFFFFF',
          contentAlign: 'left',
          contentMaxWidth: 100,
          searchWidth: 100,
          searchRadius: 10,
          /* The rail is a column, so it fills the page's height rather than setting one. */
          height: 560,
        },
        /* ONE per row — a rail is a column, so a card wider than it is tall is the only shape that
           fits it. The glass treatment is per-card below. */
        quick: { cols: '1' },
        'quick-incident': { fill: 'color', bg: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', radius: 10, sub: '' },
        'quick-service': { fill: 'color', bg: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', radius: 10, sub: '' },
        'quick-ad': { fill: 'color', bg: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', radius: 10, sub: '' },
        'quick-knowledge': { fill: 'color', bg: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', radius: 10, sub: '' },
        work: { cols: '2' },
        records: { cols: '2' },
        favourites: { show: 4 },
        services: { show: 4 },
        /* ⚠️ The row treatment from the reference: subject over a short timestamp in one text
           column, and the status as a coloured DOT rather than a filled pill. Five filled pills in
           a column are five of the loudest objects on the page, competing with the subjects they
           exist to qualify. */
        requests: { rowLayout: 'meta', statusTone: 'dot', dateFormat: 'short' },
        page: {
          heroPlacement: 'left',
          quickLook: 'rail',
          servicesLook: 'chips',
          railHome: 'below',
          contactHome: 'hero',
          /* Tighter corners on every card — the reference's squared treatment. A PAGE decision, so
             no card can end up rounder than the one beside it. */
          cardLook: 'square',
        },
      },
      styles: {
        /* White on navy, for every word in the rail. */
        'quick-incident-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-service-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-ad-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-knowledge-title': { type: { title: { color: '#FFFFFF' } } },
        'quick-incident': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        'quick-service': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        'quick-ad': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        'quick-knowledge': { iconColor: '#FFFFFF', iconFill: 'transparent' },
        /* One column each — a list of records, not a 2x2 of tiles. */
        assets: { columns: 1 },
        cis: { columns: 1 },
      },
    },
  },
  {
    id: 'tpl-catalog',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'Service Catalog First',
    desc: 'Leads with browsable service categories for portals where most traffic is a request, not an incident.',
    category: 'General',
    layout: 'catalog',
    accent: '#134E4A',
    blocks: ['Compact search', 'Category grid', 'Featured services', 'My Open Requests'],
  },
  {
    id: 'tpl-knowledge',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'Knowledge Hub',
    desc: 'A self-service reading room — curated collections, most read, and a contact-us fallback at the end.',
    category: 'General',
    layout: 'knowledge',
    accent: '#3730A3',
    blocks: ['Search hero', 'Collections', 'Most Read', 'Contact us'],
  },
  {
    id: 'tpl-hr',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'People & HR Desk',
    desc: 'An HR-facing portal — leave, payroll and onboarding requests up front, policy documents beside them.',
    category: 'HR',
    layout: 'catalog',
    accent: '#831843',
    blocks: ['Compact search', 'HR service categories', 'Policy documents', 'My Open Requests'],
  },
  {
    id: 'tpl-minimal',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'Minimal Landing',
    desc: 'One search field and three actions on a light canvas. Nothing else competes for the first click.',
    category: 'General',
    layout: 'minimal',
    accent: '#334155',
    badge: 'New',
    blocks: ['Light hero', 'Quick actions', 'Announcements'],
  },
  {
    id: 'tpl-status',
    hidden: true, // no design behind it yet — see the note on `hidden`
    name: 'Announcements & Status',
    desc: 'Opens with live announcements and service status, for portals used during major incidents.',
    category: 'Facilities',
    layout: 'status',
    accent: '#7C2D12',
    blocks: ['Announcement banner', 'Service status', 'Hero search', 'My Open Requests'],
  },
];

/* The portal every tenant already has. It is a SYSTEM page: shipped with the product, always
   present, and the one a requester lands on today — which is why the listing opens with it rather
   than an empty state, and why it is the one page the delete action refuses. */
/* ⚠️ The DEFAULT keeps id SPP-1. Being the default is tested by id in a dozen places — the badge,
   the locked Enabled toggle, the undeletable row, the portal's own address — so giving the new
   layout a new id would have moved every one of those onto the old page. The id is the identity of
   "the portal requesters land on"; which layout it carries is a property of it, not a new thing. */
export const DEFAULT_PORTAL_PAGE: PortalPage = {
  id: 'SPP-1',
  name: 'Support Portal',
  layout: 'v2',
  type: 'System',
  status: 'Published',
  source: 'Classic Service Desk',
  audience: 'All requesters',
  modifiedAt: 'Mon, Aug 17, 2026 09:14 AM',
  modifiedBy: 'Juli Gopani',
  dirty: true,
  /* ⚠️ The seeded portal answers the SAME questions Create asks, so Edit details opens on a filled
     record rather than a form with a disabled Save. A default that cannot satisfy its own required
     fields reads as a broken row, not as a portal nobody has finished. */
  company: 'Acme Corporation',
  url: 'support.acme.com',
  idp: 'None — use ServiceOps login',
  ssoOnly: false,
};

/** The arrangement the builder shipped with, kept as a portal of its own. */
export const SECOND_PORTAL_PAGE: PortalPage = {
  ...DEFAULT_PORTAL_PAGE,
  id: 'SPP-2',
  name: 'Support Portal - 2',
  layout: 'v1',
  url: 'support.acme.com/portal-2',
  dirty: false,
  modifiedAt: 'Mon, Aug 17, 2026 09:14 AM',
};

/* The listing says WHEN in relative terms, because "2 days ago" is the question an admin is
   actually asking of that column; the full stamp stays on the record for anywhere precision
   matters. Falls back to the raw stamp if it cannot be parsed rather than printing "NaN days". */
export function relPortalStamp(stamp: string): string {
  const t = Date.parse(stamp);
  if (Number.isNaN(t)) return stamp;
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return days + ' days ago';
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : months + ' months ago';
}

export const TEMPLATE_CATEGORIES = ['All', 'IT Support', 'HR', 'Facilities', 'General'] as const;

/* ── The default layout the canvas renders ───────────────────────────────── */

export interface PortalRequest { id: string; subject: string; at: string; status: string }
export interface PortalApproval { id: string; subject: string; reason: string; at: string; by: string; initials: string; color: string }
export interface PortalArticle { id: string; title: string; at: string; tag: string }

export const PORTAL_QUICK_ACTIONS = [
  { key: 'incident', title: 'New Incident', desc: 'Report an incident' },
  { key: 'service', title: 'Request Service', desc: 'Browse the services offered' },
  { key: 'knowledge', title: 'Knowledge', desc: 'Browse knowledge' },
] as const;

/** 17 open in total; the card lists the five most recent, which is what the live portal does. */
export const PORTAL_OPEN_REQUEST_TOTAL = 17;

/* Statuses vary on purpose: the builder's Statuses filter has to visibly do something, and a list
   where every row says "Open" would make a working filter look broken. */
export const PORTAL_OPEN_REQUESTS: PortalRequest[] = [
  { id: 'SR-201', subject: 'Request for New Laptop', at: 'Wed, Aug 12, 2026 10:09 AM', status: 'Open' },
  { id: 'INC-187', subject: 'Cannot Create KB Article', at: 'Mon, Aug 10, 2026 11:43 AM', status: 'In Progress' },
  { id: 'SR-180', subject: 'Employee On-boarding', at: 'Wed, Aug 05, 2026 03:22 PM', status: 'Open' },
  { id: 'INC-178', subject: 'Password Reset Required', at: 'Wed, Aug 05, 2026 12:03 PM', status: 'Pending' },
  { id: 'INC-170', subject: 'Laptop Slow and Lagging', at: 'Tue, Aug 04, 2026 03:51 PM', status: 'In Progress' },
  { id: 'SR-166', subject: 'Access to Finance Drive', at: 'Mon, Aug 03, 2026 09:14 AM', status: 'On Hold' },
  { id: 'INC-159', subject: 'VPN Disconnects Frequently', at: 'Fri, Jul 31, 2026 04:02 PM', status: 'Open' },
  { id: 'INC-151', subject: 'Monitor Flickering', at: 'Thu, Jul 30, 2026 11:20 AM', status: 'Resolved' },
  { id: 'SR-147', subject: 'Software License Renewal', at: 'Wed, Jul 29, 2026 02:45 PM', status: 'Closed' },
  { id: 'INC-142', subject: 'Printer Not Responding', at: 'Tue, Jul 28, 2026 10:33 AM', status: 'Reopened' },
];

/** Status pill colours, so a filtered list still reads at a glance. */
export const REQUEST_STATUS_TONE: Record<string, { fg: string; bg: string }> = {
  'Open': { fg: '#B45309', bg: '#FEF3C7' },
  'In Progress': { fg: '#1D4ED8', bg: '#DBEAFE' },
  'Pending': { fg: '#7C3AED', bg: '#EDE9FE' },
  'On Hold': { fg: '#64748B', bg: '#F1F5F9' },
  'Resolved': { fg: '#22A06B', bg: '#ECFDF3' },
  'Closed': { fg: '#64748B', bg: '#F1F5F9' },
  'Reopened': { fg: '#DC2626', bg: '#FEF3F2' },
};

/* ⚠️ The SAME statuses restated for a dark surface. A 10% tint is a pale wash on white and a glare
   on #16233A, so the fill drops to a deep version of its own hue and the text lifts to the bright
   end of it — the pill still reads as "amber" or "green", which is the only job it has, without
   becoming the loudest thing on a dark page. Chosen by mode rather than filtered, because a filter
   would shift every hue by the same amount and the point of these is that they differ. */
export const REQUEST_STATUS_TONE_DARK: Record<string, { fg: string; bg: string }> = {
  'Open': { fg: '#FBBF24', bg: '#3A2A0A' },
  'In Progress': { fg: '#93C5FD', bg: '#12325A' },
  'Pending': { fg: '#C4B5FD', bg: '#2B2350' },
  'On Hold': { fg: '#9FB3C8', bg: '#22334F' },
  'Resolved': { fg: '#4ADE80', bg: '#12351F' },
  'Closed': { fg: '#9FB3C8', bg: '#22334F' },
  'Reopened': { fg: '#F87171', bg: '#3A1717' },
};

/** The tone for a status in the mode that is on. One lookup, so no call site can pick the wrong set. */
export const statusTone = (status: string, dark = false) =>
  (dark ? REQUEST_STATUS_TONE_DARK : REQUEST_STATUS_TONE)[status]
  ?? (dark ? { fg: '#9FB3C8', bg: '#22334F' } : { fg: '#64748B', bg: '#F1F5F9' });

export const PORTAL_APPROVALS: PortalApproval[] = [
  {
    id: 'INC-192', subject: 'Wrong configuration details', reason: 'Peer review requested',
    at: 'Tue, Aug 11, 2026 02:14 PM', by: 'Rosy', initials: 'RO', color: '#3D8BD0',
  },
  {
    id: 'AST-13', subject: 'DESKTOP-5JPPI6F', reason: 'Approval Required for - AST-13',
    at: 'Mon, Aug 10, 2026 12:57 PM', by: 'Keya', initials: 'KE', color: '#7C3AED',
  },
];

export const PORTAL_ARTICLES: PortalArticle[] = [
  { id: 'KB-4', title: 'How to Reset Your Password', at: 'Thu, Jul 30, 2026 11:34 AM', tag: 'Guideline Documents' },
  { id: 'KB-1', title: 'Connecting to Company VPN', at: 'Sun, Jul 19, 2026 10:58 PM', tag: 'FAQs' },
  { id: 'KB-6', title: 'Reporting a Hardware Fault', at: 'Tue, Aug 11, 2026 04:38 PM', tag: 'Guideline Documents' },
];

/* ── Add panel — the element catalogue ───────────────────────────────────── */

/* Groups render in this order. **Components** is deliberately first: the system blocks a support
 * portal is actually made of are what an admin reaches for, and burying them under generic layout
 * primitives would make the common case the hard one. Everything below Components is the generic
 * toolkit, in the order Duda uses (layout → basic → visual → business → custom). */
/* ⚠️ No 'Layout' group. It held two elements — a Divider and Advanced Tabs — which are as basic as
   anything in Basic; a tab of two rows is a category that costs more to scan than it saves. */
export const PORTAL_ELEMENT_GROUPS = ['Data', 'Actions', 'Basic', 'Visual', 'Custom'] as const;
export type PortalElementGroup = (typeof PORTAL_ELEMENT_GROUPS)[number];

export interface PortalElement {
  id: string;
  name: string;
  /** Key into the panel's icon registry. */
  icon: string;
  group: PortalElementGroup;
  /** System components only — this element IS a block the page ships with. */
  onPage?: boolean;
  /* The node id of that block, so "is it on the page right now" can be ANSWERED rather than
     assumed.
     ⚠️ `onPage` is a fact about the catalogue and never changes; this is what lets the palette read
     the LIVE page instead. Delete My Assets from the page and its row goes back to addable — a
     static flag would have gone on claiming it was there. */
  node?: string;
  /** Extra words the search should match (variants, synonyms) without cluttering the row. */
  keywords?: string;
  /* ⚠️ Withheld from the palette, but NOT deleted. Its spec and renderer stay, so anything already
     on a page keeps working and the decision is one flag to reverse. Deleting the entry would take
     the element off existing pages too, which is a different and much larger decision. */
  hidden?: boolean;
}

/* ⚠️ `onPage` mirrors what SupportPortalPreview actually renders as a BUILT-IN band. Keep the two
   in step: the builder's demo seed lays out one example section per element and skips these, so a
   flag that has drifted shows the untouched page carrying My Open Requests twice — or missing the
   example of a block it does not actually have.
   ⚠️ It no longer governs the PALETTE. Every element is addable, every time; a row that greys out
   because the page already has one has to stay in step with the page to be truthful, and it never
   quite did. What a page RENDERS and what an admin may ADD are two questions, and this answers the
   first. */

/* ── Record List — the modules an admin can point one at ──────────────────
 *
 * A Record List is the six live-data cards with the question left open: same card, same rows, same
 * empty state, but the admin chooses WHICH records and WHICH of them.
 *
 * ⚠️ Statuses are declared PER MODULE, because they are not the same words. A request is Open or
 * Resolved, a change is Draft or Approved, a patch is Missing or Installed — one shared status list
 * would offer every module several options that can never match anything.
 * ⚠️ The rows here are DUMMY DATA, and deliberately so: the card lands on the page showing its shape
 * before it has been configured, the way every other widget in this builder does. The real query is
 * the backend's, and these rows are what stands in for it until then.
 * ⚠️ Adding a module is adding a row to this list — nothing else knows the set. */
export interface RecordModule {
  key: string;
  label: string;
  /* ⚠️ WITHHELD from the Module dropdown, NOT deleted — the same rule `PortalElement.hidden` and
     the template gallery both follow. `recordModule()` still resolves a hidden key, so a card
     already pointed at one keeps its rows, its statuses and its filter; only the picker stops
     offering it. Deleting the entry would have silently re-pointed every such card at Requests. */
  hidden?: boolean;
  statuses: string[];
  rows: { id: string; title: string; status: string; meta: string }[];
}

/** The modules the picker actually offers — everything not withheld by `hidden`.
 *
 * ⚠️ `RECORD_MODULES` stays the FULL list because `recordModule()` resolves a saved key through
 * it, and a card built on a module that has since been withheld must keep working rather than
 * quietly becoming a Requests card. Same split `VISIBLE_TEMPLATES` makes, for the same reason. */
export const VISIBLE_RECORD_MODULES = (): RecordModule[] => RECORD_MODULES.filter((m) => !m.hidden);

export const RECORD_MODULES: RecordModule[] = [
  {
    key: 'request', label: 'Requests',
    statuses: ['Open', 'In Progress', 'Pending', 'On Hold', 'Resolved', 'Closed'],
    rows: [
      { id: 'INC-178', title: 'Password reset required', status: 'Pending', meta: 'Raised 05 Aug 2026' },
      { id: 'INC-170', title: 'Laptop slow and lagging', status: 'In Progress', meta: 'Raised 04 Aug 2026' },
      { id: 'SR-180', title: 'Employee on-boarding', status: 'Open', meta: 'Raised 05 Aug 2026' },
    ],
  },
  {
    key: 'problem', label: 'Problems', hidden: true,
    statuses: ['Open', 'Known Error', 'Under Investigation', 'Resolved', 'Closed'],
    rows: [
      { id: 'PRB-4412', title: 'Recurring VPN drops on the Pune link', status: 'Under Investigation', meta: 'Network' },
      { id: 'PRB-4390', title: 'Outlook profile corruption after update', status: 'Known Error', meta: 'End user computing' },
    ],
  },
  {
    key: 'change', label: 'Changes',
    statuses: ['Draft', 'Submitted', 'Approved', 'Scheduled', 'Implemented', 'Closed'],
    rows: [
      { id: 'CHG-2091', title: 'Core switch firmware upgrade', status: 'Scheduled', meta: 'Window 16 Aug, 02:00' },
      { id: 'CHG-2088', title: 'Exchange mailbox quota increase', status: 'Approved', meta: 'Standard' },
    ],
  },
  {
    key: 'release', label: 'Releases', hidden: true,
    statuses: ['Planning', 'Build', 'Testing', 'Deployed', 'Closed'],
    rows: [
      { id: 'REL-118', title: 'ServiceOps 8.4 rollout', status: 'Testing', meta: 'Go-live 22 Aug' },
      { id: 'REL-114', title: 'Payroll portal refresh', status: 'Deployed', meta: 'Finance' },
    ],
  },
  {
    key: 'asset', label: 'Assets',
    statuses: ['In Use', 'In Stock', 'In Repair', 'Retired'],
    rows: [
      { id: 'AST-3', title: 'Dell Latitude 5440', status: 'In Use', meta: 'Laptop' },
      { id: 'AST-12', title: 'Jabra Evolve2 65', status: 'In Use', meta: 'Headset' },
      { id: 'AST-9', title: 'iPhone 14', status: 'In Stock', meta: 'Mobile' },
    ],
  },
  {
    key: 'ci', label: 'Configuration Items',
    statuses: ['Operational', 'Degraded', 'Down', 'Retired'],
    rows: [
      { id: 'CI-104', title: 'app-prod-01', status: 'Operational', meta: 'Server' },
      { id: 'CI-121', title: 'core-switch-b', status: 'Degraded', meta: 'Switch' },
    ],
  },
  {
    key: 'patch', label: 'Patches', hidden: true,
    statuses: ['Missing', 'Installed', 'Ignored', 'Failed'],
    rows: [
      { id: 'PCH-4345', title: 'Cumulative update for Windows 11', status: 'Missing', meta: 'Critical' },
      { id: 'PCH-4302', title: 'Chrome 128 security update', status: 'Installed', meta: 'Important' },
    ],
  },
  {
    key: 'vulnerability', label: 'Vulnerabilities', hidden: true,
    statuses: ['Detected', 'Exploited', 'Patched', 'Accepted Risk'],
    rows: [
      { id: 'CVE-2024-30080', title: 'Windows MSMQ remote code execution', status: 'Exploited', meta: 'CVSS 9.8' },
      { id: 'CVE-2024-30078', title: 'Wi-Fi driver remote code execution', status: 'Detected', meta: 'CVSS 8.8' },
    ],
  },
  {
    key: 'approval', label: 'Approvals',
    statuses: ['Pending', 'Approved', 'Rejected'],
    rows: [
      { id: 'AST-13', title: 'Approval required for DESKTOP-5JPPI6F', status: 'Pending', meta: 'Requested by Keya' },
      { id: 'SR-166', title: 'Adobe Creative Cloud licence', status: 'Approved', meta: 'Software' },
    ],
  },
  {
    key: 'knowledge', label: 'Knowledge',
    statuses: ['Draft', 'In Review', 'Published', 'Retired'],
    rows: [
      { id: 'KB-4', title: 'How to reset your password', status: 'Published', meta: 'Guideline Documents' },
      { id: 'KB-1', title: 'Connecting to company VPN', status: 'Published', meta: 'FAQs' },
      { id: 'KB-6', title: 'Reporting a hardware fault', status: 'Published', meta: 'Guideline Documents' },
    ],
  },
  {
    key: 'task', label: 'Tasks', hidden: true,
    statuses: ['Open', 'In Progress', 'Completed', 'Cancelled'],
    rows: [
      { id: 'TA-2201', title: 'Collect the returned laptop', status: 'Open', meta: 'Due 18 Aug' },
      { id: 'TA-2194', title: 'Revoke building access', status: 'Completed', meta: 'Facilities' },
    ],
  },
];

export const recordModule = (key?: string) =>
  RECORD_MODULES.find((m) => m.key === key) ?? RECORD_MODULES[0];

export const PORTAL_ELEMENTS: PortalElement[] = [
  /* ── The ServiceOps portal's own blocks, in the two groups they actually divide into ──
   *
   * LIVE DATA fetches from the backend and shows whatever the requester's account returns; ACTIONS
   * are fixed destinations that never vary by user. That split is not decoration — it is why the
   * live-data widgets have no per-row content controls and the action cards do.
   *
   * ⚠️ Search, Categories, My Tasks and FAQ were removed from this section. Search and FAQ still
   * exist as elements elsewhere in the palette; My Tasks and Categories are not portal blocks this
   * product ships. */
  { id: 'c-requests', name: 'My Open Requests', icon: 'requests', group: 'Data', onPage: true, node: 'requests', keywords: 'tickets incidents open' },
  { id: 'c-approvals', name: 'Pending Approvals', icon: 'approvals', group: 'Data', onPage: true, node: 'approvals', keywords: 'pending approve' },
  { id: 'c-assets', name: 'My Assets', icon: 'assets', group: 'Data', onPage: true, node: 'assets', keywords: 'hardware devices' },
  { id: 'c-cis', name: 'My CIs', icon: 'cis', group: 'Data', onPage: true, node: 'cis', keywords: 'configuration items cmdb' },
  /* ⚠️ No `node` — Announcements is the one Live-data widget this page has no fixed block for; it
     only ever exists as a placed element. It is still marked as added once one is on the page,
     because "predefined" is decided by the GROUP (Data and Actions) rather than by owning a
     fixed block. Reading it the other way round left this one row addable while its five neighbours
     all greyed out. */
  { id: 'c-announcements', name: 'Announcements', icon: 'announcements', group: 'Data', keywords: 'news broadcast banner' },
  { id: 'c-knowledge', name: 'Most Read Knowledge', icon: 'knowledge', group: 'Data', onPage: true, node: 'knowledge', keywords: 'articles kb most read' },
  /* ⚠️ LIVE DATA, not Custom. Its own spec has said `group: 'Data'` all along — only the
     PALETTE entry disagreed, and the palette is the one an admin reads. The group is not decoration
     either: Data and Actions are the predefined groups, so moving it is what makes Contact Us
     behave like the card it is — one instance, ticked once it is on the page. */
  { id: 'c-contact', name: 'Contact Us', icon: 'contact', group: 'Data', node: 'contact', keywords: 'support escalate raise' },
  /* ⚠️ NOT onPage. This is spec §7.8 Featured Services — a requester's favourites list. The page
     carries the "Request Service" ACTION CARD, which is a different widget with a fixed
     destination. Flagging this one as placed made Featured Services unreachable. */
  /* ⚠️ Its own element, not a variant of Most Used Services. The two answer different questions —
     what THIS requester pinned, versus what the whole organisation asks for most — and a single
     widget with a source toggle would have made a page carrying both look like one widget
     misconfigured twice. */
  /* ⚠️ BACK in the palette, both of them, and each naming its fixed page block so the library marks
     it as already added. They were hidden in task 22 on the reasoning that a requester fills them,
     so an admin should not be placing them — but that reasoning argued for a NOTE, not an absence:
     an admin can reasonably decide whether the page carries a favourites row at all, and hiding the
     row only meant that once it was deleted there was no way to get it back. Favourite Services
     carries the note saying it stays invisible until a requester has favourites. */
  /* ⚠️ LIVE DATA, not Custom. Both are fed by the backend — one from what this requester pinned, the
     other from what the organisation asks for most — which is the line Data draws. They sat in
     Custom because they were written before that split existed.
     Their `node` stays: it is what lets the palette see them on the page, since both are top-level
     BANDS rather than members of a row. */
  { id: 'c-favourites', name: 'Favourite Services', icon: 'services', group: 'Data', node: 'favourites', keywords: 'pinned starred saved shortcuts' },
  { id: 'c-services', name: 'Most Used Services', icon: 'services', group: 'Data', node: 'services', keywords: 'catalog request service favourites featured' },
  /* Placed: the FAQ block already sits in the banner area of this portal, so the palette shows it
     as added rather than offering a second one. */
  { id: 'c-faq', name: 'FAQ', icon: 'faq', group: 'Custom', onPage: true, keywords: 'questions help answers' },
  /* ⚠️ CUSTOM, not Data — and that placement does real work. Data and Actions are
     group-gated as predefined: one instance each, greyed with a tick once placed. This one is
     repeatable, which is exactly what it needs — two Record Lists filtered differently is a
     reasonable page, and the whole point is that the admin asks the question. */
  { id: 'c-records', name: 'Custom Data Widget', icon: 'records', group: 'Custom', keywords: 'list records kpi count metric requests assets cis filter module query data' },

  // ── Actions — fixed destinations, the same for every requester ──
  /* ⚠️ The four action cards are BACK in the palette. Hiding them was the wrong answer to a real
     problem: they are the Quick Actions row's four fixed destinations, so a fifth copy has nowhere
     legal to land — but a palette that silently drops four rows makes the admin wonder where the
     New Incident card went. Present-and-marked-as-added says the same thing and answers the
     question at the same time.
     Each names its `node`, so the mark reads the LIVE page: remove AD Self Service from the row and
     its row becomes addable again. */
  { id: 'act-incident', name: 'New Incident', icon: 'incident', group: 'Actions', onPage: true, node: 'quick-incident', keywords: 'report issue raise ticket' },
  { id: 'act-service', name: 'Request Service', icon: 'services', group: 'Actions', onPage: true, node: 'quick-service', keywords: 'catalog order' },
  { id: 'act-ad', name: 'AD Self Service', icon: 'adself', group: 'Actions', node: 'quick-ad', keywords: 'password reset domain unlock' },
  { id: 'act-knowledge', name: 'Knowledge', icon: 'knowledge', group: 'Actions', onPage: true, node: 'quick-knowledge', keywords: 'articles help search' },

  { id: 'l-tabs', name: 'Advanced Tabs', icon: 'tabs', group: 'Basic', hidden: true }, // hidden 20 Aug 2026
  { id: 'l-divider', name: 'Divider', icon: 'divider', group: 'Basic', keywords: 'vertical horizontal v/h separator rule', hidden: true }, // hidden 21 Aug 2026

  /* ⚠️ File Download, Click to Call, Click to Mail and Share are NOT here. They are Button
     ACTIONS (§7.11's 'Opens' list), not elements — one button with a different destination. A
     separate palette entry for each was two ways to make the same link.
     x-search was a DUPLICATE of c-search under Custom; two identically named entries is a coin
     flip for whoever uses it. */
  /* ⚠️ Large Title, Small Title and List are HIDDEN, not deleted — their specs and renderers are
     still here because the Text element is absorbing those features into its own content. Deleting
     them would take the working code with them; hiding them stops the palette offering two ways to
     write a heading while that move is in flight.
     Countdown, Photo Gallery, Icon and Shape were REMOVED from the palette outright. */
  // ── Basic ──
  { id: 'b-text', name: 'Text', icon: 'text', group: 'Basic', keywords: 'paragraph body copy' },
  { id: 'b-button', name: 'Button', icon: 'button', group: 'Basic', keywords: 'cta link action' },
  { id: 'b-spacer', name: 'Spacer', icon: 'spacer', group: 'Basic', keywords: 'gap whitespace', hidden: true }, // hidden 20 Aug 2026
  { id: 'b-table', name: 'Table', icon: 'table', group: 'Basic', keywords: 'grid rows columns data' },
  { id: 'b-accordion', name: 'Accordion', icon: 'accordion', group: 'Basic', keywords: 'collapse faq expand' },
  { id: 'b-text-image', name: 'Text with Image', icon: 'textImage', group: 'Basic', keywords: 'media split', hidden: true },
  /* ⚠️ HIDDEN, not deleted — the spec, the renderer and the panel all stay, so a page already
     carrying a Card keeps working and restoring the row is one word. */
  { id: 'b-card', name: 'Card', icon: 'card', group: 'Basic', hidden: true, keywords: 'tile panel' },

  // ── Visual ──
  { id: 'v-image', name: 'Image', icon: 'image', group: 'Visual', keywords: 'picture photo' },
  { id: 'v-video', name: 'Video', icon: 'video', group: 'Visual', keywords: 'youtube vimeo mp4 embed player clip' },
  { id: 'v-slider', name: 'Media Slider', icon: 'slider', group: 'Visual', keywords: 'carousel gallery', hidden: true }, // hidden 20 Aug 2026 — 22 of 33 controls inert


  // ── Custom ──
  /* ⚠️ HIDDEN, not deleted — an action card belongs inside the Quick Actions row, never as a
     standalone block on the page. The spec, the renderer and the preview all stay, so anything a
     page is already carrying keeps working and restoring it is one word. */
  { id: 'x-action-card', name: 'Action Card', icon: 'actionCard', group: 'Custom', keywords: 'quick action tile', hidden: true }, // hidden 24 Aug 2026
  /* ⚠️ HIDDEN, not deleted. The KPI is now a DISPLAY MODE of the Custom data widget rather than a
     widget of its own — the two asked the same question (which records?) and answered it in two
     shapes, so an admin had to know which they wanted before they could pick a module. Its spec,
     its renderer and its panel all stay, so a page already carrying a placed KPI keeps working and
     editing exactly as it did. */
  { id: 'x-kpi', name: 'KPI', icon: 'kpi', group: 'Custom', hidden: true, keywords: 'metric stat number' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'Wed, Aug 12, 2026 10:09 AM' — the stamp format every list in this product uses. */
export function formatPortalStamp(d: Date): string {
  const h = d.getHours();
  const hh = ((h + 11) % 12) + 1;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} ${String(hh).padStart(2, '0')}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Next free `SPP-#`, so ids stay stable and readable as pages come and go. */
export function nextPageId(pages: PortalPage[]): string {
  const max = pages.reduce((n, p) => {
    const m = /^SPP-(\d+)$/.exec(p.id);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `SPP-${max + 1}`;
}

/** 'New page', then 'New page 2'… — a builder must never make the admin resolve a clash. */
export function uniquePageName(pages: PortalPage[], base: string): string {
  const taken = new Set(pages.map((p) => p.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/* Live-data widgets with no records right now.
 *
 * ⚠️ In the real product this is a question for the data layer, not a constant — it is here because
 * this is a prototype and the answer has to come from somewhere. What matters is that ONE place
 * knows it, so the canvas and the panel cannot disagree about whether a widget has anything in it. */
export const PORTAL_EMPTY_WIDGETS = new Set(['cis']);
