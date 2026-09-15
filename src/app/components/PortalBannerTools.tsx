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

import { ColorField } from './PortalColorPicker';

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
export function BannerFillEditor({ cfg, setCfg }: {
  cfg: Record<string, unknown>;
  setCfg: (patch: Record<string, unknown>) => void;
}) {
  const mode = String(cfg.colorMode ?? 'solid');
  const c1 = String(cfg.bannerColor ?? '#3D8BD0');
  const c2 = String(cfg.bannerColor2 ?? '#0B1B3F');
  const side = String(cfg.colorSide ?? 'left');
  /* Picking a colour here MEANS "a coloured banner", so it switches the background to Colour too. */
  const put = (patch: Record<string, unknown>) => setCfg({ bgKind: 'color', ...patch });
  const label = 'mb-1.5 block text-[12px] font-medium text-[#364658]';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded border border-[#DFE5ED] p-0.5">
        {(['solid', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => put({ colorMode: m })}
            className={`h-7 flex-1 rounded text-[12px] font-medium transition-colors ${mode === m ? 'bg-[#3D8BD0] text-white' : 'text-[#64748B] hover:bg-[#F5F7FA]'}`}
          >{m === 'solid' ? 'Solid' : 'Gradient'}</button>
        ))}
      </div>
      {mode === 'solid' ? (
        <div>
          <span className={label}>Colour</span>
          <ColorField value={c1} onChange={(v) => put({ bannerColor: v, colorMode: 'solid' })} />
        </div>
      ) : (
        <>
          <div>
            <span className={label}>Strongest at</span>
            <SideGrid value={side} onChange={(v) => put({ colorSide: v, colorMode: 'gradient' })} from={c1} to={c2} />
          </div>
          <div>
            <span className={label}>Start colour</span>
            <ColorField value={c1} onChange={(v) => put({ bannerColor: v, colorMode: 'gradient' })} />
          </div>
          <div>
            <span className={label}>End colour</span>
            <ColorField value={c2} onChange={(v) => put({ bannerColor2: v, colorMode: 'gradient' })} />
          </div>
        </>
      )}
    </div>
  );
}
