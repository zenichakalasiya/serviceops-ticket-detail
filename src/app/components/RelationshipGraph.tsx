import { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  useInternalNode,
  useStore,
  getSmoothStepPath,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Monitor, Keyboard, Maximize, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Map as MapIcon, ChevronDown,
  MemoryStick, Cpu, Globe, ShieldCheck, Network, Server, HardDrive, Smartphone, Printer, User, AppWindow, Mouse, Router, Database,
  Building2, List, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useShortcutContext } from './shortcutContext';

export type RelType = 'user' | 'software' | 'hardware' | 'asset' | 'department';
export interface RelNodeInput { label: string; type: RelType; rel?: string }
export interface RelTypeMeta { color: string; icon: React.ReactNode; label: string }

/** Tunables exposed by the Advanced Configuration panel — every value feeds the engine. */
export interface RelGraphConfig {
  /** Extra spacing (px) added to every group ring. */
  nodeDistance: number;
  /** Multiplier for how strongly groups push each other apart. */
  repulsion: number;
  /** Spring strength pulling each group toward its parent. */
  gravity: number;
  minZoom: number;
  maxZoom: number;
  /** Max width (px) of node labels. */
  labelWidth: number;
  /** When true, nodes can't be dragged/moved manually (the layout is locked for everyone). */
  locked: boolean;
}
export const DEFAULT_REL_GRAPH_CONFIG: RelGraphConfig = {
  nodeDistance: 20,
  repulsion: 1,
  gravity: 0.22,
  minZoom: 0.3,
  maxZoom: 2.5,
  labelWidth: 150,
  locked: false,
};

interface RelationshipGraphProps {
  mode: 'graph' | 'tree';
  nodes: RelNodeInput[];
  typeMeta: Record<string, RelTypeMeta>;
  centerName: string;
  centerId?: string;
  /** Bumping this re-fits the view (wired to the toolbar Refresh button). */
  refreshSignal?: number;
  /** Highlights nodes whose label matches; everything else fades out. */
  searchTerm?: string;
  /** Advanced Configuration values (layout spacing, physics, zoom limits, labels). */
  config?: Partial<RelGraphConfig>;
  /** Hides the on-canvas controls (d-pad, zoom, minimap…) — used for the settings preview. */
  hideControls?: boolean;
  /** Static preview: one level only, no badges, no expand/drag/pan/zoom interactions. */
  previewMode?: boolean;
  /** Type filter (from the toolbar Filter menu): nodes of other types fade out. Accepts one
   *  or MANY types (multi-select). */
  typeFilter?: RelType | RelType[] | null;
  /** Called from the hover card's ↗ button — opens that node's record (e.g. as a drawer tab). */
  onOpenNode?: (info: { id: string; name: string; type: RelType }) => void;
  /** Called from a node's hover "+" badge — the host opens the Add Relationship panel. */
  onAddRelation?: (info: { id: string; name: string }) => void;
  /** Called from the hover card's "N active issues" strip — the host opens the Active Issues panel. */
  onShowIssues?: (info: { id: string; name: string }) => void;
  /** User-added relationships, keyed by source node id ('center' for the root asset). */
  extraChildren?: Record<string, ExtraRelChild[]>;
  /** Mock-data profile: 'cmdb' generates CI-style names + varied relation labels. */
  mockProfile?: 'cmdb';
  /** Bump to expand EVERY node at once (toolbar "Expand all"). */
  expandAllSignal?: number;
  /** Bump to collapse every node back to the first level (toolbar "Collapse all"). */
  collapseAllSignal?: number;
  /** The graph fills this ref with a capture/restore API for the toolbar "Saved Views" feature. */
  snapshotRef?: React.RefObject<RelGraphSnapshotApi | null>;
  /** Connection-type filter (edge relation labels, e.g. "Hosted On"): only edges with one of
   *  those relations — and the nodes at their two ends — stay lit; everything else fades out.
   *  Accepts one or MANY labels (multi-select). */
  connectionFilter?: string | string[] | null;
  /** Reports the DISTINCT connection types currently on the canvas (drives the toolbar
   *  Connection dropdown, so options always match the real edges incl. user-added ones). */
  onConnectionTypesChange?: (rels: string[]) => void;
}

/** Canvas state captured by a Saved View: expansions, manual pins, and the viewport. */
export interface RelViewSnapshot {
  expanded: string[];
  manual: Record<string, { x: number; y: number }>;
  viewport?: { x: number; y: number; zoom: number };
}
export interface RelGraphSnapshotApi {
  capture: () => RelViewSnapshot;
  restore: (s: RelViewSnapshot) => void;
}

/* Pick the most accurate icon from the node's NAME (falls back to its type). */
function iconForNode(label: string, type: RelType): React.ReactNode {
  const l = label.toLowerCase();
  if (/monitor|display|screen/.test(l)) return <Monitor />;
  if (/\bram\b|memory|ddr\d?/.test(l)) return <MemoryStick />;
  if (/cpu|processor|intel|\bamd\b|ryzen|xeon|\bi[3579]\b|core\s*i/.test(l)) return <Cpu />;
  if (/edge|chrome|firefox|safari|opera|browser/.test(l)) return <Globe />;
  if (/vpn|firewall|antivirus|defender|bitdefender|security|endpoint/.test(l)) return <ShieldCheck />;
  if (/router|gateway/.test(l)) return <Router />;
  if (/switch|\bsw[-\s]|core|network|lan/.test(l)) return <Network />;
  if (/server|\bsrv\b|host|esxi|hyper[-\s]?v|vmware/.test(l)) return <Server />;
  if (/database|\bsql\b|oracle|postgres|mysql|mongo/.test(l)) return <Database />;
  if (/disk|\bssd\b|\bhdd\b|storage|\bdrive\b|volume/.test(l)) return <HardDrive />;
  if (/phone|mobile|iphone|android|ipad|tablet/.test(l)) return <Smartphone />;
  if (/printer|print/.test(l)) return <Printer />;
  if (/keyboard/.test(l)) return <Keyboard />;
  if (/mouse/.test(l)) return <Mouse />;
  // Fall back to the relationship type.
  if (type === 'user') return <User />;
  if (type === 'software') return <AppWindow />;
  if (type === 'hardware') return <Cpu />;
  if (type === 'department') return <Building2 />;
  return <Network />;
}

/* -------------------- Active issues (open linked Request/Problem/Change) -------------------- */
export interface ActiveIssue { id: string; subject: string; status: string; priority: string; closed?: boolean }
export interface ActiveIssues { requests: ActiveIssue[]; problems: ActiveIssue[]; changes: ActiveIssue[]; openCount: number }

const REQ_SUBJECTS = ['Laptop running slow after update', 'VPN disconnects frequently', 'Request additional 16GB RAM', 'Screen flickering on dock', 'Outlook not syncing'];
const PRB_SUBJECTS = ['Recurring BSOD on boot', 'Battery drains within 2 hours', 'Wi-Fi drops in conference rooms', 'Fan noise under light load'];
const CHG_SUBJECTS = ['Firmware upgrade to v2.4', 'Migrate to Windows 11 23H2', 'Replace failing SSD', 'BIOS security patch rollout'];
const OPEN_STATUSES = ['Open', 'In Progress', 'Pending'];
const ISSUE_PRIORITIES = ['High', 'Medium', 'Low'];

