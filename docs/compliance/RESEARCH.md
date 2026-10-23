# Security Configuration Compliance — research brief for the designer

*Written 23 Oct 2026 from the `deep-research` run Zeni started in the Compliance session
(`wf_62bd5de5-144`). The run finished Scope, Search, Fetch and most of Verify, then died with its
tab before Synthesize. This document is that missing synthesis, written from the run's own journal:
5 search angles, 22 fetched sources, 97 extracted claims, 60 of 75 verification votes.*

*How to read confidence: **[verified]** = three independent votes found the source supports it;
**[refuted]** = the votes found the claim wrong (the corrected version is given); **[unverified]** =
extracted from a source but its votes never ran; **[inference]** = our reading, not a source's.*

---

## 1. The short version

1. **A CIS rule is a documented recommendation with a fixed set of fields**: Title, Assessment Status
   (Automated / Manual), Profile Applicability (Level 1 / Level 2), Description, Rationale, Impact,
   Audit Procedure, Remediation Procedure, Default Value, References. That list IS the rule-detail
   panel. [verified, S13]
2. **Tags are not the rule's identity, and neither is the CIS number.** CIS says there is no standard
   numbering convention, a number only means something inside one benchmark version, and a number
   can be reused after a check is deprecated [S1]. SCAP content gives each rule its own stable rule ID
   and attaches the CIS number as a reference that applies to ONE product version [verified, S12].
   The module needs an internal rule ID per OS version, with the CIS number and tags as metadata.
