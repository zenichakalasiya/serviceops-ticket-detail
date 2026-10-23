import { useSyncExternalStore } from 'react';

/* The workflows behind Admin › Automation › Workflow.
 *
 * ONE record shape feeds the listing, the Linear view and (phase 5) the Node view: the document is
 * the builder's own `{ triggers, flow }`, untouched, so both views read the same thing.
 *
 * Seeds are the source builder's own prebuilt use cases (USECASE_DOCS), loaded on demand: they live
 * in the 1.3 MB builder module, which must not ride in the main bundle just to fill a table.
 *
 * ⚠️ State sits on globalThis — Vite HMR can load this module twice, and two copies of a store is
 * how a list stops agreeing with the editor that just saved to it. */

export interface WorkflowDoc { triggers: any[]; flow: any[] }

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string;
  status: 'Published' | 'Draft';
  enabled: boolean;
  modifiedBy: string;
  modifiedAt: string; // ISO
  doc: WorkflowDoc;
}

const ME = 'Zeni Chakalasiya';

type State = { rows: WorkflowRecord[]; loaded: boolean; seq: number };
const g = globalThis as unknown as { __workflowStore?: { state: State; subs: Set<() => void> } };
const S = (g.__workflowStore ??= { state: { rows: [], loaded: false, seq: 100 }, subs: new Set() });

const set = (next: Partial<State>) => {
  S.state = { ...S.state, ...next };
  S.subs.forEach((f) => f());
};

/* Fixed dates, not `new Date()`, so the listing reads the same tomorrow. */
const SEED_DATES = ['2026-10-20T10:42:00', '2026-10-18T16:05:00', '2026-10-15T09:30:00', '2026-10-12T14:12:00', '2026-10-09T11:48:00', '2026-10-06T17:20:00', '2026-10-02T08:55:00'];
const SEED_BY = ['Zeni Chakalasiya', 'Pranjal Gupta', 'Ronak Patel', 'Zeni Chakalasiya', 'Aarav Mehta', 'Pranjal Gupta', 'Ronak Patel'];

let loading: Promise<void> | null = null;
export function loadWorkflows() {
  if (S.state.loaded) return Promise.resolve();
  return (loading ??= import('./linear/LinearBuilder').then((m: any) => {
    // usecase_4 is the source's own dev-only layout demo — not a workflow anyone would build.
    const ids: string[] = m.USECASE_IDS.filter((id: string) => id !== 'usecase_4' && m.USECASE_DOCS[id]);
    const rows = ids.map((id, i): WorkflowRecord => {
      const meta = m.USECASE_META[id] || {};
      return {
        id: `WF-${101 + i}`,
        name: String(meta.name || id).replace(/^Use Case \d+\s*[—-]\s*/, '').replace(/\s*\(Test cases\)\s*$/, ''),
        description: meta.desc || '',
        status: i % 3 === 2 ? 'Draft' : 'Published',
        enabled: i % 4 !== 3,
        modifiedBy: SEED_BY[i % SEED_BY.length],
        modifiedAt: SEED_DATES[i % SEED_DATES.length],
        doc: JSON.parse(JSON.stringify(m.USECASE_DOCS[id])),
      };
    });
    set({ rows: [...S.state.rows, ...rows], loaded: true, seq: 100 + rows.length });
  }));
}

export function useWorkflows() {
  return useSyncExternalStore(
    (f) => { S.subs.add(f); return () => S.subs.delete(f); },
    () => S.state,
  );
}

export const workflowStore = {
  get: (id: string) => S.state.rows.find((r) => r.id === id),
  /** A new, empty workflow — a Draft until it is published. */
  create(): WorkflowRecord {
    const seq = S.state.seq + 1;
    const rec: WorkflowRecord = {
      id: `WF-${seq}`, name: 'Untitled rule', description: '', status: 'Draft', enabled: true,
      modifiedBy: ME, modifiedAt: new Date().toISOString(), doc: { triggers: [], flow: [] },
    };
    set({ rows: [rec, ...S.state.rows], seq });
    return rec;
  },
  update(id: string, patch: Partial<WorkflowRecord>, touch = true) {
    set({ rows: S.state.rows.map((r) => (r.id === id ? { ...r, ...patch, ...(touch ? { modifiedBy: ME, modifiedAt: new Date().toISOString() } : {}) } : r)) });
  },
  duplicate(id: string) {
    const src = this.get(id);
    if (!src) return undefined;
    const seq = S.state.seq + 1;
    // A copy is not live on the original's merit.
    const rec: WorkflowRecord = { ...src, id: `WF-${seq}`, name: `${src.name} (copy)`, status: 'Draft', modifiedBy: ME, modifiedAt: new Date().toISOString(), doc: JSON.parse(JSON.stringify(src.doc)) };
    const at = S.state.rows.findIndex((r) => r.id === id);
    const rows = [...S.state.rows];
    rows.splice(at + 1, 0, rec);
    set({ rows, seq });
    return rec;
  },
  remove(id: string) { set({ rows: S.state.rows.filter((r) => r.id !== id) }); },
};

/* ------------------------------------------------------------- read-outs for the listing */

const EVENT_TAIL: Record<string, string> = { created: 'is created', changed: 'is updated', archived: 'is archived' };
const CADENCE: Record<string, string> = { once: 'Once', hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

/** The record module the workflow runs on, or null for a time-based one. */
export const workflowModule = (doc: WorkflowDoc): string | null => doc.triggers[0]?.vals?.module || null;

/** "When an Incident is created" / "Daily" / "No trigger yet". */
export function triggerLabel(doc: WorkflowDoc): string {
  const t = doc.triggers[0];
  if (!t) return 'No trigger yet';
  if (CADENCE[t.typeId]) return CADENCE[t.typeId];
  const mod = t.vals?.module;
  const tail = EVENT_TAIL[t.typeId] || 'changes';
  if (!mod) return `When a record ${tail}`;
  return `When ${/^[AEIOU]/i.test(mod) ? 'an' : 'a'} ${mod} ${tail}`;
}

/** How many steps the flow holds, counted through branches, merges and loops. */
export function stepCount(doc: WorkflowDoc): number {
  const walk = (nodes: any[] = []): number => nodes.reduce((n, x) => n + 1
    + walk(x.children)
    + (x.paths || []).reduce((k: number, p: any) => k + walk(p.children), 0)
    + walk(x.success?.children) + walk(x.otherwise?.children) + walk(x.timeout?.children), 0);
  return walk(doc.flow);
}
