import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Link2, Link2Off, MoveHorizontal, MoveVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NodeStyle, SpacingBox } from './portalPageModel';

/* Padding and margin.
 *
 * ⚠️ TWO designs behind a tab, on purpose and for now — "Two fields" and "Four sides". They are the
 * same eight values through the same field and the same two links; only the shape differs. Whichever
 * is kept is therefore a deletion rather than a rewrite, and the one that goes takes no behaviour
 * with it.
 *
 * ⚠️ THE NUMBERS ARE THE TARGETS. Every side is a real 32px input — click it and type, or drag
 * sideways on it to scrub — so the smallest thing you have to hit is a field, not a hairline edge.
 *
 * ⚠️ An unset side shows what the element RESTS at. A section carries 24px either side from its own
 * classes, so printing 0 there said there was no space when there plainly was, and gave no way to tell
 * that typing 0 would remove it. It used to be printed in GREY to say "nobody set this" — a true and
 * secondary fact, told in the one way that also reads as "this field is disabled", which is how a panel
 * of eight live inputs came to look switched off. Every value is at full strength now.
 *
 * ⚠️ EVERY SIDE IS px. Left and right were a percentage of the parent, so one control carried two
 * scales and had to caption them; the unit now rides in each field's own divided cell. */

type Ring = 'margin' | 'padding';
type Side = keyof SpacingBox;

interface Props {
  style: NodeStyle;
  onChange: (patch: Partial<NodeStyle>) => void;
  /* ⚠️ Restricts the widget to ONE ring. A divider and a shape have no inside, so they get a margin
     box and no padding box at all — NEW-ELEMENT-PANELS-SPEC §3.6/§3.14. Showing both and letting one
     do nothing is the failure that spec spends its first section arguing against. */
  only?: Ring;
  /* ⚠️ What the element ACTUALLY has on the sides nobody has set. See the grey/dark note above. */
  resting?: { padding?: SpacingBox; margin?: SpacingBox };
  /* The node on the canvas, so hovering a side can light that band. Optional: the legacy element
     panel has no id to give, and the fields are still correct without the highlight. */
  nodeId?: string;
}

