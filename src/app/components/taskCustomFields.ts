/* Admin-created custom fields on the Task form.
 *
 * Same idea as the Request page's DEMO_CUSTOM_FORM_FIELDS, at the scale a task actually needs:
 * grouped so the accordion and the expand popup can render section headers, and coloured where the
 * value is a state worth spotting rather than a plain string. */

export interface TaskCustomField {
  label: string;
  value: string;
  /** Dot colour — set only where the value reads as a state. */
  color?: string;
  /** Section header; the accordion starts a new group whenever this changes. */
  group?: string;
}

/* The task's Key Information — the fields a technician actually sets on a task. One definition
   feeds both the right-panel accordion (read-only rows) and the expand popup (editable), so the
   two can never drift apart. */
export interface TaskKeyField {
  label: string;
  value: string;
  /** Dot colour for the current value. */
  color?: string;
  /** Present where the field is a picker; the popup renders these as a dropdown. */
  options?: { label: string; color?: string }[];
}

export const TASK_STATUS_OPTIONS = [
  { label: 'Open', color: '#F59E0B' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'On Hold', color: '#8B5CF6' },
  { label: 'Closed', color: '#22A06B' },
];

export const TASK_PRIORITY_OPTIONS = [
  { label: 'P1', color: '#DC2626' },
  { label: 'P2', color: '#F59E0B' },
  { label: 'P3', color: '#3D8BD0' },
  { label: 'P4', color: '#64748B' },
];

export const TASK_TYPE_OPTIONS = [
  { label: 'Implementation' },
  { label: 'Review' },
  { label: 'Testing' },
  { label: 'Approval' },
  { label: 'Documentation' },
];

export const TASK_USER_GROUP_OPTIONS = [
  { label: 'Unassigned' },
  { label: 'End User Computing' },
  { label: 'Network Operations' },
  { label: 'IT Support Team' },
  { label: 'Application Support' },
];

export const TASK_ASSIGNEE_OPTIONS = [
  { label: 'Unassigned' },
  { label: 'Sarah Johnson' },
  { label: 'Michael Chen' },
  { label: 'Emma Wilson' },
  { label: 'David Kim' },
  { label: 'Lisa Anderson' },
];

export const TASK_KEY_FIELDS: TaskKeyField[] = [
  { label: 'Status', value: 'In Progress', options: TASK_STATUS_OPTIONS },
  { label: 'Priority', value: 'P1', options: TASK_PRIORITY_OPTIONS },
  { label: 'Task Type', value: 'Implementation', options: TASK_TYPE_OPTIONS },
  { label: 'User Group', value: 'Unassigned', options: TASK_USER_GROUP_OPTIONS },
  { label: 'Assignee', value: 'Unassigned', options: TASK_ASSIGNEE_OPTIONS },
  { label: 'Start Date - End Date', value: 'Mon, Aug 17, 2026 08:35 PM' },
];

export const TASK_CUSTOM_FORM_FIELDS: TaskCustomField[] = [
  // --- Execution ---
  { label: 'Effort Estimate', value: '4 hours', group: 'Execution Details' },
  { label: 'Actual Effort', value: '2 hours 30 minutes', group: 'Execution Details' },
  { label: 'Requires Downtime', value: 'No', color: '#22A06B', group: 'Execution Details' },
  { label: 'Change Window', value: 'Sat 22:00 – 02:00', group: 'Execution Details' },

  // --- Ownership ---
  { label: 'Reporting Manager', value: 'Rakesh Rathod', group: 'Ownership' },
  { label: 'Technician Group', value: 'End User Computing', color: '#3D8BD0', group: 'Ownership' },
  { label: 'Cost Center', value: 'CC-1001', color: '#3D8BD0', group: 'Ownership' },

  // --- Verification ---
  { label: 'Verification Method', value: 'Peer review', group: 'Verification' },
  { label: 'Vendor Involved', value: 'Dell Inc.', group: 'Verification' },
  { label: 'Rollback Plan', value: 'Restore the previous image from the deployment share', group: 'Verification' },
];
