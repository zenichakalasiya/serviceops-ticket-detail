/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
/**
 * TicketDrawer Component
 * 
 * Note: This file may trigger a Babel optimization warning about exceeding 500KB in transpiled output.
 * This is a known Babel behavior where certain optimizations are disabled for large files,
 * but it does not affect functionality. Utilities have been extracted to TicketDrawerUtils.tsx
 * to help reduce the file size where possible.
 */
import { X, ChevronLeft, ChevronRight, Star, Share2, Eye, EyeOff, MoreHorizontal, MoreVertical, Paperclip, Clock, Search, Filter, ArrowUpDown, Reply, Forward, MessageSquare, StickyNote, ChevronDown, ChevronUp, CheckCircle, Mail, XCircle, Maximize2, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Image, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Video, User, FileText, Download, Trash2, Tag, Folder, Activity, Lightbulb, Pin as PinIcon, PinOff, Plus, Minus, Check, Play, Pause, Square, Link, Ticket as TicketIcon, Lock, Stethoscope, Edit, CheckSquare, Info, ArrowRightLeft } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { FileTypeBadge } from '../DescriptionAttachments';
import { EditorToolbarActions, EditorSendActions, RichComposerArea } from './EditorToolbar';
import { useState, useRef, useEffect } from 'react';
import { APPROVAL_TAB_IDS } from '../approvalTabs';
import { DrawerTabStrip } from './DrawerTabStrip';
import { SummaryStaleNotice } from '../SummaryStaleNotice';
import { VipPill, isVipRequester } from '../VipPill';
import { DescriptionAttachments, type AttachmentFile } from '../DescriptionAttachments';
import { AttachmentPreviewModal } from '../AttachmentPreviewModal';
import { alertKpiItems, getHeaderAlerts } from '../HeaderAlertPills';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { DescriptionInlineImage } from '../DescriptionInlineImage';
import { DEMO_CUSTOM_FORM_FIELDS } from '../demoCustomFields';
import { describeSubject } from '../requestDescriptions';
import { toast } from 'sonner';
import type { Ticket } from '../TicketListPage';
import { StatusBadge } from '../StatusBadge';
import { PriorityBadge } from '../PriorityBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CopyableEmails } from '../CopyableEmails';
import { HeaderCopyButton } from './HeaderCopyButton';
import { HeaderIdPill } from '../HeaderIdPill';
import { getSentiment } from '../SentimentBadge';
import { SystemFieldsRenderer } from './SystemFieldsRenderer';
import { TicketPropertiesPanel } from './TicketPropertiesPanel';
import { RequesterProfilePanel } from './RequesterProfilePanel';
import { HeaderKpiRow, type HeaderKpiItem } from './HeaderKpiRow';
import { DiagnosisCard } from './DiagnosisCard';
import { SolutionCard } from '../SolutionCard';
import { AISummary } from './AISummary';
import { SLAHistoryModal } from '../SLAHistoryModal';
import { AddWorkLogModal } from './AddWorkLogModal';
import { WorkHistoryModal } from '../WorkHistoryModal';
import { getSlaPenaltyAmount } from '../TicketDrawerUtils';
import { ServiceRequestItems } from './ServiceRequestItems';
import { EditItemPopup } from './EditItemPopup';
import { InlineReplyEditor } from './InlineReplyEditor';
import { renderCatalogIcon, getIconBackgroundColor } from '../CatalogIconUtils';
import { TaskFormPanel } from './TaskFormPanel';
import { TasksTabContent } from './TasksTabContent';
import { AuditTrailsTabContent } from './AuditTrailsTabContent';
import { AffectedItemsRow, makeAffectedItems } from '../AffectedItemsRow';
import { RelationsTabContent } from './RelationsTabContent';
import { ResolutionTabContent } from './ResolutionTabContent';
import { ConversationTabContent } from '../ConversationTabContent';
import { ServiceRequestTabContent } from './ServiceRequestTabContent';
import { ApprovalsTabContent } from './ApprovalsTabContent';
import { TicketDetailsOnboarding } from './TicketDetailsOnboarding';
import { CatalogItemDetailsModal } from '../CatalogItemDetailsModal';
import { TicketActionsMenu } from './TicketActionsMenu';
import { TicketTransitionModal } from './TicketTransitionModal';
import { ConversationEmptyState } from '../ConversationEmptyState';
import { ReplyEditor } from './ReplyEditor';
import { BlankTicketConversationView } from './BlankTicketConversationView';
import { 
  watchers as mockWatchers, 
  catalogItems as mockCatalogItems,
  initialAttachments
} from '../TicketDrawerMockData';
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
} from '../TicketDrawerUtils';
import profileImage from 'figma:asset/346a47ed4118f690df082984fcd9c5da55898d34.png';
import svgPaths from '../../../imports/svg-vmnsig04gh';

/** Default seeded relations (4 of each module type) so the Relations tab is populated and cross-module items can be opened as tabs. */
const DEFAULT_TICKET_RELATIONS = (() => {
  const subs = ['VPN connection timeout', 'Email delivery issues', 'Application access request', 'Network connectivity problem', 'Software license renewal', 'Hardware replacement needed', 'Security patch installation', 'User account creation'];
  const st = ['Open', 'In Progress', 'Pending', 'Resolved'];
  const pr = ['High', 'Medium', 'Urgent', 'Low'];
  const names = ['John Doe', 'Neha Raje', 'Rohan Mehta', 'Priya Nair'];
  const mk = (type: string, prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `def-${type}-${i}`, type, ticketId: `${prefix}-${1001 + i}`, subject: subs[i % subs.length], status: st[i % st.length], assignedTo: { name: names[i % names.length] }, priority: pr[i % pr.length] }));
  return [...mk('Problem', 'PRB', 4), ...mk('Change', 'CHG', 4), ...mk('Release', 'REL', 4), ...mk('Asset', 'AST', 4)];
})();

