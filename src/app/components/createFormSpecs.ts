import type { SelectOption } from './FormRuleControls';
import { TECH_GROUPS, TECHNICIANS } from './technicianRoster';
import { categoryOptions, departmentOptions, locationOptions, priorityOptions, statusOptions, vendorOptions } from './TicketDrawerUtils';
import { COST_CENTER_OPTIONS, CONTRACT_TYPE_OPTIONS, LICENSE_TYPE_OPTIONS, SOFTWARE_TYPE_OPTIONS } from './AssetFields';
import { mockProblems } from './ProblemListPage';
import { mockChanges } from './ChangeListPage';
import { mockCis } from './CmdbListPage';
import { mockContracts } from './ContractsListPage';
import { mockPurchases } from './PurchasesListPage';
import { mockAssets as hardwareAssets } from './HardwareAssetsListPage';
import { mockAssets as softwareAssets } from './SoftwareAssetsListPage';
import { mockAssets as nonItAssets } from './NonItAssetsListPage';
import { mockAssets as consumableAssets } from './ConsumableAssetsListPage';
import { mockPatches } from './PatchesListPage';
import { KNOWLEDGE_FOLDERS } from './KnowledgeListPage';
import { CATEGORIES } from './ReportsListPage';
import { REMOTE_OFFICES } from './PatchComputersTab';
import {
  ASSET_CATEGORY_185, ASSET_STATUS_185, CHANGE_CATEGORY_185, CHANGE_RISK_185, CHANGE_TYPE_185, CI_STATUS_185, CURRENCIES_185,
  DEPARTMENTS_185, DEPLOYMENT_POLICIES_185, GROUPS_185, IMPACT_185, LEVELS_185, LOCATIONS_185, OS_PLATFORMS_185, PATCH_CATEGORIES_185,
  PATCH_SEVERITY_185, PEOPLE_185, PRINT_TEMPLATES_185, PROBLEM_TEMPLATES_185, PROJECT_RISK_185, PROJECT_TYPES_185, REBOOT_185,
  RELEASE_TEMPLATES_185, RELEASE_TRANSITION_MODELS_185, RELEASE_TYPES_185, TEMPLATE_FILLS_185, REQUEST_CATEGORY_185, REQUEST_STATUS_185, SERVICES_185, TASK_STATUS_185, TRANSITION_MODELS_185, VENDORS_185, personLabel,
} from './data185';

/* What every module's create page asks, section by section — read from each module's create form
 * on the product (172.16.15.185, 29 Oct 2026) and grouped by what the person is deciding:
 * what it is → who it is for → how urgent → who works on it → where it belongs → what it links to.
 * Admin custom fields are left out (decided 29 Oct 2026).
 *
 * A spec is DATA. ModuleCreatePage renders it; a `block` is a section whose body is a record
 * picker (TargetBox + side picker) rather than plain fields. The VALUE KEYS below are what a
 * listing reads back from a created record (createFormStore) — change a key, change its listing. */

export type FieldKind =
  | 'text' | 'textarea' | 'rich' | 'select' | 'multi' | 'person' | 'requester' | 'date' | 'datetime'
  | 'number' | 'amount' | 'tags' | 'emails' | 'switch' | 'pills' | 'files'
  /** People and groups, many at once — the Notify To picker (MultiPickField). */
  | 'people'
  /** Several short values, one input each, with a + to add another — 185's License Key. */
  | 'list'
  /** Many values from a long list, searchable and removable — MultiPickField without avatars. */
  | 'multipick'
  /** A time of day (HH:MM). */
  | 'time';

export type Values = Record<string, unknown>;

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: (v?: Values) => SelectOption[];
  /** The value a new form opens with. A function is called once, when the page opens. */
  def?: unknown | (() => unknown);
  wide?: boolean;
  placeholder?: string;
  hint?: (v: Values) => string | undefined;
  /** Hidden (and not required) while this returns false. */
  when?: (v: Values) => boolean;
  /** A template picker: choosing a value fills these fields; a Reset to Default link puts the form back. */
  fills?: Record<string, Values>;
  /** Locked with this reason shown under it. */
  lockedBy?: (v: Values) => string | undefined;
}

export type BlockKind = 'applications' | 'scopedApps' | 'linked' | 'targets' | 'patchPayload' | 'packages' | 'registry' | 'poItems' | 'conditions' | 'columns' | 'managedSoftware';

export interface SectionSpec {
  title: string | ((v: Values) => string);
  /** One line under the title. Left out on a section that holds only the name — the field says it. */
  sub?: string | ((v: Values) => string);
  fields?: FieldSpec[];
  block?: BlockKind;
  /** The block must hold at least one record. */
  blockRequired?: boolean;
  /** The block shows only while this holds — e.g. the Applications box under Include / Exclude. */
  blockWhen?: (v: Values) => boolean;
  when?: (v: Values) => boolean;
}

export interface ModuleSpec {
  id: string;
  title: (v: Values) => string;
  /** Main button. */
  cta: string;
  /** A second save, e.g. Save as Draft — only the name is required for it. */
  secondary?: string;
  /** The field the toast names the record by. */
  nameKey: string;
  idOf: (n: number) => string;
  /** The counter starts above the listing's own mock ids. */
  seqStart: number;
  sections: SectionSpec[];
  /** Cross-field rules, e.g. an end date after the start date. */
  check?: (v: Values) => { key: string; msg: string } | undefined;
}

/* ── Option sources. Functions, so module data is only read once a page opens. ── */
const list = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const opts = (xs: readonly string[]): SelectOption[] => xs.map((x) => ({ value: x, label: x }));
const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x && x !== '---'))].sort((a, b) => a.localeCompare(b));
const labels = (xs: { label: string }[]) => xs.map((x) => x.label);

