/* Support Portal builder — the banner's own small tools, shared by its floating toolbar and its panel.
 *
 * ⚠️ ONE implementation of each, used in both places. The toolbar's colour popup and the panel's
 * Background group write the same keys through the same components, so a colour set on the canvas
 * is the colour the panel then shows — there is no second truth to drift.
 *
 * Keys (hero config):
 *   bgKind        'image' | 'color'
 *   colorMode     'solid' | 'gradient'           (Colour only)
 *   bannerColor   the solid colour, or the gradient's STRONG end
 *   bannerColor2  the gradient's other end
 *   colorSide     where the gradient is strongest — a 9-point side
 *   overlayOn / overlaySide / overlayFrom / overlayTo — the colour layer between an image and the text
 */

import { useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { ArrowLeftRight, Minus, Plus, RotateCw } from 'lucide-react';
import { ColorField } from './PortalColorPicker';
import { activePreset, presetsFor, tilePresets } from './portalBannerLayout';
import type { BannerNode } from './portalBannerLayout';
import { placedType } from './portalPageModel';

/** Figma's gap field: the direction glyph, the number, and a slider — one value, typed or dragged. */
export function GapField({ value, onChange, dir = 'column' }: { value: number; onChange: (v: number) => void; dir?: string }) {
  const set = (n: number) => onChange(Math.max(0, Math.min(200, Math.round(Number.isFinite(n) ? n : 0))));
  return (
    <div className="flex items-center gap-3">
      <label className="flex h-8 w-[92px] flex-shrink-0 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2 focus-within:border-[#3D8BD0]">
        {/* The glyph turns with the direction, so the field says which way the gap runs. */}
        <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0 text-[#64748B]" style={{ transform: dir === 'row' ? 'rotate(90deg)' : undefined }} aria-hidden>
          <rect x="2" y="1" width="10" height="3" rx="1" fill="currentColor" />
          <rect x="2" y="10" width="10" height="3" rx="1" fill="currentColor" />
          <path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="number"
          min={0}
          max={200}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-[13px] text-[#364658] outline-none"
          aria-label="Gap"
        />
      </label>
      <input type="range" min={0} max={120} value={Math.min(value, 120)} onChange={(e) => set(Number(e.target.value))} className="min-w-0 flex-1 accent-[#3D8BD0]" aria-label="Gap slider" />
    </div>
  );
}

export const SIDES = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'] as const;

/* Where the colour is STRONGEST → the direction a CSS gradient runs (away from that side). */
const TOWARD: Record<string, string> = {
  'top left': 'to bottom right', top: 'to bottom', 'top right': 'to bottom left',
  left: 'to right', right: 'to left',
  'bottom left': 'to top right', bottom: 'to top', 'bottom right': 'to top left',
};

/** A two-stop gradient that is strongest at `side` (`from`) and fades to `to`. Centre is radial. */
export function sideGradient(side: string, from: string, to: string): string {
  if (side === 'center') return `radial-gradient(circle at center, ${from} 0%, ${to} 100%)`;
  return `linear-gradient(${TOWARD[side] ?? 'to right'}, ${from} 0%, ${to} 100%)`;
}

/** The colour layer's side: the admin's pick, or else the side the heading and search sit on, so the words are what it darkens. */
export const bannerLayerSide = (cfg: Record<string, unknown>): string => {
  if (cfg.overlaySide) return String(cfg.overlaySide);
  const a = String(cfg.contentAlign ?? 'center');
  return a.includes('left') ? 'left' : a.includes('right') ? 'right' : 'center';
};

/** Nine small tiles, each previewing a gradient strongest at that side. */
export function SideGrid({ value, onChange, from = '#0F172A', to = 'rgba(15,23,42,0)' }: {
  value: string; onChange: (v: string) => void; from?: string; to?: string;
}) {
  return (
    <div className="grid w-[132px] grid-cols-3 gap-1.5">
      {SIDES.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            title={s === 'center' ? 'Strongest in the middle' : `Strongest at the ${s}`}
            aria-pressed={on}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onChange(s); }}
            className={`h-9 rounded border-2 transition-colors ${on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
            style={{ backgroundImage: sideGradient(s, from, to), backgroundColor: '#FFFFFF' }}
          />
        );
      })}
    </div>
  );
}

/** Solid or Gradient — the banner's colour, as the toolbar popup and the panel both edit it. */
export function BannerFillEditor({ cfg, setCfg }: {
  cfg: Record<string, unknown>;
  setCfg: (patch: Record<string, unknown>) => void;
}) {
  const mode = String(cfg.colorMode ?? 'solid');
  const c1 = String(cfg.bannerColor ?? '#3D8BD0');
  const c2 = String(cfg.bannerColor2 ?? '#0B1B3F');
  const side = String(cfg.colorSide ?? 'left');
  /* Picking a colour here MEANS "a coloured banner", so it switches the background to Colour too. */
  const put = (patch: Record<string, unknown>) => setCfg({ bgKind: 'color', ...patch });
  const label = 'mb-1.5 block text-[12px] font-medium text-[#364658]';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded border border-[#DFE5ED] p-0.5">
        {(['solid', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => put({ colorMode: m })}
            className={`h-7 flex-1 rounded text-[12px] font-medium transition-colors ${mode === m ? 'bg-[#3D8BD0] text-white' : 'text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{m === 'solid' ? 'Solid' : 'Gradient'}</button>
        ))}
      </div>
      {mode === 'solid' ? (
        <div>
          <span className={label}>Colour</span>
          <ColorField value={c1} onChange={(v) => put({ bannerColor: v, colorMode: 'solid' })} />
        </div>
      ) : (
        <>
          <div>
            <span className={label}>Strongest at</span>
            <SideGrid value={side} onChange={(v) => put({ colorSide: v, colorMode: 'gradient' })} from={c1} to={c2} />
          </div>
          <div>
            <span className={label}>Start colour</span>
            <ColorField value={c1} onChange={(v) => put({ bannerColor: v, colorMode: 'gradient' })} />
          </div>
          <div>
            <span className={label}>End colour</span>
            <ColorField value={c2} onChange={(v) => put({ bannerColor2: v, colorMode: 'gradient' })} />
          </div>
        </>
      )}
    </div>
  );
}

/* ── The banner's ARRANGEMENT presets ─────────────────────────────────────────────────────────────
 * One thumbnail per arrangement the current items can take, each drawn from the SAME tree it would
 * apply — so a thumbnail can never promise a layout you do not get.
 *
 * ⚠️ SKELETONS, not labelled boxes, in the Card templates tile language: text is two lines, the search
 * is a field outline, and each widget is drawn as the shape it makes (a picture, a stack of cards, a
 * tile of numbers). Words inside every block made seven thumbnails into a wall of truncated labels;
 * the name lives on the tooltip instead. */
const INK_ON = 'bg-[#3D8BD0]/45';
const INK_OFF = 'bg-[#C3CDD9]';
const FAINT = 'bg-[#E2E8F0]';
const EDGE_ON = 'border-[#3D8BD0]/50';
const EDGE_OFF = 'border-[#C3CDD9]';
/* The GROUND a section is drawn on inside a preset tile — see `PresetArt`. */
const CELL_ON = 'bg-[#3D8BD0]/10';
const CELL_OFF = 'bg-[#F1F5F9]';
/* A picture: the one thing that is neither a card nor a line. */
const PIC = 'bg-[#D7DEE7]';

/* ONE CARD in a skeleton — a white face with a hairline, because that is what a card IS.
 *
 * ⚠️ This is the whole point of the rewrite. Bars laid straight on the section's ground read as
 * LINES OF TEXT, so a KPI block, a row of action cards, Contact Us and a paragraph all drew the same
 * picture — and a thumbnail that cannot tell those four apart is answering a question nobody asked.
 * A card is a face with an edge; everything that renders as a card on the canvas gets one here. */
function MiniCard({ on, className = '', children }: { on: boolean; className?: string; children?: ReactNode }) {
  return (
    <span className={`flex min-h-0 min-w-0 overflow-hidden rounded-[2px] border bg-white ${on ? 'border-[#9CC0E4]' : 'border-[#DDE3EA]'} ${className}`}>
      {children}
    </span>
  );
}

/** A grid of cards at the block's OWN column count — the arrangement its Presets row chose. */
function CardGrid({ count, cols, children }: { count: number; cols: number; children: (i: number) => ReactNode }) {
  return (
    <span
      className="grid min-h-0 min-w-0 flex-1 gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}
    >
      {Array.from({ length: Math.max(1, count) }, (_, i) => children(i))}
    </span>
  );
}

/** A KPI card: the number, then its label. */
function KpiCardArt({ on }: { on: boolean }) {
  return (
    <MiniCard on={on} className="flex-col justify-center gap-[2px] px-[3px]">
      <span className={`h-[4px] w-[45%] rounded-[1px] ${on ? INK_ON : INK_OFF}`} />
      <span className={`h-[2px] w-[80%] rounded-full ${FAINT}`} />
    </MiniCard>
  );
}

/** An action card: the icon badge, then its title. Icon LEFT in one column, on TOP across a row —
 *  the same two shapes `cardTemplate` draws on the canvas. */
function ActionCardArt({ on, row }: { on: boolean; row: boolean }) {
  return (
    <MiniCard on={on} className={`items-center justify-center gap-[3px] px-[3px] ${row ? 'flex-row' : 'flex-col'}`}>
      <span className={`size-[5px] flex-shrink-0 rounded-[1px] ${on ? INK_ON : INK_OFF}`} />
      <span className={`h-[2px] rounded-full ${FAINT} ${row ? 'flex-1' : 'w-[70%]'}`} />
    </MiniCard>
  );
}

/** A row of a data card: the record's mark, then its two lines. */
function RowArt({ on, mark = 'tile' }: { on: boolean; mark?: 'tile' | 'dot' }) {
  return (
    <span className="flex min-w-0 items-center gap-[3px]">
      <span className={`${mark === 'tile' ? 'size-[7px] rounded-[1px]' : 'size-[3px] rounded-full'} flex-shrink-0 ${FAINT}`} />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className={`h-[2px] w-[85%] rounded-full ${on ? INK_ON : INK_OFF}`} />
        <span className={`h-[2px] w-[55%] rounded-full ${FAINT}`} />
      </span>
    </span>
  );
}

/** A card's heading row: its name, and the link at the far end. */
function HeadArt({ on }: { on: boolean }) {
  return (
    <span className="flex items-center gap-[3px]">
      <span className={`h-[3px] w-[40%] rounded-full ${on ? INK_ON : INK_OFF}`} />
      <span className={`ml-auto h-[2px] w-[8px] flex-shrink-0 rounded-full ${FAINT}`} />
    </span>
  );
}

/** Three carousel dots. */
function DotsArt({ on }: { on: boolean }) {
  return (
    <span className="flex items-center gap-[2px]">
      <span className={`size-[3px] rounded-full ${on ? INK_ON : INK_OFF}`} />
      <span className={`size-[3px] rounded-full ${FAINT}`} />
      <span className={`size-[3px] rounded-full ${FAINT}`} />
    </span>
  );
}

/** A PICTURE — a grey plate with the sun and the hill every image placeholder draws. */
function PictureArt({ className = '' }: { className?: string }) {
  return (
    <span className={`relative min-h-[10px] min-w-0 flex-1 overflow-hidden ${PIC} ${className}`}>
      <span className="absolute left-[4px] top-[3px] size-[3px] rounded-full bg-white/75" />
      <span className="absolute inset-x-0 bottom-0 h-[55%] bg-white/45" style={{ clipPath: 'polygon(0 100%, 38% 18%, 62% 55%, 78% 32%, 100% 100%)' }} />
    </span>
  );
}

/* Which announcement card an Announcements section is showing — the SAME three the Card type tiles
   offer, because the thumbnail has to draw the card the admin actually picked. */
function AnnouncementArt({ on, display }: { on: boolean; display: string }) {
  if (display === 'image') {
    /* The picture reaches the card's own edges, with the notice in the band beneath it. */
    return (
      <span className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[2px]">
        <PictureArt />
        <span className="flex h-[9px] flex-shrink-0 items-center gap-[3px] bg-[#475569] px-[3px]">
          <span className="size-[5px] flex-shrink-0 rounded-[1px] bg-white/25" />
          <span className="h-[2px] flex-1 rounded-full bg-white/70" />
        </span>
      </span>
    );
  }
  return (
    <MiniCard on={on} className="flex-col gap-[3px] p-[3px]">
      <HeadArt on={on} />
      <RowArt on={on} />
      {display === 'carousel' ? <span className="mt-auto"><DotsArt on={on} /></span> : <RowArt on={on} />}
    </MiniCard>
  );
}

/* The list cards — My Open Requests, Approvals, Most Read, a Record List: a heading over its rows. */
function ListCardArt({ on, mark = 'dot' }: { on: boolean; mark?: 'tile' | 'dot' }) {
  return (
    <MiniCard on={on} className="flex-col gap-[3px] p-[3px]">
      <HeadArt on={on} />
      <RowArt on={on} mark={mark} />
      <RowArt on={on} mark={mark} />
    </MiniCard>
  );
}

/* Contact Us: a card of CONTACT LINES — a badge and the address beside it, twice. Drawn as bare
   text it was indistinguishable from a paragraph, which is exactly what it is not. */
function ContactArt({ on }: { on: boolean }) {
  return (
    <MiniCard on={on} className="flex-col justify-center gap-[3px] p-[3px]">
      <HeadArt on={on} />
      <span className="flex items-center gap-[3px]">
        <span className={`size-[6px] flex-shrink-0 rounded-full ${on ? INK_ON : INK_OFF}`} />
        <span className={`h-[2px] w-[70%] rounded-full ${FAINT}`} />
      </span>
      <span className="flex items-center gap-[3px]">
        <span className={`size-[6px] flex-shrink-0 rounded-full ${FAINT}`} />
        <span className={`h-[2px] w-[55%] rounded-full ${FAINT}`} />
      </span>
    </MiniCard>
  );
}

/* A widget's own arrangement, read off its CONFIG — the columns its Presets row chose, how many
 * cards it holds, which announcement card it shows.
 *
 * ⚠️ It has to be READ, not assumed: two banners holding the same widgets in the same tree can be
 * laid out completely differently, and a thumbnail drawing four cards in a row for a block set to one
 * column is telling the admin something untrue about the layout they are about to pick. */
function itemCfg(id: string, cfgOf?: (id: string) => Record<string, unknown>) {
  return cfgOf?.(id) ?? {};
}

/** True for the sections that are a PICTURE — they fill their cell instead of sitting on its ground. */
function bleeds(id: string, cfgOf?: (id: string) => Record<string, unknown>) {
  const type = placedType(id) ?? '';
  if (type === 'v-image' || type === 'v-slider') return true;
  return type === 'c-announcements' && String(itemCfg(id, cfgOf).display ?? 'regular') === 'image';
}

function ItemSkeleton({ id, on, cfgOf, wide = true }: {
  id: string; on: boolean; cfgOf?: (id: string) => Record<string, unknown>;
  /* Does this section span the banner, or is it a column beside something?
   *
   * ⚠️ The SAME question the canvas asks (`bannerCols` in the preview): a block of cards runs all the
   * way across a full-width section and STACKS in a narrow column. Ignoring it drew three KPI cards
   * side by side inside a thumbnail's narrow column — three tall slivers, which is the shape nobody
   * wanted and not the shape the banner would produce. An admin who set the columns themselves
   * (`__colsSet`) always wins, here as there. */
  wide?: boolean;
}) {
  const ink = on ? INK_ON : INK_OFF;
  const edge = on ? EDGE_ON : EDGE_OFF;
  if (id === 'hero-copy') {
    return (
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
        <span className={`h-[3px] w-[80%] rounded-full ${ink}`} />
        <span className={`h-[3px] w-[55%] rounded-full ${FAINT}`} />
      </span>
    );
  }
  if (id === 'hero-content') {
    return (
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
        <span className={`h-[3px] w-[80%] rounded-full ${ink}`} />
        <span className={`h-[3px] w-[55%] rounded-full ${FAINT}`} />
        <span className={`flex h-[7px] w-full items-center justify-end rounded-[3px] border bg-white pr-[2px] ${edge}`}>
          <span className={`size-[3px] rounded-full ${ink}`} />
        </span>
      </span>
    );
  }
  if (id === 'hero-search') {
    return (
      <span className="flex min-w-0 flex-1 items-center">
        <span className={`flex h-[9px] w-full items-center justify-end rounded-[3px] border bg-white pr-[2px] ${edge}`}>
          <span className={`size-[3px] rounded-full ${ink}`} />
        </span>
      </span>
    );
  }

  const type = placedType(id) ?? '';
  const cfg = itemCfg(id, cfgOf);
  const setCols = cfg.__colsSet === true ? Math.max(1, Math.min(4, Number(cfg.cols ?? 0) || 0)) : 0;
  /** The columns this block comes out at: the admin's if they set one, else across or stacked. */
  const colsFor = (count: number) => setCols || (wide ? Math.min(count, 4) : 1);

  if (type === 'bn-slot') {
    return <span className={`min-h-[8px] min-w-0 flex-1 rounded-[3px] border border-dashed ${edge}`} />;
  }
  if (type === 'v-image' || type === 'v-slider') return <PictureArt className="rounded-[2px]" />;
  if (type === 'c-announcements') return <AnnouncementArt on={on} display={String(cfg.display ?? 'regular')} />;
  if (type === 'c-contact') return <ContactArt on={on} />;
  if (type === 'x-kpis') {
    const items = Array.isArray(cfg.items) ? cfg.items.length : 3;
    return <CardGrid count={items} cols={colsFor(items)}>{(i) => <KpiCardArt key={i} on={on} />}</CardGrid>;
  }
  if (type === 'x-actions') {
    const count = Number(cfg.__tileCount ?? 4) || 4;
    const c = colsFor(count);
    return <CardGrid count={count} cols={c}>{(i) => <ActionCardArt key={i} on={on} row={c === 1} />}</CardGrid>;
  }
  if (type === 'c-assets' || type === 'c-cis' || type === 'c-favourites' || type === 'c-services') {
    /* Tiles, not rows — these four draw a grid of record cards. */
    const c = wide ? 2 : 1;
    return <CardGrid count={4} cols={c}>{(i) => <ActionCardArt key={i} on={on} row={c === 1} />}</CardGrid>;
  }
  if (type === 'c-requests' || type === 'c-approvals' || type === 'c-knowledge' || type === 'record_list') {
    return <ListCardArt on={on} mark={type === 'c-requests' || type === 'c-approvals' ? 'dot' : 'tile'} />;
  }
  if (type === 'b-button') {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-center">
        <span className={`h-[8px] w-[70%] rounded-[3px] ${ink}`} />
      </span>
    );
  }
  if (type === 'b-text' || type === 'b-large-title' || type === 'b-subtitle' || type === 'b-list') {
    return (
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
        <span className={`h-[3px] w-[70%] rounded-full ${ink}`} />
        <span className={`h-[2px] w-[90%] rounded-full ${FAINT}`} />
        <span className={`h-[2px] w-[60%] rounded-full ${FAINT}`} />
      </span>
    );
  }
  /* Anything else a widget could be: a card with a heading and a line, which is the shape most of
     them make — never bare bars, or it reads as text again. */
  return <ListCardArt on={on} />;
}

