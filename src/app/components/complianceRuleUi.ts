import { useEffect, useState } from 'react';

/**
 * V1 / V2 of the ADMIN rule detail panel (Zeni, 27 Oct 2026), picked from the pill beside the logo
 * while on Admin › Compliance (`ComplianceRuleUiSwitch` in Header). V1 = the tabbed panel
 * (Summary · Audit · Remediation · References · Controls); V2 = every section on one scrolling page.
 * Opens on V2; the choice is remembered in this browser. Technician-side rule panels stay V1.
 */
export type ComplianceRuleUi = 'v1' | 'v2';
const KEY = 'complianceRuleUi';
const EVENT = 'compliance-rule-ui';

export function readComplianceRuleUi(): ComplianceRuleUi {
  try { return localStorage.getItem(KEY) === 'v1' ? 'v1' : 'v2'; } catch { return 'v2'; }
}

export function setComplianceRuleUi(v: ComplianceRuleUi) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useComplianceRuleUi(): ComplianceRuleUi {
  const [v, setV] = useState(readComplianceRuleUi);
  useEffect(() => {
    const on = () => setV(readComplianceRuleUi());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}
