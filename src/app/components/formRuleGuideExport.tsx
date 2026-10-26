import { renderToStaticMarkup } from 'react-dom/server';
// @ts-ignore — gifenc ships no types
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { FRAMES, GUIDE_CHAPTERS, GuideScene } from './FormRuleGuide';
import type { GFrame } from './FormRuleGuide';

/**
 * The guide video as one file per SLIDE (chapter), for developers (Zeni, 26 Oct 2026): an animated SVG
 * (small, sharp, loops forever, plays in a plain <img>) and a 640×360 GIF. Animation only — the title,
 * text, dots and buttons stay real UI in the product.
 *
 * ⚠️ Both are built from the video's OWN timeline (FRAMES + GuideScene), so a file can never differ from
 * the video. One model, two emitters: `animatedSvg()` writes CSS keyframes; `svgAt(t)` writes the same
 * picture frozen at time t, which the GIF samples.
 *  - each distinct state of the picture is a layer, cross-faded in over FADE ms (consecutive frames that
 *    only move the cursor are merged into one layer);
 *  - the cursor glides between frame positions with the video's own easings (x and y differ, so the path
 *    bows), and a click ring plays on every press;
 *  - the loop is seamless: the cursor glides back from its last position, the last layer fades onto the first.
 * ⚠️ An <img> cannot load web fonts, so Inter is EMBEDDED, cut down to the characters drawn.
 */

const VB = { w: 320, h: 180 };
const FADE = 280;
const GLIDE = 720;
const RING = 520;
const EASE_X: [number, number, number, number] = [0.45, 0, 0.25, 1];
const EASE_Y: [number, number, number, number] = [0.2, 0.75, 0.3, 1];
const FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const YOU = '#7C3AED';

type Pt = [number, number]; // [ms, value]
interface Layer { markup: string; pts: Pt[] }
interface Move { t: number; from: [number, number]; to: [number, number] }
interface Slide { ch: number; total: number; defs: string; layers: Layer[]; moves: Move[]; presses: { t: number; at: [number, number] }[]; start: [number, number] }

const stripSvg = (m: string) => m.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

function slideModel(ch: number): Slide {
  const frames = FRAMES.filter((f) => f.ch === ch);
  const total = frames.reduce((n, f) => n + f.ms, 0);
  let defs = '';
  /* Layers: one per DISTINCT picture state, in order. */
  const raw: { a: number; b: number; markup: string }[] = [];
  let t = 0;
  frames.forEach((f: GFrame, i) => {
    const html = renderToStaticMarkup(<GuideScene f={f} n={i} noCursor />);
    const inner = stripSvg(html);
    const d = /<defs>[\s\S]*?<\/defs>/.exec(inner)?.[0] ?? '';
    if (!defs) defs = d;
    const body = inner.replace(d, '');
    const last = raw[raw.length - 1];
    if (last && last.markup === body) last.b = t + f.ms;
    else raw.push({ a: t, b: t + f.ms, markup: body });
    t += f.ms;
  });
  const layers: Layer[] = raw.map((L, k) => {
    if (raw.length === 1) return { markup: L.markup, pts: [[0, 1], [total, 1]] };
    const end = Math.min(L.b + FADE, total);
    if (k === 0) return { markup: L.markup, pts: [[0, 1], [end, 1], [end + 1, 0], [total - FADE - 1, 0], [total - FADE, 1], [total, 1]] };
    if (k === raw.length - 1) return { markup: L.markup, pts: [[0, 0], [L.a, 0], [L.a + FADE, 1], [total - FADE, 1], [total, 0]] };
    return { markup: L.markup, pts: [[0, 0], [L.a, 0], [L.a + FADE, 1], [end, 1], [end + 1, 0], [total, 0]] };
  });
  /* Cursor: glides from the previous position at each frame's start (from the LAST one at t = 0). */
  const moves: Move[] = [];
  const presses: Slide['presses'] = [];
  let prev = frames[frames.length - 1].cur;
  t = 0;
  frames.forEach((f) => {
    if (f.cur[0] !== prev[0] || f.cur[1] !== prev[1]) moves.push({ t, from: prev, to: f.cur });
    if (f.press) presses.push({ t, at: f.cur });
    prev = f.cur; t += f.ms;
  });
  return { ch, total, defs, layers, moves, presses, start: frames[frames.length - 1].cur };
}

/* ── easing ─────────────────────────────────────────────────────────────────────────────────── */