/* ⚠️ Every SECTION is a BLOCK on its own ground, with real space between blocks and its content
   inset from the edges. Drawn as bare lines on white a 3px apart, four sections read as one grey
   smudge — the arrangement, which is the only thing these tiles exist to say, was the one thing you
   could not see in them. A PICTURE is the exception: it fills its cell, as it does on the banner. */
function PresetArt({ node, on, cfgOf, wide = true }: {
  node: BannerNode; on: boolean; cfgOf?: (id: string) => Record<string, unknown>; wide?: boolean;
}) {
  if (typeof node === 'string') {
    const bleed = bleeds(node, cfgOf);
    return (
      <span className={`flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden rounded-[3px] ${bleed ? '' : `p-[3px] ${on ? CELL_ON : CELL_OFF}`}`}>
        <ItemSkeleton id={node} on={on} cfgOf={cfgOf} wide={wide} />
      </span>
    );
  }
  /* ⚠️ A child of a ROW is a COLUMN — narrow, whatever the banner's own width. A child of a column
     keeps whatever width its parent had, which is what makes a section stacked under the words still
     count as full-width. */
  const childWide = node.d === 'row' ? node.c.length <= 1 && wide : wide;
  return (
    <span className={`flex min-h-0 min-w-0 flex-1 gap-[4px] ${node.d === 'row' ? 'flex-row' : 'flex-col'}`}>
      {node.c.map((k, i) => <PresetArt key={i} node={k} on={on} cfgOf={cfgOf} wide={childWide} />)}
    </span>
  );
}

