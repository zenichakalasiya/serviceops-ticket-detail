/**
 * LayoutDrawer — the global layout settings as a right-edge drawer.
 *
 * NO SCRIM. That is the whole point on the board: you are judging spacing against
 * your real widgets, and dimming them behind a 40% black sheet would make the thing
 * you are judging unreadable while you judge it. The drawer sits beside the content
 * and the content keeps living — every slider re-renders the board underneath in real
 * time. Clicking outside closes it, so it is still dismissible without a scrim to
 * catch the click.
 */
import { useEffect } from 'react';
import './LayoutDrawer.css';
import { Icon, DashPortal } from '../ui/primitives';
import { LayoutAppearance } from './LayoutAppearance';
import { store, beginLayoutEdit, cancelLayoutEdit } from '../store.js';

const close = () => { store.ui.layoutOpen = false; };

export function LayoutDrawer() {
  /* The drawer's lifetime IS the edit session, so the snapshot is taken and released
   * here rather than by any one button. Every way out that isn't Apply — the X,
   * Escape, a click outside, even navigating away — lands on the same unmount and
   * reverts. Apply calls commitLayoutEdit() first, which drops the snapshot, so the
   * cancel below finds nothing to undo and the change stands. */
  useEffect(() => {
    beginLayoutEdit();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { cancelLayoutEdit(); window.removeEventListener('keydown', onKey); };
  }, []);
  return (
    <DashPortal>
      <div className="dc-LayoutDrawer">
        {/* a transparent catcher, not a scrim: it dismisses on an outside click without
            tinting the board the settings are being judged against */}
        <div className="ld-catch" onClick={close} />
        {/* a div, not an <aside>: no `aria-modal` — the board behind stays live */}
        <div className="ld" role="dialog" aria-label="Dashboard layout">
          {/* Title only — the two scope cards are the first thing in the panel and say it in full. */}
          <header className="ld-h dlg-head">
            <h3>Dashboard layout</h3>
            {/* Close only. Reset lives at the footer's left edge. */}
            <button className="dlg-x" title="Close" onClick={close}><Icon name="x" size={18} /></button>
          </header>
          <div className="ld-b"><LayoutAppearance variant="drawer" /></div>
        </div>
      </div>
    </DashPortal>
  );
}
