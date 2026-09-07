# Prompt — Task 23: rows, columns, and the blue placement line

> The brief for `zeni_tasks.md` task 23. Hand this whole file over.
>
> Sources: **Duda's live editor, driven and measured on 25 Aug 2026** (site `7ae48214`, the
> Sunberry Preschool template) — every value in §2 was read out of the running DOM mid-drag with
> `getComputedStyle`, not estimated from a screenshot. Plus `LAYOUT-ALIGNMENT-SPEC.md` (Duda's
> section panel, measured 19 Aug 2026) and four decisions taken by the product owner, marked
> **[DECIDED]**. Anything still unverified is marked **[INFERRED]**.
>
> Evidence: [docs/duda/duda-insert-line-horizontal.png](docs/duda/duda-insert-line-horizontal.png)
> (line in a vertical stack) and
> [docs/duda/duda-insert-line-vertical-with-label.png](docs/duda/duda-insert-line-vertical-with-label.png)
> (line in a horizontal row, with the "Insert to column" chip).

---

## 0. The problem

A custom section today is a single row of columns. Task 23 needs a section an admin can shape
freely: **drop elements in as rows, then split any row into columns by dropping at an element's
edge** — with a **blue line** that says, before the mouse comes up, exactly where the thing will
land.

Example that has to work, from the task:

```
Step 1 — three elements dropped in turn, each landing as its own row

  ┌ section ─────────────────────┐
  │ [ Image                    ] │  row 1
  │ [ Title                    ] │  row 2
  │ [ Description              ] │  row 3
  └──────────────────────────────┘

Step 2 — drag Title onto the RIGHT EDGE of Image

  ┌ section ─────────────────────┐
  │ [ Image      ][ Title      ] │  row 1, now two columns
  │ [ Description              ] │  row 2
  └──────────────────────────────┘

Step 3 — drag Description INSIDE the right column, under Title

  ┌ section ─────────────────────┐
  │ [ Image      ][ Title      ] │  row 1
  │ [            ][ Description] │  the right column is a STACK
  └──────────────────────────────┘
```

**[DECIDED] There is no "merge rows" step.** A column is itself a vertical stack of elements, so the
"merged rows sitting beside the image" the task describes is simply *two elements in one column*.
That is how Duda and Elementor behave, it needs no selection mode and no merge state, and it is the
model the rest of this document assumes.

---

## 1. The structure

```
Section
  └ Row            (top → bottom, reorderable)
      └ Column     (left → right, reorderable, equal share by default)
          └ Element  (vertical stack — this is what makes "merged rows" free)

**[INFERRED] Two levels of nesting only.** A column holds a stack of elements; it cannot itself be
split into further rows-of-columns. A support portal section does not need infinite nesting, and
every extra level multiplies the drop-target cases the blue line has to disambiguate. Flag this to
the product owner if a three-level layout is ever asked for.

**Caps.** Max **4 columns per row** (a fifth column in a 340–600px panel preview is unreadable).
Rows are uncapped. **[INFERRED]** — confirm.

### 1.1 Duda's own DOM, for reference (measured)

Useful because it confirms the three-level model is what a mature builder actually ships:

```
.grid-row                                  a SECTION
  └ .flex-element.group                    a COLUMN / group  (nests)
      └ .flex-element.widget-wrapper       a widget's box
          └ [data-element-type="paragraph"]  the widget itself
```

Plus the drag-time classes: `hovered-grid-when-dragging` (on both the section and the target
column), `parent-of-hovered` (on an ancestor group when a nested one is hovered),
`flex-drag-widget-placeholder` (the line), `empty-card-placeholder` (an empty cell).

Duda's palette rows are native HTML5 `draggable="true"` and carry `data-auto="add-widget-box-<type>"`
— the same approach as our `text/portal-element` MIME type, so nothing needs to change there.

### 1.2 Node ids

Today `nodeById()` in [portalPageModel.ts](src/app/components/portalPageModel.ts) synthesises a node
from its id by shape — `sec-3`, `sec-3-c0`. That scheme has no room for a row, so it grows one
segment:

```
sec-3            the section
sec-3-r1         row 2 of it
sec-3-r1-c0      the first column of that row
```

⚠️ `structureSpecId()` in [portalWidgetSpec.ts](src/app/components/portalWidgetSpec.ts) matches
`sec-N` / `sec-N-cM` **by shape, after the widget maps**. It must learn the new shape or every row
and column falls through to the wrong panel — and it will do so silently, because esbuild does not
typecheck.

---

## 2. The blue line — the heart of the task

### 2.1 What Duda actually draws — MEASURED, copy these values

Duda shows **three layers at once**, not one line. All three are the same blue: **`#188DF8`**
(`rgb(24, 141, 248)`). Values below are the true CSS values (the live canvas renders at a 0.889
scale, so the raw readings were 0.889px / 2.667px).

