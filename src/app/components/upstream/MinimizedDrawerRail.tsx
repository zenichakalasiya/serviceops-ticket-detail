/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useEffect, useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';

interface MinimizedItem { id: string; subject?: string; noIdPill?: boolean }

/* First minimize of the session gets one coach mark. The dock is a small tab on an edge
   most people never look at, so without a nudge the first minimize reads as "my record
   vanished". Session-scoped like the detail-page tour — it teaches once, then stays out
   of the way. */
const HINT_KEY = 'hasSeenMinimizedRailHint';

/**
 * Compact right-edge dock shown when a detail drawer is minimized.
 *
 * Deliberately NOT full height any more — the old edge-to-edge rail sat over the header's
 * profile icon and anything else living on the right. This is a small floating tab parked at
 * the vertical centre of the right edge: a panel icon + a count badge saying how many items
 * are open. Hovering slides out a card listing them (ID pill + subject, active highlighted);
 * clicking a row restores the drawer on that item, clicking the tab restores the active one.
 */
export function MinimizedDrawerRail({
  items,
  activeId,
  onSelect,
  onRestore,
}: {
  items: MinimizedItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(HINT_KEY)) return;
    // A beat after the drawer collapses, so the card arrives to a settled screen.
    const t = window.setTimeout(() => setHint(true), 400);
    return () => clearTimeout(t);
  }, []);
  const dismissHint = () => {
    sessionStorage.setItem(HINT_KEY, 'true');
    setHint(false);
  };

  const enter = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    // Reaching the dock IS the thing the hint was teaching — and the fly-out opens in the
    // same spot, so letting both sit there would just stack two cards on one anchor.
    if (hint) dismissHint();
    setOpen(true);
  };
  const leave = () => { closeTimer.current = window.setTimeout(() => setOpen(false), 150); };

  return (
    <div
      className="fixed right-0 top-1/2 z-50 -translate-y-1/2"
      onMouseEnter={enter}
      onMouseLeave={leave}
      data-drawer-minimized
    >
      {/* The dock tab — small, attached to the edge, restores the active item on click. */}
      <button
        onClick={onRestore}
        aria-label="Expand panel"
        className="group relative flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 border-[#DFE5ED] bg-white px-1.5 py-3 transition-colors hover:bg-[#F5F9FD]"
        style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}
      >
        <ChevronLeft size={14} className="text-[#9ca3af] transition-colors group-hover:text-[#3D8BD0]" />
        {/* How many items are open — the number the collapsed state exists to answer. */}
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3D8BD0] px-1 text-[10px] font-semibold text-white">
          {items.length}
        </span>
        {/* What the number counts — a quiet edge-tab label reading top to bottom. */}
        <span className="[writing-mode:vertical-rl] text-[10px] font-medium tracking-[0.08em] text-[#7B8FA5] transition-colors group-hover:text-[#3D8BD0]">
          Open items
        </span>
      </button>

      {/* One-time coach mark, built to the same recipe as the AI field-suggestion coach in
          TicketFieldsAccordion: #1F2937 card, white/85 copy, white "Got it" bottom-right.
          Two coach marks in one product should be the same object wearing different words. */}
      {hint && !open && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 pr-2.5">
          <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-right-2 relative w-[272px] whitespace-normal rounded-lg bg-[#1F2937] p-3 text-left shadow-2xl">
            <span className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 bg-[#1F2937]" />
            <div className="text-[13px] font-semibold leading-snug text-white">Your minimized space</div>
            <p className="mt-1 text-[12px] font-normal leading-relaxed text-white/85">
              Minimized items park here. Keep several open and switch between them without losing your place.
            </p>
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={dismissHint}
                className="h-7 rounded bg-white px-3 text-[12px] font-semibold text-[#1F2937] transition-colors hover:bg-white/90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover fly-out — the open items, readable instead of rotated. */}
      {open && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 pr-1.5">
        <div className="app-menu w-[240px] rounded-lg border border-[#E5E7EB] bg-white py-1.5 shadow-lg">
          <div className="px-3 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7B8FA5]">
            Open items
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
          {items.map((it) => {
            const active = it.id === activeId;
            return (
              <button
                key={it.id}
                onClick={(e) => { e.stopPropagation(); onSelect(it.id); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${active ? 'bg-[#EAF2FB]' : 'hover:bg-[#F5F7FA]'}`}
              >
                {!it.noIdPill && (
                <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-white text-[#3D8BD0]' : 'bg-[#e8f4fd] text-[#3D8BD0]'}`}>
                  {it.id}
                </span>
                )}
                <span className={`min-w-0 truncate text-[12px] ${active ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}>
                  {it.subject ?? ''}
                </span>
              </button>
            );
          })}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
