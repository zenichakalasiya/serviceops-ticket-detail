import { useSyncExternalStore } from 'react';

/* The module create pages' shared state.
 *
 * Two jobs: which create page is open (one at a time, mounted once by App through
 * ModuleCreatePageHost), and the records created this session, keyed by the LISTING page they
 * belong to. A listing reads its own key with `useCreatedRecords` and puts those rows first.
 * Nothing here imports a module's data, so any listing can import it without a cycle.
 *
 * State sits on globalThis — Vite HMR can serve a module twice, and two copies of this store
 * made Create stop opening the form once already (see the Compliance Policy store). */

/** A create page to open: the spec to render and the listing the record lands in. */
export interface CreateTarget {
  /** Spec id in createFormSpecs (e.g. 'asset'). */
  spec: string;
  /** The listing page the new record belongs to (e.g. 'software-assets'). */
  target: string;
  /** Values the form opens with, e.g. the asset kind the listing you came from implies. */
  preset?: Record<string, unknown>;
  /** The listing's own id format when it differs from the spec's (e.g. SWAST-##### for software). */
  idOf?: (n: number) => string;
  /** Where that listing's counter starts. */
  seqStart?: number;
}

/** One record created this session. `values` holds the form's own keys (see createFormSpecs). */
export interface CreatedRecord {
  id: string;
  target: string;
  values: Record<string, unknown>;
  /** Which button saved it: 'primary' (Create / Publish) or 'secondary' (Save as Draft). */
  via: 'primary' | 'secondary';
  createdAt: Date;
}

interface StoreState {
  open: CreateTarget | null;
  created: Record<string, CreatedRecord[]>;
  seq: Record<string, number>;
  subs: Set<() => void>;
}

const G = globalThis as unknown as { __moduleCreateStore?: StoreState };
const S: StoreState = G.__moduleCreateStore ?? (G.__moduleCreateStore = { open: null, created: {}, seq: {}, subs: new Set() });

const emit = () => S.subs.forEach((f) => f());
const subscribe = (f: () => void) => { S.subs.add(f); return () => { S.subs.delete(f); }; };

export function openCreatePage(t: CreateTarget | null) {
  S.open = t;
  emit();
}

export function useOpenCreatePage(): CreateTarget | null {
  return useSyncExternalStore(subscribe, () => S.open);
}

const EMPTY: CreatedRecord[] = [];

/** Records created this session for one listing, newest first. Stable between changes. */
export function useCreatedRecords(target: string): CreatedRecord[] {
  return useSyncExternalStore(subscribe, () => S.created[target] ?? EMPTY);
}

export function createdRecord(target: string, id: string): CreatedRecord | undefined {
  return (S.created[target] ?? EMPTY).find((r) => r.id === id);
}

/** Saves a record and returns it. `idOf(n)` builds the id from a per-listing counter that
 *  starts above the listing's own mock ids, so a new record never collides with a seeded one. */
export function addCreatedRecord(target: string, values: Record<string, unknown>, via: CreatedRecord['via'], idOf: (n: number) => string, seqStart: number): CreatedRecord {
  const n = (S.seq[target] ?? seqStart) + 1;
  S.seq[target] = n;
  const rec: CreatedRecord = { id: idOf(n), target, values, via, createdAt: new Date() };
  S.created = { ...S.created, [target]: [rec, ...(S.created[target] ?? EMPTY)] };
  emit();
  return rec;
}

/* Small readers for a listing's mapper — the form stores strings, string arrays and booleans. */
export const str = (v: unknown, fallback = ''): string => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
export const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
/** A form date ("2026-11-04" or "2026-11-04T09:30") as a Date, or null. */
export const dateOf = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v.length === 10 ? `${v}T00:00` : v);
  return Number.isNaN(d.getTime()) ? null : d;
};
/** A form date as DD/MM/YYYY — the shape most module mocks store dates in. */
export const dmyOf = (v: unknown): string | null => {
  const d = dateOf(v);
  return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : null;
};
/** A form date-time as the deployment listings print it: "Wed, Nov 04, 2026 09:30 AM". */
export const stampOf = (v: unknown): string | null => {
  const d = dateOf(v);
  if (!d) return null;
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${mon} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} ${t}`;
};
/** Initials for an avatar from a display name. */
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
