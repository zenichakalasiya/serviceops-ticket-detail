import { AppWindow, User } from 'lucide-react';
import type { SoftwareAsset, SoftwareStatus } from './SoftwareAssetsListPage';

interface SoftwareAssetsTableProps {
  assets: SoftwareAsset[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onSort: (column: keyof SoftwareAsset) => void;
  sortColumn: keyof SoftwareAsset | null;
  sortDirection: 'asc' | 'desc';
  onAssetClick?: (asset: SoftwareAsset) => void;
}

/* Mirrors MODULE_STATUS_OPTS.software in the data-grid — the routed listing. */
const SW_STATUS_COLOR: Record<SoftwareStatus, string> = {
  'In Stock': '#3D8BD0',
  'In Use': '#22C55E',
  Missing: '#EF4444',
  Retired: '#4B5563',
  'In Repair': '#F97316',
  Disposed: '#374151',
  Expired: '#EAB308',
  Decommission: '#94A3B8',
  Allocated: '#A3B2C2',
};
const statusColor = (s: SoftwareStatus) => SW_STATUS_COLOR[s] ?? '#94A3B8';

const impactColor = (impact: string) => {
  switch (impact) {
    case 'On Organization': return '#DC2626';
    case 'On Department': return '#D97706';
    case 'On Users': return '#A16207';
    default: return '#9CA3AF';
  }
};

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

export function SoftwareAssetsTable({
  assets,
  selected,
  allSelected,
  onSelectAll,
  onSelect,
  onAssetClick,
}: SoftwareAssetsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1500px]">
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
            <th className="min-w-[260px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Name</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Asset Type</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Status</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Version</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Software Type</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Managed By Group</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Managed By</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Impact</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Software Category</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {assets.map((a) => (
            <tr key={a.id} className="group hover:bg-[#f9fafb] transition-colors">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={(e) => onSelect(a.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>

              {/* ID */}
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onAssetClick?.(a)}
                  className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                >
                  {a.id}
                </button>
              </td>

              {/* Name */}
              <td className="px-4 py-3 text-[12px] text-[#364658]">
                <button
                  type="button"
                  onClick={() => onAssetClick?.(a)}
                  className="block max-w-[320px] truncate font-medium text-left hover:text-[#3D8BD0] transition-colors"
                >
                  {a.name}
                </button>
              </td>

              {/* Asset Type */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#364658]">
                  <span className="text-[#6B7280] flex-shrink-0"><AppWindow size={14} /></span>
                  {a.assetType}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#364658]">
                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(a.status) }} />
                  {a.status}
                </span>
              </td>

              {/* Version */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {a.version === '---' ? <Dash /> : a.version}
              </td>

              {/* Software Type */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {a.softwareType}
              </td>

              {/* Managed By Group */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {a.managedByGroup}
              </td>

              {/* Managed By */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-2">
                  {a.managedBy.initials ? (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium text-white"
                      style={{ backgroundColor: a.managedBy.color || '#9CA3AF' }}
                    >
                      {a.managedBy.initials}
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]">
                      <User size={13} />
                    </span>
                  )}
                  <span className="text-[12px] text-[#364658]">{a.managedBy.name}</span>
                </span>
              </td>

              {/* Impact */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#364658]">
                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: impactColor(a.impact) }} />
                  {a.impact}
                </span>
              </td>

              {/* Software Category */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {a.softwareCategory === '---' ? <Dash /> : a.softwareCategory}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
