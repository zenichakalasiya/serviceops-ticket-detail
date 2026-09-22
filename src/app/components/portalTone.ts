/* Support Portal — a theme's TONES, derived from its one main colour.
 *
 * The layout gallery's templates are themed the way a designer themes a page: one colour is chosen
 * for the banner, and everything tinted on the page — the ID pill behind a record's number, the
 * badge behind an icon, the fill of an asset tile, the ground the whole page sits on — is a tone of
 * that same colour. It is what makes a portal read as one object rather than as a blue product with
 * a green banner on it.
 *
 * ⚠️ COMPUTED, never authored per theme. Two reasons, and the second is the important one. A hand
 * tuned set is eight chances to get a relationship slightly wrong; but more than that, the admin can
 * EDIT the primary colour, and an authored set would go on painting the old hue behind the new one —
 * the page would half-change and there would be no control anywhere that explained why. Derived, the
 * whole page follows the colour they are dragging, live.
 *
 * ⚠️ These are the PAGE's tints. They are deliberately NOT the status language: green still means
 * healthy and red still means broken whatever the theme is, which is why `SECONDARY` is not derived
 * from anything (see the note on it in PortalThemePanel). */

import { contrastRatio, hexToRgb, rgbToHex } from './portalContrast';

export interface Tones {
  /** The lightest tint — an ID pill, an asset tile's fill. */
  wash: string;
  /** One step deeper — the badge behind an icon, so a glyph reads against the tile beside it. */
  soft: string;
  /** A hairline of the hue, for the edge of a tinted block. */
  line: string;
  /** A dark of the same hue that READS on `wash` — the number in the pill, the glyph in the badge. */
  ink: string;
}

/* ── hue maths ───────────────────────────────────────────────────────────── */

/** hex → [hue 0-360, saturation 0-1, lightness 0-1]. */
export function hexToHsl(hex: string): [number, number, number] {
  const [r255, g255, b255] = hexToRgb(hex);
  const r = r255 / 255, g = g255 / 255, b = b255 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0))
    : max === g ? (b - r) / d + 2
    : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** [hue, saturation, lightness] → hex. */
export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v + m)) * 255);
  return rgbToHex(to(r1), to(g1), to(b1));
}

/* ── the tones ───────────────────────────────────────────────────────────── */

/* ⚠️ Saturation is CAPPED and then cut back for the tints. A portal's tinted blocks sit behind
   words, and a wash carrying the primary's full saturation at 95% lightness is a coloured surface
   rather than a tint of white — a page of them reads as a page of highlighter. The floor matters
   just as much in the other direction: a nearly-grey primary (Triptych) with its saturation scaled
   down would give a wash indistinguishable from the card behind it, so every tint keeps a minimum
   of its own hue. */
const TINT_CAP = 0.58;
const cache = new Map<string, Tones>();

export function tonesOf(primary: string): Tones {
  const hit = cache.get(primary);
  if (hit) return hit;
  const [h, s0] = hexToHsl(primary);
  const s = Math.min(s0, TINT_CAP);
  const wash = hslToHex(h, Math.max(s * 0.55, 0.16), 0.955);
  const soft = hslToHex(h, Math.max(s * 0.62, 0.20), 0.925);
  const line = hslToHex(h, Math.max(s * 0.55, 0.14), 0.875);
  /* ⚠️ The ink is DARKENED UNTIL IT READS, not set to a fixed lightness. The same lightness against
     a yellow wash and against a navy one are two different legibilities, and a pill whose number
     you cannot read is worse than an untinted pill. 4.5:1 is the same bar the banner's contrast
     guard holds text to. */
  const washRgb = hexToRgb(wash);
  const sat = Math.max(s0, 0.30);
  let l = 0.42;
  let ink = hslToHex(h, sat, l);
  while (l > 0.14 && contrastRatio(ink, washRgb) < 4.5) {
    l -= 0.03;
    ink = hslToHex(h, sat, l);
  }
  const tones = { wash, soft, line, ink };
  cache.set(primary, tones);
  return tones;
}

/** The CSS variables the page paints its tints from. */
export const toneVars = (primary: string): Record<string, string> => {
  const t = tonesOf(primary);
  return {
    '--portal-tone-wash': t.wash,
    '--portal-tone-soft': t.soft,
    '--portal-tone-line': t.line,
    '--portal-tone-ink': t.ink,
  };
};

/* ⚠️ Every consumer states a FALLBACK, and the fallback is the colour that block was before any of
   this existed. The tints are only painted inside the builder's theme wrapper; anywhere else — a
   card rendered in a gallery thumbnail, a test, a future surface — the variable is unset and the
   block keeps the look it has always had rather than collapsing to black. */
export const TONE = {
  wash: 'var(--portal-tone-wash, #F1F5F9)',
  soft: 'var(--portal-tone-soft, #EAF3FB)',
  line: 'var(--portal-tone-line, #E5E7EB)',
  ink: 'var(--portal-tone-ink, #475467)',
} as const;
