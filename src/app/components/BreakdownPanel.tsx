import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { Pagination } from './Pagination';

/* The full list behind a dashboard breakdown card. A card can only ever show its top few
   rows; this is where the rest live once a customer has 30 departments (or 40 categories,
   or every intake source). Deliberately generic — label, count, share — so any breakdown
   card can open one instead of each growing its own popup. */

export interface BreakdownRow {
  label: string;
  value: number;
}

export function BreakdownPanel({
  title,
  subject,
  columnLabel,
  countLabel = 'Requests',
  rows,
  onClose,
  onPick,
}: {
  title: string;
  /** Plural noun for the header count, e.g. "departments". */
  subject: string;
  /** Heading over the name column, e.g. "Department". */
  columnLabel: string;
  /** Heading over the count column — the asset dashboards pass "Assets" etc. */
  countLabel?: string;
  rows: BreakdownRow[];
  onClose: () => void;
  onPick?: (label: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [byName, setByName] = useState(false);
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => setPage(1), [search, perPage]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = rows.reduce((n, r) => n + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const q = search.trim().toLowerCase();
  const filtered = rows
    .filter((r) => !q || r.label.toLowerCase().includes(q))
    .sort((a, b) => (byName ? (desc ? -1 : 1) * a.label.localeCompare(b.label) : (desc ? b.value - a.value : a.value - b.value)));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const header = (name: boolean, label: string, align: string) => (
    <th
      onClick={() => {
        if (byName === name) setDesc((v) => !v);
        else {
          setByName(name);
          setDesc(!name);
        }
      }}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 ${align} text-[12px] font-semibold tracking-wider transition-colors hover:text-[#3D8BD0] ${
        byName === name ? 'text-[#3D8BD0]' : 'text-[#364658]'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {byName === name && (desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
      </span>
    </th>
  );

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[10001] flex w-[720px] max-w-[94vw] flex-col bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="min-w-0 truncate text-[16px] font-semibold text-[#364658]">
            {title}
            <span className="font-normal text-[#7B8FA5]">
              {' '}
              — {rows.length} {subject}
            </span>
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
              placeholder={`Search ${subject}...`}
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
                {header(true, columnLabel, 'text-left')}
                {header(false, countLabel, 'text-right')}
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-12 text-center text-[13px] text-[#9CA3AF]">
                    Nothing matches.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr
                    key={r.label}
                    onClick={onPick ? () => onPick(r.label) : undefined}
                    className={`transition-colors ${onPick ? 'cursor-pointer hover:bg-[#f9fafb]' : ''}`}
                  >
                    <td className="px-3 py-2.5 text-[12px] font-medium text-[#364658]">{r.label}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums text-[#364658]">
                      {r.value}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="flex h-1.5 w-[130px] overflow-hidden rounded-full bg-[#F1F5F9]">
                          <span className="block h-full rounded-full bg-[#3D8BD0]" style={{ width: `${(r.value / max) * 100}%` }} />
                        </span>
                        <span className="w-9 text-right text-[11px] tabular-nums text-[#94A3B8]">
                          {total ? Math.round((r.value / total) * 100) : 0}%
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