3. **A benchmark is one product at one version with its own version number** (e.g. "Ubuntu 22.04
   v2.0.0"). CIS has no fixed release cadence; releases follow the community and the vendor's own
   schedule [verified, S4]. Every scan result should be stamped with the benchmark version it ran
   against [S8].
4. **Level 2 is a superset of Level 1.** L1 = safe to apply broadly, L2 = defence-in-depth that may
   hurt usability. A STIG profile has replaced the old Level 3 [verified, S4, S14].
5. **Every competitor runs the same loop**: content catalogue → policy/benchmark → targets →
   scheduled assessment → per-endpoint × per-rule results and a compliance % → remediation →
   re-assess → exceptions with an owner, a reason and an expiry. Our module has the first four
   stages; the last four are the gap.
6. **Exceptions are a first-class record, not a note.** Every mature product scopes an exception to a
   rule × host set, requires a written reason, routes it through approval, gives it an expiry, keeps
   the raw result untouched and shows the override in audit output [verified, S9, S10, S11, S16].
7. **Remediation lands in ITSM as grouped work**, not one ticket per failed check: ServiceNow groups
   failed results into Remediation Tasks and raises a Change from a task [verified, S19, S20].
   Tanium closes the loop by pushing CIS remediation keyed to the same control IDs, then
   re-assessing [verified, S17]. ServiceOps already has Patch, Package and Change — the join is the
   design opportunity.

---

## 2. Domain knowledge, explained PM-to-designer

### 2.1 What a CIS Benchmark is
A consensus document, built in the community CIS WorkBench, that targets **one product at one
version** and groups its recommendations into sections (domains). Example: the z/OS V2R5 benchmark
v1.1.0 has 219 recommendations across 9 domains [verified, S13]. Benchmarks are published once the
community agrees and keep being maintained afterwards; new and updated benchmarks are announced by
monthly email [verified, S4]. The Windows benchmark for a release covers all earlier builds of it, so
there is no guide per build [S4].

**Licensing matters for the product.** The free benchmarks are PDFs; the machine-readable XCCDF
(the format automated checks come from) is for CIS SecureSuite members only [verified, S4]. In every
competitor the vendor owns that licence and ships "CIS-derived" content, updated on the vendor's
schedule — ManageEngine syncs content to the server every day at 1 AM [S15]. So in our module the
admin **curates** rule content; they do not author it.

### 2.2 Anatomy of one recommendation (the rule-detail panel)
| Field | What it answers for the reader |
|---|---|
| Title | The intended configuration, in one line |
| Assessment Status | Can a scanner check this (Automated) or must a human (Manual)? [verified] |
| Profile Applicability | Level 1 (everyone) or Level 2 (special security needs) [verified] |
| Description | What the setting is |
| Rationale | Why it matters — the threat it closes |
| Impact | What breaks or changes if you apply it |
| Audit Procedure | How to check compliance, step by step |
| Remediation Procedure | How to fix it, step by step |
| Default Value | What the setting is out of the box |
| References | Links; also framework mappings (CIS Controls, NIST 800-53, PCI DSS, STIG) |

SCAP content adds a **severity** from a fixed set (unknown / info / low / medium / high), a plain
description "for non-experts" beside the rationale, and a per-rule idempotent remediation script
[verified, S12]. ManageEngine's rule row shows setting, default, accepted range, recommended value,
rationale, and a "How to Fix" column [S15]. **Design takeaway:** a rule's detail should read in this
order — what, why, what it costs, how to check, how to fix — with severity and profile as badges.

### 2.3 Profiles (Level 1 / Level 2 / STIG)
Level 1 "can typically be implemented promptly and without significant performance impact";
Level 2 is "defense in depth" and "may have an adverse effect on usability or business operations if
applied without due care"; the STIG profile replaces the former Level 3 and holds STIG-specific
recommendations [verified, S4, S14]. ManageEngine builds its policy templates from OS × profile level
[S16]. In SCAP terms a profile is a selection of rules (rules are unselected by default, one rule can
belong to many profiles, and a profile can override a rule's severity) [verified, S12]. **Our
Benchmark Profile (L1/L2) field is correct and should filter which rules attach.**

### 2.4 Identity and versioning — the tags question
- There is **no standard numbering convention**; recommendation numbers are meaningful only inside
  one benchmark version and can be reused [S1].
- In ComplianceAsCode a rule's unique ID is its own identifier and links it to its checks and fixes;
  CIS numbers and STIG IDs are references keyed to one product version (`cis@ubuntu2204`), so the
  same rule carries a different CIS number on each OS version [verified, S12].
- **Corrected:** the run's extract said "a CCE is the single global identifier for a rule". All three
  votes refuted it — CCEs are product-dependent too, a different CCE per product and version
  [refuted, S12]. There is no identifier that survives across products.
- Tenable and Rapid7 both key overrides to the individual rule inside a policy [verified, S9, S11].

**Data model to design against:** `Rule { id (ours, per OS version), cisNumber, benchmarkVersion,
ccee?, xccdfId?, tags[], frameworkRefs[] }`. Tags are labels many rules share — good for filtering,
never for identity. Zeni's hunch that "the unique identifier is my tags" is the one thing to drop.

### 2.5 When CIS ships a new version
There is no cadence to design a calendar around [S4]. Microsoft's pattern for Intune baselines is the
best UX reference: when a new baseline version ships, existing profiles become read-only until you
choose "Update version", and you review the settings diff before updating [S20, Microsoft Learn].
**Takeaway:** a new benchmark version should never silently change a policy. Show "v2.0.0 available",
offer a diff (added / changed / removed rules), and let the admin re-pin.

### 2.6 Framework mappings
Mappings to NIST, PCI, HIPAA, STIG etc. arrive with the rule content (ServiceNow imports
"authoritative sources and citations" from the scanner) [S21]. Tanium covers CIS, NIS2, CMMC and
Essential Eight [S17]; SolarWinds NCM ships DISA STIG, PCI, HIPAA, SOX reports for network devices
[verified, S6]. They are read-only metadata on a rule, surfaced as chips and as a report axis.

---

## 3. Personas

| Persona | Owns | Reads | Scenario from the sources |
|---|---|---|---|
| **Security admin** (GRC / policy administrator) | The rule catalogue, benchmark tailoring, custom benchmarks, exception approval | Posture by benchmark, drift, audit evidence | Tailors a CIS benchmark into an org baseline: picks the profile level, excludes rules that do not fit, adjusts parameter values, documents why [S23]. Approves exceptions "based on the business risks involved" [verified, S10]. |
| **Technician / sysadmin** (remediation owner) | Policies, endpoint scope, running scans, fixing failures, requesting exceptions | Per-endpoint failures and the fix for each | A support team relaxes a setting while troubleshooting and a 15,000-device fleet drifts off its CIS L1 baseline [S24]. In ServiceNow the remediation owner is the role that requests an exception [S22]. |
| **Auditor / CISO** (reads, never edits) | Nothing | Score over time, evidence that a result is reproducible, the exception register | Must be able to re-run an assessment against the same baseline version and asset scope and get the same answer [S8]. |
| **Network engineer** (router / switch / firewall) | Device-config compliance | Node × rule pass/fail | NCM targets STIG content by a Device_Type property (router, L2/L3 switch, firewall) plus OS (IOS, NX, XE, ASA) — the same Type + Version targeting our benchmarks use [verified, S5]. |

Two role rules from practitioners: **the identity that runs checks should not also hold remediation
rights** — otherwise one actor changes the state, runs the check and certifies the result [S8]; and
Tanium names its target roles as GRC Analyst, Policy Administrator, Systems Administrator, Systems
Architect [S17]. Our admin/technician split matches this; the auditor is the missing third reader.

---

## 4. The full flow, stage by stage, with how competitors model it

```
Rule catalogue ─► Benchmark (tailored) ─► Policy (benchmark × targets × schedule)
      ─► Assessment run ─► Results (endpoint × rule) + score ─► Remediation ─► Re-assess
                                   │                                 ▲
                                   └──► Exception (rule × hosts, reason, approval, expiry) ─┘
      ─► Drift detection (continuous) ─► Evidence / audit report
```

### 4.1 Catalogue → Benchmark
- ManageEngine: policies are collections of CIS-derived rules grouped by platform; policies are not
  targeted directly — you build a **Policy Group**, pick the platform, select CIS policies into it,
  then map target groups. Custom policies are made by importing and editing rules, then publishing
  [verified, S15, S16].
- NinjaOne: an admin tailors any included benchmark inside the web console while configuring the
  endpoint scan, with no external authoring tool [S2].
- CIS WorkBench tailoring: fork a published benchmark, change recommendations, export [S1 blog].
- Practitioner guidance: tailoring is expected practice but "should never be ad hoc or undocumented"
  [S23]; different server roles should get separate baseline profiles [S22 oneuptime].
- NCM: rules roll up into policies, policies into policy reports; one policy can appear in several
  reports [verified, S5].

**Our module:** Benchmark = one Type + one OS version + attached rules in numbered groups. Matches
the field. **Add:** a "Based on CIS Ubuntu 22.04 v2.0.0" lineage on a custom benchmark, a diff
against its CIS parent, and a documented reason on each excluded rule (that reason becomes the
exception record's seed later).

### 4.2 Benchmark → Policy → Assessment
- ManageEngine: map target systems, schedule audits, view compliance % and violated rules per policy
  [S16]. NinjaOne: tailoring sits inside scan/policy setup [S2].
- Tanium: import content into Comply, run an assessment, push CIS remediation in Enforce keyed to the
  same control IDs, re-run the assessment to verify [verified, S17].
- CIS recommends testing any benchmark in a non-production environment first; DISA STIG groups
  controls by severity CAT I/II/III [S23]. **Takeaway:** a pilot group on a policy and a severity
  model on results are both expected.

**Our module:** Policy = one benchmark + endpoints + schedule + notify. Matches. **Add:** a pilot /
test-group stage, and store the benchmark version with every run.

### 4.3 Results and scoring
- ManageEngine scores compliance as a percentage at three levels: per computer, per target group, per
  policy; results viewable by group, computer or policy [S16].
- NCM reports node × rule pass/fail [verified, S6].
- ServiceNow does not calculate results itself; it imports them by state: Passed and Skipped vs
  Failed, Warning, Error, Unknown; unmatched assets go to a missing-asset table [verified, S21].
- Tenable has three overlay rule types; Change Result rules flip a failed host-audit check to Passed
  (or back) "when a fix was made in a way the scan cannot detect", which changes the asset's
  compliance percentage, and the override + justification are kept on the rule [verified, S11].

**Status vocabulary to adopt:** Pass · Fail · Manual (needs a human) · Not applicable · Error /
Unknown · Excepted. Score = passed ÷ (passed + failed), excepted and N/A excluded, stated beside the
number. Three roll-ups: endpoint, policy, benchmark.

### 4.4 Remediation and the ITSM join
- ServiceNow: failed test results are grouped into **Remediation Tasks** by rules (up to six grouping
  keys), a default rule keyed on "Assignment group, Test"; one result can belong to several tasks;
  task assignment rolls down to its results [verified, S19]. From a task you **Create Change**,
  choosing all active results or a filtered set; the CIs join the change's Affected CIs and results
  move to Awaiting Implementation; the task resolves when linked changes resolve; change type can be
  Emergency / Normal / Standard [verified, S20].
- Tanium: Comply finding → Enforce (push CIS configuration) or native Patch/Deploy, verified back in
  Comply [S17, S18].
- ManageEngine shows guidance only — summary, rationale, step-by-step fix per violation; no automated
  fix on the page [S16]. Automox has no CIS catalogue; each Worklet carries its own evaluation block
  and remediation block attached to device groups [S2].

**Our module:** nothing yet. **Design:** from a failed rule on N endpoints, three doors — *Create
Change* (ServiceOps Change, affected CIs attached), *Deploy fix* (Patch or Package deployment seeded
with the endpoints), *Assign task* (grouped by rule, not one ticket per endpoint). Each door writes
back a status on the result (Awaiting implementation → re-assess → Pass).

### 4.5 Exceptions / waivers — the data model
What every product agrees on:
- **Scope:** rule × host(s). Qualys exempts "certain hosts from controls in compliance policies"
  [verified, S9]; Rapid7 overrides one rule at a time, never a group, and the scope depends on where
  you start — Policies view = all assets, Scanned Assets view adds "this asset only" and "this asset
  until the next scan" [verified, S11]. ServiceNow scopes an exception to a whole remediation task,
  which means individual results inside it cannot be tracked [unverified, S22].
- **Reason:** mandatory everywhere [S11, S16, UCI]. "No known exploits" alone is not a valid
  justification [S16 UCI, unverified].
- **Approval:** Rapid7 separates submit / review / delete permissions, with "Submit and Approve" for
  those allowed [verified, S11]; Qualys VMDR-for-ITSM routes through approver groups, any member can
  approve, "three or four stages of approvers" in some cases, rejection needs a comment, approvers
  work from a Pending-My-Approval queue [verified, S10]; ServiceNow can be two-level and an exception
  cannot be requested if no first-level approver is configured [unverified, S22].
- **Expiry:** Tenable Accept rules carry a mandatory justification and expiration [unverified, S11];
  UC Irvine's governance caps accept/recast at one year [unverified, S16]; Rapid7 reviewers can set
  an expiry on approval [S11]; practitioner field lists add next review date, compensating controls,
  change-control reference, and "keep expired exceptions visible until resolved" [S22, S23].
- **Kinds:** Tenable.sc separates *Accepted Risk* (left unfixed at the reported severity) from
  *Recast Risk* (severity changed because the org disagrees); false positives are labelled recast
  after verification [unverified, S16]. Intune-on-Nerdio offers "accept the drift with an expiry and
  a description" per policy [S20].
- **Audit trail:** overlay rules never modify raw scan data; Rapid7 writes overrides and reasons into
  the XCCDF export used for certification review [verified, S11, S30].
- **Lifecycle on the work item:** ServiceNow's task is In review while pending, Deferred on approval,
  back to its previous state on rejection, back to Open when the exception expires [unverified, S22].

**Record to design:** `Exception { ruleId, benchmarkVersion, endpoints[] | all, kind: accepted-risk |
false-positive | compensating-control, reason, riskLevel, compensatingControls, owner, approver(s),
changeRef?, expiresOn, nextReview, status: requested | approved | rejected | expired }`. Raw result
stays Fail; the view shows Excepted with the reason on hover; expiry re-opens the finding.

### 4.6 Drift, re-scan and evidence
- Run benchmarking as a continuous control check, not a one-time assessment [S8].
- Check for drift after emergency changes, admin access, platform upgrades and automated repairs;
  unapproved changes go to an owner, never overwritten automatically [S22].
- Each policy in an Intune baseline has its own "Fix drift" action, so one policy can be remediated
  without republishing the whole baseline; a drifted policy can be rolled back to the assigned
  version [S20].
- Evidence = the scan output, the system state, a log trail operators cannot alter; store the
  benchmark version with each result; an auditor must be able to re-run and reproduce [S8].

**Our module:** scans exist; drift does not. **Add:** "Last compliant on … / drifted on …" per
endpoint × rule, a drift filter on the policy's results, and an export that carries benchmark
version + scope + timestamp + exceptions.

---

## 5. Competitor object models, side by side

| Product | Content unit | Grouping | Target | Results | Remediation | Exceptions |
|---|---|---|---|---|---|---|
| ManageEngine VMP / Endpoint Central | CIS-derived policy (rules) | Policy Group (platform × profile) | Target groups | % per computer / group / policy | Guidance only | — |
| NinjaOne | Benchmark tailored in console | Scan policy | Endpoints | Report vs internal/external policy | DSC applied automatically (Windows) | — |
| Tanium Comply + Enforce | Imported benchmark content + custom checks | Assessment | Computer groups | Assessment results | Enforce pushes CIS fixes by control ID; re-assess | — |
| Qualys Policy Compliance | Control in a policy | Policy | Hosts | Control posture | — | Host × control, request → approve/reject, multi-stage via ITSM |
| Rapid7 InsightVM | Rule in a policy | Policy | Assets | Rule check | — | Per rule, scope by entry point, submit/review/delete perms, expiry |
| Tenable | Audit check | Audit | Assets | Pass / Fail / Warning counts | — | Change Result / Accept / Recast overlays; raw data untouched |
| ServiceNow Config. Compliance | Test (from scanner) | Test group | CIs | Imported states | Remediation Task → Change | Defers a task; two-level approval |
| SolarWinds NCM | Rule | Policy → Policy Report | Nodes by Device_Type + OS | Node × rule | — | — |
| Automox | Worklet (check + fix) | Policy | Device groups | Scan | Worklet remediation block | — |

---

## 6. What to change in our module — concrete recommendations

**Vocabulary (keep one word per thing):** Rule · Benchmark · Policy · Assessment (a run) · Result
(endpoint × rule) · Finding (a failed result) · Exception. Avoid "violation" and "finding" for the same
thing.

**Admin › Rules**
1. Rule detail in CIS field order (§2.2), with Assessment Status, Profile and Severity as pills and
   framework mappings as chips.
2. Rule identity = our ID per OS version; show the CIS number as "CIS 5.2.5 in Ubuntu 22.04 v2.0.0";
   tags stay tags.

**Admin › Benchmark**
3. Lineage on custom benchmarks ("Based on …"), a diff view against the parent, and a required reason
   on each excluded rule.
4. Version pinning: a policy pins a benchmark version; a new CIS version shows as "update available"
   with a rule diff, never applied silently (§2.5).
5. Profile filter on Attach Rules (L1 / L2 / STIG) — the field already exists.

**Technician › Compliance Policy**
6. Pilot group before fleet rollout; store benchmark version on every run.
7. Results tab with the six-state vocabulary (§4.3), score with its denominator stated, three
   roll-ups, severity on each failed rule, and the rule's Remediation Procedure inline on the finding.
8. Remediation doors on a finding: Create Change (affected CIs attached), Deploy fix (Patch / Package
   with endpoints seeded), Assign task grouped by rule. Status writes back; re-assess closes.
9. Exceptions as records (§4.5): request from a finding, approver queue for the security admin,
   expiry re-opens, exception register exportable.
10. Drift: per endpoint × rule "compliant since / drifted on", a drift filter, and Fix-drift per rule.
11. Evidence export per run: benchmark version, scope, timestamp, results, exceptions with reasons.

**Visualization (exists)**
12. Confirm with the product what the posture bands and the 85% target mean; competitors score
    percentages without a universal target, so the target should be a tenant setting.

---

## 7. Confidence, caveats and what was not verified

- 24 of the 97 claims went through 3-vote verification (the run caps at 25); 20 came back supported
  by all three votes, 2 were refuted, and 4 never got their votes because the tab died. The other 73
  claims are extraction-only and are marked by their source quality below.
- **Refuted:** "a CCE is the single global identifier for a rule" (CCEs are per product and version);
  "rule content in products has to follow a regular release cadence" (CIS has no fixed schedule; only
  the monthly announcement email is regular).
- **Unverified:** everything from the UC Irvine Tenable.sc governance page, Tenable Accept-rule
  details, and ServiceNow's exception lifecycle (§4.5).
- Source quality: 15 of the 22 sources are primary vendor documentation (CIS, Qualys, Rapid7,
  Tenable, ServiceNow, ManageEngine, Tanium, SolarWinds, ComplianceAsCode); IBM's deck is secondary;
  nhimg, oneuptime, natsar and Nerdio are blogs; the THWACK forum and the CIS Atlassian KB page were
  fetched but rated unreliable / empty by the extractor (the KB claim in §2.4 comes from the search
  snippet, not the fetch).
- Not covered at all by the run: pricing, agent architecture, how competitors handle Manual checks in
  the UI, and any usability research on compliance consoles. A second, narrower run on "Manual check
  UX" and "exception register UX" would be worth it if those become design questions.

---

## 8. Sources

S1 CIS KB — numbering convention: https://cisecurity.atlassian.net/wiki/spaces/SCFKB/pages/1331364226/What+is+the+numbering+convention+for+CIS+Benchmarks
S1b CIS blog — tailoring in WorkBench: https://www.cisecurity.org/insights/blog/customize-cis-benchmarks-cis-workbench
S2 NinjaOne docs — security configuration management: https://www.ninjaone.com/docs/new-to-ninjaone/getting-started/security-configuration-management/
S2b Automox — Worklet 101: https://patch.automox.com/automox-worklet-101-guide
S3 Chainguard — CIS Benchmarks overview: https://edu.chainguard.dev/compliance/cis-benchmarks/
S4 CIS Benchmarks FAQ: https://cisecurity.org/cis-benchmarks/cis-benchmarks-faq
S5 SolarWinds NCM — policy reports: https://documentation.solarwinds.com/en/Success_Center/NCM/Content/NCM-Policy-reports.htm
S6 SolarWinds NCM — select a policy report: https://documentation.solarwinds.com/en/success_center/ncm/content/ncm-select-a-policy-report.htm
S7 THWACK forum thread (unreliable): https://thwack.solarwinds.com/discussion/comment/271468
S8 nhimg — automated CIS benchmarking without losing auditability: https://nhimg.org/faq/how-should-security-teams-use-automated-cis-benchmarking-without-losing-auditabi/
S9 Qualys PC — Manage your exceptions: https://docs.qualys.com/en/vm/latest/module_pc/exceptions/exceptions_lp.htm
S10 Qualys VMDR for ITSM — Exception approval: https://docs.qualys.com/en/integration/vmdr-itsm/qualys_vmdr/exception_approval.htm
S11 Rapid7 InsightVM — Policy rule overrides: https://docs.rapid7.com/insightvm/policy-rule-overrides/
S11b Tenable — Recast, Accept and Change Result rules: https://docs.tenable.com/vulnerability-management/Content/recast/recast-intro.htm
S12 ComplianceAsCode — contributing content: https://complianceascode.readthedocs.io/en/latest/manual/developer/06_contributing_with_content.html
S13 IBM — CIS Benchmark overview (NYRUG 2024): https://public.dhe.ibm.com/s390/zos/racf/pdf/nyrug_2024_05_15_cis_benchmark_overview.pdf
S14 natsar — customizing configuration benchmarks: https://natsar.substack.com/p/customizing-configuration-benchmarks
S15 ManageEngine — understanding compliance policies: https://www.manageengine.com/vulnerability-management/help/understanding-compliance-policies.html
S16 ManageEngine — CIS benchmarks & compliance: https://info.manageengine.com/vulnerability-management/cis-compliance.html
S16b UC Irvine — Tenable.sc accepted and recast risk guidelines: https://uci.atlassian.net/wiki/spaces/public/pages/31362588/Tenable+SecurityCenter+Accepted+and+Recast+Risk+Guidelines
S17 Tanium Converge 2026 — multi-framework benchmarks with Enforce: https://converge.tanium.com/2026/session/4038772/applying-multi-framework-compliance-benchmarks-with-enforce
S18 Tanium Converge 2026 — guided exposure management: https://converge.tanium.com/2026/session/4038753/accelerating-risk-remediation-with-guided-exposure-management
S19 ServiceNow — remediation tasks and task rules: https://www.servicenow.com/docs/r/x8~ohSTeWLioGLVI5x3Vgg/j32X6eZjfkXaXS__8Bf~Iw
S20 ServiceNow — create a change request in Configuration Compliance: https://www.servicenow.com/docs/r/x8~ohSTeWLioGLVI5x3Vgg/Hk3E0N3lPFMETYTJnfqDgg
S20b Nerdio — Intune baseline drift: https://nmmhelp.getnerdio.com/hc/en-us/articles/48262934625293
S20c Microsoft Learn — monitor security baselines in Intune: https://learn.microsoft.com/fi-fi/mem/intune/protect/security-baselines-monitor
S21 ServiceNow — imported data (Qualys / Tenable): https://www.servicenow.com/docs/r/zwMwt0JEh8FTHmrqXNjCAw/JmyzmYsavs3a~YCOFQqmfw
S22 oneuptime — PCI DSS secure configuration baselines and exceptions: https://oneuptime.com/blog/post/2026-09-24-pci-dss-secure-configuration-baselines-exceptions/view
S22b ServiceNow — exceptions on remediation tasks (fetched page, votes not run)
S23 natsar — see S14 (tailoring, exception record fields)
S24 Recast Software — CIS Level 1 drift in Intune fleets: https://www.recastsoftware.com/?p=15169
