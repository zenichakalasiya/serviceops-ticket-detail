# Support Portal — parked features

Six things that are **built or part-built and deliberately switched off**, so the work is not
thrown away and nobody has to start from scratch when they come back. Four are features; the fifth
(§5) is a UI recipe that was working well and was taken out of one surface for a reason that does
not apply everywhere; the sixth (§6) is the toolbar's move arrows.

Nothing here is a proposal. Every item names the files, the flag that hides it, the styling that is
already decided, and the specific reason it was parked — so the next session can pick one up and
finish it rather than re-deciding it.

**How each one is hidden, and why it matters:** a parked feature keeps its spec, its renderer and
its panel. That is what makes restoring it one flag rather than one rebuild, and it is why an
existing page that already carries the element keeps working instead of rendering a hole.

---

## 1 · AI — build and edit sections by describing them

**Status:** panel shell exists; the rail item is commented out.
**Hidden by:** one commented line in `SupportPortalBuilder.tsx`'s `RAIL` array (21 Aug 2026).

### What exists today

| Piece | Where | State |
|---|---|---|
| Rail item + gradient treatment | `SupportPortalBuilder.tsx` → `RAIL`, and the rail's `className` block keyed on `r.key === 'ai'` | commented out; **styling intact** |
| `RailKey` union member `'ai'` | `SupportPortalBuilder.tsx` | still there |
| Panel copy | `PANEL_COPY.ai` — *"Build with AI / Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you."* | still there |
| Empty state | `PanelEmptyState` renders it from `PANEL_COPY` | works |
| Icon | `AiSparkle.tsx` (gradient sparkle, already used across the ticket drawers) | shared |

**Restoring it is uncommenting one line.** The union, the copy and the rail's gradient are all still
in place precisely so that is true.

### Styling already decided — do not re-litigate

- **AI sits apart at the BOTTOM of the rail with `mt-auto` and a standing gradient tint**
  (`from-[#F5F3FF] to-[#FDF2F8]`, border `#EDE9FE`, text `#7C3AED`; active adds
  `shadow-[0_0_0_3px_rgba(124,58,237,0.10)]`). It is **not a fifth panel of the same kind** — it is
  the shortcut past all four, so it must read as its own thing rather than the last item of a list.
- Every rail panel is titled with the **name of its rail item** and carries **one line** under it.
  Do not let AI's panel drift into a different shape from Theme, Branding and Settings.

### What is still to build

1. **A panel that takes a prompt** and lays blocks out — the empty state describes this; nothing
   generates anything yet.
2. **⭐ Section-level AI (the real ask).** An **AI icon on a selected parent section**, which
   instructs AI to customise *that section only*. This is the part that matters: portal-wide
   generation is a demo, section-scoped editing is a tool. Whatever it produces must go through the
   same writers everything else uses:
   - structure → `addSection` / `applyPreset` / `addColumn` (`SupportPortalBuilder.tsx`)
   - content → `patchCfg(nodeId, …)` (the widget config store)
   - styling → `setStyle(nodeId, …)` (the style store)

   ⚠️ **AI must not get its own store.** Anything it writes has to land where the panel writes, or
   the canvas and the drawer start disagreeing about the same section — the single most common bug
   class in this builder, and the reason `fillCss`, `ownerOf` and the child-node model all exist.
3. **Undo has to cover it.** Undo is snapshot-based (`SupportPortalBuilder.tsx`) over eleven state
   atoms; an AI edit that writes through the normal setters is recorded for free. One that reaches
   past them is not.

### Where the icon would go

`PortalCanvas.tsx` → `ElementToolbar`. The section toolbar already carries `⠿ ← → + ⧉ [3 aligns] 🗑`
and each button is real. An AI button belongs at the end of that bar, and — per the standing rule in
this file's neighbours — must **do something on click**, not open a "coming soon".

---

## 2 · Media Slider — a carousel banner

**Status:** built, hidden.
**Hidden by:** `hidden: true` on `v-slider` in `supportPortalData.ts` (20 Aug 2026).

### Why it was parked

The conformance sweep (`audit/portal-conformance.js`, results in `audit/FINDINGS.md`) found
**22 of its 33 controls inert** — they stored a value and painted nothing. That is the worst state a
widget can be in: it looks configurable and is not, which teaches people to distrust every other
panel too. Hiding it was cheaper than shipping it broken.

### What exists

- Palette entry `v-slider` (group **Visual**, keywords `carousel gallery`), `hidden: true`.
- A collection spec in `portalCollectionSpecs.ts` — slides as `§4.1` items with the shared
  `PortalItemList` (drag handle, thumbnail, duplicate/delete/hide, keyboard reorder, undo toast).
