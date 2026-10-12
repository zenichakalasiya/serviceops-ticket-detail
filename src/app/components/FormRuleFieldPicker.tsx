import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, ChevronDown, Download, Expand, Minimize2, Search, X } from 'lucide-react';
import type { SelectOption } from './FormRuleControls';

/* ───────────────────────────────────────────────────────────────────────────────────────────────
 * The action row's FIELDS picker (Zeni, 12 Oct 2026) — Figma "Dropdown with expansion"
 * (ZfMxIUAltqGMXlpW0dVmkP, node 1550-47268). Two shapes of one control:
 *   · the DROPDOWN (300px): search + an expand button, the chosen fields as chips (five, then +N),
 *     and the fields still available underneath. Picking is live.
 *   · EXPANDED (600×500 "Select fields"): available fields on the left with a match mode + keyword
 *     and Select all; the selection on the right with its own search, Clear all and a download.
 *     It works on a DRAFT — Apply Fields commits, Cancel discards.
 * Portalled to the body with fixed positioning: the editor scrolls, and a menu in a scroll box is clipped.
 * ─────────────────────────────────────────────────────────────────────────────────────────────── */

type Match = 'starts' | 'contains' | 'ends' | 'exact';
const MATCHES: [Match, string][] = [['starts', 'Starts with'], ['contains', 'Contains'], ['ends', 'Ends with'], ['exact', 'Is exactly']];
const matchLabel = (m: Match) => MATCHES.find(([v]) => v === m)![1];

const test = (label: string, q: string, mode: Match) => {
  const a = label.toLowerCase();
  const b = q.trim().toLowerCase();
  if (!b) return true;
  if (mode === 'starts') return a.startsWith(b);
  if (mode === 'ends') return a.endsWith(b);
  if (mode === 'exact') return a === b;
  return a.includes(b);
};

const MENU_W = 300;
const BIG_W = 600;
const BIG_H = 500;
const CHIPS = 5;

const ROW = 'flex h-8 w-full flex-shrink-0 items-center rounded-md px-1.5 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F4F6FA]';
const ICON_BTN = 'flex size-7 flex-shrink-0 items-center justify-center rounded-[5px] border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:bg-[#F4F6FA] disabled:cursor-not-allowed disabled:opacity-50';
const COUNT = 'text-[11px] font-medium text-[#7D95AF]';