| Layer | What | Measured |
|---|---|---|
| **1. Section** | Outline on the whole section under the pointer | `outline: 1px solid #188DF8`, `z-index: 11` — class `grid-row hovered-grid-when-dragging` |
| **2. Target column** | Outline on the exact column that will receive the drop | `outline: 3px solid #188DF8` — class `flex-element group hovered-grid-when-dragging` |
| **3. Insertion line** | The line itself, at the gap the drop will land in | `background: #188DF8`, **3px** thick, inset to the column's *content box* (not its border box) — class `flex-drag-widget-placeholder` |
| **4. Label chip** | Names the target — see §2.3 | `::after` on layer 2 |

⚠️ **Layer 2 is what makes it legible.** A line alone tells you *where*, but not *what it lands
inside*. With three columns side by side, the line at a boundary is ambiguous until the column
around it is outlined. Do not ship the line without the column outline.

⚠️ **The line is inset to the content box.** Measured: a column at `x=59 w=194` drew its line at
`x=85 w=142` — inset by exactly the column's own padding (26px each side). A line running the full
border-box width reads as belonging to the section, not to the column.

Other measured behaviour:
- **The palette row empties while dragging.** The source row in the Elements list becomes a plain
  grey block for the duration — visible in the evidence screenshot. It is not hidden and the list
  does not reflow, so nothing below it moves under the cursor.
- The dragged item follows the cursor as a ghost.
- Over an invalid target: **no line at all**.

**[INFERRED]** Duda uses the **Moveable** library for its selection/resize box
(`moveable-control-box`, `moveable-draggable` in the DOM) — worth knowing if we ever want parity on
the resize handles, but not needed for this task.

### 2.1b How Duda decides the line's ORIENTATION — MEASURED, and it is not what we assumed

**The line is always perpendicular to the hovered container's flex direction.** That is the whole
rule, and it was measured both ways on the live editor:

| Container | Line drawn | Measured rect |
|---|---|---|
| A **vertical stack** (column of widgets) | **Horizontal**, full content width | `[288, 329, 427, 3]` — 427 wide × 3 tall |
| A **horizontal row** (the site header, 5 columns) | **Vertical**, full content height | `[654, 88, 3, 196]` — 3 wide × 196 tall |

Sweeping the pointer across the horizontal header at x = 600 → 1400 moved the vertical line to each
successive column boundary in turn (258 → 313 → 414 → 505 → 654 → 876), always snapping to the gap
nearest the pointer. So **in a horizontal container, dropping genuinely does create a new column** —
it is just an ordinary flex-sibling insert.

⚠️ **BUT: Duda does NOT create a column by dropping at the edge of a vertical stack.** This was
probed directly — four pointer positions spanning the boundary between two columns
(`right-edge-of-column`, `the gap`, `left-edge-of-next`, `mid-next-column`) **all returned the same
horizontal line**; the vertical line never appeared. Duda instead re-targets the *parent* group
(it adds a `parent-of-hovered` class) and offers a new row. To get "image left, text right" in Duda
you change the section's **Layout preset** to horizontal — the preset control documented in
`LAYOUT-ALIGNMENT-SPEC.md` §1.1 — you do not do it by aiming a drop.

**What this means for us — read before building.** The product owner has already decided
**[DECIDED]** that dropping on an element's left/right edge splits the row into columns (§0). That
decision stands and §2.2 specifies it. It is Elementor/Webflow behaviour rather than Duda's, and for
this product it is the better of the two: a support-portal admin should not have to learn what a
"flex direction" is, or find a preset control, to put a picture beside a paragraph.

