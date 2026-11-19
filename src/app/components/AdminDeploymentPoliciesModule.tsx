import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react';
import { Pagination } from './Pagination';
import { DeploymentPolicyEditor } from './DeploymentPolicyEditor';
import { policyStore, rebootText, scheduleText, useDeploymentPolicies, windowText } from './deploymentPolicyData';
import type { DeploymentPolicy } from './deploymentPolicyData';

/* Deployment Policies — Admin › Patch Management › Deployment Management (Zeni, 18 Nov 2026).
 * The standard admin listing (OS Upgrade / Form Rules): head, search + CTA, a full-bleed table.
 * Create and Edit open the full-page editor, in whichever layout the V1 | V2 | V3 pill holds. */

const th = 'whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';
const REBOOT_DOT: Record<string, string> = { 'No reboot': '#94A3B8' };

export function AdminDeploymentPoliciesModule({ onEditor }: { onEditor?: (open: boolean) => void }) {
  const policies = useDeploymentPolicies();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  /** null = closed; 0 = a new policy; any other number = that policy. */
  const [editing, setEditing] = useState<number | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);

  useEffect(() => { onEditor?.(editing !== null); }, [editing, onEditor]);
  useEffect(() => () => onEditor?.(false), [onEditor]);

  const q = search.trim().toLowerCase();
  const rows = policies.filter((p) => !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const remove = (p: DeploymentPolicy) => {
    const at = policies.findIndex((x) => x.id === p.id);
    policyStore.remove(p.id);
    toast.success(`Deleted “${p.name}”`, { action: { label: 'Undo', onClick: () => policyStore.restore(p, at) } });
  };
  const duplicate = (p: DeploymentPolicy) => {
    const c = policyStore.duplicate(p.id);
    if (c) { setFresh(c.id); toast.success(`Duplicated “${p.name}”`); }
  };

  if (editing !== null) {
    return (
      <DeploymentPolicyEditor
        policy={editing ? policyStore.get(editing) : undefined}
        onClose={() => setEditing(null)}
        onSaved={(p) => { setFresh(p.id); setEditing(null); setPage(1); }}
      />
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-semibold text-[#364658]">Deployment Policies</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
            Set when patches install, how users are notified, and what runs before and after deployment.{' '}
            <button onClick={() => toast.success('Opening the Deployment Policy documentation')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={12} /></button>
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>}
        </div>
        <button title="Refresh" onClick={() => toast.success('Policies refreshed')} className={iconBtn + ' border border-[#DFE5ED]'}><RotateCw size={15} /></button>
        <button onClick={() => setEditing(0)} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">
          <Plus size={14} />Create Deployment Policy
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Fixed columns: the Action icons must never be pushed past the edge of the page. */}
        <table className="w-full min-w-[960px] table-fixed">
          <colgroup><col /><col className="w-[17%]" /><col className="w-[17%]" /><col className="w-[140px]" /><col className="w-[120px]" /><col className="w-[140px]" /><col className="w-[136px]" /></colgroup>
          <thead className="border-b border-[#e5e7eb]">
            <tr>{['Name', 'Schedule', 'Deployment Window', 'Reboot', 'Used By', 'Last Modified', 'Action'].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No policies match “{search}”.</td></tr>
            ) : pageRows.map((p) => {
              const reboot = rebootText(p);
              return (
                <tr key={p.id} className={'transition-colors hover:bg-[#f9fafb] ' + (p.id === fresh ? 'bg-[#F5FAFF]' : '')}>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(p.id)} className="block max-w-full truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={p.name}>{p.name}</button>
                    {p.desc && <div className="truncate text-[12px] text-[#7B8FA5]" title={p.desc}>{p.desc}</div>}
                  </td>
                  <td className="truncate px-4 py-3 text-[13px] text-[#364658]" title={scheduleText(p)}>{scheduleText(p)}</td>
                  <td className="truncate px-4 py-3 text-[13px] text-[#364658]" title={windowText(p)}>{windowText(p)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">
                    <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: REBOOT_DOT[reboot] ?? (p.postWhen === 'always' ? '#E67E22' : '#3D8BD0') }} />{reboot}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-[#364658]">{p.applied ? `${p.applied} deployment${p.applied === 1 ? '' : 's'}` : <span className="text-[#9CA3AF]">Not used</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{p.mod}<div className="text-[12px] text-[#7B8FA5]">by {p.by}</div></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Edit" onClick={() => setEditing(p.id)} className={iconBtn}><Pencil size={15} /></button>
                      <button title="Duplicate" onClick={() => duplicate(p)} className={iconBtn}><Copy size={15} /></button>
                      {/* A disabled button swallows the pointer, so its reason sits on a wrapper. */}
                      <span title={p.applied ? `Used by ${p.applied} deployment${p.applied === 1 ? '' : 's'} — remove it from them first` : 'Delete'}>
                        <button disabled={!!p.applied} onClick={() => remove(p)} aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2] disabled:pointer-events-none disabled:text-[#CBD5E1]"><Trash2 size={15} /></button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} itemsPerPage={perPage} totalItems={rows.length} onPageChange={setPage} onItemsPerPageChange={(v) => { setPerPage(v); setPage(1); }} />
    </div>
  );
}
