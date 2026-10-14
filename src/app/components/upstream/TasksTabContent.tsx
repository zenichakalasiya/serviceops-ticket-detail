/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { CheckSquare, Plus, Search, Filter, X, Check, ChevronDown, ChevronRight, GripVertical, ArrowUpDown } from 'lucide-react';
import { TaskCardFields } from './TaskCardFields';
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
  /** Optional workflow stage index (0-based). When present, the Tasks tab shows a stage stepper. */
  stage?: number;
}

interface TasksTabContentProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TasksTabContent({ tasks, onAddTask, onEditTask, onUpdateTask, onDeleteTask }: TasksTabContentProps) {
  const [isTaskSearchExpanded, setIsTaskSearchExpanded] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [showTaskSortMenu, setShowTaskSortMenu] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'unresolved' | 'closed'>('all');
  const [tasksGroupOpen, setTasksGroupOpen] = useState(true);
  const [activeStage, setActiveStage] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [taskSortDesc, setTaskSortDesc] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Drag-to-reorder — a local ordering of task ids (kept in sync with the tasks
  // prop) drives the render order, so users can drag tasks into a new sequence
  // without needing a parent callback threaded through every drawer.
  const [orderIds, setOrderIds] = useState<string[]>(() => tasks.map((t) => t.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const taskIdsKey = tasks.map((t) => t.id).join('|');
  useEffect(() => {
    const ids = tasks.map((t) => t.id);
    setOrderIds((prev) => {
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !prev.includes(id));
      const next = [...kept, ...added];
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIdsKey]);
  const orderRank = (id: string) => { const i = orderIds.indexOf(id); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
  const sortByOrder = (list: Task[]) => { const s = [...list].sort((a, b) => orderRank(a.id) - orderRank(b.id)); return taskSortDesc ? s.reverse() : s; };
  const reorderTasks = (dragId: string | null, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrderIds((prev) => {
      const arr = prev.slice();
      const from = arr.indexOf(dragId);
      if (from === -1) return prev;
      arr.splice(from, 1);
      const to = arr.indexOf(targetId);
      if (to === -1) { arr.push(dragId); return arr; }
      arr.splice(to, 0, dragId);
      return arr;
    });
  };

  // Workflow stages — when tasks carry a `stage` index the Tasks tab groups them
  // into collapsible stage accordions (like the Approvals tab).
  const STAGE_NAMES = ['Preparation', 'Provisioning', 'Access & Accounts', 'Verification', 'Closure'];
  const isDone = (t: Task) => !!t.completed || t.status === 'Closed' || t.status === 'Completed';
  const hasStages = tasks.some((t) => typeof t.stage === 'number');
  const stageCount = hasStages ? Math.max(...tasks.filter((t) => typeof t.stage === 'number').map((t) => t.stage as number)) + 1 : 0;
  const stages = Array.from({ length: stageCount }, (_, i) => {
    const inStage = tasks.filter((t) => t.stage === i);
    return { index: i, name: STAGE_NAMES[i] ?? `Stage ${i + 1}`, total: inStage.length, done: inStage.filter(isDone).length };
  });
  const completedStages = stages.filter((s) => s.total > 0 && s.done === s.total).length;

  const statusColors: Record<string, string> = {
    'Open': '#3D8BD0',
    'In Progress': '#F59E0B',
    'On Hold': '#9CA3AF',
    'Completed': '#10B981',
    'Cancelled': '#EF4444',
    'Closed': '#10B981',
  };

  const priorityColors: Record<string, string> = {
    'Low': '#10B981',
    'Normal': '#3D8BD0',
    'High': '#F59E0B',
    'Critical': '#EF4444',
  };

  // Click outside handler for sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowTaskSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks based on search query and filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.subject.toLowerCase().includes(taskSearchQuery.toLowerCase());
    const matchesFilter = 
      taskFilter === 'all' ? true :
      taskFilter === 'unresolved' ? task.status !== 'Closed' :
      taskFilter === 'closed' ? task.status === 'Closed' :
      true;
    return matchesSearch && matchesFilter;
  });

  // Manually-added tasks (no stage) render outside the stage accordion.
  const additionalTasks = sortByOrder(filteredTasks.filter((t) => typeof t.stage !== 'number'));

  // Single task card — reused by the flat list and the stage accordions.
  const renderTask = (task: Task) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => { setDraggingId(task.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', task.id); } catch { /* some browsers */ } }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== task.id) setDragOverId(task.id); }}
      onDragLeave={() => { if (dragOverId === task.id) setDragOverId(null); }}
      onDrop={(e) => { e.preventDefault(); reorderTasks(draggingId, task.id); setDraggingId(null); setDragOverId(null); }}
      onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
      className={`relative bg-white border rounded-lg pl-2 pr-3.5 py-3 transition-all group ${draggingId === task.id ? 'opacity-40' : ''} ${dragOverId === task.id && draggingId && draggingId !== task.id ? 'border-[#3D8BD0] shadow-[0_0_0_2px_rgba(61,139,208,0.15)]' : 'border-[#EEF1F5] hover:border-[#DDE3EC] hover:shadow-[0_1px_3px_rgba(16,24,40,0.06)]'}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 cursor-grab active:cursor-grabbing text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors flex-shrink-0" title="Drag to reorder">
          <GripVertical size={15} />
        </div>
        <input
          type="checkbox"
          checked={task.status === 'Closed'}
          onChange={(e) => {
            onUpdateTask({ ...task, completed: e.target.checked, status: e.target.checked ? 'Closed' : 'Open' });
          }}
          className="mt-0.5 w-4 h-4 text-[#00A9E0] border-[#DFE5ED] rounded focus:ring-[#00A9E0] focus:ring-2 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded bg-[#EEF4FB] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0] flex-shrink-0">TA-{task.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}</span>
            <span className={`text-[13px] font-semibold truncate ${task.status === 'Closed' ? 'line-through text-[#9CA3AF]' : 'text-[#364658]'}`}>{task.subject}</span>
          </div>
          <div className="mt-2">
            <TaskCardFields task={task} statusColors={statusColors} priorityColors={priorityColors} onUpdateTask={onUpdateTask} />
          </div>
        </div>
        <div className={`flex items-center gap-0.5 transition-opacity flex-shrink-0 ${confirmDeleteId === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button onClick={() => onEditTask(task)} className="p-1 text-[#7B8FA5] hover:text-[#3D8BD0] hover:bg-[#F3F4F6] rounded transition-colors" title="Edit task">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="currentColor" />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={() => setConfirmDeleteId(task.id)}
              className="p-1 text-[#E74C3C] hover:bg-[#FEE2E2] rounded transition-colors"
              title="Delete task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6.66667 2.66667V2H9.33333V2.66667H6.66667ZM5.33333 2.66667V2C5.33333 1.26362 5.93029 0.666667 6.66667 0.666667H9.33333C10.0697 0.666667 10.6667 1.26362 10.6667 2V2.66667H13.3333H14.6667V4H13.3333V13.3333C13.3333 14.0697 12.7364 14.6667 12 14.6667H4C3.26362 14.6667 2.66667 14.0697 2.66667 13.3333V4H1.33333V2.66667H2.66667H5.33333ZM4 4V13.3333H12V4H4ZM6 6H7.33333V11.3333H6V6ZM9.33333 6H8V11.3333H9.33333V6Z" fill="currentColor" />
              </svg>
            </button>
            {confirmDeleteId === task.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setConfirmDeleteId(null)} />
                <div className="app-menu absolute right-0 top-full mt-2 z-50 w-[224px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg p-3">
                  <div className="absolute -top-1.5 right-2.5 size-3 bg-white border-l border-t border-[#DFE5ED] rotate-45" />
                  <p className="relative text-[12px] text-[#364658]">Are you sure, you want to delete this task?</p>
                  <div className="relative mt-2.5 flex items-center justify-end gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 border border-[#DFE5ED] text-[#364658] text-[12px] font-medium rounded hover:bg-[#F3F4F6] transition-colors">Cancel</button>
                    <button onClick={() => { onDeleteTask(task.id); setConfirmDeleteId(null); }} className="px-2.5 py-1 bg-[#E74C3C] text-white text-[12px] font-medium rounded hover:bg-[#C0392B] transition-colors">Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <CheckSquare className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Tasks Yet</h3>
            <p className="text-[13px] text-[#7B8FA5] max-w-md mb-4">
              Get started by adding your first task to this service request.
            </p>
            <button
              onClick={onAddTask}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Task list view
  return (
    <div className="px-6 pb-6 pt-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search Block */}
        {!isTaskSearchExpanded ? (
          <button
            className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658] transition-colors"
            title="Search"
            onClick={() => setIsTaskSearchExpanded(true)}
          >
            <Search size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-2 h-9 px-3 border border-[#DFE5ED] rounded bg-white flex-1">
            <Search size={16} className="text-[#7B8FA5]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="outline-none text-sm bg-transparent placeholder:text-[#9CA3AF] text-[#364658] flex-1"
              autoFocus
            />
            <button 
              className="p-0.5 hover:bg-[#F5F7FA] rounded transition-colors"
              onClick={() => {
                setIsTaskSearchExpanded(false);
                setTaskSearchQuery('');
              }}
            >
              <X size={14} className="text-[#7B8FA5]" />
            </button>
          </div>
        )}

        {/* Sort Icon */}
        <div className="relative task-sort-menu-container" ref={sortMenuRef}>
          <button
            onClick={() => setShowTaskSortMenu(!showTaskSortMenu)}
            className={`size-8 flex items-center justify-center border rounded transition-colors ${taskFilter !== 'all' ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
            title="Filter tasks"
          >
            <Filter size={16} />
          </button>
          {showTaskSortMenu && (
            <div className="app-menu absolute left-0 top-full mt-2 w-48 bg-white border border-[#DFE5ED] rounded-lg shadow-lg py-2 z-50">
              <button 
                onClick={() => {
                  setTaskFilter('unresolved');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'unresolved' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                Unresolved Tasks
                {taskFilter === 'unresolved' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
              <button 
                onClick={() => {
                  setTaskFilter('closed');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'closed' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                Closed Tasks
                {taskFilter === 'closed' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
              <button 
                onClick={() => {
                  setTaskFilter('all');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'all' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                All Tasks
                {taskFilter === 'all' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
            </div>
          )}
        </div>

        {/* Sort Icon (toggle task order, same icon as the Conversation tab) */}
        <button
          onClick={() => setTaskSortDesc((v) => !v)}
          className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658] transition-colors"
          title={taskSortDesc ? 'Sort ascending' : 'Sort descending'}
        >
          <ArrowUpDown size={16} />
        </button>

        {/* Active filter chip */}
        {taskFilter !== 'all' && (
          <span className="inline-flex items-center gap-1 h-8 pl-2.5 pr-1.5 rounded-md bg-[#EAF2FB] text-[#3D8BD0] text-[12px] font-medium">
            {taskFilter === 'unresolved' ? 'Unresolved' : 'Closed'}
            <button onClick={() => setTaskFilter('all')} title="Clear filter" className="p-0.5 rounded hover:bg-[#3D8BD0]/10 transition-colors">
              <X size={13} />
            </button>
          </span>
        )}

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {hasStages ? (
        <div className="space-y-3">
          {/* Stages accordion — admin-defined workflow steps */}
          <div className="bg-white border border-[#DFE5ED] rounded-lg">
            <div
              onClick={() => setTasksGroupOpen((o) => !o)}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckSquare size={16} className="text-[#3D8BD0] flex-shrink-0" />
                <h3 className="text-[14px] font-semibold text-[#364658] truncate">Service Catalog Task</h3>
                <span className="text-[11px] font-medium text-[#7B8FA5] bg-[#F3F4F6] rounded-full px-2 py-0.5 flex-shrink-0 tabular-nums">{completedStages}/{stageCount} Stages</span>
              </div>
              {tasksGroupOpen ? <ChevronDown size={16} className="text-[#6B7280] flex-shrink-0" /> : <ChevronRight size={16} className="text-[#6B7280] flex-shrink-0" />}
            </div>

            {tasksGroupOpen && (() => {
              const current = Math.min(activeStage, Math.max(stageCount - 1, 0));
              const activeStageTasks = sortByOrder(filteredTasks.filter((t) => t.stage === current));
              return (
                <div className="border-t border-[#F0F1F3]">
                  {/* Step selector — folder tabs (Options 10 + 11 combined): the active stage's
                      tab is white and merges seamlessly into the task list below; completed
                      stages turn green with a check. */}
                  <div className="px-4 pt-3 bg-gradient-to-b from-[#F9FBFD] to-[#F4F7FA] border-b border-[#E5E7EB]">
                    <div className="flex flex-wrap items-end gap-1">
                      <span className="text-[13px] font-semibold text-[#6B7280] mr-3 flex-shrink-0 self-center pb-3">Task Summary</span>
                      {stages.map((st) => {
                        const active = st.index === current;
                        const complete = st.total > 0 && st.done === st.total;
                        return (
                          <button
                            key={st.index}
                            onClick={() => setActiveStage(st.index)}
                            className={`relative inline-flex items-center gap-2 px-3.5 pt-2 pb-2.5 -mb-px rounded-t-lg text-[12px] font-medium border border-b-0 transition-colors flex-shrink-0 ${active ? 'bg-white border-[#E5E7EB] shadow-[0_-2px_6px_rgba(31,42,61,0.05)] z-10' : 'border-transparent hover:bg-white/60'}`}
                          >
                            <span className={`size-5 rounded-md flex items-center justify-center text-[10px] font-bold ${complete ? 'bg-[#16A34A] text-white' : active ? 'bg-gradient-to-br from-[#4F93FF] to-[#2F6FED] text-white' : 'bg-white border border-[#CBD5E1] text-[#475569]'}`}>
                              {complete ? <Check size={11} /> : st.index + 1}
                            </span>
                            <span className={`tabular-nums font-semibold ${complete ? 'text-[#16A34A]' : active ? 'text-[#2F6FED]' : 'text-[#5A6A82]'}`}>{st.done}/{st.total}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Active stage tasks */}
                  <div className="px-4 py-4 space-y-3">
                    {activeStageTasks.length === 0 ? (
                      <div className="text-center py-8 text-[13px] text-[#7B8FA5]">No tasks in this stage.</div>
                    ) : activeStageTasks.map(renderTask)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Manually-added tasks — outside the accordion */}
          {additionalTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-1 px-0.5">
                <span className="text-[12px] font-semibold text-[#7B8FA5]">Additional Tasks</span>
                <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-1.5 py-0.5 tabular-nums">{additionalTasks.length}</span>
              </div>
              <div className="space-y-3">{additionalTasks.map(renderTask)}</div>
            </div>
          )}
        </div>
      ) : (
        /* Flat list — tasks without a stage (e.g. manually added on other modules) */
        <div className="space-y-3">{sortByOrder(filteredTasks).map(renderTask)}</div>
      )}
    </div>
  );
}