import { useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, ChevronsRight, CornerDownRight, History, ListOrdered, Plus, Split, X } from 'lucide-react';
import { FormRuleConflictReview } from './FormRuleConflictReview';
import { CommonTriggerCard, type CondGroupView } from './FormRuleCommon';
import type { FormRule } from './formRuleData';
import type { ConflictKind, RuleConflict, SimilarRule, TimelineEntry } from './formRuleEngine';
import { EVENT_OPTIONS } from './formRuleData';

/* The right 35% of the rule editor — the DETAIL behind what the builder flags inline. The builder
 * says "this row clashes" where the row is; this rail says with WHOM, how the two rules differ,
 * and who wins today. Three tabs: Conflicts · Similar rules · Run order. */

export type InsightTab = 'conflicts' | 'similar' | 'order';

export const KIND_TONE: Record<ConflictKind, { fg: string; bg: string; hint: string }> = {
  Opposite: { fg: '#DC2626', bg: '#FEF2F2', hint: 'The two rules do the reverse to this field' },
  Override: { fg: '#C2410C', bg: '#FFF4E5', hint: 'Both set this field — whichever runs last wins' },
  Blocking: { fg: '#9F1239', bg: '#FFE4E6', hint: 'Mandatory but hidden or read-only — the form can’t be submitted' },
};

export function KindPill({ kind }: { kind: ConflictKind }) {
  const t = KIND_TONE[kind];
  return <span title={t.hint} className="inline-flex flex-shrink-0 cursor-help items-center rounded-sm px-1.5 text-[10px] font-medium leading-4" style={{ color: t.fg, backgroundColor: t.bg }}>{kind}</span>;
}

