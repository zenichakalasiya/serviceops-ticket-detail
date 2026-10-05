import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, ExternalLink, Filter, GripVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DEFAULT_FORM_FIELDS, EVENT_OPTIONS, SEED_RULES, uid } from './formRuleData';
import type { FormField, FormRule, RuleApplies, RuleEvent, RuleExecution } from './formRuleData';
import { ToggleSwitch } from './FormRuleControls';
import { FormRuleEditor } from './FormRuleEditor';
import { AdminFormBuilder } from './AdminFormBuilder';
import { conflictCount } from './formRuleEngine';
import { AdminFormRuleMatrix } from './AdminFormRuleMatrix';

/* Request Form Management — Admin › Request Management. One page, two inline tabs: the FORM (what
 * is on it) and its RULES (how it behaves). Both nav rows — Request Form and Request Form Rule —
 * land here on their own tab, so the two can't become two pages about one form.
 *
 * Rules run TOP TO BOTTOM, so the listing's order is the execution order and the number in front
 * of each name is its position. Dragging a row reorders it; while the list is searched or filtered
 * the handle is disabled, because "move above the row you can see" would really mean "move above
 * a row you can't". */

export type RequestFormTab = 'builder' | 'rules';

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

const stamp = () => {
  const d = new Date();
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
};

interface Filters { applies: RuleApplies[]; event: RuleEvent[]; execution: RuleExecution[]; status: ('Enabled' | 'Disabled')[] }
const NO_FILTERS: Filters = { applies: [], event: [], execution: [], status: [] };

const FILTER_GROUPS: { key: keyof Filters; label: string; options: string[] }[] = [
  { key: 'applies', label: 'Applies to', options: ['Requesters', 'Technicians', 'Everyone'] },
  { key: 'event', label: 'Event', options: EVENT_OPTIONS.map((e) => e.value) },
  { key: 'execution', label: 'Execution', options: ['On Create', 'On Edit', 'On Create and Edit'] },
  { key: 'status', label: 'Status', options: ['Enabled', 'Disabled'] },
];

