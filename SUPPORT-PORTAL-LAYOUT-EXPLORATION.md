# Support Portal — layout exploration

Twelve page layouts for the requester-facing Support Portal, built to be reproducible from one set
of builder primitives.

⚠️ **The primitives list in §5 is not hypothetical.** It is checked against this repository, so every
row says whether the thing exists today, exists but is wired to the wrong flag, or is genuinely new.
That is the section to read if you want to know what any of this costs.

**Fixed:** left icon rail, top utility bar, chat FAB, the data each widget shows.
**Grid:** 12 columns · 1440 content width · responsive to 375.

---

## 1 · Taxonomy

### A — Banner visual treatment

| Option | When it is the right call |
|---|---|
| None | The page's job is a list or a search. Every pixel of banner is a pixel not answering the question. |
| Solid colour | White-label tenants. One brand value, no interpretation, survives any logo. |
| Linear gradient | The safe default. Gives a flat band a light source without asking anyone for artwork. |
| Mesh / radial | When the banner is tall (≥320) and would otherwise read as a printed rectangle. |
| Photographic | Tenants with a real photo library — Higher Education, Healthcare, Retail. ⚠️ Needs an overlay and a contrast check; most tenants do not have usable photos. |
| Flat illustration | Warm, non-technical audiences. HR, Facilities, Government-facing-citizens. |
| Isometric illustration | IT and Manufacturing — reads as "systems" without a photo. Ages fast. |
| Line-art / technical | Current default. Quiet, brand-neutral, never competes. |
| 3D logo forms | Brand-led tenants who want the portal to feel like the marketing site. High production cost. |
| Abstract 3D shapes | Same, without needing the logo in 3D. Cheapest "premium" look. |
| Geometric composition | Government, Finance — formal, cheap, scales to any width. |
| Photo + overlaid shapes | When the photo alone fails contrast; shapes carry the text. |
| Pattern / texture | Retail, Education. Tiles at any size, no asset pipeline. |
| Glassmorphic / blurred | Only over a photo or gradient. Never over flat colour — there is nothing to blur. |
| Duotone | Turns any stock photo into brand. The one treatment that makes bad photography usable. |
| Split (image ÷ colour) | When the banner must hold BOTH a message and a control — colour side takes the text. |
| Animated / looping | Status and incident portals, where motion means "live". Everywhere else it is noise. |
| Data motif | A live sparkline or count rendered as the artwork. Honest and specific; needs real data. |

### B — Banner structure

| Axis | Options | Note |
|---|---|---|
| Containment | Full-bleed · inset rounded card · contained with margin | Inset reads as "a widget"; full-bleed reads as "the page". |
| Height | Hero 400 · Mid 260 · Compact 180 · Bar 96 | ⚠️ Height is the strongest signal of what the page is FOR. Tall says brand; bar says work. |
| Alignment | Centre · left · split | Left scales to long tenant names; centre does not. |
| Search placement | Inside · straddling the bottom edge · below · promoted to top bar · omitted | Straddling makes the field the page's subject rather than the banner's furniture. |

### C — Quick actions

| Axis | Options |
|---|---|
| Count | 1–8 |
| Arrangement | Single row · 2-row grid · overlapping the banner edge · embedded inside the banner · vertical rail · segmented pill bar · one hero action + secondary links · bento of unequal sizes |
| Card anatomy | Icon-left · icon-top · icon-right · icon as background watermark · icon-only · no icon · ± description · ± arrow |
| Density | Comfortable (p-16, 2 lines) · compact (p-12, 1 line) · chip (p-8, no description) |

⚠️ **Count drives arrangement, not the reverse.** 1–2 actions want a hero treatment; 3–5 a single row; 6–8 a 2-row grid or a pill bar. A 4-column row with 6 actions wraps into a widow.

### D — Data widgets

| Axis | Options |
|---|---|
| Grouping | One card per widget · merged multi-entity card · tabbed container · accordion · segmented control · stat tiles + one detail panel |
| Composition | Equal-height grid · masonry · 2-column asymmetric · 3-column with right rail · full-width stacked · bento |
| Rendering | Card list · compact table · timeline · summary counter with drill-in |

