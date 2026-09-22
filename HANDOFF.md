# Handoff — 2026-09-22 11:26

## Read first
The last **six** bullets of CLAUDE.md's **Key context**, just above `## Parked features`. They are
this session's Support Portal work, newest last, and two of them changed load-bearing machinery:

1. the banner's bottom edge **STOPS at 260** (`MIN_BANNER_H`)
2. the banner's **"+" offers the single card and KPI**, with their own icons, under the button
3. **cards GATHER on the banner**, and a gathered row is ONE section — the new `g: true` group node
4. **Contact Us** can put its two lines on one line
5. **ONE renderer per live data card** — the page block and a placed copy are the same component
6. the **layout gallery's themes**, with tones computed from the main colour (`portalTone.ts`)

(3) and (5) are the ones to read before touching anything nearby: (3) added a node kind to the
banner tree that every rebuild has to carry, and (5) deleted a whole second set of renderers.

## What we worked on this session
The Support Portal builder, end to end: four fixes reported from the canvas (banner height, the
banner's add popup, Contact Us, and placed data cards not matching the default page's), one feature
that came out of a question I raised (cards gathering on the banner), and one new subsystem — the
theme system rebuilt from the layout gallery's own palettes.

## Completed
- **The banner stops at its smallest height.** South/north drags floor at `MIN_BANNER_H` (260, the
  rail's S stop) and the band takes a dragged height over the rail's. Before: a 500px up-drag from
  540 left a **40px wrapper around a 260px band**, with the action cards 282px up inside the banner.
- **The banner's `+`** offers `x-action-card` / `x-kpi` instead of the withheld blocks, draws each
  element's own icon, and opens **8px under the button** (measured 230 for a button whose bottom is
  222) instead of past the banner's bottom (449).
- **Cards gather on the banner.** A second Action Card or KPI joins the first's GROUP — one section
  however many cards are in it. Four land in one row at 243px each, the row survives a preset, a
  fifth is refused with the row cap, and deleting to one card hands the section back.
- **Contact Us — "One line"**, a Content field: phone and email as one sentence joined by a middot,
  no icons. Stacked stays the default and is untouched.
- **One renderer per live data card.** `requestsBody(id)` / `approvalsBody(id)` / `knowledgeBody(id)`
  plus `RecordTiles`, handed to placed elements through `PlacedBlockRenderers`; the five copies in
  `PortalCollectionRender` are deleted. Verified by placing all five on a scratch page and diffing
  against the default page: **identical innerText, pill colours, badge totals and card face**.
- **The theme system is the layout gallery's.** Eight themes, one per hue family, with `portalTone.ts`
  deriving wash / soft / line / ink from the main colour and the page painting its ID pills, icon
  badges, asset tiles and ground from them. Live: editing the primary or the page bg re-tones in the
  same frame.

## In progress
Nothing mid-flight in this repo. Every change above is committed, pushed and documented.

## Next steps
1. **Offered and not taken up — tint Clarity's page too.** Clarity (the product default) still has a
   WHITE page while the seven gallery themes bring a ground tint, deliberately, so no existing portal
   repaints. One line in `PALETTES` if the user wants it toned.
2. **Offered and not taken up — icons on a one-line Contact Us.** Currently "One line" drops them; a
   third option rather than a second axis if they want them back.
3. ⚠️ **Outstanding work in a DIFFERENT repo — `D:\Motadata\support-portal-templates`** (the 37-layout
   gallery; own CLAUDE.md, and `node build.js` after any edit to `layouts/`). Carried from the last
   handoff, still not started:
   - `layouts/3h.html` (Concierge) — Most Used Services into the same white card as Most Read, tint
     the tiles, make the two cards equal height (the row is `align-items:start` today).
   - The Most Read icon colour — `3h`, `4g`, `2a`, `3c` need changing; `3c2`/`3g`/`5b`/`5c`/`6c` have
     no icon; ⚠️ **`2b` is a question asked twice now and still unanswered** — its rows use a
     *per-article* coloured glyph, so flattening it to the pill colour deletes a deliberate design.
4. **Banner stage 2** — width drag on the banner's inner edge, right-column section polish.
5. **Banner stage 3** — drag the banner between left and right.
6. Still offered, still unanswered: the topmost section's floating toolbar overlaps the portal's own
   header bar inside the canvas (`toolbarBelow` is how bands solve it).

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
- **Clarity is unchanged and stays first**, page still white: it is what every portal already built
  is on, and swapping it would repaint every existing page for a reason nobody asked for.
- **Tones are COMPUTED, not authored.** An authored set would keep painting the old hue after the
  admin edits the primary, with no control on screen explaining why.
- **The five duplicate renderers were DELETED, not left as a fallback** — a dead second
  implementation is exactly what caused the drift being fixed.
- **One line drops the Contact Us icons**, as part of the layout rather than a second switch: a
  separate toggle would permit "icon value · icon value", a separator and a glyph answering one
  question.

## Gotchas & notes
- ⚠️ **A group node must be carried by EVERY tree rebuild** in `portalBannerLayout` (prune, flat,
  mergeWords, replaceLeaf, flipRoot, shiftLeaf, swapLeaves, removeLeaf, setBannerBoxDir). One missed
  call site silently dissolves the group. `flat` must NOT dissolve one into its parent, and the
  existing "a branch left holding one child becomes that child" line is what retires it.
- ⚠️ **`BANNER_SIDE_WIDGETS` renders its own rows and bypasses the catalogue's `hidden` flag.** That
  is how the banner went on offering two withheld blocks for weeks. Anything hidden from the palette
  has to be removed from that list too.
- ⚠️ **A JSX comment `{/* … */}` is only valid INSIDE JSX.** Put one as the first thing after
  `return (` or inside `{cond && ( … )}` and the file will not parse. This bit twice today.
- ⚠️ **Git Bash heredocs strip backslashes** (already in CLAUDE.md) — and that includes the escaped
  backticks in a JS template literal, which breaks the script in a way that reads as a shell error.
  Write edit scripts with the Write tool, not a heredoc, whenever they contain backticks.
- ⚠️ A theme tone is passed as the **base** style (`{...baseStyle, ...styleOf}` in `Sel`; spread
  before `iconBoxCss`) so an admin's own fill still wins. Reversing the order silently overrules
  their choice.
- The pre-existing `TS1117` duplicate key is at **portalWidgetSpec.ts:921** today — it moves with
  every edit above it, so grep for `fields: [], packs: []` rather than trusting the number.
- Verification all session was the **headless Playwright recipe** in CLAUDE.md (the import must be a
  `file://` URL). Every number quoted above was measured in the real builder on localhost:5200.
- A dev server is running at **http://localhost:5200/serviceops-ticket-detail/**.
