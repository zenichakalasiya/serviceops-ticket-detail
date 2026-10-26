import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConflictArt, RuleCheckArt } from './FormRuleRelatedView';
import { ReverseActionArt, SimilarRuleArt } from './FormRuleArt';
import { GUIDE_CHAPTERS } from './FormRuleGuide';
import { animatedSvg, slideGif, slideLength } from './formRuleGuideExport';

/**
 * Form Rule illustrations — #/admin/request-form-rules/illustrations (Zeni, 19 Oct 2026).
 * The four pictures the rule check popups and the Form Rules Guide draw, for handing to developers:
 * download SVG, download PNG at 2x, or copy the SVG code. Opened from the icon beside Cancel in the
 * rule editor's header.
 *
 * Every preview IS the live component, and every file is built from the rendered <svg>, so a download
 * can never differ from the screen. Each file carries the background the picture sits on in the
 * product (Zeni: "as shown on screen"). Captions are not part of the drawings.
 */

type Item = {
  id: string;
  name: string;
  usedIn: string;
  bg: string;
  /** Room around the drawing, as the guide's example block gives it (px). */
  pad: number;
  /** The file's size in px, padding included. */
  size: string;
  art: React.ReactNode;
};

const ITEMS: Item[] = [
  { id: 'similar-rules-popup', name: 'Similar rules', usedIn: 'Similar rules popup (summary card)', bg: '#F4F6FA', pad: 0, size: '320 × 112', art: <RuleCheckArt conflicts={false} similar /> },
  { id: 'conflict', name: 'Conflict', usedIn: 'Conflicts popup and the guide’s Conflict example', bg: '#F4F6FA', pad: 0, size: '300 × 112', art: <ConflictArt /> },
  { id: 'similar-rule-example', name: 'Similar rule example', usedIn: 'Form Rules Guide › Similar Rule', bg: '#FFFFFF', pad: 12, size: '464 × 102', art: <SimilarRuleArt /> },
  { id: 'reverse-action-example', name: 'Reverse action example', usedIn: 'Form Rules Guide › Reverse Action', bg: '#FFFFFF', pad: 12, size: '464 × 102', art: <ReverseActionArt /> },
];

const FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/** A standalone SVG file from the rendered drawing: real size, the product font named, its background. */
function buildSvg(svg: SVGSVGElement, bg: string, pad = 0) {
  const c = svg.cloneNode(true) as SVGSVGElement;
  const [, , vw, vh] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/).map(Number);
  const w = vw + pad * 2, h = vh + pad * 2;
  c.setAttribute('viewBox', `${-pad} ${-pad} ${w} ${h}`);
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  c.setAttribute('width', String(w));
  c.setAttribute('height', String(h));
  c.setAttribute('font-family', FONT);
  c.removeAttribute('class');
  c.removeAttribute('aria-hidden');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(-pad));
  rect.setAttribute('y', String(-pad));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('fill', bg);
  const defs = c.querySelector('defs');
  c.insertBefore(rect, defs ? defs.nextSibling : c.firstChild);
  return { node: c, w, h, markup: new XMLSerializer().serializeToString(c) };
}

/* An <img> cannot reach the page's web fonts, so the PNG would fall back to Arial and the text would
   spill out of its boxes. The PNG copy embeds Inter, cut down to just the characters drawn. */
