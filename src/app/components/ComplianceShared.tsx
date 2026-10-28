import { useEffect, useState } from 'react';
import { Check, Copy, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useComplianceRuleUi } from './complianceRuleUi';
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

/* ── Detail chips — a record's facts under its title ─────────────────────────────────────── */

const TONES = {
  neutral: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#364658]',
  blue: 'border-[#CFE3F6] bg-[#EBF5FF] text-[#2F74B5]',
  violet: 'border-[#E4D9FB] bg-[#F3EEFF] text-[#6D28D9]',
  green: 'border-[#C9EBD6] bg-[#ECFDF3] text-[#15803D]',
  amber: 'border-[#F6DFB0] bg-[#FFFAEB] text-[#B54708]',
} as const;
export type ChipTone = keyof typeof TONES;

/** One fact as a chip: a muted label, then the value. Tinted chips carry meaning (profile,
 *  assessment, origin); neutral ones are plain facts (type, version). */
export function MetaChip({ label, value, tone = 'neutral', icon, title }: { label?: string; value: React.ReactNode; tone?: ChipTone; icon?: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex h-6 items-center gap-1.5 rounded border px-2 text-[12px] font-medium ${TONES[tone]}`}>
      {icon}
      {label && <span className="font-normal opacity-70">{label}</span>}
      {value}
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

type RuleTab = 'first' | 'summary' | 'audit' | 'remediation' | 'references' | 'controls';
/** An extra tab placed BEFORE the metadata tabs (the technician Rules page's Endpoints). */
export interface RuleFirstTab { label: string; node: React.ReactNode }
const RULE_TABS: [RuleTab, string][] = [
  ['summary', 'Summary'], ['audit', 'Audit'], ['remediation', 'Remediation'],
  ['references', 'References'], ['controls', 'Controls'],
];

const fieldLabel = 'text-[12px] text-[#7B8FA5]';
const fieldValue = 'mt-1 text-[13px] leading-[1.6] text-[#364658]';
const codeBox = 'mt-2 whitespace-pre-wrap rounded bg-[#F9FAFB] px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-[#364658]';
const readBox = 'mt-1 flex min-h-8 items-center rounded bg-[#F9FAFB] px-3 py-1.5 text-[13px] text-[#364658]';

export function RuleDetailPanel({ rule, usedIn, onClose, number, admin, firstTab, wide }: {
  rule: ComplianceRule;
  /** The rule's hierarchy number in the benchmark it was opened from (1.3.2). */
  number?: string;
  /** Benchmark names that reference this rule. */
  usedIn: string[];
  onClose: () => void;
  /** Admin side: follows the V1 | V2 switch (V2 = one scrolling page, no tabs). */
  admin?: boolean;
  firstTab?: RuleFirstTab;
  /** A wider panel, for a first tab that holds a table. */
  wide?: boolean;
}) {
  const ui = useComplianceRuleUi();
  const onePage = admin && ui === 'v2';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/40" onClick={onClose}>
      <div className={`flex h-full ${wide ? 'w-[1040px]' : 'w-[800px]'} max-w-[95vw] flex-col bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <h3 className="flex min-w-0 items-start gap-2 text-[16px] font-semibold leading-6 text-[#364658]">
            <span className="mt-1 h-4 w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: SEVERITY_PILL[rule.severity].bar }} title={rule.severity} />
            {number && <span className="flex-shrink-0 tabular-nums text-[#7B8FA5]">{number}</span>}
            <span>{rule.name}</span>
          </h3>
          <button type="button" onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        {/* The rule's basic facts, under its title. */}
        <div className={`flex flex-wrap items-center gap-1.5 px-5 pt-2.5 ${onePage ? 'pb-1' : 'pb-4'}`}>
          <MetaChip label="Type" value={rule.type} />
          <MetaChip label="Platform" value={rule.platform} />
          <MetaChip label="Version" value={rule.version} />
          <MetaChip label="Profile" value={rule.profile} tone={rule.profile === 'L1' ? 'blue' : 'violet'} title={rule.profile === 'L1' ? 'Level 1 — must have' : 'Level 2 — good to have'} />
          <MetaChip value={rule.assessment} tone={rule.assessment === 'Automated' ? 'green' : 'amber'} title={rule.assessment === 'Automated' ? 'The agent checks this rule' : 'A person has to review this rule'} />
          <MetaChip label="Severity" value={rule.severity} />
        </div>
        {onePage ? <RulePageBody rule={rule} /> : <RuleDetailBody rule={rule} usedIn={usedIn} firstTab={firstTab} />}
      </div>
    </div>
  );
}

/* ── V2: every section on one scrolling page ────────────────────────────────────────────────
 * The same things the tabs hold, read top to bottom as a plain rhythm: a TITLE, its DATA, a
 * divider — then the next. No icons, no nested cards. Commands and values sit in code boxes
 * with a copy button. */

function Block({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#EEF1F4] py-5 first:border-t-0">
      <h4 className="flex items-center gap-2 text-[13px] font-semibold text-[#364658]">
        {title}
        {count !== undefined && <span className="rounded-full bg-[#EEF2F6] px-1.5 py-px text-[11px] font-semibold tabular-nums text-[#64748B]">{count}</span>}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function CodeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="group/code relative mt-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]">
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value).then(() => toast.success(`${label} copied`), () => {}); }}
        title={`Copy ${label.toLowerCase()}`}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#7B8FA5] opacity-0 transition-opacity hover:text-[#3D8BD0] group-hover/code:opacity-100 focus:opacity-100"
      ><Copy size={13} /></button>
      <pre className="overflow-x-auto whitespace-pre-wrap px-3.5 py-3 pr-12 font-mono text-[12px] leading-[1.65] text-[#364658]">{value}</pre>
    </div>
  );
}

