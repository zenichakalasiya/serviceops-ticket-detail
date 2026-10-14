/**
 * WidgetEmpty — the "nothing to draw" block inside a widget.
 *
 * Extracted so the real tile (`WidgetCard`) and the former /empty-states catalogue (removed 2026-09-29) render
 * the SAME component rather than two copies that agree today. The copy itself lives in
 * `data/emptyStates.js`; this file owns only how it is laid out.
 *
 * NO DATA (2026-09-29, user's call) draws the "no data found" illustration (NoDataArt: an
 * empty chart frame with a magnifier finding only a flat baseline) — the same one on every
 * widget type, in the empty group's slate. It replaced the disc holding the tile's own
 * chart icon. A fault or unfinished setup keeps the 42px disc with a plain semantic glyph,
 * since those are a system problem, not "we looked and nothing matched".
 *
 * On a short tile (a one-row KPI) the illustration shrinks, then steps aside for the line
 * of text. The block MEASURES itself (ResizeObserver) — a CSS size container matched its
 * smallest query on a 188px tile, so the art vanished where it had plenty of room.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/primitives';
import { ChartIcon } from './ChartIcon';
import { NoDataArt } from './NoDataArt';
import './WidgetEmpty.css';

export function WidgetEmpty({
  // an entry from data/emptyStates.js: { art | icon, title, sub, action? }
  state,
  // 'nodata' | 'error' | 'unconfigured' — only used to tint the fault disc
  kind = 'nodata',
  // whether this instance may offer its action (the catalogue shows it, a locked tile may not)
  canAct = true,
  onAct,
}: any) {
  // the art's width for the room this block has: full, smaller, or none (text only)
  const el = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(999);
  useEffect(() => {
    if (!el.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
    ro.observe(el.current);
    return () => ro.disconnect();
  }, []);
  // smaller since 2026-10-09 (user): 88px on a normal tile, 64px on a short one, none below
  const artW = h >= 150 ? 88 : h >= 108 ? 64 : 0;

  return (
    <div ref={el} className={`we dc-WidgetEmpty${kind === 'error' ? ' err' : ''}`}>
      {kind === 'nodata' ? (
        artW ? <NoDataArt className="we-art" width={artW} /> : null
      ) : (
        <span className="we-disc">
          {/* the tile's own chart shape for an empty period… */}
          {state.art ? <ChartIcon name={state.art} size={24} /> : <Icon name={state.icon} size={24} />}
          {/* …a semantic glyph for a fault or for setup that never happened */}
        </span>
      )}
      {/* One grey line, no bold title: the widget's own header already names it. The
          title stays in data/emptyStates.js as the accessible label. */}
      <span className="we-sub" aria-label={state.title + '. ' + state.sub}>{state.sub}</span>
      {state.action && canAct && (
        <button
          className={`btn btn-sm${state.action === 'configure' ? ' btn-primary' : ''}`}
          onClick={() => onAct?.(state.action)}
        >
          <Icon name={state.action === 'retry' ? 'refresh' : 'edit'} size={14} />
          {state.action === 'retry' ? 'Retry' : 'Configure'}
        </button>
      )}
    </div>
  );
}
