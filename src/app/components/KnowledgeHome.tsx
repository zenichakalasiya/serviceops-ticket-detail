/* ── Knowledge landing ───────────────────────────────────────────────────────
   What the reader sees before they pick a folder. The product shows this as two
   stacked grids — Most Read above Most Helpful — which spends two sets of table
   chrome, two pagers and a scroll to say one thing: here are the articles worth
   reading. This is ONE ranked list with the ranking as a switch, so both answers
   cost one surface and no scrolling.

   It is rendered as a GRID, with the folder view's own table chrome — same heading
   row, same row height, same id pill, same author chip, same sort affordance on every
   column — so landing on Knowledge and opening a folder look like one product.

   Two jobs, kept apart: the SWITCH says which eight articles are in the card (the top
   eight by reads, or by feedback), and the COLUMN SORT says how those eight are
   ordered. Rows open the article. */
import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Folder, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useDrawerStack } from './DrawerStack';
import { knowledgeToPatchShape, mockKnowledgeArticles } from './KnowledgeListPage';
import { COUNT_CHIP } from './TicketTable';
import { fmtGridDateTime } from './dateFormat';
import type { Ticket } from './TicketListPage';

type Rank = 'read' | 'helpful';
type ColKey = 'id' | 'name' | 'folder' | 'author' | 'reads' | 'feedback' | 'created';

/* Two shortlists, both answering "worth reading": most opened, and most voted up. Age is
   not one of them — a new article is not yet a top article — so Created Date is a column
   you can sort by, not a way to pick the eight. */
const TABS: { key: Rank; label: string; hint: string }[] = [
  { key: 'read', label: 'Most read', hint: 'Opened most often by readers' },
  { key: 'helpful', label: 'Most helpful', hint: 'Voted up most by readers' },
];

type Row = Ticket & Record<string, any>;

/* One row per column: its width, its heading, the value everything sorts on, and — for the
   three metric columns — the ranking it belongs to, so clicking the heading also swaps the
   eight articles the card is showing. */
const COLS: {
  key: ColKey; label: string; w?: number; text?: boolean; rank?: Rank;
  value: (r: Row) => number | string;
}[] = [
  { key: 'id', label: 'ID', w: 104, value: (r) => Number(String(r.id).replace(/\D+/g, '')) || 0 },
  { key: 'name', label: 'Name', text: true, value: (r) => r.subject ?? '' },
  { key: 'folder', label: 'Folder', w: 190, text: true, value: (r) => r.x_folder ?? '' },
  { key: 'author', label: 'Author', w: 176, text: true, value: (r) => r.assignedTo?.name ?? '' },
  { key: 'reads', label: 'Reads', w: 106, rank: 'read', value: (r) => r.x_totalRead ?? 0 },
  { key: 'feedback', label: 'Feedback', w: 124, rank: 'helpful', value: (r) => r.x_likes ?? 0 },
  { key: 'created', label: 'Created Date', w: 156, value: (r) => r.createdBy?.getTime?.() ?? 0 },
];

/* The grid's own heading and cell recipes, lifted from TicketTable so the two tables cannot
   drift apart. The type is restated on the sort button because theme.css's global `button`
   rule sets its own font-size/weight — a heading inside one does NOT inherit the row's. */
const TH = 'group/th px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B] whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-[#F7F9FB] hover:text-[#364658]';
const TD = 'overflow-hidden px-4 py-3 whitespace-nowrap';

/* The house format, like every other listing — see dateFormat.ts. Date AND time, because
   this column is called "Created Date" and that is what it shows on every other module;
   one column name should not mean two different things. (It used to call
   toLocaleDateString with an en-GB override, which drifts the moment anyone changes the
   locale or the options.) */
const fmtDate = fmtGridDateTime;

