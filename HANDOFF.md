# Handoff — 2026-10-23 (Compliance: visualization, benchmark profiles, form polish)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "## Compliance (Oct 2026)", which now covers the Compliance Visualization module and
benchmark profiles.

## What we worked on this session
Continued the Compliance module (admin Rules + Benchmark, technician Compliance Policy). Added benchmark
profiles, built a Compliance Visualization module, and polished the Policy and Create Benchmark forms.

## Completed
- **Benchmark Profile L1/L2** on benchmarks.
- **Compliance Visualization** (`#/compliance-visualization`, Compliance flyout in the sidebar):
  `ComplianceVisualizationPage`, `ComplianceVizOverview`, `ComplianceEndpointPanel`, `complianceVizData`.
  It reuses the shared listing via new `AssetRegisterPage` props (Tiles / embedded / viewsOpen).
  `ChartTile` takes `chart.colors`, `RuleDetailPanel` takes `results`, and `compliancePolicyData`
  gained `findingsOf`. The views toggle sits before the heading, and the listing's title row is gone.
- **Policy form** (`CompliancePolicyEditor`): info-icon tooltip, an 8px column gap, and a 1px gap
  between title and subtitle.
- **Create Benchmark form**: grid-cols-3 with six equal fields. Row 1 = Name · Type · Version,
  row 2 = Description · Profile · Tags (Profile and Description were swapped). Checked in a headless
  browser with no page errors.

## In progress
Nothing mid-flight.

## Next steps
- With the views rail open, check whether the Policies list still clips its last column (Last Scan).
- Idea not built: clicking an Overview KPI should jump to a pre-filtered Explorer.
- To confirm with Zeni: the posture bands and the 85% target (taken from the reference); the trend chart
  uses synthetic data; whether Remote Office / Tag modes should use a side panel; and whether admin
  benchmarks should be shared with the technician side (the policy form still reads `BENCHMARKS_SEED`).

## Decisions made
- Visualization reuses the product's listing and chart tiles; no new components were built (Zeni's rule).

## Gotchas & notes
- Dev server is http://localhost:5200/ (local base is `/`). Verification is done with headless
  playwright-core scripts kept in the session scratchpad.
- Untracked junk in the repo root (screenshots, "ServiceOps portal layout system/", .claude/agents,
  .design-sync, .impeccable, g-*/j-*/q-*.png in components) is deliberately NOT committed.

---

# Handoff — 2026-10-22 19:16 (Support Portal publishing)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › the Support Portal listing bullets, especially the note marked **SUPERSEDED 22 Oct 2026**.
It replaces the old "one live portal, and it is the default" rule.

## What we worked on this session
Found the past session about User Surveys and the one about the Support Portal builder. Then changed
how Support Portal publishing works.

## Completed
- The default portal no longer changes. The Set as default action and the "Publish and make it the
  default?" popup (`ConfirmPublish`) are deleted from `AdminSupportPortalModule.tsx`.
- Several portals can be published at once. Publish in the editor and the switch on a portal card go
  live straight away, with no confirmation, and leave every other portal as it is.
- Save as draft has no confirmation. It still takes a live portal off the support portal.
- Checked in Chrome: copied the default portal and switched the copy on. Both were Published, no popup
  appeared and there were no page errors. Typecheck was clean for the file.

## In progress
Nothing mid-flight.

## Next steps
- Zeni to decide: (1) should the default portal's switch stay on permanently, so requesters always
  have somewhere to land? (2) A copied portal keeps the original's URL, so two live portals can share an
  address. Should publishing be blocked until the copy has its own URL?
- Compliance next steps from the previous session (below) still stand.

## Decisions made
- The default portal is fixed, and any number of portals can be published (Zeni, 22 Oct 2026).
- Neither Publish nor Save as draft asks for confirmation (Zeni).

## Gotchas & notes
- The past Support Portal builder session is `ab0a5508-5caf-4776-8eb3-24df9d481254` (12 Aug to 5 Oct
  2026). The User Surveys session is `2e89b06b-1ee0-485b-85c3-a9b32e8d9b41`.
