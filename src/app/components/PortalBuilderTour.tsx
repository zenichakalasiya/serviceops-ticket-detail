import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

/**
 * The first-run guide for the Support Portal builder.
 *
 * ⚠️ The CARD is the ticket detail page's tour card, deliberately unchanged — same #1F2937
 * surface, same 400px, same 16/14px type, same white primary button, same "n/N" counter, same
 * arrow, same black/60 + 4px-blur overlay with an SVG-masked spotlight and the blue glow ring.
 * A second tour that looked like a different product's tour would teach the admin that this
 * screen is not quite part of ServiceOps, which is the opposite of what a first run is for.
 *
 * ⚠️ It is a SEPARATE COMPONENT rather than a generalisation of `TicketDetailsOnboarding`. That
 * file is live on thirteen drawers and V1 TicketDrawer is final; refactoring it to serve two
 * callers would put a working feature at risk to save a file. What is copied is the recipe.
 *
 * ⚠️ What could NOT be copied is the positioning. The ticket tour hardcodes its offsets
 * (`-100`, `-200`, `-420`) with no flipping and no clamping, which is fine inside a wide drawer
 * and broken here: the rail is hard against the right edge and the top bar against the top, so
 * a card placed by those numbers lands off-screen. `place()` below measures the real card and
 * flips, then clamps.
 *
 * Reset for testing:
 *   localStorage.removeItem('hasSeenPortalBuilderTour');
 */

export const TOUR_KEY = 'hasSeenPortalBuilderTour';

type Pos = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface Step {
  id: string;
  title: string;
  description: string;
  /** A `data-tour` value, or 'first-block' — resolved against the page at runtime. */
  target?: string;
  position: Pos;
  padding?: number;
  /** The one step you DO rather than watch: the overlay stops swallowing clicks. */
  interactive?: boolean;
  /** Holds the first seam open, since it is a hover affordance and would not be there to point at. */
  seam?: boolean;
}

/* ⚠️ Six steps that teach the MODEL, not the button names. An admin who has only ever used forms
   arrives believing three things that are wrong here — the right side is a form, settings live in
   one place, and they might break the live portal — and until those break nothing else lands. So:
   permission first, then click→panel, then what the panel is, then where new things come from,
   then the one affordance nobody can see, then how to ship. */
const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'You’re editing the portal your requesters see',
    description:
      'This is the real page, not a preview. Change anything on it — nothing reaches your requesters until you publish.',
    position: 'center',
  },
  {
    id: 'select',
    title: 'Click a block to edit it',
    description:
      'Every part of this page can be selected. Try this card — the panel on the right becomes its settings.',
    target: 'first-block',
    position: 'right',
    padding: 10,
    interactive: true,
  },
  {
    id: 'panel',
    title: 'Content is what it says. Design is how it looks.',
    description:
      'Whatever you select, its settings open here under these two tabs. Every change shows on the page as you make it.',
    target: 'panel',
    position: 'left',
    padding: 0,
  },
  {
    id: 'rail',
    title: 'New blocks come from here',
    description:
      'Widgets adds things to the page. Theme sets the colours and fonts for all of it. Branding holds your logo and portal address.',
    target: 'rail',
    position: 'left',
    padding: 0,
  },
  {
    id: 'seam',
    title: 'Add a section anywhere',
    description:
      'Hover between two blocks and a blue line appears. That’s where a new section goes — drop a widget into it, or split it into rows and columns.',
    target: 'seam',
    position: 'right',
    padding: 8,
    seam: true,
  },
  {
    id: 'publish',
    title: 'Nothing is live until you publish',
    description:
      'Preview shows the page exactly as a requester sees it. Publish makes it theirs. Until then everything you do is saved as a draft.',
    target: 'publish',
    position: 'bottom',
    padding: 6,
  },
];

/** The card's own size, used before the first measurement lands. */
const CARD_W = 400;
const GAP = 16;
const EDGE = 12;

/** ⚠️ Resolved against the LIVE page, never hardcoded: a page started from scratch has no card to
 *  point at, and a step aimed at nothing is worse than a step that isn't there. Prefers a block
 *  big enough to read as a block. */
function resolveTarget(step: Step): HTMLElement | null {
  if (!step.target) return null;
  if (step.target === 'first-block') {
    const canvas = document.querySelector('[data-portal-canvas]');
    if (!canvas) return null;
    const nodes = [...canvas.querySelectorAll<HTMLElement>('[data-node]')];
    return nodes.find((n) => {
      const r = n.getBoundingClientRect();
      return r.height > 56 && r.width > 120;
    }) ?? nodes[0] ?? null;
  }
  return document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
}

