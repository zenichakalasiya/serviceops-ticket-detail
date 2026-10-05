import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ExternalLink, Pin, Plus, RefreshCw, Search, Star, Upload, User, X, ListFilter } from 'lucide-react';
import { Pagination } from './Pagination';
import { ImportEmailsPanel } from './ImportEmailsPanel';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Admin › User Survey › User Surveys — the listing. Same surface as every admin listing
 * (Request Form Rules is the reference): head → toolbar → full-bleed table → Pagination.
 * The old product's "All Open User Survey" view dropdown is kept as a saved-view menu, the
 * Patch Deployment pattern: search, per-row pin, and a star + chip row naming the filter. */

type SurveyStatus = 'Design' | 'Live' | 'Closed' | 'Cancelled';

interface Survey {
  id: string;
  name: string;
  status: SurveyStatus;
  /** ISO local date-times. */
  start: string;
  end: string;
  created: string;
  owner?: string;
  catalog?: string;
  archived?: boolean;
}

/* ⚠️ A fixed "today", not new Date(): the Expiring / Expired views are relative to it, and the
   real clock would quietly empty both of them a week after this was written. */
const TODAY = new Date('2026-10-05T10:00:00');
const DAY = 86_400_000;

const SURVEYS: Survey[] = [
  { id: 'SUR-34', name: 'Q4 Service Desk Satisfaction', status: 'Live', start: '2026-09-28T14:10', end: '2026-10-09T14:10', created: '2026-09-27T14:06', owner: 'Kavit Gohel', catalog: 'HR Services' },
  { id: 'SUR-33', name: 'Travel Desk Experience', status: 'Live', start: '2026-09-20T12:43', end: '2026-10-11T12:43', created: '2026-09-17T13:43', owner: 'Dharti Patel', catalog: 'Travel Order' },
  { id: 'SUR-32', name: 'New Joiner Onboarding Feedback', status: 'Design', start: '2026-10-14T16:10', end: '2026-10-28T16:10', created: '2026-10-01T16:07' },
  { id: 'SUR-31', name: 'Laptop Refresh Programme', status: 'Live', start: '2026-09-01T15:28', end: '2026-10-07T15:28', created: '2026-08-23T12:57', owner: 'Kavit Gohel', catalog: 'Hardware Requests' },
  { id: 'SUR-30', name: 'VPN Migration Pulse Check', status: 'Cancelled', start: '2026-08-31T15:28', end: '2026-09-09T15:28', created: '2026-08-23T12:48', owner: 'Kavit Gohel', catalog: 'Network Access' },
  { id: 'SUR-29', name: 'Password Reset Self-Service', status: 'Closed', start: '2026-09-15T12:42', end: '2026-10-01T12:42', created: '2026-09-10T12:43', owner: 'Vaibhav Prajapati' },
  { id: 'SUR-28', name: 'Incident Resolution Follow-up', status: 'Live', start: '2026-07-01T15:28', end: '2026-12-31T15:28', created: '2026-06-25T15:29', owner: 'Kavit Gohel', catalog: 'IT Support' },
  { id: 'SUR-27', name: 'Annual Employee IT Survey', status: 'Closed', start: '2026-09-02T17:27', end: '2026-09-30T17:27', created: '2026-08-28T17:25', owner: 'Tech Support' },
  { id: 'SUR-26', name: 'Facilities Request Feedback', status: 'Design', start: '2026-10-20T16:48', end: '2026-11-03T16:48', created: '2026-09-29T16:49', catalog: 'Facilities' },
  { id: 'SUR-25', name: 'Software Request Turnaround', status: 'Live', start: '2026-09-07T16:35', end: '2026-10-12T16:35', created: '2026-09-06T16:35', owner: 'Neha Shah', catalog: 'Software Requests' },
  { id: 'SUR-24', name: 'Mobile Device Enrolment', status: 'Design', start: '2026-11-02T16:06', end: '2026-11-17T16:06', created: '2026-09-24T16:06' },
  { id: 'SUR-23', name: 'Hybrid Workplace Readiness', status: 'Closed', start: '2026-08-06T09:22', end: '2026-08-07T09:22', created: '2026-08-06T08:59', owner: 'Neha Shah' },
  { id: 'SUR-22', name: 'Change Advisory Board Feedback', status: 'Live', start: '2026-08-06T09:37', end: '2026-11-08T09:37', created: '2026-08-06T08:37', owner: 'Joshua A. Bejarano', catalog: 'HR Services' },
  { id: 'SUR-21', name: 'Email Migration Experience', status: 'Closed', start: '2026-03-19T11:16', end: '2026-03-29T11:16', created: '2026-03-18T11:20', owner: 'Joshua A. Bejarano' },
  { id: 'SUR-20', name: 'APAC Service Desk Pulse', status: 'Closed', start: '2026-09-24T19:45', end: '2026-10-02T19:45', created: '2026-07-29T17:27', owner: 'Darshan Mehta' },
  { id: 'SUR-19', name: 'Customer Support Assessment — TR', status: 'Live', start: '2026-07-29T12:30', end: '2026-10-08T12:30', created: '2026-07-29T11:46', owner: 'Disti Bilişim Ltd', catalog: 'Customer Support' },
  { id: 'SUR-18', name: 'Knowledge Base Usefulness', status: 'Design', start: '2026-10-20T15:35', end: '2026-10-30T15:35', created: '2026-10-02T15:36', owner: 'Vasu Hirpara', catalog: 'HR Services' },
  { id: 'SUR-17', name: 'Field Engineer Visit Feedback — PH', status: 'Closed', start: '2026-09-13T12:33', end: '2026-09-22T12:33', created: '2026-09-12T12:37', owner: 'Darshan Mehta' },
  { id: 'SUR-16', name: 'Printer Fleet Satisfaction', status: 'Cancelled', start: '2026-05-04T10:00', end: '2026-05-18T10:00', created: '2026-04-30T09:12', owner: 'Tech Support' },
  { id: 'SUR-15', name: 'Access Request Approval Speed', status: 'Live', start: '2026-09-10T09:00', end: '2026-11-10T09:00', created: '2026-09-08T18:20', owner: 'Dharti Patel', catalog: 'Network Access' },
  { id: 'SUR-14', name: 'Meeting Room AV Feedback', status: 'Closed', start: '2026-01-12T09:00', end: '2026-02-12T09:00', created: '2026-01-10T10:05', owner: 'Vasu Hirpara', catalog: 'Facilities', archived: true },
  { id: 'SUR-13', name: '2025 Year-End IT Survey', status: 'Closed', start: '2025-12-01T09:00', end: '2025-12-20T09:00', created: '2025-11-25T14:40', owner: 'Kavit Gohel', archived: true },
  { id: 'SUR-12', name: 'Payroll Portal Usability', status: 'Cancelled', start: '2025-10-06T09:00', end: '2025-10-20T09:00', created: '2025-10-01T11:30', catalog: 'HR Services', archived: true },
];

