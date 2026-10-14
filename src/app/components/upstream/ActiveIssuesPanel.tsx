/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { activeIssuesFor, type ActiveIssue } from './RelationshipGraph';

/* Active Issues side panel (Relationship topology): opened from a red node's hover-card
 * "N active issues" strip. Shows the node's linked Request / Problem / Change records in
 * segmented tabs, filtered to non-closed by a removable "Status Not In Closed" chip. */

type IssueKind = 'Request' | 'Problem' | 'Change';

const TAB_META: Record<IssueKind | 'All', { plural: string; scope: string }> = {
  All: { plural: 'All Issues', scope: 'All Open Records' },
  Request: { plural: 'Requests', scope: 'All Open Requests' },
  Problem: { plural: 'Problems', scope: 'All Open Problems' },
  Change: { plural: 'Changes', scope: 'All Open Changes' },
};

const STATUS_DOT: Record<string, string> = {
  Open: '#EF4444',
  'In Progress': '#F59E0B',
  Pending: '#8B5CF6',
  Closed: '#9CA3AF',
};
const PRIORITY_DOT: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22A06B',
};

export function ActiveIssuesPanel({ assetName, onClose, onOpenIssue }: { assetName: string; onClose: () => void; onOpenIssue?: (issue: ActiveIssue, kind: IssueKind) => void }) {
  const [tab, setTab] = useState<IssueKind | 'All'>('All');
  const [q, setQ] = useState('');
  // The "Status Not In Closed" chip filters out closed records; removing it shows them too.
  const [notClosed, setNotClosed] = useState(true);

  const data = activeIssuesFor(assetName);
  const byKind: Record<IssueKind, ActiveIssue[]> = { Request: data.requests, Problem: data.problems, Change: data.changes };
  const openCountOf = (k: IssueKind | 'All') => (k === 'All' ? data.openCount : byKind[k].filter((i) => !i.closed).length);
  // Rows carry their kind so the All tab can mix Request/Problem/Change records.
  const rows = (tab === 'All'
    ? (['Request', 'Problem', 'Change'] as const).flatMap((k) => byKind[k].map((i) => ({ issue: i, kind: k as IssueKind })))
    : byKind[tab].map((i) => ({ issue: i, kind: tab }))
  )
    .filter((r) => (notClosed ? !r.issue.closed : true))
    .filter((r) => !q || r.issue.subject.toLowerCase().includes(q.toLowerCase()) || r.issue.id.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 z-[10004] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10005] flex h-full w-[880px] max-w-[96vw] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="min-w-0 truncate text-[17px] font-semibold text-[#111827]">Active Issues <span className="text-[13px] font-normal text-[#7B8FA5]">— {assetName}</span></h2>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Kind pills — same design as the Relations tab filter pills (All always first) */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTab('All')}
              className={`inline-flex items-center px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${tab === 'All' ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
            >
              All
            </button>
            {/* Like the Relations tab, only types that actually have records get a pill. */}
            {(['Request', 'Problem', 'Change'] as const).filter((k) => openCountOf(k) > 0).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${tab === k ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
              >
                {k}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${tab === k ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
                  {openCountOf(k)}
                </span>
              </button>
            ))}
          </div>

          {/* Section title */}
          <div className="mb-3 flex items-center gap-2.5">
            <h3 className="text-[15px] font-semibold text-[#111827]">{TAB_META[tab].plural}</h3>
            <span className="inline-flex items-center gap-1 text-[12.5px] text-[#7B8FA5]">{TAB_META[tab].scope} <ChevronDown size={13} /></span>
          </div>

          {/* Search with the Status chip */}
          <div className="mb-3 flex h-10 items-center gap-2 rounded-md border border-[#DFE5ED] px-2 focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0]">
            {notClosed && (
              <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#EAF2FB] px-2.5 py-1 text-[12px] font-medium text-[#364658]">
                Status Not In Closed
                <button onClick={() => setNotClosed(false)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
              </span>
            )}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Select field or enter a keyword to search..."
              className="h-full min-w-0 flex-1 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none"
            />
          </div>

          {/* Records */}
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white border-b border-[#e5e7eb]">
              <tr>
                <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Subject</th>
                <th className="w-[150px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Status</th>
                <th className="w-[120px] px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {rows.map((r) => (
                <tr
                  key={r.issue.id}
                  onClick={() => onOpenIssue?.(r.issue, r.kind)}
                  className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                >
                  <td className="px-4 py-2.5">
                    <span className="inline-flex max-w-full items-center gap-2">
                      <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{r.issue.id}</span>
                      <span className="truncate text-[#364658]">{r.issue.subject}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="size-2 rounded-full" style={{ backgroundColor: STATUS_DOT[r.issue.status] ?? '#9CA3AF' }} />{r.issue.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[#364658]"><span className="size-2 rounded-full" style={{ backgroundColor: PRIORITY_DOT[r.issue.priority] ?? '#9CA3AF' }} />{r.issue.priority}</span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]">No open {TAB_META[tab].plural.toLowerCase()} linked to this asset</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