- This folder's working tree carries uncommitted work from other sessions (Compliance, Form Builder,
  Form Rules and others), and local `main` is behind `origin/main`.

---

# Previous session — 2026-10-21 11:28 (Compliance session)

## Read first
CLAUDE.md › **Compliance (Oct 2026)** (the last section). It covers all three pieces and the two
store gotchas.

## What we worked on this session
Built the Compliance area: Admin › Compliance › Rules and Benchmark, then the technician-side
Compliance Policy module (listing, full-screen form, detail drawer).

## Completed
- Admin Rules listing (read-only) and Benchmark listing, detail drawer and full-page form.
- Benchmark rule groups: 3-level numbering (1 / 1.1 / 1.1.1) with sub-groups, bordered Attach Rules +
  Add Sub-group CTAs, new empty-group picture, locked Type/Version chips in the Attach picker.
- Compliance Policy: sidebar item below Package, `#/compliance-policies` listing on the shared grid
  (KPI cards, saved views, Run Now / Schedule / Edit / Clone / Delete / Enable), full-screen form,
  detail drawer (Overview · Endpoints · Rules).
- Form polish per Zeni: no section icons/dividers, benchmark pre-selected, endpoints added from the side
  panel with an empty-state picture + Add Endpoints CTA.
- All verified headless in Chrome with no page errors.

## In progress
Nothing mid-flight.

## Next steps
- Zeni to answer: (1) which benchmark a new policy should default to (currently the first, BM-1);
  (2) should Remote Office / Tag modes also pick from a side panel instead of a dropdown?
- Share benchmarks between Admin and the technician side (one store) so a newly created benchmark appears
  in the policy form.
- Results tab on the policy detail page with the two visualisations: static drill-down and any-to-any.

## Decisions made
- Policy targets = Endpoints, chosen by Endpoint / Remote Office / Tag, filtered to the benchmark's Type +
  OS version (Zeni).
- Metadata on the form = Tags, Config File Type (network only), Schedule, Notify Team (Zeni).
- Row click opens a detail drawer like other modules, not a read-only form (Zeni).
- Listing hides Schedule / Next Scan by default so Actions fit at 1440px.

## Gotchas & notes
- The policy store lives on `globalThis` because Vite HMR can load the module twice.
- `compliancePolicyData.ts` builds its fleet lazily — it sits in an import cycle with DrawerStack.
- Scan results and the extra servers/network devices are mock data (deterministic).
- Dev server runs detached on port 5200 (its own window); never stop it.

---

# Handoff — 2026-10-16 15:53 (Upstream merge + Dashboard session)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › **Upstream sync (14 Oct 2026)** and **Dashboard module** (the last two sections). Then
`src/app/components/dashboard/PORTING.md` before touching any Dashboard file.

## What we worked on this session
Brought the upstream prototype in (its new listings and modules, our detail pages kept), ported the
Vue Dashboard prototype into React, then added a header profile popup with the Dashboard's theme
switch, a requester Support Portal view and a design-system dark palette.

## Completed
- Upstream merge `93b8b39` (option A: upstream listings + new modules; our 79 detail files kept, list in
  `D:/Motadata/keep-ours.txt`; 61 upstream shared components vendored in `components/upstream/`).
- Dashboard port `cb588b3`: boards, widgets (ECharts), builder, Manage dashboards; routes
  `#/dashboard/<id>` and `#/dashboards`; sidebar Dashboard icon wired.
- `3fa1441` Data source = pill-track; `7f2c7c6` Add-widget filter = Relations-tab chips.
- `cf8b37f` Profile popup (`ProfileMenu.tsx`), theme switch on Dashboard pages only, `#/portal`
  requester view (`RequesterPortalPage.tsx`), Figma Color Primitives dark palette. Verified headless:
  no page errors, theme row only on dashboards, portal opens and Back returns.

## In progress
Nothing mid-flight. Everything above was on branch `sync/upstream-oct` (worktree
`D:\Motadata\sync-upstream`) until this session's publish.

## Next steps
- Zeni to confirm: "Take a tour" in the board ⋯ menu; ListingFlyout underline tabs; "All" chip count in
  Add widget; portal back-button placement; derived email address.
