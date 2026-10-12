import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Info, Lightbulb, Plus, Search, X } from 'lucide-react';
import type { FormRule } from './formRuleData';
import type { ConflictKind, RuleConflict, SimilarRule } from './formRuleEngine';
import { KIND_TONE, NoConflictsArt, SimilarRulesArt, eventLabel } from './FormRuleInsights';
import { FormRuleHelpV4 } from './FormRuleHelpV4';
import { RuleCheckIntro } from './FormRuleRelatedView';
import { RESOLVE_STEPS } from './FormRuleConflictReview';
import { CommonTriggerCard, type CondGroupView } from './FormRuleCommon';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/**
 * V4's right panel (Zeni, 9 Oct 2026): tabs **Help guide · Conflicts · Similar rules**.
 *
 * The conflicts and similar-rules tabs are a MASTER–DETAIL pair shown TOGETHER — the list of rules
 * (or fields) on the left of the panel, the selected one's detail beside it — so every clashing rule
 * stays in view while one is read. It replaces V1's accordions, where opening one rule pushed the
 * others off screen and every rule's detail competed for the same column.
 *
 * ⚠️ Search matches rule names AND field names, in both views; a match is highlighted in the list
 * and in the detail. When the panel is narrower than 400px the list stacks ABOVE the detail.
 */

export type CheckTab = 'guide' | 'conflicts' | 'similar';

