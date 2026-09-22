# Handoff — 2026-09-22 13:15

## Read first
The last **seven** bullets of CLAUDE.md's **Key context**, just above `## Parked features`. They are
this session's Support Portal work, newest last:

1. the banner's bottom edge **STOPS at 260** (`MIN_BANNER_H`)
2. the banner's **"+" offers the single card and KPI**, with their own icons, under the button
3. **cards GATHER on the banner**, and a gathered row is ONE section — the new `g: true` group node
4. **Contact Us** can put its two lines on one line
5. **ONE renderer per live data card** — the page block and a placed copy are the same component
6. the **layout gallery's themes**, with tones computed from the main colour (`portalTone.ts`)
7. the **page's GROUND follows the theme** — two hard-coded surfaces were painting over it

(3) and (5) are the ones to read before touching anything nearby: (3) added a node kind to the
banner tree that every rebuild has to carry, and (5) deleted a whole second set of renderers.
(6) and (7) are one subsystem — read them together.

## What we worked on this session
The Support Portal builder, end to end: five fixes reported from the canvas (banner height, the
banner's add popup, Contact Us, placed data cards not matching the default page, and the page
background not following the theme), one feature that came out of a question I raised (cards
gathering on the banner), and one new subsystem — the theme system rebuilt from the layout gallery.

## Completed
- **The banner stops at its smallest height.** South/north drags floor at `MIN_BANNER_H` (260) and
  the band takes a dragged height over the rail's. Before: a 500px up-drag from 540 left a **40px
  wrapper around a 260px band**, with the action cards 282px up inside the banner.
- **The banner's `+`** offers `x-action-card` / `x-kpi` instead of the withheld blocks, draws each
  element's own icon, and opens **8px under the button** (230 for a button whose bottom is 222)
  instead of past the banner's bottom (449).
- **Cards gather on the banner.** A second Action Card or KPI joins the first's GROUP — one section
  however many cards are in it. Four land in one row at 243px each, the row survives a preset, a
  fifth is refused with the row cap, and deleting to one card hands the section back.
- **Contact Us — "One line"**: phone and email as one sentence joined by a middot, no icons.
  Stacked stays the default and is untouched.
- **One renderer per live data card.** `requestsBody(id)` / `approvalsBody(id)` / `knowledgeBody(id)`
  plus `RecordTiles`, handed to placed elements through `PlacedBlockRenderers`; the five copies in
  `PortalCollectionRender` are deleted. Verified by placing all five on a scratch page and diffing
  against the default page: **identical innerText, pill colours, badge totals and card face**.
- **The theme system is the layout gallery's.** Eight themes, one per hue family, with `portalTone.ts`
  deriving wash / soft / line / ink from the main colour and the page painting its ID pills, icon
  badges, asset tiles and ground from them.
- **The page's ground follows the theme.** `SupportPortalPreview`'s root (`bg-white`) and the content
  column (`bg-[#F4F6FA]`) were both painting over the theme's page colour — the second is the
  surface an admin means by "the page background". Both read `var(--portal-page-bg, …)` now.
  Verified: Clarity `rgb(244,246,250)` unchanged, Broadside `rgb(250,246,239)`, Prism Green
  `rgb(244,249,246)`, Vault `rgb(244,246,251)`, Prism Coral `rgb(252,247,246)`, and typing `#DCE8F5`
  into the picker → `rgb(220,232,245)` in the same frame.

## In progress
Nothing mid-flight in this repo. Every change above is committed, pushed and documented.

## Next steps
1. **Offered and not taken up — icons on a one-line Contact Us.** "One line" drops them today; a
   third option rather than a second axis if the user wants them back.
2. ⚠️ **Outstanding work in a DIFFERENT repo — `D:\Motadata\support-portal-templates`** (the 37-layout
   gallery; own CLAUDE.md, and `node build.js` after any edit to `layouts/`). Carried from two
   handoffs ago, still not started:
   - `layouts/3h.html` (Concierge) — Most Used Services into the same white card as Most Read, tint
     the tiles, make the two cards equal height (the row is `align-items:start` today).
   - The Most Read icon colour — `3h`, `4g`, `2a`, `3c` need changing; `3c2`/`3g`/`5b`/`5c`/`6c` have
     no icon; ⚠️ **`2b` is a question asked twice now and still unanswered** — its rows use a
     *per-article* coloured glyph, so flattening it to the pill colour deletes a deliberate design.
