/* Support Portal builder — the box controls: radius, border, shadow, size.
 *
 * Four controls that every element with a box needs, built ONCE here and reused everywhere. Each
 * follows the same two rules from NEW-ELEMENT-PANELS-SPEC §1.3:
 *
 *   • the ⚙ gear opens the advanced form for that property, so the panel stays shallow without
 *     hiding capability — one number by default, four when you want them;
 *   • a unit dropdown sits beside the numeric field rather than the unit being assumed.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { MiniRange } from './PortalRange';
import { Info, Settings2 } from 'lucide-react';
import { shadowString } from './portalStyleResolver';
import { ColorField } from './PortalColorPicker';

const num = 'h-8 w-[54px] rounded-l border border-[#d1d5db] px-2 text-center text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none';
const unitBox = 'flex h-8 items-center rounded-r border border-l-0 border-[#d1d5db] bg-[#F9FAFB] px-2 text-[11px] text-[#7B8FA5]';

function Head({ label, gear, onGear }: { label: string; gear?: boolean; onGear?: () => void }) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <span className="text-[12px] font-normal text-[#7B8FA5]">{label}</span>
      {onGear && (
        <button
          onClick={onGear}
          title="Advanced"
          className={`flex size-5 items-center justify-center rounded transition-colors ${
            gear ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#364658]'
          }`}
        ><Settings2 size={12} /></button>
      )}
    </div>
  );
}

/** Slider + numeric + unit, the row shape all four controls share. */
function Track({ value, onChange, min, max, unit, units, onUnit }: {
  value: number; onChange: (v: number) => void; min: number; max: number;
  unit: string; units?: string[]; onUnit?: (u: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <MiniRange min={min} max={max} value={value} onChange={onChange} />
      <span className="flex flex-shrink-0">
        <input
          type="number" min={min} max={max} value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className={num}
        />
        {units && onUnit ? (
          <select
            value={unit}
            onChange={(e) => onUnit(e.target.value)}
            className={`${unitBox} cursor-pointer appearance-none pr-2`}
          >{units.map((u) => <option key={u}>{u}</option>)}</select>
        ) : <span className={unitBox}>{unit}</span>}
      </span>
    </div>
  );
}

/* ── Corner radius ───────────────────────────────────────────────────────── */

export function RadiusRow({ value, onChange, corners, onCorners }: {
  value: number; onChange: (v: number) => void;
  corners?: { tl: number; tr: number; br: number; bl: number };
  onCorners?: (c: { tl: number; tr: number; br: number; bl: number } | undefined) => void;
}) {
  const [adv, setAdv] = useState(!!corners);
  const [unit, setUnit] = useState('px');
  const c = corners ?? { tl: value, tr: value, br: value, bl: value };
  return (
    <div className="mt-4 first:mt-0">
      <Head
        label="Corner radius"
        gear={adv}
        onGear={() => { const next = !adv; setAdv(next); if (!next) onCorners?.(undefined); }}
      />
      {adv ? (
        /* Four corners, laid out where they actually are — a 2×2 grid rather than a list, so the
           field you reach for is the corner you are looking at. */
        <div className="grid grid-cols-2 gap-1.5">
          {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
            <span key={k} className="flex">
              <input
                type="number" min={0} max={64} value={c[k]}
                onChange={(e) => onCorners?.({ ...c, [k]: Math.max(0, Math.min(64, Number(e.target.value) || 0)) })}
                className={`${num} w-full`}
              />
              <span className={unitBox}>px</span>
            </span>
          ))}
        </div>
      ) : (
        <Track value={value} onChange={onChange} min={0} max={64} unit={unit} units={['px', '%']} onUnit={setUnit} />
      )}
    </div>
  );
}

/* ── Border ──────────────────────────────────────────────────────────────── */

export interface BorderSides { top: number; right: number; bottom: number; left: number }