/** Two rule cards that line up, joined by a green check — "these rules agree". */
export function NoConflictsArt() {
  return (
    <svg width="148" height="96" viewBox="0 0 148 96" fill="none" aria-hidden>
      <ellipse cx="74" cy="88" rx="54" ry="5" fill="#EEF2F6" />
      <rect x="14" y="14" width="64" height="52" rx="8" fill="#fff" stroke="#DFE5ED" />
      <rect x="24" y="25" width="30" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="24" y="36" width="44" height="4" rx="2" fill="#EEF2F6" />
      <rect x="24" y="45" width="36" height="4" rx="2" fill="#EEF2F6" />
      <rect x="24" y="54" width="18" height="6" rx="3" fill="#E2EDF5" />
      <rect x="70" y="26" width="64" height="52" rx="8" fill="#fff" stroke="#DFE5ED" />
      <rect x="80" y="37" width="30" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="80" y="48" width="44" height="4" rx="2" fill="#EEF2F6" />
      <rect x="80" y="57" width="36" height="4" rx="2" fill="#EEF2F6" />
      <rect x="80" y="66" width="18" height="6" rx="3" fill="#F3F9EC" />
      <circle cx="74" cy="46" r="13" fill="#F3F9EC" stroke="#fff" strokeWidth="3" />
      <path d="M68 46.5l4 4 8-8.5" stroke="#89C540" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="126" cy="14" r="2.5" fill="#89C540" opacity=".5" />
      <circle cx="10" cy="72" r="2" fill="#3D8BD0" opacity=".35" />
      <path d="M118 88h8M122 84v8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** A rule card with its double stacked behind it, and a magnifier over the two —
 *  "we looked for a rule that already does this". Same card vocabulary as NoConflictsArt. */
export function SimilarRulesArt() {
  return (
    <svg width="148" height="96" viewBox="0 0 148 96" fill="none" aria-hidden>
      <ellipse cx="74" cy="88" rx="54" ry="5" fill="#EEF2F6" />
      <rect x="40" y="10" width="64" height="52" rx="8" fill="#F9FAFB" stroke="#DFE5ED" />
      <rect x="50" y="21" width="30" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="50" y="32" width="44" height="4" rx="2" fill="#F1F5F9" />
      <rect x="28" y="22" width="64" height="52" rx="8" fill="#fff" stroke="#DFE5ED" />
      <rect x="38" y="33" width="30" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="38" y="44" width="44" height="4" rx="2" fill="#EEF2F6" />
      <rect x="38" y="53" width="36" height="4" rx="2" fill="#EEF2F6" />
      <rect x="38" y="62" width="18" height="6" rx="3" fill="#FFF4E5" />
      <circle cx="100" cy="54" r="14" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2.4" />
      <path d="M94 54h12M100 48v12" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <path d="M110 64l9 9" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="122" cy="16" r="2.5" fill="#F59E0B" opacity=".45" />
      <circle cx="16" cy="40" r="2" fill="#3D8BD0" opacity=".35" />
      <path d="M126 32h8M130 28v8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Three rules on the run-order rail, numbered top to bottom; this rule is the blue one, and the
 *  arrow says which way they run. Same card vocabulary as the other two illustrations. */
function RunOrderArt() {
  const row = (y: number, n: number, self: boolean) => (
    <g key={n}>
      <circle cx="34" cy={y + 9} r="8" fill={self ? '#3D8BD0' : '#EEF2F6'} stroke="#fff" strokeWidth="2" />
      <text x="34" y={y + 12.5} textAnchor="middle" fontSize="9" fontWeight="600" fill={self ? '#fff' : '#64748B'} fontFamily="Inter, sans-serif">{n}</text>
      <rect x="48" y={y} width="72" height="18" rx="5" fill={self ? '#F5F9FD' : '#fff'} stroke={self ? '#CFE3F5' : '#DFE5ED'} />
      <rect x="56" y={y + 7} width={self ? 34 : 28} height="4" rx="2" fill={self ? '#9CC4E8' : '#CBD5E1'} />
      <rect x={self ? 94 : 88} y={y + 7} width="18" height="4" rx="2" fill={self ? '#E2EDF5' : '#EEF2F6'} />
    </g>
  );
  return (
    <svg width="148" height="96" viewBox="0 0 148 96" fill="none" aria-hidden>
      <ellipse cx="74" cy="88" rx="54" ry="5" fill="#EEF2F6" />
      <path d="M34 18v50" stroke="#DFE5ED" strokeWidth="2" />
      {row(9, 1, false)}
      {row(33, 2, true)}
      {row(57, 3, false)}
      <path d="M132 22v40" stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M128 57l4 5 4-5" stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="24" r="2" fill="#3D8BD0" opacity=".35" />
      <circle cx="138" cy="12" r="2.5" fill="#89C540" opacity=".45" />
    </svg>
  );
}

function Empty({ art, title, text }: { art?: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {art}
      <div className="mt-3 text-[13px] font-medium text-[#364658]">{title}</div>
      <p className="mt-1 max-w-[260px] text-[12px] leading-[1.55] text-[#7B8FA5]">{text}</p>
    </div>
  );
}

export function FormRuleInsights({
  ready, hasActions, conflicts, similar, timeline, tab, onTab, triggerChips, conditionLines, fieldLabel,
  onJump, onHover, onOpenRule, onCollapse, onCloseDialog, bare = false, hideHead = false, only, rules = [], pillTabs = false, noTitleIcon = false, focus, common,
}: {
  /** Bring this field forward in the conflicts list (an action row's warning asked about it). */
  focus?: { field: string; n: number } | null;
  /** What every similar rule shares with this one — the Common trigger, conditions & actions card. */
  common?: { applies: string; groups: CondGroupView[]; actions: string[] };
  /** Drop the list glyph before "Rule check". */
  noTitleIcon?: boolean;
  /** The ticket Relations tab's bordered pills instead of underline tabs — for a panel that already has a tab row above. */
  pillTabs?: boolean;
  /** Every rule, in run order — the conflict list numbers and names them. */
  rules?: FormRule[];
  /** Show just this tab's content, no header or tab strip — the host has its own tabs. */
  only?: InsightTab;
  /** Drop the "Rule check" title row — the host already names it (the Problems dock). */
  hideHead?: boolean;
  /** Folds the rail to its edge strip. */
  onCollapse?: () => void;
  /** Closes it when it is shown in a dialog. */
  onCloseDialog?: () => void;
  /** No left border — it is inside a dialog, not beside the builder. */
  bare?: boolean;
  ready: boolean;
  hasActions: boolean;
  conflicts: RuleConflict[];
  similar: SimilarRule[];
  timeline: TimelineEntry[];
  tab: InsightTab;
  onTab: (t: InsightTab) => void;
  triggerChips: { event: string; execution: string };
  conditionLines: string[];
  fieldLabel: (id: string) => string;
  onJump: (actionId: string) => void;
  onHover: (actionId: string | null) => void;
  onOpenRule: (id: string) => void;
}) {
  if (only) tab = only;

  const tabs: [InsightTab, string, number | null][] = [
    ['conflicts', 'Conflicts', conflicts.length],
    ['similar', 'Similar rules', similar.length],
    /* Run order is withdrawn from the rail (6 Oct 2026, Zeni); its body below stays for the hidden layouts. */
  ];

  let body: React.ReactNode;
  if (!ready) {
    body = <Empty art={tab === 'conflicts' ? <NoConflictsArt /> : tab === 'similar' ? <SimilarRulesArt /> : <RunOrderArt />}
      title="Rule check starts with the trigger" text="Choose when the rule runs. Conflicts, similar rules and run order appear here as you build." />;
  } else if (tab === 'conflicts') {
    body = conflicts.length === 0 ? (
      <Empty art={<NoConflictsArt />} title="No conflicts in this rule"
        text={hasActions ? 'No other rule changes these fields in a different way. The form ends up in one clear state.' : 'Add an action — this is where any clash with another rule shows up.'} />
    ) : null;
  } else if (tab === 'similar') {
    body = similar.length === 0 ? (
      <Empty art={<SimilarRulesArt />} title={conditionLines.length ? 'No similar rules' : 'Add a condition to compare'}
        text={conditionLines.length ? 'No other rule uses this trigger and these conditions. This rule is not a duplicate.' : 'Similar rules are ones that already use the same trigger and conditions. Add a condition and they show here.'} />
    ) : (
      <div className="flex flex-col gap-3 p-3">
        <CommonTriggerCard count={similar.length} eventText={triggerChips.event} execution={triggerChips.execution}
          applies={common?.applies ?? ''} actions={common?.actions ?? []}
          groups={common?.groups ?? (conditionLines.length ? [{ join: 'And', conds: conditionLines.map((t) => ({ join: 'And' as const, text: t })) }] : [])} />
        <SimilarList similar={similar} onOpenRule={onOpenRule} />
      </div>
    );
  } else {
    body = timeline.length <= 1 ? (
      <Empty art={<RunOrderArt />} title={hasActions ? 'No other rule touches these fields' : 'Add an action to see the run order'}
        text={hasActions ? 'Only this rule changes these fields, so it decides them on its own.' : 'Rules run top to bottom. This view lines up every rule that touches the same fields.'} />
    ) : (
      <div className="p-4">
        <p className="mb-3 text-[11px] leading-[1.5] text-[#7B8FA5]">Rules run top to bottom; when two set the same field, the later one wins. Only rules touching this rule's fields are shown.</p>
        <ol className="relative">
          {timeline.map((t, i) => (
            <li key={`${t.rule.id ?? 'self'}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
              {i < timeline.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-[#DFE5ED]" />}
              <span className={`z-[1] flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${t.isSelf ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>{t.order}</span>
              <div className={`min-w-0 flex-1 rounded-md p-2 ${t.isSelf ? 'bg-[#F5F9FD] ring-1 ring-[#CFE3F5]' : 'bg-[#F9FAFB]'}`}>
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-medium text-[#364658]">{t.isSelf ? (t.rule.name || 'This rule') : t.rule.name}</span>
                  {t.isSelf && <span className="flex-shrink-0 rounded-sm bg-[#3D8BD0] px-1.5 text-[10px] font-medium leading-4 text-white">This rule</span>}
                  {!t.isSelf && t.rule.id && (
                    <button type="button" onClick={() => onOpenRule(t.rule.id!)} className="ml-auto flex-shrink-0 text-[#3D8BD0]" title="Open rule"><ArrowUpRight size={12} /></button>
                  )}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {t.lines.map((l) => (
                    <li key={l.text} className={`flex items-center gap-1.5 text-[12px] ${l.clash ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                      <span className={`size-1.5 flex-shrink-0 rounded-full ${l.clash ? 'bg-[#DC2626]' : 'bg-[#CBD5E1]'}`} />{l.text}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <aside className={`flex h-full min-h-0 flex-col bg-white ${bare ? '' : 'border-l border-[#DFE5ED]'}`}>
      {!hideHead && !only && <div className="flex flex-shrink-0 items-center gap-2 px-4 pt-3">
        {/* Title only — no list glyph, no "updates as you build" note (6 Oct 2026, Zeni). */}
        <span className="text-[13px] font-medium text-[#364658]">Rule check</span>
        {onCollapse && (
          <button type="button" onClick={onCollapse} title="Collapse the rule check" className="ml-auto flex size-7 items-center justify-center rounded-md text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]"><ChevronsRight size={16} /></button>
        )}
        {onCloseDialog && (
          <button type="button" onClick={onCloseDialog} title="Close" className="ml-auto flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
        )}
      </div>}
      {!only && pillTabs && <div className="flex flex-shrink-0 flex-wrap gap-2 px-4 pt-3">
        {tabs.map(([id, text, n]) => (
          <button key={id} type="button" onClick={() => onTab(id)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'}`}>
            {text}
            {n !== null && ready && <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${tab === id ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>{n}</span>}
          </button>
        ))}
      </div>}
      {!only && !pillTabs && <div className="flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-4">
        {tabs.map(([id, text, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors ${tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
          >
            {text}
            {n !== null && ready && (
              <span className={`rounded-sm px-1.5 text-[11px] font-semibold ${n > 0 ? (id === 'conflicts' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FFF4E5] text-[#B45309]') : 'bg-[#F1F5F9] text-[#64748B]'}`}>{n}</span>
            )}
          </button>
        ))}
      </div>}
      {ready && tab === 'conflicts' && conflicts.length > 0
        ? <div className="flex min-h-0 flex-1 flex-col pt-3">
            <FormRuleConflictReview accordion conflicts={conflicts} rules={rules} fieldLabel={fieldLabel}
              onJump={onJump} onOpenRule={onOpenRule} currentExecution={triggerChips.execution} focus={focus} />
          </div>
        : <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>}
    </aside>
  );
}

/* Similar rules as a compact, scannable list. Collapsed, a rule is ONE line: name, a match
 * indicator (a dot per action of yours — filled when this rule already does it) and Open rule.
 * Click the line to see the three groups as plain text — what matches, what only that rule does,
 * and what you would add to it. No pills: colour lives only in the small icon of each line. */
function SimilarList({ similar, onOpenRule }: { similar: SimilarRule[]; onOpenRule: (id: string) => void }) {
  /* The conflicts list's accordion cards: one card per rule, a light header, any number open at once
     (the first starts open). */
  const [open, setOpen] = useState<string[]>(similar[0] ? [similar[0].rule.id] : []);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  return (
    <div className="flex flex-col gap-3">
      {similar.map((s) => {
        const on = open.includes(s.rule.id);
        const group = (title: string, items: string[], icon: React.ReactNode) => (
          <div>
            <div className="mb-1 text-[11px] font-medium text-[#98A2B3]">{title}</div>
            {items.length > 0
              ? <ul className="space-y-1">{items.map((t) => <li key={t} className="flex items-center gap-2 text-[12px] text-[#364658]">{icon}{t}</li>)}</ul>
              : <p className="text-[12px] text-[#98A2B3]">None</p>}
          </div>
        );
        return (
          <div key={s.rule.id} className="group/sim rounded-lg border border-[#DFE5ED] bg-white">
            <div role="button" tabIndex={0} onClick={() => toggle(s.rule.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(s.rule.id); } }}
              className={'flex h-9 cursor-pointer items-center gap-2.5 bg-[#F6F9FC] px-3 transition-colors hover:bg-[#EEF3F8] ' + (on ? 'rounded-t-lg border-b border-[#DFE5ED]' : 'rounded-lg')}>
              <ChevronRight size={15} className={'flex-shrink-0 text-[#64748B] transition-transform ' + (on ? 'rotate-90' : '')} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1D2A3E]">
                {s.rule.name}{!s.rule.enabled && <span className="ml-1.5 text-[11px] font-normal text-[#98A2B3]">· disabled</span>}
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenRule(s.rule.id); }}
                className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] opacity-0 transition-opacity hover:underline focus:opacity-100 group-hover/sim:opacity-100">
                Open rule <ArrowUpRight size={12} />
              </button>
            </div>
            {on && (
              <div className="flex flex-col gap-3 p-3">
                {group('Matches your rule', s.common, <Check size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#12B76A]" />)}
                {group('Its other actions', s.others, <span className="size-1 flex-shrink-0 rounded-full bg-[#98A2B3]" />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const eventLabel = (v: string) => EVENT_OPTIONS.find((e) => e.value === v)?.label ?? v;