So: **take Duda's visual language exactly** (the three layers, the colour, the thicknesses, the
inset, the chip) and **keep our own edge-drop mechanic**. The one rule inherited unchanged from Duda
is the orientation rule above — a line across a stack is horizontal, a line within a row is
vertical — because that part is not a preference, it is what the geometry means.

### 2.2 Where it appears — the hit-zone rule

For a target element of width `W` and height `H`, with pointer at `(x, y)` relative to it:

```
edge = min(W * 0.25, 56px)

x < edge                → VERTICAL line on the LEFT edge   → new column BEFORE
x > W - edge            → VERTICAL line on the RIGHT edge  → new column AFTER
otherwise, y < H / 2    → HORIZONTAL line ABOVE
otherwise               → HORIZONTAL line BELOW
```

Then three corrections that decide whether this feels right or cheap:

1. **The edge zones are suppressed when the row is already at 4 columns.** A vertical line that
   promises a column the row cannot take is a lie; fall back to the horizontal rule.
2. **Inside a multi-element column, the horizontal line insets to the COLUMN's width**, not the
   row's. That is the only visual difference between "new row across the whole section" and "stack
   inside this column", and without it the admin cannot tell which they are about to get.
3. **8px of hysteresis on every boundary.** Once a zone is entered the pointer must travel 8px back
   out before the line switches. Without this the line strobes between two states whenever the
   pointer rests on a boundary, which is the single most common way this feature reads as broken.

**Empty targets** — an empty section, or an empty column — take **no line**. They get a tinted fill
(`#EBF5FF`) with a 1px `#3D8BD0` outline and a centred **"Drop here"**, because a line is a statement
about a neighbour and there is no neighbour.

**Section seams** keep today's `AddSectionSeam` behaviour. A drop on a seam creates a **new
one-column section** there — already how `dropInRow` handles the auto-built section case.

### 2.3 The label chip — MEASURED

Duda names the drop target with a chip. Read straight off the live DOM, it is an `::after` on the
hovered column:

```css
.column.is-drop-target::after {
  content: "Insert to column";
  background: #188DF8;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 15px;
  border-radius: 2px;
  position: absolute;
  top: -24px;                    /* sits just above the column's top edge */
  left: 50%; transform: translateX(-50%);   /* centred on the column */
}
```

⚠️ **One string, not three.** Duda's current editor says **"Insert to column"** for *every* target,
horizontal or vertical — verified at both orientations. The three-label set recorded in
`DUDA-ADD-AND-THEME-RESEARCH.md` §1.3 (`Insert here` / `Insert in new row` / `Insert in new column`)
is the OLDER editor and is superseded by this measurement.

**What we should say instead.** Our mechanic creates rows *and* columns from the same gesture, so
one string cannot cover it — an admin who is about to split a row needs to know that before they let
go. Use three, matched to what will actually happen:

- Vertical line at an element's edge → **`Insert in new column`**
- Horizontal line spanning the section → **`Insert in new row`**
- Horizontal line inset inside a column → **`Insert here`**

Chip styling: take Duda's exactly, except **13px** rather than 14px and `#3D8BD0` rather than
`#188DF8`, to sit in our type and colour scale.

---

## 3. How an element gets in

Three routes, all landing in the same place, all going through **one funnel** so they cannot drift:

1. **Drag from the Widgets panel** — rows are already `draggable` and carry the catalogue id on the
   `text/portal-element` MIME type. ⚠️ `dataTransfer.getData()` returns `''` during `dragover` by
   design; test `dataTransfer.types.includes('text/portal-element')` there and only read the value
   on `drop`.
2. **Click a row in the Widgets panel** — adds without a drag, via `addElement()`.
3. **The `+` in the middle of a section / on the toolbar** — `addInside()`.

**[DECIDED] Routes 2 and 3 place the element in a NEW ROW, in a single column, at the LEFT.** The
task's words: *"the element will by default placed on left so every elements can be placed
accordingly."* A click has no pointer position to read a hit zone from, so it cannot mean anything
else — and left/full-width is the shape every subsequent drag re-shapes from.

