/* The form builder (Form Studio) — every admin form module's data and the help it shows.
 *
 * Each admin "… Form" / "… Custom Fields" page on 172.16.15.185 is ONE form edited in place (read
 * 2 Nov 2026), so each module here is one form, opened straight into the builder. The fields are the
 * ones .185 shows on that page, grouped into sections for the redesign; obvious test fields on the
 * server ("Rohan", "jjj", "New Dropdown"…) are left out. A form is the product's flat field list:
 * a `section` field starts a section and carries its settings (columns, who sees it, show when). */

import type { FieldKind, FormField } from './formRuleData';

export interface FormModule {
  /** URL slug — #/admin/<slug>. */
  slug: string;
  /** The ADMIN_SECTIONS title and card title the admin nav routes by. */
  section: string;
  card: string;
  title: string;
  sub: string;
  /** What one record of this form is called, for copy ("a problem", "a vendor"). */
  noun: string;
  /** Custom-field pages hold only the admin's own fields — the product's own fields are not on them. */
  customOnly?: boolean;
  seed: () => FormField[];
}

let n = 0;
const id = (p: string) => `${p}-${++n}`;
type Extra = Partial<FormField>;
const F = (label: string, kind: FieldKind, x: Extra = {}): FormField => ({ id: id('f'), label, kind, width: 'half', ...x });
const sys = (label: string, kind: FieldKind, x: Extra = {}) => F(label, kind, { system: true, ...x });
const req = { required: true, requesterRequired: true };
const full = { width: 'full' as const };
/** A section: its title, one line under it, and its column count. */
const S = (label: string, helpText = '', x: Extra = {}): FormField => F(label, 'section', { width: 'full', helpText, cols: 2, ...x });

const opts = {
  status: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'],
  level: ['Low', 'Medium', 'High', 'Urgent'],
  impact: ['Low', 'On Users', 'On Department', 'On Business'],
  category: ['Hardware', 'Software', 'Network', 'Access', 'Email', 'Facilities'],
  group: ['Service Desk', 'Network Team', 'Infrastructure', 'Applications', 'Security'],
  department: ['Finance', 'HR', 'IT', 'Sales', 'Operations', 'Legal'],
  location: ['Ahmedabad HQ', 'Pune', 'Bengaluru', 'London', 'Remote'],
  vendor: ['Dell', 'Microsoft', 'Cisco', 'Lenovo', 'Zoho'],
  company: ['Motadata', 'Acme Corp'],
  tags: ['Internal', 'VIP', 'Outage', 'Onboarding', 'Hardware', 'Compliance'],
  risk: ['Low', 'Medium', 'High'],
};
const ticketTail = (): FormField[] => [
  S('Assignment', 'Who works on it, and where it belongs.'),
  sys('Technician Group', 'dropdown', { options: opts.group }), sys('Assignee', 'user'),
  sys('Department', 'dropdown', { options: opts.department }), sys('Location', 'dropdown', { options: opts.location }),
  sys('Vendor', 'dropdown', { options: opts.vendor }), sys('Company', 'dropdown', { options: opts.company }),
  S('Tags & files', '', { cols: 1 }),
  sys('Tags', 'multiselect', { options: opts.tags, ...full }), sys('Attachment', 'attachment', full),
];
const ticketHead = (noun: string): FormField[] => [
  S(`${noun} details`, `What the ${noun.toLowerCase()} is about and who raised it.`),
  sys('Fill From Template', 'dropdown', { options: ['None'], requesterView: false }), sys('Transition Model', 'dropdown', { options: ['Default'], requesterView: false }),
  sys('Requester', 'user', req), sys('Cc Emails', 'text', { placeholder: 'name@company.com' }),
  sys('Subject', 'text', { ...req, ...full, placeholder: 'A few words that say what it is' }),
  sys('Description', 'richtext', { ...full, placeholder: 'What happened, since when, and what was already tried' }),
];

