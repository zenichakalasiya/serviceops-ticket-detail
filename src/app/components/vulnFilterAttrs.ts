/* Filter catalogues for the three Vulnerability-module listings — Vulnerabilities,
   Detected CVEs and Endpoints. One file because they share a vocabulary (severity, CVSS,
   exploit status) and a reader moves between them constantly; splitting it would mean
   three copies of the same severity palette drifting apart.

   Each feeds its listing's filter builder, Manage-columns list, the grid's own dropdowns
   and the quick filters, so every surface reads ONE list. */
import {
  AlertTriangle, AlignLeft, Boxes, Bug, CalendarDays, CircleDot, Cpu, Gauge, Hash,
  HardDrive, Link2, MapPin, Monitor, Network, RefreshCw, ShieldAlert, ShieldCheck, Tag,
} from 'lucide-react';
import { IconStatusCheck } from './SidebarIcons';
import type { Attr, QuickFilterDef } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* ── Shared vocabulary ─────────────────────────────────────────────────────── */

/** The patch-severity ladder Microsoft and the module's own table use. */
export const VULN_SEVERITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' },
  { label: 'Important', color: '#F97316' },
  { label: 'Moderate', color: '#F59E0B' },
  { label: 'Low', color: '#22C55E' },
  { label: 'Unspecified', color: '#94A3B8' },
];

/** The CVSS severity ladder — a CVE is rated on this, not on the patch ladder above. */
export const CVE_SEVERITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' },
  { label: 'High', color: '#EF4444' },
  { label: 'Medium', color: '#F59E0B' },
  { label: 'Low', color: '#22C55E' },
];

/** Where a CVE sits in NVD's own workflow. */
export const CVE_STATUS_OPTIONS = [
  { label: 'Analyzed', color: '#22C55E' },
  { label: 'Modified', color: '#3D8BD0' },
  { label: 'Awaiting Analysis', color: '#F59E0B' },
];

/* CVSS banded rather than offered as 0.0-10.0: "which of these are critical-scored" is a
   cut somebody makes, "which scored exactly 7.8" is not. */
export const CVSS_BAND_OPTIONS = [
  { label: 'Critical (9.0+)', color: '#DC2626' },
  { label: 'High (7.0–8.9)', color: '#EF4444' },
  { label: 'Medium (4.0–6.9)', color: '#F59E0B' },
  { label: 'Low (0.1–3.9)', color: '#22C55E' },
  { label: 'Not scored', color: '#94A3B8' },
];
export const cvssBand = (n: number) =>
  n >= 9 ? 'Critical (9.0+)' : n >= 7 ? 'High (7.0–8.9)' : n >= 4 ? 'Medium (4.0–6.9)' : n > 0 ? 'Low (0.1–3.9)' : 'Not scored';

const YES_NO = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'No', color: '#94A3B8' },
];

/* ── Vulnerabilities ───────────────────────────────────────────────────────── */

export const VULN_CATEGORY_OPTIONS = o(['Security Updates', 'Third Party Updates', 'Updates', 'Critical Updates', 'Feature Packs']);

/* Both ladders are the PATCH module's own enums (`ApprovalStatus`, `RebootRequired` in
   PatchesListPage) — a detected vulnerability IS a patch here, so its filter must offer the
   same values the catalogue stores, "May be" included. */
export const VULN_APPROVAL_OPTIONS = [
  { label: 'Approved', color: '#22C55E' },
  { label: 'Not Approved', color: '#F59E0B' },
];
export const VULN_REBOOT_OPTIONS = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'May be', color: '#F59E0B' },
  { label: 'No', color: '#94A3B8' },
];

/* The product's own thirteen, in its own order — the filter picker and Manage columns both
   read this list, and the grid's headings use the same names (see MODULE_COL_DEFS.vuln), so
   "Patch Category" means one thing on every surface. */
