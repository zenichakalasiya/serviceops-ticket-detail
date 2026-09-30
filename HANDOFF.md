# Handoff — 2026-09-30

## Latest (30 Sep 2026, latest) — toolbar dividers
- Only the divider right after the drag grip remains; every other toolbar divider is hidden (theme.css, `tb-grip::after`). 56 bars swept, 0 bad.

## Earlier (30 Sep 2026, later) — move arrows parked
- The floating toolbar's Move left/right (and up/down) buttons, their arrow keys and the sheet row are hidden
  by `SHOW_MOVE_ARROWS = false` (`portalShortcutKeys.ts`). Concept kept in future-tasks.md §6; flip the flag to restore.
  Verified: no move buttons on an action card or the Quick Actions row, → no longer reorders, no page errors.

## Earlier (30 Sep 2026) — the global Keyboard shortcuts panel — DONE, pushed
- One right-side panel lists every shortcut in the product (`GlobalShortcutsPanel.tsx`), opened by the
  header keyboard icon, `?`, the builder rail's Shortcuts button and the drawer's rail keyboard button.
  **This page** opens focused on where you are; **All modules** covers every module by area; search
  spans all. Researched against Jira / GitHub / Linear / Notion / Figma / monday first.
- The drawer's `?` popup and the builder's sheet were REMOVED — both now open the global panel.
- Verified in a browser: Hardware Assets list → note + Global focused; open drawer → "Detail pages"
  focused; Relationship tab → "Relationship map" focused; builder → "Support Portal builder" focused;
  search "minimap" → one hit; `?` toggles; Esc clears search, then closes; no page errors.
- Read CLAUDE.md bullet *"ONE global Keyboard shortcuts panel"* and SHORTCUTS.md §0.
- Earlier today: the Editor basics video was rebuilt (six chapters, lucide icons, compact toolbar,
  empty column on stretch) and pushed.
- **Next (optional):** list pages have no shortcuts of their own yet — if any get keys, add rows to
  their (currently empty) registry entries and they'll show focused automatically.

---

(Previous session below.)

## Read first
All work is in the **Support Portal** builder (Admin › Support Channels) and its listing.
**Start with the ALIGNMENT work below — it is the priority (Zeni) and it is half done.**
In `CLAUDE.md` › Key context, read these bullets (dated 28–29 Sep 2026):

1. *"the floating toolbar's DESIGN controls are ALSO in the sidebar"* — `DesignQuickSections`,
   `hasDesignQuick`, `DesignGroupsCtx`. It reverses the older "styling/alignment on the toolbar only".
2. *"EVERY colour picker has Light · Dark tabs and opens on the portal's mode"* — `ColorPair`,
   `colorPair()` / `shownOf()`.
3. *"the two service rows are WHITE CARDS with their title inside"* and *"Favourite and Most Used
   Services share ONE row by default"*.
4. *"closing the tour dock PARKS it in the right rail"*.

## What we worked on this session
Tooltip layering and shortcut polish, the tour dock's resting place, the two service rows'
layout and look, Light/Dark tabs in every colour picker, and — the big one — the toolbar's
design controls mirrored into the sidebar. Ended mid-way through an alignment audit.

## Completed (all pushed to `main`)
- Builder tooltips draw above the editor (`z-[10200]`); shortcut sheet labels left / keys right;
  "+ Add Section" has an instant tooltip with **N**; `TipKeys` moved to `PortalTipKeys.tsx`.
- Portal listing card: name / URL / details 4px apart (`gap-1`).
- Widget hover card: 240px, square-ish 136px sketch stage, name + one-line summary.
- Every colour picker has Light / Dark tabs, opening on the portal's current mode; Cancel restores both.
- Favourite + Most Used Services: side by side (default `browseLook: 'split'`), white cards with the
  title inside, 2×2 tiles on `#F6F9FC`, no tile stroke.