function bezier([x1, y1, x2, y2]: [number, number, number, number], p: number) {
  const cx = (u: number) => 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3;
  const cy = (u: number) => 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
  let lo = 0, hi = 1, u = p;
  for (let i = 0; i < 30; i++) { u = (lo + hi) / 2; if (cx(u) < p) lo = u; else hi = u; }
  return cy(u);
}

const lerpPts = (pts: Pt[], t: number) => {
  for (let i = 1; i < pts.length; i++) {
    const [a, va] = pts[i - 1], [b, vb] = pts[i];
    if (t <= b) return b === a ? vb : va + (vb - va) * ((t - a) / (b - a));
  }
  return pts[pts.length - 1][1];
};

function cursorAt(s: Slide, t: number): [number, number] {
  let pos = s.start;
  for (const m of s.moves) {
    if (t < m.t) break;
    const p = Math.min(1, (t - m.t) / GLIDE);
    pos = [m.from[0] + (m.to[0] - m.from[0]) * bezier(EASE_X, p), m.from[1] + (m.to[1] - m.from[1]) * bezier(EASE_Y, p)];
  }
  return pos;
}

/* ── shared pieces ──────────────────────────────────────────────────────────────────────────── */

const CURSOR = `<path d="M0 0 L0 12 L3.3 9 L5.7 14 L7.6 13.1 L5.3 8.3 L9.8 8 Z" fill="${YOU}" stroke="#FFFFFF" stroke-width="1" stroke-linejoin="round"/><rect x="9" y="12" width="20" height="10" rx="5" fill="${YOU}"/><text x="19" y="19.2" font-size="6" font-weight="600" fill="#FFFFFF" text-anchor="middle">You</text>`;

const open = (w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB.w} ${VB.h}" width="${w}" height="${h}" font-family="${FONT}">`;

