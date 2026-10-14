/* ── Patches listing ─────────────────────────────────────────────────────────
   The shared register chrome over the real `mockPatches`, replacing the module's hand-rolled
   table: the same columns it always showed, now with the filter builder, saved views,
   grouping, multi-sort and the two layouts the module needs.

   TWO layouts — **List + KPI** and **Dashboard**. Both answer what the PATCH DETAIL page
   opens with (see PatchDrawer: Category · Severity · Approval Status · Release Date · KB, and
   an Overview of endpoints missing / installed / ignored), so a reader meets the same story
   whether they are looking at the catalogue or at one patch. */
import { useMemo } from 'react';
import { Download, Monitor, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { PATCH_FILTER_ATTRS, PATCH_QUICK_FILTERS } from './patchFilterAttrs';
import {
  mockPatches, patchArchOf, patchCreatedByOf, patchDownloadOf, patchKbOf, patchPlatformOf,
  patchResolvedCvesOf, patchSourceOf, patchStatusOf, patchSupersededOf, patchTagsOf,
  patchTestStatusOf, patchTypeOf, patchUpdatedByOf, patchUpdatedDateOf, patchUploadOf,
  patchUuidOf, type Patch,
} from './PatchesListPage';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* "Tue, Apr 14, 2026 05:00 PM" → a real Date, so the column sorts chronologically and the
   date buckets read the true value. */
const parseReleased = (s: string): Date | null => {
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

const SEV_COLOR: Record<string, string> = {
  Critical: '#DC2626', Important: '#F97316', Moderate: '#F59E0B', Low: '#22C55E', Unspecified: '#94A3B8',
};

const PATCHES: { rows: Ticket[]; byId: Map<string, Patch> } = (() => {
  const byId = new Map<string, Patch>();
  const rows = mockPatches.map((p) => {
    byId.set(p.id, p);
    const released = parseReleased(p.releaseDate) ?? new Date();
    const reboot = p.rebootRequired;
    return {
      id: p.id,
      subject: p.name,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: released,
      createdBy: released,
      status: 'Open' as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_severity: p.severity,
      x_category: p.category ?? 'Updates',
      x_released: released,
      /* NULL is kept, not flattened to 0: a patch the scanner has not reported on is not a
         patch nobody is missing. The cell prints the dash the module's table always did. */
      x_missing: p.missingSystem,
      x_installed: p.installedSystem,
      x_reboot: reboot,
      x_approvalStatus: p.approvalStatus,
      x_kb: patchKbOf(p),
      x_patchType: patchTypeOf(p),
      x_arch: patchArchOf(p),
      x_superseded: patchSupersededOf(p),
      x_downloadStatus: patchDownloadOf(p),
      /* The rest of the product's attribute set, derived in PatchesListPage so the row and
         the record it opens cannot disagree. */
      x_uuid: patchUuidOf(p),
      x_platform: patchPlatformOf(p),
      x_createdBy: patchCreatedByOf(p),
      x_updatedBy: patchUpdatedByOf(p),
      x_testStatus: patchTestStatusOf(p),
      x_source: patchSourceOf(p),
      x_patchStatus: patchStatusOf(p),
      x_uploadStatus: patchUploadOf(p),
      x_resolvedCves: patchResolvedCvesOf(p),
      x_tags: patchTagsOf(p),
      x_lastUpdatedDate: patchUpdatedDateOf(p),
      /* Two bands, pre-computed so the KPI card, the saved view and the dashboard segment
         all test one field. "Ready to deploy" is the module's real gate: approved AND the
         binary is on the file server — approval alone does not get a patch installed. */
      x_deployable: p.approvalStatus === 'Approved' && patchDownloadOf(p) === 'Success' ? 'Yes' : 'No',
      x_needsReboot: reboot === 'No' ? 'No' : 'Yes',
      /* "Missing Endpoints > 0" — the gate on the strip's first two cards. NULL stays "No":
         a patch the scanner never reported on is not a patch somebody is missing. */
      x_hasMissing: (p.missingSystem ?? 0) > 0 ? 'Yes' : 'No',
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const sevOf = (t: Ticket) => String((t as any).x_severity ?? '');
const missingOf = (t: Ticket) => Number((t as any).x_missing ?? 0);

/* The patch admin's queue, in the product's own terms: what is critical or important AND
   actually missing somewhere, what is missing but still waiting on an approval, what is
   cleared to deploy, what will cost a reboot window, and what the file server has not pulled
   down yet. Every card filters the list to exactly the rows it counted. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const missing = rows.filter((t) => (t as any).x_hasMissing === 'Yes');
  const graded = missing.filter((t) => sevOf(t) === 'Critical' || sevOf(t) === 'Important');
  const critical = graded.filter((t) => sevOf(t) === 'Critical').length;
  const pending = missing.filter((t) => (t as any).x_approvalStatus === 'Not Approved');
  const approved = rows.filter((t) => (t as any).x_approvalStatus === 'Approved');
  const reboot = rows.filter((t) => (t as any).x_reboot === 'Yes');
  const maybe = rows.filter((t) => (t as any).x_reboot === 'May be').length;
  const download = rows.filter((t) => (t as any).x_downloadStatus === 'Pending');
  const failed = rows.filter((t) => (t as any).x_downloadStatus === 'Failed').length;
  const gate = { field: 'x_hasMissing', condition: 'is' as const, values: ['Yes'] };
  return [
    {
      label: 'Critical & Important', value: graded.length, sub: `${critical} critical · ${graded.length - critical} important`,
      valueColor: graded.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_severity', condition: 'is', values: ['Critical', 'Important'] }, gate],
    },
    {
      label: 'Pending Approval', value: pending.length, sub: 'missing, not yet approved',
      valueColor: pending.length ? '#B45309' : undefined,
      filter: [{ field: 'x_approvalStatus', condition: 'is', values: ['Not Approved'] }, gate],
    },
    {
      label: 'Approved Patches', value: approved.length, sub: 'ready to deploy',
      valueColor: approved.length ? '#15803D' : undefined,
      filter: [{ field: 'x_approvalStatus', condition: 'is', values: ['Approved'] }],
    },
    {
      label: 'Reboot Required', value: reboot.length, sub: maybe ? `${maybe} more may need one` : 'plan a maintenance window',
      filter: [{ field: 'x_reboot', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'Download Pending', value: download.length, sub: failed ? `${failed} download${failed === 1 ? '' : 's'} failed` : 'not yet on the file server',
      valueColor: download.length ? '#B45309' : undefined,
      filter: [{ field: 'x_downloadStatus', condition: 'is', values: ['Pending'] }],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;
  const seg = (field: string, label: string, color: string) => ({
    label, value: by((t) => (t as any)[field] === label), color,
    filter: [{ field, condition: 'is' as const, values: [label] }],
  });

  const sevSegs = ['Critical', 'Important', 'Moderate', 'Low', 'Unspecified']
    .map((l) => seg('x_severity', l, SEV_COLOR[l])).filter((s) => s.value > 0);

  const catRows = [...new Set(rows.map((t) => String((t as any).x_category)))]
    .map((l) => seg('x_category', l, '#3D8BD0'))
    .sort((a, b) => b.value - a.value);

  const rebootRows = ['Yes', 'May be', 'No']
    .map((l) => seg('x_reboot', l, l === 'Yes' ? '#DC2626' : l === 'May be' ? '#F59E0B' : '#94A3B8'))
    .filter((r) => r.value > 0);

  /* The patches missing from the most machines — where deploying buys the most. */
  const reach = [...rows]
    .filter((t) => missingOf(t) > 0)
    .sort((a, b) => missingOf(b) - missingOf(a))
    .map((t) => ({ label: t.id, value: missingOf(t), color: '#8B5CF6' }));

  const approved = by((t) => (t as any).x_approvalStatus === 'Approved');
  const deployable = by((t) => (t as any).x_deployable === 'Yes');
  return {
    tiles: [
      { icon: ShieldAlert, color: '#DC2626', label: 'Critical severity', value: by((t) => sevOf(t) === 'Critical'), sub: `of ${rows.length} patches`, filter: [{ field: 'x_severity', condition: 'is', values: ['Critical'] }] },
      { icon: ShieldCheck, color: '#F59E0B', label: 'Awaiting approval', value: rows.length - approved, sub: 'blocked on a decision', filter: [{ field: 'x_approvalStatus', condition: 'is', values: ['Not Approved'] }] },
      { icon: Download, color: '#22C55E', label: 'Ready to deploy', value: deployable, sub: 'approved and downloaded', filter: [{ field: 'x_deployable', condition: 'is', values: ['Yes'] }] },
      { icon: Monitor, color: '#3D8BD0', label: 'Endpoints missing', value: rows.reduce((a, t) => a + missingOf(t), 0), sub: 'summed across patches' },
      { icon: RefreshCw, color: '#8B5CF6', label: 'Needs a reboot', value: by((t) => (t as any).x_needsReboot === 'Yes'), sub: 'maintenance window', filter: [{ field: 'x_needsReboot', condition: 'is', values: ['Yes'] }] },
    ],
    sections: [
      { kind: 'donut', title: 'By severity', sub: 'Where the risk sits', centerLabel: 'Patches', segs: sevSegs },
      { kind: 'bars', title: 'By category', sub: 'Which update stream they come from', rows: catRows.slice(0, 6), allRows: catRows, panelSubject: 'patches', panelColumnLabel: 'Category', panelCountLabel: 'Patches' },
      { kind: 'columns', title: 'Reboot requirement', sub: 'What a rollout will cost in downtime', rows: rebootRows },
      { kind: 'bars', title: 'Widest exposure', sub: 'Patches missing from the most endpoints', rows: reach.slice(0, 6), allRows: reach, panelSubject: 'patches', panelColumnLabel: 'Patch', panelCountLabel: 'Endpoints' },
      { kind: 'stack', title: 'Approval', sub: 'Cleared for deployment versus not', segs: [
        { label: 'Approved', value: approved, color: '#22C55E', filter: [{ field: 'x_approvalStatus', condition: 'is', values: ['Approved'] }] },
        { label: 'Not Approved', value: rows.length - approved, color: '#F59E0B', filter: [{ field: 'x_approvalStatus', condition: 'is', values: ['Not Approved'] }] },
      ] },
    ],
  };
};

export function PatchesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => PATCHES.rows, []);
  return (
    <AssetRegisterPage
      activePage="patches"
      stackModule="patches"
      viewsStore="patch"
      noun="patch"
      moduleCols="patch"
      defaultViewName="Missing Patches"
      footerNoun="patches"
      rows={rows}
      recordOf={(id) => PATCHES.byId.get(id)}
      filterAttrs={PATCH_FILTER_ATTRS}
      quickFilters={PATCH_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      /* A KB number is what anyone pastes in when chasing a patch. */
      searchFields={['x_kb', 'x_category', 'x_severity']}
      /* On the title line, not the tool rail — the rail below narrows what you are looking
         at, and the one control that MAKES something belongs at the page's own top-right
         corner. Same placement Reports uses. */
      primaryAction={{ label: 'Create' }}
      primaryActionInTitle
      /* The module's one catalogue-level action: pull the binaries down to the file server so
         the approved patches can actually deploy. Nothing else on this page needs a menu, so
         it is the single entry — the toolbar hides the ⋮ entirely when the list is empty. */
      moreActions={[{
        key: 'download-patch',
        label: 'Download Patch',
        icon: Download,
        onSelect: () => {
          const pending = rows.filter((t) => (t as any).x_downloadStatus !== 'Success').length;
          toast.success(
            pending
              ? `Downloading ${pending} patch${pending === 1 ? '' : 'es'} to the file server`
              : 'Every patch is already on the file server',
          );
        },
      }]}
      onNavigate={onNavigate}
    />
  );
}
