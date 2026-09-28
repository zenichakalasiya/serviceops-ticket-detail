import { useEffect, useRef } from 'react';

/* Arrow-key navigation inside a floating-toolbar popup.
 *
 * ⚠️ THERE IS NO CURSOR. Moving APPLIES, so the highlight you see is the value itself — which is
 * what Zeni described ("it changes the alignment based on selection") and what removes the whole
 * class of bug where a cursor and a value disagree about which option is chosen. The caller works
 * out `at` from its own value, presses `onMove`, the value changes, and `at` follows. One state.
 *
 * ⚠️ CAPTURE PHASE, and it stops propagation. `PortalShortcuts` listens for the same arrows on the
 * window to MOVE the selected widget — so without this the arrow that walks a popup would also
 * reorder the page behind it. Capture runs before the bubble listener, so stopping there is what
 * makes the open popup win.
 *
 * ⚠️ It CLAMPS at the ends rather than wrapping. The product's own move arrows are simply absent at
 * the edge of a row, so "there is nothing further that way" is already what an arrow means here; a
 * row that jumped back to its first option would be the one place it meant something else.
 *
 * ⚠️ ORIENTATION IS THE CALLER'S. A row of four tiles is `rows: [4]` and answers to left/right; a
 * vertical list of four is `rows: [1, 1, 1, 1]` and answers to up/down. The hook never guesses which
 * way a popup is laid out, so it cannot be wrong about it.
 *
 * ⚠️ NO DEPENDENCY ARRAY. `at` changes on every apply and the handler closes over it, so a memoised
 * listener would keep moving from where the popup opened. Re-registering per render is a window
 * listener added and removed — cheaper than the class of bug it avoids. */

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

export interface PopupArrowsProps {
  open: boolean;
  /** How many options each row holds — `[4]` for one row, `[4, 3]` for a tab strip over a grid. */
  rows: number[];
  /** Where the current value sits. */
  at: [number, number];
  /** Apply the option at this position. Must NOT close the popup — Enter is what closes it. */
  onMove: (row: number, col: number) => void;
  /** Enter — keep what is applied and close. */
  onEnter: () => void;
  /** Escape — put back what the popup opened with, and close. */
  onEscape: () => void;
}

export function usePopupArrows({ open, rows, at, onMove, onEnter, onEscape }: PopupArrowsProps) {
  useEffect(() => {
    if (!open || !rows.length) return;
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(k)) return;
      /* A popup can hold a real field — the colour picker's hex and RGBA boxes — and inside one an
         arrow belongs to the caret. */
      if (isTyping(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      if (k === 'Enter') { onEnter(); return; }
      if (k === 'Escape') { onEscape(); return; }

      let [r, c] = at;
      /* A position out of range means the value is not one of the options — land on the first. */
      if (r < 0 || r >= rows.length) { onMove(0, 0); return; }
      if (k === 'ArrowLeft') c = Math.max(0, c - 1);
      else if (k === 'ArrowRight') c = Math.min(rows[r] - 1, c + 1);
      else if (k === 'ArrowUp' && r > 0) { r -= 1; c = Math.min(Math.max(c, 0), rows[r] - 1); }
      else if (k === 'ArrowDown' && r < rows.length - 1) { r += 1; c = Math.min(Math.max(c, 0), rows[r] - 1); }
      onMove(r, Math.max(0, c));
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  });
}

/** The value a popup held when it opened — what `Escape` puts back.
 *
 * ⚠️ Captured DURING the render that opens it, not in an effect: an effect runs after paint, so a
 * first arrow press landing in the same frame would restore the value the arrow had just set. A ref
 * write in render changes nothing React is rendering, which is what makes it safe here. */
export function useOpenValue<T>(open: boolean, value: T) {
  const held = useRef(value);
  const wasOpen = useRef(open);
  if (open && !wasOpen.current) held.current = value;
  wasOpen.current = open;
  return held;
}
