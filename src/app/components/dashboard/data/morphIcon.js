/**
 * morphIcon — the monochrome Chart Morph loader as STANDALONE files a developer can take
 * away (the /loaders page's "Icon files" kit).
 *
 * ChartLoader.vue drives morph from JS (a timer flips the phase, CSS transitions tween), so
 * it can't be saved as a file. This rebuilds the same five beats — columns → trend → donut
 * → find the pattern → block drop, 2s each — as ONE pure-CSS @keyframes timeline inside the
 * SVG, so the file animates on its own: in an <img>, as a CSS background, or inlined.
 *
 * The geometry is copied from ChartLoader.vue's morph (bars, tops, ring, dots, blocks); if
 * that changes, change it here too. Colours are the mono shades (--picker-ico mixed into
 * --surface), resolved to hex because a standalone file has no tokens to read.
 */

const LOOP = 10 // seconds: five charts × 2s

/* the mono shades, as in ChartLoader: MONO[i] % of the slate, mixed into the surface */
const MONO = [88, 58, 38, 74, 28]
const THEMES = {
  light: { ico: '#7186a8', surface: '#ffffff' },
  dark: { ico: '#8fa4c6', surface: '#1d1d27' },
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, pct) => '#' + hex(a).map((v, i) => Math.round(v * pct / 100 + hex(b)[i] * (1 - pct / 100)).toString(16).padStart(2, '0')).join('')

/* ── geometry (from ChartLoader.vue · morph) ── */
const BARS = [40, 62, 34, 70, 50]
const bx = (i) => 22 + i * 28
const TOPS = BARS.map((h, i) => [bx(i) + 8, 88 - h])
const TREND_D = TOPS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
const RING = 2 * Math.PI * 30
const SEGS = [0.3, 0.24, 0.2, 0.15, 0.11].reduce((acc, f, i) => {
  const off = acc.reduce((s, x) => s + x.len, 0)
  acc.push({ len: f * RING - 2, off, i })
  return acc
}, [])
const DOTS = [
  [18, 30, 26, 78], [46, 82, 44, 70], [70, 20, 62, 61], [98, 70, 80, 52],
  [120, 26, 98, 44], [140, 76, 116, 35], [34, 56, 134, 27], [108, 88, 150, 18],
].map(([x1, y1, x2, y2], i) => ({ x1, y1, x2, y2, c: (i % 5) + 1, i }))
const COLS = [[18, 16, 12], [22, 14], [14, 20, 10], [12, 18, 16]]
const BLOCKS = COLS.flatMap((col, ci) => {
  let y = 88
  // ChartLoader shades a block C(bi + 1 + (ci % 2) * 3); only five shades exist here
  return col.map((h, bi) => { y -= h + 2; return { x: 26 + ci * 30, y, h, c: ((bi + (ci % 2) * 3) % 5) + 1, d: (ci * 0.12 + bi * 0.42) * 0.4 } })
})

export const FRAMES = [
  { id: 'column', name: 'Column' },
  { id: 'line', name: 'Line' },
  { id: 'donut', name: 'Donut' },
  { id: 'scatter', name: 'Scatter' },
  { id: 'stacked', name: 'Stacked' },
]

/* ── colour classes: f1..f5 fill, s1..s5 stroke, plus axis / line / track ── */
function palette(t) {
  const { ico, surface } = THEMES[t]
  return [
    ...MONO.map((p, i) => `.f${i + 1}{fill:${mix(ico, surface, p)}}.s${i + 1}{stroke:${mix(ico, surface, p)}}`),
    `.ax,.ln{stroke:${ico}}.tk{stroke:${mix(ico, surface, 14)}}`,
  ].join('')
}
function colourCss(theme) {
  if (theme === 'current') {
    // one colour, inherited from the page: shades become opacities of currentColor
    return MONO.map((p, i) => `.f${i + 1}{fill:currentColor;fill-opacity:${p / 100}}.s${i + 1}{stroke:currentColor;stroke-opacity:${p / 100}}`).join('')
      + '.ax,.ln{stroke:currentColor}.tk{stroke:currentColor;stroke-opacity:.14}'
  }
  if (theme === 'auto') return palette('light') + `@media (prefers-color-scheme:dark){${palette('dark')}}`
  return palette(theme)
}
const BASE_CSS = '.ax{stroke-width:1;stroke-opacity:.45;vector-effect:non-scaling-stroke}'
  + '.ln{fill:none;stroke-linecap:round;stroke-linejoin:round}'

