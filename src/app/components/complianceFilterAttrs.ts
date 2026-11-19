/* Compliance Policy listing — the filter catalogue, quick filters, saved views and status
   palette. Its own small file with no heavy imports, because TicketTable and TicketViewsPanel
   read it and both sit underneath half the app. */
import { AlignLeft, CalendarDays, CircleDot, Gauge, Hash, Layers, Power, ShieldCheck, Tag, User } from 'lucide-react';
import type { Attr, FilterRule, QuickFilterDef } from './TicketFilterBar';
import type { TicketView } from './TicketViewsPanel';
import { BENCHMARKS_SEED, platformOf, RULES } from './complianceData';

/* Dashboard → list hand-off. A click on the Compliance Dashboard leaves the filter its target
   page should open with, then navigates; the page TAKES it once on mount (so a later visit
   from the sidebar opens unfiltered). On globalThis so a hot reload cannot split the store. */
type DrillRules = Omit<FilterRule, 'id'>[];
const drillStore: Record<string, DrillRules> = ((globalThis as any).__complianceDrill ??= {});
export function setComplianceDrill(page: string, rules: DrillRules) { drillStore[page] = rules; }
export function takeComplianceDrill(page: string): DrillRules | undefined {
  const r = drillStore[page];
  delete drillStore[page];
  return r;
}

export const ARCHIVED_POLICY_VIEW = 'Archived Policies';

/* Status = where the scan RUN stands; Compliance Result = whether it passed (Zeni, 12 Nov 2026). */
export const POLICY_STATUS_OPTIONS = [
  { label: 'Draft', color: '#94A3B8' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Completed', color: '#22C55E' },
  { label: 'Cancelled', color: '#F59E0B' },
];
export const POLICY_RESULT_OPTIONS = [
  { label: 'Compliant', color: '#22C55E' },
  { label: 'Non-Compliant', color: '#DC2626' },
];
/* The four posture bands plus the state before any scan — declared ABOVE every attr list that
   names it (a module const inside a later object literal is fine; the other way round is a
   temporal-dead-zone crash esbuild does not see). */
export const POSTURE_OPTIONS = [
  { label: 'Secure', color: '#22C55E' },
  { label: 'Moderate', color: '#F59E0B' },
  { label: 'Poor', color: '#F97316' },
  { label: 'Vulnerable', color: '#DC2626' },
  { label: 'Not assessed', color: '#94A3B8' },
];
const ENABLED_OPTIONS = [{ label: 'Enabled', color: '#22C55E' }, { label: 'Disabled', color: '#94A3B8' }];
/* Zeni, 17 Nov 2026: a listing offers a filter ONLY for a column it shows. OS Type has no column
   on these listings, so it became OS Platform — the platforms the catalogue actually holds.
   (complianceData has no imports, so reading it here cannot create a cycle.) */
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((label) => ({ label }));
const RULE_PLATFORM_OPTIONS = uniq(RULES.map((r) => r.platform));
const RULE_VERSION_OPTIONS = uniq(RULES.map((r) => r.version));
const BENCHMARK_PLATFORM_OPTIONS = uniq(BENCHMARKS_SEED.map((b) => platformOf(b.osVersion).platform));
const OS_FILTER_OPTIONS = ['Linux', 'Windows'].map((label) => ({ label }));

/* Score bands (Zeni, 18 Nov 2026): a score is filtered by the THRESHOLD it clears, not a typed
   number — 90 · 80 · 70 · 50 · 25 are the lines an auditor reports against. The bands are
   multi-select, so "below 50" is two ticks (25–49 + Below 25) and "80 and above" is two more.
   Every row carries its band as x_scoreBand (complianceRows / CompliancePoliciesListingPage). */
export const SCORE_BANDS = [
  { min: 90, label: '90 – 100%', color: '#22C55E' },
  { min: 80, label: '80 – 89%', color: '#84CC16' },
  { min: 70, label: '70 – 79%', color: '#F59E0B' },
  { min: 50, label: '50 – 69%', color: '#F97316' },
  { min: 25, label: '25 – 49%', color: '#EF4444' },
  { min: 0, label: 'Below 25%', color: '#B91C1C' },
];
export function scoreBand(score: number | null | undefined, none = 'Not scanned'): string {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return none;
  return (SCORE_BANDS.find((b) => Number(score) >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]).label;
}
const bandOptions = (none: string) => [...SCORE_BANDS.map(({ label, color }) => ({ label, color })), { label: none, color: '#94A3B8' }];
const AUDIT_SCORE_OPTIONS = bandOptions('Not scanned');
const RULE_SCORE_OPTIONS = bandOptions('Not checked');

export const POLICY_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Policy Name', icon: AlignLeft, type: 'text' },
  { key: 'x_platform', label: 'OS Platform', icon: Layers, type: 'select', options: BENCHMARK_PLATFORM_OPTIONS },
  { key: 'x_benchmark', label: 'Benchmark', icon: ShieldCheck, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: POLICY_STATUS_OPTIONS },
  { key: 'x_cpResult', label: 'Compliance Result', icon: ShieldCheck, type: 'select', options: POLICY_RESULT_OPTIONS },
  { key: 'x_enabled', label: 'Enable', icon: Power, type: 'select', options: ENABLED_OPTIONS },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_updatedBy', label: 'Updated By', icon: User, type: 'text' },
  { key: 'x_createdAt', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'x_updatedAt', label: 'Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_tags', label: 'Tags', icon: Tag, type: 'text' },
  { key: 'x_lastExecution', label: 'Last Scan Date', icon: CalendarDays, type: 'date' },
  /* hidden: the Compliance Score column already exists — this only lets the band chip read well (and keeps it out of column selection). */
  { key: 'x_scoreBand', label: 'Compliance Score', icon: Gauge, type: 'select', options: AUDIT_SCORE_OPTIONS, hidden: true },
  /* The score as a NUMBER, cut by a threshold from the quick filter (Zeni, 19 Nov 2026). Hidden: the column already exists. */
  { key: 'x_cpScore', label: 'Compliance Score', icon: Gauge, type: 'number', unit: '%', hidden: true },
];

