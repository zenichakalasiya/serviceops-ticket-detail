import { ComplianceVersionMenu } from './ComplianceVersionMenu';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, BadgeCheck, Check, ChevronDown, ChevronRight, Copy, ExternalLink, FolderPlus, Layers, Link2, Lock, Monitor, MoreVertical,
  Pencil, Plus, PlusCircle, Search, ShieldAlert, Trash2, X, CornerDownRight, ArrowDown, ChevronsDownUp,
} from 'lucide-react';
import { useComplianceRuleUi } from './complianceRuleUi';
import { Pagination } from './Pagination';
import { HeaderKpiRow } from './HeaderKpiRow';
import type { HeaderKpiItem } from './HeaderKpiRow';
import { HeaderIdPill } from './HeaderIdPill';
import { HeaderCopyButton } from './HeaderCopyButton';
import { DrawerTabStrip } from './DrawerTabStrip';
import { PickerDrawer } from './CreatePatchDeployment';
import type { PickerColumn } from './CreatePatchDeployment';
import { ErrorText, FieldLabel, RuleSelect, inputCls as formInputCls } from './FormRuleControls';
import { matchRules, MetaChip, optionsOf, RuleDetailPanel, selectAttr, SeverityPill } from './ComplianceShared';
import { usePolicies } from './compliancePolicyData';
import { TicketFilterBar } from './TicketFilterBar';
import type { FilterRule, QuickFilterDef } from './TicketFilterBar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  benchmarkGroups, benchmarkRuleIds, benchmarksUsingRule, COMPLIANCE_TYPES, fmtDate, groupRuleIds, osVersionOf, osVersionsFor, RULES, ruleById,
  PROFILES, profileAllows, profileLabel, profileLevels, profileOf, SEVERITIES, SEVERITY_PILL,
} from './complianceData';
import type { Benchmark, BenchmarkProfile, ComplianceRule, ComplianceType, Profile, RuleGroup } from './complianceData';

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

const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent';
/** The drawer header's boxed icon button (ticket header: Watch, Edit). */
const boxedBtn = 'inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';
const inputCls = formInputCls.replace('rounded-md', 'rounded');
const typeOptions = COMPLIANCE_TYPES.map((t) => ({ value: t, label: t }));

/* The product's secondary outlined CTA (the listings' Filters button, OS Upgrade's outlined CTAs): white, #DFE5ED border, 13px. */
const SECONDARY_CTA = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';

const DEFAULT_READ_ONLY = 'A Default benchmark is read only — clone it to make an editable copy';
const deleteReason = (b: Benchmark, used: number) =>
  b.origin === 'Default' ? 'A Default benchmark cannot be deleted'
    : used ? `Used by ${used} compliance polic${used > 1 ? 'ies' : 'y'} — remove it from them first` : undefined;

/** How many compliance policies run each benchmark — read live from the policy store, so the
 *  admin side and the technician side count the same thing. */
function usePolicyCounts() {
  const policies = usePolicies();
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const p of policies) m.set(p.benchmarkId, (m.get(p.benchmarkId) ?? 0) + 1);
    return (id: string) => m.get(id) ?? 0;
  }, [policies]);
}

let seq = 100;
const nextId = () => `BM-${++seq}`;

/** A rule's or benchmark's CIS profile — L1 must have (blue), L2 good to have (violet). A
 *  benchmark holding both shows both. */