export function BorderRow({ width, color, sides, onWidth, onColor, onSides, colorModes, stroke, onStroke }: {
  width: number; color: string; sides?: BorderSides;
  onWidth: (v: number) => void; onColor: (v: string) => void;
  /* The line's STYLE — solid, dashed or dotted. Optional, so a caller that never offered one is
     unchanged; shown only while there is a border, because a dash pattern on 0px is nothing. */
  stroke?: string;
  onStroke?: (v: string) => void;
  onSides?: (s: BorderSides | undefined) => void;
  /* The border colour's light and dark values, forwarded straight to `ColorField`.
     ⚠️ Passed in rather than resolved here: this component takes plain values and knows nothing
     about the style store, which is what lets it serve the packs and the legacy panel alike. */
  colorModes?: {
    mode: 'light' | 'dark';
    light: string;
    dark: string;
    onChange: (mode: 'light' | 'dark', v: string) => void;
  };
}) {
  const [adv, setAdv] = useState(!!sides);
  const s = sides ?? { top: width, right: width, bottom: width, left: width };
  return (
    <div className="mt-4 first:mt-0">
      <Head
        label="Border"
        gear={adv}
        onGear={() => { const next = !adv; setAdv(next); onSides?.(next ? s : undefined); }}
      />
      {adv ? (
        /* Four sides, each with its own stroke. Laid out where they actually are — top above,
           left and right beside each other, bottom below — so the field you reach for is the edge
           you are looking at, not the third row of a list. */
        <>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {(['top', 'right', 'bottom', 'left'] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="w-[42px] flex-shrink-0 text-[11px] capitalize text-[#9CA3AF]">{k}</span>
                <span className="flex min-w-0">
                  <input
                    type="number" min={0} max={12} value={s[k]}
                    onChange={(e) => onSides?.({ ...s, [k]: Math.max(0, Math.min(12, Number(e.target.value) || 0)) })}
                    className={`${num} w-full`}
                  />
                  <span className={unitBox}>px</span>
                </span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[12px] font-normal text-[#7B8FA5]">Colour</span>
            <span className="w-[38px]"><ColorField compact value={color} onChange={onColor} modes={colorModes} /></span>
          </div>
        </>
      ) : (
        /* Width, its number and the colour on ONE row — a border is one decision, not three. */
        <div className="flex items-center gap-2.5">
          <MiniRange min={0} max={12} value={width} label="Border weight" onChange={onWidth} />
          <span className="flex flex-shrink-0">
            <input
              type="number" min={0} max={12} value={width}
              onChange={(e) => onWidth(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
              className={num}
            />
            <span className={unitBox}>px</span>
          </span>
          <span className="w-[38px] flex-shrink-0"><ColorField compact value={color} onChange={onColor} modes={colorModes} /></span>
        </div>
      )}
      {onStroke && (adv ? Math.max(s.top, s.right, s.bottom, s.left) : width) > 0 && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[12px] font-normal text-[#7B8FA5]">Stroke</span>
          <span className="flex rounded border border-[#DFE5ED] bg-white p-0.5">
            {(['solid', 'dashed', 'dotted'] as const).map((k) => (
              <button
                key={k}
                onClick={() => onStroke(k)}
                title={k}
                className={`flex h-6 w-10 items-center justify-center rounded transition-colors ${
                  (stroke ?? 'solid') === k ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'
                }`}
              >
                {/* The stroke drawn, not named — a dotted line says "dotted" better than the word. */}
                <span className="block w-6" style={{ borderTop: `2px ${k} ${(stroke ?? 'solid') === k ? '#3D8BD0' : '#64748B'}` }} />
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Shadow ──────────────────────────────────────────────────────────────── */

const POS = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'];

export interface ShadowValue { on: boolean; color: string; type: 'outer' | 'inner'; pos: string }

export function ShadowBlock({ value, onChange, label = 'Shadow' }: { value: ShadowValue; onChange: (v: ShadowValue) => void; label?: string }) {
  const set = (p: Partial<ShadowValue>) => onChange({ ...value, ...p });
  /* Same air above as any other switch row (ToggleRow's mt-5) — this block's first line IS a switch,
     and it commonly sits directly under one. `first:mt-0` still applies inside its Field wrapper. */
  return (
    <div className="mt-5 first:mt-0">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-[13px] text-[#364658]">{label}</span>
        <button
          role="switch"
          aria-checked={value.on}
          onClick={() => set({ on: !value.on })}
          className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${value.on ? 'bg-[#3D8BD0]' : 'bg-[#D1D5DB]'}`}
        >
          <span className={`absolute top-[2px] size-[14px] rounded-full bg-white transition-all ${value.on ? 'left-[16px]' : 'left-[2px]'}`} />
        </button>
      </label>

      {/* ⚠️ Everything below is REMOVED when the shadow is off, not greyed — a colour picker for a
          shadow nobody can see is a control with nothing behind it. */}
      {value.on && (
        <>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-normal text-[#7B8FA5]">Shadow colour</span>
            <span className="w-[176px]"><ColorField value={value.color} onChange={(v) => set({ color: v })} /></span>
          </div>

          {/* ⚠️ No Shadow type row. A shadow is an OUTER shadow — switching it on is the whole
             decision; an inset option was a second question almost nobody means to answer. */}

          {/* Direction as a 3×3, never two number fields — you are picking where light comes from. */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-normal text-[#7B8FA5]">Position</span>
            <span className="grid grid-cols-3 gap-1 rounded border border-[#DFE5ED] bg-white p-1.5">
              {POS.map((p) => (
                <button
                  key={p}
                  onClick={() => set({ pos: p })}
                  title={p}
                  className="flex size-4 items-center justify-center"
                >
                  <span className={`size-1.5 rounded-full transition-colors ${value.pos === p ? 'bg-[#F58518]' : 'bg-[#CBD5E1]'}`} />
                </button>
              ))}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/** Turns the value into a real CSS shadow, so the control is never decorative. */
export function shadowCss(v: ShadowValue | undefined): string | undefined {
  if (!v?.on) return undefined;
  /* ONE builder for both stores — see `shadowString`, which is also what `containerCss` paints. */
  return shadowString(v.color, v.type, v.pos);
}

/* ── Size ────────────────────────────────────────────────────────────────── */

export function SizeRow({ width, height, keep, onChange }: {
  width: number; height: number | null; keep: boolean;
  onChange: (p: { width?: number; height?: number | null; keep?: boolean }) => void;
}) {
  /* ⚠️ Keep proportions is what makes Height read `A` for auto rather than a number: with the ratio
     locked, height is DERIVED, and showing an editable number for something you cannot set is the
     kind of control that teaches people to distrust the panel. */
  const ratio = height && width ? height / width : null;
  return (
    <div className="mt-4 first:mt-0">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-[13px] text-[#364658]">Keep proportions</span>
        <button
          role="switch"
          aria-checked={keep}
          onClick={() => onChange({ keep: !keep })}
          className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${keep ? 'bg-[#3D8BD0]' : 'bg-[#D1D5DB]'}`}
        >
          <span className={`absolute top-[2px] size-[14px] rounded-full bg-white transition-all ${keep ? 'left-[16px]' : 'left-[2px]'}`} />
        </button>
      </label>

      <div className="mt-3">
        <Head label="Width" />
        <Track
          value={width}
          onChange={(w) => onChange({ width: w, ...(keep && ratio ? { height: Math.round(w * ratio) } : {}) })}
          min={10} max={1200} unit="px"
        />
      </div>

      <div className="mt-3">
        <Head label="Height" />
        {keep ? (
          <div className="flex items-center gap-2.5">
            <span className="h-1 min-w-0 flex-1 rounded-full bg-[#EEF2F6]" />
            <span className="flex flex-shrink-0">
              <span className={`${num} flex items-center justify-center bg-[#F9FAFB] text-[#9CA3AF]`}>—</span>
              <span className={unitBox} title="Derived from the width while proportions are locked">A</span>
            </span>
          </div>
        ) : (
          <Track value={height ?? 0} onChange={(h) => onChange({ height: h })} min={0} max={1200} unit="px" />
        )}
      </div>
    </div>
  );
}

export const BoxControls = { RadiusRow, BorderRow, ShadowBlock, SizeRow } as Record<string, ReactNode>;
