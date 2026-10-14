/* The service-desk roster — who the technicians are and which group each belongs to.
   Kept in its own module (like requestDescriptions.ts) so the grid, the filter bar and the
   dashboard all read ONE definition: a technician's group is a property of the person, not
   of the ticket, which is what makes "group workload → its technicians" coherent.

   Only the first seven names carry tickets in the mock data; the rest are the wider team
   with no open work right now. Real desks look exactly like this, and it keeps the
   dashboard's roster views (search, paging, idle capacity) honest at a realistic size. */

export const TECH_GROUPS = ['IT Support Group', 'Network Operations', 'Hardware Support Team', 'Software Support Team'];

export interface Technician {
  name: string;
  initials: string;
  group: string;
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const roster = (group: string, names: string[]): Technician[] =>
  names.map((name) => ({ name, initials: initialsOf(name), group }));

export const TECHNICIANS: Technician[] = [
  ...roster('IT Support Group', [
    // Carries tickets in the mock data
    'Amou Desai',
    'Keetion Dale',
    'Sarah Johnson',
    // Wider team
    'Priya Raut',
    'Daniel Okafor',
    'Sneha Kulkarni',
    'Marcus Bell',
    'Aditi Nair',
    'Tomas Vega',
  ]),
  ...roster('Network Operations', [
    'Shreyak Dalal',
    'Kaison Potai',
    'Ivan Petrov',
    'Fatima Sheikh',
    'Harish Menon',
    'Grace Wanjiru',
    'Leon Fischer',
    'Ananya Bose',
  ]),
  ...roster('Hardware Support Team', [
    'Novak Potai',
    'Rahul Shukla',
    'Chen Wei',
    'Miriam Haddad',
    'Jasper Coetzee',
    'Nikita Sharma',
    'Owen Bradley',
    'Ritu Deshpande',
  ]),
  ...roster('Software Support Team', [
    'Pratik Patial',
    'Elena Sorokina',
    'Kwame Mensah',
    'Rhea Kapoor',
    'Victor Almeida',
    'Yuki Tanaka',
    'Sofia Marino',
    'Arjun Vaidya',
  ]),
];

const GROUP_BY_NAME = new Map(TECHNICIANS.map((t) => [t.name, t.group]));

/** The group a technician belongs to; unknown names fall back so no chart can break. */
export const groupOfTechnician = (name: string) => GROUP_BY_NAME.get(name) ?? TECH_GROUPS[0];

/* Who is signed in. The saved-view owner and the Tasks module's "mine" view already named
   her; this is now the ONE definition they and the dashboard's My view all read, so the
   product can never disagree with itself about who you are. She carries requests in the mock
   data (see the roster above and the assignee pool) — a signed-in user with an empty queue
   would leave every personal card blank. */
export const CURRENT_USER = 'Sarah Johnson';
export const CURRENT_USER_INITIALS = 'SJ';
