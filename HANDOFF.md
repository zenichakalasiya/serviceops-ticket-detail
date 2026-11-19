# Handoff — 2026-11-19 (evening): Compliance Audit listing shows Compliance Result

> Sessions share this file. This top part is the newest; older notes follow.

- **Compliance Audit listing** default columns: ID · Policy Name · Status · Compliance Score · **Compliance Result** · Last Scan Date · Enable · Actions (TicketTable `compliance-policy`; removed from `MODULE_EXTRA_COLS`; saved-columns key → V6). Published.
- Open: quick-filter page for Office / Execution Status / Compliance Result; score presets; Compliance v2 re-pin or new version.

---

# Handoff — 2026-11-19 17:42 (Lifecycle Sync: Warranty + EOSL Sync Schedule)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Lifecycle Sync (Admin › Supplier Management)" under Key context.

## What we worked on this session
Built a new admin module, Lifecycle Sync, under Supplier Management, with two tabs: Warranty and EOSL Sync
Schedule. Redesigned from Zeni's reference (lifecycle-sync-v21.html), replacing its empty-state banner.

## Completed (verified in a headless browser, no page errors)
- `AdminLifecycleSyncModule.tsx` — route `#/admin/lifecycle-sync`, card + nav row "Lifecycle Sync"
  (replaces the old Warranty Sync and EOSL Sync Setting cards in `adminData.ts`), `CARD_MODULES` entry in AdminPage.
- Warranty tab: summary card (fetched automatically · Sync now · devices / warranty found / expiring 30d /
  last synced) → Supported vendors (Dell, HP, Lenovo, ASUS) as cards with status pill, on/off switch,
  coverage bar. Dell needs credentials: amber card + Add credentials → right side panel (Client ID, Client
  Secret, Where to find these, Save & connect) → Connected + Edit credentials.
- EOSL tab: Automatic EOSL sync switch, Frequency / Day or Date / Time, a "Runs … Next run …" sentence,
  Sync now + Save (disabled until changed), Recent runs table.

## In progress
Nothing mid-flight for this module. NOTE: the working tree also holds another session's uncommitted
Form Studio changes (FormStudio.tsx, formStudioData.ts, formStudioUi.ts, AdminFormModule.tsx) — not
part of this work.

## Next steps
- Zeni to review: vendor marks are text badges (not real logos); run times (warranty daily 06:00,
  EOSL weekly Mon 02:00) and all numbers are mock.

## Decisions made
- Vendors limited to the four in the reference — no unconfirmed vendors added.
- Both tabs stay mounted (hidden) so saved Dell credentials / an unsaved schedule survive a tab switch.

## Gotchas & notes
None.

---

# Handoff — 2026-11-19 (late afternoon): Create Audit guide redesign; "will be assessed" line removed

> Sessions share this file. This top part is the newest; older notes follow.

## Completed (headless browser, no page errors, alignment MEASURED) — published
- **Create Audit help guide, field groups (Zeni, many rounds — final):** steps with `blocks` render minimal (`CreateFormHelp.tsx`, Accordion `flush`):
  - step body starts at the STEP TITLE's edge (`pl-10`); one-liner sits ~4px under the title (header `pb-1` only while a flush step is open — a negative margin got clipped by the fold animation);
  - 20px to the first group, 16px between groups, NO dividers, NO cards;
  - group head = 14px icon in the title colour `#1D2A3E` (`BLOCK_ICONS`, `HelpBlock.icon`) + name; group text at the name's edge;
  - fields = bullets: dot centred under the group icon, field name at the group name's edge, description under it;
  - Note = a white strip across the step card's full width (`-ml-7`), even 12px padding, "Note:" kept.
- **Create Audit step 2:** the "N endpoints will be assessed · N offline…" line is removed (the no-targets error stays).

## Open
- Office / Execution Status / Compliance Result quick filters: which page?
- Score presets 50/70/80/90 to confirm; Compliance v2 re-pin or new version.

---

# Handoff — 2026-11-19 13:25 (Patch: V5 is the final paused banner; count links to the Deployment tab)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Patch Deployment — Pause / Resume" under Key context (its last sentences).

## What we worked on this session
Made V5 the final paused-deployment banner and turned its count sentence into a link to the Deployment tab;
then slimmed the strip.

## Completed
- `FINAL = 'v5'` in DeploymentPausedBanner.tsx: the V2/V4/V5/V6 switch is hidden and any stored pick is ignored.
  V2, V4 and V6 (and the Line | Pill card) stay built; `null` brings them back.
- "10 of 12 installations paused" is a link (`onCount` → `setActiveMainTab('installation')`): 14px, no
  underline at rest, blue + underline on hover, instant tooltip "View installations in the Deployment tab".
- Strip is 42px (was ~54): 24px pause mark, compact 28px Resume, tighter padding; 16px above and below it.
- Verified in the browser on PDR-1431: no switch, link opens the Deployment tab, sizes measured; no page errors.

## In progress
Nothing mid-flight.

## Next steps
- Open questions to Zeni: use the run's REAL counts (the Deployment tab lists 4 installations, the banner says
  10 of 12 — fixed demo copy)? Should the link open the Deployment tab filtered to the paused installations?

## Decisions made
- V5 final (Zeni). No underline until hover (Zeni). Count 14px = 2px smaller than what showed (Zeni).

## Gotchas & notes
- A bare `<button>` does not inherit its line's font-size here (it rendered 16px in a 13px line) — always give
  text buttons an explicit size.
- Other sessions' uncommitted Compliance / create-form work is in the tree; left out of this commit.

---

# Handoff — 2026-11-19 (afternoon): Compliance score quick filter, rule facts order, Rule Score subtext

## Completed (headless browser, no page errors) — published
- **Score quick filter** on Compliance Audit (Compliance Score) and technician Rules (Rule Score): a gauge icon opens `ThresholdPopup` (TicketFilterBar.tsx) — **Less than | Greater than** (Zeni: "Below / At least" confuses technicians; Greater than is STRICT), presets 50 · 70 · 80 · 90%, a typed score + Apply, and a plain sentence "Shows audits with a score greater than 85%". No empty / not-empty choice. Applies to the numeric `x_cpScore` via a hidden `type: 'number'` attr (`unit: '%'`); the chip edits the number. `QuickFilterDef.threshold = { presets, unit, noun }`. New conditions `is less than` / `is greater than` in applyFilters.
- **Rule facts line order** (`RuleFactsRow`, ComplianceShared.tsx — the ONE source for every rule header): Assessment · Profile · OS Platform · OS Version · Severity, so the L1/L2 chip no longer sits under the blue RUL pill.
- **Rule details › Endpoints tab:** Rule Score card subtext "N of M scanned pass" ("no endpoint scanned yet"), so all four KPI values line up (ComplianceRulesPage.tsx).

## Open
- Presets 50/70/80/90 — Zeni to confirm (Rules data mostly < 70%); Between not built.
- Office / Execution Status / Compliance Result quick filters: which page?
- Compliance v2 re-pin or a new version — `versions.json` untouched.

---

# Handoff — 2026-11-19 12:39 (Patch: "10 of 12 installations paused" on every paused banner)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → the "Patch Deployment — Pause / Resume" bullet under Key context (its last sentences).

## What we worked on this session
Added the paused count "10 of 12 installations paused" to every paused-banner version on the Patch Deployment
detail page, and two ways to fit it in the narrow V4/V6 card.

## Completed
- V2 / V5 (wide strip): the count comes first, then "by <name> · <time>", then Resume.
- V4 / V6 (narrow card): a **Line | Pill** switch beside the banner switch, shown only on V4/V6. Line = the count
  is line 1, "name · Nov 17, 01:04 PM" under it. Pill = "Paused [10/12]", the sentence in a dark tooltip on hover.
- Verified in the browser on PDR-1431, all six combinations; no page errors.
- Hovering the short time in the narrow card shows the full date at once (Radix, delay 0, below the time).

## In progress
Nothing mid-flight.

