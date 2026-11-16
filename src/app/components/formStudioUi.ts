import { useEffect, useState } from 'react';

/**
 * Four builders for every admin form, picked from the "Builder V1 | V2 | V3 | V4" pill beside the logo
 * while an admin form page is open (renumbered 16 Nov 2026, Zeni):
 *   V1 = the OLD product builder (as on the .185 server): custom-field palette on the LEFT, the form
 *        on the right, a hover toolbar on each field, Edit opens a side panel (AdminFormBuilder);
 *   V2 = the NEW design: the form fills the left with plain sections (no boxes), the right panel is
 *        Custom fields (search, icon + name) until a field is clicked — then that field is lit, the
 *        rest dim, and the panel shows its settings. Build / Preview / Save draft / Publish sit beside
 *        the page heading;
 *   V3 = the "+" builder (was V1): fields are added where they will sit from an inline "+" menu, and
 *        the configuration panel on the right is always open;
 *   V4 = Jira-style (was V2): "Type / to add a field", a drop slot, and a Fields | Settings | Guide panel.
 * Remembered per browser; opens on V2. A new storage key, because the numbers changed meaning.
 */
export type FormStudioUi = 'v1' | 'v2' | 'v3' | 'v4';
const KEY = 'formBuilderUi';
/** The builders this build offers, first = the one it opens on. Version 1 of the form builder is the old
 *  builder alone; Version 2 offers V2 | V3 | V4 (Zeni, 16 Nov 2026). One builder = no pill. */
export const BUILDERS: FormStudioUi[] = ['v1'];
const EVENT = 'form-studio-ui';

export function readFormStudioUi(): FormStudioUi {
  try { const v = localStorage.getItem(KEY) as FormStudioUi | null; return v && BUILDERS.includes(v) ? v : BUILDERS[0]; } catch { return BUILDERS[0]; }
}
export function setFormStudioUi(v: FormStudioUi) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}
export function useFormStudioUi(): FormStudioUi {
  const [v, setV] = useState(readFormStudioUi);
  useEffect(() => {
    const on = () => setV(readFormStudioUi());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}
