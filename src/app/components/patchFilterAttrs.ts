/* Filter catalogues for the two Patch-management listings — Patches and Patch Deployments.
   One file because a deployment IS a bundle of patches: the two screens share a vocabulary
   (severity, approval, the patch catalogue itself) and a reader moves between them
   constantly, so two copies would drift.

   Each feeds its listing's filter builder, Manage-columns list, the grid's own dropdowns and
   the quick filters, so every surface reads ONE list.

   ⚠️ There is no product screenshot for these two, unlike the Vulnerability trio. The
   attribute sets are drawn from what the DETAIL pages actually show — `PATCH_FIELDS` and
   `PATCH_DEPLOYMENT_FIELDS` in AssetFields — so a column you can filter on is a field the
   record genuinely has. Replace with the product's own list when one turns up. */
import {
  AlignLeft, Boxes, CalendarDays, CircleDot, Cpu, Download, FileText, Hash, Layers,
  Monitor, RefreshCw, ShieldAlert, ShieldCheck, Tag, Timer, User,
} from 'lucide-react';
import { IconStatusCheck } from './SidebarIcons';
import type { Attr, QuickFilterDef } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* ── Shared patch vocabulary ───────────────────────────────────────────────── */

/** The severity ladder the patch catalogue stores (`Severity` in PatchesListPage). */
export const PATCH_SEVERITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' },
  { label: 'Important', color: '#F97316' },
  { label: 'Moderate', color: '#F59E0B' },
  { label: 'Low', color: '#22C55E' },
  { label: 'Unspecified', color: '#94A3B8' },
];

/** `ApprovalStatus` — two values, not three. Deploying is gated on this. */
export const PATCH_APPROVAL_OPTIONS = [
  { label: 'Approved', color: '#22C55E' },
  { label: 'Not Approved', color: '#F59E0B' },
];

/** `RebootRequired` — "May be" is a real third answer, not a missing one. */
export const PATCH_REBOOT_OPTIONS = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'May be', color: '#F59E0B' },
  { label: 'No', color: '#94A3B8' },
];

export const PATCH_CATEGORY_OPTIONS = o([
  'Updates', 'Security Updates', 'Critical Updates', 'Update Rollups', 'Definition Updates',
  'Feature Packs', 'Service Packs', 'Tools',
]);

export const PATCH_TYPE_OPTIONS = o(['Microsoft Patch', 'Third Party Patch']);
export const PATCH_ARCH_OPTIONS = o(['64 BIT', '32 BIT']);
export const PATCH_DOWNLOAD_OPTIONS = [
  { label: 'Success', color: '#22C55E' },
  { label: 'Pending', color: '#F59E0B' },
  { label: 'Failed', color: '#DC2626' },
];
const YES_NO = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'No', color: '#94A3B8' },
];

/* ── Patches ───────────────────────────────────────────────────────────────── */

export const PATCH_PLATFORM_OPTIONS = o(['Windows', 'Linux', 'Mac']);
export const PATCH_TEST_STATUS_OPTIONS = [
  { label: 'Tested', color: '#22C55E' },
  { label: 'Not Tested', color: '#94A3B8' },
  { label: 'Failed', color: '#DC2626' },
];
export const PATCH_SOURCE_OPTIONS = o(['Patch Scanning', 'Vendor Sync', 'Manual Upload']);
export const PATCH_STATUS_OPTIONS = [
  { label: 'Published', color: '#22C55E' },
  { label: 'Draft', color: '#94A3B8' },
  { label: 'Archived', color: '#64748B' },
];
export const PATCH_UPLOAD_OPTIONS = [
  { label: 'Uploaded', color: '#22C55E' },
  { label: 'In Progress', color: '#F59E0B' },
  { label: 'Not Uploaded', color: '#DC2626' },
];

/* The product's own twenty-two, in its own order. The grid's heading uses the same name
   ("Patch ID", not "ID") so no fact carries two names between the table and Manage columns. */
