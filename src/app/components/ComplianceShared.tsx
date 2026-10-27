import { useEffect, useState } from 'react';
import { Check, Lock, X } from 'lucide-react';
import type { Attr, FilterRule } from './TicketFilterBar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SEVERITY_PILL } from './complianceData';
import type { ComplianceRule, Severity } from './complianceData';

/* Pieces the Compliance Rules and Benchmark screens share. None of them is a new design:
 *  - Filtering is the data-grid listings' TicketFilterBar; matchRules applies its rules to these rows.
 *  - SeverityPill is the Detected CVEs listing's tinted pill.
 *  - TagCell is the first-chip + "+N" with a dark tooltip, as the BOM grid's Excluded Paths cell.
 *  - RuleDetailPanel is a right side panel in the PickerDrawer shell, with the detail page's
 *    inline tab treatment. */

/* ── Filter pill ─────────────────────────────────────────────────────────────────────────── */

/* The filter is the product's own listing filter bar — TicketFilterBar, the one every data-grid
   listing renders beside its search: applied filters as removable chips (Attribute · is ·
   value), a "Filters" button that turns into a dashed + once chips exist, the module's
   quick-filter icons, and Clear all. Pages pass their attribute catalogue and quick filters;
   this file only supplies the matcher, because TicketFilterBar's applyFilters reads
   request-shaped rows. */
export type { FilterRule };

/** A select attribute whose options are the values the rows actually carry. */
export function selectAttr(key: string, label: string, icon: Attr['icon'], options: { label: string; color?: string }[]): Attr {
  return { key, label, icon, type: 'select', options };
}

/** The filter bar's conditions, over any row. A chip that has no value yet matches everything. */
export function matchRules<T>(rows: T[], rules: FilterRule[], valueOf: (row: T, field: string) => string | string[]): T[] {
  const live = rules.filter((r) => r.condition === 'empty' || r.condition === 'not empty' || r.values.length > 0);
  if (!live.length) return rows;
  return rows.filter((row) => live.every((r) => {
    const raw = valueOf(row, r.field);
    const vals = (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((v) => v.toLowerCase());
    const want = r.values.map((v) => v.toLowerCase());
    switch (r.condition) {
      case 'is': return want.some((v) => vals.includes(v));
      case 'is not': return !want.some((v) => vals.includes(v));
      case 'contains': return want.some((w) => vals.some((v) => v.includes(w)));
      case 'empty': return vals.length === 0;
      case 'not empty': return vals.length > 0;
      default: return true;
    }
  }));
}

/** Options with the number of rows carrying each value, in first-seen order unless `order` is given. */
export function optionsOf<T>(rows: T[], get: (r: T) => string | string[], order?: string[]) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = get(r);
    for (const x of Array.isArray(v) ? v : [v]) if (x) counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  const keys = order ? order.filter((k) => counts.has(k)) : [...counts.keys()].sort((a, b) => a.localeCompare(b));
  return keys.map((k) => ({ value: k, label: k, count: counts.get(k) }));
}

/* ── Cells ───────────────────────────────────────────────────────────────────────────────── */

export function SeverityPill({ severity }: { severity: Severity }) {
  const t = SEVERITY_PILL[severity];
  return (
    <span className="inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: t.bg, color: t.text }}>{severity}</span>
  );
}

