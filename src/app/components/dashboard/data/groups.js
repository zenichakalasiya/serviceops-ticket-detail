/**
 * groups.js — how a dashboard GROUP looks, and the one resolver that turns its saved
 * style into CSS.
 *
 * Mirrors the reference build's Edit group panel, field for field: header colour, title
 * size, title alignment, padding and sharing. Two differences, both deliberate:
 *   · alignment DEFAULTS to centre (the reference defaults left);
 *   · the Default header colour is `--grp-head` (#ecf1f9), and the body under any header
 *     colour is plain surface — white (`--gh-body`).
 *
 * Colours are named, not hex, so they survive the theme switch. Solid headers carry
 * their own text ink because white type on yellow and dark type on red are both wrong.
 */
import { FT_SIZES } from './freeText.js'

export const GRP_BGS = [
  // 2026-09-24: a group's own default band (#ecf1f9), no longer the widget header's --bg
  { id: 'Default', css: 'var(--grp-head)', ink: 'var(--ink)' },
  // "Transparent" = the group's own white body. Painted, not see-through, because the
  // header is sticky and a truly transparent one would show widgets scrolling under it.
  { id: 'Transparent', css: 'var(--surface)', ink: 'var(--ink)' },
  { id: 'Gray', css: 'var(--surface-2)', ink: 'var(--ink)' },
  { id: 'Green', css: 'var(--green)', ink: '#fff' },
  { id: 'Blue', css: 'var(--primary)', ink: '#fff' },
  { id: 'Yellow', css: 'var(--amber-dot)', ink: '#1a1405' },
  { id: 'Orange', css: 'var(--orange)', ink: '#fff' },
  { id: 'Red', css: 'var(--red)', ink: '#fff' },
]

// the same size scale Free Text offers, so "Auto" and "24px" mean one thing everywhere
export const GRP_SIZES = FT_SIZES
export const GRP_ALIGNS = ['left', 'center']

export const GRP_DEFAULTS = { bg: 'Default', size: 'Auto', align: 'center', pad: true, share: 'public' }

const isHex = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v || ''))
/* A custom colour needs an ink too. Relative luminance above ~0.55 is light enough that
   dark text reads better than white — the usual threshold for button labels. */
function inkFor(hex) {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#1a1405' : '#fff'
}

/** A group's style, with defaults filled in — a group saved before styles existed has none. */
export const grpStyleOf = (g) => ({ ...GRP_DEFAULTS, ...(g?.style || {}) })

/** Saved style → the header's CSS variables. */
export function grpHeadVars(g) {
  const st = grpStyleOf(g)
  const named = GRP_BGS.find((b) => b.id === st.bg)
  const bg = named ? named.css : isHex(st.bg) ? st.bg : 'var(--bg)'
  const ink = named ? named.ink : isHex(st.bg) ? inkFor(st.bg) : 'var(--ink)'
  const px = (GRP_SIZES.find((s) => s.id === st.size) || {}).px || 0
  return {
    /* Only the HEADER BAND carries the group's colour (2026-09-29, user's call). The body
       is the plain card surface (white) — a 5% tint of the header colour until then, 10%
       before 2026-09-24 — and the outline is the default group's border for every header
       colour; a coloured header used to outline the whole group in its colour. */
    '--gh-body': 'var(--surface)',
    '--gh-line': 'var(--border)',
    '--gh-bg': bg,
    '--gh-ink': ink,
    '--gh-size': px ? px + 'px' : '14px',
    '--gh-align': st.align === 'left' ? 'flex-start' : 'center',
  }
}