export function FieldPicker({ value, options, onChange, placeholder = 'Fields', invalid = false, title = 'Select fields' }: {
  value: string[];
  options: SelectOption[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  title?: string;
}) {
  const [view, setView] = useState<'closed' | 'menu' | 'big'>('closed');
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [q, setQ] = useState('');
  /* expanded view only */
  const [draft, setDraft] = useState<string[]>([]);
  const [mode, setMode] = useState<Match>('contains');
  const [modeOpen, setModeOpen] = useState(false);
  const [kw, setKw] = useState('');
  const [selQ, setSelQ] = useState('');

  const open = view !== 'closed';

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = view === 'big' ? BIG_W : MENU_W;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    if (view === 'big') {
      setPos({ left, top: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - BIG_H - 8)) });
    } else {
      const room = window.innerHeight - r.bottom;
      if (room < 320 && r.top > room) setPos({ left, bottom: window.innerHeight - r.top + 4 });
      else setPos({ left, top: r.bottom + 4 });
    }
  };

  useLayoutEffect(() => { if (open) place(); }, [view]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panel.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setView('closed');
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (modeOpen) setModeOpen(false); else setView('closed');
    };
    const move = () => place();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', move, true);
    window.addEventListener('resize', move);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', move, true);
      window.removeEventListener('resize', move);
    };
  }, [view, modeOpen]);
  useEffect(() => { if (!open) { setQ(''); setKw(''); setSelQ(''); setModeOpen(false); } }, [open]);

  const byId = (id: string) => options.find((o) => o.value === id);
  const chosen = value.map(byId).filter(Boolean) as SelectOption[];

  const expand = () => { setDraft(value); setKw(q); setView('big'); };
  /* Collapsing goes back to the dropdown, which is live — so what was picked so far is kept. */
  const collapse = () => { onChange(draft); setView('menu'); };

  /* ── the trigger: the rule row's own field (first choice + "+N") ── */
  const trigger = (
    <button ref={btn} type="button" onClick={() => setView((v) => (v === 'closed' ? 'menu' : 'closed'))}
      className={`flex h-[30px] w-full min-w-0 items-center gap-1 rounded-md border bg-white px-2 text-left text-[12px] font-medium transition-colors ${invalid ? 'border-[#F25C4E]' : open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#CBD5E1]'}`}>
      {chosen[0] ? (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[#364658]">{chosen[0].label}</span>
          {chosen.length > 1 && <span className="flex-shrink-0 rounded bg-[#EEF2F6] px-1 font-medium text-[#7B8FA5]">+{chosen.length - 1}</span>}
        </span>
      ) : (
        <span className="flex-1 truncate font-normal text-[#364658]/60">{placeholder}</span>
      )}
      <ChevronDown size={16} strokeWidth={1.75} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );

  /* ── the dropdown ── */
  const left = options.filter((o) => !value.includes(o.value) && test(o.label, q, 'contains'));
  const menu = (
    <div ref={panel} style={{ width: MENU_W, ...pos }}
      className="fixed z-[10060] flex max-h-[400px] flex-col gap-1.5 rounded-xl border border-[#DFE5ED] bg-white p-3 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7B8FA5]" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
            className="h-7 w-full rounded-[5px] border border-[#DFE5ED] pl-7 pr-2 text-[12px] text-[#364658] placeholder:text-[#7B8FA5] focus:border-[#3D8BD0] focus:outline-none" />
        </div>
        <button type="button" onClick={expand} title="Expand" aria-label="Expand" className={ICON_BTN}><Expand size={15} /></button>
      </div>

      {chosen.length > 0 && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5 border-y border-[#DFE5ED] px-2 py-1.5">
          {chosen.slice(0, CHIPS).map((o) => (
            <span key={o.value} className="inline-flex max-w-full items-center gap-0.5 rounded-md border-[0.5px] border-[#DFE5ED] bg-[rgba(211,211,211,0.12)] py-0.5 pl-1.5 pr-1 text-[11px] text-[#202A35]">
              <span className="truncate">{o.label}</span>
              <button type="button" onClick={() => onChange(value.filter((v) => v !== o.value))} aria-label={`Remove ${o.label}`}
                className="flex size-3 flex-shrink-0 items-center justify-center text-[#7B8FA5] hover:text-[#364658]"><X size={11} /></button>
            </span>
          ))}
          {chosen.length > CHIPS && (
            <button type="button" onClick={expand} title="See every selected field"
              className="rounded-md border-[0.5px] border-[#E2E5ED] bg-[#E2E5ED] px-1 py-0.5 text-[11px] text-[#202A35] hover:bg-[#D5DAE4]">+{chosen.length - CHIPS}</button>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {left.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange([...value, o.value])} className={ROW}><span className="truncate">{o.label}</span></button>
        ))}
        {left.length === 0 && <div className="px-1.5 py-2 text-[12px] text-[#98A2B3]">{q ? 'No matches' : 'Every field is selected'}</div>}
      </div>
    </div>
  );

  /* ── expanded ── */
  const available = options.filter((o) => !draft.includes(o.value));
  const visible = available.filter((o) => test(o.label, kw, mode));
  const filtering = kw.trim() !== '';
  const picked = (draft.map(byId).filter(Boolean) as SelectOption[]).filter((o) => test(o.label, selQ, 'contains'));
  const changed = draft.length !== value.length || draft.some((d) => !value.includes(d));
  const download = () => {
    const rows = ['Field', ...draft.map((d) => `"${(byId(d)?.label ?? d).replace(/"/g, '""')}"`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'selected-fields.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const big = (
    <div ref={panel} style={{ width: BIG_W, height: BIG_H, ...pos }}
      className="fixed z-[10060] flex flex-col overflow-hidden rounded-xl border border-[#DFE5ED] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#DFE5ED] px-3 py-[7px]">
        <span className="text-[14px] font-medium text-[#364658]">{title}</span>
        <span className="flex items-center gap-0.5">
          <button type="button" onClick={collapse} title="Collapse" aria-label="Collapse" className="flex size-[30px] items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#EEF2F6]"><Minimize2 size={15} /></button>
          <button type="button" onClick={() => setView('closed')} title="Close" aria-label="Close" className="flex size-[30px] items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#EEF2F6]"><X size={16} /></button>
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* available */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 border-r border-[#DFE5ED] pt-3">
          <div className="relative mx-3 flex h-[30px] flex-shrink-0 items-stretch rounded-[7px] border border-[#E2E8F0] bg-white focus-within:border-[#3D8BD0]">
            <button type="button" onClick={() => setModeOpen((o) => !o)}
              className="flex flex-shrink-0 items-center gap-1 rounded-l-[6px] border-r border-[#DFE5ED] pl-2 pr-1.5 text-[11px] text-[#18181B] hover:bg-[#F8FAFC]">
              {matchLabel(mode)} <ChevronDown size={12} className="text-[#7B8FA5]" />
            </button>
            <input autoFocus value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Search by keyword"
              className="min-w-0 flex-1 bg-transparent px-2 text-[11px] text-[#18181B] placeholder:text-[#94A3B8] focus:outline-none" />
            {kw && <button type="button" onClick={() => setKw('')} aria-label="Clear" className="flex w-7 flex-shrink-0 items-center justify-center text-[#64748B] hover:text-[#18181B]"><X size={12} /></button>}
            {modeOpen && (
              <div className="absolute left-0 top-[32px] z-10 flex w-[104px] flex-col gap-0.5 rounded-lg border border-[#DFE5ED] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                {MATCHES.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => { setMode(v); setModeOpen(false); }}
                    className={`rounded-md px-2 py-1.5 text-left text-[11px] text-[#18181B] hover:bg-[#F4F6FA] ${v === mode ? 'bg-[#F4F6FA]' : ''}`}>{l}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center justify-between px-3">
            <span className={COUNT}>Available Fields : {visible.length === options.length ? options.length : `${visible.length} of ${options.length}`}</span>
            <button type="button" disabled={visible.length === 0} onClick={() => setDraft([...draft, ...visible.map((o) => o.value)])}
              className="flex items-center gap-1.5 text-[11px] text-[#7B8FA5] transition-colors hover:text-[#364658] disabled:cursor-default disabled:opacity-50 disabled:hover:text-[#7B8FA5]">
              <CheckCheck size={15} /> {available.length === 0 || (filtering && visible.length === 0 && options.some((o) => test(o.label, kw, mode))) ? 'All Selected' : filtering ? 'Select all visible' : 'Select all'}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2">
            {visible.map((o) => (
              <button key={o.value} type="button" onClick={() => setDraft([...draft, o.value])} className={ROW}><span className="truncate">{o.label}</span></button>
            ))}
            {visible.length === 0 && available.length > 0 && <div className="px-1.5 py-2 text-[12px] text-[#98A2B3]">No matches</div>}
          </div>
        </div>

        {/* selected */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-3">
          <div className="mx-3 flex flex-shrink-0 items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input value={selQ} onChange={(e) => setSelQ(e.target.value)} placeholder="Search your selection"
                className="h-[30px] w-full rounded-[7px] border border-[#E2E8F0] pl-7 pr-2 text-[11px] text-[#18181B] placeholder:text-[#94A3B8] focus:border-[#3D8BD0] focus:outline-none" />
            </div>
            <button type="button" onClick={download} disabled={draft.length === 0} title="Download the selected fields (CSV)" aria-label="Download the selected fields" className={ICON_BTN}><Download size={15} /></button>
          </div>
          <div className="flex flex-shrink-0 items-center justify-between px-3">
            <span className={COUNT}>Selected Fields : {draft.length}</span>
            <button type="button" disabled={draft.length === 0} onClick={() => setDraft([])}
              className="flex items-center gap-1 text-[11px] text-[#DC5447] hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline">
              <X size={14} /> Clear all
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2">
            {picked.map((o) => (
              <button key={o.value} type="button" onClick={() => setDraft(draft.filter((d) => d !== o.value))} title="Remove from the selection"
                className={ROW + ' group/sel justify-between gap-2'}>
                <span className="truncate">{o.label}</span>
                <X size={13} className="flex-shrink-0 text-[#98A2B3] opacity-0 group-hover/sel:opacity-100" />
              </button>
            ))}
            {picked.length === 0 && draft.length > 0 && <div className="px-1.5 py-2 text-[12px] text-[#98A2B3]">No matches</div>}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#DFE5ED] px-3 py-3">
        <button type="button" onClick={() => setView('closed')}
          className="h-[30px] rounded-md border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F8FAFC] hover:text-[#364658]">Cancel</button>
        <button type="button" disabled={!changed} onClick={() => { onChange(draft); setView('closed'); }}
          className="h-[30px] rounded-md bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3378B8] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#3D8BD0]">Apply Fields</button>
      </div>
    </div>
  );

  return (
    <>
      {trigger}
      {open && pos && createPortal(view === 'big' ? big : menu, document.body)}
    </>
  );
}
