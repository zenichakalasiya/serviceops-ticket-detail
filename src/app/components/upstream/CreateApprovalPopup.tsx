/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, Plus, Bold, Italic, Underline, Pilcrow, Link as LinkIcon, Image, Video, Table, Code, Strikethrough, Undo, Redo, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Approver {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Ignored';
  statusChangedAt?: string;
}

interface ApprovalLevel {
  level: number;
  approvers: Approver[];
}

interface Approval {
  id: string;
  subject: string;
  createdBy: string;
  createdAt: string;
  type: 'Unanimous' | 'Majority' | 'Any One' | 'First Approval';
  status: 'Pending' | 'Approved' | 'Rejected';
  levels: ApprovalLevel[];
}

interface SelectedApprover {
  name: string;
  type: 'users' | 'agentGroups' | 'requesterGroups';
}

interface CreateApprovalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  approval?: Approval | null;
}

export function CreateApprovalPopup({ isOpen, onClose, approval }: CreateApprovalPopupProps) {
  const [selectedStage, setSelectedStage] = useState(1);
  const [decisionType, setDecisionType] = useState<'Unanimous' | 'Majority' | 'Any One' | 'First Approval'>(approval?.type || 'Unanimous');
  const [subject, setSubject] = useState(approval?.subject || '');
  const [description, setDescription] = useState('');
  const [runOnCreate, setRunOnCreate] = useState(true);
  const [stages, setStages] = useState([1]);
  
  // Unified approvers dropdown state
  const [showApproversDropdown, setShowApproversDropdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<'users' | 'agentGroups' | 'requesterGroups' | null>(null);
  const [selectedApprovers, setSelectedApprovers] = useState<SelectedApprover[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const approversDropdownRef = useRef<HTMLDivElement>(null);
  
  // Dropdown states
  const [stageTechGroup, setStageTechGroup] = useState('Select');
  const [stageTechnician, setStageTechnician] = useState('Select Technician');
  
  const [showStageTechGroupDropdown, setShowStageTechGroupDropdown] = useState(false);
  const [showStageTechnicianDropdown, setShowStageTechnicianDropdown] = useState(false);
  
  // Approver checkboxes
  const [requestersManager, setRequestersManager] = useState(false);
  const [assigneesManager, setAssigneesManager] = useState(false);
  const [departmentHead, setDepartmentHead] = useState(false);
  
  // Refs for dropdowns
  const stageTechGroupRef = useRef<HTMLDivElement>(null);
  const stageTechnicianRef = useRef<HTMLDivElement>(null);
  
  // Dropdown options
  const groupOptions = ['Select', 'IT Support', 'HR Team', 'Finance', 'Operations', 'Group 1', 'Group 2'];
  const userOptions = ['Select', 'John Doe', 'Sarah Smith', 'Michael Chen', 'Emily Rodriguez', 'User 1', 'User 2'];
  const technicianOptions = ['Select Technician', 'Technician 1', 'Technician 2', 'John Doe', 'Sarah Smith'];
  
  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (approversDropdownRef.current && !approversDropdownRef.current.contains(event.target as Node)) {
        setShowApproversDropdown(false);
      }
      if (stageTechGroupRef.current && !stageTechGroupRef.current.contains(event.target as Node)) {
        setShowStageTechGroupDropdown(false);
      }
      if (stageTechnicianRef.current && !stageTechnicianRef.current.contains(event.target as Node)) {
        setShowStageTechnicianDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const addStage = () => {
    setStages([...stages, stages.length + 1]);
  };

  const handleCreate = () => {
    // Handle create/update logic here
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const handleToggleApprover = (name: string, type: 'users' | 'agentGroups' | 'requesterGroups') => {
    const exists = selectedApprovers.some(a => a.name === name && a.type === type);
    if (exists) {
      setSelectedApprovers(selectedApprovers.filter(a => !(a.name === name && a.type === type)));
    } else {
      setSelectedApprovers([...selectedApprovers, { name, type }]);
    }
  };

  const handleRemoveApprover = (name: string, type: 'users' | 'agentGroups' | 'requesterGroups') => {
    setSelectedApprovers(selectedApprovers.filter(a => !(a.name === name && a.type === type)));
  };

  const isSelected = (name: string, type: 'users' | 'agentGroups' | 'requesterGroups') => {
    return selectedApprovers.some(a => a.name === name && a.type === type);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-end">
      <div className="bg-white h-full w-[900px] max-w-[95vw] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[18px] font-semibold text-[#364658]">
            {approval ? 'Edit Approval' : 'Create Approval'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
          >
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Stages */}
          <div className="w-[180px] flex-shrink-0 border-r border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <div className="space-y-2">
              {stages.map((stage) => (
                <div key={stage} className="group relative">
                  <button
                    onClick={() => setSelectedStage(stage)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedStage === stage
                        ? 'bg-[#3D8BD0]/10 text-[#364658] border border-[#3D8BD0]'
                        : 'bg-white text-[#364658] border border-[#DFE5ED] hover:border-[#3D8BD0]'
                    }`}
                  >
                    <div className={`text-[12px] font-medium ${selectedStage === stage ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>Stage {stage}</div>
                    <div className="text-[11px] opacity-80">{decisionType}</div>
                  </button>
                  <button
                    className={`absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FEE2E2] ${stage === 1 ? 'hidden' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (stages.length > 1) {
                        const newStages = stages.filter(s => s !== stage);
                        setStages(newStages);
                        // If we deleted the currently selected stage, switch to the first remaining stage
                        if (selectedStage === stage) {
                          setSelectedStage(newStages[0]);
                        }
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-[#EF4444]" />
                  </button>
                </div>
              ))}
              <button
                onClick={addStage}
                className="w-full px-3 py-2 rounded-lg border border-dashed border-[#3D8BD0] text-[#3D8BD0] hover:bg-[#EFF6FF] transition-colors flex items-center justify-center gap-1.5 text-[12px] font-medium"
              >
                <Plus size={14} />
                Add Stage
              </button>
            </div>
          </div>

          {/* Main Form */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Decision Type */}
              <div>
                <label className="block text-[13px] text-[#7B8FA5] mb-2">
                  Set Individual Decision Type
                </label>
                <div className="flex gap-2">
                  {(['Unanimous', 'Majority', 'Any One', 'First Approval'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDecisionType(type)}
                      className={`px-3 py-1.5 text-[13px] font-medium rounded transition-colors ${
                        decisionType === type
                          ? 'bg-[#3D8BD0] text-white'
                          : 'bg-[#F3F4F6] text-[#364658] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Approvers to */}
              <div>
                <label className="block text-[13px] text-[#364658] mb-2">
                  Set Approvers to
                </label>
                <div className="relative mb-3" ref={approversDropdownRef}>
                  <button
                    onClick={() => setShowApproversDropdown(!showApproversDropdown)}
                    className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                  >
                    {selectedApprovers.length > 0 
                      ? `${selectedApprovers.length} approver${selectedApprovers.length > 1 ? 's' : ''} selected` 
                      : 'Select'}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                  
                  {showApproversDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50 max-h-[300px] overflow-y-auto">
                      {!expandedCategory ? (
                        <div className="space-y-1">
                          <button
                            className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                            onClick={() => setExpandedCategory('users')}
                          >
                            <span className="text-[13px] text-[#364658]">Users</span>
                          </button>
                          <button
                            className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                            onClick={() => setExpandedCategory('agentGroups')}
                          >
                            <span className="text-[13px] text-[#364658]">Agent groups</span>
                          </button>
                          <button
                            className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                            onClick={() => setExpandedCategory('requesterGroups')}
                          >
                            <span className="text-[13px] text-[#364658]">Requester groups</span>
                          </button>
                        </div>
                      ) : (
                        <div>
                          {/* Back button */}
                          <button
                            onClick={() => setExpandedCategory(null)}
                            className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors flex items-center gap-2 border-b border-[#E5E7EB] mb-2"
                          >
                            <ChevronRight size={14} className="text-[#3D8BD0] rotate-180" />
                            <span className="text-[13px] text-[#3D8BD0] font-medium">
                              {expandedCategory === 'users' ? 'Users' : expandedCategory === 'agentGroups' ? 'Agent groups' : 'Requester groups'}
                            </span>
                          </button>

                          {/* Search input */}
                          <div className="px-4 mb-2">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={expandedCategory === 'users' ? 'Search users' : 'Search groups'}
                              className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0]"
                            />
                          </div>

                          {/* Options list */}
                          <div className="space-y-1">
                            {expandedCategory === 'users' && 
                              userOptions
                                .filter(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((option) => {
                                  const selected = isSelected(option, 'users');
                                  return (
                                    <button
                                      key={option}
                                      className={`w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors flex items-center gap-2 ${selected ? 'bg-[#EFF6FF]' : ''}`}
                                      onClick={() => handleToggleApprover(option, 'users')}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => {}}
                                        className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                                      />
                                      <span className="text-[13px] text-[#364658]">{option}</span>
                                    </button>
                                  );
                                })
                            }
                            {expandedCategory === 'agentGroups' && 
                              groupOptions
                                .filter(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((option) => {
                                  const selected = isSelected(option, 'agentGroups');
                                  return (
                                    <button
                                      key={option}
                                      className={`w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors flex items-center gap-2 ${selected ? 'bg-[#EFF6FF]' : ''}`}
                                      onClick={() => handleToggleApprover(option, 'agentGroups')}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => {}}
                                        className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                                      />
                                      <span className="text-[13px] text-[#364658]">{option}</span>
                                    </button>
                                  );
                                })
                            }
                            {expandedCategory === 'requesterGroups' && 
                              groupOptions
                                .filter(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((option) => {
                                  const selected = isSelected(option, 'requesterGroups');
                                  return (
                                    <button
                                      key={option}
                                      className={`w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors flex items-center gap-2 ${selected ? 'bg-[#EFF6FF]' : ''}`}
                                      onClick={() => handleToggleApprover(option, 'requesterGroups')}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => {}}
                                        className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                                      />
                                      <span className="text-[13px] text-[#364658]">{option}</span>
                                    </button>
                                  );
                                })
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Approvers Chips */}
                {selectedApprovers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedApprovers.map((approver, index) => (
                      <div
                        key={`${approver.type}-${approver.name}-${index}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EFF6FF] border border-[#3D8BD0] rounded text-[12px] text-[#3D8BD0]"
                      >
                        <span>{approver.name}</span>
                        <button
                          onClick={() => handleRemoveApprover(approver.name, approver.type)}
                          className="hover:bg-[#3D8BD0]/20 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestersManager}
                      onChange={(e) => setRequestersManager(e.target.checked)}
                      className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                    />
                    <span className="text-[13px] text-[#364658]">Requester's Manager</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assigneesManager}
                      onChange={(e) => setAssigneesManager(e.target.checked)}
                      className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                    />
                    <span className="text-[13px] text-[#364658]">Assignee's Manager</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={departmentHead}
                      onChange={(e) => setDepartmentHead(e.target.checked)}
                      className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
                    />
                    <span className="text-[13px] text-[#364658]">Department Head</span>
                  </label>
                </div>
              </div>

              {/* Action on Stage Activation */}
              <div>
                <h3 className="text-[14px] font-semibold text-[#3D8BD0] mb-3">
                  Action on Stage Activation
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] text-[#364658] mb-2">
                      Set Technician Group
                    </label>
                    <div className="relative" ref={stageTechGroupRef}>
                      <button
                        onClick={() => setShowStageTechGroupDropdown(!showStageTechGroupDropdown)}
                        className="w-full px-3 pr-8 py-2 text-sm text-[#364658] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                      >
                        {stageTechGroup}
                      </button>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                      
                      {showStageTechGroupDropdown && (
                        <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                          {groupOptions.map((option) => (
                            <button
                              key={option}
                              className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                              onClick={() => {
                                setStageTechGroup(option);
                                setShowStageTechGroupDropdown(false);
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
                    <label className="block text-[13px] text-[#364658] mb-2">
                      Set Technician
                    </label>
                    <div className="relative" ref={stageTechnicianRef}>
                      <button
                        onClick={() => setShowStageTechnicianDropdown(!showStageTechnicianDropdown)}
                        className="w-full px-3 pr-8 py-2 text-sm text-[#7B8FA5] bg-white border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] focus:outline-none focus:border-[#3D8BD0] transition-colors text-left"
                      >
                        {stageTechnician}
                      </button>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
                      
                      {showStageTechnicianDropdown && (
                        <div className="app-menu absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                          {technicianOptions.map((option) => (
                            <button
                              key={option}
                              className="w-full px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                              onClick={() => {
                                setStageTechnician(option);
                                setShowStageTechnicianDropdown(false);
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
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[13px] text-[#364658] mb-2">
                  Subject <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Approval Required for - TSR-00812237"
                  className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] focus:outline-none focus:border-[#3D8BD0]"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] text-[#364658]">
                    Description
                  </label>
                  <button className="text-[12px] text-[#3D8BD0] hover:underline">
                    Insert Placeholder
                  </button>
                </div>
                <div className="border border-[#DFE5ED] rounded-lg overflow-hidden">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 text-[13px] text-[#364658] focus:outline-none resize-none h-[150px]"
                  />
                  {/* Rich Text Toolbar */}
                  <div className="border-t border-[#DFE5ED] bg-[#F9FAFB] px-3 py-2 flex items-center gap-1">
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Bold">
                      <Bold size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Italic">
                      <Italic size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Underline">
                      <Underline size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Strikethrough">
                      <Strikethrough size={14} className="text-[#6B7280]" />
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="px-2 py-1 text-[11px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] rounded transition-colors">
                      H1
                    </button>
                    <button className="px-2 py-1 text-[11px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] rounded transition-colors">
                      H2
                    </button>
                    <button className="px-2 py-1 text-[11px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] rounded transition-colors">
                      H3
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Paragraph">
                      <Pilcrow size={14} className="text-[#6B7280]" />
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Align Left">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="15" y2="12" />
                        <line x1="3" y1="18" x2="18" y2="18" />
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Align Center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Align Right">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="9" y1="12" x2="21" y2="12" />
                        <line x1="6" y1="18" x2="21" y2="18" />
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Justify">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Bullet List">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="9" y1="6" x2="21" y2="6" />
                        <line x1="9" y1="12" x2="21" y2="12" />
                        <line x1="9" y1="18" x2="21" y2="18" />
                        <circle cx="4" cy="6" r="1" fill="currentColor" />
                        <circle cx="4" cy="12" r="1" fill="currentColor" />
                        <circle cx="4" cy="18" r="1" fill="currentColor" />
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Numbered List">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <line x1="9" y1="6" x2="21" y2="6" />
                        <line x1="9" y1="12" x2="21" y2="12" />
                        <line x1="9" y1="18" x2="21" y2="18" />
                        <text x="3" y="8" fontSize="8" fill="currentColor">1</text>
                        <text x="3" y="14" fontSize="8" fill="currentColor">2</text>
                        <text x="3" y="20" fontSize="8" fill="currentColor">3</text>
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Link">
                      <LinkIcon size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Image">
                      <Image size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Video">
                      <Video size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Table">
                      <Table size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Code">
                      <Code size={14} className="text-[#6B7280]" />
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Clear Formatting">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Font Color">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7280]">
                        <path d="M3 20h18" />
                        <path d="M7 4l5 14 5-14" />
                        <line x1="6" y1="15" x2="16" y2="15" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-[#DFE5ED] mx-1" />
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Undo">
                      <Undo size={14} className="text-[#6B7280]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors" title="Redo">
                      <Redo size={14} className="text-[#6B7280]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-between bg-white">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={runOnCreate}
              onChange={(e) => setRunOnCreate(e.target.checked)}
              className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0]"
            />
            <span className="text-[13px] text-[#364658]">Run Approval Workflow on Create</span>
          </label>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#6B7280] rounded hover:bg-[#4B5563] transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleCreate}
              disabled={!subject}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2C6BA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approval ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}