### E — Service shortcuts

Count 1–4 (or more) · grid · carousel · list · chip cloud · **merged into one Services section with a
category filter** · kept as two sections (Favourites / Most Used).

⚠️ Two sections of four tiles that look identical is the current weakness: the reader cannot tell
why a service is in the top row rather than the bottom one. Either label the difference loudly or
merge them.

### F — Page composition archetype

Classic top-down · left content + persistent right rail · two-column split · bento/mosaic ·
dashboard-first · search-first minimal · card feed · tabbed workspace.

---

## 2 · The twelve layouts

Scores are 1–5 on **TTA** time-to-primary-action · **Scan** scan clarity · **Scent** information
scent · **Brand** expressiveness · **Cost** build cost (5 = cheap) · **Sparse** resilience to an
empty tenant.

---

### L1 · Classic Desk
**Intent:** the balanced default — search, act, then see your own work.
**Fits:** IT, mixed traffic. First-time and returning.

```
1440                                             375
┌──────────────────────────────────────────┐    ┌────────────┐
│ BANNER mid 260, gradient, centred        │    │ BANNER 180 │
│        [ search 60% ]                    │    │ [ search ] │
├───┬───┬───┬──────────────────────────────┤    ├────────────┤
│ A │ A │ A │ A   (4 actions, icon-left)   │    │ A          │
├───┴───┴───┴──────────────────────────────┤    │ A          │
│ Services · 4 tiles                       │    │ A  A       │
├────────────┬────────────┬────────────────┤    ├────────────┤
│ Requests   │ Approvals  │ Most Read      │    │ Services→  │
├────────────┴────────────┼────────────────┤    ├────────────┤
│ My Assets               │ Announcements  │    │ Requests   │
│ My CIs                  │ Contact Us     │    │ Approvals  │
└─────────────────────────┴────────────────┘    └────────────┘
```

**Sections:** banner (12) → actions (4×3) → services (12) → work (8) + rail (4).
**Grouping:** none. Every widget is its own card.
**0 items:** each card shows its own empty line. **Overflow:** 5 rows + "View all".
**Disabled:** the band collapses; the ones below move up.
**Trade-off:** nothing is wrong with it and nothing is memorable about it.
`TTA 4 · Scan 3 · Scent 4 · Brand 3 · Cost 5 · Sparse 4`

---

### L2 · Search Spotlight  *(built)*
**Intent:** ask one question and get out of the way.
**Fits:** IT and Higher Education with heavy "how do I" traffic.

```
1440                                             375
┌──────────────────────────────────────────┐    ┌────────────┐
│ BANNER compact 210, gradient, centred    │    │ BANNER 160 │
│                                          │    │            │
│     ┌────────────────────────────┐       │    ├─[ search ]─┤
└─────┤  search, pill, straddling  ├───────┘    ├────────────┤
      └────────────────────────────┘            │ A  A       │
┌───┬───┬───┬──────────────────────────────┐    │ A  A       │
│ A │ A │ A │ A                            │    ├────────────┤
├───┴───┴───┴──────────────────────────────┤    │ Most Read  │
│ Services · 4 tiles                       │    │ Requests   │
├─────────────────────────┬────────────────┤    │ Approvals  │
│ Requests  │ Approvals   │ ▸ Most Read    │    └────────────┘
│ My Assets │ My CIs      │   Announcements│
│           │             │   Contact Us   │
└───────────┴─────────────┴────────────────┘
```

**Grouping:** none — but **Most Read leads the rail**, ahead of Announcements.
**Trade-off:** the straddling field costs 34px of vertical rhythm and needs `overflow-visible`, which
means the banner can no longer clip its own artwork without an inner wrapper.
`TTA 5 · Scan 4 · Scent 4 · Brand 3 · Cost 4 · Sparse 5`

---

### L3 · Catalogue Counter
**Intent:** most of this tenant's traffic is a *request*, so lead with what can be requested.
**Fits:** HR, Facilities, Retail, Procurement.

