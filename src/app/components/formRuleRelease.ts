import { useEffect, useState } from 'react';

/**
 * V1 / V2 of the Request Form Management screens (Zeni, 26 Oct 2026), picked from the pill beside the
 * logo (`FormRuleReleaseSwitch` in Header). V1 = as it was; V2 =
 *  - the Form Rules listing has no live conflict tags; a "Check conflicts" CTA shortlists the rules that
 *    have conflicts and tags them (the backend cannot measure conflicts on load);
 *  - the guide video opens at the screen's bottom right, draws the builder beside a Help guide skeleton;
 *    the Help guide opens with a Watch video card and shows no "All clear" card.
 * Opens on V2; the choice is remembered in this browser.
 */
export type FormRuleRelease = 'v1' | 'v2';
export const FORM_RULE_RELEASE_KEY = 'formRuleRelease';
const EVENT = 'form-rule-release';

export function readRelease(): FormRuleRelease {
  try { return localStorage.getItem(FORM_RULE_RELEASE_KEY) === 'v1' ? 'v1' : 'v2'; } catch { return 'v2'; }
}

export function setRelease(v: FormRuleRelease) {
  try { localStorage.setItem(FORM_RULE_RELEASE_KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useFormRuleRelease(): FormRuleRelease {
  const [v, setV] = useState(readRelease);
  useEffect(() => {
    const on = () => setV(readRelease());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}
