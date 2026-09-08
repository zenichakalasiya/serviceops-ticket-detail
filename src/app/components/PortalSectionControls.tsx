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
import type { BannerLayout } from './supportPortalData';

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
