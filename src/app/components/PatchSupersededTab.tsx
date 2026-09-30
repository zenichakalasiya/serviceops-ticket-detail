import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  useInternalNode,
  getSmoothStepPath,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, X, Package, Layers, Plus, Minus, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronsUpDown, ChevronsDownUp, Maximize2, Minimize2, Keyboard, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { useShortcutContext } from './shortcutContext';

interface ChainPatch {
  kb: string;
  title: string;
  build: string;
  releaseDate: string;
  severity: 'Critical' | 'Important' | 'Moderate' | 'Low';
}

/* Supersedence rendered as a CMDB-style dependency map (React Flow): the current patch sits in the
 * CENTER, newer patches that replace it branch UP ("Superseded By"), older patches it replaces
 * branch DOWN ("Superseded"). Supersedence is RECURSIVE — each patch can itself supersede/be
 * superseded by others — so every node with further versions carries a count badge and expands its
 * children in the tree on click (same interaction as the CMDB Dependency Map). */

// Older patches this one replaces (immediate predecessor first, then further back).
const SUPERSEDES: ChainPatch[] = [
  { kb: 'KB5068861', title: '2025-11 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.7171', releaseDate: 'Tue, Nov 11, 2025', severity: 'Critical' },
  { kb: 'KB5066835', title: '2025-10 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.6899', releaseDate: 'Tue, Oct 14, 2025', severity: 'Critical' },
  { kb: 'KB5065789', title: '2025-09 Cumulative Update Preview for Windows 11, version 25H2 for x64-based Systems', build: '26200.6725', releaseDate: 'Fri, Sep 26, 2025', severity: 'Moderate' },
  { kb: 'KB5065426', title: '2025-09 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.6584', releaseDate: 'Tue, Sep 09, 2025', severity: 'Important' },
  { kb: 'KB5064081', title: '2025-08 Cumulative Update Preview for Windows 11, version 25H2 for x64-based Systems', build: '26200.5074', releaseDate: 'Tue, Aug 26, 2025', severity: 'Moderate' },
  { kb: 'KB5063878', title: '2025-08 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.4946', releaseDate: 'Tue, Aug 12, 2025', severity: 'Important' },
];

// Newer patches that replace this one (immediate successor first).
const SUPERSEDED_BY: ChainPatch[] = [
  { kb: 'KB5077891', title: '2026-02 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8012', releaseDate: 'Tue, Feb 10, 2026', severity: 'Critical' },
  { kb: 'KB5081234', title: '2026-03 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8455', releaseDate: 'Tue, Mar 10, 2026', severity: 'Critical' },
  { kb: 'KB5085602', title: '2026-04 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8890', releaseDate: 'Tue, Apr 14, 2026', severity: 'Important' },
];

const severityColor = (s: ChainPatch['severity']) =>
  s === 'Critical' ? '#EF4444' : s === 'Important' ? '#F59E0B' : s === 'Moderate' ? '#EAB308' : '#64748B';

// Nodes are colored by DIRECTION, not severity: one color for the newer patches that replace this
// one (Superseded By), one for the older patches it replaces (Superseded).
const NEWER_COLOR = '#22C55E';  // Superseded By — newer / current
const OLDER_COLOR = '#94A3B8';  // Superseded — older / deprecated

/* The real patch title is long and repetitive ("2025-10 Cumulative Update for Windows 11, version
 * 25H2 for x64-based Systems"). For the node label we keep only the meaningful prefix — the release
 * month + update type — and drop the OS/arch boilerplate. The full title shows in the hover card. */
const shortTitle = (title: string) => title.split(/\s+for\s+/i)[0].trim();

/* ---- layout geometry (React Flow coordinates) ---- */
const CARD_W = 208;      // rectangle node width
const CARD_H = 62;       // approx rectangle node height (edges use the measured size)
const HALF_W = CARD_W / 2;
const HALF_H = CARD_H / 2;
const GAP_X = 236;       // horizontal spacing between sibling cards
const LEVEL_GAP = 168;   // vertical spacing between tree depths
const ROW_TOP = -180;    // first successor row center-y
const ROW_MID = 0;       // current patch center-y
const ROW_BOT = 180;     // first predecessor row center-y
const BUS_TOP = -90;     // upper bus label y
const BUS_BOT = 90;      // lower bus label y
const MAX_DEPTH = 3;     // how many recursive supersedence levels to mock
const hiddenHandle = '!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !bg-transparent';

