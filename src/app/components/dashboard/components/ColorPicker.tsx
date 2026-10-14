/**
 * ColorPicker — a named palette with a custom picker behind it.
 *
 * The field looks and measures like our Dropdown (36px, same border, same chevron) so a
 * colour reads as one more field in a form rather than as a special control. What opens
 * is a two-pane popover: the named swatches on the left, a full picker on the right.
 *
 * ── Named first, custom second ────────────────────────────────────────────────────
 * The value is normally a NAME ('Red'), not a hex. A name survives the theme switch —
 * it resolves through the caller's token for that colour — where a stored `#dc2626`
 * would stay the same ink on a dark card and become unreadable. Custom exists because
 * people ask for it, and is the only value stored as a literal.
 *
 * ── Why it is portalled ───────────────────────────────────────────────────────────
 * The picker is ~300px tall and the field can sit anywhere in a scrolling panel, so it
 * is portalled to <body> and positioned in viewport coordinates: it opens BELOW the
 * field, flips ABOVE when there is not enough room underneath, and slides along the
 * x-axis to stay on screen. Left inside the panel it was clipped by the first ancestor
 * with overflow — which is the panel itself.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import { isHex, hsvToRgb, rgbToHex, hexToHsv } from '../data/color.js';
import './ColorPicker.css';

const PW = 396, PH = 306, GAP = 6;

export function ColorPicker({ modelValue = '', options = [], resolve = null, onUpdateModelValue }: any) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const current = options.find((o: any) => o.id === modelValue);
  const label = current ? current.id : isHex(modelValue) ? 'Custom' : modelValue || 'Select';
  const swatch = current ? current.css : modelValue;

  /* ── the custom pane's own state ────────────────────────────────────────────────── */
  const [hsv, setHsv] = useState<any>({ h: 210, s: 0.5, v: 0.9 });
  const [alpha, setAlpha] = useState(1);
  const [hexIn, setHexIn] = useState('#7fa8d9');

  const rgb: any = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex: string = rgbToHex(rgb);
  const preview = alpha >= 1 ? hex : `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha.toFixed(2)})`;
  // the value Apply would commit — alpha below 1 has to be rgba(), which hex cannot carry
  const committed = alpha >= 1 ? hex : preview;

  // watch(hex) → keep the hex field in step with the square/rails
  const lastHex = useRef(hex);
  useEffect(() => { if (hex !== lastHex.current) { lastHex.current = hex; setHexIn(hex); } }, [hex]);
  const typeHex = (v: string) => {
    setHexIn(v);
    if (isHex(v)) setHsv(hexToHsv(v));
  };

  /* ── opening: measure, then place ───────────────────────────────────────────────── */
  const place = () => {
    const r = btn.current?.getBoundingClientRect(); if (!r) return;
    const below = window.innerHeight - r.bottom;
    // below by default; above when it would not fit and there IS room up there
    const top = below >= PH + GAP || below >= r.top ? r.bottom + GAP : Math.max(8, r.top - PH - GAP);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - PW - 8));
    setPos({ top, left });
  };
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (!next) return;
    if (isHex(modelValue)) { setHsv(hexToHsv(modelValue)); setHexIn(modelValue); }
    requestAnimationFrame(place);
  };
  const pickNamed = (o: any) => { onUpdateModelValue?.(o.id); setOpen(false); };
  const applyCustom = () => { onUpdateModelValue?.(committed); setOpen(false); };

  /* The popover lives on <body>, so it does not move with the panel behind it — close on
     scroll rather than leaving it stranded beside a field that has scrolled away. */
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true); window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', place); };
  }, [open]);

  /* ── the saturation/value square ────────────────────────────────────────────────── */
  const sv = useRef<HTMLDivElement>(null);
  const svFrom = (e: MouseEvent | React.MouseEvent) => {
    const r = sv.current!.getBoundingClientRect();
    setHsv((p: any) => ({
      ...p,
      s: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      v: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)),
    }));
  };
  const svDown = (e: React.MouseEvent) => {
    e.preventDefault();
    svFrom(e);
    const move = (ev: MouseEvent) => svFrom(ev);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  void resolve;

  return (
    <div className="dc-ColorPicker cp">
      <button ref={btn} type="button" className="cp-btn" onClick={toggle}>
        <span className="cp-sw" style={{ background: swatch }} />
        <span className="cp-lbl">{label}</span>
        {isHex(modelValue) && <span className="cp-hex">{modelValue}</span>}
        <Icon name="chevron-down" size={16} className="cp-chev" />
      </button>

      {open && (
        <DashPortal>
          <div className="dc-ColorPicker">
            <div className="cp-back" onClick={() => setOpen(false)} />
            <div className="cp-pop" style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
              {/* named palette */}
              <div className="cp-names">
                {options.map((o: any) => (
                  <button key={o.id} type="button" className={`cp-name ${o.id === modelValue ? 'on' : ''}`} onClick={() => pickNamed(o)}>
                    <span className="cp-sw" style={{ background: o.css }} />
                    <span className="ellip">{o.id}</span>
                    {o.id === modelValue && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>

              {/* custom */}
              <div className="cp-custom">
                <div
                  ref={sv} className="cp-sv"
                  style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
                  onMouseDown={svDown}
                >
                  <span className="cp-dot" style={{ left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%' }} />
                </div>

                <div className="cp-sliders">
                  <div className="cp-rails">
                    <input className="cp-hue" type="range" min={0} max={360} value={hsv.h} onChange={(e) => setHsv({ ...hsv, h: +e.target.value })} aria-label="Hue" />
                    <input
                      className="cp-alpha" type="range" min={0} max={1} step={0.01} value={alpha} onChange={(e) => setAlpha(+e.target.value)} aria-label="Opacity"
                      style={{ ['--a-to' as any]: hex }}
                    />
                  </div>
                  {/* on a checker, so a low alpha reads as transparent rather than as pale */}
                  <span className="cp-preview"><i style={{ background: preview }} /></span>
                </div>

                <div className="cp-fields">
                  <label className="cp-f cp-f-hex">
                    <input value={hexIn} onChange={(e) => typeHex(e.target.value)} spellCheck={false} />
                    <span>Hex</span>
                  </label>
                  <label className="cp-f"><input value={rgb.r} readOnly /><span>R</span></label>
                  <label className="cp-f"><input value={rgb.g} readOnly /><span>G</span></label>
                  <label className="cp-f"><input value={rgb.b} readOnly /><span>B</span></label>
                  <label className="cp-f"><input value={alpha.toFixed(2)} readOnly /><span>A</span></label>
                </div>

                <div className="cp-foot">
                  <button className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn btn-sm btn-primary" onClick={applyCustom}>Apply</button>
                </div>
              </div>
            </div>
          </div>
        </DashPortal>
      )}
    </div>
  );
}
