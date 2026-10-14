import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Diamond, ListChecks, Maximize, Minus, Plus, RotateCcw,
  Search, Waypoints, X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';

/* Local copies of the plan palettes/format — a runtime import back into
   ProjectPlanningTab would be circular. */
const DEP_STATUS_DOT: Record<string, string> = { Open: '#3D8BD0', 'In Progress': '#6366F1', Pending: '#fb923c', Closed: '#22A06B' };
const DEP_PRIORITY_DOT: Record<string, string> = { Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Urgent: '#DC2626' };
const depFmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const DEP_AVATAR_COLORS = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
const depAvatarColor = (name: string) => DEP_AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % DEP_AVATAR_COLORS.length];
const depInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

/* Map a plan item onto the Patch shape the Task detail drawer expects — the same
   recipe as TasksListPage's taskToPatchShape, so the ↗ on the hover card opens
   the real Task detail page as a drawer tab. (Also used by ProjectGanttView.) */
export const planItemToTaskPatch = (it: PlanItem) =>
  ({
    id: it.id,
    name: it.name,
    severity: (it.priority === 'Urgent' ? 'Critical' : it.priority) as Patch['severity'],
    releaseDate: depFmtD(it.start),
    missingSystem: null,
    installedSystem: null,
    rebootRequired: 'No',
    approvalStatus: 'Approved',
    category: 'Implementation',
    task: {
      status: it.status,
      priority: it.priority,
      taskType: 'Implementation',
      assignee: it.assignee ?? 'Unassigned',
      reference: null,
      dueDate: depFmtD(it.end),
    },
  }) as unknown as Patch;
import { toast } from 'sonner';
import type { PlanItem } from './ProjectPlanningTab';

/* ── Plan dependencies ───────────────────────────────────────────────────────
   Two pieces for the Planning tab:
   1. DepPickerPanel — right-side popup: pick tasks this one depends on
      (predecessors) or that depend on it (successors).
   2. DepGraphModal — center popup: the dependency neighbourhood as a React
      Flow graph (Superseded-map recipe: card nodes, smoothstep arrows). */