export const PATCH_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'Patch ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_uuid', label: 'UUID', icon: Hash, type: 'text' },
  { key: 'x_patchType', label: 'Patch Type', icon: Layers, type: 'select', options: PATCH_TYPE_OPTIONS },
  { key: 'x_platform', label: 'Platform', icon: Monitor, type: 'select', options: PATCH_PLATFORM_OPTIONS },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_updatedBy', label: 'Last Updated By', icon: User, type: 'text' },
  { key: 'x_category', label: 'Patch Category', icon: Boxes, type: 'select', options: PATCH_CATEGORY_OPTIONS },
  { key: 'x_severity', label: 'Severity', icon: ShieldAlert, type: 'select', options: PATCH_SEVERITY_OPTIONS },
  { key: 'x_approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: PATCH_APPROVAL_OPTIONS },
  { key: 'x_testStatus', label: 'Test Status', icon: IconStatusCheck, type: 'select', options: PATCH_TEST_STATUS_OPTIONS },
  { key: 'x_released', label: 'Release Date', icon: CalendarDays, type: 'date' },
  { key: 'x_kb', label: 'KB Number', icon: Hash, type: 'text' },
  { key: 'x_superseded', label: 'Superseded Status', icon: FileText, type: 'select', options: YES_NO },
  { key: 'x_downloadStatus', label: 'Download Status', icon: Download, type: 'select', options: PATCH_DOWNLOAD_OPTIONS },
  { key: 'x_source', label: 'Patch Source', icon: Layers, type: 'select', options: PATCH_SOURCE_OPTIONS },
  { key: 'x_patchStatus', label: 'Patch Status', icon: CircleDot, type: 'select', options: PATCH_STATUS_OPTIONS },
  { key: 'x_uploadStatus', label: 'Patch Upload Status', icon: Download, type: 'select', options: PATCH_UPLOAD_OPTIONS },
  { key: 'x_resolvedCves', label: 'Resolved CVEs', icon: ShieldAlert, type: 'text' },
  { key: 'x_tags', label: 'Tags', icon: Tag, type: 'text' },
  { key: 'x_lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_reboot', label: 'Reboot Required', icon: RefreshCw, type: 'select', options: PATCH_REBOOT_OPTIONS },

  /* Not on the product's list. Missing/Installed System are SHOWN columns; Architecture is a
     detail-page field; the last two are bands this module derives so the KPI card, the saved
     view and the dashboard segment all test ONE field. `hidden` keeps every one of them out
     of the picker without taking the column or the cut away. */
  { key: 'x_missing', label: 'Missing System', icon: Monitor, type: 'text', hidden: true },
  { key: 'x_installed', label: 'Installed System', icon: Monitor, type: 'text', hidden: true },
  { key: 'x_arch', label: 'Architecture', icon: Cpu, type: 'select', hidden: true, options: PATCH_ARCH_OPTIONS },
  { key: 'x_deployable', label: 'Ready to deploy', icon: ShieldCheck, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_needsReboot', label: 'Needs a reboot', icon: RefreshCw, type: 'select', hidden: true, options: YES_NO },
  /* "Missing Endpoints > 0" — the gate on the strip's Critical & Important and Pending
     Approval cards. A patch no machine is missing is catalogue, not work. */
  { key: 'x_hasMissing', label: 'Missing on Endpoints', icon: Monitor, type: 'select', hidden: true, options: YES_NO },
];

export const PATCH_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 190, row: 'dot', options: PATCH_SEVERITY_OPTIONS },
  { field: 'x_approvalStatus', icon: ShieldCheck, tip: 'Filter by approval status', title: 'Approval status is', width: 210, row: 'dot', options: PATCH_APPROVAL_OPTIONS },
];

/* ── Patch Deployments ─────────────────────────────────────────────────────── */

/** `DeploymentStatus` — the run's own lifecycle. */
export const DEPLOY_STATUS_OPTIONS = [
  { label: 'Draft', color: '#94A3B8' },
  { label: 'Ready to Deploy', color: '#3D8BD0' },
  { label: 'In Progress', color: '#F59E0B' },
  { label: 'Completed', color: '#22C55E' },
  { label: 'Cancelled', color: '#64748B' },
  { label: 'Expired', color: '#DC2626' },
];

