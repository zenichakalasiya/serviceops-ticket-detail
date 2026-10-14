/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Clock, ArrowRight, Filter, Download, Lock, Eye, EyeOff, Calendar, X } from 'lucide-react';
import { DateField } from '../DateField';
import { useState } from 'react';

interface AuditTrailsTabContentProps {
  ticketId?: string;
  /** Override the trail with module-specific entries (Knowledge passes its own). */
  entries?: AuditEntry[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userInitials: string;
  userColor: string;
  action: string;
  details: string;
  changes: { field: string; oldValue: string; newValue: string }[];
  /** A long-text before/after change (Description / comment) shown via the "View Changes" toggle. */
  descriptionChange?: { old: string; new: string };
}

export function AuditTrailsTabContent({ ticketId, entries }: AuditTrailsTabContentProps = {}) {
  // Empty state for blank ticket (INC-32)
  const isBlankTicket = ticketId === 'INC-32';

  const auditTrails: AuditEntry[] = entries ?? (isBlankTicket ? [] : [
    {
      id: '0',
      timestamp: '2024-03-10 15:10:00',
      user: 'Rakesh Rathod',
      userInitials: 'RR',
      userColor: '#3D8BD0',
      action: 'Description Updated',
      details: 'Updated the request description',
      changes: [],
      descriptionChange: {
        old: "I am unable to access the internet on my work laptop since this morning. I've tried restarting my computer multiple times, but the issue persists. The network icon shows that I'm connected to the office Wi-Fi, but when I try to open any website or access company resources, nothing loads.",
        new: "I am unable to access the internet on my work laptop since this morning. I've tried restarting my computer multiple times, but the issue persists. The network icon shows that I'm connected to the office Wi-Fi, but when I try to open any website or access company resources, nothing loads.\n\nThis is significantly impacting my ability to work as I cannot access emails, cloud applications, or collaborate with my team. I've checked with colleagues nearby and they don't seem to be experiencing any connectivity issues. I need urgent assistance to resolve this problem as I have several critical tasks and meetings scheduled today that require internet access.",
      },
    },
    {
      id: '1',
      timestamp: '2024-03-10 14:32:15',
      user: 'Sarah Smith',
      userInitials: 'SS',
      userColor: '#F59E0B',
      action: 'Status Changed',
      details: 'Changed status from "Open" to "In Progress"',
      changes: [
        { field: 'Status', oldValue: 'Open', newValue: 'In Progress' }
      ]
    },
    {
      id: '2',
      timestamp: '2024-03-10 13:45:22',
      user: 'John Doe',
      userInitials: 'JD',
      userColor: '#3D8BD0',
      action: 'Priority Updated',
      details: 'Changed priority from "Normal" to "High"',
      changes: [
        { field: 'Priority', oldValue: 'Normal', newValue: 'High' }
      ]
    },
    {
      id: '3',
      timestamp: '2024-03-10 12:18:40',
      user: 'Michael Chen',
      userInitials: 'MC',
      userColor: '#8B5CF6',
      action: 'Assignee Changed',
      details: 'Assigned to Sarah Smith',
      changes: [
        { field: 'Assignee', oldValue: 'Unassigned', newValue: 'Sarah Smith' }
      ]
    },
    {
      id: '4',
      timestamp: '2024-03-10 11:05:13',
      user: 'System',
      userInitials: 'SYS',
      userColor: '#6B7280',
      action: 'Comment Added',
      details: 'Added a new comment to the request',
      changes: []
    },
    {
      id: '5',
      timestamp: '2024-03-10 10:22:55',
      user: 'Emily Rodriguez',
      userInitials: 'ER',
      userColor: '#EC4899',
      action: 'Attachment Added',
      details: 'Uploaded file: network_diagram.pdf',
      changes: []
    },
    {
      id: '6',
      timestamp: '2024-03-10 09:30:00',
      user: 'John Doe',
      userInitials: 'JD',
      userColor: '#3D8BD0',
      action: 'Custom Field Updated',
      details: 'Changed Impact from "Low" to "Medium"',
      changes: [
        { field: 'Impact', oldValue: 'Low', newValue: 'Medium' }
      ]
    },
    {
      id: '7',
      timestamp: '2024-03-09 16:45:30',
      user: 'Sarah Smith',
      userInitials: 'SS',
      userColor: '#F59E0B',
      action: 'Tag Added',
      details: 'Added tags: "Network Issue", "Urgent"',
      changes: []
    },
    {
      id: '8',
      timestamp: '2024-03-09 15:12:18',
      user: 'System',
      userInitials: 'SYS',
      userColor: '#6B7280',
      action: 'Ticket Created',
      details: 'Ticket was created by Alex Johnson',
      changes: []
    }
  ]);

  // The before/after description change shown in the centered "View Changes" popup.
  const [diff, setDiff] = useState<{ old: string; new: string } | null>(null);

  // Filter (date range) + download popups
  const [showFilter, setShowFilter] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [dlFormat, setDlFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [dlPwProtected, setDlPwProtected] = useState(false);
  const [dlPassword, setDlPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const openFilter = () => { setShowDownload(false); setDraftFrom(fromDate); setDraftTo(toDate); setShowFilter((v) => !v); };
  const applyFilter = () => { setFromDate(draftFrom); setToDate(draftTo); setShowFilter(false); };
  const clearFilter = () => { setFromDate(''); setToDate(''); setDraftFrom(''); setDraftTo(''); setShowFilter(false); };
  const isFiltered = !!(fromDate || toDate);
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const rangeLabel = fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}` : fromDate ? `From ${fmtDate(fromDate)}` : toDate ? `Until ${fmtDate(toDate)}` : '';

  // Apply the date-range filter, then group entries by day for a scannable timeline.
  const parse = (ts: string) => new Date(ts.replace(' ', 'T'));
  const fmtTime = (ts: string) => parse(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const filteredTrails = auditTrails.filter((a) => {
    const d = a.timestamp.slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
  const groups: { key: string; label: string; items: typeof auditTrails }[] = [];
  for (const a of filteredTrails) {
    const key = a.timestamp.slice(0, 10);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: parse(a.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), items: [] as typeof auditTrails };
      groups.push(g);
    }
    g.items.push(a);
  }

  const iconBtn = 'size-8 flex items-center justify-center border border-[#DFE5ED] rounded text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658] transition-colors';

  return (
    <div className="px-6 py-5">
      {/* Toolbar — filter + download */}
      {auditTrails.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-[12px] text-[#7B8FA5]">
            {filteredTrails.length} {filteredTrails.length === 1 ? 'entry' : 'entries'}
          </div>
          <div className="flex items-center gap-2">
            {/* Applied date range chip (left of the filter icon) */}
            {isFiltered && (
              <span className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 rounded-md bg-[#EAF2FB] text-[#3D8BD0] text-[12px] font-medium">
                <Calendar size={13} className="flex-shrink-0" />
                <span className="whitespace-nowrap">{rangeLabel}</span>
                <button onClick={clearFilter} title="Clear filter" className="p-0.5 rounded hover:bg-[#3D8BD0]/10 transition-colors">
                  <X size={13} />
                </button>
              </span>
            )}
            {/* Filter */}
            <div className="relative">
              <button onClick={openFilter} className={`${iconBtn} ${isFiltered ? 'border-[#3D8BD0] text-[#3D8BD0]' : ''}`} title="Filter by date">
                <Filter size={16} />
              </button>
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                  <div className="app-menu absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50">
                    <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Filter</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">From</label>
                        <DateField value={draftFrom} onChange={setDraftFrom} />
                      </div>
                      <div>
                        <label className="text-[12px] text-[#7B8FA5] mb-1 block">To</label>
                        <DateField value={draftTo} min={draftFrom || undefined} onChange={setDraftTo} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#F0F1F3]">
                      <button onClick={clearFilter} className="px-3 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Clear</button>
                      <button onClick={applyFilter} className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Apply</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Download */}
            <div className="relative">
              <button onClick={() => { setShowFilter(false); setShowDownload((v) => !v); }} className={iconBtn} title="Download audit trail">
                <Download size={16} />
              </button>
              {showDownload && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDownload(false)} />
                  <div className="app-menu absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50">
                    <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Download</h4>

                    {/* Format */}
                    <div className="mb-4">
                      <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Format</label>
                      <div className="inline-flex rounded border border-[#DFE5ED] overflow-hidden">
                        {(['PDF', 'Excel', 'CSV'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setDlFormat(f)}
                            className={`px-4 py-1.5 text-[13px] font-medium transition-colors ${dlFormat === f ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Password Protected toggle */}
                    <div className="mb-3">
                      <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Password Protected</label>
                      <button
                        onClick={() => setDlPwProtected((v) => !v)}
                        role="switch"
                        aria-checked={dlPwProtected}
                        className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${dlPwProtected ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}
                      >
                        <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${dlPwProtected ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>

                    {/* Attachment password */}
                    {dlPwProtected && (
                      <div className="mb-1">
                        <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Attachment Password <span className="text-[#EF4444]">*</span></label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={dlPassword}
                            onChange={(e) => setDlPassword(e.target.value)}
                            placeholder="Attachment Password"
                            className="w-full pl-9 pr-9 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                          />
                          <button onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]">
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#F0F1F3]">
                      <button onClick={() => setShowDownload(false)} className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#3D8BD0] rounded hover:bg-[#2F7AB8] transition-colors">Download</button>
                      <button onClick={() => setShowDownload(false)} className="px-3 py-1.5 text-[13px] font-medium text-[#364658] border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] transition-colors">Cancel</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {auditTrails.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
            <Clock className="size-8 text-[#7B8FA5]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Audit Trails Yet</h3>
          <p className="text-[13px] text-[#7B8FA5] max-w-[300px]">
            Audit trail entries will appear here as actions are performed on this ticket.
          </p>
        </div>
      ) : filteredTrails.length === 0 ? (
        <div className="text-center py-16 text-[13px] text-[#7B8FA5]">No audit trail entries in the selected date range.</div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] font-semibold text-[#7B8FA5] flex-shrink-0">{group.label}</span>
                <div className="flex-1 h-px bg-[#EEF1F5]" />
              </div>

              {/* Entries for the day */}
              <div className="relative">
                {group.items.map((audit, index, arr) => (
                  <div key={audit.id} className="relative flex gap-3 py-3.5 px-2 -mx-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    {/* Connecting line */}
                    {index !== arr.length - 1 && (
                      <div className="absolute left-[22px] top-[44px] bottom-[-2px] w-px bg-[#EEF1F5]" />
                    )}

                    {/* Avatar */}
                    <div
                      className="size-[26px] rounded-[6px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 relative z-10"
                      style={{ backgroundColor: audit.userColor }}
                    >
                      {audit.userInitials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-[#364658]">{audit.user}</span>
                        <span className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] rounded px-1.5 py-0.5">{audit.action}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                          <Clock size={11} />
                          {fmtTime(audit.timestamp)}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#5A6B7B] mt-1">{audit.details}</p>

                      {/* View Changes — opens a centered before/after comparison popup */}
                      {audit.descriptionChange && (
                        <button
                          onClick={() => setDiff(audit.descriptionChange!)}
                          className="mt-1.5 text-[12px] font-medium text-[#3D8BD0] hover:underline"
                        >
                          View Changes
                        </button>
                      )}

                      {/* Before → after change chips */}
                      {audit.changes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {audit.changes.map((change, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 text-[12px] bg-white border border-[#E8EDF3] rounded-md px-2 py-1">
                              <span className="text-[#7B8FA5]">{change.field}</span>
                              <span className="text-[#94A3B8] line-through">{change.oldValue}</span>
                              <ArrowRight size={11} className="text-[#CBD5E1] flex-shrink-0" />
                              <span className="text-[#059669] font-medium">{change.newValue}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Changes — centered before/after comparison popup */}
      {diff && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/40" onClick={() => setDiff(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[920px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] flex-shrink-0">
              <h3 className="text-[16px] font-semibold text-[#111827]">Description Changes</h3>
              <button onClick={() => setDiff(null)} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-auto @container">
              <div className="flex flex-col @2xl:flex-row items-stretch gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#DC2626] mb-1.5">Before</div>
                  <div className="rounded-lg bg-[#FDECEC] px-4 py-3 text-[13px] leading-relaxed text-[#7F1D1D] whitespace-pre-line">{diff.old}</div>
                </div>
                <div className="flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={18} className="text-[#94A3B8] rotate-90 @2xl:rotate-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#16A34A] mb-1.5">After</div>
                  <div className="rounded-lg bg-[#EAF7EE] px-4 py-3 text-[13px] leading-relaxed text-[#14532D] whitespace-pre-line">{diff.new}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
