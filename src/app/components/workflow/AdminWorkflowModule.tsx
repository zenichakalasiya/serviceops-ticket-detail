import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Copy, ExternalLink, List, Loader2, MoreVertical, Network, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '../Pagination';
import { ToggleSwitch } from '../FormRuleControls';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { loadWorkflows, stepCount, triggerLabel, useWorkflows, workflowModule, workflowStore } from './workflowStore';
import type { WorkflowRecord } from './workflowStore';
import { onWflHost, wflToFrame } from './wflBridge';

/* Admin › Automation › Workflow.
 *
 * The listing is the standard admin listing (User Surveys / Form Rules are the reference); a row,
 * or Create Workflow, opens the full-page editor. The editor's chrome — name, state, Linear | Node,
 * Enabled, Publish — is this product's; the builder inside it is the Linear workflow builder ported
 * from D:\Motadata\Workflow_Sidebar_scroll (scripts/port-workflow-linear.mjs), loaded only when an
 * editor opens because it is 1.3 MB. */

/* The builder is the whole source app — keep it out of the admin chunk. */
const LinearBuilder = lazy(() => import('./linear/LinearBuilder'));

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';

const STATUS_TONE: Record<WorkflowRecord['status'], string> = {
  Published: 'bg-[#E7F6ED] text-[#15803D]',
  Draft: 'bg-[#FDF3D8] text-[#9A6700]',
};

const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const TONES = ['#3D8BD0', '#8B5CF6', '#0EA5A4', '#F58518', '#E25C8A'];
const toneFor = (n: string) => TONES[[...n].reduce((h, c) => h + c.charCodeAt(0), 0) % TONES.length];

interface Props {
  /** The workflow open in the editor, from the URL. */
  openId?: string;
  onOpenChange?: (id: string | undefined) => void;
  /** The editor is a full page: the admin sidebar stands down while it is open. */
  onEditor?: (open: boolean) => void;
}

