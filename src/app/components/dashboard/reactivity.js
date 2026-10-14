/* The Dashboard module was written in Vue, where state is a mutable object and the screen follows
 * every write. Porting each of its ~60 components to immutable React state would rewrite the logic
 * as well as the markup, and the logic is the part that took months to get right.
 *
 * So this file gives React the two Vue primitives the code actually leans on:
 *   reactive(obj)  — a deep proxy; ANY write (set / delete / push…) schedules a re-render.
 *   computed(fn)   — `{ value }`, re-evaluated on read. Cheap: the data is small and in memory.
 * and one hook, useDashStore(), which subscribes a component to every change.
 *
 * ⚠️ Coarse on purpose: one change re-renders every subscribed component. At prototype scale that
 *    is invisible, and it removes a whole class of "the screen did not update" bugs.
 * ⚠️ Local component state that Vue held in `ref(obj)` and mutated in place must use
 *    `useReactive(obj)` below, not useState — useState never sees an in-place mutation. */
import { useRef, useSyncExternalStore } from 'react';

let version = 0;
let queued = false;
const subs = new Set();
const notify = () => {
  version++;
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; subs.forEach((f) => f()); });
};
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

const proxies = new WeakMap();
const raws = new WeakMap();
export const toRaw = (v) => (v && typeof v === 'object' && raws.has(v) ? raws.get(v) : v);
const proxiable = (v) => v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Set) && !(v instanceof Map) && !(typeof Node !== 'undefined' && v instanceof Node);

/** Deep reactive proxy. Writes through to the original object, so identity checks against the raw
 *  value still work after `toRaw`. Reads always hand back a proxy for nested objects. */
export function reactive(obj, onChange = notify) {
  if (!proxiable(obj)) return obj;
  if (raws.has(obj)) return obj;
  if (proxies.has(obj)) return proxies.get(obj);
  const p = new Proxy(obj, {
    get(t, k, r) {
      const v = Reflect.get(t, k, r);
      return typeof k === 'symbol' ? v : reactive(v, onChange);
    },
    set(t, k, v, r) {
      const prev = t[k];
      const ok = Reflect.set(t, k, toRaw(v), r);
      if (prev !== toRaw(v) || Array.isArray(t)) onChange();
      return ok;
    },
    deleteProperty(t, k) { const ok = Reflect.deleteProperty(t, k); onChange(); return ok; },
  });
  proxies.set(obj, p);
  raws.set(p, obj);
  return p;
}

/** Vue's computed(), minus caching — `{ value }` re-evaluated on every read. */
export const computed = (fn) => ({ get value() { return fn(); } });

/** Subscribe a component to the dashboard store. Call it at the top of any component that reads it. */
export function useDashStore() {
  useSyncExternalStore(subscribe, () => version, () => version);
}

/** A component-local reactive object (Vue's `reactive()` / `ref({...})` held in a component). Writes
 *  re-render the whole app subscription, which is what keeps a mutated-in-place object honest. */
export function useReactive(init) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = reactive(typeof init === 'function' ? init() : init);
  useDashStore();
  return ref.current;
}

/** Vue's ref(): `{ value }` that re-renders on write. Lets ported code keep `x.value = …`. */
export function useRefState(init) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = reactive({ value: typeof init === 'function' ? init() : init });
  useDashStore();
  return ref.current;
}
