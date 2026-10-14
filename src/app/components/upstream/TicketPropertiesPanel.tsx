/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Search, Filter, X, ChevronDown, ChevronRight, ChevronUp, Clock, CalendarDays, FileText, User, Tag, Folder, Activity, Sparkles, Pin as PinIcon, PinOff, Plus, Check, Play, Pause, Square, Paperclip, Download, Trash2, Edit, Link, Ticket as TicketIcon, Lightbulb, MoreVertical, Copy, CornerUpRight, Mail, StickyNote, Users, Forward, RefreshCw, Search as SearchIcon, Zap, MessageSquare, Brain, Loader2, Library, BookOpen, Settings, Pencil, GripVertical, ChevronUp as ArrowUp, ChevronDown as ArrowDown, Blocks, Keyboard, Layers, Monitor, AppWindow, Files, CheckCircle, SquarePen, History, ChevronLeft , Lock, ThumbsUp, ThumbsDown , ArrowRight, Info } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { createPortal } from 'react-dom';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { VipPill, isVipRequester } from '../VipPill';
import { isFirstResponseBreached } from '../HeaderAlertPills';
import { SystemFieldsRenderer } from './SystemFieldsRenderer';
import { TicketFieldsAccordion } from './TicketFieldsAccordion';
import { KnowledgeBaseModal } from '../KnowledgeBaseModal';
import type { AssetFieldState, AgentInfo } from './AssetFields';
import { assetKeyInfoFields, applyAssetKeyInfo } from './AssetFields';
import { AdditionalFieldsAccordion } from './AdditionalFieldsAccordion';
import { getSlaPenaltyAmount, formatPenaltyAmount } from '../TicketDrawerUtils';
import { DateTimePickerPopup } from './DateTimePickerPopup';
import { PinnedFieldsAccordion } from '../PinnedFieldsAccordion';
import { MiniCalendar, type CalendarEvent } from '../MiniCalendar';
import { useState, useEffect, useRef } from 'react';
import { Minus, X as XIcon, Send, Image, Smile, Bot, ShieldCheck, ShieldAlert, ShieldX, KeyRound, BadgeCheck, ScanLine, Eye, SquareCheckBig } from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';
import { AddMembersPanel, memberAvatarColor, memberInitials, type DirectoryUser } from '../AddMembersPanel';
import { ProjectKeyInfo } from '../ProjectKeyInfo';
import { toast } from 'sonner';
import { EditorQuickActions, EditorFormattingRow, EditorSendActions, EditorAiAssist } from './EditorToolbar';
import { KnowledgeReviewsPanel } from '../KnowledgeReviewsPanel';
import { SystemInfoAccordion } from '../SystemInfoAccordion';
import { TASK_CUSTOM_FORM_FIELDS, TASK_KEY_FIELDS } from '../taskCustomFields';
import { FileTypeBadge } from '../DescriptionAttachments';
import { PATCH_AFFECTED_PRODUCTS, PATCH_FILES } from '../PatchPanelData';
import type { EmailNotification } from './SendEmailModal';

/** One written review of a knowledge article. Technician reviews are internal; requester reviews
 *  are public, and the requester preview filters to those. */
export interface KnowledgeReview {
  id: string;
  author: string;
  initials: string;
  color: string;
  when: string;
  text: string;
  role: 'technician' | 'requester';
}

interface TicketPropertiesPanelProps {
  // Display label for the fields accordion (defaults to "Ticket Fields")
  fieldsTitle?: string;
  /** Module-specific heading for the Additional Fields card, e.g. "Request Information". */
  additionalTitle?: string;
  // Render the Problem-specific fields (Business Service, Nature of Problem, Known Error)
  showProblemFields?: boolean;
  // Optional header shown above the Status dropdown options (e.g. the current lifecycle stage)
  statusGroupLabel?: string;
  // Show the SLA Status card (hidden on the Hardware Asset detail page)
  showSla?: boolean;
  // Drop the Requester Information accordion entirely (Project detail page)
  hideRequesterInfo?: boolean;
  // Drop the AI Suggestions rail group (Project detail page)
  hideSuggestions?: boolean;
  // Show the asset Users group on a non-asset page, titled Members (Project detail page)
  showMembers?: boolean;
  // Replace the ticket Key Information fields with the PROJECT field set
  projectMode?: boolean;
  projectInfo?: any;
  // Append the 50+ demo custom form fields to Additional Fields (ticket page only)
  demoCustomFields?: boolean;
  // Render the Hardware Asset field set in the fields accordion instead of ticket fields
  assetMode?: boolean;
  assetState?: AssetFieldState;
  // Software-asset variant of the asset field set (Software Type, no CI/View more)
  softwareMode?: boolean;
  cmdbMode?: boolean;
  // Non-IT variant: like softwareMode but without the Software Type field
  nonItMode?: boolean;
  // Software-license variant of the asset field set (Product + License Type only)
  licenseMode?: boolean;
  // Contract variant of the asset field set (contract number/dates/cost/type/vendor)
  contractMode?: boolean;
  // Purchase variant of the asset field set (status/order number/cost/cost center/dates)
  purchaseMode?: boolean;
  // Patch variant of the asset field set (category/severity/approval/test/release date/…)
  patchMode?: boolean;
  // Patch DEPLOYMENT page: deployment-run fields in the Patch Fields accordion
  patchDeployMode?: boolean;
  packageDeployMode?: boolean;
  registryDeployMode?: boolean;
  // ENDPOINT page: endpoint-inventory fields in the (renamed) Endpoint Fields accordion
  endpointMode?: boolean;
  // DETECTED CVE page: CVE-metadata fields in the CVE Fields accordion
  cveMode?: boolean;
  /** Task detail page: task field set + "Task Properties" titles. */
  taskMode?: boolean;
  /** Knowledge page: the right panel is a plain field list — no panel title, no field search. */
  knowledgeMode?: boolean;
  knowledgeInfo?: { status: string; createdOn: string; lastModifiedBy: string; lastModifiedOn: string; folder: string; author: string };
  /** The open patch record's own values — forwarded to AssetFields, see its patchInfo prop. */
  patchInfo?: { category?: string; severity?: string; approvalStatus?: string; releaseDate?: string; kbNumber?: string; rebootRequired?: string; referenceUrl?: string };
  /** Knowledge page: article performance shown in the Analytics accordion. */
  knowledgeAnalytics?: { helpful: number; notHelpful: number; totalRead: number; comments?: number };
  /** Opens the article comments thread — the same side panel the article body opens. */
  onOpenKnowledgeComments?: () => void;
  /** Knowledge page requester preview: internal (technician) reviews are hidden. */
  knowledgeRequesterView?: boolean;
  /* Reviews lifted to the host drawer so the article body and this panel share one thread.
     Omit them and the panel keeps its own state, as every other module does. */
  knowledgeReviewItems?: KnowledgeReview[];
  onKnowledgeReviewsChange?: React.Dispatch<React.SetStateAction<KnowledgeReview[]>>;
  knowledgeReviewsOpen?: boolean;
  onKnowledgeReviewsOpenChange?: (open: boolean) => void;
  // V2 ticket page (TicketDrawerV2): compact 7-field Ticket Fields accordion — extra fields
  // always visible, no View more / System Fields (those move to the Incident Details tab)
  compactTicketFields?: boolean;
  // V2 ticket page: drop the Additional Fields accordion entirely (its fields live in the
  // Incident Details tab). Uses its own section-order storage key so V1's layout is untouched.
  hideAdditionalFields?: boolean;
  // Values for the Agent Information block (asset page replaces Requester Information)
  agentInfo?: AgentInfo;
  // Warranty status pill shown at the top of the asset properties panel
  warranty?: { daysLeft: number; expiryDate?: string };
  // License expiry pill shown at the top of the asset properties panel (software assets)
  licenseExpiry?: { daysLeft: number; expiryDate?: string };
  // Show the Change Calendar (Change detail page only), rendered under SLA Status
  showChangeCalendar?: boolean;
  // Schedule entries for the change currently open (shown in the Change Calendar)
  changeCalendarEvents?: CalendarEvent[];
  // Calendar section title (e.g. "Change Calendar" or "Release Calendar")
  changeCalendarTitle?: string;
  // State
  activeGroup: 'properties' | 'activity' | 'suggestions' | 'chatbot' | 'users' | 'notes' | 'notifications' | 'integration' | 'affected-products' | 'file-details';
  setActiveGroup: (group: 'properties' | 'activity' | 'suggestions' | 'chatbot' | 'users' | 'notes' | 'notifications' | 'integration' | 'affected-products' | 'file-details') => void;
  pinnedFields: string[];
  setPinnedFields: (fields: string[]) => void;
  showPropertiesSearch: boolean;
  setShowPropertiesSearch: (show: boolean) => void;
  propertiesSearchQuery: string;
  setPropertiesSearchQuery: (query: string) => void;
  showPropertiesFilter: boolean;
  setShowPropertiesFilter: (show: boolean) => void;
  selectedFilter: 'all' | 'empty' | 'filled' | 'required';
  setSelectedFilter: (filter: 'all' | 'empty' | 'filled' | 'required') => void;
  
  // Accordion States
  pinnedFieldsExpanded: boolean;
  setPinnedFieldsExpanded: (expanded: boolean) => void;
  slaStatusExpanded: boolean;
  setSlaStatusExpanded: (expanded: boolean) => void;
  ticketFieldsExpanded: boolean;
  setTicketFieldsExpanded: (expanded: boolean) => void;
  requesterInfoExpanded: boolean;
  setRequesterInfoExpanded: (expanded: boolean) => void;
  additionalFieldsExpanded: boolean;
  setAdditionalFieldsExpanded: (expanded: boolean) => void;
  workTrackerExpanded: boolean;
  setWorkTrackerExpanded: (expanded: boolean) => void;
  attachmentsExpanded: boolean;
  setAttachmentsExpanded: (expanded: boolean) => void;
  similarTicketExpanded: boolean;
  setSimilarTicketExpanded: (expanded: boolean) => void;
  suggestedKnowledgeExpanded: boolean;
  setSuggestedKnowledgeExpanded: (expanded: boolean) => void;
  
  // Additional Fields Tab
  additionalFieldsTab: 'form' | 'system';
  setAdditionalFieldsTab: (tab: 'form' | 'system') => void;
  showMoreFields: boolean;
  setShowMoreFields: (show: boolean) => void;
  showMoreSystemFields: boolean;
  setShowMoreSystemFields: (show: boolean) => void;
  
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
  showProjectNameDropdown: boolean;
  setShowProjectNameDropdown: (show: boolean) => void;
  showCostCenterDropdown: boolean;
  setShowCostCenterDropdown: (show: boolean) => void;
  showBuildingDropdown: boolean;
  setShowBuildingDropdown: (show: boolean) => void;
  showRequestChannelDropdown: boolean;
  setShowRequestChannelDropdown: (show: boolean) => void;
  
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
  companyValue: string;
  setCompanyValue: (value: string) => void;
  selectedProjectName: string;
  setSelectedProjectName: (name: string) => void;
  selectedCostCenter: string;
  setSelectedCostCenter: (center: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  selectedRequestChannel: string;
  setSelectedRequestChannel: (channel: string) => void;
  
  // Tags
  tags: string[];
  setTags: (tags: string[]) => void;
  showTagInput: boolean;
  setShowTagInput: (show: boolean) => void;
  tagInputValue: string;
  setTagInputValue: (value: string) => void;
  
  // Work Tracker
  isTimerRunning: boolean;
  elapsedTime: number;
  timerStartTime: Date | null;
  showTimerPopup: boolean;
  setShowTimerPopup: (show: boolean) => void;
  workDescription: string;
  setWorkDescription: (description: string) => void;
  setShowWorkHistory: (show: boolean) => void;
  setShowSLAHistory: (show: boolean) => void;
  
  // Attachments
  attachments: any[];
  showAllAttachments: boolean;
  setShowAllAttachments: (show: boolean) => void;
  hoveredAttachmentId: string | null;
  setHoveredAttachmentId: (id: string | null) => void;
  highlightAttachments: boolean;
  
  // Similar Requests
  similarTicketsTab: 'similar' | 'linked';
  setSimilarTicketsTab: (tab: 'similar' | 'linked') => void;
  hoveredTicketId: string | null;
  setHoveredTicketId: (id: string | null) => void;
  newlyLinkedTickets: any[];
  
  // Callback to expose quick action handler
  onQuickActionReady?: (handler: (actionType: string, customResponse?: string) => void) => void;

  // Helper Functions
  togglePinField: (field: string) => void;
  getFilteredPinnedFields: () => string[];
  getGroupTitle: () => string;
  // Title shown on the Properties group icon tooltip (matches the properties group header).
  propertiesTitle?: string;
  // Show the Notifications (email) group at the end of the right rail.
  showNotifications?: boolean;
  // Show the Integration (Jira) group at the end of the right rail (ticket page).
  showIntegration?: boolean;
  // Open a Similar Ticket as a tab in the same drawer (DrawerStack.openRelation).
  onOpenRelation?: (rel: { id: string; type: string; ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => void;
  // Add a finished Work Tracker session to the Work History list (ticket page).
  onAddWorkLog?: (log: any) => void;
  getCurrentStatusColor: () => string;
  getCurrentPriorityColor: () => string;
  getCurrentAssigneeColor: () => string;
  getCurrentUrgencyColor: () => string;
  getCurrentImpactColor: () => string;
  getCurrentProjectNameColor: () => string;
  getCurrentCostCenterColor: () => string;
  getCurrentRequestChannelColor: () => string;
  filteredAssigneeOptions: any[];
  getFilteredTicketFields: () => string[];
  getFilteredAdditionalFormFields: () => string[];
  getFilteredAdditionalFields: () => string[];
  hasSLAMatch: () => boolean;
  hasTicketFieldsMatch: () => boolean;
  hasRequesterInfoMatch: () => boolean;
  hasAdditionalFieldsMatch: () => boolean;
  hasWorkTrackerMatch: () => boolean;
  hasSimilarTickets: () => boolean;
  hasSuggestedKnowledgeMatch: () => boolean;
  formatTime: (seconds: number) => string;
  formatStartTime: (date: Date) => string;
  handleStartTimer: () => void;
  handlePauseTimer: () => void;
  handleStopTimer: () => void;
  handleDeleteAttachment: (id: string) => void;
  handleLinkTicket: (id: string) => void;
  openManualWorkLog: () => void;
  
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
  projectNameOptions: any[];
  costCenterOptions: any[];
  buildingOptions: any[];
  requestChannelOptions: any[];
  staticLinkedTickets: any[];
  availableSimilarTickets: any[];
  
  // Refs
  propertiesFilterRef: React.RefObject<HTMLDivElement>;
  slaStatusRef: React.RefObject<HTMLDivElement>;
  ticketFieldsRef: React.RefObject<HTMLDivElement>;
  requesterInfoRef: React.RefObject<HTMLDivElement>;
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
  additionalFieldsRef: React.RefObject<HTMLDivElement>;
  projectNameDropdownRef: React.RefObject<HTMLDivElement>;
  costCenterDropdownRef: React.RefObject<HTMLDivElement>;
  buildingDropdownRef: React.RefObject<HTMLDivElement>;
  requestChannelDropdownRef: React.RefObject<HTMLDivElement>;
  
  // Accordion Collapse State
  isAccordionCollapsed: boolean;
  expandAccordion: () => void;
  
  // Accordion Width
  accordionWidth: number;
  setAccordionWidth: (width: number) => void;
  setIsAccordionResizing: (isResizing: boolean) => void;
  
  // AI Chatbot Actions
  onChatbotAddAsNote?: (content: string) => void;
  onChatbotAddAsCollaborate?: (content: string) => void;
  onChatbotReply?: (content: string) => void;
  onChatbotForward?: (content: string) => void;
  
  // Ticket ID
  ticketId?: string;
  
  // Onboarding
  onboardingStep?: number;
  /** Opens the requester profile side popup (name click + "View more details"). */
  onOpenRequesterProfile?: () => void;
  // Requester whose details populate the Requester Information accordion
  requesterName?: string;
  /** VIP is a Request-page concept — Problem/Change/Release do not surface it. */
  showVip?: boolean;
}

const REQUESTER_COLORS = ['#3D8BD0', '#E67E22', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B', '#6366F1', '#14B8A6'];

/** Derive requester details (email, logon, initials, avatar color) from a display name. */
export function deriveRequester(name?: string) {
  const clean = name && name.trim() ? name.trim() : 'Arnav Desai';
  const parts = clean.toLowerCase().split(/\s+/).filter(Boolean);
  const logonName = parts.join('.');
  const email = `${logonName}@motadata.com`;
  const initials = clean.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const color = REQUESTER_COLORS[clean.length % REQUESTER_COLORS.length];
  return { name: clean, email, logonName, initials, color };
}

export function TicketPropertiesPanel(props: TicketPropertiesPanelProps) {
  const {
    fieldsTitle = 'Key Information',
    additionalTitle = 'Additional Fields',
    showProblemFields = false,
    statusGroupLabel,
    showSla = true,
    hideRequesterInfo = false,
    hideSuggestions = false,
    showMembers = false,
    projectMode = false,
    projectInfo = null,
    demoCustomFields = false,
    assetMode = false,
    softwareMode = false,
    cmdbMode = false,
    nonItMode = false,
    licenseMode = false,
    contractMode = false,
    purchaseMode = false,
    patchMode = false,
    patchDeployMode = false,
    packageDeployMode = false,
    registryDeployMode = false,
    endpointMode = false,
    cveMode = false,
    taskMode = false,
    knowledgeMode = false,
    knowledgeInfo,
    patchInfo,
    knowledgeAnalytics,
    onOpenKnowledgeComments,
    knowledgeRequesterView = false,
    knowledgeReviewItems,
    onKnowledgeReviewsChange,
    knowledgeReviewsOpen,
    onKnowledgeReviewsOpenChange,
    compactTicketFields = false,
    hideAdditionalFields = false,
    assetState,
    agentInfo,
    warranty,
    licenseExpiry,
    showChangeCalendar = false,
    changeCalendarEvents,
    changeCalendarTitle = 'Change Calendar',
    requesterName,
    showVip = false,
    activeGroup: activeGroupProp,
    setActiveGroup,
    showPropertiesSearch,
    setShowPropertiesSearch,
    propertiesSearchQuery,
    setPropertiesSearchQuery,
    showPropertiesFilter,
    setShowPropertiesFilter,
    selectedFilter,
    setSelectedFilter,
    pinnedFieldsExpanded,
    setPinnedFieldsExpanded,
    slaStatusExpanded,
    setSlaStatusExpanded,
    ticketFieldsExpanded,
    setTicketFieldsExpanded,
    requesterInfoExpanded,
    setRequesterInfoExpanded,
    additionalFieldsExpanded,
    setAdditionalFieldsExpanded,
    additionalFieldsTab,
    setAdditionalFieldsTab,
    showMoreFields,
    setShowMoreFields,
    showMoreSystemFields,
    setShowMoreSystemFields,
    workTrackerExpanded,
    setWorkTrackerExpanded,
    attachmentsExpanded,
    setAttachmentsExpanded,
    similarTicketExpanded,
    setSimilarTicketExpanded,
    suggestedKnowledgeExpanded,
    setSuggestedKnowledgeExpanded,
    togglePinField,
    getFilteredPinnedFields,
    getGroupTitle,
    propertiesTitle,
    onOpenRequesterProfile,
    showNotifications = false,
    showIntegration = false,
    onOpenRelation,
    onAddWorkLog,
    getCurrentStatusColor,
    getCurrentPriorityColor,
    getCurrentAssigneeColor,
    getCurrentUrgencyColor,
    getCurrentImpactColor,
    getCurrentProjectNameColor,
    getCurrentCostCenterColor,
    getCurrentRequestChannelColor,
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
    showProjectNameDropdown,
    setShowProjectNameDropdown,
    showCostCenterDropdown,
    setShowCostCenterDropdown,
    showBuildingDropdown,
    setShowBuildingDropdown,
    showRequestChannelDropdown,
    setShowRequestChannelDropdown,
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
    companyValue,
    setCompanyValue,
    selectedProjectName,
    setSelectedProjectName,
    selectedCostCenter,
    setSelectedCostCenter,
    selectedBuilding,
    setSelectedBuilding,
    selectedRequestChannel,
    setSelectedRequestChannel,
    tags,
    setTags,
    showTagInput,
    setShowTagInput,
    tagInputValue,
    setTagInputValue,
    isTimerRunning,
    elapsedTime,
    timerStartTime,
    showTimerPopup,
    setShowTimerPopup,
    workDescription,
    setWorkDescription,
    setShowWorkHistory,
    setShowSLAHistory,
    attachments,
    showAllAttachments,
    setShowAllAttachments,
    hoveredAttachmentId,
    setHoveredAttachmentId,
    highlightAttachments,
    similarTicketsTab,
    setSimilarTicketsTab,
    hoveredTicketId,
    setHoveredTicketId,
    newlyLinkedTickets,
    filteredAssigneeOptions,
    getFilteredTicketFields,
    getFilteredAdditionalFormFields,
    getFilteredAdditionalFields,
    hasSLAMatch,
    hasTicketFieldsMatch,
    hasRequesterInfoMatch,
    hasAdditionalFieldsMatch,
    hasWorkTrackerMatch,
    hasSimilarTickets,
    hasSuggestedKnowledgeMatch,
    formatTime,
    formatStartTime,
    handleStartTimer,
    handlePauseTimer,
    handleStopTimer,
    handleDeleteAttachment,
    handleLinkTicket,
    openManualWorkLog,
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
    projectNameOptions,
    costCenterOptions,
    buildingOptions,
    requestChannelOptions,
    staticLinkedTickets,
    availableSimilarTickets,
    propertiesFilterRef,
    slaStatusRef,
    ticketFieldsRef,
    requesterInfoRef,
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
    additionalFieldsRef,
    projectNameDropdownRef,
    costCenterDropdownRef,
    buildingDropdownRef,
    requestChannelDropdownRef,
    pinnedFields,
    isAccordionCollapsed,
    expandAccordion,
    accordionWidth,
    setAccordionWidth,
    setIsAccordionResizing,
    onChatbotAddAsNote,
    onChatbotAddAsCollaborate,
    onChatbotReply,
    onChatbotForward,
    ticketId,
    onboardingStep,
  } = props;

  /* A group whose rail icon is not rendered must never own the panel body. The active
     group is shared across the open-item stack, so it can still be pointing at
     Notifications or Integration from a record that HAD those icons — on a page that
     hides them (an approval opens with neither) it falls back to the properties group. */
  const activeGroup =
    (!showNotifications && activeGroupProp === 'notifications') || (!showIntegration && activeGroupProp === 'integration')
      ? 'properties'
      : activeGroupProp;

  // A closed ticket has finished its lifecycle, so each SLA target reads as an outcome
  // (Met / Breached with the time taken) instead of a running "due in" countdown.
  const slaClosed = /closed|resolved|completed/i.test(selectedStatus || '');
  // Shared with the header's "First Response Overdue" alert pill so card and header never disagree.
  const firstResponseBreached = isFirstResponseBreached(ticketId);

  // Local state for chatbot
  const [chatInput, setChatInput] = useState('');
  /* AI Fields Suggestion (ticket page) — enrich the request from similar resolved
     requests: pick which suggested values to take, Update applies them to the REAL
     panel state so Key Information changes visibly. */
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [suggestApplied, setSuggestApplied] = useState(false);
  const [suggestChecked, setSuggestChecked] = useState<Set<string>>(new Set(['priority', 'assignee', 'urgency', 'impact', 'category', 'techGroup', 'department', 'supportLevel', 'location', 'source']));
  useEffect(() => {
    if (!suggestOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSuggestOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [suggestOpen]);
  useEffect(() => {
    setSuggestOpen(false);
    setSuggestDismissed(false);
    setSuggestApplied(false);
    setSuggestChecked(new Set(['priority', 'assignee', 'urgency', 'impact', 'category', 'techGroup', 'department', 'supportLevel', 'location', 'source']));
  }, [ticketId]);
  // ServiceOps AI header controls. showChatHistory swaps the panel body for the history screen
  // (New chat just clears the thread). Leaving the AI group resets it, so reopening the panel
  // always lands on the chat rather than on history.
  const [showChatHistory, setShowChatHistory] = useState(false);
  // Knowledge "Review" block — peer reviews left on the article.
  const [showReviewsPanelLocal, setShowReviewsPanelLocal] = useState(false);
  const showReviewsPanel = knowledgeReviewsOpen ?? showReviewsPanelLocal;
  const setShowReviewsPanel = onKnowledgeReviewsOpenChange ?? setShowReviewsPanelLocal;
  const [reviewDraft, setReviewDraft] = useState('');
  // Rich review composer — uncontrolled contentEditable (same recipe as the approval comments
  // popup: never re-write its HTML while typing or the caret jumps to the start).
  const reviewContentRef = useRef<HTMLDivElement>(null);
  const [reviewFormattingOpen, setReviewFormattingOpen] = useState(false);
  /* Selecting text in the review editor auto-opens the formatting row; deselecting hides it
     again — but ONLY when it was auto-opened, so a manual T toggle sticks. */
  const reviewAutoOpenedRef = useRef(false);
  const reviewFormattingRef = useRef(reviewFormattingOpen);
  reviewFormattingRef.current = reviewFormattingOpen;
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection();
      const el = reviewContentRef.current;
      const insideSelection = !!(sel && !sel.isCollapsed && el && sel.anchorNode && el.contains(sel.anchorNode));
      if (insideSelection) {
        if (!reviewFormattingRef.current) {
          reviewAutoOpenedRef.current = true;
          setReviewFormattingOpen(true);
        }
      } else if (reviewAutoOpenedRef.current && reviewFormattingRef.current) {
        reviewAutoOpenedRef.current = false;
        setReviewFormattingOpen(false);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);
  /* Reviews can be LIFTED to the host drawer (the Knowledge page does this, so its article body
     can show the same thread and open the same panel). Uncontrolled everywhere else. */
  const [addedReviewsLocal, setAddedReviewsLocal] = useState<KnowledgeReview[]>([]);
  const addedReviews = knowledgeReviewItems ?? addedReviewsLocal;
  const setAddedReviews = onKnowledgeReviewsChange ?? setAddedReviewsLocal;
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  // Chats the user deleted from the history screen (ids removed from the seeded list).
  const [removedChatIds, setRemovedChatIds] = useState<Set<string>>(new Set());
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  // Attachment that is open in the centered preview popup
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  // Email notifications sent for this record (Notifications group)
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [showSendEmail, setShowSendEmail] = useState(false);

  // Work Tracker — multiple tasks, but only one can run at a time.
  const [trackerTasks, setTrackerTasks] = useState<{ id: string; description: string; elapsed: number; isRunning: boolean; startMs: number; technician: { name: string; initials: string; color: string } }[]>([]);
  const [showTrackerPopup, setShowTrackerPopup] = useState(false);
  // SLA due-date editing (calendar popup opened from each row's pencil)
  const [editingSlaRow, setEditingSlaRow] = useState<null | 'first' | 'resolution' | 'ola'>(null);
  const [slaAnchorRect, setSlaAnchorRect] = useState<DOMRect | null>(null);
  const [slaDates, setSlaDates] = useState<Record<string, Date>>(() => ({
    first: new Date(Date.now() + 3 * 86400000 + 5 * 3600000),
    resolution: new Date(Date.now() + 11 * 86400000),
    ola: new Date(Date.now() + 4 * 3600000),
  }));
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);
  // Work Tracker technician — the timer can be started on behalf of another person; defaults to the current user.
  const TRACKER_TECHNICIANS = [
    { name: 'Rakesh Rathod', initials: 'RR', color: '#3D8BD0' },
    { name: 'Sarah Johnson', initials: 'SJ', color: '#8B5CF6' },
    { name: 'Michael Chen', initials: 'MC', color: '#22A06B' },
    { name: 'Priya Sharma', initials: 'PS', color: '#F59E0B' },
  ];
  const [trackerTechnician, setTrackerTechnician] = useState(TRACKER_TECHNICIANS[0]);
  const [trackerTechOpen, setTrackerTechOpen] = useState(false);
  const anyTrackerRunning = trackerTasks.some((t) => t.isRunning);
  useEffect(() => {
    if (!anyTrackerRunning) return;
    const iv = setInterval(() => {
      setTrackerTasks((prev) => prev.map((t) => (t.isRunning ? { ...t, elapsed: t.elapsed + 1 } : t)));
    }, 1000);
    return () => clearInterval(iv);
  }, [anyTrackerRunning]);
  // Starting a new task pauses every other task.
  const startNewTrackerTask = () => {
    const now = Date.now();
    setTrackerTasks((prev) => [
      ...prev.map((t) => ({ ...t, isRunning: false })),
      { id: `tt-${now}`, description: newTaskDesc.trim(), elapsed: 0, isRunning: true, startMs: now, technician: trackerTechnician },
    ]);
    setNewTaskDesc('');
    setShowTrackerPopup(false);
  };
  // Playing a task makes it the only running one (auto-pauses the rest).
  const playTrackerTask = (id: string) => setTrackerTasks((prev) => prev.map((t) => ({ ...t, isRunning: t.id === id })));
  const pauseTrackerTask = (id: string) => setTrackerTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isRunning: false } : t)));
  const stopTrackerTask = (id: string) => {
    const task = trackerTasks.find((t) => t.id === id);
    if (task && task.elapsed > 0 && onAddWorkLog) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const s = task.elapsed;
      const m = Math.round(s / 60), h = Math.round(s / 3600), days = Math.round(s / 86400);
      const dur = s < 60 ? `${s} second${s !== 1 ? 's' : ''}` : s < 3600 ? `${m} minute${m !== 1 ? 's' : ''}` : s < 86400 ? `${h} hour${h !== 1 ? 's' : ''}` : `${days} day${days !== 1 ? 's' : ''}`;
      onAddWorkLog({
        id: `wl-${Date.now()}`,
        technician: task.technician ?? { name: 'Arnav Desai', initials: 'AD', color: '#3D8BD0' },
        start: toLocal(new Date(task.startMs)),
        end: toLocal(new Date(task.startMs + s * 1000)),
        description: task.description || 'Work Tracker session',
        timeTaken: dur,
      });
    }
    setTrackerTasks((prev) => prev.filter((t) => t.id !== id));
  };
  const [chatMessages, setChatMessages] = useState<Array<{ id: number; text: string; isUser: boolean; timestamp: string; isTyping?: boolean; fullText?: string; displayedText?: string; followUpActions?: string[] }>>([]);
  const [previousGroup, setPreviousGroup] = useState<'properties' | 'activity' | 'suggestions'>('suggestions');
  // Asset-only Notes group
  const [assetNotes, setAssetNotes] = useState<{ id: number; name: string; author: string; initials: string; color: string; time: string; text: string }[]>([
    { id: 1, name: 'Reassignment', author: 'A. Kumar', initials: 'AK', color: '#10B981', time: '12 Jun 2026, 10:24 AM', text: 'Reassigned to the End User Computing pool after the Sales handover.' },
    { id: 2, name: 'RAM Upgrade', author: 'Riya Shah', initials: 'RS', color: '#6366F1', time: '02 Feb 2026, 04:10 PM', text: 'RAM upgraded from 16 GB to 40 GB. Verified boot and ran hardware diagnostics — all passed.' },
  ]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteName, setNoteName] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const openAddNote = () => {
    setEditingNoteId(null);
    setNoteName('');
    setNoteDesc('');
    setShowAddNote(true);
  };
  const openEditNote = (n: { id: number; name: string; text: string }) => {
    setEditingNoteId(n.id);
    setNoteName(n.name);
    setNoteDesc(n.text);
    setShowAddNote(true);
  };
  const saveAssetNote = () => {
    const name = noteName.trim();
    const text = noteDesc.trim();
    if (!name || !text) return;
    if (editingNoteId != null) {
      setAssetNotes((prev) => prev.map((n) => (n.id === editingNoteId ? { ...n, name, text } : n)));
    } else {
      setAssetNotes((prev) => [{ id: Date.now(), name, author: 'You', initials: 'YO', color: '#3D8BD0', time: 'Just now', text }, ...prev]);
    }
    setNoteName('');
    setNoteDesc('');
    setEditingNoteId(null);
    setShowAddNote(false);
  };
  const deleteAssetNote = (id: number) => setAssetNotes((prev) => prev.filter((n) => n.id !== id));
  const cancelAddNote = () => {
    setNoteName('');
    setNoteDesc('');
    setEditingNoteId(null);
    setShowAddNote(false);
  };

