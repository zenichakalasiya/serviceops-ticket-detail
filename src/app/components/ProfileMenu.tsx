/* The header avatar's profile popup (Zeni, 15 Oct 2026 — the "compact card" she picked):
 *   who you are (avatar · name · email · role and group)
 *   Theme — Light / Dark, ONLY on Dashboard screens: the Dashboard is the one module with a dark
 *           theme, so offering it anywhere else would promise something the page cannot do
 *   Switch to Support Portal — the requester's view of the default portal (#/portal)
 *   Sign out
 * Portalled to the body with fixed positioning, right-aligned under the avatar; Escape or a click
 * outside closes it. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { CURRENT_USER, CURRENT_USER_INITIALS, groupOfTechnician } from './technicianRoster';
import { store } from './dashboard/store.js';
import { useDashStore } from './dashboard/reactivity.js';

const EMAIL = CURRENT_USER.toLowerCase().replace(/\s+/g, '.') + '@motadata.com';
const onHash = (f: () => void) => { window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); };
const readHash = () => window.location.hash;

export function ProfileMenu() {
  useDashStore();
  const hash = useSyncExternalStore(onHash, readHash, readHash);
  const onDashboard = /^#\/dashboards?(\/|$)/.test(hash);
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const close = () => setPos(null);
  const toggle = () => {
    if (pos) return close();
    const r = btn.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  };
  useEffect(() => {
    if (!pos) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!card.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    addEventListener('keydown', key);
    addEventListener('mousedown', down);
    return () => { removeEventListener('keydown', key); removeEventListener('mousedown', down); };
  }, [pos]);

  const theme = store.ui.theme === 'dark' ? 'dark' : 'light';
  const row = 'flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]';

  return (
    <>
      <button
        ref={btn}
        onClick={toggle}
        title={CURRENT_USER}
        aria-haspopup="dialog"
        aria-expanded={!!pos}
        className="flex h-[32px] w-[32px] items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white hover:bg-[#2d6ca0]"
      >
        {CURRENT_USER_INITIALS}
      </button>
      {pos && createPortal(
        <div
          ref={card}
          role="dialog"
          aria-label="Profile"
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-[10060] w-[280px] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.14)]"
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="flex size-10 flex-none items-center justify-center rounded bg-[#3D8BD0] text-[13px] font-semibold text-white">{CURRENT_USER_INITIALS}</span>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-[#364658]">{CURRENT_USER}</div>
              <div className="truncate text-[12px] text-[#7B8FA5]">{EMAIL}</div>
              <div className="truncate text-[12px] text-[#7B8FA5]">Technician · {groupOfTechnician(CURRENT_USER)}</div>
            </div>
          </div>

          {onDashboard && (
            <div className="border-t border-[#EEF2F6] px-4 py-3">
              <div className="mb-1.5 text-[12px] text-[#7B8FA5]">Theme</div>
              <div className="pill-track w-full" role="radiogroup" aria-label="Theme">
                <button type="button" aria-pressed={theme === 'light'} onClick={() => { store.ui.theme = 'light'; }} className="inline-flex items-center justify-center gap-1.5">
                  <Sun size={14} /> Light
                </button>
                <button type="button" aria-pressed={theme === 'dark'} onClick={() => { store.ui.theme = 'dark'; }} className="inline-flex items-center justify-center gap-1.5">
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[#EEF2F6] p-1.5">
            <button className={row} onClick={() => { close(); window.location.hash = '#/portal'; }}>
              <ArrowLeftRight size={15} className="text-[#64748B]" /> Switch to Support Portal
            </button>
          </div>
          <div className="border-t border-[#EEF2F6] p-1.5">
            <button className={row} onClick={() => { close(); toast('Sign out is not available in this prototype'); }}>
              <LogOut size={15} className="text-[#64748B]" /> Sign out
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
