/* The Tasks listing's filter catalogue — the twelve attributes the product offers on a task,
   in its own order. It feeds the filter builder, the Manage-columns list (minus whatever the
   grid already shows), the grid's Status / Task Type dropdowns and the quick filters, so
   every surface reads one list.

   Keys point at REAL row fields wherever the mock carries one (id / subject / status /
   priority / x_taskType / x_reference / assignedTo); the rest fall back to the shared
   per-record stand-in, so picking one narrows the list instead of emptying it. */
import { AlignLeft, CalendarDays, CircleDot, Flag, Hash, Hourglass, Link2, ListChecks, Paperclip, UserCheck, UserRound, Users } from 'lucide-react';
import { TECH_GROUPS } from './technicianRoster';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* The six states a task moves through, in the order the product lists them — and the same
   palette the other listings use, so a dot means the same thing here as there. */
export const TASK_STATUS_OPTIONS = [
  { label: 'Open', color: '#F59E0B' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Pending', color: '#FB923C' },
  { label: 'Rejected', color: '#EF4444' },
  { label: 'Resolved', color: '#22C55E' },
  { label: 'Closed', color: '#6B7280' },
];

/* The nine types the product offers, in its own order — and its own spelling of
   "Maintainance", which is what the admin screen shows. */
export const TASK_TYPE_OPTIONS = o([
  'Implementation', 'Install/Uninstall', 'Maintainance', 'Planning', 'Release',
  'Replacement/Repair', 'Testing', 'Troubleshooting', 'Milestone',
]);

export const TASK_ASSIGNEES = [
  'Tabrez Khan', 'Sarah Johnson', 'Vikram Sethi', 'Rahul Verma', 'Neha Raje', 'Siddharth Rao',
  'Ananya Iyer', 'Karan Malhotra', 'Priya Nair', 'Rakesh Rathod', 'Farah Sheikh', 'Diya Kapoor',
  'Juli Mathew', 'Rohan Mehta', 'Meera Krishnan',
];

export const TASK_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Subject', icon: AlignLeft, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: TASK_STATUS_OPTIONS },
  { key: 'priority', label: 'Priority', icon: Flag, type: 'select', options: [
    { label: 'Low', color: '#3D8BD0' },
    { label: 'Medium', color: '#F59E0B' },
    { label: 'High', color: '#EF4444' },
    { label: 'Urgent', color: '#DC2626' },
  ] },
  /* The window the task is scheduled into — separate keys, because "starts this week" and
     "due this week" are different questions. */
  { key: 'taskStart', label: 'Start Date', icon: CalendarDays, type: 'date' },
  { key: 'taskEnd', label: 'End Date', icon: CalendarDays, type: 'date' },
  { key: 'x_taskType', label: 'Task Type', icon: ListChecks, type: 'select', options: TASK_TYPE_OPTIONS },
  /* The record the task hangs off — a request, problem or change. Standalone tasks have none. */
  { key: 'x_reference', label: 'Reference', icon: Link2, type: 'text' },
  { key: 'taskAttachment', label: 'Attachment', icon: Paperclip, type: 'select', options: o(['Yes', 'No']) },
  { key: 'assignedTo', label: 'Assignee', icon: UserCheck, type: 'select', people: 'technician', options: o(TASK_ASSIGNEES) },
  { key: 'taskGroup', label: 'User Group', icon: Users, type: 'select', options: o(TECH_GROUPS) },
  /* Who RAISED the task — a different person from the one doing it, and a different field
     from the grid's Created Date. */
  { key: 'taskCreatedBy', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(TASK_ASSIGNEES) },
  /* Backs the SLA Status column and the KPI strip's Overdue card: not in the product's
     attribute list, but a filter applied from either has to leave a readable chip. */
  { key: 'x_overdue', label: 'SLA Status', icon: Hourglass, type: 'select', hidden: true, options: [
    { label: 'Breached', color: '#EF4444' },
    { label: 'Due soon', color: '#F59E0B' },
    { label: 'On track', color: '#22C55E' },
    { label: 'Met', color: '#94A3B8' },
  ] },
];