```
1440
┌──────────────────────────────────────────┐
│ BANNER bar 96 · left-aligned · [search in bar]
├──────────────────────────────────────────┤
│ CATEGORY GRID — 6 tiles, icon-top        │
│ ┌────┬────┬────┬────┬────┬────┐          │
│ │Hard│Soft│Acce│Onbo│Leav│Faci│          │
│ └────┴────┴────┴────┴────┴────┘          │
├──────────────────────────────────────────┤
│ Popular services · 4 tiles               │
├──────────────────────┬───────────────────┤
│ My Open Requests     │ Contact + Announce│
└──────────────────────┴───────────────────┘
```

**Grouping:** Announcements + Contact Us **merge** into one support-info card.
Approvals, Assets and CIs move **below the fold** — a requester in a catalogue is not auditing kit.
**0 items:** the category grid is admin-defined, so it is never empty; if it is, the layout falls back
to L1.
**Trade-off:** a daily power user has to scroll past a shop to reach their own work.
`TTA 5 · Scan 5 · Scent 5 · Brand 3 · Cost 4 · Sparse 3`

---

### L4 · Status Board
**Intent:** answer "is anything waiting on me?" before offering anything to do.
**Fits:** Manufacturing, Finance, IT power users.

```
1440
┌──────────────────────────────────────────┐
│ BANNER bar 96 · tenant name · [search]   │
├────────┬────────┬────────┬───────────────┤
│  5     │  2     │  0     │  12           │  ← stat tiles, drill-in
│ Open   │ Waiting│ Overdue│ Assets        │
├────────┴────────┴────────┴───────────────┤
│ ▸ Requests │ Approvals │ Tasks  (TABBED) │
│   compact table, 8 rows                  │
├──────────────────────┬───────────────────┤
│ Announcements        │ Quick actions ×4  │
└──────────────────────┴───────────────────┘
```

**Grouping:** Requests + Approvals + Tasks → **one tabbed container**. Assets + CIs → one counter.
⚠️ **Actions move BELOW the data.** For a daily user the action row is muscle memory, not discovery.
**0 items:** the counters read 0 in grey, and the tabbed card shows one empty state, not three.
**Trade-off:** hostile to a first-time requester, who sees numbers before doors.
`TTA 3 · Scan 5 · Scent 5 · Brand 2 · Cost 2 · Sparse 5`

---

### L5 · Concierge Rail
**Intent:** the page is a conversation with the service desk; the rail is the desk.
**Fits:** Healthcare, Government, Legal — regulated tenants with a lot to announce.

```
1440
┌──────────────────────────────────────────┐
│ BANNER mid 260 · split: illustration|text│
├───────────────────────────┬──────────────┤
│ Actions ×3 (icon-left)    │ ANNOUNCEMENTS│
│                           │  (persistent)│
├───────────────────────────┤  Contact Us  │
│ My Open Requests          │  Service     │
│ Pending Approvals         │  status      │
├───────────────────────────┤  Hours       │
│ Most Read                 │              │
└───────────────────────────┴──────────────┘
```

**Grouping:** Announcements + Contact + status → **one persistent rail card stack**, never scrolled
away. Assets + CIs merged into one "My equipment" card below.
**Trade-off:** the rail costs a third of the width on every screen, including the ones with nothing
in it.
`TTA 3 · Scan 4 · Scent 4 · Brand 4 · Cost 3 · Sparse 2`

---

### L6 · Bento Mosaic
**Intent:** an unequal grid where size states priority.
**Fits:** Higher Education, Retail, brand-led tenants.

```
1440
┌──────────────────────────────────────────┐
│ BANNER inset card, 240, duotone photo    │
├────────────────────┬─────────┬───────────┤
│                    │ Action  │ Action    │
│  SEARCH (2×2)      ├─────────┴───────────┤
│                    │ Most Read           │
├──────────┬─────────┴─────────┬───────────┤
│ Requests │ Approvals         │ Announce  │
├──────────┴───────────────────┤           │
│ My equipment (Assets + CIs)  │ Contact   │
└──────────────────────────────┴───────────┘
```

**Grouping:** Assets + CIs merge. Search becomes **a tile, not a band**.
**Trade-off:** every tile needs a defined span, so an admin who deletes one leaves a hole the grid
has to reflow — the most expensive layout to keep tidy.
`TTA 4 · Scan 3 · Scent 3 · Brand 5 · Cost 2 · Sparse 2`

