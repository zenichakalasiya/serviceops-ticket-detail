/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Search, X, Trash2, Plus, User, Download, RotateCcw, Power, ScanLine, PackagePlus, FileDown, ChevronDown, Check, Building2, LayoutGrid, List as ListIcon, Monitor } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { toast } from 'sonner';
import { Pagination } from '../Pagination';
import { OsBadge } from '../OsBadge';
import type { LucideIcon } from 'lucide-react';

export type Bucket = 'Missing' | 'Installed' | 'Ignored';

export interface PatchComputer {
  id: string;
  hostName: string;
  ipAddress: string;
  poller: string;
  createdBy: string;
  osName: string;
  version: string;
  servicePack: string;
  architecture: string;
  usedBy: string | null;
  systemHealth: 'Healthy' | 'Critical' | null;
  remoteOffice: string | null;
  bucket: Bucket;
}

/** Remote-office groups configured for the tenant. Real customers can run 100+ of these, which is
 *  why the group dropdown is searchable. A group may legitimately have no endpoints assigned. */
export const REMOTE_OFFICES = [
  'Ahmedabad HQ',
  'Bengaluru Campus',
  'Chennai Office',
  'Delhi NCR Office',
  'Dubai Office',
  'Frankfurt Office',
  'Hyderabad Office',
  'Kolkata Office',
  'London Office',
  'Mumbai Office',
  'Muscat Office',
  'New York Office',
  'Pune Development Center',
  'Singapore Office',
  'Sydney Office',
];

/* Bulk fleet generator — a real tenant has hundreds of endpoints missing a patch, so the grid needs
 * enough rows to exercise pagination. Index-based (not random) so the list is stable across renders
 * and every remote-office group gets endpoints. */
const OFFICE_CODES: [string, string][] = [
  ['Ahmedabad HQ', 'AHM'], ['Mumbai Office', 'MUM'], ['Bengaluru Campus', 'BLR'],
  ['Delhi NCR Office', 'DEL'], ['Pune Development Center', 'PUN'], ['Hyderabad Office', 'HYD'],
  ['Chennai Office', 'MAA'], ['Kolkata Office', 'CCU'], ['Muscat Office', 'MCT'],
  ['Dubai Office', 'DXB'], ['Singapore Office', 'SIN'], ['London Office', 'LON'],
  ['Frankfurt Office', 'FRA'], ['New York Office', 'NYC'], ['Sydney Office', 'SYD'],
];
const OS_POOL = [
  'Microsoft Windows 11 Pro', 'Microsoft Windows 10 Pro', 'Microsoft Windows 11 Enterprise',
  'Microsoft Windows 10 Enterprise', 'Microsoft Windows Server 2022', 'Ubuntu Linux 22.04 LTS', 'macOS 14 Sonoma',
];
const VERSION_POOL = ['8.7.301', '8.7.404', '8.7.408', '8.6.300', '8.6.101', '8.7.200'];
const OWNER_POOL = [
  'Priya Nair', 'Ananya Iyer', 'Karan Malhotra', 'Rahul Verma', 'Neha Raje', 'Vikram Sethi',
  'Farah Sheikh', 'Rohan Mehta', 'Diya Kapoor', 'Siddharth Rao',
];

const BULK_MISSING: PatchComputer[] = Array.from({ length: 52 }, (_, i): PatchComputer => {
  const [remoteOffice, code] = OFFICE_CODES[i % OFFICE_CODES.length];
  const kind = ['LT', 'DT', 'WS'][i % 3];
  return {
    id: `EP-${501 + i}`,
    hostName: `${code}-${kind}-${String(100 + i).padStart(4, '0')}`,
    ipAddress: `10.${20 + (i % 6)}.${30 + (i % 40)}.${20 + (i % 200)}`,
    poller: i % 4 === 0 ? 'Default' : '---',
    createdBy: i % 5 === 0 ? 'System' : 'Default',
    osName: OS_POOL[i % OS_POOL.length],
    version: VERSION_POOL[i % VERSION_POOL.length],
    servicePack: 'None',
    architecture: '64 BIT',
    usedBy: i % 3 === 0 ? OWNER_POOL[i % OWNER_POOL.length] : null,
    systemHealth: i % 7 === 0 ? 'Critical' : i % 2 === 0 ? 'Healthy' : null,
    remoteOffice,
    bucket: 'Missing',
  };
});

