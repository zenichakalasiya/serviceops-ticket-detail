# Handoff — 2026-09-08 12:58

## Read first

`CLAUDE.md` → the **Support Portal** bullets, and specifically the four new ones just above
`## Parked features`: the banner-as-palette-element model, the logo config fix, the element-picker
placement, and the table cell menu. Everything this session touched is described there.

If you are picking up the banner work, also read the **Template LOOKS** bullet — `bannerType` is one
more page-level look key and follows the same "seeds, not a second renderer" rule.

## What we worked on this session

The Support Portal builder, almost entirely. The headline is that a **from-scratch portal can now get
a banner**: Banner and Search are palette elements, the banner has a *type* (Regular / With card /
With image) that genuinely changes the band, and its height is a labelled rail. Around that, a run of
smaller fixes to the canvas picker, the logo, the table cell menu, the Branding panel and some copy.

## Completed

All of this is committed and pushed; `main` matched `origin/main` at the start of this wrap-up.

- **Banner + Search in the Widgets palette (Data group)** — `x-banner` / `x-search`, both predefined
  (one to a page, ticked once placed). A blank page seeds `removed: ['hero']`, so placing the Banner
  un-removes it; that one flag drives the tick, the canvas and delete.
- **Banner Type** — `regular` / `card` / `image`, drawn as a picker in DESIGN → Banner. It turns the
  hero's content block into two columns, and the card slot is a real drop target (`RowDrop` on the
  `hero` row) with a 1-or-2 column control and a dashed empty state.
- **Banner Height is a step rail** — four stops, S · M · L · XL, values unchanged (180/260/360/480).
- **Search-once rule** — the palette's Search *is* the banner's `showSearch`. It refuses with a
  reason when there is no banner, and the row comes back if you turn the banner's search off.
- **Element picker placement rewritten** — portalled to the body, viewport-clamped, and it opens
  above the toolbar instead of on top of the section you are filling. Verified unclipped and clear of
  the target at 1600×900, 1440×800, 1280×720, 1000×700 and 900×620.
- **Logo Light/Dark tabs**, and the pre-existing wiring bug behind them: the logo panel wrote to a key
  the header never read, so **uploading a logo had never done anything**. Fixed via `ownerOf` +
  `specForNode`; the light mark renders now and the dark one swaps with the theme.
- **Per-cell header toggle removed** from the table cell menu (it was a fourth writer with a
  different unit and could put a `th` mid-table).
- **Identity Provider removed** from the Branding panel — it is per-portal and Edit details already
  asks it. Only the control went; `PortalPage.idp` is untouched.
- **Copy** — Widgets panel, Support Portal head, Branding panel one-liners.
- **Custom Data Widget audit** — checked the whole panel against
  `docs/custom-data-widget-reference.md` (read off Juli's build) in source *and* live. Modules,
  defaults, all six filter lists and the module-change behaviour match exactly.

## In progress

Nothing mid-flight — the tree is clean and everything builds. But the banner brief is **not fully
delivered**; see the first two Next steps.

## Next steps

1. **Restrict what the banner card slot accepts.** You asked for *Announcements, Contact Us and
   action cards*; the slot currently takes **any** element from the palette. The gate belongs in
   `dropInRow` for `rowId === 'hero'` (the one funnel drag and click-to-add both pass through), and
   it should refuse with the reason rather than silently ignoring the drop.
2. **`No filter — every record` is not a pickable row** in the Custom Data Widget's filter dropdown.
   The reference opens every module's list with it; ours has the *state* (it is what the field reads
   after a module change) but no row to click. ~5 lines in `PortalRecordFilter.tsx`.
3. Optional, flagged in conversation: per-service icons on the service tiles (the reference shows a
   laptop / download glyph, ours shows the same cart on every tile). That needs a name→icon map over
   mock data, so it was left alone rather than guessed.

## Decisions made

- **The Banner is page chrome, not a placed element.** It restores the page's own band rather than
  dropping a stand-in into a column — a banner inside a section would not be the full-width band
  every reference portal opens with, and none of its controls would reach it.
- **`removed` carries "is there a banner"** instead of a new flag, so nothing can drift out of step.
- **`heroBand` became a const** placed in both halves of the blank/non-blank ternary, rather than
  duplicating 225 lines of JSX. Committed separately (`28ada10`) as a verified no-op refactor.
- **The logo pair reuses the existing `dark:<key>` convention** rather than a `logoSrcDark` of its
  own. I wrote the second mechanism first and threw it away — `cfgFor` already promotes `dark:` keys,
  so reusing it meant **no renderer changed at all**.
- **Height is a rail, not tabs**, because it is an ordered axis; four buttons said "four unrelated
  choices" and wrapped at narrow panel widths.
- **Identity Provider left Branding rather than being duplicated** — Branding is org-wide, sign-on is
  per-portal, and Edit details owns it.

## Gotchas & notes

- ⚠️ **The dev server was not running at wrap-up.** Two background `npm run dev` tasks were stopped
  during the session. Start one with `npm run dev -- --port 5200` — the project's port, and the URL
  needs the `/serviceops-ticket-detail/` base or it 404s.
- ⚠️ **Two Playwright MCP browser instances deadlocked** over one Chrome profile mid-session
  ("Browser is already in use"). Fixed by killing only the `ms-playwright-mcp` processes; they
  relaunch on the next call and your own Chrome is untouched.
- ⚠️ **Stale bundles bit twice.** New spec/branch code looked inert until a hard reload — the
  `x-banner` branch in `addElement` appeared broken and was fine. Hard-refresh before judging any new
  widget or palette behaviour.
- ⚠️ `split().join()` replaces **every** match. An anchor that looked unique to Announcements also hit
  Contact Us and gave it a prop its scope had no name for — a runtime `ReferenceError` that blanked
  the page, which esbuild passed. Anchor on something unique, or count the hits first.
- ⚠️ Pre-existing typecheck noise, all on `main`, all safe to ignore: `portalWidgetSpec.ts:597`
  (TS1117 duplicate key), `PortalCanvas.tsx` (`splitNode`/`splitInfo` on `CanvasCtx`),
  `PortalTable.tsx` (`color` missing on the cell type). Each was proven pre-existing by stashing.
- The Figma MCP server needs authorising before its tools work — do it via `claude mcp` or `/mcp` in
  an interactive session.
