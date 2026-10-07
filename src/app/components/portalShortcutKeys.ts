/* Support Portal builder — the ONE place a toolbar action's keys are written down.
 *
 * ⚠️ It is read by BOTH sides, and that is the whole reason it exists as its own module:
 *   · `ToolbarTip` (PortalCanvas) looks a button's `data-tip` up here to print its keys, and
 *   · `PortalShortcuts` looks the same entry up to know which button a key should press.
 * Written twice they would drift the first time a label changed, and the drift is silent in the
 * worst way — the tooltip goes on promising a key that no longer does anything.
 *
 * ⚠️ Its own module rather than living in `PortalShortcuts`: that file imports `useCanvas` from
 * `PortalCanvas`, so `PortalCanvas` importing back would be a cycle.
 *
 * ⚠️ `tips` are PREFIXES. A toolbar label can carry a live value — `Horizontal alignment — centre`,
 * `Split into columns` — so a whole-string match would miss exactly the buttons whose state changes.
 *
 * ⚠️ ORDER IS LOAD-BEARING. `keysForTip` scans in declaration order and takes the first prefix that
 * matches, which is what disambiguates the two Add buttons: `Add a widget beside this one` is
 * declared above the bare `Add a `, so anything else beginning `Add a …` — a question, a slide, a
 * link — falls through to Shift+A. A new collection's own wording needs no change here. */

/** PARKED (30 Sep 2026, Zeni): the floating toolbar's MOVE arrows — left/right, and up/down on a
 *  vertical parent — and the bare-arrow keys that press them. Switched off, not deleted: set this to
 *  `true` and the buttons, the keys and the shortcut-sheet row all come back. See future-tasks.md §6.
 *  Dragging (the grip) still moves anything anywhere. */
export const SHOW_MOVE_ARROWS = false;

export interface ToolbarKey {
  /** What the tooltip and the sheet print. Arrows and `Del` are written as the glyph, not the code. */
  keys: string[];
  /** `data-tip` prefixes this action's button can carry. */
  tips: string[];
}

export const TOOLBAR_KEYS = {
  /* place */
  addBeside: { keys: ['A'], tips: ['Add a widget beside this one', 'Add widget'] },
  /* ⚠️ Must stay BELOW `addBeside` — see the order note above. */
  addInside: { keys: ['Shift', 'A'], tips: ['Add a ', 'Add a block inside'] },
  replace: { keys: ['R'], tips: ['Replace this widget', 'Replace widget'] },
  duplicate: { keys: ['Ctrl', 'D'], tips: ['Copy'] },
  split: { keys: ['S'], tips: ['Split', 'Add column', 'Add row'] },
  /* structure */
  selectRow: { keys: ['Alt', '↑'], tips: ['Select the row'] },
  moveLeft: { keys: ['←'], tips: ['Move left'] },
  moveRight: { keys: ['→'], tips: ['Move right'] },
  moveUp: { keys: ['↑'], tips: ['Move up'] },
  moveDown: { keys: ['↓'], tips: ['Move down'] },
  /* style */
  background: { keys: ['B'], tips: ['Background colour', 'Banner background'] },
  border: { keys: ['O'], tips: ['Border'] },
  radius: { keys: ['C'], tips: ['Corner radius'] },
  shadow: { keys: ['D'], tips: ['Shadow'] },
  alignH: { keys: ['H'], tips: ['Horizontal alignment'] },
  alignV: { keys: ['V'], tips: ['Vertical alignment'] },
  icon: { keys: ['I'], tips: ["The glyph's colour"] },
  presets: { keys: ['G'], tips: ['Presets', 'Sections, and how they are arranged'] },
  /* remove — `Delete` also prefixes `Delete the banner`, which is the same key on the same idea. */
  remove: { keys: ['Del'], tips: ['Delete'] },
} satisfies Record<string, ToolbarKey>;

export type ToolbarAction = keyof typeof TOOLBAR_KEYS;

/** The prefixes one action's button can carry — what `PortalShortcuts` presses. */
export const tipsOf = (a: ToolbarAction): string[] => TOOLBAR_KEYS[a].tips;

/** The keys a tooltip should print, or null where the button has no shortcut. */
export function keysForTip(label: string): string[] | null {
  for (const entry of Object.values(TOOLBAR_KEYS) as ToolbarKey[]) {
    if (entry.tips.some((t) => label.startsWith(t))) return entry.keys;
  }
  return null;
}

/* ── The builder's OWN keys — the ones with no toolbar button to be found by ─────────────────────
 *
 * ⚠️ Beside `TOOLBAR_KEYS` for the same reason that map exists: the sheet and every tooltip that
 * prints one of these keys read it from HERE, so a key changed in one place cannot go on being
 * advertised in another. The handler in `PortalShortcuts` is the one place they are BOUND — it has to
 * match `e.code`, which a label cannot give it — and each binding there names the entry it answers.
 *
 * ⚠️ They follow the scheme's one rule, so they can be guessed: Alt is the builder's chrome, a bare
 * letter acts on the page, Ctrl is the document. `N` is a bare letter because a new section is PAGE
 * content — it is the first step of building a page, and it works with nothing selected. */
export const CHROME_KEYS = {
  preview: ['Alt', 'P'],
  exitPreview: ['Esc'],
  mode: ['Alt', 'L'],
  newSection: ['N'],
  widgets: ['Alt', '1'],
  theme: ['Alt', '2'],
  branding: ['Alt', '3'],
  banners: ['Alt', '4'],
  hidePanel: ['Alt', '0'],
  undo: ['Ctrl', 'Z'],
  redo: ['Ctrl', 'Shift', 'Z'],
  saveDraft: ['Ctrl', 'S'],
  help: ['?'],
} as const;

export type ChromeAction = keyof typeof CHROME_KEYS;
export const chromeKeys = (a: ChromeAction): string[] => [...CHROME_KEYS[a]];