/* -------------------- recursive mock supersedence tree -------------------- */

interface SNode { id: string; patch: ChainPatch; children: SNode[] }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEVS: ChainPatch['severity'][] = ['Critical', 'Important', 'Moderate'];

/** Deterministic child patches: older ones for a 'down' branch, newer ones for 'up'. */
function childPatches(parent: ChainPatch, dir: 'up' | 'down', depth: number): ChainPatch[] {
  if (depth >= MAX_DEPTH) return [];
  const h = hash(parent.kb + '|' + depth);
  const count = depth === 1 ? (h % 2 === 0 ? 2 + (h % 2) : 0) : (h % 3 === 0 ? 2 : 0);
  if (!count) return [];
  const kbN = parseInt(parent.kb.replace(/\D/g, ''), 10) || 5060000;
  const [maj, minStr] = parent.build.split('.');
  const parentMin = parseInt(minStr, 10) || 6000;
  const pm = parent.title.match(/^(\d{4})-(\d{2})/);
  const py = pm ? parseInt(pm[1], 10) : 2025;
  const pMonthIdx = pm ? parseInt(pm[2], 10) - 1 : 9;
  const sign = dir === 'down' ? -1 : 1;
  const out: ChainPatch[] = [];
  for (let k = 0; k < count; k++) {
    const seed = hash(parent.kb + ':' + depth + ':' + k);
    const step = k + 1;
    const kb = 'KB' + (kbN + sign * (step * 7 + (seed % 23)));
    const min = Math.max(1000, parentMin + sign * (step * 120 + (seed % 180)));
    const base = new Date(py, pMonthIdx + sign * step, 1);   // explicit-arg Date is fine in components
    const year = base.getFullYear();
    const monthIdx = base.getMonth();
    const ym = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const day = (seed % 27) + 1;
    const preview = seed % 4 === 0;
    out.push({
      kb,
      title: `${ym} Cumulative Update${preview ? ' Preview' : ''} for Windows 11, version 25H2 for x64-based Systems`,
      build: `${maj}.${min}`,
      releaseDate: `${WD[base.getDay()]}, ${MO[monthIdx]} ${day}, ${year}`,
      severity: SEVS[seed % 3],
    });
  }
  return out;
}

function buildTrees() {
  const nodeMap = new Map<string, SNode>();
  const build = (patch: ChainPatch, id: string, dir: 'up' | 'down', depth: number): SNode => {
    const children = childPatches(patch, dir, depth).map((c, i) => build(c, `${id}.${i}`, dir, depth + 1));
    const n: SNode = { id, patch, children };
    nodeMap.set(id, n);
    return n;
  };
  const downRoots = SUPERSEDES.map((p, i) => build(p, `sup-${i}`, 'down', 1));
  const upRoots = SUPERSEDED_BY.map((p, i) => build(p, `by-${i}`, 'up', 1));
  return { upRoots, downRoots, nodeMap };
}

function descendantIds(node: SNode): string[] {
  const ids: string[] = [];
  const walk = (n: SNode) => n.children.forEach((c) => { ids.push(c.id); walk(c); });
  walk(node);
  return ids;
}

/** Tidy-tree layout for one direction: leaves take sequential slots, parents center over their
 *  (visible) children; depth drives the y. Returns the visible nodes with positions. */
interface Placed { node: SNode; x: number; y: number; depth: number; parentId: string }
function layoutDir(roots: SNode[], expanded: Set<string>, dir: 'up' | 'down'): Placed[] {
  const out: Placed[] = [];
  const level = dir === 'down' ? LEVEL_GAP : -LEVEL_GAP;
  const baseY = dir === 'down' ? ROW_BOT : ROW_TOP;
  let slot = 0;
  const place = (node: SNode, depth: number, parentId: string): number => {
    const kids = expanded.has(node.id) ? node.children : [];
    let x: number;
    if (!kids.length) { x = slot * GAP_X; slot++; }
    else {
      const kx = kids.map((k) => place(k, depth + 1, node.id));
      x = (kx[0] + kx[kx.length - 1]) / 2;
    }
    out.push({ node, x, y: baseY + (depth - 1) * level, depth, parentId });
    return x;
  };
  roots.forEach((r) => place(r, 1, 'center'));
  if (out.length) {
    const xs = out.map((o) => o.x);
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    out.forEach((o) => { o.x -= mid; });
  }
  return out;
}