/** Preferred placement, flipped when it will not fit, then clamped inside the viewport. */
function place(rect: DOMRect, pos: Pos, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (pos === 'center') {
    return { top: Math.max(EDGE, vh / 2 - h / 2), left: Math.max(EDGE, vw / 2 - w / 2), pos };
  }

  /* Flip to the opposite side when this one cannot hold the card — the rail sits hard against the
     right edge and the top bar against the top, which is exactly where the ticket tour's fixed
     offsets put the card off-screen. */
  let side = pos;
  if (side === 'right' && rect.right + GAP + w > vw - EDGE) side = 'left';
  else if (side === 'left' && rect.left - GAP - w < EDGE) side = 'right';
  else if (side === 'bottom' && rect.bottom + GAP + h > vh - EDGE) side = 'top';
  else if (side === 'top' && rect.top - GAP - h < EDGE) side = 'bottom';

  let top: number;
  let left: number;
  if (side === 'right' || side === 'left') {
    left = side === 'right' ? rect.right + GAP : rect.left - w - GAP;
    top = rect.top + rect.height / 2 - h / 2;
  } else {
    top = side === 'bottom' ? rect.bottom + GAP : rect.top - h - GAP;
    left = rect.left + rect.width / 2 - w / 2;
  }

  return {
    top: Math.min(Math.max(EDGE, top), Math.max(EDGE, vh - h - EDGE)),
    left: Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - w - EDGE)),
    pos: side,
  };
}

