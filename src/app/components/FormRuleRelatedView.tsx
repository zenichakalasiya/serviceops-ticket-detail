import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Check, ChevronRight, Copy, Info, Plus, Search, X } from 'lucide-react';
import type { FormField } from './formRuleData';
import type { ConflictKind, RuleConflict, SimilarRule } from './formRuleEngine';
import { conditionText } from './formRuleEngine';
import { SimilarRulesArt, eventLabel } from './FormRuleInsights';
import { RULE_CTA } from './FormRuleConflictReview';

/* R · Related rules. Conflicts and similar rules are two DIFFERENT jobs: a conflict is something to
 * resolve (you go into that flow and fix it), a similar rule is guidance (you probably meant to
 * update that rule instead of creating this one). So they are two summary cards side by side, and
 * each number opens its own sidebar — never one list mixing the two. */

const KINDS: ConflictKind[] = ['Blocking', 'Opposite', 'Override'];
const KIND_FG: Record<ConflictKind, string> = { Blocking: '#9F1239', Opposite: '#DC2626', Override: '#C2410C' };

/** The two cards that sit at the top of the builder. */
export type IntroKind = 'conflicts' | 'similar';
export function RelatedSummaryCards({ ready, conflicts, similar, onOpenConflicts, onOpenSimilar, onlyFound = false, stack = false, intro = null, onInfo, onCloseIntro, introSide = 'right', introAlign = 'bottom' }: {
  /** Where a card's info popup opens: beside the card on this side, lined up with this edge. */
  introSide?: 'left' | 'right';
  introAlign?: 'top' | 'bottom';
  /** Which card's info popup is open beside it (one at a time). */
  intro?: IntroKind | null;
  /** The ⓘ on a card asks for its popup. Without it the card shows no ⓘ. */
  onInfo?: (k: IntroKind) => void;
  onCloseIntro?: () => void;
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
  /* Summary card: a soft tint carries the meaning (red / amber), no border. Count and title on one line,
     4px apart; a two-line summary 6px under them. The whole card is the button — on hover it lifts and an
     arrow appears top-right, so it reads as clickable without a link line. */
  /* The width lives on a wrapper so a card's info popup can sit beside it as a SIBLING — a popup with
     buttons cannot live inside the card, which is itself a button. */
  const wrap = (stack ? 'w-full' : 'min-w-[240px] flex-1') + ' relative';
  const card = (tint: string, hover: string, empty: boolean) =>
    'group relative flex w-full flex-col rounded-md border p-4 text-left transition-[background-color,box-shadow] ' +
    (empty ? 'cursor-default border-[#E5EAF0] bg-[#F7F9FB]' : tint + ' ' + hover + ' hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]');
  const head = (n: number, label: string, color: string) => (
    <span className="flex min-w-0 items-center pr-14">
      <span className="flex min-w-0 items-baseline gap-1">
        <span className="text-[24px] font-semibold leading-none tabular-nums" style={{ color }}>{n}</span>
        <span className="truncate whitespace-nowrap text-[14px] font-semibold" style={{ color }}>{label}</span>
      </span>
    </span>
  );
  /* Top-right: the ⓘ is always there; the ↗ appears beside it on hover. The ⓘ is a span with a button
     role because the card around it is already a button. */
  const corner = (k: IntroKind, color: string) => (
    <span className="absolute right-3 top-3 flex items-center gap-1">
      <ArrowUpRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color }} />
      {onInfo && (
        <span role="button" tabIndex={0} aria-label="What is this?"
          onClick={(e) => { e.stopPropagation(); intro === k ? onCloseIntro?.() : onInfo(k); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); intro === k ? onCloseIntro?.() : onInfo(k); } }}
          className="flex size-6 items-center justify-center rounded transition-colors hover:bg-white/70" style={{ color }}>
          <Info size={15} />
        </span>
      )}
    </span>
  );
  const summary = (text: React.ReactNode, color: string) => <span className="mt-6 line-clamp-2 text-[12px] font-normal leading-[1.5]" style={{ color }}>{text}</span>;
  const kinds = KINDS.map((k) => { const n = conflicts.filter((x) => x.kind === k).length; return n ? n + ' ' + k : null; }).filter(Boolean).join(' · ');
  return (
    <div className={stack ? 'flex flex-col gap-4' : 'flex flex-wrap gap-4'}>
      {/* Similar rules first (it appears first, on the first condition); Conflicts below it. */}
      {!(onlyFound && similar.length === 0) && (
        <div className={wrap}>
          <button type="button" onClick={onOpenSimilar} disabled={similar.length === 0}
            className={card('border-[#B45309] bg-[#FFF9E8]', 'hover:bg-[#FFF3D1]', similar.length === 0)}>
            {similar.length > 0 && corner('similar', '#B45309')}
            {head(similar.length, similar.length === 1 ? 'Similar rule' : similar.length ? 'Similar rules' : 'No similar rules', similar.length ? '#B45309' : '#98A2B3')}
            {summary(similar.length
              ? 'Already use this trigger and conditions. Consider updating one instead of creating a new rule.'
              : 'No other rule uses this trigger and these conditions.', similar.length ? '#B45309' : '#64748B')}
          </button>
          {intro === 'similar' && similar.length > 0 && onCloseIntro && <RuleCheckIntro key="s" kind="similar" side={introSide} align={introAlign} onClose={onCloseIntro} />}
        </div>
      )}
      {!(onlyFound && conflicts.length === 0) && (
        <div className={wrap}>
          <button type="button" onClick={onOpenConflicts} disabled={conflicts.length === 0}
            className={card('border-[#DC2626] bg-[#FEF4F4]', 'hover:bg-[#FDEBEB]', conflicts.length === 0)}>
            {conflicts.length > 0 && corner('conflicts', '#DC2626')}
            {head(conflicts.length, conflicts.length === 1 ? 'Conflict' : conflicts.length ? 'Conflicts' : 'No conflicts', conflicts.length ? '#DC2626' : '#98A2B3')}
            {summary(conflicts.length
              ? <>{kinds} with {nRules} rule{nRules === 1 ? '' : 's'}. Resolve them so the form ends up in one clear state.</>
              : 'No other rule leaves these fields in a different state.', conflicts.length ? '#DC2626' : '#64748B')}
          </button>
          {intro === 'conflicts' && conflicts.length > 0 && onCloseIntro && <RuleCheckIntro key="c" kind="conflicts" side={introSide} align={introAlign} onClose={onCloseIntro} />}
        </div>
      )}
    </div>
  );
}

