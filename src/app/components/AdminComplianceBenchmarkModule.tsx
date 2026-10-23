import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, Copy, ExternalLink, FolderPlus, Layers, Link2, Lock, Monitor, MoreVertical,
  Pencil, Plus, Search, ShieldAlert, Tag, Trash2, X,
} from 'lucide-react';
import { Pagination } from './Pagination';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderCopyButton } from './HeaderCopyButton';
import { DrawerTabStrip } from './DrawerTabStrip';
import { PickerDrawer } from './CreatePatchDeployment';
import type { PickerColumn } from './CreatePatchDeployment';
import { ErrorText, FieldLabel, RuleSelect, TagEditor, inputCls as formInputCls } from './FormRuleControls';
import { matchRules, optionsOf, RuleDetailPanel, selectAttr, SeverityPill, TagCell } from './ComplianceShared';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  benchmarkRuleIds, benchmarksUsingRule, benchmarkTree, COMPLIANCE_TYPES, fmtDate, groupRuleIds, osVersionOf, osVersionsFor, RULES, ruleById,
  PROFILES, profileAllows, SEVERITIES, SEVERITY_PILL,
} from './complianceData';
import type { Benchmark, ComplianceRule, ComplianceType, Profile, RuleGroup } from './complianceData';

/* Admin › Compliance › Benchmark.
 *
 * LISTING → a click opens the benchmark's DETAIL as a full-screen drawer over the listing, the
 * ticket detail page's shape: open-item tab bar with window controls, ID pill + name + KPI strip,
 * header actions (copy link · Edit · ⋮ Clone/Delete), a Rule Groups tab, and a Benchmark
 * Properties panel on the right. It is READ ONLY; the Edit icon opens the FORM (create / edit /
 * clone), a full page with the admin sidebar stood down, as the Form Rule editor is.
 *
 * A benchmark targets ONE Type and ONE OS version, and only that version's rules can be attached.
 * A Default benchmark ships with the product: Edit and Delete are disabled with the reason, Clone
 * is always offered. A benchmark a compliance policy uses cannot be deleted. Default and Custom
 * benchmarks read the same way — numbered rule groups that expand to their rules. */

type Screen = { kind: 'list'; open?: string } | { kind: 'form'; id?: string; from?: string; back?: string };

const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
/** The drawer header's boxed icon button (ticket header: Watch, Edit). */
const boxedBtn = 'inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';
const inputCls = formInputCls.replace('rounded-md', 'rounded');
const typeOptions = COMPLIANCE_TYPES.map((t) => ({ value: t, label: t }));

/* The product's secondary outlined CTA (the listings' Filters button, OS Upgrade's outlined CTAs): white, #DFE5ED border, 13px. */
const SECONDARY_CTA = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';

const DEFAULT_READ_ONLY = 'A Default benchmark is read only — clone it to make an editable copy';
const deleteReason = (b: Benchmark) =>
  b.origin === 'Default' ? 'A Default benchmark cannot be deleted'
    : b.usedBy ? `Used by ${b.usedBy} compliance polic${b.usedBy > 1 ? 'ies' : 'y'} — remove it from them first` : undefined;

let seq = 100;
const nextId = () => `BM-${++seq}`;

/** A rule's or benchmark's CIS profile — L1 must have, L2 good to have. */
function ProfileChip({ profile }: { profile: Profile }) {
  return (
    <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${profile === 'L1' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F3EEFF] text-[#7C3AED]'}`} title={profile === 'L1' ? 'Level 1 — must have' : 'Level 2 — good to have'}>{profile}</span>
  );
}

/** A disabled control says WHY on hover — a Radix tooltip needs a wrapper to fire on a disabled button. */
function ActionIcon({ label, reason, onClick, danger, children }: {
  label: string;
  reason?: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <button
            type="button"
            disabled={!!reason}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`${iconBtn} ${danger ? 'hover:!bg-[#FEF2F2] hover:!text-[#DC2626]' : ''}`}
          >{children}</button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-wrap max-w-[260px]">{reason ?? label}</TooltipContent>
    </Tooltip>
  );
}

export function AdminComplianceBenchmarkModule({ benchmarks, onChange, onEditor }: {
  benchmarks: Benchmark[];
  onChange: (b: Benchmark[]) => void;
  /** The form is a full page — the admin sidebar stands down while it is open. */
  onEditor: (open: boolean) => void;
}) {
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  useEffect(() => { onEditor(screen.kind === 'form'); }, [screen.kind, onEditor]);
  useEffect(() => () => onEditor(false), [onEditor]);
  const [pendingDelete, setPendingDelete] = useState<Benchmark | null>(null);

  if (screen.kind === 'form') {
    const editing = screen.id ? benchmarks.find((x) => x.id === screen.id) : undefined;
    const source = screen.from ? benchmarks.find((x) => x.id === screen.from) : undefined;
    return (
      <BenchmarkForm
        editing={editing}
        source={source}
        names={benchmarks.filter((b) => b.id !== editing?.id).map((b) => b.name.toLowerCase())}
        // Cancel goes back to where the form was opened from — the detail drawer or the listing.
        onCancel={() => setScreen({ kind: 'list', open: screen.back })}
        onSave={(b) => {
          onChange(editing ? benchmarks.map((x) => (x.id === b.id ? b : x)) : [b, ...benchmarks]);
          toast.success(editing ? `“${b.name}” updated` : `“${b.name}” created`);
          setScreen({ kind: 'list', open: b.id });
        }}
      />
    );
  }

  const open = screen.open ? benchmarks.find((x) => x.id === screen.open) : undefined;
  return (
    <>
      <BenchmarkList
        benchmarks={benchmarks}
        onOpen={(id) => setScreen({ kind: 'list', open: id })}
        onCreate={() => setScreen({ kind: 'form' })}
        onEdit={(id) => setScreen({ kind: 'form', id })}
        onClone={(id) => setScreen({ kind: 'form', from: id })}
        onDelete={setPendingDelete}
      />
      {open && (
        <BenchmarkDrawer
          benchmark={open}
          benchmarks={benchmarks}
          onClose={() => setScreen({ kind: 'list' })}
          onEdit={() => setScreen({ kind: 'form', id: open.id, back: open.id })}
          onClone={() => setScreen({ kind: 'form', from: open.id, back: open.id })}
          onDelete={() => setPendingDelete(open)}
        />
      )}
      {pendingDelete && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setPendingDelete(null)}>
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Delete “{pendingDelete.name}”?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">The benchmark is removed. Its rules stay in the catalogue.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  onChange(benchmarks.filter((x) => x.id !== pendingDelete.id));
                  toast.success(`“${pendingDelete.name}” deleted`);
                  if (screen.open === pendingDelete.id) setScreen({ kind: 'list' });
                  setPendingDelete(null);
                }}
                className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]"
              >Delete benchmark</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Listing ─────────────────────────────────────────────────────────────────────────────── */

