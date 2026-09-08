/* Support Portal — the one carousel.
 *
 * Two widgets need to move through a list one item at a time: the Media Slider (§7.18) and the
 * Announcements card in its carousel display. They are the same mechanism — an index, autoplay,
 * looping, arrows, dots, keyboard and drag — so it is written ONCE here and both call it.
 *
 * ⚠️ Two copies would have drifted on the first bug. The drag maths alone is four decisions (what
 * counts as a drag rather than a click, which direction advances, what happens at the ends, what
 * happens if the pointer leaves the window mid-drag) and a second implementation would answer at
 * least one of them differently — so a slide you could drag on one widget would be a slide that
 * selects the widget on the other.
 *
 * ⚠️ TYPE, not a pile of switches. Both panels expose one control with two values — Automatic and
 * Manual — because those are the two treatments the product offers, and independent `autoplay` /
 * `arrows` / `swipe` toggles let an admin reach a slider that cannot be moved at all. Drag and
 * keyboard are floors, present under both, and are not offered as choices for the same reason the
 * spec already calls keyboard navigation a floor: a carousel nobody can operate is not a variant.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CarouselType = 'auto' | 'manual';

/** How far the pointer must travel before it is a drag and not a click. */
const DRAG_THRESHOLD = 4;
/** How far it must travel before letting go actually advances a slide. */
const COMMIT = 60;

export interface CarouselOpts {
  count: number;
  type: CarouselType;
  /** Seconds between automatic advances. Ignored while `type` is 'manual'. */
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  /** False on the canvas: an autoplaying slider makes the page impossible to work on. */
  live?: boolean;
}

export interface Carousel {
  i: number;
  go: (n: number) => void;
  step: (d: number) => void;
  atStart: boolean;
  atEnd: boolean;
  /** Live pixel offset while a drag is in flight — 0 at rest. */
  drag: number;
  dragging: boolean;
  /** Spread onto the element that should accept drag + keyboard. */
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    tabIndex: number;
    style: CSSProperties;
  };
}

export function useCarousel({ count, type, interval, pauseOnHover, loop, live = true }: CarouselOpts): Carousel {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  /* ⚠️ A REF beside the state. The autoplay timer is created once per (type, interval, count) and
     would otherwise close over the index it saw when it was made, so it would advance from 0 to 1
     for ever. Same trap the OS-Upgrade uploader's `tickRef`/`jobsRef` pair records. */
  const iRef = useRef(0);
  iRef.current = i;

  const wrap = useCallback((n: number) => {
    if (count <= 0) return 0;
    if (loop === false) return Math.max(0, Math.min(count - 1, n));
    return ((n % count) + count) % count;
  }, [count, loop]);

  const go = useCallback((n: number) => setI(wrap(n)), [wrap]);
  const step = useCallback((d: number) => setI(wrap(iRef.current + d)), [wrap]);

  /* The index must stay inside the list when slides are deleted from the panel. */
  useEffect(() => { setI((n) => (n > Math.max(0, count - 1) ? Math.max(0, count - 1) : n)); }, [count]);

  /* ── autoplay ─────────────────────────────────────────────────────────────
     ⚠️ OFF on the canvas (`live: false`). A band that moves under the pointer while you are trying
     to select a slide, style it or drag its handles is unusable — and the admin is looking at the
     canvas precisely to judge one slide at a time. Preview and the published portal run it. */
  useEffect(() => {
    if (!live || type !== 'auto' || count < 2) return;
    if (pauseOnHover !== false && hover) return;
    if (dragging) return;
    const ms = Math.max(2, Number(interval ?? 5)) * 1000;
    const t = window.setInterval(() => setI((n) => wrap(n + 1)), ms);
    return () => window.clearInterval(t);
  }, [live, type, count, interval, pauseOnHover, hover, dragging, wrap]);

  /* ── drag, both directions ────────────────────────────────────────────────
     ⚠️ POINTER events with capture, not mouse events on the element. A drag that leaves the element
     — or the window — must still finish, or the track sticks half-way with no way back. Capture
     also means the moves keep arriving while the pointer is over a child, which every slide is. */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (count < 2) return;
    /* Never steal a drag from a control inside the slide. */
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [contenteditable="true"]')) return;
    const startX = e.clientX;
    const el = e.currentTarget as HTMLElement;
    let moved = 0;
    let started = false;

    const move = (ev: PointerEvent) => {
      moved = ev.clientX - startX;
      if (!started && Math.abs(moved) < DRAG_THRESHOLD) return;
      if (!started) { started = true; setDragging(true); }
      /* ⚠️ Resistance at a hard end, not a wall. With looping off, dragging past the last slide has
         nowhere to go — freezing dead reads as a broken control, so it gives a third of the way. */
      const hardEnd = loop === false
        && ((iRef.current === 0 && moved > 0) || (iRef.current === count - 1 && moved < 0));
      setDrag(hardEnd ? moved / 3 : moved);
    };
    const up = () => {
      el.releasePointerCapture?.(e.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (started && Math.abs(moved) >= COMMIT) {
        /* Drag LEFT (negative) shows the next slide — the content follows the finger. */
        setI((n) => wrap(n + (moved < 0 ? 1 : -1)));
      }
      setDrag(0);
      setDragging(false);
    };
    el.setPointerCapture?.(e.pointerId);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [count, loop, wrap]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    step(e.key === 'ArrowRight' ? 1 : -1);
  }, [step]);

  return {
    i: Math.min(i, Math.max(0, count - 1)),
    go, step,
    atStart: loop === false && i <= 0,
    atEnd: loop === false && i >= count - 1,
    drag, dragging,
    bind: {
      onPointerDown,
      onKeyDown,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      tabIndex: 0,
      /* `pan-y` keeps the page scrollable vertically on a touch device while this owns the x axis. */
      style: { touchAction: 'pan-y', cursor: count > 1 ? (dragging ? 'grabbing' : 'grab') : undefined, outline: 'none' },
    },
  };
}

