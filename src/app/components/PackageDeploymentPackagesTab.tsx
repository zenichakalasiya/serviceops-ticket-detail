import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { PatchInstallation, InstallationStatus } from './upstream/PatchComputersTab';

/* Package DEPLOYMENT detail page — "Packages" tab: the software packages this deployment
 * installs. Standard borderless grid + search (Packages ID / Name / Install As User). */

interface DeployedPackage {
  id: string;
  name: string;
  /** Account the installer runs as — System User (silent) or the logged-in user. */
  installAsUser: 'System User' | 'Logged-in User';
}

// Packages carried by this deployment run (exported: the Overview KPI counts them).
export const DEPLOYED_PACKAGES: DeployedPackage[] = [
  { id: 'PKG-3', name: 'AnyDesk', installAsUser: 'System User' },
  { id: 'PKG-7', name: 'Google Chrome Enterprise', installAsUser: 'System User' },
  { id: 'PKG-12', name: 'Zoom Workplace', installAsUser: 'Logged-in User' },
  { id: 'PKG-15', name: '7-Zip', installAsUser: 'System User' },
];

/* The endpoints this package deployment targets. The Deployment tab shows the FULL package ×
 * endpoint matrix (every package on every endpoint). */
export const PACKAGE_DEPLOYMENT_ENDPOINTS = [
  { id: 'EP-433', hostName: 'DESKTOP-BLT4R02', ip: '10.20.40.182' },
  { id: 'EP-397', hostName: 'Jevyjava-LT', ip: '192.168.112.75' },
  { id: 'EP-386', hostName: 'DESKTOP-DK09P', ip: '192.168.0.104' },
];

// A deterministic status per (package, endpoint) cell so the matrix reads varied but stable.
const MATRIX_STATUS: InstallationStatus[] = ['Success', 'In Progress', 'Failed', 'Yet to Receive'];

/** Build the package × endpoint deployment matrix — one row per pair (the Deployment tab's rows). */
export function buildPackageDeploymentMatrix(): PatchInstallation[] {
  const rows: PatchInstallation[] = [];
  DEPLOYED_PACKAGES.forEach((p, pi) => {
    PACKAGE_DEPLOYMENT_ENDPOINTS.forEach((e, ei) => {
      const status = MATRIX_STATUS[(pi * 2 + ei) % MATRIX_STATUS.length];
      const done = status === 'Success' || status === 'Failed';
      rows.push({
        id: `INST-${p.id}-${e.id}`,
        agentId: e.id,
        hostName: e.hostName,
        ipAddress: e.ip,
        configType: 'Install',
        deploymentDate: done ? 'Thu, May 21, 2026 10:24 AM' : '---',
        installationStatus: status,
        retryStatus: status === 'Failed' ? 1 : 0,
        downloadStatus: 'Success',
        taskType: 'Auto Package Deployment',
        // Reuses the matrix fields — on this page they carry the PACKAGE (no severity).
        patchId: p.id,
        patchName: p.name,
        result: status === 'Success' ? 'INSTALLED' : status === 'Failed' ? 'FAILED' : '---',
      });
    });
  });
  return rows;
}

export function PackageDeploymentPackagesTab() {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = DEPLOYED_PACKAGES.filter((p) =>
    !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.installAsUser.toLowerCase().includes(q)
  );

  const headers = ['Packages ID', 'Name', 'Install As User'];

  return (
    <div className="px-6 py-4">
      {/* Search — compact (the grid has only three columns) */}
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
              <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No packages match your search.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{p.id}</span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[320px] truncate" title={p.name}>{p.name}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{p.installAsUser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
