import { useEffect, useState } from 'react';

/**
 * V1 / V2 of the Lifecycle Sync Warranty tab's vendor cards (Zeni, 19 Nov 2026), picked from the pill
 * beside the logo while on #/admin/lifecycle-sync (`LifecycleSyncUiSwitch` in Header).
 * V1 = cards with the "Warranty found" bar and "No setup needed"; V2 = one short row per vendor.
 * Opens on V2; the choice is remembered in this browser.
 */
export type LifecycleSyncUi = 'v1' | 'v2';
const KEY = 'lifecycleSyncUi';
const EVENT = 'lifecycle-sync-ui';

export function readLifecycleSyncUi(): LifecycleSyncUi {
  try { return localStorage.getItem(KEY) === 'v1' ? 'v1' : 'v2'; } catch { return 'v2'; }
}

export function setLifecycleSyncUi(v: LifecycleSyncUi) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useLifecycleSyncUi(): LifecycleSyncUi {
  const [v, setV] = useState(readLifecycleSyncUi);
  useEffect(() => {
    const on = () => setV(readLifecycleSyncUi());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}