---

### L7 · Two-Column Split
**Intent:** "get help" on one side, "your stuff" on the other, decided once at the top.
**Fits:** IT, Facilities.

```
1440
┌─────────────────────┬────────────────────┐
│ BANNER half         │ Actions ×4 stacked │
│ image + headline    │ (icon-left, full)  │
├─────────────────────┴────────────────────┤
│ [ search, full width, below the split ]  │
├──────────────────────┬───────────────────┤
│ GET HELP             │ YOUR WORK         │
│  Most Read           │  Requests         │
│  Services            │  Approvals        │
│  Contact             │  Assets + CIs     │
└──────────────────────┴───────────────────┘
```

**Grouping:** two labelled columns are themselves the grouping — knowledge left, records right.
**Trade-off:** the split is a claim about intent, and a requester who wants both reads twice.
`TTA 4 · Scan 4 · Scent 5 · Brand 4 · Cost 3 · Sparse 4`

---

### L8 · Compact Bar
**Intent:** no hero at all; the portal is a tool, not a front door.
**Fits:** Manufacturing, Finance, any tenant whose users are on it daily.

```
1440
┌──────────────────────────────────────────┐
│ [logo]  [ search — promoted to top bar ] │  ← no banner band
├──────────────────────────────────────────┤
│ Actions as a segmented pill bar ×5       │
├──────────┬──────────┬────────────────────┤
│ Requests │ Approvals│ Most Read          │
├──────────┴──────────┼────────────────────┤
│ Assets + CIs        │ Announce + Contact │
└─────────────────────┴────────────────────┘
```

**Grouping:** two merged cards. Density compact throughout.
**Trade-off:** zero brand expression. A tenant who bought the portal to look like their brand gets
nothing here.
`TTA 5 · Scan 5 · Scent 4 · Brand 1 · Cost 4 · Sparse 5`

---

### L9 · Answer First  ⚡ *breaks: "a page is a set of sections"*
**Intent:** the whole first screen is one field and what it suggests. Everything else is below it.

```
1440 — first viewport is ONLY this
┌──────────────────────────────────────────┐
│                                          │
│        What do you need help with?       │
│   ┌────────────────────────────────┐     │
│   │  search, 56px, centred, 640w   │     │
│   └────────────────────────────────┘     │
│   Popular: VPN · Password · New laptop   │  ← typed chips
│                                          │
└──────────────────────────────────────────┘
      ↓ scroll reveals everything else
```

**Grouping:** below the fold reverts to L1.
**⚠️ The chips are the layout.** Without live popular-query data this becomes an empty room.
**Trade-off:** a returning user with two approvals waiting has to scroll to learn that.
`TTA 5 · Scan 5 · Scent 2 · Brand 2 · Cost 3 · Sparse 1`

---

### L10 · Inbox  ⚡ *breaks: "widgets are one-per-card"*
**Intent:** there are no widgets. There is one prioritised feed of things involving you.

```
1440
┌──────────────────────────────────────────┐
│ BANNER bar 96 · [search]                 │
├──────────────────────────────────────────┤
│ ● Approval needed · AST-13     [✓] [✗]  │  ← inline action
│ ● INC-187 In Progress · updated 2h       │
│ ● Announcement · VPN rollout Mon         │
│ ● SR-201 Open · awaiting parts           │
│ ● KB-4 suggested for your open request   │
├──────────────────────────────────────────┤
│ + New incident   + Request service       │
└──────────────────────────────────────────┘
```

**Grouping:** **every widget merges into one stream**, sorted by what needs the requester.
**0 items:** one line — "Nothing needs you right now" — which is a genuinely good state, unlike six
empty cards.
**Trade-off:** needs a ranking rule the product does not have yet, and a wrong rank is worse than no
rank.
`TTA 4 · Scan 5 · Scent 5 · Brand 1 · Cost 1 · Sparse 5`

---

### L11 · Vertical Command Rail  ⚡ *breaks: "actions sit below the banner"*
**Intent:** actions are permanent furniture down the left of the content, not a row you scroll past.

