/**
 * The DETAILED Help guide's content (V3, Zeni, 9 Oct 2026) — articles made of typed BLOCKS, so the
 * panel can draw each kind its own way (a before/after form, a rule read-out, a do/don't pair) and
 * the search can read every word. Plain strings with **bold**; never JSX.
 *
 * ⚠️ Field names, actions and option labels match the builder's own words (formRuleData), so an
 * admin can find in the form exactly what an article tells them to pick.
 */

/** One field in a tiny form picture. `hl` marks what the rule changed. */
export interface MockField { l: string; s?: 'hidden' | 'req' | 'ro'; v?: string; hl?: boolean }

export interface HelpOption {
  name: string;
  what: string;
  when: string;
  example?: string;
  before?: MockField[];
  after?: MockField[];
  /** The caption between the two pictures — what made the form change. */
  trigger?: string;
}

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'steps'; items: { title: string; text: string }[] }
  | { t: 'options'; items: HelpOption[] }
  | { t: 'rule'; title?: string; when: string; ifs?: string[]; join?: 'AND' | 'OR'; then: string[] }
  | { t: 'form'; caption?: string; trigger?: string; before: MockField[]; after: MockField[] }
  | { t: 'dodont'; dos: string[]; donts: string[] }
  | { t: 'callout'; tone: 'tip' | 'warn'; text: string }
  | { t: 'check'; items: { q: string; a: string }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'faq'; items: { q: string; a: string }[] };

export type HelpGroup = 'Start here' | 'Building blocks' | 'Real scenarios' | 'Get it right' | 'Troubleshooting';
export const HELP_GROUPS: HelpGroup[] = ['Start here', 'Building blocks', 'Real scenarios', 'Get it right', 'Troubleshooting'];