function RulePageBody({ rule }: { rule: ComplianceRule }) {
  const text = 'text-[13px] leading-[1.65] text-[#364658]';
  return (
    <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-[#E5E7EB] px-5">
      <Block title="Description"><p className={text}>{rule.description}</p></Block>
      <Block title="Rationale"><p className={text}>{rule.rationale}</p></Block>
      <Block title="Audit">
        <p className={text}>{rule.audit}</p>
        <CodeBox value={rule.command} label="Command" />
      </Block>
      <Block title="Rule Condition" count={rule.conditions.length}>
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <table className="w-full table-fixed">
            <colgroup><col className="w-[44px]" /><col /><col className="w-[150px]" /><col className="w-[150px]" /></colgroup>
            <thead><tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">{['#', 'Result Pattern', 'Occurrence', 'Condition'].map((h) => <th key={h} className="px-3 py-2 text-left text-[12px] font-semibold text-[#364658]">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {rule.conditions.map((c, i) => (
                <tr key={i}>
                  <td className="px-3 py-2.5 text-[12px] tabular-nums text-[#9CA3AF]">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[#364658]">{c.pattern}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[#364658]">{c.occurrence}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[#364658]">{c.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
      <Block title="Remediation">
        <p className={text}>{rule.remediation}</p>
        <CodeBox value={rule.remediationValue} label="Value" />
      </Block>
      <Block title="References" count={rule.references.length}>
        <ol className="space-y-1">
          {rule.references.map((r, i) => (
            <li key={r} className={`flex items-start gap-2.5 ${text}`}>
              <span className="w-4 flex-shrink-0 text-[12px] tabular-nums text-[#9CA3AF]">{i + 1}.</span>
              <span className="min-w-0 break-words">{r}</span>
            </li>
          ))}
        </ol>
      </Block>
      {/* One Controls section — each version a row in it, its version tag on the left. */}
      <Block title="CIS Controls" count={rule.controls.length}>
        <div className="space-y-3">
          {rule.controls.map((c) => (
            <div key={c.version} className="flex items-start gap-3">
              <span className="mt-0.5 w-[34px] flex-shrink-0 rounded-sm bg-[#F1F5F9] py-0.5 text-center text-[11px] font-semibold text-[#475569]">{c.version}</span>
              <div className="min-w-0">
                {c.safeguard ? (
                  <>
                    <p className="text-[13px] font-medium leading-[1.55] text-[#364658]">{c.safeguard}</p>
                    {c.text && <p className="mt-0.5 text-[13px] leading-[1.65] text-[#64748B]">{c.text}</p>}
                  </>
                ) : <p className="text-[13px] text-[#64748B]">Explicitly Not Mapped</p>}
              </div>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}

/** The rule's metadata tabs (Summary · Audit · Remediation · References · Controls) and
 *  their content, without a panel around them — so a panel that drills into a rule can show it
 *  in place, under its own header. `lead` sits above the tabs (the result on one endpoint, or
 *  the endpoints a rule passed / failed on). There is no Results tab: results are never a tab. */
export function RuleDetailBody({ rule, usedIn, lead, firstTab }: {
  rule: ComplianceRule;
  usedIn: string[];
  lead?: React.ReactNode;
  firstTab?: RuleFirstTab;
}) {
  const start: RuleTab = firstTab ? 'first' : 'summary';
  const [tab, setTab] = useState<RuleTab>(start);
  useEffect(() => { setTab(start); }, [rule.id]);
  const tabs: [RuleTab, string][] = firstTab ? [['first', firstTab.label], ...RULE_TABS] : RULE_TABS;

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
          {tab === 'first' && firstTab?.node}
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
                {/* Column titles once, then one row per condition. */}
                <div className="mt-2 grid grid-cols-[24px_1fr_160px_160px] gap-3">
                  <span />
                  <div className={fieldLabel}>Result Pattern</div>
                  <div className={fieldLabel}>Occurrence</div>
                  <div className={fieldLabel}>Condition</div>
                </div>
                <div className="mt-1 space-y-2">
                  {rule.conditions.map((c, i) => (
                    <div key={i} className="grid grid-cols-[24px_1fr_160px_160px] items-center gap-3">
                      <span className="text-[12px] text-[#9CA3AF]">{i + 1}</span>
                      <div className={`${readBox} !mt-0 font-mono text-[12px]`}>{c.pattern}</div>
                      <div className={`${readBox} !mt-0`}>{c.occurrence}</div>
                      <div className={`${readBox} !mt-0`}>{c.condition}</div>
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
                /* The version is the label; the safeguard sits in a quiet filled box under it. */
                <div key={c.version}>
                  <div className={fieldLabel}>Controls Version: {c.version}</div>
                  <div className="mt-1.5 rounded-lg bg-[#F6F9FC] px-4 py-3">
                    {c.safeguard ? (
                      <>
                        <div className="text-[13px] font-semibold text-[#364658]">{c.safeguard}</div>
                        {c.text && <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">{c.text}</p>}
                      </>
                    ) : (
                      <div className="text-[13px] text-[#64748B]">Explicitly Not Mapped</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
    </>
  );
}