interface TicketDrawerProps {
  openTickets: Ticket[];
  activeTicketId: string | null;
  onClose: () => void;
  onCloseTab: (ticketId: string) => void;
  onTabChange: (ticketId: string) => void;
  /** Open a clicked relation as a new tab in this drawer. */
  onOpenRelation?: (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => void;
  stackTabs?: { id: string; subject?: string }[];
  stackWidth?: number;
  onStackWidthChange?: (w: number) => void;
  /** Opened from My Approvals — collapses the page to the approver's three tabs. */
  approvalMode?: boolean;
  /** The approver's decision buttons, rendered in place of the module's own header actions. */
  approvalHeader?: import('react').ReactNode;
  stackMinimized?: boolean;
  onStackMinimizedChange?: (m: boolean) => void;
  stackActiveGroup?: string;
  onStackActiveGroupChange?: (g: string) => void;
}

/* Files attached to the request description. INC-32 is the connectivity outage, so it carries only
   the two diagnostic exports its description actually refers to; every other request gets the
   fuller set an onboarding/hardware request realistically accumulates — which is also what
   exercises the strip's overflow handling. */
const OUTAGE_ATTACHMENTS: AttachmentFile[] = [
  { name: 'network-diagnosis.pdf', size: '2 MB' },
  { name: 'task-changes.doc', size: '674 KB' },
];

const REQUEST_ATTACHMENTS: AttachmentFile[] = [
  { name: 'task-changes.doc', size: '674 KB' },
  { name: 'network-diagnosis.pdf', size: '2 MB' },
  { name: 'asset-allocation-form.pdf', size: '486 KB' },
  { name: 'onboarding-checklist.xlsx', size: '128 KB' },
  { name: 'workstation-photo.png', size: '3.4 MB' },
  { name: 'software-request-approval.msg', size: '96 KB' },
  { name: 'hardware-quotation-dell.pdf', size: '1.2 MB' },
  { name: 'id-verification.jpg', size: '2.8 MB' },
  { name: 'desk-setup-diagram.png', size: '1.6 MB' },
  { name: 'it-policy-acknowledgement.pdf', size: '342 KB' },
  { name: 'previous-ticket-export.csv', size: '54 KB' },
  { name: 'vpn-config-backup.zip', size: '8.1 MB' },
];

const descriptionAttachmentsFor = (id?: string) =>
  id === 'INC-32' ? OUTAGE_ATTACHMENTS : REQUEST_ATTACHMENTS;

// Demo tasks organised into workflow stages so the Tasks tab shows its stage stepper.
const DEMO_STAGED_TASKS: any[] = [
  // Stage 0 — Preparation
  { id: 'TASK-1', subject: 'Collect employee documents & ID proofs', userGroup: 'HR', assignee: 'Sarah Johnson', taskType: 'Documentation', startDate: '2026-06-24', endDate: '2026-06-25', status: 'Closed', priority: 'High', notifyBefore: '1', notifyUnit: 'days', description: 'Gather signed offer letter, ID proofs and background-check consent.', completed: true, stage: 0 },
  { id: 'TASK-2', subject: 'Create employee record in HRMS', userGroup: 'HR', assignee: 'Sarah Johnson', taskType: 'Documentation', startDate: '2026-06-25', endDate: '2026-06-25', status: 'Closed', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Create the master employee record and assign an employee ID.', completed: true, stage: 0 },
  { id: 'TASK-3', subject: 'Assign employee ID & email alias', userGroup: 'IT Support', assignee: 'Michael Chen', taskType: 'Provisioning', startDate: '2026-06-26', endDate: '2026-06-26', status: 'In Progress', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Reserve the corporate email alias and directory entry.', completed: false, stage: 0 },
  { id: 'TASK-4', subject: 'Prepare welcome kit & desk allocation', userGroup: 'Facilities', assignee: 'Priya Sharma', taskType: 'Provisioning', startDate: '2026-06-26', endDate: '2026-06-27', status: 'Open', priority: 'Low', notifyBefore: '1', notifyUnit: 'days', description: 'Assign a desk/seat and prepare the welcome kit.', completed: false, stage: 0 },
  // Stage 1 — Provisioning
  { id: 'TASK-5', subject: 'Procure & image laptop', userGroup: 'IT Support', assignee: 'Michael Chen', taskType: 'Provisioning', startDate: '2026-06-27', endDate: '2026-06-29', status: 'In Progress', priority: 'High', notifyBefore: '1', notifyUnit: 'days', description: 'Allocate a laptop and apply the standard software image.', completed: false, stage: 1 },
  { id: 'TASK-6', subject: 'Install standard software suite', userGroup: 'IT Support', assignee: 'Michael Chen', taskType: 'Provisioning', startDate: '2026-06-29', endDate: '2026-06-29', status: 'Open', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Install Office, browser, and role-specific tools.', completed: false, stage: 1 },
  { id: 'TASK-7', subject: 'Configure VPN client', userGroup: 'Network', assignee: 'Rahul Verma', taskType: 'Provisioning', startDate: '2026-06-29', endDate: '2026-06-30', status: 'Open', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Set up and test the corporate VPN profile.', completed: false, stage: 1 },
  { id: 'TASK-8', subject: 'Set up phone extension', userGroup: 'IT Support', assignee: 'Priya Sharma', taskType: 'Provisioning', startDate: '2026-06-30', endDate: '2026-06-30', status: 'Open', priority: 'Low', notifyBefore: '1', notifyUnit: 'days', description: 'Assign a phone extension and voicemail.', completed: false, stage: 1 },
  { id: 'TASK-9', subject: 'Enroll device in MDM', userGroup: 'IT Security', assignee: 'Neha Raje', taskType: 'Security', startDate: '2026-06-30', endDate: '2026-07-01', status: 'Open', priority: 'High', notifyBefore: '1', notifyUnit: 'days', description: 'Enroll the laptop into mobile device management and apply policies.', completed: false, stage: 1 },
  // Stage 2 — Access & Accounts
  { id: 'TASK-10', subject: 'Create AD account & mailbox', userGroup: 'IT Support', assignee: 'Michael Chen', taskType: 'Access Management', startDate: '2026-07-01', endDate: '2026-07-01', status: 'Open', priority: 'High', notifyBefore: '1', notifyUnit: 'days', description: 'Create the Active Directory account and Exchange mailbox.', completed: false, stage: 2 },
  { id: 'TASK-11', subject: 'Grant application access (Jira/Confluence)', userGroup: 'IT Support', assignee: 'Sarah Johnson', taskType: 'Access Management', startDate: '2026-07-01', endDate: '2026-07-02', status: 'Open', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Provision role-based access to the required applications.', completed: false, stage: 2 },
  // Stage 3 — Verification
  { id: 'TASK-12', subject: 'First-day login verification', userGroup: 'IT Support', assignee: 'Michael Chen', taskType: 'Verification', startDate: '2026-07-02', endDate: '2026-07-02', status: 'Open', priority: 'Normal', notifyBefore: '1', notifyUnit: 'days', description: 'Confirm the employee can log in and access core systems.', completed: false, stage: 3 },
  { id: 'TASK-13', subject: 'Manager sign-off on onboarding', userGroup: 'Management', assignee: 'Sarah Johnson', taskType: 'Verification', startDate: '2026-07-02', endDate: '2026-07-03', status: 'Open', priority: 'Low', notifyBefore: '1', notifyUnit: 'days', description: 'Reporting manager confirms onboarding completion.', completed: false, stage: 3 },
];

// Individual (non-staged) task pool — every ticket EXCEPT the Service Request INC-35 seeds a
// small themed slice matching the request SUBJECT (no `stage`, so the Tasks tab renders a flat
// list). Each theme lists resolution steps that read naturally for that kind of request.
/* Description text keyed off the SUBJECT, so every request detail page reads like the
   request it belongs to rather than a shared placeholder. `short` is what shows
   collapsed; `more` are the paragraphs revealed by View more. */


const TASK_THEMES: { match: RegExp; group: string; type: string; tasks: string[] }[] = [
  {
    // Leaver — access has to come off in a controlled order
    match: /offboard|revocation|revoke|leaver/i,
    group: 'IT Support', type: 'Deprovisioning',
    tasks: [
      'Confirm the last working day with the line manager',
      'Disable the Active Directory account and revoke SSO access',
      'Remove application and shared-drive permissions',
      'Convert the mailbox and forward to the manager',
      'Collect the laptop and peripherals, and update the asset record',
    ],
  },
  {
    // Licensing / capacity — a commercial request rather than a fault
    match: /license|renewal|upgrade|storage/i,
    group: 'Asset & Licensing', type: 'Procurement',
    tasks: [
      'Confirm the entitlement required and the cost centre',
      'Check the current license pool for a spare seat',
      'Obtain budget approval from the department owner',
      'Raise the purchase or capacity request with the vendor',
      'Assign the license and confirm access with the requester',
    ],
  },
  {
    // Identity and access — sign-in, credentials, permissions
    match: /log ?in|login|password|authentication|two-factor|2fa|sso|sap|salesforce|request access|account|enrollment|bulk user/i,
      group: 'Identity & Access', type: 'Access Management',
    tasks: [
      'Verify the requester identity against the HR record',
      'Check the account for a lock, expiry or failed sign-ins',
      'Confirm the role-based permissions required',
      'Reset credentials or grant the requested access',
      'Confirm successful sign-in with the requester',
    ],
  },
  {
    // Messaging — mailbox, sync and quota problems
    match: /outlook|mailbox|email|mail/i,
    group: 'Messaging Team', type: 'Investigation',
    tasks: [
      'Reproduce the issue in webmail to isolate the client',
      'Check mailbox size, quota and archive policy',
      'Review the Exchange logs for sync or delivery errors',
      'Rebuild the local mail profile if required',
      'Confirm mail flow is restored with the requester',
    ],
  },
  {
    // Data recovery
    match: /backup|restore/i,
    group: 'Infrastructure', type: 'Data Recovery',
    tasks: [
      'Confirm the exact paths and the last known good date',
      'Locate the nearest clean restore point',
      'Restore the data to a staging location',
      'Have the requester verify the restored files',
      'Move the data back into place and close the request',
    ],
  },
  {
    // Device performance and stability
    match: /slow|performance|blue screen|crash|freez/i,
    group: 'IT Support', type: 'Investigation',
    tasks: [
      'Collect the event logs and recent update history',
      'Review startup items, disk health and memory usage',
      'Roll back or reapply the suspect update',
      'Run a full malware and disk check',
      'Monitor for 48 hours and confirm stability',
    ],
  },
  {
    // Meeting rooms and collaboration audio/video
    match: /teams|zoom|audio|projector|conference/i,
    group: 'Collaboration Support', type: 'Investigation',
    tasks: [
      'Confirm the input and output devices in use',
      'Update the audio/video drivers and the client',
      'Test a call with the requester end to end',
      'Check the room hardware and cabling where applicable',
      'Confirm the fix on the next scheduled meeting',
    ],
  },
  {
    // Connectivity — Internet down / Wi-Fi not working
    match: /internet|wi-?fi|network|connect|vpn|dns|shared drive/i,
    group: 'Network Team', type: 'Investigation',
    tasks: [
      'Run network diagnostics on the affected device',
      'Check DHCP lease and DNS resolution',
      'Verify the Wi-Fi / VPN profile configuration',
      'Schedule a remote session with the requester',
      'Escalate to the network team if unresolved',
      'Confirm connectivity is restored with the requester',
    ],
  },
  {
    // Procurement — MacBook / equipment allocation request
    match: /macbook|allocation|allocate|procure|purchase|request for|new laptop|equipment|asset/i,
    group: 'Procurement', type: 'Coordination',
    tasks: [
      'Validate the equipment request against policy',
      'Obtain manager and IT approval',
      'Raise a purchase order for the requested item',
      'Configure and image the new device',
      'Hand over the device and collect acknowledgement',
    ],
  },
  {
    // Hardware fault — laptop charger / device not working
    match: /charger|power adapter|adapter|smell|laptop|hardware|monitor|keyboard|mouse|printer|battery|broken|not working|damage/i,
    group: 'IT Support', type: 'Provisioning',
    tasks: [
      'Inspect the reported hardware fault',
      'Check warranty / AMC coverage for the device',
      'Arrange a replacement unit from inventory',
      'Coordinate device pickup and delivery with the requester',
      'Update the asset record after replacement',
    ],
  },
  {
    // Onboarding — new hire / employee onboarding (individual, non-staged variant)
    match: /onboard|joining|new hire|employee/i,
    group: 'HR', type: 'Provisioning',
    tasks: [
      'Create the employee account and email alias',
      'Provision required software and licenses',
      'Assign hardware and prepare the workstation',
      'Grant access to the relevant systems and groups',
      'Verify first-day login and access',
    ],
  },
];

// Fallback for subjects that match no theme ("help", misc requests).
const GENERIC_TASKS = {
  group: 'Service Desk', type: 'Investigation',
  tasks: [
    'Review the request details and reproduce the issue',
    'Gather additional information from the requester',
    'Identify the root cause',
    'Apply the fix and verify the resolution',
    'Update the requester and close the request',
  ],
};

const TASK_ASSIGNEES = ['Michael Chen', 'Sarah Johnson', 'Priya Sharma'];
const taskDay = (d: number) => `2026-07-${String(26 + (d % 4)).padStart(2, '0')}`;

// Per-request task seed: the Service Request INC-35 gets the staged Service Catalog tasks; every
// other request gets 3-4 individual tasks whose NAMES are drawn from the theme matching its
// subject, so the Tasks tab reflects what the request is actually about.
const seedTasksFor = (ticketId: string | null, subject?: string): any[] => {
  if (ticketId === 'INC-35') return DEMO_STAGED_TASKS;
  const theme = TASK_THEMES.find((t) => t.match.test(subject ?? '')) ?? GENERIC_TASKS;
  let h = 0;
  const s = ticketId ?? '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  h = Math.abs(h);
  const count = Math.min(theme.tasks.length, 3 + (h % 2)); // 3-4
  const start = h % theme.tasks.length;
  return Array.from({ length: count }, (_, i) => {
    const name = theme.tasks[(start + i) % theme.tasks.length];
    // First task done, second underway, rest open — reads like a real workflow.
    const status = i === 0 ? 'Closed' : i === 1 ? 'In Progress' : 'Open';
    return {
      id: `TASK-${(h % 900) + i + 100}`,
      subject: name,
      userGroup: theme.group,
      assignee: TASK_ASSIGNEES[(h + i) % TASK_ASSIGNEES.length],
      taskType: theme.type,
      startDate: taskDay(i),
      endDate: taskDay(i + 1),
      status,
      priority: i === 0 ? 'High' : i === count - 1 ? 'Low' : 'Normal',
      notifyBefore: '1',
      notifyUnit: 'days',
      description: `${name} for "${subject ?? ticketId}".`,
      completed: status === 'Closed',
    };
  });
};

export function TicketDrawer({
  openTickets,
  activeTicketId,
  onClose,
  onCloseTab,
  onTabChange,
  onOpenRelation,
stackTabs,
stackWidth,
onStackWidthChange,
approvalMode,
approvalHeader,
stackMinimized,
onStackMinimizedChange,
stackActiveGroup,
onStackActiveGroupChange,
}: TicketDrawerProps) {
  const activeTicket = openTickets.find(t => t.id === activeTicketId);
  const [minimizedLocal, setMinimizedLocal] = useState(false);
  const [showRequesterProfile, setShowRequesterProfile] = useState(false);
  const minimized = stackMinimized ?? minimizedLocal;
  const setMinimized = onStackMinimizedChange ?? setMinimizedLocal;
  useEffect(() => { setMinimized(false); }, [activeTicket?.id]);
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
  const [activeConversationTab, setActiveConversationTab] = useState<'all' | 'technician' | 'requester'>('all');
  const [activeMainTabLocal, setActiveMainTab] = useState<'conversation' | 'tasks' | 'approvals' | 'relations' | 'audit' | 'resolution' | 'service-request'>(approvalMode ? 'approvals' : 'conversation');
  /* In approval mode only the three approver tabs render, so a module default of
     Overview / Properties would land on a tab that is not on screen. */
  const activeMainTab = approvalMode && !APPROVAL_TAB_IDS.includes(activeMainTabLocal) ? 'approvals' : activeMainTabLocal;
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
  
  /* Conversation tab badge = UNREAD messages, not the total. Seeded per record; opening the
     tab shows a NEW-messages divider at the unread boundary, scrolls to it, and marks the
     thread read after a beat (Slack pattern) — the divider stays for the rest of the visit. */
  const [unreadConvCount, setUnreadConvCount] = useState(3);
  const [unreadMarker, setUnreadMarker] = useState(0);
  /* The seed is mirrored in a ref so the read timer can also restart when the RECORD
     changes without a tab change — switching between two open request tabs. */
  const unreadSeedRef = useRef(3);
  useEffect(() => { setUnreadConvCount(3); setUnreadMarker(0); unreadSeedRef.current = 3; }, [activeTicketId]);
  useEffect(() => {
    if (activeMainTab !== 'conversation') { setUnreadMarker(0); return; }
    if (unreadSeedRef.current > 0) {
      setUnreadMarker(unreadSeedRef.current);
      const read = setTimeout(() => {
        unreadSeedRef.current = 0;
        setUnreadConvCount(0);
        /* The open-item TAB carries the same unread dot — retire it with the thread. */
        window.dispatchEvent(new CustomEvent('drawer-item-read', { detail: { id: activeTicketId } }));
      }, 2000);
      const jump = setTimeout(() => document.getElementById('unread-divider')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
      return () => { clearTimeout(read); clearTimeout(jump); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, activeTicketId]);
  
  // Approvals count - based on ticket ID
  const getApprovalsCount = (ticketId: string | undefined) => {
    if (ticketId === 'INC-32') return 0; // Blank ticket has no approvals
    if (ticketId === 'INC-35') return 1; // INC-35 has 1 approval (filtered)
    return 2; // Other tickets have 2 approvals
  };
  const approvalsCount = getApprovalsCount(activeTicket?.id);
  
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
  // Clicking a description attachment opens the shared centered preview.
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; size?: string } | null>(null);
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
    type?: 'reply' | 'note' | 'collaborate' | 'forward';
    isDraft?: boolean;
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
  type RightGroup = 'properties' | 'activity' | 'suggestions' | 'chatbot' | 'notifications' | 'integration';
  const [activeGroupLocal, setActiveGroupLocal] = useState<RightGroup>('properties');
  // Defer to the DrawerStack's shared group so it persists when opening a related record.
  const activeGroup = (stackActiveGroup as RightGroup | undefined) ?? activeGroupLocal;
  // User-driven selection (rail icons, panel) → also persist to the host.
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
  const quickActionHandlerRef = useRef<((actionType: string) => void) | null>(null);

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
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [workLogs, setWorkLogs] = useState<any[]>([
    { id: 'wl-1', technician: { name: 'Rakesh Rathod', initials: 'RR', color: '#3D8BD0' }, start: '2026-06-01T19:33', end: '2026-06-29T19:33', description: 'service Taken' },
    { id: 'wl-2', technician: { name: 'Rakesh Rathod', initials: 'RR', color: '#3D8BD0' }, start: '2026-06-29T19:34', end: '2026-06-29T19:34', description: 'Work Start', timeTaken: '8 seconds' },
  ]);
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null);
  const handleAddWorkLog = (log: any) => setWorkLogs((prev) => [{ id: `wl-${Date.now()}`, ...log }, ...prev]);
  const handleDeleteWorkLog = (id: string) => setWorkLogs((prev) => prev.filter((l) => l.id !== id));
  const handleUpdateWorkLog = (id: string, log: any) =>
    setWorkLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...log, timeTaken: undefined } : l)));
  const handleEditWorkLog = (log: any) => {
    setEditingWorkLog(log);
    setShowWorkLogModal(true);
  };
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');
  const [showCatalogCategoryDropdown, setShowCatalogCategoryDropdown] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [showCatalogItemDetails, setShowCatalogItemDetails] = useState(false);
  // Id of the service-request item being swapped via "Change Item" (null = adding a new item)
  const [changingItemId, setChangingItemId] = useState<string | null>(null);
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
  /* Catalog items open expanded — the configuration is the point of the item, and a collapsed
     card makes the reader click to see what was actually requested. Seeded from the initial
     items so any item added later starts collapsed. */
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>(['macbook-pro-1']);
  
  // Tasks State
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>(() => seedTasksFor(activeTicketId, activeTicket?.subject));
  // Reseed per record — staged Service Catalog tasks only for INC-35; elsewhere individual tasks
  // whose names match the request subject.
  useEffect(() => { setTasks(seedTasksFor(activeTicketId, activeTicket?.subject)); }, [activeTicketId, activeTicket?.subject]);
  const [showServiceRequestItemStatus, setShowServiceRequestItemStatus] = useState<string | null>(null);
  
  // Tasks count - based on current tasks array
  const tasksCount = tasks.length;
  
  // Check if this is the blank ticket (INC-32 or INC-35)
  // But also check if there are any conversations - if there are, show them instead of empty state
  const hasConversationsForTicket = sentConversations.some(c => c.ticketId === activeTicketId);
  const isBlankTicket = (activeTicket?.id === 'INC-32' || activeTicket?.id === 'INC-35') && !hasConversationsForTicket;
  
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
  const [showTicketTransition, setShowTicketTransition] = useState(false);
  const [showBadgePriorityDropdown, setShowBadgePriorityDropdown] = useState(false);
  const [showBadgeAssigneeDropdown, setShowBadgeAssigneeDropdown] = useState(false);
  
  // Selected Values
  const [selectedStatus, setSelectedStatus] = useState('Open');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [selectedAssignee, setSelectedAssignee] = useState('Sarah Johnson');
  // Starts blank — the AI Suggest chip offers the value (fill-the-blanks demo).
  const [selectedTechGroup, setSelectedTechGroup] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('Medium');
  const [selectedImpact, setSelectedImpact] = useState('Affects Multiple Users');
  const [selectedCategory, setSelectedCategory] = useState('Hardware');
  const [selectedDepartment, setSelectedDepartment] = useState('');
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
  
  // Similar Requests
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
  // When the dropdown opens, highlight the current status; then ↑/↓ move, Enter selects, Esc closes.
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
  // "Affected Items" impact row — records also seed the Relations tab so the pills drill into
  // real rows rather than an empty list.
  const [affectedTypeFilter, setAffectedTypeFilter] = useState<string | null>(null);
  const affectedItems = makeAffectedItems(activeTicket?.id, [{ type: 'Problem', prefix: 'PBM', count: 2 }, { type: 'Asset', prefix: 'AST', count: 3 }, { type: 'CI', prefix: 'CI', count: 2 }]);
  
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
  const getGroupTitleWrapper = () => getGroupTitle(activeGroup);
  const getCurrentStatusColorWrapper = () => getCurrentStatusColor(selectedStatus);
  const getCurrentPriorityColorWrapper = () => getCurrentPriorityColor(selectedPriority);
  const getCurrentAssigneeColorWrapper = () => getCurrentAssigneeColor(selectedAssignee);
  const getCurrentUrgencyColorWrapper = () => getCurrentUrgencyColor(selectedUrgency);
  const getCurrentImpactColorWrapper = () => getCurrentImpactColor(selectedImpact);
  const getCurrentProjectNameColorWrapper = () => getCurrentProjectNameColor(selectedProjectName);
  const getCurrentCostCenterColorWrapper = () => getCurrentCostCenterColor(selectedCostCenter);
  const getCurrentRequestChannelColorWrapper = () => getCurrentRequestChannelColor(selectedRequestChannel);
  const getFilteredTicketFieldsWrapper = () => getFilteredTicketFields(pinnedFields, showMoreFields, propertiesSearchQuery);
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
    return getFilteredTicketFieldsWrapper().length > 0 || 'request fields'.includes(propertiesSearchQuery.toLowerCase());
  };

  const hasAdditionalFieldsMatch = () => {
    if (!propertiesSearchQuery) return true;
    const query = propertiesSearchQuery.toLowerCase();
    return getFilteredAdditionalFormFieldsWrapper().length > 0 ||
           getFilteredAdditionalFieldsWrapper().length > 0 ||
           DEMO_CUSTOM_FORM_FIELDS.some(f => f.label.toLowerCase().includes(query)) ||
           'additional fields'.includes(query);
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
    // Log the tracked session into Work History before resetting the timer.
    if (timerStartTime && elapsedTime > 0) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const end = new Date(timerStartTime.getTime() + elapsedTime * 1000);
      const humanDuration = (() => {
        const s = elapsedTime;
        if (s < 60) return `${s} second${s !== 1 ? 's' : ''}`;
        const m = Math.round(s / 60);
        if (m < 60) return `${m} minute${m !== 1 ? 's' : ''}`;
        const h = Math.round(m / 60);
        if (h < 24) return `${h} hour${h !== 1 ? 's' : ''}`;
        const days = Math.round(h / 24);
        return `${days} day${days !== 1 ? 's' : ''}`;
      })();
      setWorkLogs((prev) => [
        {
          id: `wl-${Date.now()}`,
          technician: { name: 'Arnav Desai', initials: 'AD', color: '#3D8BD0' },
          start: toLocal(timerStartTime),
          end: toLocal(end),
          description: workDescription.trim() || 'Work Tracker session',
          timeTaken: humanDuration,
        },
        ...prev,
      ]);
    }
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
    setEditingWorkLog(null);
    setShowWorkLogModal(true);
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
    if (!activeTicket) return;
    
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
      [activeTicket.id]: [...(prev[activeTicket.id] || []), ...newRelations]
    }));
    
    // Switch to the Relations tab after adding relations
    setActiveMainTab('relations');
    
    // Close the modal and reset the form
    setShowPropertiesRelationModal(false);
    setSelectedPropertiesRelationTickets([]);
    setPropertiesRelationType('');
    setPropertiesRelationSearchQuery(''); setRelationMode('existing'); setRelationCreateSubject(''); setRelationCreateDesc('');
  };

  // Onboarding no longer auto-opens on first visit — the 3-dot menu's "In-App User Guide"
  // is the one way in, so the tour is invited rather than imposed.

  // Local default when the request changes — local-only so a group the user explicitly opened
  // (e.g. Suggestions) persists across opening a related record; only applies when the host has
  // no shared group set.
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (hasSeenOnboarding && activeTicketId) {
      setActiveGroupLocal('properties');
    }
  }, [activeTicketId]);

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
      const baseTabsForOthers = ['conversation', 'tasks', 'audit', 'resolution'];
      const baseTabsForINC35 = ['service-request', 'conversation', 'tasks', 'audit', 'resolution'];
      
      // Build tabs list dynamically based on conditions
      let allTabs: string[] = [];
      
      if (activeTicket?.id === 'INC-35') {
        allTabs = [...baseTabsForINC35];
      } else {
        allTabs = [...baseTabsForOthers];
      }
      
      // Add Approvals tab if not INC-32
      if (activeTicket?.id !== 'INC-32') {
        // Insert approvals after tasks
        const tasksIndex = allTabs.indexOf('tasks');
        allTabs.splice(tasksIndex + 1, 0, 'approvals');
      }
      
      // Add Relations tab based on condition: show if NOT INC-32, OR if INC-32 has relations
      const shouldShowRelations = activeTicket?.id !== 'INC-32' || 
                                  (activeTicket?.id && ticketRelations[activeTicket.id]?.length > 0);
      if (shouldShowRelations) {
        // Insert relations after approvals (if exists) or tasks
        const approvalsIndex = allTabs.indexOf('approvals');
        if (approvalsIndex !== -1) {
          allTabs.splice(approvalsIndex + 1, 0, 'relations');
        } else {
          const tasksIndex = allTabs.indexOf('tasks');
          allTabs.splice(tasksIndex + 1, 0, 'relations');
        }
      }

      // Only apply overflow detection for INC-35
      if (activeTicket?.id !== 'INC-35') {
        setVisibleTabs(allTabs);
        setOverflowTabs([]);
        return;
      }

      const containerWidth = tabContainerRef.current.offsetWidth;
      const paddingLeft = 24; // 6 * 4 = 24px
      const paddingRight = 24;
      const gap = 10; // gap-2.5 = 10px
      // moreButtonWidth is computed after tabWidths below — the More button relabels to the
      
      // Approximate widths for each tab (in pixels)
      const tabWidths: Record<string, number> = {
        'service-request': 130,
        'conversation': 105,
        'tasks': 60,
        'approvals': 85,
        'relations': 80,
        'audit': 100,
        'resolution': 90
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
  }, [activeTicket?.id, drawerWidth, ticketRelations]);

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
    /* From My Approvals every record opens on the decision instead — and the tabs
       this effect reaches for (Service Request / Resolution) are not even rendered
       there, so it would land on a tab that is off screen. */
    if (approvalMode) { setActiveMainTab('approvals'); return; }
    if (activeTicket?.id === 'INC-35') {
      setActiveMainTab('service-request');
    } else if (activeTicket?.id === 'INC-39') {
      // INC-39 is a closed ticket, open to Resolution tab with pre-filled data
      setActiveMainTab('resolution');
      setDiagnosisData({
        content: 'After thorough investigation, the root cause has been identified as a network configuration issue affecting the user\'s connectivity. The DNS settings were incorrectly configured, preventing proper domain resolution.',
        timestamp: new Date(2022, 3, 18, 14, 30).toISOString()
      });
      setSolutionData({
        content: 'Updated the DNS configuration with the correct primary and secondary DNS servers. Flushed the DNS cache and verified connectivity. The user confirmed that all services are now accessible and functioning properly.',
        timestamp: new Date(2022, 3, 18, 15, 45).toISOString()
      });
    } else if (activeTicket) {
      setActiveMainTab('conversation');
    }
  }, [activeTicket?.id]);

  // Update ticket fields when active ticket changes
  useEffect(() => {
    if (activeTicket) {
      // Update status to match the actual ticket status
      setSelectedStatus(activeTicket.status);
      // Update priority to match the actual ticket priority
      setSelectedPriority(activeTicket.priority);
    }
  }, [activeTicket?.id, activeTicket?.status, activeTicket?.priority]);

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
      ticketId: activeTicketId, // Associate with the current active ticket
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

  // Save-as-Draft: adds the composed reply to the timeline as a DRAFT block
  // (same layout as a sent reply, but with a "Draft" pill) instead of sending it.
  const handleSaveReplyDraft = () => {
    const messageContent = replyContent || aiTypingText;
    if (!messageContent.trim()) return;
    setSentConversations([...sentConversations, {
      id: `draft-${Date.now()}`,
      ticketId: activeTicketId,
      author: 'Arnav Desai',
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: messageContent,
      type: 'reply' as const,
      isDraft: true,
      to: 'saahil.pandya@motadata.com',
      cc: 'database.team@motadata.com',
    }]);
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

  // Edit a saved draft: reopen its composer with the content loaded and remove
  // the draft block from the timeline (it's back in the editor now).
  const handleEditDraft = (conversation: { id: string; content: string; type?: string }) => {
    if (conversation.type === 'forward') {
      setForwardContent(conversation.content);
      setShowForwardEditor(true);
    } else if (conversation.type === 'collaborate') {
      setCollaborateContent(conversation.content);
      setShowCollaborateEditor(true);
    } else {
      setAiTypingText(conversation.content);
      setReplyContent('');
      setShowReplyEditor(true);
    }
    setActiveMainTab('conversation');
    setSentConversations((prev) => prev.filter((c) => c.id !== conversation.id));
  };

  // Save-as-Draft for the Collaborate composer (internal → orange draft block).
  const handleSaveCollaborateDraft = () => {
    if (!collaborateContent.trim()) return;
    setSentConversations([...sentConversations, {
      id: `draft-${Date.now()}`,
      ticketId: activeTicketId,
      author: 'Arnav Desai',
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: collaborateContent,
      type: 'collaborate' as const,
      isDraft: true,
    }]);
    setShowCollaborateEditor(false);
    setCollaborateContent('');
    setActiveMainTab('conversation');
  };

  // Save-as-Draft for the Forward composer.
  const handleSaveForwardDraft = () => {
    if (!forwardContent.trim()) return;
    setSentConversations([...sentConversations, {
      id: `draft-${Date.now()}`,
      ticketId: activeTicketId,
      author: 'Arnav Desai',
      authorInitials: 'AD',
      authorColor: '#E67E22',
      timestamp: new Date(),
      content: forwardContent,
      type: 'forward' as const,
      isDraft: true,
      to: 'team.lead@motadata.com',
    }]);
    setShowForwardEditor(false);
    setForwardContent('');
    setActiveMainTab('conversation');
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
      ticketId: activeTicketId,
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
      ticketId: activeTicketId,
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
    if (openTickets.length > 0 && !hasDrawerBeenInitialized) {
      setDrawerWidth(stackWidth ?? window.innerWidth - 54);
      setIsAccordionCollapsed(false);
      setAccordionWidth(390); // Reset accordion width to default
      setHasDrawerBeenInitialized(true);
    } else if (openTickets.length === 0) {
      // Reset initialization flag when all tickets are closed
      setHasDrawerBeenInitialized(false);
    }
  }, [openTickets.length, hasDrawerBeenInitialized]);


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

  // Function to get AI summary text
  const getAiSummaryText = () => {
    let summary = '';
    let keyPoints: string[] = [];

    if (activeTicket?.id === 'INC-32') {
      summary = 'User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.';
      keyPoints = [
        'No internet access despite Wi-Fi showing as connected',
        'Impacting ability to access emails and cloud applications',
        'Requires network diagnostics and connectivity troubleshooting'
      ];
    } else if (activeTicket?.id === 'INC-35') {
      summary = 'The user is requesting an Apple MacBook Pro 16-inch for development work. The current laptop is experiencing performance issues and cannot handle resource-intensive development tools and virtual machines required for daily work in the Engineering team.';
      keyPoints = [
        'Hardware request for MacBook Pro 16-inch',
        'Current laptop has performance issues with development tools',
        'Required for running Docker containers and virtual machines'
      ];
    } else {
      summary = 'User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.';
      keyPoints = [
        'No internet access despite Wi-Fi showing as connected',
        'Impacting ability to access emails and cloud applications',
        'Requires network diagnostics and connectivity troubleshooting'
      ];
    }

    const keyPointsText = keyPoints.map(point => `• ${point}`).join('\n');
    const fullText = `${summary}\n\nKEY POINTS:\n${keyPointsText}`;

    // Strip any HTML tags
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

  if (openTickets.length === 0 || !activeTicket) return null;
  if (minimized) return <MinimizedDrawerRail items={stackTabs ?? openTickets} activeId={activeTicket?.id} onSelect={(id) => { onTabChange(id); setMinimized(false); }} onRestore={() => setMinimized(false)} />;

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
          items={stackTabs ?? openTickets}
          activeId={activeTicketId}
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
              <HeaderIdPill id={activeTicket.id} />
              <span className="truncate">{activeTicket.subject}</span>
            </h1>
            {/* Main properties — quick-glance incident KPIs below the subject */}
            {(() => {
              const sentiment = getSentiment(activeTicket.id);
              const items: HeaderKpiItem[] = [
                { key: 'sentiment', tip: `Requester sentiment: ${sentiment.label}`, node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7B8FA5]">Sentiment</span>
                    <span className="text-[13px] leading-none" style={{ marginTop: '-1px' }}>{sentiment.emoji}</span>
                    <span className="text-[12px] font-medium" style={{ color: sentiment.text }}>{sentiment.label}</span>
                  </span>
                ) },
                { key: 'status', tip: `Status: ${selectedStatus}`, node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7B8FA5]">Status</span>
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCurrentStatusColorWrapper() }} />
                    <span className="text-[12px] font-medium text-[#364658]">{selectedStatus}</span>
                  </span>
                ) },
                { key: 'priority', tip: `Priority: ${selectedPriority}`, node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7B8FA5]">Priority</span>
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCurrentPriorityColorWrapper() }} />
                    <span className="text-[12px] font-medium text-[#364658]">{selectedPriority}</span>
                  </span>
                ) },
                { key: 'assignee', tip: `Assignee: ${selectedAssignee}`, node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7B8FA5]">Assignee</span>
                    <span className="size-4 rounded flex items-center justify-center text-white text-[8px] font-semibold flex-shrink-0" style={{ backgroundColor: getCurrentAssigneeColorWrapper() }}>
                      {selectedAssignee.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                    <span className="text-[12px] font-medium text-[#364658]">{selectedAssignee}</span>
                  </span>
                ) },
              ];
              /* SLA / approval state reads as tinted alert pills, not label:value KPIs. */
              items.push(...alertKpiItems(getHeaderAlerts({
                id: activeTicket?.id,
                status: selectedStatus,
                /* Only the service request is genuinely waiting on a decision — matches the
                   "Approval Pending" chip this row used to carry. */
                approvalsPending: activeTicket?.id === 'INC-35' ? 1 : 0,
              })));
              return <HeaderKpiRow items={items} />;
            })()}
          </div>
          {/* From My Approvals the header carries the DECISION and nothing else; the
              module's own actions stay mounted but hidden so nothing else shifts. */}
          {approvalMode && approvalHeader}
          <div className={`flex items-center gap-2 flex-shrink-0${approvalMode ? ' hidden' : ''}`}>
            <HeaderCopyButton variant="link" value={activeTicket?.id ?? ''} label="Copy Ticket URL" />
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]" 
                    onClick={() => setIsWatching(!isWatching)}
                    onMouseEnter={() => isWatching && setShowWatchersDropdown(true)}
                    onMouseLeave={() => setShowWatchersDropdown(false)}
                  >
                    {isWatching ? (
                      <EyeOff size={16} className="text-[#6b7280]" />
                    ) : (
                      <Eye size={16} className="text-[#6b7280]" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isWatching ? 'Unwatch' : 'Watch'}
                </TooltipContent>
              </Tooltip>
              
              {/* Watchers Dropdown */}
              {showWatchersDropdown && isWatching && (
                <div 
                  className="app-menu absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 min-w-[280px] z-[9999]"
                  onMouseEnter={() => setShowWatchersDropdown(true)}
                  onMouseLeave={() => setShowWatchersDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-[#e5e7eb]">
                    <div className="text-[13px] font-medium text-[#111827]">Watchers ({watchers.length})</div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {watchers.map((watcher) => (
                      <div 
                        key={watcher.id} 
                        className="px-3 py-2 hover:bg-[#f9fafb] cursor-pointer flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded bg-[#3D8BD0] text-white flex items-center justify-center text-[11px] font-medium">
                          {watcher.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#111827] truncate leading-tight">{watcher.name}</div>
                          <div className="text-[11px] text-[#6b7280] truncate mt-0.5">{watcher.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            {/* Status split-button dropdown (replaces the old Close Request button) */}
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
            <TicketActionsMenu
              ticketId={activeTicket?.id}
              onOpenTicketTransition={() => setShowTicketTransition(true)}
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
            <TicketTransitionModal isOpen={showTicketTransition} onClose={() => setShowTicketTransition(false)} ticketId={activeTicket?.id} penaltyAmount={getSlaPenaltyAmount(activeTicket?.id)} status={selectedStatus} />
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
                        {activeTicket?.id === 'INC-32' ? 'Resolution due in 4d 5h' : 'Resolution due in 5d 2h'}
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
                  {activeTicket?.id === 'INC-35' ? 'AD' : activeTicket.requester.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setShowRequesterProfile(true)} className="text-[14px] font-semibold text-[#364658] hover:text-[#3D8BD0] hover:underline transition-colors">{activeTicket?.id === 'INC-35' ? 'Arnav Desai' : activeTicket.requester}</button>
                    {isVipRequester(activeTicket?.id === 'INC-35' ? 'Arnav Desai' : activeTicket.requester) && <VipPill />}
                    {/* How the request reached the service desk, continuing the same sentence:
                        "… (6 days ago) via Email". Reads from the Source field, so changing it in
                        the right panel updates here. */}
                    <span className="text-[12px] text-[#6b7280]">
                      Created at 26/02/2025 15:02 (6 days ago)
                      {selectedSource && <> via <span className="font-medium text-[#364658]">{selectedSource}</span></>}
                    </span>
                    <div
                      onClick={() => {
                        setIsDescriptionExpanded(true);
                        setAttachmentsExpanded(true);
                        setHighlightAttachments(true);
                        // Wait for the expanded description + attachments to render, then scroll
                        // the attachments into view (block: 'center' so they sit mid-viewport).
                        setTimeout(() => {
                          document.getElementById('attachments-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 200);
                        setTimeout(() => {
                          setHighlightAttachments(false);
                        }, 3000);
                      }}
                      className="flex items-center gap-1 text-[12px] text-[#6b7280] ml-auto cursor-pointer hover:text-[#3D8BD0] transition-colors"
                      style={{ display: activeTicket?.id === 'INC-35' ? 'none' : 'flex' }}
                    >
                      <Paperclip size={12} />
                      <span>{descriptionAttachmentsFor(activeTicket?.id).length}</span>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#364658] leading-relaxed">
                    {activeTicket?.id === 'INC-35' ? (
                      // Description for INC-35: Request for Apple MacBook Pro Allocation
                      isDescriptionExpanded ? (
                        <>
                          I am requesting an Apple MacBook Pro 16-inch for my role as a Senior Software Developer in the Engineering team. The current laptop assigned to me is experiencing performance issues and is unable to handle the resource-intensive development tools and virtual machines required for my daily work.
                          <br /><br />
                          The MacBook Pro would significantly improve my productivity by providing better performance for running multiple Docker containers, IDEs, and testing environments simultaneously. This device would support my work on cross-platform development projects and ensure seamless integration with our existing Apple ecosystem. I would also need the standard software licenses and access permissions configured for development purposes.
                        </>
                      ) : (
                        <>
                          I am requesting an Apple MacBook Pro 16-inch for my role as a Senior Software Developer in the Engineering team. The current laptop assigned to me is experiencing performance issues and is unable to handle the resource-intensive development tools and virtual machines required for my daily work.{' '}
                          <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                          >
                            View more
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )
                    ) : activeTicket?.id === 'INC-32' ? (
                      // Description for INC-32: My Internet Down
                      isDescriptionExpanded ? (
                        <>
                          I am unable to access the internet on my work laptop since this morning. I've tried restarting my computer multiple times, but the issue persists. The network icon shows that I'm connected to the office Wi-Fi, but when I try to open any website or access company resources, nothing loads.
                          <br /><br />
                          This is significantly impacting my ability to work as I cannot access emails, cloud applications, or collaborate with my team. I've checked with colleagues nearby and they don't seem to be experiencing any connectivity issues. I need urgent assistance to resolve this problem as I have several critical tasks and meetings scheduled today that require internet access.
                          <br /><br />
                          The problem first appeared at approximately 8:45 AM today, right after I returned from a short meeting and unlocked my laptop. Everything was working perfectly when I left my desk around 8:15 AM, so the outage seems to have started while the machine was locked and idle.
                          <br /><br />
                          Before raising this request I attempted the usual troubleshooting steps on my own: I rebooted the laptop three times, toggled the Wi-Fi adapter off and on, forgot and re-joined the "Corp-Secure" network, and even tried the guest network as a test. None of these restored connectivity, and the guest network behaved exactly the same way.
                          <DescriptionInlineImage />
                          I also ran the built-in network diagnostics tool, and I've attached the exported report below. As shown in the diagram above, my laptop reaches the office access point and the local gateway without any problem, but every request beyond the gateway times out — it looks like the connection is being dropped somewhere between our gateway and the internet service provider.
                          <br /><br />
                          When I open Command Prompt, I can successfully ping the gateway (192.168.1.1) with 0% packet loss, but pinging external addresses such as 8.8.8.8 or google.com results in "Request timed out" for every packet. DNS lookups also fail with a "server could not be found" error in the browser.
                          <br /><br />
                          The outage is blocking access to a long list of business-critical resources, including Outlook/Exchange email, the Jira and Confluence workspaces, our internal SharePoint drives, the CRM portal, Microsoft Teams, and the cloud build pipeline I use throughout the day. Essentially nothing that lives outside the local network is reachable.
                          <br /><br />
                          I walked around to confirm the scope of the issue. Two colleagues sitting in the same row are online without any trouble on the same SSID, which suggests this is specific to my device or my network profile rather than a building-wide outage. One teammate on the far side of the floor did mention intermittent slowness, so it may be worth checking that segment as well.
                          <br /><br />
                          As a temporary workaround I tethered my laptop to my mobile phone's hotspot, and on that connection everything works normally — email syncs, websites load, and the VPN connects. This further points to a problem with the office Wi-Fi path to the internet rather than anything wrong with the laptop's hardware or operating system.
                          <br /><br />
                          I have not made any recent changes to my machine — no new software installs, no VPN client updates, and no firewall changes that I'm aware of. The corporate VPN client shows "disconnected" and refuses to reconnect over the office network, returning a timeout, although it connects instantly over the mobile hotspot.
                          <br /><br />
                          This is genuinely urgent for me today. I have a customer demo at 2:00 PM that depends on the cloud environment, a release sign-off that needs to happen before 4:00 PM, and several code reviews that are blocking other engineers. Every hour without connectivity is directly delaying the team's deliverables for this sprint.
                          <br /><br />
                          Please treat this with high priority. I'm available at my desk (Seat 4-B, 3rd floor) for the rest of the day and can stay on a call or screen-share via my phone's hotspot if the support engineer needs to run remote diagnostics. Thank you in advance for the quick help.
                        </>
                      ) : (
                        <>
                          I am unable to access the internet on my work laptop since this morning. I've tried restarting my computer multiple times, but the issue persists. The network icon shows that I'm connected to the office Wi-Fi, but when I try to open any website or access company resources, nothing loads.{' '}
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
                      // Every other request: a body written for ITS subject.
                      (() => {
                        const d = describeSubject(activeTicket?.subject);
                        return isDescriptionExpanded ? (
                          <>
                            {d.short}
                            {d.more.map((p, i) => (
                              <span key={i} className="mt-3 block">{p}</span>
                            ))}
                          </>
                        ) : (
                          <>
                            {d.short}{' '}
                            <button
                              onClick={() => setIsDescriptionExpanded(true)}
                              className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                            >
                              View more
                              <ChevronDown size={14} />
                            </button>
                          </>
                        );
                      })()
                    )}
                  </p>
                  {/* Attachments */}
                  {isDescriptionExpanded && activeTicket?.id !== 'INC-35' && (
                  <div id="attachments-section" className="scroll-mt-4">
                    <DescriptionAttachments
                      files={descriptionAttachmentsFor(activeTicket?.id)}
                      highlight={highlightAttachments}
                      onPreview={setPreviewAttachment}
                    />
                  </div>
                  )}

                  {/* Collapse control closes the expanded block, so it sits after everything the
                      expansion revealed — the description AND its attachments. */}
                  {isDescriptionExpanded && (
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DFE5ED] bg-[#F5F9FD] text-[13px] font-semibold text-[#3D8BD0] hover:bg-[#EBF3FB] hover:border-[#3D8BD0] transition-colors"
                    >
                      View less
                      <ChevronUp size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <AffectedItemsRow
              records={affectedItems}
              onOpenType={(type) => { setAffectedTypeFilter(type); setActiveMainTab('relations'); }}
              onOpenRelation={onOpenRelation}
            />

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
                    {activeTicket?.id === 'INC-32' ? (
                      <>
                        User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.
                      </>
                    ) : activeTicket?.id === 'INC-35' ? (
                      <>
                        The user is requesting an Apple MacBook Pro 16-inch for development work. The current laptop is experiencing performance issues and cannot handle resource-intensive development tools and virtual machines required for daily work in the Engineering team.
                      </>
                    ) : (
                      <>
                        User reporting complete internet outage on work laptop despite showing Wi-Fi connection. Unable to access websites or company resources since morning. Urgent assistance needed for business-critical work and scheduled meetings.
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold text-[#7B8FA5] mb-2">KEY POINTS</h4>
                    <ul className="space-y-1.5">
                      {activeTicket?.id === 'INC-32' ? (
                        <>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>No internet access despite Wi-Fi showing as connected</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Impacting ability to access emails and cloud applications</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Requires network diagnostics and connectivity troubleshooting</span>
                          </li>
                        </>
                      ) : activeTicket?.id === 'INC-35' ? (
                        <>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Hardware request for MacBook Pro 16-inch</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Current laptop has performance issues with development tools</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Required for running Docker containers and virtual machines</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>No internet access despite Wi-Fi showing as connected</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Impacting ability to access emails and cloud applications</span>
                          </li>
                          <li className="flex items-start gap-2 text-[13px] text-[#364658]">
                            <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            <span>Requires network diagnostics and connectivity troubleshooting</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="text-[11px] text-[#9CA3AF] mb-4">
                    Generated by Rakesh Rathod at 24/02/2025 17:10
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (quickActionHandlerRef.current) {
                          quickActionHandlerRef.current('Root Cause');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                        border: '1px solid transparent'
                      }}
                      className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                    >
                      <span>Investigate with AI</span>
                    </button>
                    <button
                      onClick={() => {
                        if (quickActionHandlerRef.current) {
                          quickActionHandlerRef.current('Find Similar Requests');
                        }
                      }}
                      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                      className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                    >
                      <span>Find similar requests</span>
                    </button>
                    <button
                      onClick={() => {
                        if (quickActionHandlerRef.current) {
                          quickActionHandlerRef.current('Suggest KB');
                        }
                      }}
                      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                      className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                    >
                      <span>Suggest KB</span>
                    </button>
                  </div>
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
                    { id: 'service-request', label: 'Service Request', condition: activeTicket?.id === 'INC-35' },
                    { id: 'conversation', label: 'Conversation' },
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'approvals', label: 'Approvals', condition: activeTicket?.id !== 'INC-32' },
                    { id: 'relations', label: 'Relations', condition: activeTicket?.id === 'INC-32' ? (ticketRelations['INC-32']?.length || 0) > 0 : true },
                    { id: 'audit', label: 'Audit Trails' },
                    { id: 'resolution', label: 'Resolution' },
                  ].filter(tab => tab.condition !== false);

                  /* From My Approvals: the thread, the decision, and what the record
                     touches — nothing else, in that fixed order whatever the module.
                     Three tabs always fit, so the overflow split is skipped. */
                  const allowedTabIds = approvalMode ? APPROVAL_TAB_IDS : tabConfig.map(tab => tab.id);
                  const filteredVisibleTabs = approvalMode ? allowedTabIds : visibleTabs.filter(tabId => allowedTabIds.includes(tabId));
                  const filteredOverflowTabs = approvalMode ? [] : overflowTabs.filter(tabId => allowedTabIds.includes(tabId));

                  const tabLabels: Record<string, string> = {
                    'service-request': 'Service Request',
                    'conversation': 'Conversation',
                    'tasks': 'Tasks',
                    'approvals': 'Approvals',
                    'relations': 'Relations',
                    'audit': 'Audit Trails',
                    'resolution': 'Resolution'
                  };

                  const renderTab = (tabId: string) => (
                    <button
                      key={tabId}
                      className={`px-2 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${activeMainTab === tabId ? 'text-[#3D8BD0] border-[#3D8BD0]' : 'text-[#6b7280] border-transparent hover:bg-[#F5F7FA] hover:text-[#364658] hover:border-[#CBD5E1]'}`}
                      onClick={() => setActiveMainTab(tabId as any)}
                    >
                      {tabLabels[tabId]}
                      {tabId === 'conversation' && activeTicket?.id !== 'INC-32' && activeTicket?.id !== 'INC-35' && unreadConvCount > 0 && (
                        <span className="rounded bg-[#3D8BD0] px-1 py-0.5 text-[12px] font-medium text-white">
                          {unreadConvCount}
                        </span>
                      )}
                      {tabId === 'tasks' && tasksCount > 0 && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {tasksCount}
                        </span>
                      )}
                      {tabId === 'approvals' && activeTicket?.id !== 'INC-32' && (
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
              ) : hasConversationsForTicket && (activeTicket?.id === 'INC-32' || activeTicket?.id === 'INC-35') ? (
                // Show only sent conversations for blank tickets that have conversations
                <BlankTicketConversationView 
                  conversations={sentConversations.filter(c => c.ticketId === activeTicketId)}
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
                <div className="sticky top-[48px] z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-white px-6 py-3">
                  <div className="flex gap-2 flex-shrink-0 whitespace-nowrap">
                    <button 
                      className={`text-[14px] font-medium px-3 py-1.5 rounded ${activeConversationTab === 'all' ? 'bg-[#f1f5f9] text-[#334155]' : 'text-[#6b7280] hover:text-[#364658]'}`}
                      onClick={() => setActiveConversationTab('all')}
                    >
                      All Activities
                    </button>
                    <button
                      className={`text-[14px] font-medium px-3 py-1.5 rounded ${activeConversationTab === 'technician' ? 'bg-[#f1f5f9] text-[#334155]' : 'text-[#6b7280] hover:text-[#364658]'}`}
                      onClick={() => setActiveConversationTab('technician')}
                    >
                      Technician
                    </button>
                    <button
                      className={`text-[14px] font-medium px-3 py-1.5 rounded ${activeConversationTab === 'requester' ? 'bg-[#f1f5f9] text-[#334155]' : 'text-[#6b7280] hover:text-[#364658]'}`}
                      onClick={() => setActiveConversationTab('requester')}
                    >
                      Requester
                    </button>
                  </div>
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
                    {/* Comment (internal note — hidden in Requester Conversation) */}
                    {activeConversationTab !== 'requester' && (
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
                        <span className="text-[#3D8BD0] font-medium">@Arnav Desai</span> - Can you take a look at this? The requester needs assistance with the SolarWinds migration. This seems related to the infrastructure modernization project we discussed last month.
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
                    )}

                {/* Reporter Comment */}
                {activeConversationTab !== 'technician' && (
                replyingToConversation === 'conversation-5days' ? (
                  <InlineReplyEditor
                    replyContent={inlineReplyContent}
                    onReplyContentChange={setInlineReplyContent}
                    onClose={() => setReplyingToConversation(null)}
                    conversationAuthor="Arnav Desai"
                    conversationTime="5 days ago"
                    conversationText="Forwarding to the infrastructure team for review and approval. Please prioritize this request as it impacts multiple production environments. We need to ensure all stakeholders are aligned on the timeline and resource allocation for this migration. The SolarWinds Observability platform will provide comprehensive monitoring capabilities..."
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
                          <div><CopyableEmails text="Forwarded to infrastructure.team@motadata.com, devops@motadata.com, Cc: saahil.pandya@motadata.com,..." /></div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="mb-2">
                            <div className="font-medium"><CopyableEmails text="To: infrastructure.team@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="devops@motadata.com" /></div>
                          </div>
                          <div>
                            <div className="font-medium"><CopyableEmails text="Cc: saahil.pandya@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="database.team@motadata.com" /></div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        {showFullForwardText ? (
                          <>
                            Forwarding to the infrastructure team for review and approval. Please prioritize this request 
                            as it impacts multiple production environments. We need to ensure all stakeholders are aligned 
                            on the timeline and resource allocation for this migration. The SolarWinds Observability platform 
                            will provide comprehensive monitoring capabilities across our entire infrastructure stack, including 
                            application performance monitoring, infrastructure monitoring, log management, and real-time analytics.
                            <br /><br />
                            This migration will enable us to consolidate our current monitoring tools and provide better visibility 
                            into system performance and potential issues. The platform supports hybrid cloud environments and offers 
                            advanced features such as automated anomaly detection, intelligent alerting, and customizable dashboards 
                            that will significantly improve our operational efficiency.
                            <br /><br />
                            Please review the technical requirements and provide your feedback on the proposed implementation timeline. 
                            We should also schedule a meeting with all department heads to discuss the training requirements and ensure 
                            a smooth transition. The estimated completion date is within Q2 2026, pending approval and resource availability.
                          </>
                        ) : (
                          <>
                            Forwarding to the infrastructure team for review and approval. Please prioritize this request 
                            as it impacts multiple production environments. We need to ensure all stakeholders are aligned 
                            on the timeline and resource allocation for this migration. The SolarWinds Observability platform 
                            will provide comprehensive monitoring capabilities...{' '}
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
                            <div><span className="font-medium">From:</span> Sarah Chen</div>
                            <div><span className="font-medium">Date:</span> Feb 4, 2026 at 9:42 AM</div>
                            <div><span className="font-medium">To:</span><CopyableEmails text=" servicedesk@motadata.com" /></div>
                            <div><span className="font-medium">Subject:</span> Monitoring migration to SolarWinds Observability</div>
                          </div>
                          <div className="bg-[rgba(223,229,237,0.15)] rounded-lg p-3">
                            <p className="text-sm text-[#364658] leading-relaxed">
                              Hi team, we need to migrate our current monitoring setup to SolarWinds Observability. 
                              This change will provide better visibility across our infrastructure and improve our 
                              incident response times. Please review and advise on the implementation timeline.
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
                {activeConversationTab !== 'technician' && (
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
                    conversationText="Thanks for reaching out! I've reviewed your requirements and prepared a migration plan. The attached documents outline the implementation steps and timeline."
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
                            <div><CopyableEmails text="Replied to sarah.chen@motadata.com, ops.team@motadata.com, Cc: infrastructure.team@motadata.com,..." /></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="mb-2">
                              <div className="font-medium"><CopyableEmails text="To: sarah.chen@motadata.com" /></div>
                              <div className="ml-4"><CopyableEmails text="ops.team@motadata.com" /></div>
                            </div>
                            <div>
                              <div className="font-medium"><CopyableEmails text="Cc: infrastructure.team@motadata.com" /></div>
                              <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                              <div className="ml-4"><CopyableEmails text="saahil.pandya@motadata.com" /></div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                        <p className="text-sm text-[#364658] leading-relaxed">
                          Thanks for reaching out! I've reviewed your requirements and prepared a migration plan. 
                          The attached documents outline the implementation steps and timeline.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="group/file relative flex items-center gap-2 px-3 py-1 pr-16 bg-[#F5F7FA] border border-[#DFE5ED] rounded hover:bg-[#EEF2F7] transition-colors">
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
                        <div className="group/file relative flex items-center gap-2 px-3 py-1 pr-16 bg-[#F5F7FA] border border-[#DFE5ED] rounded hover:bg-[#EEF2F7] transition-colors">
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

                {/* Yesterday Group (internal note — hidden in Requester Conversation) */}
                {activeConversationTab !== 'requester' && (
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
                        Migration testing scheduled for this weekend. Will update the requester once we complete 
                        the initial deployment phase.
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
                )}

                {/* Unread boundary — everything below arrived since the last visit */}
                {unreadMarker > 0 && activeConversationTab !== 'technician' && (
                  <div id="unread-divider" className="flex items-center gap-3 pt-2 pb-4">
                    <div className="h-px flex-1 bg-[#3D8BD0]/30" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D8BD0]/25 bg-[#F0F7FD] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">
                      <span className="size-1.5 rounded-full bg-[#3D8BD0]" />
                      {unreadMarker} new {unreadMarker === 1 ? 'message' : 'messages'}
                    </span>
                    <div className="h-px flex-1 bg-[#3D8BD0]/30" />
                  </div>
                )}

                {/* Today Group */}
                {activeConversationTab !== 'technician' && (
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
                    conversationText="Initial deployment completed successfully. I've attached the post-deployment report and monitoring dashboard access credentials. Please review and let me know if you need any adjustments."
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
                          <div><CopyableEmails text="Replied to saahil.pandya@motadata.com, keertan@motadata.com, Cc: database.team@motadata.com,..." /></div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="mb-2">
                            <div className="font-medium"><CopyableEmails text="To: saahil.pandya@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="keertan@motadata.com" /></div>
                          </div>
                          <div>
                            <div className="font-medium"><CopyableEmails text="Cc: database.team@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="kenil.patel@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="ronak.patel@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="saahil.pandya@motadata.com" /></div>
                            <div className="ml-4"><CopyableEmails text="nirav.bhatt@motadata.com" /></div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-4 mt-2">
                      <p className="text-sm text-[#364658] leading-relaxed">
                        Initial deployment completed successfully. I've attached the post-deployment report and 
                        monitoring dashboard access credentials. Please review and let me know if you need any adjustments.
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
                {sentConversations.filter(c => c.ticketId === activeTicketId && (activeConversationTab === 'all' || (['note', 'collaborate'].includes(c.type) ? activeConversationTab === 'technician' : activeConversationTab === 'requester'))).map((conversation) => (
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
                        {conversation.isDraft && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(245,158,11,0.12)] text-[#B45309] text-xs rounded font-medium cursor-help">
                                <FileText className="size-3" />
                                Draft
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Saved as draft — not sent yet
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {(conversation.type === 'reply' || conversation.type === 'forward') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                              <div>{conversation.isDraft ? `Draft ${conversation.type === 'forward' ? 'forward' : 'reply'} to ${conversation.to}` : `${conversation.type === 'forward' ? 'Forwarded' : 'Replied'} to ${conversation.to}`}{conversation.cc ? `, Cc: ${conversation.cc},...` : ''}</div>
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
                        conversation.isDraft
                          ? (conversation.type === 'note' || conversation.type === 'collaborate'
                              // internal draft → keep the orange background, dashed orange border
                              ? 'bg-[rgba(245,133,24,0.10)] border border-dashed border-[#F58518]'
                              // reply/forward draft → keep the gray background, dashed gray border
                              : 'bg-[rgba(223,229,237,0.20)] border border-dashed border-[#CBD5E1]')
                          : conversation.type === 'note' || conversation.type === 'collaborate'
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
                    
                    {/* Hover Actions — drafts get Edit + Delete; sent blocks get Reply + Forward + Delete */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      {conversation.isDraft ? (
                        <button
                          className="p-1.5 hover:bg-[#F3F4F6] rounded"
                          title="Edit draft"
                          onClick={() => handleEditDraft(conversation)}
                        >
                          <Edit className="size-4 text-[#7B8FA5]" />
                        </button>
                      ) : (
                        <>
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
                        </>
                      )}
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
                  onSaveDraft={handleSaveReplyDraft}
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
                  requesterEmail={activeTicket ? `${activeTicket.requester.toLowerCase().replace(/ /g, '.')}@motadata.com` : undefined}
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
                          defaultValue="Fwd: SR-6001 - Switching to SolarWinds Observability"
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
                          <span className="text-[#364658] ml-1">SR-6001 - Switching to SolarWinds Observability</span>
                        </div>
                      </div>
                      <div className="text-sm text-[#364658]">
                        Need urgent assistance with switching to SolarWinds Observability platform. 
                        Current monitoring solution is not meeting our requirements.
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
                      <EditorSendActions onSaveDraft={handleSaveForwardDraft} />
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
                  <EditorSendActions onSend={handleSendCollaborate} onSaveDraft={handleSaveCollaborateDraft} />
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
                  <EditorSendActions onSend={handleSendNote} showSaveDraft={false} />
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
                ticketId={activeTicket?.id}
                showCreateApprovalPopup={showCreateApprovalPopup}
                onCloseApprovalPopup={() => setShowCreateApprovalPopup(false)}
                onOpenApprovalPopup={() => setShowCreateApprovalPopup(true)}
                onApprove={() => {
                  // Create a new task when user approves
                  const taskSubject = activeTicket?.id === 'INC-35'
                    ? 'Purchase and allocate Apple MacBook Pro 16-inch'
                    : `Process approval for ${activeTicket?.subject || 'request'}`;

                  const taskDescription = activeTicket?.id === 'INC-35'
                    ? 'Procure Apple MacBook Pro 16-inch with required specifications, configure standard development licenses, and allocate to the requester.'
                    : `Task created automatically after approval for: ${activeTicket?.subject || 'request'}`;

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
                ticketId={activeTicket?.id}
                externalRelations={activeTicket?.id ? (ticketRelations[activeTicket.id]?.length ? ticketRelations[activeTicket.id] : (activeTicket.id === 'INC-32' ? undefined : DEFAULT_TICKET_RELATIONS)) : undefined ?? affectedItems}
                onOpenRelation={onOpenRelation}
              initialTypeFilter={affectedTypeFilter}
                onClearTypeFilter={() => setAffectedTypeFilter(null)}
              />
            )}

            {/* Audit Trails Tab Content */}
            {activeMainTab === 'audit' && <AuditTrailsTabContent ticketId={activeTicket?.id} />}

            {/* Resolution Tab Content */}
            {activeMainTab === 'resolution' && (
              <div className="px-6 py-6">
                {(!hasDiagnosis && !hasSolution && !diagnosisData && !solutionData) ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-lg">
                      <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
                        <Lightbulb className="size-8 text-[#7B8FA5]" />
                      </div>
                      <h3 className="font-semibold text-[#364658] mb-2 text-[14px]">No Diagnosis or Solution Added</h3>
                      <p className="text-[#7B8FA5] mb-6 text-[13px] max-w-[300px]">
                        Document the root cause analysis and resolution steps for this service request.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setHasDiagnosis(true)}
                          className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                        >
                          <Stethoscope className="size-4" />
                          Add Diagnosis
                        </button>
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
                ) : (
                  <div className="space-y-4">
                    {hasDiagnosis && !diagnosisData && (
                      <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={diagnosisFormRef}>
                        {/* Diagnosis Header */}
                        <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#364658]">Diagnosis</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#DFE5ED] rounded text-[#7B8FA5]">
                              <Lock size={12} />
                              <span className="text-xs">Not visible to requester</span>
                            </div>
                            <button className="text-[#7B8FA5] hover:text-[#364658]">
                              <Maximize2 size={16} />
                            </button>
                            <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onCloseDiagnosis}>
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Diagnosis Form Content */}
                        <div className="p-4">
                          {/* Text Area */}
                          <div className="mb-4">
                            <textarea
                              value={diagnosisText}
                              onChange={(e) => setDiagnosisText(e.target.value)}
                              placeholder="Add your diagnosis..."
                              className="w-full h-48 text-sm text-[#364658] focus:outline-none bg-transparent resize-none"
                            />
                          </div>

                          {/* Bottom Toolbar */}
                          <div className="relative flex items-center justify-between">
                            {/* Left Side - AI Assist and Formatting Tools */}
                            <div className="flex items-center gap-1">
                              <div className="relative" ref={aiAssistMenuDiagnosisRef}>
                                <button 
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                                  style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                                  onClick={() => setShowAIAssistMenuDiagnosis(!showAIAssistMenuDiagnosis)}
                                >
                                  <AiSparkle size={14} />
                                  <span>AI Assist</span>
                                  <ChevronDown size={12} className="text-[#7B8FA5]" />
                                </button>

                                {/* AI Assist Dropdown Menu - Refine options only */}
                                {showAIAssistMenuDiagnosis && (
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
                                          setShowAIAssistMenuDiagnosis(false);
                                        }}
                                      >
                                        <RefreshCw size={14} className="text-[#364658]" />
                                        <span className="text-xs text-[#364658]">Rephrase</span>
                                      </button>
                                      
                                      {/* Make longer */}
                                      <button 
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                        onClick={() => {
                                          setShowAIAssistMenuDiagnosis(false);
                                        }}
                                      >
                                        <TextCursorInput size={14} className="text-[#364658]" />
                                        <span className="text-xs text-[#364658]">Make longer</span>
                                      </button>
                                      
                                      {/* Make shorter */}
                                      <button 
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                        onClick={() => {
                                          setShowAIAssistMenuDiagnosis(false);
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
                                            setShowToneSubmenuDiagnosis(!showToneSubmenuDiagnosis);
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Wand2 size={14} className="text-[#364658]" />
                                            <span className="text-xs text-[#364658]">Change tone</span>
                                          </div>
                                          <ChevronRight size={14} className="text-[#7B8FA5]" />
                                        </button>

                                        {/* Tone Submenu */}
                                        {showToneSubmenuDiagnosis && (
                                          <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                            <div className="py-2">
                                              <button 
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                                onClick={() => {
                                                  setShowToneSubmenuDiagnosis(false);
                                                  setShowAIAssistMenuDiagnosis(false);
                                                }}
                                              >
                                                <Briefcase size={14} className="text-[#364658]" />
                                                <span className="text-xs text-[#364658]">Professional</span>
                                              </button>
                                              
                                              <button 
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                                onClick={() => {
                                                  setShowToneSubmenuDiagnosis(false);
                                                  setShowAIAssistMenuDiagnosis(false);
                                                }}
                                              >
                                                <Heart size={14} className="text-[#364658]" />
                                                <span className="text-xs text-[#364658]">Empathetic</span>
                                              </button>
                                              
                                              <button 
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                                onClick={() => {
                                                  setShowToneSubmenuDiagnosis(false);
                                                  setShowAIAssistMenuDiagnosis(false);
                                                }}
                                              >
                                                <Zap size={14} className="text-[#364658]" />
                                                <span className="text-xs text-[#364658]">Concise</span>
                                              </button>
                                              
                                              <button 
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                                onClick={() => {
                                                  setShowToneSubmenuDiagnosis(false);
                                                  setShowAIAssistMenuDiagnosis(false);
                                                }}
                                              >
                                                <FileText size={14} className="text-[#364658]" />
                                                <span className="text-xs text-[#364658]">Formal</span>
                                              </button>
                                              
                                              <button 
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                                onClick={() => {
                                                  setShowToneSubmenuDiagnosis(false);
                                                  setShowAIAssistMenuDiagnosis(false);
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
                              <div className="flex items-center gap-1" ref={formattingMenuDiagnosisRef}>
                                {/* Always visible quick access icons */}
                                <EditorToolbarActions fullWidthRow />

                                {/* All Formatting Options Dropdown */}
                                {showFormattingMenuDiagnosis && (
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
                                        onClick={() => setShowFormattingMenuDiagnosis(false)}
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side - Add Button */}
                            <button 
                              onClick={() => {
                                if (diagnosisText.trim()) {
                                  setDiagnosisData({
                                    content: diagnosisText,
                                    timestamp: new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                  });
                                  setDiagnosisText('');
                                  setHasDiagnosis(false);
                                }
                              }}
                              className="px-4 py-1.5 bg-[#3D8BD0] text-white rounded hover:bg-[#2F7AB8] text-xs font-medium"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display saved diagnosis */}
                    {diagnosisData && (
                      <DiagnosisCard
                        showInternalTag={false}
                        content={diagnosisData.content}
                        timestamp={diagnosisData.timestamp}
                        onEdit={() => {
                          // Reopen diagnosis form with existing content
                          setDiagnosisText(diagnosisData.content);
                          setHasDiagnosis(true);
                          setDiagnosisData(null);
                        }}
                        onDelete={() => {
                          setDiagnosisData(null);
                        }}
                      />
                    )}
                    
                    {hasSolution && !solutionData && (
                      <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={solutionFormRef}>
                        {/* Solution Header */}
                        <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#364658]">Solution</h3>
                          <div className="flex items-center gap-2">
                            <button className="text-[#7B8FA5] hover:text-[#364658]">
                              <Maximize2 size={16} />
                            </button>
                            <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onCloseSolution}>
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Solution Form Content */}
                        <div className="p-4">
                          {/* Text Area */}
                          <div className="mb-4">
                            <textarea
                              value={solutionText}
                              onChange={(e) => setSolutionText(e.target.value)}
                              placeholder="Add your solution..."
                              className="w-full h-48 text-sm text-[#364658] focus:outline-none bg-transparent resize-none"
                            />
                          </div>

                          {/* Bottom Toolbar */}
                          <div className="relative flex items-center justify-between">
                            {/* Left Side - AI Assist and Formatting Tools */}
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

                              {/* AI Assist Dropdown Menu - Refine options only */}
                              {showAIAssistMenuSolution && (
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
                                        setShowAIAssistMenuSolution(false);
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
                                        setShowAIAssistMenuSolution(false);
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
                                        setShowAIAssistMenuSolution(false);
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
                                          setShowToneSubmenuSolution(!showToneSubmenuSolution);
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Wand2 size={14} className="text-[#364658]" />
                                          <span className="text-xs text-[#364658]">Change tone</span>
                                        </div>
                                        <ChevronRight size={14} className="text-[#7B8FA5]" />
                                      </button>

                                      {/* Tone Submenu */}
                                      {showToneSubmenuSolution && (
                                        <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                          <div className="py-2">
                                            <button 
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                              onClick={() => {
                                                setShowToneSubmenuSolution(false);
                                                setShowAIAssistMenuSolution(false);
                                                // Handle professional tone action
                                              }}
                                            >
                                              <Briefcase size={14} className="text-[#364658]" />
                                              <span className="text-xs text-[#364658]">Professional</span>
                                            </button>
                                            
                                            <button 
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                              onClick={() => {
                                                setShowToneSubmenuSolution(false);
                                                setShowAIAssistMenuSolution(false);
                                                // Handle empathetic tone action
                                              }}
                                            >
                                              <Heart size={14} className="text-[#364658]" />
                                              <span className="text-xs text-[#364658]">Empathetic</span>
                                            </button>
                                            
                                            <button 
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                              onClick={() => {
                                                setShowToneSubmenuSolution(false);
                                                setShowAIAssistMenuSolution(false);
                                                // Handle concise tone action
                                              }}
                                            >
                                              <Zap size={14} className="text-[#364658]" />
                                              <span className="text-xs text-[#364658]">Concise</span>
                                            </button>
                                            
                                            <button 
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                              onClick={() => {
                                                setShowToneSubmenuSolution(false);
                                                setShowAIAssistMenuSolution(false);
                                                // Handle formal tone action
                                              }}
                                            >
                                              <FileText size={14} className="text-[#364658]" />
                                              <span className="text-xs text-[#364658]">Formal</span>
                                            </button>
                                            
                                            <button 
                                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                              onClick={() => {
                                                setShowToneSubmenuSolution(false);
                                                setShowAIAssistMenuSolution(false);
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
                            <div className="flex items-center gap-1" ref={formattingMenuSolutionRef}>
                              {/* Always visible quick access icons */}
                              <EditorToolbarActions fullWidthRow />

                              {/* All Formatting Options Dropdown */}
                              {showFormattingMenuSolution && (
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
                                      onClick={() => setShowFormattingMenuSolution(false)}
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            </div>

                            {/* Right Side - Add Button */}
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
                    )}

                    {/* Display Saved Solution */}
                    {solutionData && (
                      <SolutionCard
                        content={solutionData.content}
                        timestamp={solutionData.timestamp}
                        onEdit={() => {
                          // Reopen solution form with existing content
                          setSolutionText(solutionData.content);
                          setHasSolution(true);
                          setSolutionData(null);
                        }}
                        onDelete={() => {
                          setSolutionData(null);
                        }}
                      />
                    )}
                    
                    {/* Add More Button */}
                    {(hasDiagnosis || hasSolution || diagnosisData || solutionData) && (
                      <div className="flex gap-3">
                        {!hasDiagnosis && !diagnosisData && (
                          <button 
                            onClick={() => setHasDiagnosis(true)}
                            className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                          >
                            <Stethoscope className="size-4" />
                            Add Diagnosis
                          </button>
                        )}
                        {!hasSolution && !solutionData && (
                          <button 
                            onClick={() => setHasSolution(true)}
                            className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                          >
                            <Lightbulb className="size-4" />
                            Add Solution
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                                className="w-full px-4 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowServiceRequestMenu(null);
                                  // Open the Service Catalog to swap this item for another
                                  setChangingItemId(item.id);
                                  setShowServiceCatalog(true);
                                }}
                              >
                                <ArrowRightLeft className="size-4 text-[#6B7280]" />
                                Change Item
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
                  {/* Profile Icon Button */}
                  <button 
                    className="size-6 rounded overflow-hidden border border-[#DEE5ED] hover:border-[#3D8BD0] transition-colors flex-shrink-0"
                    style={{ borderRadius: '4px' }}
                  >
                    <div className="flex flex-col items-center">
                    <div className="size-[24px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">SJ</div>
                  </div>
                  </button>

                  {/* Reply with AI - Primary Action with Dropdown */}
                  <div className="relative" ref={aiDropdownRef}>
                    <button 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                      style={{
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                        border: '2px solid transparent',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAiDropdown(!showAiDropdown);
                      }}
                    >
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
                      <span>Reply with AI</span>
                      <ChevronDown size={12} className={`text-[#7B8FA5] transition-transform ${showAiDropdown ? '' : 'rotate-180'}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showAiDropdown && (
                      <div className="app-menu absolute bottom-full left-0 mb-2 w-[240px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                        {aiOptions.map((option, index) => (
                          <button
                            key={index}
                            className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAiDropdown(false);
                              handleReplyWithAI(option.label);
                            }}
                          >
                            <option.icon size={16} className={`${option.color} flex-shrink-0 mt-0.5`} />
                            <span className="text-sm text-[#364658] whitespace-pre-line">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEE5ED] rounded hover:bg-[#F9FAFB] text-xs font-medium text-[#364658]"
                          onClick={handleReply}>
                    <Reply size={14} className="text-[#7B8FA5]" />
                    <span>Reply</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEE5ED] rounded hover:bg-[#F9FAFB] text-xs font-medium text-[#364658]"
                          onClick={handleForward}>
                    <Forward size={14} className="text-[#7B8FA5]" />
                    <span>Forward</span>
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
            requesterName={activeTicket?.id === 'INC-35' ? 'Arnav Desai' : activeTicket?.requester}
            showVip
            ticketId={activeTicket?.id}
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
            propertiesTitle="Request Properties"
            additionalTitle="Request Information"
            showNotifications={!approvalMode}
            showIntegration={!approvalMode}
            onOpenRelation={onOpenRelation}
            onAddWorkLog={handleAddWorkLog}
            demoCustomFields={true}
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
            onClick={() => { setShowServiceCatalog(false); setChangingItemId(null); }}
          />
          
          {/* Slide-in Panel */}
          <div className="fixed right-0 top-0 h-screen w-[600px] max-w-[95vw] bg-white shadow-2xl z-[110] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-semibold text-[#364658]">Service Catalog</h2>
              <button
                onClick={() => { setShowServiceCatalog(false); setChangingItemId(null); }}
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
                      const itemData = {
                        name: selectedCatalogItem.name,
                        quantity: catalogItemQuantity,
                        price: selectedCatalogItem.price,
                        icon: selectedCatalogItem.icon,
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
                      if (changingItemId) {
                        // Replace the item the user chose to change
                        setServiceRequestItems(serviceRequestItems.map(i =>
                          i.id === changingItemId ? { ...i, ...itemData } : i
                        ));
                      } else {
                        // Add a brand-new item to the service request
                        setServiceRequestItems([...serviceRequestItems, { id: `item-${Date.now()}`, status: 'Requested', ...itemData }]);
                      }
                      setChangingItemId(null);
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
                    {changingItemId ? 'Change Item' : 'Add to Request'}
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
                    placeholder="Search requests..."
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
        penaltyAmount={getSlaPenaltyAmount(activeTicket?.id)}
      />

      <AddWorkLogModal
        isOpen={showWorkLogModal}
        onClose={() => { setShowWorkLogModal(false); setEditingWorkLog(null); }}
        onAdd={handleAddWorkLog}
        editingLog={editingWorkLog}
        onUpdate={handleUpdateWorkLog}
      />

      <WorkHistoryModal
        isOpen={showWorkHistory}
        onClose={() => setShowWorkHistory(false)}
        logs={workLogs}
        onDelete={handleDeleteWorkLog}
        onEdit={handleEditWorkLog}
      />
      <RequesterProfilePanel
        isOpen={showRequesterProfile}
        onClose={() => setShowRequesterProfile(false)}
        requesterName={activeTicket?.id === 'INC-35' ? 'Arnav Desai' : activeTicket?.requester}
        showVip
      />
      <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </div>
  );
}

export default TicketDrawer;
