/* The Hardware Asset listing's filter catalogue — the product's own asset attributes,
   in the product's own order, replacing the request attributes the shared bar defaults to.

   Keys point at a REAL row field wherever the mock carries one (id / subject / status /
   assetType / hostName / ipAddress / serialNo / usedByLabel / assignedTo /
   managedByGroup / x_vendor / x_location / createdBy), so those filters cut the grid on
   genuine data. Everything else is an attribute the product collects from the agent but
   this mock does not store; `TicketFilterBar` gives those a STABLE per-asset stand-in
   derived from the row id, so a select or date filter still narrows the list the same
   way every time instead of emptying it. */
import { AlignLeft, Barcode, Boxes, Building2, CalendarDays, CircleDot, Cpu, Flag, Hash, HardDrive, Layers, MapPin, Monitor, Network, Package, ShieldCheck, Tag, UserRound, Wrench } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

export const HARDWARE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'agentId', label: 'Agent ID', icon: Hash, type: 'text' },
  { key: 'agentLastSync', label: 'Agent Last Sync Date', icon: CalendarDays, type: 'date' },
  { key: 'activationStatus', label: 'Activation Status', icon: ShieldCheck, type: 'select', options: o(['Activated', 'Not Activated', 'Expired']) },
  { key: 'hostName', label: 'Host Name', icon: Monitor, type: 'text' },
  { key: 'uuid', label: 'UUID', icon: Hash, type: 'text' },
  { key: 'domainName', label: 'Domain Name', icon: Network, type: 'select', options: o(['corp.motadata.com', 'motadata.local', 'WORKGROUP']) },
  { key: 'ipAddress', label: 'IP Address', icon: Network, type: 'text' },
  { key: 'ipRange', label: 'IP Range', icon: Network, type: 'select', options: o(['10.20.18.x', '10.20.19.x', '10.20.21.x', '10.20.22.x', '10.20.23.x', '10.20.30.x', '10.20.40.x']) },
  { key: 'company', label: 'Company', icon: Building2, type: 'select', options: o(['Motadata', 'Motadata US', 'Motadata EMEA', 'Subsidiary — Logistics']) },
  { key: 'assetCondition', label: 'Asset Condition', icon: Wrench, type: 'select', options: o(['Good', 'Fair', 'Damaged', 'Under Repair', 'End of Life']) },
  { key: 'movementStatus', label: 'Movement Status', icon: Boxes, type: 'select', options: o(['In Place', 'In Transit', 'Returned', 'Awaiting Pickup']) },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'serialNo', label: 'Hardware - Serial Number', icon: Hash, type: 'text' },
  { key: 'osVersion', label: 'Computer Properties - OS Version', icon: Monitor, type: 'select', options: o(['22H2', '23H2', '24H2', '14.5 (Sonoma)', '22.04 LTS', '9.4']) },
  { key: 'lastRebootTime', label: 'Computer Properties - Last Reboot Time', icon: CalendarDays, type: 'date' },
  { key: 'osManufacturer', label: 'Computer Properties - OS Manufacturer', icon: Building2, type: 'select', options: o(['Microsoft Corporation', 'Apple Inc.', 'Canonical Ltd.', 'Red Hat, Inc.']) },
  { key: 'memorySize', label: 'Computer Properties - Memory Size', icon: HardDrive, type: 'select', options: o(['8 GB', '16 GB', '32 GB', '64 GB', '128 GB']) },
  { key: 'diskSize', label: 'Computer Properties - Disk Size', icon: HardDrive, type: 'select', options: o(['256 GB', '512 GB', '1 TB', '2 TB', '4 TB']) },
  { key: 'cpuSpeed', label: 'Computer Properties - CPU Speed', icon: Cpu, type: 'select', options: o(['2.4 GHz', '2.8 GHz', '3.2 GHz', '3.6 GHz', '4.0 GHz']) },
  { key: 'lastLoggedInUser', label: 'Computer Properties - Last Logged In User', icon: UserRound, type: 'text' },
  { key: 'cpuCoreCount', label: 'Computer Properties - CPU Core Count', icon: Cpu, type: 'select', options: o(['4', '8', '12', '16', '24', '32']) },
  { key: 'motherboardManufacturer', label: 'Motherboard - Manufacturer', icon: Building2, type: 'select', options: o(['Dell Inc.', 'Hewlett-Packard', 'Lenovo', 'Apple Inc.', 'Intel Corporation']) },
  { key: 'motherboardSerial', label: 'Motherboard - Serial Number', icon: Hash, type: 'text' },
  { key: 'motherboardVersion', label: 'Motherboard - Version', icon: Hash, type: 'select', options: o(['A00', 'A01', 'A02', 'Rev 1.1', 'Rev 2.0']) },
  { key: 'totalRamSize', label: 'RAM Properties - Total RAM Size', icon: HardDrive, type: 'select', options: o(['8 GB', '16 GB', '32 GB', '64 GB', '128 GB']) },
  { key: 'x_vendor', label: 'Computer System - Manufacturer', icon: Building2, type: 'select', options: o(['Apple', 'Dell Technologies', 'HPE', 'HP Inc.', 'Lenovo', 'Cisco Systems', 'Fortinet', 'Other OEMs']) },
  { key: 'modelName', label: 'Computer System - Model Name', icon: Package, type: 'select', options: o(['Latitude 7440', 'OptiPlex 7010', 'ThinkPad X1 Carbon', 'MacBook Pro 16"', 'PowerEdge R750', 'ProLiant DL380']) },
  { key: 'systemFamily', label: 'Computer System - System Family', icon: Layers, type: 'select', options: o(['Laptop', 'Desktop', 'Server', 'Network Device', 'Printer']) },
  { key: 'warrantyExpiration', label: 'Warranty Expiration Date', icon: CalendarDays, type: 'date' },
  { key: 'warrantyLastSync', label: 'Warranty Last Sync Date', icon: CalendarDays, type: 'date' },
  { key: 'warrantyStart', label: 'Warranty Start Date', icon: CalendarDays, type: 'date' },
  { key: 'manufacturer', label: 'Manufacturer', icon: Building2, type: 'select', options: o(['Apple', 'Dell Technologies', 'HPE', 'HP Inc.', 'Lenovo', 'Cisco Systems', 'Fortinet']) },
  { key: 'auditDate', label: 'Audit Date', icon: CalendarDays, type: 'date' },
  { key: 'architecture', label: 'Architecture', icon: Cpu, type: 'select', options: o(['x64', 'x86', 'ARM64']) },
  { key: 'softwareName', label: 'Software - Software Name', icon: Package, type: 'select', options: o(['Microsoft 365 Apps', 'Google Chrome', 'AnyDesk', 'Zoom', 'Adobe Acrobat', 'CrowdStrike Falcon', 'Slack']) },
  { key: 'osName', label: 'Computer - OS Name', icon: Monitor, type: 'select', options: o(['Windows 11 Pro', 'Windows 10 Pro', 'Windows Server 2022', 'macOS Sonoma', 'Ubuntu 22.04 LTS', 'Red Hat Enterprise Linux 9']) },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: [
    { label: 'In Use', color: '#22c55e' },
    { label: 'In Stock', color: '#6b7280' },
    { label: 'In Repair', color: '#3D8BD0' },
    { label: 'Faulty', color: '#ef4444' },
    { label: 'Missing', color: '#ef4444' },
    { label: 'Retired', color: '#eab308' },
    { label: 'Theft', color: '#ef4444' },
  ] },
  { key: 'approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: o(['Pending', 'Approved', 'Rejected', 'Not Required']) },
  { key: 'checkerApprovalStatus', label: 'Checker Approval Status', icon: ShieldCheck, type: 'select', options: o(['Pending', 'Approved', 'Rejected', 'Not Required']) },
  { key: 'product', label: 'Product', icon: Package, type: 'select', options: o(['Latitude', 'OptiPlex', 'ThinkPad', 'MacBook Pro', 'MacBook Air', 'PowerEdge', 'ProLiant', 'Catalyst', 'FortiGate']) },
  { key: 'vendor', label: 'Vendor', icon: Building2, type: 'select', options: o(['Redington India', 'Ingram Micro', 'Savex Technologies', 'Apple India', 'Dell Direct']) },
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta']) },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta']) },
  { key: 'lastScanBy', label: 'Last Barcode / QR Code Scan By', icon: UserRound, type: 'select', people: 'technician', options: o(['Sarah Johnson', 'Tabrez Khan', 'Priya Nair', 'Vikram Sethi']) },
  { key: 'lastScanDate', label: 'Last Barcode / QR Code Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'usedByLabel', label: 'Used By', icon: UserRound, type: 'text' },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan']) },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Boxes, type: 'select', options: o(['Datacenter Team', 'End User Computing', 'IT Operations', 'Network Team', 'Service Desk']) },
  { key: 'assetGroup', label: 'Asset Group', icon: Boxes, type: 'select', options: o(['Critical Infrastructure', 'Standard Endpoints', 'Executive Devices', 'Lab & Test', 'Spares Pool']) },
  { key: 'underChangeControl', label: 'Under Change Control', icon: ShieldCheck, type: 'select', options: o(['Yes', 'No']) },
  { key: 'varianceDetection', label: 'Variance Detection', icon: ShieldCheck, type: 'select', options: o(['Detected', 'Not Detected']) },
  { key: 'impact', label: 'Impact', icon: Flag, type: 'select', options: o(['On Users', 'On Business', 'On Department', 'Low']) },
  { key: 'businessServices', label: 'Business Services', icon: Layers, type: 'select', options: o(['Email & Collaboration', 'ERP', 'CRM', 'Payroll', 'Network Services', 'Customer Portal']) },
  { key: 'category', label: 'Category', icon: Layers, type: 'select', options: o(['Computer', 'Network Device', 'Peripheral', 'Server', 'Printer']) },
  { key: 'origin', label: 'Origin', icon: Boxes, type: 'select', options: o(['Purchased', 'Leased', 'Discovered', 'Manually Added']) },
  { key: 'tags', label: 'Tags', icon: Tag, type: 'select', options: o(['production', 'critical', 'finance', 'remote', 'loaner', 'byod']) },
  { key: 'barcode', label: 'Barcode', icon: Barcode, type: 'text' },
  { key: 'assetType', label: 'Asset Type', icon: Monitor, type: 'select', options: o(['Mac Laptop', 'Windows Laptop', 'Windows Desktop', 'HyperV Server', 'UNIX Server', 'Hardware']) },
  { key: 'department', label: 'Department', icon: Building2, type: 'select', options: o(['IT', 'Finance', 'Human Resources', 'Sales', 'Marketing', 'Engineering', 'Operations']) },
  { key: 'x_location', label: 'Location', icon: MapPin, type: 'select', options: o(['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'assignmentDate', label: 'Assignment Date', icon: CalendarDays, type: 'date' },
  { key: 'acquisitionDate', label: 'Acquisition Date', icon: CalendarDays, type: 'date' },
  { key: 'firstScanDate', label: 'First Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'lastScanDateSeen', label: 'Last Scan Date', icon: CalendarDays, type: 'date' },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
];

/* ── Stand-in values ──────────────────────────────────────────────────────────
   Most of these attributes are collected by the agent in the real product; this
   mock stores only a handful of them. Rather than leave a column blank or have a
   filter empty the grid, an attribute with no data gets a STABLE value derived
   from the row id. Filter bar and grid column both read it here, so filtering on
   "Memory Size is 16 GB" always agrees with what that column shows. */
const attrSeed = (s: string) => {
  let n = 7;
  for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
};

/** A select attribute's stand-in: one of its own options, fixed per record.
    Free-text attributes return '' — inventing a serial nobody could type or
    search for would only look broken. */
export const attrStandIn = (attr: Attr, id: string): string =>
  attr.type === 'select' && attr.options?.length
    ? attr.options[attrSeed(id + attr.key) % attr.options.length].label
    : '';

/** A date attribute's stand-in: a fixed day within the last ~18 months. */
export const attrStandInDate = (key: string, id: string): Date => {
  const d = new Date();
  d.setDate(d.getDate() - (attrSeed(id + key) % 540));
  return d;
};