export interface HelpArticle {
  id: string;
  group: HelpGroup;
  icon: string;
  title: string;
  sub: string;
  mins: number;
  intro: string;
  blocks: Block[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  /* ── Start here ─────────────────────────────────────────────────────────────────────────── */
  {
    id: 'first', group: 'Start here', icon: 'rocket', mins: 5,
    title: 'Build your first rule', sub: 'Every step, from name to save',
    intro: 'A form rule changes the request form **by itself** — it shows, hides, requires or fills a field when something happens. You build one in three parts: **When** it runs, **Check if** it should, and **Then** what it does.',
    blocks: [
      { t: 'h', text: 'Before you start' },
      { t: 'p', text: 'Write the rule as one sentence first. If you can say it, you can build it: “**When** a requester fills the form, **if** Category is Hardware, **then** ask for the Asset Tag.”' },
      { t: 'h', text: 'Step by step' },
      { t: 'steps', items: [
        { title: 'Name it after what it does', text: 'Use the sentence, not a code: “Hardware requests need an asset tag”. The name is how others find and trust the rule in the Form Rules list.' },
        { title: 'Add a tag and a short description', text: 'Tags group rules (e.g. **Hardware**, **Incident**). The description is for the next admin — say why the rule exists.' },
        { title: 'Pick the rule event', text: 'Most rules use **While the form is being filled**, so the form reacts as fields change. See “Rule events” for when to use the other two.' },
        { title: 'Pick Execute on', text: '**On Create** for new requests, **On Edit** for existing ones, or both.' },
        { title: 'Pick who it applies to', text: 'Requesters, Technicians or Everyone. Requesters see a simpler form, so many rules are for them only.' },
        { title: 'Add the conditions', text: 'Click **Add Condition**, choose a field, an operator and a value: **Category · is · Hardware**. Leave conditions empty only for rules that should always run.' },
        { title: 'Add the actions', text: 'Click **Add Action**, choose what happens (e.g. **Show**) and the field (**Asset Tag**). Add one action per change you need.' },
        { title: 'Read the rule check', text: 'If cards appear at the top of this panel, open them before saving: a **similar rule** may already do the job, and a **conflict** means another rule fights yours.' },
        { title: 'Save and test', text: 'Click **Save Rule**, open a new request as the right person, and change the field your condition watches. The form should change straight away.' },
      ] },
      { t: 'h', text: 'What you just built' },
      { t: 'rule', title: 'Hardware requests need an asset tag', when: 'While the form is being filled · On Create · Requesters Only', ifs: ['Category is Hardware'], then: ['Show Asset Tag', 'Mandate Asset Tag'] },
      { t: 'form', caption: 'What the requester sees', trigger: 'Requester picks Category = Hardware',
        before: [{ l: 'Category', v: 'Software' }, { l: 'Subject', v: 'Laptop is slow' }, { l: 'Asset Tag', s: 'hidden' }],
        after: [{ l: 'Category', v: 'Hardware', hl: true }, { l: 'Subject', v: 'Laptop is slow' }, { l: 'Asset Tag', s: 'req', hl: true }] },
      { t: 'callout', tone: 'tip', text: 'Pair a **Show** rule with a **Hide** rule that runs when the form opens, so the field is hidden until it is needed.' },
    ],
  },
  {
    id: 'anatomy', group: 'Start here', icon: 'layers', mins: 2,
    title: 'How a rule works', sub: 'When, Check if and Then in plain words',
    intro: 'Every rule answers three questions, always in the same order. Read a rule top to bottom and it reads as a sentence.',
    blocks: [
      { t: 'rule', when: 'While the form is being filled · On Create and Edit · Everyone', ifs: ['Priority is Urgent'], then: ['Mandate Description'] },
      { t: 'steps', items: [
        { title: 'When — the moment it is checked', text: 'The **event** (form opens, a field changes, or the form is saved), **Execute on** (new or existing requests) and **who** (requesters, technicians, everyone). Until these are set, the rest of the builder stays closed.' },
        { title: 'Check if — whether it should act', text: 'One or more **conditions** on fields. If they all pass (AND) or any pass (OR), the rule acts. No conditions means it always acts.' },
        { title: 'Then — what changes on the form', text: 'One or more **actions**, each on one or more fields. All actions run together, in the order listed.' },
      ] },
      { t: 'callout', tone: 'tip', text: 'A rule never changes a request that is already saved in the database — it only changes how the **form** behaves while someone is using it.' },
    ],
  },

  /* ── Building blocks ────────────────────────────────────────────────────────────────────── */
  {
    id: 'events', group: 'Building blocks', icon: 'zap', mins: 3,
    title: 'Rule events', sub: 'Opens, while filling, or on submit',
    intro: 'The event decides **the moment** the rule is checked. Picking the wrong one is the most common reason a rule “does nothing”.',
    blocks: [
      { t: 'options', items: [
        { name: 'While the form is being filled', what: 'Checked every time a field the rule watches changes, while the form is open.',
          when: 'The form should react as people fill it — show, hide or require a field based on an answer.',
          trigger: 'Requester changes Category to Hardware',
          before: [{ l: 'Category', v: 'Software' }, { l: 'Vendor', s: 'hidden' }],
          after: [{ l: 'Category', v: 'Hardware', hl: true }, { l: 'Vendor', v: 'Choose…', hl: true }] },
        { name: 'When the form opens', what: 'Checked once, as the form is first shown.',
          when: 'Setting the starting state: defaults, hidden fields, locked fields.',
          trigger: 'Form opens',
          before: [{ l: 'Priority', v: '—' }, { l: 'Department', v: '—' }],
          after: [{ l: 'Priority', v: 'Medium', hl: true }, { l: 'Department', s: 'hidden', hl: true }] },
        { name: 'When the form is submitted', what: 'Checked as the person clicks Save or Submit.',
          when: 'Last-moment checks — a field that must be filled only in some cases.',
          trigger: 'Requester clicks Submit with Priority = Urgent',
          before: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', v: '' }],
          after: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', s: 'req', v: '', hl: true }] },
      ] },
      { t: 'callout', tone: 'warn', text: '“When the form opens” runs **only once**. If your condition depends on a field the person changes later, use “While the form is being filled” instead.' },
    ],
  },
  {
    id: 'execute', group: 'Building blocks', icon: 'refresh', mins: 2,
    title: 'Execute on', sub: 'New requests, existing ones, or both',
    intro: 'The same form is used to raise a request and to edit it later. Execute on decides which of the two the rule works on.',
    blocks: [
      { t: 'options', items: [
        { name: 'On Create', what: 'Only while a new request is being raised.', when: 'Defaults and first-time questions.', example: 'Set Priority to Medium on every new request.' },
        { name: 'On Edit', what: 'Only when an existing request is opened and changed.', when: 'Locking fields that should not change after raising.', example: 'Disable Category once the request exists.' },
        { name: 'On Create and Edit', what: 'Both when raised and every time it is edited.', when: 'Rules that must always hold true.', example: 'Keep Urgency mandatory on new and existing requests.' },
      ] },
      { t: 'callout', tone: 'tip', text: 'Two rules that do opposite things can live together safely if one is **On Create** and the other **On Edit** — they never run on the same form.' },
    ],
  },
  {
    id: 'who', group: 'Building blocks', icon: 'users', mins: 2,
    title: 'Who the rule applies to', sub: 'Requesters, technicians or everyone',
    intro: 'Requesters raise requests from the self-service portal; technicians work them from the technician portal. One form, two audiences.',
    blocks: [
      { t: 'options', items: [
        { name: 'Requesters Only', what: 'Runs only for people raising requests in the portal.', when: 'Keeping the portal form short and free of internal fields.', example: 'Hide Technician Group and Assignee from requesters.' },
        { name: 'Technicians Only', what: 'Runs only for technicians in the technician portal.', when: 'Making sure the service desk captures what it needs.', example: 'Mandate Assignee and Category for technicians.' },
        { name: 'Everyone', what: 'Runs for anyone who opens the form.', when: 'Rules that are true no matter who fills the form.', example: 'Mandate Description when Priority is Urgent.' },
      ] },
    ],
  },
  {
    id: 'conditions', group: 'Building blocks', icon: 'filter', mins: 4,
    title: 'Conditions, AND and OR', sub: 'Decide when a rule should act',
    intro: 'A condition is **one check on one field**: a field, an operator and a value. Join checks with AND or OR, and use groups when you need both.',
    blocks: [
      { t: 'h', text: 'AND — every check must pass' },
      { t: 'rule', when: 'While the form is being filled', ifs: ['Priority is High', 'Category is Network'], join: 'AND', then: ['Mandate Impact'] },
      { t: 'p', text: 'Runs for a **High** priority **Network** request. A High priority Software request does not match.' },
      { t: 'h', text: 'OR — any one check is enough' },
      { t: 'rule', when: 'While the form is being filled', ifs: ['Priority is High', 'Impact is High'], join: 'OR', then: ['Show Business Justification'] },
      { t: 'p', text: 'Runs if the priority is High, **or** the impact is High, or both.' },
      { t: 'h', text: 'Groups — mixing AND with OR' },
      { t: 'p', text: 'One group reads one way: all AND or all OR. To say “(High **and** Network) **or** a VIP requester”, put the first two checks in one group and the VIP check in a second group, joined with OR.' },
      { t: 'callout', tone: 'tip', text: 'A dropdown condition can take several values: **Category is Hardware, Network** passes when any one of them is picked — no need for an OR.' },
      { t: 'h', text: 'No conditions' },
      { t: 'p', text: 'Leave the Check if section empty and the rule runs **every time** its event happens. Good for defaults like setting Priority on every new request.' },
    ],
  },
  {
    id: 'operators', group: 'Building blocks', icon: 'list', mins: 2,
    title: 'Operators by field type', sub: 'is, contains, before, greater than…',
    intro: 'The operators offered depend on the kind of field you check. Here is every one, with an example.',
    blocks: [
      { t: 'table', head: ['Field type', 'Operators', 'Example'], rows: [
        ['Text', 'contains · does not contain · is · is not · starts with · is empty · is not empty', 'Subject **contains** “VPN”'],
        ['Dropdown, multi-select, people', 'is · is not · is empty · is not empty', 'Category **is** Hardware, Network'],
        ['Number', 'is · is not · greater than · less than · is empty · is not empty', 'Cost **greater than** 50000'],
        ['Date', 'is · before · after · is empty · is not empty', 'Due Date **before** 31 Dec'],
        ['Checkbox', 'is checked · is not checked', 'VIP **is checked**'],
        ['Attachment', 'is empty · is not empty', 'Attachment **is empty**'],
      ] },
      { t: 'callout', tone: 'tip', text: '**is empty** is useful on submit: “When the form is submitted, if Attachment is empty, then mandate Attachment” asks for a file only when none was added.' },
    ],
  },
  {
    id: 'actions', group: 'Building blocks', icon: 'pointer', mins: 4,
    title: 'Actions', sub: 'What a rule can do to a field',
    intro: 'An action changes one or more fields. Each one below shows the form **before** and **after** the rule runs.',
    blocks: [
      { t: 'options', items: [
        { name: 'Mandate', what: 'The field becomes **mandatory** — the form cannot be saved until it is filled.', when: 'A field matters only in some cases.',
          before: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', v: '' }], after: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', s: 'req', hl: true }] },
        { name: 'Make optional', what: 'Lifts a mandatory rule, so the field may be left empty.', when: 'An exception to a field that is usually required.',
          before: [{ l: 'Attachment', s: 'req' }], after: [{ l: 'Attachment', v: '', hl: true }] },
        { name: 'Hide', what: 'Takes the field off the form. Its value is kept.', when: 'The question does not apply.',
          before: [{ l: 'Category', v: 'Software' }, { l: 'Vendor', v: '—' }], after: [{ l: 'Category', v: 'Software' }, { l: 'Vendor', s: 'hidden', hl: true }] },
        { name: 'Show', what: 'Brings a hidden field back.', when: 'A follow-up question that only some answers need.',
          before: [{ l: 'Category', v: 'Hardware' }, { l: 'Asset Tag', s: 'hidden' }], after: [{ l: 'Category', v: 'Hardware' }, { l: 'Asset Tag', v: '—', hl: true }] },
        { name: 'Disable', what: 'The field stays visible but is **read-only**.', when: 'People should see a value but not change it.',
          before: [{ l: 'Category', v: 'Network' }], after: [{ l: 'Category', s: 'ro', v: 'Network', hl: true }] },
        { name: 'Enable', what: 'Makes a read-only field editable again.', when: 'Undoing a Disable in a special case, like a reopened request.',
          before: [{ l: 'Category', s: 'ro', v: 'Network' }], after: [{ l: 'Category', v: 'Network', hl: true }] },
        { name: 'Set value', what: 'Fills the field with a value you choose.', when: 'Defaults and values that follow from another answer.',
          before: [{ l: 'Priority', v: '—' }], after: [{ l: 'Priority', v: 'Medium', hl: true }] },
        { name: 'Clear value', what: 'Empties the field.', when: 'An earlier answer no longer fits after a change.',
          before: [{ l: 'Category', v: 'Network' }, { l: 'Sub Category', v: 'Printer' }], after: [{ l: 'Category', v: 'Network' }, { l: 'Sub Category', v: '', hl: true }] },
      ] },
      { t: 'callout', tone: 'warn', text: '**Hide does not clear.** A hidden field keeps its value and is saved with the request. Add **Clear value** too if the old answer should go.' },
    ],
  },

