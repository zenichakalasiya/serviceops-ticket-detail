# Keyboard Shortcuts

Reference for developers. This file is the **single source of truth** for every keyboard
shortcut in the ServiceOps Ticket Detail app. Keep it in sync whenever a shortcut is
added, removed, or changed.

> **Why `Alt`-based?** This is a web app. `Ctrl+W`, `Ctrl+Tab`, `Ctrl+T`, `Ctrl+L`
> and `Ctrl+PageUp/Down` are **reserved by the browser and cannot be intercepted** (they'd
> close the browser tab, switch browser tabs, focus the address bar, etc.). So drawer
> shortcuts use `Alt`+key combos plus a couple of safe single keys (`?`, `Esc`).
>
> ⚠️ **`Ctrl+D` was on that list and does not belong there.** It is the browser's *bookmark*
> shortcut, which `preventDefault()` stops like any other — measured in Chrome on 27 Sep 2026,
> where `Ctrl+D` duplicates a section in the portal builder and no bookmark dialog appears. The
> genuinely un-interceptable ones are the window and tab commands above.
>
> **All shortcuts are disabled while typing** in an `<input>`, `<textarea>`, `<select>`, or
> any `contentEditable` element.
>
> **A few `Alt` combos may be claimed by the browser or its extensions** and cannot be
> overridden by a web page — e.g. `Alt+G` triggers **Gemini in Chrome**. Where that clashes,
> we pick a free key (that's why AI Summary is `Alt+Z`, not `Alt+G`).

---

## 1. Detail Drawer (all detail pages)

Works in every detail drawer — Ticket, Problem, Change, Release, Hardware / Software /
Non-IT / Consumable Asset, Software License, Contract, Purchase, CMDB.

Implemented once in **`src/app/components/DrawerShortcuts.tsx`**, mounted by
`DrawerStackProvider` (`DrawerStack.tsx`).

| Shortcut | Action |
|---|---|
| `Alt + M` | Minimize / restore drawer (toggle — collapses to the right rail, press again to reopen) |
| `Alt + W` | Close the current item tab |
| `Alt + Shift + W` | Close all item tabs |
| `Alt + F` | Toggle Small / Full view |
| `Alt + ]` / `Alt + [` | Next / Previous record (open item tab) |
| `Alt + ↓` / `Alt + ↑` | Switch right-panel group (Ticket Properties → Activity → Suggestions → Notifications → …) |
| `Alt + .` / `Alt + ,` | Next / Previous content tab (Overview → Properties → …) |
| `Alt + I` | Open / close the AI chat (“Ask AI”) — toggle |
| `Alt + C` | Copy record ID |
| `Alt + U` | Copy record link (URL) |
| `Alt + S` | Change status (opens the status dropdown — Ticket / Problem / Change / Release) |
| `Alt + E` | Edit record |
| `Alt + R` | Reply — opens the reply editor in the Conversation tab |
| `Alt + N` | Add Note |
| `Alt + A` | Expand / collapse the AI Summary card (Ticket / Problem / Change / Release) |
| `Alt + O` | Open the 3-dot actions menu |
| `Shift + ?` | Show the shortcuts cheat-sheet popup |

**Notes**
- Open items *are* the records in the drawer-stack architecture, so **next/prev record**
  (`Alt + ↓/↑`) and **next/prev open tab** (`Alt + ]/[`) act on the same set.
- Window/tab actions use the host's own state (the same handlers the tab strip UI uses).
  In-drawer actions (view toggle, AI, edit, add relation, note, menu, content-tab switch)
  are triggered by scoped DOM lookups against the visible `[data-drawer]` element and are a
  graceful no-op if the target isn't present on that page.

---

## 2. Relationship / Dependency Map canvas

Works when the Relationship tab (or the CMDB **Dependency Map** view) is active. These are
**single-key** shortcuts (no `Alt`) — they do not conflict with the drawer shortcuts above.

Implemented in **`src/app/components/RelationshipGraph.tsx`** (canvas) and the drawer's
relationship toolbar effect.

| Shortcut | Action |
|---|---|
| `↑ ↓ ← →` | Pan the graph |
| `+` / `−` | Zoom in / out |
| `F` | Fit & center all nodes |
| `1` / `2` / `3` | Full / Tree / Grid view |
| `Ctrl + Shift + F` | Toggle fullscreen |
| `M` | Toggle minimap |
| `L` | Toggle type legend |
| `R` | Reset layout (collapse all, clear pins, re-fit) |
| `Ctrl + F` | Focus the node search |
| `Esc` | Clear search / deselect |

The full list is also shown in the canvas's on-screen **keyboard-shortcuts popup**
(the ⌨ button in the top-right canvas controls).

---

## 3. Patch Superseded map canvas

Works when the Patch detail page's **Superseded** tab is active. Same single-key model as
the Dependency Map (section 2), minus the features that map doesn't have (no minimap /
legend / view modes) and plus `E` for expand/collapse-all.

