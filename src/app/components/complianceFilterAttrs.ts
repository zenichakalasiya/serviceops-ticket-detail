/* Compliance Policy listing — the filter catalogue, quick filters, saved views and status
   palette. Its own small file with no heavy imports, because TicketTable and TicketViewsPanel
   read it and both sit underneath half the app. */
import { AlignLeft, CalendarClock, CalendarDays, CircleDot, Hash, Layers, Power, ShieldCheck, User } from 'lucide-react';
import type { Attr, FilterRule, QuickFilterDef } from './TicketFilterBar';
import type { TicketView } from './TicketViewsPanel';

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

export const POLICY_STATUS_OPTIONS = [
  { label: 'Compliant', color: '#22C55E' },
  { label: 'Non-Compliant', color: '#DC2626' },
  { label: 'Scanning', color: '#3D8BD0' },
  { label: 'Not Scanned', color: '#94A3B8' },
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
const SCHEDULED_OPTIONS = [{ label: 'Scheduled' }, { label: 'Not scheduled' }];
const TYPE_OPTIONS = ['Linux', 'Windows', 'Router', 'Switch', 'Firewall'].map((label) => ({ label }));

export const POLICY_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Policy Name', icon: AlignLeft, type: 'text' },
  { key: 'x_benchmark', label: 'Benchmark', icon: ShieldCheck, type: 'text' },
  { key: 'x_type', label: 'Type', icon: Layers, type: 'select', options: TYPE_OPTIONS },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: POLICY_STATUS_OPTIONS },
  { key: 'x_enabled', label: 'Enable', icon: Power, type: 'select', options: ENABLED_OPTIONS },
  { key: 'x_scheduled', label: 'Schedule', icon: CalendarClock, type: 'select', options: SCHEDULED_OPTIONS },
  { key: 'x_schedule', label: 'Schedule Details', icon: CalendarClock, type: 'text' },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_lastExecution', label: 'Last Scan', icon: CalendarDays, type: 'date' },
  { key: 'x_nextExecution', label: 'Next Scan', icon: CalendarDays, type: 'date' },
];

export const POLICY_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: CircleDot, tip: 'Filter by status', title: 'Status is', width: 200, row: 'dot', options: POLICY_STATUS_OPTIONS },
  { field: 'x_type', icon: Layers, tip: 'Filter by type', title: 'Type is', width: 180, row: 'plain', options: TYPE_OPTIONS },
];

export const POLICY_VIEWS: TicketView[] = [
  { name: 'All Compliance Policies', rules: [] },
  { name: 'Non-Compliant', rules: [{ field: 'status', condition: 'is', values: ['Non-Compliant'] }] },
  { name: 'Never Scanned', rules: [{ field: 'status', condition: 'is', values: ['Not Scanned'] }] },
  { name: 'Scheduled', rules: [{ field: 'x_scheduled', condition: 'is', values: ['Scheduled'] }] },
  { name: 'Disabled', rules: [{ field: 'x_enabled', condition: 'is', values: ['Disabled'] }] },
];

/* ── The technician's Benchmark and Endpoints pages — read-only registers over the same
   scan results (they were the old Compliance Visualization page's Explorer tabs). ─────── */

export const SCAN_STATUS_OPTIONS = [{ label: 'Success', color: '#22C55E' }, { label: 'Not reached', color: '#F59E0B' }, { label: 'Not scanned', color: '#94A3B8' }];
const SEVERITY_OPTIONS = [
  { label: 'Critical', color: '#DC2626' }, { label: 'High', color: '#F97316' }, { label: 'Medium', color: '#F59E0B' },
  { label: 'Low', color: '#22C55E' }, { label: 'Info', color: '#3D8BD0' },
];
const PROFILE_OPTIONS = [{ label: 'L1' }, { label: 'L2' }, { label: 'L1 + L2' }];
const RESULT_OPTIONS = [{ label: 'Failing', color: '#DC2626' }, { label: 'All passing', color: '#22C55E' }, { label: 'Not checked', color: '#94A3B8' }];

const ORIGIN_OPTIONS = [{ label: 'Default' }, { label: 'Custom' }];
const IN_USE_OPTIONS = [{ label: 'In use', color: '#22C55E' }, { label: 'Unused', color: '#94A3B8' }];