export function KnowledgeHome({ rows }: { rows: Ticket[] }) {
  /* Which eight are in the card … */
  const [rank, setRank] = useState<Rank>('read');
  /* … and how those eight are ordered. */
  const [sort, setSort] = useState<{ key: ColKey; dir: 'asc' | 'desc' }>({ key: 'reads', dir: 'desc' });
  const { open } = useDrawerStack();

  /* Published only. A digest of what to read should not be recommending drafts, articles
     still in review, or ones that have expired — which is also why the rows carry no status. */
  const all = (rows as Row[]).filter((x) => (x.status as string) === 'Published');

  const metric = (r: Row) => (rank === 'read' ? r.x_totalRead ?? 0 : r.x_likes ?? 0);
  const pool = [...all].sort((a, b) => metric(b) - metric(a)).slice(0, 8);

  const col = COLS.find((c) => c.key === sort.key)!;
  const ranked = [...pool].sort((a, b) => {
    const av = col.value(a);
    const bv = col.value(b);
    const d = col.text ? String(av).localeCompare(String(bv)) : Number(av) - Number(bv);
    return sort.dir === 'asc' ? d : -d;
  });

  const openArticle = (row: Ticket) => {
    const a = mockKnowledgeArticles.find((x) => x.id === row.id);
    if (a) open('knowledge', a.id, a.name, knowledgeToPatchShape(a));
  };

  /* Click a heading to sort by it; click it again to reverse. Text starts A–Z, numbers and
     dates start with the biggest — the answer people want first in each case. A metric
     heading also re-ranks the card, so the eight rows and the order always agree. */
  const toggleSort = (c: (typeof COLS)[number]) => {
    if (c.rank) setRank(c.rank);
    setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: c.text ? 'asc' : 'desc' }));
  };

  return (
    /* pl-6 / pr-4 — the asset dashboards' frame. The grid's scroll area reserves a
       gutter on the right, so an even px-6 would stop the card short of the toolbar;
       4 less on that side lands its edge under the Create button. */
    <div className="pb-8 pl-6 pr-4 pt-1">
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Top articles</h2>
            <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
              {TABS.find((x) => x.key === rank)?.hint} · pick a folder on the left to browse the rest
            </p>
          </div>
          {/* One switch instead of a second table — the same card, two shortlists. */}
          <div className="inline-flex flex-shrink-0 items-center gap-0.5 rounded border border-[#DFE5ED] bg-white p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setRank(tab.key);
                  const c = COLS.find((x) => x.rank === tab.key)!;
                  setSort({ key: c.key, dir: 'desc' });
                }}
                className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  rank === tab.key ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* The folder view's grid, one table wide: fixed layout so Name takes the slack and
            the metric columns stay put as the order changes. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              {COLS.map((c) => <col key={c.key} style={c.w ? { width: c.w } : undefined} />)}
            </colgroup>
            <thead>
              <tr className="bg-white shadow-[inset_0_-1px_0_#E5E7EB,inset_0_1px_0_#E5E7EB]">
                {COLS.map((c) => {
                  const on = sort.key === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c)}
                      title={on ? `Sorted ${sort.dir === 'asc' ? 'ascending' : 'descending'} — click to reverse` : `Sort by ${c.label}`}
                      className={TH}
                    >
                      {/* Every column reads from the same left edge, headings included —
                          one scan line down the table. */}
                      <span className="flex items-center gap-0.5 overflow-hidden">
                        <span className="truncate">{c.label}</span>
                        {/* The grid's sort control: grey and offered on hover, blue and
                            pinned once the column is the one being sorted. */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSort(c); }}
                          title={on ? `Sorted ${sort.dir === 'asc' ? 'ascending' : 'descending'} — click to reverse` : 'Sort'}
                          className={`flex h-5 flex-shrink-0 items-center justify-center rounded px-0.5 transition-all hover:bg-[#E8ECF1] ${on ? '' : 'opacity-0 group-hover/th:opacity-100'}`}
                        >
                          {on
                            ? sort.dir === 'asc'
                              ? <ArrowUp size={12} className="text-[#3D8BD0]" />
                              : <ArrowDown size={12} className="text-[#3D8BD0]" />
                            : <ArrowUpDown size={12} className="text-[#9CA3AF]" />}
                        </button>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => {
                const reads = row.x_totalRead ?? 0;
                const up = row.x_likes ?? 0;
                const down = row.x_dislikes ?? 0;
                return (
                  <tr
                    key={row.id}
                    onClick={() => openArticle(row)}
                    className="group cursor-pointer border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#f9fafb]"
                  >
                    <td className={`${TD} overflow-visible`}>
                      <span className="inline-block whitespace-nowrap rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">
                        {row.id}
                      </span>
                    </td>
                    <td className="overflow-hidden px-4 py-3 text-[12px] text-[#364658]">
                      <span className="block truncate font-medium decoration-[#94A3B8] decoration-dotted underline-offset-[3px] group-hover:underline">
                        {row.subject}
                      </span>
                    </td>
                    {/* Where it lives and who wrote it, each behind its own glyph. */}
                    <td className={TD}>
                      <span className="flex min-w-0 items-center gap-2">
                        <Folder size={13} className="flex-shrink-0 text-[#94A3B8]" />
                        <span className="truncate text-[12px] text-[#4A5568]">{row.x_folder}</span>
                      </span>
                    </td>
                    <td className={TD}>
                      {/* The product's own people avatar — the same blue initials chip the
                          grid's Author column uses, so one person looks like one person. */}
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-medium text-white">
                          {row.assignedTo.initials}
                        </span>
                        <span className="truncate text-[12px] text-[#364658]">{row.assignedTo.name}</span>
                      </span>
                    </td>
                    {/* All three metrics stay side by side so the rows can be compared. */}
                    <td className={TD}>
                      {/* The grid's own figure chip — the same one the licence counts wear,
                          imported rather than copied so the treatment cannot drift. */}
                      <span className={COUNT_CHIP}>{reads.toLocaleString('en-IN')}</span>
                    </td>
                    <td className={TD}>
                      {/* The article page's own colours and icons — helpful #067647, not
                          helpful #B42318 — so a reader's verdict looks the same everywhere. */}
                      <span className="inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium tabular-nums" style={{ color: '#067647' }}>
                          <ThumbsUp size={13} className="flex-shrink-0" />{up}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium tabular-nums" style={{ color: '#B42318' }}>
                          <ThumbsDown size={13} className="flex-shrink-0" />{down}
                        </span>
                      </span>
                    </td>
                    <td className={TD}>
                      <span className="text-[12px] tabular-nums text-[#4A5568]">{fmtDate(row.createdBy)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!ranked.length && (
          <div className="border-t border-[#F0F2F5] px-5 py-10 text-center text-[13px] text-[#94A3B8]">
            No articles yet.
          </div>
        )}
      </div>
    </div>
  );
}
