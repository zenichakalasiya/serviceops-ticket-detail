import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, ChevronDown, Info, Pipette } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Colour picker.
 *
 * Theme colours come first because a portal should be built from its palette, not from arbitrary
 * hex — picking off the top row is the path of least resistance, which is how a design system
 * actually gets followed. Saved and Recent sit under it for everything else, and the spectrum is
 * last for the times none of that will do.
 *
 * `Recent` is module-level on purpose: it is a property of the session, not of one popover, so it
 * survives closing and reopening on a different element. */

const THEME_COLORS = ['#3D8BD0', '#364658', '#7B8FA5', '#F7F9FC', '#FFFFFF', '#22A06B', '#B45309', '#DC2626'];

/* ⚠️ A FIXED preset grid, not a remembered one. A recently-used strip is per-browser, so the
   shortcut two admins see is different and neither matches the palette — and on a themed portal it
   is the exact move the theme exists to make unnecessary. These two rows are the same for everyone,
   so a colour is where it was last time. */
const PRESETS = [
  '#C00000', '#F0A030', '#F2E23C', '#8B5A2B', '#7CC63E', '#2E6B14', '#D924D9', '#8B2FF0',
  '#4A90E2', '#3FE0C0', '#B5E86A', '#000000', '#3F3F46', '#8E8E93', '#FFFFFF',
];

const CHECKER = 'linear-gradient(45deg, #E5E7EB 25%, transparent 25%), linear-gradient(-45deg, #E5E7EB 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E5E7EB 75%), linear-gradient(-45deg, transparent 75%, #E5E7EB 75%)';

let RECENT: string[] = [];
const remember = (hex: string) => {
  RECENT = [hex, ...RECENT.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 14);
};

/* ── colour maths ────────────────────────────────────────────────────────── */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Splits a stored colour into the hex the spectrum edits and the opacity the alpha rail edits.
 *  ⚠️ The picker EMITS rgba() below full opacity but never read one back: reopened, a 20% shadow
 *  showed `RGBA(15, 23, 42, 0.20)` in the Hex field, 0/0/0 in RGB and a full alpha rail — so the
 *  first touch of anything reset the colour to opaque black. */
function parseColor(value: string | undefined): { hex: string; opacity: number } {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value ?? '');
  if (m) return { hex: rgbToHex(+m[1], +m[2], +m[3]), opacity: Math.round(clamp(m[4] === undefined ? 1 : +m[4]) * 100) };
  if (/^#[0-9A-Fa-f]{8}$/.test(value ?? '')) return { hex: value!.slice(0, 7).toUpperCase(), opacity: Math.round(parseInt(value!.slice(7), 16) / 2.55) };
  return { hex: (value || '#000000').toUpperCase(), opacity: 100 };
}

/* ── swatch ──────────────────────────────────────────────────────────────── */

function Swatch({ color, on, onPick, none }: { color: string; on?: boolean; onPick: () => void; none?: boolean }) {
  return (
    <button
      onClick={onPick}
      title={none ? 'No colour' : color}
      className={`relative size-[18px] flex-shrink-0 rounded-full border transition-transform hover:scale-110 ${
        on ? 'ring-2 ring-[#3D8BD0] ring-offset-1' : ''
      } ${color.toUpperCase() === '#FFFFFF' || none ? 'border-[#DFE5ED]' : 'border-black/10'}`}
      style={{ background: none ? '#fff' : color }}
    >
      {none && <Ban size={11} className="absolute inset-0 m-auto text-[#DC2626]" />}
    </button>
  );
}

/* ── picker ──────────────────────────────────────────────────────────────── */

