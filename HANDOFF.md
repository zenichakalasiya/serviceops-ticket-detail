# Handoff — 2026-10-12 (later session)

## Read first
Start with CLAUDE.md → **Structure › Request Form Management**, from **"V3 (8 Oct 2026, Zeni)"**
to the end of that bullet, then the two bullets after it: **Form Rule editor — V3 is FINAL** and
**Form Rule action row — the FIELDS picker**.

## What we worked on this session
The Form Rule editor (Admin › Request Management › Request Form Rule):
- **V3 was made the final version.** The other versions are hidden.
- V3's help guide and conflicts drawer were polished.
- The action row got a new Fields picker, built from Zeni's Figma component.

## Completed
- **V3 is FINAL.** The V1 | V2 | V3 | V4 switch beside the logo is hidden, and the editor always
  opens on V3, whatever the browser had stored. V1, V2 and V4 stay built.
  - Restore: `FINAL_UI = null` in `FormRuleEditor.tsx` and remove `false &&` before
    `<FormRuleUiSwitch />` in `Header.tsx`.
- **V3 help guide (`FormRuleHelpCard.tsx`):**
  - Each item is a bullet point with a bold title.
  - Section cards have a lighter background (`#F7F9FC`, was `#F1F4F9`).
- **V3 conflicts drawer:** the "How do I resolve these conflicts?" foot bar is a prominent light-blue
  card with a **View steps ›** button (`helpProminent` prop on `FormRuleConflictReview`).
- **V4:** the Minimal | Cards switch was removed; the Help guide shows Cards only. (V4 is hidden now.)
- **Fields picker (`FormRuleFieldPicker.tsx`, new)** replaces the multi-field select in the action row:
  - 300px dropdown: search, an Expand button, selected fields as chips (five, then `+N`), the
    remaining fields as a flat list. Picking applies straight away.
  - Expanded 600×500 "Select fields" panel: match mode + keyword and Select all on the left; the
    selection, a download button and Clear all on the right; Cancel / Apply Fields.
  - "Set value" keeps its single-field dropdown.
- Each change was checked in the browser with Playwright; no page errors.

## In progress
Nothing mid-flight.

## Next steps
Open questions for Zeni:
- **Fields picker**
  - What should the download icon do? It downloads the selection as a CSV, which is a guess.
  - Collapse keeps the picks; Cancel, ✕, Esc and a click outside discard. Is that right?
  - The expanded panel opens at the field. Should it be a centred dialog instead?
  - Apply Fields is the product blue (Figma shows black). Keep?
  - The list is flat, so the System / Custom headings are gone. OK?
  - Should conditions or "Set value" use this picker too?
- **Prominent resolve card:** the sub-line "Six ways to fix a clash, step by step." is my wording.
- **Help guide bullets:** "points" was read as dots + bold titles. Remove the dots if only bold was meant.
- **Help cards:** go lighter than `#F7F9FC` if wanted.

## Decisions made
- V3 is the final Form Rule editor (Zeni, 12 Oct 2026).
- The help copy is final; only its presentation changes.
- The Fields picker's expanded panel edits a draft; nothing changes on the rule until Apply.

## Gotchas & notes
- **Screenshots:** write each Playwright screenshot to a new filename; a re-read of an overwritten
  path can return the old image.
- **Probe scripts** are in `D:/Motadata/tour-shots/formrule/`. `v3o.mjs` checks the V3-only state,
  `fp1.mjs` walks the Fields picker, and `v4a.mjs` lines 1–35 build a rule that has findings.
  - Scripts that set `formRuleUi` to v1 / v2 / v4 now land on V3 regardless.
- **CRLF:** `FormRuleConflictReview.tsx` has CRLF line endings; normalise them in patch scripts.
- **Repo clutter:** many untracked unrelated files (images, svgs, `.claude/agents`, `.impeccable`,
  probe PNGs in `src/app/components/`). Commit only the form-rule files.
- `FormRuleHelpGuide` (old six steps), `ResolveCard`, `FormRuleCheckPanel` (V4) and the V1 / V2
  layouts are built but not reachable while `FINAL_UI` is set.
