import { useEffect, useState } from 'react';

/* Three create layouts for a Deployment Policy, compared on a V1 | V2 | V3 pill beside the logo
 * (Zeni, 18 Nov 2026). All three edit the same DeploymentPolicy (deploymentPolicyData.ts).
 *
 *   V1  PMG's four steps, tightened: dropdowns and multi-selects in place of chip walls, one level of
 *       reveal, messages folded behind "Edit message". The Patch Tuesday calendar stays visible.
 *   V2  The user prompts are asked ONCE (a matrix: reboot before · app in use · reboot after), and the
 *       right panel reads the policy back in plain English instead of a guide.
 *   V3  Start from a preset; every section is a summary row you open to edit. */

export type DeployPolicyUi = 'v1' | 'v2' | 'v3';
const KEY = 'deployPolicyUi';
const EVT = 'deploy-policy-ui';

export function readDeployPolicyUi(): DeployPolicyUi {
  try { const v = localStorage.getItem(KEY); if (v === 'v1' || v === 'v2' || v === 'v3') return v; } catch { /* private window */ }
  return 'v1';
}
export function setDeployPolicyUi(v: DeployPolicyUi) {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}
export function useDeployPolicyUi(): DeployPolicyUi {
  const [v, setV] = useState(readDeployPolicyUi);
  useEffect(() => {
    const on = () => setV(readDeployPolicyUi());
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return v;
}

export const DEPLOY_POLICY_UI_TIPS: Record<DeployPolicyUi, string> = {
  v1: 'Four steps, simplified fields, help guide on the right',
  v2: 'User prompts asked once, live summary on the right',
  v3: 'Start from a preset, edit summary rows',
};