## Next steps
- Zeni picks a banner placement (V2/V4/V5/V6) and, for V4/V6, Line or Pill; then remove the switches.
- Replace the fixed count with real data (installations still pending ÷ all installations of the run).

## Decisions made
- The count is FIXED demo copy for now (`PAUSED_COUNT` in DeploymentPausedBanner.tsx) — Zeni's choice.
- The narrow card shortens the date to "Nov 17, 01:04 PM" (full date on hover) so it keeps its height.

## Gotchas & notes
- Other sessions' uncommitted Compliance work (`TicketFilterBar.tsx`, `complianceFilterAttrs.ts`) is in the
  tree; it was left out of this commit.

---

# Handoff — 2026-11-19 (evening): Create Audit is V1-only; Notify To one chip; guide spacing

## Completed (headless browser, no page errors) — published
- **Create Audit is V1 only** (full page, stepper left; internal id `'v2'`): `CompliancePolicyEditor` hard-codes `ui` and no longer calls `setExtraCreateOpen`, so the header V1 | V2 pill does not show on it. Other modules' create pages keep the switch. Restoring = `useCreateFormUi()` + the effect (comment in the file).
- **Notify To field** (`NotifyPicker`): ONE chip = the most recently added pick (picks are appended → last), then `+N` with an instant tooltip listing the rest (newest first, 12 then "+N more"). Fixed `h-8`, no wrap, so it sits level with Deployment Policy (both 32px). The popup's Selected Items still shows 3 chips.
- **Create Audit guide:** 20px above each field group (16px under the one-liner); `FormHelp.highlight: false` turns off the lit step for this guide only — all three cards the same grey.

## Open
- Office / Execution Status / Compliance Result quick filters: which page?
- Compliance v2 or a new version — `versions.json` not re-pinned.

---

# Handoff — 2026-11-19 (later): Create Audit 'Notify To' + Zeni's help guide

## Completed (headless browser, no page errors)
- **Notify Team → Notify To** in the Create Audit schedule step, the live summary (CompliancePolicyEditor.tsx) and the audit detail properties (CompliancePolicyDrawer.tsx).
- **Create Audit help guide = Zeni's own copy, word for word** (`FORM_HELP['compliance-policy']` in createFormGuides.ts): title 'Compliance Audit Guide', two intro paragraphs, three steps with field groups. Do not rewrite it.
- Guide model gained optional `introMore`, `howHint` (null hides the 'Fill the form…' line), step `blocks` (title / text / items / note) and an optional `example`; CreateFormHelp.tsx renders them and hides empty Fields / Example / Mistakes (and the whole 'Good to know' when all are empty). scripts/build-form-guides.mjs guards a missing example.

## Open
- Office / Execution Status / Compliance Result quick filters: which page? (see below)
- Compliance v2 or a new version — main pushed, versions.json not re-pinned.

---

# Handoff — 2026-11-19 11:10 (Form builder: form centred; V4 Fields panel as a joined tile grid)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Form builder versions", its last bullet (19 Nov 2026).

## What we worked on
The admin form builder (`FormStudio.tsx`): where the form sits, and V4's Fields panel.

## Completed (headless browser, no page errors)
- **Form centred** in the space left of the right panel, in V2 / V3 / V4 (`mx-auto` on both 1040px canvas wrappers). Measured 250px each side at 1920px.
- **V4 Fields panel** rebuilt after Zeni's reference (a grid of joined cells): 300px wide (V2 / V3 stay 380px), no divider under the Fields | Settings tabs, a search box, a grey band per group, cells 149 × 92px with hairlines between them, the picture above the name.
- **V4 panel behaves like V2's:** search by name or description, a click adds after the selected field (else to the last section) through `addFromPalette`, tooltip with the description.
- **Tile pictures redrawn** (`KIND_ART`): drawn 1:1 at 72 × 44, one line weight, ONE control per tile. Dropdown, Multi-Select, Datetime and Dynamic are a single select box; Checkbox and Radio show one row.

## In progress
Nothing mid-flight.

