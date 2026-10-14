/* ── Automatic Patch Tests — data + filter catalogue ─────────────────────────
   A test schedule runs a patch against a pilot ring before it is approved for the fleet, so
   the record is about a RUN SCHEDULE rather than a patch: how many test cases it covers, how
   many have finished, when it last ran and when it runs next.

   Its own file (not folded into the patch catalogue) because it is a separate module with a
   separate id series, and the listing is the only thing that reads it today. */
import { CalendarDays, CircleDot, FileText, Hash, ListChecks, Power } from 'lucide-react';
import type { Attr, QuickFilterDef } from './TicketFilterBar';

export interface AutomaticPatchTest {
  id: string;
  /** What the schedule tests — usually the patch family it validates. */
  name: string;
  /** Test cases in the schedule. `null` = it has never been built out. */
  totalTests: number | null;
  pendingTests: number | null;
  completedTests: number | null;
  /** `null` = never run / not scheduled, which the grid prints as a dash. */
  lastExecution: string | null;
  nextExecution: string | null;
  /** The Enable switch — a disabled schedule keeps its history but will not run again. */
  enabled: boolean;
  createdBy: string;
}

/* Realistic schedules: a pilot-ring validation per patch family, plus the two hand-made ones
   every environment accumulates. The counts add up (total = pending + completed) and a
   schedule that has never run carries nulls all the way across rather than zeroes. */
export const mockAutomaticPatchTests: AutomaticPatchTest[] = [
  { id: 'APT-14', name: 'Security Intelligence Update for Microsoft Defender — Daily Validation', totalTests: 24, pendingTests: 3, completedTests: 21, lastExecution: 'Tue, Sep 29, 2026 02:00 AM', nextExecution: 'Wed, Sep 30, 2026 02:00 AM', enabled: true, createdBy: 'Rakesh Rathod' },
  { id: 'APT-13', name: 'Windows 11 23H2 Cumulative — Pilot Ring Validation', totalTests: 36, pendingTests: 11, completedTests: 25, lastExecution: 'Mon, Sep 28, 2026 09:30 PM', nextExecution: 'Mon, Oct 05, 2026 09:30 PM', enabled: true, createdBy: 'Sarah Johnson' },
  { id: 'APT-12', name: '.NET Framework Rollup — Application Server Smoke Test', totalTests: 18, pendingTests: 0, completedTests: 18, lastExecution: 'Sat, Sep 26, 2026 11:00 PM', nextExecution: 'Sat, Oct 24, 2026 11:00 PM', enabled: true, createdBy: 'Chintan Makwana' },
  { id: 'APT-11', name: 'Google Chrome Enterprise — Browser Compatibility Suite', totalTests: 42, pendingTests: 17, completedTests: 25, lastExecution: 'Sun, Sep 27, 2026 06:00 AM', nextExecution: 'Sun, Oct 04, 2026 06:00 AM', enabled: true, createdBy: 'Priya Nair' },
  { id: 'APT-10', name: 'Microsoft Exchange Server CU — Mail Flow Regression', totalTests: 15, pendingTests: 15, completedTests: 0, lastExecution: null, nextExecution: 'Fri, Oct 02, 2026 10:00 PM', enabled: true, createdBy: 'Rakesh Rathod' },
  { id: 'APT-9', name: 'Windows Server 2022 Cumulative — Domain Controller Checks', totalTests: 28, pendingTests: 4, completedTests: 24, lastExecution: 'Fri, Sep 25, 2026 01:00 AM', nextExecution: 'Fri, Oct 09, 2026 01:00 AM', enabled: true, createdBy: 'Siddharth Rao' },
  { id: 'APT-8', name: 'Adobe Acrobat Reader DC — Document Rendering Suite', totalTests: 12, pendingTests: 0, completedTests: 12, lastExecution: 'Thu, Sep 17, 2026 08:00 PM', nextExecution: null, enabled: false, createdBy: 'Sarah Johnson' },
  { id: 'APT-7', name: 'Oracle Java SE — Legacy Application Compatibility', totalTests: 21, pendingTests: 6, completedTests: 15, lastExecution: 'Wed, Sep 23, 2026 07:30 PM', nextExecution: 'Wed, Oct 07, 2026 07:30 PM', enabled: true, createdBy: 'Chintan Makwana' },
  { id: 'APT-6', name: 'Mozilla Firefox ESR — Kiosk Browser Validation', totalTests: 9, pendingTests: 2, completedTests: 7, lastExecution: 'Tue, Sep 22, 2026 03:15 AM', nextExecution: 'Tue, Oct 06, 2026 03:15 AM', enabled: true, createdBy: 'Priya Nair' },
  { id: 'APT-5', name: 'Zoom Workplace — Conference Room Device Suite', totalTests: 16, pendingTests: 16, completedTests: 0, lastExecution: null, nextExecution: null, enabled: false, createdBy: 'Siddharth Rao' },
  { id: 'APT-4', name: 'Servicing Stack Update — Pre-flight Checks', totalTests: 7, pendingTests: 1, completedTests: 6, lastExecution: 'Mon, Sep 21, 2026 11:45 PM', nextExecution: 'Mon, Oct 19, 2026 11:45 PM', enabled: true, createdBy: 'Rakesh Rathod' },
  { id: 'APT-3', name: 'PuTTY and OpenSSH — Network Tooling Regression', totalTests: 11, pendingTests: 0, completedTests: 11, lastExecution: 'Sat, Sep 19, 2026 05:00 AM', nextExecution: 'Sat, Oct 17, 2026 05:00 AM', enabled: true, createdBy: 'Chintan Makwana' },
  { id: 'APT-2', name: 'Third Party Updates — Weekly Smoke Test', totalTests: 33, pendingTests: 9, completedTests: 24, lastExecution: 'Sun, Sep 20, 2026 04:00 AM', nextExecution: 'Sun, Oct 04, 2026 04:00 AM', enabled: true, createdBy: 'Sarah Johnson' },
  /* Never built out — the row an admin created and left. Dashes all the way across. */
  { id: 'APT-1', name: 'Draft — Linux Kernel Patch Validation', totalTests: null, pendingTests: null, completedTests: null, lastExecution: null, nextExecution: null, enabled: false, createdBy: 'Priya Nair' },
];

