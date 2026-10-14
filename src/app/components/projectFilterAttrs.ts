/* The Projects listing's filter catalogue — the product's own attribute list for a
   project, in its own order. It feeds the filter builder, the Manage-columns list (minus
   whatever the grid already shows), the grid's Status / Priority / Owner dropdowns and the
   saved views, so every surface reads ONE list.

   The last four visible entries — Checkbox, Text Input, Dependent, Datetime — are
   admin-created custom fields, reproduced from the product's list under the generic names
   it shows them by. Every attribute here resolves to a REAL value on the row (see the
   listing's adapter), so picking one narrows the list instead of emptying it.

   The `hidden` block at the end is this module's own derivations: they back columns, the
   KPI-style bands and the saved views, but they are not product attributes, so neither the
   filter picker nor Manage columns offers them. */
import {
  AlignLeft, CalendarClock, CalendarDays, CheckSquare, CircleDot, Flag, GitBranch, Hash,
  Hourglass, ListChecks, MapPin, Milestone, Paperclip, Percent, ShieldAlert, Store, Tag,
  TextCursorInput, UserRound,
} from 'lucide-react';
import { IconStatusCheck } from './SidebarIcons';
/* Type-only, so this file adds no runtime edge back into the filter bar — which already
   imports this module's catalogue. */
import type { Attr, QuickFilterDef } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* The six states a project moves through, in lifecycle order — and the same colours the
   module's own table has always used, so a dot means the same thing on both. */
export const PROJECT_STATUS_OPTIONS = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'Planning', color: '#8B5CF6' },
  { label: 'Implementation', color: '#22C55E' },
  { label: 'On Hold', color: '#D97706' },
  { label: 'Completed', color: '#94A3B8' },
  { label: 'Cancelled', color: '#EF4444' },
];

export const PROJECT_PRIORITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' },
  { label: 'High', color: '#F97316' },
  { label: 'Medium', color: '#94A3B8' },
  { label: 'Low', color: '#22C55E' },
];

/* Health, not lifecycle — the product carries both. "Implementation" says where a project
   is; "At Risk" says whether it will land. */
export const PROJECT_HEALTH_OPTIONS = [
  { label: 'On Track', color: '#22C55E' },
  { label: 'At Risk', color: '#F59E0B' },
  { label: 'Delayed', color: '#EF4444' },
  { label: 'Delivered', color: '#94A3B8' },
];

export const PROJECT_RISK_OPTIONS = [
  { label: 'Low', color: '#22C55E' },
  { label: 'Medium', color: '#F59E0B' },
  { label: 'High', color: '#EF4444' },
];

export const PROJECT_TYPE_OPTIONS = o([
  'Infrastructure', 'Application Delivery', 'Security & Compliance', 'Migration', 'Service Improvement',
]);
export const PROJECT_SOURCE_OPTIONS = o(['Technician Portal', 'Support Portal', 'Email', 'Business Request']);
export const PROJECT_VENDOR_OPTIONS = o([
  'Dell Technologies', 'Microsoft', 'Cisco Systems', 'Fortinet', 'Red Hat', 'In-house',
]);
export const PROJECT_LOCATION_OPTIONS = o([
  'Ahmedabad HQ', 'Pune Office', 'Mumbai Office', 'Bengaluru DC', 'Chennai DC',
]);
export const PROJECT_TAG_OPTIONS = o([
  'fy27-plan', 'capex', 'security', 'compliance', 'migration', 'quick-win', 'board-visible',
]);
/* The admin-created "Dependent" field: a dropdown whose values depend on the one above it,
   which is why the product names it that rather than for what it holds. */
export const PROJECT_DEPENDENT_OPTIONS = o(['Level 1', 'Level 2', 'Level 3']);

/** Everyone who runs a project here. Written out rather than derived from `mockProjects`:
 *  `TicketTable` reads this module at ITS module scope, and importing the list page from
 *  here closed a cycle through the drawer stack that left PROJECT_STATUS_OPTIONS in its
 *  temporal dead zone at startup. Source of truth is the `owner` field in
 *  ProjectsListPage's mockProjects — keep the two in step. */
export const PROJECT_OWNERS = [
  'Arjun Mehta', 'Priya Sharma', 'Vikram Singh', 'Rahul Deshmukh', 'Sneha Iyer',
  'Kavita Rao', 'Rohan Mehta', 'Neha Raje', 'Jainam Shah',
];

