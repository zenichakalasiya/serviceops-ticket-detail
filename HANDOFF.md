# Handoff — 2026-10-12 18:08 (User Surveys session)

> Two sessions share this file. **This top part is the User Surveys session**; the Form Rules
> session's notes follow below the divider.

## Read first (User Surveys)
CLAUDE.md › Key context › *User Surveys — listing + Import Emails* and *User Surveys — Create User
Survey panel + the Emails field (12 Oct 2026)*.

## What we worked on this session
The Create User Survey panel and its new Emails field: a chip read-out that opens an add / search
popup, plus an "Import values" button that feeds CSV emails into the survey's audience.

## Completed
- `CreateUserSurveyPanel.tsx` — all fields from the old form on our own controls; inline validation;
  a created survey lands on top of the listing as Design.
- Emails field + popup: Add button appears while typing, search icon expands and folds the email
  field into a blue +, newest email first, paste-many, invalid/duplicate errors, 500 cap.
- Empty popup is just the input row (58px); count line and list appear with the first email.
- **Import values** beside the Emails label → `ImportEmailsPanel` with the survey's real count and an
  `onImport` callback; duplicates skipped.
- Later the same day: the popup lost its Add button (a hint line "Press Enter to add · separate several
  with commas" replaces it), gained a bold **Emails** title, a count pinned under the list, no
  divider lines, and the search-mode **+** is disabled while the audience is full (500).
- Verified in Chrome (Playwright), no page errors. Published.

## In progress
Nothing mid-flight.

## Next steps
- Zeni to decide: rich-text Description or keep the plain text box; whether search should look up
  directory users; whether the LISTING's Import button (demo count 120) should go.
- Row click and Schedule Survey still have no screens.

## Decisions made
- The emails live in a popup, the field is only a read-out (an audience runs to hundreds).
- Collapse to + is animated, coming back to add is instant (Zeni's wording).
- No empty-state block in the popup (Zeni: too much white space).

## Gotchas & notes
- The Form Rules session's files (`FormRuleEditor`, `FormRuleHelpCard`, `FormRuleRelatedView`,
  `theme.css`) were left out of this session's publish; that session published them itself afterwards.
- Playwright counts a zero-height button as visible — measure `[data-add-row]`'s height instead.


---

# Handoff — 2026-10-12 (Form Rules session, evening)

## Read first
CLAUDE.md → **Structure**, the three bullets starting **Form Rule editor — V3 is FINAL**,
**Form Rule help guide — FINAL copy** and **Form Rule action row — the FIELDS picker**.
The help-guide bullet carries everything from this session.

## What we worked on this session
The Form Rule editor's right panel (Admin › Request Management › Request Form Rule, V3):
- New final help guide copy, then a redesign of the guide into small accordions.
- A first-time attention flow for the Similar rules and Conflicts summary cards.

## Completed
- **Help guide copy (Zeni's final, 12 Oct):** panel title "Form Rules Guide" + sub-line; two groups,
  seven topics. Do not rewrite it.
- **Help guide layout — Soft is FINAL** (`FormRuleHelpCard.tsx`):
  - Each group has a small heading with its intro line always visible.
  - Each topic is a light grey tile: grey icon, title, chevron. All seven are open on arrival and
    each folds on its own.
  - Examples sit in a block labelled "Example", with a small still picture above the sentence:
    Reverse Action (a form in two states), Conflict (the popup's drawing), Similar Rule (two rule cards).
  - `FINAL_HELP_LOOK = 'soft'` in `FormRuleEditor.tsx` hides the layout tabs. Grouped, Lines and
    Cards stay built; `null` brings the tabs back beside Cancel / Save Rule.
  - Steps, Nested and Tabbed layouts were built and then removed on request.
- **Summary cards — attention flow (V3):**
  - A card slides in when it arrives, gets a soft pulsing halo in its own colour, and its info popup
    drops in below it.
  - The rest of the page dims and blurs while the popup is open; Got it, ✕ or a click on the blur
    closes it.
  - Shows once per card **per editor visit** (not once ever). The ⓘ beside the card title replays it.
- Each change was checked in the browser with Playwright; no page errors. Published.

## In progress
Nothing mid-flight.

## Next steps
Open questions for Zeni:
- **Picture captions** are my wording, not her copy: "Conditions met: HR fields shown", "No longer
  met: hidden again", "Same trigger and conditions → add your action to the existing rule".
- **Popup waits for the dropdown (done, late evening):** the halo, blur and popup now hold until
  the builder dropdown closes; the card itself still slides in at once. Zeni had asked whether the
  dropdown should close by itself instead; that alternative is still on offer if she prefers it.
- **Once per visit vs once ever** for real users; it is per visit so it can be demoed.
- The hidden V1 / V4 guides (`FormRuleHelpMinimal`, `FormRuleHelpV4`) and the global Help guide
  still hold the 9 Oct copy.
- **Fields picker** (from the earlier session, still open): what the download icon should do (it
  downloads the selection as CSV, a guess); Collapse keeps the picks; anchored vs centred panel;
  blue vs black Apply; flat list with no System / Custom headings; use it for conditions / Set value?
- **Prominent resolve card:** the sub-line "Six ways to fix a clash, step by step." is my wording.

## Decisions made
- V3 is the final Form Rule editor; Soft is the final help guide layout (Zeni, 12 Oct 2026).
- All topics expanded; grey icons; guide links stay at the foot.
- Example pictures: above the sentence, mini rule cards, static.
- The attention flow reuses the existing info popups, placed below the card so they stay off the form.

## Gotchas & notes
- **Stacking:** `.rc-enter` must stay `backwards` (not `both`) and the card wrapper takes `z-50`
  while its popup is open, or the guide paints over the popup.
- **Dropdown watch:** the editor looks for `[data-rule-menu]` on the body (`menuOpen`). `RuleSelect`'s
  menu and both `FieldPicker` shapes carry it; a new portalled builder menu must carry it too.
  Probe: `df1.mjs`.
- **Dev server:** port 5200 was stopped by the system for low memory; restart with
  `npm run dev -- --port 5200` when needed.
- **Seen flags:** V3 reads and writes no `formRuleCheckIntroSeen` key; other layouts keep once-ever.
- **Probe scripts** in `D:/Motadata/tour-shots/formrule/`: `at5.mjs` (attention flow over two
  visits), `ar1.mjs` / `ar2.mjs` (example pictures), `fn1.mjs` (Soft final, no tabs), `v4a.mjs`
  lines 1–35 build a rule that has findings. Write screenshots to new filenames.
- **CRLF:** `FormRuleConflictReview.tsx` has CRLF line endings; normalise them in patch scripts.
- **Shared tree:** another session commits to this repo at the same time. Commit only the form-rule
  files, and re-read CLAUDE.md / HANDOFF.md before editing them.
