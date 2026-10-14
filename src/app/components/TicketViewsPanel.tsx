import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, CopyPlus, Home, LayoutList, Lock, MoreVertical, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { FilterRule } from './TicketFilterBar';

/* ─── Request listing views ──────────────────────────────────────────────────
   The Dashboards sidebar pattern brought to the listing: a DOCKED left rail
   (toggled from the panel icon beside the title) with search, tabs, favourite
   and recently-used groups, and the full view catalog. Picking a view applies
   its filter set to the grid and the page title takes the view's name. */

export interface TicketView {
  name: string;
  /** The grid filters this view applies (ids are stamped on apply). */
  rules: Omit<FilterRule, 'id'>[];
  /** User-created (saved/cloned) view — predefined ones ship with the product. */
  custom?: boolean;
  /** Technician who saved it; only the owner may delete it. */
  owner?: string;
  visibility?: 'My Self' | 'All Technician' | 'Technician In Group';
  /** Only for 'Technician In Group' — the group the view was shared with. */
  group?: string;
}

/** The signed-in technician — decides what lands in "My Views". */
/* Imported AND re-exported: this module uses CURRENT_USER at module scope (the seeded view
   owners below), and a bare `export … from` re-export would not bind the name locally. */
import { CURRENT_USER, groupOfTechnician } from './technicianRoster';
export { CURRENT_USER };

export const TICKET_VIEWS: TicketView[] = [
  { name: 'All Requests', rules: [] },
  { name: 'All Open Requests', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] }] },
  { name: 'My Urgent or High Priority Requests', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  { name: 'My Overdue Requests', rules: [{ field: 'sla', condition: 'is', values: ['Breached'] }] },
  { name: 'Unassigned Requests in My Group', rules: [{ field: 'assignedTo', condition: 'empty', values: [] }] },
  { name: 'My Unresolved Requests', rules: [{ field: 'status', condition: 'is not', values: ['Closed', 'Completed'] }] },
  {
    name: 'Urgent or High Priority Requests in my Group',
    rules: [
      { field: 'priority', condition: 'is', values: ['Urgent', 'High'] },
      { field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] },
    ],
  },
  { name: 'All Incidents', rules: [] },
  { name: 'All Service Requests', rules: [{ field: 'approval', condition: 'is', values: ['Pending approval'] }] },
  { name: 'All Spam Requests', rules: [{ field: 'subject', condition: 'contains', values: ['spam'] }] },
  { name: 'Requests Watched By Me', rules: [{ field: 'unread', condition: 'is', values: ['Has unread'] }] },
  { name: 'All Archived Requests', rules: [{ field: 'status', condition: 'is', values: ['Closed'] }] },
];

/* Saved (custom) views — what technicians build from the filter bar and share. Mine
   appear under My Views; a colleague's reaches me only through its visibility. */
export const CUSTOM_VIEW_SEEDS: TicketView[] = [
  { name: 'P1 Bridge Queue', custom: true, owner: CURRENT_USER, visibility: 'All Technician', rules: [{ field: 'priority', condition: 'is', values: ['Urgent'] }, { field: 'status', condition: 'is not', values: ['Closed', 'Completed'] }] },
  { name: 'My Hardware Replacements', custom: true, owner: CURRENT_USER, visibility: 'My Self', rules: [{ field: 'subject', condition: 'contains', values: ['laptop', 'charger', 'adapter', 'docking'] }] },
  { name: 'Awaiting Requester 3 Days+', custom: true, owner: CURRENT_USER, visibility: 'My Self', rules: [{ field: 'status', condition: 'is', values: ['Pending'] }] },
  { name: 'Floor 3 Network Escalations', custom: true, owner: CURRENT_USER, visibility: 'Technician In Group', rules: [{ field: 'subject', condition: 'contains', values: ['wifi', 'internet', 'network', 'floor 3'] }, { field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  { name: 'Onboarding Backlog (HR)', custom: true, owner: 'Keetion Dale', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['onboarding'] }] },
  { name: 'VPN & Remote Access', custom: true, owner: 'Shreyak Dalal', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['vpn', 'remote'] }] },
  { name: 'Printer & Peripherals', custom: true, owner: 'Novak Potai', visibility: 'Technician In Group', rules: [{ field: 'subject', condition: 'contains', values: ['printer', 'monitor', 'keyboard', 'mouse'] }] },
  { name: 'Executive Requests', custom: true, owner: 'Rahul Shukla', visibility: 'All Technician', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }, { field: 'approval', condition: 'is', values: ['Pending approval'] }] },
  { name: 'Breached This Week', custom: true, owner: 'Kaison Potai', visibility: 'Technician In Group', rules: [{ field: 'sla', condition: 'is', values: ['Breached'] }] },
  { name: 'Access & Account Requests', custom: true, owner: 'Pratik Patial', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['access', 'password', 'account', 'login'] }] },
];

/* The Change listing's predefined catalog — the same rail, the change queue's own cuts.
   Statuses/priorities are the mapped Ticket values the change grid actually renders. */
