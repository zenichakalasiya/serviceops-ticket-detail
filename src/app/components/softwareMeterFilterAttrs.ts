/* The Software Meter listing's filter catalogue — the attributes the product shows on a
   metered application, feeding BOTH the filter builder and the Manage-columns list (minus
   whatever the grid already shows), like every other register catalogue.

   Every key points at a REAL row field, so nothing here falls back to a stand-in. */
import { AlignLeft, AppWindow, Building2, CalendarDays, CircleDot, Hash, Layers, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';
import { SOFTWARE_TYPE_TREE } from './softwareFilterAttrs';

const o = (labels: string[]) => labels.map((label) => ({ label }));
const TECHS = ['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan', 'Neha Raje', 'Unassigned'];

export const METER_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_assetType', label: 'Asset Type', icon: AppWindow, type: 'select', options: o(['Application']) },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: [
    { label: 'In Use', color: '#22C55E' },
    { label: 'In Stock', color: '#3D8BD0' },
    { label: 'Retired', color: '#4B5563' },
  ] },
  { key: 'x_version', label: 'Version', icon: Layers, type: 'text' },
  /* The product's classification tree — the same catalogue the Software register's own
     Software Type column and filter read, so one list drives both pages. */
  { key: 'x_softwareType', label: 'Software Type', icon: AppWindow, type: 'select', options: o(SOFTWARE_TYPE_TREE.filter((n) => !n.heading).map((n) => n.label)) },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Building2, type: 'select', options: o(['Datacenter Team', 'End User Computing', 'IT Operations', 'Network Team', 'Service Desk']) },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
];