const technicians = (): SelectOption[] => PEOPLE_185.map((p) => ({ value: personLabel(p), label: p.name, hint: p.email.includes('@') ? p.email : undefined, avatar: { initials: p.initials, color: '#3D8BD0' } }));
const techGroups = () => opts(GROUPS_185);
/** A technician's work address — the roster carries names only. */
export const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.')}@motadata.com`;
/* Notify To lists people as "Name (email)", as the product does; the hint carries the email. */
const notifyTo = (): SelectOption[] => [
  ...technicians().map((t) => ({ ...t, group: 'Technicians' })),
  ...GROUPS_185.map((g) => ({ value: g, label: g, group: 'Technician groups' })),
];
export const requesterNames = () => PEOPLE_185.map(personLabel);
const requesters = (): SelectOption[] => PEOPLE_185.map((p) => ({ value: personLabel(p), label: p.name, hint: p.email.includes('@') ? p.email : undefined, avatar: { initials: p.initials, color: '#7B8FA5' } }));
const departments = () => opts(DEPARTMENTS_185);
const locations = () => opts(LOCATIONS_185);
const vendors = () => opts(VENDORS_185);
const categories = () => opts(REQUEST_CATEGORY_185);
const LEVELS = LEVELS_185;
const RISKS = ['Low', 'Medium', 'High'];
const IMPACTS = IMPACT_185;
const SERVICES = SERVICES_185;
export const DEPLOYMENT_POLICIES = DEPLOYMENT_POLICIES_185;
const PATCH_CATEGORIES = PATCH_CATEGORIES_185;
const PATCH_SEVERITIES = PATCH_SEVERITY_185;
const OS_PLATFORMS = OS_PLATFORMS_185;
const CURRENCIES = CURRENCIES_185;
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Germany'];

/* Asset kind — the listing you open Add Asset from decides it; Asset Type follows the kind. */
export type AssetKind = 'Hardware' | 'Software' | 'Non-IT' | 'Consumable';
const kindOf = (v: Values) => (v.assetKind as AssetKind) ?? 'Hardware';
const assetTypes = (k: AssetKind) =>
  k === 'Hardware' ? uniq([...hardwareAssets.map((a) => a.assetType), 'Hardware', 'Windows Desktop', 'UNIX Server'])
    : k === 'Software' ? uniq([...softwareAssets.map((a) => a.assetType), 'Operating System', 'Application Suite'])
      : k === 'Non-IT' ? uniq(nonItAssets.map((a) => a.assetType))
        : uniq(consumableAssets.map((a) => a.assetType));
const assetStatuses = (k: AssetKind) => (k === 'Hardware' || k === 'Software' ? ASSET_STATUS_185 : k === 'Non-IT' ? ['In Use', 'In Stock', 'In Store', 'Not Working'] : ASSET_STATUS_185);
const softwareCategories = () => opts(uniq(softwareAssets.map((a) => a.softwareCategory)));
const assetGroups = () => opts(uniq([...consumableAssets.map((a) => a.assetGroup), 'Finance Laptops', 'Design Workstations', 'Data Centre']));

/* ── Fields every ticket-like module shares. ── */
const F = {
  template: { key: 'template', label: 'Fill From Template', kind: 'select', options: () => [] } as FieldSpec,
  transition: { key: 'transitionModel', label: 'Transition Model', kind: 'select', options: () => opts(TRANSITION_MODELS_185) } as FieldSpec,
  requester: { key: 'requester', label: 'Requester', kind: 'requester', required: true, options: requesters } as FieldSpec,
  cc: { key: 'cc', label: 'Cc Emails', kind: 'emails' } as FieldSpec,
  subject: { key: 'subject', label: 'Subject', kind: 'text', required: true, wide: true, placeholder: 'A short summary' } as FieldSpec,
  description: { key: 'description', label: 'Description', kind: 'rich', wide: true } as FieldSpec,
  attachments: { key: 'attachments', label: 'Attachments', kind: 'files', wide: true } as FieldSpec,
  category: { key: 'category', label: 'Category', kind: 'select', options: categories } as FieldSpec,
  tags: { key: 'tags', label: 'Tags', kind: 'tags', wide: true } as FieldSpec,
  priority: { key: 'priority', label: 'Priority', kind: 'select', options: () => opts(LEVELS_185), def: 'Low' } as FieldSpec,
  urgency: { key: 'urgency', label: 'Urgency', kind: 'select', options: () => opts(LEVELS), def: 'Low' } as FieldSpec,
  impact: { key: 'impact', label: 'Impact', kind: 'select', options: () => opts(IMPACTS), def: 'Low' } as FieldSpec,
  techGroup: { key: 'techGroup', label: 'Technician Group', kind: 'select', options: techGroups } as FieldSpec,
  assignee: { key: 'assignee', label: 'Assignee', kind: 'person', options: technicians } as FieldSpec,
  department: { key: 'department', label: 'Department', kind: 'select', options: departments } as FieldSpec,
  location: { key: 'location', label: 'Location', kind: 'select', options: locations } as FieldSpec,
  vendor: { key: 'vendor', label: 'Vendor', kind: 'select', options: vendors } as FieldSpec,
  startDate: { key: 'startDate', label: 'Start Date', kind: 'datetime', required: true } as FieldSpec,
  endDate: { key: 'endDate', label: 'End Date', kind: 'datetime', required: true } as FieldSpec,
};
const field = (f: FieldSpec, patch: Partial<FieldSpec>): FieldSpec => ({ ...f, ...patch });

const startFrom: SectionSpec = { title: 'Start from', sub: 'Prefill the form from a template and choose the workflow it follows.', fields: [F.template, F.transition] };
const requesterSec: SectionSpec = { title: 'Requester', sub: 'Who is asking, and who else should hear about it.', fields: [F.requester, F.cc] };
const assignmentSec: SectionSpec = { title: 'Assignment', sub: 'Which team and technician pick it up.', fields: [F.techGroup, F.assignee] };
const contextSec: SectionSpec = { title: 'Context', sub: 'Where it happened and who else is involved.', fields: [F.department, F.location, F.vendor] };
const linkedSec: SectionSpec = { title: 'Linked items', sub: 'The assets and configuration items it affects.', block: 'linked' };
const endAfterStart = (s: string, e: string, label = 'End Date') => (v: Values) => {
  const a = v[s] as string, b = v[e] as string;
  return a && b && b < a ? { key: e, msg: `${label} must be after the start` } : undefined;
};
const daysFromNow = (n: number) => () => {
  const d = new Date(Date.now() + n * 86400000);
  return `${d.toISOString().slice(0, 10)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const expiresHint = (v: Values) => {
  const e = v.expiryDate as string;
  if (!e) return undefined;
  const days = Math.ceil((new Date(e).getTime() - Date.now()) / 86400000);
  return Number.isNaN(days) ? undefined : days < 0 ? 'Already expired' : days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`;
};

