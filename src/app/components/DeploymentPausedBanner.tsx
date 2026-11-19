/* The "this deployment is paused" notice on a Patch Deployment's detail page, in the four
   placements Zeni is comparing (switch in the drawer's top bar). The names are kept from the
   first round so they still match what was reviewed — V1 and V3 were dropped on 18 Nov 2026.

   V2  Above the tabs        — a strip in the left column, above the tab strip. Every tab sees it.
   V4  Top of the right panel — a card above "Patch Deployment Properties". Every tab sees it.
   V5  Overview, first        — a strip as the FIRST thing in the Overview tab. Only on Overview.
   V6  Under the panel search — a card inside the properties header, under "Search fields…",
                                pinned there while the fields scroll.

   None of them change the open tab, its filters or its scroll. */
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { PauseInfo } from './deploymentPauseStore';

export type PauseUi = 'v2' | 'v4' | 'v5' | 'v6';
const ALL: PauseUi[] = ['v2', 'v4', 'v5', 'v6'];
const KEY = 'deployPauseUi';
const EVT = 'deploy-pause-ui';
/* A browser that last chose V1 or V3 (withdrawn) falls back to V2. */
const read = (): PauseUi => {
  try { const v = localStorage.getItem(KEY) as PauseUi; if (ALL.includes(v)) return v; } catch { /* private window */ }
  return 'v2';
};
export function usePauseUi(): [PauseUi, (v: PauseUi) => void] {
  const [v, setV] = useState<PauseUi>(read);
  useEffect(() => {
    const on = () => setV(read());
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const set = (next: PauseUi) => {
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
  };
  return [v, set];
}

const LABELS: Record<PauseUi, string> = {
  v2: 'Above the tabs',
  v4: 'Top of the right panel',
  v5: 'First thing in the Overview tab',
  v6: 'Under the search in Patch Deployment Properties',
};
/** The comparison switch — Zeni picks one, then it goes. */
export function PauseUiSwitch() {
  const [v, set] = usePauseUi();
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 px-2">
      <span className="text-[11px] text-[#7B8FA5]">Paused banner</span>
      <div className="pill-track">
        {ALL.map((k) => (
          <button key={k} type="button" aria-pressed={v === k} title={LABELS[k]} onClick={() => set(k)}>{k.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

/** The amber pause mark, shared by the banner and the card. */
export function PauseMark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white" style={{ width: size, height: size }}>
      <Pause size={Math.round(size * 0.44)} fill="currentColor" strokeWidth={0} />
    </span>
  );
}

export function ResumeButton({ onResume }: { onResume: () => void }) {
  return (
    <button
      type="button"
      onClick={onResume}
      className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7BC0]"
    >
      <Play size={13} fill="currentColor" strokeWidth={0} /> Resume
    </button>
  );
}

/** V2 / V5 — the wide strip: one line of words. */
export function PausedBanner({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-2.5">
      <PauseMark />
      <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">
        <span className="font-semibold">Paused</span> by <span className="font-medium text-[#3D8BD0]">{info.by}</span>
        <span className="text-[#7B8FA5]"> · {info.at}</span>
      </span>
      <ResumeButton onResume={onResume} />
    </div>
  );
}

/** V4 / V6 — the narrow card for the right panel: the name and the time on two lines. */
export function PausedPanelCard({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-3">
      <PauseMark size={28} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[12px] text-[#364658]">
          <span className="font-semibold">Paused</span> by <span className="font-medium text-[#3D8BD0]">{info.by}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-[#7B8FA5]">{info.at}</div>
      </div>
      <ResumeButton onResume={onResume} />
    </div>
  );
}
