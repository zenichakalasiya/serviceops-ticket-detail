/**
 * TicketDrawer Component
 * 
 * Note: This file may trigger a Babel optimization warning about exceeding 500KB in transpiled output.
 * This is a known Babel behavior where certain optimizations are disabled for large files,
 * but it does not affect functionality. Utilities have been extracted to TicketDrawerUtils.tsx
 * to help reduce the file size where possible.
 */
import { X, ChevronLeft, ChevronRight, Star, Share2, Eye, EyeOff, MoreHorizontal, MoreVertical, Paperclip, Clock, Search, Filter, ArrowUpDown, Reply, Forward, MessageSquare, StickyNote, ChevronDown, ChevronUp, CheckCircle, Mail, XCircle, Maximize2, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Image, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Video, User, FileText, Download, Trash2, Tag, Folder, Activity, Lightbulb, Pin as PinIcon, PinOff, Plus, Minus, Check, Play, Pause, Square, Link, Ticket as TicketIcon, Lock, Stethoscope, Edit, CheckSquare, Info, Server, AlertTriangle } from 'lucide-react';
import { AiSparkle } from './upstream/AiSparkle';
import { FileTypeBadge } from './DescriptionAttachments';
import { EditorToolbarActions, EditorSendActions, RichComposerArea } from './upstream/EditorToolbar';
import { useState, useRef, useEffect } from 'react';
import { DrawerTabStrip } from './upstream/DrawerTabStrip';
import { SummaryStaleNotice } from './SummaryStaleNotice';
import { alertKpiItems, getHeaderAlerts } from './HeaderAlertPills';
import { MinimizedDrawerRail } from './upstream/MinimizedDrawerRail';
import { DescriptionInlineImage } from './DescriptionInlineImage';
import { toast } from 'sonner';
import type { Problem } from './ProblemListPage';
import type { Project } from './ProjectsListPage';
import { ProjectPlanningTab, planSummaryOf } from './ProjectPlanningTab';

/** Maps a Project row onto the Problem shape the cloned drawer body renders. */
export const projectToProblemShape = (p: Project): Problem => ({
  id: p.id,
  subject: p.name,
  requester: p.owner ?? 'Unassigned',
  createdDate: p.start ?? new Date(),
  assignee: p.owner
    ? {
        name: p.owner,
        initials: p.owner.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase(),
        color: '#3D8BD0',
      }
    : { name: 'Unassigned', initials: 'UA', color: '#94A3B8' },
  status:
    p.status === 'Implementation' || p.status === 'Planning' ? 'In Progress'
      : p.status === 'On Hold' ? 'Pending'
        : p.status === 'Completed' || p.status === 'Cancelled' ? 'Closed'
          : 'Open',
  priority: p.priority === 'Critical' ? 'Urgent' : p.priority,
  urgency: p.priority === 'Critical' ? 'High' : p.priority === 'Low' ? 'Low' : 'Medium',
  // The original Project rides along so the drawer's Key Information stays data-driven.
  project: p,
} as Problem & { project: Project });
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { CopyableEmails } from './CopyableEmails';
import { HeaderCopyButton } from './upstream/HeaderCopyButton';
import { HeaderIdPill } from './HeaderIdPill';
import { SystemFieldsRenderer } from './upstream/SystemFieldsRenderer';
import { TicketPropertiesPanel } from './upstream/TicketPropertiesPanel';
import { RequesterProfilePanel } from './upstream/RequesterProfilePanel';
import { HeaderKpiRow, type HeaderKpiItem } from './upstream/HeaderKpiRow';
import { DiagnosisCard } from './upstream/DiagnosisCard';
import { SolutionCard } from './SolutionCard';
import { AISummary } from './upstream/AISummary';
import { SLAHistoryModal } from './SLAHistoryModal';
import { getSlaPenaltyAmount, makeCrossModuleRelations } from './TicketDrawerUtils';
const DEFAULT_REL = makeCrossModuleRelations([{type:'Request',prefix:'REQ'},{type:'Change',prefix:'CHG'},{type:'Release',prefix:'REL'},{type:'Asset',prefix:'AST'}]);
import { ServiceRequestItems } from './upstream/ServiceRequestItems';
import { EditItemPopup } from './upstream/EditItemPopup';
import { InlineReplyEditor } from './upstream/InlineReplyEditor';
import { renderCatalogIcon, getIconBackgroundColor } from './CatalogIconUtils';
import { TaskFormPanel } from './upstream/TaskFormPanel';
import { TasksTabContent } from './upstream/TasksTabContent';
import { AuditTrailsTabContent } from './upstream/AuditTrailsTabContent';
import { RelationsTabContent } from './upstream/RelationsTabContent';
import { ResolutionTabContent } from './upstream/ResolutionTabContent';
import { ConversationTabContent } from './ConversationTabContent';
import { ServiceRequestTabContent } from './upstream/ServiceRequestTabContent';
import { ApprovalsTabContent } from './upstream/ApprovalsTabContent';
import { TicketDetailsOnboarding } from './upstream/TicketDetailsOnboarding';
import { CatalogItemDetailsModal } from './CatalogItemDetailsModal';
import { ProblemActionsMenu } from './upstream/ProblemActionsMenu';
import { IconRequest, IconAssets, IconChange, IconRelease, IconCMDB, IconProblem } from './SidebarIcons';
import { ConversationEmptyState } from './ConversationEmptyState';
import { ReplyEditor } from './upstream/ReplyEditor';
import { BlankTicketConversationView } from './upstream/BlankTicketConversationView';
import { 
  watchers as mockWatchers, 
  catalogItems as mockCatalogItems,
  initialAttachments
} from './TicketDrawerMockData';
import { 
  aiOptions, 
  getAIResponse, 
  formatDateTime, 
  createAITypingEffect, 
  getPropertiesRelationMockTickets, 
  getStatusDotColor, 
  getPriorityDotColor,
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
  getStatusStyle,
  getFilteredPinnedFields,
  getGroupTitle,
  getCurrentStatusColor,
  getCurrentPriorityColor,
  getCurrentAssigneeColor,
  getCurrentUrgencyColor,
  getCurrentImpactColor,
  getCurrentProjectNameColor,
  getCurrentCostCenterColor,
  getCurrentRequestChannelColor,
  getFilteredTicketFields,
  getFilteredAdditionalFormFields,
  getFilteredAdditionalFields
} from './TicketDrawerUtils';
import profileImage from 'figma:asset/346a47ed4118f690df082984fcd9c5da55898d34.png';
import svgPaths from '../../imports/svg-vmnsig04gh';

interface ProjectDrawerProps {
  openProblems: Problem[];
  activeProblemId: string | null;
  onClose: () => void;
  onCloseTab: (problemId: string) => void;
  onTabChange: (problemId: string) => void;
  onOpenRelation?: (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => void;
  stackTabs?: { id: string; subject?: string }[];
  stackWidth?: number;
  onStackWidthChange?: (w: number) => void;
  stackMinimized?: boolean;
  onStackMinimizedChange?: (m: boolean) => void;
  stackActiveGroup?: string;
  onStackActiveGroupChange?: (g: string) => void;
}

interface AnalysisFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
}

function AnalysisField({ label, value, placeholder, onSave }: AnalysisFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  return (
    <div className="border border-[#DFE5ED] rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] border-b border-[#DFE5ED]">
        <span className="text-[13px] font-semibold text-[#364658]">{label}</span>
        {!editing ? (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="text-[#7B8FA5] hover:text-[#3D8BD0] transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onSave(draft.trim()); setEditing(false); }}
              className="size-7 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#22A06B]"
              title="Save"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => { setDraft(value); setEditing(false); }}
              className="size-7 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#7B8FA5]"
              title="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add details..."
            className="w-full min-h-[90px] text-[13px] text-[#364658] focus:outline-none bg-transparent resize-none"
          />
        ) : value ? (
          <p className="text-[13px] text-[#364658] whitespace-pre-wrap leading-relaxed">{value}</p>
        ) : (
          <p className="text-[13px] text-[#9CA3AF]">{placeholder}</p>
        )}
      </div>
    </div>
  );
}

