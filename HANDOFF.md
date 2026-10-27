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
