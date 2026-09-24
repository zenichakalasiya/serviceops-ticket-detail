import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link2, Link2Off } from 'lucide-react';
import type { NodeStyle, SpacingBox } from './portalPageModel';

/* Padding and margin, as ONE nested-box diagram.
 *
 * ⚠️ Margin is the outer ring, padding the inner one, and the element sits in the middle — the box
 * model as every builder draws it (Duda, Webflow, Framer, and the browser's own inspector). One
 * picture answers what two stacked blocks of sliders could not: which of the two rings you are
 * setting, and what the other seven sides currently are.
 *
 * ⚠️ THE NUMBERS ARE THE TARGETS, not the edges. That is the whole difference from the first matrix
 * this replaced, which was dropped because changing one side meant aiming at a hairline. Every side
 * here is a real input — click it and type, or drag sideways on it to scrub — so the smallest thing
 * you have to hit is a 38px field.
 *
 * ⚠️ An unset side shows what the element RESTS at, in grey. A section carries 24px either side from
 * its own classes, so printing 0 there said there was no space when there plainly was, and gave no
 * way to tell that typing 0 would remove it. Grey = the element's own; dark = a number somebody set.
 *
 * ⚠️ Vertical sides are px and horizontal sides are %, the product's convention — stated once in the
 * head rather than repeated eight times, and carried on each field as its suffix. */

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
     panel has no id to give, and the diagram is still correct without the highlight. */
  nodeId?: string;
}

