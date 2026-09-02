/* Support Portal builder — the shared control kit (spec §3).
 *
 * These are the ONLY control types the whole widget specification uses. Every field in every pack
 * and every widget is one of these, which is the point: 24 widgets are a declarative composition of
 * this file, not 24 bespoke panels. If a widget needs something that is not here, it belongs here
 * first.
 *
 * Everything is built from the project's existing chrome — the 32px control height, the 4px
 * `rounded` radius, the #3D8BD0 focus ring, `.app-select`. Nothing new was invented.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Check, ChevronDown, Eraser,
  IndentDecrease, IndentIncrease, Info, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough,
  File, Images, PlayCircle, TriangleAlert, Underline, Undo2, Upload, UploadCloud, X,
} from 'lucide-react';

/* ── shared chrome ───────────────────────────────────────────────────────── */

export const inputCls =
  'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

export function Field({ label, help, info, children, action, divider, tight }: {
  label?: string; help?: string; children: ReactNode; action?: ReactNode;
  /* ⚠️ Help that lives in an ⓘ rather than under the control. For an explanation you need ONCE —
     the difference between two modes — where a permanent paragraph repeats itself under every
     section down the whole page.  stays for anything you need while USING the field. */
  info?: string;
  /* A hairline and real air above this field. Two icon rows stacked with the same 16px gap read as
     one control with eight buttons — the rule is what says they are two separate questions. */
  divider?: boolean;
  /* A field REVEALED by the toggle above it. It belongs to that switch, so it sits close under it —
     at the normal 16px it read as the next independent question rather than the answer to the one
     you just turned on. */
  tight?: boolean;
}) {
  /* ⚠️ The separating rule is #E5E7EB, the app's standard border. At #F0F2F5 it was technically
     present and practically invisible on white — two stacked icon rows still read as one control
     with eight buttons, which is the exact thing the rule exists to prevent. */
  return (
    <div className={divider ? 'mt-5 border-t border-[#E5E7EB] pt-5' : `${tight ? 'mt-1.5' : 'mt-4'} first:mt-0`}>
      {label && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-[12px] font-normal text-[#7B8FA5]">
            {label}
            {info && <Info size={12} className="flex-shrink-0 cursor-help text-[#9CA3AF]" title={info} />}
          </span>
          {action}
        </div>
      )}
      {children}
      {help && <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">{help}</p>}
    </div>
  );
}

/* ── Group — collapsible, INDEPENDENT (spec §2.1) ─────────────────────────
 *
 * ⚠️ Not a one-at-a-time accordion. Styling means moving between layout, colour and spacing on one
 * thought; a group that shuts the one you were reading to open the next makes you re-open it every
 * time. Open state is remembered per widget type by the drawer, not here.
 * ⚠️ A group with zero visible fields is never rendered empty — the drawer drops it entirely. */
export function Group({ title, open, onToggle, badge, children }: {
  title: string; open: boolean; onToggle: () => void; badge?: ReactNode; children: ReactNode;
}) {
  /* ⚠️ The HEADER is the detail-page properties-panel recipe, byte for byte: `px-4 py-2.5`, the
     `#F9FAFB` hover, an `#E5E7EB` rule between rows. Those panels' components themselves cannot be
     imported — `TicketFieldsAccordion` takes fourteen mode flags and renders a FIXED field set
     rather than children, so it is a ticket-fields component, not a container — but the chrome is
     the part that has to match, and matching it is what makes the builder read as the same product
     as the drawers rather than a tool bolted onto them.
     `-mx-4` bleeds the row to the panel's edge; a hover that stops short of the edge reads as a
     floating strip rather than a row. */
  return (
    <div className="-mx-4 border-b border-[#E5E7EB] last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
      >
        <span className="text-[13px] font-medium text-[#364658]">{title}</span>
        {badge}
        <ChevronDown size={15} className={`ml-auto flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {/* ⚠️ NO `pt-1`. The header row already ends with its own hairline and its own padding, so a
          fourth pixel of top padding here bought nothing and pushed the first row away from the
          title that names it. Removed together with the item list's own top margin — the two
          stacked, and between them a collection's first card sat 20px under a heading it belongs
          to.
          ⚠️ This is EVERY group in the panel, Design accordions included, not only collections.
          That is deliberate: one gap under a group header, the same everywhere, is what makes it
          readable as a rule rather than a number chosen per widget. */}
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ── Badge (spec §3) ─────────────────────────────────────────────────────── */

const BADGE_TONE: Record<string, string> = {
  Placed: 'bg-[#ECFDF3] text-[#22A06B]',
  Locked: 'bg-[#FEF3F2] text-[#D92D20]',
  Hidden: 'bg-[#F1F5F9] text-[#64748B]',
  Inherited: 'bg-[#F1F5F9] text-[#64748B]',
  Overridden: 'bg-[#EBF5FF] text-[#3D8BD0]',
};

export const Badge = ({ children }: { children: string }) => (
  <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${BADGE_TONE[children] ?? BADGE_TONE.Hidden}`}>
    {children}
  </span>
);

/* ── Notes (spec §3) ─────────────────────────────────────────────────────── */

export function Note({ tone = 'info', children, action }: {
  tone?: 'info' | 'warn'; children: ReactNode; action?: { label: string; onClick: () => void };
}) {
  const warn = tone === 'warn';
  return (
    <div className={`mt-3 flex gap-2 rounded p-2.5 ${warn ? 'bg-[#FFFBEB]' : 'bg-[#F7F9FC]'}`}>
      <span className={`mt-[1px] flex-shrink-0 ${warn ? 'text-[#B54708]' : 'text-[#7B8FA5]'}`}>
        {warn ? <TriangleAlert size={13} /> : <Info size={13} />}
      </span>
      <span className="min-w-0 text-[11px] leading-[1.55] text-[#5B7A99]">
        {children}
        {action && (
          <button onClick={action.onClick} className="ml-1 text-[11px] font-medium text-[#3D8BD0] hover:underline">
            {action.label}
          </button>
        )}
      </span>
    </div>
  );
}

/* ── Inherit row (spec §3, §8.2) ──────────────────────────────────────────
 *
 * Wraps any field that can inherit. It shows the state, names the ancestor the value is coming
 * from, and offers Revert. ⚠️ Revert DELETES the local key rather than writing the parent's current
 * value — a copy looks identical today and drifts the moment the parent changes. */
export function InheritRow({ label, state, from, onRevert, help, children }: {
  label: string;
  state: 'own' | 'inherited' | 'theme';
  from?: string;
  onRevert: () => void;
  help?: string;
  children: ReactNode;
}) {
  return (
    <Field
      label={label}
      help={help}
      /* ⚠️ No Reset and no "Following …" note. The whole design resets from one button at the
         foot of the panel, and a per-field Reset put a control on every row for something almost
         nobody does per row. The inheritance MODEL still works exactly as before — it is just not
         narrated on each line. */
    >{children}</Field>
  );
}

/* ── Text ────────────────────────────────────────────────────────────────── */

export const TextField = ({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);

export const TextArea = ({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) => (
  <textarea
    rows={rows}
    className={`${inputCls} h-auto py-2 leading-[1.5]`}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

/* ── Rich text (spec §3, §7.13) ───────────────────────────────────────────
 *
 * Exactly the six controls the spec names. Deliberately NOT the product's full `EditorToolbar` —
 * that is a Gmail-style composer built for a 900px conversation pane, and it does not fit, or
 * belong, in a 400px design panel.
 *
 * ⚠️ The editable area is UNCONTROLLED and only mirrors an external value while unfocused. Writing
 * innerHTML on every keystroke resets the caret to the start, which types text backwards — the same
 * trap the approval-comment editor hit. */
/* The block-format menu.
 *
 * ⚠️ A real dropdown, not a native `<select>`. The select had to reset itself to a placeholder after
 * every use, so it could never say what the caret is standing IN — a format control that cannot
 * report the current format is only half a control. This one reads the block live and shows it as
 * its own label.
 *
 * ⚠️ The shortcuts are LISTED, not just bound. A menu that teaches its own accelerators is how
 * anyone stops opening the menu. */
const BLOCKS: { tag: string; label: string; keys: string; cls: string }[] = [
  { tag: '<h1>', label: 'Heading 1', keys: '⌥1', cls: 'text-[19px] font-semibold' },
  { tag: '<h2>', label: 'Heading 2', keys: '⌥2', cls: 'text-[17px] font-semibold' },
  { tag: '<h3>', label: 'Heading 3', keys: '⌥3', cls: 'text-[15px] font-semibold' },
  { tag: '<h4>', label: 'Heading 4', keys: '⌥4', cls: 'text-[14px] font-medium' },
  { tag: '<p>', label: 'Paragraph', keys: '⌥0', cls: 'text-[13px]' },
  { tag: '<blockquote>', label: 'Quote', keys: '⌥Q', cls: 'text-[13px] italic' },
  { tag: '<pre>', label: 'Monospace', keys: '⌥M', cls: 'text-[13px] font-mono' },
];

function BlockFormat({ onPick, wide }: { onPick: (tag: string) => void; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  /* `formatBlock` reports the tag the caret sits in — `div` when nothing has been applied, which
     reads as Paragraph because that is what an unformatted line is. */
  let current = 'Paragraph';
  try {
    const v = document.queryCommandValue('formatBlock')?.toLowerCase();
    current = BLOCKS.find((b) => b.tag === `<${v}>`)?.label ?? 'Paragraph';
  } catch { /* unsupported */ }

  return (
    <div ref={ref} className={`relative ${wide ? 'w-full' : ''}`}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F1F5F9] ${wide ? 'w-full justify-between' : ''}`}
      >
        {current}
        <ChevronDown size={13} className="text-[#9CA3AF]" />
      </button>
      {open && (
        <div className={`absolute left-0 top-full z-50 mt-1 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)] ${wide ? 'w-full' : 'w-[210px]'}`}>
          {BLOCKS.map((b) => (
            <button
              key={b.tag}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(b.tag); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors ${
                current === b.label ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'
              }`}
            >
              {/* Each row is SET in the style it applies — the preview is the label. */}
              <span className={`${b.cls} truncate text-[#364658]`}>{b.label}</span>
              <span className="flex-shrink-0 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#7B8FA5]">{b.keys}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RichText({ value, onChange, placeholder }: {
  value: string; onChange: (html: string) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value, focused]);

  const cmd = (c: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(c, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  /* ⚠️ Buttons light up when the CARET is inside that formatting, read live from
     `queryCommandState`. Without it the bar is write-only — you can turn bold on but the toolbar
     never tells you the word you are standing in is already bold, so you toggle it off by accident.
     `tick` re-reads on every selection change and keystroke. */
  const [, setTick] = useState(0);
  const active = (c: string) => {
    try { return document.queryCommandState(c); } catch { return false; }
  };
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);

  const btn = 'flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]';
  const btnOn = 'flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]';
  const tool = (c: string) => (active(c) ? btnOn : btn);

  /* The rail's contents, in the order the eye should meet them.
   *
   * ⚠️ The hierarchy is the point: the three CHARACTER toggles first, then the three alignments and
   * the two lists — the paragraph-shaping group — then everything else. That is the order people
   * reach for these, and grouping by what a control ACTS ON (a word, a paragraph, the document)
   * beats grouping by how often it is used, because the first is a rule a new user can infer and
   * the second is a ranking only we can see. Separators mark the three tiers. */
  const RAIL: ({ sep: true } | { cmd: string; arg?: string; title: string; ic: ReactNode; toggles?: boolean; run?: () => void })[] = [
    { cmd: 'bold', title: 'Bold', ic: <Bold size={15} />, toggles: true },
    { cmd: 'underline', title: 'Underline', ic: <Underline size={15} />, toggles: true },
    { cmd: 'italic', title: 'Italic', ic: <Italic size={15} />, toggles: true },
    { sep: true },
    { cmd: 'justifyLeft', title: 'Align left', ic: <AlignLeft size={15} />, toggles: true },
    { cmd: 'justifyCenter', title: 'Align centre', ic: <AlignCenter size={15} />, toggles: true },
    { cmd: 'justifyRight', title: 'Align right', ic: <AlignRight size={15} />, toggles: true },
    { cmd: 'insertUnorderedList', title: 'Bulleted list', ic: <List size={15} />, toggles: true },
    { cmd: 'insertOrderedList', title: 'Numbered list', ic: <ListOrdered size={15} />, toggles: true },
    { sep: true },
    { cmd: 'strikeThrough', title: 'Strikethrough', ic: <Strikethrough size={15} />, toggles: true },
    { cmd: 'formatBlock', arg: '<blockquote>', title: 'Quote', ic: <Quote size={15} /> },
    { cmd: 'indent', title: 'Indent', ic: <IndentIncrease size={15} /> },
    { cmd: 'outdent', title: 'Outdent', ic: <IndentDecrease size={15} /> },
    { cmd: 'createLink', title: 'Link', ic: <Link2 size={15} />, run: () => { const u = window.prompt('Link to'); if (u) cmd('createLink', u); } },
    { cmd: 'undo', title: 'Undo', ic: <Undo2 size={15} /> },
    { cmd: 'redo', title: 'Redo', ic: <Redo2 size={15} /> },
    { cmd: 'removeFormat', title: 'Clear formatting', ic: <Eraser size={15} /> },
  ];

  return (
    <div className="rounded border border-[#d1d5db] focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0]">
      {/* ── Font style, full width, on top ──────────────────────────────────────
          It is the only control here that changes what a line IS rather than how it looks, and the
          only one that needs to show its current value in words — so it gets the width to say
          "Heading 2" and a row of its own, instead of competing for space with sixteen glyphs. */}
      <div className="border-b border-[#F0F2F5] px-1.5 py-1">
        <BlockFormat onPick={(tag) => cmd('formatBlock', tag)} wide />
      </div>

      {/* ── Writing surface, with the actions standing beside it ────────────────
          ⚠️ A VERTICAL rail, not a wrapping bar. Sixteen controls across a 340px panel wrapped to
          three rows that reflowed every time the panel was resized, so a button was never twice in
          the same place; stacked in a fixed-width column they hold their positions, the editor gets
          the height back, and the overflow scrolls in the one direction that costs the text nothing.
          ⚠️ Image and video are gone. A portal element is authored, not composed — an image belongs
          on the page as an Image element the builder can place, select and style, and one pasted
          inside a paragraph is invisible to every one of those tools. */}
      <div className="flex items-stretch">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onChange(ref.current?.innerHTML ?? ''); }}
          onInput={() => onChange(ref.current?.innerHTML ?? '')}
          className="min-h-[200px] flex-1 overflow-y-auto px-3 py-2 text-[13px] leading-[1.6] text-[#364658] focus:outline-none empty:before:text-[#9ca3af] empty:before:content-[attr(data-placeholder)]"
        />
        <div className="flex max-h-[200px] w-[38px] flex-shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-l border-[#F0F2F5] py-1">
          {RAIL.map((r, i) => ('sep' in r ? (
            <span key={`s${i}`} className="my-1 h-px w-4 flex-shrink-0 bg-[#E5E7EB]" />
          ) : (
            <button
              key={r.title}
              /* ⚠️ `onMouseDown → preventDefault` on EVERY button. Without it, pressing one blurs the
                 editor, the browser throws the selection away, and the command lands on nothing —
                 the single most important line in this component. */
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => (r.run ? r.run() : cmd(r.cmd, r.arg))}
              title={r.title}
              className={`flex-shrink-0 ${r.toggles ? tool(r.cmd) : btn}`}
            >{r.ic}</button>
          )))}
        </div>
      </div>
    </div>
  );
}

/* ── Number ──────────────────────────────────────────────────────────────── */

export function NumberField({ value, onChange, min = 0, max = 999, unit }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className={`${inputCls} ${unit ? 'pr-10' : ''} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF]">{unit}</span>}
    </div>
  );
}

/* ── Slider — always paired with an editable numeric readout (spec §3) ───── */

export function SliderRow({ value, onChange, min = 0, max = 100, step = 1, unit = 'px' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-[#3D8BD0]"
      />
      <div className="relative w-[70px] flex-shrink-0">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="h-8 w-full rounded border border-[#d1d5db] pl-2 pr-6 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">{unit}</span>
      </div>
    </div>
  );
}

/* ── Segmented — 2–4 options, never more (spec §3) ────────────────────────── */

export function Segmented<T extends string | number | boolean>({ value, options, onChange }: {
  value: T;
  options: { value: T; label?: string; icon?: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            title={o.title ?? o.label}
            className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded border px-2 text-[12px] font-medium transition-colors ${
              on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
            }`}
          >{o.icon}{o.label && <span className="truncate">{o.label}</span>}</button>
        );
      })}
    </div>
  );
}

