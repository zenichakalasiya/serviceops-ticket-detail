/**
 * ColorPanel — the rich-text editor's colour picker (2026-09-30, to the user's screenshot):
 * a named list on the left — Default · Gray · Green · Blue · Yellow · Orange · Red, a rule,
 * then Custom — and the custom pane on the right: saturation square, hue and opacity rails
 * with a preview chip, Hex (no #) · R · G · B · A, and Cancel / Apply.
 *
 * A named row applies at once and closes. The custom pane commits only on Apply, as a
 * literal (#hex, or rgba() below full opacity). Clicking Custom (or touching the pane)
 * marks the custom row as the one in force.
 *
 * It is PORTALLED to <body> and placed in viewport coordinates beside its anchor: the
 * editor sits in the builder's scrolling sidebar, which would clip a 440px panel. It opens
 * ABOVE the anchor (the editor's bars are at its bottom) and flips below when there is no
 * room. Every mousedown inside is prevented except on the inputs, so a click on a swatch
 * never takes the editor's selection away.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import { isHex, hsvToRgb, rgbToHex, hexToHsv, rgbToHsv, parseLiteral } from '../data/color.js';
import './ColorPanel.css';

const PW = 440, PH = 306, GAP = 6;

export function ColorPanel({ modelValue = 'Default', options = [], anchor = null, onPick, onClose }: any) {
  const named = options.find((o: any) => o.id === modelValue);
  const [customOn, setCustomOn] = useState(!named);

  /* ── custom pane state, seeded from the value in force when it is a literal ── */
  const [hsv, setHsv] = useState<any>(() => { const lit: any = parseLiteral(modelValue); return lit ? rgbToHsv(lit.rgb) : hexToHsv('#24344d'); });
  const [alpha, setAlpha] = useState<number>(() => { const lit: any = parseLiteral(modelValue); return lit ? lit.a : 1; });
  const rgb: any = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex: string = rgbToHex(rgb);
  const out = alpha >= 1 ? hex : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${+alpha.toFixed(2)})`;
  const hexTxt = hex.slice(1).toUpperCase();

  const touch = () => setCustomOn(true);
  const typeHex = (v: string) => {
    const h = '#' + v.replace(/[^0-9a-f]/gi, '');
    if (isHex(h) && (h.length === 4 || h.length === 7)) { setHsv(hexToHsv(h)); touch(); }
  };
  const typeRgb = (k: string, v: string) => {
    const n = Math.min(255, Math.max(0, parseInt(v, 10) || 0));
    setHsv(rgbToHsv({ ...rgb, [k]: n })); touch();
  };
  const typeA = (v: string) => { const n = parseFloat(v); if (!isNaN(n)) { setAlpha(Math.min(1, Math.max(0, n))); touch(); } };

  /* the saturation/value square */
  const sv = useRef<HTMLDivElement>(null);
  const svFrom = (e: MouseEvent | React.MouseEvent) => {
    const r = sv.current!.getBoundingClientRect();
    setHsv((p: any) => ({ ...p, s: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), v: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)) }));
  };
  const svDown = (e: React.MouseEvent) => {
    e.preventDefault();
    touch(); svFrom(e);
    const move = (ev: MouseEvent) => svFrom(ev);
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
    addEventListener('mousemove', move); addEventListener('mouseup', up);
  };

  /* ── placement ── */
  const [pos, setPos] = useState({ top: -9999, left: 0 });
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const place = () => {
      const r = anchor?.getBoundingClientRect(); if (!r) return;
      const top = r.top >= PH + GAP + 8 ? r.top - PH - GAP : Math.min(window.innerHeight - PH - 8, r.bottom + GAP);
      const left = Math.max(8, Math.min(r.left + r.width / 2 - PW / 2, window.innerWidth - PW - 8));
      setPos({ top, left });
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current?.(); };
    requestAnimationFrame(place);
    addEventListener('resize', place); addEventListener('scroll', place, true); addEventListener('keydown', onKey);
    return () => { removeEventListener('resize', place); removeEventListener('scroll', place, true); removeEventListener('keydown', onKey); };
  }, [anchor]);

  // keep the editor's selection: swallow mousedown everywhere except in a text field
  const guard = (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('input')) e.preventDefault(); };

  return (
    <DashPortal>
      <div className="dc-ColorPanel cpx" style={{ top: pos.top, left: pos.left }} onMouseDown={guard}>
        <div className="cpx-names">
          {options.map((o: any) => (
            <button key={o.id} type="button" className={`cpx-row ${!customOn && o.id === modelValue ? 'on' : ''}`} onClick={() => onPick?.(o.id)}>
              <span className="cpx-sw" style={{ background: o.swatch || o.css }} />
              <span className="cpx-l">{o.id}</span>
              {!customOn && o.id === modelValue && <Icon name="check" size={15} />}
            </button>
          ))}
          <i className="cpx-rule" />
          <button type="button" className={`cpx-row ${customOn ? 'on' : ''}`} onClick={touch}>
            <span className="cpx-sw cpx-sw-ck"><i style={{ background: out }} /></span>
            <span className="cpx-l">Custom</span>
            {customOn && <Icon name="check" size={15} />}
          </button>
        </div>

        <div className="cpx-pane">
          <div
            ref={sv} className="cpx-sv" onMouseDown={svDown}
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
          >
            <span className="cpx-dot" style={{ left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%' }} />
          </div>

          <div className="cpx-sliders">
            <div className="cpx-rails">
              <input className="cpx-hue" type="range" min={0} max={359} aria-label="Hue" value={hsv.h} onChange={(e) => { setHsv({ ...hsv, h: +e.target.value }); touch(); }} />
              <input className="cpx-alpha" type="range" min={0} max={1} step={0.01} aria-label="Opacity" value={alpha} style={{ ['--a-to' as any]: hex }} onChange={(e) => { setAlpha(+e.target.value); touch(); }} />
            </div>
            <span className="cpx-prev"><i style={{ background: out }} /></span>
          </div>

          <div className="cpx-fields">
            <label className="cpx-f cpx-f-hex"><input key={'h' + hexTxt} defaultValue={hexTxt} maxLength={6} spellCheck={false} onBlur={(e) => typeHex(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && typeHex((e.target as HTMLInputElement).value)} /><span>Hex</span></label>
            {(['r', 'g', 'b'] as const).map((k) => (
              <label key={k} className="cpx-f"><input key={k + rgb[k]} defaultValue={rgb[k]} onBlur={(e) => typeRgb(k, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && typeRgb(k, (e.target as HTMLInputElement).value)} /><span>{k.toUpperCase()}</span></label>
            ))}
            <label className="cpx-f"><input key={'a' + alpha} defaultValue={+alpha.toFixed(2)} onBlur={(e) => typeA(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && typeA((e.target as HTMLInputElement).value)} /><span>A</span></label>
          </div>

          <div className="cpx-foot">
            <button type="button" className="btn" onClick={() => onClose?.()}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={() => onPick?.(out)}>Apply</button>
          </div>
        </div>
      </div>
    </DashPortal>
  );
}
