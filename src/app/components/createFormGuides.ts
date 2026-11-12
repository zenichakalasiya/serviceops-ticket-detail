/* The help guide beside each create form (Zeni, 30 Oct 2026). One guide per form the left rail can
 * open: what the record is, what to have ready, how to fill each section in order, the fields people
 * get wrong, a filled-in example and the common mistakes.
 *
 * ⚠️ PURE DATA, no imports: `CreateFormHelp.tsx` renders it beside the form, and
 * `scripts/build-form-guides.mjs` (Node strips the types) renders the SAME words into the review page,
 * so the screen and the review copy cannot drift.
 * ⚠️ A step's `section` is the form section's TITLE exactly as it renders — that is how the guide
 * lights the step you are on and scrolls the form when a step is clicked. Rename a section in
 * createFormSpecs.ts → rename it here. */

export interface HelpStep {
  /** Section titles this step covers (a section whose title changes, e.g. Patches / OS upgrade patch, lists both). */
  section: string[];
  title: string;
  text: string;
  tips?: string[];
}
export interface FormHelp {
  /** "Patch Deployment" — used in "How to create a …". */
  noun: string;
  intro: string;
  /** What has to exist before this form can be finished. */
  before: string[];
  steps: HelpStep[];
  /** Fields whose meaning is not obvious from the label. */
  fields: [string, string][];
  example: { title: string; rows: [string, string][]; note?: string };
  mistakes: string[];
}

const TARGETS_STEP = (what: string): HelpStep => ({
  section: ['Target endpoints'],
  title: 'Pick where it goes',
  text: `Add whole remote offices, single endpoints, or both. ${what} An endpoint that is in a chosen office and also picked on its own is deployed to once, never twice.`,
  tips: [
    'Start with one small office or a few test machines, then widen once it has worked.',
    'The count under the boxes is the real number of machines that will be touched — check it before you publish.',
    'Offline endpoints receive the run when their agent next connects, as long as the run has not expired.',
  ],
});
const SCHEDULE_STEP: HelpStep = {
  section: ['Schedule'],
  title: 'Set the window',
  text: 'Install After is the earliest moment the run may start; leave it empty to start as soon as it is published. Expiry Date is when it stops trying — endpoints that have not received it by then are left out.',
  tips: ['Expiry opens 15 days ahead. Shorten it for urgent fixes so stale runs do not linger.', 'Install After must be before the Expiry Date.'],
};
const CONFIG_STEP = (title = 'Configuration settings'): HelpStep => ({
  section: [title],
  title: 'Decide how it runs',
  text: 'The Deployment Policy decides when on each endpoint the install may happen — around the clock, only in business hours, at start-up, or straight away. Notify to sends the result to the people and groups who should know.',
  tips: [
    'Use a business-hours or no-reboot policy for machines people are working on.',
    'Turn on Retry Failed Configuration and set a small Retry Count (2–3) for flaky networks; leave it off if a failure should be looked at by a person.',
  ],
});
const SAVE_DRAFT = 'Save as Draft keeps it without running it — only the Name is needed. Publish starts it, so every required field must be filled.';
const POLICY_FIELD: [string, string] = ['Deployment Policy', 'When on the endpoint the install may happen. "Now" installs at once; the others wait for business hours, start-up, or let the user postpone.'];
const RETRY_FIELD: [string, string] = ['Retry Failed Configuration', 'Tries again on endpoints where it failed. Retry Count is how many extra attempts each endpoint gets.'];