export const VULN_FILTER_ATTRS: Attr[] = [
  { key: 'x_impacted', label: 'Impacted Endpoints', icon: Monitor, type: 'text' },
  { key: 'x_kb', label: 'KB Number', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Title', icon: AlignLeft, type: 'text' },
  { key: 'x_severity', label: 'Severity', icon: ShieldAlert, type: 'select', options: VULN_SEVERITY_OPTIONS },
  { key: 'x_category', label: 'Patch Category', icon: Boxes, type: 'select', options: VULN_CATEGORY_OPTIONS },
  { key: 'x_supportUri', label: 'Support URI', icon: Link2, type: 'text' },
  { key: 'x_published', label: 'Release Date', icon: CalendarDays, type: 'date' },
  { key: 'x_reboot', label: 'Reboot Required', icon: RefreshCw, type: 'select', options: VULN_REBOOT_OPTIONS },
  { key: 'x_approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: VULN_APPROVAL_OPTIONS },
  { key: 'x_exploitedCves', label: 'Exploited CVEs', icon: Bug, type: 'text' },
  { key: 'x_otherCves', label: 'Non Exploited CVEs', icon: Bug, type: 'text' },
  { key: 'x_cvssBand', label: 'CVSS 3.1 Score', icon: Gauge, type: 'select', options: CVSS_BAND_OPTIONS },
  { key: 'x_cvssVector', label: 'CVSS 3.1 Vector', icon: Gauge, type: 'text' },

  /* Not a product attribute — a band this module derives so the KPI card, the quick filter
     and the "Exploited in the Wild" saved view all test ONE field. `hidden` keeps it out
     of both the filter picker and Manage columns. */
  { key: 'x_exploited', label: 'Exploited in the Wild', icon: Bug, type: 'select', hidden: true, options: YES_NO },
  /* The KPI strip's "CVSS 8.0+" cut. The score column bands at 7.0 and 9.0, so an 8.0
     threshold needs its own pre-computed field — the filter bar has no numeric compare. */
  { key: 'x_cvss8', label: 'CVSS 8.0+', icon: Gauge, type: 'select', hidden: true, options: YES_NO },
  { key: 'id', label: 'ID', icon: Hash, type: 'text', hidden: true },
];

/* Severity only. The exploit-status quick filter was dropped by request — `x_exploited` is
   still derived on every row, so the KPI card and the saved view that read it are unaffected. */
export const VULN_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 190, row: 'dot', options: VULN_SEVERITY_OPTIONS },
];

/* ── Detected CVEs ─────────────────────────────────────────────────────────── */

export const CVE_VULN_TYPE_OPTIONS = o(['OS', 'Application']);

/* The product's own twenty, in its own order. All four CVSS generations are offered because
   the record carries all four — v2.0 is empty for this catalogue (NVD retired it for anything
   published after 2015) and v4.0 only on the records that have been rescored, which is the
   honest state of the data rather than a gap to paper over.
   ⚠️ Only 3.1 is a BANDED select: it is the authoritative score and has its own graded
   column, so "which of these are critical-scored" is a cut worth offering. The other three
   are reference values a reader looks up rather than groups by, so they filter as text. */
