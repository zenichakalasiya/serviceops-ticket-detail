/* Support Portal builder — BANNER TEMPLATES, the Banners menu on the builder's rail.
 *
 * Each template is one of the 29 shipping layouts in the "Support Portal layout templates" gallery
 * (the industry chips: IT & ITES · Healthcare · Manufacturing · Government · Education · BFSI),
 * rebuilt with THIS editor's own banner rather than drawn as a picture of one:
 *
 *   - the band's colour / gradient / image, its height, corners and inset  → hero config
 *   - the heading and sub-heading (sizes and colours)                        → the Text group + styles
 *   - the search                                                             → our own search, always
 *   - the widgets on the banner and how they are arranged                    → `rowExtras.hero` + `bannerTree`
 *   - grid texture, the accent bar, the eyebrow, decorative shapes           → `bannerDecor`
 *
 * ⚠️ So a template is a STARTING POINT, not a finished picture: once applied, every piece is the
 * ordinary editable banner — its items move, its presets apply, its widgets are selectable.
 *
 * ⚠️ `bannerDecor` is the BANNER's design, deliberately not a widget. Texture, the eyebrow line and
 * the shapes arrive with a template and have no palette row of their own — they are what makes a
 * banner that banner, not something a page is built out of.
 *
 * ⚠️ Our search goes on EVERY banner, including the gallery layouts that had none: the search is the
 * one control a requester reaches for first, so no banner choice may take it away.
 *
 * ⚠️ Pictures are not shipped. A layout that carries a photograph gets an image slot — the banner's
 * own background shows a "drop an image or browse" placeholder, and a picture beside the words is an
 * Image widget in its empty, droppable state. */

import type { BannerNode } from './portalBannerLayout';
import type { NodeStyle } from './portalPageModel';
import { PORTAL_ELEMENTS } from './supportPortalData';

export type BannerIndustry = 'IT & ITES' | 'Healthcare' | 'Manufacturing' | 'Government' | 'Education' | 'BFSI';

export const BANNER_INDUSTRIES: BannerIndustry[] = ['IT & ITES', 'Healthcare', 'Manufacturing', 'Government', 'Education', 'BFSI'];

/** The banner's own design — drawn behind (or, for the eyebrow, above) its words. */
export interface BannerDecor {
  /** A fine texture across the band. */
  pattern?: 'grid' | 'dots';
  patternColor?: string;
  /** A coloured bar down the band's left edge. */
  accent?: string;
  /** A short line above the heading: a dash, today's date, or words of its own. */
  eyebrow?: 'dash' | 'date' | string;
  eyebrowColor?: string;
  /** One decorative shape. */
  shape?: 'circle' | 'rings' | 'bars' | 'hazard';
  shapeColor?: string;
}

type Shape = string | { d: 'row' | 'column'; c: Shape[] };
const R = (...c: Shape[]): Shape => ({ d: 'row', c });
const C = (...c: Shape[]): Shape => ({ d: 'column', c });

/** A SECTION of the banner: `text` (title, one-liner and search, always together) or a widget. */
export interface BannerPiece { key: string; type?: string; cfg?: Record<string, unknown> }

export interface BannerTemplate {
  /** The gallery layout id — `3b2`, `5a`… */
  id: string;
  name: string;
  industries: BannerIndustry[];
  orientation: 'horizontal' | 'vertical';
  /** Hero config: background, copy, alignment, height, corners, decor. */
  hero: Record<string, unknown>;
  /** Heading / sub-heading typography. */
  title?: { size: number; color: string };
  subtitle?: { size: number; color: string };
  /** The band's inner padding: top/bottom px, left/right % of the band. */
  pad?: { top: number; bottom: number; left: number; right: number };
  /** The Text & Search section: direction of its items, its inner gap, and its alignment on both axes. */
  text?: { dir?: 'row' | 'column'; gap?: number; align?: 'start' | 'center' | 'end' | 'stretch'; alignY?: 'start' | 'center' | 'end' | 'stretch' };
  /** The gaps BETWEEN sections — columns and rows, independently. */
  sectionGap?: { x?: number; y?: number };
  /** The banner's sections, at most four (`text` is the Text & Search section). Horizontal only. */
  pieces?: BannerPiece[];
  tree?: Shape;
  /** Page keys: a vertical banner turns the page into a column beside the rest. */
  page?: Record<string, unknown>;
  /** Extra node styles, keyed by `copy` / `search` / a piece key. */
  styles?: Record<string, NodeStyle>;
}

/* ── Shared pieces ─────────────────────────────────────────────────────────────────────────── */

