/* ── Automatic Patch Deployments — data + filter catalogue ───────────────────
   A deployment schedule pushes approved patches to a set of endpoints on a recurring
   window, so the record is about a SCHEDULE rather than a patch: when it last ran, when it
   runs next, and whether it is still switched on.

   Sibling of `automaticPatchTests.ts` and deliberately shaped the same way — the two modules
   sit next to each other in the Patch flyout and are read the same way — but its own file and
   its own id series (`APD-`), because a test schedule validates a patch and a deployment
   schedule ships one. */
import { CalendarDays, CircleDot, FileText, Hash, Power, Rocket } from 'lucide-react';
import type { Attr, QuickFilterDef } from './TicketFilterBar';

export interface AutomaticPatchDeployment {
  id: string;
  /** What the schedule ships — usually the patch family it rolls out. */
  name: string;
  /** Deployments it has created. `null` = it has never been built out. */
  totalDeployments: number | null;
  /** `null` = never run / not scheduled, which the grid prints as a dash. */
  lastExecution: string | null;
  nextExecution: string | null;
  /** The Enable switch — a disabled schedule keeps its history but will not run again. */
  enabled: boolean;
  createdBy: string;
  /** The rollout policy every deployment it creates inherits. */
  deploymentPolicy: string;
}

/* Realistic schedules: a recurring rollout per patch family, plus the hand-made ones every
   environment accumulates. The policies are the Patch Deployment module's own, so a run
   opened from here names the same policy the deployment listing would show. */
export const mockAutomaticPatchDeployments: AutomaticPatchDeployment[] = [
  { id: 'APD-12', name: 'Security Intelligence Update for Microsoft Defender — Daily Rollout', totalDeployments: 36, lastExecution: 'Fri, Oct 02, 2026 12:00 AM', nextExecution: 'Sat, Oct 03, 2026 12:00 AM', enabled: true, createdBy: 'Rakesh Rathod', deploymentPolicy: 'Security Definitions — Immediate' },
  { id: 'APD-11', name: 'Windows 11 23H2 Cumulative — Workstation Wave', totalDeployments: 28, lastExecution: 'Thu, Oct 01, 2026 10:00 PM', nextExecution: 'Thu, Oct 08, 2026 10:00 PM', enabled: true, createdBy: 'Sarah Johnson', deploymentPolicy: 'Workstations — Business Hours Safe' },
  { id: 'APD-10', name: 'Oracle Java SE — Critical Patch Rollout', totalDeployments: 22, lastExecution: 'Wed, Sep 30, 2026 09:00 PM', nextExecution: 'Wed, Oct 14, 2026 09:00 PM', enabled: true, createdBy: 'Chintan Makwana', deploymentPolicy: 'Critical Security — Immediate' },
  { id: 'APD-9', name: 'Google Chrome Enterprise — Browser Fleet Update', totalDeployments: 31, lastExecution: 'Thu, Oct 01, 2026 08:00 PM', nextExecution: 'Thu, Oct 08, 2026 08:00 PM', enabled: true, createdBy: 'Priya Nair', deploymentPolicy: 'Browser Updates — Silent Install' },
  { id: 'APD-8', name: 'Windows Server 2022 Cumulative — Production Servers Wave 2', totalDeployments: 18, lastExecution: 'Tue, Sep 29, 2026 11:00 PM', nextExecution: 'Tue, Oct 13, 2026 11:00 PM', enabled: true, createdBy: 'Siddharth Rao', deploymentPolicy: 'Production Servers — Staged Rollout' },
  { id: 'APD-7', name: 'Riya automatic patch deployment', totalDeployments: 14, lastExecution: 'Fri, Oct 02, 2026 12:00 PM', nextExecution: 'Sat, Oct 03, 2026 12:00 PM', enabled: true, createdBy: 'Riya Shah', deploymentPolicy: 'Workstations — Business Hours Safe' },
  { id: 'APD-6', name: '.NET Framework Rollup — Application Servers', totalDeployments: 11, lastExecution: 'Mon, Sep 28, 2026 11:30 PM', nextExecution: 'Mon, Oct 26, 2026 11:30 PM', enabled: true, createdBy: 'Chintan Makwana', deploymentPolicy: 'Production Servers — Staged Rollout' },
  { id: 'APD-5', name: 'Adobe Acrobat Reader DC — Document Workstations', totalDeployments: 9, lastExecution: 'Sat, Sep 19, 2026 07:00 PM', nextExecution: null, enabled: false, createdBy: 'Sarah Johnson', deploymentPolicy: 'Workstations — Business Hours Safe' },
  { id: 'APD-4', name: 'Servicing Stack Update — Pre-flight Rollout', totalDeployments: 7, lastExecution: 'Sun, Sep 27, 2026 10:45 PM', nextExecution: 'Sun, Oct 25, 2026 10:45 PM', enabled: true, createdBy: 'Rakesh Rathod', deploymentPolicy: 'Critical Security — Immediate' },
  /* Scheduled but not yet fired — a next run, no last one. */
  { id: 'APD-3', name: 'Microsoft Exchange Server CU — Mail Servers', totalDeployments: 0, lastExecution: null, nextExecution: 'Mon, Oct 05, 2026 10:00 PM', enabled: true, createdBy: 'Siddharth Rao', deploymentPolicy: 'Production Servers — Staged Rollout' },
  { id: 'APD-2', name: 'Third Party Updates — Weekly Rollout', totalDeployments: 24, lastExecution: 'Sun, Sep 27, 2026 04:00 AM', nextExecution: 'Sun, Oct 04, 2026 04:00 AM', enabled: true, createdBy: 'Priya Nair', deploymentPolicy: 'Browser Updates — Silent Install' },
  /* Never built out — the row an admin created and left. Dashes all the way across. */
  { id: 'APD-1', name: 'Draft — Linux Kernel Patch Rollout', totalDeployments: null, lastExecution: null, nextExecution: null, enabled: false, createdBy: 'Priya Nair', deploymentPolicy: 'Production Servers — Staged Rollout' },
];

