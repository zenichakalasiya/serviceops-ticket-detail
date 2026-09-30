import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Keyboard, Search, X } from 'lucide-react';
import type { Page } from '../routes';
import { useShortcutContexts } from './shortcutContext';
import { GLOBAL_ID, SHORTCUT_AREAS, rowCount, shortcutModule, shortcutModules } from './shortcutRegistry';
import type { ShortcutModule, ShortcutRow } from './shortcutRegistry';

/**
 * The GLOBAL Keyboard shortcuts panel (Zeni, 30 Sep 2026) — the one place every shortcut in the product
 * is listed, opened from the header's keyboard icon, from `?` anywhere, and from the portal builder's
 * rail. Researched against Jira (the dialog adapts to where you are), GitHub (this page first, then
 * "Show all"), Linear (searchable), Monday (product-wide first, then the board) and Figma (a panel you
 * keep open while you work).
 *
 * ⚠️ A RIGHT-SIDE PANEL, NOT A MODAL — no backdrop, the page behind stays usable, so a key can be tried
 * with its row still on screen. Esc, the ✕ or the same key closes it.
 *
 * ⚠️ TWO TABS. **This page** opens on the most specific place you are (an open detail drawer beats the
 * list behind it, a map canvas beats its drawer, the builder beats Admin) marked "You're here", then
 * the page underneath, then Global. **All modules** lists every module by area — list pages too, with
 * a note when they only have the global keys — with the current one expanded.
 *
 * ⚠️ SEARCH spans every module and tags each result with where it works, so searching "move" on the
 * ticket list still finds the builder's move keys.
 */

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10.5px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}
function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {keys.map((k, i) => (k === '+' || k === '/' ? <span key={i} className="text-[10px] text-[#9CA3AF]">{k}</span> : <Kbd key={i}>{k}</Kbd>))}
    </span>
  );
}
function Row({ r }: { r: ShortcutRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[5px]">
      <span className={`min-w-0 text-[12.5px] ${r.lead ? 'font-semibold text-[#1E293B]' : 'text-[#475467]'}`}>{r.label}</span>
      <Keys keys={r.keys} />
    </div>
  );
}

/** One module's shortcuts, grouped under its own headings. */
function ModuleBody({ m }: { m: ShortcutModule }) {
  if (!m.groups.length) {
    return <p className="py-1 text-[12px] text-[#7B8FA5]">No shortcuts of its own yet — the Global keys work here.</p>;
  }
  return (
    <>
      {m.groups.map((g) => (
        <div key={g.title} className="mt-2 first:mt-0">
          <div className="flex items-baseline gap-2 pb-0.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{g.title}</span>
            {g.note && <span className="truncate text-[10.5px] text-[#B0BAC7]">{g.note}</span>}
          </div>
          {g.rows.map((r) => <Row key={g.title + r.label} r={r} />)}
        </div>
      ))}
    </>
  );
}

