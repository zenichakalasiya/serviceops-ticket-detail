/* Registry Deployment detail page — a separate-file clone of RegistryDeploymentDrawer (opened
 * from the Registry Deployments listing). Kept standalone so the registry flow can diverge;
 * adapted onto the Patch shape by registryDeploymentToPatchShape in the list page. */
/**
 * PatchDeploymentDrawer Component — the Patch DEPLOYMENT detail page.
 *
 * A 1:1 clone of PatchDrawer.tsx (the Patch detail page), opened from the Patch Deployments
 * listing via the 'patch-deployments' DrawerStack module. The list page adapts a
 * PatchDeployment record onto the Patch shape (deploymentToPatchShape) before opening, so the
 * cloned body compiles unchanged. This is a SEPARATE file so deployment-specific changes stay
 * isolated from the Patch detail page.
 *
 * Note: This file may trigger a Babel optimization warning about exceeding 500KB in transpiled output.
 * This is a known Babel behavior where certain optimizations are disabled for large files,
 * but it does not affect functionality. Utilities have been extracted to TicketDrawerUtils.tsx
 * to help reduce the file size where possible.
 */
import { ChevronsUpDown, ChevronsDownUp, Users, Orbit, X, ChevronLeft, ChevronRight, Star, Share2, Eye, EyeOff, MoreHorizontal, MoreVertical, Paperclip, Clock, Search, Filter, ArrowUpDown, Reply, Forward, Sparkles, MessageSquare, StickyNote, ChevronDown, ChevronUp, CheckCircle, Mail, XCircle, Maximize2, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Image, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Video, User, FileText, Download, Trash2, Tag, Folder, Activity, Lightbulb, Pin as PinIcon, PinOff, Plus, Minus, Check, Play, Pause, Square, Link, Ticket as TicketIcon, Lock, Stethoscope, Edit, CheckSquare, Info, HardDrive, Monitor, Cpu, MemoryStick, Network, CircuitBoard, Keyboard, Mouse, Usb, Disc, Columns3, Package, MapPin, Settings2, Barcode, QrCode, Printer, Copy, LayoutGrid, List as ListIcon, Unlink, Laptop, Gauge, AppWindow, ShieldCheck, Layers, Files } from 'lucide-react';
import { RelationshipGraph, DEFAULT_REL_GRAPH_CONFIG, type RelGraphConfig, type ExtraRelChild, type RelGraphSnapshotApi } from './upstream/RelationshipGraph';
import { FileTypeBadge } from './DescriptionAttachments';
import { RelSavedViews } from './upstream/RelSavedViews';
import { AddRelationshipPanel, REL_RELATIONS } from './upstream/AddRelationshipPanel';
import { ActiveIssuesPanel } from './upstream/ActiveIssuesPanel';
import { RelSliderRow } from './RelSliderRow';
import { AiSparkle } from './upstream/AiSparkle';
import { EditorToolbarActions, EditorSendActions, RichComposerArea } from './upstream/EditorToolbar';
import { DateField } from './DateField';
import { useState, useRef, useEffect } from 'react';
import { DrawerTabStrip } from './upstream/DrawerTabStrip';
import { MinimizedDrawerRail } from './upstream/MinimizedDrawerRail';
import { AssetAiSummary } from './upstream/AssetAiSummary';
import { IconRequest, IconProblem, IconChange, IconRelease } from './SidebarIcons';
import { toast } from 'sonner';
import type { Ticket } from './TicketListPage';
import type { HardwareAsset } from './HardwareAssetsListPage';
import type { Patch } from './PatchesListPage';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CopyableEmails } from './CopyableEmails';
import { HeaderCopyButton } from './upstream/HeaderCopyButton';
import { HeaderIdPill } from './HeaderIdPill';
import { SystemFieldsRenderer } from './upstream/SystemFieldsRenderer';
import { TicketPropertiesPanel } from './upstream/TicketPropertiesPanel';
import { HeaderKpiRow, type HeaderKpiItem } from './upstream/HeaderKpiRow';
import { DiagnosisCard } from './upstream/DiagnosisCard';
import { SolutionCard } from './SolutionCard';
import { AISummary } from './upstream/AISummary';
import { SLAHistoryModal } from './SLAHistoryModal';
import { ServiceRequestItems } from './upstream/ServiceRequestItems';
import { EditItemPopup } from './upstream/EditItemPopup';
import { InlineReplyEditor } from './upstream/InlineReplyEditor';
import { renderCatalogIcon, getIconBackgroundColor } from './CatalogIconUtils';
import { TaskFormPanel } from './upstream/TaskFormPanel';
import { TasksTabContent } from './upstream/TasksTabContent';
import { AuditTrailsTabContent } from './upstream/AuditTrailsTabContent';
import { RelationsTabContent } from './upstream/RelationsTabContent';
import { PatchComputersTab, INITIAL_COMPUTERS, type PatchComputer, type PatchInstallation } from './upstream/PatchComputersTab';
import { DEPLOYED_PATCHES } from './PatchDeploymentPatchesTab';
import { RegistryDeploymentRegistryTab, REGISTRY_ENTRIES, buildRegistryDeploymentMatrix } from './RegistryDeploymentRegistryTab';
import { PatchInstallationTab } from './upstream/PatchInstallationTab';
import { CountPreviewKpiCard } from './OverviewKpiCards';
import { PatchVulnerabilitiesTab, VULNERABILITIES } from './upstream/PatchVulnerabilitiesTab';
import { PatchSupersededTab } from './upstream/PatchSupersededTab';
import { PATCH_AFFECTED_PRODUCTS, PATCH_FILES } from './PatchPanelData';
import { ResolutionTabContent } from './upstream/ResolutionTabContent';
import { ConversationTabContent } from './ConversationTabContent';
import { ServiceRequestTabContent } from './upstream/ServiceRequestTabContent';
import { ApprovalsTabContent } from './upstream/ApprovalsTabContent';
import { TicketDetailsOnboarding } from './upstream/TicketDetailsOnboarding';
import { CatalogItemDetailsModal } from './CatalogItemDetailsModal';
import { TicketActionsMenu } from './upstream/TicketActionsMenu';
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
  getFilteredAdditionalFields,
  makeCrossModuleRelations,
} from './TicketDrawerUtils';
const DEFAULT_REL = makeCrossModuleRelations([{type:'Request',prefix:'REQ'},{type:'Change',prefix:'CHG'},{type:'Contract',prefix:'CNT'},{type:'Purchase',prefix:'PO'}]);
import { ASSET_FIELD_LABELS, AGENT_FIELD_LABELS } from './upstream/AssetFields';
import { HardwareAssetActionsMenu } from './upstream/HardwareAssetActionsMenu';
import profileImage from 'figma:asset/346a47ed4118f690df082984fcd9c5da55898d34.png';
import svgPaths from '../../imports/svg-vmnsig04gh';

/* ── Overview "Status by …" breakdown cards ─────────────────────────────────────────────────
 * Two dropdown-driven cards on the Patch Deployment Overview: pick a category / remote office
 * and see its deployment status split (Success / Failed / In Progress / Other) + total. */
type StatusSplit = { success: number; failed: number; inProgress: number; other: number };

const BREAKDOWN_STATUSES: { key: keyof StatusSplit; label: string; color: string }[] = [
  { key: 'success', label: 'Success', color: '#12B76A' },
  { key: 'failed', label: 'Failed', color: '#F04438' },
  { key: 'inProgress', label: 'In Progress', color: '#F79009' },
  { key: 'other', label: 'Other', color: '#94A3B8' },
];

// Deployment status by patch category — the product's 9 FIXED categories, in catalog order.
// Rendered as one stacked column per category (hover a bar for the status breakdown).
const PATCH_STATUS_BY_CATEGORY: Record<string, StatusSplit> = {
  'Tools': { success: 1, failed: 0, inProgress: 0, other: 2 },
  'Feature Packs': { success: 2, failed: 1, inProgress: 0, other: 3 },
  'Service Packs': { success: 2, failed: 0, inProgress: 1, other: 0 },
  'Update Rollups': { success: 4, failed: 1, inProgress: 0, other: 1 },
  'Definition Updates': { success: 0, failed: 0, inProgress: 0, other: 7 },
  'Critical Updates': { success: 6, failed: 1, inProgress: 1, other: 0 },
  'Updates': { success: 5, failed: 0, inProgress: 1, other: 1 },
  'Hotfix': { success: 3, failed: 1, inProgress: 0, other: 0 },
  'Security Updates': { success: 12, failed: 3, inProgress: 2, other: 1 },
};

// Installation status by remote office.
const STATUS_BY_REMOTE_OFFICE: Record<string, StatusSplit> = {
  'Ahmedabad HQ': { success: 28, failed: 4, inProgress: 3, other: 2 },
  'Mumbai Office': { success: 14, failed: 5, inProgress: 1, other: 0 },
  'Bengaluru Campus': { success: 9, failed: 3, inProgress: 0, other: 0 },
  'Pune Data Center': { success: 6, failed: 0, inProgress: 2, other: 1 },
  'Local Office': { success: 9, failed: 0, inProgress: 0, other: 0 },
};

