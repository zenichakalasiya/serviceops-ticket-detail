import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, ExternalLink, GitBranch, Monitor, Search, Server, ShieldAlert, Tag, X } from 'lucide-react';
import { Pagination } from './Pagination';
import { matchRules, optionsOf, RuleDetailPanel, selectAttr, SeverityPill, TagCell } from './ComplianceShared';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { BENCHMARKS_SEED, benchmarksUsingRule, COMPLIANCE_TYPES, RULES, SEVERITIES, SEVERITY_PILL } from './complianceData';
import type { Benchmark, ComplianceRule } from './complianceData';

/* Admin › Compliance › Rules — the predefined rule catalogue.
 *
 * READ ONLY by decision: rules ship with the product and are never created or edited here, so the
 * listing has no CTA, no Actions column and no lock (a lock on every row says nothing). A click
 * opens the rule's side panel. Same surface as every admin listing (User Surveys is the reference):
 * head → toolbar → full-bleed table → Pagination. The filter is the Patch Deployment tab's tabbed
 * Filter pill, so search answers "is there a rule for this" and the pill narrows by what a rule
 * is written for. */

export function AdminComplianceRulesModule({ benchmarks = BENCHMARKS_SEED }: { benchmarks?: Benchmark[] }) {
  const [search, setSearch] = useState('');
  const [rules, setRulesRaw] = useState<FilterRule[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [openId, setOpenId] = useState<string | null>(null);
  // Every filter change returns to page 1 — filtering to four rows from page 3 reads as "no results".
  const setRules = (next: FilterRule[]) => { setRulesRaw(next); setPage(1); };

  /* The rule catalogue's filter attributes — what a rule is written for. Severity carries the
     pill colours so its chips and value list read like the grid. */
  const attrs = useMemo(() => {
    const plain = (o: { label: string }[]) => o.map(({ label }) => ({ label }));
    return [
      selectAttr('type', 'Type', Monitor, plain(optionsOf(RULES, (r) => r.type, COMPLIANCE_TYPES))),
      selectAttr('platform', 'Platform', Server, plain(optionsOf(RULES, (r) => r.platform))),
      selectAttr('version', 'Version', GitBranch, plain(optionsOf(RULES, (r) => `${r.platform} ${r.version}`))),
      selectAttr('severity', 'Severity', ShieldAlert, SEVERITIES.map((v) => ({ label: v, color: SEVERITY_PILL[v].bar }))),
      selectAttr('tags', 'Tag', Tag, plain(optionsOf(RULES, (r) => r.tags))),
      selectAttr('profile', 'Profile', BadgeCheck, [{ label: 'L1' }, { label: 'L2' }]),
    ];
  }, []);
  // The two cuts a rule list is worked by: what it runs on, and how bad a failure is.
  const quick = useMemo<QuickFilterDef[]>(() => [
    { field: 'type', icon: Monitor, tip: 'Filter by type', title: 'Type is', width: 196, row: 'plain', options: attrs[0].options! },
    { field: 'severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 196, row: 'dot', options: attrs[3].options! },
    { field: 'profile', icon: BadgeCheck, tip: 'Filter by profile', title: 'Profile is', width: 160, row: 'plain', options: attrs[5].options! },
  ], [attrs]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byField = (r: ComplianceRule, f: string): string | string[] =>
      f === 'version' ? `${r.platform} ${r.version}` : f === 'tags' ? r.tags : String((r as any)[f] ?? '');
    return matchRules(RULES, rules, byField).filter((r) =>
      !q || [r.name, r.description, r.platform, ...r.tags, ...r.conditions.map((c) => c.pattern)].some((x) => x.toLowerCase().includes(q)));
  }, [search, rules]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const open: ComplianceRule | undefined = openId ? RULES.find((r) => r.id === openId) : undefined;

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h1 className="text-[16px] font-semibold text-[#364658]">Rules</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          The predefined checks benchmarks are built from — what to read, what it must equal, and how to fix it.{' '}
          <button type="button" onClick={() => toast.success('Opening the docs')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View Docs <ExternalLink size={12} />
          </button>
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search"
            className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
          )}
        </div>
        <TicketFilterBar rules={rules} setRules={setRules} noun="rule" attrs={attrs} quickFilters={quick} />
      </div>

      <div className="-mx-4 overflow-x-auto">
        <table className="w-full min-w-[1200px] table-fixed leading-5">
          <colgroup>
            <col className="w-[30%]" /><col className="w-[24%]" /><col className="w-[100px]" /><col className="w-[100px]" />
            <col className="w-[190px]" /><col className="w-[100px]" /><col className="w-[80px]" /><col className="w-[220px]" />
          </colgroup>
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {['Rule', 'Description', 'Severity', 'Type', 'Platform', 'Version', 'Profile', 'Tag'].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No rule matches these filters.</td></tr>
            ) : pageRows.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)} className="cursor-pointer transition-colors hover:bg-[#f9fafb]">
                <td className="px-4 py-3">
                  <span className="block truncate text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={r.name}>{r.name}</span>
                </td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]" title={r.description}>{r.description}</span></td>
                <td className="whitespace-nowrap px-4 py-3"><SeverityPill severity={r.severity} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{r.type}</td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#364658]" title={r.platform}>{r.platform}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{r.version}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${r.profile === 'L1' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F3EEFF] text-[#7C3AED]'}`} title={r.profile === 'L1' ? 'Level 1 — must have' : 'Level 2 — good to have'}>{r.profile}</span></td>
                <td className="px-4 py-3"><TagCell tags={r.tags} /></td>
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

      {open && (
        <RuleDetailPanel
          rule={open}
          usedIn={benchmarksUsingRule(benchmarks, open.id).map((b) => b.name)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
