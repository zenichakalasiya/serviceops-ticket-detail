import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, RotateCcw, CirclePlay, Maximize2, Minimize2 } from 'lucide-react';

/** The dock's glyph — on its header and on the rail button it parks into, so the two read as one thing. */
export const DockGlyph = CirclePlay;
import { TourScene, SCENE_FRAMES, TOUR_CHAPTERS, sceneStart, sceneEnd } from './PortalTourScenes';

/**
 * What the tour becomes once it has been read: a card in the bottom-right corner that plays how the
 * editor works, one illustrated scene per chapter — the shape of the Miro "what's new" carousel Zeni
 * shared: a picture that moves, a title and a line, dots for where you are, and Previous /
 * Next: ‹name›.
 *
 * ⚠️ IT AUTO-PLAYS UNTIL YOU TAKE OVER. On its own it runs chapter to chapter, so somebody glancing at
 * it sees the whole story. The moment you press Previous, Next or a dot you are DRIVING: the chapter
 * you chose loops, like a GIF, until you move on. A picture that walks off to the next chapter while
 * you are still looking at this one is answering somebody else's question — and it is what made the
 * previous version feel slow, because you could only ever wait for it.
 *
 * ⚠️ "Next" NAMES where it goes ("Next: Style"), as the reference does. A bare "Next" asks for trust; a
 * named one tells you whether you want to go there.
 *
 * ⚠️ ONE CLOCK drives the frames: a single rAF loop accumulates elapsed time and advances from it, so
 * pausing (by minimising) and resuming cannot desync anything.
 *
 * ⚠️ The SCENE does not remount between frames of one chapter — that is what lets CSS transitions
 * carry the cursor, the ghost and the resized card. It DOES remount between chapters, deliberately:
 * each chapter is its own picture. The cursor sits outside the scene, so it glides across that seam.
 *
 * ⚠️ CLOSING PARKS IT IN THE RIGHT RAIL rather than dismissing it: "out of my way for a minute" is
 * not "I am done with this", and the rail is where the builder's other places already live. It
 * replaced a pill in the canvas's bottom-right corner, which sat over the page being built.
 */

export function PortalTourDock({ onClose }: { onReplay?: () => void; onClose: () => void }) {
  const [at, setAt] = useState(0);
  /* Always open while mounted — closing unmounts it and parks it in the rail (see the header row). */
  const open = true;
  /* Whether the person has taken over. Until they do, the story advances on its own. */
  const [driven, setDriven] = useState(false);
  const elapsed = useRef(0);
  /* ⚠️ FULL SCREEN (Zeni, 29 Sep 2026): the same card, large, in the middle of the screen over a dimmed
     page — the scene is an SVG on a 320 × 180 viewBox, so it scales without redrawing anything. Esc or
     the shrink button brings it back to the corner. */
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setBig(false); } };
    window.addEventListener('keydown', on, true);
    return () => window.removeEventListener('keydown', on, true);
  }, [big]);

  const frame = SCENE_FRAMES[at];
  const ch = frame.ch;
  const last = TOUR_CHAPTERS.length - 1;
  const chapter = TOUR_CHAPTERS[ch];

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - prev;
      prev = now;
      if (elapsed.current >= frame.ms) {
        elapsed.current = 0;
        if (at < sceneEnd(ch)) { setAt(at + 1); return; }
        /* End of a chapter: roll on while nobody is driving; loop this one once somebody is. */
        setAt(driven ? sceneStart(ch) : sceneStart(ch === last ? 0 : ch + 1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [at, open, driven]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (c: number) => {
    elapsed.current = 0;
    setDriven(true);
    setAt(sceneStart(Math.max(0, Math.min(last, c))));
  };

  const card = (
    <div
      data-portal-dock
      onClick={(e) => e.stopPropagation()}
      className={`overflow-hidden rounded-2xl bg-[#1F2937] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] ${
        /* ⚠️ `right-[92px]`, clear of the 72px right rail: the rail's Basics button lives at its foot,
           and a card over it could not be closed by pressing the button that opened it. */
        big ? 'w-[min(960px,calc(100vw-64px))]' : 'fixed bottom-5 right-[92px] z-[9000] w-[360px]'
      }`}
    >
      {/* ⚠️ The controls sit in a HEADER ROW, not over the picture — a scene is composed edge to edge,
          and a button floating on it covers whatever that scene put in its corner. */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <span className="flex flex-1 items-center gap-1.5 text-[12px] font-medium text-white/55"><DockGlyph size={14} />Editor basics</span>
        {/* ⚠️ ONE way to put it away (Zeni, 28 Sep 2026). Closing parks it at the foot of the right
            rail, in this card's own colour and glyph, and pressing that brings it back. The old
            Minimise pill was a second "away" state in a second place — the bottom-right corner of
            the canvas, over the page being built — so it went. */}
        <button
          onClick={() => setBig((v) => !v)}
          title={big ? 'Exit full screen' : 'Full screen'}
          aria-label={big ? 'Exit full screen' : 'Full screen'}
          className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >{big ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button>
        <button onClick={onClose} title="Close — it waits at the bottom of the right rail" className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="px-3">
        <div className="aspect-[320/180] overflow-hidden rounded-xl">
          <TourScene frame={frame} />
        </div>
      </div>

      {/* ── the carousel: dots, words, and the two buttons ─────────────────────────────────── */}
      <div className="flex justify-center gap-1.5 pt-3">
        {TOUR_CHAPTERS.map((c, n) => (
          <button
            key={c.name}
            onClick={() => go(n)}
            aria-label={`Go to ${c.name}`}
            className={`h-1.5 rounded-full transition-all ${n === ch ? 'w-4 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/55'}`}
          />
        ))}
      </div>

      <div className="px-4 pt-2.5">
        <h3 className="text-[15px] font-semibold leading-tight text-white">{chapter.title}</h3>
        {/* ⚠️ A floor for two lines, so the buttons under it never jump between chapters. */}
        <p className="mt-1 min-h-[38px] text-[12.5px] leading-[1.5] text-white/70">{chapter.desc}</p>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
        <button
          onClick={() => go(ch - 1)}
          disabled={ch === 0}
          className="inline-flex h-8 items-center gap-1 rounded border border-white/20 px-3 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
        ><ChevronLeft size={14} /> Previous</button>
        {ch < last ? (
          <button
            onClick={() => go(ch + 1)}
            className="inline-flex h-8 items-center gap-1 rounded bg-[#3D8BD0] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2D6CA0]"
          >Next: {TOUR_CHAPTERS[ch + 1].name} <ChevronRight size={14} /></button>
        ) : (
          <button
            onClick={() => go(0)}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2D6CA0]"
          ><RotateCcw size={13} /> Watch again</button>
        )}
      </div>
    </div>
  );
  return big ? (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/55 p-8" onClick={() => setBig(false)}>{card}</div>
  ) : card;
}