Implemented in **`src/app/components/PatchSupersededTab.tsx`** (canvas keys need the canvas
focused — click it once; `Ctrl+F` / `Ctrl+Shift+F` / `E` work tab-wide).

| Shortcut | Action |
|---|---|
| `↑ ↓ ← →` | Pan the canvas |
| `+` / `−` | Zoom in / out |
| `F` | Fit & center all nodes |
| `E` | Expand / collapse all versions |
| `R` | Reset layout (collapse all, re-fit) |
| `Ctrl + Shift + F` | Toggle fullscreen |
| `Ctrl + F` | Focus the node search |
| `Esc` | Clear search (in the field) / hide the hover card (on canvas) |

Also listed in the tab's own ⌨ keyboard-shortcuts popup (top-right canvas controls).

---

## 4. Deployment Topology canvas

Works when a Deployment tab's **Topology** view is active (Patch / Patch Deployment /
Vulnerability / Detected CVE detail pages). Same single-key model as the other canvases.

Implemented in **`src/app/components/DeploymentTopologyView.tsx`** (canvas keys) and
`PatchInstallationTab.tsx` (`Ctrl+F` search focus while the Topology view is active).

| Shortcut | Action |
|---|---|
| `↑ ↓ ← →` | Pan the canvas |
| `+` / `−` | Zoom in / out |
| `F` | Fit & center all nodes |
| `R` | Reset view (expand all, re-fit) |
| `Ctrl + F` | Focus the node search |
| `Esc` | Clear search (in the field) / close the shortcuts popup |

Also listed in the view's own ⌨ keyboard-shortcuts popup (top-right canvas controls).

---

## 5. Support Portal builder

The page-design canvas at **Admin › Support Channels › Support Portal › Customise portal**.
Implemented in **`src/app/components/PortalShortcuts.tsx`**, mounted inside both
`CanvasProvider`s in `SupportPortalBuilder.tsx` — so the read-only Preview gets only the two
keys that mean anything there.

> **Why bare letters here, when the drawer uses `Alt`?** They are different surfaces with
> different budgets. A drawer sits over a list and shares its keyboard with whatever is behind
> it; the builder is `fixed inset-0` with the product header and the admin sidebar removed, so
> the only thing competing for a keystroke is a text field — and every binding already bails on
> one. Cheap keys go to the most-used actions.
>
> ⚠️ **`Alt` is free in the builder only because `DrawerShortcuts` opens with
> `if (!props.active) return`** — a detail drawer has to exist, and none does in Admin. Render a
> drawer over this surface and every `Alt` binding below collides.
>
> ⚠️ **`/` and `Ctrl+K` are deliberately unbound.** `GlobalSearch` is mounted once by `App` and
> answers on every page, this one included. `Alt+1` opens the Widgets panel and focuses its own
> search instead.
>
> ⚠️ **Publish has no shortcut, on purpose.** It changes what requesters see and can demote
> another portal to Draft — the only action on this screen whose consequence is outside the page.

**One modifier, one class of action.** That is the whole scheme, and it is what lets somebody
guess a key they have never pressed:

| | |
|---|---|
| bare letter | a button on **this widget's** floating toolbar |
| bare arrow | move it (reorder among its siblings) |
| `Shift` + arrow | resize it |
| `Alt` + arrow | change **what is selected** |
| `Alt` + digit | the builder's own chrome (rail, panel) |
| `Ctrl`/`Cmd` | document verbs the OS already taught them |

### Select

