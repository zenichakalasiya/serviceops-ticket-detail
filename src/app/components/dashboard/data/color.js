/**
 * color.js — the colour maths both pickers share (ColorPicker, the form field; ColorPanel,
 * the rich-text editor's text/background colour). HSV drives the square and the hue rail;
 * hex / rgba are what gets stored.
 */
export const isHex = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v || ''))

export function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}

export function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let hh = 0
  if (d) {
    if (max === r) hh = 60 * (((g - b) / d) % 6)
    else if (max === g) hh = 60 * ((b - r) / d + 2)
    else hh = 60 * ((r - g) / d + 4)
  }
  return { h: (hh + 360) % 360, s: max ? d / max : 0, v: max }
}

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) }
}

export const hexToHsv = (hex) => rgbToHsv(hexToRgb(hex))

/** A stored literal (#hex or rgb/rgba) → { rgb, a }, or null when it is neither. */
export function parseLiteral(v) {
  if (isHex(v)) return { rgb: hexToRgb(v), a: 1 }
  const m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(String(v || '').trim())
  return m ? { rgb: { r: +m[1], g: +m[2], b: +m[3] }, a: m[4] == null ? 1 : Math.min(1, Math.max(0, +m[4])) } : null
}
