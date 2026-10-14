/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Handle, Position, MarkerType, useReactFlow,
  type Node as RFNode, type Edge as RFEdge, type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ServerCog, Database, Server, Building2, Monitor, Globe, FolderOpen, X, CheckCircle2, XCircle, Loader2, Clock, Download,
  Maximize, Plus, Minus, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

/* Individual endpoint deployment-chain flow — opened from a Deployment row's "View Configuration".
 * A single linear path (ServiceOps → Main File Server → Distributed Server → Remote Office →
 * Endpoint) with the Internet source above the Main File Server, so the user can see EXACTLY
 * where this one endpoint's deployment is (delivered / in progress / yet to receive) and, on a
 * failure, which hop broke (red node border + red line — same treatment as the whole map). */

type ChainStatus = 'Success' | 'Failed' | 'In Progress' | 'Received' | 'Yet to Receive' | 'Pending' | 'Waiting' | 'Cancelled';

const STATUS_META: Record<ChainStatus, { color: string; icon: typeof Clock; spin?: boolean; label: string }> = {
  Success: { color: '#12B76A', icon: CheckCircle2, label: 'Success' },
  Failed: { color: '#F04438', icon: XCircle, label: 'Failed' },
  'In Progress': { color: '#F79009', icon: Loader2, spin: true, label: 'In Progress' },
  Received: { color: '#2E90FA', icon: Download, label: 'Received' },
  'Yet to Receive': { color: '#94A3B8', icon: Clock, label: 'Yet to Receive' },
  Pending: { color: '#94A3B8', icon: Clock, label: 'Pending' },
  Waiting: { color: '#94A3B8', icon: Clock, label: 'Waiting' },
  Cancelled: { color: '#94A3B8', icon: XCircle, label: 'Cancelled' },
};

const KIND = {
  serviceops: { icon: ServerCog, color: '#6366F1', label: 'ServiceOps Server' },
  mainfs: { icon: Database, color: '#3D8BD0', label: 'Main File Server' },
  ds: { icon: Server, color: '#8B5CF6', label: 'Distributed Server' },
  office: { icon: Building2, color: '#0EA5E9', label: 'Remote Office' },
  endpoint: { icon: Monitor, color: '#64748B', label: 'Endpoint' },
  internet: { icon: Globe, color: '#22C55E', label: 'Internet' },
  // Package flows: the external source is a network share, not the vendor CDN.
  shareddir: { icon: FolderOpen, color: '#22C55E', label: 'External Package Source' },
} as const;
type Kind = keyof typeof KIND;

// Deterministic remote-office / DS pick from the host name, so the same endpoint always maps to
// the same office (prototype — the real product knows the endpoint's assigned group).
const OFFICES: [string, string][] = [
  ['DS-1', 'Mumbai Office'], ['DS-2', 'Bengaluru Campus'], ['DS-3', 'Delhi NCR Office'],
  ['DS-4', 'Pune Development Center'], ['DS-5', 'Hyderabad Office'], ['DS-6', 'Chennai Office'],
];
const pickOffice = (host: string) => {
  const h = [...host].reduce((a, c) => a + c.charCodeAt(0), 0);
  return OFFICES[h % OFFICES.length];
};

const hiddenHandle = 'opacity-0 !pointer-events-none !w-1 !h-1 !min-w-0 !min-h-0 !border-0 !bg-transparent';

