/**
 * EmailWidgetModal — Export ▸ Email as PDF for a single widget, with screenshot-style markup.
 *
 * The preview is a *live* render of the tile, not a bitmap: no html2canvas dependency, dark mode
 * keeps working, and text stays crisp. Annotations are kept as shape data (never rasterised here),
 * so Undo is a pop and the payload can be replayed by the server when it renders the real PDF.
 *
 * This was ShareWidgetModal, which also had an in-product "share this widget with technicians"
 * mode. Widget-level sharing is gone, so the component now does the one job its name states.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/primitives';
import { ChartTile } from './ChartTile';
import { DataTable } from './DataTable';
import { toast } from '../store.js';
import { useRefState } from '../reactivity.js';
import './EmailWidgetModal.css';

/* ---------------- annotation ---------------- */
const COLORS = ['#e0483d', '#d98a0b', '#1f9d63', '#3d8bd0', '#8b5cf6', '#364658'];
const SHAPES = [
  { id: 'rect', icon: 'shape-rect', label: 'Rectangle' },
  { id: 'ellipse', icon: 'shape-ellipse', label: 'Ellipse' },
  { id: 'arrow', icon: 'shape-arrow', label: 'Arrow' },
];

const path = (s: any) => s.pts.map((p: any, i: number) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
const box = (s: any) => ({ x: Math.min(s.x0, s.x1), y: Math.min(s.y0, s.y1), width: Math.abs(s.x1 - s.x0), height: Math.abs(s.y1 - s.y0) });
const ell = (s: any) => { const b = box(s); return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, rx: b.width / 2, ry: b.height / 2 }; };
function head(s: any) {
  const a = Math.atan2(s.y1 - s.y0, s.x1 - s.x0), L = 13, W = 7;
  const p = [
    [s.x1, s.y1],
    [s.x1 - L * Math.cos(a) + W * Math.sin(a), s.y1 - L * Math.sin(a) - W * Math.cos(a)],
    [s.x1 - L * Math.cos(a) - W * Math.sin(a), s.y1 - L * Math.sin(a) + W * Math.cos(a)],
  ];
  return p.map((q) => q.join(',')).join(' ');
}

