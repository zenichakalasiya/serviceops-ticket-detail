# Handoff — 2026-09-29 16:15

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

## In progress — ALIGNMENT (do this first)
Zeni asked for three things; **three files are edited but NOT committed**:
`PortalCanvas.tsx`, `PortalCollectionRender.tsx`, `PortalStylePacks.tsx`.

1. **Clearer alignment icons** — DONE, uncommitted: the "Stretch" option now uses lucide
   `StretchHorizontal` / `StretchVertical` (was a bare ↔ arrow) in `ElementToolbar`'s `H_OPTS`/`V_OPTS`
   and the sidebar's `ALIGN_H_OPTS`/`ALIGN_V_OPTS`. Zeni also said "focused to show what alignment is
   applied" — confirm with her whether the icon change is enough or the trigger should look lit.
2. **Service tile icons white** — DONE, uncommitted: badge background `#FFFFFF` in `ServiceTiles`
   (`PortalCollectionRender.tsx`), and the resting value in `IconMenu`, `DesignQuickSections` and
   `IconBoxBlock` changed from `#F1F5F9` to `#FFFFFF`.
3. **Text horizontal alignment** — DONE (see above). Was: Root cause found: the placed Text (`b-text` in
   `PortalPlacedElement.tsx` ~line 159) sets `textAlign` from `cfg.textAlign`, which no control
   writes any more; the toolbar/sidebar write `styles[id].align`, which `sizeOf` only uses for
   `stretch`. Fix: `textAlign: ownStyle?.align` (left/center/right; map `stretch` → `justify`),
   falling back to `cfg.textAlign`.
4. **Audit every widget's H/V alignment and give Zeni the list** — HALF DONE.
   Scripts: `D:/Motadata/tour-shots/probe-align.mjs` (default page) and `probe-align2.mjs` (blank page +
   every library widget). ⚠️ `probe-align2` is NOT reliable yet: its "+ on each palette row" loop only
   ever added 5 widgets (4 data cards), so Text, Image, Button, Card etc. were never audited — fix the add
   loop (e.g. click each row's "+" by its `data-tip`/aria, re-querying rows after every add) before
   trusting it. Results so far, default page:
   - **Banner (`hero`)**: H and V both do nothing (the arranged banner ignores `contentAlign`/`contentAlignY`).
   - **Text & Search (`hero-content`)**: H works; V does nothing.
   - **Quick Actions cards + their icons, service tiles, My Assets/My CIs tiles**: H works; V does nothing.
   - **Favourite / Most Used Services, Assets/CIs tiles**: Right and Stretch look identical.
   - **Placed data cards (My Open Requests, Approvals, Assets, CIs)**: H partial (Right = Stretch); V does nothing.
   V "does nothing" mostly because the box is exactly as tall as its content — there is no spare height
   to move within. Report that honestly rather than calling it broken; ask Zeni whether V should be
   hidden where it cannot act.
   ⚠️ Don't edit files while an audit runs — Vite reloads the page and the run loses its widgets.

## Next steps
1. Finish the alignment items above, verify in the browser, commit the three files + the Text fix.
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