export const CVE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'x_severity', label: 'Severity', icon: ShieldAlert, type: 'select', options: CVE_SEVERITY_OPTIONS },
  { key: 'x_title', label: 'Title', icon: AlignLeft, type: 'text' },
  { key: 'subject', label: 'Description', icon: AlignLeft, type: 'text' },
  { key: 'x_vulnType', label: 'Vulnerability Type', icon: Boxes, type: 'select', options: CVE_VULN_TYPE_OPTIONS },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: CVE_STATUS_OPTIONS },
  { key: 'x_impacted', label: 'Impacted Endpoints', icon: Monitor, type: 'text' },
  { key: 'x_cvss20', label: 'CVSS 2.0 Score', icon: Gauge, type: 'text' },
  { key: 'x_cvss20Vector', label: 'CVSS 2.0 Vector', icon: Gauge, type: 'text' },
  { key: 'x_cvss30', label: 'CVSS 3.0 Score', icon: Gauge, type: 'text' },
  { key: 'x_cvss30Vector', label: 'CVSS 3.0 Vector', icon: Gauge, type: 'text' },
  { key: 'x_cvssBand', label: 'CVSS 3.1 Score', icon: Gauge, type: 'select', options: CVSS_BAND_OPTIONS },
  { key: 'x_cvss31Vector', label: 'CVSS 3.1 Vector', icon: Gauge, type: 'text' },
  { key: 'x_cvss40', label: 'CVSS 4.0 Score', icon: Gauge, type: 'text' },
  { key: 'x_cvss40Vector', label: 'CVSS 4.0 Vector', icon: Gauge, type: 'text' },
  { key: 'x_patchAvail', label: 'Patch Availability', icon: ShieldCheck, type: 'select', options: [
    { label: 'Yes', color: '#22C55E' },
    { label: 'No', color: '#DC2626' },
  ] },
  { key: 'x_exploit', label: 'Exploit Status', icon: Bug, type: 'select', options: YES_NO },
  { key: 'x_published', label: 'Published Date', icon: CalendarDays, type: 'date' },
  { key: 'x_lastUpdated', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: VULN_APPROVAL_OPTIONS },

  /* Not a product attribute. CWE is a SHOWN column here, so `hidden` keeps it out of the
     picker without taking the column away. */
  { key: 'x_cwe', label: 'CWE ID', icon: Bug, type: 'text', hidden: true },
  /* Every card on the CVE strip is gated on "Impacted Endpoints > 0" — a CVE touching no
     machine is a catalogue entry, not a finding. Banded so the cards can filter on it. */
  { key: 'x_active', label: 'Impacting Endpoints', icon: Monitor, type: 'select', hidden: true, options: YES_NO },
];

/* Severity and NVD status. The exploit-status quick filter was dropped by request — the
   same as on the Vulnerabilities page; `x_exploit` remains a column, a filter attribute and
   the field behind the "Exploited" KPI card, so nothing else loses its cut. */
export const CVE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 180, row: 'dot', options: CVE_SEVERITY_OPTIONS },
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by NVD status', title: 'Status is', width: 210, row: 'dot', options: CVE_STATUS_OPTIONS },
];

/* ── Endpoints ─────────────────────────────────────────────────────────────── */

export const ENDPOINT_HEALTH_OPTIONS = [
  { label: 'Healthy', color: '#22C55E' },
  { label: 'Warning', color: '#F59E0B' },
  { label: 'Critical', color: '#DC2626' },
  { label: 'Not reported', color: '#94A3B8' },
];
export const ENDPOINT_AGENT_OPTIONS = [
  { label: 'Online', color: '#22C55E' },
  { label: 'Offline', color: '#94A3B8' },
];
export const ENDPOINT_OFFICE_OPTIONS = o([
  'Ahmedabad HQ', 'Mumbai Office', 'Bengaluru Campus', 'Pune Development Center',
  'Delhi NCR Office', 'Hyderabad Office', 'Chennai Office',
]);
export const ENDPOINT_OS_OPTIONS = o([
  'Microsoft Windows 11 Pro', 'Microsoft Windows 10 Pro', 'Microsoft Windows 10 Enterprise',
  'Microsoft Windows Server 2022 Standard', 'Microsoft Windows Server 2019 Standard',
  'Ubuntu Linux 22.04 LTS', 'Red Hat Enterprise Linux 9', 'macOS 14 Sonoma', 'macOS 15 Sequoia',
]);

export const ENDPOINT_DOMAIN_OPTIONS = o(['motadata.local', 'WORKGROUP']);

/* Bands behind the Endpoint KPI strip. Each is a threshold the filter bar cannot state as a
   rule — it has no numeric compare and no "older than N days" — so the row carries the
   answer and the card, its chip and the filtered list all read one field. */