/* -------------------- custom nodes -------------------- */

type ItemData = { patch: ChainPatch; dim: boolean; color: string; childCount: number; expanded: boolean; onToggle: (id: string) => void };

function PatchItemNode({ id, data }: NodeProps) {
  const { patch: p, dim, color, childCount, expanded, onToggle } = data as ItemData;
  const hasKids = childCount > 0;
  const toggle = (e: React.MouseEvent) => { e.stopPropagation(); onToggle(id); };
  return (
    <div className="relative transition-opacity" style={{ width: CARD_W, opacity: dim ? 0.35 : 1 }}>
      {/* NOTE: expansion is handled by the canvas-level onNodeClick (React Flow only grants nodes
          pointer events when such a handler exists) — no card-level onClick, or it would fire twice.
          The rich hover card is rendered by the graph in screen space (CMDB map pattern). */}
      <div
        className={`flex items-center gap-2.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-[#3D8BD0] ${hasKids ? 'cursor-pointer' : ''}`}
      >
        {/* Direction-colored icon badge (green = newer, gray = older) */}
        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg text-white [&_svg]:size-[18px]" style={{ backgroundColor: color }}>
          <Package />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[12px] font-semibold text-[#3D8BD0]">{p.kb}</div>
          <div className="truncate text-[11px] text-[#64748B]">{shortTitle(p.title)}</div>
          <div className="truncate text-[10px] text-[#94A3B8]">{p.build}</div>
        </div>
      </div>
      {/* Count badge → expand; minus badge → collapse (same affordance as the CMDB map) */}
      {hasKids && (
        <button
          onClick={toggle}
          title={expanded ? 'Collapse' : `Expand ${childCount} version${childCount > 1 ? 's' : ''}`}
          className={`absolute -right-2 -top-2 flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white transition-colors ${expanded ? 'bg-[#64748B] hover:bg-[#475569]' : 'bg-[#334155] hover:bg-[#1E293B]'}`}
        >
          {expanded ? <Minus size={12} strokeWidth={2.75} /> : childCount}
        </button>
      )}
      <Handle type="target" position={Position.Top} className={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

function PatchCenterNode({ data }: NodeProps) {
  const { name, id } = data as { name: string; id?: string };
  return (
    <div style={{ width: CARD_W }}>
      {/* Current patch — same card, distinguished by a blue accent */}
      <div className="flex items-center gap-2.5 rounded-lg border-2 border-[#3D8BD0] bg-[#F5FAFF] px-3 py-2.5 shadow-[0_2px_8px_rgba(61,139,208,0.18)]">
        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#3D8BD0] text-white [&_svg]:size-[18px]">
          <Package />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[12px] font-semibold text-[#364658]">{name || 'This patch'}</div>
          {id && <div className="truncate text-[11px] font-medium text-[#94A3B8]">{id}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
      <Handle type="target" position={Position.Top} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

function BusLabelNode({ data }: NodeProps) {
  const { label, tip } = data as { label: string; tip?: string };
  // The wrapper stays click-transparent for the canvas; the PILL re-enables pointer events so
  // hovering anywhere on it (not just the info icon) shows the tooltip. The pill is small, so
  // the pan/drag surface it costs is negligible.
  const pill = (
    <span className={`flex items-center gap-1 whitespace-nowrap rounded-full border border-[#DCE3EC] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#64748B] shadow-sm ${tip ? 'pointer-events-auto cursor-help' : ''}`}>
      {label}
      {tip && <span className="inline-flex text-[#9CA3AF] transition-colors"><Info size={11} /></span>}
    </span>
  );
  return (
    <div className="pointer-events-none flex w-[140px] justify-center">
      {tip ? (
        <Tooltip>
          <TooltipTrigger asChild>{pill}</TooltipTrigger>
          {/* text-wrap overrides the base tooltip's text-balance, which would split the text
              into equal short lines and leave the right half of the max-width box empty. */}
          <TooltipContent side="top" className="max-w-[280px] text-wrap">{tip}</TooltipContent>
        </Tooltip>
      ) : pill}
    </div>
  );
}

const nodeTypes = { patchCenter: PatchCenterNode, patchItem: PatchItemNode, busLabel: BusLabelNode };

/* -------------------- custom edge (rounded elbow, both directions) -------------------- */

function ElbowEdge({ id, source, target, data }: EdgeProps) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t) return null;
  const sw = s.measured.width ?? CARD_W, sh = s.measured.height ?? CARD_H;
  const tw = t.measured.width ?? CARD_W, th = t.measured.height ?? CARD_H;
  const scx = s.internals.positionAbsolute.x + sw / 2;
  const tcx = t.internals.positionAbsolute.x + tw / 2;
  const d = data as { dir?: 'up' | 'down'; dim?: boolean } | undefined;
  let path: string;
  if (d?.dir === 'up') {
    // parent BOTTOM-of-tree (above) → child BOTTOM (child sits higher)
    const sY = s.internals.positionAbsolute.y;
    const tY = t.internals.positionAbsolute.y + th;
    [path] = getSmoothStepPath({ sourceX: scx, sourceY: sY, sourcePosition: Position.Top, targetX: tcx, targetY: tY, targetPosition: Position.Bottom, borderRadius: 16 });
  } else {
    // parent BOTTOM → child TOP (child sits lower)
    const sY = s.internals.positionAbsolute.y + sh;
    const tY = t.internals.positionAbsolute.y;
    [path] = getSmoothStepPath({ sourceX: scx, sourceY: sY, sourcePosition: Position.Bottom, targetX: tcx, targetY: tY, targetPosition: Position.Top, borderRadius: 16 });
  }
  return <BaseEdge id={id} path={path} style={{ stroke: '#CBD5E1', strokeWidth: 1.5, opacity: d?.dim ? 0.15 : 1, transition: 'opacity 0.2s' }} />;
}

const edgeTypes = { elbow: ElbowEdge };

/* -------------------- canvas controls (shortcuts / zoom / fit / d-pad) -------------------- */

/* Small keycap chip used by the shortcuts popup (same design as the CMDB map). */
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

function CanvasControls() {
  const rf = useReactFlow();
  const [showKeys, setShowKeys] = useState(false);
  const panBy = (dx: number, dy: number) => {
    const vp = rf.getViewport();
    rf.setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration: 150 });
  };
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  return (
    <>
      {/* Top-right: keyboard shortcuts · fit & center · zoom in/out */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
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
                <ShortcutRow keys={<Kbd>E</Kbd>} label="Expand / collapse all" />
                <ShortcutRow keys={<Kbd>R</Kbd>} label="Reset layout" />
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>Shift</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Toggle fullscreen" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Search</div>
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Focus search" />
                <ShortcutRow keys={<Kbd>Escape</Kbd>} label="Clear search" />
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Bottom-left: directional pan (same mapping as the CMDB map) */}
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
    </>
  );
}

/* -------------------- graph (uses hooks) -------------------- */

interface PatchSupersededTabProps {
  patchId?: string;
  patchName?: string;
}

function SupersededGraph({ patchId, patchName, q, expandAllSignal, collapseAllSignal, fitSignal, onReset }: PatchSupersededTabProps & { q: string; expandAllSignal: number; collapseAllSignal: number; fitSignal: number; onReset?: () => void }) {
  const rf = useReactFlow();
  const { upRoots, downRoots, nodeMap } = useMemo(() => buildTrees(), []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Bump `n` on every toggle to (re)frame the affected subtree once the new nodes are laid out.
  const [focus, setFocus] = useState<{ ids: string[]; n: number }>({ ids: [], n: 0 });

  // Toolbar signals (all start at 0 = ignore; each press increments).
  useEffect(() => {
    if (!expandAllSignal) return;
    const all = new Set<string>();
    nodeMap.forEach((n, id) => { if (n.children.length) all.add(id); });
    setExpanded(all);
    const t = setTimeout(() => rf.fitView({ padding: 0.15, duration: 500 }), 150);
    return () => clearTimeout(t);
  }, [expandAllSignal, nodeMap, rf]);
  useEffect(() => {
    if (!collapseAllSignal) return;
    setExpanded(new Set());
    const t = setTimeout(() => rf.fitView({ padding: 0.25, duration: 500 }), 150);
    return () => clearTimeout(t);
  }, [collapseAllSignal, rf]);
  // Re-fit after the canvas RESIZES (fullscreen toggle) — React Flow doesn't do this on its own.
  useEffect(() => {
    if (!fitSignal) return;
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 100);
    return () => clearTimeout(t);
  }, [fitSignal, rf]);

  const toggleRef = useRef<(id: string) => void>(() => {});
  toggleRef.current = (id: string) => {
    const node = nodeMap.get(id);
    const isOpen = expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) { next.delete(id); if (node) descendantIds(node).forEach((d) => next.delete(d)); }
      else next.add(id);
      return next;
    });
    setFocus((f) => ({ ids: isOpen ? [id] : [id, ...(node?.children.map((c) => c.id) ?? [])], n: f.n + 1 }));
  };

  const matches = (p: ChainPatch) =>
    !q || p.kb.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.build.includes(q);

  /* Rich node hover card — same pattern as the CMDB Dependency Map: 550ms delay, rendered in
   * SCREEN space over the canvas (crisp at any zoom), flips below top nodes, clamps horizontally,
   * and survives the pointer travelling into it. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hoverCard, setHoverCard] = useState<{ left: number; top: number; placement: 'above' | 'below'; arrowLeft: number; yTop: number; yBot: number; patch: ChainPatch; color: string } | null>(null);
  const HOVER_W = 248;
  const HOVER_GAP = 12, HOVER_PAD = 8;
  const showHoverCard = (node: Node) => {
    const d = node.data as { patch?: ChainPatch; color?: string };
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!d.patch || !rect) return;
    const w = (node.measured?.width as number | undefined) ?? CARD_W;
    const h = (node.measured?.height as number | undefined) ?? CARD_H;
    // Node top-centre and bottom-centre in canvas-local coordinates.
    const topPt = rf.flowToScreenPosition({ x: node.position.x + w / 2, y: node.position.y });
    const botPt = rf.flowToScreenPosition({ x: node.position.x + w / 2, y: node.position.y + h });
    const cx = topPt.x - rect.left;
    const yTop = topPt.y - rect.top;
    const yBot = botPt.y - rect.top;
    // First-pass estimate — the long wrapped titles make the real height vary a lot, so a
    // layout effect re-measures the rendered card and corrects top/placement before paint.
    const cardH = 121 + Math.max(1, Math.ceil(d.patch.title.length / 26)) * 17;
    const placement: 'above' | 'below' = yTop - HOVER_GAP - cardH < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? yTop - HOVER_GAP - cardH : yBot + HOVER_GAP;
    let left = cx - HOVER_W / 2;
    left = Math.max(HOVER_PAD, Math.min(left, rect.width - HOVER_W - HOVER_PAD));
    const arrowLeft = Math.max(14, Math.min(cx - left, HOVER_W - 14));
    setHoverCard({ left, top, placement, arrowLeft, yTop, yBot, patch: d.patch, color: d.color ?? OLDER_COLOR });
  };
  // Correct the card position with its REAL rendered height (runs before paint — no flicker).
  // Converges in one pass: once top/placement match the measured height, no further update fires.
  useLayoutEffect(() => {
    if (!hoverCard || !cardRef.current) return;
    const hReal = cardRef.current.offsetHeight;
    const placement: 'above' | 'below' = hoverCard.yTop - HOVER_GAP - hReal < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? hoverCard.yTop - HOVER_GAP - hReal : hoverCard.yBot + HOVER_GAP;
    if (Math.abs(top - hoverCard.top) > 1 || placement !== hoverCard.placement) {
      setHoverCard({ ...hoverCard, top, placement });
    }
  }, [hoverCard]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({ id: 'center', type: 'patchCenter', position: { x: -HALF_W, y: ROW_MID - HALF_H }, data: { name: patchName ?? '', id: patchId }, draggable: false, selectable: false });
    if (upRoots.length) nodes.push({ id: 'bus-top', type: 'busLabel', position: { x: -70, y: BUS_TOP - 11 }, data: { label: 'Superseded by', tip: 'Newer patches that replace this patch. Expand a node to trace the chain further.' }, draggable: false, selectable: false, className: 'pointer-events-none' });
    if (downRoots.length) nodes.push({ id: 'bus-bot', type: 'busLabel', position: { x: -70, y: BUS_BOT - 11 }, data: { label: 'Superseded', tip: 'Older patches that this patch replaces. Expand a node to trace the chain further.' }, draggable: false, selectable: false, className: 'pointer-events-none' });

    const emit = (list: Placed[], dir: 'up' | 'down') => {
      const color = dir === 'down' ? OLDER_COLOR : NEWER_COLOR;
      list.forEach((o) => {
        const dim = q ? !matches(o.node.patch) : false;
        nodes.push({
          id: o.node.id,
          type: 'patchItem',
          position: { x: o.x - HALF_W, y: o.y - HALF_H },
          data: { patch: o.node.patch, dim, color, childCount: o.node.children.length, expanded: expanded.has(o.node.id), onToggle: (nid: string) => toggleRef.current(nid) },
          draggable: false,
          selectable: false,
        });
        edges.push({ id: `e-${o.node.id}`, source: o.parentId, target: o.node.id, type: 'elbow', data: { dir, dim } });
      });
    };
    emit(layoutDir(downRoots, expanded, 'down'), 'down');
    emit(layoutDir(upRoots, expanded, 'up'), 'up');

    return { initialNodes: nodes, initialEdges: edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upRoots, downRoots, expanded, q, patchId, patchName]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges); }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Reframe onto the toggled node + its new children once they've been laid out.
  useEffect(() => {
    if (focus.n === 0) return;
    const t = setTimeout(() => {
      const ids = focus.ids.filter(Boolean).map((id) => ({ id }));
      if (ids.length) rf.fitView({ nodes: ids, padding: 0.35, duration: 500, minZoom: 0.6, maxZoom: 1.15 });
    }, 150);
    return () => clearTimeout(t);
  }, [focus.n, rf]);

  // Canvas keyboard shortcuts (active once the canvas has focus — same as the CMDB map):
  // arrows pan, +/− zoom, F fits & centers, R resets the layout, Escape hides the hover card.
  const panBy = (dx: number, dy: number) => {
    const vp = rf.getViewport();
    rf.setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration: 0 });
  };
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
      panBy(m[0], m[1]);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      rf.zoomIn({ duration: 150 });
    } else if (e.key === '-') {
      e.preventDefault();
      rf.zoomOut({ duration: 150 });
    } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      rf.fitView({ padding: 0.2, duration: 300 });
    } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      // Reset layout: collapse everything, back to the tidy two-row default.
      e.preventDefault();
      setExpanded(new Set());
      onReset?.();
      setTimeout(() => rf.fitView({ padding: 0.25, duration: 300 }), 60);
    } else if (e.key === 'Escape') {
      setHoverCard(null);
    }
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full outline-none" tabIndex={0} onKeyDown={onKeyDown}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      // Registering onNodeClick is what gives the (non-draggable, non-selectable) nodes pointer
      // events in React Flow v12 — without it every node is click-transparent.
      // Click behavior mirrors the CMDB map: a collapsed node EXPANDS (and the camera frames the
      // new children); an expanded (or leaf) node just zooms in and centers — it never collapses.
      // Collapse happens ONLY via the minus badge.
      onNodeClick={(_, node) => {
        if (node.type !== 'patchItem') return;
        clearTimeout(hoverTimer.current);
        setHoverCard(null);
        const n = nodeMap.get(node.id);
        if (!n) return;
        if (n.children.length && !expanded.has(node.id)) {
          toggleRef.current(node.id);
        } else {
          const kids = expanded.has(node.id) ? n.children.map((c) => ({ id: c.id })) : [];
          rf.fitView({ nodes: [{ id: node.id }, ...kids], padding: 0.35, duration: 500, minZoom: 0.85, maxZoom: 1.15 });
        }
      }}
      onNodeMouseEnter={(_, node) => {
        if (node.type !== 'patchItem') return;
        clearTimeout(hoverTimer.current);
        clearTimeout(hideTimer.current);
        hoverTimer.current = setTimeout(() => showHoverCard(node), 550);
      }}
      onNodeMouseLeave={() => {
        clearTimeout(hoverTimer.current);
        // Grace period so the pointer can travel INTO the card.
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setHoverCard(null), 220);
      }}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={1.75}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#DCE3EC" bgColor="#FAFBFC" />
      <CanvasControls />
    </ReactFlow>
    {/* Rich node hover card — screen-space so it stays crisp at any zoom (CMDB map design) */}
    {hoverCard && (
      <div
        ref={cardRef}
        className="absolute z-30"
        style={{ left: hoverCard.left, top: hoverCard.top, width: HOVER_W }}
        onMouseEnter={() => clearTimeout(hideTimer.current)}
        onMouseLeave={() => setHoverCard(null)}
      >
        {/* Pointer above the card when the card sits BELOW the node */}
        {hoverCard.placement === 'below' && (
          <div className="absolute size-2.5 rotate-45 border-t border-l border-[#E5E7EB] bg-white" style={{ left: hoverCard.arrowLeft - 5, top: -5 }} />
        )}
        <div className="w-[248px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-md text-white [&_svg]:size-3.5" style={{ backgroundColor: hoverCard.color }}>
              <Package />
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{hoverCard.patch.kb}</span>
              <span className="w-full break-words text-[12.5px] font-semibold leading-snug text-[#364658]">{hoverCard.patch.title}</span>
            </div>
          </div>
          <div className="mt-2 space-y-1.5 border-t border-[#F0F1F3] pt-2">
            {[
              { label: 'Build', value: hoverCard.patch.build },
              { label: 'Severity', value: hoverCard.patch.severity, dot: severityColor(hoverCard.patch.severity) },
              { label: 'Released', value: hoverCard.patch.releaseDate },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 text-[11.5px]">
                <span className="flex-shrink-0 text-[#7B8FA5]">{r.label}</span>
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-[#364658]">
                  {r.dot && <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: r.dot }} />}
                  <span className="truncate">{r.value}</span>
                </span>
              </div>
            ))}
          </div>
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

export function PatchSupersededTab({ patchId, patchName }: PatchSupersededTabProps) {
  useShortcutContext('superseded-map');
  const [search, setSearch] = useState('');
  // Expand/collapse-all signals + fullscreen (same pattern as the CMDB map toolbar).
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [collapseKey, setCollapseKey] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const q = search.trim().toLowerCase();
  const hasAny = SUPERSEDES.length > 0 || SUPERSEDED_BY.length > 0;

  // Tab-level hotkeys (this component only mounts while the Superseded tab is active):
  // Ctrl+F focuses the node search (Esc in the field clears it), Ctrl+Shift+F toggles
  // fullscreen, E toggles expand/collapse-all — same set as the CMDB Dependency Map.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFull((v) => !v);
        setFitKey((k) => k + 1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (inField) return;
      if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setAllExpanded((was) => {
          if (was) setCollapseKey((k) => k + 1); else setExpandKey((k) => k + 1);
          return !was;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!hasAny) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
          <Layers className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[14px] font-medium text-[#364658]">No supersedence</p>
        <p className="mt-1 text-[13px] text-[#7B8FA5]">This patch neither replaces nor is replaced by another patch.</p>
      </div>
    );
  }

  return (
    // Fullscreen = the same toolbar + canvas promoted to a fixed overlay (CMDB map pattern).
    <div className={isFull ? 'fixed inset-0 z-[10000] flex flex-col bg-white' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}>
      {/* Toolbar — node search left, canvas actions right (outside the canvas) */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-6 py-3">
        <div className="relative w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearch(''); e.currentTarget.blur(); } }}
            placeholder="Search...   Ctrl + F | Esc to clear"
            className="h-8 w-full rounded border border-[#DFE5ED] pl-9 pr-8 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Expand all / Collapse all */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (allExpanded) { setCollapseKey((k) => k + 1); setAllExpanded(false); }
                  else { setExpandKey((k) => k + 1); setAllExpanded(true); }
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white hover:bg-[#F5F7FA]"
              >
                {allExpanded ? <ChevronsDownUp size={15} className="text-[#6b7280]" /> : <ChevronsUpDown size={15} className="text-[#6b7280]" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{allExpanded ? 'Collapse all' : 'Expand all'}</TooltipContent>
          </Tooltip>
          {/* Full screen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setIsFull((v) => !v); setFitKey((k) => k + 1); }}
                className={`inline-flex h-8 w-8 items-center justify-center rounded border transition-colors ${isFull ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#DFE5ED] bg-white text-[#6b7280] hover:bg-[#F5F7FA]'}`}
              >
                {isFull ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{isFull ? 'Exit full screen' : 'Full screen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#FAFBFC]">
        <ReactFlowProvider>
          <SupersededGraph patchId={patchId} patchName={patchName} q={q} expandAllSignal={expandKey} collapseAllSignal={collapseKey} fitSignal={fitKey} onReset={() => setAllExpanded(false)} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