  /* ── Real scenarios ─────────────────────────────────────────────────────────────────────── */
  {
    id: 'sc-asset', group: 'Real scenarios', icon: 'briefcase', mins: 2,
    title: 'Ask for an asset tag only for hardware', sub: 'Show + mandate a follow-up field',
    intro: 'Requesters should not see Asset Tag on every request — only when they report a hardware problem.',
    blocks: [
      { t: 'rule', title: 'Rule 1 · Hide Asset Tag at the start', when: 'When the form opens · On Create · Requesters Only', then: ['Hide Asset Tag'] },
      { t: 'rule', title: 'Rule 2 · Ask for it for hardware', when: 'While the form is being filled · On Create · Requesters Only', ifs: ['Category is Hardware'], then: ['Show Asset Tag', 'Mandate Asset Tag'] },
      { t: 'form', caption: 'What the requester sees', trigger: 'Category set to Hardware',
        before: [{ l: 'Category', v: 'Software' }, { l: 'Asset Tag', s: 'hidden' }], after: [{ l: 'Category', v: 'Hardware', hl: true }, { l: 'Asset Tag', s: 'req', hl: true }] },
      { t: 'callout', tone: 'tip', text: 'Put Rule 1 **above** Rule 2 in the Form Rules list, so the show always comes after the hide.' },
    ],
  },
  {
    id: 'sc-urgent', group: 'Real scenarios', icon: 'briefcase', mins: 1,
    title: 'Require a reason for urgent requests', sub: 'Mandate on submit',
    intro: 'Urgent requests jump the queue, so the service desk wants to know why.',
    blocks: [
      { t: 'rule', when: 'When the form is submitted · On Create and Edit · Everyone', ifs: ['Priority is Urgent'], then: ['Mandate Description'] },
      { t: 'form', caption: 'On submit', trigger: 'Submit with Priority = Urgent and no description',
        before: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', v: '' }], after: [{ l: 'Priority', v: 'Urgent' }, { l: 'Description', s: 'req', hl: true }] },
    ],
  },
  {
    id: 'sc-internal', group: 'Real scenarios', icon: 'briefcase', mins: 1,
    title: 'Keep internal fields away from requesters', sub: 'Hide for one audience',
    intro: 'Technician Group and Assignee mean nothing to a requester and invite wrong answers.',
    blocks: [
      { t: 'rule', when: 'When the form opens · On Create and Edit · Requesters Only', then: ['Hide Technician Group', 'Hide Assignee'] },
      { t: 'callout', tone: 'tip', text: 'Because it is **Requesters Only**, technicians still see both fields on the same form.' },
    ],
  },
  {
    id: 'sc-lock', group: 'Real scenarios', icon: 'briefcase', mins: 1,
    title: 'Lock the category after raising', sub: 'Disable on edit',
    intro: 'Reports break when Category changes after a request is raised.',
    blocks: [
      { t: 'rule', when: 'When the form opens · On Edit · Requesters Only', then: ['Disable Category'] },
      { t: 'form', caption: 'Opening an existing request', trigger: 'Requester opens their request',
        before: [{ l: 'Category', v: 'Network' }], after: [{ l: 'Category', s: 'ro', v: 'Network', hl: true }] },
    ],
  },
  {
    id: 'sc-default', group: 'Real scenarios', icon: 'briefcase', mins: 1,
    title: 'A sensible default priority', sub: 'Set value with no conditions',
    intro: 'An empty priority lands at the bottom of every queue. Start everyone at Medium.',
    blocks: [
      { t: 'rule', when: 'When the form opens · On Create · Everyone', then: ['Set Priority to Medium'] },
      { t: 'callout', tone: 'tip', text: 'No conditions needed — the rule runs on every new request, and people can still change the value.' },
    ],
  },
  {
    id: 'sc-clear', group: 'Real scenarios', icon: 'briefcase', mins: 1,
    title: 'Clear a dependent field', sub: 'Clear value when the parent changes',
    intro: 'A Sub Category picked for Network makes no sense once Category becomes Software.',
    blocks: [
      { t: 'rule', when: 'While the form is being filled · On Create and Edit · Everyone', ifs: ['Category is not empty'], then: ['Clear value Sub Category'] },
      { t: 'form', caption: 'Changing the category', trigger: 'Category changed to Software',
        before: [{ l: 'Category', v: 'Network' }, { l: 'Sub Category', v: 'VPN' }], after: [{ l: 'Category', v: 'Software', hl: true }, { l: 'Sub Category', v: '', hl: true }] },
    ],
  },

  /* ── Get it right ───────────────────────────────────────────────────────────────────────── */
  {
    id: 'dos', group: 'Get it right', icon: 'check', mins: 2,
    title: 'Do’s and don’ts', sub: 'Habits that keep rules easy to manage',
    intro: 'Most rule problems come from a handful of habits. These keep a growing list of rules easy to read and safe to change.',
    blocks: [
      { t: 'dodont',
        dos: ['Name rules after what they do', 'Check Similar rules before adding a new one', 'Use one rule per job — split big rules', 'Add Clear value when you hide a field that should not be saved', 'Test as the audience you chose (requester or technician)'],
        donts: ['Two rules that do opposite things to one field at the same time', 'Hide a field that another rule mandates — the form can never be saved', 'Use “When the form opens” for a condition people change later', 'Leave old rules enabled “just in case” — disable or delete them', 'Rely on run order to fix a conflict you could remove'] },
    ],
  },
  {
    id: 'order', group: 'Get it right', icon: 'order', mins: 2,
    title: 'Run order — which rule wins', sub: 'Top of the list first, last one wins',
    intro: 'When several rules act on the same field, the order of the Form Rules list decides the result.',
    blocks: [
      { t: 'steps', items: [
        { title: 'Rules run top to bottom', text: 'The number before each rule in the Form Rules list is its turn. Drag a row to change it.' },
        { title: 'The last one wins', text: 'If rule 3 sets Priority to High and rule 7 sets it to Medium, the form shows **Medium**.' },
        { title: 'Events run at their own moment', text: '“When the form opens” rules run first, “while being filled” rules on every change, and “when submitted” rules as the form is saved.' },
        { title: 'Disabled rules are skipped', text: 'They keep their place in the list but never run.' },
      ] },
      { t: 'callout', tone: 'warn', text: 'Run order hides conflicts rather than fixing them. Prefer narrowing conditions so both rules cannot run together.' },
    ],
  },
  {
    id: 'conflicts', group: 'Get it right', icon: 'alert', mins: 3,
    title: 'Similar rules and conflicts', sub: 'What the rule check is telling you',
    intro: 'While you build, every other rule is compared with yours. Two kinds of finding appear as cards at the top of this panel.',
    blocks: [
      { t: 'h', text: 'Similar rule' },
      { t: 'p', text: 'Another rule already uses **the same event and conditions**. Open it and add your actions there — one rule per situation is easier to look after than three.' },
      { t: 'h', text: 'Conflict — three kinds' },
      { t: 'options', items: [
        { name: 'Opposite', what: 'Two rules do opposite things to the same field at the same time.', when: 'Yours hides Status; “Status Always Visible” shows it.', example: 'The field flickers or ends in whichever state ran last.' },
        { name: 'Override', what: 'Two rules set the same field to different values.', when: 'Yours sets Priority to High; another sets Medium.', example: 'The rule lower in the list wins.' },
        { name: 'Blocking', what: 'One rule hides or disables a field another makes mandatory.', when: 'Yours hides Category; “Category Required Policy” mandates it.', example: 'The form can never be saved — the worst kind.' },
      ] },
    ],
  },

  /* ── Troubleshooting ────────────────────────────────────────────────────────────────────── */
  {
    id: 'notworking', group: 'Troubleshooting', icon: 'lifebuoy', mins: 3,
    title: 'My rule isn’t working', sub: 'A checklist, most likely cause first',
    intro: 'Go down the list in order — each check takes seconds, and the first five cover almost every case.',
    blocks: [
      { t: 'check', items: [
        { q: 'Is the rule enabled?', a: 'Find it in the Form Rules list and check its switch is on.' },
        { q: 'Are you testing as the right person?', a: 'A **Requesters Only** rule does nothing in the technician portal, and the other way round.' },
        { q: 'Does the event match what you are doing?', a: '“When the form opens” runs once. If you change a field after opening, use “While the form is being filled”.' },
        { q: 'Does Execute on match?', a: 'An **On Create** rule never runs when you open an existing request.' },
        { q: 'Do the conditions really pass?', a: 'Check the exact value (“Hardware” vs “Hardware & Peripherals”) and AND vs OR.' },
        { q: 'Does a later rule undo it?', a: 'Look for a rule lower in the list that acts on the same field — the last one wins.' },
        { q: 'Is the field on the form?', a: 'A rule cannot show a field that was removed in the Form Builder.' },
      ] },
    ],
  },
  {
    id: 'fixconflict', group: 'Troubleshooting', icon: 'wrench', mins: 3,
    title: 'Fixing a conflict', sub: 'Six ways, simplest first',
    intro: 'You rarely need more than one of these. Start at the top.',
    blocks: [
      { t: 'steps', items: [
        { title: 'Decide which rule should win', text: 'Keep the action on the rule that matches your intent and remove it from the other.' },
        { title: 'Narrow the conditions', text: 'Add a condition to one rule so both can never match the same request.' },
        { title: 'Separate them by Execute on', text: 'One On Create, the other On Edit — they never meet.' },
        { title: 'Separate them by audience', text: 'Requesters Only and Technicians Only rules never run for the same person.' },
        { title: 'Merge them', text: 'If both watch the same conditions, add your actions to the existing rule.' },
        { title: 'Change the run order', text: 'Last resort: drag the rule that should decide the field below the other.' },
      ] },
    ],
  },
  {
    id: 'faq', group: 'Troubleshooting', icon: 'help', mins: 2,
    title: 'Questions people ask', sub: 'Short answers to common questions',
    intro: 'If your question is not here, open the documentation from the Doc link under the page title.',
    blocks: [
      { t: 'faq', items: [
        { q: 'Can one rule change many fields?', a: 'Yes. Pick several fields in one action, or add more actions. They all run together.' },
        { q: 'Does hiding a field clear its value?', a: 'No. Add a **Clear value** action if the value should go too.' },
        { q: 'Can requesters see that a rule ran?', a: 'No. They only see the form change — a field appears, becomes required or fills in.' },
        { q: 'Should I edit an old rule or make a new one?', a: 'If a Similar rules card shows your trigger and conditions, edit that one. Make a new rule only when they differ.' },
        { q: 'Do rules change requests that are already saved?', a: 'No. Rules act on the form while someone has it open.' },
        { q: 'How many rules is too many?', a: 'There is no hard limit, but if two rules always run together, merge them.' },
      ] },
    ],
  },
];

/** Every word an article holds, for the search. */
export const articleText = (a: HelpArticle) => [a.title, a.sub, a.intro, ...a.blocks.map((b) => {
  switch (b.t) {
    case 'p': case 'h': case 'callout': return b.text;
    case 'steps': return b.items.map((i) => i.title + ' ' + i.text).join(' ');
    case 'options': return b.items.map((i) => [i.name, i.what, i.when, i.example ?? ''].join(' ')).join(' ');
    case 'rule': return [b.title ?? '', b.when, ...(b.ifs ?? []), ...b.then].join(' ');
    case 'form': return [b.caption ?? '', b.trigger ?? ''].join(' ');
    case 'dodont': return [...b.dos, ...b.donts].join(' ');
    case 'check': case 'faq': return b.items.map((i) => i.q + ' ' + i.a).join(' ');
    case 'table': return b.rows.flat().join(' ');
  }
})].join(' ').replace(/\*\*/g, '');
