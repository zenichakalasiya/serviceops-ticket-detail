import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronsRight, Search, Users, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* ONE multi-value field for the create pages — every multi-select, Tags and the email fields.
 *
 * Built on the workflow builder's value picker (VPicker, LinearBuilder): a search box with its icon on
 * the right, a "Selected Items (n)" strip of removable chips with Clear all (asks first) — "+N more"
 * there opens the SELECTED side panel docked to the popup (search selected, × on hover) — then the
 * list with a checkbox at the right of each row. Picks apply as you tick (no Apply), by Zeni's call.
 *
 * Three modes:
 *   pick   choose from the list only.
 *   tag    search-or-add: the module's suggested tags are listed; anything typed can be added with
 *          Enter ("Add 'x'"). With nothing to suggest and nothing added, the "No tags added yet" state.
 *   email  search-or-add: people are listed (name + email); a typed valid email can be added with
 *          Enter. With nothing to suggest and nothing added, the "No emails yet" state.
 *
 * The field itself shows the newest pick as a chip and "+N" for the rest (names on hover), the same
 * read-out the User Survey Emails field uses. */

export interface PickOption {
  value: string;
  label: string;
  /** Shown after the label in brackets — a person's email. */
  sub?: string;
  /** People get an initials badge; groups get a people icon; plain values get none. */
  kind?: 'person' | 'group';
  initials?: string;
  group?: string;
}

export type PickMode = 'pick' | 'tag' | 'email';

const MAX_CHIPS = 6;
const EMAIL_RX = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
const TAG_RX = /^[^,;\n]{1,40}$/;
const SPLIT: Record<PickMode, RegExp> = { pick: /$^/, tag: /[,;\n]+/, email: /[\s,;]+/ };

