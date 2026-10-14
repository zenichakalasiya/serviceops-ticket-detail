/**
 * previewArt — the widget builder's live-preview EMPTY STATE, one illustration per chart
 * type, plus the title and two-line description that go under it.
 *
 * ONE source for three consumers, so they cannot drift apart:
 *   · EmptyPreviewArt.vue — the builder's preview while no condition is set;
 *   · views/PreviewStateGallery.vue — the reference page (every type, SVG/PNG download);
 *   · previewSvgFile() — the downloadable file, colours resolved to hex.
 *
 * Every illustration is the same scene (the empty-group idiom: one colour, `currentColor`,
 * at stepped opacities + the card surface): a dashed PREVIEW FRAME on the left, the
 * CONDITIONS panel on the right with a dashed arc carrying a condition into the frame.
 * Only the ghost chart inside the frame changes with the type — always drawn the same way:
 * dashed outline, a 6% wash, nothing solid, because nothing has been counted yet.
 * Static on purpose (the user asked for no movement).
 */

const GHOST = 'stroke="currentColor" stroke-opacity=".42" stroke-width="1" stroke-dasharray="2.5 2"'
const WASH = 'fill="currentColor" fill-opacity=".06"'
const AXIS_X = '<path d="M12 71 H70" stroke="currentColor" stroke-opacity=".3" stroke-width="1"/>'
const AXIS_Y = '<path d="M14 34 V72" stroke="currentColor" stroke-opacity=".3" stroke-width="1"/>'
const bar = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" ${GHOST} ${WASH}/>`
const line = (d, o = '.5') => `<path d="${d}" stroke="currentColor" stroke-opacity="${o}" stroke-width="1.25" stroke-dasharray="3 2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="1.9" fill="currentColor" fill-opacity=".28"/>`
const pt = (a, r, cx = 40, cy = 52) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map((v) => v.toFixed(2))

/* The ghost chart per type, drawn inside the frame's plot area (x 12–70, y 32–72). */
const GHOSTS = {
  column: () => AXIS_X + bar(17, 53, 9, 18) + bar(31, 43, 9, 28) + bar(45, 57, 9, 14) + bar(59, 37, 9, 34),
  bar: () => AXIS_Y + bar(14, 37, 42, 6) + bar(14, 46, 28, 6) + bar(14, 55, 50, 6) + bar(14, 64, 22, 6),
  line: () => AXIS_X + line('M15 62 L27 51 L39 56 L51 41 L65 45') + [[15, 62], [27, 51], [39, 56], [51, 41], [65, 45]].map(([x, y]) => dot(x, y)).join(''),
  pie: () => {
    const r = 18, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 0.8, a2 = a1 + Math.PI * 0.65
    return `<circle cx="40" cy="52" r="${r}" ${GHOST} ${WASH}/>`
      + [a0, a1, a2].map((a) => { const [x, y] = pt(a, r); return `<path d="M40 52 L${x} ${y}" ${GHOST}/>` }).join('')
  },
  donut: () => {
    const R = 18, r = 9.5, a = [-Math.PI / 2, -Math.PI / 2 + Math.PI * 0.8, -Math.PI / 2 + Math.PI * 1.45]
    return `<path d="M22 52 A18 18 0 1 0 58 52 A18 18 0 1 0 22 52 Z M30.5 52 A9.5 9.5 0 1 1 49.5 52 A9.5 9.5 0 1 1 30.5 52 Z" fill-rule="evenodd" ${WASH}/>`
      + `<circle cx="40" cy="52" r="${R}" ${GHOST} fill="none"/><circle cx="40" cy="52" r="${r}" ${GHOST} fill="none"/>`
      + a.map((t) => { const [x1, y1] = pt(t, r), [x2, y2] = pt(t, R); return `<path d="M${x1} ${y1} L${x2} ${y2}" ${GHOST}/>` }).join('')
  },
  stack: () => AXIS_X + [[17, [8, 10]], [31, [12, 9, 7]], [45, [6, 8]], [59, [14, 10, 9]]].map(([x, parts]) => {
    let y = 71
    return parts.map((h) => { y -= h; return bar(x, y, 9, h) }).join('')
  }).join(''),
  grouped: () => AXIS_X + [[16, 20, 12], [33, 28, 20], [50, 16, 30]].map(([x, a, b]) => bar(x, 71 - a, 6, a) + bar(x + 7, 71 - b, 6, b)).join(''),
  multiline: () => AXIS_X + line('M15 60 L27 52 L39 55 L51 44 L65 40', '.5') + line('M15 66 L27 62 L39 64 L51 57 L65 58', '.34'),
  combo: () => AXIS_X + bar(17, 55, 9, 16) + bar(31, 47, 9, 24) + bar(45, 58, 9, 13) + bar(59, 44, 9, 27)
    + line('M21.5 46 L35.5 38 L49.5 43 L63.5 34') + [[21.5, 46], [35.5, 38], [49.5, 43], [63.5, 34]].map(([x, y]) => dot(x, y)).join(''),
  hist: () => AXIS_X + [[14, 10], [23, 20], [32, 30], [41, 24], [50, 15], [59, 8]].map(([x, h]) => bar(x, 71 - h, 9, h)).join(''),
  funnel: () => [[12, 56], [17, 46], [23, 34], [29, 22]].map(([x, w], i) => {
    const y = 36 + i * 9, nx = x + 3, nw = w - 6
    return `<path d="M${x} ${y} H${x + w} L${nx + nw} ${y + 7.5} H${nx} Z" ${GHOST} ${WASH} stroke-linejoin="round"/>`
  }).join(''),
  heatmap: () => {
    const shade = [[.05, .12, .08, .16, .06], [.1, .04, .14, .07, .11], [.07, .15, .05, .1, .13], [.13, .08, .11, .04, .09]]
    return shade.map((row, r) => row.map((o, c) => `<rect x="${15 + c * 10.6}" y="${36 + r * 9}" width="9.2" height="7.6" rx="1.2" fill="currentColor" fill-opacity="${o}" stroke="currentColor" stroke-opacity=".3" stroke-width=".8" stroke-dasharray="2 1.6"/>`).join('')).join('')
  },
  gauge: () => {
    // a semicircle band (outer r 24, inner r 15) on a baseline, and a ghost needle
    const cx = 40, cy = 67
    return `<path d="M${cx - 24} ${cy} A24 24 0 0 1 ${cx + 24} ${cy} H${cx + 15} A15 15 0 0 0 ${cx - 15} ${cy} Z" ${GHOST} ${WASH} stroke-linejoin="round"/>`
      + `<path d="M${cx} ${cy} L${cx + 11} ${cy - 13}" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2.5 2"/>`
      + `<circle cx="${cx}" cy="${cy}" r="2.4" fill="currentColor" fill-opacity=".3"/>`
  },
  kpi: () => `<rect x="21" y="40" width="38" height="18" rx="3" ${GHOST} ${WASH}/>`
    + '<path d="M28 49 H52" stroke="currentColor" stroke-opacity=".2" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 3"/>'
    + '<rect x="28" y="63" width="24" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".2"/>',
}

