import { useEffect } from 'react';
import { openGlobalShortcuts, useShortcutContext } from './shortcutContext';

/* Global keyboard shortcuts for the detail-drawer host. Mounted once by DrawerStackProvider.
 * Window/tab actions use the host's own state (passed in); in-drawer actions are triggered by
 * scoped DOM lookups against the visible `[data-drawer]` element (graceful no-op if missing).
 * Alt-based combos are used because Ctrl+W / Ctrl+Tab / Ctrl+L etc. are browser-reserved. */

export interface DrawerShortcutProps {
  active: boolean;            // a drawer exists (open OR minimized)
  minimized: boolean;        // currently collapsed to the rail
  toggleMinimize: () => void; // Alt+M minimizes when open, restores when minimized
  closeActive: () => void;
  closeAll: () => void;
  nextRecord: () => void;
  prevRecord: () => void;
  activeId?: string;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

const drawerEl = (): HTMLElement =>
  (document.querySelector('[data-drawer]') as HTMLElement) ?? document.body;

function clickByTitleIncludes(sub: string) {
  const b = [...drawerEl().querySelectorAll('button')].find((x) => (x.getAttribute('title') || '').toLowerCase().includes(sub.toLowerCase()) && (x as HTMLElement).offsetParent !== null);
  (b as HTMLElement | undefined)?.click();
}
function clickByText(text: string) {
  const b = [...drawerEl().querySelectorAll('button')].find((x) => (x.textContent || '').replace(/\s+/g, ' ').trim() === text && (x as HTMLElement).offsetParent !== null);
  (b as HTMLElement | undefined)?.click();
}
function clickElByTitle(title: string) {
  (drawerEl().querySelector(`[title="${title}"]`) as HTMLElement | null)?.click();
}
/** Cycle the right-side vertical group icons (Ticket Properties / Activity / Suggestions /
 * Notifications / Users / Attachments …). Reads the currently-active icon from the DOM,
 * steps by `dir`, and clicks that icon; blurs after so a focused button can't swallow the
 * next keypress. */
function cycleSidebarGroup(dir: 1 | -1) {
  const panel = drawerEl().querySelector('[data-onboarding="right-sidebar"]');
  if (!panel) return;
  const btns = [...panel.querySelectorAll('button')].filter(
    // Only the TOP group icons — the bottom-pinned keyboard-shortcuts opener (mt-auto) is not a group.
    (b) => b.className.includes('rounded-[6px]') && b.className.includes('size-9') && !b.className.includes('mt-auto'),
  ) as HTMLElement[];
  if (!btns.length) return;
  let idx = btns.findIndex((b) => b.className.includes('bg-[#EBF5FF]'));
  if (idx < 0) idx = 0;
  const target = btns[(idx + dir + btns.length) % btns.length];
  target?.click();
  target?.blur();
}
function clickBySvgClass(cls: string) {
  const svg = drawerEl().querySelector(`button svg[class*="${cls}"]`);
  (svg?.closest('button') as HTMLElement | null)?.click();
}
function toggleAi() {
  const d = drawerEl();
  // The "Ask AI" bar is a readOnly input inside a clickable <div> — clicking it opens the
  // chat (the click bubbles to the parent's onClick). The bar is display:none while the
  // chat is open, so: bar visible → open it; bar hidden (chat open) → click Close to toggle.
  const bar = [...d.querySelectorAll('input, textarea')].find((x) => /ask ai/i.test((x as HTMLInputElement).placeholder || '')) as HTMLElement | undefined;
  if (bar && bar.offsetParent !== null) { bar.click(); return; }
  // Chat is open (bar hidden) → click its Close control to toggle it shut.
  (d.querySelector('button[title="Close AI"]') as HTMLElement | null)?.click();
}
/** Cycle the record's own content tabs (Overview → Properties → …) by clicking the sibling tab. */
function cycleContentTab(dir: 1 | -1) {
  const d = drawerEl();
  const tabs = [...d.querySelectorAll('button')].filter((b) => {
    const c = b.className || '';
    return /py-3/.test(c) && /whitespace-nowrap/.test(c) && !/^More/.test((b.textContent || '').trim());
  });
  if (tabs.length < 2) return;
  // The ACTIVE tab is the one with the blue underline. Every tab now carries `border-b-2`
  // (transparent when inactive) for the hover treatment, so match the blue colour instead —
  // and require a word boundary so `hover:border-[#3D8BD0]` never counts as active.
  let idx = tabs.findIndex((b) => /(^|\s)border-\[#3D8BD0\]/.test(b.className));
  if (idx < 0) idx = 0;
  const next = tabs[(idx + dir + tabs.length) % tabs.length];
  (next as HTMLElement)?.click();
}
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); } catch { /* clipboard may be blocked */ }
}

/* Grouped like the Relationship-map shortcuts popup (section headers + keycaps, keys on the
 * left, label on the right). A key token is a keycap unless it's a `+` or `/` separator. */
