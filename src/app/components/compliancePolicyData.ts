/* Compliance Policy (technician side) — the record, the endpoint fleet it points at, the
 * scan results it produces, and ONE live store every surface reads.
 *
 *   Rule  →  Benchmark (Admin)  →  Compliance Policy (here)
 *
 * A policy = ONE benchmark + the endpoints it assesses + its metadata (tags, config file type,
 * schedule, notify team). Content follows the ObserveOps compliance-settings prototype; the
 * device axis is mapped onto ServiceOps endpoints (Endpoint / Remote Office / Tag).
 *
 * The store is module-level (useSyncExternalStore) rather than page state because THREE
 * surfaces show a policy at once — the listing, its detail drawer (hosted by DrawerStack,
 * outside the listing) and the full-screen editor — and an edit, a scan or an enable toggle
 * must land in all three. Nothing persists across a reload. */
import { useSyncExternalStore } from 'react';
import { mockEndpoints } from './EndpointsListPage';
import { BENCHMARKS_SEED, benchmarkRuleIds, ruleById } from './complianceData';
import type { Benchmark, ComplianceType } from './complianceData';

/* ── Types ─────────────────────────────────────────────────────────────────────────────── */

export type DeviceAxis = 'endpoint' | 'office' | 'tag';
export type ConfigFileType = 'startup' | 'running';
export type Frequency = 'none' | 'once' | 'daily' | 'weekly' | 'monthly';

export interface PolicySchedule {
  frequency: Frequency;
  /** yyyy-mm-dd */
  startDate?: string;
  /** HH:mm, 24h */
  time?: string;
  /** 0 = Sunday … 6 = Saturday (weekly) */
  weekday?: number;
  /** 1–28 (monthly) */
  monthday?: number;
}

export interface ScanResult {
  /** ISO timestamp the scan finished. */
  at: string;
  compliant: number;
  nonCompliant: number;
  /** Endpoints the agent could not reach — counted, never scored. */
  notScanned: number;
  passed: number;
  failed: number;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** ONE benchmark per policy. */
  benchmarkId: string;
  /** Only for Router / Switch / Firewall benchmarks — read from a config file. */
  configType: ConfigFileType | null;
  axis: DeviceAxis;
  endpointIds: string[];
  offices: string[];
  deviceTags: string[];
  schedule: PolicySchedule;
  /** Technicians / groups told when a scan finishes. */
  notify: string[];
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastScan: ScanResult | null;
  scanning?: boolean;
}

export interface ComplianceEndpoint {
  id: string;
  hostName: string;
  ip: string;
  osName: string;
  /** The OS version label benchmarks are written for ("Debian Linux 11"). */
  osVersion: string;
  type: ComplianceType;
  office: string;
  tags: string[];
  agentOnline: boolean;
  /** true for endpoints that exist in the Endpoints module (so their row can open it). */
  real: boolean;
}

/* ── The fleet a policy can point at ───────────────────────────────────────────────────── */

/** The Endpoints module's machines that a benchmark is written for, mapped to its OS label. */
function osVersionOfEndpoint(os: string): { label: string; type: ComplianceType } | null {
  if (/ubuntu.*22\.04/i.test(os)) return { label: 'Ubuntu Linux 22.04 LTS', type: 'Linux' };
  if (/red hat.*9/i.test(os)) return { label: 'Red Hat Enterprise Linux 9', type: 'Linux' };
  if (/debian.*11/i.test(os)) return { label: 'Debian Linux 11', type: 'Linux' };
  if (/windows server 2019/i.test(os)) return { label: 'Windows Server 2019', type: 'Windows' };
  if (/windows server 2022/i.test(os)) return { label: 'Windows Server 2022', type: 'Windows' };
  return null;
}

/* Read lazily: this module and the Endpoints list page sit in one import cycle (via DrawerStack),
   so touching mockEndpoints at load time could meet it uninitialised. */
