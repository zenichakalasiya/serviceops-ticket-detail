# Handoff — 2026-09-18 17:02

## Read first
Five bullets at the end of CLAUDE.md's **Key context**, just above `## Parked features`:

1. **an action card's CORNER ARROW is a glyph picker** — and the two general mechanisms it added
   (`WidgetField.rest`, `PanelAccordion.bodyClass`).
2. **ADDING a banner asks the shape first** — stage 1 of the banner work, and what stages 2 and 3
   still owe.
3. **the vertical banner PINS IN PREVIEW ONLY** — the `heroPinned` / `heroSticky` split and the
   reserved column. Read this before touching anything sticky.
4. **a BLANK page's content column IS the full page's content column.**
5. **ADD SEVERAL AT ONCE, from-scratch pages only** — including the temporal-dead-zone trap that
   blanked the builder while the build stayed green.

Plus the **headless verification** bullet below them. Every number quoted here was measured with it.

## What we worked on this session
The Support Portal builder, all of it in the from-scratch flow: the action card's corner arrow,
adding a banner, how a vertical banner behaves in the editor versus Preview, the padding around a
blank page's sections, and a way to place several widgets at once.

## Completed
- **Corner arrow → icon picker + colour.** *Corner arrow* (switch) → *Icon* → *Icon colour*, with
  the builder's own picker led by a new Arrows group. Shadow's group padding moved to `pt-2` to match.
- **Banner stage 1.** Clicking *Banner* asks Horizontal / Vertical, then shows that orientation's
  layouts with **Start from scratch** first. Scratch is a `BannerTemplate` applied through the same
  path as every template.
- **The editor no longer pins the banner.** It scrolls with the page and the space under it is a
  hatched **"Banner column"** strip that refuses drops and explains itself. Preview still pins.
- **A blank page's sections run end to end**, identical to a template page's — measured 81 → 1062
  against a page of exactly 81 → 1062.
- **Add several at once.** On a from-scratch page, pick N widgets in the palette and they land one
  per row in the order picked.
- **Fixed a pre-existing ReferenceError** — `setTemplateCategory` in `AdminSupportPortalModule`.

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
2. **Banner stage 2** — width drag on the banner's inner edge, and right-column section polish.
3. **Banner stage 3** — drag the banner between left and right.
4. Offered and not yet answered: the **topmost section's floating toolbar overlaps the portal's own
   header bar** (true before this session too, since the toolbar is taller than the gap it had).
   Bands at the very top solve this with `toolbarBelow`; a first-on-the-page section could do the same.

## Decisions made
- **The editor does not pin the banner; Preview does.** This replaced an earlier "show the
  restriction only while dragging" call — a pinned screen-tall banner covers its own column at every
  scroll position, so the canvas hid the one thing the admin has to see.
- **A blank page's column matches the full page's, horizontally too.** This unscoped a deliberate
  exception from earlier the same day; the user asked for it once they saw the inconsistency.
- **Batch add is gated by a prop, not inferred** — a template page already has its shape.
- **The batch selects nothing and exits the mode** — no one thing is being edited afterwards, and a
  mode with no task left is how a later click lands somewhere nobody meant.
- **Left or right only, no centre banner**; **staged delivery**; **scratch is a template, not its own
  writes**; **arrows are not in the shared icon catalogue**.

## Gotchas & notes
- ⚠️ **Files in this repo are a MIX of LF and CRLF.** A multi-line anchor for a scripted edit must be
  joined with the file's own EOL — `SupportPortalAddPanel.tsx` is CRLF and a `\n`-joined anchor
  silently matches nothing. Detect with `s.includes('\r\n')` and join with that.
- ⚠️ **A `useCallback` evaluates its dependency array during render**, so a helper placed above the
  state it depends on is a temporal-dead-zone crash that esbuild cannot see. It blanked the builder
  this session; a `pageerror` listener caught it in seconds.
- ⚠️ **The Claude-in-Chrome browser serves a different copy of this project** — one with no
  `src/app/routes.ts` (the `_Final` folder). Use the headless recipe in CLAUDE.md instead.
- ⚠️ **A Playwright selector can collide with the page you are building** — naming a test portal
  "Vertical Pad" made `getByRole('button', {name: /Vertical/})` match the page-title rename button.
- ⚠️ **Bash heredocs here strip backslashes, and `node -e "..."` lets the shell eat `$` and backticks.**
  Write the replacement to a file first, or use `node <<'EOF'` with no backslashes.
- A dev server may still be running at **http://127.0.0.1:5233/serviceops-ticket-detail/**.