export const FORM_HELP: Record<string, FormHelp> = {
  task: {
    noun: 'Task',
    intro: 'A task is one piece of work that someone has to do — on its own or as part of a request, problem, change or release. Create one when the work needs an owner, a date and a status you can track.',
    before: ['Know who should do the work, or at least which technician group.', 'Have the start and end dates if the work is scheduled.'],
    steps: [
      { section: ['Task'], title: 'Say what has to be done', text: 'Write the Subject as an action someone can pick up without asking: "Replace the toner in 3rd-floor printer", not "Printer". Use Task Type to say what kind of work it is, and the Description for the steps or links the assignee needs.', tips: ['Attach screenshots or documents the assignee will need, so they do not have to go looking.'] },
      { section: ['Assignment'], title: 'Give it an owner', text: 'Pick the Technician Group first, then the Assignee inside it. A task with a group but no assignee sits in that group\'s queue until someone takes it.' },
      { section: ['Schedule'], title: 'Set the dates and a reminder', text: 'Start Date and End Date say when the work should happen. Notify Before reminds the assignee ahead of the end date — enter a number and choose Hours or Days.', tips: ['End Date must be after Start Date.', 'Use Days for long work and Hours for same-day work.'] },
      { section: ['Priority & status'], title: 'Say how urgent it is', text: 'New tasks open as Open. Set Priority so the task sorts correctly in the assignee\'s list.' },
    ],
    fields: [
      ['Task Name vs Subject', 'Subject is the line everyone sees in lists. Task Name is an optional short label, useful when the same kind of task repeats.'],
      ['User Group', 'The group the task is raised for, not the group that works on it — that is Technician Group.'],
      ['Notify Before', 'How long before the End Date the assignee is reminded. With no End Date, no reminder is sent.'],
    ],
    example: { title: 'Replace a faulty laptop battery', rows: [['Subject', 'Replace battery — Dell Latitude 7440 (Finance)'], ['Task Type', 'Replacement/Repair'], ['Technician Group', 'Hardware Support'], ['Start / End', 'Today 10:00 → Today 16:00'], ['Notify Before', '2 Hours'], ['Priority', 'Medium']] },
    mistakes: ['A vague subject ("Laptop issue") — the assignee has to open it to know what to do.', 'An end date before the start date — the form will stop you.', 'No assignee and no group — nobody sees it in their queue.'],
  },

  license: {
    noun: 'Software License',
    intro: 'A software license records what you bought — how many seats, which keys, until when — and links it to the software assets that use it, so ServiceOps can tell you if you are over- or under-using it.',
    before: ['The software must already be discovered or added as a software asset — the license is counted against those assets.', 'Have the purchase details: count, keys, cost, dates.'],
    steps: [
      { section: ['License'], title: 'Say which software it covers', text: 'Give it a Name people will recognise ("Microsoft 365 E3 — 2026"), pick the Product, then the License Type. The License Type decides how usage is counted.', tips: ['Purchase Count appears only for types that have a fixed number of seats (machines or users). Enter the number you paid for.', 'Turn on Suite if one license covers several products sold together.'] },
      { section: ['Managed software'], title: 'Link the software assets', text: 'Click Add Asset and pick every software asset this license pays for. At least one is required — this is what ServiceOps counts installations against.', tips: ['Turn on Ignore Version when any version of the software is covered (e.g. Adobe Reader 2023 and 2024 both count).'] },
      { section: ['Key & purchase'], title: 'Add keys, cost and dates', text: 'Add each License Key on its own line — use "+ Add another key" for more. Purchase Date and Expiry Date drive renewal reminders; Cost feeds your spend reports.', tips: ['Expiry Date must be after the Purchase Date.', 'Leave Expiry Date empty for a perpetual license.'] },
    ],
    fields: [
      ['License Type', 'How seats are counted. "Single/Multiple Machines" and "Node Locked" count devices; "Single/Volume Users" count people; "Unlimited" types are never over-used.'],
      ['Purchase Count', 'Seats bought. Installations above this number show the license as over-utilised.'],
      ['Ignore Version', 'Counts every version of the linked software as covered. Leave it off when the license is for one version only.'],
      ['Suite', 'One license that covers several products (an office suite). It does not change what the form asks.'],
    ],
    example: { title: 'Adobe Acrobat for Finance', rows: [['Name', 'Adobe Acrobat Pro — Finance 2026'], ['Product', 'Adobe Acrobat Pro'], ['License Type', 'Volume Users'], ['Purchase Count', '25'], ['Managed software', 'Adobe Acrobat Pro DC (all versions, Ignore Version on)'], ['Expiry Date', '31 Dec 2026']] },
    mistakes: ['No managed software linked — usage stays at zero and the license looks unused.', 'Wrong License Type — a per-user license counted per machine shows the wrong utilisation.', 'All keys pasted into one line — add one key per line.'],
  },

  patch: {
    noun: 'Patch',
    intro: 'Most patches arrive automatically from the vendor catalogue. Create one by hand only for a fix the catalogue does not carry — an in-house application update or a vendor hotfix sent to you directly.',
    before: ['Have the vendor\'s release details: title, KB number, release date, severity.', 'Know which applications and architecture it applies to.'],
    steps: [
      { section: ['Patch'], title: 'Describe the patch', text: 'Use the vendor\'s own title so people can match it to the bulletin. Add the KB Number and the Reference URL to the vendor page; the Description should say what it fixes.' },
      { section: ['Classification'], title: 'Classify it', text: 'Patch Category (Security Update, Hotfix, Service Pack…) and Severity decide how it is filtered, approved and reported. Release Date is the vendor\'s date, not today.' },
      { section: ['Applies to'], title: 'Say what it applies to', text: 'Pick the Architecture (x64, x86, ARM64) and add the applications it patches. Endpoints running those applications are then checked for it.' },
      { section: ['Installation'], title: 'Say what happens on install', text: 'Reboot Required tells deployments whether to plan for a restart — choose "May be" if the vendor is unsure. Turn on Support Uninstallation only if the patch can be safely rolled back.' },
    ],
    fields: [
      ['Severity', 'The vendor\'s rating. Critical and Important are usually approved and deployed first.'],
      ['Reboot Required', 'Yes = always restarts, May be = sometimes, No = never. Deployment policies use this to avoid restarting machines in use.'],
      ['Support Uninstallation', 'Allows an Uninstall deployment of this patch later.'],
    ],
    example: { title: 'In-house finance app hotfix', rows: [['Title', 'FinEdge 4.2.1 hotfix — invoice export'], ['KB Number', 'FE-2026-118'], ['Patch Category', 'Hotfix'], ['Severity', 'Important'], ['Architecture', 'x64'], ['Reboot Required', 'No']] },
    mistakes: ['Using today as the Release Date — it skews "days since release" reports.', 'Choosing "No" for reboot when unsure — choose "May be".', 'Leaving out the applications — no endpoint will ever show it as missing.'],
  },

  'patch-deployment': {
    noun: 'Patch Deployment',
    intro: 'A patch deployment is one run that pushes approved patches — or one OS upgrade image — to the endpoints you choose, inside the time window you set.',
    before: ['The patches must be approved (or, for an OS upgrade, the ISO must be uploaded in Admin › Patch Management › OS Upgrade).', 'Know which offices or endpoints should receive it.'],
    steps: [
      { section: ['Deployment'], title: 'Name the run and choose its kind', text: 'Use a name that says what and where: "June security updates — Pune office". Deployment Category is Patch for ordinary patches or OS Upgrade for an OS image. Configuration Type is Install or Uninstall.', tips: ['An OS upgrade can only be installed, so Uninstall is locked for it.'] },
      SCHEDULE_STEP,
      { section: ['Patches', 'OS upgrade patch'], title: 'Add what it deploys', text: 'For Patch, add one or more approved patches. For OS Upgrade, pick exactly one uploaded OS image — once one is chosen the rest of the list is locked until you remove it.', tips: ['Target endpoints appear only after something is added here — the form needs to know what you are deploying first.'] },
      TARGETS_STEP(''),
      CONFIG_STEP(),
    ],
    fields: [
      ['Deployment Category', 'Patch deploys patches; OS Upgrade deploys one uploaded OS image. Switching clears what was added.'],
      ['Configuration Type', 'Install adds the patch; Uninstall removes it (only patches that support uninstallation).'],
      ['Install After', 'Earliest start. Empty = starts as soon as it is published.'],
      POLICY_FIELD, RETRY_FIELD,
    ],
    example: { title: 'Monthly security run for one office', rows: [['Name', 'Oct security updates — Pune'], ['Category', 'Patch'], ['Configuration Type', 'Install'], ['Install After', 'Sat 22:00'], ['Patches', '4 approved security updates'], ['Targets', 'Pune office (38 endpoints)'], ['Policy', 'Business Hours Deployment – No Reboot']] },
    mistakes: ['Publishing to every office first time — test on one office.', 'An expiry too short for offline laptops to come back online.', SAVE_DRAFT],
  },

  'package-deployment': {
    noun: 'Package Deployment',
    intro: 'A package deployment installs or removes software packages (an installer and its command) on the endpoints you choose — for example rolling out a new VPN client.',
    before: ['The software package must already exist in the package library, with its install command.', 'Know which offices or endpoints should get it.'],
    steps: [
      { section: ['Deployment'], title: 'Name the run', text: 'Say what and where: "AnyDesk 8.1 — Sales laptops". Configuration Type is Install to add the software or Uninstall to remove it.' },
      SCHEDULE_STEP,
      { section: ['Packages'], title: 'Add the packages', text: 'Add every package the run should install or remove. Packages run in the order shown.', tips: ['Target endpoints appear once at least one package is added.'] },
      TARGETS_STEP('Pick machines whose OS matches the package.'),
      CONFIG_STEP(),
    ],
    fields: [['Configuration Type', 'Install runs each package\'s install command; Uninstall runs its uninstall command.'], POLICY_FIELD, RETRY_FIELD],
    example: { title: 'Roll out a VPN client', rows: [['Name', 'GlobalProtect 6.2 — Remote staff'], ['Configuration Type', 'Install'], ['Packages', 'GlobalProtect 6.2 (x64)'], ['Targets', 'Remote Workers office'], ['Policy', '24x7 Deployment Policy – User Intervention Allowed']] },
    mistakes: ['Targeting Mac machines with a Windows package — those endpoints will fail.', 'Uninstalling software people still use without telling them — add them to Notify to.', SAVE_DRAFT],
  },

  'registry-deployment': {
    noun: 'Registry Deployment',
    intro: 'A registry deployment applies Windows registry changes — usually security or configuration settings — to the endpoints you choose, from saved registry templates.',
    before: ['The registry templates must already exist.', 'Registry changes apply to Windows endpoints only.'],
    steps: [
      { section: ['Deployment'], title: 'Name the run', text: 'Say what the change does and where: "Disable USB storage — Finance".' },
      SCHEDULE_STEP,
      { section: ['Registry templates'], title: 'Add the templates', text: 'Add the registry templates the run applies. Each template is a set of keys and values.', tips: ['Target endpoints appear once a template is added.'] },
      TARGETS_STEP('Only Windows endpoints can take registry changes.'),
      CONFIG_STEP(),
    ],
    fields: [['Registry template', 'A saved set of registry keys and values. Check it in the template library before using it — a wrong value can break an application.'], POLICY_FIELD, RETRY_FIELD],
    example: { title: 'Harden a department', rows: [['Name', 'Disable USB storage — Finance'], ['Templates', 'USB Mass Storage — Disabled'], ['Targets', 'Finance office'], ['Policy', 'Now']] },
    mistakes: ['Testing a registry change on the whole company first — always try one machine.', SAVE_DRAFT],
  },

  'auto-patch-test': {
    noun: 'Automatic Patch Test',
    intro: 'An automatic patch test is a rule: as new patches arrive that match it, they are installed on a small test group first. If they cause no trouble for the days you set, they are approved automatically.',
    before: ['Have a test group of endpoints that represents your fleet (an office or group of test machines).'],
    steps: [
      { section: ['Rule'], title: 'Name the rule', text: 'Say what it tests: "Windows security updates — pilot".' },
      { section: ['Which patches'], title: 'Choose which patches it picks up', text: 'Pick the Patch Categories (required) and, if you like, Severities, then the OS Platform. Applications: All applications, or include / exclude a list.', tips: ['Choosing Include or Exclude shows an Applications box — add at least one application there.', 'Leave Severity empty to take every severity in the chosen categories.'] },
      { section: ['Test group'], title: 'Pick the test group', text: 'The Endpoint Group where matching patches are installed first. Choose machines that are used normally but are not critical.' },
      { section: ['Configuration settings'], title: 'Decide when it approves', text: 'Auto Approve After is how many days a patch must run cleanly on the test group before it is approved for everyone. 0 approves it as soon as it installs. Expires After stops the test if it has not finished in that many hours.', tips: ['3–7 days is a common soak time.', 'Add the patch team to Notify to so failures are seen.'] },
    ],
    fields: [['Applications', 'All applications, only the ones you include, or every one except those you exclude.'], ['Auto Approve After (days)', 'Days of clean running on the test group before approval. 0 = approve at once.'], ['Expires After (hours)', 'How long a test may run before it is stopped.'], POLICY_FIELD, RETRY_FIELD],
    example: { title: 'Pilot Windows security updates', rows: [['Name', 'Windows security — IT pilot'], ['Patch Category', 'Security Updates, Critical Updates'], ['OS Platform', 'Windows'], ['Applications', 'All applications'], ['Endpoint Group', 'IT Department'], ['Auto Approve After', '5 days']] },
    mistakes: ['A test group of critical servers — a bad patch hits the machines you least want down.', 'Auto Approve After = 0 by accident — nothing is actually tested.'],
  },

  'auto-patch-deployment': {
    noun: 'Automatic Patch Deployment',
    intro: 'An automatic patch deployment is a rule that deploys approved patches on a schedule — so matching patches reach your endpoints without anyone creating a deployment each time.',
    before: ['Patches need to be approved (by hand or by an Automatic Patch Test) before this rule deploys them.', 'Know the targets and the maintenance schedule.'],
    steps: [
      { section: ['Rule'], title: 'Name the rule', text: 'Say what and where: "Weekly security updates — all offices".' },
      { section: ['Which patches'], title: 'Choose which patches it deploys', text: 'Pick the Patch Categories, Severities and OS Platform, then all applications or an include / exclude list.' },
      { section: ['Target endpoints'], title: 'Pick where they go', text: 'Add remote offices, single endpoints, or both. At least one is required. An endpoint picked both ways is deployed to once.' },
      { section: ['Schedule'], title: 'Set when it runs', text: 'Choose the Schedule Type, then fill what it asks: a date and time for Once, a time for Daily, days for Weekly, dates or weekdays and months for Monthly, or a gap in hours for Interval. Deploy After Approval waits that many days after a patch is approved.', tips: ['Match the schedule to your maintenance window.', 'Expires After stops trying to deploy a run after that many days.'] },
      CONFIG_STEP(),
    ],
    fields: [['Schedule Type', 'Once, Daily, Weekly, Monthly or Interval — each shows only the fields it needs.'], ['Deploy After Approval (days)', 'A waiting period after approval, so a fresh patch is not pushed the same night.'], POLICY_FIELD, RETRY_FIELD],
    example: { title: 'Weekly security rollout', rows: [['Name', 'Weekly security — all offices'], ['Patch Category', 'Security Updates'], ['Targets', 'All 6 remote offices'], ['Schedule', 'Weekly · Saturday · 22:00'], ['Deploy After Approval', '2 days'], ['Policy', 'Business Hours Deployment – No Reboot']] },
    mistakes: ['Running it Daily on servers that need a change window.', 'Forgetting that unapproved patches are never deployed — pair it with an Automatic Patch Test.'],
  },

  knowledge: {
    noun: 'Knowledge Article',
    intro: 'A knowledge article answers one question or fixes one problem, so requesters can help themselves and technicians do not solve the same thing twice. It is saved as a draft and published once reviewed.',
    before: ['Know who should read it — the folder decides that.', 'Have the steps, and screenshots if they help.'],
    steps: [
      { section: ['Article'], title: 'Write the article', text: 'Make the Title the question people would type: "How do I connect to the VPN from home?". Pick a Folder — it decides who can read it (each folder shows its readers). Write the Content as short numbered steps.', tips: ['One article, one problem. Split long articles.', 'Put the answer first, background after.', 'Use a Public folder only for content requesters should see.'] },
      { section: ['Publishing'], title: 'Help people find it', text: 'Add Tags with the words people search for, attach any files, and set an Expiry Date if the content will go out of date (a policy, a version, a season).' },
    ],
    fields: [['Folder', 'Where the article lives. Its read permission (Public, All Technicians, a group) decides who sees it.'], ['Expiry Date', 'After this date the article is flagged for review. Leave empty for content that does not age.'], ['Tags', 'Search words. Add the terms users actually type, including common misspellings.']],
    example: { title: 'Self-service VPN help', rows: [['Title', 'How do I connect to the VPN from home?'], ['Folder', 'FAQs (Public)'], ['Content', '1. Open GlobalProtect … 2. Enter portal vpn.company.com …'], ['Tags', 'vpn, remote, work from home, globalprotect']] },
    mistakes: ['Putting an internal fix in a Public folder — requesters will see it.', 'A title that names the system instead of the question.'],
  },

  report: {
    noun: 'Report',
    intro: 'A report pulls records from one module into a table or chart. Pick the module and type, decide who may see it, narrow the records, then choose the columns.',
    before: ['Know the question the report should answer, e.g. "Open P1 incidents per group this month".'],
    steps: [
      { section: ['Basic details'], title: 'Set what it reports on', text: 'Name it after the question it answers. Module is where the records come from. Type decides the shape: Tabular (a list), Matrix (rows × columns), Summary (counts and a chart), Plugin (a custom report) or Query (your own SQL).', tips: ['Report Access Level: Private is just you, Public is every technician, Restricted lets you name groups and technicians.'] },
      { section: ['Filters'], title: 'Choose the date range basis', text: 'Date Filter says which date the report\'s time range uses — created, updated, resolved… Group By (Tabular and Matrix) collects rows under a heading. For a Query report, write the SQL here instead.' },
      { section: ['Conditions'], title: 'Narrow the records', text: 'Add conditions such as Status is not Closed, Priority is High. Every condition must match.' },
      { section: ['Chart'], title: 'Pick the chart', text: 'Summary and Matrix reports are drawn as a chart — choose Column, Bar, Line, Pie or Donut.' },
      { section: ['Columns'], title: 'Pick the columns', text: 'Select the columns each row shows. The order you pick them is the order in the report.' },
    ],
    fields: [['Type', 'Tabular = list, Matrix = cross-table, Summary = counts + chart, Plugin = custom code, Query = your SQL.'], ['Report Access Level', 'Who can open it. Restricted shows the group and technician pickers.'], ['Date Filter', 'The date the report\'s time range is applied to.']],
    example: { title: 'Open high-priority incidents', rows: [['Name', 'Open high-priority incidents by group'], ['Module', 'Request'], ['Type', 'Summary'], ['Access', 'Public'], ['Conditions', 'Status is not Closed · Priority is High'], ['Chart', 'Bar'], ['Columns', 'ID, Subject, Technician Group, Assignee, Due By']] },
    mistakes: ['Too many columns — a report is easier to read with 5–7.', 'Restricted access with nobody added — only you can see it.'],
  },
  'compliance-policy': {
    noun: 'Compliance Policy',
    intro: 'A compliance policy checks a set of endpoints against ONE benchmark and scores how many of its rules they pass. Create one for each group of machines you want held to a standard.',
    before: ['Know which operating system the machines run — a benchmark is written for one OS version.', 'Know which remote offices or machines should be checked.'],
    steps: [
      { section: ['Policy Details'], title: 'Name the policy', text: 'Give it a name people will recognise in the listing, such as "Production Debian Web Tier". The Description says why the policy exists.' },
      { section: ['Benchmark'], title: 'Choose the benchmark', text: 'Pick the OS Type first, then the benchmark. Its OS version decides which endpoints can be added. Network benchmarks also ask which configuration file to check.', tips: ['Changing the OS Type or the benchmark clears the endpoints already added.'] },
      { section: ['Target Endpoints'], title: 'Pick the endpoints', text: 'Add whole remote offices, single endpoints, or both. An endpoint picked both ways is assessed once.', tips: ['Use Preview on an office to see the machines it brings in.', 'Offline endpoints are skipped until their agent reports in.'] },
      { section: ['Schedule & Notifications'], title: 'Schedule it and tell people', text: 'Turn on Schedule to scan on its own — once, daily, weekly or monthly. Leave it off to scan only with Scan Now. Notify Team receives the result.' },
    ],
    fields: [
      ['Config File Type', 'Network devices only. Startup checks the configuration the device boots with; Running checks what it runs now.'],
      ['Notify Team', 'Technicians or groups who hear the result of each scan.'],
    ],
    example: { title: 'Web servers, weekly', rows: [['Policy Name', 'Production Debian Web Tier'], ['OS Type', 'Linux'], ['Benchmark', 'CIS Debian Linux 11 Benchmark'], ['Remote Offices', 'Ahmedabad HQ'], ['Schedule', 'Weekly, Sunday 02:00'], ['Notify Team', 'Linux Admins']], note: 'Save as Draft keeps it without scanning — only the Policy Name is needed. Publish needs every required field.' },
    mistakes: ['Choosing a benchmark for a different OS version than the machines run — they will not show up to add.', 'Leaving Schedule off and expecting it to scan on its own.'],
  },
};
