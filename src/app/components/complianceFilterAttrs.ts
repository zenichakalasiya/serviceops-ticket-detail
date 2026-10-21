/* Compliance Policy listing — the filter catalogue, quick filters, saved views and status
   palette. Its own small file with no heavy imports, because TicketTable and TicketViewsPanel
   read it and both sit underneath half the app. */
import { AlignLeft, CalendarClock, CalendarDays, CircleDot, Hash, Layers, Power, ShieldCheck, Tag, User } from 'lucide-react';
import type { Attr, QuickFilterDef } from './TicketFilterBar';
import type { TicketView } from './TicketViewsPanel';

export const POLICY_STATUS_OPTIONS = [
  { label: 'Compliant', color: '#22C55E' },
  { label: 'Non-Compliant', color: '#DC2626' },
  { label: 'Scanning', color: '#3D8BD0' },
  { label: 'Not Scanned', color: '#94A3B8' },
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
  { key: 'x_tags', label: 'Tag', icon: Tag, type: 'text' },
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
