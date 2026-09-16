/* Support Portal builder — the section-level visual controls.
 *
 * Three controls that a section owns and its children obey. All of them are icon-or-shape pickers
 * rather than dropdowns, for the same reason the spec gives for card templates: *where a thing
 * sits* is recognised by looking, and reading the word "space-between" is slower than seeing it.
 */

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import type { BannerLayout, BannerShape, ShapeNode } from './supportPortalData';

/* ── Banner starting shapes ─────────────────────────────────────────────────
 *
 * ⚠️ Each thumbnail is DRAWN FROM THE SHAPE'S OWN TREE — the same data `applyBannerShape` builds the
 * banner from — so a tile can never promise an arrangement the banner does not get. */
function ShapeNodeArt({ n, center }: { n: ShapeNode; center: boolean }) {
  const grow = { flexGrow: n.weight ?? 1, flexBasis: 0, minWidth: 0 } as const;
  if ('children' in n) {
    return (
      <span style={grow} className={`flex gap-[3px] ${n.dir === 'row' ? 'flex-row items-center' : 'flex-col justify-center'}`}>
        {n.children.map((c, i) => <ShapeNodeArt key={i} n={c} center={center} />)}
      </span>
    );
  }
  const al = center ? 'items-center' : 'items-start';
  switch (n.el) {
    case 'bn-heading':
      return <span style={grow} className={`flex ${al}`}><span className="block h-[4px] w-[70%] rounded-sm bg-white/90" /></span>;
    case 'bn-subheading':
      return <span style={grow} className={`flex ${al}`}><span className="block h-[3px] w-[48%] rounded-sm bg-white/45" /></span>;
    case 'bn-search':
      return <span style={grow} className={`flex ${center ? 'justify-center' : ''}`}><span className="block h-[6px] w-[64%] rounded-sm bg-white" /></span>;
    case 'v-image':
      return <span style={grow} className="block h-[30px] self-stretch rounded-sm bg-[linear-gradient(135deg,#8FA9C3,#D3DEE9)]" />;
    case 'c-announcements':
      return (
        <span style={grow} className="flex h-[22px] flex-col justify-between rounded-sm bg-white px-[3px] py-[3px]">
          <span className="block h-[2px] w-[80%] rounded-sm bg-[#B6C2D0]" />
          <span className="flex gap-[2px]"><span className="h-[2px] w-[6px] rounded-sm bg-[#3D8BD0]" /><span className="h-[2px] w-[2px] rounded-full bg-[#C3CBD6]" /><span className="h-[2px] w-[2px] rounded-full bg-[#C3CBD6]" /></span>
        </span>
      );
    default:
      return <span style={grow} className="block h-[12px] rounded-sm bg-white/85" />;
  }
}

export function ShapeArt({ s }: { s: BannerShape }) {
  return (
    <span className="flex size-full flex-col gap-[3px] rounded bg-[#EEF2F7] p-[4px]">
      <span className="flex min-h-0 flex-[3] rounded-sm bg-[#1C3D68] p-[5px]">
        <ShapeNodeArt n={s.tree} center={s.hero?.contentAlign === 'center'} />
      </span>
      <span className="grid flex-1 grid-cols-3 gap-[3px]">
        <span className="rounded-sm bg-white" /><span className="rounded-sm bg-white" /><span className="rounded-sm bg-white" />
      </span>
    </span>
  );
}

/* Two across, every shape visible at once — six choices do not earn a dialog. The lit tile is the
   banner's current shape; picking another CHANGES the shape and keeps the content (see the builder). */
/* ── KPI card templates ─────────────────────────────────────────────────────
 * Three icon-free arrangements of a number and its title, drawn as the shape they produce. */