// Donut gauge + legend card (Patches / Endpoints / Deployment Status) — extracted so the three
// gauges can be placed individually (Patches + Endpoints on top, Deployment Status in its section).
function DonutKpiCard({
  label, icon: Icon, color, total, segments, onClick, wide,
}: {
  label: string;
  icon: typeof Package;
  color: string;
  total: number;
  segments: { label: string; value: number; color: string }[];
  onClick?: () => void;
  wide: boolean;
}) {
  const segs = segments.filter((s) => s.value > 0);
  // These cards span a full half-row now, so the gauge is sized up to fill the extra width
  // (which also grows the card height proportionally).
  const dia = wide ? 148 : 116;
  const C = 2 * Math.PI * 40;
  let acc = 0;
  return (
    <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${color}1A`, color }}>
          <Icon size={15} />
        </span>
        <span className="text-[13px] text-[#64748B]">{label}</span>
        {onClick && (
          <button onClick={onClick} className="ml-auto flex flex-shrink-0 items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View more<ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: dia, height: dia }}>
          <svg viewBox="0 0 100 100" className="-rotate-90" style={{ width: dia, height: dia }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="16" />
            {segs.map((s) => {
              const len = (s.value / Math.max(total, 1)) * C;
              const off = -(acc / Math.max(total, 1)) * C;
              acc += s.value;
              return (
                <circle key={s.label} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off} />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${wide ? 'text-[24px]' : 'text-[20px]'} font-semibold leading-none tabular-nums text-[#364658]`}>{total}</span>
            <span className="mt-0.5 text-[11px] text-[#7B8FA5]">Total</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {segs.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              {/* min-width keeps the values aligned in a column, right after the label (no big gap) */}
              <span className="min-w-[84px] truncate text-[12px] text-[#64748B]">{s.label}</span>
              <span className="text-[13px] font-semibold tabular-nums text-[#364658]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBreakdownCard({
  title, icon: Icon, data, totalLabel, allLabel,
}: {
  title: string;
  icon: typeof Package;
  data: Record<string, StatusSplit>;
  totalLabel: string;
  allLabel: string;
}) {
  const entries = Object.keys(data);
  // "All …" (default) aggregates every entry; specific rows drill into one category / office.
  const options = [allLabel, ...entries];
  const [selected, setSelected] = useState(allLabel);
  const [open, setOpen] = useState(false);
  const d = selected === allLabel
    ? entries.reduce(
        (acc, k) => ({
          success: acc.success + data[k].success,
          failed: acc.failed + data[k].failed,
          inProgress: acc.inProgress + data[k].inProgress,
          other: acc.other + data[k].other,
        }),
        { success: 0, failed: 0, inProgress: 0, other: 0 } as StatusSplit,
      )
    : (data[selected] ?? { success: 0, failed: 0, inProgress: 0, other: 0 });
  const total = d.success + d.failed + d.inProgress + d.other;

  return (
    <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: '#3D8BD01A', color: '#3D8BD0' }}>
          <Icon size={15} />
        </span>
        <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
      </div>

      {/* Dropdown — pick the category / office to break down */}
      <div className="relative mb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-9 w-full items-center justify-between rounded border px-3 text-[13px] transition-colors ${open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#3D8BD0]'}`}
        >
          <span className="truncate text-[#364658]">{selected}</span>
          <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="app-menu absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
              {options.map((o) => (
                <button
                  key={o}
                  onClick={() => { setSelected(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${o === selected ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                >
                  <span className="truncate text-[#364658]">{o}</span>
                  {o === selected && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Proportional stacked bar (at-a-glance distribution) */}
      <div className="mb-3 flex h-1.5 w-full gap-px overflow-hidden rounded-full">
        {total === 0 ? (
          <span className="flex-1 bg-[#EEF2F6]" />
        ) : (
          BREAKDOWN_STATUSES.filter((s) => d[s.key] > 0).map((s) => (
            <span key={s.key} style={{ flexGrow: d[s.key], backgroundColor: s.color }} />
          ))
        )}
      </div>

      {/* Status rows */}
      <div className="space-y-1.5">
        {BREAKDOWN_STATUSES.map((s) => (
          <div key={s.key} className="flex items-center justify-between rounded bg-[#F8FAFC] px-3 py-2">
            <span className="inline-flex items-center gap-2 text-[13px] text-[#64748B]">
              <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: d[s.key] > 0 ? s.color : '#94A3B8' }}>{d[s.key]}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-[#EEF1F4] pt-3">
        <span className="text-[13px] font-medium text-[#364658]">{totalLabel}</span>
        <span className="text-[15px] font-bold tabular-nums text-[#364658]">{total}</span>
      </div>
    </div>
  );
}

/** One stacked column per category (fixed 9), rendered with recharts: Y axis with counts,
 *  soft horizontal gridlines, rounded top on each stack, and a dark hover tooltip carrying
 *  the Success / Failed / In Progress / Other breakdown. */

// Rounds ONLY the top segment of each stack (the segment whose key matches the datum's topKey).
const CatBarShape = (key: string) => (props: any) => {
  const { x, y, width, height, fill, payload } = props;
  if (!height || height <= 0) return <g />;
  if (payload.topKey !== key) return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  const r = Math.min(4, width / 2, height);
  return (
    <path
      d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
      fill={fill}
    />
  );
};

// Two-line category labels (split on the first space) so the 9 names stay readable.
const CatTick = ({ x, y, payload }: any) => {
  const words = String(payload.value).split(' ');
  const l1 = words[0];
  const l2 = words.slice(1).join(' ');
  return (
    <g>
      <text x={x} y={y + 12} textAnchor="middle" fontSize={10} fill="#7B8FA5">{l1}</text>
      {l2 && <text x={x} y={y + 23} textAnchor="middle" fontSize={10} fill="#7B8FA5">{l2}</text>}
    </g>
  );
};

// Dark tooltip (product-standard look) with the per-status breakdown + total.
const CatTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[160px] rounded-md bg-[#111827] px-3 py-2 text-white shadow-xl">
      <div className="mb-1.5 text-[12px] font-semibold">{d.name}</div>
      {BREAKDOWN_STATUSES.map((s) => (
        <div key={s.key} className="flex items-center gap-2 py-0.5 text-[11px]">
          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
          <span className="flex-1 text-white/85">{s.label}</span>
          <span className="font-semibold tabular-nums">{d[s.key]}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-white/15 pt-1 text-[11px]">
        <span className="text-white/85">Total</span>
        <span className="font-semibold tabular-nums">{d.total}</span>
      </div>
    </div>
  );
};

function CategoryStatusBarsCard({
  title, icon: Icon, data,
}: {
  title: string;
  icon: typeof Package;
  data: Record<string, StatusSplit>;
}) {
  const chartData = Object.entries(data).map(([name, d]) => {
    // topKey = the last status present in the stack — that segment gets the rounded top.
    const present = BREAKDOWN_STATUSES.filter((s) => d[s.key] > 0);
    return { name, ...d, total: d.success + d.failed + d.inProgress + d.other, topKey: present.length ? present[present.length - 1].key : '' };
  });
  // Responsive flip: 9 vertical columns need ~540px of label room — below that the card
  // renders HORIZONTAL bars instead (category names on the Y axis get full width, nothing
  // overlaps). Measured against the CARD's own width, so the squeezed 2-up wide layout and
  // the stacked narrow view both flip correctly.
  const rootRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCardW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const horizontal = cardW > 0 && cardW < 540;
  return (
    <div ref={rootRef} className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white p-4">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: '#3D8BD01A', color: '#3D8BD0' }}>
          <Icon size={15} />
        </span>
        <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
      </div>

      {/* Chart — counts on the value axis; hover a bar for its status breakdown */}
      {horizontal ? (
        <div className="flex-1" style={{ minHeight: 290 }}>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barCategoryGap="26%">
              <CartesianGrid horizontal={false} stroke="#F0F2F5" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={106} interval={0} tick={{ fontSize: 10, fill: '#7B8FA5' }} axisLine={{ stroke: '#EEF1F4' }} tickLine={false} />
              <RechartsTooltip content={<CatTooltip />} cursor={{ fill: 'rgba(61, 139, 208, 0.06)' }} />
              {BREAKDOWN_STATUSES.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="status" fill={s.color} maxBarSize={14} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1" style={{ minHeight: 230 }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 12, right: 4, bottom: 0, left: -22 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#F0F2F5" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <XAxis dataKey="name" interval={0} tick={<CatTick />} axisLine={{ stroke: '#EEF1F4' }} tickLine={false} height={34} />
              <RechartsTooltip content={<CatTooltip />} cursor={{ fill: 'rgba(61, 139, 208, 0.06)' }} />
              {BREAKDOWN_STATUSES.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="status" fill={s.color} maxBarSize={30} shape={CatBarShape(s.key)} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend — identity is never color-alone */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {BREAKDOWN_STATUSES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PatchDrawerProps {
  openAssets: Patch[];
  activeAssetId: string | null;
  onClose: () => void;
  onCloseTab: (assetId: string) => void;
  onTabChange: (assetId: string) => void;
  onOpenRelation?: (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => void;
  stackTabs?: { id: string; subject?: string }[];
  stackWidth?: number;
  onStackWidthChange?: (w: number) => void;
  stackMinimized?: boolean;
  onStackMinimizedChange?: (m: boolean) => void;
}

/**
 * Adapts a Patch onto the HardwareAsset shape the cloned asset-detail body consumes.
 * Patch-only fields have no hardware equivalent yet, so hardware-only fields are filled with
 * placeholders and the UI renders unchanged; replace with patch-specific fields when this page
 * is customized.
 */
function patchToAssetShape(p: Patch): HardwareAsset {
  return {
    id: p.id,
    name: p.name,
    assetType: 'Patch' as HardwareAsset['assetType'],
    status: 'In Use',
    hostName: '---',
    ipAddress: '---',
    usedBy: null,
    managedByGroup: 'IT Operations',
    managedBy: { name: 'Unassigned' },
    serialNumber: '---',
  };
}

/**
 * Adapts the (already-adapted) asset onto the Ticket shape the cloned ticket-detail body consumes.
 */
function assetToTicket(a: HardwareAsset): Ticket {
  const statusMap: Record<HardwareAsset['status'], Ticket['status']> = {
    'In Use': 'In Progress',
    'Available': 'Open',
    'In Store': 'Pending',
  };
  return {
    id: a.id,
    subject: a.name,
    requester: a.usedBy?.label ?? '—',
    dueBy: new Date(),
    createdBy: new Date(),
    assignedTo: { name: a.managedBy.name, initials: a.managedBy.initials ?? '' },
    status: statusMap[a.status] ?? 'Open',
    priority: 'Medium',
  };
}

// Related records listed when hovering an Impact pill (keyed by relation type).
const RELATED_RECORDS: Record<string, { id: string; subject: string; assignee: string; status: string; statusColor: string; priority: string }[]> = {
  Incident: [
    { id: 'INC-32', subject: 'Wi-Fi not working', assignee: 'Neha Raje', status: 'In Progress', statusColor: '#3D8BD0', priority: 'High' },
    { id: 'INC-45', subject: 'Email sync failing on Outlook', assignee: 'Rohan Mehta', status: 'Open', statusColor: '#D97706', priority: 'Medium' },
    { id: 'INC-51', subject: 'Slow boot after update', assignee: 'Imran Qureshi', status: 'Pending', statusColor: '#9CA3AF', priority: 'Low' },
  ],
  Problem: [
    { id: 'PRB-12', subject: 'Recurring VPN disconnects', assignee: 'Vikram Sethi', status: 'Under Investigation', statusColor: '#8B5CF6', priority: 'High' },
    { id: 'PRB-18', subject: 'Frequent BSOD on docking', assignee: 'Farah Sheikh', status: 'Open', statusColor: '#D97706', priority: 'Medium' },
  ],
  Change: [
    { id: 'CHG-08', subject: 'Windows 11 feature upgrade', assignee: 'Tabrez Khan', status: 'Scheduled', statusColor: '#3D8BD0', priority: 'Medium' },
    { id: 'CHG-14', subject: 'BIOS firmware rollout', assignee: 'Neha Raje', status: 'Approved', statusColor: '#22A06B', priority: 'High' },
  ],
  Release: [
    { id: 'REL-03', subject: 'Q3 security patch release', assignee: 'Vikram Sethi', status: 'Planning', statusColor: '#D97706', priority: 'Medium' },
  ],
};

export function RegistryDeploymentDrawer({
  openAssets,
  activeAssetId,
  onClose,
  onCloseTab,
  onTabChange,
  onOpenRelation,
stackTabs,
stackWidth,
onStackWidthChange,
stackMinimized,
onStackMinimizedChange,
}: PatchDrawerProps) {
  const assetList = openAssets.map(patchToAssetShape);
  const openTickets = assetList.map(assetToTicket);
  const activeTicketId = activeAssetId;
  const activeTicket = openTickets.find(t => t.id === activeTicketId);
  const [minimizedLocal, setMinimizedLocal] = useState(false);
  const minimized = stackMinimized ?? minimizedLocal;
  const setMinimized = onStackMinimizedChange ?? setMinimizedLocal;
  useEffect(() => { setMinimized(false); }, [activeTicket?.id]);
  const activeAsset = assetList.find(a => a.id === activeAssetId);
  // The RAW patch record (the adapted HardwareAsset shape has no description).
  const activePatchRecord = openAssets.find(p => p.id === activeAssetId) ?? openAssets[0];
  // Overview description is optional and collapsed by default; reset when switching patch tabs.
  const [descExpanded, setDescExpanded] = useState(false);
  useEffect(() => { setDescExpanded(false); }, [activeAssetId]);

  // Editable asset field values (lifted here so the Pinned Fields section can read them too).
  const [assetType, setAssetType] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [assetImpact, setAssetImpact] = useState('Low');
  const [assetGroup, setAssetGroup] = useState('Unassigned');
  const [assetManager, setAssetManager] = useState<{ name: string; initials?: string; color?: string }>({ name: 'Unassigned' });
  const [softwareType, setSoftwareType] = useState('Managed');
  const [assetExtra, setAssetExtra] = useState<Record<string, string>>({
    'Asset Group': 'Unassigned',
    'Product': 'use case',
    'Used By': 'Neha Raje',
    'Location': '',
    'Category': '',
    'Department': '',
    'Vendor': 'Test vendor',
    'Asset Condition': 'None',
    'Movement Status': 'None',
    'Under Change Control': 'No',
    'Business Service': '',
    'Origin': 'Purchase',
    'Acquisition Date': '2026-04-22',
    'Assignment Date': '',
  });

  // Seed the asset fields from the active asset whenever the open asset changes.
  useEffect(() => {
    if (!activeAsset) return;
    setAssetType(activeAsset.assetType);
    setAssetStatus(activeAsset.status === 'In Use' ? 'In Use' : 'In Stock');
    setAssetImpact('Low');
    setAssetGroup(activeAsset.managedByGroup || 'Unassigned');
    setAssetManager(activeAsset.managedBy);
  }, [activeAssetId]);

  const assetState = {
    assetType, setAssetType,
    status: assetStatus, setStatus: setAssetStatus,
    impact: assetImpact, setImpact: setAssetImpact,
    managedByGroup: assetGroup, setManagedByGroup: setAssetGroup,
    managedBy: assetManager, setManagedBy: setAssetManager,
    softwareType, setSoftwareType,
    extra: assetExtra, setExtra: setAssetExtra,
  };

  // Agent Information shown in place of Requester Information on the asset page.
  // Real values from the asset where available; the rest are representative samples for now.
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
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'properties' | 'hardware' | 'software' | 'consolidated' | 'installation' | 'meter' | 'baseline' | 'relationship' | 'conversation' | 'tasks' | 'approvals' | 'relations' | 'audit' | 'resolution' | 'service-request'>('properties');
  const [installationSearch, setInstallationSearch] = useState('');
  const [removedConsolidated, setRemovedConsolidated] = useState<Set<number>>(new Set());
  // Baseline attached to this asset (max one); Variance rows are empty by default.
  const [baselines, setBaselines] = useState<{ id: string; name: string; createdOn: string; createdBy: string }[]>([
    { id: 'BAS-31', name: 'New Base Line - 64 Bit', createdOn: 'Mon, Apr 27, 2026 11:44 AM', createdBy: 'System' },
  ]);
  // Add Baseline picker (side drawer): select one admin-created baseline to attach.
  const [showAddBaseline, setShowAddBaseline] = useState(false);
  const [baselineSearch, setBaselineSearch] = useState('');
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);

  // Financials tab
  const [financialsSubTab, setFinancialsSubTab] = useState<'cost' | 'depreciation'>('cost');
  const [costRecords, setCostRecords] = useState<{ id: number; date: string; amount: number; currency: string; factor: string; description: string }[]>([
    { id: 1, date: 'Mon, Jun 22, 2026 03:06 PM', amount: 20, currency: 'ATS', factor: 'Purchase', description: 'fdsafdfda' },
  ]);
  const [showAddCost, setShowAddCost] = useState(false);
  const [newCost, setNewCost] = useState({ factor: '', date: '', amount: '', currency: 'ATS', description: '' });
  const [showConfigDepr, setShowConfigDepr] = useState(false);
  const [showDeprLog, setShowDeprLog] = useState(false);
  const [deprConfig, setDeprConfig] = useState({ derivation: 'asset', method: '', type: 'useful', usefulLife: '', usefulLifeUnit: 'Month', salvageValue: '', currency: 'ATS' });

  // History tab — selected category (replaces old left sub-nav).
  const [historyCategory, setHistoryCategory] = useState('audit');
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [histFilterOpen, setHistFilterOpen] = useState(false);
  const [histDownloadOpen, setHistDownloadOpen] = useState(false);
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [histDraftFrom, setHistDraftFrom] = useState('');
  const [histDraftTo, setHistDraftTo] = useState('');
  const [histDlFormat, setHistDlFormat] = useState('PDF');
  const [histDlPw, setHistDlPw] = useState(false);
  const [histDlPassword, setHistDlPassword] = useState('');
  const [histShowPw, setHistShowPw] = useState(false);
  // Deleted Software rows (Software tab), keyed by row index.
  const [removedSoftware, setRemovedSoftware] = useState<Set<number>>(new Set());
  // Search across the Software inventory table.
  const [softwareSearch, setSoftwareSearch] = useState('');
  // Software table column visibility (important columns shown by default).
  const [visibleSoftwareCols, setVisibleSoftwareCols] = useState<Set<string>>(
    new Set(['name', 'manufacturer', 'version', 'installedDate', 'installedLocation', 'actions'])
  );
  const [showSoftwareColsMenu, setShowSoftwareColsMenu] = useState(false);
  const [softwareView, setSoftwareView] = useState<'list' | 'card'>('card');
  // Number of baseline variances detected for this asset (0 = none, shows Encryption instead).
  const baselineVarianceCount = 3;
  // Search across all Properties tab sections (Hardware Asset detail page).
  const [propertiesSearch, setPropertiesSearch] = useState('');
  // Pre-applied relation type filter when navigating from the Contracts & Purchases card.
  const [relView, setRelView] = useState<'graph' | 'tree' | 'grid'>('graph');
  const [relFull, setRelFull] = useState(false);
  const [relKey, setRelKey] = useState(0);
  // Expand-all / Collapse-all toolbar toggle (bulk expand every node at once).
  const [relExpandKey, setRelExpandKey] = useState(0);
  const [relCollapseKey, setRelCollapseKey] = useState(0);
  const [relAllExpanded, setRelAllExpanded] = useState(false);
  // Saved Views: capture/restore API filled by the RelationshipGraph instance.
  const relSnapRef = useRef<RelGraphSnapshotApi | null>(null);
  const [relSearch, setRelSearch] = useState('');
  // Advanced Configuration for the relationship topology: applied config + panel draft.
  const [relConfig, setRelConfig] = useState<RelGraphConfig>(DEFAULT_REL_GRAPH_CONFIG);
  const [relDraft, setRelDraft] = useState<RelGraphConfig>(DEFAULT_REL_GRAPH_CONFIG);
  const [showRelSettings, setShowRelSettings] = useState(false);
  // Topology type filter (toolbar Filter menu): the selected option's label, or null = all.
  const [relFilter, setRelFilter] = useState<string[]>([]);
  // Connection-type filter (edge relation labels; options reported live by the graph).
  const [relConnFilter, setRelConnFilter] = useState<string[]>([]);
  const [relConnTypes, setRelConnTypes] = useState<string[]>([]);
  const [showRelConnMenu, setShowRelConnMenu] = useState(false);
  const [relConnSearch, setRelConnSearch] = useState('');
  // Active tab inside the merged Filter popup.
  const [relFilterTab, setRelFilterTab] = useState<'type' | 'connection'>('type');
  const [showRelFilter, setShowRelFilter] = useState(false);
  // Add Relationship: the node whose "+" was clicked (opens the side panel), and the
  // user-added relationships per source node (grafted into the topology).
  const [relAddTarget, setRelAddTarget] = useState<{ id: string; name: string } | null>(null);
  const [relExtras, setRelExtras] = useState<Record<string, ExtraRelChild[]>>({});
  // Active Issues panel: the (red) node whose hover-card issues strip was clicked.
  const [relIssuesTarget, setRelIssuesTarget] = useState<{ id: string; name: string } | null>(null);
  const relSearchRef = useRef<HTMLInputElement>(null);
  // Relationship download popup (same as the audit-trail download).
  const [showRelDownload, setShowRelDownload] = useState(false);
  const [relDlFormat, setRelDlFormat] = useState<'PDF' | 'Excel' | 'CSV' | 'PNG'>('PDF');
  const [relDlPwProtected, setRelDlPwProtected] = useState(false);
  const [relDlShowPw, setRelDlShowPw] = useState(false);
  const [relDlPassword, setRelDlPassword] = useState('');
  // Relationship-tab hotkeys: Ctrl+F focuses the node search (Esc in the field clears it),
  // Ctrl+Shift+F toggles fullscreen, 1/2 switch Full/Tree view (ignored while typing).
  useEffect(() => {
    if (activeMainTab !== 'relationship') return;
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setRelFull((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        relSearchRef.current?.focus();
        return;
      }
      if (inField) return;
      if (e.key === '1') setRelView('graph');
      else if (e.key === '2') setRelView('tree');
      else if (e.key === '3') setRelView('grid');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeMainTab]);
  const [relationsInitialFilter, setRelationsInitialFilter] = useState<string | null>(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  // Whether the Hardware tab's jump-to-section list is open.
  const [hardwareNavOpen, setHardwareNavOpen] = useState(false);
  // Common search across all Hardware tab sections.
  const [hardwareSearch, setHardwareSearch] = useState('');
  // Deleted Hardware record cards, keyed as `${categoryId}:${index}`.
  const [removedHardwareItems, setRemovedHardwareItems] = useState<Set<string>>(new Set());
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
  const [showBarcodeMenu, setShowBarcodeMenu] = useState(false);
  const [showQrMenu, setShowQrMenu] = useState(false);
  const [showAddBarcodePopup, setShowAddBarcodePopup] = useState(false);
  const [addBarcodeValue, setAddBarcodeValue] = useState('');
  // Patch approval decision, per patch id: 'none' (just created → both buttons),
  // 'approved' (only Decline shows), 'declined' (only Approve shows).
  const [patchDecision, setPatchDecision] = useState<Record<string, 'none' | 'approved' | 'declined'>>({});

  // Computers + Installation tabs share this state: installing a patch on a Missing computer creates
  // a deployment record (Installation tab); once that record's status turns Success the computer
  // moves into the Installed bucket in the Computers tab.
  // Endpoint tab = the endpoints this deployment TARGETS (not the whole estate) — the same 4
  // endpoints the Deployment tab's patch × endpoint matrix runs over. EP-426 isn't in the
  // shared estate mock, so it's appended by hand.
  const [patchComputers, setPatchComputers] = useState<PatchComputer[]>(() => [
    // EP-397's deployments have succeeded → it sits in the Installed bucket (Overview donut).
    ...INITIAL_COMPUTERS.filter((c) => ['EP-380', 'EP-397', 'EP-400'].includes(c.id))
      .map((c) => (c.id === 'EP-397' ? { ...c, bucket: 'Installed' as const } : c)),
    { id: 'EP-426', hostName: 'DESKTOP-A3RMK1H', ipAddress: '192.168.29.100', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'Mumbai Office', bucket: 'Missing' },
  ]);
  // Deployment tab = the full patch × endpoint matrix (every patch on every endpoint).
  const [patchInstallations, setPatchInstallations] = useState<PatchInstallation[]>(() => buildRegistryDeploymentMatrix());
  const handleInstallPatch = (agentIds: string[]) => {
    setPatchInstallations((prev) => {
      // Matrix semantics: installing on an endpoint pushes EVERY patch in this deployment to it,
      // so one row is created per (patch, endpoint) pair that doesn't exist yet.
      const existing = new Set(prev.map((r) => `${r.patchId ?? ''}:${r.agentId}`));
      const toAdd: PatchInstallation[] = [];
      agentIds.forEach((id) => {
        const c = patchComputers.find((x) => x.id === id);
        DEPLOYED_PATCHES.forEach((p) => {
          if (existing.has(`${p.id}:${id}`)) return;
          toAdd.push({
            id: `INST-${p.id}-${id}`,
            agentId: id,
            hostName: c?.hostName ?? id,
            ipAddress: c?.ipAddress ?? '---',
            configType: 'Install',
            deploymentDate: '---',
            installationStatus: 'Yet to Receive' as const,
            retryStatus: 0,
            downloadStatus: 'Success',
            taskType: 'Manual Remote Deployment',
            patchId: p.id,
            patchName: p.name,
            patchSeverity: p.severity,
            result: '---',
          });
        });
      });
      return [...toAdd, ...prev];
    });
    const n = agentIds.length;
    toast.success(`${n} computer${n > 1 ? 's' : ''} queued for install`);
  };
  const handleInstallationSuccess = (agentId: string) => {
    setPatchComputers((prev) => prev.map((c) => (c.id === agentId ? { ...c, bucket: 'Installed' } : c)));
  };

  // Conversation count - total messages in conversation tab (includes old activities when expanded)
  const conversationCount = 16;
  
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
  const [activeGroup, setActiveGroup] = useState<'properties' | 'activity' | 'suggestions' | 'chatbot' | 'users' | 'notes' | 'affected-products' | 'file-details'>('properties');
  const [pinnedFields, setPinnedFields] = useState<string[]>([]);
  const [showPropertiesSearch, setShowPropertiesSearch] = useState(true);
  const [propertiesSearchQuery, setPropertiesSearchQuery] = useState('');
  const [showPropertiesFilter, setShowPropertiesFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'empty' | 'filled' | 'required'>('all');
  
  // Accordion States
  const [pinnedFieldsExpanded, setPinnedFieldsExpanded] = useState(true);
  const [slaStatusExpanded, setSlaStatusExpanded] = useState(true);
  const [ticketFieldsExpanded, setTicketFieldsExpanded] = useState(true);
  const [requesterInfoExpanded, setRequesterInfoExpanded] = useState(true);
  const [additionalFieldsExpanded, setAdditionalFieldsExpanded] = useState(false);
  const [workTrackerExpanded, setWorkTrackerExpanded] = useState(false);
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);
  const [similarTicketExpanded, setSimilarTicketExpanded] = useState(true);
  const [suggestedKnowledgeExpanded, setSuggestedKnowledgeExpanded] = useState(true);
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState(true);
  const [isRefreshingAiSummary, setIsRefreshingAiSummary] = useState(false);
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
  const getGroupTitleWrapper = () => (activeGroup === 'properties' ? 'Registry Deployment Properties' : activeGroup === 'activity' ? 'Attachments' : activeGroup === 'affected-products' ? 'Affected Products' : activeGroup === 'file-details' ? 'File Details' : getGroupTitle(activeGroup));
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
    const query = propertiesSearchQuery.toLowerCase();
    // Patch-family pages render their own read-only field set (Patch / Deployment / Package /
    // Registry / Endpoint / CVE), which AssetFields filters internally — so never gate the
    // accordion on the ASSET label list here or a real match would be hidden.
    return true;
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
    // Agent Information block fields (asset page).
    return 'agent information'.includes(query) || AGENT_FIELD_LABELS.some(f => f.toLowerCase().includes(query));
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

  // Onboarding - shows once per session, resets on page refresh
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (!hasSeenOnboarding && activeTicketId) {
      setActiveGroup('properties'); // Open ticket properties by default for first-time users
      /* first-visit tour is TICKET-page-only — other detail pages never auto-open it */
    }
  }, [activeTicketId]);

  // Reset to properties when ticket changes (only after onboarding is complete)
  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem('hasSeenTicketDetailsOnboarding');
    if (hasSeenOnboarding && activeTicketId) {
      setActiveGroup('properties');
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

      // Patch detail tabs — Overview (properties) · Vulnerabilities · Endpoint (computers) ·
      // Installation · Superseded · Audit Trail.
      // Approvals, Relationship, Relations and Financials were removed for the Patch page.
      // Deployment page: no Vulnerabilities / Superseded tabs (those belong to the Patch page);
      // "packages" = the software packages this deployment installs (after Endpoint).
      let allTabs: string[] = ['properties', 'computers', 'registry', 'installation', 'audit'];

      const containerWidth = tabContainerRef.current.offsetWidth;
      const paddingLeft = 24; // 6 * 4 = 24px
      const paddingRight = 24;
      const gap = 10; // gap-2.5 = 10px
      // moreButtonWidth is computed after tabWidths below — the More button relabels to the
      
      // Approximate widths for each tab (in pixels)
      const tabWidths: Record<string, number> = {
        'overview': 80,
        'properties': 85,
        'hardware': 85,
        'software': 80,
        'consolidated': 165,
        'installation': 100,
        'meter': 70,
        'baseline': 80,
        'relationship': 95,
        'financials': 85,
        'service-request': 130,
        'conversation': 105,
        'tasks': 60,
        'approvals': 85,
        'relations': 80,
        'computers': 100,
        'registry': 85,
        'vulnerabilities': 120,
        'superseded': 110,
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

  // Asset detail page opens on the Overview tab by default.
  useEffect(() => {
    if (activeAsset) setActiveMainTab('properties');
  }, [activeAssetId]);

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
            {/* Deployment KPIs — Status · Task Type · Deployment Date · Install After · Expiry
                Date: the run’s lifecycle state, how it was raised, and its schedule window. */}
            {(() => {
              const items: HeaderKpiItem[] = [];
              const dep = activePatchRecord?.deployment;

              // Lifecycle status — same dot colors as the Patch Deployments list.
              const status = dep?.status ?? 'Ready to Deploy';
              const statusColor = ({ 'Ready to Deploy': '#3D8BD0', 'In Progress': '#F59E0B', 'Completed': '#22A06B', 'Expired': '#EF4444', 'Draft': '#94A3B8', 'Cancelled': '#6B7280' } as Record<string, string>)[status] ?? '#6B7280';
              items.push({ key: 'status', tip: `Status: ${status}`, node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Status</span>
                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
                  <span className="text-[12px] font-medium text-[#364658]">{status}</span>
                </span>
              ) });

              // How the run was raised — kept in step with the Task Type row in Key Information.
              const taskType = 'Manual Remote Deployment';
              items.push({ key: 'task-type', tip: `Task Type: ${taskType}`, node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Task Type</span>
                  <span className="text-[12px] font-medium text-[#364658]">{taskType}</span>
                </span>
              ) });

              // Schedule window — 'Tue, Jul 21, 2026 09:00 PM' → 'Jul 21, 2026 09:00 PM'
              // (weekday trimmed, TIME kept — the install window hour matters for a deployment).
              const shortDT = (v: string) => v.replace(/^[A-Za-z]{3},\s*/, '');
              const installAfter = dep?.installAfter ?? activePatchRecord?.releaseDate ?? null;

              const depBase = installAfter ?? dep?.expiryDate ?? null;
              let depDate: string | null = null;
              if (depBase) {
                const dt = new Date(depBase.replace(/^[A-Za-z]{3},\s*/, ''));
                if (!Number.isNaN(dt.getTime())) {
                  const n = Number((activeTicket.id ?? '').replace(/\D/g, '')) || 0;
                  dt.setDate(dt.getDate() - (2 + (n % 5)));
                  depDate = dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                }
              }
              items.push({ key: 'deployment-date', tip: depDate ? `Deployment Date: ${depDate} — when this run was created` : 'Deployment Date: not created yet', node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Deployment Date</span>
                  <span className={`text-[12px] font-medium ${depDate ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{depDate ?? '---'}</span>
                </span>
              ) });
              items.push({ key: 'install-after', tip: installAfter ? `Install After: ${installAfter}` : 'Install After: not scheduled — deploys immediately', node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Install After</span>
                  <span className={`text-[12px] font-medium ${installAfter ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{installAfter ? shortDT(installAfter) : 'Immediate'}</span>
                </span>
              ) });

              // Deadline — red once the window has lapsed (real clock, matches the Expired status).
              const expiry = dep?.expiryDate ?? null;
              const expired = expiry ? new Date(expiry.replace(/^[A-Za-z]{3},\s*/, '')) < new Date() : false;
              items.push({ key: 'expiry', tip: expiry ? `Expiry Date: ${expiry}${expired ? ' (window lapsed)' : ''}` : 'Expiry Date: no expiry — the deployment window stays open', node: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] text-[#7B8FA5]">Expiry Date</span>
                  <span className={`text-[12px] font-medium ${expiry ? (expired ? 'text-[#DC2626]' : 'text-[#364658]') : 'text-[#9CA3AF]'}`}>{expiry ? shortDT(expiry) : '---'}</span>
                </span>
              ) });

              return <HeaderKpiRow items={items} />;
            })()}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <HeaderCopyButton variant="link" value={activeAsset?.id ?? ''} label="Copy Asset URL" />
            <button title="Edit" className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]">
              <Edit size={16} className="text-[#6b7280]" />
            </button>
            {/* Refresh — deployments aren't approved/declined here (that happens on the Patch
                page); the useful header action is refreshing the rollout status. */}
            <button
              title="Refresh"
              onClick={() => toast.success('Deployment status refreshed')}
              className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"
            >
              <RefreshCw size={16} className="text-[#6b7280]" />
            </button>
            <HardwareAssetActionsMenu
              patchDeploy
              onOpenApprovalPopup={() => {
                setShowCreateApprovalPopup(true);
                setActiveMainTab('approvals');
              }}
              onOpenAddBarcode={() => setShowAddBarcodePopup(true)}
            />
          </div>
        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="flex flex-1 overflow-hidden" data-onboarding-container>
          {/* Left Content */}
          <div className="flex-1 flex flex-col relative min-w-0" data-onboarding="main-workspace">
            {/* Scrollable Content Area — the Superseded tab is a full-height React Flow map
                (like the CMDB Dependency Map), so it must NOT scroll: become a flex column with
                overflow-hidden there so the map fills EXACTLY (its controls never clip) and no
                gutter/scrollbar appears. */}
            <div className={activeMainTab === 'superseded' ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'flex-1 overflow-y-auto'}>
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

            {/* Tabs: Conversation, Task, etc. */}
            <div className="border-b border-[#e5e7eb] bg-white sticky top-0 z-99">
              <div ref={tabContainerRef} className="flex items-center gap-2.5 px-6 relative overflow-x-clip">
                {(() => {
                  const tabConfig = [
                    { id: 'properties', label: 'Properties' },
                    { id: 'computers', label: 'Endpoint' },
                    { id: 'registry', label: 'Registry' },
                    { id: 'installation', label: 'Deployment' },
                    { id: 'audit', label: 'Audit Trail' },
                  ].filter(tab => tab.condition !== false);

                  const allowedTabIds = tabConfig.map(tab => tab.id);
                  const filteredVisibleTabs = visibleTabs.filter(tabId => allowedTabIds.includes(tabId));
                  const filteredOverflowTabs = overflowTabs.filter(tabId => allowedTabIds.includes(tabId));

                  const tabLabels: Record<string, string> = {
                    'overview': 'Overview',
                    'properties': 'Overview',
                    'hardware': 'Hardware',
                    'software': 'Software',
                    'consolidated': 'Consolidated Software',
                    'installation': 'Deployment',
                    'meter': 'Meter',
                    'baseline': 'Baseline',
                    'relationship': 'Relationship',
                    'financials': 'Financials',
                    'service-request': 'Service Request',
                    'approvals': 'Approvals',
                    'relations': 'Relations',
                    'computers': 'Endpoint',
                    'registry': 'Registry',
                    'vulnerabilities': 'Vulnerabilities',
                    'superseded': 'Superseded',
                    'audit': 'Audit Trail'
                  };

                  const renderTab = (tabId: string) => (
                    <button
                      key={tabId}
                      className={`px-2 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${activeMainTab === tabId ? 'text-[#3D8BD0] border-[#3D8BD0]' : 'text-[#6b7280] border-transparent hover:bg-[#F5F7FA] hover:text-[#364658] hover:border-[#CBD5E1]'}`}
                      onClick={() => setActiveMainTab(tabId as any)}
                    >
                      {tabLabels[tabId]}
                      {tabId === 'conversation' && activeTicket?.id !== 'INC-32' && activeTicket?.id !== 'INC-35' && (
                        <span className="text-[12px] font-medium text-[#364658] bg-[#E5E7EB] px-1 py-0.5 rounded">
                          {conversationCount}
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
            {activeMainTab === 'overview' && (
            <div className="px-6 py-6 space-y-4">
              {/* License & compliance — the headline status for a software asset */}
              <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[#364658]">License &amp; compliance</h3>
                </div>
                <div className={`grid ${drawerWidth > 1380 ? 'grid-cols-4' : drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  {[
                    { label: 'License', value: 'Active', color: '#22A06B', dot: true },
                    { label: 'Compliance', value: 'Compliant', color: '#22A06B' },
                    { label: 'Patch Status', value: 'Up to date', color: '#22A06B' },
                    { label: 'Reclaimable Seats', value: '8 unused', color: '#D97706', dot: true },
                  ].map((c) => (
                    <div key={c.label} className="bg-[#F9FAFB] rounded-lg p-3">
                      <div className="text-[12px] text-[#7B8FA5] mb-1 flex items-center gap-1.5">
                        {c.dot && <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />}
                        {c.label}
                      </div>
                      <div className="text-[13px] font-semibold" style={{ color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* License + Installation + Versions snapshots — one row */}
              <div className={`grid ${drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-1'} gap-4 items-stretch`}>
                <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[#364658]">License snapshot</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      ['Total Seats', '150', '#364658'],
                      ['Used', '94', '#364658'],
                      ['Available', '56', '#22A06B'],
                      ['Expiry Date', 'Jul 14, 2026', '#D97706'],
                    ].map(([l, v, color]) => (
                      <div key={l} className="flex items-start gap-3">
                        <span className="text-[12px] text-[#64748B] flex-shrink-0 w-[100px]">{l}</span>
                        <span className="text-[13px] font-medium flex-1 min-w-0 break-words" style={{ color }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[#364658]">Installation snapshot</h3>
                    <button onClick={() => setActiveMainTab('installation')} className="text-[13px] text-[#3D8BD0] hover:underline font-medium flex items-center gap-1">View more<ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {[
                      ['Total Installs', '42', '#364658'],
                      ['Laptops', '28', '#364658'],
                      ['Desktops', '11', '#364658'],
                      ['Servers', '3', '#364658'],
                    ].map(([l, v, color]) => (
                      <div key={l} className="flex items-start gap-3">
                        <span className="text-[12px] text-[#64748B] flex-shrink-0 w-[100px]">{l}</span>
                        <span className="text-[13px] font-medium flex-1 min-w-0 break-words" style={{ color }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[#364658]">Versions snapshot</h3>
                    <button onClick={() => setActiveMainTab('consolidated')} className="text-[13px] text-[#3D8BD0] hover:underline font-medium flex items-center gap-1">View more<ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {[
                      ['Versions', '5', '#364658'],
                      ['Latest', '150.1', '#22A06B'],
                      ['Outdated', '12', '#D97706'],
                      ['Prohibited', '1', '#DC2626'],
                    ].map(([l, v, color]) => (
                      <div key={l} className="flex items-start gap-3">
                        <span className="text-[12px] text-[#64748B] flex-shrink-0 w-[100px]">{l}</span>
                        <span className="text-[13px] font-medium flex-1 min-w-0 break-words" style={{ color }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost snapshot + Software details */}
              <div className={`grid ${drawerWidth > 1080 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[#364658]">Cost snapshot</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[['Total Cost', '$12,400'], ['Cost / Seat', '$82'], ['Annual', '$4,200']].map(([l, v]) => (
                      <div key={l} className="bg-[#F9FAFB] rounded-lg p-3">
                        <div className="text-[12px] text-[#7B8FA5] mb-1">{l}</div>
                        <div className="text-[15px] font-semibold text-[#364658]">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[#364658]">Software details</h3>
                    <button onClick={() => setActiveMainTab('properties')} className="text-[13px] text-[#3D8BD0] hover:underline font-medium flex items-center gap-1">View more<ChevronRight size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Publisher', 'Microsoft Corporation'],
                      ['Category', 'Web Browser'],
                      ['License Type', 'Subscription'],
                      ['First Detected', 'May 18, 2026'],
                      ['Last Audit', 'Jun 02, 2026'],
                      ['Software Type', 'Managed'],
                    ].map(([l, v]) => (
                      <div key={l} className="min-w-0">
                        <div className="text-[12px] text-[#64748B] mb-0.5">{l}</div>
                        <div className="text-[13px] font-medium text-[#364658] break-words">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
            )}

            {/* Current Location — map popup */}
            {showLocationMap && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowLocationMap(false)}
              >
                <div
                  className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#3D8BD0]" />
                      <h3 className="text-[14px] font-semibold text-[#364658]">Current Location — Ahmedabad (India)</h3>
                    </div>
                    <button
                      onClick={() => setShowLocationMap(false)}
                      className="text-[#7B8FA5] hover:text-[#364658] hover:bg-[#F3F4F6] rounded p-1 transition-colors"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-5">
                    <iframe
                      title="Asset location map"
                      className="w-full h-[420px] rounded-lg border border-[#E5E7EB]"
                      loading="lazy"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=44%2C-2%2C128%2C46&layer=mapnik&marker=23.0225%2C72.5714"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[12px] text-[#64748B]">Ahmedabad, Gujarat, India · 23.0225° N, 72.5714° E</span>
                      <a
                        href="https://www.openstreetmap.org/?mlat=23.0225&mlon=72.5714#map=12/23.0225/72.5714"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-[#3D8BD0] hover:underline"
                      >
                        Open in OpenStreetMap
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Location — history side drawer (same pattern as SLA History) */}
            {showLocationHistory && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/30 z-[10000] transition-opacity duration-300"
                  onClick={() => setShowLocationHistory(false)}
                />
                {/* Side Drawer */}
                <div
                  className="fixed top-0 right-0 h-full w-[440px] max-w-[90vw] bg-white shadow-2xl z-[10001] flex flex-col transition-transform duration-300"
                  style={{ transform: showLocationHistory ? 'translateX(0)' : 'translateX(100%)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-[#3D8BD0]" />
                      <h2 className="text-[18px] font-semibold text-[#111827]">Location History</h2>
                    </div>
                    <button
                      onClick={() => setShowLocationHistory(false)}
                      className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {/* Timeline */}
                  <div className="flex-1 overflow-auto px-6 py-5">
                    <div className="space-y-0">
                      {[
                        { name: 'Ahmedabad (India)', period: 'Since 12 Jan 2026', by: 'Riya Shah', current: true },
                        { name: 'Mumbai (India)', period: '04 Aug 2024 – 12 Jan 2026', by: 'Karan Mehta', current: false },
                        { name: 'Pune (India)', period: '17 Mar 2023 – 04 Aug 2024', by: 'Amit Verma', current: false },
                        { name: 'Bengaluru (India)', period: '02 Sep 2022 – 17 Mar 2023', by: 'System (provisioning)', current: false },
                      ].map((h, i, arr) => (
                        <div key={h.name + h.period} className="flex gap-3">
                          {/* timeline rail */}
                          <div className="flex flex-col items-center">
                            <span className={`mt-1 size-2.5 rounded-full flex-shrink-0 ${h.current ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`} />
                            {i < arr.length - 1 && <span className="w-px flex-1 bg-[#E5E7EB]" />}
                          </div>
                          <div className={`min-w-0 ${i < arr.length - 1 ? 'pb-4' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-[#364658]">{h.name}</span>
                              {h.current && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EAF3FB] text-[#3D8BD0]">Current</span>
                              )}
                            </div>
                            <div className="text-[12px] text-[#64748B] mt-0.5">{h.period}</div>
                            <div className="text-[11px] text-[#9CA3AF] mt-0.5">Updated by {h.by}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMainTab === 'properties' && (
            <div className="px-6 py-6">
              {/* Description — OPTIONAL. Only some patches carry release notes, so this renders
                  nothing at all when absent (no empty band). Clamped to 2 lines with View more. */}
              {activePatchRecord?.description && (() => {
                const text = activePatchRecord.description!;
                const isLong = text.length > 160;
                return (
                  <div className="mb-6 bg-white rounded-lg border border-[#E5E7EB] p-4">
                    <h3 className="text-[14px] font-semibold text-[#364658] mb-2">Description</h3>
                    <p className={`text-[13px] text-[#364658] leading-relaxed whitespace-pre-line ${!descExpanded && isLong ? 'line-clamp-2' : ''}`}>
                      {text}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-1.5 text-[13px] text-[#3D8BD0] hover:text-[#2E6BA4] font-medium inline-flex items-center gap-1"
                      >
                        {descExpanded ? 'View less' : 'View more'}
                        {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* KPI strip — each card shows a headline count plus its own distribution as a
                  stacked bar + legend (far easier to read at this size than a pie), and each card
                  is clickable, jumping to the tab / right-panel group that owns the detail. */}
              {(() => {
                const wide = drawerWidth > 1080;

                type Seg = { label: string; value: number; color: string };
                type Kpi = {
                  key: string; label: string; icon: typeof Activity; color: string;
                  total: number; segments?: Seg[]; note?: string;
                  /** 'donut' = gauge + legend (same treatment as the Software Installation snapshot);
                   *  'list'  = the first 2 records inline (same as the Hardware "Users" card). */
                  chart: 'donut' | 'bar' | 'none' | 'list';
                  /** Preview rows for chart: 'list'. */
                  items?: { icon: React.ReactNode; primary: string; secondary: string; actions?: React.ReactNode }[];
                  /** Spans half the row instead of a third. */
                  half?: boolean;
                  onClick: () => void;
                };

                // Patches in this deployment, broken down by severity for the Overview donut.
                const patchSev = (s: string) => DEPLOYED_PATCHES.filter((p) => p.severity === s).length;
                const patchCritical = patchSev('Critical');
                const patchImportant = patchSev('Important');
                const patchModerate = patchSev('Moderate');
                const patchLow = patchSev('Low');

                const epMissing = patchComputers.filter((c) => c.bucket === 'Missing').length;
                const epInstalled = patchComputers.filter((c) => c.bucket === 'Installed').length;
                const epIgnored = patchComputers.filter((c) => c.bucket === 'Ignored').length;

                const dep = (s: string) => patchInstallations.filter((r) => r.installationStatus === s).length;
                const depSuccess = dep('Success');
                const depFailed = dep('Failed');
                const depProgress = dep('In Progress');
                const depOther = patchInstallations.length - depSuccess - depFailed - depProgress;

                const kpis: Kpi[] = [
                  {
                    // Registry configurations this run applies, split by root hive.
                    key: 'patches', label: 'Registry', icon: Package, color: '#3D8BD0',
                    chart: 'donut', total: REGISTRY_ENTRIES.length,
                    segments: [
                      { label: 'HKEY_LOCAL_MACHINE', value: REGISTRY_ENTRIES.filter((r) => r.hive === 'HKEY_LOCAL_MACHINE').length, color: '#3D8BD0' },
                      { label: 'HKEY_CURRENT_USER', value: REGISTRY_ENTRIES.filter((r) => r.hive === 'HKEY_CURRENT_USER').length, color: '#8B5CF6' },
                    ],
                    onClick: () => setActiveMainTab('registry'),
                  },
                  {
                    key: 'endpoints', label: 'Endpoints', icon: Monitor, color: '#3D8BD0',
                    chart: 'donut', total: patchComputers.length,
                    segments: [
                      { label: 'Missing', value: epMissing, color: '#F59E0B' },
                      { label: 'Installed', value: epInstalled, color: '#22C55E' },
                      { label: 'Ignored', value: epIgnored, color: '#94A3B8' },
                    ],
                    onClick: () => setActiveMainTab('computers'),
                  },
                  {
                    key: 'deployments', label: 'Deployments', icon: Download, color: '#8B5CF6',
                    chart: 'donut', total: patchInstallations.length,
                    segments: [
                      { label: 'Success', value: depSuccess, color: '#22C55E' },
                      { label: 'Failed', value: depFailed, color: '#EF4444' },
                      { label: 'In Progress', value: depProgress, color: '#F59E0B' },
                      { label: 'Others', value: depOther, color: '#94A3B8' },
                    ],
                    onClick: () => setActiveMainTab('installation'),
                  },
                  // Deployment Overview: no Affected Products / Files preview cards — those are
                  // patch-catalog details (and their right-rail groups don't exist on this page).
                ];

                const patchesKpi = kpis.find((k) => k.key === 'patches')!;
                const endpointsKpi = kpis.find((k) => k.key === 'endpoints')!;

                return (
                  <>
                    {/* Row 1 — Patches + Endpoints in DIFFERENT forms (columns · bar list) so the
                        pair doesn't repeat the same chart. (No Vulnerabilities card: the package
                        flow has no Vulnerabilities tab to drill into.) */}
                    <div className={`grid gap-4 ${wide ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {/* No category/status split exists for registry configurations or their
                          targets — the cards show the COUNT plus the actual records. */}
                      <CountPreviewKpiCard label='Registry' icon={Package} color='#3D8BD0' total={REGISTRY_ENTRIES.length} unit='registry configurations' items={REGISTRY_ENTRIES.map((r) => ({ title: r.name }))} onClick={() => setActiveMainTab('registry')} />
                      <CountPreviewKpiCard label='Endpoints' icon={Monitor} color='#22A06B' total={patchComputers.length} unit='endpoints targeted' items={patchComputers.map((c) => ({ title: c.hostName, sub: c.ipAddress }))} onClick={() => setActiveMainTab('computers')} />
                    </div>

                    {/* Deployment group — ONE bordered section holding the overall status (4 stat
                        cards) plus both drill-downs (by category, by remote office), so all the
                        deployment context reads as one block. */}
                    <div className="mt-5 rounded-xl border border-[#E5E7EB] p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: '#8B5CF61A', color: '#8B5CF6' }}>
                          <Download size={15} />
                        </span>
                        <h3 className="text-[15px] font-semibold text-[#364658]">Deployment</h3>
                        <button onClick={() => setActiveMainTab('installation')} className="ml-auto flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
                          View more<ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Two columns: the overall status tiles (2×2) beside the by-office
                          drill-down. Keeping the drill-down half-width stops its label/value pairs
                          from being stretched to opposite edges, and the tiles fill the height so
                          both columns end flush. (No "by Category" card — packages have no
                          category taxonomy the way patches do.) */}
                      <div className={`grid gap-4 ${wide ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="grid grid-cols-2 gap-4">
                          {BREAKDOWN_STATUSES.map((s) => {
                            const val = s.key === 'success' ? depSuccess : s.key === 'failed' ? depFailed : s.key === 'inProgress' ? depProgress : depOther;
                            return (
                              <div key={s.key} className="flex h-full flex-col items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-5 text-center">
                                <div className="inline-flex items-center gap-1.5 text-[13px] text-[#64748B]">
                                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                  {s.label}
                                </div>
                                <div className="mt-2 text-[24px] font-bold leading-none tabular-nums" style={{ color: val > 0 ? s.color : '#94A3B8' }}>{val}</div>
                              </div>
                            );
                          })}
                        </div>
                        <StatusBreakdownCard title="Status by Remote Office" icon={MapPin} data={STATUS_BY_REMOTE_OFFICE} totalLabel="Total Installations" allLabel="All Remote Offices" />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            )}


            {activeMainTab === 'hardware' && (() => {
              type Rec = [string, string][];
              const hardwareCategories: { id: string; label: string; addable?: boolean; summary?: [string, string][]; items: Rec[] }[] = [
                { id: 'computer-system', label: 'Computer System', items: [[
                  ['Name', 'DESKTOP-7ABJPOF'],
                  ['Domain Name', 'WORKGROUP'],
                  ['Manufacturer', 'LENOVO'],
                  ['Model Name', '20NRS08A00'],
                  ['System Family', 'ThinkPad L390'],
                  ['System Type', 'x64-based PC'],
                  ['PC System Type', 'Mobile'],
                  ['UUID', '2BA4E3CC-2326-11B2-A85C-F7CA1D29E093'],
                  ['Boot Up State', 'Normal boot'],
                  ['Number Of Logical Processors', '8'],
                  ['Number Of Processors', '1'],
                  ['Device Status', 'Ok'],
                  ['Part Of Domain', 'No'],
                  ['User Name', 'DESKTOP-7ABJPOF\\j.doe'],
                  ['Last Reboot Time', 'Mon, May 18, 2026 10:28 AM'],
                  ['Description', 'AT/AT COMPATIBLE'],
                  ['Asset Replacement', '---'],
                ]] },
                { id: 'os', label: 'OS', items: [[
                  ['Manufacturer', 'Microsoft Corporation'],
                  ['OS Name', 'Microsoft Windows 11 Pro'],
                  ['OS Version', '10.0.26100'],
                  ['OS Architecture', '64 BIT'],
                  ['Product Key', '00330-52522-70557-AAOEM'],
                  ['License Key', 'WJRNT-PD98V-89FHW-KPWYJ-9TPKC'],
                  ['Activation Status', 'Licensed'],
                  ['Installed Date', 'Thu, Sep 18, 2025 05:30 AM'],
                  ['Display Version', '24H2'],
                  ['Build No', '26100.6899'],
                  ['End Of Active Support Date', '13/10/2026'],
                  ['End Of Life Date', '13/10/2026'],
                ]] },
                { id: 'bios', label: 'BIOS', items: [[
                  ['Name', 'R10ET62W (1.47 )'],
                  ['Manufacturer', 'LENOVO'],
                  ['SM BIOS Version', 'R10ET62W (1.47 )'],
                  ['Release Date', '16/04/2024'],
                  ['Device Status', 'Ok'],
                  ['Version', 'LENOVO - 1470'],
                  ['Serial Number', 'R90X70MP'],
                  ['Description', 'R10ET62W (1.47 )'],
                ]] },
                { id: 'ram', label: 'RAM', addable: true,
                  summary: [
                    ['Total slots', '1'],
                    ['Free slots', '0'],
                    ['Occupied slots', '1'],
                    ['Total RAM Size (GB)', '40.00'],
                  ],
                  items: [
                    [
                      ['Serial Number', 'reqwewer'],
                      ['Manufacturer', 'Musarubra US LLC'],
                      ['Size', '32.00 GB'],
                      ['Memory Type', 'RAM'],
                      ['Width', '64 Bit'],
                      ['Clock Speed', '2400.00 MHz'],
                      ['Bank Locater', 'channal A'],
                    ],
                    [
                      ['Serial Number', '34F2A4B5'],
                      ['Manufacturer', 'Samsung'],
                      ['Size', '8.00 GB'],
                      ['Memory Type', 'Unknown'],
                      ['Width', '64 Bit'],
                      ['Clock Speed', '2400.00 MHz'],
                      ['Bank Locater', 'ChannelA-DIMM0'],
                    ],
                  ] },
                { id: 'processor', label: 'Processor', addable: true, items: [[
                  ['Manufacturer', 'GenuineIntel'],
                  ['Processor Name', 'Intel(R) Core(TM) i5-8365U CPU @ 1.60GHz'],
                  ['Width', '64 Bit'],
                  ['CPU Speed', '1.90 GHz'],
                  ['Core Count', '4'],
                  ['External Clock', '100.00 MHz'],
                  ['L1 Cache Size', '0.25 MB'],
                  ['L2 Cache Size', '1.00 MB'],
                  ['L3 Cache Size', '6.00 MB'],
                  ['Family', 'Intel(R) Core(TM) i5 processor'],
                  ['Description', 'Intel64 Family 6 Model 142 Stepping 12'],
                  ['Device Id', 'CPU0'],
                  ['Socket Designation', 'U3E1'],
                ]] },
                { id: 'network-adapter', label: 'Network Adapter', addable: true, items: [
                  [
                    ['Manufacturer', 'Microsoft'],
                    ['MAC Address', 'C8:09:A8:65:58:EB'],
                    ['Device Status', 'Unknown'],
                    ['IP Address', '---'],
                    ['DNS Domain', '---'],
                    ['DNS Host Name', '---'],
                    ['DNS Server Search Orders', '---'],
                    ['DHCP Enable', 'No'],
                    ['DHCP Lease Obtained', '---'],
                    ['DHCP Lease Expires', '---'],
                    ['DHCP Server', '---'],
                    ['Default IP Gateway', '---'],
                    ['IP Subnet', '---'],
                    ['Connection Status', 'Media Disconnected'],
                    ['Description', 'Bluetooth Device (Personal Area Network)'],
                  ],
                  [
                    ['Manufacturer', 'Intel Corporation'],
                    ['MAC Address', 'C8:09:A8:65:58:E7'],
                    ['Device Status', 'Unknown'],
                    ['IP Address', 'fe80::99a9:9659:da7e:60ad, 192.168.1.60'],
                    ['DNS Domain', '---'],
                    ['DNS Host Name', 'DESKTOP-7ABJPOF'],
                    ['DNS Server Search Orders', '192.168.1.1'],
                    ['DHCP Enable', 'No'],
                    ['DHCP Lease Obtained', '---'],
                    ['DHCP Lease Expires', '---'],
                    ['DHCP Server', '192.168.1.1'],
                    ['Default IP Gateway', '192.168.1.1'],
                    ['IP Subnet', '255.255.255.0, ffff:ffff:ffff:ffff::'],
                    ['Connection Status', 'Connected'],
                    ['Description', 'Intel(R) Wireless-AC 9560 160MHz'],
                  ],
                  [
                    ['Manufacturer', 'Intel'],
                    ['MAC Address', '48:2A:E3:71:82:95'],
                    ['Device Status', 'Unknown'],
                    ['IP Address', '---'],
                    ['DNS Domain', '---'],
                    ['DNS Host Name', '---'],
                    ['DNS Server Search Orders', '---'],
                    ['DHCP Enable', 'No'],
                    ['DHCP Lease Obtained', '---'],
                    ['DHCP Lease Expires', '---'],
                    ['DHCP Server', '---'],
                    ['Default IP Gateway', '---'],
                    ['IP Subnet', '---'],
                    ['Connection Status', 'Media Disconnected'],
                    ['Description', 'Intel(R) Ethernet Connection (6) I219-LM'],
                  ],
                ] },
                { id: 'motherboard', label: 'Motherboard', items: [[
                  ['Manufacturer', 'LENOVO'],
                  ['Serial Number', 'W1KS9CT102C'],
                  ['Version', 'SDK0J40697 WIN'],
                  ['Installed Date', '---'],
                  ['Part Number', '---'],
                  ['Primary Bus Type', 'PCI'],
                  ['Secondary Bus Type', 'ISA'],
                  ['Device Status', 'Ok'],
                ]] },
                { id: 'physical-disk', label: 'Physical Disk', addable: true, items: [[
                  ['Name', '\\\\.\\PHYSICALDRIVE0'],
                  ['Manufacturer', '(Standard disk drives)'],
                  ['Size', '238.47 GB'],
                  ['Installed Date', '---'],
                  ['Device Status', 'Ok'],
                  ['Partition', '3'],
                  ['Media Type', 'Fixed hard disk media'],
                  ['Model', 'INTEL SSDPEKKF256G8L'],
                  ['Interface Type', 'SCSI'],
                  ['Serial Number', '5CD2_E42C_91A0_59CD.'],
                  ['PNP Device ID', 'SCSI\\DISK&VEN_NVME&PROD_INTEL_SSDPEKKF2...'],
                  ['Description', 'Disk drive'],
                  ['Storage Device Type', 'SSD'],
                ]] },
                { id: 'logical-disk', label: 'Logical Disk', addable: true, items: [[
                  ['Name', 'C:'],
                  ['File System Type', 'NTFS'],
                  ['Drive Type', 'Local Disk'],
                  ['Serial Number', 'F091C280'],
                  ['Device Status', 'Unknown'],
                  ['Size', '237.44 GB'],
                  ['Free Space', '138.29 GB'],
                  ['Description', 'Local Fixed Disk'],
                ]] },
                { id: 'monitor', label: 'Monitor', addable: true, items: [[
                  ['Manufacturer', 'LEN'],
                  ['Monitor Type', '---'],
                  ['Size', '13.23'],
                  ['Device Status', '---'],
                  ['Serial Number', '0'],
                  ['Installed Date', '---'],
                  ['PNP Device ID', '---'],
                  ['Screen Height', '17'],
                  ['Screen Width', '29'],
                  ['Week of Manufacture', '20'],
                  ['Year of Manufacture', '2017'],
                  ['Description', '---'],
                  ['Monitor Tag', '---'],
                ]] },
                { id: 'keyboard', label: 'Keyboard', addable: true, items: [[
                  ['Name', 'Enhanced (101- or 102-key)'],
                  ['Manufacturer', '---'],
                  ['Installed Date', '---'],
                  ['PNP Device ID', 'ACPI\\LEN0071\\4&254DEA5B&0'],
                  ['Device Status', 'Ok'],
                  ['Description', 'Standard PS/2 Keyboard'],
                  ['Keyboard Tag', 'Keyboard Serial No'],
                ]] },
                { id: 'pointing-device', label: 'Pointing Device', addable: true, items: [
                  [
                    ['Manufacturer', 'ELAN'],
                    ['Number Of Buttons', '---'],
                    ['Pointing Type', 'Unknown'],
                    ['Device Status', 'Ok'],
                    ['PNP Device ID', 'ACPI\\LEN2137\\4&254DEA5B&0'],
                    ['Description', 'ELAN Input Device For WDF'],
                    ['Mouse Tag', '---'],
                  ],
                  [
                    ['Manufacturer', 'Microsoft'],
                    ['Number Of Buttons', '---'],
                    ['Pointing Type', 'Unknown'],
                    ['Device Status', 'Ok'],
                    ['PNP Device ID', 'HID\\VID_04F3&PID_0000&COL01\\6&BE95B37&0...'],
                    ['Description', 'HID-compliant mouse'],
                    ['Mouse Tag', '---'],
                  ],
                ] },
                { id: 'shared-folder', label: 'Shared Folder', items: [] },
                { id: 'usb-hub', label: 'USB Hub', addable: true, items: [
                  [
                    ['Name', 'USB Root Hub (USB 3.0)'],
                    ['Device Status', 'Ok'],
                    ['Device Status Information', '---'],
                    ['Device ID', 'USB\\ROOT_HUB30\\4&1CA724C0&0&0'],
                    ['Description', 'USB Root Hub (USB 3.0)'],
                  ],
                  [
                    ['Name', 'USB Composite Device'],
                    ['Device Status', 'Ok'],
                    ['Device Status Information', '---'],
                    ['Device ID', 'USB\\VID_04CA&PID_7070\\5&21EED693&0&5'],
                    ['Description', 'USB Composite Device'],
                  ],
                ] },
                { id: 'usb-controller', label: 'USB Controller', addable: true, items: [[
                  ['Name', '---'],
                  ['Manufacturer', '---'],
                  ['Device Status', '---'],
                  ['Device Status Information', '---'],
                  ['Device ID', '---'],
                  ['Description', '---'],
                ]] },
              ];
              const iconFor: Record<string, JSX.Element> = {
                'computer-system': <Monitor className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'os': <Disc className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'bios': <CircuitBoard className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'ram': <MemoryStick className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'processor': <Cpu className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'network-adapter': <Network className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'motherboard': <CircuitBoard className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'physical-disk': <HardDrive className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'logical-disk': <HardDrive className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'monitor': <Monitor className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'keyboard': <Keyboard className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'pointing-device': <Mouse className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'shared-folder': <Folder className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'usb-hub': <Usb className="size-4 text-[#3D8BD0] flex-shrink-0" />,
                'usb-controller': <Usb className="size-4 text-[#3D8BD0] flex-shrink-0" />,
              };
              const isWide = drawerWidth > 1080;
              const navList = hardwareCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (!isWide) setHardwareNavOpen(false);
                    if (typeof document !== 'undefined') {
                      document.getElementById(`hw-section-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-[13px] text-[#364658] hover:bg-[#F5F7FA] transition-colors"
                >
                  {iconFor[c.id]}
                  {c.label}
                </button>
              ));
              const q = hardwareSearch.trim().toLowerCase();
              const sectionsToRender = hardwareCategories
                .map((section) => {
                  const nonRemoved = section.items
                    .map((fields, i) => ({ fields, i }))
                    .filter(({ i }) => !removedHardwareItems.has(`${section.id}:${i}`));
                  const labelMatch = !q || section.label.toLowerCase().includes(q);
                  const matched = nonRemoved
                    .map(({ fields, i }) => ({ i, fields: q && !labelMatch ? fields.filter(([l, v]) => l.toLowerCase().includes(q) || v.toLowerCase().includes(q)) : fields }))
                    .filter(({ fields }) => fields.length > 0);
                  return { section, nonRemoved, matched };
                })
                .filter(({ matched }) => !q || matched.length > 0);
              return (
                <div className="px-6 py-6">
                  {/* Sticky toolbar: jump-to-section + search (sits just below the main tab bar) */}
                  <div className="sticky top-[45px] z-10 -mx-6 px-6 -mt-6 pt-6 pb-3 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setHardwareNavOpen((o) => !o)}
                          title="Jump to section"
                          className="size-8 flex items-center justify-center rounded border border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <List size={16} />
                        </button>
                        {/* Narrow view: overlay dropdown anchored to the icon (no reserved space) */}
                        {hardwareNavOpen && !isWide && (
                          <div className="app-menu absolute top-full left-0 mt-1 z-50 w-[220px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 max-h-[70vh] overflow-y-auto">
                            {navList}
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1 max-w-[360px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                          type="text"
                          placeholder="Search properties..."
                          value={hardwareSearch}
                          onChange={(e) => setHardwareSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-[13px] text-[#364658] bg-white border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2">
                    {/* Wide view: inline left column that reserves space */}
                    {hardwareNavOpen && isWide && (
                      <div className="flex-shrink-0 w-[210px]">
                        <div className="sticky top-[124px] bg-white border border-[#E5E7EB] rounded-lg shadow-sm py-1 max-h-[70vh] overflow-y-auto">
                          {navList}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* All sections stacked, full width */}
                      {q && sectionsToRender.length === 0 ? (
                        <div className="text-[13px] text-[#9CA3AF] py-10 text-center">No properties match your search.</div>
                      ) : (
                      <div className="space-y-8">
                    {sectionsToRender.map(({ section, nonRemoved, matched }) => {
                      const showEmptyState = !q && nonRemoved.length === 0;
                      const itemsToShow = matched;
                      return (
                        <div key={section.id} id={`hw-section-${section.id}`} className="scroll-mt-[132px]">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              {iconFor[section.id]}
                              <h3 className="text-[14px] font-semibold text-[#364658]">{section.label}</h3>
                            </div>
                            {section.addable && (
                              <button
                                title={`Add ${section.label}`}
                                className="size-8 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>

                          {!q && section.summary && (
                            <div className={`grid ${drawerWidth > 1380 ? 'grid-cols-4' : drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-4`}>
                              {section.summary.map(([label, value]) => (
                                <div key={label} className="border border-[#DFE5ED] rounded-lg p-4 bg-white">
                                  <div className="text-[12px] text-[#7B8FA5] mb-1">{label}</div>
                                  <div className="text-[15px] font-semibold text-[#364658]">{value}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {showEmptyState ? (
                            <div className="flex items-center justify-center min-h-[240px] rounded-lg bg-[#F9FAFB]">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center size-16 rounded-full bg-white mb-4">
                                  {iconFor[section.id]}
                                </div>
                                <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No {section.label} Yet</h3>
                                <p className="text-[13px] text-[#7B8FA5] max-w-md mb-4">
                                  Get started by adding {section.label} details to this asset.
                                </p>
                                <button
                                  onClick={() => setRemovedHardwareItems((prev) => {
                                    const next = new Set(prev);
                                    section.items.forEach((_, idx) => next.delete(`${section.id}:${idx}`));
                                    return next;
                                  })}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors"
                                >
                                  <Plus size={16} />
                                  Add {section.label}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {itemsToShow.map(({ fields, i }) => (
                                <div key={i} className="group/hwcard relative rounded-lg p-5 bg-[#F9FAFB]">
                                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/hwcard:opacity-100 transition-opacity">
                                    <button title="Edit" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Edit size={15} /></button>
                                    <button
                                      title="Delete"
                                      onClick={() => setRemovedHardwareItems((prev) => new Set(prev).add(`${section.id}:${i}`))}
                                      className="text-[#7B8FA5] hover:text-[#EF4444]"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                  <div className={`grid ${drawerWidth > 1380 ? 'grid-cols-4' : drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-2'} gap-x-6 gap-y-5`}>
                                    {fields.map(([label, value]) => (
                                      <div key={label} className="min-w-0">
                                        <div className="text-[12px] text-[#64748B] mb-1">{label}</div>
                                        <div className={`text-[13px] font-medium break-words ${value === '---' ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>{value}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Consolidated Software — common software consolidated from the Software Asset list */}
            {activeMainTab === 'consolidated' && (() => {
              const rows = [
                { id: 'AST-353', name: 'Adobe Refresh Manager', version: '1.8.0', group: 'Unassigned', managedBy: { name: 'Unassigned' } as { name: string; initials?: string; color?: string }, created: 'Tue, Sep 23, 2025 01:45 PM' },
                { id: 'AST-339', name: 'Adobe Acrobat (64-bit)', version: '---', group: 'Unassigned', managedBy: { name: 'Unassigned' } as { name: string; initials?: string; color?: string }, created: 'Mon, Sep 22, 2025 02:45 PM' },
                { id: 'AST-318', name: 'Google Chrome', version: '149.0.7827.116', group: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, created: 'Thu, Sep 18, 2025 10:12 AM' },
                { id: 'AST-292', name: '7-Zip 24.09 (x64)', version: '24.09', group: 'Unassigned', managedBy: { name: 'Unassigned' } as { name: string; initials?: string; color?: string }, created: 'Fri, Sep 05, 2025 04:30 PM' },
                { id: 'AST-274', name: 'Notepad++ (64-bit)', version: '8.7.5', group: 'IT Operations', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, created: 'Wed, Aug 27, 2025 09:05 AM' },
              ].map((r, i) => ({ ...r, i })).filter((r) => !removedConsolidated.has(r.i));
              const headers = ['Name', 'Asset Type', 'Status', 'Version', 'Software Type', 'Managed By Group', 'Managed By', 'Created Date', 'Actions'];
              return (
                <div className="px-6 py-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-[12px]">
                      <thead className="bg-white border-b border-[#e5e7eb]">
                        <tr>{headers.map((h) => (<th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {rows.length === 0 ? (
                          <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-[#9CA3AF]">No consolidated software.</td></tr>
                        ) : rows.map((r) => (
                          <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.id}</span>
                                <button className="text-[12px] text-[#3D8BD0] hover:underline max-w-[170px] truncate text-left align-bottom">{r.name}</button>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 text-[#364658]"><Package size={14} className="text-[#6B7280]" />Application</span></td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="size-2 rounded-full bg-[#22C55E]" />In Use</span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.version}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center justify-between gap-2 min-w-[110px] rounded-md border border-[#DFE5ED] px-2.5 py-1.5 text-[#364658]">Managed<ChevronDown size={13} className="text-[#7B8FA5]" /></span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.group}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                {r.managedBy.initials ? (
                                  <span className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium text-white" style={{ backgroundColor: r.managedBy.color }}>{r.managedBy.initials}</span>
                                ) : (
                                  <span className="flex h-6 w-6 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={13} /></span>
                                )}
                                <span className="text-[#364658]">{r.managedBy.name}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.created}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button title="Unconsolidate" onClick={() => setRemovedConsolidated((p) => new Set(p).add(r.i))} className="text-[#EF4444] hover:text-[#DC2626]"><Unlink size={15} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Installation — hardware assets where this software is installed */}
            {/* Legacy Software-clone Installation grid — replaced by PatchInstallationTab below (kept as dead code). */}
            {false && (() => {
              const all = [
                { id: 'LAP-6787', host: 'DESKTOP-JJ3ICI2', type: 'Windows Laptop', ip: '10.190.44.202', group: 'Unassigned', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, created: 'Tue, Apr 28, 2026 11:44 AM' },
                { id: 'LAP-6712', host: 'FIN-LT-0188', type: 'Windows Laptop', ip: '10.20.22.188', group: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, created: 'Mon, Mar 17, 2026 09:20 AM' },
                { id: 'DSK-5521', host: 'OPS-DT-0211', type: 'Windows Desktop', ip: '10.20.21.211', group: 'IT Operations', managedBy: { name: 'Farah Sheikh', initials: 'FS', color: '#A78BFA' }, created: 'Fri, Feb 06, 2026 02:10 PM' },
                { id: 'LAP-6420', host: 'ENG-LT-0312', type: 'Windows Laptop', ip: '10.20.19.112', group: 'IT Operations', managedBy: { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' }, created: 'Wed, Jan 14, 2026 04:45 PM' },
              ];
              const q = installationSearch.trim().toLowerCase();
              const rows = q ? all.filter((r) => r.id.toLowerCase().includes(q) || r.host.toLowerCase().includes(q) || r.ip.includes(q) || r.type.toLowerCase().includes(q)) : all;
              const headers = ['Name', 'Asset Type', 'Status', 'Host Name', 'IP Address', 'Used By', 'Managed By Group', 'Managed By', 'Created Date'];
              return (
                <div className="px-6 py-6">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={installationSearch}
                      onChange={(e) => setInstallationSearch(e.target.value)}
                      placeholder="Select field or enter a keyword to search..."
                      className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                    />
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-[12px]">
                      <thead className="bg-white border-b border-[#e5e7eb]">
                        <tr>{headers.map((h) => (<th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {rows.length === 0 ? (
                          <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-[#9CA3AF]">No installations found.</td></tr>
                        ) : rows.map((r) => (
                          <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.id}</span>
                                <span className="text-[#364658] max-w-[150px] truncate inline-block align-bottom">{r.host}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 text-[#364658]"><Laptop size={14} className="text-[#6B7280]" />{r.type}</span></td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="size-2 rounded-full bg-[#22C55E]" />In Use</span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.host}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.ip}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1 text-[#9ca3af]">---<ChevronDown size={13} /></span></td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.group}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium text-white" style={{ backgroundColor: r.managedBy.color }}>{r.managedBy.initials}</span>
                                <span className="text-[#364658]">{r.managedBy.name}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.created}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end mt-4 text-[12px] text-[#7B8FA5]">
                    Showing 1-{rows.length} of {rows.length} items
                  </div>
                </div>
              );
            })()}

            {/* Meter — software usage metering across the assets it's installed on */}
            {activeMainTab === 'meter' && (() => {
              const rows = [
                { id: 'LAP-6787', host: 'DESKTOP-JJ3ICI2', user: 'Neha Raje', sessions: 218, hours: '342h 10m', last: 'Tue, Jun 17, 2026 09:12 AM', status: 'Active' },
                { id: 'LAP-6712', host: 'FIN-LT-0188', user: 'Priya Nair', sessions: 176, hours: '288h 45m', last: 'Mon, Jun 16, 2026 06:40 PM', status: 'Active' },
                { id: 'DSK-5521', host: 'OPS-DT-0211', user: 'Arjun Patel', sessions: 54, hours: '61h 20m', last: 'Fri, May 30, 2026 02:05 PM', status: 'Idle' },
                { id: 'LAP-6420', host: 'ENG-LT-0312', user: 'Karan Malhotra', sessions: 12, hours: '8h 05m', last: 'Wed, Apr 02, 2026 11:18 AM', status: 'Idle' },
              ];
              const summary = [
                ['Total Usage', '700h 20m', '#364658'],
                ['Active Users (30d)', '2', '#22A06B'],
                ['Avg Sessions / User', '115', '#364658'],
                ['Idle Installs', '2', '#D97706'],
              ] as [string, string, string][];
              const headers = ['Name', 'Used By', 'Sessions', 'Total Usage', 'Last Used', 'Status'];
              return (
                <div className="px-6 py-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-[#3D8BD0]" />
                    <h3 className="text-[14px] font-semibold text-[#364658]">Usage metering</h3>
                  </div>
                  <div className={`grid ${drawerWidth > 1380 ? 'grid-cols-4' : drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    {summary.map(([l, v, color]) => (
                      <div key={l} className="bg-[#F9FAFB] rounded-lg p-3">
                        <div className="text-[12px] text-[#7B8FA5] mb-1">{l}</div>
                        <div className="text-[15px] font-semibold" style={{ color }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-[12px]">
                      <thead className="bg-white border-b border-[#e5e7eb]">
                        <tr>{headers.map((h) => (<th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {rows.map((r) => (
                          <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.id}</span>
                                <span className="text-[#364658] max-w-[150px] truncate inline-block align-bottom">{r.host}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.user}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.sessions}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.hours}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{r.last}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[#364658]">
                                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.status === 'Active' ? '#22C55E' : '#D97706' }} />
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end text-[12px] text-[#7B8FA5]">Showing 1-{rows.length} of {rows.length} items</div>
                </div>
              );
            })()}

            {activeMainTab === 'software' && (() => {
              const softwareList: {
                name: string; manufacturer: string; version: string;
                installedDate?: string; installedLocation?: string; installedSize?: string;
                licenseKey?: string; licenseType?: string; osCompatibility?: string;
                description?: string; uninstall?: string; quiet?: string;
              }[] = [
                { name: 'Intel(R) PROSet/Wireless', manufacturer: 'Intel Corporation', version: '21.40.1.3406', installedDate: '11/11/2024', installedLocation: 'C:\\Program Files\\Intel', description: 'Intel(R) PROSet/Wireless Software' },
                { name: 'Microsoft Visual C++ 2015-2022', manufacturer: 'Microsoft Corporation', version: '14.50.35719', installedDate: '02/03/2026', description: 'Microsoft Visual C++ Redistributable' },
                { name: 'Microsoft Edge', manufacturer: 'Microsoft Corporation', version: '147.0.3912.98', installedDate: '02/05/2026', installedLocation: 'C:\\Program Files (x86)\\Microsoft\\Edge', uninstall: '"C:\\Program Files (x86)\\Microsoft\\Edge\\setup.exe"' },
                { name: 'Microsoft.WindowsTerminal', manufacturer: 'Microsoft Corporation', version: '1000.25128.1000.0', installedLocation: 'C:\\Program Files\\WindowsApps', uninstall: 'Remove-AppxPackage' },
                { name: 'Dolby Audio X2', manufacturer: 'Dolby Laboratories', version: '0.8.8.90', installedDate: '30/01/2026', installedLocation: 'C:\\Program Files\\Dolby', description: 'Dolby Audio X2 Software' },
                { name: 'Check Point VPN', manufacturer: 'Check Point Software', version: '98.61.4017', installedDate: '16/01/2026', description: 'Check Point VPN' },
              ];
              const allColumns: { key: string; label: string; always?: boolean; cell: (s: typeof softwareList[number], i: number) => React.ReactNode }[] = [
                { key: 'name', label: 'Software Name', always: true, cell: (s) => <button className="text-[12px] text-[#3D8BD0] hover:underline max-w-[180px] truncate inline-block align-bottom text-left">{s.name}</button> },
                { key: 'manufacturer', label: 'Manufacturer', cell: (s) => <span className="max-w-[150px] truncate inline-block align-bottom">{s.manufacturer}</span> },
                { key: 'version', label: 'Version', cell: (s) => s.version },
                { key: 'installedDate', label: 'Installed Date', cell: (s) => s.installedDate || '' },
                { key: 'installedLocation', label: 'Installed Location', cell: (s) => <span className="max-w-[180px] truncate inline-block align-bottom">{s.installedLocation || ''}</span> },
                { key: 'installedSize', label: 'Installed Size', cell: (s) => s.installedSize || '' },
                { key: 'licenseKey', label: 'License Key', cell: (s) => <span className="max-w-[160px] truncate inline-block align-bottom">{s.licenseKey || ''}</span> },
                { key: 'licenseType', label: 'License Type', cell: (s) => s.licenseType || '' },
                { key: 'osCompatibility', label: 'OS Compatibility', cell: (s) => s.osCompatibility || '' },
                { key: 'description', label: 'Description', cell: (s) => <span className="max-w-[180px] truncate inline-block align-bottom">{s.description || ''}</span> },
                { key: 'uninstall', label: 'Uninstall Command', cell: (s) => <span className="max-w-[180px] truncate inline-block align-bottom">{s.uninstall || ''}</span> },
                { key: 'quiet', label: 'Quiet Uninstall String', cell: (s) => <span className="max-w-[180px] truncate inline-block align-bottom">{s.quiet || ''}</span> },
                { key: 'actions', label: 'Actions', always: true, cell: (s, i) => (
                  <div className="flex items-center gap-2">
                    <button title="Edit" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Edit size={15} /></button>
                    <button title="Delete" onClick={() => setRemovedSoftware((prev) => new Set(prev).add(i))} className="text-[#7B8FA5] hover:text-[#EF4444]"><Trash2 size={15} /></button>
                  </div>
                ) },
              ];
              const cols = allColumns.filter((c) => c.always || visibleSoftwareCols.has(c.key));
              const toggleable = allColumns.filter((c) => !c.always);
              const sq = softwareSearch.trim().toLowerCase();
              const visible = softwareList
                .map((s, i) => ({ s, i }))
                .filter(({ i }) => !removedSoftware.has(i))
                .filter(({ s }) => !sq || s.name.toLowerCase().includes(sq) || s.manufacturer.toLowerCase().includes(sq) || s.version.toLowerCase().includes(sq));

              // No software at all → empty state (toolbar hidden), matching the Tasks tab.
              const hasAnySoftware = softwareList.some((_, i) => !removedSoftware.has(i));
              if (!hasAnySoftware) {
                return (
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
                          <Package className="size-8 text-[#7B8FA5]" />
                        </div>
                        <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Software Yet</h3>
                        <p className="text-[13px] text-[#7B8FA5] max-w-md mb-4">Get started by adding software to this asset.</p>
                        <button
                          onClick={() => setRemovedSoftware(new Set())}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors"
                        >
                          <Plus size={16} />
                          Add Software
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="px-6 py-6 @container">
                  {/* Toolbar: search (left) + columns + add (right) */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-[360px]">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Search software..."
                        value={softwareSearch}
                        onChange={(e) => setSoftwareSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-[13px] text-[#364658] bg-white border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                      />
                    </div>

                    {/* Right controls: Columns · List/Card · Add */}
                    <div className="ml-auto flex items-center gap-3">
                      {/* Column visibility — list view only */}
                      {softwareView === 'list' && (
                      <div className="relative">
                        <button
                          title="Show / hide columns"
                          onClick={() => setShowSoftwareColsMenu((o) => !o)}
                          className="size-8 flex-shrink-0 flex items-center justify-center rounded border border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <Columns3 size={16} />
                        </button>
                        {showSoftwareColsMenu && (
                          <div className="app-menu absolute top-full right-0 mt-1 z-50 w-[220px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 max-h-[320px] overflow-y-auto">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#7B8FA5] uppercase tracking-wider">Show columns</div>
                            {toggleable.map((c) => (
                              <button
                                key={c.key}
                                onClick={() => setVisibleSoftwareCols((prev) => {
                                  const next = new Set(prev);
                                  next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                                  return next;
                                })}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#364658] hover:bg-[#F5F7FA] transition-colors text-left"
                              >
                                <span className={`size-4 flex-shrink-0 rounded border flex items-center justify-center ${visibleSoftwareCols.has(c.key) ? 'bg-[#3D8BD0] border-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>
                                  {visibleSoftwareCols.has(c.key) && <Check size={12} className="text-white" />}
                                </span>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      )}

                      {/* View toggle: list / card */}
                      <div className="flex flex-shrink-0 overflow-hidden rounded border border-[#DFE5ED]">
                        <button title="Card view" onClick={() => setSoftwareView('card')} className={`flex h-8 w-9 items-center justify-center transition-colors ${softwareView === 'card' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#364658] hover:bg-[#F3F4F6]'}`}><LayoutGrid size={15} /></button>
                        <button title="List view" onClick={() => setSoftwareView('list')} className={`flex h-8 w-9 items-center justify-center border-l border-[#DFE5ED] transition-colors ${softwareView === 'list' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#364658] hover:bg-[#F3F4F6]'}`}><ListIcon size={15} /></button>
                      </div>

                      <button
                        title="Add Software"
                        className="size-8 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {softwareView === 'list' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead className="bg-white border-b border-[#e5e7eb]">
                        <tr>
                          {cols.map((c) => (
                            <th key={c.key} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {visible.length === 0 ? (
                          <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-[#9CA3AF]">No software found.</td></tr>
                        ) : visible.map(({ s, i }) => (
                          <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                            {cols.map((c) => (
                              <td key={c.key} className="px-4 py-3 whitespace-nowrap text-[#364658]">{c.cell(s, i)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    /* Card view */
                    visible.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-[#9CA3AF]">No software found.</div>
                    ) : (
                    <div className="grid gap-4 grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3">
                      {visible.map(({ s, i }) => (
                        <div
                          key={i}
                          className="group relative rounded-xl border border-[#E5E7EB] bg-white p-4 hover:border-[#3D8BD0] hover:shadow-sm transition-all"
                        >
                          {/* Hover actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="Edit" className="size-7 flex items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] hover:text-[#3D8BD0] hover:border-[#3D8BD0]"><Edit size={14} /></button>
                            <button title="Delete" onClick={() => setRemovedSoftware((prev) => new Set(prev).add(i))} className="size-7 flex items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] hover:text-[#EF4444] hover:border-[#EF4444]"><Trash2 size={14} /></button>
                          </div>

                          {/* Header: icon + name + manufacturer */}
                          <div className="flex items-start gap-3 pr-16">
                            <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]">
                              <Package size={20} />
                            </span>
                            <div className="min-w-0">
                              <button className="block text-[13px] font-semibold text-[#3D8BD0] hover:underline truncate text-left max-w-full" title={s.name}>{s.name}</button>
                              <div className="text-[12px] text-[#7B8FA5] truncate" title={s.manufacturer}>{s.manufacturer}</div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="mt-3 pt-3 border-t border-[#F0F2F5] grid grid-cols-2 gap-x-3 gap-y-2">
                            <div className="min-w-0">
                              <div className="text-[11px] text-[#9CA3AF]">Version</div>
                              <div className="text-[12px] text-[#364658] truncate" title={s.version}>{s.version || '---'}</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] text-[#9CA3AF]">Installed Date</div>
                              <div className="text-[12px] text-[#364658] truncate">{s.installedDate || '---'}</div>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <div className="text-[11px] text-[#9CA3AF]">Installed Location</div>
                              <div className="text-[12px] text-[#364658] truncate" title={s.installedLocation}>{s.installedLocation || '---'}</div>
                            </div>
                            {s.description && (
                              <div className="col-span-2 min-w-0">
                                <div className="text-[11px] text-[#9CA3AF]">Description</div>
                                <div className="text-[12px] text-[#364658] truncate" title={s.description}>{s.description}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    )
                  )}
                </div>
              );
            })()}

            {activeMainTab === 'baseline' && (
              <div className="px-6 py-6 space-y-8">
                {/* Baseline */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-semibold text-[#3D8BD0]">Baseline</h3>
                    <button
                      title="Add Baseline"
                      disabled={baselines.length >= 1}
                      onClick={() => { setSelectedBaselineId(null); setBaselineSearch(''); setShowAddBaseline(true); }}
                      className="size-8 flex-shrink-0 rounded bg-[#3D8BD0] text-white flex items-center justify-center hover:bg-[#2F7AB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead className="border-b border-[#e5e7eb]">
                        <tr>
                          {['ID', 'Name', 'Created On', 'Created By', 'Actions'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {baselines.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-10 text-center text-[#9CA3AF]"><span className="inline-flex items-center gap-2"><Info size={16} /> No Data Found</span></td></tr>
                        ) : baselines.map((b) => (
                          <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.createdOn}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.createdBy}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button title="View" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Eye size={15} /></button>
                                <button title="Edit" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Edit size={15} /></button>
                                <button title="Delete" onClick={() => setBaselines((prev) => prev.filter((x) => x.id !== b.id))} className="text-[#7B8FA5] hover:text-[#EF4444]"><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Variance */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#3D8BD0] mb-3">Variance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-[12px]">
                      <thead className="border-b border-[#e5e7eb]">
                        <tr>
                          {['Created Date', 'Asset Component', 'Attribute Name', 'Expected Value', 'Current Value', 'Reference Rollback Request', 'Actions'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-[#9CA3AF]"><span className="inline-flex items-center gap-2"><Info size={18} /> No Data Found</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeMainTab === 'relationship' && (() => {
              // Node colors are merged into 4 groups (legend): Assets (hardware+software+non-IT+
              // consumable), Users (technician/requester/user group), CI, Department. Key order
              // here IS the legend order.
              const typeMeta: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
                hardware: { color: '#F59E0B', icon: <Cpu size={14} />, label: 'Assets' },
                software: { color: '#F59E0B', icon: <AppWindow size={14} />, label: 'Assets' },
                user: { color: '#6366F1', icon: <User size={14} />, label: 'Users' },
                asset: { color: '#EC4899', icon: <Network size={14} />, label: 'CI' },
                department: { color: '#10B981', icon: <Users size={14} />, label: 'Department' },
              };
              const nodes: { label: string; type: keyof typeof typeMeta }[] = [
                { label: 'J. Doe', type: 'user' },
                { label: 'Microsoft Edge', type: 'software' },
                { label: 'Check Point VPN', type: 'software' },
                { label: 'Intel i5-8365U', type: 'hardware' },
                { label: '40 GB RAM', type: 'hardware' },
                { label: 'DC1-SW-CORE-01', type: 'asset' },
                { label: 'LG Monitor', type: 'asset' },
              ];
              const center = relView === 'tree' ? { x: 50, y: 14 } : { x: 50, y: 50 };
              const positioned = nodes.map((n, i) => {
                if (relView === 'tree') {
                  const x = nodes.length === 1 ? 50 : 8 + (i / (nodes.length - 1)) * 84;
                  return { ...n, x, y: 74 };
                }
                const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
                return { ...n, x: 50 + 36 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
              });
              type PosNode = typeof positioned[number];

              const nodeCard = (n: PosNode) => {
                const m = typeMeta[n.type];
                return (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] shadow-sm max-w-[180px]">
                    <span className="flex size-6 items-center justify-center rounded-md text-white flex-shrink-0" style={{ backgroundColor: m.color }}>{m.icon}</span>
                    <span className="text-[12px] font-medium text-[#364658] truncate">{n.label}</span>
                  </div>
                );
              };
              const centerName = activeAsset?.name || activeTicket?.subject || 'This Asset';

              // NOTE: the type legend (User/Software/Hardware/Asset dots) was removed from
              // this toolbar — it will be re-placed elsewhere later. A node search sits in
              // its place: typing highlights matching nodes and fades everything else.
              const legend = (
                <div className="flex items-center gap-2">
                  <div className="relative w-[260px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      ref={relSearchRef}
                      value={relSearch}
                      onChange={(e) => setRelSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') { setRelSearch(''); e.currentTarget.blur(); } }}
                      placeholder="Search...   Ctrl + F | Esc to clear"
                      className="w-full h-8 pl-9 pr-3 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                    />
                  </div>
                  {/* Filters — node type + connection type in ONE popup with two TABS (side-by-side
                      columns read as parent→child, so tabs make the two independent filters clear);
                      selections keep the popup open, a dot marks a tab whose filter is active */}
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setShowRelFilter((v) => !v); setRelConnSearch(''); setRelFilterTab(relConnFilter.length && !relFilter.length ? 'connection' : 'type'); }}
                          className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${relFilter.length || relConnFilter.length ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
                        >
                          <Filter size={14} className={relFilter.length || relConnFilter.length ? 'text-[#3D8BD0]' : 'text-[#6b7280]'} />
                          <span className="max-w-[200px] truncate">{[relFilter.length ? (relFilter.length === 1 ? relFilter[0] : `${relFilter[0]} +${relFilter.length - 1}`) : null, relConnFilter.length ? (relConnFilter.length === 1 ? relConnFilter[0] : `${relConnFilter[0]} +${relConnFilter.length - 1}`) : null].filter(Boolean).join(' · ') || 'All'}</span>
                          <ChevronDown size={14} className={`transition-transform ${showRelFilter ? 'rotate-180' : ''} ${relFilter.length || relConnFilter.length ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Filter by node type & connection</TooltipContent>
                    </Tooltip>
                    {showRelFilter && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRelFilter(false)} />
                        <div className="app-menu absolute left-0 top-full mt-1 w-[280px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 flex flex-col">
                          {/* Selected filters as removable chips (both tabs combined) */}
                          {(relFilter.length > 0 || relConnFilter.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2.5 border-b border-[#EEF1F4]">
                              {relFilter.map((f) => (
                                <span key={`t-${f}`} className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] pl-2 pr-1 py-0.5 text-[12px] font-medium text-[#364658]">
                                  {f}
                                  <button onClick={() => setRelFilter((p) => p.filter((x) => x !== f))} className="rounded p-0.5 text-[#7B8FA5] hover:text-[#364658] hover:bg-black/10 transition-colors"><X size={11} /></button>
                                </span>
                              ))}
                              {relConnFilter.map((f) => (
                                <span key={`c-${f}`} className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] pl-2 pr-1 py-0.5 text-[12px] font-medium text-[#364658]">
                                  {f}
                                  <button onClick={() => setRelConnFilter((p) => p.filter((x) => x !== f))} className="rounded p-0.5 text-[#7B8FA5] hover:text-[#364658] hover:bg-black/10 transition-colors"><X size={11} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Tabs */}
                          <div className="flex border-b border-[#EEF1F4]">
                            <button
                              onClick={() => setRelFilterTab('type')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${relFilterTab === 'type' ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                            >
                              Node Type
                              {relFilter.length > 0 && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
                            </button>
                            <button
                              onClick={() => setRelFilterTab('connection')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${relFilterTab === 'connection' ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                            >
                              Connection
                              {relConnFilter.length > 0 && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
                            </button>
                          </div>
                          {relFilterTab === 'type' ? (
                            <div className="overflow-y-auto py-1 max-h-[320px]">
                              <button
                                onClick={() => setRelFilter([])}
                                className={`w-full flex items-center justify-between px-4 py-2 text-[13px] text-left transition-colors ${!relFilter.length ? 'bg-[#F1F5F9] text-[#364658] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                              >
                                All
                                {!relFilter.length && <Check size={14} className="text-[#3D8BD0]" />}
                              </button>
                              {(['Hardware Asset', 'Software Asset', 'Non-IT Asset', 'Consumable Asset', 'CI', 'Department', 'Technician', 'Requester', 'User Group', 'Active Issues'] as const).map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => setRelFilter((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]))}
                                  className={`w-full flex items-center justify-between px-4 py-2 text-[13px] text-left transition-colors ${relFilter.includes(opt) ? 'bg-[#F1F5F9] text-[#364658] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                                >
                                  {opt === 'Active Issues' ? (<span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#EF4444] flex-shrink-0" />{opt}</span>) : opt}
                                  {relFilter.includes(opt) && <Check size={14} className="text-[#3D8BD0]" />}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col max-h-[320px]">
                              <div className="relative px-2 pt-2 pb-1.5">
                                <Search size={13} className="absolute left-4 top-[17px] text-[#9CA3AF]" />
                                <input
                                  type="text"
                                  value={relConnSearch}
                                  onChange={(e) => setRelConnSearch(e.target.value)}
                                  placeholder="Search"
                                  className="w-full pl-7 pr-2 py-1.5 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0]"
                                />
                              </div>
                              <div className="overflow-y-auto py-1">
                                <button
                                  onClick={() => setRelConnFilter([])}
                                  className={`w-full flex items-center justify-between px-4 py-2 text-[13px] text-left transition-colors ${!relConnFilter.length ? 'bg-[#F1F5F9] text-[#364658] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                                >
                                  All
                                  {!relConnFilter.length && <Check size={14} className="text-[#3D8BD0]" />}
                                </button>
                                {[...REL_RELATIONS, ...relConnTypes.filter((r) => !REL_RELATIONS.includes(r))].filter((opt) => opt.toLowerCase().includes(relConnSearch.trim().toLowerCase())).map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setRelConnFilter((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]))}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-[13px] text-left transition-colors ${relConnFilter.includes(opt) ? 'bg-[#F1F5F9] text-[#364658] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                                  >
                                    {opt}
                                    {relConnFilter.includes(opt) && <Check size={14} className="text-[#3D8BD0]" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Footer: clear both + done */}
                          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#EEF1F4]">
                            <button
                              onClick={() => { setRelFilter([]); setRelConnFilter([]); }}
                              disabled={!relFilter.length && !relConnFilter.length}
                              className="text-[12px] font-medium text-[#3D8BD0] hover:underline disabled:text-[#9CA3AF] disabled:no-underline disabled:cursor-not-allowed"
                            >
                              Clear all
                            </button>
                            <button onClick={() => setShowRelFilter(false)} className="px-3 py-1.5 rounded bg-[#3D8BD0] text-white text-[12px] font-medium hover:bg-[#2F7AB8] transition-colors">Done</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Saved views */}
                  <RelSavedViews
                    storageKey="relViews:non-it"
                    reset={() => { setRelView('graph'); setRelFilter([]); setRelConnFilter([]); setRelKey((k) => k + 1); }}
                    capture={() => ({ mode: relView, filter: relFilter, connFilter: relConnFilter, graph: relSnapRef.current?.capture() ?? null })}
                    apply={(v) => {
                      setRelView(v.mode as 'graph' | 'tree' | 'grid');
                      setRelFilter(Array.isArray(v.filter) ? v.filter : v.filter ? [v.filter] : []);
                      setRelConnFilter(Array.isArray(v.connFilter) ? v.connFilter : v.connFilter ? [v.connFilter] : []);
                      // Restore canvas state AFTER the mode-change relayout effect has run.
                      setTimeout(() => { if (v.graph) relSnapRef.current?.restore(v.graph); }, 120);
                    }}
                  />
                </div>
              );

              const viewBtns = [
                // Icons mirror what each view actually renders: radial orbit graph ·
                // top-down hierarchy · numbered relationship list.
                { key: 'graph', icon: <Orbit size={15} />, title: 'Full view' },
                { key: 'tree', icon: <Network size={15} />, title: 'Tree view' },
                { key: 'grid', icon: <ListIcon size={15} />, title: 'Grid view' },
              ] as const;
              const controls = (
                <div className="flex items-center gap-2">
                  {relConfig.locked && (
                    <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#F59E0B]/50 bg-[#FEF3C7] px-2.5 text-[12px] font-medium text-[#B45309]">
                        <Lock size={13} />
                        Locked
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Node layout is locked (Advanced Configuration)</TooltipContent>
                  </Tooltip>
                  )}
                  {/* View-mode segmented group */}
                  <div className="inline-flex items-center rounded border border-[#DFE5ED] bg-white p-0.5">
                    {viewBtns.map((b) => (
                      <Tooltip key={b.key}>
                        <TooltipTrigger asChild>
                          <button onClick={() => setRelView(b.key)} className={`inline-flex items-center justify-center size-7 rounded transition-colors ${relView === b.key ? 'bg-[#3D8BD0] text-white' : 'text-[#6B7280] hover:bg-[#F5F7FA]'}`}>{b.icon}</button>
                        </TooltipTrigger>
                        <TooltipContent>{b.title}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  {/* Expand all / Collapse all */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (relAllExpanded) { setRelCollapseKey((k) => k + 1); setRelAllExpanded(false); }
                          else { setRelExpandKey((k) => k + 1); setRelAllExpanded(true); }
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"
                      >
                        {relAllExpanded ? <ChevronsDownUp size={15} className="text-[#6b7280]" /> : <ChevronsUpDown size={15} className="text-[#6b7280]" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{relAllExpanded ? 'Collapse all' : 'Expand all'}</TooltipContent>
                  </Tooltip>
                  {/* Refresh */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setRelKey((k) => k + 1)} className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"><RefreshCw size={15} className="text-[#6b7280]" /></button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                  {/* Download */}
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setShowRelDownload((v) => !v)} className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"><Download size={15} className="text-[#6b7280]" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                    {showRelDownload && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRelDownload(false)} />
                        <div className="app-menu absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50">
                          <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Download</h4>
                          {/* Format */}
                          <div className="mb-4">
                            <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Format</label>
                            <div className="inline-flex rounded border border-[#DFE5ED] overflow-hidden">
                              {(['PDF', 'Excel', 'CSV', 'PNG'] as const).map((f) => (
                                <button key={f} onClick={() => setRelDlFormat(f)} className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${relDlFormat === f ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}>{f}</button>
                              ))}
                            </div>
                          </div>
                          {/* Password Protected toggle */}
                          <div className="mb-3">
                            <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Password Protected</label>
                            <button onClick={() => setRelDlPwProtected((v) => !v)} role="switch" aria-checked={relDlPwProtected} className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${relDlPwProtected ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}>
                              <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${relDlPwProtected ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                            </button>
                          </div>
                          {/* Attachment password */}
                          {relDlPwProtected && (
                            <div className="mb-1">
                              <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Attachment Password <span className="text-[#EF4444]">*</span></label>
                              <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                <input type={relDlShowPw ? 'text' : 'password'} value={relDlPassword} onChange={(e) => setRelDlPassword(e.target.value)} placeholder="Attachment Password" className="w-full pl-9 pr-9 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]" />
                                <button onClick={() => setRelDlShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]">{relDlShowPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#F0F1F3]">
                            <button onClick={() => setShowRelDownload(false)} className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Download</button>
                            <button onClick={() => setShowRelDownload(false)} className="px-3 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Cancel</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Settings → Advanced Configuration side panel */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setRelDraft(relConfig); setShowRelSettings(true); }} className={`inline-flex items-center justify-center h-8 w-8 rounded border transition-colors ${showRelSettings ? 'bg-[#3D8BD0] text-white border-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#6b7280] hover:bg-[#F5F7FA]'}`}><Settings2 size={15} /></button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                  {/* Full screen */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setRelFull((v) => !v)} className={`inline-flex items-center justify-center h-8 w-8 rounded border transition-colors ${relFull ? 'bg-[#3D8BD0] text-white border-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#6b7280] hover:bg-[#F5F7FA]'}`}>{relFull ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
                    </TooltipTrigger>
                    <TooltipContent>{relFull ? 'Exit full screen' : 'Full screen'}</TooltipContent>
                  </Tooltip>
                </div>
              );

              const graphArea = (
                <div className={`relative w-full h-full overflow-hidden ${relView === 'grid' ? 'bg-white' : ''}`}>
                  {relView === 'grid' ? (
                    <div className="p-4 h-full overflow-auto">
                      <div className="space-y-2.5 min-w-[720px]">
                        {positioned.map((n, i) => {
                          const m = typeMeta[n.type];
                          const rel = n.type === 'user' ? 'Users' : 'Depends On';
                          return (
                            <div key={n.label} className="flex items-center gap-3">
                              <span className="w-6 text-right text-[13px] text-[#64748B] flex-shrink-0">{i + 1}.</span>
                              {/* Source (this CI) */}
                              <div className="flex-1 basis-0 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-[#E5E7EB] shadow-sm">
                                <span className="flex size-6 items-center justify-center rounded-md bg-[#3D8BD0] text-white flex-shrink-0"><HardDrive size={14} /></span>
                                <span className="text-[13px] font-medium text-[#364658] truncate">{activeAsset?.id ? `${activeAsset.id}: ${centerName}` : centerName}</span>
                              </div>
                              <div className="h-px w-5 bg-[#CBD5E1] flex-shrink-0" />
                              {/* Relationship type */}
                              <div className="w-[200px] flex-shrink-0 text-center px-4 py-2.5 rounded-md bg-[#1E293B] text-white text-[13px] font-medium truncate">{rel}</div>
                              <div className="h-px w-5 bg-[#CBD5E1] flex-shrink-0" />
                              {/* Target */}
                              <div className="flex-1 basis-0 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-[#E5E7EB] shadow-sm">
                                <span className="flex size-6 items-center justify-center rounded-md text-white flex-shrink-0" style={{ backgroundColor: m.color }}>{m.icon}</span>
                                <span className="text-[13px] font-medium text-[#364658] truncate">{n.label}</span>
                              </div>
                              {/* Remove */}
                              <button title="Remove relation" className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded border border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"><Trash2 size={15} /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <RelationshipGraph
                      mode={relView as 'graph' | 'tree'}
                      refreshSignal={relKey}
                      snapshotRef={relSnapRef}
                      connectionFilter={relConnFilter}
                      onConnectionTypesChange={setRelConnTypes}
                      expandAllSignal={relExpandKey}
                      collapseAllSignal={relCollapseKey}
                      nodes={nodes}
                      typeMeta={typeMeta}
                      centerName={centerName}
                      centerId={activeAsset?.id}
                      searchTerm={relSearch}
                      config={relConfig}
                      typeFilter={relFilter.length ? relFilter.map((f) => ({ 'Hardware Asset': 'hardware', 'Software Asset': 'software', 'Non-IT Asset': 'hardware', 'Consumable Asset': 'hardware', 'CI': 'asset', 'Department': 'department', 'Technician': 'user', 'Requester': 'user', 'User Group': 'user', 'Active Issues': 'active-issues' } as const)[f as 'CI']).filter(Boolean) : null}
                      onOpenNode={(info) => {
                        // Open the node's record as a tab in this same drawer (same flow as the
                        // Impact popup's "Open related records"): CI-style nodes → CMDB, the
                        // rest → Hardware Asset. The opened record shows its own default
                        // (Overview) tab; THIS asset keeps its Relationship tab when reselected.
                        onOpenRelation?.({ ticketId: info.id, subject: info.name, type: info.type === 'asset' ? 'CI' : 'Asset', status: 'In Use', priority: 'Medium', assignedTo: { name: 'Rohan Mehta' } } as Parameters<NonNullable<typeof onOpenRelation>>[0]);
                      }}
                      onAddRelation={(info) => setRelAddTarget(info)}
                      onShowIssues={(info) => setRelIssuesTarget(info)}
                      extraChildren={relExtras}
                    />
                  )}
                </div>
              );

              // Advanced Configuration side panel: live preview (uses the DRAFT config) +
              // functional sliders; Apply commits the draft to the real graph.
              const viewLabel = relView === 'graph' ? 'Full View' : relView === 'tree' ? 'Tree View' : 'Grid View';
              const settingsPanel = showRelSettings ? (
                <>
                  <div className="fixed inset-0 bg-black/30 z-[10004]" onClick={() => setShowRelSettings(false)} />
                  <div className="fixed top-0 right-0 h-full w-[560px] max-w-[94vw] bg-white shadow-2xl z-[10005] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                      <h2 className="text-[17px] font-semibold text-[#111827]">Advanced Configuration <span className="text-[13px] font-normal text-[#7B8FA5]">({viewLabel})</span></h2>
                      <button onClick={() => setShowRelSettings(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {/* Live preview — driven by the draft values */}
                      <div className="h-[230px] border-b border-[#E5E7EB] overflow-hidden">
                        <RelationshipGraph
                          mode={relView === 'tree' ? 'tree' : 'graph'}
                          nodes={nodes}
                          typeMeta={typeMeta}
                          centerName={centerName}
                          centerId={activeAsset?.id}
                          config={relDraft}
                          previewMode
                        />
                      </div>
                      <div className="px-6 py-5 space-y-6">
                        {/* Lock Node Visualization — freezes manual node dragging for everyone */}
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <Lock size={16} className="mt-0.5 flex-shrink-0 text-[#364658]" />
                            <div>
                              <div className="text-[13px] font-semibold text-[#364658]">Lock Node Visualization</div>
                              <div className="text-[12px] text-[#7B8FA5]">When locked, nodes can't be moved manually — the layout stays fixed for everyone.</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRelDraft((p) => ({ ...p, locked: !p.locked }))}
                            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${relDraft.locked ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
                          >
                            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${relDraft.locked ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Force Simulation</h3>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            <RelSliderRow label="Node Distance" info="Extra spacing between nodes on every group ring." min={0} max={200} step={5} value={relDraft.nodeDistance} onChange={(v) => setRelDraft((p) => ({ ...p, nodeDistance: v }))} />
                            <RelSliderRow label="Repulsion Strength" info="How strongly groups push each other apart when they get close." min={0} max={5} step={0.1} value={relDraft.repulsion} onChange={(v) => setRelDraft((p) => ({ ...p, repulsion: v }))} />
                            <RelSliderRow label="Gravity" info="How strongly each group is pulled toward its parent node." min={0.02} max={0.9} step={0.01} value={relDraft.gravity} onChange={(v) => setRelDraft((p) => ({ ...p, gravity: v }))} />
                          </div>
                        </div>
                        <div className="border-t border-[#F0F1F3] pt-5">
                          <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Zoom</h3>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            <RelSliderRow label="Min Zoom" info="How far the user can zoom out." min={0.05} max={0.5} step={0.01} value={relDraft.minZoom} onChange={(v) => setRelDraft((p) => ({ ...p, minZoom: v }))} />
                            <RelSliderRow label="Max Zoom" info="How far the user can zoom in." min={2} max={5} step={0.5} value={relDraft.maxZoom} onChange={(v) => setRelDraft((p) => ({ ...p, maxZoom: v }))} />
                          </div>
                        </div>
                        <div className="border-t border-[#F0F1F3] pt-5">
                          <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Labels</h3>
                          <div className="grid grid-cols-2 gap-x-8">
                            <RelSliderRow label="Label Width" info="Maximum width of each node's name label before it truncates." min={20} max={300} step={10} value={relDraft.labelWidth} onChange={(v) => setRelDraft((p) => ({ ...p, labelWidth: v }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
                      <button onClick={() => setRelDraft(DEFAULT_REL_GRAPH_CONFIG)} className="px-4 py-2 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Reset to Defaults</button>
                      <button onClick={() => { setRelConfig(relDraft); setShowRelSettings(false); }} className="px-4 py-2 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Apply</button>
                    </div>
                  </div>
                </>
              ) : null;

              // Add Relationship side panel (opened from a node's hover "+")
              const addRelPanel = relAddTarget ? (
                <AddRelationshipPanel
                  sourceName={relAddTarget.name}
                  onClose={() => setRelAddTarget(null)}
                  onAdd={(items) => {
                    setRelExtras((p) => ({ ...p, [relAddTarget.id]: [...(p[relAddTarget.id] ?? []), ...items] }));
                    setRelAddTarget(null);
                  }}
                />
              ) : null;

              // Active Issues side panel (opened from a red node's hover-card strip);
              // clicking a record opens its real detail page as a tab in this drawer.
              const issuesPanel = relIssuesTarget ? (
                <ActiveIssuesPanel
                  assetName={relIssuesTarget.name}
                  onClose={() => setRelIssuesTarget(null)}
                  onOpenIssue={(issue, kind) => {
                    setRelIssuesTarget(null);
                    onOpenRelation?.({ ticketId: issue.id, subject: issue.subject, type: kind, status: issue.status, priority: issue.priority, assignedTo: { name: 'Rohan Mehta' } } as Parameters<NonNullable<typeof onOpenRelation>>[0]);
                  }}
                />
              ) : null;

              if (relFull) {
                return (
                  <div className="fixed inset-0 z-[10000] bg-white flex flex-col p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">{legend}{controls}</div>
                    <div className="flex-1 min-h-0">{graphArea}</div>
                    {settingsPanel}
                    {addRelPanel}
                    {issuesPanel}
                  </div>
                );
              }
              return (
                // Fill the viewport below the sticky tab strip (~48px) so the dotted canvas
                // reaches the bottom edge without making the page scroll.
                <div className="h-[calc(100%-48px)] flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3 py-4 px-6 flex-shrink-0 border-b border-[#E5E7EB]">{legend}{controls}</div>
                  <div className="flex-1 min-h-0">{graphArea}</div>
                  {settingsPanel}
                  {addRelPanel}
                  {issuesPanel}
                </div>
              );
            })()}


            {activeMainTab === 'financials' && (() => {
              const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const byFactor = (f: string) => costRecords.filter((r) => r.factor === f).reduce((s, r) => s + r.amount, 0);
              const totalCost = costRecords.reduce((s, r) => s + r.amount, 0);
              const purchaseCost = byFactor('Purchase') || 0;
              const salvage = parseFloat(deprConfig.salvageValue) || 0;
              const configured = deprConfig.derivation === 'asset' && !!deprConfig.method;
              const lifeMonths = deprConfig.type === 'useful' && deprConfig.usefulLife ? Math.max(parseInt(deprConfig.usefulLife) || 0, 1) : 48;
              const elapsed = 12; // illustrative months in service
              const base = purchaseCost || totalCost || 0;
              const series = Array.from({ length: 13 }, (_, i) => Math.max(salvage, base - (base - salvage) * (i / 12)));
              const maxBV = Math.max(base, 1);
              const currentBV = Math.max(salvage, base - (base - salvage) * Math.min(elapsed / lifeMonths, 1));
              const deprPct = base ? Math.round((1 - currentBV / base) * 100) : 0;
              const W = 960, H = 180, padL = 60, padR = 20, padT = 14, padB = 42;
              const plotW = W - padL - padR, plotH = H - padT - padB;
              const px = (i: number) => padL + (i / (series.length - 1)) * plotW;
              const py = (v: number) => padT + (1 - v / maxBV) * plotH;
              const linePts = series.map((v, i) => `${px(i)},${py(v)}`).join(' ');
              const areaPts = `${px(0)},${py(0)} ${linePts} ${px(series.length - 1)},${py(0)}`;
              const fmtAxis = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString());
              const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => ({ y: py(maxBV * f), label: fmtAxis(maxBV * f) }));
              const xTicks = [0, 3, 6, 9, 12].map((i) => ({ x: px(i), label: `${Math.round((i / 12) * lifeMonths)}` }));

              const factors = [
                { f: 'Purchase', c: '#3D8BD0' },
                { f: 'Operation', c: '#10B981' },
                { f: 'Repair', c: '#F59E0B' },
                { f: 'Upgrade', c: '#8B5CF6' },
                { f: 'Disposal', c: '#EF4444' },
                { f: 'Other', c: '#64748B' },
              ];
              const maxFactor = Math.max(...factors.map((x) => byFactor(x.f)), 1);

              // No costs yet → guide the user to add the first cost.
              if (costRecords.length === 0) {
                return (
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-center min-h-[420px]">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4"><FileText className="size-8 text-[#7B8FA5]" /></div>
                        <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No financial records yet</h3>
                        <p className="text-[13px] text-[#7B8FA5] max-w-md mb-4">Add the purchase cost to start tracking total cost, book value and depreciation for this asset.</p>
                        <button onClick={() => { setNewCost({ factor: 'Purchase', date: '', amount: '', currency: 'ATS', description: '' }); setShowAddCost(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#2F7AB8] transition-colors"><Plus size={16} /> Add Cost</button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="px-6 py-6 space-y-6">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#364658]">Financials</h3>
                    <button onClick={() => { setNewCost({ factor: '', date: '', amount: '', currency: 'ATS', description: '' }); setShowAddCost(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#2F7AB8] transition-colors"><Plus size={16} /> Add Cost</button>
                  </div>
                  {/* Hero metrics */}
                  <div className={`grid ${drawerWidth > 1380 ? 'grid-cols-4' : drawerWidth > 1080 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    {[
                      { label: 'Total Cost', value: `${num(totalCost)} ATS`, accent: '#364658' },
                      { label: 'Purchase Cost', value: `${num(purchaseCost)} ATS`, accent: '#364658' },
                      { label: 'Current Book Value', value: configured ? `${num(currentBV)} ATS` : '—', accent: '#3D8BD0' },
                      { label: 'Depreciation', value: configured ? `${deprPct}%` : '—', accent: '#D97706' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                        <div className="text-[12px] text-[#7B8FA5] mb-1.5">{m.label}</div>
                        <div className="text-[20px] font-semibold leading-none" style={{ color: m.accent }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Depreciation + Cost breakdown — one row */}
                  <div className={`grid ${drawerWidth > 1080 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 items-start`}>
                  {/* Depreciation chart */}
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-[#364658]">Depreciation</h3>
                        <span className="text-[11px] text-[#7B8FA5]">Book value over useful life</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowDeprLog(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DFE5ED] text-[#364658] text-[12px] font-medium hover:bg-[#F3F4F6] transition-colors">
                          <Clock size={14} /> Log
                        </button>
                        <button onClick={() => setShowConfigDepr(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DFE5ED] text-[#364658] text-[12px] font-medium hover:bg-[#F3F4F6] transition-colors">
                          <Settings2 size={14} /> Configure
                        </button>
                      </div>
                    </div>
                    {base > 0 ? (
                      <>
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                          {/* Y gridlines + labels */}
                          {yTicks.map((t) => (
                            <g key={t.y}>
                              <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="#F0F2F5" strokeWidth={1} />
                              <text x={padL - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">{t.label}</text>
                            </g>
                          ))}
                          {/* Axes */}
                          <line x1={padL} y1={padT} x2={padL} y2={py(0)} stroke="#E5E7EB" strokeWidth={1} />
                          <line x1={padL} y1={py(0)} x2={W - padR} y2={py(0)} stroke="#E5E7EB" strokeWidth={1} />
                          {/* X ticks + labels */}
                          {xTicks.map((t) => (
                            <g key={t.x}>
                              <line x1={t.x} y1={py(0)} x2={t.x} y2={py(0) + 4} stroke="#CBD5E1" strokeWidth={1} />
                              <text x={t.x} y={py(0) + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">{t.label}</text>
                            </g>
                          ))}
                          {/* Axis titles */}
                          <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#7B8FA5">Months in service</text>
                          <text x={16} y={padT + plotH / 2} textAnchor="middle" fontSize="10" fill="#7B8FA5" transform={`rotate(-90 16 ${padT + plotH / 2})`}>Book Value (ATS)</text>
                          {/* Series */}
                          <polygon points={areaPts} fill="#3D8BD0" opacity={0.08} />
                          <polyline points={linePts} fill="none" stroke="#3D8BD0" strokeWidth={2} />
                          {configured && (
                            <circle cx={px((elapsed / lifeMonths) * 12)} cy={py(currentBV)} r={4} fill="#3D8BD0" stroke="#fff" strokeWidth={2} />
                          )}
                        </svg>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            ['Method', configured ? deprConfig.method : (deprConfig.derivation === 'none' ? 'Do Not Depreciate' : 'Not configured')],
                            ['Purchase Cost', `${num(base)} ATS`],
                            ['Salvage', deprConfig.salvageValue ? `${num(salvage)} ${deprConfig.currency}` : '—'],
                            [deprConfig.type === 'useful' ? 'Useful Life' : 'Rate', deprConfig.usefulLife ? (deprConfig.type === 'useful' ? `${deprConfig.usefulLife} mo` : `${deprConfig.usefulLife}%`) : '—'],
                          ].map(([l, v]) => (
                            <span key={l} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F9FAFB] text-[12px]">
                              <span className="text-[#7B8FA5]">{l}:</span>
                              <span className="font-medium text-[#364658]">{v}</span>
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-10 text-center text-[13px] text-[#9CA3AF]">Add a purchase cost to see depreciation.</div>
                    )}
                  </div>

                  {/* Cost breakdown */}
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
                    <h3 className="text-[14px] font-semibold text-[#364658] mb-4">Cost breakdown</h3>
                    <div className="space-y-3">
                      {factors.map(({ f, c }) => {
                        const amt = byFactor(f);
                        return (
                          <div key={f} className="flex items-center gap-3">
                            <span className="text-[12px] text-[#64748B] w-[90px] flex-shrink-0">{f}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-[#F0F2F5] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(amt / maxFactor) * 100}%`, backgroundColor: c }} />
                            </div>
                            <span className="text-[12px] font-medium text-[#364658] w-[90px] text-right flex-shrink-0">{num(amt)} ATS</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  </div>

                  {/* Cost records — timeline */}
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#364658] mb-3">Cost Records</h3>
                    {costRecords.length === 0 ? (
                      <div className="rounded-lg bg-[#F9FAFB] py-10 text-center text-[13px] text-[#9CA3AF]"><span className="inline-flex items-center gap-2"><Info size={16} /> No cost records yet.</span></div>
                    ) : (
                      <div className="space-y-2">
                        {costRecords.map((r) => {
                          const color = factors.find((x) => x.f === r.factor)?.c || '#64748B';
                          return (
                            <div key={r.id} className="group flex items-start gap-3 rounded-lg bg-[#F9FAFB] p-3">
                              <span className="mt-0.5 size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] font-semibold text-[#364658]">{num(r.amount)} {r.currency}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}1A`, color }}>{r.factor}</span>
                                  <span className="text-[11px] text-[#9CA3AF] ml-auto">{r.date}</span>
                                </div>
                                {r.description && <div className="text-[12px] text-[#7B8FA5] mt-0.5 truncate">{r.description}</div>}
                              </div>
                              <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                                <button title="Edit" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Edit size={14} /></button>
                                <button title="Delete" onClick={() => setCostRecords((prev) => prev.filter((x) => x.id !== r.id))} className="text-[#7B8FA5] hover:text-[#EF4444]"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Add Cost — side drawer */}
            {showAddCost && (
              <>
                <div className="fixed inset-0 bg-black/30 z-[10000]" onClick={() => setShowAddCost(false)} />
                <div className="fixed top-0 right-0 h-full w-[560px] max-w-[94vw] bg-white shadow-2xl z-[10001] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                    <h2 className="text-[18px] font-semibold text-[#111827]">Add Cost</h2>
                    <button onClick={() => setShowAddCost(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-[13px] text-[#364658] mb-1.5">Cost Factor <span className="text-[#DC2626]">*</span></label>
                      <select
                        value={newCost.factor}
                        onChange={(e) => setNewCost((c) => ({ ...c, factor: e.target.value }))}
                        className={`app-select w-full px-3 py-2 text-[13px] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent ${newCost.factor ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}
                      >
                        <option value="">Select</option>
                        {['Purchase', 'Operation', 'Disposal', 'Repair', 'Upgrade', 'Other'].map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] text-[#364658] mb-1.5">Date <span className="text-[#DC2626]">*</span></label>
                        <DateField value={newCost.date} onChange={(v) => setNewCost((c) => ({ ...c, date: v }))} />
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#364658] mb-1.5">Amount <span className="text-[#DC2626]">*</span></label>
                        <div className="flex">
                          <input type="number" value={newCost.amount} onChange={(e) => setNewCost((c) => ({ ...c, amount: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
                          <select value={newCost.currency} onChange={(e) => setNewCost((c) => ({ ...c, currency: e.target.value }))} className="px-2 py-2 text-[13px] text-[#364658] border border-l-0 border-[#DFE5ED] rounded-r-md bg-white focus:outline-none">
                            {['ATS', 'USD', 'EUR', 'INR', 'GBP'].map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#364658] mb-1.5">Description</label>
                      <textarea value={newCost.description} onChange={(e) => setNewCost((c) => ({ ...c, description: e.target.value }))} placeholder="Description" className="w-full min-h-[110px] px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded resize-y placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
                    <button
                      disabled={!newCost.factor || !newCost.date || !newCost.amount}
                      onClick={() => {
                        setCostRecords((prev) => [{ id: Date.now(), date: newCost.date, amount: parseFloat(newCost.amount) || 0, currency: newCost.currency, factor: newCost.factor, description: newCost.description }, ...prev]);
                        setShowAddCost(false);
                      }}
                      className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button onClick={() => setShowAddCost(false)} className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors">Cancel</button>
                  </div>
                </div>
              </>
            )}

            {/* Configure Depreciation — side drawer */}
            {showConfigDepr && (
              <>
                <div className="fixed inset-0 bg-black/30 z-[10000]" onClick={() => setShowConfigDepr(false)} />
                <div className="fixed top-0 right-0 h-full w-[560px] max-w-[94vw] bg-white shadow-2xl z-[10001] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                    <h2 className="text-[18px] font-semibold text-[#111827]">Configure Depreciation</h2>
                    <button onClick={() => setShowConfigDepr(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
                    <div>
                      <label className="block text-[13px] text-[#364658] mb-2">Depreciation Derivation <span className="text-[#DC2626]">*</span></label>
                      <div className="flex flex-wrap items-center gap-5">
                        {[{ v: 'product', l: 'Product Level' }, { v: 'asset', l: 'Asset Level' }, { v: 'none', l: 'Do Not Depreciate' }].map((o) => (
                          <label key={o.v} className="inline-flex items-center gap-2 text-[13px] text-[#364658] cursor-pointer">
                            <input type="radio" name="depr-derivation" checked={deprConfig.derivation === o.v} onChange={() => setDeprConfig((d) => ({ ...d, derivation: o.v }))} className="h-3.5 w-3.5 text-[#3D8BD0] focus:ring-[#3D8BD0]" />
                            {o.l}
                          </label>
                        ))}
                      </div>
                    </div>

                    {deprConfig.derivation === 'product' && (
                      <div className="px-4 py-3 rounded-md bg-[#FDECEC] text-[#DC2626] text-[13px] font-medium">No Product is associated with this asset.</div>
                    )}

                    {deprConfig.derivation === 'asset' && (
                      <>
                        <div>
                          <label className="block text-[13px] text-[#364658] mb-1.5">Depreciation Method <span className="text-[#DC2626]">*</span></label>
                          <select
                            value={deprConfig.method}
                            onChange={(e) => setDeprConfig((d) => ({ ...d, method: e.target.value }))}
                            className={`app-select w-full px-3 py-2 text-[13px] border border-[#DFE5ED] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent ${deprConfig.method ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}
                          >
                            <option value="">Select</option>
                            {['Straight Line', 'Declining Balance', 'Sum Of The Years Digit', 'Double Declining Balance'].map((m) => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#364658] mb-2">Depreciation Type</label>
                          <div className="flex flex-wrap items-center gap-5">
                            {[{ v: 'useful', l: 'Useful Life' }, { v: 'percentage', l: 'Depreciation Percentage' }].map((o) => (
                              <label key={o.v} className="inline-flex items-center gap-2 text-[13px] text-[#364658] cursor-pointer">
                                <input type="radio" name="depr-type" checked={deprConfig.type === o.v} onChange={() => setDeprConfig((d) => ({ ...d, type: o.v }))} className="h-3.5 w-3.5 text-[#3D8BD0] focus:ring-[#3D8BD0]" />
                                {o.l}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] text-[#364658] mb-1.5">{deprConfig.type === 'useful' ? 'Useful Life' : 'Depreciation Percentage'}</label>
                            <div className="flex">
                              <input type="number" value={deprConfig.usefulLife} onChange={(e) => setDeprConfig((d) => ({ ...d, usefulLife: e.target.value }))} placeholder="0" className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
                              <span className="px-3 py-2 text-[13px] text-[#364658] border border-l-0 border-[#DFE5ED] rounded-r-md bg-[#F9FAFB]">{deprConfig.type === 'useful' ? 'Month' : '%'}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[13px] text-[#364658] mb-1.5">Salvage Value</label>
                            <div className="flex">
                              <input type="number" value={deprConfig.salvageValue} onChange={(e) => setDeprConfig((d) => ({ ...d, salvageValue: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 text-[13px] text-[#364658] border border-[#DFE5ED] rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
                              <select value={deprConfig.currency} onChange={(e) => setDeprConfig((d) => ({ ...d, currency: e.target.value }))} className="px-2 py-2 text-[13px] text-[#364658] border border-l-0 border-[#DFE5ED] rounded-r-md bg-white focus:outline-none">
                                {['ATS', 'USD', 'EUR', 'INR', 'GBP'].map((c) => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
                    <button onClick={() => setShowConfigDepr(false)} className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] transition-colors">Update</button>
                    <button onClick={() => setShowConfigDepr(false)} className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors">Cancel</button>
                  </div>
                </div>
              </>
            )}

            {/* Depreciation Log — side drawer */}
            {showDeprLog && (
              <>
                <div className="fixed inset-0 bg-black/30 z-[10000]" onClick={() => setShowDeprLog(false)} />
                <div className="fixed top-0 right-0 h-full w-[820px] max-w-[96vw] bg-white shadow-2xl z-[10001] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                    <h2 className="text-[18px] font-semibold text-[#111827]">Depreciation Log</h2>
                    <button onClick={() => setShowDeprLog(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
                  </div>
                  <div className="flex items-center justify-end px-6 py-3 border-b border-[#E5E7EB] flex-shrink-0">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F3F4F6] transition-colors">
                      Monthly <Filter size={14} className="text-[#7B8FA5]" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-white border-b border-[#E5E7EB] sticky top-0">
                        <tr>{['Month/Year', 'Depreciation', 'Accumulated Depreciation', 'Book Value', 'Remaining Life'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {[
                          { my: 'Jan 2026', dep: '0.42 ATS', acc: '0.42 ATS', bv: '19.58 ATS', life: '47 months' },
                          { my: 'Feb 2026', dep: '0.42 ATS', acc: '0.84 ATS', bv: '19.16 ATS', life: '46 months' },
                          { my: 'Mar 2026', dep: '0.42 ATS', acc: '1.26 ATS', bv: '18.74 ATS', life: '45 months' },
                        ].map((r) => (
                          <tr key={r.my} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap text-[#364658] font-medium">{r.my}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-[#364658]">{r.dep}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-[#364658]">{r.acc}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-[#364658]">{r.bv}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-[#364658]">{r.life}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Add Baseline — side drawer (pick one admin-created baseline) */}
            {showAddBaseline && (() => {
              const allBaselines = [
                { id: 'BAS-31', name: 'New Base Line - 64 Bit', desc: '', by: 'dikshika', initials: 'DI', color: '#3D8BD0', created: 'Thu, Jan 22, 2026 11:20 AM', published: 'Thu, Jan 22, 2026 11:20 AM' },
                { id: 'BAS-29', name: 'test-10', desc: '', by: 'Sakshi', initials: 'SA', color: '#10B981', created: 'Tue, Dec 02, 2025 04:10 PM', published: 'Tue, Dec 02, 2025 04:10 PM' },
                { id: 'BAS-27', name: 'test-1', desc: '', by: 'Sakshi', initials: 'SA', color: '#10B981', created: 'Tue, Dec 02, 2025 03:55 PM', published: 'Tue, Dec 02, 2025 03:55 PM' },
                { id: 'BAS-24', name: 'DEMO', desc: '', by: 'Nandini Patel', initials: 'NP', color: '#6366F1', created: 'Mon, Jun 09, 2025 10:30 AM', published: 'Mon, Jun 09, 2025 10:30 AM' },
                { id: 'BAS-21', name: 'Test', desc: '', by: 'Thanushree', initials: 'TH', color: '#F59E0B', created: 'Tue, Mar 25, 2025 02:15 PM', published: 'Tue, Mar 25, 2025 02:15 PM' },
                { id: 'BAS-18', name: 'Location Baseline', desc: '', by: 'Hetal Mori', initials: 'HM', color: '#EC4899', created: 'Fri, Aug 23, 2024 01:40 PM', published: 'Fri, Aug 23, 2024 01:40 PM' },
                { id: 'BAS-17', name: 'Hostname_IP address', desc: '', by: 'Parita', initials: 'PA', color: '#8B5CF6', created: 'Fri, Apr 12, 2024 11:20 AM', published: 'Fri, Apr 12, 2024 11:20 AM' },
                { id: 'BAS-16', name: 'Disk space Base line', desc: 'Disk space Base line', by: 'khushbu Vaniyc', initials: 'KV', color: '#0EA5E9', created: 'Thu, Nov 30, 2023 09:05 AM', published: 'Thu, Nov 30, 2023 09:05 AM' },
                { id: 'BAS-14', name: 'Baselining for Akola', desc: '', by: 'Udit', initials: 'UD', color: '#14B8A6', created: 'Fri, Jun 02, 2023 01:30 PM', published: 'Fri, Jun 02, 2023 01:30 PM' },
                { id: 'BAS-11', name: 'varsha base', desc: '', by: 'Ashish', initials: 'AS', color: '#EF4444', created: 'Tue, Nov 15, 2022 09:50 AM', published: 'Tue, Nov 15, 2022 09:50 AM' },
              ];
              const bq = baselineSearch.trim().toLowerCase();
              const rows = allBaselines.filter((b) => !bq || b.id.toLowerCase().includes(bq) || b.name.toLowerCase().includes(bq) || b.by.toLowerCase().includes(bq));
              const confirmAdd = () => {
                const sel = allBaselines.find((b) => b.id === selectedBaselineId);
                if (sel) setBaselines([{ id: sel.id, name: sel.name, createdOn: sel.created, createdBy: sel.by }]);
                setShowAddBaseline(false);
              };
              return (
                <>
                  <div className="fixed inset-0 bg-black/30 z-[10000]" onClick={() => setShowAddBaseline(false)} />
                  <div className="fixed top-0 right-0 h-full w-[820px] max-w-[96vw] bg-white shadow-2xl z-[10001] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                      <h2 className="text-[18px] font-semibold text-[#111827]">Add Baseline</h2>
                      <button onClick={() => setShowAddBaseline(false)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
                    </div>
                    <div className="px-6 py-4 flex-shrink-0">
                      <div className="relative max-w-[320px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input type="text" placeholder="Search" value={baselineSearch} onChange={(e) => setBaselineSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-[13px] text-[#364658] bg-white border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto px-6">
                      <table className="w-full text-[12px]">
                        <thead className="border-b border-[#e5e7eb]">
                          <tr>
                            <th className="w-[40px] px-2 py-2.5"></th>
                            {['ID', 'Name', 'Description', 'Created By', 'Created Date', 'Published On'].map((h) => (
                              <th key={h} className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb]">
                          {rows.map((b) => (
                            <tr key={b.id} className="hover:bg-[#F9FAFB] cursor-pointer" onClick={() => setSelectedBaselineId((cur) => (cur === b.id ? null : b.id))}>
                              <td className="px-2 py-3">
                                <input type="checkbox" checked={selectedBaselineId === b.id} onChange={() => setSelectedBaselineId((cur) => (cur === b.id ? null : b.id))} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0]" />
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-[#3D8BD0] font-medium">{b.id}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-[#364658] max-w-[160px] truncate">{b.name}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-[#364658] max-w-[160px] truncate">{b.desc}</td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-2">
                                  <span className="flex size-5 items-center justify-center rounded-sm text-[9px] font-semibold text-white" style={{ backgroundColor: b.color }}>{b.initials}</span>
                                  <span className="text-[#364658] max-w-[120px] truncate">{b.by}</span>
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-[#364658]">{b.created}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-[#364658]">{b.published}</td>
                            </tr>
                          ))}
                          {rows.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-10 text-center text-[#9CA3AF]">No baselines found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 text-[12px] text-[#7B8FA5] border-t border-[#E5E7EB] flex-shrink-0">Showing 1-{rows.length} of {rows.length} items</div>
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
                      <button onClick={confirmAdd} disabled={!selectedBaselineId} className="px-4 py-2 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#3578B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Add</button>
                      <button onClick={() => setShowAddBaseline(false)} className="px-4 py-2 rounded border border-[#DFE5ED] text-[#364658] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors">Cancel</button>
                    </div>
                  </div>
                </>
              );
            })()}

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
                  </div>
                  <div className="flex items-center gap-2 relative">
                    {!showSubTabSearch ? (
                      <button 
                        className="p-1.5 hover:bg-[#f9fafb] rounded"
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
                    <button className="p-1.5 hover:bg-[#f9fafb] rounded">
                      <Filter size={16} className="text-[#6b7280]" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-[#f9fafb] rounded"
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

                {/* Reporter Comment */}
                {activeConversationTab === 'all' && (
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
                {sentConversations.filter(c => c.ticketId === activeTicketId).map((conversation) => (
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
                externalRelations={activeTicket?.id ? (ticketRelations[activeTicket.id]?.length ? ticketRelations[activeTicket.id] : DEFAULT_REL) : undefined}
                onOpenRelation={onOpenRelation}
                initialTypeFilter={relationsInitialFilter}
                onClearTypeFilter={() => setRelationsInitialFilter(null)}
              />
            )}

            {/* Vulnerabilities Tab Content — Approved / Declined CVE buckets */}
            {activeMainTab === 'vulnerabilities' && <PatchVulnerabilitiesTab endpoints={patchComputers} />}

            {/* Computers Tab Content — Missing / Installed / Ignored buckets */}
            {activeMainTab === 'computers' && (
              <PatchComputersTab computers={patchComputers} setComputers={setPatchComputers} onInstall={handleInstallPatch} hideBuckets hideActions packageColumns hideBulkSelect />
            )}

            {/* Patches Tab Content — the patches this deployment rolls out */}
            {(activeMainTab as string) === 'registry' && <RegistryDeploymentRegistryTab />}

            {/* Installation Tab Content — deployment records for this patch */}
            {activeMainTab === 'installation' && (
              <PatchInstallationTab installations={patchInstallations} setInstallations={setPatchInstallations} onInstalled={handleInstallationSuccess} showTopology registryMode />
            )}

            {/* Superseded Tab Content — supersedence chain (Superseded / Superseded By) */}
            {activeMainTab === 'superseded' && <PatchSupersededTab patchId={activeAsset?.id} patchName={activeAsset?.name} />}

            {/* Audit Trails Tab Content */}
            {activeMainTab === 'audit' && (() => {
              const categories = [
                { id: 'audit', label: 'Audit Trail' },
                { id: 'movement', label: 'Movement History' },
                { id: 'repair', label: 'Repair History' },
              ];
              const activeCat = categories.find((c) => c.id === historyCategory) || categories[0];

              const auditEntries: { user: string; initials: string; color: string; action: string; details: string; field?: string; from?: string; to?: string; time: string }[] = [
                { user: 'Jainam Shah', initials: 'JS', color: '#F59E0B', action: 'Status Changed', details: 'Moved the deployment to Ready to Deploy', field: 'Status', from: 'Draft', to: 'Ready to Deploy', time: 'Sat, Jun 20, 2026 04:39 PM' },
                { user: 'Jainam Shah', initials: 'JS', color: '#F59E0B', action: 'Install Window Scheduled', details: 'Scheduled the installation window', field: 'Install After', from: '---', to: 'Sun, Jun 07, 2026 03:30 PM', time: 'Sat, Jun 20, 2026 02:12 PM' },
                { user: 'Rakesh Rathod', initials: 'RR', color: '#3D8BD0', action: 'Deployment Policy Changed', details: 'Switched the deployment to the staged production policy', field: 'Policy', from: 'Pilot Ring - Early Validation', to: 'Production Servers - Staged Rollout', time: 'Sat, Jun 20, 2026 11:05 AM' },
                { user: 'Jainam Shah', initials: 'JS', color: '#F59E0B', action: 'Retry Configuration Enabled', details: 'Enabled retry for failed configurations', field: 'Retry Count', from: '0', to: '2', time: 'Fri, May 22, 2026 05:30 PM' },
                { user: 'Jainam Shah', initials: 'JS', color: '#F59E0B', action: 'Deployment Created', details: 'Created the patch deployment from patch PCH-4345', time: 'Fri, May 22, 2026 10:14 AM' },
              ];
              const changeLogs = [
                { text: 'Monitor Component has been Added', by: 'Rakesh Rathod', time: 'Fri, Jun 19, 2026 05:17 PM' },
                { text: 'USB Controller Component has been Added', by: 'Rakesh Rathod', time: 'Fri, Jun 19, 2026 12:31 PM' },
                { text: 'OS Component has been Removed', by: 'Rakesh Rathod', time: 'Fri, Jun 19, 2026 12:29 PM' },
                { text: 'RAM Component : Size (GB) Updated from 8 to 32', by: 'Rakesh Rathod', time: 'Wed, Jun 17, 2026 06:41 PM' },
                { text: 'Computer System : User Name Updated from Constellation to leofan', by: 'Agent', time: 'Mon, May 18, 2026 11:27 AM' },
                { text: 'Processor Component : Intel(R) Core(TM) i5-8365U has been Added', by: 'Agent', time: 'Mon, May 18, 2026 09:33 AM' },
              ];
              const scanHistory = [
                'Mon, May 18, 2026 02:25 PM', 'Mon, May 18, 2026 01:25 PM', 'Mon, May 18, 2026 12:25 PM',
                'Mon, May 18, 2026 11:26 AM', 'Mon, May 18, 2026 09:48 AM', 'Mon, May 18, 2026 09:29 AM',
              ];
              const utilization = [
                ['Mon, May 18, 2026 11:23 AM', 'Mon, May 18, 2026 11:23 AM', '30 seconds', '51 minutes 3 seconds', 'Mon, May 18, 2026 11:26 AM'],
                ['Mon, May 18, 2026 10:28 AM', 'Mon, May 18, 2026 10:31 AM', '3 minutes 8 seconds', '45 seconds', 'Mon, May 18, 2026 11:26 AM'],
                ['Mon, May 18, 2026 10:27 AM', 'Mon, May 18, 2026 10:28 AM', '31 seconds', '12 minutes 54 seconds', 'Mon, May 18, 2026 11:26 AM'],
                ['Mon, May 18, 2026 09:43 AM', 'Mon, May 18, 2026 10:14 AM', '30 minutes 43 seconds', '---', 'Mon, May 18, 2026 10:27 AM'],
              ];
              const baselineHistory = [
                { id: 'BAS-31', by: 'Rakesh Rathod', on: 'Fri, Jun 19, 2026 07:17 PM', reason: 'New Baseline Added', latest: 'Yes' },
                { id: 'BAS-14', by: 'Rakesh Rathod', on: 'Wed, Jun 17, 2026 11:40 AM', reason: 'New Baseline Added', latest: 'No' },
                { id: 'BAS-31', by: 'System', on: 'Mon, May 18, 2026 09:33 AM', reason: 'New Baseline Added', latest: 'No' },
              ];

              const emptyState = (cols: string[]) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-[12px]">
                    <thead className="border-b border-[#e5e7eb]">
                      <tr>{cols.map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody><tr><td colSpan={cols.length} className="px-4 py-12 text-center text-[#9CA3AF]"><span className="inline-flex items-center gap-2"><Info size={18} /> No Data Found</span></td></tr></tbody>
                  </table>
                </div>
              );

              return (
                <div className="px-6 py-6">
                  {/* Sticky toolbar: title (left) + date range / filter / download (right).
                      The Patch page has only Audit Trail history, so the category dropdown was removed. */}
                  <div className="sticky top-[45px] z-30 -mx-6 px-6 -mt-6 pt-6 pb-3 bg-white flex items-center gap-3 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-[#364658]">Audit Trail</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[12px] text-[#7B8FA5] hidden sm:inline">Sat, Dec 20, 2025 — Sat, Jun 20, 2026</span>
                      <div className="relative">
                        <button onClick={() => { setHistDownloadOpen(false); setHistDraftFrom(histFrom); setHistDraftTo(histTo); setHistFilterOpen((o) => !o); }} title="Filter" className={`size-8 flex items-center justify-center rounded border transition-colors hover:bg-[#F3F4F6] ${histFrom || histTo ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#364658]'}`}><Filter size={15} /></button>
                        {histFilterOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setHistFilterOpen(false)} />
                            <div className="app-menu absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50 text-left">
                              <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Filter</h4>
                              <div className="space-y-3">
                                <div><label className="text-[12px] text-[#7B8FA5] mb-1 block">From</label><DateField value={histDraftFrom} onChange={setHistDraftFrom} /></div>
                                <div><label className="text-[12px] text-[#7B8FA5] mb-1 block">To</label><DateField value={histDraftTo} min={histDraftFrom || undefined} onChange={setHistDraftTo} /></div>
                              </div>
                              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#F0F1F3]">
                                <button onClick={() => { setHistFrom(''); setHistTo(''); setHistDraftFrom(''); setHistDraftTo(''); setHistFilterOpen(false); }} className="px-3 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Clear</button>
                                <button onClick={() => { setHistFrom(histDraftFrom); setHistTo(histDraftTo); setHistFilterOpen(false); }} className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Apply</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="relative">
                        <button onClick={() => { setHistFilterOpen(false); setHistDownloadOpen((o) => !o); }} title="Download" className="size-8 flex items-center justify-center rounded border border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6] transition-colors"><Download size={15} /></button>
                        {histDownloadOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setHistDownloadOpen(false)} />
                            <div className="app-menu absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50 text-left">
                              <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Download</h4>
                              <div className="mb-4"><label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Format</label><div className="inline-flex rounded border border-[#DFE5ED] overflow-hidden">{['PDF', 'Excel', 'CSV'].map((ff) => (<button key={ff} onClick={() => setHistDlFormat(ff)} className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${histDlFormat === ff ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}>{ff}</button>))}</div></div>
                              <div className="mb-3"><label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Password Protected</label><button onClick={() => setHistDlPw((v) => !v)} role="switch" aria-checked={histDlPw} className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${histDlPw ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}><span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${histDlPw ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} /></button></div>
                              {histDlPw && (<div className="mb-1"><label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Attachment Password <span className="text-[#EF4444]">*</span></label><div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" /><input type={histShowPw ? 'text' : 'password'} value={histDlPassword} onChange={(e) => setHistDlPassword(e.target.value)} placeholder="Attachment Password" className="w-full pl-9 pr-9 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]" /><button onClick={() => setHistShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]">{histShowPw ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></div>)}
                              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#F0F1F3]"><button onClick={() => setHistDownloadOpen(false)} className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Download</button><button onClick={() => setHistDownloadOpen(false)} className="px-3 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Cancel</button></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content per category */}
                  <div className="mt-2">
                    {historyCategory === 'audit' && (() => {
                      const dayLabel = (t) => t.replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)$/i, '');
                      const timeOf = (t) => (t.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] ?? '').replace(/^0/, '');
                      const inRange = (t) => { const d = new Date(t.substring(t.indexOf(',') + 2)); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if (histFrom && k < histFrom) return false; if (histTo && k > histTo) return false; return true; };
                      const grp = [];
                      for (const e of auditEntries.filter((x) => inRange(x.time))) {
                        const key = dayLabel(e.time);
                        let g = grp.find((x) => x.label === key);
                        if (!g) { g = { label: key, items: [] }; grp.push(g); }
                        g.items.push(e);
                      }
                      return (
                        <div className="space-y-6">
                          {grp.map((group) => (
                            <div key={group.label}>
                              <div className="flex items-center gap-3 mb-3"><span className="text-[12px] font-semibold text-[#7B8FA5] flex-shrink-0">{group.label}</span><div className="flex-1 h-px bg-[#EEF1F5]" /></div>
                              <div className="relative">
                                {group.items.map((e, index, arr) => (
                                  <div key={index} className="relative flex gap-3 py-3.5 px-2 -mx-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                                    {index !== arr.length - 1 && <div className="absolute left-[22px] top-[44px] bottom-[-2px] w-px bg-[#EEF1F5]" />}
                                    <div className="size-[26px] rounded-[6px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 relative z-10" style={{ backgroundColor: e.color }}>{e.initials}</div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[13px] font-semibold text-[#364658]">{e.user}</span>
                                        <span className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] rounded px-1.5 py-0.5">{e.action}</span>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-[#9CA3AF]"><Clock size={11} />{timeOf(e.time)}</span>
                                      </div>
                                      <p className="text-[13px] text-[#5A6B7B] mt-1">{e.details}</p>
                                      {e.field && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                          <span className="inline-flex items-center gap-1.5 text-[12px] bg-white border border-[#E8EDF3] rounded-md px-2 py-1">
                                            <span className="text-[#7B8FA5]">{e.field}</span>
                                            <span className="text-[#94A3B8] line-through">{e.from}</span>
                                            <span className="text-[#CBD5E1]">→</span>
                                            <span className="text-[#059669] font-medium">{e.to}</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {historyCategory === 'change-logs' && (
                      <div className="relative">
                        {changeLogs.map((c, index, array) => {
                          const ini = c.by === 'Agent' ? 'AG' : c.by.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                          const color = c.by === 'Agent' ? '#10B981' : '#3D8BD0';
                          return (
                            <div key={index} className="relative flex gap-3 mb-4 p-3 -mx-3 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                              {index !== array.length - 1 && <div className="absolute left-[24px] top-[24px] bottom-[-24px] w-[1px] bg-[#E5E7EB]" />}
                              <div className="size-[24px] rounded-[4px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 relative z-10" style={{ backgroundColor: color }}>{ini}</div>
                              <div className="flex-1 min-w-0">
                                <div className="py-1">
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[13px] font-semibold text-[#364658]">{c.by}</span>
                                        <span className="text-[12px] text-[#7B8FA5]">•</span>
                                        <span className="text-[12px] text-[#7B8FA5]">Change Log</span>
                                      </div>
                                      <p className="text-[13px] text-[#364658]">{c.text}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] whitespace-nowrap"><Clock size={11} /><span>{c.time}</span></div>
                                  </div>
                                  <button className="mt-1 text-[12px] text-[#3D8BD0] hover:underline font-medium">View Changes</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {historyCategory === 'scan' && (
                      <div className="relative">
                        {scanHistory.map((t, index, array) => (
                          <div key={index} className="relative flex gap-3 mb-4 p-3 -mx-3 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                            {index !== array.length - 1 && <div className="absolute left-[24px] top-[24px] bottom-[-24px] w-[1px] bg-[#E5E7EB]" />}
                            <div className="size-[24px] rounded-[4px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 relative z-10" style={{ backgroundColor: '#10B981' }}>AG</div>
                            <div className="flex-1 min-w-0">
                              <div className="py-1">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[13px] font-semibold text-[#364658]">Agent Discovery</span>
                                      <span className="text-[12px] text-[#7B8FA5]">•</span>
                                      <span className="text-[12px] text-[#7B8FA5]">Scan</span>
                                    </div>
                                    <p className="text-[13px] text-[#364658]">{activeAsset?.id || 'Asset'} was scanned successfully</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] whitespace-nowrap"><Clock size={11} /><span>{t}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {historyCategory === 'wol' && emptyState(['History Date', 'Source', 'WOL Status', 'WOL Remarks', 'Last Updated Date'])}
                    {historyCategory === 'movement' && emptyState(['ID', 'Requester', 'Movement Date', 'Movement Type', 'Movement Status', 'From Location', 'To Location', 'From Department', 'To Department', 'Returnable/Transferable'])}
                    {historyCategory === 'repair' && emptyState(['Requester', 'Reference No', 'Vendor', 'Sent Date', 'Expected Return', 'In Warranty', 'Return Date', 'Repair Type', 'Repair Cost', 'Warranty Cost', 'Replaced', 'Replaced By', 'Action'])}

                    {historyCategory === 'utilization' && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-[12px]">
                          <thead className="border-b border-[#e5e7eb]">
                            <tr>{['From Time', 'To Time', 'Up Time Duration', 'Down Time Duration', 'Last Updated Date'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e7eb] bg-white">
                            {utilization.map((row, i) => (
                              <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                                {row.map((cell, j) => <td key={j} className={`px-4 py-3 whitespace-nowrap ${cell === '---' ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {historyCategory === 'baseline-history' && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-[12px]">
                          <thead className="border-b border-[#e5e7eb]">
                            <tr>
                              <th className="w-[40px] px-4 py-2.5"></th>
                              {['ID', 'Created By', 'Created On', 'Reason', 'Change Id', 'Change Status', 'Request Id', 'Request Status', 'Latest', 'Actions'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e7eb] bg-white">
                            {baselineHistory.map((b, i) => (
                              <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                                <td className="px-4 py-3"><input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0]" /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#3D8BD0] font-medium">{b.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.by}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.on}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#364658] max-w-[160px] truncate">{b.reason}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#9CA3AF]">---</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#9CA3AF]">---</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#9CA3AF]">---</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#9CA3AF]">---</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#364658]">{b.latest}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><button title="View" className="text-[#7B8FA5] hover:text-[#3D8BD0]"><Eye size={15} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {historyCategory === 'variance-history' && emptyState(['History Id', 'Detection Date', 'Asset Component', 'Attribute Name', 'Expected Value', 'Current Value', 'Approval Status', 'Approval By', 'Approval Date', 'Change Id', 'Request Id', 'Reference Rollback Request'])}
                  </div>
                </div>
              );
            })()}

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
            ticketId={activeTicket?.id}
            showSla={false}
            assetMode={true}
            softwareMode={true}
            nonItMode={true}
            patchMode={true}
            patchDeployMode={true}
            registryDeployMode={true}
            assetState={assetState}
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
            propertiesTitle="Registry Deployment Properties"
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
      
      {/* Add Barcode Popup */}
      {showAddBarcodePopup && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30"
          onClick={() => setShowAddBarcodePopup(false)}
        >
          <div
            className="w-[340px] bg-white rounded-xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-[#364658] mb-4">Add Barcode</h3>

            <button className="w-full py-2.5 border border-[#DFE5ED] rounded-lg text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB] transition-colors">
              Generate New Barcode
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-[#E5E7EB]" />
              <span className="text-[12px] font-medium text-[#7B8FA5]">Or</span>
              <div className="flex-1 border-t border-[#E5E7EB]" />
            </div>

            <label className="block text-[12px] font-medium text-[#364658] mb-1.5">
              Associate a Barcode <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              value={addBarcodeValue}
              onChange={(e) => setAddBarcodeValue(e.target.value)}
              placeholder="Barcode"
              className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0]"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setShowAddBarcodePopup(false); setAddBarcodeValue(''); }}
                className="px-5 py-2 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2F7AB8] transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
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
      />
    </div>
  );
}

export default RegistryDeploymentDrawer;