async function embedInter(node: SVGSVGElement) {
  const chars = Array.from(new Set(node.textContent ?? '')).join('');
  if (!chars.trim()) return;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&text=${encodeURIComponent(chars)}`)).text();
  const faces = await Promise.all(css.split('@font-face').slice(1).map(async (block) => {
    const url = /url\(([^)]+)\)/.exec(block)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1] ?? '400';
    if (!url) return '';
    const blob = await (await fetch(url)).blob();
    const data = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
    return `@font-face{font-family:'Inter';font-weight:${weight};src:url(${data});}`;
  }));
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = faces.join('');
  node.insertBefore(style, node.firstChild);
}

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function downloadPng(svg: SVGSVGElement, bg: string, pad: number, name: string) {
  const { node, w, h } = buildSvg(svg, bg, pad);
  try { await embedInter(node); } catch { /* offline: falls back to a system font */ }
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(node)], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  canvas.toBlob((b) => b && save(b, name), 'image/png');
}

const BTN = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#CBD5E1] hover:bg-[#F9FAFB]';

function IllustrationCard({ item }: { item: Item }) {
  const box = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const svg = () => box.current?.querySelector('svg') as SVGSVGElement | null;
  const file = `form-rule-${item.id}`;

  const onSvg = () => { const s = svg(); if (s) save(new Blob([buildSvg(s, item.bg, item.pad).markup], { type: 'image/svg+xml' }), `${file}.svg`); };
  const onPng = () => { const s = svg(); if (s) downloadPng(s, item.bg, item.pad, `${file}@2x.png`).catch(() => toast.error('Could not make the PNG')); };
  const onCopy = async () => {
    const s = svg(); if (!s) return;
    try {
      await navigator.clipboard.writeText(buildSvg(s, item.bg, item.pad).markup);
      setCopied(true); toast.success('SVG code copied');
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error('Could not copy — your browser blocked the clipboard'); }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#E5E9F0] bg-white">
      <div className="flex min-h-[200px] items-center justify-center border-b border-[#E5E9F0] p-6" style={{ background: item.bg === '#FFFFFF' ? '#F9FAFB' : '#FFFFFF' }}>
        <div ref={box} className="w-full max-w-[460px] overflow-hidden rounded-lg border border-[#E5E9F0]" style={{ background: item.bg }}>
          <div style={{ padding: item.pad }}>{item.art}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[#1D2A3E]">{item.name}</div>
          <div className="mt-0.5 text-[12px] text-[#64748B]">{item.usedIn}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">{item.size} px · background {item.bg}</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button type="button" onClick={onSvg} className={BTN}><Download size={14} /> SVG</button>
          <button type="button" onClick={onPng} className={BTN}><Download size={14} /> PNG @2x</button>
          <button type="button" onClick={onCopy} className={BTN}>{copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />} Copy SVG</button>
        </div>
      </div>
    </div>
  );
}

const kb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** One slide of the guide video (Zeni, 26 Oct 2026): the animated SVG playing in a plain <img> — exactly
 *  how a developer would use it — with SVG / GIF downloads and Copy SVG. Animation only: the title, text
 *  and buttons stay real UI in the product. */
function SlideCard({ ch }: { ch: number }) {
  const c = GUIDE_CHAPTERS[ch];
  const file = `form-rule-guide-${ch + 1}-${slug(c.title)}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [gif, setGif] = useState<Blob | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true; let u = '';
    animatedSvg(ch).then((m) => { if (!live) return; u = URL.createObjectURL(new Blob([m], { type: 'image/svg+xml' })); setSvg(m); setUrl(u); });
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [ch]);
  const onSvg = () => { if (svg) save(new Blob([svg], { type: 'image/svg+xml' }), `${file}.svg`); };
  const onGif = async () => {
    if (gif) { save(gif, `${file}.gif`); return; }
    setBusy(0);
    try { const blob = await slideGif(ch, (p) => setBusy(p)); setGif(blob); save(blob, `${file}.gif`); }
    catch { toast.error('Could not make the GIF'); }
    finally { setBusy(null); }
  };
  const onCopy = async () => {
    if (!svg) return;
    try { await navigator.clipboard.writeText(svg); setCopied(true); toast.success('SVG code copied'); setTimeout(() => setCopied(false), 1600); }
    catch { toast.error('Could not copy — your browser blocked the clipboard'); }
  };
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#E5E9F0] bg-white" data-slide={ch + 1}>
      <div className="flex items-center justify-center border-b border-[#E5E9F0] bg-[#F9FAFB] p-6">
        <div className="aspect-[16/9] w-full max-w-[460px] overflow-hidden rounded-lg border border-[#E5E9F0] bg-white">
          {url ? <img src={url} alt={c.title} className="h-full w-full" />
            : <div className="flex h-full items-center justify-center text-[12px] text-[#94A3B8]"><Loader2 size={16} className="mr-2 animate-spin" /> Preparing…</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[#1D2A3E]">{ch + 1}. {c.title}</div>
          <div className="mt-0.5 text-[12px] text-[#64748B]">Guide video · slide {ch + 1} of {GUIDE_CHAPTERS.length} · loops every {(slideLength(ch) / 1000).toFixed(1)} s</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">SVG {svg ? kb(new Blob([svg]).size) : '…'} · GIF 640 × 360{gif ? ` · ${kb(gif.size)}` : ''}</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button type="button" onClick={onSvg} disabled={!svg} className={`${BTN} disabled:opacity-50`}><Download size={14} /> SVG</button>
          <button type="button" onClick={onGif} disabled={busy !== null} className={`${BTN} disabled:cursor-wait disabled:opacity-70`}>
            {busy !== null ? <><Loader2 size={14} className="animate-spin" /> {Math.round(busy * 100)}%</> : <><Download size={14} /> GIF</>}
          </button>
          <button type="button" onClick={onCopy} disabled={!svg} className={`${BTN} disabled:opacity-50`}>{copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />} Copy SVG</button>
        </div>
      </div>
    </div>
  );
}

export function FormRuleIllustrations({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-start gap-2 px-4 pb-4 pt-4">
        <button type="button" onClick={onBack} title="Back" className="-ml-1.5 flex size-[30px] flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[16px] font-semibold text-[#1D2A3E]">Form Rule illustrations</h1>
          <p className="mt-0.5 text-[12px] text-[#64748B]">The pictures in the rule check popups and the Form Rules Guide. Download them as SVG or PNG, or copy the SVG code.</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {ITEMS.map((it) => <IllustrationCard key={it.id} item={it} />)}
        </div>

        {/* The guide video, one file per slide (Zeni, 26 Oct 2026). */}
        <div className="mb-3 mt-8">
          <h2 className="text-[15px] font-semibold text-[#1D2A3E]">Guide video slides</h2>
          <p className="mt-0.5 text-[12px] text-[#64748B]">One file per slide, animation only — show the title, text and buttons as real UI. Use the animated SVG in an &lt;img&gt; (small, sharp, loops forever); the GIF is the fallback.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {GUIDE_CHAPTERS.map((c, i) => <SlideCard key={c.name} ch={i} />)}
        </div>
      </div>
    </div>
  );
}