/* Benchmark — one row per benchmark in the catalogue, scored from the policies that run it. */
export const VIZ_BENCHMARK_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Benchmark', icon: AlignLeft, type: 'text' },
  { key: 'x_type', label: 'Type', icon: Layers, type: 'select', options: TYPE_OPTIONS },
  { key: 'x_osVersion', label: 'Version', icon: Layers, type: 'text' },
  { key: 'x_profile', label: 'Profile', icon: ShieldCheck, type: 'select', options: PROFILE_OPTIONS },
  { key: 'x_origin', label: 'Origin', icon: Layers, type: 'select', options: ORIGIN_OPTIONS },
  { key: 'x_inUse', label: 'Usage', icon: Power, type: 'select', options: IN_USE_OPTIONS },
  { key: 'x_policyNames', label: 'Policy', icon: ShieldCheck, type: 'text' },
];
export const VIZ_BENCHMARK_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_type', icon: Layers, tip: 'Filter by type', title: 'Type is', width: 180, row: 'plain', options: TYPE_OPTIONS },
];
export const VIZ_BENCHMARK_VIEWS: TicketView[] = [
  { name: 'All Benchmarks', rules: [] },
  { name: 'In Use', rules: [{ field: 'x_inUse', condition: 'is', values: ['In use'] }] },
  { name: 'Network Devices', rules: [{ field: 'x_type', condition: 'is', values: ['Router', 'Switch', 'Firewall'] }] },
];

export const VIZ_RULE_FILTER_ATTRS: Attr[] = [
  { key: 'subject', label: 'Rule', icon: AlignLeft, type: 'text' },
  { key: 'x_severity', label: 'Severity', icon: CircleDot, type: 'select', options: SEVERITY_OPTIONS },
  { key: 'x_type', label: 'Type', icon: Layers, type: 'select', options: TYPE_OPTIONS },
  { key: 'x_platform', label: 'Platform', icon: Layers, type: 'text' },
  { key: 'x_version', label: 'Version', icon: Layers, type: 'text' },
  { key: 'x_profile', label: 'Profile', icon: ShieldCheck, type: 'select', options: PROFILE_OPTIONS },
  { key: 'x_assessment', label: 'Assessment', icon: CircleDot, type: 'select', options: [{ label: 'Automated' }, { label: 'Manual' }] },
  { key: 'x_section', label: 'Section', icon: Hash, type: 'text' },
  { key: 'x_result', label: 'Result', icon: CircleDot, type: 'select', options: RESULT_OPTIONS },
  { key: 'x_policyNames', label: 'Policy', icon: ShieldCheck, type: 'text' },
];
export const VIZ_RULE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_severity', icon: CircleDot, tip: 'Filter by severity', title: 'Severity is', width: 190, row: 'dot', options: SEVERITY_OPTIONS },
  { field: 'x_result', icon: ShieldCheck, tip: 'Filter by result', title: 'Result is', width: 180, row: 'dot', options: RESULT_OPTIONS },
  { field: 'x_type', icon: Layers, tip: 'Filter by type', title: 'Type is', width: 180, row: 'plain', options: TYPE_OPTIONS },
];
export const VIZ_RULE_VIEWS: TicketView[] = [
  { name: 'All Rules', rules: [] },
  { name: 'Failing Rules', rules: [{ field: 'x_result', condition: 'is', values: ['Failing'] }] },
  { name: 'Critical & High Failing', rules: [{ field: 'x_result', condition: 'is', values: ['Failing'] }, { field: 'x_severity', condition: 'is', values: ['Critical', 'High'] }] },
];

export const VIZ_RESOURCE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'Endpoint ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Host Name', icon: AlignLeft, type: 'text' },
  { key: 'x_ip', label: 'IP Address', icon: Hash, type: 'text' },
  { key: 'x_type', label: 'Type', icon: Layers, type: 'select', options: TYPE_OPTIONS },
  { key: 'x_osVersion', label: 'Version', icon: Layers, type: 'text' },
  { key: 'x_office', label: 'Remote Office', icon: Layers, type: 'text' },
  { key: 'x_posture', label: 'Posture', icon: CircleDot, type: 'select', options: POSTURE_OPTIONS },
  { key: 'x_scanStatus', label: 'Scan Status', icon: CircleDot, type: 'select', options: SCAN_STATUS_OPTIONS },
  { key: 'x_policyNames', label: 'Policy', icon: ShieldCheck, type: 'text' },
  { key: 'x_lastExecution', label: 'Last Scan', icon: CalendarDays, type: 'date' },
];
export const VIZ_RESOURCE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_scanStatus', icon: CalendarClock, tip: 'Filter by scan status', title: 'Scan Status is', width: 200, row: 'dot', options: SCAN_STATUS_OPTIONS },
  { field: 'x_type', icon: Layers, tip: 'Filter by type', title: 'Type is', width: 180, row: 'plain', options: TYPE_OPTIONS },
];
export const VIZ_RESOURCE_VIEWS: TicketView[] = [
  { name: 'All Endpoints', rules: [] },
  { name: 'Not Reached', rules: [{ field: 'x_scanStatus', condition: 'is', values: ['Not reached'] }] },
];