export const FORM_MODULES: FormModule[] = [
  {
    slug: 'user-form', section: 'Users', card: 'User Form', title: 'User Form', noun: 'user',
    sub: 'Customize user profile fields and form layout.',
    seed: () => [
      S('Profile', 'Who the user is and how to reach them.'),
      sys('Profile Photo', 'attachment', req), sys('Name', 'text', req), sys('Email', 'text'), sys('Logon Name', 'text'),
      sys('Contact No', 'text'), sys('Alternate Contact No. 1', 'text'), sys('Alternate Contact No. 2', 'text'),
      sys('Timezone', 'dropdown', { options: ['(GMT+05:30) Asia/Kolkata', '(GMT+00:00) Europe/London'] }), sys('VIP', 'checkbox'), sys('Signature', 'richtext', full),
      S('Organization', 'Where the user sits and who they report to.'),
      sys('Company', 'dropdown', { options: opts.company }), sys('Restrict Data Access To Own Company', 'checkbox'),
      sys('Department', 'dropdown', { options: opts.department }), sys('Location', 'dropdown', { options: opts.location }),
      sys('Manager', 'user'), sys('Groups', 'multiselect', { options: opts.group }), sys('Support Level', 'dropdown', { options: ['Tier 1', 'Tier 2', 'Tier 3'] }),
      S('Access', 'What the user may do in ServiceOps.', { techOnly: true }),
      sys('Roles', 'multiselect', { ...req, options: ['Technician', 'Admin', 'Requester'] }), sys('License Type', 'dropdown', { ...req, options: ['Technician', 'Requester'] }),
      sys('Custom Scope', 'dropdown', { ...req, ...full, options: ['All', 'Own Company'] }), sys('Asset / CI Custom Scope', 'dropdown', { ...req, options: ['All', 'Own Company'] }),
      sys('Allow to Login', 'checkbox'), sys('Verified', 'checkbox'), sys('Do Not Disturb', 'checkbox'), sys('Two-Factor Authentication', 'checkbox'),
      sys('Allow to Delegate Approval/Mark Leave', 'checkbox'), sys('Allow to Delegate Approval/Mark Leave for Team', 'checkbox'),
      sys('Allow to Configure Work Delegation for Self', 'checkbox'), sys('Allow to Configure Work Delegation for Team', 'checkbox'),
      S('Date & time', 'How dates and times read for this user.'),
      sys('Date Time Format', 'dropdown', { ...req, options: ['DD/MM/YYYY hh:mm A', 'MM/DD/YYYY hh:mm A'] }), sys('Date Format', 'dropdown', { ...req, options: ['DD/MM/YYYY', 'MM/DD/YYYY'] }),
      sys('Time Format', 'dropdown', { ...req, options: ['12 hours', '24 hours'] }),
    ],
  },
  {
    slug: 'request-form', section: 'Request Management', card: 'Request Form', title: 'Request Form', noun: 'request',
    sub: 'Customize form fields and layout for requests.', seed: () => [],
  },
  {
    slug: 'feedback-form', section: 'Request Management', card: 'Feedback Form', title: 'Feedback Form', noun: 'feedback',
    sub: 'Configure feedback forms used at request closure.',
    seed: () => [
      S('Your feedback', 'Shown to the requester when their request is closed.', { cols: 1 }),
      F('Feedback', 'richtext', { ...full, placeholder: 'Tell us how we did' }), F('Attachment', 'attachment', full),
    ],
  },
  {
    slug: 'problem-form', section: 'Problem Management', card: 'Problem Form', title: 'Problem Form', noun: 'problem',
    sub: 'Customize form fields to capture problem details.',
    seed: () => [
      ...ticketHead('Problem'),
      S('Classification', 'How serious it is and whether it is a known error.'),
      sys('Status', 'dropdown', { options: opts.status }), sys('Nature Of Problem', 'dropdown', { ...req, options: ['Proactive', 'Reactive'] }),
      sys('Due By', 'date', req), sys('Known Error', 'dropdown', { ...req, options: ['Yes', 'No'] }),
      sys('Priority', 'dropdown', { options: opts.level }), sys('Urgency', 'dropdown', { options: opts.level }),
      sys('Impact', 'dropdown', { options: opts.impact }), sys('Category', 'dropdown', { options: opts.category }),
      ...ticketTail(),
    ],
  },
  {
    slug: 'change-form', section: 'Change Management', card: 'Change Form', title: 'Change Form', noun: 'change',
    sub: 'Customize form fields to capture change details.',
    seed: () => [
      ...ticketHead('Change'),
      S('Schedule & risk', 'When the change runs and how risky it is.'),
      sys('Start Date', 'date', req), sys('End Date', 'date', req),
      sys('Priority', 'dropdown', { options: opts.level }), sys('Urgency', 'dropdown', { options: opts.level }),
      sys('Impact', 'dropdown', { options: opts.impact }), sys('Category', 'dropdown', { options: opts.category }),
      sys('Change Risk', 'dropdown', { options: opts.risk }), sys('Change Type', 'dropdown', { options: ['Standard', 'Normal', 'Emergency'] }),
      sys('Change Reason', 'dropdown', { options: ['Upgrade', 'Fix', 'New service'] }), sys('Target Environment', 'dropdown', { options: ['Production', 'Staging', 'Test'] }),
      S('Change roles', 'Who implements, manages and reviews the change.', { cols: 3, techOnly: true }),
      sys('Change Implementer', 'user'), sys('Change Manager', 'user'), sys('Change Reviewer', 'user'),
      ...ticketTail(),
    ],
  },
  {
    slug: 'release-form', section: 'Release Management', card: 'Release Form', title: 'Release Form', noun: 'release',
    sub: 'Customize form fields to capture release details.',
    seed: () => [
      ...ticketHead('Release'),
      S('Schedule & risk', 'When the release goes out and how risky it is.'),
      sys('Start Date', 'date', req), sys('End Date', 'date', req),
      sys('Priority', 'dropdown', { options: opts.level }), sys('Urgency', 'dropdown', { options: opts.level }),
      sys('Impact', 'dropdown', { options: opts.impact }), sys('Category', 'dropdown', { options: opts.category }),
      sys('Release Risk', 'dropdown', { options: opts.risk }), sys('Release Type', 'dropdown', { options: ['Major', 'Minor', 'Emergency'] }),
      sys('Release Reason', 'dropdown', { options: ['New feature', 'Fix', 'Upgrade'] }), sys('Business Services', 'multiselect', { options: ['Email', 'ERP', 'VPN', 'Portal'] }),
      ...ticketTail(),
    ],
  },
  {
    slug: 'task-form', section: 'Task Management', card: 'Task Form', title: 'Task Form', noun: 'task',
    sub: 'Customize form fields to capture task details.',
    seed: () => [
      S('Task details', 'What has to be done.'),
      sys('Subject', 'text', { ...req, ...full }), sys('Task Name', 'text', full), sys('Task Type', 'dropdown', { options: ['Implementation', 'Review', 'Testing'] }),
      sys('User Group', 'dropdown', { options: opts.group }), sys('Description', 'richtext', full), sys('Attachment', 'attachment', full),
      S('Owner & status', 'Who does it and where it stands.'),
      sys('Tech Group', 'dropdown', { options: opts.group }), sys('Assignee', 'user'), sys('Status', 'dropdown', { options: opts.status }),
      sys('Priority', 'dropdown', { options: opts.level }), sys('Completion (%)', 'number'),
      S('Schedule', 'When it runs, and when to remind the assignee.'),
      sys('Start Date', 'date'), sys('End Date', 'date'), sys('Duration (Days)', 'number'),
      sys('Estimated Time', 'dropdown', { ...req, options: ['1 hour', '4 hours', '1 day', '1 week'] }), sys('Notify Before', 'dropdown', { options: ['1 hour', '1 day'] }),
    ],
  },
  {
    slug: 'project-form', section: 'Project Management', card: 'Project Form', title: 'Project Form', noun: 'project',
    sub: 'Customize form fields to capture project details.',
    seed: () => [
      S('Project', 'What the project is and when it runs.'),
      sys('Name', 'text', { ...req, ...full }), sys('Description', 'richtext', full),
      sys('Project Start Date', 'date', req), sys('Project End Date', 'date', req),
      S('Classification', 'How the project is tracked.'),
      sys('Priority', 'dropdown', { ...req, options: opts.level }), sys('Project Type', 'dropdown', { ...req, options: ['Internal', 'Customer'] }),
      sys('Project Risk', 'dropdown', { ...req, options: opts.risk }), sys('Owner', 'user', req),
      sys('Project Status', 'dropdown', { ...req, options: ['Planned', 'In Progress', 'Completed'] }), sys('Location', 'dropdown', { options: opts.location }),
      sys('Vendor', 'dropdown', { options: opts.vendor }), sys('Tags', 'multiselect', { options: opts.tags }),
      S('More details', '', { cols: 1 }),
      F('Detailed Overview', 'richtext', full), F('Attachment', 'attachment', { ...full, ...req }),
    ],
  },
  { slug: 'software-license-fields', section: 'Asset Management', card: 'Software License Custom Fields', title: 'Software License Custom Fields', noun: 'software license', customOnly: true,
    sub: 'Add custom fields to capture software license details.', seed: () => [S('Custom fields'), F('Purchase Date', 'date')] },
  { slug: 'asset-movement-fields', section: 'Asset Management', card: 'Asset Movement Custom Fields', title: 'Asset Movement Custom Fields', noun: 'asset movement', customOnly: true,
    sub: 'Add custom fields to capture asset movement details.', seed: () => [] },
  { slug: 'product-fields', section: 'Supplier Management', card: 'Product Custom Fields', title: 'Product Custom Fields', noun: 'product', customOnly: true,
    sub: 'Add custom fields to capture product details.', seed: () => [] },
  { slug: 'vendor-fields', section: 'Supplier Management', card: 'Vendor Custom Fields', title: 'Vendor Custom Fields', noun: 'vendor', customOnly: true,
    sub: 'Add custom fields to capture vendor details.', seed: () => [] },
  { slug: 'contract-fields', section: 'Contract Management', card: 'Contract Custom Fields', title: 'Contract Custom Fields', noun: 'contract', customOnly: true,
    sub: 'Add custom fields to capture contract details.', seed: () => [] },
  { slug: 'purchase-fields', section: 'Purchase Management', card: 'Purchase Custom Fields', title: 'Purchase Custom Fields', noun: 'purchase order', customOnly: true,
    sub: 'Add custom fields to capture purchase order details.', seed: () => [] },
  { slug: 'purchase-price-fields', section: 'Purchase Management', card: 'Purchase Price Fields', title: 'Purchase Price Fields', noun: 'purchase price', customOnly: true,
    sub: 'Configure pricing components like tax, shipping, and discounts.', seed: () => [S('Price components', 'Added to every purchase order total.'), F('Tax', 'number'), F('GST', 'number')] },
];

