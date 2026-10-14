/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n: number) => String(n).padStart(2, '0');

const formatTop = (d: Date, withTime: boolean) => {
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!withTime) return datePart;
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${datePart} ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
};

/**
 * Shared calendar + time popup used by every date/time picker in the product
 * (via the `DateField` wrapper) and directly by the SLA-date editor.
 *
 * - `mode` — `'datetime'` shows the Select Time control; `'date'` hides it.
 * - `align` — `'right'` pins it inside the right side panel (SLA editor); the
 *   default anchors it under the trigger, clamped to the viewport.
 * Rendered in a portal with fixed positioning so it is never clipped by a
 * scrolling panel or an overflow-hidden dropdown.
 */
export function DateTimePickerPopup({
  value,
  onApply,
  onClose,
  anchorRect,
  mode = 'datetime',
  align = 'anchor',
}: {
  value: Date;
  onApply: (d: Date) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  mode?: 'date' | 'datetime';
  align?: 'anchor' | 'right';
}) {
  const withTime = mode === 'datetime';
  const [sel, setSel] = useState(new Date(value));
  const [viewY, setViewY] = useState(value.getFullYear());
  const [viewM, setViewM] = useState(value.getMonth());
  const [showTime, setShowTime] = useState(false);

  const today = new Date();
  const firstDay = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const daysPrev = new Date(viewY, viewM, 0).getDate();

  const cells: { day: number; m: number }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysPrev - i, m: -1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, m: 0 });
  let next = 1;
  while (cells.length < 42) cells.push({ day: next++, m: 1 });

  const prevMonth = () => { if (viewM === 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(viewM - 1); };
  const nextMonth = () => { if (viewM === 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(viewM + 1); };
  const isSel = (day: number, m: number) => m === 0 && sel.getFullYear() === viewY && sel.getMonth() === viewM && sel.getDate() === day;
  const isToday = (day: number, m: number) => m === 0 && today.getFullYear() === viewY && today.getMonth() === viewM && today.getDate() === day;

  const pickDay = (day: number, m: number) => {
    const d = new Date(viewY, viewM + m, day, sel.getHours(), sel.getMinutes());
    setSel(d);
    if (m !== 0) { setViewM(d.getMonth()); setViewY(d.getFullYear()); }
  };

  const W = 300;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  // Horizontal: 'right' pins the calendar inside the right side panel (SLA editor).
  // Otherwise anchor it under the trigger's left edge, clamped so it never spills
  // off either viewport edge.
  const left = align === 'right'
    ? Math.max(8, vw - W - 94)
    : Math.min(Math.max(8, anchorRect ? anchorRect.left : 80), vw - W - 8);
  const estH = withTime ? 470 : 430;
  const top = anchorRect
    ? (anchorRect.bottom + estH + 8 > vh ? Math.max(8, anchorRect.top - estH - 8) : anchorRect.bottom + 6)
    : 80;

  return createPortal(
    <>
      {/* Above every overlay in the app (the highest other layer is the shortcuts sheet at
          10051). A date picker is a PORTAL opened from a field, so it has to clear whatever
          host it was opened from — at z-70 it rendered behind any side panel or modal, which
          is why a date field inside one looked like it did nothing. */}
      <div data-dtp className="fixed inset-0 z-[10060]" onClick={onClose} />
      <div data-dtp className="app-menu fixed z-[10061] w-[300px] bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-3" style={{ top, left }}>
      {/* Current value */}
      <div className="flex items-center justify-between border border-[#DFE5ED] rounded-md px-3 py-2 mb-3">
        <span className="text-[13px] text-[#364658]">{formatTop(sel, withTime)}</span>
        <Clock size={16} className="text-[#7B8FA5]" />
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-0.5">
          <button onClick={() => setViewY(viewY - 1)} title="Previous year" className="p-1 text-[#7B8FA5] hover:text-[#364658]"><ChevronsLeft size={16} /></button>
          <button onClick={prevMonth} title="Previous month" className="p-1 text-[#7B8FA5] hover:text-[#364658]"><ChevronLeft size={16} /></button>
        </div>
        <span className="text-[14px] font-semibold text-[#364658]">{MONTHS[viewM]} {viewY}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={nextMonth} title="Next month" className="p-1 text-[#7B8FA5] hover:text-[#364658]"><ChevronRight size={16} /></button>
          <button onClick={() => setViewY(viewY + 1)} title="Next year" className="p-1 text-[#7B8FA5] hover:text-[#364658]"><ChevronsRight size={16} /></button>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => <div key={w} className="text-center text-[12px] font-medium text-[#7B8FA5] py-1">{w}</div>)}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((c, i) => (
          <button
            key={i}
            onClick={() => pickDay(c.day, c.m)}
            className={`h-8 text-[13px] rounded flex items-center justify-center transition-colors ${
              c.m !== 0
                ? 'text-[#CBD5E1] hover:bg-[#F5F7FA]'
                : isSel(c.day, c.m)
                ? 'bg-[#3D8BD0] text-white font-semibold'
                : isToday(c.day, c.m)
                ? 'border border-[#3D8BD0] text-[#364658] font-semibold'
                : 'text-[#364658] hover:bg-[#F1F5F9]'
            }`}
          >
            {c.day}
          </button>
        ))}
      </div>

      {/* Time */}
      {withTime && showTime && (
        <div className="mt-2 flex items-center justify-center">
          <input
            type="time"
            value={`${pad(sel.getHours())}:${pad(sel.getMinutes())}`}
            onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); const d = new Date(sel); d.setHours(h || 0, m || 0); setSel(d); }}
            className="border border-[#DFE5ED] rounded px-3 py-1.5 text-[13px] text-[#364658] outline-none focus:border-[#3D8BD0]"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0F1F3]">
        <button onClick={() => { const n = new Date(); setSel(n); setViewM(n.getMonth()); setViewY(n.getFullYear()); }} className="text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0] transition-colors">Now</button>
        {withTime && <button onClick={() => setShowTime((s) => !s)} className={`text-[13px] font-medium transition-colors ${showTime ? 'text-[#3D8BD0]' : 'text-[#364658] hover:text-[#3D8BD0]'}`}>Select Time</button>}
        <button onClick={() => { onApply(sel); onClose(); }} className="px-4 py-1.5 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2F7AB8] transition-colors">OK</button>
      </div>
      </div>
    </>,
    document.body
  );
}
