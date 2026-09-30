import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  BaseEdge,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ServerCog, Database, Server, Monitor, Globe, ChevronDown, Check, Minus,
  CheckCircle2, XCircle, Clock, Loader2, Maximize, Plus, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ShieldCheck, Search, X, User, ChevronRight, Keyboard, List,
  MoveHorizontal, MoveVertical,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { useShortcutContext } from './shortcutContext';

/* Deployment Topology View — the THIRD view of the Deployment tab (next to card/list).
 * A horizontal left→right React Flow canvas (Superseded-map recipe, transposed) showing how
 * patches flow from the Internet through the Main File Server / Distributed Servers to the
 * endpoints, across the 5 supported deployment architectures (scenario picker).
 * Core business rule surfaced everywhere: the Main File Server ALWAYS downloads and stores
 * every patch, even when agents/DS download directly — it is the offline fallback cache. */

/* ------------------------------- data model ------------------------------- */

type NodeKind = 'serviceops' | 'mainfs' | 'ds' | 'group' | 'internet';
type DeployStatus = 'Success' | 'Failed' | 'In Progress' | 'Pending' | 'Waiting';

interface TopoNode {
  id: string;
  kind: NodeKind;
  name: string;
  /** Sub-line: role / group ("Remote Office 1 — Mumbai Office"). */
  sub?: string;
  group?: string;
  status?: DeployStatus;
  /** 0–100 rollout percentage, shown in the hover card. */
  progress?: number;
  /** Where this node currently pulls patches from. */
  source?: string;
  patches?: string;
  error?: string;
  /** DELIVERY failure — the DS/office could not RECEIVE the patch from its parent (distinct from
   *  endpoint-local install failures). Turns the incoming line AND the node border red. */
  deliveryFailed?: boolean;
  /** Endpoint GROUP only: how many member endpoints are in each deployment state (hover card). */
  endpointStats?: { success: number; failed: number; inProgress: number; other: number };
  /** Downloads directly from the Internet → its tree edge renders as the dashed fallback path. */
  netDirect?: boolean;
  children?: TopoNode[];
}

interface Scenario {
  key: string;
  label: string;
  desc: string;
  root: TopoNode;
  /** Node ids that have a direct Internet download link. */
  internetLinks: string[];
}

const KIND_META: Record<NodeKind, { label: string; color: string; icon: typeof Server }> = {
  serviceops: { label: 'ServiceOps Server', color: '#6366F1', icon: ServerCog },
  mainfs: { label: 'Main File Server', color: '#3D8BD0', icon: Database },
  ds: { label: 'Distributed Server', color: '#8B5CF6', icon: Server },
  // Endpoints are never shown individually — the GROUP (Local Office / Remote Office N) is
  // always the last node of a branch.
  group: { label: 'Endpoint Group', color: '#64748B', icon: Monitor },
  internet: { label: 'Internet', color: '#22C55E', icon: Globe },
};

const STATUS_META: Record<DeployStatus, { color: string; icon: typeof Clock; spin?: boolean }> = {
  Success: { color: '#12B76A', icon: CheckCircle2 },
  Failed: { color: '#F04438', icon: XCircle },
  'In Progress': { color: '#F79009', icon: Loader2, spin: true },
  Pending: { color: '#94A3B8', icon: Clock },
  Waiting: { color: '#94A3B8', icon: Clock },
};

type EdgeKind = 'trigger' | 'distribution' | 'fileserver' | 'dsdownload' | 'internet' | 'fallback';
const EDGE_META: Record<EdgeKind, { color: string; label: string; flow: string; dashed?: boolean }> = {
  trigger: { color: '#94A3B8', label: 'Deployment Trigger', flow: 'Patch Deployment Flow' },
  distribution: { color: '#3D8BD0', label: 'Patch Distribution', flow: 'Patch Distribution Flow' },
  fileserver: { color: '#3D8BD0', label: 'File Server Download', flow: 'Patch Download Flow' },
  dsdownload: { color: '#8B5CF6', label: 'Distributed Server Download', flow: 'Patch Download Flow' },
  internet: { color: '#22C55E', label: 'Internet Download', flow: 'Patch Download Flow' },
  fallback: { color: '#CBD5E1', label: 'Fallback — Main File Server cache', flow: 'Patch Distribution Flow', dashed: true },
};

/* ------------------------------- scenarios ------------------------------- */

const so = (children: TopoNode[]): TopoNode => ({
  id: 'serviceops', kind: 'serviceops', name: 'ServiceOps Server', sub: 'Management Server', status: 'Success', children,
});
const fs = (extra: Partial<TopoNode>, children: TopoNode[]): TopoNode => ({
  id: 'mainfs', kind: 'mainfs', name: 'Main File Server', sub: 'Patch Store · Local Office', patches: '128 patches stored', source: 'Internet', ...extra, children,
});

/* Enterprise-scale scenario: 18 Remote Offices, index-generated (deterministic — no randomness)
 * with a varied but tidy status mix, so the map demos a real customer footprint. */
