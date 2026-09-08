/* Support Portal builder — the section-level visual controls.
 *
 * Three controls that a section owns and its children obey. All of them are icon-or-shape pickers
 * rather than dropdowns, for the same reason the spec gives for card templates: *where a thing
 * sits* is recognised by looking, and reading the word "space-between" is slower than seeing it.
 */

import type { ReactNode } from 'react';

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
export function BannerLayoutPicker({ value, options, onChange }: {
  value: string;
  options: { id: string; name: string; note: string; orientation: 'horizontal' | 'vertical' }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((t) => {
        const on = value === t.id;
        const bar = (w: string, faint?: boolean) => (
          <span className={`block h-[3px] ${w} rounded-full ${faint ? 'bg-[#EEF2F6]' : on ? 'bg-[#3D8BD0]/35' : 'bg-[#DFE5ED]'}`} />
        );
        const cell = () => (
          <span className={`h-3 w-3 flex-none rounded-[2px] border ${on ? 'border-[#3D8BD0]/40 bg-[#3D8BD0]/10' : 'border-[#DFE5ED] bg-[#F7F9FC]'}`} />
        );
        /* Each sketch is the shape THAT layout makes — a tile can never promise an arrangement
           you do not get, the same rule the card templates above follow. */
        const art = () => {
          if (t.orientation === 'vertical') {
            const wide = t.id === 'halfdeck';
            return (
              <span className="flex h-[38px] w-full gap-1">
                <span className={`flex ${wide ? 'w-1/2' : 'w-1/3'} flex-col justify-center gap-[3px] rounded-[3px] px-1.5 ${on ? 'bg-[#3D8BD0]/20' : 'bg-[#DFE5ED]'}`}>
                  <span className="block h-[3px] w-full rounded-full bg-white/70" />
                  <span className="block h-[3px] w-2/3 rounded-full bg-white/50" />
                </span>
                <span className="flex flex-1 flex-col justify-center gap-1">
                  {bar('w-full', true)}{bar('w-full', true)}
                </span>
              </span>
            );
          }
          if (t.id === 'rails') return (
            <span className="flex h-[38px] w-full items-center gap-2">
              <span className="flex flex-1 flex-col gap-[3px]">{bar('w-full')}{bar('w-2/3', true)}</span>
              <span className="flex gap-1">{cell()}{cell()}{cell()}</span>
            </span>
          );
          if (t.id === 'broadside') return (
            <span className="flex h-[38px] w-full flex-col items-center justify-center gap-[3px]">
              {bar('w-2/3')}{bar('w-1/2', true)}
              <span className="mt-0.5 flex gap-1">{cell()}{cell()}{cell()}</span>
            </span>
          );
          if (t.id === 'portico') return (
            <span className="flex h-[38px] w-full items-center gap-2">
              <span className={`h-full w-2/5 flex-none rounded-[3px] ${on ? 'bg-[#3D8BD0]/25' : 'bg-[#DFE5ED]'}`} />
              <span className="flex flex-1 flex-col gap-[3px]">{bar('w-full')}{bar('w-3/4', true)}{bar('w-full', true)}</span>
            </span>
          );
          return (
            <span className={`flex h-[38px] w-full flex-col items-center justify-center gap-[3px] rounded-[3px] ${on ? 'bg-[#3D8BD0]/12' : 'bg-[#F7F9FC]'}`}>
              {bar('w-1/2')}{bar('w-2/3', true)}
            </span>
          );
        };
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            title={t.note}
            className={`flex flex-col items-center gap-1.5 rounded-lg border-2 bg-white p-2 transition-colors ${
              on ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#C3CBD6]'
            }`}
          >
            {art()}
            <span className={`w-full truncate text-center text-[10.5px] leading-none ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{t.name}</span>
          </button>
        );
      })}
    </div>
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
