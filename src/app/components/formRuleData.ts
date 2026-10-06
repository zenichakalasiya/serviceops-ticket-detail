/* Request Form Management — the request form's fields and the rules that act on them.
 *
 * ONE field list feeds both tabs: the Form Builder edits it and the rule editor picks from it, so a
 * field added in the builder is immediately something a rule can test or change. Two lists would
 * drift the first time somebody renamed a field. */

export type FieldKind =
  | 'text' | 'textarea' | 'dropdown' | 'multiselect' | 'user' | 'number' | 'date' | 'checkbox' | 'attachment';

export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  /** System fields ship with the product: they can be moved and relabelled, never deleted. */
  system?: boolean;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  width: 'half' | 'full';
  options?: string[];
}

export const FIELD_KINDS: { kind: FieldKind; label: string; icon: string }[] = [
  { kind: 'text', label: 'Text', icon: 'Type' },
  { kind: 'textarea', label: 'Text Area', icon: 'AlignLeft' },
  { kind: 'dropdown', label: 'Dropdown', icon: 'ChevronDownSquare' },
  { kind: 'multiselect', label: 'Multi-select', icon: 'ListChecks' },
  { kind: 'user', label: 'People', icon: 'User' },
  { kind: 'number', label: 'Number', icon: 'Hash' },
  { kind: 'date', label: 'Date', icon: 'Calendar' },
  { kind: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { kind: 'attachment', label: 'Attachment', icon: 'Paperclip' },
];

export const kindLabel = (k: FieldKind) => FIELD_KINDS.find((f) => f.kind === k)?.label ?? k;

export const PEOPLE = [
  { name: 'Alex Rivera', initials: 'AR', color: '#3D8BD0' },
  { name: 'Priya Shah', initials: 'PS', color: '#8B5CF6' },
  { name: 'Marcus Chen', initials: 'MC', color: '#10B981' },
  { name: 'Sara Lindqvist', initials: 'SL', color: '#F58518' },
  { name: 'Daniel Okafor', initials: 'DO', color: '#EF4444' },
  { name: 'Hannah Weber', initials: 'HW', color: '#0EA5E9' },
];

export const personOf = (name: string) => PEOPLE.find((p) => p.name === name);

export const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'requester', label: 'Requester', kind: 'user', system: true, required: true, width: 'half' },
  { id: 'subject', label: 'Subject', kind: 'text', system: true, required: true, width: 'full', placeholder: 'Briefly describe the issue' },
  { id: 'description', label: 'Description', kind: 'textarea', system: true, width: 'full', placeholder: 'Add the details a technician needs' },
  { id: 'status', label: 'Status', kind: 'dropdown', system: true, width: 'half', options: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'] },
  { id: 'priority', label: 'Priority', kind: 'dropdown', system: true, width: 'half', options: ['Low', 'Medium', 'High', 'Urgent'] },
  { id: 'urgency', label: 'Urgency', kind: 'dropdown', system: true, width: 'half', options: ['Low', 'Medium', 'High', 'Urgent'] },
  { id: 'impact', label: 'Impact', kind: 'dropdown', system: true, width: 'half', options: ['Low', 'On Users', 'On Department', 'On Business'] },
  { id: 'category', label: 'Category', kind: 'dropdown', system: true, width: 'half', options: ['Hardware', 'Software', 'Network', 'Access', 'Email', 'Facilities'] },
  { id: 'technician-group', label: 'Technician Group', kind: 'dropdown', system: true, width: 'half', options: ['Service Desk', 'Network Team', 'Infrastructure', 'Applications', 'Security'] },
  { id: 'assignee', label: 'Assignee', kind: 'user', system: true, width: 'half' },
  { id: 'tags', label: 'Tags', kind: 'multiselect', system: true, width: 'half', options: ['Internal', 'VIP', 'Outage', 'Onboarding', 'Hardware', 'Compliance'] },
  { id: 'department', label: 'Department', kind: 'dropdown', system: true, width: 'half', options: ['Finance', 'HR', 'IT', 'Sales', 'Operations', 'Legal'] },
  { id: 'location', label: 'Location', kind: 'dropdown', system: true, width: 'half', options: ['Ahmedabad HQ', 'Pune', 'Bengaluru', 'London', 'Remote'] },
  { id: 'cc-emails', label: 'CC Emails', kind: 'text', width: 'half', placeholder: 'name@company.com' },
  { id: 'vendor', label: 'Vendor', kind: 'dropdown', width: 'half', options: ['Dell', 'Microsoft', 'Cisco', 'Lenovo', 'Zoho'] },
  { id: 'due-by', label: 'Due By', kind: 'date', width: 'half' },
  { id: 'affected-users', label: 'Affected Users', kind: 'number', width: 'half' },
  { id: 'attachments', label: 'Attachments', kind: 'attachment', width: 'full' },
];

