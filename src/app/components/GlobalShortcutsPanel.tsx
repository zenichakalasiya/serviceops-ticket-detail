import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  BookOpen, ChevronDown, ExternalLink, GitBranch, Globe, Keyboard, LayoutTemplate, Network, PanelRight,
  Search, Shield, Sparkles, Star, Workflow, X, XCircle,
} from 'lucide-react';
import type { Page } from '../routes';
import { useShortcutContexts } from './shortcutContext';
import { GLOBAL_ID, rowCount, shortcutModule, shortcutModules } from './shortcutRegistry';
import type { ShortcutGroup, ShortcutModule, ShortcutRow } from './shortcutRegistry';

/**
 * The GLOBAL Keyboard shortcuts popup (Zeni, 8 Oct 2026 — after Frame.io's sheet on Mobbin).
 * Opened from the header's keyboard icon, `?` anywhere, the drawer's rail and the portal builder.
 *
 * ⚠️ TWO PANES: modules on the LEFT, the selected module's shortcuts on the RIGHT. It replaced a 440px
 * side panel whose "This page" tab painted the current module in a tinted box with a blue rail — the
 * left list now says where you are (a small "You're here" tag) and the right side stays plain.
 * Only modules that HAVE keys are listed: a list page with none would open an empty right side.
 * It opens on the most specific place you are (an open drawer beats the list behind it, a canvas beats
 * its drawer, the builder beats Admin), else Global.
 *
 * ⚠️ SEARCH spans every module and matches an action's words OR its keys ("ctrl f"). Results are ONE
 * column with a sticky header per module (where you are first, then Global, then the rest), groups kept,
 * matches highlighted. The left list stays: each module shows its match count, empty ones fade, and a
 * click scopes the results to that module ("Showing: X ×" goes back to all).
 *
 * ⚠️ The left column ends with HELP links (Attio's pattern) — real Motadata pages, opening in a new tab.
 * They were checked live on 8 Oct 2026; there is no acceptable-use page on motadata.com, so Policies
 * offers Terms of service · Privacy policy · Legal.
 */

const MODULE_ICON: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  [GLOBAL_ID]: Globe,
  drawer: PanelRight,
  'relationship-map': Network,
  'superseded-map': GitBranch,
  'deployment-topology': Workflow,
  'portal-builder': LayoutTemplate,
};
const iconFor = (id: string) => MODULE_ICON[id] ?? Keyboard;

const HELP_LINKS = [
  { label: 'Help center', href: 'https://docs.motadata.com/serviceops-docs/', icon: BookOpen },
  { label: 'What’s new', href: 'https://docs.motadata.com/serviceops-docs/release-notes/', icon: Sparkles },
];
const POLICY_LINKS = [
  { label: 'Terms of service', href: 'https://www.motadata.com/terms-of-service' },
  { label: 'Privacy policy', href: 'https://www.motadata.com/privacy-policy/' },
  { label: 'Legal', href: 'https://www.motadata.com/legal/' },
];

