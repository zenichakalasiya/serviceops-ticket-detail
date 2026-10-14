import { KeyRound, SquarePen, Trash2 } from 'lucide-react';
import type { SoftwareLicense } from './SoftwareLicensesListPage';

interface SoftwareLicensesTableProps {
  licenses: SoftwareLicense[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onSort: (column: keyof SoftwareLicense) => void;
  sortColumn: keyof SoftwareLicense | null;
  sortDirection: 'asc' | 'desc';
  onLicenseClick?: (license: SoftwareLicense) => void;
}

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

const Count = ({ value }: { value: number | null }) =>
  value === null ? <Dash /> : <span className="text-[12px] text-[#364658]">{value}</span>;

export function SoftwareLicensesTable({
  licenses,
  selected,
  allSelected,
  onSelectAll,
  onSelect,
  onLicenseClick,
}: SoftwareLicensesTableProps) {
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
            <th className="min-w-[220px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Name</span></th>
            <th className="min-w-[200px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Product</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">License Type</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Purchase Count</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Allocation Count</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Installation Count</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Expiry Date</span></th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider"><span className="whitespace-nowrap">Action</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {licenses.map((l) => (
            <tr key={l.id} className="group hover:bg-[#f9fafb] transition-colors">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(l.id)}
                  onChange={(e) => onSelect(l.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>

              {/* ID */}
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onLicenseClick?.(l)}
                  className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                >
                  {l.id}
                </button>
              </td>

              {/* Name */}
              <td className="px-4 py-3 text-[12px] text-[#364658]">
                <button
                  type="button"
                  onClick={() => onLicenseClick?.(l)}
                  className="inline-flex items-center gap-1.5 font-medium text-left hover:text-[#3D8BD0] transition-colors"
                >
                  <span className="text-[#6B7280] flex-shrink-0"><KeyRound size={14} /></span>
                  <span className="max-w-[260px] truncate">{l.name}</span>
                </button>
              </td>

              {/* Product */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{l.product}</td>

              {/* License Type */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{l.licenseType}</td>

              {/* Purchase Count */}
              <td className="px-4 py-3 whitespace-nowrap"><Count value={l.purchaseCount} /></td>

              {/* Allocation Count */}
              <td className="px-4 py-3 whitespace-nowrap"><Count value={l.allocationCount} /></td>

              {/* Installation Count */}
              <td className="px-4 py-3 whitespace-nowrap"><Count value={l.installationCount} /></td>

              {/* Expiry Date */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {l.expiryDate ? l.expiryDate : <Dash />}
              </td>

              {/* Action */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <button className="text-[#6B7280] hover:text-[#3D8BD0] transition-colors" title="Edit">
                    <SquarePen size={15} />
                  </button>
                  <button className="text-[#DC2626] hover:text-[#b91c1c] transition-colors" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