/* ── Filter catalogue ──────────────────────────────────────────────────────── */

export const APD_ENABLE_OPTIONS = [
  { label: 'Enabled', color: '#22C55E' },
  { label: 'Disabled', color: '#94A3B8' },
];

/* Where the schedule stands, worked out from its own fields — the cut an admin makes
   ("what is live", "what has never fired") that no single stored field answers. */
export const APD_ACTIVITY_OPTIONS = [
  { label: 'Running', color: '#22C55E' },
  { label: 'Scheduled', color: '#3D8BD0' },
  { label: 'Never run', color: '#94A3B8' },
  { label: 'Stopped', color: '#DC2626' },
];
export const apdActivityOf = (d: AutomaticPatchDeployment): string => {
  if (!d.enabled) return 'Stopped';
  if (!d.lastExecution) return d.nextExecution ? 'Scheduled' : 'Never run';
  return 'Running';
};

export const APD_POLICY_OPTIONS = [
  'Security Definitions — Immediate',
  'Critical Security — Immediate',
  'Workstations — Business Hours Safe',
  'Production Servers — Staged Rollout',
  'Browser Updates — Silent Install',
].map((label) => ({ label, color: '#3D8BD0' }));

const YES_NO = [
  { label: 'Yes', color: '#3D8BD0' },
  { label: 'No', color: '#94A3B8' },
];

export const APD_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: FileText, type: 'text' },
  { key: 'x_lastExecution', label: 'Last Execution Time', icon: CalendarDays, type: 'date' },
  { key: 'x_nextExecution', label: 'Next Execution Time', icon: CalendarDays, type: 'date' },
  { key: 'x_enabled', label: 'Enable', icon: Power, type: 'select', options: APD_ENABLE_OPTIONS },
  { key: 'x_policy', label: 'Deployment Policy', icon: Rocket, type: 'select', options: APD_POLICY_OPTIONS },
  { key: 'x_createdBy', label: 'Created By', icon: CircleDot, type: 'text' },

  /* Derived bands behind the KPI cards and the saved views — not product attributes, so they
     stay out of the picker while the cards, filters and dashboard still read them. */
  { key: 'x_activity', label: 'Schedule activity', icon: Rocket, type: 'select', hidden: true, options: APD_ACTIVITY_OPTIONS },
  { key: 'x_deployments', label: 'Deployments created', icon: Rocket, type: 'text', hidden: true },
  /* Installation outcomes across the schedule's runs — read off the same `deploymentsFor` set
     the side panel renders, so a KPI card here and the panel's tiles count the same installs.
     One Yes/No band per outcome, because a schedule can hold all three at once. */
  { key: 'x_hasInstalled', label: 'Successful installs', icon: Rocket, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_hasPending', label: 'Pending installs', icon: Rocket, type: 'select', hidden: true, options: YES_NO },
  { key: 'x_hasFailed', label: 'Failed installs', icon: Rocket, type: 'select', hidden: true, options: YES_NO },
];

export const APD_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_enabled', icon: Power, tip: 'Filter by enable state', title: 'Schedule is', width: 190, row: 'dot', options: APD_ENABLE_OPTIONS },
];