export function PortalBuilderTour({
  selectedId,
  onSelect,
  onSeamHold,
  onDone,
}: {
  selectedId: string | null;
  /** Used only by "Show me" on the interactive step — the tour never selects behind your back. */
  onSelect: (id: string) => void;
  /** Holds one seam open for the step that is about it; cleared on every other step. */
  onSeamHold: (afterId: string | null) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [box, setBox] = useState({ top: 0, left: 0, pos: 'center' as Pos });
  const [fading, setFading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  /* The selection as the interactive step BEGAN. Advancing on "selectedId is truthy" would skip
     the step whenever something was already selected when the tour reached it. */
  const selAtStart = useRef<string | null>(null);

  const step = STEPS[i];

  /* ── the seam this step is about, held open while the card is on screen ── */
  useEffect(() => {
    if (!step.seam) { onSeamHold(null); return; }
    const el = document.querySelector<HTMLElement>('[data-tour="seam"]');
    onSeamHold(el?.dataset.seamAfter ?? null);
    return () => onSeamHold(null);
  }, [step.seam, i, onSeamHold]);

  /* ── measure the target, then the card, then place it ── */
  const measure = useCallback(() => {
    const el = resolveTarget(step);
    if (el) {
      const r = el.getBoundingClientRect();
      /* Off-screen targets are scrolled to before they are pointed at — the canvas is long and a
         spotlight on something below the fold is a dimmed screen with no hole in it. */
      if (r.top < 80 || r.bottom > window.innerHeight - 40) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(r);
      }
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    /* `true` — the canvas scrolls in its own box, not on the window. */
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  /* ⚠️ Placement runs in a LAYOUT effect against the card's REAL height. The ticket tour assumes
     200px and centres by subtracting 100, so a two-line step and a five-line step sit in different
     places relative to what they point at; here the copy varies enough that it shows. */
  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight ?? 180;
    const w = cardRef.current?.offsetWidth ?? CARD_W;
    setBox(rect ? place(rect, step.position, w, h) : place(new DOMRect(0, 0, 0, 0), 'center', w, h));
  }, [rect, step, i]);

  /* ── the interactive step advances on a real selection ── */
  useEffect(() => {
    if (!step.interactive) return;
    selAtStart.current = selectedId;
  }, [i, step.interactive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!step.interactive) return;
    if (selectedId && selectedId !== selAtStart.current) {
      const t = setTimeout(() => go(1), 420);
      return () => clearTimeout(t);
    }
  }, [selectedId, step.interactive]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (d: number) => {
    const next = i + d;
    if (next >= STEPS.length) { onSeamHold(null); onDone(); return; }
    if (next < 0) return;
    setFading(true);
    setTimeout(() => { setI(next); setFading(false); }, 220);
  };

  const showMe = () => {
    const el = resolveTarget(step);
    const id = el?.getAttribute('data-node');
    if (id) onSelect(id);
    else go(1);
  };

  /* Escape leaves the tour — the same as Skip, and the key everybody tries first. */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onSeamHold(null); onDone(); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onDone, onSeamHold]);

  const pad = step.padding ?? 12;
  const hole = rect
    ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 }
    : null;
  const last = i === STEPS.length - 1;

  /* The arrow tracks the TARGET's centre, not the card's — the card is clamped at the viewport
     edges, so a fixed 50% arrow ends up pointing at empty space beside what it is about. */
  const cardH = cardRef.current?.offsetHeight ?? 180;
  const cardW = cardRef.current?.offsetWidth ?? CARD_W;
  const arrowTop = rect ? Math.min(Math.max(rect.top + rect.height / 2 - box.top, 22), cardH - 22) : cardH / 2;
  const arrowLeft = rect ? Math.min(Math.max(rect.left + rect.width / 2 - box.left, 26), cardW - 26) : cardW / 2;

  return (
    /* ⚠️ The ROOT passes clicks through; the overlay inside it does the blocking. A transparent
       `fixed inset-0` still hit-tests across the whole screen, so with the root left interactive the
       interactive step swallowed the very click it was asking for — the overlay's own
       `pointer-events-none` never got a say, because the div above it had already taken the event.
       The ticket tour has the same root and never noticed: it blocks on every step by design. */
    <div className="pointer-events-none fixed inset-0 z-[10500]">
      {/* ⚠️ A REAL viewport, not `width: 0; height: 0`. The mask's own rect is sized `100%`, and a
          percentage inside a zero-sized SVG resolves to zero — so the white "keep this" rect had no
          area, the whole overlay was masked away, and the tour ran with no dim at all: a spotlight
          ring around a page that was never darkened. Copied straight from the ticket tour, where
          the same two zeroes are still in place. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="portal-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="12" fill="black" />}
          </mask>
        </defs>
      </svg>

      {/* ⚠️ Click-through on the interactive step and only there. The whole point of that step is
          that you perform the gesture yourself; an overlay that swallows the click would leave the
          card asking for something the screen refuses to accept. */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[4px] transition-all duration-300 ${
          step.interactive ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
        style={{ mask: 'url(#portal-tour-mask)', WebkitMask: 'url(#portal-tour-mask)' }}
      />

      {hole && (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            top: hole.y, left: hole.x, width: hole.w, height: hole.h,
            boxShadow:
              '0 0 0 3px rgba(61, 139, 208, 0.8), 0 0 40px rgba(61, 139, 208, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
            opacity: fading ? 0 : 1,
            zIndex: 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="pointer-events-auto absolute w-[400px] rounded-2xl bg-[#1F2937] shadow-2xl transition-all duration-300"
        style={{
          top: box.top, left: box.left, zIndex: 3,
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {box.pos === 'right' && (
          <div className="absolute -left-3 w-0" style={{ top: arrowTop - 12, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #1F2937' }} />
        )}
        {box.pos === 'left' && (
          <div className="absolute -right-3 w-0" style={{ top: arrowTop - 12, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '12px solid #1F2937' }} />
        )}
        {box.pos === 'bottom' && (
          <div className="absolute -top-3 h-0" style={{ left: arrowLeft - 12, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '12px solid #1F2937' }} />
        )}
        {box.pos === 'top' && (
          <div className="absolute -bottom-3 h-0" style={{ left: arrowLeft - 12, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid #1F2937' }} />
        )}

        <div className="px-6 pb-4 pt-6">
          <h3 className="mb-3 text-[16px] font-semibold leading-tight text-white">{step.title}</h3>
          <p className="text-[14px] leading-relaxed text-white/80">{step.description}</p>

          {/* ⚠️ The interactive step's escape hatch. An interactive step with no way past it is a
              dead end for anyone who does not click where it asks — and "advance anyway" would
              teach nothing, so this performs the selection and lets the next step explain what
              just happened. */}
          {step.interactive && (
            <button
              onClick={showMe}
              className="mt-4 text-[13px] font-medium text-white/70 underline underline-offset-2 transition-colors hover:text-white"
            >Show me</button>
          )}
        </div>

        <div className="flex items-center justify-between px-6 pb-6">
          <div className="text-[13px] font-medium text-white/60">{i + 1}/{STEPS.length}</div>
          <div className="flex items-center gap-3">
            {/* Skip is on every step, not only the first — somebody who has seen enough should not
                have to reach the end to stop. */}
            <button
              onClick={() => { onSeamHold(null); onDone(); }}
              className="px-2 py-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >Skip</button>
            {i > 0 && (
              <button
                onClick={() => go(-1)}
                className="px-4 py-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white"
              >Back</button>
            )}
            <button
              onClick={() => go(1)}
              className="rounded bg-white px-5 py-2 text-[13px] font-semibold text-[#1F2937] transition-colors hover:bg-white/90"
            >{i === 0 ? 'Take the tour' : last ? 'Start editing' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
