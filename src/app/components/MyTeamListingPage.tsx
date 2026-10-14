/* ── My Team listing ─────────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the service desk's own roster:
   moduleCols="team" shows Name · Email · Contact No. · Action, with the module's filter
   catalogue, quick filters and saved views behind them. Everything else a supervisor
   might want on screen — role, group, shift, reporting manager, workload, last login —
   is one Manage-columns click away rather than crowding the default four.

   No navigation rail and no Kanban: people are found by WHO they are (group, role,
   availability), which the quick filters and the views rail already cover, and a roster
   has no work-in-flight axis to lane a board by.

   A row has no detail page of its own, so clicking one opens the product's existing
   profile popup with this person's real roster record rather than a derived stand-in. */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { RequesterProfilePanel } from './upstream/RequesterProfilePanel';
import { MarkLeavePanel, fmtLeaveDate, leaveSummary } from './MarkLeavePanel';
import { TEAM_QUICK_FILTERS } from './TicketFilterBar';
import { TEAM_FILTER_ATTRS } from './teamFilterAttrs';
import { TEAM_MEMBERS, availabilityOf, workloadBandOf, type LeaveRecord, type TeamMember } from './teamRoster';
import { CURRENT_USER } from './technicianRoster';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* One member → one grid row. The `x_` fields ARE the columns (the grid prints any x_ key
   it has no special cell for), and the three derived ones — availability, workload band,
   "is this me" — are computed once here so the cards, the saved views and the cells can
   never disagree about who is available or who is overloaded. */
const rowOf = (m: TeamMember): Ticket =>
  ({
    id: m.id,
    /* The grid's free-text search reads subject / requester / assignedTo.name, so the name
       sits on all three: typing half a colleague's name should find them whichever field
       the search happens to look at. */
    subject: m.name,
    requester: m.name,
    assignedTo: { name: m.name, initials: m.initials },
    dueBy: m.lastLogin,
    createdBy: m.lastLogin,
    status: m.status as Ticket['status'],
    /* A person has no priority. Nothing surfaces it — the module's Manage-columns list is
       its own catalogue — but the row shape requires one. */
    priority: 'Medium' as Ticket['priority'],
    x_name: m.name,
    x_email: m.email,
    x_contact: m.contact,
    x_role: m.role,
    x_designation: m.designation,
    x_group: m.group,
    x_department: m.department,
    x_location: m.location,
    x_manager: m.manager,
    x_loginName: m.loginName,
    x_shift: m.shift,
    x_authSource: m.authSource,
    x_assetScope: m.assetScope,
    x_openRequests: m.openRequests,
    /* A real Date, not a formatted string: the column sorts chronologically and the
       "Last 7 days" filter reads the true value. */
    x_lastLogin: m.lastLogin,
    x_availability: availabilityOf(m),
    x_workload: workloadBandOf(m.openRequests),
    x_outOfOffice: m.outOfOffice,
    /* What the Name cell's amber chip says on hover — the booked leave in one line, so
       "On Leave" answers "until when, and who is covering?" without opening
       anything. */
    x_leaveNote: m.leave
      ? `${leaveSummary(m.leave)}${m.leave.delegateTo ? ` · Delegated to ${m.leave.delegateTo}` : ''}`
      : '',
    x_isYou: m.name === CURRENT_USER,
  }) as unknown as Ticket;

