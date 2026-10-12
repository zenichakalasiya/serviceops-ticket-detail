# Handoff — 2026-10-12 10:57

## Read first
Start with CLAUDE.md → **Structure › Request Form Management**, from **"V3 (8 Oct 2026, Zeni)"**
to the end of that bullet. It covers the four editor versions (V1–V4) and the help surfaces.

## What we worked on this session
The Form Rule editor's help and rule-check surfaces, across its versions (V1 | V2 | V3 | V4 switch
beside the logo):
- **V3** got its Rule check pinned above the Help guide, Zeni's final help copy, and a fold-on-scroll.
- **V4** is new: the builder on the left and a narrower right panel with three tabs.

## Completed
- **Final help copy (Zeni's, do not rewrite):** *How Form Rules Work* (intro, When to Run & Execution,
  Conditions, Actions) and *Conflicts and Similar Rules* (Conflict + example, Similar Rule, How to
  Resolve Conflicts).
- **V3 (`FormRuleHelpCard.tsx`):**
  - Rule check block pinned above the Help guide title: "All clear so far" by default, the Similar
    rules / Conflicts summary cards once something is found. Their ↗ arrow shows at rest.
  - Scrolling the guide folds the block to count + title (or icon + title); scrolling back restores it.
  - Only the first help section starts open. Similar-rules summary is clamped to two lines.
  - The conflicts drawer has no top "How to resolve" card; the foot bar opens the six steps as a page
    with a back arrow.
- **V4 (`FormRuleCheckPanel.tsx`, `FormRuleHelpV4.tsx`):**
  - Builder left-aligned with the header; the right panel is 20% narrower than the free space.
  - Tabs: Help guide (default) · Conflicts N · Similar rules N.
  - Conflicts and Similar rules show a grey list of rules beside the selected rule's detail. Names
    truncate with an instant tooltip. Search matches rule and field names.
  - Similar rules opens with the "Common trigger, conditions & actions" card. Conflicts ends with the
    "How do I resolve these conflicts?" bar and an ⓘ.
  - Empty states use V1's illustrations.
  - **Help guide shows the Cards design only.** The Minimal | Cards switch was removed (last change
    of the session).
- **V1's Help guide tab** renders the minimal guide (`FormRuleHelpMinimal`), with no example rule.
- **Global Help guide popup:** topic rows are separate cards.
- Each change was checked in the browser with Playwright; no page errors.

## In progress
Nothing mid-flight.

## Next steps
Open questions for Zeni:
- Remove the "Example rule" card from V4's Cards guide too? (It was removed from the minimal guide.)
- Should V1's Help guide tab use the Cards design, to match V4?
- V4 clash cards: stack the Current / Conflicting labels above their lines? They wrap at ~442px.
- V4: switch to the Conflicts tab automatically when findings appear?
- Contextual help for V4 was discussed but not built.

## Decisions made
- The help copy is final; only its presentation changes per version.
- V3 folds its Rule check on **scroll**, not hover (Zeni).
- V4 shows the rule list and the selected rule's detail side by side, not as accordions or a
  list → detail drill-in (Zeni).
- V4's Help guide has one look, Cards. The minimal look stays only in V1.

## Gotchas & notes
- **Screenshots:** write each Playwright screenshot to a new filename. Re-reading an overwritten path
  returned the old image and looked like a stale dev server.
- **Probe scripts** are in `D:/Motadata/tour-shots/formrule/` (`v4a.mjs` … `v4l.mjs`); `v4a.mjs` lines
  1–34 build a rule that has findings.
- **`line-clamp-*` needs no `block` class** beside it, or the clamp stops working.
- **V4's split needs `min-w-0`** on its inner flex box, or the detail runs off the panel.
- **Repo clutter:** many untracked unrelated files (images, svgs, `.claude/agents`, `.impeccable`,
  probe PNGs in `src/app/components/`). Commit only the form-rule files.
- `FormRuleHelpGuide` (old six steps), `ResolveCard` and `FormRuleHelpMinimal`'s V4 use are built but
  unused in their old places.
