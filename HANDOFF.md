# Handoff — 2026-09-18 16:31

## Read first
Four bullets at the end of CLAUDE.md's **Key context**, just above `## Parked features`:

1. **an action card's CORNER ARROW is a glyph picker** — and the two general mechanisms it added
   (`WidgetField.rest`, `PanelAccordion.bodyClass`).
2. **ADDING a banner asks the shape first** — stage 1 of the banner work, and what stages 2 and 3
   still owe.
3. **the vertical banner PINS IN PREVIEW ONLY** — the `heroPinned` / `heroSticky` split and the
   reserved column. Read this one before touching anything sticky.
4. **a vertical banner's RIGHT COLUMN carries no page padding.**

Plus the **headless verification** bullet below them: `playwright-core` is in the npx cache, so UI
work here can be driven and screenshotted for real. Every measurement quoted in this handoff came
from it.

## What we worked on this session
The Support Portal builder: finishing the action card's corner arrow, then the first stage of the
vertical-banner feature — adding a banner, how its column behaves in the editor versus in Preview,
and the padding around the page beside it.

## Completed
- **Corner arrow → icon picker + colour.** *Corner arrow* (switch) → *Icon* → *Icon colour*. The
  icon opens the builder's own picker led by a new Arrows group, with no Image tab and no ✕. The
  colour is unstored until picked, so the mark keeps inheriting the card's title colour.
- **Shadow group `pt-1` → `pt-2`,** one shared `ShadowGroup`, so every sidebar moved together.
- **Banner stage 1.** Clicking *Banner* opens a two-step dialog — Horizontal / Vertical, then that
  orientation's layouts with **Start from scratch** first. Scratch is a `BannerTemplate` applied
  through the same path as every template. A vertical banner renders as a column on a blank page.
- **The editor no longer pins the banner.** It scrolls with the page; the space under it is a
  hatched **"Banner column"** strip that refuses drops and explains itself on hover. Preview and the
  published portal still pin it. Measured both ways.
- **The right column lost its page padding,** so the first section sits against the banner and the
  card inside keeps the section's own 24px.
- **Fixed a pre-existing ReferenceError** — `AdminSupportPortalModule` still called
  `setTemplateCategory('All')` in three places after that state was removed in `092feb4`.

## In progress
Nothing is half-written in THIS repo.

⚠️ **Outstanding work in a DIFFERENT repo — `D:\Motadata\support-portal-templates`** (the 37-layout
gallery; it has its own CLAUDE.md and HANDOFF.md, and `node build.js` must run after any edit to
`layouts/`). Asked for, investigated, not started:

1. **`layouts/3h.html` (Concierge)** — *Most Used Services* is a bare title over four free-standing
   tiles beside *Most Read*, which is one white card with a divided header. Put Most Used Services in
   the same white card, tint the service tiles inside it to suit the theme, and make the two cards
   equal height (the row is `align-items:start` today, which is what lets them end differently).
2. **The Most Read icon colour, across all templates** — the glyph before the `KB-#` pill should take
   the pill's own colours, which differ per template. Survey of the 13 layouts that have the card:
   - already correct: `3b2`, `4e`, and `3h2` (a bare glyph, already the pill's text colour)
   - need changing: `3h` (`#EEF0F2/#22262B` vs pill `#eff1f3/#5f6f83`), `4g` (`#E7EFFC/#1A4F96` vs
     pill `#f3f6fa/#4a5a70`), `2a` (same background, different glyph colour), `3c` (one digit apart)
   - no icon at all, nothing to do: `3c2`, `3g`, `5b`, `5c`, `6c`
   - ⚠️ **`2b` is an open question put to the user and not yet answered:** its Most Read rows use a
     *per-article* coloured glyph (`{{ k.i }}` / `{{ k.fg }}`), so flattening them to the pill colour
     would remove a deliberate design. Ask before changing it.

## Next steps
1. Answer the `2b` question, then do the two gallery jobs above.
2. **Banner stage 2** — width drag on the banner's inner edge (plus a Width field), and right-column
   section polish.
3. **Banner stage 3** — drag the banner between left and right.

## Decisions made
- **The editor does not pin the banner; Preview does.** This REPLACES this morning's "show the
  restriction only while dragging". A pinned screen-tall banner covers its own column at every scroll
  position, so the canvas hid the one thing the admin has to see. Now the editor shows the page as
  one scroll with the column visibly spoken for, and Preview shows the real behaviour.
- **Left or right only, no centre banner** — a centre banner means two narrow, separately-scrolling
  content columns.
- **Staged delivery, reviewed at each stage.**
- **Scratch is a template, not its own writes** — one applier, so the blank banner cannot miss the
  key-wiping or the search hairline the template path already does.
- **Arrows are not in the shared icon catalogue** — offered only to the field that asks for them.
- **The horizontal blank page keeps its padding** — the padding fix is scoped to the vertical column,
  because unscoping it would move every existing blank page.

## Gotchas & notes
- ⚠️ **The Claude-in-Chrome browser serves a different copy of this project** — one with no
  `src/app/routes.ts`, i.e. `D:\Motadata\ServiceOps-Ticket-Detail--main_Final\...`. The tell is the
  tab title: this build writes `"<Module> · Motadata ServiceOps"`, the old one says
  `"Ticket Listing & Full Detail page"`. Use the headless recipe instead.
- ⚠️ **A Playwright selector can collide with the page you are building.** Naming a test portal
  "Vertical Pad" made `getByRole('button', {name: /Vertical/})` match the page-title rename button
  and the run timed out on the dialog.
- ⚠️ **Bash heredocs here strip backslashes, and `node -e "..."` lets the shell eat `$` and
  backticks** — that silently produced `<div className={}>` in `SupportPortalPreview.tsx` this
  session. Write the replacement to a file first, or use `node <<'EOF'` with no backslashes.
- A dev server may still be running at **http://127.0.0.1:5233/serviceops-ticket-detail/**.