/* The lines an auditor reports against (Zeni, 19 Nov 2026). */
const SCORE_PRESETS = [50, 70, 80, 90];

export const POLICY_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: CircleDot, tip: 'Filter by status', title: 'Status is', width: 200, row: 'dot', options: POLICY_STATUS_OPTIONS },
  { field: 'x_cpResult', icon: ShieldCheck, tip: 'Filter by compliance result', title: 'Compliance Result is', width: 220, row: 'dot', options: POLICY_RESULT_OPTIONS },
  { field: 'x_platform', icon: Layers, tip: 'Filter by OS platform', title: 'OS Platform is', width: 220, row: 'plain', options: BENCHMARK_PLATFORM_OPTIONS },
  { field: 'x_cpScore', icon: Gauge, tip: 'Filter by compliance score', title: 'Compliance Score', width: 264, options: [], threshold: { presets: SCORE_PRESETS, unit: '%', noun: 'audits' } },
];

/* Zeni, 12 Nov 2026: All · In Progress (pending) · Draft · Cancelled · Archived · Non-Compliant. */
export const POLICY_VIEWS: TicketView[] = [
  { name: 'All Compliance Audits', rules: [] },
  { name: 'In Progress Policies', rules: [{ field: 'status', condition: 'is', values: ['In Progress'] }] },
  { name: 'Draft Policies', rules: [{ field: 'status', condition: 'is', values: ['Draft'] }] },
  { name: 'Cancelled Policies', rules: [{ field: 'status', condition: 'is', values: ['Cancelled'] }] },
  /* Archived policies are in THIS view only — CompliancePoliciesListingPage's viewScope keeps them out of the rest. */
  { name: ARCHIVED_POLICY_VIEW, rules: [] },
  { name: 'Non-Compliant Policies', rules: [{ field: 'x_cpResult', condition: 'is', values: ['Non-Compliant'] }] },
];

/* ── The technician's Benchmark and Endpoints pages — read-only registers over the same
   scan results (they were the old Compliance Visualization page's Explorer tabs). ─────── */

export const SCAN_STATUS_OPTIONS = [{ label: 'Success', color: '#22C55E' }, { label: 'Not reached', color: '#F59E0B' }, { label: 'Not scanned', color: '#94A3B8' }];
const SEVERITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' }, { label: 'High', color: '#F97316' }, { label: 'Medium', color: '#F59E0B' },
  { label: 'Low', color: '#22C55E' }, { label: 'Info', color: '#3D8BD0' },
];
const RULE_PROFILE_OPTIONS = [{ label: 'L1' }, { label: 'L2' }];
const RESULT_OPTIONS = [{ label: 'Failing', color: '#DC2626' }, { label: 'All passing', color: '#22C55E' }, { label: 'Not checked', color: '#94A3B8' }];

const IN_USE_OPTIONS = [{ label: 'In use', color: '#22C55E' }, { label: 'Unused', color: '#94A3B8' }];

