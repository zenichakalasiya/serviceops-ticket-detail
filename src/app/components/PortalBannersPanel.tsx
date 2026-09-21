/* Support Portal builder — the BANNERS rail panel.
 *
 * Every banner from the layout-templates gallery, rebuilt with this editor (see
 * `portalBannerTemplates.ts`), offered as one-click choices under two tabs — Horizontal (a band across
 * the top) and Vertical (a column beside the page).
 *
 * ⚠️ A pick replaces the BANNER only. Everything below it stays exactly as it was, and the first tile
 * of the Horizontal tab is always "Default" — the banner this page opened with — so there is always a
 * way back without resetting the whole page.
 *
 * ⚠️ Each thumbnail is DRAWN FROM THE TEMPLATE'S OWN DATA (its colours, its design details, its tree of
 * pieces), not a screenshot, so a tile can never promise a banner the template does not build. */

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { bannerGradientOf, gradientCss } from './PortalBannerTools';
import { BANNER_TEMPLATES, visibleBannerTemplates } from './portalBannerTemplates';
import { BANNER_SHOT_RATIO } from './bannerShots';
import type { BannerDecor, BannerPiece, BannerTemplate } from './portalBannerTemplates';

type Orientation = 'horizontal' | 'vertical';

/* ── The miniature ─────────────────────────────────────────────────────────────────────────── */

/** Rough lightness of a hex or rgba colour, 0–1. Enough to choose light or dark ink for a thumbnail. */
function lightness(c: string): number {
  const hex = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
  }
  const rgb = /rgba?\(([^)]+)\)/.exec(c);
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((x) => parseFloat(x));
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  }
  return 0.3;
}

function bandCss(t: BannerTemplate | null): CSSProperties {
  if (!t) return { backgroundImage: 'linear-gradient(135deg, #3D8BD0 0%, #050B18 100%)' };
  const h = t.hero;
  if (h.bgKind === 'image') {
    return { backgroundColor: '#3B4658', backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 8px)' };
  }
  if (h.colorMode === 'gradient') {
    return { backgroundImage: gradientCss(bannerGradientOf(h)) };
  }
  return { backgroundColor: String(h.bannerColor ?? '#3D8BD0') };
}

const isDark = (t: BannerTemplate | null) =>
  !t || t.hero.bgKind === 'image' || lightness(String(t.hero.bannerColor ?? '#000000')) < 0.55;

