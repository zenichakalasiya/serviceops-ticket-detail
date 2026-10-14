/* The CMDB listing's filter catalogue — the attributes the product records on a
   configuration item, feeding BOTH the filter builder and the Manage-columns list (minus
   whatever the grid already shows), like every other register catalogue.

   CI Type's options come from the CI-class tree the rail is built on, so the rail, the
   filter and the grid's CI Type column can never offer three different vocabularies. */
import { AlignLeft, Building2, CalendarDays, CircleDot, Database, Hash, HeartPulse, MapPin, Monitor, Network, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';
import { CI_CLASS_TREE, typesUnder } from './CmdbCategoryRail';

const o = (labels: string[]) => labels.map((label) => ({ label }));
const TECHS = ['Rohan Mehta', 'Tabrez Khan', 'Vikram Sethi', 'Imran Qureshi', 'Neha Raje', 'Farah Sheikh', 'Unassigned'];
/* Every ciType the tree knows about, parents included, in tree order. */
const CI_TYPES = [...new Set(CI_CLASS_TREE.flatMap(typesUnder))];

export const CMDB_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_ciType', label: 'CI Type', icon: Database, type: 'select', options: o(CI_TYPES) },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: [
    { label: 'Operational', color: '#22C55E' },
    { label: 'Non-Operational', color: '#DC2626' },
    { label: 'In Maintenance', color: '#F59E0B' },
    { label: 'Retired', color: '#94A3B8' },
  ] },
  { key: 'x_hostName', label: 'Host Name', icon: Monitor, type: 'text' },
  { key: 'x_ipAddress', label: 'IP Address', icon: Network, type: 'text' },
  { key: 'usedByLabel', label: 'Used By', icon: UserRound, type: 'text' },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Building2, type: 'select', options: o(['Datacenter Team', 'End User Computing', 'IT Operations', 'Network Team', 'Service Desk']) },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  /* The agent-health dot the Name column carries — a real filter, since "what has the
     agent stopped reporting?" is the first question anyone asks a CMDB. */
  { key: 'x_agentHealth', label: 'Agent Health', icon: HeartPulse, type: 'select', options: [
    { label: 'Healthy', color: '#22C55E' },
    { label: 'Warning', color: '#EAB308' },
    { label: 'No Agent', color: '#94A3B8' },
  ] },
  { key: 'x_environment', label: 'Environment', icon: Building2, type: 'select', options: o(['Production', 'Staging', 'Development', 'DR']) },
  { key: 'x_location', label: 'Location', icon: MapPin, type: 'select', options: o(['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
];