/* CENTERING. Each ghost is drawn in its own coordinates, so each is moved to sit dead centre
   in the frame's plot area — horizontally in the frame (x 4–84 → 44) and vertically in the
   space under the title stub (y 28–78 → 53). These are the ghosts' measured bounding boxes
   (getBBox, [x, y, w, h]); re-measure one if you change its drawing. */
const BOX = {
  line: [12, 39.1, 58, 31.9], bar: [14, 34, 50, 38], column: [12, 37, 58, 34], pie: [22, 34, 36, 36],
  donut: [22, 34, 36, 36], stack: [12, 38, 58, 33], grouped: [12, 41, 58, 30], multiline: [12, 40, 58, 31],
  combo: [12, 32.1, 58, 38.9], hist: [12, 41, 58, 30], funnel: [12, 36, 56, 34.5], heatmap: [15, 36, 51.6, 34.6],
  gauge: [16, 43, 48, 26.4], kpi: [21, 40, 38, 25.4],
}
const CX = 44, CY = 53
function centred(id) {
  const [x, y, w, h] = BOX[id] || BOX.column
  return [(CX - (x + w / 2)).toFixed(2), (CY - (y + h / 2)).toFixed(2)]
}

/** The chart types this empty state is drawn for, in the builder's picker order. */
export const PREVIEW_KINDS = [
  { id: 'line', label: 'Line', noun: 'line chart', desc: 'Pick the records to trace in Conditions on the right, and the line draws here point by point.' },
  { id: 'bar', label: 'Bar', noun: 'bar chart', desc: 'Pick the records to rank in Conditions on the right, and a bar grows here for each category.' },
  { id: 'column', label: 'Column', noun: 'column chart', desc: 'Pick the records to count in Conditions on the right, and a column rises here for each category.' },
  { id: 'pie', label: 'Pie', noun: 'pie chart', desc: 'Pick the records to split in Conditions on the right, and the pie slices itself by their share.' },
  { id: 'donut', label: 'Donut', noun: 'donut chart', desc: 'Pick the records to split in Conditions on the right, and the ring divides by their share.' },
  { id: 'stack', label: 'Stacked', noun: 'stacked chart', desc: 'Pick the records in Conditions on the right, and each column stacks up by its split.' },
  { id: 'grouped', label: 'Grouped', noun: 'grouped chart', desc: 'Pick the records in Conditions on the right, and each category gets its columns side by side.' },
  { id: 'multiline', label: 'Multi-line', noun: 'multi-line chart', desc: 'Pick the records in Conditions on the right, and one line draws here for each series.' },
  { id: 'combo', label: 'Combo', noun: 'combo chart', desc: 'Pick the records in Conditions on the right, and the columns and the line draw together.' },
  { id: 'hist', label: 'Histogram', noun: 'histogram', desc: 'Pick the records in Conditions on the right, and they sort into buckets across the range.' },
  { id: 'funnel', label: 'Funnel', noun: 'funnel', desc: 'Pick the records in Conditions on the right, and each stage narrows by how many reach it.' },
  { id: 'heatmap', label: 'Heatmap', noun: 'heatmap', desc: 'Pick the records in Conditions on the right, and each cell shades by how many land in it.' },
  { id: 'gauge', label: 'Gauge', noun: 'gauge', desc: 'Pick the records to measure in Conditions on the right, and the needle settles on the value.' },
  { id: 'kpi', label: 'KPI', noun: 'KPI', desc: 'Pick the records to count in Conditions on the right, and the number appears here.' },
]
export const previewKind = (id) => PREVIEW_KINDS.find((k) => k.id === id) || PREVIEW_KINDS.find((k) => k.id === 'column')
export const previewTitle = (id) => `Add a condition to preview your ${previewKind(id).noun}`