export const ALIGN_OPTIONS = [
  { value: 'left' as const, icon: <AlignLeft size={14} />, title: 'Left' },
  { value: 'center' as const, icon: <AlignCenter size={14} />, title: 'Centre' },
  { value: 'right' as const, icon: <AlignRight size={14} />, title: 'Right' },
];

/* ── Select — 5+ options (spec §3) ───────────────────────────────────────── */

export function SelectField<T extends string>({ value, options, onChange }: {
  value: T; options: readonly T[] | { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const list = (options as (T | { value: T; label: string })[]).map((o) =>
    typeof o === 'object' ? o : { value: o, label: String(o) });
  return (
    <select className={`${inputCls} app-select`} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {list.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

/* ── Toggle — label sits WITH the switch, no separate label column ───────── */

export function ToggleRow({ label, on, onChange, help, locked, lockNote }: {
  label: string; on: boolean; onChange: (v: boolean) => void; help?: string;
  /** Accessibility floor (spec §8.5): shown as a locked-on row with a note, never hidden. */
  locked?: boolean; lockNote?: string;
}) {
  /* ⚠️ EVERY switch gets the same air above it, whatever sits above it. Two stacked switches were
     briefly given a tighter gap on the theory that they read as one bank — they read as one ROW
     instead, two labels crowding each other with no space to separate the questions. A switch is
     always its own question; only the field a switch REVEALS hugs it (see Field's `tight`). */
  return (
    <div className="mt-5 first:mt-0">
      <label className={`flex items-center justify-between gap-3 ${locked ? 'cursor-default' : 'cursor-pointer'}`}>
        <span className="text-[13px] text-[#364658]">{label}</span>
        <button
          role="switch"
          aria-checked={on}
          disabled={locked}
          onClick={() => !locked && onChange(!on)}
          className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${
            on ? 'bg-[#3D8BD0]' : 'bg-[#D1D5DB]'
          } ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={`absolute top-[2px] size-[14px] rounded-full bg-white transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`} />
        </button>
      </label>
      {(help || lockNote) && <p className="mt-1 pr-11 text-[11px] leading-[1.5] text-[#9CA3AF]">{lockNote ?? help}</p>}
    </div>
  );
}

/* ── Chips — multi-select, toggling is immediate (spec §3) ───────────────── */

/* A multi-select that reads as a FIELD, not a row of buttons.
 *
 * ⚠️ Chips said "these are the statuses" without ever saying "and these are the ones you left out" —
 * an unpicked chip and a picked one differ only by fill, so at a glance a list of five reads as one
 * thing whether four are on or none are. A closed field states the answer in words ("3 of 5") and
 * the full set only appears when you are choosing from it.
 * ⚠️ It carries Select all / Clear, because "every status" and "none" are the two answers people
 * actually reach for and neither should cost five clicks. */
export function MultiSelect<T extends string>({ value, options, onChange, placeholder = 'None selected' }: {
  value: T[]; options: readonly T[]; onChange: (v: T[]) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const all = value.length === options.length;
  const label = value.length === 0 ? placeholder
    : all ? `All ${options.length}`
      : value.length === 1 ? value[0]
        : `${value.length} of ${options.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center gap-2 rounded border bg-white px-2.5 text-left transition-colors ${
          open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#d1d5db] hover:border-[#3D8BD0]'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate text-[13px] ${value.length ? 'text-[#364658]' : 'text-[#9ca3af]'}`}>{label}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[71] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
          <button
            onClick={() => onChange(all ? [] : [...options])}
            className="flex w-full items-center gap-2 border-b border-[#F0F2F5] px-3 py-1.5 text-left text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5F9FD]"
          >{all ? 'Clear all' : 'Select all'}</button>
          {options.map((o) => {
            const on = value.includes(o);
            return (
              <button
                key={o}
                onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[#F5F9FD]"
              >
                {/* A real checkbox shape: the one control everyone already reads as "many of these". */}
                <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border ${
                  on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1] bg-white'
                }`}>{on && <Check size={11} strokeWidth={3} />}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{o}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange }: {
  value: T[]; options: readonly T[]; onChange: (v: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`h-7 rounded px-2.5 text-[12px] font-medium transition-colors ${
              on ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
            }`}
          >{o}</button>
        );
      })}
    </div>
  );
}

/** An editable chip SET — chips you can add to and remove from (Feedback's answer options). */
export function ChipEditor({ value, onChange, placeholder = 'Add an option' }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded border border-[#d1d5db] p-1.5">
      {value.map((c) => (
        <span key={c} className="flex items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">
          {c}
          <button onClick={() => onChange(value.filter((x) => x !== c))} className="text-[#9CA3AF] hover:text-[#EF4444]">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
        onBlur={commit}
        className="min-w-[90px] flex-1 bg-transparent px-1 text-[12px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none"
      />
    </div>
  );
}

/* ── Grid picker — sweep an R × C grid (spec §3, §7.17) ───────────────────
 *
 * ⚠️ It stops at 10 × 10, and that is not a technical limit: past there a static table wants search,
 * sorting and paging, which means it wants to be a knowledge article. The picker refuses rather than
 * letting someone build something that will not survive real content.
 *
 * Growing pads with blanks; shrinking truncates — and SAYS SO before it happens, because discarding
 * typed cells silently is the kind of thing people only notice a week later. */
export function GridPicker({ rows, cols, onChange, max = 10 }: {
  rows: number; cols: number; onChange: (r: number, c: number) => void; max?: number;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const r = hover?.r ?? rows;
  const c = hover?.c ?? cols;
  return (
    <div>
      <div
        onMouseLeave={() => setHover(null)}
        className="inline-flex flex-col gap-[3px] rounded border border-[#E5E7EB] bg-white p-2"
      >
        {Array.from({ length: max }).map((_, ri) => (
          <span key={ri} className="flex gap-[3px]">
            {Array.from({ length: max }).map((_, ci) => {
              const on = ri < r && ci < c;
              return (
                <button
                  key={ci}
                  onMouseEnter={() => setHover({ r: ri + 1, c: ci + 1 })}
                  onClick={() => onChange(ri + 1, ci + 1)}
                  className={`size-[14px] rounded-[2px] border transition-colors ${
                    on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#DFE5ED] bg-white'
                  }`}
                />
              );
            })}
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-[12px] font-medium text-[#364658]">{r} × {c}</div>
      {(r < rows || c < cols) && (
        <p className="mt-1 text-[11px] leading-[1.5] text-[#B54708]">
          Smaller than it is now — anything typed outside {r} × {c} is discarded.
        </p>
      )}
    </div>
  );
}

/* ── Upload / drop zone (spec §3) ────────────────────────────────────────── */

const CHECKER = 'linear-gradient(45deg, #EEF2F6 25%, transparent 25%), linear-gradient(-45deg, #EEF2F6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EEF2F6 75%), linear-gradient(-45deg, transparent 75%, #EEF2F6 75%)';

/* ── The image-upload empty state, once ──────────────────────────────────────
 *
 * ⚠️ ONE component, N call sites — not N containers edited to look alike. Before this the module
 * had five hand-rolled "drop an image here" boxes with three different border colours, three
 * different icons and four different sentences, because each was written where it was needed. The
 * point of replacing rather than restyling is that the next one cannot drift: there is nowhere to
 * drift to.
 *
 * ⚠️ Looks like a dropzone ⇒ IS a dropzone. Click opens the picker and a drop is accepted, at every
 * site. A decorative dashed box that does nothing when you drag a file onto it is the single most
 * confusing thing a builder can show, and this module had one on the canvas.
 */

/* Two sizes, one component. The design panel is 340–600px and the canvas is not, so a single set of
   measurements cannot serve both without being wrong somewhere. */
const ZONE = {
  sm: { pad: 'px-4 py-6', file: 32, badge: 'size-5', glyph: 11, gap1: 'mt-2.5', gap2: 'mt-[3px]', l1: 'text-[13px] leading-[18px]', l2: 'text-[11px] leading-[16px]', min: 'min-h-[132px]' },
  md: { pad: 'px-6 py-10', file: 40, badge: 'size-6', glyph: 13, gap1: 'mt-3', gap2: 'mt-1', l1: 'text-[14px] leading-[20px]', l2: 'text-[12px] leading-[18px]', min: 'min-h-[180px]' },
} as const;

/* ⚠️ DERIVED from the slot's real rules, never typed per call site. A helper line that promises a
   limit the slot does not have is worse than no helper line — "max 5MB" under an input that
   rejects at 2MB teaches people to distrust every number on the screen. */
export function uploadHint(accept: string, maxMB: number, multiple = false, maxFiles?: number) {
  const types = accept.includes('image/*')
    ? 'PNG, JPG, SVG or WebP'
    /* ⚠️ A wildcard has to be SPELLED OUT, not split on commas — `video/*` came out as "VIDEO/*",
       which is a MIME type shown to somebody choosing a file. */
    : accept.includes('video/*')
      ? 'MP4, WebM or MOV'
      : accept.split(',')
      .map((t) => t.trim().replace(/^image\//, '').replace(/^\./, '').replace('+xml', '').toUpperCase())
      .filter(Boolean).join(', ');
  const parts = [types, `max ${maxMB}MB`];
  /* Multi-file wording ONLY where multi-file is true — one flag drives the input and the copy. */
  if (multiple && maxFiles) parts.push(`up to ${maxFiles} files`);
  return parts.join(' · ');
}

/* Two ways to give a widget a video, in one control.
 *
 * ⚠️ ONE control, not an upload field beside a URL field. A video comes from a file or from a link
 * and never from both, so two always-visible inputs would ask a question with a wrong answer
 * permanently on screen — and leave the widget to decide which one wins when both are filled.
 * Empty, it offers the two routes; filled, it shows what is there and offers to REPLACE it, which
 * is the only thing you do to a video that is already in place. */
export function VideoSource({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [linking, setLinking] = useState(false);
  const [draft, setDraft] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const take = (f?: File | null) => {
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => onChange(String(fr.result));
    fr.readAsDataURL(f);
  };

  if (value) {
    const isFile = value.startsWith('data:');
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-2.5">
        {/* ⚠️ The real frame, muted and without controls. It is a confirmation that the right video
            landed, not a player — you are choosing a file, not watching it. */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-11 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#3D8BD0]">
            <PlayCircle size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium text-[#364658]">{isFile ? 'Uploaded video' : 'Video link'}</span>
            <span className="block truncate text-[11px] text-[#9CA3AF]">{isFile ? 'Stored with this page' : value}</span>
          </span>
        </div>
        {/* ⚠️ "Replace", not "Remove". A video slot that has one is a slot that wants one — swapping
            is the common move, and the destructive verb must not sit on it. */}
        <button
          type="button"
          onClick={() => { setDraft(isFile ? '' : value); setLinking(false); onChange(''); }}
          className="mt-2.5 w-full rounded border border-[#DFE5ED] py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
        >Replace video</button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-[#D9E0EA] bg-white px-4 py-5 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#C3CBD6]">
        <PlayCircle size={22} />
      </span>
      <p className="mt-2.5 text-[13px] text-[#364658]">No video yet</p>
      {linking ? (
        <div className="mt-3 flex gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onChange(draft.trim()); if (e.key === 'Escape') setLinking(false); }}
            placeholder="https://youtu.be/…"
            className="h-8 min-w-0 flex-1 rounded border border-[#d1d5db] px-2.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0]"
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => onChange(draft.trim())}
            className="h-8 flex-shrink-0 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >Add</button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
          >Select video</button>
          <button
            type="button"
            onClick={() => setLinking(true)}
            className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
          >Upload link</button>
        </div>
      )}
      <p className="mt-2 text-[11px] text-[#9CA3AF]">{uploadHint('video/*', 50)}, or a YouTube or Vimeo link</p>
      <input ref={file} type="file" accept="video/*" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

export function ImageUploadZone({
  onFile, accept = 'image/*', maxMB = 5, size = 'sm', label, multiple = false, maxFiles, disabled, disabledReason, suggested,
}: {
  /** Called with the data URL once the file has passed validation. */
  onFile: (dataUrl: string) => void;
  accept?: string;
  maxMB?: number;
  size?: 'sm' | 'md';
  /** Names the SLOT, not the action — "Upload logo image", not "Upload". */
  label: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  disabledReason?: string;
  /* The size that fits this SLOT, e.g. "1600 × 400".
   *
   * ⚠️ Its own line, not appended to the format hint. "PNG, JPG, SVG or WebP · max 5MB" is a rule —
   * break it and the file is rejected — while a suggested size is advice you are free to ignore, and
   * running the two together makes the advice read as a fourth condition of upload.
   * ⚠️ Per SLOT, never a default. A banner, a logo and an icon want three different shapes, and one
   * number offered to all of them would be wrong for at least two. */
  suggested?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const z = ZONE[size];
  const hintId = useId();

  /* ⚠️ Validation runs BEFORE anything is read, so a wrong or oversized file never draws a thumbnail
     first and an error second. The zone stays usable either way — an error that disables the control
     makes the next attempt two steps instead of one. */
  const take = (file?: File | null) => {
    if (!file) return;
    const okType = accept === 'image/*' ? file.type.startsWith('image/') : accept.split(',').some((t) => {
      const s = t.trim();
      return s.startsWith('.') ? file.name.toLowerCase().endsWith(s.toLowerCase()) : file.type === s;
    });
    if (!okType) { setErr(`That file is a ${file.type || 'unknown type'} — this slot takes ${uploadHint(accept, maxMB)}`); return; }
    const mb = file.size / (1024 * 1024);
    if (mb > maxMB) { setErr(`That file is ${mb.toFixed(1)}MB — the limit is ${maxMB}MB`); return; }
    setErr(null);
    const fr = new FileReader();
    fr.onload = () => onFile(String(fr.result));
    fr.readAsDataURL(file);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-describedby={hintId}
        title={disabled ? disabledReason : undefined}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { if (disabled) return; e.preventDefault(); e.stopPropagation(); setOver(true); setErr(null); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault(); e.stopPropagation(); setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-[8px] border border-dashed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D8BD0] focus-visible:ring-offset-1 ${z.pad} ${z.min} ${
          disabled ? 'cursor-not-allowed border-[#D9E0EA] bg-white opacity-50'
            : over ? 'border-[#3D8BD0] bg-[#EBF5FF]'
              : err ? 'border-[#EF4444] bg-white'
                : 'group border-[#D9E0EA] bg-white hover:border-[#3D8BD0]'
        }`}
      >
        {/* ⚠️ TWO layers, not one glyph — an outlined file with a filled badge straddling its lower
            body. One upload arrow reads as a toolbar button; the lockup reads as a place a file
            goes, which is what tells you the whole box is the target rather than the icon. */}
        <span className="relative inline-flex">
          <File size={z.file} strokeWidth={1.5} className="text-[#D0D5DD]" />
          <span
            className={`absolute left-1/2 top-[62%] flex ${z.badge} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-white transition-colors ${
              over ? 'bg-[#2d6ca0]' : 'bg-[#3D8BD0] group-hover:bg-[#2d6ca0]'
            }`}
          >
            <UploadCloud size={z.glyph} strokeWidth={2} className="text-white" />
          </span>
        </span>

        {/* ⚠️ The underline is the whole signal. Colouring "Click to upload" blue as well would
            over-signal a link inside a box that is already entirely clickable. */}
        <span className={`${z.gap1} ${z.l1} text-[#364658]`}>
          <span className="font-medium underline">Click to upload</span> or drag and drop
        </span>
        <span
          id={hintId}
          role={err ? 'status' : undefined}
          aria-live={err ? 'polite' : undefined}
          className={`${z.gap2} ${z.l2} ${err ? 'font-medium text-[#B42318]' : 'text-[#9CA3AF]'}`}
        >{err ?? uploadHint(accept, maxMB, multiple, maxFiles)}</span>
        {/* ⚠️ Suppressed while an ERROR is showing. The reason a file was rejected is the only thing
            worth reading at that moment, and advice underneath it competes for the same glance. */}
        {suggested && !err && (
          <span className={`${z.gap2} ${z.l2} font-medium text-[#7B8FA5]`}>Suggested {suggested} px</span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }}
      />
    </>
  );
}

export function UploadZone({ value, onChange, accept = 'image/*', label, gallery, suggested, noun }: {
  value?: string; onChange: (dataUrl?: string) => void; accept?: string;
  /* ⚠️ What is in the slot, so the filled CTA can NAME it — "Replace logo", not "Replace". A slot
     that already shows a picture has no need to be told a picture is there; what it has to say is
     which of the page's images this button is about, because the panel it sits in is scrolled to
     and read out of context. Left off, the button stays the generic word. */
  noun?: string;
  /** The size that fits this slot — see the note on `ImageUploadZone`. */
  suggested?: string;
  /* ⚠️ Names the SLOT for screen readers — "Upload logo image", not "Upload". The zone below is a
     real button, so this is the only thing that says WHICH of the page's image slots it fills. */
  label?: string;
  /* ⚠️ BANNER only. Every other slot on this panel is a logo, a favicon or a picture the admin
     already has — there is nothing to offer them a gallery OF. The banner is the one image most
     portals never get, because nobody on the team makes artwork. */
  gallery?: (anchor: DOMRect, chooseFile: () => void) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);

  const read = (file?: File) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => onChange(String(fr.result));
    fr.readAsDataURL(file);
  };

  if (value) {
    return (
      <div className="rounded border border-[#E5E7EB] p-2">
        {/* ⚠️ A REAL preview, on a chequerboard. A 40px thumbnail told you an image existed without
            showing you which one, and a logo is exactly the kind of asset you are checking rather
            than confirming — the chequer is there because most of them are transparent PNGs that
            vanish against white. */}
        <span
          className="block h-[92px] w-full rounded bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${value}), ${CHECKER}`,
            backgroundSize: 'contain, 10px 10px',
          }}
        />
        <div className="mt-2 flex items-center gap-2">
          {gallery && (
            <button
              ref={chooseRef}
              onClick={() => gallery(chooseRef.current!.getBoundingClientRect(), () => ref.current?.click())}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
            ><Images size={13} /> Choose</button>
          )}
          <button
            onClick={() => ref.current?.click()}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
          ><Upload size={13} /> {noun ? `Replace ${noun}` : 'Replace'}</button>
          {/* ⚠️ No Remove. Every one of these slots is filled because something has to be there — a
              logo, a banner, an icon — so swapping is the whole job and a destructive button sat
              next to the common action for no one's benefit. Emptying a slot is still reachable
              where it is a real choice rather than an undo: the banner switches to Colour, the icon
              slot has a "none" glyph. */}
        </div>
        <input ref={ref} type="file" accept={accept} onChange={(e) => read(e.target.files?.[0])} className="hidden" />
      </div>
    );
  }

  return (
    <>
      {gallery && (
        <button
          ref={chooseRef}
          onClick={() => gallery(chooseRef.current!.getBoundingClientRect(), () => ref.current?.click())}
          className="mb-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
        ><Images size={13} /> Choose a ready-made banner</button>
      )}
      {/* ⚠️ The ONE zone. This used to be its own dashed box with its own icon and its own
          sentence; it is now the same component the canvas and the icon picker draw, so the three
          can no longer disagree about what an empty image slot looks like. */}
      <ImageUploadZone onFile={onChange} accept={accept} label={label ?? (noun ? `Upload ${noun}` : 'Upload an image')} suggested={suggested} />
    </>
  );
}
