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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export type PauseUi = 'v2' | 'v4' | 'v5' | 'v6';
const ALL: PauseUi[] = ['v2', 'v4', 'v5', 'v6'];
const KEY = 'deployPauseUi';
const EVT = 'deploy-pause-ui';
/* A browser that last chose V1 or V3 (withdrawn) falls back to V2. */
const read = (): PauseUi => {
  try { const v = localStorage.getItem(KEY) as PauseUi; if (ALL.includes(v)) return v; } catch { /* private window */ }
  return 'v2';
};
/* V5 is FINAL (Zeni, 19 Nov 2026): the switch is hidden and every browser gets V5 whatever it stored.
   V2, V4 and V6 stay built — set this to null to bring the switch and the other three back. */
const FINAL: PauseUi | null = 'v5';

export function usePauseUi(): [PauseUi, (v: PauseUi) => void] {
  const [stored, setV] = useState<PauseUi>(read);
  const v = FINAL ?? stored;
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
/* How many installations the pause stopped. FIXED demo copy for now (Zeni, 19 Nov 2026) — not yet read
   off the run's installations. */
export const PAUSED_COUNT = { paused: 10, total: 12 };
const countText = `${PAUSED_COUNT.paused} of ${PAUSED_COUNT.total} installations paused`;

/* The narrow card (V4 / V6) shows the count two ways, compared on their own Line | Pill switch:
   Line = the count leads the card; Pill = "Paused 10/12" with the sentence on hover. */
export type CountUi = 'line' | 'pill';
const CKEY = 'deployPauseCountUi';
const CEVT = 'deploy-pause-count-ui';
const readCount = (): CountUi => { try { return localStorage.getItem(CKEY) === 'pill' ? 'pill' : 'line'; } catch { return 'line'; } };
export function useCountUi(): [CountUi, (v: CountUi) => void] {
  const [v, setV] = useState<CountUi>(readCount);
  useEffect(() => { const on = () => setV(readCount()); window.addEventListener(CEVT, on); return () => window.removeEventListener(CEVT, on); }, []);
  return [v, (next) => { try { localStorage.setItem(CKEY, next); } catch { /* ignore */ } window.dispatchEvent(new Event(CEVT)); }];
}

/** The comparison switch — Zeni picks one, then it goes. */
export function PauseUiSwitch() {
  const [v, set] = usePauseUi();
  const [c, setC] = useCountUi();
  if (FINAL) return null;
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 px-2">
      <span className="text-[11px] text-[#7B8FA5]">Paused banner</span>
      <div className="pill-track">
        {ALL.map((k) => (
          <button key={k} type="button" aria-pressed={v === k} title={LABELS[k]} onClick={() => set(k)}>{k.toUpperCase()}</button>
        ))}
      </div>
      {(v === 'v4' || v === 'v6') && (
        <div className="pill-track" title="How the card shows the paused count">
          <button type="button" aria-pressed={c === 'line'} title="The count leads the card" onClick={() => setC('line')}>Line</button>
          <button type="button" aria-pressed={c === 'pill'} title="Paused 10/12, the sentence on hover" onClick={() => setC('pill')}>Pill</button>
        </div>
      )}
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

export function ResumeButton({ onResume, compact }: { onResume: () => void; /** 28px, for the slim strip. */ compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onResume}
      className={(compact ? 'h-7 px-2.5 text-[12px] ' : 'h-8 px-3 text-[13px] ') + 'inline-flex flex-shrink-0 items-center gap-1.5 rounded bg-[#3D8BD0] font-medium text-white transition-colors hover:bg-[#2F7BC0]'}
    >
      <Play size={compact ? 11 : 13} fill="currentColor" strokeWidth={0} /> Resume
    </button>
  );
}

/** V2 / V5 — the wide strip: one line of words. */
export function PausedBanner({ info, onResume, onCount }: { info: PauseInfo; onResume: () => void; /** Opens the run's Deployment tab, where the paused installations are listed. */ onCount?: () => void }) {
  return (
    <div role="status" className="flex items-center gap-2.5 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] py-1.5 pl-3 pr-1.5">
      <PauseMark size={24} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">
        {onCount ? (
          /* A link: no underline at rest (Zeni, 19 Nov 2026); hover turns it blue and underlines it.
             A bare button does NOT inherit the line's size in this app (it was 16px), so it carries 14px. */
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button type="button" onClick={onCount}
                className="text-[14px] font-semibold text-[#364658] underline-offset-[3px] transition-colors hover:text-[#3D8BD0] hover:underline">
                {countText}
              </button>
            </TooltipTrigger>
            <TooltipContent>View installations in the Deployment tab</TooltipContent>
          </Tooltip>
        ) : <span className="font-semibold">{countText}</span>}
        <span className="text-[#7B8FA5]"> · by </span><span className="font-medium text-[#3D8BD0]">{info.by}</span>
        <span className="text-[#7B8FA5]"> · {info.at}</span>
      </span>
      <ResumeButton onResume={onResume} compact />
    </div>
  );
}

/** V4 / V6 — the narrow card for the right panel: the name and the time on two lines. */
/** The narrow card's short time ("Nov 17, 01:04 PM"); hovering it shows the full date at once. */
function TimeTip({ short, full }: { short: string; full: string }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dotted border-[#A5B4C4]">{short}</span>
      </TooltipTrigger>
      {/* Below: above it would cover the card's own count line. */}
      <TooltipContent side="bottom">Paused on {full}</TooltipContent>
    </Tooltip>
  );
}

export function PausedPanelCard({ info, onResume }: { info: PauseInfo; onResume: () => void }) {
  const [c] = useCountUi();
  /* "Tue, Nov 17, 2026 01:04 PM" → "Nov 17, 01:04 PM": the weekday and year cost a third of a narrow line. */
  const short = info.at.replace(/^\w{3}, /, '').replace(/, \d{4}/, ',');
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-3">
      <PauseMark size={28} />
      {c === 'line' ? (
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[12px] font-semibold text-[#364658]">{countText}</div>
          <div className="mt-1 truncate text-[11px] text-[#7B8FA5]">
            <span className="font-medium text-[#3D8BD0]">{info.by}</span> · <TimeTip short={short} full={info.at} />
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5 text-[12px] text-[#364658]">
            <span className="font-semibold">Paused</span>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="cursor-help rounded-full bg-[#FDE68A] px-1.5 py-px text-[11px] font-semibold tabular-nums text-[#92400E]">{PAUSED_COUNT.paused}/{PAUSED_COUNT.total}</span>
              </TooltipTrigger>
              <TooltipContent>{countText}</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-1 truncate text-[11px] text-[#7B8FA5]">
            by <span className="font-medium text-[#3D8BD0]">{info.by}</span> · <TimeTip short={short} full={info.at} />
          </div>
        </div>
      )}
      <ResumeButton onResume={onResume} />
    </div>
  );
}