export const CHANGE_VIEWS: TicketView[] = [
  { name: 'All Changes', rules: [] },
  { name: 'All Open Changes', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] }] },
  { name: 'All Emergency Changes', rules: [{ field: 'priority', condition: 'is', values: ['Urgent'] }] },
  {
    name: 'My Open Changes',
    rules: [
      { field: 'assignedTo', condition: 'is', values: [CURRENT_USER] },
      { field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] },
    ],
  },
  { name: 'Open Changes in My Group', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress'] }] },
  { name: 'All Archived Changes', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];

/* The Release listing's predefined catalog — same pattern as the change set. */
export const RELEASE_VIEWS: TicketView[] = [
  { name: 'All Releases', rules: [] },
  { name: 'All Open Releases', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] }] },
  { name: 'All Emergency Releases', rules: [{ field: 'priority', condition: 'is', values: ['Urgent'] }] },
  {
    name: 'My Open Releases',
    rules: [
      { field: 'assignedTo', condition: 'is', values: [CURRENT_USER] },
      { field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] },
    ],
  },
  { name: 'Open Releases in My Group', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress'] }] },
  { name: 'All Completed Releases', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];

/* The Problem listing's predefined catalog. */
export const PROBLEM_VIEWS: TicketView[] = [
  { name: 'All Problems', rules: [] },
  { name: 'All Open Problems', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] }] },
  { name: 'All Urgent or High Priority Problems', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  {
    name: 'My Open Problems',
    rules: [
      { field: 'assignedTo', condition: 'is', values: [CURRENT_USER] },
      { field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] },
    ],
  },
  { name: 'Unassigned Problems', rules: [{ field: 'assignedTo', condition: 'empty', values: [] }] },
  { name: 'All Resolved Problems', rules: [{ field: 'status', condition: 'is', values: ['Completed', 'Closed'] }] },
];

/* The Hardware Assets listing's predefined catalog. */
export const HWASSET_VIEWS: TicketView[] = [
  { name: 'All Hardware IT Assets', rules: [] },
  { name: 'In Use Assets', rules: [{ field: 'status', condition: 'is', values: ['In Use'] }] },
  { name: 'In Stock Assets', rules: [{ field: 'status', condition: 'is', values: ['In Stock'] }] },
  { name: 'Assets Needing Attention', rules: [{ field: 'status', condition: 'is', values: ['In Repair', 'Faulty', 'Missing', 'Theft'] }] },
  { name: 'Retired & Disposed Assets', rules: [{ field: 'status', condition: 'is', values: ['Retired', 'Disposed', 'Expired'] }] },
  { name: 'Assets Managed by Me', rules: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }] },
];

/* The other asset/procurement registers' predefined catalogs. Band fields
   (x_compliance / x_expiryBand / x_stockBand / x_dueBand) are pre-computed
   strings on each listing's row adapter, so the rules engine needs nothing new. */
export const SWASSET_VIEWS: TicketView[] = [
  { name: 'All Software IT Assets', rules: [] },
  { name: 'Managed Software', rules: [{ field: 'x_softwareType', condition: 'is', values: ['Managed'] }] },
  { name: 'Discovered Software', rules: [{ field: 'x_softwareType', condition: 'is', values: ['Discovered'] }] },
  { name: 'In Use Software', rules: [{ field: 'status', condition: 'is', values: ['In Use'] }] },
  { name: 'Retired Software', rules: [{ field: 'status', condition: 'is', values: ['Retired'] }] },
];
/* The CMDB's cuts — running state, agent health, and the CIs nobody owns. The CI CLASS
   is the rail's job, so no view repeats it. */
export const CMDB_VIEWS: TicketView[] = [
  { name: 'All CI', rules: [] },
  { name: 'Operational CIs', rules: [{ field: 'status', condition: 'is', values: ['Operational'] }] },
  { name: 'Non-Operational CIs', rules: [{ field: 'status', condition: 'is', values: ['Non-Operational'] }] },
  { name: 'In Maintenance', rules: [{ field: 'status', condition: 'is', values: ['In Maintenance'] }] },
  { name: 'Agent Not Reporting', rules: [{ field: 'x_agentHealth', condition: 'is', values: ['Warning', 'No Agent'] }] },
  { name: 'Unassigned CIs', rules: [{ field: 'assignedTo', condition: 'is', values: ['Unassigned'] }] },
];
/* Knowledge's cuts — what readers can trust, and what is waiting on someone. */
export const KNOWLEDGE_VIEWS: TicketView[] = [
  { name: 'All Folders', rules: [] },
  { name: 'Published Articles', rules: [{ field: 'status', condition: 'is', values: ['Published'] }] },
  { name: 'Drafts & In Review', rules: [{ field: 'status', condition: 'is', values: ['Draft', 'In Review'] }] },
  { name: 'Expired Articles', rules: [{ field: 'status', condition: 'is', values: ['Expired'] }] },
  { name: 'Awaiting Approval', rules: [{ field: 'x_approvalStatus', condition: 'is', values: ['Pending Approval'] }] },
  { name: 'My Articles', rules: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }] },
];
/* The task queue's own cuts: what is live, what is mine, what has slipped, and what is
   waiting on somebody else. The finished states are Closed, Resolved AND Rejected — a
   rejected task is as done as a closed one, and leaving it in "open" would overstate the
   backlog every morning. */