- A renderer in `PortalCollectionRender.tsx`.
- Sub-elements per slide (heading, body) wrapped in `<Sel>`, so clicking a slide's heading selects
  **that heading** — the §4.3 rule.

### To finish

1. **Re-run the sweep against it.** `await __audit.run()` with the builder open, then
   `__audit.report()`. Fix by cause, not by control — the last pass found ~60 defects that were four
   shared causes.
2. **Decide what the banner carousel actually is.** Two different products:
   - the **hero** cycling through images (a Banner setting — it already has fit / focal point /
     overlay / the `PortalBannerPicker` gallery), or
   - a **slider widget** you drop into a section like any other.

   ⚠️ These are not the same feature. Doing both means two places to author a carousel, which is the
   "two controls for one value" trap this builder keeps re-learning.
3. Autoplay, interval, transition and dot/arrow styling are **not specified**. Ask before inventing
   them.

---

## 3 · Advanced Tabs — tabbed content on the portal

**Status:** part-built, hidden.
**Hidden by:** `hidden: true` on `l-tabs` in `supportPortalData.ts` (20 Aug 2026).

### Why it was parked

It shipped alongside an **Advanced Accordion** that was deleted outright: one widget with two
palette names, editing two different ways depending on which row you clicked. Tabs survived that
cleanup but was never finished.

### What exists

- Palette entry `l-tabs` (group **Basic**), `hidden: true`.
- It sat in the old **Layout** group, which was folded into **Basic** when only Divider and Tabs
  were left in it. Divider is now hidden too (21 Aug 2026), so **Tabs is the last thing that group
  was for** — check whether Basic still reads correctly when it comes back.

### To finish

1. **A collection spec**, exactly like Accordion's: tabs are items with a label and a body, so reuse
   `PortalItemList` and the `CollectionSpec` shape in `portalCollectionSpecs.ts`. Accordion is the
   template to copy — same two-field item, same inline editing, same sub-elements.
2. **Decide the reuse rule.** Accordion is `many` (a page can have several). Tabs almost certainly
   is too. ⚠️ Reuse comes from the **spec's `single`/`many`**, not from the palette group — the
   group rule once greyed FAQ out after one use.
3. **Tab strip styling** must match the product: `px-2 py-3`, `border-b-2`, inactive hover =
   light-grey fill + `border-[#CBD5E1]`, active = `#3D8BD0`, container `gap-2.5`. This is the
   product-wide tab treatment; the builder must not invent a second one.
4. ⚠️ **Do not wrap a `<tr>`-like structure in `<Sel>`.** `Sel` renders a `<div>` — the table widget
   was broken by exactly this. If a tab panel needs per-row selection, check the element it renders
   as first.

---

## 4 · Custom templates — edit a template and save it as your own

**Status:** entry point built; the save-back half is not.
**Hidden by:** nothing — the route is live, it just cannot produce a *user* template yet.

### What exists

- The **`New page ▾`** CTA on the Support Portal listing offers two routes:
  **Create Support Portal** (blank) and **Use Template**.
- `SupportPortalTemplateGallery.tsx` — category chips, search, wireframe thumbnails **drawn per
  `layout`** so a tile can never promise a shape you do not get, a right rail listing exactly the
  blocks that will land, double-click to use, and a *"start from a blank page instead"* footer link
  so the gallery is never a dead end.
- `PORTAL_TEMPLATES` in `supportPortalData.ts` — 7 templates, each with a `layout`
  (`classic | spotlight | catalog | knowledge | minimal | status`), an `accent` that tints its hero,
  and a category.
- A page created from a template records **"Started from &lt;template&gt;"** on the record
  (`PortalPage.source`) — though the listing no longer shows that column.

### To finish

1. **Save-as-template** from inside the builder: take the current page's `blockOrder`, `rowOrder`,
   `sections`, `widgetCfg`, `styles`, `icons`, `placedText`, `removed` and `rowExtras` (the same
   eleven atoms `Reset to default` clears and undo snapshots) and store them as a user template.
2. **Two kinds of template in one gallery.** Product templates cannot be edited or deleted; user
   ones can. ⚠️ They need to be visibly different in the gallery, or someone will try to delete a
   product one and be refused with no reason visible — the rule the default portal's disabled
   toggle and Delete already follow (disabled **with the reason on them**, never hidden).
3. **`layout` drives the thumbnail.** A user template has no hand-drawn wireframe, so either derive
   the tile from its real block list or render a live mini-preview. Do **not** fall back to a
   generic tile — the whole reason the gallery is trustworthy is that the tile is drawn from the
   same data the section is built from.