/* ⚠️ EXPORTED for the global Keyboard shortcuts panel (`shortcutRegistry`), which lists these as the
   'Detail pages' module — this drawer no longer draws a cheat sheet of its own (Zeni, 30 Sep 2026). */
export const DRAWER_SHORTCUT_SECTIONS: { title: string; rows: { keys: string[]; label: string }[] }[] = [
  { title: 'Window', rows: [
    { keys: ['Alt', '+', 'M'], label: 'Minimize / restore drawer' },
    { keys: ['Alt', '+', 'F'], label: 'Toggle Small / Full view' },
    { keys: ['Alt', '+', 'W'], label: 'Close current tab' },
    { keys: ['Alt', '+', 'Shift', '+', 'W'], label: 'Close all tabs' },
  ] },
  { title: 'Navigation', rows: [
    { keys: ['Alt', '+', ']', '/', '['], label: 'Next / Previous record' },
    { keys: ['Alt', '+', '↓', '/', '↑'], label: 'Switch right-panel group' },
    { keys: ['Alt', '+', '.', '/', ','], label: 'Next / Previous content tab' },
  ] },
  { title: 'Actions', rows: [
    { keys: ['Alt', '+', 'I'], label: 'Open / close AI (Ask AI)' },
    { keys: ['Alt', '+', 'A'], label: 'Expand / collapse AI Summary' },
    { keys: ['Alt', '+', 'S'], label: 'Change status' },
    { keys: ['Alt', '+', 'R'], label: 'Reply (conversation)' },
    { keys: ['Alt', '+', 'N'], label: 'Add Note' },
    { keys: ['Alt', '+', 'E'], label: 'Edit' },
    { keys: ['Alt', '+', 'O'], label: 'Open actions menu' },
    { keys: ['Alt', '+', 'C'], label: 'Copy ID' },
    { keys: ['Alt', '+', 'U'], label: 'Copy link' },
  ] },
  { title: 'Help', rows: [
    { keys: ['Shift', '+', '?'], label: 'Show this help' },
  ] },
];

export function DrawerShortcuts(props: DrawerShortcutProps) {
  /* While a drawer is open (not minimized) it is where your focus is, so the global panel opens on it. */
  useShortcutContext(props.active && !props.minimized ? 'drawer' : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!props.active) return;
      /* `?` belongs to the GLOBAL panel now (GlobalShortcutsPanel), which opens on this drawer. */
      // Alt+I toggles the AI chat and must work even from INSIDE the chat's own input
      // (opening the chat auto-focuses it), so it bypasses the typing guard.
      if (e.altKey && e.code === 'KeyI' && !props.minimized) { e.preventDefault(); toggleAi(); return; }
      if (isTyping(e.target)) return;
      if (!e.altKey) return;

      // Alt+M works in BOTH states — minimize when open, restore when minimized.
      if (e.code === 'KeyM') { e.preventDefault(); props.toggleMinimize(); return; }
      // Every other shortcut only applies while the drawer is actually visible.
      if (props.minimized) return;

      switch (e.code) {
        case 'KeyW': e.preventDefault(); e.shiftKey ? props.closeAll() : props.closeActive(); break;
        case 'KeyF': e.preventDefault(); clickByTitleIncludes('view'); break;
        case 'BracketRight': e.preventDefault(); props.nextRecord(); break;
        case 'BracketLeft': e.preventDefault(); props.prevRecord(); break;
        case 'ArrowDown': e.preventDefault(); cycleSidebarGroup(1); break;
        case 'ArrowUp': e.preventDefault(); cycleSidebarGroup(-1); break;
        case 'Period': e.preventDefault(); cycleContentTab(1); break;
        case 'Comma': e.preventDefault(); cycleContentTab(-1); break;
        case 'KeyC': e.preventDefault(); if (props.activeId) copyText(props.activeId); break;
        case 'KeyU': e.preventDefault(); if (props.activeId) copyText(`${location.origin}${location.pathname}#${props.activeId}`); break;
        case 'KeyS': e.preventDefault(); clickByTitleIncludes('update status'); break;
        case 'KeyE': e.preventDefault(); clickByTitleIncludes('edit'); break;
        case 'KeyR': e.preventDefault(); clickByText('Reply'); break;
        case 'KeyN': e.preventDefault(); clickByText('Note'); break;
        case 'KeyA': e.preventDefault(); clickElByTitle('Toggle AI Summary'); break;
        case 'KeyO': e.preventDefault(); clickBySvgClass('more-vertical'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);


  // Open the cheat-sheet when the right-rail Keyboard button dispatches this event (the button
  // lives in the properties-panel rail so it flows with the panel instead of a floating overlay).
  useEffect(() => {
    /* The ticket right rail's Keyboard button — it now opens the global panel, focused here. */
    const open = () => openGlobalShortcuts();
    window.addEventListener('open-drawer-shortcuts', open);
    return () => window.removeEventListener('open-drawer-shortcuts', open);
  }, []);

  return null;
}
