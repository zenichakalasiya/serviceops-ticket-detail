/**
 * artExport — any of our empty-state illustrations (EmptyBoardArt, EmptyGroupArt, NoDataArt…)
 * as a standalone file a developer can drop in, taken from the RENDERED component so the file
 * is exactly the vector the product draws.
 *
 * The components paint with `currentColor` and `var(--surface)` so they follow the theme; a
 * file can't, so both are resolved to the product's light-theme values — the same slate and
 * white the preview-state files (data/previewArt.js) use.
 */
const SLATE = '#7186a8', SURFACE = '#ffffff'

/* The art is drawn with overflow:visible — a tilted card may poke past the artboard, which
   is fine inside the app but CROPPED in a standalone file (an <img> or a viewer clips to the
   viewBox). So the file's viewBox is grown to the drawing's real bounds, plus a little air. */
function fullBox(svg) {
  const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number)
  let b = null
  try { b = svg.getBBox() } catch { /* not rendered */ }
  if (!b || !b.width) return vb
  const pad = 2
  const x0 = Math.min(vb[0], b.x - pad), y0 = Math.min(vb[1], b.y - pad)
  const x1 = Math.max(vb[0] + vb[2], b.x + b.width + pad), y1 = Math.max(vb[1] + vb[3], b.y + b.height + pad)
  return [x0, y0, x1 - x0, y1 - y0].map((n) => Math.round(n * 10) / 10)
}

/** The rendered <svg> → a standalone SVG file string, `width` px wide. */
export function svgFileFromEl(svg, { title = '', width } = {}) {
  const c = svg.cloneNode(true)
  const vb = fullBox(svg)
  c.setAttribute('viewBox', vb.join(' '))
  const w = width || vb[2], h = Math.round(w * vb[3] / vb[2])
  // strip what only makes sense inside the app: Vue's scope ids, classes, a11y-hiding
  const clean = (el) => {
    for (const a of [...el.attributes]) {
      if (/^data-v-/.test(a.name) || a.name === 'class' || a.name === 'aria-hidden' || a.name === 'focusable') el.removeAttribute(a.name)
      else if (/currentColor|var\(--surface\)/.test(a.value)) el.setAttribute(a.name, a.value.replaceAll('currentColor', SLATE).replaceAll('var(--surface)', SURFACE))
    }
    for (const k of el.children) clean(k)
  }
  clean(c)
  // (no xmlns attribute: XMLSerializer writes it for an element in the SVG namespace)
  c.setAttribute('width', w); c.setAttribute('height', h)
  c.setAttribute('role', 'img')
  if (title) {
    c.setAttribute('aria-label', title)
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = title
    c.insertBefore(t, c.firstChild)
  }
  return new XMLSerializer().serializeToString(c) + '\n'
}

/** The same file as a PNG blob, rendered through a canvas at `scale`× its viewBox. */
export function pngFromEl(svg, { title = '', scale = 4 } = {}) {
  const vb = fullBox(svg)
  const w = Math.round(vb[2] * scale), h = Math.round(vb[3] * scale)
  const url = URL.createObjectURL(new Blob([svgFileFromEl(svg, { title, width: w })], { type: 'image/svg+xml' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      cv.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG render failed'))), 'image/png')
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}