Where the new row goes: **after the currently selected element's row**, or at the **end of the
section** when nothing in it is selected.

---

## 4. Sizing

### 4.1 Column width — [DECIDED]

> "Equal share always, but if we stretch any element to increase the width of any element/widget,
> then the other column will adjust with proper responsiveness of data and other columns in that
> row."

So:
- A row's columns start at an **equal share** (`1fr` each). This is already what `addColumn()` does —
  it resets every weight in the row to 1.
- Dragging an element's **side handle** grows its column. The existing `SelectionHandles` already
  write `NodeStyle.widthPct` as a **percentage of the parent** (never px — as px it could only
  shrink and never responded to the parent resizing).
- **The siblings absorb the remainder proportionally**, keeping their ratio to each other, and no
  column may fall below **15%**. When the dragged column reaches its maximum, the drag stops rather
  than pushing a sibling under the floor.
- The row always sums to 100%. A row that does not is the bug this rule exists to prevent.

### 4.2 Row height

**All columns in a row are the same height** — the task's words, *"which will have the same height
any widget is placed"*. That is `align-items: stretch`, which is also flexbox's default, so the lit
option on the cross axis must read **stretch**, not start *(measured — `LAYOUT-ALIGNMENT-SPEC.md`
§1.3)*.

A row's height is its tallest column's natural height unless the admin drags the row's bottom edge,
in which case the stored height clamps to the content as a floor.

### 4.3 Gap — on the section, not the elements

Add **`Row gap`** and **`Column gap`** to the custom section's panel. Duda puts *"Spacing between
columns"* on the section beside padding *(measured — `LAYOUT-ALIGNMENT-SPEC.md` §1.5)*, and it
belongs there: a gap is a property of the container, not of either thing either side of it.

⚠️ Do **not** add a margin control to the elements to achieve the same thing. Two controls for one
value means the one you are not looking at wins the last write.

---

## 5. Deleting and reflow — [DECIDED]

> "if user deletes any column inside the section then another section rearrange it's position to
> left side with it's default height."

- Delete an element → it leaves its column. If the column is now empty, **the column goes with it**.
- Delete a column → the remaining columns **reflow left and re-share the row equally**, and the row
  returns to its **natural height**. Any stretched `widthPct` in that row is discarded — the widths
  described a row that no longer exists.
- Delete the last column in a row → the row goes.
- Delete the last row → the section is left empty, showing its own empty state. It is **not**
  auto-removed; a section the admin added is theirs to remove.

⚠️ [PortalCanvas.tsx](src/app/components/PortalCanvas.tsx)'s `deleteNode` has a known trap: a placed
element has **two possible homes** — a section column and a built-in row's `rowExtras` — and an
earlier version only cleared the first, so deleting reported success and left the element on the
page. Clear both; the element lives in one, so the other pass is a harmless no-op.

---

## 6. Which widgets, this pass

**In scope now** — Basic, Visual and Custom, specifically: **Text · Title · Button · Image · Table ·
Accordion · Divider**.

**[DECIDED] Bring the Divider back.** It is currently hidden by the `PortalElement.hidden` flag; its
spec and renderer are intact, so restoring it is one line. ⚠️ Filter hidden elements **before** the
search, or a hidden row is still reachable by typing its name, and remember the builder's demo seed
filters separately.

**Out of scope this pass — write each into `future-tasks.md` instead of building it:**
- **List** — not built at all yet. Write the Listing widget up as a future task.
- **Media Slider**, **Advanced Tabs**, **Spacer** — already parked behind their flags; leave them.
- **Text with Image** — exists, but wiring it into the row/column model waits.

---

## 7. Scope of the sections themselves

**[INFERRED] Added sections only** (`sec-N`). The built-in bands — hero, Quick Actions, the
live-data rows — keep exactly today's behaviour, and Quick Actions is already fenced by
`LOCKED_ROWS` in `portalPageModel`, which is the single funnel every add route ends at. Confirm
before widening this.

---

## 8. Existing code this must go through