const at = (iso: string) => new Date(iso);
const daysFromToday = (iso: string) => (at(iso).getTime() - TODAY.getTime()) / DAY;

interface SurveyView {
  id: string;
  label: string;
  /** Plain-English predicate shown beside the star; empty = everything. */
  chip: string;
  match: (s: Survey) => boolean;
}

export const SURVEY_VIEWS: SurveyView[] = [
  { id: 'open', label: 'All Open User Survey', chip: 'Status Not In Closed, Cancelled', match: (s) => s.status !== 'Closed' && s.status !== 'Cancelled' },
  { id: 'live', label: 'All Live User Survey', chip: 'Status In Live', match: (s) => s.status === 'Live' },
  { id: 'expiring', label: 'Survey Expiring in Next 7 days', chip: 'End Date In Next 7 days', match: (s) => s.status === 'Live' && daysFromToday(s.end) >= 0 && daysFromToday(s.end) <= 7 },
  { id: 'expired', label: 'Survey Expired in Previous 7 days', chip: 'End Date In Previous 7 days', match: (s) => daysFromToday(s.end) < 0 && daysFromToday(s.end) >= -7 },
  { id: 'cancelled', label: 'All Cancelled Survey', chip: 'Status In Cancelled', match: (s) => s.status === 'Cancelled' },
  { id: 'all', label: 'All Survey', chip: '', match: () => true },
  { id: 'archived', label: 'All Archived Survey', chip: 'Archived In Yes', match: (s) => !!s.archived },
];

/** Archived rows belong to exactly one view — the rule lives here, not in each `match`. */
const inView = (s: Survey, v: SurveyView) => (v.id === 'archived' ? !!s.archived : !s.archived && v.match(s));

