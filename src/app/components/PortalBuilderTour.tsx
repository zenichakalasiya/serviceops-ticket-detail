import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { TourArt, type TourBeat } from './PortalTourArt';

/**
 * The guided tour of the Support Portal builder — version 1 of the two Zeni asked for.
 *
 * ⚠️ THE CARD CARRIES A PICTURE NOW, and that is the whole change of shape: media panel → title →
 * one short line → `n of N` beside Close / Next, the form every product tour uses (Canva, Claude,
 * Intercom) and the one Zeni's two references share. The old card was four lines of prose with a
 * counter under them, which asked somebody to READ their way through a screen they could not yet
 * picture. A tour of a visual editor that shows nothing is a manual.
 *
 * ⚠️ IT MOVES THE SURFACE UNDERNEATH IT. Step 2 opens the Widgets panel and step 3 selects the
 * banner, because the two things those steps are about — a library of widgets, and a floating
 * toolbar — do not EXIST until something opens or something is selected. A spotlight on a closed
 * panel is a spotlight on a 72px strip of icons. This deliberately reverses the old tour's "the
 * tour never selects behind your back", which was written about its one interactive step, where the
 * point was that YOU perform the gesture. Here the point is that you SEE the result.
 *
 * ⚠️ A step may point at SEVERAL anchors and the hole is their union — the last step is about
 * finishing, and finishing is the light/dark switch, Preview and Publish, which sit either side of
 * Reset to default on the same row. One rect over the lot says "this end of the bar"; two separate
 * steps would have split one thought across two cards.
 *
 * ⚠️ Finishing hands over to the DOCK (`PortalTourDock`); SKIPPING does not. Somebody who read four
 * cards gets the summary they can keep; somebody who dismissed the tour on card one is told, twice,
 * about a thing they just said they did not want.
 *
 * ⚠️ Placement is MEASURED and flipped, never a fixed offset. The rail is hard against the right
 * edge and the bar against the top, which is exactly where the ticket tour's hardcoded `-100` /
 * `-420` put a card off-screen. `place()` flips to the opposite side when this one cannot hold the
 * card, then clamps inside the viewport.
 */

type Pos = 'top' | 'bottom' | 'left' | 'right' | 'center';
type RailKey = 'add' | 'theme' | 'branding' | 'banners';

interface Step {
  id: string;
  title: string;
  description: string;
  /** The picture that plays above the words. */
  beat: TourBeat;
  /** One `data-tour` value, or several — the hole becomes their union. */
  target?: string | string[];
  position: Pos;
  padding?: number;
  /** Extra room ABOVE the target, for a toolbar that sits outside the element it belongs to. */
  padTop?: number;
  /** Open this rail panel before measuring — the step is about what the panel holds. */
  rail?: RailKey;
  /** Select this node before measuring — the step is about what selection produces. */
  select?: string;
}

/* ⚠️ FOUR STEPS, in the order Zeni set: where things come FROM (rail), what they come OUT of
   (panel), what you do to them ONCE PLACED (canvas + toolbar), and how you finish (top bar). It is
   the order somebody actually builds a page in, so each card is the answer to the question the last
   one leaves you with. Every line is ONE sentence — the picture carries the rest. */
const STEPS: Step[] = [
  {
    id: 'rail',
    title: 'Everything starts on the right',
    description:
      'Everything you need is on the right. Use Widgets to add content, Theme to change colours and fonts, and Branding to update your portal details.',
    beat: 'rail',
    target: 'rail',
    position: 'left',
    padding: 0,
  },
  {
    id: 'panel',
    title: 'Add widgets',
    description:
      'Add widgets from the panel on the right. Drag a widget to where you want it, or click it to add it to the page.',
    beat: 'panel',
    target: 'panel',
    position: 'left',
    padding: 0,
    rail: 'add',
  },
  {
    id: 'canvas',
    title: 'Edit anything',
    description:
      'Click any part of the portal to edit it. Use the toolbar to move, resize, or remove it, and use the sidebar to change its settings.',
    beat: 'canvas',
    target: 'hero',
    position: 'right',
    padding: 8,
    select: 'hero',
  },
  {
    id: 'publish',
    title: 'Preview and publish',
    description:
      'Your changes stay in the editor until you publish them. Preview the portal in light or dark mode, check how it looks to requesters, and publish when it’s ready.',
    beat: 'publish',
    target: ['mode', 'publish'],
    position: 'bottom',
    padding: 8,
  },
];

const CARD_W = 320;
const GAP = 16;
const EDGE = 12;

/** ⚠️ Resolved against the LIVE page: a page started from scratch may carry no banner at all, and a
 *  step aimed at nothing is worse than a step that isn't there. */
function firstBlock(): HTMLElement | null {
  const canvas = document.querySelector('[data-portal-canvas]');
  if (!canvas) return null;
  const nodes = [...canvas.querySelectorAll<HTMLElement>('[data-node]')];
  return nodes.find((n) => {
    const r = n.getBoundingClientRect();
    return r.height > 56 && r.width > 120;
  }) ?? nodes[0] ?? null;
}