/** The one tile both pickers are drawn in — the Card templates tile. */
function SkeletonTile({ on, label, onPick, children, tall = false }: { on: boolean; label: string; onPick: () => void; children: ReactNode; tall?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onPick(); }}
      className={`flex ${tall ? 'h-[88px]' : 'h-[64px]'} min-w-0 flex-1 overflow-hidden rounded-lg border-2 bg-white p-1.5 transition-colors ${on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
    >{children}</button>
  );
}

export function BannerPresetPicker({ tree, onPick, cfgOf }: {
  tree: BannerNode | null;
  onPick: (t: BannerNode) => void;
  /* ⚠️ Reads each widget's RESOLVED config, so a thumbnail draws the KPI block at the column count it
     is actually set to and the Announcements card in the shape it is actually showing. Without it every
     block falls back to its own default and the tiles promise a layout the banner does not have. */
  cfgOf?: (id: string) => Record<string, unknown>;
}) {
  const presets = presetsFor(tree);
  const on = activePreset(tree);
  if (presets.length < 2) {
    return <p className="text-[12px] leading-[18px] text-[#7B8FA5]">Add a widget to the banner to choose how its items are arranged.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {presets.map((p) => (
        <SkeletonTile key={p.id} tall on={on === p.id} label={p.label} onPick={() => onPick(p.tree)}>
          <PresetArt node={p.tree} on={on === p.id} cfgOf={cfgOf} />
        </SkeletonTile>
      ))}
    </div>
  );
}

/* ── Column PRESETS for a set of cards (Action cards, KPI tiles) ─────────────────────────────────
 * One tile per arrangement the ACTUAL number of cards can take, each drawn with that many skeleton
 * cards — an action card is an icon beside a line, a KPI a number over a label — and all of them in
 * ONE row, in the panel and in the toolbar alike. */
/* ⚠️ The SAME two card drawings the arrangement tiles use, not a second pair — a KPI card that looks
   like a card in one picker and like two bars in the other is two answers to "what does this block
   make". */
function CardSkeleton({ kind, on, flat }: { kind: 'action' | 'kpi'; on: boolean; flat: boolean }) {
  return kind === 'kpi' ? <KpiCardArt on={on} /> : <ActionCardArt on={on} row={flat} />;
}

export function TilePresetPicker({ count, value, onChange, kind = 'action' }: {
  count: number; value: number; onChange: (cols: number) => void; kind?: 'action' | 'kpi';
}) {
  const n = Math.max(1, count);
  return (
    <div className="flex gap-2">
      {tilePresets(n).map((p) => {
        const on = Math.min(value, Math.min(n, 4)) === p.cols;
        const rows = Math.ceil(n / p.cols);
        return (
          <SkeletonTile key={p.cols} on={on} label={p.label} onPick={() => onChange(p.cols)}>
            {/* ⚠️ A FIXED row height, centred in the tile. Stretched to fill the tile, three tiles in one row came out
                as three tall vertical bars — nothing like the short, wide cards they stand for. */}
            <span
              className="grid w-full content-center gap-[3px] self-center"
              style={{ gridTemplateColumns: `repeat(${p.cols}, minmax(0, 1fr))`, gridAutoRows: rows === 1 ? '20px' : rows === 2 ? '15px' : rows === 3 ? '11px' : '8px' }}
            >
              {Array.from({ length: n }, (_, i) => <CardSkeleton key={i} kind={kind} on={on} flat={p.cols === 1} />)}
            </span>
          </SkeletonTile>
        );
      })}
    </div>
  );
}

/* ── Figma's two spacing fields: the gap between COLUMNS and the gap between ROWS ────────────────
 * One value each for everything the container holds. "Mixed" when rows or columns inside it were given
 * their own gap — typing a value here sets them all back to one. */
export function GapPair({ x, y, mixedX = false, mixedY = false, onX, onY, showX = true, showY = true }: {
  x: number; y: number; mixedX?: boolean; mixedY?: boolean; onX: (n: number) => void; onY: (n: number) => void;
  /* ⚠️ Which halves this container actually has. A section laid out as one column has no gap BETWEEN columns,
     and a field storing a number nothing reads is the definition of a dead control. Both show while the shape
     has both, and each keeps its own value — changing rows never touches columns. */
  showX?: boolean; showY?: boolean;
}) {
  const cell = (v: number, mixed: boolean, onChange: (n: number) => void, glyph: ReactNode, label: string) => (
    <label title={label} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded border border-[#DFE5ED] bg-white px-2 focus-within:border-[#3D8BD0]">
      <span className="flex-shrink-0 text-[#64748B]">{glyph}</span>
      <input
        type="number"
        min={0}
        max={200}
        value={mixed ? '' : v}
        placeholder={mixed ? 'Mixed' : undefined}
        onChange={(e) => { if (e.target.value === '') return; onChange(Math.max(0, Math.min(200, Math.round(Number(e.target.value) || 0)))); }}
        aria-label={label}
        className="w-full min-w-0 bg-transparent text-[13px] text-[#364658] outline-none placeholder:text-[#364658]"
      />
    </label>
  );
  const colGlyph = (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor" /><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor" /><path d="M5.5 7h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  );
  const rowGlyph = (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="1" width="10" height="3" rx="1" fill="currentColor" /><rect x="2" y="10" width="10" height="3" rx="1" fill="currentColor" /><path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  );
  return (
    <div className="flex gap-2">
      {showX && cell(x, mixedX, onX, colGlyph, 'Gap between columns')}
      {showY && cell(y, mixedY, onY, rowGlyph, 'Gap between rows')}
    </div>
  );
}

/* ── The COLOUR LAYER between a banner image and its words ────────────────────────────────────────
 * Solid: one colour, its opacity set in the picker — an even wash over the whole picture.
 * Gradient: a type (linear / radial), an angle, and colour STOPS dragged along a preview bar, each with
 * its own opacity — the Figma treatment, in this product's controls.
 * Keys: `overlayMode` ('solid' | 'gradient'), `overlayColor`, `overlayGradient` = { type, angle, stops }.
 * ⚠️ A banner that predates this has only overlayFrom / overlayTo / overlaySide; its gradient is BUILT from
 * those on first read, so it looks the same until someone edits it. */
export interface LayerStop { pos: number; color: string }
export interface LayerGradient { type: 'linear' | 'radial'; angle: number; stops: LayerStop[] }

const SIDE_ANGLE: Record<string, number> = {
  left: 90, right: 270, top: 180, bottom: 0, 'top left': 135, 'top right': 225, 'bottom left': 45, 'bottom right': 315,
};

/** The gradient as stored, or the legacy side / from / to turned into one. */
export function layerGradientOf(cfg: Record<string, unknown>): LayerGradient {
  const g = cfg.overlayGradient as LayerGradient | undefined;
  if (g && Array.isArray(g.stops) && g.stops.length >= 2) return g;
  const side = bannerLayerSide(cfg);
  const from = String(cfg.overlayFrom ?? 'rgba(15, 23, 42, 0.85)');
  const to = String(cfg.overlayTo ?? 'rgba(15, 23, 42, 0)');
  return { type: side === 'center' ? 'radial' : 'linear', angle: SIDE_ANGLE[side] ?? 90, stops: [{ pos: 0, color: from }, { pos: 100, color: to }] };
}

const stopsCss = (stops: LayerStop[]) => [...stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ');
export const gradientCss = (g: LayerGradient) => (g.type === 'radial'
  ? `radial-gradient(circle at center, ${stopsCss(g.stops)})`
  : `linear-gradient(${g.angle}deg, ${stopsCss(g.stops)})`);

/** What the layer paints — used by the banner itself. */
export function bannerLayerCss(cfg: Record<string, unknown>): CSSProperties {
  if (cfg.overlayMode === 'solid') return { backgroundColor: String(cfg.overlayColor ?? 'rgba(15, 23, 42, 0.5)') };
  return { backgroundImage: gradientCss(layerGradientOf(cfg)) };
}

const CHECKER: CSSProperties = { backgroundImage: 'repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%)', backgroundSize: '10px 10px' };

export function OverlayLayerEditor({ cfg, setCfg }: { cfg: Record<string, unknown>; setCfg: (patch: Record<string, unknown>) => void }) {
  const mode = cfg.overlayMode === 'solid' ? 'solid' : 'gradient';
  const g = layerGradientOf(cfg);
  const [active, setActive] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const put = (next: LayerGradient) => setCfg({ overlayMode: 'gradient', overlayGradient: next });
  const setStop = (i: number, patch: Partial<LayerStop>) => put({ ...g, stops: g.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const sel = Math.min(active, g.stops.length - 1);
  const label = 'mb-1.5 block text-[12px] font-medium text-[#364658]';
  const iconBtn = 'flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:border-[#C3CBD6] hover:text-[#364658]';

  /* A stop is dragged along the bar; clicking the bar adds one there, in the nearest stop's colour. */
  const posAt = (clientX: number) => {
    const r = barRef.current?.getBoundingClientRect();
    return r ? Math.max(0, Math.min(100, Math.round(((clientX - r.left) / r.width) * 100))) : 0;
  };
  const dragStop = (e: ReactMouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(i);
    const base = g;
    const move = (ev: MouseEvent) => put({ ...base, stops: base.stops.map((s, j) => (j === i ? { ...s, pos: posAt(ev.clientX) } : s)) });
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const addAt = (pos: number) => {
    if (g.stops.length >= 6) return;
    const nearest = [...g.stops].sort((a, b) => Math.abs(a.pos - pos) - Math.abs(b.pos - pos))[0];
    /* Kept in position order, so the list reads left to right like the bar. */
    const stops = [...g.stops, { pos, color: nearest.color }].sort((x, y) => x.pos - y.pos);
    put({ ...g, stops });
    setActive(stops.findIndex((s) => s.pos === pos));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded border border-[#DFE5ED] p-0.5">
        {(['solid', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => (m === 'solid' ? setCfg({ overlayMode: 'solid' }) : put(g))}
            className={`h-7 flex-1 rounded text-[12px] font-medium transition-colors ${mode === m ? 'bg-[#3D8BD0] text-white' : 'text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{m === 'solid' ? 'Solid' : 'Gradient'}</button>
        ))}
      </div>

      {mode === 'solid' ? (
        <div>
          <span className={label}>Layer colour</span>
          <ColorField value={String(cfg.overlayColor ?? 'rgba(15, 23, 42, 0.5)')} onChange={(v) => setCfg({ overlayMode: 'solid', overlayColor: v })} />
          <span className="mt-1.5 block text-[11px] leading-[16px] text-[#7B8FA5]">Lower the opacity in the picker to let more of the image show through.</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <select
              value={g.type}
              onChange={(e) => put({ ...g, type: e.target.value as LayerGradient['type'] })}
              className="app-select h-8 min-w-0 flex-1 rounded border border-[#DFE5ED] bg-white px-2 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0]"
              aria-label="Gradient type"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
            {g.type === 'linear' && (
              <label className="flex h-8 w-[72px] items-center gap-1 rounded border border-[#DFE5ED] bg-white px-2 focus-within:border-[#3D8BD0]" title="Angle">
                <input
                  type="number"
                  value={g.angle}
                  onChange={(e) => put({ ...g, angle: ((Math.round(Number(e.target.value) || 0) % 360) + 360) % 360 })}
                  className="w-full min-w-0 bg-transparent text-[13px] text-[#364658] outline-none"
                  aria-label="Angle"
                />
                <span className="text-[12px] text-[#7B8FA5]">°</span>
              </label>
            )}
            <button type="button" title="Reverse" className={iconBtn} onClick={() => put({ ...g, stops: g.stops.map((s) => ({ ...s, pos: 100 - s.pos })) })}><ArrowLeftRight size={14} /></button>
            {g.type === 'linear' && (
              <button type="button" title="Rotate 90°" className={iconBtn} onClick={() => put({ ...g, angle: (g.angle + 90) % 360 })}><RotateCw size={14} /></button>
            )}
          </div>

          {/* The bar: the gradient left to right over a checkerboard (so opacity reads), stops above it. */}
          <div className="relative px-[9px] pt-5">
            {g.stops.map((s, i) => (
              <button
                key={i}
                type="button"
                title={`${s.pos}%`}
                onMouseDown={(e) => dragStop(e, i)}
                className={`absolute top-0 flex size-[18px] -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-[4px] border-2 bg-white shadow-sm ${i === sel ? 'border-[#3D8BD0]' : 'border-white ring-1 ring-[#C3CBD6]'}`}
                style={{ left: `calc(9px + (100% - 18px) * ${s.pos / 100})` }}
              >
                <span className="size-full rounded-[2px]" style={{ ...CHECKER, backgroundSize: '6px 6px' }}>
                  <span className="block size-full rounded-[2px]" style={{ backgroundColor: s.color }} />
                </span>
              </button>
            ))}
            <div
              ref={barRef}
              title="Click to add a stop"
              onMouseDown={(e) => addAt(posAt(e.clientX))}
              className="h-7 w-full cursor-copy overflow-hidden rounded border border-[#DFE5ED]"
              style={CHECKER}
            >
              <div className="size-full" style={{ backgroundImage: `linear-gradient(90deg, ${stopsCss(g.stops)})` }} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#364658]">Stops</span>
              <button
                type="button"
                title={g.stops.length >= 6 ? 'Up to six stops' : 'Add a stop'}
                disabled={g.stops.length >= 6}
                onClick={() => addAt(50)}
                className="flex size-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:opacity-40"
              ><Plus size={14} /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              {g.stops.map((s, i) => (
                <div key={i} onMouseDown={() => setActive(i)} className={`flex items-center gap-2 rounded p-1 ${i === sel ? 'bg-[#F5F9FE]' : ''}`}>
                  <label className="flex h-8 w-[70px] flex-shrink-0 items-center gap-0.5 rounded border border-[#DFE5ED] bg-white px-2 focus-within:border-[#3D8BD0]">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.pos}
                      onChange={(e) => setStop(i, { pos: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                      className="w-full min-w-0 bg-transparent text-[13px] text-[#364658] outline-none"
                      aria-label="Stop position"
                    />
                    <span className="text-[12px] text-[#7B8FA5]">%</span>
                  </label>
                  <div className="min-w-0 flex-1"><ColorField value={s.color} onChange={(v) => setStop(i, { color: v })} /></div>
                  <button
                    type="button"
                    title={g.stops.length <= 2 ? 'A gradient needs two stops' : 'Remove stop'}
                    disabled={g.stops.length <= 2}
                    onClick={() => { put({ ...g, stops: g.stops.filter((_, j) => j !== i) }); setActive(0); }}
                    className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#EF4444] disabled:opacity-30"
                  ><Minus size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