const ENTERPRISE_OFFICE_NAMES = [
  'Mumbai Office', 'Bengaluru Campus', 'Delhi NCR Office', 'Pune Development Center', 'Hyderabad Office',
  'Chennai Office', 'Kolkata Office', 'Ahmedabad Plant', 'Muscat Office', 'Dubai Office',
  'Singapore Office', 'Sydney Office', 'London Office', 'Frankfurt Office', 'New York Office',
  'Toronto Office', 'Tokyo Office', 'Berlin Office',
];
const enterpriseChildren = (): TopoNode[] => {
  const kids: TopoNode[] = ENTERPRISE_OFFICE_NAMES.map((office, i) => {
    const total = 8 + ((i * 5) % 13); // 8–20 endpoints per office
    const failed = i % 6 === 4 ? 1 + (i % 2) : 0;
    const inProgress = i % 3 === 1 ? 2 + (i % 3) : 0;
    const success = Math.max(0, total - failed - inProgress - (i % 4 === 3 ? 3 : 0));
    const other = total - success - failed - inProgress;
    const dsStatus: DeployStatus = inProgress > 0 ? 'In Progress' : other > 0 ? 'Waiting' : 'Success';
    return {
      id: `ds6-${i + 1}`, kind: 'ds', name: `DS-${i + 1}`, sub: `Remote Office ${i + 1} — ${office}`, group: office,
      status: dsStatus, source: 'Main File Server', patches: `${38 + ((i * 7) % 25)} patches cached`,
      children: [{
        id: `grp6-${i + 1}`, kind: 'group', name: office, sub: `Endpoint Group · ${total} endpoints`, group: office,
        status: dsStatus, source: `DS-${i + 1}`, patches: `${success}/${total} installed`,
        endpointStats: { success, failed, inProgress, other },
      }],
    };
  });
  kids.push({ id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 9 endpoints', group: 'Local Office', status: 'Success', source: 'Main File Server', patches: '9/9 installed', endpointStats: { success: 9, failed: 0, inProgress: 0, other: 0 } });
  return kids;
};

export const DEPLOY_SCENARIOS: Scenario[] = [
  {
    key: 's1', label: 'Main File Server Only',
    desc: 'On-premise: only the Main File Server has Internet access. It downloads and stores every patch; all endpoints pull from it and never touch the Internet.',
    root: so([fs({ status: 'In Progress', progress: 68 }, [
      { id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 14 endpoints', group: 'Local Office', status: 'In Progress', progress: 32, source: 'Main File Server', patches: '9/14 installed', endpointStats: { success: 9, failed: 0, inProgress: 3, other: 2 } },
    ])]),
    internetLinks: ['mainfs'],
  },
  {
    key: 's2', label: 'Main FS + Agent Internet Download',
    desc: 'Agent Internet Download is ON: endpoints pull patches straight from the Internet. The Main File Server STILL downloads and stores every patch, so deployments keep working if the Internet goes down.',
    root: so([fs({ status: 'In Progress', progress: 81 }, [
      { id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 14 endpoints', group: 'Local Office', status: 'In Progress', progress: 55, source: 'Internet', patches: '11/14 installed', netDirect: true, endpointStats: { success: 11, failed: 0, inProgress: 2, other: 1 } },
    ])]),
    internetLinks: ['mainfs', 'grp-local'],
  },
  {
    key: 's3', label: 'Main FS + Distributed Servers',
    desc: 'Remote offices: the Main File Server downloads and stores every patch, then distributes it to each office’s Distributed Server; that office’s endpoint group pulls only from its own server. Unassigned endpoints stay in the Local Office group on the Main File Server.',
    root: so([fs({ status: 'Success' }, [
      {
        id: 'ds1', kind: 'ds', name: 'Distributed Server 1', sub: 'Remote Office 1 — Mumbai Office', group: 'Mumbai Office', status: 'In Progress', source: 'Main File Server', patches: '54 patches cached', children: [
          { id: 'grp-mum', kind: 'group', name: 'Mumbai Office', sub: 'Endpoint Group · 14 endpoints', group: 'Mumbai Office', status: 'In Progress', progress: 47, source: 'Distributed Server 1', patches: '6/14 installed', endpointStats: { success: 6, failed: 0, inProgress: 5, other: 3 } },
        ],
      },
      {
        id: 'ds2', kind: 'ds', name: 'Distributed Server 2', sub: 'Remote Office 2 — Bengaluru Campus', group: 'Bengaluru Campus', status: 'Waiting', source: 'Main File Server', patches: '41 patches cached', children: [
          { id: 'grp-blr', kind: 'group', name: 'Bengaluru Campus', sub: 'Endpoint Group · 12 endpoints', group: 'Bengaluru Campus', status: 'Failed', source: 'Distributed Server 2', patches: '9/12 installed', endpointStats: { success: 9, failed: 3, inProgress: 0, other: 0 }, error: '3 of 12 endpoints failed — could not reach the distribution point (0x80D02002). Retry scheduled in 15 minutes.' },
        ],
      },
      { id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 9 endpoints', group: 'Local Office', status: 'Success', source: 'Main File Server', patches: '9/9 installed', endpointStats: { success: 9, failed: 0, inProgress: 0, other: 0 } },
    ])]),
    internetLinks: ['mainfs'],
  },
  {
    key: 's4', label: 'Mixed DS Internet Access',
    desc: 'Mixed access: DS-1 has Internet and downloads directly; DS-2 gets patches from the Main File Server — but that distribution has FAILED here (red), so its Bengaluru office is stuck waiting to receive. The Main File Server still downloads and stores every patch.',
    root: so([fs({ status: 'In Progress', progress: 74 }, [
      {
        id: 'ds1', kind: 'ds', name: 'DS-1', sub: 'Remote Office 1 — Mumbai Office · Internet access', group: 'Mumbai Office', status: 'In Progress', progress: 41, source: 'Internet', patches: '54 patches cached', netDirect: true, children: [
          { id: 'grp-mum', kind: 'group', name: 'Mumbai Office', sub: 'Endpoint Group · 14 endpoints', group: 'Mumbai Office', status: 'Waiting', source: 'DS-1', patches: '0/14 installed', endpointStats: { success: 0, failed: 0, inProgress: 0, other: 14 } },
        ],
      },
      {
        // DELIVERY FAILURE demo — the Main FS → DS-2 distribution failed: red line + red border,
        // and its office can't receive (stuck Pending, gray line downstream).
        id: 'ds2', kind: 'ds', name: 'DS-2', sub: 'Remote Office 2 — Bengaluru Campus · No Internet', group: 'Bengaluru Campus', status: 'Failed', source: 'Main File Server', patches: '18 patches cached', deliveryFailed: true, error: 'Distribution from the Main File Server failed — the distribution point is unreachable (0x80D02002). Endpoints in this office cannot receive patches until it recovers.', children: [
          { id: 'grp-blr', kind: 'group', name: 'Bengaluru Campus', sub: 'Endpoint Group · 12 endpoints', group: 'Bengaluru Campus', status: 'Pending', source: 'DS-2', patches: '0/12 installed', endpointStats: { success: 0, failed: 0, inProgress: 0, other: 12 } },
        ],
      },
      { id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 9 endpoints', group: 'Local Office', status: 'Success', source: 'Main File Server', patches: '9/9 installed', endpointStats: { success: 9, failed: 0, inProgress: 0, other: 0 } },
    ])]),
    internetLinks: ['mainfs', 'ds1'],
  },
  {
    key: 's5', label: 'Full Internet (DS + Endpoint Direct)',
    desc: 'Everything online: endpoint groups and Distributed Servers prefer direct Internet download. The Main File Server still downloads and stores every patch — if the Internet drops, deployment automatically falls back to its cache (dashed paths).',
    root: so([fs({ status: 'Success' }, [
      {
        id: 'ds1', kind: 'ds', name: 'DS-1', sub: 'Remote Office 1 — Mumbai Office', group: 'Mumbai Office', status: 'In Progress', progress: 66, source: 'Internet', patches: '54 patches cached', netDirect: true, children: [
          { id: 'grp-mum', kind: 'group', name: 'Mumbai Office', sub: 'Endpoint Group · 14 endpoints', group: 'Mumbai Office', status: 'In Progress', progress: 24, source: 'Internet', patches: '4/14 installed', netDirect: true, endpointStats: { success: 4, failed: 0, inProgress: 6, other: 4 } },
        ],
      },
      {
        id: 'ds2', kind: 'ds', name: 'DS-2', sub: 'Remote Office 2 — Bengaluru Campus', group: 'Bengaluru Campus', status: 'Success', source: 'Internet', patches: '41 patches cached', netDirect: true, children: [
          { id: 'grp-blr', kind: 'group', name: 'Bengaluru Campus', sub: 'Endpoint Group · 12 endpoints', group: 'Bengaluru Campus', status: 'Success', source: 'Internet', patches: '12/12 installed', netDirect: true, endpointStats: { success: 12, failed: 0, inProgress: 0, other: 0 } },
        ],
      },
      { id: 'grp-local', kind: 'group', name: 'Local Office', sub: 'Endpoint Group · 9 endpoints', group: 'Local Office', status: 'In Progress', progress: 88, source: 'Internet', patches: '7/9 installed', netDirect: true, endpointStats: { success: 7, failed: 0, inProgress: 2, other: 0 } },
    ])]),
    internetLinks: ['mainfs', 'ds1', 'ds2', 'grp-mum', 'grp-blr', 'grp-local'],
  },
  {
    key: 's6', label: 'Enterprise Scale (18 Remote Offices)',
    desc: 'A real customer footprint: the Main File Server downloads and stores every patch and distributes to 18 Remote Office Distributed Servers plus the Local Office group. Collapse branches or use search/filter to focus on one office.',
    root: so([fs({ status: 'Success' }, enterpriseChildren())]),
    internetLinks: ['mainfs'],
  },
];

/* ------------------------------- layout ------------------------------- */

type Orientation = 'horizontal' | 'vertical';
const CARD_W = 190;
// Depth positions along the FLOW axis (x when horizontal, y when vertical) + the leaf spread
// step along the CROSS axis. Vertical rows are spaced generously so the tallest card + arrow fit.
const COL_X = [0, 300, 620, 940];   // horizontal depth (x)
const ROW_Y = [0, 165, 335, 510];   // vertical depth (y)
const CROSS_H = 112;                 // horizontal leaf spread (y)
const CROSS_V = 234;                 // vertical leaf spread (x)

/* Every card kind renders at a FIXED height (content vertically centered inside), the layout
 * positions rows by card CENTER, and the side handles sit at 50% — so connectors attach at the
 * exact middle of every node AND same-row connections stay dead-straight. */
// Sized to each kind's actual content + the shared py-2.5 padding, so every card shows the
// SAME breathing room top/bottom (extra height would read as uneven padding).
const KIND_H: Record<NodeKind, number> = { serviceops: 78, mainfs: 100, ds: 78, group: 94, internet: 58 };

const countDescendants = (n: TopoNode): number =>
  (n.children ?? []).reduce((acc, c) => acc + 1 + countDescendants(c), 0);

interface FlowBuild { nodes: RFNode[]; edges: RFEdge[]; byId: Map<string, TopoNode> }

function buildFlow(sc: Scenario, collapsed: Set<string>, isDim: (n: TopoNode) => boolean, orient: Orientation): FlowBuild {
  const nodes: RFNode[] = [];
  const edges: RFEdge[] = [];
  const byId = new Map<string, TopoNode>();
  const horiz = orient === 'horizontal';
  const crossStep = horiz ? CROSS_H : CROSS_V;
  let leafC = 0; // running position along the CROSS (spread) axis
  // Map (depth, cross) → the node's top-left {x,y} for the current orientation, keeping the
  // FLOW-axis handle centered on the card.
  const posFor = (depth: number, cross: number, kind: NodeKind) => horiz
    ? { x: COL_X[Math.min(depth, COL_X.length - 1)], y: cross - KIND_H[kind] / 2 }
    : { x: cross - CARD_W / 2, y: ROW_Y[Math.min(depth, ROW_Y.length - 1)] };
  // Tree-edge handles: horizontal flows Right→Left; vertical flows Bottom→Top.
  const treeHandles = horiz ? { s: 'sr', t: 'tl' } : { s: 'sb', t: 'tt' };

  const treeEdgeKind = (parent: TopoNode, child: TopoNode): EdgeKind => {
    if (parent.kind === 'serviceops') return 'trigger';
    if (child.netDirect) return 'fallback';
    if (parent.kind === 'mainfs' && child.kind === 'ds') return 'distribution';
    if (parent.kind === 'ds') return 'dsdownload';
    return 'fileserver';
  };

  // Connector color = the RECEIVING node's deployment status (4 colors only, per request):
  // Success green · Failed red · In Progress orange · everything queued gray.
  const statusColor = (s?: DeployStatus) =>
    s === 'Success' ? '#12B76A' : s === 'Failed' ? '#F04438' : s === 'In Progress' ? '#F79009' : '#94A3B8';
  // Evidence that patches actually FLOWED through a node's subtree (any endpoint success /
  // any active transfer downstream).
  const subtreeFlow = (k: TopoNode): { success: boolean; inProgress: boolean } => {
    if (k.kind === 'group' && k.endpointStats) {
      return { success: k.endpointStats.success > 0, inProgress: k.endpointStats.inProgress > 0 };
    }
    let success = k.status === 'Success';
    let inProgress = k.status === 'In Progress';
    for (const c of k.children ?? []) {
      const e = subtreeFlow(c);
      success = success || e.success;
      inProgress = inProgress || e.inProgress;
    }
    return { success, inProgress };
  };
  // Edges reflect the DELIVERY through that link, not the raw target status:
  // · into a GROUP → its endpoint mix (any success = the path works; red only when ALL failed —
  //   endpoint-local failures like a shut-down machine must not redden the line).
  // · into a Waiting/Pending SERVER → inherit downstream evidence: if its offices already show
  //   successes (or active transfers), patches clearly flowed through this link → green/orange.
  const edgeColor = (k: TopoNode): string => {
    // Delivery failure (couldn't receive from the parent) — the link is red, full stop.
    if (k.deliveryFailed) return '#F04438';
    if (k.kind === 'group' && k.endpointStats) {
      const s = k.endpointStats;
      if (s.inProgress > 0) return '#F79009';
      if (s.success > 0) return '#12B76A';
      if (s.failed > 0) return '#F04438';
      return '#94A3B8';
    }
    if (k.status === 'Failed') return '#F04438';
    if (k.status === 'Success') return '#12B76A';
    if (k.status === 'In Progress') return '#F79009';
    const e = subtreeFlow(k);
    if (e.inProgress) return '#F79009';
    if (e.success) return '#12B76A';
    return '#94A3B8';
  };

  const place = (n: TopoNode, depth: number): number => {
    byId.set(n.id, n);
    const kids = collapsed.has(n.id) ? [] : (n.children ?? []);
    let c: number;              // this node's CROSS position
    let kidCs: number[] = [];
    if (kids.length === 0) {
      c = leafC;
      leafC += crossStep;
    } else {
      kidCs = kids.map((k) => place(k, depth + 1));
      c = (kidCs[0] + kidCs[kidCs.length - 1]) / 2;
    }
    nodes.push({
      id: n.id,
      type: 'topo',
      position: posFor(depth, c, n.kind),
      data: {
        ...n,
        hasKids: (n.children?.length ?? 0) > 0,
        collapsed: collapsed.has(n.id),
        hiddenCount: collapsed.has(n.id) ? countDescendants(n) : 0,
        dim: isDim(n),
        orient,
      },
      draggable: false,
      selectable: false,
    });
    kids.forEach((k, i) => {
      const kind = treeEdgeKind(n, k);
      // NO fallback edges — with many remote offices the standby lines just clutter the map
      // (the cache rule is stated on the Main File Server card instead).
      if (kind === 'fallback') return;
      // The ServiceOps→Main FS trigger link is ALWAYS green (the management connection is
      // healthy in every scenario); every other connector takes the target's delivery color.
      const color = kind === 'trigger' ? '#12B76A' : edgeColor(k);
      // Parent + child share a cross position (directly in-line) → a plain STRAIGHT line; the
      // smoothstep elbow is only for genuine fan-outs off the centerline.
      const level = Math.abs(kidCs[i] - c) < 1;
      edges.push({
        id: `e-${n.id}-${k.id}`,
        source: n.id, target: k.id,
        sourceHandle: treeHandles.s, targetHandle: treeHandles.t,
        type: level ? 'straight' : 'smoothstep',
        ...(level ? {} : { pathOptions: { borderRadius: 14 } }),
        // SOLID always — the dashed-flow treatment is a HOVER effect (CMDB-map pattern),
        // applied in displayEdges, never a resting state.
        animated: false,
        style: { stroke: color, strokeWidth: 1.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
        data: { kind },
      } as RFEdge);
    });
    return c;
  };
  place(sc.root, 0);

  // Internet — the external patch source. Horizontal: its own lane ABOVE the servers.
  // Vertical: to the LEFT of the Main File Server row.
  const internet: TopoNode = { id: 'internet', kind: 'internet', name: 'Internet', sub: 'External Patch Source (Vendor CDN)' };
  byId.set('internet', internet);
  const internetPos = horiz ? { x: COL_X[1] + 130, y: -180 } : { x: -340, y: ROW_Y[1] + 8 };
  nodes.push({
    id: 'internet', type: 'topo', position: internetPos,
    data: { ...internet, dim: isDim(internet) },
    draggable: false, selectable: false,
  });
  const placedIds = new Set(nodes.map((n) => n.id));
  sc.internetLinks.filter((t) => placedIds.has(t)).forEach((t, i) => {
    const target = byId.get(t);
    const color = target ? edgeColor(target) : '#94A3B8';
    // Main FS gets a dedicated straight drop; every other Internet link takes the custom LANE
    // edge (routes through free corridors so it never crosses a card). Handles/lane geometry
    // flip with orientation.
    const laned = t !== 'mainfs';
    const netSource = horiz ? 'nd' : 'nr';                      // Internet: down (horiz) / right (vert)
    const netTarget = laned ? (horiz ? 'tl' : 'tl') : (horiz ? 'tt' : 'tl'); // into target's Left/Top
    edges.push({
      id: `e-net-${t}`,
      source: 'internet', target: t,
      sourceHandle: netSource, targetHandle: netTarget,
      type: laned ? 'lane' : 'smoothstep',
      ...(laned ? {} : { pathOptions: { borderRadius: 14 } }),
      animated: false,
      style: { stroke: color, strokeWidth: 1.6 },
      // Arrowheads on BOTH ends — the downloader requests upstream while the patch data flows
      // down, so the Internet link reads as a two-way collaboration.
      markerStart: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
      data: { kind: 'internet', lane: i * 10, orient },
    } as RFEdge);
  });

  // Red incoming line ⟺ red node border: any node whose incoming connector is red (a failed
  // delivery) gets a red card border so the failure reads on the node itself, not just the line.
  const redTargets = new Set(edges.filter((e) => (e.style as any)?.stroke === '#F04438').map((e) => e.target));
  nodes.forEach((n) => { if (redTargets.has(n.id)) (n.data as any).borderRed = true; });

  // Search/filter spotlight: edges touching a dimmed node fade with it (and stop animating).
  const dimIds = new Set(nodes.filter((n) => (n.data as any).dim).map((n) => n.id));
  if (dimIds.size) {
    edges.forEach((e) => {
      if (dimIds.has(e.source) || dimIds.has(e.target)) {
        e.style = { ...e.style, opacity: 0.18 };
        e.animated = false;
      }
    });
  }

  return { nodes, edges, byId };
}

/* ------------------------------- node card ------------------------------- */

const hiddenHandle = 'opacity-0 !pointer-events-none !min-w-0 !min-h-0 !w-1 !h-1 !border-0 !bg-transparent';

function TopoNodeCard({ data }: NodeProps) {
  const d = data as unknown as TopoNode & { hasKids?: boolean; collapsed?: boolean; hiddenCount?: number; dim?: boolean; borderRed?: boolean; onToggle?: (id: string) => void };
  const kind = KIND_META[d.kind];
  const st = d.status ? STATUS_META[d.status] : null;
  const Icon = kind.icon;
  const dimCls = d.dim ? 'opacity-30' : '';
  // Failed-delivery node → red border + soft red ring (matches its red incoming line).
  const redCls = d.borderRed ? 'border-[#F04438] ring-2 ring-[#F04438]/25' : 'border-[#E2E8F0]';

  if (d.kind === 'internet') {
    return (
      <div className={`relative flex w-[190px] items-center gap-2.5 rounded-lg border border-[#D1E9D6] bg-white px-3 py-2.5 shadow-sm transition-opacity ${dimCls}`} style={{ height: KIND_H.internet }}>
        {/* Internet source: Bottom (horizontal layout) or Right (vertical layout) */}
        <Handle type="source" position={Position.Bottom} id="nd" className={hiddenHandle} />
        <Handle type="source" position={Position.Right} id="nr" className={hiddenHandle} />
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#22C55E1A', color: '#16A34A' }}><Icon size={16} /></span>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-[#364658]">{d.name}</div>
          <div className="truncate text-[10px] text-[#7B8FA5]">{d.sub}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex w-[190px] flex-col justify-center rounded-lg border bg-white px-3 py-2.5 shadow-sm transition-all hover:shadow-md ${redCls} ${d.borderRed ? '' : 'hover:border-[#CBD5E1]'} ${dimCls}`}
      style={{ height: KIND_H[d.kind] }}
    >
      {/* All four sides — the tree edges pick handles by orientation (horizontal: Left/Right;
          vertical: Top/Bottom). 'tl' also receives the Internet lane edges. */}
      <Handle type="target" position={Position.Left} id="tl" className={hiddenHandle} />
      <Handle type="source" position={Position.Right} id="sr" className={hiddenHandle} />
      <Handle type="target" position={Position.Top} id="tt" className={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} id="sb" className={hiddenHandle} />

      <div className="flex items-center gap-2.5">
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${kind.color}1A`, color: kind.color }}><Icon size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[#364658]">{d.name}</div>
          <div className="truncate text-[10px] text-[#7B8FA5]">{d.sub}</div>
        </div>
      </div>

      {/* Group nodes carry NO overall status — their chips+installed row lives in the group
          block below, so this row is for the server/internet kinds only. */}
      {d.kind !== 'group' && (d.patches || (st && d.status)) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {st && d.status && (
            <>
              <st.icon size={11} className={st.spin ? 'animate-spin' : ''} style={{ color: st.color }} />
              <span className="text-[10px] font-medium" style={{ color: st.color }}>{d.status}</span>
            </>
          )}
          {d.patches && <span className="ml-auto truncate text-[9.5px] text-[#94A3B8]">{d.patches}</span>}
        </div>
      )}
      {/* Endpoint groups: stacked status bar — Success green · Failed red · In Progress orange ·
          Other gray, segment width = endpoint count, so the mix reads at a glance. */}
      {d.kind === 'group' && d.endpointStats && (() => {
        const s = d.endpointStats;
        const total = s.success + s.failed + s.inProgress + s.other || 1;
        const segs = [
          { v: s.success, c: '#12B76A' },
          { v: s.failed, c: '#F04438' },
          { v: s.inProgress, c: '#F79009' },
          { v: s.other, c: '#94A3B8' },
        ].filter((x) => x.v > 0);
        return (
          <>
            {/* Single row: Failed / In-Progress chips left, installed count right — then the bar.
                (Technicians care about Failed / In Progress upfront, not Success.) */}
            {(s.failed > 0 || s.inProgress > 0 || d.patches) && (
              <div className="mt-1.5 flex items-center gap-1">
                {s.failed > 0 && (
                  <span className="inline-flex flex-shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: '#FEF3F2', color: '#B42318' }}>
                    {s.failed} Failed
                  </span>
                )}
                {s.inProgress > 0 && (
                  <span className="inline-flex flex-shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: '#FFF8EB', color: '#B54708' }}>
                    {s.inProgress} In Progress
                  </span>
                )}
                {/* Nothing to flag → the left side still gets a state chip so the row never
                    looks half-empty: all done = green, otherwise the queued count in gray. */}
                {s.failed === 0 && s.inProgress === 0 && (
                  s.other === 0 ? (
                    <span className="inline-flex flex-shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: '#ECFDF3', color: '#067647' }}>
                      All Success
                    </span>
                  ) : (
                    <span className="inline-flex flex-shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: '#F2F4F7', color: '#475467' }}>
                      {s.other} Pending
                    </span>
                  )
                )}
                {d.patches && <span className="ml-auto truncate text-[9.5px] text-[#94A3B8]">{d.patches}</span>}
              </div>
            )}
            <div className="mt-1.5 flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-[#EEF2F6]">
              {segs.map((x, i) => (
                <div key={i} className="h-full" style={{ width: `${(x.v / total) * 100}%`, backgroundColor: x.c }} />
              ))}
            </div>
          </>
        );
      })()}
      {/* The cache rule, pinned on the card that owns it */}
      {d.kind === 'mainfs' && (
        <div className="mt-1.5 flex items-center gap-1 text-[9.5px] font-medium text-[#16A34A]">
          <ShieldCheck size={10} /> Always stores every patch
        </div>
      )}

      {/* Collapse / expand badge — sits on the OUTGOING edge side: right edge in horizontal
          flow, bottom edge in vertical flow. Collapse is badge-only; node click opens details. */}
      {d.hasKids && (
        <button
          onClick={(e) => { e.stopPropagation(); d.onToggle?.(d.id); }}
          className={`absolute ${(d as any).orient === 'vertical' ? '-bottom-2.5 left-1/2 -translate-x-1/2' : '-right-2.5 top-1/2 -translate-y-1/2'} flex size-5 items-center justify-center rounded-full border text-[9px] font-semibold shadow-sm transition-colors ${d.collapsed ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white hover:bg-[#2d6ca0]' : 'border-[#CBD5E1] bg-white text-[#64748B] hover:border-[#3D8BD0] hover:text-[#3D8BD0]'}`}
        >
          {d.collapsed ? d.hiddenCount : <Minus size={10} />}
        </button>
      )}
    </div>
  );
}

const nodeTypes = { topo: TopoNodeCard };

/* Internet edges route through the FREE corridors so they never pass behind a card:
 * across the top lane (above every row), down the inter-column gap beside the target's
 * column, then a short run into the target's LEFT handle. `data.lane` staggers parallel
 * edges so shared corridors don't overlap. */
function LaneEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, style, markerEnd, markerStart, data } = props;
  const off = ((data as any)?.lane as number | undefined) ?? 0;
  const vert = (data as any)?.orient === 'vertical';
  const r = 10;
  let path: string;
  if (vert) {
    // Internet sits LEFT; run right into a vertical corridor beside it, down/up to the target's
    // row, then right into its Left handle — always through free space.
    const laneX = sourceX + 16 + off;
    const cy = targetY;
    const dv = Math.sign(cy - sourceY) || 1;
    path = [
      `M ${sourceX} ${sourceY}`,
      `L ${laneX - r} ${sourceY}`,
      `Q ${laneX} ${sourceY} ${laneX} ${sourceY + dv * r}`,
      `L ${laneX} ${cy - dv * r}`,
      `Q ${laneX} ${cy} ${laneX + r} ${cy}`,
      `L ${targetX} ${cy}`,
    ].join(' ');
  } else {
    // Internet sits ABOVE; drop into the top lane, along to the inter-column gap left of the
    // target, down its corridor, then right into its Left handle.
    const laneY = sourceY + 16 + off;
    const cx = targetX - 28 - off;
    const dir = Math.sign(cx - sourceX) || 1;
    path = [
      `M ${sourceX} ${sourceY}`,
      `L ${sourceX} ${laneY - r}`,
      `Q ${sourceX} ${laneY} ${sourceX + dir * r} ${laneY}`,
      `L ${cx - dir * r} ${laneY}`,
      `Q ${cx} ${laneY} ${cx} ${laneY + r}`,
      `L ${cx} ${targetY - r}`,
      `Q ${cx} ${targetY} ${cx + r} ${targetY}`,
      `L ${targetX} ${targetY}`,
    ].join(' ');
  }
  return <BaseEdge path={path} style={style} markerEnd={markerEnd as string} markerStart={markerStart as string} />;
}

const edgeTypes = { lane: LaneEdge };

/* ------------------------- group endpoints side panel ------------------------- */

type PanelStatus = 'Success' | 'Failed' | 'In Progress' | 'Pending' | 'Waiting';
interface PanelEndpoint { id: string; hostName: string; ip: string; os: string; usedBy: string | null; group: string; status: PanelStatus }

const OFFICE_CODE: Record<string, string> = { 'Local Office': 'LOC', 'Mumbai Office': 'MUM', 'Bengaluru Campus': 'BLR' };
const PANEL_OS_POOL = ['Microsoft Windows 11 Pro', 'Microsoft Windows 10 Pro', 'Microsoft Windows 11 Enterprise', 'Microsoft Windows 10 Enterprise'];
const PANEL_USER_POOL = ['Priya Nair', 'Rahul Verma', 'Ananya Iyer', 'Karan Malhotra', 'Neha Raje', 'Vikram Sethi', 'Farah Sheikh', 'Rohan Mehta'];

/** Deterministic member endpoints for a group node — statuses add up EXACTLY to its
 *  endpointStats, so the panel always agrees with the hover card's breakdown. */
function endpointsForGroup(g: TopoNode): PanelEndpoint[] {
  const s = g.endpointStats ?? { success: 0, failed: 0, inProgress: 0, other: 0 };
  const code = OFFICE_CODE[g.name] ?? g.name.slice(0, 3).toUpperCase();
  const statuses: (PanelStatus | null)[] = [
    ...Array(s.success).fill('Success'),
    ...Array(s.failed).fill('Failed'),
    ...Array(s.inProgress).fill('In Progress'),
    ...Array(s.other).fill(null),
  ];
  return statuses.map((st, i) => ({
    id: `EP-${600 + (code.charCodeAt(0) % 10) * 20 + i}`,
    hostName: `${code}-${i % 3 === 0 ? 'DT' : 'LT'}-0${101 + i}`,
    ip: `10.2${code.charCodeAt(1) % 10}.${10 + i}.${20 + ((i * 7) % 200)}`,
    os: PANEL_OS_POOL[i % PANEL_OS_POOL.length],
    usedBy: i % 4 === 3 ? null : PANEL_USER_POOL[(i + code.length) % PANEL_USER_POOL.length],
    group: g.name,
    status: st ?? (i % 2 ? 'Pending' : 'Waiting'),
  }));
}

const PANEL_STATUS_COLOR: Record<PanelStatus, string> = {
  Success: '#12B76A', Failed: '#F04438', 'In Progress': '#F79009', Pending: '#94A3B8', Waiting: '#94A3B8',
};

/** Side popup listing a group's endpoints — ActiveIssuesPanel pattern (status pills with
 *  counts, removable group chip inside the search field, standard borderless grid). */
function GroupEndpointsPanel({ groups, initialGroup, onClose }: { groups: TopoNode[]; initialGroup: string; onClose: () => void }) {
  const [groupFilter, setGroupFilter] = useState<string | null>(initialGroup);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed' | 'In Progress' | 'Other'>('All');
  const [search, setSearch] = useState('');

  const all = useMemo(() => groups.flatMap(endpointsForGroup), [groups]);
  const scoped = groupFilter ? all.filter((e) => e.group === groupFilter) : all;
  const isOther = (st: PanelStatus) => st === 'Pending' || st === 'Waiting';
  const counts = {
    All: scoped.length,
    Success: scoped.filter((e) => e.status === 'Success').length,
    Failed: scoped.filter((e) => e.status === 'Failed').length,
    'In Progress': scoped.filter((e) => e.status === 'In Progress').length,
    Other: scoped.filter((e) => isOther(e.status)).length,
  };
  const q = search.trim().toLowerCase();
  const rows = scoped
    .filter((e) => statusFilter === 'All' ? true : statusFilter === 'Other' ? isOther(e.status) : e.status === statusFilter)
    .filter((e) => !q || e.id.toLowerCase().includes(q) || e.hostName.toLowerCase().includes(q) || e.ip.includes(q) || e.os.toLowerCase().includes(q) || (e.usedBy ?? '').toLowerCase().includes(q));

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[10001] flex w-[820px] max-w-[94vw] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">
            Endpoints <span className="font-normal text-[#7B8FA5]">— {initialGroup}</span>
          </h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
            <X size={16} className="text-[#64748B]" />
          </button>
        </div>

        {/* Status pills — All + per-status counts (0-count pills hidden, ActiveIssues pattern) */}
        <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
          {(['All', 'Success', 'Failed', 'In Progress', 'Other'] as const)
            .filter((k) => k === 'All' || counts[k] > 0)
            .map((k) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${statusFilter === k ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'}`}
              >
                {k}
                {k !== 'All' && (
                  <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${statusFilter === k ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
                    {counts[k]}
                  </span>
                )}
              </button>
            ))}
        </div>

        {/* Search with the removable group chip inside (like "Status Not In Closed") */}
        <div className="px-6 pt-3">
          <div className="flex h-9 items-center gap-2 rounded border border-[#d1d5db] bg-white px-3">
            {groupFilter && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">
                {groupFilter}
                <button onClick={() => setGroupFilter(null)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
              </span>
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Select field or enter a keyword to search..."
              className="h-full min-w-0 flex-1 text-[13px] text-[#364658] outline-none placeholder:text-[#9ca3af]"
            />
            <Search size={15} className="flex-shrink-0 text-[#9ca3af]" />
          </div>
        </div>

        {/* Endpoint grid — standard borderless table */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Agent ID', 'Host Name', 'IP Address', 'OS Name', 'Used By', 'Deployment Status'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-[13px] text-[#9CA3AF]">No endpoints match.</td></tr>
              ) : rows.map((e) => (
                <tr key={`${e.group}-${e.id}`} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{e.id}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-[12px] text-[#364658]">{e.hostName}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-[12px] text-[#364658]">{e.ip}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[190px] truncate" title={e.os}>{e.os}</span></td>
                  <td className="px-3 py-3 whitespace-nowrap text-[12px]">
                    {e.usedBy ? (
                      <span className="inline-flex items-center gap-1.5 text-[#3D8BD0]"><User size={12} className="text-[#9ca3af]" />{e.usedBy}</span>
                    ) : <span className="text-[#9ca3af]">---</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-[12px]">
                    <span className="inline-flex items-center gap-1.5 text-[#364658]">
                      <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: PANEL_STATUS_COLOR[e.status] }} />
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- canvas controls ------------------------------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[3px]">
      <span className="flex items-center gap-1">{keys}</span>
      <span className="whitespace-nowrap text-[12px] text-[#7B8FA5]">{label}</span>
    </div>
  );
}

function CanvasControls({ onReset, orient, onOrientChange }: { onReset: () => void; orient: Orientation; onOrientChange: (o: Orientation) => void }) {
  const rf = useReactFlow();
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const panBy = (dx: number, dy: number) => {
    const v = rf.getViewport();
    rf.setViewport({ ...v, x: v.x + dx, y: v.y + dy }, { duration: 120 });
  };
  // Same d-pad recipe as the CMDB Dependency Map: free-standing size-7 rounded-md buttons,
  // Up on top and a Left · Down · Right row, each with a Radix tooltip.
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const card = 'flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm';
  const [showKeys, setShowKeys] = useState(false);

  // Canvas keyboard shortcuts (Superseded-tree parity): arrows pan, +/− zoom, F fits, R resets.
  // Disabled while typing (the toolbar search owns Ctrl+F / Esc).
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); panBy(0, -40); break;
        case 'ArrowDown': e.preventDefault(); panBy(0, 40); break;
        case 'ArrowLeft': e.preventDefault(); panBy(-40, 0); break;
        case 'ArrowRight': e.preventDefault(); panBy(40, 0); break;
        case '+': case '=': rf.zoomIn({ duration: 150 }); break;
        case '-': case '_': rf.zoomOut({ duration: 150 }); break;
        case 'f': case 'F': rf.fitView({ padding: 0.25, duration: 300 }); break;
        case 'r': case 'R': onReset(); break;
        case 'Escape': setShowKeys(false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rf, onReset]);

  return (
    <>
      {/* Top-right: keyboard shortcuts · fit & center · zoom in/out · reset — SEPARATE stacked
          cards, the same grouping the Dependency Map / Superseded canvases use. */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        {/* Keyboard shortcuts + fit & center share ONE card (Superseded-tree grouping) */}
        <div className={card}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowKeys((v) => !v)} className={`${btn} ${showKeys ? 'bg-[#EAF2FB] text-[#3D8BD0]' : ''}`}><Keyboard size={14} /></button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts</TooltipContent>
          </Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.25, duration: 300 })} className={`${btn} border-t border-[#E5E7EB]`}><Maximize size={13} /></button></TooltipTrigger><TooltipContent side="left">Fit &amp; center</TooltipContent></Tooltip>
        </div>
        {/* Keyboard shortcuts popup */}
        {showKeys && (
          <>
            <div className="fixed inset-0" onClick={() => setShowKeys(false)} />
            <div className="absolute right-9 top-0 w-[290px] rounded-lg border border-[#E5E7EB] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[#F0F1F3] px-3.5 py-2.5">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#364658]">
                  <Keyboard size={14} className="text-[#6B7280]" /> Keyboard Shortcuts
                </span>
                <button onClick={() => setShowKeys(false)} className="text-[#9CA3AF] transition-colors hover:text-[#364658]" title="Close">
                  <Minus size={14} />
                </button>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Navigation</div>
                <ShortcutRow keys={<><Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd></>} label="Pan canvas" />
                <ShortcutRow keys={<><Kbd>+</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>−</Kbd></>} label="Zoom in / out" />
                <ShortcutRow keys={<Kbd>F</Kbd>} label="Fit & center all nodes" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">View</div>
                <ShortcutRow keys={<Kbd>R</Kbd>} label="Reset view" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Search</div>
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Focus search" />
                <ShortcutRow keys={<Kbd>Escape</Kbd>} label="Clear search" />
              </div>
            </div>
          </>
        )}
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom in</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom out</TooltipContent></Tooltip>
        </div>
        {/* Reset + flow-direction TOGGLE share one card. The toggle shows the orientation you'd
            SWITCH TO (not the current one); clicking flips the layout and the icon. */}
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={onReset} className={btn}><RotateCcw size={13} /></button></TooltipTrigger><TooltipContent side="left">Reset view</TooltipContent></Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onOrientChange(orient === 'horizontal' ? 'vertical' : 'horizontal')} className={`${btn} border-t border-[#E5E7EB]`}>
                {orient === 'horizontal' ? <MoveVertical size={14} /> : <MoveHorizontal size={14} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">{orient === 'horizontal' ? 'Switch to vertical flow' : 'Switch to horizontal flow'}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Bottom-left: directional pan */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1">
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
    </>
  );
}

function FitOnChange({ signal }: { signal: number }) {
  const rf = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.25, duration: 300 }), 40);
    return () => clearTimeout(t);
  }, [signal, rf]);
  return null;
}