function one(name: string): HTMLElement | null {
  /* ⚠️ `data-tour` first, then `data-node`. The canvas already labels every block it renders, so a
     step can aim at one by its own name without a second anchor being added for the tour's sake —
     and two anchors on one element is two things to keep in step. */
  return document.querySelector<HTMLElement>(`[data-tour="${name}"]`)
    ?? document.querySelector<HTMLElement>(`[data-node="${name}"]`);
}

/** The union of every anchor a step names, so one hole can cover a group. */
function resolveRect(step: Step): DOMRect | null {
  const names = step.target ? (Array.isArray(step.target) ? step.target : [step.target]) : [];
  const els = names.map(one).filter((e): e is HTMLElement => !!e);
  if (!els.length) {
    const fallback = step.select ? firstBlock() : null;
    return fallback?.getBoundingClientRect() ?? null;
  }
  const rects = els.map((e) => e.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

/** Preferred placement, flipped when it will not fit, then clamped inside the viewport. */
function place(rect: DOMRect, pos: Pos, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (pos === 'center') {
    return { top: Math.max(EDGE, vh / 2 - h / 2), left: Math.max(EDGE, vw / 2 - w / 2), pos };
  }

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
  selected,
  onSelect,
  onRail,
  onDone,
  onFinish,
}: {
  /** What was selected when the tour opened — put back when it closes. */
  selected: string | null;
  /** Selects a node (or clears the selection), so the step about selection has something selected. */
  onSelect: (id: string | null) => void;
  /** Opens a rail panel, so the step about the library has the library open. */
  onRail: (key: RailKey) => void;
  /** Leaving by any route — Skip, Escape, or the last Next. */
  onDone: () => void;
  /** Reaching the END. Only this hands over to the dock. */
  onFinish: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [box, setBox] = useState({ top: 0, left: 0, pos: 'center' as Pos });
  const [fading, setFading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = STEPS[i];

  /* ── put the surface in the state this step is about, BEFORE it is measured ──
     ⚠️ A step that does not SELECT anything CLEARS the selection. Step 3 selects the banner to show
     its toolbar; left selected, that toolbar went on standing over steps 1, 2 and 4, pointing at a
     banner the card was no longer talking about. Deselecting does not close the rail panel —
     `select(null)` only stands the panel down for a real id — so step 2's library stays open. */
  useEffect(() => {
    if (step.rail) onRail(step.rail);
    onSelect(step.select ?? null);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ⚠️ The tour borrowed the selection, so it gives it back: whatever was selected when it opened is
     selected again when it closes, by any route. A guide that leaves the page in a different state
     from the one it found is one the admin has to tidy up after. */
  const startSel = useRef(selected);
  useEffect(() => () => onSelect(startSel.current), []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── measure the target, then the card, then place it ── */
  const measure = useCallback(() => {
    const r = resolveRect(step);
    if (!r) { setRect(null); return; }
    /* The canvas is long; a spotlight on something below the fold is a dimmed screen with no hole
       in it, so an off-screen target is scrolled to before it is pointed at. */
    if (r.top < 80 || r.bottom > window.innerHeight - 40) {
      const el = one(Array.isArray(step.target) ? step.target[0] : step.target ?? '');
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
      setRect(resolveRect(step));
    } else {
      setRect(r);
    }
  }, [step]);

  useEffect(() => {
    /* ⚠️ Measured on the NEXT frame. Steps 2 and 3 have just asked the builder to open a panel or
       select a block, and neither has rendered yet — measured in the same tick the hole lands on
       where the panel used to be. */
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    /* `true` — the canvas scrolls in its own box, not on the window. */
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  /* ⚠️ Placement runs in a LAYOUT effect against the card's REAL height — the copy varies enough
     between steps that assuming one would visibly misalign the arrow. */
  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight ?? 300;
    const w = cardRef.current?.offsetWidth ?? CARD_W;
    setBox(rect ? place(rect, step.position, w, h) : place(new DOMRect(0, 0, 0, 0), 'center', w, h));
  }, [rect, step, i]);

  const go = (d: number) => {
    const next = i + d;
    if (next >= STEPS.length) { onFinish(); onDone(); return; }
    if (next < 0) return;
    setFading(true);
    setTimeout(() => { setI(next); setFading(false); }, 200);
  };

  /* Escape leaves the tour — the same as Close, and the key everybody tries first. */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onDone]);

  const pad = step.padding ?? 12;
  const padT = step.padTop ?? pad;
  const hole = rect
    ? { x: rect.left - pad, y: rect.top - padT, w: rect.width + pad * 2, h: rect.height + padT + pad }
    : null;
  const last = i === STEPS.length - 1;

  /* The arrow tracks the TARGET's centre, not the card's — the card is clamped at the viewport
     edges, so a fixed 50% arrow ends up pointing at empty space beside what it is about. */
  const cardH = cardRef.current?.offsetHeight ?? 300;
  const cardW = cardRef.current?.offsetWidth ?? CARD_W;
  const arrowTop = rect ? Math.min(Math.max(rect.top + rect.height / 2 - box.top, 24), cardH - 24) : cardH / 2;
  const arrowLeft = rect ? Math.min(Math.max(rect.left + rect.width / 2 - box.left, 28), cardW - 28) : cardW / 2;

  /* ⚠️ PORTALLED TO THE BODY. Rendered inside the builder, the tour lived in the builder shell's own
     stacking layer (`fixed … z-[9000]`), so its z-10500 only counted INSIDE that shell — and the
     floating toolbar, which is portalled to the body at z-9999, painted over the whole shell, the
     tour's blur included. On step 4 the banner's toolbar was the topmost thing on screen. On the body
     the tour outranks every toolbar; on the banner step the toolbar still shows, because it sits
     inside the spotlight's hole. */
  return createPortal(
    /* ⚠️ The ROOT passes clicks through; the overlay inside it does the blocking. A transparent
       `fixed inset-0` still hit-tests across the whole screen, so with the root left interactive it
       would swallow every click on the page beneath. */
    <div data-portal-tour className="pointer-events-none fixed inset-0 z-[10500]">
      {/* ⚠️ A REAL viewport, not `width: 0; height: 0`. The mask's own rect is sized `100%`, and a
          percentage inside a zero-sized SVG resolves to zero — so the white "keep this" rect would
          have no area, the whole overlay would be masked away, and the tour would run with a
          spotlight ring around a page that was never dimmed. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="portal-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="12" fill="black" />}
          </mask>
        </defs>
      </svg>

      <div
        className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-[3px] transition-all duration-300"
        style={{ mask: 'url(#portal-tour-mask)', WebkitMask: 'url(#portal-tour-mask)' }}
      />

      {hole && (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            top: hole.y, left: hole.x, width: hole.w, height: hole.h,
            boxShadow:
              '0 0 0 2px rgba(61, 139, 208, 0.9), 0 0 32px rgba(61, 139, 208, 0.35), 0 20px 60px rgba(0, 0, 0, 0.45)',
            opacity: fading ? 0 : 1,
            zIndex: 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        data-portal-tour-card
        className="pointer-events-auto absolute w-[320px] rounded-2xl bg-[#1F2937] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] transition-all duration-300"
        style={{
          top: box.top, left: box.left, zIndex: 3,
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {/* ⚠️ The card must NOT be `overflow-hidden`. The four arrows are children hanging off its
            edges at -10px, so clipping the card silently removes every one of them — the card still
            looks right, it just stops pointing at anything. The media panel does its own clipping. */}
        {box.pos === 'right' && (
          <div className="absolute -left-2.5 w-0" style={{ top: arrowTop - 10, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '10px solid #1F2937' }} />
        )}
        {box.pos === 'left' && (
          <div className="absolute -right-2.5 w-0" style={{ top: arrowTop - 10, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '10px solid #1F2937' }} />
        )}
        {box.pos === 'bottom' && (
          <div className="absolute -top-2.5 h-0" style={{ left: arrowLeft - 10, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '10px solid #1F2937' }} />
        )}
        {box.pos === 'top' && (
          <div className="absolute -bottom-2.5 h-0" style={{ left: arrowLeft - 10, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #1F2937' }} />
        )}

        {/* ⚠️ The picture is INSET, not full-bleed. Flush to the card's edges it reads as the card's
            own background and the words underneath look like a caption; inset, it reads as a screen
            being shown to you, which is what it is. */}
        <div className="px-4 pt-4">
          <div className="h-[160px] overflow-hidden rounded-lg bg-[#F1F5F9]">
            {/* Keyed by step so each beat's animations restart rather than continuing mid-cycle. */}
            <TourArt key={step.id} beat={step.beat} />
          </div>
        </div>

        <div className="px-5 pb-1 pt-4">
          <h3 className="text-[15.5px] font-semibold leading-tight text-white">{step.title}</h3>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-white/70">{step.description}</p>
        </div>

        <div className="flex items-center justify-between px-5 pb-4 pt-3">
          <div className="text-[12px] font-medium text-white/45">{i + 1} of {STEPS.length}</div>
          <div className="flex items-center gap-2">
            {/* ⚠️ Close is on EVERY step, not only the first — somebody who has seen enough should
                not have to reach the end to stop. Once there IS a Back, Close steps aside for it
                and becomes the quietest of the three. */}
            <button
              onClick={onDone}
              className="rounded px-3 py-1.5 text-[12.5px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >Close</button>
            {i > 0 && (
              <button
                onClick={() => go(-1)}
                className="rounded border border-white/20 px-3 py-1.5 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/10"
              >Back</button>
            )}
            <button
              onClick={() => go(1)}
              className="rounded bg-white px-4 py-1.5 text-[12.5px] font-semibold text-[#1F2937] transition-colors hover:bg-white/90"
            >{last ? 'Done' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