/* ── the animated timeline: every beat as a % of the 10s loop ── */
const ease = 'cubic-bezier(.4,0,.2,1)'
function motionCss() {
  const k = []
  const anim = (sel, name, delay = 0, fn = ease) => k.push(`${sel}{animation:${name} ${LOOP}s ${fn} ${delay.toFixed(3)}s infinite both}`)
  // 0 · columns grow, then drop as the trend arrives
  k.push('.bar{transform-box:fill-box;transform-origin:50% 100%}')
  k.push('@keyframes bar{0%{transform:scaleY(0);opacity:0}8%,20%{transform:scaleY(1);opacity:1}28%,100%{transform:scaleY(0);opacity:0}}')
  BARS.forEach((_, i) => anim(`.bar${i}`, 'bar', i * 0.06))
  // the x-axis sits under every chart but the donut
  k.push('@keyframes ax{0%,40%{opacity:1}44%,60%{opacity:0}66%,100%{opacity:1}}')
  anim('.ax', 'ax')
  // 1 · the trend draws through the column tops, its points pop in
  k.push('@keyframes trend{0%,22%{stroke-dashoffset:1;opacity:.55}32%,40%{stroke-dashoffset:0;opacity:.55}44%{stroke-dashoffset:0;opacity:0}45%,100%{stroke-dashoffset:1;opacity:0}}')
  anim('.trend', 'trend')
  k.push('.tdot{transform-box:fill-box;transform-origin:center}')
  k.push('@keyframes tdot{0%,20%{transform:scale(0)}26%,40%{transform:scale(1)}46%,100%{transform:scale(0)}}')
  TOPS.forEach((_, i) => anim(`.tdot${i}`, 'tdot', 0.12 + i * 0.07))
  // 2 · the donut turns in and its slices sweep round
  k.push('.ring{transform-box:view-box;transform-origin:80px 50px}')
  k.push('@keyframes ring{0%,40%{transform:rotate(-90deg) scale(.6);opacity:0}49%,60%{transform:rotate(-90deg) scale(1);opacity:1}65%{opacity:0}69%,100%{transform:rotate(-90deg) scale(.6);opacity:0}}')
  anim('.ring', 'ring')
  SEGS.forEach((s) => {
    k.push(`@keyframes seg${s.i}{0%,40%{stroke-dasharray:0 ${RING.toFixed(2)}}49%,60%{stroke-dasharray:${s.len.toFixed(2)} ${RING.toFixed(2)}}69%,100%{stroke-dasharray:0 ${RING.toFixed(2)}}}`)
    anim(`.seg${s.i}`, `seg${s.i}`, s.i * 0.11)
  })
  // 3 · find the pattern: loose dots appear, gather onto a trend, the line draws
  DOTS.forEach((d) => {
    const a = `translate(${d.x1}px,${d.y1}px)`, b = `translate(${d.x2}px,${d.y2}px)`
    k.push(`@keyframes sd${d.i}{0%,60%{transform:${a} scale(0);opacity:0}63.2%{transform:${a} scale(1);opacity:1}72.4%,80%{transform:${b} scale(1);opacity:1}86%{transform:${b} scale(1);opacity:0}100%{transform:${a} scale(0);opacity:0}}`)
    anim(`.sd${d.i}`, `sd${d.i}`, d.i * 0.04)
  })
  k.push('@keyframes sline{0%,71.6%{stroke-dashoffset:1;opacity:.5}77.6%,80%{stroke-dashoffset:0;opacity:.5}86%{stroke-dashoffset:0;opacity:0}87%,100%{stroke-dashoffset:1;opacity:0}}')
  anim('.sline', 'sline')
  // 4 · block drop: each block falls into its column in turn
  k.push('@keyframes blk{0%,80%{transform:translateY(-46px);opacity:0}88.5%,96%{transform:translateY(0);opacity:1}100%{transform:translateY(0);opacity:0}}')
  BLOCKS.forEach((b, i) => anim(`.blk${i}`, 'blk', b.d, 'cubic-bezier(.22,.61,.36,1)'))
  // reduced motion: no travel — the columns stay, nothing else shows
  k.push('@media (prefers-reduced-motion:reduce){*{animation:none!important}}')
  return k.join('')
}

