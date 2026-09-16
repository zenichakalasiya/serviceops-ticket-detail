# Handoff — 2026-09-16 13:30

## Read first

`CLAUDE.md`, the Support Portal bullets dated **16 Sep 2026** — they are this session in durable
form, newest first:

- **"a preset skeleton draws THE SECTION, not a bar chart of it"** — the drawing rules for every
  banner preset thumbnail, and the `cfgOf` reader they depend on.
- **"the Media Slider asks its question in its own words"** — why a slide's image had no surface at
  all, and the new `inlineImage` collection option that gave it one.
- **"the Announcements card, six fixes"**.
- **"banner and data-card fixes"**, **"banner presets are a FIXED set of eight layouts"**, **"banner
  sections are placed by DRAGGING"**, **"the banner is a set of SECTIONS"**, **"the BANNERS menu"** —
  the earlier half of the same session.

Then the two long-standing traps these all sit on: **"the child-selection model"** (config and panel
resolve differently on purpose) and **"`structureSpecId` matches on id SHAPE"**.

## What we worked on this session

The Support Portal builder's **banner**, end to end: the section model and its fixed preset set, the
Banners rail menu of 29 rebuilt layouts, drag-to-place inside the banner, and then three rounds of
panel repair — the Announcements card, the Media Slider, and the preset skeletons themselves.

## Completed

- **Banner section model** — Text & Search is one stretchable section, each widget is its own
  section, max 4; gaps between rows and columns independent of each other and of a section's inner
  gaps; Button removed from the banner. Drag a widget (or a whole page card) onto a section's edge to
  make a column or a row.
- **Banner presets are a FIXED set of eight** (`PRESET_SHAPES`), taken from the arrangements that
  repeat across the 37 gallery layouts — they no longer grow with the widgets on the banner, and a
  newly added section always lands as a new row at the foot.
- **Banners rail menu** — 25 horizontal + 4 vertical layouts, all rebuilt with the editor
  (`portalBannerTemplates.ts`), with drop-image placeholders where artwork can't be generated.
- **Announcements, six fixes** (`b8b3f6d`): a "View all ›" on the regular card; Card type renamed
  Regular / Carousel / Image with carousel with each sketch bounded in the card's own frame; the
  image card starts at 0 corner radius and now reads the Style pack's own value; the picture stretches
  with a dragged height while the text band keeps its own (measured: 30px of empty space gone); and
  the banner preset tiles got a ground per section.
- **Media Slider** (`d34d278`): the group is **Carousel type** — Data only / Image with data — and a
  slide carries its own image through a new `inlineImage` slot drawn by `InlineImageField` (a 44px
  preview beside one line, measured 271×69). Media type (Image/Video) left the panel; the renderer
  always drew an `<img>`.
- **Preset skeletons** (`406dd2c`): `MiniCard` is the shared card face, so KPI, action cards, Contact
  Us and the list cards draw as cards; Announcements draws the card type it is showing; an image
  bleeds like a picture; the drawings read each widget's resolved config and follow the cell's shape.

## In progress

Nothing mid-flight — the working tree is clean at `406dd2c` and every change above was verified in the
browser at `localhost:5200`.

## Next steps

1. **A Media Slider slide's call-to-action has no surface.** `ctaEnabled` / `ctaLabel` / `ctaAction` /
   `ctaUrl` are declared on the slide but the inline editor draws only its first two fields and there
   is no chevron (`inlineCoversAll`). The fix is the existing `inlineCta` mechanism — but it
   hard-codes `linkLabel` / `linkUrl` in `PortalItemList`, so it has to take its keys from the spec
   first. Offered to the user; they have not asked for it yet.
2. `future-tasks.md` still lists the Media Slider as parked. `CLAUDE.md` now says otherwise; that file
   should be corrected or the two will disagree.
3. The Industry-template programme in `CLAUDE.md` (Ward Desk, Wayfinder, Atrium, Service Center) is
   still the standing plan and has not been started.

## Decisions made

- **A preset tile draws the layout the banner will actually produce.** That is why the thumbnails read
  each widget's resolved config rather than its defaults, and why a block of cards runs across a
  full-width section and stacks in a narrow column — the same rule `bannerCols` applies on the canvas.
- **Card type / Carousel type are the same question, asked in the same words.** The Media Slider's
  group was "Navigation", which named neither what it decides nor what you get; the word "carousel"
  sits in the group title so both option buttons hold one line at any panel width.
- **A collection item's picture is not a field.** The inline editor draws field one as a line of text
  and field two as a paragraph whatever they were declared as, and with no chevron that editor is the
  item's only surface — so an image needs its own slot (`CollectionSpec.inlineImage`), not a field.
- **Controls with no effect leave the panel, their stored values stay.** Media type went because the
  renderer ignores it; a stored `kind` still resolves, so nothing already on a page moves.

## Gotchas & notes

- ⚠️ **The design panel renders OUTSIDE `CanvasProvider`.** Anything in a drawer that needs to read
  another node's config takes a reader as a PROP (`cfgOf`); `useCanvas()` there silently returns
  `READONLY_CANVAS`, whose `cfg` is undefined — the panel then draws every block at its factory shape
  and nothing errors.
- ⚠️ **Hot-reloading `PortalCanvas.tsx` swaps the canvas context**, so the page keeps rendering with
  no `data-node` anywhere and no outlines. Reload before judging anything on the canvas.
- ⚠️ The typecheck is the only thing that catches a missing import or a duplicate key here; run it on
  the handful of files you touched, from the repo root, and expect these four pre-existing errors:
  `PortalCanvas` splitNode/splitInfo, `PortalWidgetDrawer` ToggleRow `info`, `portalWidgetSpec:694`
  TS1117, and `SupportPortalBuilder` `parseItemId(...).key` ×2.
- Edits this session were made by writing small node scripts into the scratchpad and running them,
  each asserting its anchor appears exactly once — Git Bash strips backslashes inside heredocs, and
  the `Write` tool refuses to overwrite a file it has not read.
