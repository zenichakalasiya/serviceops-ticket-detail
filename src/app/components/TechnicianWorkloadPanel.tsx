import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { Pagination } from './Pagination';

/* The whole technician roster behind the dashboard's workload card. The card can only ever
   show a handful of bars; this is where a lead finds ONE person on a 100+ roster, or sees
   who is free to take work. Search narrows it, the columns sort, and paging handles
   whatever size the roster really is. */

export interface TechRow {
  name: string;
  initials: string;
  group: string;
  open: number;
  breached: number;
  dueToday: number;
}

type SortKey = 'open' | 'breached' | 'dueToday';

export function TechnicianWorkloadPanel({
  rows,
  onClose,
  onPick,
}: {
  rows: TechRow[];
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('open');
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // A narrowed list must never leave the pager on a page that no longer exists.
  useEffect(() => setPage(1), [search, perPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = search.trim().toLowerCase();
  const filtered = rows
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.group.toLowerCase().includes(q))
    .sort((a, b) => (desc ? b[sort] - a[sort] : a[sort] - b[sort]) || a.name.localeCompare(b.name));
  const maxOpen = Math.max(...rows.map((r) => r.open), 1);
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const sortHeader = (key: SortKey, label: string) => (
    <th
      onClick={() => {
        if (sort === key) setDesc((v) => !v);
        else {
          setSort(key);
          setDesc(true);
        }
      }}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-right text-[12px] font-semibold tracking-wider transition-colors hover:text-[#3D8BD0] ${
        sort === key ? 'text-[#3D8BD0]' : 'text-[#364658]'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === key && (desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
      </span>
    </th>
  );

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[10001] flex w-[820px] max-w-[94vw] flex-col bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="min-w-0 truncate text-[16px] font-semibold text-[#364658]">
            Technician workload
            <span className="font-normal text-[#7B8FA5]"> — {rows.length} technicians</span>
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
          >
            <X size={16} className="text-[#64748B]" />
          </button>
        </div>

        <div className="flex-shrink-0 px-6 pt-4">
          <div className="flex h-9 items-center gap-2 rounded border border-[#d1d5db] bg-white px-3">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search technicians..."
              className="h-full min-w-0 flex-1 text-[13px] text-[#364658] outline-none placeholder:text-[#9ca3af]"
            />
            {search ? (
              <button onClick={() => setSearch('')} className="flex-shrink-0 text-[#9ca3af] transition-colors hover:text-[#364658]">
                <X size={14} />
              </button>
            ) : (
              <Search size={15} className="flex-shrink-0 text-[#9ca3af]" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">
                  Technician
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">
                  Group
                </th>
                {sortHeader('open', 'Open')}
                {sortHeader('breached', 'Breached')}
                {sortHeader('dueToday', 'Due today')}
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">
                  Load
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-[13px] text-[#9CA3AF]">
                    No technicians match.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.name} onClick={() => onPick(r.name)} className="cursor-pointer transition-colors hover:bg-[#f9fafb]">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                          {r.initials}
                        </span>
                        <span className="text-[12px] font-medium text-[#364658]">{r.name}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#64748B]">{r.group}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums text-[#364658]">
                      {r.open}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums">
                      {r.breached ? (
                        <span className="font-semibold text-[#EF4444]">{r.breached}</span>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums">
                      {r.dueToday ? (
                        <span className="font-medium text-[#B45309]">{r.dueToday}</span>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex h-1.5 w-[120px] overflow-hidden rounded-full bg-[#F1F5F9]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(r.open / maxOpen) * 100}%`,
                            backgroundColor: r.breached ? '#EF4444' : r.open ? '#3D8BD0' : 'transparent',
                          }}
                        />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Outside the scroll region, so it pins to the panel's bottom edge. */}
        <div className="flex-shrink-0 border-t border-[#E5E7EB] bg-white">
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(filtered.length / perPage))}
            itemsPerPage={perPage}
            totalItems={filtered.length}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        </div>
      </div>
    </>
  );
}