export function EmailWidgetModal({ tile, onClose }: any) {
  const [tool, setTool] = useState<null | 'pen' | 'shape'>(null); // null = pointer (no drawing)
  const [shapeKind, setShapeKind] = useState('rect');
  const [color, setColor] = useState(COLORS[0]);
  const [shapeMenu, setShapeMenu] = useState(false);
  const [colorMenu, setColorMenu] = useState(false);

  const shapes: any = useRefState([]); // committed
  const draft: any = useRefState(null); // in-flight
  const drawing = tool !== null;
  const all = draft.value ? [...shapes.value, draft.value] : shapes.value;

  function at(e: any, el: Element) { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function down(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawing) return;
    const p = at(e, e.currentTarget);
    draft.value = tool === 'pen'
      ? { type: 'pen', color, pts: [p] }
      : { type: shapeKind, color, x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    if (!draft.value) return;
    const p = at(e, e.currentTarget);
    if (draft.value.type === 'pen') draft.value.pts.push(p);
    else { draft.value.x1 = p.x; draft.value.y1 = p.y; }
  }
  function up() {
    if (!draft.value) return;
    const s = draft.value;
    const tiny = s.type === 'pen' ? s.pts.length < 2 : Math.hypot(s.x1 - s.x0, s.y1 - s.y0) < 4;
    if (!tiny) shapes.value.push(s); // ignore stray clicks
    draft.value = null;
  }
  function undo() { shapes.value.pop(); }
  function clearAll() { shapes.value = []; draft.value = null; }

  function togglePen() { setTool(tool === 'pen' ? null : 'pen'); setShapeMenu(false); setColorMenu(false); }
  function toggleShape() {
    if (tool === 'shape') setShapeMenu(!shapeMenu);
    else { setTool('shape'); setShapeMenu(true); }
    setColorMenu(false);
  }
  function pickShape(id: string) { setShapeKind(id); setTool('shape'); setShapeMenu(false); }

  // Esc steps back: first it drops the active tool, then it closes the dialog.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e) => {
    if (e.key !== 'Escape') return;
    if (shapeMenu || colorMenu) { setShapeMenu(false); setColorMenu(false); }
    else if (tool) setTool(null);
    else onClose?.();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    const onDocClick = () => { setShapeMenu(false); setColorMenu(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocClick);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('click', onDocClick); };
  }, []);

  /* ---------------- recipients ---------------- */
  // No suggestion list: there is no directory of arbitrary email addresses to suggest from.
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ name: string }[]>([]);
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState(false);

  function addTyped() {
    const q = query.trim();
    if (!q) return;
    if (!picked.some((p) => p.name === q)) setPicked([...picked, { name: q }]);
    setQuery('');
  }
  function remove(i: number) { setPicked(picked.filter((_, k) => k !== i)); }

  const canSend = picked.length > 0;
  function send() {
    if (!canSend) return;
    const who = picked.length === 1 ? picked[0].name : `${picked.length} recipients`;
    const n = shapes.value.length;
    const marks = n ? ` with ${n} annotation${n > 1 ? 's' : ''}` : '';
    toast(`“${tile.title}” emailed as PDF${marks} to ${who}`, 'success');
    onClose?.();
  }

  const curShape = SHAPES.find((s) => s.id === shapeKind)!;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="dc-EmailWidgetModal overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="sw">
        {/* header: title left, markup tools hard right, then close */}
        <header className="sw-h">
          <b className="sw-t">Email as PDF</b>
          <div className="grow" />
          {/* Markup earns its place because a PDF is a SNAPSHOT: the marks travel with it. */}
          <div className="tools" onClick={stop}>
            <button className={`tl ${tool === 'pen' ? 'on' : ''}`} title="Draw freehand" onClick={togglePen}>
              <Icon name="pen" size={17} />
            </button>

            <div className="tl-wrap">
              <button className={`tl ${tool === 'shape' ? 'on' : ''}`} title={`Shape — ${curShape.label}`} onClick={toggleShape}>
                <Icon name={curShape.icon} size={17} />
                <Icon name="chevron-down" size={12} className="caret" />
              </button>
              {shapeMenu && (
                <div className="pop">
                  {SHAPES.map((s) => (
                    <button key={s.id} className={`pop-i ${shapeKind === s.id ? 'on' : ''}`} onClick={() => pickShape(s.id)}>
                      <Icon name={s.icon} size={16} /> {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tl-wrap">
              <button className="tl" title="Colour" onClick={() => setColorMenu(!colorMenu)}>
                <span className="chip" style={{ background: color }} />
              </button>
              {colorMenu && (
                <div className="pop swatches">
                  {COLORS.map((c) => (
                    <button key={c} className={`sw-dot ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => { setColor(c); setColorMenu(false); }} />
                  ))}
                  <label className="sw-dot custom" title="Custom colour">
                    <Icon name="palette" size={14} />
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                  </label>
                </div>
              )}
            </div>

            <span className="tl-sep" />
            <button className="tl" title="Undo last mark" disabled={!shapes.value.length} onClick={undo}><Icon name="undo" size={17} /></button>
            <button className="tl" title="Clear all marks" disabled={!shapes.value.length} onClick={clearAll}><Icon name="erase" size={17} /></button>
          </div>
          <span className="tl-sep" />
          <button className="tl close" title="Close" onClick={() => onClose?.()}><Icon name="x" size={18} /></button>
        </header>

        <div className="sw-b">
          {/* the widget, with a markup layer over it */}
          <div className={`snap ${drawing ? 'drawing' : ''}`}>
            {/* no Copy link: a widget has no URL of its own to hand out */}
            <div className="snap-h"><b>{tile.title}</b></div>
            <div className="snap-c">
              {tile.type === 'kpi' ? (
                <div className="pv-kpi">{tile.value}{tile.unit && <span className="u">{tile.unit}</span>}</div>
              ) : tile.type === 'chart' && tile.chart ? (
                <ChartTile chart={tile.chart} height={260} />
              ) : tile.type === 'shortcut' ? (
                <DataTable columns={tile.columns || []} rows={tile.rows || []} sortable={false} />
              ) : null}
            </div>

            <svg className="anno" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              {all.map((s: any, i: number) =>
                s.type === 'pen' ? (
                  <path key={i} d={path(s)} stroke={s.color} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                ) : s.type === 'rect' ? (
                  <rect key={i} {...box(s)} stroke={s.color} fill="none" strokeWidth={3} rx={4} />
                ) : s.type === 'ellipse' ? (
                  <ellipse key={i} {...ell(s)} stroke={s.color} fill="none" strokeWidth={3} />
                ) : (
                  <g key={i}>
                    <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1} stroke={s.color} strokeWidth={3} strokeLinecap="round" />
                    <polygon points={head(s)} fill={s.color} />
                  </g>
                ),
              )}
            </svg>

            {drawing && <span className="hint">{tool === 'pen' ? 'Draw to highlight' : `Drag to place a ${shapeKind}`} · Esc to stop</span>}
          </div>

          {/* Recipients. NOT "Share with", and no permission selector beside it: the thing being
              sent is a rendered PDF, so there is no access to grant. */}
          <label className="fl">Send to</label>
          <div className={`rcpt ${focused ? 'focus' : ''}`}>
            {picked.map((p, i) => (
              <span key={p.name} className="rchip">
                <Icon name="mail" size={12} />{p.name}
                <button onClick={() => remove(i)}><Icon name="x" size={12} /></button>
              </span>
            ))}
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} type="email"
              placeholder={picked.length ? '' : 'Type an email address and press Enter…'}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTyped(); }
                if (e.key === 'Backspace' && !query && picked.length) remove(picked.length - 1);
              }}
            />
          </div>

          {/* the note IS the email body, which is what earns it a place here */}
          <label className="fl">Add note</label>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Write a note…" />
        </div>

        <footer className="sw-f">
          <button className="btn" onClick={() => onClose?.()}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSend} title={canSend ? '' : 'Add at least one email address'} onClick={send}>
            <Icon name="mail" size={15} /> Send PDF
          </button>
        </footer>
      </div>
    </div>
  );
}