const STATUS_TONE: Record<SurveyStatus, string> = {
  Design: 'bg-[#F1F5F9] text-[#475569]',
  Live: 'bg-[#ECFDF3] text-[#15803D]',
  Closed: 'bg-[#EEF2F6] text-[#64748B]',
  Cancelled: 'bg-[#FEF2F2] text-[#DC2626]',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(iso: string) {
  const d = at(iso);
  const h = d.getHours();
  const hh = String(((h + 11) % 12) + 1).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

const AVATAR_TONES = ['#3D8BD0', '#8B5CF6', '#0EA5A4', '#F58518', '#DB2777', '#16A34A'];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const toneFor = (n: string) => AVATAR_TONES[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const iconBtn = 'flex size-9 items-center justify-center rounded border border-[#d1d5db] bg-white text-[#64748B] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]';

function ViewMenu({ view, onView, pinned, onPin }: {
  view: SurveyView;
  onView: (v: SurveyView) => void;
  pinned: Set<string>;
  onPin: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const close = () => { setOpen(false); setQ(''); };
  const needle = q.trim().toLowerCase();
  const views = SURVEY_VIEWS
    .filter((v) => !needle || v.label.toLowerCase().includes(needle))
    .sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id)));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 max-w-[280px] items-center gap-2 rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
      >
        <ListFilter size={15} className="flex-shrink-0 text-[#64748B]" />
        <span className="truncate">{view.label}</span>
        <ChevronDown size={15} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute left-0 top-full z-50 mt-1 w-[300px] rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg">
            <div className="px-3 pb-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-9 w-full rounded border border-[#E5E7EB] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {views.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">No views match “{q}”.</div>
              ) : views.map((v) => {
                const active = v.id === view.id;
                const isPinned = pinned.has(v.id);
                return (
                  <div key={v.id} className={`group flex items-center gap-2 px-4 py-2 transition-colors ${active ? 'bg-[#EBF5FF]' : 'hover:bg-[#F9FAFB]'}`}>
                    <button
                      type="button"
                      onClick={() => { onView(v); close(); }}
                      className={`min-w-0 flex-1 truncate text-left text-[13px] ${active ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}
                    >{v.label}</button>
                    {/* Fixed slot, hidden not removed, so rows never shift on hover. */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onPin(v.id); }}
                          className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-white ${isPinned ? 'text-[#3D8BD0]' : 'text-[#9CA3AF] opacity-0 group-hover:opacity-100'}`}
                        ><Pin size={14} className={isPinned ? 'fill-current' : ''} /></button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{isPinned ? 'Unpin view' : 'Pin to top'}</TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminUserSurveyModule() {
  const [defaultView, setDefaultView] = useState('open');
  const [view, setView] = useState<SurveyView>(SURVEY_VIEWS[0]);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [importing, setImporting] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SURVEYS
      .filter((s) => inView(s, view))
      .filter((s) => !q || [s.id, s.name, s.status, s.owner ?? 'Unassigned', s.catalog ?? ''].some((x) => x.toLowerCase().includes(q)));
  }, [view, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const pickView = (v: SurveyView) => { setView(v); setPage(1); };
  const togglePin = (id: string) => setPinned((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h1 className="text-[16px] font-semibold text-[#364658]">User Surveys</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          Build surveys to measure user satisfaction and feedback.{' '}
          <button type="button" onClick={() => toast.success('Opening the docs')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View Docs <ExternalLink size={12} />
          </button>
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <ViewMenu view={view} onView={pickView} pinned={pinned} onPin={togglePin} />
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search" className={inputCls} />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => toast.success('Surveys refreshed')} className={iconBtn}><RefreshCw size={15} /></button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]"
          >
            <Upload size={15} /> Import
          </button>
          <button
            type="button"
            onClick={() => toast('Survey builder is not part of this prototype yet')}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]"
          >
            <Plus size={15} /> Create User Survey
          </button>
        </div>
      </div>

      {/* The active view's predicate, so what is being hidden is never invisible. */}
      {view.chip && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => setDefaultView(view.id)} className="flex size-6 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
                <Star size={15} className={defaultView === view.id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#9CA3AF]'} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{defaultView === view.id ? 'Default view' : 'Set as default view'}</TooltipContent>
          </Tooltip>
          <span className="inline-flex items-center gap-1.5 rounded bg-[#EEF2F6] py-1 pl-2.5 pr-1.5 text-[12px] text-[#364658]">
            {view.chip}
            <button
              type="button"
              onClick={() => pickView(SURVEY_VIEWS.find((v) => v.id === 'all')!)}
              className="flex size-4 items-center justify-center rounded-full text-[#7B8FA5] transition-colors hover:bg-white hover:text-[#364658]"
            ><X size={12} /></button>
          </span>
        </div>
      )}

      {/* -mx-4 cancels the page gutter, so every rule runs end to end across the pane. */}
      <div className="-mx-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] leading-5">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {['ID', 'Name', 'Status', 'Start Date', 'End Date', 'Owner', 'Service Catalog'].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                {search ? 'No surveys match your search.' : `No surveys in “${view.label}”.`}
              </td></tr>
            ) : pageRows.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-[#f9fafb]">
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">{s.id}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toast(`Opening “${s.name}”`)}
                    title={s.name}
                    className="block max-w-[280px] truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]"
                  >{s.name}</button>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${STATUS_TONE[s.status]}`}>{s.status}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{fmt(s.start)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{fmt(s.end)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {s.owner ? (
                    <span className="inline-flex max-w-[180px] items-center gap-2 text-[13px] text-[#364658]">
                      <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: toneFor(s.owner) }}>{initials(s.owner)}</span>
                      <span className="truncate">{s.owner}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-[13px] text-[#9CA3AF]">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]"><User size={13} /></span>
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{s.catalog ?? <span className="text-[#9CA3AF]">—</span>}</td>
              </tr>
            ))}
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

      {/* Demo: 120 emails already typed into the audience by hand, so a file can add 380. */}
      {importing && <ImportEmailsPanel manualCount={120} onClose={() => setImporting(false)} />}
    </div>
  );
}