// ── Rules ──────────────────────────────────────────────────────────────────

export type RuleApplies = 'Requesters' | 'Technicians' | 'Everyone';
export type RuleEvent = 'On Field Change' | 'On Form Load' | 'On Form Submit';
export type RuleExecution = 'On Create' | 'On Edit' | 'On Create and Edit';

/** What the admin reads in the editor, beside what the listing prints for the same value. */
/** A hover tip on a dropdown option: what it means, and one example of a rule using it. */
export interface OptionTip { desc: string; example: string }
export const APPLIES_OPTIONS: { value: RuleApplies; label: string; tip: OptionTip }[] = [
  { value: 'Requesters', label: 'Requesters Only', tip: { desc: 'Runs only for people raising requests from the self-service portal.', example: 'Hide Technician Group from requesters.' } },
  { value: 'Technicians', label: 'Technicians Only', tip: { desc: 'Runs only for technicians working on requests in the technician portal.', example: 'Make Assignee mandatory for technicians.' } },
  { value: 'Everyone', label: 'Everyone', tip: { desc: 'Runs for anyone who opens the form, no matter who they are.', example: 'Require Priority for everyone who opens the form.' } },
];
export const EVENT_OPTIONS: { value: RuleEvent; label: string; tip: OptionTip }[] = [
  { value: 'On Field Change', label: 'While the form is being filled', tip: { desc: 'Runs every time a field the rule watches changes, while the form is open.', example: 'Show Vendor the moment Category is set to Hardware.' } },
  { value: 'On Form Load', label: 'When the form opens', tip: { desc: 'Runs once, as the form is first shown.', example: 'Hide Department on every new request until it is needed.' } },
  { value: 'On Form Submit', label: 'When the form is submitted', tip: { desc: 'Runs as the requester or technician saves the form.', example: 'Make Description mandatory when Priority is Urgent.' } },
];
export const EXECUTION_OPTIONS: { value: RuleExecution; label: string; tip: OptionTip }[] = [
  { value: 'On Create', label: 'On Create', tip: { desc: 'Runs only while a new request is being raised.', example: 'Set Priority to Medium on every new request.' } },
  { value: 'On Edit', label: 'On Edit', tip: { desc: 'Runs only when an existing request is opened and changed.', example: 'Lock Category once the request has been raised.' } },
  { value: 'On Create and Edit', label: 'On Create and Edit', tip: { desc: 'Runs when a request is raised and every time it is edited.', example: 'Keep Urgency mandatory on new and existing requests.' } },
];

export type Operator =
  | 'is' | 'is not' | 'contains' | 'does not contain' | 'starts with' | 'is empty' | 'is not empty'
  | 'greater than' | 'less than' | 'before' | 'after' | 'is checked' | 'is not checked';

export const operatorsFor = (k: FieldKind): Operator[] => {
  switch (k) {
    case 'text': case 'textarea': return ['contains', 'does not contain', 'is', 'is not', 'starts with', 'is empty', 'is not empty'];
    case 'dropdown': case 'multiselect': case 'user': return ['is', 'is not', 'is empty', 'is not empty'];
    case 'number': return ['is', 'is not', 'greater than', 'less than', 'is empty', 'is not empty'];
    case 'date': return ['is', 'before', 'after', 'is empty', 'is not empty'];
    case 'checkbox': return ['is checked', 'is not checked'];
    case 'attachment': return ['is empty', 'is not empty'];
  }
};

/** Operators that stand on their own — no value to compare against. */
export const NO_VALUE: Operator[] = ['is empty', 'is not empty', 'is checked', 'is not checked'];

export interface Condition {
  id: string;
  /** How this row joins the one above it. The first row of a group has none ("Where"). */
  join: 'And' | 'Or';
  fieldId: string;
  op: Operator | '';
  /** Text/number/date keep one entry; choice fields keep every picked option. */
  value: string[];
}

export interface ConditionGroup {
  id: string;
  /** How this group joins the one above it. */
  join: 'And' | 'Or';
  conditions: Condition[];
}

export type ActionType = 'Mandate' | 'Make optional' | 'Hide' | 'Show' | 'Disable' | 'Enable' | 'Set value' | 'Clear value';

export const ACTION_TYPES: { value: ActionType; hint: string }[] = [
  { value: 'Mandate', hint: 'The field must be filled before saving' },
  { value: 'Make optional', hint: 'Lift a required rule' },
  { value: 'Hide', hint: 'Remove the field from the form' },
  { value: 'Show', hint: 'Bring a hidden field back' },
  { value: 'Disable', hint: 'Show the field read-only' },
  { value: 'Enable', hint: 'Make a read-only field editable' },
  { value: 'Set value', hint: 'Fill the field with a value' },
  { value: 'Clear value', hint: 'Empty the field' },
];