export function PortalColorPicker({ value, onChange, onClose, anchor, modeTab }: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  /** Viewport rect of the trigger — the popover is portalled, so it positions itself. */
  anchor: DOMRect;
  /** Light / dark, for a swatch that has one of each. See the note on `ColorDot`. */
  modeTab?: { value: 'light' | 'dark'; onChange: (m: 'light' | 'dark') => void };
}) {
  /* ⚠️ No Saved list. A portal is built from its THEME palette, and a per-browser set of saved
     swatches is a second palette that nobody else on the team can see — it quietly competes with
     the one place colour is supposed to be defined. Recent stays because it is a shortcut back to
     what you just used, not an alternative source of truth. */
  const [hsv, setHsv] = useState(() => hexToHsv(parseColor(value).hex));
  /* ⚠️ RE-SEEDED when the incoming value changes, which is what happens the moment the Light/Dark
     tab is switched. `useState` only ever reads its initial argument, so without this the spectrum
     and the hex field disagreed the instant you changed tab — the field said the dark value and the
     wheel was still sitting on the light one. */
  const modeKey = modeTab?.value;
  useEffect(() => {
    const p = parseColor(value);
    setHsv(hexToHsv(p.hex));
    setHex(p.hex);
    setOpacity(p.opacity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey]);
  const [hex, setHex] = useState(() => parseColor(value).hex);
  const [opacity, setOpacity] = useState(() => parseColor(value).opacity);
  const ref = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  /* What the popover opened with, so Cancel has something to go back TO. A ref, not state: every
     drag re-renders, and a state copy would track the exploration it exists to undo. */
  const opened = useRef(value);
  const rgb = hexToRgb(/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#000000');

  /** Emits a hex, or an rgba() once the alpha rail has been moved off full. */
  const emit = (h: string, o: number) => {
    if (o >= 100) { onChange(h); return; }
    const c = hexToRgb(/^#[0-9A-Fa-f]{6}$/.test(h) ? h : '#000000');
    onChange(`rgba(${c.r}, ${c.g}, ${c.b}, ${(o / 100).toFixed(2)})`);
  };

  const setChannel = (k: 'r' | 'g' | 'b', raw: string) => {
    const n = Math.max(0, Math.min(255, Number(raw.replace(/[^0-9]/g, '')) || 0));
    const next = { ...rgb, [k]: n };
    const h = '#' + [next.r, next.g, next.b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    setHex(h);
    setHsv(hexToHsv(h));
    emit(h, opacity);
  };

  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  const commit = (next: string) => {
    setHex(next.toUpperCase());
    setHsv(hexToHsv(next));
    remember(next);
    /* Keeps the opacity already chosen — picking a new hue must not quietly make it opaque again. */
    emit(next, opacity);
  };

  /* Both the spectrum and the hue rail are pointer-dragged, so they share one handler shape. */
  const dragOn = (
    el: HTMLDivElement | null,
    e: React.MouseEvent,
    read: (x: number, y: number, rect: DOMRect) => void,
  ) => {
    if (!el) return;
    const apply = (cx: number, cy: number) => read(cx, cy, el.getBoundingClientRect());
    apply(e.clientX, e.clientY);
    const move = (ev: MouseEvent) => apply(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const pickSv = (e: React.MouseEvent) => dragOn(svRef.current, e, (x, y, r) => {
    const s = clamp((x - r.left) / r.width);
    const v = 1 - clamp((y - r.top) / r.height);
    setHsv((p) => ({ ...p, s, v }));
    commit(hsvToHex(hsv.h, s, v));
  });

  /* ⚠️ HORIZONTAL. The rail runs under the spectrum rather than beside it, so the reading is x, not
     y — the old vertical maths would have set the hue from wherever the pointer happened to sit
     vertically, which is not a dimension this control has any more. */
  const pickHueX = (e: React.MouseEvent) => dragOn(hueRef.current, e, (x, _y, r) => {
    const h = clamp((x - r.left) / r.width) * 360;
    setHsv((p) => ({ ...p, h }));
    commit(hsvToHex(h, hsv.s, hsv.v));
  });

  const pickAlpha = (e: React.MouseEvent) => dragOn(alphaRef.current, e, (x, _y, r) => {
    const o = Math.round(clamp((x - r.left) / r.width) * 100);
    setOpacity(o);
    emit(hex, o);
  });

  const eyedropper = async () => {
    const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropper) return;
    try { commit((await new EyeDropper().open()).sRGBHex); } catch { /* dismissed */ }
  };
  const hasEyedropper = typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined';


  /* Portalled and fixed. The design panel is an overflow-y-auto column, so an absolutely
     positioned popover inside it gets clipped the moment it is taller than the space below the
     field — which this one always is. */
  /* ⚠️ COMPACT on purpose (25 Sep 2026): it was 286 × ~470 — taller than most of the fields it
     edits sit apart, so it covered the very block whose colour you were judging. Every part is
     still here; each is simply the size it needs rather than the size a full-page picker uses. */
  const W = 224;
  const H = 360;
  const top = Math.max(8, Math.min(anchor.bottom + 6, window.innerHeight - H - 8));
  const left = Math.max(8, Math.min(anchor.right - W, window.innerWidth - W - 8));

  /* ── the popover ──────────────────────────────────────────────────────────
   *
   * ⚠️ NO Recent list. A recently-used strip is a shortcut back to a colour you already chose, which
   * on a themed portal is precisely the move the theme exists to make unnecessary — and it is
   * per-browser, so the shortcut two admins see is different, and neither matches the palette. The
   * theme swatches and a fixed preset grid answer the same question without inventing a state.
   *
   * ⚠️ Done and Cancel, not close-and-keep. The spectrum is dragged, so every intermediate colour
   * lands on the page as you move — without a Cancel the only way out of an exploration is to
   * remember what you started from and find it again. Cancel restores the value the popover opened
   * with. */
  return createPortal(
    <div
      ref={ref}
      data-portal-popover=""
      style={{ top, left, width: W }}
      className="fixed z-[10000] rounded-lg border border-[#E5E7EB] bg-white p-2.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
    >
      {/* ⚠️ ABOVE the spectrum, because it says which of two values everything below it is editing.
          Underneath, you would have picked a colour before being told where it was going. */}
      {modeTab && (
        <div className="mb-2 flex items-center gap-0.5 rounded bg-[#F1F5F9] p-0.5">
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => modeTab.onChange(m)}
              className={`flex-1 rounded py-0.5 text-[12px] font-medium capitalize transition-colors ${
                modeTab.value === m
                  ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                  : 'text-[#9CA3AF] hover:text-[#364658]'
              }`}
            >{m}</button>
          ))}
        </div>
      )}
      {/* Spectrum */}
      <div
        ref={svRef}
        onMouseDown={pickSv}
        className="relative h-[108px] w-full cursor-crosshair rounded"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 1, 1)})` }}
      >
        <span
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>

      {/* Hue and alpha rails, with the live colour beside them. */}
      <div className="mt-2 flex items-center gap-1.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div
            ref={hueRef}
            onMouseDown={pickHueX}
            className="relative h-2.5 w-full cursor-pointer rounded-sm"
            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-[14px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[#CBD5E1] bg-white shadow"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
          <div
            ref={alphaRef}
            onMouseDown={pickAlpha}
            className="relative h-2.5 w-full cursor-pointer rounded-sm"
            style={{
              backgroundImage: `linear-gradient(to right, transparent, ${hex}), ${CHECKER}`,
              backgroundSize: 'auto, 8px 8px',
            }}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-[14px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[#CBD5E1] bg-white shadow"
              style={{ left: `${opacity}%` }}
            />
          </div>
        </div>
        <span
          className="size-[26px] flex-shrink-0 rounded border border-black/10"
          style={{ background: hex }}
        />
        {/* The eyedropper rides beside the live colour rather than taking a full-width row of its
            own under the buttons — it is one glyph, and a row for it was a fifth of the height. */}
        {hasEyedropper && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={eyedropper}
                aria-label="Pick from screen"
                className="flex size-[26px] flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
              ><Pipette size={13} /></button>
            </TooltipTrigger>
            <TooltipContent side="top">Pick from screen</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Hex · R · G · B · A — labels UNDER the fields, as in the reference: the value is what you
          read, the label only says which channel it belongs to. */}
      <div className="mt-2 flex gap-1">
        {([
          ['Hex', hex.replace('#', ''), (v: string) => {
            const next = '#' + v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
            setHex(next.toUpperCase());
            if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(next)) { setHsv(hexToHsv(next)); emit(next, opacity); }
          }, 'flex-[1.6]'],
          ['R', String(rgb.r), (v: string) => setChannel('r', v), 'flex-1'],
          ['G', String(rgb.g), (v: string) => setChannel('g', v), 'flex-1'],
          ['B', String(rgb.b), (v: string) => setChannel('b', v), 'flex-1'],
          /* ⚠️ A percentage, the same unit the rail reads in. The old 0–1 display trimmed zeros and
             then always cut the last character, so 0.2 read as `0.` and 0.5 as `0.`. */
          ['A', `${opacity}%`, (v: string) => {
            const o = Math.round(Math.max(0, Math.min(100, Number(v.replace(/[^0-9.]/g, '')) || 0)));
            setOpacity(o);
            emit(hex, o);
          }, 'flex-1'],
        ] as [string, string, (v: string) => void, string][]).map(([label, val, on, flex]) => (
          <span key={label} className={`${flex} min-w-0`}>
            <input
              value={val}
              onChange={(e) => on(e.target.value)}
              className="h-6 w-full rounded border border-[#d1d5db] px-0.5 text-center text-[11px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            <span className="mt-px block text-center text-[10px] leading-3 text-[#9CA3AF]">{label}</span>
          </span>
        ))}
      </div>

      <div className="-mx-2.5 my-2 h-px bg-[#E5E7EB]" />

      {/* Theme palette first, then the fixed presets — a portal should be built from its own
          colours, and the presets are the escape hatch rather than the starting point. */}
      <div className="grid grid-cols-8 justify-items-center gap-y-1.5">
        {THEME_COLORS.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
        {PRESETS.map((c) => <Swatch key={c} color={c} on={c.toLowerCase() === hex.toLowerCase()} onPick={() => commit(c)} />)}
        <Swatch color="transparent" none onPick={() => { onChange('transparent'); setHex('TRANSPARENT'); }} />
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        <button
          onClick={onClose}
          className="inline-flex h-7 flex-1 items-center justify-center rounded bg-[#0EA5E9] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#0284C7]"
        >Done</button>
        <button
          onClick={() => { onChange(opened.current); onClose(); }}
          className="inline-flex h-7 flex-1 items-center justify-center rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
        >Cancel</button>
      </div>

    </div>,
    document.body,
  );
}

/* The row that opens it — swatch + hex, matching the panel's other fields. */
/* ⚠️ Circle only, no hex. In a palette of seventeen rows the code beside every one turned the list
   into a spreadsheet — and nobody recognises a colour by its code, so the text was noise sitting
   where the colour should be. The value is what the picker is for. */
export function ColorDot({ value, onChange, title, modes }: {
  value: string;
  onChange: (v: string) => void;
  title?: string;
  /* Both of a swatch's values, so the picker can offer a tab per mode.
   *
   * ⚠️ Every swatch in this palette HAS two values — one for the light portal and one for the dark
   * one — and the dot could only ever edit whichever the switcher happened to be showing. Editing the
   * other meant flipping the whole panel to a mode you were not designing, changing the colour, and
   * flipping back. The tab edits the value directly; the switcher still decides which one you SEE.
   * Omitted where a colour has no dark counterpart, and then no tabs are drawn. */
  modes?: {
    mode: 'light' | 'dark';
    light: string;
    dark: string;
    onChange: (mode: 'light' | 'dark', v: string) => void;
  };
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  /* ⚠️ Seeded from the THEME's mode every time the picker opens, never remembered. The rule you
     asked for is that the tab follows the switcher — a tab that remembered its last position would
     start disagreeing with the panel the second time you opened it. */
  const [tab, setTab] = useState<'light' | 'dark'>(modes?.mode ?? 'light');
  const btnRef = useRef<HTMLButtonElement>(null);
  const open = () => {
    setTab(modes?.mode ?? 'light');
    setAnchor(anchor ? null : btnRef.current!.getBoundingClientRect());
  };
  const shown = modes ? (tab === 'dark' ? modes.dark : modes.light) : value;
  return (
    <>
      <button
        ref={btnRef}
        title={title}
        onClick={open}
        className="size-6 flex-shrink-0 rounded-full border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] transition-transform hover:scale-110"
        style={{ background: value }}
      />
      {anchor && (
        <PortalColorPicker
          value={shown}
          onChange={(v) => (modes ? modes.onChange(tab, v) : onChange(v))}
          anchor={anchor}
          onClose={() => setAnchor(null)}
          modeTab={modes ? { value: tab, onChange: setTab } : undefined}
        />
      )}
    </>
  );
}

export function ColorField({ value, onChange, modes, compact, dense }: {
  value: string;
  onChange: (v: string) => void;
  /** 28px tall, 12px text, no chevron — for the toolbar popups that share the colour picker's 224px width. */
  dense?: boolean;
  /** Swatch only — for a slot too narrow for the value and chevron (the Border row's 38px). */
  compact?: boolean;
  /* Both of this colour's values, so the picker offers a tab per mode — the same contract
   * `ColorDot` takes in the Theme panel, and deliberately the same words on screen.
   *
   * ⚠️ Without this a style colour could only ever be set for whichever mode the portal happened
   * to be showing. Designing the other one meant flipping the whole canvas to a mode you were not
   * working in, changing the colour, and flipping back — and nothing on the control said the value
   * you had just set applied to one mode only.
   * ⚠️ The SWATCH on the closed field keeps showing `value`, the colour that is actually painted
   * right now. The tab decides which you EDIT; the canvas decides which you see. */
  modes?: {
    mode: 'light' | 'dark';
    light: string;
    dark: string;
    onChange: (mode: 'light' | 'dark', v: string) => void;
  };
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  /* ⚠️ Seeded from the portal's mode every time the picker opens, never remembered — the rule the
     Theme panel's dot already follows. A tab that remembered its last position would start
     disagreeing with the canvas the second time you opened it. */
  const [tab, setTab] = useState<'light' | 'dark'>(modes?.mode ?? 'light');
  const btnRef = useRef<HTMLButtonElement>(null);
  const shown = modes ? (tab === 'dark' ? modes.dark : modes.light) : value;
  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => {
          setTab(modes?.mode ?? 'light');
          setAnchor(anchor ? null : btnRef.current!.getBoundingClientRect());
        }}
        className={`flex w-full items-center rounded border border-[#d1d5db] bg-white text-left transition-colors hover:border-[#3D8BD0] ${dense ? 'h-7 gap-1.5' : 'h-9 gap-2'} ${compact ? 'justify-center' : dense ? 'px-1.5' : 'px-2'}`}
      >
        <span className={`${dense ? 'size-4' : 'size-5'} flex-shrink-0 rounded border border-black/10`} style={{ background: value }} />
        {/* A colour with opacity reads as its hex and a percentage, the two things the picker edits — not as a raw rgba() string. */}
        {!compact && <span className={`min-w-0 flex-1 truncate ${dense ? 'text-[12px]' : 'text-[13px]'} text-[#364658]`}>{(() => { const p = parseColor(value); return p.opacity < 100 ? `${p.hex} · ${p.opacity}%` : (value || '').toUpperCase(); })()}</span>}
        {!compact && !dense && <ChevronDown size={14} className="flex-shrink-0 text-[#9CA3AF]" />}
      </button>
      {anchor && (
        <PortalColorPicker
          value={shown}
          onChange={(v) => (modes ? modes.onChange(tab, v) : onChange(v))}
          anchor={anchor}
          onClose={() => setAnchor(null)}
          modeTab={modes ? { value: tab, onChange: setTab } : undefined}
        />
      )}
    </div>
  );
}