/** An element that paints its own card keeps its padding on the card, one level in. */
function padBoxOf(el: HTMLElement): HTMLElement {
  const cs = getComputedStyle(el);
  const flat = (['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const)
    .every((k) => parseFloat(cs[k]) === 0);
  return flat ? ((el.firstElementChild as HTMLElement | null) ?? el) : el;
}

/** Measures an element's resting padding and margin off the canvas. Horizontal sides come back as a % of
 *  the parent's width — the unit those fields are in — and vertical sides in px. */
export function useRestingSpacing(nodeId: string, deps: unknown): { padding?: SpacingBox; margin?: SpacingBox } {
  const [box, setBox] = useState<{ padding?: SpacingBox; margin?: SpacingBox }>({});
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-node="${CSS.escape(nodeId)}"]`) as HTMLElement | null;
      if (!el) { setBox({}); return; }
      const parentW = el.parentElement?.clientWidth || el.clientWidth || 1;
      const pct = (px: number) => Math.round((px / parentW) * 1000) / 10;
      /* The banner pads the items at its EDGES rather than itself, 24px on every side while unset. */
      if (nodeId === 'hero') {
        const w = (el.querySelector('[data-banner-band]') as HTMLElement | null)?.clientWidth || el.clientWidth || 1;
        const h = Math.round((24 / w) * 1000) / 10;
        setBox({ padding: { top: 24, bottom: 24, left: h, right: h }, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        return;
      }
      const cs = getComputedStyle(el);
      const p = getComputedStyle(padBoxOf(el));
      setBox({
        padding: { top: Math.round(parseFloat(p.paddingTop)), bottom: Math.round(parseFloat(p.paddingBottom)), left: pct(parseFloat(p.paddingLeft)), right: pct(parseFloat(p.paddingRight)) },
        margin: { top: Math.round(parseFloat(cs.marginTop)), bottom: Math.round(parseFloat(cs.marginBottom)), left: pct(parseFloat(cs.marginLeft)), right: pct(parseFloat(cs.marginRight)) },
      });
    };
    measure();
    const t = window.setTimeout(measure, 60);
    return () => window.clearTimeout(t);
  }, [nodeId, JSON.stringify(deps)]);
  return box;
}

const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
const isH = (s: Side) => s === 'left' || s === 'right';
const unitOf = (s: Side) => (isH(s) ? '%' : 'px');
const maxOf = (s: Side) => (isH(s) ? 50 : 200);

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

/* One side. ⚠️ Click to type, drag sideways to scrub — and the two do not fight, because a press only
   becomes a scrub once the pointer has actually travelled 3px. Under that it is a plain click and the
   field takes focus, which is what a field that looks like a field has to do. */
function SideField({ value, own, unit, max, onSet, onHover }: {
  value: number; own: boolean; unit: string; max: number;
  onSet: (v: number) => void; onHover: (on: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const clamp = (n: number) => Math.max(0, Math.min(max, unit === '%' ? Math.round(n * 10) / 10 : Math.round(n)));
  const onDown = (e: React.PointerEvent) => {
    const start = { x: e.clientX, v: value, moved: false };
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
    <span
      className="relative flex-shrink-0"
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <input
        ref={ref}
        value={typing ?? String(value)}
        onPointerDown={onDown}
        onChange={(e) => { setTyping(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n)) onSet(clamp(n)); }}
        onBlur={() => setTyping(null)}
        /* `ew-resize` is the whole hint that this number is draggable — it is the cursor every design
           tool uses for a scrubber, and it costs no pixels on a control this small. */
        className={`h-[26px] w-[42px] cursor-ew-resize rounded border border-transparent bg-transparent pr-[13px] text-center text-[11px] tabular-nums outline-none transition-colors hover:border-[#DFE5ED] hover:bg-white focus:cursor-text focus:border-[#3D8BD0] focus:bg-white ${
          own ? 'font-medium text-[#364658]' : 'text-[#9CA3AF]'
        }`}
      />
      <span className="pointer-events-none absolute right-[4px] top-1/2 -translate-y-1/2 text-[9px] text-[#B3BECC]">{unit}</span>
    </span>
  );
}

export function SpacingMatrix({ style, onChange, only, resting, nodeId }: Props) {
  const [hint, setHint] = useState<{ ring: Ring; side: Side } | null>(null);

  /* ⚠️ An EMPTY box, not ZERO_BOX. Merging over four zeros is what made one control write all four
     sides; merging over nothing leaves the sides you did not touch unset, so the element keeps the
     spacing it already had on those edges. */
  const boxOf = (r: Ring): SpacingBox => (r === 'margin' ? style.margin : style.padding) ?? {};
  const linked = (r: Ring) => (r === 'margin' ? style.marginLinked : style.paddingLinked) ?? false;
  const ownSet = (r: Ring, s: Side) => boxOf(r)[s] !== undefined;
  /** A side's value as the element really has it: the one set here, else what it rests at. */
  const sideOf = (r: Ring, s: Side): number => {
    const own = boxOf(r)[s];
    if (own !== undefined) return own;
    const rest = resting?.[r]?.[s];
    return Number.isFinite(rest) ? Number(rest) : 0;
  };
  const write = (r: Ring, next: SpacingBox) => onChange(r === 'margin' ? { margin: next } : { padding: next });

  /* ⚠️ Linked writes all four, and the two axes carry DIFFERENT UNITS — so it writes the number to the
     axis you typed it on and leaves the other axis alone in value but tied in intent. Copying 24 from a
     px side into a % side would set a quarter of the parent's width. */
  const setSide = (r: Ring, side: Side, v: number) => {
    const box = boxOf(r);
    if (!linked(r)) { write(r, { ...box, [side]: v }); return; }
    const pair: Side[] = isH(side) ? ['left', 'right'] : ['top', 'bottom'];
    write(r, { ...box, [pair[0]]: v, [pair[1]]: v });
  };

  const toggleLink = (r: Ring) =>
    onChange(r === 'margin' ? { marginLinked: !linked(r) } : { paddingLinked: !linked(r) });

  const field = (r: Ring, side: Side) => (
    <SideField
      key={`${r}-${side}`}
      value={sideOf(r, side)}
      own={ownSet(r, side)}
      unit={unitOf(side)}
      max={maxOf(side)}
      onSet={(v) => setSide(r, side, v)}
      onHover={(on) => setHint(on ? { ring: r, side } : null)}
    />
  );

  const ring = (r: Ring, children: React.ReactNode) => {
    const on = linked(r);
    return (
      <div className={`rounded-lg p-1.5 ${r === 'margin' ? 'border border-dashed border-[#CBD5E1] bg-[#F8FAFC]' : 'border border-[#E2E8F0] bg-white'}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{r}</span>
          {field(r, 'top')}
          <span className="flex justify-end">
            <button
              onClick={() => toggleLink(r)}
              title={on ? `Each side of the ${r} on its own` : `Tie the ${r}'s opposite sides together`}
              className={`flex size-5 items-center justify-center rounded transition-colors ${
                on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#C3CBD6] hover:bg-[#F1F5F9] hover:text-[#64748B]'
              }`}
            >{on ? <Link2 size={12} /> : <Link2Off size={12} />}</button>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {field(r, 'left')}
          <span className="min-w-0 flex-1">{children}</span>
          {field(r, 'right')}
        </div>
        <div className="flex justify-center">{field(r, 'bottom')}</div>
      </div>
    );
  };

  /* The content box — what the two rings are measured from. No size on it: this control is about the
     space around the element, and a width nobody can edit here would read as one more field. */
  const plate = (
    <span className="flex h-[26px] items-center justify-center rounded bg-[#EBF5FF] text-[9px] font-semibold uppercase tracking-wider text-[#3D8BD0]">
      Element
    </span>
  );

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
        <span>Up and down in px</span><span className="text-[#DFE5ED]">·</span><span>left and right in %</span>
      </p>
      {only === 'padding' ? ring('padding', plate)
        : only === 'margin' ? ring('margin', plate)
        : ring('margin', ring('padding', plate))}
      {nodeId && hint && <SpacingHint nodeId={nodeId} ring={hint.ring} side={hint.side} />}
    </div>
  );
}
