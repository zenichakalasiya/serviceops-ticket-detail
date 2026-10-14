import { ArrowUpDown } from 'lucide-react';
import type { Problem } from './ProblemListPage';
import { ProblemStatusBadge } from './ProblemStatusBadge';
import { PriorityBar } from './PriorityBar';
import { AiSparkle } from './AiSparkle';

interface ProblemTableProps {
  problems: Problem[];
  selectedProblems: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectProblem: (problemId: string, checked: boolean) => void;
  onSort: (column: keyof Problem) => void;
  sortColumn: keyof Problem | null;
  sortDirection: 'asc' | 'desc';
  onProblemClick: (problem: Problem) => void;
}

export function ProblemTable({
  problems,
  selectedProblems,
  allSelected,
  onSelectAll,
  onSelectProblem,
  onSort,
  sortColumn,
  sortDirection,
  onProblemClick,
}: ProblemTableProps) {
  const formatDateTime = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes} PM`;
  };

  /* AI-suggested problem from the request-grouping engine — not a real record yet.
     Sits at slot 2; Requester/Assignee stay blank until Create Problem is confirmed. */
  const aiRow = (
    <tr
      key="__ai-suggested"
      className="cursor-pointer transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(115,30,251,0.25)]"
      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.05) 0%, rgba(115, 30, 251, 0.05) 41.49%, rgba(249, 17, 227, 0.05) 100%), #FFF' }}
      onClick={() => window.dispatchEvent(new CustomEvent('open-suggested-group', { detail: 'grp-2' }))}
    >
      <td className="px-4 py-3" />
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-semibold text-[#731EFB]"
          style={{ background: 'rgba(115, 30, 251, 0.08)' }}
        >
          <AiSparkle size={12} />
          AI
        </span>
      </td>
      <td className="px-4 py-3 text-[12px] text-[#364658]">
        <span className="inline-flex max-w-[420px] items-center gap-2">
          <span className="truncate font-medium">Onboarding requests stalled at AD account creation</span>
          <span className="flex-shrink-0 rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-semibold text-[#B45309]">Medium · 78%</span>
        </span>
      </td>
      <td className="px-4 py-3" />
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-[12px] text-[#64748B]">5h ago</span>
      </td>
      <td className="px-4 py-3" />
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#731EFB]">
          <span className="size-2 rounded-full bg-[#731EFB]" />
          Suggested
        </span>
      </td>
      <td className="px-4 py-3">
        <PriorityBar priority="Medium" />
      </td>
      <td className="px-4 py-3" />
    </tr>
  );

  const SortButton = ({ column, children }: { column: keyof Problem; children: React.ReactNode }) => (
    <button onClick={() => onSort(column)} className="flex items-center gap-1 hover:text-[#3D8BD0]">
      {children}
      <ArrowUpDown size={12} className={sortColumn === column ? 'text-[#3D8BD0]' : 'text-[#9ca3af]'} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px]">
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
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658]  tracking-wider">
              <span className="whitespace-nowrap">ID</span>
            </th>
            <th className="min-w-[280px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658]  tracking-wider">
              <span className="whitespace-nowrap">Subject</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658]  tracking-wider">
              <span className="whitespace-nowrap">Requester</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
              <span className="whitespace-nowrap">Created Date</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
              <span className="whitespace-nowrap">Assignee</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
              <span className="whitespace-nowrap">Status</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
              <span className="whitespace-nowrap">Priority</span>
            </th>
            <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
              <span className="whitespace-nowrap">Urgency</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {(() => {
            const renderRow = (problem: Problem) => (
            <tr
              key={problem.id}
              className="group hover:bg-[#f9fafb] transition-colors cursor-pointer"
              onClick={() => onProblemClick(problem)}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedProblems.has(problem.id)}
                  onChange={(e) => onSelectProblem(problem.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              <td className="px-4 py-3">
                <span
                  className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProblemClick(problem);
                  }}
                >
                  {problem.id}
                </span>
              </td>
              <td className="px-4 py-3 text-[12px] text-[#364658]">
                <span className="max-w-[350px] truncate font-medium inline-block">{problem.subject}</span>
              </td>
              <td className="px-4 py-3 text-[12px] text-[#364658] whitespace-nowrap">{problem.requester}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-[12px] text-[#364658]">{formatDateTime(problem.createdDate)}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: problem.assignee.color }}
                  >
                    {problem.assignee.initials}
                  </span>
                  <span className="text-[12px] text-[#364658]">{problem.assignee.name}</span>
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ProblemStatusBadge status={problem.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBar priority={problem.priority} />
              </td>
              <td className="px-4 py-3">
                <PriorityBar priority={problem.urgency} />
              </td>
            </tr>
            );
            return (
              <>
                {problems.slice(0, 1).map(renderRow)}
                {aiRow}
                {problems.slice(1).map(renderRow)}
              </>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}
