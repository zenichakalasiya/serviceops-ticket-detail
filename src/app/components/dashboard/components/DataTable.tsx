/**
 * DataTable — the Shortcut tiles' table.
 * The Vue prototype used TanStack Table (headless). @tanstack/react-table is not installed here, so
 * this port implements the same behaviours itself: a global "includes" search over string/number
 * cells, header-click sorting (asc → desc → unsorted, so the user can get back; a numeric column
 * starts at desc, as TanStack's auto sort direction does), and the empty states.
 *
 * Rows stay the mock shape: columns = string[], rows = cell[][].
 * Cell rendering is delegated to the parent via `slotCell({ value })` (the Vue #cell slot).
 */
import { useMemo, useState } from 'react';
import { Icon } from '../ui/primitives';
import './DataTable.css';

const isNum = (v: any) => typeof v === 'number';
function cmp(a: any, b: any) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (isNum(a) && isNum(b)) return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function DataTable({
  columns = [], rows = [], search = '', sortable = true,
  /* Row filtering happens in the PARENT (TableFilterBar owns typed conditions, and one matcher
   * serves both the tile and the full-screen view). This flag only tells the empty state WHY the
   * table is empty — "no match" vs "no records". */
  filtered = false,
  emptyText = 'No records in this range',
  onClearFilters, slotCell,
}: any) {
  const [sorting, setSorting] = useState<{ id: number; desc: boolean } | null>(null);

  const rowModel = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    let list = (rows as any[]).map((r, i) => ({ id: i, cells: r }));
    if (q) list = list.filter((r) => r.cells.some((c: any) => (typeof c === 'string' || isNum(c)) && String(c).toLowerCase().includes(q)));
    if (sorting) {
      const i = sorting.id;
      list = list.slice().sort((a, b) => (sorting.desc ? -1 : 1) * cmp(a.cells[i], b.cells[i]));
    }
    return list;
  }, [rows, search, sorting]);

  const sortOf = (i: number): false | 'asc' | 'desc' => (sorting && sorting.id === i ? (sorting.desc ? 'desc' : 'asc') : false);
  function toggleSorting(i: number) {
    const firstDesc = isNum(rows[0]?.[i]);
    const cur = sortOf(i);
    if (!cur) setSorting({ id: i, desc: firstDesc });
    else if ((cur === 'desc') === firstDesc) setSorting({ id: i, desc: !firstDesc });
    else setSorting(null); // enableSortingRemoval
  }

  const isEmpty = rowModel.length === 0;
  return (
    <table className="dc-DataTable">
      <thead>
        <tr>
          {(columns as string[]).map((c, i) => {
            const s = sortOf(i);
            return (
              <th
                key={i}
                className={[sortable ? 'srt' : '', s ? 'on' : ''].filter(Boolean).join(' ')}
                aria-sort={s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none'}
                onClick={() => sortable && toggleSorting(i)}
              >
                <span className="th-in">
                  {/* the label needs its own box to truncate inside: the th's ellipsis can't
                      reach into an inline-flex child, and the sort caret must stay visible */}
                  <span className="th-lbl">{c}</span>
                  {sortable && <Icon className={`sc ${s ? 'vis' : ''}`} name={s === 'desc' ? 'sort-desc' : 'sort-asc'} size={13} />}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rowModel.map((row) => (
          <tr key={row.id}>
            {(columns as string[]).map((_, ci) => {
              const value = row.cells[ci];
              return <td key={ci}>{slotCell ? slotCell({ value }) : value}</td>;
            })}
          </tr>
        ))}
        {isEmpty && (
          <tr>
            <td colSpan={columns.length} className="nodata">
              {filtered ? (
                <>
                  No records match these filters
                  <button className="clr" onClick={() => onClearFilters?.()}>Clear filters</button>
                </>
              ) : search ? 'No records match your search' : emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
