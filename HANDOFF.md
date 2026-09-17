# Handoff — 2026-09-17 15:30

## Read first

Everything this session touched is the **Support Portal builder**. In `CLAUDE.md`, read the
nine bullets dated **17 Sep 2026** at the end of the Key-context list — they carry the reasoning
behind each change and the traps that cost a pass. The two older bullets they build on are
**"the child-selection model"** (how a widget's heading, link or icon becomes its own node) and
**"the collection contract"** (how an item's config lives in its widget's cfg).

## What we worked on this session

Polish across the Support Portal builder, almost all of it driven by screenshots: the banner's
height rail, industry tags on template cards, the Custom Card's links and icon picker, per-preset
Gap axes, the preset tiles' drawing, Title placement on every card, and finally the six data cards'
content and row shapes from three reference images.

## Completed

All pushed to `main` (13 commits, `863c8f0` → `2d44add`), each verified in the browser:

- **Banner height rail** — stops are `260 · 400 · 540 · Screen`, 140px apart. `Screen` stores the
  word, not a number, and is measured from the banner's own top to the fold.
- **Industry tags on template cards** — six fixed industries as a second axis beside `category`;
  two shown, the rest behind a `+N` with an instant tooltip. The category chip moved onto the
  thumbnail to make room, and the card height is unchanged.
- **Icon picker** opens beside the icon instead of on top of it.
- **Custom Card links** — each link is a node: type its words on the canvas, click its glyph for the
  shared picker, and style it (Style · Icon · Spacing) per link. Fixed four pre-existing faults on
  the way, including one where typing in a link emptied the card.
- **Custom Card** is a real card now (white surface, 16px padding) and has three layouts, one row.
- **Gap follows the preset** on Action cards, KPI tiles, the two service rows and My Assets / My CIs
  — columns only, rows only, or both, depending on what the arrangement actually has.
- **Title placement** on every card, including the Custom Data Widget, which needed its own
  "above the card" shape.
- **Preset tiles** are plain grey boxes in the arrangement's shape.
- **The six data cards** carry the reference content and row shapes, full-width dividers, one date
  format, and badges that count totals rather than mock rows.
- **The rail's first card** (Announcements) ends exactly where the row beside it ends.

## In progress

Nothing mid-flight. The working tree is clean apart from the untracked files that have always been
kept out of the repo (`docs/duda/`, screenshots, the design canvas, `.claude/agents/`).

## Next steps

1. **Pending Approvals still shows 2 rows** where every other card shows 4 — its badge says 2, so
   there genuinely are only two seeded. Add more rows if the card should look as full as its
   neighbours.
2. **The Custom Card's own title has no "above the card" option.** Its heading is body copy rather
   than a card header with a count and a View-all, so the question means something different there.
   Decide whether it should get one.
3. **Shadow is not in a collection item's Design panel** (a Quick link gets Style · Icon · Spacing).
   The drawer withholds it from item layers; say if it should come too.
4. **The Use-template gallery** (`SupportPortalTemplateGallery`, reached from the module's own
   route) still shows no industry tags — only the create-flow cards have them.
5. The **Industry templates programme** in `CLAUDE.md` is still the open piece of work: Ward Desk,
   Wayfinder, Atrium, Service Center and the industry-only widgets.

## Decisions made

- **Banner M and L are fixed numbers, not a share of the viewport.** Splitting the range evenly
  would make the same banner a different height on a different machine. `Screen` is the one stop
  allowed to answer per-machine, because that is what it says it does.
- **Existing banners are not snapped to the new stops.** Template banners are authored at heights
  the rail never offered (560, 340, 220…); snapping would redesign forty shipped banners to tidy
  one control.
- **Industry is a second axis beside `category`, and the list is closed.** A hospital's IT desk is
  both; an open list is how two templates end up tagged "Health" and "Healthcare".
- **The category chip moved to the thumbnail rather than being deleted.** It is answered by the
  filter row above the grid, but removing it is a product decision nobody asked for.
- **One date format across the page**, including where the reference image showed two.
- **Badges count totals, not rows in a fixture.** A badge counting the mock array contradicted the
  "View all" beside it.

## Gotchas & notes

- **The Bash heredoc trap is real and bit again.** Git Bash strips backslashes inside `<<'EOF'`,
  so a script containing a regex silently fails to match. Write those scripts with the editor.
- **`DROP_GROUPS` removes every field in a group called `Layout`**, with one exception carved out
  *by control type* for the preset picker. A Gap declared beside it renders nowhere and the panel
  looks completely untouched — this cost a full pass.
- **Never reach for `querySelector('[data-node="…"]')` in the preview.** `Sel` renders `data-node`
  only while the canvas is editable, so the lookup finds nothing in Preview and on the published
  portal — the two places a measured layout most has to hold.
- **A measured pin can chase its own tail.** The rail's alignment needed a 0.4px deadband; at 1.5px
  it swallowed the 1.22px correction it existed to apply and looked stable *and* misaligned.
- **Hot-reloading `PortalCanvas.tsx` swaps the canvas context**, so `data-node` disappears and the
  page looks broken. Reload before judging anything.
- A React `key` belongs on the component, not on a wrapper `<span>` — an inline wrapper around a
  chip made one card 3px taller and stretched its whole grid row.
