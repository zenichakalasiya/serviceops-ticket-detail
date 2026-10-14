import { useState } from 'react';
import './DashboardMenu.css';
import { Icon, ConfirmDialog } from '../ui/primitives';
import { store, markDefault, archiveDashboard } from '../store.js';
import { useDashStore } from '../reactivity.js';

/* `toolbar` is the board header's variant: outlined, and sized to the 36px the rest of
 * that toolbar runs at, so the ⋯ sits in the row as a button rather than a loose glyph.
 * The listing contexts (a dashboard card, a row in the Manage grid) keep the bare 34px
 * icon — an outline on every row there would draw a box around each one.
 *
 * Port note: the product header has no tour entry (the prototype reached the tour from its
 * own top bar), so the board's ⋯ — the toolbar variant only — carries "Take a tour". */
export function DashboardMenu({ d, align = 'right', toolbar = false, onPresent, onSchedule, onHistory }: any) {
  useDashStore();
  const [open, setOpen] = useState(false);
  // archiving a whole dashboard is the most destructive thing in this menu — confirm it
  const [confirmDel, setConfirmDel] = useState(false);
  const act = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <div className="dc-DashboardMenu wrap">
      <button className={`btn btn-icon ${open ? 'on' : ''} ${toolbar ? 'tb' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} title="Actions">
        <Icon name="dots-v" size={18} />
      </button>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className={`menu ${align}`} onClick={(e) => e.stopPropagation()}>
          {/* order and wording follow the prototype (node 437:17124): Edit · Present mode ·
              Clone Dashboard · Schedule Dashboard · Version History · Archive. "Mark as
              default" sits after Clone, where the prototype's other menu variant puts it. */}
          <button className="menu-item" onClick={() => act(() => { store.ui.cloneTarget = null; store.ui.editTarget = d; store.ui.createOpen = true; })}><Icon name="edit" size={16} /> Edit</button>
          <button className="menu-item" onClick={() => act(() => onPresent?.())}><Icon name="maximize-tile" size={16} /> Present mode</button>
          <button className="menu-item" onClick={() => act(() => { store.ui.cloneTarget = d; store.ui.createOpen = true; })}><Icon name="copy" size={16} /> Clone Dashboard</button>
          {!d.default && <button className="menu-item" onClick={() => act(() => markDefault(d))}><Icon name="pin" size={16} /> Mark as default</button>}
          <button className="menu-item" onClick={() => act(() => onSchedule?.())}><Icon name="calendar2" size={16} /> Schedule Dashboard</button>
          <button className="menu-item" onClick={() => act(() => onHistory?.())}><Icon name="history" size={16} /> Version History</button>
          {/* Layout is not an action ON this board — it opens a setting that spans every
              board — so a divider separates it from the five above that are. */}
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => act(() => { store.ui.layoutScope = 'all'; store.ui.layoutOpen = true; })}><Icon name="appearance" size={16} /> Layout settings</button>
          {toolbar && <button className="menu-item" onClick={() => act(() => { store.ui.tourOpen = true; })}><Icon name="flag" size={16} /> Take a tour</button>}
          {/* predefined dashboards ship with the product: they cannot be deleted or
              archived, so the action is absent rather than disabled */}
          {!d.predefined && (
            <>
              <div className="menu-sep" />
              <button className="menu-item danger" onClick={() => act(() => setConfirmDel(true))}><Icon name="archive" size={16} /> Archive</button>
            </>
          )}
        </div>
      )}
      {confirmDel && (
        <ConfirmDialog
          title="Archive this dashboard?"
          target={d.name}
          message="will move to the Archive tab with its widgets. Restore it from there, or delete it permanently."
          confirmLabel="Archive"
          onConfirm={() => { setConfirmDel(false); archiveDashboard(d); }}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </div>
  );
}