/* ── Filter catalogue ──────────────────────────────────────────────────────── */

export const APT_ENABLE_OPTIONS = [
  { label: 'Enabled', color: '#22C55E' },
  { label: 'Disabled', color: '#94A3B8' },
];

/* Where the schedule stands, worked out from its counts — the cut an admin makes ("what is
   still running", "what has never run") that no single stored field answers. */
export const APT_PROGRESS_OPTIONS = [
  { label: 'All tests passed', color: '#22C55E' },
  { label: 'Tests pending', color: '#F59E0B' },
  { label: 'Never run', color: '#94A3B8' },
];
export const aptProgressOf = (t: AutomaticPatchTest): string => {
  if (t.totalTests === null || t.lastExecution === null) return 'Never run';
  return (t.pendingTests ?? 0) > 0 ? 'Tests pending' : 'All tests passed';
};

const YES_NO = [
  { label: 'Yes', color: '#3D8BD0' },
  { label: 'No', color: '#94A3B8' },
];

export const APT_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: FileText, type: 'text' },
  { key: 'x_totalTests', label: 'Total Tests', icon: ListChecks, type: 'text' },
  { key: 'x_pendingTests', label: 'Pending Tests', icon: ListChecks, type: 'text' },
  { key: 'x_completedTests', label: 'Completed Tests', icon: ListChecks, type: 'text' },
  { key: 'x_lastExecution', label: 'Last Execution Time', icon: CalendarDays, type: 'date' },
  { key: 'x_nextExecution', label: 'Next Execution Time', icon: CalendarDays, type: 'date' },
  { key: 'x_enabled', label: 'Enable', icon: Power, type: 'select', options: APT_ENABLE_OPTIONS },
  { key: 'x_createdBy', label: 'Created By', icon: CircleDot, type: 'text' },

  /* Derived band behind the KPI cards and the saved views — not a product attribute. */
  { key: 'x_progress', label: 'Test progress', icon: ListChecks, type: 'select', hidden: true, options: APT_PROGRESS_OPTIONS },
  /* What the schedule's runs have produced — read off the same `runsFor` set the side panel
     renders, so a KPI card here and the panel's tiles count the same runs. One Yes/No band
     per outcome, because a schedule can hold all three at once. */
  { key: 'x_tested', label: 'Patches Tested', icon: ListChecks, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_observing', label: 'Under Observation', icon: ListChecks, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_failedTests', label: 'Failed Tests', icon: ListChecks, type: 'select', hidden: true, options: YES_NO },
];

export const APT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_enabled', icon: Power, tip: 'Filter by enable state', title: 'Schedule is', width: 190, row: 'dot', options: APT_ENABLE_OPTIONS },
];
