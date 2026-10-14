/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Laptop, Monitor as MonitorIcon, Search, Server, User, AppWindow, HardDrive, Network, Users, Package, X } from 'lucide-react';
import type { RelType, ExtraRelChild } from './RelationshipGraph';

/* Add Relationship side panel (Relationship topology): pick Direct/Inverse, a Relation and a
 * Target Type; a searchable, paginated list of that type's records appears; the checked rows
 * are added to the topology as children of the source node with the chosen relation label. */

export const REL_RELATIONS = [
  'Depends On', 'Depended On By', 'Users', 'Used By', 'Uses', 'Send Data to', 'Receives Data From',
  'Runs', 'Runs On', 'Hosts', 'Hosted On', 'Connected to', 'Subscribes to', 'Impacts', 'Impacted By',
  'Submits', 'Supports', 'Author of', 'Enables', 'Includes', 'Contains', 'Located In',
  'Exchanges data with', 'Manages', 'Managed by', 'Monitors', 'Monitored By', 'Virtualized by',
  'Is Edited by', 'Backs Up', 'Backed Up by', 'Powers', 'Powered By', 'Replicates To', 'Fails Over To',
  'Owns', 'Owned By', 'Member Of', 'Provides', 'Consumes',
];

const TARGET_TYPES = ['Hardware Asset', 'Software Asset', 'Non-IT Asset', 'Consumable Asset', 'CI', 'Department', 'Technician', 'Requester', 'User Group'] as const;
type TargetType = (typeof TARGET_TYPES)[number];

// Types collapse into the 4 color groups: Assets / Users / CI / Department.
const TARGET_TO_RELTYPE: Record<TargetType, RelType> = {
  'Hardware Asset': 'hardware',
  'Software Asset': 'software',
  'Non-IT Asset': 'hardware',
  'Consumable Asset': 'hardware',
  'CI': 'asset',
  'Department': 'department',
  'Technician': 'user',
  'Requester': 'user',
  'User Group': 'user',
};