export interface RuleAction {
  id: string;
  type: ActionType | '';
  fieldIds: string[];
  /** Only for Set value — and then only one field can be set at a time. */
  value: string[];
}

export interface FormRule {
  id: string;
  name: string;
  description: string;
  applies: RuleApplies;
  event: RuleEvent;
  execution: RuleExecution;
  tags: string[];
  groups: ConditionGroup[];
  actions: RuleAction[];
  reverse: boolean;
  enabled: boolean;
  createdAt: string;
  conflicts: number;
}

let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const blankCondition = (join: 'And' | 'Or' = 'And'): Condition => ({ id: uid('c'), join, fieldId: '', op: '', value: [] });
export const blankGroup = (join: 'And' | 'Or' = 'And'): ConditionGroup => ({ id: uid('g'), join, conditions: [blankCondition()] });
export const blankAction = (): RuleAction => ({ id: uid('a'), type: '', fieldIds: [], value: [] });

const g = (conditions: Omit<Condition, 'id'>[], join: 'And' | 'Or' = 'And'): ConditionGroup =>
  ({ id: uid('g'), join, conditions: conditions.map((c) => ({ ...c, id: uid('c') })) });
const a = (type: ActionType, fieldIds: string[], value: string[] = []): RuleAction => ({ id: uid('a'), type, fieldIds, value });

const r = (
  name: string, execution: RuleExecution, applies: RuleApplies, event: RuleEvent, createdAt: string,
  extra: Partial<FormRule> = {},
): FormRule => ({
  /* STABLE id from the name, not uid(): a rule is opened in a new tab by its id, and the new tab
     builds its seeds again — a clock-based id would never match across tabs. */
  id: 'rule-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, description: '', applies, event, execution, tags: [], reverse: false, enabled: true,
  createdAt, conflicts: 0,
  groups: [g([{ join: 'And', fieldId: 'priority', op: 'is', value: ['High', 'Urgent'] }])],
  actions: [a('Mandate', ['assignee'])],
  ...extra,
});

