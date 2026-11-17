import { ChevronDown, ChevronRight, ChevronUp, FileText, Pin as PinIcon, Plus, X, Check, Search, ArrowLeft, CornerUpLeft } from 'lucide-react';
import { AssetFields } from './AssetFields';
import type { AssetFieldState } from './AssetFields';
import { SystemFieldsRenderer } from './SystemFieldsRenderer';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { useEffect, useState, useRef } from 'react';

interface TicketFieldsAccordionProps {
  fieldsTitle?: string;
  showProblemFields?: boolean;
  statusGroupLabel?: string;
  // When true, render the Hardware Asset field set instead of the ticket fields.
  assetMode?: boolean;
  assetState?: AssetFieldState;
  // When true (software assets), render the software field set (Software Type, no CI/View more).
  softwareMode?: boolean;
  cmdbMode?: boolean;
  // When true (Non-IT assets), like softwareMode but without the Software Type field.
  nonItMode?: boolean;
  licenseMode?: boolean;
  contractMode?: boolean;
  purchaseMode?: boolean;
  patchMode?: boolean;
  patchDeployMode?: boolean;
  /** Deployment Type value shown in the patch-deployment fields card. */
  deploymentType?: string;
  deploymentStatus?: string;
  endpointMode?: boolean;
  cveMode?: boolean;
  ticketFieldsExpanded: boolean;
  setTicketFieldsExpanded: (expanded: boolean) => void;
  showMoreFields: boolean;
  /** V2 ticket page: the accordion holds a FIXED compact field set (whatever the drawer's
   *  getFilteredTicketFields returns, incl. Tags) — extra fields always visible, no
   *  View more / View less, and no System Fields subsection (those live in the
   *  Incident Details tab instead). Opt-in; default preserves V1 behavior. */
  compactTicketFields?: boolean;
  setShowMoreFields: (show: boolean) => void;
  propertiesSearchQuery: string;

  // System Fields (moved here from the Additional Fields "System Fields" tab) —
  // rendered as a subsection at the bottom of this accordion.
  getFilteredAdditionalFields?: () => string[];
  showMoreSystemFields?: boolean;
  setShowMoreSystemFields?: (show: boolean) => void;
  
  // Refs
  ticketFieldsRef: React.RefObject<HTMLDivElement>;
  statusDropdownRef: React.RefObject<HTMLDivElement>;
  priorityDropdownRef: React.RefObject<HTMLDivElement>;
  assigneeDropdownRef: React.RefObject<HTMLDivElement>;
  techGroupDropdownRef: React.RefObject<HTMLDivElement>;
  urgencyDropdownRef: React.RefObject<HTMLDivElement>;
  impactDropdownRef: React.RefObject<HTMLDivElement>;
  categoryDropdownRef: React.RefObject<HTMLDivElement>;
  departmentDropdownRef: React.RefObject<HTMLDivElement>;
  sourceDropdownRef: React.RefObject<HTMLDivElement>;
  locationDropdownRef: React.RefObject<HTMLDivElement>;
  vendorDropdownRef: React.RefObject<HTMLDivElement>;
  supportLevelDropdownRef: React.RefObject<HTMLDivElement>;
  
  // Dropdown States
  showStatusDropdown: boolean;
  setShowStatusDropdown: (show: boolean) => void;
  showPriorityDropdown: boolean;
  setShowPriorityDropdown: (show: boolean) => void;
  showAssigneeDropdown: boolean;
  setShowAssigneeDropdown: (show: boolean) => void;
  showTechGroupDropdown: boolean;
  setShowTechGroupDropdown: (show: boolean) => void;
  showUrgencyDropdown: boolean;
  setShowUrgencyDropdown: (show: boolean) => void;
  showImpactDropdown: boolean;
  setShowImpactDropdown: (show: boolean) => void;
  showCategoryDropdown: boolean;
  setShowCategoryDropdown: (show: boolean) => void;
  showDepartmentDropdown: boolean;
  setShowDepartmentDropdown: (show: boolean) => void;
  showSourceDropdown: boolean;
  setShowSourceDropdown: (show: boolean) => void;
  showLocationDropdown: boolean;
  setShowLocationDropdown: (show: boolean) => void;
  showVendorDropdown: boolean;
  setShowVendorDropdown: (show: boolean) => void;
  showSupportLevelDropdown: boolean;
  setShowSupportLevelDropdown: (show: boolean) => void;
  
