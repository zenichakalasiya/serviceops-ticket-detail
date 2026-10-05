# Support Portal builder — making it simple for a non-designer ITSM admin

Saved 5 Oct 2026 from the review done on **28 Sep 2026**, so the analysis is not lost and can be
used to design a simpler Support Portal builder for admin users.

It has two parts, in the order they were asked:

1. **What overwhelms a non-designer** — a review of the whole builder, ranked by impact.
2. **How to make styling "one go"** — approaches for the split between the floating toolbar and the
   right sidebar, with a recommendation.

A short **"What has changed since"** section at the end marks which points have been touched since
28 Sep, so you know what is still open.

---

## The questions that were asked

> *"Check and analyze the whole portal and what are the things which can be overwhelming or not
> easily accessible to a non-designer? Please check and list here."*

> *"There are so many things which our users face: there are some quick beautification icons, and
> the spacing and layouts are given to the right sidebar. Please find a solution which is the most
> easier way to config these things easily in 1 go. Please suggest some ways and list them here."*

---

## Part 1 — What could overwhelm a non-designer

Reviewed on the default page, a selected card, the banner, a section and the Theme panel.

### High impact

1. **The toolbar is all icons.** A card's bar has about 8 glyphs, and Border, Corner radius and
   Shadow are all small squares. Without hovering, there's no way to tell them apart.
   *Suggestion:* put labels on the style icons, or group them under one "Style ▾" button.
2. **Single-letter shortcuts fire by accident.** With a widget selected, pressing B, O, C, D, H, V,
   I, G or P opens a style popup. Someone who clicks a card and then starts typing will trigger them.
   *Suggestion:* keep only Delete, the arrows and Ctrl-combinations for everyone, and make the
   letters opt-in.
3. **Undo can't bring back a deleted built-in block.** Deleting My Open Requests by mistake can't
   be undone, and Reset to default wipes everything.
   *Suggestion:* fix undo for built-in blocks, or ask before deleting one.
4. **"Reset to default" sits next to Preview and Publish** and looks just like Preview, but it
   throws away the whole design.
   *Suggestion:* move it into a ⋯ menu and ask for confirmation.
5. **Three stacked headers.** The product bar, the builder bar and the portal's own header (with
   Ask AI and its own icons) sit on top of each other. It's hard to tell which one belongs to the
   page being designed.
   *Suggestion:* a light "Your portal" frame or tint around the canvas.

### Medium impact

