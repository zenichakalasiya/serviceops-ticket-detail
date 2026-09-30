import { useEffect, useSyncExternalStore } from 'react';

/* ── "Where am I" for the global Keyboard shortcuts panel ──────────────────────────────────────────
 *
 * Every surface that owns shortcuts ANNOUNCES itself while it is on screen — an open detail drawer,
 * a map canvas, the Support Portal builder — by pushing its module id here. The panel reads the
 * stack: the LAST one pushed is the most specific place you are, so it is the one the panel opens
 * focused on, and the page underneath comes after it.
 *
 * ⚠️ Kept in its own tiny module with NO imports from the UI, so any component can announce itself
 * without creating an import cycle with the panel or the registry.
 */
let stack: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(id: string) {
  stack = [...stack, id];
  emit();
  return () => {
    const i = stack.lastIndexOf(id);
    if (i >= 0) { stack = [...stack.slice(0, i), ...stack.slice(i + 1)]; emit(); }
  };
}

/** Announce a shortcut context while this component is mounted (pass null to announce nothing). */
export function useShortcutContext(id: string | null) {
  useEffect(() => (id ? push(id) : undefined), [id]);
}

/** The announced contexts, most specific first. */
export function useShortcutContexts(): string[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => stack,
  ).slice().reverse();
}

/** Open the global Keyboard shortcuts panel from anywhere. */
export const openGlobalShortcuts = () => window.dispatchEvent(new CustomEvent('open-global-shortcuts'));
