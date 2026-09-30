import { useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, ChevronsRight, CornerDownRight, History, ListOrdered, Plus, Split, X } from 'lucide-react';
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
function NoConflictsArt() {
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
  onJump, onHover, onOpenRule, onCollapse, onCloseDialog, bare = false, hideHead = false, only,
}: {
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
  const [groupBy, setGroupBy] = useState<'rule' | 'field'>('rule');
  if (only) tab = only;

  const byRule = conflicts.reduce<Record<string, RuleConflict[]>>((m, c) => ((m[c.other.id] ||= []).push(c), m), {});
  const byField = conflicts.reduce<Record<string, RuleConflict[]>>((m, c) => ((m[c.fieldId] ||= []).push(c), m), {});

  const tabs: [InsightTab, string, number | null][] = [
    ['conflicts', 'Conflicts', conflicts.length],
    ['similar', 'Similar rules', similar.length],
    ['order', 'Run order', null],
  ];

  /** One conflict, as a diff: this rule's action beside theirs. */
  const diff = (c: RuleConflict, head: 'field' | 'rule') => (
    <div
      key={c.key}
      onMouseEnter={() => onHover(c.actionId)}
      onMouseLeave={() => onHover(null)}
      className="rounded-lg border border-[#EEF2F6] bg-white p-3.5 transition-colors hover:border-[#FCA5A5]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="truncate text-[12px] font-medium text-[#364658]">{head === 'field' ? fieldLabel(c.fieldId) : c.other.name}</span>
        <KindPill kind={c.kind} />
        <button type="button" onClick={() => onJump(c.actionId)} className="ml-auto inline-flex flex-shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#3D8BD0] hover:underline">
          <CornerDownRight size={11} /> Jump to row
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-md bg-[#F5F9FD] px-3 py-2.5">
          <div className="mb-1 text-[10px] font-medium text-[#3D8BD0]">This rule</div>
          <div className="text-[12px] text-[#364658]">{c.mine}</div>
        </div>
        <div className="rounded-md bg-[#FEF6F6] px-3 py-2.5">
          <div className="mb-1 truncate text-[10px] font-medium text-[#DC2626]">{c.other.name}</div>
          <div className="text-[12px] text-[#364658]">{c.theirs}</div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-2 border-t border-[#EEF2F6] pt-3">
        <p className="text-[11px] leading-[1.6] text-[#7B8FA5]">{c.scope} · {c.why}</p>
        <p className="text-[11px] font-medium leading-[1.6] text-[#364658]">{c.outcome}</p>
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (!ready) {
    body = <Empty title="Rule check starts with the trigger" text="Choose when the rule runs. Conflicts, similar rules and run order appear here as you build." />;
  } else if (tab === 'conflicts') {
    body = conflicts.length === 0 ? (
      <Empty art={<NoConflictsArt />} title="No conflicts in this rule"
        text={hasActions ? 'No other rule changes these fields in a different way. The form ends up in one clear state.' : 'Add an action — this is where any clash with another rule shows up.'} />
    ) : (
      <div className="flex flex-col gap-3 p-4">
        <div className="rounded-md border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2">
          <div className="text-[12px] font-medium text-[#BE123C]">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} with {Object.keys(byRule).length} rule{Object.keys(byRule).length > 1 ? 's' : ''}</div>
          <p className="text-[11px] text-[#BE123C]/80">A field can end up in only one state. Resolve these so the form behaves predictably.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#7B8FA5]">Group by</span>
          <div className="pill-track">
            <button type="button" aria-pressed={groupBy === 'rule'} onClick={() => setGroupBy('rule')}>Rule</button>
            <button type="button" aria-pressed={groupBy === 'field'} onClick={() => setGroupBy('field')}>Field</button>
          </div>
        </div>
        {groupBy === 'rule'
          ? Object.values(byRule).map((cs) => (
            <div key={cs[0].other.id} className="rounded-lg bg-[#F9FAFB] p-3">
              <div className="mb-3 flex items-center gap-2 px-0.5">
                <span className="truncate text-[12px] font-semibold text-[#364658]">{cs[0].other.name}</span>
                <span className="flex-shrink-0 text-[11px] text-[#7B8FA5]">{cs.length} conflict{cs.length > 1 ? 's' : ''}</span>
                <button type="button" onClick={() => onOpenRule(cs[0].other.id)} className="ml-auto inline-flex flex-shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#3D8BD0] hover:underline">
                  Open rule <ArrowUpRight size={11} />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">{cs.map((c) => diff(c, 'field'))}</div>
            </div>
          ))
          : Object.entries(byField).map(([fid, cs]) => (
            <div key={fid} className="rounded-lg bg-[#F9FAFB] p-3">
              <div className="mb-3 flex items-center gap-2 px-0.5">
                <span className="text-[12px] font-semibold text-[#364658]">{fieldLabel(fid)}</span>
                <span className="text-[11px] text-[#7B8FA5]">{cs.length} conflict{cs.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col gap-2.5">{cs.map((c) => diff(c, 'rule'))}</div>
            </div>
          ))}
      </div>
    );
  } else if (tab === 'similar') {
    body = similar.length === 0 ? (
      <Empty title={conditionLines.length ? 'No similar rules' : 'Add a condition to compare'}
        text={conditionLines.length ? 'No other rule uses this trigger and these conditions. This rule is not a duplicate.' : 'Similar rules are ones that already use the same trigger and conditions. Add a condition and they show here.'} />
    ) : (
      <div className="flex flex-col gap-3 p-3">
        <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
          <div className="text-[12px] font-medium text-[#B45309]">{similar.length} rule{similar.length > 1 ? 's' : ''} already use this trigger</div>
          <p className="text-[11px] text-[#B45309]/80">Adding your actions to one of them keeps the same behaviour without a second rule to maintain.</p>
        </div>
        <div className="rounded-lg bg-[#F9FAFB] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Shared trigger &amp; conditions</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#DFE5ED] bg-white px-2 py-0.5 text-[11px] text-[#364658]"><History size={11} />{triggerChips.event}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#DFE5ED] bg-white px-2 py-0.5 text-[11px] text-[#364658]">{triggerChips.execution}</span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {conditionLines.map((l) => <li key={l} className="flex items-center gap-1.5 text-[12px] text-[#364658]"><Split size={11} className="rotate-180 text-[#F58518]" />{l}</li>)}
          </ul>
        </div>
        <SimilarList similar={similar} onOpenRule={onOpenRule} />
      </div>
    );
  } else {
    body = timeline.length <= 1 ? (
      <Empty title={hasActions ? 'No other rule touches these fields' : 'Add an action to see the run order'}
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
        <ListOrdered size={14} className="text-[#7B8FA5]" />
        <span className="text-[13px] font-medium text-[#364658]">Rule check</span>
        <span className="text-[11px] text-[#7B8FA5]">· updates as you build</span>
        {onCollapse && (
          <button type="button" onClick={onCollapse} title="Collapse the rule check" className="ml-auto flex size-7 items-center justify-center rounded-md text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]"><ChevronsRight size={16} /></button>
        )}
        {onCloseDialog && (
          <button type="button" onClick={onCloseDialog} title="Close" className="ml-auto flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
        )}
      </div>}
      {!only && <div className="flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-4">
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
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  );
}

/* Similar rules as a compact, scannable list. Collapsed, a rule is ONE line: name, a match
 * indicator (a dot per action of yours — filled when this rule already does it) and Open rule.
 * Click the line to see the three groups as plain text — what matches, what only that rule does,
 * and what you would add to it. No pills: colour lives only in the small icon of each line. */
function SimilarList({ similar, onOpenRule }: { similar: SimilarRule[]; onOpenRule: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(similar[0]?.rule.id ?? null);
  return (
    <div className="overflow-hidden rounded-lg border border-[#EEF2F6] bg-white">
      {similar.map((s) => {
        const mine = s.common.length + s.missing.length;
        const on = open === s.rule.id;
        const group = (title: string, items: string[], icon: React.ReactNode) => items.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] font-medium text-[#98A2B3]">{title}</div>
            <ul className="space-y-1">
              {items.map((t) => <li key={t} className="flex items-center gap-2 text-[12px] text-[#364658]">{icon}{t}</li>)}
            </ul>
          </div>
        );
        return (
          <div key={s.rule.id} className="border-b border-[#F1F5F9] last:border-b-0">
            <div role="button" tabIndex={0} onClick={() => setOpen(on ? null : s.rule.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(on ? null : s.rule.id); } }}
              className={'flex cursor-pointer items-center px-3 py-2.5 transition-colors ' + (on ? 'bg-[#F7F9FB]' : 'hover:bg-[#FAFBFC]')}>
              <ChevronRight size={14} className={'mr-2 flex-shrink-0 text-[#98A2B3] transition-transform ' + (on ? 'rotate-90' : '')} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1D2A3E]">
                {s.rule.name}{!s.rule.enabled && <span className="ml-1.5 text-[11px] font-normal text-[#98A2B3]">· disabled</span>}
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenRule(s.rule.id); }}
                className="inline-flex w-[72px] flex-shrink-0 items-center justify-end gap-0.5 text-[12px] font-medium text-[#3D8BD0] hover:underline">
                Open <ArrowUpRight size={12} />
              </button>
            </div>
            {on && (
              <div className="grid grid-cols-3 gap-5 bg-[#F7F9FB] px-3 pb-3.5 pl-9 pt-1">
                {group('Matches your rule', s.common, <Check size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#12B76A]" />)}
                {group('Only in this rule', s.others, <span className="size-1 flex-shrink-0 rounded-full bg-[#98A2B3]" />)}
                {group('Your actions it lacks', s.missing, <Plus size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#3D8BD0]" />)}
                {mine === 0 && s.others.length === 0 && <p className="text-[12px] text-[#98A2B3]">No actions to compare yet.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const eventLabel = (v: string) => EVENT_OPTIONS.find((e) => e.value === v)?.label ?? v;