export function MultiPickField({ value, options, onChange, placeholder = 'Select', invalid, mode = 'pick' }: {
  value: string[];
  options: PickOption[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  mode?: PickMode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const [confirm, setConfirm] = useState<null | 'chips' | 'side'>(null);
  const [error, setError] = useState('');
  const [side, setSide] = useState(false);
  const [sq, setSq] = useState('');
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const [sp, setSp] = useState<{ left: number; top: number; h: number; onLeft: boolean } | null>(null);
  const field = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const adds = mode !== 'pick';
  const byValue = useMemo(() => new Map(options.map((o) => [o.value.toLowerCase(), o])), [options]);
  const optOf = (v: string) => byValue.get(v.toLowerCase());
  const labelOf = (v: string) => optOf(v)?.label ?? v;
  const on = (v: string) => value.some((x) => x.toLowerCase() === v.toLowerCase());
  const toggle = (v: string) => onChange(on(v) ? value.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...value, v]);
  const removeOne = (v: string) => onChange(value.filter((x) => x !== v));

  /* Placed under the field, or above it when there is more room there — pinned by its bottom edge
     then, so it hugs the field while the list is short. */
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const r = field.current?.getBoundingClientRect(); if (!r) return;
      const width = Math.max(r.width, 340);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
      const below = window.innerHeight - r.bottom;
      setPos(below >= 420 || below >= r.top ? { left, width, top: r.bottom + 4 } : { left, width, bottom: window.innerHeight - r.top + 4 });
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  /* The Selected panel docks to the popup's left edge (its right edge when the left has no room) and
     takes the popup's height, so the two read as one surface. */
  useLayoutEffect(() => {
    if (!side || !pos) { setSp(null); return; }
    const W = 300;
    const measure = () => {
      const r = pop.current?.getBoundingClientRect(); if (!r) return;
      const onLeft = r.left - W >= 8 || r.right + W > window.innerWidth - 8;
      setSp({ left: onLeft ? r.left - W + 1 : r.right - 1, top: r.top, h: r.height, onLeft });
    };
    measure();
    const ro = new ResizeObserver(measure); if (pop.current) ro.observe(pop.current);
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [side, pos]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (pop.current?.contains(t) || field.current?.contains(t) || panel.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', down, true);
    return () => document.removeEventListener('mousedown', down, true);
  }, [open]);
  useEffect(() => { if (!open) { setQ(''); setConfirm(null); setSide(false); setSq(''); setError(''); } }, [open]);
  useEffect(() => { setHi(0); setError(''); }, [q]);
  useEffect(() => { if (!value.length) setSide(false); }, [value.length]);

  const typed = q.trim();
  const ql = typed.toLowerCase();
  const rows = options.filter((o) => !ql || `${o.label} ${o.sub ?? ''} ${o.value}`.toLowerCase().includes(ql));
  /* "Add 'x'" — a typed value the list does not already hold, and that is not already picked. */
  const validTyped = mode === 'email' ? EMAIL_RX.test(typed) : mode === 'tag' ? TAG_RX.test(typed) : false;
  const isNew = adds && !!typed && validTyped && !on(typed) && !options.some((o) => o.value.toLowerCase() === ql || o.label.toLowerCase() === ql);
  const total = rows.length + (isNew ? 1 : 0);
  useEffect(() => { listRef.current?.querySelector('[data-hi="1"]')?.scrollIntoView({ block: 'nearest' }); }, [hi]);

  /* Several values pasted or typed at once are each added; anything that is not valid stays in the box. */
  const addTyped = (text = typed) => {
    if (!adds || !text.trim()) return;
    const parts = text.split(SPLIT[mode]).map((s) => s.trim()).filter(Boolean);
    const rx = mode === 'email' ? EMAIL_RX : TAG_RX;
    const good = parts.filter((s) => rx.test(s));
    const bad = parts.filter((s) => !rx.test(s));
    const next = [...value];
    for (const s of good) if (!next.some((x) => x.toLowerCase() === s.toLowerCase())) next.push(optOf(s)?.value ?? s);
    if (next.length !== value.length) onChange(next);
    setQ(bad.join(', '));
    if (bad.length) setError(mode === 'email' ? `"${bad[0]}" is not a valid email address` : 'A tag is up to 40 characters, with no commas');
    else if (!good.length) setError('Already added');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => (e.key === 'ArrowDown' ? Math.min(total - 1, i + 1) : Math.max(0, i - 1))); }
    else if (e.key === 'Enter' || (adds && (e.key === ',' || e.key === ';'))) {
      e.preventDefault();
      if (isNew && hi === 0) { addTyped(); return; }
      const r = rows[isNew ? hi - 1 : hi];
      if (r && (!typed || !adds || rows.length)) { toggle(r.value); if (adds) setQ(''); return; }
      if (adds) addTyped();
    }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (q) setQ(''); else if (side) setSide(false); else setOpen(false); }
    else if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1));
  };
  /* A paste (or typing) that holds a separator adds every complete value at once. */
  const onType = (t: string) => {
    const parts = adds ? t.split(SPLIT[mode]).filter((s) => s.trim()) : [];
    /* a comma / semicolon / new line always splits; a space only when every piece is a full email
       (so searching "John Smith" stays a search) */
    if (parts.length > 1 && (/[,;\n]/.test(t) || (mode === 'email' && parts.every((s) => EMAIL_RX.test(s.trim()))))) { addTyped(t); return; }
    setQ(t);
  };

  const mark = (s: string, needle = ql) => {
    const at = needle ? s.toLowerCase().indexOf(needle) : -1;
    if (at < 0) return s;
    return <>{s.slice(0, at)}<mark className="rounded-sm bg-[#FDE68A] text-inherit">{s.slice(at, at + needle.length)}</mark>{s.slice(at + needle.length)}</>;
  };
  const badge = (o?: PickOption) => o?.kind === 'group'
    ? <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] text-[#64748B]"><Users size={13} /></span>
    : <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[10px] font-semibold text-white">{o?.initials ?? labelOf(o?.value ?? '').slice(0, 2).toUpperCase()}</span>;

  const clearAll = (where: 'chips' | 'side', onDone?: () => void) => (confirm === where ? (
    <span className="flex items-center gap-2 text-[11px]">
      <span className="text-[#7B8FA5]">Clear {value.length}?</span>
      <button type="button" onClick={() => setConfirm(null)} className="font-medium text-[#7B8FA5] hover:text-[#364658]">Keep</button>
      <button type="button" onClick={() => { onChange([]); setConfirm(null); onDone?.(); }} className="font-semibold text-[#DC2626]">Clear</button>
    </span>
  ) : (
    <button type="button" onClick={() => setConfirm(where)} className="text-[11px] font-medium text-[#DC2626] hover:underline">Clear all</button>
  ));

  const newest = value[value.length - 1];
  const rest = value.slice(0, -1).reverse();
  const newestFirst = [...value].reverse();
  const sql = sq.trim().toLowerCase();
  const sideList = newestFirst.filter((v) => !sql || `${labelOf(v)} ${v}`.toLowerCase().includes(sql));
  let lastGroup = '';

  const searchPh = mode === 'email' ? 'Search people, or type an email and press Enter' : mode === 'tag' ? 'Search, or type a tag and press Enter' : 'Search';
  const emptyState = mode === 'email' ? <EmptyEmails /> : mode === 'tag' ? <EmptyTags /> : null;

  return (
    <>
      <div
        ref={field}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        className={`flex h-8 w-full cursor-pointer items-center gap-1.5 rounded border bg-white pl-2 pr-2 text-[12px] transition-colors ${open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : invalid ? 'border-[#F25C4E]' : 'border-[#DFE5ED] hover:border-[#CBD5E1]'}`}
      >
        {value.length === 0 ? (
          <span className="flex-1 pl-1 text-[#364658]/60">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="inline-flex min-w-0 items-center gap-1 rounded bg-[#EEF2F6] py-0.5 pl-2 pr-1 text-[12px] text-[#364658]">
              <span className="truncate">{labelOf(newest)}</span>
              <button type="button" title="Remove" onClick={(e) => { e.stopPropagation(); removeOne(newest); }} className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#DFE5ED] hover:text-[#364658]"><X size={11} /></button>
            </span>
            {rest.length > 0 && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild><span className="flex-shrink-0 rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">+{rest.length}</span></TooltipTrigger>
                <TooltipContent side="top" className="text-wrap max-w-[260px] whitespace-pre-line">{rest.slice(0, 12).map(labelOf).join('\n') + (rest.length > 12 ? `\n+${rest.length - 12} more` : '')}</TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
        <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && pos && createPortal(
        <div
          ref={pop}
          data-rule-menu
          role="dialog"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          className={`fixed z-[10060] flex max-h-[440px] min-h-[260px] flex-col border border-[#DFE5ED] bg-white p-2 shadow-lg ${side && sp ? (sp.onLeft ? 'rounded-r-lg' : 'rounded-l-lg') : 'rounded-lg'}`}
        >
          <div className="relative flex-shrink-0">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={onKey}
              placeholder={searchPh}
              aria-label="Search"
              className={`h-8 w-full rounded border bg-[#F9FAFB] pl-3 pr-8 text-[12px] text-[#364658] placeholder:text-[#364658]/60 focus:bg-white focus:outline-none focus:ring-1 ${error ? 'border-[#F25C4E] focus:border-[#F25C4E] focus:ring-[#F25C4E]' : 'border-[#DFE5ED] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]'}`}
            />
            {q
              ? <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6]"><X size={13} /></button>
              : <Search size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />}
          </div>
          {error && <p className="px-1 pt-1 text-[11px] text-[#F25C4E]">{error}</p>}

          {/* The chips strip — hidden while the Selected panel is open beside the popup (it says the same). */}
          {value.length > 0 && !side && (
            <div className="flex-shrink-0 px-1 pt-2.5">
              <div className="mb-1.5 flex h-5 items-center justify-between">
                <span className="text-[11px] font-medium tabular-nums text-[#7B8FA5]">Selected Items ({value.length})</span>
                {clearAll('chips')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {newestFirst.slice(0, MAX_CHIPS).map((v) => (
                  <span key={v} className="inline-flex max-w-full items-center gap-1 rounded bg-[#EEF2F6] py-0.5 pl-2 pr-1 text-[12px] text-[#364658]">
                    <span className="truncate">{labelOf(v)}</span>
                    <button type="button" title="Remove" onClick={() => removeOne(v)} className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#DFE5ED] hover:text-[#364658]"><X size={11} /></button>
                  </span>
                ))}
                {value.length > MAX_CHIPS && (
                  <button type="button" onClick={() => { setSide(true); setConfirm(null); }} className="h-6 rounded px-1.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#F6F9FC]">
                    +{value.length - MAX_CHIPS} more
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={listRef} role="listbox" aria-multiselectable="true" className="mt-2 min-h-0 flex-1 overflow-y-auto">
            {isNew && (
              <button type="button" data-hi={hi === 0 ? '1' : undefined} onMouseEnter={() => setHi(0)} onClick={() => addTyped()}
                className={`flex h-[34px] w-full items-center gap-2 rounded px-2 text-left text-[13px] text-[#3D8BD0] ${hi === 0 ? 'bg-[#F6F9FC]' : ''}`}>
                <span className="min-w-0 flex-1 truncate font-medium">Add “{typed}”</span>
                <kbd className="flex-shrink-0 rounded border border-[#DFE5ED] px-1 text-[10px] text-[#7B8FA5]">Enter</kbd>
              </button>
            )}
            {rows.map((o, i) => {
              const at = i + (isNew ? 1 : 0);
              const header = o.group && o.group !== lastGroup ? o.group : '';
              if (o.group) lastGroup = o.group;
              const s = on(o.value);
              return (
                <div key={o.value}>
                  {header && <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">{header}</div>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={s}
                    data-hi={hi === at ? '1' : undefined}
                    onMouseEnter={() => setHi(at)}
                    onClick={() => toggle(o.value)}
                    className={`flex h-[34px] w-full items-center gap-2 rounded px-2 text-left text-[13px] text-[#1D2A3E] ${hi === at ? 'bg-[#F6F9FC]' : ''}`}
                  >
                    {o.kind && badge(o)}
                    <span className="min-w-0 flex-1 truncate">
                      {mark(o.label)}
                      {o.sub && <span className="text-[#7B8FA5]"> ({mark(o.sub)})</span>}
                    </span>
                    {/* the checkbox at the right, as the workflow picker: empty = not picked, filled blue ✓ = picked */}
                    <span aria-hidden className={`flex size-4 flex-shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${s ? 'border-[#3D8BD0] bg-[#3D8BD0]' : hi === at ? 'border-[#8E9FBC] bg-white' : 'border-[#CBD5E1] bg-white'}`}>
                      {s && <Check size={11} strokeWidth={3} className="text-white" />}
                    </span>
                  </button>
                </div>
              );
            })}
            {/* Nothing to list: search-or-add fields show their empty state until something is added,
                then a quiet line; a pick-only list says there is no match. */}
            {!rows.length && !isNew && (
              adds && !typed
                ? (value.length ? <p className="px-2 py-2.5 text-[12px] text-[#9CA3AF]">Search to find more, or type a new one and press Enter</p> : emptyState)
                : <p className="px-2 py-2 text-[12px] text-[#9CA3AF]">{adds && typed && on(typed) ? 'Already added' : adds && typed && !validTyped ? (mode === 'email' ? 'Keep typing a full email address' : 'No matches') : 'No matches'}</p>
            )}
          </div>
        </div>,
        document.body,
      )}

      {open && side && sp && createPortal(
        <div
          ref={panel}
          data-rule-menu
          role="dialog"
          aria-label="Selected items"
          style={{ left: sp.left, top: sp.top, height: sp.h, width: 300 }}
          className={`fixed z-[10061] flex flex-col border border-[#DFE5ED] bg-[#F9FAFB] shadow-lg ${sp.onLeft ? 'rounded-l-lg' : 'rounded-r-lg'}`}
        >
          <div className="flex flex-shrink-0 items-center gap-1.5 px-3 pt-3">
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658]">Selected <span className="font-normal tabular-nums text-[#7B8FA5]">· {value.length}</span></span>
            {clearAll('side', () => setSq(''))}
            {/* collapse, not ×: it folds the list back into the popup — the chevrons point at the popup */}
            <Tooltip><TooltipTrigger asChild>
              <button type="button" aria-label="Collapse list" onClick={() => { setSide(false); setConfirm(null); }} className="-mr-1 flex size-6 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6]">
                <ChevronsRight size={14} className={sp.onLeft ? '' : 'rotate-180'} />
              </button>
            </TooltipTrigger><TooltipContent side="top">Collapse list</TooltipContent></Tooltip>
          </div>
          <div className="relative flex-shrink-0 px-3 pb-1 pt-2.5">
            <input value={sq} onChange={(e) => { setSq(e.target.value); setConfirm(null); }} placeholder="Search selected" aria-label="Search selected"
              className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-3 pr-8 text-[12px] text-[#364658] placeholder:text-[#364658]/60 focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            <Search size={14} className="pointer-events-none absolute right-5 top-1/2 mt-[3px] -translate-y-1/2 text-[#9CA3AF]" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-1">
            {sideList.map((v) => (
              <div key={v} className="group/vs flex h-8 items-center gap-2 rounded pl-1 pr-1 hover:bg-[#EEF2F6]">
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#1D2A3E]" title={labelOf(v)}>{mark(labelOf(v), sql)}</span>
                {/* × only on hover — removes that one value */}
                <button type="button" aria-label={`Remove ${labelOf(v)}`} onClick={() => removeOne(v)}
                  className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] opacity-0 transition-opacity hover:bg-[#FEF2F2] hover:text-[#DC2626] focus:opacity-100 group-hover/vs:opacity-100"><X size={12} /></button>
              </div>
            ))}
            {!sideList.length && <p className="px-1 py-3 text-[12px] text-[#9CA3AF]">No selected value matches</p>}
          </div>
          <div className="flex h-10 flex-shrink-0 items-center border-t border-[#E8EEF5] px-3 text-[12px] tabular-nums text-[#7B8FA5]">{value.length} selected</div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* The two empty states — drawn after the workflow builder's (an envelope with an "@" badge; a dashed
   price tag with a "+"), shown while there is nothing to suggest and nothing added yet. */
function EmptyArt({ children }: { children: React.ReactNode }) {
  return (
    <svg width="92" height="74" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <circle cx="60" cy="48" r="42" fill="#F1F4F8" />
      <path d="M22 18l4.2 1.4L22 20.8l-1.4 4.2-1.4-4.2-4.2-1.4 4.2-1.4 1.4-4.2z" fill="#CBD5E1" />
      <path d="M101 30l2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" fill="#CBD5E1" />
      {children}
    </svg>
  );
}
function EmptyEmails() {
  return (
    <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
      <EmptyArt>
        <g transform="translate(24 30) rotate(-10)"><rect width="52" height="36" rx="6" fill="#E2E8F0" /></g>
        <g transform="translate(36 38) rotate(6)">
          <rect width="54" height="38" rx="6" fill="#fff" stroke="#8E9FBC" strokeWidth="1.8" />
          <path d="M3 5l24 18L51 5" stroke="#8E9FBC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 30h14" stroke="#DCE3EC" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <circle cx="89" cy="68" r="11" fill="#7B8FA5" />
        <circle cx="89" cy="68" r="3.2" stroke="#fff" strokeWidth="1.8" />
        <path d="M92.2 68v1.6a1.8 1.8 0 0 0 3.6 0V68a6.8 6.8 0 1 0-2.7 5.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </EmptyArt>
      <div className="mt-2 text-[13px] font-semibold text-[#1D2A3E]">No emails yet</div>
      <div className="mt-1 max-w-[240px] text-[12px] leading-snug text-[#7B8FA5]">Search people, or type an email and press Enter to add it.</div>
    </div>
  );
}
function EmptyTags() {
  return (
    <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
      <EmptyArt>
        <g transform="translate(26 30) rotate(-14)"><path d="M0 7a7 7 0 0 1 7-7h30l16 18-16 18H7a7 7 0 0 1-7-7z" fill="#E2E8F0" /></g>
        <g transform="translate(36 38) rotate(8)">
          <path d="M0 7a7 7 0 0 1 7-7h30l16 18-16 18H7a7 7 0 0 1-7-7z" fill="#fff" stroke="#8E9FBC" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="38" cy="18" r="3.4" fill="#fff" stroke="#8E9FBC" strokeWidth="1.8" />
          <path d="M9 13h16M9 20h11" stroke="#DCE3EC" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <circle cx="88" cy="68" r="11" fill="#7B8FA5" />
        <path d="M88 63v10M83 68h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </EmptyArt>
      <div className="mt-2 text-[13px] font-semibold text-[#1D2A3E]">No tags added yet</div>
      <div className="mt-1 max-w-[240px] text-[12px] leading-snug text-[#7B8FA5]">Search to see suggested tags, or type a new one and press Enter to add it.</div>
    </div>
  );
}