export const ENDPOINT_VULN_BAND_OPTIONS = [
  { label: 'Found', color: '#DC2626' },
  { label: 'None found', color: '#22C55E' },
  { label: 'Not scanned', color: '#94A3B8' },
];
export const ENDPOINT_SCAN_AGE_OPTIONS = [
  { label: 'Within 7 days', color: '#22C55E' },
  { label: 'Over 7 days ago', color: '#F59E0B' },
  { label: 'Never', color: '#94A3B8' },
];

/* The product's own fourteen, in its own order. The grid's headings use the same names (see
   MODULE_COL_DEFS.endpoint — "Agent ID" became ID and "Version" became OS Version) so no
   fact carries two names between the table and Manage columns. */
export const ENDPOINT_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Host Name', icon: HardDrive, type: 'text' },
  { key: 'x_domain', label: 'Domain Name', icon: Network, type: 'select', options: ENDPOINT_DOMAIN_OPTIONS },
  { key: 'x_ip', label: 'IP Address', icon: Network, type: 'text' },
  { key: 'x_ipRange', label: 'IP Range', icon: Network, type: 'text' },
  { key: 'x_os', label: 'OS Name', icon: Monitor, type: 'select', options: ENDPOINT_OS_OPTIONS },
  { key: 'x_version', label: 'OS Version', icon: Cpu, type: 'text' },
  { key: 'x_arch', label: 'Architecture', icon: Cpu, type: 'select', options: o(['64 BIT', '32 BIT']) },
  { key: 'x_health', label: 'System Health', icon: AlertTriangle, type: 'select', options: ENDPOINT_HEALTH_OPTIONS },
  { key: 'x_reboot', label: 'Reboot Required', icon: RefreshCw, type: 'select', options: YES_NO },
  { key: 'x_scanDate', label: 'Vulnerability Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'x_osVulns', label: 'OS Vulnerabilities', icon: ShieldAlert, type: 'text' },
  { key: 'x_softwareVulns', label: 'Software Vulnerabilities', icon: Boxes, type: 'text' },
  { key: 'x_vulnCount', label: 'Vulnerability Count', icon: Bug, type: 'text' },

  /* Not on the product's list, but each is either a SHOWN column or the field behind a quick
     filter / KPI card — `hidden` keeps them out of the picker without taking any of that away. */
  { key: 'x_office', label: 'Remote Office', icon: MapPin, type: 'select', hidden: true, options: ENDPOINT_OFFICE_OPTIONS },
  { key: 'x_agent', label: 'Agent Status', icon: IconStatusCheck, type: 'select', hidden: true, options: ENDPOINT_AGENT_OPTIONS },
  { key: 'x_tags', label: 'Tags', icon: Tag, type: 'text', hidden: true },
  { key: 'x_servicePack', label: 'Service Pack', icon: Cpu, type: 'text', hidden: true },
  /* The KPI strip's bands — see ENDPOINT_VULN_BAND_OPTIONS. */
  { key: 'x_hasMissing', label: 'Missing Patches', icon: ShieldAlert, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_vulnBand', label: 'Vulnerabilities', icon: Bug, type: 'select', hidden: true, options: ENDPOINT_VULN_BAND_OPTIONS },
  { key: 'x_scanAge', label: 'Last Scanned', icon: CalendarDays, type: 'select', hidden: true, options: ENDPOINT_SCAN_AGE_OPTIONS },
];

export const ENDPOINT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_health', icon: AlertTriangle, tip: 'Filter by system health', title: 'System health is', width: 200, row: 'dot', options: ENDPOINT_HEALTH_OPTIONS },
  { field: 'x_agent', icon: IconStatusCheck, tip: 'Filter by agent status', title: 'Agent is', width: 180, row: 'dot', options: ENDPOINT_AGENT_OPTIONS },
  { field: 'x_office', icon: MapPin, tip: 'Filter by remote office', title: 'Remote office is', width: 240, row: 'plain', options: ENDPOINT_OFFICE_OPTIONS },
];
