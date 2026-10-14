import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { PatchInstallation, InstallationStatus } from './upstream/PatchComputersTab';

/* Registry DEPLOYMENT detail page — "Registry" tab: the registry configurations this deployment
 * applies. Standard borderless grid + compact search (Name / Description). */

interface RegistryEntry {
  name: string;
  description: string;
  /** Root hive the key lives under — not a column, but it drives the Overview donut split. */
  hive: 'HKEY_LOCAL_MACHINE' | 'HKEY_CURRENT_USER';
}

// Registry configurations carried by this deployment run (exported: the Overview KPI counts them).
export const REGISTRY_ENTRIES: RegistryEntry[] = [
  { name: 'Disable Windows 10 Notification', description: 'Disables Windows 10 Upgrade Notification', hive: 'HKEY_LOCAL_MACHINE' },
  { name: 'Disable SMBv1 Client', description: 'Removes SMBv1 client protocol support from the endpoint', hive: 'HKEY_LOCAL_MACHINE' },
  { name: 'Enable Script Block Logging', description: 'Turns on PowerShell script block logging for audit trails', hive: 'HKEY_LOCAL_MACHINE' },
  { name: 'Set Screen Lock Timeout', description: 'Locks the console after 10 minutes of inactivity', hive: 'HKEY_CURRENT_USER' },
  { name: 'Disable Autorun on Removable Media', description: 'Blocks autorun and autoplay for USB and optical drives', hive: 'HKEY_LOCAL_MACHINE' },
  { name: 'Hide Recently Opened Documents', description: 'Clears and hides the recent documents list at sign-out', hive: 'HKEY_CURRENT_USER' },
];

/* The endpoints this registry deployment targets. The Deployment tab shows the FULL registry
 * template × endpoint matrix (every configuration on every endpoint). */
export const REGISTRY_DEPLOYMENT_ENDPOINTS = [
  { id: 'EP-424', hostName: 'Dharati-Bhimani', ip: '10.20.40.124' },
  { id: 'EP-486', hostName: 'Vasu-Hirpara', ip: '10.20.41.86' },
  { id: 'EP-607', hostName: 'V5LAP0248', ip: '10.20.22.207' },
];

// A deterministic status per (template, endpoint) cell so the matrix reads varied but stable.
const MATRIX_STATUS: InstallationStatus[] = ['Success', 'In Progress', 'Failed', 'Yet to Receive'];

/** Build the registry template × endpoint matrix — one row per pair (the Deployment tab's rows). */
export function buildRegistryDeploymentMatrix(): PatchInstallation[] {
  const rows: PatchInstallation[] = [];
  REGISTRY_ENTRIES.forEach((entry, ri) => {
    REGISTRY_DEPLOYMENT_ENDPOINTS.forEach((e, ei) => {
      const status = MATRIX_STATUS[(ri * 2 + ei) % MATRIX_STATUS.length];
      const done = status === 'Success' || status === 'Failed';
      rows.push({
        id: `INST-REG${ri + 1}-${e.id}`,
        agentId: e.id,
        hostName: e.hostName,
        ipAddress: e.ip,
        configType: 'Install',
        deploymentDate: done ? 'Thu, Jun 18, 2026 09:12 AM' : '---',
        installationStatus: status,
        retryStatus: status === 'Failed' ? 1 : 0,
        downloadStatus: 'Success',
        taskType: 'Manual Remote Deployment',
        // Reuses the matrix fields — on this page they carry the registry TEMPLATE (name only).
        patchId: `REG-${ri + 1}`,
        patchName: entry.name,
        result: status === 'Success' ? 'APPLIED' : status === 'Failed' ? 'FAILED' : '---',
      });
    });
  });
  return rows;
}

export function RegistryDeploymentRegistryTab() {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = REGISTRY_ENTRIES.filter((r) =>
    !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
  );

  const headers = ['Name', 'Description'];

  return (
    <div className="px-6 py-4">
      {/* Search — compact (the grid has only two columns) */}
      <div className="relative mb-3 w-full max-w-[280px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No registry configurations match your search.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.name} className="transition-colors hover:bg-[#f9fafb]">
                <td className="w-1/2 px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[420px] truncate" title={r.name}>{r.name}</span></td>
                <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[520px] truncate" title={r.description}>{r.description}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
