/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { ChevronDown, ChevronUp, ChevronRight, Tag, Pin as PinIcon, Maximize2, X, Search } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Fragment, useEffect, useState } from 'react';
import { DEMO_CUSTOM_FORM_FIELDS } from '../demoCustomFields';
import { DescriptionExpandModal } from './DescriptionExpandModal';
import { toast } from 'sonner';

/** One Key Info field as the expand popup renders it. `options` present -> a select. */
export interface ExpandKeyField {
  label: string;
  value: string;
  options?: { label: string; color?: string }[];
  color?: string;
}

interface AdditionalFieldsAccordionProps {
  /** Module-specific heading, e.g. "Request Information" / "Problem Information". */
  title?: string;
  /** Overrides the demo custom-field list — the Task page ships its own, shorter set. */
  customFields?: typeof DEMO_CUSTOM_FORM_FIELDS;
  /** Drops the request-only base fields (Project Name … Description) — a task has none of them. */
  hideBaseFields?: boolean;
  /** Key Info fields, shown FIRST in the expand popup so it holds the whole record, not half.
   *  Supplied by the panel, which owns their state. */
  keyInfoFields?: ExpandKeyField[];
  onKeyInfoChange?: (label: string, value: string) => void;
  additionalFieldsExpanded: boolean;
  setAdditionalFieldsExpanded: (expanded: boolean) => void;
  additionalFieldsTab: 'form' | 'system';
  setAdditionalFieldsTab: (tab: 'form' | 'system') => void;
  showMoreSystemFields: boolean;
  setShowMoreSystemFields: (show: boolean) => void;
  propertiesSearchQuery: string;
  additionalFieldsRef: React.RefObject<HTMLDivElement>;
  
  // Form field dropdowns
  showProjectNameDropdown: boolean;
  setShowProjectNameDropdown: (show: boolean) => void;
  showCostCenterDropdown: boolean;
  setShowCostCenterDropdown: (show: boolean) => void;
  showBuildingDropdown: boolean;
  setShowBuildingDropdown: (show: boolean) => void;
  showRequestChannelDropdown: boolean;
  setShowRequestChannelDropdown: (show: boolean) => void;
  