export const DEPLOY_TASK_TYPE_OPTIONS = o(['Install', 'Uninstall']);

/* The window a run is in, worked out from installAfter/expiryDate against today. It is the
   cut an operator actually makes — "what is live right now", "what lapsed without
   deploying" — and neither is answerable from `status` alone. */
export const DEPLOY_WINDOW_OPTIONS = [
  { label: 'Live now', color: '#F59E0B' },
  { label: 'Scheduled', color: '#3D8BD0' },
  { label: 'Window closed', color: '#DC2626' },
  { label: 'No window', color: '#94A3B8' },
];

/* The strip's "Expiring in 48h": a run still Ready to Deploy or In Progress whose window
   closes inside the next two days. Two conditions in one field, for the same reason as
   `x_lapsed` — the card's number and the list its click produces must agree. Shared with the
   Package and Registry run lists, which run the same lifecycle. */
export const DEPLOY_EXPIRING_OPTIONS = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'No', color: '#94A3B8' },
];

/* Where a run came from — a technician pushing it by hand, or an Automatic Patch Deployment
   schedule creating it on its cadence. The strip's "Manual Remote Deploy" card reads it. */
export const DEPLOY_ORIGIN_OPTIONS = [
  { label: 'Manual Remote Deploy', color: '#3D8BD0' },
  { label: 'Automatic Patch Deployment', color: '#8B5CF6' },
];

/* The product's own eleven, in its own order. */
export const PATCH_DEPLOY_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_updatedBy', label: 'Last Updated By', icon: User, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: DEPLOY_STATUS_OPTIONS },
  { key: 'x_policy', label: 'Deployment Policy', icon: FileText, type: 'text' },
  { key: 'x_taskType', label: 'Task Type', icon: Layers, type: 'select', options: DEPLOY_TASK_TYPE_OPTIONS },
  { key: 'x_createdDate', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'x_lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_installAfter', label: 'Install After', icon: CalendarDays, type: 'date' },
  { key: 'x_expiry', label: 'Expiry Date', icon: Timer, type: 'date' },

  /* Not on the product's list. The two counts feed the "Endpoints targeted" / "Patches
     deployed" KPI cards and the Widest-rollouts chart; `hidden` keeps them out of the picker
     without taking any of that away. */
  { key: 'x_patchCount', label: 'Patch Count', icon: Layers, type: 'text', hidden: true },
  { key: 'x_endpointCount', label: 'Endpoint Count', icon: Monitor, type: 'text', hidden: true },

  /* Derived — see DEPLOY_WINDOW_OPTIONS. Backs the quick filter and the dashboard. */
  { key: 'x_window', label: 'Deployment Window', icon: Timer, type: 'select', hidden: true, options: DEPLOY_WINDOW_OPTIONS },
  /* "Expired without completing" is TWO conditions — the window has closed AND the run never
     finished. Pre-computed into one field so the KPI card's NUMBER and the list its click
     produces can never disagree; a two-rule filter on the card drifted from its own count. */
  { key: 'x_lapsed', label: 'Missed its window', icon: Timer, type: 'select', hidden: true, options: [
    { label: 'Yes', color: '#DC2626' },
    { label: 'No', color: '#94A3B8' },
  ] },
  { key: 'x_expiring', label: 'Expiring in 48h', icon: Timer, type: 'select', hidden: true, options: DEPLOY_EXPIRING_OPTIONS },
  { key: 'x_origin', label: 'Origin', icon: Layers, type: 'select', hidden: true, options: DEPLOY_ORIGIN_OPTIONS },
];

/* Status only. The deployment-window quick filter was dropped by request — `x_window` is
   still derived on every row, so the dashboard's "By deployment window" chart and the
   `x_lapsed` band that powers the "Missed their window" KPI are unaffected. */
export const PATCH_DEPLOY_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 210, row: 'dot', options: DEPLOY_STATUS_OPTIONS },
];