/** A module block on the "This page" tab. The focused one carries the blue rail and "You're here". */
function ModuleBlock({ m, focused }: { m: ShortcutModule; focused?: boolean }) {
  return (
    <section className={`border-b border-[#EEF2F6] px-5 py-4 last:border-b-0 ${focused ? 'bg-[#F8FBFF]' : ''}`}>
      <div className={`${focused ? 'border-l-2 border-[#3D8BD0] pl-3' : ''}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-[13.5px] font-semibold text-[#1E293B]">{m.name}</h3>
          {focused && <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#3D8BD0]">You’re here</span>}
        </div>
        {m.where && <p className="mt-0.5 text-[11.5px] text-[#7B8FA5]">{m.where}</p>}
        <div className="mt-2.5"><ModuleBody m={m} /></div>
      </div>
    </section>
  );
}

export function GlobalShortcutsPanel({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'page' | 'all'>('page');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const contexts = useShortcutContexts();

  /* "This page": the announced contexts (most specific first), then the page itself, then Global. */
  const here = useMemo(() => {
    const ids = [...contexts, page].filter((id, i, a) => a.indexOf(id) === i && id !== GLOBAL_ID);
    return ids.map(shortcutModule).filter((m): m is ShortcutModule => !!m);
  }, [contexts, page]);
  /* A place with NO keys of its own is not what the panel should open on — the first module that has
     some is focused, and the empty ones still show, with their note, underneath. */
  const focusedId = here.find((m) => rowCount(m) > 0)?.id;
  const ordered = focusedId ? [...here.filter((m) => m.id === focusedId), ...here.filter((m) => m.id !== focusedId && rowCount(m) > 0)] : [];
  /* Where you are when that place has no keys of its own — named once, above the Global block. */
  const bare = !focusedId ? here[0] : undefined;
  const global = shortcutModule(GLOBAL_ID)!;

  useEffect(() => {
    const show = () => { setOpen(true); setTab('page'); setQ(''); };
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTyping(e.target)) { e.preventDefault(); setOpen((v) => { if (!v) { setTab('page'); setQ(''); } return !v; }); return; }
      if (e.key === 'Escape' && open) {
        if (q && document.activeElement === searchRef.current) { setQ(''); return; }
        e.preventDefault(); setOpen(false);
      }
    };
    window.addEventListener('open-global-shortcuts', show);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('open-global-shortcuts', show); window.removeEventListener('keydown', onKey); };
  }, [open, q]);

  /* Opening "All modules" expands where you are, so the list starts from somewhere familiar. */
  useEffect(() => { if (open && tab === 'all') setExpanded(here.map((m) => m.id)); }, [open, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return shortcutModules().map((m) => ({
      m,
      rows: m.groups.flatMap((g) => g.rows).filter((r) => r.label.toLowerCase().includes(t) || r.keys.join(' ').toLowerCase().includes(t) || m.name.toLowerCase().includes(t)),
    })).filter((x) => x.rows.length);
  }, [q]);

  if (!open) return null;
  const hereIds = new Set(here.map((m) => m.id));

  return (
    <aside
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="fixed bottom-0 right-0 top-0 z-[10060] flex w-[440px] max-w-[100vw] flex-col border-l border-[#E5E7EB] bg-white shadow-[-12px_0_32px_-12px_rgba(16,24,40,0.18)]"
    >
      <header className="flex flex-shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-[#111827]">
            <Keyboard size={17} className="text-[#3D8BD0]" /> Keyboard shortcuts
          </div>
          <p className="mt-0.5 text-[11.5px] text-[#7B8FA5]">Press <span className="font-semibold text-[#475467]">?</span> anywhere to open or close. Keys don’t fire while you type in a field.</p>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"><X size={18} /></button>
      </header>

      <div className="flex-shrink-0 px-5">
        <label className="flex h-8 items-center gap-2 rounded border border-[#DFE5ED] px-2.5 focus-within:border-[#3D8BD0]">
          <Search size={14} className="text-[#9CA3AF]" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shortcuts"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#364658] outline-none placeholder:text-[#9CA3AF]"
          />
          {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-[#9CA3AF] hover:text-[#364658]"><X size={13} /></button>}
        </label>
      </div>

      {!results && (
        <div className="mt-1 flex flex-shrink-0 gap-2.5 border-b border-[#E5E7EB] px-5">
          {([['page', 'This page'], ['all', 'All modules']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors ${
                tab === k ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]'
              }`}
            >{label}</button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {results ? (
          results.length ? results.map(({ m, rows }) => (
            <section key={m.id} className="border-b border-[#EEF2F6] px-5 py-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#475467]">{m.name}</span>
                {hereIds.has(m.id) && <span className="text-[10.5px] font-semibold text-[#3D8BD0]">You’re here</span>}
              </div>
              {rows.map((r) => <Row key={r.label} r={r} />)}
            </section>
          )) : (
            <p className="px-5 py-10 text-center text-[12.5px] text-[#7B8FA5]">No shortcut matches “{q.trim()}”.</p>
          )
        ) : tab === 'page' ? (
          <>
            {bare && (
              <p className="mx-5 mt-4 rounded bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#64748B]">
                <span className="font-semibold text-[#364658]">{bare.name}</span> has no shortcuts of its own yet — these work everywhere.
              </p>
            )}
            {ordered.map((m) => <ModuleBlock key={m.id} m={m} focused={m.id === focusedId} />)}
            <ModuleBlock m={global} focused={!focusedId} />
          </>
        ) : (
          SHORTCUT_AREAS.map((area) => {
            const mods = shortcutModules().filter((m) => m.area === area);
            if (!mods.length) return null;
            return (
              <div key={area} className="border-b border-[#EEF2F6] pb-1">
                <div className="px-5 pb-1 pt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{area}</div>
                {mods.map((m) => {
                  const isOpen = expanded.includes(m.id);
                  const n = rowCount(m);
                  const mine = hereIds.has(m.id);
                  return (
                    <div key={m.id}>
                      <button
                        onClick={() => setExpanded((e) => (e.includes(m.id) ? e.filter((x) => x !== m.id) : [...e, m.id]))}
                        className={`flex w-full items-center gap-2 px-5 py-2 text-left transition-colors hover:bg-[#F9FAFB] ${mine ? 'bg-[#F8FBFF]' : ''}`}
                      >
                        <ChevronRight size={14} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        <span className={`text-[13px] ${mine ? 'font-semibold text-[#1E293B]' : 'font-medium text-[#364658]'}`}>{m.name}</span>
                        {mine && <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#3D8BD0]">You’re here</span>}
                        <span className="ml-auto text-[11px] text-[#9CA3AF]">{n ? `${n} shortcuts` : 'Global keys only'}</span>
                      </button>
                      {isOpen && <div className="px-5 pb-3 pl-11 pt-1"><ModuleBody m={m} /></div>}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
