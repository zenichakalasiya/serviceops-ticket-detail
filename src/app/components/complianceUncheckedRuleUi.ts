import { useEffect, useState } from 'react';

/**
 * Technician › Compliance › Rules — what a rule's side drawer does when NO compliance audit has
 * run it on any endpoint yet (Zeni, 17 Nov 2026). Two versions to compare, picked from the pill
 * beside the logo while on #/compliance-rules (`ComplianceUncheckedRuleSwitch` in Header):
 *   V1 = the Endpoints tab is removed; the drawer opens on Summary.
 *   V2 = the Endpoints tab stays and shows an illustrated empty state.
 * Opens on V2; the choice is remembered in this browser.
 */
export type UncheckedRuleUi = 'v1' | 'v2';
const KEY = 'complianceUncheckedRuleUi';
const EVENT = 'compliance-unchecked-rule-ui';

export function readUncheckedRuleUi(): UncheckedRuleUi {
  try { return localStorage.getItem(KEY) === 'v1' ? 'v1' : 'v2'; } catch { return 'v2'; }
}

export function setUncheckedRuleUi(v: UncheckedRuleUi) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useUncheckedRuleUi(): UncheckedRuleUi {
  const [v, setV] = useState(readUncheckedRuleUi);
  useEffect(() => {
    const on = () => setV(readUncheckedRuleUi());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}
