/** A label with its keys to the RIGHT of it, for the product's own dark Radix tooltips.
 *
 * ⚠️ Its own module so the CANVAS can use it: it used to live in `PortalShortcuts`, which imports
 * `useCanvas` from `PortalCanvas` — so the canvas importing it back would have been a cycle, and the
 * "+ Add Section" pill was left with no tooltip at all. `PortalShortcuts` re-exports it, so every
 * existing import still works.
 *
 * ⚠️ The top bar's tooltips used to write the key into the sentence — `Undo (Ctrl+Z)`. That is the same
 * fact in a second notation; a cap beside the word is the shape every design tool uses, and the shape
 * the floating toolbar uses one surface away.
 * ⚠️ The cap has NO STROKE (Zeni's reference): a filled block on the dark tooltip, tight around its
 * letter. The WORDS sit 12px off the caps — the gap is what separates "what it does" from "what to
 * press", and at 8–10px the two ran together into one phrase.
 * ⚠️ The gap after the last cap is 11px, one less than the words get on the left — Zeni asked for exactly
 * that pixel back. It is set by the `.tip-keys` rule in theme.css on the TOOLTIP, and the rule says 10px:
 * the tooltip sizes to fit-content and carries a pixel of slack beyond the caps, so 11 there measured 12
 * on screen. A negative margin in here never changed the tooltip's measured width at all.
 */
export function TipKeys({ label, keys }: { label: string; keys: string[] }) {
  return (
    <span className="tip-keys flex items-center gap-3">
      {label}
      <span className="flex items-center gap-1">
        {keys.map((x, i) => (
          <kbd key={i} className="inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[3px] bg-white/[0.16] px-[3px] font-sans text-[10px] font-medium leading-none text-white/90">
            {x}
          </kbd>
        ))}
      </span>
    </span>
  );
}
