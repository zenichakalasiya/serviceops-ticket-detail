/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Calendar, User, ChevronDown, Search, Check, Tag, Users } from 'lucide-react';
import { DateField } from '../DateField';
import { useState, useRef, useEffect } from 'react';

interface Task {
  id: string;
  subject: string;
  userGroup: string;
  assignee: string;
  taskType: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  notifyBefore: string;
  notifyUnit: string;
  description: string;
  completed?: boolean;
}

interface TaskCardFieldsProps {
  task: Task;
  statusColors: Record<string, string>;
  priorityColors: Record<string, string>;
  onUpdateTask: (task: Task) => void;
}

export function TaskCardFields({ task, statusColors, priorityColors, onUpdateTask }: TaskCardFieldsProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showUserGroupDropdown, setShowUserGroupDropdown] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');

  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const taskTypeRef = useRef<HTMLDivElement>(null);
  const userGroupRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { label: 'Open', color: '#F59E0B' },
    { label: 'In Progress', color: '#3D8BD0' },
    { label: 'Pending', color: '#F59E0B' },
    { label: 'Rejected', color: '#EF4444' },
    { label: 'Resolved', color: '#10B981' },
    { label: 'Closed', color: '#9CA3AF' },
  ];

  const priorityOptions = [
    { label: 'Low', color: '#10B981' },
    { label: 'Normal', color: '#3D8BD0' },
    { label: 'High', color: '#F59E0B' },
    { label: 'Critical', color: '#EF4444' },
  ];

  const assigneeOptions = [
    { label: 'John Doe', initials: 'JD', color: '#3D8BD0', statusColor: '#10B981' },
    { label: 'Sarah Smith', initials: 'SS', color: '#F59E0B', statusColor: '#10B981' },
    { label: 'Michael Chen', initials: 'MC', color: '#8B5CF6', statusColor: '#EF4444' },
    { label: 'Emily Rodriguez', initials: 'ER', color: '#EC4899', statusColor: '#F59E0B' },
  ];

  const taskTypeOptions = ['General', 'Implementation', 'Documentation', 'Provisioning', 'Access Management', 'Security', 'Verification', 'Approval Processing'];
  const userGroupOptions = ['Unassigned', 'IT Support', 'HR', 'Facilities', 'Network', 'IT Security', 'Management'];

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
      if (taskTypeRef.current && !taskTypeRef.current.contains(event.target as Node)) {
        setShowTaskTypeDropdown(false);
      }
      if (userGroupRef.current && !userGroupRef.current.contains(event.target as Node)) {
        setShowUserGroupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Meta — fixed-width columns so fields align across cards; wraps to the next line on narrow screens */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Status */}
        <div className="relative group/f w-[110px]" ref={statusRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusDropdown(!showStatusDropdown);
            }}
            title="Status"
            className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded hover:bg-[#F5F7FA] transition-colors"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusOptions.find(opt => opt.label === task.status)?.color || '#7B8FA5' }}
            />
            <span className="text-[13px] font-medium text-[#364658]">{task.status}</span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>

          {showStatusDropdown && (
            <div className="app-menu absolute top-full left-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {statusOptions.map((option) => (
                <button
                  key={option.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ 
                      ...task, 
                      status: option.label,
                      completed: option.label === 'Closed' ? true : task.completed
                    });
                    setShowStatusDropdown(false);
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-[13px] text-[#364658]">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative group/f w-[105px]" ref={priorityRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPriorityDropdown(!showPriorityDropdown);
            }}
            title="Priority"
            className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded hover:bg-[#F5F7FA] transition-colors"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityColors[task.priority] || '#7B8FA5' }}
            />
            <span className="text-[13px] font-medium text-[#364658]">{task.priority}</span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>

          {showPriorityDropdown && (
            <div className="app-menu absolute top-full left-0 mt-1 w-full min-w-[140px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {priorityOptions.map((option) => (
                <button
                  key={option.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ ...task, priority: option.label });
                    setShowPriorityDropdown(false);
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-[13px] text-[#364658]">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task Type */}
        <div className="relative group/f w-[150px]" ref={taskTypeRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTaskTypeDropdown(!showTaskTypeDropdown); }}
            title="Task Type"
            className="flex w-full items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded-md hover:bg-[#F5F7FA] transition-colors"
          >
            <Tag size={13} className="text-[#7B8FA5] flex-shrink-0" />
            <span className="text-[13px] font-medium text-[#364658] truncate flex-1 text-left">{task.taskType || '—'}</span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>
          {showTaskTypeDropdown && (
            <div className="app-menu absolute top-full left-0 mt-1 min-w-[190px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50 max-h-[240px] overflow-y-auto">
              {taskTypeOptions.map((opt) => (
                <button
                  key={opt}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, taskType: opt }); setShowTaskTypeDropdown(false); }}
                >
                  <Tag size={13} className="text-[#7B8FA5] flex-shrink-0" />
                  <span className="text-[13px] text-[#364658]">{opt}</span>
                  {task.taskType === opt && <Check size={14} className="text-[#3D8BD0] ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Group */}
        <div className="relative group/f w-[135px]" ref={userGroupRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowUserGroupDropdown(!showUserGroupDropdown); }}
            title="User Group"
            className="flex w-full items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded-md hover:bg-[#F5F7FA] transition-colors"
          >
            <Users size={13} className="text-[#7B8FA5] flex-shrink-0" />
            <span className={`text-[13px] font-medium truncate flex-1 text-left ${task.userGroup && task.userGroup !== 'Unassigned' ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{task.userGroup || 'Unassigned'}</span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>
          {showUserGroupDropdown && (
            <div className="app-menu absolute top-full left-0 mt-1 min-w-[180px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50 max-h-[240px] overflow-y-auto">
              {userGroupOptions.map((opt) => (
                <button
                  key={opt}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, userGroup: opt }); setShowUserGroupDropdown(false); }}
                >
                  <Users size={13} className="text-[#7B8FA5] flex-shrink-0" />
                  <span className="text-[13px] text-[#364658]">{opt}</span>
                  {task.userGroup === opt && <Check size={14} className="text-[#3D8BD0] ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="relative group/f w-[160px]" ref={assigneeRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAssigneeDropdown(!showAssigneeDropdown);
            }}
            title="Assignee"
            className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded hover:bg-[#F5F7FA] transition-colors max-w-[180px]"
          >
            {task.assignee === 'Unassigned' ? (
              <div className="size-[16px] rounded-full border border-dashed border-[#9CA3AF] flex-shrink-0"></div>
            ) : (
              <div
                className="size-[18px] rounded flex items-center justify-center text-[8px] font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: assigneeOptions.find(opt => opt.label === task.assignee)?.color || '#3D8BD0' }}
              >
                {assigneeOptions.find(opt => opt.label === task.assignee)?.initials || task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <span className={`text-[13px] font-medium truncate ${task.assignee === 'Unassigned' ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>{task.assignee}</span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>

          {showAssigneeDropdown && (
            <div className="app-menu absolute top-full right-0 mt-1 w-full min-w-[240px] max-w-[260px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {/* Search Box */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search for users..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-9 pr-3 py-1.5 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Unassigned Option */}
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors border-b border-[#E5E7EB]"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTask({ ...task, assignee: 'Unassigned' });
                  setShowAssigneeDropdown(false);
                  setAssigneeSearchQuery('');
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0"></div>
                  <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                </div>
                {task.assignee === 'Unassigned' && (
                  <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />
                )}
              </button>
              
              {/* Assignee Options */}
              {assigneeOptions
                .filter(option => option.label.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
                .map((option) => (
                  <button
                    key={option.label}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTask({ ...task, assignee: option.label });
                      setShowAssigneeDropdown(false);
                      setAssigneeSearchQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      >
                        {option.initials}
                      </div>
                      <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div 
                        className="size-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.statusColor }}
                      />
                      {task.assignee === option.label && (
                        <Check size={14} className="text-[#3D8BD0]" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Start Date and End Date — flexes to fill the remaining card width so the range stays on one line */}
        <div className="relative group/f flex-1 min-w-[200px]" ref={dateRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDateDropdown(!showDateDropdown);
            }}
            title="Start Date – Due Date"
            className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-0.5 rounded hover:bg-[#F5F7FA] transition-colors"
          >
            <Calendar size={13} className="text-[#7B8FA5] flex-shrink-0" />
            <span className={`text-[13px] font-medium whitespace-nowrap ${task.startDate || task.endDate ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>
              {(() => {
                const fmt = (d: string) => `${formatDate(d)} ${new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                if (task.startDate && task.endDate) {
                  return task.startDate === task.endDate ? fmt(task.endDate) : `${fmt(task.startDate)} → ${fmt(task.endDate)}`;
                }
                if (task.endDate) return fmt(task.endDate);
                if (task.startDate) return fmt(task.startDate);
                return 'Set Due Date';
              })()}
            </span>
            <ChevronDown size={11} className="text-[#9CA3AF] opacity-0 group-hover/f:opacity-100 transition-opacity flex-shrink-0" />
          </button>

          {showDateDropdown && (
            <div className="app-menu absolute top-full right-0 mt-1 w-full min-w-[280px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] p-4 z-50">
              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Start Date</label>
                  <DateField mode="datetime" value={task.startDate} onChange={(v) => onUpdateTask({ ...task, startDate: v })} />
                </div>
                
                {/* End Date */}
                <div>
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Due Date</label>
                  <DateField mode="datetime" value={task.endDate} onChange={(v) => onUpdateTask({ ...task, endDate: v })} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}