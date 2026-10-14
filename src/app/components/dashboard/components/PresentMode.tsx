// Full-screen (TV) view of a single dashboard — Esc or ✕ to exit.
import { useEffect, useRef } from 'react';
import './PresentMode.css';
import { Icon, DashPortal } from '../ui/primitives';
import { WidgetCard } from './WidgetCard';
import { TimeFilter } from './TimeFilter';
import { AutoRefresh } from './AutoRefresh';
import { byId } from '../store.js';
import { useDashStore } from '../reactivity.js';

const FONT_PX: any = { S: 12.5, M: 13.5, L: 15 };

/* A wallboard is the one place the numbers go unattended for hours — so the two
 * view-time controls that say WHAT WINDOW you're looking at and WHEN IT LAST
 * UPDATED are needed here more than anywhere, not less. They read the same global
 * store state as the board, so the window survives entering and leaving present mode. */
export function PresentMode({ startId, onClose }: any) {
  useDashStore();
  const cur = byId(startId);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const boardVars: any = { '--tile-title': (FONT_PX[cur?.headerFont] || 13.5) + 'px' };
  const gridStyle = { columnGap: (cur?.hGap ?? 14) + 'px', rowGap: (cur?.vGap ?? 14) + 'px' };
  const cellStyle = (t: any) => {
    const w = Math.min(12, Math.max(2, t.w || 3)), h = Math.max(1, t.h || 1);
    return { gridColumn: `span ${w}`, minHeight: ((cur?.rowHeight ?? 140) + (h - 1) * 110) + 'px' };
  };
  return (
    <DashPortal>
      <div className="dc-PresentMode">
        <div className="pm" style={boardVars}>
          <header className="pm-bar">
            <div className="pm-title"><Icon name="layout" size={16} /><b>{cur?.name}</b></div>
            <div className="pm-ctl">
              <TimeFilter />
              {/* AutoRefresh already carries its own refresh button AND the interval
                  dropdown — a second standalone refresh was just a duplicate icon. */}
              <AutoRefresh />
              <span className="pm-sep" />
              <button className="pm-exit" title="Exit (Esc)" onClick={() => onClose?.()}><Icon name="x" size={20} /></button>
            </div>
          </header>
          <div className="pm-body">
            {cur && cur.tiles.length ? (
              <div className="pm-grid" style={gridStyle}>
                {cur.tiles.map((t: any) => <div key={t.id} className="pm-cell" style={cellStyle(t)}><WidgetCard tile={t} /></div>)}
              </div>
            ) : (
              <div className="pm-empty"><Icon name="layout" size={40} /><p>This dashboard has no widgets.</p></div>
            )}
          </div>
        </div>
      </div>
    </DashPortal>
  );
}
