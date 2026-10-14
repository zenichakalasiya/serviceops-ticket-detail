/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, ChevronDown, Clock } from 'lucide-react';
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
}

interface TaskFormPanelProps {
  task?: Task | null;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>) => void;
}

export function TaskFormPanel({ task, onClose, onSave }: TaskFormPanelProps) {
  const [formData, setFormData] = useState({
    subject: task?.subject || '',
    userGroup: task?.userGroup || 'Unassigned',
    assignee: task?.assignee || 'Unassigned',
    taskType: task?.taskType || 'General',
    startDate: task?.startDate || '',
    endDate: task?.endDate || '',
    status: task?.status || 'Open',
    priority: task?.priority || 'Normal',
    notifyBefore: task?.notifyBefore || '1',
    notifyUnit: task?.notifyUnit || 'Hours',
    description: task?.description || '',
  });

  const [showUserGroupDropdown, setShowUserGroupDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showNotifyUnitDropdown, setShowNotifyUnitDropdown] = useState(false);

  const userGroupRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const taskTypeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const notifyUnitRef = useRef<HTMLDivElement>(null);

  const userGroupOptions = ['Unassigned', 'IT Support', 'HR Team', 'Finance', 'Operations'];
  const assigneeOptions = [
    { label: 'Unassigned' },
    { label: 'John Doe' },
    { label: 'Sarah Smith' },
    { label: 'Michael Chen' },
    { label: 'Emily Rodriguez' },
  ];
  const taskTypeOptions = ['General', 'Development', 'Bug Fix', 'Documentation', 'Testing'];
  const statusOptions = [
    { label: 'Open', color: '#3D8BD0' },
    { label: 'In Progress', color: '#F59E0B' },
    { label: 'On Hold', color: '#9CA3AF' },
    { label: 'Completed', color: '#10B981' },
    { label: 'Cancelled', color: '#EF4444' },
  ];
  const priorityOptions = [
    { label: 'Low', color: '#10B981' },
    { label: 'Normal', color: '#3D8BD0' },
    { label: 'High', color: '#F59E0B' },
    { label: 'Critical', color: '#EF4444' },
  ];

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userGroupRef.current && !userGroupRef.current.contains(event.target as Node)) {
        setShowUserGroupDropdown(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (taskTypeRef.current && !taskTypeRef.current.contains(event.target as Node)) {
        setShowTaskTypeDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (notifyUnitRef.current && !notifyUnitRef.current.contains(event.target as Node)) {
        setShowNotifyUnitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[1000]"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-[600px] max-w-[95vw] bg-white shadow-2xl z-[1001] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE5ED]">
          <h2 className="text-lg font-semibold text-[#364658]">
            {task ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#7B8FA5] hover:text-[#364658]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-xs text-[#7B8FA5] mb-1.5">
                Subject <span className="text-[#E74C3C]">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter task subject"
                className="w-full px-3 py-2 text-sm border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0] transition-colors"
              />
            </div>

            {/* User Group and Assignee */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">User Group</label>
                <div className="group relative" ref={userGroupRef}>
                  <button
                    onClick={() => setShowUserGroupDropdown(!showUserGroupDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {formData.userGroup}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showUserGroupDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {userGroupOptions.map((option) => (
                        <button
                          key={option}
                          className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, userGroup: option });
                            setShowUserGroupDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658]">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">Assignee</label>
                <div className="group relative" ref={assigneeRef}>
                  <button
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {formData.assignee}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showAssigneeDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {assigneeOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, assignee: option.label });
                            setShowAssigneeDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658]">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-xs text-[#7B8FA5] mb-1.5">Task Type</label>
              <div className="group relative" ref={taskTypeRef}>
                <button
                  onClick={() => setShowTaskTypeDropdown(!showTaskTypeDropdown)}
                  className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                >
                  {formData.taskType}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                
                {showTaskTypeDropdown && (
                  <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                    {taskTypeOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, taskType: option });
                          setShowTaskTypeDropdown(false);
                        }}
                      >
                        <span className="text-[13px] text-[#364658]">{option}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date and End Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">
                  Start Date <span className="text-[#E74C3C]">*</span>
                </label>
                <DateField mode="datetime" value={formData.startDate} onChange={(v) => setFormData({ ...formData, startDate: v })} />
              </div>

              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">End Date</label>
                <DateField mode="datetime" value={formData.endDate} onChange={(v) => setFormData({ ...formData, endDate: v })} />
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">Status</label>
                <div className="group relative" ref={statusRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {formData.status}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showStatusDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {statusOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, status: option.label });
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
              </div>

              <div>
                <label className="block text-xs text-[#7B8FA5] mb-1.5">Priority</label>
                <div className="group relative" ref={priorityRef}>
                  <button
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {formData.priority}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showPriorityDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, priority: option.label });
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
              </div>
            </div>

            {/* Notify Before */}
            <div>
              <label className="block text-xs text-[#7B8FA5] mb-1.5">Notify Before</label>
              <div className="flex w-full">
                <input
                  type="number"
                  value={formData.notifyBefore}
                  onChange={(e) => setFormData({ ...formData, notifyBefore: e.target.value })}
                  className="w-20 px-3 py-2 text-sm border border-r-0 border-[#DFE5ED] rounded-l focus:outline-none focus:border-[#3D8BD0] transition-colors"
                  min="0"
                />
                <div className="group relative flex-1" ref={notifyUnitRef}>
                  <button
                    onClick={() => setShowNotifyUnitDropdown(!showNotifyUnitDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded-r hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {formData.notifyUnit}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showNotifyUnitDropdown && (
                    <div className="app-menu absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {['Hours', 'Days', 'Minutes'].map((option) => (
                        <button
                          key={option}
                          className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, notifyUnit: option });
                            setShowNotifyUnitDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658]">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[#7B8FA5] mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
                rows={6}
                className="w-full px-3 py-2 text-sm border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0] transition-colors resize-none"
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-xs text-[#7B8FA5] mb-1.5">Attachment</label>
              <button className="px-4 py-2 text-sm bg-white border border-[#DFE5ED] text-[#364658] rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                Attachment
              </button>
              <p className="text-xs text-[#7B8FA5] mt-1.5">Max file size: 10MB</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#DFE5ED]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#7B8FA5] hover:bg-[#F5F7FA] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-[#00A9E0] text-white rounded hover:bg-[#0091C2] transition-colors"
          >
            {task ? 'Update' : 'Add Task'}
          </button>
        </div>
      </div>
    </>
  );
}