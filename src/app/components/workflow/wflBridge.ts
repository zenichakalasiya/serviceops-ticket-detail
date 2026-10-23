/* The seam between the Linear builder (ported from D:\Motadata\Workflow_Sidebar_scroll\linear)
 * and the editor page that hosts it.
 *
 * In the source the builder ran in an iframe and spoke to its host with postMessage. Here it is an
 * ordinary component, so the same messages travel as window CustomEvents — the builder's own
 * message handlers were kept and only their transport changed, which is what lets the port script
 * be re-run against a newer copy of the source.
 *
 *   host → builder   'wfl:toFrame'   { wf:'open', panel:'save'|'publish' } · { wf:'details', name, desc }
 *   builder → host   'wfl:toHost'    { wf:'ready' } · { wf:'state', name, desc, published } · { wf:'doc', doc }
 */

export const WFL_FRAME_EVENT = 'wfl:toFrame';
export const WFL_HOST_EVENT = 'wfl:toHost';

export type WflMessage = { wf: string; [k: string]: unknown };

export function wflToHost(msg: WflMessage) {
  window.dispatchEvent(new CustomEvent(WFL_HOST_EVENT, { detail: msg }));
}

export function wflToFrame(msg: WflMessage) {
  window.dispatchEvent(new CustomEvent(WFL_FRAME_EVENT, { detail: msg }));
}

/** Subscribe to the builder's messages. Returns the unsubscribe. */
export function onWflHost(fn: (msg: WflMessage) => void) {
  const h = (e: Event) => fn((e as CustomEvent).detail || {});
  window.addEventListener(WFL_HOST_EVENT, h);
  return () => window.removeEventListener(WFL_HOST_EVENT, h);
}

/* ⚠️ Every popover, tooltip and drag ghost the builder portals to the body has to land inside an
   element carrying `.wfl-scope`: all of its CSS variables and rules are scoped there so they cannot
   restyle the rest of the product (its --border / --accent / --muted collide with theme.css). */
let host: HTMLElement | null = null;
export function wflHost(): HTMLElement {
  if (host && document.body.contains(host)) return host;
  host = document.createElement('div');
  host.className = 'wfl-scope wfl-portal';
  host.setAttribute('data-theme', 'light');
  document.body.appendChild(host);
  return host;
}
