/* The "this deployment is paused" notice on a Patch Deployment's detail page, in the four
   placements Zeni is comparing (switch in the drawer's top bar):

   V1  Under the header — one full-width strip between the header and everything below it.
   V2  Above the tabs   — in the left column only, so the right panel keeps its full height.
   V3  Floating bar     — a compact bar over the bottom of the content; nothing moves.
   V4  Right panel      — a band at the top of the properties panel, level with the tabs.

   All four sit OUTSIDE the tab content, so pausing never changes the open tab, its filters or
   its scroll. */
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { PauseInfo } from './deploymentPauseStore';

export type PauseUi = 'v1' | 'v2' | 'v3' | 'v4';
const KEY = 'deployPauseUi';
const EVT = 'deploy-pause-ui';
const read = (): PauseUi => {
  try { const v = localStorage.getItem(KEY); if (v === 'v1' || v === 'v2' || v === 'v3' || v === 'v4') return v; } catch { /* private window */ }
  return 'v1';
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
  v1: 'Under the header', v2: 'Above the tabs', v3: 'Floating bar', v4: 'Right panel, level with the tabs',
};
/** The comparison switch — Zeni picks one, then it goes. */
export function PauseUiSwitch() {
  const [v, set] = usePauseUi();
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 px-2">
      <span className="text-[11px] text-[#7B8FA5]">Paused banner</span>
      <div className="pill-track">
        {(Object.keys(LABELS) as PauseUi[]).map((k) => (
          <button key={k} type="button" aria-pressed={v === k} title={LABELS[k]} onClick={() => set(k)}>{k.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

/** The amber pause mark, shared by the banner, the header chip and the status line. */
export function PauseMark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white" style={{ width: size, height: size }}>
      <Pause size={Math.round(size * 0.44)} fill="currentColor" strokeWidth={0} />
    </span>
  );
}

/** `pill` — fully rounded, for the floating bar, whose own ends are round. */
export function ResumeButton({ onResume, pill = false }: { onResume: () => void; pill?: boolean }) {
  return (
    <button
      type="button"
      onClick={onResume}
      className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 ${pill ? 'rounded-full pl-3 pr-3.5' : 'rounded px-3'} bg-[#3D8BD0] text-[13px] font-medium text-white transition-colors hover:bg-[#2F7BC0]`}
    >
      <Play size={13} fill="currentColor" strokeWidth={0} /> Resume
    </button>
  );
}

const Words = ({ info }: { info: PauseInfo }) => (
  <span className="min-w-0 truncate text-[13px] text-[#364658]">
    <span className="font-semibold">Paused</span> by <span className="font-medium text-[#3D8BD0]">{info.by}</span>
    <span className="text-[#7B8FA5]"> · {info.at}</span>
  </span>
);

/** V1 / V2 — the strip. */
export function PausedBanner({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-2.5">
      <PauseMark />
      <div className="flex min-w-0 flex-1"><Words info={info} /></div>
      <ResumeButton onResume={onResume} />
    </div>
  );
}

/** V3 — the floating bar, centred over the bottom of the content. */
export function PausedFloatingBar({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 bottom-5 z-40 flex justify-center px-6">
      <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-[#FCD34D] bg-[#FFFBEB] py-1.5 pl-1.5 pr-1.5 shadow-[0_8px_24px_rgba(16,24,40,0.14)]">
        <PauseMark size={28} />
        <Words info={info} />
        <span className="ml-2"><ResumeButton onResume={onResume} pill /></span>
      </div>
    </div>
  );
}

/** V4 — a band at the top of the right panel, the same height as the tab strip beside it, so
    the two read as one row: tabs on the left, the run's paused state on the right. The panel is
    narrow, so the name and the time take two lines. */
export function PausedPanelBand({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  /* A banner, not a band: inset by the panel's own 16px on the sides with room above, so it
     reads as a card with breathing space rather than a strip glued to the panel's edges. */
  return (
    <div className="flex-shrink-0 px-4 pt-3">
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
    </div>
  );
}
