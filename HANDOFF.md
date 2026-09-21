# Handoff — 2026-09-21 18:33

## Read first
The last seven bullets of CLAUDE.md's **Key context**, just above `## Parked features` — they are
this week's Support Portal work and they build on each other:

1. **an action card's CORNER ARROW is a glyph picker** — plus the two general mechanisms it added
   (`WidgetField.rest`, `PanelAccordion.bodyClass`).
2. **ADDING a banner asks the shape first** — the two-step dialog, and what banner stages 2 and 3
   still owe.
3. **the vertical banner PINS IN PREVIEW ONLY** — the `heroPinned` / `heroSticky` split and the
   reserved column. Read this before touching anything sticky.
4. **a BLANK page's content column IS the full page's content column.**
5. **ADD SEVERAL AT ONCE, from-scratch pages only** — including the temporal-dead-zone trap that
   blanked the builder while the build stayed green.
6. **ONE gradient editor** for the banner's colour and the image's colour layer, and the
   `bannerGradient` key with its fallback.
7. **CHANGING the banner's layout lives in the banner's own panel** — the newest, and the one that
   answers "where do I change this later".

Plus the **headless verification** bullet below them. Every number and state quoted here was
measured with it.

## What we worked on this session
The Support Portal builder, end to end on the from-scratch flow: the action card's corner arrow, the
banner add/edit flow, how a vertical banner behaves in the editor versus Preview, padding, placing
several widgets at once, and one gradient editor for both places a gradient is set.

## Completed
- **Corner arrow → icon picker + colour**, and Shadow's group padding moved to `pt-2` to match.
- **Banner stage 1** — adding a banner asks Horizontal / Vertical, then that shape's layouts with
  **Start from scratch** first.
- **The editor no longer pins the banner**; the space under it is a hatched **"Banner column"** strip
  that refuses drops. Preview and the published portal still pin it.
- **A blank page's sections run end to end**, matching a template page exactly (81 → 1062).
- **Add several at once** — pick N widgets on a from-scratch page, each lands in its own row.
- **One gradient editor** for the banner's colour and the image's colour layer, with `bannerGradient`
  falling back to the legacy side/start/end keys so nothing repaints until it is edited.
- **Change the banner's layout from its own panel** — a drawn "Banner layout" row above Height that
  opens the same picker locked to the shape already on the page.
- **Fixed two pre-existing faults:** the `setTemplateCategory` ReferenceError in
  `AdminSupportPortalModule`, and the floating toolbar escaping the canvas over both headers
  (`ToolbarSlot` now clamps to the scroll port, not the page card).

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
   header bar** inside the canvas. Bands at the very top solve this with `toolbarBelow`; a
   first-on-the-page section could do the same.

## Decisions made
- **Changing the layout lives in the banner's panel; the Banners rail keeps both shape tabs.** Two
  jobs, two surfaces: the panel changes the DESIGN within the shape you chose, the rail changes the
  SHAPE. Nothing that worked before was taken away.
- **The editor does not pin the banner; Preview does.** A pinned screen-tall banner covers its own
  column at every scroll position, so the canvas hid the one thing the admin has to see.
- **A blank page's column matches the full page's, horizontally too.**
- **Batch add is gated by a prop, selects nothing, and exits its mode afterwards.**
- **One gradient editor, and `bannerColor` follows the first stop** — it paints under the gradient,
  it is what the Solid tab shows, and the thumbnails read it to judge whether a banner is dark.
- **Left or right only, no centre banner**; **scratch is a template, not its own writes**; **arrows
  are not in the shared icon catalogue**.

## Gotchas & notes
- ⚠️ **Line endings in this repo are MIXED — within a single file.** A scripted multi-line edit must
  try BOTH `\n` and `\r\n` when matching an anchor; `SupportPortalBuilder.tsx` has blocks of each,
  and an anchor joined with the wrong one silently matches nothing.
- ⚠️ **A `useCallback` evaluates its dependency array during render**, so a helper placed above the
  state it depends on is a temporal-dead-zone crash that esbuild cannot see.
- ⚠️ **`overflow-x-visible` beside `overflow-y-auto` does nothing**, and anything `position: fixed`
  needs clamping to the SCROLL PORT, not to `[data-portal-canvas]` (that is the page card, which
  scrolls).
- ⚠️ **The Claude-in-Chrome browser serves a different copy of this project** (the `_Final` folder,
  which has no `src/app/routes.ts`). Use the headless Playwright recipe in CLAUDE.md.
- ⚠️ **A Playwright selector can collide with the page you are building** — naming a test portal
  "Vertical Pad" made `getByRole('button', {name: /Vertical/})` match the page-title rename button.
- ⚠️ **What the user sees is the PUBLISHED build.** A feature that is built, verified and unpushed is
  a feature they will report as missing — as happened with the Banner layout field this session.
- A dev server may still be running at **http://127.0.0.1:5233/serviceops-ticket-detail/**.