export const TASK_VIEWS: TicketView[] = [
  { name: 'All Tasks', rules: [] },
  { name: 'All Open Tasks', rules: [{ field: 'status', condition: 'is not', values: ['Closed', 'Resolved', 'Rejected'] }] },
  {
    name: 'My Open Tasks',
    rules: [
      { field: 'assignedTo', condition: 'is', values: [CURRENT_USER] },
      { field: 'status', condition: 'is not', values: ['Closed', 'Resolved', 'Rejected'] },
    ],
  },
  { name: 'My Overdue Tasks', rules: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }, { field: 'x_overdue', condition: 'is', values: ['Breached'] }] },
  { name: 'All Overdue Tasks', rules: [{ field: 'x_overdue', condition: 'is', values: ['Breached'] }] },
  { name: 'Urgent or High Priority Tasks', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  { name: 'Tasks Waiting on Someone Else', rules: [{ field: 'status', condition: 'is', values: ['Pending'] }] },
  { name: 'Approval Tasks', rules: [{ field: 'x_taskType', condition: 'is', values: ['Approval'] }] },
  { name: 'Standalone Tasks', rules: [{ field: 'x_reference', condition: 'empty', values: [] }] },
  { name: 'All Closed Tasks', rules: [{ field: 'status', condition: 'is', values: ['Closed', 'Resolved', 'Rejected'] }] },
];
/* My Team's cuts. The "all" view is called My Team because it IS the module — the page
   title reads off the applied view, and "All Team Members" would rename the page. The
   rest are the questions a supervisor opens a roster with: who is in my group, who can
   take work right now, who is drowning, who is sitting idle, and which accounts are no
   longer live. */
export const TEAM_VIEWS: TicketView[] = [
  { name: 'My Team', rules: [] },
  { name: 'My Group', rules: [{ field: 'x_group', condition: 'is', values: [groupOfTechnician(CURRENT_USER)] }] },
  { name: 'Available Now', rules: [{ field: 'x_availability', condition: 'is', values: ['Available'] }] },
  { name: 'On Leave', rules: [{ field: 'x_availability', condition: 'is', values: ['On Leave'] }] },
  { name: 'Overloaded Technicians', rules: [{ field: 'x_workload', condition: 'is', values: ['Overloaded'] }] },
  { name: 'Idle Technicians', rules: [{ field: 'x_workload', condition: 'is', values: ['Idle'] }] },
  { name: 'Supervisors & Administrators', rules: [{ field: 'x_role', condition: 'is', values: ['Supervisor', 'Administrator'] }] },
  { name: 'Technicians Only', rules: [{ field: 'x_role', condition: 'is', values: ['Technician'] }] },
  { name: 'Inactive or Blocked Accounts', rules: [{ field: 'status', condition: 'is', values: ['Inactive', 'Blocked'] }] },
];
/* The project portfolio's cuts: what is live, what is mine, what has slipped its end date,
   what is parked, and what is already delivered. */
export const PROJECT_VIEWS: TicketView[] = [
  { name: 'All Projects', rules: [] },
  { name: 'Active Projects', rules: [{ field: 'status', condition: 'is', values: ['Open', 'Planning', 'Implementation'] }] },
  { name: 'My Projects', rules: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }] },
  { name: 'Overdue Projects', rules: [{ field: 'x_dueBand', condition: 'is', values: ['Overdue'] }] },
  { name: 'Ending in 30 Days', rules: [{ field: 'x_dueBand', condition: 'is', values: ['Due soon'] }] },
  { name: 'Critical Projects', rules: [{ field: 'priority', condition: 'is', values: ['Critical'] }] },
  { name: 'On Hold', rules: [{ field: 'status', condition: 'is', values: ['On Hold'] }] },
  { name: 'Unassigned Projects', rules: [{ field: 'assignedTo', condition: 'is', values: ['Unassigned'] }] },
  { name: 'Completed Projects', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];
/* The three Vulnerability-module catalogues. Each opens on the view its own table
   always showed, then offers the cuts a security analyst actually works by. */