const realEndpoints = (): ComplianceEndpoint[] => mockEndpoints.flatMap((e) => {
  const v = osVersionOfEndpoint(e.osName);
  if (!v) return [];
  return [{
    id: e.id, hostName: e.hostName, ip: e.ipAddress, osName: e.osName, osVersion: v.label, type: v.type,
    office: e.remoteOffice ?? 'Ahmedabad HQ', tags: e.tags, agentOnline: e.agentOnline, real: true,
  }];
});

/* Servers and network devices the desktop-heavy Endpoints list does not carry, so every
   benchmark has a realistic set to point at. Hand-written — no generated names. */
const E = (id: string, hostName: string, ip: string, osName: string, osVersion: string, type: ComplianceType, office: string, tags: string[], agentOnline = true): ComplianceEndpoint =>
  ({ id, hostName, ip, osName, osVersion, type, office, tags, agentOnline, real: false });

const EXTRA: ComplianceEndpoint[] = [
  E('EP-512', 'AHM-WEB-01', '10.20.50.11', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Ahmedabad HQ', ['server', 'production', 'web']),
  E('EP-513', 'AHM-WEB-02', '10.20.50.12', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Ahmedabad HQ', ['server', 'production', 'web']),
  E('EP-514', 'AHM-API-01', '10.20.50.21', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Ahmedabad HQ', ['server', 'production']),
  E('EP-515', 'MUM-APP-03', '10.30.50.13', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Mumbai Office', ['server', 'production']),
  E('EP-516', 'MUM-BATCH-01', '10.30.50.40', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Mumbai Office', ['server', 'batch'], false),
  E('EP-517', 'PUN-BUILD-01', '10.40.50.10', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Pune Development Center', ['server', 'staging']),
  E('EP-518', 'PUN-BUILD-02', '10.40.50.11', 'Debian GNU/Linux 11 (bullseye)', 'Debian Linux 11', 'Linux', 'Pune Development Center', ['server', 'staging']),
  E('EP-521', 'AHM-DB-PG-01', '10.20.51.10', 'Red Hat Enterprise Linux 9.4', 'Red Hat Enterprise Linux 9', 'Linux', 'Ahmedabad HQ', ['server', 'production', 'database']),
  E('EP-522', 'AHM-DB-PG-02', '10.20.51.11', 'Red Hat Enterprise Linux 9.4', 'Red Hat Enterprise Linux 9', 'Linux', 'Ahmedabad HQ', ['server', 'production', 'database']),
  E('EP-523', 'BLR-K8S-NODE-01', '10.50.51.21', 'Red Hat Enterprise Linux 9.4', 'Red Hat Enterprise Linux 9', 'Linux', 'Bengaluru Campus', ['server', 'kubernetes']),
  E('EP-524', 'BLR-K8S-NODE-02', '10.50.51.22', 'Red Hat Enterprise Linux 9.4', 'Red Hat Enterprise Linux 9', 'Linux', 'Bengaluru Campus', ['server', 'kubernetes']),
  E('EP-525', 'BLR-K8S-NODE-03', '10.50.51.23', 'Red Hat Enterprise Linux 9.4', 'Red Hat Enterprise Linux 9', 'Linux', 'Bengaluru Campus', ['server', 'kubernetes'], false),
  E('EP-531', 'HYD-ML-GPU-01', '10.60.52.10', 'Ubuntu 22.04.4 LTS', 'Ubuntu Linux 22.04 LTS', 'Linux', 'Hyderabad Office', ['server', 'research']),
  E('EP-532', 'HYD-ML-GPU-02', '10.60.52.11', 'Ubuntu 22.04.4 LTS', 'Ubuntu Linux 22.04 LTS', 'Linux', 'Hyderabad Office', ['server', 'research']),
  E('EP-533', 'DEL-PROXY-01', '10.70.52.20', 'Ubuntu 22.04.4 LTS', 'Ubuntu Linux 22.04 LTS', 'Linux', 'Delhi NCR Office', ['server', 'dmz']),
  E('EP-541', 'AHM-DC-01', '10.20.53.10', 'Microsoft Windows Server 2019 Standard', 'Windows Server 2019', 'Windows', 'Ahmedabad HQ', ['server', 'domain controller']),
  E('EP-542', 'MUM-FS-01', '10.30.53.20', 'Microsoft Windows Server 2019 Standard', 'Windows Server 2019', 'Windows', 'Mumbai Office', ['server', 'file server']),
  E('EP-543', 'DXB-DC-01', '10.80.53.10', 'Microsoft Windows Server 2019 Standard', 'Windows Server 2019', 'Windows', 'Dubai Office', ['server', 'domain controller'], false),
  E('EP-551', 'AHM-PAY-APP-01', '10.20.54.10', 'Microsoft Windows Server 2022 Datacenter', 'Windows Server 2022', 'Windows', 'Ahmedabad HQ', ['server', 'pci', 'production']),
  E('EP-552', 'AHM-PAY-APP-02', '10.20.54.11', 'Microsoft Windows Server 2022 Datacenter', 'Windows Server 2022', 'Windows', 'Ahmedabad HQ', ['server', 'pci', 'production']),
  E('EP-553', 'MUM-PAY-DB-01', '10.30.54.20', 'Microsoft Windows Server 2022 Datacenter', 'Windows Server 2022', 'Windows', 'Mumbai Office', ['server', 'pci', 'database']),
  E('EP-554', 'BLR-RDS-01', '10.50.54.30', 'Microsoft Windows Server 2022 Standard', 'Windows Server 2022', 'Windows', 'Bengaluru Campus', ['server']),
  E('EP-561', 'AHM-BR-RTR-01', '10.20.1.1', 'Cisco IOS XE 17.9.4a', 'Cisco IOS XE 17.x', 'Router', 'Ahmedabad HQ', ['network', 'branch']),
  E('EP-562', 'MUM-BR-RTR-01', '10.30.1.1', 'Cisco IOS XE 17.9.4a', 'Cisco IOS XE 17.x', 'Router', 'Mumbai Office', ['network', 'branch']),
  E('EP-563', 'BLR-BR-RTR-01', '10.50.1.1', 'Cisco IOS XE 17.6.5', 'Cisco IOS XE 17.x', 'Router', 'Bengaluru Campus', ['network', 'branch']),
  E('EP-564', 'DXB-BR-RTR-01', '10.80.1.1', 'Cisco IOS XE 17.6.5', 'Cisco IOS XE 17.x', 'Router', 'Dubai Office', ['network', 'branch'], false),
  E('EP-566', 'AHM-EDGE-MX-01', '10.20.1.2', 'Junos OS 21.4R3', 'Junos OS 21.x', 'Router', 'Ahmedabad HQ', ['network', 'edge']),
  E('EP-571', 'AHM-CORE-SW-01', '10.20.2.1', 'Cisco IOS XE 17.9.4a', 'Cisco IOS XE 17.x', 'Switch', 'Ahmedabad HQ', ['network', 'core']),
  E('EP-572', 'AHM-CORE-SW-02', '10.20.2.2', 'Cisco IOS XE 17.9.4a', 'Cisco IOS XE 17.x', 'Switch', 'Ahmedabad HQ', ['network', 'core']),
  E('EP-573', 'AHM-DC-NX-01', '10.20.2.10', 'Cisco NX-OS 10.3(4a)', 'Cisco NX-OS 10.x', 'Switch', 'Ahmedabad HQ', ['network', 'datacenter']),
  E('EP-581', 'AHM-FW-01', '10.20.0.1', 'FortiOS 7.4.3', 'FortiOS 7.4', 'Firewall', 'Ahmedabad HQ', ['network', 'perimeter', 'pci']),
  E('EP-582', 'MUM-FW-01', '10.30.0.1', 'FortiOS 7.4.3', 'FortiOS 7.4', 'Firewall', 'Mumbai Office', ['network', 'perimeter']),
  E('EP-583', 'DXB-FW-01', '10.80.0.1', 'FortiOS 7.4.1', 'FortiOS 7.4', 'Firewall', 'Dubai Office', ['network', 'perimeter']),
  E('EP-586', 'AHM-PA-01', '10.20.0.5', 'PAN-OS 11.1.2', 'PAN-OS 11.x', 'Firewall', 'Ahmedabad HQ', ['network', 'perimeter']),
];

let fleet: ComplianceEndpoint[] | null = null;
export const complianceEndpoints = () => (fleet ??= [...realEndpoints(), ...EXTRA]);
export const complianceEndpoint = (id: string) => complianceEndpoints().find((e) => e.id === id);

/** Read from a config file — the only benchmarks where Startup vs Running means anything. */
export const CONFIG_TYPES: ComplianceType[] = ['Router', 'Switch', 'Firewall'];
export const needsConfigType = (b?: Benchmark) => !!b && CONFIG_TYPES.includes(b.type);

/** The endpoints a benchmark can assess: same Type AND same OS version. */
export const endpointsForBenchmark = (b?: Benchmark) =>
  b ? complianceEndpoints().filter((e) => e.type === b.type && e.osVersion === b.osVersion) : [];

export const benchmarkOf = (id: string) => BENCHMARKS_SEED.find((b) => b.id === id);

/** What the policy actually assesses, whichever axis was used to choose it. */
export function resolvedEndpoints(p: Pick<CompliancePolicy, 'benchmarkId' | 'axis' | 'endpointIds' | 'offices' | 'deviceTags'>) {
  const pool = endpointsForBenchmark(benchmarkOf(p.benchmarkId));
  if (p.axis === 'office') return pool.filter((e) => p.offices.includes(e.office));
  if (p.axis === 'tag') return pool.filter((e) => e.tags.some((t) => p.deviceTags.includes(t)));
  return pool.filter((e) => p.endpointIds.includes(e.id));
}

/* ── Results ──────────────────────────────────────────────────────────────────────────── */

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export type EndpointOutcome = 'Compliant' | 'Non-Compliant' | 'Not Scanned';
export interface EndpointResult { endpoint: ComplianceEndpoint; outcome: EndpointOutcome; passed: number; failed: number; score: number | null }

/** One endpoint's result for this policy's last scan — derived from (policy, endpoint, scan time),
 *  so the drawer, the listing and the KPI cards always agree. An unreachable agent is Not Scanned. */
export function endpointResults(p: CompliancePolicy): EndpointResult[] {
  const rules = benchmarkRuleIds(benchmarkOf(p.benchmarkId) ?? ({ groups: [] } as unknown as Benchmark)).length;
  return resolvedEndpoints(p).map((e) => {
    if (!p.lastScan || !e.agentOnline) return { endpoint: e, outcome: 'Not Scanned', passed: 0, failed: 0, score: null };
    const h = hash(`${p.id}|${e.id}|${p.lastScan.at}`);
    const failed = rules === 0 ? 0 : (h % 3 === 0 ? 0 : 1 + (h >>> 3) % Math.max(1, Math.ceil(rules / 3)));
    const passed = Math.max(0, rules - failed);
    return { endpoint: e, outcome: failed ? 'Non-Compliant' : 'Compliant', passed, failed, score: rules ? Math.round((passed / rules) * 100) : 100 };
  });
}

/** One rule's outcome across the scanned endpoints. */
export function ruleResults(p: CompliancePolicy) {
  const b = benchmarkOf(p.benchmarkId);
  if (!b) return [];
  const scanned = endpointResults(p).filter((r) => r.outcome !== 'Not Scanned');
  return benchmarkRuleIds(b).map((id, i) => {
    const r = ruleById(id)!;
    const failing = scanned.filter((s) => hash(`${p.id}|${s.endpoint.id}|${id}`) % (i % 2 ? 4 : 6) === 0 && s.failed > 0).length;
    return { rule: r, passed: scanned.length - failing, failed: failing };
  });
}

function summarise(p: CompliancePolicy, at: string): ScanResult {
  const res = endpointResults({ ...p, lastScan: { at, compliant: 0, nonCompliant: 0, notScanned: 0, passed: 0, failed: 0 } });
  return {
    at,
    compliant: res.filter((r) => r.outcome === 'Compliant').length,
    nonCompliant: res.filter((r) => r.outcome === 'Non-Compliant').length,
    notScanned: res.filter((r) => r.outcome === 'Not Scanned').length,
    passed: res.reduce((a, r) => a + r.passed, 0),
    failed: res.reduce((a, r) => a + r.failed, 0),
  };
}

/** Compliance score = checks passed ÷ checks run, across every scanned endpoint. */
export const scoreOf = (s: ScanResult | null) => (!s || s.passed + s.failed === 0 ? null : Math.round((s.passed / (s.passed + s.failed)) * 100));

/** What the listing's Status column says. */
export type PolicyStatus = 'Scanning' | 'Compliant' | 'Non-Compliant' | 'Not Scanned';
export const statusOf = (p: CompliancePolicy): PolicyStatus =>
  p.scanning ? 'Scanning' : !p.lastScan ? 'Not Scanned' : p.lastScan.nonCompliant > 0 ? 'Non-Compliant' : 'Compliant';
export { POLICY_STATUS_OPTIONS } from './complianceFilterAttrs';

/* ── Schedule wording ─────────────────────────────────────────────────────────────────── */

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th'}`;
const t12 = (t = '00:00') => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

export function scheduleLabel(s: PolicySchedule): string {
  switch (s.frequency) {
    case 'once': return `Once on ${fmtDay(s.startDate)} at ${t12(s.time)}`;
    case 'daily': return `Daily at ${t12(s.time)}`;
    case 'weekly': return `Every ${WEEKDAYS[s.weekday ?? 0]} at ${t12(s.time)}`;
    case 'monthly': return `Monthly on the ${ordinal(s.monthday ?? 1)} at ${t12(s.time)}`;
    default: return 'Not scheduled';
  }
}

/** The next time a schedule fires after `from` (a fixed demo clock keeps it stable). */
export function nextRun(s: PolicySchedule, from = NOW): Date | null {
  if (s.frequency === 'none') return null;
  const [h, m] = (s.time ?? '00:00').split(':').map(Number);
  const start = s.startDate ? new Date(`${s.startDate}T00:00`) : from;
  const d = new Date(Math.max(from.getTime(), start.getTime()));
  d.setHours(h, m, 0, 0);
  if (s.frequency === 'once') { const once = new Date(`${s.startDate}T${s.time ?? '00:00'}`); return once > from ? once : null; }
  for (let i = 0; i < 40; i++) {
    const c = new Date(d.getTime() + i * 864e5);
    if (c <= from) continue;
    if (s.frequency === 'daily') return c;
    if (s.frequency === 'weekly' && c.getDay() === (s.weekday ?? 0)) return c;
    if (s.frequency === 'monthly' && c.getDate() === (s.monthday ?? 1)) return c;
  }
  return null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = (iso?: string) => { if (!iso) return '—'; const d = new Date(`${iso.slice(0, 10)}T00:00`); return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtStamp = (d: Date | string | null | undefined) => {
  if (!d) return '—';
  const x = typeof d === 'string' ? new Date(d) : d;
  const h = x.getHours();
  return `${String(x.getDate()).padStart(2, '0')} ${MONTHS[x.getMonth()]} ${x.getFullYear()}, ${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** A fixed "now" so next-run times and relative stamps do not drift with the real clock. */
export const NOW = new Date('2026-10-19T11:00:00');

/* ── Seed ─────────────────────────────────────────────────────────────────────────────── */

type Seed = Omit<CompliancePolicy, 'lastScan' | 'createdAt' | 'updatedAt' | 'configType' | 'notify' | 'enabled' | 'endpointIds' | 'offices' | 'deviceTags'> &
  Partial<Pick<CompliancePolicy, 'configType' | 'notify' | 'enabled' | 'endpointIds' | 'offices' | 'deviceTags'>> & { created: string; scanned?: string };

const SEED: Seed[] = [
  { id: 'CP-101', name: 'Production Debian Web Tier', description: 'CIS Level 1 hardening for every customer-facing Debian web and API server.', tags: ['production', 'cis'], benchmarkId: 'BM-1', axis: 'tag', deviceTags: ['production'], schedule: { frequency: 'daily', startDate: '2026-09-01', time: '02:00' }, notify: ['IT Support Group', 'Sarah Johnson'], createdBy: 'Kavit Gohel', created: '2026-09-01T10:15', scanned: '2026-10-19T02:04' },
  { id: 'CP-102', name: 'Corporate Linux Baseline — Debian', description: 'The minimum hardening every Debian server must pass before it joins production.', tags: ['baseline'], benchmarkId: 'BM-10', axis: 'office', offices: ['Ahmedabad HQ', 'Mumbai Office'], schedule: { frequency: 'weekly', startDate: '2026-09-07', weekday: 0, time: '01:00' }, notify: ['IT Support Group'], createdBy: 'Kavit Gohel', created: '2026-09-07T09:40', scanned: '2026-10-19T01:06' },
  { id: 'CP-103', name: 'Build Servers — Staging Check', description: 'Pune build agents, checked against the corporate Debian baseline.', tags: ['staging'], benchmarkId: 'BM-10', axis: 'endpoint', endpointIds: ['EP-517', 'EP-518'], schedule: { frequency: 'none' }, notify: [], createdBy: 'Vasu Hirpara', created: '2026-10-02T15:20' },
  { id: 'CP-104', name: 'RHEL Database Cluster', description: 'PostgreSQL hosts on Red Hat 9 — CIS Level 1 Server.', tags: ['database', 'cis', 'production'], benchmarkId: 'BM-2', axis: 'tag', deviceTags: ['database'], schedule: { frequency: 'daily', startDate: '2026-08-20', time: '03:30' }, notify: ['Software Support Team', 'Priya Raut'], createdBy: 'Neha Shah', created: '2026-08-20T11:00', scanned: '2026-10-19T03:41' },
  { id: 'CP-105', name: 'Kubernetes Nodes — RHEL 9', description: 'Worker nodes in the Bengaluru cluster.', tags: ['kubernetes'], benchmarkId: 'BM-2', axis: 'office', offices: ['Bengaluru Campus'], schedule: { frequency: 'weekly', startDate: '2026-09-01', weekday: 3, time: '22:00' }, notify: ['Software Support Team'], createdBy: 'Dharti Patel', created: '2026-09-01T14:05', scanned: '2026-10-15T22:12' },
  { id: 'CP-106', name: 'Research GPU Hosts', description: 'Ubuntu 22.04 hosts used by the ML team.', tags: ['research'], benchmarkId: 'BM-3', axis: 'office', offices: ['Hyderabad Office'], schedule: { frequency: 'monthly', startDate: '2026-08-01', monthday: 1, time: '01:00' }, notify: ['Daniel Okafor'], createdBy: 'Kavit Gohel', created: '2026-08-01T12:30', scanned: '2026-10-01T01:18' },
  { id: 'CP-107', name: 'DMZ Proxy Hardening', description: '', tags: ['dmz'], benchmarkId: 'BM-3', axis: 'tag', deviceTags: ['dmz'], schedule: { frequency: 'none' }, notify: [], enabled: false, createdBy: 'Sarah Johnson', created: '2026-10-10T16:45' },
  { id: 'CP-108', name: 'Domain Controllers — Windows 2019', description: 'CIS Level 1 Member Server for every domain controller and file server.', tags: ['identity', 'cis'], benchmarkId: 'BM-4', axis: 'tag', deviceTags: ['domain controller', 'file server'], schedule: { frequency: 'weekly', startDate: '2026-09-01', weekday: 6, time: '23:00' }, notify: ['IT Support Group', 'Marcus Bell'], createdBy: 'Neha Shah', created: '2026-09-01T09:00', scanned: '2026-10-18T23:20' },
  { id: 'CP-109', name: 'PCI DSS Cardholder Servers', description: 'Password and service controls for servers in the cardholder data environment.', tags: ['pci-dss', 'audit'], benchmarkId: 'BM-12', axis: 'tag', deviceTags: ['pci'], schedule: { frequency: 'daily', startDate: '2026-09-27', time: '04:00' }, notify: ['IT Support Group', 'Sneha Kulkarni'], createdBy: 'Neha Shah', created: '2026-09-27T10:00', scanned: '2026-10-19T04:09' },
  { id: 'CP-110', name: 'Windows Server 2022 — Full CIS', description: '', tags: ['cis'], benchmarkId: 'BM-5', axis: 'office', offices: ['Ahmedabad HQ', 'Bengaluru Campus', 'Mumbai Office'], schedule: { frequency: 'monthly', startDate: '2026-09-01', monthday: 15, time: '02:00' }, notify: [], createdBy: 'Sarah Johnson', created: '2026-09-01T17:10', scanned: '2026-10-15T02:27' },
  { id: 'CP-111', name: 'Branch Routers — Startup Config', description: 'The configuration each branch router boots with.', tags: ['network', 'bfsi'], benchmarkId: 'BM-11', configType: 'startup', axis: 'tag', deviceTags: ['branch'], schedule: { frequency: 'weekly', startDate: '2026-10-02', weekday: 1, time: '05:00' }, notify: ['Network Operations'], createdBy: 'Dharti Patel', created: '2026-10-02T11:30', scanned: '2026-10-13T05:08' },
  { id: 'CP-112', name: 'Branch Routers — Running Config', description: 'What each branch router is actually running right now.', tags: ['network', 'drift'], benchmarkId: 'BM-6', configType: 'running', axis: 'tag', deviceTags: ['branch'], schedule: { frequency: 'daily', startDate: '2026-10-02', time: '06:00' }, notify: ['Network Operations'], createdBy: 'Dharti Patel', created: '2026-10-02T11:45', scanned: '2026-10-19T06:03' },
  { id: 'CP-113', name: 'Core Switching', description: '', tags: ['network'], benchmarkId: 'BM-8', configType: 'running', axis: 'endpoint', endpointIds: ['EP-571', 'EP-572'], schedule: { frequency: 'none' }, notify: [], createdBy: 'Vasu Hirpara', created: '2026-10-14T13:05' },
  { id: 'CP-114', name: 'Perimeter Firewalls', description: 'FortiGate perimeter firewalls at every office.', tags: ['network', 'perimeter', 'pci-dss'], benchmarkId: 'BM-9', configType: 'running', axis: 'tag', deviceTags: ['perimeter'], schedule: { frequency: 'daily', startDate: '2026-09-18', time: '01:30' }, notify: ['Network Operations', 'Ivan Petrov'], createdBy: 'Vasu Hirpara', created: '2026-09-18T17:12', scanned: '2026-10-19T01:36' },
  { id: 'CP-115', name: 'Firewall Policy Review (quarterly)', description: 'The custom firewall review for the external audit.', tags: ['audit'], benchmarkId: 'BM-13', configType: 'startup', axis: 'endpoint', endpointIds: ['EP-581'], schedule: { frequency: 'once', startDate: '2026-10-31', time: '10:00' }, notify: ['Sneha Kulkarni'], enabled: true, createdBy: 'Sarah Johnson', created: '2026-10-16T10:00' },
];

const seedPolicies = (): CompliancePolicy[] => SEED.map(({ created, scanned, ...s }) => {
  const p: CompliancePolicy = {
    configType: null, notify: [], enabled: true, endpointIds: [], offices: [], deviceTags: [],
    ...s, createdAt: created, updatedAt: scanned ?? created, lastScan: null,
  };
  if (scanned) p.lastScan = summarise(p, scanned);
  return p;
});

/* ── Store ────────────────────────────────────────────────────────────────────────────── */

/* The state sits on ONE global slot, not in module variables: Vite's hot reload can serve this
   module twice (one importer on the old URL, one on the new), and two copies of a store are two
   stores — the listing would open an editor the host never hears about. */
interface StoreState { policies: CompliancePolicy[] | null; subs: Set<() => void>; editor: EditorState; editorSubs: Set<() => void>; seq: number }
const S: StoreState = ((globalThis as any).__compliancePolicyStore ??= { policies: null, subs: new Set(), editor: null, editorSubs: new Set(), seq: 115 });
const all = () => (S.policies ??= seedPolicies());
const emit = () => S.subs.forEach((f) => f());
const set = (next: CompliancePolicy[]) => { S.policies = next; emit(); };
const subscribe = (f: () => void) => { S.subs.add(f); return () => S.subs.delete(f); };

export const usePolicies = () => useSyncExternalStore(subscribe, all);
export const getPolicy = (id: string) => all().find((p) => p.id === id);

/** LOCAL yyyy-mm-ddTHH:mm — the seed's stamps are local too, and toISOString would shift by the UTC offset. */
const stamp = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

export const policyStore = {
  save(p: Omit<CompliancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'lastScan' | 'createdBy'> & { id?: string }) {
    if (p.id && all().some((x) => x.id === p.id)) {
      set(all().map((x) => (x.id === p.id ? { ...x, ...p, id: x.id, updatedAt: stamp() } : x)));
      return p.id;
    }
    const id = `CP-${++S.seq}`;
    set([{ ...p, id, createdBy: 'Sarah Johnson', createdAt: stamp(), updatedAt: stamp(), lastScan: null }, ...all()]);
    return id;
  },
  remove(id: string) { set(all().filter((p) => p.id !== id)); },
  toggle(id: string, enabled?: boolean) { set(all().map((p) => (p.id === id ? { ...p, enabled: enabled ?? !p.enabled, updatedAt: stamp() } : p))); },
  setSchedule(id: string, schedule: PolicySchedule) { set(all().map((p) => (p.id === id ? { ...p, schedule, updatedAt: stamp() } : p))); },
  /** Runs a scan now: Scanning for a moment, then a fresh result. */
  run(id: string, onDone?: (p: CompliancePolicy) => void) {
    set(all().map((p) => (p.id === id ? { ...p, scanning: true } : p)));
    window.setTimeout(() => {
      const at = stamp();
      set(all().map((p) => (p.id === id ? { ...p, scanning: false, lastScan: summarise(p, at), updatedAt: at } : p)));
      const done = getPolicy(id);
      if (done) onDone?.(done);
    }, 2400);
  },
};

/* ── Editor (create / edit / clone) — one full-screen form, opened from anywhere ─────── */

export type EditorState = { mode: 'create' } | { mode: 'edit'; id: string } | { mode: 'clone'; id: string } | null;
export const openPolicyEditor = (e: EditorState) => { S.editor = e; S.editorSubs.forEach((f) => f()); };
const subscribeEditor = (f: () => void) => { S.editorSubs.add(f); return () => S.editorSubs.delete(f); };
export const usePolicyEditor = () => useSyncExternalStore(subscribeEditor, () => S.editor);

/** All the offices / tags the fleet carries (for the form's pickers). */
export const officesOf = (pool: ComplianceEndpoint[]) => [...new Set(pool.map((e) => e.office))].sort();
export const deviceTagsOf = (pool: ComplianceEndpoint[]) => [...new Set(pool.flatMap((e) => e.tags))].sort();