/* ── markup: every element, either as a still frame or wired to the timeline ── */
function marks(frame) {
  const anim = frame == null
  const show = (f) => anim || frame === f
  // under reduced motion (animation off) only the columns + axis should be visible
  const hide = anim ? ' style="opacity:0"' : ''
  const out = []
  if (anim || frame !== 2) out.push('<path class="ax" d="M14 88H146"/>')
  if (show(0)) BARS.forEach((h, i) => out.push(`<rect class="bar bar${i} f${i + 1}" x="${bx(i)}" y="${88 - h}" width="16" height="${h}" rx="3"/>`))
  if (show(1)) {
    out.push(`<path class="trend ln" d="${TREND_D}" stroke-width="2" pathLength="1" stroke-dasharray="1"${anim ? hide : ' stroke-opacity=".55"'}/>`)
    TOPS.forEach((p, i) => out.push(`<circle class="tdot tdot${i} f${i + 1}" cx="${p[0]}" cy="${p[1]}" r="3.6"${anim ? ' style="transform:scale(0)"' : ''}/>`))
  }
  if (show(2)) {
    out.push(`<g class="ring"${anim ? hide : ' transform="rotate(-90 80 50)"'}>`)
    out.push('<circle class="tk" cx="80" cy="50" r="30" fill="none" stroke-width="12"/>')
    SEGS.forEach((s) => out.push(`<circle class="seg${s.i} s${s.i + 1}" cx="80" cy="50" r="30" fill="none" stroke-width="12" stroke-dasharray="${s.len.toFixed(2)} ${RING.toFixed(2)}" stroke-dashoffset="${(-s.off).toFixed(2)}"/>`))
    out.push('</g>')
  }
  if (show(3)) {
    out.push(`<path class="sline ln" d="M26 78L150 18" stroke-width="1.75" pathLength="1" stroke-dasharray="1"${anim ? hide : ' stroke-opacity=".5"'}/>`)
    DOTS.forEach((d) => out.push(anim
      ? `<circle class="sd${d.i} f${d.c}" r="4"${hide}/>`
      : `<circle class="f${d.c}" cx="${d.x2}" cy="${d.y2}" r="4"/>`))
  }
  if (show(4)) BLOCKS.forEach((b, i) => out.push(`<rect class="blk${i} f${b.c}" x="${b.x}" y="${b.y}" width="20" height="${b.h}" rx="3"${hide}/>`))
  return out.join('\n  ')
}

/**
 * The SVG file as a string.
 * @param {object} o
 * @param {'auto'|'light'|'dark'|'current'} [o.theme] auto follows the OS light/dark setting;
 *   current paints in the page's text colour (inline the SVG to use it)
 * @param {number|null} [o.frame] null → animated; 0..4 → that chart, still
 * @param {number} [o.width] rendered width (the height keeps the 160×100 ratio)
 */
export function morphSvg({ theme = 'auto', frame = null, width = 160 } = {}) {
  const title = frame == null ? 'Loading chart' : `${FRAMES[frame].name} chart`
  const css = colourCss(theme) + BASE_CSS + (frame == null ? motionCss() : '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="${width}" height="${Math.round(width * 100 / 160)}" fill="none" role="img" aria-label="${title}">
  <title>${title}</title>
  <style>${css}</style>
  ${marks(frame)}
</svg>
`
}

/** A still frame as a PNG blob, rendered through a canvas at `scale`× the 160×100 artboard. */
export function morphPng(frame, { theme = 'light', scale = 4 } = {}) {
  const w = 160 * scale, h = 100 * scale
  const url = URL.createObjectURL(new Blob([morphSvg({ theme, frame, width: w })], { type: 'image/svg+xml' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG render failed'))), 'image/png')
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

/* ── a minimal STORE-only zip (no compression, no dependency) for "Download all" ── */
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

/** @param {{ name: string, data: Uint8Array }[]} files */
export function zip(files) {
  const enc = new TextEncoder(), parts = [], dir = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), n = f.data.length
    const head = new DataView(new ArrayBuffer(30))
    ;[[0, 0x04034b50, 4], [4, 20, 2], [8, 0, 2], [14, crc, 4], [18, n, 4], [22, n, 4], [26, name.length, 2]]
      .forEach(([o, v, s]) => (s === 4 ? head.setUint32(o, v, true) : head.setUint16(o, v, true)))
    parts.push(new Uint8Array(head.buffer), name, f.data)
    const cd = new DataView(new ArrayBuffer(46))
    ;[[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [16, crc, 4], [20, n, 4], [24, n, 4], [28, name.length, 2], [42, offset, 4]]
      .forEach(([o, v, s]) => (s === 4 ? cd.setUint32(o, v, true) : cd.setUint16(o, v, true)))
    dir.push(new Uint8Array(cd.buffer), name)
    offset += 30 + name.length + n
  }
  const size = dir.reduce((s, p) => s + p.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  ;[[0, 0x06054b50, 4], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, offset, 4]]
    .forEach(([o, v, s]) => (s === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)))
  return new Blob([...parts, ...dir, new Uint8Array(end.buffer)], { type: 'application/zip' })
}
