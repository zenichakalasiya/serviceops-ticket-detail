/* ── Detected CVEs listing ───────────────────────────────────────────────────
   The shared register chrome over the real `mockDetectedCves`. Same columns the module
   always showed, now with the filter builder, saved views, grouping and multi-sort.

   TWO layouts — **List + KPI** and **Dashboard**. Both answer what the CVE detail page
   leads with (see DetectedCveDrawer's header: severity, CVSS, exploitation, whether a
   patch exists, how many endpoints), so the listing and the record tell one story. */
import { useMemo, useState } from 'react';
import { Bug, Gauge, Monitor, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { PatchVulnEndpointsPanel } from './upstream/PatchVulnEndpointsPanel';
import { endpointsForCve } from './upstream/PatchVulnerabilitiesTab';
import { INITIAL_COMPUTERS } from './upstream/PatchComputersTab';
import { CVE_FILTER_ATTRS, CVE_QUICK_FILTERS, cvssBand } from './vulnFilterAttrs';
import {
  cveApprovalOf, cveLastUpdatedOf, cveScoreOf, cveTitleOf, cveToPatchShape, cveVectorOf,
  cveVulnTypeOf, mockDetectedCves, type DetectedCve,
} from './DetectedCvesListPage';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const parsePublished = (s: string): Date | null => {
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

const SEV_COLOR: Record<string, string> = { Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };
const STATUS_COLOR: Record<string, string> = { Analyzed: '#22C55E', Modified: '#3D8BD0', 'Awaiting Analysis': '#F59E0B' };

const CVES: { rows: Ticket[]; byId: Map<string, DetectedCve> } = (() => {
  const byId = new Map<string, DetectedCve>();
  const rows = mockDetectedCves.map((c) => {
    byId.set(c.id, c);
    const published = parsePublished(c.publishedDate) ?? new Date();
    return {
      id: c.id,
      subject: c.description,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: published,
      createdBy: published,
      /* NVD's own workflow state, through the shared status cell. */
      status: c.status as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_severity: c.severity,
      x_cwe: c.cweId,
      x_impacted: c.impactedEndpoints,
      x_patchAvail: c.patchAvailability,
      x_cvss: c.cvssScore,
      x_cvssBand: cvssBand(c.cvssScore),
      x_exploit: c.exploitStatus,
      x_published: published,
      /* The rest of the product's attribute set, derived in DetectedCvesListPage so the row
         and the record it opens can never disagree. A score the record does not carry prints
         "—" rather than a zero that would read as "scored nothing". */
      x_title: cveTitleOf(c),
      x_vulnType: cveVulnTypeOf(c),
      /* One decimal, like the graded CVSS 3.1 column — "7" beside "7.0" in the next column
         reads as two different measurements of the same thing. */
      x_cvss20: cveScoreOf(c, '2.0')?.toFixed(1) ?? '—',
      x_cvss20Vector: cveVectorOf(c, '2.0'),
      x_cvss30: cveScoreOf(c, '3.0')?.toFixed(1) ?? '—',
      x_cvss30Vector: cveVectorOf(c, '3.0'),
      x_cvss31Vector: cveVectorOf(c, '3.1'),
      x_cvss40: cveScoreOf(c, '4.0')?.toFixed(1) ?? '—',
      x_cvss40Vector: cveVectorOf(c, '4.0'),
      x_lastUpdated: new Date(cveLastUpdatedOf(c)),
      x_approvalStatus: cveApprovalOf(c),
      /* The gate every KPI card applies — a CVE touching no machine is catalogue, not a finding. */
      x_active: c.impactedEndpoints > 0 ? 'Yes' : 'No',
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const sevOf = (t: Ticket) => String((t as any).x_severity ?? '');

/* Every card is gated on "impacting at least one endpoint" — a CVE touching no machine is a
   catalogue entry, not a finding — and then cut the way an analyst works through them: what
   is high priority, what is already being exploited, what has a fix, what does not. Every
   card filters the list to exactly the rows it counted. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const active = rows.filter((t) => (t as any).x_active === 'Yes');
  const priority = active.filter((t) => sevOf(t) === 'Critical' || sevOf(t) === 'High');
  const critical = priority.filter((t) => sevOf(t) === 'Critical').length;
  const exploited = active.filter((t) => (t as any).x_exploit === 'Yes');
  const fixable = active.filter((t) => (t as any).x_patchAvail === 'Yes');
  const noFix = active.filter((t) => (t as any).x_patchAvail === 'No');
  const gate = { field: 'x_active', condition: 'is' as const, values: ['Yes'] };
  return [
    {
      label: 'Active CVEs', value: active.length, sub: `of ${rows.length} detected`,
      filter: [gate],
    },
    {
      label: 'High Priority CVEs', value: priority.length, sub: `${critical} critical · ${priority.length - critical} high`,
      valueColor: priority.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_severity', condition: 'is', values: ['Critical', 'High'] }, gate],
    },
    {
      label: 'Exploited CVEs', value: exploited.length, sub: 'exploit seen in the wild',
      valueColor: exploited.length ? '#B42318' : undefined,
      filter: [{ field: 'x_exploit', condition: 'is', values: ['Yes'] }, gate],
    },
    {
      label: 'Fixable CVEs', value: fixable.length, sub: 'patch available to deploy',
      valueColor: fixable.length ? '#15803D' : undefined,
      filter: [{ field: 'x_patchAvail', condition: 'is', values: ['Yes'] }, gate],
    },
    {
      label: 'No Fix Available', value: noFix.length, sub: 'needs mitigation or exception',
      valueColor: noFix.length ? '#B45309' : undefined,
      filter: [{ field: 'x_patchAvail', condition: 'is', values: ['No'] }, gate],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;
  const sevSegs = ['Critical', 'High', 'Medium', 'Low']
    .map((label) => ({
      label, value: by((t) => sevOf(t) === label), color: SEV_COLOR[label],
      filter: [{ field: 'x_severity', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const statusSegs = ['Analyzed', 'Modified', 'Awaiting Analysis']
    .map((label) => ({
      label, value: by((t) => (t.status as string) === label), color: STATUS_COLOR[label],
      filter: [{ field: 'status', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const cweRows = [...new Set(rows.map((t) => String((t as any).x_cwe)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_cwe === label), color: '#8B5CF6',
      filter: [{ field: 'x_cwe', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  const bandRows = ['Critical (9.0+)', 'High (7.0–8.9)', 'Medium (4.0–6.9)', 'Low (0.1–3.9)']
    .map((label) => ({
      label, value: by((t) => (t as any).x_cvssBand === label),
      color: label.startsWith('Critical') ? '#DC2626' : label.startsWith('High') ? '#EF4444' : label.startsWith('Medium') ? '#F59E0B' : '#22C55E',
      filter: [{ field: 'x_cvssBand', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  const exploited = by((t) => (t as any).x_exploit === 'Yes');
  const patched = by((t) => (t as any).x_patchAvail === 'Yes');
  return {
    tiles: [
      { icon: Bug, color: '#B42318', label: 'Exploited', value: exploited, sub: 'in the wild', filter: [{ field: 'x_exploit', condition: 'is', values: ['Yes'] }] },
      { icon: ShieldAlert, color: '#EF4444', label: 'High or critical', value: by((t) => sevOf(t) === 'High' || sevOf(t) === 'Critical'), sub: `of ${rows.length} CVEs`, filter: [{ field: 'x_severity', condition: 'is', values: ['High', 'Critical'] }] },
      { icon: ShieldCheck, color: '#DC2626', label: 'No patch available', value: rows.length - patched, sub: 'nothing to deploy yet', filter: [{ field: 'x_patchAvail', condition: 'is', values: ['No'] }] },
      { icon: Gauge, color: '#F97316', label: 'CVSS 9.0+', value: by((t) => Number((t as any).x_cvss ?? 0) >= 9), sub: 'critical-scored', filter: [{ field: 'x_cvssBand', condition: 'is', values: ['Critical (9.0+)'] }] },
      { icon: Monitor, color: '#3D8BD0', label: 'Endpoints affected', value: rows.reduce((a, t) => a + Number((t as any).x_impacted ?? 0), 0), sub: 'summed across CVEs' },
    ],
    sections: [
      { kind: 'donut', title: 'By severity', sub: 'How bad they are', centerLabel: 'CVEs', segs: sevSegs },
      { kind: 'columns', title: 'By CVSS band', sub: 'How they score', rows: bandRows },
      { kind: 'donut', title: 'By NVD status', sub: 'Where each sits in analysis', centerLabel: 'CVEs', segs: statusSegs },
      { kind: 'bars', title: 'By weakness type', sub: 'The CWE classes behind them', rows: cweRows.slice(0, 6), allRows: cweRows, panelSubject: 'CVEs', panelColumnLabel: 'CWE', panelCountLabel: 'CVEs' },
      { kind: 'stack', title: 'Remediation readiness', sub: 'Whether a fix exists yet', segs: [
        { label: 'Patch available', value: patched, color: '#22C55E', filter: [{ field: 'x_patchAvail', condition: 'is', values: ['Yes'] }] },
        { label: 'No patch', value: rows.length - patched, color: '#DC2626', filter: [{ field: 'x_patchAvail', condition: 'is', values: ['No'] }] },
      ] },
    ],
  };
};

export function DetectedCvesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => CVES.rows, []);
  /* Same popup, same picker as the patch page's Vulnerabilities grid — a CVE names the same
     machines wherever a reader meets it. */
  const [impacted, setImpacted] = useState<Ticket | null>(null);
  return (
    <>
    <AssetRegisterPage
      activePage="detected-cves"
      stackModule="detected-cves"
      viewsStore="cve"
      noun="CVE"
      moduleCols="cve"
      defaultViewName="Detected Vulnerabilities"
      footerNoun="CVEs"
      rows={rows}
      recordOf={(id) => { const c = CVES.byId.get(id); return c ? cveToPatchShape(c) : undefined; }}
      filterAttrs={CVE_FILTER_ATTRS}
      quickFilters={CVE_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_cwe', 'x_severity', 'x_cvssBand']}
      moreActions={[]}
      onRowAction={(t, action) => { if (action === 'impacted-endpoints') setImpacted(t); }}
      onNavigate={onNavigate}
    />
    <PatchVulnEndpointsPanel
      isOpen={!!impacted}
      onClose={() => setImpacted(null)}
      cveId={impacted?.id}
      endpoints={impacted ? endpointsForCve(impacted.id, Number((impacted as any).x_impacted ?? 0), INITIAL_COMPUTERS) : []}
    />
    </>
  );
}