6. **Designer words:**
   - "Hero" (the banner's panel title).
   - "Primary alt", and the Primary / Secondary / Neutral tabs.
   - "Responsive behaviour: Fill items".
   - Margin vs padding, and px values with chain links.
   - Row / column "behaviour", splitting, nesting.

   *Suggestion:* plain labels ("Banner", "Main colour", "Space inside / outside") with a one-line hint.
7. **The same thing is called different names.** The panel says "My Requests" while the card says
   "My Open Requests". The Theme panel has two different "Page background" rows (under Colours, and
   under Home page background).
8. **The Widgets list opens looking disabled.** On the default page every item in the first tab
   (Data) is already placed, so the first thing you see is a column of greyed rows with green ticks.
   *Suggestion:* open on a tab that has addable widgets, or show a line like "All on your page".
9. **The layout choices are unlabelled pictures.** Section presets, the banner's section count and
   its arrangement tiles are small skeletons with no text.
   *Suggestion:* a short label under each.
10. **Hovering the canvas shows many controls at once:** "+ Add Section", the drag dot, the column +
    adders, resize handles, name chips, and gap strips when a section is selected. It feels busy.
    *Suggestion:* show the structure controls only on the selected item, not on hover.
11. **Light/dark is a choice in every colour picker.** A non-designer may not realise dark mode
    needs its own colours, or may think they've "lost" a colour that was only set in light mode.
    *Suggestion:* a short note in the Dark tab ("Unset colours use the light one").

### Hard to find

12. Editing text takes two clicks: the first selects the box, the second edits the words.
13. Double-clicking the banner crops its image. Nothing on screen says so.
14. Card gaps can be dragged with the pink strips, but nothing shows this until a section is selected.
15. What each colour picker's A field means (opacity), and that transparent is set by dragging
    opacity to 0. There's no "no colour" button that says so.

### Working well already

The tour and the Basics popup, the one-line hover card on widgets, showing each shortcut on its
tooltip, and the listing cards.

---

## Part 2 — Configuring how things look "in one go"

**The core problem:** one decision — *"how should this card look?"* — is split across two places.
Colour, border, corners and shadow were on the floating toolbar, while spacing and layout are in the
right sidebar. A non-designer has to know which piece lives where, and set four to six separate
values to get one good-looking card.

The approaches, from the biggest "one go" win down:

### 1. Page-wide style kit (set once for everything)
- Add to the Theme panel: **Card style** (Flat · Outlined · Soft shadow · Raised), **Corners**
  (Square · Rounded · Pill) and **Spacing** (Compact · Comfortable · Spacious).
- Every widget follows these automatically, so most admins never style a single card.
- Per-widget settings become exceptions, not the normal way.

### 2. "Look" presets per widget (one click restyles one card)
- A single **Style** button on the toolbar opens 4–6 visual tiles, such as Plain, Card, Outline,
  Tinted, Bold and Glass.
- Each tile sets fill, border, corners, shadow and padding together.
- A **Custom ▾** link at the bottom opens the detailed controls for people who want them.

### 3. One Design popup: everything in one place
- The toolbar's colour, border, corners and shadow icons merge into one **Design** button.
- Its popup holds all of it, with spacing and layout included, in simple words: Colour · Edges ·
  Space inside · Space around · Arrangement.
- The right sidebar then keeps only **Content** (titles, text, what the widget shows).
- Rule for users: *what it says* is on the right, *how it looks* is on the canvas.

### 4. Spacing as three sizes, not numbers
- Replace the margin/padding px fields with **S · M · L** for "Space inside" and "Space around".
- A small "Custom" link reveals exact px values.
- Nobody has to understand margin vs padding.

### 5. Copy style / paste style
- On the toolbar: **Copy style** from one card, then **Paste style** onto others. Or "Apply to all
  cards like this" in one click.
- This fixes "I styled one card, now I have to redo nine".

### 6. Layout presets with labels
- Section and banner arrangements shown as labelled tiles, for example "2 columns",
  "Big left + small right" and "Stacked".
- The picture and the word together, instead of unlabelled bar sketches.

### 7. "Tidy up" button (optional, later)
- One button that lines up the page's spacing and card styles with the style kit, undoing ad-hoc
  overrides.
- Could become an AI "Make it look clean" action later.

### Recommendation

Do **1 + 2 + 4** as the main path:
- The page-wide kit handles about 80% of cases with no per-card work.
- Look presets give one-click variety.
- S/M/L spacing removes the jargon.
- Keep today's detailed controls behind "Custom" so nothing is lost for power users.

If you want a single change first, **1 (the style kit)** gives the biggest "config it in one go"
result. Approaches 2 or 3 can be mocked up as a clickable prototype before committing to one.

---

## What has changed since 28 Sep (so you know what is still open)

| Point | Status on 5 Oct 2026 |
|---|---|
| Part 1 · #1 toolbar is all icons | **Partly addressed.** Border, Corner radius, Shadow and Icon left the floating toolbar on 29 Sep; they are now groups in the sidebar's Design section. The bar keeps Background colour, alignment and the actions. The "one Design place" question (Part 2 · #3) is still open. |
| Part 1 · #2 single-letter shortcuts | **Partly addressed.** O, C, D and I went with the controls above. B, H, V and the others remain. All shortcuts are now in one global Keyboard shortcuts panel. |
| Part 1 · #3 undo of a built-in block | Open. |
| Part 1 · #4 Reset to default placement | Open. |
| Part 1 · #5 three stacked headers | Open. |
| Part 1 · #6–7 designer words / two names | Open. |
| Part 1 · #8 Widgets list opens disabled | **Addressed (1 Oct).** Widgets already on the page fold into "N on this page ›" on each group's title, and a finished group shows "All added to the page". Rows now drag; the + adds. |
| Part 1 · #9 unlabelled layout pictures | Open. |
| Part 1 · #10 busy hover | Partly — gap strips were removed on 24 Sep; the rest is open. |
| Part 1 · #11–15 | Open. |
| Part 2 · all approaches | **None built yet** — still a decision to make. The move arrows on the toolbar were parked on 30 Sep (see `future-tasks.md` §6). |