export const PROJECT_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_vendor', label: 'Vendor', icon: Store, type: 'select', options: PROJECT_VENDOR_OPTIONS },
  { key: 'x_lastUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician',
    options: o(PROJECT_OWNERS) },
  { key: 'priority', label: 'Priority', icon: Flag, type: 'select', options: PROJECT_PRIORITY_OPTIONS },
  { key: 'x_source', label: 'Source', icon: GitBranch, type: 'select', options: PROJECT_SOURCE_OPTIONS },
  { key: 'x_tags', label: 'Tags', icon: Tag, type: 'select', options: PROJECT_TAG_OPTIONS },
  { key: 'x_location', label: 'Location', icon: MapPin, type: 'select', options: PROJECT_LOCATION_OPTIONS },
  { key: 'x_risk', label: 'Project Risk', icon: ShieldAlert, type: 'select', options: PROJECT_RISK_OPTIONS },
  { key: 'x_projectType', label: 'Project Type', icon: ListChecks, type: 'select', options: PROJECT_TYPE_OPTIONS },
  { key: 'x_startDate', label: 'Project Start Date', icon: CalendarDays, type: 'date' },
  { key: 'x_endDate', label: 'Project End Date', icon: CalendarDays, type: 'date' },
  { key: 'x_createdDate', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'x_lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_closedDate', label: 'Closed Date', icon: CalendarDays, type: 'date' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: PROJECT_STATUS_OPTIONS },
  { key: 'x_planningStart', label: 'Planning Start Date', icon: CalendarDays, type: 'date' },
  { key: 'x_implStart', label: 'Implementation Start Date', icon: CalendarDays, type: 'date' },
  { key: 'x_attachment', label: 'Attachment', icon: Paperclip, type: 'select', options: o(['Yes', 'No']) },
  /* ── The four admin-created custom fields, under the product's own generic names. */
  { key: 'x_checkbox', label: 'Checkbox', icon: CheckSquare, type: 'select', options: o(['Yes', 'No']) },
  { key: 'x_textInput', label: 'Text Input', icon: TextCursorInput, type: 'text' },
  { key: 'x_dependent', label: 'Dependent', icon: GitBranch, type: 'select', options: PROJECT_DEPENDENT_OPTIONS },
  { key: 'x_datetime', label: 'Datetime', icon: CalendarClock, type: 'date' },
  { key: 'x_projectStatus', label: 'Project Status', icon: CircleDot, type: 'select', options: PROJECT_HEALTH_OPTIONS },
  { key: 'assignedTo', label: 'Owner', icon: UserRound, type: 'select', people: 'technician',
    options: [...PROJECT_OWNERS, 'Unassigned'].map((label) => ({ label })) },
  { key: 'x_createdBy', label: 'Created By', icon: UserRound, type: 'select', people: 'technician',
    options: o(PROJECT_OWNERS) },

  /* ── This module's own derivations. Not product attributes, so `hidden` keeps them out
     of the filter picker AND Manage columns — but the Due By column, the progress bar and
     the Overdue / Ending-in-30-days saved views all read them. */
  { key: 'x_dueBand', label: 'Due By', icon: Hourglass, type: 'select', hidden: true, options: [
    { label: 'Overdue', color: '#EF4444' },
    { label: 'Due soon', color: '#F59E0B' },
    { label: 'On track', color: '#22C55E' },
    { label: 'Met', color: '#94A3B8' },
  ] },
  { key: 'x_progressBand', label: 'Completion', icon: Percent, type: 'select', hidden: true, options: [
    { label: 'Not started', color: '#94A3B8' },
    { label: 'Under 25%', color: '#EF4444' },
    { label: '25–75%', color: '#F59E0B' },
    { label: 'Over 75%', color: '#3D8BD0' },
    { label: 'Complete', color: '#22C55E' },
  ] },
  { key: 'x_tasks', label: 'Tasks', icon: ListChecks, type: 'text', hidden: true },
  { key: 'x_milestones', label: 'Milestones', icon: Milestone, type: 'text', hidden: true },
];

/* The two one-click cuts a portfolio is read by: where each project stands, and how much it
   matters. Both read their values from the catalogue above, so a quick filter and the full
   filter builder can never offer different options for the same field. Priority is NOT
   reversed here (the request listing reverses its own) — this list already runs
   Critical-first, which is the order anyone scans it in. */
export const PROJECT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 200, row: 'dot', options: PROJECT_STATUS_OPTIONS },
  { field: 'priority', icon: Flag, tip: 'Filter by priority', title: 'Priority is', width: 176, row: 'flag', options: PROJECT_PRIORITY_OPTIONS },
];