const LIST_TITLES: Record<TargetType, { title: string; scope: string }> = {
  'Hardware Asset': { title: 'Hardware Assets', scope: 'All Hardware IT Assets' },
  'Software Asset': { title: 'Software Assets', scope: 'All Software Assets' },
  'Non-IT Asset': { title: 'Non-IT Assets', scope: 'All Non-IT Assets' },
  'Consumable Asset': { title: 'Consumable Assets', scope: 'All Consumable Assets' },
  'CI': { title: 'Configuration Items', scope: 'All CI' },
  'Department': { title: 'Departments', scope: 'All Departments' },
  'Technician': { title: 'Technicians', scope: 'All Technicians' },
  'Requester': { title: 'Requesters', scope: 'All Requesters' },
  'User Group': { title: 'User Groups', scope: 'All User Groups' },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

interface Row { id: string; name: string; kind: string; icon: React.ReactNode; status: string; statusDot: string; created: string }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function mockDate(seed: number): string {
  const mm = ['09:29 AM', '11:18 AM', '12:25 PM', '05:37 PM', '11:44 AM', '03:57 PM', '10:53 PM'][seed % 7];
  return `${DAYS[seed % 7]}, ${MONTHS[seed % 6]} ${(seed % 27) + 1}, 2026 ${mm}`;
}

/* Deterministic mock rows per target type — replace with an API search later. */
function rowsFor(target: TargetType): Row[] {
  const h0 = hash(target);
  const count = 34 + (h0 % 30);
  const out: Row[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hash(`${target}|${i}`);
    const inUse = seed % 3 !== 0;
    const status = inUse ? 'In Use' : 'Available';
    const statusDot = inUse ? '#22A06B' : '#9CA3AF';
    if (target === 'Hardware Asset') {
      const kinds = [
        { k: 'Windows Laptop', p: 'LAP', icon: <Laptop size={15} /> },
        { k: 'Windows Desktop', p: 'COMPAST', icon: <MonitorIcon size={15} /> },
        { k: 'UNIX Server', p: 'COMPAST', icon: <Server size={15} /> },
        { k: 'Hardware', p: 'AST', icon: <HardDrive size={15} /> },
      ][seed % 4];
      const names = ['DESKTOP-7ABJPOF', 'Utkarshs-Mac', 'sanatpatel 10.20.40.12', 'Rizvan-Mansuri 10.2.4.9', 'Dikshika-Aaswani', `192.168.1.${(seed % 60) + 2} Hardware`, 'Misha-kotadiya', 'motadata 172.16.10.4'][seed % 8];
      out.push({ id: `${kinds.p}-${6700 + (seed % 120)}`, name: names, kind: kinds.k, icon: kinds.icon, status, statusDot, created: mockDate(seed) });
    } else if (target === 'Software Asset') {
      const names = ['nginx', 'PostgreSQL', 'Redis', 'Docker Desktop', 'MS Office 365', 'Chrome Enterprise', 'Zoom Client', 'Slack', 'IntelliJ IDEA', 'Adobe Acrobat'][seed % 10];
      out.push({ id: `SWAST-${20000 + (seed % 9000)}`, name: names, kind: 'Software', icon: <AppWindow size={15} />, status: 'Active', statusDot: '#22A06B', created: mockDate(seed) });
    } else if (target === 'CI') {
      const names = ['DC1-APP-ERP-01', 'DC1-SW-CORE-02', 'PROD-DB-CLUSTER', 'EDGE-FW-01', 'K8S-NODE-07', 'DC2-LB-01'][seed % 6];
      out.push({ id: `CI-${100 + (seed % 800)}`, name: names, kind: 'Server', icon: <Network size={15} />, status: 'Operational', statusDot: '#22A06B', created: mockDate(seed) });
    } else if (target === 'Non-IT Asset' || target === 'Consumable Asset') {
      const names = target === 'Non-IT Asset'
        ? ['Office Chair — Ergo', 'Projector EPSON X41', 'Conference Table', 'AC Unit — Daikin', 'Whiteboard 6x4'][seed % 5]
        : ['HP 206A Toner', 'USB-C Cable 1m', 'AA Batteries (24)', 'Keyboard — Logitech', 'Mouse — Dell MS116'][seed % 5];
      out.push({ id: `${target === 'Non-IT Asset' ? 'NON' : 'CON'}-${4000 + (seed % 900)}`, name: names, kind: target.replace(' Asset', ''), icon: <Package size={15} />, status, statusDot, created: mockDate(seed) });
    } else if (target === 'Department' || target === 'User Group') {
      const names = target === 'Department'
        ? ['IT Operations', 'Finance', 'Engineering', 'Human Resources', 'Sales', 'Marketing', 'Legal'][seed % 7]
        : ['L1 Support', 'L2 Network', 'Server Admins', 'Security Team', 'Field Techs'][seed % 5];
      out.push({ id: `${target === 'Department' ? 'DEP' : 'GRP'}-${100 + (seed % 200)}`, name: names, kind: target, icon: <Users size={15} />, status: 'Active', statusDot: '#22A06B', created: mockDate(seed) });
    } else {
      const names = ['Tabrez Khan', 'Rohan Mehta', 'Neha Rao', 'Farah Shah', 'Vikram Singh', 'Priya Nair', 'Amit Joshi', 'Kiran Desai'][seed % 8];
      out.push({ id: `USR-${1000 + (seed % 900)}`, name: names, kind: target, icon: <User size={15} />, status: 'Active', statusDot: '#22A06B', created: mockDate(seed) });
    }
  }
  // De-dupe by id (hash collisions), keep the list stable.
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/* Searchable select (Relation / Target Type) — button + dropdown with a search field. */
function SearchSelect({ label, value, options, onSelect, width }: { label: string; value: string | null; options: readonly string[]; onSelect: (v: string) => void; width?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className={`relative ${width ?? ''}`}>
      <div className="mb-1.5 text-[13px] font-medium text-[#64748B]">{label} <span className="text-[#EF4444]">*</span></div>
      <button
        onClick={() => { setOpen((v) => !v); setQ(''); }}
        className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-[13px] transition-colors ${open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#B9C4D4]'} ${value ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}
      >
        {value ?? 'Select'}
        <ChevronDown size={15} className={`text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="app-menu absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
            <div className="relative m-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-8 w-full rounded border border-[#DFE5ED] pl-3 pr-8 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
              />
              <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
            <div className="max-h-[280px] overflow-y-auto pb-1">
              {filtered.map((o) => (
                <button
                  key={o}
                  onClick={() => { onSelect(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] transition-colors ${value === o ? 'bg-[#EAF2FB] text-[#3D8BD0] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                >
                  {o}
                  {value === o && <Check size={14} className="text-[#3D8BD0]" />}
                </button>
              ))}
              {!filtered.length && <div className="px-3.5 py-3 text-[12px] text-[#9CA3AF]">No matches</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AddRelationshipPanel({ sourceName, onClose, onAdd }: { sourceName: string; onClose: () => void; onAdd: (items: ExtraRelChild[]) => void }) {
  const [relKind, setRelKind] = useState<'Direct' | 'Inverse'>('Direct');
  const [relation, setRelation] = useState<string | null>(null);
  const [target, setTarget] = useState<TargetType | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allRows = useMemo(() => (target ? rowsFor(target) : []), [target]);
  const rows = allRows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const cur = Math.min(page, pages);
  const pageRows = rows.slice((cur - 1) * perPage, cur * perPage);
  const allPageChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const togglePage = () => setSelected((p) => {
    const n = new Set(p);
    if (allPageChecked) pageRows.forEach((r) => n.delete(r.id));
    else pageRows.forEach((r) => n.add(r.id));
    return n;
  });

  const doAdd = () => {
    if (!relation || !target || !selected.size) return;
    const type = TARGET_TO_RELTYPE[target];
    // Inverse flips the reading direction; label it so the edge shows e.g. "Uses (Inverse)".
    const rel = relKind === 'Inverse' ? `${relation} (Inverse)` : relation;
    onAdd(allRows.filter((r) => selected.has(r.id)).map((r) => ({ label: r.name, type, rel })));
  };

  return (
    <>
      <div className="fixed inset-0 z-[10004] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10005] flex h-full w-[880px] max-w-[96vw] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="min-w-0 truncate text-[17px] font-semibold text-[#111827]">Add Relationship To <span className="text-[#3D8BD0]">{sourceName}</span></h2>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Relationship Type */}
          <div className="mb-5">
            <div className="mb-1.5 text-[13px] font-medium text-[#64748B]">Relationship Type <span className="text-[#EF4444]">*</span></div>
            <div className="inline-flex rounded-md bg-[#F1F3F6] p-0.5">
              {(['Direct', 'Inverse'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRelKind(k)}
                  className={`rounded px-4 py-1.5 text-[13px] font-medium transition-colors ${relKind === k ? 'bg-[#3D8BD0] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#364658]'}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Relation + Target Type */}
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SearchSelect label="Relation" value={relation} options={REL_RELATIONS} onSelect={setRelation} />
            <SearchSelect label="Target Type" value={target} options={TARGET_TYPES} onSelect={(v) => { setTarget(v as TargetType); setSelected(new Set()); setPage(1); setQ(''); }} />
          </div>

          {/* Record list — appears once a Target Type is chosen */}
          {target && (
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold text-[#111827]">{LIST_TITLES[target].title}</h3>
                <span className="inline-flex items-center gap-1 text-[12.5px] text-[#7B8FA5]">{LIST_TITLES[target].scope} <ChevronDown size={13} /></span>
              </div>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Select field or enter a keyword to search..."
                className="mb-3 h-9 w-full rounded border border-[#DFE5ED] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
              />
              <table className="w-full text-left text-[12px]">
                <thead className="bg-white border-b border-[#e5e7eb]">
                  <tr>
                    <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allPageChecked} onChange={togglePage} className="size-3.5 accent-[#3D8BD0]" /></th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Asset Type</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  {pageRows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected((p) => { const n = new Set(p); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })}
                      className={`cursor-pointer transition-colors ${selected.has(r.id) ? 'bg-[#EAF2FB]/60' : 'hover:bg-[#F9FAFB]'}`}
                    >
                      <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(r.id)} onChange={() => {}} className="size-3.5 accent-[#3D8BD0]" /></td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex max-w-full items-center gap-2">
                          <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0] flex-shrink-0">{r.id}</span>
                          <span className="truncate text-[#364658]">{r.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="text-[#7B8FA5]">{r.icon}</span>{r.kind}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="size-2 rounded-full" style={{ backgroundColor: r.statusDot }} />{r.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#64748B]">{r.created}</td>
                    </tr>
                  ))}
                  {!pageRows.length && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">No records match your search</td></tr>
                  )}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="mt-3 flex items-center gap-3 text-[12.5px] text-[#7B8FA5]">
                <div className="flex items-center gap-1">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[28px] rounded border px-1.5 py-1 text-[12.5px] transition-colors ${cur === p ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0] font-medium' : 'border-[#DFE5ED] text-[#64748B] hover:bg-[#F5F7FA]'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }} className="h-7 rounded border border-[#DFE5ED] px-1.5 text-[12.5px] text-[#364658] outline-none">
                  {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>Items Per Page</span>
                <span className="ml-auto">Showing {rows.length ? (cur - 1) * perPage + 1 : 0}-{Math.min(cur * perPage, rows.length)} of {rows.length} items</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#E5E7EB] px-6 py-4">
          <span className="mr-auto text-[12.5px] text-[#7B8FA5]">{selected.size ? `${selected.size} selected` : ''}</span>
          <button onClick={onClose} className="rounded border border-[#DFE5ED] px-4 py-2 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={doAdd}
            disabled={!relation || !target || !selected.size}
            className={`rounded px-4 py-2 text-[13px] font-medium text-white transition-colors ${!relation || !target || !selected.size ? 'cursor-not-allowed bg-[#B9C4D4]' : 'bg-[#3D8BD0] hover:bg-[#2F7AB8]'}`}
          >
            Add
          </button>
        </div>
      </div>
    </>
  );
}