const deploymentSchedule: SectionSpec = {
  title: 'Schedule', sub: 'When it may start, and when it stops trying.',
  fields: [
    { key: 'installAfter', label: 'Install After', kind: 'datetime', hint: (v) => (v.installAfter ? undefined : 'Empty = it starts as soon as it is published') },
    { key: 'expiryDate', label: 'Expiry Date', kind: 'datetime', def: daysFromNow(15), hint: expiresHint },
  ],
};
const deploymentConfig: SectionSpec = {
  title: 'Configuration settings', sub: 'How it runs and who hears about it.',
  fields: [
    { key: 'policy', label: 'Deployment Policy', kind: 'select', required: true, options: () => opts(DEPLOYMENT_POLICIES) },
    { key: 'notify', label: 'Notify to', kind: 'people', options: notifyTo },
    { key: 'retry', label: 'Retry Failed Configuration', kind: 'switch', def: false },
    { key: 'retryCount', label: 'Retry Count', kind: 'number', required: true, def: '0', when: (v) => !!v.retry },
  ],
};
const configType: FieldSpec = {
  key: 'configType', label: 'Configuration Type', kind: 'pills', options: () => opts(['Install', 'Uninstall']), def: 'Install',
  lockedBy: (v) => (v.category === 'OS Upgrade' ? 'An OS upgrade can only be installed.' : undefined),
};
const patchPicks: FieldSpec[] = [
  { key: 'patchCategory', label: 'Patch Category', kind: 'multi', required: true, options: () => opts(PATCH_CATEGORIES) },
  { key: 'patchSeverity', label: 'Patch Severity', kind: 'multi', options: () => opts(PATCH_SEVERITIES) },
  { key: 'osPlatform', label: 'OS Platform', kind: 'select', required: true, options: () => opts(OS_PLATFORMS), def: 'Windows' },
  { key: 'appScope', label: 'Applications', kind: 'pills', options: () => opts(['All applications', 'Include applications', 'Exclude applications']), def: 'All applications', wide: true },
];

const assetSections = (ci: boolean): SectionSpec[] => [
  {
    title: ci ? 'Configuration item' : 'Asset', sub: 'What it is.',
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true, placeholder: ci ? 'e.g. prod-db-01' : 'e.g. Dell Latitude 7440 — Finance' },
      ci
        ? { key: 'ciType', label: 'CI Type', kind: 'select', required: true, options: () => opts(uniq(mockCis.map((c) => c.ciType))) }
        : { key: 'assetType', label: 'Asset Type', kind: 'select', required: true, options: () => [] /* by kind — see ModuleCreatePage */ },
      { key: 'product', label: 'Product', kind: 'text', placeholder: 'Make and model' },
      ...(ci ? [] : [
        { key: 'category', label: 'Category', kind: 'select', options: () => opts(ASSET_CATEGORY_185), when: (v: Values) => kindOf(v) !== 'Software' } as FieldSpec,
        { key: 'softwareType', label: 'Software Type', kind: 'select', options: () => opts(SOFTWARE_TYPE_OPTIONS), def: 'Managed', when: (v: Values) => kindOf(v) === 'Software' } as FieldSpec,
        { key: 'softwareCategory', label: 'Software Category', kind: 'select', options: softwareCategories, when: (v: Values) => kindOf(v) === 'Software' } as FieldSpec,
        { key: 'version', label: 'Version', kind: 'text', when: (v: Values) => kindOf(v) === 'Software' } as FieldSpec,
        { key: 'barcode', label: 'Barcode', kind: 'text', when: (v: Values) => kindOf(v) !== 'Software' } as FieldSpec,
      ]),
      F.tags, F.description, F.attachments,
    ],
  },
  {
    title: (v) => (!ci && kindOf(v) === 'Consumable' ? 'Stock' : 'Status & use'),
    sub: (v) => (!ci && kindOf(v) === 'Consumable' ? 'How many are on hand.' : 'Whether it is in use, by whom, and how much it matters.'),
    fields: [
      { key: 'quantity', label: 'Quantity', kind: 'number', required: true, def: '1', when: (v) => !ci && kindOf(v) === 'Consumable' },
      { key: 'status', label: 'Status', kind: 'select', when: (v) => ci || kindOf(v) !== 'Consumable', options: () => [] /* by kind */, def: ci ? 'Operational' : 'In Use' },
      { key: 'impact', label: 'Impact', kind: 'select', options: () => opts(IMPACTS), def: 'Low', when: (v) => ci || kindOf(v) !== 'Consumable' },
      { key: 'usedBy', label: 'Used By', kind: ci ? 'people' : 'requester', options: requesters, when: (v) => ci || kindOf(v) !== 'Consumable' },
      { key: 'assignmentDate', label: 'Assignment Date', kind: 'date', when: (v) => ci || kindOf(v) !== 'Consumable' },
    ],
  },
  {
    title: 'Ownership', sub: 'Who manages it and where it lives.',
    fields: [
      { key: 'managedByGroup', label: 'Managed By Group', kind: 'select', options: techGroups },
      { key: 'managedBy', label: 'Managed By', kind: 'person', options: technicians },
      F.department, F.location,
      { key: 'group', label: ci ? 'CI Group' : 'Asset Group', kind: 'select', options: assetGroups },
    ],
  },
  ...(ci ? [] : [{
    title: 'Purchase', sub: 'Where it came from.',
    fields: [F.vendor, { key: 'acquisitionDate', label: 'Acquisition Date', kind: 'date' } as FieldSpec],
  }]),
];

const ticketDetails = (noun: string, sub: string): SectionSpec => ({ title: noun, sub, fields: [F.subject, F.description, F.attachments] });

/* Suggested tags per module (sample catalogues — the real list is the tenant's tag catalogue). A module
   with none shows the "No tags added yet" state; anything typed can still be added. */