| Shortcut | Action |
|---|---|
| `Alt` + `↑` | Select the parent — column, row or section (the *Select the row* button, too) |
| `Alt` + `↓` | Select the first thing inside |
| `Alt` + `←` / `→` | Previous / next sibling |
| `Esc` | Deselect — which also closes any popup, since the bar unmounts with the selection |

### Move and size

| Shortcut | Action |
|---|---|
| `←` `→` `↑` `↓` | Move one place |
| `Shift` + `←` / `→` | Narrower / wider (`widthPct`, 1% a press) |
| `Shift` + `↑` / `↓` | Shorter / taller (8px a press) |

⚠️ Only the parent's **own axis** answers, because only that axis has a button on the bar. The
cost is stated on the sheet: with a widget selected the canvas cannot be arrow-scrolled — press
`Esc` first.

### Place

| Shortcut | Action |
|---|---|
| `A` | Add a widget beside this one |
| `Shift` + `A` | Add an item **inside** it (Accordion, FAQ, any collection) |
| `R` | Replace this widget |
| `Ctrl` + `D` | Duplicate |
| `S` | Split into columns / rows |
| `Enter` | Edit the words |
| `Delete` / `Backspace` | Delete |

### Style — each opens its popup

| Shortcut | Action |
|---|---|
| `B` | Background colour |
| `O` | Border (**o**utline) |
| `C` | Corner radius |
| `D` | **D**rop shadow |
| `H` / `V` | Horizontal / vertical alignment |
| `I` | Icon — action cards and data tiles |
| `G` | Arrangement and presets |
| `P` | Spacing (opens the panel's matrix and scrolls to it) |

None of these cycles a value. Cycling a colour or a shadow by keypress lands a value nobody
chose, and these are exactly the properties judged by eye against the page behind them.

### The builder

| Shortcut | Action |
|---|---|
| `Alt` + `1` … `4` | Widgets · Theme · Branding · Banners |
| `Alt` + `0` | Hide the design panel |
| `Alt` + `P` | Preview — and `Esc` or `Alt+P` back |
| `Ctrl` + `S` | Save as draft |
| `Ctrl` + `Z` / `Ctrl`+`Shift`+`Z` | Undo / Redo *(owned by `SupportPortalBuilder`, not this file)* |
| `?` | Open the shortcuts sheet |

Also reachable from the top bar's **Help** menu (*Take the tour* · *Keyboard shortcuts*).

### How a widget action is actually performed

Every widget shortcut is a **click on the real floating toolbar**, found by its `data-tip`,
rather than a second call into the canvas context. The middle reason is the important one:

- the bar is already rendered for the selected node, so there is nothing to look up;
- **a button exists only when its action is legal** — a move arrow is absent at the end of a row
  and on the wrong axis, Replace is absent where nothing can be swapped, Copy is absent on a
  widget with no instance to clone — so a key that cannot apply is a no-op for free, with no
  second copy of the rules to keep in step;
- it is the pattern `DrawerShortcuts` already uses.

A tip carrying a live value (`Horizontal alignment — centre`) is matched on its **prefix**.

⚠️ **`Add a widget beside this one` and `Add a question` both begin `Add a `**, and they are
opposite actions. `pressAddInside` is whatever `Add a …` is left once the beside-one is
excluded, so a new collection's own wording needs no change there.

⚠️ **A TEXT node shows the text toolbar, not the element one.** Clicking into a widget's words
selects the text child, whose bar carries Bold / Italic / colour — so `B`, `O`, `C` and the rest
find nothing there and correctly do nothing. Press `Alt`+`↑` to reach the frame first.

---

## Maintenance

When you add, change, or remove a shortcut:
1. Update the implementation (`DrawerShortcuts.tsx` for drawer-wide,
   `RelationshipGraph.tsx` for the Relationship/Dependency Map canvas,
   `PatchSupersededTab.tsx` for the Superseded map, or
   `DeploymentTopologyView.tsx` for the Deployment Topology canvas, or
   `PortalShortcuts.tsx` for the Support Portal builder).
2. Update the in-app cheat-sheet (`SHORTCUTS` array in `DrawerShortcuts.tsx`, `GROUPS` in
   `PortalShortcuts.tsx`, and/or the matching canvas shortcuts popup).
3. Update **this file**.