export const VULN_VIEWS: TicketView[] = [
  { name: 'Detected Vulnerability Patches', rules: [] },
  { name: 'Exploited in the Wild', rules: [{ field: 'x_exploited', condition: 'is', values: ['Yes'] }] },
  { name: 'Critical Severity', rules: [{ field: 'x_severity', condition: 'is', values: ['Critical'] }] },
  { name: 'CVSS 9.0 and Above', rules: [{ field: 'x_cvssBand', condition: 'is', values: ['Critical (9.0+)'] }] },
  { name: 'Third Party Updates', rules: [{ field: 'x_category', condition: 'is', values: ['Third Party Updates'] }] },
];
export const CVE_VIEWS: TicketView[] = [
  { name: 'Detected Vulnerabilities', rules: [] },
  { name: 'Exploited CVEs', rules: [{ field: 'x_exploit', condition: 'is', values: ['Yes'] }] },
  { name: 'No Patch Available', rules: [{ field: 'x_patchAvail', condition: 'is', values: ['No'] }] },
  { name: 'High and Critical', rules: [{ field: 'x_severity', condition: 'is', values: ['High', 'Critical'] }] },
  { name: 'Awaiting Analysis', rules: [{ field: 'status', condition: 'is', values: ['Awaiting Analysis'] }] },
];
export const ENDPOINT_VIEWS: TicketView[] = [
  { name: 'All Endpoints', rules: [] },
  { name: 'Agents Offline', rules: [{ field: 'x_agent', condition: 'is', values: ['Offline'] }] },
  { name: 'Unhealthy Endpoints', rules: [{ field: 'x_health', condition: 'is', values: ['Warning', 'Critical'] }] },
  { name: 'Reboot Required', rules: [{ field: 'x_reboot', condition: 'is', values: ['Yes'] }] },
  { name: 'Servers', rules: [{ field: 'x_os', condition: 'contains', values: ['Server'] }] },
];
/* The patch catalogue's cuts — what blocks a rollout, and what a rollout will cost. */
export const PATCH_VIEWS: TicketView[] = [
  { name: 'Missing Patches', rules: [] },
  { name: 'Awaiting Approval', rules: [{ field: 'x_approvalStatus', condition: 'is', values: ['Not Approved'] }] },
  { name: 'Critical Severity', rules: [{ field: 'x_severity', condition: 'is', values: ['Critical'] }] },
  { name: 'Ready to Deploy', rules: [{ field: 'x_deployable', condition: 'is', values: ['Yes'] }] },
  { name: 'Needs a Reboot', rules: [{ field: 'x_needsReboot', condition: 'is', values: ['Yes'] }] },
];
/* A run list reads by what is happening now and what quietly did not. */
export const PATCH_DEPLOY_VIEWS: TicketView[] = [
  { name: 'All Deployments', rules: [] },
  { name: 'In Progress', rules: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
  { name: 'Ready to Deploy', rules: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }] },
  { name: 'Missed Their Window', rules: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
  { name: 'Completed', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];
export const PACKAGE_DEPLOY_VIEWS: TicketView[] = [
  { name: 'All Package Deployments', rules: [] },
  { name: 'In Progress', rules: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
  { name: 'Ready to Deploy', rules: [{ field: 'status', condition: 'is', values: ['Ready to Deploy'] }] },
  { name: 'Missed Their Window', rules: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
  { name: 'Completed', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];
export const REGISTRY_DEPLOY_VIEWS: TicketView[] = [
  { name: 'All Registry Deployments', rules: [] },
  { name: 'In Progress', rules: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
  { name: 'Uninstall Configurations', rules: [{ field: 'x_configType', condition: 'is', values: ['Uninstall'] }] },
  { name: 'Missed Their Window', rules: [{ field: 'x_lapsed', condition: 'is', values: ['Yes'] }] },
  { name: 'Completed', rules: [{ field: 'status', condition: 'is', values: ['Completed'] }] },
];
export const APT_VIEWS: TicketView[] = [
  { name: 'Automatic Patch Tests', rules: [] },
  { name: 'Enabled Schedules', rules: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }] },
  { name: 'Tests Pending', rules: [{ field: 'x_progress', condition: 'is', values: ['Tests pending'] }] },
  { name: 'Never Run', rules: [{ field: 'x_progress', condition: 'is', values: ['Never run'] }] },
  { name: 'Disabled Schedules', rules: [{ field: 'x_enabled', condition: 'is', values: ['Disabled'] }] },
];
/* The rollout schedule's cuts — what is live, what has stalled before shipping anything. */
export const APD_VIEWS: TicketView[] = [
  { name: 'Automatic Patch Deployments', rules: [] },
  { name: 'Enabled Schedules', rules: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }] },
  { name: 'Running', rules: [{ field: 'x_activity', condition: 'is', values: ['Running'] }] },
  { name: 'Never Run', rules: [{ field: 'x_activity', condition: 'is', values: ['Never run', 'Scheduled'] }] },
  { name: 'Stopped', rules: [{ field: 'x_activity', condition: 'is', values: ['Stopped'] }] },
];
/* Metering's cuts — the lifecycle of a metered application, and the ones nobody owns. */
export const METER_VIEWS: TicketView[] = [
  { name: 'All Metered Software', rules: [] },
  { name: 'In Use Applications', rules: [{ field: 'status', condition: 'is', values: ['In Use'] }] },
  { name: 'In Stock Applications', rules: [{ field: 'status', condition: 'is', values: ['In Stock'] }] },
  { name: 'Retired Still Installed', rules: [{ field: 'status', condition: 'is', values: ['Retired'] }] },
  { name: 'Unassigned Applications', rules: [{ field: 'assignedTo', condition: 'is', values: ['Unassigned'] }] },
];
export const NONIT_VIEWS: TicketView[] = [
  { name: 'All Non-IT Assets', rules: [] },
  { name: 'In Use Assets', rules: [{ field: 'status', condition: 'is', values: ['In Use'] }] },
  { name: 'In Stock / In Store', rules: [{ field: 'status', condition: 'is', values: ['In Stock', 'In Store'] }] },
  { name: 'Not Working Assets', rules: [{ field: 'status', condition: 'is', values: ['Not Working'] }] },
  { name: 'Assets Managed by Me', rules: [{ field: 'assignedTo', condition: 'is', values: [CURRENT_USER] }] },
];
export const CONSUMABLE_VIEWS: TicketView[] = [
  { name: 'All Consumable Assets', rules: [] },
  { name: 'Out of Stock', rules: [{ field: 'x_stockBand', condition: 'is', values: ['Out of stock'] }] },
  { name: 'Low Stock', rules: [{ field: 'x_stockBand', condition: 'is', values: ['Low stock'] }] },
  { name: 'Healthy Stock', rules: [{ field: 'x_stockBand', condition: 'is', values: ['Healthy'] }] },
];
export const LICENSE_VIEWS: TicketView[] = [
  { name: 'All Software Licenses', rules: [] },
  { name: 'Over-utilized Licenses', rules: [{ field: 'x_compliance', condition: 'is', values: ['Over-utilized'] }] },
  { name: 'Under-utilized Licenses', rules: [{ field: 'x_compliance', condition: 'is', values: ['Under-utilized'] }] },
  { name: 'Expiring in 30 Days', rules: [{ field: 'x_expiryBand', condition: 'is', values: ['Expiring soon'] }] },
  { name: 'Expired Licenses', rules: [{ field: 'x_expiryBand', condition: 'is', values: ['Expired'] }] },
];
export const CONTRACT_VIEWS: TicketView[] = [
  { name: 'All Contracts', rules: [] },
  { name: 'Active Contracts', rules: [{ field: 'status', condition: 'is', values: ['Active'] }] },
  { name: 'Expiring in 30 Days', rules: [{ field: 'x_expiryBand', condition: 'is', values: ['Expiring soon'] }] },
  { name: 'Expired Contracts', rules: [{ field: 'status', condition: 'is', values: ['Expired'] }] },
  { name: 'Not Started Contracts', rules: [{ field: 'status', condition: 'is', values: ['Not Started'] }] },
];
export const PURCHASE_VIEWS: TicketView[] = [
  { name: 'All Purchase Orders', rules: [] },
  { name: 'Awaiting Approval', rules: [{ field: 'status', condition: 'is', values: ['Sent For Approval'] }] },
  {
    name: 'Open Orders',
    rules: [{ field: 'status', condition: 'is', values: ['Generated', 'Sent For Approval', 'Approved', 'Ordered', 'Partially Received'] }],
  },
  { name: 'Received Orders', rules: [{ field: 'status', condition: 'is', values: ['Received'] }] },
  { name: 'Overdue Deliveries', rules: [{ field: 'x_dueBand', condition: 'is', values: ['Overdue'] }] },
];

/* My Approvals — the product's status tabs (Pending / Approved / Rejected /
   Ignored / Referred Back) as saved views, so they share the listing's own
   machinery instead of a second tab row. */
export const APPROVAL_VIEWS: TicketView[] = [
  { name: 'Pending Approvals', rules: [{ field: 'x_approvalState', condition: 'is', values: ['Pending'] }] },
  { name: 'All Approvals', rules: [] },
  { name: 'Approved', rules: [{ field: 'x_approvalState', condition: 'is', values: ['Approved'] }] },
  { name: 'Rejected', rules: [{ field: 'x_approvalState', condition: 'is', values: ['Rejected'] }] },
  { name: 'Ignored', rules: [{ field: 'x_approvalState', condition: 'is', values: ['Ignored'] }] },
  { name: 'Referred Back', rules: [{ field: 'x_approvalState', condition: 'is', values: ['Referred Back'] }] },
];

/* A colleague's view is only visible to me when they shared it beyond themselves. */
const visibleToMe = (v: TicketView) => v.owner === CURRENT_USER || v.visibility !== 'My Self';
const ownedByMe = (v: TicketView) => !!v.custom && (v.owner ?? CURRENT_USER) === CURRENT_USER;

/* Which module's catalog + storage the rail serves. 'ticket' keeps the legacy keys so
   existing saves survive; other stores namespace their own, so favourites, saved views
   and the default view never leak between the Request and Change listings. */
export type ViewStore =
  | 'ticket' | 'change' | 'release' | 'problem' | 'hwasset'
  | 'swasset' | 'meter' | 'cmdb' | 'knowledge' | 'report' | 'task' | 'team' | 'project' | 'vuln' | 'cve' | 'endpoint' | 'patch' | 'patchdeploy' | 'pkgdeploy' | 'regdeploy' | 'apt' | 'apd' | 'nonit' | 'consumable' | 'license' | 'contract' | 'purchase' | 'approval';
const MODULE_BUILTINS: Partial<Record<ViewStore, TicketView[]>> = {
  swasset: SWASSET_VIEWS,
  meter: METER_VIEWS,
  cmdb: CMDB_VIEWS,
  knowledge: KNOWLEDGE_VIEWS,
  nonit: NONIT_VIEWS,
  consumable: CONSUMABLE_VIEWS,
  license: LICENSE_VIEWS,
  contract: CONTRACT_VIEWS,
  purchase: PURCHASE_VIEWS,
  approval: APPROVAL_VIEWS,
  task: TASK_VIEWS,
  team: TEAM_VIEWS,
  project: PROJECT_VIEWS,
  vuln: VULN_VIEWS,
  cve: CVE_VIEWS,
  endpoint: ENDPOINT_VIEWS,
  patch: PATCH_VIEWS,
  patchdeploy: PATCH_DEPLOY_VIEWS,
  pkgdeploy: PACKAGE_DEPLOY_VIEWS,
  regdeploy: REGISTRY_DEPLOY_VIEWS,
  apt: APT_VIEWS,
  apd: APD_VIEWS,
};
const builtinsFor = (store: ViewStore) =>
  MODULE_BUILTINS[store] ??
  (
  store === 'change'
    ? CHANGE_VIEWS
    : store === 'release'
      ? RELEASE_VIEWS
      : store === 'problem'
        ? PROBLEM_VIEWS
        : store === 'hwasset'
          ? HWASSET_VIEWS
          : TICKET_VIEWS);
/* The seeded shared views are request-flavoured — other modules start with none. */
const seedsFor = (store: ViewStore) => (store === 'ticket' ? CUSTOM_VIEW_SEEDS : []);
const favKey = (store: ViewStore) => (store === 'ticket' ? 'ticketViewFavs' : `${store}ViewFavs`);
const customKey = (store: ViewStore) => (store === 'ticket' ? 'ticketViewCustom' : `${store}ViewCustom`);
const defaultKey = (store: ViewStore) => (store === 'ticket' ? 'ticketViewDefault' : `${store}ViewDefault`);

const load = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const save = (key: string, v: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable — the lists just won't persist */
  }
};

