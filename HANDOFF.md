# Handoff — 2026-09-18 16:04

## Read first
Three bullets at the end of CLAUDE.md's **Key context**, added this session and sitting just above
`## Parked features`:

1. **an action card's CORNER ARROW is a glyph picker** — the panel change, and the two general
   mechanisms it introduced (`WidgetField.rest`, `PanelAccordion.bodyClass`).
2. **ADDING a banner asks the shape first** — stage 1 of the banner work, and what stages 2 and 3
   still owe.
3. **You CAN drive the real app headlessly** — the Playwright recipe, and the warning that a browser
   may be serving the old `_Final` copy of this project.

## What we worked on this session
Two Support Portal builder jobs: finishing the action card's corner arrow (it shipped that morning
with three fixed glyph buttons), and starting the vertical-banner feature — which begins with asking
what kind of banner is being added at all.

## Completed
- **Corner arrow → icon picker + colour.** The Arrow group is now *Corner arrow* (switch) → *Icon* →
  *Icon colour*. Icon opens the builder's own picker, led by a new **Arrows** group and with no Image
  tab; there is no ✕ on it (the switch is the off switch). Colour is unstored until picked, so the
  mark keeps inheriting the card's title colour, and the swatch shows the grey it is actually
  painting. `arrowGlyph` is gone; `arrowIcon` + `arrowColor` replace it.
- **Two general additions** that came out of it: `WidgetField.rest` (what a colour control paints
  while nothing is stored) and `PanelAccordion.bodyClass`.
- **Shadow group `pt-1` → `pt-2`.** One shared `ShadowGroup`, so every sidebar that shows Shadow
  moved together, and it now matches the Arrow group exactly. The rule: a group whose first row is a
  switch takes `pt-2`.
- **Banner stage 1.** Clicking **Banner** in the palette opens a two-step dialog — Horizontal /
  Vertical, then that orientation's layouts with an Industry filter and **Start from scratch** first.
  Scratch = plain white band, dark ink, heading + sub-heading + search, applied through the same
  `applyBannerTemplate` path as every template. A **vertical banner now renders as a column on a
  blank page**, with its own invitation in the right column. Verified in a real browser: 420 × 806px,
  `position: sticky`, right column takes sections beside it, panel opens on the banner's settings.
- **Fixed a pre-existing ReferenceError.** `AdminSupportPortalModule.tsx` still called
  `setTemplateCategory('All')` in three places after that state was removed in `092feb4` — it fired
  on closing the create dialog and on *Start from scratch*. esbuild cannot see it; a `pageerror`
  listener caught it.

## In progress
Nothing is half-written — stage 1 is complete and building. The banner feature itself is staged, and
the user asked to review each stage before the next starts.

Files this feature lives in: `PortalBannerStart.tsx` (new — the dialog),
`portalBannerTemplates.ts` (`scratchBanner`, `SCRATCH_BANNER_ID`), `PortalBannersPanel.tsx` (the
exported tiles), `SupportPortalBuilder.tsx` (`startBanner`, `applyBannerTemplate` widened to take a
template, `x-banner` in `addElement`), `SupportPortalPreview.tsx` (the blank branch's two-column row
and the right column's invitation).

## Next steps
1. **Stage 2 — the vertical banner as a real layout.** Width drag on the banner's inner edge (plus a
   Width field), screen height and sticky on every vertical path rather than only the ones a template
   sets, and the right column's unlimited rows/sections polish.
2. **Stage 3 — placement and the restriction.** Drag the banner between left and right; the
   restricted area shown **while dragging a widget** (hatch + reason + refused drop), not as a
   permanent grey strip.
3. Check the three new CLAUDE.md bullets still read true once stages 2 and 3 land.

## Decisions made
- **Left or right only, no centre banner.** A centre banner means two narrow, separately-scrolling
  content columns, so a row could never span the page and "add a section" would have to ask which
  side. Confirmed with the user.
- **The restricted area appears while dragging, not permanently.** A sticky, screen-tall banner
  covers its whole column at every scroll position, so a greyed strip beneath it could never actually
  be seen. The rule is shown at the only moment it matters. Confirmed with the user.
- **Staged delivery, reviewed at each stage.** Confirmed with the user.
- **Scratch is a template, not its own set of writes** — one applier, so the blank banner cannot miss
  the key-wiping or the search hairline the template path already does.
- **Arrows are not in the shared icon catalogue** — they are offered only to the field that asks for
  them, so no other picker in the builder grows six rows it has no use for.

## Gotchas & notes
- ⚠️ **The Claude-in-Chrome browser was serving a different copy of this project** — one with no
  `src/app/routes.ts`, i.e. `D:\Motadata\ServiceOps-Ticket-Detail--main_Final\...`. The tell is the
  tab title: this build writes `"<Module> · Motadata ServiceOps"`, the old one says
  `"Ticket Listing & Full Detail page"`. Don't debug your own change until you have checked which
  server the browser is on.
- ✅ **Headless verification works and is worth using.** `playwright-core` is in the npx cache and
  Chrome is installed — see the CLAUDE.md bullet for the import (it must be a `file://` URL) and the
  click path to a blank builder page. A `pageerror` listener is what turns a silent ReferenceError
  into a line of output.
- ⚠️ **Bash heredocs here strip backslashes, and `node -e "..."` lets the shell eat `$` and
  backticks.** A `node -e` edit silently produced `<div className={}>` in `SupportPortalPreview.tsx`
  this session. Write the replacement text to a file first, or use `node <<'EOF'` with no backslashes.
- A dev server may still be running on **http://127.0.0.1:5233/serviceops-ticket-detail/** from this
  session's verification.