- Decide whether prototype-only Dashboard UI (email chip fields, chart-type/colour pickers, note
  toolbars, filter checkbox lists) should be replaced with product components.
- Figma: Neutral/60 is identical in Light and Dark; the older "Token" collection has a second dark palette.
- Software License → Software asset deep link is broken (already broken on `main`, not fixed).

## Decisions made
- Option A merge: new upstream pages, our detail pages unchanged (they hold months of our work).
- Dashboard: core product only (no Iris/galleries), ECharts, dark mode Dashboard-only.
- Product UI wins: CTAs, form fields, `.pill-track` radios are ServiceOps components inside the Dashboard.
- Dark palette from Figma Color Primitives, dark mode only; light mode unchanged.

## Gotchas & notes
- `scripts/scope-root-fix.mjs` must be re-run after editing any Dashboard component CSS (`@scope` root bug).
- tsc aborts early on `CatalogItemDetailsModal.tsx` syntax errors, so an empty typecheck is not "clean".
- The worktree dev server ran on port 5201 (dev base `/`).

---

# Handoff — 2026-10-13 11:48 (User Surveys session)

## Read first (User Surveys)
CLAUDE.md › Key context › *User Surveys — the Emails field is ONE search-or-add box (13 Oct 2026)*.
It supersedes the popup details in the two User Surveys bullets above it.

## What we worked on this session
After user testing showed add and search could not be used together, redesigned the Emails popup
into a single search-or-add box, to Zeni's spec. It is meant to be reused across the product.

## Completed
- One box, icon inside it: grey magnifier while searching, filled blue + once the text stops matching.
- Yellow highlight on matched characters; matches sorted best-first.
- Field shows one chip + a number; hovering the number lists the other emails.
- Popup focuses its box on open (it never did before — fixed).
- Removed: the count line, the empty "no match" block, the comparison tabs and the three other designs.
- Field no longer looks focused while the popup is open.
- Every input and dropdown in the panel is 4px, like the ticket detail page.
- Verified in Chrome (Playwright), no page errors. Published.

## In progress
Nothing mid-flight.

## Next steps
- Extract `EmailsField` / `EmailsPopup` into a shared component if it is to be used product-wide
  (today it lives inside `CreateUserSurveyPanel.tsx`).
- Check `ImportEmailsPanel`'s controls against the 4px radius rule.
- Still open from before: rich-text Description, the listing's own Import button (demo count 120).

## Decisions made
- Search and add are ONE field; the icon tells you which the text currently is (Zeni).
- A complete new address is always addable, even inside an added one.
- No count line in the popup (Zeni).

## Gotchas & notes
- Another session's Form Rule files and `theme.css` are uncommitted in this folder and were NOT
  published; `CLAUDE.md` goes up whole, so its unpublished doc notes go with it.
- Patch scripts with template literals must be written with the Write tool — a bash heredoc broke one.

---

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

# Handoff — 2026-10-22 15:07 (Form Rules session)

## Latest (21–22 Oct) — Form Builder redesign, published 23 Oct 2026
Read CLAUDE.md → **Form Builder redesign (21 Oct 2026, Zeni …)** first.
- **Lesson from Zeni (22 Oct):** when she attaches reference images, copy them EXACTLY. I had
  adapted them to the design system and she was unhappy ("have you make UI same as my attached image????").
- **Done:** Configure panel now matches her Image 14 element for element (840px, back button,
  "Configure {field}" + Doc ↗ subtitle, dashed Create New Rule, "Select by rule name..." + All ⏷
  filter menu, uppercase RULE / EXECUTE ON / BEHAVIOUR / ACTION table, Reuse Rule ↗). Hover
  toolbar matches Image 16 (two h-10 #EAF2FB tabs on the dashed outline, filled gear "Create Rule",
  dark icons; grey label + rounded "N Rules" pill). Grid `gap-y-9 pt-10`. Typecheck clean,
  checked in the browser with Playwright (`D:/Motadata/tour-shots/formbuilder/fb1–3.mjs`).
