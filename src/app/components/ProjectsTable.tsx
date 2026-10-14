import { FolderKanban, Hourglass, User } from 'lucide-react';
import type { Project, ProjectPriority, ProjectStatus } from './ProjectsListPage';

interface ProjectsTableProps {
  projects: Project[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onSort: (column: keyof Project) => void;
  sortColumn: keyof Project | null;
  sortDirection: 'asc' | 'desc';
  onProjectClick?: (project: Project) => void;
}

const statusColor = (s: ProjectStatus) =>
  s === 'Implementation' ? '#22C55E'
    : s === 'Planning' ? '#8B5CF6'
      : s === 'On Hold' ? '#D97706'
        : s === 'Completed' ? '#94A3B8'
          : s === 'Cancelled' ? '#EF4444'
            : '#3D8BD0'; // Open

const priorityColor = (p: ProjectPriority) =>
  p === 'Critical' ? '#DC2626' : p === 'High' ? '#F97316' : p === 'Medium' ? '#94A3B8' : '#22C55E';

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

const AVATAR_COLORS = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const fmtDT = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }) +
  ' ' +
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

/* "2 months 1 week" — the two largest units of a duration, screenshot style. */
const humanize = (ms: number) => {
  const DAY = 864e5;
  const units: [string, number][] = [
    ['month', 30 * DAY],
    ['week', 7 * DAY],
    ['day', DAY],
    ['hour', 3600e3],
  ];
  const parts: string[] = [];
  let rest = Math.abs(ms);
  for (const [name, size] of units) {
    if (parts.length === 2) break;
    const n = Math.floor(rest / size);
    if (n > 0) {
      parts.push(`${n} ${name}${n > 1 ? 's' : ''}`);
      rest -= n * size;
    }
  }
  return parts.length ? parts.join(' ') : 'less than an hour';
};

/* Due By is DERIVED from the end date against the live clock, like the detail
   pages' header chips: green comfortable, amber inside 30 days, red overdue
   (flipped hourglass), grey Met once completed. */
const dueInfo = (p: Project) => {
  if (!p.end || p.status === 'Cancelled') return null;
  if (p.status === 'Completed') return { label: 'Met', color: '#16A34A', flip: false };
  const diff = p.end.getTime() - Date.now();
  if (diff < 0) return { label: `${humanize(diff)} overdue`, color: '#DC2626', flip: true };
  return { label: `${humanize(diff)} left`, color: diff < 30 * 864e5 ? '#D97706' : '#16A34A', flip: false };
};

const TH = ({ label, minW }: { label: string; minW?: string }) => (
  <th className={`${minW ?? ''} px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider`}>
    <span className="whitespace-nowrap">{label}</span>
  </th>
);

/* done/total counters (Tasks · Milestones): green once everything is done. */
const CountCell = ({ done, total }: { done: number; total: number }) =>
  total === 0 ? (
    <Dash />
  ) : (
    <span className={`text-[12px] tabular-nums ${done === total ? 'font-medium text-[#16A34A]' : 'text-[#364658]'}`}>
      {done}/{total}
    </span>
  );

export function ProjectsTable({
  projects,
  selected,
  allSelected,
  onSelectAll,
  onSelect,
  onProjectClick,
}: ProjectsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1460px]">
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
            <TH label="ID" />
            <TH label="Name" minW="min-w-[260px]" />
            <TH label="Status" />
            <TH label="Priority" />
            <TH label="Owner" minW="min-w-[170px]" />
            <TH label="Project Start Date" minW="min-w-[180px]" />
            <TH label="Project End Date" minW="min-w-[180px]" />
            <TH label="Due By" minW="min-w-[170px]" />
            <TH label="Completion (%)" minW="min-w-[140px]" />
            <TH label="Tasks" />
            <TH label="Milestones" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {projects.map((p) => {
            const due = dueInfo(p);
            return (
              <tr key={p.id} className="group hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={(e) => onSelect(p.id, e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                </td>

                {/* ID */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onProjectClick?.(p)}
                    className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                  >
                    {p.id}
                  </button>
                </td>

                {/* Name */}
                <td className="px-4 py-3 text-[12px] text-[#364658]">
                  <button
                    type="button"
                    onClick={() => onProjectClick?.(p)}
                    className="inline-flex items-center gap-1.5 font-medium text-left hover:text-[#3D8BD0] transition-colors"
                  >
                    <span className="text-[#6B7280] flex-shrink-0"><FolderKanban size={14} /></span>
                    <span className="max-w-[300px] truncate">{p.name}</span>
                  </button>
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#364658]">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(p.status) }} />
                    {p.status}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#364658]">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColor(p.priority) }} />
                    {p.priority}
                  </span>
                </td>

                {/* Owner */}
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  {p.owner ? (
                    <span className="inline-flex items-center gap-2 text-[#364658]">
                      <span
                        className="flex size-5 items-center justify-center rounded text-[9px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: avatarColor(p.owner) }}
                      >
                        {initials(p.owner)}
                      </span>
                      {p.owner}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-[#9ca3af]">
                      <span className="flex size-5 items-center justify-center rounded bg-[#f3f4f6] text-[#9ca3af] flex-shrink-0">
                        <User size={11} />
                      </span>
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Start / End */}
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{p.start ? fmtDT(p.start) : <Dash />}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{p.end ? fmtDT(p.end) : <Dash />}</td>

                {/* Due By */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {due ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: due.color }}>
                      <Hourglass size={12} className="flex-shrink-0" style={due.flip ? { transform: 'scaleY(-1)' } : undefined} />
                      {due.label}
                    </span>
                  ) : (
                    <Dash />
                  )}
                </td>

                {/* Completion — number + the readiness-meter strip */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className="block h-[4px] w-16 overflow-hidden rounded-full bg-[#EEF1F4]">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${p.completion}%`, backgroundColor: p.completion === 100 ? '#16A34A' : '#3D8BD0' }}
                      />
                    </span>
                    <span className="text-[12px] tabular-nums text-[#364658]">{p.completion}%</span>
                  </span>
                </td>

                {/* Tasks / Milestones */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <CountCell done={p.tasksDone} total={p.tasksTotal} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <CountCell done={p.milestonesDone} total={p.milestonesTotal} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