export const VIEWS_CHANGED = 'ticket-views-changed';

/** Saved views this user has stored locally (their own saves and clones). */
export const loadCustomViews = (store: ViewStore = 'ticket'): TicketView[] => {
  try {
    return JSON.parse(localStorage.getItem(customKey(store)) ?? '[]') as TicketView[];
  } catch {
    return [];
  }
};

/** Create or overwrite one of MY saved views, then tell any open rail to refresh. */
export const upsertCustomView = (view: TicketView, store: ViewStore = 'ticket') => {
  const mine = loadCustomViews(store);
  const i = mine.findIndex((v) => v.name === view.name);
  const next = i >= 0 ? mine.map((v, idx) => (idx === i ? view : v)) : [...mine, view];
  try {
    localStorage.setItem(customKey(store), JSON.stringify(next));
  } catch {
    /* storage unavailable — the view lives for this session only */
  }
  window.dispatchEvent(new CustomEvent(VIEWS_CHANGED));
};

/** True when this name belongs to a view the signed-in user may overwrite. */
export const isMyCustomView = (name: string, store: ViewStore = 'ticket') =>
  [...seedsFor(store), ...loadCustomViews(store)].some((v) => v.name === name && (v.owner ?? CURRENT_USER) === CURRENT_USER);

/** The view the listing should open on, or null when the user has not set one. */
export const getDefaultView = (store: ViewStore = 'ticket'): TicketView | null => {
  try {
    const name = localStorage.getItem(defaultKey(store));
    if (!name) return null;
    const custom = JSON.parse(localStorage.getItem(customKey(store)) ?? '[]') as TicketView[];
    return [...builtinsFor(store), ...seedsFor(store), ...custom].find((v) => v.name === name) ?? null;
  } catch {
    return null;
  }
};