- Closing the tour dock parks a dark **Basics** button at the bottom of the right rail.
- **Toolbar design controls also in the sidebar** (top of Design): Background · Border & corners
  (style as a dropdown, radius merged) · Shadow cards · Icon · Alignment · Presets · Button style;
  banner and banner-group variants. Text children get none (Zeni's choice).
- Expand all / Collapse all now reaches every Design group; the card's **Title** group is last.

## Also done after the first hand-off (29 Sep, later)
- Banner Sections header: title + hint beside the tabs, no divider (commit ea7c90b).
- **A parent section's handles set its gaps** — side handles: width + column gap together; bottom: row gap
  (min 0). See the CLAUDE.md bullet "a PARENT's handles set the gap between its children".
- The three files below were COMMITTED with that change, and the **Text alignment fix is done**
  (`textAlignOf` in `PortalPlacedElement.tsx`); white service badges verified `rgb(255,255,255)`.

## Done last — card alignment by template (29 Sep, evening)
- Data cards (action cards + the tiles of Favourite / Most Used / My Assets / My CIs) align on ONE axis
  picked by their card template (Icon top → Left/Centre/Right; Icon left/right → Top/Middle/Bottom),
  in the toolbar and in the sidebar's first Design group. Quick Actions row: no alignment.
- New toolbar buttons: **Layout** (four white cards + Quick Actions row) and **Card templates** (the cards).
- The Layout preset now lights what the canvas draws (was "four across" over a 2 × 2).
- Verified in the browser (`tour-shots/probe-cardalign*.mjs`). See the CLAUDE.md bullet
  "a DATA CARD aligns on the axis its CARD TEMPLATE leaves free".

## Done last — horizontal-only card alignment + sidebar trims (29 Sep, late)
- Data cards (action cards + the four data-card tiles) align Left/Centre/Right in every template; the Icon-top
  words now follow. Text / Button / Image / Media Slider / Custom Card sidebar changes and the Logo position
  field — see the CLAUDE.md bullet "data cards align HORIZONTALLY in every template".

## Alignment model — Zeni's answers (29 Sep) — BUILT, see CLAUDE.md "a COLUMN aligns what it holds"
1. A widget that fills its column gets alignment only when it is NARROWER than the column.
2. Text: Left/Centre/Right align the lines inside the text box; the box hugs its text.
3. Vertical appears whenever the cell has spare height (dragged taller OR a taller neighbour).
4. ONE alignment per column (or grouped sub-section), not one per stacked widget.
5. Stretch: H = fill the column (Button, a narrowed widget, an image); V = spread stacked widgets top-to-bottom.
6. KPI = a display of the Custom Data Widget; not coming back to the palette on its own. Text with Image stays hidden.
7. Keep the data-card tile alignment.

## Done last — predefined cards as two real sections (29 Sep, night)
- Default page: row 1 (Requests · Approvals · Announcements, equal) and row 2 (Assets over CIs | Most Read over
  Contact, 2:1) are ordinary sections; sections move up/down, columns left/right, stacked cards up/down.
- Drops: predefined ↔ custom mixing refused with a reason; a section emptied by a move is removed.
- See CLAUDE.md "the default page's predefined cards are two REAL SECTIONS".

## In progress
Nothing mid-flight. The per-widget alignment audit list for Zeni (probe-align2 add loop unreliable)
is still owed — see below.

## Next steps
1. Ask Zeni to review the new card alignment + Layout / Card-templates buttons.
2. Send Zeni the full alignment list (H/V per widget, working / partial / does nothing).
3. Carried over: Contact Us "remove this" (ask which part); Figma pill node `296:14588` needs editor
   access; the review list of what overwhelms non-designers (15 points) and the one-go styling
   options (style kit + look presets + S/M/L spacing recommended) await Zeni's choice.

## Decisions made
- **Toolbar design controls live in BOTH places** (Zeni's manager): sidebar + toolbar read/write the
  same keys; drag/move/replace/delete/add stay toolbar-only; text children get no sidebar sections.
- **Border & corners** is one sidebar group, no tabs, style as a dropdown; **Shadow** keeps its cards.
- **Service rows** default to side-by-side, title inside a white card, grey tiles without a stroke.
- **Closing the dock parks it in the rail**; the separate minimise pill was removed.
- **Gradient stops have no light/dark pair** — one stored object would drift.

## Gotchas & notes
- **The typecheck bails on `CatalogItemDetailsModal.tsx`** when `SupportPortalBuilder.tsx` is in the
  file list — typecheck the other files without it, or it looks clean when it checked nothing.
- **React writes a bare `data-portal-dock` as `"true"`**, not `""`.
- **Alt+1 toggles the Widgets panel** — a script pressing it before each row closes the panel.
- Another terminal may be working in this repo: commit named files only, never `git add -A`.
- Pre-existing typecheck noise: `splitNode`/`splitInfo` (PortalCanvas ~1415), `PortalControls` 49/519,
  `PortalWidgetDrawer` ~1492, the `portalWidgetSpec.ts` TS1117.