export const formModuleBySlug = (slug: string) => FORM_MODULES.find((m) => m.slug === slug);
export const formModuleByCard = (section: string, card: string) => FORM_MODULES.find((m) => m.section === section && m.card === card);

/** The Request form's sections — Request keeps its own field list (shared with Form Rules), so only
 *  its section headers come from here, placed before the field ids they open. */
export const REQUEST_SECTIONS: { before: string; field: FormField }[] = [
  { before: 'requester', field: S('Request details', 'What the request is about and who raised it.') },
  { before: 'status', field: S('Classification', 'How urgent it is and what kind of request it is.') },
  { before: 'technician-group', field: S('Assignment', 'Who works on it, and where it belongs.') },
  { before: 'cc-emails', field: S('More details', '') },
];

/* ── Help: what each field type is, how to configure it, an example ── */
export interface TypeHelp { kind: FieldKind; desc: string; what: string; how: string; example: string }
export const TYPE_HELP: TypeHelp[] = [
  { kind: 'text', desc: 'One line — a name, a tag, an email', what: 'A single line of text, for short answers like a name, an asset tag or an email address.', how: 'Name it in the requester’s words. Put an example in the hint text so people see the shape you expect.', example: 'Asset tag · hint "LAP-1042"' },
  { kind: 'textarea', desc: 'Several lines of plain text', what: 'A box for several lines, for justifications and notes.', how: 'Keep it optional unless the record cannot be worked without it. Use the hint to say what a good answer includes.', example: 'Business justification · hint "Why it is needed and by when"' },
  { kind: 'richtext', desc: 'Formatted text — bold, lists, images', what: 'A box with formatting: bold, lists, links and pasted images.', how: 'Use it where people paste error messages or screenshots. Give it the full row so the toolbar has room.', example: 'Description · full row' },
  { kind: 'dropdown', desc: 'Pick one from a list you type', what: 'The person picks one value from a list you type here.', how: 'One option per line; paste a column from Excel. Keep the list under about fifteen — longer lists read better as a Dependent field with levels.', example: 'Laptop model · Dell Latitude 7440 / Lenovo T14' },
  { kind: 'multiselect', desc: 'Pick several from a list', what: 'The person picks any number of values from a list you type.', how: 'Use it only when more than one answer can be true at once. One option per line.', example: 'Affected services · Email, VPN' },
  { kind: 'date', desc: 'A date and time', what: 'A calendar date with a time.', how: 'Name it for the moment it marks ("Needed by"), not for the type ("Date").', example: 'Needed by' },
  { kind: 'number', desc: 'A quantity — seats, cost, count', what: 'A number.', how: 'Say the unit in the name ("Duration (Days)") so nobody has to guess.', example: 'Seats required' },
  { kind: 'checkbox', desc: 'Yes or no', what: 'A single yes / no.', how: 'Write the name as the statement being agreed to. Make it required only when it must be ticked to submit, such as an acknowledgement.', example: 'I have backed up my files · required' },
  { kind: 'radio', desc: 'Pick one, every option visible', what: 'The person picks one value, with every option shown at once.', how: 'Use it for two to five short options people should compare; more than that, use a Dropdown.', example: 'Working from · Office / Home' },
  { kind: 'attachment', desc: 'Files the person uploads', what: 'One or more files attached to the record.', how: 'Say in the hint what to attach (a screenshot, the error). Keep it optional unless a document is the request itself.', example: 'Screenshot · optional' },
  { kind: 'dependent', desc: 'Pick through levels — Hardware › Laptop', what: 'A list with levels: the second choice depends on the first, like Hardware › Laptop › Battery.', how: 'Type the levels with Tab for a child line. Requesters usually have to pick the most specific level so routing works.', example: 'Category · Hardware ⇥ Laptop · Software ⇥ License' },
  { kind: 'label', desc: 'Text on the form, no answer', what: 'A line of text shown on the form — an instruction or a note. It holds no answer.', how: 'Use it sparingly, for a rule people must know before they fill the fields under it.', example: '"Laptops are replaced every 3 years."' },
  { kind: 'user', desc: 'A person from the directory', what: 'A person picked from the user directory.', how: 'The product provides these fields (Requester, Assignee). Choose who may see and change them.', example: 'Assignee' },
  { kind: 'section', desc: 'A heading that groups fields', what: 'A heading that groups the fields under it.', how: 'Group fields that belong to one answer so one condition can show or hide them together.', example: 'Hardware details · shown when Category is Hardware' },
];
export const typeHelp = (k: FieldKind) => TYPE_HELP.find((t) => t.kind === k) ?? TYPE_HELP[0];
/** What the add menu offers: every type an admin can place. People fields are the product's own. */
export const ADDABLE_KINDS: FieldKind[] = ['text', 'textarea', 'richtext', 'dropdown', 'multiselect', 'radio', 'checkbox', 'date', 'number', 'attachment', 'dependent', 'label'];

