/* The Contracts listing's filter catalogue — the eighteen attributes the product offers
   on a contract, in the product's own order, feeding BOTH the filter builder and the
   Manage-columns list (minus whatever the grid already shows), like the other register
   catalogues.

   A contract is an agreement, not a machine: what it has is a counterparty, a signature
   state, and the three dates that decide whether it is in force and when it must be
   renewed. Keys point at REAL row fields wherever the mock carries one (id / subject /
   status / x_vendor / x_contractType / x_contractNumber / startOn / endOn); the rest fall
   back to the shared per-record stand-in so a filter narrows the list instead of emptying
   it. Where the grid's own `extraValue` already derives a column for a key (Department,
   Digital Signature Status) the options below are that column's exact value set, so the
   filter and the column can never disagree; where it would derive something meaningless
   for a contract ("Last Updated By" resolves to the row's assignee, and a contract has
   none) the attribute takes its own key and the stand-in instead. */
import { AlignLeft, Building2, CalendarDays, CircleDot, FileSignature, FileText, Hash, Paperclip, RefreshCw, Tag, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';
import { CONTRACT_TYPE_OPTIONS } from './upstream/AssetFields';
import { DEPARTMENTS } from './orgDepartments';

const o = (labels: string[]) => labels.map((label) => ({ label }));
/* The contract managers in this mock — the same roster the other registers name. */
const TECHS = ['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan', 'Neha Raje'];
/* The vendor strings EXACTLY as the rows carry them (`VEN-12: Hitachi Vantara`) — the
   column prints the same string, so "Vendor is …" matches on equality. */
const VENDORS = [
  'VEN-12: Hitachi Vantara', 'VEN-15: Microsoft', 'VEN-22: Hewlett Packard', 'VEN-25: HP Inc.',
  'VEN-44: Lenovo', 'VEN-49: Motadata', 'VEN-53: Schneider Electric', 'VEN-56: Dell Technologies',
  'VEN-61: Cisco Systems', 'VEN-61: Imperva',
];

export const CONTRACT_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  /* The grid derives this column from the row id; these are its three values. */
  { key: 'digitalSignature', label: 'Digital Signature Status', icon: FileSignature, type: 'select', options: o(['Signed', 'Pending', 'Not Required']) },
  { key: 'x_vendor', label: 'Vendor', icon: Building2, type: 'select', options: o(VENDORS) },
  { key: 'contractCreatedBy', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'contractUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'contractTags', label: 'Tags', icon: Tag, type: 'select', options: o(['renewal', 'auto-renew', 'critical', 'compliance', 'finance-reviewed', 'vendor-managed']) },
  { key: 'department', label: 'Department', icon: Building2, type: 'select', options: o(DEPARTMENTS) },
  { key: 'contractUpdatedOn', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'contractSignedOn', label: 'Last Signed Date', icon: CalendarDays, type: 'date' },
  /* The module's own three states, colored the way the Contract detail page colors them. */
  { key: 'status', label: 'Contract Status', icon: CircleDot, type: 'select', options: [
    { label: 'Active', color: '#22C55E' },
    { label: 'Not Started', color: '#F59E0B' },
    { label: 'Expired', color: '#DC2626' },
  ] },
  { key: 'x_contractNumber', label: 'Contract Number', icon: Hash, type: 'text' },
  /* The detail page's own catalogue — one list, both surfaces, so the filter and the
     grid's editable cell can never offer a type the Contract Type field cannot be set to. */
  { key: 'x_contractType', label: 'Contract Type', icon: FileText, type: 'select', options: o(CONTRACT_TYPE_OPTIONS) },
  /* Keyed to the parsed DATES, not the dd/mm/yyyy strings the columns print — a date
     filter compares Dates, and the column and the filter dedupe on their shared label. */
  { key: 'startOn', label: 'Contract Start Date', icon: CalendarDays, type: 'date' },
  { key: 'endOn', label: 'Contract End Date', icon: CalendarDays, type: 'date' },
  { key: 'contractRenewalOn', label: 'Contract Renewal Date', icon: RefreshCw, type: 'date' },
  { key: 'contractOwner', label: 'Owner', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'contractAttachment', label: 'Attachment', icon: Paperclip, type: 'select', options: o(['Yes', 'No']) },
];
