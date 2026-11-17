/* Pause / resume for a patch deployment RUN — ONE store, read by the listing's Status cell, the
   detail page's header, its "paused" banner and its Audit Trail, so none of them can disagree.

   A pause remembers the status the run was in (`prev`), because Resume has to put it back exactly
   there: a run paused while Ready to Deploy is not In Progress when it resumes.

   State sits on globalThis so Vite HMR serving this module twice cannot split it in two (the same
   reason the compliance policy store does it). */
import { useSyncExternalStore } from 'react';
import { CURRENT_USER } from './technicianRoster';

export interface PauseInfo { by: string; at: string; prev: string }
export interface PauseEvent { action: 'Deployment Paused' | 'Deployment Resumed'; by: string; at: string; from: string; to: string }

/** Only a run that is going out, or about to, can be paused. */
export const PAUSABLE = ['In Progress', 'Ready to Deploy'];
export const pauseBlockedReason = (status: string) =>
  PAUSABLE.includes(status) ? null : `A ${status.toLowerCase()} deployment can't be paused — only one that is Ready to Deploy or In Progress.`;

/** 'Tue, Nov 17, 2026 01:04 PM' — the format every date on the deployment page uses. */
export const stampNow = (d = new Date()) => {
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${wd}, ${md} ${t}`;
};

interface State { paused: Record<string, PauseInfo>; events: Record<string, PauseEvent[]> }
const g = globalThis as any;
const S: { state: State; subs: Set<() => void> } = g.__deploymentPauseStore ??= {
  /* One run starts paused so the listing and the banner can be seen without pausing anything first. */
  state: {
    paused: { 'PDR-1431': { by: 'Amit Verma', at: 'Tue, Nov 17, 2026 01:04 PM', prev: 'In Progress' } },
    events: { 'PDR-1431': [{ action: 'Deployment Paused', by: 'Amit Verma', at: 'Tue, Nov 17, 2026 01:04 PM', from: 'In Progress', to: 'Paused' }] },
  },
  subs: new Set(),
};
const emit = () => S.subs.forEach((f) => f());
const subscribe = (f: () => void) => { S.subs.add(f); return () => S.subs.delete(f); };

export function pauseDeployment(id: string, prev: string) {
  if (S.state.paused[id]) return;
  const info = { by: CURRENT_USER, at: stampNow(), prev };
  S.state = {
    paused: { ...S.state.paused, [id]: info },
    events: { ...S.state.events, [id]: [{ action: 'Deployment Paused', by: info.by, at: info.at, from: prev, to: 'Paused' }, ...(S.state.events[id] ?? [])] },
  };
  emit();
}

export function resumeDeployment(id: string) {
  const info = S.state.paused[id];
  if (!info) return;
  const { [id]: _gone, ...rest } = S.state.paused;
  S.state = {
    paused: rest,
    events: { ...S.state.events, [id]: [{ action: 'Deployment Resumed', by: CURRENT_USER, at: stampNow(), from: 'Paused', to: info.prev }, ...(S.state.events[id] ?? [])] },
  };
  emit();
}

export const usePauseState = () => useSyncExternalStore(subscribe, () => S.state);
export const usePause = (id?: string) => {
  const s = usePauseState();
  return id ? s.paused[id] : undefined;
};
