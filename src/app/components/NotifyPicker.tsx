/* NotifyPicker — pick technicians and technician groups (Create Audit › Notify To).
 *
 * Copies the admin workflow builder's value popup (Admin › Automation › Workflow — the "Specific
 * value" picker), in product styles, WITHOUT its Specific | Dynamic tabs (Zeni, 17 Nov 2026):
 *   - "Selected Items (N)" + a red Clear all, the picks as removable chips, then "+N more";
 *   - a search box; the list as a tree — a technician group expands (chevron) to its technicians —
 *     with a checkbox at each row's right;
 *   - a footer: "N selected" and Apply (N). The popup edits a DRAFT: Apply commits, a click outside
 *     or Escape drops it;
 *   - "+N more" opens the "Selected · N" panel on the popup's LEFT (search selected, × per row,
 *     Clear all, » to close it).
 * That component cannot be imported here — it lives in the lazily loaded workflow bundle and its
 * CSS is scoped to the builder — so this is a copy in the product's own styles. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, ChevronsRight, Search, Users, X } from 'lucide-react';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const GROUP_SET = new Set(TECH_GROUPS);
const MEMBERS = new Map(TECH_GROUPS.map((g) => [g, TECHNICIANS.filter((t) => t.group === g).map((t) => t.name)]));
const CHIPS = 3;
const POP_W = 320;
const SIDE_W = 280;

/** The matched part of a name in bold — the search highlight. */
function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<span className="font-semibold text-[#1D2A3E]">{text.slice(i, i + q.length)}</span>{text.slice(i + q.length)}</>;
}

function Box({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`flex size-[18px] flex-shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#CBD5E1] bg-white'}`}>
      {on && <Check size={11} strokeWidth={3} className="text-white" />}
    </span>
  );
}