/** An element that paints its own card keeps its padding on the card, one level in. */
function padBoxOf(el: HTMLElement): HTMLElement {
  const cs = getComputedStyle(el);
  const flat = (['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const)
    .every((k) => parseFloat(cs[k]) === 0);
  return flat ? ((el.firstElementChild as HTMLElement | null) ?? el) : el;
}

/** Measures an element's resting padding and margin off the canvas — every side in px, the unit the
 *  fields are in. (It used to convert the horizontal pair to a % of the parent, because that was the
 *  unit they were stored in; nothing is a percentage any more.) */
export function useRestingSpacing(nodeId: string, deps: unknown): { padding?: SpacingBox; margin?: SpacingBox } {
  const [box, setBox] = useState<{ padding?: SpacingBox; margin?: SpacingBox }>({});
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-node="${CSS.escape(nodeId)}"]`) as HTMLElement | null;
      if (!el) { setBox({}); return; }
      const px = (v: string) => Math.round(parseFloat(v) || 0);
      /* The banner pads the items at its EDGES rather than itself, 24px on every side while unset. */
      if (nodeId === 'hero') {
        setBox({ padding: { top: 24, bottom: 24, left: 24, right: 24 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        return;
      }
      const cs = getComputedStyle(el);
      const p = getComputedStyle(padBoxOf(el));
      setBox({
        padding: { top: px(p.paddingTop), bottom: px(p.paddingBottom), left: px(p.paddingLeft), right: px(p.paddingRight) },
        margin: { top: px(cs.marginTop), bottom: px(cs.marginBottom), left: px(cs.marginLeft), right: px(cs.marginRight) },
      });
    };
    measure();
    const t = window.setTimeout(measure, 60);
    return () => window.clearTimeout(t);
  }, [nodeId, JSON.stringify(deps)]);
  return box;
}

const isH = (s: Side) => s === 'left' || s === 'right';
/* ⚠️ EVERY SIDE IS px. Left and right used to be a PERCENTAGE of the parent, which is why the panel
   had to print its units in a caption and why one control carried two scales. An admin setting the room
   inside a card is thinking in the same unit on all four sides, and a % that reads 3 while painting 32
   pixels is a number that answers a question nobody asked. The switch reaches the nine places that
   emitted the horizontal sides — see the px bullet in CLAUDE.md, including the banner templates, whose
   authored percentages were converted at the width they were designed against. */
const unitOf = (_s: Side) => 'px';
const maxOf = (_s: Side) => 200;
const AXES = { v: ['top', 'bottom'] as Side[], h: ['left', 'right'] as Side[] };

/* ── The band the hovered side owns, drawn over the canvas ──────────────────────────────────────
 *
 * ⚠️ MAGENTA, the same `#FF24BD` the gap strips use: this product already says "space you are
 * setting" in that colour, and a second colour for the same idea would be a second language.
 * ⚠️ A band with no thickness is drawn as a 2px line rather than skipped — hovering "top" when the
 * top is 0 still has to answer WHICH edge that is, which is exactly when you need to be told. */
function SpacingHint({ nodeId, ring, side }: { nodeId: string; ring: Ring; side: Side }) {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const el = document.querySelector(`[data-node="${CSS.escape(nodeId)}"]`) as HTMLElement | null;
    if (!el) { setBox(null); return; }
    const target = ring === 'padding' ? padBoxOf(el) : el;
    const r = target.getBoundingClientRect();
    const cs = getComputedStyle(target);
    const v = (k: string) => Math.max(0, parseFloat(cs[k as 'marginTop']) || 0);
    const thin = (n: number) => Math.max(n, 2);
    if (ring === 'margin') {
      const m = { top: v('marginTop'), right: v('marginRight'), bottom: v('marginBottom'), left: v('marginLeft') };
      setBox(
        side === 'top' ? { left: r.left, top: r.top - m.top, width: r.width, height: thin(m.top) }
        : side === 'bottom' ? { left: r.left, top: r.bottom, width: r.width, height: thin(m.bottom) }
        : side === 'left' ? { left: r.left - m.left, top: r.top, width: thin(m.left), height: r.height }
        : { left: r.right, top: r.top, width: thin(m.right), height: r.height },
      );
      return;
    }
    const p = { top: v('paddingTop'), right: v('paddingRight'), bottom: v('paddingBottom'), left: v('paddingLeft') };
    setBox(
      side === 'top' ? { left: r.left, top: r.top, width: r.width, height: thin(p.top) }
      : side === 'bottom' ? { left: r.left, top: r.bottom - p.bottom, width: r.width, height: thin(p.bottom) }
      : side === 'left' ? { left: r.left, top: r.top, width: thin(p.left), height: r.height }
      : { left: r.right - p.right, top: r.top, width: thin(p.right), height: r.height },
    );
  }, [nodeId, ring, side]);
  if (!box) return null;
  return createPortal(
    <span
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      className="pointer-events-none fixed z-[9999] bg-[#FF24BD]/25 outline outline-1 outline-[#FF24BD]"
    />,
    document.body,
  );
}

/* ── One side, as a real field ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ It LOOKS like an input — a bordered box at the product's 32px control height — where it used to
 * be bare text that only revealed a border on hover. A number you can edit and a number you can only
 * read are the same picture until you touch one, and the admin reading this panel has no reason to
 * touch anything to find out which it is.
 * ⚠️ Click to type, drag sideways to scrub, and the two do not fight: a press becomes a scrub only
 * after the pointer has travelled 3px. Under that it is a plain click and the field takes focus, or a
 * control that looks like a field would refuse to be typed in.
* ⚠️ `lead` is the glyph INSIDE the box saying which side or axis it is, rather than a label beside
 * it — that is what lets a row stay one line of equal boxes at any sidebar width.
 * ⚠️ The UNIT is a divided cell on the right, not a word floating beside the number: the box then reads
 * as two parts — the thing you type in, and the thing it is measured in — and the typing part gets the
 * width, which is the part being used. A bare "24 px" centred in a box is one blob of grey text.
 * ⚠️ The value is ALWAYS at full strength. It used to go grey whenever nobody had set that side, to say
 * "this is the element's own" — true, secondary, and indistinguishable from a disabled field, which is
 * how a panel of eight real inputs came to look switched off. The number is correct either way; the
 * only thing the grey carried was who put it there.
 * ⚠️ Every box is `flex-1` or a grid cell, never a fixed width, so a row always fills the panel
 * however wide the admin has dragged it. */
