import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Copy, Plus, Search, X } from 'lucide-react';
import type { FormField } from './formRuleData';
import type { ConflictKind, RuleConflict, SimilarRule } from './formRuleEngine';
import { conditionText } from './formRuleEngine';
import { SimilarRulesArt, eventLabel } from './FormRuleInsights';

/* R · Related rules. Conflicts and similar rules are two DIFFERENT jobs: a conflict is something to
 * resolve (you go into that flow and fix it), a similar rule is guidance (you probably meant to
 * update that rule instead of creating this one). So they are two summary cards side by side, and
 * each number opens its own sidebar — never one list mixing the two. */

const KINDS: ConflictKind[] = ['Blocking', 'Opposite', 'Override'];
const KIND_FG: Record<ConflictKind, string> = { Blocking: '#9F1239', Opposite: '#DC2626', Override: '#C2410C' };

/** The two cards that sit at the top of the builder. */
export function RelatedSummaryCards({ ready, conflicts, similar, onOpenConflicts, onOpenSimilar, onlyFound = false, stack = false }: {
  /** Show a card only once it has something to report; nothing at all before that. */
  onlyFound?: boolean;
  /** One card per row, for a narrow sidebar. */
  stack?: boolean;
  ready: boolean;
  conflicts: RuleConflict[];
  similar: SimilarRule[];
  onOpenConflicts: () => void;
  onOpenSimilar: () => void;
}) {
  const nRules = new Set(conflicts.map((x) => x.other.id)).size;
  if (onlyFound && (!ready || (conflicts.length === 0 && similar.length === 0))) return null;
  if (!ready) {
    return (
      <div className="rounded-md border border-dashed border-[#DFE5ED] px-4 py-3 text-[12px] text-[#7B8FA5]">
        Conflicts and similar rules are checked once you choose when the rule runs.
      </div>
    );
  }
  /* Stat card: a soft tint carries the meaning (red / amber), 6px corners; number top-left,
     title on one line beside it, one summary line, the action at the foot. */
  const card = (tone: string, empty: boolean) =>
    (stack ? 'w-full' : 'min-w-[240px] flex-1') + ' group flex flex-col gap-2 rounded-md border px-4 pb-3 pt-3 text-left transition-[border-color,box-shadow] ' +
    (empty ? 'cursor-default border-[#E5EAF0] bg-white' : 'hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] ' + tone);
  const head = (n: number, label: string, color: string) => (
    <span className="flex min-w-0 items-baseline gap-2">
      <span className="text-[24px] font-semibold leading-none tabular-nums" style={{ color }}>{n}</span>
      <span className="truncate whitespace-nowrap text-[13px] font-semibold text-[#1D2A3E]">{label}</span>
    </span>
  );
  const foot = (text: string, color: string) => (
    <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color }}>
      {text} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
    </span>
  );
  return (
    <div className={stack ? 'flex flex-col gap-2.5' : 'flex flex-wrap gap-3'}>
      {!(onlyFound && conflicts.length === 0) && (
        <button type="button" onClick={onOpenConflicts} disabled={conflicts.length === 0} className={card('border-[#FBDADA] bg-[#FEF6F6] hover:border-[#F3B4B4]', conflicts.length === 0)}>
          {head(conflicts.length, conflicts.length ? `Conflict${conflicts.length === 1 ? '' : 's'} · ${nRules} rule${nRules === 1 ? '' : 's'}` : 'No conflicts', conflicts.length ? '#DC2626' : '#98A2B3')}
          <span className="flex flex-wrap gap-x-2 text-[12px] text-[#64748B]">
            {conflicts.length
              ? KINDS.map((k) => { const n = conflicts.filter((x) => x.kind === k).length; return n ? <span key={k}><span className="font-semibold" style={{ color: KIND_FG[k] }}>{n}</span> {k}</span> : null; }).filter(Boolean).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, <span key={'s' + i} className="text-[#CBD5E1]">·</span>, el] : [el]), [])
              : 'No other rule leaves these fields in a different state.'}
          </span>
          {conflicts.length > 0 && foot('Resolve conflicts', '#DC2626')}
        </button>
      )}
      {!(onlyFound && similar.length === 0) && (
        <button type="button" onClick={onOpenSimilar} disabled={similar.length === 0} className={card('border-[#F7E3AE] bg-[#FFFBEB] hover:border-[#F2CF73]', similar.length === 0)}>
          {head(similar.length, similar.length ? `Similar rule${similar.length === 1 ? '' : 's'}` : 'No similar rules', similar.length ? '#B45309' : '#98A2B3')}
          <span className="text-[12px] text-[#64748B]">
            {similar.length ? 'Same trigger and conditions as your rule' : 'No other rule uses this trigger and these conditions.'}
          </span>
          {similar.length > 0 && foot('Review similar rules', '#B45309')}
        </button>
      )}
    </div>
  );
}