  // Selected values
  selectedProjectName: string;
  setSelectedProjectName: (name: string) => void;
  selectedCostCenter: string;
  setSelectedCostCenter: (center: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  selectedRequestChannel: string;
  setSelectedRequestChannel: (channel: string) => void;
  companyValue: string;
  setCompanyValue: (value: string) => void;
  
  // Options
  projectNameOptions: any[];
  costCenterOptions: any[];
  buildingOptions: any[];
  requestChannelOptions: any[];
  
  // Refs
  projectNameDropdownRef: React.RefObject<HTMLDivElement>;
  costCenterDropdownRef: React.RefObject<HTMLDivElement>;
  buildingDropdownRef: React.RefObject<HTMLDivElement>;
  requestChannelDropdownRef: React.RefObject<HTMLDivElement>;
  
  // Helper functions
  getFilteredAdditionalFormFields: () => string[];
  getFilteredAdditionalFields: () => string[];
  togglePinField: (field: string) => void;
  getCurrentProjectNameColor: () => string;
  getCurrentCostCenterColor: () => string;
  getCurrentRequestChannelColor: () => string;
  
  // Pinned fields
  pinnedFields: string[];

  // Render the asset-specific system fields instead of the ticket ones
  assetMode?: boolean;
  // Render the purchase-specific system fields
  purchaseMode?: boolean;
  // Append the 50+ demo custom form fields (ticket detail page only)
  demoCustomFields?: boolean;
}

export function AdditionalFieldsAccordion(props: AdditionalFieldsAccordionProps) {
  const {
    title = 'Additional Fields',
    customFields,
    hideBaseFields = false,
    keyInfoFields = [],
    onKeyInfoChange,
    additionalFieldsExpanded,
    setAdditionalFieldsExpanded,
    additionalFieldsTab,
    setAdditionalFieldsTab,
    showMoreSystemFields,
    setShowMoreSystemFields,
    propertiesSearchQuery,
    additionalFieldsRef,
    showProjectNameDropdown,
    setShowProjectNameDropdown,
    showCostCenterDropdown,
    setShowCostCenterDropdown,
    showBuildingDropdown,
    setShowBuildingDropdown,
    showRequestChannelDropdown,
    setShowRequestChannelDropdown,
    selectedProjectName,
    setSelectedProjectName,
    selectedCostCenter,
    setSelectedCostCenter,
    selectedBuilding,
    setSelectedBuilding,
    selectedRequestChannel,
    setSelectedRequestChannel,
    companyValue,
    setCompanyValue,
    projectNameOptions,
    costCenterOptions,
    buildingOptions,
    requestChannelOptions,
    projectNameDropdownRef,
    costCenterDropdownRef,
    buildingDropdownRef,
    requestChannelDropdownRef,
    getFilteredAdditionalFormFields,
    getFilteredAdditionalFields,
    togglePinField,
    getCurrentProjectNameColor,
    getCurrentCostCenterColor,
    getCurrentRequestChannelColor,
    pinnedFields,
    assetMode = false,
    purchaseMode = false,
    demoCustomFields = false,
  } = props;

  // Whichever custom-field set this page carries — the accordion and its popup both read this.
  const customList = customFields ?? DEMO_CUSTOM_FORM_FIELDS;

  // Collapse the long custom-field list until the user clicks "View more"
  const [showAllFormFields, setShowAllFormFields] = useState(false);
  // Description custom field (single-line + expandable rich editor)
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showDescriptionExpand, setShowDescriptionExpand] = useState(false);
  // Centered popup showing ALL form fields two-per-row
  const [showExpandFields, setShowExpandFields] = useState(false);
  // Field search inside the expand popup — matches on label.
  const [expandQuery, setExpandQuery] = useState('');
  // User-created custom fields are editable — edited values live here,
  // falling back to the mock defaults (shared by the accordion + popup).
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const customVal = (label: string, fallback: string) => customFieldValues[label] ?? fallback;
  const setCustomVal = (label: string, value: string) =>
    setCustomFieldValues((prev) => ({ ...prev, [label]: value }));
  // The popup edits a DRAFT; values reach the accordion only on Update.
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const setDraft = (label: string, value: string) =>
    setDraftFields((prev) => ({ ...prev, [label]: value }));
  const openExpandFields = () => {
    const d: Record<string, string> = {
      'Project Name': selectedProjectName,
      'Cost Center': selectedCostCenter,
      'Business Unit': companyValue,
      'Building': selectedBuilding,
      'Request Channel': selectedRequestChannel,
      'Description': descriptionValue,
    };
    for (const f of customList) d[f.label] = customVal(f.label, f.value);
    for (const f of keyInfoFields) d[f.label] = f.value;
    setDraftFields(d);
    setExpandQuery('');
    setShowExpandFields(true);
  };
  /* Popup search — one predicate over every section so a query hides whole groups cleanly. */
  const expandMatch = (label: string) => !expandQuery.trim() || label.toLowerCase().includes(expandQuery.trim().toLowerCase());
  const shownKeyFields = keyInfoFields.filter((f) => expandMatch(f.label));
  const BASE_EXPAND_FIELDS = ['Project Name', 'Cost Center', 'Business Unit', 'Building', 'Request Channel', 'Description'];
  const baseFieldsShown = !hideBaseFields && BASE_EXPAND_FIELDS.some(expandMatch);
  // Shown-of-total across every section the popup renders, for the result strip under the header.
  const expandAllLabels = [
    ...keyInfoFields.map((f) => f.label),
    ...(hideBaseFields ? [] : BASE_EXPAND_FIELDS),
    ...(demoCustomFields ? customList.map((f) => f.label) : []),
  ];
  const expandTotal = expandAllLabels.length;
  const expandShown = expandAllLabels.filter(expandMatch).length;