const WHITE_TITLE = { size: 28, color: '#FFFFFF' };
const WHITE_SUB = { size: 14, color: 'rgba(255,255,255,0.82)' };
const INK = '#0B2545';
const INK_SUB = { size: 14, color: '#4F5B6D' };

const actions = (cols: string, cfg: Record<string, unknown> = {}): BannerPiece => ({ key: 'act', type: 'x-actions', cfg: { cols, ...cfg } });
const announcements = (display: 'regular' | 'carousel' | 'image', title = 'Announcements'): BannerPiece =>
  ({ key: 'ann', type: 'c-announcements', cfg: { display, title } });
const contact: BannerPiece = { key: 'contact', type: 'c-contact' };
const image: BannerPiece = { key: 'img', type: 'v-image' };

type Kpi = { label: string; source?: string; value?: string; hint?: string };
const kpis = (cols: string, look: 'card' | 'outline' | 'glass', items: Kpi[]): BannerPiece =>
  ({ key: 'kpi', type: 'x-kpis', cfg: { cols, look, items } });
const KPI_OPEN: Kpi = { label: 'Open requests', source: 'My requests', hint: '2 updated today' };
const KPI_APPROVALS: Kpi = { label: 'Approvals', source: 'Approvals waiting on me', hint: 'oldest 3 days' };

/* ── The 29 banners ────────────────────────────────────────────────────────────────────────── */