/** One piece of a banner, drawn as the shape it makes. */
function PieceSkeleton({ piece, dark, center, textDir }: { piece: BannerPiece | undefined; dark: boolean; center?: boolean; textDir?: string }) {
  const ink = dark ? 'bg-white/85' : 'bg-[#1E293B]/70';
  const soft = dark ? 'bg-white/40' : 'bg-[#64748B]/35';
  const card = dark ? 'bg-white/15' : 'bg-white shadow-[0_0_0_0.5px_rgba(15,23,42,0.12)]';
  const key = piece?.key;
  /* The Text & Search section: the words and the search, stacked or side by side. */
  if (key === 'text') {
    return (
      <span className={`flex min-w-0 flex-1 gap-[4px] ${textDir === 'row' ? 'flex-row items-center' : 'flex-col justify-center'}`}>
        <PieceSkeleton piece={{ key: 'copy' }} dark={dark} center={center} />
        <PieceSkeleton piece={{ key: 'search' }} dark={dark} center={center} />
      </span>
    );
  }
  if (!piece || key === 'copy') {
    return (
      <span className={`flex min-w-0 flex-1 flex-col justify-center gap-[3px] ${center ? 'items-center' : ''}`}>
        <span className={`h-[4px] w-[78%] rounded-full ${ink}`} />
        <span className={`h-[2px] w-[52%] rounded-full ${soft}`} />
      </span>
    );
  }
  if (key === 'search') {
    return (
      <span className={`flex min-w-0 flex-1 items-center ${center ? 'justify-center' : ''}`}>
        <span className="h-[6px] w-full max-w-[90%] rounded-[2px] bg-white shadow-[0_0_0_0.5px_rgba(15,23,42,0.15)]" />
      </span>
    );
  }
  const cfg = piece.cfg ?? {};
  switch (piece.type) {
    case 'x-actions': {
      const cols = Math.max(1, Math.min(4, Number(cfg.cols ?? 1)));
      const glass = cfg.look === 'glass';
      if (cfg.look === 'row') {
        return (
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex h-[6px] items-center gap-[2px] rounded-[1.5px] border border-[#E2E8F0] bg-white px-[2px]">
                <span className="size-[2.5px] rounded-full bg-[#3D8BD0]" />
                <span className="h-[1.5px] w-[50%] rounded-full bg-[#64748B]" />
              </span>
            ))}
          </span>
        );
      }
      return (
        <span className="grid min-w-0 flex-1 content-center gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`flex h-[7px] items-center gap-[2px] rounded-[1.5px] px-[2px] ${glass && !(cfg.firstSolid && i === 0) ? 'bg-white/15' : card}`}>
              <span className={`size-[3px] rounded-[1px] ${dark && glass ? 'bg-white/70' : 'bg-[#3D8BD0]/60'}`} />
              <span className={`h-[1.5px] flex-1 rounded-full ${dark && glass ? 'bg-white/50' : 'bg-[#94A3B8]'}`} />
            </span>
          ))}
        </span>
      );
    }
    case 'x-kpis': {
      const items = Array.isArray(cfg.items) ? cfg.items.length : 3;
      const cols = Math.max(1, Math.min(4, Number(cfg.cols ?? 3)));
      const glass = cfg.look === 'glass';
      return (
        <span className="grid min-w-0 flex-1 content-center gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: items }, (_, i) => (
            <span key={i} className={`flex h-[11px] flex-col justify-center gap-[1.5px] rounded-[1.5px] px-[2px] ${glass ? 'bg-white/15' : card}`}>
              <span className={`h-[3px] w-[40%] rounded-full ${glass ? 'bg-white/85' : 'bg-[#334155]/70'}`} />
              <span className={`h-[1.5px] w-[70%] rounded-full ${glass ? 'bg-white/45' : 'bg-[#94A3B8]'}`} />
            </span>
          ))}
        </span>
      );
    }
    case 'c-announcements':
      if (cfg.display === 'image') {
        return (
          <span className="flex min-h-[20px] min-w-0 flex-1 flex-col overflow-hidden rounded-[2px] bg-[#CBD5E1]">
            <span className="flex-1" />
            <span className="h-[30%] min-h-[5px] bg-[#2F3033]" />
          </span>
        );
      }
      return (
        <span className={`flex min-w-0 flex-1 flex-col justify-center gap-[2px] rounded-[2px] p-[3px] ${card}`}>
          <span className="h-[2.5px] w-[45%] rounded-full bg-[#334155]/60" />
          <span className="flex items-center gap-[2px]"><span className="size-[5px] rounded-[1px] bg-[#E2E8F0]" /><span className="h-[1.5px] flex-1 rounded-full bg-[#94A3B8]" /></span>
          <span className="flex items-center gap-[2px]"><span className="size-[5px] rounded-[1px] bg-[#E2E8F0]" /><span className="h-[1.5px] flex-1 rounded-full bg-[#94A3B8]" /></span>
        </span>
      );
    case 'c-contact':
      return (
        <span className={`flex min-w-0 flex-1 flex-col justify-center gap-[2px] rounded-[2px] p-[3px] ${card}`}>
          <span className="h-[2.5px] w-[50%] rounded-full bg-[#334155]/60" />
          <span className="h-[1.5px] w-[70%] rounded-full bg-[#94A3B8]" />
          <span className="h-[1.5px] w-[60%] rounded-full bg-[#94A3B8]" />
        </span>
      );
    case 'b-list':
      return (
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
          {[0, 1, 2].map((i) => <span key={i} className={`h-[5px] w-[70%] rounded-[1.5px] ${card}`} />)}
        </span>
      );
    case 'b-button':
      return (
        <span className="flex min-w-0 flex-1 items-center">
          <span className={`h-[6px] w-full rounded-[1.5px] ${cfg.style === 'primary' ? 'bg-[#1E3A8A]' : 'border border-[#94A3B8] bg-white'}`} />
        </span>
      );
    case 'v-image':
      return <span className="min-h-[20px] min-w-0 flex-1 rounded-[2px] bg-[#CBD5E1]" />;
    default:
      return <span className={`min-h-[10px] min-w-0 flex-1 rounded-[2px] ${card}`} />;
  }
}

