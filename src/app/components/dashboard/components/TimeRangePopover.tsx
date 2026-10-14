/**
 * TimeRangePopover — the two-pane date picker, in one place.
 *
 * Absolute From/To on the left, the quick ranges on the right. It is the SAME popover the topbar's
 * global Time Filter shows; a widget's own override and a group's override open it too, so a range
 * can never exist in one picker and not another, or resolve to a different window depending on
 * where it was chosen. `QUICK` and `windowFor()` come from data/timeRanges.js, the single source.
 *
 * The escape row at the bottom ("Follow dashboard filter" / "Follow group filter") is the only part
 * that differs by caller, so it comes in as a label rather than being branched on in here.
 *
 * Portalled to the body and positioned in viewport coordinates, because every one of its anchors
 * sits inside something with `overflow: hidden`.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import { QUICK } from '../data/timeRanges.js';
import './TimeRangePopover.css';

/** Snapshot an element's box as a PLAIN object — the only shape the `rect` prop accepts. */
export function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height };
}

const W = 496;

export function TimeRangePopover({
  // the range currently in force, so the matching quick row can be ticked
  value = null,
  // the trigger's position, as a PLAIN {top,left,bottom,right} — callers pass `rectOf(el)`
  rect,
  // the way back out of an override; omitted (null) when there is nothing to fall back to
  followLabel = null,
  // one line explaining what this range applies to, shown above the panes
  note = '',
  onPick, onClear, onClose,
}: any) {
  const pos = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - W - 8)) };

  /* Focus the panel itself on open: it is portalled to the end of <body>, so Tab from the trigger
   * does not walk into it. A keyboard user lands inside and tabs on to the fields, and no quick
   * range is pre-selected the way focusing the first row would have implied. */
  const panelEl = useRef<HTMLDivElement>(null);
  useEffect(() => { panelEl.current?.focus(); }, []);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fromEl = useRef<HTMLInputElement>(null);
  const toEl = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  function openPicker(el: any) { try { el?.showPicker?.(); } catch (e) { el?.focus(); } }
  function applyAbs() {
    if (!from || !to) { setErr('Pick both a From and a To date'); return; }
    if (new Date(from) > new Date(to)) { setErr('From has to come before To'); return; }
    const fmt = (s: string) => { const [Y, M, D] = s.split('T')[0].split('-'); return `${D}/${M}/${Y.slice(2)}`; };
    onPick?.(`${fmt(from)} – ${fmt(to)}`);
  }

  return (
    <DashPortal>
      <div className="dc-TimeRangePopover">
        <div className="backdrop" onClick={() => onClose?.()} />
        <div
          ref={panelEl} className="trp" tabIndex={-1} role="dialog" aria-label="Time range"
          style={{ top: pos.top + 'px', left: pos.left + 'px' }} onClick={(e) => e.stopPropagation()}
        >
          {note && <p className="trp-note">{note}</p>}
          <div className="trp-panes">
            <div className="abs">
              <div className="lbl">Absolute time range</div>
              <div className="field-block">
                <label>From</label>
                <div className="dt">
                  <input ref={fromEl} className="input" type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setErr(''); }} />
                  <button className="cal" onClick={() => openPicker(fromEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
                </div>
              </div>
              <div className="field-block">
                <label>To</label>
                <div className="dt">
                  <input ref={toEl} className="input" type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setErr(''); }} />
                  <button className="cal" onClick={() => openPicker(toEl.current)} title="Pick date"><Icon name="calendar" size={15} /></button>
                </div>
              </div>
              {/* the reason a click did nothing, next to the fields that caused it */}
              {err && <p className="trp-err"><Icon name="alert" size={13} /> {err}</p>}
              <button className="btn btn-primary apply" onClick={applyAbs}><Icon name="check" size={15} /> Apply time range</button>
              {followLabel && <button className="follow" onClick={() => onClear?.()}><Icon name="x" size={13} /> {followLabel}</button>}
            </div>
            <div className="quick">
              {/* No search box. The list is a fixed, short, ordered set — the ordering (shortest
                  window first) is itself the way you find a range. */}
              <div className="qlist">
                {QUICK.map((q: any) => (
                  <button key={q.k} className={`qitem ${value === q.label ? 'on' : ''}`} onClick={() => onPick?.(q.label)}>
                    {q.label} {value === q.label && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashPortal>
  );
}
