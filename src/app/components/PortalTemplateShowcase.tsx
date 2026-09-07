import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { SupportPortalPreview } from './SupportPortalPreview';
import { CanvasProvider, READONLY_CANVAS } from './PortalCanvas';
import { DEFAULT_THEME, buttonOf, faceOf, swatchesOf } from './PortalThemePanel';
import { PORTAL_EMPTY_WIDGETS, VISIBLE_TEMPLATES } from './supportPortalData';
import type { PortalTemplate } from './supportPortalData';
import { DEFAULT_BLOCK_ORDER, DEFAULT_CONTENT, DEFAULT_ROW_ORDER } from './portalPageModel';
import type { PortalPageContent, PortalStyles } from './portalPageModel';
import { WIDGET_FOR_NODE, specById, structureSpecId } from './portalWidgetSpec';

/* Every portal template, rendered as the page it actually produces — one URL, scrolled.
 *
 * ⚠️ The gallery inside the builder shows WIREFRAMES (`TemplateArt`), which is right for a picker:
 * a thumbnail has to be readable at 180px and comparable at a glance. It is the wrong thing for
 * REVIEW, because a sketch cannot be wrong — you cannot see from it that a card's subtitle wrapped,
 * that two bands disagree about their padding, or that a heading went white on a white fill. This
 * page renders the real thing instead, so a design decision can be argued about from the design.
 *
 * ⚠️ SEEDS, NOT A SECOND RENDERER — the same rule `TemplateSeed` states. This file owns no layout
 * of its own: it reproduces the builder's `useState` INITIALISERS (the seed → page mapping, which
 * is self-contained and has no dependency on live edit state) and hands the result to the one
 * `SupportPortalPreview` every other surface uses. A showcase with its own rendering path would
 * drift from the builder the first time a widget changed, and would then be showing designs that
 * nobody can actually get. */

/* ── the seed → page mapping ──────────────────────────────────────────────
 *
 * Mirrors `SupportPortalBuilder`'s initialisers. Each ⚠️ below marks a rule that is load-bearing
 * there and would silently produce a WRONG-BUT-PLAUSIBLE page here if it were dropped — which is
 * the failure this page exists to catch, so it must not be the failure this page ships. */

const LINK_CARD_ID = 'quick-link';

/** Strips a child text node's suffix, so its value reads off the OWNER's config. Same regex the
 *  builder uses; the collection-item half is absent because no template seeds one. */
const ownerOf = (id: string) =>
  id.replace(/-(title|sub|label|viewall|icon|search|caption|cl\d+|cv\d+)$/, '');

/** The widget spec behind a fixed page block — the source of a node's config DEFAULTS. */
const specFor = (id: string) => {
  const direct = WIDGET_FOR_NODE[id];
  if (direct) return specById(direct);
  const structure = structureSpecId(id);
  return structure ? specById(structure) : undefined;
};

interface TemplatePage {
  content: PortalPageContent;
  blockOrder: string[];
  rowOrder: Record<string, string[]>;
  rail?: string[];
  styles: PortalStyles;
  cfg: (id: string) => Record<string, unknown>;
}

function templatePage(tpl: PortalTemplate): TemplatePage {
  const seed = tpl.seed;
  /* ⚠️ A rail is a SHAPE, not a list of cards. A seed that names one gets the main-region-beside-a
     -tall-rail layout and the one-column records row that goes with it; without this the rail's
     cards render as three more cards in a flat row, which is a different page carrying the same
     widgets. */
  const railShape = !!seed?.rail;

  const blockOrder = seed?.blockOrder ?? DEFAULT_BLOCK_ORDER;
  /* ⚠️ MERGED over the defaults, never replaced. A seed names only the rows it rearranges, and
     `rowOf` still consults the others even when their band is not on the page. */
  const rowOrder = seed?.rowOrder ? { ...DEFAULT_ROW_ORDER, ...seed.rowOrder } : DEFAULT_ROW_ORDER;

  const base: PortalPageContent = railShape
    ? { ...DEFAULT_CONTENT, cols: { ...DEFAULT_CONTENT.cols, records: 1 } }
    : DEFAULT_CONTENT;
  /* ⚠️ `quick-link` is deliberately absent from `DEFAULT_CONTENT`, so a seed that lists it in
     `rowOrder.quick` would otherwise lose the card entirely — `quickCards` drops any id with no
     matching `content.quick` entry, and the row would render one tile short of its promise. */
  const content: PortalPageContent =
    seed?.rowOrder?.quick?.includes(LINK_CARD_ID) && !base.quick.some((q) => q.id === LINK_CARD_ID)
      ? { ...base, quick: [...base.quick, { id: LINK_CARD_ID, title: 'External link', desc: 'Where this link goes' }] }
      : base;

  /* Per-node seeds the shared specs cannot express — the bands' own column counts. */
  const nodeSeed: Record<string, Record<string, unknown>> = {
    quick: { cols: '4', hasCards: true },
    work: { cols: '3' },
    records: { cols: railShape ? '1' : '2' },
  };

  const widgetCfg = (seed?.cfg ?? {}) as Record<string, Record<string, unknown>>;

  const cfg = (id: string): Record<string, unknown> => {
    const owner = ownerOf(id);
    return {
      ...(specFor(owner)?.defaults ?? {}),
      ...(nodeSeed[owner] ?? {}),
      /* ⚠️ The ROW's card template, so a card whose own picker has said nothing still wears the
         shape the row chose. Spread BEFORE the seed's own entry, which must still win. */
      ...(/^quick-/.test(owner) ? { cardTemplate: widgetCfg.quick?.cardTemplate ?? 'left' } : {}),
      __noData: PORTAL_EMPTY_WIDGETS.has(owner),
      ...(owner === 'quick'
        ? { __quickRow: true, __hasLink: content.quick.some((q) => q.id === LINK_CARD_ID) }
        : {}),
      ...(widgetCfg[owner] ?? {}),
    };
  };

  return { content, blockOrder, rowOrder, rail: seed?.rail, styles: (seed?.styles ?? {}) as PortalStyles, cfg };
}