type Shape = string | { d: 'row' | 'column'; c: Shape[] };

function ShapeSkeleton({ shape, pieces, dark, center, textDir }: { shape: Shape; pieces: BannerPiece[]; dark: boolean; center: boolean; textDir?: string }) {
  if (typeof shape === 'string') return <PieceSkeleton piece={pieces.find((p) => p.key === shape)} dark={dark} center={center} textDir={textDir} />;
  return (
    <span className={`flex min-h-0 min-w-0 flex-1 gap-[4px] ${shape.d === 'row' ? 'flex-row' : 'flex-col justify-center'}`}>
      {shape.c.map((k, i) => <ShapeSkeleton key={i} shape={k} pieces={pieces} dark={dark} center={center} textDir={textDir} />)}
    </span>
  );
}

function DecorMini({ decor }: { decor: BannerDecor }) {
  const tint = decor.patternColor ?? 'rgba(255,255,255,0.08)';
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {decor.pattern === 'grid' && (
        <span className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${tint} 1px, transparent 1px), linear-gradient(90deg, ${tint} 1px, transparent 1px)`, backgroundSize: '7px 7px' }} />
      )}
      {decor.accent && <span className="absolute inset-y-0 left-0 w-[2px]" style={{ background: decor.accent }} />}
      {decor.shape === 'circle' && <span className="absolute size-[22px] rounded-full" style={{ right: '24%', top: -9, background: decor.shapeColor }} />}
      {decor.shape === 'bars' && (
        <span className="absolute bottom-0 left-[4%] flex h-[12px] items-end gap-[2px]">
          {[6, 9, 7, 12, 8].map((h, i) => <span key={i} className="w-[4px]" style={{ height: h, background: decor.shapeColor, opacity: i === 3 ? 0.9 : 0.4 }} />)}
        </span>
      )}
      {decor.shape === 'hazard' && (
        <span className="absolute inset-x-0 bottom-0 h-[2px]" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${decor.shapeColor} 0 3px, transparent 3px 6px)` }} />
      )}
      {decor.shape === 'rings' && (
        <span className="absolute -bottom-3 -right-3 size-[34px] rounded-full border border-white/15" />
      )}
    </span>
  );
}

/* ── The shots ────────────────────────────────────────────────────────────────────────────────
 *
 * The tiles used to be DRAWN from each template's own config, on the rule that a drawing cannot
 * promise a banner the template does not build. The rule was right and the result was a grid of grey
 * bars — the same shapes in different colours on every tile, which is the one thing a picker of
 * banners must not be. These are photographs of the real thing, taken by running the real builder
 * (`scripts/capture-banners.mjs`).
 *
 * ⚠️ They are SNAPSHOTS: edit a template and its picture keeps the old design until someone re-runs
 * that script. Nothing regenerates them automatically.
 * ⚠️ Only the OFFERED templates have one. The seventeen withheld ones are still reachable — a page
 * built on one shows its name and its thumbnail in the banner panel — so the drawing stays as the
 * fallback rather than being deleted. */
const SHOT_DIR = `${import.meta.env.BASE_URL}banner-shots/`;
const shotOf = (id?: string) => (id && BANNER_SHOT_RATIO[id] ? `${SHOT_DIR}${id}.png` : null);

/** The picture, drawn WHOLE — never cropped: the arrangement across a banner is what tells one from
 *  another, and a crop takes that first.
 *  ⚠️ In a box of FIXED height, so the grid stays a grid. Sized to its own proportion the tiles came
 *  out between 46 and 150px tall and every row of three sat on a different baseline; contained in one
 *  box, a wide banner keeps a little ground above and below and a tall one keeps it at the sides. */
function Shot({ id, className = '' }: { id: string; className?: string }) {
  return (
    <span
      className={`block h-[92px] w-full bg-[#EEF2F6] bg-contain bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url("${shotOf(id)}")` }}
    />
  );
}