/** Variant S: the two counts as chips in the page header, each opening its sidebar; only once found. */
export function RelatedSummaryChips({ ready, conflicts, similar, onOpenConflicts, onOpenSimilar }: {
  ready: boolean; conflicts: RuleConflict[]; similar: SimilarRule[]; onOpenConflicts: () => void; onOpenSimilar: () => void;
}) {
  if (!ready) return null;
  const nRules = new Set(conflicts.map((x) => x.other.id)).size;
  const chip = 'group relative inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors';
  const tip = 'pointer-events-none absolute right-0 top-[calc(100%+6px)] z-50 hidden w-[230px] rounded-md bg-[#364658] px-3 py-2 text-left text-[11px] font-normal leading-[1.5] text-white shadow-lg group-hover:block';
  return (
    <>
      {conflicts.length > 0 && (
        <button type="button" onClick={onOpenConflicts} className={chip + ' border-[#FECACA] bg-[#FEF6F6] text-[#DC2626] hover:border-[#F87171]'}>
          <span className="size-1.5 rounded-full bg-[#DC2626]" />
          {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'}
          <span className={tip}>
            <span className="block font-medium">Conflicts with {nRules} rule{nRules === 1 ? '' : 's'}</span>
            {KINDS.map((k) => { const n = conflicts.filter((x) => x.kind === k).length; return n ? <span key={k} className="block">{n} {k}</span> : null; })}
            <span className="mt-1 block text-white/70">Click to resolve</span>
          </span>
        </button>
      )}
      {similar.length > 0 && (
        <button type="button" onClick={onOpenSimilar} className={chip + ' border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:border-[#F59E0B]'}>
          <span className="size-1.5 rounded-full bg-[#F59E0B]" />
          {similar.length} similar
          <span className={tip}>
            <span className="block font-medium">{similar.length} rule{similar.length === 1 ? '' : 's'} already run on this trigger</span>
            <span className="block">You may want to update one instead of creating a new rule.</span>
            <span className="mt-1 block text-white/70">Click to review</span>
          </span>
        </button>
      )}
    </>
  );
}

/** The similar-rules sidebar body: which trigger each rule shares with yours, and how its actions compare. */
export function SimilarRulesView({ similar, fields, draft, conditionLines, onOpenRule }: {
  similar: SimilarRule[];
  fields: FormField[];
  /** This rule's trigger, to compare against. */
  draft: { event: string; execution: string; applies: string };
  conditionLines: string[];
  onOpenRule: (id: string) => void;
}) {
  const [sel, setSel] = useState<string | null>(similar[0]?.rule.id ?? null);
  const [q, setQ] = useState('');
  const shown = similar.filter((s) => !q.trim() || s.rule.name.toLowerCase().includes(q.trim().toLowerCase()));
  useEffect(() => { if (!sel || !shown.some((s) => s.rule.id === sel)) setSel(shown[0]?.rule.id ?? null); }, [shown.map((s) => s.rule.id).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (similar.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <SimilarRulesArt />
        <div className="mt-3 text-[13px] font-medium text-[#364658]">No similar rules</div>
        <p className="mt-1 max-w-[280px] text-[12px] leading-[1.55] text-[#7B8FA5]">No other rule uses this trigger and these conditions.</p>
      </div>
    );
  }
  const cur = similar.find((s) => s.rule.id === sel);

  /** One trigger line: theirs, and whether it is the same as yours. */
  const line = (label: string, theirs: string, same: boolean) => (
    <div key={label} className="flex items-start gap-3 py-2">
      <span className="w-[110px] flex-shrink-0 text-[12px] text-[#7B8FA5]">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] text-[#1D2A3E]">{theirs || '—'}</span>
      <span className={'inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium leading-5 ' + (same ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#F1F5F9] text-[#64748B]')}>
        {same ? <><Check size={11} strokeWidth={2.5} />Same as yours</> : 'Different'}
      </span>
    </div>
  );
  const actionGroup = (title: string, hint: string, items: string[], icon: React.ReactNode, tone: string) => (
    <div className="rounded-lg bg-[#F6F9FC] px-3.5 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-semibold" style={{ color: tone }}>{title}</span>
        <span className="text-[11px] text-[#98A2B3]">{hint}</span>
        <span className="ml-auto text-[12px] font-medium tabular-nums text-[#64748B]">{items.length}</span>
      </div>
      {items.length > 0
        ? <ul className="mt-2 flex flex-col gap-1">{items.map((t) => <li key={t} className="flex items-center gap-2 text-[13px] text-[#364658]">{icon}{t}</li>)}</ul>
        : <p className="mt-1.5 text-[12px] text-[#98A2B3]">None</p>}
    </div>
  );

  const theirConds = cur ? cur.rule.groups.flatMap((g) => g.conditions).filter((c) => c.fieldId && c.op).map((c) => conditionText(c, fields)) : [];
  const sameConds = theirConds.filter((t) => conditionLines.includes(t));

  const detail = cur && (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-medium text-[#1D2A3E]">{cur.rule.name}</h3>
          <p className="mt-0.5 text-[12px] text-[#7B8FA5]">{cur.rule.enabled ? 'Enabled' : 'Disabled'}</p>
        </div>
        <button type="button" onClick={() => onOpenRule(cur.rule.id)}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5]">
          Update this rule <ArrowUpRight size={12} />
        </button>
      </div>

      {/* The guidance, in one sentence. */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2.5">
        <Copy size={15} className="mt-0.5 flex-shrink-0 text-[#B45309]" />
        <p className="text-[12px] leading-[1.55] text-[#92400E]">
          You have already configured <b>{cur.rule.name}</b> on this trigger{cur.common.length ? <> with <b>{cur.common.length}</b> of the same action{cur.common.length === 1 ? '' : 's'}</> : null}.
          {cur.missing.length ? <> Adding your <b>{cur.missing.length}</b> new action{cur.missing.length === 1 ? '' : 's'} to it</> : ' Updating it'} keeps one rule to maintain instead of two.
        </p>
      </div>

      <section>
        <div className="mb-1 text-[13px] font-semibold text-[#1D2A3E]">Trigger</div>
        <div className="divide-y divide-[#EEF2F6]">
          {line('Event', eventLabel(cur.rule.event), cur.rule.event === draft.event)}
          {line('Execute on', cur.rule.execution, cur.rule.execution === draft.execution)}
          {line('Applies to', cur.rule.applies, cur.rule.applies === draft.applies)}
          {line('Conditions', theirConds.length ? theirConds.join(' and ') : 'Every matching event', theirConds.length > 0 && sameConds.length === theirConds.length)}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="text-[13px] font-semibold text-[#1D2A3E]">Actions</div>
        {actionGroup('Same as yours', 'both rules do this', cur.common, <Check size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#12B76A]" />, '#12B76A')}
        {actionGroup('New in your rule', 'what updating it would add', cur.missing, <Plus size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#3D8BD0]" />, '#3D8BD0')}
        {actionGroup('Only in that rule', 'it already does this too', cur.others, <span className="size-1 flex-shrink-0 rounded-full bg-[#98A2B3]" />, '#64748B')}
      </section>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 gap-4 px-3 pb-4 pt-1">
      <div className="flex w-[260px] flex-shrink-0 flex-col rounded-md bg-[#F4F6FA] p-2">
        <div className="relative mb-2 flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rules..."
            className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-2.5 text-[12px] text-[#364658] placeholder:text-[#98A2B3] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {shown.length === 0 && <div className="px-3 py-6 text-center text-[12px] text-[#98A2B3]">Nothing matches “{q}”</div>}
          {shown.map((s) => (
            <button key={s.rule.id} type="button" onClick={() => setSel(s.rule.id)}
              className={'block w-full rounded-md px-3 py-2.5 text-left transition-colors ' + (sel === s.rule.id ? 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]' : 'hover:bg-white/60')}>
              <span className="block truncate text-[13px] font-semibold text-[#1D2A3E]">{s.rule.name}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]">
                <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                {s.common.length} same · {s.missing.length} new
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">{detail}</div>
    </div>
  );
}

/** Right sidebar shell shared by both. */
export function RelatedDrawer({ title, sub, onClose, children, hideHead = false }: { title: string; sub: React.ReactNode; onClose: () => void; children: React.ReactNode; hideHead?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[10040] flex justify-end bg-[#0F172A]/25" onMouseDown={onClose}>
      <aside className="flex h-full w-[min(960px,96vw)] flex-col bg-white shadow-[-12px_0_32px_rgba(15,23,42,0.16)]" onMouseDown={(e) => e.stopPropagation()}>
        {!hideHead && <div className="flex flex-shrink-0 items-start gap-3 px-3 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-[#364658]">{title}</h3>
            <p className="mt-0.5 text-[12px] text-[#64748B]">{sub}</p>
          </div>
          <button type="button" onClick={onClose} title="Close" className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
            <X size={16} className="text-[#64748B]" />
          </button>
        </div>}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </div>
  );
}
