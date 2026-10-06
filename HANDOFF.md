# Handoff — 2026-10-06 14:14

> Several sessions share this file. **This top part is the Support Portal builder session (5–6 Oct)**;
> the other sessions' notes follow unchanged below the divider.

## Read first
CLAUDE.md › Key context — Support Portal bullets dated 5–6 Oct: *text formatting bar follows the HIGHLIGHTED WORDS*,
*Widgets panel FOLDS placed widgets*, *rail has NO Shortcuts button*, and the *Developer handoff — docs/editor-handoff/* pointer.

## What we worked on this session
Builder polish (Widgets panel cursors, rail, text formatting bar) and a complete behaviour-only developer handoff
page for rebuilding the Support Portal editor in the real product.

## Completed
- **Widgets panel cursors:** open hand only over a widget's icon + name (+2px); normal arrow elsewhere on the row;
  click cursor on the "+"; a press outside the icon/name never starts a drag. "All added to the page" sits `pb-1`
  under its group title.
- **Rail:** the Shortcuts button is hidden (`{false && …}` in `SupportPortalBuilder`); shortcuts live in the global panel.
- **Text formatting bar** now appears only when words are highlighted, floating above them. Partial selection =
  B I U · font · size · colours · clear · link; full selection adds text style, alignment, Placeholder. Grouped like
  the composer (style ▾ | B I U | font ▾ · AA ▾ | alignment popup | colours | clear · link | Placeholder).
  Outline only: placed Text = drag · replace · copy · alignment · background · delete; text inside an ordinary
  widget (e.g. Custom Card title) = alignment only (reads the real computed alignment).
- **No outline toolbar on text inside PREDEFINED widgets** (Data and Action cards, the banner heading/sub-heading —
  `isPredefinedText(id)` in PortalCanvas). Only the bar on highlighted words, with the full agreed set.
- **Developer handoff page** — `docs/editor-handoff/`, published at https://claude.ai/artifact/WnaaBozqivZhS4XjfURy4U
  (private until Zeni shares it). Kept in step with every text-bar change (now version 4).
- All verified in a browser and live on `main` (last code commit `5c59f45`).

## In progress
Nothing mid-flight.

## Next steps
- Zeni to share the handoff page with the developer (Share menu), or ask to host it publicly under `public/`.
- Pre-existing bugs found, not fixed (ask Zeni): the banner heading's sidebar **Heading** field shows empty; the text
  bar reports the banner heading as Paragraph / 15 though it renders larger (its size comes from elsewhere);
  Esc doesn't close the tour while the banner is selected.
- Still open from earlier: choose a "style it in one go" approach (`NON-DESIGNER-ADMIN-UX.md` Part 2).

## Decisions made
- Text bar only on highlighted words; whole-text controls (style, alignment, placeholder) only when ALL words are
  highlighted — Zeni: "only applicable functionality based on text selection", no select-all-then-format.
- Alignment uses the one shared AlignAxis button + popup everywhere; no Justify.
- Predefined widgets' text (cards + banner) gets no outline toolbar — the card's own layout places it; its words are
  still editable and formattable through the selection bar.
- Composer-style grouping kept Font, Clear formatting, Link and Placeholder; lists were NOT added.
- Handoff doc is behaviour-only, for the real product (not this prototype's code).

## Gotchas & notes
- `PortalCanvas.tsx` is CRLF on disk now — multi-line string anchors in sweep scripts must normalise line endings.
- Git Bash strips backslashes in heredocs/`node -e`; write sweep scripts with the editor.
- Other sessions edit `CLAUDE.md`/`HANDOFF.md` in parallel — commit only named files, never `git add -A` / `git stash`.

---

## (Previous) Handoff — 2026-10-05 15:30

> Three sessions share this file today. **This top part is the User Surveys / Import Emails session**;
> the Support Portal builder and Form Rules sessions' notes follow unchanged below the divider.

## Read first (User Surveys session)
CLAUDE.md › Structure › *User Surveys (Admin › User Survey)* and Key context › *User Surveys — listing +
Import Emails (5 Oct 2026)*.

## What we worked on this session
Redesigned the old User Surveys admin listing in the new design system, and redesigned its **Import
Emails** side panel (the real goal of the session), per Zeni's flow: title + one-liner bound together,
quiet sample link, Select CSV, a capacity warning under it, the file, and an overflow error.

## Completed
- `AdminUserSurveyModule.tsx` — listing at `#/admin/user-surveys` (nav tree + `CARD_MODULES` + route
  wired). 7 saved views from the old product, search, Refresh, Import, Create User Survey, 23 realistic
  mock surveys.
- `ImportEmailsPanel.tsx` — 2-step panel (Upload file → Map fields), CSV/Excel tabs, real CSV parsing,
  preview modal, plain capacity warning (500 − manual), red skipped-rows error, Map Email/Name step.
- Sample files `public/samples/survey-emails-200/450/500.csv`; the "Download sample CSV" link serves the
  500-row one.
- Verified in Chrome (Playwright): all views filter correctly, 450-row file shows warning + "last 70
  skipped" error, 200-row file shows warning only, sample downloads 500 rows, no page errors.

## In progress
Nothing mid-flight.

## Next steps
- Confirm with Zeni: the real name of the "Live" status; whether Import should live inside a survey's
  audience screen (then `manualCount` becomes the survey's real count, not the demo 120).
- Whether the red skipped-rows error should also become a plain line like the warning.
- Create User Survey, row click, and Schedule Survey still have no screens (toast placeholders).

## Decisions made
- Import = a separate secondary button beside the primary Create (Zeni).
- Old view dropdown kept as a saved-view menu (Patch Deployment pattern) rather than scope tabs (Zeni).
- Columns: ID, Name, Status, Start, End, Owner, Service Catalog — no Created Date / row actions (Zeni).
- Capacity warning is plain text, no box, icon on the CTA's left edge (Zeni); sample link is a plain
  text link, not an info callout (Zeni: too prominent).
- Sample file = a full 500-row audience so uploading it back always demonstrates the overflow error.

## Gotchas & notes
- Expiring/Expired views use a fixed `TODAY` constant on purpose.
- Excel files are mocked as 420 rows (no spreadsheet parser in the prototype).
- Git Bash heredocs + `node -e` with template literals mangle quoting — use the Edit tool for JSX edits.

---

## Support Portal builder session

## Read first
CLAUDE.md › Key context — the Support Portal bullets dated 30 Sep – 5 Oct: *ONE global Keyboard shortcuts
panel*, *move arrows PARKED*, *ONE divider after the drag grip*, *Widgets panel FOLDS placed widgets*,
*TOUR moves the banner's toolbar ABOVE*, *copy & small controls*, and the `NON-DESIGNER-ADMIN-UX.md` pointer.

## What we worked on this session
Builder polish for non-designer admins: one global shortcuts panel, a calmer floating toolbar, a Widgets
panel that stops making you scroll past widgets already on the page, rewritten tour/Basics copy, and the
saved UX review for designing a simpler admin builder.

## Completed
- **Global Keyboard shortcuts panel** (`GlobalShortcutsPanel` + `shortcutRegistry` + `shortcutContext`):
  header icon, `?`, builder rail and drawer rail all open one right-side panel focused on where you are.
- **Move arrows parked** behind `SHOW_MOVE_ARROWS = false` (`portalShortcutKeys.ts`); concept in
  `future-tasks.md` §6.
- **Toolbar dividers:** only one after the drag grip and one before Delete (theme.css; grips carry `tb-grip`).
- **Widgets panel:** placed predefined widgets fold into "N on this page ›" on the group title; a finished
  group shows one line "All added to the page" (`pb-1` under the title); rows drag only (open hand), the
  "+" adds, with a 5px normal-arrow zone round it.
- **Tour step 3** shows the banner's toolbar above the banner, inside the spotlight.
- **Copy:** tour cards + six Editor basics slides; Video widget = one "Upload video" (MP4, 5 MB); Media
  Slider title help removed.
- **`NON-DESIGNER-ADMIN-UX.md`** saved: the 28 Sep review + the seven "one go" styling approaches.
- All of the above verified in a browser and live on `main`.

## In progress
Nothing mid-flight in the builder.

## Next steps
- Decide which "one go" styling approach to build (see `NON-DESIGNER-ADMIN-UX.md` Part 2; recommended
  style kit + look presets + S/M/L spacing).
- Optional fixes Zeni has not asked for yet: Esc doesn't close the tour while the banner is selected; the
  tour spotlight on step 3 also takes in a strip of the portal header beside the toolbar; the Editor
  basics video still shows a "Move right" press (arrows are parked).
- Photo Gallery's Title still has "Optional — hidden when blank." — ask whether it should go too.
- Known conflicts still awaiting Zeni (from 28 Sep): `Alt+←/→` may navigate the browser back from the
  builder; `Alt+↑/↓` means different things in the builder and the ticket drawer.

## Decisions made
- Shortcuts live in ONE global panel; the drawer and builder sheets were removed (Zeni: "only in global").
- Widgets already on the page are folded from the FIRST one placed, not after a threshold — predictable.
- Row body drags, the "+" adds — a slipped drag must never add a widget at the foot of the page.
- Toolbar keeps a divider only after the grip and before Delete (destructive action fenced off).

## Gotchas & notes
- Cursors in the Widgets panel are INLINE styles — theme.css's unlayered `[role=button]`/`button` pointer
  rule beats Tailwind `cursor-*` classes.
- Another session works in this repo at the same time (Form Rules: `FormRule*.tsx`, `CLAUDE.md`,
  `HANDOFF.md`). Commit only your own named files; never `git add -A`, never `git stash`.

---

## (Form Rules session) Handoff — 2026-10-05 11:30

## Latest (5 Oct 2026) — Form Rules: rule-check cards, one CTA, first-time intro
**Read first:** CLAUDE.md › Structure › the Request Form Management bullet ("Rule-check polish (5 Oct 2026)")
and Key context › Request Form Management (B3 passages).

**Completed**
- Summary cards (Rule check): 16px padding on all four sides, no min-height; a 24px gap between the
  count/title row and the summary is what makes them tall. Title + summary in the count colour, regular
  weight, 1px border in the same colour.
- Similar-rules sidebar: each list row reads "N actions match the current rule".
- ONE CTA style for both sidebars: `RULE_CTA` (exported from `FormRuleConflictReview`) used by
  "Open rule" (conflicts, By rule header + By field hover) and "Update this rule" (similar).
- First-time intro popup `RuleCheckIntro` (FormRuleRelatedView): slides in beside the docked cards the
  first time any summary card appears; line-art illustration; explains only the cards shown; once ever
  (localStorage `formRuleCheckIntroSeen`); closes on Got it / X / opening a sidebar. No Escape handler
  on purpose (Escape closes dropdowns and was dismissing it unread).

- (later, 5 Oct) Each summary card has its OWN info popup: shown beside that card the first time it appears (keys `formRuleCheckIntroSeen:conflicts` / `:similar`), one at a time (conflicts replaces similar), and re-opened from an ⓘ at the card's top-right (↗ beside it on hover).

- (later, 5 Oct) Built H1/H2/H3 (steps across the top, form left-aligned, cards top-right / bottom-right / floating) — then HIDDEN on request; **B3 is final** (`SHOWN = ['B3']`, no Layout bar). Info-popup "seen" flags are now per layout (`formRuleCheckIntroSeen:<layout>:<card>`); popups open left of right-side cards via `introSide`/`introAlign`.
- B3 spacing: 16px on every outer side below the header divider (stepper + Rule check `p-4`, form `pt-4 pr-4 pb-4`), form 24px from the stepper rail.

- Conflicts info popup now draws how a conflict happens (`ConflictArt`): Rule A "Hide · Status" and Rule B "Show · Status" action rows meeting at one red Status field with a clash mark; text says the same.

- Field Matrix tab removed from the listing (view still built).
- B3: "Select Rule Applicable for" moved into the When container as its 3rd field; Rule details = name, tags, description.
- DEMO: any complete condition shows Similar rules, any complete action shows Conflicts (`demoSimilar`/`demoConflicts` in formRuleEngine, used only when the real checks find nothing). Similar card now sits above Conflicts. Probes: `p60.mjs` (random condition + Mandate Vendor), `p61.mjs` (Show Due By → demo conflict + sidebar).

- Polish: hover tooltips (dark card: name, bold description, Example) on all options of the three When dropdowns; ⓘ beside the card titles, ↗ alone top-right, tighter title gap; Open rule / Update this rule are secondary text+arrow links everywhere; similar sidebar container = "Common trigger, conditions & actions" with the builder's When/Check if/Then badges, trigger parts split by dividers and conditions shown as groups; "All clear so far" empty state in the Rule check when nothing is found. Probe: `p62.mjs`.
- I wrote the 9 option tip texts myself — Zeni to review the wording.

- Info popups: the description + what-to-do are two plain grey bullet points (no tinted box). Common container rows lead with the step ICONS only (no When/Check if/Then words). "All clear so far" empty state is a white card, neutral grey, no green, icon top-left.

- **6 Oct: Option A is FINAL** (`SHOWN=['A']`): B3's Rule details + When (applies-to as 3rd field), no yellow strip, light-red action row + ⚠ that opens the rail on Conflicts › By field with that field opened/tinted/scrolled. Rail: tabs Conflicts · Similar rules (Run order gone); no KPIs, no per-card conflict tag; compact search beside By rule/By field; Open rule on hover only; single-border closed cards; sticky headers no longer leak at the corners. Similar tab: shared `CommonTriggerCard` (FormRuleCommon.tsx) + multi-open accordion cards.
- 6 Oct: Open rule / Update this rule open the rule in a NEW TAB on its builder step (`#/admin/request-form-rules/<rule id>`, `Route.rule`); seed rule ids are now stable name slugs. Open question to Zeni: share rule edits across tabs (localStorage)?
- Probes: `p63.mjs` (new-tab open), `p64–p66.mjs` (option A rail).

**Open / next**
0. Asked Zeni: should the conflicts drawing also show a VALUE clash (Set Priority = High vs Low)? And are the 7–9px labels in the drawing readable, or should it grow/simplify?
1. Zeni was asked what to change on the action-row ⚠ icon (image 90) — no answer yet.
2. Editor tabs for "Open rule" / "Update this rule" with a live "Resolved" state; merge behaviour for similar rules.

**Gotchas**
- To see the popups again: remove the `formRuleCheckIntroSeen:B3:conflicts` / `:B3:similar` keys from localStorage and refresh.
- CRLF in `FormRuleConflictReview.tsx`: patch scripts must try `\r\n`.
- Probe: `D:/Motadata/tour-shots/formrule/p54.mjs` (both sidebars) and `p55.mjs` (per-card popups + ⓘ; use `:visible` — the cards exist twice in the DOM).

## Latest (1 Oct 2026, evening) — Form Rules: B3 finalised and polished
**Read first:** CLAUDE.md › Key context › the "Request Form Management" bullet — the "Four page-structure variants"
and "B3 · Steps + summary (FINALISED…)" passages describe the current state.

**Completed**
- **B3 is the only layout** (`SHOWN = ['B3']`, default; the Layout bar hides when only one layout is offered).
  Every other layout (A, A2, B, B2, I, P, R, A3, A3R, S, LS, RC, EG, HF) stays built and can be re-shown by adding
  its id to `SHOWN`. K / N / Z were built and deleted.
- B3 stepper: white column (no fill/borders), full-width step cards with 10px padding, number badge + label + hint,
  active = blue pill, done = green tick, a divider under the badges with 2px gaps (stops short of a selected card,
  runs through an unselected card's padding); main column left-aligned; Rule check cards docked at the foot.
- Summary cards: tinted fill, no border/icon, count + title in the count colour, 2-line summary, 104px min height,
  16px apart; whole card clickable with a hover lift + ↗.
- Action rows: inline red clash lists removed; a conflicting row gets a light red fill + ⚠ button whose hover lists the
  clashing fields — clicking opens the conflicts sidebar on By field for that field.
- Conflicts sidebar: no subtitle/KPIs, red "N conflicts found" banner, no "+N more rules", hover-only Open rule in
  By field, titles top-aligned with the left list.
- Similar sidebar: amber banner, folded "Common trigger & conditions" container, per rule only "Matches your rule" and
  "Its other actions", blue info line sticky at the foot.
- Header: no conflicts/similar status chip in summary layouts; back arrow aligned with the title.
- Also built (hidden now): LS · Live summary, RC · Checklist, EG · Gutter, HF · Horizontal flow.

**Open / next**
1. Zeni was asked what to change on the action-row ⚠ icon (image 90) — no answer yet.
2. Confirm the similar-rules action groups reading (matches + its other actions; "New in your rule" dropped).
3. Editor tabs for "Open rule" / "Update this rule" with a live "Resolved" state; merge behaviour for similar rules.

**Gotchas**
- CRLF in `FormRuleConflictReview.tsx` and parts of `FormRuleEditor.tsx`: patch scripts must try `\r\n`.
- Never put backticks inside `node -e "…"` in Git Bash — write patch scripts with the Write tool.
- Probes: `D:/Motadata/tour-shots/formrule/p50.mjs`–`p53.mjs` (B3 flow, sidebars, header measure).


## Latest (1 Oct 2026) — Form Rules: conflict / similar-rule UI and page-structure variants
**Read first:** CLAUDE.md › Key context › the long *"Request Form Management (Admin › Request Management)"* bullet —
the 1 Oct additions sit inside it (G2, Layout bar, B/B2 two steps, P, A2, I tabs, R summary cards, the four
structure variants, stat cards, the "Resolving conflicts" page).

**Completed this session**
- **G2 · Review list** (later folded into the Rule check): every rule/field is an accordion with a light `#F6F9FC`
  36px header (no bottom stroke), ⚠ "n conflicts" + Open rule on the right, sticky header + sticky field sub-headers,
  pair cards `#F6F9FC` at 80%. The Rule check's Conflicts tab IS this list in all layouts.
- **Layout bar** now shows only: A · A2 · B · B2 · I · P · R · B3 · A3 · A3R · S (the rest stay built but hidden;
  K / N / Z were built and then REMOVED on request).
- **A** — Rule details in a grey Step panel. **A2 · Who first** — Rule details (name + tags side by side, description
  under) → Who → When…. **B / B2** — two steps (Rule details → Build the rule), one frame so nothing moves between
  steps, Rule check rail on both steps, Next under the tags, no stroke on the selected step. **I** — Who step in the
  centre, right pane = tabs Rule details · Rule check (auto-switches to Rule check when a conflict appears), pill
  sub-tabs like the ticket Relations tab, same width as P. **P · Name first** — popup (name / description / tags) on
  Create, rule centred with Who on top, title = rule name, Rule check title has no icon.
- Every content column is centred (`mx-auto max-w-[880px]`). No footer bar — Cancel / Save / status chip sit top-right
  of the header.
- Empty-state illustrations for all three Rule check tabs (Conflicts, Similar rules, Run order).
- **R · Summary cards** + **B3 · Steps + summary**, **A3 · Details left**, **A3R · Details right**, **S · Header summary**:
  conflicts and similar rules are separate jobs. Stat cards (tinted fill, 6px corners, number top-left, title on one
  line, per-kind breakdown, Resolve › / Review › foot) appear only once something is found; each opens its own
  960px sidebar — *Resolve conflicts* (G's split view, By rule / By field) or *Similar rules* (trigger compared line
  by line, actions split Same as yours / New in your rule / Only in that rule, Update this rule). S shows the counts
  as header chips with a hover breakdown. A3 / A3R / B3 sidebars are 380px.
- "How do I resolve these conflicts?" now opens a full **Resolving conflicts** page (back arrow, six numbered ways);
  in R-family sidebars it takes over the whole header.
- Published artifact comparing three combined approaches (now partly superseded by the "two separate jobs" decision):
  https://claude.ai/artifact/NBA1tLmCEtH3J3JXG338Ty

**Decisions**
- Conflicts and similar rules are never mixed in one list — a conflict is resolved in its own flow, a similar rule is
  guidance ("update that rule instead").
- Summary cards show only once something is found. Card summary = per-kind breakdown only.
- "Open rule" / "Update this rule" keep today's behaviour for now.

**Next steps**
1. Zeni to pick favourite page structures (R, B3, A3, A3R, S); hide the rest from the Layout bar.
2. Open a related rule in an editor tab beside the draft, with a live "Resolved" state when it is fixed there.
3. Decide what "Add my actions to this rule" does (merge vs open pre-filled).
4. Update or retire the approaches artifact to match the two-jobs direction.

**Gotchas**
- `FormRuleConflictReview.tsx` (and parts of `FormRuleEditor.tsx`) have CRLF line endings — multi-line string patches
  must also try `\r\n`.
- Probe scripts live in `D:/Motadata/tour-shots/formrule/` (`probe25.mjs` builds a conflicting rule; `p41-*.mjs` per layout).
- Git Bash heredocs strip backslashes — write patch scripts with the Write tool.


## Latest (1 Oct 2026) — tour step 3 shows the banner toolbar above the banner
- While the tour is open (`body[data-portal-tour]`) `ToolbarSlot` puts the banner bar ABOVE the banner; step 3 targets ["hero", "hero-toolbar"] so the spotlight covers both. Back inside the banner once the tour closes. Verified in a browser.
- Noticed, not fixed: Esc does not close the tour while the banner is selected (the Close button does).

## Latest (1 Oct 2026) — Widgets panel fold + drag-only rows
- Placed predefined widgets fold into "✓ N on this page ▸" on each group title; rows drag only, the + adds. Divider before Delete on toolbars. Verified in a browser.

## Read first
This session built **Request Form Management** (Admin › Request Management › Request Form / Request Form Rule).
In `CLAUDE.md` read the Structure bullet *"Request Form Management (Admin › Request Management)"* and the
Key-context bullets starting *"Request Form Management (Admin › Request Management) — `AdminRequestFormModule.tsx`"*.
They cover the listing, the full-page editor, the ten layouts, the conflict engine, C · Linear and G's conflict review.
Another session worked on the Support Portal the same day; its notes are kept below.

## What we worked on this session
Moved the form-rule editor from a drawer to a full page, explored ten layouts for building a rule and surfacing
conflicts / similar rules, then iterated heavily on **G's "Review before saving" dialog** (conflicts + similar rules).

## Completed
- Admin nav: Request Management is a tree branch; `#/admin/request-form` and `#/admin/request-form-rules`.
- Listing: edge-to-edge table, drag-to-reorder run order, measured "N conflicts" pill; Form Builder tab; Field Matrix tab (J).
- Admin module titles are 16px everywhere.
- Full-page rule editor matching the Figma form-rule section; `formRuleEngine.ts` (Opposite / Override / Blocking,
  similar rules with common / others / missing, run order).
- Layout switcher — favourites **A · Split, B2 · 3 steps, C · Linear, E · Flow, I · Details**; rejected (behind a
  divider): F · Problems, B · Stepper, D · Field, G · Review, H · Similar-first.
- C rebuilt from https://pranjalgupta-motadata.github.io/linear-workflow-builder/ (centred rail, hover actions, add-step menu).
- G's review dialog, final state:
  - 12px padding; one toolbar row: By rule / By field / Matrix tabs left, four small KPI filter cards right
    (number over name).
  - Left: 6px-rounded grey panel with search, list items = name + "• N conflicts", selected item white.
  - Right: title top-aligned with the panel, 4px above the groups; each group is a grey panel of
    Current Rule / Conflicting Rule card pairs (Zeni's reference).
  - Footer "How do I resolve these conflicts?" expands into steps + concrete fixes.
  - Similar rules tab: compact one-line list (chevron · name · Open) that expands into
    Matches your rule ✓ / Only in this rule / Your actions it lacks +.
- Seeds gained broad rules so a typical rule clashes with ~9 rules.

## In progress
Nothing mid-flight. Everything builds and was verified in a headless browser.

## Next steps
- Zeni picks the final layout(s) from the favourites; retire the rest.
- Decide whether G's conflict/similar design should replace the Rule check rail in the favourite layouts
  (A, B2, C, E, I still use the older `FormRuleInsights` conflict tab).
- Similar-rules flow ("add to this rule") — Zeni flagged it as a later task.

## Decisions made
- Full-page editor, not a drawer. Save Rule stays product-blue.
- Conflicts are a many-to-many link (action → field → other rule → kind), viewed by rule, by field or matrix.
- Conflict detail cards show only the two actions + executions; kind lives in the KPI filters.
- All editor layouts left-aligned except C (centred like the reference). Option F rejected.

## Gotchas & notes
- Git Bash strips backslashes/backticks in heredocs — write patch/probe scripts to files (`D:/Motadata/tour-shots/formrule/`).
- Components declared inside render remount every render (inputs lose focus) — keep them module-level.
- Tailwind never generates concatenated class names; bare `<button>`s need an explicit `text-[Npx]`.
- Browser probes: `D:/Motadata/tour-shots/formrule/probe*.mjs` (playwright-core from the npx cache).

---

(Previous session below — Support Portal work from another session.)

# Handoff — 2026-09-30

## Latest (30 Sep 2026, latest) — toolbar dividers
- Only the divider right after the drag grip remains; every other toolbar divider is hidden (theme.css, `tb-grip::after`). 56 bars swept, 0 bad.

## Earlier (30 Sep 2026, later) — move arrows parked
- The floating toolbar's Move left/right (and up/down) buttons, their arrow keys and the sheet row are hidden
  by `SHOW_MOVE_ARROWS = false` (`portalShortcutKeys.ts`). Concept kept in future-tasks.md §6; flip the flag to restore.
  Verified: no move buttons on an action card or the Quick Actions row, → no longer reorders, no page errors.

## Earlier (30 Sep 2026) — the global Keyboard shortcuts panel — DONE, pushed
- One right-side panel lists every shortcut in the product (`GlobalShortcutsPanel.tsx`), opened by the
  header keyboard icon, `?`, the builder rail's Shortcuts button and the drawer's rail keyboard button.
  **This page** opens focused on where you are; **All modules** covers every module by area; search
  spans all. Researched against Jira / GitHub / Linear / Notion / Figma / monday first.
- The drawer's `?` popup and the builder's sheet were REMOVED — both now open the global panel.
- Verified in a browser: Hardware Assets list → note + Global focused; open drawer → "Detail pages"
  focused; Relationship tab → "Relationship map" focused; builder → "Support Portal builder" focused;
  search "minimap" → one hit; `?` toggles; Esc clears search, then closes; no page errors.
- Read CLAUDE.md bullet *"ONE global Keyboard shortcuts panel"* and SHORTCUTS.md §0.
- Earlier today: the Editor basics video was rebuilt (six chapters, lucide icons, compact toolbar,
  empty column on stretch) and pushed.
- **Next (optional):** list pages have no shortcuts of their own yet — if any get keys, add rows to
  their (currently empty) registry entries and they'll show focused automatically.

---

(Previous session below.)

## Read first
All work is in the **Support Portal** builder (Admin › Support Channels) and its listing.
**Start with the ALIGNMENT work below — it is the priority (Zeni) and it is half done.**
In `CLAUDE.md` › Key context, read these bullets (dated 28–29 Sep 2026):

1. *"the floating toolbar's DESIGN controls are ALSO in the sidebar"* — `DesignQuickSections`,
   `hasDesignQuick`, `DesignGroupsCtx`. It reverses the older "styling/alignment on the toolbar only".
2. *"EVERY colour picker has Light · Dark tabs and opens on the portal's mode"* — `ColorPair`,
   `colorPair()` / `shownOf()`.
3. *"the two service rows are WHITE CARDS with their title inside"* and *"Favourite and Most Used
   Services share ONE row by default"*.
4. *"closing the tour dock PARKS it in the right rail"*.

## What we worked on this session
Tooltip layering and shortcut polish, the tour dock's resting place, the two service rows'
layout and look, Light/Dark tabs in every colour picker, and — the big one — the toolbar's
design controls mirrored into the sidebar. Ended mid-way through an alignment audit.

## Completed (all pushed to `main`)
- Builder tooltips draw above the editor (`z-[10200]`); shortcut sheet labels left / keys right;
  "+ Add Section" has an instant tooltip with **N**; `TipKeys` moved to `PortalTipKeys.tsx`.
- Portal listing card: name / URL / details 4px apart (`gap-1`).
- Widget hover card: 240px, square-ish 136px sketch stage, name + one-line summary.
- Every colour picker has Light / Dark tabs, opening on the portal's current mode; Cancel restores both.
- Favourite + Most Used Services: side by side (default `browseLook: 'split'`), white cards with the
  title inside, 2×2 tiles on `#F6F9FC`, no tile stroke.
- Closing the tour dock parks a dark **Basics** button at the bottom of the right rail.
- **Toolbar design controls also in the sidebar** (top of Design): Background · Border & corners
  (style as a dropdown, radius merged) · Shadow cards · Icon · Alignment · Presets · Button style;
  banner and banner-group variants. Text children get none (Zeni's choice).
- Expand all / Collapse all now reaches every Design group; the card's **Title** group is last.

## Also done after the first hand-off (29 Sep, later)
- Banner Sections header: title + hint beside the tabs, no divider (commit ea7c90b).
- **A parent section's handles set its gaps** — side handles: width + column gap together; bottom: row gap
  (min 0). See the CLAUDE.md bullet "a PARENT's handles set the gap between its children".
- The three files below were COMMITTED with that change, and the **Text alignment fix is done**
  (`textAlignOf` in `PortalPlacedElement.tsx`); white service badges verified `rgb(255,255,255)`.

## Done last — card alignment by template (29 Sep, evening)
- Data cards (action cards + the tiles of Favourite / Most Used / My Assets / My CIs) align on ONE axis
  picked by their card template (Icon top → Left/Centre/Right; Icon left/right → Top/Middle/Bottom),
  in the toolbar and in the sidebar's first Design group. Quick Actions row: no alignment.
- New toolbar buttons: **Layout** (four white cards + Quick Actions row) and **Card templates** (the cards).
- The Layout preset now lights what the canvas draws (was "four across" over a 2 × 2).
- Verified in the browser (`tour-shots/probe-cardalign*.mjs`). See the CLAUDE.md bullet
  "a DATA CARD aligns on the axis its CARD TEMPLATE leaves free".

## Done last — horizontal-only card alignment + sidebar trims (29 Sep, late)
- Data cards (action cards + the four data-card tiles) align Left/Centre/Right in every template; the Icon-top
  words now follow. Text / Button / Image / Media Slider / Custom Card sidebar changes and the Logo position
  field — see the CLAUDE.md bullet "data cards align HORIZONTALLY in every template".

## Alignment model — Zeni's answers (29 Sep) — BUILT, see CLAUDE.md "a COLUMN aligns what it holds"
1. A widget that fills its column gets alignment only when it is NARROWER than the column.
2. Text: Left/Centre/Right align the lines inside the text box; the box hugs its text.
3. Vertical appears whenever the cell has spare height (dragged taller OR a taller neighbour).
4. ONE alignment per column (or grouped sub-section), not one per stacked widget.
5. Stretch: H = fill the column (Button, a narrowed widget, an image); V = spread stacked widgets top-to-bottom.
6. KPI = a display of the Custom Data Widget; not coming back to the palette on its own. Text with Image stays hidden.
7. Keep the data-card tile alignment.

## Done last — predefined cards as two real sections (29 Sep, night)
- Default page: row 1 (Requests · Approvals · Announcements, equal) and row 2 (Assets over CIs | Most Read over
  Contact, 2:1) are ordinary sections; sections move up/down, columns left/right, stacked cards up/down.
- Drops: predefined ↔ custom mixing refused with a reason; a section emptied by a move is removed.
- See CLAUDE.md "the default page's predefined cards are two REAL SECTIONS".

## In progress
Nothing mid-flight. The per-widget alignment audit list for Zeni (probe-align2 add loop unreliable)
is still owed — see below.

## Next steps
1. Ask Zeni to review the new card alignment + Layout / Card-templates buttons.
2. Send Zeni the full alignment list (H/V per widget, working / partial / does nothing).
3. Carried over: Contact Us "remove this" (ask which part); Figma pill node `296:14588` needs editor
   access; the review list of what overwhelms non-designers (15 points) and the one-go styling
   options (style kit + look presets + S/M/L spacing recommended) await Zeni's choice.

## Decisions made
- **Toolbar design controls live in BOTH places** (Zeni's manager): sidebar + toolbar read/write the
  same keys; drag/move/replace/delete/add stay toolbar-only; text children get no sidebar sections.
- **Border & corners** is one sidebar group, no tabs, style as a dropdown; **Shadow** keeps its cards.
- **Service rows** default to side-by-side, title inside a white card, grey tiles without a stroke.
- **Closing the dock parks it in the rail**; the separate minimise pill was removed.
- **Gradient stops have no light/dark pair** — one stored object would drift.

## Gotchas & notes
- **The typecheck bails on `CatalogItemDetailsModal.tsx`** when `SupportPortalBuilder.tsx` is in the
  file list — typecheck the other files without it, or it looks clean when it checked nothing.
- **React writes a bare `data-portal-dock` as `"true"`**, not `""`.
- **Alt+1 toggles the Widgets panel** — a script pressing it before each row closes the panel.
- Another terminal may be working in this repo: commit named files only, never `git add -A`.
- Pre-existing typecheck noise: `splitNode`/`splitInfo` (PortalCanvas ~1415), `PortalControls` 49/519,
  `PortalWidgetDrawer` ~1492, the `portalWidgetSpec.ts` TS1117.