function Kbd({ children, hit }: { children: string; hit?: boolean }) {
  return (
    <kbd className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[5px] border px-1.5 font-sans text-[11px] font-medium shadow-[0_1px_0_#E2E8F0] ${
      hit ? 'border-[#F5C26B] bg-[#FEF0C7] text-[#1E293B]' : 'border-[#E2E8F0] bg-white text-[#364658]'
    }`}>
      {children}
    </kbd>
  );
}
/* A "+" or "/" is a SEPARATOR only between two keys; at either end it is a key itself (Zoom is "+ / −"). */
const isSep = (keys: string[], i: number, ch: string) => keys[i] === ch && i > 0 && i < keys.length - 1 && keys[i - 1] !== '/' && keys[i - 1] !== '+';

/** Caps sit side by side — no "+" between keys pressed together; "/" (either one) reads "or".
 *  `hit` = the caps a key search matched, tinted so it shows WHICH key it found. */
function Keys({ keys, hit }: { keys: string[]; hit?: Set<number> }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {keys.map((k, i) => {
        if (isSep(keys, i, '+')) return null;
        if (isSep(keys, i, '/')) return <span key={i} className="px-0.5 text-[11px] text-[#98A2B3]">or</span>;
        return <Kbd key={i} hit={hit?.has(i)}>{k}</Kbd>;
      })}
    </span>
  );
}

/* ── Search ───────────────────────────────────────────────────────────────────────────────
 * A query matches a row's LABEL (substring) or its KEYS. Keys are read as alternatives ("1 / 2 / 3")
 * of combos ("Ctrl + Shift + F"), and a key query matches WHOLE keys in order — "ctrl f" finds
 * Ctrl + F but not Ctrl + Shift + F. "ctrl+f" and "Ctrl F" read the same; arrows can be typed as
 * up / down / left / right. */
const KEY_WORD: Record<string, string> = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right', '−': '-', escape: 'esc' };
const keyWord = (k: string) => KEY_WORD[k] ?? KEY_WORD[k.toLowerCase()] ?? k.toLowerCase();
function keyQuery(t: string): string[] {
  const s0 = t.trim().toLowerCase();
  if (!s0) return [];
  if (s0 === '+') return ['+'];
  return s0.split(/\s*\+\s*|\s+/).filter(Boolean).map(keyWord);
}
/** The caps that match the query, or null when the keys don't. */
function keyHits(keys: string[], q: string[]): Set<number> | null {
  if (!q.length) return null;
  const alts: number[][] = [[]];
  keys.forEach((_, i) => {
    if (isSep(keys, i, '/')) alts.push([]);
    else if (!isSep(keys, i, '+')) alts[alts.length - 1].push(i);
  });
  const hit = new Set<number>();
  for (const a of alts) {
    const words = a.map((i) => keyWord(keys[i]));
    for (let st = 0; st + q.length <= words.length; st++) {
      if (q.every((w, j) => words[st + j] === w)) q.forEach((_, j) => hit.add(a[st + j]));
    }
  }
  return hit.size ? hit : null;
}
type Hit = { r: ShortcutRow; keyHit: Set<number> | null };
/* A label matches where a WORD starts — "up" finds "Move up", not "group". Returns the index or -1. */
function wordAt(text: string, q: string) {
  if (!q) return -1;
  const t = text.toLowerCase();
  for (let i = t.indexOf(q); i >= 0; i = t.indexOf(q, i + 1)) {
    if (i === 0 || !/[a-z0-9]/.test(t[i - 1])) return i;
  }
  return -1;
}
function Highlight({ text, q }: { text: string; q: string }) {
  const i = wordAt(text, q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded-[2px] bg-[#FEF0C7] px-px font-semibold text-[#1E293B]">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

function Row({ r, q, hit }: { r: ShortcutRow; q?: string; hit?: Set<number> | null }) {
  return (
    <div className="flex min-h-[38px] items-center justify-between gap-3 border-t border-[#F1F4F8] px-3.5 py-1.5 first:border-t-0">
      <span className="min-w-0 text-[12.5px] leading-snug text-[#364658]">{q ? <Highlight text={r.label} q={q} /> : r.label}</span>
      <Keys keys={r.keys} hit={hit ?? undefined} />
    </div>
  );
}
/** One group as a card: a light header band, then the rows. */
function GroupCard({ title, note, rows }: { title: string; note?: string; rows: ShortcutRow[] }) {
  return (
    <section className="mb-4 break-inside-avoid overflow-hidden rounded-lg border border-[#E9EDF2] bg-white">
      <header className="flex items-baseline gap-2 bg-[#F8FAFC] px-3.5 py-2">
        <h4 className="text-[12px] font-semibold text-[#1E293B]">{title}</h4>
        {note && <span className="min-w-0 truncate text-[11px] text-[#98A2B3]">{note}</span>}
      </header>
      {/* No line under the header (Zeni, 8 Oct 2026) — wrapped so the first row's top hairline drops too. */}
      <div>{rows.map((r) => <Row key={title + r.label} r={r} />)}</div>
    </section>
  );
}
function Groups({ groups }: { groups: ShortcutGroup[] }) {
  return (
    <div className="gap-4 [column-fill:_balance] min-[900px]:columns-2">
      {groups.map((g) => <GroupCard key={g.title} title={g.title} note={g.note} rows={g.rows} />)}
    </div>
  );
}

/* ── Two versions (Zeni, 9 Oct 2026) ─────────────────────────────────────────────────────────────
 * V1 = the two-pane popup above. V2 = Notion's sheet: pill tabs over ONE scrolling list, the tab
 * follows the scroll, search opens from an icon. A V1 | V2 pill in each header switches them, and the
 * choice is remembered in this browser (`shortcutsUi`). */
type ShortcutsUi = 'v1' | 'v2';
const UI_KEY = 'shortcutsUi';
const readUi = (): ShortcutsUi => { try { return localStorage.getItem(UI_KEY) === 'v2' ? 'v2' : 'v1'; } catch { return 'v1'; } };
function UiSwitch({ ui, onChange }: { ui: ShortcutsUi; onChange: (v: ShortcutsUi) => void }) {
  return (
    <div className="pill-track flex-shrink-0" title="Compare the two designs">
      {(['v1', 'v2'] as const).map((v) => (
        <button key={v} aria-pressed={ui === v} onClick={() => onChange(v)}>{v.toUpperCase()}</button>
      ))}
    </div>
  );
}

/* V2's key caps — Notion's: a soft grey fill, no border, monospace. */
function SoftKeys({ keys, hit }: { keys: string[]; hit?: Set<number> | null }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {keys.map((k, i) => {
        if (isSep(keys, i, '+')) return null;
        if (isSep(keys, i, '/')) return <span key={i} className="px-0.5 text-[11px] text-[#98A2B3]">or</span>;
        return (
          <kbd key={i} className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] px-1.5 font-mono text-[11.5px] ${
            hit?.has(i) ? 'bg-[#FEF0C7] text-[#1E293B]' : 'bg-[#F1F4F8] text-[#4B5563]'
          }`}>{k}</kbd>
        );
      })}
    </span>
  );
}