/** The inner SVG markup (viewBox 0 0 132 84) for a type. `currentColor` + var(--surface). */
export function previewArtMarkup(id) {
  const key = GHOSTS[id] ? id : 'column'
  const [dx, dy] = centred(key)
  const ghost = `<g transform="translate(${dx} ${dy})">${GHOSTS[key]()}</g>`
  return `
  <rect x="4" y="18" width="80" height="62" rx="7" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".38" stroke-width="1.25" stroke-dasharray="4 3"/>
  <rect x="11" y="25" width="22" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22"/>
  ${ghost}
  <path d="M94 50 C 88 60, 82 60, 76 55" stroke="currentColor" stroke-opacity=".35" stroke-width="1.25" stroke-dasharray="2.5 3" stroke-linecap="round"/>
  <path d="M79.4 53 L 75.6 54.8 L 77.6 58.6" stroke="currentColor" stroke-opacity=".45" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="88" y="4" width="40" height="44" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25"/>
  <path d="M92.5 9 H99.5 L 97 12.2 V 14.6 L 95 15.4 V 12.2 Z" fill="currentColor" fill-opacity=".55"/>
  <rect x="102" y="10.2" width="15" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".5"/>
  <path d="M88.6 19 H127.4" stroke="currentColor" stroke-opacity=".18"/>
  <rect x="92" y="22.5" width="13" height="5" rx="1.5" fill="currentColor" fill-opacity=".45"/>
  <rect x="107" y="24.3" width="3" height="1.4" rx=".7" fill="currentColor" fill-opacity=".3"/>
  <rect x="112" y="22.5" width="12" height="5" rx="1.5" fill="currentColor" fill-opacity=".2"/>
  <rect x="92" y="30.5" width="10" height="5" rx="1.5" fill="currentColor" fill-opacity=".45"/>
  <rect x="104" y="32.3" width="3" height="1.4" rx=".7" fill="currentColor" fill-opacity=".3"/>
  <rect x="109" y="30.5" width="15" height="5" rx="1.5" fill="currentColor" fill-opacity=".2"/>
  <rect x="92" y="38.8" width="21" height="6" rx="2" stroke="currentColor" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="2 1.6"/>
  <path d="M95.2 41.8 H98.8 M97 40 V43.6" stroke="currentColor" stroke-opacity=".75" stroke-width="1" stroke-linecap="round"/>
  <rect x="100.6" y="41.1" width="9.4" height="1.5" rx=".75" fill="currentColor" fill-opacity=".45"/>`
}

/* The downloadable file: tokens resolved to the product's light-theme values. */
const SLATE = '#7186a8', SURFACE = '#ffffff'
export function previewSvgFile(id, width = 264) {
  const inner = previewArtMarkup(id).replaceAll('currentColor', SLATE).replaceAll('var(--surface)', SURFACE)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 84" width="${width}" height="${Math.round(width * 84 / 132)}" fill="none" role="img" aria-label="${previewTitle(id)}">\n  <title>${previewTitle(id)}</title>${inner}\n</svg>\n`
}

/** The same file as a PNG blob, rendered through a canvas at `scale`× the 132×84 artboard. */
export function previewPng(id, scale = 4) {
  const w = 132 * scale, h = 84 * scale
  const url = URL.createObjectURL(new Blob([previewSvgFile(id, w)], { type: 'image/svg+xml' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG render failed'))), 'image/png')
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}