/** A horizontal banner, in miniature, on a sliver of page ground. */
function HorizontalThumb({ t }: { t: BannerTemplate | null }) {
  const shot = shotOf(t?.id);
  if (shot && t) return <Shot id={t.id} className="overflow-hidden rounded-[5px]" />;
  const dark = isDark(t);
  const center = t ? t.hero.contentAlign === 'center' : true;
  const inset = t && Number(t.hero.bannerInset ?? 0) > 0;
  const decor = (t?.hero.bannerDecor ?? null) as BannerDecor | null;
  return (
    <span className="flex h-[84px] w-full flex-col overflow-hidden rounded-[5px] bg-[#EEF2F6]">
      <span
        className={`relative flex min-h-0 flex-1 overflow-hidden ${inset ? 'm-[4px] rounded-[4px]' : ''} ${t?.hero.bannerBorderWidth ? 'shadow-[0_0_0_0.5px_rgba(15,23,42,0.15)]' : ''}`}
        style={bandCss(t)}
      >
        {decor && <DecorMini decor={decor} />}
        <span className={`relative flex min-h-0 w-full flex-1 p-[7px] ${center ? 'justify-center text-center' : ''}`}>
          {t?.tree
            ? <ShapeSkeleton shape={t.tree} pieces={t.pieces ?? []} dark={dark} center={center} textDir={t.text?.dir} />
            : (
              <span className="flex w-full flex-col items-center justify-center gap-[4px]">
                <PieceSkeleton piece={{ key: 'copy' }} dark center />
                <span className="flex w-[70%] justify-center"><PieceSkeleton piece={{ key: 'search' }} dark center /></span>
              </span>
            )}
        </span>
      </span>
      {/* ⚠️ NO page strip under the band. Three faint rows of "the page below" said the same thing on
          all twenty-five tiles — every horizontal banner has a page under it — so it was a sixth of
          each tile spent on the one fact they share, and at this size it read as clutter rather than
          as context. The band now fills the tile, which is what you are choosing. The VERTICAL thumb
          keeps its page area: there it is what shows the banner is a column beside the page. */}
    </span>
  );
}