/** First tag as a chip, the rest behind "+N" with every tag in a dark tooltip. */
export function TagCell({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-[13px] text-[#9CA3AF]">—</span>;
  const chip = 'inline-block max-w-[150px] truncate rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] text-[#364658]';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={chip} title={tags[0]}>{tags[0]}</span>
      {tags.length > 1 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-default rounded border border-[#DFE5ED] px-1.5 py-0.5 text-[12px] text-[#64748B]">+{tags.length - 1}</span>
          </TooltipTrigger>
          <TooltipContent className="text-wrap">{tags.slice(1).join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/** A Default benchmark is read-only: a lock before its name. A Custom one has nothing there. */
export function DefaultLock({ show, size = 13 }: { show: boolean; size?: number }) {
  if (!show) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex flex-shrink-0 text-[#9CA3AF]"><Lock size={size} /></span>
      </TooltipTrigger>
      <TooltipContent>Default — ships with the product, read only</TooltipContent>
    </Tooltip>
  );
}

/* ── Rule detail — right side panel ──────────────────────────────────────────────────────── */

type RuleTab = 'summary' | 'audit' | 'remediation' | 'references' | 'controls';
const RULE_TABS: [RuleTab, string][] = [
  ['summary', 'Summary'], ['audit', 'Audit'], ['remediation', 'Remediation'],
  ['references', 'References'], ['controls', 'Controls'],
];

const fieldLabel = 'text-[12px] text-[#7B8FA5]';
const fieldValue = 'mt-1 text-[13px] leading-[1.6] text-[#364658]';
const codeBox = 'mt-2 whitespace-pre-wrap rounded bg-[#F9FAFB] px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-[#364658]';
const readBox = 'mt-1 flex min-h-8 items-center rounded bg-[#F9FAFB] px-3 py-1.5 text-[13px] text-[#364658]';

export function RuleDetailPanel({ rule, usedIn, onClose, number }: {
  rule: ComplianceRule;
  /** The rule's hierarchy number in the benchmark it was opened from (1.3.2). */
  number?: string;
  /** Benchmark names that reference this rule. */
  usedIn: string[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-[800px] max-w-[95vw] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <h3 className="flex min-w-0 items-start gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
            <span className="mt-1 h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[rule.severity].bar }} title={rule.severity} />
            {number && <span className="flex-shrink-0 tabular-nums text-[#7B8FA5]">{number}</span>}
            <span>{rule.name}</span>
          </h3>
          <button type="button" onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <RuleDetailBody rule={rule} usedIn={usedIn} />
      </div>
    </div>
  );
}

/** The rule's metadata tabs (Summary · Audit · Remediation · References · Controls) and
 *  their content, without a panel around them — so a panel that drills into a rule can show it
 *  in place, under its own header. `lead` sits above the tabs (the result on one endpoint, or
 *  the endpoints a rule passed / failed on). There is no Results tab: results are never a tab. */
export function RuleDetailBody({ rule, usedIn, lead }: {
  rule: ComplianceRule;
  usedIn: string[];
  lead?: React.ReactNode;
}) {
  const [tab, setTab] = useState<RuleTab>('summary');
  useEffect(() => { setTab('summary'); }, [rule.id]);
  const tabs = RULE_TABS;

  return (
    <>
        {lead && <div className="px-5 pb-4 pt-4">{lead}</div>}
        <div className="border-b border-[#e5e7eb] px-5">
          <div className="flex items-center gap-2.5">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === 'summary' && (
            <div className="space-y-5">
              <div>
                <div className={fieldLabel}>Description</div>
                <p className={fieldValue}>{rule.description}</p>
              </div>
              <div>
                <div className={fieldLabel}>Rationale</div>
                <p className={fieldValue}>{rule.rationale}</p>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-5">
              <div>
                <p className={fieldValue}>{rule.audit}</p>
                <div className={codeBox}>{rule.command}</div>
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#364658]">Rule Condition</div>
                <div className="mt-2 space-y-3">
                  {rule.conditions.map((c, i) => (
                    <div key={i} className="grid grid-cols-[24px_1fr_160px_160px] items-end gap-3">
                      <span className="pb-2 text-[12px] text-[#9CA3AF]">{i + 1}</span>
                      <div><div className={fieldLabel}>Result Pattern</div><div className={`${readBox} font-mono text-[12px]`}>{c.pattern}</div></div>
                      <div><div className={fieldLabel}>Occurrence</div><div className={readBox}>{c.occurrence}</div></div>
                      <div><div className={fieldLabel}>Condition</div><div className={readBox}>{c.condition}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'remediation' && (
            <div className="space-y-5">
              <div>
                <div className={fieldLabel}>Remediation</div>
                <p className={fieldValue}>{rule.remediation}</p>
              </div>
              <div>
                <div className={fieldLabel}>Value</div>
                <div className={codeBox}>{rule.remediationValue}</div>
              </div>
            </div>
          )}

          {tab === 'references' && (
            <ul className="space-y-2">
              {rule.references.map((r) => (
                <li key={r} className="rounded bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-[#364658]">{r}</li>
              ))}
            </ul>
          )}

          {tab === 'controls' && (
            <div className="space-y-4">
              {rule.controls.map((c) => (
                <div key={c.version} className="rounded-lg border border-[#E5E7EB] p-4">
                  <div className={fieldLabel}>Controls Version: {c.version}</div>
                  {c.safeguard ? (
                    <>
                      <div className="mt-1.5 text-[13px] font-semibold text-[#364658]">{c.safeguard}</div>
                      {c.text && <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">{c.text}</p>}
                    </>
                  ) : (
                    <div className="mt-1.5 text-[13px] text-[#64748B]">Explicitly Not Mapped</div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
    </>
  );
}
