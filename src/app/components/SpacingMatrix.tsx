import { useLayoutEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ZERO_BOX } from './portalPageModel';
import type { NodeStyle, SpacingBox } from './portalPageModel';

/* Padding and margin, as two sliders each.
 *
 * ⚠️ Replaces the nested-box matrix. The matrix showed four sides at once and made you aim at a
 * small edge to change one; almost every real edit is "more room above and below" or "more room
 * left and right". So the resting control is one slider per AXIS — vertical and horizontal — and
 * the four individual sides live behind the advanced button on each row, for the times they differ.
 *
 * ⚠️ Dragging an axis writes BOTH of its sides. That is what makes the slider honest: the number
 * under the handle is the value both sides now hold, not an average of two that disagree. Sides set
 * separately in advanced mode are shown as a dash until the axis is dragged again. */

type Ring = 'margin' | 'padding';
type Side = keyof SpacingBox;

interface Props {
  style: NodeStyle;
  onChange: (patch: Partial<NodeStyle>) => void;
  /* ⚠️ Restricts the widget to ONE ring. A divider and a shape have no inside, so they get a margin
     box and no padding box at all — NEW-ELEMENT-PANELS-SPEC §3.6/§3.14. Showing both and letting one
     do nothing is the failure that spec spends its first section arguing against. */
  only?: Ring;
  /* ⚠️ What the element ACTUALLY has on the sides nobody has set. A section carries 24px either side and a
     banner 24px all round from their own classes, so an unset side showing "0" told the admin there was no
     space when there plainly was — and gave no way to know that typing 0 would remove it. */
  resting?: { padding?: SpacingBox; margin?: SpacingBox };
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
      /* An element that paints its own card keeps its padding on the card, one level in. */
      let padEl: HTMLElement = el;
      const cs = getComputedStyle(el);
      if (['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].every((k) => parseFloat(cs[k as 'paddingTop']) === 0)) {
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) padEl = inner;
      }
      const p = getComputedStyle(padEl);
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

const AXES = {
  vertical: ['top', 'bottom'] as Side[],
  horizontal: ['left', 'right'] as Side[],
};
type Axis = keyof typeof AXES;

/** Vertical sides are px, horizontal are %, matching the rest of the product. */
const unitOf = (axis: Axis) => (axis === 'horizontal' ? '%' : 'px');
const maxOf = (axis: Axis) => (axis === 'horizontal' ? 50 : 120);

/* The axis glyphs: a dashed box with the two edges this row controls drawn solid. Reading which
   pair a slider moves off a picture is faster than reading the words "top and bottom". */
function AxisIcon({ axis }: { axis: Axis }) {
  const solid = '#64748B';
  const dash = '#CBD5E1';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      {axis === 'vertical' ? (
        <>
          <path d="M3 3h12M3 15h12" stroke={solid} strokeWidth="2" strokeLinecap="round" />
          <path d="M3 6v6M15 6v6" stroke={dash} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M3 3v12M15 3v12" stroke={solid} strokeWidth="2" strokeLinecap="round" />
          <path d="M6 3h6M6 15h6" stroke={dash} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function SpacingMatrix({ style, onChange, only, resting }: Props) {
  const [advanced, setAdvanced] = useState<string | null>(null);
  const [live, setLive] = useState<string | null>(null);

  /* ⚠️ An EMPTY box, not ZERO_BOX. Merging over four zeros is what made one slider write all four
     sides; merging over nothing leaves the sides you did not touch unset, so the element keeps the
     spacing it already had on those edges. */
  const boxOf = (r: Ring): SpacingBox => (r === 'margin' ? style.margin : style.padding) ?? {};
  /** A side's value as the element really has it: the one set here, else what it rests at. */
  const sideOf = (r: Ring, s: Side): number => {
    const own = boxOf(r)[s];
    if (own !== undefined) return own;
    const rest = resting?.[r]?.[s];
    return Number.isFinite(rest) ? Number(rest) : 0;
  };
  const write = (r: Ring, next: SpacingBox) =>
    onChange(r === 'margin' ? { margin: next } : { padding: next });

  /** The axis value, or null when its two sides were set to different numbers. */
  const axisValue = (r: Ring, axis: Axis): number | null => {
    const [a, b] = AXES[axis];
    const va = sideOf(r, a);
    const vb = sideOf(r, b);
    return va === vb ? va : null;
  };

  const setAxis = (r: Ring, axis: Axis, v: number) => {
    const box = boxOf(r);
    const [a, b] = AXES[axis];
    write(r, { ...box, [a]: v, [b]: v });
  };

  const setSide = (r: Ring, side: Side, v: number) => write(r, { ...boxOf(r), [side]: v });

  const row = (r: Ring, axis: Axis) => {
    const key = `${r}-${axis}`;
    const value = axisValue(r, axis);
    const unit = unitOf(axis);
    const open = advanced === key;
    return (
      <div key={key}>
        <div className="flex items-center gap-2.5">
          <span className="flex-shrink-0 text-[#64748B]"><AxisIcon axis={axis} /></span>

          <span className="relative flex-1">
            <input
              type="range"
              min={0}
              max={maxOf(axis)}
              step={axis === 'horizontal' ? 0.1 : 1}
              value={value ?? 0}
              onChange={(e) => setAxis(r, axis, Number(e.target.value))}
              onMouseDown={() => setLive(key)}
              onMouseUp={() => setLive(null)}
              onBlur={() => setLive(null)}
              className="portal-range w-full"
            />
            {/* The bubble only while dragging — a value permanently under the handle competes with
                the number the advanced rows already show. */}
            {live === key && (
              <span className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[11px] font-medium text-white">
                {value ?? 0}
              </span>
            )}
          </span>

          <button
            onClick={() => setAdvanced(open ? null : key)}
            title={open ? 'Hide the individual sides' : 'Set each side separately'}
            className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors ${
              open ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#364658]'
            }`}
          ><SlidersHorizontal size={14} /></button>
        </div>

        {open && (
          <div className="mt-2 flex gap-2 pl-7">
            {AXES[axis].map((side) => (
              <label key={side} className="flex flex-1 items-center gap-1.5">
                <span className="w-10 flex-shrink-0 text-[11px] capitalize text-[#9CA3AF]">{side}</span>
                <span className="relative flex-1">
                  <input
                    type="number"
                    value={sideOf(r, side)}
                    onChange={(e) => setSide(r, side, Number(e.target.value))}
                    className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-2 pr-6 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">{unit}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const block = (r: Ring) => (
    <div className="mt-4 first:mt-0">
      <div className="mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{r}</span>
      </div>
      <div className="space-y-3">
        {row(r, 'vertical')}
        {row(r, 'horizontal')}
      </div>
    </div>
  );

  return (
    <div>
      {only !== 'margin' && block('padding')}
      {only !== 'padding' && block('margin')}
    </div>
  );
}
