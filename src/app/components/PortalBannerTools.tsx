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
import { ArrowLeftRight, Check, ChevronLeft, Minus, Plus, RotateCw } from 'lucide-react';
import { ColorField } from './PortalColorPicker';
import { activePreset, bannerBoxId, defaultTreeFor, presetsFor, TEXT_SECTION, tilePresets, unitsOf } from './portalBannerLayout';
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
export function BannerFillEditor({ cfg, setCfg, dense }: {
  cfg: Record<string, unknown>;
  setCfg: (patch: Record<string, unknown>) => void;
  /** The toolbar popup's compact form (224px, 28px controls). The panel keeps the full size. */
  dense?: boolean;
}) {
  const mode = String(cfg.colorMode ?? 'solid');
  const c1 = String(cfg.bannerColor ?? '#3D8BD0');
  const grad = bannerGradientOf(cfg);
  /* Picking a colour here MEANS "a coloured banner", so it switches the background to Colour too. */
  const put = (patch: Record<string, unknown>) => setCfg({ bgKind: 'color', ...patch });
  const label = `${dense ? 'mb-1 text-[11.5px]' : 'mb-1.5 text-[12px]'} block font-medium text-[#364658]`;
  return (
    <div className={`flex flex-col ${dense ? 'gap-2' : 'gap-3'}`}>
      <div className="pill-track">
        {(['solid', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => put({ colorMode: m })}
            className={`${dense ? 'h-6 text-[11.5px]' : 'h-7 text-[12px]'} flex-1 rounded font-medium transition-colors ${mode === m ? 'bg-[#3D8BD0] text-white' : 'text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{m === 'solid' ? 'Solid' : 'Gradient'}</button>
        ))}
      </div>
      {mode === 'solid' ? (
        <div>
          <span className={label}>Colour</span>
          <ColorField dense={dense} value={c1} onChange={(v) => put({ bannerColor: v, colorMode: 'solid' })} />
        </div>
      ) : (
        /* ⚠️ The SAME editor the image tab's colour layer uses. The nine-tile "strongest at" grid
           with a start and an end colour could only ever express two stops on one of nine axes —
           and it taught a second way of describing a gradient in a builder that already had one.
           ⚠️ `bannerColor` is kept in step with the first stop. It is what paints UNDER the
              gradient (so a stop with opacity has something honest behind it), what the Solid tab
              shows if you switch back, and what the template thumbnails read to decide whether a
              banner is dark — three places that would otherwise still be answering with the colour
              from before the edit. */
        <GradientEditor
          dense={dense}
          value={grad}
          onChange={(next) => put({
            colorMode: 'gradient',
            bannerGradient: next,
            bannerColor: [...next.stops].sort((x, y) => x.pos - y.pos)[0]?.color ?? c1,
          })}
        />
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
/* The GROUND the Text & Search section is drawn on. */
const CELL_ON = 'bg-[#3D8BD0]/10';
const CELL_OFF = 'bg-[#F1F5F9]';
/* ⚠️ EVERY OTHER SECTION IS A PLAIN GREY BOX. A tile answers ONE question — how the banner's sections
   are arranged — and drawing each widget's own insides answered a second one nobody asked at a size that
   could not hold it: four action cards in a 38px band leaves 10px a card, and a badge with a title line
   at 10px is a badge and a line with their tops and bottoms cut off. The Text & Search section keeps its
   drawing because it is the one section on every banner and the one you locate the layout BY. */
const BOX_ON = 'bg-[#DCE6F2]';
const BOX_OFF = 'bg-[#E6EAF0]';

/* ONE CARD in a skeleton — a white face with a hairline, because that is what a card IS. Used by the
   COLUMN-preset tiles, whose cards sit one row to a tile and so have the room for their contents. */
/** One section of the banner, as an arrangement tile draws it. */
function ItemSkeleton({ id, on }: { id: string; on: boolean }) {
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
  /* An empty cell is the one non-text section that is not a solid box — it is the absence of one.
     ⚠️ The bare id `bn-slot` is how a tile draws a cell that does not exist YET — the count picker
     previews a banner nobody has built, so there is no placed element to look the type up on. */
  if ((placedType(id) ?? id) === 'bn-slot') {
    return <span className={`min-h-[8px] min-w-0 flex-1 rounded-[3px] border border-dashed ${edge}`} />;
  }
  return <span className={`min-h-[8px] min-w-0 flex-1 rounded-[3px] ${on ? BOX_ON : BOX_OFF}`} />;
}

/* ⚠️ A ROW is ONE BAND: every section in it is the same height, and the band sits in the middle of
   the tile rather than being stretched to it.
   Two separate faults produced two wrong pictures on the way here. Stretched to the TILE, a section
   beside a line of text was a tall slab. Centred at their OWN heights instead, the two sections came
   out different heights and the row looked ragged. So the band takes ONE height — its tallest section,
   floored at 14px so a row of short sections is still a band rather than a hairline — and every section
   stretches to it, which is exactly what the banner does with a row of sections. `max-h-full` is what
   keeps a nested row inside its share. Stacked sections fill: between them they ARE the tile's height. */
function PresetArt({ node, on }: { node: BannerNode; on: boolean }) {
  if (typeof node === 'string') {
    const text = node === 'hero-content' || node === 'hero-copy' || node === 'hero-search';
    /* ⚠️ NOT `overflow-hidden`. An empty cell is drawn as a DASHED BORDER, and a border clipped by a
       hair is a border with no top and no bottom — which is exactly what these tiles were showing.
       The tile itself clips, so nothing can escape the thumbnail; this level has no reason to. */
    return (
      <span className={`flex min-h-0 min-w-0 flex-1 items-stretch rounded-[3px] ${text ? `p-[3px] ${on ? CELL_ON : CELL_OFF}` : ''}`}>
        <ItemSkeleton id={node} on={on} />
      </span>
    );
  }
  if (node.d === 'row') {
    return (
      <span className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
        {/* ⚠️ The band's floor is 14px (was 38, then 20). At 38 a row nested inside a column asked for more height
            than its share — a tall tile gives a column of three about 22px each — so `max-h-full` capped
            it and the overflow cut the dashed boxes' horizontal edges off. The floor is only there so a
            row of short sections still reads as a band rather than a hairline, and it has to come down
            with the tile: a 62px tile leaves 50px of content, so a column of three gives each row 14. */}
        <span className="flex max-h-full min-h-[14px] min-w-0 items-stretch gap-[4px]">
          {node.c.map((k, i) => <PresetArt key={i} node={k} on={on} />)}
        </span>
      </span>
    );
  }
  return (
    <span className="flex min-h-0 min-w-0 flex-1 flex-col gap-[4px]">
      {node.c.map((k, i) => <PresetArt key={i} node={k} on={on} />)}
    </span>
  );
}

/** The one tile both pickers are drawn in — the Card templates tile. */
function SkeletonTile({ on, label, onPick, children, tall = false }: {
  on: boolean; label: string; onPick: () => void; children: ReactNode; tall?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onPick(); }}
      className={`flex ${tall ? 'h-[62px]' : 'h-[56px]'} min-w-0 flex-1 overflow-hidden rounded-lg border-2 bg-white p-1.5 transition-colors ${on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
    >{children}</button>
  );
}

export function BannerPresetPicker({ tree, onPick }: { tree: BannerNode | null; onPick: (t: BannerNode) => void }) {
  const presets = presetsFor(tree);
  const on = activePreset(tree);
  if (presets.length < 2) {
    return <p className="text-[12px] leading-[18px] text-[#7B8FA5]">Add a widget to the banner to choose how its items are arranged.</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {presets.map((p) => (
        <SkeletonTile key={p.id} tall on={on === p.id} label={p.label} onPick={() => onPick(p.tree)}>
          <PresetArt node={p.tree} on={on === p.id} />
        </SkeletonTile>
      ))}
    </div>
  );
}

/* ── The banner's LAYOUT, in one popup ───────────────────────────────────────────
 *
 * How many sections the banner holds, and how they are arranged — one question in two parts, so one
 * control. They were two buttons on the bar, and the split made no sense in use: you pressed the "+",
 * picked a count from a grid of pictures, the popup closed, and then you pressed the icon next to it to
 * see a SECOND grid of pictures for the count you had just chosen. Two shelves of thumbnails, one after
 * the other, answering halves of the same decision.
 *
 * ⚠️ The count is a SEGMENTED ROW, not tiles. It used to draw the default layout for each count — real
 * pictures, and redundant the moment the arrangement tiles sit directly beneath them showing the actual
 * layouts on offer. Two grids of thumbnails in one popup is the thing this change exists to remove, so
 * the count is reduced to the number it is and the pictures are left to the control whose whole job is
 * pictures.
 * ⚠️ The count is every section INCLUDING the words, so it runs 2–4 and tops out at `MAX_BANNER_SECTIONS`.
 * A banner with the words alone is one section; adding two widgets makes three. Counting only the widgets
 * would put a "4" on a control whose own cap is four and mean five.
 * ⚠️ A count BELOW what the banner holds is DISABLED with the reason on it, never removed — applying it
 * would have to delete a section somebody filled, and a picker is not where work gets thrown away.
 * ⚠️ Picking a count re-renders the tiles under it, because the tiles read the live tree. That is the
 * whole point of the two being in one place: the layouts you are choosing between are the layouts for the
 * number you just set, in front of you, without a second popup. */
export function BannerLayoutPanel({ tree, onCount, onPick, nameOf }: {
  tree: BannerNode | null;
  onCount: (n: number, remove?: string[]) => void;
  onPick: (t: BannerNode) => void;
  /* What a section is CALLED, answered by the canvas's own `nodeById` — one naming source, so a row
     here reads exactly as the outline and the breadcrumb do. */
  nameOf: (id: string) => string;
}) {
  const units = unitsOf(tree);
  const cur = units.length;
  const presets = presetsFor(tree);
  const on = activePreset(tree);

  /* ── Going DOWN ────────────────────────────────────────────────────────────────────────────────
   * A lower count used to be disabled outright, on the grounds that applying it would decide which of
   * the admin's sections to throw away. Two of the cases throw nothing away: an EMPTY CELL holds
   * nothing, so a banner laid out at four and never filled goes back to two with one click, and no
   * dialog — asking permission to delete nothing is what teaches people to dismiss dialogs.
   * Only when filled sections have to go does it ask, and then it asks by NAME. */
  const [asking, setAsking] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const idOf = (u: BannerNode) => (typeof u === 'string' ? u : bannerBoxId(u));
  const empty = (u: BannerNode) => typeof u === 'string' && placedType(u) === 'bn-slot';
  const empties = units.filter(empty).length;
  /* ⚠️ The words are never a candidate. A count control is not where a banner loses its heading. */
  const removable = units.filter((u) => idOf(u) !== TEXT_SECTION && !empty(u));
  const choose = asking === null ? 0 : Math.max(0, cur - asking - empties);

  const want = (n: number) => {
    if (n >= cur || cur - n <= empties) { onCount(n); return; }
    setPicked([]);
    setAsking(n);
  };

  if (asking !== null) {
    return (
      <div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Back"
            onClick={(e) => { e.stopPropagation(); setAsking(null); }}
            className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]"
          ><ChevronLeft size={15} /></button>
          <span className="text-[12px] font-medium text-[#364658]">Remove {choose === 1 ? 'a section' : `${choose} sections`}</span>
        </div>
        <p className="mb-2 ml-[30px] text-[11px] leading-[16px] text-[#9CA3AF]">
          {empties > 0
            ? `Going to ${asking} takes ${cur - asking} off the banner. ${empties === 1 ? 'An empty cell goes' : `${empties} empty cells go`} on ${empties === 1 ? 'its' : 'their'} own — pick what else to remove.`
            : `Going to ${asking} takes ${cur - asking} off the banner. Pick what to remove.`}
        </p>
        <div className="max-h-[220px] overflow-y-auto">
          {removable.map((u) => {
            const id = idOf(u);
            const lit = picked.includes(id);
            /* ⚠️ Once enough are picked the REST go quiet, rather than the admin picking a fourth and
               being told afterwards. The chosen ones stay live, so unpicking re-opens the list. */
            const full = picked.length >= choose && !lit;
            return (
              <button
                key={id}
                type="button"
                disabled={full}
                onClick={(e) => { e.stopPropagation(); setPicked((p) => (lit ? p.filter((x) => x !== id) : [...p, id])); }}
                className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors last:mb-0 ${
                  lit ? 'bg-[#FEF3F2]' : full ? 'opacity-45' : 'hover:bg-[#F5F7FA]'
                }`}
              >
                <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border ${lit ? 'border-[#EF4444] bg-[#EF4444] text-white' : 'border-[#CBD5E1]'}`}>
                  {lit && <Check size={11} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{nameOf(id)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 flex justify-end gap-2 border-t border-[#EEF1F5] pt-2.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setAsking(null); }}
            className="h-7 rounded px-2.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
          >Cancel</button>
          <button
            type="button"
            disabled={picked.length < choose}
            onClick={(e) => { e.stopPropagation(); onCount(asking, picked); setAsking(null); }}
            className={`h-7 rounded px-2.5 text-[12px] font-medium text-white transition-colors ${
              picked.length < choose ? 'cursor-not-allowed bg-[#FCA5A5]' : 'bg-[#EF4444] hover:bg-[#DC2626]'
            }`}
          >Remove</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ⚠️ NUMBERS again, in a tab row — and this time the reason holds. The count went back to
          pictures a day ago because the arrangements were not on screen while you chose one, so nothing
          else carried a layout. They ARE on screen now: the Arrangement grid below shows a tile even at
          one section, so the picture of what the banner looks like is always there, and the count can go
          back to being the small question it is. The focus belongs on the arrangements.
          ⚠️ DEFAULT is the banner with the words alone — one section, which the numbers could not say.
          It is the way BACK: every other value adds cells, and without it a banner taken to four had no
          route to the shape it started in short of deleting the sections by hand. */}
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#364658]">Sections</span>
        <span className="pill-track">
          {([[1, 'Default'], [2, '2'], [3, '3'], [4, '4']] as const).map(([n, label]) => {
            const lit = n === cur;
            return (
              <button
                key={n}
                type="button"
                title={n === 1 ? 'Just the words — the banner it starts as' : `${n} sections`}
                aria-label={n === 1 ? 'Default sections' : `${n} sections`}
                aria-pressed={lit}
                onClick={(e) => { e.stopPropagation(); want(n); }}
                className={`h-6 rounded px-2 text-[11px] font-medium tabular-nums transition-colors ${
                  lit ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                    : 'text-[#7B8FA5] hover:text-[#364658]'
                }`}
              >{label}</button>
            );
          })}
        </span>
      </div>
      {/* ⚠️ ONE line, and the actionable half of it. It also said "the words and the widgets beside
          them" — a definition of a section, which the tiles below now draw, and which wrapped the line
          in two and pushed the arrangements down the popup. */}
      <p className="mt-1.5 text-[11px] leading-[16px] text-[#9CA3AF]">Click an empty cell on the banner to fill it.</p>

      {/* ⚠️ It ALWAYS draws, and at one section it draws ONE tile: the words and the search, lit,
          because that is the arrangement the banner is in. The block used to vanish below two sections,
          on the argument that there is no arrangement of a single thing — true, and it left the popup
          with no picture at all at the moment the count row had just been reduced to numbers. One tile
          is also the way BACK: the default shape is a thing you can see and point at rather than a state
          you have to reconstruct. */}
      <div className="mt-2.5 border-t border-[#EEF1F5] pt-2.5">
          <p className="mb-2 text-[12px] font-medium text-[#364658]">Arrangement</p>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.length >= 2
              ? presets.map((p) => (
                <SkeletonTile key={p.id} tall on={on === p.id} label={p.label} onPick={() => onPick(p.tree)}>
                  <PresetArt node={p.tree} on={on === p.id} />
                </SkeletonTile>
              ))
              : tree && (
                <SkeletonTile tall on label="The words and the search" onPick={() => onPick(tree)}>
                  <PresetArt node={tree} on />
                </SkeletonTile>
              )}
          </div>
          {/* ⚠️ COLUMN WIDTHS is gone from this popup, on request. The ratio between two columns is
              already draggable on the canvas — the shared edge trades width between them — so a
              six-tile picker of fixed ratios underneath the arrangement was a second, coarser answer
              to a question the banner itself asks better, and it turned a popup about ARRANGEMENT
              into a popup about two things. `bannerSplit` is untouched and still read by `weight()`,
              so every banner keeps the ratio it has. */}
      </div>
    </div>
  );
}

/* ── Column PRESETS for a set of cards (Action cards, KPI tiles) ─────────────────────────────────
 * One tile per arrangement the ACTUAL number of cards can take, each drawn with that many skeleton
 * cards — an action card is an icon beside a line, a KPI a number over a label — and all of them in
 * ONE row, in the panel and in the toolbar alike. */
/* ⚠️ PLAIN GREY BOXES, exactly as the banner's arrangement tiles draw every section that is not
   the words — and for the identical reason, written there as "a tile answers ONE question". The
   question here is how the cards are ARRANGED. Drawing each card's badge and label answered a
   second one nobody asked, at a size that could not hold the answer: at three across a card is 17px
   wide, and a badge with a label line inside a bordered box at 17px is three marks fighting over a
   space that holds one. Boxes in the right shape are what lets someone picture the layout, which is
   all the tile is for. */
export function TilePresetPicker({ count, value, onChange }: {
  count: number; value: number; onChange: (cols: number) => void;
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
                as three tall vertical bars — nothing like the short, wide cards they stand for.
                ⚠️ PADDING of its own, on top of the tile's. The cards used to start 6px from the tile's
                border and run to within 6px of the other side, so four of them read as one crowded
                strip rather than as four cards in a frame — the Card-templates tiles read clean
                because their one card sits in obvious space, and space is the thing to copy.
                ⚠️ The column gap is WIDER than the row gap (4px against 3px). Cards side by side are
                told apart by the channel between them; stacked, their own edges already do it, and an
                equal gap on both axes made the rows look loose to buy separation the columns needed. */}
            <span
              className="grid w-full content-center gap-x-1 gap-y-[3px] self-center px-1 py-0.5"
              /* ⚠️ A ONE-ROW preset is the SHORTEST, not the tallest. Given the whole tile height it
                 drew four portrait bars — the exact "tall vertical bars, nothing like the short wide
                 cards they stand for" the note above warns about, reintroduced by the row that has
                 the most height to spend. Four boxes across a 56px tile are 11px wide; at 22px tall
                 they are columns, at 16px they read as cards. */
              style={{ gridTemplateColumns: `repeat(${p.cols}, minmax(0, 1fr))`, gridAutoRows: rows === 1 ? '16px' : rows === 2 ? '16px' : rows === 3 ? '12px' : '9px' }}
            >
              {/* ⚠️ A card left ALONE on the last row takes the whole width, and the tile draws that —
                  three across and a fourth underneath it spanning all three, not a quarter-width box
                  in the corner beside two empty cells. A lone box beside a gap reads as a mistake; a
                  lone box across the width reads as a decision, which is the same rule the section
                  Grid preset already states. Drawn here AND applied by the renderers, because a tile
                  that promises a shape you do not get is worse than no tile. */}
              {Array.from({ length: n }, (_, i) => (
                <span
                  key={i}
                  className="min-w-0"
                  style={i === n - 1 && n % p.cols === 1 && p.cols > 1 ? { gridColumn: '1 / -1' } : undefined}
                >
                  <span className={`block size-full rounded-[3px] ${on ? BOX_ON : BOX_OFF}`} />
                </span>
              ))}
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
  /* ⚠️ ALWAYS LINEAR. A centre-aligned banner used to derive a RADIAL layer — a pool of shade in the
     middle of the picture — and radial is gone from the editor, so deriving one here would paint a shape
     the control can no longer describe or undo. This is the ONE reader: `bannerLayerCss` paints through
     it too, so the band and the editor cannot disagree about what is on the banner.
     ⚠️ A page that stored `overlayGradient.type: 'radial'` while the option existed still renders radial
     — the stored value is returned untouched above. Touching the editor rewrites it as linear. */
  return { type: 'linear', angle: SIDE_ANGLE[side] ?? 90, stops: [{ pos: 0, color: from }, { pos: 100, color: to }] };
}

/** The banner's OWN gradient as stored, or the nine-tile side / start / end it used to be, turned
 *  into one.
 *
 * ⚠️ The same move `layerGradientOf` makes for the colour layer, and for the same reason: every
 * banner already on a page — and all 29 templates — carry `colorSide`, `bannerColor` and
 * `bannerColor2`, so the new editor has to be able to read those on first open or a banner would
 * repaint itself the day this shipped. Nothing is migrated on load; the moment somebody edits the
 * gradient, `bannerGradient` is written and takes over. */
export function bannerGradientOf(cfg: Record<string, unknown>): LayerGradient {
  const g = cfg.bannerGradient as LayerGradient | undefined;
  if (g && Array.isArray(g.stops) && g.stops.length >= 2) return g;
  const side = String(cfg.colorSide ?? 'left');
  const from = String(cfg.bannerColor ?? '#3D8BD0');
  const to = String(cfg.bannerColor2 ?? '#0B1B3F');
  return { type: side === 'center' ? 'radial' : 'linear', angle: SIDE_ANGLE[side] ?? 90, stops: [{ pos: 0, color: from }, { pos: 100, color: to }] };
}

/** What the banner's Colour tab paints. */
export function bannerFillCss(cfg: Record<string, unknown>): CSSProperties {
  if (cfg.colorMode === 'solid') return { backgroundColor: String(cfg.bannerColor ?? '#3D8BD0'), backgroundImage: 'none' };
  return { backgroundColor: String(cfg.bannerColor ?? '#3D8BD0'), backgroundImage: gradientCss(bannerGradientOf(cfg)) };
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

/* ── The gradient editor ──────────────────────────────────────────────────────────────────────
 *
 * ⚠️ ONE editor, used by the image tab's colour layer AND by the banner's own colour. The two used
 * to ask for a gradient in two different languages: the layer took a type, an angle and any number
 * of stops, while the fill took a nine-tile "strongest at" grid and exactly two colours. Same value,
 * two vocabularies — so what you could express depended on which tab you happened to be in, and
 * nothing you learned in one carried to the other.
 * ⚠️ It is a CONTROLLED component over `LayerGradient`. It stores nothing itself except which stop
 * is selected, so both callers keep owning their own config key. */
export function GradientEditor({ value: g, onChange, linearOnly, dense }: {
  value: LayerGradient;
  onChange: (next: LayerGradient) => void;
  /** Compact form for the 224px toolbar popup: 28px controls, a thinner bar, a narrower stop row. */
  dense?: boolean;
  /* ⚠️ The colour layer over an IMAGE is linear only. A radial wash reads as a spotlight on the
     photograph rather than as shade under the words, and the words sit along an edge — which is a
     direction, and a direction is what a linear gradient is for. With one type there is no choice, so
     the SELECT goes rather than becoming a one-option dropdown; the angle and Rotate stay, and they are
     what the space is spent on. The banner's own colour keeps both types. */
  linearOnly?: boolean;
}) {
  const [active, setActive] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const put = onChange;
  const setStop = (i: number, patch: Partial<LayerStop>) => put({ ...g, stops: g.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const sel = Math.min(active, g.stops.length - 1);
  const iconBtn = `flex ${dense ? 'size-7' : 'size-8'} flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:border-[#C3CBD6] hover:text-[#364658]`;
  const ctl = dense ? 'h-7 text-[12px]' : 'h-8 text-[13px]';

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
    <>
      <div className={`flex items-center ${dense ? 'gap-1' : 'gap-2'}`}>
        {!linearOnly && (
          <select
            value={g.type}
            onChange={(e) => put({ ...g, type: e.target.value as LayerGradient['type'] })}
            className={`app-select ${ctl} min-w-0 flex-1 rounded border border-[#DFE5ED] bg-white px-2 text-[#364658] outline-none focus:border-[#3D8BD0]`}
            aria-label="Gradient type"
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        )}
        {(linearOnly || g.type === 'linear') && (
          <label className={`flex ${dense ? 'h-7 px-1.5' : 'h-8 px-2'} items-center gap-1 rounded border border-[#DFE5ED] bg-white focus-within:border-[#3D8BD0] ${linearOnly ? 'min-w-0 flex-1' : dense ? 'w-[52px] flex-shrink-0' : 'w-[72px]'}`} title="Angle">
            <input
              type="number"
              value={g.angle}
              onChange={(e) => put({ ...g, angle: ((Math.round(Number(e.target.value) || 0) % 360) + 360) % 360 })}
              className={`w-full min-w-0 bg-transparent ${dense ? 'text-[12px]' : 'text-[13px]'} text-[#364658] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              aria-label="Angle"
            />
            <span className="text-[12px] text-[#7B8FA5]">°</span>
          </label>
        )}
        <button type="button" title="Reverse" className={iconBtn} onClick={() => put({ ...g, stops: g.stops.map((s) => ({ ...s, pos: 100 - s.pos })) })}><ArrowLeftRight size={dense ? 13 : 14} /></button>
        {(linearOnly || g.type === 'linear') && (
          <button type="button" title="Rotate 90°" className={iconBtn} onClick={() => put({ ...g, angle: (g.angle + 90) % 360 })}><RotateCw size={dense ? 13 : 14} /></button>
        )}
      </div>

      {/* The bar: the gradient left to right over a checkerboard (so opacity reads), stops above it. */}
      <div className={`relative px-[9px] ${dense ? 'pt-4' : 'pt-5'}`}>
        {g.stops.map((s, i) => (
          <button
            key={i}
            type="button"
            title={`${s.pos}%`}
            onMouseDown={(e) => dragStop(e, i)}
            className={`absolute top-0 flex ${dense ? 'size-[14px]' : 'size-[18px]'} -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-[4px] border-2 bg-white shadow-sm ${i === sel ? 'border-[#3D8BD0]' : 'border-white ring-1 ring-[#C3CBD6]'}`}
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
          className={`${dense ? 'h-5' : 'h-7'} w-full cursor-copy overflow-hidden rounded border border-[#DFE5ED]`}
          style={CHECKER}
        >
          <div className="size-full" style={{ backgroundImage: `linear-gradient(90deg, ${stopsCss(g.stops)})` }} />
        </div>
      </div>

      <div>
        <div className={`${dense ? 'mb-1' : 'mb-1.5'} flex items-center justify-between`}>
          <span className={`${dense ? 'text-[11.5px]' : 'text-[12px]'} font-medium text-[#364658]`}>Stops</span>
          <button
            type="button"
            title={g.stops.length >= 6 ? 'Up to six stops' : 'Add a stop'}
            disabled={g.stops.length >= 6}
            onClick={() => addAt(50)}
            className="flex size-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:opacity-40"
          ><Plus size={14} /></button>
        </div>
        <div className={`flex flex-col ${dense ? 'gap-1' : 'gap-1.5'}`}>
          {g.stops.map((s, i) => (
            <div key={i} onMouseDown={() => setActive(i)} className={`flex items-center ${dense ? 'gap-1 p-0.5' : 'gap-2 p-1'} rounded ${i === sel ? 'bg-[#F5F9FE]' : ''}`}>
              <label className={`flex ${dense ? 'h-7 w-[54px] px-1.5' : 'h-8 w-[70px] px-2'} flex-shrink-0 items-center gap-0.5 rounded border border-[#DFE5ED] bg-white focus-within:border-[#3D8BD0]`}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.pos}
                  onChange={(e) => setStop(i, { pos: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                  className={`w-full min-w-0 bg-transparent ${dense ? 'text-[12px]' : 'text-[13px]'} text-[#364658] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  aria-label="Stop position"
                />
                <span className="text-[12px] text-[#7B8FA5]">%</span>
              </label>
              <div className="min-w-0 flex-1"><ColorField dense={dense} value={s.color} onChange={(v) => setStop(i, { color: v })} /></div>
              <button
                type="button"
                title={g.stops.length <= 2 ? 'A gradient needs two stops' : 'Remove stop'}
                disabled={g.stops.length <= 2}
                onClick={() => { put({ ...g, stops: g.stops.filter((_, j) => j !== i) }); setActive(0); }}
                className={`flex ${dense ? 'size-6' : 'size-7'} flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#EF4444] disabled:opacity-30`}
              ><Minus size={dense ? 13 : 14} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function OverlayLayerEditor({ cfg, setCfg, dense }: { cfg: Record<string, unknown>; setCfg: (patch: Record<string, unknown>) => void; dense?: boolean }) {
  const mode = cfg.overlayMode === 'solid' ? 'solid' : 'gradient';
  const g = layerGradientOf(cfg);
  const label = `${dense ? 'mb-1 text-[11.5px]' : 'mb-1.5 text-[12px]'} block font-medium text-[#364658]`;

  return (
    <div className={`flex flex-col ${dense ? 'gap-2' : 'gap-3'}`}>
      <div className="pill-track">
        {(['solid', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => (m === 'solid' ? setCfg({ overlayMode: 'solid' }) : setCfg({ overlayMode: 'gradient', overlayGradient: g }))}
            className={`${dense ? 'h-6 text-[11.5px]' : 'h-7 text-[12px]'} flex-1 rounded font-medium transition-colors ${mode === m ? 'bg-[#3D8BD0] text-white' : 'text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{m === 'solid' ? 'Solid' : 'Gradient'}</button>
        ))}
      </div>

      {mode === 'solid' ? (
        <div>
          <span className={label}>Layer colour</span>
          <ColorField dense={dense} value={String(cfg.overlayColor ?? 'rgba(15, 23, 42, 0.5)')} onChange={(v) => setCfg({ overlayMode: 'solid', overlayColor: v })} />
          <span className="mt-1.5 block text-[11px] leading-[16px] text-[#7B8FA5]">Lower the opacity in the picker to let more of the image show through.</span>
        </div>
      ) : (
        <GradientEditor linearOnly dense={dense} value={g} onChange={(next) => setCfg({ overlayMode: 'gradient', overlayGradient: { ...next, type: 'linear' } })} />
      )}
    </div>
  );
}
