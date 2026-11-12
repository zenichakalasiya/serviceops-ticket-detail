/* The STEPS of the stepped create forms (V2 full page and V3 drawer — see createFormUi.ts).
 *
 * V1 shows every spec section as it is. A stepper cannot: a step that asks for one field ("Rule" =
 * Name, "Test group" = Endpoint Group, "Chart" = Chart Type) is a whole click for one answer. So each
 * step here is one or more spec sections MERGED into one, named for what they decide together, so
 * every step carries a fair amount of related fields. (Zeni, 30 Oct 2026: merge only in the stepped
 * versions; V1 stays as it is.)
 *
 * ⚠️ `sections` are spec section titles exactly as they render (a dynamic title lists every form it
 * takes, e.g. Patches / OS upgrade patch). A section not listed in any step is shown in NO step — keep
 * this in step with createFormSpecs.ts. Pure data, no imports. */

export interface FormStep { title: string; sub: string; sections: string[] }

export const FORM_STEPS: Record<string, FormStep[]> = {
  task: [
    { title: 'Task details', sub: 'What has to be done, by whom it is raised, and what helps the assignee.', sections: ['Task'] },
    { title: 'Owner & priority', sub: 'Who does it, how urgent it is and where it stands.', sections: ['Assignment', 'Priority & status'] },
    { title: 'Schedule', sub: 'When it runs, and when to remind the assignee.', sections: ['Schedule'] },
  ],
  license: [
    { title: 'License', sub: 'Which software this license covers and how seats are counted.', sections: ['License'] },
    { title: 'Managed software', sub: 'The software assets this license is counted against.', sections: ['Managed software'] },
    { title: 'Keys & purchase', sub: 'The keys, what it cost and when it runs out.', sections: ['Key & purchase'] },
  ],
  patch: [
    { title: 'Patch details', sub: 'What the patch is, how severe, and when the vendor released it.', sections: ['Patch', 'Classification'] },
    { title: 'Applies to & install', sub: 'Which systems it is for, and what happens on the endpoint when it installs.', sections: ['Applies to', 'Installation'] },
  ],
  'patch-deployment': [
    { title: 'Deployment & schedule', sub: 'Name the run, choose its kind, and set when it may start and stop.', sections: ['Deployment', 'Schedule'] },
    { title: 'Patches', sub: 'What the run deploys.', sections: ['Patches', 'OS upgrade patch'] },
    { title: 'Target endpoints', sub: 'Whole remote offices, single endpoints, or both.', sections: ['Target endpoints'] },
    { title: 'Settings', sub: 'How it runs on each endpoint and who hears about it.', sections: ['Configuration settings'] },
  ],
  'package-deployment': [
    { title: 'Deployment & schedule', sub: 'Name the run, install or remove, and when it may start and stop.', sections: ['Deployment', 'Schedule'] },
    { title: 'Packages', sub: 'The software packages the run deploys.', sections: ['Packages'] },
    { title: 'Target endpoints', sub: 'Whole remote offices, single endpoints, or both.', sections: ['Target endpoints'] },
    { title: 'Settings', sub: 'How it runs on each endpoint and who hears about it.', sections: ['Configuration settings'] },
  ],
  'registry-deployment': [
    { title: 'Deployment & schedule', sub: 'Name the run and set when it may start and stop.', sections: ['Deployment', 'Schedule'] },
    { title: 'Registry templates', sub: 'The registry changes the run applies.', sections: ['Registry templates'] },
    { title: 'Target endpoints', sub: 'Whole remote offices, single endpoints, or both.', sections: ['Target endpoints'] },
    { title: 'Settings', sub: 'How it runs on each endpoint and who hears about it.', sections: ['Configuration settings'] },
  ],
  'auto-patch-test': [
    { title: 'Rule & patches', sub: 'Name the rule and choose which patches it picks up as they arrive.', sections: ['Rule', 'Which patches'] },
    { title: 'Test group & approval', sub: 'Where patches are tried first, how long they soak, and who hears about it.', sections: ['Test group', 'Configuration settings'] },
  ],
  'auto-patch-deployment': [
    { title: 'Rule & patches', sub: 'Name the rule and choose which approved patches it deploys.', sections: ['Rule', 'Which patches'] },
    { title: 'Target endpoints', sub: 'Where the patches are deployed.', sections: ['Target endpoints'] },
    { title: 'Schedule', sub: 'When it runs after a patch is approved, and when it stops trying.', sections: ['Schedule'] },
    { title: 'Settings', sub: 'How it runs on each endpoint and who hears about it.', sections: ['Configuration settings'] },
  ],
  knowledge: [
    { title: 'Article', sub: 'The title, where it is filed, and what it says.', sections: ['Article'] },
    { title: 'Publishing', sub: 'How people find it and when it stops being valid.', sections: ['Publishing'] },
  ],
  report: [
    { title: 'Basic details', sub: 'What the report is, its shape, and who can see it.', sections: ['Basic details'] },
    { title: 'Filters & conditions', sub: 'Which records it counts.', sections: ['Filters', 'Conditions'] },
    { title: 'Layout', sub: 'How it is drawn and which columns it shows.', sections: ['Chart', 'Columns'] },
  ],
  /* Compliance Policy (Zeni, 12 Nov 2026) — section titles as CompliancePolicyEditor renders them. */
  'compliance-policy': [
    { title: 'Policy & benchmark', sub: 'Name the policy and choose the one benchmark it assesses.', sections: ['Policy Details', 'Benchmark'] },
    { title: 'Target endpoints', sub: 'Whole remote offices, single endpoints, or both.', sections: ['Target Endpoints'] },
    { title: 'Schedule & notify', sub: 'When it scans on its own, and who hears about the result.', sections: ['Schedule & Notifications'] },
  ],
};
