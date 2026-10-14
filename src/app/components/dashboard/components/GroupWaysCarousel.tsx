/**
 * GroupWaysCarousel — shows all FOUR ways to group widgets, one at a time, as small
 * looping CSS animations. Auto-advances; arrows + a "n / 4" indicator to step through.
 *   1. Drag a selection box (marquee)      — reuses GroupSelectAnim
 *   2. Shift + click each widget
 *   3. Add an empty group at the board's end
 *   4. From the + (Create) menu → Empty group
 * Each animation is keyed by index so it restarts cleanly when shown.
 */
import { useEffect, useRef, useState } from 'react';
import './GroupWaysCarousel.css';
import { Icon } from '../ui/primitives';
import { GroupSelectAnim } from './GroupSelectAnim';

const WAYS = [
  { title: 'Drag a selection box', caption: 'Drag a box across the widgets, then Create group.' },
  { title: 'Shift + click', caption: 'Hold Shift and click each widget, then Create group.' },
  { title: 'Add an empty group', caption: 'Drop an empty group at the end of the board and drag widgets in.' },
  { title: 'From the widget panel', caption: 'In Add New Widget → Create Widget, the Layout section has an “Empty group”.' },
];
const DWELL = 5200;

export function GroupWaysCarousel({ className = '' }: any) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);
  const arm = () => { clearInterval(timer.current); timer.current = setInterval(() => setIdx((i) => (i + 1) % WAYS.length), DWELL); };
  const pause = () => clearInterval(timer.current);
  const go = (n: number) => { setIdx((n + WAYS.length) % WAYS.length); arm(); };
  useEffect(() => { arm(); return () => clearInterval(timer.current); }, []);

  return (
    <div className={`dc-GroupWaysCarousel gwc ${className}`} onMouseEnter={pause} onMouseLeave={arm}>
      <div className="gwc-stage">
        <div className="gwc-anim gwc-in" key={idx}>
          {idx === 0 ? (
            /* 1 · marquee */
            <GroupSelectAnim />
          ) : idx === 1 ? (
            /* 2 · shift + click */
            <div className="wa shift">
              <div className="tile t1" /><div className="tile t2" /><div className="tile t3" />
              <div className="grp"><span className="glabel">New group</span></div>
              <span className="kbd">⇧ Shift</span>
              <div className="cur" />
            </div>
          ) : idx === 2 ? (
            /* 3 · empty group at the board's end */
            <div className="wa endg">
              <div className="tile e1" /><div className="tile e2" />
              <div className="bar"><span>+ New group here</span></div>
              <div className="grp gbox"><span className="glabel">New group</span></div>
              <div className="cur" />
            </div>
          ) : (
            /* 4 · from the Add New Widget panel → Create Widget → Layout → Empty group */
            <div className="wa addw">
              <div className="np">
                <div className="np-tabs"><b>Create Widget</b><span>All</span><span>Predefined</span></div>
                <div className="np-lab">Widget</div>
                <div className="np-row">
                  <span className="np-t"><Icon name="chart-line" size={15} /></span>
                  <span className="np-t"><Icon name="chart-hbar" size={15} /></span>
                  <span className="np-t"><Icon name="chart-bar" size={15} /></span>
                  <span className="np-t"><Icon name="chart-pie" size={15} /></span>
                </div>
                <div className="np-lab">Layout</div>
                <div className="np-row">
                  <span className="np-t wide hot"><Icon name="new-group" size={15} /> Empty group</span>
                </div>
              </div>
              <div className="cur" />
            </div>
          )}
        </div>
      </div>

      <div className="gwc-cap">
        <b>{WAYS[idx].title}</b>
        <span>{WAYS[idx].caption}</span>
      </div>

      <div className="gwc-nav">
        <button className="gwc-arrow" title="Previous" onClick={() => go(idx - 1)}><Icon name="chevron-left" size={16} /></button>
        <span className="gwc-num">{idx + 1} / {WAYS.length}</span>
        <button className="gwc-arrow" title="Next" onClick={() => go(idx + 1)}><Icon name="chevron-right" size={16} /></button>
      </div>
    </div>
  );
}
