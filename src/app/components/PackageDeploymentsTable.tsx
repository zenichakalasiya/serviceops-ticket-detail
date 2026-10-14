import type { PackageDeployment } from './PackageDeploymentsListPage';

interface PackageDeploymentsTableProps {
  deployments: PackageDeployment[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  /** Opens the deployment's detail page as a drawer tab (wired once that page exists). */
  onDeploymentClick?: (deployment: PackageDeployment) => void;
}

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

// Deployment lifecycle status → colored dot (same palette as the Patch Deployments list).
const statusDot = (s: PackageDeployment['status']) =>
  s === 'Ready to Deploy' ? '#3D8BD0'
    : s === 'In Progress' ? '#F59E0B'
      : s === 'Completed' ? '#22A06B'
        : s === 'Expired' ? '#EF4444'
          : s === 'Draft' ? '#94A3B8'
            : '#6B7280'; // Cancelled

export function PackageDeploymentsTable({
  deployments,
  selected,
  allSelected,
  onSelectAll,
  onSelect,
  onDeploymentClick,
}: PackageDeploymentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1400px]">
        <thead className="border-b border-[#e5e7eb]">
          <tr className="bg-white">
            <th className="w-[40px] px-4 py-2.5 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
              />
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">ID</span></th>
            <th className="min-w-[280px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Name</span></th>
            <th className="min-w-[150px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Status</span></th>
            <th className="min-w-[220px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Deployment Policy</span></th>
            <th className="min-w-[190px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Install After</span></th>
            <th className="min-w-[200px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Expiry Date</span></th>
            <th className="min-w-[200px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Created Date</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {deployments.map((d) => (
            <tr key={d.id} className="group hover:bg-[#f9fafb] transition-colors">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={(e) => onSelect(d.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => onDeploymentClick?.(d)}
                  className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                >{d.id}</button>
              </td>
              <td className="px-4 py-3 text-[12px] text-[#364658]">
                <button
                  onClick={() => onDeploymentClick?.(d)}
                  className="block max-w-[380px] truncate text-left transition-colors hover:text-[#3D8BD0]"
                  title={d.name}
                >{d.name}</button>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: statusDot(d.status) }} />
                  {d.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[12px] text-[#364658]">
                <span className="block max-w-[240px] truncate" title={d.deploymentPolicy}>{d.deploymentPolicy}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{d.installAfter ?? <Dash />}</td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{d.expiryDate ?? <Dash />}</td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{d.createdDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
