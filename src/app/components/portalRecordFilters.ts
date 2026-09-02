/* Support Portal — the Record List's filter, as data.
 *
 * Two things a technician's list page gives you, and the widget panel now gives too:
 *
 *   1. PRESET filters — the named, out-of-the-box queries ("All Open Requests", "My Overdue
 *      Requests"). One click, no thinking. This is what an admin wants nearly every time.
 *   2. A CUSTOM condition builder — field → operator → value, several conditions ANDed, for the
 *      time the named list has nothing close enough.
 *
 * ⚠️ The panel is 340–600px wide and the technician toolbar those screens come from is the width of
 * the page. The adaptation is the LAYOUT, never the content: same presets, same fields, same
 * operators, same five value editors. What changes is that conditions STACK instead of running
 * across as chips — a panel has vertical room and no horizontal room, so a row per condition reads
 * better there than a chip row that wraps three times.
 *
 * ⚠️ Presets and fields are PER MODULE. "All Open Requests" is meaningless on a Change and "Go-live
 * date" is meaningless on a Request, so a module carries its own of both and switching module drops
 * a filter that no longer means anything (see the `consequence` on the Module field). */

/* ⚠️ `number` earns its own kind rather than being a text field. A view count compared with
   "Contains" is nonsense; the operators that make sense on it — greater than, less than — make
   sense on nothing else here, and operators hang off the kind. */
export type FilterKind = 'text' | 'choice' | 'person' | 'date' | 'tags' | 'number';

export interface FilterField {
  key: string;
  label: string;
  kind: FilterKind;
  /** `choice` only — the values on offer. */
  options?: string[];
}

export interface Condition {
  /** A `FilterField.key`. */
  field: string;
  op: string;
  /** One entry for text and date; many for the multi-select kinds. */
  values: string[];
}

export interface PresetFilter {
  id: string;
  name: string;
  conditions: Condition[];
  /* The half of a preset that is about WHO is asking rather than about the record — "Assigned to
     me", "In my technician group". It cannot be a Condition: no field on the record holds it, and
     it resolves against the signed-in requester at request time.
     ⚠️ It still has to be SAID. Without it the hover card for "My Overdue Requests" and one for an
     everybody's-overdue filter would list the identical condition and read as the same filter —
     the entire difference between them lives in this string. */
  scope?: string;
}

/** What the widget stores. `preset` wins when set; `conditions` is the custom filter. */
/* ── AND / OR ────────────────────────────────────────────────────────────────
 *
 * A GROUP of conditions, ANDed together. Groups are ORed with each other.
 *
 * ⚠️ Groups rather than a join dropdown between every row. "A AND B OR C" has no meaning until
 * somebody states a precedence, and a builder that renders it as a flat list is quietly picking one
 * for you — usually left-to-right, which is not how most people read it. A group says where the
 * bracket is by drawing it.
 * ⚠️ This is the shape `AdminBomTargeting` already uses for CI targeting ("rows AND within a group,
 * groups OR'd"). Two condition builders in one product meaning different things by the same two
 * words is a worse outcome than either shape on its own. */
export interface ConditionGroup {
  rows: Condition[];
}

/* ── The filter TREE ─────────────────────────────────────────────────────────
 *
 * A node is a CONDITION or a GROUP, and a group carries ONE join for all of its children.
 *
 * ⚠️ One join per group, not one per row. A row-by-row And/Or list has no defined meaning — "A and
 * B or C" needs a precedence nobody states — so the join belongs to the bracket rather than to the
 * gap between two rows. It is set once, on the group's second row, and every row after it reads
 * the same word: what you see down the left edge is what will actually be evaluated.
 * ⚠️ Precedence comes from NESTING, which is the only unambiguous way to express it. A group inside
 * a group is a bracket you can see, so "A and B and (C or D) and E" is a shape on the screen rather
 * than a rule to remember.
 * ⚠️ This REPLACES the earlier flat `groups` (AND inside, OR between), which could say exactly one
 * of those shapes. That value is still read — see `activeTree` — so nothing built before this needs
 * migrating. */
export type FilterJoin = 'and' | 'or';

export interface CondNode extends Condition { kind: 'cond' }
export interface GroupNode { kind: 'group'; join: FilterJoin; children: FilterNode[] }
export type FilterNode = CondNode | GroupNode;

