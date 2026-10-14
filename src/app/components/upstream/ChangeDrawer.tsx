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
import { X, ChevronLeft, ChevronRight, Star, Share2, Eye, EyeOff, MoreHorizontal, MoreVertical, Paperclip, Clock, Search, Filter, ArrowUpDown, Reply, Forward, MessageSquare, StickyNote, ChevronDown, ChevronUp, CheckCircle, Mail, XCircle, Maximize2, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Image, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Video, User, FileText, Download, Trash2, Tag, Folder, Activity, Lightbulb, Pin as PinIcon, PinOff, Plus, Minus, Check, Play, Pause, Square, Link, Ticket as TicketIcon, Lock, Stethoscope, Edit, CheckSquare, Info, Calendar, ClipboardList, Settings2, PlusCircle } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { FileTypeBadge } from '../DescriptionAttachments';
import { EditorToolbarActions, EditorSendActions, RichComposerArea } from './EditorToolbar';
import { DateField } from '../DateField';
import { useState, useRef, useEffect } from 'react';
import { APPROVAL_TAB_IDS } from '../approvalTabs';
import { DrawerTabStrip } from './DrawerTabStrip';
import { SummaryStaleNotice } from '../SummaryStaleNotice';
import { alertKpiItems, getHeaderAlerts } from '../HeaderAlertPills';
import { MinimizedDrawerRail } from './MinimizedDrawerRail';
import { DescriptionInlineImage } from '../DescriptionInlineImage';
import { toast } from 'sonner';
import { changeImpactOf, changeScheduleOf, type Change } from '../ChangeListPage';
import { StatusBadge } from '../StatusBadge';
import { PriorityBadge } from '../PriorityBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CopyableEmails } from '../CopyableEmails';
import { HeaderCopyButton } from './HeaderCopyButton';
import { HeaderIdPill } from '../HeaderIdPill';
import { SystemFieldsRenderer } from './SystemFieldsRenderer';
import { TicketPropertiesPanel } from './TicketPropertiesPanel';
import { RequesterProfilePanel } from './RequesterProfilePanel';
import { HeaderKpiRow, type HeaderKpiItem } from './HeaderKpiRow';
import { DiagnosisCard } from './DiagnosisCard';
import { SolutionCard } from '../SolutionCard';
import { AISummary } from './AISummary';
import { SLAHistoryModal } from '../SLAHistoryModal';
import { getSlaPenaltyAmount, makeCrossModuleRelations } from '../TicketDrawerUtils';
const DEFAULT_REL = makeCrossModuleRelations([{type:'Request',prefix:'REQ'},{type:'Problem',prefix:'PRB'},{type:'Release',prefix:'REL'},{type:'Asset',prefix:'AST'}]);
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
import { ChangeActionsMenu } from './ChangeActionsMenu';
import { ChangeStagesShowcase } from '../ChangeStagesShowcase';
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