/* The KPI strip answers the questions a supervisor opens a roster with: how big is the
   team, who can take work right now, who is away, who is drowning, and who has nothing
   on. Each card applies the filter it describes, so the number and the list can never
   disagree. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const val = (t: Ticket, k: string) => String((t as any)[k] ?? '');
  const active = rows.filter((t) => (t.status as string) === 'Active');
  const available = rows.filter((t) => val(t, 'x_availability') === 'Available');
  const away = rows.filter((t) => val(t, 'x_availability') === 'On Leave');
  const overloaded = rows.filter((t) => val(t, 'x_workload') === 'Overloaded');
  const idle = active.filter((t) => val(t, 'x_workload') === 'Idle');
  return [
    { label: 'Team members', value: rows.length, sub: `${active.length} active accounts` },
    {
      label: 'Available now',
      value: available.length,
      sub: `of ${active.length} active`,
      filter: [{ field: 'x_availability', condition: 'is', values: ['Available'] }],
    },
    {
      label: 'On leave',
      value: away.length,
      sub: 'away right now',
      valueColor: away.length ? '#B45309' : undefined,
      filter: [{ field: 'x_availability', condition: 'is', values: ['On Leave'] }],
    },
    {
      label: 'Overloaded',
      value: overloaded.length,
      sub: 'carrying 8 or more requests',
      valueColor: overloaded.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_workload', condition: 'is', values: ['Overloaded'] }],
    },
    {
      label: 'Idle',
      value: idle.length,
      sub: 'nothing open — free capacity',
      filter: [
        { field: 'x_workload', condition: 'is', values: ['Idle'] },
        { field: 'status', condition: 'is', values: ['Active'] },
      ],
    },
  ];
};

export function MyTeamListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* The roster is held here so the Action column's out-of-office toggle actually STICKS —
     it changes the Name cell's chip, the Availability column, the saved views and the KPI
     strip in one move, because all of them read the same derived row. */
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const rows = useMemo(() => members.map(rowOf), [members]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const [profile, setProfile] = useState<TeamMember | null>(null);
  /* Whose leave the Mark Leave panel is open on. */
  const [leaveFor, setLeaveFor] = useState<TeamMember | null>(null);

  /* Who this person's work can be handed to: the rest of the team, minus anyone who is
     already away or whose account is switched off — delegating to them would move the
     queue nowhere. */
  const delegatesFor = (m: TeamMember) =>
    members.filter((x) => x.id !== m.id && x.status === 'Active' && !x.outOfOffice);

  const saveLeave = (m: TeamMember, leave: LeaveRecord) => {
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, outOfOffice: true, leave } : x)));
    setLeaveFor(null);
    toast.success(`Leave saved for ${m.name}`, {
      description: `${leave.type} · ${fmtLeaveDate(leave.start)} – ${fmtLeaveDate(leave.end)}${
        leave.delegateTo ? ` · work delegated to ${leave.delegateTo}` : ''
      }`,
    });
  };

  const clearLeave = (m: TeamMember) => {
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, outOfOffice: false, leave: undefined } : x)));
    setLeaveFor(null);
    toast.success(`${m.name} is back`, { description: 'They can be assigned work again.' });
  };

  return (
    <>
      <AssetRegisterPage
        activePage="my-team"
        /* Nothing in the drawer stack opens a person — `onOpenRow` takes the click instead,
           so this is only here to satisfy the register's contract. */
        stackModule="my-team"
        viewsStore="team"
        noun="team member"
        moduleCols="team"
        defaultViewName="My Team"
        footerNoun="members"
        rows={rows}
        recordOf={(id) => byId.get(id)}
        filterAttrs={TEAM_FILTER_ATTRS}
        /* The three one-click cuts (group · availability · role) are off per request — the
           Filters builder and the views rail already reach all of them. The catalogue stays
           wired so flipping `showQuickFilters` back on restores the icons. */
        quickFilters={TEAM_QUICK_FILTERS}
        showQuickFilters={false}
        /* Two layouts: the strip for the shape of the team, the plain list to work it.
           No board — a roster has no work-in-flight axis — and no dashboard.
           ⚠️ Both are currently unreachable: the layout picker lives in the gear, and the
           gear is hidden (see `hideTools`). Left in place so restoring the gear restores
           the KPI strip with it. */
        layouts={['list-kpi', 'list']}
        buildCards={buildCards}
        /* The columns the grid does not show by default are still searchable: looking up
           a colleague by their group, site or desk phone should find them. */
        searchFields={['x_email', 'x_contact', 'x_role', 'x_designation', 'x_group', 'x_department', 'x_location', 'x_manager', 'x_loginName']}
        primaryAction={{ label: 'Add Member' }}
        primaryActionInTitle
        /* No row selection: nothing on this page acts on a SET of people — each action is
           about one colleague — so a column of checkboxes would promise a bulk action that
           does not exist. Dropping it also pulls NAME back under the search icon. */
        hideSelection
        /* No saved-views rail either, per request — so the panel toggle left of the title
           goes with it. The title still reads "My Team" because it reads off the applied
           view, and `TEAM_VIEWS` stays defined for whenever the rail comes back. */
        showViews={false}
        /* A roster is read, not exported, polled or re-laid-out: the tool rail keeps only
           Sort. (This takes the gear with it, and the layout picker + Manage columns with
           the gear.) */
        hideTools={['export', 'refresh', 'settings']}
        /* ...and the per-column heading menu goes too — Filter is on the toolbar, and
           Hide / Insert / Change Column all edited a column set that is now fixed. */
        hideColumnMenu
        /* People are added and removed in Admin, not imported from this page, so the ⋮
           has nothing to hold and goes with its items. */
        moreActions={[]}
        onRowAction={(row, action) => {
          if (action === 'out-of-office') return setLeaveFor(byId.get(row.id) ?? null);
          if (action === 'edit') {
            toast(`Edit ${row.subject}`, { description: 'Coming soon' });
          }
        }}
        onOpenRow={(row) => setProfile(byId.get(row.id) ?? null)}
        onNavigate={onNavigate}
      />
      {/* The product's own profile popup, fed this person's REAL record — same panel a
          requester's name opens from a ticket, so a profile looks the same wherever it is
          reached from. */}
      <RequesterProfilePanel
        isOpen={!!profile}
        onClose={() => setProfile(null)}
        requesterName={profile?.name}
        role={profile?.role}
        email={profile?.email}
        /* Staff, not requesters — the same blue the roster's own avatars wear. */
        avatarColor="#3D8BD0"
        fields={
          profile
            ? [
                ['Name', profile.name],
                ['Email', profile.email],
                ['Logon Name', profile.loginName],
                ['Role', profile.role],
                ['Designation', profile.designation],
                ['Technician Group', profile.group],
                ['Department', profile.department],
                ['Reporting Manager', profile.manager],
                ['Location', profile.location],
                ['Shift', profile.shift],
                ['Contact No.', profile.contact || '---'],
                ['Authentication Source', profile.authSource],
                ['Account Status', profile.status],
                ['Availability', availabilityOf(profile)],
                ['Open Requests', String(profile.openRequests)],
                ['Company Name', 'Motadata'],
              ]
            : undefined
        }
      />
      {/* The roster's calendar action: book someone's time away, and hand their queue over
          while they are out. Opens on the saved record when they are already on leave. */}
      {leaveFor && (
        <MarkLeavePanel
          member={leaveFor}
          colleagues={delegatesFor(leaveFor)}
          onClose={() => setLeaveFor(null)}
          onSave={(leave) => saveLeave(leaveFor, leave)}
          onClear={leaveFor.leave ? () => clearLeave(leaveFor) : undefined}
        />
      )}
    </>
  );
}