export const BANNER_TEMPLATES: BannerTemplate[] = [
  /* ═════ Horizontal ═════ */
  {
    id: '3b2', name: 'Sidecar · Announcements', industries: ['IT & ITES'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the IT Help Desk', sub: 'Incidents, access requests and equipment — all in one place',
      searchPlaceholder: 'Search or describe a problem',
      bgKind: 'color', colorMode: 'gradient', bannerColor: '#12305A', bannerColor2: '#2B8A9B', colorSide: 'left',
      contentAlign: 'left', height: 220, bannerSplit: '3:2', searchWidth: 100,
    },
    title: WHITE_TITLE, subtitle: WHITE_SUB, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 32, y: 24 },
    pieces: [{ key: 'text' }, announcements('carousel')],
    tree: R('text', 'ann'),
  },
  {
    id: '3g', name: 'Atlas', industries: ['IT & ITES'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome back, Yash', sub: 'Two approvals need you today. Everything else is moving.',
      searchPlaceholder: 'Search our knowledge base',
      bgKind: 'color', colorMode: 'gradient', bannerColor: '#D6E5F9', bannerColor2: '#F3F8FE', colorSide: 'top left',
      contentAlign: 'left', height: 280, bannerRadius: 16, bannerInset: 16, bannerSplit: '3:2', searchWidth: 80,
    },
    title: { size: 30, color: INK }, subtitle: INK_SUB, pad: { top: 32, bottom: 28, left: 3, right: 2 },
    sectionGap: { x: 40, y: 48 },
    pieces: [{ key: 'text' }, actions('1')],
    text: { alignY: 'stretch', gap: 48 },
    tree: R('text', 'act'),
    page: { heroInk: 'dark' },
  },
  {
    id: '2a', name: 'Prism · Coral', industries: ['IT & ITES'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help you today?', sub: 'Search 412 articles and 214 services, or raise a request.',
      searchPlaceholder: 'Search 412 articles and 214 services',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FDEEEC',
      contentAlign: 'left', height: 300, bannerRadius: 16, bannerInset: 16, searchWidth: 55, contentMaxWidth: 60,
      bannerDecor: { pattern: 'grid', patternColor: 'rgba(194,69,47,0.10)', accent: '#C2452F', eyebrow: 'dash', eyebrowColor: '#E59A8B' },
    },
    title: { size: 42, color: '#07101F' }, subtitle: { size: 14, color: '#6B5450' }, pad: { top: 36, bottom: 36, left: 4, right: 4 },
    text: { gap: 28 },
    pieces: [{ key: 'text' }],
    tree: 'text',
    page: { heroInk: 'dark' },
  },
  {
    id: '2ag', name: 'Prism · Green', industries: ['IT & ITES'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help you today?', sub: 'Search 412 articles and 214 services, or raise a request.',
      searchPlaceholder: 'Search 412 articles and 214 services',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#E6F4EC',
      contentAlign: 'left', height: 300, bannerRadius: 16, bannerInset: 16, searchWidth: 55, contentMaxWidth: 60,
      bannerDecor: { pattern: 'grid', patternColor: 'rgba(14,113,80,0.10)', accent: '#0E7150', eyebrow: 'dash', eyebrowColor: '#7AC5A2' },
    },
    title: { size: 42, color: '#0D2C22' }, subtitle: { size: 14, color: '#4C6459' }, pad: { top: 36, bottom: 36, left: 4, right: 4 },
    text: { gap: 28 },
    pieces: [{ key: 'text' }],
    tree: 'text',
    page: { heroInk: 'dark' },
  },
  {
    id: '5a', name: 'Meridian', industries: ['Healthcare'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Meridian Health Service Desk',
      sub: 'Clinical and corporate systems, devices and access — anything touching live patient care is triaged first.',
      searchPlaceholder: 'Search services and knowledge',
      bgKind: 'image', photoSlot: true, overlayOn: true, overlayMode: 'gradient',
      overlayGradient: { type: 'linear', angle: 90, stops: [{ pos: 0, color: 'rgba(11,37,69,0.92)' }, { pos: 100, color: 'rgba(11,37,69,0.2)' }] },
      contentAlign: 'left', height: 340, bannerSplit: '3:2', searchWidth: 90,
    },
    title: { size: 32, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 28, bottom: 28, left: 3, right: 2 },
    sectionGap: { x: 40, y: 28 },
    pieces: [{ key: 'text' }, actions('1'), contact],
    tree: R('text', C('act', 'contact')),
  },
  {
    id: '5c', name: 'Bedside', industries: ['Healthcare'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to Bedside Health, how can we help you?', sub: 'Report a clinical fault, request access or find a procedure.',
      searchPlaceholder: 'Search services, devices and clinical procedures',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
      contentAlign: 'left', height: 340, bannerSplit: '11:9', searchWidth: 100, contentMaxWidth: 100,
    },
    title: { size: 32, color: INK }, subtitle: INK_SUB, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 48, y: 20 },
    pieces: [
      { key: 'text' },
      /* The doors under the Text & Search section are the product's own ACTION CARDS as compact rows — icon, title, chevron. */
      actions('1', { look: 'row' }),
      announcements('image'),
    ],
    tree: R(C('text', 'act'), 'ann'),
    page: { heroInk: 'dark' },
  },
  {
    id: '2an', name: 'Prism · Navy', industries: ['Healthcare'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help you today?', sub: 'Search 412 articles and 214 services, or raise a request.',
      searchPlaceholder: 'Search 412 articles and 214 services',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#EDF2F8',
      contentAlign: 'left', height: 280, bannerRadius: 16, bannerInset: 16, bannerSplit: '2:1', searchWidth: 80,
      bannerDecor: { pattern: 'grid', patternColor: 'rgba(81,99,129,0.10)', accent: '#516381', eyebrow: 'dash', eyebrowColor: '#9AA9C0' },
    },
    title: { size: 38, color: '#07101F' }, subtitle: { size: 14, color: '#4F5B6D' }, pad: { top: 32, bottom: 32, left: 4, right: 3 },
    sectionGap: { x: 40, y: 24 },
    pieces: [{ key: 'text' }, contact],
    tree: R('text', 'contact'),
    page: { heroInk: 'dark' },
  },
  {
    id: '3i', name: 'Wayfinder', industries: ['Healthcare', 'Government'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Citizen Services Portal', sub: 'Apply for a service, track an application or raise a grievance — in one search.',
      searchPlaceholder: 'Describe your issue, or search a service',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F3F5F8',
      contentAlign: 'left', height: 320, bannerSplit: '3:2', searchWidth: 80,
    },
    title: { size: 36, color: INK }, subtitle: INK_SUB, pad: { top: 32, bottom: 32, left: 4, right: 3 },
    sectionGap: { x: 48, y: 40 },
    text: { alignY: 'stretch', gap: 40 },
    pieces: [{ key: 'text' }, actions('1')],
    tree: R('text', 'act'),
    page: { heroInk: 'dark' },
  },
  {
    id: '4b', name: 'Broadsheet', industries: ['Healthcare', 'Government'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Department Service Catalogue',
      sub: 'Certificates, licences, connections and grievances — browse the catalogue or find the answer yourself.',
      searchPlaceholder: 'Search the catalogue, knowledge and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F7F9FC',
      contentAlign: 'left', height: 320, bannerSplit: '3:2', searchWidth: 75,
    },
    title: { size: 30, color: INK }, subtitle: INK_SUB, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 40, y: 24 },
    pieces: [{ key: 'text' }, announcements('regular'), actions('4', { look: 'row' })],
    /* The words and the notices share the top row; the doors run the full width beneath them. */
    tree: C(R('text', 'ann'), 'act'),
    page: { heroInk: 'dark' },
  },
  {
    id: '4p', name: 'Employee Center', industries: ['Healthcare', 'Education'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help?', sub: 'Search services, articles and requests.',
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F4F6FA',
      contentAlign: 'left', height: 400, searchWidth: 100,
    },
    title: { size: 20, color: INK }, subtitle: { size: 13, color: '#4F5B6D' }, pad: { top: 20, bottom: 20, left: 2, right: 2 },
    sectionGap: { x: 16, y: 16 },
    pieces: [announcements('image'), actions('2'), { key: 'text' }],
    text: { dir: 'row', align: 'stretch' },
    tree: C(R('ann', 'act'), 'text'),
    page: { heroInk: 'dark' },
  },
  {
    id: '6c', name: 'Triptych', industries: ['Healthcare'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help you today?', sub: 'Search the catalogue and knowledge base, or start from an action below.',
      searchPlaceholder: 'Search services and knowledge',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F4F6FA',
      contentAlign: 'left', height: 240, searchWidth: 100,
    },
    title: { size: 22, color: INK }, subtitle: { size: 13, color: '#4F5B6D' }, pad: { top: 20, bottom: 20, left: 2, right: 2 },
    sectionGap: { x: 16, y: 20 },
    pieces: [announcements('carousel'), { key: 'text' }, contact],
    tree: R('ann', 'text', 'contact'),
    page: { heroInk: 'dark' },
  },
  {
    id: '4i', name: 'Rails', industries: ['Manufacturing'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Plant Service Desk', sub: 'Line stoppages, maintenance and plant IT — reported from the floor.',
      searchPlaceholder: 'Search by machine, line or service',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
      contentAlign: 'left', height: 220, bannerSplit: '3:2', searchWidth: 80,
    },
    title: { size: 30, color: INK }, subtitle: INK_SUB, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 40, y: 20 },
    pieces: [{ key: 'text' }, kpis('3', 'outline', [
      KPI_OPEN, { label: 'My tasks', value: '5', hint: '2 due this shift' }, { label: 'Devices', value: '9', hint: 'under maintenance' },
    ])],
    tree: R('text', 'kpi'),
    page: { heroInk: 'dark' },
  },
  {
    id: '3h', name: 'Concierge', industries: ['Manufacturing'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Plant IT Service Desk', sub: "Acme Corporation IT Service Desk · we're here to help. Tell us what you need.",
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#16233A',
      contentAlign: 'left', height: 170, bannerRadius: 12, bannerInset: 16, bannerSplit: '1:1', searchWidth: 90,
      bannerDecor: { shape: 'hazard', shapeColor: '#F5B342' },
    },
    title: { size: 22, color: '#FFFFFF' }, subtitle: { size: 13, color: 'rgba(255,255,255,0.7)' }, pad: { top: 24, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 32, y: 16 },
    pieces: [{ key: 'text' }, kpis('3', 'glass', [
      { label: 'Open requests', source: 'My requests' }, { label: 'Approvals', source: 'Approvals waiting on me' }, { label: 'My assets', source: 'My assets' },
    ])],
    tree: R('text', 'kpi'),
  },
  {
    id: '4c', name: 'Mosaic', industries: ['Manufacturing'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the IT Service Desk', sub: 'Raise a ticket, request a service or find the answer yourself — everything Acme IT supports lives here.',
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
      contentAlign: 'left', height: 130, bannerSplit: '3:2', searchWidth: 100,
    },
    title: { size: 24, color: INK }, subtitle: { size: 13, color: '#4F5B6D' }, pad: { top: 24, bottom: 24, left: 2, right: 2 },
    text: { dir: 'row', align: 'stretch' },
    pieces: [{ key: 'text' }],
    tree: 'text',
    page: { heroInk: 'dark' },
  },
  {
    id: '4c2', name: 'Mosaic II', industries: ['Manufacturing'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the IT Service Desk', sub: 'Raise a ticket, request a service or find the answer yourself — everything Acme IT supports lives here.',
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
      contentAlign: 'left', height: 130, bannerSplit: '3:2', searchWidth: 100,
      bannerBorderWidth: 1, bannerBorderColor: '#E5E7EB', bannerRadius: 8, bannerInset: 16,
    },
    title: { size: 24, color: INK }, subtitle: { size: 13, color: '#4F5B6D' }, pad: { top: 24, bottom: 24, left: 2, right: 2 },
    text: { dir: 'row', align: 'stretch' },
    pieces: [{ key: 'text' }],
    tree: 'text',
    page: { heroInk: 'dark' },
  },
  {
    id: '4d', name: 'Portico', industries: ['Manufacturing'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to Acme IT Service Portal', sub: 'Raise a ticket, request a service or search 412 knowledge articles. Average first response is 22 minutes.',
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
      contentAlign: 'left', height: 420, bannerSplit: '1:1', searchWidth: 100,
    },
    title: { size: 28, color: INK }, subtitle: INK_SUB, pad: { top: 24, bottom: 24, left: 2, right: 2 },
    sectionGap: { x: 24, y: 20 },
    pieces: [image, { key: 'text' }, actions('1')],
    tree: R('img', C('text', 'act')),
    page: { heroInk: 'dark' },
  },
  {
    id: '3j', name: 'Bulletin', industries: ['Government'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome, how can we help you?', sub: "Search 412 knowledge articles and 214 services, or raise a ticket and we'll route it to the right team.",
      searchPlaceholder: 'Describe your issue',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F7F9FC',
      contentAlign: 'left', height: 320, bannerSplit: '3:2', searchWidth: 70,
    },
    title: { size: 38, color: INK }, subtitle: INK_SUB, pad: { top: 32, bottom: 32, left: 4, right: 3 },
    sectionGap: { x: 48, y: 40 },
    text: { alignY: 'stretch', gap: 40 },
    pieces: [{ key: 'text' }, announcements('regular', 'Public Notices')],
    tree: R('text', 'ann'),
    page: { heroInk: 'dark' },
  },
  {
    id: '6a', name: 'Gazette', industries: ['Government'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to the Citizen and Staff Service Portal', sub: 'Apply, track and get help — in one place.',
      searchPlaceholder: 'Search services, forms and reference numbers',
      bgKind: 'color', colorMode: 'gradient', bannerColor: '#1B4FB5', bannerColor2: '#2F6EDD', colorSide: 'bottom',
      contentAlign: 'center', height: 230, searchWidth: 55,
      bannerDecor: { eyebrow: 'dash', eyebrowColor: 'rgba(255,255,255,0.5)' },
    },
    title: WHITE_TITLE, subtitle: { size: 15, color: 'rgba(255,255,255,0.9)' }, pad: { top: 32, bottom: 32, left: 4, right: 4 },
    text: { gap: 24 },
    pieces: [{ key: 'text' }],
    tree: 'text',
  },
  {
    id: '3c', name: 'Counter', industries: ['Government'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome to Support Portal', sub: '',
      searchPlaceholder: 'Search services, articles or a request ID',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#0D1B2E',
      contentAlign: 'left', height: 260, searchWidth: 100,
      bannerDecor: { shape: 'circle', shapeColor: '#F5B342' },
    },
    title: { size: 36, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 32, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 48, y: 28 },
    pieces: [{ key: 'text' }, actions('4', { look: 'glass', firstSolid: true })],
    text: { dir: 'row', align: 'stretch', alignY: 'end' },
    tree: C('text', 'act'),
  },
  {
    id: '7a', name: 'Quadrangle', industries: ['Education'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome, Yash. How can we help you?', sub: 'Every IT, hostel, library and registrar request in one place.',
      searchPlaceholder: 'Search services and knowledge',
      bgKind: 'image', photoSlot: true, overlayOn: true, overlayMode: 'gradient',
      overlayGradient: { type: 'linear', angle: 90, stops: [{ pos: 0, color: 'rgba(20,14,8,0.85)' }, { pos: 100, color: 'rgba(20,14,8,0.1)' }] },
      contentAlign: 'left', height: 300, searchWidth: 45, contentMaxWidth: 55,
    },
    title: { size: 32, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 32, bottom: 32, left: 3, right: 3 },
    text: { gap: 24 },
    pieces: [{ key: 'text' }],
    tree: 'text',
  },
  {
    id: '7b', name: 'Course Shelf', industries: ['Education'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome back, Yash. Pick up where you left off.', sub: '',
      searchPlaceholder: 'Search courses, services and guides',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#3438A5',
      contentAlign: 'left', height: 250, bannerSplit: '3:2', searchWidth: 80,
    },
    title: WHITE_TITLE, subtitle: WHITE_SUB, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 40, y: 20 },
    pieces: [{ key: 'text' }, kpis('2', 'glass', [
      KPI_OPEN, KPI_APPROVALS, { label: 'My tasks', value: '5', hint: '2 due this week' }, { label: 'Attendance', value: '94%', hint: 'this semester' },
    ])],
    tree: R('text', 'kpi'),
  },
  {
    id: '7c', name: 'Study Desk', industries: ['Education'], orientation: 'horizontal',
    hero: {
      heading: 'Your desk, Yash. Everything you left open.', sub: 'Cohort enrolments, certificates and compliance training, plus every request you have with the service desk.',
      searchPlaceholder: 'Search courses and guides',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#F5F0E8',
      contentAlign: 'left', height: 360, searchWidth: 45, contentMaxWidth: 60,
    },
    title: { size: 30, color: '#1F2937' }, subtitle: { size: 13, color: '#6B7280' }, pad: { top: 28, bottom: 28, left: 3, right: 3 },
    sectionGap: { x: 16, y: 20 },
    pieces: [{ key: 'text' }, kpis('4', 'card', [
      KPI_OPEN, KPI_APPROVALS, { label: 'My tasks', value: '5', hint: '2 due this week' }, { label: 'Attendance', value: '94%', hint: 'this semester' },
    ]), announcements('carousel')],
    tree: C('text', R('kpi', 'ann')),
    page: { heroInk: 'dark' },
  },
  {
    id: '8a', name: 'Vault', industries: ['BFSI'], orientation: 'horizontal',
    hero: {
      heading: 'WELCOME TO TECHNOLOGY SUPPORT', sub: 'Trading floor, core banking and access requests — with a full audit trail.',
      searchPlaceholder: 'Search our entire portal for help…',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#0F2C6B',
      contentAlign: 'left', height: 340, bannerSplit: '1:1', searchWidth: 70,
      bannerDecor: { pattern: 'grid', patternColor: 'rgba(255,255,255,0.06)', shape: 'bars', shapeColor: '#3D6FD8' },
    },
    title: { size: 30, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 24, bottom: 24, left: 3, right: 3 },
    sectionGap: { x: 32, y: 20 },
    pieces: [{ key: 'text' }, image],
    tree: R('text', 'img'),
  },
  {
    id: '8b', name: 'Keystone', industries: ['BFSI'], orientation: 'horizontal',
    hero: {
      heading: 'How can we help you today?', sub: 'Search the catalogue and knowledge base for answers to common questions.',
      searchPlaceholder: 'Search…',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#1E3A5F',
      contentAlign: 'left', height: 300, bannerSplit: '1:1', searchWidth: 90,
    },
    title: { size: 34, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 28, bottom: 28, left: 3, right: 0 },
    sectionGap: { x: 32, y: 24 },
    pieces: [{ key: 'text' }, announcements('image')],
    tree: R('text', 'ann'),
  },
  {
    id: '4a', name: 'Service Center', industries: ['BFSI'], orientation: 'horizontal',
    hero: {
      heading: 'Welcome, Yash. How can we help you?', sub: 'Every trading floor, core banking and access request in one place.',
      searchPlaceholder: 'Search services, tickets and articles',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#0B2545',
      contentAlign: 'left', height: 280, bannerRadius: 12, bannerInset: 16, bannerSplit: '1:1', searchWidth: 90,
    },
    title: { size: 28, color: '#FFFFFF' }, subtitle: WHITE_SUB, pad: { top: 24, bottom: 24, left: 3, right: 2 },
    sectionGap: { x: 24, y: 20 },
    pieces: [{ key: 'text' }, announcements('image')],
    tree: R('text', 'ann'),
  },

  /* ═════ Vertical — a column beside the page ═════ */
  {
    id: '4f', name: 'Front Desk', industries: ['IT & ITES', 'Healthcare', 'Government', 'BFSI'], orientation: 'vertical',
    hero: {
      heading: 'Welcome. How can we help you?', sub: 'Report a fault, request a service, or reset your account. No appointment needed.',
      searchPlaceholder: 'Search services and articles',
      bgKind: 'color', colorMode: 'solid', bannerColor: '#16233A',
      contentAlign: 'left', contentMaxWidth: 100, searchWidth: 100, searchRadius: 6, height: 560,
      bannerDecor: { shape: 'rings', shapeColor: '#FFFFFF' },
    },
    title: { size: 22, color: '#FFFFFF' }, subtitle: { size: 13, color: 'rgba(255,255,255,0.75)' },
    page: { heroPlacement: 'left', heroWidth: 320, quickLook: 'rail', heroSticky: true },
  },
  {
    id: '4f2', name: 'Counter · Image', industries: ['IT & ITES'], orientation: 'vertical',
    hero: {
      heading: 'Welcome. How can we help you?', sub: 'Report a fault, request a service, or reset your account. No appointment needed.',
      searchPlaceholder: 'Search services and articles',
      bgKind: 'image', photoSlot: true, overlayOn: true, overlayMode: 'gradient',
      overlayGradient: { type: 'linear', angle: 180, stops: [{ pos: 0, color: 'rgba(22,35,58,0.95)' }, { pos: 100, color: 'rgba(22,35,58,0.35)' }] },
      contentAlign: 'left', contentMaxWidth: 100, searchWidth: 100, searchRadius: 6, height: 560,
    },
    title: { size: 22, color: '#FFFFFF' }, subtitle: { size: 13, color: 'rgba(255,255,255,0.8)' },
    page: { heroPlacement: 'left', heroWidth: 320, quickLook: 'rail', heroSticky: true },
  },
  {
    id: '4g', name: 'Half Deck', industries: ['IT & ITES', 'Government', 'BFSI'], orientation: 'vertical',
    hero: {
      heading: 'Welcome, how can we help you?', sub: 'Report a fault, request a service or reset your account.',
      searchPlaceholder: 'Search services, articles and requests',
      bgKind: 'color', colorMode: 'gradient', bannerColor: '#132A4C', bannerColor2: '#1D3A63', colorSide: 'top',
      contentAlign: 'left', contentMaxWidth: 100, searchWidth: 100, searchRadius: 6, height: 560,
    },
    title: { size: 30, color: '#FFFFFF' }, subtitle: { size: 14, color: 'rgba(255,255,255,0.75)' },
    page: { heroPlacement: 'left', heroWidth: 520, quickLook: 'rail', heroSticky: true },
  },
  {
    id: '4e', name: 'Atrium', industries: ['Education'], orientation: 'vertical',
    hero: {
      heading: 'Welcome to Ashgrove University, how can we help you?', sub: 'Solutions, templates, announcements and requests in one place.',
      searchPlaceholder: 'Search for solutions, templates and requests',
      bgKind: 'image', photoSlot: true, overlayOn: true, overlayMode: 'gradient',
      overlayGradient: { type: 'linear', angle: 180, stops: [{ pos: 0, color: 'rgba(15,23,42,0.15)' }, { pos: 100, color: 'rgba(15,23,42,0.9)' }] },
      contentAlign: 'left', contentMaxWidth: 100, searchWidth: 100, searchRadius: 6, height: 560,
    },
    title: { size: 24, color: '#FFFFFF' }, subtitle: { size: 13, color: 'rgba(255,255,255,0.8)' },
    page: { heroPlacement: 'left', heroWidth: 440, quickLook: 'rail', heroSticky: true },
  },
];

