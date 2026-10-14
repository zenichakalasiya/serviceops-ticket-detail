/* ── My Team roster ──────────────────────────────────────────────────────────
   The people behind the service desk, as the My Team listing shows them.

   The NAMES and GROUPS come from technicianRoster.ts — the one definition the ticket
   grid's assignee menus, the dashboard's group workload and this page all read. A
   roster that invented its own people would list colleagues who never appear on a
   ticket, which is exactly the kind of mock data that reads as fake.

   Everything else here is the employment detail a supervisor opens this page for:
   how to reach someone, who they report to, which shift they are on, whether they
   are available, and how much work they are already carrying. */
import { TECHNICIANS, CURRENT_USER } from './technicianRoster';

export type TeamRole = 'Administrator' | 'Supervisor' | 'Technician';
export type TeamStatus = 'Active' | 'Inactive' | 'Blocked';

/** A booked absence — what the Mark Leave panel writes and the roster reads back. */
export interface LeaveRecord {
  type: string;
  /** 'YYYY-MM-DD', the format the shared DateField speaks. */
  start: string;
  end: string;
  remarks: string;
  /** Who picks up their work while they are out. Empty when delegation is off, which is
      what every other delegation field keys off. */
  delegateTo: string;
  /** Narrows the Assignee list to one group — a convenience, not a second answer. */
  delegateGroup?: string;
  /** The delegation's own window. It defaults to the leave's, but a handover often starts
      a day early or runs a day late, so it is recorded separately. */
  delegateStart?: string;
  delegateEnd?: string;
  /** Which record types move across — empty/all six means everything. */
  delegatedWork?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Empty where the directory has no number on file — the grid prints a dash. */
  contact: string;
  role: TeamRole;
  designation: string;
  group: string;
  department: string;
  location: string;
  manager: string;
  status: TeamStatus;
  loginName: string;
  shift: string;
  authSource: string;
  /** Requests currently assigned to them and not yet closed. */
  openRequests: number;
  lastLogin: Date;
  /** Which assets and CIs they are allowed to work on (the product's scoping field). */
  assetScope: string;
  outOfOffice: boolean;
  /** Set while they are away — see the Mark Leave panel. */
  leave?: LeaveRecord;
}

/* Who runs each group, and who THEY report to. */
const LEAD_OF: Record<string, string> = {
  'IT Support Group': CURRENT_USER,
  'Network Operations': 'Shreyak Dalal',
  'Hardware Support Team': 'Novak Potai',
  'Software Support Team': 'Pratik Patial',
};
const HEAD_OF_IT = 'Vikram Sethi';

const LEAD_TITLE: Record<string, string> = {
  'IT Support Group': 'Service Desk Supervisor',
  'Network Operations': 'Network Operations Lead',
  'Hardware Support Team': 'Hardware Support Lead',
  'Software Support Team': 'Application Support Lead',
};

/* A group's work decides which department it sits in and what its people are called. */
const DEPT_OF: Record<string, string> = {
  'IT Support Group': 'Information Technology',
  'Network Operations': 'Infrastructure & Networks',
  'Hardware Support Team': 'IT Asset Management',
  'Software Support Team': 'Application Support',
};
const TITLES_OF: Record<string, string[]> = {
  'IT Support Group': ['Senior Service Desk Analyst', 'Service Desk Analyst', 'IT Support Engineer'],
  'Network Operations': ['Senior Network Engineer', 'Network Engineer', 'NOC Analyst'],
  'Hardware Support Team': ['Field Support Engineer', 'Desktop Support Engineer', 'IT Asset Coordinator'],
  'Software Support Team': ['Application Support Engineer', 'Software Support Analyst', 'Integration Engineer'],
};

/* Six sites, two of them outside India — the desk follows the offices it supports, and
   a roster that is all one timezone would make the Shift column meaningless. */
const SITES = ['Ahmedabad HQ', 'Pune Office', 'Mumbai Office', 'Bengaluru DC', 'Dubai Office', 'Singapore Office'];
const SHIFTS = ['General Shift', 'Morning Shift', 'Evening Shift', 'Night Shift'];
const AUTH_SOURCES = ['Active Directory', 'Active Directory', 'Active Directory', 'Local', 'SAML SSO'];

/* The handful of people whose record differs from the pattern — named explicitly rather
   than hashed, so the demo always tells the same story. */
const ADMINS = new Set(['Amou Desai']);
/* The three who are away, with the leave they actually booked — so opening the Mark Leave
   panel on one of them shows a filled-in record rather than an empty form. Dates are
   relative to today for the same reason last logins are: a hard-coded week would be in
   the past by the time anyone demoed it. */