function BenchmarkList({ benchmarks, onOpen, onCreate, onEdit, onClone, onDelete }: {
  benchmarks: Benchmark[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onClone: (id: string) => void;
  onDelete: (b: Benchmark) => void;
}) {
  const [search, setSearch] = useState('');
  const [rules, setRulesRaw] = useState<FilterRule[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const setRules = (next: FilterRule[]) => { setRulesRaw(next); setPage(1); };

  const attrs = useMemo(() => {
    const plain = (o: { label: string }[]) => o.map(({ label }) => ({ label }));
    return [
      selectAttr('type', 'Type', Monitor, plain(optionsOf(benchmarks, (b) => b.type, COMPLIANCE_TYPES))),
      selectAttr('origin', 'Origin', BadgeCheck, plain(optionsOf(benchmarks, (b) => b.origin, ['Default', 'Custom']))),
      selectAttr('tags', 'Tag', Tag, plain(optionsOf(benchmarks, (b) => b.tags))),
    ];
  }, [benchmarks]);
  // Type, Origin and Tag are every cut this list has, so they are all quick filters and the
  // Filters builder (and its pill) is switched off — it would only offer the same three again.
  const quick = useMemo<QuickFilterDef[]>(() => [
    { field: 'type', icon: Monitor, tip: 'Filter by type', title: 'Type is', width: 196, row: 'plain', options: attrs[0].options! },
    { field: 'origin', icon: BadgeCheck, tip: 'Filter by origin', title: 'Origin is', width: 180, row: 'plain', options: attrs[1].options! },
    { field: 'tags', icon: Tag, tip: 'Filter by tag', title: 'Tag is', width: 220, row: 'plain', options: attrs[2].options! },
  ], [attrs]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byField = (b: Benchmark, f: string): string | string[] => (f === 'tags' ? b.tags : String((b as any)[f] ?? ''));
    return matchRules(benchmarks, rules, byField).filter((b) =>
      !q || [b.name, b.description, b.osVersion, ...b.tags].some((x) => x.toLowerCase().includes(q)));
  }, [benchmarks, search, rules]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <h1 className="text-[16px] font-semibold text-[#364658]">Benchmark</h1>
        <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
          Named sets of rules for one OS version, assessed by compliance policies.{' '}
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
        <TicketFilterBar rules={rules} setRules={setRules} noun="benchmark" attrs={attrs} quickFilters={quick} showFilterBuilder={false} />
        <div className="ml-auto">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]"
          ><Plus size={15} /> Create Benchmark</button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto">
        <table className="w-full min-w-[1400px] table-fixed leading-5">
          <colgroup>
            <col className="w-[27%]" /><col className="w-[21%]" /><col className="w-[90px]" /><col className="w-[190px]" /><col className="w-[80px]" /><col className="w-[90px]" />
            <col className="w-[70px]" /><col className="w-[100px]" /><col className="w-[200px]" /><col className="w-[130px]" />
          </colgroup>
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {['Benchmark', 'Description', 'Type', 'Version', 'Profile', 'Origin', 'Rules', 'Used Count', 'Tag', 'Actions'].map((h) => (
                <th key={h} className={`whitespace-nowrap px-4 py-2.5 text-[12px] font-semibold tracking-wider text-[#364658] ${h === 'Rules' || h === 'Used Count' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No benchmark matches these filters.</td></tr>
            ) : pageRows.map((b) => (
              <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer transition-colors hover:bg-[#f9fafb]">
                <td className="px-4 py-3">
                  <span className="block truncate text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={b.name}>{b.name}</span>
                </td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]" title={b.description}>{b.description || <span className="text-[#9CA3AF]">—</span>}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{b.type}</td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#364658]" title={b.osVersion}>{b.osVersion || '—'}</span></td>
                <td className="px-4 py-3"><ProfileChip profile={b.profile} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{b.origin}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] text-[#364658]">{benchmarkRuleIds(b).length}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right text-[13px] ${b.usedBy ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{b.usedBy}</td>
                <td className="px-4 py-3"><TagCell tags={b.tags} /></td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-0.5">
                    <ActionIcon label="Edit" reason={b.origin === 'Default' ? DEFAULT_READ_ONLY : undefined} onClick={() => onEdit(b.id)}><Pencil size={15} /></ActionIcon>
                    <ActionIcon label="Clone" onClick={() => onClone(b.id)}><Copy size={15} /></ActionIcon>
                    <ActionIcon label="Delete" danger reason={deleteReason(b)} onClick={() => onDelete(b)}><Trash2 size={15} /></ActionIcon>
                  </span>
                </td>
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
    </div>
  );
}

/* ── Rule groups — ONE card for the detail page and the form ─────────────────────────────── */

/** The empty group's picture: the OS the benchmark targets, feeding a stack of numbered rule
 *  cards, with the next one still to come (dashed, +). It says where the rules come from — the
 *  benchmark's OS Type and Version — and that they land here in order. */
function EmptyRulesArt() {
  return (
    <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="78" cy="56" rx="66" ry="42" fill="#F3F7FC" />
      {/* OS badge — a monitor, with a version chip under it */}
      <rect x="10" y="30" width="42" height="42" rx="10" fill="#FFFFFF" stroke="#D6E2EF" strokeWidth="1.25" />
      <rect x="19" y="39" width="24" height="16" rx="2.5" fill="#EBF5FF" stroke="#3D8BD0" strokeWidth="1.5" />
      <path d="M27 61 H35 M31 55 V61" stroke="#3D8BD0" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="23.5" y="44" width="9" height="1.8" rx=".9" fill="#3D8BD0" />
      <rect x="23.5" y="48" width="14" height="1.8" rx=".9" fill="#9DC3E8" />
      <rect x="14" y="77" width="34" height="11" rx="5.5" fill="#EBF5FF" />
      <rect x="19" y="81.2" width="10" height="2.6" rx="1.3" fill="#3D8BD0" />
      <rect x="31" y="81.2" width="12" height="2.6" rx="1.3" fill="#9DC3E8" />
      {/* the flow from the OS into the group */}
      <path d="M53 51 H66" stroke="#9DC3E8" strokeWidth="1.5" strokeDasharray="3 2.5" strokeLinecap="round" />
      <path d="M63 47.5 L67 51 L63 54.5" stroke="#9DC3E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* rule cards: one behind, one attached (1.1, passing), the next one still empty */}
      <rect x="78" y="10" width="58" height="18" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      <rect x="72" y="22" width="64" height="26" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="78" y="30" width="15" height="10" rx="2.5" fill="#EEF2F6" />
      <text x="85.5" y="37.4" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#64748B" fontFamily="Inter, system-ui, sans-serif">1.1</text>
      <rect x="97" y="30.5" width="22" height="2.4" rx="1.2" fill="#94A3B8" />
      <rect x="97" y="35.6" width="14" height="2.2" rx="1.1" fill="#CBD5E1" />
      <circle cx="127" cy="35" r="4.5" fill="#DCFCE7" />
      <path d="M125 35.1 L126.5 36.6 L129.2 33.6" stroke="#16A34A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="72" y="54" width="64" height="26" rx="5" fill="#FFFFFF" stroke="#8DB7E0" strokeWidth="1.25" strokeDasharray="3.5 2.5" />
      <rect x="78" y="62" width="15" height="10" rx="2.5" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 1.5" />
      <rect x="97" y="62.5" width="22" height="2.4" rx="1.2" fill="#E2E8F0" />
      <rect x="97" y="67.6" width="14" height="2.2" rx="1.1" fill="#EEF2F6" />
      <circle cx="133" cy="80" r="9.5" fill="#3D8BD0" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M133 75.8 V84.2 M128.8 80 H137.2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** A button that explains itself when it cannot be used — a Radix tooltip needs a wrapper to
 *  fire on a disabled button. */
function ReasonButton({ reason, onClick, className, children }: { reason?: string; onClick?: () => void; className: string; children: React.ReactNode }) {
  const btn = <button type="button" disabled={!!reason} onClick={(e) => { e.stopPropagation(); onClick?.(); }} className={className}>{children}</button>;
  if (!reason) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="inline-flex">{btn}</span></TooltipTrigger>
      <TooltipContent className="text-wrap max-w-[260px]">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** A name that reads as a title and becomes a field on hover/focus. It SIZES TO ITS TEXT (a
 *  hidden twin sets the width), so whatever follows sits right after the name. */
function GroupName({ value, placeholder, onChange, invalid, small }: { value: string; placeholder: string; onChange: (v: string) => void; invalid?: boolean; small?: boolean }) {
  const text = small ? 'text-[13px] font-medium' : 'text-[13px] font-semibold';
  return (
    <span className="inline-grid min-w-0 max-w-[420px]">
      <span aria-hidden className={`invisible col-start-1 row-start-1 overflow-hidden whitespace-pre border border-transparent px-2 ${text}`}>{value || placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        size={1}
        className={`col-start-1 row-start-1 h-8 w-full min-w-[60px] rounded border bg-transparent px-2 ${text} text-[#364658] placeholder:font-normal placeholder:text-[#9CA3AF] hover:border-[#DFE5ED] hover:bg-white focus:border-[#3D8BD0] focus:bg-white focus:outline-none ${invalid ? 'border-[#F25C4E]' : 'border-transparent'}`}
      />
    </span>
  );
}

const countChip = (n: number) => (
  <span className="flex-shrink-0 rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{n} rule{n === 1 ? '' : 's'}</span>
);

function GroupCard({
  group, index, open, onToggle, editable, showErrors, ruleScope, onRename, onAttach, attachReason, onAddSub, onDelete, deleteGroupReason,
  onRemoveRule, onOpenRule,
}: {
  group: RuleGroup;
  index: number;
  open: boolean;
  onToggle: () => void;
  editable?: boolean;
  /** Save was tried — blank names show red. */
  showErrors?: boolean;
  /** The OS version rules are listed for, said in the empty state ("Debian Linux 11"). */
  ruleScope?: string;
  /** subId = a sub-group; without it, the group itself. */
  onRename?: (name: string, subId?: string) => void;
  onAttach?: (subId?: string) => void;
  /** Why Attach Rules is unavailable (no Type / Version yet). */
  attachReason?: string;
  onAddSub?: () => void;
  onDelete?: (subId?: string) => void;
  deleteGroupReason?: string;
  onRemoveRule?: (id: string) => void;
  onOpenRule?: (id: string) => void;
}) {
  const subs = group.children ?? [];
  const n = index + 1;
  const total = groupRuleIds(group).length;
  const empty = group.ruleIds.length === 0 && subs.length === 0;
  // Sub-groups start open — the hierarchy is the point of having them.
  const [shut, setShut] = useState<Set<string>>(new Set());
  const toggleSub = (id: string) => setShut((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });
  const cols = editable ? 6 : 5;

  const ruleRow = (id: string, number: string, depth: 1 | 2) => {
    const r = ruleById(id);
    if (!r) return null;
    return (
      <tr key={id} onClick={() => onOpenRule?.(id)} className={`group/row transition-colors hover:bg-[#f9fafb] ${onOpenRule ? 'cursor-pointer' : ''}`}>
        <td className={`py-2.5 pr-2 ${depth === 2 ? 'pl-10' : 'pl-4'}`}>
          <span className="text-[12px] font-medium tabular-nums text-[#7B8FA5]">{number}</span>
        </td>
        <td className="px-4 py-2.5"><span className="block truncate text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]" title={r.name}>{r.name}</span></td>
        <td className="px-4 py-2.5"><span className="block truncate text-[13px] text-[#64748B]">{osVersionOf(r)}</span></td>
        <td className="px-4 py-2.5"><ProfileChip profile={r.profile} /></td>
        <td className="px-4 py-2.5"><SeverityPill severity={r.severity} /></td>
        {editable && (
          <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
              <ActionIcon label="Remove from group" onClick={() => onRemoveRule?.(id)}><X size={15} /></ActionIcon>
            </span>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className={`rounded-lg border ${showErrors && !group.name.trim() ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
      {/* Header — number · name · count, actions right. A click anywhere on the band (not on a
          field or a button) expands / collapses the group. */}
      <div
        onClick={(e) => { if (!(e.target as HTMLElement).closest('input,button')) onToggle(); }}
        className={`group/gh flex cursor-pointer items-center gap-2 bg-[#F6F9FC] px-3 py-2 ${open ? 'rounded-t-lg border-b border-[#E5E7EB]' : 'rounded-lg'}`}
      >
        {/* The group's NUMBER at rest; hovering the group turns it into the expand/collapse chevron. */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Collapse group' : 'Expand group'}
          aria-expanded={open}
          className="flex size-6 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[12px] font-semibold text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
        >
          <span className="group-hover/gh:hidden">{n}</span>
          <span className="hidden group-hover/gh:flex">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        </button>
        {editable
          ? <GroupName value={group.name} placeholder="Name this group" onChange={(v) => onRename?.(v)} />
          : <span className="min-w-0 truncate px-2 text-[13px] font-semibold text-[#364658]" title={group.name}>{group.name}</span>}
        {/* No count while the group is empty — "0 rules" repeats what the empty state says. */}
        {total > 0 && countChip(total)}
        {editable && (
          <span className="ml-auto flex items-center gap-2">
            {/* An empty group carries its two CTAs in the middle of its empty state instead. */}
            {!empty && (
              <>
                <ReasonButton reason={attachReason} onClick={() => onAttach?.()} className={SECONDARY_CTA}><Link2 size={14} /> Attach Rules</ReasonButton>
                <ReasonButton onClick={onAddSub} className={SECONDARY_CTA}><FolderPlus size={14} /> Add Sub-group</ReasonButton>
              </>
            )}
            <ActionIcon label="Delete group" danger reason={deleteGroupReason} onClick={() => onDelete?.()}><Trash2 size={15} /></ActionIcon>
          </span>
        )}
      </div>

      {open && (
        empty ? (
          editable ? (
            <div className="flex flex-col items-center px-4 pb-6 pt-5 text-center">
              <EmptyRulesArt />
              <div className="mt-3 text-[14px] font-semibold text-[#364658]">No rules in this group yet</div>
              <p className="mt-1 max-w-[440px] text-[13px] leading-[1.55] text-[#64748B]">
                {attachReason ?? <>Attach rules written for <span className="font-medium text-[#364658]">{ruleScope}</span>. Add a sub-group to organise them a level deeper.</>}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <ReasonButton reason={attachReason} onClick={() => onAttach?.()} className={SECONDARY_CTA}><Link2 size={14} /> Attach Rules</ReasonButton>
                <ReasonButton onClick={onAddSub} className={SECONDARY_CTA}><FolderPlus size={14} /> Add Sub-group</ReasonButton>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 text-[13px] text-[#9CA3AF]">No rules in this group.</div>
          )
        ) : (
          <table className="w-full table-fixed">
            <colgroup><col className="w-[96px]" /><col /><col className="w-[200px]" /><col className="w-[80px]" /><col className="w-[110px]" />{editable && <col className="w-[56px]" />}</colgroup>
            <thead>
              <tr className="border-b border-[#EEF1F4]">
                {['No.', 'Rule', 'Platform', 'Profile', 'Severity', ...(editable ? [''] : [])].map((h, i) => <th key={i} className="px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {/* Level 2 — the group's own rules: 1.1, 1.2 … */}
              {group.ruleIds.map((id, i) => ruleRow(id, `${n}.${i + 1}`, 1))}
              {/* Sub-groups number on after them (1.3), and their rules take level 3 (1.3.1). */}
              {subs.map((s, k) => {
                const sn = `${n}.${group.ruleIds.length + k + 1}`;
                const sOpen = !shut.has(s.id);
                return (
                  <SubGroupRows
                    key={s.id}
                    number={sn}
                    sub={s}
                    open={sOpen}
                    onToggle={() => toggleSub(s.id)}
                    cols={cols}
                    editable={editable}
                    invalid={showErrors && !s.name.trim()}
                    attachReason={attachReason}
                    onRename={(v) => onRename?.(v, s.id)}
                    onAttach={() => onAttach?.(s.id)}
                    onDelete={() => onDelete?.(s.id)}
                  >
                    {sOpen && s.ruleIds.map((id, j) => ruleRow(id, `${sn}.${j + 1}`, 2))}
                  </SubGroupRows>
                );
              })}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

/** A sub-group inside its group's table: a tinted header row, then its rules. */
function SubGroupRows({ number, sub, open, onToggle, cols, editable, invalid, attachReason, onRename, onAttach, onDelete, children }: {
  number: string;
  sub: RuleGroup;
  open: boolean;
  onToggle: () => void;
  cols: number;
  editable?: boolean;
  invalid?: boolean;
  attachReason?: string;
  onRename: (v: string) => void;
  onAttach: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const count = sub.ruleIds.length;
  return (
    <>
      <tr className="bg-[#FAFBFC]">
        <td colSpan={cols} className="px-4 py-1.5">
          <div
            onClick={(e) => { if (!(e.target as HTMLElement).closest('input,button')) onToggle(); }}
            className="flex cursor-pointer items-center gap-2"
          >
            <button type="button" onClick={onToggle} aria-label={open ? 'Collapse sub-group' : 'Expand sub-group'} aria-expanded={open} className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] hover:text-[#364658]">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <span className="w-[52px] flex-shrink-0 text-[12px] font-semibold tabular-nums text-[#364658]">{number}</span>
            {editable
              ? <GroupName small value={sub.name} placeholder="Name this sub-group" onChange={onRename} invalid={invalid} />
              : <span className="min-w-0 truncate px-2 text-[13px] font-medium text-[#364658]" title={sub.name}>{sub.name}</span>}
            {count > 0 && countChip(count)}
            {editable && (
              <span className="ml-auto flex items-center gap-1.5">
                <ReasonButton reason={attachReason} onClick={onAttach} className={`${SECONDARY_CTA} !h-7 !px-2.5 !text-[12px]`}><Link2 size={13} /> Attach Rules</ReasonButton>
                <ActionIcon label="Delete sub-group" danger onClick={onDelete}><Trash2 size={15} /></ActionIcon>
              </span>
            )}
          </div>
        </td>
      </tr>
      {open && count === 0 && (
        <tr><td colSpan={cols} className="py-2.5 pl-10 pr-4 text-[12px] text-[#9CA3AF]">{editable ? 'No rules in this sub-group yet — attach some from its header.' : 'No rules in this sub-group.'}</td></tr>
      )}
      {children}
    </>
  );
}

let gseq = 0;
const newGroup = (name = ''): RuleGroup => ({ id: `grp-${++gseq}`, name, ruleIds: [] });
/** A new group arrives named — "Rule Group N", the next number no group is using — so it is never
    saved blank and the admin renames it only if the default says too little. */
const copyGroup = (g: RuleGroup): RuleGroup => ({ ...g, ruleIds: [...g.ruleIds], children: (g.children ?? []).map((c) => ({ ...c, ruleIds: [...c.ruleIds] })) });
/** A group with these rules taken out of it and of its sub-groups. */
const withoutRules = (g: RuleGroup, ids: string[]): RuleGroup => ({
  ...g,
  ruleIds: g.ruleIds.filter((y) => !ids.includes(y)),
  children: (g.children ?? []).map((c) => ({ ...c, ruleIds: c.ruleIds.filter((y) => !ids.includes(y)) })),
});
const nextSubName = (g: RuleGroup) => {
  const subs = g.children ?? [];
  let n = subs.length + 1;
  while (subs.some((c) => c.name.trim().toLowerCase() === `sub-group ${n}`)) n++;
  return `Sub-group ${n}`;
};

/** A filter the picker cannot drop — it comes from the benchmark itself. */
function LockedChip({ label, value }: { label: string; value: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-8 cursor-default items-center gap-1.5 rounded border border-[#DFE5ED] bg-[#F8FAFC] px-2.5 text-[12px]">
          <Lock size={12} className="text-[#9CA3AF]" />
          <span className="text-[#7B8FA5]">{label} is</span>
          <span className="font-medium text-[#364658]">{value}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-wrap max-w-[260px]">Set by the benchmark’s {label} — only these rules can be attached. Change it on the form.</TooltipContent>
    </Tooltip>
  );
}

const nextGroupName = (gs: RuleGroup[]) => {
  let n = gs.length + 1;
  while (gs.some((g) => g.name.trim().toLowerCase() === `rule group ${n}`)) n++;
  return `Rule Group ${n}`;
};

/** A benchmark as numbered groups. Custom = its own groups; Default = its CIS tree, each section a
 *  group and each subsection a sub-group — so the two read the same three levels on the detail
 *  page (1 · 1.1 · 1.1.1), and a clone starts from exactly what was shown. The card numbers them,
 *  so the CIS number is not repeated in the name. */
function groupsOf(b: Benchmark): RuleGroup[] {
  if (b.origin === 'Custom') return b.groups;
  return benchmarkTree(b).map((s) => ({
    id: `${b.id}-${s.key}`,
    name: s.name,
    ruleIds: s.ruleIds,
    children: s.children.map((c) => ({ id: `${b.id}-${s.key}-${c.key}`, name: c.name, ruleIds: c.ruleIds })),
  }));
}

/* ── Detail — full-screen drawer, read only (the ticket detail page's shape) ──────────────── */

function kpi(key: string, label: string, value: React.ReactNode, tip: string): HeaderKpiItem {
  return {
    key, tip, node: (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[11px] text-[#7B8FA5]">{label}</span>
        <span className="text-[12px] font-medium text-[#364658]">{value}</span>
      </span>
    ),
  };
}

function BenchmarkDrawer({ benchmark, benchmarks, onClose, onEdit, onClone, onDelete }: {
  benchmark: Benchmark;
  benchmarks: Benchmark[];
  onClose: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}) {
  const groups = useMemo(() => groupsOf(benchmark), [benchmark]);
  // The first group starts open — the rest is one click away.
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups[0] ? [groups[0].id] : []));
  useEffect(() => { setOpen(new Set(groups[0] ? [groups[0].id] : [])); }, [benchmark.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [full, setFull] = useState(true);
  const [menu, setMenu] = useState(false);
  const total = benchmarkRuleIds(benchmark).length;
  const isDefault = benchmark.origin === 'Default';
  const openRule = ruleId ? ruleById(ruleId) : undefined;
  const allOpen = groups.length > 0 && groups.every((g) => open.has(g.id));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ruleId && !menu) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ruleId, menu, onClose]);

  const kpis = [
    kpi('type', 'Type', benchmark.type, `Type: ${benchmark.type}`),
    kpi('version', 'Version', benchmark.osVersion || '—', `Version: ${benchmark.osVersion}`),
    kpi('profile', 'Profile', benchmark.profile, benchmark.profile === 'L1' ? 'Level 1 — must-have rules only' : 'Level 2 — Level 1 rules plus good-to-have rules'),
    kpi('origin', 'Origin', benchmark.origin, `Origin: ${benchmark.origin}`),
    kpi('rules', 'Rules', total, `Rules: ${total}`),
    kpi('used', 'Used Count', benchmark.usedBy, `Used by ${benchmark.usedBy} compliance policies`),
    kpi('updated', 'Updated', fmtDate(benchmark.updatedAt), `Updated ${fmtDate(benchmark.updatedAt)}`),
  ];

  const fields: [string, React.ReactNode][] = [
    ['Type', benchmark.type],
    ['Version', benchmark.osVersion || '—'],
    ['Profile', <span key="p" className="inline-flex items-center gap-2"><ProfileChip profile={benchmark.profile} /><span className="text-[12px] text-[#64748B]">{benchmark.profile === 'L1' ? 'Must have' : 'Good to have — includes Level 1'}</span></span>],
    ['Origin', benchmark.origin],
    ['Description', benchmark.description || '—'],
    ['Tags', benchmark.tags.length
      ? <span className="flex flex-wrap gap-1.5">{benchmark.tags.map((t) => <span key={t} className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]">{t}</span>)}</span>
      : '—'],
    ['Used Count', benchmark.usedBy],
    ['Created By', benchmark.createdBy],
    ['Last Updated', fmtDate(benchmark.updatedAt)],
  ];

  return (
    <>
      <div className={`fixed right-0 top-0 z-[60] flex h-screen flex-col bg-white shadow-2xl ${full ? '' : 'border-l border-[#e5e7eb]'}`} style={{ width: full ? '100vw' : 1080 }} data-drawer>
        {/* Open-item tab bar + window controls — the ticket drawer's. */}
        <div className="flex items-center border-b border-[#e5e7eb] bg-[#f9fafb]">
          <DrawerTabStrip items={[{ id: benchmark.id, subject: benchmark.name }]} activeId={benchmark.id} onSelect={() => {}} onClose={onClose} />
          <button onClick={() => setFull((v) => !v)} className="border-l border-[#e5e7eb] p-2 hover:bg-[#e5e7eb]" title={full ? 'Switch to small view' : 'Switch to full view'}>
            {full ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="12" height="12" rx="1.5" stroke="#364658" strokeWidth="2" /><path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5H18A1.5 1.5 0 0 1 19.5 6.5V15A1.5 1.5 0 0 1 18 16.5H16" stroke="#364658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="1.5" stroke="#364658" strokeWidth="2" /></svg>
            )}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[#e5e7eb]" title="Close"><X size={18} className="text-[#364658]" /></button>
        </div>

        {/* Header — ID pill + name, the KPI strip, actions right. */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-[18px] font-semibold text-[#364658]">
              <HeaderIdPill id={benchmark.id} />
              <span className="truncate">{benchmark.name}</span>
            </h1>
            <HeaderKpiRow items={kpis} />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <HeaderCopyButton variant="link" value="/admin/compliance-benchmarks" label="Copy Benchmark URL" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button type="button" disabled={isDefault} onClick={onEdit} aria-label="Edit benchmark" className={boxedBtn}><Pencil size={16} /></button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-wrap max-w-[260px]">{isDefault ? DEFAULT_READ_ONLY : 'Edit'}</TooltipContent>
            </Tooltip>
            <div className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} aria-label="More actions" className={boxedBtn}><MoreVertical size={16} /></button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-[200px] rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
                    <button type="button" onClick={() => { setMenu(false); onClone(); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]"><Copy size={15} className="text-[#7B8FA5]" /> Clone</button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block">
                          <button type="button" disabled={!!deleteReason(benchmark)} onClick={() => { setMenu(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent"><Trash2 size={15} /> Delete</button>
                        </span>
                      </TooltipTrigger>
                      {deleteReason(benchmark) && <TooltipContent side="left" className="text-wrap max-w-[260px]">{deleteReason(benchmark)}</TooltipContent>}
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Main column — the Rule Groups tab. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-shrink-0 gap-2.5 border-b border-[#e5e7eb] px-6">
              <span className="-mb-px flex items-center gap-1.5 border-b-2 border-[#3D8BD0] px-2 py-3 text-[14px] font-medium text-[#3D8BD0]">
                Rule Groups <span className="rounded-full bg-[#EBF5FF] px-1.5 text-[11px] font-semibold">{groups.length}</span>
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] text-[#7B8FA5]">{groups.length} group{groups.length === 1 ? '' : 's'} · {total} rule{total === 1 ? '' : 's'}</span>
                {groups.length > 0 && (
                  <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.id)))} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">
                    {allOpen ? 'Collapse all' : 'Expand all'}
                  </button>
                )}
              </div>
              {groups.length === 0 ? (
                <div className="rounded-lg border border-[#E5E7EB] px-4 py-10 text-center text-[13px] text-[#9CA3AF]">This benchmark has no rules.</div>
              ) : (
                <div className="space-y-3">
                  {groups.map((g, i) => (
                    <GroupCard key={g.id} group={g} index={i} open={open.has(g.id)} onToggle={() => toggle(g.id)} onOpenRule={setRuleId} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Benchmark Properties, read only. */}
          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
            <div className="flex-shrink-0 border-b border-[#e5e7eb] px-4 py-3 text-[16px] font-semibold text-[#364658]">Benchmark Properties</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] px-4 py-3 text-[14px] font-semibold text-[#364658]">Benchmark Fields</div>
                <dl className="space-y-3.5 px-4 py-4">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[12px] text-[#64748B]">{label}</dt>
                      <dd className="mt-0.5 text-[13px] leading-[1.55] text-[#364658]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {openRule && (
        <RuleDetailPanel
          rule={openRule}
          usedIn={benchmarksUsingRule(benchmarks, openRule.id).map((b) => b.name)}
          onClose={() => setRuleId(null)}
        />
      )}
    </>
  );
}

/* ── Form — create / edit / clone, full page ─────────────────────────────────────────────── */

function BenchmarkForm({ editing, source, names, onCancel, onSave }: {
  editing?: Benchmark;
  source?: Benchmark;
  names: string[];
  onCancel: () => void;
  onSave: (b: Benchmark) => void;
}) {
  const base = editing ?? source;
  const [name, setName] = useState(editing ? editing.name : source ? `Copy of ${source.name}` : '');
  const [type, setType] = useState<ComplianceType | ''>(base?.type ?? '');
  const [version, setVersion] = useState(base?.osVersion ?? '');
  const [profile, setProfile] = useState<Profile>(base?.profile ?? 'L1');
  /** L2 → L1 with Level 2 rules attached: the confirm holds the count until the admin decides. */
  const [confirmL1, setConfirmL1] = useState<number | null>(null);
  const [description, setDescription] = useState(base?.description ?? '');
  const [tags, setTags] = useState<string[]>(base?.tags ?? []);
  const [groups, setGroups] = useState<RuleGroup[]>(() =>
    editing ? editing.groups.map(copyGroup)
      : source ? groupsOf(source).map((g) => ({ ...copyGroup(g), id: newGroup().id, children: (g.children ?? []).map((c) => ({ ...copyGroup(c), id: newGroup().id })) }))
        : [newGroup('Rule Group 1')]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.map((g) => g.id)));
  /** Where Attach Rules is aimed: a group, or one of its sub-groups. */
  const [attachTo, setAttachTo] = useState<{ g: string; s?: string } | null>(null);
  const [tried, setTried] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(null);

  const attached = groups.flatMap(groupRuleIds);
  const dupName = names.includes(name.trim().toLowerCase());
  const reason =
    !name.trim() ? 'The benchmark needs a name'
      : dupName ? 'A benchmark with this name already exists'
        : !type ? 'Choose a Type'
          : !version ? 'Choose a Version'
            : groups.some((g) => !g.name.trim()) ? 'Every rule group needs a name'
              : groups.some((g) => (g.children ?? []).some((c) => !c.name.trim())) ? 'Every sub-group needs a name'
              : !attached.length ? 'A benchmark with no rules assesses nothing — attach at least one'
                : '';

  // A benchmark holds rules of ONE Type and ONE OS version; changing either clears what no longer fits.
  const clearRules = (what: string) => {
    if (attached.length) toast(`${attached.length} rule${attached.length > 1 ? 's were' : ' was'} removed — they were written for ${what}`);
    setGroups((gs) => gs.map((g) => ({ ...g, ruleIds: [], children: (g.children ?? []).map((c) => ({ ...c, ruleIds: [] })) })));
  };
  const changeType = (t: ComplianceType) => {
    if (t === type) return;
    clearRules(version || type);
    setType(t);
    setVersion('');
  };
  const changeVersion = (v: string) => {
    if (v === version) return;
    clearRules(version);
    setVersion(v);
  };
  /* L1 → L2 only widens what can be attached. L2 → L1 would drop the Level 2 rules, so it asks first. */
  const l2Attached = attached.filter((id) => ruleById(id)?.profile === 'L2');
  const changeProfile = (p: Profile) => {
    if (p === profile) return;
    if (p === 'L1' && l2Attached.length) { setConfirmL1(l2Attached.length); return; }
    setProfile(p);
  };
  const switchToL1 = () => {
    const drop = new Set(l2Attached);
    setGroups((gs) => gs.map((g) => ({
      ...g,
      ruleIds: g.ruleIds.filter((id) => !drop.has(id)),
      children: (g.children ?? []).map((c) => ({ ...c, ruleIds: c.ruleIds.filter((id) => !drop.has(id)) })),
    })));
    setProfile('L1');
    toast(`${drop.size} Level 2 rule${drop.size > 1 ? 's were' : ' was'} removed — an L1 benchmark holds must-have rules only`);
    setConfirmL1(null);
  };

  const save = () => {
    setTried(true);
    if (reason) return;
    onSave({
      id: editing?.id ?? nextId(),
      name: name.trim(),
      description: description.trim(),
      type: type as ComplianceType,
      osVersion: version,
      profile,
      origin: 'Custom',
      tags,
      groups,
      usedBy: editing?.usedBy ?? 0,
      createdBy: editing?.createdBy ?? 'Zeni Chakalasiya',
      updatedAt: new Date().toISOString().slice(0, 16),
    });
  };

  /* ── Attach Rules picker: this version's rules, with the listing filter bar ── */
  const attachGroup = attachTo ? groups.find((g) => g.id === attachTo.g) : undefined;
  const target = attachTo?.s ? attachGroup?.children?.find((c) => c.id === attachTo.s) : attachGroup;
  const targetLabel = (gid: string, sid?: string) => {
    const g = groups.find((x) => x.id === gid);
    const c = sid ? g?.children?.find((x) => x.id === sid) : undefined;
    return [g?.name || 'Untitled group', c ? c.name || 'Untitled sub-group' : ''].filter(Boolean).join(' › ');
  };
  /* The version's rules the profile allows: L1 → Level 1 only; L2 → Level 1 and Level 2. */
  const pool = useMemo(() => RULES.filter((r) => r.type === type && osVersionOf(r) === version && profileAllows(profile, r.profile)), [type, version, profile]);
  const [pickRules, setPickRules] = useState<FilterRule[]>([]);
  useEffect(() => { setPickRules([]); }, [attachTo?.g, attachTo?.s]);
  const pickAttrs = useMemo(() => {
    const plain = (o: { label: string }[]) => o.map(({ label }) => ({ label }));
    return [
      selectAttr('severity', 'Severity', ShieldAlert, SEVERITIES.filter((s) => pool.some((r) => r.severity === s)).map((v) => ({ label: v, color: SEVERITY_PILL[v].bar }))),
      selectAttr('section', 'Section', Layers, plain(optionsOf(pool, (r) => r.section[1]))),
      selectAttr('tags', 'Tag', Tag, plain(optionsOf(pool, (r) => r.tags))),
      selectAttr('profile', 'Profile', BadgeCheck, plain(optionsOf(pool, (r) => r.profile, ['L1', 'L2']))),
    ];
  }, [pool]);
  const pickQuick = useMemo<QuickFilterDef[]>(() => [
    { field: 'severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 196, row: 'dot', options: pickAttrs[0].options! },
    { field: 'section', icon: Layers, tip: 'Filter by section', title: 'Section is', width: 240, row: 'plain', options: pickAttrs[1].options! },
    { field: 'tags', icon: Tag, tip: 'Filter by tag', title: 'Tag is', width: 220, row: 'plain', options: pickAttrs[2].options! },
    // Only an L2 benchmark mixes the two levels, so only then is there anything to filter by.
    ...(profile === 'L2' ? [{ field: 'profile', icon: BadgeCheck, tip: 'Filter by profile', title: 'Profile is', width: 160, row: 'plain' as const, options: pickAttrs[3].options! }] : []),
  ], [pickAttrs, profile]);
  const pickRows = useMemo(
    () => matchRules(pool, pickRules, (r, f) => (f === 'section' ? r.section[1] : f === 'tags' ? r.tags : String((r as any)[f] ?? ''))),
    [pool, pickRules],
  );
  /** Where a rule already sits — a rule lives in ONE place in a benchmark. */
  const placeOf = (id: string): { g: string; s?: string } | undefined => {
    for (const g of groups) {
      if (g.ruleIds.includes(id)) return { g: g.id };
      const c = (g.children ?? []).find((x) => x.ruleIds.includes(id));
      if (c) return { g: g.id, s: c.id };
    }
    return undefined;
  };
  const columns: PickerColumn<ComplianceRule>[] = [
    {
      header: 'Rule Name', cell: (r) => {
        const other = placeOf(r.id);
        const here = !!other && !!attachTo && other.g === attachTo.g && other.s === attachTo.s;
        return (
          <span className="flex min-w-0 items-center gap-2">
            <span className="block max-w-[320px] truncate text-[13px] font-medium" title={r.name}>{r.name}</span>
            {other && !here && <span className="max-w-[220px] flex-shrink-0 truncate rounded bg-[#FFFAEB] px-1.5 py-0.5 text-[11px] text-[#B54708]" title={`In ${targetLabel(other.g, other.s)}`}>In {targetLabel(other.g, other.s)}</span>}
          </span>
        );
      },
    },
    { header: 'Section', cell: (r) => <span className="whitespace-nowrap">{r.section[1]}</span> },
    { header: 'Profile', cell: (r) => <ProfileChip profile={r.profile} /> },
    { header: 'Severity', cell: (r) => <SeverityPill severity={r.severity} /> },
    { header: 'Tag', cell: (r) => <TagCell tags={r.tags} /> },
  ];

  const attachReason = !type ? 'Choose the benchmark’s Type and Version first'
    : !version ? 'Choose the benchmark’s Version first — only that version’s rules can be attached' : undefined;
  const title = editing ? 'Edit Benchmark' : source ? 'Clone Benchmark' : 'Create Benchmark';
  const openRule = ruleId ? ruleById(ruleId) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#DFE5ED] px-4 py-3">
        <button type="button" onClick={onCancel} title="Back" className="-ml-1.5 flex size-[30px] flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={16} />
        </button>
        <h1 className="truncate text-[16px] font-medium text-[#364658]">{title}</h1>
        {/* The page's actions live with its title; a blocked Save always says why, beside it. */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          {tried && reason && <span className="text-[12px] text-[#F25C4E]">{reason}</span>}
          <button type="button" onClick={onCancel} className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          <button type="button" onClick={save} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">{editing ? 'Update Benchmark' : 'Create Benchmark'}</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] px-4 py-5">
          {/* Six fields in two rows of three equal columns: Name · Type · Version, then
              Description · Profile · Tags. */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            <div>
              <FieldLabel required>Benchmark Name</FieldLabel>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Benchmark Name" className={`${inputCls} ${tried && (!name.trim() || dupName) ? '!border-[#F25C4E]' : ''}`} />
              <ErrorText>{tried && (!name.trim() ? 'Enter a name' : dupName ? 'This name is taken' : '')}</ErrorText>
            </div>
              <div>
                <FieldLabel required>Type</FieldLabel>
                <RuleSelect className="!rounded" value={type ? [type] : []} options={typeOptions} onChange={(v) => v[0] && changeType(v[0] as ComplianceType)} invalid={tried && !type} />
                <ErrorText>{tried && !type ? 'Choose a Type' : ''}</ErrorText>
              </div>
              <div>
                <FieldLabel required>Version</FieldLabel>
                <RuleSelect
                  className="!rounded"
                  value={version ? [version] : []}
                  options={osVersionsFor(type).map((v) => ({ value: v, label: v }))}
                  onChange={(v) => v[0] && changeVersion(v[0])}
                  placeholder={type ? 'Select' : 'Choose a Type first'}
                  disabled={!type}
                  invalid={tried && !!type && !version}
                />
                <ErrorText>{tried && type && !version ? 'Choose a Version' : ''}</ErrorText>
              </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className={`${inputCls} !h-auto resize-y py-2 leading-[18px]`} />
            </div>
              <div>
                <FieldLabel required>Profile</FieldLabel>
                <div className="pill-track flex h-8 w-full">
                  {PROFILES.map((p) => (
                    <Tooltip key={p.value}>
                      <TooltipTrigger asChild>
                        <button type="button" aria-pressed={profile === p.value} onClick={() => changeProfile(p.value)} className="flex-1">{p.label}</button>
                      </TooltipTrigger>
                      <TooltipContent className="text-wrap max-w-[240px]">{p.tip}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <div className="pt-1"><TagEditor tags={tags} onChange={setTags} /></div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#364658]">Rule Groups <span className="ml-1 text-[12px] font-normal text-[#7B8FA5]">{groups.length} group{groups.length === 1 ? '' : 's'} · {attached.length} rule{attached.length === 1 ? '' : 's'}</span></h2>
            <button
              type="button"
              onClick={() => { const g = newGroup(nextGroupName(groups)); setGroups((gs) => [...gs, g]); setExpanded((s) => new Set(s).add(g.id)); }}
              className={SECONDARY_CTA}
            ><Plus size={14} /> Add Rule Group</button>
          </div>

          <div className="mt-3 space-y-3">
            {groups.map((g, gi) => (
              <GroupCard
                key={g.id}
                group={g}
                index={gi}
                open={expanded.has(g.id)}
                onToggle={() => setExpanded((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
                editable
                showErrors={tried}
                ruleScope={version}
                onRename={(v, sid) => setGroups((gs) => gs.map((x) => (x.id !== g.id ? x
                  : sid ? { ...x, children: (x.children ?? []).map((c) => (c.id === sid ? { ...c, name: v } : c)) }
                    : { ...x, name: v })))}
                onAttach={(sid) => setAttachTo({ g: g.id, s: sid })}
                attachReason={attachReason}
                onAddSub={() => {
                  setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, children: [...(x.children ?? []), newGroup(nextSubName(x))] } : x)));
                  setExpanded((s) => new Set(s).add(g.id));
                }}
                onDelete={(sid) => setGroups((gs) => (sid
                  ? gs.map((x) => (x.id === g.id ? { ...x, children: (x.children ?? []).filter((c) => c.id !== sid) } : x))
                  : gs.filter((x) => x.id !== g.id)))}
                deleteGroupReason={groups.length === 1 ? 'A benchmark needs at least one rule group' : undefined}
                onRemoveRule={(id) => setGroups((gs) => gs.map((x) => (x.id === g.id ? withoutRules(x, [id]) : x)))}
                onOpenRule={setRuleId}
              />
            ))}
          </div>
        </div>
      </div>

      <PickerDrawer<ComplianceRule>
        isOpen={!!target}
        title="Attach Rules"
        subtitle={attachTo ? `${profile === 'L1' ? 'Level 1 rules' : 'Level 1 and Level 2 rules'} for “${targetLabel(attachTo.g, attachTo.s)}”` : ''}
        rows={pickRows}
        columns={columns}
        selected={target?.ruleIds ?? []}
        searchOf={(r) => [r.name, r.description, r.section[1], r.severity, ...r.tags].join(' ')}
        filterBar={(
          <>
            {/* The pool is already narrowed to the benchmark's Type and Version — said here as two
                chips that cannot be removed, so the list never looks like the whole catalogue. */}
            <LockedChip label="Type" value={type} />
            <LockedChip label="Version" value={version} />
            <TicketFilterBar rules={pickRules} setRules={setPickRules} noun="rule" attrs={pickAttrs} quickFilters={pickQuick} showFilterBuilder={false} />
          </>
        )}
        onClose={() => setAttachTo(null)}
        onApply={(ids) => {
          // A rule lives in ONE place: picking it here moves it out of any other group or sub-group.
          const at = attachTo!;
          setGroups((gs) => gs.map((x) => {
            const out = withoutRules(x, ids);
            if (x.id !== at.g) return out;
            return at.s
              ? { ...out, children: (out.children ?? []).map((c) => (c.id === at.s ? { ...c, ruleIds: ids } : c)) }
              : { ...out, ruleIds: ids };
          }));
          setExpanded((s) => new Set(s).add(at.g));
          setAttachTo(null);
        }}
      />

      {openRule && <RuleDetailPanel rule={openRule} usedIn={[]} onClose={() => setRuleId(null)} />}

      {confirmL1 !== null && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setConfirmL1(null)}>
          <div className="w-[440px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Switch to L1?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">
              An L1 benchmark holds must-have rules only. Switching removes the <span className="font-medium text-[#364658]">{confirmL1} Level 2 rule{confirmL1 === 1 ? '' : 's'}</span> attached to its groups; the Level 1 rules stay.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmL1(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button type="button" onClick={switchToL1} className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#3478B5]">Switch to L1</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