interface ChangeDrawerProps {
  openChanges: Change[];
  activeChangeId: string | null;
  onClose: () => void;
  onCloseTab: (changeId: string) => void;
  onTabChange: (problemId: string) => void;
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

/** Format a datetime-local value ("2026-06-09T23:10") as "09/06/2026 11:10 PM". */
function formatScheduleDate(v: string) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const pad = (n: number) => String(n).padStart(2, '0');
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

interface ScheduleDateFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

function ScheduleDateField({ label, value, onChange, required }: ScheduleDateFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-[12px] text-[#4A5568] mb-1.5">{label}{required && <span className="text-[#E5484D] ml-0.5">*</span>}</div>
      <DateField mode="datetime" value={value} onChange={onChange} placeholder="Select" />
    </div>
  );
}

interface DownTime {
  id: string;
  start: string;
  end: string;
  description: string;
}

interface CustomItem {
  id: string;
  name: string;
  start: string;
  end: string;
  description: string;
}

interface CustomGroup {
  id: string;
  name: string;
  items: CustomItem[];
  order: number;
}

/** Schedule entry surfaced to the Change Calendar (shape matches MiniCalendar's CalendarEvent). */
interface CalendarScheduleEntry {
  start: string;
  id: string;
  group: string;
  label?: string;
  description?: string;
  color?: string;
}

/** A user-defined custom group — editable group name and editable sub-entry names,
    each with start/end dates and a description (mirrors the Down Time group). */
function CustomGroupBlock({
  group,
  gridGap,
  onUpdateName,
  onRemoveGroup,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: {
  group: CustomGroup;
  gridGap: string;
  onUpdateName: (name: string) => void;
  onRemoveGroup: () => void;
  onAddItem: (data: { name: string; start: string; end: string; description: string }) => void;
  onUpdateItem: (itemId: string, patch: Partial<CustomItem>) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  const [draft, setDraft] = useState({ name: '', start: '', end: '', description: '' });
  const [showForm, setShowForm] = useState(group.items.length === 0);
  const addLabel = group.name.trim() ? group.name.trim() : 'Item';

  const suggestedName = `${addLabel} ${group.items.length + 1}`;

  const saveDraft = () => {
    if (!((draft.start && draft.end) || draft.description.trim())) return; // need both dates or a description
    onAddItem({ ...draft, name: draft.name.trim() || suggestedName });
    setDraft({ name: '', start: '', end: '', description: '' });
    setShowForm(false);
  };

  return (
    <div>
      {/* Group heading — editable name + remove-group */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Settings2 className="size-4 text-[#3D8BD0] flex-shrink-0" />
          <input
            value={group.name}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="Group name"
            className="flex-1 min-w-0 text-[14px] font-semibold text-[#364658] bg-transparent border-b border-transparent hover:border-[#DFE5ED] focus:border-[#3D8BD0] focus:outline-none placeholder:text-[#9CA3AF] placeholder:font-normal"
          />
        </div>
        <button onClick={onRemoveGroup} title="Remove group" className="flex-shrink-0 text-[#7B8FA5] hover:text-[#E5484D] hover:bg-[#F3F4F6] rounded p-1 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
      <p className="text-[12px] text-[#7B8FA5] mb-3">Define the custom schedule windows for this change.</p>

      {/* Saved sub-entries — editable name + dates; description shows as a card only when set */}
      {group.items.map((it, i) => (
        <div key={it.id} className={`${i > 0 ? 'border-t border-[#EEF1F5] pt-4' : ''} mb-4`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <input
              value={it.name}
              onChange={(e) => onUpdateItem(it.id, { name: e.target.value })}
              placeholder={`${addLabel} ${i + 1}`}
              className="flex-1 min-w-0 text-[13px] font-medium text-[#364658] bg-transparent border-b border-transparent hover:border-[#DFE5ED] focus:border-[#3D8BD0] focus:outline-none placeholder:text-[#9CA3AF] placeholder:font-normal"
            />
            <button onClick={() => onRemoveItem(it.id)} className="flex-shrink-0 text-[#7B8FA5] hover:text-[#E5484D] hover:bg-[#F3F4F6] rounded p-1 transition-colors" title="Remove">
              <XCircle size={15} />
            </button>
          </div>
          {(it.start || it.end) && (
            <div className={`grid grid-cols-2 ${gridGap}`}>
              <ScheduleDateField label="Start Date" value={it.start} onChange={(v) => onUpdateItem(it.id, { start: v })} />
              <ScheduleDateField label="End Date" value={it.end} onChange={(v) => onUpdateItem(it.id, { end: v })} />
            </div>
          )}
          {it.description && (
            <div className="mt-3">
              <AnalysisField
                label="Description"
                value={it.description}
                placeholder="No description added yet. Click the edit button to add details."
                onSave={(val) => onUpdateItem(it.id, { description: val })}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add-entry form (textarea description) OR the Add button */}
      {showForm ? (
        <div className={`${group.items.length > 0 ? 'border-t border-[#EEF1F5] pt-4' : ''} mb-4`}>
          <div className="mb-3">
            <div className="text-[12px] text-[#4A5568] mb-1.5">Subgroup Name</div>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder={suggestedName}
              className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0] bg-white placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className={`grid grid-cols-2 ${gridGap}`}>
            <ScheduleDateField label="Start Date" value={draft.start} onChange={(v) => setDraft((d) => ({ ...d, start: v }))} />
            <ScheduleDateField label="End Date" value={draft.end} onChange={(v) => setDraft((d) => ({ ...d, end: v }))} />
          </div>
          <div className="mt-3">
            <div className="text-[12px] text-[#4A5568] mb-1.5">Description</div>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Description..."
              className="w-full min-h-[72px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0] bg-white resize-y placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={saveDraft}
              disabled={!((draft.start && draft.end) || draft.description.trim())}
              className={`px-3 py-2 text-white text-[13px] font-medium rounded transition-colors flex items-center gap-1.5 ${((draft.start && draft.end) || draft.description.trim()) ? 'bg-[#3D8BD0] hover:bg-[#3578B5]' : 'bg-[#9DBEDC] cursor-not-allowed'}`}
            >
              <Plus className="size-3.5" />
              Add {addLabel}
            </button>
            <button
              onClick={() => {
                if (group.items.length === 0) {
                  onRemoveGroup(); // dismiss the empty group entirely
                } else {
                  setDraft({ name: '', start: '', end: '', description: '' });
                  setShowForm(false);
                }
              }}
              className="px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <button onClick={() => setShowForm(true)} className="text-[#3D8BD0] hover:text-[#2563EB] text-[13px] font-medium flex items-center gap-1.5 transition-colors">
            <PlusCircle className="size-4" />
            Add {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/** Down Times manager — add downtime windows under the Rollout Plan.
    Saved entries are edited inline; the "+" icon opens a form to add more. */
function DownTimesSection({ drawerWidth, onScheduleEntriesChange }: { drawerWidth: number; onScheduleEntriesChange?: (entries: CalendarScheduleEntry[]) => void }) {
  const [items, setItems] = useState<DownTime[]>([]);
  const [draft, setDraft] = useState({ start: '', end: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [downtimeOrder, setDowntimeOrder] = useState<number | null>(null);
  const idRef = useRef(1);
  const cgIdRef = useRef(1);
  const ciIdRef = useRef(1);
  const orderRef = useRef(1); // shared sequence so groups render in creation order
  const gridGap = drawerWidth > 1080 ? 'gap-6' : 'gap-3';

  const resetForm = () => setDraft({ start: '', end: '', description: '' });

  const save = () => {
    if (!((draft.start && draft.end) || draft.description.trim())) return; // need both dates or a description
    setItems((prev) => [...prev, { id: `dt-${idRef.current++}`, ...draft }]);
    resetForm();
    setShowForm(false);
  };

  const updateItem = (id: string, patch: Partial<DownTime>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const openDownTimeForm = () => {
    setShowForm(true);
    setDowntimeOrder((o) => (o === null ? orderRef.current++ : o));
  };
  const removeDownTimeGroup = () => { setItems([]); resetForm(); setShowForm(false); setDowntimeOrder(null); };
  const cancelDownTimeForm = () => { resetForm(); setShowForm(false); if (items.length === 0) setDowntimeOrder(null); };

  // Custom groups
  const addCustomGroup = () => setCustomGroups((prev) => [...prev, { id: `cg-${cgIdRef.current++}`, name: '', items: [], order: orderRef.current++ }]);
  const updateCustomGroup = (gid: string, patch: Partial<CustomGroup>) =>
    setCustomGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  const removeCustomGroup = (gid: string) => setCustomGroups((prev) => prev.filter((g) => g.id !== gid));
  const addCustomItem = (gid: string, data: { name: string; start: string; end: string; description: string }) =>
    setCustomGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, items: [...g.items, { id: `ci-${ciIdRef.current++}`, ...data }] } : g)));
  const updateCustomItem = (gid: string, iid: string, patch: Partial<CustomItem>) =>
    setCustomGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, items: g.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : g)));
  const removeCustomItem = (gid: string, iid: string) =>
    setCustomGroups((prev) => prev.map((g) => (g.id === gid ? { ...g, items: g.items.filter((it) => it.id !== iid) } : g)));

  // Surface Down Time + Custom group windows to the Change Calendar.
  // onScheduleEntriesChange must be stable (pass a useState setter) to avoid a render loop.
  useEffect(() => {
    if (!onScheduleEntriesChange) return;
    const entries: CalendarScheduleEntry[] = [];
    items.forEach((it) => {
      if (it.start) entries.push({ start: it.start, id: `${it.id}-s`, group: 'Down Time', label: 'Downtime start', description: it.description, color: '#E5484D' });
      if (it.end) entries.push({ start: it.end, id: `${it.id}-e`, group: 'Down Time', label: 'Downtime end', description: it.description, color: '#E5484D' });
    });
    customGroups.forEach((g) => {
      const groupName = g.name.trim() || 'Custom Schedule';
      g.items.forEach((it) => {
        const itemName = it.name.trim();
        if (it.start) entries.push({ start: it.start, id: `${it.id}-s`, group: groupName, label: itemName ? `${itemName} start` : 'Start', description: it.description, color: '#8B5CF6' });
        if (it.end) entries.push({ start: it.end, id: `${it.id}-e`, group: groupName, label: itemName ? `${itemName} end` : 'End', description: it.description, color: '#8B5CF6' });
      });
    });
    onScheduleEntriesChange(entries);
  }, [items, customGroups, onScheduleEntriesChange]);

  const formFields = (
    <>
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <ScheduleDateField label="Start Date" value={draft.start} onChange={(v) => setDraft((d) => ({ ...d, start: v }))} />
        <ScheduleDateField label="End Date" value={draft.end} onChange={(v) => setDraft((d) => ({ ...d, end: v }))} />
      </div>
      <div className="mt-3">
        <div className="text-[12px] text-[#4A5568] mb-1.5">Description</div>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Description..."
          className="w-full min-h-[72px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0] bg-white resize-y placeholder:text-[#9CA3AF]"
        />
      </div>
    </>
  );

  const downtimeForm = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-[#3D8BD0] flex-shrink-0" />
        <h3 className="text-[14px] font-semibold text-[#364658]">Down Time</h3>
      </div>
      {formFields}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={!((draft.start && draft.end) || draft.description.trim())}
          className={`px-3 py-2 text-white text-[13px] font-medium rounded transition-colors flex items-center gap-1.5 ${((draft.start && draft.end) || draft.description.trim()) ? 'bg-[#3D8BD0] hover:bg-[#3578B5]' : 'bg-[#9DBEDC] cursor-not-allowed'}`}
        >
          <Plus className="size-3.5" />
          Add Down Time
        </button>
        <button
          onClick={cancelDownTimeForm}
          className="px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  );

  const addDownTimeButton = (
    <button
      onClick={openDownTimeForm}
      className="text-[#3D8BD0] hover:text-[#2563EB] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
    >
      <PlusCircle className="size-4" />
      Add Down Time
    </button>
  );

  const customButton = (
    <button
      onClick={addCustomGroup}
      className="px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-1.5"
    >
      <Settings2 className="size-3.5" />
      Custom
    </button>
  );

  // The Down Time group exists once it has entries or while its form is open.
  const downtimeExists = items.length > 0 || showForm;

  const downtimeBlock = (
    <>
      {items.length > 0 && (
        <>
          {/* heading — remove icon clears the whole group */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#3D8BD0] flex-shrink-0" />
              <h3 className="text-[14px] font-semibold text-[#364658]">Down Time</h3>
            </div>
            <button
              onClick={removeDownTimeGroup}
              title="Remove all down time"
              className="flex-shrink-0 text-[#7B8FA5] hover:text-[#E5484D] hover:bg-[#F3F4F6] rounded p-1 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-[12px] text-[#7B8FA5] mb-3">Define the downtime windows expected during this change.</p>

          {/* Saved entries — directly editable; no edit icon needed */}
          {items.map((it, i) => (
            <div key={it.id} className={`${i > 0 ? 'border-t border-[#EEF1F5] pt-4' : ''} mb-4`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[13px] font-medium text-[#364658]">Down Time {i + 1}</span>
                <button onClick={() => removeItem(it.id)} className="text-[#7B8FA5] hover:text-[#E5484D] hover:bg-[#F3F4F6] rounded p-1 transition-colors" title="Remove">
                  <XCircle size={15} />
                </button>
              </div>
              {(it.start || it.end) && (
                <div className={`grid grid-cols-2 ${gridGap}`}>
                  <ScheduleDateField label="Start Date" value={it.start} onChange={(v) => updateItem(it.id, { start: v })} />
                  <ScheduleDateField label="End Date" value={it.end} onChange={(v) => updateItem(it.id, { end: v })} />
                </div>
              )}
              {it.description && (
                <div className="mt-3">
                  <AnalysisField
                    label="Description"
                    value={it.description}
                    placeholder="No description added yet. Click the edit button to add details."
                    onSave={(val) => updateItem(it.id, { description: val })}
                  />
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Add Down Time — form when open, button otherwise */}
      {showForm ? (
        <div className={items.length > 0 ? 'border-t border-[#EEF1F5] pt-4 mb-4' : 'mb-4'}>{downtimeForm}</div>
      ) : items.length > 0 ? (
        <div className="mb-4">{addDownTimeButton}</div>
      ) : null}
    </>
  );

  // Render all groups (Down Time + custom) in creation order.
  const orderedBlocks: { key: string; order: number; node: React.ReactNode }[] = [];
  if (downtimeExists) {
    orderedBlocks.push({ key: 'downtime', order: downtimeOrder ?? 0, node: downtimeBlock });
  }
  customGroups.forEach((g) => {
    orderedBlocks.push({
      key: g.id,
      order: g.order,
      node: (
        <CustomGroupBlock
          group={g}
          gridGap={gridGap}
          onUpdateName={(name) => updateCustomGroup(g.id, { name })}
          onRemoveGroup={() => removeCustomGroup(g.id)}
          onAddItem={(data) => addCustomItem(g.id, data)}
          onUpdateItem={(iid, patch) => updateCustomItem(g.id, iid, patch)}
          onRemoveItem={(iid) => removeCustomItem(g.id, iid)}
        />
      ),
    });
  });
  orderedBlocks.sort((a, b) => a.order - b.order);

  return (
    <div className="mt-4">
      {/* Groups in creation order, separated by a divider */}
      {orderedBlocks.map((b, idx) => (
        <div key={b.key} className={idx > 0 ? 'border-t border-[#DFE5ED] mt-8 pt-8' : ''}>
          {b.node}
        </div>
      ))}

      {/* ===== BOTTOM CONTROLS — Down Time (first) + Custom buttons ===== */}
      {!showForm && (
        <div className={orderedBlocks.length > 0 ? 'border-t border-[#DFE5ED] mt-8 pt-8' : ''}>
          <div className="flex items-center gap-3">
            {items.length === 0 && (
              <button
                onClick={openDownTimeForm}
                className="px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-1.5"
              >
                <Clock className="size-3.5" />
                Down Time
              </button>
            )}
            {customButton}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChangeDrawer({
  openChanges,
  activeChangeId,
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
}: ChangeDrawerProps) {
  const activeChange = openChanges.find(c => c.id === activeChangeId);
  const [minimizedLocal, setMinimizedLocal] = useState(false);
  const [showRequesterProfile, setShowRequesterProfile] = useState(false);
  const minimized = stackMinimized ?? minimizedLocal;
  const setMinimized = onStackMinimizedChange ?? setMinimizedLocal;
  useEffect(() => { setMinimized(false); }, [activeChange?.id]);
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
  const [activeMainTabLocal, setActiveMainTab] = useState<'conversation' | 'tasks' | 'approvals' | 'relations' | 'audit' | 'resolution' | 'service-request'>(approvalMode ? 'approvals' : 'conversation');
  /* In approval mode only the three approver tabs render, so a module default of
     Overview / Properties would land on a tab that is not on screen. */
  const activeMainTab = approvalMode && !APPROVAL_TAB_IDS.includes(activeMainTabLocal) ? 'approvals' : activeMainTabLocal;
  const [analysis, setAnalysis] = useState({
    /* Seeded per change (changeImpactOf, shared with the listing calendar); editable here. */
    impact: activeChange ? changeImpactOf(activeChange) : '',
    rolloutPlan: '',
    backoutPlan: '',
  });
  // Planning tab — Change Schedule (all stages) + Rollout Plan (Implementation, In Review, Closed)
  /* Seeded from this change's own planned window (changeScheduleOf — shared with the
     listing calendar) and re-seeded whenever the drawer swaps to another change. */
  const toScheduleInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const [changeScheduleStart, setChangeScheduleStart] = useState(() =>
    activeChange ? toScheduleInput(changeScheduleOf(activeChange).start) : '2026-06-09T23:10',
  );
  const [changeScheduleEnd, setChangeScheduleEnd] = useState(() =>
    activeChange ? toScheduleInput(changeScheduleOf(activeChange).end) : '2026-07-01T12:11',
  );
  useEffect(() => {
    if (!activeChange) return;
    const win = changeScheduleOf(activeChange);
    setChangeScheduleStart(toScheduleInput(win.start));
    setChangeScheduleEnd(toScheduleInput(win.end));
    setAnalysis((a) => ({ ...a, impact: changeImpactOf(activeChange) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChange?.id]);
  const [plannedRolloutStart, setPlannedRolloutStart] = useState('');
  const [plannedRolloutEnd, setPlannedRolloutEnd] = useState('');
  const [actualRolloutStart, setActualRolloutStart] = useState('');
  const [actualRolloutEnd, setActualRolloutEnd] = useState('');
  // Down Time + Custom group schedule windows, surfaced up from the Rollout Plan for the Change Calendar.
  const [extraScheduleEntries, setExtraScheduleEntries] = useState<CalendarScheduleEntry[]>([]);
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
    if (ticketId === 'CHG-993') return 0; // Blank ticket has no approvals
    if (ticketId === 'CHG-976') return 1; // INC-35 has 1 approval (filtered)
    return 2; // Other tickets have 2 approvals
  };
  const approvalsCount = getApprovalsCount(activeChange?.id);
  
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
  const hasConversationsForTicket = sentConversations.some(c => c.ticketId === activeChangeId);
  const isBlankTicket = (activeChange?.id === 'CHG-993' || activeChange?.id === 'CHG-976') && !hasConversationsForTicket;
  
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

  // The Status dropdown is scoped to the CURRENT lifecycle stage: it shows the stage
  // name as a header and only that stage's sub-status options. Selecting one sets
  // "<Stage>: <Sub>", which keeps the stage bar in sync.
  const changeStageStatus = (() => {
    const stages = [
      { label: 'Submitted',      opts: [['Requested', '#3D8BD0'], ['Accepted', '#22A06B'], ['Rejected', '#E5484D']] },
      { label: 'Planning',       opts: [['In Progress', '#F59E0B'], ['Pre Approved', '#9CA3AF'], ['Cancelled', '#E5484D'], ['Completed', '#22A06B']] },
      { label: 'Approval',       opts: [['Pending', '#F59E0B'], ['Approved', '#22A06B'], ['Rejected', '#E5484D']] },
      { label: 'Implementation', opts: [['In Progress', '#F97316'], ['Build', '#8B5CF6'], ['Deployment', '#F59E0B'], ['Rejected', '#E5484D'], ['Completed', '#22A06B']] },
      { label: 'In Review',      opts: [['In Progress', '#F59E0B'], ['Testing', '#22A06B'], ['Failed', '#E5484D'], ['Passed', '#22A06B']] },
      { label: 'Closed',         opts: [['Closed', '#6B7280'], ['Cancelled', '#E5484D']] },
    ];
    const s = (selectedStatus || '').toLowerCase();
    let idx = stages.findIndex((st) => s.startsWith(st.label.toLowerCase()));
    if (idx === -1) {
      if (s.startsWith('deployment') || s.startsWith('build')) idx = 3;
      else if (s.startsWith('testing') || s.startsWith('review')) idx = 4;
      else if (s.startsWith('completed')) idx = 5;
      else idx = 1; // default to Planning
    }
    const stage = stages[idx];
    return {
      label: stage.label,
      options: stage.opts.map(([sub, color]) => ({ label: `${stage.label}: ${sub}`, display: sub, color })),
    };
  })();

  // Apply a status choice from the header dropdown (shared by click + Enter-key selection).
  const applyHeaderStatus = (option: { label: string }) => {
    setSelectedStatus(option.label);
    setShowHeaderStatusDropdown(false);
  };
  useEffect(() => {
    if (showHeaderStatusDropdown) {
      const i = changeStageStatus.options.findIndex((o) => o.label === selectedStatus);
      setStatusHighlight(i < 0 ? 0 : i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeaderStatusDropdown]);
  useEffect(() => {
    if (!showHeaderStatusDropdown) return;
    const opts = changeStageStatus.options;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setStatusHighlight((h) => (h + 1) % opts.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setStatusHighlight((h) => (h - 1 + opts.length) % opts.length); }
      else if (e.key === 'Enter') { e.preventDefault(); applyHeaderStatus(opts[statusHighlight]); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowHeaderStatusDropdown(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeaderStatusDropdown, statusHighlight]);

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
  const affectedItems = makeAffectedItems(activeChange?.id, [{ type: 'Asset', prefix: 'AST', count: 4 }, { type: 'CI', prefix: 'CI', count: 3 }]);
  
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
  const getGroupTitleWrapper = () => activeGroup === 'properties' ? 'Properties' : getGroupTitle(activeGroup);
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
    if (!activeChange) return;
    
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
      [activeChange.id]: [...(prev[activeChange.id] || []), ...newRelations]
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
    if (!hasSeenOnboarding && activeChangeId) {
      setActiveGroupLocal('properties'); // local-only default (never clobbers persisted group)
      /* first-visit tour is TICKET-page-only — other detail pages never auto-open it */
    }
  }, [activeChangeId]);

  // Reset to properties when ticket changes (only after onboarding is complete)
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (hasSeenOnboarding && activeChangeId) {
      setActiveGroupLocal('properties');
    }
  }, [activeChangeId]);

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
      const baseTabsForOthers = ['resolution', 'conversation', 'tasks', 'audit'];
      const baseTabsForINC35 = ['service-request', 'resolution', 'conversation', 'tasks', 'audit'];
      
      // Build tabs list dynamically based on conditions
      let allTabs: string[] = [];
      
      if (activeChange?.id === 'CHG-976') {
        allTabs = [...baseTabsForINC35];
      } else {
        allTabs = [...baseTabsForOthers];
      }
      
      // Add Approvals tab if not INC-32
      if (activeChange?.id !== 'CHG-993') {
        // Insert approvals after tasks
        const tasksIndex = allTabs.indexOf('tasks');
        allTabs.splice(tasksIndex + 1, 0, 'approvals');
      }
      
      // Add Relations tab based on condition: show if NOT INC-32, OR if INC-32 has relations
      const shouldShowRelations = activeChange?.id !== 'CHG-993' || 
                                  (activeChange?.id && ticketRelations[activeChange.id]?.length > 0);
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
  }, [activeChange?.id, drawerWidth, ticketRelations]);

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
    if (activeChange?.id === 'CHG-976') {
      setActiveMainTab('service-request');
    } else if (activeChange?.id === 'CHG-969') {
      // CHG-969 is a completed/closed change, open to Resolution tab with pre-filled data
      setActiveMainTab('resolution');
      setAnalysis({
        impact: "Customer-facing web application availability was at risk and the application was exposed to emerging threats until the WAF rule set was tuned and re-enabled in blocking mode.",
        rolloutPlan: "Refine the false-positive WAF rules, update signatures to the latest OWASP CRS, and re-enable blocking mode in a monitored window. Validate that legitimate traffic passes cleanly and known attack patterns are blocked.",
        backoutPlan: "If legitimate traffic is blocked or errors spike after cutover, revert the WAF rules to the previous detection-only configuration from the saved snapshot and re-open analysis."
      });
    } else if (activeChange) {
      setActiveMainTab('resolution');
    }
  }, [activeChange?.id]);

  // Update ticket fields when active ticket changes
  useEffect(() => {
    if (activeChange) {
      // Update status to match the actual ticket status
      setSelectedStatus(activeChange.status);
      // Update priority to match the actual ticket priority
      setSelectedPriority(activeChange.priority);
    }
  }, [activeChange?.id, activeChange?.status, activeChange?.priority]);

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
      ticketId: activeChangeId, // Associate with the current active ticket
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
      ticketId: activeChangeId,
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
      ticketId: activeChangeId,
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
    if (openChanges.length > 0 && !hasDrawerBeenInitialized) {
      setDrawerWidth(stackWidth ?? window.innerWidth - 54);
      setIsAccordionCollapsed(false);
      setAccordionWidth(390); // Reset accordion width to default
      setHasDrawerBeenInitialized(true);
    } else if (openChanges.length === 0) {
      // Reset initialization flag when all tickets are closed
      setHasDrawerBeenInitialized(false);
    }
  }, [openChanges.length, hasDrawerBeenInitialized]);


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

  // Change-specific content for AI summary and description
  const getChangeContent = (id: string | undefined) => {
    const map: Record<string, { summary: string; keyPoints: string[]; desc: string; descExtra: string }> = {
      'CHG-993': {
        summary: 'A change request to update firewall rules for the production DMZ has been submitted. The change adds inbound rules for a new partner integration endpoint and tightens outbound restrictions on legacy ports. Categorized as P1 due to production network impact.',
        keyPoints: ['Adds inbound rules for new partner integration endpoint', 'Tightens outbound restrictions on deprecated legacy ports', 'P1 priority — requires CAB review before production deployment'],
        desc: 'This change updates the firewall rule set on the production DMZ firewalls to support a new B2B partner integration while removing outdated outbound allowances on legacy ports.',
        descExtra: 'The change introduces three new inbound ACL entries scoped to the partner source IP range on port 443 only, and removes five obsolete outbound rules identified during the last security audit. A rollback plan reverting to the current rule set snapshot is documented. Implementation is scheduled within the approved maintenance window with the network and security teams on standby.'
      },
      'CHG-992': {
        summary: 'A change request to apply the latest OS security patches to the database server cluster is pending approval. The patches address several critical CVEs. A brief failover-protected restart is required for each node.',
        keyPoints: ['Applies latest OS security patches addressing multiple critical CVEs', 'Rolling node-by-node restart protected by cluster failover', 'Awaiting CAB approval — scheduled for the weekend maintenance window'],
        desc: 'This change applies the latest operating system security patches to all nodes in the production database cluster to remediate several critical vulnerabilities flagged in the most recent vulnerability scan.',
        descExtra: 'Patching will be performed node-by-node using the cluster failover mechanism to maintain availability, with each node drained, patched, restarted, and validated before proceeding to the next. The full database backup completed prior to the window serves as the rollback safeguard. Estimated total duration is 3 hours with no expected user-facing downtime.'
      },
      'CHG-991': {
        summary: 'A change request to migrate the email service to a new high-availability cluster is pending approval. The migration improves redundancy and increases mailbox storage capacity. Mail flow will be cut over during a low-traffic window.',
        keyPoints: ['Migrates email service to new high-availability cluster', 'Increases per-mailbox storage capacity and adds redundancy', 'Cutover scheduled during overnight low-traffic window'],
        desc: 'This change migrates the corporate email service from the existing single-node server to a new two-node high-availability cluster, improving resilience and expanding mailbox storage limits.',
        descExtra: 'Mailbox data will be pre-synced to the new cluster ahead of the window, with a final delta sync and DNS/MX cutover performed during the overnight maintenance period. Users may experience a brief 5–10 minute interruption in mail delivery during cutover. The legacy server will be kept on standby for 72 hours to enable rapid rollback if required.'
      },
      'CHG-990': {
        summary: 'A change request to renew the SSL certificate for the customer-facing web portal is pending approval. The current certificate expires in 14 days. The renewal includes upgrading to a SHA-256 wildcard certificate.',
        keyPoints: ['Renews SSL certificate expiring in 14 days', 'Upgrades to SHA-256 wildcard certificate covering all subdomains', 'Zero-downtime hot reload of certificate on load balancers'],
        desc: 'This change renews and upgrades the SSL/TLS certificate for the customer-facing web portal ahead of its expiry, moving to a wildcard certificate that covers all current and future subdomains.',
        descExtra: 'The new certificate will be installed on the load balancers and application servers, then hot-reloaded without restarting services, ensuring zero downtime. Certificate chain validation and SSL Labs verification will be performed immediately after deployment. The previous certificate remains installed but inactive for 48 hours as a fallback.'
      },
      'CHG-989': {
        summary: 'A change to update the core firewall policy governing branch office VPN traffic is in the planning stage. The change refines site-to-site rules to support two newly opened branch locations and consolidates redundant rules.',
        keyPoints: ['Adds site-to-site VPN rules for two new branch locations', 'Consolidates and removes redundant overlapping rule entries', 'Currently in planning — risk assessment and rollback plan underway'],
        desc: 'This change updates the core firewall policy to extend site-to-site VPN connectivity to two newly established branch offices and to clean up redundant rules accumulated over time.',
        descExtra: 'The planning phase includes a full audit of the existing rule base to identify overlapping and shadowed rules for consolidation. New rules for the branch subnets will be added following least-privilege principles. A staged rollback plan and a configuration snapshot will be prepared before implementation. The change will proceed to CAB approval once the risk assessment is finalized.'
      },
      'CHG-988': {
        summary: 'A change request to upgrade firmware on the core network switches is pending approval. The firmware addresses a known stability bug and adds support for enhanced QoS policies. A maintenance window with brief redundant-path failover is required.',
        keyPoints: ['Upgrades core switch firmware to address known stability bug', 'Enables enhanced QoS policy support for voice and video traffic', 'Redundant path failover keeps network available during upgrade'],
        desc: 'This change upgrades the firmware on the core distribution switches to a vendor-recommended release that resolves a stability defect and introduces improved QoS capabilities.',
        descExtra: 'Switches will be upgraded one at a time, relying on redundant network paths and spanning-tree reconvergence to maintain connectivity throughout. Each switch will be validated for correct operation before the next is started. The previous firmware image is retained on each device, allowing a fast rollback by reverting the boot image if issues arise.'
      },
      'CHG-987': {
        summary: 'A standard change to extend the Active Directory schema is pending approval. The extension adds custom attributes required by a new HR application. As a forest-wide schema change, it carries P1 priority and requires careful coordination.',
        keyPoints: ['Extends AD schema with custom attributes for new HR application', 'Forest-wide change — irreversible, requires full schema backup', 'P1 standard change with mandatory CAB and AD team sign-off'],
        desc: 'This standard change extends the Active Directory schema to add custom attributes needed by a newly deployed HR application for storing employee metadata directly in directory objects.',
        descExtra: 'Schema extensions are forest-wide and effectively irreversible, so a full system-state backup of the schema master and a verified domain controller backup are mandatory prerequisites. The extension will be applied during a low-activity window and replication across all domain controllers will be monitored to completion. The AD team and application owner will jointly validate the new attributes before sign-off.'
      },
      'CHG-986': {
        summary: 'A change request to update the integration between the HR onboarding system and downstream provisioning services has been submitted. The update fixes a data-mapping issue and adds automated account creation for new hires.',
        keyPoints: ['Fixes data-mapping issue between HR system and provisioning service', 'Adds automated account creation workflow for new hires', 'Submitted and awaiting initial review and approval'],
        desc: 'This change updates the integration layer connecting the HR onboarding system to identity and account provisioning services, resolving a field-mapping defect and introducing automated account creation.',
        descExtra: 'The current integration occasionally maps department and role fields incorrectly, requiring manual correction. This change corrects the mapping logic and adds a workflow that automatically creates email and application accounts when a new hire record is finalized in the HR system. The change will be tested in the staging environment against sample records before production rollout.'
      },
      'CHG-985': {
        summary: 'A change to reconfigure the API gateway load balancer is in the pre-approval planning stage. The reconfiguration introduces weighted routing and improved health checks to better distribute traffic across backend services.',
        keyPoints: ['Introduces weighted routing across API backend service pools', 'Improves health-check sensitivity to remove unhealthy nodes faster', 'In pre-approval planning — design review in progress'],
        desc: 'This change reconfigures the load balancer fronting the API gateway to use weighted round-robin routing and more responsive health checks, improving traffic distribution and fault tolerance.',
        descExtra: 'The current configuration uses simple round-robin with slow health checks, occasionally routing traffic to degraded nodes. The new design assigns weights based on backend capacity and reduces health-check intervals and failure thresholds. The configuration will be validated in staging under load before scheduling. The change is currently undergoing design review prior to formal approval.'
      },
      'CHG-984': {
        summary: 'A change request to expand the storage SAN capacity has been submitted. Additional disk shelves will be added to accommodate growing data volumes. The expansion is non-disruptive and performed online.',
        keyPoints: ['Adds new disk shelves to expand SAN storage capacity', 'Online, non-disruptive expansion with no service downtime', 'Submitted and awaiting approval and procurement confirmation'],
        desc: 'This change adds additional disk shelves to the production storage SAN to address capacity growth, expanding the available storage pool for database and file services.',
        descExtra: 'The new shelves will be physically installed and brought online without interrupting existing I/O, then incorporated into the existing storage pools. Capacity will be allocated to the volumes approaching their thresholds. The operation is fully online and non-disruptive, though a low-activity window is preferred to minimize any performance impact during the initial rebalancing.'
      },
      'CHG-983': {
        summary: 'A change request to update the backup retention policy is pending approval. The new policy extends retention for compliance-relevant data and reduces retention for transient logs, optimizing storage utilization.',
        keyPoints: ['Extends retention for compliance-relevant backup sets', 'Reduces retention for transient log and temp data backups', 'Awaiting approval — projected 20% backup storage reduction'],
        desc: 'This change updates the enterprise backup retention policy to align with updated compliance requirements while optimizing storage consumption by trimming retention of non-critical data.',
        descExtra: 'Compliance-relevant datasets will move from a 1-year to a 7-year retention schedule, while transient logs and temporary data will be reduced from 90 to 30 days. The net effect is improved compliance posture alongside an estimated 20% reduction in total backup storage. The policy changes will be applied to the backup software configuration and validated against a sample restore test.'
      },
      'CHG-982': {
        summary: 'A change request to update the VPN gateway configuration has been submitted. The change enforces stronger encryption ciphers and adds multi-factor authentication enforcement for all remote connections.',
        keyPoints: ['Enforces stronger encryption ciphers (drops legacy protocols)', 'Mandates multi-factor authentication for all VPN connections', 'Submitted — requires user communication ahead of rollout'],
        desc: 'This change hardens the VPN gateway configuration by disabling legacy encryption protocols, enforcing modern ciphers, and requiring multi-factor authentication for all remote access sessions.',
        descExtra: 'Legacy protocols such as IKEv1 and weak cipher suites will be disabled in favor of IKEv2 with AES-256. MFA enforcement will be enabled for all user accounts. Because this affects every remote worker, advance communication and an updated connection guide will be distributed before the change. A pilot group will validate connectivity before the organization-wide rollout.'
      },
      'CHG-981': {
        summary: 'A change request to consolidate the DNS server infrastructure has been submitted. Multiple aging DNS servers will be consolidated onto a new resilient pair, simplifying management and improving resolution performance.',
        keyPoints: ['Consolidates multiple aging DNS servers onto a resilient pair', 'Improves resolution performance and simplifies management', 'Submitted — zone transfer validation required before cutover'],
        desc: 'This change consolidates several legacy DNS servers onto a new highly available DNS server pair, reducing operational overhead and improving query response times.',
        descExtra: 'All existing forward and reverse lookup zones will be transferred to the new servers and validated for completeness before any cutover. DHCP and client DNS settings will be updated to point to the new servers in a phased manner. The legacy servers will remain operational as secondaries for two weeks to ensure a smooth transition and provide rollback capability.'
      },
      'CHG-980': {
        summary: 'A change request to migrate to a new endpoint antivirus platform has been submitted. The new platform provides improved threat detection and centralized management across all managed devices.',
        keyPoints: ['Migrates all endpoints to new antivirus/EDR platform', 'Provides improved threat detection and centralized management', 'Submitted — phased rollout by department planned'],
        desc: 'This change migrates the organization from the current antivirus solution to a new endpoint detection and response (EDR) platform offering superior threat detection and unified management.',
        descExtra: 'The migration will be phased by department to limit risk, with the new agent deployed and validated on a pilot group before broader rollout. The legacy agent will be removed only after the new agent confirms healthy check-in to avoid any protection gap. Detection policies will be tuned during the pilot to minimize false positives before organization-wide deployment.'
      },
      'CHG-979': {
        summary: 'A change request to provision a batch of new laptops for incoming hires has been submitted. The laptops will be imaged with the standard corporate build and enrolled in device management ahead of the onboarding date.',
        keyPoints: ['Images batch of new laptops with standard corporate build', 'Enrolls devices in MDM and applies security baselines', 'Submitted — to be completed before new-hire start date'],
        desc: 'This change covers the provisioning of a batch of new laptops for upcoming new hires, including imaging, software installation, and enrollment in mobile device management.',
        descExtra: 'Each laptop will be imaged with the approved corporate build, enrolled in the MDM platform, and configured with the standard security baseline and role-appropriate software. Devices will be labeled and staged for distribution ahead of the new-hire start date. Asset records will be created and assigned in the CMDB as part of the process.'
      },
      'CHG-978': {
        summary: 'A change request to decommission the legacy CRM application was submitted but has been REJECTED. The CAB determined that data migration and user transition planning are incomplete, and the change must be resubmitted with a full cutover plan.',
        keyPoints: ['Proposed decommission of legacy CRM application', 'REJECTED by CAB — data migration plan incomplete', 'Must be resubmitted with full data migration and cutover plan'],
        desc: 'This change proposed the decommissioning of the legacy CRM application following the rollout of its replacement. The change was reviewed by the CAB and rejected pending additional planning.',
        descExtra: 'The CAB rejected the change because the historical data migration strategy and the user transition timeline were not sufficiently detailed, creating a risk of data loss and business disruption. The change owner has been asked to resubmit with a verified data export and migration plan, a defined read-only grace period, and confirmation that all dependent reports have been migrated to the new system.'
      },
      'CHG-977': {
        summary: 'A change request to update Office 365 tenant security policies has been submitted. The update strengthens conditional access rules, enforces device compliance, and tightens external sharing controls.',
        keyPoints: ['Strengthens conditional access and device compliance policies', 'Tightens external sharing and guest access controls', 'Submitted — pilot validation recommended before full enforcement'],
        desc: 'This change updates the Microsoft 365 tenant security configuration to strengthen conditional access policies, enforce device compliance for access, and restrict external file sharing.',
        descExtra: 'New conditional access rules will require compliant, managed devices for access to sensitive resources, and external sharing will be limited to approved domains with expiring links. Because overly aggressive policies could block legitimate access, the changes will first be applied to a pilot group in report-only mode, then enforced broadly once validated. A rollback is achieved by reverting the policy set to its current saved state.'
      },
      'CHG-976': {
        summary: 'A change request to deploy version 2.3 of the payment processing module to production is pending approval. The release includes a critical concurrency fix and performance improvements. A blue-green deployment minimizes risk.',
        keyPoints: ['Deploys payment module v2.3 with critical concurrency fix', 'Blue-green deployment enables instant rollback', 'Awaiting approval — deployment scheduled in low-traffic window'],
        desc: 'This change deploys version 2.3 of the payment processing module to production, delivering a critical fix for a concurrency defect along with performance and stability improvements.',
        descExtra: 'The deployment uses a blue-green strategy: the new version is deployed alongside the current version, smoke-tested against production, then traffic is switched over atomically. If any issue is detected, traffic is instantly reverted to the previous version. The change is scheduled during a low-traffic window with the development and operations teams monitoring transaction success rates closely after cutover.'
      },
      'CHG-975': {
        summary: 'A change request to rebuild fragmented database indexes has been submitted. The rebuild addresses query performance degradation observed over recent weeks. The operation runs online with minimal locking.',
        keyPoints: ['Rebuilds heavily fragmented indexes on primary tables', 'Online rebuild minimizes locking and user impact', 'Submitted — expected to restore query performance significantly'],
        desc: 'This change performs an online rebuild of fragmented indexes on the most heavily queried database tables to restore query performance that has degraded over recent weeks.',
        descExtra: 'Index fragmentation analysis identified several indexes exceeding 80% fragmentation. The rebuild will be performed using online index operations to avoid blocking active queries, scheduled during lower-activity hours to further reduce impact. Statistics will be updated following the rebuild. A maintenance plan adjustment will also be proposed to prevent recurrence of the fragmentation.'
      },
      'CHG-974': {
        summary: 'A change request to roll out a new infrastructure monitoring agent has been submitted. The agent provides deeper metrics and faster alerting across servers and network devices.',
        keyPoints: ['Deploys new monitoring agent for deeper metrics and alerting', 'Lightweight agent with negligible host resource impact', 'Submitted — phased deployment across server estate planned'],
        desc: 'This change deploys a new monitoring agent across the server and network estate to provide more granular performance metrics, improved alerting, and better capacity-planning data.',
        descExtra: 'The new agent is lightweight and designed for minimal resource consumption. Deployment will be phased, starting with non-critical systems to validate stability and alert tuning before extending to production-critical infrastructure. Existing monitoring will run in parallel until the new platform is fully validated, after which the legacy agents will be retired.'
      },
      'CHG-973': {
        summary: 'A standard change to perform a disaster recovery failover test is in the implementation stage. The test validates the DR site readiness by failing over critical services and confirming functionality before failing back.',
        keyPoints: ['Validates DR site readiness via controlled service failover', 'Confirms RTO/RPO targets are met for critical services', 'Currently being implemented during the approved DR test window'],
        desc: 'This standard change executes a planned disaster recovery failover test, switching critical services to the DR site to validate recovery procedures, then failing back to primary.',
        descExtra: 'The test follows the documented DR runbook: critical services are failed over to the secondary site, functionality and data integrity are validated, and recovery time and recovery point objectives are measured against targets. After validation, services are failed back to the primary site. Results and any gaps identified will be documented for the DR plan update. The test is currently in progress within the approved window.'
      },
      'CHG-972': {
        summary: 'A normal change to deploy additional wireless access points on Floor 3 is in the planning stage. The deployment addresses coverage gaps and capacity constraints reported by users on that floor.',
        keyPoints: ['Deploys additional wireless access points to Floor 3', 'Addresses reported coverage dead zones and capacity issues', 'In planning — site survey completed, cabling work scheduled'],
        desc: 'This normal change adds new wireless access points on Floor 3 to eliminate coverage dead zones and improve capacity for the increased number of devices and users on that floor.',
        descExtra: 'A wireless site survey has been completed, identifying optimal placement for the new access points. The implementation requires running additional network cabling and configuring the new APs on the wireless controller with the existing SSIDs and security policies. Work will be scheduled outside business hours to avoid disruption. Post-deployment signal testing will confirm coverage improvements.'
      },
      'CHG-971': {
        summary: 'An emergency change to replace a failing core router in the primary datacenter is pending urgent approval. The router is showing hardware faults that threaten network stability. Categorized P1 with high risk due to its critical role.',
        keyPoints: ['Replaces core router showing imminent hardware failure', 'P1 emergency change — high risk to datacenter connectivity', 'Redundant router carries traffic during replacement'],
        desc: 'This emergency change replaces a core router in the primary datacenter that is exhibiting hardware faults and error escalation, posing an imminent risk to network stability.',
        descExtra: 'The failing router shows increasing hardware error counters and memory faults in diagnostics. Its redundant pair will carry full traffic during the replacement, but the temporary loss of redundancy makes this a high-risk window. The replacement unit will be pre-staged with the validated configuration, swapped in, and verified before redundancy is restored. Given the urgency and risk, expedited CAB approval is required and a senior network engineer will perform the work with vendor support on standby.'
      },
      'CHG-970': {
        summary: 'A normal change for a server room cooling maintenance window is in the pre-approval planning stage. The maintenance services the CRAC units to prevent thermal issues during the upcoming summer peak.',
        keyPoints: ['Scheduled servicing of server room CRAC cooling units', 'Preventive maintenance ahead of summer thermal peak', 'In pre-approval — temporary portable cooling to be staged'],
        desc: 'This normal change covers preventive maintenance on the server room computer room air conditioning (CRAC) units to ensure reliable cooling ahead of the summer peak season.',
        descExtra: 'The maintenance includes coolant checks, filter replacement, and calibration of the CRAC units. To maintain safe temperatures while units are serviced one at a time, portable spot-cooling will be staged in the server room and temperature sensors will be monitored continuously. The work is scheduled during a low-load period, and a contingency plan to gracefully shut down non-critical equipment exists should temperatures approach thresholds.'
      },
      'CHG-969': {
        summary: 'A standard change to tune the web application firewall (WAF) rule set has been completed and closed. The tuning reduced false positives while strengthening protection against common attack patterns.',
        keyPoints: ['Tuned WAF rules to reduce false positives on legitimate traffic', 'Strengthened protections against OWASP Top 10 attack patterns', 'Completed and closed — monitoring confirmed stable operation'],
        desc: 'This completed standard change tuned the web application firewall rule set to reduce false positives that were blocking legitimate traffic while improving coverage against common web attacks.',
        descExtra: 'Analysis of WAF logs identified several overly broad rules generating false positives against legitimate application requests. These were refined, and additional rules aligned to the OWASP Top 10 were enabled in blocking mode after a monitoring period. Post-implementation monitoring over 48 hours confirmed a significant drop in false positives with no legitimate traffic blocked, and the change was closed successfully.'
      },
    };
    return map[id ?? ''] ?? {
      summary: 'This change request has been logged and is progressing through the change management workflow. The assigned team is reviewing scope, risk, and implementation requirements.',
      keyPoints: ['Change request logged in the change management system', 'Scope, risk, and rollback plan under review', 'Updates will be provided as the change progresses through approval'],
      desc: 'This change request has been logged and is currently progressing through the change management workflow. The assigned team is reviewing the scope, risk, and implementation plan.',
      descExtra: 'Further details, the implementation schedule, and the rollback plan will be provided as the change advances through the approval and planning stages. If you have additional requirements or constraints relevant to this change, please add them as a reply to this change record.'
    };
  };

  // Change-specific conversation thread + approval titles, keyed by change ID
  const getChangeThread = (id: string | undefined) => {
    const map: Record<string, {
      mention: string; team: string; to: [string, string];
      escalateShort: string; escalateFull: string; origFrom: string; origMsg: string;
      reply: string; file1: string; file2: string; note: string; today: string;
      approval1: string; approval2: string;
    }> = {
      'CHG-993': {
        mention: "@Arnav Desai - Can you review this firewall change for the production DMZ before CAB? It adds inbound rules for a new partner endpoint and tightens legacy outbound ports. P1 due to production impact.",
        team: "network security team", to: ['netsec@motadata.com', 'cab@motadata.com'],
        escalateShort: "Submitting this firewall rule change to the network security team and CAB for review. It adds three scoped inbound ACLs for the partner integration on port 443 and removes five obsolete outbound rules...",
        escalateFull: "Submitting this firewall rule change to the network security team and CAB for review. It adds three scoped inbound ACLs for the partner integration on port 443 and removes five obsolete outbound rules identified in the last security audit. A rollback plan reverting to the current rule-set snapshot is documented, and the network and security teams will be on standby during the approved maintenance window.",
        origFrom: "Sophie Laurent", origMsg: "Hi team, we need the production DMZ firewall updated to allow our new B2B partner's integration endpoint and to close off the legacy outbound ports flagged in the audit. Please raise this as a change.",
        reply: "I've completed the rule review and risk assessment. The attached change plan and rollback document detail the exact ACL entries being added and removed. Tested the rule logic in the lab with no unintended exposure.",
        file1: "firewall-rule-change-plan.pdf", file2: "dmz-rollback-plan.pdf",
        note: "Implementation scheduled for the approved maintenance window. A current rule-set snapshot has been captured for rollback and both network and security teams are on standby.",
        today: "Change pending CAB approval. All pre-implementation checks complete, rollback snapshot verified, and the partner source IP range confirmed with the integration owner.",
        approval1: "CAB Approval: Production DMZ Firewall Rule Change", approval2: "Security Sign-off: DMZ ACL Update",
      },
      'CHG-992': {
        mention: "@Arnav Desai - Please review this OS patching change for the database cluster. It covers several critical CVEs with a rolling node-by-node restart protected by failover.",
        team: "database and infrastructure team", to: ['dba.team@motadata.com', 'infra.ops@motadata.com'],
        escalateShort: "Submitting the database cluster OS patching change for approval. Patches address multiple critical CVEs and will be applied node-by-node using cluster failover to maintain availability...",
        escalateFull: "Submitting the database cluster OS patching change for approval. Patches address multiple critical CVEs and will be applied node-by-node using cluster failover to maintain availability. Each node will be drained, patched, restarted and validated before proceeding. A full database backup taken before the window serves as the rollback safeguard; estimated duration is 3 hours with no expected user-facing downtime.",
        origFrom: "Security Team", origMsg: "Hi team, the latest vulnerability scan flagged several critical CVEs on the database cluster OS. We need these patched in the next maintenance window. Please raise a change.",
        reply: "Patch set validated in staging with no regressions. The attached patch plan and node-by-node runbook cover the failover sequence, and the pre-window backup plan is documented for rollback.",
        file1: "os-patch-plan.pdf", file2: "cluster-failover-runbook.pdf",
        note: "Patching scheduled for the weekend maintenance window. Full cluster backup will be taken immediately before starting; failover order confirmed with the DBA team.",
        today: "Awaiting CAB approval. Staging validation passed, backup job verified, and the maintenance window confirmed with stakeholders.",
        approval1: "CAB Approval: Database Cluster OS Patching", approval2: "Implementation Sign-off: Critical CVE Remediation",
      },
      'CHG-991': {
        mention: "@Arnav Desai - Can you review the email migration change to the new HA cluster? Mailbox data pre-syncs ahead of time, with a short cutover during the overnight window.",
        team: "messaging and infrastructure team", to: ['messaging@motadata.com', 'infra.ops@motadata.com'],
        escalateShort: "Submitting the email service migration to the new high-availability cluster for approval. Mailboxes pre-sync ahead of the window with a final delta sync and MX cutover overnight...",
        escalateFull: "Submitting the email service migration to the new high-availability cluster for approval. Mailboxes pre-sync ahead of the window with a final delta sync and MX cutover overnight. Users may see a brief 5–10 minute mail-delivery pause during cutover. The legacy server stays on standby for 72 hours to enable rapid rollback if required.",
        origFrom: "Sakshi Joshi", origMsg: "Hi team, we're hitting mailbox storage limits and need better redundancy. Please raise a change to migrate email to the new high-availability cluster.",
        reply: "Pre-sync tested successfully and the cutover steps are documented. The attached migration plan and rollback procedure cover the delta sync, MX change and the 72-hour standby fallback.",
        file1: "email-migration-plan.pdf", file2: "mail-cutover-rollback.pdf",
        note: "Cutover scheduled for the overnight low-traffic window. Mailbox pre-sync running now; final delta sync and MX cutover will run during the window with the legacy server kept on standby.",
        today: "Awaiting approval. Pre-sync is healthy, DNS TTL lowered ahead of cutover, and the rollback path to the legacy server is verified.",
        approval1: "CAB Approval: Email Service HA Migration", approval2: "Implementation Sign-off: Mail Cutover",
      },
      'CHG-990': {
        mention: "@Arnav Desai - Please review the SSL renewal change for the customer portal. The current cert expires in 14 days; this upgrades to a SHA-256 wildcard with a zero-downtime hot reload.",
        team: "security and PKI team", to: ['security.team@motadata.com', 'pki.admin@motadata.com'],
        escalateShort: "Submitting the SSL certificate renewal change for the customer portal. It upgrades to a SHA-256 wildcard covering all subdomains and hot-reloads on the load balancers with zero downtime...",
        escalateFull: "Submitting the SSL certificate renewal change for the customer portal. It upgrades to a SHA-256 wildcard covering all subdomains and hot-reloads on the load balancers with zero downtime. Chain validation and an SSL Labs check follow deployment, and the previous certificate stays installed but inactive for 48 hours as a fallback.",
        origFrom: "Ashish Dhamelia", origMsg: "Hi team, the customer portal certificate expires in two weeks. Please raise a change to renew it — and if possible move us to a wildcard so we stop doing this per-subdomain.",
        reply: "New wildcard certificate issued and staged. The attached deployment plan and validation checklist cover the hot reload and post-install SSL Labs verification; the old cert remains as a 48-hour fallback.",
        file1: "ssl-renewal-plan.pdf", file2: "cert-validation-checklist.pdf",
        note: "Hot reload scheduled with zero expected downtime. New wildcard cert staged on the load balancers; previous cert retained inactive for 48 hours as fallback.",
        today: "Awaiting approval. Certificate issued and validated, deployment steps rehearsed, and monitoring set to confirm chain validity post-reload.",
        approval1: "CAB Approval: Customer Portal SSL Renewal", approval2: "Security Sign-off: Wildcard Certificate Upgrade",
      },
      'CHG-989': {
        mention: "@Arnav Desai - Can you help finalise the planning for the core firewall policy change? It adds site-to-site VPN rules for two new branches and consolidates redundant rules.",
        team: "network security team", to: ['netsec@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Sharing the core firewall policy change for planning review. It extends site-to-site VPN to two new branches and consolidates overlapping rules following least-privilege principles...",
        escalateFull: "Sharing the core firewall policy change for planning review. It extends site-to-site VPN to two new branches and consolidates overlapping rules following least-privilege principles. A full rule-base audit is underway to identify shadowed rules, and a staged rollback plan with a config snapshot will be prepared before it goes to CAB.",
        origFrom: "Ashini Sharma", origMsg: "Hi team, two new branch offices are coming online and need site-to-site VPN connectivity. While we're at it, can we clean up the redundant firewall rules? Please raise a change.",
        reply: "Completed the rule-base audit and mapped the new branch subnets. The attached audit findings and draft rule set show which entries are consolidated and the new least-privilege rules for the branches.",
        file1: "firewall-rulebase-audit.pdf", file2: "branch-vpn-rule-design.pdf",
        note: "Still in planning — risk assessment and rollback plan being finalised. Config snapshot will be captured before implementation; targeting the next CAB cycle.",
        today: "In planning. Rule-base audit complete and branch subnets confirmed; risk assessment in progress before submitting for approval.",
        approval1: "CAB Approval: Core Firewall Policy Update", approval2: "Security Sign-off: Branch VPN Rule Consolidation",
      },
      'CHG-988': {
        mention: "@Arnav Desai - Please review the core switch firmware upgrade change. It fixes a known stability bug and adds QoS support, with redundant-path failover keeping the network up.",
        team: "network infrastructure team", to: ['network.team@motadata.com', 'datacenter.ops@motadata.com'],
        escalateShort: "Submitting the core switch firmware upgrade change. It resolves a known stability defect and enables enhanced QoS, upgrading switches one at a time over redundant paths...",
        escalateFull: "Submitting the core switch firmware upgrade change. It resolves a known stability defect and enables enhanced QoS, upgrading switches one at a time over redundant paths. Each switch is validated before the next is started, and the previous firmware image is retained on each device for a fast boot-image rollback if needed.",
        origFrom: "Vasu Hirpara", origMsg: "Hi team, the vendor has a firmware release that fixes the switch stability bug we've been hitting and adds the QoS features we need for voice/video. Please raise an upgrade change.",
        reply: "Firmware validated on the lab switch and the upgrade sequence documented. The attached upgrade plan and rollback procedure cover the per-switch order and boot-image revert path.",
        file1: "switch-firmware-upgrade-plan.pdf", file2: "firmware-rollback-procedure.pdf",
        note: "Upgrade scheduled for the maintenance window. Switches upgraded one at a time relying on redundant paths; prior firmware image retained on each device for rollback.",
        today: "Awaiting approval. Lab validation passed, redundant-path failover confirmed, and the maintenance window agreed with stakeholders.",
        approval1: "CAB Approval: Core Switch Firmware Upgrade", approval2: "Implementation Sign-off: Network Firmware Update",
      },
      'CHG-987': {
        mention: "@Arnav Desai - This AD schema extension needs careful review before CAB. It's forest-wide and irreversible — adds custom attributes for the new HR app. P1.",
        team: "directory services team", to: ['ad.team@motadata.com', 'cab@motadata.com'],
        escalateShort: "Submitting the Active Directory schema extension for approval. It adds custom attributes for the new HR application — a forest-wide, effectively irreversible change requiring a full schema backup...",
        escalateFull: "Submitting the Active Directory schema extension for approval. It adds custom attributes for the new HR application — a forest-wide, effectively irreversible change requiring a full schema backup. A system-state backup of the schema master and verified DC backups are mandatory prerequisites; replication across all DCs will be monitored to completion and the AD team and app owner will jointly validate the attributes.",
        origFrom: "Pavan Mehta", origMsg: "Hi team, the new HR application needs custom attributes stored in AD. Please raise a schema extension change — I know this is forest-wide so flag it for full CAB review.",
        reply: "Schema extension LDIF reviewed and tested in the isolated lab forest. The attached implementation plan and backup/verification checklist cover the mandatory schema-master backup and replication monitoring.",
        file1: "ad-schema-extension-plan.pdf", file2: "schema-backup-checklist.pdf",
        note: "Scheduled for a low-activity window. Full schema-master system-state backup and verified DC backups are prerequisites; replication will be monitored to completion before sign-off.",
        today: "Awaiting CAB approval. Lab-forest test successful, backup prerequisites staged, and the AD team and HR app owner aligned on validation steps.",
        approval1: "CAB Approval: Active Directory Schema Extension", approval2: "AD Team Sign-off: HR Attribute Rollout",
      },
      'CHG-986': {
        mention: "@Arnav Desai - Can you review the HR onboarding integration change? It fixes the department/role data-mapping defect and adds automated account creation for new hires.",
        team: "integration and identity team", to: ['integration.team@motadata.com', 'iam.team@motadata.com'],
        escalateShort: "Submitting the HR onboarding integration change for review. It corrects the field-mapping defect and adds a workflow to auto-create email and app accounts when a new hire is finalised...",
        escalateFull: "Submitting the HR onboarding integration change for review. It corrects the field-mapping defect and adds a workflow to auto-create email and app accounts when a new hire is finalised in the HR system. The change will be tested in staging against sample records before production rollout.",
        origFrom: "Agasp Latayada", origMsg: "Hi team, the HR onboarding integration keeps mapping department and role fields wrong, and we're creating accounts manually. Please raise a change to fix the mapping and automate account creation.",
        reply: "Corrected mapping logic and built the auto-provisioning workflow. The attached design doc and staging test results show correct field mapping and successful account creation against sample new-hire records.",
        file1: "integration-fix-design.pdf", file2: "staging-test-results.pdf",
        note: "Staging validation complete against sample records. Production rollout scheduled after sign-off, with the manual process kept as a fallback for the first onboarding cycle.",
        today: "Submitted and awaiting review. Staging tests passed with correct mappings and automated account creation; rollback is reverting to the previous integration build.",
        approval1: "CAB Approval: HR Onboarding Integration Update", approval2: "Sign-off: Automated Account Provisioning",
      },
      'CHG-985': {
        mention: "@Arnav Desai - Please look over the API gateway load balancer redesign. It moves to weighted routing with faster health checks to stop traffic hitting degraded nodes.",
        team: "platform engineering team", to: ['platform.eng@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Sharing the API gateway load balancer reconfiguration for design review. It introduces weighted routing by backend capacity and more responsive health checks to evict unhealthy nodes faster...",
        escalateFull: "Sharing the API gateway load balancer reconfiguration for design review. It introduces weighted routing by backend capacity and more responsive health checks to evict unhealthy nodes faster. The config will be load-tested in staging before scheduling; it's currently in design review prior to formal approval.",
        origFrom: "Platform Team", origMsg: "Hi team, the API gateway occasionally routes traffic to degraded backends because the health checks are too slow. Please raise a change to move to weighted routing with tighter health checks.",
        reply: "Drafted the weighted routing config and tuned the health-check thresholds. The attached design and staging load-test results show even distribution and fast eviction of unhealthy nodes.",
        file1: "loadbalancer-redesign.pdf", file2: "staging-loadtest-results.pdf",
        note: "Still in pre-approval planning. Design review in progress; once approved, the config will be validated under load in staging before a scheduled rollout.",
        today: "In design review. Staging load tests look good — weighted routing balances correctly and unhealthy nodes are removed within seconds. Preparing for approval submission.",
        approval1: "CAB Approval: API Gateway Load Balancer Reconfiguration", approval2: "Sign-off: Weighted Routing Rollout",
      },
      'CHG-984': {
        mention: "@Arnav Desai - Can you review the SAN capacity expansion change? New disk shelves added online, non-disruptive, to relieve volumes nearing their thresholds.",
        team: "storage team", to: ['storage.team@motadata.com', 'datacenter.ops@motadata.com'],
        escalateShort: "Submitting the SAN capacity expansion change. New disk shelves will be installed and brought online without interrupting I/O, then added to the pools nearing capacity...",
        escalateFull: "Submitting the SAN capacity expansion change. New disk shelves will be installed and brought online without interrupting I/O, then added to the pools nearing capacity. The operation is fully online and non-disruptive, though a low-activity window is preferred to minimise any performance impact during the initial rebalancing.",
        origFrom: "Storage Team", origMsg: "Hi team, several SAN volumes are approaching their capacity thresholds. We've procured additional disk shelves — please raise a change to install and bring them online.",
        reply: "Shelves received and the install/rebalance steps documented. The attached expansion plan and capacity report show the target pools and the online, non-disruptive procedure.",
        file1: "san-expansion-plan.pdf", file2: "storage-capacity-report.pdf",
        note: "Install scheduled during a low-activity window. Procedure is online and non-disruptive; rebalancing will be monitored for any performance impact.",
        today: "Submitted and awaiting approval and procurement confirmation. Install runbook ready and the target volumes identified for the new capacity.",
        approval1: "CAB Approval: SAN Capacity Expansion", approval2: "Sign-off: Storage Shelf Installation",
      },
      'CHG-983': {
        mention: "@Arnav Desai - Please review the backup retention policy change. It extends retention for compliance data to 7 years and trims transient logs to 30 days — about a 20% storage saving.",
        team: "backup and compliance team", to: ['backup.admin@motadata.com', 'compliance@motadata.com'],
        escalateShort: "Submitting the backup retention policy change. Compliance-relevant datasets move from 1-year to 7-year retention while transient logs drop from 90 to 30 days, for an estimated 20% storage reduction...",
        escalateFull: "Submitting the backup retention policy change. Compliance-relevant datasets move from 1-year to 7-year retention while transient logs drop from 90 to 30 days, for an estimated 20% storage reduction. The policy will be applied in the backup software and validated with a sample restore test.",
        origFrom: "Compliance Team", origMsg: "Hi team, updated compliance requirements mean we need 7-year retention on certain datasets. We can offset the cost by trimming transient log retention. Please raise a change.",
        reply: "Mapped each dataset to its new retention tier. The attached policy matrix and sample restore test confirm the compliance sets are retained correctly and restores work from the new schedule.",
        file1: "retention-policy-matrix.pdf", file2: "sample-restore-test.pdf",
        note: "Awaiting approval. Policy changes staged in the backup configuration; a sample restore test has validated recoverability before applying broadly.",
        today: "Awaiting approval. Retention matrix reviewed with compliance, restore test passed, and projected storage reduction confirmed at ~20%.",
        approval1: "CAB Approval: Backup Retention Policy Update", approval2: "Compliance Sign-off: Retention Schedule Change",
      },
      'CHG-982': {
        mention: "@Arnav Desai - Can you review the VPN hardening change? It drops legacy ciphers, enforces IKEv2/AES-256 and mandates MFA for all remote connections. Needs user comms first.",
        team: "network security team", to: ['netsec@motadata.com', 'vpn.admin@motadata.com'],
        escalateShort: "Submitting the VPN gateway hardening change. It disables legacy protocols, enforces IKEv2 with AES-256 and requires MFA for all remote access — a pilot group validates connectivity before org-wide rollout...",
        escalateFull: "Submitting the VPN gateway hardening change. It disables legacy protocols, enforces IKEv2 with AES-256 and requires MFA for all remote access. Because it affects every remote worker, advance communication and an updated connection guide will go out first, and a pilot group will validate connectivity before the organization-wide rollout.",
        origFrom: "Security Team", origMsg: "Hi team, our VPN still allows legacy ciphers and doesn't enforce MFA. Please raise a hardening change — but make sure remote users are warned before we cut over.",
        reply: "Hardened config drafted and tested with the pilot group. The attached config change and user comms plan cover the cipher changes, MFA enforcement and the connection guide for end users.",
        file1: "vpn-hardening-config.pdf", file2: "user-comms-plan.pdf",
        note: "User communication and updated connection guide scheduled to go out ahead of rollout. Pilot group validated; org-wide enforcement follows once comms have landed.",
        today: "Submitted and awaiting approval. Pilot connectivity confirmed under the new ciphers and MFA; comms drafted and ready to distribute before enforcement.",
        approval1: "CAB Approval: VPN Gateway Hardening", approval2: "Security Sign-off: MFA Enforcement Rollout",
      },
      'CHG-981': {
        mention: "@Arnav Desai - Please review the DNS consolidation change. Several aging DNS servers move onto a new resilient pair; zones transfer and validate before any cutover.",
        team: "DNS and network team", to: ['dns.team@motadata.com', 'network.ops@motadata.com'],
        escalateShort: "Submitting the DNS consolidation change. Legacy DNS servers consolidate onto a new HA pair, with all forward and reverse zones transferred and validated before cutover...",
        escalateFull: "Submitting the DNS consolidation change. Legacy DNS servers consolidate onto a new HA pair, with all forward and reverse zones transferred and validated for completeness before any cutover. Client and DHCP settings update in phases, and the legacy servers stay as secondaries for two weeks for a smooth transition and rollback.",
        origFrom: "Network Team", origMsg: "Hi team, our DNS servers are aging and hard to manage. Please raise a change to consolidate them onto a new highly available pair.",
        reply: "Built the new DNS pair and transferred all zones. The attached migration plan and zone validation report confirm every forward and reverse zone matches the source before cutover.",
        file1: "dns-consolidation-plan.pdf", file2: "zone-transfer-validation.pdf",
        note: "Phased cutover planned with client/DHCP settings updated gradually. Legacy servers remain as secondaries for two weeks to ensure a smooth transition and rollback path.",
        today: "Submitted and awaiting approval. Zone transfers validated complete, new pair healthy, and the phased cutover sequence agreed.",
        approval1: "CAB Approval: DNS Infrastructure Consolidation", approval2: "Sign-off: DNS Server Cutover",
      },
      'CHG-980': {
        mention: "@Arnav Desai - Can you review the endpoint AV/EDR platform migration? Phased by department, new agent validated before the old one is removed to avoid any protection gap.",
        team: "endpoint security team", to: ['endpoint.security@motadata.com', 'desktop.support@motadata.com'],
        escalateShort: "Submitting the endpoint AV/EDR migration change. Rollout is phased by department; the new agent is deployed and validated on a pilot before the legacy agent is removed to avoid any protection gap...",
        escalateFull: "Submitting the endpoint AV/EDR migration change. Rollout is phased by department; the new agent is deployed and validated on a pilot before the legacy agent is removed to avoid any protection gap. Detection policies are tuned during the pilot to minimise false positives before organization-wide deployment.",
        origFrom: "Security Team", origMsg: "Hi team, we're moving to a new EDR platform with better detection and central management. Please raise a migration change — and make sure devices are never left unprotected during the swap.",
        reply: "Pilot deployment complete with policies tuned. The attached migration plan and pilot results show healthy check-in on the new agent before legacy removal, with false positives tuned down.",
        file1: "edr-migration-plan.pdf", file2: "pilot-deployment-results.pdf",
        note: "Phased department rollout scheduled. New agent confirmed checking in before legacy agent removal on each device; detection policies tuned from the pilot.",
        today: "Submitted and awaiting approval. Pilot ring stable on the new EDR, policies tuned, and the department rollout order agreed.",
        approval1: "CAB Approval: Endpoint EDR Platform Migration", approval2: "Security Sign-off: Antivirus Agent Rollout",
      },
      'CHG-979': {
        mention: "@Arnav Desai - Please review the new-hire laptop provisioning change. Batch imaged with the corporate build, enrolled in MDM, and staged before the start date.",
        team: "endpoint provisioning team", to: ['desktop.support@motadata.com', 'asset.management@motadata.com'],
        escalateShort: "Submitting the new-hire laptop provisioning change. The batch will be imaged with the corporate build, enrolled in MDM with the security baseline, and staged for distribution before the start date...",
        escalateFull: "Submitting the new-hire laptop provisioning change. The batch will be imaged with the corporate build, enrolled in MDM with the security baseline, and staged for distribution before the start date. Asset records will be created and assigned in the CMDB as part of the process.",
        origFrom: "HR Operations", origMsg: "Hi team, we have a group of new hires starting soon who'll each need a laptop ready on day one. Please raise a change to provision the batch.",
        reply: "Imaging and enrollment steps confirmed against the standard build. The attached provisioning checklist and asset list cover the MDM enrollment, security baseline and CMDB records.",
        file1: "laptop-provisioning-checklist.pdf", file2: "new-hire-asset-list.pdf",
        note: "Provisioning to be completed before the new-hire start date. Devices imaged, enrolled in MDM and labeled; CMDB asset records created and assigned.",
        today: "Submitted and awaiting approval. Standard build and MDM enrollment validated on the first unit; remaining batch queued for imaging.",
        approval1: "CAB Approval: New-Hire Laptop Provisioning", approval2: "Sign-off: Device Imaging & MDM Enrollment",
      },
      'CHG-978': {
        mention: "@Arnav Desai - This legacy CRM decommission was REJECTED by CAB — the data migration and user transition plan weren't complete. Can you help rebuild the cutover plan for resubmission?",
        team: "applications team", to: ['apps.team@motadata.com', 'cab@motadata.com'],
        escalateShort: "Following up on the rejected legacy CRM decommission. CAB flagged that the historical data migration strategy and user transition timeline weren't detailed enough, creating data-loss and disruption risk...",
        escalateFull: "Following up on the rejected legacy CRM decommission. CAB flagged that the historical data migration strategy and user transition timeline weren't detailed enough, creating data-loss and disruption risk. We need to resubmit with a verified data export and migration plan, a defined read-only grace period, and confirmation that all dependent reports have moved to the new system.",
        origFrom: "CAB Secretary", origMsg: "Hi team, the CAB has rejected the legacy CRM decommission change. The data migration plan and user transition timeline are incomplete. Please resubmit with a full cutover plan.",
        reply: "Reworking the cutover plan per CAB feedback. The attached revised migration plan and dependency report add the verified data export, a read-only grace period and confirmation that dependent reports are migrated.",
        file1: "revised-crm-migration-plan.pdf", file2: "report-dependency-report.pdf",
        note: "Change rejected by CAB and being reworked. Verified data export and migration plan in progress; resubmission will include the read-only grace period and report migration sign-off.",
        today: "Rejected by CAB — under revision. Data export validated and the dependency report complete; finalising the read-only grace period before resubmitting.",
        approval1: "CAB Re-review: Legacy CRM Decommission (Resubmission)", approval2: "Data Owner Sign-off: CRM Migration Plan",
      },
      'CHG-977': {
        mention: "@Arnav Desai - Please review the Microsoft 365 security policy change. It tightens conditional access, enforces device compliance and limits external sharing — pilot in report-only first.",
        team: "cloud security team", to: ['cloud.security@motadata.com', 'm365.admin@motadata.com'],
        escalateShort: "Submitting the M365 tenant security policy change. It strengthens conditional access, enforces device compliance and restricts external sharing — applied to a pilot in report-only mode before broad enforcement...",
        escalateFull: "Submitting the M365 tenant security policy change. It strengthens conditional access, enforces device compliance and restricts external sharing — applied to a pilot in report-only mode first, then enforced broadly once validated. Rollback is reverting the policy set to its current saved state.",
        origFrom: "Security Team", origMsg: "Hi team, our M365 conditional access and external sharing controls are too loose. Please raise a change to tighten them — but pilot it first so we don't lock anyone out.",
        reply: "Policies drafted and run against the pilot in report-only mode. The attached policy design and report-only impact analysis show what would be blocked, with no legitimate access affected.",
        file1: "m365-policy-design.pdf", file2: "report-only-impact-analysis.pdf",
        note: "Pilot running in report-only mode. Broad enforcement scheduled after validation; rollback is reverting the tenant policy set to its saved state.",
        today: "Submitted and awaiting approval. Report-only analysis shows no impact to legitimate access; ready to move the pilot to enforced once approved.",
        approval1: "CAB Approval: Microsoft 365 Security Policy Update", approval2: "Security Sign-off: Conditional Access Enforcement",
      },
      'CHG-976': {
        mention: "@Arnav Desai - Please review the payment module v2.3 production deployment. It includes the critical concurrency fix; using blue-green so we can roll back instantly.",
        team: "platform engineering team", to: ['platform.eng@motadata.com', 'payments.dev@motadata.com'],
        escalateShort: "Submitting the payment module v2.3 production deployment. It delivers the critical concurrency fix and performance improvements via a blue-green deployment with instant rollback...",
        escalateFull: "Submitting the payment module v2.3 production deployment. It delivers the critical concurrency fix and performance improvements via a blue-green deployment: the new version runs alongside the current one, is smoke-tested against production, then traffic switches atomically — and reverts instantly if any issue is detected. Scheduled in a low-traffic window with transaction success rates monitored after cutover.",
        origFrom: "Payments Dev Team", origMsg: "Hi team, v2.3 of the payment module fixes the concurrency defect that caused the production incident. Please raise a deployment change — we'd like blue-green so rollback is instant.",
        reply: "Build verified and smoke tests written against production endpoints. The attached deployment plan and blue-green runbook cover the atomic traffic switch and the instant revert path.",
        file1: "payment-v2.3-deployment-plan.pdf", file2: "blue-green-runbook.pdf",
        note: "Deployment scheduled in a low-traffic window. Green environment will be smoke-tested before the atomic switch; instant rollback to blue is ready if transaction success dips.",
        today: "Awaiting approval. Green environment staged and smoke-tested, monitoring dashboards prepared, and the rollback path validated.",
        approval1: "CAB Approval: Payment Module v2.3 Deployment", approval2: "Release Sign-off: Blue-Green Cutover",
      },
      'CHG-975': {
        mention: "@Arnav Desai - Please review the database index rebuild change. Heavy fragmentation on primary tables is degrading queries; online rebuild minimises locking.",
        team: "database administration team", to: ['dba.team@motadata.com', 'app.support@motadata.com'],
        escalateShort: "Submitting the database index rebuild change. Several indexes exceed 80% fragmentation; the online rebuild avoids blocking active queries and runs during lower-activity hours...",
        escalateFull: "Submitting the database index rebuild change. Several indexes exceed 80% fragmentation; the online rebuild avoids blocking active queries and runs during lower-activity hours. Statistics will be updated afterward, and a maintenance-plan adjustment is proposed to prevent recurrence.",
        origFrom: "DBA Team", origMsg: "Hi team, query performance has degraded over recent weeks and index fragmentation is high on the main tables. Please raise a change to rebuild the indexes online.",
        reply: "Fragmentation analysis complete and the rebuild tested in staging. The attached fragmentation report and rebuild plan show the affected indexes and the online, low-lock procedure.",
        file1: "index-fragmentation-report.pdf", file2: "index-rebuild-plan.pdf",
        note: "Online rebuild scheduled for lower-activity hours to minimise impact. Statistics update included; a maintenance-plan change is proposed to stop recurrence.",
        today: "Submitted and awaiting approval. Staging rebuild restored query performance to baseline with minimal locking; ready to schedule.",
        approval1: "CAB Approval: Database Index Rebuild", approval2: "Sign-off: Online Index Maintenance",
      },
      'CHG-974': {
        mention: "@Arnav Desai - Can you review the new monitoring agent rollout? Lightweight agent for deeper metrics and faster alerting, phased across the estate with old monitoring in parallel.",
        team: "infrastructure monitoring team", to: ['monitoring.team@motadata.com', 'infra.ops@motadata.com'],
        escalateShort: "Submitting the new monitoring agent rollout. The lightweight agent provides deeper metrics and faster alerting, deployed in phases starting with non-critical systems...",
        escalateFull: "Submitting the new monitoring agent rollout. The lightweight agent provides deeper metrics and faster alerting, deployed in phases starting with non-critical systems to validate stability and alert tuning before production-critical infrastructure. Existing monitoring runs in parallel until fully validated, then legacy agents are retired.",
        origFrom: "Operations Team", origMsg: "Hi team, our current monitoring is missing detail and alerts late. Please raise a change to roll out the new monitoring agent across servers and network devices.",
        reply: "Agent validated on the non-critical ring with negligible resource impact. The attached rollout plan and pilot metrics show the deeper telemetry and tuned alerts running alongside legacy monitoring.",
        file1: "monitoring-agent-rollout-plan.pdf", file2: "pilot-metrics-report.pdf",
        note: "Phased deployment underway from non-critical systems. Existing monitoring kept in parallel until the new platform is fully validated, then legacy agents retired.",
        today: "Submitted and awaiting approval. Non-critical ring stable on the new agent with alerts tuned; ready to extend to production-critical systems.",
        approval1: "CAB Approval: Monitoring Agent Rollout", approval2: "Sign-off: Telemetry Platform Deployment",
      },
      'CHG-973': {
        mention: "@Arnav Desai - The DR failover test is in progress. We're failing critical services to the DR site, validating, and measuring RTO/RPO before failing back. Can you track the results?",
        team: "disaster recovery team", to: ['dr.team@motadata.com', 'infra.ops@motadata.com'],
        escalateShort: "DR failover test underway per the runbook. Critical services are failing over to the DR site for functional and data-integrity validation, with RTO/RPO measured against targets...",
        escalateFull: "DR failover test underway per the runbook. Critical services are failing over to the DR site for functional and data-integrity validation, with RTO/RPO measured against targets, then failed back to primary. Results and any gaps will be documented for the DR plan update.",
        origFrom: "DR Coordinator", origMsg: "Hi team, it's time for our scheduled DR failover test. Please raise the change so we can validate the DR site and confirm we're hitting our recovery objectives.",
        reply: "Failover executed and services validated at the DR site. The attached test runbook and results capture the measured RTO/RPO against targets and the few gaps found for follow-up.",
        file1: "dr-test-runbook.pdf", file2: "dr-test-results.pdf",
        note: "Test in progress within the approved window. Critical services validated at DR; failback to primary to follow, with results documented for the DR plan update.",
        today: "Implementation in progress. Failover successful and RTO/RPO within targets; preparing the controlled failback and writing up the gap findings.",
        approval1: "CAB Approval: DR Failover Test", approval2: "DR Sign-off: Failback & Validation",
      },
      'CHG-972': {
        mention: "@Arnav Desai - Please help finalise the Floor 3 wireless AP deployment plan. Site survey's done; we need cabling and controller config to fix the dead zones and capacity issues.",
        team: "network infrastructure team", to: ['network.team@motadata.com', 'facilities@motadata.com'],
        escalateShort: "Sharing the Floor 3 wireless AP deployment for planning. The site survey identified optimal placements; implementation needs additional cabling and controller config with the existing SSIDs and security...",
        escalateFull: "Sharing the Floor 3 wireless AP deployment for planning. The site survey identified optimal placements; implementation needs additional cabling and the new APs configured on the controller with the existing SSIDs and security policies. Work is scheduled outside business hours, with post-deployment signal testing to confirm coverage.",
        origFrom: "Floor 3 Users", origMsg: "Hi team, the WiFi on Floor 3 has dead zones and struggles when the floor is busy. Please raise a change to add more access points.",
        reply: "Site survey complete and placements finalised. The attached survey report and deployment plan show AP locations, cabling runs and the controller configuration for the new units.",
        file1: "wireless-site-survey.pdf", file2: "ap-deployment-plan.pdf",
        note: "In planning — cabling work scheduled outside business hours. APs will be configured on the controller with existing SSIDs; post-deployment signal testing will confirm coverage.",
        today: "In planning. Site survey done and placements confirmed; cabling and after-hours install window being scheduled before submission to CAB.",
        approval1: "CAB Approval: Floor 3 Wireless AP Deployment", approval2: "Sign-off: Wireless Coverage Expansion",
      },
      'CHG-971': {
        mention: "@Arnav Desai - URGENT: the core router is showing hardware faults and needs emergency replacement. Redundant pair carries traffic but we lose redundancy during the swap. P1.",
        team: "network infrastructure team", to: ['network.team@motadata.com', 'cab.emergency@motadata.com'],
        escalateShort: "Raising this as an emergency change. The core router shows rising hardware error counters and memory faults; its redundant pair will carry traffic during replacement but the temporary loss of redundancy makes this high-risk...",
        escalateFull: "Raising this as an emergency change. The core router shows rising hardware error counters and memory faults; its redundant pair will carry traffic during replacement but the temporary loss of redundancy makes this a high-risk window. The replacement is pre-staged with the validated config, swapped in and verified before redundancy is restored. Expedited CAB approval is required, with a senior network engineer performing the work and vendor support on standby.",
        origFrom: "NOC", origMsg: "Team, the primary core router is throwing hardware errors and memory faults — it looks close to failing. We need an emergency change to replace it before it takes down datacenter connectivity.",
        reply: "Replacement unit pre-staged with the validated config. The attached diagnostics and replacement runbook show the fault evidence and the swap/verify steps to restore redundancy quickly.",
        file1: "router-fault-diagnostics.pdf", file2: "emergency-replacement-runbook.pdf",
        note: "Emergency change — expedited approval requested. Redundant router carrying traffic; replacement pre-staged and a senior engineer assigned with vendor support on standby.",
        today: "Pending urgent CAB approval. Replacement staged and verified in the lab; change window minimised to limit time without redundancy.",
        approval1: "Emergency CAB Approval: Core Router Replacement", approval2: "Sign-off: Datacenter Connectivity Restoration",
      },
      'CHG-970': {
        mention: "@Arnav Desai - Please help finalise the server room cooling maintenance plan. CRAC units serviced ahead of the summer peak, with portable spot-cooling staged during the work.",
        team: "facilities and datacenter team", to: ['facilities@motadata.com', 'datacenter.ops@motadata.com'],
        escalateShort: "Sharing the server room CRAC maintenance for pre-approval planning. Units are serviced one at a time with portable spot-cooling staged and temperatures monitored continuously...",
        escalateFull: "Sharing the server room CRAC maintenance for pre-approval planning. Units are serviced one at a time with portable spot-cooling staged and temperatures monitored continuously. The work is scheduled during a low-load period, with a contingency to gracefully shut down non-critical equipment if temperatures approach thresholds.",
        origFrom: "Facilities Team", origMsg: "Hi team, the server room CRAC units are due for servicing before the summer heat. Please raise a maintenance change so we avoid thermal issues during peak.",
        reply: "Service scope agreed with the vendor and thermal contingency planned. The attached maintenance plan and thermal contingency doc cover coolant checks, filter replacement and the spot-cooling setup.",
        file1: "crac-maintenance-plan.pdf", file2: "thermal-contingency-plan.pdf",
        note: "In pre-approval — portable spot-cooling to be staged. Units serviced one at a time during a low-load period with continuous temperature monitoring and a shutdown contingency.",
        today: "In pre-approval planning. Vendor scheduled and contingency defined; finalising the low-load window before submitting to CAB.",
        approval1: "CAB Approval: Server Room Cooling Maintenance", approval2: "Facilities Sign-off: CRAC Servicing Window",
      },
      'CHG-969': {
        mention: "@Arnav Desai - The WAF rule tuning change is complete and closed. We cut the false positives blocking legitimate traffic and strengthened OWASP Top 10 coverage. Can you confirm closure?",
        team: "web security team", to: ['websec@motadata.com', 'app.support@motadata.com'],
        escalateShort: "Wrapping up the WAF rule tuning change. Several overly broad rules causing false positives were refined and OWASP Top 10 rules were enabled in blocking mode after a monitoring period...",
        escalateFull: "Wrapping up the WAF rule tuning change. Several overly broad rules causing false positives were refined and OWASP Top 10 rules were enabled in blocking mode after a monitoring period. Post-implementation monitoring over 48 hours confirmed a significant drop in false positives with no legitimate traffic blocked, and the change was closed successfully.",
        origFrom: "Web Security Team", origMsg: "Hi team, the WAF is blocking legitimate requests with 403s while some newer attack patterns slip through. Please raise a change to tune the rule set.",
        reply: "Tuning complete and validated over a 48-hour monitoring window. The attached before/after rule analysis and monitoring report show the false-positive drop with no legitimate traffic blocked.",
        file1: "waf-rule-analysis.pdf", file2: "post-implementation-monitoring.pdf",
        note: "Completed and closed. False-positive rules refined and OWASP Top 10 protections enabled in blocking mode; 48-hour monitoring confirmed stable operation.",
        today: "Completed and closed. Post-implementation monitoring confirmed a significant false-positive reduction with no legitimate traffic blocked. No recurrence observed.",
        approval1: "CAB Approval: WAF Rule Set Tuning", approval2: "Security Sign-off: WAF Blocking Mode Enablement",
      },
    };
    return map[id ?? ''] ?? {
      mention: "@Arnav Desai - Can you review this change request? It's been logged and needs scope, risk and rollback review before it goes to CAB.",
      team: "change advisory board", to: ['cab@motadata.com', 'it.ops@motadata.com'],
      escalateShort: "Submitting this change for review. Scope, risk and the rollback plan are being assessed ahead of CAB approval...",
      escalateFull: "Submitting this change for review. Scope, risk and the rollback plan are being assessed ahead of CAB approval. Further details and the implementation schedule will follow as the change progresses.",
      origFrom: "Change Requester", origMsg: "Hi team, please raise this change and take it through the approval process. Let me know if you need any more detail on the requirement.",
      reply: "I've completed the initial assessment and drafted the implementation and rollback plans. The attached documents summarise the approach and the risk evaluation.",
      file1: "implementation-plan.pdf", file2: "rollback-plan.pdf",
      note: "Implementation scheduled for the next maintenance window once approved. Rollback plan documented and stakeholders notified.",
      today: "Awaiting approval. Pre-implementation checks complete and the rollback path verified; ready to schedule once signed off.",
      approval1: "CAB Approval: Change Request Review", approval2: "Implementation Sign-off",
    };
  };

  const thread = getChangeThread(activeChange?.id);

  // Function to get AI summary text
  const getAiSummaryText = () => {
    const content = getChangeContent(activeChange?.id);
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

  if (openChanges.length === 0 || !activeChange) return null;
  if (minimized) return <MinimizedDrawerRail items={stackTabs ?? openChanges} activeId={activeChange?.id} onSelect={(id) => { onTabChange(id); setMinimized(false); }} onRestore={() => setMinimized(false)} />;

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
          items={stackTabs ?? openChanges}
          activeId={activeChangeId}
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
              <HeaderIdPill id={activeChange.id} />
              <span className="truncate">{activeChange.subject}</span>
            </h1>
            {/* Main properties — quick-glance KPIs below the subject */}
            {(() => {
              const types = ['Standard', 'Normal', 'Emergency'];
              const typeColors: Record<string, string> = { Standard: '#22A06B', Normal: '#F59E0B', Emergency: '#E74C3C' };
              const cid = activeChange?.id || 'CHG';
              const chgType = types[cid.charCodeAt(cid.length - 1) % types.length];
              const schedule = (() => {
                if (!changeScheduleStart) return null;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const pad = (n: number) => String(n).padStart(2, '0');
                const fmt = (v: string) => {
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return null;
                  let h = d.getHours();
                  const ap = h >= 12 ? 'PM' : 'AM';
                  h = h % 12 || 12;
                  return `${months[d.getMonth()]} ${d.getDate()}, ${pad(h)}:${pad(d.getMinutes())} ${ap}`;
                };
                const startLabel = fmt(changeScheduleStart);
                if (!startLabel) return null;
                const endLabel = changeScheduleEnd ? fmt(changeScheduleEnd) : null;
                return endLabel ? `${startLabel} → ${endLabel}` : startLabel;
              })();
              const items: HeaderKpiItem[] = [
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
                { key: 'type', tip: `Type: ${chgType}`, node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7B8FA5]">Type</span>
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeColors[chgType] }} />
                    <span className="text-[12px] font-medium text-[#364658]">{chgType}</span>
                  </span>
                ) },
              ];
              if (schedule) items.push({ key: 'scheduled', tip: `Scheduled: ${schedule}`, node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Scheduled</span>
                  <span className="size-2 rounded-full flex-shrink-0 bg-[#3D8BD0]" />
                  <span className="text-[12px] font-medium text-[#364658]">{schedule}</span>
                </span>
              ) });
              /* SLA / approval state reads as tinted alert pills, not label:value KPIs. */
              items.push(...alertKpiItems(getHeaderAlerts({
                id: activeChange?.id,
                status: selectedStatus,
                approvalsPending: approvalsCount,
              })));
              return <HeaderKpiRow items={items} />;
            })()}
          </div>
          {/* From My Approvals the header carries the DECISION and nothing else; the
              module's own actions stay mounted but hidden so nothing else shifts. */}
          {approvalMode && approvalHeader}
          <div className={`flex items-center gap-2 flex-shrink-0${approvalMode ? ' hidden' : ''}`}>
            <HeaderCopyButton variant="link" value={activeChange?.id ?? ''} label="Copy Change URL" />
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
                    {/* Current lifecycle stage — keeps the status tied to its stage */}
                    <div className="px-3 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                      {changeStageStatus.label}
                    </div>
                    {changeStageStatus.options.map((option, idx) => {
                      const isSel = selectedStatus === option.label;
                      return (
                        <button
                          key={option.label}
                          onClick={() => applyHeaderStatus(option)}
                          onMouseEnter={() => setStatusHighlight(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${statusHighlight === idx ? 'bg-[#F0F6FC]' : 'hover:bg-[#F9FAFB]'}`}
                        >
                          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                          <span className="text-[13px] text-[#364658]">{option.display}</span>
                          {isSel && <Check size={14} className="ml-auto text-[#3D8BD0]" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <ChangeActionsMenu
              ticketId={activeChange?.id}
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
            {/* Change Lifecycle Stages — shown at the top, under the header */}
            <ChangeStagesShowcase status={selectedStatus} drawerWidth={drawerWidth} />
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
                        <div className="app-menu absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-[100]">
                          <div className="px-3 pt-1.5 pb-2 border-b border-[#F0F2F5] mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3FB] border border-[#D6E6F5] text-[#2F7AB8] text-[11px] font-semibold">
                              <span className="size-1.5 rounded-full bg-[#3D8BD0] flex-shrink-0" />
                              {changeStageStatus.label}
                            </span>
                          </div>
                          {changeStageStatus.options.map((option) => (
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
                              <span className="text-[13px] text-[#364658]">{option.display}</span>
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
                        {activeChange?.id === 'CHG-993' ? 'Resolution due in 4d 5h' : 'Resolution due in 5d 2h'}
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
                  {activeChange?.id === 'CHG-976' ? 'AD' : activeChange.requester.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setShowRequesterProfile(true)} className="text-[14px] font-semibold text-[#364658] hover:text-[#3D8BD0] hover:underline transition-colors">{activeChange?.id === 'CHG-976' ? 'Arnav Desai' : activeChange.requester}</button>
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
                      style={{ display: activeChange?.id === 'CHG-976' ? 'none' : 'flex' }}
                    >
                      <Paperclip size={12} />
                      <span>2</span>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#364658] leading-relaxed">
                    {activeChange?.id === 'CHG-976' ? (
                      // Description for INC-35: Request for Apple MacBook Pro Allocation
                      isDescriptionExpanded ? (
                        <>
                          {getChangeContent('CHG-976').desc}
                          <br /><br />
                          {getChangeContent('CHG-976').descExtra}
                        </>
                      ) : (
                        <>
                          {getChangeContent('CHG-976').desc}{' '}
                          <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="text-[14px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                          >
                            View more
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )
                    ) : activeChange?.id === 'CHG-993' ? (
                      // Description for INC-32: My Internet Down
                      isDescriptionExpanded ? (
                        <>
                          {getChangeContent('CHG-993').desc}
                          <br /><br />
                          {getChangeContent('CHG-993').descExtra}
                        </>
                      ) : (
                        <>
                          {getChangeContent('CHG-993').desc}{' '}
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
                          {getChangeContent(activeChange?.id).desc}
                          <br /><br />
                          {getChangeContent(activeChange?.id).descExtra}
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
                          {getChangeContent(activeChange?.id).desc}{' '}
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
                  {isDescriptionExpanded && activeChange?.id !== 'CHG-976' && (
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
                    {getChangeContent(activeChange?.id).summary}
                  </div>

                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold text-[#7B8FA5] mb-2">KEY POINTS</h4>
                    <ul className="space-y-1.5">
                      {getChangeContent(activeChange?.id).keyPoints.map((point, i) => (
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
                      <span>Find similar tickets</span>
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
                    { id: 'service-request', label: 'Service Request', condition: activeChange?.id === 'CHG-976' },
                    { id: 'conversation', label: 'Conversation' },
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'approvals', label: 'Approvals', condition: activeChange?.id !== 'CHG-993' },
                    { id: 'relations', label: 'Relations', condition: true },
                    { id: 'audit', label: 'Audit Trails' },
                    { id: 'resolution', label: 'Planning' },
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
                    'resolution': 'Planning'
                  };

                  const renderTab = (tabId: string) => (
                    <button 
                      key={tabId}
                      className={`px-2 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${activeMainTab === tabId ? 'text-[#3D8BD0] border-[#3D8BD0]' : 'text-[#6b7280] border-transparent hover:bg-[#F5F7FA] hover:text-[#364658] hover:border-[#CBD5E1]'}`}
                      onClick={() => setActiveMainTab(tabId as any)}
                    >
                      {tabLabels[tabId]}
                      {tabId === 'conversation' && activeChange?.id !== 'CHG-993' && activeChange?.id !== 'CHG-976' && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {conversationCount}
                        </span>
                      )}
                      {tabId === 'tasks' && tasksCount > 0 && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {tasksCount}
                        </span>
                      )}
                      {tabId === 'approvals' && activeChange?.id !== 'CHG-993' && (
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
              ) : hasConversationsForTicket && (activeChange?.id === 'CHG-993' || activeChange?.id === 'CHG-976') ? (
                // Show only sent conversations for blank tickets that have conversations
                <BlankTicketConversationView 
                  conversations={sentConversations.filter(c => c.ticketId === activeChangeId)}
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
                {sentConversations.filter(c => c.ticketId === activeChangeId).map((conversation) => (
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
                  requesterEmail={activeChange ? `${activeChange.requester.toLowerCase().replace(/ /g, '.')}@motadata.com` : undefined}
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
                          defaultValue={`Fwd: ${activeChange?.id || ''} - ${activeChange?.subject || ''}`}
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
                          <span className="text-[#364658] ml-1">{activeChange?.id || ''} - {activeChange?.subject || ''}</span>
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
                ticketId={activeChange?.id}
                approvalSubjects={[thread.approval1, thread.approval2]}
                showCreateApprovalPopup={showCreateApprovalPopup}
                onCloseApprovalPopup={() => setShowCreateApprovalPopup(false)}
                onOpenApprovalPopup={() => setShowCreateApprovalPopup(true)}
                onApprove={() => {
                  // Create a new task when user approves
                  const taskSubject = `Implement change and verify rollout for: ${activeChange?.subject || 'change'}`;

                  const taskDescription = `Execute the approved implementation steps for "${activeChange?.subject || 'change'}" and confirm successful completion with the rollback plan verified.`;

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
                ticketId={activeChange?.id} 
                externalRelations={activeChange?.id ? (ticketRelations[activeChange.id]?.length ? ticketRelations[activeChange.id] : DEFAULT_REL) : undefined ?? affectedItems}
                onOpenRelation={onOpenRelation}
              initialTypeFilter={affectedTypeFilter}
                onClearTypeFilter={() => setAffectedTypeFilter(null)}
              />
            )}

            {/* Audit Trails Tab Content */}
            {activeMainTab === 'audit' && <AuditTrailsTabContent ticketId={activeChange?.id} />}

            {/* Resolution Tab Content */}
            {activeMainTab === 'resolution' && (
              <div className="px-6 py-6 space-y-8">
                {/* Change Schedule Section */}
                <div className="w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4 text-[#3D8BD0] flex-shrink-0" />
                    <h3 className="text-[14px] font-semibold text-[#364658]">Change Schedule</h3>
                  </div>
                  <p className="text-[12px] text-[#7B8FA5] mb-3">Set the overall change schedule and its impact.</p>

                  <div className={`grid grid-cols-2 ${drawerWidth > 1080 ? 'gap-6' : 'gap-3'}`}>
                    <ScheduleDateField label="Start Date" value={changeScheduleStart} onChange={setChangeScheduleStart} />
                    <ScheduleDateField label="End Date" value={changeScheduleEnd} onChange={setChangeScheduleEnd} />
                  </div>

                  <div className={`mt-4 ${drawerWidth > 1080 ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-3'}`}>
                    <AnalysisField
                      label="Impact"
                      value={analysis.impact}
                      placeholder="No impact defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, impact: v }))}
                    />
                  </div>
                </div>

                <div className="border-t border-[#DFE5ED]" />

                {/* Rollout Plan Section */}
                <div className="w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="size-4 text-[#3D8BD0] flex-shrink-0" />
                    <h3 className="text-[14px] font-semibold text-[#364658]">Rollout Plan</h3>
                  </div>
                  <p className="text-[12px] text-[#7B8FA5] mb-3">Plan the rollout window, backout plan and any downtime for this change.</p>

                  {/* Planned Rollout */}
                  <div className="text-[13px] font-semibold text-[#364658] mb-2">Planned Rollout</div>
                  <div className={`grid grid-cols-2 ${drawerWidth > 1080 ? 'gap-6' : 'gap-3'}`}>
                    <ScheduleDateField label="Start Date" value={plannedRolloutStart} onChange={setPlannedRolloutStart} />
                    <ScheduleDateField label="End Date" value={plannedRolloutEnd} onChange={setPlannedRolloutEnd} />
                  </div>

                  {/* Actual Rollout */}
                  <div className="text-[13px] font-semibold text-[#364658] mt-5 mb-2">Actual Rollout</div>
                  <div className={`grid grid-cols-2 ${drawerWidth > 1080 ? 'gap-6' : 'gap-3'}`}>
                    <ScheduleDateField label="Start Date" value={actualRolloutStart} onChange={setActualRolloutStart} />
                    <ScheduleDateField label="End Date" value={actualRolloutEnd} onChange={setActualRolloutEnd} />
                  </div>

                  <div className={`mt-5 ${drawerWidth > 1080 ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-3'}`}>
                    <AnalysisField
                      label="Rollout Plan"
                      value={analysis.rolloutPlan}
                      placeholder="No rollout plan defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, rolloutPlan: v }))}
                    />
                    <AnalysisField
                      label="Backout Plan"
                      value={analysis.backoutPlan}
                      placeholder="No backout plan defined yet. Click the edit button to add details."
                      onSave={(v) => setAnalysis((a) => ({ ...a, backoutPlan: v }))}
                    />
                  </div>

                  <div className="border-t border-[#DFE5ED] mt-8" />

                  {/* Rollout additions (Down Time / Custom) */}
                  <div className="mt-8">
                    <DownTimesSection drawerWidth={drawerWidth} onScheduleEntriesChange={setExtraScheduleEntries} />
                  </div>
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
            ticketId={activeChange?.id}
            requesterName={activeChange?.requester}
            showChangeCalendar={true}
            changeCalendarEvents={[
              ...(changeScheduleStart ? [{ start: changeScheduleStart, id: `${activeChange?.id || 'chg'}-cs-s`, group: 'Change Schedule', label: 'Scheduled start', description: analysis.impact, color: '#3D8BD0' }] : []),
              ...(changeScheduleEnd ? [{ start: changeScheduleEnd, id: `${activeChange?.id || 'chg'}-cs-e`, group: 'Change Schedule', label: 'Scheduled end', description: analysis.impact, color: '#3D8BD0' }] : []),
              ...(plannedRolloutStart ? [{ start: plannedRolloutStart, id: `${activeChange?.id || 'chg'}-pr-s`, group: 'Planned Rollout', label: 'Rollout start', description: analysis.rolloutPlan, color: '#22A06B' }] : []),
              ...(plannedRolloutEnd ? [{ start: plannedRolloutEnd, id: `${activeChange?.id || 'chg'}-pr-e`, group: 'Planned Rollout', label: 'Rollout end', description: analysis.rolloutPlan, color: '#22A06B' }] : []),
              ...(actualRolloutStart ? [{ start: actualRolloutStart, id: `${activeChange?.id || 'chg'}-ar-s`, group: 'Actual Rollout', label: 'Rollout start', description: analysis.rolloutPlan, color: '#0EA5E9' }] : []),
              ...(actualRolloutEnd ? [{ start: actualRolloutEnd, id: `${activeChange?.id || 'chg'}-ar-e`, group: 'Actual Rollout', label: 'Rollout end', description: analysis.rolloutPlan, color: '#0EA5E9' }] : []),
              ...extraScheduleEntries,
            ]}
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
            additionalTitle="Change Information"
            showNotifications={!approvalMode}
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
            statusOptions={changeStageStatus.options}
            statusGroupLabel={changeStageStatus.label}
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
        penaltyAmount={getSlaPenaltyAmount(activeChange?.id)}
      />
      <RequesterProfilePanel
        isOpen={showRequesterProfile}
        onClose={() => setShowRequesterProfile(false)}
        requesterName={activeChange?.id === 'CHG-976' ? 'Arnav Desai' : activeChange?.requester}
      />
    </div>
  );
}

export default ChangeDrawer;
