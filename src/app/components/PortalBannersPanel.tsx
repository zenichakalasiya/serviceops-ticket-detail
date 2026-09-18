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
import { sideGradient } from './PortalBannerTools';
import { BANNER_INDUSTRIES, BANNER_TEMPLATES } from './portalBannerTemplates';
import type { BannerDecor, BannerIndustry, BannerPiece, BannerTemplate } from './portalBannerTemplates';

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
    return { backgroundImage: sideGradient(String(h.colorSide ?? 'left'), String(h.bannerColor), String(h.bannerColor2 ?? h.bannerColor)) };
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

/** A horizontal banner, in miniature, on a sliver of page ground. */
function HorizontalThumb({ t }: { t: BannerTemplate | null }) {
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
      {/* The page under the banner, so the tile reads as "the top of a page" rather than as a swatch. */}
      <span className="flex h-[14px] flex-none gap-[3px] px-[5px] pt-[3px]">
        {[0, 1, 2].map((i) => <span key={i} className="h-[8px] flex-1 rounded-[2px] bg-white" />)}
      </span>
    </span>
  );
}

/** A vertical banner: a column beside the page. */
function VerticalThumb({ t }: { t: BannerTemplate }) {
  const w = Math.round(Math.min(55, Math.max(28, (Number(t.page?.heroWidth ?? 380) / 1000) * 100)));
  const decor = (t.hero.bannerDecor ?? null) as BannerDecor | null;
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
      <span className="flex min-h-0 flex-1 flex-col justify-center gap-[5px] bg-white p-[7px] shadow-[0_0_0_0.5px_rgba(15,23,42,0.10)]">{words}</span>
      <span className="flex h-[14px] flex-none gap-[3px] px-[5px] pt-[3px]">
        {[0, 1, 2].map((i) => <span key={i} className="h-[8px] flex-1 rounded-[2px] bg-white" />)}
      </span>
    </span>
  );
}



/* ── The panel ─────────────────────────────────────────────────────────────────────────────── */

function Tile({ active, label, sub, onPick, children }: { active: boolean; label: string; sub: string; onPick: () => void; children: ReactNode }) {
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
        <span className="block truncate text-[11px] text-[#9AA5B4]">{sub}</span>
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
  const [industry, setIndustry] = useState<'all' | BannerIndustry>('all');
  const list = useMemo(
    () => BANNER_TEMPLATES.filter((t) => t.orientation === tab && (industry === 'all' || t.industries.includes(industry))),
    [tab, industry],
  );
  const count = (o: Orientation) => BANNER_TEMPLATES.filter((t) => t.orientation === o).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-none gap-2.5 border-b border-[#E5E7EB] px-4">
        {(['horizontal', 'vertical'] as Orientation[]).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setTab(o)}
            className={`-mb-px border-b-2 px-2 py-2.5 text-[13px] transition-colors ${tab === o ? 'border-[#3D8BD0] font-medium text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'}`}
          >
            {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
            <span className="ml-1.5 text-[11px] text-[#9AA5B4]">{count(o) + (o === 'horizontal' ? 1 : 0)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-none items-center gap-2 px-4 pb-2 pt-3">
        <label htmlFor="banner-industry" className="text-[12px] text-[#7B8FA5]">Industry</label>
        <select
          id="banner-industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value as 'all' | BannerIndustry)}
          className="app-select h-8 flex-1 rounded border border-[#DFE5ED] bg-white pl-2.5 text-[12.5px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
        >
          <option value="all">All industries</option>
          {BANNER_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {tab === 'vertical' && (
        <p className="flex-none px-4 pb-2 text-[11.5px] leading-[1.5] text-[#7B8FA5]">
          A vertical banner is a column beside the page — the sections below move into the space next to it.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          {tab === 'horizontal' && industry === 'all' && (
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
        {list.length === 0 && (
          <p className="py-8 text-center text-[12.5px] text-[#7B8FA5]">No {tab} banners for this industry.</p>
        )}
      </div>
    </div>
  );
}

/* ⚠️ At the FOOT, after the declarations they name: a re-export above them is legal (a function
   declaration is hoisted) and reads as a second definition. */
export { Tile as BannerTile };
export type { Orientation as BannerOrientation };
