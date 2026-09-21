# Handoff — 2026-09-21 19:15

## Read first
The last nine bullets of CLAUDE.md's **Key context**, just above `## Parked features`. They are this
week's Support Portal work and they build on each other — the banner ones especially:

1. an action card's **CORNER ARROW** is a glyph picker (+ `WidgetField.rest`, `PanelAccordion.bodyClass`)
2. **ADDING a banner asks the shape first** — the two-step dialog
3. the vertical banner **PINS IN PREVIEW ONLY** — read before touching anything sticky
4. a **BLANK page's content column IS the full page's**
5. **ADD SEVERAL AT ONCE** — and the temporal-dead-zone trap it exposed
6. **ONE gradient editor**, and the `bannerGradient` key with its fallback
7. **CHANGING the banner's layout lives in the banner's own panel**
8. the banner tiles are **PHOTOGRAPHS**, and eight banners are offered
9. one **Action Card** and one **KPI**, and they **GATHER**

Plus the **headless verification** bullet below them. Every measurement quoted here came from it.

## What we worked on this session
The Support Portal builder: the banner add/edit flow end to end (dialog, panel field, layouts,
tiles), the gradient editor, several layout and padding faults, and a palette change that replaced
the two card-block widgets with single cards that gather into a row.

## Completed
- **Corner arrow → icon picker + colour**; Shadow's group padding moved to `pt-2` to match.
- **Banner stage 1** — adding a banner asks Horizontal / Vertical, then that shape's layouts.
- **Changing a banner's layout** from its own panel, locked to the shape the page already has.
- **The editor no longer pins the banner**; the space under it is a hatched "Banner column" strip
  that refuses drops. Preview and the published portal still pin it.
- **A blank page's sections run end to end**, matching a template page exactly.
- **Add several at once** on from-scratch pages.
- **One gradient editor** for the banner's colour and the image's colour layer.
- **Banner tiles are real screenshots**, captured by `scripts/capture-banners.mjs`; eight horizontal
  banners offered, the industry filter gone, vertical tiles keep their page skeleton.
- **Action cards / KPI tiles → single Action Card + KPI that gather** into one section.
- **Edit details matches the create dialog's width** (1240px).
- **Three pre-existing faults fixed:** the `setTemplateCategory` ReferenceError, the floating toolbar
  escaping the canvas over both headers, and the logo upload writing to a key nothing read.

## In progress
Nothing is half-written in THIS repo.

⚠️ **Outstanding work in a DIFFERENT repo — `D:\Motadata\support-portal-templates`** (the 37-layout
gallery; own CLAUDE.md and HANDOFF.md, and `node build.js` must run after any edit to `layouts/`).
Asked for, investigated, not started:

1. **`layouts/3h.html` (Concierge)** — *Most Used Services* is a bare title over four free-standing
   tiles beside *Most Read*, which is one white card with a divided header. Put Most Used Services in
   the same white card, tint the service tiles to suit the theme, and make the two cards equal height
   (the row is `align-items:start` today, which is what lets them end differently).
2. **The Most Read icon colour, across all templates** — the glyph before the `KB-#` pill should take
   the pill's own colours, which differ per template:
   - already correct: `3b2`, `4e`, `3h2` (a bare glyph, already the pill's text colour)
   - need changing: `3h` (`#EEF0F2/#22262B` vs pill `#eff1f3/#5f6f83`), `4g` (`#E7EFFC/#1A4F96` vs
     pill `#f3f6fa/#4a5a70`), `2a` (same background, different glyph colour), `3c` (one digit apart)
   - no icon at all: `3c2`, `3g`, `5b`, `5c`, `6c`
   - ⚠️ **`2b` is an open question, asked and not answered:** its rows use a *per-article* coloured
     glyph (`{{ k.i }}` / `{{ k.fg }}`), so flattening them to the pill colour removes a deliberate
     design. Ask before changing it.

## Next steps
1. Answer the `2b` question, then do the two gallery jobs above.
2. **Banner stage 2** — width drag on the banner's inner edge, right-column section polish.
3. **Banner stage 3** — drag the banner between left and right.
4. Offered, not answered: the **topmost section's floating toolbar overlaps the portal's own header
   bar** inside the canvas. Bands at the top solve this with `toolbarBelow`.

## Decisions made
- **Tiles are photographs, with the drawings kept as the fallback** for the seventeen withheld
  templates — a drawn grid could not tell twenty-five banners apart.
- **Eight horizontal banners, one per arrangement** (three Prisms and two Mosaics were colourways of
  one shape). Withheld, never deleted.
- **The industry filter went** with the trim: over eight unlabelled tiles it could only hide banners,
  and four of six industries have no banner among the eight.
- **Changing a layout lives in the banner's panel; the Banners rail keeps both shape tabs** — the
  panel changes the design within a shape, the rail changes the shape.
- **The editor does not pin the banner; Preview does.**
- **One card added N times beats a block that holds N cards** — and they gather into one section.
- Earlier in the session: left/right banners only, scratch is a template, arrows are not in the shared
  icon catalogue, `bannerColor` follows the gradient's first stop.

## Gotchas & notes
- ⚠️ **A capture script must hide the editor's chrome FOR THE SHOT ONLY.** Hiding it for the whole
  run took the Delete button with it, and every later shot was of the wrong banner.
- ⚠️ **Vite only serves `public/` files that existed when the dev server started.** New assets 404
  (as index.html) until it is restarted — that cost twenty minutes of "why is the image blank".
- ⚠️ **Line endings in this repo are MIXED, within a single file.** A scripted multi-line edit must
  try BOTH `\n` and `\r\n` when matching an anchor.
- ⚠️ **A `useCallback` evaluates its dependency array during render** — a helper placed above the
  state it depends on is a temporal-dead-zone crash esbuild cannot see.
- ⚠️ **Anything `position: fixed` must clamp to the SCROLL PORT**, not to `[data-portal-canvas]` —
  that is the page card, and it scrolls.
- ⚠️ **What the user sees is the PUBLISHED build.** A feature built, verified and unpushed is a
  feature they will report as missing.
- ⚠️ **The Claude-in-Chrome browser serves a different copy of this project** (the `_Final` folder).
  Use the headless Playwright recipe in CLAUDE.md.
- A dev server may still be running at **http://127.0.0.1:5233/serviceops-ticket-detail/**.