/** Per-row overflow menu. Body-portalled so the rail’s scroll box cannot clip it. */
function RowMenu({
  view,
  isDefault,
  isFav,
  onToggleFav,
  onSetDefault,
  onClone,
  onDelete,
}: {
  view: TicketView;
  isDefault: boolean;
  isFav: boolean;
  onToggleFav: () => void;
  onSetDefault: () => void;
  onClone: () => void;
  onDelete: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const items = [
    /* Favouriting moved off the row and into here: the row was carrying three
       trailing glyphs and eating the view's name. A favourite still SHOWS on the
       row — as the amber star in the leading status slot. */
    { key: 'fav', label: isFav ? 'Remove from favourites' : 'Add to favourites', icon: Star, run: onToggleFav },
    { key: 'default', label: isDefault ? 'Remove as default view' : 'Set as default view', icon: Home, run: onSetDefault },
    { key: 'clone', label: 'Clone', icon: CopyPlus, run: onClone },
    // Predefined views ship with the product — only user-made copies can be removed.
    ...(ownedByMe(view) ? [{ key: 'delete', label: 'Delete', icon: Trash2, run: onDelete, danger: true }] : []),
  ];

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          const r = btnRef.current?.getBoundingClientRect();
          /* 232px fits the longest label ("Remove from favourites") on one line —
             keep this in sync with the popup's width class below. */
          if (r) setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left - 182, window.innerWidth - 242)) });
          setOpen((v) => !v);
        }}
        title="More actions"
        className={`flex size-6 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658] ${open ? 'visible bg-[#F1F5F9] text-[#364658]' : 'invisible group-hover:visible'}`}
      >
        <MoreVertical size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{ top: pos.top, left: pos.left }}
            className="app-menu fixed z-[9999] w-[232px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-xl"
          >
            {items.map((it) => (
              <button
                key={it.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  it.run();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#F9FAFB] ${it.danger ? 'text-[#DC2626]' : 'text-[#364658]'}`}
              >
                <it.icon size={14} className={`flex-shrink-0 ${it.danger ? 'text-[#DC2626]' : 'text-[#64748B]'}`} />
                <span className="flex-1 whitespace-nowrap">{it.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/** Collapsible section with a count badge — the Dashboards-rail group recipe. */
function ViewGroup({
  label,
  count,
  icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  count: number;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mx-2 flex w-[calc(100%-1rem)] items-center gap-1.5 rounded px-1.5 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
      >
        {open ? <ChevronDown size={14} className="flex-shrink-0 text-[#94A3B8]" /> : <ChevronRight size={14} className="flex-shrink-0 text-[#94A3B8]" />}
        {icon}
        <span className="flex-1 truncate text-[12px] font-semibold text-[#1E293B]">{label}</span>
        <span className="rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium leading-none tabular-nums text-[#64748B]">{count}</span>
      </button>
      {open && children}
    </div>
  );
}

/** View name that measures itself — the full-name tooltip appears ONLY when truncated. */
function ViewName({ name, active }: { name: string; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setClipped(el.scrollWidth > el.clientWidth + 1);
  }, [name, active]);
  const span = (
    <span ref={ref} className={`flex-1 truncate pl-1.5 pr-2 text-[12px] ${active ? 'font-medium text-[#3D8BD0]' : 'text-[#475569]'}`}>
      {name}
    </span>
  );
  if (!clipped) return span;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent side="right" className="text-wrap max-w-[280px]">{name}</TooltipContent>
    </Tooltip>
  );
}

export function TicketViewsSidebar({
  active,
  onSelect,
  store = 'ticket',
}: {
  active: string;
  onSelect: (view: TicketView) => void;
  /** Which module's catalog + saved-view storage the rail serves. */
  store?: ViewStore;
}) {
  const builtin = builtinsFor(store);
  const seedPool = seedsFor(store);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'all' | 'mine' | 'shared'>('all');
  const [favs, setFavs] = useState<string[]>(() => load(favKey(store)));
  const [customs, setCustoms] = useState<TicketView[]>(() => loadCustomViews(store));
  // A view saved from the toolbar must appear here immediately.
  useEffect(() => {
    const onChanged = () => setCustoms(loadCustomViews(store));
    window.addEventListener(VIEWS_CHANGED, onChanged);
    return () => window.removeEventListener(VIEWS_CHANGED, onChanged);
  }, [store]);
  const [defaultView, setDefaultView] = useState<string>(() => localStorage.getItem(defaultKey(store)) ?? '');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabFadeL, setTabFadeL] = useState(false);
  const [tabFadeR, setTabFadeR] = useState(false);
  const updateTabFades = () => {
    const el = tabsRef.current;
    if (!el) return;
    setTabFadeL(el.scrollLeft > 2);
    setTabFadeR(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };
  useEffect(() => {
    updateTabFades();
    const el = tabsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateTabFades);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCustoms = (next: TicketView[]) => {
    setCustoms(next);
    try {
      localStorage.setItem(customKey(store), JSON.stringify(next));
    } catch {
      /* storage unavailable — clones just will not persist */
    }
  };

  const setAsDefault = (name: string) => {
    const next = defaultView === name ? '' : name;
    setDefaultView(next);
    try {
      if (next) localStorage.setItem(defaultKey(store), next);
      else localStorage.removeItem(defaultKey(store));
    } catch {
      /* ignore */
    }
    toast.success(next ? `“${name}” is now your default view` : 'Default view cleared');
  };

  const cloneView = (v: TicketView) => {
    // "Copy of X", then "Copy of X (2)"… so repeated clones never collide.
    let name = `Copy of ${v.name}`;
    const taken = (n: string) => [...builtin, ...seedPool, ...customs].some((x) => x.name === n);
    for (let i = 2; taken(name); i += 1) name = `Copy of ${v.name} (${i})`;
    saveCustoms([...customs, { name, rules: v.rules, custom: true, owner: CURRENT_USER, visibility: 'My Self' }]);
    toast.success(`“${name}” created`);
  };

  const deleteView = (v: TicketView) => {
    saveCustoms(customs.filter((c) => c.name !== v.name));
    setFavs((prev) => {
      const next = prev.filter((fv) => fv !== v.name);
      save(favKey(store), next);
      return next;
    });
    if (defaultView === v.name) setAsDefault(v.name);
    toast.success(`“${v.name}” deleted`);
  };

  const toggleFav = (name: string) =>
    setFavs((prev) => {
      const next = prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name];
      save(favKey(store), next);
      return next;
    });


  const ql = q.trim().toLowerCase();
  const match = (v: TicketView) => !ql || v.name.toLowerCase().includes(ql);
  const saved = [...seedPool, ...customs];
  const pool =
    tab === 'mine'
      ? saved.filter(ownedByMe)
      : tab === 'shared'
        ? saved.filter((v) => !ownedByMe(v) && visibleToMe(v))
        : [...builtin, ...saved.filter(visibleToMe)];
  const catalog = pool.filter(match);
  const favViews = catalog.filter((v) => favs.includes(v.name));
  const otherViews = catalog.filter((v) => !favs.includes(v.name));
  /* Each view now lives in exactly one section, so the selected row is unique. */
  const activeSection = favViews.some((v) => v.name === active) ? 'fav' : 'all';

  const row = (v: TicketView, section: 'fav' | 'all' = 'all') => {
    const isActive = active === v.name && section === activeSection;
    const fav = favs.includes(v.name);
    return (
      <div
        key={v.name}
        onClick={() => onSelect(v)}
        className={`group mx-2 flex cursor-pointer items-center gap-0 rounded py-1.5 pl-1.5 pr-1.5 transition-colors ${isActive ? 'bg-[#EBF5FF]' : 'hover:bg-[#F9FAFB]'}`}
      >
        {/* Leading status slot — what this view IS: Home for the one the listing opens
            on, else an amber star for a favourite. Default wins the slot when a view is
            both; the My Favourite group above still collects it. Inside that group the
            star would repeat the heading, so it is skipped there. */}
        <span className="flex w-4 flex-shrink-0 items-center justify-center">
          {defaultView === v.name ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Home size={12} className="text-[#3D8BD0]" />
              </TooltipTrigger>
              <TooltipContent side="right">Default view</TooltipContent>
            </Tooltip>
          ) : fav && section !== 'fav' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
              </TooltipTrigger>
              <TooltipContent side="right">Favourite</TooltipContent>
            </Tooltip>
          ) : null}
        </span>
        <ViewName name={v.name} active={isActive} />
        {/* Predefined views ship with the product — a quiet lock says "yours to use,
            not to change", which is why they need no tab of their own. */}
        {!v.custom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="mr-0.5 flex size-5 flex-shrink-0 items-center justify-center text-[#B6C2D1]">
                <Lock size={11} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-wrap max-w-[240px]">
              Predefined view — use it or make a copy, but it can’t be edited or deleted
            </TooltipContent>
          </Tooltip>
        )}
        <RowMenu
          view={v}
          isDefault={defaultView === v.name}
          isFav={fav}
          onToggleFav={() => toggleFav(v.name)}
          onSetDefault={() => setAsDefault(v.name)}
          onClone={() => cloneView(v)}
          onDelete={() => deleteView(v)}
        />
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      <div className="flex-shrink-0 px-4 pb-1 pt-3.5">
        <h2 className="text-[16px] font-semibold text-[#1E293B]">Views</h2>
      </div>

      <div className="flex-shrink-0 px-3 pt-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            placeholder="Search views..."
            className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white"
          />
        </div>
      </div>

      {/* Tabs — All / My Views / Shared with me; scrolls when they overflow. Predefined
          views are NOT a tab of their own: they already sit in All, marked with a lock. */}
      <div className="relative flex-shrink-0 border-b border-[#E5E7EB]">
        <div
          ref={tabsRef}
          onScroll={updateTabFades}
          className="no-scrollbar-ever flex items-center gap-2.5 overflow-x-auto px-2.5 pt-1.5"
        >
        {(
          [
            ['all', 'All'],
            ['mine', 'My Views'],
            ['shared', 'Shared with me'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-2 py-2 text-[12.5px] font-medium whitespace-nowrap transition-colors ${tab === key ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
          >
            {label}
          </button>
        ))}
        </div>
        {/* Fades sit ABOVE the row, each shown only while that side can still scroll. */}
        {tabFadeL && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        )}
        {tabFadeR && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {tab === 'mine' && catalog.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[#64748B]">You haven’t saved any views yet.</p>
            <p className="mt-1 text-[12px] text-[#9CA3AF]">Filter the list, then use “Save view” in the toolbar.</p>
          </div>
        ) : tab === 'shared' && catalog.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[#64748B]">No one has shared a view with you yet.</p>
          </div>
        ) : (
          <>
            {favViews.length > 0 && (
              <ViewGroup label="My Favourite" count={favViews.length} icon={<Star size={13} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />}>
                {favViews.map((v) => row(v, 'fav'))}
              </ViewGroup>
            )}
            {otherViews.length > 0 && (
              <ViewGroup
                label={favViews.length > 0 ? 'Other Views' : 'All Views'}
                count={otherViews.length}
                icon={<LayoutList size={13} className="flex-shrink-0 text-[#64748B]" />}
              >
                {otherViews.map((v) => row(v, 'all'))}
              </ViewGroup>
            )}
            {catalog.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">No views match “{q.trim()}”</div>
            )}
          </>
        )}
      </div>

    </aside>
  );
}
