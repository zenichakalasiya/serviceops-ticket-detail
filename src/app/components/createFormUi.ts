import { useEffect, useState } from 'react';

/**
 * Three patterns for every create form, compared from the V1 | V2 | V3 pill beside the logo while a
 * create page is open (Zeni, 30 Oct 2026):
 *   V1 = the full page, every section on one scroll, help guide pinned right (sections as specced);
 *   V2 = full page, a vertical stepper on the left, ONE step at a time, the guide on the right;
 *   V3 = a side drawer: stepper across the top, the step's fields on the left, the guide on the right;
 *   V4 = ONE screen, essentials only — required fields up front, each group's optional ones behind
 *        "More options", groups with nothing required folded to "+ Add" chips (Mobbin: quick create);
 *   V5 = ONE screen, every group open, the guide on the right with Create and what is still
 *        required at its foot.
 * Every version shows the SAME single guide per form (CreateFormHelp) — never one per step.
 * V4 and V5 need NO click to move between parts — the stepped versions cost 2–4 per create (Zeni).
 * V2 and V3 show the MERGED steps in createFormSteps.ts (a section holding a lone field joins its
 * neighbour); V1 keeps every section as it is. Remembered per browser; opens on V3 (Zeni, 16 Nov 2026).
 * The guide can be HIDDEN in every version (useCreateGuideHidden): it folds to a slim rail in the same place,
 * and the rail's button brings it back. Remembered per browser.
 */
export type CreateFormUi = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
const KEY = 'createFormUi2';
const EVENT = 'create-form-ui';

export function readCreateFormUi(): CreateFormUi {
  try { const v = localStorage.getItem(KEY); return v === 'v2' ? v : 'v3'; /* only ids v2 (pill "V1") and v3 (pill "V2") are offered (17 Nov 2026): any other stored one opens v3 */ } catch { return 'v3'; }
}
export function setCreateFormUi(v: CreateFormUi) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}
export function useCreateFormUi(): CreateFormUi {
  const [v, setV] = useState(readCreateFormUi);
  useEffect(() => {
    const on = () => setV(readCreateFormUi());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}

/* The help guide, shown or hidden — one choice for every create form. */
const GUIDE_KEY = 'createFormGuide';
const GUIDE_EVENT = 'create-form-guide';
const readGuideHidden = () => { try { return localStorage.getItem(GUIDE_KEY) === 'hidden'; } catch { return false; } };
export function setCreateGuideHidden(hidden: boolean) {
  try { localStorage.setItem(GUIDE_KEY, hidden ? 'hidden' : 'shown'); } catch { /* private mode */ }
  window.dispatchEvent(new Event(GUIDE_EVENT));
}
export function useCreateGuideHidden(): boolean {
  const [v, setV] = useState(readGuideHidden);
  useEffect(() => {
    const on = () => setV(readGuideHidden());
    window.addEventListener(GUIDE_EVENT, on);
    return () => window.removeEventListener(GUIDE_EVENT, on);
  }, []);
  return v;
}

/* A create page that is NOT a createFormSpecs page (the Compliance Policy form) says it is open, so
   the header's V1–V5 switch shows for it too. On globalThis so a hot reload cannot split it. */
const OPEN_EVENT = 'create-form-extra-open';
const openStore: { id: string | null } = ((globalThis as any).__createFormExtraOpen ??= { id: null });
export function setExtraCreateOpen(id: string | null) {
  openStore.id = id;
  window.dispatchEvent(new Event(OPEN_EVENT));
}
export function useExtraCreateOpen(): string | null {
  const [v, setV] = useState(openStore.id);
  useEffect(() => {
    const on = () => setV(openStore.id);
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);
  return v;
}
