/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect, Fragment } from 'react';
import { TASK_KEY_FIELDS } from '../taskCustomFields';
import { DateField } from '../DateField';
import { ChevronDown, ChevronUp, ChevronRight, Check, Search, Filter, Laptop, Server, Monitor as MonitorIcon, HardDrive, User, Pin as PinIcon, Edit, Calendar as CalendarIcon, X, Plus, Clock, CheckCircle, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

/** Asset detail values used to seed the editable asset field dropdowns. */
export interface AssetFieldValues {
  id?: string;
  assetType: string;
  status: string;
  impact: string;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string };
  ci?: string;
}

/** Controlled state (values + setters) for the editable asset fields. */
export interface AssetFieldState {
  assetType: string; setAssetType: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  impact: string; setImpact: (v: string) => void;
  managedByGroup: string; setManagedByGroup: (v: string) => void;
  managedBy: { name: string; initials?: string; color?: string };
  setManagedBy: (v: { name: string; initials?: string; color?: string }) => void;
  ci?: string;
  // Software-asset only: the Software Type field (Managed / Discovered / Unmanaged).
  softwareType?: string;
  setSoftwareType?: (v: string) => void;
  // Software-license only: Product (read-only) + License Type (editable dropdown).
  product?: string;
  licenseType?: string;
  setLicenseType?: (v: string) => void;
  // Values for the "View more" additional fields, keyed by field label.
  extra?: Record<string, string>;
  setExtra?: (v: Record<string, string>) => void;
}

export const SOFTWARE_TYPE_OPTIONS = ['Managed', 'Discovered', 'Unmanaged'];

/* The product's License Type list, in the product's own order — shared by the detail
   page's License Fields and the listing's filter + cell dropdown. */
export const LICENSE_TYPE_OPTIONS = [
  'Single Machine', 'Multiple Machines', 'Unlimited Machines', 'Node Locked',
  'Single User', 'Volume Users', 'Unlimited Users', 'Enterprise Subscription',
  'Enterprise-Perpetual', 'OEM', 'Free License',
];

export const CONTRACT_TYPE_OPTIONS = ['Lease', 'Warranty', 'Maintenance', 'Support'];

/** Purchase order status options (dot color per status). */
export const PURCHASE_STATUS_OPTIONS = [
  { label: 'Generated', color: '#3D8BD0' },
  { label: 'Sent For Approval', color: '#D97706' },
  { label: 'Approved', color: '#22C55E' },
  { label: 'Ordered', color: '#8B5CF6' },
  { label: 'Partially Received', color: '#9CA3AF' },
  { label: 'Received', color: '#16A34A' },
];

export const COST_CENTER_OPTIONS = ['IT Operations', 'Procurement', 'Finance', 'Infrastructure', 'Administration'];
/* The rest of the purchase-order pickers, exported so the listing's filter catalogue and
   Manage-columns list read the SAME values the detail page's fields offer. */
export const GL_CODE_OPTIONS = ['5010 - IT Equipment', '5020 - Software', '5030 - Services', '6010 - Maintenance', '6020 - Consumables'];
export const INVOICE_RECEIVED_OPTIONS = ['None', 'Partial', 'Full'];
export const PAYMENT_STATUS_OPTIONS = ['None', 'Pending', 'Partially Paid', 'Paid'];

/** User options for the contract Owner picker (mirrors the ticket Assignee dropdown). */
const OWNER_OPTIONS: { name: string; initials: string; color: string; status: string }[] = [
  { name: 'Sarah Johnson', initials: 'SJ', color: '#3D8BD0', status: '#22C55E' },
  { name: 'Michael Chen', initials: 'MC', color: '#8B5CF6', status: '#22C55E' },
  { name: 'Emma Wilson', initials: 'EW', color: '#EC4899', status: '#F59E0B' },
  { name: 'David Kim', initials: 'DK', color: '#64748B', status: '#9CA3AF' },
  { name: 'Lisa Anderson', initials: 'LA', color: '#22C55E', status: '#22C55E' },
];

/** Field labels in display order — also used for pinning and search matching. */
export const ASSET_FIELD_LABELS = [
  'Asset Type', 'Status', 'Impact', 'Managed By Group', 'Managed By', 'CI',
  'Asset Group', 'Product', 'Used By', 'Location', 'Category', 'Department',
  'Host Name', 'Domain Name', 'UUID', 'IP Address', 'MAC Address', 'Subnet Mask',
  'Vendor', 'Asset Condition', 'Movement Status', 'Under Change Control',
  'Business Service', 'Origin', 'Acquisition Date', 'Assignment Date',
];

