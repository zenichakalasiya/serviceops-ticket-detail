import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, ChevronUp } from 'lucide-react';
import { TourArt, type TourBeat } from './PortalTourArt';

/**
 * What the tour becomes once it has been read: a small card in the bottom-right corner holding the
 * whole editor in one looping picture, with the four beats as a transport you can scrub.
 *
 * ⚠️ IT REPLACES THE TOUR RATHER THAN ADDING A SECOND ONE. A spotlight tour is a thing you sit
 * through once — it dims the page, it blocks clicks, and its whole value is spent the moment you
 * have seen it. What somebody actually wants on day two is the same content with none of that:
 * visible while they work, ignorable, and re-readable in four seconds. So finishing the tour hands
 * over to this, and this is what the Help menu re-opens.
 *
 * ⚠️ THE LOOP HAS A TRANSPORT, which is what makes it a recap rather than an ornament. An animation
 * that cycles on its own is something you wait for; four labelled beats you can click are something
 * you use. Picking one PAUSES the cycle — you clicked it because you wanted to look at it, and a
 * picture that moves on four seconds later is answering somebody else's question.
 *
 * ⚠️ IT COLLAPSES TO A PILL rather than only closing. The corner of the canvas is real estate the
 * admin is working in, but a card that can only be dismissed forever makes "get this out of my way
 * for a minute" and "I am done with this" the same button.
 *
 * ⚠️ NO OVERLAY, NO BLOCKING. It is `fixed` in the corner and nothing else on screen changes, so
 * the builder stays entirely usable with it open — which is the point of it existing.
 */

const BEATS: { beat: TourBeat; label: string; line: string }[] = [
  { beat: 'rail', label: 'Rail', line: 'Widgets, Theme, Branding and Banners live on the right rail.' },
  { beat: 'panel', label: 'Widgets', line: 'Drag a widget onto the page, or click it to drop it in its own row.' },
  { beat: 'canvas', label: 'Edit', line: 'Select any block for its floating toolbar and its settings panel.' },
  { beat: 'publish', label: 'Publish', line: 'Flip light and dark, preview as a requester, then publish.' },
];

/** How long one beat holds before the loop moves on. */
const DWELL = 4200;

export function PortalTourDock({ onReplay, onClose }: { onReplay: () => void; onClose: () => void }) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [open, setOpen] = useState(true);
  /* Restarts the progress bar's CSS animation on every beat — a key change is the only way to
     replay a keyframe animation without a reflow hack. */
  const tick = useRef(0);

  useEffect(() => {
    if (!playing || !open) return;
    const t = setTimeout(() => {
      tick.current += 1;
      setAt((v) => (v + 1) % BEATS.length);
    }, DWELL);
    return () => clearTimeout(t);
  }, [at, playing, open]);

  const current = BEATS[at];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-portal-dock="collapsed"
        className="fixed bottom-5 right-5 z-[9000] inline-flex h-10 items-center gap-2 rounded-full bg-[#1F2937] pl-3.5 pr-4 text-[12.5px] font-medium text-white shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02]"
      >
        <ChevronUp size={15} className="text-white/70" />
        Editor basics
      </button>
    );
  }

  return (
    <div data-portal-dock className="fixed bottom-5 right-5 z-[9000] w-[300px] overflow-hidden rounded-2xl bg-[#1F2937] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]">
      {/* ⚠️ The two chrome buttons sit OVER the picture rather than in a header bar of their own. A
          300px card with a title row, a picture, copy, a transport and a footer is five bands of
          furniture around one idea. */}
      <div className="relative px-3 pt-3">
        <div className="h-[150px] overflow-hidden rounded-lg bg-[#F1F5F9]">
          <TourArt key={`${current.beat}-${tick.current}`} beat={current.beat} />
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <button
            onClick={() => setOpen(false)}
            title="Minimise"
            className="inline-flex size-6 items-center justify-center rounded bg-white/85 text-[#364658] transition-colors hover:bg-white"
          ><ChevronUp size={13} className="rotate-180" /></button>
          <button
            onClick={onClose}
            title="Close"
            className="inline-flex size-6 items-center justify-center rounded bg-white/85 text-[#364658] transition-colors hover:bg-white"
          ><X size={13} /></button>
        </div>
      </div>

      {/* ── the transport ────────────────────────────────────────────────────────────────────
          ⚠️ Four LABELLED chips, not four dots. A dot says "there are four of these"; a word says
          which one you are about to see, which is the only reason to press it. */}
      <div className="flex items-center gap-1 px-3 pt-2.5">
        <button
          onClick={() => setPlaying((p) => !p)}
          title={playing ? 'Pause' : 'Play'}
          className="inline-flex size-6 flex-shrink-0 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >{playing ? <Pause size={12} /> : <Play size={12} />}</button>
        {BEATS.map((b, n) => (
          <button
            key={b.beat}
            onClick={() => { setAt(n); setPlaying(false); tick.current += 1; }}
            className={`relative flex-1 overflow-hidden rounded px-1.5 py-1 text-[10.5px] font-medium transition-colors ${
              n === at ? 'bg-white/15 text-white' : 'text-white/45 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {b.label}
            {/* The bar under the live chip is the only thing saying how long it holds — without it a
                paused loop and a playing one look identical. */}
            {n === at && playing && (
              <span
                key={tick.current}
                className="pt-progress absolute bottom-0 left-0 h-[2px] bg-[#3D8BD0]"
                style={{ animationDuration: `${DWELL}ms` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ⚠️ A FIXED-HEIGHT line. The four sentences wrap to two lines or three, so without a floor
          the whole card — and everything under it — jumps every time the loop advances. */}
      <p className="min-h-[38px] px-3.5 pt-2.5 text-[12px] leading-[1.45] text-white/70">{current.line}</p>

      <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
        <span className="text-[11.5px] text-white/40">Portal editor basics</span>
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        ><RotateCcw size={12} /> Take the tour</button>
      </div>
    </div>
  );
}
