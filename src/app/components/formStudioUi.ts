import { useEffect, useState } from 'react';

/**
 * Two builders for every admin form (Zeni, 2 Nov 2026), picked from the "Builder V1 | V2" pill beside
 * the logo while an admin form page is open:
 *   V1 = the form is the canvas; fields are added where they will sit from an inline "+" menu that
 *        explains each type, and the configuration panel on the right is always open (help on top);
 *   V2 = Jira-style: each section ends with "Type / to add a field" and a drop slot, field types are
 *        dragged from a Fields | Settings | Guide panel on the right.
 * Remembered per browser; opens on V1.
 */
export type FormStudioUi = 'v1' | 'v2';
const KEY = 'formStudioUi';
const EVENT = 'form-studio-ui';

export function readFormStudioUi(): FormStudioUi {
  try { return localStorage.getItem(KEY) === 'v2' ? 'v2' : 'v1'; } catch { return 'v1'; }
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