/* ── 1. The picker ── */
export function DepPickerPanel({
  task,
  dir,
  candidates,
  existing,
  onClose,
  onApply,
}: {
  task: PlanItem;
  dir: 'pred' | 'succ';
  candidates: PlanItem[];
  existing: Set<string>;
  onClose: () => void;
  /** Apply the edit: newly ticked ids to link, unticked linked ids to remove. */
  onApply: (addIds: string[], removeIds: string[]) => void;
}) {
  const [q, setQ] = useState('');
  // Linked rows start CHECKED — unticking one removes that dependency on Apply.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(existing));
  const label = dir === 'pred' ? 'Predecessors' : 'Successors';
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return candidates.filter((c) => !s || c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s));
  }, [candidates, q]);

  const adds = [...checked].filter((id) => !existing.has(id));
  const removes = [...existing].filter((id) => !checked.has(id));
  const submit = () => {
    if (!adds.length && !removes.length) return;
    onApply(adds, removes);
    const word = dir === 'pred' ? 'predecessor' : 'successor';
    if (adds.length && removes.length) toast.success(`${task.id}: ${adds.length} ${word}${adds.length > 1 ? 's' : ''} added, ${removes.length} removed`);
    else if (adds.length) toast.success(`${adds.length} ${word}${adds.length > 1 ? 's' : ''} linked to ${task.id}`);
    else toast.success(`${removes.length} ${word}${removes.length > 1 ? 's' : ''} removed from ${task.id}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10001] flex h-full w-[620px] max-w-[94vw] flex-col bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[#111827]">Add Dependency — {label}</h2>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-[#7B8FA5]">
              <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{task.id}</span>
              <span className="truncate">{task.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-shrink-0 border-b border-[#F1F5F9] px-5 py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded border border-[#DFE5ED] bg-white py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 py-10">
              <div className="text-center">
                <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
                  <Search className="size-7 text-[#7B8FA5]" />
                </div>
                <p className="text-[13px] text-[#7B8FA5]">No matching tasks.</p>
              </div>
            </div>
          ) : (
            rows.map((c) => {
              const linked = existing.has(c.id);
              const isChecked = checked.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded px-3 py-2 transition-colors ${
                    isChecked ? 'bg-[#F5FAFF]' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setChecked((prev) => {
                        const n = new Set(prev);
                        n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                        return n;
                      })
                    }
                    className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                  <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{c.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.name}</span>
                  {linked && (
                    <span className="flex-shrink-0 rounded-sm bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">Linked</span>
                  )}
                </label>
              );
            })
          )}
        </div>
        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5 py-3.5">
          <span className={`text-[12px] ${adds.length || removes.length ? 'font-medium text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>
            {adds.length || removes.length
              ? [adds.length ? `${adds.length} to add` : '', removes.length ? `${removes.length} to remove` : ''].filter(Boolean).join(' · ')
              : 'No changes yet'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!adds.length && !removes.length}
              className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removes.length ? 'Update' : `Add${adds.length ? ` (${adds.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 2. The graph ── */
type DepNodeData = {
  rid: string;
  name: string;
  center: boolean;
  kind: PlanItem['kind'];
  item: PlanItem;
  onHover: (item: PlanItem, rect: DOMRect) => void;
  onLeave: () => void;
  /** Set on dependency nodes only (never the center task) — detaches the link. */
  onRemove?: () => void;
};

function DepNode({ data }: NodeProps) {
  const d = data as DepNodeData;
  return (
    <div
      onMouseEnter={(e) => d.onHover(d.item, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={d.onLeave}
      className={`group relative w-[220px] rounded-lg border bg-white px-3 py-2.5 shadow-sm transition-[border-color,box-shadow] ${
        d.center
          ? 'border-[#3D8BD0] shadow-[0_0_0_3px_rgba(61,139,208,0.14)]'
          : 'border-[#DFE5ED] hover:border-[#9CC3E8] hover:shadow-[0_0_0_3px_rgba(61,139,208,0.10)]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-transparent" />
      {/* Hover-reveal remove badge — the Relationship-map corner-badge recipe. */}
      {d.onRemove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); d.onRemove?.(); }}
              className="absolute -right-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#94A3B8] opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            >
              <X size={11} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove dependency</TooltipContent>
        </Tooltip>
      )}
      <div className="flex items-center gap-2.5">
        <span className={`flex size-7 flex-shrink-0 items-center justify-center rounded-md ${d.kind === 'milestone' ? 'bg-[#FEF3C7]' : 'bg-[#EAF2FB]'}`}>
          {d.kind === 'milestone' ? (
            <Diamond size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
          ) : (
            <ListChecks size={14} className="text-[#3D8BD0]" />
          )}
        </span>
        <div className="min-w-0">
          {/* Plain gray id — the calendar-tooltip treatment, not a pill. */}
          <div className="text-[10px] font-medium text-[#64748B]">{d.rid}</div>
          <div className="mt-0.5 truncate text-[11px] font-medium leading-snug text-[#364658]">{d.name}</div>
        </div>
      </div>
    </div>
  );
}
const depNodeTypes = { dep: DepNode };

/* Canvas controls — same cards/positions as the Deployment Configuration popup:
 * top-right [fit] · [+/−] · [reset], bottom-left d-pad. Keyboard shortcuts ride
 * along (Relationship-map keys): arrows pan, +/− zoom, F fit, R reset view,
 * Esc closes. The modal is a full overlay with no text inputs, so a
 * document-level listener works without click-to-focus. */
function DepCanvasControls({ onEscape }: { onEscape?: () => void }) {
  const rf = useReactFlow();
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const card = 'flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const panBy = (dx: number, dy: number) => {
    const v = rf.getViewport();
    rf.setViewport({ ...v, x: v.x + dx, y: v.y + dy }, { duration: 120 });
  };
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const step = 48;
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        const v = rf.getViewport();
        rf.setViewport({ ...v, x: v.x + m[0], y: v.y + m[1] }, { duration: 120 });
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        rf.zoomIn({ duration: 150 });
      } else if (e.key === '-') {
        e.preventDefault();
        rf.zoomOut({ duration: 150 });
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rf.fitView({ padding: 0.3, duration: 300 });
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rf.fitView({ padding: 0.3, duration: 300 });
      } else if (e.key === 'Escape') {
        onEscapeRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rf]);
  return (
    <>
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.3, duration: 300 })} className={btn}><Maximize size={13} /></button></TooltipTrigger><TooltipContent side="left">Fit &amp; center (F)</TooltipContent></Tooltip>
        </div>
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom in (+)</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom out (−)</TooltipContent></Tooltip>
        </div>
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.3, duration: 300 })} className={btn}><RotateCcw size={13} /></button></TooltipTrigger><TooltipContent side="left">Reset view (R)</TooltipContent></Tooltip>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild><button onClick={() => panBy(0, -40)} className={padBtn}><ArrowUp size={14} /></button></TooltipTrigger>
          <TooltipContent side="top">Move up (↑)</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(-40, 0)} className={padBtn}><ArrowLeft size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move left (←)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(0, 40)} className={padBtn}><ArrowDown size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move down (↓)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(40, 0)} className={padBtn}><ArrowRight size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move right (→)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

export function DepGraphModal({
  task,
  preds,
  succs,
  onClose,
  onRemove,
}: {
  task: PlanItem;
  preds: PlanItem[];
  succs: PlanItem[];
  onClose: () => void;
  /** Detach a dependency from the map: id + which side of the task it sits on. */
  onRemove: (id: string, dir: 'pred' | 'succ') => void;
}) {
  /* Superseded-map hover recipe: 550ms delay, card positioned ABSOLUTE inside
     the canvas wrapper. ⚠️ NOT `fixed` — the centered modal panel carries a
     `-translate-x/y-1/2` transform, and a transformed ancestor re-bases fixed
     descendants, which landed the card far from the node. Flips below near the
     top edge, clamps horizontally, real height corrected pre-paint. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const HOVER_W = 290;
  const HOVER_GAP = 12, HOVER_PAD = 8;
  const [hover, setHover] = useState<{
    item: PlanItem; left: number; top: number; placement: 'above' | 'below'; arrowLeft: number; yTop: number; yBot: number;
  } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Node-hover edge animation (Relationship-map pattern): the hovered node's
     connected lines flow as animated blue dashes, the rest fade back. */
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const { open: openInStack } = useDrawerStack();
  const openTask = (it: PlanItem) => {
    setHover(null);
    onClose();
    openInStack('tasks', it.id, it.name, planItemToTaskPatch(it));
  };
  // Ref indirection so the node data (captured once in the memo) always calls
  // the parent's LATEST handler; hover state clears since the node vanishes.
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;
  const removeDep = (id: string, dir: 'pred' | 'succ') => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(null);
    setHoverNodeId(null);
    onRemoveRef.current(id, dir);
  };
  const onNodeHover = (item: PlanItem, rect: DOMRect) => {
    setHoverNodeId(item.id); // edges light up instantly — only the card is delayed
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hoverTimer.current = setTimeout(() => {
      const wrap = wrapRef.current?.getBoundingClientRect();
      if (!wrap) return;
      const cx = rect.left + rect.width / 2 - wrap.left;
      const yTop = rect.top - wrap.top;
      const yBot = rect.bottom - wrap.top;
      const estH = 190; // first pass — the layout effect re-measures before paint
      const placement: 'above' | 'below' = yTop - HOVER_GAP - estH < HOVER_PAD ? 'below' : 'above';
      const top = placement === 'above' ? yTop - HOVER_GAP - estH : yBot + HOVER_GAP;
      let left = cx - HOVER_W / 2;
      left = Math.max(HOVER_PAD, Math.min(left, wrap.width - HOVER_W - HOVER_PAD));
      const arrowLeft = Math.max(14, Math.min(cx - left, HOVER_W - 14));
      setHover({ item, left, top, placement, arrowLeft, yTop, yBot });
    }, 550);
  };
  const onNodeLeave = () => {
    setHoverNodeId(null);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Grace period so the pointer can travel INTO the card (Superseded pattern).
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHover(null), 220);
  };
  // Correct with the REAL rendered height (runs before paint — no flicker;
  // converges in one pass once top/placement match the measured height).
  useLayoutEffect(() => {
    if (!hover || !cardRef.current) return;
    const hReal = cardRef.current.offsetHeight;
    const placement: 'above' | 'below' = hover.yTop - HOVER_GAP - hReal < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? hover.yTop - HOVER_GAP - hReal : hover.yBot + HOVER_GAP;
    if (Math.abs(top - hover.top) > 1 || placement !== hover.placement) setHover({ ...hover, top, placement });
  }, [hover]);

  const { nodes, edges } = useMemo(() => {
    // Vertical tiers (Superseded-map orientation): predecessors on top, the
    // task centered, successors below; siblings spread out horizontally.
    const COL = 252;
    const TIER = 190;
    const colX = (n: number, i: number) => (i - (n - 1) / 2) * COL;
    const mk = (it: PlanItem, x: number, y: number, center = false, dir?: 'pred' | 'succ'): Node => ({
      id: it.id,
      type: 'dep',
      position: { x, y },
      draggable: false,
      selectable: false,
      data: {
        rid: it.id, name: it.name, center, kind: it.kind, item: it,
        onHover: onNodeHover, onLeave: onNodeLeave,
        onRemove: dir ? () => removeDep(it.id, dir) : undefined,
      } satisfies DepNodeData,
    });
    const nodes: Node[] = [
      ...preds.map((p, i) => mk(p, colX(preds.length, i), 0, false, 'pred')),
      mk(task, 0, TIER, true),
      ...succs.map((p, i) => mk(p, colX(succs.length, i), TIER * 2, false, 'succ')),
    ];
    const edges: Edge[] = [
      ...preds.map((p) => ({
        id: `e-${p.id}-${task.id}`,
        source: p.id,
        target: task.id,
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 16, height: 16 },
      })),
      ...succs.map((p) => ({
        id: `e-${task.id}-${p.id}`,
        source: task.id,
        target: p.id,
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 16, height: 16 },
      })),
    ];
    return { nodes, edges };
  }, [task, preds, succs]);

  // Hovered node (or its open card) → connected edges animate as blue dashed
  // flow; the others fade back so the neighbourhood reads at a glance.
  const litId = hoverNodeId ?? hover?.item.id ?? null;
  const displayEdges = useMemo(() => {
    if (!litId) return edges;
    return edges.map((e) =>
      e.source === litId || e.target === litId
        ? {
            ...e,
            animated: true,
            style: { stroke: '#3D8BD0', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3D8BD0', width: 16, height: 16 },
          }
        : {
            ...e,
            style: { stroke: '#D9E1EA', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#D9E1EA', width: 16, height: 16 },
          },
    );
  }, [edges, litId]);

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[10001] flex h-[660px] max-h-[92vh] w-[1120px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#E5E7EB] px-5 py-3.5">
          <Waypoints size={16} className="flex-shrink-0 text-[#3D8BD0]" />
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Dependencies</h2>
          <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{task.id}</span>
          <span className="min-w-0 truncate text-[13px] text-[#64748B]">{task.name}</span>
          <button
            onClick={onClose}
            className="ml-auto flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={18} />
          </button>
        </div>
        <div ref={wrapRef} className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={displayEdges}
              nodeTypes={depNodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              /* RF gotcha: without a canvas-level onNodeClick, non-draggable
                 non-selectable nodes get pointer-events:none — hover never fires. */
              onNodeClick={() => {}}
              proOptions={{ hideAttribution: true }}
              style={{ background: '#FAFBFC' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#E2E8F0" />
            </ReactFlow>
            {/* Esc closes the hover card first, then the modal. */}
            <DepCanvasControls
              onEscape={() => {
                if (hover) setHover(null);
                else onClose();
              }}
            />
          </ReactFlowProvider>
          {/* Direction legend — arrows tell the story; one quiet line each side. */}
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-4 rounded border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] text-[#64748B] shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-[#94A3B8]">↓</span>
              Predecessors flow in · Successors flow out
            </span>
          </div>
          {hover &&
            (() => {
              const it = hover.item;
              return (
                <div
                  ref={cardRef}
                  className="absolute z-[10002] w-[290px]"
                  style={{ left: hover.left, top: hover.top }}
                  onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
                  onMouseLeave={() => setHover(null)}
                >
                  {/* Pointer above the card when the card sits BELOW the node */}
                  {hover.placement === 'below' && (
                    <div className="absolute size-2.5 rotate-45 border-l border-t border-[#E5E7EB] bg-white" style={{ left: hover.arrowLeft - 5, top: -5 }} />
                  )}
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.16)]">
                  <div className="flex items-start gap-2.5">
                    <span className={`flex size-8 flex-shrink-0 items-center justify-center rounded-lg ${it.kind === 'milestone' ? 'bg-[#FEF3C7]' : 'bg-[#EAF2FB]'}`}>
                      {it.kind === 'milestone' ? (
                        <Diamond size={15} className="fill-[#F59E0B] text-[#F59E0B]" />
                      ) : (
                        <ListChecks size={15} className="text-[#3D8BD0]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Flex line box hugs the pill so its top sits flush with the icon badge. */}
                      <div className="flex items-center">
                        <span className="whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{it.id}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => openTask(it)}
                              className="ml-auto flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EAF2FB] hover:text-[#3D8BD0]"
                            >
                              <ArrowUpRight size={13} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Open task</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="mt-1 text-[13px] font-semibold leading-snug text-[#1E293B]">{it.name}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1.5 border-t border-[#F0F1F3] pt-2.5 text-[12px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7B8FA5]">Assignee</span>
                      <span className={`flex min-w-0 items-center gap-1.5 font-medium ${it.assignee ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>
                        {it.assignee && (
                          <span
                            className="flex size-4 flex-shrink-0 items-center justify-center rounded text-[8px] font-semibold text-white"
                            style={{ backgroundColor: depAvatarColor(it.assignee) }}
                          >
                            {depInitials(it.assignee)}
                          </span>
                        )}
                        <span className="truncate">{it.assignee ?? 'Unassigned'}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7B8FA5]">Status</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#364658]">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: DEP_STATUS_DOT[it.status] ?? '#94A3B8' }} />
                        {it.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7B8FA5]">Priority</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#364658]">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: DEP_PRIORITY_DOT[it.priority] ?? '#94A3B8' }} />
                        {it.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#7B8FA5]">{it.kind === 'milestone' ? 'Date' : 'Start – End'}</span>
                      <span className="font-medium text-[#364658]">
                        {it.kind === 'milestone' ? depFmtD(it.start) : `${depFmtD(it.start)} – ${depFmtD(it.end)}`}
                      </span>
                    </div>
                  </div>
                  </div>
                  {/* Pointer below the card when the card sits ABOVE the node */}
                  {hover.placement === 'above' && (
                    <div className="absolute size-2.5 rotate-45 border-b border-r border-[#E5E7EB] bg-white" style={{ left: hover.arrowLeft - 5, bottom: -5 }} />
                  )}
                </div>
              );
            })()}
        </div>
      </div>
    </>
  );
}
