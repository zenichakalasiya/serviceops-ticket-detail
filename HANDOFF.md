# Handoff — 2026-10-09 13:50

## Read first
Start with CLAUDE.md → **Structure › Request Form Management**, from the part headed
**"V3 (8 Oct 2026, Zeni)"** onward, including the **"SPLIT 9 Oct 2026"** paragraph.
That paragraph is the current design of the help surfaces.

## What we worked on this session
This session added a third version, **V3**, to the Form Rule editor and split its help into two levels:
- **The module Help Card.** It sits in V3's right panel, follows Zeni's Figma "Help guide Card UI Inspiration", and keeps the content lighter.
- **A global, module-wise Help guide popup.** It opens from the header ⓘ beside Keyboard shortcuts.

## Completed
- **Reference PDF:** `D:\Motadata\FormRule-Help-Guide-References.pdf` holds 29 Mobbin help-guide and tutorial screens, styled like the Keyboard-Shortcuts references PDF. It is outside the repo.
- **V3 layout:**
  - A third V1|V2|V3 pill in the header switch (`formRuleUi`=v3 → layout `V3`).
  - The builder is on the left and a 560px help panel on the right, with no tabs.
- **Findings chips:** red Conflicts and amber Similar rules chips (`FindingCard`) sit inline right of the "Help guide" title, with no subline. Each opens the 960px RelatedDrawer.
- **Conflicts drawer in V3** (`resolveCard`): "How to resolve" is a blue card at the top.
  - It has six numbered tiles; the picked tile's text is explained underneath.
  - It has a "Read the full guide" link and folds (`formRuleResolveFolded`).
  - V1 and V2 still show the bar at the foot.
- **`formRuleHelpContent.ts`:** 19 articles of typed blocks. They include real ITSM scenarios, worked examples with before/after mini forms, do's and don'ts, a troubleshooting checklist, operator cards and an FAQ.
- **`FormRuleHelpPanel.tsx` → `HelpDocGuide`:** a topic list → article view.
  - Home has a Start-here hero and five topic groups.
  - Articles have On-this-page chips, Previous/Next and "Was this helpful".
  - Search covers every word.
- **`FormRuleHelpCard.tsx`:** the V3 right panel, matched to the Figma board. It has light-grey foldable section cards:
  - What is a form rule?
  - Key terms, with E.g. lines.
  - How a rule is evaluated: a dotted model, a FIELD/VALUE table, and a REQ-101..104 table with Runs/Skipped pills.
  - Actions at a glance.
  - Conflicts and similar rules.
  - Before you save.
  - Foot links: Open the full guide, Watch the 1-min video.
- **`GlobalHelpGuide.tsx`** (mounted in App): a 480px floating card under the header.
  - It has no backdrop, and Esc closes it.
  - It opens from the header ⓘ or the `open-global-help` event, on the guide for the module in the URL (`GUIDES`).
  - Form Rules is the only guide so far; other pages say "No guide for X yet" and list the ready guides.
- Every view was checked with Playwright screenshots and showed no page errors. The touched files typecheck clean.

## In progress
Nothing is mid-flight. The Help Card currently opens 3 of its 6 sections (`what`, `terms`, `how`), while the Figma board shows them all expanded.

## Next steps
- Ask Zeni whether the global Help guide should get a modules list on the left, like the shortcuts panel, or stay one module at a time.
- Ask Zeni whether to use the Figma board's dark code-block and tab-toggle cards; they were left out because they suit setup guides.
- Add guides for other modules. Each is one row in `GUIDES` in `GlobalHelpGuide.tsx`.
- Decide whether all Help Card sections should start open.

## Decisions made
- **Two levels of help:**
  - The module's right panel is the lighter Help Card.
  - The detailed, searchable doc guide is the GLOBAL popup, opened module-wise from the header ⓘ.
  - This was Zeni's split.
- **The global guide is non-modal.** It has no backdrop so the user can keep working while reading.
- **Help wording is read from `formRuleData`.** Wording for events, execute-on, applies-to and actions comes from there, so the help cannot drift from the dropdowns.
- **V1 and V2 are unchanged.** The resolve card and the help panel are V3-only.

## Gotchas & notes
- **Figma access:** the Figma MCP account (zeni300605@gmail.com) has a View seat only, so every Figma MCP call fails with "no edit access". The board was read through Chrome instead.
- **Two cross-component events wire V3 together:**
  - `form-rule-watch-guide` plays the editor's video dock.
  - `open-global-help` opens the popup.
- **Repo clutter:** the repo has many untracked unrelated files (images, svgs, `.claude/agents`, `.impeccable`, etc.). Commit only the form-rule files.