/* One card's info popup. It opens on its own the FIRST time that card appears (each card once, ever),
   and again from the ⓘ on the card. Only one is open at a time — when the conflicts card turns up, its
   popup replaces the similar-rules one. */
export const RULE_CHECK_INTRO_KEY = 'formRuleCheckIntroSeen';
const INTRO: Record<IntroKind, { color: string; tint: string; title: string; text: string; todo: string }> = {
  conflicts: {
    color: '#DC2626', tint: '#FEF4F4',
    title: 'This rule clashes with other rules',
    text: 'Another rule’s action works on the same field in the opposite way — for example, this rule hides Status while that one shows it.',
    todo: 'Open the card to see each clash and fix it, so the form behaves one clear way.',
  },
  similar: {
    color: '#B45309', tint: '#FFF9E8',
    title: 'Rules like this already exist',
    text: 'Other rules already run on this trigger with these conditions.',
    todo: 'Open the card to compare them — updating one is often better than adding another rule.',
  },
};
export function RuleCheckIntro({ kind, onClose, side = 'right', align = 'bottom' }: { kind: IntroKind; onClose: () => void; side?: 'left' | 'right'; align?: 'top' | 'bottom' }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(t); }, []);
  const m = INTRO[kind];
  return (
    <div role="dialog" aria-label={m.title}
      className={'absolute z-50 w-[300px] rounded-xl border border-[#E5EAF0] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)] transition-[opacity,transform] duration-200 ease-out '
        + (align === 'top' ? 'top-0 ' : 'bottom-0 ')
        + (side === 'left' ? 'right-[calc(100%+12px)] ' + (shown ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0')
          : 'left-[calc(100%+12px)] ' + (shown ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'))}>
      {/* caret pointing back at its card */}
      <span className={'absolute size-3 rotate-45 bg-white ' + (side === 'left' ? '-right-[6px] border-r border-t border-[#E5EAF0] ' : '-left-[6px] border-b border-l border-[#E5EAF0] ') + (align === 'top' ? 'top-[52px]' : 'bottom-[52px]')} />
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-white"><X size={15} /></button>
      <div className="overflow-hidden rounded-t-xl bg-[#F4F6FA]">{kind === 'conflicts' ? <ConflictArt /> : <RuleCheckArt conflicts={false} similar />}</div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="text-[14px] font-semibold text-[#1D2A3E]">{m.title}</div>
          <p className="mt-1 text-[12px] leading-[1.5] text-[#64748B]">{m.text}</p>
        </div>
        <div className="flex gap-2.5 rounded-md px-3 py-2.5" style={{ background: m.tint }}>
          <span className="mt-[5px] size-2 flex-shrink-0 rounded-full" style={{ background: m.color }} />
          <span className="text-[12px] leading-[1.5] text-[#475467]">{m.todo}</span>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">Got it</button>
        </div>
      </div>
    </div>
  );
}

/** Line art for the intro: a rule card at the centre, checked against the cards that came back. */
/* How a conflict happens: two rules whose ACTION rows act on the SAME field in opposite ways —
   one hides Status, the other shows it — so both lines meet at that one field and clash there. */
function ConflictArt() {
  const rule = (y: number, name: string, verb: string) => (
    <g>
      <rect x="14" y={y} width="150" height="42" rx="7" fill="#FFFFFF" stroke="#DCE3EC" />
      <text x="24" y={y + 13} fontSize="7.5" fontWeight="600" fill="#7B8FA5">{name}</text>
      <text x="56" y={y + 13} fontSize="7" fill="#A3B1C2">· Then</text>
      {/* the action row: action type + the field it acts on */}
      <rect x="22" y={y + 19} width="40" height="15" rx="3" fill="#FEF2F2" stroke="#F3B4B4" />
      <text x="42" y={y + 29.5} fontSize="8" fontWeight="600" fill="#DC2626" textAnchor="middle">{verb}</text>
      <rect x="67" y={y + 19} width="88" height="15" rx="3" fill="#EBF5FF" stroke="#BCD7F0" />
      <text x="75" y={y + 29.5} fontSize="8" fontWeight="500" fill="#2C6CA8">Status</text>
      <path d={`M141 ${y + 24.5}l3 3 3-3`} fill="none" stroke="#2C6CA8" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 300 112" className="block h-[112px] w-full" aria-hidden="true" fontFamily="inherit">
      <defs>
        <pattern id="cf-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#DCE3EC" /></pattern>
      </defs>
      <rect width="300" height="112" fill="url(#cf-dots)" />
      {rule(10, 'Rule A', 'Hide')}
      {rule(60, 'Rule B', 'Show')}
      {/* both action rows point at the same field */}
      <path d="M155 36.5 C 182 36.5, 184 56, 206 56" fill="none" stroke="#F3B4B4" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M155 86.5 C 182 86.5, 184 56, 206 56" fill="none" stroke="#F3B4B4" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* the field they fight over */}
      <rect x="206" y="36" width="80" height="40" rx="7" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.2" />
      <text x="216" y="51" fontSize="7" fill="#7B8FA5">Field</text>
      <text x="216" y="65" fontSize="9.5" fontWeight="600" fill="#1D2A3E">Status</text>
      {/* clash mark */}
      <circle cx="284" cy="38" r="9" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M284 33.5v5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="284" cy="41.6" r="1" fill="#FFFFFF" />
    </svg>
  );
}

function RuleCheckArt({ conflicts, similar }: { conflicts: boolean; similar: boolean }) {
  const red = conflicts, amb = similar;
  return (
    <svg viewBox="0 0 320 112" className="block h-[112px] w-full" aria-hidden="true">
      <defs>
        <pattern id="rc-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#DCE3EC" /></pattern>
      </defs>
      <rect width="320" height="112" fill="url(#rc-dots)" />
      {/* your rule */}
      <g>
        <rect x="40" y="30" width="96" height="56" rx="8" fill="#FFFFFF" stroke="#BCD7F0" />
        <rect x="52" y="42" width="20" height="20" rx="5" fill="#EBF5FF" />
        <path d="M57 52.5l3 3 6-6" fill="none" stroke="#3D8BD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="78" y="45" width="44" height="5" rx="2.5" fill="#CBD5E1" />
        <rect x="78" y="55" width="30" height="4" rx="2" fill="#E2E8F0" />
        <rect x="52" y="70" width="70" height="4" rx="2" fill="#E2E8F0" />
      </g>
      {/* connectors */}
      {red && <path d="M136 50 C 160 50, 162 34, 186 34" fill="none" stroke="#F3B4B4" strokeWidth="1.5" strokeDasharray="3 3" />}
      {amb && <path d={red ? 'M136 66 C 160 66, 162 80, 186 80' : 'M136 58 C 160 58, 162 58, 186 58'} fill="none" stroke="#F2D48A" strokeWidth="1.5" strokeDasharray="3 3" />}
      {/* conflict card */}
      {red && (
        <g>
          <rect x="186" y={amb ? 16 : 30} width="96" height={amb ? 36 : 56} rx="7" fill="#FEF4F4" stroke="#DC2626" />
          <path d={amb ? 'M203 26l6 11h-12z' : 'M203 47l7 13h-14z'} fill="none" stroke="#DC2626" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="218" y={amb ? 28 : 46} width="48" height="5" rx="2.5" fill="#F3B4B4" />
          {!amb && <rect x="218" y="56" width="32" height="4" rx="2" fill="#F8D4D4" />}
        </g>
      )}
      {/* similar card */}
      {amb && (
        <g>
          <rect x="186" y={red ? 62 : 30} width="96" height={red ? 36 : 56} rx="7" fill="#FFF9E8" stroke="#B45309" />
          <rect x={196} y={red ? 71 : 45} width="12" height="14" rx="2.5" fill="none" stroke="#B45309" strokeWidth="1.5" />
          <rect x={200} y={red ? 75 : 49} width="12" height="14" rx="2.5" fill="#FFF9E8" stroke="#B45309" strokeWidth="1.5" />
          <rect x="218" y={red ? 75 : 48} width="48" height="5" rx="2.5" fill="#F2D48A" />
          {!red && <rect x="218" y="58" width="32" height="4" rx="2" fill="#F8E6B8" />}
        </g>
      )}
    </svg>
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
export function SimilarRulesView({ similar, fields, draft, conditionLines, onOpenRule, myActions = [] }: {
  /** This rule's actions, in words — shown in the common container. */
  myActions?: string[];
  similar: SimilarRule[];
  fields: FormField[];
  /** This rule's trigger, to compare against. */
  draft: { event: string; execution: string; applies: string };
  conditionLines: string[];
  onOpenRule: (id: string) => void;
}) {
  const [sel, setSel] = useState<string | null>(similar[0]?.rule.id ?? null);
  const [q, setQ] = useState('');
  /** The shared trigger container starts folded: its title says what it is, the detail is one click away. */
  const [commonOpen, setCommonOpen] = useState(false);
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
  void fields;

  /* Every similar rule shares this trigger and these conditions with yours (that is what makes it
     similar), so they are said ONCE, in a folded container, instead of repeated on every rule. */
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[12px] text-[#7B8FA5]">{label}</span>
      <span className="text-[13px] font-medium text-[#364658]">{value}</span>
    </div>
  );
  const common = (
    <div className="mx-3 mb-3 flex-shrink-0 overflow-hidden rounded-lg border border-[#E8EDF3] bg-white">
      <button type="button" onClick={() => setCommonOpen((o) => !o)} aria-expanded={commonOpen}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F9FAFB]">
        <ChevronRight size={15} className={'flex-shrink-0 text-[#7B8FA5] transition-transform ' + (commonOpen ? 'rotate-90' : '')} />
        <span className="text-[13px] font-semibold text-[#1D2A3E]">Common trigger &amp; conditions</span>
        <span className="text-[12px] text-[#98A2B3]">shared by your rule and all {similar.length} similar rule{similar.length === 1 ? '' : 's'}</span>
      </button>
      {commonOpen && (
        <div className="flex flex-col gap-4 border-t border-[#EEF2F6] bg-[#F9FAFB] px-4 py-4">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {row('Event', eventLabel(draft.event) || '—')}
            {row('Execute on', draft.execution || '—')}
            {row('Applies to', draft.applies || '—')}
          </div>
          {row('Conditions', conditionLines.length
            ? <span className="mt-0.5 flex flex-wrap gap-1.5">{conditionLines.map((l) => <span key={l} className="rounded-md border border-[#E2E8F0] bg-white px-2 py-0.5 text-[12px] font-normal text-[#364658]">{l}</span>)}</span>
            : 'Every matching event')}
          {myActions.length > 0 && row('Your rule’s actions',
            <span className="mt-0.5 flex flex-wrap gap-1.5">{myActions.map((l) => <span key={l} className="rounded-md bg-[#EBF5FF] px-2 py-0.5 text-[12px] font-normal text-[#2C6CA8]">{l}</span>)}</span>)}
        </div>
      )}
    </div>
  );

  /** One group of actions: a quiet label, then the actions as lines with a leading mark. */
  const actionGroup = (title: string, hint: string, items: string[], icon: React.ReactNode, tone: string) => (
    <div className="rounded-lg bg-[#F6F9FC] px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-semibold" style={{ color: tone }}>{title}</span>
        <span className="text-[11px] text-[#98A2B3]">{hint}</span>
        <span className="ml-auto text-[12px] font-medium tabular-nums text-[#64748B]">{items.length}</span>
      </div>
      {items.length > 0
        ? <ul className="mt-2 flex flex-col gap-1.5">{items.map((t) => <li key={t} className="flex items-center gap-2 text-[13px] text-[#364658]">{icon}{t}</li>)}</ul>
        : <p className="mt-1.5 text-[12px] text-[#98A2B3]">None</p>}
    </div>
  );

  const detail = cur && (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-[#1D2A3E]">{cur.rule.name}</h3>
          <p className="mt-0.5 text-[12px] text-[#7B8FA5]">{cur.rule.enabled ? 'Enabled' : 'Disabled'} · {cur.common.length} of your actions already here</p>
        </div>
        <button type="button" onClick={() => onOpenRule(cur.rule.id)}
          className={RULE_CTA}>
          Update this rule <ArrowUpRight size={13} />
        </button>
      </div>
      {actionGroup('Matches your rule', 'it already does this', cur.common, <Check size={12} strokeWidth={2.5} className="flex-shrink-0 text-[#12B76A]" />, '#12B76A')}
      {actionGroup('Its other actions', 'already in this rule, not in yours', cur.others, <span className="size-1.5 flex-shrink-0 rounded-full bg-[#98A2B3]" />, '#64748B')}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-3 mb-3 flex flex-shrink-0 items-start gap-3 rounded-lg border border-[#F7E3AE] bg-[#FFFAEB] px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-[#B45309]" />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[#93370D]">{similar.length} similar rule{similar.length === 1 ? '' : 's'} found</div>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-[#B54708]">These rules already do what your rule does. Merging one keeps the same behaviour without running it twice.</p>
        </div>
      </div>
      {common}
      <div className="flex min-h-0 flex-1 gap-4 px-3 pb-3">
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
                  {s.common.length} action{s.common.length === 1 ? '' : 's'} match{s.common.length === 1 ? 'es' : ''} the current rule
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">{detail}</div>
      </div>
      {/* The advice stays put at the foot while the rules scroll. */}
      <div className="flex flex-shrink-0 items-start gap-2 border-t border-[#EEF2F6] bg-[#EFF6FD] px-4 py-2.5 text-[12px] leading-[1.55] text-[#1D3A5C]">
        <Info size={14} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" />
        <span>Instead of creating another rule, you can <b className="font-semibold">add your actions to one of these</b> — one rule doing the whole job is easier to find and maintain than two that overlap.</span>
      </div>
    </div>
  );
}

/** Right sidebar shell shared by both. */
export function RelatedDrawer({ title, sub, onClose, children, hideHead = false }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; hideHead?: boolean }) {
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
            {sub && <p className="mt-0.5 text-[12px] text-[#64748B]">{sub}</p>}
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