```
1440
┌──────────────────────────────────────────┐
│ BANNER compact 180 · left-aligned        │
├────┬─────────────────────────────────────┤
│ ⊕  │ [ search ]                          │
│New │─────────────────────────────────────│
│ ⊞  │ Requests    │ Approvals             │
│Svc │─────────────┴───────────────────────│
│ ⚿  │ Most Read   │ Announcements         │
│ AD │─────────────┴───────────────────────│
│ ◈  │ Assets + CIs                        │
│ KB │                                     │
└────┴─────────────────────────────────────┘
```

**Grouping:** Assets + CIs merge to keep the content column to two.
**⚠️ 375:** the rail becomes a bottom-fixed action bar, not a left one.
**Trade-off:** a second vertical rail beside the product's own icon rail — two columns of icons doing
different jobs, one pixel apart.
`TTA 5 · Scan 3 · Scent 3 · Brand 2 · Cost 2 · Sparse 4`

---

### L12 · Zero-Chrome  ⚡ *breaks: "there is a banner"*
**Intent:** no banner, no section headings, no page furniture. Cards on a ground, and the search is
one of them.

```
1440
┌──────────────────────────────────────────┐
│ ┌──────────────────┐ ┌────────┬────────┐ │
│ │ search  (6 cols) │ │ 5 Open │ 2 Appr │ │
│ └──────────────────┘ └────────┴────────┘ │
│ ┌────────┬────────┬────────┬───────────┐ │
│ │New Inc │Request │AD Self │Knowledge  │ │
│ └────────┴────────┴────────┴───────────┘ │
│ ┌──────────────────┐ ┌─────────────────┐ │
│ │ Most Read        │ │ Announcements   │ │
│ └──────────────────┘ └─────────────────┘ │
└──────────────────────────────────────────┘
```

**Grouping:** counters replace the Requests and Approvals lists entirely; the lists live one click in.
**Trade-off:** with no headings, a tenant who adds a seventh card gets a wall with no reading order.
`TTA 4 · Scan 4 · Scent 3 · Brand 3 · Cost 3 · Sparse 5`

---

## 3 · Domain → recommended combination

| Domain | A banner | B structure | C actions | D widgets | E services | F archetype | Layout |
|---|---|---|---|---|---|---|---|
| IT | Gradient | Compact, straddling search | 4, icon-left | 3-col + rail | Merged, grid | Search-first | **L2** |
| HR | Flat illustration | Bar, search in bar | 6, icon-top | Merged support card | Category grid | Catalogue | **L3** |
| Healthcare | Split illustration | Mid, left | 3, icon-left | Persistent rail | List | Left + rail | **L5** |
| Finance | Geometric | Bar 96 | 5, pill bar | Tabbed + counters | Hidden | Dashboard-first | **L4** |
| Facilities | Photo + shapes | Mid, centred | 6, icon-top | One-per-card | Category grid | Two-column | **L7** |
| Higher Ed | Duotone photo | Inset card | 4, icon-top | Bento | Carousel | Bento | **L6** |
| Manufacturing | None | Search in top bar | 5, pill bar | Merged, compact | Hidden | Compact | **L8** |
| Retail | Pattern | Inset, centred | 6, icon-top | Bento | Chip cloud | Bento | **L6** |
| Government | Solid colour | Mid, left | 3, icon-left + description | Persistent rail | List | Left + rail | **L5** |

---

## 4 · Cross-cutting behaviour

| Condition | Rule |
|---|---|
| **0 items in a card** | The card stays with its own empty line. ⚠️ Never hide it — a card that disappears when empty teaches the requester the page changes shape for reasons they cannot see. |
| **0 items in a whole band** | The band collapses and the ones below move up. |
| **Overflow (20+ assets)** | 5 rows then "View all · 20". Never a scrollbar inside a card. |
| **Admin disables a section** | Removed from the order; the layout reflows. It stays addable in the palette. |
| **Sparse tenant** | Any layout scoring **Sparse ≤ 2** must not be offered to a tenant with no announcements and no assets. That is L5, L6 and L9. |
| **Long tenant name** | Banner alignment falls back to left; centred titles truncate badly. |
| **Dark theme** | Every banner treatment except photographic has a dark value. Photographic needs an overlay bump. |
| **Contrast** | Hero text over any treatment must clear 4.5:1 — the builder already measures it (`portalContrast.ts`). |
| **Touch** | Action cards ≥ 44px tall at 375; the pill bar at 375 becomes a 2-row grid, never a scroller. |

