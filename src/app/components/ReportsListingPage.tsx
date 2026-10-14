/* ── Reports listing ─────────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL report catalog:
   moduleCols="report" columns (Name · Created Date · Created By · Type), with the
   module's CATEGORY rail down the left where the CMDB puts its CI classes and Knowledge
   its folders. Picking a category narrows the grid.

   Clicks open the real ReportDrawer through the DrawerStack, as before — the old page's
   knowledge-shaped adapter is reused unchanged. */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { ReportCategoryRail } from './ReportCategoryRail';
import { REPORT_QUICK_FILTERS } from './TicketFilterBar';
import { REPORT_FILTER_ATTRS } from './reportFilterAttrs';
import { CATEGORIES, REPORTS, reportToKnowledgeShape } from './ReportsListPage';
import type { ReportRow } from './ReportsTable';
import type { Ticket } from './TicketListPage';

/* "Fri, Jul 31, 2026 06:15 PM" — drop the weekday so Date can read it. */
const parseCreated = (s: string) => new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
const initialsOf = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/* Which reports SHIPPED with the product and which this organisation built — the cut the
   quick filter makes. Mock, but deterministic per id, so the split never moves between
   reloads and every category holds some of each (roughly two in five are predefined). */
const originOf = (id: string) => {
  let n = 7;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 1009;
  return n % 5 < 2 ? 'Predefined Report' : 'Custom Report';
};

/* Every report in the catalog, adapted onto the grid's row shape ONCE. `cat` rides along so
   the rail can slice without rebuilding, and the drawer gets its category label back. */
type Row = Ticket & { cat: string };
const CATALOG: { rows: Row[]; byId: Map<string, { row: ReportRow; cat: string }> } = (() => {
  const byId = new Map<string, { row: ReportRow; cat: string }>();
  const rows: Row[] = [];
  Object.entries(REPORTS).forEach(([cat, list]) => {
    list.forEach((r) => {
      /* The drawer's own record carries the UPPERCASED id (reportToKnowledgeShape), and the
         stack matches the open record to its tab by id — so the row has to use the same one
         or the drawer opens empty and renders nothing. */
      const rid = r.id.toUpperCase();
      byId.set(rid, { row: r, cat });
      const created = parseCreated(r.createdDate);
      rows.push({
        id: rid,
        subject: r.name,
        requester: r.createdBy,
        dueBy: created,
        createdBy: created,
        assignedTo: { name: r.createdBy, initials: initialsOf(r.createdBy) },
        status: 'Open',
        priority: 'Medium',
        x_createdBy: r.createdBy,
        /* Reports outlive their authors — this is why a row says "(Archived)". */
        x_authorState: r.archived ? 'Archived' : 'Active',
        x_type: r.type,
        /* Shipped with the product, or built here. Deterministic per id so the split is
           stable across reloads and spread through every category. */
        x_origin: originOf(r.id),
        cat,
      } as Row);
    });
  });
  return { rows, byId };
})();

/* ── Report settings ─────────────────────────────────────────────────────────
   One switch today, so it is a small panel hung off the ⋮ rather than a page of its own:
   open it, flip it, Update. The setting is module-wide, which is why it lives here and not
   on any one report.

   A body PORTAL anchored to the ⋮ — the toolbar is inside a scroll container, which would
   clip a panel positioned within it. It closes on Update, on ✕, on Esc and on a click
   outside, and the switch only commits on Update, so a stray flip costs nothing. */