export const bannerTemplate = (id: string | undefined) => BANNER_TEMPLATES.find((t) => t.id === id);
/* ── Starting from scratch ─────────────────────────────────────────────────────────────────── */

export const SCRATCH_BANNER_ID = 'scratch';

/** The blank start: a plain white band carrying the page's own heading, sub-heading and search, and
 *  nothing else — the banner an admin designs from the panel rather than picks off a shelf.
 *
 * ⚠️ It is a TEMPLATE, not a set of writes of its own, so it lands through `instantiateBanner` like
 * every other banner. A second applier is how the scratch banner ends up with, say, the template
 * path's search hairline and none of its key-wiping — and the banner nobody picked off a tile is
 * the one where a stale key from the previous banner would be hardest to explain.
 * ⚠️ Its id is deliberately not in `BANNER_TEMPLATES`, so `bannerTemplate(id)` finds nothing and the
 * Banners panel shows no tile as active: this page is not showing any of them.
 * ⚠️ No `heading`/`sub`. Leaving them unset falls through to the page's own content, which is what
 * makes "a title, a sub-heading and a search, and nothing else" true rather than three strings
 * copied into a second place.
 * ⚠️ `heroInk: 'dark'` travels with the white: a pale band with the default white heading is an
 * invisible heading. The search's hairline is added by `instantiateBanner` itself, from the colour,
 * so a white field on a white banner is not a field nobody can find. */
