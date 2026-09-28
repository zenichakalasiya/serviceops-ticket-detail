import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, ChevronUp } from 'lucide-react';
import { TourStory, STORY, STORY_CHAPTERS, chapterStart, chapterMs } from './PortalTourArt';

/**
 * What the tour becomes once it has been read: a card in the bottom-right corner that PLAYS the
 * editor — a widget dragged onto a blank page, selected, arranged, styled, and published — as a
 * short story you can scrub by chapter.
 *
 * ⚠️ THE SPOTLIGHT AND THE DOCK DO DIFFERENT JOBS, so they show different things. The four spotlight
 * cards point at WHERE things are on this screen; the dock shows what doing something LOOKS LIKE,
 * which a spotlight cannot, because it can only light a region that already exists. So the dock is
 * not the four cards again at a smaller size — it is the story of building a page, start to finish.
 *
 * ⚠️ ONE CLOCK drives the frame advance AND the progress bar. They used to be a timeout and a CSS
 * animation that happened to share a duration, which drift the moment somebody pauses: the timeout
 * restarts its frame from zero while the CSS bar resumes where it stopped. Here a single rAF loop
 * accumulates elapsed time, advances the frame from it, and writes the bar's width from it — so the
 * bar cannot be anywhere the picture is not. The bar is written through a REF, never state: re-
 * rendering the dock sixty times a second to move one bar would redraw the whole story each time.
 *
 * ⚠️ A CHAPTER CHIP PLAYS THAT CHAPTER AND HOLDS AT ITS END. Chapters are several frames long, so
 * "jump there and pause" would freeze on the first frame of the thing you asked to see — the drag
 * without the drop. Playing it through and stopping at its last frame answers "show me that part"
 * without rolling on into the next one while you are still looking. Play resumes from there.
 *
 * ⚠️ The STORY does not remount between frames — that is what lets CSS transitions carry the ghost,
 * the pointer and the resized card from one frame's position to the next. Keying it by frame would
 * rebuild every node and every move would become a cut.
 *
 * ⚠️ IT COLLAPSES TO A PILL rather than only closing: the corner of the canvas is space the admin is
 * working in, but a card that can only be dismissed forever makes "out of my way for a minute" and
 * "I am done with this" the same button. NO OVERLAY, NO BLOCKING — the builder stays usable under it.
 */

export function PortalTourDock({ onReplay, onClose }: { onReplay: () => void; onClose: () => void }) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [open, setOpen] = useState(true);
  /* The chapter a chip asked for — play it, then hold. Null while the story is simply running. */
  const [holdAfter, setHoldAfter] = useState<number | null>(null);
  const elapsed = useRef(0);
  const barRef = useRef<HTMLSpanElement>(null);

  const frame = STORY[at];
  const ch = frame.ch;

  /* How far through the CURRENT CHAPTER we are — frames already passed in it, plus this one's time. */
  const paintBar = () => {
    const start = chapterStart(ch);
    let done = elapsed.current;
    for (let k = start; k < at; k++) done += STORY[k].ms;
    if (barRef.current) barRef.current.style.width = `${Math.min(100, (done / chapterMs(ch)) * 100)}%`;
  };

  useEffect(() => {
    paintBar();
    if (!playing || !open) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= frame.ms) {
        const next = at + 1;
        const endsChapter = next >= STORY.length || STORY[next].ch !== ch;
        /* A chip asked for this chapter only: stop on its last frame instead of rolling on. */
        if (holdAfter === ch && endsChapter) {
          elapsed.current = frame.ms;
          paintBar();
          setPlaying(false);
          setHoldAfter(null);
          return;
        }
        elapsed.current = 0;
        setAt(next % STORY.length);
        return;
      }
      paintBar();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [at, playing, open, holdAfter]); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = (c: number) => {
    elapsed.current = 0;
    setAt(chapterStart(c));
    setHoldAfter(c);
    setPlaying(true);
  };

  const togglePlay = () => {
    /* Play from a held last frame starts the NEXT chapter rather than re-holding on the same one. */
    if (!playing && elapsed.current >= frame.ms) {
      elapsed.current = 0;
      setAt((at + 1) % STORY.length);
    }
    setHoldAfter(null);
    setPlaying((p) => !p);
  };

  const restart = () => {
    elapsed.current = 0;
    setHoldAfter(null);
    setAt(0);
    setPlaying(true);
  };

  if (!open) {
    return (
      <button
        data-portal-dock="collapsed"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[9000] inline-flex h-10 items-center gap-2 rounded-full bg-[#1F2937] pl-3.5 pr-4 text-[12.5px] font-medium text-white shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02]"
      >
        <ChevronUp size={15} className="text-white/70" />
        Editor basics
      </button>
    );
  }

  return (
    <div data-portal-dock className="fixed bottom-5 right-5 z-[9000] w-[340px] overflow-hidden rounded-2xl bg-[#1F2937] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]">
      {/* ⚠️ The controls sit in a HEADER ROW, not over the picture. They used to float on its top-right
          corner, which is exactly where the miniature's Publish button is — so on the last frame of the
          story, the one the whole thing builds towards, the controls covered the button, the pointer and
          the tick. A thin title row costs 28px; hiding the payoff costs the story. */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <span className="flex-1 text-[12px] font-medium text-white/55">Editor basics</span>
        <button onClick={() => setOpen(false)} title="Minimise" className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <ChevronUp size={14} className="rotate-180" />
        </button>
        <button onClick={onClose} title="Close" className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div className="px-3">
        <div className="aspect-[288/160] overflow-hidden rounded-lg bg-[#F1F5F9]">
          <TourStory frame={frame} />
        </div>
      </div>

      {/* ⚠️ A FIXED-HEIGHT caption. The narration is one or two lines depending on the frame, and
          without a floor the whole card — and the transport under it — would jump every time the story
          moved on. It is the narration, so it changes per FRAME, where the chips change per chapter. */}
      <p className="min-h-[52px] px-4 pt-3 text-[13px] font-medium leading-[1.45] text-white">{frame.cap}</p>

      {/* ── the transport: play/pause, then the chapters ─────────────────────────────────────
          ⚠️ LABELLED chips, not dots. A dot says "there are five of these"; a word says which one you
          are about to see, which is the only reason to press it. */}
      <div className="flex items-center gap-1 px-3 pt-2">
        <button
          onClick={togglePlay}
          title={playing ? 'Pause' : 'Play'}
          className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >{playing ? <Pause size={13} /> : <Play size={13} />}</button>
        {STORY_CHAPTERS.map((label, n) => (
          <button
            key={label}
            onClick={() => jump(n)}
            className={`relative flex-1 overflow-hidden rounded px-1 py-1.5 text-[11px] font-medium transition-colors ${
              n === ch ? 'bg-white/15 text-white' : n < ch ? 'text-white/70 hover:bg-white/10' : 'text-white/40 hover:bg-white/10 hover:text-white/75'
            }`}
          >
            {label}
            {/* The live chapter's bar is written from the same clock that advances the frames. */}
            {n === ch && <span ref={barRef} className="absolute bottom-0 left-0 h-[2px] bg-[#3D8BD0]" style={{ width: 0 }} />}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-3.5 pb-3.5 pt-3">
        <button
          onClick={restart}
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-[12px] text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        ><RotateCcw size={12} /> From the start</button>
        <button
          onClick={onReplay}
          className="rounded border border-white/20 px-2.5 py-1 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/10"
        >Take the tour</button>
      </div>
    </div>
  );
}