export function ProjectDrawer({
  openProblems,
  activeProblemId,
  onClose,
  onCloseTab,
  onTabChange,
  onOpenRelation,
stackTabs,
stackWidth,
onStackWidthChange,
stackMinimized,
onStackMinimizedChange,
stackActiveGroup,
onStackActiveGroupChange,
}: ProjectDrawerProps) {
  const activeProblem = openProblems.find(t => t.id === activeProblemId);
  const [minimizedLocal, setMinimizedLocal] = useState(false);
  const [showRequesterProfile, setShowRequesterProfile] = useState(false);
  const minimized = stackMinimized ?? minimizedLocal;
  const setMinimized = onStackMinimizedChange ?? setMinimizedLocal;
  useEffect(() => { setMinimized(false); }, [activeProblem?.id]);
  const [drawerWidth, setDrawerWidth] = useState(stackWidth ?? (typeof window !== 'undefined' ? window.innerWidth - 54 : 1546));
  // Report full/small width changes up to the shared host so the view mode persists across tab switches/closes.
  useEffect(() => { if (onStackWidthChange) onStackWidthChange(drawerWidth); }, [drawerWidth]);
  const [isResizing, setIsResizing] = useState(false);
  const [isAccordionCollapsed, setIsAccordionCollapsed] = useState(false);
  const [accordionWidth, setAccordionWidth] = useState(390);
  const [isAccordionResizing, setIsAccordionResizing] = useState(false);
  const [hasDrawerBeenInitialized, setHasDrawerBeenInitialized] = useState(false);
  const [showFullForwardText, setShowFullForwardText] = useState(false);
  const [showForwardedMessage, setShowForwardedMessage] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeConversationTab, setActiveConversationTab] = useState<'all' | 'technician'>('all');
  const [activeMainTab, setActiveMainTab] = useState<'conversation' | 'tasks' | 'approvals' | 'relations' | 'audit' | 'analysis' | 'planning' | 'resolution' | 'service-request'>('conversation');
  const [analysis, setAnalysis] = useState({ rootCause: '', symptoms: '', impact: '', workaround: '' });
  // Type filter applied to the Relations tab when opened from an "Affected Items" pill
  const [relationsTypeFilter, setRelationsTypeFilter] = useState<string | null>(null);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [showOldMessages, setShowOldMessages] = useState(false);
  const [showSubTabSearch, setShowSubTabSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSortedFromTop, setIsSortedFromTop] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [showForwardEditor, setShowForwardEditor] = useState(false);
  const [showCollaborateEditor, setShowCollaborateEditor] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [showWatchersDropdown, setShowWatchersDropdown] = useState(false);
  
  // Conversation count - total messages in conversation tab (includes old activities when expanded)
  const conversationCount = 16;
  
  // Approvals count - based on ticket ID
  const getApprovalsCount = (ticketId: string | undefined) => {
    if (ticketId === 'PBM-627') return 0; // Blank ticket has no approvals
    if (ticketId === 'PBM-608') return 1; // INC-35 has 1 approval (filtered)
    return 2; // Other tickets have 2 approvals
  };
  const approvalsCount = getApprovalsCount(activeProblem?.id);
  
  // Mock watchers data
  const watchers = mockWatchers;
  
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiTypingText, setAiTypingText] = useState('');
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showAIAssistMenu, setShowAIAssistMenu] = useState(false);
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  const [showToneSubmenu, setShowToneSubmenu] = useState(false);
  const [showAIAssistMenuForward, setShowAIAssistMenuForward] = useState(false);
  const [showFormattingMenuForward, setShowFormattingMenuForward] = useState(false);
  const [showToneSubmenuForward, setShowToneSubmenuForward] = useState(false);
  const [showAIAssistMenuCollaborate, setShowAIAssistMenuCollaborate] = useState(false);
  const [showFormattingMenuCollaborate, setShowFormattingMenuCollaborate] = useState(false);
  const [showToneSubmenuCollaborate, setShowToneSubmenuCollaborate] = useState(false);
  const [replyingToConversation, setReplyingToConversation] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState('');
  const [showAIAssistMenuNote, setShowAIAssistMenuNote] = useState(false);
  const [showFormattingMenuNote, setShowFormattingMenuNote] = useState(false);
  const [showToneSubmenuNote, setShowToneSubmenuNote] = useState(false);
  const [showRequesterDetails, setShowRequesterDetails] = useState(true);
  const [highlightAttachments, setHighlightAttachments] = useState(false);
  const [showCreateApprovalPopup, setShowCreateApprovalPopup] = useState(false);
  const [showKbArticles, setShowKbArticles] = useState(false);
  
  // New conversations state to store sent messages
  const [sentConversations, setSentConversations] = useState<Array<{
    id: string;
    ticketId: string;
    author: string;
    authorInitials: string;
    authorColor: string;
    timestamp: Date;
    content: string;
    type?: 'reply' | 'note' | 'collaborate';
    to?: string;
    cc?: string;
    kbArticles?: Array<{
      id: string;
      title: string;
      url: string;
    }>;
  }>>([]);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // AI Summary content state
  const [noteContent, setNoteContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [forwardContent, setForwardContent] = useState('');
  const [collaborateContent, setCollaborateContent] = useState('');

  // KB Articles state
  const [kbArticles, setKbArticles] = useState<Array<{
    id: string;
    title: string;
    url: string;
  }>>([
    {
      id: 'KB-1024',
      title: 'KB-1024: Troubleshooting Network Connectivity Issues',
      url: 'https://kb.motadata.com/article/1024'
    },
    {
      id: 'KB-2156',
      title: 'KB-2156: Resolving Internet Connection Problems',
      url: 'https://kb.motadata.com/article/2156'
    },
    {
      id: 'KB-3089',
      title: 'KB-3089: Common Wi-Fi Configuration Solutions',
      url: 'https://kb.motadata.com/article/3089'
    }
  ]);
  
  // Properties Panel State
  type RightGroup = 'properties' | 'activity' | 'suggestions' | 'chatbot' | 'notifications';
  const [activeGroupLocal, setActiveGroupLocal] = useState<RightGroup>('properties');
  // Defer to the DrawerStack shared group so it persists when opening a related record.
  const activeGroup = (stackActiveGroup as RightGroup | undefined) ?? activeGroupLocal;
  const setActiveGroup = (g: RightGroup) => { setActiveGroupLocal(g); onStackActiveGroupChange?.(g); };
  const [pinnedFields, setPinnedFields] = useState<string[]>([]);
  const [showPropertiesSearch, setShowPropertiesSearch] = useState(true);
  const [propertiesSearchQuery, setPropertiesSearchQuery] = useState('');
  const [showPropertiesFilter, setShowPropertiesFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'empty' | 'filled' | 'required'>('all');
  
  // Accordion States
  const [pinnedFieldsExpanded, setPinnedFieldsExpanded] = useState(true);
  const [slaStatusExpanded, setSlaStatusExpanded] = useState(true);
  const [ticketFieldsExpanded, setTicketFieldsExpanded] = useState(true);
  const [requesterInfoExpanded, setRequesterInfoExpanded] = useState(false);
  const [additionalFieldsExpanded, setAdditionalFieldsExpanded] = useState(false);
  const [workTrackerExpanded, setWorkTrackerExpanded] = useState(false);
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);
  const [similarTicketExpanded, setSimilarTicketExpanded] = useState(true);
  const [suggestedKnowledgeExpanded, setSuggestedKnowledgeExpanded] = useState(true);
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState(true);
  const [isRefreshingAiSummary, setIsRefreshingAiSummary] = useState(false);
  // Conversations have landed since the summary was written; cleared by regenerating.
  const [aiSummaryStale, setAiSummaryStale] = useState(true);
  const [showAiSummaryMenu, setShowAiSummaryMenu] = useState(false);
  const aiSummaryMenuRef = useRef<HTMLDivElement>(null);
  const quickActionHandlerRef = useRef<((actionType: string, customResponse?: string) => void) | null>(null);

  // Additional Fields Tab
  const [additionalFieldsTab, setAdditionalFieldsTab] = useState<'form' | 'system'>('form');
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [showMoreSystemFields, setShowMoreSystemFields] = useState(false);
  
  // Service Request Accordion
  const [isServiceRequestExpanded, setIsServiceRequestExpanded] = useState(false);
  const [showServiceRequestMenu, setShowServiceRequestMenu] = useState<string | null>(null);
  const serviceRequestMenuRef = useRef<HTMLDivElement>(null);
  const serviceRequestStatusRef = useRef<HTMLDivElement>(null);
  const [showServiceCatalog, setShowServiceCatalog] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');
  const [showCatalogCategoryDropdown, setShowCatalogCategoryDropdown] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [showCatalogItemDetails, setShowCatalogItemDetails] = useState(false);
  const [catalogItemQuantity, setCatalogItemQuantity] = useState(1);
  
  // Catalog Item Configuration States
  const [selectedProcessor, setSelectedProcessor] = useState('Apple M3 Pro');
  const [selectedRAM, setSelectedRAM] = useState('16 GB');
  const [selectedStorage, setSelectedStorage] = useState('512 GB SSD');
  const [selectedDisplay, setSelectedDisplay] = useState('14" Retina');
  const [selectedGraphics, setSelectedGraphics] = useState('Integrated GPU');
  const [selectedColor, setSelectedColor] = useState('Space Gray');
  
  const [showProcessorDropdown, setShowProcessorDropdown] = useState(false);
  const [showRAMDropdown, setShowRAMDropdown] = useState(false);
  const [showStorageDropdown, setShowStorageDropdown] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const [showGraphicsDropdown, setShowGraphicsDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  
  // Service Request Items State
  const [serviceRequestItems, setServiceRequestItems] = useState<any[]>([
    {
      id: 'macbook-pro-1',
      name: 'Apple MacBook Pro',
      icon: 'macbook',
      quantity: 1,
      price: '$1,159.00',
      status: 'Requested',
      configuration: {
        processor: 'Apple M3 Pro',
        ram: '16 GB',
        storage: '512 GB SSD',
        display: '14" Retina',
        graphics: 'Integrated GPU',
        color: 'Space Gray'
      }
    }
  ]);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  
  // Tasks State
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showServiceRequestItemStatus, setShowServiceRequestItemStatus] = useState<string | null>(null);
  
  // Tasks count - based on current tasks array
  const tasksCount = tasks.length;
  
  // Check if this is the blank ticket (INC-32 or INC-35)
  // But also check if there are any conversations - if there are, show them instead of empty state
  const hasConversationsForTicket = sentConversations.some(c => c.ticketId === activeProblemId);
  const isBlankTicket = (activeProblem?.id === 'PBM-627' || activeProblem?.id === 'PBM-608') && !hasConversationsForTicket;
  
  // Edit Service Request Item State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditItemPopup, setShowEditItemPopup] = useState(false);
  const [editItemQuantity, setEditItemQuantity] = useState(1);
  const [editProcessor, setEditProcessor] = useState('');
  const [editRAM, setEditRAM] = useState('');
  const [editStorage, setEditStorage] = useState('');
  const [editDisplay, setEditDisplay] = useState('');
  const [editGraphics, setEditGraphics] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showEditProcessorDropdown, setShowEditProcessorDropdown] = useState(false);
  const [showEditRAMDropdown, setShowEditRAMDropdown] = useState(false);
  const [showEditStorageDropdown, setShowEditStorageDropdown] = useState(false);
  const [showEditDisplayDropdown, setShowEditDisplayDropdown] = useState(false);
  const [showEditGraphicsDropdown, setShowEditGraphicsDropdown] = useState(false);
  const [showEditColorDropdown, setShowEditColorDropdown] = useState(false);
  
  // Dropdown States
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showTechGroupDropdown, setShowTechGroupDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [showImpactDropdown, setShowImpactDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showSupportLevelDropdown, setShowSupportLevelDropdown] = useState(false);
  const [showProjectNameDropdown, setShowProjectNameDropdown] = useState(false);
  const [showCostCenterDropdown, setShowCostCenterDropdown] = useState(false);
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [showRequestChannelDropdown, setShowRequestChannelDropdown] = useState(false);
  const [showBadgeStatusDropdown, setShowBadgeStatusDropdown] = useState(false);
  const [showHeaderStatusDropdown, setShowHeaderStatusDropdown] = useState(false);
  // Keyboard navigation for the header status dropdown (↑/↓ move, Enter selects, Esc closes).
  const [statusHighlight, setStatusHighlight] = useState(0);
  const [showBadgePriorityDropdown, setShowBadgePriorityDropdown] = useState(false);
  const [showBadgeAssigneeDropdown, setShowBadgeAssigneeDropdown] = useState(false);
  
  // Selected Values
  const [selectedStatus, setSelectedStatus] = useState('Open');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [selectedAssignee, setSelectedAssignee] = useState('Sarah Johnson');
  const [selectedTechGroup, setSelectedTechGroup] = useState('IT Support Team');
  const [selectedUrgency, setSelectedUrgency] = useState('Medium');
  const [selectedImpact, setSelectedImpact] = useState('Affects Multiple Users');
  const [selectedCategory, setSelectedCategory] = useState('Hardware');
  const [selectedDepartment, setSelectedDepartment] = useState('IT');
  const [selectedSource, setSelectedSource] = useState('Email');
  const [selectedLocation, setSelectedLocation] = useState('New York, NY');
  const [selectedVendor, setSelectedVendor] = useState('Dell Inc.');
  const [selectedSupportLevel, setSelectedSupportLevel] = useState('Level 2');
  const [selectedProjectName, setSelectedProjectName] = useState('Network Infrastructure');
  const [selectedCostCenter, setSelectedCostCenter] = useState('CC-1001');
  const [selectedBuilding, setSelectedBuilding] = useState('Main Office - Building A');
  const [selectedRequestChannel, setSelectedRequestChannel] = useState('Portal');
  const [companyValue, setCompanyValue] = useState('Acme Corporation');
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  
  // Tags
  const [tags, setTags] = useState(['network', 'urgent', 'laptop']);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  
  // Work Tracker
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [workDescription, setWorkDescription] = useState('');
  const [showWorkHistory, setShowWorkHistory] = useState(false);
  const [showSLAHistory, setShowSLAHistory] = useState(false);
  
  // Tab Overflow
  const [showMoreTabsDropdown, setShowMoreTabsDropdown] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
  const [overflowTabs, setOverflowTabs] = useState<string[]>([]);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const catalogCategoryDropdownRef = useRef<HTMLDivElement>(null);
  
  // Catalog Item Configuration Refs
  const processorDropdownRef = useRef<HTMLDivElement>(null);
  const ramDropdownRef = useRef<HTMLDivElement>(null);
  const storageDropdownRef = useRef<HTMLDivElement>(null);
  const displayDropdownRef = useRef<HTMLDivElement>(null);
  const graphicsDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  
  // Attachments
  const [attachments, setAttachments] = useState(initialAttachments);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const [hoveredAttachmentId, setHoveredAttachmentId] = useState<string | null>(null);
  
  // Similar Tickets
  const [similarTicketsTab, setSimilarTicketsTab] = useState<'similar' | 'linked'>('similar');
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [newlyLinkedTickets, setNewlyLinkedTickets] = useState<any[]>([]);
  
  // Resolution Tab
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [hasSolution, setHasSolution] = useState(false);
  const [showAIAssistMenuDiagnosis, setShowAIAssistMenuDiagnosis] = useState(false);
  const [showFormattingMenuDiagnosis, setShowFormattingMenuDiagnosis] = useState(false);
  const [showToneSubmenuDiagnosis, setShowToneSubmenuDiagnosis] = useState(false);
  const [showAIAssistMenuSolution, setShowAIAssistMenuSolution] = useState(false);
  const [showFormattingMenuSolution, setShowFormattingMenuSolution] = useState(false);
  const [showToneSubmenuSolution, setShowToneSubmenuSolution] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [diagnosisData, setDiagnosisData] = useState<{ content: string; timestamp: string } | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionData, setSolutionData] = useState<{ content: string; timestamp: string } | null>(null);

  // Apply a status choice from the header dropdown (shared by click + Enter-key selection).
  const applyHeaderStatus = (option: { label: string; color: string }) => {
    if (option.label === 'Closed' && !solutionData) {
      toast('Please add a solution in the Resolution tab before closing the request', {
        icon: <Info size={20} style={{ color: '#3D8BD0', fill: 'none', strokeWidth: 2 }} />,
      });
      setActiveMainTab('resolution');
      setShowHeaderStatusDropdown(false);
      return;
    }
    setSelectedStatus(option.label);
    setShowHeaderStatusDropdown(false);
  };
  useEffect(() => {
    if (showHeaderStatusDropdown) {
      const i = statusOptions.findIndex((o) => o.label === selectedStatus);
      setStatusHighlight(i < 0 ? 0 : i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeaderStatusDropdown]);
  useEffect(() => {
    if (!showHeaderStatusDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setStatusHighlight((h) => (h + 1) % statusOptions.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setStatusHighlight((h) => (h - 1 + statusOptions.length) % statusOptions.length); }
      else if (e.key === 'Enter') { e.preventDefault(); applyHeaderStatus(statusOptions[statusHighlight]); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowHeaderStatusDropdown(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeaderStatusDropdown, statusHighlight, solutionData]);

  // Properties Panel Add Relation
  const [showPropertiesRelationDropdown, setShowPropertiesRelationDropdown] = useState(false);
  const [showPropertiesRelationModal, setShowPropertiesRelationModal] = useState(false);
  const [propertiesRelationType, setPropertiesRelationType] = useState('');
  const [relationMode, setRelationMode] = useState<'existing' | 'create'>('existing');
  const [showRelationModeMenu, setShowRelationModeMenu] = useState(false);
  const [relationCreateSubject, setRelationCreateSubject] = useState('');
  const [relationCreateDesc, setRelationCreateDesc] = useState('');
  const handleCreateRelation = () => {
    if (!relationCreateSubject.trim()) return;
    toast.success(`${propertiesRelationType} created and linked`);
    setShowPropertiesRelationModal(false);
    setRelationMode('existing');
    setRelationCreateSubject('');
    setRelationCreateDesc('');
    setSelectedPropertiesRelationTickets([]);
    setPropertiesRelationType('');
    setPropertiesRelationSearchQuery('');
  };
  const [propertiesRelationSearchQuery, setPropertiesRelationSearchQuery] = useState('');
  const [selectedPropertiesRelationTickets, setSelectedPropertiesRelationTickets] = useState<string[]>([]);
  
  // Track relations per ticket (used to determine if Relations tab should be shown for INC-32)
  const [ticketRelations, setTicketRelations] = useState<Record<string, any[]>>({});
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const forwardFormRef = useRef<HTMLDivElement>(null);
  const collaborateFormRef = useRef<HTMLDivElement>(null);
  const noteFormRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyContentRef = useRef<HTMLDivElement>(null);
  const forwardContentRef = useRef<HTMLDivElement>(null);
  const collaborateContentRef = useRef<HTMLDivElement>(null);
  const aiAssistRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuRef = useRef<HTMLDivElement>(null);
  const formattingMenuRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuForwardRef = useRef<HTMLDivElement>(null);
  const formattingMenuForwardRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuCollaborateRef = useRef<HTMLDivElement>(null);
  const formattingMenuCollaborateRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuNoteRef = useRef<HTMLDivElement>(null);
  const formattingMenuNoteRef = useRef<HTMLDivElement>(null);
  const diagnosisFormRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuDiagnosisRef = useRef<HTMLDivElement>(null);
  const formattingMenuDiagnosisRef = useRef<HTMLDivElement>(null);
  const solutionFormRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuSolutionRef = useRef<HTMLDivElement>(null);
  const formattingMenuSolutionRef = useRef<HTMLDivElement>(null);
  
  // Properties Panel Refs
  const propertiesFilterRef = useRef<HTMLDivElement>(null);
  const slaStatusRef = useRef<HTMLDivElement>(null);
  const propertiesRelationDropdownRef = useRef<HTMLDivElement>(null);
  const ticketFieldsRef = useRef<HTMLDivElement>(null);
  const requesterInfoRef = useRef<HTMLDivElement>(null);
  const additionalFieldsRef = useRef<HTMLDivElement>(null);
  const workTrackerRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<HTMLDivElement>(null);
  const similarTicketRef = useRef<HTMLDivElement>(null);
  const suggestedKnowledgeRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const techGroupDropdownRef = useRef<HTMLDivElement>(null);
  const urgencyDropdownRef = useRef<HTMLDivElement>(null);
  const impactDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);
  const supportLevelDropdownRef = useRef<HTMLDivElement>(null);
  const projectNameDropdownRef = useRef<HTMLDivElement>(null);
  const costCenterDropdownRef = useRef<HTMLDivElement>(null);
  const buildingDropdownRef = useRef<HTMLDivElement>(null);
  const requestChannelDropdownRef = useRef<HTMLDivElement>(null);
  const badgeStatusDropdownRef = useRef<HTMLDivElement>(null);
  const badgePriorityDropdownRef = useRef<HTMLDivElement>(null);
  const badgeAssigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Helper Functions
  const togglePinField = (fieldName: string) => {
    if (pinnedFields.includes(fieldName)) {
      setPinnedFields(pinnedFields.filter(f => f !== fieldName));
    } else {
      setPinnedFields([...pinnedFields, fieldName]);
    }
  };

  const filteredAssigneeOptions = assigneeOptions.filter(option =>
    option.label.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
  );

  // Wrapper functions for utilities that need current state
  const getFilteredPinnedFieldsWrapper = () => getFilteredPinnedFields(pinnedFields, propertiesSearchQuery);
  const getGroupTitleWrapper = () => activeGroup === 'properties' ? 'Properties' : activeGroup === 'users' ? 'Members' : getGroupTitle(activeGroup);
  const getCurrentStatusColorWrapper = () => getCurrentStatusColor(selectedStatus);
  const getCurrentPriorityColorWrapper = () => getCurrentPriorityColor(selectedPriority);
  const getCurrentAssigneeColorWrapper = () => getCurrentAssigneeColor(selectedAssignee);
  const getCurrentUrgencyColorWrapper = () => getCurrentUrgencyColor(selectedUrgency);
  const getCurrentImpactColorWrapper = () => getCurrentImpactColor(selectedImpact);
  const getCurrentProjectNameColorWrapper = () => getCurrentProjectNameColor(selectedProjectName);
  const getCurrentCostCenterColorWrapper = () => getCurrentCostCenterColor(selectedCostCenter);
  const getCurrentRequestChannelColorWrapper = () => getCurrentRequestChannelColor(selectedRequestChannel);
  const getFilteredTicketFieldsWrapper = () =>
    getFilteredTicketFields(pinnedFields, showMoreFields, propertiesSearchQuery)
      .filter((f) => !['Source', 'Location', 'Vendor', 'Support Level'].includes(f));
  const getFilteredAdditionalFormFieldsWrapper = () => getFilteredAdditionalFormFields(pinnedFields, propertiesSearchQuery);
  const getFilteredAdditionalFieldsWrapper = () => getFilteredAdditionalFields(pinnedFields, propertiesSearchQuery);

  // Get badge colors based on selected status
  const getStatusBadgeColors = () => {
    const statusColorMap: Record<string, { bg: string; border: string; dot: string; text: string }> = {
      'Open': { bg: '#EFF8FF', border: '#B2DDFF', dot: '#3D8BD0', text: '#175CD3' },
      'In Progress': { bg: '#FFFBEB', border: '#FED7AA', dot: '#F59E0B', text: '#D97706' },
      'Pending': { bg: '#F5F3FF', border: '#DDD6FE', dot: '#8B5CF6', text: '#7C3AED' },
      'On Hold': { bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316', text: '#EA580C' },
      'Resolved': { bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981', text: '#059669' },
      'Closed': { bg: '#F9FAFB', border: '#E5E7EB', dot: '#6B7280', text: '#4B5563' },
    };
    return statusColorMap[selectedStatus] || statusColorMap['Open'];
  };

  // Get badge colors based on selected priority
  const getPriorityBadgeColors = () => {
    const priorityColorMap: Record<string, { bg: string; border: string; barColor: string; text: string }> = {
      'Urgent': { bg: '#FEF2F2', border: '#FEE2E2', barColor: 'rgb(239, 68, 68)', text: '#DC2626' },
      'High': { bg: '#FFFBEB', border: '#FED7AA', barColor: 'rgb(245, 158, 11)', text: '#D97706' },
      'Medium': { bg: '#EFF8FF', border: '#B2DDFF', barColor: 'rgb(61, 139, 208)', text: '#175CD3' },
      'Low': { bg: '#ECFDF5', border: '#A7F3D0', barColor: 'rgb(16, 185, 129)', text: '#059669' },
    };
    return priorityColorMap[selectedPriority] || priorityColorMap['Medium'];
  };

  const hasSLAMatch = () => {
    if (!propertiesSearchQuery) return true;
    return 'sla status'.includes(propertiesSearchQuery.toLowerCase());
  };

  // Catalog Items Data
  const catalogItems = mockCatalogItems;

  const getFilteredCatalogItems = () => {
    return catalogItems.filter(item => {
      const matchesCategory = selectedCatalogCategory === 'All' || item.category === selectedCatalogCategory;
      const matchesSearch = !catalogSearchQuery || 
        item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(catalogSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const hasTicketFieldsMatch = () => {
    if (!propertiesSearchQuery) return true;
    return getFilteredTicketFieldsWrapper().length > 0 || 'ticket fields'.includes(propertiesSearchQuery.toLowerCase());
  };

  const hasAdditionalFieldsMatch = () => {
    if (!propertiesSearchQuery) return true;
    return getFilteredAdditionalFormFieldsWrapper().length > 0 || 
           getFilteredAdditionalFieldsWrapper().length > 0 || 
           'additional fields'.includes(propertiesSearchQuery.toLowerCase());
  };

  const hasRequesterInfoMatch = () => {
    if (!propertiesSearchQuery) return true;
    const query = propertiesSearchQuery.toLowerCase();
    const searchableFields = ['requester', 'information', 'email', 'logon', 'department', 'contact'];
    return searchableFields.some(field => field.includes(query));
  };

  const hasWorkTrackerMatch = () => {
    if (!propertiesSearchQuery) return true;
    return 'work tracker'.includes(propertiesSearchQuery.toLowerCase());
  };

  const hasSimilarTickets = () => {
    return availableSimilarTickets.length > 0;
  };

  const hasSuggestedKnowledgeMatch = () => {
    if (!propertiesSearchQuery) return true;
    return 'suggested knowledge'.includes(propertiesSearchQuery.toLowerCase());
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStartTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (!timerStartTime) {
      setTimerStartTime(new Date());
    }
    setShowTimerPopup(false);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setTimerStartTime(null);
    setWorkDescription('');
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleLinkTicket = (ticketId: string) => {
    const ticketToLink = availableSimilarTickets.find(t => t.id === ticketId);
    if (ticketToLink) {
      setNewlyLinkedTickets([...newlyLinkedTickets, { ...ticketToLink, relationship: 'Related to' }]);
    }
  };

  const openManualWorkLog = () => {
    // Handle opening manual work log modal
    console.log('Open manual work log');
  };

  // Properties Panel Relation Modal Helper Functions (local handlers)
  const handlePropertiesRelationToggleTicket = (ticketId: string) => {
    setSelectedPropertiesRelationTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handlePropertiesRelationToggleAll = (tickets: any[]) => {
    if (selectedPropertiesRelationTickets.length === tickets.length) {
      setSelectedPropertiesRelationTickets([]);
    } else {
      setSelectedPropertiesRelationTickets(tickets.map(t => t.id));
    }
  };

  const handleAddPropertiesRelations = () => {
    if (!activeProblem) return;
    
    // Get the available tickets to add as relations
    const availableTickets = getPropertiesRelationMockTickets(propertiesRelationType);
    const newRelations = availableTickets
      .filter(ticket => selectedPropertiesRelationTickets.includes(ticket.id))
      .map(ticket => ({
        id: String(Date.now() + Math.random()),
        type: propertiesRelationType,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        assignedTo: {
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/30'
        },
        priority: ticket.priority
      }));
    
    // Add relations to the current ticket
    setTicketRelations(prev => ({
      ...prev,
      [activeProblem.id]: [...(prev[activeProblem.id] || []), ...newRelations]
    }));
    
    // Switch to the Relations tab after adding relations
    setActiveMainTab('relations');
    
    // Close the modal and reset the form
    setShowPropertiesRelationModal(false);
    setSelectedPropertiesRelationTickets([]);
    setPropertiesRelationType('');
    setPropertiesRelationSearchQuery(''); setRelationMode('existing'); setRelationCreateSubject(''); setRelationCreateDesc('');
  };

  // Onboarding - shows once per session, resets on page refresh
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (!hasSeenOnboarding && activeProblemId) {
      setActiveGroupLocal('properties'); // local-only default (never clobbers persisted group)
      /* first-visit tour is TICKET-page-only — other detail pages never auto-open it */
    }
  }, [activeProblemId]);

  // Reset to properties when ticket changes (only after onboarding is complete)
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (hasSeenOnboarding && activeProblemId) {
      setActiveGroupLocal('properties');
    }
  }, [activeProblemId]);

  const handleOnboardingComplete = () => {
    sessionStorage.setItem('hasSeenTicketDetailsOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    sessionStorage.setItem('hasSeenTicketDetailsOnboarding', 'true');
    setShowOnboarding(false);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Tab overflow detection
  useEffect(() => {
    const calculateTabOverflow = () => {
      if (!tabContainerRef.current) return;

      // Determine which tabs should be shown based on ticket type and state
      // Analysis leads; Resolution closes the row, after Audit Trails.
      // Projects carry no Approvals/Resolution tabs (removed from the Problem clone).
      const baseTabsForOthers = ['planning', 'conversation', 'audit'];
      const baseTabsForINC35 = ['service-request', 'planning', 'conversation', 'audit'];
      
      // Build tabs list dynamically based on conditions
      let allTabs: string[] = [];
      
      if (activeProblem?.id === 'PBM-608') {
        allTabs = [...baseTabsForINC35];
      } else {
        allTabs = [...baseTabsForOthers];
      }
      
      // Add Relations tab based on condition: show if NOT INC-32, OR if INC-32 has relations
      const shouldShowRelations = activeProblem?.id !== 'PBM-627' || 
                                  (activeProblem?.id && ticketRelations[activeProblem.id]?.length > 0);
      if (shouldShowRelations) {
        // Insert relations after approvals (if exists) or tasks
        const approvalsIndex = allTabs.indexOf('approvals');
        if (approvalsIndex !== -1) {
          allTabs.splice(approvalsIndex + 1, 0, 'relations');
        } else {
          /* Relations follows Conversation now that the Tasks tab is gone — the
             Planning tab owns the project's task list. */
          const anchorIndex = allTabs.indexOf('conversation');
          allTabs.splice(anchorIndex + 1, 0, 'relations');
        }
      }

      const containerWidth = tabContainerRef.current.offsetWidth;
      const paddingLeft = 24; // 6 * 4 = 24px
      const paddingRight = 24;
      const gap = 10; // gap-2.5 = 10px
      // moreButtonWidth is computed after tabWidths below — the More button relabels to the
      
      // Approximate widths for each tab (in pixels)
      const tabWidths: Record<string, number> = {
        'service-request': 130,
        'planning': 85,
        'conversation': 105,
        'approvals': 85,
        'relations': 80,
        'audit': 100,
        'resolution': 95
      };

      // SELECTED overflow tab's name, so it must reserve the WIDEST possible label + chevron,
      // not just the word "More" — otherwise picking a long tab from the dropdown re-overflows the row.
      const moreButtonWidth = Math.max(90, ...allTabs.map((t) => tabWidths[t] || 80)) + 24;
      const availableWidth = containerWidth - paddingLeft - paddingRight;
      let currentWidth = 0;
      const visible: string[] = [];
      const overflow: string[] = [];

      for (let i = 0; i < allTabs.length; i++) {
        const tab = allTabs[i];
        const tabWidth = tabWidths[tab] || 80;
        const gapWidth = visible.length > 0 ? gap : 0;
        
        // Check if we need to account for the More button
        const remainingTabs = allTabs.length - i;
        const needsMoreButton = remainingTabs > 1;
        const requiredWidth = currentWidth + gapWidth + tabWidth + (needsMoreButton ? gap + moreButtonWidth : 0);

        if (requiredWidth <= availableWidth) {
          visible.push(tab);
          currentWidth += gapWidth + tabWidth;
        } else {
          overflow.push(tab);
        }
      }

      setVisibleTabs(visible);
      setOverflowTabs(overflow);
    };

    // Delay calculation to ensure DOM is ready
    setTimeout(calculateTabOverflow, 0);
    window.addEventListener('resize', calculateTabOverflow);
    return () => window.removeEventListener('resize', calculateTabOverflow);
  }, [activeProblem?.id, drawerWidth, ticketRelations]);

  // Click outside handler for More dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreTabsDropdown(false);
      }
    };

    if (showMoreTabsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreTabsDropdown]);

  // Close service request menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceRequestMenuRef.current && !serviceRequestMenuRef.current.contains(event.target as Node)) {
        setShowServiceRequestMenu(null);
      }
    };

    if (showServiceRequestMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showServiceRequestMenu]);

  // Close service request item status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceRequestStatusRef.current && !serviceRequestStatusRef.current.contains(event.target as Node)) {
        setShowServiceRequestItemStatus(null);
      }
    };

    if (showServiceRequestItemStatus) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showServiceRequestItemStatus]);

  // Close properties panel relation dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (propertiesRelationDropdownRef.current && !propertiesRelationDropdownRef.current.contains(event.target as Node)) {
        setShowPropertiesRelationDropdown(false);
      }
    };

    if (showPropertiesRelationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPropertiesRelationDropdown]);

  // Close catalog category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catalogCategoryDropdownRef.current && !catalogCategoryDropdownRef.current.contains(event.target as Node)) {
        setShowCatalogCategoryDropdown(false);
      }
    };

    if (showCatalogCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCatalogCategoryDropdown]);

  // Close catalog item configuration dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (processorDropdownRef.current && !processorDropdownRef.current.contains(event.target as Node)) {
        setShowProcessorDropdown(false);
      }
      if (ramDropdownRef.current && !ramDropdownRef.current.contains(event.target as Node)) {
        setShowRAMDropdown(false);
      }
      if (storageDropdownRef.current && !storageDropdownRef.current.contains(event.target as Node)) {
        setShowStorageDropdown(false);
      }
      if (displayDropdownRef.current && !displayDropdownRef.current.contains(event.target as Node)) {
        setShowDisplayDropdown(false);
      }
      if (graphicsDropdownRef.current && !graphicsDropdownRef.current.contains(event.target as Node)) {
        setShowGraphicsDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    };

    if (showProcessorDropdown || showRAMDropdown || showStorageDropdown || showDisplayDropdown || showGraphicsDropdown || showColorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProcessorDropdown, showRAMDropdown, showStorageDropdown, showDisplayDropdown, showGraphicsDropdown, showColorDropdown]);

  // Close badge status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (badgeStatusDropdownRef.current && !badgeStatusDropdownRef.current.contains(event.target as Node)) {
        setShowBadgeStatusDropdown(false);
      }
    };

    if (showBadgeStatusDropdown) {
      // Add listener on next tick to avoid conflicts with the opening click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBadgeStatusDropdown]);

  // Close badge priority dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (badgePriorityDropdownRef.current && !badgePriorityDropdownRef.current.contains(event.target as Node)) {
        setShowBadgePriorityDropdown(false);
      }
    };

    if (showBadgePriorityDropdown) {
      // Add listener on next tick to avoid conflicts with the opening click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBadgePriorityDropdown]);

  // Close badge assignee dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (badgeAssigneeDropdownRef.current && !badgeAssigneeDropdownRef.current.contains(event.target as Node)) {
        setShowBadgeAssigneeDropdown(false);
      }
    };

    if (showBadgeAssigneeDropdown) {
      // Add listener on next tick to avoid conflicts with the opening click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBadgeAssigneeDropdown]);

  // Set default tab based on ticket type
  useEffect(() => {
    if (activeProblem?.id === 'PBM-608') {
      setActiveMainTab('service-request');
    } else if (activeProblem?.id === 'PBM-599') {
      // INC-39 is a closed ticket, open to Resolution tab with pre-filled data
      setActiveMainTab('resolution');
            setAnalysis({
        rootCause: "A null pointer dereference in the new payment processing module triggered a kernel panic. The fault occurs when more than 15 concurrent payment transactions are processed within a 100ms window — a race condition introduced in the 22:00 deployment on the previous day.",
        symptoms: "Production server crashed at 03:17 with a kernel panic. All customer-facing services went offline. Crash dumps showed the fault originating in the payment module's transaction handler. Services could not self-recover and required manual intervention.",
        impact: "Complete service outage for 2 hours 40 minutes (03:17–05:57). All customers were unable to access the platform. Estimated revenue impact from lost transactions under review. Post-mortem scheduled with engineering and operations leads.",
        workaround: "Rolled back yesterday's deployment at 05:30. Services restored at 05:57. Payment processing module quarantined from production. A daily health check alert has been added for the payment service to catch any recurrence before it escalates."
      });
      setSolutionData({
        content: 'Rolled back the 22:00 deployment and quarantined the payment processing module. The race condition has been reproduced in staging and a fix is in development. Services were fully restored at 05:57. The payment module will not be re-deployed until the race condition is resolved and load-tested at 20+ concurrent transactions.',
        timestamp: new Date(2022, 3, 18, 15, 45).toISOString()
      });
    } else if (activeProblem) {
      // Analysis is the first tab now, and where work on a problem starts.
      setActiveMainTab('planning');
    }
  }, [activeProblem?.id]);

  // Update ticket fields when active ticket changes
  useEffect(() => {
    if (activeProblem) {
      // Update status to match the actual ticket status
      setSelectedStatus(activeProblem.status);
      // Update priority to match the actual ticket priority
      setSelectedPriority(activeProblem.priority);
    }
  }, [activeProblem?.id, activeProblem?.status, activeProblem?.priority]);

  // Auto-expand accordions when switching to activity group
  useEffect(() => {
    if (activeGroup === 'activity') {
      setWorkTrackerExpanded(true);
      setAttachmentsExpanded(true);
    }
  }, [activeGroup]);

  // Click outside handlers for properties dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (propertiesFilterRef.current && !propertiesFilterRef.current.contains(event.target as Node)) {
        setShowPropertiesFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Click handlers
  const handleReplyWithAI = (option: string) => {
    setShowReplyEditor(true);
    setAiTypingText('');
    setIsAiTyping(true);

    // Show KB articles only for "Acknowledge" option
    const isAcknowledge = option === 'Acknowledge';
    setShowKbArticles(isAcknowledge);

    // Reset KB articles to default when Acknowledge is clicked
    if (isAcknowledge) {
      setKbArticles([
        {
          id: 'KB-1024',
          title: 'KB-1024: Troubleshooting Network Connectivity Issues',
          url: 'https://kb.motadata.com/article/1024'
        },
        {
          id: 'KB-2156',
          title: 'KB-2156: Resolving Internet Connection Problems',
          url: 'https://kb.motadata.com/article/2156'
        },
        {
          id: 'KB-3089',
          title: 'KB-3089: Common Wi-Fi Configuration Solutions',
          url: 'https://kb.motadata.com/article/3089'
        }
      ]);
    }

    const responseText = getAIResponse(option);
    createAITypingEffect(
      responseText,
      (text) => setAiTypingText(text),
      () => setIsAiTyping(false)
    );
  };

  const handleReply = () => {
    setShowReplyEditor(true);
    // Clear AI text and reset states for blank reply
    setReplyContent('');
    setAiTypingText('');
    setIsAiTyping(false);
    setShowKbArticles(false);
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };
  
  const formatFullDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${dayName}, ${monthName} ${day}, ${year} at ${displayHours}:${minutes} ${ampm}`;
  };

  const handleSendReply = () => {
    // Get the content from either replyContent (if AI generated) or aiTypingText (if manually typed)
    const messageContent = replyContent || aiTypingText;

    if (!messageContent.trim()) {
      return; // Don't send empty messages
    }

    // Create new conversation entry
    const newConversation = {
      id: `sent-${Date.now()}`,
      ticketId: activeProblemId, // Associate with the current active ticket
      author: 'Arnav Desai', // Current user - in production this would come from auth
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: messageContent,
      type: 'reply' as const,
      to: 'saahil.pandya@motadata.com', // This would come from the form
      cc: 'database.team@motadata.com', // This would come from the form if Cc is shown
      kbArticles: showKbArticles && kbArticles.length > 0 ? [...kbArticles] : undefined
    };

    // Add to conversations
    setSentConversations([...sentConversations, newConversation]);

    // Close the reply editor and reset form
    setShowReplyEditor(false);
    setReplyContent('');
    setAiTypingText('');
    setIsAiTyping(false);
    setShowKbArticles(false);
  };

  const handleForward = () => {
    setShowForwardEditor(true);
    // Clear content for blank forward
    setForwardContent('');
  };

  const handleCollaborate = () => {
    setShowCollaborateEditor(true);
    // Clear content for blank collaborate
    setCollaborateContent('');
  };

  const handleNote = () => {
    setShowNoteEditor(true);
    // Clear content for blank note
    setNoteContent('');
  };

  const handleSendNote = () => {
    if (!noteContent.trim()) {
      return; // Don't send empty notes
    }

    // Create new note conversation entry
    const newConversation = {
      id: `sent-${Date.now()}`,
      ticketId: activeProblemId,
      author: 'Arnav Desai',
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: noteContent,
      type: 'note' as const
    };

    // Add to conversations
    setSentConversations([...sentConversations, newConversation]);

    // Close the note editor and reset form
    setShowNoteEditor(false);
    setNoteContent('');

    // Switch to conversation tab to show the new note
    setActiveMainTab('conversation');
  };

  const handleSendCollaborate = () => {
    if (!collaborateContent.trim()) {
      return; // Don't send empty collaborations
    }

    // Create new collaborate conversation entry
    const newConversation = {
      id: `sent-${Date.now()}`,
      ticketId: activeProblemId,
      author: 'Arnav Desai',
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: collaborateContent,
      type: 'collaborate' as const
    };

    // Add to conversations
    setSentConversations([...sentConversations, newConversation]);

    // Close the collaborate editor and reset form
    setShowCollaborateEditor(false);
    setCollaborateContent('');

    // Switch to conversation tab to show the new collaboration
    setActiveMainTab('conversation');
  };

  const onCloseDiagnosis = () => {
    setHasDiagnosis(false);
    setDiagnosisText('');
    setShowAIAssistMenuDiagnosis(false);
    setShowFormattingMenuDiagnosis(false);
    setShowToneSubmenuDiagnosis(false);
  };

  const onCloseSolution = () => {
    setHasSolution(false);
    setSolutionText('');
    setShowAIAssistMenuSolution(false);
    setShowFormattingMenuSolution(false);
    setShowToneSubmenuSolution(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target as Node)) {
        setShowAiDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 600 && newWidth <= window.innerWidth * 0.9) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle accordion width resizing
  useEffect(() => {
    const handleAccordionMouseMove = (e: MouseEvent) => {
      if (!isAccordionResizing) return;
      
      const drawerElement = document.querySelector('[data-drawer]') as HTMLElement;
      if (!drawerElement) return;
      
      const drawerRect = drawerElement.getBoundingClientRect();
      const newWidth = drawerRect.right - e.clientX;
      
      // Min width 390px, max width 600px
      if (newWidth >= 390 && newWidth <= 600) {
        setAccordionWidth(newWidth);
      }
    };

    const handleAccordionMouseUp = () => {
      setIsAccordionResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isAccordionResizing) {
      document.addEventListener('mousemove', handleAccordionMouseMove);
      document.addEventListener('mouseup', handleAccordionMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleAccordionMouseMove);
      document.removeEventListener('mouseup', handleAccordionMouseUp);
    };
  }, [isAccordionResizing]);

  // Monitor drawer width and auto-collapse accordion when too narrow
  useEffect(() => {
    const collapseThreshold = 1000; // Width below which accordion collapses
    const expandThreshold = 1080; // Width above which accordion expands
    
    if (drawerWidth < collapseThreshold && !isAccordionCollapsed) {
      setIsAccordionCollapsed(true);
    } else if (drawerWidth >= expandThreshold && isAccordionCollapsed) {
      // Auto-expand when drawer width exceeds 1080px
      setIsAccordionCollapsed(false);
    }
  }, [drawerWidth, isAccordionCollapsed]);

  // Reset drawer width to full width only when drawer first opens (not when switching tickets)
  useEffect(() => {
    if (openProblems.length > 0 && !hasDrawerBeenInitialized) {
      setDrawerWidth(stackWidth ?? window.innerWidth - 54);
      setIsAccordionCollapsed(false);
      setAccordionWidth(390); // Reset accordion width to default
      setHasDrawerBeenInitialized(true);
    } else if (openProblems.length === 0) {
      // Reset initialization flag when all tickets are closed
      setHasDrawerBeenInitialized(false);
    }
  }, [openProblems.length, hasDrawerBeenInitialized]);


  // Function to expand accordion and set optimal width
  const expandAccordion = () => {
    setIsAccordionCollapsed(false);
    const fullWidth = window.innerWidth - 54;
    if (drawerWidth < fullWidth) {
      setDrawerWidth(fullWidth); // Set to full width
    }
  };

  // Function to toggle between full and small view
  const toggleDrawerView = () => {
    if (drawerWidth > 1080) {
      // Currently in full/large view, switch to small view
      setDrawerWidth(1080);
    } else {
      // Currently in small view, switch to full view
      setDrawerWidth(window.innerWidth - 54);
    }
  };

  // Function to strip HTML tags from text
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Problem-specific content for AI summary and description
  const getProblemContent = (id: string | undefined) => {
    const map: Record<string, { summary: string; keyPoints: string[]; desc: string; descExtra: string }> = {
      'PBM-627': {
        summary: 'Multiple users on the 3rd floor are reporting repeated WiFi disconnections throughout the day. The issue began 3 days ago and is affecting all devices on that floor, pointing to a potential access point hardware failure or channel interference.',
        keyPoints: ['WiFi dropping for all devices connected to 3rd floor access point', 'Issue affecting multiple users simultaneously', 'Access point restart provides only temporary relief'],
        desc: 'The WiFi access point on the 3rd floor has been intermittently dropping connections for all connected devices. Users report reconnecting 5–10 times per hour, severely impacting productivity across the floor.',
        descExtra: 'Initial investigation suggests the issue may be related to access point firmware or a channel conflict with a nearby device. Restarting the AP provides temporary relief for 20–30 minutes before the issue recurs. A replacement unit may be required if configuration changes do not resolve the problem.'
      },
      'PBM-626': {
        summary: 'The mail server has stopped receiving incoming emails from external senders since yesterday afternoon. Internal mail flow remains unaffected. Bounce-back messages indicate an MX record misconfiguration or upstream firewall block.',
        keyPoints: ['External email delivery completely blocked since yesterday afternoon', 'Internal mail flow between employees remains unaffected', 'MX record or firewall rule change suspected as root cause'],
        desc: 'The mail server has not been receiving any incoming emails from external senders since 14:30 yesterday. Senders are receiving NDR (Non-Delivery Report) delivery failure notifications.',
        descExtra: 'Internal emails between employees are routing normally. The timing coincides with a DNS maintenance window performed yesterday at 13:00, suggesting an MX record change may have been applied incorrectly during that window.'
      },
      'PBM-625': {
        summary: 'Network connectivity is dropping intermittently across multiple departments, disrupting cloud-based services and shared resources. The issue is sporadic but increasing in frequency — occurring 8–12 times daily over the past week.',
        keyPoints: ['Intermittent network drops affecting users across multiple departments', 'Cloud services and shared drives impacted during each outage', 'Increasing frequency over past 7 days suggests progressive hardware degradation'],
        desc: 'Network connectivity is dropping intermittently across the main building. Each outage lasts 2–5 minutes before self-restoring, but frequency has increased to 8–12 drops per day over the past week.',
        descExtra: 'Cloud-hosted applications, shared file drives, and VoIP phones are all impacted during each outage. On-site servers remain accessible during the drops, suggesting the issue is at the internet gateway level rather than the internal network. ISP logs are being reviewed for upstream disruptions.'
      },
      'PBM-624': {
        summary: 'Multiple users across all departments are unable to log into the primary business application since this morning. Authentication requests are timing out with no error codes returned, suggesting an SSO or identity provider service failure.',
        keyPoints: ['Login failures affecting users across all departments since 08:45', 'Authentication requests timing out with no error codes returned', 'Identity provider (SSO) service suspected as root cause — existing sessions unaffected'],
        desc: 'Users across the organization cannot log into the main business application since 08:45 this morning. The login page loads but after entering credentials the browser spins for 30 seconds then times out with no error message.',
        descExtra: 'The issue affects all users regardless of role, department, or device. Users already logged in before 08:45 continue to work normally — only new login attempts are failing. This strongly suggests the authentication/SSO service is failing to process new requests while keeping existing sessions valid.'
      },
      'PBM-622': {
        summary: 'Outbound emails to external recipients are failing with NDR bounce-back notifications. Internal email routing is unaffected. The issue began approximately 12 hours ago and appears linked to an SPF record change during scheduled DNS maintenance.',
        keyPoints: ['All outbound external emails failing with NDR bounce-back notices', 'Internal email routing between employees unaffected', 'SPF record change during DNS maintenance window suspected cause'],
        desc: 'All emails sent to external recipients are bouncing back with NDR delivery failure messages. The problem started at approximately 22:00 last night and affects every sender in the organization.',
        descExtra: 'The error in bounce-back messages references an SPF authentication failure, suggesting a DNS record for the domain may have been modified or corrupted. The timing coincides with scheduled DNS maintenance performed by an external contractor the previous evening.'
      },
      'PBM-621': {
        summary: 'The shared network printer on floor 2 has been unresponsive for 2 days. Print jobs queue in the spooler but never execute. The device appears online on the network but is not processing any requests, and print spooler restarts provide no lasting relief.',
        keyPoints: ['Print queue accumulating jobs but printer not processing any requests', 'Device appears online on the network but physically unresponsive', 'Print spooler restart provides no lasting relief — firmware issue suspected'],
        desc: 'The HP LaserJet shared printer on floor 2 has not printed anything for 2 days. Jobs sent from any workstation appear in the queue but the printer never begins processing them.',
        descExtra: 'The printer displays "Ready" on its front panel and shows as online in the print management console. Restarting the print spooler service on the server temporarily allows job cancellation but the printer still does not print. The device also does not respond to diagnostic print pages initiated from its local control panel, suggesting a firmware or internal controller issue.'
      },
      'PBM-620': {
        summary: 'Active Directory replication is failing between domain controllers, causing 5–10 minute login delays and incorrect Group Policy application. The primary domain controller is logging Event ID 1311 replication errors.',
        keyPoints: ['AD replication failures causing 5–10 minute login delays for all users', 'Group Policy Objects not applying correctly to workstations', 'Primary DC logging Event ID 1311 and 1988 (lingering object) errors'],
        desc: 'Users across the organization are experiencing login delays of 5–10 minutes when authenticating to Windows workstations. Group Policy settings including drive mappings and security policies are not applying correctly.',
        descExtra: 'Event Viewer on the primary domain controller shows Event ID 1311 (AD cannot replicate with remote system) and 1988 (lingering object detected). These errors point to a replication failure between domain controllers, possibly triggered by a server maintenance window last week.'
      },
      'PBM-618': {
        summary: 'Internal DNS resolution is failing for several corporate hostnames, preventing users from reaching internal web applications and shared services. The DNS server responds but returns empty or incorrect records for critical internal A records.',
        keyPoints: ['Internal hostname lookups returning empty or incorrect DNS records', 'Internal web applications and services unreachable by hostname', 'Approximately 12 A records missing from Forward Lookup Zone — accidental deletion suspected'],
        desc: 'Users cannot access internal applications by hostname (e.g., intranet.company.local, erp.company.local). Direct IP access still works, confirming the network is intact but DNS name resolution is broken.',
        descExtra: 'The internal DNS server is responding to queries but returning NXDOMAIN for several records that previously resolved correctly. A zone file audit shows approximately 12 A records for critical internal services are missing from the Forward Lookup Zone, suggesting accidental deletion or a failed import during recent maintenance.'
      },
      'PBM-617': {
        summary: 'The core business application server experiences severe performance degradation exclusively during peak hours (9 AM–2 PM). Response times have increased over 300% and users encounter frequent timeout errors, though performance is normal outside this window.',
        keyPoints: ['Performance degradation strictly isolated to peak hours (9AM–2PM daily)', 'Application response times increased by 300%+ during the affected window', 'Server CPU spikes to 85–95% during peak — recent deployment under investigation'],
        desc: 'The main business application becomes extremely slow every day between 9 AM and 2 PM. Operations that normally complete in 1–2 seconds take 30–60 seconds, and many requests time out entirely during this window.',
        descExtra: 'Server monitoring shows CPU on the application server spiking to 85–95% during these hours while remaining at 15–20% outside this window. The number of active users has not increased compared to prior months, suggesting a recent code deployment may have introduced a performance regression that only manifests under concurrent load.'
      },
      'PBM-616': {
        summary: 'The SSL certificate for the customer-facing web portal expired at 23:59 last night, causing all browsers to display security warnings and blocking all customer access. The certificate expiry monitoring alert failed to trigger.',
        keyPoints: ['SSL certificate expired causing security warnings in all browsers', 'Customer access to the web portal completely blocked since midnight', 'Certificate expiry monitoring alert was accidentally disabled during platform migration'],
        desc: 'Customers cannot access the web portal. All browsers (Chrome, Firefox, Edge, Safari) display a "Your connection is not private" (ERR_CERT_DATE_INVALID) security warning and block access to the site.',
        descExtra: 'Inspection confirms the SSL certificate expired at 23:59 last night. The automated monitoring alert that should flag upcoming expiry 30 days in advance did not trigger. Investigation shows the alert rule was accidentally disabled during a monitoring platform migration two months ago. An emergency certificate renewal is in progress.'
      },
      'PBM-615': {
        summary: 'All remote employees are unable to establish RDP connections to their office workstations since a Network Policy Server configuration change last Thursday. Connections fail immediately with an authentication error, though on-site RDP works normally.',
        keyPoints: ['RDP connections failing for 100% of remote workers since Thursday', 'Authentication error (Code: 0x507) on every connection attempt', 'NPS configuration change on Thursday suspected to have disabled allowed auth methods'],
        desc: 'Remote employees connecting via VPN cannot RDP to their office workstations. The connection attempt immediately fails with "An authentication error has occurred (Code: 0x507)" without prompting for credentials.',
        descExtra: 'The issue affects 100% of remote workers and began on Thursday following a scheduled NPS configuration change. On-site employees can RDP between workstations normally. The NPS change may have modified the authentication methods allowed for remote desktop sessions, potentially disabling NTLMv2 or modifying the allowed user groups for RDP access.'
      },
      'PBM-614': {
        summary: 'A recently enforced password policy reduced the lockout threshold from 10 to 3 failed attempts, causing over 200 user accounts to be locked across the organization. The threshold is too aggressive for mobile device users and the helpdesk is overwhelmed.',
        keyPoints: ['200+ user accounts locked out following password policy enforcement', 'New lockout threshold of 3 attempts causing excessive mobile device lockouts', 'IT helpdesk overwhelmed with 180+ account unlock requests since morning'],
        desc: "Following yesterday's password policy update, hundreds of user accounts have been locked out. The new 3-attempt lockout threshold is too strict — users on mobile devices are being locked out after a single typing error.",
        descExtra: 'The helpdesk has received 180 unlock requests since this morning and cannot keep pace. Analysis of lockout events shows most are originating from mobile devices where the smaller keyboard and autocorrect features cause frequent password entry errors. The security team is reviewing whether to increase the threshold to 5 attempts or apply separate policies for mobile endpoints.'
      },
      'PBM-613': {
        summary: "Remote branch office users cannot access the central file server since a firewall firmware upgrade last Tuesday. On-site users at HQ are unaffected, and the issue is isolated to inter-site SMB traffic, strongly pointing to an ACL change introduced by the firmware update.",
        keyPoints: ['Remote branch users unable to access central file server since Tuesday upgrade', 'HQ on-site users accessing the same server without issues', 'Firewall firmware v8.0.4 likely changed ACL behavior for site-to-site SMB traffic'],
        desc: 'Staff at the Bangalore and Pune branch offices cannot access the central file server at HQ since Tuesday afternoon. They receive "Network path not found" (Error 0x80070035) or the connection times out.',
        descExtra: 'On-site HQ employees have full uninterrupted access. The HQ firewall was upgraded from firmware 7.2.1 to 8.0.4 on Tuesday at 14:00, coinciding exactly with when the issue first appeared. The new firmware may have changed the default ACL rules for site-to-site VPN traffic, inadvertently blocking SMB traffic on port 445 from branch site IP ranges.'
      },
      'PBM-612': {
        summary: 'The automated nightly database backup job has failed for 5 consecutive nights. Logs show I/O timeout errors at approximately 68% completion, and storage metrics confirm write latency on the backup target volume has increased from 8ms to over 2,000ms.',
        keyPoints: ['Backup job failing for 5 consecutive nights with I/O timeout errors', 'Failure occurs consistently at 68% completion of the process', 'Backup volume write latency increased from 8ms to 2,000ms after SAN firmware update'],
        desc: 'The scheduled database backup job running at 02:00 has been failing every night for 5 days. The backup logs show an I/O write timeout error and the backup terminates without completing.',
        descExtra: 'Disk performance metrics on the backup target SAN volume show write latency increasing from a baseline of 8ms to over 2,000ms during the backup window. Other volumes on the same SAN perform normally. The issue began the day after a SAN controller firmware update, suggesting the update altered I/O scheduling for this specific volume.'
      },
      'PBM-611': {
        summary: 'The primary production application server has been at 100% CPU utilization for 18 hours, causing severe degradation across all hosted services. A single IIS worker process consumes 94% of CPU, and the issue correlates with a deployment pushed at 05:30 this morning.',
        keyPoints: ['Production server CPU at 100% for past 18 hours', 'Single IIS worker process (w3wp.exe) consuming 94% of available CPU', 'Deployment at 05:30 this morning strongly suspected as root cause'],
        desc: 'The production application server CPU has been at 100% since 06:00 this morning. All hosted applications are responding extremely slowly or returning timeout errors.',
        descExtra: 'Process monitoring identifies a single w3wp.exe (IIS worker process) consuming 94% of available CPU. Application pool recycling temporarily reduces CPU usage but it returns to 100% within 10–15 minutes. A spike in requests to a specific API endpoint at 05:58 correlates with a deployment pushed at 05:30, which is under investigation as the likely root cause.'
      },
      'PBM-610': {
        summary: 'Multiple ports on the core distribution switch in the server room are generating CRC errors and causing measurable packet loss on server-to-server links. The degradation began following cable infrastructure work last week and is causing intermittent application failures.',
        keyPoints: ['4 core switch ports generating CRC errors exceeding 500 errors/second', 'Packet loss of 2–8% on server-to-server links causing TCP retransmissions', "Cable damage during last week's infrastructure work suspected"],
        desc: 'Network monitoring is alerting on high CRC error rates on 4 ports of the core switch in the server room. Packet loss on these links is causing intermittent application failures and slow file transfers between servers.',
        descExtra: 'Error rates have increased steadily over the past week and now exceed 500 CRC errors per second during peak periods. The affected ports connect to the primary database server, file server cluster, and two application servers. Degradation began after infrastructure contractors performed cable management work in the server room last week.'
      },
      'PBM-609': {
        summary: 'Antivirus definition updates have not reached 340 of 420 managed endpoint devices for 7 days, leaving 81% of the fleet running outdated definitions. The endpoint security agent service is stopped on all sampled affected devices, likely caused by a conflict with Windows Update KB5034127.',
        keyPoints: ['340 of 420 managed endpoints missing AV definition updates for 7 days', 'Endpoint security agent service found stopped on all sampled affected devices', 'Windows Update KB5034127 deployed 8 days ago confirmed incompatible — vendor patch available'],
        desc: 'The endpoint security management console shows 340 of 420 managed devices have not received antivirus definition updates for 7 days. These devices are running significantly out-of-date definitions.',
        descExtra: 'Remote inspection of 15 sampled affected devices confirms the antivirus agent service has stopped and is not auto-restarting. Manually starting the service immediately pulls the latest definitions, but the service stops again at the next system restart. The issue began 8 days ago, one day after Windows Update KB5034127 was deployed. The vendor has confirmed the incompatibility and provided a patched agent installer for testing.'
      },
      'PBM-608': {
        summary: "User's laptop became completely unresponsive after an automated OS update and has not booted for 2 days. The device fails to boot past the Windows loading screen and cannot be reached by remote management tools, leaving the user without access to locally stored files.",
        keyPoints: ['Laptop fails to boot past Windows loading screen after OS update', 'Remote management tools unable to connect to the device', 'Locally stored files not yet synced to OneDrive — data recovery required'],
        desc: 'My laptop stopped working after a Windows update was automatically installed on Monday evening. When powered on, it shows the Windows logo for 3–5 minutes then restarts in a continuous loop. I cannot reach the desktop.',
        descExtra: 'Remote support agents have confirmed they cannot reach the device via the remote management console. I have been unable to work for 2 full days and have critical project deadlines this week. A loaner laptop has been arranged as a temporary measure, but the original device urgently needs to be recovered as it contains locally stored files that have not yet been synced to OneDrive.'
      },
      'PBM-607': {
        summary: 'The primary hard disk on a finance workstation is showing critical SMART failure warnings and intermittent read errors. The device contains locally stored financial data not fully backed up, requiring immediate data recovery before attempting any hardware replacement.',
        keyPoints: ['SMART diagnostic showing critical "FAILING NOW" status with multiple reallocated sectors', 'Intermittent read errors on locally stored financial data files', 'Urgent data recovery required before total disk failure and permanent data loss'],
        desc: 'The finance department workstation is showing SMART status of "FAILING NOW" with multiple reallocated sectors. The user reports clicking sounds from the device and Excel files occasionally failing to open with corruption errors.',
        descExtra: 'The disk contains locally stored financial reports and transaction data from the past quarter not fully synchronized to the network file server. The risk of total disk failure and permanent data loss is high. A priority data recovery attempt must be initiated immediately before any hardware replacement. A replacement SSD has been ordered.'
      },
      'PBM-601': {
        summary: 'Audio quality in video conference calls has been severely degraded for all users over the past week, with choppy audio, echo, and complete dropouts affecting Teams, Zoom, and Google Meet equally. The cross-platform impact points to a network QoS misconfiguration.',
        keyPoints: ['Audio dropouts, echo, and distortion affecting all video conferencing platforms', 'Issue occurs equally on Teams, Zoom, and Google Meet — indicating a network-level root cause', 'QoS policy for audio/video traffic not prioritizing VC packets over general data traffic'],
        desc: 'Audio quality in all video calls has been very poor for the past week. Participants report choppy audio, echo (hearing their own voice 1–2 seconds delayed), and complete audio dropouts. The issue equally affects Teams, Zoom, and Google Meet.',
        descExtra: 'The problem occurs consistently across all conferencing platforms, ruling out a platform-specific issue. The problems worsen when multiple office users are on calls simultaneously, suggesting a bandwidth or QoS problem. Network analysis shows audio/video packets are not being prioritized over general data traffic. A QoS policy update on the network switches is being evaluated.'
      },
      'PBM-600': {
        summary: "Following last weekend's file server migration, user permissions on shared drives are not being applied correctly. Some users have lost legitimate access while others have gained access to sensitive folders, indicating the migration broke ACL inheritance across the share structure.",
        keyPoints: ['Permission inconsistencies affecting all departments post file server migration', 'Users both losing legitimate access and gaining unintended access to sensitive folders', 'ACL inheritance overwritten during migration — restoration from pre-migration export planned'],
        desc: "After last weekend's file server migration, many users cannot access folders they previously could, and some users can access sensitive folders they should not have access to.",
        descExtra: 'Analysis shows that explicit ACL entries were preserved during migration but inherited permissions were not correctly propagated. Several top-level folders had "Replace all child permissions" applied during the migration, overwriting carefully configured per-subfolder permissions built up over several years. A permission audit is underway and a restoration from the pre-migration ACL export is being planned.'
      },
      'PBM-599': {
        summary: "The production server crashed at 03:17 causing a 2-hour 40-minute service outage for all customers. Root cause analysis identified a kernel panic triggered by a memory fault in the payment processing module deployed in yesterday's release. Services were restored at 05:57 after rollback.",
        keyPoints: ['Production outage: 2 hours 40 minutes from 03:17 to 05:57', 'Kernel panic caused by null pointer dereference in new payment module', 'Rollback applied successfully — post-mortem scheduled, module quarantined from production'],
        desc: "The production server crashed at 03:17 causing a full service outage. All customer-facing services were down for 2 hours 40 minutes and were restored at 05:57 after rolling back yesterday's deployment.",
        descExtra: "Crash dump analysis identified a null pointer dereference in the new payment processing module included in yesterday's 22:00 deployment. The fault is triggered by a race condition occurring when more than 15 concurrent payment transactions are processed within a 100ms window. A rollback was applied at 05:30 and services came back online 27 minutes later. A full post-mortem has been scheduled and the payment module has been quarantined from production until the race condition is resolved."
      },
      'PBM-598': {
        summary: 'Database query performance has deteriorated significantly over the past two weeks. Queries have gone from under 1 second to 30+ seconds. Investigation confirmed index fragmentation at 87–94% on primary tables, caused by a nightly index rebuild job accidentally disabled 30 days ago.',
        keyPoints: ['Query execution times increased from <1 second to 30–90 seconds', 'All business applications relying on the database severely impacted', 'Index fragmentation at 87–94% — nightly index rebuild job accidentally disabled 30 days ago'],
        desc: 'The database has become very slow over the past two weeks. Reports that previously ran in seconds now take several minutes, and some batch jobs are exceeding their scheduled windows and timing out.',
        descExtra: 'Performance analysis shows CPU usage during query execution has increased from 25% to 80%+, and index fragmentation on the top 10 most-queried tables has reached 87–94%. The fragmentation is consistent with the nightly index maintenance job not having run for 30 days. Investigation confirmed the SQL Agent job was accidentally disabled when a DBA modified the maintenance plan configuration.'
      },
      'PBM-597': {
        summary: 'A memory leak in the core business application causes it to consume all available 32GB of RAM on the host server over an 8–10 hour period. The leak has been isolated to the PDF report generation module, and a daily 06:00 service restart has been implemented as a temporary workaround.',
        keyPoints: ['Application consuming all 32GB RAM over an 8–10 hour period', 'Memory leak isolated to PDF report generation module by heap dump analysis', 'Daily 06:00 service restart implemented as temporary workaround — patch in testing'],
        desc: 'The business application is slowly consuming all server RAM until it crashes or becomes unresponsive. A daily restart at 06:00 is in place as a temporary fix, but a permanent resolution is needed.',
        descExtra: 'Memory profiling via heap dump analysis has isolated the leak to the PDF report generation module. The module allocates document objects but fails to dispose of them after rendering, particularly when report generation is interrupted. Leak rate is approximately 3GB per hour. A patch is in testing and deployment is expected within 3–5 business days pending QA approval.'
      },
      'PBM-596': {
        summary: "Approximately 45 of 90 remote workers are experiencing random VPN disconnections that interrupt active work sessions. Gateway logs show authentication timeouts and certificate chain validation failures, which began one day after the VPN gateway's SSL certificate was renewed last week.",
        keyPoints: ['Intermittent VPN disconnections affecting approximately 50% of remote workers', 'Authentication timeouts and certificate chain validation failures in gateway logs', "Intermediate CA certificate in trust chain not updated during last week's certificate renewal"],
        desc: "About half of our remote workers are being randomly disconnected from the VPN during the workday. Sessions drop without warning and users must reconnect, losing unsaved work. The issue started after last week's certificate renewal.",
        descExtra: "VPN gateway event logs show certificate validation errors and IKEv2 authentication timeouts at irregular intervals. The issue began 8 days ago, one day after the VPN gateway's SSL certificate was renewed. Analysis of the certificate chain reveals the primary certificate was renewed correctly, but an intermediate CA certificate in the trust chain was not updated to match the new certificate's issuer, causing intermittent validation failures."
      },
    };
    return map[id ?? ''] ?? {
      summary: 'This project tracks a planned programme of work. The owner and delivery team are assigned, and progress is reported against the project schedule and milestones.',
      keyPoints: ['Project charter approved and delivery team assigned', 'Work is tracked against the planned schedule and milestones', 'Progress updates are posted as each milestone completes'],
      desc: 'This project covers the planned scope of work agreed with the business sponsor. The delivery team is executing against the project schedule, and progress is reviewed at each milestone checkpoint.',
      descExtra: 'Further details and updates will be posted as delivery progresses. If you have information that affects scope, schedule or risk, please add it as a note on this project record.'
    };
  };

  // Problem-specific conversation thread + approval titles, keyed by problem ID
  const getProblemThread = (id: string | undefined) => {
    const map: Record<string, {
      mention: string; team: string; to: [string, string];
      escalateShort: string; escalateFull: string; origFrom: string; origMsg: string;
      reply: string; file1: string; file2: string; note: string; today: string;
      approval1: string; approval2: string;
    }> = {
      'PBM-627': {
        mention: "@Arnav Desai - Can you take a look at this? All devices on the 3rd floor keep dropping off the WiFi and restarting the access point only helps for ~20 minutes. Looks like an AP hardware or channel interference issue.",
        team: "network infrastructure team", to: ['network.team@motadata.com', 'wifi.support@motadata.com'],
        escalateShort: "Escalating to the network team for review. The 3rd-floor access point is dropping all connected clients every 20–30 minutes and AP restarts only provide temporary relief...",
        escalateFull: "Escalating to the network team for review. The 3rd-floor access point is dropping all connected clients every 20–30 minutes and AP restarts only provide temporary relief. A wireless site survey shows heavy channel overlap with a nearby AP, and the unit's firmware is two versions behind. Recommend changing the channel and updating firmware; if instability continues, the AP should be RMA'd as a suspected hardware fault.",
        origFrom: "Priya Nair", origMsg: "Hi team, the WiFi on the 3rd floor has been unusable all week — we reconnect 5–10 times an hour. Can someone please check the access point?",
        reply: "I've completed the wireless site survey and AP diagnostics. The attached reports show severe channel overlap and rising CRC errors on the AP radio. Changing the channel and updating firmware should stabilise it.",
        file1: "wifi-site-survey.pdf", file2: "ap-diagnostic-report.pdf",
        note: "Channel change and firmware update scheduled for tonight after hours. A replacement AP is on standby in case the hardware fault persists.",
        today: "Channel reassignment and firmware update completed last night. The 3rd-floor AP has held a stable connection for 12 hours with zero drops. Monitoring before closing.",
        approval1: "Approval Required: Replace 3rd-Floor Wireless Access Point", approval2: "Change Approval: AP Firmware Upgrade & Channel Reassignment",
      },
      'PBM-626': {
        mention: "@Arnav Desai - Can you take a look at this? The mail server stopped receiving external emails after the DNS maintenance window yesterday at 13:00. This looks like it could be an MX record misconfiguration introduced during that window.",
        team: "network and DNS team", to: ['dns.team@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Escalating to the network and DNS team for urgent review. The MX records for the domain appear to have been modified during yesterday's DNS maintenance window. External mail delivery is completely blocked — all external senders are receiving NDR bounce-back notifications...",
        escalateFull: "Escalating to the network and DNS team for urgent review. The MX records for the domain appear to have been modified during yesterday's DNS maintenance window. External mail delivery is completely blocked — all external senders are receiving NDR bounce-back notifications. Internal mail routing between employees remains unaffected, which strongly points to the issue being at the DNS/MX record level. A comparison against the pre-window zone export shows the primary MX priority was changed from 10 to 100 and the secondary record deleted. Requesting restoration of the original MX configuration.",
        origFrom: "Sarah Chen", origMsg: "Hi team — the mail server has not received any inbound external emails since 14:30 yesterday. Internal routing is working fine. Senders are getting NDR bounce-backs. This started right after the DNS maintenance window. Can the DNS team urgently check the MX records for the domain?",
        reply: "I've completed the DNS zone audit and confirmed the MX record misconfiguration introduced during yesterday's maintenance window. The primary MX record priority was changed from 10 to 100 and the secondary record was removed. Restoring the original records should resolve inbound delivery immediately.",
        file1: "dns-zone-comparison.pdf", file2: "mail-server-diagnostic-report.pdf",
        note: "MX record restoration approved and scheduled for tonight at 22:00 during the next maintenance window. DNS TTL has been reduced to 300s in preparation. Will confirm once the records are live and inbound mail delivery is verified.",
        today: "MX record restoration completed at 22:18 last night. Inbound mail delivery has been confirmed working — test messages from external senders are now routing correctly. SPF record verified and intact. Monitoring overnight logs; no further delivery failures detected.",
        approval1: "Approval Required: Restore MX Records & DNS Rollback", approval2: "Emergency Change Approval: Mail Server Configuration Fix",
      },
      'PBM-625': {
        mention: "@Arnav Desai - Can you take a look? We're getting network drops across multiple departments 8–12 times a day, each lasting a few minutes. On-site servers stay reachable so it looks like an internet gateway issue.",
        team: "network operations team", to: ['network.ops@motadata.com', 'noc@motadata.com'],
        escalateShort: "Escalating to network operations. Multiple departments are losing connectivity 8–12 times daily, with cloud apps and VoIP impacted while internal servers stay up...",
        escalateFull: "Escalating to network operations. Multiple departments are losing connectivity 8–12 times daily, with cloud apps and VoIP impacted while internal servers stay up. The pattern points to the internet gateway or upstream ISP link. Gateway logs show WAN interface flaps coinciding with each outage. Requesting an ISP line check and gateway hardware diagnostics.",
        origFrom: "Rohit Sharma", origMsg: "Hi team, our internet keeps dropping for a few minutes several times a day. It's affecting Teams calls and cloud apps. Please investigate.",
        reply: "I've correlated the outage timestamps with WAN interface flaps on the gateway. The attached logs and ISP ticket show repeated upstream link resets. Recommend ISP escalation and gateway failover testing.",
        file1: "gateway-wan-flap-logs.pdf", file2: "isp-line-diagnostics.pdf",
        note: "ISP has acknowledged an upstream fault on our primary circuit. Failover to the secondary link has been configured as a workaround while they repair the line.",
        today: "Primary circuit repaired by the ISP overnight and traffic failed back successfully. No drops recorded in the last 10 hours. Keeping failover armed and monitoring before closing.",
        approval1: "Approval Required: ISP Circuit Failover Configuration", approval2: "Change Approval: Internet Gateway Redundancy Update",
      },
      'PBM-624': {
        mention: "@Arnav Desai - All users can't log into the main business app since 08:45. Existing sessions still work, only new logins time out. Smells like the SSO / identity provider service.",
        team: "identity and access team", to: ['iam.team@motadata.com', 'sso.admin@motadata.com'],
        escalateShort: "Escalating to the identity team. New logins to the business app have failed org-wide since 08:45 while existing sessions remain valid, pointing squarely at the SSO/identity provider...",
        escalateFull: "Escalating to the identity team. New logins to the business app have failed org-wide since 08:45 while existing sessions remain valid, pointing squarely at the SSO/identity provider. The IdP service is responding slowly and token issuance is timing out. Requesting a restart of the IdP service and a review of the token-signing certificate and recent config changes.",
        origFrom: "Anita Verma", origMsg: "Hi team, none of us can log into the application this morning. The page loads but spins and times out after entering the password. Please help urgently.",
        reply: "I've traced the failures to the identity provider's token issuance endpoint timing out under load. The attached logs show thread-pool exhaustion after this morning's config push. Restarting the IdP and rolling back the config restored test logins.",
        file1: "idp-service-logs.pdf", file2: "sso-token-timeout-analysis.pdf",
        note: "IdP service restarted and the morning's configuration change rolled back. Test logins succeeding. Monitoring authentication latency before declaring resolved.",
        today: "Authentication has been stable for 9 hours since the IdP rollback. Login success rate back to 100% and token latency normal. Pending sign-off to close.",
        approval1: "Approval Required: Identity Provider Configuration Rollback", approval2: "Emergency Change Approval: SSO Service Restart",
      },
      'PBM-622': {
        mention: "@Arnav Desai - All outbound external email is bouncing with SPF failures since ~22:00 last night. Internal mail is fine. Looks tied to the DNS maintenance done by the contractor.",
        team: "DNS and messaging team", to: ['dns.team@motadata.com', 'messaging@motadata.com'],
        escalateShort: "Escalating to the DNS and messaging team. Every outbound external email is bouncing with SPF authentication failures since 22:00, while internal routing is unaffected...",
        escalateFull: "Escalating to the DNS and messaging team. Every outbound external email is bouncing with SPF authentication failures since 22:00, while internal routing is unaffected. A diff of the DNS TXT records shows the SPF record was overwritten during last night's maintenance and no longer lists our sending mail servers. Requesting restoration of the correct SPF record.",
        origFrom: "Karan Mehta", origMsg: "Hi team, none of my emails to customers are going through — they all bounce back. Internal emails work fine. Started last night. Please fix urgently.",
        reply: "Confirmed the SPF TXT record was overwritten during the maintenance window and no longer includes our mail gateways. The attached record diff and bounce headers show the exact failure. Restoring the previous SPF value will fix delivery.",
        file1: "spf-record-diff.pdf", file2: "ndr-bounce-headers.pdf",
        note: "Corrected SPF record staged for publication with TTL lowered to 300s. Will verify outbound delivery to external test addresses once it propagates.",
        today: "SPF record republished and propagated. Outbound test emails to Gmail and Outlook are now delivering with SPF pass. No new bounces in the last 8 hours. Ready to close pending confirmation.",
        approval1: "Approval Required: Restore SPF DNS Record", approval2: "Change Approval: Outbound Mail Authentication Fix",
      },
      'PBM-621': {
        mention: "@Arnav Desai - The floor-2 shared LaserJet has been dead for 2 days. Jobs queue but never print, and it ignores diagnostic pages from its own panel. Looks like a firmware/controller fault.",
        team: "print services team", to: ['print.services@motadata.com', 'desktop.support@motadata.com'],
        escalateShort: "Escalating to print services. The floor-2 LaserJet queues jobs but never prints and won't run its own diagnostic page, suggesting an internal controller or firmware fault...",
        escalateFull: "Escalating to print services. The floor-2 LaserJet queues jobs but never prints and won't run its own diagnostic page, suggesting an internal controller or firmware fault. Spooler restarts only allow job cancellation. Recommend a cold reset and firmware reflash; if it remains unresponsive, raise a hardware RMA.",
        origFrom: "Sneha Kulkarni", origMsg: "Hi team, the printer near the floor-2 pantry hasn't printed anything for two days. It shows Ready but nothing comes out. Can someone look at it?",
        reply: "Performed a cold reset and attempted a firmware reflash. The attached service log shows the controller failing POST. This points to a hardware fault rather than software — recommending RMA.",
        file1: "printer-service-log.pdf", file2: "firmware-reflash-report.pdf",
        note: "Vendor RMA raised for the faulty print controller. A loaner unit has been deployed on floor 2 so users can print while the replacement ships.",
        today: "Replacement printer installed and configured on floor 2. Test pages and queued jobs all printing correctly. Faulty unit returned to vendor. Pending sign-off to close.",
        approval1: "Approval Required: Printer Hardware RMA & Replacement", approval2: "Change Approval: Floor-2 Print Controller Swap",
      },
      'PBM-620': {
        mention: "@Arnav Desai - Logins are taking 5–10 minutes org-wide and GPOs aren't applying. The primary DC is logging Event 1311 and 1988 replication errors. Looks like AD replication is broken.",
        team: "directory services team", to: ['ad.team@motadata.com', 'wintel@motadata.com'],
        escalateShort: "Escalating to directory services. Org-wide login delays of 5–10 minutes and failed GPO application correlate with Event 1311/1988 replication errors on the primary DC...",
        escalateFull: "Escalating to directory services. Org-wide login delays of 5–10 minutes and failed GPO application correlate with Event 1311/1988 replication errors on the primary DC. Replication between domain controllers has stalled, likely from last week's maintenance. Requesting a lingering-object cleanup and a forced replication once the topology is healthy.",
        origFrom: "Vikram Rao", origMsg: "Hi team, signing into Windows is taking forever this week and my mapped drives aren't showing up. Several colleagues have the same problem.",
        reply: "Diagnosed stalled AD replication with lingering objects on DC02. The attached repadmin output and event logs confirm Event 1311/1988. Cleaned the lingering objects and forced replication in the lab successfully.",
        file1: "repadmin-showrepl.pdf", file2: "ad-replication-event-logs.pdf",
        note: "Lingering-object cleanup scheduled for tonight's maintenance window followed by a forced replication and topology health check across all DCs.",
        today: "Replication restored overnight — repadmin now shows all DCs in sync with no errors. Login times back to normal (under 10s) and GPOs applying correctly. Monitoring before closing.",
        approval1: "Approval Required: AD Lingering-Object Cleanup", approval2: "Change Approval: Domain Controller Replication Repair",
      },
      'PBM-618': {
        mention: "@Arnav Desai - Users can't reach internal apps by hostname (intranet, erp) though direct IP works. The DNS server is up but returning NXDOMAIN. Looks like A records went missing.",
        team: "DNS and network team", to: ['dns.team@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Escalating to the DNS team. Internal hostnames are returning NXDOMAIN while direct IP access works, and a zone audit shows ~12 critical A records missing from the Forward Lookup Zone...",
        escalateFull: "Escalating to the DNS team. Internal hostnames are returning NXDOMAIN while direct IP access works, and a zone audit shows ~12 critical A records missing from the Forward Lookup Zone. This looks like an accidental deletion or failed import during recent maintenance. Requesting restoration of the missing records from the last good zone backup.",
        origFrom: "Deepak Joshi", origMsg: "Hi team, I can't open the intranet or ERP by their normal addresses — they just fail to load. Using the IP works though. Please check DNS.",
        reply: "Confirmed ~12 internal A records are missing from the Forward Lookup Zone. The attached zone audit and backup comparison identify each one. Re-importing them from the last good backup restores resolution.",
        file1: "dns-zone-audit.pdf", file2: "missing-a-records-list.pdf",
        note: "Missing A records staged for re-import from the verified zone backup. Change scheduled for the maintenance window with a DNS cache flush afterward.",
        today: "All missing A records re-imported and DNS caches flushed. Internal hostnames now resolving correctly for intranet, ERP and the other affected services. Monitoring before closing.",
        approval1: "Approval Required: Restore Missing DNS A Records", approval2: "Change Approval: Forward Lookup Zone Recovery",
      },
      'PBM-617': {
        mention: "@Arnav Desai - The business app is crawling every day 9 AM–2 PM with CPU at 85–95%, then fine after. User load is flat, so a recent deployment likely introduced a regression.",
        team: "application performance team", to: ['app.support@motadata.com', 'devops@motadata.com'],
        escalateShort: "Escalating to the application team. Daily peak-hour slowdowns with CPU at 85–95% and 300%+ response times, despite flat user load, point to a code regression from a recent deployment...",
        escalateFull: "Escalating to the application team. Daily peak-hour slowdowns with CPU at 85–95% and 300%+ response times, despite flat user load, point to a code regression from a recent deployment. Profiling shows a hot path in a recently changed query under concurrency. Requesting review of the last release and a possible rollback or hotfix.",
        origFrom: "Meera Iyer", origMsg: "Hi team, the application is painfully slow every morning until about 2 PM, then it's fine. It's making it hard to get work done. Please look into it.",
        reply: "Profiled the app during peak load and isolated an unindexed query introduced in the last release. The attached profiler trace and query plan show the regression. Adding the index in staging cut response times back to baseline.",
        file1: "app-profiler-trace.pdf", file2: "slow-query-execution-plan.pdf",
        note: "Index hotfix validated in staging. Deployment scheduled for tonight's window with a rollback plan ready in case of side effects.",
        today: "Index hotfix deployed last night. This morning's peak hours stayed under 25% CPU with response times back to 1–2s. Regression resolved — monitoring one more peak cycle before closing.",
        approval1: "Approval Required: Database Index Hotfix Deployment", approval2: "Change Approval: Peak-Hour Performance Regression Fix",
      },
      'PBM-616': {
        mention: "@Arnav Desai - The customer portal cert expired at midnight and every browser is blocking access. The 30-day expiry alert never fired. Need an emergency renewal.",
        team: "security and PKI team", to: ['security.team@motadata.com', 'pki.admin@motadata.com'],
        escalateShort: "Escalating to the security team. The portal SSL certificate expired at 23:59 and all browsers are blocking customer access; the expiry monitoring alert failed to fire...",
        escalateFull: "Escalating to the security team. The portal SSL certificate expired at 23:59 and all browsers are blocking customer access; the expiry monitoring alert failed to fire. Investigation shows the alert rule was disabled during a monitoring migration two months ago. Requesting an emergency certificate renewal and re-enablement of expiry monitoring.",
        origFrom: "Customer Success", origMsg: "Hi team, customers are reporting they can't reach our portal — they see a 'connection not private' security warning. This is blocking sign-ups. Please fix ASAP.",
        reply: "Confirmed the certificate expired overnight and the expiry alert was disabled during the monitoring migration. The attached cert details and alert-rule audit show both issues. Emergency renewal is in progress.",
        file1: "ssl-certificate-details.pdf", file2: "monitoring-alert-audit.pdf",
        note: "Emergency certificate issued and staged for installation. Expiry monitoring alert rule re-enabled with a 30/14/7-day reminder schedule to prevent recurrence.",
        today: "New certificate installed on the portal and verified across Chrome, Firefox, Edge and Safari — no warnings. Customer access restored. Expiry monitoring confirmed active. Ready to close.",
        approval1: "Approval Required: Emergency SSL Certificate Renewal", approval2: "Change Approval: Certificate Expiry Monitoring Restoration",
      },
      'PBM-615': {
        mention: "@Arnav Desai - No remote users can RDP to their office PCs since Thursday's NPS change — they get auth error 0x507 instantly. On-site RDP is fine. Likely the NPS policy.",
        team: "network access team", to: ['nps.admin@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Escalating to the network access team. 100% of remote RDP sessions fail with auth error 0x507 since Thursday's NPS change, while on-site RDP works...",
        escalateFull: "Escalating to the network access team. 100% of remote RDP sessions fail with auth error 0x507 since Thursday's NPS change, while on-site RDP works. The change appears to have removed an allowed authentication method or RDP user group from the network policy. Requesting review and rollback of Thursday's NPS configuration.",
        origFrom: "Arjun Nair", origMsg: "Hi team, I can't remote into my office computer from home — it fails immediately with an authentication error. Worked fine until Thursday. Please help.",
        reply: "Compared the NPS policy against the pre-Thursday backup and found the RDP user group and NTLMv2 method were dropped. The attached policy diff confirms it. Restoring the previous policy fixed RDP in testing.",
        file1: "nps-policy-diff.pdf", file2: "rdp-auth-error-trace.pdf",
        note: "NPS policy rollback scheduled for tonight. Will re-add the allowed auth methods and RDP user group, then validate remote RDP for a pilot group before full confirmation.",
        today: "NPS policy restored last night. Remote RDP now connecting successfully for all pilot users with no 0x507 errors. Broad confirmation underway before closing.",
        approval1: "Approval Required: NPS Policy Rollback", approval2: "Change Approval: Remote Desktop Access Restoration",
      },
      'PBM-614': {
        mention: "@Arnav Desai - The new 3-attempt lockout policy has locked 200+ accounts and the helpdesk is buried. Mobile users get locked after one typo. We need to revisit the threshold.",
        team: "security and IAM team", to: ['security.team@motadata.com', 'iam.team@motadata.com'],
        escalateShort: "Escalating to the security team. The new 3-attempt lockout threshold has locked 200+ accounts, mostly from mobile typos, and the helpdesk has 180+ unlock requests...",
        escalateFull: "Escalating to the security team. The new 3-attempt lockout threshold has locked 200+ accounts, mostly from mobile typos, and the helpdesk has 180+ unlock requests. The policy is too aggressive for mobile endpoints. Requesting approval to raise the threshold to 5 attempts or apply a separate, more lenient policy for mobile devices.",
        origFrom: "HR Operations", origMsg: "Hi team, a lot of staff are locked out of their accounts since yesterday and can't work. It seems to happen very easily now. Please advise.",
        reply: "Analysed the lockout events — the majority originate from mobile devices hitting the 3-attempt limit. The attached lockout report and policy analysis support raising the threshold to 5 with a mobile-specific exception.",
        file1: "account-lockout-report.pdf", file2: "password-policy-analysis.pdf",
        note: "Revised policy (5 attempts, separate mobile policy) drafted and pending security approval. A bulk account unlock is prepared to clear the existing backlog once approved.",
        today: "Revised lockout policy applied and all 200+ affected accounts unlocked in bulk. Lockout rate has dropped to normal levels and helpdesk volume is back to baseline. Monitoring before closing.",
        approval1: "Approval Required: Revise Account Lockout Threshold", approval2: "Change Approval: Mobile Password Policy Exception",
      },
      'PBM-613': {
        mention: "@Arnav Desai - Branch users (Bangalore, Pune) can't reach the HQ file server since Tuesday's firewall firmware upgrade. HQ users are fine. Looks like the new firmware changed the ACLs.",
        team: "network security team", to: ['netsec@motadata.com', 'firewall.admin@motadata.com'],
        escalateShort: "Escalating to network security. Branch offices lost access to the HQ file server right after Tuesday's firewall firmware upgrade, while HQ access is unaffected...",
        escalateFull: "Escalating to network security. Branch offices lost access to the HQ file server right after Tuesday's firewall firmware upgrade, while HQ access is unaffected. The v8.0.4 firmware appears to have changed default ACL behavior for site-to-site SMB traffic on port 445. Requesting an ACL review to re-allow the branch subnets.",
        origFrom: "Branch IT - Bangalore", origMsg: "Hi team, none of us at the Bangalore branch can open the HQ shared drive since Tuesday — we get 'network path not found'. HQ staff have no issues. Please help.",
        reply: "Confirmed the firmware upgrade reset the site-to-site ACL and is now blocking SMB/445 from the branch subnets. The attached firewall config diff and packet captures show the drops. Re-adding the branch allow-rules restored access in testing.",
        file1: "firewall-config-diff.pdf", file2: "smb-packet-capture.pdf",
        note: "Corrected ACL rules to re-allow branch subnets on port 445 staged for tonight's change window, with a rollback snapshot of the current firewall config taken.",
        today: "ACL rules restored last night. Bangalore and Pune branches now have full access to the HQ file server again. SMB traffic flowing normally with no drops. Monitoring before closing.",
        approval1: "Approval Required: Firewall ACL Rule Restoration", approval2: "Change Approval: Site-to-Site SMB Access Fix",
      },
      'PBM-612': {
        mention: "@Arnav Desai - The nightly DB backup has failed 5 nights running with I/O timeouts at ~68%. The backup SAN volume's write latency jumped from 8ms to 2,000ms after a controller firmware update.",
        team: "storage and backup team", to: ['storage.team@motadata.com', 'backup.admin@motadata.com'],
        escalateShort: "Escalating to the storage team. The nightly backup has failed five nights in a row with I/O timeouts at 68%, and write latency on the backup volume has spiked from 8ms to 2,000ms...",
        escalateFull: "Escalating to the storage team. The nightly backup has failed five nights in a row with I/O timeouts at 68%, and write latency on the backup volume has spiked from 8ms to 2,000ms. The spike began right after a SAN controller firmware update, which likely altered I/O scheduling for this volume. Requesting firmware review and a possible rollback.",
        origFrom: "DBA Team", origMsg: "Hi team, our database backups have been failing every night this week. We need reliable backups urgently for compliance. Please investigate the storage.",
        reply: "Confirmed the backup-target volume's write latency degraded immediately after the SAN firmware update while other volumes are fine. The attached latency graphs and firmware notes point to the new I/O scheduler. Rolling back firmware in the lab restored normal latency.",
        file1: "san-latency-graphs.pdf", file2: "backup-job-failure-logs.pdf",
        note: "SAN controller firmware rollback scheduled for the maintenance window. An out-of-band manual backup has been taken in the meantime to close the compliance gap.",
        today: "Firmware rolled back overnight and write latency is back to ~8ms. Last night's scheduled backup completed successfully end-to-end for the first time in a week. Monitoring the next two runs before closing.",
        approval1: "Approval Required: SAN Controller Firmware Rollback", approval2: "Change Approval: Backup Storage Performance Fix",
      },
      'PBM-611': {
        mention: "@Arnav Desai - The production server's been at 100% CPU for 18 hours. One IIS worker is eating 94% and it correlates with the 05:30 deployment. Recycling only helps for 10–15 min.",
        team: "platform engineering team", to: ['platform.eng@motadata.com', 'devops@motadata.com'],
        escalateShort: "Escalating to platform engineering. Production CPU has been pinned at 100% for 18 hours with a single IIS worker at 94%, correlating with this morning's 05:30 deployment...",
        escalateFull: "Escalating to platform engineering. Production CPU has been pinned at 100% for 18 hours with a single IIS worker at 94%, correlating with this morning's 05:30 deployment. App-pool recycling only helps for 10–15 minutes. A spike on one API endpoint lines up with the release. Requesting a rollback of the 05:30 deployment.",
        origFrom: "NOC", origMsg: "Hi team, the production application is extremely slow and timing out for users. Server CPU alarms have been firing since early this morning. Please action urgently.",
        reply: "Captured a CPU profile pinning the hot path to a new API handler from the 05:30 release looping under load. The attached dump and flame graph show it clearly. Rolling back the deployment dropped CPU to normal in staging.",
        file1: "cpu-profile-dump.pdf", file2: "iis-worker-flamegraph.pdf",
        note: "Rollback of the 05:30 deployment approved and scheduled immediately. Dev team notified to fix the runaway handler before any re-deployment.",
        today: "Deployment rolled back and production CPU has held at 15–20% for 10 hours. All services responsive again. The faulty build is quarantined pending a fix. Pending sign-off to close.",
        approval1: "Approval Required: Emergency Production Rollback", approval2: "Change Approval: Runaway API Handler Remediation",
      },
      'PBM-610': {
        mention: "@Arnav Desai - The core switch is throwing 500+ CRC errors/sec on 4 ports with 2–8% packet loss to our key servers. It started after last week's cabling work. Likely damaged cabling.",
        team: "network infrastructure team", to: ['network.team@motadata.com', 'datacenter.ops@motadata.com'],
        escalateShort: "Escalating to network infrastructure. Four core-switch ports are logging 500+ CRC errors/sec with 2–8% packet loss to critical servers since last week's cabling work...",
        escalateFull: "Escalating to network infrastructure. Four core-switch ports are logging 500+ CRC errors/sec with 2–8% packet loss to critical servers since last week's cabling work. CRC errors at the physical layer point to damaged cabling or connectors. Requesting re-termination/replacement of the affected runs and SFP checks during a maintenance window.",
        origFrom: "Server Team", origMsg: "Hi team, file transfers between our servers are slow and some apps intermittently fail. Network monitoring is alerting on errors at the core switch. Please check.",
        reply: "Confirmed CRC errors localized to four ports connecting the DB, file cluster and two app servers — all touched during last week's cable work. The attached interface counters and cable test results indicate physical damage. Re-terminating the runs cleared errors on a test port.",
        file1: "switch-interface-counters.pdf", file2: "cable-test-results.pdf",
        note: "Cable re-termination and SFP replacement for the four affected ports scheduled for tonight's window. Traffic will be shifted to redundant links during the work.",
        today: "Cabling re-terminated and SFPs replaced overnight. CRC errors are now at zero and packet loss is gone on all four links. File transfers back to full speed. Monitoring before closing.",
        approval1: "Approval Required: Core Switch Cabling Replacement", approval2: "Change Approval: Server Link Re-termination",
      },
      'PBM-609': {
        mention: "@Arnav Desai - 340 of 420 endpoints haven't pulled AV definitions for 7 days. The agent service is stopped on every device I checked. Lines up with Windows Update KB5034127.",
        team: "endpoint security team", to: ['endpoint.security@motadata.com', 'desktop.support@motadata.com'],
        escalateShort: "Escalating to endpoint security. 340 of 420 endpoints are 7 days behind on AV definitions, with the agent service stopped on every sampled device since KB5034127 deployed...",
        escalateFull: "Escalating to endpoint security. 340 of 420 endpoints are 7 days behind on AV definitions, with the agent service stopped on every sampled device since KB5034127 deployed. The vendor has confirmed the incompatibility and provided a patched agent. Requesting approval to deploy the patched agent fleet-wide and restore protection.",
        origFrom: "Security Operations", origMsg: "Hi team, our endpoint dashboard shows most machines are out of date on antivirus definitions. This is a security exposure — please prioritise getting them updated.",
        reply: "Confirmed the agent service stops at boot after KB5034127 and won't auto-restart. The attached vendor advisory and affected-device list match. The vendor's patched agent installs cleanly and survives reboot in testing.",
        file1: "vendor-compatibility-advisory.pdf", file2: "affected-endpoints-list.pdf",
        note: "Patched endpoint agent staged in the deployment tool and validated on a pilot ring. Phased rollout to the 340 affected devices scheduled over the next two evenings.",
        today: "Patched agent rolled out to all affected endpoints. The agent service now stays running through reboots and definitions are current fleet-wide (419/420). Chasing the last device before closing.",
        approval1: "Approval Required: Patched Endpoint Agent Deployment", approval2: "Change Approval: Antivirus Service Remediation",
      },
      'PBM-608': {
        mention: "@Arnav Desai - The user's laptop won't boot past the Windows logo after Monday's OS update and remote tools can't reach it. There's unsynced local data — we need recovery plus a loaner.",
        team: "desktop support team", to: ['desktop.support@motadata.com', 'datarecovery@motadata.com'],
        escalateShort: "Escalating to desktop support. The laptop is stuck in a boot loop after the OS update and is unreachable remotely, with locally stored files not yet synced to OneDrive...",
        escalateFull: "Escalating to desktop support. The laptop is stuck in a boot loop after the OS update and is unreachable remotely, with locally stored files not yet synced to OneDrive. A loaner has been arranged so the user can keep working. Requesting offline boot recovery and data extraction before any reimage.",
        origFrom: "Demo User", origMsg: "Hi team, my laptop stopped booting after a Windows update on Monday and just loops on the logo. I have important files saved locally that aren't backed up. I urgently need them recovered.",
        reply: "Booted the device into recovery and confirmed the update corrupted the boot configuration. The attached recovery log and file inventory show the local data is intact and extractable. Recovering files before reimaging.",
        file1: "boot-recovery-log.pdf", file2: "local-file-inventory.pdf",
        note: "Loaner laptop allocated to the user. Local data extraction in progress from the affected device; reimage will follow once files are recovered and verified.",
        today: "Local files recovered and verified, then synced to the user's OneDrive. Original laptop reimaged with the stable OS build and returned. Loaner collected. Pending sign-off to close.",
        approval1: "Approval Required: Loaner Laptop Allocation", approval2: "Change Approval: Data Recovery & Device Reimaging",
      },
      'PBM-607': {
        mention: "@Arnav Desai - The finance workstation's disk is reporting SMART 'FAILING NOW' with clicking noises and Excel corruption. There's unbacked-up financial data — we need recovery before it dies.",
        team: "data recovery team", to: ['datarecovery@motadata.com', 'desktop.support@motadata.com'],
        escalateShort: "Escalating to data recovery. The finance workstation's disk shows SMART 'FAILING NOW' with reallocated sectors and read errors on unbacked-up financial data...",
        escalateFull: "Escalating to data recovery. The finance workstation's disk shows SMART 'FAILING NOW' with reallocated sectors and read errors on unbacked-up financial data. Risk of total failure is high. Requesting an immediate priority imaging/recovery of the drive before any hardware replacement, with a replacement SSD already on order.",
        origFrom: "Finance Department", origMsg: "Hi team, my computer is making clicking noises and some Excel files won't open. I have quarter-end reports saved locally that aren't backed up. Please help before I lose them!",
        reply: "Confirmed the drive is failing — SMART critical with multiple reallocated sectors. The attached SMART report and recovery plan outline a priority block-level image before the disk degrades further. Imaging has started.",
        file1: "smart-diagnostic-report.pdf", file2: "data-recovery-plan.pdf",
        note: "Block-level image in progress on dedicated recovery hardware. Replacement SSD received; reimaging will follow once data is safely recovered and verified.",
        today: "Drive imaged successfully and all financial files recovered and verified against checksums. Replacement SSD installed and workstation reimaged. Recovered data restored and synced to the network share. Pending sign-off to close.",
        approval1: "Approval Required: Priority Data Recovery Engagement", approval2: "Change Approval: Finance Workstation Disk Replacement",
      },
      'PBM-601': {
        mention: "@Arnav Desai - Video call audio is terrible for everyone this week — choppy, echo, dropouts — on Teams, Zoom and Meet equally. Cross-platform like that points to network QoS.",
        team: "network and collaboration team", to: ['network.ops@motadata.com', 'collab.support@motadata.com'],
        escalateShort: "Escalating to the network team. Audio dropouts and echo affect Teams, Zoom and Meet equally and worsen when many users are on calls, pointing to a QoS/bandwidth issue...",
        escalateFull: "Escalating to the network team. Audio dropouts and echo affect Teams, Zoom and Meet equally and worsen when many users are on calls, pointing to a QoS/bandwidth issue. Packet analysis shows voice/video traffic isn't being prioritized over general data. Requesting a QoS policy update on the switches to prioritize RTP traffic.",
        origFrom: "Operations Team", origMsg: "Hi team, our video meetings have had awful audio all week — people cut out and there's a lot of echo. It's happening on every platform. Please look into it.",
        reply: "Captured call traffic and confirmed RTP packets are being treated as best-effort with high jitter under load. The attached QoS analysis and jitter report support adding DSCP marking and priority queuing for voice/video.",
        file1: "qos-traffic-analysis.pdf", file2: "voip-jitter-report.pdf",
        note: "QoS policy updated to mark and prioritize RTP traffic, staged for rollout across the switch fabric tonight with a config backup taken first.",
        today: "QoS policy deployed last night. Test calls across Teams, Zoom and Meet are now clear with jitter well within target even under load. Gathering user confirmation before closing.",
        approval1: "Approval Required: Network QoS Policy Update", approval2: "Change Approval: Voice/Video Traffic Prioritization",
      },
      'PBM-600': {
        mention: "@Arnav Desai - After the weekend file server migration, permissions are a mess — some users lost access, others can now see sensitive folders. Looks like ACL inheritance broke.",
        team: "storage and security team", to: ['storage.team@motadata.com', 'security.team@motadata.com'],
        escalateShort: "Escalating to storage and security. Post-migration, inherited permissions weren't propagated correctly — users have both lost legitimate access and gained access to sensitive folders...",
        escalateFull: "Escalating to storage and security. Post-migration, inherited permissions weren't propagated correctly — users have both lost legitimate access and gained access to sensitive folders. 'Replace all child permissions' was applied to several top-level folders during migration. Requesting restoration of the ACL structure from the pre-migration export.",
        origFrom: "Department Heads", origMsg: "Hi team, since the weekend migration several of us can't open folders we need, and worryingly some people can see confidential folders they shouldn't. Please fix urgently.",
        reply: "Audited the share and confirmed inheritance was overwritten on several top-level folders. The attached permission audit and pre-migration ACL export let us restore the correct structure. A test restore on one tree validated cleanly.",
        file1: "permission-audit-report.pdf", file2: "pre-migration-acl-export.pdf",
        note: "ACL restoration from the pre-migration export staged and scheduled. Sensitive folders will be locked down first to close the exposure, then full inheritance reapplied.",
        today: "ACL structure restored across the share from the verified export. Spot checks confirm users have correct access and sensitive folders are locked down again. Running a full permissions report before closing.",
        approval1: "Approval Required: File Server ACL Restoration", approval2: "Change Approval: Sensitive Folder Access Remediation",
      },
      'PBM-599': {
        mention: "@Arnav Desai - Production crashed at 03:17 with a kernel panic and was down 2h40m. Crash dumps point to the new payment module from last night's deploy. Rollback restored service at 05:57.",
        team: "platform engineering team", to: ['platform.eng@motadata.com', 'payments.dev@motadata.com'],
        escalateShort: "Escalating to platform engineering. The 03:17 kernel panic traced to a null-pointer dereference in the new payment module under concurrent load; rollback restored service at 05:57...",
        escalateFull: "Escalating to platform engineering. The 03:17 kernel panic traced to a null-pointer dereference in the new payment module under concurrent load; rollback restored service at 05:57. The fault triggers above ~15 concurrent transactions in a 100ms window — a race condition from last night's deploy. Requesting the module stay quarantined until the race condition is fixed and load-tested.",
        origFrom: "On-call Engineer", origMsg: "Team, production went down hard at 03:17 — full outage, kernel panic. I rolled back the 22:00 release and we came back at 05:57. Raising this for root-cause and a permanent fix.",
        reply: "Reproduced the crash in staging at 20 concurrent transactions and isolated the null-pointer dereference in the payment handler. The attached crash dump analysis and reproduction notes detail the race condition. Fix is in development.",
        file1: "crash-dump-analysis.pdf", file2: "race-condition-repro.pdf",
        note: "Payment module quarantined from production and a daily health-check alert added for the payment service. Fix in development with a load test at 20+ concurrent transactions required before re-deploy.",
        today: "Post-mortem completed and the race-condition fix is in code review. Production stable since the 05:57 rollback with no recurrence. Module remains quarantined pending load-tested re-deployment. Pending sign-off to close.",
        approval1: "Approval Required: Payment Module Re-deployment Gate", approval2: "Emergency Change Approval: Production Rollback Post-Mortem",
      },
      'PBM-598': {
        mention: "@Arnav Desai - The database has gotten very slow over two weeks — queries from <1s to 30s+. Index fragmentation is 87–94% because the nightly rebuild job has been off for 30 days.",
        team: "database administration team", to: ['dba.team@motadata.com', 'app.support@motadata.com'],
        escalateShort: "Escalating to the DBA team. Query times have grown from under a second to 30s+ with index fragmentation at 87–94% after the nightly rebuild job was disabled 30 days ago...",
        escalateFull: "Escalating to the DBA team. Query times have grown from under a second to 30s+ with index fragmentation at 87–94% after the nightly rebuild job was disabled 30 days ago. Requesting an index rebuild on the top-queried tables and re-enablement of the scheduled maintenance job to prevent recurrence.",
        origFrom: "Reporting Team", origMsg: "Hi team, our reports that used to run in seconds now take minutes, and some batch jobs are timing out. It's been getting worse for two weeks. Please investigate the database.",
        reply: "Confirmed 87–94% fragmentation on the top 10 tables and traced the cause to the disabled SQL Agent maintenance job. The attached fragmentation report and job history show it. A rebuild in staging brought query times back to baseline.",
        file1: "index-fragmentation-report.pdf", file2: "sql-agent-job-history.pdf",
        note: "Index rebuild scheduled for tonight's low-usage window and the nightly maintenance job re-enabled and verified. A statistics update is included in the plan.",
        today: "Index rebuild completed overnight and the maintenance job is running on schedule again. Query times are back under a second and batch jobs finishing within their windows. Monitoring before closing.",
        approval1: "Approval Required: Database Index Rebuild", approval2: "Change Approval: SQL Maintenance Job Restoration",
      },
      'PBM-597': {
        mention: "@Arnav Desai - The app slowly eats all 32GB RAM over 8–10 hours until it crashes. Heap dumps point to the PDF report module not disposing objects. A daily 06:00 restart is the band-aid for now.",
        team: "application engineering team", to: ['app.eng@motadata.com', 'devops@motadata.com'],
        escalateShort: "Escalating to application engineering. A memory leak consumes all 32GB over 8–10 hours, isolated by heap dumps to the PDF report module leaking ~3GB/hour; a daily restart is the current workaround...",
        escalateFull: "Escalating to application engineering. A memory leak consumes all 32GB over 8–10 hours, isolated by heap dumps to the PDF report module leaking ~3GB/hour; a daily restart is the current workaround. The module fails to dispose document objects, especially on interrupted report generation. A patch is in QA. Requesting approval to deploy once it passes.",
        origFrom: "Operations Team", origMsg: "Hi team, the application keeps slowing down and becoming unresponsive each day until it's restarted in the morning. Can we get a permanent fix rather than the daily restart?",
        reply: "Heap-dump analysis confirms undisposed PDF document objects accumulating at ~3GB/hour. The attached memory profile and leak trace pinpoint the code path. The patch disposes objects correctly and held flat memory through an 18-hour soak test.",
        file1: "heap-dump-analysis.pdf", file2: "memory-leak-trace.pdf",
        note: "Leak fix passed QA soak testing. Deployment scheduled for the next maintenance window; the daily 06:00 restart workaround stays in place until the fix is confirmed stable.",
        today: "Patch deployed and the daily restart disabled. Memory has held steady at ~40% for 20 hours with no growth through several report cycles. Leak resolved — monitoring 24h before closing.",
        approval1: "Approval Required: Memory Leak Patch Deployment", approval2: "Change Approval: PDF Module Disposal Fix",
      },
      'PBM-596': {
        mention: "@Arnav Desai - About half our remote workers are getting randomly dropped from the VPN since last week's cert renewal. Logs show cert chain validation failures — looks like a missing intermediate CA.",
        team: "network security team", to: ['netsec@motadata.com', 'vpn.admin@motadata.com'],
        escalateShort: "Escalating to network security. ~50% of remote workers face random VPN drops with certificate chain validation failures since last week's gateway cert renewal...",
        escalateFull: "Escalating to network security. ~50% of remote workers face random VPN drops with certificate chain validation failures since last week's gateway cert renewal. The leaf certificate was renewed but the intermediate CA in the trust chain wasn't updated to match the new issuer. Requesting installation of the correct intermediate certificate on the gateway.",
        origFrom: "Remote Workforce", origMsg: "Hi team, the VPN keeps disconnecting me randomly through the day and I lose unsaved work each time. Several remote colleagues have the same issue since last week. Please fix.",
        reply: "Confirmed the gateway is missing the updated intermediate CA, causing intermittent chain validation failures. The attached gateway logs and certificate chain analysis show the mismatch. Installing the correct intermediate fixed validation in testing.",
        file1: "vpn-gateway-logs.pdf", file2: "certificate-chain-analysis.pdf",
        note: "Correct intermediate CA certificate staged for installation on the VPN gateway tonight, with a rollback of the current cert bundle captured beforehand.",
        today: "Intermediate CA installed last night and the trust chain now validates fully. No VPN disconnections reported in the last 9 hours across the remote user base. Monitoring before closing.",
        approval1: "Approval Required: VPN Gateway Certificate Chain Fix", approval2: "Change Approval: Intermediate CA Installation",
      },
    };
    return map[id ?? ''] ?? {
      mention: "@Arnav Desai - Can you take a look at this problem? It's been reported and needs investigation to identify the root cause.",
      team: "support team", to: ['support.team@motadata.com', 'it.ops@motadata.com'],
      escalateShort: "Escalating to the support team for investigation. The issue has been logged and we're working to identify the root cause...",
      escalateFull: "Escalating to the support team for investigation. The issue has been logged and we're working to identify the root cause. Further updates will be added as the analysis progresses.",
      origFrom: "Requester", origMsg: "Hi team, please look into this issue as it's affecting our work. Let me know if you need any more details.",
      reply: "I've completed the initial investigation and gathered diagnostics. The attached reports summarize the findings and proposed next steps.",
      file1: "investigation-report.pdf", file2: "diagnostic-summary.pdf",
      note: "Remediation plan drafted and scheduled for the next maintenance window. Will confirm once applied and verified.",
      today: "Fix applied and verified — the issue is no longer reproducing. Monitoring before moving to resolution. Pending sign-off to close.",
      approval1: "Approval Required: Problem Resolution Plan", approval2: "Change Approval: Remediation Deployment",
    };
  };

  const thread = getProblemThread(activeProblem?.id);

  // Affected tickets + assets for this problem (drives the Impact summary and the Relations tab)
  const getProblemImpact = (id?: string) => {
    const mk = (type: string, ticketId: string, subject: string, status: string, priority: string, assignee = 'Unassigned') => ({
      id: `${id}-${ticketId}`, type, ticketId, subject, status, assignedTo: { name: assignee }, priority,
    });
    const map: Record<string, ReturnType<typeof mk>[]> = {
      'PBM-627': [
        mk('Request', 'INC-1042', 'WiFi keeps disconnecting on 3rd floor', 'Open', 'High', 'Diksha Patel'),
        mk('Request', 'INC-1048', 'Cannot stay connected to office WiFi', 'Open', 'Medium', 'Rahul Dev'),
        mk('Request', 'INC-1051', 'Frequent WiFi drops near the east wing', 'In Progress', 'Medium', 'Hemal Joshi'),
        mk('Request', 'INC-1055', 'WiFi slow and dropping in meeting room 3B', 'Open', 'Low', 'Sakshi Gupta'),
        mk('Request', 'INC-1060', '3rd floor WiFi unusable during peak hours', 'Open', 'High', 'Manasvi Shah'),
        mk('Asset', 'AST-3301', 'Cisco Aironet AP — 3rd Floor East', 'In Use', 'High', 'Network Team'),
        mk('Asset', 'AST-3302', 'Cisco WLC — Wireless Controller', 'In Use', 'High', 'Network Team'),
        mk('CI', 'CI-201', 'Wireless LAN Service — 3rd Floor', 'Operational', 'High', 'Network Team'),
        mk('CI', 'CI-204', 'Campus WiFi Controller Cluster', 'Operational', 'Medium', 'Network Team'),
      ],
      'PBM-626': [
        mk('Request', 'INC-2011', 'Not receiving external emails', 'Open', 'P1', 'Diksha Patel'),
        mk('Request', 'INC-2014', 'Customer emails to us are bouncing', 'Open', 'P1', 'Manasvi Shah'),
        mk('Request', 'INC-2019', 'No inbound mail since yesterday afternoon', 'In Progress', 'High', 'Pavan Mehta'),
        mk('Request', 'INC-2023', 'Vendor says their emails fail to deliver', 'Open', 'High', 'Saahil Joshi'),
        mk('Asset', 'AST-5001', 'Exchange Mail Server — MX01', 'In Use', 'P1', 'Mail Admin'),
        mk('Asset', 'AST-5002', 'DNS Server — NS01', 'In Use', 'High', 'DNS Team'),
        mk('CI', 'CI-310', 'Corporate Mail Service', 'Operational', 'P1', 'Mail Admin'),
        mk('CI', 'CI-312', 'External DNS Zone — company.com', 'Operational', 'High', 'DNS Team'),
      ],
      'PBM-624': [
        mk('Request', 'INC-3101', 'Cannot log into the business application', 'Open', 'P1', 'Anita Verma'),
        mk('Request', 'INC-3105', 'Login times out for everyone in finance', 'Open', 'P1', 'Pavan Mehta'),
        mk('Request', 'INC-3108', 'SSO not working since this morning', 'In Progress', 'High', 'Hemal Joshi'),
        mk('Asset', 'AST-6001', 'Identity Provider — SSO01', 'In Use', 'P1', 'IAM Team'),
        mk('CI', 'CI-405', 'Single Sign-On Service', 'Operational', 'P1', 'IAM Team'),
      ],
    };
    return map[id ?? ''] ?? [
      mk('Request', 'INC-1001', 'User reporting the same issue', 'Open', 'Medium', 'Support Team'),
      mk('Request', 'INC-1002', 'Similar issue reported by another user', 'Open', 'Medium', 'Support Team'),
      mk('Request', 'INC-1003', 'Recurring complaint linked to this problem', 'In Progress', 'Low', 'Support Team'),
      mk('Asset', 'AST-2001', 'Affected infrastructure component', 'In Use', 'Medium', 'IT Operations'),
      mk('CI', 'CI-101', 'Dependent business service', 'Operational', 'Medium', 'IT Operations'),
    ];
  };

  const problemImpact = getProblemImpact(activeProblem?.id);
  const totalImpact = problemImpact.length;
  // Dynamic breakdown by type (scales to any number of affected module types)
  const impactByType = Object.entries(
    problemImpact.reduce<Record<string, number>>((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type, count, label: `${count} ${type}${count > 1 ? 's' : ''}` }));

  // Seed the Relations tab with the affected tickets/assets so they're visible to the technician
  useEffect(() => {
    const id = activeProblem?.id;
    if (!id) return;
    setTicketRelations((prev) => (prev[id] ? prev : { ...prev, [id]: problemImpact }));
  }, [activeProblem?.id]);

  // Function to get AI summary text
  const getAiSummaryText = () => {
    const content = getProblemContent(activeProblem?.id);
    const keyPointsText = content.keyPoints.map(point => '• ' + point).join('\n');
    const fullText = content.summary + '\n\nKEY POINTS:\n' + keyPointsText;
    return stripHtmlTags(fullText);
  };

  // Populate content when editors open
  useEffect(() => {
    if (showReplyEditor && replyContent && replyContentRef.current && replyContentRef.current.innerHTML !== replyContent) {
      replyContentRef.current.innerHTML = replyContent;
    }
  }, [showReplyEditor, replyContent]);

  useEffect(() => {
    if (showForwardEditor && forwardContent && forwardContentRef.current && forwardContentRef.current.innerHTML !== forwardContent) {
      forwardContentRef.current.innerHTML = forwardContent;
    }
  }, [showForwardEditor, forwardContent]);

  useEffect(() => {
    if (showCollaborateEditor && collaborateContent && collaborateContentRef.current && collaborateContentRef.current.innerHTML !== collaborateContent) {
      collaborateContentRef.current.innerHTML = collaborateContent;
    }
  }, [showCollaborateEditor, collaborateContent]);

  // Scroll editors into view when they open
  useEffect(() => {
    if (showReplyEditor && replyFormRef.current) {
      setTimeout(() => {
        replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showReplyEditor]);

  useEffect(() => {
    if (showForwardEditor && forwardFormRef.current) {
      setTimeout(() => {
        forwardFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showForwardEditor]);

  useEffect(() => {
    if (showCollaborateEditor && collaborateFormRef.current) {
      setTimeout(() => {
        collaborateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showCollaborateEditor]);

  useEffect(() => {
    if (showNoteEditor && noteFormRef.current) {
      setTimeout(() => {
        noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showNoteEditor]);

  useEffect(() => {
    if (hasDiagnosis && diagnosisFormRef.current) {
      setTimeout(() => {
        diagnosisFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [hasDiagnosis]);

  useEffect(() => {
    if (hasSolution && solutionFormRef.current) {
      setTimeout(() => {
        solutionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [hasSolution]);

  // Close AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssist = (event: MouseEvent) => {
      if (aiAssistMenuRef.current && !aiAssistMenuRef.current.contains(event.target as Node)) {
        setShowAIAssistMenu(false);
        setShowToneSubmenu(false);
      }
    };

    if (showAIAssistMenu) {
      document.addEventListener('mousedown', handleClickOutsideAIAssist);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssist);
    };
  }, [showAIAssistMenu]);

  // Close formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormatting = (event: MouseEvent) => {
      if (formattingMenuRef.current && !formattingMenuRef.current.contains(event.target as Node)) {
        setShowFormattingMenu(false);
      }
    };

    if (showFormattingMenu) {
      document.addEventListener('mousedown', handleClickOutsideFormatting);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormatting);
    };
  }, [showFormattingMenu]);

  // Close Forward AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssistForward = (event: MouseEvent) => {
      if (aiAssistMenuForwardRef.current && !aiAssistMenuForwardRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuForward(false);
        setShowToneSubmenuForward(false);
      }
    };

    if (showAIAssistMenuForward) {
      document.addEventListener('mousedown', handleClickOutsideAIAssistForward);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssistForward);
    };
  }, [showAIAssistMenuForward]);

  // Close Forward formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormattingForward = (event: MouseEvent) => {
      if (formattingMenuForwardRef.current && !formattingMenuForwardRef.current.contains(event.target as Node)) {
        setShowFormattingMenuForward(false);
      }
    };

    if (showFormattingMenuForward) {
      document.addEventListener('mousedown', handleClickOutsideFormattingForward);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormattingForward);
    };
  }, [showFormattingMenuForward]);

  // Close Collaborate AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssistCollaborate = (event: MouseEvent) => {
      if (aiAssistMenuCollaborateRef.current && !aiAssistMenuCollaborateRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuCollaborate(false);
        setShowToneSubmenuCollaborate(false);
      }
    };

    if (showAIAssistMenuCollaborate) {
      document.addEventListener('mousedown', handleClickOutsideAIAssistCollaborate);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssistCollaborate);
    };
  }, [showAIAssistMenuCollaborate]);

  // Close Collaborate formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormattingCollaborate = (event: MouseEvent) => {
      if (formattingMenuCollaborateRef.current && !formattingMenuCollaborateRef.current.contains(event.target as Node)) {
        setShowFormattingMenuCollaborate(false);
      }
    };

    if (showFormattingMenuCollaborate) {
      document.addEventListener('mousedown', handleClickOutsideFormattingCollaborate);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormattingCollaborate);
    };
  }, [showFormattingMenuCollaborate]);

  // Close Note AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssistNote = (event: MouseEvent) => {
      if (aiAssistMenuNoteRef.current && !aiAssistMenuNoteRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuNote(false);
        setShowToneSubmenuNote(false);
      }
    };

    if (showAIAssistMenuNote) {
      document.addEventListener('mousedown', handleClickOutsideAIAssistNote);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssistNote);
    };
  }, [showAIAssistMenuNote]);

  // Close Note formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormattingNote = (event: MouseEvent) => {
      if (formattingMenuNoteRef.current && !formattingMenuNoteRef.current.contains(event.target as Node)) {
        setShowFormattingMenuNote(false);
      }
    };

    if (showFormattingMenuNote) {
      document.addEventListener('mousedown', handleClickOutsideFormattingNote);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormattingNote);
    };
  }, [showFormattingMenuNote]);

  // Close Diagnosis AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssistDiagnosis = (event: MouseEvent) => {
      if (aiAssistMenuDiagnosisRef.current && !aiAssistMenuDiagnosisRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuDiagnosis(false);
        setShowToneSubmenuDiagnosis(false);
      }
    };

    if (showAIAssistMenuDiagnosis) {
      document.addEventListener('mousedown', handleClickOutsideAIAssistDiagnosis);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssistDiagnosis);
    };
  }, [showAIAssistMenuDiagnosis]);

  // Close Diagnosis formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormattingDiagnosis = (event: MouseEvent) => {
      if (formattingMenuDiagnosisRef.current && !formattingMenuDiagnosisRef.current.contains(event.target as Node)) {
        setShowFormattingMenuDiagnosis(false);
      }
    };

    if (showFormattingMenuDiagnosis) {
      document.addEventListener('mousedown', handleClickOutsideFormattingDiagnosis);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormattingDiagnosis);
    };
  }, [showFormattingMenuDiagnosis]);

  // Close Solution AI Assist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideAIAssistSolution = (event: MouseEvent) => {
      if (aiAssistMenuSolutionRef.current && !aiAssistMenuSolutionRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuSolution(false);
        setShowToneSubmenuSolution(false);
      }
    };

    if (showAIAssistMenuSolution) {
      document.addEventListener('mousedown', handleClickOutsideAIAssistSolution);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAIAssistSolution);
    };
  }, [showAIAssistMenuSolution]);

  // Close Solution formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutsideFormattingSolution = (event: MouseEvent) => {
      if (formattingMenuSolutionRef.current && !formattingMenuSolutionRef.current.contains(event.target as Node)) {
        setShowFormattingMenuSolution(false);
      }
    };

    if (showFormattingMenuSolution) {
      document.addEventListener('mousedown', handleClickOutsideFormattingSolution);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFormattingSolution);
    };
  }, [showFormattingMenuSolution]);

  // Click outside handler for AI Summary menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiSummaryMenuRef.current && !aiSummaryMenuRef.current.contains(event.target as Node)) {
        setShowAiSummaryMenu(false);
      }
    };

    if (showAiSummaryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAiSummaryMenu]);

  if (openProblems.length === 0 || !activeProblem) return null;
  if (minimized) return <MinimizedDrawerRail items={stackTabs ?? openProblems} activeId={activeProblem?.id} onSelect={(id) => { onTabChange(id); setMinimized(false); }} onRestore={() => setMinimized(false)} />;

  return (
    <div className={`fixed right-0 top-0 h-screen bg-white shadow-2xl z-50 flex flex-col ${drawerWidth <= 1080 ? 'border-l border-[#e5e7eb]' : ''}`} ref={drawerRef} style={{ width: `${drawerWidth}px` }} data-drawer>
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group z-[100]"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
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
      
      {/* Tabs Header */}
      <div className="flex items-center bg-[#f9fafb] border-b border-[#e5e7eb]">
        <DrawerTabStrip
          items={stackTabs ?? openProblems}
          activeId={activeProblemId}
          onSelect={onTabChange}
          onClose={onCloseTab}
          maxVisible={drawerWidth > 1080 ? 8 : 3}
        />
        <button onClick={() => setMinimized(true)} title="Minimize panel" className="flex-shrink-0 p-2 hover:bg-[#e5e7eb] border-l border-[#e5e7eb]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/></svg></button>
        <button
          onClick={toggleDrawerView}
          className="p-2 hover:bg-[#e5e7eb]"
          title={drawerWidth > 1080 ? "Switch to small view" : "Switch to full view"}
        >
          {drawerWidth > 1080 ? (
            // Restore icon (overlapping squares) when full -> click shrinks to small
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="12" height="12" rx="1.5" stroke="#364658" strokeWidth="2"/>
              <path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5H18A1.5 1.5 0 0 1 19.5 6.5V15A1.5 1.5 0 0 1 18 16.5H16" stroke="#364658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            // Maximize icon (single square) when small -> click expands to full
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="14" height="14" rx="1.5" stroke="#364658" strokeWidth="2"/>
            </svg>
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#e5e7eb]"
        >
          <X size={18} className="text-[#364658]" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header Actions */}
        <div className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-semibold text-[#364658] flex items-center gap-2 min-w-0">
              <HeaderIdPill id={activeProblem.id} />
              <span className="truncate">{activeProblem.subject}</span>
            </h1>
            {/* Main properties — quick-glance KPIs below the subject */}
            {(() => {
              const proj = (activeProblem as any)?.project as Project | undefined;
              /* The plan's own totals — see the Tasks / Milestones chips below. */
              const planKpi = planSummaryOf(proj ?? null);
              const PS: Record<string, string> = { Open: '#3D8BD0', Planning: '#8B5CF6', Implementation: '#22C55E', 'On Hold': '#D97706', Completed: '#94A3B8', Cancelled: '#EF4444' };
              const PP: Record<string, string> = { Critical: '#DC2626', High: '#F97316', Medium: '#94A3B8', Low: '#22C55E' };
              const AV = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
              const chip = (label: string, node: React.ReactNode) => (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">{label}</span>
                  {node}
                </span>
              );
              const val = (text: string, color = '#364658') => (
                <span className="text-[12px] font-medium" style={{ color }}>{text}</span>
              );
              if (!proj) return null;
              const closedP = proj.status === 'Completed' || proj.status === 'Cancelled';
              const dd = proj.end ? Math.round((proj.end.getTime() - Date.now()) / 864e5) : null;
              const spanTxt = (n: number) => (Math.abs(n) >= 60 ? `${Math.round(Math.abs(n) / 30)} months` : `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'}`);
              const dueColor = closedP || dd === null ? '#364658' : dd < 0 ? '#DC2626' : dd <= 30 ? '#D97706' : '#364658';
              const dueTip = dd === null ? 'No end date set' : closedP ? 'Project closed' : dd < 0 ? `Overdue by ${spanTxt(dd)}` : `${spanTxt(dd)} left`;
              const fmtEnd = proj.end ? proj.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
              const items: HeaderKpiItem[] = [
                { key: 'status', tip: `Status: ${proj.status}`, node: chip('Status', (<><span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PS[proj.status] ?? '#94A3B8' }} />{val(proj.status)}</>)) },
                { key: 'priority', tip: `Priority: ${proj.priority}`, node: chip('Priority', (<><span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PP[proj.priority] ?? '#94A3B8' }} />{val(proj.priority)}</>)) },
                { key: 'owner', tip: `Project Owner: ${proj.owner ?? 'Unassigned'}`, node: chip('Owner', proj.owner ? (
                  <>
                    <span className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[8px] font-semibold text-white" style={{ backgroundColor: AV[[...proj.owner].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length] }}>
                      {proj.owner.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
                    </span>
                    {val(proj.owner)}
                  </>
                ) : (
                  <span className="text-[12px] text-[#9CA3AF]">Unassigned</span>
                )) },
                { key: 'due', tip: `End date ${fmtEnd} — ${dueTip}`, node: chip('Due', val(fmtEnd, dueColor)) },
                { key: 'completion', tip: `Completion: ${proj.completion}%`, node: chip('Completion', (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="block h-[4px] w-14 overflow-hidden rounded-full bg-[#EEF1F4]">
                      <span className="block h-full rounded-full" style={{ width: `${proj.completion}%`, backgroundColor: proj.completion === 100 ? '#16A34A' : '#3D8BD0' }} />
                    </span>
                    {val(`${proj.completion}%`)}
                  </span>
                )) },
                /* Counted off the PLAN the Planning tab below actually renders, not the
                   record's own summary fields — the header used to claim "40/64" over a
                   tab showing fifteen rows, and the listing's hover card now prints the
                   same figures, so all three have to come from one place. */
                { key: 'milestones', tip: `Milestones: ${planKpi.milestonesDone} of ${planKpi.milestones} complete`, node: chip('Milestones', val(`${planKpi.milestonesDone}/${planKpi.milestones}`, planKpi.milestones > 0 && planKpi.milestonesDone === planKpi.milestones ? '#16A34A' : '#364658')) },
                { key: 'tasks', tip: `Tasks: ${planKpi.completed} of ${planKpi.tasks} complete`, node: chip('Tasks', val(`${planKpi.completed}/${planKpi.tasks}`, planKpi.tasks > 0 && planKpi.completed === planKpi.tasks ? '#16A34A' : '#364658')) },
              ];
              return <HeaderKpiRow items={items} />;
            })()}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <HeaderCopyButton variant="link" value={activeProblem?.id ?? ''} label="Copy Problem URL" />
            <button title="Edit" className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]">
              <Edit size={16} className="text-[#6b7280]" />
            </button>
            <div className="relative">
              <div className="inline-flex items-stretch h-8">
                <button
                  onClick={() => { setRelationMode('existing'); setShowRelationModeMenu(false); setShowPropertiesRelationDropdown(true); }}
                  className="flex items-center px-4 bg-white border border-[#DFE5ED] border-r-0 text-[#364658] text-[12px] font-medium rounded-l hover:bg-[#F5F7FA]"
                >
                  Add Relation
                </button>
                <button
                  onClick={() => { setShowPropertiesRelationDropdown(false); setShowRelationModeMenu((v) => !v); }}
                  title="Relation options"
                  className="flex items-center px-1.5 bg-white border border-[#DFE5ED] rounded-r hover:bg-[#F5F7FA]"
                >
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </button>
              </div>
              {showRelationModeMenu && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowRelationModeMenu(false)} />
                  <div className="app-menu absolute top-full right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-[9999] w-[160px]">
                    <button onClick={() => { setRelationMode('existing'); setShowRelationModeMenu(false); setShowPropertiesRelationDropdown(true); }} className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors">Link Existing</button>
                    <button onClick={() => { setRelationMode('create'); setShowRelationModeMenu(false); setShowPropertiesRelationDropdown(true); }} className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors">Create New</button>
                  </div>
                </>
              )}
              
              {showPropertiesRelationDropdown && (
                <div
                  className="app-menu absolute top-full right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-[9999] max-h-[240px] overflow-y-auto w-[230px]"
                  ref={propertiesRelationDropdownRef}
                >
                  <div className="px-3 py-1.5 border-b border-[#F0F2F5] text-[11px] font-semibold text-[#7B8FA5]">{relationMode === 'create' ? 'Create New' : 'Link Existing'}</div>
                  {['Request', 'Problem', 'Change', 'Release', 'Asset', 'CI', 'Contract', 'Knowledge', 'Purchase', 'Project'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setPropertiesRelationType(type);
                        setShowPropertiesRelationDropdown(false);
                        setShowPropertiesRelationModal(true);
                      }}
                      className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Status split-button dropdown (replaces the old Close button) */}
            <div className="relative">
              <div className={`inline-flex items-stretch h-8 rounded border bg-white overflow-hidden transition-colors ${showHeaderStatusDropdown ? 'border-[#3D8BD0]' : 'border-[#D0D5DD]'}`}>
                <button
                  onClick={() => setShowHeaderStatusDropdown((v) => !v)}
                  className="flex items-center gap-2 pl-3 pr-2.5 hover:bg-[#F9FAFB] transition-colors"
                  title="Update status"
                >
                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusBadgeColors().dot }} />
                  <span className="text-[13px] font-medium text-[#364658]">{selectedStatus}</span>
                </button>
                <button
                  onClick={() => setShowHeaderStatusDropdown((v) => !v)}
                  className={`flex items-center px-1.5 border-l hover:bg-[#F9FAFB] transition-colors ${showHeaderStatusDropdown ? 'border-[#3D8BD0]' : 'border-[#D0D5DD]'}`}
                  title="Update status"
                >
                  <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${showHeaderStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showHeaderStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowHeaderStatusDropdown(false)} />
                  <div className="app-menu absolute top-full right-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-[#DFE5ED] p-2 z-[100]">
                    {statusOptions.map((option, idx) => {
                      const isSel = selectedStatus === option.label;
                      return (
                        <button
                          key={option.label}
                          onClick={() => applyHeaderStatus(option)}
                          onMouseEnter={() => setStatusHighlight(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${statusHighlight === idx ? 'bg-[#F0F6FC]' : 'hover:bg-[#F9FAFB]'}`}
                        >
                          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                          <span className="text-[13px] text-[#364658]">{option.label}</span>
                          {isSel && <Check size={14} className="ml-auto text-[#3D8BD0]" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <ProblemActionsMenu
              ticketId={activeProblem?.id}
              onOpenApprovalPopup={() => {
                setShowCreateApprovalPopup(true);
                setActiveMainTab('approvals');
              }}
              onRestartOnboarding={() => {
                sessionStorage.removeItem('hasSeenTicketDetailsOnboarding');
                setOnboardingStep(0);
                setShowOnboarding(true);
                setActiveGroup('properties'); // Open ticket properties for onboarding
              }}
            />
          </div>
        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="flex flex-1 overflow-hidden" data-onboarding-container>
          {/* Left Content */}
          <div className="flex-1 flex flex-col relative min-w-0" data-onboarding="main-workspace">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
            {/* Properties Section */}
            <div className="px-6 py-4 bg-white border-b border-[#E5E7EB] hidden">
              {/* Properties Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative" ref={badgeStatusDropdownRef}>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: getStatusBadgeColors().bg, 
                          borderWidth: '1px', 
                          borderStyle: 'solid',
                          borderColor: getStatusBadgeColors().border 
                        }}
                        onClick={() => setShowBadgeStatusDropdown(!showBadgeStatusDropdown)}
                      >
                        <div 
                          className="size-1.5 rounded-full" 
                          style={{ backgroundColor: getStatusBadgeColors().dot }}
                        ></div>
                        <span 
                          className="text-xs font-medium" 
                          style={{ color: getStatusBadgeColors().text }}
                        >
                          {selectedStatus}
                        </span>
                      </button>
                      
                      {/* Status Dropdown */}
                      {showBadgeStatusDropdown && (
                        <div className="app-menu absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-[100]">
                          {statusOptions.map((option) => (
                            <button
                              key={option.label}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                              onClick={() => {
                                setSelectedStatus(option.label);
                                setShowBadgeStatusDropdown(false);
                              }}
                            >
                              <div 
                                className="size-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: option.color }}
                              ></div>
                              <span className="text-[13px] text-[#364658]">{option.label}</span>
                              {selectedStatus === option.label && (
                                <Check size={14} className="ml-auto text-[#3D8BD0]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Priority Badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative" ref={badgePriorityDropdownRef}>
                      <button 
                        onClick={() => setShowBadgePriorityDropdown(!showBadgePriorityDropdown)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: getPriorityBadgeColors().bg,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: getPriorityBadgeColors().border
                        }}
                      >
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {selectedPriority === 'Urgent' && (
                            <>
                              <rect width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="2.17" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="4.33" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="6.5" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                            </>
                          )}
                          {selectedPriority === 'High' && (
                            <>
                              <rect width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="3.25" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="6.5" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                            </>
                          )}
                          {selectedPriority === 'Medium' && (
                            <>
                              <rect width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                              <rect x="3.25" width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                            </>
                          )}
                          {selectedPriority === 'Low' && (
                            <rect width="1.5" height="10" rx="0.75" fill={getPriorityBadgeColors().barColor}/>
                          )}
                        </svg>
                        <span 
                          className="text-xs font-medium" 
                          style={{ color: getPriorityBadgeColors().text }}
                        >
                          {selectedPriority}
                        </span>
                      </button>
                      
                      {/* Priority Dropdown */}
                      {showBadgePriorityDropdown && (
                        <div className="app-menu absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-[100]">
                          {priorityOptions.map((option) => (
                            <button
                              key={option.label}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                              onClick={() => {
                                setSelectedPriority(option.label);
                                setShowBadgePriorityDropdown(false);
                              }}
                            >
                              <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                {option.label === 'Urgent' && (
                                  <>
                                    <rect width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="2.17" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="4.33" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="6.5" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                  </>
                                )}
                                {option.label === 'High' && (
                                  <>
                                    <rect width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="3.25" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="6.5" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                  </>
                                )}
                                {option.label === 'Medium' && (
                                  <>
                                    <rect width="1.5" height="10" rx="0.75" fill={option.color}/>
                                    <rect x="3.25" width="1.5" height="10" rx="0.75" fill={option.color}/>
                                  </>
                                )}
                                {option.label === 'Low' && (
                                  <rect width="1.5" height="10" rx="0.75" fill={option.color}/>
                                )}
                              </svg>
                              <span className="text-[13px] text-[#364658]">{option.label}</span>
                              {selectedPriority === option.label && (
                                <Check size={14} className="ml-auto text-[#3D8BD0]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Priority</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Assignee Badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative" ref={badgeAssigneeDropdownRef}>
                      <button
                        onClick={() => setShowBadgeAssigneeDropdown(!showBadgeAssigneeDropdown)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded hover:opacity-80 transition-opacity h-[26px]"
                      >
                        {selectedAssignee === 'Unassigned' ? (
                          <>
                            <div className="h-4 w-4 rounded border-2 border-dashed border-[#9CA3AF] flex-shrink-0"></div>
                            <span className="text-xs font-medium text-[#6B7280]">Unassigned</span>
                          </>
                        ) : (
                          <>
                            <div 
                              className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-medium text-white"
                              style={{ backgroundColor: assigneeOptions.find(o => o.label === selectedAssignee)?.color || '#3D8BD0' }}
                            >
                              {assigneeOptions.find(o => o.label === selectedAssignee)?.initials || 'NA'}
                            </div>
                            <span className="text-xs font-medium text-[#374151]">{selectedAssignee}</span>
                          </>
                        )}
                      </button>
                  
                  {/* Assignee Dropdown */}
                  {showBadgeAssigneeDropdown && (
                    <div className="app-menu absolute top-full left-0 mt-1 w-full min-w-[280px] max-w-[320px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-[100]">
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
                          setShowBadgeAssigneeDropdown(false);
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
                            setShowBadgeAssigneeDropdown(false);
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assignee</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* SLA Badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF3] border border-[#ABEFC6] rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="14" viewBox="0 0 12 16" fill="none">
                        <g clipPath="url(#clip0_1057_504)">
                          <path d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z" fill="#27AE60"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_1057_504">
                            <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-xs font-medium text-[#067647]">
                        {activeProblem?.id === 'PBM-627' ? 'Resolution due in 4d 5h' : 'Resolution due in 5d 2h'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Thursday, February 20, 2026 at 12:30 AM</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Description Section with Requester Info */}
            <div className="px-6 py-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#E67E22] text-[12px] font-medium text-white">
                  {activeProblem?.id === 'PBM-608' ? 'AD' : activeProblem.requester.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setShowRequesterProfile(true)} className="text-[14px] font-semibold text-[#364658] hover:text-[#3D8BD0] hover:underline transition-colors">{activeProblem?.id === 'PBM-608' ? 'Arnav Desai' : activeProblem.requester}</button>
                    <span className="text-[12px] text-[#6b7280]">Created at 26/02/2025 15:02 (6 days ago)</span>
                    <div
                      onClick={() => {
                        setIsDescriptionExpanded(true);
                        setAttachmentsExpanded(true);
                        setHighlightAttachments(true);
                        setTimeout(() => {
                          const attachmentsSection = document.getElementById('attachments-section');
                          if (attachmentsSection) {
                            attachmentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                        setTimeout(() => {
                          setHighlightAttachments(false);
                        }, 3000);
                      }}
                      className="flex items-center gap-1 text-[12px] text-[#6b7280] ml-auto cursor-pointer hover:text-[#3D8BD0] transition-colors"
                      style={{ display: activeProblem?.id === 'PBM-608' ? 'none' : 'flex' }}
                    >
                      <Paperclip size={12} />
                      <span>2</span>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#364658] leading-relaxed">
                    {activeProblem?.id === 'PBM-608' ? (
                      // Description for INC-35: Request for Apple MacBook Pro Allocation
                      isDescriptionExpanded ? (
                        <>
                          {getProblemContent('PBM-608').desc}
                          <br /><br />
                          {getProblemContent('PBM-608').descExtra}
                        </>
                      ) : (
                        <>
                          {getProblemContent('PBM-608').desc}{' '}
                          <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                          >
                            View more
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )
                    ) : activeProblem?.id === 'PBM-627' ? (
                      // Description for INC-32: My Internet Down
                      isDescriptionExpanded ? (
                        <>
                          {getProblemContent('PBM-627').desc}
                          <br /><br />
                          {getProblemContent('PBM-627').descExtra}
                        </>
                      ) : (
                        <>
                          {getProblemContent('PBM-627').desc}{' '}
                          <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                          >
                            View more
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )
                    ) : (
                      isDescriptionExpanded ? (
                        <>
                          {getProblemContent(activeProblem?.id).desc}
                          <br /><br />
                          {getProblemContent(activeProblem?.id).descExtra}
                          <br /><br />
                          The remediation workflow begins by capturing a baseline snapshot of the current network state — active adapters, assigned IP addresses, the default gateway, DNS servers, and the contents of the ARP and routing tables — so that any change made during recovery can be compared against a known-good reference and rolled back if necessary.
                          <br /><br />
                          Next, the automation flushes the DNS resolver cache and re-registers the host with the corporate DNS, clearing any stale or poisoned records that may be redirecting traffic. It then releases and renews the DHCP lease to ensure the device receives a valid address, subnet mask, and gateway from the correct scope on the VLAN.
                          <br /><br />
                          Once addressing is confirmed, the routine resets the TCP/IP stack and Winsock catalog, removing any corrupted layered service providers or leftover proxy hooks that frequently cause "connected but no internet" symptoms. The network adapter is then disabled and re-enabled to force a clean re-association with the access point.
                          <DescriptionInlineImage />
                          The diagram above illustrates the path the diagnostics walk through — from the endpoint, to the wireless access point, to the local gateway, and finally out to the ISP. Highlighting the failing hop makes it easy to see whether the break is local (adapter, IP, DNS) or upstream (gateway-to-ISP), which determines whether this can be fixed on the endpoint or must be escalated to the network team.
                          <br /><br />
                          After connectivity primitives are restored, the workflow re-establishes secure sessions to corporate resources. It re-authenticates the device against the domain controllers, refreshes Kerberos tickets, and re-mounts the mapped network drives so that file shares, print queues, and policy-driven resources come back online without a manual logout.
                          <br /><br />
                          Proxy and PAC configurations are validated against the expected corporate values, certificate trust chains are checked, and the VPN client's connection profile is verified to ensure split-tunnel rules and DNS suffixes are applied correctly. Any drift from the standard configuration is flagged in the run log for review.
                          <br /><br />
                          The routine then performs a series of reachability tests: it pings the gateway, resolves a set of known internal and external hostnames, and issues lightweight HTTPS requests to a handful of critical business applications. Latency, packet loss, and response codes are recorded for each target so support staff can confirm the fix objectively rather than relying on a subjective "it works now".
                          <br /><br />
                          If any test still fails after the refresh, the workflow does not silently stop. It collects a diagnostic bundle — adapter details, the before/after configuration, ping and traceroute output, and relevant event-log entries — and attaches it to this record so the next engineer has full context without having to ask the user to reproduce the steps.
                          <br /><br />
                          All actions are idempotent and logged with timestamps, which means the workflow can be safely re-run if the issue recurs, and the audit trail clearly shows what was changed, when, and by which automation account. This satisfies our change-management and security-review requirements for any automated remediation that touches network configuration.
                          <br /><br />
                          On successful completion the device is returned to a fully operational state with verified internet access, restored corporate connectivity, and a clean diagnostic report. The user is notified automatically, and this record is updated with the final status so it can be reviewed, audited, or referenced if a similar issue is reported in the future.
                        </>
                      ) : (
                        <>
                          {getProblemContent(activeProblem?.id).desc}{' '}
                          <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                          >
                            View more
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )
                    )}
                  </p>
                  {isDescriptionExpanded && (
                    <button 
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE5ED] bg-[#F5F9FD] text-[13px] font-semibold text-[#3D8BD0] hover:bg-[#EBF3FB] hover:border-[#3D8BD0] transition-colors"
                    >
                      View less
                      <ChevronUp size={14} />
                    </button>
                  )}
                  
                  {/* Attachments */}
                  {isDescriptionExpanded && activeProblem?.id !== 'PBM-608' && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`group/file relative flex items-center gap-2 px-3 py-1 pr-16 rounded transition-all ${
                      highlightAttachments 
                        ? 'bg-[#EBF5FF] border border-[#3D8BD0] shadow-sm' 
                        : 'bg-[#F5F7FA] border border-[#DFE5ED] hover:bg-[#EEF2F7]'
                    }`}>
                      <FileTypeBadge name="task-changes.doc" size="sm" />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#364658] font-medium">task-changes.doc</span>
                        <span className="text-[10px] text-[#7B8FA5]">674 KB</span>
                      </div>
                      {/* Hover Actions */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center gap-1">
                        <button className="p-1 hover:bg-white rounded" title="Download">
                          <Download className="size-3.5 text-[#7B8FA5]" />
                        </button>
                        <button className="p-1 hover:bg-white rounded" title="Delete">
                          <Trash2 className="size-3.5 text-[#EF4444]" />
                        </button>
                      </div>
                    </div>
                    <div className={`group/file relative flex items-center gap-2 px-3 py-1 pr-16 rounded transition-all ${
                      highlightAttachments 
                        ? 'bg-[#EBF5FF] border border-[#3D8BD0] shadow-sm' 
                        : 'bg-[#F5F7FA] border border-[#DFE5ED] hover:bg-[#EEF2F7]'
                    }`}>
                      <FileTypeBadge name="network-diagnosis.pdf" size="sm" />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#364658] font-medium">network-diagnosis.pdf</span>
                        <span className="text-[10px] text-[#7B8FA5]">2 MB</span>
                      </div>
                      {/* Hover Actions */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center gap-1">
                        <button className="p-1 hover:bg-white rounded" title="Download">
                          <Download className="size-3.5 text-[#7B8FA5]" />
                        </button>
                        <button className="p-1 hover:bg-white rounded" title="Delete">
                          <Trash2 className="size-3.5 text-[#EF4444]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Affected Items row — REMOVED on the Project page per request (dead code kept from the clone). */}
            {false && (
            <div className="mx-[24px] mb-[12px] flex items-center flex-wrap gap-2">
              <span className="text-[13px] font-medium text-[#364658]">Affected Items :</span>
              {impactByType.map((t) => {
                const Icon = t.type === 'Request' ? IconRequest
                  : t.type === 'Asset' ? IconAssets
                  : t.type === 'Change' ? IconChange
                  : t.type === 'Release' ? IconRelease
                  : t.type === 'CI' ? IconCMDB
                  : t.type === 'Problem' ? IconProblem
                  : IconRequest;
                const recs = problemImpact.filter((r) => r.type === t.type);
                const statusDot = (st: string) => st === 'Open' ? '#D97706' : st === 'In Progress' ? '#3D8BD0' : (st === 'In Use' || st === 'Resolved' || st === 'Closed') ? '#22A06B' : '#9CA3AF';
                const prioDot = (pr: string) => (pr === 'High' || pr === 'P1') ? '#DC2626' : pr === 'Medium' ? '#D97706' : '#22A06B';
                return (
                  <Tooltip key={t.type}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setRelationsTypeFilter(t.type); setActiveMainTab('relations'); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DFE5ED] bg-white hover:border-[#3D8BD0] hover:bg-[#F9FBFD] transition-colors text-[12px] font-medium text-[#364658]"
                      >
                        {/* One muted grey for every type, matching the Request page — the pills are
                            a set, so per-type colour made the row read as unrelated badges. */}
                        <span className="flex items-center flex-shrink-0 text-[#7B8FA5]">
                          <Icon size={14} />
                        </span>
                        {t.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" sideOffset={6} hideArrow className="p-0 bg-white text-[#364658] border border-[#E5E7EB] shadow-lg w-[300px]">
                      <div className="max-h-[260px] overflow-y-auto">
                        {recs.slice(0, 3).map((r) => (
                          <button key={r.ticketId} onClick={() => onOpenRelation?.({ ticketId: r.ticketId, subject: r.subject, type: r.type, status: r.status, priority: r.priority, assignedTo: { name: r.assignedTo.name } })} className="w-full text-left px-3 py-2 border-t border-[#F0F2F5] first:border-t-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0] flex-shrink-0">{r.ticketId}</span>
                              <span className="text-[12px] font-medium text-[#364658] truncate flex-1 hover:text-[#3D8BD0]">{r.subject}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#9CA3AF] flex-shrink-0"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#7B8FA5]">
                              <span className="inline-flex items-center gap-1"><User size={11} />{r.assignedTo.name}</span>
                              <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: statusDot(r.status) }} />{r.status}</span>
                              <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: prioDot(r.priority) }} />{r.priority}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {t.count > 3 && (
                        <button onClick={() => { setRelationsTypeFilter(t.type); setActiveMainTab('relations'); }} className="w-full text-left px-3 py-2.5 border-t border-[#F0F2F5] text-[12px] font-medium text-[#3D8BD0] hover:bg-[#F9FAFB] transition-colors cursor-pointer">View all {t.count}</button>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            )}

            {/* AI Summary Accordion */}
            <div className="border border-[#DFE5ED] rounded-lg relative mx-[24px] mt-[0px] mb-[12px]" style={{ position: 'relative' }}>
              {/* Gradient Background Layer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.03,
                  background: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)',
                  borderRadius: '0.5rem',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />
              <div className="w-full px-6 py-3 rounded-lg transition-colors flex items-center justify-between relative">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAiSummaryExpanded(!aiSummaryExpanded)}>
                  <svg width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <defs>
                          <linearGradient id="sparkle-gradient-icon" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4CB1FE" />
                            <stop offset="20.44%" stopColor="#731EFB" />
                            <stop offset="99.68%" stopColor="#F911E3" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#sparkle-gradient-icon)" d="M15,5h.83v.83c0,.46.37.83.83.83.46,0,.83-.37.83-.83v-.83h.83c.46,0,.83-.37.83-.83,0-.46-.37-.83-.83-.83h-.83v-.83c0-.46-.37-.83-.83-.83-.46,0-.83.37-.83.83v.83h-.83c-.46,0-.83.37-.83.83,0,.46.37.83.83.83ZM18.97,9.33l-.06-.08-.07-.08c-.16-.18-.37-.3-.6-.37h-.01s-5.11-1.32-5.11-1.32c-.14-.04-.28-.11-.38-.22-.11-.11-.18-.24-.22-.38l-1.32-5.11v-.02s-.04-.1-.04-.1c-.08-.22-.23-.42-.42-.56-.22-.16-.48-.25-.76-.25-.24,0-.47.07-.67.2l-.08.06c-.22.16-.37.4-.45.66v.02s-1.32,5.11-1.32,5.11c-.04.14-.11.28-.22.38-.08.08-.17.14-.28.18l-.11.04-5.11,1.32s-.01,0-.02,0c-.23.06-.43.19-.59.37l-.07.08c-.14.19-.23.42-.25.65v.1s0,.1,0,.1c.02.24.1.46.25.65.16.22.39.37.66.45,0,0,.01,0,.02,0l5.11,1.32c.14.04.28.11.38.22.11.11.18.24.22.38l1.32,5.11s0,.01,0,.02c.07.26.23.49.45.66.22.16.48.25.76.25.27,0,.54-.09.75-.25.22-.16.37-.4.45-.66,0,0,0-.01,0-.02l1.32-5.11c.04-.14.11-.28.22-.38.11-.11.24-.18.38-.22l5.11-1.32h.01c.26-.08.5-.23.66-.45.17-.22.25-.48.25-.76,0-.24-.07-.47-.2-.67ZM12.71,10.91c-.43.11-.83.34-1.14.65-.32.32-.54.71-.65,1.14l-.91,3.54-.91-3.54c-.11-.43-.34-.83-.65-1.14-.32-.32-.71-.54-1.14-.65l-3.54-.91,3.54-.91c.43-.11.83-.34,1.14-.65.32-.32.54-.71.65-1.14l.91-3.54.91,3.54.05.16c.12.37.33.71.61.98.32.32.71.54,1.14.65l3.54.91-3.54.91ZM4.25,14.17h-.09c0-.46-.37-.84-.83-.84-.46,0-.83.37-.83.83h-.08c-.42.05-.75.4-.75.83s.33.79.75.83h.08s0,.09,0,.09c.04.42.4.75.83.75.43,0,.79-.33.83-.75v-.08s.09,0,.09,0c.42-.04.75-.4.75-.83s-.33-.79-.75-.83Z"/>
                      </svg>
                  <span className="text-[14px] font-semibold text-[#364658]">{isRefreshingAiSummary ? 'Generating Summary...' : 'AI Summary'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <SummaryStaleNotice
                    stale={aiSummaryStale}
                    regenerating={isRefreshingAiSummary}
                    onRegenerate={() => {
                      setIsRefreshingAiSummary(true);
                      setTimeout(() => {
                        setIsRefreshingAiSummary(false);
                        setAiSummaryStale(false); // summary now covers the new conversations
                      }, 2000);
                    }}
                  />
                  <div className="relative z-20" ref={aiSummaryMenuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAiSummaryMenu(!showAiSummaryMenu);
                      }}
                      className="p-1 hover:bg-[#E5E7EB] rounded transition-colors"
                      title="More options"
                    >
                      <MoreVertical size={14} className="text-[#7B8FA5]" />
                    </button>
                    {showAiSummaryMenu && (
                      <div className="app-menu absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-20 min-w-[200px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            const aiSummaryText = getAiSummaryText();
                            setNoteContent(aiSummaryText);
                            setActiveMainTab('conversation');
                            setShowNoteEditor(true);
                            setTimeout(() => {
                              noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 100);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                        >
                          <StickyNote size={16} className="text-[#7B8FA5]" />
                          <span className="text-[13px] text-[#364658]">Add as Note</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            toast.success('Added as Collaborate');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                        >
                          <User size={16} className="text-[#7B8FA5]" />
                          <span className="text-[13px] text-[#364658]">Add as Collaborate</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            toast.success('Reply opened');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                        >
                          <Reply size={16} className="text-[#7B8FA5]" />
                          <span className="text-[13px] text-[#364658]">Reply</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            toast.success('Forward opened');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                        >
                          <Forward size={16} className="text-[#7B8FA5]" />
                          <span className="text-[13px] text-[#364658]">Forward</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            toast.success('Edit mode enabled');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                        >
                          <Edit size={16} className="text-[#7B8FA5]" />
                          <span className="text-[13px] text-[#364658]">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAiSummaryMenu(false);
                            toast.error('AI Summary deleted');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#FEF2F2] text-left transition-colors"
                        >
                          <Trash2 size={16} className="text-[#EF4444]" />
                          <span className="text-[13px] text-[#EF4444]">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div title="Toggle AI Summary" className="cursor-pointer" onClick={() => setAiSummaryExpanded(!aiSummaryExpanded)}>
                    {aiSummaryExpanded ? (
                      <ChevronUp size={16} className="text-[#7B8FA5]" />
                    ) : (
                      <ChevronDown size={16} className="text-[#7B8FA5]" />
                    )}
                  </div>
                </div>
              </div>

              {aiSummaryExpanded && (
                <div className="rounded-lg relative z-10 px-[24px] pt-[8px] pb-[16px]">
                  {isRefreshingAiSummary && (
                    <>
                      <div
                        className="h-[8px] opacity-10 mb-2 overflow-hidden w-full"
                        style={{
                          borderRadius: '1.25rem'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gradientSlide 2s linear infinite'
                          }}
                        />
                      </div>
                      <div
                        className="h-[8px] opacity-10 overflow-hidden"
                        style={{
                          borderRadius: '1.25rem',
                          width: '75%'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gradientSlide 2s linear infinite'
                          }}
                        />
                      </div>
                      <style>{`
                        @keyframes gradientSlide {
                          0% {
                            background-position: 200% 0%;
                          }
                          100% {
                            background-position: 0% 0%;
                          }
                        }
                      `}</style>
                    </>
                  )}
                  {!isRefreshingAiSummary && (
                  <>
                  <div className="text-[13px] text-[#364658] leading-relaxed mb-4">
                    {getProblemContent(activeProblem?.id).summary}
                  </div>

                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold text-[#7B8FA5] mb-2">KEY POINTS</h4>
                    <ul className="space-y-1.5">
                      {getProblemContent(activeProblem?.id).keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-[#364658]">
                          <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] text-[#9CA3AF] mb-4">
                    Generated by Rakesh Rathod at 24/02/2025 17:10
                  </div>

                  {/* Action Bar — project-truth AI actions: each opens the AI chat
                      with an answer built from the live project record. */}
                  {(() => {
                    const p = (activeProblem as any)?.project as Project | undefined;
                    const fmtD = (d: Date | null | undefined) =>
                      d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'the target date';
                    const daysLeft = p?.end ? Math.ceil((p.end.getTime() - Date.now()) / 864e5) : null;
                    const dueClause =
                      daysLeft === null ? '' : daysLeft >= 0 ? ` (${daysLeft} days away)` : ` (${-daysLeft} days past)`;
                    /* The AI answers quote the PLAN too — an assistant that cites different
                       totals from the header it sits under is the fastest way to lose a
                       reader's trust in it. */
                    const pk = planSummaryOf(p ?? null);
                    const openTasks = Math.max(0, pk.tasks - pk.completed);
                    const ask = (label: string, answer: string) => quickActionHandlerRef.current?.(label, answer);
                    const riskAnswer = `Schedule risk assessment for ${p?.name ?? 'this project'}:

• Completion stands at ${p?.completion ?? 0}% with ${openTasks} of ${pk.tasks} tasks still open against the ${fmtD(p?.end)} due date${dueClause}.
• The Implementation phase is tracking past its planned window — "Environment build-out" and "Configure VLANs and firewall rules" are overdue.
• Milestones: ${pk.milestonesDone} of ${pk.milestones} complete. "UAT sign-off" is the next gate and depends on the overdue build tasks.

Recommendation: re-baseline the Implementation window, pull the two overdue tasks into this week's stand-up, and flag the due-date risk to the sponsor now — not at the next checkpoint.`;
                    const statusAnswer = `Here's a status update ready to send:

Subject: ${p?.name ?? 'Project'} — status update

Overall: ${p?.completion ?? 0}% complete against the ${fmtD(p?.end)} target. ${pk.milestonesDone} of ${pk.milestones} milestones are done and ${pk.completed} of ${pk.tasks} tasks are closed.

Highlights
• Planning & Design is complete — charter approved and the delivery team fully allocated.
• Rollout & Handover remains on its planned window.

Watch items
• Implementation is running behind its planned window; a recovery plan is in motion.
• "UAT sign-off" may shift if the build tasks slip further.

Next steps
• Close the overdue build tasks this sprint.
• Confirm the pilot cohort ahead of "Pilot group rollout".`;
                    const forecastAnswer = `Completion forecast:

At today's pace — ${p?.completion ?? 0}% done${daysLeft !== null ? ` with ${Math.abs(daysLeft)} days ${daysLeft >= 0 ? 'to' : 'past'} the ${fmtD(p?.end)} due date` : ''} — the projected finish lands about 2–3 weeks past the target. The overdue Implementation tasks are the main drag.

To bring it back on track:
• Recover "Environment build-out" and "Configure VLANs and firewall rules" this week (~1 week saved).
• Run "Security review" in parallel with "Data migration dry run".
• Hold the Rollout & Handover window — it still has slack.`;
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => ask('Assess Schedule Risk', riskAnswer)}
                          style={{
                            background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                            border: '1px solid transparent'
                          }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                        >
                          <span>Assess schedule risk</span>
                        </button>
                        <button
                          onClick={() => ask('Draft Status Update', statusAnswer)}
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                        >
                          <span>Draft status update</span>
                        </button>
                        <button
                          onClick={() => ask('Forecast Completion', forecastAnswer)}
                          style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                        >
                          <span>Forecast completion</span>
                        </button>
                      </div>
                    );
                  })()}
                  </>
                  )}
                </div>
              )}
            </div>

            {/* Tabs: Conversation, Task, etc. */}
            <div className="border-b border-[#e5e7eb] bg-white sticky top-0 z-99">
              <div ref={tabContainerRef} className="flex items-center gap-2.5 px-6 relative overflow-x-clip">
                {(() => {
                  const tabConfig = [
                    { id: 'service-request', label: 'Service Request', condition: activeProblem?.id === 'PBM-608' },
                    { id: 'planning', label: 'Planning' },
                    { id: 'conversation', label: 'Conversation' },
                    { id: 'relations', label: 'Relations', condition: true },
                    { id: 'audit', label: 'Audit Trails' },
                  ].filter(tab => tab.condition !== false);

                  const allowedTabIds = tabConfig.map(tab => tab.id);
                  const filteredVisibleTabs = visibleTabs.filter(tabId => allowedTabIds.includes(tabId));
                  const filteredOverflowTabs = overflowTabs.filter(tabId => allowedTabIds.includes(tabId));

                  const tabLabels: Record<string, string> = {
                    'service-request': 'Service Request',
                    'planning': 'Planning',
                    'conversation': 'Conversation',
                    'approvals': 'Approvals',
                    'relations': 'Relations',
                    'audit': 'Audit Trails',
                    'resolution': 'Resolution'
                  };

                  const renderTab = (tabId: string) => (
                    <button 
                      key={tabId}
                      className={`px-2 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${activeMainTab === tabId ? 'text-[#3D8BD0] border-[#3D8BD0]' : 'text-[#6b7280] border-transparent hover:bg-[#F5F7FA] hover:text-[#364658] hover:border-[#CBD5E1]'}`}
                      onClick={() => { setActiveMainTab(tabId as any); setRelationsTypeFilter(null); }}
                    >
                      {tabLabels[tabId]}
                      {tabId === 'conversation' && activeProblem?.id !== 'PBM-627' && activeProblem?.id !== 'PBM-608' && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {conversationCount}
                        </span>
                      )}
                      {tabId === 'approvals' && activeProblem?.id !== 'PBM-627' && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {approvalsCount}
                        </span>
                      )}

                    </button>
                  );

                  const hasOverflow = filteredOverflowTabs.length > 0;

                  return (
                    <>
                      {filteredVisibleTabs.map(renderTab)}
                      {hasOverflow && (
                        <div className="relative" ref={moreDropdownRef}>
                          <button
                            className={`px-1 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1 ${filteredOverflowTabs.includes(activeMainTab) ? 'text-[#3D8BD0] border-b-2 border-[#3D8BD0]' : 'text-[#6b7280] hover:text-[#364658]'}`}
                            onClick={() => setShowMoreTabsDropdown(!showMoreTabsDropdown)}
                          >
                            {filteredOverflowTabs.includes(activeMainTab) ? tabLabels[activeMainTab] : 'More'}
                            <ChevronDown className="size-4" />
                          </button>
                          {showMoreTabsDropdown && (
                            <div className="app-menu absolute top-full right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 min-w-[160px] z-[9999]">
                              {filteredOverflowTabs.map(tabId => (
                                <button
                                  key={tabId}
                                  className={`w-full text-left px-4 py-2 text-[14px] hover:bg-[#f3f4f6] ${activeMainTab === tabId ? 'text-[#3D8BD0] font-medium' : 'text-[#6b7280]'}`}
                                  onClick={() => {
                                    setActiveMainTab(tabId as any);
                                    setShowMoreTabsDropdown(false);
                                  }}
                                >
                                  {tabLabels[tabId]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tab Content */}
            {activeMainTab === 'conversation' && (
            <div className="px-6 pt-0">
              {isBlankTicket ? (
                <ConversationEmptyState onAcknowledge={() => handleReplyWithAI('Acknowledge')} />
              ) : hasConversationsForTicket && (activeProblem?.id === 'PBM-627' || activeProblem?.id === 'PBM-608') ? (
                // Show only sent conversations for blank tickets that have conversations
                <BlankTicketConversationView 
                  conversations={sentConversations.filter(c => c.ticketId === activeProblemId)}
                  activeConversationTab={activeConversationTab}
                  setActiveConversationTab={setActiveConversationTab}
                  showSubTabSearch={showSubTabSearch}
                  setShowSubTabSearch={setShowSubTabSearch}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSortedFromTop={isSortedFromTop}
                  setIsSortedFromTop={setIsSortedFromTop}
                  onDelete={(id) => {
                    setSentConversations(sentConversations.filter(c => c.id !== id));
                  }}
                  setShowReplyEditor={setShowReplyEditor}
                  setShowForwardEditor={setShowForwardEditor}
                  setShowCollaborateEditor={setShowCollaborateEditor}
                  setShowNoteEditor={setShowNoteEditor}
                  getRelativeTime={getRelativeTime}
                  formatFullDate={formatFullDate}
                />
              ) : (
              <>
              <div className="space-y-4">
                <div className="sticky top-[48px] z-10 bg-white flex items-center justify-end mb-6 py-3 px-6 -mx-6">
                  <div className="flex items-center gap-2 relative">
                    {!showSubTabSearch ? (
                      <button 
                        className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors"
                        onClick={() => setShowSubTabSearch(true)}
                      >
                        <Search size={16} className="text-[#6b7280]" />
                      </button>
                    ) : (
                      <div className="flex h-9 w-[280px] min-w-[180px] max-w-full items-center gap-2 rounded border border-[#DFE5ED] bg-white px-3">
                        <Search className="w-4 h-4 text-[#7B8FA5]" />
                        <input
                          type="text"
                          placeholder="Search Conversation..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="outline-none text-xs bg-transparent placeholder:text-[#7B8FA5] text-[#364658] flex-1 min-w-0"
                          autoFocus
                        />
                        <button 
                          className="p-0.5 hover:bg-[#F5F7FA] rounded transition-colors"
                          onClick={() => {
                            setShowSubTabSearch(false);
                            setSearchQuery('');
                          }}
                        >
                          <X className="w-3.5 h-3.5 text-[#7B8FA5]" />
                        </button>
                      </div>
                    )}
                    <button className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">
                      <Filter size={16} className="text-[#6b7280]" />
                    </button>
                    <button 
                      className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors"
                      onClick={() => setIsSortedFromTop(!isSortedFromTop)}
                      title={isSortedFromTop ? 'Sort from bottom' : 'Sort from top'}
                    >
                      <ArrowUpDown size={16} className="text-[#6b7280]" />
                    </button>
                  </div>
                </div>

                {/* Conversations Container with Sorting */}
                <div className={`${isSortedFromTop ? 'flex flex-col-reverse' : ''}`}>
                
                {/* Show Old Messages Button or Last Week Group */}
                {!showOldMessages ? (
                  <div className="relative flex items-center gap-4 py-2">
                    <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.40) 100%)' }} />
                    <button
                      onClick={() => setShowOldMessages(!showOldMessages)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F5F7FA] text-[#6b7280] border border-[#DFE5ED] rounded transition-colors"
                    >
                      {/* Overlapping Profile Icons */}
                      <div className="flex -space-x-2">
                        <div className="size-5 rounded bg-[#3D8BD0] flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                          SA
                        </div>
                        <div className="size-5 rounded bg-[#10B981] flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                          AD
                        </div>
                        <div className="size-5 rounded bg-[#F59E0B] flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                          MP
                        </div>
                      </div>
                      <span className="text-xs">12 activities</span>
                      {/* Stacked Chevrons */}
                      <div className="flex flex-col -space-y-1">
                        <ChevronUp className="size-3" />
                        <ChevronDown className="size-3" />
                      </div>
                    </button>
                    <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.40) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                  </div>
                ) : (
                  <div>
                {/* Last Week Divider */}
                <div className="flex items-center gap-3 pt-2 pb-6">
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.40) 100%)' }} />
                  <span className="text-xs font-medium text-[#7B8FA5]">Last Week</span>
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.40) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                </div>
                    {/* Comment */}
                    <div className="flex gap-3 group relative">
                  <div className="flex flex-col items-center">
                    <div className="size-[24px] rounded bg-[#fbbf24] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      MT
                    </div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#364658]">Mia Thompson</span>
                      <span className="text-xs text-[#7B8FA5]">6 days ago</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                            <Lock className="size-3" />
                            Internal
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Not Visible to Requester
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="bg-[rgba(245,133,24,0.10)] rounded-lg border-l-2 border-[#F58518] p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        <span className="text-[#3D8BD0] font-medium">@Arnav Desai</span>{thread.mention.replace('@Arnav Desai', '')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete">
                      <Trash2 className="size-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>

                {/* Reporter Comment */}
                {activeConversationTab === 'all' && (
                replyingToConversation === 'conversation-5days' ? (
                  <InlineReplyEditor
                    replyContent={inlineReplyContent}
                    onReplyContentChange={setInlineReplyContent}
                    onClose={() => setReplyingToConversation(null)}
                    conversationAuthor="Arnav Desai"
                    conversationTime="5 days ago"
                    conversationText={thread.escalateShort}
                    onDeleteQuotedText={() => setReplyingToConversation(null)}
                  />
                ) : (
                <div className="flex gap-3 group relative">
                  <div className="flex flex-col items-center">
                    <div className="size-[24px] rounded bg-[#E67E22] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      AD
                    </div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#364658]">Arnav Desai</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-[#7B8FA5] cursor-help">5 days ago</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Friday, February 6, 2026 at 3:15 PM
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                          <div>Escalated to {thread.to[0]}, {thread.to[1]}, Cc: saahil.pandya@motadata.com,...</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="mb-2">
                            <div className="font-medium">To: {thread.to[0]}</div>
                            <div className="ml-4">{thread.to[1]}</div>
                          </div>
                          <div>
                            <div className="font-medium"><CopyableEmails text="Cc: saahil.pandya@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                            <div className="ml-4">{thread.to[0]}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        {showFullForwardText ? (
                          <>
                            {thread.escalateFull}
                          </>
                        ) : (
                          <>
                            {thread.escalateShort}{' '}
                            <button 
                              onClick={() => setShowFullForwardText(!showFullForwardText)}
                              className="text-xs text-[#3D8BD0] hover:text-[#2E6BA4] inline"
                            >
                              View full message
                            </button>
                          </>
                        )}
                      </p>
                      
                      {showFullForwardText && (
                        <button 
                          onClick={() => setShowFullForwardText(!showFullForwardText)}
                          className="text-xs text-[#3D8BD0] hover:text-[#2E6BA4] mt-3 block"
                        >
                          View less
                        </button>
                      )}
                      
                      {/* Divider */}
                      <div className="border-t border-[#DFE5ED] my-3"></div>
                      
                      {/* Toggle Forwarded Message */}
                      <div className="relative inline-flex">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => setShowForwardedMessage(!showForwardedMessage)}
                              className="flex items-center gap-2 text-xs text-[#3D8BD0] hover:text-[#2E6BA4]"
                            >
                              <span>•••</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {showForwardedMessage ? 'Hide expanded content' : 'Show trimmed content'}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Forwarded Message Content */}
                      {showForwardedMessage && (
                        <div className="border-l-2 border-[#DFE5ED] pl-4 mt-3">
                          <div className="text-xs text-[#7B8FA5] mb-2">
                            <div><span className="font-medium">From:</span> {thread.origFrom}</div>
                            <div><span className="font-medium">Date:</span> Feb 4, 2026 at 9:42 AM</div>
                            <div><span className="font-medium">To:</span><CopyableEmails text=" servicedesk@motadata.com" /></div>
                            <div><span className="font-medium">Subject:</span> Monitoring migration to SolarWinds Observability</div>
                          </div>
                          <div className="bg-[rgba(223,229,237,0.15)] rounded-lg p-3">
                            <p className="text-sm text-[#364658] leading-relaxed">
                              {thread.origMsg}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                      title="Reply"
                      onClick={() => {
                        setReplyingToConversation('conversation-5days');
                        setInlineReplyContent('');
                      }}
                    >
                      <Reply className="size-4 text-[#7B8FA5]" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                      title="Forward"
                      onClick={() => {
                        // Add forward handler here
                        console.log('Forward clicked');
                      }}
                    >
                      <Forward className="size-4 text-[#7B8FA5]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete">
                      <Trash2 className="size-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>
                )
                )}
                  </div>
                )}

                {/* 2 Days Ago Group */}
                {activeConversationTab === 'all' && (
                  <div>
                {/* 2 Days Ago Divider */}
                <div className="flex items-center gap-3 pt-2 pb-6">
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.40) 100%)' }} />
                  <span className="text-xs font-medium text-[#7B8FA5]">2 Days Ago</span>
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.40) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                </div>

                {/* Arnav Desai Reply with Attachments */}
                {replyingToConversation === 'conversation-2days' ? (
                  <InlineReplyEditor
                    replyContent={inlineReplyContent}
                    onReplyContentChange={setInlineReplyContent}
                    onClose={() => setReplyingToConversation(null)}
                    conversationAuthor="Arnav Desai"
                    conversationTime="2 days ago"
                    conversationText={thread.reply}
                    onDeleteQuotedText={() => setReplyingToConversation(null)}
                  />
                ) : (
                  <div className="flex gap-3 group relative">
                    <div className="flex flex-col items-center">
                      <div className="size-[24px] rounded bg-[#E67E22] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        AD
                      </div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#364658]">Arnav Desai</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-[#7B8FA5] cursor-help">2 days ago</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Monday, February 9, 2026 at 11:20 AM
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                            <div>Replied to {thread.to[0]}, {thread.to[1]}, Cc: saahil.pandya@motadata.com,...</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="mb-2">
                              <div className="font-medium">To: {thread.to[0]}</div>
                              <div className="ml-4">{thread.to[1]}</div>
                            </div>
                            <div>
                              <div className="font-medium"><CopyableEmails text="Cc: saahil.pandya@motadata.com" /></div>
                              <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                              <div className="ml-4">{thread.to[1]}</div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                        <p className="text-sm text-[#364658] leading-relaxed">
                          {thread.reply}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="group/file relative flex items-center gap-2 px-3 py-1 pr-16 bg-[#F5F7FA] border border-[#DFE5ED] rounded hover:bg-[#EEF2F7] transition-colors">
                          <FileTypeBadge name={thread.file1} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-xs text-[#364658] font-medium">{thread.file1}</span>
                            <span className="text-[10px] text-[#7B8FA5]">674 KB</span>
                          </div>
                          {/* Hover Actions */}
                          <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center gap-1">
                            <button className="p-1 hover:bg-white rounded" title="Download">
                              <Download className="size-3.5 text-[#7B8FA5]" />
                            </button>
                            <button className="p-1 hover:bg-white rounded" title="Delete">
                              <Trash2 className="size-3.5 text-[#EF4444]" />
                            </button>
                          </div>
                        </div>
                        <div className="group/file relative flex items-center gap-2 px-3 py-1 pr-16 bg-[#F5F7FA] border border-[#DFE5ED] rounded hover:bg-[#EEF2F7] transition-colors">
                          <FileTypeBadge name={thread.file2} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-xs text-[#364658] font-medium">{thread.file2}</span>
                            <span className="text-[10px] text-[#7B8FA5]">2 MB</span>
                          </div>
                          {/* Hover Actions */}
                          <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center gap-1">
                            <button className="p-1 hover:bg-white rounded" title="Download">
                              <Download className="size-3.5 text-[#7B8FA5]" />
                            </button>
                            <button className="p-1 hover:bg-white rounded" title="Delete">
                              <Trash2 className="size-3.5 text-[#EF4444]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button 
                        className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                        title="Reply"
                        onClick={() => {
                          setReplyingToConversation('conversation-2days');
                          setInlineReplyContent('');
                        }}
                      >
                        <Reply className="size-4 text-[#7B8FA5]" />
                      </button>
                      <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Forward">
                        <Forward className="size-4 text-[#7B8FA5]" />
                      </button>
                      <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete">
                        <Trash2 className="size-4 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                )}

                {/* Yesterday Group */}
                <div>
                {/* 3 Days Ago Divider */}
                <div className="flex items-center gap-3 pt-2 pb-6">
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.40) 100%)' }} />
                  <span className="text-xs font-medium text-[#7B8FA5]">Yesterday</span>
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.40) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                </div>

                {/* Arnav Desai Note */}
                <div className="flex gap-3 group relative">
                  <div className="flex flex-col items-center">
                    <div className="size-[24px] rounded bg-[#E67E22] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      AD
                    </div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#364658]">Arnav Desai</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-[#7B8FA5] cursor-help">1 day ago</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Tuesday, February 10, 2026 at 2:45 PM
                        </TooltipContent>
                      </Tooltip>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(200,66,53,0.05)] text-[#C84235] text-xs rounded font-medium">
                        <FileText className="size-3" />
                        Note
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                            <Lock className="size-3" />
                            Internal
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Not Visible to Requester
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="bg-[rgba(245,133,24,0.10)] rounded-lg border-l-2 border-[#F58518] p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        {thread.note}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Edit" onClick={() => setEditingNote('note-1')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete">
                      <Trash2 className="size-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>
                </div>

                {/* Today Group */}
                {activeConversationTab === 'all' && (
                  <div>
                {/* Today Divider */}
                <div className="flex items-center gap-3 pt-2 pb-6">
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.40) 100%)' }} />
                  <span className="text-xs font-medium text-[#7B8FA5]">Today</span>
                  <div className="flex-1 h-px rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.40) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                </div>

                {/* Arnav Desai - Today */}
                {replyingToConversation === 'conversation-today' ? (
                  <InlineReplyEditor
                    replyContent={inlineReplyContent}
                    onReplyContentChange={setInlineReplyContent}
                    onClose={() => setReplyingToConversation(null)}
                    conversationAuthor="Arnav Desai"
                    conversationTime="8 hours ago"
                    conversationText={thread.today}
                    onDeleteQuotedText={() => setReplyingToConversation(null)}
                  />
                ) : (
                <div className="flex gap-3 group relative">
                  <div className="flex flex-col items-center">
                    <div className="size-[24px] rounded bg-[#E67E22] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">AD</div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#364658]">Arnav Desai</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-[#7B8FA5] cursor-help">8 hours ago</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Wednesday, February 11, 2026 at 4:45 AM
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                          <div>Replied to {thread.to[0]}, {thread.to[1]}, Cc: saahil.pandya@motadata.com,...</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="mb-2">
                            <div className="font-medium">To: {thread.to[0]}</div>
                            <div className="ml-4">{thread.to[1]}</div>
                          </div>
                          <div>
                            <div className="font-medium"><CopyableEmails text="Cc: saahil.pandya@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="network.ops@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="nirav.bhatt@motadata.com" /></div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        {thread.today}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                      title="Reply" 
                      onClick={() => {
                        setReplyingToConversation('conversation-today');
                        setInlineReplyContent('');
                      }}
                    >
                      <Reply className="size-4 text-[#7B8FA5]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Forward" onClick={() => console.log('Forward clicked')}>
                      <Forward className="size-4 text-[#7B8FA5]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete">
                      <Trash2 className="size-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>
                )}
                
                {/* Sent Conversations - shown after Today's messages */}
                {sentConversations.filter(c => c.ticketId === activeProblemId).map((conversation) => (
                  <div key={conversation.id} className="flex gap-3 group relative">
                    <div className="flex flex-col items-center">
                      <div 
                        className="size-[24px] rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: conversation.authorColor }}
                      >
                        {conversation.authorInitials}
                      </div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#364658]">{conversation.author}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-[#7B8FA5] cursor-help">{getRelativeTime(conversation.timestamp)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatFullDate(conversation.timestamp)}
                          </TooltipContent>
                        </Tooltip>
                        {conversation.type === 'note' && (
                          <>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(200,66,53,0.05)] text-[#C84235] text-xs rounded font-medium">
                              <FileText className="size-3" />
                              Note
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                                  <Lock className="size-3" />
                                  Internal
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Not Visible to Requester
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {conversation.type === 'collaborate' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                                <Lock className="size-3" />
                                Internal
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Not Visible to Requester
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {conversation.type === 'reply' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                              <div>Replied to {conversation.to}{conversation.cc ? `, Cc: ${conversation.cc},...` : ''}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="mb-2">
                                <div className="font-medium">To: {conversation.to}</div>
                              </div>
                              {conversation.cc && (
                                <div>
                                  <div className="font-medium">Cc: {conversation.cc}</div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <div className={`rounded-lg p-4 mt-2 ${
                        conversation.type === 'note' || conversation.type === 'collaborate'
                          ? 'bg-[rgba(245,133,24,0.10)] border-l-2 border-[#F58518]'
                          : 'bg-[rgba(223,229,237,0.20)]'
                      }`}>
                        <div className="text-sm text-[#364658] leading-relaxed whitespace-pre-wrap">
                          {conversation.content}
                        </div>
                        {conversation.kbArticles && conversation.kbArticles.length > 0 && (
                          <div className="mt-3 p-3 bg-[#F0F8FF] border border-[#B8DCFF] rounded-lg">
                            <h4 className="text-xs font-semibold text-[#3D8BD0] mb-2">Suggested KB Articles</h4>
                            <div className="space-y-1.5">
                              {conversation.kbArticles.map((article) => (
                                <a
                                  key={article.id}
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] hover:underline"
                                >
                                  <FileText size={12} className="flex-shrink-0" />
                                  <span>{article.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button 
                        className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                        title="Reply" 
                        onClick={() => {
                          setReplyingToConversation(conversation.id);
                          setInlineReplyContent('');
                        }}
                      >
                        <Reply className="size-4 text-[#7B8FA5]" />
                      </button>
                      <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Forward" onClick={() => console.log('Forward clicked')}>
                        <Forward className="size-4 text-[#7B8FA5]" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-[#F3F4F6] rounded" 
                        title="Delete"
                        onClick={() => {
                          setSentConversations(sentConversations.filter(c => c.id !== conversation.id));
                        }}
                      >
                        <Trash2 className="size-4 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                ))}
                  </div>
                )}
                </div>
                {/* End Conversations Container */}
              </div>
              </>
              )}

              {/* Reply Editor */}
              {showReplyEditor && (
                <ReplyEditor
                  replyFormRef={replyFormRef}
                  onClose={() => {
                    setShowReplyEditor(false);
                    setAiTypingText('');
                    setIsAiTyping(false);
                    setShowKbArticles(false);
                  }}
                  onSend={handleSendReply}
                  showCc={showCc}
                  setShowCc={setShowCc}
                  isAiTyping={isAiTyping}
                  aiTypingText={aiTypingText}
                  setAiTypingText={setAiTypingText}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  replyContentRef={replyContentRef}
                  textareaRef={textareaRef}
                  setShowAIAssist={setShowAIAssist}
                  showAIAssistMenu={showAIAssistMenu}
                  setShowAIAssistMenu={setShowAIAssistMenu}
                  aiAssistMenuRef={aiAssistMenuRef}
                  handleReplyWithAI={handleReplyWithAI}
                  showToneSubmenu={showToneSubmenu}
                  setShowToneSubmenu={setShowToneSubmenu}
                  showFormattingMenu={showFormattingMenu}
                  setShowFormattingMenu={setShowFormattingMenu}
                  formattingMenuRef={formattingMenuRef}
                  requesterEmail={activeProblem ? `${activeProblem.requester.toLowerCase().replace(/ /g, '.')}@motadata.com` : undefined}
                  showKbArticles={showKbArticles}
                  kbArticles={kbArticles}
                  setKbArticles={setKbArticles}
                />
              )}

              {/* Forward Editor */}
              {showForwardEditor && (
                <div className="mt-6 border border-[#3D8BD0] rounded-lg overflow-hidden bg-white shadow-sm" ref={forwardFormRef}>
                  {/* Forward Header */}
                  <div className="px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#364658]">Forward</h3>
                    <div className="flex items-center gap-2">
                      <button className="text-[#7B8FA5] hover:text-[#364658]">
                        <Maximize2 size={16} />
                      </button>
                      <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={() => setShowForwardEditor(false)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Forward Form Content */}
                  <div className="p-4">
                    {/* To Field */}
                    <div className="pb-3 border-b border-[#DFE5ED]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs text-[#7B8FA5]">To</label>
                          <input
                            type="text"
                            className="flex-1 text-sm text-[#364658] focus:outline-none bg-transparent"
                            defaultValue=""
                          />
                        </div>
                        <button 
                          onClick={() => setShowCc(!showCc)}
                          className="text-xs text-[#7B8FA5] hover:text-[#3D8BD0]"
                        >
                          Cc
                        </button>
                      </div>
                    </div>

                    {/* Cc Field */}
                    {showCc && (
                      <div className="pt-3 pb-3 border-b border-[#DFE5ED]">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#7B8FA5]">Cc</label>
                          <input
                            type="text"
                            placeholder="Add recipients"
                            className="flex-1 text-sm text-[#364658] focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Subject Field */}
                    <div className="pt-3 pb-3 border-b border-[#DFE5ED]">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#7B8FA5]">Subject</label>
                        <input
                          type="text"
                          className="flex-1 text-[#364658] focus:outline-none bg-transparent"
                          style={{ fontSize: '12px', pointerEvents: 'auto' }}
                          defaultValue={`Fwd: ${activeProblem?.id || ''} - ${activeProblem?.subject || ''}`}
                          readOnly={false}
                        />
                      </div>
                    </div>

                    {/* Text Area */}
                    <div className="mb-4 mt-4">
                      {forwardContent ? (
                        <div
                          ref={forwardContentRef}
                          contentEditable
                          dir="ltr"
                          onInput={(e) => setForwardContent(e.currentTarget.innerHTML)}
                          className="w-full min-h-[128px] text-sm text-[#364658] focus:outline-none bg-transparent"
                          style={{
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        />
                      ) : (
                        <div
                          ref={forwardContentRef}
                          contentEditable
                          dir="ltr"
                          onInput={(e) => setForwardContent(e.currentTarget.innerHTML)}
                          className="w-full min-h-[128px] text-sm text-[#9CA3AF] focus:outline-none bg-transparent empty:before:content-[attr(data-placeholder)]"
                          data-placeholder="Add your message..."
                          style={{
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        />
                      )}
                    </div>

                    {/* Original Message */}
                    <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#DFE5ED]">
                      <div className="text-xs text-[#7B8FA5] mb-2">---------- Forwarded message ----------</div>
                      <div className="space-y-1 mb-3">
                        <div className="text-xs">
                          <span className="text-[#7B8FA5]">From:</span>
                          <span className="text-[#364658] ml-1">Rakesh Rathod &lt;rakesh.rathod@example.com&gt;</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-[#7B8FA5]">Date:</span>
                          <span className="text-[#364658] ml-1">Feb 8, 2026, 10:30 AM</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-[#7B8FA5]">Subject:</span>
                          <span className="text-[#364658] ml-1">{activeProblem?.id || ''} - {activeProblem?.subject || ''}</span>
                        </div>
                      </div>
                      <div className="text-sm text-[#364658]">
                        {thread.origMsg}
                      </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-between">
                      {/* Left Side - AI Assist and Formatting Tools */}
                      <div className="flex items-center gap-1">
                        <div className="relative" ref={aiAssistMenuForwardRef}>
                          <button 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                            style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                            onClick={() => setShowAIAssistMenuForward(!showAIAssistMenuForward)}
                          >
                            <AiSparkle size={14} />
                            <span>AI Assist</span>
                            <ChevronDown size={12} className="text-[#7B8FA5]" />
                          </button>

                          {/* AI Assist Dropdown */}
                          {showAIAssistMenuForward && (
                            <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                              <div className="py-2">
                                {/* Refine section header */}
                                <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                                  Refine
                                </div>
                                
                                {/* Rephrase */}
                                <button 
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                  onClick={() => setShowAIAssistMenuForward(false)}
                                >
                                  <RefreshCw size={14} className="text-[#364658]" />
                                  <span className="text-xs text-[#364658]">Rephrase</span>
                                </button>
                                
                                {/* Make longer */}
                                <button 
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                  onClick={() => setShowAIAssistMenuForward(false)}
                                >
                                  <TextCursorInput size={14} className="text-[#364658]" />
                                  <span className="text-xs text-[#364658]">Make longer</span>
                                </button>
                                
                                {/* Make shorter */}
                                <button 
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                  onClick={() => setShowAIAssistMenuForward(false)}
                                >
                                  <Minimize2 size={14} className="text-[#364658]" />
                                  <span className="text-xs text-[#364658]">Make shorter</span>
                                </button>
                                
                                {/* Change tone */}
                                <div className="relative">
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                                    onClick={() => setShowToneSubmenuForward(!showToneSubmenuForward)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Wand2 size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Change tone</span>
                                    </div>
                                    <ChevronRight size={14} className="text-[#7B8FA5]" />
                                  </button>

                                  {/* Tone Submenu */}
                                  {showToneSubmenuForward && (
                                    <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                      <div className="py-2">
                                        <button 
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                          onClick={() => {
                                            setShowToneSubmenuForward(false);
                                            setShowAIAssistMenuForward(false);
                                          }}
                                        >
                                          <Briefcase size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Professional</span>
                                        </button>
                                        
                                        <button 
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                          onClick={() => {
                                            setShowToneSubmenuForward(false);
                                            setShowAIAssistMenuForward(false);
                                          }}
                                        >
                                          <Heart size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Empathetic</span>
                                        </button>
                                        
                                        <button 
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                          onClick={() => {
                                            setShowToneSubmenuForward(false);
                                            setShowAIAssistMenuForward(false);
                                          }}
                                        >
                                          <Zap size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Concise</span>
                                        </button>
                                        
                                        <button 
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                          onClick={() => {
                                            setShowToneSubmenuForward(false);
                                            setShowAIAssistMenuForward(false);
                                          }}
                                        >
                                          <FileText size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Formal</span>
                                        </button>
                                        
                                        <button 
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                          onClick={() => {
                                            setShowToneSubmenuForward(false);
                                            setShowAIAssistMenuForward(false);
                                          }}
                                        >
                                          <SmilePlus size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Friendly</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <EditorToolbarActions />
                      </div>

                      {/* Right Side - Send Button */}
                      <EditorSendActions />
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborate Editor */}
              {showCollaborateEditor && (
                <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={collaborateFormRef}>
              {/* Collaborate Header */}
              <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#364658]">Collaborate</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#DFE5ED] rounded text-[#7B8FA5]">
                    <Lock size={12} />
                    <span className="text-xs">Not visible to requester</span>
                  </div>
                  <button className="text-[#7B8FA5] hover:text-[#364658]">
                    <Maximize2 size={16} />
                  </button>
                  <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={() => setShowCollaborateEditor(false)}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Collaborate Form Content */}
              <div className="p-4">
                {/* Text Area - No To/Cc fields for collaborate */}
                <div className="mb-4">
                  <RichComposerArea value={collaborateContent} onChange={setCollaborateContent} placeholder="Start typing your collaboration message..." />
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between">
                  {/* Left Side - AI Assist and Formatting Tools */}
                  <div className="flex items-center gap-1">
                  <div className="relative" ref={aiAssistMenuCollaborateRef}>
                    <button 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                      onClick={() => setShowAIAssistMenuCollaborate(!showAIAssistMenuCollaborate)}
                    >
                      <AiSparkle size={14} />
                      <span>AI Assist</span>
                      <ChevronDown size={12} className="text-[#7B8FA5]" />
                    </button>

                    {/* AI Assist Dropdown Menu - Refine options only */}
                    {showAIAssistMenuCollaborate && (
                      <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          {/* Refine section header */}
                          <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                            Refine
                          </div>
                          
                          {/* Rephrase */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuCollaborate(false);
                              // Handle rephrase action
                            }}
                          >
                            <RefreshCw size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Rephrase</span>
                          </button>
                          
                          {/* Make longer */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuCollaborate(false);
                              // Handle make longer action
                            }}
                          >
                            <TextCursorInput size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make longer</span>
                          </button>
                          
                          {/* Make shorter */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuCollaborate(false);
                              // Handle make shorter action
                            }}
                          >
                            <Minimize2 size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make shorter</span>
                          </button>
                          
                          {/* Change tone */}
                          <div className="relative">
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                              onClick={() => {
                                setShowToneSubmenuCollaborate(!showToneSubmenuCollaborate);
                                // Handle change tone action
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Wand2 size={14} className="text-[#364658]" />
                                <span className="text-xs text-[#364658]">Change tone</span>
                              </div>
                              <ChevronRight size={14} className="text-[#7B8FA5]" />
                            </button>

                            {/* Tone Submenu */}
                            {showToneSubmenuCollaborate && (
                              <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                <div className="py-2">
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuCollaborate(false);
                                      setShowAIAssistMenuCollaborate(false);
                                      // Handle professional tone action
                                    }}
                                  >
                                    <Briefcase size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Professional</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuCollaborate(false);
                                      setShowAIAssistMenuCollaborate(false);
                                      // Handle empathetic tone action
                                    }}
                                  >
                                    <Heart size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Empathetic</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuCollaborate(false);
                                      setShowAIAssistMenuCollaborate(false);
                                      // Handle concise tone action
                                    }}
                                  >
                                    <Zap size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Concise</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuCollaborate(false);
                                      setShowAIAssistMenuCollaborate(false);
                                      // Handle formal tone action
                                    }}
                                  >
                                    <FileText size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Formal</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuCollaborate(false);
                                      setShowAIAssistMenuCollaborate(false);
                                      // Handle friendly tone action
                                    }}
                                  >
                                    <SmilePlus size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Friendly</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formatting Tools */}
                  <div className="relative flex items-center gap-1" ref={formattingMenuCollaborateRef}>
                    {/* Always visible quick access icons */}
                    <EditorToolbarActions />

                    {/* All Formatting Options Dropdown */}
                    {showFormattingMenuCollaborate && (
                      <div className="app-menu absolute left-0 bottom-full mb-2 bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bold">
                            <Bold size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Italic">
                            <Italic size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Underline">
                            <Underline size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bulleted List">
                            <List size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Numbered List">
                            <ListOrdered size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 1">
                            <Heading1 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 2">
                            <Heading2 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 3">
                            <Heading3 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Left">
                            <AlignLeft size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Center">
                            <AlignCenter size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Right">
                            <AlignRight size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Justify">
                            <AlignJustify size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Code">
                            <Code size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Link">
                            <Link2 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Video">
                            <Video size={16} />
                          </button>
                          <button 
                            className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" 
                            title="Close"
                            onClick={() => setShowFormattingMenuCollaborate(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Right Side - Send Button */}
                  <EditorSendActions onSend={handleSendCollaborate} />
                </div>
              </div>
            </div>
              )}

              {/* Note Editor */}
              {showNoteEditor && (
                <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={noteFormRef}>
              {/* Note Header */}
              <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#364658]">Note</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#DFE5ED] rounded text-[#7B8FA5]">
                    <Lock size={12} />
                    <span className="text-xs">Not visible to requester</span>
                  </div>
                  <button className="text-[#7B8FA5] hover:text-[#364658]">
                    <Maximize2 size={16} />
                  </button>
                  <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={() => setShowNoteEditor(false)}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Note Form Content */}
              <div className="p-4">
                {/* Text Area - No To/Cc fields for note */}
                <div className="mb-4">
                  <RichComposerArea value={noteContent} onChange={setNoteContent} placeholder="Add your note..." />
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between">
                  {/* Left Side - AI Assist and Formatting Tools */}
                  <div className="flex items-center gap-1">
                  <div className="relative" ref={aiAssistMenuNoteRef}>
                    <button 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                      onClick={() => setShowAIAssistMenuNote(!showAIAssistMenuNote)}
                    >
                      <AiSparkle size={14} />
                      <span>AI Assist</span>
                      <ChevronDown size={12} className="text-[#7B8FA5]" />
                    </button>

                    {/* AI Assist Dropdown Menu - Refine options only */}
                    {showAIAssistMenuNote && (
                      <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          {/* Refine section header */}
                          <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                            Refine
                          </div>
                          
                          {/* Rephrase */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuNote(false);
                              // Handle rephrase action
                            }}
                          >
                            <RefreshCw size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Rephrase</span>
                          </button>
                          
                          {/* Make longer */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuNote(false);
                              // Handle make longer action
                            }}
                          >
                            <TextCursorInput size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make longer</span>
                          </button>
                          
                          {/* Make shorter */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenuNote(false);
                              // Handle make shorter action
                            }}
                          >
                            <Minimize2 size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make shorter</span>
                          </button>
                          
                          {/* Change tone */}
                          <div className="relative">
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                              onClick={() => {
                                setShowToneSubmenuNote(!showToneSubmenuNote);
                                // Handle change tone action
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Wand2 size={14} className="text-[#364658]" />
                                <span className="text-xs text-[#364658]">Change tone</span>
                              </div>
                              <ChevronRight size={14} className="text-[#7B8FA5]" />
                            </button>

                            {/* Tone Submenu */}
                            {showToneSubmenuNote && (
                              <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                <div className="py-2">
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuNote(false);
                                      setShowAIAssistMenuNote(false);
                                      // Handle professional tone action
                                    }}
                                  >
                                    <Briefcase size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Professional</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuNote(false);
                                      setShowAIAssistMenuNote(false);
                                      // Handle empathetic tone action
                                    }}
                                  >
                                    <Heart size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Empathetic</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuNote(false);
                                      setShowAIAssistMenuNote(false);
                                      // Handle concise tone action
                                    }}
                                  >
                                    <Zap size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Concise</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuNote(false);
                                      setShowAIAssistMenuNote(false);
                                      // Handle formal tone action
                                    }}
                                  >
                                    <FileText size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Formal</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenuNote(false);
                                      setShowAIAssistMenuNote(false);
                                      // Handle friendly tone action
                                    }}
                                  >
                                    <SmilePlus size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Friendly</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formatting Tools */}
                  <div className="relative flex items-center gap-1" ref={formattingMenuNoteRef}>
                    {/* Always visible quick access icons */}
                    <EditorToolbarActions />

                    {/* All Formatting Options Dropdown */}
                    {showFormattingMenuNote && (
                      <div className="app-menu absolute left-0 bottom-full mb-2 bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bold">
                            <Bold size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Italic">
                            <Italic size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Underline">
                            <Underline size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bulleted List">
                            <List size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Numbered List">
                            <ListOrdered size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 1">
                            <Heading1 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 2">
                            <Heading2 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 3">
                            <Heading3 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Left">
                            <AlignLeft size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Center">
                            <AlignCenter size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Right">
                            <AlignRight size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Justify">
                            <AlignJustify size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Code">
                            <Code size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Link">
                            <Link2 size={16} />
                          </button>
                          <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Video">
                            <Video size={16} />
                          </button>
                          <button 
                            className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" 
                            title="Close"
                            onClick={() => setShowFormattingMenuNote(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Right Side - Send Button */}
                  <EditorSendActions onSend={handleSendNote} />
                </div>
              </div>
            </div>
              )}
            </div>
            )}

            {/* Tasks Tab Content */}
            {activeMainTab === 'tasks' && (
              <TasksTabContent
                tasks={tasks}
                onAddTask={() => {
                  setEditingTask(null);
                  setShowTaskPanel(true);
                }}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setShowTaskPanel(true);
                }}
                onUpdateTask={(updatedTask) => {
                  setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
                }}
                onDeleteTask={(taskId) => {
                  setTasks(tasks.filter(t => t.id !== taskId));
                }}
              />
            )}

            {/* Approvals Tab Content */}
            {activeMainTab === 'approvals' && (
              <ApprovalsTabContent
                ticketId={activeProblem?.id}
                approvalSubjects={[thread.approval1, thread.approval2]}
                showCreateApprovalPopup={showCreateApprovalPopup}
                onCloseApprovalPopup={() => setShowCreateApprovalPopup(false)}
                onOpenApprovalPopup={() => setShowCreateApprovalPopup(true)}
                onApprove={() => {
                  // Create a new task when user approves
                  const taskSubject = activeProblem?.id === 'PBM-608'
                    ? 'Purchase and allocate Apple MacBook Pro 16-inch'
                    : `Implement fix and verify resolution for: ${activeProblem?.subject || 'problem'}`;

                  const taskDescription = activeProblem?.id === 'PBM-608'
                    ? 'Procure Apple MacBook Pro 16-inch with required specifications, configure standard development licenses, and allocate to the requester.'
                    : `Apply the approved resolution steps for "${activeProblem?.subject || 'problem'}" and confirm that the issue is fully resolved with no recurrence.`;

                  const newTask = {
                    id: `TASK-${tasks.length + 1}`,
                    subject: taskSubject,
                    userGroup: 'IT Support',
                    assignee: 'Sarah Johnson',
                    taskType: 'Approval Processing',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                    status: 'Open',
                    priority: 'High',
                    notifyBefore: '1',
                    notifyUnit: 'days',
                    description: taskDescription,
                    completed: false
                  };
                  setTasks([...tasks, newTask]);
                }}
              />
            )}

            {/* Relations Tab Content */}
            {activeMainTab === 'relations' && (
              <RelationsTabContent
                ticketId={activeProblem?.id}
                externalRelations={activeProblem?.id ? (ticketRelations[activeProblem.id]?.length ? ticketRelations[activeProblem.id] : DEFAULT_REL) : undefined}
                onOpenRelation={onOpenRelation}
                initialTypeFilter={relationsTypeFilter}
                onClearTypeFilter={() => setRelationsTypeFilter(null)}
              />
            )}

            {/* Audit Trails Tab Content */}
            {activeMainTab === 'audit' && <AuditTrailsTabContent ticketId={activeProblem?.id} />}

            {/* Analysis — the four root-cause fields. Its own tab now; the Solution moved to a
                Resolution tab after Audit Trails, matching the Request detail page. */}
            {activeMainTab === 'planning' && (
              <ProjectPlanningTab
                project={((activeProblem as any)?.project as Project | undefined) ?? null}
                drawerWidth={drawerWidth}
              />
            )}
            {activeMainTab === 'analysis' && (
              <div className="px-6 py-6">
                <div className="w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="size-4 text-[#3D8BD0]" />
                    <h3 className="text-[14px] font-semibold text-[#364658]">Analysis</h3>
                  </div>
                  <p className="text-[12px] text-[#7B8FA5] mb-3">Document the root cause analysis for this project.</p>
                  <div className={drawerWidth > 1080 ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-3'}>
                    <AnalysisField
                      label="Root Cause"
                      value={analysis.rootCause}
                      placeholder="No root cause defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, rootCause: v }))}
                    />
                    <AnalysisField
                      label="Symptoms"
                      value={analysis.symptoms}
                      placeholder="No symptoms defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, symptoms: v }))}
                    />
                    <AnalysisField
                      label="Impact"
                      value={analysis.impact}
                      placeholder="No impact defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, impact: v }))}
                    />
                    <AnalysisField
                      label="Work Around"
                      value={analysis.workaround}
                      placeholder="No work around defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, workaround: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resolution — Solution only. A problem records a permanent fix; the diagnosis half
                of the Request page's Resolution tab is the Analysis tab here. */}
            {activeMainTab === 'resolution' && (
              <div className="px-6 py-6">
                <div className="w-full min-w-0">
                  {/* Empty state matches the Request page's Resolution tab — centred icon, heading
                      and action. Only Solution here: a problem's diagnosis is the Analysis tab. */}
                  {!hasSolution && !solutionData ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center max-w-lg">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
                          <Lightbulb className="size-8 text-[#7B8FA5]" />
                        </div>
                        <h3 className="font-semibold text-[#364658] mb-2 text-[14px]">No Solution Added</h3>
                        <p className="text-[#7B8FA5] mb-6 text-[13px] max-w-[300px] mx-auto">
                          Record the permanent fix applied to close out this project.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setHasSolution(true)}
                            className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                          >
                            <Lightbulb className="size-4" />
                            Add Solution
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : solutionData ? (
                    <SolutionCard
                      content={solutionData.content}
                      timestamp={solutionData.timestamp}
                      onEdit={() => {
                        setSolutionText(solutionData.content);
                        setHasSolution(true);
                        setSolutionData(null);
                      }}
                      onDelete={() => {
                        setSolutionData(null);
                      }}
                    />
                  ) : hasSolution ? (
                    <div className="w-full border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={solutionFormRef}>
                      <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#364658]">Solution</h3>
                        <button
                          className="text-[#7B8FA5] hover:text-[#364658]"
                          onClick={() => { setHasSolution(false); setSolutionText(''); }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="mb-4">
                          <textarea
                            value={solutionText}
                            onChange={(e) => setSolutionText(e.target.value)}
                            placeholder="Add your solution..."
                            className="w-full h-40 text-sm text-[#364658] focus:outline-none bg-transparent resize-none"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="relative" ref={aiAssistMenuSolutionRef}>
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                                onClick={() => setShowAIAssistMenuSolution(!showAIAssistMenuSolution)}
                              >
                                <AiSparkle size={14} />
                                <span>AI Assist</span>
                                <ChevronDown size={12} className="text-[#7B8FA5]" />
                              </button>
                              {showAIAssistMenuSolution && (
                                <div className="app-menu absolute left-0 bottom-full mb-2 w-[200px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 py-2">
                                  <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">Refine</div>
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => setShowAIAssistMenuSolution(false)}
                                  >
                                    <RefreshCw size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Rephrase</span>
                                  </button>
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => setShowAIAssistMenuSolution(false)}
                                  >
                                    <TextCursorInput size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Make longer</span>
                                  </button>
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => setShowAIAssistMenuSolution(false)}
                                  >
                                    <Minimize2 size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Make shorter</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Attach File">
                              <Paperclip size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Image">
                              <Image size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Link">
                              <Link2 size={16} />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (solutionText.trim()) {
                                setSolutionData({
                                  content: solutionText,
                                  timestamp: new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                });
                                setSolutionText('');
                                setHasSolution(false);
                              }
                            }}
                            className="px-4 py-1.5 bg-[#3D8BD0] text-white rounded hover:bg-[#2F7AB8] text-xs font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Service Request Tab Content */}
            {activeMainTab === 'service-request' && (
              <div className="px-6 py-6">
                <div className="space-y-4">
                  {/* Empty State */}
                  {serviceRequestItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                      <div className="size-20 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
                        <Briefcase className="size-10 text-[#9CA3AF]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#364658] mb-2">No Items in Service Request</h3>
                      <p className="text-sm text-[#7B8FA5] text-center mb-6 max-w-md">
                        Start building your service request by adding items from the catalog. Browse and select the products or services you need.
                      </p>
                      <button 
                        className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowServiceCatalog(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Browse Catalog
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Render all service request items */}
                      {serviceRequestItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg hover:border-[#D1D5DB] transition-colors">
                    {/* Accordion Header */}
                    <div 
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => {
                        if (expandedItemIds.includes(item.id)) {
                          setExpandedItemIds(expandedItemIds.filter(id => id !== item.id));
                        } else {
                          setExpandedItemIds([...expandedItemIds, item.id]);
                        }
                      }}
                    >
                      {/* Product Icon */}
                      <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBackgroundColor(item.icon)}`}>
                        {renderCatalogIcon(item.icon, 'medium')}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-medium text-[#364658] mb-1">{item.name}</h4>
                        <div className="flex items-center gap-3 text-[13px] text-[#7B8FA5]">
                          <span>Quantity: <span className="text-[#364658] font-medium">{item.quantity}</span></span>
                          <span className="text-[#D1D5DB]">|</span>
                          <span>Price: <span className="text-[#364658] font-medium">{item.price}</span></span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Status Dropdown */}
                        <div className="relative" ref={serviceRequestStatusRef}>
                          <button
                            className="hidden px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-2 transition-colors hover:opacity-80"
                            style={{ color: '#364658' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowServiceRequestItemStatus(showServiceRequestItemStatus === item.id ? null : item.id);
                            }}
                          >
                            <div className={`size-2 rounded-full ${getStatusStyle(item.status || 'Requested').dot}`}></div>
                            {item.status || 'Requested'}
                            <ChevronDown className="size-4" />
                          </button>
                          
                          {/* Status Dropdown Menu */}
                          {showServiceRequestItemStatus === item.id && (
                            <div 
                              className="app-menu absolute left-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {['Requested', 'In Progress', 'Delivered'].map((status) => (
                                <button
                                  key={status}
                                  className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Update item status
                                    const updatedItems = serviceRequestItems.map(i => 
                                      i.id === item.id ? { ...i, status } : i
                                    );
                                    setServiceRequestItems(updatedItems);
                                    setShowServiceRequestItemStatus(null);
                                  }}
                                >
                                  <div className={`size-2 rounded-full ${getStatusStyle(status).dot}`}></div>
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="relative" ref={serviceRequestMenuRef}>
                          <button 
                            className="p-2 hover:bg-[#F3F4F6] rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowServiceRequestMenu(showServiceRequestMenu === item.id ? null : item.id);
                            }}
                          >
                            <MoreHorizontal className="size-5 text-[#6B7280]" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showServiceRequestMenu === item.id && (
                            <div 
                              className="app-menu absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[9999]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full px-4 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowServiceRequestMenu(null);
                                  // Open edit popup with item data
                                  setEditingItem(item);
                                  setEditItemQuantity(item.quantity);
                                  setEditProcessor(item.configuration?.processor || 'Apple M3 Pro');
                                  setEditRAM(item.configuration?.ram || '16 GB');
                                  setEditStorage(item.configuration?.storage || '512 GB SSD');
                                  setEditDisplay(item.configuration?.display || '14" Retina');
                                  setEditGraphics(item.configuration?.graphics || 'Integrated GPU');
                                  setEditColor(item.configuration?.color || 'Space Gray');
                                  setShowEditItemPopup(true);
                                }}
                              >
                                <Edit className="size-4 text-[#6B7280]" />
                                Edit
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowServiceRequestMenu(null);
                                  // Remove item from service request
                                  setServiceRequestItems(serviceRequestItems.filter(i => i.id !== item.id));
                                  setExpandedItemIds(expandedItemIds.filter(id => id !== item.id));
                                }}
                              >
                                <Trash2 className="size-4 text-[#EF4444]" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <button className="p-2 hover:bg-[#F3F4F6] rounded transition-colors">
                          {expandedItemIds.includes(item.id) ? (
                            <ChevronDown className="size-5 text-[#6B7280]" />
                          ) : (
                            <ChevronRight className="size-5 text-[#6B7280]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {expandedItemIds.includes(item.id) && (
                      <div className="border-t border-[#E5E7EB] p-4 bg-[#FAFBFC]">
                        {/* Description */}
                        <div className="mb-4">
                          <h5 className="text-[13px] font-semibold text-[#364658] mb-2">Description</h5>
                          <p className="text-[13px] text-[#7B8FA5] leading-relaxed">
                            High-performance laptop designed for professionals. Features the latest Apple M-series chip, 
                            stunning Retina display, and all-day battery life. Perfect for development, design, and creative work.
                          </p>
                        </div>

                        {/* Configuration */}
                        <div>
                          <h5 className="text-[13px] font-semibold text-[#364658] mb-3">Laptop Configuration</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">Processor</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.processor}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">RAM</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.ram}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">Storage</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.storage}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">Display</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.display}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">Graphics</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.graphics}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7B8FA5] mb-1">Color</div>
                              <div className="text-[13px] font-medium text-[#364658]">{item.configuration.color}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                      ))}
                      
                      {/* Add Item Button */}
                      <button 
                        className="hidden mt-4 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-1"
                        onClick={() => {
                          setShowServiceCatalog(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Add Item
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Sticky Action Bar - Always at bottom, hidden when any editor is open */}
            {activeMainTab === 'conversation' && !showReplyEditor && !showForwardEditor && !showCollaborateEditor && !showNoteEditor && (
            <div className="w-full bg-white flex-shrink-0">
              <div
                className="bg-white rounded-xl shadow-lg border border-[#DFE5ED]"
                style={{
                  marginLeft: '1.5rem',
                  marginRight: '1.5rem',
                  marginBottom: '.75rem',
                  marginTop: '.75rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                }}
              >
                <div className="flex items-center gap-2 p-2">
                  {/* Profile Icon */}
                  <button
                    className="size-6 rounded overflow-hidden border border-[#DEE5ED] hover:border-[#3D8BD0] transition-colors flex-shrink-0"
                    style={{ borderRadius: '4px' }}
                  >
                    <div className="size-[24px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-xs font-semibold">SJ</div>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEE5ED] rounded hover:bg-[#F9FAFB] text-xs font-medium text-[#364658]"
                          onClick={handleCollaborate}>
                    <MessageSquare size={14} className="text-[#7B8FA5]" />
                    <span>Collaborate</span>
                  </button>

                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEE5ED] rounded hover:bg-[#F9FAFB] text-xs font-medium text-[#364658]"
                    onClick={handleNote}
                  >
                    <StickyNote size={14} className="text-[#7B8FA5]" />
                    <span>Note</span>
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Right Sidebar - Properties */}
          <TicketPropertiesPanel
            onOpenRequesterProfile={() => setShowRequesterProfile(true)}
            ticketId={activeProblem?.id}
            showProblemFields={true}
            hideRequesterInfo={true}
            hideSuggestions={true}
            showMembers={true}
            projectMode={true}
            projectInfo={(activeProblem as any)?.project ?? null}
            requesterName={activeProblem?.requester}
            activeGroup={activeGroup}
            setActiveGroup={setActiveGroup}
            onQuickActionReady={(handler) => {
              quickActionHandlerRef.current = handler;
            }}
            pinnedFields={pinnedFields}
            setPinnedFields={setPinnedFields}
            showPropertiesSearch={showPropertiesSearch}
            setShowPropertiesSearch={setShowPropertiesSearch}
            propertiesSearchQuery={propertiesSearchQuery}
            setPropertiesSearchQuery={setPropertiesSearchQuery}
            showPropertiesFilter={showPropertiesFilter}
            setShowPropertiesFilter={setShowPropertiesFilter}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            pinnedFieldsExpanded={pinnedFieldsExpanded}
            setPinnedFieldsExpanded={setPinnedFieldsExpanded}
            slaStatusExpanded={slaStatusExpanded}
            setSlaStatusExpanded={setSlaStatusExpanded}
            ticketFieldsExpanded={ticketFieldsExpanded}
            setTicketFieldsExpanded={setTicketFieldsExpanded}
            requesterInfoExpanded={requesterInfoExpanded}
            setRequesterInfoExpanded={setRequesterInfoExpanded}
            additionalFieldsExpanded={additionalFieldsExpanded}
            setAdditionalFieldsExpanded={setAdditionalFieldsExpanded}
            workTrackerExpanded={workTrackerExpanded}
            setWorkTrackerExpanded={setWorkTrackerExpanded}
            attachmentsExpanded={attachmentsExpanded}
            setAttachmentsExpanded={setAttachmentsExpanded}
            similarTicketExpanded={similarTicketExpanded}
            setSimilarTicketExpanded={setSimilarTicketExpanded}
            suggestedKnowledgeExpanded={suggestedKnowledgeExpanded}
            setSuggestedKnowledgeExpanded={setSuggestedKnowledgeExpanded}
            additionalFieldsTab={additionalFieldsTab}
            setAdditionalFieldsTab={setAdditionalFieldsTab}
            showMoreFields={showMoreFields}
            setShowMoreFields={setShowMoreFields}
            showMoreSystemFields={showMoreSystemFields}
            setShowMoreSystemFields={setShowMoreSystemFields}
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
            assigneeSearchQuery={assigneeSearchQuery}
            setAssigneeSearchQuery={setAssigneeSearchQuery}
            companyValue={companyValue}
            setCompanyValue={setCompanyValue}
            tags={tags}
            setTags={setTags}
            showTagInput={showTagInput}
            setShowTagInput={setShowTagInput}
            tagInputValue={tagInputValue}
            setTagInputValue={setTagInputValue}
            isTimerRunning={isTimerRunning}
            elapsedTime={elapsedTime}
            timerStartTime={timerStartTime}
            showTimerPopup={showTimerPopup}
            setShowTimerPopup={setShowTimerPopup}
            workDescription={workDescription}
            setWorkDescription={setWorkDescription}
            setShowWorkHistory={setShowWorkHistory}
            setShowSLAHistory={setShowSLAHistory}
            attachments={attachments}
            showAllAttachments={showAllAttachments}
            setShowAllAttachments={setShowAllAttachments}
            hoveredAttachmentId={hoveredAttachmentId}
            setHoveredAttachmentId={setHoveredAttachmentId}
            highlightAttachments={highlightAttachments}
            similarTicketsTab={similarTicketsTab}
            setSimilarTicketsTab={setSimilarTicketsTab}
            hoveredTicketId={hoveredTicketId}
            setHoveredTicketId={setHoveredTicketId}
            newlyLinkedTickets={newlyLinkedTickets}
            togglePinField={togglePinField}
            getFilteredPinnedFields={getFilteredPinnedFieldsWrapper}
            getGroupTitle={getGroupTitleWrapper}
            propertiesTitle="Properties"
            additionalTitle="Project Information"
            showNotifications={true}
            getCurrentStatusColor={getCurrentStatusColorWrapper}
            getCurrentPriorityColor={getCurrentPriorityColorWrapper}
            getCurrentAssigneeColor={getCurrentAssigneeColorWrapper}
            getCurrentUrgencyColor={getCurrentUrgencyColorWrapper}
            getCurrentImpactColor={getCurrentImpactColorWrapper}
            getCurrentProjectNameColor={getCurrentProjectNameColorWrapper}
            getCurrentCostCenterColor={getCurrentCostCenterColorWrapper}
            getCurrentRequestChannelColor={getCurrentRequestChannelColorWrapper}
            filteredAssigneeOptions={filteredAssigneeOptions}
            getFilteredTicketFields={getFilteredTicketFieldsWrapper}
            getFilteredAdditionalFormFields={getFilteredAdditionalFormFieldsWrapper}
            getFilteredAdditionalFields={getFilteredAdditionalFieldsWrapper}
            hasSLAMatch={hasSLAMatch}
            hasTicketFieldsMatch={hasTicketFieldsMatch}
            hasRequesterInfoMatch={hasRequesterInfoMatch}
            hasAdditionalFieldsMatch={hasAdditionalFieldsMatch}
            hasWorkTrackerMatch={hasWorkTrackerMatch}
            hasSimilarTickets={hasSimilarTickets}
            hasSuggestedKnowledgeMatch={hasSuggestedKnowledgeMatch}
            formatTime={formatTime}
            formatStartTime={formatStartTime}
            handleStartTimer={handleStartTimer}
            handlePauseTimer={handlePauseTimer}
            handleStopTimer={handleStopTimer}
            handleDeleteAttachment={handleDeleteAttachment}
            handleLinkTicket={handleLinkTicket}
            openManualWorkLog={openManualWorkLog}
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
            projectNameOptions={projectNameOptions}
            costCenterOptions={costCenterOptions}
            buildingOptions={buildingOptions}
            requestChannelOptions={requestChannelOptions}
            staticLinkedTickets={staticLinkedTickets}
            availableSimilarTickets={availableSimilarTickets}
            propertiesFilterRef={propertiesFilterRef}
            slaStatusRef={slaStatusRef}
            ticketFieldsRef={ticketFieldsRef}
            requesterInfoRef={requesterInfoRef}
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
            additionalFieldsRef={additionalFieldsRef}
            projectNameDropdownRef={projectNameDropdownRef}
            costCenterDropdownRef={costCenterDropdownRef}
            buildingDropdownRef={buildingDropdownRef}
            requestChannelDropdownRef={requestChannelDropdownRef}
            showLocationDropdown={showLocationDropdown}
            setShowLocationDropdown={setShowLocationDropdown}
            showVendorDropdown={showVendorDropdown}
            setShowVendorDropdown={setShowVendorDropdown}
            showSupportLevelDropdown={showSupportLevelDropdown}
            setShowSupportLevelDropdown={setShowSupportLevelDropdown}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedVendor={selectedVendor}
            setSelectedVendor={setSelectedVendor}
            selectedSupportLevel={selectedSupportLevel}
            setSelectedSupportLevel={setSelectedSupportLevel}
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
            isAccordionCollapsed={isAccordionCollapsed}
            expandAccordion={expandAccordion}
            accordionWidth={accordionWidth}
            setAccordionWidth={setAccordionWidth}
            setIsAccordionResizing={setIsAccordionResizing}
            onChatbotAddAsNote={(content) => {
              setNoteContent(content);
              setShowNoteEditor(true);
              setActiveMainTab('conversation');
            }}
            onChatbotAddAsCollaborate={(content) => {
              setCollaborateContent(content);
              setShowCollaborateEditor(true);
              setActiveMainTab('conversation');
            }}
            onChatbotReply={(content) => {
              setReplyContent(content);
              setShowReplyEditor(true);
              setActiveMainTab('conversation');
            }}
            onChatbotForward={(content) => {
              setForwardContent(content);
              setShowForwardEditor(true);
              setActiveMainTab('conversation');
            }}
            onboardingStep={showOnboarding ? onboardingStep : undefined}
          />
        </div>
      </div>
      
      {/* Service Catalog Popup */}
      {showServiceCatalog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-[100]"
            onClick={() => setShowServiceCatalog(false)}
          />
          
          {/* Slide-in Panel */}
          <div className="fixed right-0 top-0 h-screen w-[600px] max-w-[95vw] bg-white shadow-2xl z-[110] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-semibold text-[#364658]">Service Catalog</h2>
              <button
                onClick={() => setShowServiceCatalog(false)}
                className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
              >
                <X className="size-5 text-[#6B7280]" />
              </button>
            </div>
            
            {/* Search and Category Filter */}
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                {/* Category Dropdown */}
                <div className="relative w-[200px]" ref={catalogCategoryDropdownRef}>
                  <button
                    onClick={() => setShowCatalogCategoryDropdown(!showCatalogCategoryDropdown)}
                    className="flex items-center gap-1 text-[13px] text-[#364658] hover:text-[#3D8BD0] transition-colors"
                  >
                    <span className="text-[14px] font-semibold">{selectedCatalogCategory === 'All' ? 'All Items' : selectedCatalogCategory}</span>
                    <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showCatalogCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCatalogCategoryDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                      {['All', 'Hardware', 'Software', 'Accessories', 'Furniture', 'Mobile Device'].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCatalogCategory(category);
                            setShowCatalogCategoryDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                        >
                          <span className={selectedCatalogCategory === category ? 'font-semibold' : 'font-normal'}>
                            {category === 'All' ? 'All Items' : category}
                          </span>
                          {selectedCatalogCategory === category && (
                            <Check className="size-4 text-[#3D8BD0]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search for a service item"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                  />
                </div>
              </div>
            </div>
            
            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {getFilteredCatalogItems().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#7B8FA5] text-[14px]">No items found</p>
                  </div>
                ) : (
                  getFilteredCatalogItems().map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 bg-white border border-[#EAECEF] rounded-lg hover:border-[#3D8BD0] hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedCatalogItem(item);
                        setShowCatalogItemDetails(true);
                        setCatalogItemQuantity(1);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`w-[40px] h-[40px] rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.icon === 'macbook' || item.icon === 'iphone' ? 'bg-[#5A5A5A]' :
                          item.icon === 'monitor' ? 'bg-[#0076CE]' :
                          item.icon === 'keyboard' ? 'bg-[#00A4EF]' :
                          item.icon === 'chair' ? 'bg-[#6B7280]' :
                          item.icon === 'office' ? 'bg-[#D83B01]' : 'bg-[#6B7280]'
                        }`}>
                          {item.icon === 'macbook' && (
                            <svg width="19" height="23" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_catalog_1)">
                                <path d="M18.7936 14.3444C18.8324 18.4297 22.4622 19.7901 22.5005 19.8074C22.4699 19.9034 21.9208 21.7447 20.5885 23.6475C19.4368 25.2901 18.2411 26.9326 16.3583 26.965C14.5079 26.9983 13.913 25.8928 11.7975 25.8928C9.68201 25.8928 9.02209 26.9309 7.27166 26.9983C5.45399 27.0653 4.06994 25.2197 2.90873 23.581C0.535885 20.2289 -1.27748 14.1086 1.15744 9.97738C2.36563 7.92589 4.5264 6.6266 6.87382 6.5929C8.65873 6.55963 10.3432 7.76627 11.4346 7.76627C12.526 7.76627 14.5721 6.31494 16.7242 6.52804C17.6251 6.56469 20.154 6.88393 21.7781 9.20665C21.6488 9.28583 18.7609 10.9279 18.7919 14.3449M15.3143 4.31104C16.2794 3.16968 16.929 1.58063 16.7518 0C15.3609 0.0547513 13.679 0.905503 12.6811 2.04644C11.7872 3.05723 11.004 4.67324 11.2156 6.2227C12.7674 6.33978 14.3501 5.45281 15.3148 4.31104" fill="white"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_catalog_1">
                                  <rect width="22.5" height="27" fill="white"/>
                                </clipPath>
                              </defs>
                            </svg>
                          )}
                          {item.icon === 'monitor' && (
                            <svg width="20" height="17" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="2" width="20" height="13" rx="1" stroke="white" strokeWidth="2"/>
                              <path d="M8 18H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M12 15V18" stroke="white" strokeWidth="2"/>
                            </svg>
                          )}
                          {item.icon === 'keyboard' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="8" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
                              <rect x="6" y="11" width="2" height="2" fill="white"/>
                              <rect x="10" y="11" width="2" height="2" fill="white"/>
                              <rect x="14" y="11" width="2" height="2" fill="white"/>
                            </svg>
                          )}
                          {item.icon === 'chair' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 16V8C6 6.89543 6.89543 6 8 6H16C17.1046 6 18 6.89543 18 8V16" stroke="white" strokeWidth="2"/>
                              <path d="M4 16H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M7 16V20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M17 16V20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          {item.icon === 'office' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="4" y="4" width="7" height="7" fill="white"/>
                              <rect x="13" y="4" width="7" height="7" fill="white"/>
                              <rect x="4" y="13" width="7" height="7" fill="white"/>
                              <rect x="13" y="13" width="7" height="7" fill="white"/>
                            </svg>
                          )}
                          {item.icon === 'iphone' && (
                            <svg width="12" height="20" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="1" width="12" height="22" rx="2" stroke="white" strokeWidth="2"/>
                              <circle cx="7" cy="20" r="1" fill="white"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-semibold text-[#364658] mb-1">{item.name}</h4>
                          <p className="text-[13px] text-[#7B8FA5] mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-[#3D8BD0]">{item.price}</span>
                            <span className="text-[11px] text-[#7B8FA5]">{item.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Item Details View */}
          {showCatalogItemDetails && selectedCatalogItem && (
            <div className="fixed right-0 top-0 h-screen w-[600px] max-w-[95vw] bg-white shadow-2xl z-[120] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
                <button
                  onClick={() => {
                    setShowCatalogItemDetails(false);
                    setSelectedCatalogItem(null);
                  }}
                  className="flex items-center gap-2 text-[14px] text-[#3D8BD0] hover:text-[#2C6B9F] transition-colors"
                >
                  <ChevronLeft className="size-5" />
                  <span className="font-medium">Back to all items</span>
                </button>
                <button
                  onClick={() => {
                    setShowServiceCatalog(false);
                    setShowCatalogItemDetails(false);
                    setSelectedCatalogItem(null);
                  }}
                  className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                >
                  <X className="size-5 text-[#6B7280]" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Product Image and Details - Side by Side */}
                  <div className="flex gap-6 mb-6">
                    {/* Product Image - Left Side */}
                    <div className="flex-shrink-0 bg-[#F9FAFB] rounded-lg p-4 flex items-center justify-center">
                    <div className={`w-[72px] h-[72px] rounded-lg flex items-center justify-center ${
                      selectedCatalogItem.icon === 'macbook' || selectedCatalogItem.icon === 'iphone' ? 'bg-[#5A5A5A]' :
                      selectedCatalogItem.icon === 'monitor' ? 'bg-[#0076CE]' :
                      selectedCatalogItem.icon === 'keyboard' ? 'bg-[#00A4EF]' :
                      selectedCatalogItem.icon === 'chair' ? 'bg-[#6B7280]' :
                      selectedCatalogItem.icon === 'office' ? 'bg-[#D83B01]' : 'bg-[#6B7280]'
                    }`}>
                      {selectedCatalogItem.icon === 'macbook' && (
                        <svg width="34" height="41" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_details_1)">
                            <path d="M18.7936 14.3444C18.8324 18.4297 22.4622 19.7901 22.5005 19.8074C22.4699 19.9034 21.9208 21.7447 20.5885 23.6475C19.4368 25.2901 18.2411 26.9326 16.3583 26.965C14.5079 26.9983 13.913 25.8928 11.7975 25.8928C9.68201 25.8928 9.02209 26.9309 7.27166 26.9983C5.45399 27.0653 4.06994 25.2197 2.90873 23.581C0.535885 20.2289 -1.27748 14.1086 1.15744 9.97738C2.36563 7.92589 4.5264 6.6266 6.87382 6.5929C8.65873 6.55963 10.3432 7.76627 11.4346 7.76627C12.526 7.76627 14.5721 6.31494 16.7242 6.52804C17.6251 6.56469 20.154 6.88393 21.7781 9.20665C21.6488 9.28583 18.7609 10.9279 18.7919 14.3449M15.3143 4.31104C16.2794 3.16968 16.929 1.58063 16.7518 0C15.3609 0.0547513 13.679 0.905503 12.6811 2.04644C11.7872 3.05723 11.004 4.67324 11.2156 6.2227C12.7674 6.33978 14.3501 5.45281 15.3148 4.31104" fill="white"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_details_1">
                              <rect width="22.5" height="27" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                      {selectedCatalogItem.icon === 'monitor' && (
                        <svg width="36" height="31" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="20" height="13" rx="1" stroke="white" strokeWidth="2"/>
                          <path d="M8 18H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 15V18" stroke="white" strokeWidth="2"/>
                        </svg>
                      )}
                      {selectedCatalogItem.icon === 'keyboard' && (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="8" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
                          <rect x="6" y="11" width="2" height="2" fill="white"/>
                          <rect x="10" y="11" width="2" height="2" fill="white"/>
                          <rect x="14" y="11" width="2" height="2" fill="white"/>
                        </svg>
                      )}
                      {selectedCatalogItem.icon === 'chair' && (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 16V8C6 6.89543 6.89543 6 8 6H16C17.1046 6 18 6.89543 18 8V16" stroke="white" strokeWidth="2"/>
                          <path d="M4 16H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M7 16V20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M17 16V20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {selectedCatalogItem.icon === 'office' && (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="4" width="7" height="7" fill="white"/>
                          <rect x="13" y="4" width="7" height="7" fill="white"/>
                          <rect x="4" y="13" width="7" height="7" fill="white"/>
                          <rect x="13" y="13" width="7" height="7" fill="white"/>
                        </svg>
                      )}
                      {selectedCatalogItem.icon === 'iphone' && (
                        <svg width="22" height="36" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="1" width="12" height="22" rx="2" stroke="white" strokeWidth="2"/>
                          <circle cx="7" cy="20" r="1" fill="white"/>
                        </svg>
                      )}
                    </div>
                  </div>

                    {/* Product Details - Right Side */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-[#364658] mb-1 text-[16px]">{selectedCatalogItem.name}</h3>
                          <p className="text-[13px] text-[#7B8FA5]">{selectedCatalogItem.category}</p>
                        </div>
                        <span className="font-bold text-[#3D8BD0] text-[16px]">{selectedCatalogItem.price}</span>
                      </div>
                      <p className="text-[14px] text-[#364658] leading-relaxed">
                        {selectedCatalogItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Description and Configuration */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-[#364658] mb-3">Description</h4>
                    <p className="text-[#364658] leading-relaxed mb-6 text-[14px]">
                      High-performance laptop designed for professionals. Features the latest Apple M-series chip, stunning Retina display, and all-day battery life. Perfect for development, design, and creative work.
                    </p>

                    <h4 className="text-[14px] font-semibold text-[#364658] mb-3">Laptop Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Processor Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Processor</label>
                        <div className="relative" ref={processorDropdownRef}>
                          <button
                            onClick={() => setShowProcessorDropdown(!showProcessorDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedProcessor}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showProcessorDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showProcessorDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['Apple M3', 'Apple M3 Pro', 'Apple M3 Max', 'Intel Core i7', 'Intel Core i9'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedProcessor(option);
                                    setShowProcessorDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedProcessor === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedProcessor === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RAM Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">RAM</label>
                        <div className="relative" ref={ramDropdownRef}>
                          <button
                            onClick={() => setShowRAMDropdown(!showRAMDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedRAM}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showRAMDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showRAMDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['8 GB', '16 GB', '32 GB', '64 GB'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedRAM(option);
                                    setShowRAMDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedRAM === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedRAM === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Storage Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Storage</label>
                        <div className="relative" ref={storageDropdownRef}>
                          <button
                            onClick={() => setShowStorageDropdown(!showStorageDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedStorage}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showStorageDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showStorageDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedStorage(option);
                                    setShowStorageDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedStorage === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedStorage === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Display</label>
                        <div className="relative" ref={displayDropdownRef}>
                          <button
                            onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedDisplay}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showDisplayDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showDisplayDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['13" Retina', '14" Retina', '15" Retina', '16" Retina'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedDisplay(option);
                                    setShowDisplayDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedDisplay === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedDisplay === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Graphics Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Graphics</label>
                        <div className="relative" ref={graphicsDropdownRef}>
                          <button
                            onClick={() => setShowGraphicsDropdown(!showGraphicsDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedGraphics}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showGraphicsDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showGraphicsDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['Integrated GPU', 'NVIDIA RTX 3060', 'NVIDIA RTX 4070', 'AMD Radeon Pro'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedGraphics(option);
                                    setShowGraphicsDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedGraphics === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedGraphics === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Color Dropdown */}
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">Color</label>
                        <div className="relative" ref={colorDropdownRef}>
                          <button
                            onClick={() => setShowColorDropdown(!showColorDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] font-medium border border-[#E5E7EB] rounded hover:border-[#3D8BD0] transition-colors"
                          >
                            <span>{selectedColor}</span>
                            <ChevronDown className={`size-4 text-[#6B7280] transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showColorDropdown && (
                            <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-[120]">
                              {['Space Gray', 'Silver', 'Midnight', 'Starlight'].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setSelectedColor(option);
                                    setShowColorDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors text-left"
                                >
                                  <span className={selectedColor === option ? 'font-semibold' : 'font-normal'}>{option}</span>
                                  {selectedColor === option && <Check className="size-4 text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-[#F9FAFB] rounded-lg p-4 mb-6">
                    <h4 className="text-[14px] font-semibold text-[#364658] mb-3">Additional Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#7B8FA5]">Availability</span>
                        <span className="text-[#364658] font-medium">In Stock</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#7B8FA5]">Delivery Time</span>
                        <span className="text-[#364658] font-medium">2-3 Business Days</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#7B8FA5]">Warranty</span>
                        <span className="text-[#364658] font-medium">1 Year</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtotal Section */}
                  <div className="mb-6">
                    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#7B8FA5]">Items requested</th>
                            <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#7B8FA5]">Quantity</th>
                            <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#7B8FA5]">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#E5E7EB]">
                            <td className="px-4 py-3 text-[13px] text-[#364658] font-medium">{selectedCatalogItem.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setCatalogItemQuantity(Math.max(1, catalogItemQuantity - 1))}
                                  className="w-7 h-7 flex items-center justify-center border border-[#DFE5ED] rounded hover:border-[#3D8BD0] hover:bg-[#F3F4F6] transition-colors"
                                >
                                  <Minus className="size-3 text-[#364658]" />
                                </button>
                                <span className="text-[13px] text-[#364658] font-medium w-8 text-center">{catalogItemQuantity}</span>
                                <button
                                  onClick={() => setCatalogItemQuantity(catalogItemQuantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center border border-[#DFE5ED] rounded hover:border-[#3D8BD0] hover:bg-[#F3F4F6] transition-colors"
                                >
                                  <Plus className="size-3 text-[#364658]" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-[#364658] font-medium text-right">{selectedCatalogItem.price}</td>
                          </tr>
                          <tr className="bg-[#F9FAFB]">
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#364658] text-center">Total</td>
                            <td className="px-4 py-3 text-[14px] font-bold text-[#3D8BD0] text-right">
                              ${(() => {
                                const price = parseFloat(selectedCatalogItem.price.replace(/[$,]/g, ''));
                                return (price * catalogItemQuantity).toLocaleString('en-US', { minimumFractionDigals: 0, maximumFractionDigits: 0 });
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-[#E5E7EB] p-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowCatalogItemDetails(false);
                      setSelectedCatalogItem(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-[#DFE5ED] rounded text-[14px] font-medium text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Add item to service request
                      const newItem = {
                        id: `item-${Date.now()}`,
                        name: selectedCatalogItem.name,
                        quantity: catalogItemQuantity,
                        price: selectedCatalogItem.price,
                        icon: selectedCatalogItem.icon,
                        status: 'Requested',
                        configuration: {
                          processor: selectedProcessor,
                          ram: selectedRAM,
                          storage: selectedStorage,
                          display: selectedDisplay,
                          graphics: selectedGraphics,
                          color: selectedColor,
                        },
                        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').replace(/\//g, '/'),
                      };
                      setServiceRequestItems([...serviceRequestItems, newItem]);
                      setShowServiceCatalog(false);
                      setShowCatalogItemDetails(false);
                      setSelectedCatalogItem(null);
                      setCatalogItemQuantity(1);
                      // Reset configuration to defaults
                      setSelectedProcessor('Apple M3 Pro');
                      setSelectedRAM('16 GB');
                      setSelectedStorage('512 GB SSD');
                      setSelectedDisplay('14\" Retina');
                      setSelectedGraphics('Integrated GPU');
                      setSelectedColor('Space Gray');
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#3D8BD0] rounded text-[14px] font-medium text-white hover:bg-[#2C6B9F] transition-colors"
                  >
                    Add to Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Edit Item Popup */}
      {showEditItemPopup && editingItem && (
        <EditItemPopup
          editingItem={editingItem}
          editItemQuantity={editItemQuantity}
          setEditItemQuantity={setEditItemQuantity}
          editProcessor={editProcessor}
          setEditProcessor={setEditProcessor}
          editRAM={editRAM}
          setEditRAM={setEditRAM}
          editStorage={editStorage}
          setEditStorage={setEditStorage}
          editDisplay={editDisplay}
          setEditDisplay={setEditDisplay}
          editGraphics={editGraphics}
          setEditGraphics={setEditGraphics}
          editColor={editColor}
          setEditColor={setEditColor}
          showEditProcessorDropdown={showEditProcessorDropdown}
          setShowEditProcessorDropdown={setShowEditProcessorDropdown}
          showEditRAMDropdown={showEditRAMDropdown}
          setShowEditRAMDropdown={setShowEditRAMDropdown}
          showEditStorageDropdown={showEditStorageDropdown}
          setShowEditStorageDropdown={setShowEditStorageDropdown}
          showEditDisplayDropdown={showEditDisplayDropdown}
          setShowEditDisplayDropdown={setShowEditDisplayDropdown}
          showEditGraphicsDropdown={showEditGraphicsDropdown}
          setShowEditGraphicsDropdown={setShowEditGraphicsDropdown}
          showEditColorDropdown={showEditColorDropdown}
          setShowEditColorDropdown={setShowEditColorDropdown}
          onClose={() => setShowEditItemPopup(false)}
          onSave={() => {
            // Update the item in serviceRequestItems
            const updatedItems = serviceRequestItems.map(item => {
              if (item.id === editingItem.id) {
                return {
                  ...item,
                  quantity: editItemQuantity,
                  configuration: {
                    processor: editProcessor,
                    ram: editRAM,
                    storage: editStorage,
                    display: editDisplay,
                    graphics: editGraphics,
                    color: editColor,
                  }
                };
              }
              return item;
            });
            setServiceRequestItems(updatedItems);
            setShowEditItemPopup(false);
          }}
        />
      )}
      
      {/* Task Form Panel */}
      {showTaskPanel && (
        <TaskFormPanel
          task={editingTask}
          onClose={() => {
            setShowTaskPanel(false);
            setEditingTask(null);
          }}
          onSave={(taskData) => {
            if (editingTask) {
              // Update existing task
              setTasks(tasks.map(t => t.id === editingTask.id ? { ...taskData, id: editingTask.id } : t));
            } else {
              // Add new task
              const newTask = {
                ...taskData,
                id: `TASK-${tasks.length + 1}`,
              };
              setTasks([...tasks, newTask]);
            }
            setShowTaskPanel(false);
            setEditingTask(null);
          }}
        />
      )}
      
      {/* Properties Panel Add Relation Modal */}
      {showPropertiesRelationModal && (() => {
        const availableTickets = getPropertiesRelationMockTickets(propertiesRelationType);
        const filteredTickets = availableTickets.filter(ticket => {
          const matchesSearch = propertiesRelationSearchQuery === '' || 
            ticket.subject.toLowerCase().includes(propertiesRelationSearchQuery.toLowerCase()) ||
            ticket.ticketId.toLowerCase().includes(propertiesRelationSearchQuery.toLowerCase());
          return matchesSearch;
        });

        return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
            <div className="bg-white shadow-2xl w-[70vw] max-w-[900px] h-full flex flex-col animate-slide-in-right">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-[#364658]">
                  {relationMode === 'create' ? `Create ${propertiesRelationType}` : `Add ${propertiesRelationType} Relation`}
                </h2>
                <button
                  onClick={() => {
                    setShowPropertiesRelationModal(false);
                    setSelectedPropertiesRelationTickets([]);
                    setPropertiesRelationType('');
                    setPropertiesRelationSearchQuery(''); setRelationMode('existing'); setRelationCreateSubject(''); setRelationCreateDesc('');
                  }}
                  className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
                >
                  <X size={20} className="text-[#6B7280]" />
                </button>
              </div>

                            {relationMode === 'existing' ? (
              <>
              {/* Search and Filters */}
              <div className="px-6 py-4 border-b border-[#E5E7EB] space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={propertiesRelationSearchQuery}
                    onChange={(e) => setPropertiesRelationSearchQuery(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#DFE5ED] rounded text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] transition-colors"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB] sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPropertiesRelationTickets.length === filteredTickets.length && filteredTickets.length > 0}
                          onChange={() => handlePropertiesRelationToggleAll(filteredTickets)}
                          className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0] cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        onClick={() => handlePropertiesRelationToggleTicket(ticket.id)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPropertiesRelationTickets.includes(ticket.id)}
                            onChange={() => handlePropertiesRelationToggleTicket(ticket.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-[#EFF6FF] text-[#3D8BD0] text-[13px] font-medium rounded">
                            {ticket.ticketId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[13px] text-[#364658]">
                            {ticket.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#364658]">
                            <span className={`size-2 rounded-full ${getStatusDotColor(ticket.status)}`}></span>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#364658]">
                            <span className={`size-2 rounded-full ${getPriorityDotColor(ticket.priority)}`}></span>
                            {ticket.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              </>
              ) : (
              <div className="flex-1 overflow-auto px-6 py-5">
                <div className="max-w-[640px] space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">Subject / Name <span className="text-[#DC2626]">*</span></label>
                    <input value={relationCreateSubject} onChange={(e) => setRelationCreateSubject(e.target.value)} placeholder={`Enter ${propertiesRelationType.toLowerCase()} subject`} className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">Description</label>
                    <textarea value={relationCreateDesc} onChange={(e) => setRelationCreateDesc(e.target.value)} rows={5} placeholder="Add a short description..." className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] transition-colors resize-none" />
                  </div>
                  <p className="text-[12px] text-[#9CA3AF]">A new {propertiesRelationType.toLowerCase()} will be created and linked to this record.</p>
                </div>
              </div>
              )}
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <div className="text-[13px] text-[#6B7280]">
                  {selectedPropertiesRelationTickets.length} ticket{selectedPropertiesRelationTickets.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowPropertiesRelationModal(false);
                      setSelectedPropertiesRelationTickets([]);
                      setPropertiesRelationType('');
                      setPropertiesRelationSearchQuery(''); setRelationMode('existing'); setRelationCreateSubject(''); setRelationCreateDesc('');
                    }}
                    className="px-4 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={relationMode === 'create' ? handleCreateRelation : handleAddPropertiesRelations}
                    disabled={relationMode === 'create' ? !relationCreateSubject.trim() : selectedPropertiesRelationTickets.length === 0}
                    className="px-4 py-2 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2E6BA4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {relationMode === 'create' ? 'Create & Link' : 'Add Relations'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Onboarding Guide */}
      {showOnboarding && (
        <TicketDetailsOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          onStepChange={setOnboardingStep}
        />
      )}

      {/* SLA History Modal */}
      <SLAHistoryModal
        isOpen={showSLAHistory}
        onClose={() => setShowSLAHistory(false)}
        penaltyAmount={getSlaPenaltyAmount(activeProblem?.id)}
      />
      <RequesterProfilePanel
        isOpen={showRequesterProfile}
        onClose={() => setShowRequesterProfile(false)}
        requesterName={activeProblem?.id === 'PBM-608' ? 'Arnav Desai' : activeProblem?.requester}
      />
    </div>
  );
}

export default ProjectDrawer;