function ProfileChip({ profile }: { profile: Profile | BenchmarkProfile }) {
  return (
    <span className="inline-flex items-center gap-1">
      {profileLevels(profile as BenchmarkProfile).map((l) => (
        <span key={l} className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${l === 'L1' ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-[#F3EEFF] text-[#7C3AED]'}`} title={l === 'L1' ? 'Level 1 — must have' : 'Level 2 — good to have'}>{l}</span>
      ))}
    </span>
  );
}

/** Default (ships with the product, read only) or Custom (built here), as a tag. */
function OriginTag({ origin }: { origin: Benchmark['origin'] }) {
  return origin === 'Default'
    ? <span className="inline-flex items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#475569]" title="Ships with the product — read only"><Lock size={10} />Default</span>
    : <span className="inline-block rounded-sm bg-[#ECFDF3] px-1.5 py-0.5 text-[11px] font-semibold text-[#15803D]" title="Built in this workspace">Custom</span>;
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
    <Tooltip delayDuration={reason ? 0 : undefined}>
      <TooltipTrigger asChild>
        <span className={`inline-flex ${reason ? 'cursor-not-allowed' : ''}`}>
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
  const usedBy = usePolicyCounts();
  const [rules, setRulesRaw] = useState<FilterRule[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const setRules = (next: FilterRule[]) => { setRulesRaw(next); setPage(1); };

  const attrs = useMemo(() => {
    const plain = (o: { label: string }[]) => o.map(({ label }) => ({ label }));
    return [
      selectAttr('type', 'Type', Monitor, plain(optionsOf(benchmarks, (b) => b.type, COMPLIANCE_TYPES))),
      selectAttr('origin', 'Origin', BadgeCheck, plain(optionsOf(benchmarks, (b) => b.origin, ['Default', 'Custom']))),
    ];
  }, [benchmarks]);
  // Type and Origin are every cut this list has, so they are both quick filters and the
  // Filters builder (and its pill) is switched off — it would only offer the same two again.
  const quick = useMemo<QuickFilterDef[]>(() => [
    { field: 'type', icon: Monitor, tip: 'Filter by type', title: 'Type is', width: 196, row: 'plain', options: attrs[0].options! },
    { field: 'origin', icon: BadgeCheck, tip: 'Filter by origin', title: 'Origin is', width: 180, row: 'plain', options: attrs[1].options! },
  ], [attrs]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byField = (b: Benchmark, f: string): string | string[] => String((b as any)[f] ?? '');
    return matchRules(benchmarks, rules, byField).filter((b) =>
      !q || [b.name, b.description, b.osVersion].some((x) => x.toLowerCase().includes(q)));
  }, [benchmarks, search, rules]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4 py-6">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[16px] font-semibold text-[#364658]">Benchmark</h1>
          <ComplianceVersionMenu />
        </div>
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
        <table className="w-full min-w-[1000px] table-fixed leading-5">
          <colgroup>
            <col className="w-[32%]" /><col className="w-[26%]" /><col className="w-[90px]" /><col className="w-[190px]" /><col className="w-[96px]" />
            <col className="w-[70px]" /><col className="w-[130px]" />
          </colgroup>
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {['Benchmark', 'Description', 'Type', 'Version', 'Origin', 'Rules', 'Actions'].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No benchmark matches these filters.</td></tr>
            ) : pageRows.map((b) => (
              <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer transition-colors hover:bg-[#f9fafb]">
                <td className="px-4 py-3">
                  <span className="line-clamp-2 break-words text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={b.name}>{b.name}</span>
                </td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#64748B]" title={b.description}>{b.description || <span className="text-[#9CA3AF]">—</span>}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{b.type}</td>
                <td className="px-4 py-3"><span className="block truncate text-[13px] text-[#364658]" title={b.osVersion}>{b.osVersion || '—'}</span></td>
                <td className="whitespace-nowrap px-4 py-3"><OriginTag origin={b.origin} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{benchmarkRuleIds(b).length}</td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-0.5">
                    <ActionIcon label="Edit" reason={b.origin === 'Default' ? DEFAULT_READ_ONLY : undefined} onClick={() => onEdit(b.id)}><Pencil size={15} /></ActionIcon>
                    <ActionIcon label="Clone" onClick={() => onClone(b.id)}><Copy size={15} /></ActionIcon>
                    <ActionIcon label="Delete" danger reason={deleteReason(b, usedBy(b.id))} onClick={() => onDelete(b)}><Trash2 size={15} /></ActionIcon>
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
  const btn = <button type="button" disabled={!!reason} style={reason ? { pointerEvents: 'none' } : undefined} onClick={(e) => { e.stopPropagation(); onClick?.(); }} className={className}>{children}</button>;
  if (!reason) return btn;
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild><span className="inline-flex cursor-not-allowed">{btn}</span></TooltipTrigger>
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
  <span className="flex-shrink-0 rounded-full bg-[#EEF2F6] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#64748B]" title={`${n} rule${n === 1 ? '' : 's'}`}>{n}</span>
);

/** The quiet "+ Attach rules / + Add sub-group" links that sit UNDER what they add to. */
const ADD_LINK = 'inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent';

/* ── The rule-group TREE — the live product's flow, any depth up to 7 ───────────────────────
 * A group is a row: chevron · number · name, actions on the right. A new group arrives with its
 * name field open (✓ saves it; ⊕ refuses until it has a name). Once named: ✎ Edit name ·
 * ⊕ Add sub-group · 🔗 Attach rules · 🗑 Delete. ⊕ adds a child group under it, numbered from
 * the parent (1 → 1.1 → 1.1.1). A group's rules number first (1.1, 1.2), its sub-groups take
 * the next numbers (1.3). A group holding only sub-groups takes no rules directly (no Attach). */

export const MAX_GROUP_DEPTH = 7;

interface TreeOps {
  editable?: boolean;
  showErrors?: boolean;
  attachReason?: string;
  ruleScope?: string;
  open: Set<string>;
  onToggle: (id: string) => void;
  editingNames?: Set<string>;
  onName?: (id: string, v: string) => void;
  onSaveName?: (id: string) => void;
  onEditName?: (id: string) => void;
  /** ⊕ menu: a sub-group INSIDE this group / a group BELOW it at the same level. */
  onAddChild?: (id: string) => void;
  onAddBelow?: (id: string) => void;
  /** Where a group would land while an ⊕ menu item is hovered — drawn as a dashed ghost row. */
  preview?: { at: string; mode: 'inside' | 'below' } | null;
  setPreview?: (p: { at: string; mode: 'inside' | 'below' } | null) => void;
  /** Keys while naming: Enter → a group below · Tab → make it a sub-group · Shift+Tab → move it out. */
  onNameKey?: (id: string, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAttach?: (id: string) => void;
  onDelete?: (g: RuleGroup) => void;
  deleteReason?: (id: string) => string | undefined;
  onRemoveRule?: (groupId: string, ruleId: string) => void;
  onOpenRule?: (id: string) => void;
}

/** The dashed row that shows where a group will land, with the number it will get. */
function GhostRow({ number, depth, label }: { number: string; depth: number; label: string }) {
  return (
    <div style={{ paddingLeft: 12 + depth * 24 + 28 }} className="flex h-10 items-center gap-2 border-t border-[#EEF1F4] pr-3">
      <span className="flex h-7 flex-1 items-center gap-2 rounded border border-dashed border-[#3D8BD0] bg-[#F5FAFF] px-2 text-[13px]">
        <span className="font-semibold tabular-nums text-[#3D8BD0]">{number}</span>
        <span className="italic text-[#3D8BD0]">{label}</span>
      </span>
    </div>
  );
}

/** One group of the tree and, while open, its rules then its sub-groups. `siblingNext` is the
 *  number a group added BELOW this one would take. */
function GroupNode({ g, number, depth, ops, siblingNext }: { g: RuleGroup; number: string; depth: number; ops: TreeOps; siblingNext?: string }) {
  const kids = g.children ?? [];
  const isOpen = ops.open.has(g.id);
  const naming = !!ops.editable && !!ops.editingNames?.has(g.id);
  const parentOnly = kids.length > 0 && g.ruleIds.length === 0;
  const total = groupRuleIds(g).length;
  const pad = 12 + depth * 24;
  const blank = !g.name.trim();
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null);
  const plusRef = useRef<HTMLSpanElement>(null);
  const openMenu = () => {
    if (menu) { setMenu(null); return; }
    const r = plusRef.current?.getBoundingClientRect();
    if (r) setMenu({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };
  const insideReason = depth + 1 >= MAX_GROUP_DEPTH ? `Groups go ${MAX_GROUP_DEPTH} levels deep at most` : undefined;
  const addReason = blank ? 'Name this group first' : undefined;
  const childNext = `${number}.${g.ruleIds.length + kids.length + 1}`;
  const pv = ops.preview;
  const closeMenu = () => { setMenu(null); ops.setPreview?.(null); };

  const ruleRow = (id: string, n: string) => {
    const r = ruleById(id);
    if (!r) return null;
    return (
      <div key={id} onClick={() => ops.onOpenRule?.(id)} style={{ paddingLeft: pad + 28 }} className={`group/row flex items-center gap-3 border-t border-[#EEF1F4] py-2 pr-3 transition-colors hover:bg-[#F5F7FA] ${ops.onOpenRule ? 'cursor-pointer' : ''}`}>
        <span className="h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[r.severity].bar }} title={r.severity} />
        <span className="flex-shrink-0 text-[12px] tabular-nums text-[#7B8FA5]">{n}</span>
        <span className="line-clamp-2 min-w-0 flex-1 break-words text-[13px] text-[#364658] group-hover/row:text-[#3D8BD0]" title={r.name}>{r.name}</span>
        {/* At rest the two tags sit at the row's right edge; on hover the action takes the edge
            and the tags step left — nothing is reserved for a control that isn't showing. */}
        <ProfileChip profile={r.profile} />
        <SeverityPill severity={r.severity} />
        {ops.editable ? (
          <span className="-my-[6px] hidden flex-shrink-0 group-hover/row:inline-flex focus-within:inline-flex" onClick={(e) => e.stopPropagation()}>
            <ActionIcon label="Remove from group" onClick={() => ops.onRemoveRule?.(g.id, id)}><X size={15} /></ActionIcon>
          </span>
        ) : ops.onOpenRule && <ChevronRight size={14} className="hidden flex-shrink-0 text-[#3D8BD0] group-hover/row:block" />}
      </div>
    );
  };

  /* ⊕ → a two-item menu. Hovering an item draws the ghost row where the group will land. */
  const addMenu = (
    <span ref={plusRef} className="relative inline-flex">
      <ActionIcon label="Add group" reason={addReason} onClick={openMenu}><PlusCircle size={15} /></ActionIcon>
      {menu && createPortal(
        <>
          <div className="fixed inset-0 z-[10040]" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
          <div style={{ top: menu.top, right: menu.right }} className="fixed z-[10041] w-[220px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {([
              ['inside', <CornerDownRight size={15} />, 'Add sub-group inside', insideReason, () => ops.onAddChild?.(g.id)],
              ['below', <ArrowDown size={15} />, 'Add group below', undefined, () => ops.onAddBelow?.(g.id)],
            ] as ['inside' | 'below', React.ReactNode, string, string | undefined, () => void][]).map(([mode, icon, label, reason, fn]) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={!!reason}
                    onMouseEnter={() => ops.setPreview?.({ at: g.id, mode })}
                    onMouseLeave={() => ops.setPreview?.(null)}
                    onClick={() => { closeMenu(); fn(); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <span className="text-[#7B8FA5]">{icon}</span>{label}
                  </button>
                </TooltipTrigger>
                {reason && <TooltipContent side="left">{reason}</TooltipContent>}
              </Tooltip>
            ))}
          </div>
        </>,
        document.body,
      )}
    </span>
  );

  return (
    <>
    {/* The group box clips to its rounded corners; the ⊕ menu is portalled, so the clip cannot cut it. */}
    <div className={depth ? '' : `overflow-hidden rounded-lg border ${ops.showErrors && blank ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
      <div
        onClick={(e) => { if (!(e.target as HTMLElement).closest('input,button')) ops.onToggle(g.id); }}
        style={{ paddingLeft: pad }}
        className={`group/gr flex min-h-[44px] cursor-pointer items-center gap-2 py-1.5 pr-3 transition-colors ${depth ? 'border-t border-[#EEF1F4] bg-[#FAFBFC] hover:bg-[#F5F7FA]' : 'bg-[#F6F9FC]'} ${ops.showErrors && blank && depth ? 'ring-1 ring-inset ring-[#F25C4E]' : ''}`}
      >
        <button type="button" onClick={() => ops.onToggle(g.id)} aria-label={isOpen ? 'Collapse group' : 'Expand group'} aria-expanded={isOpen} className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex-shrink-0 cursor-default tabular-nums text-[#364658] ${depth ? 'text-[13px] font-semibold' : 'text-[13px] font-bold'}`}>{number}</span>
          </TooltipTrigger>
          <TooltipContent>Level {depth + 1} of {MAX_GROUP_DEPTH}</TooltipContent>
        </Tooltip>
        {naming ? (
          <input
            autoFocus
            value={g.name}
            onChange={(e) => ops.onName?.(g.id, e.target.value)}
            onKeyDown={(e) => { if (ops.onNameKey) ops.onNameKey(g.id, e); else if (e.key === 'Enter') ops.onSaveName?.(g.id); }}
            placeholder="Enter Name"
            title="Enter: save the name · Tab: make it a sub-group · Shift+Tab: move it out"
            className={`h-8 min-w-0 flex-1 rounded border bg-white px-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none ${ops.showErrors && blank ? 'border-[#F25C4E]' : 'border-[#DFE5ED]'}`}
          />
        ) : (
          <span className={`min-w-0 truncate text-[13px] text-[#364658] ${depth ? 'font-medium' : 'font-semibold'}`} title={g.name}>{g.name || <span className="font-normal text-[#9CA3AF]">Untitled group</span>}</span>
        )}
        {!naming && total > 0 && countChip(total)}
        {ops.editable && (
          <span className={`ml-auto flex flex-shrink-0 items-center gap-0.5 ${naming || menu ? '' : 'opacity-0 transition-opacity focus-within:opacity-100 group-hover/gr:opacity-100'}`}>
            {naming ? (
              <>
                <ActionIcon label="Save name" onClick={() => ops.onSaveName?.(g.id)}><Check size={15} className="text-[#16A34A]" /></ActionIcon>
                {addMenu}
              </>
            ) : (
              <>
                <ActionIcon label="Edit name" onClick={() => ops.onEditName?.(g.id)}><Pencil size={14} /></ActionIcon>
                {addMenu}
                {!parentOnly && <ReasonButton reason={ops.attachReason} onClick={() => ops.onAttach?.(g.id)} className={ADD_LINK}><Link2 size={14} /> Attach rules</ReasonButton>}
                <ActionIcon label={kids.length ? 'Delete group and its sub-groups' : 'Delete group'} danger reason={ops.deleteReason?.(g.id)} onClick={() => ops.onDelete?.(g)}><Trash2 size={15} className={ops.deleteReason?.(g.id) ? '' : 'text-[#DC2626]'} /></ActionIcon>
              </>
            )}
          </span>
        )}
      </div>
      {(isOpen || (pv?.at === g.id && pv.mode === 'inside')) && (
        <div className="relative">
          {isOpen && g.ruleIds.map((id, j) => ruleRow(id, `${number}.${j + 1}`))}
          {isOpen && kids.map((k, i) => <GroupNode key={k.id} g={k} number={`${number}.${g.ruleIds.length + i + 1}`} depth={depth + 1} ops={ops} siblingNext={`${number}.${g.ruleIds.length + i + 2}`} />)}
          {pv?.at === g.id && pv.mode === 'inside' && <GhostRow number={childNext} depth={depth + 1} label="New sub-group" />}
          {isOpen && !g.ruleIds.length && !kids.length && !(pv?.at === g.id) && (
            <div style={{ paddingLeft: pad + 28 }} className="border-t border-[#EEF1F4] py-3 pr-3 text-[12px] text-[#9CA3AF]">
              {ops.editable
                ? (ops.attachReason ?? <>No rules yet — attach rules written for <span className="font-medium text-[#64748B]">{ops.ruleScope}</span>, or add a sub-group with ⊕.</>)
                : 'No rules in this group.'}
            </div>
          )}
        </div>
      )}
    </div>
    {pv?.at === g.id && pv.mode === 'below' && siblingNext && (
      depth ? <GhostRow number={siblingNext} depth={depth} label="New group" />
        : <div className="rounded-lg border border-dashed border-[#3D8BD0] bg-[#F5FAFF] px-3 py-2.5 text-[13px]"><span className="font-semibold tabular-nums text-[#3D8BD0]">{siblingNext}</span> <span className="italic text-[#3D8BD0]">New group</span></div>
    )}
    </>
  );
}

/* ── V2 of the rule-group builder — the VS Code explorer's rule ───────────────────────────────
 * Click a row to SELECT it. "+" adds a group INSIDE the selected group — open or closed, it opens.
 * The top row is the benchmark itself (the root): select it and "+" adds a top-level group. A
 * selected RULE sends a new group into that rule's own group, as VS Code sends a new folder next
 * to a selected file. The same "+" and Attach rules sit on the section's title toolbar (acting on
 * the selection) and on a hovered row (acting on that row). Right-click a row for Add group ·
 * Attach rules · Rename · Delete; F2 renames, Delete deletes. A new group arrives with its name
 * field open — Enter saves, Esc on an empty name drops it. Nothing is ever added on its own. */

type ExplorerSel = { kind: 'root' } | { kind: 'group'; id: string } | { kind: 'rule'; groupId: string; ruleId: string };

function GroupExplorer({ groups, setGroups, rootName, naming, setNaming, expanded, setExpanded, showErrors, attachReason, onAttach, onOpenRule, onDelete, deleteReason }: {
  groups: RuleGroup[];
  setGroups: React.Dispatch<React.SetStateAction<RuleGroup[]>>;
  rootName: string;
  naming: Set<string>;
  setNaming: React.Dispatch<React.SetStateAction<Set<string>>>;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  showErrors: boolean;
  attachReason?: string;
  onAttach: (groupId: string) => void;
  onOpenRule: (ruleId: string) => void;
  onDelete: (g: RuleGroup) => void;
  deleteReason: (id: string) => string | undefined;
}) {
  const [sel, setSel] = useState<ExplorerSel>({ kind: 'root' });
  const [rootOpen, setRootOpen] = useState(true);
  const [ctx, setCtx] = useState<{ x: number; y: number; sel: ExplorerSel } | null>(null);
  const nums = groupNumbers(groups);
  const all = allGroups(groups);
  const find = (id: string) => all.find((g) => g.id === id);
  const depthOf = (id: string) => (locate(groups, id)?.depth ?? 0);
  // A selection whose row has gone falls back to the root.
  useEffect(() => {
    if (sel.kind === 'group' && !find(sel.id)) setSel({ kind: 'root' });
    if (sel.kind === 'rule' && !find(sel.groupId)?.ruleIds.includes(sel.ruleId)) setSel({ kind: 'root' });
  });

  /** The group a new group goes INTO for a selection — null = top level. */
  const targetOf = (s: ExplorerSel): string | null => (s.kind === 'root' ? null : s.kind === 'group' ? s.id : s.groupId);
  const addReasonFor = (s: ExplorerSel) => {
    const t = targetOf(s);
    if (t === null) return undefined;
    const g = find(t);
    if (!g?.name.trim()) return 'Name this group first';
    if (depthOf(t) + 1 >= MAX_GROUP_DEPTH) return `Groups go ${MAX_GROUP_DEPTH} levels deep at most`;
    return undefined;
  };
  const attachReasonFor = (s: ExplorerSel) => attachReason ?? (s.kind === 'root' ? 'Select a group to attach rules to it' : undefined);
  const addInside = (s: ExplorerSel) => {
    if (addReasonFor(s)) return;
    const t = targetOf(s);
    const fresh = newGroup('');
    if (t === null) { setGroups((gs) => [...gs, fresh]); setRootOpen(true); }
    else { setGroups((gs) => mapGroup(gs, t, (y) => ({ ...y, children: [...(y.children ?? []), fresh] }))); setExpanded((x) => new Set(x).add(t)); }
    setExpanded((x) => new Set(x).add(fresh.id));
    setNaming((x) => new Set(x).add(fresh.id));
    setSel({ kind: 'group', id: fresh.id });
  };
  const attach = (s: ExplorerSel) => { const t = targetOf(s); if (t && !attachReasonFor(s)) onAttach(t); };
  const rename = (s: ExplorerSel) => { if (s.kind === 'group') setNaming((x) => new Set(x).add(s.id)); };
  const remove = (s: ExplorerSel) => {
    if (s.kind === 'group') { const g = find(s.id); if (g && !deleteReason(s.id)) onDelete(g); }
    if (s.kind === 'rule') setGroups((gs) => mapGroup(gs, s.groupId, (x) => ({ ...x, ruleIds: x.ruleIds.filter((y) => y !== s.ruleId) })));
  };
  const saveName = (id: string) => {
    if (!find(id)?.name.trim()) { toast.error('Please enter name'); return; }
    setNaming((x) => { const n = new Set(x); n.delete(id); return n; });
  };
  const cancelName = (id: string) => {
    const g = find(id);
    if (g && !g.name.trim() && !g.ruleIds.length && !(g.children ?? []).length && !(groups.length === 1 && groups[0].id === id)) {
      setGroups((gs) => dropGroup(gs, id)); setSel({ kind: 'root' }); return;
    }
    if (g?.name.trim()) setNaming((x) => { const n = new Set(x); n.delete(id); return n; });
  };
  const isSel = (s: ExplorerSel) => JSON.stringify(s) === JSON.stringify(sel);
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    if (e.key === 'F2') { e.preventDefault(); rename(sel); }
    if (e.key === 'Delete') { e.preventDefault(); remove(sel); }
  };

  const TONE = { top: 'min-h-[44px] bg-[#F6F9FC]', sub: 'h-10 border-t border-[#EEF1F4] bg-[#FAFBFC]', rule: 'h-10 border-t border-[#EEF1F4] bg-white' } as const;
  const rowCls = (s: ExplorerSel, tone: keyof typeof TONE = 'rule') => `group/ex relative flex cursor-pointer select-none items-center gap-1.5 pr-2 transition-colors ${TONE[tone]} ${isSel(s) ? '!bg-[#EBF5FF] before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-[#3D8BD0]' : 'hover:!bg-[#F5F7FA]'}`;
  const hoverIcons = (s: ExplorerSel, extra?: React.ReactNode) => (
    <span className={`ml-auto flex flex-shrink-0 items-center ${isSel(s) ? '' : 'invisible group-hover/ex:visible'}`} onClick={(e) => e.stopPropagation()}>
      <ActionIcon label="Add group inside" reason={addReasonFor(s)} onClick={() => addInside(s)}><Plus size={15} /></ActionIcon>
      <ActionIcon label="Attach rules" reason={attachReasonFor(s)} onClick={() => attach(s)}><Link2 size={14} /></ActionIcon>
      {extra}
    </span>
  );
  const chevron = (open: boolean, onToggle: () => void, show: boolean) => show ? (
    <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={open ? 'Collapse' : 'Expand'} className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] hover:text-[#364658]">
      <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
  ) : <span className="size-5 flex-shrink-0" />;
  const toggle = (id: string) => setExpanded((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openCtx = (e: React.MouseEvent, s: ExplorerSel) => { e.preventDefault(); setSel(s); setCtx({ x: e.clientX, y: e.clientY, sel: s }); };

  const renderGroup = (g: RuleGroup, depth: number): React.ReactNode => {
    const s: ExplorerSel = { kind: 'group', id: g.id };
    const kids = g.children ?? [];
    const open = expanded.has(g.id);
    const num = nums.get(g.id) ?? '';
    const isNaming = naming.has(g.id);
    const blank = !g.name.trim();
    const total = groupRuleIds(g).length;
    return (
      <div key={g.id}>
        <div style={{ paddingLeft: 12 + depth * 22 }} className={rowCls(s, depth ? 'sub' : 'top')} onClick={() => setSel(s)} onContextMenu={(e) => openCtx(e, s)} onDoubleClick={() => toggle(g.id)}>
          {chevron(open, () => toggle(g.id), g.ruleIds.length > 0 || kids.length > 0)}
          <Tooltip>
            <TooltipTrigger asChild><span className={`flex-shrink-0 cursor-default text-[13px] tabular-nums text-[#364658] ${depth ? 'font-semibold' : 'font-bold'}`}>{num}</span></TooltipTrigger>
            <TooltipContent>Level {depth + 1} of {MAX_GROUP_DEPTH}</TooltipContent>
          </Tooltip>
          {isNaming ? (
            <input
              autoFocus
              value={g.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setGroups((gs) => mapGroup(gs, g.id, (x) => ({ ...x, name: e.target.value })))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveName(g.id); } if (e.key === 'Escape') { e.preventDefault(); cancelName(g.id); } }}
              placeholder="Enter Name"
              className={`h-7 min-w-0 flex-1 rounded border bg-white px-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none ${showErrors && blank ? 'border-[#F25C4E]' : 'border-[#DFE5ED]'}`}
            />
          ) : (
            <span className={`min-w-0 truncate text-[13px] text-[#364658] ${depth ? 'font-medium' : 'font-semibold'} ${blank ? (showErrors ? 'italic !text-[#F25C4E]' : 'italic !text-[#9CA3AF]') : ''}`} title={g.name}>{g.name || 'Untitled group'}</span>
          )}
          {!isNaming && total > 0 && countChip(total)}
          {isNaming
            ? <span className="ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}><ActionIcon label="Save name" onClick={() => saveName(g.id)}><Check size={15} className="text-[#16A34A]" /></ActionIcon></span>
            : hoverIcons(s, <>
              <ActionIcon label="Rename (F2)" onClick={() => rename(s)}><Pencil size={14} /></ActionIcon>
              <ActionIcon label={kids.length ? 'Delete group and its sub-groups (Delete)' : 'Delete group (Delete)'} danger reason={deleteReason(g.id)} onClick={() => remove(s)}><Trash2 size={15} className={deleteReason(g.id) ? '' : 'text-[#DC2626]'} /></ActionIcon>
            </>)}
        </div>
        {open && (
          <>
            {g.ruleIds.map((rid, j) => {
              const r = ruleById(rid);
              if (!r) return null;
              const rs: ExplorerSel = { kind: 'rule', groupId: g.id, ruleId: rid };
              return (
                <div key={rid} style={{ paddingLeft: 12 + (depth + 1) * 22 + 20 }} className={rowCls(rs, 'rule')} onClick={() => setSel(rs)} onDoubleClick={() => onOpenRule(rid)} onContextMenu={(e) => openCtx(e, rs)}>
                  <span className="h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[r.severity].bar }} title={r.severity} />
                  <span className="flex-shrink-0 text-[12px] tabular-nums text-[#7B8FA5]">{num}.{j + 1}</span>
                  <span className="line-clamp-2 min-w-0 flex-1 break-words text-[13px] text-[#364658]" title={r.name}>{r.name}</span>
                  <ProfileChip profile={r.profile} />
                  <SeverityPill severity={r.severity} />
                  <span className={`flex flex-shrink-0 items-center ${isSel(rs) ? '' : 'invisible group-hover/ex:visible'}`} onClick={(e) => e.stopPropagation()}>
                    <ActionIcon label="Open rule" onClick={() => onOpenRule(rid)}><ChevronRight size={15} /></ActionIcon>
                    <ActionIcon label="Remove from group (Delete)" onClick={() => remove(rs)}><X size={15} /></ActionIcon>
                  </span>
                </div>
              );
            })}
            {kids.map((k) => renderGroup(k, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const groupCount = all.length;
  const ruleCount = groups.flatMap(groupRuleIds).length;
  const ctxItems = ctx ? ([
    ['Add group inside', <Plus size={15} />, addReasonFor(ctx.sel), () => addInside(ctx.sel)],
    ['Attach rules', <Link2 size={15} />, attachReasonFor(ctx.sel), () => attach(ctx.sel)],
    ...(ctx.sel.kind === 'group' ? [['Rename', <Pencil size={14} />, undefined, () => rename(ctx.sel)] as const] : []),
    ...(ctx.sel.kind === 'group' ? [['Delete', <Trash2 size={15} />, deleteReason(ctx.sel.id), () => remove(ctx.sel)] as const] : []),
    ...(ctx.sel.kind === 'rule' ? [['Remove from group', <X size={15} />, undefined, () => remove(ctx.sel)] as const] : []),
  ] as (readonly [string, React.ReactNode, string | undefined, () => void])[]) : [];

  return (
    <div className="space-y-3 outline-none" tabIndex={0} onKeyDown={onKey}>
      {/* The heading bar IS the root — the benchmark itself. Click it to select the top level; its
          + · Attach rules · Collapse all act on whatever is selected. */}
      <div
        onClick={() => setSel({ kind: 'root' })}
        onContextMenu={(e) => openCtx(e, { kind: 'root' })}
        className={`group/ex flex h-11 cursor-pointer select-none items-center gap-2 rounded-lg border pl-3 pr-2 transition-colors ${isSel({ kind: 'root' }) ? 'border-[#3D8BD0] bg-[#EBF5FF]' : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'}`}
      >
        <Layers size={16} className="flex-shrink-0 text-[#7B8FA5]" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#364658]">{rootName.trim() || 'New benchmark'}</span>
        <span className="flex flex-shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          <ActionIcon label={sel.kind === 'root' ? 'Add a main group' : 'Add group inside the selected group'} reason={addReasonFor(sel)} onClick={() => addInside(sel)}><Plus size={16} /></ActionIcon>
          <ActionIcon label="Attach rules to the selected group" reason={attachReasonFor(sel)} onClick={() => attach(sel)}><Link2 size={15} /></ActionIcon>
          <ActionIcon label="Collapse all" onClick={() => setExpanded(new Set())}><ChevronsDownUp size={15} /></ActionIcon>
        </span>
      </div>
      {/* One card per main group (1, 2, 3 …), as in V1. */}
      {groups.map((g) => (
        <div key={g.id} className={`overflow-hidden rounded-lg border ${showErrors && !g.name.trim() ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
          {renderGroup(g, 0)}
        </div>
      ))}
      {!groups.length && <p className="rounded-lg border border-dashed border-[#DFE5ED] px-4 py-6 text-center text-[13px] text-[#9CA3AF]">No groups yet — select the benchmark above and press +.</p>}
      {ctx && createPortal(
        <>
          <div className="fixed inset-0 z-[10040]" onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null); }} />
          <div style={{ top: Math.min(ctx.y, window.innerHeight - 200), left: Math.min(ctx.x, window.innerWidth - 230) }} className="fixed z-[10041] w-[210px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
            {ctxItems.map(([label, icon, reason, fn]) => (
              <button
                key={label}
                type="button"
                disabled={!!reason}
                title={reason}
                onClick={() => { setCtx(null); fn(); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${label === 'Delete' ? 'text-[#DC2626]' : 'text-[#364658]'}`}
              >
                <span className={label === 'Delete' ? 'text-[#DC2626]' : 'text-[#7B8FA5]'}>{icon}</span>{label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

let gseq = 0;
const newGroup = (name = ''): RuleGroup => ({ id: `grp-${++gseq}`, name, ruleIds: [] });
/** A deep copy — optionally with fresh ids (a clone must not share ids with its source). */
const copyGroup = (g: RuleGroup, freshIds = false): RuleGroup => ({ ...g, id: freshIds ? newGroup().id : g.id, ruleIds: [...g.ruleIds], children: (g.children ?? []).map((c) => copyGroup(c, freshIds)) });
/** Every group id in a tree. */
const allGroupIds = (gs: RuleGroup[]): string[] => gs.flatMap((g) => [g.id, ...allGroupIds(g.children ?? [])]);
/** Every group in a tree. */
const allGroups = (gs: RuleGroup[]): RuleGroup[] => gs.flatMap((g) => [g, ...allGroups(g.children ?? [])]);
/** The tree with the group `id` replaced by fn(group). */
const mapGroup = (gs: RuleGroup[], id: string, fn: (g: RuleGroup) => RuleGroup): RuleGroup[] =>
  gs.map((g) => (g.id === id ? fn(g) : { ...g, children: g.children ? mapGroup(g.children, id, fn) : g.children }));
/** The tree with `g` placed right after the group `id`, at the same level. */
const insertAfter = (gs: RuleGroup[], id: string, g: RuleGroup): RuleGroup[] => {
  const i = gs.findIndex((x) => x.id === id);
  if (i >= 0) return [...gs.slice(0, i + 1), g, ...gs.slice(i + 1)];
  return gs.map((x) => ({ ...x, children: x.children ? insertAfter(x.children, id, g) : x.children }));
};
/** Where a group sits: the list it is in, its index there, and its depth. */
const locate = (gs: RuleGroup[], id: string, depth = 0, parent: RuleGroup | null = null): { list: RuleGroup[]; i: number; depth: number; parent: RuleGroup | null } | null => {
  const i = gs.findIndex((g) => g.id === id);
  if (i >= 0) return { list: gs, i, depth, parent };
  for (const g of gs) { const hit = locate(g.children ?? [], id, depth + 1, g); if (hit) return hit; }
  return null;
};
/** How many levels a group's subtree spans (a group with no sub-groups = 1). */
const heightOf = (g: RuleGroup): number => 1 + Math.max(0, ...(g.children ?? []).map(heightOf));
/** Tab: the group becomes the LAST sub-group of the group just above it. */
const indentGroup = (gs: RuleGroup[], id: string): { gs: RuleGroup[]; parentId: string } | string => {
  const at = locate(gs, id);
  if (!at || at.i === 0) return 'There is no group above it to go under';
  const g = at.list[at.i];
  if (at.depth + 1 + heightOf(g) > MAX_GROUP_DEPTH) return `Groups go ${MAX_GROUP_DEPTH} levels deep at most`;
  const above = at.list[at.i - 1];
  const moved = dropGroup(gs, id);
  return { gs: mapGroup(moved, above.id, (x) => ({ ...x, children: [...(x.children ?? []), g] })), parentId: above.id };
};
/** Shift+Tab: the group leaves its parent and lands right after it. */
const outdentGroup = (gs: RuleGroup[], id: string): RuleGroup[] | string => {
  const at = locate(gs, id);
  if (!at?.parent) return 'It is already a top-level group';
  const g = at.list[at.i];
  return insertAfter(dropGroup(gs, id), at.parent.id, g);
};

/** The tree without the group `id` (and its sub-groups). */
const dropGroup = (gs: RuleGroup[], id: string): RuleGroup[] =>
  gs.filter((g) => g.id !== id).map((g) => ({ ...g, children: g.children ? dropGroup(g.children, id) : g.children }));
/** The tree with these rules taken out of every group. */
const withoutRules = (gs: RuleGroup[], ids: string[]): RuleGroup[] =>
  gs.map((g) => ({ ...g, ruleIds: g.ruleIds.filter((y) => !ids.includes(y)), children: g.children ? withoutRules(g.children, ids) : g.children }));
/** Group id → its number (1, 1.3, 1.3.2 …). */
const groupNumbers = (gs: RuleGroup[]) => {
  const m = new Map<string, string>();
  const walk = (g: RuleGroup, n: string) => { m.set(g.id, n); (g.children ?? []).forEach((c, k) => walk(c, `${n}.${g.ruleIds.length + k + 1}`)); };
  gs.forEach((g, i) => walk(g, String(i + 1)));
  return m;
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

const nextGroupName = (gs: RuleGroup[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  let n = gs.length + 1;
  while (gs.some((g) => g.name.trim().toLowerCase() === `rule group ${n}`)) n++;
  return `Rule Group ${n}`;
};

/* A benchmark as numbered groups — benchmarkGroups() in complianceData, shared with every
   technician page so the 1 · 1.1 · 1.3.1 numbering reads the same everywhere. */

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
  const groups = useMemo(() => benchmarkGroups(benchmark), [benchmark]);
  const usedBy = usePolicyCounts()(benchmark.id);
  // The first group starts open — the rest is one click away.
  // The first group starts open, all the way down — the rest is one click away.
  const firstOpen = () => new Set(groups[0] ? allGroupIds([groups[0]]) : []);
  const [open, setOpen] = useState<Set<string>>(firstOpen);
  useEffect(() => { setOpen(firstOpen()); }, [benchmark.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [full, setFull] = useState(true);
  const [menu, setMenu] = useState(false);
  const total = benchmarkRuleIds(benchmark).length;
  const isDefault = benchmark.origin === 'Default';
  const openRule = ruleId ? ruleById(ruleId) : undefined;
  const allOpen = groups.length > 0 && allGroupIds(groups).every((id) => open.has(id));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ruleId && !menu) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ruleId, menu, onClose]);

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
              <span className="line-clamp-2 break-words">{benchmark.name}</span>
            </h1>
            {/* Its facts as chips under the title — tinted where the value means something. */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <MetaChip label="Type" value={benchmark.type} />
              <MetaChip label="Version" value={benchmark.osVersion || '—'} />
              <MetaChip value={benchmark.origin} tone={isDefault ? 'neutral' : 'green'} icon={isDefault ? <Lock size={11} /> : undefined} title={isDefault ? 'Ships with the product — read only' : 'Built in this workspace'} />
              <MetaChip label="Rules" value={total} />
              <MetaChip label="Updated" value={fmtDate(benchmark.updatedAt)} title={`by ${benchmark.createdBy}`} />
            </div>
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
                          <button type="button" disabled={!!deleteReason(benchmark, usedBy)} onClick={() => { setMenu(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent"><Trash2 size={15} /> Delete</button>
                        </span>
                      </TooltipTrigger>
                      {deleteReason(benchmark, usedBy) && <TooltipContent side="left" className="text-wrap max-w-[260px]">{deleteReason(benchmark, usedBy)}</TooltipContent>}
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The rule groups, and nothing else. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-[#364658]">Rule Groups <span className="text-[12px] font-normal text-[#7B8FA5]">{groups.length} group{groups.length === 1 ? '' : 's'} · {total} rule{total === 1 ? '' : 's'}</span></span>
            {groups.length > 0 && (
              <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(allGroupIds(groups)))} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>
          {groups.length === 0 ? (
            <div className="rounded-lg border border-[#E5E7EB] px-4 py-10 text-center text-[13px] text-[#9CA3AF]">This benchmark has no rules.</div>
          ) : (
            <div className="space-y-3">
              {groups.map((g, i) => (
                <GroupNode key={g.id} g={g} number={String(i + 1)} depth={0} ops={{ open, onToggle: toggle, onOpenRule: setRuleId }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {openRule && (
        <RuleDetailPanel
          admin
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
  const [profile, setProfile] = useState<BenchmarkProfile>(base?.profile ?? 'L1');
  /** Turning a level off while its rules are attached: the confirm holds the level and the count. */
  const [confirmDrop, setConfirmDrop] = useState<{ level: Profile; count: number } | null>(null);
  const [description, setDescription] = useState(base?.description ?? '');
  const [groups, setGroups] = useState<RuleGroup[]>(() =>
    editing ? editing.groups.map((g) => copyGroup(g))
      : source ? benchmarkGroups(source).map((g) => copyGroup(g, true))
        : [newGroup('')]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allGroupIds(groups)));
  /** V1 = the ⊕-menu tree; V2 = the explorer (select a group, + adds inside it). The logo's V1 | V2 pill. */
  const builderUi = useComplianceRuleUi();
  /** Groups whose name field is open — a new group starts here, ✓ closes it. */
  const [naming, setNaming] = useState<Set<string>>(() => new Set(groups.filter((g) => !g.name.trim()).map((g) => g.id)));
  /** Where a new group would land while an ⊕ menu item is hovered. */
  const [preview, setPreview] = useState<{ at: string; mode: 'inside' | 'below' } | null>(null);
  /** A group with sub-groups waiting on a confirm before it goes. */
  const [confirmGroup, setConfirmGroup] = useState<RuleGroup | null>(null);
  /** Where Attach Rules is aimed: a group, or one of its sub-groups. */
  const [attachTo, setAttachTo] = useState<{ g: string } | null>(null);
  const [tried, setTried] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(null);

  const attached = groups.flatMap(groupRuleIds);
  const dupName = names.includes(name.trim().toLowerCase());
  const reason =
    !name.trim() ? 'The benchmark needs a name'
      : dupName ? 'A benchmark with this name already exists'
        : !type ? 'Choose a Type'
          : !version ? 'Choose a Version'
            : allGroups(groups).some((g) => !g.name.trim()) ? 'Every rule group needs a name'
              : !attached.length ? 'A benchmark with no rules assesses nothing — attach at least one'
                : '';

  // A benchmark holds rules of ONE Type and ONE OS version; changing either clears what no longer fits.
  const clearRules = (what: string) => {
    if (attached.length) toast(`${attached.length} rule${attached.length > 1 ? 's were' : ' was'} removed — they were written for ${what}`);
    setGroups((gs) => withoutRules(gs, attached));
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
  /* Profile = which levels the benchmark holds: Level 1, Level 2, or both (at least one).
     Turning a level ON only widens what can be attached; turning one OFF would drop that
     level's attached rules, so it asks first. */
  const levels = profileLevels(profile);
  const attachedOf = (l: Profile) => attached.filter((id) => ruleById(id)?.profile === l);
  const toggleLevel = (l: Profile) => {
    if (!levels.includes(l)) { setProfile(profileOf([...levels, l])); return; }
    if (levels.length === 1) { toast('A benchmark needs at least one level — turn the other one on first'); return; }
    const n = attachedOf(l).length;
    if (n) { setConfirmDrop({ level: l, count: n }); return; }
    setProfile(profileOf(levels.filter((x) => x !== l)));
  };
  const dropLevel = (l: Profile) => {
    const drop = new Set(attachedOf(l));
    setGroups((gs) => withoutRules(gs, [...drop]));
    setProfile(profileOf(levels.filter((x) => x !== l)));
    toast(`${drop.size} Level ${l === 'L1' ? '1' : '2'} rule${drop.size > 1 ? 's were' : ' was'} removed`);
    setConfirmDrop(null);
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
      groups,
      usedBy: editing?.usedBy ?? 0,
      createdBy: editing?.createdBy ?? 'Zeni Chakalasiya',
      updatedAt: new Date().toISOString().slice(0, 16),
    });
  };

  /* ── Attach Rules picker: this version's rules, with the listing filter bar ── */
  const attachGroup = attachTo ? allGroups(groups).find((g) => g.id === attachTo.g) : undefined;
  const target = attachGroup;
  const numbersOfGroups = groupNumbers(groups);
  const targetLabel = (gid: string) => {
    const g = allGroups(groups).find((x) => x.id === gid);
    return `${numbersOfGroups.get(gid) ?? ''} ${g?.name || 'Untitled group'}`.trim();
  };
  /* The version's rules the profile allows: L1 → Level 1 only; L2 → Level 1 and Level 2. */
  const pool = useMemo(() => RULES.filter((r) => r.type === type && osVersionOf(r) === version && profileAllows(profile, r.profile)), [type, version, profile]);
  const [pickRules, setPickRules] = useState<FilterRule[]>([]);
  useEffect(() => { setPickRules([]); }, [attachTo?.g]);
  const pickAttrs = useMemo(() => {
    const plain = (o: { label: string }[]) => o.map(({ label }) => ({ label }));
    return [
      selectAttr('severity', 'Severity', ShieldAlert, SEVERITIES.filter((s) => pool.some((r) => r.severity === s)).map((v) => ({ label: v, color: SEVERITY_PILL[v].bar }))),
      selectAttr('section', 'Section', Layers, plain(optionsOf(pool, (r) => r.section[1]))),
      selectAttr('profile', 'Profile', BadgeCheck, plain(optionsOf(pool, (r) => r.profile, ['L1', 'L2']))),
    ];
  }, [pool]);
  const pickQuick = useMemo<QuickFilterDef[]>(() => [
    { field: 'severity', icon: ShieldAlert, tip: 'Filter by severity', title: 'Severity is', width: 196, row: 'dot', options: pickAttrs[0].options! },
    { field: 'section', icon: Layers, tip: 'Filter by section', title: 'Section is', width: 240, row: 'plain', options: pickAttrs[1].options! },
    // Only an L2 benchmark mixes the two levels, so only then is there anything to filter by.
    ...(profile === 'L1+L2' ? [{ field: 'profile', icon: BadgeCheck, tip: 'Filter by profile', title: 'Profile is', width: 160, row: 'plain' as const, options: pickAttrs[2].options! }] : []),
  ], [pickAttrs, profile]);
  const pickRows = useMemo(
    () => matchRules(pool, pickRules, (r, f) => (f === 'section' ? r.section[1] : String((r as any)[f] ?? ''))),
    [pool, pickRules],
  );
  /** Where a rule already sits — a rule lives in ONE place in a benchmark. */
  const placeOf = (id: string): { g: string } | undefined => {
    const g = allGroups(groups).find((x) => x.ruleIds.includes(id));
    return g ? { g: g.id } : undefined;
  };
  const columns: PickerColumn<ComplianceRule>[] = [
    {
      header: 'Rule Name', cell: (r) => {
        const other = placeOf(r.id);
        const here = !!other && !!attachTo && other.g === attachTo.g;
        return (
          <span className="flex min-w-0 items-center gap-2">
            <span className="line-clamp-2 break-words text-[13px] font-medium" title={r.name}>{r.name}</span>
            {other && !here && <span className="max-w-[220px] flex-shrink-0 truncate rounded bg-[#FFFAEB] px-1.5 py-0.5 text-[11px] text-[#B54708]" title={`In ${targetLabel(other.g)}`}>In {targetLabel(other.g)}</span>}
          </span>
        );
      },
    },
    { header: 'Section', cell: (r) => <span className="whitespace-nowrap">{r.section[1]}</span> },
    { header: 'Profile', cell: (r) => <ProfileChip profile={r.profile} /> },
    { header: 'Severity', cell: (r) => <SeverityPill severity={r.severity} /> },
  ];

  const attachReason = !type ? 'Choose the benchmark’s Type and Version first — only rules for that OS version can be attached'
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
        <div className="mx-auto max-w-[840px] px-4 py-5">
          {/* Name · Profile, then Type · Version, then Description across the full width of the rule groups. */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <FieldLabel required>Benchmark Name</FieldLabel>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Benchmark Name" className={`${inputCls} ${tried && (!name.trim() || dupName) ? '!border-[#F25C4E]' : ''}`} />
              <ErrorText>{tried && (!name.trim() ? 'Enter a name' : dupName ? 'This name is taken' : '')}</ErrorText>
            </div>
            <div>
              <FieldLabel required>Profile</FieldLabel>
              {/* Two boxes, either or both on — each carries a tick while it is on. */}
              <div className="chip-tabs">
                {PROFILES.map((p) => (
                  <Tooltip key={p.value}>
                    <TooltipTrigger asChild>
                      <button type="button" aria-pressed={levels.includes(p.value)} onClick={() => toggleLevel(p.value)} style={{ height: 32, borderRadius: 4 }}>
                        {p.label}{levels.includes(p.value) && <span className="chip-check"><Check size={9} strokeWidth={3.5} /></span>}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-wrap max-w-[240px]">{p.tip} — select one or both</TooltipContent>
                  </Tooltip>
                ))}
              </div>
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
            <div className="col-span-2">
              <FieldLabel>Description</FieldLabel>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} className={`${inputCls} !h-auto resize-y py-2 leading-[18px]`} />
            </div>

          </div>

          <div className="mt-8">
            <h2 className="text-[14px] font-semibold text-[#364658]">Rule Groups <span className="ml-1 text-[12px] font-normal text-[#7B8FA5]">{groups.length} group{groups.length === 1 ? '' : 's'} · {attached.length} rule{attached.length === 1 ? '' : 's'}</span></h2>
          </div>

          {builderUi === 'v2' && (
            <div className="mt-3">
              <GroupExplorer
                groups={groups}
                setGroups={setGroups}
                rootName={name}
                naming={naming}
                setNaming={setNaming}
                expanded={expanded}
                setExpanded={setExpanded}
                showErrors={tried}
                attachReason={attachReason}
                onAttach={(id) => setAttachTo({ g: id })}
                onOpenRule={setRuleId}
                onDelete={(x) => { if (x.children?.length) setConfirmGroup(x); else setGroups((gs) => dropGroup(gs, x.id)); }}
                deleteReason={(id) => (groups.length === 1 && groups[0].id === id ? 'A benchmark needs at least one rule group' : undefined)}
              />
            </div>
          )}
          {builderUi === 'v1' && (
          <div className="mt-3 space-y-3">
            {groups.map((g, gi) => (
              <GroupNode
                key={g.id}
                g={g}
                number={String(gi + 1)}
                depth={0}
                siblingNext={String(gi + 2)}
                ops={{
                  editable: true,
                  showErrors: tried,
                  ruleScope: version,
                  attachReason,
                  open: expanded,
                  onToggle: (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }),
                  editingNames: naming,
                  onName: (id, v) => setGroups((gs) => mapGroup(gs, id, (x) => ({ ...x, name: v }))),
                  onSaveName: (id) => {
                    const x = allGroups(groups).find((y) => y.id === id);
                    if (!x?.name.trim()) { toast.error('Please enter name'); return; }
                    setNaming((s) => { const n = new Set(s); n.delete(id); return n; });
                  },
                  onEditName: (id) => setNaming((s) => new Set(s).add(id)),
                  onAddChild: (id) => {
                    const fresh = newGroup('');
                    setGroups((gs) => mapGroup(gs, id, (y) => ({ ...y, children: [...(y.children ?? []), fresh] })));
                    setExpanded((s) => new Set(s).add(id).add(fresh.id));
                    setNaming((s) => { const n = new Set(s); n.delete(id); n.add(fresh.id); return n; });
                  },
                  onAddBelow: (id) => {
                    const fresh = newGroup('');
                    setGroups((gs) => insertAfter(gs, id, fresh));
                    setExpanded((s) => new Set(s).add(fresh.id));
                    setNaming((s) => { const n = new Set(s); n.delete(id); n.add(fresh.id); return n; });
                  },
                  preview,
                  setPreview,
                  onNameKey: (id, e) => {
                    const x = allGroups(groups).find((y) => y.id === id);
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!x?.name.trim()) { toast.error('Please enter name'); return; }
                      // Enter only saves the name — new groups come from the ⊕ menu, never on their own.
                      setNaming((s) => { const n = new Set(s); n.delete(id); return n; });
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      const res = e.shiftKey ? outdentGroup(groups, id) : indentGroup(groups, id);
                      if (typeof res === 'string') { toast(res); return; }
                      if (Array.isArray(res)) setGroups(res);
                      else { setGroups(res.gs); setExpanded((s) => new Set(s).add(res.parentId)); }
                    } else if (e.key === 'Escape') {
                      if (x?.name.trim()) setNaming((s) => { const n = new Set(s); n.delete(id); return n; });
                    }
                  },
                  onAttach: (id) => setAttachTo({ g: id }),
                  onDelete: (x) => { if (x.children?.length) setConfirmGroup(x); else setGroups((gs) => dropGroup(gs, x.id)); },
                  deleteReason: (id) => (groups.length === 1 && groups[0].id === id ? 'A benchmark needs at least one rule group' : undefined),
                  onRemoveRule: (gid, rid) => setGroups((gs) => mapGroup(gs, gid, (x) => ({ ...x, ruleIds: x.ruleIds.filter((y) => y !== rid) }))),
                  onOpenRule: setRuleId,
                }}
              />
            ))}
            {/* A new group goes where groups are added — after the last one. */}
            <button
              type="button"
              onClick={() => { const g = newGroup(''); setGroups((gs) => [...gs, g]); setExpanded((s) => new Set(s).add(g.id)); setNaming((s) => new Set(s).add(g.id)); }}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] text-[13px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5FAFF]"
            ><Plus size={15} /> Add rule group</button>
          </div>
          )}
        </div>
      </div>

      <PickerDrawer<ComplianceRule>
        isOpen={!!target}
        title="Attach Rules"
        subtitle={attachTo ? `${profile === 'L1' ? 'Level 1 rules' : profile === 'L2' ? 'Level 2 rules' : 'Level 1 and Level 2 rules'} for “${targetLabel(attachTo.g)}”` : ''}
        rows={pickRows}
        columns={columns}
        selected={target ? target.ruleIds : []}
        searchOf={(r) => [r.name, r.description, r.section[1], r.severity].join(' ')}
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
          // A rule lives in ONE place: picking it here moves it out of any other group. The group
          // then lays itself out — sub-sections from the catalogue, the rest flat.
          const at = attachTo!;
          setGroups((gs) => mapGroup(withoutRules(gs, ids), at.g, (x) => ({ ...x, ruleIds: ids })));
          setExpanded((s) => new Set(s).add(at.g));
          setAttachTo(null);
        }}
      />

      {openRule && <RuleDetailPanel admin rule={openRule} usedIn={[]} onClose={() => setRuleId(null)} />}

      {confirmGroup && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setConfirmGroup(null)}>
          <div className="w-[440px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Delete “{confirmGroup.name || 'Untitled group'}”?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">
              Its {allGroups(confirmGroup.children ?? []).length} sub-group{allGroups(confirmGroup.children ?? []).length === 1 ? '' : 's'} and {groupRuleIds(confirmGroup).length} attached rule{groupRuleIds(confirmGroup).length === 1 ? '' : 's'} go with it. The rules stay in the catalogue.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmGroup(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button type="button" onClick={() => { const id = confirmGroup.id; setGroups((gs) => dropGroup(gs, id)); setConfirmGroup(null); }} className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]">Delete group</button>
            </div>
          </div>
        </div>
      )}

      {confirmDrop && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setConfirmDrop(null)}>
          <div className="w-[440px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Turn off Level {confirmDrop.level === 'L1' ? '1' : '2'}?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">
              The <span className="font-medium text-[#364658]">{confirmDrop.count} Level {confirmDrop.level === 'L1' ? '1' : '2'} rule{confirmDrop.count === 1 ? '' : 's'}</span> attached to its groups will be removed; the other level's rules stay.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDrop(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
              <button type="button" onClick={() => dropLevel(confirmDrop.level)} className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#3478B5]">Turn off</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