export const TAG_SUGGESTIONS: Record<string, string[]> = {
  request: ['vip', 'urgent', 'recurring', 'after-hours', 'password-reset', 'onboarding', 'hardware', 'network', 'outage', 'security'],
  problem: ['recurring', 'root-cause-pending', 'known-error', 'major', 'workaround-available', 'network', 'outage', 'security'],
  change: ['standard', 'emergency', 'cab-review', 'maintenance-window', 'rollback-ready', 'security', 'network', 'infrastructure'],
  release: ['major', 'minor', 'hotfix', 'quarterly', 'security', 'customer-facing'],
  asset: ['production', 'critical', 'spare', 'loaner', 'end-of-life', 'warranty-expiring', 'remote'],
  ci: ['production', 'critical', 'customer-facing', 'pci', 'staging', 'monitored'],
  purchase: ['capex', 'opex', 'renewal', 'urgent', 'budgeted'],
  knowledge: ['how-to', 'troubleshooting', 'faq', 'vpn', 'email', 'printer', 'self-service'],
  project: ['q4-2026', 'infrastructure', 'migration', 'security', 'cost-saving'],
};

export const MODULE_SPECS: Record<string, ModuleSpec> = {
  request: {
    id: 'request', title: () => 'Create Incident', cta: 'Create Incident', nameKey: 'subject', idOf: (n) => `INC-${n}`, seqStart: 1000,
    sections: [
      requesterSec,
      ticketDetails('Request', 'What went wrong, in the requester’s words.'),
      { title: 'Classification', sub: 'Where it belongs, so it reaches the right queue.', fields: [F.category, { key: 'service', label: 'Service', kind: 'select', options: () => opts(SERVICES) }, F.tags] },
      { title: 'Priority & status', sub: 'How urgent it is. Priority is worked out from Urgency and Impact.', fields: [{ key: 'status', label: 'Status', kind: 'select', options: () => opts(REQUEST_STATUS_185), def: 'In Progress' }, F.urgency, F.impact] },
      assignmentSec, contextSec, linkedSec,
    ],
  },
  problem: {
    id: 'problem', title: () => 'Create Problem',
    /* Fill From Template — the product's problem templates */ cta: 'Create Problem', nameKey: 'subject', idOf: (n) => `PRB-${n}`, seqStart: 200,
    sections: [
      { ...startFrom, fields: [{ ...F.template, options: () => opts(PROBLEM_TEMPLATES_185), fills: TEMPLATE_FILLS_185.problem }, F.transition] }, requesterSec,
      ticketDetails('Problem', 'What the problem is and what has been seen so far.'),
      {
        title: 'Problem type', sub: 'How it was found, whether it is a known error, and when it must be solved.',
        fields: [
          { key: 'nature', label: 'Nature Of Problem', kind: 'pills', required: true, options: () => opts(['Proactive', 'Reactive']), def: 'Proactive' },
          { key: 'knownError', label: 'Known Error', kind: 'pills', required: true, options: () => opts(['No', 'Yes']), def: 'No' },
          { key: 'dueBy', label: 'Due By', kind: 'datetime', required: true },
        ],
      },
      { title: 'Classification', sub: 'Where it belongs.', fields: [{ ...F.category, options: () => opts([...REQUEST_CATEGORY_185, 'IT Administration']) }, F.tags] },
      { title: 'Priority & status', sub: 'How urgent it is.', fields: [{ key: 'status', label: 'Status', kind: 'select', options: () => opts(['Open', 'In Progress', 'Pending', 'Resolved']), def: 'Open' }, F.priority, F.urgency, F.impact] },
      assignmentSec, contextSec, linkedSec,
    ],
  },
  change: {
    id: 'change', title: () => 'Create Change', cta: 'Create Change', nameKey: 'subject', idOf: (n) => `CHG-${n}`, seqStart: 300,
    check: endAfterStart('startDate', 'endDate'),
    sections: [
      startFrom, requesterSec,
      ticketDetails('Change', 'What will change and why.'),
      { title: 'Schedule', sub: 'When the change window opens and closes.', fields: [F.startDate, F.endDate] },
      {
        title: 'Classification', sub: 'What kind of change it is and where it lands.',
        fields: [{ ...F.category, options: () => opts(CHANGE_CATEGORY_185) }, { key: 'changeType', label: 'Change Type', kind: 'select', options: () => opts(CHANGE_TYPE_185) },
          { key: 'changeReason', label: 'Change Reason', kind: 'select', options: () => opts(['Upgrade', 'Maintenance', 'Security fix', 'New requirement', 'Incident fix']) },
          { key: 'environment', label: 'Target Environment', kind: 'select', options: () => opts(['Production', 'Staging', 'Development', 'Disaster Recovery']) }, F.tags],
      },
      { title: 'Risk & priority', sub: 'How risky and how urgent the change is.', fields: [{ key: 'risk', label: 'Change Risk', kind: 'select', options: () => opts(CHANGE_RISK_185), def: 'Low' }, F.priority, F.urgency, F.impact] },
      {
        title: 'Change roles', sub: 'Who owns, reviews and carries out the change.',
        fields: [{ key: 'changeManager', label: 'Change Manager', kind: 'person', options: technicians }, { key: 'changeReviewer', label: 'Change Reviewer', kind: 'person', options: technicians }, { key: 'changeImplementer', label: 'Change Implementer', kind: 'person', options: technicians }],
      },
      assignmentSec, contextSec, linkedSec,
    ],
  },
  release: {
    id: 'release', title: () => 'Create Release', cta: 'Create Release', nameKey: 'subject', idOf: (n) => `REL-${n}`, seqStart: 100,
    check: endAfterStart('startDate', 'endDate'),
    sections: [
      { ...startFrom, fields: [{ ...F.template, options: () => opts(RELEASE_TEMPLATES_185), fills: TEMPLATE_FILLS_185.release }, { ...F.transition, options: () => opts(RELEASE_TRANSITION_MODELS_185) }] }, requesterSec,
      ticketDetails('Release', 'What is being released.'),
      { title: 'Schedule', sub: 'When the release starts and ends.', fields: [F.startDate, F.endDate] },
      {
        title: 'Classification', sub: 'What kind of release it is and which services it touches.',
        fields: [F.category, { key: 'releaseType', label: 'Release Type', kind: 'select', options: () => opts(RELEASE_TYPES_185) },
          { key: 'releaseReason', label: 'Release Reason', kind: 'select', options: () => opts(['New feature', 'Bug fixes', 'Security update', 'Performance']) },
          { key: 'services', label: 'Business Services', kind: 'multi', options: () => opts(SERVICES) }, F.tags],
      },
      { title: 'Risk & priority', sub: 'How risky and how urgent the release is.', fields: [{ key: 'risk', label: 'Release Risk', kind: 'select', options: () => opts(RISKS), def: 'Low' }, F.priority, F.urgency, F.impact] },
      assignmentSec, contextSec, linkedSec,
    ],
  },
  task: {
    id: 'task', title: () => 'Create Task', cta: 'Create Task', nameKey: 'subject', idOf: (n) => `TA-${n}`, seqStart: 900,
    check: endAfterStart('startDate', 'endDate'),
    sections: [
      { title: 'Task', sub: 'What has to be done.', fields: [{ key: 'taskName', label: 'Task Name', kind: 'text', placeholder: 'Task Name' }, F.subject, { key: 'userGroup', label: 'User Group', kind: 'select', options: techGroups }, { key: 'taskType', label: 'Task Type', kind: 'select', options: () => opts(['Implementation', 'Install/Uninstall', 'Maintainance', 'Planning', 'Release', 'Replacement/Repair', 'Testing', 'Troubleshooting', 'Milestone']), def: 'Implementation' }, F.description, F.attachments] },
      { title: 'Assignment', sub: 'Who does it.', fields: [F.techGroup, F.assignee] },
      {
        title: 'Schedule', sub: 'When it runs, and when to remind the assignee.',
        fields: [field(F.startDate, { required: false }), field(F.endDate, { required: false }), { key: 'notifyBefore', label: 'Notify Before', kind: 'number', placeholder: 'e.g. 2' }, { key: 'notifyUnit', label: 'Notify Before In', kind: 'select', options: () => opts(['Hours', 'Days']), def: 'Hours' }],
      },
      { title: 'Priority & status', sub: 'How urgent it is and where it stands.', fields: [{ key: 'status', label: 'Status', kind: 'select', options: () => opts(TASK_STATUS_185), def: 'Open' }, F.priority] },
    ],
  },
  asset: {
    id: 'asset', title: (v) => (v.assetKind ? `Add ${kindOf(v)} Asset` : 'Add Asset'), cta: 'Add Asset', nameKey: 'name', idOf: (n) => `AST-${n}`, seqStart: 9000,
    sections: assetSections(false),
  },
  ci: {
    id: 'ci', title: () => 'Add CI', cta: 'Add CI', nameKey: 'name', idOf: (n) => `CI-${n}`, seqStart: 900,
    sections: assetSections(true),
  },
  license: {
    id: 'license', title: () => 'Add Software License', cta: 'Add License', nameKey: 'name', idOf: (n) => `LIC-${n}`, seqStart: 90,
    check: endAfterStart('purchaseDate', 'expiryDate', 'Expiry Date'),
    sections: [
      {
        title: 'License', sub: 'Which software this license covers.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true, wide: true },
          { key: 'product', label: 'Product', kind: 'select', required: true, options: () => opts(uniq(softwareAssets.map((a) => a.name.split(' — ')[0]).filter((n) => n.includes(' ')))) },
          { key: 'licenseType', label: 'License Type', kind: 'select', required: true, options: () => opts(LICENSE_TYPE_OPTIONS) },
          { key: 'purchaseCount', label: 'Purchase Count', kind: 'number', required: true, placeholder: 'How many were bought', when: (v) => ['Single Machine', 'Multiple Machines', 'Node Locked', 'Single User', 'Volume Users'].includes(String(v.licenseType)) },
          { key: 'suite', label: 'Suite', kind: 'switch' },
        ],
      },
      {
        title: 'Managed software', sub: 'The software assets this license is counted against.',
        fields: [{ key: 'ignoreVersion', label: 'Ignore Version', kind: 'switch' }],
        block: 'managedSoftware', blockRequired: true,
      },
      {
        title: 'Key & purchase', sub: 'The keys, what it cost and when it runs out.',
        fields: [
          { key: 'licenseKey', label: 'License Key', kind: 'list', wide: true, placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX' },
          { key: 'purchaseDate', label: 'Purchase Date', kind: 'date' },
          { key: 'expiryDate', label: 'Expiry Date', kind: 'date' },
          { key: 'cost', label: 'Cost', kind: 'amount' },
          { key: 'version', label: 'Version', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'textarea', wide: true },
        ],
      },
    ],
  },
  purchase: {
    id: 'purchase', title: () => 'Create Purchase Order', cta: 'Create Purchase Order', nameKey: 'name', idOf: (n) => `PO-2611-${String(n).padStart(3, '0')}`, seqStart: 100,
    sections: [
      {
        title: 'Order', sub: 'What is being bought, for whom, and by when.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'orderNumber', label: 'Order Number', kind: 'text', placeholder: 'Vendor reference' },
          F.requester,
          { key: 'requiredBy', label: 'Required By', kind: 'date', required: true },
          F.tags, F.description, F.attachments,
        ],
      },
      {
        title: 'Vendor & currency', sub: 'Who you are buying from and in which currency.',
        fields: [field(F.vendor, { required: true }), { key: 'currency', label: 'Currency', kind: 'select', required: true, options: () => opts(CURRENCIES), def: 'INR' }],
      },
      { title: 'Items', sub: 'What is on the order — quantity, price and tax per line.', block: 'poItems' },
      {
        title: 'Shipping address', sub: 'Where the goods are delivered.',
        fields: [
          { key: 'shipStreet', label: 'Street', kind: 'text', required: true, wide: true },
          { key: 'shipLandmark', label: 'Landmark', kind: 'text' },
          { key: 'shipCity', label: 'City', kind: 'text', required: true },
          { key: 'shipPincode', label: 'Pincode', kind: 'text' },
          { key: 'shipState', label: 'State', kind: 'text', required: true },
          { key: 'shipCountry', label: 'Country', kind: 'select', required: true, options: () => opts(COUNTRIES), def: 'India' },
        ],
      },
      {
        title: 'Billing address', sub: 'Where the invoice goes.',
        fields: [
          { key: 'billSame', label: 'Same as the shipping address', kind: 'switch', def: true },
          { key: 'billStreet', label: 'Street', kind: 'text', required: true, wide: true, when: (v) => !v.billSame },
          { key: 'billLandmark', label: 'Landmark', kind: 'text', when: (v) => !v.billSame },
          { key: 'billCity', label: 'City', kind: 'text', required: true, when: (v) => !v.billSame },
          { key: 'billPincode', label: 'Pincode', kind: 'text', when: (v) => !v.billSame },
          { key: 'billState', label: 'State', kind: 'text', required: true, when: (v) => !v.billSame },
          { key: 'billCountry', label: 'Country', kind: 'select', required: true, options: () => opts(COUNTRIES), def: 'India', when: (v) => !v.billSame },
        ],
      },
      {
        title: 'Ownership & accounting', sub: 'Who owns the order and where it is booked.',
        fields: [{ key: 'owner', label: 'Owner', kind: 'person', options: technicians }, { key: 'costCenter', label: 'Cost Center', kind: 'select', options: () => opts(COST_CENTER_OPTIONS) }, { key: 'glCode', label: 'GL Code', kind: 'text', placeholder: 'e.g. 6100-IT-HW' }],
      },
      {
        title: 'Terms & printing', sub: 'The terms on the order and how it is printed.',
        fields: [{ key: 'terms', label: 'Terms', kind: 'textarea', wide: true }, { key: 'printTemplate', label: 'Print Template', kind: 'select', options: () => opts(PRINT_TEMPLATES_185), def: 'custom template' }, { key: 'signingAuthority', label: 'Signing Authority', kind: 'person', options: technicians }],
      },
    ],
  },
  contract: {
    id: 'contract', title: () => 'Create Contract', cta: 'Create Contract', nameKey: 'name', idOf: (n) => `CON-${n}`, seqStart: 200,
    check: endAfterStart('startDate', 'endDate', 'Contract End Date'),
    sections: [
      {
        title: 'Contract', sub: 'What the contract is.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'contractNumber', label: 'Contract Number', kind: 'text' },
          { key: 'contractType', label: 'Contract Type', kind: 'select', required: true, options: () => opts(CONTRACT_TYPE_OPTIONS), def: 'Lease' },
          { key: 'parent', label: 'Parent Contract', kind: 'select', options: () => mockContracts.map((c) => ({ value: c.id, label: c.name, hint: c.id })) },
          F.description, F.attachments,
        ],
      },
      { title: 'Vendor & cost', sub: 'Who it is with and what it costs.', fields: [field(F.vendor, { required: true }), { key: 'cost', label: 'Cost', kind: 'amount' }] },
      { title: 'Term', sub: 'When it starts and ends.', fields: [{ key: 'startDate', label: 'Contract Start Date', kind: 'date', required: true }, { key: 'endDate', label: 'Contract End Date', kind: 'date', required: true }] },
      { title: 'Ownership', sub: 'Who owns it inside the company.', fields: [{ key: 'owner', label: 'Owner', kind: 'person', options: technicians }, F.department] },
    ],
  },
  patch: {
    id: 'patch', title: () => 'Create Patch', cta: 'Create Patch', nameKey: 'title', idOf: (n) => `PCH-${n}`, seqStart: 5000,
    sections: [
      {
        title: 'Patch', sub: 'What the patch is.',
        fields: [{ key: 'title', label: 'Title', kind: 'text', required: true, wide: true }, { key: 'kb', label: 'KB Number', kind: 'text', placeholder: 'e.g. KB5044284' }, { key: 'url', label: 'Reference URL', kind: 'text', placeholder: 'https://' }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }],
      },
      {
        title: 'Classification', sub: 'How severe it is and when it was released.',
        fields: [{ key: 'patchCategory', label: 'Patch Category', kind: 'select', required: true, options: () => opts(PATCH_CATEGORIES) }, { key: 'severity', label: 'Severity', kind: 'select', required: true, options: () => opts(PATCH_SEVERITIES) }, { key: 'releaseDate', label: 'Release Date', kind: 'date', required: true }],
      },
      { title: 'Applies to', sub: 'Which systems and applications it is for.', fields: [{ key: 'architecture', label: 'Architecture', kind: 'select', required: true, options: () => opts(['x64', 'x86', 'ARM64']) }], block: 'applications' },
      { title: 'Installation', sub: 'What happens on the endpoint when it installs.', fields: [{ key: 'reboot', label: 'Reboot Required', kind: 'pills', required: true, options: () => opts(REBOOT_185), def: 'No' }, { key: 'uninstall', label: 'Support Uninstallation', kind: 'switch', def: false }] },
    ],
  },
  'patch-deployment': {
    id: 'patch-deployment', title: () => 'Create Patch Deployment', cta: 'Publish', secondary: 'Save as Draft', nameKey: 'name', idOf: (n) => `PDR-${n}`, seqStart: 1440,
    sections: [
      {
        title: 'Deployment', sub: 'Name the run, what kind of run it is, and whether it installs or removes.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true, wide: true },
          {
            key: 'category', label: 'Deployment Category', kind: 'pills', required: true, options: () => opts(['Patch', 'OS Upgrade']), def: 'Patch',
            hint: (v) => (v.category === 'OS Upgrade' ? 'Deploys an uploaded ISO from Admin › Patch Management › OS Upgrade.' : 'Deploys approved patches to the endpoints you target.'),
          },
          configType,
        ],
      },
      deploymentSchedule,
      { title: (v) => (v.category === 'OS Upgrade' ? 'OS upgrade patch' : 'Patches'), sub: (v) => (v.category === 'OS Upgrade' ? 'The one OS image this run installs.' : 'What the run deploys.'), block: 'patchPayload', blockRequired: true },
      { title: 'Target endpoints', sub: 'Add whole remote offices, single endpoints, or both. An endpoint picked both ways is deployed to once.', block: 'targets', when: (v) => list(v.category === 'OS Upgrade' ? v.osImage : v.patches).length > 0 },
      deploymentConfig,
    ],
  },
  'package-deployment': {
    id: 'package-deployment', title: () => 'Create Package Deployment', cta: 'Publish', secondary: 'Save as Draft', nameKey: 'name', idOf: (n) => `CDR-${n}`, seqStart: 42,
    sections: [
      { title: 'Deployment', sub: 'Name the run and say whether it installs or removes.', fields: [{ key: 'name', label: 'Name', kind: 'text', required: true, wide: true }, configType] },
      deploymentSchedule,
      { title: 'Packages', sub: 'The software packages the run deploys.', block: 'packages', blockRequired: true },
      { title: 'Target endpoints', sub: 'Add whole remote offices, single endpoints, or both. An endpoint picked both ways is deployed to once.', block: 'targets', when: (v) => list(v.packages).length > 0 },
      deploymentConfig,
    ],
  },
  'registry-deployment': {
    id: 'registry-deployment', title: () => 'Create Registry Deployment', cta: 'Publish', secondary: 'Save as Draft', nameKey: 'name', idOf: (n) => `CDR-${n}`, seqStart: 133,
    sections: [
      { title: 'Deployment', fields: [{ key: 'name', label: 'Name', kind: 'text', required: true, wide: true }] },
      deploymentSchedule,
      { title: 'Registry templates', sub: 'The registry changes the run applies.', block: 'registry', blockRequired: true },
      { title: 'Target endpoints', sub: 'Add whole remote offices, single endpoints, or both. An endpoint picked both ways is deployed to once.', block: 'targets', when: (v) => list(v.registry).length > 0 },
      deploymentConfig,
    ],
  },
  'auto-patch-test': {
    id: 'auto-patch-test', title: () => 'Create Automatic Patch Test', cta: 'Create', nameKey: 'name', idOf: (n) => `APT-${n}`, seqStart: 20,
    sections: [
      { title: 'Rule', fields: [{ key: 'name', label: 'Name', kind: 'text', required: true, wide: true }] },
      { title: 'Which patches', sub: 'The patches this rule picks up as they arrive.', fields: patchPicks, block: 'scopedApps', blockRequired: true, blockWhen: (v) => v.appScope !== 'All applications' },
      { title: 'Test group', sub: 'Where the patches are tried before they reach everyone.', fields: [{ key: 'endpointGroup', label: 'Endpoint Group', kind: 'select', required: true, options: () => opts(REMOTE_OFFICES) }] },
      {
        title: 'Configuration settings', sub: 'How long a test runs, when it approves, and who hears about it.',
        fields: [
          { key: 'policy', label: 'Deployment Policy', kind: 'select', required: true, options: () => opts(DEPLOYMENT_POLICIES) },
          { key: 'notify', label: 'Notify to', kind: 'people', options: notifyTo },
          { key: 'expiresAfter', label: 'Expires After (hours)', kind: 'number', placeholder: 'e.g. 48' },
          { key: 'autoApproveDays', label: 'Auto Approve After (days)', kind: 'number', required: true, def: '0' },
          { key: 'retry', label: 'Retry Failed Configuration', kind: 'switch', def: false },
    { key: 'retryCount', label: 'Retry Count', kind: 'number', required: true, def: '0', when: (v) => !!v.retry },
        ],
      },
    ],
  },
  'auto-patch-deployment': {
    id: 'auto-patch-deployment', title: () => 'Create Automatic Patch Deployment', cta: 'Create', nameKey: 'name', idOf: (n) => `APD-${n}`, seqStart: 20,
    sections: [
      { title: 'Rule', fields: [{ key: 'name', label: 'Name', kind: 'text', required: true, wide: true }] },
      { title: 'Which patches', sub: 'The patches this rule picks up as they arrive.', fields: patchPicks, block: 'scopedApps', blockRequired: true, blockWhen: (v) => v.appScope !== 'All applications' },
      { title: 'Target endpoints', sub: 'Where they are deployed. An endpoint picked both ways is deployed to once.', block: 'targets', blockRequired: true },
      {
        title: 'Schedule', sub: 'When it runs after a patch is approved, and when it stops trying.',
        fields: [
          { key: 'scheduleType', label: 'Schedule Type', kind: 'select', required: true, options: () => opts(['Once', 'Daily', 'Weekly', 'Monthly', 'Interval']) },
          { key: 'startAt', label: 'Start At', kind: 'datetime', required: true, when: (v) => v.scheduleType === 'Once' || v.scheduleType === 'Interval' },
          { key: 'startOn', label: 'Start At', kind: 'date', required: true, when: (v) => ['Daily', 'Weekly', 'Monthly'].includes(String(v.scheduleType)) },
          { key: 'runDays', label: 'Day', kind: 'multi', required: true, options: () => opts(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']), when: (v) => v.scheduleType === 'Weekly' },
          { key: 'monthMode', label: 'When should this scheduler run?', kind: 'pills', options: () => opts(['On a date', 'On a weekday']), def: 'On a date', when: (v) => v.scheduleType === 'Monthly', wide: true },
          { key: 'runDate', label: 'Date', kind: 'multi', required: true, options: () => opts(Array.from({ length: 31 }, (_, i) => String(i + 1))), when: (v) => v.scheduleType === 'Monthly' },
          { key: 'runMonths', label: 'Month', kind: 'multi', required: true, options: () => opts(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']), when: (v) => v.scheduleType === 'Monthly' },
          { key: 'runTime', label: 'Time', kind: 'time', required: true, when: (v) => ['Daily', 'Weekly', 'Monthly'].includes(String(v.scheduleType)) },
          { key: 'interval', label: 'Interval (hours)', kind: 'number', required: true, placeholder: 'e.g. 6', when: (v) => v.scheduleType === 'Interval' },
          { key: 'deployAfterDays', label: 'Deploy After Approval (days)', kind: 'number', def: '0' },
          { key: 'expiresAfter', label: 'Expires After (days)', kind: 'number', placeholder: 'e.g. 7' },
        ],
      },
      { ...deploymentConfig, title: 'Configuration settings' },
    ],
  },
  knowledge: {
    id: 'knowledge', title: () => 'Create Article', cta: 'Save as Draft', nameKey: 'title', idOf: (n) => `KB-${n}`, seqStart: 100,
    sections: [
      {
        title: 'Article', sub: 'The title, where it is filed, and what it says.',
        fields: [
          { key: 'title', label: 'Title', kind: 'text', required: true, wide: true },
          { key: 'folder', label: 'Folder', kind: 'select', required: true, options: () => KNOWLEDGE_FOLDERS.map((f) => ({ value: f.id, label: f.label, hint: `Read: ${f.read}` })) },
          { key: 'content', label: 'Content', kind: 'rich', required: true, wide: true },
        ],
      },
      { title: 'Publishing', sub: 'How people find it and when it stops being valid.', fields: [{ key: 'expiryDate', label: 'Expiry Date', kind: 'date' }, F.tags, F.attachments] },
    ],
  },
  project: {
    id: 'project', title: () => 'Create Project', cta: 'Create Project', nameKey: 'name', idOf: (n) => `PRJ-${n}`, seqStart: 100,
    check: endAfterStart('startDate', 'endDate', 'Project End Date'),
    sections: [
      {
        title: 'Project', sub: 'What the project is.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'projectType', label: 'Project Type', kind: 'select', required: true, options: () => opts(PROJECT_TYPES_185) },
          F.description, { key: 'overview', label: 'Detailed Overview', kind: 'rich', wide: true }, F.tags, F.attachments,
        ],
      },
      { title: 'Timeline', sub: 'When it starts and ends.', fields: [{ key: 'startDate', label: 'Project Start Date', kind: 'date', required: true }, { key: 'endDate', label: 'Project End Date', kind: 'date', required: true }] },
      {
        title: 'Status, priority & risk', sub: 'Where it stands and how much it matters.',
        fields: [
          { key: 'status', label: 'Project Status', kind: 'select', required: true, options: () => opts(['Open', 'Planning', 'Implementation', 'On Hold']), def: 'Planning' },
          { key: 'priority', label: 'Priority', kind: 'select', required: true, options: () => opts(LEVELS_185), def: 'Low' },
          { key: 'risk', label: 'Project Risk', kind: 'select', required: true, options: () => opts(PROJECT_RISK_185), def: 'Low' },
        ],
      },
      { title: 'Ownership', sub: 'Who owns it and who else is involved.', fields: [{ key: 'owner', label: 'Owner', kind: 'person', required: true, options: technicians }, F.location, F.vendor] },
    ],
  },
  report: {
    id: 'report', title: () => 'Create Report', cta: 'Create Report', nameKey: 'name', idOf: (n) => `RPT-${n}`, seqStart: 500,
    sections: [
      {
        title: 'Basic details', sub: 'What the report is and who can see it.',
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'module', label: 'Module', kind: 'select', required: true, options: () => CATEGORIES.map((c) => ({ value: c.id, label: c.label })), def: 'request' },
          { key: 'type', label: 'Type', kind: 'pills', required: true, options: () => opts(['Tabular', 'Matrix', 'Summary', 'Plugin', 'Query']), def: 'Tabular', wide: true },
          { key: 'pluginId', label: 'Plugin Identifier', kind: 'text', required: true, when: (v) => v.type === 'Plugin' },
          { key: 'access', label: 'Report Access Level', kind: 'pills', required: true, options: () => opts(['Private', 'Public', 'Restricted']), def: 'Private' },
          { key: 'groupAccess', label: 'Technician Group Access Level', kind: 'people', options: () => TECH_GROUPS.map((g) => ({ value: g, label: g })), when: (v) => v.access === 'Restricted' },
          { key: 'techAccess', label: 'Technician Access Level', kind: 'people', options: technicians, when: (v) => v.access === 'Restricted' },
          { key: 'description', label: 'Description', kind: 'textarea', wide: true },
        ],
      },
      {
        title: 'Filters', sub: 'Which records it counts.',
        fields: [
          { key: 'applyDateFilter', label: 'Apply Date Filter', kind: 'switch', def: false, when: (v) => v.type === 'Query' },
          { key: 'query', label: 'Query', kind: 'textarea', required: true, placeholder: 'SELECT …', when: (v) => v.type === 'Query', wide: true },
          { key: 'dateFilter', label: 'Date Filter', kind: 'select', required: true, when: (v) => v.type !== 'Query', options: () => opts(['Created Date', 'Updated Date', 'Resolved Date', 'Closed Date', 'Due By']), def: 'Created Date' },
          { key: 'groupBy', label: 'Group By', kind: 'select', when: (v) => v.type === 'Tabular' || v.type === 'Matrix', options: () => opts(['Status', 'Priority', 'Category', 'Technician Group', 'Assignee', 'Department']) },
        ],
      },
      { title: 'Conditions', sub: 'Narrow it further. Every condition must match.', block: 'conditions', when: (v) => v.type !== 'Query' },
      {
        title: 'Chart', sub: 'How a summary or matrix report is drawn.', when: (v) => v.type === 'Summary' || v.type === 'Matrix',
        fields: [{ key: 'chart', label: 'Chart Type', kind: 'pills', options: () => opts(['Column', 'Bar', 'Line', 'Pie', 'Donut']), def: 'Column' }],
      },
      {
        title: 'Columns', sub: 'Which columns the report shows, in the order you pick them.',
        fields: [{ key: 'columns', label: 'Columns', kind: 'multipick', required: true, wide: true, options: (v) => opts(REPORT_COLUMNS[String(v?.module ?? '').includes('asset') ? 'asset' : v?.module === 'patch' ? 'patch' : 'default']) }],
      },
    ],
  },
};

