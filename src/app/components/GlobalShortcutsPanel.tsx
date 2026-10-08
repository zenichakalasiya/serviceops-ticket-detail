import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  BookOpen, ChevronDown, ExternalLink, GitBranch, Globe, Keyboard, LayoutTemplate, Network, PanelRight,
  Search, Shield, Sparkles, Workflow, X,
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
 * ⚠️ SEARCH spans every module; results replace the right side, grouped by module.
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

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[5px] border border-[#E2E8F0] bg-white px-1.5 font-sans text-[11px] font-medium text-[#364658] shadow-[0_1px_0_#E2E8F0]">
      {children}
    </kbd>
  );
}
/** Caps sit side by side — no "+" between keys pressed together; "/" (either one) reads "or". */
function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {keys.filter((k) => k !== '+').map((k, i, a) => (k === '/' && i > 0 && i < a.length - 1 ? <span key={i} className="px-0.5 text-[11px] text-[#98A2B3]">or</span> : <Kbd key={i}>{k}</Kbd>))}
    </span>
  );
}
function Row({ r }: { r: ShortcutRow }) {
  return (
    <div className="flex min-h-[38px] items-center justify-between gap-3 border-t border-[#F1F4F8] px-3.5 py-1.5 first:border-t-0">
      <span className="min-w-0 text-[12.5px] leading-snug text-[#364658]">{r.label}</span>
      <Keys keys={r.keys} />
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

export function GlobalShortcutsPanel({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string>(GLOBAL_ID);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const contexts = useShortcutContexts();

  const modules = useMemo(() => shortcutModules().filter((m) => rowCount(m) > 0), []);
  /* Where you are: the announced contexts (most specific first), then the page itself. */
  const hereIds = useMemo(() => new Set([...contexts, page]), [contexts, page]);
  const focusedId = [...contexts, page].map(shortcutModule).find((m) => m && rowCount(m) > 0 && m.id !== GLOBAL_ID)?.id;

  const show = () => { setOpen(true); setQ(''); setSel(focusedId ?? GLOBAL_ID); };
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
      if (!q && (!isTyping(e.target) || e.target === searchRef.current) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
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
  }, [open, q, modules]);

  useEffect(() => { if (open) requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true })); }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return modules.map((m) => ({
      m,
      rows: m.groups.flatMap((g) => g.rows).filter((r) => r.label.toLowerCase().includes(t) || r.keys.join(' ').toLowerCase().includes(t) || m.name.toLowerCase().includes(t)),
    })).filter((x) => x.rows.length);
  }, [q, modules]);

  if (!open) return null;
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
              placeholder="Search all shortcuts"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#364658] outline-none placeholder:text-[#9CA3AF]"
            />
            {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-[#9CA3AF] hover:text-[#364658]"><X size={13} /></button>}
          </label>
          <button onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"><X size={18} /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Left — modules, then help */}
          <nav className="flex w-[248px] flex-shrink-0 flex-col border-r border-[#EEF2F6] bg-[#FAFBFC]">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#98A2B3]">Modules</div>
              {modules.map((m) => {
                const Icon = iconFor(m.id);
                const active = !results && m.id === current.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setQ(''); setSel(m.id); }}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-[7px] text-left transition-colors ${
                      active ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#475467] hover:bg-[#F1F4F8]'
                    }`}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] ${active ? 'font-semibold' : 'font-medium'}`}>{m.name}</span>
                      {/* A second line, not a tag beside the name — a tag cut "Support Portal builder" to "Support Portal …". */}
                      {hereIds.has(m.id) && m.id !== GLOBAL_ID && <span className="mt-px flex items-center gap-1 text-[10.5px] font-medium text-[#3D8BD0]"><span className="size-1.5 rounded-full bg-[#3D8BD0]" />You’re here</span>}
                    </span>
                    <span className="flex-shrink-0 text-[11px] text-[#98A2B3]">{rowCount(m)}</span>
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
                  <p className="mb-4 text-[12px] text-[#7B8FA5]">{results.reduce((n, r) => n + r.rows.length, 0)} shortcuts match “{q.trim()}”</p>
                  <div className="gap-4 min-[900px]:columns-2">
                    {results.map(({ m, rows }) => <GroupCard key={m.id} title={m.name} note={hereIds.has(m.id) && m.id !== GLOBAL_ID ? 'You’re here' : undefined} rows={rows} />)}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#98A2B3]"><Search size={18} /></span>
                  <p className="mt-3 text-[13px] font-medium text-[#364658]">No shortcut matches “{q.trim()}”</p>
                  <p className="mt-1 text-[12px] text-[#7B8FA5]">Try a word from the action, like “select” or “search”.</p>
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