const norm = (s: string) => s.toLowerCase();
/** Wraps the first match of `q` in a soft highlight. */
function Hl({ text, q }: { text: string; q: string }) {
  const i = q ? norm(text).indexOf(norm(q)) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded-sm bg-[#FEF3C7] px-px text-inherit">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

const CTA = 'inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline';

function KindTag({ kind }: { kind: ConflictKind }) {
  const t = KIND_TONE[kind];
  return <span title={t.hint} className="flex-shrink-0 rounded-sm px-1.5 py-px text-[11px] font-medium" style={{ color: t.fg, background: t.bg }}>{kind}</span>;
}

/** The two sides of one clash, one per line: what YOUR rule does, what the other one does. */
function Sides({ mine, theirs, theirsLabel = 'Conflicting' }: { mine: string; theirs: string; theirsLabel?: string }) {
  return (
    <div className="mt-2 grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px]">
      <span className="flex items-center gap-1.5 text-[#64748B]"><span className="size-1.5 rounded-full bg-[#3D8BD0]" />Current</span>
      <span className="text-[#1D2A3E]">{mine}</span>
      <span className="flex items-center gap-1.5 text-[#64748B]"><span className="size-1.5 rounded-full bg-[#DC2626]" />{theirsLabel}</span>
      <span className="text-[#1D2A3E]">{theirs}</span>
    </div>
  );
}

function ruleMeta(r: FormRule) {
  return [eventLabel(r.event), r.execution, r.applies === 'Everyone' ? 'Everyone' : r.applies + ' only'].join(' · ');
}

/** List + detail, side by side (stacked when narrow). */
/* The list is a grey panel with its OWN search at the top and the rules as cards on it — the selected
   one a white card (Zeni's reference, 9 Oct 2026) — not rows split by dividers. */
function Split({ list, detail, search }: { list: React.ReactNode; detail: React.ReactNode; search: React.ReactNode }) {
  return (
    <div className="@container flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3 @[400px]:flex-row">
        <div className="flex max-h-[220px] flex-shrink-0 flex-col rounded-md bg-[#F4F6FA] p-2 @[400px]:max-h-none @[400px]:w-[184px]">
          {search}
          <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">{list}</ul>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-6 pr-1 [&>h3:first-child]:-mt-[3px] [&>div:first-child]:-mt-[3px]">{detail}</div>
      </div>
    </div>
  );
}

/* A name is ONE line, cut to the list's width; the full name shows in an INSTANT tooltip — but only
   when it was actually cut, so a name you can already read gets no tooltip. */
function Row({ on, title, sub, n, tone, q, onClick }: { on: boolean; title: string; sub: string; n?: number; tone: 'red' | 'amber'; q: string; onClick: () => void }) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState(false);
  const cut = () => { const el = nameRef.current; return !!el && el.scrollWidth > el.clientWidth + 1; };
  return (
    <li>
      <Tooltip delayDuration={0} open={tip} onOpenChange={(o) => setTip(o && cut())}>
      <TooltipTrigger asChild>
      <button type="button" onClick={onClick} aria-current={on || undefined} aria-label={title}
        className={'block w-full rounded-md px-2.5 py-2 text-left transition-[background-color,box-shadow] ' + (on ? 'bg-white shadow-[0_1px_3px_rgba(15,23,42,0.10)]' : 'hover:bg-white/60')}>
        <span ref={nameRef} className="block truncate text-[13px] font-medium leading-snug text-[#1D2A3E]"><Hl text={title} q={q} /></span>
        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#64748B]">
          <span className={'size-1.5 flex-shrink-0 rounded-full ' + (tone === 'red' ? 'bg-[#DC2626]' : 'bg-[#F59E0B]')} />
          <span className="min-w-0 truncate">{n !== undefined ? n + ' · ' : ''}{sub}</span>
        </span>
      </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[280px] text-wrap">{title}</TooltipContent>
      </Tooltip>
    </li>
  );
}

function SearchBox({ q, setQ, placeholder }: { q: string; setQ: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-8 w-full min-w-0 flex-shrink-0 items-center gap-2 rounded border border-[#DFE5ED] bg-white px-2.5 focus-within:border-[#3D8BD0]">
      <Search size={14} className="flex-shrink-0 text-[#98A2B3]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#1D2A3E] outline-none placeholder:text-[#98A2B3]" />
      {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="flex size-5 items-center justify-center rounded text-[#98A2B3] hover:bg-[#F1F5F9]"><X size={13} /></button>}
    </label>
  );
}

/* Nothing found: the SAME illustrated empty state the other layouts' Rule check used (V1's rail —
   NoConflictsArt / SimilarRulesArt), centred in the tab. */
function ArtEmpty({ art, title, text }: { art: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-10 text-center">
      {art}
      <div className="mt-3 text-[13px] font-medium text-[#364658]">{title}</div>
      <p className="mt-1 max-w-[260px] text-[12px] leading-[1.55] text-[#7B8FA5]">{text}</p>
    </div>
  );
}

export function FormRuleCheckPanel({ tab, onTab, ready, conflicts, similar, fieldLabel, onOpenRule, onWatch, focus, common }: {
  /** What your rule and every similar rule share — drawn as V2's "Common trigger, conditions & actions" card. */
  common: { eventText: string; execution: string; applies: string; groups: CondGroupView[]; actions: string[] };
  tab: CheckTab;
  onTab: (t: CheckTab) => void;
  ready: boolean;
  conflicts: RuleConflict[];
  similar: SimilarRule[];
  fieldLabel: (id: string) => string;
  onOpenRule: (id: string) => void;
  onWatch: () => void;
  /** An action row's ⚠ asks for this field — the panel switches to By field and selects it. */
  focus?: { field: string; n: number } | null;
}) {
  const [mode, setMode] = useState<'rule' | 'field'>('rule');
  const [q, setQ] = useState('');
  const [selRule, setSelRule] = useState<string | null>(null);
  const [selField, setSelField] = useState<string | null>(null);
  const [selSim, setSelSim] = useState<string | null>(null);
  const [sq, setSq] = useState('');
  /* "How do I resolve these conflicts?" replaces the conflicts view with its steps (a way back on top);
     the ⓘ beside it opens the "what is a conflict" card. */
  const [resolveOpen, setResolveOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!focus) return;
    onTab('conflicts'); setMode('field'); setSelField(focus.field); setQ('');
  }, [focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const phrase = (text: string, fid: string) => { const l = fieldLabel(fid); return text.replace(l, 'the ' + l.toLowerCase()); };
  const has = (s: string) => !q || norm(s).includes(norm(q));

  /* ── the two groupings of one list of clashes ── */
  const byRule = useMemo(() => {
    const m = new Map<string, { rule: FormRule; items: RuleConflict[] }>();
    conflicts.forEach((x) => { const g = m.get(x.other.id) ?? { rule: x.other, items: [] }; g.items.push(x); m.set(x.other.id, g); });
    return [...m.values()].sort((a, b) => b.items.length - a.items.length);
  }, [conflicts]);
  const byField = useMemo(() => {
    const m = new Map<string, RuleConflict[]>();
    conflicts.forEach((x) => m.set(x.fieldId, [...(m.get(x.fieldId) ?? []), x]));
    return [...m.entries()].map(([id, items]) => ({ id, label: fieldLabel(id), items })).sort((a, b) => b.items.length - a.items.length);
  }, [conflicts, fieldLabel]);

  const rulesShown = byRule.filter((g) => has(g.rule.name) || g.items.some((x) => has(fieldLabel(x.fieldId))));
  const fieldsShown = byField.filter((g) => has(g.label) || g.items.some((x) => has(x.other.name)));
  const curRule = rulesShown.find((g) => g.rule.id === selRule) ?? rulesShown[0];
  const curField = fieldsShown.find((g) => g.id === selField) ?? fieldsShown[0];

  const simShown = similar.filter((s) => !sq || norm(s.rule.name).includes(norm(sq)) || [...s.common, ...s.others].some((a) => norm(a).includes(norm(sq))));
  const curSim = simShown.find((s) => s.rule.id === selSim) ?? simShown[0];

  const notReady = (t: 'conflicts' | 'similar') => <ArtEmpty art={t === 'conflicts' ? <NoConflictsArt /> : <SimilarRulesArt />}
    title="Rule check starts with the trigger" text="Choose when the rule runs. Conflicts and similar rules appear here as you build." />;
  const hasActions = common.actions.length > 0;
  const hasConds = common.groups.length > 0;
  const noMatch = (what: string) => <li className="px-1.5 py-2 text-[12px] text-[#7B8FA5]">No {what} match “{q || sq}”.</li>;

  /* ── tabs ── */
  const tabs: { id: CheckTab; label: string; n?: number; tone?: 'red' | 'amber' }[] = [
    { id: 'guide', label: 'Help guide' },
    { id: 'conflicts', label: 'Conflicts', n: ready ? conflicts.length : 0, tone: 'red' },
    { id: 'similar', label: 'Similar rules', n: ready ? similar.length : 0, tone: 'amber' },
  ];

  return (
    <div className="relative flex h-full min-h-0 flex-col border-l border-[#DFE5ED] bg-white">
      <div className="flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-4">
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => onTab(t.id)} aria-selected={on} role="tab"
              className={'flex items-center gap-1.5 border-b-2 px-2 py-3 text-[13px] transition-colors ' + (on ? 'border-[#3D8BD0] font-medium text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]')}>
              {t.label}
              {t.n !== undefined && (
                <span className={'rounded-full px-1.5 text-[11px] font-semibold tabular-nums ' + (t.n === 0 ? 'bg-[#F1F5F9] text-[#98A2B3]' : t.tone === 'red' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FFF7E6] text-[#B45309]')}>{t.n}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'guide' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
          {/* Cards look only (Zeni, 9 Oct 2026) — the Minimal | Cards switch is gone; Minimal stays V1's Help guide tab. */}
          <FormRuleHelpV4 onWatch={onWatch} />
        </div>
      )}

      {tab === 'conflicts' && ready && conflicts.length > 0 && resolveOpen && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EEF2F6] px-3 py-2.5">
            <button type="button" onClick={() => setResolveOpen(false)} title="Back to the conflicts"
              className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><ChevronLeft size={16} className="text-[#64748B]" /></button>
            <h3 className="min-w-0 flex-1 text-[14px] font-semibold text-[#1D2A3E]">Resolving conflicts</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3">
            <p className="text-[12.5px] leading-[1.6] text-[#64748B]">A conflict happens when two rules act on the same field in opposite ways and both run at the same time. These are the usual ways to sort one out — you rarely need more than one.</p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {RESOLVE_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3 rounded-lg border border-[#E8EDF3] bg-white px-3.5 py-3">
                  <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-[12px] font-semibold text-[#3D8BD0]">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1D2A3E]">{s.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-[1.55] text-[#64748B]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {tab === 'conflicts' && !(ready && conflicts.length > 0 && resolveOpen) && (!ready ? notReady('conflicts') : conflicts.length === 0 ? (
        <ArtEmpty art={<NoConflictsArt />} title="No conflicts in this rule"
          text={hasActions ? 'No other rule changes these fields in a different way. The form ends up in one clear state.' : 'Add an action — this is where any clash with another rule shows up.'} />
      ) : (
        <>
          <div className="flex flex-shrink-0 items-center gap-2 px-3 pt-3">
            <div className="pill-track flex-shrink-0">
              <button type="button" aria-pressed={mode === 'rule'} onClick={() => setMode('rule')}>By rule</button>
              <button type="button" aria-pressed={mode === 'field'} onClick={() => setMode('field')}>By field</button>
            </div>
          </div>
          {mode === 'rule' ? (
            <Split search={<SearchBox q={q} setQ={setQ} placeholder="Search rules" />}
              list={rulesShown.length ? rulesShown.map((g) => {
                const nf = new Set(g.items.map((x) => x.fieldId)).size;
                return <Row key={g.rule.id} on={g === curRule} title={g.rule.name} sub={`${g.items.length} conflict${g.items.length === 1 ? '' : 's'} · ${nf} field${nf === 1 ? '' : 's'}`} tone="red" q={q} onClick={() => setSelRule(g.rule.id)} />;
              }) : noMatch('rules or fields')}
              detail={curRule && (
                <>
                  <div className="flex items-start gap-3">
                    <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#1D2A3E]"><Hl text={curRule.rule.name} q={q} /></h3>
                    <button type="button" onClick={() => onOpenRule(curRule.rule.id)} className={CTA + ' mt-0.5'}>Open rule <ArrowUpRight size={13} /></button>
                  </div>
                  <p className="mt-1 text-[12px] text-[#7B8FA5]">{ruleMeta(curRule.rule)}</p>
                  <div className="mt-4 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Clashes on {curRule.items.length} field{curRule.items.length === 1 ? '' : 's'}</div>
                  <div className="mt-2 flex flex-col gap-2.5">
                    {curRule.items.map((x) => (
                      <div key={x.key} className="rounded-lg border border-[#E8EDF3] bg-[#F8FAFC] px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1D2A3E]"><Hl text={fieldLabel(x.fieldId)} q={q} /></span>
                          <KindTag kind={x.kind} />
                        </div>
                        <Sides mine={phrase(x.mine, x.fieldId)} theirs={phrase(x.theirs, x.fieldId)} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            />
          ) : (
            <Split search={<SearchBox q={q} setQ={setQ} placeholder="Search fields" />}
              list={fieldsShown.length ? fieldsShown.map((g) => {
                const nr = new Set(g.items.map((x) => x.other.id)).size;
                return <Row key={g.id} on={g === curField} title={g.label} sub={`${g.items.length} conflict${g.items.length === 1 ? '' : 's'} · ${nr} rule${nr === 1 ? '' : 's'}`} tone="red" q={q} onClick={() => setSelField(g.id)} />;
              }) : noMatch('fields or rules')}
              detail={curField && (
                <>
                  <h3 className="text-[15px] font-semibold leading-snug text-[#1D2A3E]"><Hl text={curField.label} q={q} /></h3>
                  <p className="mt-1 text-[12px] text-[#7B8FA5]">A field can end up in only one state — these rules disagree about it.</p>
                  <div className="mt-4 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">{curField.items.length} conflicting rule{curField.items.length === 1 ? '' : 's'}</div>
                  <div className="mt-2 flex flex-col gap-2.5">
                    {curField.items.map((x) => (
                      <div key={x.key} className="group rounded-lg border border-[#E8EDF3] bg-[#F8FAFC] px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1D2A3E]"><Hl text={x.other.name} q={q} /></span>
                          <KindTag kind={x.kind} />
                          <button type="button" onClick={() => onOpenRule(x.other.id)} aria-label={'Open ' + x.other.name} title="Open rule"
                            className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#3D8BD0] hover:bg-[#EBF5FF]"><ArrowUpRight size={14} /></button>
                        </div>
                        <Sides mine={phrase(x.mine, x.fieldId)} theirs={phrase(x.theirs, x.fieldId)} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            />
          )}
          {/* V1's foot bar: how to resolve, with the ⓘ for "what is a conflict" on its right. */}
          <div className="flex flex-shrink-0 items-center border-t border-[#EEF2F6]">
            <button type="button" onClick={() => { setResolveOpen(true); setInfoOpen(false); }}
              className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F7F9FB]">
              <Lightbulb size={15} className="flex-shrink-0 text-[#F59E0B]" />
              <span className="truncate">How do I resolve these conflicts?</span>
              <ChevronRight size={15} className="flex-shrink-0 text-[#98A2B3]" />
            </button>
            <button type="button" onClick={() => setInfoOpen((o) => !o)} aria-label="What is a conflict?" title="What is a conflict?"
              className={'mr-2 flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] ' + (infoOpen ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]')}>
              <Info size={16} />
            </button>
          </div>
          {infoOpen && <div className="absolute bottom-[54px] right-3 z-40"><RuleCheckIntro inset kind="conflicts" onClose={() => setInfoOpen(false)} /></div>}
        </>
      ))}

      {tab === 'similar' && (!ready ? notReady('similar') : similar.length === 0 ? (
        <ArtEmpty art={<SimilarRulesArt />} title={hasConds ? 'No similar rules' : 'Add a condition to compare'}
          text={hasConds ? 'No other rule uses this trigger and these conditions. This rule is not a duplicate.' : 'Similar rules are ones that already use the same trigger and conditions. Add a condition and they show here.'} />
      ) : (
        <>
          <div className="flex-shrink-0 px-3 pt-3">
            <CommonTriggerCard count={similar.length} eventText={common.eventText} execution={common.execution}
              applies={common.applies} groups={common.groups} actions={common.actions} />
          </div>
          <Split search={<SearchBox q={sq} setQ={setSq} placeholder="Search rules" />}
            list={simShown.length ? simShown.map((s) => (
              <Row key={s.rule.id} on={s === curSim} title={s.rule.name} sub={`${s.common.length} action${s.common.length === 1 ? " matches" : "s match"} yours`} tone="amber" q={sq} onClick={() => setSelSim(s.rule.id)} />
            )) : noMatch('rules or actions')}
            detail={curSim && (
              <>
                <div className="flex items-start gap-3">
                  <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#1D2A3E]"><Hl text={curSim.rule.name} q={sq} /></h3>
                  <button type="button" onClick={() => onOpenRule(curSim.rule.id)} className={CTA + ' mt-0.5'}>Update this rule <ArrowUpRight size={13} /></button>
                </div>
                <p className="mt-1 text-[12px] text-[#7B8FA5]">{ruleMeta(curSim.rule)}</p>
                {([
                  ['Matches your rule', curSim.common, <Check key="c" size={13} className="mt-[3px] flex-shrink-0 text-[#16A34A]" />],
                  ['Its other actions', curSim.others, <span key="o" className="mt-[7px] size-1 flex-shrink-0 rounded-full bg-[#98A2B3]" />],
                  ['Your actions it lacks', curSim.missing, <Plus key="m" size={13} className="mt-[3px] flex-shrink-0 text-[#3D8BD0]" />],
                ] as [string, string[], React.ReactNode][]).filter(([, l]) => l.length).map(([title, lines, icon]) => (
                  <div key={title} className="mt-4">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">{title} · {lines.length}</div>
                    <ul className="mt-1.5 flex flex-col gap-1.5 rounded-lg border border-[#E8EDF3] bg-[#F8FAFC] px-3.5 py-2.5">
                      {lines.map((l) => <li key={l} className="flex gap-2 text-[12.5px] text-[#1D2A3E]">{icon}<span className="min-w-0"><Hl text={l} q={sq} /></span></li>)}
                    </ul>
                  </div>
                ))}
              </>
            )}
          />
        </>
      ))}
    </div>
  );
}