export const isGroup = (n: FilterNode): n is GroupNode => n.kind === 'group';
export const condNode = (c: Condition): CondNode => ({ kind: 'cond', ...c });
export const emptyGroup = (join: FilterJoin = 'and'): GroupNode => ({ kind: 'group', join, children: [] });

export interface RecordFilter {
  preset?: string;
  /** The condition tree — what the builder writes. */
  tree?: GroupNode;
  /* ⚠️ LEGACY, still read. A filter stored before groups existed is a flat ANDed list, which is
     exactly one group — so nothing has to be migrated and an untouched Record List keeps filtering
     the way it did. Only the builder writes `groups`. */
  conditions?: Condition[];
  groups?: ConditionGroup[];
}

/* ── operators ──────────────────────────────────────────────────────────────
 *
 * ⚠️ Operators belong to the KIND, not to the field. Every text field offers Contains, every
 * multi-select offers In / Not In. Declaring them per field is thirty chances for two fields of the
 * same kind to end up offering different words for the same comparison. */
export const OPERATORS: Record<FilterKind, string[]> = {
  text: ['Contains', 'Does not contain', 'Equals', 'Starts with'],
  choice: ['In', 'Not In'],
  person: ['In', 'Not In'],
  date: ['Equals'],
  tags: ['Match Any', 'Match All'],
  number: ['Greater than', 'Less than', 'Equals'],
};

export const DATE_PRESETS = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'This Month', 'Custom'];

/* ── people ─────────────────────────────────────────────────────────────────
 *
 * ⚠️ `Unassigned` is first and is not a person — it is the state of having no person, which is what
 * "Unassigned Requests in My Group" filters on, so it has to be selectable like any other value. */
export const UNASSIGNED = 'Unassigned';

/* ── who a requester-facing view is about ────────────────────────────────────
 *
 * ⚠️ NOT "Assigned to me". The technician presets above this line are read by somebody who works
 * the queue, so "me" means the person the record is assigned to. On a support portal the reader is
 * the person who RAISED it, and a view called "My Open Requests" has to mean theirs — the same two
 * words pointing at two different people is exactly the confusion this string exists to prevent. */
export const REQUESTER_SCOPE = 'The signed-in requester';

export const PEOPLE: { name: string; email: string }[] = [
  { name: 'Kavit Gohel', email: 'kavit.gohel@motadata.com' },
  { name: 'Vaibhav Prajapati', email: 'vaibhav.prajapati@motadata.com' },
  { name: 'Udit Hotchandani', email: 'udit.hotchandani@motadata.com' },
  { name: 'Naitik Piparia', email: 'naitik.piparia@motadata.com' },
  { name: 'Abhishek Tiwari', email: 'abhishek.tiwari@motadata.com' },
  { name: 'Sandeep Kaur', email: 'sandeep.kaur@motadata.com' },
  { name: 'Sania Ansari', email: 'sania.ansari@motadata.com' },
  { name: 'Meera Nair', email: 'meera.nair@motadata.com' },
  { name: 'Rahul Deshpande', email: 'rahul.deshpande@motadata.com' },
  { name: 'Priya Menon', email: 'priya.menon@motadata.com' },
];

const AVATAR_BG = ['#3D8BD0', '#0EA5A5', '#F58518', '#8B5CF6', '#DC2626', '#059669', '#D97706'];

/** Deterministic, so a person is the same colour every time the list is drawn. */
export function personAvatar(name: string): { initials: string; bg: string } {
  if (name === UNASSIGNED) return { initials: '', bg: '#94A3B8' };
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return { initials, bg: AVATAR_BG[h % AVATAR_BG.length] };
}

export const TAG_SUGGESTIONS = ['vip', 'onboarding', 'hardware', 'network', 'security', 'audited-2026', 'escalated'];

/* ── the field catalogue ────────────────────────────────────────────────────
 *
 * Requests carries the full set the product's own filter offers. The other modules carry the fields
 * that module genuinely has — a Change has a risk and a window, an Asset has neither. */

const PRIORITY = ['Urgent', 'High', 'Medium', 'Low'];
/* Declared once. Three modules offered the same five categories and the same four groups, and three
   copies of a list is three chances for one of them to fall behind the other two. */
const CATEGORY = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
const TECH_GROUPS = ['Service Desk', 'Network', 'End User Computing', 'Application Support'];
const VENDORS = ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Cisco'];
const COMMON_PEOPLE = (): FilterField[] => [
  { key: 'requester', label: 'Requester', kind: 'person' },
  { key: 'createdBy', label: 'Created By', kind: 'person' },
  { key: 'lastUpdatedBy', label: 'Last Updated By', kind: 'person' },
];

