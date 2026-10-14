/**
 * MorphIconKit — the monochrome Chart Morph as files a developer can take away, on the
 * /loaders page under its card: the animated SVG (auto light/dark, or in the text colour),
 * the five charts as stills (SVG + PNG), the component source, and everything as one zip.
 * The files themselves are built in data/morphIcon.js.
 *
 * Port note: the Vue original shipped its own `ChartLoader.vue` source; this ships the React
 * port's `ChartLoader.tsx` (read raw by Vite) — the file a developer of THIS app would take.
 */
import { FRAMES, morphSvg, morphPng, zip } from '../data/morphIcon.js';
// @ts-ignore — Vite's ?raw import (the component's own source text)
import chartLoaderSrc from './ChartLoader.tsx?raw';
import { Icon } from '../ui/primitives';
import { toast } from '../store.js';
import './MorphIconKit.css';

const USAGE = `<ChartLoader variant="morph" mono smooth size={60} />`;

const ANIMATED: any[] = [
  { theme: 'auto', file: 'chart-morph.svg', label: 'Animated SVG', note: 'Follows light / dark' },
  { theme: 'current', file: 'chart-morph-currentcolor.svg', label: 'Animated SVG · text colour', note: 'Inline it; tint with CSS color' },
];

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const svgBlob = (s: string) => new Blob([s], { type: 'image/svg+xml' });

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`, 'success');
  } catch {
    toast('Copy was blocked by the browser — use Download instead', 'warn');
  }
}

const dlSvg = (a: any) => save(svgBlob(morphSvg({ theme: a.theme })), a.file);
const dlFrameSvg = (i: number) => save(svgBlob(morphSvg({ theme: 'auto', frame: i })), `chart-morph-${(FRAMES as any)[i].id}.svg`);
async function dlFramePng(i: number) {
  try { save(await morphPng(i), `chart-morph-${(FRAMES as any)[i].id}@4x.png`); } catch { toast('PNG could not be rendered', 'danger'); }
}
const dlSrc = () => save(new Blob([chartLoaderSrc], { type: 'text/plain' }), 'ChartLoader.tsx');

const README = `Chart Morph — Monochrome (Column · Line · Donut · Scatter · Stacked)
The widget loader from the ServiceOps dashboard prototype (/loaders).

chart-morph.svg               Animated, self-contained (pure CSS keyframes, 10s loop,
                              2s per chart). Works as <img src>, CSS background or inline.
                              Follows the OS light/dark setting; honours reduced motion.
chart-morph-currentcolor.svg  Same animation in ONE colour, currentColor. Inline it in the
                              HTML and set CSS 'color' on the parent to tint it.
frames/*.svg, frames/*.png    The five charts as stills (PNG at 4x, 640x400, transparent).
react/ChartLoader.tsx         The React component (all loader variants).
                              Usage: ${USAGE}

Artboard 160x100. The product shows it 60px wide in the widget body with a caption under
it: Stacking the columns… · Tracing the trend… · Slicing the donut… · Finding the pattern… ·
Filling the columns…
`;

async function dlAll() {
  const enc = new TextEncoder();
  const files: any[] = [
    ...ANIMATED.map((a) => ({ name: a.file, data: enc.encode(morphSvg({ theme: a.theme })) })),
    ...(FRAMES as any[]).map((f, i) => ({ name: `frames/chart-morph-${f.id}.svg`, data: enc.encode(morphSvg({ theme: 'auto', frame: i })) })),
    { name: 'react/ChartLoader.tsx', data: enc.encode(chartLoaderSrc) },
    { name: 'README.txt', data: enc.encode(README) },
  ];
  for (const [i, f] of (FRAMES as any[]).entries()) {
    files.push({ name: `frames/chart-morph-${f.id}@4x.png`, data: new Uint8Array(await (await morphPng(i)).arrayBuffer()) });
  }
  save(zip(files), 'chart-morph-icon.zip');
}

const thumb = (i: number) => morphSvg({ theme: 'current', frame: i, width: 44 });

export function MorphIconKit() {
  return (
    <section className="kit dc-MorphIconKit" aria-label="Chart Morph icon files">
      <div className="kit-head">
        <span className="kit-t"><Icon name="download" size={14} /> Icon files</span>
        {/* the primary CTA is the product's blue button */}
        <button className="btn btn-primary btn-sm" onClick={dlAll}><Icon name="package" size={14} /> Download all (.zip)</button>
      </div>

      {ANIMATED.map((a) => (
        <div key={a.file} className="kit-row">
          <div className="kit-l"><b>{a.label}</b><span>{a.note}</span></div>
          <button className="kit-b" title="Copy SVG code" onClick={() => copy(morphSvg({ theme: a.theme }), 'SVG code')}><Icon name="copy" size={13} /> Copy</button>
          <button className="kit-b" title={`Download ${a.file}`} onClick={() => dlSvg(a)}><Icon name="download" size={13} /> SVG</button>
        </div>
      ))}

      <div className="kit-sub">Still frames</div>
      <div className="kit-frames">
        {(FRAMES as any[]).map((f, i) => (
          <div key={f.id} className="kit-f">
            {/* our own generated SVG */}
            <span className="kit-art" dangerouslySetInnerHTML={{ __html: thumb(i) }} />
            <span className="kit-fn">{f.name}</span>
            <span className="kit-fb">
              <button title="Download SVG" onClick={() => dlFrameSvg(i)}>SVG</button>
              <button title="Download PNG (4×)" onClick={() => dlFramePng(i)}>PNG</button>
            </span>
          </div>
        ))}
      </div>

      <div className="kit-row">
        <div className="kit-l"><b>React component</b><code>{USAGE}</code></div>
        <button className="kit-b" title="Copy usage" onClick={() => copy(USAGE, 'Usage')}><Icon name="copy" size={13} /> Copy</button>
        <button className="kit-b" title="Download ChartLoader.tsx" onClick={dlSrc}><Icon name="download" size={13} /> .tsx</button>
      </div>
    </section>
  );
}
