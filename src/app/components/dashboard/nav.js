/* vue-router, as far as the Dashboard module used it. Its paths ('/dashboard/<id>', '/dashboards')
 * ARE this product's hash routes (routes.ts), so push() is a hash write and App's hashchange listener
 * does the rest. ⚠️ Prototype-only paths ('/archive', '/ai', '/m/…') have no route here — push() sends
 * them to the Manage dashboards listing instead of leaving the hash on a page that does not exist. */
import { useSyncExternalStore } from 'react';

const KNOWN = /^\/(dashboard\/[^/]+|dashboards)$/;
export const router = {
  push(path) {
    const p = KNOWN.test(path) ? path : path === '/archive' ? '/dashboards' : '/dashboards';
    if (window.location.hash !== '#' + p) window.location.hash = '#' + p;
  },
  replace(path) { window.history.replaceState(null, '', '#' + path); window.dispatchEvent(new HashChangeEvent('hashchange')); },
};

const sub = (f) => { window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); };
const read = () => window.location.hash;
/** `{ params: { id }, path }` — re-renders when the hash changes. */
export function useDashRoute() {
  const hash = useSyncExternalStore(sub, read, read);
  const parts = hash.replace(/^#\/?/, '').split('/');
  return { path: '/' + parts.join('/'), name: parts[0] === 'dashboards' ? 'manage' : 'dashboard', params: { id: parts[0] === 'dashboard' ? parts[1] : undefined } };
}