/** The guide — how to build a custom form. Shown when nothing is selected (V1) and in the Guide tab (V2). */
export const BUILD_GUIDE: { title: string; text: string }[] = [
  { title: 'Group fields into sections', text: 'A section is a heading and the fields under it. Put fields that belong to one answer (everything about hardware) in one section so one condition covers them all.' },
  { title: 'Add a field where it should sit', text: 'Use the + between rows or "Add a field" at the end of a section. Each type says what it is for; the new field opens its settings at once.' },
  { title: 'Decide who sees it', text: 'Every field has two choices: what a requester may do (hidden, read-only, optional, required) and whether a technician must fill it before saving.' },
  { title: 'Lay it out', text: 'A section has 1, 2 or 3 columns. Fields fill them in order; long answers and rich text usually take the full row.' },
  { title: 'Show a section only when needed', text: 'Give a section a condition — "Show only when Category is Hardware" — so people only see the questions that apply to them.' },
  { title: 'Preview, then publish', text: 'Preview shows the form exactly as a requester or a technician sees it, with the conditions working. Nothing changes for anyone until you publish.' },
];

/* Who may do what with a field — the product's three requester switches read as one choice. */
export type ReqMode = 'hidden' | 'readonly' | 'optional' | 'required';
export const reqModeOf = (f: FormField): ReqMode =>
  f.requesterView === false ? 'hidden' : f.requesterEdit === false ? 'readonly' : f.requesterRequired ? 'required' : 'optional';
export const reqModePatch = (m: ReqMode): Partial<FormField> => ({
  requesterView: m !== 'hidden', requesterEdit: m === 'optional' || m === 'required', requesterRequired: m === 'required',
});
export const REQ_MODE_HELP: Record<ReqMode, string> = {
  hidden: 'Requesters never see this field.',
  readonly: 'Requesters see it but cannot change it.',
  optional: 'Requesters may leave it empty.',
  required: 'Requesters cannot submit until this has a value.',
};
