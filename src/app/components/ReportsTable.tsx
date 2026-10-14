import { Edit, CalendarClock, Copy, Trash2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

export interface ReportRow {
  id: string;
  name: string;
  createdDate: string;
  createdBy: string;
  /** The author's account has since been archived — shown as a grey suffix, per the product. */
  archived?: boolean;
  type: 'Tabular Report' | 'Matrix Report' | 'Summary Report' | 'Plugin Report' | 'Query Report';
}

/* Reports grid — Name · Created Date · Created By · Type · Action, in the same borderless
 * list-table language as every other listing (12px rows, hover-reveal actions). */
export function ReportsTable({ reports, onReportClick }: { reports: ReportRow[]; onReportClick?: (report: ReportRow) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead className="border-b border-[#e5e7eb]">
          <tr className="bg-white">
            {[
              ['Name', 'min-w-[280px]'],
              ['Created Date', 'min-w-[180px]'],
              ['Created By', 'min-w-[180px]'],
              ['Type', 'min-w-[140px]'],
              ['Action', 'min-w-[130px]'],
            ].map(([label, cls]) => (
              <th key={label} className={`${cls} px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]`}>
                <span className="whitespace-nowrap">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {reports.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No reports in this category yet.</td></tr>
          ) : reports.map((r) => (
            <tr key={r.id} className="group transition-colors hover:bg-[#f9fafb]">
              <td className="px-4 py-3">
                <button onClick={() => onReportClick?.(r)} className="max-w-[420px] truncate text-left text-[12px] font-medium text-[#3D8BD0] hover:underline" title={r.name}>
                  {r.name}
                </button>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{r.createdDate}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">
                {r.createdBy}
                {r.archived && <span className="text-[#9CA3AF]"> (Archived)</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{r.type}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {/* Row actions appear on hover, as on the other listings. */}
                <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {([
                    ['Edit', <Edit size={15} />, '#7B8FA5'],
                    ['Schedule', <CalendarClock size={15} />, '#7B8FA5'],
                    ['Duplicate', <Copy size={15} />, '#7B8FA5'],
                    ['Delete', <Trash2 size={15} />, '#EF4444'],
                  ] as const).map(([label, icon, color]) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <button className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]" style={{ color }}>
                          {icon}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