  // Add User side drawer (asset Users group)
  const [showAddUser, setShowAddUser] = useState(false);
  // Add Member picker (Project page's Members group) + the people it added.
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addedMembers, setAddedMembers] = useState<
    { name: string; initials: string; color: string; dept: string; accountType: string; domain: string; sid: string; disabled: boolean; description: string }[]
  >([]);
  /* Project-member details (Members group): role is editable, tasks/milestones are
     deterministic per member — people added from the picker start fresh at Default 0/0,
     matching how a new member joins in the product. */
  const MEMBER_ROLES = ['Default', 'Project Manager', 'Contributor', 'Reviewer', 'Viewer'];
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const memberMeta = (name: string) => {
    if (addedMembers.some((m) => m.name === name)) return { role: 'Default', tasksDone: 0, tasksTotal: 0, msDone: 0, msTotal: 0 };
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const tasksTotal = 3 + (h % 7);
    const tasksDone = Math.min(tasksTotal, h % 5);
    const msTotal = 1 + (h % 3);
    const msDone = Math.min(msTotal, (h >> 2) % 3);
    return { role: ['Project Manager', 'Contributor', 'Contributor', 'Reviewer', 'Viewer'][h % 5], tasksDone, tasksTotal, msDone, msTotal };
  };
  const memberRoleOf = (name: string) => memberRoles[name] ?? memberMeta(name).role;
  const memberRoleTint = (r: string) =>
    r === 'Project Manager'
      ? 'bg-[#EBF5FF] text-[#3D8BD0]'
      : r === 'Contributor'
        ? 'bg-[#E7F6EE] text-[#22A06B]'
        : r === 'Reviewer'
          ? 'bg-[#FEF6E6] text-[#B54708]'
          : 'bg-[#F1F5F9] text-[#64748B]';
  const [newUser, setNewUser] = useState({ name: '', accountType: '', domain: '', disabled: '', sid: '', description: '' });
  // Accordion: which asset users are expanded (showing account type / domain / SID / description)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedIntegrations, setExpandedIntegrations] = useState<Set<string>>(new Set());
  // Task page: Key Information values the expand popup has edited, keyed by field label.
  const [taskKeyValues, setTaskKeyValues] = useState<Record<string, string>>({});
  const [similarFilter, setSimilarFilter] = useState<'All' | 'Request' | 'Problem' | 'Change'>('All');
  // Patch File Details — the patch's files (can be empty → upload manually). Patch page only.
  const [patchFiles, setPatchFiles] = useState<{ name: string; size: string; language: string }[]>(PATCH_FILES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlePatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
    setPatchFiles((prev) => [...prev, { name: file.name, size, language: 'all' }]);
    e.target.value = '';
  };

  // Jira integration — a record can be linked to at most ONE Jira issue (starts empty).
  type JiraIntegration = { id: string; project: string; issueType: string; priority: string; subject: string; application: string };
  // Scan Info card (Endpoint page) — own accordion below Endpoint Fields
  const [scanInfoExpanded, setScanInfoExpanded] = useState(true);
  const [integration, setIntegration] = useState<JiraIntegration | null>(null);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [intgSubject, setIntgSubject] = useState('Cannot Create KB Article');
  const [intgProject, setIntgProject] = useState('JIRA-TESTING');
  const [intgIssueType, setIntgIssueType] = useState('Bug');
  const [intgPriority, setIntgPriority] = useState('Medium');
  const saveIntegration = () => {
    const prefix = intgProject.split(/[-\s]+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3) || 'JT';
    const id = `${prefix}-104`;
    setIntegration({ id, project: intgProject, issueType: intgIssueType, priority: intgPriority, subject: intgSubject, application: 'jira' });
    setExpandedIntegrations(new Set([id]));
    setShowAddIntegration(false);
  };
  const openAddUser = () => {
    setNewUser({ name: '', accountType: '', domain: '', disabled: '', sid: '', description: '' });
    setShowAddUser(true);
  };
  const cancelAddUser = () => setShowAddUser(false);
  const saveAddUser = () => setShowAddUser(false);
  const [showAISummaryMenu, setShowAISummaryMenu] = useState(false);
  const [hasNewConversations, setHasNewConversations] = useState(true); // Track if new conversations have been added
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false); // Track regeneration animation
  const [showReopenTooltip, setShowReopenTooltip] = useState(false); // Track reopen AI panel tooltip
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isChatbotClosing, setIsChatbotClosing] = useState(false); // Track closing animation
  const [isChatbotOpening, setIsChatbotOpening] = useState(false); // Track opening animation
  const [showCustomizeModal, setShowCustomizeModal] = useState(false); // Track customize layout modal
  /* Measured height of the sticky group header, published to the accordions as a CSS variable so
     each one pins flush beneath it — no overlap that clips their top border, no gap that lets
     scrolling rows show through. Re-measured on resize and whenever the header's content changes
     (switching groups, showing/hiding the search row). */
  const groupHeaderRef = useRef<HTMLDivElement>(null);
  const [groupHeaderH, setGroupHeaderH] = useState(86);
  useEffect(() => {
    const el = groupHeaderRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setGroupHeaderH(Math.round(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeGroup, knowledgeMode]);
  // Each module gets its own stored order so layouts don't leak across modules.
  // Only the Change detail page includes the Change Calendar section.
  const sectionStorageKey = patchMode
    ? (taskMode ? 'taskPropertiesSectionOrder' : endpointMode ? 'endpointPropertiesSectionOrder' : 'patchPropertiesSectionOrder')
    : hideAdditionalFields
      ? 'ticketV2PropertiesSectionOrder' // V2 ticket page — separate key so V1's saved layout is never clobbered
      : assetMode
        ? 'assetPropertiesSectionOrderV3'
        // Keys bumped when the info card moved above Requester Information — a previously saved
        // order would otherwise pin the old arrangement for anyone who has opened the page before.
        : showChangeCalendar
          ? 'changePropertiesSectionOrderV4'
          : 'ticketPropertiesSectionOrderV3';
  const defaultSectionOrderRaw = patchMode
    ? (taskMode ? ['Ticket Fields', 'Additional Fields'] : endpointMode ? ['Ticket Fields', 'Scan Info'] : knowledgeMode ? ['Analytics', 'Ticket Fields'] : ['Ticket Fields']) // Patch page: single accordion; Endpoint page adds Scan Info
    : hideAdditionalFields
      ? ['Ticket Fields', 'Requester Information'] // V2 ticket page — Additional Fields live in the Incident Details tab
      /* The module info card sits directly under Key Info — both describe the record, so they
         belong together, with the requester's own details after them. */
      : showChangeCalendar
        ? ['Ticket Fields', 'Change Calendar', 'Additional Fields', 'Requester Information']
        : assetMode
          ? ['Ticket Fields', 'Additional Fields']
          : ['Ticket Fields', 'Additional Fields', 'Requester Information'];
  const defaultSectionOrder = hideRequesterInfo
    ? defaultSectionOrderRaw.filter((s) => s !== 'Requester Information')
    : defaultSectionOrderRaw;
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(sectionStorageKey);
      if (saved) {
        try {
          const parsed: string[] = JSON.parse(saved);
          if (showChangeCalendar && !parsed.includes('Change Calendar')) {
            const fi = parsed.indexOf('Ticket Fields');
            parsed.splice(fi >= 0 ? fi + 1 : 0, 0, 'Change Calendar');
          }
          // Change Calendar only ever belongs to the Change detail page.
          let cleaned = showChangeCalendar ? parsed : parsed.filter((s) => s !== 'Change Calendar');
          // V2 ticket page has no Additional Fields section (moved to the Incident Details tab).
          if (hideAdditionalFields) cleaned = cleaned.filter((s) => s !== 'Additional Fields');
          // Scan Info is an Endpoint-page-only section.
          if (patchMode && endpointMode && !cleaned.includes('Scan Info')) { const si = cleaned.indexOf('Ticket Fields'); cleaned.splice(si >= 0 ? si + 1 : cleaned.length, 0, 'Scan Info'); }
          if (!endpointMode) cleaned = cleaned.filter((s) => s !== 'Scan Info');
          if (patchMode && knowledgeMode) { cleaned = ['Analytics', ...cleaned.filter((x) => x !== 'Analytics')]; }
          if (!knowledgeMode) cleaned = cleaned.filter((s) => s !== 'Analytics');
          // Agent Information is pinned at the top on the asset page — not a reorderable section.
          return assetMode || hideRequesterInfo ? cleaned.filter((s) => s !== 'Requester Information') : cleaned;
        } catch (e) {
          return defaultSectionOrder;
        }
      }
    }
    return defaultSectionOrder;
  }); // Track section order
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null); // Track dragged item

  // Onboarding-specific state
  const [onboardingSummaryLoaded, setOnboardingSummaryLoaded] = useState(false);
  const [showOnboardingSummaryContent, setShowOnboardingSummaryContent] = useState(false);
  const [showOnboardingQuickActions, setShowOnboardingQuickActions] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const aiIconRef = useRef<HTMLButtonElement>(null);
  const reopenTooltipRef = useRef<HTMLDivElement>(null);

  // AI Summary content to be passed to editors
  const aiSummaryContent = `<p>User is experiencing critical login issues with the main portal. The account appears to be locked after multiple failed attempts. Priority escalation recommended due to business impact.</p>

<p><strong>Key Points:</strong></p>
<ul>
<li>Account locked after multiple failed login attempts</li>
<li>Critical business impact requiring priority escalation</li>
<li>Reset authentication credentials and verify account status</li>
</ul>`;

  const suggestedActions = [
    { label: 'Unlock Account', icon: User, color: 'text-[#3D8BD0]' },
    { label: 'Reset Password', icon: Activity, color: 'text-[#10B981]' },
    { label: 'Escalate Priority', icon: ChevronUp, color: 'text-[#EF4444]' },
    { label: 'Resolve Request', icon: Check, color: 'text-[#F59E0B]' },
  ];

  const handleSuggestedAction = (actionLabel: string) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: actionLabel,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);

    // Define responses for each action
    const actionResponses: { [key: string]: string } = {
      'Unlock Account': "I'll help you unlock this account right away. I've initiated the account unlock process and the user's account is now active. The account was locked due to multiple failed login attempts, which triggered our automated security protocols.\n\nThe unlock has been completed successfully, and I've sent a notification to the user at their registered email address. I recommend asking them to verify their identity and reset their password as an additional security measure.\n\nWould you like me to also send them a secure password reset link?",
      
      'Reset Password': "I've initiated the password reset process for this user account. A secure password reset link has been generated and will be sent to the user's registered email address.\n\nThe reset link will expire in 24 hours for security purposes. I've also included instructions in the email to help guide the user through the password reset process.\n\nAdditionally, I recommend enabling two-factor authentication for this account to enhance security and prevent future unauthorized access attempts. Would you like me to enable 2FA for this account?",
      
      'Escalate Priority': "I've successfully escalated this request to High Priority status. The request has been reassigned to the senior technical support team for immediate attention.\n\nBased on the critical nature of the login issue and its business impact, I've updated the SLA timeline to reflect a 2-hour resolution target. All relevant stakeholders have been notified via email and will receive automated updates as the request progresses.\n\nThe escalation includes a detailed summary of the issue, failed login attempt logs, and recommended resolution steps. The senior support team will be reviewing this shortly. Would you like me to schedule a follow-up notification?",
      
      'Resolve Request': "Before we proceed with resolving this request, let me verify that all necessary actions have been completed:\n\n✓ Account unlock status: Ready to process\n✓ User notification: Pending\n✓ Security verification: Required\n✓ Follow-up actions: To be documented\n\nTo properly resolve this request, please confirm that:\n1. The user's account has been successfully unlocked\n2. The user has been contacted and verified their identity\n3. A password reset has been completed\n4. The user can now successfully access the portal\n\nOnce you confirm these steps are complete, I can update the request status to 'Resolved' and send the resolution notification to the requester. Would you like to proceed with resolving this request?",
    };

    // Add AI response after a short delay
    setTimeout(() => {
      const responseText = actionResponses[actionLabel] || "I've processed your request. How else can I assist you with this request?";
      
      const aiMessage = {
        id: Date.now() + 1,
        text: '',
        fullText: responseText,
        displayedText: '',
        isUser: false,
        isTyping: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: chatInput,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Add AI response after a short delay
    setTimeout(() => {
      const aiResponses = [
        "I've analyzed your request and reviewed the request details thoroughly. Based on the information provided, the user is experiencing critical login issues with the main portal, and the account appears to be locked after multiple failed authentication attempts.\n\nAfter checking the system logs, I found that there were 5 consecutive failed login attempts from different IP addresses within a 10-minute window, which triggered our security protocols and automatically locked the account. This is a standard security measure to protect against potential unauthorized access.\n\nI recommend the following actions: First, unlock the user's account through the admin console. Second, reset their authentication credentials and send them a secure password reset link. Third, verify their identity through the registered email or phone number before granting access. Would you like me to proceed with these steps?",
        
        "Thank you for reaching out. I understand you need assistance with this request, and I'm here to help resolve it as quickly as possible. Let me walk you through what I've discovered about this situation.\n\nThe account lockout occurred due to our automated security system detecting unusual login patterns. Specifically, the authentication system flagged multiple failed attempts using incorrect passwords, combined with login requests from IP addresses that don't match the user's typical access locations. This triggered a temporary security hold on the account.\n\nTo resolve this issue efficiently, I can help you unlock the account and reset the authentication credentials right away. I'll also add a note to the user's profile about this incident for future reference. Additionally, I recommend enabling two-factor authentication for enhanced security. Shall I proceed with the account unlock process?",
        
        "I've conducted a comprehensive review of similar requests in our system and found several patterns that might help resolve this issue faster. Over the past month, we've handled 23 similar cases involving account lockouts due to failed authentication attempts.\n\nBased on the analysis of these previous requests, the average resolution time was 45 minutes, and most cases required admin intervention to unlock the account and verify the user's identity. The technical support team has established a streamlined process for handling these situations, which includes security verification, credential reset, and user education about password best practices.\n\nGiven the critical nature of this request and its impact on business operations, I recommend escalating this to the technical support team immediately. I can create an escalation request with all the necessary details, assign it to the appropriate team members, and set up automated notifications to keep all stakeholders informed. Would you like me to initiate the escalation?",
        
        "I've examined the request priority level and SLA requirements associated with this case. This request is currently marked as 'High Priority' with a resolution SLA of 4 hours, and we're currently 2 hours into the timeline.\n\nBased on the urgency and business impact, I strongly suggest taking immediate action to prevent SLA breach. The account lockout is preventing the user from accessing critical business systems, which could result in productivity loss and potential revenue impact. Our SLA monitoring shows that similar high-priority requests are typically resolved within 90 minutes when addressed promptly.\n\nI can help automate several steps in the account unlock process: I'll generate the unlock request, prepare the password reset email with security verification, and create a follow-up task to ensure the user successfully regains access. I'll also set up automated status updates to keep the requester informed throughout the resolution process. Should I proceed with these automated actions?",
        
        "I've gathered all the relevant information from the request and conducted a thorough investigation. The user's account history shows some concerning patterns that require immediate attention and careful handling.\n\nThe account has experienced multiple failed login attempts - specifically 7 attempts over the past 3 hours - originating from different IP addresses across various geographic locations. Three attempts came from the user's known office location, but four attempts originated from unfamiliar IP addresses in different cities. This unusual pattern might indicate either a security concern such as unauthorized access attempts, or the user might be traveling and attempting to access their account from new locations.\n\nGiven these findings, I recommend a multi-step approach: First, immediately contact the user through their verified contact information to confirm whether they initiated all login attempts. Second, if confirmed legitimate, unlock the account and assist with secure credential reset. Third, if the user doesn't recognize all the login attempts, escalate this to the security team for a comprehensive security audit. I'll also recommend enabling additional security measures like two-factor authentication and login location alerts. How would you like to proceed?",
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage = {
        id: Date.now() + 1,
        text: '',
        fullText: randomResponse,
        displayedText: '',
        isUser: false,
        isTyping: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (actionType: string, customResponse?: string) => {
    // Open chatbot if not already open
    if (activeGroup !== 'chatbot') {
      setPreviousGroup(activeGroup as 'properties' | 'activity' | 'suggestions');
      setActiveGroup('chatbot');
    }

    // Add user message
    const actionMessages: { [key: string]: string } = {
      'Show AI Summary': 'Show AI Summary for this request',
      'Suggest a solution for this issue': 'Suggest a solution for this issue',
      'What are the next steps to resolve this?': 'What are the next steps to resolve this?',
      'Find similar resolved requests': 'Find similar resolved requests',
      'Find Similar Requests': 'Find similar requests for this issue',
      'Suggest KB': 'Suggest knowledge base articles',
      'Next Action': 'What should be the next best action?',
      'Root Cause': 'Analyze the root cause of this issue',
      'Draft Reply': 'Draft a reply for the requester'
    };

    const userMessage = {
      id: Date.now(),
      text: actionMessages[actionType] || actionType,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);

    // Define AI responses for each action
    const aiResponses: { [key: string]: { text: string, followUpActions: string[] } } = {
      'Show AI Summary': {
        text: ticketId === 'INC-35' ?
          'Employee requesting Apple MacBook Pro 16-inch allocation due to performance limitations of current laptop. Required for software development tasks involving resource-intensive tools, virtual machines, and cross-platform projects.\n\n**Key Points:**\n• Senior Software Developer role requires high-performance device\n• Current laptop unable to handle Docker containers and multiple IDEs\n• MacBook Pro 16-inch needed with standard development licenses' :
          ticketId === 'INC-32' ?
          'User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.\n\n**Key Points:**\n• No internet access despite Wi-Fi showing as connected\n• Impacting ability to access emails and cloud applications\n• Requires network diagnostics and connectivity troubleshooting' :
          'User is experiencing critical login issues with the main portal. The account appears to be locked after multiple failed attempts. Priority escalation recommended due to business impact.\n\n**Key Points:**\n• Account locked after multiple failed login attempts\n• Critical business impact requiring priority escalation\n• Reset authentication credentials and verify account status',
        followUpActions: ['Find Similar Requests', 'Suggest KB', 'Next Action']
      },
      'Suggest a solution for this issue': {
        text: ticketId === 'INC-35' ?
          "Based on my analysis of this hardware request, here's a recommended solution:\n\n**Recommended Solution:**\n1. **Verify business justification** - Confirm role requirements and current device limitations\n2. **Check budget allocation** - Ensure department has approved budget for hardware upgrade\n3. **Review company policy** - Validate request against IT hardware procurement standards\n4. **Initiate approval workflow** - Route to manager and IT director for sign-off\n5. **Coordinate procurement** - Place order with approved vendor once approved\n\n**Implementation Steps:**\n• Validate user's development role and requirements (10 minutes)\n• Confirm budget availability with finance team (1-2 days)\n• Submit formal hardware request form (15 minutes)\n• Obtain manager and IT director approvals (2-3 days)\n• Process order through procurement (5-7 business days)\n• Schedule device setup and data migration (2-3 hours)\n\n**Expected Resolution Time:** 10-15 business days\n**Estimated Cost:** $2,500 - $3,500 for MacBook Pro 16\" with standard configuration\n\nThis approach ensures compliance with company policies while meeting legitimate business needs. Shall I help you initiate the approval workflow?" :
          ticketId === 'INC-32' ?
          "Based on my analysis of this connectivity issue, here's a recommended solution:\n\n**Recommended Solution:**\n1. **Run network diagnostics** - Check IP configuration and DNS settings\n2. **Reset network adapter** - Flush DNS cache and renew IP address\n3. **Verify proxy settings** - Ensure corporate proxy is correctly configured\n4. **Test with different network** - Try mobile hotspot to isolate issue\n5. **Check firewall rules** - Verify no software is blocking connections\n\n**Implementation Steps:**\n• Run ipconfig /all to check current network configuration (2 minutes)\n• Execute ipconfig /flushdns and ipconfig /renew commands (3 minutes)\n• Verify DNS servers are set to corporate DNS (192.168.1.1) (2 minutes)\n• Disable/re-enable network adapter or reboot system (5 minutes)\n• Test connectivity with ping and tracert commands (5 minutes)\n• If unresolved, check Windows firewall and antivirus settings (10 minutes)\n\n**Expected Resolution Time:** 20-30 minutes\n**Success Rate:** 87% for DNS/adapter-related issues\n\nThis solution addresses the most common causes of \"connected but no internet\" issues. Would you like me to provide detailed command instructions?" :
          "Based on my analysis of this request, here's a recommended solution:\n\n**Recommended Solution:**\n1. **Unlock the user account** immediately to restore access\n2. **Verify user identity** through registered email or phone\n3. **Reset password** and send secure reset link\n4. **Enable two-factor authentication** for enhanced security\n5. **Review security logs** to rule out unauthorized access attempts\n\n**Implementation Steps:**\n• Use admin panel to unlock account (2 minutes)\n• Contact user via verified communication channel (5 minutes)\n• Send password reset link that expires in 24 hours (3 minutes)\n• Guide user through 2FA setup (5 minutes)\n• Document all actions in request notes\n\n**Expected Resolution Time:** 15-20 minutes\n\nThis solution has a 95% success rate based on similar resolved requests. Would you like me to help you implement these steps?",
        followUpActions: ticketId === 'INC-35' ? ['Check Budget', 'Start Approval', 'View Policy'] : ticketId === 'INC-32' ? ['Run Diagnostics', 'Reset Network', 'Check Firewall'] : ['Unlock Account', 'Send Reset Link', 'View Similar Requests']
      },
      'What are the next steps to resolve this?': {
        text: ticketId === 'INC-35' ?
          "Here are the recommended next steps to process this hardware request:\n\n**Step 1: Initial Validation (Day 1)**\n• Review requester's role and current equipment assignment\n• Verify business justification aligns with IT hardware standards\n• Confirm request includes all required information\n• Estimated time: 30 minutes\n\n**Step 2: Budget Verification (Days 1-2)**\n• Submit budget inquiry to Finance department\n• Confirm engineering department has allocated funds\n• Get cost estimate from approved vendor ($2,500-$3,500)\n• Estimated time: 1-2 business days\n\n**Step 3: Manager Approval (Days 2-4)**\n• Route request to Michael's direct manager\n• Include business justification and performance impact\n• Obtain formal sign-off on business need\n• Estimated time: 2-3 business days\n\n**Step 4: IT Director Authorization (Days 4-5)**\n• Submit approved request to IT Director\n• Include budget confirmation and manager approval\n• Get final procurement authorization\n• Estimated time: 1-2 business days\n\n**Step 5: Procurement & Delivery (Days 5-15)**\n• Place order with Dell/Apple authorized reseller\n• Standard configuration: MacBook Pro 16\" M3 Pro, 32GB RAM, 1TB SSD\n• Track shipment and coordinate delivery\n• Estimated time: 7-10 business days\n\n**Step 6: Setup & Migration (Day 15)**\n• Schedule device setup appointment with user\n• Migrate data and applications from old device\n• Configure development environment and tools\n• Verify all software licenses are installed\n• Estimated time: 2-3 hours\n\n**Total Timeline:** 10-15 business days from approval to delivery\n\nShall I start the approval workflow now?" :
          ticketId === 'INC-32' ?
          "Here are the recommended next steps to resolve this connectivity issue:\n\n**Step 1: Quick Diagnostics (0-5 minutes)**\n• Ask user to open Command Prompt (Windows + R, type cmd)\n• Run: ipconfig /all (check IP and DNS configuration)\n• Run: ping 8.8.8.8 (test internet connectivity without DNS)\n• Run: nslookup google.com (test DNS resolution)\n• Document results to identify if issue is DNS or network-related\n\n**Step 2: DNS Cache Flush (5-8 minutes)**\n• Instruct user to run these commands in sequence:\n  - ipconfig /flushdns\n  - ipconfig /release\n  - ipconfig /renew\n• Wait for IP renewal to complete\n• Test internet access by opening browser\n• Success rate: 60% resolved at this step\n\n**Step 3: DNS Server Configuration (8-12 minutes)**\n• If Step 2 fails, update DNS settings manually:\n  - Open Network Connections (ncpa.cpl)\n  - Right-click Wi-Fi adapter → Properties\n  - Select IPv4 → Properties\n  - Set DNS servers: Primary 192.168.1.1, Alternate 8.8.8.8\n  - Click OK and test connection\n• Success rate: Additional 25% resolved\n\n**Step 4: Network Adapter Reset (12-20 minutes)**\n• If Step 3 fails, perform network reset:\n  - Settings → Network & Internet → Network reset\n  - Click Reset now\n  - Restart computer\n  - Reconnect to Wi-Fi network\n• Success rate: Additional 10% resolved\n\n**Step 5: Driver Update & Advanced Troubleshooting (20-35 minutes)**\n• Check for network adapter driver updates\n• Verify Windows firewall isn't blocking connections\n• Check proxy settings and VPN configuration\n• Test with mobile hotspot to isolate issue\n\n**Step 6: Escalation (If unresolved after 35 minutes)**\n• Escalate to Network Infrastructure team\n• Possible hardware issue or network-side problem\n• May require physical inspection or network card replacement\n\n**Expected Outcome:** 85-90% of cases resolved within 15-20 minutes using steps 1-4\n\nShall I provide Emily with detailed command instructions to start troubleshooting?" :
          "Here are the recommended next steps to resolve this request efficiently:\n\n**Step 1: Immediate Action (0-5 minutes)**\n• Unlock the user account using admin privileges\n• Verify this is the legitimate account owner\n• Check for any security alerts or suspicious activity\n\n**Step 2: Password Reset (5-10 minutes)**\n• Generate and send secure password reset link\n• Ensure link is sent to registered email only\n• Set expiration time to 24 hours for security\n\n**Step 3: User Communication (10-15 minutes)**\n• Contact user via phone or verified email\n• Explain the lockout reason and resolution steps\n• Guide them through password reset process\n\n**Step 4: Security Enhancement (15-20 minutes)**\n• Recommend enabling two-factor authentication\n• Provide password security best practices\n• Set up login alerts for unusual activity\n\n**Step 5: Documentation & Closure (20-25 minutes)**\n• Document all resolution steps in request\n• Confirm user can successfully access their account\n• Close request with resolution summary\n\nShall I help you execute these steps?",
        followUpActions: ticketId === 'INC-35' ? ['Start Workflow', 'Contact Finance', 'View Policy'] : ticketId === 'INC-32' ? ['Send Instructions', 'Provide Commands', 'Start Remote Session'] : ['Start Resolution', 'View KB Articles', 'Draft Reply']
      },
      'Find similar resolved requests': {
        text: ticketId === 'INC-35' ?
          "I've found several similar hardware request tickets that can guide this resolution:\n\n**Highly Similar (90%+ match):**\n\n1. **INC-2891** - MacBook Pro 16\" request for Senior Developer\n   • Resolution: Approved with manager sign-off, procurement completed\n   • Resolution time: 12 business days\n   • User satisfaction: 5/5\n\n2. **INC-2654** - High-performance laptop for DevOps engineer\n   • Resolution: Approved MacBook Pro 14\" as cost-effective alternative\n   • Resolution time: 10 business days\n   • User satisfaction: 5/5\n\n**Moderately Similar (75%+ match):**\n\n3. **INC-2103** - Equipment upgrade for software development\n   • Resolution: Approved with additional memory upgrade\n   • Resolution time: 15 business days\n   • User satisfaction: 5/5\n\n4. **INC-1876** - MacBook allocation for cross-platform development\n   • Resolution: Approved with standard configuration\n   • Resolution time: 8 business days\n   • User satisfaction: 5/5\n\n**Common Success Pattern:**\nAll approved requests included:\n1. Clear business justification with specific use cases\n2. Manager approval confirming role requirements\n3. Budget verification from finance department\n4. Standard configuration to streamline procurement\n\n**Average Resolution Time:** 11 business days\n**Approval Rate:** 94% for senior developer roles\n\nWould you like to follow this proven approval workflow?" :
          ticketId === 'INC-32' ?
          "I've found several similar connectivity issue tickets that can help guide the resolution:\n\n**Highly Similar (95%+ match):**\n\n1. **INC-3421** - Wi-Fi connected but no internet access\n   • Resolution: Flushed DNS cache and reset network adapter\n   • Resolution time: 25 minutes\n   • User satisfaction: 5/5\n\n2. **INC-3198** - Cannot access websites despite network connection\n   • Resolution: Corrected DNS server settings to corporate DNS\n   • Resolution time: 15 minutes\n   • User satisfaction: 5/5\n\n**Moderately Similar (85%+ match):**\n\n3. **INC-2987** - Internet connectivity drops randomly\n   • Resolution: Updated network drivers and disabled power saving\n   • Resolution time: 45 minutes\n   • User satisfaction: 4/5\n\n4. **INC-2756** - Corporate resources unreachable via Wi-Fi\n   • Resolution: Reconfigured proxy settings and VPN connection\n   • Resolution time: 30 minutes\n   • User satisfaction: 5/5\n\n**Common Success Pattern:**\nMost tickets were resolved by:\n1. Running network diagnostics (ipconfig, ping, tracert)\n2. Flushing DNS cache and renewing IP address\n3. Verifying DNS server configuration\n4. Resetting network adapter as last resort\n\n**Average Resolution Time:** 29 minutes\n**Success Rate:** 91% with DNS/adapter reset\n\nWould you like to apply this diagnostic approach?" :
          "I've found several similar resolved requests that can help guide the resolution:\n\n**Highly Similar (95%+ match):**\n\n1. **INC-1247** - Account locked after password attempts\n   • Resolution: Unlocked account + password reset\n   • Resolution time: 45 minutes\n   • User satisfaction: 5/5\n\n2. **INC-982** - Multiple failed login attempts lockout\n   • Resolution: Identity verification + account unlock\n   • Resolution time: 30 minutes\n   • User satisfaction: 5/5\n\n**Moderately Similar (80%+ match):**\n\n3. **INC-1556** - Login portal access issues\n   • Resolution: Cleared browser cache + reset session\n   • Resolution time: 1 hour\n   • User satisfaction: 4/5\n\n4. **INC-743** - Two-factor authentication blocking login\n   • Resolution: Reset 2FA settings\n   • Resolution time: 1 hour\n   • User satisfaction: 5/5\n\n**Common Success Pattern:**\nAll similar requests were successfully resolved by:\n1. Unlocking the account\n2. Verifying user identity\n3. Resetting authentication credentials\n4. Implementing 2FA for future security\n\n**Average Resolution Time:** 45 minutes\n**Success Rate:** 100%\n\nWould you like to apply the same resolution approach?",
        followUpActions: ticketId === 'INC-35' ? ['View INC-2891', 'Check Approval Rate', 'Compare Timeline'] : ticketId === 'INC-32' ? ['View INC-3421', 'Apply DNS Fix', 'Run Diagnostics'] : ['Apply Solution', 'View Ticket INC-1247', 'Compare Approaches']
      },
      'Find Similar Requests': {
        text: ticketId === 'INC-35' ?
          "I've searched through our request database and found 5 similar hardware requests:\n\n1. **INC-2891** - MacBook Pro 16\" for Senior Software Developer (Approved)\n   • Resolution: Manager and IT Director approved, procurement completed\n   • Time to resolve: 12 business days\n   • Cost: $3,200\n\n2. **INC-2654** - High-performance laptop for DevOps Engineer (Approved)\n   • Resolution: Approved MacBook Pro 14\" as cost-effective option\n   • Time to resolve: 10 business days\n   • Cost: $2,800\n\n3. **INC-2103** - Equipment upgrade for Software Development (Approved)\n   • Resolution: Approved with 32GB RAM upgrade\n   • Time to resolve: 15 business days\n   • Cost: $3,500\n\n4. **INC-1876** - MacBook for cross-platform development (Approved)\n   • Resolution: Approved standard configuration\n   • Time to resolve: 8 business days\n   • Cost: $2,900\n\n5. **INC-1543** - Developer laptop replacement (Denied)\n   • Resolution: Denied - existing device met minimum requirements\n   • Reason: Insufficient business justification\n\nBased on these similar requests, requests with clear performance gaps and business justification have a 94% approval rate. The average procurement cycle is 11 business days. Would you like me to proceed with the approval workflow?" :
          ticketId === 'INC-32' ?
          "I've searched through our request database and found 5 similar connectivity issues:\n\n1. **INC-3421** - Wi-Fi connected but no internet (Resolved)\n   • Resolution: Flushed DNS cache and reset network adapter\n   • Time to resolve: 25 minutes\n\n2. **INC-3198** - Cannot access websites despite connection (Resolved)\n   • Resolution: Corrected DNS server settings\n   • Time to resolve: 15 minutes\n\n3. **INC-2987** - Intermittent internet connectivity (Resolved)\n   • Resolution: Updated network drivers\n   • Time to resolve: 45 minutes\n\n4. **INC-2756** - Corporate resources unreachable (Resolved)\n   • Resolution: Reconfigured proxy and VPN settings\n   • Time to resolve: 30 minutes\n\n5. **INC-2543** - Network connection drops randomly (Escalated)\n   • Resolution: Hardware issue - network card replacement\n   • Time to resolve: 3 days\n\nBased on these similar requests, 85% are resolved with DNS/network adapter resets within 30 minutes. Only 15% require hardware replacement or network team escalation. Would you like me to proceed with the standard diagnostic approach?" :
          "I've searched through our request database and found 5 similar requests that match this issue:\n\n1. **INC-1247** - User unable to login after password reset (Resolved)\n   • Resolution: Reset authentication tokens\n   • Time to resolve: 45 minutes\n\n2. **INC-982** - Account locked after multiple failed attempts (Resolved)\n   • Resolution: Unlocked account and verified user identity\n   • Time to resolve: 30 minutes\n\n3. **INC-1556** - Login portal timeout issues (In Progress)\n   • Current status: Investigating server performance\n\n4. **INC-743** - Two-factor authentication not working (Resolved)\n   • Resolution: Reset 2FA settings and re-enrolled user\n   • Time to resolve: 1 hour\n\n5. **INC-1891** - Password reset link not received (Resolved)\n   • Resolution: Updated email settings and resent link\n   • Time to resolve: 20 minutes\n\nBased on these similar requests, the most effective resolution approach is to unlock the account and reset authentication credentials. Would you like me to proceed with this solution?",
        followUpActions: ticketId === 'INC-35' ? ['View Approvals', 'Check Budget', 'Compare Costs'] : ticketId === 'INC-32' ? ['Start Diagnostics', 'View Resolution Steps', 'Check Success Rate'] : ['View Request Details', 'Apply Solution', 'Compare Resolutions']
      },
      'Suggest KB': {
        text: ticketId === 'INC-35' ?
          "I've found 3 relevant knowledge base articles for hardware procurement:\n\n**KB-5624: IT Hardware Request Process**\n• Complete workflow for equipment allocation requests\n• Required approvals and budget verification steps\n• Standard configurations for developer equipment\n• Estimated reading time: 7 minutes\n• Success rate: 96%\n\n**KB-5890: MacBook Pro Standard Configurations**\n• Approved MacBook Pro models and specifications\n• Software licensing and pre-installed applications\n• Setup and migration procedures\n• Estimated reading time: 5 minutes\n\n**KB-6103: Development Environment Hardware Standards**\n• Hardware requirements for different developer roles\n• Performance benchmarks and use case scenarios\n• Cost analysis and budget planning guidelines\n• Estimated reading time: 12 minutes\n\nI recommend starting with KB-5624 as it outlines the complete approval process. This article has helped process 96% of hardware requests successfully. Would you like me to open this article?" :
          ticketId === 'INC-32' ?
          "I've found 3 relevant knowledge base articles for connectivity troubleshooting:\n\n**KB-7845: Resolving 'Connected No Internet' Issues**\n• Step-by-step network diagnostics and commands\n• DNS configuration and troubleshooting guide\n• Common causes and quick fixes\n• Estimated reading time: 6 minutes\n• Success rate: 92%\n\n**KB-7623: Corporate Network Configuration Guide**\n• Proper DNS and proxy server settings\n• VPN connectivity requirements\n• Network adapter configuration\n• Estimated reading time: 8 minutes\n\n**KB-8234: Advanced Network Troubleshooting**\n• Using ipconfig, ping, and tracert commands\n• Interpreting network diagnostic results\n• When to escalate to Network team\n• Estimated reading time: 10 minutes\n\nI recommend starting with KB-7845 as it directly addresses the 'connected but no internet' symptom. The article includes command-line instructions with a 92% success rate. Would you like me to open this article?" :
          "I've found 3 relevant knowledge base articles that can help resolve this issue:\n\n**KB-8842: Troubleshooting Account Lockouts**\n• Step-by-step guide for unlocking user accounts\n• Common causes and prevention tips\n• Estimated reading time: 5 minutes\n• Success rate: 94%\n\n**KB-7231: Password Reset Best Practices**\n• How to securely reset user passwords\n• Identity verification procedures\n• Security protocols to follow\n• Estimated reading time: 8 minutes\n\n**KB-9156: Authentication System Overview**\n• Understanding failed login security measures\n• Account lockout policies and thresholds\n• Recovery procedures\n• Estimated reading time: 10 minutes\n\nI recommend starting with KB-8842 as it directly addresses account lockout issues. The article includes a detailed workflow that has a 94% success rate for similar cases. Would you like me to open this article?",
        followUpActions: ticketId === 'INC-35' ? ['Open KB-5624', 'View Standards', 'Send to Requester'] : ticketId === 'INC-32' ? ['Open KB-7845', 'View Commands', 'Send to User'] : ['Open KB-8842', 'Send to User', 'Add to Notes']
      },
      'Next Action': {
        text: ticketId === 'INC-35' ?
          "Based on my analysis of this hardware request and similar cases, here are the recommended next actions in priority order:\n\n**Immediate Actions (High Priority):**\n1. **Validate business justification** - Review role requirements and performance gaps\n   • Estimated time: 15 minutes\n   • Required: Documentation of specific use cases\n\n2. **Verify budget availability** - Confirm department has allocated budget\n   • Estimated time: 1 business day\n   • Contact: Finance team for budget confirmation\n\n3. **Obtain manager approval** - Route request to Michael's manager\n   • Estimated time: 1-2 business days\n   • Required: Manager sign-off on business need\n\n**Follow-up Actions (Medium Priority):**\n4. **Get IT Director approval** - Final sign-off for procurement\n   • Estimated time: 1-2 business days\n   • Required permissions: IT Director authorization\n\n5. **Submit procurement request** - Place order with approved vendor\n   • Estimated time: 5-7 business days\n   • Standard configuration: MacBook Pro 16\" M3 Pro, 32GB, 1TB\n\n**Post-Approval Actions (Low Priority):**\n6. **Schedule device setup** - Coordinate with user for migration\n7. **Prepare data migration plan** - Ensure smooth transition from current device\n8. **Update asset inventory** - Register new device in IT asset management\n\nShall I help you initiate the approval workflow?" :
          ticketId === 'INC-32' ?
          "Based on my analysis of this connectivity issue and similar cases, here are the recommended next actions in priority order:\n\n**Immediate Actions (High Priority):**\n1. **Run network diagnostics** - Execute ipconfig and DNS tests\n   • Estimated time: 5 minutes\n   • Commands: ipconfig /all, ping 8.8.8.8, nslookup google.com\n\n2. **Flush DNS cache** - Clear potentially corrupted DNS entries\n   • Estimated time: 2 minutes\n   • Commands: ipconfig /flushdns, ipconfig /release, ipconfig /renew\n\n3. **Verify DNS settings** - Ensure corporate DNS is configured\n   • Estimated time: 3 minutes\n   • Expected DNS: 192.168.1.1 (Primary), 8.8.8.8 (Secondary)\n\n**Follow-up Actions (Medium Priority):**\n4. **Reset network adapter** - Clear adapter state and reconnect\n   • Estimated time: 5 minutes\n   • Method: Network reset via Windows settings\n\n5. **Update network drivers** - Check for latest adapter drivers\n   • Estimated time: 10 minutes\n   • Source: Device Manager or Dell support site\n\n**Escalation Actions (If Unresolved):**\n6. **Test with different network** - Try mobile hotspot to isolate issue\n7. **Check firewall/antivirus** - Verify no software blocking connections\n8. **Escalate to Network team** - If hardware or infrastructure issue suspected\n\n**Expected Outcome:** 85% of cases resolved within 15-20 minutes using steps 1-4\n\nShall I provide the detailed commands to execute these steps?" :
          "Based on my analysis of this request and similar cases, here are the recommended next actions in priority order:\n\n**Immediate Actions (High Priority):**\n1. **Unlock the user account** - This is the primary blocker preventing access\n   • Estimated time: 2 minutes\n   • Required permissions: Admin access\n\n2. **Verify user identity** - Contact user via registered email or phone\n   • Estimated time: 5 minutes\n   • Security requirement: Mandatory\n\n3. **Reset password** - Send secure password reset link\n   • Estimated time: 3 minutes\n   • Auto-expires in: 24 hours\n\n**Follow-up Actions (Medium Priority):**\n4. **Review security logs** - Check for suspicious login attempts\n   • Estimated time: 10 minutes\n\n5. **Enable 2FA** - Enhance account security\n   • Estimated time: 5 minutes\n   • Recommended: Yes\n\n**Documentation (Low Priority):**\n6. **Update request notes** - Document resolution steps\n7. **Send resolution email** - Inform user of actions taken\n\nShall I help you execute these actions in sequence?",
        followUpActions: ticketId === 'INC-35' ? ['Start Approval', 'Check Budget', 'Contact Manager'] : ticketId === 'INC-32' ? ['Provide Commands', 'Run Diagnostics', 'Reset Network'] : ['Unlock Account', 'Send Reset Link', 'Enable 2FA']
      },
      'Root Cause': {
        text: ticketId === 'INC-35' ?
          "I've analyzed the request details and user profile to identify the root cause:\n\n**Primary Root Cause:**\n🔍 Current hardware insufficient for senior developer role requirements\n\n**Contributing Factors:**\n1. **Performance Limitations** - Existing laptop lacks processing power\n   • Current device: Dell Latitude 5420 (i5, 8GB RAM)\n   • Required workload: Docker, multiple IDEs, VMs, cross-platform builds\n   • Performance gap: 60-70% slower than recommended specs\n\n2. **Role Evolution** - Developer promoted to senior role 6 months ago\n   • Previous role: Junior Developer (basic web development)\n   • Current role: Senior Developer (complex microservices, containerization)\n   • Hardware allocation not updated with role change\n\n3. **Development Requirements** - Projects require macOS environment\n   • Current projects: iOS app development, cross-platform testing\n   • Team standard: MacBook Pro for senior developers\n   • Collaboration efficiency: Needs same platform as team\n\n**Business Impact:**\n• Estimated productivity loss: 8-12 hours per week\n• Build time delays affecting sprint deliverables\n• Unable to fully participate in iOS-related projects\n\n**Preventive Measures:**\n• Implement automatic hardware review upon role changes\n• Define hardware standards for each engineering level\n• Schedule quarterly equipment adequacy assessments\n\n**Recommendation:** Approve request - clear business justification and role-appropriate equipment\n\nWould you like me to prepare the approval documentation?" :
          ticketId === 'INC-32' ?
          "I've analyzed the network diagnostics and user reports to identify the root cause:\n\n**Primary Root Cause:**\n🔍 DNS resolution failure preventing internet access despite active network connection\n\n**Contributing Factors:**\n1. **DNS Server Configuration** - Incorrect or unreachable DNS servers\n   • Current DNS: Automatic (DHCP-assigned)\n   • Expected DNS: Corporate DNS 192.168.1.1\n   • DNS response time: Timeout (>5 seconds)\n\n2. **Network Adapter Issue** - Cached DNS entries or adapter state problem\n   • Last system update: 2 days ago (Windows update)\n   • Network adapter driver: May need update or reset\n   • DNS cache: Potentially corrupted entries\n\n3. **Recent Changes** - Windows update may have reset network settings\n   • Windows update installed: Feb 14, 2026\n   • Issue started: Feb 16, 2026 morning\n   • Network profile: May have switched from Corporate to Public\n\n**Symptoms Correlation:**\n• Wi-Fi shows connected (Layer 2 working)\n• No internet access (Layer 3/DNS failure)\n• Cannot ping external domains (DNS not resolving)\n• Can ping IP addresses directly (network path working)\n\n**Preventive Measures:**\n• Configure static DNS servers to prevent DHCP issues\n• Schedule driver updates before Windows updates\n• Add monitoring for DNS resolution failures\n• Document corporate network settings for quick recovery\n\n**Risk Assessment:** Low - Isolated to user's device, no network-wide issue\n\nWould you like me to provide the specific fix commands?" :
          "I've analyzed the request details and system logs to identify the root cause:\n\n**Primary Root Cause:**\n🔍 Multiple failed login attempts (7 attempts in 3 hours) triggered automated account lockout\n\n**Contributing Factors:**\n1. **Password Complexity** - User may have forgotten recently changed password\n   • Last password change: 3 days ago\n   • Previous successful login: 4 days ago\n\n2. **Multiple Access Locations** - Login attempts from 3 different IP addresses\n   • Office location (known): 3 attempts\n   • Unknown locations: 4 attempts\n   • Possible cause: User traveling or VPN issues\n\n3. **Security Policy** - Strict 5-attempt lockout threshold\n   • Current threshold: 5 failed attempts\n   • Lockout duration: 30 minutes (auto-unlock)\n   • Manual override: Available\n\n**Preventive Measures:**\n• Implement password manager recommendation\n• Set up login location alerts\n• Enable two-factor authentication\n• Educate user on password best practices\n\n**Risk Assessment:** Low - Appears to be legitimate user access issue rather than security breach\n\nWould you like me to implement any of the preventive measures?",
        followUpActions: ticketId === 'INC-35' ? ['Prepare Approval', 'Calculate ROI', 'Document Justification'] : ticketId === 'INC-32' ? ['Provide Fix Commands', 'Update DNS Settings', 'Reset Adapter'] : ['Implement 2FA', 'Send Security Tips', 'Update Policy']
      },
      'Draft Reply': {
        text: ticketId === 'INC-35' ?
          "I've drafted a professional reply for the requester:\n\n---\n\n**Subject:** RE: MacBook Pro Allocation Request - INC-35\n\nHi Michael,\n\nThank you for submitting your hardware allocation request. I've reviewed your requirements and understand the performance challenges you're experiencing with your current device.\n\n**Request Summary:**\nYou've requested an Apple MacBook Pro 16-inch to support your senior development role, specifically for running Docker containers, multiple IDEs, and cross-platform development projects.\n\n**Next Steps:**\nTo process your request, I'll need to:\n\n1. **Manager Approval** - I'll route this request to your manager for business justification approval\n2. **Budget Verification** - Finance team will confirm available budget allocation\n3. **IT Director Sign-off** - Final approval for hardware procurement\n4. **Procurement** - Once approved, we'll order the device with our standard configuration\n\n**Timeline:**\n• Approval process: 3-5 business days\n• Procurement and delivery: 7-10 business days\n• Setup and data migration: 2-3 hours\n\n**Standard Configuration:**\nThe approved configuration for senior developers includes:\n• MacBook Pro 16\" with M3 Pro chip\n• 32GB unified memory\n• 1TB SSD storage\n• Standard development software licenses\n\n**What You Can Do:**\nTo expedite the process, please ensure your manager is aware of this request and its business justification. You may also want to back up any critical data from your current device.\n\nI'll keep you updated as the request moves through the approval workflow. Please let me know if you have any questions.\n\nBest regards,\n[Your Name]\nIT Support Team\n\n---\n\nWould you like me to modify any part of this reply or send it as is?" :
          ticketId === 'INC-32' ?
          "I've drafted a professional reply for the requester:\n\n---\n\n**Subject:** RE: Internet Connectivity Issue - INC-32\n\nHi Emily,\n\nThank you for reporting this connectivity issue. I understand how frustrating it is to be unable to access the internet, especially with important meetings scheduled. Let me help you resolve this quickly.\n\n**Issue Summary:**\nYou're experiencing a \"connected but no internet access\" situation where your Wi-Fi shows connected but you cannot access websites or company resources.\n\n**Quick Resolution Steps:**\nPlease try these steps in order (each takes just 2-3 minutes):\n\n**Step 1: Flush DNS Cache**\n1. Press Windows key + R\n2. Type `cmd` and press Enter\n3. Type these commands (press Enter after each):\n   • `ipconfig /flushdns`\n   • `ipconfig /release`\n   • `ipconfig /renew`\n4. Close the command window and test your connection\n\n**Step 2: Reset Network Adapter** (if Step 1 doesn't work)\n1. Right-click the Wi-Fi icon in system tray\n2. Select \"Open Network & Internet Settings\"\n3. Click \"Network reset\" at the bottom\n4. Click \"Reset now\" and restart your laptop\n\n**Step 3: Verify DNS Settings**\n1. Open Network Connections (Windows key + R, type `ncpa.cpl`)\n2. Right-click Wi-Fi adapter, select Properties\n3. Select \"Internet Protocol Version 4 (TCP/IPv4)\"\n4. Click Properties\n5. Select \"Use the following DNS server addresses\"\n6. Enter: Preferred DNS: 192.168.1.1, Alternate DNS: 8.8.8.8\n7. Click OK and test connection\n\n**Expected Resolution:**\nMost \"connected no internet\" issues are resolved by Step 1 (90% success rate). The entire process should take no more than 10-15 minutes.\n\n**If Issues Persist:**\nIf you're still experiencing problems after these steps, please reply to this email with:\n• Result of running `ipconfig /all` command\n• Screenshot of network adapter status\n• Any error messages you're seeing\n\nI'll escalate to our Network team if needed, but let's try these quick fixes first as they resolve most cases.\n\nYour productivity is important, so please don't hesitate to call the support desk at ext. 5500 if you need immediate phone assistance.\n\nBest regards,\n[Your Name]\nIT Support Team\n\n---\n\nWould you like me to modify any part of this reply or send it as is?" :
          "I've drafted a professional reply for the requester:\n\n---\n\n**Subject:** RE: Account Access Issue - INC-10247\n\nDear [User Name],\n\nThank you for contacting IT Support. I've reviewed your account access issue and I'm here to help you regain access to your account.\n\n**Issue Summary:**\nYour account was automatically locked due to multiple unsuccessful login attempts, which is a security measure designed to protect your account from unauthorized access.\n\n**Resolution Steps:**\nI've unlocked your account and you should now be able to access the portal. To ensure secure access:\n\n1. Please use the password reset link sent to your registered email address\n2. Create a strong, unique password that you haven't used before\n3. Verify that you can successfully log in to the portal\n\n**Security Recommendations:**\nTo prevent this issue in the future, I recommend:\n• Using a password manager to securely store your credentials\n• Enabling two-factor authentication for enhanced security\n• Contacting IT Support immediately if you notice any suspicious activity\n\n**Next Steps:**\nPlease confirm once you've successfully accessed your account. If you continue to experience any issues, please reply to this email or contact our support desk.\n\nYour ticket will remain open until we confirm your access has been restored.\n\nBest regards,\n[Your Name]\nIT Support Team\n\n---\n\nWould you like me to modify any part of this reply or send it as is?",
        followUpActions: ticketId === 'INC-35' ? ['Send Reply', 'Edit Draft', 'Add CC Manager'] : ticketId === 'INC-32' ? ['Send Reply', 'Edit Draft', 'Add Troubleshooting'] : ['Send Reply', 'Edit Draft', 'Add to Template']
      }
    };

    // Add AI response after a short delay
    setTimeout(() => {
      const response = aiResponses[actionType];
      const responseText = customResponse || response?.text || "I've processed your request. How else can I assist you with this request?";

      const aiMessage = {
        id: Date.now() + 1,
        text: '',
        fullText: responseText,
        displayedText: '',
        isUser: false,
        isTyping: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Add follow-up actions after AI response completes
      if (!customResponse && response?.followUpActions) {
        setTimeout(() => {
          const followUpMessage = {
            id: Date.now() + 2,
            text: '',
            isUser: false,
            timestamp: '',
            followUpActions: response.followUpActions
          };
          setChatMessages(prev => [...prev, followUpMessage as any]);
        }, responseText.length * 8 + 500); // Wait for typing animation to complete
      }
    }, 500);
  };

  // Expose handleQuickAction to parent component
  useEffect(() => {
    if (props.onQuickActionReady) {
      props.onQuickActionReady(handleQuickAction);
    }
  }, [props.onQuickActionReady]);

  // ServiceOps AI welcome screen — module-aware description + suggested actions (2–4 per page).
  // Ordered most-specific-first: the patch-family drawers also pass software/nonIt flags, so the
  // narrow modes must win before the broad asset ones.
  /* Recent ServiceOps AI conversations for this record (mock), grouped by recency. Deliberately
     EMPTY on the newer modules so the blank state is demoable; populated on the established ones.
     Each entry restores its own question + answer, so the history reads as a real switcher. */
  const CHAT_HISTORY: { id: string; title: string; group: string; when: string; q: string; a: string }[] = (() => {
    if (endpointMode) return [
      { id: 'e1', title: 'Why is this endpoint missing patches?', group: 'Today', when: '11:42 AM', q: 'Why is this endpoint missing patches?', a: 'This endpoint missed the last two deployment windows because it was offline during both. The agent reconnected recently, so the pending patches will install on its next check-in.' },
      { id: 'e2', title: 'Summarise its scan history', group: 'Previous 7 days', when: 'Fri, Aug 07', q: 'Summarise its scan history', a: 'Scans have completed successfully on every run for the past month, with an average duration of just under four minutes.' },
    ];
    if (patchDeployMode) return [
      { id: 'd1', title: 'Which endpoints failed and why?', group: 'Today', when: '09:18 AM', q: 'Which endpoints failed and why?', a: 'Two endpoints failed: one ran out of disk space during staging, the other was rebooted mid-install. Both are safe to retry.' },
      { id: 'd2', title: 'Is the rollout on track?', group: 'Previous 7 days', when: 'Sat, Aug 08', q: 'Is the rollout on track?', a: 'Yes — the majority of targets have installed successfully and the remainder are queued inside the current window.' },
      { id: 'd3', title: 'Explain the retry policy', group: 'Previous 30 days', when: 'Mon, Jul 27', q: 'Explain the retry policy', a: 'Failed installations retry automatically up to the configured retry count, spaced across subsequent agent check-ins.' },
    ];
    if (patchMode) return [
      { id: 'p1', title: 'Assess the risk of this patch', group: 'Today', when: '10:05 AM', q: 'Assess the risk of this patch', a: 'This is a critical security update addressing remotely exploitable vulnerabilities. It supersedes an earlier update and requires a reboot.' },
      { id: 'p2', title: 'Which endpoints still need it?', group: 'Previous 7 days', when: 'Thu, Aug 06', q: 'Which endpoints still need it?', a: 'A number of endpoints are still missing this patch, concentrated in two remote offices that were outside the last deployment window.' },
    ];
    if (assetMode || cmdbMode) return [
      { id: 'a1', title: 'Is this asset still under warranty?', group: 'Today', when: '08:51 AM', q: 'Is this asset still under warranty?', a: 'Yes — the warranty is active, though it expires within the next quarter, so it is worth planning renewal or replacement now.' },
      { id: 'a2', title: 'What is its total cost of ownership?', group: 'Previous 7 days', when: 'Wed, Aug 05', q: 'What is its total cost of ownership?', a: 'Total cost of ownership combines the purchase price with maintenance and support costs recorded against this asset to date.' },
      { id: 'a3', title: 'Any open issues linked to it?', group: 'Previous 30 days', when: 'Tue, Jul 21', q: 'Any open issues linked to it?', a: 'There are a small number of open records linked to this asset. The Relations tab lists each one with its current status.' },
    ];
    // Newer modules (package / registry deployment, CVE, license, contract, purchase) start empty.
    if (packageDeployMode || registryDeployMode || cveMode || licenseMode || contractMode || purchaseMode) return [];
    // Ticket / Problem / Change / Release
    return [
      { id: 'c1', title: 'Summarise the current status', group: 'Today', when: '02:14 PM', q: 'Summarise the current status', a: 'Here is where things stand right now, along with the most recent activity and who is currently accountable.' },
      { id: 'c2', title: 'What changed in the last 24 hours?', group: 'Today', when: '09:30 AM', q: 'What changed in the last 24 hours?', a: 'In the last 24 hours the status moved forward, ownership was reassigned once, and two new notes were added.' },
      { id: 'c3', title: 'Any similar records I should look at?', group: 'Previous 7 days', when: 'Mon, Aug 03', q: 'Any similar records I should look at?', a: 'I found a few closely related records with the same signature — worth reviewing before you take the next action.' },
      { id: 'c4', title: 'Draft an update for the requester', group: 'Previous 30 days', when: 'Fri, Jul 31', q: 'Draft an update for the requester', a: 'Here is a short, plain-language update you can send as-is or edit before sending.' },
    ];
  })();

  // What the history screen actually renders — the seed minus anything the user deleted.
  const chatHistory = CHAT_HISTORY.filter((c) => !removedChatIds.has(c.id));

  const deleteChatHistory = (id: string, title: string) => {
    setRemovedChatIds((prev) => new Set(prev).add(id));
    toast.success(`Chat deleted — "${title}"`);
  };

  // "New chat" — clear the thread back to the welcome screen and focus the composer.
  const startNewChat = () => {
    setChatMessages([]);
    setChatInput('');
    setShowChatHistory(false);
    setTimeout(() => chatInputRef.current?.focus(), 60);
  };

  // Restore a past conversation into the thread.
  const openChatHistory = (c: { q: string; a: string }) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setChatMessages([
      { id: Date.now(), text: c.q, isUser: true, timestamp: now },
      { id: Date.now() + 1, text: c.a, isUser: false, timestamp: now },
    ]);
    setShowChatHistory(false);
  };

  /* Requesters never see internal (technician) reviews — the portal shows only requester feedback. */
  const knowledgeReviews = knowledgeRequesterView ? addedReviews.filter((r) => r.role === 'requester') : addedReviews;

  const aiWelcome = (() => {
    const P = (label: string, prompt: string, icon: any, tip: string) => ({ label, prompt, icon, tip });
    if (endpointMode) return {
      desc: 'Ask ServiceOps AI anything about this endpoint or get assistance with its patch compliance, scans and health.',
      prompts: [
        P('Summarize Endpoint', 'Summarize this endpoint', Lightbulb, "Get an AI summary of this endpoint's health, patch state and inventory"),
        P('Analyze Missing Patches', 'Analyze the missing patches on this endpoint', Brain, 'Prioritize the missing patches by severity and exposure'),
        P('Check Scan & Health Status', 'Check the scan and health status of this endpoint', SearchIcon, 'Review the latest patch and vulnerability scans and system health'),
      ],
    };
    if (patchDeployMode) return {
      desc: 'Ask ServiceOps AI anything about this deployment or get assistance with its rollout, failures and retries.',
      prompts: [
        P('Summarize Deployment', 'Summarize this patch deployment', Lightbulb, "Get an AI summary of this deployment's configuration and progress"),
        P('Analyze Failed Installations', 'Analyze the failed installations in this deployment', Brain, 'Find out why installations failed and how to remediate them'),
        P('Check Rollout Progress', 'Check the rollout progress of this deployment', SearchIcon, 'See how far the rollout has progressed across endpoints'),
      ],
    };
    if (patchMode) return {
      desc: 'Ask ServiceOps AI anything about this patch or get assistance with its vulnerabilities, endpoints and deployment.',
      prompts: [
        P('Summarize Patch', 'Summarize this patch', Lightbulb, "Get an AI summary of this patch's severity, coverage and status"),
        P('Assess Vulnerability Risk', 'Assess the vulnerability risk this patch addresses', Brain, 'Understand the CVEs this patch fixes and their risk'),
        P('Check Impacted Endpoints', 'Which endpoints are missing this patch?', SearchIcon, 'List the endpoints still missing this patch'),
        P('Check Supersedence', 'Is this patch superseded by a newer one?', FileText, 'See whether a newer patch replaces this one'),
      ],
    };
    if (licenseMode) return {
      desc: 'Ask ServiceOps AI anything about this license or get assistance with its compliance, allocation and renewal.',
      prompts: [
        P('Summarize License', 'Summarize this software license', Lightbulb, "Get an AI summary of this license's usage and compliance"),
        P('Check Compliance & Utilization', 'Check the compliance and utilization of this license', Brain, 'Compare purchased vs allocated vs installed counts'),
        P('Check Expiry & Renewal', 'When does this license expire and what should I plan for renewal?', FileText, 'Review the expiry date and renewal recommendation'),
      ],
    };
    if (contractMode) return {
      desc: 'Ask ServiceOps AI anything about this contract or get assistance with its renewal, cost and coverage.',
      prompts: [
        P('Summarize Contract', 'Summarize this contract', Lightbulb, "Get an AI summary of this contract's terms, cost and status"),
        P('Check Expiry & Renewal', 'When does this contract expire and what are the renewal options?', Brain, 'Review the end date and plan the renewal'),
        P('Find Linked Assets & Purchases', 'Find the assets and purchases linked to this contract', SearchIcon, 'See what this contract covers'),
      ],
    };
    if (purchaseMode) return {
      desc: 'Ask ServiceOps AI anything about this purchase order or get assistance with approvals, deliveries and payments.',
      prompts: [
        P('Summarize Purchase Order', 'Summarize this purchase order', Lightbulb, "Get an AI summary of this order's items, cost and status"),
        P('Check Payment & Settlement', 'Check the payment and settlement status of this order', Brain, 'Compare invoiced vs paid amounts and the outstanding cost'),
        P('Check Pending Deliveries', 'Which ordered items are still pending delivery?', SearchIcon, 'Compare ordered vs received quantities'),
      ],
    };
    if (cmdbMode) return {
      desc: 'Ask ServiceOps AI anything about this CI or get assistance with its dependencies, impact and health.',
      prompts: [
        P('Summarize CI', 'Summarize this configuration item', Lightbulb, "Get an AI summary of this CI's configuration and health"),
        P('Analyze Dependencies & Impact', 'Analyze the dependencies and impact of this CI', Brain, 'Understand what depends on this CI and what an outage would affect'),
        P('Find Related CIs', 'Find CIs related to this one', SearchIcon, 'Search the CMDB for connected or similar CIs'),
      ],
    };
    if (softwareMode) return {
      desc: 'Ask ServiceOps AI anything about this software or get assistance with its licensing, installations and compliance.',
      prompts: [
        P('Summarize Software', 'Summarize this software asset', Lightbulb, "Get an AI summary of this software's installations and compliance"),
        P('Check License Compliance', 'Check the license compliance of this software', Brain, 'Compare installations against owned licenses'),
        P('Find Installations', 'Which devices have this software installed?', SearchIcon, 'List the endpoints where this software is installed'),
      ],
    };
    if (assetMode) return { // hardware / non-IT / consumable
      desc: 'Ask ServiceOps AI anything about this asset or get assistance with its configuration, warranty and compliance.',
      prompts: [
        P('Summarize Asset', 'Summarize this asset', Lightbulb, "Get an AI summary of this asset's configuration and health"),
        P('Find Similar Assets', 'Find similar assets', SearchIcon, 'Search for similar assets in the inventory'),
        P('Suggest KB Article', 'Suggest KB', FileText, 'Find relevant knowledge base articles for this asset'),
        P('Check Warranty & Compliance', 'Check warranty and compliance', Brain, 'Check warranty status and software compliance for this asset'),
      ],
    };
    return { // ticket / problem / change / release
      desc: 'Ask ServiceOps AI anything about this request or get assistance with troubleshooting and resolution.',
      prompts: [
        P('Suggest Solution', 'Suggest a solution for this issue', Lightbulb, 'Get AI-powered solution recommendations for this issue'),
        P('Find Similar Requests', 'Find similar resolved requests', SearchIcon, 'Search for similar resolved requests in the system'),
        P('Suggest KB Article', 'Suggest KB', FileText, 'Find relevant knowledge base articles for resolution'),
        P('Analyze Root Cause', 'Root Cause', Brain, 'Identify potential root causes of this issue'),
      ],
    };
  })();

  // Save section order to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(sectionStorageKey, JSON.stringify(sectionOrder));
    }
  }, [sectionOrder, sectionStorageKey]);

  // Typing animation effect
  useEffect(() => {
    const typingMessage = chatMessages.find(msg => msg.isTyping && msg.fullText && !msg.displayedText);
    
    if (typingMessage && typingMessage.fullText) {
      let currentIndex = 0;
      const typingSpeed = 8; // milliseconds per character
      const fullText = typingMessage.fullText;
      const messageId = typingMessage.id;
      
      typingIntervalRef.current = setInterval(() => {
        currentIndex++;
        
        if (currentIndex <= fullText.length) {
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, displayedText: fullText.substring(0, currentIndex) }
                : msg
            )
          );
        } else {
          // Typing complete
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, text: fullText, isTyping: false, displayedText: undefined, fullText: undefined }
                : msg
            )
          );
          
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
        }
      }, typingSpeed);
      
      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }
  }, [chatMessages.length]);

  // Function to render markdown text with bold support and line breaks
  const renderMarkdown = (text: string) => {
    // Split by line breaks first
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Then split each line by bold markers
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Add line break after each line except the last one
      if (lineIndex < lines.length - 1) {
        return <span key={lineIndex}>{renderedLine}<br /></span>;
      }
      return <span key={lineIndex}>{renderedLine}</span>;
    });
  };

  // Auto-scroll effect when messages update or typing is in progress
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages]);

  // Auto-focus chatbot input when chatbot group is active
  useEffect(() => {
    if (activeGroup === 'chatbot' && chatInputRef.current) {
      chatInputRef.current.focus();
    }
    // Leaving the AI panel drops the history screen, so reopening lands on the chat.
    if (activeGroup !== 'chatbot') setShowChatHistory(false);
  }, [activeGroup]);

  // Reviews belong to ONE article — clear anything added when a different record opens.
  /* Seed reviews per article. Articles with an EVEN id number start empty so the "no reviews
     yet" state stays demoable; the rest carry a short thread. Seeding into state (rather than
     merging a constant at render) is what lets rows be edited and deleted. */
  useEffect(() => {
    const n = Number((ticketId ?? '').replace(/\D/g, '')) || 0;
    setAddedReviews(!knowledgeMode || n % 2 === 0 ? [] : [
      { id: 'seed-1', author: 'Karan Malhotra', initials: 'KM', color: '#3D8BD0', when: '2 days ago', role: 'technician', text: 'Steps are accurate against the current client build. I would add a line about the twelve-hour session expiry so people are not surprised when they have to sign in again each morning.' },
      { id: 'seed-2', author: 'Priya Nair', initials: 'PN', color: '#8B5CF6', when: 'Fri, Aug 07', role: 'requester', text: 'Checked this end to end on a fresh laptop and it works exactly as written. The troubleshooting table saved me a ticket last week.' },
    ]);
    setReviewDraft('');
    setEditingReviewId(null);
    setShowReviewsPanel(false);
    if (reviewContentRef.current) reviewContentRef.current.innerHTML = '';
  }, [ticketId, knowledgeMode]);

  // Debug: Log when showReopenTooltip changes
  useEffect(() => {
    console.log('showReopenTooltip state changed to:', showReopenTooltip);
  }, [showReopenTooltip]);

  // Calculate tooltip position when it shows
  useEffect(() => {
    if (showReopenTooltip && aiIconRef.current) {
      const rect = aiIconRef.current.getBoundingClientRect();
      console.log('AI Icon position:', rect);
      setTooltipPosition({
        top: rect.top + rect.height / 2, // Center vertically with the icon
        left: rect.left - 296 // 280px tooltip width + 16px gap
      });
    }
  }, [showReopenTooltip]);

  // Auto-close tooltip after 5 seconds
  useEffect(() => {
    if (showReopenTooltip) {
      const timer = setTimeout(() => {
        console.log('Auto-closing tooltip after 5 seconds');
        setShowReopenTooltip(false);
        sessionStorage.setItem('hasSeenReopenTooltip', 'true');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showReopenTooltip]);

  // Onboarding step 3 (index 2) - Trigger AI summary generation
  useEffect(() => {
    if (onboardingStep === 2 && !onboardingSummaryLoaded) {
      // Start loading state
      setIsRegeneratingSummary(true);
      setOnboardingSummaryLoaded(true);
      
      // After 2 seconds, show summary content with animation
      setTimeout(() => {
        setIsRegeneratingSummary(false);
        setShowOnboardingSummaryContent(true);
        
        // After summary content finishes animating, show Quick AI Actions
        setTimeout(() => {
          setShowOnboardingQuickActions(true);
        }, 1500); // Total time for summary animation + copy/note buttons to complete
      }, 2000); // 2 second loading
    }
  }, [onboardingStep, onboardingSummaryLoaded]);

  // Click-outside detection for tooltip
  useEffect(() => {
    if (showReopenTooltip) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          reopenTooltipRef.current &&
          !reopenTooltipRef.current.contains(event.target as Node) &&
          aiIconRef.current &&
          !aiIconRef.current.contains(event.target as Node)
        ) {
          console.log('Clicked outside tooltip, closing');
          setShowReopenTooltip(false);
          sessionStorage.setItem('hasSeenReopenTooltip', 'true');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showReopenTooltip]);

  return (
    <div className="flex border-l border-[#e5e7eb] bg-white overflow-visible flex-shrink-0 relative" data-onboarding="ticket-properties">
      {/* Resize Handle - only visible when accordion is not collapsed */}
      {!isAccordionCollapsed && (
        <div
          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group z-[60] hover:z-[70]"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsAccordionResizing(true);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAccordionWidth(390);
          }}
        >
          {/* Vertical Line - only visible on hover */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-transparent group-hover:bg-[#3D8BD0] transition-colors"></div>
          
          {/* Rounded Handle in Center - only visible on hover */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-12 bg-white border border-[#e5e7eb] rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-[#3D8BD0] transition-all">
            <div className="flex flex-col gap-0.5">
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Container - Flex Column */}
      <div className={`flex-shrink-0 flex flex-col transition-all duration-300 h-full ${
        isAccordionCollapsed ? 'hidden' : ''
      }`} style={{ width: isAccordionCollapsed ? '0px' : `${accordionWidth}px` }} data-onboarding={activeGroup === 'chatbot' ? 'serviceops-ai' : undefined}>
        
        {/* Scrollable Content Area. `--panel-header-h` is the MEASURED height of the sticky group
            header below; the accordions inside pin to it. It has to be measured rather than
            hardcoded because the header's height changes with the group (the Knowledge page hides
            its title row) — a fixed offset either overlaps the header or leaves a gap that
            scrolling content shows through. */}
        <div
          className={`${activeGroup === 'chatbot' ? '' : 'flex-1 overflow-y-auto p-4 pt-0 pb-8'}`}
          style={{ ['--panel-header-h' as string]: `${groupHeaderH}px` } as React.CSSProperties}
        >
        {/* Group Header with Search/Filter */}
        <div
          ref={groupHeaderRef}
          className={`sticky top-0 z-[50] ${activeGroup === 'chatbot' ? 'py-3 px-4' : 'pt-3 pb-3'}`}
          style={activeGroup === 'chatbot' ? {
            background: 'linear-gradient(270deg, rgba(249, 250, 251, 0.00) 90.76%, var(--Color-Variable-Custom-ToolTip-BG, #F9FAFB) 98.45%)',
            transform: isChatbotClosing ? 'scaleY(0)' : (isChatbotOpening ? 'scaleY(0)' : 'scaleY(1)'),
            transformOrigin: 'bottom',
            opacity: isChatbotClosing ? 0 : 1,
            transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',
            overflow: 'hidden'
          } : { background: 'white' }}
        >
          {/* Header — hidden on the Knowledge page's properties group (no title, no search). */}
          <div className={`flex items-center justify-between mb-1.5 ${knowledgeMode && activeGroup === 'properties' ? 'hidden' : ''}`}>
            <h2 className="text-[15px] font-semibold text-[#364658] flex items-center gap-2">
              {(activeGroup === 'suggestions' || activeGroup === 'chatbot') && (
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="sparkle-gradient-properties" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4CB1FE" />
                      <stop offset="20.44%" stopColor="#731EFB" />
                      <stop offset="99.68%" stopColor="#F911E3" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#sparkle-gradient-properties)" d="M15,5h.83v.83c0,.46.37.83.83.83.46,0,.83-.37.83-.83v-.83h.83c.46,0,.83-.37.83-.83,0-.46-.37-.83-.83-.83h-.83v-.83c0-.46-.37-.83-.83-.83-.46,0-.83.37-.83.83v.83h-.83c-.46,0-.83.37-.83.83,0,.46.37.83.83.83ZM18.97,9.33l-.06-.08-.07-.08c-.16-.18-.37-.3-.6-.37h-.01s-5.11-1.32-5.11-1.32c-.14-.04-.28-.11-.38-.22-.11-.11-.18-.24-.22-.38l-1.32-5.11v-.02s-.04-.1-.04-.1c-.08-.22-.23-.42-.42-.56-.22-.16-.48-.25-.76-.25-.24,0-.47.07-.67.2l-.08.06c-.22.16-.37.4-.45.66v.02s-1.32,5.11-1.32,5.11c-.04.14-.11.28-.22.38-.08.08-.17.14-.28.18l-.11.04-5.11,1.32s-.01,0-.02,0c-.23.06-.43.19-.59.37l-.07.08c-.14.19-.23.42-.25.65v.1s0,.1,0,.1c.02.24.1.46.25.65.16.22.39.37.66.45,0,0,.01,0,.02,0l5.11,1.32c.14.04.28.11.38.22.11.11.18.24.22.38l1.32,5.11s0,.01,0,.02c.07.26.23.49.45.66.22.16.48.25.76.25.27,0,.54-.09.75-.25.22-.16.37-.4.45-.66,0,0,0-.01,0-.02l1.32-5.11c.04-.14.11-.28.22-.38.11-.11.24-.18.38-.22l5.11-1.32h.01c.26-.08.5-.23.66-.45.17-.22.25-.48.25-.76,0-.24-.07-.47-.2-.67ZM12.71,10.91c-.43.11-.83.34-1.14.65-.32.32-.54.71-.65,1.14l-.91,3.54-.91-3.54c-.11-.43-.34-.83-.65-1.14-.32-.32-.71-.54-1.14-.65l-3.54-.91,3.54-.91c.43-.11.83-.34,1.14-.65.32-.32.54-.71.65-1.14l.91-3.54.91,3.54.05.16c.12.37.33.71.61.98.32.32.71.54,1.14.65l3.54.91-3.54.91ZM4.25,14.17h-.09c0-.46-.37-.84-.83-.84-.46,0-.83.37-.83.83h-.08c-.42.05-.75.4-.75.83s.33.79.75.83h.08s0,.09,0,.09c.04.42.4.75.83.75.43,0,.79-.33.83-.75v-.08s.09,0,.09,0c.42-.04.75-.4.75-.83s-.33-.79-.75-.83Z"/>
                </svg>
              )}
              {activeGroup === 'notifications' ? 'Notifications' : activeGroup === 'integration' ? 'Integration' : activeGroup === 'affected-products' ? 'Affected Products' : activeGroup === 'file-details' ? 'File Details' : getGroupTitle()}
            </h2>
            {/* ServiceOps AI header controls — New chat · Chat history · minimize */}
            {activeGroup === 'chatbot' && (
              <div className="flex flex-shrink-0 items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={startNewChat} className="rounded p-1.5 transition-colors hover:bg-gray-100">
                      <SquarePen size={16} className="text-[#7B8FA5]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>New chat</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowChatHistory((v) => !v)}
                      className={`rounded p-1.5 transition-colors ${showChatHistory ? 'bg-[#EBF5FF]' : 'hover:bg-gray-100'}`}
                    >
                      <History size={16} className={showChatHistory ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Chat history</TooltipContent>
                </Tooltip>
              <button
                title="Close AI"
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                onClick={() => {
                  // Start closing animation
                  setIsChatbotClosing(true);

                  // After animation completes, switch to properties view
                  setTimeout(() => {
                    setActiveGroup('properties');
                    setIsChatbotClosing(false);

                    // Show tooltip only if onboarding is complete and hasn't been shown this session
                    // DISABLED: Reopen tooltip temporarily hidden
                    // const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
                    // const hasSeenReopenTooltip = sessionStorage.getItem('hasSeenReopenTooltip');
                    // console.log('Close button clicked - hasSeenOnboarding:', hasSeenOnboarding, 'hasSeenReopenTooltip:', hasSeenReopenTooltip);
                    // if (hasSeenOnboarding && !hasSeenReopenTooltip) {
                    //   setTimeout(() => {
                    //     console.log('Showing reopen tooltip');
                    //     setShowReopenTooltip(true);
                    //   }, 300);
                    // }
                  }, 400); // Animation duration
                }}
              >
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              </button>
              </div>
            )}
            {activeGroup === 'users' && (
              <button title={showMembers ? 'Add Member' : 'Add User'} onClick={() => (showMembers ? setShowAddMembers(true) : openAddUser())} className="size-7 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors">
                <Plus size={15} />
              </button>
            )}
            {activeGroup === 'notifications' && emailNotifications.length > 0 && (
              <button title="Send Email" onClick={() => setShowSendEmail(true)} className="size-7 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors">
                <Plus size={15} />
              </button>
            )}
            {activeGroup === 'notes' && (
              <button title="Add Note" onClick={openAddNote} className="size-7 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors">
                <Plus size={15} />
              </button>
            )}
            {activeGroup === 'file-details' && patchFiles.length > 0 && (
              <button title="Upload File" onClick={() => fileInputRef.current?.click()} className="size-7 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors">
                <Plus size={15} />
              </button>
            )}
          </div>

          {/* Search Bar - Always visible for properties, activity, and suggestions.
              V2 ticket page (compactTicketFields): the panel holds only 7 fixed fields, so the
              properties field-search + filter are dropped — search lives in the Incident
              Details tab instead. Activity/Suggestions searches are unaffected. */}
          {((activeGroup === 'properties' && !compactTicketFields && !cveMode && !knowledgeMode) || (activeGroup === 'activity' && assetMode && !taskMode)) && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 border border-[#DFE5ED] rounded px-2 py-1.5">
                <Search size={16} className="text-[#7B8FA5]" />
                <input
                  type="text"
                  placeholder={activeGroup === 'activity' || activeGroup === 'suggestions' ? 'Search...' : 'Search fields...'}
                  value={propertiesSearchQuery}
                  onChange={(e) => setPropertiesSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-[13px] text-[#364658] placeholder:text-[#7B8FA5]"
                />
              </div>
              {/* Patch-family pages (patch / deployment / endpoint) have one read-only fields list —
                  no empty/filled distinction worth filtering, so the icon is dropped there. */}
              {activeGroup === 'properties' && !patchMode && (
                <div className="relative" ref={propertiesFilterRef}>
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    onClick={() => setShowPropertiesFilter(!showPropertiesFilter)}
                  >
                    <Filter size={16} className="text-[#7B8FA5]" />
                  </button>
                  
                  {/* Filter Dropdown */}
                  {showPropertiesFilter && (
                    <div className="app-menu absolute right-0 top-full mt-1 w-[180px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-50">
                      <button
                        className={`w-full flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#F9FAFB] transition-colors ${
                          selectedFilter === 'all' ? 'text-[#3D8BD0]' : 'text-[#364658]'
                        }`}
                        onClick={() => {
                          setSelectedFilter('all');
                          setShowPropertiesFilter(false);
                        }}
                      >
                        <span>All fields</span>
                        {selectedFilter === 'all' && <Check size={14} className="text-[#3D8BD0]" />}
                      </button>
                      <button
                        className={`w-full flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#F9FAFB] transition-colors ${
                          selectedFilter === 'empty' ? 'text-[#3D8BD0]' : 'text-[#364658]'
                        }`}
                        onClick={() => {
                          setSelectedFilter('empty');
                          setShowPropertiesFilter(false);
                        }}
                      >
                        <span>Empty fields</span>
                        {selectedFilter === 'empty' && <Check size={14} className="text-[#3D8BD0]" />}
                      </button>
                      <button
                        className={`w-full flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#F9FAFB] transition-colors ${
                          selectedFilter === 'filled' ? 'text-[#3D8BD0]' : 'text-[#364658]'
                        }`}
                        onClick={() => {
                          setSelectedFilter('filled');
                          setShowPropertiesFilter(false);
                        }}
                      >
                        <span>Filled fields</span>
                        {selectedFilter === 'filled' && <Check size={14} className="text-[#3D8BD0]" />}
                      </button>
                      <button
                        className={`w-full flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#F9FAFB] transition-colors ${
                          selectedFilter === 'required' ? 'text-[#3D8BD0]' : 'text-[#364658]'
                        }`}
                        onClick={() => {
                          setSelectedFilter('required');
                          setShowPropertiesFilter(false);
                        }}
                      >
                        <span>Required fields</span>
                        {selectedFilter === 'required' && <Check size={14} className="text-[#3D8BD0]" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Request Properties Group Content */}
        {activeGroup === 'properties' && (
          <div className="space-y-3">
        {/* The content will continue in a follow-up message due to size */}

        {/* Warranty status — pinned to the very top of the asset properties panel */}
        {assetMode && warranty && (() => {
          const expired = warranty.daysLeft < 0;
          const soon = !expired && warranty.daysLeft <= 30;
          const tone = expired
            ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', Icon: ShieldX }
            : soon
              ? { bg: '#FFF7ED', border: '#FDE4C8', text: '#D97706', Icon: ShieldAlert }
              : { bg: '#ECFDF5', border: '#C7EBD9', text: '#22A06B', Icon: ShieldCheck };
          const label = expired
            ? `Warranty expired ${Math.abs(warranty.daysLeft)} days ago`
            : warranty.daysLeft === 0
              ? 'Warranty expires today'
              : `Warranty expires in ${warranty.daysLeft} day${warranty.daysLeft === 1 ? '' : 's'}`;
          return (
            <div
              className="flex items-center gap-2 rounded border px-3 py-1.5"
              style={{ backgroundColor: tone.bg, borderColor: tone.border }}
              title={warranty.expiryDate ? `Warranty expiration: ${warranty.expiryDate}` : undefined}
            >
              <tone.Icon size={15} style={{ color: tone.text }} className="flex-shrink-0" />
              <span className="text-[12px] font-semibold truncate" style={{ color: tone.text }}>{label}</span>
            </div>
          );
        })()}

        {/* License expiry status — pinned to the very top of the software asset panel */}
        {assetMode && licenseExpiry && (() => {
          const expired = licenseExpiry.daysLeft < 0;
          const soon = !expired && licenseExpiry.daysLeft <= 30;
          const tone = expired
            ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', Icon: KeyRound }
            : soon
              ? { bg: '#FFF7ED', border: '#FDE4C8', text: '#D97706', Icon: KeyRound }
              : { bg: '#ECFDF5', border: '#C7EBD9', text: '#22A06B', Icon: BadgeCheck };
          const label = expired
            ? `License expired ${Math.abs(licenseExpiry.daysLeft)} days ago`
            : licenseExpiry.daysLeft === 0
              ? 'License expires today'
              : soon
                ? `License expires in ${licenseExpiry.daysLeft} day${licenseExpiry.daysLeft === 1 ? '' : 's'}`
                : `Licensed · ${licenseExpiry.daysLeft} days left`;
          return (
            <div
              className="flex items-center gap-2 rounded border px-3 py-1.5"
              style={{ backgroundColor: tone.bg, borderColor: tone.border }}
              title={licenseExpiry.expiryDate ? `License expiration: ${licenseExpiry.expiryDate}` : undefined}
            >
              <tone.Icon size={15} style={{ color: tone.text }} className="flex-shrink-0" />
              <span className="text-[12px] font-semibold truncate" style={{ color: tone.text }}>{label}</span>
            </div>
          );
        })()}

        {/* Review — pinned above Knowledge Properties (mirrors the asset page's Agent block).
            Two states: nothing reviewed yet → an "Add Review" affordance; otherwise the count,
            which opens the reviews side popup. */}
        {knowledgeMode && (
          knowledgeReviews.length === 0 ? (
            <button
              onClick={() => setShowReviewsPanel(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#DFE5ED] bg-[#F9FAFB] p-3 text-left transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F9FD]"
            >
              <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]"><MessageSquare size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#364658]">Review</span>
                <span className="mt-0.5 block text-[11px] text-[#7B8FA5]">No reviews yet — add the first one</span>
              </span>
              <Plus size={16} className="flex-shrink-0 text-[#3D8BD0]" />
            </button>
          ) : (
            <button
              onClick={() => setShowReviewsPanel(true)}
              className="flex w-full items-center gap-3 rounded-lg bg-[#F9FAFB] p-3 text-left transition-colors hover:bg-[#F1F5F9]"
            >
              <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]"><MessageSquare size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#364658]">
                  Review
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3D8BD0] px-1 text-[11px] font-semibold text-white">{knowledgeReviews.length}</span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[#7B8FA5]">
                  Last by {knowledgeReviews[0].author} · {knowledgeReviews[0].when}
                </span>
              </span>
              <ChevronRight size={16} className="flex-shrink-0 text-[#9CA3AF]" />
            </button>
          )
        )}

        {/* Agent Information — pinned to the top of the asset properties panel */}
        {assetMode && (agentInfo?.id || agentInfo?.lastSyncDate) && (
          <div ref={requesterInfoRef}>
            <div className="group relative flex items-center gap-3 rounded-lg bg-[#F9FAFB] p-3">
              <button
                title="Scan now"
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded border border-[#DFE5ED] bg-white px-2 py-1 text-[11px] font-medium text-[#3D8BD0] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#EAF3FB] hover:border-[#3D8BD0]"
              >
                <ScanLine size={12} />
                Scan now
              </button>
              <span className="flex size-10 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0] flex-shrink-0"><Bot size={20} /></span>
              <div className="min-w-0">
                {(agentInfo?.agentName || agentInfo?.id) && (
                  <div className="text-[13px] font-semibold text-[#364658] truncate flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#EAB308' }} />
                    {agentInfo.agentName || agentInfo.id}
                    {agentInfo?.version && (
                      <span className="rounded bg-[#EAF3FB] px-1.5 py-0.5 text-[10px] font-medium text-[#3D8BD0] flex-shrink-0">v{agentInfo.version}</span>
                    )}
                  </div>
                )}
                {agentInfo?.lastSyncDate && (
                  <div className="text-[11px] text-[#7B8FA5] flex items-center gap-1.5 mt-0.5">
                    <RefreshCw size={11} className="flex-shrink-0" />
                    <span className="truncate">Last synced {agentInfo.lastSyncDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pinned Fields Accordion */}
        <PinnedFieldsAccordion
          assetMode={assetMode}
          assetState={assetState}
          pinnedFieldsExpanded={pinnedFieldsExpanded}
          setPinnedFieldsExpanded={setPinnedFieldsExpanded}
          pinnedFields={pinnedFields}
          selectedStatus={selectedStatus}
          selectedPriority={selectedPriority}
          selectedAssignee={selectedAssignee}
          selectedTechGroup={selectedTechGroup}
          selectedUrgency={selectedUrgency}
          selectedImpact={selectedImpact}
          selectedCategory={selectedCategory}
          selectedDepartment={selectedDepartment}
          selectedSource={selectedSource}
          selectedLocation={selectedLocation}
          selectedVendor={selectedVendor}
          selectedSupportLevel={selectedSupportLevel}
          getCurrentStatusColor={getCurrentStatusColor}
          getCurrentPriorityColor={getCurrentPriorityColor}
          getCurrentAssigneeColor={getCurrentAssigneeColor}
          getCurrentUrgencyColor={getCurrentUrgencyColor}
          getCurrentImpactColor={getCurrentImpactColor}
          priorityOptions={priorityOptions}
          assigneeOptions={assigneeOptions}
          togglePinField={togglePinField}
        />
        
        {/* AI Fields Suggestion — ticket page only. The pill opens an OVERLAY popup
            (not an inline accordion) showing old value → suggested value per property;
            rows whose current value already matches are filtered out. */}
        {showIntegration && !suggestDismissed && !suggestApplied && (() => {
          const SUGGESTIONS = [
            {
              key: 'priority',
              label: 'Priority',
              current: selectedPriority,
              value: 'Urgent',
              node: (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold leading-none text-[#364658]">
                  <span className="size-2 rounded-full bg-[#EF4444]" />Urgent
                </span>
              ),
              apply: () => setSelectedPriority('Urgent'),
            },
            {
              key: 'assignee',
              label: 'Assignee',
              current: selectedAssignee,
              value: 'Michael Chen',
              node: (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold leading-none text-[#364658]">
                  <span className="flex size-5 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">MC</span>
                  Michael Chen
                </span>
              ),
              apply: () => setSelectedAssignee('Michael Chen'),
              why: 'Michael Chen has resolved 12 similar connectivity requests, on average 40% faster than the team. Sarah Johnson currently has 8 requests in progress.',
            },
            {
              key: 'urgency',
              label: 'Urgency',
              current: selectedUrgency,
              value: 'High',
              node: (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold leading-none text-[#364658]">
                  <span className="size-2 rounded-full bg-[#EF4444]" />High
                </span>
              ),
              apply: () => setSelectedUrgency('High'),
            },
            {
              key: 'impact',
              label: 'Impact',
              current: selectedImpact,
              value: 'On Department',
              node: (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold leading-none text-[#364658]">
                  <span className="size-2 rounded-full bg-[#F59E0B]" />On Department
                </span>
              ),
              apply: () => setSelectedImpact('On Department'),
              why: 'Five similar requests from the same floor suggest the outage reaches beyond a single user.',
            },
            {
              key: 'category',
              label: 'Category',
              current: selectedCategory,
              value: 'Network',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">Network</span>
              ),
              apply: () => setSelectedCategory('Network'),
            },
            {
              key: 'techGroup',
              label: 'Technician Group',
              current: selectedTechGroup,
              value: 'IT Support Team',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">IT Support Team</span>
              ),
              apply: () => setSelectedTechGroup('IT Support Team'),
            },
            {
              key: 'department',
              label: 'Department',
              current: selectedDepartment,
              value: 'IT',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">IT</span>
              ),
              apply: () => setSelectedDepartment('IT'),
            },
            {
              key: 'supportLevel',
              label: 'Support Level',
              current: selectedSupportLevel,
              value: 'Level 3',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">Level 3</span>
              ),
              apply: () => setSelectedSupportLevel('Level 3'),
              why: 'Similar requests needed network-team involvement — Level 2 resolved only 2 of the last 14.',
            },
            {
              key: 'location',
              label: 'Location',
              current: selectedLocation,
              value: 'Ahmedabad HQ — Floor 3',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">Ahmedabad HQ — Floor 3</span>
              ),
              apply: () => setSelectedLocation('Ahmedabad HQ — Floor 3'),
            },
            {
              key: 'source',
              label: 'Source',
              current: selectedSource,
              value: 'Support Portal',
              node: (
                <span className="text-[12px] font-semibold leading-none text-[#364658]">Support Portal</span>
              ),
              apply: () => setSelectedSource('Support Portal'),
              why: 'The request was submitted through the self-service portal but logged under a different channel.',
            },
          ];
          // Nothing to enrich when the ticket already matches every suggestion.
          const ACTIVE = SUGGESTIONS.filter((sg) => sg.current !== sg.value);
          if (!ACTIVE.length) return null;
          const toggleSuggest = (key: string) =>
            setSuggestChecked((p) => {
              const n = new Set(p);
              if (n.has(key)) n.delete(key);
              else n.add(key);
              return n;
            });
          const pickedCount = ACTIVE.filter((sg) => suggestChecked.has(sg.key)).length;
          const applySuggestions = () => {
            const picked = ACTIVE.filter((sg) => suggestChecked.has(sg.key));
            picked.forEach((sg) => sg.apply());
            setSuggestApplied(true);
            toast.success(`${picked.length} propert${picked.length === 1 ? 'y' : 'ies'} updated from suggestions`);
          };
          return (
            <div className="relative">
              <button
                onClick={() => setSuggestOpen(true)}
                className="ai-animated-border relative flex w-full items-center gap-2 overflow-hidden rounded-lg px-4 py-3 text-left transition-shadow hover:shadow-[0_2px_10px_rgba(115,30,251,0.12)]"
              >
                {/* The AI Summary card's gradient wash, exactly. */}
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ opacity: 0.03, background: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)' }}
                />
                <AiSparkle size={16} />
                <span className="flex-1 text-[13px] font-semibold text-[#364658]">Fields Suggestion</span>
                <span
                  className="rounded-full px-1.5 py-px text-[10px] font-semibold text-[#364658]"
                  style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
                >
                  {ACTIVE.length}
                </span>
                <ChevronRight size={16} className="flex-shrink-0 text-[#7B8FA5]" />
              </button>
              {suggestOpen && createPortal(
                <div className="fixed inset-0 z-[9998]">
                  <div className="absolute inset-0 bg-black/20" onClick={() => setSuggestOpen(false)} />
                  {/* OPTION 2 (INC-31 only): a CENTER modal wearing the AI gradient as a
                      full four-side border; every other ticket keeps the side panel with
                      its left gradient rule. Same content either way. */}
                  <div
                    className={
                      ticketId === 'INC-31'
                        ? 'absolute left-1/2 top-1/2 flex max-h-[86vh] w-[560px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl shadow-2xl'
                        : 'absolute right-0 top-0 flex h-full w-[480px] max-w-full flex-col bg-white shadow-2xl'
                    }
                    style={
                      ticketId === 'INC-31'
                        ? {
                            background:
                              'linear-gradient(white, white) padding-box, linear-gradient(135deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                            border: '1px solid transparent',
                          }
                        : undefined
                    }
                  >
                    {ticketId !== 'INC-31' && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
                      style={{ background: 'linear-gradient(180deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)' }}
                    />
                    )}
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-5 py-3.5">
                      <AiSparkle size={16} className="flex-shrink-0" />
                      <h2 className="flex-1 text-[15px] font-semibold text-[#1E293B]">Suggested field updates</h2>
                      <button
                        onClick={() => setSuggestOpen(false)}
                        className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
                      >
                        <X size={18} className="text-[#64748B]" />
                      </button>
                    </div>
                    <p className="px-5 pt-3 text-[12px] leading-relaxed text-[#7B8FA5]">
                      Based on similar resolved requests, these fields can be updated as below.
                    </p>
                    {/* Select all — a banded control ABOVE the list, not a row of it. */}
                    <div className="mt-3 flex items-center justify-between border-y border-[#F0F2F5] bg-[#F8FAFC] px-5 py-2.5">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={pickedCount === ACTIVE.length}
                          onChange={() =>
                            setSuggestChecked(pickedCount === ACTIVE.length ? new Set() : new Set(ACTIVE.map((sg) => sg.key)))
                          }
                          className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0]"
                        />
                        <span className="text-[12px] font-medium text-[#364658]">Select all</span>
                      </label>
                      <span className="text-[12px] tabular-nums text-[#94A3B8]">{pickedCount} of {ACTIVE.length} selected</span>
                    </div>
                    {/* Rows */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-1">
                      <div className="divide-y divide-[#F1F5F9]">
                        {ACTIVE.map((sg) => (
                          <label key={sg.key} className="flex cursor-pointer items-center gap-2.5 py-3">
                            <input
                              type="checkbox"
                              checked={suggestChecked.has(sg.key)}
                              onChange={() => toggleSuggest(sg.key)}
                              className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0]"
                            />
                            <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-[12px] text-[#4A5568]">
                              {sg.label}
                              {/* Why this is suggested — explainable AI, on hover. */}
                              {sg.why && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="flex cursor-help items-center text-[#B6C2D1] transition-colors hover:text-[#3D8BD0]">
                                      <Info size={13} />
                                    </span>
                                  </TooltipTrigger>
                                  {/* text-wrap overrides the shared tooltip's text-balance. */}
                                  <TooltipContent className="z-[10000] max-w-[260px] text-wrap leading-relaxed">
                                    {sg.why}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </span>
                            {/* old (muted) → suggested (highlighted); blank fields show a quiet dash */}
                            <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                              <span className="min-w-0 truncate text-[12px] leading-none text-[#9CA3AF]">{sg.current || '—'}</span>
                              <ArrowRight size={12} className="flex-shrink-0 text-[#94A3B8]" />
                              <span className="flex flex-shrink-0 items-center">{sg.node}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
                      <button
                        onClick={() => setSuggestDismissed(true)}
                        className="h-9 rounded px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={applySuggestions}
                        disabled={pickedCount === 0}
                        style={{
                          background: 'linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)), linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)',
                        }}
                        className="h-9 rounded px-4 text-[13px] font-medium text-white transition-all duration-200 hover:brightness-[0.92] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
            </div>
          );
        })()}

        {showSla && hasSLAMatch() && (
        <div className="border border-[#DFE5ED] rounded-lg" ref={slaStatusRef}>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => setSlaStatusExpanded(!slaStatusExpanded)}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#364658]" />
              <h3 className="text-[13px] font-semibold text-[#364658]">SLA Status</h3>
            </div>
            <button
              className="text-[#7B8FA5] hover:text-[#364658] transition-colors"
            >
              {slaStatusExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>

          {slaStatusExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {/* Response Due In - On Track */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0 group/sla">
                  <div className="text-[12px] font-medium text-[#364658] truncate">First response</div>
                  <span className="text-[12px] font-medium text-[#364658] flex-shrink-0">{firstResponseBreached ? 'Breached' : 'Met'}</span>
                  <div className="relative">
                    <button onClick={(e) => { setSlaAnchorRect(e.currentTarget.getBoundingClientRect()); setEditingSlaRow(editingSlaRow === 'first' ? null : 'first'); }} title="Edit SLA date" className="opacity-0 group-hover/sla:opacity-100 transition-opacity p-0.5 hover:bg-[#F3F4F6] rounded flex-shrink-0"><Edit size={12} className="text-[#7B8FA5]" /></button>
                    {editingSlaRow === 'first' && <DateTimePickerPopup value={slaDates.first} anchorRect={slaAnchorRect} align="right" onApply={(d) => setSlaDates((p) => ({ ...p, first: d }))} onClose={() => setEditingSlaRow(null)} />}
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 flex-shrink-0 cursor-default ${firstResponseBreached ? 'bg-[#FFEBEE]' : 'bg-[#E8F5E9]'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" viewBox="0 0 12 16" fill="none" style={firstResponseBreached ? { transform: 'scaleY(-1)' } : undefined}>
                        <g clipPath="url(#clip0_1057_504)">
                          <path d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z" fill={firstResponseBreached ? '#E74C3C' : '#27AE60'}/>
                        </g>
                        <defs>
                          <clipPath id="clip0_1057_504">
                            <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className={`text-[12px] font-semibold ${firstResponseBreached ? 'text-[#E74C3C]' : 'text-[#27AE60]'}`}>
                        {firstResponseBreached ? (slaClosed ? '1d 4h' : '2d 6h') : (slaClosed ? '2h' : '3d 5h')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-left divide-y divide-white/15 min-w-[180px]">
                      <div className="pb-1.5">{firstResponseBreached ? 'Overdue since Thursday, February 20, 2026 at 12:30 AM' : (slaClosed ? 'Responded Thursday, February 20, 2026 at 12:30 AM' : 'Due by Thursday, February 20, 2026 at 12:30 AM')}</div>
                      <div className="py-1.5"><span className="opacity-60">Total time:</span> {slaClosed ? '5 hours' : '4 days'}</div>
                      <div className="pt-1.5"><span className="opacity-60">SLA Name:</span> P1 Critical – Response SLA</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Resolution Due In - Conditional based on ticket ID */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0 group/sla">
                  <div className="text-[12px] font-medium text-[#364658] truncate">Resolution</div>
                  <span className="text-[12px] font-medium text-[#364658] flex-shrink-0">{getSlaPenaltyAmount(ticketId) > 0 ? 'Breached' : 'Met'}</span>
                  <div className="relative">
                    <button onClick={(e) => { setSlaAnchorRect(e.currentTarget.getBoundingClientRect()); setEditingSlaRow(editingSlaRow === 'resolution' ? null : 'resolution'); }} title="Edit SLA date" className="opacity-0 group-hover/sla:opacity-100 transition-opacity p-0.5 hover:bg-[#F3F4F6] rounded flex-shrink-0"><Edit size={12} className="text-[#7B8FA5]" /></button>
                    {editingSlaRow === 'resolution' && <DateTimePickerPopup value={slaDates.resolution} anchorRect={slaAnchorRect} align="right" onApply={(d) => setSlaDates((p) => ({ ...p, resolution: d }))} onClose={() => setEditingSlaRow(null)} />}
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 flex-shrink-0 cursor-default ${
                      ticketId === 'INC-32' ? 'bg-[#E8F5E9]' : 'bg-[#FFEBEE]'
                    }`}>
                      {ticketId === 'INC-32' ? (
                        // Green hourglass for INC-32
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" viewBox="0 0 12 16" fill="none">
                          <g clipPath="url(#clip0_1057_504_inc32)">
                            <path d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z" fill="#27AE60"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_1057_504_inc32">
                              <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)"/>
                            </clipPath>
                          </defs>
                        </svg>
                      ) : (
                        // Red hourglass for other tickets
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" viewBox="0 0 12 16" fill="none" style={{ transform: 'scaleY(-1)' }}>
                          <g clipPath="url(#clip0_1057_504_red)">
                            <path d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z" fill="#E74C3C"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_1057_504_red">
                              <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)"/>
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                      <span className={`text-[12px] font-semibold ${
                        ticketId === 'INC-32' ? 'text-[#27AE60]' : 'text-[#E74C3C]'
                      }`}>
                        {slaClosed ? (getSlaPenaltyAmount(ticketId) > 0 ? '4d 6h' : '2d 4h') : (ticketId === 'INC-32' ? '4d 5h' : '1w 4d')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-left divide-y divide-white/15 min-w-[180px]">
                      <div className="pb-1.5">{slaClosed ? (getSlaPenaltyAmount(ticketId) > 0 ? 'Resolved Friday, February 27, 2026 at 03:15 PM' : 'Resolved Tuesday, February 24, 2026 at 05:30 PM') : (ticketId === 'INC-32' ? 'Due by Saturday, March 23, 2026 at 2:30 PM' : 'Due by Saturday, February 7, 2026 at 11:45 AM')}</div>
                      <div className="py-1.5"><span className="opacity-60">Total time:</span> {slaClosed ? '3 days' : '5 days'}</div>
                      <div className="pt-1.5"><span className="opacity-60">SLA Name:</span> P1 Critical – Resolution SLA</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* OLA Due In - Warning */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0 group/sla">
                  <div className="text-[12px] font-medium text-[#364658] truncate">{slaClosed ? 'OLA' : 'OLA due in'}</div>
                  {slaClosed && <span className="text-[12px] font-medium text-[#364658] flex-shrink-0">Met</span>}
                  <div className="relative">
                    <button onClick={(e) => { setSlaAnchorRect(e.currentTarget.getBoundingClientRect()); setEditingSlaRow(editingSlaRow === 'ola' ? null : 'ola'); }} title="Edit SLA date" className="opacity-0 group-hover/sla:opacity-100 transition-opacity p-0.5 hover:bg-[#F3F4F6] rounded flex-shrink-0"><Edit size={12} className="text-[#7B8FA5]" /></button>
                    {editingSlaRow === 'ola' && <DateTimePickerPopup value={slaDates.ola} anchorRect={slaAnchorRect} align="right" onApply={(d) => setSlaDates((p) => ({ ...p, ola: d }))} onClose={() => setEditingSlaRow(null)} />}
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-[#FFF3E0] rounded px-2 py-0.5 flex-shrink-0 cursor-default">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" viewBox="0 0 12 16" fill="none">
                        <g clipPath="url(#clip0_1057_504_orange)">
                          <path d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z" fill="#F39C12"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_1057_504_orange">
                            <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-[12px] font-semibold text-[#F39C12]">{slaClosed ? '5h' : '4h'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-left divide-y divide-white/15 min-w-[180px]">
                      <div className="pb-1.5">{slaClosed ? 'Met Thursday, February 20, 2026 at 04:00 PM' : 'Due by Sunday, February 15, 2026 at 4:30 PM'}</div>
                      <div className="py-1.5"><span className="opacity-60">Total time:</span> 1 week</div>
                      <div className="pt-1.5"><span className="opacity-60">SLA Name:</span> P1 Critical – OLA</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Penalty Amount — only shown when a penalty has been incurred */}
              {getSlaPenaltyAmount(ticketId) > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#364658]">Penalty</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#FFEBEE] rounded px-2 py-0.5 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-[#E74C3C]">{formatPenaltyAmount(getSlaPenaltyAmount(ticketId))}</span>
                  </div>
                </div>
              )}

              {/* SLA History Link */}
              <button
                onClick={() => setShowSLAHistory(true)}
                className="flex items-center gap-2 px-3 py-1.5 mt-2 text-[12px] text-[#3D8BD0] hover:bg-[#EBF5FF] font-medium rounded-md border border-[#DFE5ED] bg-white transition-colors w-full justify-center"
              >
                <Clock size={14} />
                SLA History
              </button>
            </div>
          )}
        </div>
        )}

        {/* Reorderable Sections */}
        {sectionOrder.map((section) => {
          if (section === 'Change Calendar') {
            return showChangeCalendar ? <MiniCalendar key="change-calendar" events={changeCalendarEvents} title={changeCalendarTitle} /> : null;
          }
          if (section === 'Ticket Fields' && projectMode) {
            return <ProjectKeyInfo key='ticket-fields' project={projectInfo} title={fieldsTitle ?? 'Key Information'} />;
          }
          if (section === 'Ticket Fields' && (hasTicketFieldsMatch() || (!!propertiesSearchQuery && (getFilteredAdditionalFields().length > 0 || 'system fields'.includes(propertiesSearchQuery.toLowerCase()))))) {
            return (
        <TicketFieldsAccordion
          key="ticket-fields"
          fieldsTitle={fieldsTitle}
          compactTicketFields={compactTicketFields}
          showProblemFields={showProblemFields}
          statusGroupLabel={statusGroupLabel}
          assetMode={assetMode}
          softwareMode={softwareMode}
          cmdbMode={cmdbMode}
          nonItMode={nonItMode}
          licenseMode={licenseMode}
          contractMode={contractMode}
          purchaseMode={purchaseMode}
          patchMode={patchMode}
          patchDeployMode={patchDeployMode}
          packageDeployMode={packageDeployMode}
          registryDeployMode={registryDeployMode}
          endpointMode={endpointMode}
          cveMode={cveMode}
          taskMode={taskMode}
          taskValues={taskKeyValues}
          onTaskValueChange={(label, value) => setTaskKeyValues((prev) => ({ ...prev, [label]: value }))}
          knowledgeMode={knowledgeMode}
          knowledgeInfo={knowledgeInfo}
          patchInfo={patchInfo}
          assetState={assetState}
          ticketFieldsExpanded={ticketFieldsExpanded}
          setTicketFieldsExpanded={setTicketFieldsExpanded}
          showMoreFields={showMoreFields}
          setShowMoreFields={setShowMoreFields}
          propertiesSearchQuery={propertiesSearchQuery}
          getFilteredAdditionalFields={getFilteredAdditionalFields}
          showMoreSystemFields={showMoreSystemFields}
          setShowMoreSystemFields={setShowMoreSystemFields}
          ticketFieldsRef={ticketFieldsRef}
          statusDropdownRef={statusDropdownRef}
          priorityDropdownRef={priorityDropdownRef}
          assigneeDropdownRef={assigneeDropdownRef}
          techGroupDropdownRef={techGroupDropdownRef}
          urgencyDropdownRef={urgencyDropdownRef}
          impactDropdownRef={impactDropdownRef}
          categoryDropdownRef={categoryDropdownRef}
          departmentDropdownRef={departmentDropdownRef}
          sourceDropdownRef={sourceDropdownRef}
          locationDropdownRef={locationDropdownRef}
          vendorDropdownRef={vendorDropdownRef}
          supportLevelDropdownRef={supportLevelDropdownRef}
          showStatusDropdown={showStatusDropdown}
          setShowStatusDropdown={setShowStatusDropdown}
          showPriorityDropdown={showPriorityDropdown}
          setShowPriorityDropdown={setShowPriorityDropdown}
          showAssigneeDropdown={showAssigneeDropdown}
          setShowAssigneeDropdown={setShowAssigneeDropdown}
          showTechGroupDropdown={showTechGroupDropdown}
          setShowTechGroupDropdown={setShowTechGroupDropdown}
          showUrgencyDropdown={showUrgencyDropdown}
          setShowUrgencyDropdown={setShowUrgencyDropdown}
          showImpactDropdown={showImpactDropdown}
          setShowImpactDropdown={setShowImpactDropdown}
          showCategoryDropdown={showCategoryDropdown}
          setShowCategoryDropdown={setShowCategoryDropdown}
          showDepartmentDropdown={showDepartmentDropdown}
          setShowDepartmentDropdown={setShowDepartmentDropdown}
          showSourceDropdown={showSourceDropdown}
          setShowSourceDropdown={setShowSourceDropdown}
          showLocationDropdown={showLocationDropdown}
          setShowLocationDropdown={setShowLocationDropdown}
          showVendorDropdown={showVendorDropdown}
          setShowVendorDropdown={setShowVendorDropdown}
          showSupportLevelDropdown={showSupportLevelDropdown}
          setShowSupportLevelDropdown={setShowSupportLevelDropdown}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          selectedAssignee={selectedAssignee}
          setSelectedAssignee={setSelectedAssignee}
          selectedTechGroup={selectedTechGroup}
          setSelectedTechGroup={setSelectedTechGroup}
          selectedUrgency={selectedUrgency}
          setSelectedUrgency={setSelectedUrgency}
          selectedImpact={selectedImpact}
          setSelectedImpact={setSelectedImpact}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          selectedSupportLevel={selectedSupportLevel}
          setSelectedSupportLevel={setSelectedSupportLevel}
          assigneeSearchQuery={assigneeSearchQuery}
          setAssigneeSearchQuery={setAssigneeSearchQuery}
          tags={tags}
          setTags={setTags}
          showTagInput={showTagInput}
          setShowTagInput={setShowTagInput}
          tagInputValue={tagInputValue}
          setTagInputValue={setTagInputValue}
          togglePinField={togglePinField}
          getFilteredTicketFields={getFilteredTicketFields}
          getCurrentStatusColor={getCurrentStatusColor}
          getCurrentPriorityColor={getCurrentPriorityColor}
          getCurrentAssigneeColor={getCurrentAssigneeColor}
          getCurrentUrgencyColor={getCurrentUrgencyColor}
          getCurrentImpactColor={getCurrentImpactColor}
          getCurrentProjectNameColor={getCurrentProjectNameColor}
          getCurrentCostCenterColor={getCurrentCostCenterColor}
          getCurrentRequestChannelColor={getCurrentRequestChannelColor}
          filteredAssigneeOptions={filteredAssigneeOptions}
          pinnedFields={pinnedFields}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          assigneeOptions={assigneeOptions}
          techGroupOptions={techGroupOptions}
          urgencyOptions={urgencyOptions}
          impactOptions={impactOptions}
          categoryOptions={categoryOptions}
          departmentOptions={departmentOptions}
          sourceOptions={sourceOptions}
          locationOptions={locationOptions}
          vendorOptions={vendorOptions}
          supportLevelOptions={supportLevelOptions}
        />
            );
          } else if (section === 'Requester Information' && assetMode) {
            // Agent Information is rendered explicitly at the top of the panel.
            return null;
          } else if (section === 'Requester Information' && hasRequesterInfoMatch()) {
            return (
        <div key="requester-info" className="border border-[#DFE5ED] rounded-lg" ref={requesterInfoRef}>
          {/* Pins under the panel's sticky search header, like the other accordions. */}
          <div className="sticky z-40 rounded-t-lg bg-white" style={{ top: 'var(--panel-header-h, 86px)' }}>
            <button
              onClick={() => setRequesterInfoExpanded(!requesterInfoExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#364658]" />
                <h3 className="text-[13px] font-semibold text-[#364658]">Requester Information</h3>
              </div>
              {requesterInfoExpanded ? (
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              ) : (
                <ChevronRight size={16} className="text-[#7B8FA5]" />
              )}
            </button>
          </div>

          {(requesterInfoExpanded || propertiesSearchQuery) && (
            <div className="px-4 pb-4">
              <div className="space-y-3">
                {/* Requester Name */}
                <div className="flex items-center gap-2">
                  <div className="size-[24px] rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: deriveRequester(requesterName).color }}>
                    {deriveRequester(requesterName).initials}
                  </div>
                  <button
                    onClick={() => onOpenRequesterProfile?.()}
                    className="text-[13px] text-[#364658] font-medium hover:text-[#3D8BD0] hover:underline transition-colors text-left"
                  >
                    {deriveRequester(requesterName).name}
                  </button>
                  {showVip && isVipRequester(deriveRequester(requesterName).name) && <VipPill size="sm" />}
                </div>

                {/* Requester Details */}
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">
                      Email
                    </div>
                    <div className="flex-1 text-[13px] font-medium text-[#364658] break-all">
                      {deriveRequester(requesterName).email}
                    </div>
                  </div>

                  {/* Logon Name */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">
                      Logon Name
                    </div>
                    <div className="flex-1 text-[13px] font-medium text-[#364658]">
                      {deriveRequester(requesterName).logonName}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">
                      Department
                    </div>
                    <div className="flex-1 text-[13px] font-medium text-[#364658]">
                      Sales
                    </div>
                  </div>

                  {/* Contact No. */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px]">
                      Contact No.
                    </div>
                    <div className="flex-1 text-[13px] font-medium text-[#364658]">
                      919624514391
                    </div>
                  </div>
                </div>

                {/* View more details link */}
                <div className="pt-1">
                  <button
                    onClick={() => onOpenRequesterProfile?.()}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#3D8BD0] hover:bg-[#EBF5FF] font-medium rounded-md border border-[#DFE5ED] bg-white transition-colors w-full justify-center"
                  >
                    <User size={14} />
                    View more details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
            );
          } else if (section === 'Additional Fields' && (!patchMode || taskMode) && !hideAdditionalFields && hasAdditionalFieldsMatch()) {
            return (
        <AdditionalFieldsAccordion
          title={additionalTitle}
          customFields={taskMode ? TASK_CUSTOM_FORM_FIELDS : undefined}
          hideBaseFields={taskMode}
          /* The expand popup shows the WHOLE record, so it needs Key Info too — the panel owns
             that state, so it hands the fields down and takes the committed values back. */
          keyInfoFields={taskMode
            ? TASK_KEY_FIELDS.map((f) => ({ ...f, value: taskKeyValues[f.label] ?? f.value }))
            /* Asset and procurement pages carry their OWN Key Information — the popup reads the
               same definition the accordion renders, so it can never show the Request page's
               fields on an asset again. */
            : (assetMode || licenseMode || contractMode || purchaseMode)
              ? assetKeyInfoFields(assetState, { software: softwareMode, nonIt: nonItMode, cmdb: cmdbMode, license: licenseMode, contract: contractMode, purchase: purchaseMode })
              : [
            { label: 'Status', value: selectedStatus, options: statusOptions },
            { label: 'Priority', value: selectedPriority, options: priorityOptions },
            { label: 'Assignee', value: selectedAssignee, options: assigneeOptions },
            { label: 'Technician Group', value: selectedTechGroup, options: techGroupOptions },
            { label: 'Urgency', value: selectedUrgency, options: urgencyOptions },
            { label: 'Impact', value: selectedImpact, options: impactOptions },
            { label: 'Category', value: selectedCategory, options: categoryOptions },
            { label: 'Department', value: selectedDepartment, options: departmentOptions },
            { label: 'Source', value: selectedSource, options: sourceOptions },
            { label: 'Location', value: selectedLocation, options: locationOptions },
            { label: 'Vendor', value: selectedVendor, options: vendorOptions },
            { label: 'Support Level', value: selectedSupportLevel, options: supportLevelOptions },
          ]}
          onKeyInfoChange={(label, value) => {
            if (taskMode) { setTaskKeyValues((prev) => ({ ...prev, [label]: value })); return; }
            if (assetMode || licenseMode || contractMode || purchaseMode) { applyAssetKeyInfo(assetState, label, value); return; }
            const setters: Record<string, (v: string) => void> = {
              'Status': setSelectedStatus,
              'Priority': setSelectedPriority,
              'Assignee': setSelectedAssignee,
              'Technician Group': setSelectedTechGroup,
              'Urgency': setSelectedUrgency,
              'Impact': setSelectedImpact,
              'Category': setSelectedCategory,
              'Department': setSelectedDepartment,
              'Source': setSelectedSource,
              'Location': setSelectedLocation,
              'Vendor': setSelectedVendor,
              'Support Level': setSelectedSupportLevel,
            };
            setters[label]?.(value);
          }}
          key="additional-fields"
          additionalFieldsExpanded={additionalFieldsExpanded}
          setAdditionalFieldsExpanded={setAdditionalFieldsExpanded}
          additionalFieldsTab={additionalFieldsTab}
          setAdditionalFieldsTab={setAdditionalFieldsTab}
          showMoreSystemFields={showMoreSystemFields}
          setShowMoreSystemFields={setShowMoreSystemFields}
          propertiesSearchQuery={propertiesSearchQuery}
          additionalFieldsRef={additionalFieldsRef}
          showProjectNameDropdown={showProjectNameDropdown}
          setShowProjectNameDropdown={setShowProjectNameDropdown}
          showCostCenterDropdown={showCostCenterDropdown}
          setShowCostCenterDropdown={setShowCostCenterDropdown}
          showBuildingDropdown={showBuildingDropdown}
          setShowBuildingDropdown={setShowBuildingDropdown}
          showRequestChannelDropdown={showRequestChannelDropdown}
          setShowRequestChannelDropdown={setShowRequestChannelDropdown}
          selectedProjectName={selectedProjectName}
          setSelectedProjectName={setSelectedProjectName}
          selectedCostCenter={selectedCostCenter}
          setSelectedCostCenter={setSelectedCostCenter}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          selectedRequestChannel={selectedRequestChannel}
          setSelectedRequestChannel={setSelectedRequestChannel}
          companyValue={companyValue}
          setCompanyValue={setCompanyValue}
          projectNameOptions={projectNameOptions}
          costCenterOptions={costCenterOptions}
          buildingOptions={buildingOptions}
          requestChannelOptions={requestChannelOptions}
          projectNameDropdownRef={projectNameDropdownRef}
          costCenterDropdownRef={costCenterDropdownRef}
          buildingDropdownRef={buildingDropdownRef}
          requestChannelDropdownRef={requestChannelDropdownRef}
          getFilteredAdditionalFormFields={getFilteredAdditionalFormFields}
          getFilteredAdditionalFields={getFilteredAdditionalFields}
          togglePinField={togglePinField}
          getCurrentProjectNameColor={getCurrentProjectNameColor}
          getCurrentCostCenterColor={getCurrentCostCenterColor}
          getCurrentRequestChannelColor={getCurrentRequestChannelColor}
          pinnedFields={pinnedFields}
          assetMode={assetMode}
          purchaseMode={purchaseMode}
          demoCustomFields={demoCustomFields || taskMode}
        />
            );
          }
          if (section === 'Scan Info' && endpointMode && (!propertiesSearchQuery || 'scan info patch scan date vulnerability scan date last reboot time'.includes(propertiesSearchQuery.toLowerCase()))) {
            return (
        <div key="scan-info" className="border border-[#DFE5ED] rounded-lg bg-white">
          <button
            onClick={() => setScanInfoExpanded(!scanInfoExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <ScanLine size={16} className="text-[#4A5568]" />
              <span className="text-[13px] font-semibold text-[#364658]">Scan Info</span>
            </div>
            {scanInfoExpanded ? <ChevronUp size={16} className="text-[#7B8FA5]" /> : <ChevronDown size={16} className="text-[#7B8FA5]" />}
          </button>
          {scanInfoExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {([
                { label: 'Patch Scan Date', value: 'Thu, Jul 23, 2026 05:28 PM', pill: 'progress' },
                { label: 'Vulnerability Scan Date', value: 'Fri, Jul 24, 2026 08:52 PM', pill: 'done' },
                { label: 'Last Reboot Time', value: 'Thu, Jul 09, 2026 03:15 PM' },
              ] as { label: string; value: string; pill?: 'progress' | 'done' }[]).map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3">
                  <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{f.label}</div>
                  <div className="flex-1 min-w-0 px-3 py-1">
                    <span className="text-[13px] text-[#364658] break-words">{f.value}</span>
                    {f.pill && (
                      <span className="mt-1.5 block">
                        <span
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium"
                          style={f.pill === 'done' ? { backgroundColor: '#ECFDF3', color: '#067647' } : { backgroundColor: '#FFF8EB', color: '#B54708' }}
                        >
                          {f.pill === 'done' ? <CheckCircle size={11} /> : <Clock size={11} />}
                          {f.pill === 'done' ? 'Completed' : 'In Progress'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
            );
          }

          /* Analytics (Knowledge page) — how the article is performing. Same accordion shell as
             the fields card; the numbers echo the listing's Feedback column and the Total Read
             KPI in the header, so panel and header always agree. */
          if (section === 'Analytics' && knowledgeMode && (!propertiesSearchQuery || 'analytics helpful not helpful total read views'.includes(propertiesSearchQuery.toLowerCase()))) {
            const helpful = knowledgeAnalytics?.helpful ?? 0;
            const notHelpful = knowledgeAnalytics?.notHelpful ?? 0;
            const totalRead = knowledgeAnalytics?.totalRead ?? 0;
            const commentCount = knowledgeAnalytics?.comments ?? 0;
            const votes = helpful + notHelpful;
            const helpfulPct = votes > 0 ? Math.round((helpful / votes) * 100) : 0;
            return (
              /* Not collapsible — static header, no chevron, always showing (matches the
                 Knowledge Properties card above it). */
              <div key="analytics" className="rounded-lg border border-[#DFE5ED] bg-white">
                <div className="flex w-full items-center gap-2 rounded-lg p-4">
                  <Activity size={16} className="text-[#4A5568]" />
                  <span className="text-[13px] font-semibold text-[#364658]">Analytics</span>
                </div>
                <div className="space-y-3 px-4 pb-4">
                  {/* Row 1 — reach: what was read, and what readers said back. The comment
                      tile is a button because the thread itself is one click away. */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2.5 rounded-lg bg-[#F5F9FD] px-3 py-3">
                      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#3D8BD0] shadow-sm"><BookOpen size={17} /></span>
                      <div className="min-w-0">
                        <div className="text-[18px] font-bold leading-none tabular-nums text-[#364658]">{totalRead.toLocaleString()}</div>
                        <div className="mt-1 text-[11px] text-[#7B8FA5]">Total Read</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenKnowledgeComments?.()}
                      disabled={!onOpenKnowledgeComments}
                      title="View all comments"
                      className="flex items-center gap-2.5 rounded-lg bg-[#F5F9FD] px-3 py-3 text-left transition-colors hover:bg-[#EAF3FB] disabled:cursor-default disabled:hover:bg-[#F5F9FD]"
                    >
                      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#3D8BD0] shadow-sm"><MessageSquare size={17} /></span>
                      <div className="min-w-0">
                        <div className="text-[18px] font-bold leading-none tabular-nums text-[#364658]">{commentCount.toLocaleString()}</div>
                        <div className="mt-1 text-[11px] text-[#7B8FA5]">Comments</div>
                      </div>
                    </button>
                  </div>

                  {/* Row 2 — feedback: Helpful vs Not Helpful with a ratio bar */}
                  <div className="rounded-lg bg-[#F8FAFC] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#067647]">
                        <ThumbsUp size={13} />
                        <span className="tabular-nums text-[14px] font-bold">{helpful.toLocaleString()}</span>
                        Helpful
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#B42318]">
                        Not Helpful
                        <span className="tabular-nums text-[14px] font-bold">{notHelpful.toLocaleString()}</span>
                        <ThumbsDown size={13} />
                      </span>
                    </div>
                    {votes > 0 ? (
                      <>
                        {/* Ratio bar — green share vs red share, hairline gap between segments */}
                        <div className="mt-2.5 flex h-2 w-full gap-px overflow-hidden rounded-full bg-[#EEF2F6]">
                          {helpful > 0 && <div className="h-full rounded-full bg-[#12B76A]" style={{ width: helpfulPct + '%' }} />}
                          {notHelpful > 0 && <div className="h-full rounded-full bg-[#F04438]" style={{ width: (100 - helpfulPct) + '%' }} />}
                        </div>
                        <div className="mt-1.5 text-[11px] text-[#7B8FA5]">{helpfulPct}% of readers found this helpful</div>
                      </>
                    ) : (
                      <div className="mt-2 text-[11px] text-[#9CA3AF]">No feedback yet</div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* System Info — always LAST, and deliberately outside the reorderable list: these fields
            are written by the platform, not chosen by the technician, so they sit below everything
            actionable and there is nothing to gain from moving them. */}
        {!compactTicketFields && !cveMode && !taskMode && !knowledgeMode && !licenseMode && !endpointMode && !patchMode && getFilteredAdditionalFields && (
          <SystemInfoAccordion
            fields={getFilteredAdditionalFields()}
            pinnedFields={pinnedFields}
            onTogglePin={togglePinField}
            assetMode={assetMode}
            purchaseMode={purchaseMode}
            searchQuery={propertiesSearchQuery}
          />
        )}

        {/* Customize Button — hidden on the Patch page (single accordion, nothing to reorder)
            and in V2 compact mode (the slim panel isn't meant to be reconfigured) */}
        {(!patchMode || endpointMode) && !compactTicketFields && (
        <div className="px-4 mx-[0px] mt-6 mb-5">
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center gap-2 text-[11px] text-[#364658] hover:text-[#3D8BD0] transition-colors group cursor-pointer"
          >
            <Settings size={14} />
            <span className="border-b border-dotted border-transparent group-hover:border-[#3D8BD0]">Customize Layout</span>
          </button>
        </div>
        )}

        {/* Separator */}
        <div className="mt-4 px-3 hidden">
          <div className="border-t border-[#E5E7EB]"></div>
        </div>

        {/* Info Section - Features Available. Hidden in V2 compact mode and on the CVE, Knowledge
            and Task pages — all of them drop the pin/search/filter affordances, so the hints
            would describe controls that are not there. */}
        {!compactTicketFields && !cveMode && !knowledgeMode && !taskMode && (
        <div className="mt-4 px-0">
          <div className="px-4 py-3 bg-[#F8F9FB] rounded-md space-y-2.5 text-[11px] text-[#7B8FA5]">
            {/* Pin hint hidden on the Patch / Patch Deployment pages — their fields are
                read-only with no pin affordance, so the hint would describe nothing. */}
            {!patchMode && (
            <div className="flex items-start gap-2">
              <PinIcon size={12} className="text-[#7B8FA5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Pin</span>
                <span> — Mark fields for easy access on top</span>
              </div>
            </div>
            )}
            <div className="flex items-start gap-2">
              <Search size={12} className="text-[#7B8FA5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Search</span>
                <span> — Find any field quickly</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Filter size={12} className="text-[#7B8FA5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Filter</span>
                <span> — Show only the fields you need</span>
              </div>
            </div>
          </div>
        </div>
        )}
          </div>
        )}

        {/* Activity and Resources Group Content */}
        {activeGroup === 'activity' && (
          <div className="space-y-3">
        {/* Work Tracker Accordion (hidden on asset/license pages; the Task page keeps it) */}
        {(!assetMode || taskMode) && hasWorkTrackerMatch() && (
        <div className="border border-[#DFE5ED] rounded-lg">
          <button
            onClick={() => setWorkTrackerExpanded(!workTrackerExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Play size={16} className="text-[#364658]" />
              <h3 className="text-[13px] font-semibold text-[#364658]">Work Tracker</h3>
            </div>
            <div className="flex items-center gap-2">
              {workTrackerExpanded && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openManualWorkLog();
                  }} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Plus size={14} className="text-white bg-[#3D8BD0] rounded w-6 h-6 p-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Add Manual Work Log</TooltipContent>
                  </Tooltip>
                </div>
              )}
              {workTrackerExpanded ? (
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              ) : (
                <ChevronRight size={16} className="text-[#7B8FA5]" />
              )}
            </div>
          </button>

          {workTrackerExpanded && (
          <div className="px-4 pb-4 relative">
            {trackerTasks.length === 0 ? (
              /* No active task — initial display + start button */
              <div className="flex items-center gap-3">
                <span className="text-[22px] font-medium text-[#364658] tabular-nums">{formatTime(0)}</span>
                <button
                  onClick={() => { setNewTaskDesc(''); setTrackerTechnician(TRACKER_TECHNICIANS[0]); setTrackerTechOpen(false); setShowTrackerPopup(true); }}
                  className="size-8 rounded-full bg-[#3D8BD0] hover:bg-[#2563EB] flex items-center justify-center transition-colors"
                  title="Start a task"
                >
                  <Play size={14} className="text-white fill-white ml-0.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trackerTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-lg border p-3 transition-colors ${t.isRunning ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#EEF1F5] bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[18px] font-medium text-[#364658] tabular-nums">{formatTime(t.elapsed)}</span>
                      <div className="flex items-center gap-2">
                        {t.isRunning ? (
                          <button onClick={() => pauseTrackerTask(t.id)} className="size-7 rounded-full bg-[#3D8BD0] hover:bg-[#2563EB] flex items-center justify-center transition-colors" title="Pause">
                            <Pause size={13} className="text-white fill-white" />
                          </button>
                        ) : (
                          <button onClick={() => playTrackerTask(t.id)} className="size-7 rounded-full bg-[#3D8BD0] hover:bg-[#2563EB] flex items-center justify-center transition-colors" title="Play">
                            <Play size={13} className="text-white fill-white ml-0.5" />
                          </button>
                        )}
                        <div className="relative">
                          <button onClick={() => setConfirmStopId(confirmStopId === t.id ? null : t.id)} className="size-7 rounded-full bg-[#E74C3C] hover:bg-[#C0392B] flex items-center justify-center transition-colors" title="Stop & log">
                            <Square size={13} className="text-white fill-white" />
                          </button>
                          {confirmStopId === t.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setConfirmStopId(null)} />
                              <div className="app-menu absolute right-0 top-full mt-2 z-50 w-[224px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg p-3">
                                <div className="absolute -top-1.5 right-2.5 size-3 bg-white border-l border-t border-[#DFE5ED] rotate-45" />
                                <p className="relative text-[12px] text-[#364658]">Are you sure, you want to stop timer?</p>
                                <div className="relative mt-2.5 flex items-center justify-end gap-2">
                                  <button onClick={() => setConfirmStopId(null)} className="px-2.5 py-1 border border-[#DFE5ED] text-[#364658] text-[12px] font-medium rounded hover:bg-[#F3F4F6] transition-colors">Cancel</button>
                                  <button onClick={() => { stopTrackerTask(t.id); setConfirmStopId(null); }} className="px-2.5 py-1 bg-[#E74C3C] text-white text-[12px] font-medium rounded hover:bg-[#C0392B] transition-colors">Stop</button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="size-6 rounded-[4px] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: t.technician?.color ?? '#3D8BD0' }}>{t.technician?.initials ?? 'AD'}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-medium text-[#364658]">{t.technician?.name ?? 'Arnav Desai'}</span>
                        <span className={`text-[11px] ${t.isRunning ? 'text-[#22A06B]' : 'text-[#7B8FA5]'}`}>{t.isRunning ? 'Running' : 'Paused'}</span>
                      </div>
                    </div>
                    {t.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#F8FAFC] border border-[#EEF1F5] cursor-default">
                            <SquareCheckBig size={13} className="text-[#7B8FA5] flex-shrink-0" />
                            <span className="text-[12px] text-[#364658] truncate min-w-0">{t.description}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px]">{t.description}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
                {/* Add another task — starting it pauses the others */}
                <button
                  onClick={() => { setNewTaskDesc(''); setTrackerTechnician(TRACKER_TECHNICIANS[0]); setTrackerTechOpen(false); setShowTrackerPopup(true); }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-[#3D8BD0] border border-[#3D8BD0] rounded-md hover:bg-[#2E6BA4] transition-colors"
                >
                  <Plus size={14} /> Add Tracker
                </button>
              </div>
            )}

            {/* Work History Link */}
            <div className="mt-2">
              <button
                onClick={() => setShowWorkHistory(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#3D8BD0] hover:bg-[#EBF5FF] font-medium rounded-md border border-[#DFE5ED] bg-white transition-colors w-full justify-center"
              >
                <Clock size={14} />
                Work History
              </button>
            </div>

            {/* New-task popup */}
            {showTrackerPopup && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]" onClick={() => setShowTrackerPopup(false)}>
                <div className="bg-white border border-[#DFE5ED] rounded-lg shadow-lg p-4 w-[400px] max-w-[90%]" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[13px] font-medium text-[#7B8FA5]">Technician <span className="text-[#EF4444]">*</span></label>
                      <div className="relative mt-1.5">
                        <button
                          type="button"
                          onClick={() => setTrackerTechOpen((o) => !o)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-md hover:border-[#3D8BD0] transition-colors"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="size-6 rounded-[4px] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: trackerTechnician.color }}>{trackerTechnician.initials}</span>
                            <span className="text-[13px] font-medium text-[#364658] truncate">{trackerTechnician.name}</span>
                          </span>
                          <ChevronDown size={16} className={`text-[#7B8FA5] flex-shrink-0 transition-transform ${trackerTechOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {trackerTechOpen && (
                          <div className="app-menu absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 z-10 max-h-[220px] overflow-y-auto">
                            {TRACKER_TECHNICIANS.map((tech) => (
                              <button
                                key={tech.name}
                                onClick={() => { setTrackerTechnician(tech); setTrackerTechOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors ${tech.name === trackerTechnician.name ? 'bg-[#EAF2FB]' : ''}`}
                              >
                                <span className="size-6 rounded-[4px] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: tech.color }}>{tech.initials}</span>
                                <span className="text-[13px] font-medium text-[#364658] truncate">{tech.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="text-[13px] font-medium text-[#7B8FA5]">Work Description</label>
                    <textarea
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Description your work here"
                      className="w-full h-24 px-3 py-2 text-[13px] text-[#364658] bg-white border border-[#E5E7EB] rounded placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                    />
                    <button
                      onClick={startNewTrackerTask}
                      className="w-full px-4 py-2 bg-[#3D8BD0] hover:bg-[#2563EB] text-white text-[13px] font-medium rounded-md transition-colors"
                    >
                      Start Timer
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
          )}
        </div>
        )}

        {/* Attachments Accordion */}
        <div id="attachments-section" className="border border-[#DFE5ED] rounded-lg">
          <button
            onClick={() => setAttachmentsExpanded(!attachmentsExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Paperclip size={16} className="text-[#364658]" />
              <h3 className="text-[13px] font-semibold text-[#364658]">Attachments</h3>
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#F3F4F6] text-[11px] font-medium text-[#364658]">
                {attachments.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {attachmentsExpanded && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle add attachment
                  }} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Plus size={14} className="text-white bg-[#3D8BD0] rounded w-6 h-6 p-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Add Attachment</TooltipContent>
                  </Tooltip>
                </div>
              )}
              {attachmentsExpanded ? (
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              ) : (
                <ChevronRight size={16} className="text-[#7B8FA5]" />
              )}
            </div>
          </button>

          {attachmentsExpanded && (
          <div className="px-4 pb-4">
            {/* Chip grid — the SAME component recipe as the description attachments
                (FileTypeBadge chip, size sub-line, hover-reveal actions). One column in
                the narrow rail, more if the panel ever widens. */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))' }}>
              {(showAllAttachments ? attachments : attachments.slice(0, 4)).map((attachment) => (
                <div
                  key={attachment.id}
                  className={`group/file relative flex items-center gap-2 rounded border px-2.5 py-1 transition-all ${
                    highlightAttachments
                      ? 'border-[#3D8BD0] bg-[#EBF5FF] shadow-sm'
                      : 'border-[#DFE5ED] bg-[#F5F7FA] hover:border-[#CBD5E1] hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setPreviewAttachment(attachment)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <FileTypeBadge name={attachment.name} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs font-medium text-[#364658]" title={attachment.name}>{attachment.name}</span>
                      <span className="truncate text-[10px] leading-tight text-[#7B8FA5]">{attachment.size} • {attachment.uploadedBy}</span>
                    </span>
                  </button>
                  <div
                    className="absolute inset-y-px right-px flex items-center gap-0.5 rounded-r pl-8 pr-1.5 opacity-0 transition-opacity group-hover/file:opacity-100"
                    style={{ background: `linear-gradient(to right, ${highlightAttachments ? 'rgba(235,245,255,0)' : 'rgba(255,255,255,0)'} 0%, ${highlightAttachments ? '#EBF5FF' : '#FFFFFF'} 42%)` }}
                  >
                    <button
                      onClick={() => toast.success(`Downloading ${attachment.name}`)}
                      className="flex size-6 items-center justify-center rounded hover:bg-[#EEF2F6]"
                      title="Download"
                    >
                      <Download className="size-3.5 text-[#7B8FA5]" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="flex size-6 items-center justify-center rounded hover:bg-[#FEF3F2]"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5 text-[#EF4444]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
                        {/* Show all / Show less button */}
            {attachments.length > 4 && (
              <div className="mt-3 pt-3 border-t border-[#F0F1F3]">
                <button
                  onClick={() => setShowAllAttachments(!showAllAttachments)}
                  className="text-[13px] text-[#3D8BD0] hover:text-[#2A6BA8] font-medium transition-colors"
                >
                  {showAllAttachments ? 'Show less' : `Show all (${attachments.length})`}
                </button>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Attachment preview popup (centered) */}
        {previewAttachment && (() => {
          const ext = (previewAttachment.name?.split('.').pop() || '').toLowerCase();
          const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
          return (
            <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewAttachment(null)} />
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#E5E7EB] flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-[#7B8FA5] flex-shrink-0" />
                    <span className="text-[14px] font-semibold text-[#364658] truncate" title={previewAttachment.name}>{previewAttachment.name}</span>
                    <span className="text-[12px] text-[#7B8FA5] flex-shrink-0">{previewAttachment.size}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="p-1.5 rounded hover:bg-[#EBF5FF] transition-colors" title="Download">
                      <Download size={16} className="text-[#3D8BD0]" />
                    </button>
                    <button onClick={() => setPreviewAttachment(null)} className="p-1.5 rounded hover:bg-[#F1F5F9] transition-colors" title="Close">
                      <X size={18} className="text-[#6B7280]" />
                    </button>
                  </div>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-auto bg-[#F1F5F9] flex items-center justify-center p-6">
                  {isImage ? (
                    <svg viewBox="0 0 640 420" className="w-full h-auto max-w-[560px] rounded-lg border border-[#E2E8F0] shadow-sm">
                      <defs>
                        <linearGradient id="attPreviewSky" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DBEAFE" />
                          <stop offset="100%" stopColor="#EFF6FF" />
                        </linearGradient>
                      </defs>
                      <rect width="640" height="420" fill="url(#attPreviewSky)" />
                      <circle cx="500" cy="100" r="44" fill="#FBBF24" />
                      <path d="M0 420 L170 210 L300 330 L430 170 L640 300 L640 420 Z" fill="#86C7A8" />
                      <path d="M0 420 L210 280 L400 380 L640 250 L640 420 Z" fill="#5FAE93" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 520 660" className="h-auto max-h-[60vh] rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
                      <rect width="520" height="660" fill="#FFFFFF" />
                      <rect x="40" y="44" width="240" height="22" rx="4" fill="#94A3B8" />
                      {Array.from({ length: 15 }).map((_, i) => (
                        <rect key={i} x="40" y={92 + i * 34} width={i % 4 === 3 ? 180 : 440} height="12" rx="3" fill="#E2E8F0" />
                      ))}
                    </svg>
                  )}
                </div>
                {/* Footer caption */}
                <div className="px-5 py-2.5 border-t border-[#E5E7EB] text-[12px] text-[#7B8FA5] flex-shrink-0">
                  {isImage ? 'Image preview' : 'Document preview'} • Uploaded by {previewAttachment.uploadedBy}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Search-hint card — dropped on the Task page: one hint for one control is noise. */}
        {!taskMode && (
        <div className="mt-6 px-4">
          <div className="p-3 bg-[#F8F9FB] rounded-md space-y-2.5 text-[11px] text-[#7B8FA5]">
            <div className="flex items-start gap-2">
              <Search size={14} className="text-[#7B8FA5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Search</span>
                <span> — Find any field quickly</span>
              </div>
            </div>
          </div>
        </div>
        )}
          </div>
        )}

        {/* Users Group Content (asset only) */}
        {activeGroup === 'users' && (
          <div className="space-y-2">
              {[
                { name: 'Karan Malhotra', initials: 'KM', color: '#6366F1', dept: 'IT Operations', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-504', disabled: true, description: 'Local user account for Karan Malhotra.' },
                { name: 'Aarav Sharma', initials: 'AS', color: '#10B981', dept: 'Sales', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-1009', disabled: false, description: 'Local user account for Aarav Sharma.' },
                { name: 'Daniel Cooper', initials: 'DC', color: '#3D8BD0', dept: 'Engineering', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-1001', disabled: false, description: 'Local user account for Daniel Cooper.' },
                { name: 'Emily Watson', initials: 'EW', color: '#F59E0B', dept: 'Marketing', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-1002', disabled: false, description: 'Local user account for Emily Watson.' },
                { name: 'Rahul Verma', initials: 'RV', color: '#EC4899', dept: 'Customer Support', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-501', disabled: true, description: 'Local user account for Rahul Verma.' },
                { name: 'Sara Williams', initials: 'SW', color: '#8B5CF6', dept: 'Finance', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-503', disabled: true, description: 'Local user account for Sara Williams.' },
                { name: 'Vikram Singh', initials: 'VS', color: '#EF4444', dept: 'Operations', accountType: 'Normal Account', domain: 'DESKTOP-7ABJPOF', sid: 'S-1-5-21-2223866533-3979566758-1394323533-500', disabled: true, description: 'Local user account for Vikram Singh.' },
              ].concat(addedMembers).map((u) => {
                const open = expandedUsers.has(u.name);
                return (
                <div key={u.name} className="group relative rounded-[10px] bg-[#F9FAFB]">
                  <div
                    onClick={() => setExpandedUsers((prev) => { const n = new Set(prev); n.has(u.name) ? n.delete(u.name) : n.add(u.name); return n; })}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="flex size-6 items-center justify-center rounded-sm text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: u.color }}>{u.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#364658] truncate">{u.name}</span>
                        {showMembers ? (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${memberRoleTint(memberRoleOf(u.name))}`}>{memberRoleOf(u.name)}</span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${u.disabled ? 'bg-[#FDECEC] text-[#DC2626]' : 'bg-[#E7F6EE] text-[#22A06B]'}`}>{u.disabled ? 'Disabled' : 'Active'}</span>
                        )}
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                          {/* Icons live in an always-rendered INVISIBLE slot (not hidden) so the
                              row height never changes on hover — no dancing cards. */}
                          <span className="invisible flex items-center gap-0.5 group-hover:visible">
                            {/* Member cards (Project page): no Edit, and the delete keeps a quiet
                                color-only hover — no gray fills darkening the card. */}
                            {!showMembers && (
                              <button title="Edit" onClick={(e) => e.stopPropagation()} className="size-6 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#3D8BD0] hover:bg-[#EBEFF3] transition-colors"><Edit size={13} /></button>
                            )}
                            <button title="Delete" onClick={(e) => { e.stopPropagation(); setAddedMembers((prev) => prev.filter((m) => m.name !== u.name)); }} className={`size-6 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#DC2626] transition-colors ${showMembers ? '' : 'hover:bg-[#FDECEC]'}`}><Trash2 size={13} /></button>
                          </span>
                          <span className="text-[#9CA3AF]">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#7B8FA5] truncate">
                        {showMembers ? (
                          (() => {
                            const m = memberMeta(u.name);
                            return <span className="tabular-nums">{m.tasksDone}/{m.tasksTotal} tasks · {m.msDone}/{m.msTotal} milestones</span>;
                          })()
                        ) : (
                          u.dept
                        )}
                      </div>
                    </div>
                  </div>
                  {open && (
                    showMembers ? (
                      (() => {
                        const m = memberMeta(u.name);
                        return (
                          <div className="px-3 pb-3 space-y-2.5 border-t border-[#EEF1F4] pt-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">Project Role</span>
                              <select
                                value={memberRoleOf(u.name)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setMemberRoles((prev) => ({ ...prev, [u.name]: e.target.value }))}
                                className="app-select h-7 min-w-0 flex-1 cursor-pointer rounded border border-[#DFE5ED] bg-white pl-2 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                              >
                                {MEMBER_ROLES.map((r) => (
                                  <option key={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                            {([['Tasks', m.tasksDone, m.tasksTotal], ['Milestones', m.msDone, m.msTotal]] as const).map(([label, done, total]) => (
                              <div key={label} className="flex items-center gap-3">
                                <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">{label}</span>
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <span className="block h-[4px] flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
                                    <span
                                      className="block h-full rounded-full"
                                      style={{ width: total ? `${(done / total) * 100}%` : '0%', backgroundColor: total && done === total ? '#16A34A' : '#3D8BD0' }}
                                    />
                                  </span>
                                  <span className="flex-shrink-0 text-[12px] tabular-nums text-[#364658]">{done}/{total}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                    <div className="px-3 pb-3 space-y-2 border-t border-[#EEF1F4] pt-2.5">
                      {[
                        ['Account Type', u.accountType],
                        ['Domain', u.domain],
                        ['Security ID', u.sid],
                        ['Description', u.description || '---'],
                      ].map(([l, v]) => (
                        <div key={l} className="flex items-start gap-3">
                          <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">{l}</span>
                          <span className={`text-[12px] flex-1 min-w-0 break-words ${v === '---' ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                    )
                  )}
                </div>
                );
              })}
            </div>
        )}

        {/* Notifications Group Content (email notifications) */}
        {activeGroup === 'notifications' && (
          <NotificationsPanel
            recordId={ticketId}
            notifications={emailNotifications}
            onSend={(email) => setEmailNotifications((prev) => [email, ...prev])}
            showSendEmail={showSendEmail}
            setShowSendEmail={setShowSendEmail}
          />
        )}

        {/* Integration Group Content (Jira — ticket page, card view, single entry) */}
        {activeGroup === 'integration' && (
          integration ? (
            (() => {
              const it = integration;
              const open = expandedIntegrations.has(it.id);
              const pri = it.priority === 'High' || it.priority === 'Urgent'
                ? 'bg-[#FDECEC] text-[#DC2626]'
                : it.priority === 'Low'
                ? 'bg-[#E7F6EE] text-[#22A06B]'
                : 'bg-[#FEF3E2] text-[#D97706]';
              return (
                <div className="group relative rounded-[10px] bg-[#F9FAFB]">
                  <div
                    onClick={() => setExpandedIntegrations((prev) => { const n = new Set(prev); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; })}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="flex size-6 items-center justify-center flex-shrink-0">
                      <svg width={18} height={18} viewBox="0 0 256 256" fill="#2684FF" xmlns="http://www.w3.org/2000/svg" aria-label="Jira">
                        <path d="M244.658 0H121.707a55.502 55.502 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.466 55.467V10.666C255.324 4.776 250.55 0 244.658 0z" />
                        <path d="M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.466 55.467h22.649v21.938c.039 30.625 24.877 55.43 55.502 55.43V71.93c0-5.891-4.776-10.667-10.667-10.667z" />
                        <path d="M122.951 122.489H0c0 30.653 24.85 55.502 55.502 55.502h22.72v21.867c.02 30.597 24.798 55.408 55.396 55.466V133.156c0-5.892-4.776-10.667-10.667-10.667z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#3D8BD0]">{it.id}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${pri}`}>{it.priority}</span>
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                          <button title="Delete" onClick={(e) => { e.stopPropagation(); setIntegration(null); }} className="hidden group-hover:flex size-6 items-center justify-center rounded text-[#7B8FA5] hover:text-[#DC2626] hover:bg-[#FDECEC] transition-colors"><Trash2 size={13} /></button>
                          <span className="text-[#9CA3AF]">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#7B8FA5] truncate">{it.subject}</div>
                    </div>
                  </div>
                  {open && (
                    <div className="px-3 pb-3 space-y-2 border-t border-[#EEF1F4] pt-2.5">
                      {[
                        ['Jira ID', it.id],
                        ['Project', it.project],
                        ['Issue Type', it.issueType],
                        ['Priority', it.priority],
                        ['Subject', it.subject],
                        ['Application', it.application],
                      ].map(([l, v]) => (
                        <div key={l} className="flex items-start gap-3">
                          <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">{l}</span>
                          <span className={`text-[12px] flex-1 min-w-0 break-words ${l === 'Jira ID' ? 'text-[#3D8BD0] font-medium' : 'text-[#364658]'}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#F3F4F6] mb-4"><Blocks size={24} className="text-[#9CA3AF]" /></div>
              <div className="text-[15px] font-semibold text-[#364658] mb-1">No Integration Yet</div>
              <div className="text-[13px] text-[#7B8FA5] mb-5 max-w-[240px]">Get started by linking a Jira issue to this record.</div>
              <button onClick={() => setShowAddIntegration(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-[#DFE5ED] rounded text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA] transition-colors">
                <Plus size={15} /> Add Integration
              </button>
            </div>
          )
        )}

        {/* Notes Group Content (asset only) */}
        {activeGroup === 'notes' && (
          <div className="space-y-3">
            {assetNotes.map((n) => (
              <div key={n.id} className="group relative bg-[#FFFBEB] rounded-[10px] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex size-6 items-center justify-center rounded-sm text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: n.color }}>{n.initials}</span>
                  <span className="text-[12px] font-medium text-[#364658]">{n.author}</span>
                  <span className="text-[11px] text-[#9CA3AF] ml-auto group-hover:mr-14 transition-[margin] duration-150">{n.time}</span>
                </div>
                {n.name && <div className="text-[13px] font-semibold text-[#364658] mb-0.5 pr-12">{n.name}</div>}
                <p className="text-[13px] text-[#364658] leading-relaxed whitespace-pre-wrap break-words">{n.text}</p>
                {/* Hover actions */}
                <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-[#FFFBEB] rounded">
                  <button onClick={() => openEditNote(n)} title="Edit" className="size-6 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#3D8BD0] hover:bg-[#FBEFC8] transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => deleteAssetNote(n.id)} title="Delete" className="size-6 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#DC2626] hover:bg-[#FDECEC] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Affected Products Group Content (Patch page only) — the OS editions (or the application)
            this patch affects. The type shows as a sub-line under each product name, matching the
            Overview tab's Affected Products preview rows. */}
        {activeGroup === 'affected-products' && (
          <div className="space-y-2">
            {/* One compact meta line — count stays prominent, language is a light trailing note */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#7B8FA5] mb-2">
              <span><span className="font-semibold text-[#364658]">{PATCH_AFFECTED_PRODUCTS.length}</span> products affected</span>
              <span className="size-1 rounded-full bg-[#CBD5E1] flex-shrink-0" />
              <span>Supported Languages: <span className="font-medium text-[#364658]">all</span></span>
            </div>
            {PATCH_AFFECTED_PRODUCTS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-[10px] bg-[#F9FAFB] px-3 py-2.5">
                <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]">
                  {p.type === 'Application' ? <AppWindow size={18} /> : <Monitor size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#364658] break-words">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-[#7B8FA5]">{p.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Details Group Content (Patch page only) — the files that make up this patch */}
        {activeGroup === 'file-details' && (
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handlePatchFileUpload} />
            {patchFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[13px] text-[#7B8FA5] mb-1">
                  <span className="font-medium text-[#364658]">{patchFiles.length}</span> {patchFiles.length === 1 ? 'file' : 'files'}
                </div>
                {patchFiles.map((f) => (
                  <div key={f.name} className="group flex items-center gap-3 rounded-[10px] bg-[#F9FAFB] px-3 py-2.5">
                    <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#364658] break-words">{f.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#7B8FA5]">
                        <span>{f.size}</span>
                        <span className="size-1 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                        <span>Language: {f.language}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => { navigator.clipboard?.writeText(f.name).catch(() => {}); toast.success('Link copied'); }} className="size-7 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#3D8BD0] hover:bg-[#F0F8FF] transition-colors"><Copy size={14} /></button>
                        </TooltipTrigger>
                        <TooltipContent>Copy link</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => toast.success(`Downloading ${f.name}`)} className="size-7 flex items-center justify-center rounded text-[#7B8FA5] hover:text-[#3D8BD0] hover:bg-[#F0F8FF] transition-colors"><Download size={14} /></button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                      {/* No delete here: a patch's files are what the vendor shipped, not
                          user attachments — copy link and download are the only actions. */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#F3F4F6] mb-4"><Files size={24} className="text-[#9CA3AF]" /></div>
                <div className="text-[15px] font-semibold text-[#364658] mb-1">No Files Yet</div>
                <div className="text-[13px] text-[#7B8FA5] mb-5 max-w-[240px]">This patch has no files attached. Upload a file to get started.</div>
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-[#DFE5ED] rounded text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA] transition-colors">
                  <Plus size={15} /> Upload File
                </button>
              </div>
            )}
          </>
        )}

        {/* AI Suggestions Group Content */}
        {activeGroup === 'suggestions' && (
          <div className="space-y-3">
        {/* Similar Requests Accordion */}
        {hasSimilarTickets() && (
        <div className="mb-3 bg-white rounded-[10px] border border-[#DFE5ED] overflow-hidden">
          <button
            onClick={() => setSimilarTicketExpanded(!similarTicketExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="flex items-center gap-2">
              <TicketIcon size={16} className="text-[#7B8FA5]" />
              <span className="text-[13px] font-semibold text-[#364658]">Similar Requests</span>
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#F3F4F6] text-[11px] font-medium text-[#364658]">
                {availableSimilarTickets.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {similarTicketExpanded ? (
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              ) : (
                <ChevronRight size={16} className="text-[#7B8FA5]" />
              )}
            </div>
          </button>

          {similarTicketExpanded && (
          <div className="px-4 pb-4">
            {/* Type filter pills */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {(['All', 'Request', 'Problem', 'Change'] as const).map((f) => {
                const count = f === 'All' ? availableSimilarTickets.length : availableSimilarTickets.filter((t) => t.type === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setSimilarFilter(f)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                      similarFilter === f
                        ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                        : 'border-[#DFE5ED] bg-white text-[#7B8FA5] hover:bg-[#F5F7FA]'
                    }`}
                  >
                    {f}
                    <span className={`text-[10px] ${similarFilter === f ? 'text-[#3D8BD0]' : 'text-[#9CA3AF]'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
{/* Similar tickets list */}
            {(
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableSimilarTickets.filter((t) => similarFilter === 'All' || t.type === similarFilter).map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 hover:bg-[#F3F5F8] transition-colors cursor-pointer relative group"
                  onMouseEnter={() => setHoveredTicketId(ticket.id)}
                  onMouseLeave={() => setHoveredTicketId(null)}
                  onClick={() => onOpenRelation?.({ id: ticket.id, type: ticket.type ?? 'Request', ticketId: ticket.id, subject: ticket.title, status: ticket.status, priority: 'Medium', assignedTo: { name: ticket.assignee } })}
                  title={onOpenRelation ? `Open ${ticket.id} in this drawer` : undefined}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#3D8BD0] mb-1">
                        {ticket.id}
                      </span>
                      <h4 className="text-[13px] font-medium text-[#364658] whitespace-nowrap">{ticket.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkTicket(ticket.id);
                        }}
                        className={`p-1.5 rounded hover:bg-[#EBF5FF] transition-all ${
                          hoveredTicketId === ticket.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        title="Link this request"
                      >
                        <Link size={14} className="text-[#3D8BD0]" />
                      </button>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0 ${
                        ticket.status === 'Resolved' 
                          ? 'bg-[#10B981]/10 text-[#10B981]' 
                          : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-[4px] flex items-center justify-center text-white text-[9px] font-semibold" style={{ backgroundColor: ticket.color }}>
                      {ticket.initials}
                    </div>
                    <span className="text-[12px] text-[#7B8FA5]">{ticket.assignee}</span>
                    <span className="text-[12px] text-[#7B8FA5]">• {ticket.match}</span>
                  </div>
                </div>
              ))}
            </div>
            )}

          </div>
          )}
        </div>
        )}

        {/* Suggested Knowledge Accordion */}
        {hasSuggestedKnowledgeMatch() && (
        <div className="border border-[#DFE5ED] rounded-lg">
          <button
            onClick={() => setSuggestedKnowledgeExpanded(!suggestedKnowledgeExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#364658]" />
              <h3 className="text-[13px] font-semibold text-[#364658]">Suggested Knowledge</h3>
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#F3F4F6] text-[11px] font-medium text-[#364658]">
                5
              </span>
            </div>
            <div className="flex items-center gap-2">
              {suggestedKnowledgeExpanded ? (
                <ChevronDown size={16} className="text-[#7B8FA5]" />
              ) : (
                <ChevronRight size={16} className="text-[#7B8FA5]" />
              )}
            </div>
          </button>

          {suggestedKnowledgeExpanded && (
          <div className="px-4 pb-4">
            {/* Knowledge Cards */}
            <div className="space-y-2">
              {/* Card 1 */}
              <div className="rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 hover:bg-[#F3F5F8] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#3D8BD0] mb-1">
                      KB-1024
                    </span>
                    <h4 className="text-[13px] font-medium text-[#364658]">SolarWinds Setup Guide</h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] flex-shrink-0">
                    Published
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-[4px] bg-[#3D8BD0] flex items-center justify-center text-white text-[9px] font-semibold">
                    SJ
                  </div>
                  <span className="text-[12px] text-[#7B8FA5]">Sarah Johnson</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 hover:bg-[#F3F5F8] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#3D8BD0] mb-1">
                      KB-892
                    </span>
                    <h4 className="text-[13px] font-medium text-[#364658]">Observability Best Practices</h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] flex-shrink-0">
                    Published
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-[4px] bg-[#8B5CF6] flex items-center justify-center text-white text-[9px] font-semibold">
                    MC
                  </div>
                  <span className="text-[12px] text-[#7B8FA5]">Michael Chen</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 hover:bg-[#F3F5F8] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#3D8BD0] mb-1">
                      KB-756
                    </span>
                    <h4 className="text-[13px] font-medium text-[#364658]">Monitoring Integration Steps</h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] flex-shrink-0">
                    Published
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-[4px] bg-[#F59E0B] flex items-center justify-center text-white text-[9px] font-semibold">
                    AD
                  </div>
                  <span className="text-[12px] text-[#7B8FA5]">Arnav Desai</span>
                </div>
              </div>
            </div>

            {/* View all Knowledge */}
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 mt-3 text-[12px] text-[#3D8BD0] hover:bg-[#EBF5FF] font-medium rounded-md border border-[#DFE5ED] bg-white transition-colors w-full justify-center"
            >
              <BookOpen size={14} />
              View all Knowledge
            </button>
          </div>
          )}
        </div>
        )}

        {/* Info Section - Features Available */}
        <div className="mt-6 px-4">
          <div className="p-3 bg-[#F8F9FB] rounded-md space-y-2.5 text-[11px] text-[#7B8FA5]">
            <div className="flex items-start gap-2">
              <Search size={14} className="text-[#7B8FA5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Search</span>
                <span> — Find any field quickly</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        )}
        </div>

        {/* AI Chatbot Group Content - Chat Messages */}
        {/* Chat History screen — replaces the thread + composer while open. Back returns to chat. */}
        {activeGroup === 'chatbot' && showChatHistory && (
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            {/* Back row */}
            <div className="flex-shrink-0 px-3 pt-1 pb-2">
              <button
                onClick={() => setShowChatHistory(false)}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6]"
              >
                <ChevronLeft size={16} className="text-[#7B8FA5]" />
                All Chats
              </button>
            </div>

            {chatHistory.length === 0 ? (
              /* Blank state — same recipe as the Notifications / Integration empty states:
                 round tinted icon badge, title, one-line explainer, single outline action. */
              <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-16">
                <div className="text-center">
                  <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[#F1F5F9]">
                    <MessageSquare className="size-7 text-[#7B8FA5]" />
                  </div>
                  <h3 className="mb-1.5 text-[15px] font-semibold text-[#364658]">No Previous Conversation</h3>
                  <p className="mx-auto mb-4 max-w-[260px] text-[13px] text-[#7B8FA5]">
                    You have not asked ServiceOps AI about this record yet. Start a chat and it will show up here.
                  </p>
                  <button
                    onClick={startNewChat}
                    className="inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-4 py-2 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]"
                  >
                    <SquarePen size={15} />
                    Start New Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {/* Grouped by recency, newest first */}
                {['Today', 'Previous 7 days', 'Previous 30 days'].map((group) => {
                  const rows = chatHistory.filter((c) => c.group === group);
                  if (!rows.length) return null;
                  return (
                    <div key={group} className="mb-3">
                      <div className="px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{group}</div>
                      <div className="space-y-0.5">
                        {rows.map((c) => (
                          /* Row is a div (not a button) so the delete control can nest legally. */
                          <div
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openChatHistory(c)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChatHistory(c); } }}
                            className="group/chat flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
                          >
                            <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] transition-colors group-hover/chat:bg-[#EBF5FF]">
                              <MessageSquare size={14} className="text-[#7B8FA5] transition-colors group-hover/chat:text-[#3D8BD0]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-[#364658]" title={c.title}>{c.title}</span>
                              <span className="block text-[11px] text-[#94A3B8]">{c.when}</span>
                            </span>
                            {/* Delete — revealed on hover/focus, keeps a fixed slot so nothing shifts */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteChatHistory(c.id, c.title); }}
                                  className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] opacity-0 transition-all hover:bg-white hover:text-[#DC2626] focus:opacity-100 group-hover/chat:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete chat</TooltipContent>
                            </Tooltip>
                            <ChevronRight size={15} className="flex-shrink-0 text-[#CBD5E1] transition-colors group-hover/chat:text-[#3D8BD0]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Footer action so a new chat is always one click away */}
                <button
                  onClick={startNewChat}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 py-2 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]"
                >
                  <SquarePen size={15} />
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        )}

        {activeGroup === 'chatbot' && !showChatHistory && (
            <div
              ref={chatScrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 pb-4"
              style={{
                background: 'linear-gradient(270deg, rgba(249, 250, 251, 0.00) 90.76%, var(--Color-Variable-Custom-ToolTip-BG, #F9FAFB) 98.45%)',
                transform: isChatbotClosing ? 'scaleY(0)' : (isChatbotOpening ? 'scaleY(0)' : 'scaleY(1)'),
                transformOrigin: 'bottom',
                opacity: isChatbotClosing ? 0 : 1,
                transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',
                overflow: isChatbotClosing ? 'hidden' : 'auto'
              }}>
              <div className="min-h-full flex flex-col justify-end space-y-6">
              {/* Welcome Screen - Show when no messages */}
              {chatMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                  {/* AI Icon */}
                  <div className="mb-6">
                    <svg width="40" height="40" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="sparkle-welcome" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4CB1FE" />
                          <stop offset="20.44%" stopColor="#731EFB" />
                          <stop offset="99.68%" stopColor="#F911E3" />
                        </linearGradient>
                      </defs>
                      <path fill="url(#sparkle-welcome)" d="M15,5h.83v.83c0,.46.37.83.83.83.46,0,.83-.37.83-.83v-.83h.83c.46,0,.83-.37.83-.83,0-.46-.37-.83-.83-.83h-.83v-.83c0-.46-.37-.83-.83-.83-.46,0-.83.37-.83.83v.83h-.83c-.46,0-.83.37-.83.83,0,.46.37.83.83.83ZM18.97,9.33l-.06-.08-.07-.08c-.16-.18-.37-.3-.6-.37h-.01s-5.11-1.32-5.11-1.32c-.14-.04-.28-.11-.38-.22-.11-.11-.18-.24-.22-.38l-1.32-5.11v-.02s-.04-.1-.04-.1c-.08-.22-.23-.42-.42-.56-.22-.16-.48-.25-.76-.25-.24,0-.47.07-.67.2l-.08.06c-.22.16-.37.4-.45.66v.02s-1.32,5.11-1.32,5.11c-.04.14-.11.28-.22.38-.08.08-.17.14-.28.18l-.11.04-5.11,1.32s-.01,0-.02,0c-.23.06-.43.19-.59.37l-.07.08c-.14.19-.23.42-.25.65v.1s0,.1,0,.1c.02.24.1.46.25.65.16.22.39.37.66.45,0,0,.01,0,.02,0l5.11,1.32c.14.04.28.11.38.22.11.11.18.24.22.38l1.32,5.11s0,.01,0,.02c.07.26.23.49.45.66.22.16.48.25.76.25.27,0,.54-.09.75-.25.22-.16.37-.4.45-.66,0,0,0-.01,0-.02l1.32-5.11c.04-.14.11-.28.22-.38.11-.11.24-.18.38-.22l5.11-1.32h.01c.26-.08.5-.23.66-.45.17-.22.25-.48.25-.76,0-.24-.07-.47-.2-.67ZM12.71,10.91c-.43.11-.83.34-1.14.65-.32.32-.54.71-.65,1.14l-.91,3.54-.91-3.54c-.11-.43-.34-.83-.65-1.14-.32-.32-.71-.54-1.14-.65l-3.54-.91,3.54-.91c.43-.11.83-.34,1.14-.65.32-.32.54-.71.65-1.14l.91-3.54.91,3.54.05.16c.12.37.33.71.61.98.32.32.71.54,1.14.65l3.54.91-3.54.91ZM4.25,14.17h-.09c0-.46-.37-.84-.83-.84-.46,0-.83.37-.83.83h-.08c-.42.05-.75.4-.75.83s.33.79.75.83h.08s0,.09,0,.09c.04.42.4.75.83.75.43,0,.79-.33.83-.75v-.08s.09,0,.09,0c.42-.04.75-.4.75-.83s-.33-.79-.75-.83Z"/>
                    </svg>
                  </div>

                  {/* Heading */}
                  <h2 className="text-[24px] font-semibold text-[#111827] text-center mb-3">
                    {selectedAssignee ? `Hello ${selectedAssignee.split(' ')[0]}, h` : 'H'}ow can we help?
                  </h2>

                  {/* Description */}
                  <p className="text-[14px] text-[#6B7280] text-center max-w-md mb-8">
                    {aiWelcome.desc}
                  </p>

                  {/* Suggested Prompts — module-aware set (see aiWelcome) */}
                  <div className="w-full max-w-lg space-y-2">
                    {aiWelcome.prompts.map((sp) => (
                      <Tooltip key={sp.label}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleQuickAction(sp.prompt)}
                            style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                            className="group w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-[#364658] text-[13px] font-medium hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200 cursor-pointer"
                          >
                            <sp.icon size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                            <span>{sp.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {sp.tip}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Greeting - Removed since AI Summary is already shown on the left side */}
              {false && chatMessages.length > 0 && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="bg-[#F9FAFB] rounded-2xl rounded-tl-sm px-4 py-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[14px] text-[#364658] font-medium flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <defs>
                          <linearGradient id="sparkle-gradient-icon" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4CB1FE" />
                            <stop offset="20.44%" stopColor="#731EFB" />
                            <stop offset="99.68%" stopColor="#F911E3" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#sparkle-gradient-icon)" d="M15,5h.83v.83c0,.46.37.83.83.83.46,0,.83-.37.83-.83v-.83h.83c.46,0,.83-.37.83-.83,0-.46-.37-.83-.83-.83h-.83v-.83c0-.46-.37-.83-.83-.83-.46,0-.83.37-.83.83v.83h-.83c-.46,0-.83.37-.83.83,0,.46.37.83.83.83ZM18.97,9.33l-.06-.08-.07-.08c-.16-.18-.37-.3-.6-.37h-.01s-5.11-1.32-5.11-1.32c-.14-.04-.28-.11-.38-.22-.11-.11-.18-.24-.22-.38l-1.32-5.11v-.02s-.04-.1-.04-.1c-.08-.22-.23-.42-.42-.56-.22-.16-.48-.25-.76-.25-.24,0-.47.07-.67.2l-.08.06c-.22.16-.37.4-.45.66v.02s-1.32,5.11-1.32,5.11c-.04.14-.11.28-.22.38-.08.08-.17.14-.28.18l-.11.04-5.11,1.32s-.01,0-.02,0c-.23.06-.43.19-.59.37l-.07.08c-.14.19-.23.42-.25.65v.1s0,.1,0,.1c.02.24.1.46.25.65.16.22.39.37.66.45,0,0,.01,0,.02,0l5.11,1.32c.14.04.28.11.38.22.11.11.18.24.22.38l1.32,5.11s0,.01,0,.02c.07.26.23.49.45.66.22.16.48.25.76.25.27,0,.54-.09.75-.25.22-.16.37-.4.45-.66,0,0,0-.01,0-.02l1.32-5.11c.04-.14.11-.28.22-.38.11-.11.24-.18.38-.22l5.11-1.32h.01c.26-.08.5-.23.66-.45.17-.22.25-.48.25-.76,0-.24-.07-.47-.2-.67ZM12.71,10.91c-.43.11-.83.34-1.14.65-.32.32-.54.71-.65,1.14l-.91,3.54-.91-3.54c-.11-.43-.34-.83-.65-1.14-.32-.32-.71-.54-1.14-.65l-3.54-.91,3.54-.91c.43-.11.83-.34,1.14-.65.32-.32.54-.71.65-1.14l.91-3.54.91,3.54.05.16c.12.37.33.71.61.98.32.32.71.54,1.14.65l3.54.91-3.54.91ZM4.25,14.17h-.09c0-.46-.37-.84-.83-.84-.46,0-.83.37-.83.83h-.08c-.42.05-.75.4-.75.83s.33.79.75.83h.08s0,.09,0,.09c.04.42.4.75.83.75.43,0,.79-.33.83-.75v-.08s.09,0,.09,0c.42-.04.75-.4.75-.83s-.33-.79-.75-.83Z"/>
                      </svg>
                        {isRegeneratingSummary ? 'Generating Summary...' : 'AI Summary'}
                      </p>
                      {onboardingStep !== 2 ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowAISummaryMenu(!showAISummaryMenu)}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          <MoreVertical size={16} className="text-[#7B8FA5]" />
                        </button>
                        
                        {showAISummaryMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-[100]"
                              onClick={() => setShowAISummaryMenu(false)}
                            />
                            <div className="app-menu absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[101]">
                              <button 
                                onClick={() => {
                                  onChatbotAddAsNote?.(aiSummaryContent);
                                  setShowAISummaryMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F9FAFB] flex items-center gap-2"
                              >
                                <StickyNote size={14} className="text-[#7B8FA5]" />
                                Add as Note
                              </button>
                              <button 
                                onClick={() => {
                                  onChatbotAddAsCollaborate?.(aiSummaryContent);
                                  setShowAISummaryMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F9FAFB] flex items-center gap-2"
                              >
                                <Users size={14} className="text-[#7B8FA5]" />
                                Add as Collaborate
                              </button>
                              <div className="my-1 h-px bg-[#E5E7EB]"></div>
                              <button 
                                onClick={() => {
                                  onChatbotReply?.(aiSummaryContent);
                                  setShowAISummaryMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F9FAFB] flex items-center gap-2"
                              >
                                <CornerUpRight size={14} className="text-[#7B8FA5]" />
                                Reply
                              </button>
                              <button 
                                onClick={() => {
                                  onChatbotForward?.(aiSummaryContent);
                                  setShowAISummaryMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F9FAFB] flex items-center gap-2"
                              >
                                <Mail size={14} className="text-[#7B8FA5]" />
                                Forward
                              </button>
                              <div className="my-1 h-px bg-[#E5E7EB]"></div>
                              <button className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F9FAFB] flex items-center gap-2">
                                <Copy size={14} className="text-[#7B8FA5]" />
                                Copy
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      ) : (
                        <button
                          onClick={() => {
                            const textarea = document.createElement('textarea');
                            textarea.value = 'User is experiencing critical login issues with the main portal. The account appears to be locked after multiple failed attempts. Priority escalation recommended due to business impact.\n\nKey Points:\n- Account locked after multiple failed login attempts\n- Critical business impact requiring priority escalation\n- Reset authentication credentials and verify account status';
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                          }}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Copy"
                        >
                          <Copy size={16} className="text-[#7B8FA5]" />
                        </button>
                      )}
                    </div>
                    {isRegeneratingSummary ? (
                      /* Loading State with Gradient Animation */
                      <div className="p-1">
                        {/* Animated gradient lines */}
                        <div className="space-y-3">
                          <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'linear-gradient(90deg, rgba(61,139,208,0.1) 0%, rgba(108,229,232,0.2) 50%, rgba(28,229,177,0.1) 100%)' }}>
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite',
                              }}
                            />
                          </div>
                          <div className="h-2 rounded-full overflow-hidden relative w-3/4" style={{ background: 'linear-gradient(90deg, rgba(61,139,208,0.1) 0%, rgba(108,229,232,0.2) 50%, rgba(28,229,177,0.1) 100%)' }}>
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite 0.3s',
                              }}
                            />
                          </div>
                          <div className="h-2 rounded-full overflow-hidden relative w-5/6" style={{ background: 'linear-gradient(90deg, rgba(61,139,208,0.1) 0%, rgba(108,229,232,0.2) 50%, rgba(28,229,177,0.1) 100%)' }}>
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite 0.6s',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[13px] text-[#364658] leading-relaxed mb-3 ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '0ms' } : {}}>
                          {ticketId === 'INC-35' ? (
                            'Employee requesting Apple MacBook Pro 16-inch allocation due to performance limitations of current laptop. Required for software development tasks involving resource-intensive tools, virtual machines, and cross-platform projects.'
                          ) : ticketId === 'INC-32' ? (
                            'User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.'
                          ) : (
                            'User is experiencing critical login issues with the main portal. The account appears to be locked after multiple failed attempts. Priority escalation recommended due to business impact.'
                          )}
                        </p>

                        {/* Key Points */}
                        <div className={`space-y-2 ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '200ms' } : {}}>
                          <h4 className="text-[12px] font-semibold text-[#7B8FA5] uppercase tracking-wide">
                            Key Points
                          </h4>
                          <ul className="space-y-1.5">
                            {ticketId === 'INC-35' ? (
                              <>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '400ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Senior Software Developer role requires high-performance device</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '500ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Current laptop unable to handle Docker containers and multiple IDEs</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '600ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>MacBook Pro 16-inch needed with standard development licenses</span>
                                </li>
                              </>
                            ) : ticketId === 'INC-32' ? (
                              <>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '400ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>No internet access despite Wi-Fi showing as connected</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '500ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Impacting ability to access emails and cloud applications</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '600ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Requires network diagnostics and connectivity troubleshooting</span>
                                </li>
                              </>
                            ) : (
                              <>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '400ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Account locked after multiple failed login attempts</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '500ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Critical business impact requiring priority escalation</span>
                                </li>
                                <li className={`flex items-start gap-2 text-[13px] text-[#364658] ${onboardingStep === 2 ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 ? { animationDelay: '600ms' } : {}}>
                                  <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                                  <span>Reset authentication credentials and verify account status</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Regenerate AI Summary Notification - Hidden during onboarding */}
                    {onboardingStep !== 2 && (hasNewConversations ? (
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-[#EBF5FF] border border-[#B8DCFF] rounded-lg">
                        <p className="text-[12px] text-[#364658] flex-1">
                          New conversations have been added
                        </p>
                        <button 
                          onClick={() => {
                            setIsRegeneratingSummary(true);
                            setTimeout(() => {
                              setIsRegeneratingSummary(false);
                              setHasNewConversations(false);
                            }, 2500);
                          }}
                          disabled={isRegeneratingSummary}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#3D8BD0] rounded hover:bg-[#F9FAFB] transition-all text-[11px] text-[#3D8BD0] font-medium flex-shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <RefreshCw size={12} className={`text-[#3D8BD0] ${isRegeneratingSummary ? 'animate-spin' : ''}`} />
                          {isRegeneratingSummary ? 'Generating Summary...' : 'Regenerate'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-end">
                        <button 
                          onClick={() => {
                            setIsRegeneratingSummary(true);
                            setTimeout(() => {
                              setIsRegeneratingSummary(false);
                            }, 2500);
                          }}
                          disabled={isRegeneratingSummary}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded hover:border-[#3D8BD0] hover:bg-[#F9FAFB] transition-all text-[11px] text-[#7B8FA5] hover:text-[#3D8BD0] font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <RefreshCw size={12} className={isRegeneratingSummary ? 'animate-spin' : ''} />
                          {isRegeneratingSummary ? 'Generating Summary...' : 'Regenerate summary'}
                        </button>
                      </div>
                    ))}

                    {/* Action Buttons */}
                    {onboardingStep !== 2 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(aiSummaryContent);
                        }}
                        className="px-2 py-1 bg-white border border-[#E5E7EB] rounded hover:border-[#3D8BD0] hover:bg-[#F9FAFB] transition-all text-[11px] text-[#364658] font-medium flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        <Copy size={11} className="text-[#7B8FA5]" />
                      </button>
                      <button 
                        onClick={() => onChatbotAddAsNote?.(aiSummaryContent)}
                        className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded hover:border-[#3D8BD0] hover:bg-[#F9FAFB] transition-all text-[11px] text-[#364658] font-medium flex items-center gap-1"
                      >
                        <StickyNote size={11} className="text-[#7B8FA5]" />
                        Add as Note
                      </button>
                    </div>
                    ) : showOnboardingSummaryContent && (
                      <div className="mt-3 flex items-center gap-2 animate-slide-up" style={{ animationDelay: '800ms' }}>
                        <button
                          onClick={() => {
                            const textarea = document.createElement('textarea');
                            textarea.value = 'User is experiencing critical login issues with the main portal. The account appears to be locked after multiple failed attempts. Priority escalation recommended due to business impact.\n\nKey Points:\n- Account locked after multiple failed login attempts\n- Critical business impact requiring priority escalation\n- Reset authentication credentials and verify account status';
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                          }}
                          className="p-1.5 hover:bg-white rounded transition-colors border border-[#E5E7EB] hover:border-[#3D8BD0]"
                          title="Copy"
                        >
                          <Copy size={14} className="text-[#7B8FA5]" />
                        </button>
                        <button 
                          onClick={() => onChatbotAddAsNote?.(aiSummaryContent)}
                          className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded hover:border-[#3D8BD0] hover:bg-[#F9FAFB] transition-all text-[11px] text-[#364658] font-medium flex items-center gap-1.5"
                        >
                          <StickyNote size={12} className="text-[#7B8FA5]" />
                          Add as Note
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Chat Messages */}
              {chatMessages.map((message) => (
                message.isUser ? (
                  // User Messages (right side)
                  <div key={message.id} className="flex gap-3 justify-end">
                    <div className="flex-1 max-w-[80%]">
                      <div className="rounded-lg rounded-bl-sm px-4 py-3" style={{ background: 'rgba(223, 229, 237, 0.40)' }}>
                        <p className="text-[13px] text-[#364658] leading-relaxed">
                          {renderMarkdown(message.text)}
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7B8FA5] mt-1 text-right">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ) : message.followUpActions ? (
                  // Follow-up Actions (now hidden - shown above input instead)
                  null
                ) : (
                  // AI Messages (left side)
                  <div key={message.id} className="flex gap-3">
                    <Sparkles size={16} className="text-[#3D8BD0] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="rounded-2xl rounded-tl-sm">
                        <p className="text-[13px] text-[#364658] leading-relaxed whitespace-pre-wrap">
                          {message.isTyping ? renderMarkdown(message.displayedText || '') : renderMarkdown(message.text)}
                          {message.isTyping && <span className="inline-block w-1 h-4 bg-[#3D8BD0] ml-0.5 animate-pulse"></span>}
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7B8FA5] mt-1">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                )
              ))}
              </div>
            </div>
        )}

        {/* AI Chatbot Group Content - Input Footer */}
        {activeGroup === 'chatbot' && !showChatHistory && (
            <>
            {/* Fade effect for scrolling */}
            <div 
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: '-40px',
                height: '40px',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
                zIndex: 1,
                opacity: isChatbotClosing ? 0 : 1,
                transition: 'opacity 0.4s ease-out'
              }}
            />
            <div
              className="flex-shrink-0 p-4 relative"
              style={{
                background: 'linear-gradient(270deg, rgba(249, 250, 251, 0.00) 90.76%, var(--Color-Variable-Custom-ToolTip-BG, #F9FAFB) 98.45%)',
                transform: isChatbotClosing ? 'scaleY(0)' : (isChatbotOpening ? 'scaleY(0)' : 'scaleY(1)'),
                transformOrigin: 'bottom',
                opacity: isChatbotClosing ? 0 : 1,
                transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',
                overflow: 'hidden'
              }}>
              {/* Fade effect for scrolling */}
              <div 
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: '-40px',
                  height: '40px',
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
                  zIndex: 1,
                }}
              />
              
              {/* Quick AI Actions - Show in welcome screen or when there are messages and no typing is happening and no follow-up actions */}
              {(chatMessages.length === 0 || (chatMessages.length > 0 && !chatMessages.some(msg => msg.isTyping) && !chatMessages.some(msg => msg.followUpActions))) && (onboardingStep !== 2 || showOnboardingQuickActions) && (
              <div className={`mb-3 ${chatMessages.length === 0 ? 'hidden' : ''} ${onboardingStep === 2 && showOnboardingQuickActions ? 'animate-slide-up' : ''}`} style={onboardingStep === 2 && showOnboardingQuickActions ? { animationDelay: '1000ms' } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#7B8FA5] uppercase tracking-wide">Quick AI Actions</span>
                </div>

                {/* Scrollable Pills Container */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 py-1 px-1">
                    {/* AI Summary */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Show AI Summary')}
                        >
                          <span>AI Summary</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {assetMode ? 'Show AI-generated summary of this asset' : 'Show AI-generated summary of this request'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Find Similar Requests */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Find Similar Requests')}
                        >
                          <span>{assetMode ? 'Find Similar Assets' : 'Find Similar Requests'}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {assetMode ? 'Search for similar assets in the inventory' : 'Search for similar requests in the system'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Suggest KB Article */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Suggest KB')}
                        >
                          <span>Suggest KB</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Find relevant knowledge base articles
                      </TooltipContent>
                    </Tooltip>

                    {/* Next Best Action */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Next Action')}
                        >
                          <Zap size={13} className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-200" />
                          <span>Next Action</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Get AI-powered recommendations for next steps
                      </TooltipContent>
                    </Tooltip>

                    {/* Root Cause Hint */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Root Cause')}
                        >
                          <span>Root Cause</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Analyze potential root causes
                      </TooltipContent>
                    </Tooltip>

                    {/* Draft Reply */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                          onClick={() => handleQuickAction('Draft Reply')}
                        >
                          <span>Draft Reply</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Generate a draft response for the requester
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              )}

              {/* Suggested Next Actions - Show when there are follow-up actions and no typing */}
              {chatMessages.length > 0 && !chatMessages.some(msg => msg.isTyping) && chatMessages.some(msg => msg.followUpActions) && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#7B8FA5] uppercase tracking-wide">Suggested Next Actions</span>
                </div>

                {/* Scrollable Pills Container */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 py-1 px-1">
                    {(() => {
                      const lastFollowUpMessage = chatMessages.slice().reverse().find(msg => msg.followUpActions);
                      const followUpActions = lastFollowUpMessage?.followUpActions || [];

                      return followUpActions.map((action, idx) => {
                        /* The pills are text-only — everything here is AI-suggested, so an icon
                           per action added decoration rather than meaning. The hover tooltip still
                           explains what each one will do. */
                        const getActionTooltip = (actionText: string) => {
                          const t = actionText.toLowerCase();
                          if (t.includes('unlock') || t.includes('account')) return 'Unlock user account and restore access';
                          if (t.includes('reset') || t.includes('password')) return 'Send password reset link to user';
                          if (t.includes('2fa') || t.includes('security')) return 'Enable two-factor authentication';
                          if (t.includes('view') || t.includes('ticket') || t.includes('details')) return 'View detailed request information';
                          if (t.includes('apply') || t.includes('solution')) return 'Apply recommended solution';
                          if (t.includes('kb') || t.includes('article') || t.includes('open')) return 'Open knowledge base article';
                          if (t.includes('send') || t.includes('reply')) return 'Send reply to requester';
                          if (t.includes('edit') || t.includes('draft')) return 'Edit draft response';
                          if (t.includes('add') || t.includes('note') || t.includes('template')) return 'Add to notes or templates';
                          if (t.includes('compare') || t.includes('resolution')) return 'Compare resolution approaches';
                          if (t.includes('start') || t.includes('implement')) return 'Start implementing solution';
                          if (t.includes('tips') || t.includes('policy')) return 'View recommendations and tips';
                          return actionText;
                        };

                        const tooltip = getActionTooltip(action);

                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <button
                                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.08) 0%, rgba(115, 30, 251, 0.08) 41.49%, rgba(249, 17, 227, 0.08) 100%), var(--Core-White, #FFF)' }}
                                className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                                onClick={() => {
                                  // Add user message and simulate clicking the action
                                  const userMessage = {
                                    id: Date.now(),
                                    text: action,
                                    isUser: true,
                                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                  };
                                  setChatMessages(prev => [...prev, userMessage]);

                                  // Simulate AI response
                                  setTimeout(() => {
                                    const aiMessage = {
                                      id: Date.now() + 1,
                                      text: '',
                                      fullText: `I'm processing your request to "${action}". This action has been initiated and I'll provide you with the results shortly. Would you like me to proceed with any additional steps?`,
                                      displayedText: '',
                                      isUser: false,
                                      isTyping: true,
                                      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    };
                                    setChatMessages(prev => [...prev, aiMessage]);
                                  }, 500);
                                }}
                              >
                                <span>{action}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {tooltip}
                            </TooltipContent>
                          </Tooltip>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              )}

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E5E7EB] focus-within:border-[#3D8BD0] transition-colors shadow-sm">
                <button className="p-1.5 hover:bg-white rounded transition-colors">
                  <Paperclip size={16} className="text-[#7B8FA5]" />
                </button>
                
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  ref={chatInputRef}
                  className="flex-1 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] bg-transparent border-none outline-none"
                />
                <button 
                  onClick={handleSendMessage}
                  className="p-1.5 bg-[#3D8BD0] hover:bg-[#2B7AB8] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!chatInput.trim()}
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
            </>
        )}

        {/* Ask AI Block - Always at Bottom */}
        <div
          className={`flex-shrink-0 relative ${activeGroup === 'chatbot' ? '' : 'px-4 pb-3 pt-3 bg-white'}`}
          data-onboarding="ai-prompt-box"
        >
          {/* Gradient Fade Overlay at Top */}
          {activeGroup !== 'chatbot' && (
            <div 
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: '-40px',
                height: '40px',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
                zIndex: 1,
              }}
            />
          )}
          
          <div 
            className="flex items-center gap-2 p-2.5 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
              border: '2px solid transparent',
              display: activeGroup === 'chatbot' ? 'none' : 'flex',
            }}
            onClick={() => {
              if (activeGroup !== 'chatbot') {
                setPreviousGroup(activeGroup as 'properties' | 'activity' | 'suggestions');
                setActiveGroup('chatbot');
                setIsChatbotOpening(true);

                // Trigger animation after elements mount
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setIsChatbotOpening(false);
                  });
                });
              }
            }}
          >
            <Sparkles size={16} className="text-[#7B4EFB] flex-shrink-0" />
            <input
              type="text"
              placeholder="Ask AI for insights, summaries, and actions..."
              className="flex-1 text-sm text-[#364658] placeholder:text-[#7B8FA5] bg-transparent border-none outline-none cursor-pointer"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Vertical Group Icon Panel */}
      <div className="flex flex-col items-center justify-start bg-[#F8F9FB] py-4 px-2 gap-3 border-l border-[#DFE5ED] flex-shrink-0" data-onboarding="right-sidebar">
        {/* ServiceOps AI Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
          </TooltipTrigger>
          <TooltipContent>ServiceOps AI</TooltipContent>
        </Tooltip>

        {/* Group 1: Request Properties Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('properties');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all ${
                activeGroup === 'properties'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              <FileText size={16} className={activeGroup === 'properties' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{propertiesTitle ?? (assetMode ? 'Asset Properties' : 'Request Properties')}</TooltipContent>
        </Tooltip>

        {/* Members group (Project page) — the asset Users panel, directly under Properties. */}
        {showMembers && !assetMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isAccordionCollapsed) {
                    expandAccordion();
                  }
                  setActiveGroup('users');
                }}
                className={`size-8 flex items-center justify-center rounded border transition-all ${
                  activeGroup === 'users'
                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                    : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
                }`}
              >
                <Users size={16} className={activeGroup === 'users' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>
        )}

        {/* Asset-only groups: Users + Notes (ordered between Properties and Activity) */}
        {assetMode && (
        <>
          {/* Users group — hidden on software assets */}
          {!softwareMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isAccordionCollapsed) {
                    expandAccordion();
                  }
                  setActiveGroup('users');
                }}
                className={`size-8 flex items-center justify-center rounded border transition-all ${
                  activeGroup === 'users'
                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                    : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
                }`}
              >
                <Users size={16} className={activeGroup === 'users' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Users</TooltipContent>
          </Tooltip>
          )}

          {/* Notes — hidden on the Patch page (replaced by Affected Products below); the
              ENDPOINT page brings it back like the hardware asset page. */}
          {!contractMode && (!patchMode || endpointMode) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isAccordionCollapsed) {
                    expandAccordion();
                  }
                  setActiveGroup('notes');
                }}
                className={`size-8 flex items-center justify-center rounded border transition-all ${
                  activeGroup === 'notes'
                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                    : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
                }`}
              >
                <StickyNote size={16} className={activeGroup === 'notes' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Notes</TooltipContent>
          </Tooltip>
          )}

          {/* Affected Products — Patch page only (replaces Notes; deployment/endpoint/task pages drop it) */}
          {patchMode && !patchDeployMode && !endpointMode && !cveMode && !taskMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (isAccordionCollapsed) {
                    expandAccordion();
                  }
                  setActiveGroup('affected-products');
                }}
                className={`size-8 flex items-center justify-center rounded border transition-all ${
                  activeGroup === 'affected-products'
                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                    : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
                }`}
              >
                <Layers size={16} className={activeGroup === 'affected-products' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Affected Products</TooltipContent>
          </Tooltip>
          )}
        </>
        )}

        {/* Group 2: Activity/Attachments Icon — hidden on the Patch page (replaced by File Details), but the Task page keeps the ticket version */}
        {(!patchMode || taskMode) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('activity');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all ${
                activeGroup === 'activity'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              {assetMode && !taskMode
                ? <Paperclip size={16} className={activeGroup === 'activity' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
                : <Activity size={16} className={activeGroup === 'activity' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{assetMode && !taskMode ? 'Attachments' : 'Activity and Resources'}</TooltipContent>
        </Tooltip>
        )}

        {/* File Details — Patch page only (replaces Attachments; deployment/endpoint/task pages drop it) */}
        {patchMode && !patchDeployMode && !endpointMode && !cveMode && !taskMode && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('file-details');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all ${
                activeGroup === 'file-details'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              <Files size={16} className={activeGroup === 'file-details' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>File Details</TooltipContent>
        </Tooltip>
        )}

        {/* Group 3: AI Suggestions Icon (hidden for hardware assets + projects) */}
        {!assetMode && !hideSuggestions && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('suggestions');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all relative ${
                activeGroup === 'suggestions'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              <Lightbulb size={16} className={activeGroup === 'suggestions' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
              {/* Notification dot for AI suggestions */}
              {(hasSimilarTickets() || hasSuggestedKnowledgeMatch()) && activeGroup !== 'suggestions' && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#3D8BD0]"></span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>AI Suggestions</TooltipContent>
        </Tooltip>
        )}

        {/* Notifications group (ticket/problem/change/release/contract/purchase) — last icon */}
        {showNotifications && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('notifications');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all relative ${
                activeGroup === 'notifications'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeGroup === 'notifications' ? 'text-[#3D8BD0]' : 'text-[#364658]'}
              >
                <path d="M21 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11" />
                <path d="m2 7 8.4 5.6a2 2 0 0 0 2.2 0L21 7" />
                <path d="M16 19h6" />
                <path d="m19 16 3 3-3 3" />
              </svg>
              {emailNotifications.length > 0 && activeGroup !== 'notifications' && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#3D8BD0]"></span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        )}
        {showIntegration && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isAccordionCollapsed) {
                  expandAccordion();
                }
                setActiveGroup('integration');
              }}
              className={`size-8 flex items-center justify-center rounded border transition-all relative ${
                activeGroup === 'integration'
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658]'
              }`}
            >
              <Blocks size={16} className={activeGroup === 'integration' ? 'text-[#3D8BD0]' : 'text-[#364658]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Integration</TooltipContent>
        </Tooltip>
        )}
        {/* Keyboard shortcuts — pinned at the bottom of the rail; opens the cheat-sheet
            (handled by DrawerShortcuts via a custom event). Plain rail styling, no shadow. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-drawer-shortcuts'))}
              className="mt-auto size-8 flex items-center justify-center rounded border border-[#DFE5ED] bg-white hover:bg-[#F9FAFB] hover:border-[#3D8BD0] text-[#364658] transition-all"
            >
              <Keyboard size={16} className="text-[#364658]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts (Shift + ?)</TooltipContent>
        </Tooltip>
      </div>

      {/* Knowledge Base — side drawer (opened from "View all Knowledge") */}
      <KnowledgeBaseModal isOpen={showKnowledgeModal} onClose={() => setShowKnowledgeModal(false)} />

      {/* Add Integration — side drawer (Jira, ticket page) */}
      {showAddIntegration && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[10000] transition-opacity duration-300" onClick={() => setShowAddIntegration(false)} />
          <div className="fixed top-0 right-0 h-full w-[460px] max-w-[92vw] bg-white shadow-2xl z-[10001] flex flex-col transition-transform duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
              <h2 className="text-[18px] font-semibold text-[#3D8BD0]">Add Integration</h2>
              <button onClick={() => setShowAddIntegration(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">Subject</label>
                <input
                  type="text"
                  value={intgSubject}
                  onChange={(e) => setIntgSubject(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#7B8FA5] mb-1">Description</label>
                <p className="text-[13px] text-[#364658]">Unable to create a KB article.</p>
              </div>
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">Project <span className="text-[#DC2626]">*</span></label>
                <select value={intgProject} onChange={(e) => setIntgProject(e.target.value)} className="app-select w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent">
                  {['JIRA-TESTING', 'Service Desk', 'Infrastructure', 'Product Backlog'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">Issue Type <span className="text-[#DC2626]">*</span></label>
                <select value={intgIssueType} onChange={(e) => setIntgIssueType(e.target.value)} className="app-select w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent">
                  {['Bug', 'Task', 'Story', 'Incident', 'Epic'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">Priority <span className="text-[#DC2626]">*</span></label>
                <select value={intgPriority} onChange={(e) => setIntgPriority(e.target.value)} className="app-select w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent">
                  {['Low', 'Medium', 'High', 'Urgent'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
              <button onClick={saveIntegration} disabled={!intgSubject.trim()} className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Add</button>
              <button onClick={() => setShowAddIntegration(false)} className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors">Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Add Note — side drawer (asset Notes group) */}
      {showAddNote && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-[10000] transition-opacity duration-300"
            onClick={cancelAddNote}
          />
          {/* Side Drawer */}
          <div
            className="fixed top-0 right-0 h-full w-[460px] max-w-[92vw] bg-white shadow-2xl z-[10001] flex flex-col transition-transform duration-300"
            style={{ transform: showAddNote ? 'translateX(0)' : 'translateX(100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
              <h2 className="text-[18px] font-semibold text-[#111827]">{editingNoteId != null ? 'Edit Note' : 'Add Note'}</h2>
              <button onClick={cancelAddNote} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#364658] mb-1.5">
                  Description <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full min-h-[110px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded resize-y placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                />
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
              <button
                onClick={saveAssetNote}
                disabled={!noteName.trim() || !noteDesc.trim()}
                className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingNoteId != null ? 'Save' : 'Add'}
              </button>
              <button
                onClick={cancelAddNote}
                className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add User — side drawer (asset Users group) */}
      {showAddMembers && (
        <AddMembersPanel
          existingNames={[
            'Karan Malhotra', 'Aarav Sharma', 'Daniel Cooper', 'Emily Watson', 'Rahul Verma', 'Sara Williams', 'Vikram Singh',
            ...addedMembers.map((m) => m.name),
          ]}
          onClose={() => setShowAddMembers(false)}
          onAdd={(users: DirectoryUser[]) =>
            setAddedMembers((prev) => [
              ...prev,
              ...users.map((u) => ({
                name: u.name,
                initials: memberInitials(u.name),
                color: memberAvatarColor(u.name),
                dept: u.dept,
                accountType: 'Normal Account',
                domain: 'MOTADATA',
                sid: `S-1-5-21-2223866533-3979566758-1394323533-${1100 + [...u.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 800}`,
                disabled: false,
                description: `Project member — ${u.dept}.`,
              })),
            ])
          }
        />
      )}
      {showAddUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[10000]" onClick={cancelAddUser} />
          <div className="fixed top-0 right-0 h-full w-[680px] max-w-[94vw] bg-white shadow-2xl z-[10001] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
              <h2 className="text-[18px] font-semibold text-[#111827]">Add User</h2>
              <button onClick={cancelAddUser} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">User Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                    placeholder="User Name"
                    className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Account Type</label>
                  <select
                    value={newUser.accountType}
                    onChange={(e) => setNewUser((u) => ({ ...u, accountType: e.target.value }))}
                    className={`app-select w-full px-3 py-2 text-[13px] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent ${newUser.accountType ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}
                  >
                    <option value="">Select</option>
                    <option>Normal Account</option>
                    <option>Administrator Account</option>
                    <option>Service Account</option>
                    <option>Guest Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Domain</label>
                  <input
                    type="text"
                    value={newUser.domain}
                    onChange={(e) => setNewUser((u) => ({ ...u, domain: e.target.value }))}
                    placeholder="Domain"
                    className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Disabled</label>
                  <select
                    value={newUser.disabled}
                    onChange={(e) => setNewUser((u) => ({ ...u, disabled: e.target.value }))}
                    className={`app-select w-full px-3 py-2 text-[13px] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent ${newUser.disabled ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}
                  >
                    <option value="">Select</option>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Security ID</label>
                  <input
                    type="text"
                    value={newUser.sid}
                    onChange={(e) => setNewUser((u) => ({ ...u, sid: e.target.value }))}
                    placeholder="Security ID"
                    className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#364658] mb-1.5">Description</label>
                  <textarea
                    value={newUser.description}
                    onChange={(e) => setNewUser((u) => ({ ...u, description: e.target.value }))}
                    placeholder="Description"
                    className="w-full min-h-[110px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded resize-y placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
              <button
                onClick={saveAddUser}
                disabled={!newUser.name.trim()}
                className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={cancelAddUser}
                className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Customize Layout Modal */}
      {showCustomizeModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-[10000]"
            onClick={() => setShowCustomizeModal(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 z-[10001] flex max-h-[85vh] w-[400px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[15px] font-semibold text-[#111827]">Customize Layout</h3>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <p className="text-[12px] text-[#6B7280] mb-4">
                Reorder sections to customize your layout. Pinned Fields will always stay at the top.
              </p>

              <div className="space-y-2">
                {/* Pinned Fields - Fixed at top */}
                <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] opacity-60">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-[#9CA3AF]" />
                    <FileText size={16} className="text-[#6B7280]" />
                    <span className="text-[13px] text-[#6B7280]">Pinned Fields</span>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-medium">Fixed</span>
                </div>

                {/* Reorderable Sections */}
                {sectionOrder.map((section, index) => (
                  <div
                    key={section}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== index) {
                        const newOrder = [...sectionOrder];
                        const draggedItem = newOrder[draggedIndex];
                        newOrder.splice(draggedIndex, 1);
                        newOrder.splice(index, 0, draggedItem);
                        setSectionOrder(newOrder);
                        setDraggedIndex(index);
                      }
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-colors ${
                      draggedIndex === index ? 'border-[#3D8BD0] opacity-50' : 'border-[#DFE5ED] hover:border-[#3D8BD0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-[#7B8FA5] cursor-grab active:cursor-grabbing" />
                      {section === 'Change Calendar' ? (
                        <CalendarDays size={16} className="text-[#364658]" />
                      ) : section === 'Scan Info' ? (
                        <ScanLine size={16} className="text-[#364658]" />
                      ) : section === 'Ticket Fields' ? (
                        <FileText size={16} className="text-[#364658]" />
                      ) : section === 'Requester Information' ? (
                        <User size={16} className="text-[#364658]" />
                      ) : (
                        <Tag size={16} className="text-[#364658]" />
                      )}
                      <span className="text-[13px] text-[#364658]">{section === 'Ticket Fields' ? fieldsTitle : section === 'Additional Fields' ? additionalTitle : section === 'Change Calendar' ? changeCalendarTitle : (assetMode && section === 'Requester Information') ? 'Agent Information' : section}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (index > 0) {
                            const newOrder = [...sectionOrder];
                            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                            setSectionOrder(newOrder);
                          }
                        }}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-[#F3F4F6] transition-colors ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <ArrowUp size={14} className="text-[#7B8FA5]" />
                      </button>
                      <button
                        onClick={() => {
                          if (index < sectionOrder.length - 1) {
                            const newOrder = [...sectionOrder];
                            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                            setSectionOrder(newOrder);
                          }
                        }}
                        disabled={index === sectionOrder.length - 1}
                        className={`p-1 rounded hover:bg-[#F3F4F6] transition-colors ${
                          index === sectionOrder.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <ArrowDown size={14} className="text-[#7B8FA5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSectionOrder(defaultSectionOrder)}
                className="px-4 py-2 text-[13px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 text-[13px] text-white bg-[#3D8BD0] hover:bg-[#2A6BA8] rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reopen AI Panel Tooltip */}
      {(() => {
        console.log('Tooltip render check - showReopenTooltip:', showReopenTooltip, 'aiIconRef.current:', aiIconRef.current);
        return showReopenTooltip && aiIconRef.current ? (
          <div 
            ref={reopenTooltipRef}
            className="fixed z-[9999] w-[280px] bg-[#1F2937] rounded-2xl shadow-2xl pointer-events-auto"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateY(-50%)' // Center vertically
            }}
          >
        
          {/* Arrow pointing to the icon - on the right side pointing right */}
          <div 
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderLeft: '12px solid #1F2937',
            }}
          />
          
          {/* Content */}
          <div className="px-6 py-6">
            <h3 className="text-[16px] font-semibold text-white mb-2 leading-tight">
              Reopen AI Panel
            </h3>
            <p className="text-[14px] text-white/80 leading-relaxed">
              Click here anytime to reopen the ServiceOps AI panel.
            </p>
          </div>
        </div>
        ) : null;
      })()}

      {/* Reviews side popup — conversation-style blocks (the Note treatment from the ticket page) */}
      {/* Reviews thread — shared with the article body, which opens the same panel. */}
      <KnowledgeReviewsPanel
        open={showReviewsPanel}
        onClose={() => setShowReviewsPanel(false)}
        reviews={knowledgeReviews}
        onChange={setAddedReviews}
        requesterView={knowledgeRequesterView}
      />
    </div>
  );
}