function ReportSettingsPanel({
  anchor,
  value,
  onApply,
  onClose,
}: {
  anchor: DOMRect;
  value: boolean;
  onApply: (v: boolean) => void;
  onClose: () => void;
}) {
  const [on, setOn] = useState(value);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', onClose);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onClose); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const W = 380;
  return createPortal(
    <div
      style={{ top: anchor.bottom + 6, left: Math.min(Math.max(anchor.right - W, 8), window.innerWidth - W - 8) }}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[9999] w-[380px] rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1E293B]">Report Settings</h3>
        <button onClick={onClose} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
          <X size={15} className="text-[#64748B]" />
        </button>
      </div>

      {/* The switch leads, the label explains it — the row reads left to right as one
          sentence, and the whole row is the target. */}
      <div className="border-y border-[#F1F5F9] px-4 py-3.5">
        <button onClick={() => setOn((v) => !v)} className="group/st flex w-full items-start gap-3 text-left">
          <span
            role="switch"
            aria-checked={on}
            className={`relative mt-px inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
              on ? 'bg-[#3D8BD0]' : 'bg-[#D1D5DB] group-hover/st:bg-[#C4C9D0]'
            }`}
          >
            <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ${on ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[#364658]">Add Sr. No Column for Tabular Reports</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[#7B8FA5]">
              Numbers every row of a tabular report, so a printed or exported copy can be referred to by line.
            </span>
          </span>
        </button>
      </div>

      <div className="flex justify-end px-4 py-3">
        <button
          onClick={() => { onApply(on); onClose(); }}
          className="h-8 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
        >
          Update
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function ReportsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* The selected module. Request leads the rail and is where the catalog is deepest. */
  const [cat, setCat] = useState('request');
  /* The ⋮'s Report Settings panel, and the one setting it holds. */
  const [settingsAt, setSettingsAt] = useState<DOMRect | null>(null);
  const [srNoColumn, setSrNoColumn] = useState(false);

  const rows = useMemo(() => CATALOG.rows.filter((r) => r.cat === cat), [cat]);
  const title = CATEGORIES.find((c) => c.id === cat)?.label ?? 'Reports';

  return (
    <>
    <AssetRegisterPage
      activePage="reports"
      stackModule="report"
      viewsStore="report"
      noun="report"
      moduleCols="report"
      defaultViewName={title}
      resetKey={cat}
      footerNoun="reports"
      rows={rows}
      /* The drawer takes the report adapted onto the knowledge shape, as the old page did. */
      recordOf={(id) => {
        const hit = CATALOG.byId.get(id);
        return hit ? reportToKnowledgeShape(hit.row, CATEGORIES.find((c) => c.id === hit.cat)?.label ?? '') : undefined;
      }}
      filterAttrs={REPORT_FILTER_ATTRS}
      /* Who built a report and which engine built it are facts about the report, not fields
         you reassign from a list. */
      lockedCells={['assignee', 'status']}
      quickFilters={REPORT_QUICK_FILTERS}
      searchFields={['x_createdBy', 'x_type', 'x_origin']}
      primaryAction={{ label: 'Create' }}
      /* On the title line, at the page's top-right — the rail below it narrows what you are
         looking at, which is a different job from making a new report. */
      primaryActionInTitle
      /* A report is run and read, not exported or polled from the list — each report does its
         own exporting from its page. The grid is four fixed columns over one category at a
         time, so there is nothing for a view-settings menu to settle either. The two things
         that ARE module-wide — the run history and the report settings — live in the ⋮. */
      hideTools={['export', 'refresh', 'settings']}
      moreActions={[
        { key: 'report-history', label: 'Report History', icon: History },
        { key: 'report-settings', label: 'Report Settings', icon: Settings, onSelect: setSettingsAt },
      ]}
      /* Reports are navigated by category, so a saved-views rail would only compete with the
         rail already in that slot. */
      showViews={false}
      /* Nothing on this page acts on a SET of reports — you open one, or you create one —
         so a selection column would be a control with nothing behind it. */
      hideSelection
      /* The four columns a report HAS are the four it shows: nothing to insert beside them,
         swap one for, hide or freeze — so the header carries no menu at all. Sorting is on
         the heading itself and filtering is in the toolbar, which is where this page's
         readers already go for both. */
      allowColumnEdit={false}
      hideColumnMenu
      /* Edit and Schedule sit inline in the Action column; Duplicate, View History and
         Delete are behind its ⋮ — five icons in every row is a wall, and Delete should
         never be one stray click from a list. */
      onRowAction={(row, action) => {
        const what: Record<string, string> = {
          edit: 'Edit report', schedule: 'Schedule report', duplicate: 'Duplicate report',
          history: 'Report history', delete: 'Delete report',
        };
        toast(`${what[action] ?? action} — ${row.subject}`, { description: 'Coming soon' });
      }}
      rail={({ collapsed, expand }) => (
        <ReportCategoryRail
          categories={CATEGORIES}
          active={cat}
          onSelect={setCat}
          forceCollapsed={collapsed}
          onExpand={expand}
        />
      )}
      railLabel="categories"
      onNavigate={onNavigate}
    />
    {settingsAt && (
      <ReportSettingsPanel
        anchor={settingsAt}
        value={srNoColumn}
        onApply={(v) => {
          setSrNoColumn(v);
          toast.success(v ? 'Sr. No column enabled for tabular reports' : 'Sr. No column disabled');
        }}
        onClose={() => setSettingsAt(null)}
      />
    )}
    </>
  );
}