/** Labels rendered behind the "View more" toggle, with the input type to use for each. */
export const ASSET_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Hemal Patel', 'John Doe', 'Jane Smith', 'Ravi Kumar', 'Sara Lee'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Category', type: 'select', options: ['Hardware', 'Software', 'Network Device', 'Peripheral'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Host Name', type: 'editable' },
  { label: 'Domain Name', type: 'editable' },
  { label: 'UUID', type: 'editable' },
  { label: 'IP Address', type: 'editable' },
  { label: 'MAC Address', type: 'editable' },
  { label: 'Subnet Mask', type: 'editable' },
  { label: 'Vendor', type: 'select', options: ['Lenovo', 'Dell', 'HP', 'Apple', 'Microsoft'] },
  { label: 'Asset Condition', type: 'select', options: ['Good', 'Fair', 'Poor', 'Damaged'] },
  { label: 'Movement Status', type: 'select', options: ['None', 'In Transit', 'Delivered', 'Returned'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for CMDB CIs — CI Group instead of Asset Group; no Category /
 * Asset Condition / Movement Status / Under Change Control / Acquisition Date. */
export const CMDB_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'CI Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Hemal Patel', 'John Doe', 'Jane Smith', 'Ravi Kumar', 'Sara Lee'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Host Name', type: 'editable' },
  { label: 'Domain Name', type: 'editable' },
  { label: 'UUID', type: 'editable' },
  { label: 'IP Address', type: 'editable' },
  { label: 'MAC Address', type: 'editable' },
  { label: 'Subnet Mask', type: 'editable' },
  { label: 'Vendor', type: 'select', options: ['Lenovo', 'Dell', 'HP', 'Apple', 'Microsoft'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for Non-IT assets — like ASSET_MORE_FIELDS but without the network fields (Host Name/IP/MAC/…) and with a Last-Scan field. */
export const NONIT_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Neha Raje', 'Farah Sheikh', 'Rohan Mehta', 'Priya Nair', 'Vikram Sethi'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Category', type: 'select', options: ['Furniture', 'Fixtures', 'Office Equipment', 'Appliance', 'Pantry'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Facilities'] },
  { label: 'Vendor', type: 'select', options: ['Herman Miller', 'Steelcase', 'IKEA', 'Godrej', 'Test vendor'] },
  { label: 'Asset Condition', type: 'select', options: ['None', 'Good', 'Fair', 'Poor', 'Damaged'] },
  { label: 'Movement Status', type: 'select', options: ['None', 'In Transit', 'Delivered', 'Returned'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for Software assets — Version + Software Category; no network/Used By/Location fields. */
export const SOFTWARE_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Version', type: 'editable' },
  { label: 'Category', type: 'select', options: ['Application', 'Operating System', 'Utility', 'Driver', 'Middleware'] },
  { label: 'Software Category', type: 'select', options: ['Managed', 'Unmanaged', 'Prohibited', 'Freeware', 'Shareware'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Vendor', type: 'select', options: ['Microsoft', 'Adobe', 'Google', 'Oracle', 'Atlassian'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** Labels whose label text is shown in red (required-style emphasis). Empty — all labels use the standard gray. */
const ASSET_REQUIRED_LABELS: string[] = [];

/** Values shown in the Agent Information block (replaces Requester Information on the asset page). */
export interface AgentInfo {
  id: string;
  /** Agent name (e.g. AGENT-417) shown as the Agent Information header */
  agentName?: string;
  hostName: string;
  hostStatusColor?: string;
  ipAddress: string;
  poller: string;
  os: string;
  version: string;
  domainName: string;
  lastSyncDate: string;
}

/** Field labels in the Agent Information block — used for search matching. */
export const AGENT_FIELD_LABELS = ['ID', 'Host Name', 'IP Address', 'Poller', 'OS', 'Version', 'Domain Name', 'Agent Last Sync Date'];

export const STATUS_OPTIONS = [
  { label: 'In Stock', color: '#9CA3AF' },
  { label: 'In Use', color: '#22C55E' },
  { label: 'Missing', color: '#EF4444' },
  { label: 'Retired', color: '#EAB308' },
  { label: 'Theft', color: '#93C5FD' },
  { label: 'Faulty', color: '#F87171' },
  { label: 'In Repair', color: '#1E40AF' },
  { label: 'Disposed', color: '#6B7280' },
  { label: 'Expired', color: '#64748B' },
];

export const IMPACT_OPTIONS = [
  { label: 'Low', color: '#22C55E' },
  { label: 'On Users', color: '#EAB308' },
  { label: 'On Department', color: '#F59E0B' },
  { label: 'On Business', color: '#EF4444' },
];

export const GROUP_OPTIONS = [
  'Unassigned',
  'Network Operations Group',
  'IT Support Group',
  'General Support Group',
  'Change Advisory Board (CAB)',
  'HR Support Group',
  'Emergency Change Advisory Board (ECAB)',
  'Hardware Support Team',
  'Software Support Team',
];

interface ManagerOption { name: string; email: string; initials: string; color: string; }
const MANAGER_OPTIONS: ManagerOption[] = [
  { name: 'Kavit Gohel',       email: 'kavit.gohel@motadata.com',      initials: 'KG', color: '#22C55E' },
  { name: 'vaibhav prajapati', email: 'vaibhav.prajapati@motadata.com', initials: 'VP', color: '#3D8BD0' },
  { name: 'hemal',             email: 'hemal.parmar@motadata.com',      initials: 'HE', color: '#3D8BD0' },
  { name: 'Tabrez',            email: 'tabrez@rasinfotech-dubai.com',   initials: 'TA', color: '#10B981' },
  { name: 'Udit',              email: 'udit.hotchandani@motadata.com',  initials: 'UD', color: '#8B5CF6' },
  { name: 'Rosy',              email: 'rosy.cordeiro@motadata.com',     initials: 'RO', color: '#EC4899' },
  { name: 'Hardik',            email: 'hardik.prajapati@motadata.com',  initials: 'HA', color: '#EF4444' },
  { name: 'Navin Gadhvi',      email: 'navin.gadhvi@smgsuzuki.co.in',   initials: 'NG', color: '#14B8A6' },
  { name: 'dhaval',            email: 'dhaval.zala@motadata.com',       initials: 'DH', color: '#64748B' },
  { name: 'naitik',            email: 'naitik.piparia@motadata.com',    initials: 'NA', color: '#A78BFA' },
  { name: 'Sridhar',           email: 'sridhar@techfruitspl.com',       initials: 'SR', color: '#0EA5E9' },
  { name: 'Abhishek Tiwari',   email: 'abhishek.tiwari@motadata.com',   initials: 'AT', color: '#F59E0B' },
  { name: 'Training',          email: 'training@motadata.com',          initials: 'TR', color: '#6366F1' },
  { name: 'Ryan',              email: 'ryan.cronje@corrserve.co.za',    initials: 'RY', color: '#22C55E' },
  { name: 'Jay Vegda',         email: 'jay.vegda@motadata.com',         initials: 'JV', color: '#14B8A6' },
  { name: 'Rakesh Rathod',     email: 'rakesh.rathod@motadata.com',     initials: 'RR', color: '#EF4444' },
  { name: 'Parita',            email: 'parita.kumbhani@motadata.com',   initials: 'PA', color: '#A78BFA' },
  { name: 'sanat',             email: 'sanat.patel@motadata.com',       initials: 'SA', color: '#F97316' },
  { name: 'Sakshi',            email: 'sakshi.sudhani@motadata.com',    initials: 'SA', color: '#EC4899' },
];

/** Asset type categories, shown as an expandable tree with search. */
const TYPE_TREE: { label: string; children: string[] }[] = [
  { label: 'Hardware',     children: ['Monitor', 'Projector', 'Scanner', 'Windows Laptop', 'Mac Laptop', 'Windows Desktop'] },
  { label: 'Public Cloud', children: ['AWS Instance', 'Azure VM', 'GCP Instance'] },
  { label: 'Storage',      children: ['SAN', 'NAS'] },
  { label: 'DataCenter',   children: ['HyperV Server', 'UNIX Server'] },
  { label: 'Mobile Device', children: ['iOS Device', 'Android Device'] },
  { label: 'SNMP Devices', children: ['Router', 'Switch', 'Firewall'] },
];
/** The flat Asset Type catalog the detail page's Asset Type dropdown offers —
    shared with the Hardware Assets listing's inline editor. */
export const ASSET_TYPE_OPTIONS = TYPE_TREE.flatMap((t) => t.children);

/** What the expand popup calls a "Key Information" field. Mirrors ExpandKeyField. */
export interface AssetKeyInfoField {
  label: string;
  value: string;
  options?: { label: string; color?: string }[];
}

/** Which variant of the accordion is on screen — the popup has to match it field for field. */
export interface AssetKeyInfoMode {
  software?: boolean;
  nonIt?: boolean;
  cmdb?: boolean;
  license?: boolean;
  contract?: boolean;
  purchase?: boolean;
}

/* The expand popup shows the SAME Key Information the accordion does, so both read from here.
   Built next to the variants above deliberately: a second hand-written copy in the panel is how
   the popup ended up listing the Request page's fields on an asset. */
export function assetKeyInfoFields(state: AssetFieldState | undefined, mode: AssetKeyInfoMode = {}): AssetKeyInfoField[] {
  const extra = state?.extra ?? {};
  const plain = (labels: string[]) => labels.map((label) => ({ label, value: extra[label] ?? '' }));

  if (mode.license) {
    return [
      { label: 'Product', value: state?.product ?? '' },
      { label: 'License Type', value: state?.licenseType ?? '', options: LICENSE_TYPE_OPTIONS.map((o) => ({ label: o })) },
    ];
  }
  const pick = (label: string, options?: string[]) => ({ label, value: extra[label] ?? '', options: options?.map((o) => ({ label: o })) });
  const owners = OWNER_OPTIONS.map((o) => ({ label: o.name, color: o.color }));

  if (mode.contract) {
    return [
      ...plain(['Contract Number', 'Contract Start Date', 'Contract End Date', 'Cost']),
      { label: 'Contract Type', value: extra['Contract Type'] ?? '', options: CONTRACT_TYPE_OPTIONS.map((o) => ({ label: o })) },
      pick('Vendor'),
      // Behind "View more" in the accordion — the popup is the whole record, so it shows them.
      { label: 'Owner', value: extra['Owner'] ?? '', options: owners },
      pick('Department', ['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Procurement']),
    ];
  }
  if (mode.purchase) {
    return [
      { label: 'Status', value: state?.status ?? '', options: PURCHASE_STATUS_OPTIONS },
      ...plain(['Order Number', 'Cost (INR)']),
      { label: 'Cost Center', value: extra['Cost Center'] ?? '', options: COST_CENTER_OPTIONS.map((o) => ({ label: o })) },
      ...plain(['Purchase Required By', 'Purchase Order Date']),
      { label: 'Owner', value: extra['Owner'] ?? '', options: owners },
      pick('Vendor'),
      pick('GL Code', GL_CODE_OPTIONS),
      pick('Print Template', ['Standard', 'Detailed', 'Compact']),
      pick('Invoice Received', INVOICE_RECEIVED_OPTIONS),
      pick('Payment Status', PAYMENT_STATUS_OPTIONS),
      ...plain(['Total Invoice Amount', 'Total Payment Amount']),
    ];
  }

  const assetTypes = TYPE_TREE.flatMap((t) => t.children).map((o) => ({ label: o }));
  const fields: AssetKeyInfoField[] = [
    { label: 'Asset Type', value: state?.assetType ?? '', options: assetTypes },
    { label: 'Status', value: state?.status ?? '', options: STATUS_OPTIONS },
    { label: 'Impact', value: state?.impact ?? '', options: IMPACT_OPTIONS },
  ];
  if (mode.software) {
    fields.push({ label: 'Software Type', value: state?.softwareType ?? '', options: SOFTWARE_TYPE_OPTIONS.map((o) => ({ label: o })) });
  }
  fields.push(
    { label: 'Managed By Group', value: state?.managedByGroup ?? '', options: GROUP_OPTIONS.map((o) => ({ label: o })) },
    { label: 'Managed By', value: state?.managedBy?.name ?? '', options: MANAGER_OPTIONS.map((m) => ({ label: m.name, color: m.color })) },
  );
  // The software variant hides CI, matching the accordion.
  if (!mode.software) fields.push({ label: 'CI', value: state?.ci ?? '' });

  /* Everything behind the accordion's "View more" belongs here too — the popup exists to show the
     WHOLE record at once, so hiding half of it would defeat the point. */
  const more = mode.software ? SOFTWARE_MORE_FIELDS
    : mode.nonIt ? NONIT_MORE_FIELDS
      : mode.cmdb ? CMDB_MORE_FIELDS
        : ASSET_MORE_FIELDS;
  fields.push(...more.map((f) => ({
    label: f.label,
    value: extra[f.label] ?? '',
    options: f.options?.map((o) => ({ label: o })),
  })));
  return fields;
}

/** Commits one popup edit back onto the asset state the accordion reads. */
export function applyAssetKeyInfo(state: AssetFieldState | undefined, label: string, value: string) {
  if (!state) return;
  switch (label) {
    case 'Asset Type': state.setAssetType(value); return;
    case 'Status': state.setStatus(value); return;
    case 'Impact': state.setImpact(value); return;
    case 'Managed By Group': state.setManagedByGroup(value); return;
    case 'Software Type': state.setSoftwareType?.(value); return;
    case 'License Type': state.setLicenseType?.(value); return;
    case 'Managed By': {
      const m = MANAGER_OPTIONS.find((o) => o.name === value);
      state.setManagedBy(m ? { name: m.name, initials: m.initials, color: m.color } : { name: value });
      return;
    }
    // Everything else lives in the "extra" bag, keyed by label.
    default: state.setExtra?.({ ...(state.extra ?? {}), [label]: value });
  }
}

export function assetTypeIcon(type?: string) {
  switch (type) {
    case 'Mac Laptop':
    case 'Windows Laptop':
      return <Laptop size={14} />;
    case 'HyperV Server':
    case 'UNIX Server':
      return <Server size={14} />;
    case 'Windows Desktop':
    case 'Monitor':
      return <MonitorIcon size={14} />;
    default:
      return <HardDrive size={14} />;
  }
}

/** Read-only value indicator for a single asset field (used in the Pinned Fields section). */
export function AssetValueDisplay({ field, state }: { field: string; state: AssetFieldState }) {
  switch (field) {
    case 'Asset Type':
      return (
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">{assetTypeIcon(state.assetType)}</span>
          <span className="text-[13px] text-[#364658]">{state.assetType}</span>
        </div>
      );
    case 'Status': {
      const color = STATUS_OPTIONS.find((o) => o.label === state.status)?.color || '#9CA3AF';
      return (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[13px] text-[#364658]">{state.status}</span>
        </div>
      );
    }
    case 'Impact': {
      const color = IMPACT_OPTIONS.find((o) => o.label === state.impact)?.color || '#9CA3AF';
      return (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[13px] text-[#364658]">{state.impact}</span>
        </div>
      );
    }
    case 'Managed By Group':
      return <span className="text-[13px] text-[#364658]">{state.managedByGroup}</span>;
    case 'Managed By':
      return (
        <div className="flex items-center gap-2">
          {state.managedBy.initials ? (
            <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: state.managedBy.color || '#9CA3AF' }}>{state.managedBy.initials}</span>
          ) : (
            <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
          )}
          <span className="text-[13px] text-[#364658]">{state.managedBy.name}</span>
        </div>
      );
    case 'CI':
      return state.ci
        ? <span className="text-[13px] text-[#3D8BD0] cursor-pointer hover:underline">{state.ci}</span>
        : <span className="text-[13px] text-[#9CA3AF]">---</span>;
    case 'Software Type':
      return <span className="text-[13px] text-[#364658]">{state.softwareType || '---'}</span>;
    default:
      if (state.extra && field in state.extra) {
        const v = state.extra[field];
        return v
          ? <span className="text-[13px] text-[#364658]">{v}</span>
          : <span className="text-[13px] text-[#9CA3AF]">---</span>;
      }
      return <span className="text-[13px] text-[#364658]">-</span>;
  }
}

const menuClass = 'app-menu absolute top-full right-0 mt-1 w-full min-w-[260px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50';
const optionClass = 'w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors';
const triggerClass = 'w-full pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left truncate';

const SearchBox = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="px-3 pb-2">
    <div className="relative">
      <input
        type="text"
        placeholder="Search"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
      />
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
    </div>
  </div>
);

/** Field row with a label + hover pin button (mirrors the ticket field rows). */
const FieldRow = ({ label, pinned, onPin, children, labelColor }: { label: string; pinned: boolean; onPin: () => void; children: React.ReactNode; labelColor?: string }) => (
  <div className="flex items-center justify-between gap-3">
    <div className={`text-[12px] flex-shrink-0 w-[120px] group/label flex items-center gap-1 ${labelColor ? '' : 'text-[#4A5568]'}`} style={labelColor ? { color: labelColor } : undefined}>
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="flex items-center">
            <PinIcon size={14} className={`transition-opacity ${pinned ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{pinned ? 'Unpin this field' : 'Pin this field on top'}</TooltipContent>
      </Tooltip>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

type Field = string | null;

interface AssetFieldsProps {
  state: AssetFieldState;
  pinnedFields: string[];
  togglePinField: (field: string) => void;
  propertiesSearchQuery: string;
  // Software-asset variant: shows Software Type and hides CI / "View more" extras.
  softwareMode?: boolean;
  // Non-IT variant: like softwareMode (CI / "View more" hidden) but WITHOUT the software-only Software Type field.
  nonItMode?: boolean;
  // Software-license variant: shows ONLY Product (read-only) + License Type (dropdown).
  licenseMode?: boolean;
  // Contract variant: shows ONLY the contract fields (number/dates/cost/type/vendor).
  contractMode?: boolean;
  // Purchase variant: shows ONLY the purchase fields (status/order number/cost/cost center/dates).
  purchaseMode?: boolean;
  // Patch variant: shows ONLY the patch fields (category/severity/approval/test/release date/…).
  patchMode?: boolean;
  // Patch DEPLOYMENT page: within patchMode, show the deployment-run fields
  // (Status / Task Type / Deployment Policy / Install After / Expiry Date) instead.
  patchDeployMode?: boolean;
  packageDeployMode?: boolean;
  registryDeployMode?: boolean;
  /** Knowledge page: the article's own properties. Presence of this switches the field set. */
  knowledgeInfo?: { status: string; createdOn: string; lastModifiedBy: string; lastModifiedOn: string; folder: string; author: string };
  /** The OPEN patch record's own values, for the handful of Patch Fields that are real facts
   *  about it rather than catalogue furniture. Everything not supplied keeps the mock value,
   *  so a page that passes nothing looks exactly as it did. Without this the panel told every
   *  advisory the same story — a listing row saying "Reboot Required: Yes" sat beside a
   *  detail panel saying "No". */
  patchInfo?: {
    category?: string; severity?: string; approvalStatus?: string; releaseDate?: string;
    kbNumber?: string; rebootRequired?: string; referenceUrl?: string;
  };
  // ENDPOINT page: endpoint-inventory fields (host/OS/agent/scan info) instead of the patch catalog's.
  endpointMode?: boolean;
  // DETECTED CVE page: CVE-metadata fields.
  cveMode?: boolean;
  /** Task detail page: the six task fields, in place of the cloned patch set. */
  taskMode?: boolean;
  /** Task Key Information values the expand popup has changed, keyed by label. */
  taskValues?: Record<string, string>;
  /** Task page: commits an inline Key Information edit (the accordion is editable there). */
  onTaskValueChange?: (label: string, value: string) => void;
  // CMDB variant: display-label swaps only — 'Asset Type' → 'CI Type', 'CI' → 'Asset'.
  cmdbMode?: boolean;
  // Extra content (the System Fields subsection) rendered at the bottom of the
  // "View more" expansion — so ONE "View more" reveals both the extra fields AND system fields.
}

export function AssetFields({ state, pinnedFields, togglePinField, propertiesSearchQuery, softwareMode = false, nonItMode = false, licenseMode = false, contractMode = false, purchaseMode = false, patchMode = false, patchDeployMode = false, packageDeployMode = false, registryDeployMode = false, knowledgeInfo, patchInfo, endpointMode = false, cveMode = false, taskMode = false, taskValues, onTaskValueChange, cmdbMode = false }: AssetFieldsProps) {
  const { assetType, setAssetType, status, setStatus, impact, setImpact, managedByGroup, setManagedByGroup, managedBy, setManagedBy, ci } = state;
  const softwareType = state.softwareType ?? '';
  const setSoftwareType = state.setSoftwareType ?? (() => {});
  const licenseType = state.licenseType ?? '';
  const setLicenseType = state.setLicenseType ?? (() => {});
  const extra = state.extra ?? {};
  const setExtra = state.setExtra ?? (() => {});

  const [open, setOpen] = useState<Field>(null);
  const [showMore, setShowMore] = useState(false);
  // Tags chip editor (asset variants) — local prototype state, seeded with realistic tags.
  const [assetTags, setAssetTags] = useState<string[]>(['production', 'critical']);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [licenseTypeSearch, setLicenseTypeSearch] = useState('');
  const [contractTypeSearch, setContractTypeSearch] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [owner, setOwner] = useState<{ name: string; initials: string; color: string } | null>(OWNER_OPTIONS[0]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Hardware']));

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.('[data-dtp]')) return;
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = (f: Field) => setOpen((cur) => (cur === f ? null : f));

  // A field shows here only when it is not pinned (pinned fields move to the Pinned Fields section)
  // and when it matches the active properties search query.
  const q = propertiesSearchQuery.trim().toLowerCase();
  const show = (label: string) => !pinnedFields.includes(label) && (!q || label.toLowerCase().includes(q));

  const statusColor = STATUS_OPTIONS.find((o) => o.label === status)?.color || '#9CA3AF';
  const impactColor = IMPACT_OPTIONS.find((o) => o.label === impact)?.color || '#9CA3AF';

  const filteredStatus = STATUS_OPTIONS.filter((o) => o.label.toLowerCase().includes(statusSearch.toLowerCase()));
  const filteredGroups = GROUP_OPTIONS.filter((o) => o.toLowerCase().includes(groupSearch.toLowerCase()));
  const filteredManagers = MANAGER_OPTIONS.filter(
    (o) => o.name.toLowerCase().includes(managerSearch.toLowerCase()) || o.email.toLowerCase().includes(managerSearch.toLowerCase())
  );
  const typeQuery = typeSearch.trim().toLowerCase();

  // --- "View more" additional-field renderers (label/input/dropdown match the core asset rows) ---
  const updateExtra = (label: string, value: string) => setExtra({ ...extra, [label]: value });
  const labelColorFor = (label: string) => (!nonItMode && !softwareMode && ASSET_REQUIRED_LABELS.includes(label) ? '#C0392B' : undefined);

  const renderStatic = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <span className="text-[13px] text-[#364658] px-3 py-2 block truncate">{extra[label] || '---'}</span>
    </FieldRow>
  );

  const renderEditable = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      {editingField === label ? (
        <input
          autoFocus
          value={extra[label] || ''}
          onChange={(e) => updateExtra(label, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
          className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
        />
      ) : (
        <div className="group/edit relative flex items-center">
          <span className="text-[13px] text-[#364658] px-3 py-2 truncate flex-1">{extra[label] || '---'}</span>
          <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity">
            <Edit size={14} />
          </button>
        </div>
      )}
    </FieldRow>
  );

  const renderSelect = (label: string, options: string[], showSubline = false) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <div className="group relative">
        <button className={`${triggerClass} pl-3`} title={extra[label]} onClick={() => toggle(label)}>
          {extra[label] ? <span className="truncate">{extra[label]}</span> : <span className="text-[#9CA3AF]">Select</span>}
        </button>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        {showSubline && extra[label] && <div className="text-[11px] text-[#3D8BD0] px-3 pt-0.5 truncate">{extra[label]}</div>}
        {open === label && (
          <div className={menuClass}>
            <div className="max-h-[280px] overflow-y-auto">
              {options.map((o) => (
                <button key={o} className={optionClass} onClick={() => { updateExtra(label, o); setOpen(null); }}>
                  <span className="text-[13px] text-[#364658] truncate">{o}</span>
                  {extra[label] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldRow>
  );

  const renderDate = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <div className="relative group">
        <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
      </div>
    </FieldRow>
  );

  const renderMoreField = (f: { label: string; type: string; options?: string[] }) => {
    if (!show(f.label)) return null;
    switch (f.type) {
      case 'static': return renderStatic(f.label);
      case 'editable': return renderEditable(f.label);
      case 'select': return renderSelect(f.label, f.options || []);
      case 'location': return renderSelect(f.label, f.options || [], true);
      case 'date': return renderDate(f.label);
      default: return null;
    }
  };

  // Tags — chip editor (same treatment as the ticket accordion), rendered as the last upfront
  // field before "View more" in the asset / contract / purchase variants.
  const tagsRow = (!q || 'tags'.includes(q)) && (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] pt-1">Tags</div>
        <div className="flex flex-wrap gap-2 flex-1">
          {assetTags.map((tag, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] text-[#364658] text-[11px] rounded-md">
              {tag}
              <button
                className="hover:text-[#2563EB]"
                onClick={() => setAssetTags(assetTags.filter((_, i) => i !== index))}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {!showTagInput && (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[#3D8BD0] text-[12px] hover:bg-[#F3F4F6] rounded transition-colors"
            >
              <Plus size={12} />
              Add tag
            </button>
          )}
        </div>
      </div>
      {showTagInput && (
        <input
          type="text"
          placeholder="Add tags..."
          value={tagInputValue}
          onChange={(e) => setTagInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInputValue.trim()) {
              setAssetTags([...assetTags, tagInputValue.trim()]);
              setTagInputValue('');
              setShowTagInput(false);
            } else if (e.key === 'Escape') {
              setTagInputValue('');
              setShowTagInput(false);
            }
          }}
          onBlur={() => {
            if (tagInputValue.trim()) {
              setAssetTags([...assetTags, tagInputValue.trim()]);
            }
            setTagInputValue('');
            setShowTagInput(false);
          }}
          autoFocus
          className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F3F4F6] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
        />
      )}
    </div>
  );

  // Patch variant: ALL patch fields are READ-ONLY (nothing here is user-editable).
  if (patchMode) {
    const severityColor = (v: string) => (({ 'Critical': '#EF4444', 'Important': '#F59E0B', 'Moderate': '#EAB308', 'Low': '#111827', 'Unspecified': '#6B7280' } as Record<string, string>)[v] ?? '#6B7280');
    const approvalColor = (v: string) => (({ 'Approved': '#22C55E', 'Not Approved': '#F59E0B', 'Declined': '#DC2626' } as Record<string, string>)[v] ?? '#9CA3AF');

    // kind: undefined = plain text · 'severity'/'approval' = colored dot + text · 'url' = clickable
    // link · 'user' = blue name text · 'link' = blue record ref. `dot` = explicit dot color
    // (deployment statuses / system health). `pill` = right-aligned scan-status pill.
    // `section` = subsection header rendered ABOVE the row (Scan Info).
    type PatchField = { label: string; value: string; kind?: 'severity' | 'approval' | 'url' | 'user' | 'link'; sub?: string; dot?: string; pill?: 'progress' | 'done'; section?: string; info?: string };
    /* The first rows are facts about the OPEN record and come from `patchInfo` when the page
       supplies it; the rest is catalogue furniture that stays mock. Each falls back to the
       old literal, so the pages that pass nothing are untouched. */
    const PATCH_FIELDS: PatchField[] = [
      { label: 'Patch Category', value: patchInfo?.category ?? 'Updates' },
      { label: 'Severity', value: patchInfo?.severity ?? 'Low', kind: 'severity' },
      { label: 'Approval Status', value: patchInfo?.approvalStatus ?? 'Approved', kind: 'approval' },
      { label: 'Test Status', value: 'Not Tested' },
      { label: 'Release Date', value: patchInfo?.releaseDate ?? '01 Feb 2026' },
      { label: 'KB Number', value: patchInfo?.kbNumber ?? '---' },
      { label: 'Superseded Status', value: 'No' },
      { label: 'Bulletin Id', value: '---' },
      { label: 'Refrence Url', value: patchInfo?.referenceUrl ?? 'https://www.win-rar.com/support.html', kind: 'url' },
      { label: 'UUID', value: 'win_rar-windows-x64-exe-7.20' },
      { label: 'Architecture', value: '64 BIT' },
      { label: 'Source', value: 'Patch Scanning' },
      { label: 'Status', value: 'Published' },
      { label: 'Download Status', value: 'Success' },
      { label: 'Download On', value: 'Mon, Jul 20, 2026 05:01 PM' },
      { label: 'Download Size', value: '3.77 MB' },
      { label: 'Reboot Required', value: patchInfo?.rebootRequired ?? 'No' },
      { label: 'Support Uninstallation', value: 'No' },
      { label: 'Approved By', value: 'Rakesh Rathod', kind: 'user' },
      { label: 'Approved On', value: 'Mon, Jul 20, 2026 04:56 PM' },
      { label: 'Patch Type', value: 'Third Party Patch' },
      { label: 'Created Date', value: 'Tue, Mar 10, 2026 10:52 PM', sub: '(4 months ago)' },
      { label: 'Last Updated Date', value: 'Mon, Jul 20, 2026 05:01 PM', sub: '(25 minutes ago)' },
      { label: 'Created By', value: 'System' },
      { label: 'Last Updated By', value: 'Rakesh Rathod', kind: 'user' },
    ];

    // Patch DEPLOYMENT page variant — the deployment run's own properties, not the patch catalog's.
    const PATCH_DEPLOYMENT_FIELDS: PatchField[] = [
      { label: 'Status', value: 'Ready to Deploy', dot: '#3D8BD0' },
      { label: 'Task Type', value: 'Auto Patch Deploy Task' },
      { label: 'Deployment Policy', value: 'Production Servers — Staged Rollout' },
      { label: 'Install After', value: 'Sun, Jun 07, 2026 03:30 PM' },
      { label: 'Expiry Date', value: '---' },
      { label: 'Remote Offices', value: 'Ahmedabad HQ, Mumbai Office' },
      { label: 'Notify to', value: 'IT Support Team' },
      { label: 'Retry Failed Configuration', value: 'Enabled' },
      { label: 'Retry Count', value: '2' },
      { label: 'Last Updated Date', value: 'Sun, Jun 07, 2026 03:30 PM', sub: '(2 months ago)' },
      { label: 'Created By', value: 'Jainam Shah (Archived)', kind: 'user' },
      { label: 'Last Updated By', value: 'Jainam Shah (Archived)', kind: 'user' },
    ];
    // PACKAGE DEPLOYMENT page variant — the package run's own properties (no Remote Offices;
    // retry settings and audit fields close it out).
    const PACKAGE_DEPLOYMENT_FIELDS: PatchField[] = [
      { label: 'Status', value: 'Ready to Deploy', dot: '#3D8BD0' },
      { label: 'Task Type', value: 'Manual Remote Deployment' },
      { label: 'Deployment Policy', value: '24x7 Deployment Policy' },
      { label: 'Install After', value: 'Thu, May 21, 2026 10:51 AM' },
      { label: 'Expiry Date', value: 'Thu, May 28, 2026 10:51 AM' },
      { label: 'Notify to', value: 'Desktop Support Team' },
      { label: 'Retry Failed Configuration', value: 'Enabled' },
      { label: 'Retry Count', value: '3' },
      { label: 'Last Updated Date', value: 'Thu, May 28, 2026 11:22 AM', sub: '(2 months ago)' },
      { label: 'Created By', value: 'Dharti Mehta', kind: 'user' },
      { label: 'Last Updated By', value: 'System' },
    ];
    // REGISTRY DEPLOYMENT page variant — the registry run's own properties.
    const REGISTRY_DEPLOYMENT_FIELDS: PatchField[] = [
      { label: 'Status', value: 'In Progress', dot: '#F59E0B' },
      { label: 'Task Type', value: 'Manual Remote Deployment' },
      { label: 'Deployment Policy', value: 'Business Hours Deployment Policy' },
      { label: 'Install After', value: 'Thu, Jun 13, 2026 06:43 PM' },
      { label: 'Expiry Date', value: '---' },
      { label: 'Notify to', value: 'IT Security Team' },
      { label: 'Retry Failed Configuration', value: 'Disabled' },
      { label: 'Retry Count', value: '0' },
      { label: 'Last Updated Date', value: 'Fri, Jun 14, 2026 10:30 AM', sub: '(2 months ago)' },
      { label: 'Created By', value: 'Meeral Pithwa (Archived)', kind: 'user' },
      { label: 'Last Updated By', value: 'System' },
    ];
    /* KNOWLEDGE page variant — the article's own properties, five fields only. Values come from
       the record via knowledgeInfo, so each article shows its own. */
    const KNOWLEDGE_FIELDS: PatchField[] = knowledgeInfo ? [
      /* An EMPTY status means "don't show the row" — the requester preview passes '' because a
         requester only ever sees published articles, so the status is implicit. */
      ...(knowledgeInfo.status ? [{
        label: 'Status',
        value: knowledgeInfo.status,
        dot: knowledgeInfo.status === 'Published' ? '#22A06B'
          : knowledgeInfo.status === 'Draft' ? '#94A3B8'
            : knowledgeInfo.status === 'Expired' ? '#EF4444' : '#F59E0B',
      }] : []),
      { label: 'Created on', value: knowledgeInfo.createdOn },
      // Person on the first line, when underneath — keeps the row short and scannable.
      { label: 'Last Modified by', value: knowledgeInfo.lastModifiedBy, kind: 'user', sub: knowledgeInfo.lastModifiedOn },
      { label: 'Folder', value: knowledgeInfo.folder },
      { label: 'Author', value: knowledgeInfo.author, kind: 'user' },
    ] : [];
    // ENDPOINT page variant — the computer's inventory, not a patch's catalog entry.
    // Order: summary fields → Tags (inserted after OS Version) → agent/identity fields → Scan Info.
    const ENDPOINT_FIELDS: PatchField[] = [
      { label: 'System Health', value: 'Healthy', dot: '#22C55E' },
      { label: 'Used By', value: '---' },
      { label: 'Service Pack', value: 'None' },
      { label: 'IP Address', value: '192.168.29.100' },
      { label: 'Host Name', value: 'DESKTOP-5JPPI6F' },
      { label: 'Architecture', value: '64 BIT' },
      { label: 'OS Name', value: 'Microsoft Windows 11 Pro' },
      { label: 'OS Version', value: '10.0.26200.8457' },
      { label: 'Asset ID', value: 'AST-13', kind: 'link' },
      { label: 'CI ID', value: 'CI-3', kind: 'link' },
      { label: 'Agent ID', value: 'EP-408' },
      { label: 'Reboot Required', value: 'Yes' },
      { label: 'Agent Version', value: '8.7.406' },
      { label: 'Poller', value: '---' },
      { label: 'MAC Address', value: '00:09:0F:AA:00:01' },
      { label: 'Domain Name', value: 'WORKGROUP' },
      { label: 'Remote Office', value: 'Ahmedabad HQ' },
      { label: 'Last Logged In User', value: 'stuti ahluwalia' },
      { label: 'Language', value: 'English (United States)' },
    ];

    // DETECTED CVE page variant — the CVE's own metadata. Order: 6 summary fields → Tags →
    // dates. The values are static mock (matching the Overview cards' derived facts).
    const CVE_FIELDS: PatchField[] = [
      { label: 'CWE ID', value: 'CWE-367' },
      { label: 'Status', value: 'Modified' },
      { label: 'Severity', value: 'High', kind: 'severity' },
      { label: 'Approval Status', value: 'Approved', kind: 'approval' },
      { label: 'Exploit Status', value: 'No' },
      { label: 'Patch Availability', value: 'Yes', info: 'Shows whether a patch for this CVE is available in Patch Management.' },
      { label: 'Published Date', value: 'Tue, Jun 11, 2024 10:45 PM' },
      { label: 'Last Updated Date', value: 'Mon, Jul 27, 2026 11:26 AM' },
    ];

    /* Task fields come from the shared TASK_KEY_FIELDS definition, so the expand popup edits the
       very same list. Status and Priority carry dots, matching how those values read in the
       listing and the header KPI strip; `taskValues` holds anything the popup has changed. */
    const TASK_FIELDS: PatchField[] = TASK_KEY_FIELDS.map((f) => {
      const value = taskValues?.[f.label] ?? f.value;
      const dot = f.options?.find((o) => o.label === value)?.color;
      return {
        label: f.label,
        value,
        ...(dot ? { dot } : {}),
        ...(f.label === 'Assignee' ? { kind: 'user' as const } : {}),
      };
    });

    const fields = taskMode ? TASK_FIELDS : knowledgeInfo ? KNOWLEDGE_FIELDS : registryDeployMode ? REGISTRY_DEPLOYMENT_FIELDS : packageDeployMode ? PACKAGE_DEPLOYMENT_FIELDS : patchDeployMode ? PATCH_DEPLOYMENT_FIELDS : endpointMode ? ENDPOINT_FIELDS : cveMode ? CVE_FIELDS : PATCH_FIELDS;

    const roRow = (f: PatchField) => {
      const empty = !f.value || f.value === '---';
      let valueNode: React.ReactNode;
      if (f.dot) {
        valueNode = (
          <span className="inline-flex items-center gap-2 text-[13px] text-[#364658] break-words">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.dot }} />
            {f.value}
          </span>
        );
      } else if (f.kind === 'severity' || f.kind === 'approval') {
        const color = f.kind === 'severity' ? severityColor(f.value) : approvalColor(f.value);
        valueNode = (
          <span className="inline-flex items-center gap-2 text-[13px] text-[#364658] break-words">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {f.value}
          </span>
        );
      } else if (f.kind === 'url') {
        valueNode = empty
          ? <span className="text-[13px] text-[#9CA3AF]">---</span>
          : <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#3D8BD0] hover:underline break-words">{f.value}</a>;
      } else if (f.kind === 'link') {
        valueNode = <span className="text-[13px] text-[#3D8BD0] cursor-pointer hover:underline break-words">{f.value}</span>;
      } else {
        valueNode = f.kind === 'user' && !empty ? (
          /* Person values carry the same square initials avatar the ticket page uses for the
             technician, so people read as people across the product. */
          <span className="inline-flex min-w-0 items-center gap-2">
            <span
              className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white"
              style={{ backgroundColor: '#3D8BD0' }}
            >
              {f.value.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 break-words text-[13px] text-[#3D8BD0]">{f.value}</span>
          </span>
        ) : (
          <span className={`text-[13px] break-words ${f.kind === 'user' ? 'text-[#3D8BD0]' : empty ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>{f.value}</span>
        );
      }
      // Scan-status pill (endpoint Scan Info rows) — stacked on its own line UNDER the date.
      const pillNode = f.pill && (
        <span className="mt-1.5 block">
          <span
            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium"
            style={f.pill === 'done' ? { backgroundColor: '#ECFDF3', color: '#067647' } : { backgroundColor: '#FFF8EB', color: '#B54708' }}
          >
            {f.pill === 'done' ? <CheckCircle size={11} /> : <Clock size={11} />}
            {f.pill === 'done' ? 'Completed' : 'In Progress'}
          </span>
        </span>
      );
      return (
        <Fragment key={f.label}>
          {f.section && (
            <div className="pt-3 border-t border-[#E5E7EB] mt-3">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1E293B]">{f.section}</div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">
              {f.info ? (
                <span className="inline-flex items-center gap-1">
                  {f.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-[#9CA3AF] transition-colors hover:text-[#64748B]"><Info size={12} /></span>
                    </TooltipTrigger>
                    {/* text-wrap overrides the base text-balance so the copy wraps naturally */}
                    <TooltipContent className="max-w-[240px] text-wrap">{f.info}</TooltipContent>
                  </Tooltip>
                </span>
              ) : f.label}
            </div>
            <div className="flex-1 min-w-0 px-3 py-2">
              {valueNode}
              {f.sub && <span className="mt-0.5 block text-[12px] text-[#9CA3AF]">{f.sub}</span>}
              {pillNode}
            </div>
          </div>
        </Fragment>
      );
    };

    // Tags (editable chip editor) — the one non-read-only row on this panel. Patch page: after
    // "Refrence Url"; Endpoint page: after "OS Version"; Knowledge page: after "Author" (last
    // field, like the ticket page); CVE page: after the 6 summary fields
    // (before the dates). The fallback keeps it findable when searching "tags".
    const tagsAfter = knowledgeInfo ? 'Author' : endpointMode ? 'OS Version' : cveMode ? 'Patch Availability' : 'Refrence Url';
    /* Task Key Information is EDITABLE, like the ticket page — a dropdown per option field
       (borderless trigger, chevron on hover) and an inline input for the date range. The
       other patch-family pages stay read-only. */
    const taskRow = (f: PatchField) => {
      /* Assignee gets the SAME user picker the ticket page uses (avatar chip, search,
         Unassigned, presence dots) — same list too, so the two pages agree. */
      if (f.label === 'Assignee') {
        const sel = OWNER_OPTIONS.find((o) => o.name === f.value) ?? null;
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Assignee</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {sel ? (
                    <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: sel.color }}>{sel.initials}</span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
                  )}
                </span>
                <button className={`${triggerClass} pl-9`} title={f.value} onClick={() => toggle('task:assignee')}>{f.value || 'Unassigned'}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'task:assignee' && (
                  <div className={menuClass}>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for users..."
                          autoFocus
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => { onTaskValueChange?.('Assignee', 'Unassigned'); setOpen(null); setOwnerSearch(''); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                          <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                        </span>
                        {!sel && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {OWNER_OPTIONS.filter((o) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o) => (
                        <button key={o.name} className={optionClass} onClick={() => { onTaskValueChange?.('Assignee', o.name); setOpen(null); setOwnerSearch(''); }}>
                          <span className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                            <span className="text-[13px] text-[#364658] truncate">{o.name}</span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="size-2 rounded-full" style={{ backgroundColor: o.status }} />
                            {f.value === o.name && <Check size={14} className="text-[#3D8BD0]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      /* The date range opens the Tasks-tab calendar popup: labelled Start / Due DateFields.
         Picks write the raw values AND the combined display string, so the popup and the
         expand modal stay in step. */
      if (f.label === 'Start Date - End Date') {
        const startV = taskValues?.['Start Date'] ?? '';
        const endV = taskValues?.['End Date'] ?? '';
        const fmtDT = (d: string) => `${new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        const display = startV && endV ? `${fmtDT(startV)} → ${fmtDT(endV)}` : startV ? fmtDT(startV) : endV ? fmtDT(endV) : f.value;
        const commit = (k: 'Start Date' | 'End Date', v: string) => {
          onTaskValueChange?.(k, v);
          const sVal = k === 'Start Date' ? v : startV;
          const eVal = k === 'End Date' ? v : endV;
          const disp = sVal && eVal ? `${fmtDT(sVal)} → ${fmtDT(eVal)}` : sVal ? fmtDT(sVal) : eVal ? fmtDT(eVal) : '';
          onTaskValueChange?.('Start Date - End Date', disp);
        };
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{f.label}</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={display} onClick={() => toggle('task:dates')}>{display || <span className="text-[#9CA3AF]">Select dates</span>}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'task:dates' && (
                  <div className="app-menu absolute top-full right-0 mt-1 w-full min-w-[280px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] p-4 z-50">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Start Date</label>
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1"><DateField mode="datetime" value={startV} onChange={(v) => commit('Start Date', v)} /></div>
                          {startV && (
                            <button title="Clear start date" onClick={() => commit('Start Date', '')} className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#EF4444]">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Due Date</label>
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1"><DateField mode="datetime" value={endV} onChange={(v) => commit('End Date', v)} /></div>
                          {endV && (
                            <button title="Clear due date" onClick={() => commit('End Date', '')} className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#EF4444]">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {(startV || endV || display) && (
                        <div className="flex justify-end border-t border-[#F0F2F5] pt-2.5">
                          <button
                            onClick={() => { onTaskValueChange?.('Start Date', ''); onTaskValueChange?.('End Date', ''); onTaskValueChange?.('Start Date - End Date', ''); }}
                            className="text-[12px] font-medium text-[#7B8FA5] transition-colors hover:text-[#EF4444]"
                          >
                            Clear dates
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      const def = TASK_KEY_FIELDS.find((k) => k.label === f.label);
      if (!def?.options) {
        return (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{f.label}</div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={f.value}
                onChange={(e) => onTaskValueChange?.(f.label, e.target.value)}
                className="w-full px-3 py-2 text-[13px] text-[#364658] bg-transparent rounded hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:bg-white transition-colors"
              />
            </div>
          </div>
        );
      }
      const dot = def.options.find((o) => o.label === f.value)?.color;
      const key = 'task:' + f.label;
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{f.label}</div>
          <div className="flex-1 min-w-0 relative">
            <button className={`${triggerClass} ${dot ? "pl-7" : "pl-3"} group/task relative`} onClick={() => toggle(key)}>
              {dot && <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full" style={{ backgroundColor: dot }} />}
              <span className="truncate">{f.value || '---'}</span>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B8FA5] opacity-0 group-hover/task:opacity-100 transition-opacity" />
            </button>
            {open === key && (
              <div className={menuClass}>
                {def.options.map((o) => (
                  <button key={o.label} className={optionClass} onClick={() => { onTaskValueChange?.(f.label, o.label); setOpen(null); }}>
                    <span className="flex items-center gap-2 text-[13px] text-[#364658]">
                      {o.color && <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />}
                      {o.label}
                    </span>
                    {f.value === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    const visible = fields.filter((f) => !q || f.label.toLowerCase().includes(q));
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {visible.map((f) => (
          <Fragment key={f.label}>
            {taskMode ? taskRow(f) : roRow(f)}
            {f.label === tagsAfter && tagsRow}
          </Fragment>
        ))}
        {q && 'tags'.includes(q) && !visible.some((f) => f.label === tagsAfter) && tagsRow}
      </div>
    );
  }

  // Software-license variant: only Product (read-only) + License Type (dropdown).
  if (licenseMode) {
    const filteredLicenseTypes = LICENSE_TYPE_OPTIONS.filter((o) => o.toLowerCase().includes(licenseTypeSearch.toLowerCase()));
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {/* Product (read-only) */}
        {(!q || 'product'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Product</div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-[#364658] px-3 py-2 block truncate">{state.product || '---'}</span>
            </div>
          </div>
        )}

        {/* License Type (dropdown) */}
        {(!q || 'license type'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">License Type</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={licenseType} onClick={() => toggle('licenseType')}>
                  {licenseType ? <span className="truncate">{licenseType}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'licenseType' && (
                  <div className={menuClass}>
                    <SearchBox value={licenseTypeSearch} onChange={setLicenseTypeSearch} />
                    <div className="max-h-[280px] overflow-y-auto">
                      {filteredLicenseTypes.map((o) => (
                        <button key={o} className={optionClass} onClick={() => { setLicenseType(o); setOpen(null); setLicenseTypeSearch(''); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {licenseType === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No System Fields here — the license page keeps just Product + License Type. */}
      </div>
    );
  }

  // Contract variant: contract number / dates / cost / type / vendor.
  if (contractMode) {
    const filteredContractTypes = CONTRACT_TYPE_OPTIONS.filter((o) => o.toLowerCase().includes(contractTypeSearch.toLowerCase()));
    const textRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          {editingField === label ? (
            <input
              autoFocus
              value={extra[label] || ''}
              onChange={(e) => updateExtra(label, e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
              className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
            />
          ) : (
            <div className="group/edit relative flex items-center">
              <span className={`text-[13px] px-3 py-2 truncate flex-1 ${extra[label] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra[label] || '---'}</span>
              <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );
    const dateRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
          </div>
        </div>
      </div>
    );
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {(!q || 'contract number'.includes(q)) && textRow('Contract Number')}
        {(!q || 'contract start date'.includes(q)) && dateRow('Contract Start Date')}
        {(!q || 'contract end date'.includes(q)) && dateRow('Contract End Date')}
        {(!q || 'cost'.includes(q)) && textRow('Cost')}
        {(!q || 'contract type'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Contract Type</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={extra['Contract Type']} onClick={() => toggle('contractType')}>
                  {extra['Contract Type'] ? <span className="truncate">{extra['Contract Type']}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'contractType' && (
                  <div className={menuClass}>
                    <SearchBox value={contractTypeSearch} onChange={setContractTypeSearch} />
                    <div className="max-h-[280px] overflow-y-auto">
                      {filteredContractTypes.map((o) => (
                        <button key={o} className={optionClass} onClick={() => { updateExtra('Contract Type', o); setOpen(null); setContractTypeSearch(''); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {extra['Contract Type'] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(!q || 'vendor'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Vendor</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Vendor'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Vendor'] || '---'}</span>
            </div>
          </div>
        )}

        {/* Tags — last upfront field before "View more" */}
        {tagsRow}

        {/* View more fields: Owner (user picker) + Department (dropdown) */}
        {(showMore || q) && (!q || 'owner'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Owner</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {owner ? (
                    <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: owner.color }}>{owner.initials}</span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
                  )}
                </span>
                <button className={`${triggerClass} pl-9`} title={owner?.name} onClick={() => toggle('owner')}>{owner?.name || 'Unassigned'}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'owner' && (
                  <div className={menuClass}>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for users..."
                          autoFocus
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => { setOwner(null); setOpen(null); setOwnerSearch(''); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                          <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                        </span>
                        {!owner && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {OWNER_OPTIONS.filter((o) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o) => (
                        <button key={o.name} className={optionClass} onClick={() => { setOwner(o); setOpen(null); setOwnerSearch(''); }}>
                          <span className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                            <span className="text-[13px] text-[#364658] truncate">{o.name}</span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="size-2 rounded-full" style={{ backgroundColor: o.status }} />
                            {owner?.name === o.name && <Check size={14} className="text-[#3D8BD0]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'department'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Department</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={extra['Department']} onClick={() => toggle('contractDepartment')}>
                  {extra['Department'] ? <span className="truncate">{extra['Department']}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'contractDepartment' && (
                  <div className={menuClass}>
                    <div className="max-h-[280px] overflow-y-auto">
                      {['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Procurement'].map((o) => (
                        <button key={o} className={optionClass} onClick={() => { updateExtra('Department', o); setOpen(null); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {extra['Department'] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Fields (moved here) — revealed by the SAME "View more" */}

        {/* View more / View less toggle (hidden while searching) */}
        {!q && (
          <div className="pt-1">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
            >
              {showMore ? 'View less' : 'View more'}
              {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Purchase variant: status / order number / cost / cost center / required & order dates.
  if (purchaseMode) {
    const purchaseStatusColor = PURCHASE_STATUS_OPTIONS.find((o) => o.label === status)?.color || '#9CA3AF';
    const textRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          {editingField === label ? (
            <input
              autoFocus
              value={extra[label] || ''}
              onChange={(e) => updateExtra(label, e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
              className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
            />
          ) : (
            <div className="group/edit relative flex items-center">
              <span className={`text-[13px] px-3 py-2 truncate flex-1 ${extra[label] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra[label] || '---'}</span>
              <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );
    const dateRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
          </div>
        </div>
      </div>
    );
    const selectRow = (label: string, options: string[]) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="group relative">
            <button className={`${triggerClass} pl-3`} title={extra[label]} onClick={() => toggle(label)}>
              {extra[label] ? <span className="truncate">{extra[label]}</span> : <span className="text-[#9CA3AF]">Select</span>}
            </button>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            {open === label && (
              <div className={menuClass}>
                <div className="max-h-[280px] overflow-y-auto">
                  {options.map((o) => (
                    <button key={o} className={optionClass} onClick={() => { updateExtra(label, o); setOpen(null); }}>
                      <span className="text-[13px] text-[#364658] truncate">{o}</span>
                      {extra[label] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {/* Status (read-only) */}
        {(!q || 'status'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Status</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: purchaseStatusColor }} />
                <span className={`text-[13px] truncate ${status ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{status || '---'}</span>
              </div>
            </div>
          </div>
        )}
        {(!q || 'order number'.includes(q)) && textRow('Order Number')}
        {(!q || 'cost (inr)'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Cost (INR)</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Cost (INR)'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Cost (INR)'] || '---'}</span>
            </div>
          </div>
        )}
        {(!q || 'cost center'.includes(q)) && selectRow('Cost Center', COST_CENTER_OPTIONS)}
        {(!q || 'purchase required by'.includes(q)) && dateRow('Purchase Required By')}
        {(!q || 'purchase order date'.includes(q)) && dateRow('Purchase Order Date')}

        {/* Tags — last upfront field before "View more" */}
        {tagsRow}

        {/* View more fields */}
        {(showMore || q) && (!q || 'owner'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Owner</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {owner ? (
                    <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: owner.color }}>{owner.initials}</span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
                  )}
                </span>
                <button className={`${triggerClass} pl-9`} title={owner?.name} onClick={() => toggle('owner')}>{owner?.name || 'Unassigned'}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'owner' && (
                  <div className={menuClass}>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for users..."
                          autoFocus
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => { setOwner(null); setOpen(null); setOwnerSearch(''); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                          <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                        </span>
                        {!owner && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {OWNER_OPTIONS.filter((o) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o) => (
                        <button key={o.name} className={optionClass} onClick={() => { setOwner(o); setOpen(null); setOwnerSearch(''); }}>
                          <span className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                            <span className="text-[13px] text-[#364658] truncate">{o.name}</span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="size-2 rounded-full" style={{ backgroundColor: o.status }} />
                            {owner?.name === o.name && <Check size={14} className="text-[#3D8BD0]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'vendor'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Vendor</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Vendor'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Vendor'] || '---'}</span>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'gl code'.includes(q)) && selectRow('GL Code', GL_CODE_OPTIONS)}
        {(showMore || q) && (!q || 'print template'.includes(q)) && selectRow('Print Template', ['Standard', 'Detailed', 'Compact'])}
        {(showMore || q) && (!q || 'invoice received'.includes(q)) && selectRow('Invoice Received', INVOICE_RECEIVED_OPTIONS)}
        {(showMore || q) && (!q || 'payment status'.includes(q)) && selectRow('Payment Status', PAYMENT_STATUS_OPTIONS)}
        {(showMore || q) && (!q || 'total invoice amount'.includes(q)) && textRow('Total Invoice Amount')}
        {(showMore || q) && (!q || 'total payment amount'.includes(q)) && textRow('Total Payment Amount')}

        {/* System Fields (moved here) — revealed by the SAME "View more" */}

        {/* View more / View less toggle (hidden while searching) */}
        {!q && (
          <div className="pt-1">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
            >
              {showMore ? 'View less' : 'View more'}
              {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-2" ref={ref}>
      {/* Asset Type */}
      {show('Asset Type') && (
      <FieldRow label={cmdbMode ? 'CI Type' : 'Asset Type'} pinned={pinnedFields.includes('Asset Type')} onPin={() => togglePinField('Asset Type')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none z-10">{assetTypeIcon(assetType)}</span>
          <button className={`${triggerClass} pl-9`} title={assetType} onClick={() => toggle('type')}>{assetType || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'type' && (
            <div className={menuClass}>
              <SearchBox value={typeSearch} onChange={setTypeSearch} />
              <div className="max-h-[280px] overflow-y-auto">
                {typeQuery
                  ? TYPE_TREE.flatMap((g) => g.children).filter((c) => c.toLowerCase().includes(typeQuery)).map((leaf) => (
                      <button key={leaf} className={`${optionClass} pl-6`} onClick={() => { setAssetType(leaf); setOpen(null); setTypeSearch(''); }}>
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[#6B7280] flex-shrink-0">{assetTypeIcon(leaf)}</span>
                          <span className="text-[13px] text-[#364658] truncate">{leaf}</span>
                        </span>
                        {assetType === leaf && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                    ))
                  : TYPE_TREE.map((g) => (
                      <div key={g.label}>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => setExpanded((s) => { const n = new Set(s); n.has(g.label) ? n.delete(g.label) : n.add(g.label); return n; })}
                        >
                          {expanded.has(g.label) ? <ChevronDown size={14} className="text-[#7B8FA5] flex-shrink-0" /> : <ChevronRight size={14} className="text-[#7B8FA5] flex-shrink-0" />}
                          <span className="text-[#6B7280] flex-shrink-0"><HardDrive size={14} /></span>
                          <span className="text-[13px] text-[#364658] truncate">{g.label}</span>
                        </button>
                        {expanded.has(g.label) && g.children.map((leaf) => (
                          <button key={leaf} className={`${optionClass} pl-10`} onClick={() => { setAssetType(leaf); setOpen(null); setTypeSearch(''); }}>
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[#6B7280] flex-shrink-0">{assetTypeIcon(leaf)}</span>
                              <span className="text-[13px] text-[#364658] truncate">{leaf}</span>
                            </span>
                            {assetType === leaf && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Status */}
      {show('Status') && (
      <FieldRow label="Status" pinned={pinnedFields.includes('Status')} onPin={() => togglePinField('Status')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: statusColor }} />
          <button className={`${triggerClass} pl-6`} title={status} onClick={() => toggle('status')}>{status || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'status' && (
            <div className={menuClass}>
              <SearchBox value={statusSearch} onChange={setStatusSearch} />
              {filteredStatus.map((o) => (
                <button key={o.label} className={optionClass} onClick={() => { setStatus(o.label); setOpen(null); setStatusSearch(''); }}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <span className="text-[13px] text-[#364658] truncate">{o.label}</span>
                  </span>
                  {status === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Impact */}
      {show('Impact') && (
      <FieldRow label="Impact" pinned={pinnedFields.includes('Impact')} onPin={() => togglePinField('Impact')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: impactColor }} />
          <button className={`${triggerClass} pl-6`} title={impact} onClick={() => toggle('impact')}>{impact || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'impact' && (
            <div className={menuClass}>
              {IMPACT_OPTIONS.map((o) => (
                <button key={o.label} className={optionClass} onClick={() => { setImpact(o.label); setOpen(null); }}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <span className="text-[13px] text-[#364658] truncate">{o.label}</span>
                  </span>
                  {impact === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Software Type (software assets only — not Non-IT) */}
      {softwareMode && !nonItMode && show('Software Type') && (
      <FieldRow label="Software Type" pinned={pinnedFields.includes('Software Type')} onPin={() => togglePinField('Software Type')}>
        <div className="group relative">
          <button className={`${triggerClass} pl-3`} title={softwareType} onClick={() => toggle('softwareType')}>
            {softwareType ? <span className="truncate">{softwareType}</span> : <span className="text-[#9CA3AF]">Select</span>}
          </button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'softwareType' && (
            <div className={menuClass}>
              <div className="max-h-[280px] overflow-y-auto">
                {SOFTWARE_TYPE_OPTIONS.map((o) => (
                  <button key={o} className={optionClass} onClick={() => { setSoftwareType(o); setOpen(null); }}>
                    <span className="text-[13px] text-[#364658] truncate">{o}</span>
                    {softwareType === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Managed By Group */}
      {show('Managed By Group') && (
      <FieldRow label="Managed By Group" pinned={pinnedFields.includes('Managed By Group')} onPin={() => togglePinField('Managed By Group')}>
        <div className="group relative">
          <button className={`${triggerClass} pl-3`} title={managedByGroup} onClick={() => toggle('group')}>{managedByGroup}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'group' && (
            <div className={menuClass}>
              <SearchBox value={groupSearch} onChange={setGroupSearch} />
              <div className="max-h-[280px] overflow-y-auto">
                {filteredGroups.map((o) => (
                  <button key={o} className={optionClass} onClick={() => { setManagedByGroup(o); setOpen(null); setGroupSearch(''); }}>
                    <span className="text-[13px] text-[#364658] truncate">{o}</span>
                    {managedByGroup === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Managed By */}
      {show('Managed By') && (
      <FieldRow label="Managed By" pinned={pinnedFields.includes('Managed By')} onPin={() => togglePinField('Managed By')}>
        <div className="group relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            {managedBy.initials ? (
              <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: managedBy.color || '#9CA3AF' }}>{managedBy.initials}</span>
            ) : (
              <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
            )}
          </span>
          <button className={`${triggerClass} pl-9`} title={managedBy.name} onClick={() => toggle('manager')}>{managedBy.name || 'Unassigned'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'manager' && (
            <div className={menuClass}>
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    autoFocus
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
                <button className="flex-shrink-0 size-8 flex items-center justify-center rounded border border-[#E5E7EB] text-[#3D8BD0] hover:bg-[#F3F4F6]" title="Filter">
                  <Filter size={14} />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={() => { setManagedBy({ name: 'Unassigned' }); setOpen(null); setManagerSearch(''); }}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                    <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                  </span>
                  {managedBy.name === 'Unassigned' && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
                {filteredManagers.map((o) => (
                  <button
                    key={o.email}
                    className={optionClass}
                    onClick={() => { setManagedBy({ name: o.name, initials: o.initials, color: o.color }); setOpen(null); setManagerSearch(''); }}
                  >
                    <span className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                      <span className="text-[13px] text-[#364658] truncate">{o.name} ({o.email})</span>
                    </span>
                    {managedBy.name === o.name && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* CI (hardware assets only) */}
      {!softwareMode && show('CI') && (
      <FieldRow label={cmdbMode ? 'Asset' : 'CI'} pinned={pinnedFields.includes('CI')} onPin={() => togglePinField('CI')}>
        <div className="px-0 py-2">
          {ci
            ? <span className="text-[13px] text-[#3D8BD0] cursor-pointer hover:underline">{ci}</span>
            : <span className="text-[13px] text-[#9CA3AF]">---</span>}
        </div>
      </FieldRow>
      )}

      {/* Tags — last upfront field before "View more" */}
      {tagsRow}

      {/* Additional fields behind "View more" — per-module field set (license/contract/purchase render their own set above and never reach here) */}
      {(showMore || q) && (cmdbMode ? CMDB_MORE_FIELDS : nonItMode ? NONIT_MORE_FIELDS : softwareMode ? SOFTWARE_MORE_FIELDS : ASSET_MORE_FIELDS).map(renderMoreField)}

      {/* System Fields (moved here) — revealed by the SAME "View more" */}

      {/* View more / View less toggle (hidden while searching) */}
      {!q && (
        <div className="pt-1">
          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
          >
            {showMore ? 'View less' : 'View more'}
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