function issueRows(name: string, kind: string, pfx: string, subjects: string[], nOpen: number, nClosed: number): ActiveIssue[] {
  const h = hashIssues(name + '|' + kind);
  const out: ActiveIssue[] = [];
  for (let i = 0; i < nOpen + nClosed; i++) {
    const closed = i >= nOpen;
    out.push({
      id: `${pfx}-${9000 + ((h + i * 97) % 900)}`,
      subject: subjects[(h + i) % subjects.length],
      status: closed ? 'Closed' : OPEN_STATUSES[(h + i) % OPEN_STATUSES.length],
      priority: ISSUE_PRIORITIES[(h + i * 3) % ISSUE_PRIORITIES.length],
      closed,
    });
  }
  return out;
}
function hashIssues(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
/** Deterministic mock: ~1/3 of nodes have OPEN linked records → their circle fills red. */
export function activeIssuesFor(name: string): ActiveIssues {
  const h = hashIssues(name + '|issues');
  if (h % 3 !== 0) return { requests: [], problems: [], changes: [], openCount: 0 };
  const requests = issueRows(name, 'req', 'SR', REQ_SUBJECTS, 1 + (h % 3), h % 2);
  const problems = h % 2 === 0 ? issueRows(name, 'prb', 'PRB', PRB_SUBJECTS, 1 + (h % 2), (h >> 2) % 2) : [];
  const changes = h % 5 < 2 ? issueRows(name, 'chg', 'CHG', CHG_SUBJECTS, 1, (h >> 3) % 2) : [];
  const openCount = [...requests, ...problems, ...changes].filter((i) => !i.closed).length;
  return { requests, problems, changes, openCount };
}

/* -------------------- Hover-card details (deterministic mock) -------------------- */
const HOVER_OWNERS = ['Tabrez Khan', 'Rohan Mehta', 'Neha Rao', 'Farah Shah', 'Vikram S.'];
const HOVER_DEPTS = ['IT Operations', 'Finance', 'Engineering', 'HR', 'Sales'];
const DOT = { green: '#22A06B', amber: '#F59E0B', red: '#EF4444', gray: '#9CA3AF' };
interface HoverRow { label: string; value: string; dot?: string }
function hoverRowsFor(label: string, type: RelType): { id: string; rows: HoverRow[] } {
  const h = hash(label);
  const owner = HOVER_OWNERS[h % 5];
  const impact = (['Low', 'Medium', 'High'] as const)[h % 3];
  const impactDot = { Low: DOT.green, Medium: DOT.amber, High: DOT.red }[impact];
  if (type === 'user') {
    return {
      id: `USR-${100 + (h % 900)}`,
      rows: [
        { label: 'Type', value: 'User' },
        { label: 'Status', value: 'Active', dot: DOT.green },
        { label: 'Department', value: HOVER_DEPTS[h % 5] },
        { label: 'VIP', value: h % 4 === 0 ? 'Yes' : 'No' },
      ],
    };
  }
  if (type === 'department') {
    return {
      id: `DEP-${100 + (h % 200)}`,
      rows: [
        { label: 'Type', value: 'Department' },
        { label: 'Status', value: 'Active', dot: DOT.green },
        { label: 'Head', value: HOVER_OWNERS[h % 5] },
        { label: 'Members', value: String(4 + (h % 60)) },
      ],
    };
  }
  if (type === 'software') {
    return {
      id: `SWAST-${10000 + (h % 90000)}`,
      rows: [
        { label: 'Asset Type', value: 'Software' },
        { label: 'Status', value: 'Active', dot: DOT.green },
        { label: 'Version', value: `${1 + (h % 9)}.${h % 10}.${h % 20}` },
        { label: 'Installations', value: String(1 + (h % 40)) },
      ],
    };
  }
  if (type === 'asset') {
    return {
      id: `CI-${100 + (h % 900)}`,
      rows: [
        { label: 'Asset Type', value: 'Network / CI' },
        { label: 'Status', value: 'Operational', dot: DOT.green },
        { label: 'IP Address', value: `172.16.${h % 30}.${(h * 7) % 250}` },
        { label: 'Managed By', value: owner },
      ],
    };
  }
  return {
    id: `AST-${100 + (h % 900)}`,
    rows: [
      { label: 'Asset Type', value: 'Hardware' },
      { label: 'Status', value: h % 5 === 0 ? 'Available' : 'In Use', dot: h % 5 === 0 ? DOT.gray : DOT.green },
      { label: 'Owner', value: owner },
      { label: 'Impact', value: impact, dot: impactDot },
    ],
  };
}

/* ----------------------------- Custom nodes ----------------------------- */

const hiddenHandle = '!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !bg-transparent';

// The label sits below the shape and is absolutely positioned + pointer-events-none so it
// does NOT contribute to the node's measured box — that keeps the floating edges attached
// to the icon's centre rather than the (taller) icon+label bounding box.
function CenterNode({ id, data }: NodeProps) {
  const d = data as { name: string; id?: string; size?: number; onAddRel?: (id: string) => void };
  // Deliberately LARGER than every other node — and it GROWS with the graph (data.size is
  // set by the layout from the visible node count), so with 10-15 open groups the root
  // still dominates the zoomed-out view.
  const s = d.size ?? 64;
  return (
    <div className="relative group">
      <div
        className="flex items-center justify-center bg-[#3D8BD0] text-white shadow-lg"
        style={{ width: s, height: s, borderRadius: s / 4, boxShadow: `0 0 0 ${Math.round(s / 12)}px rgba(61,139,208,0.15), 0 10px 15px -3px rgba(0,0,0,0.1)` }}
      >
        <Monitor size={Math.round(s * 0.42)} />
      </div>
      {/* Hover "+" → Add Relationship panel for the root asset */}
      {d.onAddRel && (
        <button
          onClick={(e) => { e.stopPropagation(); d.onAddRel?.(id); }}
          title="Add Relationship"
          className="nodrag absolute -bottom-1 -right-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-white text-[#3D8BD0] shadow-sm ring-2 ring-[#3D8BD0] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#EAF2FB]"
        >
          <Plus size={13} strokeWidth={2.75} />
        </button>
      )}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[190px] text-center pointer-events-none">
        <div className="text-[13px] font-semibold text-[#364658] truncate">{d.name}</div>
        {d.id ? <div className="text-[11px] text-[#7B8FA5] truncate">{d.id}</div> : null}
      </div>
      <Handle type="source" position={Position.Top} className={hiddenHandle} isConnectable={false} />
      <Handle type="target" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

function ItemNode({ id, data }: NodeProps) {
  const d = data as { label: string; color: string; icon: React.ReactNode; childCount?: number; expanded?: boolean; labelWidth?: number; hasIssues?: boolean; onToggle?: (id: string) => void; onAddRel?: (id: string) => void };
  const hasChildren = (d.childCount ?? 0) > 0;
  const toggle = (e: React.MouseEvent) => { e.stopPropagation(); d.onToggle?.(id); };
  // Only at the deepest zoom-out levels (the last ~2 steps before minZoom 0.3) are the
  // ring + icon truly indistinguishable — switch to a solid filled circle (white icon on
  // the type color) there; everywhere else keep the normal ring style.
  const compact = useStore((s) => s.transform[2] < 0.45);
  // Assets with OPEN linked Request/Problem/Change records fill SOLID RED (any zoom).
  const nodeStyle = d.hasIssues
    ? { backgroundColor: '#EF4444', borderColor: '#DC2626', color: '#FFFFFF', boxShadow: '0 0 0 4px rgba(239,68,68,0.15)' }
    : compact
      ? { backgroundColor: d.color, borderColor: d.color, color: '#FFFFFF' }
      : { backgroundColor: '#FFFFFF', borderColor: d.color, color: d.color };
  return (
    <div className="relative group cursor-pointer">
      <div
        className="flex items-center justify-center size-14 rounded-full border-2 shadow-sm [&_svg]:size-5 transition-colors duration-150"
        style={nodeStyle}
      >
        {d.icon}
      </div>
      {hasChildren && (
        d.expanded ? (
          // Expanded → minus badge; ONLY this collapses the node.
          <button onClick={toggle} className="nodrag absolute -top-1 -right-1 flex size-[18px] cursor-pointer items-center justify-center rounded-full bg-[#64748B] text-white shadow-sm ring-2 ring-white transition-colors hover:bg-[#475569]" title="Collapse">
            <Minus size={12} strokeWidth={2.75} />
          </button>
        ) : (
          // Collapsed → count badge; ONLY this expands the node.
          <button onClick={toggle} className="nodrag absolute -top-1 -right-1 flex min-w-[18px] h-[18px] cursor-pointer items-center justify-center rounded-full bg-[#334155] px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white transition-colors hover:bg-[#1E293B]" title="Expand">{d.childCount}</button>
        )
      )}
      {/* Hover "+" → Add Relationship panel for this node */}
      {d.onAddRel && (
        <button
          onClick={(e) => { e.stopPropagation(); d.onAddRel?.(id); }}
          title="Add Relationship"
          className="nodrag absolute -bottom-1 -right-1 flex size-[18px] cursor-pointer items-center justify-center rounded-full bg-[#3D8BD0] text-white shadow-sm ring-2 ring-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#2F7AB8]"
        >
          <Plus size={12} strokeWidth={2.75} />
        </button>
      )}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-center text-[12px] font-medium text-[#364658] truncate pointer-events-none" style={{ width: d.labelWidth ?? 150 }}>{d.label}</div>
      <Handle type="target" position={Position.Top} className={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

/* Floating edge: a straight line between the two nodes' centers (topology look).
 * When its node is hovered/selected the edge turns into an animated dashed primary-blue
 * line whose dashes flow AWAY from that node, tracing the direction of the connection. */
function FloatingEdge({ id, source, target, style, data }: EdgeProps) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t) return null;
  const sx = s.internals.positionAbsolute.x + (s.measured.width ?? 0) / 2;
  const sy = s.internals.positionAbsolute.y + (s.measured.height ?? 0) / 2;
  const tx = t.internals.positionAbsolute.x + (t.measured.width ?? 0) / 2;
  const ty = t.internals.positionAbsolute.y + (t.measured.height ?? 0) / 2;
  const d = data as { hl?: boolean; outward?: boolean; dim?: boolean; rel?: string; tree?: boolean } | undefined;
  let path: string;
  let mlx: number, mly: number; // point on the line for the relation label
  if (d?.tree) {
    // TREE view: rounded-elbow org-chart connector — parent drops from its BOTTOM to a horizontal
    // bus at the mid-height, then down into each child's TOP, with rounded corners on both sides.
    const sBottom = s.internals.positionAbsolute.y + (s.measured.height ?? 0);
    const tTop = t.internals.positionAbsolute.y;
    const [p, lx, ly] = getSmoothStepPath({ sourceX: sx, sourceY: sBottom, sourcePosition: Position.Bottom, targetX: tx, targetY: tTop, targetPosition: Position.Top, borderRadius: 16 });
    path = p; mlx = lx; mly = ly;
  } else {
    // FULL view: swirled quadratic Bézier — control point bowed PERPENDICULAR to the straight
    // line with a consistent handedness, so every spoke sweeps out the same rotational way and
    // the graph reads as a smooth pinwheel/spiral (Motadata topology style).
    const dxE = tx - sx, dyE = ty - sy;
    const len = Math.hypot(dxE, dyE) || 1;
    const bow = len * 0.22;
    const cpx = (sx + tx) / 2 + (-dyE / len) * bow;
    const cpy = (sy + ty) / 2 + (dxE / len) * bow;
    path = `M ${sx},${sy} Q ${cpx},${cpy} ${tx},${ty}`;
    mlx = 0.25 * sx + 0.5 * cpx + 0.25 * tx; mly = 0.25 * sy + 0.5 * cpy + 0.25 * ty;
  }
  const st = d?.hl
    ? {
        stroke: '#3D8BD0',
        strokeWidth: 2,
        strokeDasharray: '7 5',
        animation: `${d.outward ? 'rel-dash-fwd' : 'rel-dash-rev'} 0.5s linear infinite`,
      }
    : { stroke: '#CBD5E1', strokeWidth: 1.5, opacity: d?.dim ? 0.12 : 1, transition: 'opacity 0.2s' };
  // Relation label (Depends On / Users / …) rides along the line, upright, ONLY while
  // the edge is highlighted by a hover/click on one of its nodes.
  let labelEl: React.ReactNode = null;
  if (d?.hl && d?.rel) {
    // Label rides on the actual line (curve midpoint for full view, bus point for tree view).
    const mx = mlx, my = mly;
    let angle = d?.tree ? 0 : (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180; // keep the text readable left-to-right
    labelEl = (
      <EdgeLabelRenderer>
        <div
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${mx}px, ${my}px) rotate(${angle}deg) translateY(-10px)`, pointerEvents: 'none' }}
          className="text-[10px] font-medium text-[#3D8BD0] whitespace-nowrap"
        >
          {d.rel}
        </div>
      </EdgeLabelRenderer>
    );
  }
  return (
    <>
      <BaseEdge id={id} path={path} style={{ ...st, ...style }} />
      {labelEl}
    </>
  );
}

const nodeTypes = { center: CenterNode, item: ItemNode };
const edgeTypes = { floating: FloatingEdge };

/* -------------------- Expandable topology (deterministic mock children) --------------------
 * Each node can have further connected nodes. They aren't drawn until the user clicks the node;
 * the node shows a count badge for its (collapsed) children. Clicking expands/collapses them,
 * and expanded children can themselves be expanded — recursively. */
interface TreeNode { id: string; label: string; type: RelType; parentId: string; children: TreeNode[]; rel?: string }

/** A user-added relationship (from the Add Relationship panel), keyed by the source node's id. */
export interface ExtraRelChild { label: string; type: RelType; rel: string }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const CHILD_TYPES: RelType[] = ['hardware', 'software', 'asset', 'user', 'department'];
function mockLabel(type: RelType, seed: number): string {
  if (type === 'user') return ['A. Kumar', 'R. Shah', 'M. Patel', 'S. Iyer', 'N. Rao'][seed % 5];
  if (type === 'department') return ['IT Operations', 'Finance', 'Engineering', 'HR', 'Sales'][seed % 5];
  if (type === 'software') return ['nginx', 'PostgreSQL', 'Redis', 'Docker', 'MS Office', 'Chrome'][seed % 6];
  const pfx = ['win-', 'linux-', 'srv-', 'vm', ''][seed % 5];
  return pfx ? `${pfx}${(seed % 900) + 100}` : `172.16.${seed % 30}.${(seed * 7) % 250}`;
}
/* CMDB profile: CI-style names + a varied, semantically matching relation per child
 * (Hosts / Hosted On / Connected to / Send Data to / Impacts / Impacted By / Runs On /
 * Uses / Used By / Users / Depends On). */
function cmdbChild(type: RelType, seed: number): { label: string; rel: string } {
  if (type === 'user') {
    return {
      label: ['A. Kumar (Admin)', 'S. Iyer', 'R. Shah', 'V. Sethi (DBA)', 'N. Rao'][seed % 5],
      rel: ['Used By', 'Users'][seed % 2],
    };
  }
  if (type === 'department') {
    return {
      label: ['Finance', 'IT Operations', 'HR', 'Sales', 'Engineering'][seed % 5],
      rel: ['Used By', 'Users'][seed % 2],
    };
  }
  if (type === 'software') {
    return {
      label: ['MS SQL Server 2022', 'SAP ERP Client', 'Exchange Connector', 'Redis Cache', 'Payroll Service', 'Auth Service', 'Nginx Gateway', 'Backup Agent'][seed % 8],
      rel: ['Runs On', 'Uses', 'Send Data to', 'Depends On'][seed % 4],
    };
  }
  if (type === 'hardware') {
    return {
      label: [`DC1-APP-0${(seed % 8) + 1}`, `PRDC-ESX-0${(seed % 4) + 1}`, `COMPAST-67${(seed % 90) + 10}`, `LAP-58${(seed % 90) + 10}`][seed % 4],
      rel: ['Hosts', 'Hosted On', 'Connected to'][seed % 3],
    };
  }
  return {
    label: ['PROD-DB-CLUSTER', 'LB-EDGE-01', 'SAN-STORAGE-01', `DC2-SW-EDGE-0${(seed % 4) + 1}`, 'Email Relay Service', 'AD-DS-PRIMARY'][seed % 6],
    rel: ['Depends On', 'Impacts', 'Impacted By', 'Connected to'][seed % 4],
  };
}
function genChildren(parentId: string, depth: number, profile?: 'cmdb'): TreeNode[] {
  const h = hash(parentId + '|' + depth);
  // Realistic customer mix: most nodes have a handful of connections, but some (a core
  // switch, hypervisor, …) fan out to 20+ children — the layout wraps those into
  // multiple staggered rings.
  const count =
    depth === 1 ? (h % 4 === 0 ? 20 + (h % 9) : 2 + (h % 3)) // some 20-28, rest 2-4
    : depth === 2 ? (h % 7 === 0 ? 5 + (h % 3) : h % 3) // occasionally 5-7, rest 0-2
    : 0;
  const out: TreeNode[] = [];
  for (let k = 0; k < count; k++) {
    const id = `${parentId}.${k}`;
    const seed = hash(id);
    const type = CHILD_TYPES[seed % CHILD_TYPES.length];
    if (profile === 'cmdb') {
      const c = cmdbChild(type, seed);
      out.push({ id, label: c.label, type, parentId, children: [], rel: c.rel });
    } else {
      out.push({ id, label: mockLabel(type, seed), type, parentId, children: [] });
    }
  }
  out.forEach((c) => { c.children = genChildren(c.id, depth + 1, profile); });
  return out;
}

/* ------------------------------ Canvas controls ------------------------------ */

/* Small keycap chip used by the shortcuts popup. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] h-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[3px]">
      <span className="flex items-center gap-1">{keys}</span>
      <span className="text-[12px] text-[#7B8FA5] whitespace-nowrap">{label}</span>
    </div>
  );
}

function CanvasControls({ panBy, showMap, setShowMap, legend, showLegend, setShowLegend }: { panBy: (dx: number, dy: number) => void; showMap: boolean; setShowMap: (v: boolean) => void; legend: { label: string; color: string }[]; showLegend: boolean; setShowLegend: (v: boolean) => void }) {
  const rf = useReactFlow();
  const [showKeys, setShowKeys] = useState(false);
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  return (
    <>
      {/* Top-right: keyboard shortcuts · fit & center · zoom in/out */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowKeys((v) => !v)} className={`${btn} ${showKeys ? 'bg-[#EAF2FB] text-[#3D8BD0]' : ''}`}><Keyboard size={14} /></button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.2, duration: 300 })} className={`${btn} border-t border-[#E5E7EB]`}><Maximize size={13} /></button></TooltipTrigger>
            <TooltipContent side="left">Fit &amp; center</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
        </div>
        {/* Keyboard shortcuts popup */}
        {showKeys && (
          <>
            <div className="fixed inset-0" onClick={() => setShowKeys(false)} />
            <div className="absolute right-9 top-0 w-[290px] rounded-lg border border-[#E5E7EB] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0F1F3]">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#364658]">
                  <Keyboard size={14} className="text-[#6B7280]" /> Keyboard Shortcuts
                </span>
                <button onClick={() => setShowKeys(false)} className="text-[#9CA3AF] hover:text-[#364658] transition-colors" title="Close">
                  <Minus size={14} />
                </button>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Navigation</div>
                <ShortcutRow keys={<><Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd></>} label="Pan graph" />
                <ShortcutRow keys={<><Kbd>+</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>−</Kbd></>} label="Zoom in / out" />
                <ShortcutRow keys={<Kbd>F</Kbd>} label="Fit & center all nodes" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">View</div>
                <ShortcutRow keys={<><Kbd>1</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>2</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>3</Kbd></>} label="Full / Tree / Grid view" />
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>Shift</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Toggle fullscreen" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">UI</div>
                <ShortcutRow keys={<Kbd>M</Kbd>} label="Toggle minimap" />
                <ShortcutRow keys={<Kbd>L</Kbd>} label="Toggle type legend" />
                <ShortcutRow keys={<Kbd>R</Kbd>} label="Reset layout" />
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Focus search" />
                <ShortcutRow keys={<Kbd>Escape</Kbd>} label="Clear search / deselect" />
              </div>
            </div>
          </>
        )}
      </div>
      {/* Bottom-left: directional pan */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild><button onClick={() => panBy(0, -40)} className={padBtn}><ArrowUp size={14} /></button></TooltipTrigger>
          <TooltipContent side="top">Move up</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(-40, 0)} className={padBtn}><ArrowLeft size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(0, 40)} className={padBtn}><ArrowDown size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move down</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(40, 0)} className={padBtn}><ArrowRight size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move right</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Bottom-right: legend (hidden by default, toggled by its icon) + minimap (collapsible) */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
        {showLegend && (
          <div className="w-[190px] rounded-xl border border-[#E5E7EB] bg-white shadow-lg px-4 py-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#364658]">Types</span>
              <button onClick={() => setShowLegend(false)} className="text-[#9CA3AF] transition-colors hover:text-[#364658]" title="Close">
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="space-y-2.5">
              {legend.map((g) => (
                <div key={g.label} className="flex items-center gap-2.5">
                  <span className="h-[18px] w-[18px] rounded-md border" style={{ backgroundColor: `${g.color}26`, borderColor: `${g.color}80` }} />
                  <span className="text-[13px] text-[#364658]">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showMap && (
          <div className="w-[220px] rounded-lg border border-[#E5E7EB] bg-white shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#F0F1F3]">
              <span className="text-[12px] font-semibold text-[#364658]">Minimap</span>
              <button onClick={() => setShowMap(false)} className="text-[#9CA3AF] hover:text-[#364658] transition-colors" title="Collapse">
                <ChevronDown size={14} />
              </button>
            </div>
            <MiniMap
              className="!static !m-0"
              style={{ width: 218, height: 138 }}
              pannable
              zoomable
              maskColor="rgba(148,163,184,0.12)"
              nodeColor={(n) => (n.type === 'center' ? '#3D8BD0' : (n.data as { hasIssues?: boolean })?.hasIssues ? '#EF4444' : ((n.data as { color?: string })?.color ?? '#CBD5E1'))}
              nodeStrokeWidth={2}
              nodeBorderRadius={999}
            />
          </div>
        )}
        {/* Both toggle icons stay visible; the two panels are mutually exclusive —
            opening one closes the other. */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => { const open = !showLegend; setShowLegend(open); if (open) setShowMap(false); }} className={`flex size-8 items-center justify-center rounded border shadow-sm transition-colors ${showLegend ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F5F7FA]'}`}>
                <List size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Type legend</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => { const open = !showMap; setShowMap(open); if (open) setShowLegend(false); }} className={`flex size-8 items-center justify-center rounded border shadow-sm transition-colors ${showMap ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F5F7FA]'}`}>
                <MapIcon size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Minimap</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Inner (uses hooks) ------------------------------ */

function RelationshipGraphInner({ mode, nodes: data, typeMeta, centerName, centerId, refreshSignal, searchTerm, config, hideControls, previewMode, typeFilter, onOpenNode, onAddRelation, onShowIssues, extraChildren, mockProfile, expandAllSignal, collapseAllSignal, snapshotRef, connectionFilter, onConnectionTypesChange }: RelationshipGraphProps) {
  const rf = useReactFlow();
  const cfg: RelGraphConfig = { ...DEFAULT_REL_GRAPH_CONFIG, ...(config ?? {}) };

  // Build the full (deterministic) topology tree for the current first-level data, and index it.
  const dataSig = data.map((d) => `${d.label}:${d.type}`).join('|');
  const tree: TreeNode[] = data.map((d, i) => ({ id: `n${i}`, label: d.label, type: d.type, parentId: 'center', rel: d.rel, children: genChildren(`n${i}`, 1, mockProfile) }));
  const treeMap = new Map<string, TreeNode>();
  const indexTree = (t: TreeNode) => { treeMap.set(t.id, t); t.children.forEach(indexTree); };
  tree.forEach(indexTree);
  // Graft the user-added relationships (Add Relationship panel) onto their source nodes.
  Object.entries(extraChildren ?? {}).forEach(([pid, list]) => {
    const parent = pid === 'center' ? null : treeMap.get(pid);
    if (pid !== 'center' && !parent) return;
    list.forEach((e, i) => {
      const node: TreeNode = { id: `${pid}#x${i}`, label: e.label, type: e.type, parentId: pid, children: [], rel: e.rel };
      if (parent) parent.children.push(node); else tree.push(node);
      treeMap.set(node.id, node);
    });
  });
  const treeRef = useRef(treeMap);
  treeRef.current = treeMap;
  // Which nodes are currently expanded (their children visible).
  const expandedRef = useRef<Set<string>>(new Set());
  // Positions the user set by hand (dragging). Re-layouts respect these — a manually placed
  // node/group stays exactly where the user put it until Refresh / layout-mode change.
  const manualPos = useRef<Record<string, { x: number; y: number }>>({});

  // Hover / click highlight: the affected node's edges render as animated dashed blue lines.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // Minimap visibility (bottom-right; toggled by its collapse button or the M key).
  const [showMap, setShowMap] = useState(true);
  // Type-color legend (bottom-right): hidden by default, opened via its icon or the L key.
  // Groups are derived from typeMeta labels — types sharing a label/color collapse into one row.
  const [showLegend, setShowLegend] = useState(false);
  const legendGroups = Array.from(new Map(Object.values(typeMeta).map((m) => [m.label, m.color])).entries()).map(([label, color]) => ({ label, color }));
  // Rich hover card (icon + id + name + detail rows) — appears after a short delay,
  // rendered in SCREEN space so it stays readable at any zoom level.
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hoverCard, setHoverCard] = useState<{ left: number; top: number; placement: 'above' | 'below'; arrowLeft: number; id: string; name: string; type: RelType | 'center'; color: string; icon: React.ReactNode; rows: HoverRow[]; issues: number } | null>(null);
  const CARD_W = 248;
  const showHoverCard = (node: Node) => {
    const d = node.data as { label?: string; name?: string; id?: string; color?: string; icon?: React.ReactNode; nodeType?: RelType };
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const w = (node.measured?.width as number | undefined) ?? 56;
    const h = (node.measured?.height as number | undefined) ?? 56;
    // Node top-centre and bottom-centre in canvas-local coordinates.
    const topPt = rf.flowToScreenPosition({ x: node.position.x + w / 2, y: node.position.y });
    const botPt = rf.flowToScreenPosition({ x: node.position.x + w / 2, y: node.position.y + h });
    const cx = topPt.x - rect.left;
    const yTop = topPt.y - rect.top;
    const yBot = botPt.y - rect.top;
    const isCenter = node.id === 'center';
    const name = isCenter ? (d.name ?? '') : (d.label ?? '');
    const det = isCenter
      ? { id: d.id ?? '', rows: [
          { label: 'Asset Type', value: 'Hardware Asset' },
          { label: 'Status', value: 'In Use', dot: DOT.green },
          { label: 'Managed By', value: 'Rohan Mehta' },
          { label: 'Impact', value: 'Low', dot: DOT.green },
        ] }
      : hoverRowsFor(name, d.nodeType ?? 'asset');
    const issues = isCenter ? 0 : activeIssuesFor(name).openCount;
    // Dynamic placement so the card is never clipped by the canvas edges.
    const cardH = 76 + det.rows.length * 22 + (issues > 0 ? 36 : 0); // estimate (two-line header + divider + rows + alert strip)
    const GAP = 12, PAD = 8;
    // Flip below the node when there isn't room above.
    const placement: 'above' | 'below' = yTop - GAP - cardH < PAD ? 'below' : 'above';
    const top = placement === 'above' ? yTop - GAP - cardH : yBot + GAP;
    // Clamp horizontally inside the canvas; keep the pointer aimed at the node.
    const left = Math.max(PAD, Math.min(cx - CARD_W / 2, rect.width - CARD_W - PAD));
    const arrowLeft = Math.max(14, Math.min(cx - left, CARD_W - 14));
    setHoverCard({
      left, top, placement, arrowLeft,
      id: det.id,
      name,
      type: isCenter ? 'center' : (d.nodeType ?? 'asset'),
      color: isCenter ? '#3D8BD0' : (d.color ?? '#64748B'),
      icon: isCenter ? <Monitor size={14} /> : d.icon,
      rows: det.rows,
      issues,
    });
  };
  // Stable indirection so node data can call the latest toggleExpand without stale closures.
  const toggleRef = useRef<(id: string) => void>(() => {});
  // Same for the Add-Relationship hover badge.
  const addRelRef = useRef(onAddRelation);
  addRelRef.current = onAddRelation;
  const addRelFor = onAddRelation && !previewMode
    ? (nid: string) => {
        clearTimeout(hoverTimer.current);
        setHoverCard(null);
        addRelRef.current?.({ id: nid, name: nid === 'center' ? centerName : (treeRef.current.get(nid)?.label ?? '') });
      }
    : undefined;

  const makeNode = (t: TreeNode, x: number, y: number, expanded = false): Node => {
    const m = typeMeta[t.type];
    // In preview mode badges are hidden (childCount 0) so nothing invites expansion.
    // hasIssues → the node has OPEN linked Request/Problem/Change records → circle fills red.
    return { id: t.id, type: 'item', position: { x, y }, data: { label: t.label, color: m.color, icon: iconForNode(t.label, t.type), nodeType: t.type, childCount: previewMode ? 0 : t.children.length, expanded, labelWidth: cfg.labelWidth, hasIssues: previewMode ? false : activeIssuesFor(t.label).openCount > 0, onToggle: (nid: string) => toggleRef.current(nid), onAddRel: addRelFor } };
  };

  // Lay out ALL visible nodes as a tidy radial tree: every subtree gets an angular sector sized by
  // its visible leaf count, so each expanded group has its own wedge of the canvas — groups stay
  // separated and never overlap each other.
  const layoutAll = (): { nodes: Node[]; edges: Edge[] } => {
    const expanded = expandedRef.current;
    const visChildren = (t: TreeNode): TreeNode[] => (expanded.has(t.id) ? t.children : []);
    const leaves = (t: TreeNode): number => {
      const ch = visChildren(t);
      return ch.length ? ch.reduce((s, c) => s + leaves(c), 0) : 1;
    };
    const nodesOut: Node[] = [{ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { name: centerName, id: centerId, onAddRel: addRelFor } }];
    const edgesOut: Edge[] = [];

    if (mode === 'tree') {
      // Tidy top-down tree: leaves get fixed-width slots; parents sit centred over their children.
      const slotW = 190;
      const total = tree.reduce((s, t) => s + leaves(t), 0);
      const offset = ((total - 1) * slotW) / 2;
      let cursor = 0;
      const place = (t: TreeNode, depth: number, parentId: string): number => {
        const ch = visChildren(t);
        let x: number;
        if (ch.length) {
          const xs = ch.map((c) => place(c, depth + 1, t.id));
          x = (Math.min(...xs) + Math.max(...xs)) / 2;
        } else {
          x = cursor * slotW - offset;
          cursor += 1;
        }
        nodesOut.push(makeNode(t, x, depth * 200, expanded.has(t.id)));
        edgesOut.push({ id: `e-${t.id}`, source: parentId, target: t.id, type: 'floating', data: { rel: t.rel ?? (t.type === 'user' ? 'Users' : 'Depends On'), tree: true } });
        return x;
      };
      tree.forEach((t) => place(t, 1, 'center'));
    } else {
      // BALLOON layout: every expanded node's children sit on a circle around it, each group
      // a clean circular cluster. Every child is placed at a distance that clears its parent
      // by the child's WHOLE group footprint (so a big group can never reach back over the
      // centre or a sibling), and the angular room each child needs is solved geometrically
      // at its own radius — leftover circle space becomes even gaps BETWEEN the groups.
      const NODE_R = 50, GAP = 16, CLEAR = 95, CENTER_CLEAR = 115, PUSH = 40;
      const half = NODE_R + GAP / 2;
      // Compact ring radius for n children: big enough to clear the parent and to seat all
      // children side-by-side. Siblings ALWAYS sit on this ring — expanding one child never
      // moves the others, and expanding a grandchild never moves the group's hub.
      const ringFor = (n: number, clear: number) => Math.max(clear + 2 * NODE_R, n > 2 ? half / Math.sin(Math.PI / n) : 0) + (cfg.nodeDistance - 20);
      // Ring ordering: nodes that CAN expand are spread EVENLY around the ring so their
      // discs open far apart from each other; ordering key is static (potential children).
      const orderIdx = (list: TreeNode[]): number[] => {
        const n = list.length;
        const badges = list.map((_c, i) => i).filter((i) => list[i].children.length > 0).sort((a2, b2) => list[b2].children.length - list[a2].children.length);
        const leaves = list.map((_c, i) => i).filter((i) => !list[i].children.length);
        const seq: number[] = new Array(n).fill(-1);
        const stride = badges.length ? n / badges.length : n;
        badges.forEach((idx, k) => {
          let s = Math.round(k * stride + stride / 2) % n;
          while (seq[s] !== -1) s = (s + 1) % n;
          seq[s] = idx;
        });
        leaves.forEach((idx) => { const s = seq.indexOf(-1); seq[s] = idx; });
        return seq;
      };
      // ---- DYNAMIC cluster placement (force-directed, deterministic) ----
      // Every expanded group is a rigid DISC (hub + its child ring). A small physics pass —
      // springs pulling each disc toward its parent + collision pushing discs apart — lets
      // the clusters settle organically (like classic topology tools) with no overlaps and
      // no reserved space. It is fully deterministic: fixed seed layout + fixed iterations.
      // `footR` = radius of the hub's WHOLE expanded subtree (computed bottom-up below); it's
      // used for sibling/cousin separation so big subtrees repel by their true footprint, not
      // just the immediate ring. `path` = ancestor ids (for skipping ancestor-descendant pairs).
      interface Hub { id: string; t: TreeNode | null; parent: Hub | null; ringR: number; discR: number; footR: number; x: number; y: number; fixed: boolean; kids: Hub[]; path: Set<string> }
      const centerHub: Hub = { id: 'center', t: null, parent: null, ringR: ringFor(tree.length, CENTER_CLEAR), discR: ringFor(tree.length, CENTER_CLEAR) + NODE_R, footR: 0, x: 0, y: 0, fixed: true, kids: [], path: new Set(['center']) };
      const hubs: Hub[] = [centerHub];
      const hubMap = new Map<string, Hub>();
      const collect = (t: TreeNode, parentHub: Hub) => {
        const ch = visChildren(t);
        if (!ch.length) return;
        const ringR = ringFor(ch.length, CLEAR);
        const pin = manualPos.current[t.id];
        const h: Hub = { id: t.id, t, parent: parentHub, ringR, discR: ringR + NODE_R, footR: ringR + NODE_R, x: pin?.x ?? 0, y: pin?.y ?? 0, fixed: !!pin, kids: [], path: new Set(parentHub.path).add(t.id) };
        parentHub.kids.push(h);
        hubs.push(h);
        hubMap.set(t.id, h);
        ch.forEach((c) => collect(c, h));
      };
      tree.forEach((t) => collect(t, centerHub));
      // Bottom-up subtree footprint: a hub extends by its ring + its largest child hub's footprint.
      // hubs are in DFS (parent-before-child) order, so iterate in reverse to fill children first.
      for (let i = hubs.length - 1; i >= 0; i--) {
        const h = hubs[i];
        let maxChild = 0;
        h.kids.forEach((c) => { if (c.footR > maxChild) maxChild = c.footR; });
        h.footR = Math.max(h.discR, h.ringR + maxChild);
      }
      // SECTOR PINNING (first level): give each first-level branch its own angular wedge sized
      // by its subtree footprint, and PIN the branch root there. Big branches get proportionally
      // more of the circle (blended with an equal-share floor so tiny branches aren't flung far
      // out), and each root sits at a radius where its whole footprint fits inside its wedge — so
      // two large subtrees can never crowd the same arc. Deeper hubs still relax (spring + cone +
      // collision) around their pinned root, staying inside the wedge. This is the fix for
      // "node groups overlap on Expand all": the force sim alone couldn't reliably pull two big
      // adjacent branches apart, so we reserve non-overlapping angular territory up front.
      {
        const roots = centerHub.kids.filter((h) => !h.fixed);
        if (roots.length > 1) {
          const totalFoot = roots.reduce((s, h) => s + h.footR, 0) || 1;
          const n = roots.length;
          let acc = 0;
          roots.forEach((h) => {
            const frac = 0.6 * (h.footR / totalFoot) + 0.4 * (1 / n); // ∝ footprint, floored at ~equal share
            const theta = 2 * Math.PI * frac;                          // this branch's angular width
            const ang = -Math.PI / 2 + 2 * Math.PI * (acc + frac / 2); // its wedge centre
            acc += frac;
            // Radius so the footprint fits inside the wedge (R·sin(θ/2) ≥ footR), never closer
            // than the normal spring rest length.
            const fit = h.footR / Math.max(Math.sin(theta / 2), 0.06);
            const R = Math.max(centerHub.ringR + h.discR + PUSH, fit);
            h.x = centerHub.x + R * Math.cos(ang);
            h.y = centerHub.y + R * Math.sin(ang);
            h.fixed = true; // pin the branch root; its subtree still relaxes around it
          });
        }
      }
      // Deterministic seed: the centre spreads its groups on a full circle; every DEEPER
      // hub seeds its kids in an arc on the AWAY side (continuing outward from its parent),
      // so expanded groups start out in the whitespace beyond the clicked node.
      const seed = (h: Hub, inAng: number) => {
        const n = Math.max(h.kids.length, 1);
        h.kids.forEach((c, k) => {
          if (!c.fixed) {
            const ang = h.parent
              ? inAng + Math.min((2 * Math.PI) / n, 1.15) * (k + 0.5 - n / 2)
              : inAng - Math.PI + ((2 * Math.PI) / n) * (k + 0.5);
            const L = h.ringR + c.discR + PUSH;
            c.x = h.x + L * Math.cos(ang);
            c.y = h.y + L * Math.sin(ang);
          }
          seed(c, Math.atan2(c.y - h.y, c.x - h.x));
        });
      };
      seed(centerHub, -Math.PI / 2);
      // Relaxation: parent springs + disc-vs-disc collision.
      const GROUP_GAP = 88 * cfg.repulsion;
      // Dense (expand-all) graphs need more relaxation to fully separate all the subtrees.
      const ITERS = Math.min(650, 280 + hubs.length * 6);
      for (let iter = 0; iter < ITERS; iter++) {
        hubs.forEach((h) => {
          if (!h.parent || h.fixed) return;
          const L = h.parent.ringR + h.discR + PUSH;
          const dx = h.x - h.parent.x, dy = h.y - h.parent.y;
          const d = Math.hypot(dx, dy) || 1;
          const f = ((L - d) / d) * cfg.gravity;
          h.x += dx * f;
          h.y += dy * f;
        });
        // OUTWARD CONE: an expanded sub-group must stay on the AWAY side of its parent
        // (relative to the grandparent) — it may slide around the sides into free whitespace,
        // but never flip to the inward side, which read as children opening "in the wrong
        // direction". Runs BEFORE collision so overlap resolution always gets the last word
        // in each iteration (direction is a bias, overlap-freedom is a guarantee).
        const MAX_DEV = 1.45; // rad (~83°)
        hubs.forEach((h) => {
          if (!h.parent || !h.parent.parent || h.fixed) return;
          const gp = h.parent.parent;
          const aAng = Math.atan2(h.parent.y - gp.y, h.parent.x - gp.x);
          const ux = h.x - h.parent.x, uy = h.y - h.parent.y;
          const d = Math.hypot(ux, uy) || 1;
          const uAng = Math.atan2(uy, ux);
          let diff = uAng - aAng;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          if (Math.abs(diff) > MAX_DEV) {
            // Damped rotation back to the edge of the allowed cone.
            const delta = (Math.abs(diff) - MAX_DEV) * -Math.sign(diff) * 0.35;
            const na = uAng + delta;
            h.x = h.parent.x + d * Math.cos(na);
            h.y = h.parent.y + d * Math.sin(na);
          }
        });
        for (let i = 0; i < hubs.length; i++) {
          for (let j = i + 1; j < hubs.length; j++) {
            const A = hubs[i], B = hubs[j];
            let dx = B.x - A.x, dy = B.y - A.y;
            let d = Math.hypot(dx, dy);
            // Siblings/cousins repel by their FULL subtree footprint (footR) so expanded groups
            // never overlap; ancestor-descendant pairs only use the small immediate disc (they're
            // meant to sit close, child on parent's ring).
            const related = A.path.has(B.id) || B.path.has(A.id);
            const min = (related ? A.discR + B.discR : A.footR + B.footR) + GROUP_GAP;
            if (d >= min) continue;
            if (d < 1) { dx = 1; dy = 0; d = 1; }
            const push = ((min - d) / d) * 0.5;
            if (A.fixed && B.fixed) continue;
            if (A.fixed) { B.x += dx * push; B.y += dy * push; }
            else if (B.fixed) { A.x -= dx * push; A.y -= dy * push; }
            else { A.x -= (dx * push) / 2; A.y -= (dy * push) / 2; B.x += (dx * push) / 2; B.y += (dy * push) / 2; }
          }
        }
      }
      // Emit: hubs at their settled positions, leaf children seated on each hub's ring.
      const emitRing = (h: Hub) => {
        const ch = h.t ? visChildren(h.t) : tree;
        const inAng = h.parent ? Math.atan2(h.y - h.parent.y, h.x - h.parent.x) : -Math.PI / 2;
        // Small groups fan in a tight ARC on the away side of the parent (instead of being
        // flung to opposite sides of a full circle); big groups still use the full circle.
        // The centre always uses the full circle.
        const full = (2 * Math.PI) / (ch.length || 1);
        const per = h.parent ? Math.min(full, 1.15) : full;
        const start = inAng - (per * ch.length) / 2;
        const seq = orderIdx(ch);
        seq.forEach((i, k) => {
          const c = ch[i];
          const sub = hubMap.get(c.id);
          const ang = start + per * (k + 0.5);
          const cx = sub ? sub.x : h.x + h.ringR * Math.cos(ang);
          const cy = sub ? sub.y : h.y + h.ringR * Math.sin(ang);
          nodesOut.push(makeNode(c, cx, cy, expanded.has(c.id)));
          edgesOut.push({ id: `e-${c.id}`, source: h.id, target: c.id, type: 'floating', data: { rel: c.rel ?? (c.type === 'user' ? 'Users' : 'Depends On') } });
          if (sub) emitRing(sub);
        });
      };
      emitRing(centerHub);
    }

    // The root scales with the graph: on a small graph (10-15 nodes) it stays modest —
    // just a touch bigger than regular nodes; only as the user expands more and more
    // groups does it grow, so it remains identifiable in a zoomed-out busy view.
    const vis = nodesOut.length;
    (nodesOut[0].data as Record<string, unknown>).size = vis <= 15 ? 64 : vis <= 30 ? 80 : vis <= 60 ? 96 : 112;

    // Floor spacing between any two nodes. Set wide enough that the labels below each node
    // (up to `labelWidth`, default 150) don't collide either — not just the circles.
    const MIN_DIST = Math.max(120, Math.min(cfg.labelWidth, 160) - 10);

    // Nodes the user placed by hand keep their exact positions (pinned) — remembering the
    // computed layout spot so we can fall back to it.
    const layoutSpot = new Map(nodesOut.map((n) => [n.id, { ...n.position }]));
    nodesOut.forEach((n) => {
      const m = manualPos.current[n.id];
      if (m) n.position = { ...m };
    });

    // BUT if a manually placed node would now overlap another node (e.g. a newly expanded
    // group landed there), its pin is dropped and it resets to its tidy layout position.
    nodesOut.forEach((n) => {
      if (!manualPos.current[n.id]) return;
      const collides = nodesOut.some((o) => o.id !== n.id && Math.hypot(o.position.x - n.position.x, o.position.y - n.position.y) < MIN_DIST);
      if (collides) {
        delete manualPos.current[n.id];
        n.position = { ...(layoutSpot.get(n.id) ?? n.position) };
      }
    });

    // Minimal de-overlap pass: the sector layout above is the source of truth for grouping —
    // this only gently separates the few pairs that actually collide (icon + label footprint),
    // with damped nudges so nodes stay inside their group's wedge. The centre and any
    // manually-placed nodes stay pinned; others are nudged around them.
    const DAMP = 0.6;
    const isFixed = (n: Node) => n.id === 'center' || !!manualPos.current[n.id];
    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < nodesOut.length; i++) {
        for (let j = i + 1; j < nodesOut.length; j++) {
          const A = nodesOut[i], B = nodesOut[j];
          let dx = B.position.x - A.position.x, dy = B.position.y - A.position.y;
          let d = Math.hypot(dx, dy);
          if (d >= MIN_DIST) continue;
          if (d < 1) { dx = 1; dy = 0; d = 1; }
          const aFixed = isFixed(A), bFixed = isFixed(B);
          if (aFixed && bFixed) continue;
          const push = ((MIN_DIST - d) / d) * DAMP;
          if (aFixed) { B.position.x += dx * push; B.position.y += dy * push; }
          else if (bFixed) { A.position.x -= dx * push; A.position.y -= dy * push; }
          else {
            A.position.x -= (dx * push) / 2; A.position.y -= (dy * push) / 2;
            B.position.x += (dx * push) / 2; B.position.y += (dy * push) / 2;
          }
          moved = true;
        }
      }
      if (!moved) break;
    }

    return { nodes: nodesOut, edges: edgesOut };
  };

  // React Flow owns the node state so nodes can be freely dragged; onNodesChange persists positions.
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutAll().nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutAll().edges);

  // Re-layout only when the mode changes, Refresh is pressed, or the data set changes — NOT on every
  // render — so dragged positions and expansions are preserved between renders.
  useEffect(() => {
    expandedRef.current = new Set();
    manualPos.current = {};
    const init = layoutAll();
    setNodes(init.nodes);
    setEdges(init.edges);
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, refreshSignal, dataSig]);

  // Saved Views: expose a capture/restore API to the host toolbar. Re-assigned every render so
  // the closures always see the current layoutAll/config; capture grabs the expansions + manual
  // pins + viewport, restore re-applies them and re-lays-out (then pans back to the saved view).
  useEffect(() => {
    if (!snapshotRef) return;
    snapshotRef.current = {
      capture: () => ({
        expanded: [...expandedRef.current],
        manual: { ...manualPos.current },
        viewport: rf.getViewport(),
      }),
      restore: (s) => {
        expandedRef.current = new Set(s.expanded);
        manualPos.current = { ...s.manual };
        const init = layoutAll();
        setNodes(init.nodes);
        setEdges(init.edges);
        setTimeout(() => {
          if (s.viewport) rf.setViewport(s.viewport, { duration: 300 });
          else rf.fitView({ padding: 0.2, duration: 300 });
        }, 60);
      },
    };
  });

  // Dragging a parent node carries its whole visible subtree with it (group drag). The centre
  // (root) node is exempt — moving it repositions only itself, never its children.
  const dragState = useRef<{ id: string; start: { x: number; y: number }; last: { x: number; y: number }; descendants: Set<string> } | null>(null);
  const visibleDescendants = (id: string): Set<string> => {
    const out = new Set<string>();
    const walk = (tid: string) => {
      if (!expandedRef.current.has(tid)) return;
      treeRef.current.get(tid)?.children.forEach((c) => { out.add(c.id); walk(c.id); });
    };
    walk(id);
    return out;
  };
  const onNodeDragStart = (_: unknown, node: Node) => {
    clearTimeout(hoverTimer.current);
    setHoverCard(null);
    if (node.id === 'center') { dragState.current = null; return; }
    dragState.current = { id: node.id, start: { ...node.position }, last: { ...node.position }, descendants: visibleDescendants(node.id) };
  };
  const onNodeDrag = (_: unknown, node: Node) => {
    const st = dragState.current;
    if (!st || st.id !== node.id) return;
    const dx = node.position.x - st.last.x;
    const dy = node.position.y - st.last.y;
    st.last = { ...node.position };
    if ((dx || dy) && st.descendants.size) {
      setNodes((nds) => nds.map((nd) => (st.descendants.has(nd.id) ? { ...nd, position: { x: nd.position.x + dx, y: nd.position.y + dy } } : nd)));
    }
  };
  const onNodeDragStop = (_: unknown, node: Node) => {
    // Remember where the user left things: the dragged node and (for a group drag) every
    // descendant that moved with it are pinned so later re-layouts don't reset them.
    // Ignore micro-movements (< 8px) — a slightly jittery CLICK must never create a pin.
    const st = dragState.current;
    const moved = st && st.id === node.id ? Math.hypot(node.position.x - st.start.x, node.position.y - st.start.y) : 0;
    if (st && st.id === node.id && moved >= 8) {
      manualPos.current[node.id] = { ...node.position };
      if (st.descendants.size) {
        const all = rf.getNodes();
        st.descendants.forEach((did) => {
          const dn = all.find((n) => n.id === did);
          if (dn) manualPos.current[did] = { ...dn.position };
        });
      }
    }
    dragState.current = null;
  };

  // Click a node with a count badge to reveal (or hide) its connected nodes.
  const toggleExpand = (id: string) => {
    const t = treeRef.current.get(id);
    if (!t || t.children.length === 0) return;
    const ex = expandedRef.current;
    if (ex.has(id)) {
      // Collapse this node and everything beneath it — and drop any manual pins on it or
      // its subtree, so the node returns to its place in the parent's circle.
      const rm = (tid: string) => { ex.delete(tid); delete manualPos.current[tid]; treeRef.current.get(tid)?.children.forEach((c) => rm(c.id)); };
      rm(id);
    } else {
      ex.add(id);
    }
    // Re-run the global tidy layout so every expanded group keeps its own sector.
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    // Viewport follow-up. Small graphs: re-fit everything (nice overview). LARGE graphs
    // (hundreds of nodes): never zoom out globally — nodes would become unreadably tiny.
    // Instead, focus the clicked node + its children at a readable zoom.
    const didExpand = ex.has(id);
    setTimeout(() => {
      if (l.nodes.length <= 24) {
        rf.fitView({ padding: 0.2, duration: 400 });
      } else if (didExpand) {
        const vp = rf.getViewport();
        rf.fitView({
          nodes: [{ id }, ...t.children.map((c) => ({ id: c.id }))],
          padding: 0.3,
          duration: 400,
          minZoom: 0.6, // never smaller than comfortably readable
          maxZoom: Math.max(vp.zoom, 0.9), // don't zoom IN past where the user already is
        });
      }
      // Collapsing on a large graph: leave the viewport exactly where the user is.
    }, 90);
  };
  toggleRef.current = toggleExpand;

  // Spotlight for the hovered/selected node: its edges become animated dashed blue lines. The
  // dash flow ALWAYS travels source→target (parent→child) so the direction is the same whether
  // you hover the parent or the child. Directly connected nodes stay full-strength; everything
  // else — nodes and edges — fades out.
  const activeId = hoverId ?? pinnedId;
  const connectedIds = activeId
    ? new Set([activeId, ...edges.flatMap((e) => (e.source === activeId ? [e.target] : e.target === activeId ? [e.source] : []))])
    : null;
  // Search highlight: matching nodes stay lit, the rest fades (hover/click wins visually,
  // but matches are always computed so the search focus works regardless of the mouse).
  const q = (searchTerm ?? '').trim().toLowerCase();
  const matchIds = q
    ? new Set(nodes.filter((n) => {
        const d = n.data as { label?: string; name?: string; id?: string };
        return `${d.label ?? ''} ${d.name ?? ''} ${d.id ?? ''}`.toLowerCase().includes(q);
      }).map((n) => n.id))
    : null;
  // Type filter (toolbar Filter menu): nodes of the chosen type(s) stay lit; centre always stays.
  // Both filters accept a single value or an array (multi-select) — normalize to arrays here.
  const typeFilters: string[] = Array.isArray(typeFilter) ? typeFilter : typeFilter ? [typeFilter] : [];
  const connFilters: string[] = Array.isArray(connectionFilter) ? connectionFilter : connectionFilter ? [connectionFilter] : [];
  // 'active-issues' is a special pseudo-type (not a real nodeType) — it lights the
  // red nodes that have open linked issues instead of matching by node kind.
  const wantsIssues = typeFilters.includes('active-issues');
  const nodeTypeFilters = typeFilters.filter((t) => t !== 'active-issues');
  const filterIds = nodeTypeFilters.length || wantsIssues
    ? new Set(['center', ...nodes.filter((n) => {
        const d = n.data as { nodeType?: string; hasIssues?: boolean };
        return nodeTypeFilters.includes(d.nodeType ?? '') || (wantsIssues && !!d.hasIssues);
      }).map((n) => n.id)])
    : null;
  // Connection filter (toolbar Connection menu): only edges whose relation label matches — and
  // the nodes at their two ends — stay lit; the centre always stays as the anchor.
  const edgeRel = (e: Edge) => (e.data as { rel?: string } | undefined)?.rel;
  const connIds = connFilters.length
    ? new Set(['center', ...edges.flatMap((e) => (connFilters.includes(edgeRel(e) ?? '') ? [e.source, e.target] : []))])
    : null;
  // Type + connection filters COMBINE as a union: a node stays lit when it matches a selected
  // type OR touches a selected connection (search always wins over both).
  const unionIds = filterIds || connIds ? new Set([...(filterIds ?? []), ...(connIds ?? [])]) : null;
  const dimSet = matchIds ?? unionIds;
  const renderEdges = activeId
    ? edges.map((e) =>
        e.source === activeId || e.target === activeId
          ? { ...e, data: { ...e.data, hl: true, outward: true } }
          : { ...e, data: { ...e.data, dim: true } },
      )
    : dimSet
      ? edges.map((e) => {
          // With a connection filter active, the EDGE's own relation decides — matching connections
          // get the full hover treatment (animated dashed direction flow + relation name on the
          // line) even when a type filter is ALSO set; otherwise the target node decides.
          if (connFilters.length) {
            return connFilters.includes(edgeRel(e) ?? '')
              ? { ...e, data: { ...e.data, hl: true, outward: true } }
              : { ...e, data: { ...e.data, dim: true } };
          }
          return dimSet.has(e.target) ? e : { ...e, data: { ...e.data, dim: true } };
        })
      : edges;
  const focusIds = connectedIds ?? dimSet;
  const renderNodes = focusIds
    ? nodes.map((n) => (focusIds.has(n.id) ? n : { ...n, style: { ...n.style, opacity: 0.18, transition: 'opacity 0.2s' } }))
    : nodes;

  // Report the distinct connection types on the canvas whenever the edge set changes, so the
  // toolbar's Connection dropdown always offers exactly what's really there (incl. relations
  // added via the Add Relationship panel).
  const connTypesSig = useRef('');
  useEffect(() => {
    if (!onConnectionTypesChange) return;
    const rels = [...new Set(edges.map(edgeRel).filter((r): r is string => !!r))].sort();
    const sig = rels.join('|');
    if (sig !== connTypesSig.current) {
      connTypesSig.current = sig;
      onConnectionTypesChange(rels);
    }
  });

  // When the search finds nodes, centre the canvas on them and zoom in to a readable level
  // (debounced so the view doesn't jump on every keystroke).
  const matchKey = matchIds && matchIds.size ? [...matchIds].sort().join('|') : '';
  useEffect(() => {
    if (!matchKey) return;
    const t = setTimeout(() => {
      rf.fitView({ nodes: matchKey.split('|').map((id) => ({ id })), padding: 0.4, duration: 400, minZoom: 0.5, maxZoom: 1.15 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey]);

  // When relationships are ADDED (Add Relationship panel), expand the source node so the
  // new connections are immediately visible, and re-layout preserving expansions + pins.
  const extraSig = JSON.stringify(extraChildren ?? {});
  const prevExtraRef = useRef(extraSig);
  useEffect(() => {
    if (prevExtraRef.current === extraSig) return;
    const prev = JSON.parse(prevExtraRef.current) as Record<string, unknown[]>;
    prevExtraRef.current = extraSig;
    const grew = Object.entries(extraChildren ?? {}).filter(([k, v]) => (prev[k]?.length ?? 0) < v.length).map(([k]) => k);
    grew.forEach((pid) => { if (pid !== 'center') expandedRef.current.add(pid); });
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    const focus = grew[0];
    const t = setTimeout(() => {
      if (focus && focus !== 'center') {
        const src = treeRef.current.get(focus);
        rf.fitView({ nodes: [{ id: focus }, ...(src?.children.map((c) => ({ id: c.id })) ?? [])], padding: 0.35, duration: 400, minZoom: 0.6 });
      } else {
        rf.fitView({ padding: 0.2, duration: 400 });
      }
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraSig]);

  // Applying new Advanced-Configuration values re-runs the layout WITHOUT resetting the
  // user's expansions or pins (unlike Refresh / mode change).
  const cfgSig = JSON.stringify(cfg);
  const cfgFirst = useRef(true);
  useEffect(() => {
    if (cfgFirst.current) { cfgFirst.current = false; return; }
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgSig]);

  // "Expand all" — mark every node that has children as expanded, then re-layout + fit.
  const expandAllPrev = useRef(expandAllSignal);
  useEffect(() => {
    if (expandAllSignal === undefined || expandAllSignal === expandAllPrev.current) return;
    expandAllPrev.current = expandAllSignal;
    treeRef.current.forEach((node: TreeNode, id: string) => { if (node.children.length) expandedRef.current.add(id); });
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandAllSignal]);

  // "Collapse all" — clear every expansion (and pins) back to the first level.
  const collapseAllPrev = useRef(collapseAllSignal);
  useEffect(() => {
    if (collapseAllSignal === undefined || collapseAllSignal === collapseAllPrev.current) return;
    collapseAllPrev.current = collapseAllSignal;
    expandedRef.current = new Set();
    manualPos.current = {};
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseAllSignal]);

  const panBy = (dx: number, dy: number, duration = 150) => {
    const vp = rf.getViewport();
    rf.setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration });
  };

  // Canvas keyboard shortcuts (active once the canvas has focus): arrows pan, +/- zoom,
  // F fits & centers, Escape deselects.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 48;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      panBy(m[0], m[1], 0);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      rf.zoomIn({ duration: 150 });
    } else if (e.key === '-') {
      e.preventDefault();
      rf.zoomOut({ duration: 150 });
    } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      rf.fitView({ padding: 0.2, duration: 300 });
    } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      // Minimap and type legend are mutually exclusive — opening one closes the other.
      setShowMap(!showMap);
      if (!showMap) setShowLegend(false);
    } else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowLegend(!showLegend);
      if (!showLegend) setShowMap(false);
    } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      // Reset layout: collapse everything, drop manual pins, back to the tidy default.
      e.preventDefault();
      expandedRef.current = new Set();
      manualPos.current = {};
      setPinnedId(null);
      const l = layoutAll();
      setNodes(l.nodes);
      setEdges(l.edges);
      setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 60);
    } else if (e.key === 'Escape') {
      setPinnedId(null);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full outline-none" tabIndex={previewMode ? -1 : 0} onKeyDown={previewMode ? undefined : onKeyDown}>
      {/* Dash-flow animations for highlighted connection lines */}
      <style>{`
        @keyframes rel-dash-fwd { to { stroke-dashoffset: -24; } }
        @keyframes rel-dash-rev { to { stroke-dashoffset: 24; } }
      `}</style>
      <ReactFlow
        nodes={renderNodes}
        edges={renderEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={previewMode ? undefined : (_, node) => {
          clearTimeout(hoverTimer.current);
          setHoverCard(null);
          const t = treeRef.current.get(node.id);
          // Node-click only EXPANDS (never collapses) — collapse is exclusively the minus
          // badge. This way a click while zoomed out reliably expands + focuses the node
          // instead of accidentally collapsing an already-open group.
          if (t && t.children.length && !expandedRef.current.has(node.id)) {
            toggleExpand(node.id);
            return;
          }
          // Already-expanded parent, leaf, or centre: pin the connection spotlight; in a
          // zoomed-out overview also zoom in and centre it (with its children) so it's readable.
          setPinnedId((p) => (p === node.id ? null : node.id));
          const vp = rf.getViewport();
          if (vp.zoom < 0.75) {
            const kids = t && expandedRef.current.has(node.id) ? t.children.map((c) => ({ id: c.id })) : [];
            rf.fitView({ nodes: [{ id: node.id }, ...kids], padding: 0.35, duration: 500, minZoom: 0.85, maxZoom: 1.15 });
          }
        }}
        onNodeMouseEnter={previewMode ? undefined : (_, node) => {
          setHoverId(node.id);
          clearTimeout(hoverTimer.current);
          clearTimeout(hideTimer.current);
          hoverTimer.current = setTimeout(() => showHoverCard(node), 550);
        }}
        onNodeMouseLeave={previewMode ? undefined : () => {
          setHoverId(null);
          clearTimeout(hoverTimer.current);
          // Grace period so the pointer can travel INTO the card (its ↗ button is clickable).
          clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setHoverCard(null), 220);
        }}
        onPaneClick={previewMode ? undefined : () => setPinnedId(null)}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={previewMode ? 0.05 : cfg.minZoom}
        maxZoom={cfg.maxZoom}
        nodesDraggable={!previewMode && !cfg.locked}
        nodeDragThreshold={5}
        nodesConnectable={false}
        elementsSelectable={!previewMode}
        disableKeyboardA11y
        zoomOnScroll={!previewMode}
        zoomOnPinch={!previewMode}
        zoomOnDoubleClick={!previewMode}
        panOnDrag={!previewMode}
        proOptions={{ hideAttribution: true }}
      >
        {/* Very light gray canvas backdrop behind the dotted grid */}
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#DCE3EC" bgColor="#FAFBFC" />
        {!(hideControls || previewMode) && <CanvasControls panBy={panBy} showMap={showMap} setShowMap={setShowMap} legend={legendGroups} showLegend={showLegend} setShowLegend={setShowLegend} />}
      </ReactFlow>
      {/* Rich node hover card — screen-space so it stays crisp at any zoom */}
      {hoverCard && (
        <div
          className="absolute z-30"
          style={{ left: hoverCard.left, top: hoverCard.top, width: CARD_W }}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={() => setHoverCard(null)}
        >
          {/* Pointer above the card when the card sits BELOW the node */}
          {hoverCard.placement === 'below' && (
            <div className="absolute size-2.5 rotate-45 border-t border-l border-[#E5E7EB] bg-white" style={{ left: hoverCard.arrowLeft - 5, top: -5 }} />
          )}
          <div className="w-[248px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
            <div className="flex items-start gap-2">
              <span className="flex size-6 items-center justify-center rounded-md text-white flex-shrink-0 mt-0.5 [&_svg]:size-3.5" style={{ backgroundColor: hoverCard.color }}>{hoverCard.icon}</span>
              {onOpenNode && hoverCard.type !== 'center' && hoverCard.type !== 'user' ? (
                // Two-line header (ID on top, subject below) — the whole block opens the record.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => { const info = { id: hoverCard.id, name: hoverCard.name, type: hoverCard.type as RelType }; setHoverCard(null); onOpenNode(info); }}
                      className="group/hc flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded text-left"
                    >
                      <span className="flex w-full items-center gap-1.5">
                        {hoverCard.id && <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0] flex-shrink-0">{hoverCard.id}</span>}
                        <span className="ml-auto flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors group-hover/hc:bg-[#EAF2FB] group-hover/hc:text-[#3D8BD0]">
                          <ArrowUpRight size={13} />
                        </span>
                      </span>
                      <span className="w-full break-words text-[12.5px] font-semibold leading-snug text-[#364658] transition-colors group-hover/hc:text-[#3D8BD0]">{hoverCard.name}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Open record</TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  {hoverCard.id && <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0] flex-shrink-0">{hoverCard.id}</span>}
                  <span className="w-full break-words text-[12.5px] font-semibold leading-snug text-[#364658]">{hoverCard.name}</span>
                </div>
              )}
            </div>
            <div className="mt-2 space-y-1.5 border-t border-[#F0F1F3] pt-2">
              {hoverCard.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-[#7B8FA5] flex-shrink-0">{r.label}</span>
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-[#364658]">
                    {r.dot && <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.dot }} />}
                    <span className="truncate">{r.value}</span>
                  </span>
                </div>
              ))}
            </div>
            {/* Active-issues strip → opens the Active Issues side panel */}
            {onShowIssues && hoverCard.issues > 0 && (
              <button
                onClick={() => { const info = { id: hoverCard.id, name: hoverCard.name }; setHoverCard(null); onShowIssues(info); }}
                className="mt-2.5 flex w-full items-center gap-1.5 rounded-md bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
              >
                <AlertTriangle size={13} className="flex-shrink-0" />
                {hoverCard.issues} active issue{hoverCard.issues > 1 ? 's' : ''} linked
                <ChevronRight size={13} className="ml-auto flex-shrink-0" />
              </button>
            )}
          </div>
          {/* Pointer below the card when the card sits ABOVE the node */}
          {hoverCard.placement === 'above' && (
            <div className="absolute size-2.5 rotate-45 border-b border-r border-[#E5E7EB] bg-white" style={{ left: hoverCard.arrowLeft - 5, bottom: -5 }} />
          )}
        </div>
      )}
    </div>
  );
}

export function RelationshipGraph(props: RelationshipGraphProps) {
  /* The global Keyboard shortcuts panel opens on this map while it is on screen (not the config preview). */
  useShortcutContext(props.previewMode ? null : 'relationship-map');
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner {...props} />
    </ReactFlowProvider>
  );
}
