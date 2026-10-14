import { useRef, useState } from 'react';
import './TimeFilter.css';
import { Icon } from '../ui/primitives';
import { store, toast } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { QUICK } from '../data/timeRanges.js';

// Applied absolute range → compact two-line (From / To) display, like the reference.
function fmtRange(s: string) {
  if (!s) return '';
  const [d, t = ''] = s.split('T');
  const [Y, M, D] = d.split('-');
  const hms = (t || '00:00').length === 5 ? `${t}:00` : (t || '00:00:00');
  return `${(Y || '').slice(2)}-${M}-${D} ${hms}`;
}
function openPicker(el: any) { try { el?.showPicker?.(); } catch (e) { el?.focus(); } }

export function TimeFilter() {
  useDashStore();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fromEl = useRef<HTMLInputElement>(null);
  const toEl = useRef<HTMLInputElement>(null);
  const isCustom = store.timeFilter.preset === 'custom' && store.timeFilter.from && store.timeFilter.to;

  // Quick ranges live in data/timeRanges.js — a widget's own date override reads the same
  // list, so the global picker and a per-widget one can never offer different ranges.
  function pick(q: any) { store.timeFilter = { preset: q.k, label: q.label, from: null, to: null }; setOpen(false); }
  function applyAbs() {
    if (!from || !to) { toast('Pick both From and To'); return; }
    const fmt = (s: string) => s.replace('T', ' ');
    store.timeFilter = { preset: 'custom', label: `${fmt(from)} → ${fmt(to)}`, from, to };
    setOpen(false);
  }

  return (
    <div className="dc-TimeFilter tf">
      <button className={`btn trigger ${open ? 'on' : ''} ${isCustom ? 'is-range' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <Icon name="clock" size={16} />
        {isCustom ? (
          <span className="rng">
            <span className="rl">{fmtRange(store.timeFilter.from)}</span>
            <span className="rl">{fmtRange(store.timeFilter.to)}</span>
          </span>
        ) : <span className="lbl-1">{store.timeFilter.label}</span>}
        <Icon name="chevron-down" size={14} className="muted" />
      </button>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="pop" onClick={(e) => e.stopPropagation()}>
          {/* Absolute time range (From / To stacked vertically) */}
          <div className="abs">
            <div className="lbl">Absolute time range</div>
            <div className="field-block">
              <label>From</label>
              <div className="dt">
                <input ref={fromEl} className="input" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
                <button className="cal" onClick={() => openPicker(fromEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
              </div>
            </div>
            <div className="field-block">
              <label>To</label>
              <div className="dt">
                <input ref={toEl} className="input" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
                <button className="cal" onClick={() => openPicker(toEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
              </div>
            </div>
            <button className="btn btn-primary apply" onClick={applyAbs}><Icon name="check" size={15} /> Apply time range</button>
          </div>

          {/* Quick ranges. No search box: the list is a fixed, short, ordered set — searching a
              dozen visible rows costs a keystroke to reach what is already on screen, and the
              ordering (shortest window first) is itself how you find a range. */}
          <div className="quick">
            <div className="qlist">
              {(QUICK as any[]).map((q) => (
                <button key={q.k} className={`qitem ${store.timeFilter.preset === q.k ? 'on' : ''}`} onClick={() => pick(q)}>
                  {q.label} {store.timeFilter.preset === q.k && <Icon name="check" size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