function FilterPopover({ anchor, filters, onChange, onClose }: {
  anchor: HTMLElement; filters: Filters; onChange: (f: Filters) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const r = anchor.getBoundingClientRect();
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [anchor, onClose]);
  const toggle = (k: keyof Filters, v: string) => {
    const cur = filters[k] as string[];
    onChange({ ...filters, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  return createPortal(
    <div ref={ref} style={{ left: r.left, top: r.bottom + 6 }} className="fixed z-[10060] w-[320px] rounded-lg border border-[#DFE5ED] bg-white shadow-lg">
      <div className="max-h-[400px] space-y-4 overflow-y-auto p-4">
        {FILTER_GROUPS.map((g) => (
          <div key={g.key}>
            <div className="mb-2 text-[12px] font-medium text-[#7B8FA5]">{g.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.options.map((o) => {
                const on = (filters[g.key] as string[]).includes(o);
                const label = g.key === 'event' ? EVENT_OPTIONS.find((e) => e.value === o)!.value : o;
                return (
                  <button key={o} type="button" onClick={() => toggle(g.key, o)}
                    className={`h-7 rounded border px-2.5 text-[12px] transition-colors ${on ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'border-[#E5E7EB] bg-white text-[#364658] hover:bg-[#F9FAFB]'}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-2.5">
        <button type="button" onClick={() => onChange(NO_FILTERS)} className="text-[13px] font-medium text-[#64748B] hover:text-[#364658]">Clear all</button>
        <button type="button" onClick={onClose} className="h-8 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white hover:bg-[#3478B5]">Done</button>
      </div>
    </div>,
    document.body,
  );
}

export function AdminRequestFormModule({ tab, onTab, onEditor }: {
  tab: RequestFormTab;
  onTab: (t: RequestFormTab) => void;
  /** The editor takes the whole pane, so the admin sidebar stands down while it is open. */
  onEditor?: (open: boolean) => void;
}) {
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FORM_FIELDS);
  const [rules, setRules] = useState<FormRule[]>(SEED_RULES);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtn = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  /** 'new' = creating; a rule id = editing that rule; null = the listing. */
  const [editing, setEditing] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FormRule | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  /** J · the field matrix is a view of the rules, not its own nav destination, so it is local state. Its tab was REMOVED (5 Oct 2026, Zeni); the view stays built — add ['matrix', 'Field Matrix'] back to the tab list to restore it. */
  const [matrix, setMatrix] = useState(false);
  const view: RequestFormTab | 'matrix' = matrix ? 'matrix' : tab;
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => { onEditor?.(editing !== null); }, [editing, onEditor]);
  useEffect(() => () => onEditor?.(false), [onEditor]);

  const filterCount = Object.values(filters).reduce((n, v) => n + v.length, 0);
  const q = search.trim().toLowerCase();
  const rows = rules.filter((r) =>
    (!q || [r.name, r.applies, r.event, r.execution, ...r.tags].some((s) => s.toLowerCase().includes(q)))
    && (!filters.applies.length || filters.applies.includes(r.applies))
    && (!filters.event.length || filters.event.includes(r.event))
    && (!filters.execution.length || filters.execution.includes(r.execution))
    && (!filters.status.length || filters.status.includes(r.enabled ? 'Enabled' : 'Disabled')));
  const narrowed = !!q || filterCount > 0;
  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const reorder = (id: string, beforeId: string) => {
    if (id === beforeId) return;
    setRules((rs) => {
      const from = rs.findIndex((r) => r.id === id);
      const to = rs.findIndex((r) => r.id === beforeId);
      const next = [...rs];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    toast.success('Execution order updated');
  };

  const duplicate = (r: FormRule) => {
    const copy: FormRule = { ...r, id: uid('rule'), name: `Copy of ${r.name}`, createdAt: stamp(), enabled: false, conflicts: 0 };
    setRules((rs) => { const i = rs.findIndex((x) => x.id === r.id); return [...rs.slice(0, i + 1), copy, ...rs.slice(i + 1)]; });
    toast.success('Rule duplicated — it starts disabled so it cannot fight the original');
  };

  if (editing !== null) {
    const current = editing === 'new' ? undefined : rules.find((r) => r.id === editing);
    return (
      <FormRuleEditor
        key={editing}
        rule={current}
        rules={rules}
        onOpenRule={(id) => setEditing(id)}
        fields={fields}
        onCancel={() => setEditing(null)}
        onSave={(data) => {
          if (current) {
            setRules((rs) => rs.map((r) => (r.id === current.id ? { ...r, ...data } : r)));
            toast.success(`“${data.name}” updated`);
          } else {
            setRules((rs) => [...rs, { ...data, id: uid('rule'), createdAt: stamp(), enabled: true, conflicts: 0 }]);
            toast.success(`“${data.name}” created — it runs last, drag it up to run it earlier`);
          }
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h1 className="text-[16px] font-semibold text-[#364658]">Request Form Management</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          Build the request form and the rule-based flows that route and act on requests.{' '}
          <button type="button" onClick={() => toast.success('Opening the setup guide')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View setup guide <ExternalLink size={12} />
          </button>
        </p>
      </div>

      {/* The product's inline tab strip — the one every detail page uses. */}
      <div className="mb-4 flex gap-2.5 border-b border-[#E5E7EB]">
        {([['builder', 'Form Builder'], ['rules', 'Form Rules']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMatrix(false); onTab(id); }}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${view === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
          >
            {label}
            {<span className={`rounded-sm px-1.5 text-[11px] font-semibold ${view === id ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
              {id === 'builder' ? fields.length : rules.length}
            </span>}
          </button>
        ))}
      </div>

      {view === 'matrix' ? (
        <AdminFormRuleMatrix rules={rules} fields={fields} onEditRule={(id) => setEditing(id)} />
      ) : tab === 'builder' ? (
        <AdminFormBuilder fields={fields} onFields={setFields} rules={rules} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search" className={inputCls} />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
              )}
            </div>
            <button
              ref={filterBtn}
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`inline-flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] transition-colors ${filterCount ? 'border-[#3D8BD0] bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'border-[#d1d5db] bg-white text-[#364658] hover:bg-[#F9FAFB]'}`}
            >
              {filterCount ? `${filterCount} filter${filterCount > 1 ? 's' : ''}` : 'All'} <Filter size={13} />
            </button>
            {filterCount > 0 && (
              <button type="button" onClick={() => setFilters(NO_FILTERS)} className="text-[13px] font-medium text-[#64748B] hover:text-[#364658]">Clear</button>
            )}
            <button type="button" onClick={() => setEditing('new')} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">
              <Plus size={15} /> Create Rule
            </button>
          </div>

          {/* -mx-4 cancels the page gutter, so every rule runs end to end across the pane; the
              cells carry their own 16px instead. */}
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[1040px] leading-5">
              <thead className="border-b border-[#e5e7eb]">
                <tr>
                  {['Rule Name', 'Execution', 'Applies to', 'Event', 'Created Date', 'Enabled', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] bg-white">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                    {rules.length === 0 ? 'No form rules yet — create one to start shaping the request form.' : 'No rules match your search or filters.'}
                  </td></tr>
                ) : pageRows.map((r) => {
                  const order = rules.findIndex((x) => x.id === r.id) + 1;
                  // Measured, not stored: the same engine the editor runs live.
                  const nConflicts = conflictCount(r, rules, fields);
                  return (
                    <tr
                      key={r.id}
                      draggable={!narrowed && dragId === r.id}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(r.id); } }}
                      onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, r.id); setDragId(null); setOverId(null); }}
                      onDragEnd={() => { setDragId(null); setOverId(null); }}
                      className={`group transition-colors hover:bg-[#f9fafb] ${dragId === r.id ? 'opacity-40' : ''} ${overId === r.id && dragId !== r.id ? 'shadow-[inset_0_2px_0_#3D8BD0]' : ''}`}
                    >
                      <td className="relative px-4 py-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="absolute left-0 top-1/2 flex -translate-y-1/2">
                              <button
                                type="button"
                                disabled={narrowed}
                                onMouseDown={() => !narrowed && setDragId(r.id)}
                                onMouseUp={() => setDragId(null)}
                                className={`${iconBtn} !h-7 !w-4 cursor-grab text-[#98A2B3] opacity-0 group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing`}
                              ><GripVertical size={14} /></button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{narrowed ? 'Clear the search and filters to change the execution order' : 'Drag to change the execution order'}</TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setEditing(r.id)} className="max-w-[220px] truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={r.name}>
                            <span className="mr-1 tabular-nums text-[#7B8FA5]">{order}.</span>{r.name}
                          </button>
                          {nConflicts > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-shrink-0 cursor-help rounded-sm bg-[#FEF2F2] px-1.5 py-px text-[11px] leading-4 font-medium text-[#DC2626]">{nConflicts} conflict{nConflicts > 1 ? 's' : ''}</span>
                              </TooltipTrigger>
                              <TooltipContent>Acts on the same fields as other rules in a different way</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#364658]">{r.execution}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#364658]">{r.applies}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#364658]">{r.event}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-[#364658]">{r.createdAt.replace(/^[A-Z][a-z]{2}, /, '')}</td>
                      <td className="px-4 py-4">
                        <ToggleSwitch
                          on={r.enabled}
                          title={r.enabled ? 'Enabled — switch off to stop this rule running' : 'Disabled — switch on to run this rule'}
                          onChange={(enabled) => {
                            setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled } : x)));
                            toast.success(`“${r.name}” ${enabled ? 'enabled' : 'disabled'}`);
                          }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-[10px]">
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => duplicate(r)} title="Duplicate" className={iconBtn}><Copy size={15} /></button>
                          <button type="button" onClick={() => setEditing(r.id)} title="Edit" className={iconBtn}><Pencil size={15} /></button>
                          <button type="button" onClick={() => setPendingDelete(r)} title="Delete" className={`${iconBtn} hover:!bg-[#FEF2F2] hover:!text-[#DC2626]`}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={perPage}
            totalItems={rows.length}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => { setPerPage(v); setPage(1); }}
          />

          {filterOpen && filterBtn.current && (
            <FilterPopover anchor={filterBtn.current} filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onClose={() => setFilterOpen(false)} />
          )}
        </>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setPendingDelete(null)}>
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Delete “{pendingDelete.name}”?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">The form stops applying this rule straight away. To pause it instead, switch it off.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button
                type="button"
                onClick={() => { setRules((rs) => rs.filter((x) => x.id !== pendingDelete.id)); toast.success(`“${pendingDelete.name}” deleted`); setPendingDelete(null); }}
                className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]"
              >Delete rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
