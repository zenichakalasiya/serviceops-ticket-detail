import { Edit, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { TaskRow } from './TasksListPage';

interface TasksTableProps {
  tasks: TaskRow[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  /** Opens the parent record the task belongs to. */
  onReferenceClick?: (task: TaskRow) => void;
  /** Opens the task's own detail page. */
  onTaskClick?: (task: TaskRow) => void;
}

/* Status / priority dots use the same palette as every other list in the product, so a technician
   reads them the same way here as on the Request and Problem listings. */
const statusDot = (s: TaskRow['status']) =>
  s === 'Open' ? '#F59E0B'
    : s === 'In Progress' ? '#3D8BD0'
      : s === 'Closed' ? '#22A06B'
        : s === 'On Hold' ? '#8B5CF6'
          : '#94A3B8'; // Not Started

const prioDot = (p: TaskRow['priority']) =>
  p === 'Urgent' ? '#DC2626' : p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : p === 'Low' ? '#3D8BD0' : '#64748B';

const Dash = () => <span className="text-[#9CA3AF]">---</span>;

export function TasksTable({ tasks, selected, allSelected, onSelectAll, onSelect, onReferenceClick, onTaskClick }: TasksTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px]">
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
            {[
              ['Subject', 'min-w-[380px] text-left'],
              ['Reference', 'min-w-[160px] text-left'],
              ['Task Type', 'min-w-[150px] text-left'],
              ['Status', 'min-w-[140px] text-left'],
              ['Priority', 'min-w-[120px] text-left'],
              ['Due By Status', 'min-w-[180px] text-left'],
              ['Action', 'min-w-[110px] text-left'],
            ].map(([label, cls]) => (
              <th key={label} className={`${cls} px-4 py-2.5 text-[12px] font-semibold tracking-wider text-[#364658]`}>
                <span className="whitespace-nowrap">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {tasks.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No tasks match this view.</td></tr>
          ) : tasks.map((t) => (
            <tr key={t.id} className="group transition-colors hover:bg-[#f9fafb]">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={(e) => onSelect(t.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <button
                    onClick={() => onTaskClick?.(t)}
                    className="inline-block flex-shrink-0 rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                  >{t.id}</button>
                  <button
                    onClick={() => onTaskClick?.(t)}
                    className="block max-w-[420px] truncate text-left text-[12px] text-[#364658] transition-colors hover:text-[#3D8BD0]"
                    title={t.subject}
                  >{t.subject}</button>
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                {t.reference ? (
                  <button
                    onClick={() => onReferenceClick?.(t)}
                    className="text-[#3D8BD0] hover:underline"
                  >{t.reference}</button>
                ) : <Dash />}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{t.taskType}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: statusDot(t.status) }} />
                  {t.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: prioDot(t.priority) }} />
                  {t.priority}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                {t.overdueBy ? (
                  <span className="inline-flex items-center gap-1.5 text-[#DC2626]">
                    <AlertTriangle size={13} className="flex-shrink-0" />
                    {t.overdueBy}
                  </span>
                ) : <Dash />}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {/* Row actions appear on hover, as on the other listings. */}
                <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {([
                    ['Edit', <Edit size={15} />, '#7B8FA5'],
                    ['View', <Eye size={15} />, '#7B8FA5'],
                    ['Delete', <Trash2 size={15} />, '#EF4444'],
                  ] as const).map(([label, icon, color]) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <button
                          className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
                          style={{ color }}
                        >
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
