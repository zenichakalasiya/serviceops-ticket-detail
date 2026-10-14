/* The Non-IT Assets listing's filter catalogue — the product's own non-IT attributes,
   in the product's own order. It feeds BOTH the filter builder and the Manage-columns
   list (minus whatever the grid already shows), exactly like the hardware and software
   catalogues.

   A chair, a projector or a pool car has no agent, OS or IP address, so none of the
   hardware's computer attributes appear here — this is the physical asset story:
   condition, movement, warranty, ownership and the label on the side of it. Keys point
   at a REAL row field wherever the mock carries one (id / subject / x_assetType /
   status / usedByLabel / x_impact / managedByGroup / assignedTo / createdBy); the rest
   get the shared per-record stand-in so a filter narrows the list instead of emptying it. */
import { AlignLeft, Barcode, Boxes, Building2, CalendarDays, CircleDot, Flag, Hash, Layers, MapPin, Monitor, Package, ShieldCheck, Tag, UserRound, Wrench } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));
const TECHS = ['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan', 'Neha Raje'];
const APPROVAL_STATES = ['Pending', 'Approved', 'Rejected', 'Not Required'];

export const NONIT_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'company', label: 'Company', icon: Building2, type: 'select', options: o(['Motadata', 'Motadata US', 'Motadata EMEA', 'Subsidiary — Logistics']) },
  { key: 'assetCondition', label: 'Asset Condition', icon: Wrench, type: 'select', options: o(['Good', 'Fair', 'Damaged', 'Under Repair', 'End of Life']) },
  { key: 'movementStatus', label: 'Movement Status', icon: Boxes, type: 'select', options: o(['In Place', 'In Transit', 'Returned', 'Awaiting Pickup']) },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'serialNo', label: 'Non-IT - Serial Number', icon: Hash, type: 'text' },
  { key: 'warrantyExpiration', label: 'Warranty Expiration Date', icon: CalendarDays, type: 'date' },
  { key: 'warrantyStart', label: 'Warranty Start Date', icon: CalendarDays, type: 'date' },
  { key: 'auditDate', label: 'Audit Date', icon: CalendarDays, type: 'date' },
  {
    key: 'status',
    label: 'Status',
    icon: CircleDot,
    /* Mirrors MODULE_STATUS_OPTS.nonit in the grid — the filter must never offer a
       state the Status cell cannot be set to. */
    type: 'select',
    options: [
      { label: 'In Use', color: '#22C55E' },
      { label: 'In Stock', color: '#3D8BD0' },
      { label: 'In Store', color: '#0EA5E9' },
      { label: 'Not Working', color: '#DC2626' },
    ],
  },
  { key: 'approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: o(APPROVAL_STATES) },
  { key: 'checkerApprovalStatus', label: 'Checker Approval Status', icon: ShieldCheck, type: 'select', options: o(APPROVAL_STATES) },
  { key: 'product', label: 'Product', icon: Package, type: 'select', options: o(['Office Chair', 'Conference Table', 'Pool Car', 'Projector', 'Air Conditioner', 'Fire Extinguisher', 'Printer', 'Coffee Machine', 'Water Dispenser']) },
  { key: 'vendor', label: 'Vendor', icon: Building2, type: 'select', options: o(['Featherlite Furniture', 'Godrej Interio', 'Herman Miller', 'Fleet Partners India', 'Croma Enterprise', 'Safety First Supplies']) },
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastScanBy', label: 'Last Barcode / QR Code Scan By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastScanDate', label: 'Last Barcode / QR Code Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'usedByLabel', label: 'Used By', icon: UserRound, type: 'text' },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Boxes, type: 'select', options: o(['Facilities', 'Admin', 'Fleet Management', 'Front Desk', 'IT Operations']) },
  { key: 'assetGroup', label: 'Asset Group', icon: Boxes, type: 'select', options: o(['Office Furniture', 'Fleet', 'Office Equipment', 'Safety & Compliance', 'Consumable Stock']) },
  { key: 'x_impact', label: 'Impact', icon: Flag, type: 'select', options: o(['On Users', 'On Department', 'On Organization', 'Low']) },
  { key: 'businessServices', label: 'Business Services', icon: Layers, type: 'select', options: o(['Workplace Services', 'Fleet Services', 'Facilities Management', 'Reception & Front Desk']) },
  { key: 'category', label: 'Category', icon: Layers, type: 'select', options: o(['Furniture', 'Equipment', 'Vehicle', 'Safety', 'Stationery']) },
  { key: 'origin', label: 'Origin', icon: Boxes, type: 'select', options: o(['Purchased', 'Leased', 'Donated', 'Manually Added']) },
  { key: 'tags', label: 'Tags', icon: Tag, type: 'select', options: o(['facilities', 'fleet', 'critical', 'shared', 'loaner']) },
  { key: 'barcode', label: 'Barcode', icon: Barcode, type: 'text' },
  /* The product's six non-IT types — the same list the grid's Asset Type cell offers. */
  { key: 'x_assetType', label: 'Asset Type', icon: Boxes, type: 'select', options: o(['Stationary', 'Document', 'Furniture', 'Air conditioner', 'Trash', 'Consumable']) },
  { key: 'department', label: 'Department', icon: Building2, type: 'select', options: o(['IT', 'Finance', 'Human Resources', 'Sales', 'Marketing', 'Engineering', 'Operations', 'Facilities']) },
  { key: 'location', label: 'Location', icon: MapPin, type: 'select', options: o(['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'assignmentDate', label: 'Assignment Date', icon: CalendarDays, type: 'date' },
  { key: 'acquisitionDate', label: 'Acquisition Date', icon: CalendarDays, type: 'date' },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  /* Counter reads as usage bands — nobody filters on an exact meter reading. */
  { key: 'counter', label: 'Counter', icon: Boxes, type: 'select', options: o(['0', '1 - 10', '11 - 50', '51 - 200', '200+']) },
  { key: 'asset', label: 'Asset', icon: Monitor, type: 'text' },
];
