import { useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, FileText, History, Maximize2, Minus, Plus, Split, Workflow, X } from 'lucide-react';
import type { ConditionGroup, FormField, RuleAction } from './formRuleData';
import { actionText, conditionText } from './formRuleEngine';
import type { RuleConflict } from './formRuleEngine';
import { KIND_TONE } from './FormRuleInsights';

/* E · Flow canvas. The rule drawn as what it is — a pipeline: details → trigger → condition
 * groups → actions — with every clash drawn as a red dashed line out to a greyed node for the
 * other rule. Nodes are read-only pictures; clicking one opens the matching editor in a drawer,
 * so the canvas never has to be a second editor that can drift from the first. */

type Panel = 'details' | 'when' | 'check' | 'then';

interface Edge { from: string; to: string; tone: 'line' | 'clash'; label?: string }

export function FormRuleFlowView({
  name, eventLabel, execution, applies, groups, actions, fields, conflicts, ready,
  detailsSlot, whenSlot, checkSlot, thenSlot,
}: {
  name: string;
  eventLabel: string;
  execution: string;
  applies: string;
  groups: ConditionGroup[];
  actions: RuleAction[];
  fields: FormField[];
  conflicts: RuleConflict[];
  ready: boolean;
  detailsSlot: React.ReactNode;
  whenSlot: React.ReactNode;
  checkSlot: React.ReactNode;
  thenSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState<Panel | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; tone: Edge['tone']; label?: string; lx: number; ly: number }[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const inner = useRef<HTMLDivElement>(null);
  /** 'fit' scales the whole chain into view — at 1300px a five-column chain is wider than the pane. */
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [scale, setScale] = useState(1);

  const label = (id: string) => fields.find((f) => f.id === id)?.label ?? id;
  const liveActions = actions.filter((a) => a.type && a.fieldIds.length);
  const liveGroups = groups.map((g) => ({ ...g, conditions: g.conditions.filter((c) => c.fieldId && c.op) })).filter((g) => g.conditions.length);

  // Clash nodes: one per (other rule, field) pair.
  const clashNodes = conflicts.reduce<{ id: string; conflict: RuleConflict }[]>((out, c) => {
    const id = `x-${c.other.id}-${c.fieldId}-${c.actionId}`;
    if (!out.some((o) => o.id === id)) out.push({ id, conflict: c });
    return out;
  }, []);

  const edges: Edge[] = [{ from: 'rule', to: 'trigger', tone: 'line' }];
  if (ready) {
    if (liveGroups.length) {
      liveGroups.forEach((g, i) => edges.push({ from: 'trigger', to: `g-${g.id}`, tone: 'line', label: i > 0 ? g.join.toLowerCase() : undefined }));
      liveGroups.forEach((g) => edges.push({ from: `g-${g.id}`, to: 'hub', tone: 'line' }));
    } else {
      edges.push({ from: 'trigger', to: 'hub', tone: 'line', label: 'always' });
    }
    liveActions.forEach((a) => edges.push({ from: 'hub', to: `a-${a.id}`, tone: 'line' }));
    clashNodes.forEach((n) => edges.push({ from: `a-${n.conflict.actionId}`, to: n.id, tone: 'clash', label: n.conflict.kind.toLowerCase() }));
  }

  /* Edges are measured off the rendered nodes, so the cards can size to their content and the
     lines still land on their middles. */
  useLayoutEffect(() => {
    const root = wrap.current;
    if (!root) return;
    const measure = () => {
      if (inner.current) {
        const s = zoom === 'fit' ? Math.min(1, Math.max(0.5, (root.clientWidth - 8) / inner.current.offsetWidth)) : zoom;
        if (Math.abs(s - scale) > 0.01) { setScale(s); return; }
      }
      const base = root.getBoundingClientRect();
      const at = (id: string) => root.querySelector(`[data-flow="${id}"]`)?.getBoundingClientRect();
      setBox({ w: root.scrollWidth, h: root.scrollHeight });
      setPaths(edges.flatMap((e) => {
        const a = at(e.from); const b = at(e.to);
        if (!a || !b) return [];
        const x1 = a.right - base.left + root.scrollLeft; const y1 = a.top + a.height / 2 - base.top + root.scrollTop;
        const x2 = b.left - base.left + root.scrollLeft; const y2 = b.top + b.height / 2 - base.top + root.scrollTop;
        const k = Math.max(30, (x2 - x1) / 2);
        return [{ d: `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`, tone: e.tone, label: e.label, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 }];
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [JSON.stringify(edges), groups, actions, open, zoom, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const node = (id: string, tone: string, icon: React.ReactNode, title: string, body: React.ReactNode, panel: Panel, extra = '') => (
    <button
      type="button"
      data-flow={id}
      onClick={() => setOpen(panel)}
      className={`relative z-[1] w-[230px] rounded-lg border bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all hover:shadow-md ${open === panel ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED]'} ${extra}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: `${tone}1A`, color: tone }}>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: tone }}>{title}</span>
      </div>
      <div className="text-[12px] leading-[1.5] text-[#364658]">{body}</div>
    </button>
  );

  const addNode = (id: string, text: string, panel: Panel) => (
    <button type="button" data-flow={id} onClick={() => setOpen(panel)}
      className="relative z-[1] flex w-[230px] items-center justify-center gap-1 rounded-lg border border-dashed border-[#CBD5E1] bg-white/60 py-2.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
      <Plus size={13} /> {text}
    </button>
  );

  const titles: Record<Panel, string> = { details: 'Rule details', when: 'When this rule runs', check: 'Conditions', then: 'Actions' };
  const slot: Record<Panel, React.ReactNode> = { details: detailsSlot, when: whenSlot, check: checkSlot, then: thenSlot };

  return (
    <div className="relative flex min-h-0 flex-1">
      <div ref={wrap} className="relative min-h-0 flex-1 overflow-auto bg-[#FAFBFC] bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:16px_16px]">
        <svg className="pointer-events-none absolute left-0 top-0" width={box.w} height={box.h}>
          <defs>
            <marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#A5BAD0" /></marker>
            <marker id="flow-arrow-red" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#F25C4E" /></marker>
          </defs>
          {paths.map((p, i) => (
            <g key={i}>
              <path d={p.d} fill="none" stroke={p.tone === 'clash' ? '#F25C4E' : '#A5BAD0'} strokeWidth={1.5} strokeDasharray={p.tone === 'clash' ? '5 4' : undefined}
                markerEnd={`url(#${p.tone === 'clash' ? 'flow-arrow-red' : 'flow-arrow'})`} />
              {p.label && (
                <g transform={`translate(${p.lx},${p.ly})`}>
                  <rect x={-p.label.length * 3.4 - 6} y={-9} width={p.label.length * 6.8 + 12} height={18} rx={9} fill="#fff" stroke={p.tone === 'clash' ? '#FECACA' : '#DFE5ED'} />
                  <text textAnchor="middle" dy="4" fontSize="10.5" fontWeight={500} fill={p.tone === 'clash' ? '#DC2626' : '#64748B'}>{p.label}</text>
                </g>
              )}
            </g>
          ))}
        </svg>

        <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} className="relative flex w-max items-center gap-14 px-10 pb-10 pt-16">
          <div className="flex flex-col gap-4">
            {node('rule', '#64748B', <FileText size={11} />, 'Rule', <>
              <div className="truncate font-medium">{name || <span className="text-[#98A2B3]">Untitled rule</span>}</div>
              <div className="text-[11px] text-[#7B8FA5]">{applies || 'Who?'}</div>
            </>, 'details')}
          </div>

          <div className="flex flex-col gap-4">
            {node('trigger', '#3D8BD0', <History size={11} />, 'When', ready
              ? <><div>{eventLabel}</div><div className="text-[11px] text-[#7B8FA5]">{execution}</div></>
              : <span className="text-[#98A2B3]">Choose when it runs</span>, 'when')}
          </div>

          {ready && (
            <>
              <div className="flex flex-col gap-4">
                {liveGroups.map((g, gi) => node(`g-${g.id}`, '#F58518', <Split size={11} className="rotate-180" />, `If · group ${gi + 1}`,
                  <ul className="space-y-0.5">{g.conditions.map((c, ci) => (
                    <li key={c.id} className="truncate">{ci > 0 && <span className="text-[#F58518]">{c.join.toLowerCase()} </span>}{conditionText(c, fields)}</li>
                  ))}</ul>, 'check'))}
                {addNode('add-cond', liveGroups.length ? 'Condition group' : 'Add a condition', 'check')}
              </div>

              <span data-flow="hub" className="relative z-[1] flex size-9 flex-shrink-0 items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[10px] font-semibold uppercase text-[#89C540] shadow-sm">then</span>

              <div className="flex flex-col gap-4">
                {liveActions.map((a) => {
                  const clash = conflicts.some((c) => c.actionId === a.id);
                  return node(`a-${a.id}`, '#89C540', <Workflow size={11} />, a.type,
                    <ul className="space-y-0.5">{a.fieldIds.map((f) => <li key={f} className="truncate">{actionText(a.type, label(f), a.value.join(', '))}</li>)}</ul>,
                    'then', clash ? '!border-[#FCA5A5]' : '');
                })}
                {addNode('add-act', liveActions.length ? 'Action' : 'Add an action', 'then')}
              </div>

              {clashNodes.length > 0 && (
                <div className="flex flex-col gap-3">
                  {clashNodes.map(({ id, conflict: c }) => (
                    <div key={id} data-flow={id} className="relative z-[1] w-[230px] rounded-lg border border-dashed border-[#FCA5A5] bg-white/80 p-3 opacity-90">
                      <div className="mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-[#DC2626]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: KIND_TONE[c.kind].fg }}>{c.kind}</span>
                      </div>
                      <div className="truncate text-[12px] font-medium text-[#364658]">{c.other.name}</div>
                      <div className="text-[12px] text-[#64748B]">{c.theirs}</div>
                      <div className="mt-1 text-[11px] leading-[1.45] text-[#7B8FA5]">{c.outcome}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="pointer-events-none absolute left-4 top-3 z-[2] flex items-center gap-3 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-[#64748B] shadow-sm">
          <span className="flex items-center gap-1.5"><span className="h-px w-5 bg-[#A5BAD0]" />flow</span>
          <span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-[#F25C4E]" />clash with another rule</span>
          <span>· click a node to edit it</span>
        </div>
      </div>

      <div className="absolute right-4 top-3 z-[2] flex items-center gap-0.5 rounded-md border border-[#DFE5ED] bg-white p-0.5 shadow-sm">
        <button type="button" title="Zoom out" onClick={() => setZoom(Math.max(0.5, +(scale - 0.1).toFixed(2)))} className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-[#F1F5F9]"><Minus size={14} /></button>
        <span className="w-10 text-center text-[11px] tabular-nums text-[#364658]">{Math.round(scale * 100)}%</span>
        <button type="button" title="Zoom in" onClick={() => setZoom(Math.min(1.2, +(scale + 0.1).toFixed(2)))} className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-[#F1F5F9]"><Plus size={14} /></button>
        <button type="button" title="Fit to view" onClick={() => setZoom('fit')} className={`flex size-7 items-center justify-center rounded hover:bg-[#F1F5F9] ${zoom === 'fit' ? 'text-[#3D8BD0]' : 'text-[#64748B]'}`}><Maximize2 size={13} /></button>
      </div>

      {open && (
        <aside className="absolute bottom-0 right-0 top-0 z-20 flex w-[min(620px,70%)] flex-col border-l border-[#DFE5ED] bg-white shadow-[-8px_0_24px_rgba(15,23,42,0.12)]">
          <div className="flex flex-shrink-0 items-center border-b border-[#DFE5ED] px-4 py-3">
            <span className="text-[13px] font-medium text-[#364658]">{titles[open]}</span>
            <button type="button" onClick={() => setOpen(null)} className="ml-auto flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{slot[open]}</div>
        </aside>
      )}
    </div>
  );
}