/** Milliseconds for the named speeds the panel offers. */
export const SPEED_MS: Record<string, number> = { fast: 180, normal: 320, slow: 560 };

/** The sliding track. One child per item; `perView` decides how many are on screen. */
export function CarouselTrack({ car, perView = 1, gap = 0, speed = 'normal', fade, children }: {
  car: Carousel; perView?: number; gap?: number; speed?: string; fade?: boolean; children: ReactNode[];
}) {
  const n = children.length;
  const ms = SPEED_MS[speed] ?? SPEED_MS.normal;

  /* ⚠️ FADE keeps one slide mounted and cross-dissolves; it cannot use the track, because a
     translated track shows two slides mid-move which is the one thing a fade must never do. */
  if (fade) {
    return (
      <div className="relative">
        {children.map((c, k) => (
          <div
            key={k}
            aria-hidden={k !== car.i}
            className={k === car.i ? 'relative' : 'pointer-events-none absolute inset-0'}
            style={{ opacity: k === car.i ? 1 : 0, transition: `opacity ${ms}ms ease` }}
          >{c}</div>
        ))}
      </div>
    );
  }

  /* Each slide takes an equal share of the viewport minus the gaps between the visible ones. */
  const per = Math.max(1, Math.min(perView, Math.max(1, n)));
  const basis = `calc((100% - ${(per - 1) * gap}px) / ${per})`;
  /* The drag offset rides ON TOP of the settled position, so the track follows the finger. */
  const shift = `calc(-1 * (${basis} + ${gap}px) * ${car.i})`;

  return (
    <div className="overflow-hidden">
      <div
        className="flex"
        style={{
          gap,
          transform: `translate3d(calc(${shift} + ${car.drag}px), 0, 0)`,
          /* No transition WHILE dragging — the track has to track the finger exactly, and an
             easing curve on every pointermove makes it lag behind by a frame. */
          transition: car.dragging ? 'none' : `transform ${ms}ms ease`,
        }}
      >
        {children.map((c, k) => (
          <div key={k} className="min-w-0 flex-shrink-0" style={{ flexBasis: basis, width: basis }}>{c}</div>
        ))}
      </div>
    </div>
  );
}

/** Prev / next. Only ever rendered for the Manual type — see the note at the top of the file. */
export function CarouselArrows({ car, placement = 'inside', over }: {
  car: Carousel; placement?: string; over?: boolean;
}) {
  const base = 'flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-35 disabled:cursor-default';
  const skin = over
    ? `${base} bg-black/40 text-white hover:bg-black/60`
    : `${base} border border-[#DFE5ED] bg-white text-[#475467] hover:border-[#3D8BD0] hover:text-[#3D8BD0]`;

  /* `outside` and `inside` differ by where they sit, not by what they are — so the buttons are
     built once and only the wrapper changes. */
  const btns = (
    <>
      <button
        type="button"
        aria-label="Previous"
        disabled={car.atStart}
        onClick={(e) => { e.stopPropagation(); car.step(-1); }}
        className={skin}
      ><ChevronLeft size={16} /></button>
      <button
        type="button"
        aria-label="Next"
        disabled={car.atEnd}
        onClick={(e) => { e.stopPropagation(); car.step(1); }}
        className={skin}
      ><ChevronRight size={16} /></button>
    </>
  );

  if (placement === 'over') {
    return (
      <>
        <span className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
          <button
            type="button" aria-label="Previous" disabled={car.atStart}
            onClick={(e) => { e.stopPropagation(); car.step(-1); }} className={skin}
          ><ChevronLeft size={16} /></button>
        </span>
        <span className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
          <button
            type="button" aria-label="Next" disabled={car.atEnd}
            onClick={(e) => { e.stopPropagation(); car.step(1); }} className={skin}
          ><ChevronRight size={16} /></button>
        </span>
      </>
    );
  }
  return <span className={`flex items-center gap-1.5 ${placement === 'outside' ? 'justify-between' : ''}`}>{btns}</span>;
}

/** The position readout. Present under BOTH types — it is how you know where you are. */
export function CarouselDots({ car, count, style = 'dots', over }: {
  car: Carousel; count: number; style?: string; over?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${over ? 'absolute inset-x-0 bottom-2 justify-center' : ''}`}>
      {Array.from({ length: count }).map((_, k) => (
        <button
          key={k}
          type="button"
          aria-label={`Go to ${k + 1}`}
          onClick={(e) => { e.stopPropagation(); car.go(k); }}
          className={
            style === 'numbers'
              ? `flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${k === car.i ? (over ? 'bg-white text-[#364658]' : 'bg-[#3D8BD0] text-white') : over ? 'bg-black/40 text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`
              : style === 'bars'
                ? `h-1 w-5 rounded-full transition-colors ${k === car.i ? (over ? 'bg-white' : 'bg-[#3D8BD0]') : over ? 'bg-white/40' : 'bg-[#CBD5E1]'}`
                : `size-2 rounded-full transition-colors ${k === car.i ? (over ? 'bg-white' : 'bg-[#3D8BD0]') : over ? 'bg-white/40' : 'bg-[#CBD5E1]'}`
          }
        >{style === 'numbers' ? k + 1 : null}</button>
      ))}
    </div>
  );
}