type Section = { id: string; name: string; icon: ComponentType<{ size?: number; className?: string }>; where?: string; here?: boolean;
  groups: { title?: string; note?: string; hits: Hit[] }[] };

/**
 * V2 — Notion's keyboard-shortcuts sheet, in light. The title and the tab row stay pinned; everything
 * below is ONE list (a big heading per module, a smaller one per group). A tab scrolls to its section and
 * the scroll lights the tab. Tabs that do not fit go behind "more…". Search opens from the icon at the
 * right: it filters the list in place, keeps the headings, and tabs with no match DISAPPEAR.
 * ⚠️ Popular is a SHORTCUT list (copies of rows that live in their module), so it is left out of search
 * results — otherwise every match in it would show twice.
 */
function NotionView({ modules, hereIds, focusedId, rank, ui, onUi, onClose }: {
  modules: ShortcutModule[]; hereIds: Set<string>; focusedId?: string; rank: (id: string) => number;
  ui: ShortcutsUi; onUi: (v: ShortcutsUi) => void; onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [active, setActive] = useState('popular');
  const [moreOpen, setMoreOpen] = useState(false);
  const [fit, setFit] = useState<number>(99);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(0);
  const term = q.trim().toLowerCase();

  /* Where you are first, then Global, then the rest — the tab order and the list order. */
  const ordered = useMemo(() => modules.map((m, i) => ({ m, i })).sort((a, b) => rank(a.m.id) - rank(b.m.id) || a.i - b.i).map((x) => x.m), [modules, rank]);

  const sections: Section[] = useMemo(() => {
    const kq = keyQuery(term);
    const match = (r: ShortcutRow): Hit | null => {
      if (!term) return { r, keyHit: null };
      const keyHit = keyHits(r.keys, kq);
      return wordAt(r.label, term) >= 0 || keyHit ? { r, keyHit } : null;
    };
    const out: Section[] = [];
    const here = focusedId ? shortcutModule(focusedId) : undefined;
    /* Popular = the lead keys of where you are (topped up to six from its first rows), then Global's.
       On a page with no keys of its own it would be Global again, word for word — so it is left out. */
    if (!term && here) {
      const all = here.groups.flatMap((g) => g.rows);
      const leads = all.filter((r) => r.lead);
      const pick = [...leads, ...all.filter((r) => !r.lead)].slice(0, Math.max(6, leads.length));
      const global = shortcutModule(GLOBAL_ID)?.groups.flatMap((g) => g.rows) ?? [];
      out.push({ id: 'popular', name: 'Popular', icon: Star, where: `${here.name}, and keys that work everywhere`,
        groups: [{ hits: [...pick, ...global].map((r) => ({ r, keyHit: null })) }] });
    }
    for (const m of ordered) {
      const groups = m.groups
        .map((g) => ({ title: g.title, note: g.note, hits: g.rows.map(match).filter((h): h is Hit => !!h) }))
        .filter((g) => g.hits.length);
      if (groups.length) out.push({ id: m.id, name: m.name, icon: iconFor(m.id), where: m.where, here: hereIds.has(m.id) && m.id !== GLOBAL_ID, groups });
    }
    return out;
  }, [term, ordered, focusedId, hereIds]);

  /* The lit tab must exist — a search can remove it. */
  useEffect(() => { if (!sections.some((s) => s.id === active)) setActive(sections[0]?.id ?? 'popular'); }, [sections, active]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [term]);

  /* How many tabs fit beside the search: measured off a hidden copy of the row. */
  useEffect(() => {
    const row = rowRef.current; const meas = measureRef.current;
    if (!row || !meas) return;
    const calc = () => {
      const widths = [...meas.children].map((c) => (c as HTMLElement).offsetWidth + 4);
      const avail = row.clientWidth - (searchOpen ? 276 : 44) - 8;
      const total = widths.reduce((a, b) => a + b, 0);
      if (total <= avail) { setFit(widths.length); return; }
      let used = 84; let n = 0; // 84 = the "more…" button
      while (n < widths.length && used + widths[n] <= avail) used += widths[n++];
      setFit(Math.max(1, n));
    };
    calc();
    const ro = new ResizeObserver(calc); ro.observe(row);
    return () => ro.disconnect();
  }, [sections, searchOpen]);

  const shown = sections.slice(0, fit);
  const hidden = sections.slice(fit);

  /* Scroll spy — the section whose heading has passed the top. At the bottom, the last one. */
  const onScroll = () => {
    if (Date.now() < lockRef.current) return;
    const sc = scrollRef.current; if (!sc) return;
    const heads = [...sc.querySelectorAll<HTMLElement>('[data-sc-section]')];
    let cur = heads[0]?.dataset.scSection;
    for (const h of heads) if (h.offsetTop - sc.scrollTop <= 32) cur = h.dataset.scSection;
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) cur = heads[heads.length - 1]?.dataset.scSection;
    if (cur) setActive(cur);
  };
  const go = (id: string) => {
    const sc = scrollRef.current;
    const el = sc?.querySelector<HTMLElement>(`[data-sc-section="${id}"]`);
    setActive(id); setMoreOpen(false);
    if (sc && el) { lockRef.current = Date.now() + 600; sc.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' }); }
  };

  /* Esc: clear the search, then close it, then close the sheet. Capture phase so the panel's own
     Escape (close) only runs when nothing here used the key. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (moreOpen) { setMoreOpen(false); } else if (q) { setQ(''); } else if (searchOpen) { setSearchOpen(false); } else return;
      e.preventDefault(); e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [q, searchOpen, moreOpen]);
  useEffect(() => { if (searchOpen) inputRef.current?.focus(); else dialogRef.current?.focus({ preventScroll: true }); }, [searchOpen]);
  useEffect(() => {
    if (!moreOpen) return;
    const off = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-sc-more]')) setMoreOpen(false); };
    window.addEventListener('mousedown', off);
    return () => window.removeEventListener('mousedown', off);
  }, [moreOpen]);

  const tabCls = (on: boolean) => `inline-flex h-8 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-colors ${
    on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#1E293B]'
  }`;
  const tab = (s: Section, on: boolean, onClick?: () => void) => {
    const Icon = s.icon;
    return <button key={s.id} onClick={onClick} className={tabCls(on)}><Icon size={14} className="flex-shrink-0" />{s.name}</button>;
  };
  const total = term ? sections.reduce((n, s) => n + s.groups.reduce((k, g) => k + g.hits.length, 0), 0) : 0;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="flex h-[min(720px,calc(100vh-48px))] w-[min(960px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_64px_-12px_rgba(16,24,40,0.28)] outline-none"
    >
      {/* Pinned head — title, tabs, search */}
      <div className="relative z-10 flex-shrink-0 px-10 pt-7">
        <div className="flex items-center gap-3">
          <h2 className="text-[26px] font-bold leading-tight text-[#111827]">Keyboard shortcuts</h2>
          <div className="ml-auto flex items-center gap-2">
            <UiSwitch ui={ui} onChange={onUi} />
            <button onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"><X size={18} /></button>
          </div>
        </div>

        <div ref={rowRef} className="relative mt-4 flex items-center gap-1 pb-3">
          {/* Hidden copy of every tab, only to measure how many fit. */}
          <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex gap-1">
            {sections.map((s) => tab(s, true))}
          </div>
          {shown.map((s) => tab(s, s.id === active, () => go(s.id)))}
          {hidden.length > 0 && (
            <div data-sc-more className="relative">
              <button onClick={() => setMoreOpen((v) => !v)} className={tabCls(hidden.some((s) => s.id === active))}>more…</button>
              {moreOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-[240px] rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.2)]">
                  {hidden.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button key={s.id} onClick={() => go(s.id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] ${s.id === active ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'}`}>
                        <Icon size={14} className="flex-shrink-0" />{s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="ml-auto flex-shrink-0">
            {searchOpen ? (
              <label className="flex h-9 w-[260px] items-center gap-2 rounded-md bg-[#F5F7FA] px-2.5 focus-within:ring-1 focus-within:ring-[#3D8BD0]">
                <Search size={15} className="flex-shrink-0 text-[#7B8FA5]" />
                <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1E293B] outline-none placeholder:text-[#9CA3AF]" />
                <button onClick={() => { if (q) { setQ(''); inputRef.current?.focus(); } else setSearchOpen(false); }}
                  aria-label={q ? 'Clear search' : 'Close search'} className="flex-shrink-0 text-[#98A2B3] hover:text-[#364658]">
                  <XCircle size={15} />
                </button>
              </label>
            ) : (
              <button onClick={() => setSearchOpen(true)} aria-label="Search shortcuts" className="flex size-9 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#F5F7FA] hover:text-[#1E293B]"><Search size={17} /></button>
            )}
          </div>
        </div>
        {/* The list fades out under the pinned head. */}
        <div className="pointer-events-none absolute inset-x-0 top-full h-5 bg-gradient-to-b from-white to-transparent" />
      </div>

      {/* One list */}
      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto px-10 pb-10 pt-2">
        {term && (
          <p className="mb-1 text-[12px] text-[#7B8FA5]">
            {total ? <>{total} {total === 1 ? 'result' : 'results'} for “{q.trim()}”</> : null}
          </p>
        )}
        {sections.length ? sections.map((s) => (
          <section key={s.id} data-sc-section={s.id} className="pt-6 first:pt-2">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[22px] font-semibold leading-tight text-[#111827]">{s.name}</h3>
              {s.here && <span className="flex items-center gap-1 text-[11.5px] font-medium text-[#3D8BD0]"><span className="size-1.5 rounded-full bg-[#3D8BD0]" />You’re here</span>}
            </div>
            {s.where && !term && <p className="mt-1 text-[12.5px] text-[#7B8FA5]">{s.where}</p>}
            {s.groups.map((g, gi) => (
              <div key={(g.title ?? '') + gi} className="mt-4">
                {g.title && (
                  <div className="flex items-baseline gap-2 pb-1">
                    <h4 className="text-[15px] font-semibold text-[#1E293B]">{g.title}</h4>
                    {g.note && <span className="text-[12px] text-[#98A2B3]">{g.note}</span>}
                  </div>
                )}
                {g.hits.map(({ r, keyHit }) => (
                  <div key={r.label + r.keys.join('')} className="flex min-h-[44px] items-center justify-between gap-4 border-b border-[#EEF2F6] py-2">
                    <span className="min-w-0 text-[14px] text-[#364658]">{term ? <Highlight text={r.label} q={term} /> : r.label}</span>
                    <SoftKeys keys={r.keys} hit={keyHit} />
                  </div>
                ))}
              </div>
            ))}
          </section>
        )) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#98A2B3]"><Search size={18} /></span>
            <p className="mt-3 text-[13px] font-medium text-[#364658]">No shortcut matches “{q.trim()}”</p>
            <p className="mt-1 text-[12px] text-[#7B8FA5]">Try a word from the action, like “select”, or a key, like “ctrl f”.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GlobalShortcutsPanel({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const [ui, setUiState] = useState<ShortcutsUi>(readUi);
  const setUi = (v: ShortcutsUi) => { setUiState(v); try { localStorage.setItem(UI_KEY, v); } catch { /* private window */ } };
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string>(GLOBAL_ID);
  /* While searching, the left list SCOPES the results to one module (null = all of them). */
  const [scope, setScope] = useState<string | null>(null);
  useEffect(() => { if (!q.trim()) setScope(null); }, [q]);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const contexts = useShortcutContexts();

  const modules = useMemo(() => shortcutModules().filter((m) => rowCount(m) > 0), []);
  /* Where you are: the announced contexts (most specific first), then the page itself. */
  const hereIds = useMemo(() => new Set([...contexts, page]), [contexts, page]);
  const focusedId = [...contexts, page].map(shortcutModule).find((m) => m && rowCount(m) > 0 && m.id !== GLOBAL_ID)?.id;

  const show = () => { setOpen(true); setQ(''); setScope(null); setSel(focusedId ?? GLOBAL_ID); };
  const showRef = useRef(show);
  showRef.current = show;

  useEffect(() => {
    const onOpen = () => showRef.current();
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTyping(e.target)) {
        e.preventDefault();
        if (open) setOpen(false); else showRef.current();
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        if (q && document.activeElement === searchRef.current) { setQ(''); return; }
        e.preventDefault(); setOpen(false); return;
      }
      /* ↑ ↓ walk the module list while nothing is searched and no field is being typed in. */
      if (ui === 'v1' && !q && (!isTyping(e.target) || e.target === searchRef.current) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        setSel((cur) => {
          const i = modules.findIndex((m) => m.id === cur);
          const n = e.key === 'ArrowDown' ? Math.min(modules.length - 1, i + 1) : Math.max(0, i - 1);
          return modules[n]?.id ?? cur;
        });
      }
    };
    window.addEventListener('open-global-shortcuts', onOpen);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('open-global-shortcuts', onOpen); window.removeEventListener('keydown', onKey); };
  }, [open, q, modules, ui]);

  useEffect(() => { if (open) requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true })); }, [open]);

  const term = q.trim().toLowerCase();
  /* Every module's matches, groups kept (Tabs, Records…), in reading order: where you are first (most
     specific first), then Global, then the rest. */
  const allResults = useMemo(() => {
    if (!term) return null;
    const kq = keyQuery(term);
    const here: string[] = [...contexts, page];
    const rank = (id: string) => { const i = here.indexOf(id); return i >= 0 ? i : id === GLOBAL_ID ? here.length : here.length + 1; };
    return modules
      .map((m, order) => {
        const groups = m.groups
          .map((g) => ({
            title: g.title,
            hits: g.rows.map((r): Hit | null => {
              const keyHit = keyHits(r.keys, kq);
              return wordAt(r.label, term) >= 0 || keyHit ? { r, keyHit } : null;
            }).filter((h): h is Hit => !!h),
          }))
          .filter((g) => g.hits.length);
        return { m, order, groups, count: groups.reduce((n, g) => n + g.hits.length, 0) };
      })
      .sort((a, b) => rank(a.m.id) - rank(b.m.id) || a.order - b.order);
  }, [term, modules, contexts, page]);
  const matched = allResults ? allResults.filter((x) => x.count) : null;
  const results = matched && (scope ? matched.filter((x) => x.m.id === scope) : matched);
  const countFor = (id: string) => allResults?.find((x) => x.m.id === id)?.count ?? 0;
  const total = matched ? matched.reduce((n, x) => n + x.count, 0) : 0;

  const rank = useMemo(() => {
    const here: string[] = [...contexts, page];
    return (id: string) => { const i = here.indexOf(id); return i >= 0 ? i : id === GLOBAL_ID ? here.length : here.length + 1; };
  }, [contexts, page]);

  if (!open) return null;
  if (ui === 'v2') {
    return (
      <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-[rgba(16,24,40,0.32)] p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <NotionView modules={modules} hereIds={hereIds} focusedId={focusedId} rank={rank} ui={ui} onUi={setUi} onClose={() => setOpen(false)} />
      </div>
    );
  }
  const current = shortcutModule(sel) ?? shortcutModule(GLOBAL_ID)!;
  const CurIcon = iconFor(current.id);

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-[rgba(16,24,40,0.32)] p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="flex h-[min(680px,calc(100vh-48px))] w-[min(1040px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_64px_-12px_rgba(16,24,40,0.28)]"
      >
        {/* Head — title, one line, search, close */}
        <header className="flex flex-shrink-0 items-center gap-4 border-b border-[#EEF2F6] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Keyboard size={16} /></span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-tight text-[#111827]">Keyboard shortcuts</h2>
              <p className="mt-0.5 truncate text-[11.5px] text-[#7B8FA5]">Press <Kbd>?</Kbd> anywhere to open or close. Keys don’t fire while you type in a field.</p>
            </div>
          </div>
          <label className="ml-auto flex h-8 w-[280px] flex-shrink items-center gap-2 rounded border border-[#DFE5ED] px-2.5 focus-within:border-[#3D8BD0]">
            <Search size={14} className="flex-shrink-0 text-[#9CA3AF]" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search actions or keys, e.g. ctrl f"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#364658] outline-none placeholder:text-[#9CA3AF]"
            />
            {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-[#9CA3AF] hover:text-[#364658]"><X size={13} /></button>}
          </label>
          <UiSwitch ui={ui} onChange={setUi} />
          <button onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"><X size={18} /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Left — modules, then help */}
          <nav className="flex w-[248px] flex-shrink-0 flex-col border-r border-[#EEF2F6] bg-[#FAFBFC]">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#98A2B3]">{results ? 'Matches by module' : 'Modules'}</div>
              {modules.map((m) => {
                const Icon = iconFor(m.id);
                const n = results ? countFor(m.id) : rowCount(m);
                const active = results ? scope === m.id : m.id === current.id;
                const none = !!results && n === 0;
                return (
                  <button
                    key={m.id}
                    disabled={none}
                    title={none ? `No match in ${m.name}` : undefined}
                    /* Searching: a click scopes the results to this module (again = all). Otherwise it opens it. */
                    onClick={() => { if (results) setScope((s) => (s === m.id ? null : m.id)); else setSel(m.id); }}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-[7px] text-left transition-colors ${
                      active ? 'bg-[#EBF5FF] text-[#3D8BD0]' : none ? 'cursor-default text-[#475467] opacity-40' : 'text-[#475467] hover:bg-[#F1F4F8]'
                    }`}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] ${active ? 'font-semibold' : 'font-medium'}`}>{m.name}</span>
                      {/* A second line, not a tag beside the name — a tag cut "Support Portal builder" to "Support Portal …". */}
                      {hereIds.has(m.id) && m.id !== GLOBAL_ID && <span className="mt-px flex items-center gap-1 text-[10.5px] font-medium text-[#3D8BD0]"><span className="size-1.5 rounded-full bg-[#3D8BD0]" />You’re here</span>}
                    </span>
                    <span className={`flex-shrink-0 text-[11px] ${results && n ? 'rounded-full bg-[#FEF0C7] px-1.5 font-semibold text-[#92400E]' : 'text-[#98A2B3]'}`}>{n}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-shrink-0 border-t border-[#EEF2F6] px-3 py-2.5">
              {HELP_LINKS.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-2.5 rounded-md px-2 py-[6px] text-[12.5px] font-medium text-[#475467] transition-colors hover:bg-[#F1F4F8] hover:text-[#1E293B]">
                  <Icon size={15} className="flex-shrink-0 text-[#7B8FA5]" />
                  <span className="flex-1">{label}</span>
                  <ExternalLink size={12} className="text-[#B0BAC7] opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
              <button onClick={() => setPoliciesOpen((v) => !v)} aria-expanded={policiesOpen}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-[6px] text-left text-[12.5px] font-medium text-[#475467] transition-colors hover:bg-[#F1F4F8] hover:text-[#1E293B]">
                <Shield size={15} className="flex-shrink-0 text-[#7B8FA5]" />
                <span className="flex-1">Our policies</span>
                <ChevronDown size={14} className={`text-[#98A2B3] transition-transform ${policiesOpen ? 'rotate-180' : ''}`} />
              </button>
              {policiesOpen && (
                <div className="ml-[17px] border-l border-[#E5E9F0] pl-2.5">
                  {POLICY_LINKS.map(({ label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer"
                      className="group flex items-center gap-2 rounded-md px-2 py-[5px] text-[12px] text-[#64748B] transition-colors hover:bg-[#F1F4F8] hover:text-[#1E293B]">
                      <span className="flex-1">{label}</span>
                      <ExternalLink size={11} className="text-[#B0BAC7] opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right — the selected module, or search results */}
          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {results ? (
              results.length ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-[#7B8FA5]">
                    <span>
                      {scope
                        ? <>{results[0].count} of {total} {total === 1 ? 'result' : 'results'} for “{q.trim()}”</>
                        : <>{total} {total === 1 ? 'result' : 'results'} for “{q.trim()}” in {matched!.length} {matched!.length === 1 ? 'module' : 'modules'}</>}
                    </span>
                    {scope && (
                      <button onClick={() => setScope(null)} className="inline-flex h-6 items-center gap-1 rounded bg-[#EBF5FF] pl-2 pr-1 text-[11.5px] font-medium text-[#3D8BD0] hover:bg-[#DCEBFA]">
                        Showing: {results[0].m.name}<X size={12} />
                      </button>
                    )}
                  </div>
                  {/* ONE column, one section per module — a sticky header names the module every row
                      under it belongs to, so a result is never read without its module. */}
                  {results.map(({ m, groups, count }) => {
                    const Icon = iconFor(m.id);
                    return (
                      <section key={m.id} className="mb-6">
                        <header className="sticky -top-5 z-10 -mx-6 mb-2 flex items-center gap-2.5 border-b border-[#EEF2F6] bg-white px-6 py-2">
                          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md border border-[#E9EDF2] bg-white text-[#3D8BD0]"><Icon size={14} /></span>
                          <h3 className="text-[13.5px] font-semibold text-[#111827]">{m.name}</h3>
                          {hereIds.has(m.id) && m.id !== GLOBAL_ID && <span className="flex items-center gap-1 text-[11px] font-medium text-[#3D8BD0]"><span className="size-1.5 rounded-full bg-[#3D8BD0]" />You’re here</span>}
                          <span className="ml-auto text-[11.5px] text-[#98A2B3]">{count} {count === 1 ? 'match' : 'matches'}</span>
                        </header>
                        {groups.map((g) => (
                          <div key={g.title} className="mb-3">
                            <div className="px-1 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#98A2B3]">{g.title}</div>
                            <div className="overflow-hidden rounded-lg border border-[#E9EDF2] bg-white">
                              {g.hits.map(({ r, keyHit }) => <Row key={r.label + r.keys.join('')} r={r} q={term} hit={keyHit} />)}
                            </div>
                          </div>
                        ))}
                      </section>
                    );
                  })}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#98A2B3]"><Search size={18} /></span>
                  <p className="mt-3 text-[13px] font-medium text-[#364658]">No shortcut matches “{q.trim()}”</p>
                  <p className="mt-1 text-[12px] text-[#7B8FA5]">Try a word from the action, like “select”, or a key, like “ctrl f”.</p>
                </div>
              )
            ) : (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#E9EDF2] bg-white text-[#3D8BD0]"><CurIcon size={17} /></span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-tight text-[#111827]">{current.name}</h3>
                    {current.where && <p className="mt-1 text-[12px] text-[#7B8FA5]">{current.where}</p>}
                  </div>
                </div>
                <Groups groups={current.groups} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