  const applyExpandFields = () => {
    setSelectedProjectName(draftFields['Project Name']);
    setSelectedCostCenter(draftFields['Cost Center']);
    setCompanyValue(draftFields['Business Unit']);
    setSelectedBuilding(draftFields['Building']);
    setSelectedRequestChannel(draftFields['Request Channel']);
    setDescriptionValue(draftFields['Description']);
    setCustomFieldValues((prev) => {
      const next = { ...prev };
      for (const f of customList) next[f.label] = draftFields[f.label] ?? f.value;
      return next;
    });
    // Key Info lives in the panel's state, so it commits through the callback.
    for (const f of keyInfoFields) {
      const next = draftFields[f.label];
      if (next !== undefined && next !== f.value) onKeyInfoChange?.(f.label, next);
    }
    setShowExpandFields(false);
    toast.success('Fields updated');
  };

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      // Project Name dropdown
      if (showProjectNameDropdown && projectNameDropdownRef.current && !projectNameDropdownRef.current.contains(event.target as Node)) {
        setShowProjectNameDropdown(false);
      }
      
      // Cost Center dropdown
      if (showCostCenterDropdown && costCenterDropdownRef.current && !costCenterDropdownRef.current.contains(event.target as Node)) {
        setShowCostCenterDropdown(false);
      }
      
      // Building dropdown
      if (showBuildingDropdown && buildingDropdownRef.current && !buildingDropdownRef.current.contains(event.target as Node)) {
        setShowBuildingDropdown(false);
      }
      
