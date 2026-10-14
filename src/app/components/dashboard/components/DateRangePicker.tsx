/* A range FIELD, not a dropdown: a read-only box showing the chosen range with a calendar button on
 * its right. Clicking either opens a From/To popover.
 *
 * A <select> was wrong here for the same reason it is wrong in the topbar: a range can be a named
 * preset OR an absolute From→To, and a dropdown can only offer the first. The calendar is what says
 * "this opens a date picker", which is exactly what it does. */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import { windowFor, stampFor } from '../data/timeRanges.js';
import './DateRangePicker.css';

const W = 288;
const H = 244;

export function DateRangePicker({ modelValue = '', onUpdateModelValue }: any) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fieldEl = useRef<HTMLDivElement>(null);
  const fromEl = useRef<HTMLInputElement>(null);
  const toEl = useRef<HTMLInputElement>(null);

  // the tooltip resolves the value to real timestamps — the part a label can never carry
  let title = 'Pick a date range';
  if (modelValue) { const { start, end } = (windowFor as any)(modelValue); title = `${stampFor(start)} → ${stampFor(end)}`; }

  function toggle() {
    if (open) { setOpen(false); return; }
    const r = fieldEl.current?.getBoundingClientRect(); if (!r) return;
    // flip above when there is no room below — this sits low in a scrolling config column
    const flip = r.bottom + H > window.innerHeight;
    setPos({
      top: flip ? Math.max(8, r.top - H - 6) : r.bottom + 6,
      left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)),
    });
    setOpen(true);
  }
  function applyAbs() {
    if (!from || !to) return;
    const fmt = (s: string) => { const [Y, M, D] = s.split('T')[0].split('-'); return `${D}/${M}/${Y.slice(2)}`; };
    onUpdateModelValue?.(`${fmt(from)} – ${fmt(to)}`);
    setOpen(false);
  }
  function openPicker(el: any) { try { el?.showPicker?.(); } catch (e) { el?.focus(); } }
  useEffect(() => {
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  return (
    <>
      <div ref={fieldEl} className={`dc-DateRangePicker drf ${open ? 'on' : ''}`} title={title} onClick={toggle}>
        <span className={`drf-v ${!modelValue ? 'ph' : ''}`}>{modelValue || 'Select a date range'}</span>
        <button type="button" className="drf-cal" tabIndex={-1}><Icon name="calendar" size={16} /></button>
      </div>

      {open && (
        <DashPortal>
          <div className="dc-DateRangePicker">
            <div className="drf-back" onClick={() => setOpen(false)} />
            {/* The calendar, and only the calendar. This field asks for a date RANGE, so it offers
                From and To; the quick-range list would be a second, differently-shaped answer to the
                same question inside a form that has already committed to explicit dates. */}
            <div className="drf-pop" style={{ top: pos.top + 'px', left: pos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
              <div className="drf-abs">
                <div className="drf-h">Select a date range</div>
                <div className="drf-fb">
                  <label>From</label>
                  <div className="drf-dt">
                    <input ref={fromEl} className="input" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
                    <button type="button" className="drf-ci" onClick={() => openPicker(fromEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
                  </div>
                </div>
                <div className="drf-fb">
                  <label>To</label>
                  <div className="drf-dt">
                    <input ref={toEl} className="input" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
                    <button type="button" className="drf-ci" onClick={() => openPicker(toEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
                  </div>
                </div>
                <div className="drf-foot">
                  <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-sm btn-primary" disabled={!from || !to} onClick={applyAbs}>Apply</button>
                </div>
              </div>
            </div>
          </div>
        </DashPortal>
      )}
    </>
  );
}