let fontCss: Promise<string> | null = null;
/** Inter cut to every character any slide draws, as data URLs (fetched once). */
function interCss(): Promise<string> {
  if (fontCss) return fontCss;
  const chars = new Set<string>('You');
  for (const ch of GUIDE_CHAPTERS.keys()) for (const L of slideModel(ch).layers) for (const m of L.markup.matchAll(/>([^<]+)</g)) for (const c of m[1]) chars.add(c);
  fontCss = (async () => {
    try {
      const text = encodeURIComponent(Array.from(chars).join(''));
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&text=${text}`)).text();
      const faces = await Promise.all(css.split('@font-face').slice(1).map(async (block) => {
        const url = /url\(([^)]+)\)/.exec(block)?.[1];
        const weight = /font-weight:\s*(\d+)/.exec(block)?.[1] ?? '400';
        if (!url) return '';
        const blob = await (await fetch(url)).blob();
        const data = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
        return `@font-face{font-family:'Inter';font-weight:${weight};src:url(${data});}`;
      }));
      return faces.join('');
    } catch { return ''; /* offline: a system font stands in */ }
  })();
  return fontCss;
}

/* ⚠️ 4 decimals and a 1 ms step: at 3 decimals a 0.01 ms step rounded onto the SAME percentage, the two
   keyframes merged, and a layer that should switch faded slowly instead. */
const pct = (t: number, total: number) => `${((t / total) * 100).toFixed(4)}%`;

/* ── the animated SVG ───────────────────────────────────────────────────────────────────────── */

export async function animatedSvg(ch: number): Promise<string> {
  const s = slideModel(ch);
  const T = s.total;
  const css: string[] = [await interCss()];
  css.push(`.l,.cx,.cy,.r{animation-duration:${T}ms;animation-iteration-count:infinite;animation-timing-function:linear}`);
  const layers = s.layers.map((L, i) => {
    css.push(`@keyframes l${i}{${L.pts.map(([t, v]) => `${pct(t, T)}{opacity:${v}}`).join('')}}`);
    return `<g class="l" style="animation-name:l${i}">${L.markup}</g>`;
  }).join('');
  /* The cursor: x and y on two nested groups, each keyframe carrying the easing of the glide it starts. */
  const axis = (k: 0 | 1, ease: number[], name: string, fn: string) => {
    const kf: string[] = s.moves[0]?.t === 0 ? [] : [`0%{transform:${fn}(${s.start[k]}px)}`];
    for (const m of s.moves) {
      kf.push(`${pct(m.t, T)}{transform:${fn}(${m.from[k]}px);animation-timing-function:cubic-bezier(${ease.join(',')})}`);
      kf.push(`${pct(Math.min(m.t + GLIDE, T), T)}{transform:${fn}(${m.to[k]}px);animation-timing-function:linear}`);
    }
    kf.push(`100%{transform:${fn}(${cursorAt(s, T)[k].toFixed(2)}px)}`);
    css.push(`@keyframes ${name}{${kf.join('')}}`);
  };
  axis(0, EASE_X, 'cx', 'translateX');
  axis(1, EASE_Y, 'cy', 'translateY');
  const rings = s.presses.map((p, i) => {
    const a = p.t, b = Math.min(p.t + RING, T);
    css.push(`@keyframes r${i}{0%{opacity:0;transform:scale(.22)}${pct(a, T)}{opacity:0;transform:scale(.22)}${pct(a + 1, T)}{opacity:1;transform:scale(.22)}${pct(b, T)}{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}`);
    return `<g transform="translate(${p.at[0]} ${p.at[1]})"><circle class="r" r="9" fill="none" stroke="${YOU}" stroke-width="1.2" style="animation-name:r${i};transform-box:fill-box;transform-origin:center;opacity:0"/></g>`;
  }).join('');
  return `${open(640, 360)}<style>${css.join('')}</style>${s.defs}${layers}${rings}<g class="cx" style="animation-name:cx"><g class="cy" style="animation-name:cy">${CURSOR}</g></g></svg>`;
}

/* ── the GIF ────────────────────────────────────────────────────────────────────────────────── */

/** The same picture frozen at time t — what the GIF samples. */
function svgAt(s: Slide, t: number, font: string, w: number, h: number) {
  const layers = s.layers.map((L) => { const o = lerpPts(L.pts, t); return o <= 0.001 ? '' : `<g opacity="${o.toFixed(3)}">${L.markup}</g>`; }).join('');
  const rings = s.presses.map((p) => {
    if (t < p.t || t > p.t + RING) return '';
    const k = (t - p.t) / RING;
    return `<circle cx="${p.at[0]}" cy="${p.at[1]}" r="${(2 + 7 * k).toFixed(2)}" fill="none" stroke="${YOU}" stroke-width="1.2" opacity="${(1 - k).toFixed(2)}"/>`;
  }).join('');
  const [x, y] = cursorAt(s, t);
  return `${open(w, h)}<style>${font}</style>${s.defs}${layers}${rings}<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">${CURSOR}</g></svg>`;
}

async function draw(svg: string, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('frame')); img.src = url; });
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h).data;
  } finally { URL.revokeObjectURL(url); }
}

/** A 640×360 looping GIF of one slide at ~12.5 fps; identical consecutive frames are merged. */
export async function slideGif(ch: number, onProgress?: (p: number) => void): Promise<Blob> {
  const W = 640, H = 360, STEP = 80;
  const s = slideModel(ch);
  const font = await interCss();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const times: number[] = [];
  for (let t = 0; t < s.total; t += STEP) times.push(t);
  /* One palette for the whole slide, from a few sampled frames, so colours do not flicker between frames. */
  const samples = await Promise.all([0, 0.33, 0.66, 0.95].map(async (q) => draw(svgAt(s, s.total * q, font, W, H), ctx, W, H)));
  const pool = new Uint8ClampedArray(samples.reduce((n, a) => n + a.length, 0));
  let off = 0; for (const a of samples) { pool.set(a, off); off += a.length; }
  const palette = quantize(pool, 256);
  const gif = GIFEncoder();
  let pending: { index: Uint8Array; delay: number } | null = null;
  let prevSvg = '';
  for (let i = 0; i < times.length; i++) {
    const svg = svgAt(s, times[i], font, W, H);
    if (svg === prevSvg && pending) { pending.delay += STEP; continue; }
    if (pending) gif.writeFrame(pending.index, W, H, { palette, delay: pending.delay, repeat: 0 });
    const data = await draw(svg, ctx, W, H);
    pending = { index: applyPalette(data, palette), delay: STEP };
    prevSvg = svg;
    onProgress?.((i + 1) / times.length);
  }
  if (pending) gif.writeFrame(pending.index, W, H, { palette, delay: pending.delay, repeat: 0 });
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

export const slideLength = (ch: number) => FRAMES.filter((f) => f.ch === ch).reduce((n, f) => n + f.ms, 0);