- **22 Oct:** removed the "Open the full guide ↗" link from the foot of the V3 Form Rules Guide
  (`FormRuleHelpCard.tsx`); only "Watch the 1-min video" is left. Not yet seen in the browser.
  The hidden V1/V4 guides (`FormRuleHelpV4.tsx`) still have that link — ask Zeni.
- **Waiting on Zeni:** (1) Rules panel (from the N Rules pill) — copy Image 10 exactly, or will
  she send a new reference? (2) Is Type (Custom / System Field) editable? (3) AI Accessible
  tooltip wording. (4) Hint Text = placeholder, Description = line under the field — right?
- **To commit (only when she asks, or on /tatago):** formRuleData.ts, FormRuleEditor.tsx,
  AdminRequestFormModule.tsx, AdminFormBuilder.tsx, FormFieldEditPanel.tsx,
  FormFieldRulesPanel.tsx, FormRuleHelpCard.tsx, CLAUDE.md, HANDOFF.md. Never `git add -A`;
  leave the other session's Compliance files out.

## Read first (13 Oct session below)
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
- **Summary cards — attention flow (V3), reworked 13 Oct:**
  - No blur and no dimming: the page behind stays exactly as it is (Zeni: the blur disconnected users).
  - The popup opens the moment its card appears, even while a builder dropdown is open.
  - The card wears a steady 3px ring in its own colour while the popup is open (no pulsing).
  - Closes only from Got it, X or the info icon beside the card title; opening a sidebar also closes it.
  - Once per card **per editor visit**, as before.
- **Popup look (13 Oct):** dark (`#364658`), 320px wide, picture as a light rounded box inside it,
  white Got it button. It is one shared component, so hidden V1 / V2 / V4 get it too.
- **Help guide (13 Oct):** section headings are 15px with a dark icon tile, a hairline above the
  second section, and the heading sticks to the top while its section scrolls. Topic icons are bare
  (no white tile) and sit closer to their titles.
- **19 Oct:** Illustrations page for developers — icon left of Cancel in the rule editor header → `#/admin/request-form-rules/illustrations`; 4 pictures with SVG / PNG @2x / Copy SVG. Guide pictures redrawn as real SVG (one source). Open: Conflict file background grey vs white; 12px padding on guide pictures.
- **21 Oct:** Form Builder redesigned (not published yet): grouped palette incl. Rich Text / Radio / Section / Label / Dependent; hover toolbar (Create Rule · move · width · duplicate · edit · remove); N Rules chip; Create Rule → Configure panel (create + reuse table), N Rules chip → Rules panel (detail, cleaned up); toolbar = two light-blue tabs; both add the field as a condition; Edit Field side panel. Open: is Type (Custom / System Field) editable?
- **17 Oct:** the one-line description under the Form Rules Guide title was removed (Zeni).
- ⚠️ The 13 Oct changes were typechecked only before publishing: the dev server was stopped (low
  memory), so they were not seen in a local browser.

## In progress
Nothing mid-flight.

## Next steps
Open questions for Zeni:
- **Picture captions** are my wording, not her copy: "Conditions met: HR fields shown", "No longer
  met: hidden again", "Same trigger and conditions → add your action to the existing rule".
- **Got it button** is white on the dark popup (my choice); Zeni may prefer the product blue.
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
- **Dropdown watch is gone:** the editor no longer observes `[data-rule-menu]`; the attribute is
  still on `RuleSelect` and `FieldPicker` menus, unused.
- **Dev server:** port 5200 was stopped by the system for low memory; restart with
  `npm run dev -- --port 5200` when needed.
- **Seen flags:** V3 reads and writes no `formRuleCheckIntroSeen` key; other layouts keep once-ever.
- **Probe scripts** in `D:/Motadata/tour-shots/formrule/`: `at5.mjs` (attention flow over two
  visits), `ar1.mjs` / `ar2.mjs` (example pictures), `fn1.mjs` (Soft final, no tabs), `v4a.mjs`
  lines 1–35 build a rule that has findings. Write screenshots to new filenames.
- **CRLF:** `FormRuleConflictReview.tsx` has CRLF line endings; normalise them in patch scripts.
- **Shared tree:** another session commits to this repo at the same time. Commit only the form-rule
  files, and re-read CLAUDE.md / HANDOFF.md before editing them.