| What | Where |
|---|---|
| `Sel`, selection, toolbars, handles, `dropInRow`, `LOCKED_ROWS`, `addColumn`, `ColumnAdders` | [PortalCanvas.tsx](src/app/components/PortalCanvas.tsx) |
| `nodeById()`, `PORTAL_NODES`, `SECTION_LAYOUTS`, `SECTION_PAD`, `fillCss`, `paintsOwnSurface` | [portalPageModel.ts](src/app/components/portalPageModel.ts) |
| `addElement`, `addInside`, `sections`, `moveTo`, `detachElement`/`relocateElement`, undo | [SupportPortalBuilder.tsx](src/app/components/SupportPortalBuilder.tsx) |
| Draggable palette rows, `text/portal-element` MIME, `elementIcon` | [SupportPortalAddPanel.tsx](src/app/components/SupportPortalAddPanel.tsx) |
| `AddedSection`, `ColumnBody`, rendering | [SupportPortalPreview.tsx](src/app/components/SupportPortalPreview.tsx) · [PortalPlacedElement.tsx](src/app/components/PortalPlacedElement.tsx) |
| The section panel where Row gap / Column gap land | [portalStructureSpecs.ts](src/app/components/portalStructureSpecs.ts) |

### Traps already documented in this codebase — do not rediscover them

1. **`Sel` renders a `<div>`** — it must never wrap a `<tr>`, or the row leaves the table box model.
2. **Ordering is CSS `order` on flex siblings**, handled once inside the `card()` helper. Bands take
   even slots and the seam after each takes the odd one; a seam without its own order collapses to 0
   and every lower seam disappears.
3. **Exactly ONE component may apply a node's style — `Sel`.** `AddedSection` once spread `styleOf`
   on the section *and* again on an inner div, so every value landed twice.
4. **Padding belongs to the painted box.** Anything that draws its own card (`paintsOwnSurface`)
   takes padding and height itself as `minHeight`; on the wrapper it becomes grey space around the
   card and a dragged height clips it.
5. **Undo is snapshot-based**, over eleven state atoms. New state added by this task must join that
   snapshot or undo will silently skip a step. The `applying` guard clears on `setTimeout(…, 0)`,
   never inside the effect.
6. **`npm run build` is esbuild only — it does not typecheck.** A removed variable still referenced
   in JSX builds green and blanks the page at runtime. Verify in the browser.

---

## 9. Definition of done

Reproduce, in the browser, on a newly added empty section:

1. Drop Image, Title, Description one after another → three rows, each full width, left-aligned.
2. Drag Title onto Image's right edge → **vertical** blue line + **`Insert in new column`** → drop →
   row 1 is two equal columns.
3. Drag Description into the right column under Title → **horizontal line inset to that column** +
   **`Insert here`** → drop → the right column is a two-element stack, the row is one row.
4. Hold the pointer exactly on a hit-zone boundary and jiggle 4px → **the line does not strobe**.
5. Fill a row to 4 columns → the edge zones stop offering a 5th; the line falls back to horizontal.
6. Stretch the Image's side handle → it grows, the right column shrinks proportionally, neither goes
   below 15%, the row still sums to 100%.
7. Delete the Image's column → the remaining column reflows left, full width, natural height.
8. Set Row gap 24 / Column gap 32 on the section → both apply, and no element carries a margin.
9. Add a Divider between two rows → it appears in the palette and drops like any other element.
10. Undo the entire sequence step by step → every step reverses, including the deletes.
11. Second example from the task — Title, Description, Table as three plain rows — needs **no**
    control beyond the gap fields.

---

## 10. Open questions for the product owner

Answer these before building anything marked **[INFERRED]**:

1. **Nesting depth** — is "a column cannot itself be split into rows" acceptable, or is a
   three-level layout expected? (Duda nests groups freely; we are proposing to stop at two.)
2. **Column cap** — is 4 per row right? Duda's measured header runs 5.
3. **Section scope** — added sections only, or should the built-in bands accept this too?
4. **Responsive** — what happens to a 3-column row on a phone? Stack all columns, or keep 2 up?
   Nothing in task 23 says, and it changes the data model (a per-breakpoint width or a single one).
   This is the one that most affects the shape of the code, so it is worth settling first.

Settled on 25 Aug 2026 and **not** open: the edge-drop mechanic (§2.1b), the three-label wording
(§2.3), equal-share-until-stretched widths (§4.1), the Divider's return (§6).