## Next steps (open questions for Zeni)
- Did "fields logic same as V2" mean the panel behaviour (done), or the fields on the FORM (V2's plain fields with no card border)? V4's form side is untouched.
- The page heading is still left-aligned while the form is centred. Centre the heading too?
- Clicking "Section" in V4's panel now follows V2: with a field selected the new section starts right after that field. Keep, or always add at the end?
- An odd group leaves a blank white cell (as in the reference). Keep, or let the last tile span both columns?
- Panel width 300px: right, narrower, or three tiles per row?
- Earlier, still open: section-less fields between sections as on .185; remove leftover `showWhen` data; Requester Group Access Level; Stepper form (research first).

## Decisions made
- Mobbin had no form builder with this tile grid, so the layout follows Zeni's reference image. Freepik / Magnific were not used; the pictures are drawn in code with lucide icons.

## Gotchas
- `FormStudio.tsx` has mixed line endings: patch it with a node script that splits on char 10 and keeps each line's CR, or with single-line edits.
- The scratchpad already had an old `v4-tiles.mjs`; a Write to that name was refused and the old script ran. Use new file names.
- `ListGlyph` is now an unused import in FormStudio.tsx (harmless).
- Other sessions' uncommitted files were kept out of this commit. `versions/versions.json` was NOT touched.

---

# Handoff — 2026-11-19 11:10 (Patch: Deployment Policies V1–V3 + paused-banner V2/V4/V5/V6)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → the "Deployment Policies (Admin › Patch Management…)" bullet and the "Patch Deployment — Pause /
Resume" bullet just above it, both under Key context.

## What we worked on this session
(1) The paused-deployment banner on the Patch Deployment detail page: removed V1 and V3, kept V2 and V4, added V5
(first thing in the Overview tab) and V6 (under the search in Patch Deployment Properties). (2) A new admin module,
Deployment Policies, rebuilt from PMG's `deployment-policies.html` with three simplified create layouts (V1 | V2 | V3).

## Completed
- Banner switch reads V2 · V4 · V5 · V6 (`DeploymentPausedBanner.tsx`; `belowSearchSlot` prop added to
  `TicketPropertiesPanel`). Verified in the browser on PDR-1431.
- `#/admin/deployment-policies`: a level-3 nav row under Deployment Management, a listing of PMG's 9 policies,
  full-page Create/Edit in three layouts on a V1 | V2 | V3 pill beside the logo. Create, edit, duplicate and
  delete (with undo) work. Verified headless: all three layouts walk through, a created policy lands in the
  listing, and there are no page errors.

## In progress
Nothing mid-flight. Zeni is comparing both sets of versions.

## Next steps
- Zeni picks a paused-banner placement (V2/V4/V5/V6); then remove the switch and the others.
- Zeni and PMG pick a Deployment Policy layout (V1/V2/V3); then remove the pill.
- Open question: in V2 one postpone limit and one set of intervals are shared by all three prompts. Should they
  differ per prompt? V1 and V3 already keep them separate.
- Remote Offices and Endpoint Groups are nav rows with no screens yet.

## Decisions made
- Only ONE schedule per policy (Zeni: see PMG's file).
- The Patch Tuesday calendar grid stays visible in V1; in V2/V3 it is behind "View on calendar" (Zeni).
- The page lives in Admin, opening a full page from the listing (Zeni).
- Presets (V3) are drawn from PMG's own sample policies.

## Gotchas & notes
- `tsc` over AdminPage/Header bails on the pre-existing syntax errors in `CatalogItemDetailsModal.tsx`; typecheck
  the new files on their own (`DeploymentPolicyEditor.tsx`, `AdminDeploymentPoliciesModule.tsx`). The only
  remaining error is the known one in `ui/tooltip.tsx`.
- Another session's uncommitted work (`FormStudio.tsx`) is in the tree; do not commit it with this work.

---

# Handoff — 2026-11-19 11:07 (Compliance: stepper one-liners, Scan Now off on Compliance tab, quick filters)

## Read first
CLAUDE.md → "Compliance (Oct 2026)", its last bullet (19 Nov 2026).

## Completed (headless browser, no page errors)
- **Create Audit stepper one-liners** (`createFormSteps.ts`, `compliance-policy`): "Name the policy and pick the benchmark it checks against." · "Pick remote offices, single endpoints, or both." · "Set when the audit runs and who gets the results."
- **Scan Now disabled on the endpoint page's Compliance tab** (`ComplianceEndpointDrawer.tsx`, tab id `'policies'`); the reason is a tooltip on a wrapping span (a disabled button gets no hover). Verified disabled on that tab; re-enabling on other tabs NOT verified (test clicked a hidden sidebar "Patches" button).
- **Quick filters** (`complianceFilterAttrs.ts`): Rules = Severity · OS Platform; Compliance Audit = Status · Compliance Result · OS Platform. The score-band quick filters were removed from both; scores still filter under Filters (hidden attrs).

## In progress
Nothing mid-flight.

## Next steps (open questions for Zeni)
- "endpoint's listing → compliance tab" quick filters (Office · Execution Status · Compliance Result): which page? Recommendation = Compliance Audit detail › Endpoints tab (`CompliancePolicyDrawer`, it already has those columns and a `TabListToolbar` filter incl. `exec`). Quick-filter icons, or tabs in its Filter popup?
- Compliance v2 or a new version? This publish pushes `main` only; `versions/versions.json` was NOT re-pinned.

## Gotchas
- Other sessions' uncommitted files (Patch Deployment pause, FormStudio, deployment policies, etc.) were kept out of this commit.

---

# Handoff — 2026-11-17, night (Compliance: Create Audit schedule from .185, columns, benchmark drawer)

> Sessions share this file. This top part is the newest; older notes follow.

## Completed (headless browser, no page errors; touched files typecheck clean)
- **Endpoints for every OS version:** 13 machine families added to `FAMILIES` (compliancePolicyData.ts, appended LAST so no EP number moves) — Add Remote Offices / Add Endpoints now work for Amazon Linux 2023, Windows 11, SUSE 15, …
- **Create Audit:**
  - No section one-liners in the middle screen; the LEFT stepper keeps its step one-liners.
  - **Schedule = .185's Automatic Patch Deployment** (read live on 172.16.15.185 in Zeni's Chrome; nothing saved): Schedule Type Once · Daily · Weekly · Monthly · Interval; Start At; Time (HH : MM dropdowns); Weekly Day (MULTI-select → `weekdays`); Monthly "When should this scheduler run?" On Specific Date (Date 1–31) / On Specific Day (Occurrence First…Last + Weekday); Month (multi); Interval number + Hours/Days. `scheduleLabel` / `nextRun` understand all of it. Our on/off switch stays (.185 has none).
  - Schedule is its own WHITE bordered panel with a big switch (`ToggleSwitch size="lg"`).
  - **Publish (primary) + Save as Draft (outlined)** as two buttons, Back · Save as Draft · Publish (`secondaryBeside` on the stepped shells → `StepNav beside`). Edit = Update + Save as Draft.
  - **Notify Team = `NotifyPicker` rebuilt** after the workflow's value popup (no tabs): Selected Items chips + "+N more" side panel, search, group tree with checkboxes, Apply (N), draft until Apply.
- **Audit detail:** "Audit Properties"; Scan Details = Last Scan / Next Scan stacked; Rule Checks column removed (Endpoints AND Run History tabs).
- **View rule results:** Expand/Collapse = icon only; "Previous → Recent scan" centred over the icon column (measured). Rule result strip: "Last assessed", and an **Expected value** row (= `rule.remediationValue`) whose text starts under "Result" (two-column grid).
- **Endpoint detail › Compliance tab:** Compliance Score as the 3rd column.
- **Listing columns (technician):** Audit ID · Policy Name · Status · Last Scan Date · Compliance Score · Enable · Actions; Rules ID · Name · OS Platform · OS Version · Severity · Endpoints · Rule Score; Endpoints ID · Hostname · IP Address · OS Name · OS Version · Policies · Compliance Result · Remote Office. Everything else is in column selection via `MODULE_EXTRA_COLS` (TicketTable). Endpoint inventory columns (Architecture … Last Logged In User) are DERIVED per endpoint id (`inventoryOf` in complianceRows.tsx — sample values). Saved-column keys bumped (V4 / V3 / V3).
- **Admin › Benchmark:** Source "Default" shows as **Predefined** (`originLabel`, display only); OS Platform (not OS Type) in the listing filter, Create/Edit form (platform → version) and the Attach Rules chip; row icons Add subgroup (`ListPlus`) · Attach rules (`FilePlus2`) · Rename · Delete with INSTANT tooltips, no "(F2)" brackets; the benchmark detail is a **1080px right side drawer** with a backdrop (was full-screen with a tab bar).

## Later the same night
- Compliance Audit listing: Compliance Score now BEFORE Last Scan Date (… Status · Compliance Score · Last Scan Date · Enable · Actions); saved-columns key V5.
- Technician Rules listing default order mixes 3 rules with results, then 1 no audit has run (`ComplianceRulesPage` rows), so page one shows both Rule Scores and the unrun empty state.

## Next steps / open
- Attach rules icon (`FilePlus2`) was our pick — confirm with Zeni.
- .185 Month list has "Select All"; ours does not. .185's Retry Failed Configuration / Expires After / Deploy After Approval not added (only Schedule was asked).
- Run History lost its Rule Checks column too — confirm that was wanted.
- Unchecked-rule V1/V2: which is final?

## Gotchas
- NOT committed here (another session's Patch Deployment pause work): HardwareAssetActionsMenu.tsx, PatchDeploymentDrawer.tsx, DeploymentPausedBanner.tsx, deploymentPauseStore.ts.
- A filter attr that is NOT `hidden` also becomes a column-selection entry (assetExtraCols) — that is why MODULE_EXTRA_COLS is deduped against it.

---

# Handoff — 2026-11-17 17:48 (Form builder: section drag, status chip, admin menu closed; create pages V1 | V2 + Help guide button)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Form builder versions (16 Nov 2026, Zeni)", its last bullet (17 Nov 2026).

## What we worked on this session
Zeni's form-builder and create-page requests: the V3 add-field popup, V4 field tiles, the technician create-page pills and Help guide button, and the admin form builder's closed settings menu, section drag and status chip.

## Completed (headless browser, no page errors)
- **V3 add-field popup:** same groups as the V2 right panel, a search box, an icon before each field, no one-liners, wider gap between groups.
- **Technician create pages:** only two layouts are offered, labelled **V1** (full page, stepper left) and **V2** (side drawer). The old V1, V4 and V5 are hidden. A hidden guide shows a blue outlined **Help guide** button.
- **Admin form builder (every module):** the left settings menu starts closed. Hover the left edge to peek, or use the bottom pill to keep it open. The page is left-aligned with no left line, and the heading-to-tabs gap is smaller.
- **Sections** move by a drag grip (V2 / V3 / V4); the up / down arrows are gone.
- **Draft / Published chip** sits beside the page heading.
- **Section settings:** "Visibility" is replaced by **Requester › View** (switch) and the note "This applies to all fields of this section", as on the .185 Edit Section panel.

## In progress
Nothing mid-flight.

## Next steps (open questions for Zeni)
- On .185, fields can sit between sections; ours can only sit above the first section. Build that?
- Remove the leftover "show on a condition" (`showWhen`) data and chip from sections?
- Add Requester Group Access Level to section settings (.185 has it)?
- Stepper form in the builder: research first, not started.
- Rename "Edit / Clone Compliance Policy" to "Edit Audit" / "Clone Audit"?

## Gotchas & notes
- Section drag was tested with dispatched DragEvents, not a real mouse drag.
- `FormStudio.tsx` has MIXED line endings; patch scripts must keep each line's own ending.
- Unused after this session: `moveSection`, the `ArrowUp` / `ArrowDown` imports, and three locals in `sectionSettingsNeo`.
- The .185 server is read-only for us: open panels and Cancel, never save.

---

## (earlier) Handoff — 2026-11-17, evening (Compliance: filters = columns, Create Audit pass, rule-results polish)

> Sessions share this file. This top part is the newest; older notes follow.

## Completed (headless browser, no page errors; touched files typecheck clean)
- **Filters = columns.** Every Compliance listing (admin Rules / Benchmark, technician Rules / Benchmark / Compliance Audit / Endpoints) offers a filter only for a column it shows. OS Type became **OS Platform** (no OS Type column). Filters still used by count cards or dashboard links stay as `hidden: true` attrs. Saved views on removed fields were deleted.
- **Data:** 13 more OS versions (Debian 12, RHEL 8, Ubuntu 20.04/24.04, SUSE 15, Oracle 9, Alma 9, Rocky 9, Amazon 2023, Windows Server 2016/2025, Windows 10/11) → their rules generate automatically; **57 benchmarks, 50 of them Linux/Windows** (CIS L1 + L2 + customs). Every rule has an **Impact** line (`IMPACT_BY_CHECK`, our wording).
- **Sidebar:** Compliance flyout = Rules · Compliance Audit · Endpoints · Dashboard (disabled, last).
- **Listing:** Compliance Audit's Benchmark column wraps to 3 lines and every row reserves that height (`ColDef.wrap` now true | number → `--clamp`; height on `td.cell-wrap`). Rule Title no longer wraps.
- **Create Audit (both pills):** Name full width + Description textarea under it; OS Platform + OS Version (+ full-width Benchmark, all 50 searchable when nothing is chosen; picking one fills platform/version); a new audit starts with NO benchmark; action column pinned right in the Endpoints step; **Notify Team = `NotifyPicker`** (new, modelled on the workflow's recipient popup); Deployment Policy searchable; Edit = **Update ▾ Save as Draft**; Edit/Clone open as a **full-screen** page (`fullScreen` prop on SteppedPageShell / CreatePageShell).
- **Policy detail:** Checks → **Rule Checks**; **Scan Details** box (Last / Next Scan) above Policy Fields.
- **View rule results:** severity filters are bordered buttons; row tooltip shows each scan's date; **Expand all / Collapse all** in every RuleGroupTree header; the rule result is one slim strip (endpoint first as a blue link, Result, Previous + date); "Required" removed.
- **Technician Rules — a rule no audit has run:** V1 | V2 pill beside the logo on `#/compliance-rules` (`complianceUncheckedRuleUi.ts`, opens on V2). V1 = no Endpoints tab; V2 = Endpoints tab with an illustrated empty state (`RuleNotRunArt`).

## Next steps
- Ask Zeni which unchecked-rule version (V1 / V2) is final.
- Still open: record wording "audit"; Deployment Policy required?; Save as Draft on every V2/V3 step?
- The "Edit Compliance Policy" title still says Policy — rename to "Edit Audit"?

## Gotchas
- Not committed here (form-builder session): AdminPage, AdminFormModule, AdminRequestFormModule, FormStudio, public/tasks/tasks.json.
- New sample benchmarks/OS versions have NO endpoints, so an audit built on them can add none.

---

## (earlier) Handoff — 2026-11-17, later (Compliance: OS Type filter = Linux / Windows only)

> Sessions share this file. This top part is the newest; older notes follow.

## Completed (checked in a headless browser, no page errors)
- The OS Type filter on the Rules and Benchmark listings, admin AND technician, offers only **Linux · Windows**.
  - Admin: `FILTER_OS_TYPES` (complianceData.ts) feeds `optionsOf` in both admin modules.
  - Technician: `OS_FILTER_OPTIONS` in complianceFilterAttrs.ts (rule + benchmark attrs and quick filters).
  - The technician Benchmark saved view "Network Devices" was removed.
- Earlier today: the View rule results changes (10200f8) and the admin Benchmark Action column + History panel (8f1ceed).

## Left as is
- Router / Switch / Firewall records still exist; only the filter hides them.
- Compliance Audit (policy) and Endpoints listings keep all five OS types.
- The hidden technician Benchmark page still has its "Network Devices" summary card.

## Next steps
- Ask Zeni: point Compliance v2 in versions.json at the latest commit, or make a v3? Still unanswered.
- Still open: record wording "audit"; Deployment Policy required?; Save as Draft on every V2/V3 step?

## Gotchas
- Other sessions' uncommitted work (FormStudio, createForm*, Header, CompliancePolicyEditor, …) is NOT committed here.

---

## (earlier) Handoff — 2026-11-17 (Compliance: admin Benchmark listing gets an Action column + History panel)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Compliance (Oct 2026)", the last bullet.

## Completed (headless browser, no page errors)
- Admin › Benchmark listing: the Created By / Created Date / Updated By / Updated Date columns are removed. A new **Action** column has Duplicate · History · Edit · Delete. Edit and Delete are disabled with the reason, using the same rules as the detail page.
- **History** opens a right side panel titled "History: <name>". It has From / To date fields with a Search button, and a table of Event · Event Time · User · Change Summary, with pagination. Entries are built only from what a benchmark stores: one Create entry, plus one Update entry if the benchmark was changed later.

## Next steps
- Ask Zeni: should this go into Compliance v2 in versions.json, or into a new v3? Still unanswered; versions.json has not been touched.
- Still open from before: should record wording say "audit"; Deployment Policy required?; Save as Draft on every V2/V3 step?

## Gotchas & notes
- The History panel's Search button is the product blue, not the black in Zeni's screenshot.
- FormStudio.tsx, formRuleData.ts, AdminRequestFormModule.tsx and the CreateForm* files hold uncommitted changes from another session. They are not committed here.

---

# Handoff — 2026-11-16 17:37 (Form builder V4: clean field-tile drawings + V3 add popup)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Form builder versions (16 Nov 2026, Zeni)", its last bullet (V4 Fields tiles + V4 add popup).

## What we worked on this session
Picked up a tab that ran out of usage mid-request: Zeni found several V4 › Fields tile drawings not clean. Then gave V4's "Type / to add a field" box the same popup V3 uses.

## Completed (headless browser, no page errors, build green)
- **V4 field tiles redrawn** (`KIND_ART` in FormStudio.tsx): Rich Text Area, Dropdown, Multi-Select, Checkbox, Radio, Attachment, Section, URL, Dependent, API, Dynamic. Small glyphs are now real lucide icons through `ic()`, stroke held at 1 unit (`absoluteStrokeWidth`); `chev()` is lucide ChevronDown too.
- **V4 add popup = V3's**: `AddMenu grouped typed` — two columns, icon per field, group headings. In V4 the typed box is the search, so the popup shows a hint line instead of its own search box. Enter adds the first match in the SAME grouped order (`groupedKinds()`, shared by both). Tested: "curr" → Currency, Enter took the form 18 → 19 fields.

## In progress
Nothing mid-flight.

## Next steps
- Zeni to review the tiles and the V4 popup; dragging a tile onto the form is still not browser-tested.

## Decisions made
- No second search box in V4's popup — the "Type / to add a field" box already filters.

## Gotchas & notes
- Lucide icons can be nested inside an SVG drawing (`x`/`y`/`size` props); `absoluteStrokeWidth` keeps their stroke in the outer drawing's units.
- This publish also carries other tabs' uncommitted work in the shared tree (create forms, form builder settings, compliance edits).

---

## (earlier) Handoff — 2026-11-16 (Compliance: module renamed Compliance Audit, label + subtext trims)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Compliance (Oct 2026)", the last bullet.

## Completed (headless browser, no page errors)
- Policy listing: the column set is saved under a new key (`COL_KEY_VERSION` in TicketTable), so the Enable and Compliance Result columns show even in a browser that had saved the old columns.
- Create Policy: the "runs only when someone presses Run Now" line is removed, and so is the Schedule & Notifications one-liner (V2/V3 step sub too).
- Policy detail: the score is labelled **Compliance Score** in the header, the Endpoints-tab card and the table column.
- View rule results: the Error card has no subtext.
- Endpoint page: the tab "Compliance Audit" is renamed **Compliance** (other tabs stay — Zeni's choice).
- Rule drawer, Endpoints tab: no subtext on the Rule Score card, and no "N of N endpoints" beside the search.
- The module is renamed **Compliance Audit**: sidebar flyout, page title, "All Compliance Audits" view, and the dashboard hint. The route is still `#/compliance-policies`.

## Next steps
- Ask Zeni: should RECORD wording (Create Policy, Policy Name, Policy Properties, the "… Policies" views, the guide) also say "audit"?
- Ask Zeni whether Compliance v2 in versions.json should move to this publish.
- Still open from before: Deployment Policy required?; Save as Draft on every V2/V3 step?

## Gotchas & notes
- A listing whose DEFAULT columns change needs its key bumped in `COL_KEY_VERSION`, or saved browsers never see the new columns.
- FormStudio.tsx / formRuleData.ts / AdminRequestFormModule.tsx hold uncommitted changes from another session — not committed here.

---

## (earlier) Handoff — 2026-11-12, evening (Compliance polish: bulk actions, severity sort, admin columns, Compliance Management)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md, "Compliance (Oct 2026)", its last bullet.

## Completed (headless browser, no page errors)
- **Admin › Compliance Management** (renamed from Compliance Settings). The slugs are unchanged.
- **Admin Rules listing:** Rule ID · Title · Severity (dot) · Profile · Assessment · OS Platform · OS Version, which is the technician columns minus Endpoints and Rule Score.
- **Admin Benchmark listing:** Created By · Created Date · Updated By · Updated Date as four columns, with the dates at 200px.
- **Benchmark detail:** the facts line has "Created <date time> by <name>".
- **Policy listing:** bulk bar with Enable · Disable · Cancel Policy · Archive.
  - The bar is `AssetRegisterPage bulkActions`, opt-in.
  - Only Disable was clicked in the browser test; Enable, Cancel Policy and Archive are wired but not tested.
- **Create Policy:** Deployment Policy (optional) beside Notify Team, using `DEPLOYMENT_POLICIES_185`, stored as `policy.deploymentPolicy`.
- **Policy Endpoints tab:**
  - Result = Compliant / Non-Compliant / Not Assessed (`outcomeLabel`).
  - The Endpoint column is 210px and IP Address 120px.
  - The KPI card is now "Compliance".
- **View rule results:**
  - Cards: Compliance · Passed · Failed · Error. Error is the old "New Failures" count.
  - "Failing Rules" removed from the subtext.
  - Under the cards, one line: "Failed Rules by Severity" with Critical/High/Medium/Low toggles 1px apart, and a 240px search on the right.
  - Clicking a severity sorts that severity first within each group and opens all groups (`sortSeverity` on `RuleGroupTree`).
  - No severity tag on the rule rows.
- **A rule's result page:**
  - Result · Previous Result · Previous Scan Date (no Recent Scan).
  - The endpoint ID and host name are the link; "Open endpoint" is removed.
  - The facts row wraps instead of collapsing into "+N" (`HeaderKpiRow wrap`).

## Next steps
- Ask Zeni whether this publish goes into Compliance v2 (versions.json was not touched this time).
- Should Deployment Policy be required? Should it show in Policy Properties?
- The policy header still says "Not Scanned" for a never-run policy (only the Endpoints tab says Not Assessed).

## Gotchas & notes
- A bare <button> renders at 16px in this app — give text buttons an explicit text-[Npx].
- Playwright: to open a policy, click the row by position; clicking the name text gets intercepted.

---

## (earlier) Handoff — 2026-11-12, later (Create Policy V1–V5, V3 guide, Execution Status, views; first publish of the create-form + Form Studio work)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
In CLAUDE.md:
- "Compliance (Oct 2026)", its last bullet.
- "Create forms V1–V5 + Form Studio (published 12 Nov 2026)".

## What we worked on this session
- Create Policy now has the five create-page layouts.
- The V3 guide moved up to the drawer's top edge on every V3 create page.
- Publish ▾ Save as Draft is now a single split CTA.
- New Execution Status column on the policy Endpoints tab, and new policy views.
- The rule drawer header is now Rule ID + title; the "Previous → Recent" wording changed.
- First publish of the create-form V1–V5 work and Form Studio, which had been uncommitted. Zeni chose "publish everything".

## Completed (headless browser, no page errors)
- **Create Policy:**
  - V1–V5 switch beside the logo, set via `setExtraCreateOpen`.
  - All five layouts render with the Compliance Policy Guide.
  - The Schedule toggle ends at Notify Team's right edge, measured equal.
  - Save as Draft lands as Status Draft (checked with CP-116).
- **V3 shell (`SteppedDrawerShell`, shared):** the guide is full height from the top edge; ✕ in its corner; the footer spans both columns.
- **`SplitCta` (CreateFormKit):** the face runs the chosen option; the arrow switches the face. It can be used by `CreatePageShell split`, the stepped shells' `split` (last step only) and `SummaryAside split`. Only Create Policy uses it.
- **Policy Endpoints tab:** Execution Status column plus a filter, made up in `execStatusOf` (CompliancePolicyDrawer).
- **Views:** All · In Progress · Draft · Cancelled · Archived · Non-Compliant Policies.
- **Rule drawer header** (both sides):
  - First row: RUL pill + title.
  - Facts: Profile · Assessment · OS Platform · OS Version · Severity.
  - The severity bar and the position number are removed.

## In progress
Nothing mid-flight.

## Next steps
- Ask whether Save as Draft should be reachable from every step in V2/V3. Today the split CTA shows only on the last step.
- Ask whether the rule header should show a literal "-" between the Rule ID and the title.
- Check the V3 guide move on a module other than Create Policy, e.g. Create Patch. It was only measured on Create Policy.

## Decisions made
- Policy row `status` = the run status, from `runStatusOf`.
  - A `draft` flag forces Draft.
  - `cancelled` is set by cancel() and cleared by run().
- The create-form + Form Studio work was published together with Compliance, because Header.tsx ties them together.
- Compliance v2 in versions.json now points at this publish.

## Gotchas & notes
- `tsc` aborts on CatalogItemDetailsModal.tsx (TS1127, pre-existing), so a typecheck of files that import it proves nothing. Verify in the browser with a `pageerror` listener.
- Git Bash heredocs choke on some backtick/quote mixes. Write scripts with the Write tool and run them with node.

---

## (earlier today) Handoff — 2026-11-12 (Compliance: listing columns, rule facts, policy Status / Result)

> Sessions share this file. This top part is the newest; older notes follow.

## Read first
CLAUDE.md → "Compliance (Oct 2026)", especially the "Compliance pass, 3 Nov + 12 Nov 2026" bullet at its end.

## What we worked on this session
Compliance column changes on both sides, plus the side drawers matching the columns, and the policy listing rebuilt with a run Status and a Compliance Result.

## Completed (verified in a headless browser, no page errors)
- Technician Rules listing: Rule ID (RUL-n) is the blue ID pill and opens the rule; Severity column after the Title.
- Admin Rules listing: Severity column (SeverityPill) after CIS ID - Rule Title.
- Rule side drawer (both sides): facts line = Severity · Profile · Assessment · OS Platform · OS Version (no OS Type / Platform).
- Policy listing columns: ID · Policy Name · OS Platform · Benchmark · Endpoints · Compliance Score · Compliance Result · Status · Last Scan Date · Enable · Tags · Created Date · Created By · Updated Date · Updated By · Actions.
  - Status = Draft / In Progress / Completed / Cancelled (`runStatusOf`); Compliance Result = Compliant / Non-Compliant (`resultOf`).
  - Schedule action removed from the row (`{false && …}` in TicketTable); Enable switch column back.
- Policy detail page: "Platform" reads "OS Platform" (header + properties).

## In progress
Nothing mid-flight.

## Next steps
- ASK Zeni whether this goes into Compliance v2 or a new version. The live site has it, but `versions/versions.json` still pins Compliance v2 at 7178a6c.
- Test that Cancel scan turns the Status to Cancelled.
- Seed data: every scanned policy is Non-Compliant; there are no Compliant rows. Ask whether to add one.
- Still uncommitted (not this session): Form Studio and the create-form V1–V5 work (waiting on a version answer), and CompliancePolicyEditor.tsx (someone else's change).

## Decisions made
- Policy row `status` is now the RUN status; the compliance outcome moved to `x_cpResult`. The detail page's Status chip still shows the compliance outcome (`statusOf`).
- `cancelled` flag on CompliancePolicy: set by cancel(), cleared when a scan starts.

## Gotchas & notes
- `platformOf()` returns `{platform, version}`, not a string.
- `x_tags` must be an ARRAY for the grid's Tags cell (a joined string crashes `.map`).

---

## (previous) Handoff — 2026-10-29 12:10 (Compliance: rule details, rule groups, View rule results)

> Sessions share this file. This top part is the newest (Compliance); older Form Rules / Compliance notes follow.

## Read first
CLAUDE.md → "## Compliance (Oct 2026)", last bullet "Compliance pass, 28–29 Oct 2026". Versioning rule:
ASK Zeni "save into Compliance v2 or make a new version?" before changing `versions/versions.json`.

## What we worked on this session
A long run of Zeni's Compliance UI requests on both the admin and technician sides: the policy form, the
benchmark rule-group builder, rule details, the detail-page headers and the View rule results sidebar.

## Completed
- Column-filter search in four drawers; Target Endpoints two-box layout + office Preview; Notify Team half width.
- MITRE tab shows names only from export data; Summary tab = Description · Rationale · Impact · References.
- Rule rows: no arrow anywhere, dotted underline on hover.
- Create Benchmark: no Profile field (derived on save); Attach Rules = Severity + Profile filters, no Section.
- V2 rule-group builder is the only one; no root bar; Add rule group; sibling drag with grips; alignment fixes.
- Policy page: Endpoints filter Office + Agent; Rules search only; Run History date filter (shared DateRangeFilter).
- Endpoint page Compliance Audit: 3 status cards, no filter. Rules page: Policies column = count.
- Schedule switch replaces Manual / Scheduled. OS Type / OS Version wording everywhere.
- View rule results: tooltips on rule icons and group icons, tinted main groups, header line as label | value,
  Average Compliance card, primary Export button, first-scan dashed icon.
- Header alignment + 3px title-to-facts gap on all Compliance detail pages.

## In progress
Published to `main` on 29 Oct; `versions/versions.json` NOT updated — Compliance v2 still points at `a51c8f6`
until Zeni says whether this goes into v2 or a new version.

## Next steps
- Ask Zeni: v2 or new version → update `versions/versions.json` (commit + `changes` line), push, verify the
  `/versions/compliance/v2/` (or v3) link returns 200.
- Open questions to Zeni: Impact text (wait for CIS export vs sample); keep "Add group inside" in the
  right-click menu; Policy › Endpoints keep Office/Agent filters; admin Benchmark detail read-only arrow.

## Decisions made
- No invented data: MITRE names and Impact come only from the CIS export.
- Group drag moves among siblings only; 7 levels kept.
- `HeaderKpiRow` got an optional `gap`; only Compliance passes 3px, so other modules are unchanged.

## Gotchas & notes
- Git Bash mangles node -e scripts containing backticks / `${}` — use the Edit tool or a script file.
- Headless Playwright can't finish downward HTML5 drags; verify drops with dispatched DragEvents.
- `HeaderKpiRow` renders a hidden measuring copy, so its innerText appears twice in probes.

---

# Handoff — 2026-10-27 (Form Rules: product wording, play icon, guide video openings)

> Sessions share this file. This top part is the newest (Form Rules session); the Compliance notes follow.

## Read first
CLAUDE.md › "Form Rules — the product's own words, the play icon, and Check conflicts on the right".

## Completed (published with this handoff)
- Rule editor labels = the product's: Name* · Tags (now OPTIONAL) · Description · Rule Event* ·
  Rule Execution On* · Rule Applicable For*; dropdowns show product values; 'Everyone' renamed 'All Users'.
- V2 guide video's form copies the real editor (labels, values, Condition group 1 box, row icons); the
  slide SVG/GIF downloads follow automatically.
- Illustrations page: Icons section — the play icon flattened to ONE path (pixel-identical to lucide),
  SVG / PNG / PNG @2x at 16 / 24 / 48 px + Copy path; the Watch video card uses the same path.
- V2 listing: Check conflicts sits on the right beside Create Rule.
- Guide video: first landing (create or edit) opens it small bottom-right, once; Watch video opens it
  full size centred; shrinking drops it to the bottom right.

## Next steps
- `formRuleHelpContent.ts` (global help guide) still describes an option called "Everyone".
- The video's "Create, edit or both" placeholder runs slightly into its chevron (shows only briefly).
- Check conflicts is still mocked (700ms + local engine).

---

# Handoff — 2026-10-27 evening (Compliance follow-ups after the 17:22 publish)

> Sessions share this file. This top part is the newest; the 17:22 section below still holds for the rest.

## Completed since 85c5a0f
- Admin Benchmark listing: Profile + Policies columns removed; technician Benchmark listing: Profile removed.
- Both Benchmark detail pages: Profile + Policies removed from the line under the title.
- Tags removed from the Endpoint page properties and the Select Endpoints picker.
- Policy › Rules tab: a rule opens its details only (no endpoints / Passed On cards).
- Create Policy: Run = Manual | Scheduled; Endpoints = Remote Offices AND individual endpoints together
  (union, "Added By" column); policy properties show Remote Offices / Endpoints Added.
- Change log of the whole afternoon: https://claude.ai/artifact/5jG8RfrhpAmc6zhktGpWsn (private).

## Next steps
- Same as the 17:22 section (severity container design, sharing admin benchmarks with the technician side,
  confirm the Manual rules list).
- The technician Endpoints listing still offers a Profile filter on the Benchmark page's filter builder — ask.

---

# Handoff — 2026-10-27 17:22 (Compliance: detail pages without Overview, admin rule V2, benchmark rule-group tree)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "## Compliance (Oct 2026)", last bullet ("Compliance pass, 27 Oct 2026 (later)").

## What we worked on this session
A long Compliance polish pass with Zeni: listings trimmed, Overview tabs removed, rule results moved into a
per-endpoint sidebar, the admin rule detail got a one-page V2, and the admin Benchmark form's rule groups were
rebuilt to match the live ObserveOps create-benchmark flow.

## Completed
- Listings: Benchmark / Policy / Endpoints columns trimmed; policy Status carries the score; schedule icon.
- Policy page: Endpoints first (Average Compliance card, outlined "View rule results"), plain Rules tree, no
  Run History cards, properties de-duplicated, header Compliance coloured like the card.
- Benchmark page: Rules first, plain tree, status cards on Policies, no Compliance anywhere.
- Endpoint page: Policies + Audit Trail only; breakdown sidebar headed by the policy.
- Rule results sidebar: no "Failed Rules by Severity" box (hidden until Zeni designs a new container).
- Demo data: no fail → fail; Tag device filter removed (seed tag policies → Endpoint).
- Admin Rules: Automated/Manual field, detail chips, V1 | V2 switch, V2 one-page layout.
- Admin Benchmark: Origin tag, live Policies count, chips header, L1 / L2 / L1+L2 profile, new form layout,
  recursive 7-level rule-group tree with open/closed ⊕ logic and hover actions.
- Every step verified in the browser (localhost:5201, headless playwright-core), typecheck clean.

## In progress
Nothing mid-flight.

## Next steps
- Zeni to design a new container for severity in the rule-results sidebar (`FailedBySeverity` still exported).
- Admin benchmarks are still not shared with the technician side (technician reads `BENCHMARKS_SEED`), so
  deep (3+ level) groups never reach `RuleGroupTree` there yet.
- Only 3 rules are Manual (`MANUAL_CHECKS`) — confirm the list.
- Earlier open questions still stand (panel widths, posture words, 85% target, exception approvals).

## Decisions made
- Compliance % only on the Policy page (header, Endpoints tab, Run History).
- Rule groups: copy live behaviour, but keep Delete on a parent group (with a confirm) and cap at 7 levels.
- V2 rule detail is admin-only; technician panels stay tabbed.
- Did NOT create a /versions link (the versions question went unanswered — ask before freezing one).

## Gotchas & notes
- Git Bash heredocs strip backslashes — write patch/test scripts with the Write tool (bit us several times).
- The live ObserveOps reference is at 172.16.12.100 (ask Zeni for the login; it is not stored here).
- `AssetStatsRow.tsx` is CRLF; edit it with the Edit tool.

---

# Handoff — 2026-10-27 11:49 (Compliance: Run History tab, tags removed, OS Type in policy form)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "## Compliance (Oct 2026)", last two bullets ("Run History" and "No tags").

## What we worked on this session
Added a Run History tab to the Compliance Policy detail page, removed tags from Rules, Benchmarks and
Policies, and added a required OS Type field to the Create Policy form.

## Completed
- Policy page tabs: Overview · Endpoints · Rules · **Run History** · Audit Trail. `runHistory(p)` in
  `compliancePolicyData.ts` (real last scan first, Run Now runs from this session, then 6 generated earlier
  runs one schedule interval apart; a Running row while scanning). Cards Runs / Scheduled / Run Now /
  Average Compliance; table Run ID · Last Scan · Triggered By · Duration · Endpoints · Checks · Compliance · Status.
- Tags gone from: Rules listing (column + filter), rule detail panel (Tags tab), Benchmark listing (column +
  filter), benchmark detail, Attach Rules picker, Create Benchmark form (now Name · Type · Version /
  Description ×2 · Profile), technician Benchmark page + drawer, policy form, Policy Properties, policy
  listing filter/search. `tags` removed from the Rule, Benchmark and CompliancePolicy types and seeds.
- Create Policy: Policy Details = Name + Description (full width). Benchmark section = **OS Type**
  (required, Linux · Windows · Router · Switch · Firewall, with benchmark counts) beside Benchmark, which
  lists only that type and is disabled until OS Type is chosen. Replaced "Benchmark Filter by Tags".
- Verified in the browser (localhost:5201): headers, tabs, both forms, no page errors.

## In progress
Nothing mid-flight.

## Next steps
- Same open questions as the previous session (panel width, pills under rule titles, posture words,
  85% target, exception approval screen, sharing admin benchmarks with the technician side).
- Older Run History rows are generated demo data — confirm with Zeni whether that is enough.

## Decisions made
- Zeni: remove tags from Rules + Benchmarks + Policies. ENDPOINT (device) tags stay — the policy form's
  "Tag" device filter still picks endpoints by machine tag.
- Zeni: OS Type filters the Benchmark list and replaces the tag filter.
- OS Type is NOT stored on the policy — it is read from the chosen benchmark. A new policy still opens on
  the first benchmark, so OS Type starts as Linux. Changing OS Type clears the benchmark and endpoints (toast).

## Gotchas & notes
- Patch scripts: `patch-notags.mjs`, `patch-runs.mjs`, `patch-runtab.mjs` in the session scratchpad.
- Some compliance files are LF, others CRLF — scripts keep each file's own line endings.

---

# Handoff — 2026-10-26 (Compliance: linked detail pages, numbering, exceptions, clickable dashboard)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "## Compliance (Oct 2026)", last bullet "Technician flow rebuilt as linked detail pages".

## What we worked on this session
Researched CIS compliance (deep-research run, PDF + two shareable pages), pitched a technician flow,
then rebuilt the technician side of Compliance as linked detail pages with Zeni, step by step.

## Completed
- Research: `C:\Users\Zeni Chakalasiya\Downloads\Compliance-Module-Research.pdf`; pitch page
  https://claude.ai/artifact/QsPzQacsSjG7icAjp8DASo (`docs/compliance/technician-flow.html`); explainer with
  every rule field explained https://claude.ai/artifact/4gv81TJJ6U1rpoUsRe27Qp (old link …KFGicK… not reachable
  from this account). Chrome copies in Downloads.
- Hierarchy numbering (1 · 1.1 · 1.3.1) from the benchmark's groups on every page.
- Policy page: Overview · Endpoints · Rules (grouped) · Audit Trail.
- Endpoint page (new) + endpoint × policy page + Policies side drawer.
- Benchmark detail page (new): Overview · Rules · Endpoints · Policies.
- Rule side panel: in-place drill, no breadcrumb, no Results tab, no Summary metadata grid; Request
  exception form (demo store).
- Dashboard: every KPI / slice / bar / row clicks through, pre-filtered.

## In progress
Nothing mid-flight. Dev server for this work ran on http://localhost:5201 (5200 was held by a hung process).

## Next steps
- Zeni to decide: side-panel width (920 vs Patch's 820px); pills under rule titles (and in the admin rule
  panel); Observed value / First seen on the result card (needs mock data); posture words (Secure…
  Vulnerable vs Compliant / Non-Compliant); 85% target as a tenant setting.
- Admin approval screen for exception requests; other actions (Deploy fix, Create change, Create task)
  were offered and NOT chosen yet.
- Admin benchmarks are still not shared with the technician side (BENCHMARKS_SEED).

## Decisions made
- Endpoint opens a full detail page everywhere; a rule opens the side panel. From a policy, an endpoint
  opens the endpoint × policy page; from the Endpoint page's Policies tab, a side drawer.
- In a policy's rule panel an endpoint opens its result in place (no page change).
- Every detail page has an Overview tab first; the policy's report moved into it.
- Only "Request exception" for now, on a single endpoint's Fail result, in the same panel.
- Use only product / CIS words; reuse product components; ask before new components.

## Gotchas & notes
- PowerShell's `R` is an alias (Invoke-History) — patch scripts are Node files in the scratchpad.
- Bare `<button>` doesn't inherit font size; give breadcrumb/link buttons `text-[12px]`.
- Headless test gotchas: navigating to the same hash doesn't reload (go via about:blank); charts below
  the fold need scrollIntoView before clicking the canvas.

---

# Handoff — 2026-10-26 (Form Rules: V1 | V2 switch, Check conflicts CTA, new guide video)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "Request Form V1 | V2" bullet under Request Form Management.

## Completed
- **V1 | V2 pill beside the logo** on Request Form pages (`formRuleRelease.ts`, `Header.tsx`), opens on V2.
- **V2 listing** (`AdminRequestFormModule.tsx`): no conflict tags on load; **Check conflicts** shortlists
  + tags the rules with conflicts (13 of 20 in the demo data); ✕ on the chip shows all again.
- **V2 guide video** (`FormRuleGuide.tsx`): bottom right of the screen over the Help guide; builder
  beside a Help guide skeleton; Similar card after trigger + condition, Conflicts card after the
  clashing action; 6 chapters, Similar / Conflicts only ring their card.
- **V2 Help guide** (`FormRuleHelpCard.tsx`, `FormRuleEditor.tsx`): Watch video card first, no foot
  link, no "All clear" card. V1 keeps all of the old behaviour (`FormRuleGuideV1.tsx` = frozen copy).
- Verified in a browser (Playwright): both versions, no page errors. Published with this handoff.
- Later the same day (published with this /tatago): V2 listing lost its **All** filter button; the
  **Check conflicts** CTA is calm (white, soft red border, bare red warning icon — the filled badge and
  pulsing dot were rejected as too critical); the video carries Zeni's FINAL chapter copy (Set Up the
  Rule · Add Conditions · Choose Actions · Review Similar Rules · Resolve Conflicts · Save the Rule; Next
  uses these titles; the text box is as tall as the longest text so the buttons never move); the video
  frame's bottom gap now equals its top gap.
- **Guide video slides** on the illustrations page (`#/admin/request-form-rules/illustrations`): one
  card per chapter — animated SVG (plays in an <img>, loops, Inter embedded, ~100–120 KB / ~16 KB
  gzipped) + 640×360 GIF (~0.8 MB) + Copy SVG, built by `formRuleGuideExport.tsx` from the video's own
  timeline. New dependency: `gifenc`.

## Next steps
- Check conflicts is mocked (700ms delay, then the local engine); wire to the backend call later.
- The purple "You" cursor tag dips slightly past the bottom edge when it clicks the last action row —
  tuck it inside if Zeni wants.

## Decisions made
- Animated SVG (not GIF) is the recommended format for the product; GIF is the fallback. Files are
  animation only — title, text, dots and buttons stay real UI. Every slide loops forever.

## Gotchas & notes
- Keyframe percentages in the slide SVG need 4 decimals and a 1 ms step, or two stops merge.
- Running a Playwright script while the shell's cwd is `src/app/components` writes its screenshots
  there — keep cwd in the scratchpad.

---

# Handoff — 2026-10-23 18:14 (Form Rules: Show Rules, Similar rules sidebar, deploy fix)

## Read first
CLAUDE.md › the two Form Builder bullets (the 23 Oct "Show Rules replaces Create Rule" note) and the
"Similar rules sidebar — common strip + conflicts-style detail" bullet under Request Form Management.

## What we worked on this session
Picked up the Form Rule session (359d166d, which hit its usage limit) and finished its last ask, then
reworked the Similar rules sidebar in the rule editor. Also found and fixed why the live site had
stopped deploying.

## Completed
- **Form Builder** (`AdminFormBuilder.tsx`, `FormFieldRulesPanel.tsx`): 8px field gaps, no "N Rules"
  pills, a **Show Rules** hover tab on fields a rule uses, opening a read-only Rules on <field> sidebar
  (no Create New Rule / Reuse Rule). Pushed as f82c9d2.
- **Deploy fix**: every Pages build since 4b86a36 failed because `src/app/components/workflow/` was
  imported by AdminPage but never committed. Committed it as dc91134; the site deploys again.
- **Similar rules sidebar** (`FormRuleCommon.tsx`, `FormRuleRelatedView.tsx`): "Common trigger &
  conditions" is a flat strip without the actions row, 16px between trigger and conditions. Pushed as
  2b3c39a. Then the rule detail became ONE grey "Actions" panel with ONE white box of 13px points,
  matching actions first with a green check + "Matches yours" tag (published with this handoff).

## In progress
Nothing mid-flight.

## Next steps
- Zeni to confirm what "left card will have actions which matches current rule" meant: matches first
  in the white box (built), matches listed under each rule name in the left list, or a two-column box.
- Demo data has no similar rule whose actions match the current rule's, so the green "Matches yours"
  state is unseen; seed one if Zeni wants to see it.
- Form Builder: the 40px hover toolbar now overlaps the field above it (8px row gap). Option: sit it
  just inside the tile's top edge. `FieldConfigurePanel` is unreachable dead code: keep or delete.
- Older Form Rule open questions: is Type (Custom/System) editable; AI Accessible tooltip wording;
  Hint Text = placeholder and Description = line under the field?; remove "Open the full guide" from
  hidden V1/V4 guides too?
- The `push` skill (`.claude/skills/push`) still names Ronak's upstream repo and `git add -A`; update it.

## Decisions made
- Commit only Form Rule files + CLAUDE.md/HANDOFF.md, never other sessions' work (Form Rule session rule).
- Similar rules detail mirrors the conflicts sidebar's panel shape so the two read as one.

## Gotchas & notes
- Other tabs' transcripts can live in `~/.claude/projects/d--Motadata-…` (the OTHER profile), not
  `~/.claude-pro`. Extract user messages only; transcripts reach 200 MB.
- A local build passing does not mean CI passes: an untracked file that a committed file imports
  breaks only the CI build. Check with a "tracked file imports untracked file" scan before pushing.
- When another session leaves the dev server broken, verify in a throwaway `git worktree` with a
  node_modules JUNCTION on another port. Remove the junction with `cmd /c rmdir`, never Remove-Item.
- Git Bash strips backslashes inside heredocs and sed: write probe scripts with the Write tool.
- ⚠️ **Never run `git worktree remove --force` on a worktree holding a node_modules junction**: git follows the junction and deletes the REAL node_modules. It happened this session; fixed by moving the damaged folder aside and running `pnpm install --frozen-lockfile` (2 min). If the dev server on 5200 acts oddly, restart it.

---

# Handoff — 2026-10-23 15:55 (Compliance research + technician side split into four pages)

> Sessions share this file. **This top part is the newest session**; older notes follow unchanged
> below the dividers.

## Read first
CLAUDE.md › "## Compliance (Oct 2026)", especially the new last bullet "Technician side split into
four pages". It replaces the Compliance Visualization notes above it.

## What we worked on this session
Finished the Compliance deep research (the run in the other tab paused at the usage limit), turned it
into two shareable pages, then restructured the technician side of the Compliance module.

## Completed
- **Research brief** (white page): https://claude.ai/artifact/PhNgU1vE5Z7zXciJNmQ42h — source
  `docs/compliance/research-brief.html`, plus `docs/compliance/RESEARCH.md`. Built from the paused
  `deep-research` run's journal (22 sources, 97 claims, 60 of 75 votes). A Claude Docs copy also exists
  (https://claude.ai/artifact/Mj1Tpu6KdJ69cksr6TBZLv) but did not open for Zeni.
- **Plain-language explainer with diagrams**: https://claude.ai/artifact/KFGicKQMCoVj53oqw9kZHF —
  source `docs/compliance/compliance-explained.html` (what CIS is, rules, benchmarks, policies, why
  ITSM needs it, the flow, a worked example, glossary, 30-second script).
- **Compliance flyout = Dashboard · Benchmark · Compliance Policy · Endpoints** (new pages
  `ComplianceDashboardPage`, `ComplianceBenchmarksPage`, `ComplianceEndpointsPage`, shared rows in
  `complianceRows.tsx`). Compliance Visualization deleted; its Policies tab removed and its tiles moved
  into the Compliance Policy listing as a Tiles layout. Old links redirect to the dashboard.
- Checked headless on localhost:5200: all four pages load, benchmark → rules panel → rule results,
  Tiles view, endpoint panel, no page errors. Typecheck clean, build passes.

## In progress
Nothing mid-flight. UPDATE: the `deep-research` workflow (run `wf_62bd5de5-144`) has since FINISHED
(104/104 agents): 22 claims confirmed, 3 refuted. Its report is also a PDF at
`C:\Users\Zeni Chakalasiya\Downloads\Compliance-Module-Research.pdf`. It adds nothing that contradicts
the research brief; Intune, NinjaOne, CIS-CAT, Ivanti, SolarWinds NCM, Kaseya and Automox are still
unverified.

## Next steps
- Zeni said "then we will renew the full flow on technician side": the research's recommendations
  (results states, remediation doors Create Change / Deploy fix / Assign task, exceptions with
  approval and expiry, drift, evidence export) are the candidate next work.
- Confirm the posture bands and 85% target (still open from before).

## Decisions made
- Flyout order Dashboard · Benchmark · Compliance Policy · Endpoints (reads like the flow).
- Technician Benchmark page = benchmark list → its rules with results (admin keeps editing rights).
- Compliance Policy listing keeps List & KPI as default; Tiles is an option.
- Endpoint row opens the existing compliance side panel, not the full Endpoint drawer.

## Gotchas & notes
- `FormRuleRelatedView.tsx` is modified by another session and was deliberately NOT committed here.
- Heredocs in this Bash strip backslashes — write probe scripts with the Write tool.
- A row click in the shared register must land on a cell (e.g. the name cell), not the row edge.

---

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