const KPI_LAYOUTS: { value: string; title: string }[] = [
  { value: 'stack', title: 'Number above title' },
  { value: 'centred', title: 'Number above title, centred' },
  { value: 'inline', title: 'Number beside title' },
];
export function KpiLayoutPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {KPI_LAYOUTS.map((t) => {
        const on = value === t.value;
        const big = on ? 'bg-[#3D8BD0]/35' : 'bg-[#DFE5ED]';
        const small = on ? 'bg-[#3D8BD0]/20' : 'bg-[#EEF2F6]';
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            title={t.title}
            aria-pressed={on}
            className={`flex h-[64px] flex-1 items-center justify-center rounded-lg border-2 bg-white transition-colors ${on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
          >
            {t.value === 'inline' ? (
              <span className="flex items-end gap-1.5">
                <span className={`h-[14px] w-4 rounded-sm ${big}`} />
                <span className={`mb-[2px] h-[4px] w-8 rounded-full ${small}`} />
              </span>
            ) : (
              <span className={`flex w-12 flex-col gap-[5px] ${t.value === 'centred' ? 'items-center' : 'items-start'}`}>
                <span className={`h-[12px] w-5 rounded-sm ${big}`} />
                <span className={`h-[4px] w-9 rounded-full ${small}`} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function BannerShapePicker({ value, options, onChange }: {
  value: string | undefined;
  options: BannerShape[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((s) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => { if (!on) onChange(s.id); }}
            aria-pressed={on}
            title={s.note}
            className={`flex flex-col gap-1.5 rounded-lg border-2 bg-white p-1.5 text-left transition-colors ${on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'}`}
          >
            <span className="relative block h-[64px] w-full">
              <ShapeArt s={s} />
              {on && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3D8BD0] text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </span>
            <span className={`block truncate px-0.5 text-[12px] font-medium ${on ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Card templates ──────────────────────────────────────────────────────────
 *
 * ⚠️ Chosen on the PARENT section, not on each card. A row of cards that don't share a layout is a
 * row that reads as an accident — so the section owns the shape and every card in it follows. This
 * is why the card's own panel has no Layout accordion at all. */
const CARD_TEMPLATES: { value: string; dir: string; title: string; noIcon?: boolean }[] = [
  { value: 'left', dir: 'flex-row', title: 'Icon left' },
  { value: 'top', dir: 'flex-col', title: 'Icon top' },
  { value: 'right', dir: 'flex-row-reverse', title: 'Icon right' },
  /* ⚠️ "Text only" belongs in this row, not in a separate switch. Where the icon sits and whether
     there IS an icon are one question with four answers — split into a picker plus a toggle, the
     two can contradict (an icon position chosen for a card with no icon). */
  { value: 'none', dir: 'flex-row', title: 'Text only', noIcon: true },
];

/* ⚠️ `only` narrows the row to the templates a given widget can honestly offer. The IMAGE element
   drops "Text only": that template hides the picture, and an image with no image is not a variant of
   an image, it is a Text element wearing the wrong name — with its alt text, its crop and its link
   all still on screen editing something invisible. An action card keeps it, because a card without
   an icon is still a card. */
export function TemplatePicker({ value, onChange, only }: {
  value: string; onChange: (v: string) => void; only?: readonly string[];
}) {
  const list = only?.length ? CARD_TEMPLATES.filter((t) => only.includes(t.value)) : CARD_TEMPLATES;
  return (
    <div className="flex gap-2">
      {list.map((t) => {
        const on = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            title={t.title}
            className={`flex h-[64px] flex-1 items-center justify-center rounded-lg border-2 bg-white transition-colors ${
              on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'
            }`}
          >
            {/* The tile is drawn from the same shape the section produces, so it can never promise
                a layout you don't get. */}
            <span className={`flex items-center gap-1.5 ${t.dir}`}>
              {!t.noIcon && <span className={`flex-shrink-0 rounded ${on ? 'bg-[#3D8BD0]/30' : 'bg-[#DFE5ED]'} size-4`} />}
              {/* ⚠️ Icon-top CENTRES its lines. The bars are fixed widths inside a plain column, so
                  they defaulted to the left edge while the icon above them sat centred — a tile that
                  promised one arrangement and drew another, on the one template whose whole point is
                  the stacked, centred look. */}
              <span className={`flex flex-col gap-[3px] ${t.value === 'top' ? 'items-center' : ''}`}>
                <span className={`h-[3px] w-8 rounded-full ${on ? 'bg-[#3D8BD0]/30' : 'bg-[#DFE5ED]'}`} />
                <span className="h-[3px] w-6 rounded-full bg-[#EEF2F6]" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Announcement card type ────────────────────────────────────────
 *
 * Three different CARDS, not three arrangements of one — so each tile draws the card inside its own
 * frame, white and bordered exactly as the widget sits on the page, with the name underneath. The
 * old sketches floated loose in the tile: a header and two bars with nothing around them says
 * nothing about which of three cards you are picking, and the picture one read as a swatch.
 * ⚠️ The stored values are untouched (`regular` / `carousel` / `image`) — only the WORDS changed, so
 * every card already on a page keeps the shape it has. */
const ANNOUNCEMENT_TYPES = [
  { value: 'regular', title: 'Regular' },
  { value: 'carousel', title: 'Carousel' },
  { value: 'image', title: 'Image with carousel' },
] as const;

export function AnnouncementTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start gap-2">
      {ANNOUNCEMENT_TYPES.map((t) => {
        const on = value === t.value;
        const ink = on ? 'bg-[#3D8BD0]/50' : 'bg-[#BFC9D6]';
        const faint = 'bg-[#DFE5ED]';
        /* ⚠️ The card is 46 × 30 — a RECTANGLE, centred in the tile, sized back up from the 18 × 12 it
           was cut to. At that size it was a chip: too small to hold a header over two rows, so the three
           types differed by a smudge. This is the same drawing the full-tile version had, at a size that
           still leaves the card room to read AS a card sitting in the tile rather than filling it. */
        const head = (
          <span className="flex items-center gap-[3px]">
            <span className={`h-[2px] w-[14px] rounded-full ${ink}`} />
            <span className="size-[3px] flex-shrink-0 rounded-[1px] bg-[#E2E8F0]" />
            <span className="ml-auto h-[2px] w-[6px] flex-shrink-0 rounded-full bg-[#DFE5ED]" />
          </span>
        );
        /* One notice — its date tile, then the headline over its detail. `band` draws it in the image
           card's dark band, where every tone is a share of white instead of the page's greys. */
        const row = (band?: boolean) => (
          <span className="flex items-center gap-[3px]">
            <span className={`size-[8px] flex-shrink-0 rounded-[1px] ${band ? 'bg-white/25' : 'bg-[#EEF2F6]'}`} />
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className={`h-[2px] w-[85%] rounded-full ${band ? 'bg-white/80' : ink}`} />
              <span className={`h-[2px] w-[55%] rounded-full ${band ? 'bg-white/40' : faint}`} />
            </span>
          </span>
        );
        const dots = (band?: boolean) => (
          <span className="flex items-center gap-[2px]">
            <span className={`size-[2px] rounded-full ${band ? 'bg-white/80' : (on ? 'bg-[#3D8BD0]/70' : 'bg-[#9AA7B5]')}`} />
            <span className={`size-[2px] rounded-full ${band ? 'bg-white/30' : faint}`} />
            <span className={`size-[2px] rounded-full ${band ? 'bg-white/30' : faint}`} />
          </span>
        );
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.value)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className={`flex h-[56px] w-full items-center justify-center rounded-lg border-2 transition-colors ${
              on ? 'border-[#3D8BD0] bg-[#3D8BD0]/[0.04]' : 'border-[#E5E7EB] bg-white hover:border-[#C3CBD6]'
            }`}>
              {/* The CARD, at its own size in the middle of the tile. */}
              <span className={`flex h-[30px] w-[46px] flex-col overflow-hidden rounded-[3px] border bg-white ${on ? 'border-[#3D8BD0]/50' : 'border-[#CBD5E1]'}`}>
                {t.value === 'regular' && (
                  <span className="flex flex-1 flex-col justify-center gap-[3px] p-[3px]">
                    {head}
                    {row()}
                    {row()}
                  </span>
                )}
                {t.value === 'carousel' && (
                  <span className="flex flex-1 flex-col gap-[3px] p-[3px]">
                    {head}
                    {row()}
                    <span className="mt-auto">{dots()}</span>
                  </span>
                )}
                {t.value === 'image' && (
                  <>
                    {/* The photo reaches the card's own edges — which is what this card IS. */}
                    <span className="flex h-[13px] w-full flex-shrink-0 items-center justify-center bg-[#E3E8EE]">
                      <span className={`size-[4px] rounded-full ${on ? 'bg-[#3D8BD0]/40' : 'bg-[#BFC9D6]'}`} />
                    </span>
                    <span className="flex flex-1 flex-col justify-center gap-[2px] bg-[#2F3033] px-[3px]">
                      {row(true)}
                    </span>
                  </>
                )}
              </span>
            </span>
            <span className={`text-center text-[11px] leading-[14px] ${on ? 'font-medium text-[#3D8BD0]' : 'text-[#475467]'}`}>{t.title}</span>
          </button>
        );
      })}
    </div>
  );
}


/* ── Custom Card layouts ────────────────────────────────────────────────
 *
 * Five shapes, drawn as the shape each one makes. ⚠️ The picture is the one element with a FILL — words
 * are lines and a button is a pill — so a tile says which slots its shape has before you read its name. */
const CARD_LAYOUTS = [
  { value: 'imageRight', title: 'Image right' },
  { value: 'imageLeft', title: 'Image left' },
  { value: 'imageTop', title: 'Image on top' },
  { value: 'text', title: 'Text only' },
  { value: 'links', title: 'Links' },
] as const;

export function CardLayoutPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CARD_LAYOUTS.map((t) => {
        const on = value === t.value;
        const ink = on ? 'bg-[#3D8BD0]/45' : 'bg-[#C3CDD9]';
        const faint = 'bg-[#E2E8F0]';
        const pic = on ? 'bg-[#3D8BD0]/25' : 'bg-[#D7DEE7]';
        const lines = (
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
            <span className={`h-[3px] w-[70%] rounded-full ${ink}`} />
            <span className={`h-[2px] w-[90%] rounded-full ${faint}`} />
            <span className={`h-[2px] w-[55%] rounded-full ${faint}`} />
          </span>
        );
        const button = <span className={`mt-[3px] h-[6px] w-[22px] rounded-[2px] ${ink}`} />;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.value)}
            className="flex min-w-0 flex-col items-center gap-1.5"
          >
            <span className={`flex h-[56px] w-full items-center justify-center rounded-lg border-2 p-2 transition-colors ${
              on ? 'border-[#3D8BD0] bg-[#3D8BD0]/[0.04]' : 'border-[#E5E7EB] bg-white hover:border-[#C3CBD6]'
            }`}>
              {(t.value === 'imageRight' || t.value === 'imageLeft') && (
                <span className={`flex size-full items-center gap-[5px] ${t.value === 'imageLeft' ? 'flex-row-reverse' : ''}`}>
                  <span className="flex min-w-0 flex-1 flex-col items-start justify-center">{lines}{button}</span>
                  <span className={`h-full w-[36%] flex-shrink-0 rounded-[3px] ${pic}`} />
                </span>
              )}
              {t.value === 'imageTop' && (
                <span className="flex size-full flex-col gap-[4px]">
                  <span className={`h-[45%] w-full flex-shrink-0 rounded-[3px] ${pic}`} />
                  {lines}
                </span>
              )}
              {t.value === 'text' && (
                <span className="flex size-full flex-col items-start justify-center">{lines}{button}</span>
              )}
              {t.value === 'links' && (
                <span className="flex size-full flex-col justify-center gap-[3px]">
                  <span className={`h-[3px] w-[55%] rounded-full ${ink}`} />
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="flex items-center gap-[3px] border-t border-[#EEF2F6] pt-[3px]">
                      <span className={`size-[3px] flex-shrink-0 rounded-full ${faint}`} />
                      <span className={`h-[2px] flex-1 rounded-full ${faint}`} />
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className={`text-center text-[11px] leading-[14px] ${on ? 'font-medium text-[#3D8BD0]' : 'text-[#475467]'}`}>{t.title}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Banner layouts ──────────────────────────────────────────────────────────
 *
 * ⚠️ A picker of DRAWN shapes, not a dropdown, for the reason at the top of this file: which
 * banner you want is recognised by looking. Each tile is the arrangement the band actually
 * produces — where the words sit, whether anything sits beside them, and which way the band runs.
 * ⚠️ It replaced a three-option "banner type" picker. That one drew abstract SHAPES; these draw
 * named layouts, so the tile has to say which is which — hence a caption under every one, where
 * the old row could get away with three self-evident sketches.
 * ⚠️ VERTICAL tiles are only in the list on a from-scratch page. Choosing one restructures the
 * whole page into two columns, which is not something a control sitting under "Height" should do
 * to a portal that already has content on it. */
/* ── Banner layout ──────────────────────────────────────────────────────────
 *
 * A POPUP, not a grid in the panel. There are twenty-two of these — the reference canvas's
 * twenty-one artboards plus `classic` — and each needs a sketch and a line saying what it is FOR.
 * Three-up in a 340px sidebar that is already a long scroll, choosing one means losing your place
 * in everything else. So the panel carries ONE row saying what the banner is now, and the choosing
 * happens on a surface big enough to compare them side by side.
 *
 * ⚠️ Portalled to `document.body` with fixed positioning. The design panel is `overflow-y-auto`,
 * and CSS forbids one axis being `visible` while the other scrolls, so a popup rendered inside it
 * is clipped the moment it is taller than the space below its field. Same trap already recorded
 * for the drawer tab strip, the listing kebab and the table column menu — this is the fourth. */

/** ⚠️ The sketch is DERIVED from the layout's own record, never written per id. Twenty-two
 *  hand-drawn branches is twenty-two chances for a tile to promise a shape the layout does not
 *  make, and a layout added later would silently fall through to a generic block. Everything the
 *  drawing needs is already on the record: the ground colour, the ink, the height, the alignment,
 *  whether there is a search, how many counters and which side they sit, whether there is a
 *  picture, and — for a vertical one — how wide the column is.
 *  ⚠️ Colours are INLINE styles, not interpolated Tailwind classes. A class built by
 *  interpolation never appears in the source Tailwind scans, so the utility is never generated
 *  and the tile renders unstyled — the trap the element-preview file already carries a note on. */
function LayoutArt({ l }: { l: BannerLayout }) {
  const h = l.hero as Record<string, unknown>;
  const page = (l.page ?? {}) as Record<string, unknown>;
  /* An image band has no colour yet, so it draws as the dark gradient the renderer actually falls
     back to when nothing has been uploaded — not as an empty frame. */
  const img = h.bgKind === 'image';
  const ground = img ? '#25344B' : String(h.bannerColor ?? '#3D8BD0');
  const ink = String(h.headingColor ?? '#FFFFFF');
  const align = String(h.contentAlign ?? 'center');
  const search = h.showSearch !== false;
  const counts = l.widgets?.length ?? 0;

  const line = (w: string, strong?: boolean) => (
    <span className={`block h-[3px] ${w} rounded-full`} style={{ background: ink, opacity: strong ? 0.9 : 0.42 }} />
  );
  const field = () => (
    <span className="block h-[7px] w-3/4 rounded-[2px]" style={{ background: ink, opacity: 0.22 }} />
  );
  const cell = (k: number) => (
    <span key={k} className="block h-[11px] w-[11px] flex-none rounded-[2px]" style={{ background: ink, opacity: 0.3 }} />
  );
  const cells = () => <>{Array.from({ length: counts }, (_, k) => cell(k))}</>;

  /* The page BELOW the band, so a tall banner reads as tall — a band drawn at a constant height
     would make Bulletin and Dispatch look like the same layout with different words. */
  const rest = (
    <span className="flex flex-1 flex-col gap-[3px] bg-white px-1.5 pt-1.5">
      <span className="block h-[3px] w-full rounded-full bg-[#E5E9EF]" />
      <span className="block h-[3px] w-2/3 rounded-full bg-[#E5E9EF]" />
    </span>
  );

  if (l.orientation === 'vertical') {
    /* A column, and its real share of the width — Front Desk is a rail, Half Deck is half. */
    const w = Math.round((Number(page.heroWidth ?? 380) / 1280) * 100);
    return (
      <span className="flex h-full w-full overflow-hidden rounded-[4px] border border-[#E5E9EF] bg-white">
        <span className="flex flex-none flex-col justify-center gap-[4px] px-1.5" style={{ width: `${w}%`, background: ground }}>
          {line('w-full', true)}{line('w-2/3')}
          {search && <span className="mt-0.5 block w-full">{field()}</span>}
        </span>
        <span className="flex flex-1 flex-col justify-center gap-[3px] px-1.5">
          <span className="block h-[3px] w-full rounded-full bg-[#E5E9EF]" />
          <span className="block h-[3px] w-3/4 rounded-full bg-[#E5E9EF]" />
          <span className="block h-[3px] w-full rounded-full bg-[#E5E9EF]" />
        </span>
      </span>
    );
  }

  /* 180 / 260 / 360 / 480 mapped across the tile, so the four steps of the Height rail are four
     visibly different tiles rather than a spread nobody can read. */
  const band = Math.max(38, Math.min(84, Math.round((Number(h.height ?? 260) / 600) * 100)));
  const items = align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start';

  return (
    <span className="flex h-full w-full flex-col overflow-hidden rounded-[4px] border border-[#E5E9EF] bg-white">
      <span className="flex flex-none items-center gap-1.5 px-1.5" style={{ height: `${band}%`, background: ground }}>
        {l.hasImage && (
          <span className="h-[70%] w-[34%] flex-none rounded-[2px]" style={{ background: ink, opacity: 0.22 }} />
        )}
        <span className={`flex min-w-0 flex-1 flex-col justify-center gap-[3px] ${items}`}>
          {line('w-full', true)}
          {line('w-2/3')}
          {search && <span className={`mt-0.5 flex w-full ${items}`}>{field()}</span>}
          {l.slot === 'below' && counts > 0 && (
            <span className={`mt-0.5 flex w-full gap-1 ${items}`}>{cells()}</span>
          )}
        </span>
        {l.slot === 'side' && counts > 0 && <span className="flex flex-none gap-1">{cells()}</span>}
      </span>
      {rest}
    </span>
  );
}

export function BannerLayoutPicker({ value, options, onChange }: {
  value: string;
  options: BannerLayout[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.id === value) ?? options[0];

  /* Escape closes. A modal that can only be dismissed by aiming at a 28px ✕ is a modal people
     learn to avoid opening. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!cur) return null;

  const across = options.filter((o) => o.orientation === 'horizontal');
  const down = options.filter((o) => o.orientation === 'vertical');

  const tile = (l: BannerLayout) => {
    const on = l.id === value;
    return (
      <button
        key={l.id}
        onClick={() => { onChange(l.id); setOpen(false); }}
        className={`group flex flex-col gap-2 rounded-lg border-2 bg-white p-2 text-left transition-colors ${
          on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'
        }`}
      >
        <span className="relative block h-[74px] w-full">
          <LayoutArt l={l} />
          {on && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3D8BD0] text-white">
              <Check size={11} strokeWidth={3} />
            </span>
          )}
        </span>
        <span className="block min-w-0">
          <span className={`block truncate text-[12.5px] font-medium ${on ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{l.name}</span>
          <span className="mt-0.5 block text-[11px] leading-[1.45] text-[#7B8FA5]">{l.note}</span>
        </span>
      </button>
    );
  };

  const group = (title: string, sub: string, list: BannerLayout[]) => (
    <div>
      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7B8FA5]">{title}</div>
      <div className="mb-3 text-[11.5px] text-[#94A3B8]">{sub}</div>
      <div className="grid grid-cols-3 gap-3">{list.map(tile)}</div>
    </div>
  );

  return (
    <>
      {/* The panel row: which banner this IS, and the way to change it. A button that only ever
          read "Choose banner layout" would hide the answer to the question it is next to. */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded border border-[#DFE5ED] bg-white p-1.5 text-left transition-colors hover:border-[#C3CBD6]"
      >
        <span className="block h-9 w-[52px] flex-none"><LayoutArt l={cur} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-[#364658]">{cur.name}</span>
          <span className="block truncate text-[11px] text-[#7B8FA5]">{cur.note}</span>
        </span>
        <span className="flex-none pr-1 text-[12px] font-medium text-[#3D8BD0]">Choose</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/40 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[82vh] w-[860px] max-w-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_rgba(11,27,63,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#1E293B]">Choose banner layout</div>
                <div className="mt-0.5 text-[12px] text-[#7B8FA5]">
                  {options.length} layouts. Picking one restyles the banner and places what it carries — your
                  {' '}heading, sub-heading and search are kept.
                </div>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setOpen(false)}
                className="flex size-8 flex-none items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
              {group('Across the top', 'The banner is a band over the page, and the page below it is unchanged.', across)}
              {/* ⚠️ Only a from-scratch page is offered these — `bannerLayoutsFor` has already
                  filtered them out otherwise, so the heading cannot appear over an empty grid. */}
              {down.length > 0 && group('Down the side', 'The banner becomes a full-height column and the page divides in two.', down)}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}


/* ── Icon-only alignment rows ───────────────────────────────────────────────
 *
 * The glyph IS the meaning — three bars showing where content sits inside its box — so these carry
 * no labels. A `title` gives the word for anyone who wants it. */
function Bars({ children }: { children: ReactNode }) {
  return <span className="flex h-4 w-5 items-center gap-[2px]">{children}</span>;
}

const bar = (h: number, on: boolean, key: number) => (
  <span key={key} className={`w-[3px] rounded-full ${on ? 'bg-[#3D8BD0]' : 'bg-[#94A3B8]'}`} style={{ height: h }} />
);

/** Horizontal distribution: where the group sits, and how the space between its members is shared. */
const DISTRIBUTE = ['start', 'center', 'end', 'between', 'around'] as const;
const DIST_TITLE: Record<string, string> = {
  start: 'Left', center: 'Centre', end: 'Right', between: 'Space between', around: 'Space around',
};
const DIST_JUSTIFY: Record<string, string> = {
  start: 'justify-start', center: 'justify-center', end: 'justify-end',
  between: 'justify-between', around: 'justify-around',
};

/** Vertical alignment inside the band. `stretch` makes every column the same height. */
const VALIGN = ['start', 'center', 'end', 'stretch'] as const;
const VALIGN_TITLE: Record<string, string> = {
  start: 'Top', center: 'Middle', end: 'Bottom', stretch: 'Equal height',
};

/* The shared alignment TRACK.
 *
 * A recessed grey pill; the chosen option is a raised white card sitting in it, and hairlines
 * separate the ones that are not chosen. That is what makes a row of five wordless glyphs read as a
 * single control with one answer rather than five buttons — the selection is the only thing with a
 * surface, so it is the only thing the eye lands on.
 *
 * ⚠️ A divider is suppressed either side of the selected card. Drawing it there puts a line against
 * the raised edge, which reads as a seam in the card rather than a break between two options. */
function Track({ children }: { children: ReactNode }) {
  return <div className="inline-flex items-center rounded-lg bg-[#F1F3F5] p-1">{children}</div>;
}

function Seg({ on, hideRule, title, onClick, children }: {
  on: boolean; hideRule: boolean; title: string; onClick: () => void; children: ReactNode;
}) {
  return (
    <>
      <button
        onClick={onClick}
        title={title}
        className={`flex h-8 w-10 items-center justify-center rounded-md transition-all ${
          on ? 'bg-white shadow-[0_1px_2px_rgba(16,24,40,0.10),0_1px_3px_rgba(16,24,40,0.06)]' : 'hover:bg-white/60'
        }`}
      >{children}</button>
      <span className={`h-4 w-px ${hideRule ? 'bg-transparent' : 'bg-[#DDE1E6]'}`} />
    </>
  );
}

export function DistributeRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const i = DISTRIBUTE.indexOf(value as never);
  return (
    <Track>
      {DISTRIBUTE.map((v, n) => (
        <Seg
          key={v}
          on={value === v}
          /* No rule after the last one, and none touching the raised card on either side. */
          hideRule={n === DISTRIBUTE.length - 1 || n === i || n === i - 1}
          title={DIST_TITLE[v]}
          onClick={() => onChange(v)}
        >
          <span className={`flex h-4 w-5 items-center gap-[2px] ${DIST_JUSTIFY[v]}`}>
            {[12, 12].map((h, k) => bar(h, value === v, k))}
          </span>
        </Seg>
      ))}
    </Track>
  );
}

export function ValignRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const i = VALIGN.indexOf(value as never);
  return (
    <Track>
      {VALIGN.map((v, n) => {
        const on = value === v;
        const place = v === 'start' ? 'items-start' : v === 'center' ? 'items-center' : v === 'end' ? 'items-end' : 'items-stretch';
        return (
          <Seg
            key={v}
            on={on}
            hideRule={n === VALIGN.length - 1 || n === i || n === i - 1}
            title={VALIGN_TITLE[v]}
            onClick={() => onChange(v)}
          >
            <Bars>
              <span className={`flex h-full w-full justify-center gap-[2px] ${place}`}>
                {bar(v === 'stretch' ? 16 : 9, on, 0)}
                {bar(v === 'stretch' ? 16 : 9, on, 1)}
              </span>
            </Bars>
          </Seg>
        );
      })}
    </Track>
  );
}