/** A vertical banner: a column beside the page. */
function VerticalThumb({ t }: { t: BannerTemplate }) {
  const w = Math.round(Math.min(55, Math.max(28, (Number(t.page?.heroWidth ?? 380) / 1000) * 100)));
  const decor = (t.hero.bannerDecor ?? null) as BannerDecor | null;
  /* ⚠️ The shot is the COLUMN only — that is what the banner is — so the tile keeps a minimal page
     beside it. Without it a vertical tile is a coloured rectangle, and the one thing it has to say is
     that the banner stands beside the page rather than across the top of it. */
  const shot = shotOf(t.id);
  if (shot) {
    return (
      <span className="flex h-[120px] w-full overflow-hidden rounded-[5px] bg-[#EEF2F6]">
        {/* ⚠️ The column is as wide as the SHOT is — its own proportion, not the `heroWidth` guess the
            drawing used — so the tile shows the real share of the page the banner takes. */}
        <span
          className="h-full flex-none bg-cover bg-top"
          style={{ width: Math.round(120 * (BANNER_SHOT_RATIO[t.id] ?? 0.45)), backgroundImage: `url("${shot}")` }}
        />
        <span className="grid flex-1 grid-cols-2 content-start gap-[3px] p-[5px]">
          {[16, 16, 22, 22, 14, 14].map((h, i) => <span key={i} className="rounded-[2px] bg-white" style={{ height: h }} />)}
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-[120px] w-full overflow-hidden rounded-[5px] bg-[#EEF2F6]">
      <span className="relative flex flex-none flex-col justify-between overflow-hidden p-[7px]" style={{ width: `${w}%`, ...bandCss(t) }}>
        {decor && <DecorMini decor={decor} />}
        <span className="relative flex flex-col gap-[5px]">
          <PieceSkeleton piece={{ key: 'copy' }} dark />
          <PieceSkeleton piece={{ key: 'search' }} dark />
        </span>
        <span className="relative flex flex-col gap-[2px]">
          {[0, 1, 2].map((i) => <span key={i} className="h-[6px] rounded-[1.5px] bg-white/15" />)}
        </span>
      </span>
      <span className="grid flex-1 grid-cols-2 content-start gap-[3px] p-[5px]">
        {[16, 16, 22, 22, 14, 14].map((h, i) => <span key={i} className="rounded-[2px] bg-white" style={{ height: h }} />)}
      </span>
    </span>
  );
}

/* ── Shared with the add-a-banner dialog ──────────────────────────────────────────────────────
 *
 * ⚠️ Exported so the dialog that opens when a banner is ADDED draws its tiles with these, not with
 * a second set of its own. Two pickers for one set of banners is two places for a thumbnail to stop
 * matching the banner it promises — the fault this file's header exists to prevent. */

/** A template's thumbnail, in whichever shape its orientation makes. `null` is the product default. */
export function BannerThumb({ t }: { t: BannerTemplate | null }) {
  return t?.orientation === 'vertical' ? <VerticalThumb t={t} /> : <HorizontalThumb t={t} />;
}

/** The scratch start, drawn as what it is: a white band with a heading, a sub-heading and a search.
 *  ⚠️ Same two shapes the real thumbnails use, so "start from scratch" reads as one more banner on
 *  the shelf rather than as an escape hatch beside them. */
export function BannerScratchThumb({ orientation }: { orientation: Orientation }) {
  const id = orientation === 'vertical' ? 'scratch-v' : 'scratch-h';
  if (shotOf(id)) {
    return orientation === 'vertical' ? (
      <span className="flex h-[120px] w-full overflow-hidden rounded-[5px] bg-[#EEF2F6]">
        <span className="h-full flex-none bg-cover bg-top" style={{ width: Math.round(120 * (BANNER_SHOT_RATIO[id] ?? 0.45)), backgroundImage: `url("${shotOf(id)}")` }} />
        <span className="grid flex-1 grid-cols-2 content-start gap-[3px] p-[5px]">
          {[16, 16, 22, 22, 14, 14].map((h, i) => <span key={i} className="rounded-[2px] bg-white" style={{ height: h }} />)}
        </span>
      </span>
    ) : (
      <Shot id={id} className="overflow-hidden rounded-[5px] border border-[#EEF2F6]" />
    );
  }
  const words = (
    <>
      <PieceSkeleton piece={{ key: 'copy' }} dark={false} />
      <PieceSkeleton piece={{ key: 'search' }} dark={false} />
    </>
  );
  if (orientation === 'vertical') {
    return (
      <span className="flex h-[120px] w-full overflow-hidden rounded-[5px] bg-[#EEF2F6]">
        <span className="flex w-[42%] flex-none flex-col gap-[5px] bg-white p-[7px] shadow-[0_0_0_0.5px_rgba(15,23,42,0.10)]">{words}</span>
        <span className="grid flex-1 grid-cols-2 content-start gap-[3px] p-[5px]">
          {[16, 16, 22, 22, 14, 14].map((h, i) => <span key={i} className="rounded-[2px] bg-white" style={{ height: h }} />)}
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-[84px] w-full flex-col overflow-hidden rounded-[5px] bg-[#EEF2F6]">
      {/* No page strip, for the reason the horizontal thumb gives: the tile is the banner. */}
      <span className="flex min-h-0 flex-1 flex-col justify-center gap-[5px] bg-white p-[7px] shadow-[0_0_0_0.5px_rgba(15,23,42,0.10)]">{words}</span>
    </span>
  );
}



/* ── The panel ─────────────────────────────────────────────────────────────────────────────── */

/* ⚠️ The NAME only. The industries told twenty-five tiles apart while the grid was twenty-five long;
   at eight they were a grey line under every picture saying something you are not choosing on. They
   stay on the tooltip, so nothing is lost for anyone who wants them. */
function Tile({ active, label, sub, onPick, children }: { active: boolean; label: string; sub?: string; onPick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      title={`${label}${sub ? ` — ${sub}` : ''}`}
      className={`group relative flex min-w-0 flex-col gap-1.5 rounded-lg border-2 bg-white p-1.5 text-left transition-colors ${active ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
    >
      {children}
      <span className="min-w-0 px-0.5 pb-0.5">
        <span className={`block truncate text-[12px] font-medium ${active ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{label}</span>
      </span>
      {active && (
        <span className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-[#3D8BD0] text-white"><Check size={10} strokeWidth={3} /></span>
      )}
    </button>
  );
}

export function PortalBannersPanel({ activeId, onApply, onDefault }: {
  /** The applied template's id, or null while the page shows its default banner. */
  activeId: string | null;
  onApply: (id: string) => void;
  onDefault: () => void;
}) {
  const activeTemplate = BANNER_TEMPLATES.find((t) => t.id === activeId);
  const [tab, setTab] = useState<Orientation>(activeTemplate?.orientation ?? 'horizontal');

  /* ⚠️ The SAME shelf the add/change dialog offers — `visibleBannerTemplates`, not the whole array.
     Two surfaces holding different stock is how an admin finds a banner in one place and cannot find
     it in the other. */
  const list = useMemo(() => visibleBannerTemplates(tab), [tab]);
  const count = (o: Orientation) => visibleBannerTemplates(o).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-none gap-2.5 border-b border-[#E5E7EB] px-4">
        {(['horizontal', 'vertical'] as Orientation[]).map((o) => (
          <button
            key={o}
            type="button"
            data-banner-tab={o}
            onClick={() => setTab(o)}
            className={`-mb-px border-b-2 px-2 py-2.5 text-[13px] transition-colors ${tab === o ? 'border-[#3D8BD0] font-medium text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
          >
            {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
            <span className="ml-1.5 text-[11px] text-[#9AA5B4]">{count(o) + (o === 'horizontal' ? 1 : 0)}</span>
          </button>
        ))}
      </div>

      {/* ⚠️ No industry filter — see the note in the add/change dialog. Both shelves hold the same
          eight, and both are short enough to read. */}

      {tab === 'vertical' && (
        <p className="flex-none px-4 pb-2 text-[11.5px] leading-[1.5] text-[#7B8FA5]">
          A vertical banner is a column beside the page — the sections below move into the space next to it.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          {tab === 'horizontal' && (
            <Tile active={!activeId} label="Default" sub="The banner this page opened with" onPick={onDefault}>
              <HorizontalThumb t={null} />
            </Tile>
          )}
          {list.map((t) => (
            <Tile key={t.id} active={activeId === t.id} label={t.name} sub={t.industries.join(', ')} onPick={() => onApply(t.id)}>
              {t.orientation === 'vertical' ? <VerticalThumb t={t} /> : <HorizontalThumb t={t} />}
            </Tile>
          ))}
        </div>

      </div>
    </div>
  );
}

/* The banner a page is on RIGHT NOW, small enough for a panel row.
 *
 * ⚠️ The real thumbnail, SCALED — not a simplified second drawing. Every tile in this builder is
 * drawn from the data it applies so it cannot promise a banner you do not get, and a hand-made
 * miniature would be exactly the kind of picture that drifts from the five it sits beside.
 * ⚠️ A fixed outer box with the real thumb scaled inside it: the horizontal thumb is 84px tall and
 * the vertical one 120, and a row that changed height with the shape of the banner would make the
 * panel jump the moment somebody switched. */
export function BannerMiniPreview({ id, vertical }: { id: string; vertical: boolean }) {
  const t = BANNER_TEMPLATES.find((x) => x.id === id) ?? null;
  /* ⚠️ 92, the height `Shot` draws at — not the 84 the old drawing used. A box sized to the wrong
     number crops the picture it was meant to frame. */
  const H = vertical ? 120 : 92;
  const W = 150;
  const BOX_W = 84;
  const scale = BOX_W / W;
  return (
    <span className="block flex-shrink-0 overflow-hidden rounded border border-[#E5E7EB]" style={{ width: BOX_W, height: Math.round(H * scale) }}>
      <span className="block origin-top-left" style={{ width: W, transform: `scale(${scale})` }}>
        {id === 'scratch' || (!t && vertical)
          ? <BannerScratchThumb orientation={vertical ? 'vertical' : 'horizontal'} />
          : <BannerThumb t={t} />}
      </span>
    </span>
  );
}

/* ⚠️ At the FOOT, after the declarations they name: a re-export above them is legal (a function
   declaration is hoisted) and reads as a second definition. */
export { Tile as BannerTile };
export type { Orientation as BannerOrientation };