  // Selected Values
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
  selectedAssignee: string;
  setSelectedAssignee: (assignee: string) => void;
  selectedTechGroup: string;
  setSelectedTechGroup: (group: string) => void;
  selectedUrgency: string;
  setSelectedUrgency: (urgency: string) => void;
  selectedImpact: string;
  setSelectedImpact: (impact: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  selectedVendor: string;
  setSelectedVendor: (vendor: string) => void;
  selectedSupportLevel: string;
  setSelectedSupportLevel: (level: string) => void;
  assigneeSearchQuery: string;
  setAssigneeSearchQuery: (query: string) => void;
  
  // Tags
  tags: string[];
  setTags: (tags: string[]) => void;
  showTagInput: boolean;
  setShowTagInput: (show: boolean) => void;
  tagInputValue: string;
  setTagInputValue: (value: string) => void;
  
  // Helper Functions
  togglePinField: (field: string) => void;
  getFilteredTicketFields: () => string[];
  getCurrentStatusColor: () => string;
  getCurrentPriorityColor: () => string;
  getCurrentAssigneeColor: () => string;
  getCurrentUrgencyColor: () => string;
  getCurrentImpactColor: () => string;
  filteredAssigneeOptions: any[];
  pinnedFields: string[];
  
  // Options
  statusOptions: any[];
  priorityOptions: any[];
  assigneeOptions: any[];
  techGroupOptions: any[];
  urgencyOptions: any[];
  impactOptions: any[];
  categoryOptions: any[];
  departmentOptions: any[];
  sourceOptions: any[];
  locationOptions: any[];
  vendorOptions: any[];
  supportLevelOptions: any[];
}

/** Self-contained field row used for the Problem-specific fields. */
function ProblemFieldRow({
  label,
  required,
  options,
  defaultValue,
  placeholder,
}: {
  label: string;
  required?: boolean;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue || '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [open]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] flex items-center gap-0.5">
        <span>{label}</span>
        {required && <span className="text-[#E5484D]">*</span>}
      </div>
      <div className="group relative flex-1" ref={ref}>
        <button
          className="w-full pl-3 pr-8 py-2 text-[13px] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
          onClick={() => setOpen(!open)}
        >
          <span className={value ? 'text-[#364658]' : 'text-[#9CA3AF]'}>{value || placeholder || 'Select'}</span>
        </button>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        {open && (
          <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
            {options.map((opt) => (
              <button
                key={opt}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                onClick={() => { setValue(opt); setOpen(false); }}
              >
                <span className="text-[13px] text-[#364658] truncate">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketFieldsAccordion(props: TicketFieldsAccordionProps) {
  const {
    fieldsTitle = 'Request Fields',
    showProblemFields = false,
    statusGroupLabel,
    assetMode = false,
    assetState,
    softwareMode = false,
    cmdbMode = false,
    nonItMode = false,
    licenseMode = false,
    contractMode = false,
    purchaseMode = false,
    patchMode = false,
    patchDeployMode = false,
    deploymentType,
    deploymentStatus,
    endpointMode = false,
    cveMode = false,
    ticketFieldsExpanded,
    setTicketFieldsExpanded,
    showMoreFields,
    compactTicketFields = false,
    setShowMoreFields,
    propertiesSearchQuery,
    getFilteredAdditionalFields,
    showMoreSystemFields,
    setShowMoreSystemFields,
    ticketFieldsRef,
    statusDropdownRef,
    priorityDropdownRef,
    assigneeDropdownRef,
    techGroupDropdownRef,
    urgencyDropdownRef,
    impactDropdownRef,
    categoryDropdownRef,
    departmentDropdownRef,
    sourceDropdownRef,
    locationDropdownRef,
    vendorDropdownRef,
    supportLevelDropdownRef,
    showStatusDropdown,
    setShowStatusDropdown,
    showPriorityDropdown,
    setShowPriorityDropdown,
    showAssigneeDropdown,
    setShowAssigneeDropdown,
    showTechGroupDropdown,
    setShowTechGroupDropdown,
    showUrgencyDropdown,
    setShowUrgencyDropdown,
    showImpactDropdown,
    setShowImpactDropdown,
    showCategoryDropdown,
    setShowCategoryDropdown,
    showDepartmentDropdown,
    setShowDepartmentDropdown,
    showSourceDropdown,
    setShowSourceDropdown,
    showLocationDropdown,
    setShowLocationDropdown,
    showVendorDropdown,
    setShowVendorDropdown,
    showSupportLevelDropdown,
    setShowSupportLevelDropdown,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    selectedTechGroup,
    setSelectedTechGroup,
    selectedUrgency,
    setSelectedUrgency,
    selectedImpact,
    setSelectedImpact,
    selectedCategory,
    setSelectedCategory,
    selectedDepartment,
    setSelectedDepartment,
    selectedSource,
    setSelectedSource,
    selectedLocation,
    setSelectedLocation,
    selectedVendor,
    setSelectedVendor,
    selectedSupportLevel,
    setSelectedSupportLevel,
    assigneeSearchQuery,
    setAssigneeSearchQuery,
    tags,
    setTags,
    showTagInput,
    setShowTagInput,
    tagInputValue,
    setTagInputValue,
    togglePinField,
    getFilteredTicketFields,
    getCurrentStatusColor,
    getCurrentPriorityColor,
    getCurrentAssigneeColor,
    getCurrentUrgencyColor,
    getCurrentImpactColor,
    filteredAssigneeOptions,
    pinnedFields,
    statusOptions,
    priorityOptions,
    assigneeOptions,
    techGroupOptions,
    urgencyOptions,
    impactOptions,
    categoryOptions,
    departmentOptions,
    sourceOptions,
    locationOptions,
    vendorOptions,
    supportLevelOptions,
  } = props;

  useEffect(() => {
    if (propertiesSearchQuery) {
      setTicketFieldsExpanded(true);
    }
  }, [propertiesSearchQuery, setTicketFieldsExpanded]);

  // Click outside handlers for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Status dropdown
      if (showStatusDropdown && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      
      // Priority dropdown
      if (showPriorityDropdown && priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      
      // Assignee dropdown
      if (showAssigneeDropdown && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
        setAssigneeSearchQuery('');
      }
      
      // Tech Group dropdown
      if (showTechGroupDropdown && techGroupDropdownRef.current && !techGroupDropdownRef.current.contains(event.target as Node)) {
        setShowTechGroupDropdown(false);
      }
      
      // Urgency dropdown
      if (showUrgencyDropdown && urgencyDropdownRef.current && !urgencyDropdownRef.current.contains(event.target as Node)) {
        setShowUrgencyDropdown(false);
      }
      
      // Impact dropdown
      if (showImpactDropdown && impactDropdownRef.current && !impactDropdownRef.current.contains(event.target as Node)) {
        setShowImpactDropdown(false);
      }
      
      // Category dropdown
      if (showCategoryDropdown && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      
      // Department dropdown
      if (showDepartmentDropdown && departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
      }
      
      // Source dropdown
      if (showSourceDropdown && sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
      
      // Location dropdown
      if (showLocationDropdown && locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      
      // Vendor dropdown
      if (showVendorDropdown && vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
      
      // Support Level dropdown
      if (showSupportLevelDropdown && supportLevelDropdownRef.current && !supportLevelDropdownRef.current.contains(event.target as Node)) {
        setShowSupportLevelDropdown(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    showStatusDropdown,
    showPriorityDropdown,
    showAssigneeDropdown,
    showTechGroupDropdown,
    showUrgencyDropdown,
    showImpactDropdown,
    showCategoryDropdown,
    showDepartmentDropdown,
    showSourceDropdown,
    showLocationDropdown,
    showVendorDropdown,
    showSupportLevelDropdown,
    statusDropdownRef,
    priorityDropdownRef,
    assigneeDropdownRef,
    techGroupDropdownRef,
    urgencyDropdownRef,
    impactDropdownRef,
    categoryDropdownRef,
    departmentDropdownRef,
    sourceDropdownRef,
    locationDropdownRef,
    vendorDropdownRef,
    supportLevelDropdownRef,
    setShowStatusDropdown,
    setShowPriorityDropdown,
    setShowAssigneeDropdown,
    setShowTechGroupDropdown,
    setShowUrgencyDropdown,
    setShowImpactDropdown,
    setShowCategoryDropdown,
    setShowDepartmentDropdown,
    setShowSourceDropdown,
    setShowLocationDropdown,
    setShowVendorDropdown,
    setShowSupportLevelDropdown,
    setAssigneeSearchQuery
  ]);

  // System Fields subsection (moved here from the old Additional Fields "System Fields" tab).
  // Rendered WITHOUT its own show-more toggle (hideShowMore) so the accordion's single
  // "View more" is the only expander — for tickets it lives inside that expansion.
  const systemFieldsSection = getFilteredAdditionalFields ? (
    <div className="mt-3 pt-4 border-t border-[#EEF1F4]">
      <div className="mb-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1E293B]">System Fields</span>
      </div>
      <SystemFieldsRenderer
        fields={getFilteredAdditionalFields()}
        showMore
        hideShowMore
        onToggleShowMore={() => setShowMoreSystemFields?.(!showMoreSystemFields)}
        pinnedFields={pinnedFields}
        onTogglePin={togglePinField}
        assetMode={assetMode}
        purchaseMode={purchaseMode}
      />
    </div>
  ) : null;

  return (
    <div className="border border-[#DFE5ED] rounded-lg" ref={ticketFieldsRef}>
      <button
        onClick={() => setTicketFieldsExpanded(!ticketFieldsExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#364658]" />
          <h3 className="text-[13px] font-semibold text-[#364658]">{fieldsTitle}</h3>
        </div>
        {ticketFieldsExpanded ? (
          <ChevronDown size={16} className="text-[#7B8FA5]" />
        ) : (
          <ChevronRight size={16} className="text-[#7B8FA5]" />
        )}
      </button>

      {/* Asset Fields — Hardware Asset detail page. System Fields ride inside AssetFields'
          "View more" (passed as `footer`) so one toggle reveals extra + system fields. */}
      {assetMode && assetState && (ticketFieldsExpanded || propertiesSearchQuery) && (
        <AssetFields
          state={assetState}
          pinnedFields={pinnedFields}
          togglePinField={togglePinField}
          propertiesSearchQuery={propertiesSearchQuery}
          softwareMode={softwareMode}
          cmdbMode={cmdbMode}
          nonItMode={nonItMode}
          licenseMode={licenseMode}
          contractMode={contractMode}
          purchaseMode={purchaseMode}
          patchMode={patchMode}
          patchDeployMode={patchDeployMode}
          deploymentType={deploymentType}
          deploymentStatus={deploymentStatus}
          endpointMode={endpointMode}
          cveMode={cveMode}
          footer={systemFieldsSection}
        />
      )}

      {!assetMode && (ticketFieldsExpanded || propertiesSearchQuery) && (
        <div className="px-4 pb-4 space-y-2">
          {/* Current Stage (shown above Status when a stage is provided) */}
          {getFilteredTicketFields().includes('Status') && statusGroupLabel && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">Current Stage</div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3FB] border border-[#D6E6F5] text-[#2F7AB8] text-[11px] font-semibold leading-none">
                <span className="size-1.5 rounded-full bg-[#3D8BD0] flex-shrink-0" />
                {statusGroupLabel}
              </span>
            </div>
          </div>
          )}

          {/* Status */}
          {getFilteredTicketFields().includes('Status') && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>Status</span>
              {!compactTicketFields && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePinField('Status'); }}
                    className="flex items-center"
                  >
                    <PinIcon
                      size={14}
                      className={`transition-opacity ${pinnedFields.includes('Status') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {pinnedFields.includes('Status') ? 'Unpin this field' : 'Pin this field on top'}
                </TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="group relative flex-1" ref={statusDropdownRef}>
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                style={{ backgroundColor: statusOptions.find((o: any) => o.label === selectedStatus)?.color || getCurrentStatusColor() }}
              ></div>
              <button
                title={selectedStatus}
                className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left truncate"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                {statusGroupLabel && selectedStatus.includes(':') ? selectedStatus.split(':').slice(1).join(':').trim() : selectedStatus}
              </button>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                  {statusOptions.map((option) => (
                    <button
                      key={option.label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                      onClick={() => {
                        setSelectedStatus(option.label);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <div className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                      <span className="text-[13px] text-[#364658] truncate">{option.display ?? option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Move Stage — highlighted callout shortcut back to Planning when a Change is Rejected during Implementation */}
          {selectedStatus === 'Implementation: Rejected' && (
          <div className="relative overflow-hidden rounded-lg border border-[#FDE0B4] bg-gradient-to-br from-[#FFF8EF] to-[#FEF1DC] p-3 shadow-[0_1px_2px_rgba(217,119,6,0.08)]">
            <span className="absolute left-0 top-0 h-full w-1 bg-[#F59E0B]" />
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center size-8 rounded-lg bg-[#F59E0B]/15 flex-shrink-0">
                <CornerUpLeft size={16} className="text-[#D97706]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[#92400E]">Implementation Rejected</div>
                <button
                  onClick={() => setSelectedStatus('Planning: In Progress')}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#3D8BD0] hover:text-[#2F7AB8] hover:underline transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Planning
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Priority */}
          {getFilteredTicketFields().includes('Priority') && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>Priority</span>
              {!compactTicketFields && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePinField('Priority'); }}
                    className="flex items-center"
                  >
                    <PinIcon
                      size={14}
                      className={`transition-opacity ${pinnedFields.includes('Priority') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {pinnedFields.includes('Priority') ? 'Unpin this field' : 'Pin this field on top'}
                </TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="group relative flex-1" ref={priorityDropdownRef}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none z-10">
                {Array.from({ length: priorityOptions.find(p => p.label === selectedPriority)?.bars || 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] h-2.5 rounded-sm"
                    style={{ backgroundColor: getCurrentPriorityColor() }}
                  />
                ))}
              </div>
              <button
                className="w-full pl-8 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                {selectedPriority}
              </button>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Priority Dropdown Menu */}
              {showPriorityDropdown && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                      onClick={() => {
                        setSelectedPriority(option.label);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <div className="flex gap-0.5 flex-shrink-0">
                        {Array.from({ length: option.bars }).map((_, i) => (
                          <div
                            key={i}
                            className="w-[2px] h-2.5 rounded-sm"
                            style={{ backgroundColor: option.color }}
                          />
                        ))}
                      </div>
                      <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Assignee */}
          {getFilteredTicketFields().includes('Assignee') && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>Assignee</span>
              {!compactTicketFields && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePinField('Assignee'); }}
                    className="flex items-center"
                  >
                    <PinIcon
                      size={14}
                      className={`transition-opacity ${pinnedFields.includes('Assignee') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {pinnedFields.includes('Assignee') ? 'Unpin this field' : 'Pin this field on top'}
                </TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="group relative flex-1" ref={assigneeDropdownRef}>
              <button
                className="w-full flex items-center gap-2 pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              >
                <div 
                  className="size-5 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: getCurrentAssigneeColor() }}
                >
                  {assigneeOptions.find(a => a.label === selectedAssignee)?.initials || 'NA'}
                </div>
                <span className="truncate">{selectedAssignee}</span>
              </button>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Assignee Dropdown Menu */}
              {showAssigneeDropdown && (
                <div className="absolute top-full right-0 mt-1 w-full min-w-[280px] max-w-[320px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                  {/* Search Box */}
                  <div className="px-3 pb-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Search for users..."
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Unassigned Option */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors border-b border-[#E5E7EB]"
                    onClick={() => {
                      setSelectedAssignee('Unassigned');
                      setShowAssigneeDropdown(false);
                      setAssigneeSearchQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0"></div>
                      <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                    </div>
                  </button>
                  
                  {/* Assignee Options */}
                  {filteredAssigneeOptions.map((option) => (
                    <button
                      key={option.label}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                      onClick={() => {
                        setSelectedAssignee(option.label);
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
                        {selectedAssignee === option.label && (
                          <Check size={14} className="text-[#3D8BD0]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Technician Group */}
          {getFilteredTicketFields().includes('Technician Group') && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>Technician Group</span>
              {!compactTicketFields && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePinField('Technician Group'); }}
                    className="flex items-center"
                  >
                    <PinIcon
                      size={14}
                      className={`transition-opacity ${pinnedFields.includes('Technician Group') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {pinnedFields.includes('Technician Group') ? 'Unpin this field' : 'Pin this field on top'}
                </TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="group relative flex-1" ref={techGroupDropdownRef}>
              <button
                className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                onClick={() => setShowTechGroupDropdown(!showTechGroupDropdown)}
              >
                {selectedTechGroup}
              </button>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Tech Group Dropdown Menu */}
              {showTechGroupDropdown && (
                <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                  {techGroupOptions.map((option) => (
                    <button
                      key={option.label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                      onClick={() => {
                        setSelectedTechGroup(option.label);
                        setShowTechGroupDropdown(false);
                      }}
                    >
                      <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Urgency / Impact / Tags are upfront too — 7 fields before "View more" */}
            <div className="mt-3 space-y-2">
              {/* Urgency */}
              {getFilteredTicketFields().includes('Urgency') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Urgency</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Urgency'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Urgency') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Urgency') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={urgencyDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentUrgencyColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowUrgencyDropdown(!showUrgencyDropdown)}
                  >
                    {selectedUrgency}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Urgency Dropdown Menu */}
                  {showUrgencyDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {urgencyOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedUrgency(option.label);
                            setShowUrgencyDropdown(false);
                          }}
                        >
                          <div 
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Impact */}
              {getFilteredTicketFields().includes('Impact') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Impact</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Impact'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Impact') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Impact') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={impactDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentImpactColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowImpactDropdown(!showImpactDropdown)}
                  >
                    {selectedImpact}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Impact Dropdown Menu */}
                  {showImpactDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {impactOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedImpact(option.label);
                            setShowImpactDropdown(false);
                          }}
                        >
                          <div 
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Tags */}
              {(!propertiesSearchQuery || 'tags'.includes(propertiesSearchQuery.toLowerCase())) && (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] pt-1">Tags</div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] text-[#364658] text-[11px] rounded-md">
                        {tag}
                        <button 
                          className="hover:text-[#2563EB]"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {!showTagInput && (
                      <button
                        onClick={() => setShowTagInput(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[#3D8BD0] text-[12px] hover:bg-[#F3F4F6] rounded transition-colors"
                      >
                        <Plus size={12} />
                        Add tag
                      </button>
                    )}
                  </div>
                </div>
                {showTagInput && (
                  <input
                    type="text"
                    placeholder="Add tags..."
                    value={tagInputValue}
                    onChange={(e) => setTagInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInputValue.trim()) {
                        setTags([...tags, tagInputValue.trim()]);
                        setTagInputValue('');
                        setShowTagInput(false);
                      } else if (e.key === 'Escape') {
                        setTagInputValue('');
                        setShowTagInput(false);
                      }
                    }}
                    onBlur={() => {
                      if (tagInputValue.trim()) {
                        setTags([...tags, tagInputValue.trim()]);
                      }
                      setTagInputValue('');
                      setShowTagInput(false);
                    }}
                    autoFocus
                    className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F3F4F6] border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                )}
              </div>
              )}
            </div>

          {/* View More Button - Only show when collapsed (hidden entirely in V2 compact mode) */}
          {!compactTicketFields && !showMoreFields && !propertiesSearchQuery && (
          <div className="mt-3">
            <button
              onClick={() => setShowMoreFields(!showMoreFields)}
              className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
            >
              View more
              <ChevronDown size={14} />
            </button>
          </div>
          )}

          {/* Additional Ticket Fields (never expanded in V2 compact mode — its 7 kept fields are
              all upfront, and the View more toggle is hidden there) */}
          {(showMoreFields || propertiesSearchQuery) && (
            <div className="mt-3 space-y-2">
              {/* Category */}
              {getFilteredTicketFields().includes('Category') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Category</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Category'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Category') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Category') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={categoryDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    {selectedCategory}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedCategory(option.label);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Department */}
              {getFilteredTicketFields().includes('Department') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Department</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Department'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Department') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Department') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={departmentDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  >
                    {selectedDepartment}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showDepartmentDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {departmentOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedDepartment(option.label);
                            setShowDepartmentDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Source */}
              {getFilteredTicketFields().includes('Source') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Source</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Source'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Source') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Source') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={sourceDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  >
                    {selectedSource}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showSourceDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {sourceOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedSource(option.label);
                            setShowSourceDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Location */}
              {getFilteredTicketFields().includes('Location') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Location</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Location'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Location') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Location') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={locationDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  >
                    {selectedLocation}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showLocationDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {locationOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedLocation(option.label);
                            setShowLocationDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Vendor */}
              {getFilteredTicketFields().includes('Vendor') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Vendor</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Vendor'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Vendor') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Vendor') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={vendorDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                  >
                    {selectedVendor}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showVendorDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {vendorOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedVendor(option.label);
                            setShowVendorDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Support Level */}
              {getFilteredTicketFields().includes('Support Level') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Support Level</span>
                  {!compactTicketFields && (
              <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Support Level'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Support Level') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Support Level') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
                <div className="group relative flex-1" ref={supportLevelDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowSupportLevelDropdown(!showSupportLevelDropdown)}
                  >
                    {selectedSupportLevel}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showSupportLevelDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {supportLevelOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedSupportLevel(option.label);
                            setShowSupportLevelDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Problem-specific fields — last in the expanded list */}
              {showProblemFields && (
                <>
                  <ProblemFieldRow
                    label="Business Service"
                    options={['Email Service', 'Network Service', 'Database Service', 'Authentication Service', 'Web Portal', 'Storage Service']}
                    placeholder="Select"
                  />
                  <ProblemFieldRow
                    label="Nature of Problem"
                    required
                    options={['Proactive', 'Reactive']}
                    defaultValue="Proactive"
                  />
                  <ProblemFieldRow
                    label="Known Error"
                    options={['Yes', 'No']}
                    defaultValue="Yes"
                  />
                </>
              )}

              {/* System Fields — revealed by the SAME "View more" as the extra ticket fields.
                  V2 compact mode: System Fields live in the Incident Details tab instead. */}
              {!compactTicketFields && systemFieldsSection}

              {/* View Less Button */}
              {!compactTicketFields && !propertiesSearchQuery && (
              <div className="mt-3 pt-3">
                <button
                  onClick={() => setShowMoreFields(false)}
                  className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
                >
                  View less
                  <ChevronUp size={14} />
                </button>
              </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}