export function AdminWorkflowModule({ openId, onOpenChange, onEditor }: Props) {
  const { rows, loaded } = useWorkflows();
  useEffect(() => { loadWorkflows(); }, []);

  const open = openId ? rows.find((r) => r.id === openId) : undefined;
  useEffect(() => { onEditor?.(!!open); return () => onEditor?.(false); }, [!!open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A link to a workflow that does not exist (deleted, or a stale id) lands on the listing and says so. */
  useEffect(() => {
    if (loaded && openId && !open) {
      toast.error(`Workflow ${openId} was not found`);
      onOpenChange?.(undefined);
    }
  }, [loaded, openId, open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (open) return <WorkflowEditor key={open.id} record={open} onClose={() => onOpenChange?.(undefined)} onOpen={(id) => onOpenChange?.(id)} />;
  return <WorkflowListing rows={rows} loaded={loaded} onOpen={(id) => onOpenChange?.(id)} />;
}

/* ================================================================ listing */

function WorkflowListing({ rows, loaded, onOpen }: { rows: WorkflowRecord[]; loaded: boolean; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.id, r.name, workflowModule(r.doc) || '', triggerLabel(r.doc), r.status, r.modifiedBy].some((v) => v.toLowerCase().includes(q)));
  }, [rows, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const create = () => onOpen(workflowStore.create().id);
  const COLS = ['ID', 'Name', 'Module', 'Trigger', 'Steps', 'Status', 'Enabled', 'Last Modified', 'Modified By', 'Actions'];

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h1 className="text-[16px] font-semibold text-[#364658]">Workflow</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          Build rule-based flows that route and act on requests.{' '}
          <button type="button" onClick={() => toast.success('Opening the docs')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View Docs <ExternalLink size={12} />
          </button>
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search" className={inputCls} />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
          )}
        </div>
        <div className="ml-auto">
          <button type="button" onClick={create} className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">
            <Plus size={15} /> Create Workflow
          </button>
        </div>
      </div>

      {/* -mx-4 cancels the page gutter, so every rule runs end to end across the pane. */}
      <div className="-mx-4 overflow-x-auto">
        <table className="w-full min-w-[1200px] leading-5">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {COLS.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {!loaded ? (
              <tr><td colSpan={COLS.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading workflows…</span>
              </td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={COLS.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                {search ? 'No workflows match your search.' : 'No workflows yet. Create one to automate a request flow.'}
              </td></tr>
            ) : pageRows.map((r) => {
              const mod = workflowModule(r.doc);
              return (
                <tr key={r.id} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{r.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onOpen(r.id)} title={r.name} className="block max-w-[320px] truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]">{r.name}</button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{mod ?? <span className="text-[#9CA3AF]">Time based</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{triggerLabel(r.doc)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{stepCount(r.doc)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${STATUS_TONE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      on={r.enabled}
                      title={r.enabled ? 'Enabled — switch off to stop this workflow running' : 'Disabled — switch on to run this workflow'}
                      onChange={(enabled) => { workflowStore.update(r.id, { enabled }); toast.success(`“${r.name}” ${enabled ? 'enabled' : 'disabled'}`); }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{fmt(r.modifiedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[13px] text-[#364658]">
                      <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: toneFor(r.modifiedBy) }}>{initials(r.modifiedBy)}</span>
                      {r.modifiedBy}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <div className="flex items-center gap-0.5">
                      <RowIcon label="Edit" onClick={() => onOpen(r.id)}><Pencil size={15} /></RowIcon>
                      <RowIcon label="Duplicate" onClick={() => { const c = workflowStore.duplicate(r.id); if (c) toast.success(`Duplicated as “${c.name}” — a draft`); }}><Copy size={15} /></RowIcon>
                      <RowIcon label="Delete" danger onClick={() => { workflowStore.remove(r.id); toast.success(`“${r.name}” deleted`); }}><Trash2 size={15} /></RowIcon>
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
        totalItems={filtered.length}
        onPageChange={setPage}
        onItemsPerPageChange={(v) => { setPerPage(v); setPage(1); }}
      />
    </div>
  );
}

function RowIcon({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} onClick={onClick} className={`${iconBtn} ${danger ? 'hover:!text-[#DC2626]' : ''}`}>{children}</button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ================================================================ editor */

type View = 'linear' | 'node';

function WorkflowEditor({ record, onClose, onOpen }: { record: WorkflowRecord; onClose: () => void; onOpen: (id: string) => void }) {
  const [view, setView] = useState<View>('linear');
  const [menu, setMenu] = useState<null | 'publish' | 'more'>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /* Read once, at open: the builder owns the document from here and reports every change back. */
  const initial = useRef(record).current;

  /* builder → this page. The builder mirrors name / description / published (the source host's
     contract) and its document; every one is written straight to the record. */
  useEffect(() => onWflHost((m) => {
    if (m.wf === 'doc') {
      // The builder reports its document on mount too; only a real change is an edit.
      if (JSON.stringify(m.doc) !== JSON.stringify(workflowStore.get(record.id)?.doc)) workflowStore.update(record.id, { doc: m.doc as WorkflowRecord['doc'] });
    }
    else if (m.wf === 'state') workflowStore.update(record.id, { name: String(m.name || '').trim() || 'Untitled rule', description: String(m.desc || '') }, false);
    else if (m.wf === 'saved') {
      workflowStore.update(record.id, { status: m.publish ? 'Published' : 'Draft' });
      toast.success(m.publish ? 'Workflow published' : 'Saved as draft');
    }
  }), [record.id]);

  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [menu]);

  /* Both go to the builder's own save / publish drawer, which asks for the name and description and
     refuses to publish a workflow with no trigger or no action — the rule lives in one place. */
  const openSave = (panel: 'save' | 'publish') => { setMenu(null); wflToFrame({ wf: 'open', panel }); };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="relative flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onClose} aria-label="Back to workflows" className={iconBtn}><ArrowLeft size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to workflows</TooltipContent>
        </Tooltip>
        <button type="button" onClick={() => openSave('save')} title="Rename or describe this workflow" className="max-w-[360px] truncate text-[16px] font-semibold text-[#364658] hover:text-[#3D8BD0]">{record.name}</button>
        <span className={`flex-shrink-0 rounded-sm px-2 py-0.5 text-[12px] font-medium ${STATUS_TONE[record.status]}`}>{record.status}</span>

        {/* Centred on the bar, not on the space left over, so it does not drift as the name changes. */}
        <div className="pill-track absolute left-1/2 -translate-x-1/2">
          <button type="button" aria-pressed={view === 'linear'} onClick={() => setView('linear')} className="gap-1.5"><List size={14} /> Linear</button>
          <button type="button" aria-pressed={view === 'node'} onClick={() => setView('node')} className="gap-1.5"><Network size={14} /> Node</button>
        </div>

        <div ref={menuRef} className="ml-auto flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-[13px] text-[#364658]">
            Enabled
            <ToggleSwitch on={record.enabled} onChange={(enabled) => { workflowStore.update(record.id, { enabled }); toast.success(`Workflow ${enabled ? 'enabled' : 'disabled'}`); }} />
          </label>
          <span className="h-5 w-px bg-[#E5E7EB]" />
          <div className="relative flex">
            <button type="button" onClick={() => openSave('publish')} className="h-8 rounded-l bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">Publish</button>
            <button type="button" aria-label="Save options" onClick={() => setMenu(menu === 'publish' ? null : 'publish')} className="flex h-8 w-8 items-center justify-center rounded-r border-l border-white/30 bg-[#3D8BD0] text-white transition-colors hover:bg-[#3478B5]"><ChevronDown size={15} /></button>
            {menu === 'publish' && (
              <Menu>
                <MenuItem title="Save & Publish" sub="Save changes and make it live" onClick={() => openSave('publish')} />
                <MenuItem title="Save as draft" sub="Save changes without publishing" onClick={() => openSave('save')} />
              </Menu>
            )}
          </div>
          <div className="relative">
            <button type="button" aria-label="More actions" onClick={() => setMenu(menu === 'more' ? null : 'more')} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:bg-[#F9FAFB]"><MoreVertical size={15} /></button>
            {menu === 'more' && (
              <Menu>
                <MenuItem icon={<Copy size={15} />} title="Duplicate workflow" onClick={() => { setMenu(null); const c = workflowStore.duplicate(record.id); if (c) { toast.success(`Duplicated as “${c.name}”`); onOpen(c.id); } }} />
                <MenuItem icon={<Trash2 size={15} />} danger title="Delete workflow" onClick={() => { setMenu(null); workflowStore.remove(record.id); toast.success(`“${record.name}” deleted`); onClose(); }} />
              </Menu>
            )}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {/* The builder stays mounted while Node is showing, so switching views keeps its state. */}
        <div className="wfl-scope wfl-root absolute inset-0" data-theme="light" hidden={view !== 'linear'}>
          <BuilderPane initial={initial} />
        </div>
        {view === 'node' && (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#F7F9FB] text-center">
            <Network size={28} className="text-[#A5BAD0]" />
            <div className="text-[14px] font-semibold text-[#364658]">Node view is next</div>
            <div className="max-w-[360px] text-[13px] text-[#7B8FA5]">It is being rebuilt on React Flow over the same workflow, so switching views will keep every step.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ⚠️ MEMOISED, and it must stay that way. Every builder edit writes to the store, which re-renders this
   page; without memo that render reached the builder too, and the builder's canvas pieces are components
   declared INSIDE its App, so each App render REMOUNTS them. The guided trigger chain then lost the element
   it had anchored its next picker to (pick "When a record is created" → the record picker never opened).
   `initial` is a ref read once at open, so this renders exactly once per editor. */
const BuilderPane = memo(function BuilderPane({ initial }: { initial: WorkflowRecord }) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center gap-2 text-[13px] text-[#7B8FA5]"><Loader2 size={16} className="animate-spin" /> Loading the builder…</div>}>
      <LinearBuilder initialDoc={initial.doc} initialName={initial.name} initialDesc={initial.description} initialPublished={initial.status === 'Published'} />
    </Suspense>
  );
});

function Menu({ children }: { children: React.ReactNode }) {
  return <div className="absolute right-0 top-full z-50 mt-1 w-[264px] rounded-md border border-[#E5E7EB] bg-white p-1 shadow-lg">{children}</div>;
}

function MenuItem({ title, sub, icon, danger, onClick }: { title: string; sub?: string; icon?: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left transition-colors hover:bg-[#F5F7FA] ${danger ? 'text-[#DC2626]' : 'text-[#364658]'}`}>
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{title}</span>
        {sub && <span className="block text-[12px] text-[#7B8FA5]">{sub}</span>}
      </span>
    </button>
  );
}