4. Naming, overwrite and duplicate-name behaviour are **not specified**. Ask.

---

---

## 5 · The carousel hover card — a reusable recipe

**Status:** built, then deliberately taken OUT of the widget library (21 Aug 2026) — the library
now shows every variant at once, because comparing four button styles is the whole question there
and a carousel makes you wait for each one.

**The idea is worth keeping.** It is the right shape for any surface where there is genuinely *one
thing at a time* to show — a single element's states over time, a step sequence, a before/after — and
it was working well. What follows is the prompt to rebuild it, plus every value already tuned, so it
comes back in one pass instead of being redesigned.

### Where the code was

`PortalElementPreview.tsx`. Git history has the carousel version; `PREVIEWS` (the `Record<elementId,
{ why, variants[] }>` catalogue) and the primitive helpers `box` / `row` / `stack` / `bar` / `dot` /
`pill` are all still there and unchanged — only the render and the cycling were replaced.

### The prompt

> Build a hover preview card that cycles through an element's variants.
>
> **Trigger and placement.** Hovering a row in a list opens a dark card to its **left**. Portal it
> to `document.body` with `position: fixed` — the list scrolls, so a popover rendered inside it is
> clipped the moment it is taller than the space beside its row. Give the card
> `pointer-events-none`, or it steals the hover that is keeping it open. Measure its height **after
> render** and clamp to the viewport (`Math.max(12, Math.min(wanted, innerHeight - h - 12))`) — the
> height depends on how long the copy is, so a fixed estimate puts short cards too low and clips
> tall ones off the bottom.
>
> **What is inside, in this order.** A **stage**: a dotted ground (`radial-gradient(circle, #3A3A3E
> 1px, transparent 1px)` at `10px 10px`) so the sketch reads as *on a page*, with the variant framed
> in a `rounded-lg border border-white/85 bg-[#232326]` box — the same framing the canvas uses for a
> selection. Then a **caption row**: the current variant's name on the left, progress dots on the
> right. Then **one line on WHY you would reach for this element** rather than the one above it in
> the list.
>
> **The art is a wireframe, not a screenshot.** Grey bars and dots on a dark ground, built from a
> handful of primitives (`bar(width, height, colour)`, `dot(size)`, `row`, `stack`, `box`, `pill`).
> A name is the worst possible description of a visual element — "Text", "List" and "Card" all sound
> plausible for the same job — and a sketch answers *what shape does this leave on my page* in the
> time it takes to hover. Accent anything meaningful in `#5B8DEF`; everything else stays grey.
>
> **The cycling.** `setInterval` every **1400ms**, `(n + 1) % variants.length`. Reset to variant 0
> whenever the hovered row changes — arriving mid-carousel on a new element means the first thing
> you see is not that element's primary form. Skip the interval entirely when there is only one
> variant.
>
> **The dots earn their place** — they say *"there are four of these"* in the first second, before
> the carousel has had time to show a second one. `size-1.5 rounded-full`, `bg-white` for the
> current one and `bg-white/25` for the rest, with a colour transition.
>
> **Every row gets a card, including disabled ones.** Falling back to nothing would feel broken on
> exactly the rows people are least sure about, and a row is often disabled *because* it is already
> placed — which is a thing worth being able to look at.

### Values already tuned — do not re-derive

| | |
|---|---|
| Card width | `268px` (carousel) · `300px` (all-at-once) |
| Card | `rounded-xl bg-[#1C1C1F] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]` |
| Stage height | `132px`, centred, `px-5` |
| Dot grid | `#3A3A3E`, 1px dots at `10px 10px` |
| Frame | `rounded-lg border border-white/85 bg-[#232326] px-3.5 py-3` |
| Variant name | `text-[11px] font-medium text-white/90` |
| Reason line | `text-[12px] leading-[1.5] text-white/55` |
| Accent | `#5B8DEF` · bars `#6A6A6E` / `#4A4A4E` · muted `#3A3A3E` |
| Interval | `1400ms` |
| Offset | `left: anchor.left - CARD_W - 12`, clamped to ≥ 12 |
| z-index | `10002` |

### ⚠️ When NOT to use it

A carousel shows one thing at a time, so it costs the reader the ability to **compare**. If the
question the surface answers is *"which of these do I want"* — four button styles, two accordion
states — show them together and skip this entirely. That is exactly why the widget library stopped
using it. Reach for the carousel when the variants are **the same thing over time** (states, steps,
a progression), not **alternatives to choose between**.

