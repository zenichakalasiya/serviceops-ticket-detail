/* The Software Assets listing's filter catalogue — the product's own software-asset
   attributes, in the product's own order. It feeds BOTH the filter builder and the
   Manage-columns list (minus whatever the grid already shows), exactly like the
   hardware catalogue in assetFilterAttrs.ts.

   Keys point at a REAL row field wherever the mock carries one (id / subject / status /
   x_version / x_softwareType / x_softwareCategory / x_impact / managedByGroup /
   assignedTo / createdBy), so those filters cut on genuine data. The rest are attributes
   the product collects that this mock does not store; `TicketFilterBar` gives them a
   stable per-record stand-in so a select or date filter still narrows the list. */
import { AlignLeft, Barcode, Boxes, Building2, CalendarDays, CircleDot, Flag, Hash, Layers, Package, Monitor, ShieldCheck, Tag, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

/* The product's Software Type classification TREE. It lives here — a leaf module that
   imports nothing but icons and a type — because both the grid's cell dropdown and this
   filter catalogue need it; putting it in the grid instead would make the grid and this
   file import each other and land one of them in a temporal dead zone at startup.
   Parents are pickable in their own right; "Software" is the root and only groups. */
export const SOFTWARE_TYPE_TREE: { label: string; depth?: number; heading?: boolean }[] = [
  { label: 'Software', heading: true },
  { label: 'OS' },
  { label: 'Linux', depth: 1 },
  { label: 'MacOS', depth: 1 },
  { label: 'Microsoft', depth: 1 },
  { label: 'Web Server' },
  { label: 'Apache', depth: 1 },
  { label: 'IIS', depth: 1 },
  { label: 'Application' },
  { label: 'Mobile Application' },
  { label: 'Database' },
  { label: 'MySQL', depth: 1 },
  { label: 'SQLServer', depth: 1 },
];

const o = (labels: string[]) => labels.map((label) => ({ label }));
const TECHS = ['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan', 'Neha Raje'];

export const SOFTWARE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'company', label: 'Company', icon: Building2, type: 'select', options: o(['Motadata', 'Motadata US', 'Motadata EMEA', 'Subsidiary — Logistics']) },
  { key: 'x_version', label: 'Version', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  {
    key: 'status',
    label: 'Status',
    icon: CircleDot,
    type: 'select',
    /* Mirrors the grid's software status palette (MODULE_STATUS_OPTS.software) — the
       filter must never offer a state the Status cell cannot be set to. */
    options: [
      { label: 'In Stock', color: '#3D8BD0' },
      { label: 'In Use', color: '#22C55E' },
      { label: 'Missing', color: '#EF4444' },
      { label: 'Retired', color: '#4B5563' },
      { label: 'In Repair', color: '#F97316' },
      { label: 'Disposed', color: '#374151' },
      { label: 'Expired', color: '#EAB308' },
      { label: 'Decommission', color: '#94A3B8' },
      { label: 'Allocated', color: '#A3B2C2' },
    ],
  },
  { key: 'product', label: 'Product', icon: Package, type: 'select', options: o(['Microsoft Edge', 'Google Chrome', 'Mozilla Firefox', 'Microsoft 365 Apps', 'Microsoft Teams', 'Microsoft OneDrive', 'FortiClient VPN', 'AnyDesk', 'Zoom']) },
  { key: 'vendor', label: 'Vendor', icon: Building2, type: 'select', options: o(['Microsoft Corporation', 'Google LLC', 'Mozilla Foundation', 'Fortinet', 'Zoom Video Communications', 'Adobe Inc.', 'Oracle Corporation', 'Atlassian']) },
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastScanBy', label: 'Last Barcode / QR Code Scan By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastScanDate', label: 'Last Barcode / QR Code Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Boxes, type: 'select', options: o(['Datacenter Team', 'End User Computing', 'IT Operations', 'Network Team', 'Service Desk', 'Unassigned']) },
  { key: 'assetGroup', label: 'Asset Group', icon: Boxes, type: 'select', options: o(['Licensed Software', 'Standard Software', 'Freeware', 'Restricted Software', 'Business Critical']) },
  { key: 'x_impact', label: 'Impact', icon: Flag, type: 'select', options: o(['On Users', 'On Department', 'On Organization', 'Low']) },
  { key: 'businessServices', label: 'Business Services', icon: Layers, type: 'select', options: o(['Email & Collaboration', 'ERP', 'CRM', 'Payroll', 'Network Services', 'Customer Portal']) },
  { key: 'category', label: 'Category', icon: Layers, type: 'select', options: o(['Application', 'Operating System', 'Suite', 'Driver', 'Utility']) },
  { key: 'x_softwareCategory', label: 'Software Category', icon: Layers, type: 'select', options: o(['Web Browser', 'Communication', 'Productivity', 'Security', 'Database', 'Remote Access', 'Developer Tools', 'Media', 'Runtime', 'Utilities']) },
  { key: 'installationNotification', label: 'Installation Notification', icon: ShieldCheck, type: 'select', options: o(['Enabled', 'Disabled']) },
  { key: 'origin', label: 'Origin', icon: Boxes, type: 'select', options: o(['Agent Scan', 'Purchased', 'Manually Added', 'Imported']) },
  { key: 'tags', label: 'Tags', icon: Tag, type: 'select', options: o(['production', 'critical', 'restricted', 'freeware', 'byod']) },
  { key: 'barcode', label: 'Barcode', icon: Barcode, type: 'text' },
  { key: 'assetType', label: 'Asset Type', icon: Monitor, type: 'select', options: o(['Application', 'Operating System', 'Cloud Service']) },
  { key: 'department', label: 'Department', icon: Building2, type: 'select', options: o(['IT', 'Finance', 'Human Resources', 'Sales', 'Marketing', 'Engineering', 'Operations']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'acquisitionDate', label: 'Acquisition Date', icon: CalendarDays, type: 'date' },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  /* The product's Software Type tree, flattened in tree order — parents first, their
     children after. Imported from the grid so the filter and the Status-style cell
     dropdown can never offer different nodes. */
  { key: 'x_softwareType', label: 'Software Type', icon: Layers, type: 'select', options: o(SOFTWARE_TYPE_TREE.filter((n) => !n.heading).map((n) => n.label)) },
  /* End-of-service-life tracking: the status, then the four dates it is derived from. */
  { key: 'eoslStatus', label: 'EOSL Status', icon: ShieldCheck, type: 'select', options: [
    { label: 'Supported', color: '#22c55e' },
    { label: 'Approaching End of Life', color: '#f59e0b' },
    { label: 'End of Life', color: '#ef4444' },
    { label: 'Extended Support', color: '#3D8BD0' },
    { label: 'Unsupported', color: '#94a3b8' },
  ] },
  { key: 'releaseDate', label: 'Release Date', icon: CalendarDays, type: 'date' },
  { key: 'endOfActiveSupport', label: 'End Of Active Support', icon: CalendarDays, type: 'date' },
  { key: 'endOfLife', label: 'End Of Life', icon: CalendarDays, type: 'date' },
  { key: 'endOfExtendedSupport', label: 'End Of Extended Support', icon: CalendarDays, type: 'date' },
  { key: 'counter', label: 'Counter', icon: Boxes, type: 'select', options: o(['0', '1 - 10', '11 - 50', '51 - 200', '200+']) },
  { key: 'asset', label: 'Asset', icon: Monitor, type: 'text' },
];