export const scratchBanner = (orientation: 'horizontal' | 'vertical'): BannerTemplate => ({
  id: SCRATCH_BANNER_ID,
  name: 'Start from scratch',
  industries: [],
  orientation,
  hero: {
    bgKind: 'color', colorMode: 'solid', bannerColor: '#FFFFFF',
    showSearch: true,
    /* A vertical banner is the page's own column, so it is as tall as the screen by default — the
       same "Screen" stop the Height rail offers, stored as the word because it is measured. */
    height: orientation === 'vertical' ? 'screen' : 260,
    contentAlign: 'left',
  },
  title: { size: 28, color: INK },
  subtitle: INK_SUB,
  page: orientation === 'vertical'
    ? { heroInk: 'dark', heroPlacement: 'left', heroWidth: 420, heroSticky: true }
    : { heroInk: 'dark' },
});


/* ── Applying ─────────────────────────────────────────────────────────────────────────────── */

/** Every hero key a template can set, so applying one CLEARS what the previous banner wrote
 *  instead of merging into it — a banner nobody picked is what a merge produces. */
export const TEMPLATE_HERO_KEYS = [
  'heading', 'sub', 'note', 'searchPlaceholder', 'showSearch', 'searchPlacement', 'searchWidth', 'searchRadius',
  'bgKind', 'bannerStyle', 'colorMode', 'bannerColor', 'bannerColor2', 'colorSide', 'bannerImage', 'bannerCrop',
  'overlayOn', 'overlayMode', 'overlayColor', 'overlayGradient', 'overlaySide', 'overlayFrom', 'overlayTo',
  'headingColor', 'contentAlign', 'contentAlignY', 'contentMaxWidth', 'height', 'fullBleed', 'bgWholePage',
  'bannerRadius', 'bannerBorderWidth', 'bannerBorderColor', 'bannerBorderStyle', 'bannerInset',
  'bannerTree', 'bannerSplit', 'bannerLayout', 'bannerShape', 'bannerDecor', 'bannerTemplate', 'bannerBleed', 'photoSlot',
  'sectionGapX', 'sectionGapY',
];