/* Benchmark — one row per benchmark in the catalogue, scored from the policies that run it. */
export const VIZ_BENCHMARK_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Benchmark', icon: AlignLeft, type: 'text' },
  { key: 'x_type', label: 'OS Type', icon: Layers, type: 'select', options: OS_FILTER_OPTIONS },
  { key: 'x_osVersion', label: 'OS Version', icon: Layers, type: 'text' },
  /* No column — kept hidden only so the In Use / Unused cards still draw a readable chip. */
  { key: 'x_inUse', label: 'Usage', icon: Power, type: 'select', options: IN_USE_OPTIONS, hidden: true },
];
export const VIZ_BENCHMARK_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_type', icon: Layers, tip: 'Filter by OS type', title: 'OS Type is', width: 180, row: 'plain', options: OS_FILTER_OPTIONS },
];
export const VIZ_BENCHMARK_VIEWS: TicketView[] = [
  { name: 'All Benchmarks', rules: [] },
];

export const VIZ_RULE_FILTER_ATTRS: Attr[] = [
  { key: 'x_ruleCode', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_severity', label: 'Severity', icon: CircleDot, type: 'select', options: SEVERITY_OPTIONS },
  { key: 'x_profile', label: 'Profile', icon: ShieldCheck, type: 'select', options: RULE_PROFILE_OPTIONS },
  { key: 'x_assessment', label: 'Assessment', icon: CircleDot, type: 'select', options: [{ label: 'Automated' }, { label: 'Manual' }] },
  { key: 'x_platform', label: 'OS Platform', icon: Layers, type: 'select', options: RULE_PLATFORM_OPTIONS },
  { key: 'x_version', label: 'OS Version', icon: Layers, type: 'select', options: RULE_VERSION_OPTIONS },
  /* No column — kept hidden only so the Failing / Not Checked cards and dashboard links draw a readable chip. */
  { key: 'x_result', label: 'Result', icon: CircleDot, type: 'select', options: RESULT_OPTIONS, hidden: true },
  { key: 'x_scoreBand', label: 'Rule Score', icon: Gauge, type: 'select', options: RULE_SCORE_OPTIONS, hidden: true },
  { key: 'x_cpScore', label: 'Rule Score', icon: Gauge, type: 'number', unit: '%', hidden: true },
];
export const VIZ_RULE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_severity', icon: CircleDot, tip: 'Filter by severity', title: 'Severity is', width: 190, row: 'dot', options: SEVERITY_OPTIONS },
  { field: 'x_platform', icon: Layers, tip: 'Filter by OS platform', title: 'OS Platform is', width: 240, row: 'plain', options: RULE_PLATFORM_OPTIONS },
  { field: 'x_cpScore', icon: Gauge, tip: 'Filter by rule score', title: 'Rule Score', width: 264, options: [], threshold: { presets: SCORE_PRESETS, unit: '%', noun: 'rules' } },
];
export const VIZ_RULE_VIEWS: TicketView[] = [
  { name: 'All Rules', rules: [] },
];

export const VIZ_RESOURCE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Hostname', icon: AlignLeft, type: 'text' },
  { key: 'x_ip', label: 'IP Address', icon: Hash, type: 'text' },
  { key: 'x_osName', label: 'OS Name', icon: Layers, type: 'text' },
  { key: 'x_osVersion', label: 'OS Version', icon: Layers, type: 'text' },
  { key: 'x_cpResult', label: 'Compliance Result', icon: ShieldCheck, type: 'select', options: POLICY_RESULT_OPTIONS },
  { key: 'x_office', label: 'Remote Office', icon: Layers, type: 'text' },
  /* No column — kept hidden only so a dashboard posture link draws a readable chip. */
  { key: 'x_posture', label: 'Posture', icon: CircleDot, type: 'select', options: POSTURE_OPTIONS, hidden: true },
  { key: 'x_scanStatus', label: 'Scan Status', icon: CircleDot, type: 'select', options: SCAN_STATUS_OPTIONS },
  { key: 'x_lastExecution', label: 'Last Scan', icon: CalendarDays, type: 'date' },
  { key: 'x_scoreBand', label: 'Compliance Score', icon: Gauge, type: 'select', options: AUDIT_SCORE_OPTIONS, hidden: true },
];
/* Endpoints: Compliance Result and Compliance Score bands (Zeni, 18 Nov 2026). Scan Status stays under Filters. */
export const VIZ_RESOURCE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_cpResult', icon: ShieldCheck, tip: 'Filter by compliance result', title: 'Compliance Result is', width: 220, row: 'dot', options: POLICY_RESULT_OPTIONS },
  { field: 'x_scoreBand', icon: Gauge, tip: 'Filter by compliance score', title: 'Compliance Score is', width: 210, row: 'dot', options: AUDIT_SCORE_OPTIONS },
];
export const VIZ_RESOURCE_VIEWS: TicketView[] = [
  { name: 'All Endpoints', rules: [] },
  { name: 'Not Reached', rules: [{ field: 'x_scanStatus', condition: 'is', values: ['Not reached'] }] },
];