export const FILTER_FIELDS: Record<string, FilterField[]> = {
  request: [
    { key: 'id', label: 'Request ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'type', label: 'Request Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'urgency', label: 'Urgency', kind: 'choice', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { key: 'impact', label: 'Impact', kind: 'choice', options: ['On Multiple Users', 'On Business', 'On User'] },
    { key: 'category', label: 'Category', kind: 'choice', options: CATEGORY },
    { key: 'subcategory', label: 'Subcategory', kind: 'choice', options: ['Laptop', 'Desktop', 'Printer', 'VPN', 'Email', 'Licence'] },
    { key: 'requester', label: 'Requester', kind: 'person' },
    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: TECH_GROUPS },
    { key: 'createdBy', label: 'Created By', kind: 'person' },
    { key: 'lastUpdatedBy', label: 'Last Updated By', kind: 'person' },
    { key: 'template', label: 'Request Template', kind: 'choice', options: ['New Laptop', 'Access Request', 'Password Reset', 'On-boarding'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Not Requested', 'Pending', 'Approved', 'Rejected'] },
    { key: 'source', label: 'Source', kind: 'choice', options: ['Portal', 'Email', 'Phone', 'Chat', 'Walk-in'] },
    { key: 'vendor', label: 'Vendor', kind: 'choice', options: VENDORS },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'firstResponseDueBy', label: 'First Response Due By', kind: 'date' },
    { key: 'resolvedAt', label: 'Resolved Date', kind: 'date' },
    { key: 'closedAt', label: 'Closed Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  problem: [
    { key: 'id', label: 'Problem ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'rootCause', label: 'Root Cause', kind: 'choice', options: ['Identified', 'Under Analysis', 'Not Identified'] },
    ...COMMON_PEOPLE(),
    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'category', label: 'Category', kind: 'choice', options: CATEGORY },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'dueBy', label: 'Due By', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  change: [
    { key: 'id', label: 'Change ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'changeType', label: 'Change Type', kind: 'choice', options: ['Standard', 'Normal', 'Emergency'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'risk', label: 'Risk', kind: 'choice', options: ['High', 'Medium', 'Low'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Pending', 'Approved', 'Rejected'] },
    { key: 'requester', label: 'Requester', kind: 'person' },
    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'technicianGroup', label: 'Technician Group', kind: 'choice', options: TECH_GROUPS },
    { key: 'createdBy', label: 'Created By', kind: 'person' },
    { key: 'lastUpdatedBy', label: 'Last Updated By', kind: 'person' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'plannedStart', label: 'Planned Start Date', kind: 'date' },
    { key: 'plannedEnd', label: 'Planned End Date', kind: 'date' },
    { key: 'actualStart', label: 'Actual Start Date', kind: 'date' },
    { key: 'actualEnd', label: 'Actual End Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  release: [
    { key: 'id', label: 'Release ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'releaseType', label: 'Release Type', kind: 'choice', options: ['Major', 'Minor', 'Patch', 'Emergency'] },
    ...COMMON_PEOPLE(),
    { key: 'assignee', label: 'Technician', kind: 'person' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'goLive', label: 'Go-Live Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  asset: [
    { key: 'name', label: 'Asset Name', kind: 'text' },
    { key: 'id', label: 'Asset ID', kind: 'text' },
    { key: 'assetType', label: 'Asset Type', kind: 'choice', options: ['Laptop', 'Desktop', 'Mobile', 'Monitor', 'Headset', 'Printer'] },
    { key: 'product', label: 'Product', kind: 'choice', options: ['Latitude 5440', 'UltraSharp U2723QE', 'MX Master 3S', 'Evolve2 65', 'iPhone 14'] },
    { key: 'status', label: 'Asset Status', kind: 'choice' },
    { key: 'usedBy', label: 'User', kind: 'person' },
    ...COMMON_PEOPLE(),
    { key: 'location', label: 'Location', kind: 'choice', options: ['Ahmedabad', 'Pune', 'Bengaluru', 'Remote'] },
    { key: 'acquisitionDate', label: 'Acquisition Date', kind: 'date' },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'manufacturer', label: 'Manufacturer', kind: 'choice', options: ['Dell', 'HP', 'Lenovo', 'Apple', 'Logitech', 'Jabra'] },
    { key: 'model', label: 'Model', kind: 'text' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  ci: [
    { key: 'name', label: 'CI Name', kind: 'text' },
    { key: 'id', label: 'CI ID', kind: 'text' },
    { key: 'ciType', label: 'CI Type', kind: 'choice', options: ['Server', 'Application', 'Switch', 'Windows Laptop', 'Mac Laptop', 'Mobile Device'] },
    { key: 'ciClass', label: 'CI Class', kind: 'choice', options: ['Hardware', 'Software', 'Network', 'Business Service'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'usedBy', label: 'User', kind: 'person' },
    ...COMMON_PEOPLE(),
    { key: 'environment', label: 'Environment', kind: 'choice', options: ['Production', 'Staging', 'Development'] },
    { key: 'asset', label: 'Asset', kind: 'text' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
  patch: [
    { key: 'id', label: 'Patch ID', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'severity', label: 'Severity', kind: 'choice', options: ['Critical', 'Important', 'Moderate', 'Low'] },
    { key: 'category', label: 'Category', kind: 'choice', options: ['Security Update', 'Critical Update', 'Feature Pack', 'Driver'] },
    { key: 'approvalStatus', label: 'Approval Status', kind: 'choice', options: ['Approved', 'Declined', 'Not Reviewed'] },
    { key: 'releaseDate', label: 'Release Date', kind: 'date' },
  ],
  vulnerability: [
    { key: 'id', label: 'CVE ID', kind: 'text' },
    { key: 'name', label: 'Title', kind: 'text' },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'severity', label: 'Severity', kind: 'choice', options: ['Critical', 'High', 'Medium', 'Low'] },
    { key: 'exploitStatus', label: 'Exploit Status', kind: 'choice', options: ['Exploited', 'Not Exploited'] },
    { key: 'patchAvailable', label: 'Patch Availability', kind: 'choice', options: ['Available', 'Not Available'] },
    { key: 'published', label: 'Published Date', kind: 'date' },
  ],
  approval: [
    { key: 'id', label: 'Approval ID', kind: 'text' },
    { key: 'itemId', label: 'Request / Item ID', kind: 'text' },
    { key: 'subject', label: 'Subject', kind: 'text' },
    { key: 'status', label: 'Approval Status', kind: 'choice' },
    { key: 'approvalType', label: 'Approval Type', kind: 'choice', options: ['Everyone', 'Anyone', 'Sequential'] },
    { key: 'approver', label: 'Approver', kind: 'person' },
    { key: 'module', label: 'Module', kind: 'choice', options: ['Request', 'Change', 'Purchase', 'Contract'] },
    { key: 'type', label: 'Request Type', kind: 'choice', options: ['Service Request', 'Incident'] },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'approvalDate', label: 'Approval Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
  ],
  /* ⚠️ Knowledge is the one module here a requester READS rather than owns, which is why it is the
     only one whose views carry no scope: "Recently Published" is the same list for everybody. */
  knowledge: [
    { key: 'id', label: 'Article ID', kind: 'text' },
    { key: 'name', label: 'Title', kind: 'text' },
    { key: 'summary', label: 'Summary', kind: 'text' },
    { key: 'category', label: 'Category', kind: 'choice', options: ['Guideline Documents', 'FAQs', 'How-to', 'Troubleshooting'] },
    { key: 'subcategory', label: 'Subcategory', kind: 'choice', options: ['Account', 'Network', 'Hardware', 'Software'] },
    { key: 'knowledgeType', label: 'Knowledge Type', kind: 'choice', options: ['Article', 'FAQ', 'Known Error', 'Solution'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'visibility', label: 'Visibility', kind: 'choice', options: ['Public', 'Logged-in Requesters', 'Internal'] },
    { key: 'publishedAt', label: 'Published Date', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'updatedAt', label: 'Last Updated Date', kind: 'date' },
    { key: 'viewCount', label: 'View Count', kind: 'number' },
  ],
  task: [
    { key: 'id', label: 'Task ID', kind: 'text' },
    { key: 'name', label: 'Task Name', kind: 'text' },
    { key: 'project', label: 'Project', kind: 'choice', options: ['Office 365 Migration', 'Data Centre Move', 'Laptop Refresh 2026', 'On-boarding Automation'] },
    { key: 'status', label: 'Status', kind: 'choice' },
    { key: 'priority', label: 'Priority', kind: 'choice', options: PRIORITY },
    { key: 'assignee', label: 'Assignee', kind: 'person' },
    { key: 'startDate', label: 'Start Date', kind: 'date' },
    { key: 'dueBy', label: 'Due Date', kind: 'date' },
    { key: 'createdAt', label: 'Created Date', kind: 'date' },
    { key: 'completedAt', label: 'Completed Date', kind: 'date' },
    { key: 'tags', label: 'Tags', kind: 'tags' },
  ],
};

/* ── presets ────────────────────────────────────────────────────────────────
 *
 * The Requests set is the product's own, from the technician list page. ⚠️ Wherever a preset CAN be
 * expressed as a status condition it is, rather than being a bare name with nothing behind it —
 * that is what makes choosing one visibly change the card on the canvas. The scope half of a preset
 * ("My", "in My Group") is a fact about the signed-in requester, so there is nothing for the
 * builder to evaluate and the preview shows the status half. */
const st = (op: string, ...values: string[]): Condition => ({ field: 'status', op, values });

/* ⚠️ The REQUESTER views come first in every module, and the technician ones follow. This list is
   read inside a support-portal builder, where the reader is building a page for the person who
   RAISED the record — "My Open Requests" has to be theirs. The technician sets stay because an
   admin may genuinely want a queue view on an internal page, but they are no longer what the
   dropdown opens on.
   ⚠️ Their scope is `REQUESTER_SCOPE`, never "Assigned to me". Same two words, different person. */
export const FILTER_PRESETS: Record<string, PresetFilter[]> = {
  request: [
    { id: 'all-mine', name: 'All My Requests', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-open', name: 'My Open Requests', conditions: [st('In', 'Open', 'In Progress', 'On Hold')], scope: REQUESTER_SCOPE },
    { id: 'mine-pending', name: 'My Pending Requests', conditions: [st('In', 'Pending')], scope: REQUESTER_SCOPE },
    { id: 'mine-resolved', name: 'My Resolved Requests', conditions: [st('In', 'Resolved')], scope: REQUESTER_SCOPE },
    { id: 'mine-closed', name: 'My Closed Requests', conditions: [st('In', 'Closed')], scope: REQUESTER_SCOPE },
    { id: 'mine-high-priority', name: 'My High Priority Requests', conditions: [{ field: 'priority', op: 'In', values: ['Urgent', 'High'] }, st('Not In', 'Resolved', 'Closed')], scope: REQUESTER_SCOPE },
    { id: 'all-open', name: 'All Open Requests', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'my-urgent', name: 'My Urgent or High Priority Requests', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'priority', op: 'In', values: ['Urgent', 'High'] }], scope: 'Assigned to me' },
    { id: 'my-overdue', name: 'My Overdue Requests', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'dueBy', op: 'Equals', values: ['Overdue'] }], scope: 'Assigned to me' },
    { id: 'unassigned-group', name: 'Unassigned Requests in My Group', conditions: [st('Not In', 'Resolved', 'Closed'), { field: 'assignee', op: 'In', values: [UNASSIGNED] }], scope: 'In my technician group' },
    { id: 'my-unresolved', name: 'My Unresolved Requests', conditions: [st('Not In', 'Resolved', 'Closed')], scope: 'Assigned to me' },
    { id: 'group-urgent', name: 'Urgent or High Priority Requests in my Group', conditions: [{ field: 'priority', op: 'In', values: ['Urgent', 'High'] }], scope: 'In my technician group' },
    { id: 'all', name: 'All Requests', conditions: [] },
    { id: 'all-incidents', name: 'All Incidents', conditions: [{ field: 'type', op: 'In', values: ['Incident'] }] },
    { id: 'all-sr', name: 'All Service Requests', conditions: [{ field: 'type', op: 'In', values: ['Service Request'] }] },
    { id: 'all-spam', name: 'All Spam Requests', conditions: [{ field: 'source', op: 'In', values: ['Email'] }] },
    { id: 'watched', name: 'Requests Watched By Me', conditions: [], scope: 'Watched by me' },
    { id: 'archived', name: 'All Archived Requests', conditions: [st('In', 'Closed')] },
  ],
  problem: [
    { id: 'all-open', name: 'All Open Problems', conditions: [st('Not In', 'Resolved', 'Closed')] },
    { id: 'my-open', name: 'My Open Problems', conditions: [st('Not In', 'Resolved', 'Closed')], scope: 'Assigned to me' },
    { id: 'known-errors', name: 'All Known Errors', conditions: [st('In', 'Known Error')] },
    { id: 'under-investigation', name: 'Problems Under Investigation', conditions: [st('In', 'Under Investigation')] },
    { id: 'all', name: 'All Problems', conditions: [] },
  ],
  change: [
    { id: 'mine', name: 'My Changes', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-active', name: 'My Active Changes', conditions: [st('Not In', 'Implemented', 'Closed')], scope: REQUESTER_SCOPE },
    { id: 'mine-completed', name: 'My Completed Changes', conditions: [st('In', 'Implemented', 'Closed')], scope: REQUESTER_SCOPE },
    { id: 'all-open', name: 'All Open Changes', conditions: [st('Not In', 'Implemented', 'Closed')] },
    { id: 'awaiting-approval', name: 'Changes Awaiting My Approval', conditions: [st('In', 'Submitted')] },
    { id: 'scheduled', name: 'Scheduled Changes', conditions: [st('In', 'Scheduled')] },
    { id: 'my-changes', name: 'My Changes', conditions: [], scope: 'Raised or assigned to me' },
    { id: 'all', name: 'All Changes', conditions: [] },
  ],
  release: [
    { id: 'all-open', name: 'All Open Releases', conditions: [st('Not In', 'Closed')] },
    { id: 'in-build', name: 'Releases in Build', conditions: [st('In', 'Build')] },
    { id: 'in-testing', name: 'Releases in Testing', conditions: [st('In', 'Testing')] },
    { id: 'deployed', name: 'Deployed Releases', conditions: [st('In', 'Deployed')] },
    { id: 'all', name: 'All Releases', conditions: [] },
  ],
  asset: [
    { id: 'my-assets', name: 'My Assets', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-active', name: 'My Active Assets', conditions: [st('In', 'In Use')], scope: REQUESTER_SCOPE },
    { id: 'in-use', name: 'Assets In Use', conditions: [st('In', 'In Use')] },
    { id: 'in-stock', name: 'Assets In Stock', conditions: [st('In', 'In Stock')] },
    { id: 'in-repair', name: 'Assets In Repair', conditions: [st('In', 'In Repair')] },
    { id: 'expiring-warranty', name: 'Assets With Expiring Warranty', conditions: [{ field: 'warrantyExpiry', op: 'Equals', values: ['This Month'] }] },
    { id: 'all', name: 'All Assets', conditions: [] },
  ],
  ci: [
    { id: 'my-cis', name: 'My CIs', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-active', name: 'My Active CIs', conditions: [st('In', 'Operational')], scope: REQUESTER_SCOPE },
    { id: 'operational', name: 'Operational CIs', conditions: [st('In', 'Operational')] },
    { id: 'degraded', name: 'Degraded or Down CIs', conditions: [st('In', 'Degraded', 'Down')] },
    { id: 'all', name: 'All CIs', conditions: [] },
  ],
  patch: [
    { id: 'missing', name: 'All Missing Patches', conditions: [st('In', 'Missing')] },
    { id: 'critical-missing', name: 'Missing Critical Patches', conditions: [st('In', 'Missing'), { field: 'severity', op: 'In', values: ['Critical'] }] },
    { id: 'installed', name: 'Installed Patches', conditions: [st('In', 'Installed')] },
    { id: 'failed', name: 'Failed Patches', conditions: [st('In', 'Failed')] },
    { id: 'all', name: 'All Patches', conditions: [] },
  ],
  vulnerability: [
    { id: 'exploited', name: 'Exploited Vulnerabilities', conditions: [st('In', 'Exploited')] },
    { id: 'detected', name: 'Detected Vulnerabilities', conditions: [st('In', 'Detected')] },
    { id: 'critical', name: 'Critical Vulnerabilities', conditions: [{ field: 'severity', op: 'In', values: ['Critical'] }] },
    { id: 'unpatched', name: 'Vulnerabilities Without a Patch', conditions: [{ field: 'patchAvailable', op: 'In', values: ['Not Available'] }] },
    { id: 'all', name: 'All Vulnerabilities', conditions: [] },
  ],
  approval: [
    { id: 'mine', name: 'My Approvals', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-pending', name: 'Pending Approvals', conditions: [st('In', 'Pending')], scope: REQUESTER_SCOPE },
    { id: 'mine-completed', name: 'Completed Approvals', conditions: [st('In', 'Approved', 'Rejected')], scope: REQUESTER_SCOPE },
    { id: 'pending-me', name: 'Approvals Pending With Me', conditions: [st('In', 'Pending')], scope: 'Awaiting my approval' },
    { id: 'approved-me', name: 'Approved By Me', conditions: [st('In', 'Approved')], scope: 'Actioned by me' },
    { id: 'rejected-me', name: 'Rejected By Me', conditions: [st('In', 'Rejected')], scope: 'Actioned by me' },
    { id: 'all', name: 'All Approvals', conditions: [] },
  ],
  /* ⚠️ No scope on any of these. Knowledge is the one module a requester READS rather than owns,
     so "Recently Published" is the same list for everybody and a "mine" would mean nothing. */
  knowledge: [
    { id: 'most-read', name: 'Most Read Knowledge', conditions: [st('In', 'Published')] },
    { id: 'recently-published', name: 'Recently Published', conditions: [st('In', 'Published'), { field: 'publishedAt', op: 'Equals', values: ['This Month'] }] },
    { id: 'recently-updated', name: 'Recently Updated', conditions: [st('In', 'Published'), { field: 'updatedAt', op: 'Equals', values: ['This Month'] }] },
    { id: 'all', name: 'All Articles', conditions: [] },
  ],
  task: [
    { id: 'mine', name: 'My Tasks', conditions: [], scope: REQUESTER_SCOPE },
    { id: 'mine-completed', name: 'My Completed Tasks', conditions: [st('In', 'Completed')], scope: REQUESTER_SCOPE },
    { id: 'my-open', name: 'My Open Tasks', conditions: [st('Not In', 'Completed', 'Cancelled')], scope: 'Assigned to me' },
    { id: 'my-overdue', name: 'My Overdue Tasks', conditions: [{ field: 'dueBy', op: 'Equals', values: ['Overdue'] }], scope: 'Assigned to me' },
    { id: 'in-progress', name: 'Tasks In Progress', conditions: [st('In', 'In Progress')] },
    { id: 'completed', name: 'Completed Tasks', conditions: [st('In', 'Completed')] },
    { id: 'all', name: 'All Tasks', conditions: [] },
  ],
};

/* ── lookups ────────────────────────────────────────────────────────────────
 *
 * ⚠️ Every one of these falls back rather than returning undefined. A module key that has no entry
 * is a bug in the catalogue, but a filter control that throws takes the whole builder down with it,
 * and an admin cannot tell the difference between "the panel crashed" and "the page is broken". */
export const fieldsFor = (moduleKey: string, statuses: string[]): FilterField[] =>
  (FILTER_FIELDS[moduleKey] ?? FILTER_FIELDS.request).map((f) =>
    (f.key === 'status' ? { ...f, options: statuses } : f));

export const presetsFor = (moduleKey: string): PresetFilter[] =>
  FILTER_PRESETS[moduleKey] ?? FILTER_PRESETS.request;

export const fieldByKey = (moduleKey: string, key: string, statuses: string[]) =>
  fieldsFor(moduleKey, statuses).find((f) => f.key === key);

export const presetById = (moduleKey: string, id?: string) =>
  (id ? presetsFor(moduleKey).find((p) => p.id === id) : undefined);

/** "Status Not In Closed" — the chip's words, built the same way everywhere it is shown. */
export function describeCondition(c: Condition, label: string): string {
  const v = c.values.length === 0
    ? '…'
    : c.values.length <= 2 ? c.values.join(', ') : `${c.values[0]} +${c.values.length - 1}`;
  return `${label} ${c.op} ${v}`;
}

/** The one line the panel shows when the field is closed. */
export function summarise(filter: RecordFilter | undefined, moduleKey: string): string {
  const p = presetById(moduleKey, filter?.preset);
  if (p) return p.name;
  const tree = activeTree(filter, moduleKey);
  const n = treeConditions(tree).length;
  if (n === 0) return 'No filter — every record';
  /* ⚠️ The nested groups are counted too, once there are any. "Custom · 4 conditions" reads as four
     things that must all be true, which is the opposite of what a bracket in the middle means. */
  const nested = tree.children.filter(isGroup).length;
  const conds = `${n} condition${n === 1 ? '' : 's'}`;
  return nested ? `Custom · ${conds} in ${nested + 1} groups` : `Custom · ${conds}`;
}

/** The tree in force, whichever of the FOUR shapes the filter is stored in.
 *
 * ⚠️ Every older shape is a tree too, so they are converted rather than special-cased downstream:
 * a preset's conditions and a legacy flat list are both one AND group, and the flat `groups` value
 * is an OR of AND groups. One reader means the renderer and the builder cannot disagree about what
 * an old filter meant. */
export const activeTree = (filter: RecordFilter | undefined, moduleKey: string): GroupNode => {
  const preset = presetById(moduleKey, filter?.preset);
  if (preset) return { kind: 'group', join: 'and', children: preset.conditions.map(condNode) };
  if (filter?.tree) return filter.tree;
  if (filter?.groups?.length) {
    const gs = filter.groups.filter((g) => g.rows.length > 0);
    if (gs.length === 1) return { kind: 'group', join: 'and', children: gs[0].rows.map(condNode) };
    return {
      kind: 'group',
      join: 'or',
      children: gs.map((g) => ({ kind: 'group', join: 'and', children: g.rows.map(condNode) } as GroupNode)),
    };
  }
  return { kind: 'group', join: 'and', children: (filter?.conditions ?? []).map(condNode) };
};

/** Every group in force, whichever of the three shapes the filter is stored in. */
export const activeGroups = (filter: RecordFilter | undefined, moduleKey: string): ConditionGroup[] => {
  const preset = presetById(moduleKey, filter?.preset);
  if (preset) return [{ rows: preset.conditions }];
  if (filter?.groups?.length) return filter.groups.filter((g) => g.rows.length > 0);
  /* The legacy flat list IS one group — see the note on `RecordFilter.conditions`. */
  return filter?.conditions?.length ? [{ rows: filter.conditions }] : [];
};

/** Every condition in force, flattened — for the chips under the closed field.
 *  ⚠️ Flattening LOSES the OR, so anything that has to be truthful about how the rows combine reads
 *  `activeGroups` instead. This is for the summary chips, which are already a lossy reading of the
 *  filter, and for callers that only ever knew about one group. */
export const activeConditions = (filter: RecordFilter | undefined, moduleKey: string): Condition[] =>
  treeConditions(activeTree(filter, moduleKey));

/* ── evaluating against the sample rows ─────────────────────────────────────
 *
 * ⚠️ The builder's rows are SAMPLES — id, title, status and a meta line, which is all the canvas
 * needs to show the shape of the card. So a condition on a field the sample rows carry (status, id,
 * subject) genuinely filters, and one on a field they do not (priority, assignee, a date) PASSES
 * rather than emptying the card. Evaluating an absent field as "no match" would black out the
 * preview the moment anybody picked a realistic filter, which teaches an admin their filter is
 * broken when it is the preview that is thin. The widget's note says so in as many words. */
/** Walks the tree. An empty group matches everything — "I have not narrowed this" and "I have
 *  narrowed it to nothing" are different intentions and only one of them should empty the card. */
export function matchesTree(
  row: { id: string; title: string; status: string },
  node: FilterNode,
): boolean {
  if (node.kind === 'cond') return matchesConditions(row, [node]);
  const live = node.children.filter((c) => (c.kind === 'group' ? c.children.length > 0 : true));
  if (!live.length) return true;
  return node.join === 'and'
    ? live.every((c) => matchesTree(row, c))
    : live.some((c) => matchesTree(row, c));
}

/** Every condition in the tree, flattened — for the chips under the closed field. */
export const treeConditions = (node: FilterNode): Condition[] =>
  node.kind === 'cond' ? [node] : node.children.flatMap(treeConditions);

/** OR across groups, AND within one. No groups matches everything. */
export function matchesGroups(
  row: { id: string; title: string; status: string },
  groups: ConditionGroup[],
): boolean {
  if (groups.length === 0) return true;
  return groups.some((g) => matchesConditions(row, g.rows));
}

export function matchesConditions(
  row: { id: string; title: string; status: string },
  conds: Condition[],
): boolean {
  return conds.every((c) => {
    if (c.values.length === 0) return true; // a half-written condition filters nothing
    const text = c.field === 'id' ? row.id
      : (c.field === 'subject' || c.field === 'name' || c.field === 'title') ? row.title
        : undefined;
    if (c.field === 'status') {
      const hit = c.values.includes(row.status);
      return c.op === 'Not In' ? !hit : hit;
    }
    if (text !== undefined) {
      const hay = text.toLowerCase();
      const needle = (c.values[0] ?? '').toLowerCase();
      if (!needle) return true;
      switch (c.op) {
        case 'Contains': return hay.includes(needle);
        case 'Does not contain': return !hay.includes(needle);
        case 'Equals': return hay === needle;
        case 'Starts with': return hay.startsWith(needle);
        default: return true;
      }
    }
    return true;
  });
}