function ChainNode({ data }: NodeProps) {
  const d = data as unknown as { kind: Kind; name: string; sub?: string; status?: ChainStatus; red?: boolean };
  const k = KIND[d.kind];
  const st = d.status ? STATUS_META[d.status] : null;
  const Icon = k.icon;
  if (d.kind === 'internet' || d.kind === 'shareddir') {
    return (
      <div className="relative flex w-[188px] items-center gap-2.5 rounded-lg border border-[#D1E9D6] bg-white px-3 py-2.5 shadow-sm">
        <Handle type="source" position={Position.Bottom} id="b" className={hiddenHandle} />
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#22C55E1A', color: '#16A34A' }}><Icon size={16} /></span>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-[#364658]">{d.name}</div>
          {d.sub && <div className="truncate text-[10px] text-[#7B8FA5]">{d.sub}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={`relative w-[188px] rounded-lg border bg-white px-3 py-2.5 shadow-sm ${d.red ? 'border-[#F04438] ring-2 ring-[#F04438]/25' : 'border-[#E2E8F0]'}`}>
      <Handle type="target" position={Position.Left} id="l" className={hiddenHandle} />
      <Handle type="source" position={Position.Right} id="r" className={hiddenHandle} />
      <Handle type="target" position={Position.Top} id="t" className={hiddenHandle} />
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${k.color}1A`, color: k.color }}><Icon size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[#364658]">{d.name}</div>
          {d.sub && <div className="truncate text-[10px] text-[#7B8FA5]">{d.sub}</div>}
        </div>
      </div>
      {st && d.status && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <st.icon size={11} className={st.spin ? 'animate-spin' : ''} style={{ color: st.color }} />
          <span className="whitespace-nowrap text-[10px] font-medium" style={{ color: st.color }}>{st.label}</span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { chain: ChainNode };

/* Canvas controls — same cards/positions as the whole Deployment Topology view:
 * top-right [fit] · [+/−] · [reset], bottom-left d-pad. */
function ChainControls() {
  const rf = useReactFlow();
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const card = 'flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const panBy = (dx: number, dy: number) => {
    const v = rf.getViewport();
    rf.setViewport({ ...v, x: v.x + dx, y: v.y + dy }, { duration: 120 });
  };
  return (
    <>
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.22, duration: 300 })} className={btn}><Maximize size={13} /></button></TooltipTrigger><TooltipContent side="left">Fit &amp; center</TooltipContent></Tooltip>
        </div>
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom in</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger><TooltipContent side="left">Zoom out</TooltipContent></Tooltip>
        </div>
        <div className={card}>
          <Tooltip><TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.22, duration: 300 })} className={btn}><RotateCcw size={13} /></button></TooltipTrigger><TooltipContent side="left">Reset view</TooltipContent></Tooltip>
        </div>
      </div>
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

export interface EndpointConfigRecord {
  hostName: string;
  ipAddress: string;
  installationStatus: string;
  downloadStatus: string;
  retryStatus?: number;
  taskType?: string;
  configType?: string;
  deploymentDate?: string | null;
}

export function EndpointConfigFlow({ record, onClose, sharedDirSource = false, noExternalSource = false }: { record: EndpointConfigRecord; onClose: () => void; /** Package pages: the external source is a Shared Directory, not the Internet. */ sharedDirSource?: boolean; /** Registry pages: scripts are uploaded manually — no external source node at all. */ noExternalSource?: boolean }) {
  const norm = (s: string): ChainStatus => (
    (['Success', 'Failed', 'In Progress', 'Received', 'Yet to Receive', 'Pending', 'Waiting', 'Cancelled'] as ChainStatus[])
      .includes(s as ChainStatus) ? (s as ChainStatus) : 'Yet to Receive'
  );

  const { nodes, edges } = useMemo(() => {
    const [dsName, office] = pickOffice(record.hostName);
    const epStatus = norm(record.installationStatus);
    // Everything upstream of the endpoint delivered the patch (green). The endpoint carries its
    // real status; a failure (install or download) reddens the last hop.
    const chain: { id: string; kind: Kind; name: string; sub?: string; status: ChainStatus }[] = [
      { id: 'serviceops', kind: 'serviceops', name: 'ServiceOps Server', sub: 'Management Server', status: 'Success' },
      { id: 'mainfs', kind: 'mainfs', name: 'Main File Server', sub: noExternalSource ? 'Configuration Store' : sharedDirSource ? 'Package Store' : 'Patch Store', status: 'Success' },
      { id: 'ds', kind: 'ds', name: dsName, sub: `Distributed Server`, status: 'Success' },
      { id: 'office', kind: 'office', name: office, sub: 'Remote Office', status: 'Success' },
      { id: 'endpoint', kind: 'endpoint', name: record.hostName, sub: record.ipAddress, status: epStatus },
    ];

    const X = [0, 232, 464, 696, 928];
    const Y = 120;
    const nodes: RFNode[] = chain.map((c, i) => ({
      id: c.id, type: 'chain', position: { x: X[i], y: Y },
      data: { ...c, red: c.id === 'endpoint' && (epStatus === 'Failed') },
      draggable: false, selectable: false,
    }));
    // External source above the Main File Server — the Internet, or (package flows) the
    // Shared Directory the package files are picked up from. Registry flows have NONE: the
    // administrator uploads the script manually.
    if (!noExternalSource) {
      nodes.push({
        id: 'internet', type: 'chain', position: { x: X[1] + 20, y: -60 },
        data: sharedDirSource
          ? { kind: 'shareddir', name: 'Shared Directory', sub: '\\\\CORP-FS01\\ServiceOps\\Packages' }
          : { kind: 'internet', name: 'Internet', sub: 'External Patch Source' },
        draggable: false, selectable: false,
      });
    }

    const color = (s: ChainStatus) => STATUS_META[s].color;
    const edges: RFEdge[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const tgt = chain[i + 1];
      // The link takes the DOWNSTREAM node's status color; the final hop reddens only when the
      // ENDPOINT failed (endpoint-side condition — down/unreachable), never on download state.
      const isFinal = i === chain.length - 2;
      const c = isFinal && epStatus === 'Failed' ? '#F04438' : color(tgt.status);
      edges.push({
        id: `e-${chain[i].id}-${tgt.id}`, source: chain[i].id, target: tgt.id,
        sourceHandle: 'r', targetHandle: 'l', type: 'smoothstep', pathOptions: { borderRadius: 12 },
        animated: tgt.status === 'In Progress',
        style: { stroke: c, strokeWidth: 1.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: c, width: 15, height: 15 },
      } as RFEdge);
    }
    // External source → Main File Server (always downloads/stores every patch), two-way.
    if (!noExternalSource) {
      edges.push({
        id: 'e-net-mainfs', source: 'internet', target: 'mainfs', sourceHandle: 'b', targetHandle: 't',
        type: 'smoothstep', pathOptions: { borderRadius: 12 },
        style: { stroke: '#12B76A', strokeWidth: 1.8 },
        markerStart: { type: MarkerType.ArrowClosed, color: '#12B76A', width: 15, height: 15 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#12B76A', width: 15, height: 15 },
      } as RFEdge);
    }

    return { nodes, edges };
  }, [record, sharedDirSource, noExternalSource]);

  const epStatus = norm(record.installationStatus);
  const st = STATUS_META[epStatus];

  // Node hover card — same anchored treatment as the whole Deployment Topology view:
  // 550ms delay, centered above the node (flips below near the top), real-height corrected.
  const HOVER_W = 260, HOVER_GAP = 12, HOVER_PAD = 8;
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tip, setTip] = useState<{ left: number; top: number; placement: 'above' | 'below'; arrowLeft: number; yTop: number; yBot: number; d: { kind: Kind; name: string; sub?: string; status?: ChainStatus } } | null>(null);
  // Hovered node → its connected lines animate as dashed flow (same as the whole topology).
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const displayEdges = useMemo(() => {
    if (!hoverNodeId) return edges;
    return edges.map((e) => (e.source === hoverNodeId || e.target === hoverNodeId ? { ...e, animated: true } : e));
  }, [edges, hoverNodeId]);
  useLayoutEffect(() => {
    if (!tip || !cardRef.current) return;
    const hReal = cardRef.current.offsetHeight;
    const placement: 'above' | 'below' = tip.yTop - HOVER_GAP - hReal < HOVER_PAD ? 'below' : 'above';
    const top = placement === 'above' ? tip.yTop - HOVER_GAP - hReal : tip.yBot + HOVER_GAP;
    if (Math.abs(top - tip.top) > 1 || placement !== tip.placement) setTip({ ...tip, top, placement });
  }, [tip]);

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[10001] flex w-[1240px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#364658]">
              Deployment Configuration
              <span className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: `${st.color}1A`, color: st.color }}>
                <st.icon size={12} className={st.spin ? 'animate-spin' : ''} />{st.label}
              </span>
            </h2>
            <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{record.hostName} · {record.ipAddress}</div>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
        </div>

        {/* Flow canvas */}
        <div ref={wrapRef} className="relative h-[min(560px,70vh)] min-h-[320px] rounded-b-xl" style={{ backgroundColor: '#FAFBFC' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={displayEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              minZoom={0.4}
              maxZoom={1.4}
              nodesConnectable={false}
              nodesDraggable={false}
              proOptions={{ hideAttribution: true }}
              panOnDrag
              zoomOnScroll={false}
              /* Registered so the non-draggable nodes keep pointer events (hover works). */
              onNodeClick={() => {}}
              onNodeMouseEnter={(e, n) => {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
                // Animate this node's connected lines immediately (dashed flow).
                setHoverNodeId(n.id);
                const d = n.data as { kind: Kind; name: string; sub?: string; status?: ChainStatus };
                if (d.kind === 'internet') return; // no card for the Internet node (whole-map rule)
                const el = (e.target as HTMLElement).closest('.react-flow__node') as HTMLElement | null;
                const rect = wrapRef.current?.getBoundingClientRect();
                if (!el || !rect) return;
                const nr = el.getBoundingClientRect();
                const cx = nr.left + nr.width / 2 - rect.left;
                const yTop = nr.top - rect.top;
                const yBot = nr.bottom - rect.top;
                hoverTimer.current = setTimeout(() => {
                  const estH = 150 + (d.kind === 'endpoint' ? 90 : 0);
                  const placement: 'above' | 'below' = yTop - HOVER_GAP - estH < HOVER_PAD ? 'below' : 'above';
                  const top = placement === 'above' ? yTop - HOVER_GAP - estH : yBot + HOVER_GAP;
                  let left = cx - HOVER_W / 2;
                  left = Math.max(HOVER_PAD, Math.min(left, rect.width - HOVER_W - HOVER_PAD));
                  const arrowLeft = Math.max(14, Math.min(cx - left, HOVER_W - 14));
                  setTip({ left, top, placement, arrowLeft, yTop, yBot, d });
                }, 550);
              }}
              onNodeMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setTip(null); setHoverNodeId(null); }}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#D9DEE7" />
            </ReactFlow>
            <ChainControls />
          </ReactFlowProvider>

          {/* Node hover card */}
          {tip && (() => {
            const k = KIND[tip.d.kind];
            const s = tip.d.status ? STATUS_META[tip.d.status] : null;
            // NOTE: no "Download Status" here — the endpoint never downloads from the Internet
            // itself in this chain; a failure at the last hop is an endpoint-side condition
            // (machine down/unreachable), surfaced as the red reason strip below.
            const rows: [string, string][] = tip.d.kind === 'endpoint'
              ? [
                  ['IP Address', record.ipAddress],
                  ['Configuration Type', record.configType ?? 'Install'],
                  ['Deployment Date', record.deploymentDate && record.deploymentDate !== '---' ? record.deploymentDate : '---'],
                  ['Retry Status', String(record.retryStatus ?? 0)],
                  ['Task Type', record.taskType ?? 'Manual Remote Deployment'],
                ]
              : tip.d.kind === 'shareddir'
              ? [
                  ['Share Type', 'Network Share (SMB)'],
                  ['Access Account', 'svc_serviceops (read-only)'],
                  ['Last Sync', 'Mon, Jul 27, 2026 09:42 AM'],
                ]
              : [['Role', tip.d.sub ?? k.label]];
            const failReason = tip.d.kind === 'endpoint' && tip.d.status === 'Failed'
              ? 'Installation failed — the endpoint is offline (shut down or unreachable on the network). It will retry on the next check-in.'
              : null;
            return (
              <div
                ref={cardRef}
                className="pointer-events-none absolute z-30 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
                style={{ left: tip.left, top: tip.top, width: HOVER_W }}
              >
                <div
                  className={`absolute size-2.5 rotate-45 border-[#E5E7EB] bg-white ${tip.placement === 'above' ? '-bottom-[6px] border-b border-r' : '-top-[6px] border-l border-t'}`}
                  style={{ left: tip.arrowLeft - 5 }}
                />
                <div className="flex items-center gap-2.5 border-b border-[#F0F2F5] px-3.5 py-2.5">
                  <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${k.color}1A`, color: k.color }}>
                    <k.icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-[#364658]">{tip.d.name}</div>
                    <div className="truncate text-[10.5px] text-[#7B8FA5]">{k.label}</div>
                  </div>
                </div>
                {/* Shared Directory: the FULL path, wrapped — the card's sub-line truncates it. */}
                {tip.d.kind === 'shareddir' && (
                  <div className="border-b border-[#F0F2F5] px-3.5 py-2.5">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Directory Path</div>
                    <div className="break-all rounded bg-[#F8FAFC] px-2 py-1.5 font-mono text-[11px] leading-relaxed text-[#364658]">{tip.d.sub}</div>
                  </div>
                )}
                <div className="space-y-1.5 px-3.5 py-2.5">
                  {s && tip.d.status && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#7B8FA5]">Status</span>
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: s.color }}>
                        <s.icon size={11} className={s.spin ? 'animate-spin' : ''} />
                        {s.label}
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
                {failReason && (
                  <div className="mx-3.5 mb-3 rounded-md border border-[#FECDCA] bg-[#FEF3F2] px-2.5 py-2 text-[10.5px] leading-relaxed text-[#B42318]">{failReason}</div>
                )}
              </div>
            );
          })()}

          {/* Status legend */}
          <div className="absolute bottom-3 right-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Connection Status</div>
            {([['Success', '#12B76A'], ['Failed', '#F04438'], ['In Progress', '#F79009'], ['Yet to Receive', '#94A3B8']] as [string, string][]).map(([l, c]) => (
              <div key={l} className="flex items-center gap-2 py-0.5">
                <span className="h-0.5 w-5 flex-shrink-0 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[10.5px] text-[#475467]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