/** Asset Type and Status options follow the asset kind — the two fields above declare none. */
export const assetOptions = {
  types: (k: AssetKind) => opts(assetTypes(k)),
  statuses: (k: AssetKind) => opts(assetStatuses(k)),
  /** Every kind's types under its kind's heading — Add Asset opened from the header + menu. The
   *  value carries the kind (`Software|Application`) because one type name can sit under two kinds. */
  allTypes: (): SelectOption[] => (['Hardware', 'Software', 'Non-IT', 'Consumable'] as AssetKind[]).flatMap((k) => assetTypes(k).map((t) => ({ value: `${k}|${t}`, label: t, group: `${k} Asset` }))),
};
export const ciStatuses = () => opts(CI_STATUS_185);

/** Columns a report can show, per module. */
export const REPORT_COLUMNS: Record<string, string[]> = {
  default: ['ID', 'Subject', 'Requester', 'Status', 'Priority', 'Urgency', 'Impact', 'Category', 'Technician Group', 'Assignee', 'Department', 'Location', 'Created Date', 'Due By', 'Resolved Date'],
  asset: ['ID', 'Name', 'Asset Type', 'Status', 'Used By', 'Managed By', 'Department', 'Location', 'Vendor', 'Acquisition Date'],
  patch: ['ID', 'Name', 'Severity', 'Category', 'Release Date', 'Missing Systems', 'Installed Systems', 'Approval Status'],
};
export const CONDITION_OPERATORS = ['is', 'is not', 'contains', 'does not contain', 'is empty', 'is not empty'];