function SideField({ value, own, unit, max, lead, onSet, onHover, placeholder }: {
  value: number | null; own: boolean; unit: string; max: number; lead?: ReactNode;
  onSet: (v: number) => void; onHover?: (on: boolean) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const clamp = (n: number) => Math.max(0, Math.min(max, unit === '%' ? Math.round(n * 10) / 10 : Math.round(n)));
  const onDown = (e: React.PointerEvent) => {
    const start = { x: e.clientX, v: value ?? 0, moved: false };
    const move = (ev: PointerEvent) => {
      const d = ev.clientX - start.x;
      if (!start.moved && Math.abs(d) < 3) return;
      start.moved = true;
      ref.current?.blur();
      setTyping(null);
      onSet(clamp(start.v + d * (unit === '%' ? 0.1 : 1)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <label
      className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded border border-[#DFE5ED] bg-white transition-colors focus-within:border-[#3D8BD0] focus-within:ring-2 focus-within:ring-[#3D8BD0]/15 hover:border-[#C3CBD6]"
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
    >
      {lead && <span className="flex flex-shrink-0 items-center pl-2 text-[#94A3B8]">{lead}</span>}
      <input
        ref={ref}
        value={typing ?? (value === null ? '' : String(value))}
        placeholder={placeholder}
        onPointerDown={onDown}
        onChange={(e) => { setTyping(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && e.target.value !== '') onSet(clamp(n)); }}
        onBlur={() => setTyping(null)}
        /* `ew-resize` is the whole hint that this number drags — the cursor every design tool uses for
           a scrubber, and it costs no pixels on a control this small. */
        className="w-full min-w-0 cursor-ew-resize bg-transparent px-2 text-[12.5px] font-medium tabular-nums text-[#364658] outline-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#B3BECC] focus:cursor-text"
      />
      <span className="flex h-full flex-shrink-0 items-center border-l border-[#EEF1F5] bg-[#F8FAFC] px-1.5 text-[10px] font-medium text-[#94A3B8]">{unit}</span>
    </label>
  );
}

/** One axis's chain. ⚠️ It sits in the ring's HEADER, not between the two fields it ties: in a row of
 *  four there is no "between", and in the box layout the two points a chain would want are already
 *  taken by the fields. The axis glyph beside the chain is what says WHICH pair it holds. */
function LinkToggle({ axis, on, onToggle }: { axis: 'v' | 'h'; on: boolean; onToggle: () => void }) {
  const pair = axis === 'v' ? 'Top and bottom' : 'Left and right';
  return (
    <button
      type="button"
      title={on ? `${pair} move together — click to set them apart` : `${pair} are separate — click to tie them`}
      aria-label={`${pair} linked`}
      aria-pressed={on}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`flex h-6 items-center gap-0.5 rounded px-1 transition-colors ${
        on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#C3CBD6] hover:bg-[#F1F5F9] hover:text-[#64748B]'
      }`}
    >
      {axis === 'v' ? <MoveVertical size={11} /> : <MoveHorizontal size={11} />}
      {on ? <Link2 size={11} /> : <Link2Off size={11} />}
    </button>
  );
}

export function SpacingMatrix({ style, onChange, only, resting, nodeId }: Props) {
  const [tab, setTab] = useState<'two' | 'sides'>('two');
  const [open, setOpen] = useState<Ring | null>(null);
  const [hint, setHint] = useState<{ ring: Ring; side: Side } | null>(null);

  /* ⚠️ An EMPTY box, not ZERO_BOX. Merging over four zeros is what made one control write all four
     sides; merging over nothing leaves the sides you did not touch unset, so the element keeps the
     spacing it already had on those edges. */
  const boxOf = (r: Ring): SpacingBox => (r === 'margin' ? style.margin : style.padding) ?? {};
  /* ⚠️ Unset reads as LINKED — both chains start on. Typing one number and having both sides of that
     axis move is what almost every real edit wants, and an admin who needs one side uneven breaks the
     chain deliberately. */
  const linked = (r: Ring, a: 'v' | 'h'): boolean =>
    (style as Record<string, unknown>)[`${r}Link${a === 'v' ? 'V' : 'H'}`] !== false;
  const toggleLink = (r: Ring, a: 'v' | 'h') =>
    onChange({ [`${r}Link${a === 'v' ? 'V' : 'H'}`]: !linked(r, a) } as Partial<NodeStyle>);

  const ownSet = (r: Ring, s: Side) => boxOf(r)[s] !== undefined;
  /** A side's value as the element really has it: the one set here, else what it rests at. */
  const sideOf = (r: Ring, s: Side): number => {
    const own = boxOf(r)[s];
    if (own !== undefined) return own;
    const rest = resting?.[r]?.[s];
    return Number.isFinite(rest) ? Number(rest) : 0;
  };
  /** The pair's value, or null when its two sides disagree — which is what the "Mixed" hint means. */
  const pairOf = (r: Ring, a: 'v' | 'h'): number | null => {
    const [x, y] = AXES[a];
    return sideOf(r, x) === sideOf(r, y) ? sideOf(r, x) : null;
  };
  const write = (r: Ring, next: SpacingBox) => onChange(r === 'margin' ? { margin: next } : { padding: next });

  /* ⚠️ A linked axis writes BOTH of its sides, and the two axes are never written together: they carry
     different units, so copying 24 from a px side into a % side would set a quarter of the parent. */
  const setSide = (r: Ring, side: Side, v: number) => {
    const box = boxOf(r);
    const a = isH(side) ? 'h' : 'v';
    if (!linked(r, a)) { write(r, { ...box, [side]: v }); return; }
    const [x, y] = AXES[a];
    write(r, { ...box, [x]: v, [y]: v });
  };
  const setPair = (r: Ring, a: 'v' | 'h', v: number) => {
    const [x, y] = AXES[a];
    write(r, { ...boxOf(r), [x]: v, [y]: v });
  };

  const rings: Ring[] = only === 'margin' ? ['margin'] : only === 'padding' ? ['padding'] : ['padding', 'margin'];
  const hover = (r: Ring, s: Side) => (on: boolean) => setHint(on ? { ring: r, side: s } : null);

  const field = (r: Ring, s: Side, lead?: ReactNode) => (
    <SideField
      key={`${r}-${s}`}
      value={sideOf(r, s)}
      own={ownSet(r, s)}
      unit={unitOf(s)}
      max={maxOf(s)}
      lead={lead}
      onSet={(v) => setSide(r, s, v)}
      onHover={hover(r, s)}
    />
  );

  /** The ring's name and its two chains — ONE header for both designs, so they cannot drift apart. */
  const head = (r: Ring, trailing?: ReactNode) => (
    <div className="mb-1.5 flex items-center gap-1">
      <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{r}</span>
      <LinkToggle axis="v" on={linked(r, 'v')} onToggle={() => toggleLink(r, 'v')} />
      <LinkToggle axis="h" on={linked(r, 'h')} onToggle={() => toggleLink(r, 'h')} />
      {trailing}
    </div>
  );

  /* ── A — TWO FIELDS, the four sides on demand ───────────────────────────────────────────────────
   * Two numbers on arrival instead of eight, which is what a linked pair of pairs already is. The
   * chevron opens the four, laid out WHERE THEY ARE around a plate rather than as a list: the one
   * thing a non-designer gets from this control is which box is which edge, and four rows labelled
   * top / right / bottom / left is a list you have to read. */
  const twoFields = (r: Ring) => (
    <div key={r} className="mt-3 first:mt-0">
      {head(r, (
        <button
          type="button"
          title={open === r ? 'Close the four sides' : 'Set each side on its own'}
          onClick={(e) => { e.stopPropagation(); setOpen(open === r ? null : r); }}
          className={`flex size-6 items-center justify-center rounded transition-colors ${
            open === r ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#364658]'
          }`}
        >{open === r ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      ))}
      {open === r ? (
        /* ⚠️ No glyphs in here: a box above the plate IS the top, so an arrow inside it labels what its
           position already says, and the width it costs is width the number wanted. */
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <div className="flex">{field(r, 'top')}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {field(r, 'left')}
            <span className="flex h-8 flex-1 items-center justify-center rounded bg-[#EBF5FF] text-[9px] font-semibold uppercase tracking-wider text-[#3D8BD0]">Element</span>
            {field(r, 'right')}
          </div>
          <div className="mt-1.5 flex">{field(r, 'bottom')}</div>
        </div>
      ) : (
        <div className="flex gap-1.5">
          {/* ⚠️ These two write the PAIR whatever the chains say — they ARE the pair. A chain broken in
              the open view leaves its sides uneven, and then the collapsed field reads "Mixed" rather
              than picking one of the two to report as though they agreed. */}
          <SideField
            value={pairOf(r, 'v')}
            own={ownSet(r, 'top') || ownSet(r, 'bottom')}
            unit="px" max={200} placeholder="Mixed"
            lead={<MoveVertical size={11} />}
            onSet={(v) => setPair(r, 'v', v)}
            onHover={hover(r, 'top')}
          />
          <SideField
            value={pairOf(r, 'h')}
            own={ownSet(r, 'left') || ownSet(r, 'right')}
            unit="px" max={200} placeholder="Mixed"
            lead={<MoveHorizontal size={11} />}
            onSet={(v) => setPair(r, 'h', v)}
            onHover={hover(r, 'left')}
          />
        </div>
      )}
    </div>
  );

  /* ── B — FOUR LABELLED FIELDS ───────────────────────────────────────────────────────────────────
   * One row of four, tagged ↑ → ↓ ← in reading order. The shortest of the two and the most explicit;
   * what it trades away is the picture — an arrow in a box is a symbol you learn, where a box drawn
   * around a plate is one you read. */
  const fourSides = (r: Ring) => (
    <div key={r} className="mt-3 first:mt-0">
      {head(r)}
      {/* ⚠️ TOP beside BOTTOM, then LEFT beside RIGHT — not one row of ↑ → ↓ ←. The two chains in
          the header above tie exactly these pairs, so a line per pair is the grouping those controls
          already describe; across one row the sides a chain held were the first box and the third. It
          also gives every field twice the width, which is where the number goes. */}
      <div className="grid grid-cols-2 gap-1.5">
        {field(r, 'top', <ArrowUp size={11} />)}
        {field(r, 'bottom', <ArrowDown size={11} />)}
        {field(r, 'left', <ArrowLeft size={11} />)}
        {field(r, 'right', <ArrowRight size={11} />)}
      </div>
    </div>
  );

  return (
    <div>
      {/* ⚠️ The product's own segmented treatment — a strip whose options ALL carry a label is a set of
          tabs, so it takes the pill on a track rather than the bordered buttons an icon strip gets. */}
      <div className="mb-2.5 flex gap-0.5 rounded bg-[#F1F5F9] p-0.5">
        {([['two', 'Two fields'], ['sides', 'Four sides']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={(e) => { e.stopPropagation(); setTab(k); }}
            className={`h-6 flex-1 rounded text-[11px] font-medium transition-colors ${
              tab === k ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
            }`}
          >{label}</button>
        ))}
      </div>
      {rings.map((r) => (tab === 'two' ? twoFields(r) : fourSides(r)))}
      {nodeId && hint && <SpacingHint nodeId={nodeId} ring={hint.ring} side={hint.side} />}
    </div>
  );
}