/* ------------------------------- main component ------------------------------- */

/* Deterministic "did this office receive that patch" membership for the mock canvas — ~2/3 of
 * offices carry any given patch, stable across renders (no Math.random). */
function officeHasPatch(officeName: string, patchId: string) {
  let h = 0;
  const s = officeName + '|' + patchId;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 3 !== 0;
}

export function DeploymentTopologyView({ search = '', statusFilter = [], patchFilter = [], fullscreen = false }: { search?: string; statusFilter?: string[]; patchFilter?: string[]; fullscreen?: boolean }) {
  useShortcutContext('deployment-topology');
  const [scenarioKey, setScenarioKey] = useState('s3');
  const [orient, setOrient] = useState<Orientation>('horizontal');
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [fitSignal, setFitSignal] = useState(0);
  // Screen-space hover card, anchored to the NODE (Dependency-Map/Superseded pattern):
  // centered above it, flips below when near the top, clamps horizontally; a layout effect
  // re-measures the real card height pre-paint and corrects top/placement.
  const HOVER_W = 270, HOVER_GAP = 12, HOVER_PAD = 8;
  const [nodeTip, setNodeTip] = useState<{ left: number; top: number; placement: 'above' | 'below'; arrowLeft: number; yTop: number; yBot: number; node: TopoNode } | null>(null);
  const [edgeTip, setEdgeTip] = useState<{ x: number; y: number; kind: EdgeKind } | null>(null);
  // Hovered NODE — every link touching it gets the animated dashed-flow treatment, like the
  // CMDB Dependency Map. Resting edges are always solid.
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Short grace period on leave so the pointer can travel INTO the card (its View-more link is
  // clickable) — same hover-persistence the CMDB map cards use.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Side popup listing a group's endpoints (opened from the hover card's View more).
  const [groupPanel, setGroupPanel] = useState<string | null>(null);
  // Collapsible status legend (CMDB map pattern — the toggle icon stays visible).
  const [showLegend, setShowLegend] = useState(true);

  const showNodeCard = (node: TopoNode, cx: number, yTop: number, yBot: number, wrapW: number) => {
    const estH = 165 + (node.error ? 64 : 0) + (node.endpointStats ? 72 : 0);
    const placement: 'above' | 'below' = yTop - HOVER_GAP - estH < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? yTop - HOVER_GAP - estH : yBot + HOVER_GAP;
    let left = cx - HOVER_W / 2;
    left = Math.max(HOVER_PAD, Math.min(left, wrapW - HOVER_W - HOVER_PAD));
    const arrowLeft = Math.max(14, Math.min(cx - left, HOVER_W - 14));
    setNodeTip({ left, top, placement, arrowLeft, yTop, yBot, node });
  };
  // Correct with the REAL rendered height (before paint — no flicker; converges in one pass).
  useLayoutEffect(() => {
    if (!nodeTip || !cardRef.current) return;
    const hReal = cardRef.current.offsetHeight;
    const placement: 'above' | 'below' = nodeTip.yTop - HOVER_GAP - hReal < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? nodeTip.yTop - HOVER_GAP - hReal : nodeTip.yBot + HOVER_GAP;
    if (Math.abs(top - nodeTip.top) > 1 || placement !== nodeTip.placement) {
      setNodeTip({ ...nodeTip, top, placement });
    }
  }, [nodeTip]);

  // The drawer spans the full viewport height, so the canvas fills EXACTLY the space below its
  // own top edge — measured live (a fixed calc() estimate left a gap at the bottom).
  const [canvasH, setCanvasH] = useState(460);
  useEffect(() => {
    // rAF: measure AFTER the fullscreen overlay (or normal layout) has painted its position.
    const measure = () => requestAnimationFrame(() => {
      const top = wrapperRef.current?.getBoundingClientRect().top ?? 0;
      setCanvasH(Math.max(380, window.innerHeight - top));
    });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [fullscreen]);
  // React Flow doesn't refit on container resize — nudge it when fullscreen toggles.
  useEffect(() => { setFitSignal((s) => s + 1); }, [fullscreen]);
  // Re-fit when the flow direction flips (the whole layout transposes).
  useEffect(() => { setFitSignal((s) => s + 1); }, [orient]);

  const scenario = DEPLOY_SCENARIOS.find((s) => s.key === scenarioKey) ?? DEPLOY_SCENARIOS[0];

  // All endpoint-group nodes of the current scenario (feeds the side panel's chip-off view).
  const groupNodes = useMemo(() => {
    const out: TopoNode[] = [];
    const walk = (n: TopoNode) => { if (n.kind === 'group') out.push(n); n.children?.forEach(walk); };
    walk(scenario.root);
    return out;
  }, [scenario]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const { nodes, edges, byId } = useMemo(() => {
    // Spotlight matcher — search hits name/sub/group; the status filter (from the toolbar's
    // Filter pill) hits the node's deployment status. Non-matching nodes/edges fade.
    const q = search.trim().toLowerCase();
    const isDim = (n: TopoNode) => {
      if (!q && statusFilter.length === 0 && patchFilter.length === 0) return false;
      const textOk = !q || n.name.toLowerCase().includes(q) || (n.sub ?? '').toLowerCase().includes(q) || (n.group ?? '').toLowerCase().includes(q);
      // The Filter pill shares the LIST view's option set — map its vocabulary onto the
      // canvas statuses where they differ ("Yet to Receive" ≈ a node still Pending/Waiting).
      const statusOk = statusFilter.length === 0 || (!!n.status && (
        statusFilter.includes(n.status) ||
        (statusFilter.includes('Yet to Receive') && (n.status === 'Pending' || n.status === 'Waiting'))
      ));
      // Patch filter spotlights the OFFICES that received the selected patch(es). Infrastructure
      // (ServiceOps / Main FS / DS / Internet) stays lit — the Main File Server stores EVERY
      // patch, so a patch filter only discriminates at the endpoint-group level.
      const patchOk = patchFilter.length === 0 || n.kind !== 'group' ||
        patchFilter.some((pid) => officeHasPatch(n.name, pid));
      return !(textOk && statusOk && patchOk);
    };
    const built = buildFlow(scenario, collapsed, isDim, orient);
    // Thread the collapse handler into every node's data (nodes are plain data objects).
    built.nodes.forEach((n) => { (n.data as any).onToggle = toggleCollapse; });
    return built;
  }, [scenario, collapsed, toggleCollapse, search, statusFilter, patchFilter, orient]);

  // Hover flow-highlight: every link connected to the hovered node animates as dashed flow;
  // everything else stays solid.
  const displayEdges = useMemo(() => {
    if (!hoverNodeId) return edges;
    return edges.map((e) => (e.source === hoverNodeId || e.target === hoverNodeId ? { ...e, animated: true } : e));
  }, [edges, hoverNodeId]);

  const selectScenario = (key: string) => {
    setScenarioKey(key);
    setCollapsed(new Set());
    setShowScenarioMenu(false);
    setFitSignal((s) => s + 1);
  };
  const resetView = () => {
    setCollapsed(new Set());
    setFitSignal((s) => s + 1);
  };

  const rel = (e: { clientX: number; clientY: number }) => {
    const r = wrapperRef.current?.getBoundingClientRect();
    return { x: (e.clientX - (r?.left ?? 0)) + 12, y: (e.clientY - (r?.top ?? 0)) + 12 };
  };

  return (
    <div className="mt-3 -mx-6 -mb-4 border-t border-[#E5E7EB]">
      {/* Scenario bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white px-6 py-2.5">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowScenarioMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]"
          >
            <span className="text-[11px] uppercase tracking-wide text-[#7B8FA5]">Scenario</span>
            {scenario.label}
            <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${showScenarioMenu ? 'rotate-180' : ''}`} />
          </button>
          {showScenarioMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowScenarioMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                {DEPLOY_SCENARIOS.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => selectScenario(s.key)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition-colors ${scenarioKey === s.key ? 'bg-[#F1F5F9] text-[#364658]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                  >
                    <span className="truncate"><span className="mr-1.5 text-[#7B8FA5]">{i + 1}.</span>{s.label}</span>
                    {scenarioKey === s.key && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-[12px] text-[#7B8FA5]" title={scenario.desc}>{scenario.desc}</p>
      </div>

      {/* Canvas */}
      <ReactFlowProvider>
        <div ref={wrapperRef} className="relative border-t border-[#EEF1F5]" style={{ backgroundColor: '#FAFBFC', height: canvasH }}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={1.6}
            nodesConnectable={false}
            proOptions={{ hideAttribution: true }}
            /* Click EXPANDS a collapsed branch (Superseded-map behavior); collapse stays on the
               minus badge. Registering onNodeClick also keeps pointer events alive on the
               non-draggable nodes (React Flow gotcha) so hover works. */
            onNodeClick={(_, n) => { if (collapsed.has(n.id)) toggleCollapse(n.id); }}
            onNodeMouseEnter={(e, n) => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              // Animate this node's connected lines immediately (dashed flow, CMDB pattern).
              setHoverNodeId(n.id);
              const node = byId.get(n.id);
              const el = (e.target as HTMLElement).closest('.react-flow__node') as HTMLElement | null;
              const rect = wrapperRef.current?.getBoundingClientRect();
              // The Internet node has no deployment details worth a card — no hover tooltip.
              if (!node || node.kind === 'internet' || !el || !rect) return;
              // Node rect in wrapper space — the card anchors to the node, not the pointer.
              const nr = el.getBoundingClientRect();
              const cx = nr.left + nr.width / 2 - rect.left;
              const yTop = nr.top - rect.top;
              const yBot = nr.bottom - rect.top;
              if (hideTimer.current) clearTimeout(hideTimer.current);
              hoverTimer.current = setTimeout(() => showNodeCard(node, cx, yTop, yBot, rect.width), 550);
            }}
            onNodeMouseLeave={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              if (hideTimer.current) clearTimeout(hideTimer.current);
              setHoverNodeId(null);
              hideTimer.current = setTimeout(() => setNodeTip(null), 180);
            }}
            onEdgeMouseEnter={(e, edge) => setEdgeTip({ ...rel(e), kind: ((edge.data as any)?.kind ?? 'fileserver') as EdgeKind })}
            onEdgeMouseLeave={() => setEdgeTip(null)}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#D9DEE7" />
          </ReactFlow>

          <CanvasControls onReset={resetView} orient={orient} onOrientChange={setOrient} />
          <FitOnChange signal={fitSignal} />

          {/* Status legend (bottom-right) — collapsible, CMDB-map pattern: the card has a
              chevron collapse button and the List toggle icon stays visible below it. */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
            {showLegend && (
              <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Connection Status</span>
                  <button onClick={() => setShowLegend(false)} className="text-[#9CA3AF] transition-colors hover:text-[#364658]" title="Collapse">
                    <ChevronDown size={13} />
                  </button>
                </div>
                {([
                  ['Success', '#12B76A'],
                  ['Failed', '#F04438'],
                  ['In Progress', '#F79009'],
                  ['Pending', '#94A3B8'],
                ] as [string, string][]).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2 py-0.5">
                    <span className="h-0.5 w-5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10.5px] text-[#475467]">{label}</span>
                  </div>
                ))}
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLegend((v) => !v)}
                  className={`flex size-8 items-center justify-center rounded border shadow-sm transition-colors ${showLegend ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F5F7FA]'}`}
                >
                  <List size={15} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Connection status legend</TooltipContent>
            </Tooltip>
          </div>

          {/* Rich node hover card — Dependency-Map/Superseded treatment (replaces the old
              click-to-open side panel; all node details live here now). */}
          {nodeTip && (() => {
            const n = nodeTip.node;
            const kind = KIND_META[n.kind];
            const st = n.status ? STATUS_META[n.status] : null;
            const rows: [string, string][] = [
              ['Group', n.group ?? (n.kind === 'internet' ? '---' : 'Local Office')],
              ['Download Source', n.source ?? (n.kind === 'internet' ? '---' : 'Not started')],
              ['Patch Count', n.patches ?? '---'],
              ['Last Sync', n.kind === 'internet' ? '---' : 'Mon, Jul 27, 2026 09:42 AM'],
            ];
            return (
              <div
                ref={cardRef}
                className="absolute z-30 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
                style={{ left: nodeTip.left, top: nodeTip.top, width: HOVER_W }}
                onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
                onMouseLeave={() => setNodeTip(null)}
              >
                {/* Arrow pointing at the node */}
                <div
                  className={`absolute size-2.5 rotate-45 border-[#E5E7EB] bg-white ${nodeTip.placement === 'above' ? '-bottom-[6px] border-b border-r' : '-top-[6px] border-l border-t'}`}
                  style={{ left: nodeTip.arrowLeft - 5 }}
                />
                <div className="flex items-center gap-2.5 border-b border-[#F0F2F5] px-3.5 py-2.5">
                  <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${kind.color}1A`, color: kind.color }}>
                    <kind.icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-[#364658]">{n.name}</div>
                    <div className="truncate text-[10.5px] text-[#7B8FA5]">{kind.label}</div>
                  </div>
                </div>
                <div className="space-y-1.5 px-3.5 py-2.5">
                  {/* Groups: no overall Status row — the Endpoints-by-Status section carries it */}
                  {st && n.status && n.kind !== 'group' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#7B8FA5]">Status</span>
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: st.color }}>
                        <st.icon size={11} className={st.spin ? 'animate-spin' : ''} />
                        {n.status}
                      </span>
                    </div>
                  )}
                  {rows.map(([l, v]) => (
                    <div key={l} className="flex items-start justify-between gap-3">
                      <span className="flex-shrink-0 text-[11px] text-[#7B8FA5]">{l}</span>
                      <span className="min-w-0 truncate text-right text-[11.5px] text-[#364658]">{v}</span>
                    </div>
                  ))}
                </div>
                {/* Endpoint groups: member-endpoint counts by deployment status */}
                {n.endpointStats && (
                  <div className="border-t border-[#F0F2F5] px-3.5 py-2.5">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Endpoints by Status</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {([
                        ['Success', n.endpointStats.success, '#12B76A'],
                        ['Failed', n.endpointStats.failed, '#F04438'],
                        ['In Progress', n.endpointStats.inProgress, '#F79009'],
                        ['Other', n.endpointStats.other, '#94A3B8'],
                      ] as [string, number, string][]).map(([l, c, color]) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-[#475467]">{l}</span>
                          <span className="text-[11px] font-semibold tabular-nums text-[#364658]">{c}</span>
                        </div>
                      ))}
                    </div>
                    {/* Full-width strip → opens the group's endpoint list (CMDB active-issues pattern) */}
                    <button
                      onClick={() => { setGroupPanel(n.name); setNodeTip(null); }}
                      className="mt-2.5 flex w-full items-center gap-1.5 rounded-md bg-[#EBF5FF] px-2.5 py-1.5 text-[11.5px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#DBEAFE]"
                    >
                      <Monitor size={13} className="flex-shrink-0" />
                      View all endpoints
                      <ChevronRight size={13} className="ml-auto flex-shrink-0" />
                    </button>
                  </div>
                )}
                {n.error && (
                  <div className="mx-3.5 mb-3 rounded-md border border-[#FECDCA] bg-[#FEF3F2] px-2.5 py-2 text-[10.5px] leading-relaxed text-[#B42318]">{n.error}</div>
                )}
              </div>
            );
          })()}

          {/* Edge hover tip — "Patch Download Flow" / "Patch Distribution Flow" */}
          {edgeTip && (
            <div className="pointer-events-none absolute z-30 rounded-md bg-[#1E293B] px-2.5 py-1.5 text-white shadow-lg" style={{ left: Math.min(edgeTip.x, (wrapperRef.current?.clientWidth ?? 600) - 220), top: edgeTip.y }}>
              <div className="flex items-center gap-1.5 text-[11px] font-medium">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: EDGE_META[edgeTip.kind].color }} />
                {EDGE_META[edgeTip.kind].label}
              </div>
              <div className="text-[10px] text-white/60">{EDGE_META[edgeTip.kind].flow}</div>
            </div>
          )}

        </div>
      </ReactFlowProvider>

      {/* Group endpoints side popup — opened from a group hover card's "View more" */}
      {groupPanel && (
        <GroupEndpointsPanel groups={groupNodes} initialGroup={groupPanel} onClose={() => setGroupPanel(null)} />
      )}
    </div>
  );
}
