/* The My Team listing's filter catalogue — every attribute the page offers on a team
   member. It feeds the filter builder, the Manage-columns list (minus whatever the grid
   already shows), the grid's own Group / Shift dropdowns and the quick filters, so every
   surface reads ONE list.

   The value lists are DERIVED from the roster wherever the roster is the authority
   (groups, sites, departments, managers, designations): a filter that offers a group
   nobody is in — or misses one that exists — is worse than no filter at all. Only the
   lists with a meaningful ORDER or COLOUR (role, account status, workload, availability)
   are declared by hand. */
import {
  Boxes, Building2, CalendarClock, CalendarDays, CircleDot, Gauge, Hash, IdCard, KeyRound,
  Mail, MapPin, Phone, ShieldCheck, UserRound, Users,
} from 'lucide-react';
import { TEAM_MEMBERS, workloadBandOf } from './teamRoster';
import type { Attr } from './TicketFilterBar';

/** Unique values in roster order — no sorting, so groups read in desk order. */
const uniq = (vals: string[]) => [...new Set(vals.filter(Boolean))].map((label) => ({ label }));

const of = <K extends keyof (typeof TEAM_MEMBERS)[number]>(key: K) =>
  uniq(TEAM_MEMBERS.map((m) => String(m[key])));

/* Seniority order, not alphabetical — a role list reads top-down. */
export const TEAM_ROLE_OPTIONS = [
  { label: 'Administrator', color: '#8B5CF6' },
  { label: 'Supervisor', color: '#3D8BD0' },
  { label: 'Technician', color: '#22C55E' },
];

/* The account itself: can this person sign in at all. Deliberately separate from
   Availability — a technician on leave still has a live account. */
export const TEAM_STATUS_OPTIONS = [
  { label: 'Active', color: '#22C55E' },
  { label: 'Inactive', color: '#94A3B8' },
  { label: 'Blocked', color: '#EF4444' },
];

/* Can work be given to them right now. */
export const TEAM_AVAILABILITY_OPTIONS = [
  { label: 'Available', color: '#22C55E' },
  { label: 'On Leave', color: '#F59E0B' },
  { label: 'Unavailable', color: '#94A3B8' },
];

/* How much they are already carrying, lightest first. */
export const TEAM_WORKLOAD_OPTIONS = [
  { label: 'Idle', color: '#94A3B8' },
  { label: 'Light', color: '#22C55E' },
  { label: 'Busy', color: '#F59E0B' },
  { label: 'Overloaded', color: '#EF4444' },
];

export const TEAM_GROUP_OPTIONS = of('group');
export const TEAM_SHIFT_OPTIONS = of('shift');

/* Which assets and CIs a technician may work on — the product's own scoping concept. */
export const TEAM_SCOPE_OPTIONS = [
  { label: 'All Assets and CIs' },
  { label: 'Group Assets and CIs' },
  { label: 'Location Assets and CIs' },
  { label: 'Assigned Assets Only' },
];

export const TEAM_FILTER_ATTRS: Attr[] = [
  /* ── What the Filters attribute picker offers. (The product's list has a sixth entry,
     an admin-created custom field it never renamed from "New Dropdown" — dropped here by
     request.) Everything below is marked `hidden` and so stays OUT of this list while
     still backing the Manage-columns set, the quick filters, the grid's own dropdowns and
     the saved views — a rule applied from any of those still needs a readable chip. */
  { key: 'x_name', label: 'Name', icon: UserRound, type: 'text' },
  { key: 'x_contact', label: 'Contact No.', icon: Phone, type: 'text' },
  { key: 'x_email', label: 'Email', icon: Mail, type: 'text' },
  { key: 'x_assetScope', label: 'Asset/CI Scope', icon: Boxes, type: 'select', options: TEAM_SCOPE_OPTIONS },

  /* ── Not in the product's picker, but every one of them is a column, a quick filter or a
     saved view on this page. */
  { key: 'id', label: 'ID', icon: Hash, type: 'text', hidden: true },
  { key: 'x_role', label: 'Role', icon: ShieldCheck, type: 'select', hidden: true, options: TEAM_ROLE_OPTIONS },
  { key: 'x_designation', label: 'Designation', icon: IdCard, type: 'select', hidden: true, options: of('designation') },
  { key: 'x_group', label: 'Technician Group', icon: Users, type: 'select', hidden: true, options: TEAM_GROUP_OPTIONS },
  { key: 'x_department', label: 'Department', icon: Building2, type: 'select', hidden: true, options: of('department') },
  { key: 'x_location', label: 'Location', icon: MapPin, type: 'select', hidden: true, options: of('location') },
  { key: 'x_manager', label: 'Reporting Manager', icon: UserRound, type: 'select', hidden: true, people: 'technician', options: of('manager') },
  { key: 'status', label: 'Account Status', icon: CircleDot, type: 'select', hidden: true, options: TEAM_STATUS_OPTIONS },
  { key: 'x_availability', label: 'Availability', icon: CalendarClock, type: 'select', hidden: true, options: TEAM_AVAILABILITY_OPTIONS },
  { key: 'x_workload', label: 'Workload', icon: Gauge, type: 'select', hidden: true, options: TEAM_WORKLOAD_OPTIONS },
  /* The raw count behind the Workload band. Free text, not a value list: the useful CUT
     is the band above ("who is overloaded"), and offering 0-12 as pickable values would
     be a dozen rows nobody wants. */
  { key: 'x_openRequests', label: 'Open Requests', icon: Hash, type: 'text', hidden: true },
  { key: 'x_shift', label: 'Shift', icon: CalendarClock, type: 'select', hidden: true, options: TEAM_SHIFT_OPTIONS },
  { key: 'x_loginName', label: 'Login Name', icon: KeyRound, type: 'text', hidden: true },
  { key: 'x_authSource', label: 'Authentication Source', icon: KeyRound, type: 'select', hidden: true, options: of('authSource') },
  /* A real Date on the row, so the grid sorts it chronologically and the date buckets
     ("Last 7 days") read the true value rather than the text of a formatted stamp. */
  { key: 'x_lastLogin', label: 'Last Login', icon: CalendarDays, type: 'date', hidden: true },
];

/** The band a member's open-request count falls into — shared with the row adapter. */
export const teamWorkloadBand = workloadBandOf;