3. **Banner stage 2** — width drag on the banner's inner edge, right-column section polish.
4. **Banner stage 3** — drag the banner between left and right.
5. Still offered, still unanswered: the topmost section's floating toolbar overlaps the portal's own
   header bar inside the canvas (`toolbarBelow` is how bands solve it).
6. Worth a look now that the ground is themed: the **page background IMAGE** works for the first
   time (it was under the same white). Nobody has designed with it yet.

## Decisions made
- **Cards gather on the banner** (asked, chosen): a second card joins the first's row rather than
  spending another of the four section slots — matching the page's own GATHERING rule.
- **A gathered row is ONE section.** The banner tree gained `g: true`; `unitsOf()` is what the cap
  counts and what the presets arrange. Without it four cards filled a four-section banner.
- **Eight themes, one per hue family** (asked, chosen), curated from the gallery's 37 layouts.
- **Secondary is NOT themed** (asked, chosen): it is the status language, and an Open pill in
  Broadside's brown stops saying "waiting".
- **Amber is not a theme.** Concierge's `#F2A81D` is 1.85:1 on white — every link and button label
  built from it would be unreadable.
- **Tones are COMPUTED, not authored.** An authored set would keep painting the old hue after the
  admin edits the primary, with no control on screen explaining why.
- **Clarity's `pageBg` is `#F4F6FA`, not white.** It started as white to avoid repainting anything;
  once the page's ground read that slot, white became the value that WOULD repaint every portal.
  The correction is the whole reason the default still looks identical.
- **The five duplicate renderers were DELETED, not left as a fallback** — a dead second
  implementation is exactly what caused the drift being fixed.
- **One line drops the Contact Us icons**, as part of the layout rather than a second switch.

## Gotchas & notes
- ⚠️ **A group node must be carried by EVERY tree rebuild** in `portalBannerLayout` (prune, flat,
  mergeWords, replaceLeaf, flipRoot, shiftLeaf, swapLeaves, removeLeaf, setBannerBoxDir). One missed
  call site silently dissolves the group. `flat` must NOT dissolve one into its parent.
- ⚠️ **`BANNER_SIDE_WIDGETS` renders its own rows and bypasses the catalogue's `hidden` flag.** That
  is how the banner went on offering two withheld blocks for weeks.
- ⚠️ **A hard-coded colour beats a theme, silently.** Two of them hid the page colour AND the page
  image for as long as both have existed. When adding a surface, ask what paints it and whether the
  theme can reach it — `var(--portal-page-bg, <the colour it is today>)` is the pattern.
- ⚠️ **A JSX comment `{/* … */}` is only valid INSIDE JSX.** Put one as the first thing after
  `return (` or inside `{cond && ( … )}` and the file will not parse. This bit twice today.
- ⚠️ **Git Bash heredocs strip backslashes** (already in CLAUDE.md) — including the escaped backticks
  in a JS template literal, which breaks the script in a way that reads as a shell error. Write edit
  scripts with the Write tool whenever they contain backticks.
- ⚠️ A theme tone is passed as the **base** style (`{...baseStyle, ...styleOf}` in `Sel`; spread
  before `iconBoxCss`) so an admin's own fill still wins.
- ⚠️ **Sample the right pixel when checking a background.** Measuring 30px left of a widget heading
  landed on the portal's own white rail and made a working fix look broken — the page ground is the
  gap BETWEEN two sections.
- The pre-existing `TS1117` duplicate key is at **portalWidgetSpec.ts:921** today — it moves with
  every edit above it, so grep for `fields: [], packs: []` rather than trusting the number.
- Verification all session was the **headless Playwright recipe** in CLAUDE.md (the import must be a
  `file://` URL). Every number quoted above was measured in the real builder on localhost:5200.
- A dev server is running at **http://localhost:5200/serviceops-ticket-detail/**.
