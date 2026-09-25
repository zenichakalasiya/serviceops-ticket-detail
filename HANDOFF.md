# Handoff — 2026-09-25 16:22

## Read first
All work is in the **Support Portal builder**. In `CLAUDE.md` › Key context, read the bullets
dated **25 Sep 2026**, newest last:

1. *"EVERY SPACING SIDE IS px"* and *"SPACING is ONE control: two fields, and the LINK is the
   disclosure"* — the spacing decision is settled (Two fields won; Four sides is deleted).
2. *"the banner's BACKGROUND is ONE button with two tabs"* and *"the fifth 4-section arrangement
   and the banner's Column widths are gone"*.
3. *"EVERY floating toolbar is WHITE, and that is a DECISION"* — the dark action-card bar was
   tried and reverted; the `--bar-*` variables stay on purpose.
4. *"the move arrows are the `…ToLine` pair, and the colour picker is COMPACT"* — the last change.

## What we worked on this session
A long afternoon of tightening the builder's controls: spacing, the banner's bar and background,
toolbar colour and icons, theme/font rows, and finally the move arrows and a smaller colour
picker. The work ran across two terminals; the second one picked up the last prompt after the
first hit its usage limit.

## Completed
- **Spacing is px on every side** (templates' % insets converted so no banner moved), shown as
  two fields per ring; breaking a link opens the four sides. Four-sides design deleted.
- **Banner**: its look (border, corners, background) lives on its toolbar; background is one
  paint-bucket button with Image · Colour tabs; the colour layer over an image is linear only;
  the fifth 4-section arrangement and the Column widths picker were removed.
- **Section count** is a numeric row again (Default · 2 · 3 · 4), Default = words only; the
  change-layout dialog drops the shape description; arrangement tiles are smaller.
- **Toolbars are all white** (a dark action-card bar was tried and reverted). Data tiles
  (My Assets / My CIs / services) now get a toolbar, and their Icon group moved onto it.
- **Theme and font rows** are one surface each — the row is the sample.
- **Move arrows** on the floating toolbar are lucide `ArrowLeftToLine` / `ArrowRightToLine`
  (the right one is lucide's own mirror of the left), plus the matching Up/Down pair — verified
  in a real browser.
- **Colour picker** shrunk from ~286×470 to 224×332 with nothing removed; the eyedropper is an
  icon beside the live colour. Everything above is on `main` and deployed.

## In progress
Nothing mid-flight.

## Next steps
1. Zeni to eyeball the new move arrows and the compact colour picker on `:5200` (hard refresh).
2. Decide whether the *Remove sections* list should say "Quick links" instead of "Custom Card"
   (it names sections via `nodeById`; the banner's `+` relabels `x-card` as "Quick links").
3. `useRestingSpacing` only looks one level in, so Announcements' spacing fields read 0 on every
   side — needs a real fix, not a wider search.
4. Still outstanding in the layout-gallery repo `D:\Motadata\support-portal-templates`:
   `layouts/3h.html` (Concierge) card work, and the Most Read icon colour (`2b` is an open
   question).

## Decisions made
- **One toolbar surface, white.** A dark bar forces its popups dark too, and those popups hold
  swatches and previews of a white page — two surfaces again.
- **Move-right is lucide's own `ArrowRightToLine`, not a CSS-flipped left arrow** — they are exact
  mirrors, and CSS flipping would also flip stroke caps/joins off-grid.
- **All four move arrows changed**, so one button is never drawn two ways depending on its
  parent's axis.
- **The picker keeps every part**; it got smaller rather than losing sections.
- **Spacing: Two fields, px only**, link-as-disclosure (Zeni's call).

## Gotchas & notes
- **Commit named files only — never `git add -A`.** The tree carries untracked design sources,
  screenshots and `docs/duda/` that are deliberately not in the public repo.
- **A second terminal's transcript lives under `~/.claude/projects/…`** (not `.claude-pro`); the
  one from today is ~660 MB, so read it with `tail -c` rather than whole.
- **Bash heredocs are unreliable here** — use the Write tool for anything with backticks, `${}`
  or backslashes.
- **`npm run build` is esbuild only.** Typecheck touched files with the `pnpm dlx tsc` line in
  CLAUDE.md and drive the builder headlessly (Playwright recipe in CLAUDE.md). A fresh throwaway
  dev server can take >30s on first load — the first `goto` may time out.
- **Pre-existing typecheck noise**: `PortalCanvas.tsx` reports `splitNode` / `splitInfo` missing
  from `CanvasCtx`, and `portalWidgetSpec.ts` has a TS1117 duplicate key. Ignore both.
