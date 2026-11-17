/* NotifyPicker — pick technicians and technician groups (Create Audit › Notify Team).
 *
 * Built after the admin workflow builder's recipient popup (Admin › Automation › Workflow, the
 * "Technician group" / approver fields — RcptField in workflow/linear/LinearBuilder.tsx), in the
 * product's own styles. That component cannot be imported here: it lives in the lazily loaded
 * workflow bundle and its CSS is scoped to the builder.
 *
 * Same behaviour: ONE search box with the magnifier at its right end; small uppercase grey
 * section headings (Technician groups · Technicians) with a gap between them; one-line rows with
 * the name, a member-count badge on a group, and a checkbox at the right; every tick reaches the
 * field at once (no Apply); a click outside or Escape closes. The field shows the picks as chips. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, Users, X } from 'lucide-react';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';

const GROUP_SIZE = new Map(TECH_GROUPS.map((g) => [g, TECHNICIANS.filter((t) => t.group === g).length]));
const SECTIONS = [
  { header: 'Technician groups', items: TECH_GROUPS.map((g) => ({ id: g, label: g, group: true })) },
  { header: 'Technicians', items: TECHNICIANS.map((t) => ({ id: t.name, label: t.name, group: false, initials: t.initials })) },
];

/** The matched part of a name in bold — the popup's search highlight. */
function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<span className="font-semibold text-[#1D2A3E]">{text.slice(i, i + q.length)}</span>{text.slice(i + q.length)}</>;
}

export function NotifyPicker({ value, onChange, placeholder = 'Search technicians and technician group' }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const ql = q.trim().toLowerCase();
  const secs = useMemo(() => SECTIONS.map((s) => ({ ...s, items: s.items.filter((it) => !ql || it.label.toLowerCase().includes(ql)) })).filter((s) => s.items.length), [ql]);
  const has = (id: string) => value.includes(id);
  const toggle = (id: string) => onChange(has(id) ? value.filter((x) => x !== id) : [...value, id]);

  /* Under the field, or above it when there is no room; re-placed on scroll and resize. */
  const place = () => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(320, r.width);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
    setPos(below >= 360 || below >= above
      ? { left, width, top: r.bottom + 4, maxH: Math.min(420, below) }
      : { left, width, bottom: window.innerHeight - r.top + 4, maxH: Math.min(420, above) });
  };
  useLayoutEffect(() => { if (open) place(); }, [open, value.length]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (popRef.current?.contains(e.target as Node) || boxRef.current?.contains(e.target as Node)) return; setOpen(false); setQ(''); };
    const onKey = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; e.stopPropagation(); if (q) setQ(''); else setOpen(false); };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const id = requestAnimationFrame(() => inRef.current?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener('mousedown', onDown, true); document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); cancelAnimationFrame(id);
    };
  });

  const shown = value.slice(0, 3);
  return (
    <>
      <div ref={boxRef} role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        className={`flex min-h-9 w-full cursor-pointer items-center gap-1.5 rounded border bg-white py-1 pl-3 pr-2 transition-colors ${open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#C5CFDB]'}`}>
        {value.length === 0 ? (
          <span className="flex-1 truncate text-[13px] text-[#9CA3AF]">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {shown.map((v) => (
              <span key={v} className="inline-flex max-w-[180px] items-center gap-1 rounded bg-[#EEF2F6] py-0.5 pl-1.5 pr-1 text-[12px] text-[#364658]">
                {GROUP_SIZE.has(v) && <Users size={12} className="flex-shrink-0 text-[#64748B]" />}
                <span className="truncate">{v}</span>
                <button type="button" aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="flex size-4 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#DFE5ED] hover:text-[#364658]"><X size={11} /></button>
              </span>
            ))}
            {value.length > shown.length && <span className="rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]" title={value.slice(shown.length).join(', ')}>+{value.length - shown.length}</span>}
          </span>
        )}
        <ChevronDown size={15} className="flex-shrink-0 text-[#9CA3AF]" />
      </div>

      {open && pos && createPortal(
        <div ref={popRef} data-rule-menu="" role="dialog" aria-label="Notify team"
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH, zIndex: 10060 }}
          className="flex flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white pt-3 shadow-lg">
          <div className="flex-shrink-0 px-3 pb-1">
            <div className="relative">
              <input ref={inRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const first = secs[0]?.items[0]; if (first) { toggle(first.id); setQ(''); } } }}
                className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-3 pr-9 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none" />
              <Search size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
          </div>
          <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-0.5">
            {secs.length === 0 && <p className="py-3 text-[13px] text-[#9CA3AF]">No technician or group matches “{q.trim()}”</p>}
            {secs.map((s, si) => (
              <div key={s.header} className={si > 0 ? 'mt-3.5' : ''}>
                <div className="pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E9FBC]">{s.header}</div>
                {s.items.map((it) => {
                  const on = has(it.id);
                  return (
                    <button key={it.id} type="button" role="option" aria-selected={on} onMouseDown={(e) => e.preventDefault()} onClick={() => toggle(it.id)}
                      className="-mx-2.5 flex h-8 w-[calc(100%+20px)] items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-[#F5F7FA]">
                      <span className="min-w-0 truncate text-[13px] text-[#364658]"><Mark text={it.label} q={ql} /></span>
                      {it.group && <span title={`${GROUP_SIZE.get(it.id)} people`} className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#ECF1F7] px-1 text-[11px] font-medium tabular-nums text-[#64748B]">{GROUP_SIZE.get(it.id)}</span>}
                      <span className="flex-1" />
                      <span aria-hidden className={`flex size-4 flex-shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#CBD5E1] bg-white'}`}>
                        {on && <Check size={10} strokeWidth={3} className="text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