---

## 6 · Move arrows on the floating toolbar — step a widget one place

**Status:** fully built and working; switched off on 30 Sep 2026 (Zeni: "hide for now, we will
bring it back if I want").
**Hidden by:** `SHOW_MOVE_ARROWS = false` in `src/app/components/portalShortcutKeys.ts`. Set it to
`true` and everything below returns at once — no other edit is needed.

### What the concept is

Every selected element on the canvas carried a pair of arrows on its floating toolbar that moved it
**one place** among its siblings:

- **Move left / Move right** (lucide `ArrowLeftToLine` / `ArrowRightToLine`) when the parent lays
  its children out side by side — columns in a row, cards in the Quick Actions row.
- **Move up / Move down** (`ArrowUpToLine` / `ArrowDownToLine`) when the parent stacks them —
  sections on the page, widgets stacked in a column.
- The **bare arrow keys** pressed the same buttons (`←` `→` `↑` `↓` with a widget selected), and the
  shortcut sheet's *Move and size* group listed them as "Move one place".

### What the flag gates

| Piece | Where | With the flag off |
|---|---|---|
| The two arrow buttons | `ElementToolbar` in `PortalCanvas.tsx` — the `moves` list and its render | not drawn |
| The fence rule before the "place" group | `hasStructure` in the same component | no longer counts the arrows, so no orphan divider |
| Bare-arrow keys | `PortalShortcuts.tsx` → the `ARROWS` map | ignored, so an arrow scrolls the canvas as normal |
| Shortcut-sheet row | `PortalShortcuts.tsx` → the `MOVE` group | group reads **Size** with only the Shift+arrow rows |

Kept untouched and still used: `moveNode` in `SupportPortalBuilder`, `useSiblingSpan` (which axis,
first/last), `TOOLBAR_KEYS.moveLeft/Right/Up/Down` in `portalShortcutKeys.ts`. **Drag (the grip)
still moves anything anywhere**, so nothing became unreachable.

### Decisions already made — do not re-litigate when it returns

- **The `…ToLine` glyphs, not bare arrows.** A bare arrow means a direction, which is what the
  alignment controls beside them use; the bar the arrow travels to says "take a place". The right
  arrow is lucide's own mirror of the left, never a CSS `scaleX(-1)`.
- **Only the parent's own axis is offered**, and the axis is MEASURED (`useSiblingSpan`), falling
  back to the box's declared direction, then to the node kind.
- **An impossible move is not rendered, never shown disabled** — at the first or last position that
  arrow is absent, and an element with no siblings shows neither.
- Bare arrows moving the selection is the Figma/Webflow/Framer habit Zeni chose; the cost (no
  arrow-scrolling while something is selected — press Esc first) was stated on the sheet.
- The Editor basics video (`PortalTourScenes.tsx`, the Card chapter) still shows a "Move right"
  press. Leave it if the arrows are coming back; redraw that beat if they are gone for good.

---

## Rules that apply to all of these

These are hard-won and cost real debugging time. They are not style preferences.

- **One value, one control.** The recurring fault in this builder is two controls writing the same
  thing, and whichever you are not looking at wins the last write. The canvas wins over the panel
  where both could exist.
- **Absent ≠ disabled.** A control that cannot apply is **removed**; a control that is *refused* is
  **disabled with the reason on it**. Never a greyed control with no explanation.
- **`npm run build` is esbuild only — it is NOT a typecheck.** A missing import, a ref used before
  its declaration or a removed variable still referenced in JSX all build green and blank the page.
  **Verify in the browser.**
- **Escape Tailwind bracket classes in raw CSS** — `.bg-\[\#F1F5F9\]`. Unescaped, the browser reads
  `[#F1F5F9]` as an attribute selector, calls the rule invalid and drops it **silently**. This took
  out most of the dark theme once already.
- **Widths, paddings and heights are OWN-only; spacing above and below inherits.** A width resolved
  through the chain hands itself to every text child — see `boxCss` in `portalStyleResolver.ts`.
- **The Bash tool strips backslashes inside heredocs.** Write scripts with the editor and run the
  file, or build backslashes from `String.fromCharCode(92)`.

## Where to read next

- `CLAUDE.md` — the Support Portal bullets under **Key context** carry the trap behind every
  decision above.
- `audit/FINDINGS.md` — the live defect list, including the Media Slider count.
- `LAYOUT-ALIGNMENT-SPEC.md` — the measured layout/alignment model.
- `WIDGET-CONTENT-AND-STYLING-SPEC.md` — the widget panel contract (§4 collections is what Tabs and
  the Slider both need).