const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const AWAY_LEAVE: Record<string, LeaveRecord> = {
  'Priya Raut': {
    type: 'Planned Leave',
    start: iso(-2), end: iso(5),
    remarks: 'Family function — reachable on phone for P1 escalations only.',
    delegateTo: 'Sneha Kulkarni',
    delegateGroup: 'IT Support Group',
    delegateStart: iso(-2), delegateEnd: iso(5),
    delegatedWork: ['Requests', 'Tasks'],
  },
  'Chen Wei': {
    type: 'Sick Leave',
    start: iso(-1), end: iso(2),
    remarks: 'Signed off by the company doctor.',
    delegateTo: 'Miriam Haddad',
    delegateGroup: 'Hardware Support Team',
    delegateStart: iso(-1), delegateEnd: iso(3),
    delegatedWork: ['Requests', 'Problems', 'Changes', 'Releases', 'Tasks', 'Approvals'],
  },
  'Grace Wanjiru': {
    type: 'Work From Home',
    start: iso(0), end: iso(3),
    remarks: 'Working the Nairobi hours from home this week.',
    delegateTo: '',
  },
};
const AWAY = new Set(Object.keys(AWAY_LEAVE));
const INACTIVE = new Set(['Tomas Vega', 'Owen Bradley']);
const BLOCKED = new Set(['Victor Almeida']);
const NO_CONTACT = new Set(['Aditi Nair', 'Leon Fischer', 'Jasper Coetzee', 'Rhea Kapoor']);

const emailOf = (name: string) =>
  `${name.split(' ').filter(Boolean).join('.').toLowerCase()}@motadata.com`;

const phoneOf = (i: number, site: string) => {
  const a = 10000 + ((i + 1) * 7919) % 89999;
  const b = 10000 + ((i + 1) * 104729) % 89999;
  if (site === 'Dubai Office') return `+971 5${a % 10} ${String(b).slice(0, 3)} ${String(a).slice(0, 4)}`;
  if (site === 'Singapore Office') return `+65 8${String(a).slice(0, 3)} ${String(b).slice(0, 4)}`;
  return `+91 ${98000 + ((i + 1) * 137) % 1999} ${b}`;
};

/* How much each person is carrying. A fixed sequence rather than a hash: the point of the
   column is that the list has idle technicians AND overloaded ones to find. */
const OPEN_WORK = [4, 0, 7, 2, 11, 5, 1, 9, 3, 0, 6, 8, 2, 12, 4, 1, 0, 5, 7, 3, 10, 2, 6, 0, 8, 4, 1, 9, 3, 5, 0, 7, 2];

/* Logins are measured back from NOW, not from a date written into the file: anchoring them
   would quietly break the "Last 7 days" filter a month after this was built. Someone whose
   account is switched off has not signed in for months, which is the point of the column. */
const MINUTE = 60_000;
const lastLoginOf = (i: number, status: TeamStatus) => {
  const back = status === 'Active' ? [12, 95, 40, 7, 310, 1_450, 60, 220, 2_880, 25][i % 10] : 70_000 + i * 900;
  return new Date(Date.now() - back * MINUTE);
};

export const TEAM_MEMBERS: TeamMember[] = TECHNICIANS.map((t, i) => {
  const isLead = LEAD_OF[t.group] === t.name;
  const role: TeamRole = ADMINS.has(t.name) ? 'Administrator' : isLead ? 'Supervisor' : 'Technician';
  const status: TeamStatus = BLOCKED.has(t.name) ? 'Blocked' : INACTIVE.has(t.name) ? 'Inactive' : 'Active';
  const site = SITES[i % SITES.length];
  const openRequests = status === 'Active' ? OPEN_WORK[i % OPEN_WORK.length] : 0;
  return {
    id: `USR-${1001 + i}`,
    name: t.name,
    initials: t.initials,
    email: emailOf(t.name),
    contact: NO_CONTACT.has(t.name) ? '' : phoneOf(i, site),
    role,
    designation: ADMINS.has(t.name)
      ? 'IT Service Desk Administrator'
      : isLead
        ? LEAD_TITLE[t.group]
        : TITLES_OF[t.group][i % 3],
    group: t.group,
    department: DEPT_OF[t.group],
    location: site,
    /* A lead reports to the head of IT; everyone else reports to their own lead. */
    manager: isLead ? HEAD_OF_IT : LEAD_OF[t.group],
    status,
    loginName: emailOf(t.name).split('@')[0],
    shift: isLead ? SHIFTS[0] : SHIFTS[i % SHIFTS.length],
    authSource: AUTH_SOURCES[i % AUTH_SOURCES.length],
    openRequests,
    lastLogin: lastLoginOf(i, status),
    /* Scope follows seniority: the administrator sees everything, a lead sees their
       group's estate, and a technician sees their site or just what is assigned to them. */
    assetScope: role === 'Administrator'
      ? 'All Assets and CIs'
      : isLead
        ? 'Group Assets and CIs'
        : ['Assigned Assets Only', 'Location Assets and CIs', 'Assigned Assets Only', 'Group Assets and CIs'][i % 4],
    outOfOffice: AWAY.has(t.name),
    leave: AWAY_LEAVE[t.name],
  };
});

/** How busy someone is, as a word — what the KPI strip and the saved views cut on. */
export const workloadBandOf = (open: number) =>
  open === 0 ? 'Idle' : open <= 3 ? 'Light' : open <= 7 ? 'Busy' : 'Overloaded';

/** Whether work can be given to them right now. One field answers the whole question:
    a switched-off account is as unavailable as someone on leave. */
export const availabilityOf = (m: Pick<TeamMember, 'status' | 'outOfOffice'>) =>
  m.status !== 'Active' ? 'Unavailable' : m.outOfOffice ? 'On Leave' : 'Available';