---

## 5 · Builder primitives — what exists, what does not

✅ built · ⚠️ exists but wired wrong · ❌ new

| Primitive | State | Note |
|---|---|---|
| Band order | ✅ | `blockOrder`, reorderable, per-template seedable. |
| Card order within a band | ✅ | `rowOrder`, drives CSS `order`. |
| Remove / restore a card | ✅ | `removed`, stays in the palette. |
| Column count per band | ✅ | `content.cols` / `secCols`. |
| Nested section tree | ✅ | Recursive `Box` — row/column, weights, depth 4, 4 columns per row. |
| Main + right rail | ✅ | Was v2-only; now `seed.rail`. |
| Banner height / colour / image | ✅ | `hero.height`, `bgKind`, `bannerColor`, `bannerImage`. |
| Banner gradient | ✅ | `bannerStyle: 'gradient'`. |
| Search placement | ⚠️ | `in-banner` and `floating` exist. **`topbar` and `below` do not** — L3, L8 and L11 need them. |
| Card look | ✅ | `page.cardLook: 'panel' \| 'spine'`. |
| Action card anatomy | ✅ | Icon left/top/right/none, per card and per row. |
| Per-node style | ✅ | Padding, margin, width %, height, fill, border, radius. |
| Template seed | ✅ | `PortalTemplate.seed` — band order, row order, rail, per-node config. |
| **Banner: split / duotone / pattern / illustration slot** | ❌ | L5, L6, L7. Needs `bannerStyle` values plus an artwork slot. |
| **Actions as a pill bar** | ❌ | L4, L8. New arrangement for the quick band. |
| **Actions as a vertical rail** | ❌ | L11. Needs the quick band to accept `orientation: 'vertical'` and a sticky position. |
| **Stat / counter tile row** | ⚠️ | The `x-kpi` element exists but is **hidden from the palette**. L4 and L12 need it un-hidden and bound to a live count. |
| **Merged multi-entity card** (Assets + CIs) | ❌ | L3, L5, L6, L8, L11. The single most reused new primitive in this document. |
| **Tabbed widget container** | ❌ | L4. `l-tabs` exists but is hidden and has no collection spec. |
| **Category grid** (service categories) | ❌ | L3. Distinct from Favourite/Most Used — it is the catalogue's own taxonomy. |
| **Services carousel / chip cloud** | ❌ | L6, Retail. |
| **Unified feed** (all widgets, one ranked stream) | ❌ | L10, and it needs a ranking rule the product does not have. |
| **Per-card grid span** | ❌ | L6, L12. Sections carry weights; individual cards do not yet. |

**Cheapest path to the most layouts:** the **merged multi-entity card** and the **counter tile row**
unlock five of the twelve between them, and neither needs a new rendering path — both are a widget
that reads two sources instead of one.

**The one-off to refuse:** L10's ranked feed. It is a product decision about priority disguised as a
layout, and building it as a layout would bake a ranking into a template.

---

## 6 · What I would ship first

**L2 · Search Spotlight** — built, and the only one that changes the page's *question* rather than
its decoration. It is also the cheapest to defend: every reference in the mood board (Apple, Zendesk,
Discord) leads with a field, and the one ITSM-specific move — the requester's own work still on the
page — is what separates it from a help centre.

**L4 · Status Board** — because it is the opposite. It serves the daily user the current portal
actively fails: someone who knows what they want and has to read past a hero, four doors and two
service rows to find out that two approvals are waiting. Shipping L2 and L4 together proves the
template system does something, which one layout plus a recolour cannot.

⚠️ **Not L6 or L9 first**, however good they look in a review. Both score ≤ 2 on sparse-tenant
resilience, and the first tenant to open one with no announcements and no assets will conclude the
product is broken rather than that their data is empty.