// Realistic agent/computer inventory (mock) split across the three patch buckets.
export const INITIAL_COMPUTERS: PatchComputer[] = [
  { id: 'EP-380', hostName: 'ACIWSUSV-01', ipAddress: '192.168.1.13', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Ahmedabad HQ', bucket: 'Missing' },
  { id: 'EP-397', hostName: 'Jevyjava-LT', ipAddress: '192.168.112.75', poller: '---', createdBy: '---', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.404', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Ahmedabad HQ', bucket: 'Missing' },
  { id: 'EP-400', hostName: 'PARTH-UPADHYAY', ipAddress: '192.168.1.75', poller: '---', createdBy: 'default', osName: 'Ubuntu Linux 22.04 LTS', version: '8.6.300', servicePack: '---', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: null, bucket: 'Missing' },
  { id: 'EP-396', hostName: 'DESKTOP-A19KJ', ipAddress: '10.20.41.40', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.7.200', servicePack: '---', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Mumbai Office', bucket: 'Missing' },
  { id: 'EP-392', hostName: 'DHRUVPANCHAL', ipAddress: '10.20.40.202', poller: '---', createdBy: 'RW', osName: 'macOS 14 Sonoma', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Ahmedabad HQ', bucket: 'Missing' },
  { id: 'EP-391', hostName: 'Adarsh-PC', ipAddress: '192.168.1.11', poller: '---', createdBy: 'Adarsh Fuinnc', osName: 'Microsoft Windows 10 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Bengaluru Campus', bucket: 'Missing' },
  { id: 'EP-389', hostName: 'DESKTOP-N81KQ', ipAddress: '10.20.41.103', poller: '---', createdBy: 'Default', osName: 'Red Hat Enterprise Linux 9', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: 'requester test', systemHealth: null, remoteOffice: null, bucket: 'Missing' },
  { id: 'EP-388', hostName: 'PARTH-UPADHYAY-2', ipAddress: '10.20.40.182', poller: '---', createdBy: 'Default', osName: 'macOS 15 Sequoia', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Mumbai Office', bucket: 'Missing' },
  { id: 'EP-386', hostName: 'DESKTOP-DK09P', ipAddress: '192.168.0.104', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: 'Chintan Makwana', systemHealth: 'Healthy', remoteOffice: 'Bengaluru Campus', bucket: 'Missing' },
  { id: 'EP-384', hostName: 'ARJUN-CHAUHAN', ipAddress: '192.168.1.14', poller: '---', createdBy: 'arjun system', osName: 'Microsoft Windows 10 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Pune Development Center', bucket: 'Missing' },
  { id: 'EP-383', hostName: 'DESKTOP-5F2AL', ipAddress: '192.168.29.101', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Delhi NCR Office', bucket: 'Missing' },
  { id: 'EP-382', hostName: 'ACI10068-LP', ipAddress: '20.0.20.32', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Ahmedabad HQ', bucket: 'Missing' },
  { id: 'EP-350', hostName: 'DESKTOP-1P8YT', ipAddress: '192.168.177.20', poller: '---', createdBy: 'default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Muscat Office', bucket: 'Missing' },
  { id: 'EP-349', hostName: 'DESKTOP-1KQZ9', ipAddress: '10.59.98.96', poller: '---', createdBy: 'default', osName: 'Microsoft Windows 11 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Muscat Office', bucket: 'Missing' },

  { id: 'EP-311', hostName: 'FIN-LT-0188', ipAddress: '10.20.22.188', poller: 'Default', createdBy: 'Priya Nair', osName: 'Microsoft Windows 11 Pro', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: 'Priya Nair', systemHealth: 'Healthy', remoteOffice: 'Mumbai Office', bucket: 'Installed' },
  { id: 'EP-305', hostName: 'SAL-LT-0204', ipAddress: '10.20.23.204', poller: 'Default', createdBy: 'Ananya Iyer', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: 'Ananya Iyer', systemHealth: 'Healthy', remoteOffice: 'Bengaluru Campus', bucket: 'Installed' },
  { id: 'EP-298', hostName: 'ENG-LT-0312', ipAddress: '10.20.19.112', poller: 'Default', createdBy: 'Karan Malhotra', osName: 'Microsoft Windows 11 Pro', version: '8.7.404', servicePack: 'None', architecture: '64 BIT', usedBy: 'Karan Malhotra', systemHealth: 'Healthy', remoteOffice: 'Hyderabad Office', bucket: 'Installed' },
  { id: 'EP-284', hostName: 'DC1-APP-01', ipAddress: '10.20.40.21', poller: 'Default', createdBy: 'System', osName: 'Microsoft Windows Server 2019', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Ahmedabad HQ', bucket: 'Installed' },
  { id: 'EP-277', hostName: 'DC1-DB-01', ipAddress: '10.20.40.33', poller: 'Default', createdBy: 'System', osName: 'Microsoft Windows Server 2022', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Ahmedabad HQ', bucket: 'Installed' },

  { id: 'EP-260', hostName: 'REC-DT-0023', ipAddress: '10.20.21.23', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Critical', remoteOffice: 'Muscat Office', bucket: 'Ignored' },
  { id: 'EP-241', hostName: 'SUP-LT-0108', ipAddress: '10.20.24.108', poller: '---', createdBy: 'Rahul Verma', osName: 'Microsoft Windows 11 Pro', version: '8.6.300', servicePack: 'None', architecture: '64 BIT', usedBy: 'Rahul Verma', systemHealth: null, remoteOffice: 'Mumbai Office', bucket: 'Ignored' },
  { id: 'EP-233', hostName: 'OFC-PRT-0207', ipAddress: '10.20.30.207', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'Dubai Office', bucket: 'Ignored' },

  ...BULK_MISSING,
];

/* --- Installation (deployment) records: agents this patch has been pushed to. --------------- */
export type InstallationStatus = 'Yet to Receive' | 'In Progress' | 'Success' | 'Failed';

export interface PatchInstallation {
  id: string;
  agentId: string;
  hostName: string;
  ipAddress: string;
  configType: string;
  deploymentDate: string;
  installationStatus: InstallationStatus;
  retryStatus: number;
  downloadStatus: string;
  taskType: string;
  // Present ONLY on the Patch DEPLOYMENT page's patch×endpoint deployment matrix — one row per
  // (patch, endpoint) pair, so the grid can show WHICH patch landed on WHICH endpoint + filter.
  patchId?: string;
  patchName?: string;
  patchSeverity?: 'Critical' | 'Important' | 'Moderate' | 'Low';
  result?: string;
}

// A realistic deployment run across the fleet (hosts match INITIAL_COMPUTERS):
// 6 Success · 2 Failed · 3 In Progress · 3 Yet to Receive = 14 deployments.
export const INITIAL_INSTALLATIONS: PatchInstallation[] = [
  { id: 'INST-EP-380', agentId: 'EP-380', hostName: 'ACIWSUSV-01', ipAddress: '192.168.1.13', configType: 'Install', deploymentDate: '---', installationStatus: 'Yet to Receive', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-EP-397', agentId: 'EP-397', hostName: 'Jevyjava-LT', ipAddress: '192.168.112.75', configType: 'Install', deploymentDate: 'Mon, Jul 20, 2026 04:58 PM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-EP-400', agentId: 'EP-400', hostName: 'PARTH-UPADHYAY', ipAddress: '192.168.1.75', configType: 'Install', deploymentDate: 'Mon, Jul 20, 2026 03:40 PM', installationStatus: 'Failed', retryStatus: 2, downloadStatus: 'Failed', taskType: 'Manual Remote Deployment' },
  { id: 'INST-EP-396', agentId: 'EP-396', hostName: 'DESKTOP-A19KJ', ipAddress: '10.20.41.40', configType: 'Install', deploymentDate: 'Tue, Jul 21, 2026 10:12 AM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-392', agentId: 'EP-392', hostName: 'DHRUVPANCHAL', ipAddress: '10.20.40.202', configType: 'Install', deploymentDate: 'Tue, Jul 21, 2026 11:03 AM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-391', agentId: 'EP-391', hostName: 'Adarsh-PC', ipAddress: '192.168.1.11', configType: 'Install', deploymentDate: 'Wed, Jul 22, 2026 09:26 AM', installationStatus: 'In Progress', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-389', agentId: 'EP-389', hostName: 'DESKTOP-N81KQ', ipAddress: '10.20.41.103', configType: 'Install', deploymentDate: '---', installationStatus: 'Yet to Receive', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-388', agentId: 'EP-388', hostName: 'PARTH-UPADHYAY-2', ipAddress: '10.20.40.182', configType: 'Install', deploymentDate: 'Tue, Jul 21, 2026 02:45 PM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-EP-386', agentId: 'EP-386', hostName: 'DESKTOP-DK09P', ipAddress: '192.168.0.104', configType: 'Install', deploymentDate: 'Wed, Jul 22, 2026 09:41 AM', installationStatus: 'In Progress', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-384', agentId: 'EP-384', hostName: 'ARJUN-CHAUHAN', ipAddress: '192.168.1.14', configType: 'Install', deploymentDate: 'Tue, Jul 21, 2026 05:17 PM', installationStatus: 'Failed', retryStatus: 1, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-383', agentId: 'EP-383', hostName: 'DESKTOP-5F2AL', ipAddress: '192.168.29.101', configType: 'Install', deploymentDate: 'Tue, Jul 21, 2026 06:02 PM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-382', agentId: 'EP-382', hostName: 'ACI10068-LP', ipAddress: '20.0.20.32', configType: 'Install', deploymentDate: '---', installationStatus: 'Yet to Receive', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-EP-350', agentId: 'EP-350', hostName: 'DESKTOP-1P8YT', ipAddress: '192.168.177.20', configType: 'Install', deploymentDate: 'Wed, Jul 22, 2026 08:19 AM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
  { id: 'INST-EP-349', agentId: 'EP-349', hostName: 'DESKTOP-1KQZ9', ipAddress: '10.59.98.96', configType: 'Install', deploymentDate: 'Wed, Jul 22, 2026 08:33 AM', installationStatus: 'In Progress', retryStatus: 0, downloadStatus: 'Success', taskType: 'Auto Patch Deployment' },
];

const BUCKETS: Bucket[] = ['Missing', 'Installed', 'Ignored'];

/** Remote-office groups an endpoint can belong to. "All Endpoints" = no group filter. */
const ALL_ENDPOINTS = 'All Endpoints';

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

// Agent Credential Profile — the stored credential the agent authenticates with. Derived
// deterministically per endpoint (the mock fleet has no such field), OS-appropriate.
const CRED_WIN = ['Default Windows Credential', 'Corp Domain Admin', 'Local Admin — Workstations', 'Service Account — svc_patch'];
const CRED_NIX = ['Linux SSH Key — infra', 'Root SSH — datacenter', 'Ansible Service Account'];
const credentialProfile = (c: PatchComputer) => {
  const nix = /mac|os x|darwin|linux|ubuntu|red hat|rhel|centos|debian|suse|fedora/i.test(c.osName);
  const pool = nix ? CRED_NIX : CRED_WIN;
  let n = 0;
  for (let i = 0; i < c.id.length; i++) n = (n * 31 + c.id.charCodeAt(i)) | 0;
  return pool[Math.abs(n) % pool.length];
};

interface PatchComputersTabProps {
  computers: PatchComputer[];
  setComputers: Dispatch<SetStateAction<PatchComputer[]>>;
  /** Install the given agents — creates deployment records in the Installation tab. */
  onInstall: (agentIds: string[]) => void;
  /** Patch DEPLOYMENT page: no Missing/Installed/Ignored sub-tabs — one flat endpoint list
   *  (and no bucket-scoped "Add Missing Computer" button). Opt-in; default unchanged. */
  hideBuckets?: boolean;
  /** Hide the per-row Actions column / card delete — deployment pages manage endpoints from the
   *  deployment itself, not row-by-row. Opt-in; default unchanged. */
  hideActions?: boolean;
  /** Slim column set (Detected CVE page): ID · Host Name · IP Address · OS Name · OS Version ·
   *  Architecture · Remote Office — drops the fleet-management columns. Opt-in. */
  slimColumns?: boolean;
  /** Hide row selection entirely (checkbox column + bulk "Take Action" bar) — pages where the
   *  endpoint list is read-only context rather than something you act on. */
  hideBulkSelect?: boolean;
  /** Package Deployment column set: Endpoint ID · Host Name · IP · Poller · OS Name · Agent
   *  Credential Profile · Version · Service Pack · Architecture · Used By · Remote Office. */
  packageColumns?: boolean;
}

export function PatchComputersTab({ computers, setComputers, onInstall, hideBuckets = false, hideActions = false, slimColumns = false, packageColumns = false, hideBulkSelect = false }: PatchComputersTabProps) {
  const [bucket, setBucket] = useState<Bucket>('Missing');
  const [search, setSearch] = useState('');
  // Card / List view toggle — card default (Deployment-tab parity).
  const [view, setView] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);
  // Remote-office group filter — scopes the whole tab, so the bucket counts reflect it too.
  const [office, setOffice] = useState<string>(ALL_ENDPOINTS);
  const [showOffice, setShowOffice] = useState(false);
  const [officeSearch, setOfficeSearch] = useState('');
  const officeOptions = [ALL_ENDPOINTS, ...REMOTE_OFFICES];
  const officeQuery = officeSearch.trim().toLowerCase();
  const filteredOffices = officeQuery ? officeOptions.filter((o) => o.toLowerCase().includes(officeQuery)) : officeOptions;
  const closeOfficeMenu = () => { setShowOffice(false); setOfficeSearch(''); };
  // Everything below (counts, rows, select-all) works off the office-scoped set.
  const scoped = office === ALL_ENDPOINTS ? computers : computers.filter((c) => c.remoteOffice === office);

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  // Bulk actions on the selected rows.
  const moveSelected = (to: Bucket, verb: string) => {
    const n = selected.size;
    setComputers((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, bucket: to } : c)));
    clearSelection();
    toast.success(`${n} computer${n > 1 ? 's' : ''} ${verb}`);
  };
  // Install Patch → push a deployment to the selected agents (they show up in the Installation
  // tab). The device stays "Missing" until its installation status turns Success.
  const installSelected = () => {
    onInstall(Array.from(selected));
    clearSelection();
  };
  const deleteSelected = () => {
    const n = selected.size;
    setComputers((prev) => prev.filter((c) => !selected.has(c.id)));
    clearSelection();
    toast.error(`${n} computer${n > 1 ? 's' : ''} removed`);
  };
  const notify = (msg: string) => { const n = selected.size; clearSelection(); toast.success(`${n} computer${n > 1 ? 's' : ''} — ${msg}`); };

  // Bulk actions available for the current bucket. `tone` drives styling; `danger` sorts last.
  type BulkAction = { key: string; label: string; icon: LucideIcon; tone?: 'primary' | 'danger'; buckets: Bucket[]; run: () => void };
  const ALL_ACTIONS: BulkAction[] = [
    { key: 'install', label: 'Install Patch', icon: Download, tone: 'primary', buckets: ['Missing', 'Ignored'], run: installSelected },
    { key: 'uninstall', label: 'Uninstall Patch', icon: RotateCcw, tone: 'primary', buckets: ['Installed'], run: () => moveSelected('Missing', 'marked as uninstalled') },
    { key: 'restore', label: 'Restore', icon: RotateCcw, buckets: ['Ignored'], run: () => moveSelected('Missing', 'restored') },
    { key: 'deploy', label: 'Add to Deployment', icon: PackagePlus, buckets: ['Ignored'], run: () => notify('added to deployment') },
    { key: 'scan', label: 'Scan Now', icon: ScanLine, buckets: ['Installed', 'Ignored'], run: () => notify('scan started') },
    { key: 'reboot', label: 'Reboot Computer', icon: Power, buckets: ['Installed', 'Ignored'], run: () => notify('reboot scheduled') },
    { key: 'export', label: 'Export Selected', icon: FileDown, buckets: ['Installed', 'Ignored'], run: () => notify('exported') },
    { key: 'delete', label: 'Delete', icon: Trash2, tone: 'danger', buckets: ['Missing', 'Installed', 'Ignored'], run: deleteSelected },
  ];
  // All bulk actions for the current bucket, shown in the single "Take Action" menu.
  const actions = ALL_ACTIONS.filter((a) => a.buckets.includes(bucket));

  const counts: Record<Bucket, number> = { Missing: 0, Installed: 0, Ignored: 0 };
  scoped.forEach((c) => { counts[c.bucket] += 1; });

  const q = search.trim().toLowerCase();
  const rows = scoped.filter((c) => hideBuckets || c.bucket === bucket).filter((c) =>
    !q ||
    c.id.toLowerCase().includes(q) ||
    c.hostName.toLowerCase().includes(q) ||
    c.ipAddress.toLowerCase().includes(q) ||
    c.osName.toLowerCase().includes(q) ||
    (c.usedBy ?? '').toLowerCase().includes(q)
  );

  // Pagination — the fleet can run to hundreds of endpoints.
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // Any change to the bucket / group / search resets to the first page.
  useEffect(() => { setCurrentPage(1); }, [bucket, office, search, view]);
  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const pageRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="@container px-6 py-4">
      {(() => {
        /* Group filter — scopes the endpoints AND the pill counts. Rendered in the top pills row
           normally; in hideBuckets (deployment page) mode it sits RIGHT of the search field, so
           its popup right-aligns to stay inside the viewport. */
        const officeFilter = (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowOffice((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${office !== ALL_ENDPOINTS ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            <Building2 size={14} className={office !== ALL_ENDPOINTS ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            {office}
            <ChevronDown size={14} className={`transition-transform ${showOffice ? 'rotate-180' : ''} ${office !== ALL_ENDPOINTS ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
          {showOffice && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeOfficeMenu} />
              <div className={`app-menu absolute ${hideBuckets ? 'right-0' : 'left-0'} top-full mt-1 z-50 w-[240px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1`}>
                {/* Search — tenants can have 100+ groups, so the list is filterable */}
                <div className="px-3 pb-2 pt-1">
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={officeSearch}
                      onChange={(e) => setOfficeSearch(e.target.value)}
                      placeholder="Search groups..."
                      className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                    />
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {filteredOffices.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-[#9CA3AF] text-center">No groups found</div>
                  ) : filteredOffices.map((o) => (
                    <button
                      key={o}
                      onClick={() => { setOffice(o); closeOfficeMenu(); setSelected(new Set()); }}
                      className={`w-full px-4 py-2 text-[13px] text-left transition-colors flex items-center justify-between gap-2 ${office === o ? 'bg-[#F1F5F9] text-[#364658]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                    >
                      <span className="truncate">{o}</span>
                      {office === o && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        );

        return (
        <>
        {/* Top row — office filter + bucket pills (Missing / Installed / Ignored).
            Skipped entirely in hideBuckets mode: the filter moves next to the search below. */}
        {!hideBuckets && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {officeFilter}
          <span className="h-5 w-px bg-[#E3E8EF] mx-0.5" />

          {BUCKETS.map((b) => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${bucket === b ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
            >
              {b}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${bucket === b ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
                {counts[b]}
              </span>
            </button>
          ))}
        </div>
        )}

      {/* Search + (deployment mode) office filter + Add button */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Select field to search..."
            className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
        {hideBuckets && officeFilter}
        {/* Add button — only for the Missing bucket (hidden entirely when buckets are off) */}
        {!hideBuckets && bucket === 'Missing' && (
          <button className="flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0] flex-shrink-0">
            <Plus size={15} />
            Add Missing Computer
          </button>
        )}
        {/* View toggle — Card · List (Deployment-tab parity) */}
        <div className="flex flex-shrink-0 overflow-hidden rounded border border-[#DFE5ED]">
          {([
            { key: 'card' as const, icon: <LayoutGrid size={15} />, tip: 'Card view' },
            { key: 'list' as const, icon: <ListIcon size={15} />, tip: 'List view' },
          ]).map((v, i) => (
            <Tooltip key={v.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setView(v.key)}
                  className={`flex h-8 w-9 items-center justify-center transition-colors ${i > 0 ? 'border-l border-[#DFE5ED]' : ''} ${view === v.key ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#364658] hover:bg-[#F3F4F6]'}`}
                >
                  {v.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>{v.tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
        </>
        );
      })()}

      {/* Bulk-action bar — appears when rows are selected. Single "Take Action" menu holds every
          action (scales to any number), with a selected-count chip + "Unselect all". */}
      {!hideBulkSelect && selected.size > 0 && (
        <div className="animate-slide-up relative z-30 mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[#E3E8EF] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_6px_rgba(16,24,40,0.06)]">
          {/* Take Action dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMore((v) => !v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded border bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors ${showMore ? 'border-[#3D8BD0] bg-[#F8FAFC]' : 'border-[#DFE5ED] hover:bg-[#F5F7FA]'}`}
            >
              Take Action <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="app-menu absolute left-0 top-full mt-1 z-50 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
                  {actions.map((a) => (
                    <div key={a.key}>
                      {a.tone === 'danger' && <div className="my-1 border-t border-[#F0F2F5]" />}
                      <button
                        onClick={() => { a.run(); setShowMore(false); }}
                        className={`w-full px-4 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 ${a.tone === 'danger' ? 'text-[#DC2626] hover:bg-[#FEF3F2]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                      >
                        <span className={`flex-shrink-0 ${a.tone === 'danger' ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}><a.icon size={15} /></span>
                        <span className="flex-1">{a.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Selected count + Unselect all */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#EAF2FB] text-[#3D8BD0] text-[12px] font-semibold tabular-nums">{selected.size}</span>
            <span className="text-[#64748B]">{selected.size === 1 ? 'record' : 'records'} selected</span>
            <span className="h-4 w-px bg-[#E3E8EF]" />
            <button onClick={clearSelection} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Unselect all</button>
          </div>
        </div>
      )}

      {view === 'card' ? (
        /* Card view — container-query responsive (Deployment-tab recipe): 1 col narrow,
           2 from @2xl, 3 from @4xl. Checkbox in the header keeps bulk-select working. */
        pageRows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#9CA3AF]">No {hideBuckets ? '' : bucket.toLowerCase() + ' '}endpoints found.</div>
        ) : (
        <div className="grid gap-4 grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {pageRows.map((c) => (
            <div key={c.id} className={`rounded-xl border bg-white p-4 transition-all ${!hideBulkSelect && selected.has(c.id) ? 'border-[#3D8BD0] shadow-sm' : 'border-[#E5E7EB] hover:border-[#3D8BD0] hover:shadow-sm'}`}>
              {/* Header: checkbox · icon badge · (health dot + EP pill + host) · delete */}
              <div className="flex items-start gap-3">
                {!hideBulkSelect && (
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={(e) => toggleRow(c.id, e.target.checked)}
                    className="mt-2.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                )}
                <OsBadge osName={c.osName} dotColor="#EAB308" size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{c.id}</span>
                  </div>
                  <button className="block mt-1 text-[13px] font-semibold text-[#3D8BD0] hover:underline truncate text-left max-w-full" title={c.hostName}>{c.hostName}</button>
                </div>
                {!hideActions && (
                  <button
                    title="Remove"
                    onClick={() => { setComputers((prev) => prev.filter((x) => x.id !== c.id)); setSelected((prev) => { const n = new Set(prev); n.delete(c.id); return n; }); toast.error(`${c.id} removed`); }}
                    className="flex-shrink-0 p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="mt-3 pt-3 border-t border-[#F0F2F5] grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">IP Address</div><div className="text-[12px] text-[#364658] truncate">{c.ipAddress}</div></div>
                {/* Package Deployment cards mirror that page's column set (Poller + Agent
                    Credential Profile + Service Pack, no System Health). */}
                {packageColumns && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Poller</div><div className="text-[12px] text-[#364658] truncate">{c.poller === '---' ? <Dash /> : c.poller}</div></div>}
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">OS Name</div><div className="text-[12px] text-[#364658] truncate" title={c.osName}>{c.osName}</div></div>
                {packageColumns && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Agent Credential Profile</div><div className="text-[12px] text-[#364658] truncate" title={credentialProfile(c)}>{credentialProfile(c)}</div></div>}
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">{slimColumns ? 'OS Version' : 'Version'}</div><div className="text-[12px] text-[#364658] truncate">{c.version}</div></div>
                {packageColumns && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Service Pack</div><div className="text-[12px] text-[#364658] truncate">{c.servicePack === '---' ? <Dash /> : c.servicePack}</div></div>}
                {/* Slim (Detected CVE) cards mirror that page's column set: Architecture instead of
                    the fleet-management fields. */}
                {(slimColumns || packageColumns) && (
                  <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Architecture</div><div className="text-[12px] text-[#364658] truncate">{c.architecture === '---' ? <Dash /> : c.architecture}</div></div>
                )}
                {!slimColumns && <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Used By</div><div className="text-[12px] truncate">{c.usedBy ? <span className="text-[#3D8BD0]">{c.usedBy}</span> : <Dash />}</div></div>}
                {!slimColumns && !packageColumns && (
                <div className="min-w-0">
                  <div className="text-[11px] text-[#9CA3AF]">System Health</div>
                  <div className="text-[12px] text-[#364658]">
                    {c.systemHealth ? (
                      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.systemHealth === 'Healthy' ? '#22C55E' : '#EF4444' }} />{c.systemHealth}</span>
                    ) : <Dash />}
                  </div>
                </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] text-[#9CA3AF]">Remote Office</div>
                  <div className="text-[12px]">{c.remoteOffice ? <span className="inline-block max-w-full truncate rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">{c.remoteOffice}</span> : <Dash />}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
      <>
      {/* Table — standard borderless style (matches the other detail-page tabs) */}
      <div className="overflow-x-auto">
        <table className={`w-full ${slimColumns ? 'min-w-[1000px]' : 'min-w-[1500px]'}`}>
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {!hideBulkSelect && (
                <th className="w-[40px] px-4 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every((c) => selected.has(c.id))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(pageRows.map((c) => c.id)) : new Set())}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                </th>
              )}
              {(slimColumns
                ? ['ID', 'Host Name', 'IP Address', 'OS Name', 'OS Version', 'Architecture', 'Remote Office']
                : packageColumns
                  ? ['Endpoint ID', 'Host Name', 'IP Address', 'Poller', 'OS Name', 'Agent Credential Profile', 'Version', 'Service Pack', 'Architecture', 'Used By', 'Remote Office']
                  : ['Agent ID', 'Host Name', 'IP Address', 'Poller', 'Agent Created By', 'OS Name', 'Version', 'Service Pack', 'Architecture', 'Used By', 'System Health', 'Remote Office', ...(hideActions ? [] : ['Actions'])]
              ).map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={(slimColumns ? 8 : packageColumns ? 12 : hideActions ? 13 : 14) - (hideBulkSelect ? 1 : 0)} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No {bucket.toLowerCase()} endpoints found.</td></tr>
            ) : pageRows.map((c) => (
              <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                {!hideBulkSelect && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={(e) => toggleRow(c.id, e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                    />
                  </td>
                )}
                {/* Agent ID with health dot */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <OsBadge osName={c.osName} dotColor="#EAB308" size="sm" />
                    <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{c.id}</button>
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[130px] truncate">{c.hostName}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.ipAddress}</td>
                {!slimColumns && <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.poller === '---' ? <Dash /> : c.poller}</td>}
                {!slimColumns && !packageColumns && <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.createdBy === '---' ? <Dash /> : c.createdBy}</td>}
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[160px] truncate">{c.osName}</span></td>
                {packageColumns && <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[190px] truncate">{credentialProfile(c)}</span></td>}
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.version}</td>
                {!slimColumns && <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.servicePack === '---' ? <Dash /> : c.servicePack}</td>}
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.architecture === '---' ? <Dash /> : c.architecture}</td>
                {!slimColumns && (
                  <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                    {c.usedBy ? (
                      <span className="inline-flex items-center gap-1.5 text-[#3D8BD0]"><User size={12} className="text-[#9ca3af]" /><span className="max-w-[120px] truncate">{c.usedBy}</span></span>
                    ) : <Dash />}
                  </td>
                )}
                {!slimColumns && !packageColumns && (
                  <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                    {c.systemHealth ? (
                      <span className="inline-flex items-center gap-1.5 text-[#364658]">
                        <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.systemHealth === 'Healthy' ? '#22C55E' : '#EF4444' }} />
                        {c.systemHealth}
                      </span>
                    ) : <Dash />}
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  {c.remoteOffice ? (
                    <span className="inline-block rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">{c.remoteOffice}</span>
                  ) : <Dash />}
                </td>
                {!hideActions && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      title="Remove"
                      onClick={() => { setComputers((prev) => prev.filter((x) => x.id !== c.id)); setSelected((prev) => { const n = new Set(prev); n.delete(c.id); return n; }); toast.error(`${c.id} removed`); }}
                      className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Pagination — shared component (same design as the list-page grids). Sticky to the bottom
          of the scroll viewport; the negative margins let it span the tab's horizontal padding and
          sit flush with the bottom edge. */}
      <div className="sticky bottom-0 z-30 -mx-6 -mb-4 bg-white">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={rows.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
}