/* ── the page ─────────────────────────────────────────────────────────────── */

/* The DEFAULT tile is not in `PORTAL_TEMPLATES` — it is the portal that already exists, rendered
 * from the live page — so it is described here and carries no seed, which is exactly what makes it
 * render the default arrangement. Same reason the gallery lists it first in every category. */
const DEFAULT_TEMPLATE: PortalTemplate = {
  id: 'tpl-default',
  name: 'Default',
  desc: 'The portal every new tenant starts on — hero search, the four action cards straddling the banner, then the requester’s own work.',
  category: 'IT Support',
  layout: 'portal',
  accent: '#3D8BD0',
  badge: 'Current',
  blocks: ['Hero search', 'Quick actions', 'Favourite Services', 'My Open Requests', 'Pending Approvals', 'Most Read', 'My Assets', 'My CIs'],
};

export function PortalTemplateShowcase({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const templates = [DEFAULT_TEMPLATE, ...VISIBLE_TEMPLATES()];

  /* Which template the reader is looking at, so the jump row can say so. A scroll-spy rather than a
     click-only highlight: the row is worth nothing if it goes stale the moment you scroll past the
     section you clicked. Same pattern `IncidentDetailsTabV2` uses. */
  const [active, setActive] = useState(templates[0].id);
  useEffect(() => {
    const onScroll = () => {
      let current = templates[0].id;
      for (const t of templates) {
        const el = document.getElementById(t.id);
        // 140px clears the sticky header, so a section counts as current once it reaches it.
        if (el && el.getBoundingClientRect().top <= 140) current = t.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const theme = DEFAULT_THEME;
  const sw = swatchesOf(theme);
  /* The theme paints through ONE wrapper — font, page colour and the accent as CSS variables, so a
     themed block needs nothing re-read. Copied from the builder's canvas so the frame below renders
     a template exactly as the builder does. */
  const themeWrap = {
    backgroundColor: sw[0],
    color: sw[4],
    '--portal-heading': faceOf(theme, 'heading').css,
    '--portal-accent': sw[3],
    '--portal-btn-radius': `${buttonOf(theme).radius}px`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* ── head ── sticky, because the jump row is the only navigation this page has ── */}
      <div className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('request')}
              title="Back to Requests"
              className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            ><ArrowLeft size={18} /></button>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold leading-tight text-[#364658]">Portal templates</h1>
              <p className="mt-0.5 text-[13px] text-[#7B8FA5]">
                Every starting point a Support Portal can be built from, rendered as the real page — not a thumbnail.
                <span className="mx-1.5 text-[#CBD5E1]">·</span>
                {templates.length} designs
              </p>
            </div>
            <a
              href="#/admin/support-portal"
              className="ml-auto inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >Open the builder <ExternalLink size={13} /></a>
          </div>

          {/* Jump row. Scroll anchors, not tabs — everything is on one page and stays reachable. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {templates.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`inline-flex h-7 items-center rounded px-2.5 text-[12px] font-medium transition-colors ${
                  active === t.id
                    ? 'bg-[#e8f4fd] text-[#3D8BD0]'
                    : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >{t.name}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── the designs ── */}
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {templates.map((tpl) => {
          const page = templatePage(tpl);
          return (
            /* ⚠️ `scroll-mt` clears the sticky head, or a jump lands the section title underneath it. */
            <section key={tpl.id} id={tpl.id} className="mb-8 scroll-mt-[124px]">
              {/* Caption above the frame — what this template is, before you look at it. */}
              <div className="mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#364658]">{tpl.name}</h2>
                  <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{tpl.category}</span>
                  {tpl.badge && (
                    <span className="rounded-sm bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{tpl.badge}</span>
                  )}
                </div>
                <p className="mt-1 max-w-[110ch] text-[13px] leading-relaxed text-[#7B8FA5]">{tpl.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {tpl.blocks.map((b) => (
                    <span key={b} className="rounded-sm border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[11px] text-[#64748B]">{b}</span>
                  ))}
                </div>
              </div>

              {/* The frame. `overflow-hidden` on a rounded border so the portal's own top bar is
                  clipped to the corner rather than squaring it off. */}
              <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
                <div className={`portal-themed ${theme.mode === 'dark' ? 'portal-dark' : ''}`} style={themeWrap}>
                  {/* ⚠️ A CONTEXT, not just props: the preview reads per-node STYLE off the canvas,
                      so a template's seeded `columns`, fills and radii resolve to nothing without
                      one. `enabled: false` is what makes it behave like the real portal — no
                      selection outlines, no seams, no adders. */}
                  <CanvasProvider value={{ ...READONLY_CANVAS, styles: page.styles, theme }}>
                    <SupportPortalPreview
                      accent={sw[3]}
                      content={page.content}
                      blockOrder={page.blockOrder}
                      rowOrder={page.rowOrder}
                      rail={page.rail}
                      cfg={page.cfg}
                    />
                  </CanvasProvider>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
