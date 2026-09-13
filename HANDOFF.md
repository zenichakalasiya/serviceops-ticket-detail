# Handoff — 2026-09-13 21:59

## Read first

`CLAUDE.md` → the two bullets just above `## Parked features`: **"The portal template showcase …
was REMOVED"** and **"Industry templates — the plan the next templates are built from"**. The second
one is the whole outcome of this session in durable form: the programme, the PMG rejections, the
coral contrast rule and how the canvas chrome is built.

The full reasoning — personas, use cases, and a written ITSM justification for every proposed widget —
lives in the published doc, **Industry Support Portals**:
https://claude.ai/code/artifact/e0392ec4-8e36-4de8-83c9-72732dd00054

## What we worked on this session

Design strategy rather than builder code. We reviewed the 21 Support Portal layouts produced in Claude
Design, mapped them to six industries (IT & ITES, Healthcare & Pharma, Manufacturing, Government,
Education, BFSI) against personas and ITSM use cases, and folded in PMG's review. Alongside that, the
canvas's chrome was normalised to the real product and a template review page was removed from the app.

## Completed

- **Reviewed all 21 canvas artboards** and recorded defects with DOM evidence, not by eye: the
  Concierge pair (`3H`, `3H2`) contradict themselves on screen ("2 Approvals" beside "Nothing to
  approve"); `4F`, `3H` and `3H2` have no search input at all; `4D` ships a stock "YOUR LOGO PLACE
  HERE" placeholder; mock counts drift between artboards.
- **Industry mapping, final** — see the programme in `CLAUDE.md`. Every one of the 22 layouts
  (21 + the new Ward Desk) has a stated outcome: shipping, held, parked, harvested, retired or
  rejected.
- **Industry reference doc published** (link above) and updated twice as decisions changed — it now
  carries the PMG status, the coral contrast measurements, the Ward Desk band spec and the full
  disposition table.
- **Canvas chrome normalised** in `ServiceOps portal layout system/Support Portal Layout System.dc.html`:
  all 21 artboards now share the product's top bar (lucide) and its 8-destination rail (glyphs
  extracted from `SidebarIcons.tsx`), drawn as CSS `mask-image` classes defined once. The rail was
  also **wrong, not just differently drawn** — it invented Dashboard and Org destinations and was
  missing Changes, My Assets and My Approvals. Five artboards (`4P` `4I` `4H` `4G` `4F`) had no
  product chrome and were given it. Verified in the DOM: 8 rail items with correct labels and 8
  top-bar icons on every artboard, zero unresolved masks.
- **Removed the portal template showcase** — `PortalTemplateShowcase.tsx` deleted, plus its route in
  `routes.ts` (union member, `PAGES` slug, `PAGE_TITLES` label) and its import + render line in
  `App.tsx`. Zero references left, `npm run build` green, typecheck on both edited files clean, and
  `#/portal-templates` confirmed in the browser to canonicalise to `#/request`.
- **Ward Desk (`5A`) prompt written** for Claude Design — a new Healthcare layout, delivered in chat,
  not yet generated.

## In progress

Nothing mid-flight in code. **One decision is waiting on you** — see Next step 1.

## Next steps

1. **Decide `4C` Mosaic.** Asked last and not yet answered: **(A) retire it**, or **(B) create a
   seventh "Employee Experience" category** holding `4P` + `4C` (which would move `4P` out of
   Education). Recommendation was A — it needs three customer photos and uses five colours with no
   meaning.
2. **Generate Ward Desk in Claude Design** from the prompt, then review it against the six-band spec
   in the doc.
3. **Write the remaining Claude Design prompts** — the `3B` Sidecar rework and the two 2A variants
   (Coral, Navy) — so PMG sees the revised set in one pass.
4. **Settle three open questions before building templates:** does `4I` Rails get a search (it lost
   its only one when its invented header was replaced); who owns flipping the Service Status Board
   during an incident; and what happens to `tpl-counter` and `tpl-verdant` now that PMG has rejected
   their references.
5. **Carried over from the previous session, still open:**
   - Restrict what the banner card slot accepts (Announcements, Contact Us, action cards only) —
     gate in `dropInRow` for `rowId === 'hero'`, refusing with a reason.
   - Make `No filter — every record` a pickable row in the Custom Data Widget's filter dropdown
     (~5 lines in `PortalRecordFilter.tsx`).
   - Optional: per-service icons on service tiles (needs a name→icon map over mock data).

## Decisions made

- **IT & ITES = `3B` Sidecar, reworked** — chosen over the PMG-clear `3J` Bulletin. The rework's real
  job is to stop its action column reading as a second rail now that the product rail sits beside it.
- **Healthcare = Ward Desk, designed from scratch** rather than derived from `2B`, so the
  status-above-banner inversion and the short hero can be sized for a standing user.
- **Industry is a category FILTER in the gallery**, with each industry still getting its own seed
  and tile — otherwise two industries sharing a tile have nowhere to put their own widgets.
- **Industry widgets are recoverable** via a proposed template-scoped "In this template" palette
  group, not `noDelete` and not delete-forever.
- **2A ships as two variants**, Coral and Navy — Coral for Education/Healthcare, Navy for
  BFSI/Government/IT.
- **Coral is `#F27564`** and **cannot be a button fill or link colour** (2.80:1). `#07101F` carries
  action; coral carries identity.
- **Canvas icon swap is chrome only**; the 350 in-page icons stay Material Symbols.
- **The rail shows 8 destinations** — Service Catalog is hidden on purpose, matching the shipped
  default.
- **Only the showcase page was removed** — the Use-Template gallery and `PORTAL_TEMPLATES` stay.

## Gotchas & notes

- ⚠️ **Duplicate `CLAUDE.md` and `HANDOFF.md` exist inside `ServiceOps portal layout system/`** —
  byte-identical copies of the root files, untracked. This wrap-up updated the **root** files only,
  so those copies are now stale. They look accidental; worth deleting so no session reads the old one.
- ⚠️ **The whole canvas folder is untracked by git.** The chrome edits are not version-controlled and
  won't be published by a push. The pre-edit original is saved beside it as `.dc.html.bak`.
- ⚠️ **`Support Portal Layout System.html` and `export-src.html` are now stale** — they're Claude
  Design exports and were not edited. Re-export after opening the canvas.
- ⚠️ **Vite's file watcher crashed with `EBUSY`** when `src/assets/Portal-Personas-and-Use-Cases.md`
  appeared and was locked or moved mid-watch. Keep working documents out of `src/` — everything under
  it is watched. That file now sits at the repo root, untracked.
- ⚠️ **Canvas edits must be scripted with the Write tool, not bash heredocs** — Git Bash strips
  backslashes, which silently breaks any regex anchor. Assert expected hit counts before writing: the
  first chrome pass failed safely on 12 of 16 hits because four artboards used a slightly different
  grey.
- The canvas is served for review with `npx http-server -p 5299 -c-1 .` from its folder; the app's dev
  server is `npm run dev -- --port 5200`.
- The Figma MCP server needs authorising (`claude mcp` or `/mcp` in an interactive session), and
  `figma-desktop` failed to connect this session.