export const SEED_RULES: FormRule[] = [
  r('High Priority / Urgent Mandate Request – Assignee', 'On Create and Edit', 'Technicians', 'On Field Change', 'Fri, Jul 03, 2026 05:24 PM', {
    conflicts: 8, tags: ['Priority'],
    description: 'Every high or urgent request has to have an owner before it can be saved.',
    groups: [
      g([
        { join: 'And', fieldId: 'subject', op: 'contains', value: ['Network and the server down'] },
        { join: 'And', fieldId: 'tags', op: 'is', value: ['Internal', 'VIP', 'Outage', 'Hardware', 'Compliance'] },
        { join: 'And', fieldId: 'assignee', op: 'is not', value: ['Alex Rivera', 'Priya Shah', 'Marcus Chen', 'Sara Lindqvist'] },
      ]),
      g([{ join: 'And', fieldId: 'subject', op: 'contains', value: ['Network and the server down'] }], 'And'),
    ],
    actions: [a('Mandate', ['category', 'urgency', 'impact', 'technician-group', 'department']), a('Hide', ['assignee', 'vendor', 'due-by', 'location'])],
    reverse: true,
  }),
  r('hide request cc emails', 'On Create', 'Everyone', 'On Form Load', 'Fri, Jul 03, 2026 05:14 PM', {
    groups: [], actions: [a('Hide', ['cc-emails'])],
  }),
  r('Subject Line Needed', 'On Create', 'Requesters', 'On Form Submit', 'Fri, Jul 03, 2026 04:38 PM', {
    groups: [], actions: [a('Mandate', ['subject'])],
  }),
  r('Optional Assignee for Urgent Requests', 'On Edit', 'Technicians', 'On Form Load', 'Fri, Jul 03, 2026 02:45 PM', {
    conflicts: 6,
    groups: [g([{ join: 'And', fieldId: 'priority', op: 'is', value: ['Urgent'] }])],
    actions: [a('Make optional', ['assignee'])],
  }),
  r('Optional Assignee for High Priority Requests', 'On Create', 'Everyone', 'On Field Change', 'Thu, Jul 02, 2026 06:19 PM', {
    actions: [a('Make optional', ['assignee'])],
  }),
  r('Copy of High Priority Request for VIP Clients', 'On Create and Edit', 'Technicians', 'On Field Change', 'Thu, Jul 02, 2026 04:05 PM', {
    groups: [g([{ join: 'And', fieldId: 'tags', op: 'is', value: ['VIP'] }])],
    actions: [a('Set value', ['priority'], ['High'])],
  }),
  r('Copy of Auto Close for Resolved Incidents', 'On Create', 'Technicians', 'On Form Load', 'Thu, Jul 02, 2026 03:19 PM', {
    enabled: false,
    groups: [g([{ join: 'And', fieldId: 'status', op: 'is', value: ['Resolved'] }])],
    actions: [a('Disable', ['category', 'impact'])],
  }),
  r('Vendor Change Notification', 'On Create', 'Technicians', 'On Form Submit', 'Tue, Jun 23, 2026 12:24 PM', {
    groups: [g([{ join: 'And', fieldId: 'category', op: 'is', value: ['Hardware'] }])],
    actions: [a('Show', ['vendor']), a('Mandate', ['vendor'])],
  }),
  r('Contract Renewal Alert', 'On Create', 'Everyone', 'On Form Submit', 'Mon, Jul 15, 2026 08:00 AM', {
    conflicts: 7,
    groups: [g([{ join: 'And', fieldId: 'category', op: 'is', value: ['Software'] }])],
    actions: [a('Mandate', ['due-by'])],
  }),
  r('Quality Assurance Review', 'On Edit', 'Everyone', 'On Field Change', 'Wed, Aug 10, 2026 02:30 PM', {
    groups: [g([{ join: 'And', fieldId: 'status', op: 'is', value: ['Resolved'] }])],
    actions: [a('Mandate', ['description'])],
  }),
  r('Hardware Requests Need a Location', 'On Create and Edit', 'Requesters', 'On Field Change', 'Tue, Jun 23, 2026 12:24 PM', {
    groups: [g([{ join: 'And', fieldId: 'category', op: 'is', value: ['Hardware'] }])],
    actions: [a('Mandate', ['location'])],
  }),
  r('Assignment Policy', 'On Create and Edit', 'Everyone', 'On Field Change', 'Mon, Aug 24, 2026 10:12 AM', {
    groups: [g([{ join: 'And', fieldId: 'priority', op: 'is', value: ['High'] }])],
    actions: [a('Mandate', ['assignee', 'status']), a('Set value', ['technician-group'], ['Service Desk'])],
  }),
  r('Portal Cleanup Rule', 'On Create', 'Everyone', 'On Field Change', 'Tue, Aug 25, 2026 04:40 PM', {
    groups: [g([{ join: 'And', fieldId: 'priority', op: 'is', value: ['High'] }])],
    actions: [a('Show', ['category']), a('Hide', ['assignee'])],
  }),
  /* Broad rules (no condition, or a common one) touching the fields admins most often act on —
     so a typical new rule demonstrates conflicts with several rules at once. */
  r('Status Always Visible', 'On Create and Edit', 'Everyone', 'On Form Load', 'Wed, Aug 26, 2026 09:10 AM', {
    groups: [], actions: [a('Show', ['status']), a('Enable', ['status'])],
  }),
  r('Lock Status for Requesters', 'On Create and Edit', 'Requesters', 'On Form Load', 'Wed, Aug 26, 2026 11:42 AM', {
    groups: [], actions: [a('Disable', ['status'])],
  }),
  r('Category Required Policy', 'On Create and Edit', 'Everyone', 'On Form Submit', 'Thu, Aug 27, 2026 03:05 PM', {
    groups: [], actions: [a('Mandate', ['category', 'status'])],
  }),
  r('Priority Defaults to Medium', 'On Create', 'Everyone', 'On Form Load', 'Fri, Aug 28, 2026 10:20 AM', {
    groups: [], actions: [a('Set value', ['priority'], ['Medium']), a('Show', ['urgency', 'impact'])],
  }),
  r('Requester Simplified Form', 'On Create', 'Requesters', 'On Form Load', 'Mon, Aug 31, 2026 01:15 PM', {
    groups: [], actions: [a('Hide', ['urgency', 'impact']), a('Make optional', ['category'])],
  }),
  r('Service Desk Default Assignment', 'On Create and Edit', 'Everyone', 'On Field Change', 'Tue, Sep 01, 2026 05:48 PM', {
    groups: [g([{ join: 'And', fieldId: 'priority', op: 'is', value: ['High', 'Urgent'] }])],
    actions: [a('Set value', ['technician-group'], ['Service Desk']), a('Show', ['assignee'])],
  }),
  r('Request priority high shows request subject', 'On Create', 'Requesters', 'On Form Submit', 'Fri, Sep 05, 2026 11:15 AM', {
    actions: [a('Show', ['subject'])],
  }),
];