      // Request Channel dropdown
      if (showRequestChannelDropdown && requestChannelDropdownRef.current && !requestChannelDropdownRef.current.contains(event.target as Node)) {
        setShowRequestChannelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    showProjectNameDropdown,
    showCostCenterDropdown,
    showBuildingDropdown,
    showRequestChannelDropdown,
    projectNameDropdownRef,
    costCenterDropdownRef,
    buildingDropdownRef,
    requestChannelDropdownRef,
    setShowProjectNameDropdown,
    setShowCostCenterDropdown,
    setShowBuildingDropdown,
    setShowRequestChannelDropdown
  ]);

  return (
    <div className="border border-[#DFE5ED] rounded-lg" ref={additionalFieldsRef}>
      {/* Header pins just under the panel's sticky search header (86px tall)
          while the long field list scrolls beneath it in the common panel scroll. */}
      <div className="sticky z-40 rounded-t-lg bg-white" style={{ top: 'var(--panel-header-h, 86px)' }}>
        <div
          onClick={() => setAdditionalFieldsExpanded(!additionalFieldsExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors rounded-lg cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[#364658]" />
            <h3 className="text-[13px] font-semibold text-[#364658]">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); openExpandFields(); }}
                  className="p-1 rounded text-[#7B8FA5] hover:bg-[#EDF0F3] hover:text-[#364658] transition-colors"
                >
                  <Maximize2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Expand fields</TooltipContent>
            </Tooltip>
            {additionalFieldsExpanded ? (
              <ChevronDown size={16} className="text-[#7B8FA5]" />
            ) : (
              <ChevronRight size={16} className="text-[#7B8FA5]" />
            )}
          </div>
        </div>

      </div>

      {(additionalFieldsExpanded || propertiesSearchQuery) && (
        <div className="px-4 pb-4 pt-3">
          {/* Form Fields (System Fields were moved under the main Fields accordion) */}
          <div className="space-y-3">
              {!hideBaseFields && getFilteredAdditionalFormFields().includes('Project Name') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Project Name</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Project Name'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Project Name') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Project Name') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={projectNameDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentProjectNameColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowProjectNameDropdown(!showProjectNameDropdown)}
                  >
                    {selectedProjectName}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showProjectNameDropdown && (
                    <div className="app-menu absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {projectNameOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedProjectName(option.label);
                            setShowProjectNameDropdown(false);
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

              {!hideBaseFields && getFilteredAdditionalFormFields().includes('Cost Center') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Cost Center</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Cost Center'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Cost Center') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Cost Center') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={costCenterDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentCostCenterColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowCostCenterDropdown(!showCostCenterDropdown)}
                  >
                    {selectedCostCenter}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showCostCenterDropdown && (
                    <div className="app-menu absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {costCenterOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedCostCenter(option.label);
                            setShowCostCenterDropdown(false);
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

              {!hideBaseFields && getFilteredAdditionalFormFields().includes('Business Unit') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Business Unit</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Business Unit'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Business Unit') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Business Unit') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={companyValue}
                  onChange={(e) => setCompanyValue(e.target.value)}
                  className="flex-1 px-3 py-2 text-[13px] text-[#364658] rounded hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent focus:bg-white"
                />
              </div>
              )}

              {!hideBaseFields && getFilteredAdditionalFormFields().includes('Building') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Building</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Building'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Building') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Building') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={buildingDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] rounded-md hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent focus:bg-white text-left"
                    onClick={() => setShowBuildingDropdown(!showBuildingDropdown)}
                  >
                    {selectedBuilding}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showBuildingDropdown && (
                    <div className="app-menu absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {buildingOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedBuilding(option.label);
                            setShowBuildingDropdown(false);
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

              {!hideBaseFields && getFilteredAdditionalFormFields().includes('Request Channel') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Request Channel</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Request Channel'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Request Channel') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Request Channel') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={requestChannelDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentRequestChannelColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowRequestChannelDropdown(!showRequestChannelDropdown)}
                  >
                    {selectedRequestChannel}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showRequestChannelDropdown && (
                    <div className="app-menu absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {requestChannelOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedRequestChannel(option.label);
                            setShowRequestChannelDropdown(false);
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

              {demoCustomFields && !hideBaseFields && (!propertiesSearchQuery || 'description'.includes(propertiesSearchQuery.toLowerCase())) && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">Description</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowDescriptionExpand(true)}
                        className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded hover:bg-[#F5F7FA] transition-colors text-left"
                      >
                        <span className={`truncate ${descriptionValue ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>
                          {descriptionValue || 'Add description'}
                        </span>
                        <Maximize2 size={14} className="text-[#7B8FA5] flex-shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      {descriptionValue
                        ? (descriptionValue.length > 240
                            ? descriptionValue.slice(0, 240).trimEnd() + '…'
                            : descriptionValue)
                        : 'Add description'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {demoCustomFields && (() => {
                // Pinned custom fields move to the top "Pinned Fields" section,
                // so drop them here; also honour the top search box.
                const matches = customList.filter(
                  (f) =>
                    !pinnedFields.includes(f.label) &&
                    (!propertiesSearchQuery || f.label.toLowerCase().includes(propertiesSearchQuery.toLowerCase()))
                );
                // Collapsed view stops at ~7 fields before "View more". Where the built-in fields
                // render they already fill six of those slots, so only one custom field joins them;
                // pages without them (Task) carry the whole budget themselves.
                const collapsedCount = hideBaseFields ? 7 : 1;
                const expanded = !!propertiesSearchQuery || showAllFormFields;
                const visible = expanded ? matches : matches.slice(0, collapsedCount);
                return (
                  <>
                    {visible.map((f, i) => (
                      <Fragment key={f.label}>
                      {/* Group header — the form-builder separator the admin placed between sections */}
                      {f.group && (i === 0 || visible[i - 1].group !== f.group) && (
                        /* The rule separates this group from the fields above it — with no built-in
                           fields (Task), the first group has nothing above, so it starts clean. */
                        <div className={i === 0 && hideBaseFields ? 'pb-0.5' : 'mt-3 border-t border-[#EEF1F4] pt-5 pb-0.5'}>
                          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1E293B]">{f.group}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                          <span>{f.label}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePinField(f.label); }}
                                className="flex items-center"
                              >
                                <PinIcon
                                  size={14}
                                  className={`transition-opacity ${pinnedFields.includes(f.label) ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {pinnedFields.includes(f.label) ? 'Unpin this field' : 'Pin this field on top'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex-1 min-w-0 relative">
                          {f.color && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: f.color }} />
                          )}
                          <input
                            type="text"
                            value={customVal(f.label, f.value)}
                            onChange={(e) => setCustomVal(f.label, e.target.value)}
                            className={`w-full ${f.color ? 'pl-6' : 'pl-3'} pr-3 py-2 text-[13px] text-[#364658] bg-transparent rounded hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent focus:bg-white transition-colors`}
                          />
                        </div>
                      </div>
                      </Fragment>
                    ))}
                    {!propertiesSearchQuery && !showAllFormFields && matches.length > collapsedCount && (
                      <div>
                        <button
                          onClick={() => setShowAllFormFields(true)}
                          className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
                        >
                          View more
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    {!propertiesSearchQuery && showAllFormFields && (
                      <div>
                        <button
                          onClick={() => setShowAllFormFields(false)}
                          className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
                        >
                          View less
                          <ChevronUp size={14} />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        </div>
      )}

      <DescriptionExpandModal
        isOpen={showDescriptionExpand}
        onClose={() => setShowDescriptionExpand(false)}
        value={descriptionValue}
        onChange={setDescriptionValue}
      />

      {/* Expanded Form Fields popup — every field in a two-column grid */}
      {showExpandFields && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExpandFields(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[840px] max-h-[86vh] flex flex-col overflow-hidden">
            {/* Header — title, then the field search, then close. The search used to sit in a
                full-width band of its own, which read as a second toolbar for one small control;
                inline it balances the row and hands the body back its space. */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E7EB] flex-shrink-0">
              {/* Same heading as the card it expands from, so the modal is clearly that card. */}
              <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-[#364658]">{title}</h2>
              <div className="relative w-[240px] flex-shrink-0">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  value={expandQuery}
                  onChange={(e) => setExpandQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setExpandQuery(''); } }}
                  placeholder="Search fields"
                  className="h-8 w-full rounded border border-transparent bg-[#F5F7FA] pl-8 pr-7 text-[13px] text-[#364658] transition-colors placeholder:text-[#9CA3AF] hover:bg-[#EFF2F6] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                />
                {expandQuery && (
                  <button
                    onClick={() => setExpandQuery('')}
                    title="Clear"
                    className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded hover:bg-[#E5E9EF]"
                  >
                    <X size={13} className="text-[#7B8FA5]" />
                  </button>
                )}
              </div>
              <button onClick={() => setShowExpandFields(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
                <X size={18} />
              </button>
            </div>

            {/* A search that hides most of the record should say how much it kept. */}
            {expandQuery.trim() && (
              <div className="flex-shrink-0 border-b border-[#EEF1F4] bg-[#FAFBFC] px-5 py-1.5 text-[12px] text-[#7B8FA5]">
                {expandShown > 0
                  ? <>Showing <span className="font-medium text-[#364658]">{expandShown}</span> of {expandTotal} fields</>
                  : <>No fields match &ldquo;{expandQuery.trim()}&rdquo;</>}
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto px-5 py-4">
              {/* Key Info first — the fields a technician changes most, ahead of the form fields. */}
              {shownKeyFields.length > 0 && (
                <div className="mb-5">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {shownKeyFields.map((f) => {
                      const value = draftFields[f.label] ?? f.value;
                      const dot = f.options?.find((o) => o.label === value)?.color ?? f.color;
                      return (
                        <div key={f.label}>
                          <label className="mb-1.5 block text-[13px] text-[#364658]">{f.label}</label>
                          <div className="relative">
                            {dot && <span className="pointer-events-none absolute left-3 top-1/2 z-10 size-2 -translate-y-1/2 rounded-full" style={{ backgroundColor: dot }} />}
                            {f.options ? (
                              <select
                                value={value}
                                onChange={(e) => setDraft(f.label, e.target.value)}
                                className={`app-select w-full ${dot ? 'pl-7' : 'pl-3'} rounded border border-[#DFE5ED] bg-white py-2 pr-3 text-[13px] text-[#364658] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]`}
                              >
                                {f.options.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => setDraft(f.label, e.target.value)}
                                className={`w-full ${dot ? 'pl-7' : 'pl-3'} rounded border border-[#DFE5ED] bg-white py-2 pr-3 text-[13px] text-[#364658] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No heading here — the popup is already titled for this group, so a repeat of it
                  would only label the fields twice. A hairline still separates them from Key
                  Information, matching how the custom-field groups below are divided. */}
              {baseFieldsShown && shownKeyFields.length > 0 && (
                <div className="mb-4 border-t border-[#EEF1F4]" />
              )}
              <div className={`grid grid-cols-2 gap-x-5 gap-y-4 ${hideBaseFields ? 'hidden' : ''}`}>
                <div className={expandMatch('Project Name') ? '' : 'hidden'}>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Project Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: projectNameOptions.find((o) => o.label === draftFields['Project Name'])?.color || getCurrentProjectNameColor() }} />
                    <select
                      value={draftFields['Project Name'] ?? selectedProjectName}
                      onChange={(e) => setDraft('Project Name', e.target.value)}
                      className="app-select w-full pl-7 pr-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                    >
                      {projectNameOptions.map((o) => (
                        <option key={o.label} value={o.label}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={expandMatch('Cost Center') ? '' : 'hidden'}>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Cost Center</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: costCenterOptions.find((o) => o.label === draftFields['Cost Center'])?.color || getCurrentCostCenterColor() }} />
                    <select
                      value={draftFields['Cost Center'] ?? selectedCostCenter}
                      onChange={(e) => setDraft('Cost Center', e.target.value)}
                      className="app-select w-full pl-7 pr-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                    >
                      {costCenterOptions.map((o) => (
                        <option key={o.label} value={o.label}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={expandMatch('Business Unit') ? '' : 'hidden'}>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Business Unit</label>
                  <input
                    type="text"
                    value={draftFields['Business Unit'] ?? companyValue}
                    onChange={(e) => setDraft('Business Unit', e.target.value)}
                    className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
                <div className={expandMatch('Building') ? '' : 'hidden'}>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Building</label>
                  <select
                    value={draftFields['Building'] ?? selectedBuilding}
                    onChange={(e) => setDraft('Building', e.target.value)}
                    className="app-select w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  >
                    {buildingOptions.map((o) => (
                      <option key={o.label} value={o.label}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className={expandMatch('Request Channel') ? '' : 'hidden'}>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Request Channel</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: requestChannelOptions.find((o) => o.label === draftFields['Request Channel'])?.color || getCurrentRequestChannelColor() }} />
                    <select
                      value={draftFields['Request Channel'] ?? selectedRequestChannel}
                      onChange={(e) => setDraft('Request Channel', e.target.value)}
                      className="app-select w-full pl-7 pr-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                    >
                      {requestChannelOptions.map((o) => (
                        <option key={o.label} value={o.label}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {demoCustomFields && (
                  <div className={`col-span-2 ${expandMatch('Description') ? '' : 'hidden'}`}>
                    <label className="block text-[13px] text-[#364658] mb-1.5">Description</label>
                    <textarea
                      value={draftFields['Description'] ?? descriptionValue}
                      onChange={(e) => setDraft('Description', e.target.value)}
                      placeholder="Description..."
                      className="w-full min-h-[84px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white resize-y focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent placeholder:text-[#9CA3AF]"
                    />
                  </div>
                )}
              </div>

              {/* Grouped custom fields */}
              {demoCustomFields && (() => {
                const groups: { title: string; fields: typeof customList }[] = [];
                for (const f of customList) {
                  const last = groups[groups.length - 1];
                  if (!last || last.title !== (f.group || '')) groups.push({ title: f.group || '', fields: [f] });
                  else last.fields.push(f);
                }
                return groups.map((g) => ({ ...g, fields: g.fields.filter((f) => expandMatch(f.label)) })).filter((g) => g.fields.length).map((g) => (
                  <div key={g.title} className="mt-5 border-t border-[#EEF1F4] pt-4">
                    <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#1E293B] mb-3">{g.title}</div>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      {g.fields.map((f) => (
                        <div key={f.label}>
                          <label className="block text-[13px] text-[#364658] mb-1.5">{f.label}</label>
                          <div className="relative">
                            {f.color && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: f.color }} />
                            )}
                            <input
                              type="text"
                              value={draftFields[f.label] ?? customVal(f.label, f.value)}
                              onChange={(e) => setDraft(f.label, e.target.value)}
                              className={`w-full ${f.color ? 'pl-7' : 'pl-3'} pr-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Sticky footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#E5E7EB] flex-shrink-0 bg-white">
              <button
                onClick={applyExpandFields}
                className="px-4 py-1.5 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2C6B9F] transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setShowExpandFields(false)}
                className="px-4 py-1.5 border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}