export function NotifyPicker({ value, onChange, placeholder = 'Search technicians and technician group' }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [q, setQ] = useState('');
  const [side, setSide] = useState(false);
  const [sideQ, setSideQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const ql = q.trim().toLowerCase();

  const begin = () => { setDraft(value); setQ(''); setSide(false); setSideQ(''); setExpanded(new Set()); setOpen(true); };
  const close = () => { setOpen(false); setSide(false); };
  const apply = () => { onChange(draft); close(); };
  const has = (id: string) => draft.includes(id);
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  /* The tree, narrowed by the search: a group stays when it or one of its people matches; while
     searching, a group with a matching person opens so the person can be seen. */
  const tree = useMemo(() => TECH_GROUPS.map((g) => {
    const people = MEMBERS.get(g) ?? [];
    const gHit = !ql || g.toLowerCase().includes(ql);
    const shown = gHit ? people : people.filter((p) => p.toLowerCase().includes(ql));
    return { g, people: shown, show: gHit || shown.length > 0, openByQuery: !!ql && shown.length > 0 };
  }).filter((x) => x.show), [ql]);

  /* Under the field (above when there is no room). With the Selected panel open the popup grows to the LEFT. */
  const place = () => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = POP_W + (side ? SIDE_W : 0);
    const right = Math.min(window.innerWidth - 8, r.left + POP_W);
    const left = Math.max(8, right - w);
    const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
    setPos(below >= 440 || below >= above
      ? { left, top: r.bottom + 4, maxH: Math.min(480, below) }
      : { left, bottom: window.innerHeight - r.top + 4, maxH: Math.min(480, above) });
  };
  useLayoutEffect(() => { if (open) place(); }, [open, side]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (popRef.current?.contains(e.target as Node) || boxRef.current?.contains(e.target as Node)) return; close(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (side) { if (sideQ) setSideQ(''); else setSide(false); return; }
      if (q) setQ(''); else close();
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDown, true); document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
    };
  });
  useEffect(() => { if (open && pos) { const id = requestAnimationFrame(() => inRef.current?.focus({ preventScroll: true })); return () => cancelAnimationFrame(id); } }, [open, !!pos]);

  const chip = (v: string, onRemove: () => void, wide = false) => (
    <span key={v} className={(wide ? "min-w-0 max-w-[260px] " : "max-w-[180px] ") + "inline-flex items-center gap-1 rounded-md bg-[#EEF2F6] py-0.5 pl-2 pr-1 text-[12px] text-[#364658]"}>
      {GROUP_SET.has(v) && <Users size={12} className="flex-shrink-0 text-[#64748B]" />}
      <span className="truncate">{v}</span>
      <button type="button" aria-label={`Remove ${v}`} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#DFE5ED] hover:text-[#364658]"><X size={11} /></button>
    </span>
  );
  /* The field shows ONE chip, the most recently added pick, and the rest as +N (Zeni, 19 Nov 2026), so it
     stays one line and level with Deployment Policy beside it. Picks are appended, so the newest is last. */
  const newest = value[value.length - 1];
  const others = value.slice(0, -1).reverse();
  const sideRows = draft.filter((v) => !sideQ.trim() || v.toLowerCase().includes(sideQ.trim().toLowerCase()));

  return (
    <>
      <div ref={boxRef} role="button" tabIndex={0} onClick={() => (open ? close() : begin())} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } }}
        className={`flex h-8 w-full cursor-pointer items-center gap-1.5 rounded border bg-white py-1 pl-3 pr-2 transition-colors ${open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#C5CFDB]'}`}>
        {value.length === 0 ? (
          <span className="flex-1 truncate text-[13px] text-[#9CA3AF]">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden">
            {chip(newest, () => onChange(value.filter((x) => x !== newest)), true)}
            {others.length > 0 && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0 rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">+{others.length}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] text-wrap">
                  <div className="text-[12px] leading-[1.6]">
                    {others.slice(0, 12).map((v) => <div key={v}>{v}</div>)}
                    {others.length > 12 && <div className="text-white/70">+{others.length - 12} more</div>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
        <ChevronDown size={15} className="flex-shrink-0 text-[#9CA3AF]" />
      </div>

      {open && pos && createPortal(
        <div ref={popRef} data-rule-menu="" role="dialog" aria-label="Notify team"
          style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, height: pos.maxH, zIndex: 10060 }}
          className="flex overflow-hidden rounded-xl border border-[#DFE5ED] bg-white shadow-lg">

          {/* "+N more" → every pick, on the LEFT. */}
          {side && (
            <div style={{ width: SIDE_W }} className="flex flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-[#F7F9FC]">
              <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                <span className="text-[14px] font-semibold text-[#364658]">Selected</span>
                <span className="text-[13px] text-[#7B8FA5]">· {draft.length}</span>
                <button type="button" onClick={() => setDraft([])} disabled={!draft.length} className="ml-auto text-[12px] font-medium text-[#E5484D] hover:underline disabled:opacity-40">Clear all</button>
                <button type="button" aria-label="Close the selected list" onClick={() => setSide(false)} className="flex size-6 items-center justify-center rounded text-[#64748B] hover:bg-[#EEF2F6]"><ChevronsRight size={15} /></button>
              </div>
              <div className="px-4 pb-2">
                <div className="relative">
                  <input value={sideQ} onChange={(e) => setSideQ(e.target.value)} placeholder="Search selected"
                    className="h-8 w-full rounded-md border border-[#DFE5ED] bg-white pl-3 pr-8 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none" />
                  <Search size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2">
                {sideRows.map((v) => (
                  <div key={v} className="group/s flex h-8 items-center gap-2 rounded-md px-2 hover:bg-[#EEF2F6]">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{v}</span>
                    <button type="button" aria-label={`Remove ${v}`} onClick={() => toggle(v)} className="flex size-5 items-center justify-center rounded text-[#94A3B8] hover:text-[#364658]"><X size={12} /></button>
                  </div>
                ))}
                {!sideRows.length && <p className="px-2 py-3 text-[12px] text-[#9CA3AF]">{draft.length ? 'Nothing matches' : 'Nothing selected'}</p>}
              </div>
              <div className="flex-shrink-0 px-4 py-3 text-[12px] text-[#7B8FA5]">{draft.length} selected</div>
            </div>
          )}

          <div style={{ width: POP_W }} className="flex min-h-0 flex-col">
            {/* What is picked so far, as chips. */}
            {draft.length > 0 && (
              <div className="flex-shrink-0 px-4 pt-3.5">
                <div className="mb-2 flex items-center">
                  <span className="text-[12px] text-[#7B8FA5]">Selected Items ({draft.length})</span>
                  <button type="button" onClick={() => setDraft([])} className="ml-auto text-[12px] font-medium text-[#E5484D] hover:underline">Clear all</button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {draft.slice(0, CHIPS).map((v) => chip(v, () => toggle(v)))}
                  {draft.length > CHIPS && (
                    <button type="button" onClick={() => setSide(true)} className="px-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">+{draft.length - CHIPS} more</button>
                  )}
                </div>
              </div>
            )}
            <div className="flex-shrink-0 px-4 pb-1 pt-3">
              <div className="relative">
                <input ref={inRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label={placeholder}
                  className="h-9 w-full rounded-md border border-[#DFE5ED] bg-white pl-3 pr-9 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none" />
                <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
            <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
              {tree.length === 0 && <p className="px-2 py-3 text-[13px] text-[#9CA3AF]">No technician or group matches “{q.trim()}”</p>}
              {tree.map(({ g, people, openByQuery }) => {
                const isOpen = openByQuery || expanded.has(g);
                return (
                  <div key={g}>
                    <div className="flex h-9 items-center gap-1 rounded-md pr-2 hover:bg-[#F5F7FA]">
                      <button type="button" aria-label={isOpen ? `Collapse ${g}` : `Expand ${g}`} onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; })}
                        className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6]">
                        <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      <button type="button" role="option" aria-selected={has(g)} onMouseDown={(e) => e.preventDefault()} onClick={() => toggle(g)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]"><Mark text={g} q={ql} /></span>
                        <Box on={has(g)} />
                      </button>
                    </div>
                    {isOpen && people.map((t) => (
                      <button key={t} type="button" role="option" aria-selected={has(t)} onMouseDown={(e) => e.preventDefault()} onClick={() => toggle(t)}
                        className="flex h-9 w-full items-center gap-2 rounded-md pl-8 pr-2 text-left hover:bg-[#F5F7FA]">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]"><Mark text={t} q={ql} /></span>
                        <Box on={has(t)} />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-shrink-0 items-center border-t border-[#EEF1F4] px-4 py-3">
              <span className="text-[12px] text-[#7B8FA5]">{draft.length} selected</span>
              <button type="button" onClick={apply} className="ml-auto h-8 rounded-md bg-[#3D8BD0] px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">
                Apply{draft.length ? ` (${draft.length})` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