/** Page keys a vertical banner sets — cleared by every horizontal one. */
export const TEMPLATE_PAGE_KEYS = ['heroPlacement', 'heroWidth', 'heroSticky', 'quickLook', 'heroInk', 'heroArt'];

/** The node ids whose style a template owns. */
export const TEMPLATE_STYLE_IDS = ['hero', 'hero-title', 'hero-subtitle', 'hero-search', 'hero-copy', 'hero-content'];

export interface AppliedBanner {
  hero: Record<string, unknown>;
  content: Record<string, unknown>;
  page: Record<string, unknown>;
  styles: Record<string, NodeStyle>;
  widgets: { id: string; type: string; name: string; cfg: Record<string, unknown> }[];
}

/** Turns a template into the writes the builder makes. Widget ids are minted ONCE here, so the tree
 *  and the widget configs name the same elements. */
export function instantiateBanner(t: BannerTemplate, stamp: number): AppliedBanner {
  const idOf: Record<string, string> = { text: 'hero-content' };
  const widgets = (t.pieces ?? []).filter((p) => p.type).map((p, i) => {
    const id = `hero-t${stamp}-${i}`;
    idOf[p.key] = id;
    return { id, type: p.type!, name: PORTAL_ELEMENTS.find((e) => e.id === p.type)?.name ?? p.type!, cfg: { ...(p.cfg ?? {}) } };
  });
  const toTree = (s: Shape): BannerNode => (typeof s === 'string' ? idOf[s] ?? s : { d: s.d, c: s.c.map(toTree) });

  const hero: Record<string, unknown> = {};
  TEMPLATE_HERO_KEYS.forEach((k) => { hero[k] = undefined; });
  Object.assign(hero, t.hero, { bannerTemplate: t.id, showSearch: true });
  if (t.tree) hero.bannerTree = toTree(t.tree);
  if (t.sectionGap?.x !== undefined) hero.sectionGapX = t.sectionGap.x;
  if (t.sectionGap?.y !== undefined) hero.sectionGapY = t.sectionGap.y;
  if (t.title) hero.headingColor = t.title.color;

  const page: Record<string, unknown> = {};
  TEMPLATE_PAGE_KEYS.forEach((k) => { page[k] = undefined; });
  Object.assign(page, t.page ?? {});

  const styles: Record<string, NodeStyle> = {};
  TEMPLATE_STYLE_IDS.forEach((id) => { styles[id] = {}; });
  if (t.title) styles['hero-title'] = { fontSize: t.title.size, bold: true, color: t.title.color };
  if (t.subtitle) styles['hero-subtitle'] = { fontSize: t.subtitle.size, color: t.subtitle.color };
  /* Big display headings read as one block only with a tight line height; the theme's 1.5 spreads two lines apart. */
  styles.hero = { type: { title: { lineHeight: 'tight' } } } as NodeStyle;
  if (t.pad) styles.hero = { ...styles.hero, padding: { top: t.pad.top, bottom: t.pad.bottom, left: t.pad.left, right: t.pad.right } } as NodeStyle;
  /* A white search on a near-white banner is a field nobody can find — it gets a hairline border there. */
  const hex = /^#([0-9a-f]{6})$/i.exec(String(t.hero.bannerColor ?? ''));
  const lum = hex ? (((parseInt(hex[1], 16) >> 16) * 0.299) + (((parseInt(hex[1], 16) >> 8) & 255) * 0.587) + ((parseInt(hex[1], 16) & 255) * 0.114)) / 255 : 0;
  if (t.hero.bgKind === 'color' && lum > 0.94) styles['hero-search'] = { borderWidth: 1, borderColor: '#D9E0EA', borderStyle: 'solid' } as NodeStyle;
  Object.entries(t.styles ?? {}).forEach(([k, s]) => { styles[idOf[k] ?? k] = { ...(styles[idOf[k] ?? k] ?? {}), ...s }; });

  return { hero, content: { ...(t.text ?? {}) }, page, styles, widgets };
}
