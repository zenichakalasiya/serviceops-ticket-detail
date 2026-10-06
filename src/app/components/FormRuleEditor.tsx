import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, ChevronRight, ChevronsLeft, Copy, X as XIcon, ExternalLink, History, Plus, RefreshCcw, Split, Trash2, Users, Workflow, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  ACTION_TYPES, APPLIES_OPTIONS, EVENT_OPTIONS, EXECUTION_OPTIONS, NO_VALUE, PEOPLE,
  blankAction, blankCondition, blankGroup, operatorsFor, uid,
} from './formRuleData';
import type { Condition, ConditionGroup, FormField, FormRule, RuleAction } from './formRuleData';
import { ErrorText, FieldLabel, RuleSelect, StatusToggle, TagEditor, inputCls, rowInputCls } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { actionText, conditionText, demoConflicts, demoSimilar, findConflicts, findSimilar, runOrder } from './formRuleEngine';
import { FormRuleInsights, KIND_TONE, eventLabel } from './FormRuleInsights';
import type { InsightTab } from './FormRuleInsights';
import { FormRuleFieldView } from './FormRuleFieldView';
import { FormRuleFlowView } from './FormRuleFlowView';
import { FormRuleLinearView } from './FormRuleLinearView';
import { FormRuleConflictReview } from './FormRuleConflictReview';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { RelatedDrawer, RelatedSummaryCards, RelatedSummaryChips, RULE_CHECK_INTRO_KEY, RuleCheckEmpty, SimilarRulesView } from './FormRuleRelatedView';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

/** The four layouts being compared. They share ONE draft, so switching compares the same rule. */
export type EditorVersion = 'H1' | 'H2' | 'H3' | 'A' | 'A2' | 'A3' | 'A3R' | 'B3' | 'S' | 'LS' | 'RC' | 'EG' | 'HF' | 'R' | 'B' | 'B2' | 'P' | 'C' | 'G2' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
/** Only A · B · B2 · I are offered (Zeni, 1 Oct 2026); the rest stay built but hidden. */
const VERSIONS: { id: EditorVersion; label: string; hint: string; fav?: boolean; show?: boolean }[] = [
  { id: 'A', show: true, fav: true, label: 'A · Split', hint: 'Builder + a resizable, collapsible Rule check rail' },
  { id: 'H1', show: true, label: 'H1 · Steps across · cards top right', hint: 'The two steps across the top, the form left-aligned under them, the summary cards in a right column at the top' },
  { id: 'H2', show: true, label: 'H2 · Steps across · cards bottom right', hint: 'Like H1, but the summary cards dock at the foot of the right column' },
  { id: 'H3', show: true, label: 'H3 · Steps across · floating cards', hint: 'Like H1 with no right column — the cards float in the bottom-right corner over the page' },
  { id: 'B3', show: true, label: 'B3 · Steps + summary', hint: 'B’s two steps in a wider left column, with conflict / similar cards docked at its foot once something is found' },
  { id: 'A3', show: true, label: 'A3 · Details left', hint: 'Rule details in a left sidebar with the summary cards under it; the builder in the centre' },
  { id: 'A3R', show: true, label: 'A3R · Details right', hint: 'A3 mirrored — Rule details and the summary cards in a right sidebar, so the panel opens from the same side' },
  { id: 'S', show: true, label: 'S · Header summary', hint: 'One centred column; the conflict and similar counts are chips beside Save in the header' },
  { id: 'LS', show: true, label: 'LS · Live summary', hint: 'Build on the left; the right reads the rule back as a sentence, issues marked on the lines that cause them' },
  { id: 'RC', show: true, label: 'RC · Checklist', hint: 'A “Ready to save?” checklist on the right: rule details, trigger, actions, conflicts and similar rules as one list' },
  { id: 'EG', show: true, label: 'EG · Gutter', hint: 'Issue markers in a left gutter beside the rows that cause them, like error marks in a code editor' },
  { id: 'HF', show: true, label: 'HF · Horizontal flow', hint: 'The rule as four columns left to right — Who · When · If · Then' },
  { id: 'R', show: true, label: 'R · Summary cards', hint: 'Two summary cards over the builder — conflicts to resolve, similar rules to consider; each number opens its own sidebar' },
  { id: 'A2', show: true, label: 'A2 · Who first', hint: 'Like A, but who the rule is for is its own step above the trigger' },
  { id: 'B2', show: true, fav: true, label: 'B2 · 2 steps', hint: 'Two steps across the top: Rule details → Build the rule, conflicts in the right sidebar' },
  { id: 'P', show: true, label: 'P · Name first', hint: 'A popup asks the name, description and tags; the rule is built in the centre, details fold into the right sidebar' },
  { id: 'C', fav: true, label: 'C · Linear', hint: 'A centred step-by-step flow — hover a line for its actions, hover a gap to add a step' },
  { id: 'E', fav: true, label: 'E · Flow', hint: 'The rule as a node pipeline; clashes branch off as red lines' },
  { id: 'I', show: true, fav: true, label: 'I · Details', hint: 'Rule logic in the centre; details and the rule check in a right panel' },
  { id: 'F', label: 'F · Problems', hint: 'Full-width builder with a bottom Problems dock' },
  { id: 'B', show: true, label: 'B · Stepper', hint: 'Two steps down the left: Rule details → Build the rule, conflicts in the right sidebar' },
  { id: 'D', label: 'D · Field', hint: 'Click fields on the form preview to say what the rule does to them' },
  { id: 'G', label: 'G · Review', hint: 'Inline warnings while building; a review before it is saved' },
  { id: 'G2', label: 'G2 · Review list', hint: 'Like G, but the review is one list of expandable rules — no side panel' },
  { id: 'H', label: 'H · Similar-first', hint: 'Start from the trigger — extend an existing rule before creating one' },
];
/** A hidden layout remembered from an earlier visit falls back to A. */
/** B3 is the chosen layout (Zeni, 1 Oct 2026); the others stay built but are hidden. Add ids back here to compare again. */
/* All the shortlisted layouts are offered again for comparison (6 Oct 2026, Zeni) — B3 first and still the default; the H1/H2/H3 steps-across variants stay hidden. */
/* A is the FINAL layout (6 Oct 2026, Zeni): the builder with the Rule check rail open beside it by
   default. Every other layout stays built and hidden; add ids back here to compare again. */
const SHOWN: EditorVersion[] = ['A', 'B3'];
/** V1 = A (the default), V2 = B3 (the previous final). Picked from the switch beside the Motadata
    logo — not from a Layout bar — and remembered under this key. */
export const FORM_RULE_UI_KEY = 'formRuleUi';
const uiVersion = (): EditorVersion => { try { return localStorage.getItem(FORM_RULE_UI_KEY) === 'v2' ? 'B3' : 'A'; } catch { return 'A'; } };
/** The layouts whose conflict / similar checks open in the two summary sidebars. */
const SUMMARY: EditorVersion[] = ['H1', 'H2', 'H3', 'R', 'B3', 'A3', 'A3R', 'S', 'LS', 'RC', 'EG', 'HF'];
const RAIL_MIN = 320;
const RAIL_MAX = 560;
const RAIL_DEFAULT = 420;
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* Sentence words (version C). The sentence reads as the rule does. */
const VERB: Record<string, string> = {
  Mandate: 'make mandatory', 'Make optional': 'make optional', Hide: 'hide', Show: 'show',
  Disable: 'make read-only', Enable: 'make editable', 'Set value': 'set', 'Clear value': 'clear',
};
const EVENT_WORD: Record<string, string> = { 'On Field Change': 'is being filled', 'On Form Load': 'opens', 'On Form Submit': 'is submitted' };
const EXEC_WORD: Record<string, string> = { 'On Create': 'a new request', 'On Edit': 'an existing request', 'On Create and Edit': 'new and existing requests' };
const APPLIES_WORD: Record<string, string> = { Requesters: 'requesters', Technicians: 'technicians', Everyone: 'everyone' };
const TONE = { when: '#3D8BD0', ifc: '#D97706', then: '#4D8A1A' };

/* The rule editor — a full page, not a side drawer (the live product uses a drawer). A rule is a
 * small program (when → if → then) and a 520px drawer made every condition row wrap to three lines.
 *
 * The blocks follow the Form-rule Figma (node 1663:17995): each step is a round tinted icon badge
 * beside a heading whose lead word carries the step's colour, over a borderless #F9FAFB panel.
 * Condition groups are white cards under a grey "Condition group N" chip, joined by an "And ↻"
 * connector on a dashed line; every condition and action row carries its own copy + delete.
 *
 * It opens with only the rule's identity and its WHEN. The Check-if and Then blocks appear once
 * the rule knows when it runs: a condition written before the trigger is chosen has nothing to be
 * checked against. */

type Draft = Omit<FormRule, 'id' | 'createdAt' | 'conflicts' | 'enabled' | 'event' | 'execution' | 'applies'> & {
  applies: FormRule['applies'] | '';
  event: FormRule['event'] | '';
  execution: FormRule['execution'] | '';
};

const emptyDraft = (): Draft => ({
  name: '', description: '', applies: '', event: '', execution: '', tags: [], groups: [], actions: [], reverse: false,
});

/** A deep copy, so editing never reaches back into the listing's record. */
const toDraft = (r: FormRule): Draft => ({
  name: r.name, description: r.description, applies: r.applies, event: r.event, execution: r.execution,
  tags: [...r.tags], reverse: r.reverse,
  groups: r.groups.map((g) => ({ ...g, conditions: g.conditions.map((c) => ({ ...c, value: [...c.value] })) })),
  actions: r.actions.map((a) => ({ ...a, fieldIds: [...a.fieldIds], value: [...a.value] })),
});

const choiceKinds = ['dropdown', 'multiselect', 'user'];
const flip = (j: 'And' | 'Or'): 'And' | 'Or' => (j === 'And' ? 'Or' : 'And');

/** A step: round tinted badge, a heading whose first word carries the step colour, then its body. */
function Step({ icon, tone, badge, lead, rest, children }: {
  icon: React.ReactNode; tone: string; badge: string; lead: string; rest: string; children: React.ReactNode;
}) {
  return (
    <section className="flex items-start gap-2.5">
      <span className="flex flex-shrink-0 items-center rounded-full p-1" style={{ backgroundColor: badge, color: tone }}>{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-0.5">
        <h2 className="text-[13px] font-medium text-[#7B8FA5]"><span style={{ color: tone }}>{lead}</span> {rest}</h2>
        {children}
      </div>
    </section>
  );
}

/** The grey panel every step's body sits on — no border, 16px inside. */
const Panel = ({ children, invalid }: { children: React.ReactNode; invalid?: boolean }) => (
  <div className={`rounded-lg bg-[#F9FAFB] p-4 ${invalid ? 'ring-1 ring-[#FCA5A5]' : ''}`}>{children}</div>
);

/** The white bordered button with a plus — the empty-state CTA and "Add Condition Group". */
function OutlineAdd({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE5ED] bg-white py-1.5 pl-2 pr-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]">
      <Plus size={16} strokeWidth={1.75} /> {children}
    </button>
  );
}

/** The quiet "(+) Add …" link-button inside a card. */
function GhostAdd({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-md py-1 pl-2 pr-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#EEF2F6]">
      <Plus size={16} strokeWidth={1.75} /> {children}
    </button>
  );
}

function EmptyBlock({ title, text, cta, onClick }: { title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3.5 pt-1 text-center">
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[12px] font-medium leading-[18px] text-[#364658]">{title}</div>
        <p className="max-w-[320px] text-[11px] leading-[18px] text-[#7B8FA5]">{text}</p>
      </div>
      <OutlineAdd onClick={onClick}>{cta}</OutlineAdd>
    </div>
  );
}

/** The two 24px hover boxes at the end of every row. */
function RowTools({ onCopy, onDelete, copyTitle, deleteTitle }: { onCopy: () => void; onDelete: () => void; copyTitle: string; deleteTitle: string }) {
  const box = 'flex size-6 items-center justify-center rounded-md text-[#7B8FA5] transition-colors';
  return (
    <div className="flex flex-shrink-0 items-center gap-1">
      <button type="button" onClick={onCopy} title={copyTitle} className={`${box} hover:bg-[#EEF2F6] hover:text-[#364658]`}><Copy size={13} /></button>
      <button type="button" onClick={onDelete} title={deleteTitle} className={`${box} !text-[#F25C4E] hover:bg-[#FEF2F2]`}><Trash2 size={13} /></button>
    </div>
  );
}

/** "And ↻" — a bordered toggle that flips And / Or. */
function JoinToggle({ value, onChange }: { value: 'And' | 'Or'; onChange: (v: 'And' | 'Or') => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(flip(value))}
      title={`Joined with ${value} — click to switch to ${flip(value)}`}
      className="inline-flex h-[30px] items-center gap-1 rounded-md border border-[#DFE5ED] bg-white px-2 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#CBD5E1]"
    >
      {value} <RefreshCcw size={10} className="text-[#7B8FA5]" />
    </button>
  );
}

export function FormRuleEditor({ rule, rules, fields, onCancel, onSave, onOpenRule, startStep = 0 }: {
  /** The step to open on — 1 lands straight on the rule builder (a rule opened from another tab). */
  startStep?: number;
  /** The rule being edited, or undefined for a new one. */
  rule?: FormRule;
  /** Every saved rule, in run order — what conflicts and similar rules are measured against. */
  rules: FormRule[];
  fields: FormField[];
  /** Leave this editor for another rule's (after the dirty check). */
  onOpenRule: (id: string) => void;
  onCancel: () => void;
  onSave: (r: Omit<FormRule, 'id' | 'createdAt' | 'conflicts' | 'enabled'>) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => (rule ? toDraft(rule) : emptyDraft()));
  const initial = useMemo(() => JSON.stringify(rule ? toDraft(rule) : emptyDraft()), [rule]);
  const [tried, setTried] = useState(false);
  /** Where a confirmed leave goes: back to the list, or into another rule. */
  const [confirmLeave, setConfirmLeave] = useState<false | 'list' | string>(false);
  const [tab, setTab] = useState<InsightTab>('conflicts');
  const [hoverAction, setHoverAction] = useState<string | null>(null);
  const [flashAction, setFlashAction] = useState<string | null>(null);

  // ── version + rail state ──────────────────────────────────────────────────
  const [version, setVersionState] = useState<EditorVersion>(uiVersion);
  useEffect(() => {
    const on = () => setVersionState(uiVersion());
    window.addEventListener('form-rule-ui', on);
    return () => window.removeEventListener('form-rule-ui', on);
  }, []);
  const setVersion = (v: EditorVersion) => { setVersionState(v); store.set('formRuleVersion', v); };
  const [railOpen, setRailOpenState] = useState(() => store.get('formRuleRailOpen') !== '0');
  const setRailOpen = (v: boolean) => { setRailOpenState(v); store.set('formRuleRailOpen', v ? '1' : '0'); };
  const [railW, setRailW] = useState(() => Math.min(RAIL_MAX, Math.max(RAIL_MIN, Number(store.get('formRuleRailW')) || RAIL_DEFAULT)));
  /** Below 1200px the rail stops splitting the page and becomes an overlay, closed by default. */
  const [narrow, setNarrow] = useState(() => window.innerWidth < 1200);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [review, setReview] = useState<null | 'save' | 'view'>(null);
  /** Version H: a NEW rule starts on the trigger step until the admin chooses to create it. */
  const [hStarted, setHStarted] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [pulse, setPulse] = useState(false);
  /** Version I: the right panel is two tabs — Rule details · Rule check. */
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [iTab, setITab] = useState<'details' | 'check'>('details');
  /** Version B: which step is showing. */
  const [step, setStep] = useState(startStep);
  /** Version B2: 0 details · 1 build · 2 review. */
  const [step3, setStep3] = useState(0);
  /** Version P: a NEW rule opens on the name popup; the sidebar's Rule details start folded. */
  const [introDone, setIntroDone] = useState(!!rule);
  const [introTried, setIntroTried] = useState(false);
  const [pDetailsOpen, setPDetailsOpen] = useState(false);
  /** Version R: which sidebar a summary card opened. */
  const [relOpen, setRelOpen] = useState<null | 'conflicts' | 'similar'>(null);
  /** The rule-check intro is shown once ever, the first time a summary card appears. */
  /* Each summary card's info popup opens on its own the first time THAT card appears (once ever per
     card), and again from the card's ⓘ. One at a time: conflicts outranks similar rules, so its popup
     replaces the similar one; if both arrive together, similar's waits until conflicts' is closed. */
  const [intro, setIntro] = useState<null | 'conflicts' | 'similar'>(null);
  /* 'Seen' is remembered PER LAYOUT while layouts are being compared, so trying H1 after B3 still
     shows H1's own first-time popups beside its own cards. */
  const seenKey = (v: string, k: string) => RULE_CHECK_INTRO_KEY + ':' + v + ':' + k;
  const readSeen = (v: string) => {
    const read = (k: string) => { try { return localStorage.getItem(seenKey(v, k)) === '1'; } catch { return false; } };
    return { conflicts: read('conflicts'), similar: read('similar') };
  };
  const [introSeen, setIntroSeen] = useState(() => readSeen(version));
  useEffect(() => { setIntro(null); setIntroSeen(readSeen(version)); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeIntro = useCallback(() => setIntro(null), []);
  useEffect(() => { if (relOpen) setIntro(null); }, [relOpen]);
  /** R-family: open the conflicts sidebar straight on one field (from an action row's warning). */
  const [relField, setRelField] = useState<string | null>(null);
  /** RC: which checklist row is open for editing. */
  const [rcOpen, setRcOpen] = useState<string | null>(null);
  /** R: the resolve-help page takes the sidebar's whole header while it is open. */
  const [relHelp, setRelHelp] = useState(false);
  /** Version F: the bottom Problems dock. */
  const [dockOpen, setDockOpen] = useState(true);
  const [dockH, setDockH] = useState(() => Math.round(Math.min(300, Math.max(180, window.innerHeight * 0.3))));

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== initial;
  const ready = !!draft.event && !!draft.execution;

  const fieldById = (id: string) => fields.find((f) => f.id === id);
  const fieldOptions: SelectOption[] = fields.map((f) => ({ value: f.id, label: f.label, group: f.system ? 'System fields' : 'Custom fields' }));

  // ── conditions ────────────────────────────────────────────────────────────
  const setGroups = (fn: (g: ConditionGroup[]) => ConditionGroup[]) => setDraft((d) => ({ ...d, groups: fn(d.groups) }));
  const patchCond = (gid: string, cid: string, patch: Partial<Condition>) =>
    setGroups((gs) => gs.map((g) => (g.id !== gid ? g : { ...g, conditions: g.conditions.map((c) => (c.id === cid ? { ...c, ...patch } : c)) })));
  /** A group reads one way — every row after "Where" joins with the same word — so the connector
   *  on the second row is the group's switch and the rows below echo it. Mixing And and Or inside
   *  one group has no reading anybody agrees on; that is what a second group is for. */
  const setGroupJoin = (gid: string, join: 'And' | 'Or') =>
    setGroups((gs) => gs.map((g) => (g.id !== gid ? g : { ...g, conditions: g.conditions.map((c) => ({ ...c, join })) })));
  const addCond = (gid: string) =>
    setGroups((gs) => gs.map((g) => (g.id !== gid ? g : { ...g, conditions: [...g.conditions, blankCondition(g.conditions[1]?.join ?? 'And')] })));
  const copyCond = (gid: string, cid: string) =>
    setGroups((gs) => gs.map((g) => {
      if (g.id !== gid) return g;
      const i = g.conditions.findIndex((c) => c.id === cid);
      const c = g.conditions[i];
      const copy = { ...c, id: uid('c'), join: g.conditions[1]?.join ?? c.join, value: [...c.value] };
      return { ...g, conditions: [...g.conditions.slice(0, i + 1), copy, ...g.conditions.slice(i + 1)] };
    }));
  const removeCond = (gid: string, cid: string) =>
    setGroups((gs) => gs
      .map((g) => (g.id !== gid ? g : { ...g, conditions: g.conditions.filter((c) => c.id !== cid) }))
      .filter((g) => g.conditions.length > 0));
  const duplicateGroup = (gid: string) =>
    setGroups((gs) => {
      const i = gs.findIndex((g) => g.id === gid);
      const src = gs[i];
      const copy: ConditionGroup = { id: uid('g'), join: 'And', conditions: src.conditions.map((c) => ({ ...c, id: uid('c'), value: [...c.value] })) };
      return [...gs.slice(0, i + 1), copy, ...gs.slice(i + 1)];
    });

  // ── actions ───────────────────────────────────────────────────────────────
  const setActions = (fn: (a: RuleAction[]) => RuleAction[]) => setDraft((d) => ({ ...d, actions: fn(d.actions) }));
  const patchAction = (aid: string, patch: Partial<RuleAction>) => setActions((as) => as.map((a) => (a.id === aid ? { ...a, ...patch } : a)));
  const copyAction = (aid: string) => setActions((as) => {
    const i = as.findIndex((a) => a.id === aid);
    const copy = { ...as[i], id: uid('a'), fieldIds: [...as[i].fieldIds], value: [...as[i].value] };
    return [...as.slice(0, i + 1), copy, ...as.slice(i + 1)];
  });

  // ── validation ────────────────────────────────────────────────────────────
  const condIncomplete = (c: Condition) => !c.fieldId || !c.op || (!NO_VALUE.includes(c.op as never) && c.value.filter(Boolean).length === 0);
  const actionIncomplete = (a: RuleAction) => !a.type || a.fieldIds.length === 0 || (a.type === 'Set value' && a.value.filter(Boolean).length === 0);
  const errors = {
    name: !draft.name.trim() ? 'Give the rule a name' : '',
    applies: !draft.applies ? 'Choose who this rule applies to' : '',
    tags: draft.tags.length === 0 ? 'Add at least one tag' : '',
    event: !draft.event ? 'Choose when the rule runs' : '',
    execution: !draft.execution ? 'Choose where it executes' : '',
    conditions: draft.groups.some((g) => g.conditions.some(condIncomplete)) ? 'Finish or remove the highlighted conditions' : '',
    actions: draft.actions.length === 0 ? 'Add at least one action — a rule that does nothing cannot be saved'
      : draft.actions.some(actionIncomplete) ? 'Finish or remove the highlighted actions' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const err = (k: keyof typeof errors) => (tried ? errors[k] : '');

  const save = (force = false) => {
    setTried(true);
    if (!valid) {
      toast.error('A few things need attention before this rule can be saved');
      // Take the admin to the first problem rather than leaving them to hunt for it.
      requestAnimationFrame(() => document.querySelector('[data-form-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    /* Version G: nothing interrupts the build — the full picture arrives once, as the admin commits. */
    if (!force && (version === 'G' || version === 'G2') && (conflicts.length > 0 || similar.length > 0)) { setReview('save'); return; }
    onSave({ ...draft, applies: draft.applies as FormRule['applies'], event: draft.event as FormRule['event'], execution: draft.execution as FormRule['execution'] });
  };
  const leave = () => (dirty ? setConfirmLeave('list') : onCancel());
  /* Another rule (from the conflicts or similar-rules sidebar) opens in a NEW TAB, straight on its
     rule builder — this draft stays exactly as it is, so there is nothing to discard. */
  const openOther = (id: string) => {
    window.open(location.pathname + location.search + '#/admin/request-form-rules/' + encodeURIComponent(id), '_blank', 'noopener');
  };
  void onOpenRule;

  // ── rule check: measured live against the draft ───────────────────────────
  const selfIndex = rule ? rules.findIndex((r) => r.id === rule.id) : rules.length;
  const shape = { ...draft, id: rule?.id, name: draft.name || 'This rule' };
  /* Real checks first; the DEMO fallbacks make sure any condition shows Similar rules and any
     complete action shows Conflicts, so the prototype can be walked through with any input. */
  const conflicts = useMemo(() => { const real = findConflicts(shape, rules, fields, selfIndex); return real.length ? real : demoConflicts(shape, rules, fields); }, [draft, rules, fields]); // eslint-disable-line react-hooks/exhaustive-deps
  const similar = useMemo(() => { const real = findSimilar(shape, rules, fields); return real.length ? real : demoSimilar(shape, rules, fields); }, [draft, rules, fields]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ready || relOpen) return;
    const fresh = conflicts.length && !introSeen.conflicts ? 'conflicts' : similar.length && !introSeen.similar ? 'similar' : null;
    if (!fresh || !(intro === null || (fresh === 'conflicts' && intro === 'similar'))) return;
    setIntro(fresh);
    setIntroSeen((s) => ({ ...s, [fresh]: true }));
    try { localStorage.setItem(seenKey(version, fresh), '1'); } catch { /* private mode */ }
  }, [ready, relOpen, conflicts.length, similar.length, intro, introSeen, version]);
  const timeline = useMemo(() => runOrder(shape, rules, fields, conflicts, selfIndex), [draft, rules, fields, conflicts]); // eslint-disable-line react-hooks/exhaustive-deps
  const conditionLines = draft.groups.flatMap((g) => g.conditions).filter((x) => x.fieldId && x.op).map((x) => conditionText(x, fields));

  /* The rail follows what just appeared: a first conflict opens Conflicts, a first similar rule
     (with no conflicts to look at) opens Similar. It never pulls away from a tab the admin chose
     while something is already there. */
  const prev = useRef({ c: conflicts.length, s: similar.length });
  useEffect(() => {
    if (conflicts.length > 0 && prev.current.c === 0) setTab('conflicts');
    else if (similar.length > 0 && prev.current.s === 0 && conflicts.length === 0) setTab('similar');
    prev.current = { c: conflicts.length, s: similar.length };
  }, [conflicts.length, similar.length]);

  const jumpTo = (actionId: string) => {
    document.querySelector('[data-action-row="' + actionId + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashAction(actionId);
    window.setTimeout(() => setFlashAction((f) => (f === actionId ? null : f)), 1600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── value control for a condition or a Set-value action ───────────────────
  const valueControl = (f: FormField | undefined, value: string[], onChange: (v: string[]) => void, invalid: boolean, placeholder = 'Value') => {
    if (!f) return <div className="h-[30px] rounded-md border border-dashed border-[#DFE5ED] bg-white" />;
    if (f.kind === 'user') {
      return <RuleSelect compact multi value={value} onChange={onChange} invalid={invalid} placeholder="Select people" searchable
        options={PEOPLE.map((p) => ({ value: p.name, label: p.name, avatar: { initials: p.initials, color: p.color } }))} />;
    }
    if (choiceKinds.includes(f.kind)) {
      return <RuleSelect compact multi chip={f.kind === 'multiselect'} value={value} onChange={onChange} invalid={invalid} placeholder="Select values"
        options={(f.options ?? []).map((o) => ({ value: o, label: o }))} />;
    }
    const type = f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text';
    return (
      <input
        type={type}
        value={value[0] ?? ''}
        onChange={(e) => onChange([e.target.value])}
        placeholder={placeholder}
        className={`${rowInputCls} truncate ${invalid ? '!border-[#F25C4E]' : ''}`}
      />
    );
  };

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 1200);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const railVisible = narrow ? overlayOpen : railOpen;
  const openRail = (t?: InsightTab) => { if (t) setTab(t); if (narrow) setOverlayOpen(true); else setRailOpen(true); };
  const closeRail = () => (narrow ? setOverlayOpen(false) : setRailOpen(false));
  /* Folded rail + something new → the strip's badge pulses once. It never reopens itself: the
     space was given up on purpose. */
  const counts = useRef({ c: 0, s: 0 });
  useEffect(() => {
    const grew = conflicts.length > counts.current.c || similar.length > counts.current.s;
    counts.current = { c: conflicts.length, s: similar.length };
    if (grew && !railVisible) { setPulse(true); const t = window.setTimeout(() => setPulse(false), 2400); return () => window.clearTimeout(t); }
    return undefined;
  }, [conflicts.length, similar.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /** EG: markers measured off the rendered rows, so they line up whatever the rows' heights. */
  const gutterRef = useRef<HTMLDivElement>(null);
  const [gutterMarks, setGutterMarks] = useState<{ key: string; top: number; kind: 'c' | 's'; n: number }[]>([]);
  useLayoutEffect(() => {
    const box = gutterRef.current;
    if (version !== 'EG' || !box) { if (gutterMarks.length) setGutterMarks([]); return; }
    const top0 = box.getBoundingClientRect().top - box.scrollTop;
    const marks: { key: string; top: number; kind: 'c' | 's'; n: number }[] = [];
    const sim = box.querySelector('[data-gutter="check"]');
    if (sim && similar.length) marks.push({ key: 'sim', top: sim.getBoundingClientRect().top - top0, kind: 's', n: similar.length });
    draft.actions.forEach((a) => {
      const n = conflicts.filter((x) => x.actionId === a.id).length;
      const el = box.querySelector('[data-action-row="' + a.id + '"]');
      if (n && el) marks.push({ key: a.id, top: el.getBoundingClientRect().top - top0 + 4, kind: 'c', n });
    });
    if (JSON.stringify(marks) !== JSON.stringify(gutterMarks)) setGutterMarks(marks);
  });
  const prevConflicts = useRef(0);
  useEffect(() => {
    if (conflicts.length > prevConflicts.current) { setITab('check'); setTab('conflicts'); }
    prevConflicts.current = conflicts.length;
  }, [conflicts.length]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = railW;
    let w = w0;
    const move = (ev: MouseEvent) => { w = Math.min(RAIL_MAX, Math.max(RAIL_MIN, w0 + (x0 - ev.clientX))); setRailW(w); };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = '';
      store.set('formRuleRailW', String(w));
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /** Where "look at the similar rules" goes, per version. */
  /** Every "show me" link (inline Details, the similar banner, the footer chip) goes through here:
   *  each layout has its own home for the rule check. */
  const showCheck = (t: InsightTab) => {
    if (version === 'A' || version === 'A2' || version === 'H') return openRail(t);
    setTab(t);
    if (version === 'I') return setITab('check');
    if (version === 'C') return;
    if (version === 'F') return setDockOpen(true);
    if (version === 'P') return;
    if (SUMMARY.includes(version)) return setRelOpen(t === 'similar' ? 'similar' : 'conflicts');
    if (version === 'B') return setStep(1);
    if (version === 'B2') return setStep3(1);
    setReview('view');
  };
  const reviewSimilar = () => showCheck('similar');
  /** An action row's warning: A opens its rail on Conflicts with that FIELD brought forward and tinted;
      the summary layouts open the conflicts sidebar on that field. */
  const [railFocus, setRailFocus] = useState<{ field: string; n: number } | null>(null);
  const focusConflict = (field: string) => {
    if (version === 'A') { setTab('conflicts'); openRail('conflicts'); setRailFocus({ field, n: Date.now() }); return; }
    setRelField(field); setRelOpen('conflicts');
  };

  const similarBanner = similar.length > 0 && !SUMMARY.includes(version) && version !== 'A' && !(version === 'H' && !rule && !hStarted) && (
    /* Said where the duplicate is made: the moment these conditions match another rule's. */
    <div className="flex items-center gap-2.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
      <span className="size-1.5 flex-shrink-0 rounded-full bg-[#FBBF24]" />
      <p className="min-w-0 flex-1 text-[12px] text-[#92400E]">
        <span className="font-medium">{similar.length} rule{similar.length > 1 ? 's' : ''} already use{similar.length > 1 ? '' : 's'} this trigger and these conditions</span>
        {' — '}{similar.slice(0, 2).map((s) => s.rule.name).join(', ')}{similar.length > 2 ? ' +' + (similar.length - 2) : ''}. Consider adding your actions there instead.
      </p>
      <button type="button" onClick={reviewSimilar} className="flex-shrink-0 text-[12px] font-medium text-[#B45309] hover:underline">Review</button>
    </div>
  );

  const commonGroups = draft.groups.map((g) => ({ join: g.join, conds: g.conditions.filter((x) => x.fieldId && x.op).map((x) => ({ join: x.join, text: conditionText(x, fields) })) })).filter((g) => g.conds.length);
  const commonActions = draft.actions.filter((a) => a.type && a.fieldIds.length).flatMap((a) => a.fieldIds.map((f) => actionText(a.type, fieldById(f)?.label ?? f, a.value.join(', '))));
  const railProps = {
    focus: railFocus,
    common: { applies: APPLIES_OPTIONS.find((o) => o.value === draft.applies)?.label ?? '', groups: commonGroups, actions: commonActions },
    ready,
    hasActions: draft.actions.some((a) => a.type && a.fieldIds.length > 0),
    conflicts, similar, timeline, tab, onTab: setTab,
    triggerChips: { event: eventLabel(draft.event), execution: draft.execution },
    conditionLines,
    fieldLabel: (id: string) => fieldById(id)?.label ?? id,
    onJump: jumpTo,
    onHover: setHoverAction,
    onOpenRule: openOther,
    rules,
  };

  // ── the builder, as pieces every version can reuse ────────────────────────
  const identityEl = (<>
          {/* Identity */}
          <div className="flex flex-col gap-4 p-4 pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Rule name</FieldLabel>
                <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${err('name') ? '!border-[#F25C4E]' : ''}`} />
                <ErrorText>{err('name')}</ErrorText>
              </div>
              <div>
                <FieldLabel required>Select Rule Applicable for</FieldLabel>
                <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" invalid={!!err('applies')} />
                <ErrorText>{err('applies')}</ErrorText>
              </div>
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-16 resize-y py-1.5 leading-[1.36]`} />
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 items-center text-[12px] text-[#7B8FA5]">Add tag&nbsp;<span className="text-[#F25C4E]">*</span></span>
              <div className="flex-1">
                <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
                <ErrorText>{err('tags')}</ErrorText>
              </div>
            </div>
          </div>

  </>);
  /** B3 (and the hidden H layouts) ask who the rule is for beside WHEN it runs — the trigger, the
      execution and the audience together say when this rule applies (5 Oct 2026). */
  const appliesInWhen = ['A', 'B3', 'H1', 'H2', 'H3'].includes(version);
  const whenEl = (<>
            {/* WHEN */}
            <Step icon={<History size={12} />} tone="#3D8BD0" badge="#E2EDF5" lead="When" rest="this rule should run and when it should execute">
              <Panel>
                <div className={appliesInWhen ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 gap-4'}>
                  <div>
                    <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Select Rule Event <span className="text-[#F25C4E]">*</span></label>
                    <RuleSelect value={draft.event ? [draft.event] : []} onChange={([v]) => set({ event: v as FormRule['event'] })} options={EVENT_OPTIONS} placeholder="Choose an event" invalid={!!err('event')} />
                    <ErrorText>{err('event')}</ErrorText>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Execute on <span className="text-[#F25C4E]">*</span></label>
                    <RuleSelect value={draft.execution ? [draft.execution] : []} onChange={([v]) => set({ execution: v as FormRule['execution'] })} options={EXECUTION_OPTIONS} placeholder="Create, edit or both" invalid={!!err('execution')} />
                    <ErrorText>{err('execution')}</ErrorText>
                  </div>
                  {appliesInWhen && (
                    <div>
                      <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Select Rule Applicable for <span className="text-[#F25C4E]">*</span></label>
                      <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" invalid={!!err('applies')} />
                      <ErrorText>{err('applies')}</ErrorText>
                    </div>
                  )}
                </div>
              </Panel>
              {!ready && (
                <p className="text-[11px] text-[#7B8FA5]">Choose the event and where it executes — the conditions and actions open up once the rule knows when it runs.</p>
              )}
            </Step>

  </>);
  /** WHO — a step like When, so the column starts on the same icon rail. */
  const whoEl = (
    <Step icon={<Users size={12} />} tone="#7C5CC4" badge="#ECE6F7" lead="Who" rest="this rule applies to">
      <Panel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Select Rule Applicable for <span className="text-[#F25C4E]">*</span></label>
            <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" invalid={!!err('applies')} />
            <ErrorText>{err('applies')}</ErrorText>
          </div>
        </div>
      </Panel>
    </Step>
  );
  /** The rule's identity as a step: heading on the icon rail, fields in a grey panel. Without
   *  "applies to" when the layout gives that its own Who step. */
  const detailsStep = (withApplies: boolean, after?: React.ReactNode) => (
    <Step icon={<FileText size={12} />} tone="#64748B" badge="#EEF2F6" lead="Rule details" rest={withApplies ? '— its name, who it is for and its tags' : '— its name, description and tags'}>
      <Panel>
        <div className="flex flex-col gap-4">
          <div className={withApplies ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-2 gap-4'}>
            <div>
              <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Rule name <span className="text-[#F25C4E]">*</span></label>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${err('name') ? '!border-[#F25C4E]' : ''}`} />
              <ErrorText>{err('name')}</ErrorText>
            </div>
            {!withApplies && (
              <div>
                <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Tags <span className="text-[#F25C4E]">*</span></label>
                <div className="flex min-h-8 items-center"><TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} /></div>
                <ErrorText>{err('tags')}</ErrorText>
              </div>
            )}
            {withApplies && (
              <div>
                <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Select Rule Applicable for <span className="text-[#F25C4E]">*</span></label>
                <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" invalid={!!err('applies')} />
                <ErrorText>{err('applies')}</ErrorText>
              </div>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Description</label>
            <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-16 resize-y bg-white py-1.5 leading-[1.36]`} />
          </div>
          {withApplies && <div>
            <label className="mb-0.5 block text-[12px] text-[#7B8FA5]">Tags <span className="text-[#F25C4E]">*</span></label>
            <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
            <ErrorText>{err('tags')}</ErrorText>
          </div>}
        </div>
      </Panel>
      {after}
    </Step>
  );
  const checkEl = (<>
                {/* CHECK IF */}
                <Step icon={<Split size={14} className="rotate-180" />} tone="#F58518" badge="rgba(245,133,24,0.1)" lead="Check if" rest="these conditions match">
                  <Panel invalid={!!err('conditions')}>
                    {draft.groups.length === 0 ? (
                      <EmptyBlock title="No conditions yet" cta="Add Condition"
                        text="Add a condition to control when this rule applies. Without one, it runs on every matching event."
                        onClick={() => setGroups(() => [blankGroup()])} />
                    ) : (
                      <div className="flex flex-col items-start gap-3">
                        <div className="flex w-full flex-col">
                          {draft.groups.map((grp, gi) => {
                            const join = grp.conditions[1]?.join ?? 'And';
                            return (
                              <div key={grp.id}>
                                {gi > 0 && (
                                  /* Groups hang off a dashed spine with their connector on it. */
                                  <div className="relative h-16 w-[54px]">
                                    <span className="absolute bottom-0 left-[24px] top-0 border-l border-[#A5BAD0]" />
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                      <JoinToggle value={grp.join} onChange={(v) => setGroups((gs) => gs.map((g) => (g.id === grp.id ? { ...g, join: v } : g)))} />
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                  <span className="w-fit rounded-xl bg-[#EEF2F6] px-2 py-1 text-[10px] font-medium leading-[15px] text-[#7B8FA5]">Condition group {gi + 1}</span>
                                  <div className="flex flex-col gap-3 rounded-lg bg-white pb-2 pl-3 pr-2 pt-3">
                                    {grp.conditions.map((c, ci) => {
                                      const f = fieldById(c.fieldId);
                                      const bad = tried && condIncomplete(c);
                                      const needsValue = !!c.op && !NO_VALUE.includes(c.op as never);
                                      return (
                                        <div key={c.id} className="flex items-center gap-1.5">
                                          <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="w-[54px] flex-shrink-0">
                                              {ci === 0 ? (
                                                <span className="flex h-[30px] items-center justify-center text-[12px] font-medium text-[#7B8FA5]">Where</span>
                                              ) : ci === 1 ? (
                                                <JoinToggle value={join} onChange={(v) => setGroupJoin(grp.id, v)} />
                                              ) : (
                                                <span className="flex h-[30px] items-center justify-center rounded-md bg-[rgba(123,143,165,0.12)] px-2 text-[12px] font-medium text-[#7B8FA5]">{join}</span>
                                              )}
                                            </div>
                                            <div className="w-[120px] flex-shrink-0">
                                              <RuleSelect compact value={c.fieldId ? [c.fieldId] : []} options={fieldOptions} placeholder="Field" searchable invalid={bad && !c.fieldId}
                                                onChange={([v]) => patchCond(grp.id, c.id, { fieldId: v, op: operatorsFor(fieldById(v)!.kind)[0], value: [] })} />
                                            </div>
                                            <div className="w-[110px] flex-shrink-0">
                                              <RuleSelect compact value={c.op ? [c.op] : []} disabled={!f} placeholder="Operator" invalid={bad && !!f && !c.op}
                                                options={(f ? operatorsFor(f.kind) : []).map((o) => ({ value: o, label: o }))}
                                                onChange={([v]) => patchCond(grp.id, c.id, { op: v as Condition['op'], value: NO_VALUE.includes(v as never) ? [] : c.value })} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              {needsValue || !f
                                                ? valueControl(f, c.value, (value) => patchCond(grp.id, c.id, { value }), bad && needsValue && c.value.filter(Boolean).length === 0)
                                                : <span className="flex h-[30px] items-center px-1 text-[12px] text-[#7B8FA5]">No value needed</span>}
                                            </div>
                                          </div>
                                          <RowTools copyTitle="Duplicate condition" deleteTitle="Remove condition" onCopy={() => copyCond(grp.id, c.id)} onDelete={() => removeCond(grp.id, c.id)} />
                                        </div>
                                      );
                                    })}
                                    <div className="flex items-center justify-between">
                                      <GhostAdd onClick={() => addCond(grp.id)}>Add Condition</GhostAdd>
                                      <div className="flex items-center gap-3 pr-1 text-[12px]">
                                        <button type="button" onClick={() => duplicateGroup(grp.id)} className="text-[12px] text-[#3D8BD0] hover:underline">Duplicate group</button>
                                        <button type="button" onClick={() => setGroups((gs) => gs.filter((g) => g.id !== grp.id))} className="text-[12px] text-[#F25C4E] hover:underline">Remove group</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <OutlineAdd onClick={() => setGroups((gs) => [...gs, blankGroup()])}>Add Condition Group</OutlineAdd>
                      </div>
                    )}
                  </Panel>
                  <ErrorText>{err('conditions')}</ErrorText>
                  {similarBanner}
                </Step>

  </>);
  const thenEl = (<>
                {/* THEN */}
                <Step icon={<Workflow size={14} />} tone="#89C540" badge="#F3F9EC" lead="Then" rest="choose what the rule should do">
                  <Panel invalid={!!err('actions')}>
                    {draft.actions.length === 0 ? (
                      <EmptyBlock title="No actions yet" cta="Add Action" text="Add an action to define what this rule does when it runs."
                        onClick={() => setActions(() => [blankAction()])} />
                    ) : (
                      <div className="flex flex-col items-start gap-3 rounded-lg bg-white pb-2 pl-3 pr-2 pt-3">
                        {draft.actions.map((act) => {
                          const bad = tried && actionIncomplete(act);
                          const single = act.type === 'Set value';
                          const target = single ? fieldById(act.fieldIds[0]) : undefined;
                          const clashes = conflicts.filter((x) => x.actionId === act.id);
                          const lit = hoverAction === act.id || flashAction === act.id;
                          /* Summary layouts: the clash is said ON the row — the field is outlined and a warning sits beside it;
                             hovering the warning offers the field-wise conflicts sidebar. */
                          const rowWarn = clashes.length > 0 && (SUMMARY.includes(version) || version === 'A') && version !== 'EG';
                          const clashFields = [...new Set(clashes.map((x) => x.fieldId))];
                          return (
                            <div key={act.id} data-action-row={act.id} className={'-mx-1.5 w-[calc(100%+12px)] rounded-md px-1.5 py-1 transition-colors ' + (lit ? 'bg-[#FEF2F2] ring-1 ring-[#FCA5A5]' : rowWarn ? 'bg-[#FEF3F2]' : '')}>
                            <div className="flex w-full items-center gap-1.5">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="w-[120px] flex-shrink-0">
                                  <RuleSelect compact value={act.type ? [act.type] : []} placeholder="Action" invalid={bad && !act.type}
                                    options={ACTION_TYPES.map((t) => ({ value: t.value, label: t.value, hint: t.hint }))} menuWidth={260}
                                    onChange={([v]) => patchAction(act.id, { type: v as RuleAction['type'], fieldIds: v === 'Set value' ? act.fieldIds.slice(0, 1) : act.fieldIds, value: [] })} />
                                </div>
                                <div className={(single ? 'w-[200px] flex-shrink-0' : 'min-w-0 flex-1')}>
                                  <RuleSelect compact multi={!single} value={act.fieldIds} searchable invalid={bad && act.fieldIds.length === 0}
                                    placeholder={single ? 'Field to set' : 'Fields'}
                                    options={fields.filter((f) => !single || f.kind !== 'attachment').map((f) => ({ value: f.id, label: f.label, group: f.system ? 'System fields' : 'Custom fields' }))}
                                    onChange={(v) => patchAction(act.id, { fieldIds: v, value: single ? [] : act.value })} />
                                </div>
                                {single && (
                                  <div className="min-w-0 flex-1">
                                    {valueControl(target, act.value, (value) => patchAction(act.id, { value }), bad && act.value.filter(Boolean).length === 0, 'Value to set')}
                                  </div>
                                )}
                              </div>
                              {rowWarn && (
                                <HoverCard openDelay={120} closeDelay={150}>
                                  <HoverCardTrigger asChild>
                                    <button type="button" onClick={() => focusConflict(clashFields[0])} aria-label="Conflicts on this action"
                                      className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#D92D20] transition-colors hover:bg-[#FEF2F2]">
                                      <AlertTriangle size={16} />
                                    </button>
                                  </HoverCardTrigger>
                                  <HoverCardContent side="top" align="end" className="z-[10050] w-[280px] p-3">
                                    <div className="text-[13px] font-semibold text-[#B42318]">{clashes.length} conflict{clashes.length === 1 ? '' : 's'} on this action</div>
                                    <ul className="mt-1.5 flex flex-col gap-1">
                                      {clashFields.map((f) => (
                                        <li key={f}>
                                          <button type="button" onClick={() => focusConflict(f)}
                                            className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[12px] text-[#364658] transition-colors hover:bg-[#F5F7FA]">
                                            <span className="size-1.5 flex-shrink-0 rounded-full bg-[#F04438]" />
                                            <span className="min-w-0 flex-1 truncate">{fieldById(f)?.label ?? f}</span>
                                            <span className="text-[11px] text-[#7B8FA5]">{clashes.filter((x) => x.fieldId === f).length} rule{clashes.filter((x) => x.fieldId === f).length === 1 ? '' : 's'}</span>
                                            <ArrowUpRight size={12} className="text-[#3D8BD0]" />
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              <RowTools copyTitle="Duplicate action" deleteTitle="Remove action" onCopy={() => copyAction(act.id)} onDelete={() => setActions((as) => as.filter((x) => x.id !== act.id))} />
                            </div>
                            {clashes.length > 0 && version !== 'EG' && version !== 'A' && !SUMMARY.includes(version) && (
                              /* Said on the row that causes it; the detail is one click away in the rail. */
                              <div className="mt-1.5 flex flex-col gap-1 pl-1">
                                {clashes.map((x) => (
                                  <div key={x.key} className="flex items-center gap-1.5 text-[11px] leading-4">
                                    <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: KIND_TONE[x.kind].fg }} />
                                    <span className="font-medium" style={{ color: KIND_TONE[x.kind].fg }}>{x.kind}</span>
                                    <span className="min-w-0 truncate text-[#64748B]">— {x.other.name}: {x.theirs.charAt(0).toLowerCase() + x.theirs.slice(1)}</span>
                                    <button type="button" onClick={() => showCheck('conflicts')} className="flex-shrink-0 text-[11px] font-medium text-[#3D8BD0] hover:underline">Details</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            </div>
                          );
                        })}
                        <GhostAdd onClick={() => setActions((as) => [...as, blankAction()])}>Add Action</GhostAdd>
                      </div>
                    )}
                  </Panel>
                  <ErrorText>{err('actions')}</ErrorText>
                </Step>

  </>);
  const advancedEl = (<>
                {/* Advanced — indented to the steps' text column by an invisible badge-sized spacer. */}
                <div className="flex items-start gap-2.5">
                  <span className="w-6 flex-shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="text-[10px] font-medium text-[#7B8FA5]">Advanced behavior for this block</div>
                    <div className="flex items-start gap-1 rounded-lg bg-[#F9FAFB] p-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.36] text-[#364658]">
                        <p className="text-[13px] font-medium">Reverse when the condition is no longer true</p>
                        <p className="text-[11px] opacity-60">
                          {draft.groups.length
                            ? "Undo this block's action automatically when its conditions stop matching."
                            : 'Available once the rule has a condition — without one there is nothing to stop matching.'}
                        </p>
                      </div>
                      <StatusToggle on={draft.reverse && draft.groups.length > 0} disabled={draft.groups.length === 0} onChange={(reverse) => set({ reverse })} />
                    </div>
                  </div>
                </div>
  </>);

  /** The form keeps this width whether or not the rail is open — closing the rail gives the page
   *  room, it does not stretch the fields; the column is CENTRED in whatever space it has (1 Oct 2026). */
  const builder = (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
      {detailsStep(!appliesInWhen && !['A2', 'R', 'S'].includes(version))}
      {['A2', 'R', 'S'].includes(version) && whoEl}
      {whenEl}
      {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
    </div>
  );

  const badge = (n: number, tone: 'red' | 'amber') => (
    <span className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 ${n === 0 ? 'bg-[#EEF2F6] text-[#98A2B3]' : tone === 'red' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>{n}</span>
  );

  /** A strip count with an instant tooltip naming the rules behind it. */
  const stripTip = (title: string, names: string[], node: React.ReactNode) => (
    names.length ? (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild><span>{node}</span></TooltipTrigger>
        <TooltipContent side="left" className="text-wrap">
          <div className="mb-1 text-[11px] text-white/70">{title}</div>
          <ul className="space-y-1 text-xs">{names.map((t) => <li key={t} className="flex items-start gap-2"><span className="mt-[5px] size-1.5 flex-shrink-0 rounded-full bg-white/70" />{t}</li>)}</ul>
        </TooltipContent>
      </Tooltip>
    ) : <span>{node}</span>
  );
  /** The folded rail: a slim strip with the counts, always one click from coming back. */
  const railStrip = (
    <button
      type="button"
      onClick={() => openRail()}
      aria-label="Open the rule check — conflicts and similar rules"
      className={`flex w-9 flex-shrink-0 flex-col items-center gap-3 border-l border-[#DFE5ED] bg-[#F9FAFB] py-3 transition-colors hover:bg-[#F1F5F9] ${pulse ? 'animate-pulse' : ''}`}
    >
      <ChevronsLeft size={16} className="text-[#7B8FA5]" />
      <span className="rotate-180 text-[12px] font-medium text-[#364658] [writing-mode:vertical-rl]">Rule check</span>
      {ready && (<>{stripTip('Conflicting rules', [...new Set(conflicts.map((x) => x.other.name))], badge(conflicts.length, 'red'))}{stripTip('Similar rules', similar.map((s) => s.rule.name), badge(similar.length, 'amber'))}</>)}
    </button>
  );

  const splitBody = (
    <div className="relative flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
      {!narrow && railOpen && (
        /* A fixed rail at its widest (RAIL_MAX) — no resizer (6 Oct 2026, Zeni). It still folds to its edge strip. */
        <div className="relative flex flex-shrink-0" style={{ width: RAIL_MAX }}>
          <div className="min-w-0 flex-1"><FormRuleInsights {...railProps} onCollapse={closeRail} /></div>
        </div>
      )}
      {narrow && overlayOpen && (
        <>
          <div className="absolute inset-0 z-20 bg-[#0F172A]/10" onClick={closeRail} />
          <div className="absolute bottom-0 right-0 top-0 z-30 shadow-[-8px_0_24px_rgba(15,23,42,0.12)]" style={{ width: Math.min(railW, 440) }}>
            <FormRuleInsights {...railProps} onCollapse={closeRail} />
          </div>
        </>
      )}
      {!railVisible && railStrip}
    </div>
  );

  /** A's resizable rail, for the layouts that keep the rule check beside the builder. */
  const sideRail = (content: React.ReactNode) => (
    <div className="relative flex flex-shrink-0 border-l border-[#DFE5ED]" style={{ width: railW }}>
      <div
        onMouseDown={startResize}
        onDoubleClick={() => { setRailW(RAIL_DEFAULT); store.set('formRuleRailW', String(RAIL_DEFAULT)); }}
        title="Drag to resize · double-click to reset"
        className="group absolute -left-1 bottom-0 top-0 z-10 flex w-2 cursor-col-resize justify-center"
      >
        <span className="h-full w-0.5 transition-colors group-hover:bg-[#3D8BD0]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{content}</div>
    </div>
  );
  const logicEl = (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
      {whenEl}
      {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
    </div>
  );

  const detailsStepEl = (next: () => void) => (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
      {detailsStep(!appliesInWhen, (
        <div>
          <button type="button" onClick={next} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5]">Next: Build the rule</button>
        </div>
      ))}
    </div>
  );

  /* R: the two jobs stay apart — a conflict is resolved in its own sidebar (by rule / by field),
     a similar rule is guidance in another. The cards ride at the top of the builder. */
  const relBody = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 bg-white">
        <div className="mx-auto max-w-[880px] px-4 pb-1 pt-4">
          <RelatedSummaryCards ready={ready} conflicts={conflicts} similar={similar}
            onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />
        </div>
      </div>
      {builder}
    </div>
  );
  const relDrawer = SUMMARY.includes(version) && relOpen && (
    relOpen === 'conflicts' ? (
      <RelatedDrawer title="Resolve conflicts"
        onClose={() => { setRelOpen(null); setRelHelp(false); setRelField(null); }} hideHead={relHelp}>
        <FormRuleConflictReview key={relField ?? 'all'} sidebar initialMode={relField ? 'field' : 'rule'} initialSel={relField ?? undefined}
          onHelpChange={setRelHelp} onClose={() => { setRelOpen(null); setRelHelp(false); setRelField(null); }} conflicts={conflicts} rules={rules} currentExecution={draft.execution} fieldLabel={(id) => fieldById(id)?.label ?? id}
          onJump={(id) => { setRelOpen(null); requestAnimationFrame(() => jumpTo(id)); }} onOpenRule={openOther} />
      </RelatedDrawer>
    ) : (
      <RelatedDrawer title="Similar rules"
        onClose={() => setRelOpen(null)}>
        <SimilarRulesView similar={similar} fields={fields} conditionLines={conditionLines}
          conditionGroups={draft.groups.map((g) => ({ join: g.join, conds: g.conditions.filter((x) => x.fieldId && x.op).map((x) => ({ join: x.join, text: conditionText(x, fields) })) })).filter((g) => g.conds.length)}
          myActions={draft.actions.filter((a) => a.type && a.fieldIds.length).flatMap((a) => a.fieldIds.map((f) => actionText(a.type, fieldById(f)?.label ?? f, a.value.join(', '))))}
          draft={{ event: draft.event, execution: draft.execution, applies: draft.applies }} onOpenRule={openOther} />
      </RelatedDrawer>
    )
  );

  // ── H · start from the trigger ────────────────────────────────────────────
  const hStart = !rule && !hStarted;
  const startEl = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid max-w-[1180px] grid-cols-[minmax(0,1fr)_360px] items-start gap-6 p-4 pt-5">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-[14px] font-medium text-[#364658]">Start with what triggers the rule</h2>
            <p className="mt-0.5 text-[12px] leading-[1.6] text-[#7B8FA5]">Choose when it runs and what it checks. Rules that already do the same show on the right, so you can extend one instead of creating a duplicate.</p>
          </div>
          {whenEl}
          {ready && checkEl}
        </div>
        <aside className="sticky top-0 rounded-lg border border-[#DFE5ED] bg-white">
          <div className="border-b border-[#EEF2F6] px-4 py-3">
            <div className="text-[13px] font-medium text-[#364658]">Rules that already do this</div>
            <p className="text-[11px] text-[#7B8FA5]">Same event, overlapping create/edit, same conditions</p>
          </div>
          <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-3">
            {!ready ? (
              <p className="px-1 py-6 text-center text-[12px] text-[#7B8FA5]">Choose the event and where it executes first.</p>
            ) : conditionLines.length === 0 ? (
              <p className="px-1 py-6 text-center text-[12px] leading-[1.6] text-[#7B8FA5]">Add a condition — rules are matched on their trigger and conditions together.</p>
            ) : similar.length === 0 ? (
              <p className="px-1 py-6 text-center text-[12px] leading-[1.6] text-[#7B8FA5]">Nothing does this yet — this is a genuinely new rule.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {similar.map((s) => (
                  <div key={s.rule.id} className="rounded-lg bg-[#F9FAFB] p-3">
                    <div className="truncate text-[12px] font-semibold text-[#364658]">{s.rule.name}</div>
                    <div className="mt-0.5 text-[11px] text-[#7B8FA5]">{s.rule.applies} · {s.rule.execution}{s.rule.enabled ? '' : ' · Disabled'}</div>
                    <ul className="mt-2 space-y-0.5">
                      {[...s.common, ...s.others].slice(0, 4).map((t) => <li key={t} className="text-[12px] text-[#64748B]">• {t}</li>)}
                    </ul>
                    <button type="button" onClick={() => openOther(s.rule.id)} className="mt-2.5 inline-flex h-7 items-center gap-1 rounded-md border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
                      Add to this rule <ArrowUpRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-[#EEF2F6] p-3">
            <button type="button" disabled={!ready} onClick={() => setHStarted(true)}
              className="h-8 w-full rounded-md bg-[#3D8BD0] text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50">
              {similar.length ? 'Create a new rule anyway' : 'Continue to actions'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );

  // ── I · logic in the centre, details + rule check in a right panel ──────────
  /* The panel reads like a detail page's properties panel: what the rule IS on top, what it runs
     into underneath. The centre is left with only what the rule DOES. */
  /** The rule's identity, stacked for a narrow column. */
  const detailsFields = (
          <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
            <div>
              <FieldLabel required>Rule name</FieldLabel>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${err('name') ? '!border-[#F25C4E]' : ''}`} />
              <ErrorText>{err('name')}</ErrorText>
            </div>
            <div>
              <FieldLabel required>Select Rule Applicable for</FieldLabel>
              <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" invalid={!!err('applies')} />
              <ErrorText>{err('applies')}</ErrorText>
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-16 resize-y py-1.5 leading-[1.36]`} />
            </div>
            <div>
              <FieldLabel required>Tags</FieldLabel>
              <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
              <ErrorText>{err('tags')}</ErrorText>
            </div>
          </div>
  );

  /** I's Rule details tab — "who it is for" moved into the centre as the Who step. */
  const detailsFieldsNoWho = (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      <div>
        <FieldLabel required>Rule name</FieldLabel>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${err('name') ? '!border-[#F25C4E]' : ''}`} />
        <ErrorText>{err('name')}</ErrorText>
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-16 resize-y py-1.5 leading-[1.36]`} />
      </div>
      <div>
        <FieldLabel required>Tags</FieldLabel>
        <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
        <ErrorText>{err('tags')}</ErrorText>
      </div>
    </div>
  );
  const detailsPanel = sideRail(
    <>
      {/* Two tabs, the product's inline tab treatment. A new conflict turns it to Rule check. */}
      <div className="flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-4">
        {([['details', 'Rule details'], ['check', 'Rule check']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setITab(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors ${iTab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}>
            {label}
            {id === 'details' && (err('name') || err('tags')) && <span className="size-1.5 rounded-full bg-[#F25C4E]" title="Needs attention" />}
            {id === 'check' && ready && conflicts.length > 0 && <span className="rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-semibold text-[#DC2626]">{conflicts.length}</span>}
          </button>
        ))}
      </div>
      {iTab === 'details'
        ? <div className="min-h-0 flex-1 overflow-y-auto pt-3">{detailsFieldsNoWho}</div>
        : <div className="min-h-0 flex-1"><FormRuleInsights {...railProps} bare hideHead pillTabs /></div>}
    </>
  );

  const panelBody = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          {whoEl}
          {whenEl}
          {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
        </div>
      </div>
      {detailsPanel}
    </div>
  );

  // ── B · guided stepper ────────────────────────────────────────────────────
  const detailsDone = !!draft.name.trim() && (appliesInWhen || !!draft.applies) && draft.tags.length > 0;
  const actionsDone = draft.actions.length > 0 && !draft.actions.some(actionIncomplete);
  const STEPS = [
    { label: 'Rule details', hint: appliesInWhen ? 'Name, description, tags' : 'Name, who it is for, tags', done: detailsDone, locked: false },
    { label: 'Build the rule', hint: appliesInWhen ? 'When, who, conditions and actions' : 'When, conditions and actions', done: ready && actionsDone && (!appliesInWhen || !!draft.applies), locked: false },
  ];
  const summaryLines = [
    draft.event ? eventLabel(draft.event) + ' · ' + (draft.execution || '…') + ' · ' + (draft.applies || '…') : null,
    conditionLines.length ? 'If ' + conditionLines.join(' and ') : 'Runs on every matching event',
    ...draft.actions.filter((a) => a.type && a.fieldIds.length).map((a) => a.fieldIds.map((f) => actionText(a.type, fieldById(f)?.label ?? f, a.value.join(', '))).join(', ')),
  ].filter(Boolean) as string[];
  const stepperBody = (
    <div className="flex min-h-0 flex-1">
      <nav className="flex w-[220px] flex-shrink-0 flex-col gap-1 border-r border-[#DFE5ED] bg-[#FAFBFC] p-3">
        {STEPS.map((s, i) => (
          <button key={s.label} type="button" onClick={() => setStep(i)}
            className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${step === i ? 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'hover:bg-[#F1F5F9]'}`}>
            <span className={`mt-px flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${s.done && step !== i ? 'bg-[#89C540] text-white' : step === i ? 'bg-[#3D8BD0] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
              {s.done && step !== i ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-[#364658]">
                {s.label}
                {i === 1 && ready && conflicts.length > 0 && <span className="ml-1.5 rounded-sm bg-[#FEF2F2] px-1 text-[10px] text-[#DC2626]">{conflicts.length}</span>}
              </span>
              <span className="block text-[11px] text-[#7B8FA5]">{s.hint}</span>
            </span>
          </button>
        ))}
      </nav>
      {/* Both steps share one frame (column + rail), so switching step swaps the content in place
          instead of re-centring it in a different width. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 0 ? (
          detailsStepEl(() => setStep(1))
        ) : logicEl}
      </div>
      {sideRail(<FormRuleInsights {...railProps} bare />)}
    </div>
  );

  /** The cards, only once something is found, one per row for a narrow column. */
  const stackedCards = (
    <RelatedSummaryCards onlyFound stack ready={ready} conflicts={conflicts} similar={similar}
      intro={intro} onInfo={setIntro} onCloseIntro={closeIntro}
      onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />
  );
  const hasFindings = ready && (conflicts.length > 0 || similar.length > 0);

  // ── B3 · B's steps in a wider column, the summary docked at its foot ──────
  const b3Body = (
    <div className="flex min-h-0 flex-1">
      {/* B2's stepper, stood on end: badge + label pills joined by a connector, no panel behind them. */}
      <nav className="flex w-[380px] flex-shrink-0 flex-col bg-white">
        <ol className="flex flex-col gap-6 p-4">
          {STEPS.map((s, i) => {
            const on = step === i;
            const done = s.done && !on;
            return (
              <li key={s.label} className="relative flex flex-col">
                {/* The divider joins this step to the next. Beside a SELECTED card it stops 2px short of the card;
                    an unselected card has no fill, so the line runs on through its empty padding to 2px from the badge.
                    Geometry: badge = 10px padding + 1px + 24px (so its bottom is 35px down, its top 11px down); cards are 24px apart. */}
                {i < STEPS.length - 1 && (
                  <span className={`absolute left-[21.5px] z-10 w-px ${s.done ? 'bg-[#89C540]' : 'bg-[#DFE5ED]'}`}
                    style={{ top: on ? 'calc(100% + 2px)' : 37, bottom: step === i + 1 ? -22 : -33 }} />
                )}
                <button type="button" onClick={() => setStep(i)}
                  className={`flex w-full items-start gap-2.5 rounded-md p-2.5 text-left transition-colors ${on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
                  <span className={`mt-px flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done ? 'bg-[#89C540] text-white' : on ? 'bg-[#3D8BD0] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className={`text-[13px] font-medium ${on ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{s.label}</span>
                      {i === 1 && ready && conflicts.length > 0 && <span className="rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-semibold text-[#DC2626]">{conflicts.length}</span>}
                    </span>
                    <span className="block text-[11px] text-[#7B8FA5]">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {/* Docked at the foot, and only once there is something to report. */}
        {/* Nothing found yet: an "all clear" state, so the corner reads as a check that is running. */}
        {!hasFindings && (
          <div className="mt-auto flex flex-col gap-2 p-4">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Rule check</span>
            <RuleCheckEmpty />
          </div>
        )}
        {hasFindings && (
          <div className="relative mt-auto flex flex-col gap-2 p-4">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Rule check</span>
            {stackedCards}
          </div>
        )}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto [&>div]:mx-0 [&>div]:pb-4 [&>div]:pl-6 [&>div]:pr-4 [&>div]:pt-4">
        {step === 0 ? detailsStepEl(() => setStep(1)) : logicEl}
      </div>
    </div>
  );

  // ── H1 / H2 / H3 · the steps across the top, the form left-aligned under them ──
  /* The stepper and the form share ONE left edge (24px), so the steps read as the form's own heading.
     Only where the summary cards live changes between the three. */
  const hsStepper = (
    <ol className="flex flex-shrink-0 items-center gap-3 px-6 pb-2 pt-4">
      {STEPS.map((s, i) => {
        const on = step === i;
        const done = s.done && !on;
        return (
          <li key={s.label} className="flex items-center gap-3">
            {i > 0 && <span className={`h-px w-10 ${STEPS[i - 1].done ? 'bg-[#89C540]' : 'bg-[#DFE5ED]'}`} />}
            <button type="button" onClick={() => setStep(i)}
              className={`flex items-start gap-2.5 rounded-md p-2.5 text-left transition-colors ${on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
              <span className={`mt-px flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done ? 'bg-[#89C540] text-white' : on ? 'bg-[#3D8BD0] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                {done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`whitespace-nowrap text-[13px] font-medium ${on ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{s.label}</span>
                  {i === 1 && ready && conflicts.length > 0 && <span className="rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-semibold text-[#DC2626]">{conflicts.length}</span>}
                </span>
                <span className="block whitespace-nowrap text-[11px] text-[#7B8FA5]">{s.hint}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
  /* The step's own content, left-aligned at the stepper's edge: the shared column drops its centring
     and its 16px side padding becomes 24px (the stepper starts at 24px; its cards then pad 10px). */
  const hsMain = (
    <div className="min-h-0 flex-1 overflow-y-auto [&>div]:mx-0 [&>div]:px-6">
      {step === 0 ? detailsStepEl(() => setStep(1)) : logicEl}
    </div>
  );
  const hsCards = (side: 'left' | 'right', align: 'top' | 'bottom') => (
    <RelatedSummaryCards onlyFound stack ready={ready} conflicts={conflicts} similar={similar}
      intro={intro} onInfo={setIntro} onCloseIntro={closeIntro} introSide={side} introAlign={align}
      onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />
  );
  const hsLabel = <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Rule check</span>;
  const hsBody = (where: 'top' | 'bottom' | 'float') => (
    <div className="relative flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {hsStepper}
        {hsMain}
      </div>
      {where !== 'float' && hasFindings && (
        <aside className="flex w-[340px] flex-shrink-0 flex-col bg-white">
          <div className={`relative flex flex-col gap-2 p-6 ${where === 'bottom' ? 'mt-auto' : ''}`}>
            {hsLabel}
            {hsCards('left', where)}
          </div>
        </aside>
      )}
      {where === 'float' && hasFindings && (
        <div className="absolute bottom-6 right-6 z-30 flex w-[300px] flex-col gap-2 rounded-xl border border-[#E5EAF0] bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
          {hsLabel}
          {hsCards('left', 'bottom')}
        </div>
      )}
    </div>
  );

  // ── A3 / A3R · a details sidebar with the summary under it ─────────────────
  const a3Side = (side: 'left' | 'right') => (
    <aside className={`flex w-[380px] flex-shrink-0 flex-col overflow-y-auto bg-white ${side === 'left' ? 'border-r' : 'border-l'} border-[#DFE5ED]`}>
      <div className="flex flex-shrink-0 items-center px-4 pb-1 pt-4">
        <span className="text-[13px] font-semibold text-[#364658]">Rule details</span>
      </div>
      {detailsFieldsNoWho}
      {hasFindings && (
        <div className="mt-auto flex flex-col gap-2 border-t border-[#DFE5ED] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Rule check</span>
          {stackedCards}
        </div>
      )}
    </aside>
  );
  const centreWho = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
        {whoEl}
        {whenEl}
        {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
      </div>
    </div>
  );
  const a3Body = <div className="flex min-h-0 flex-1">{a3Side('left')}{centreWho}</div>;
  const a3rBody = <div className="flex min-h-0 flex-1">{centreWho}{a3Side('right')}</div>;

  const cardsRow = <RelatedSummaryCards onlyFound ready={ready} conflicts={conflicts} similar={similar} onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />;
  const logicWho = (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
      {whoEl}
      {whenEl}
      {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
    </div>
  );

  // ── LS · live summary: write on the left, read it back on the right ───────
  const sentence = (
    <div className="flex flex-col gap-2 text-[13px] leading-[1.6] text-[#364658]">
      {!ready ? (
        <p className="text-[#98A2B3]">Choose when the rule runs and the sentence starts here.</p>
      ) : (<>
        <p>
          <b className="font-medium">{eventLabel(draft.event)}</b>, on <b className="font-medium">{draft.execution.replace(/^On /, '').toLowerCase()}</b>,
          {' '}for <b className="font-medium">{(draft.applies || 'whoever it applies to').toLowerCase()}</b>
          {conditionLines.length ? <>, if <b className="font-medium">{conditionLines.join(' and ')}</b></> : null}
          {similar.length > 0 && <span title={similar.length + ' rules already use this trigger'} className="ml-1 rounded-sm bg-[#FFFBEB] px-1 text-[11px] font-medium text-[#B45309]">⧉ {similar.length} similar</span>}:
        </p>
        {draft.actions.filter((a) => a.type && a.fieldIds.length).length === 0
          ? <p className="text-[#98A2B3]">…then add what it should do.</p>
          : (
            <ul className="flex flex-col gap-1">
              {draft.actions.filter((a) => a.type && a.fieldIds.length).flatMap((a) => a.fieldIds.map((f) => {
                const n = conflicts.filter((x) => x.actionId === a.id && x.fieldId === f).length;
                return (
                  <li key={a.id + f} className="flex items-start gap-2">
                    <span className={'mt-[9px] size-1 flex-shrink-0 rounded-full ' + (n ? 'bg-[#DC2626]' : 'bg-[#98A2B3]')} />
                    <span className="min-w-0 flex-1">{actionText(a.type, fieldById(f)?.label ?? f, a.value.join(', '))}</span>
                    {n > 0 && <button type="button" onClick={() => setRelOpen('conflicts')} className="flex-shrink-0 rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-medium text-[#DC2626] hover:underline">⚠ {n}</button>}
                  </li>
                );
              }))}
            </ul>
          )}
      </>)}
    </div>
  );
  const lsBody = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">{logicWho}</div>
      <aside className="flex w-[400px] flex-shrink-0 flex-col overflow-y-auto border-l border-[#DFE5ED] bg-[#FAFBFC]">
        <div className="flex flex-col gap-1 px-5 pb-4 pt-5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Rule summary</span>
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Untitled rule"
            className={`-mx-1.5 mt-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[17px] font-semibold text-[#1D2A3E] placeholder:text-[#C3CCD8] hover:border-[#E2E8F0] focus:border-[#3D8BD0] focus:bg-white focus:outline-none ${err('name') ? '!border-[#F25C4E]' : ''}`} />
          <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Add a description" rows={2}
            className="-mx-1.5 resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] leading-[1.55] text-[#64748B] placeholder:text-[#C3CCD8] hover:border-[#E2E8F0] focus:border-[#3D8BD0] focus:bg-white focus:outline-none" />
          <div className="mt-1"><TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} /></div>
          {(err('name') || err('tags')) && <p className="text-[12px] text-[#F25C4E]">{err('name') || err('tags')}</p>}
        </div>
        <div className="border-t border-[#E8EDF3] px-5 py-4">{sentence}</div>
        {ready && (conflicts.length > 0 || similar.length > 0) && (
          <div className="mt-auto flex flex-col gap-2.5 border-t border-[#E8EDF3] px-5 py-4">
            <RelatedSummaryCards onlyFound stack ready={ready} conflicts={conflicts} similar={similar} onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />
          </div>
        )}
      </aside>
    </div>
  );

  // ── RC · readiness checklist ──────────────────────────────────────────────
  const [rcOpenKey, setRcOpenKey] = [rcOpen, setRcOpen];
  const rcRows: { key: string; label: string; done: boolean; warn?: boolean; value: React.ReactNode; edit?: React.ReactNode; onGo?: () => void; action?: string }[] = [
    { key: 'name', label: 'Name', done: !!draft.name.trim(), value: draft.name || 'Not set',
      edit: <input autoFocus value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={inputCls} /> },
    { key: 'who', label: 'Who it applies to', done: !!draft.applies, value: draft.applies || 'Not set',
      edit: <RuleSelect value={draft.applies ? [draft.applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} options={APPLIES_OPTIONS} placeholder="Choose people" /> },
    { key: 'tags', label: 'Tags', done: draft.tags.length > 0, value: draft.tags.length ? draft.tags.join(', ') : 'None yet',
      edit: <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} /> },
    { key: 'trigger', label: 'Trigger', done: ready, value: ready ? eventLabel(draft.event) + ' · ' + draft.execution : 'Choose when it runs',
      onGo: () => document.querySelector('[data-rc="when"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
    { key: 'actions', label: 'Actions', done: actionsDone, value: draft.actions.filter((a) => a.type).length ? draft.actions.filter((a) => a.type).length + ' action' + (draft.actions.filter((a) => a.type).length === 1 ? '' : 's') : 'None yet',
      onGo: () => document.querySelector('[data-rc="then"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
    { key: 'conflicts', label: ready && conflicts.length ? conflicts.length + ' conflict' + (conflicts.length === 1 ? '' : 's') : 'No conflicts', done: ready && conflicts.length === 0,
      value: ready ? (conflicts.length ? (['Blocking', 'Opposite', 'Override'] as const).map((k) => { const n = conflicts.filter((x) => x.kind === k).length; return n ? n + ' ' + k : null; }).filter(Boolean).join(' · ') : 'No other rule fights this one') : 'Checked once it has a trigger',
      onGo: ready && conflicts.length ? () => setRelOpen('conflicts') : undefined, action: 'Fix' },
    { key: 'similar', label: ready && similar.length ? similar.length + ' similar rule' + (similar.length === 1 ? '' : 's') : 'No similar rules', done: ready && similar.length === 0, warn: ready && similar.length > 0,
      value: ready ? (similar.length ? 'Consider updating one instead' : 'This is a new rule') : 'Checked once it has a trigger',
      onGo: ready && similar.length ? () => setRelOpen('similar') : undefined, action: 'Review' },
  ];
  const rcDone = rcRows.filter((r) => r.done).length;
  const rcBody = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          <div data-rc="when" className="scroll-mt-4">{whenEl}</div>
          {ready && (<>{checkEl}<div data-rc="then" className="scroll-mt-4">{thenEl}</div>{advancedEl}</>)}
        </div>
      </div>
      <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white">
        <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="text-[14px] font-semibold text-[#1D2A3E]">Ready to save?</span>
          <span className="ml-auto text-[12px] font-medium tabular-nums text-[#64748B]">{rcDone} / {rcRows.length}</span>
        </div>
        <div className="mx-5 mb-2 h-1 flex-shrink-0 overflow-hidden rounded-full bg-[#EEF2F6]">
          <div className="h-full rounded-full bg-[#89C540] transition-[width]" style={{ width: (rcDone / rcRows.length) * 100 + '%' }} />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {rcRows.map((r) => {
            const open = rcOpenKey === r.key && !!r.edit;
            const bad = !r.done && (r.key === 'conflicts');
            return (
              <li key={r.key} className="border-b border-[#F1F5F9] last:border-b-0">
                <button type="button" onClick={() => (r.edit ? setRcOpenKey(open ? null : r.key) : r.onGo?.())}
                  className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-[#F7F9FB]">
                  <span className={'mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ' + (r.done ? 'bg-[#ECFDF3] text-[#12B76A]' : bad ? 'bg-[#FEF2F2] text-[#DC2626]' : r.warn ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#F1F5F9] text-[#98A2B3]')}>
                    {r.done ? <Check size={12} strokeWidth={3} /> : bad ? '!' : r.warn ? '!' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={'block text-[13px] font-medium ' + (bad ? 'text-[#DC2626]' : r.warn ? 'text-[#B45309]' : 'text-[#1D2A3E]')}>{r.label}</span>
                    <span className="block truncate text-[12px] text-[#7B8FA5]">{r.value}</span>
                  </span>
                  {r.onGo && r.action && <span className={'mt-0.5 flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium ' + (bad ? 'text-[#DC2626]' : 'text-[#B45309]')}>{r.action} <ChevronRight size={13} /></span>}
                  {r.edit && <ChevronRight size={14} className={'mt-1 flex-shrink-0 text-[#98A2B3] transition-transform ' + (open ? 'rotate-90' : '')} />}
                </button>
                {open && <div className="px-2 pb-3 pl-10">{r.edit}</div>}
              </li>
            );
          })}
          <li className="px-2 pt-2">
            <span className="text-[11px] text-[#98A2B3]">Description (optional)</span>
            <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="What this rule is for" className={`${inputCls} mt-1 h-14 resize-y py-1.5 leading-[1.4]`} />
          </li>
        </ul>
        <div className="flex-shrink-0 border-t border-[#E8EDF3] p-4">
          <button type="button" onClick={() => save()} className="h-9 w-full rounded-md bg-[#3D8BD0] text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">
            {rcDone === rcRows.length ? 'Save rule' : 'Save rule anyway'}
          </button>
        </div>
      </aside>
    </div>
  );

  // ── EG · editor gutter ────────────────────────────────────────────────────
  const egBody = (
    <div ref={gutterRef} className="relative min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[940px] flex-col gap-6 py-5 pb-8 pl-[60px] pr-4">
        {ready && (conflicts.length > 0 || similar.length > 0) && cardsRow}
        {detailsStep(false)}
        {whoEl}
        {whenEl}
        {ready && (<><div data-gutter="check">{checkEl}</div>{thenEl}{advancedEl}</>)}
      </div>
      {/* The gutter: a marker beside every row that has an issue. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0">
        <div className="relative mx-auto h-full max-w-[940px]">
          <div className="absolute bottom-0 left-[44px] top-0 w-px bg-[#EEF2F6]" />
          {gutterMarks.map((m) => (
            <button key={m.key} type="button" onClick={() => setRelOpen(m.kind === 'c' ? 'conflicts' : 'similar')}
              title={m.kind === 'c' ? m.n + ' conflict' + (m.n === 1 ? '' : 's') + ' on this action' : m.n + ' similar rule' + (m.n === 1 ? '' : 's') + ' share this trigger'}
              className={'pointer-events-auto absolute left-2 inline-flex h-5 min-w-[32px] items-center justify-center gap-0.5 rounded px-1 text-[11px] font-semibold tabular-nums transition-transform hover:scale-105 ' + (m.kind === 'c' ? 'bg-[#FEF2F2] text-[#DC2626] ring-1 ring-[#FECACA]' : 'bg-[#FFFBEB] text-[#B45309] ring-1 ring-[#FDE68A]')}
              style={{ top: m.top }}>
              {m.kind === 'c' ? '⚠' : '⧉'} {m.n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── HF · horizontal flow ──────────────────────────────────────────────────
  /* The steps keep their own controls; their headings give way to the column heads. */
  const hfCol = (label: string, tone: string, body: React.ReactNode, chip?: React.ReactNode) => (
    <section className="flex min-h-0 min-w-0 flex-col rounded-lg border border-[#E8EDF3] bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EEF2F6] px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tone }}>{label}</span>
        <span className="ml-auto">{chip}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [&_.grid-cols-2]:grid-cols-1 [&_.min-w-0.flex-1.items-center.gap-2]:flex-wrap [&_.min-w-0.flex-1.items-center.gap-2>.min-w-0.flex-1]:min-w-[160px] [&_section>div>h2]:hidden [&_section>span]:hidden">{body}</div>
    </section>
  );
  const hfBody = (
    <div className="flex min-h-0 flex-1 flex-col gap-3 bg-[#F6F8FB] p-4">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 rounded-lg border border-[#E8EDF3] bg-white px-4 py-3">
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name"
          className={`h-8 min-w-[220px] flex-1 rounded-md border border-transparent bg-transparent px-2 text-[15px] font-semibold text-[#1D2A3E] placeholder:text-[#C3CCD8] hover:border-[#E2E8F0] focus:border-[#3D8BD0] focus:outline-none ${err('name') ? '!border-[#F25C4E]' : ''}`} />
        <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
        {ready && conflicts.length > 0 && (
          <button type="button" onClick={() => setRelOpen('conflicts')} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF6F6] px-2.5 text-[12px] font-medium text-[#DC2626]"><span className="size-1.5 rounded-full bg-[#DC2626]" />{conflicts.length} conflicts</button>
        )}
        {ready && similar.length > 0 && (
          <button type="button" onClick={() => setRelOpen('similar')} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2.5 text-[12px] font-medium text-[#B45309]"><span className="size-1.5 rounded-full bg-[#F59E0B]" />{similar.length} similar</button>
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(170px,0.6fr)_minmax(200px,0.7fr)_minmax(480px,1.7fr)_minmax(480px,1.7fr)] gap-3 overflow-x-auto">
        {hfCol('Who', '#7C5CC4', whoEl)}
        {hfCol('When', '#3D8BD0', whenEl)}
        {hfCol('If', '#F58518', ready ? checkEl : <p className="text-[12px] text-[#98A2B3]">Choose when it runs first.</p>,
          ready && similar.length > 0 ? <button type="button" onClick={() => setRelOpen('similar')} className="rounded-sm bg-[#FFFBEB] px-1.5 text-[11px] font-medium text-[#B45309]">⧉ {similar.length} similar</button> : undefined)}
        {hfCol('Then', '#89C540', ready ? <div className="flex flex-col gap-4">{thenEl}{advancedEl}</div> : <p className="text-[12px] text-[#98A2B3]">Choose when it runs first.</p>,
          ready && conflicts.length > 0 ? <button type="button" onClick={() => setRelOpen('conflicts')} className="rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-medium text-[#DC2626]">⚠ {conflicts.length}</button> : undefined)}
      </div>
    </div>
  );

  // ── B2 · three steps ───────────────────────────────────────────────────────
  /* Details are a separate thought from logic; everything that makes up the logic — trigger,
     conditions, actions and what they run into — is one step, because a clash is only
     understood next to the rows that cause it. */
  const B2_STEPS = [
    { label: 'Rule details', done: detailsDone, locked: false },
    { label: 'Build the rule', done: ready && actionsDone, locked: false },
  ];
  const b2Bar = (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#DFE5ED] px-4 py-2.5">
      {B2_STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          {i > 0 && <span className={`h-px w-12 ${B2_STEPS[i - 1].done ? 'bg-[#89C540]' : 'bg-[#DFE5ED]'}`} />}
          <button type="button" disabled={s.locked} onClick={() => setStep3(i)} title={s.locked ? 'Choose when the rule runs first' : undefined}
            className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${step3 === i ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
            <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${s.done && step3 !== i ? 'bg-[#89C540] text-white' : step3 === i ? 'bg-[#3D8BD0] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
              {s.done && step3 !== i ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-[13px] font-medium ${step3 === i ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{s.label}</span>
            {i === 1 && ready && conflicts.length > 0 && <span className="rounded-sm bg-[#FEF2F2] px-1.5 text-[11px] font-semibold text-[#DC2626]">{conflicts.length}</span>}
          </button>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-2">
        {step3 > 0 && <button type="button" onClick={() => setStep3(step3 - 1)} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Back</button>}
      </div>
    </div>
  );
  const b2Body = (
    <div className="flex min-h-0 flex-1 flex-col">
      {b2Bar}
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step3 === 0 ? (
            detailsStepEl(() => setStep3(1))
          ) : logicEl}
        </div>
        {sideRail(<FormRuleInsights {...railProps} bare />)}
      </div>
    </div>
  );

  // ── P · name first ───────────────────────────────────────────────────────
  /* Who the rule is for decides what it may do, so it opens the rule in the centre; the rest of the
     identity was answered in the popup and only needs a way back, folded in the sidebar. */
  const pDetailsFields = (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      <div>
        <FieldLabel required>Rule name</FieldLabel>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${err('name') ? '!border-[#F25C4E]' : ''}`} />
        <ErrorText>{err('name')}</ErrorText>
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-16 resize-y py-1.5 leading-[1.36]`} />
      </div>
      <div>
        <FieldLabel required>Tags</FieldLabel>
        <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={!!err('tags')} />
        <ErrorText>{err('tags')}</ErrorText>
      </div>
    </div>
  );
  const pBody = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          {whoEl}
          {whenEl}
          {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
        </div>
      </div>
      {sideRail(<>
        <div className="flex-shrink-0">
          <button type="button" onClick={() => setPDetailsOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#F9FAFB]">
            <span className="text-[13px] font-medium text-[#364658]">Rule details</span>
            {!pDetailsOpen && draft.name && <span className="min-w-0 truncate text-[12px] text-[#7B8FA5]">· {draft.name}</span>}
            {(err('name') || err('tags')) && <span className="size-1.5 flex-shrink-0 rounded-full bg-[#F25C4E]" title="Needs attention" />}
            <ChevronRight size={16} className={`ml-auto flex-shrink-0 text-[#7B8FA5] transition-transform ${pDetailsOpen ? 'rotate-90' : ''}`} />
          </button>
          {pDetailsOpen && <div className="max-h-[46vh] overflow-y-auto">{pDetailsFields}</div>}
        </div>
        <div className="min-h-0 flex-1 border-t border-[#DFE5ED]"><FormRuleInsights {...railProps} bare noTitleIcon /></div>
      </>)}
    </div>
  );
  const introOk = !!draft.name.trim() && draft.tags.length > 0;
  const introEl = version === 'P' && !introDone && (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F172A]/40">
      <div className="w-[min(520px,92vw)] rounded-xl bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-[#EEF2F6] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-[#364658]">Create a rule</h3>
            <p className="mt-0.5 text-[12px] text-[#7B8FA5]">Name it first — you build what it does next.</p>
          </div>
          <button type="button" onClick={onCancel} title="Cancel" className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><XIcon size={16} className="text-[#64748B]" /></button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div>
            <FieldLabel required>Rule name</FieldLabel>
            <input autoFocus value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rule name" className={`${inputCls} ${introTried && !draft.name.trim() ? '!border-[#F25C4E]' : ''}`} />
            <ErrorText>{introTried && !draft.name.trim() ? 'Give the rule a name' : ''}</ErrorText>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={`${inputCls} h-20 resize-y py-1.5 leading-[1.36]`} />
          </div>
          <div>
            <FieldLabel required>Tags</FieldLabel>
            <TagEditor tags={draft.tags} onChange={(tags) => set({ tags })} invalid={introTried && draft.tags.length === 0} />
            <ErrorText>{introTried && draft.tags.length === 0 ? 'Add at least one tag' : ''}</ErrorText>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#EEF2F6] px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
          <button type="button" onClick={() => { setIntroTried(true); if (introOk) setIntroDone(true); }}
            className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5]">Continue</button>
        </div>
      </div>
    </div>
  );

  // ── F · bottom Problems dock ──────────────────────────────────────────────
  const startDockResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const y0 = e.clientY; const h0 = dockH;
    const move = (ev: MouseEvent) => setDockH(Math.min(460, Math.max(160, h0 + (y0 - ev.clientY))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.userSelect = ''; };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const dockBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
      <div className="relative flex flex-shrink-0 flex-col border-t border-[#DFE5ED] bg-white" style={{ height: dockOpen ? dockH : 36 }}>
        {dockOpen && <div onMouseDown={startDockResize} title="Drag to resize" className="group absolute -top-1 left-0 right-0 z-10 flex h-2 cursor-row-resize items-center"><span className="h-0.5 w-full transition-colors group-hover:bg-[#3D8BD0]" /></div>}
        <button type="button" onClick={() => setDockOpen(!dockOpen)} className="flex h-9 flex-shrink-0 items-center gap-2 bg-[#F9FAFB] px-4 text-left hover:bg-[#F1F5F9]">
          <span className="text-[12px] font-medium text-[#364658]">Problems</span>
          {ready ? (<>{badge(conflicts.length, 'red')}<span className="text-[11px] text-[#7B8FA5]">conflicts</span>{badge(similar.length, 'amber')}<span className="text-[11px] text-[#7B8FA5]">similar</span></>) : <span className="text-[11px] text-[#7B8FA5]">starts once the rule knows when it runs</span>}
          <ChevronRight size={14} className={`ml-auto text-[#7B8FA5] transition-transform ${dockOpen ? 'rotate-90' : '-rotate-90'}`} />
        </button>
        {dockOpen && <div className="min-h-0 flex-1"><FormRuleInsights {...railProps} bare hideHead /></div>}
      </div>
    </div>
  );

  // ── D · field-centric, E · flow ───────────────────────────────────────────
  const fieldBody = (
    <FormRuleFieldView
      actions={draft.actions} setActions={setActions} fields={fields} rules={rules} selfId={rule?.id}
      conflicts={conflicts} ready={ready} onOpenRule={openOther} actionsError={err('actions')}
      triggerSlot={<>{whenEl}{ready && checkEl}</>}
      detailsSlot={<div className="pt-3">{detailsFields}</div>}
    />
  );
  const flowBody = (
    <FormRuleFlowView
      name={draft.name} eventLabel={eventLabel(draft.event)} execution={draft.execution} applies={draft.applies}
      groups={draft.groups} actions={draft.actions} fields={fields} conflicts={conflicts} ready={ready}
      detailsSlot={<div className="-mx-4 -mt-4">{detailsFields}</div>}
      whenSlot={whenEl} checkSlot={checkEl} thenSlot={<div className="flex flex-col gap-6">{thenEl}{advancedEl}</div>}
    />
  );

  const linearBody = (
    <FormRuleLinearView
      side={detailsPanel}
      api={{
        event: draft.event, execution: draft.execution, applies: draft.applies, groups: draft.groups, actions: draft.actions,
        reverse: draft.reverse, ready, tried, fields, conflicts,
        errors: { event: err('event'), execution: err('execution'), applies: err('applies'), conditions: err('conditions'), actions: err('actions') },
        set: (p) => set(p),
        setGroups, setActions, patchCond, setGroupJoin, addCond, removeCond, duplicateGroup, patchAction, copyAction,
        newGroup: (join = 'And') => blankGroup(join),
        newAction: (type) => ({ ...blankAction(), type: type ?? '' }),
        condIncomplete, actionIncomplete, openOther,
        banner: similarBanner || undefined,
      }}
    />
  );

  const body =
    version === 'B' ? stepperBody
      : version === 'R' ? relBody
      : version === 'B3' ? b3Body
      : version === 'H1' ? hsBody('top')
      : version === 'H2' ? hsBody('bottom')
      : version === 'H3' ? hsBody('float')
      : version === 'LS' ? lsBody
      : version === 'RC' ? rcBody
      : version === 'EG' ? egBody
      : version === 'HF' ? hfBody
      : version === 'A3' ? a3Body
      : version === 'A3R' ? a3rBody
      : version === 'S' ? <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
      : version === 'P' ? pBody
      : version === 'B2' ? b2Body
      : version === 'D' ? fieldBody
        : version === 'E' ? flowBody
          : version === 'F' ? dockBody
            : version === 'I' ? panelBody
      : version === 'C' ? linearBody
      : version === 'G' || version === 'G2' ? <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
        : version === 'H' && hStart ? startEl
          : splitBody;

  /** Footer status: always says the state, even with the rail folded or absent. */
  const statusChip = ready && !(version === 'H' && hStart) && (
    <button
      type="button"
      onClick={() => showCheck('conflicts')}
      className="inline-flex items-center gap-2 rounded-md border border-[#DFE5ED] bg-white px-2.5 py-1 text-[12px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
    >
      <span className={`size-1.5 rounded-full ${conflicts.length ? 'bg-[#F43F5E]' : 'bg-[#89C540]'}`} />
      {conflicts.length ? conflicts.length + ' conflict' + (conflicts.length > 1 ? 's' : '') : 'No conflicts'}
      <span className="text-[#CBD5E1]">·</span>
      <span className={similar.length ? 'text-[#B45309]' : 'text-[#7B8FA5]'}>{similar.length} similar</span>
    </button>
  );

  return (
    /* Fills the admin pane; the admin SIDEBAR stands down while it is open (the Support Portal
       builder's rule) but the product header stays — the header is the app, not the admin. */
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Head — back, what this is, and the one line of help. */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#DFE5ED] px-4 py-3">
        <button type="button" onClick={leave} title="Back to form rules" className="-ml-1.5 -mt-[3px] flex size-[30px] flex-shrink-0 self-start items-center justify-center rounded-lg text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={16} />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[16px] font-medium text-[#364658]">{version === 'P' && draft.name.trim() && introDone ? draft.name : rule ? 'Edit Rule' : 'Add Rule'}</h1>
          <p className="flex items-center gap-1 text-[11px] text-[#7B8FA5]">
            Automate this form - show, hide, require or set fields based on conditions you choose.
            <button type="button" onClick={() => toast.success('Opening the form rule documentation')} className="inline-flex items-center gap-1 text-[11px] text-[#3D8BD0] underline">
              Doc <ExternalLink size={12} className="no-underline" />
            </button>
          </p>
        </div>
        {/* The page's actions live with its title — no footer bar. The status chip rides with them. */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          {version === 'S'
            ? <RelatedSummaryChips ready={ready} conflicts={conflicts} similar={similar} onOpenConflicts={() => setRelOpen('conflicts')} onOpenSimilar={() => setRelOpen('similar')} />
            : !SUMMARY.includes(version) && version !== 'A' && statusChip /* the summary layouts show the counts as cards; A's rail carries them on its tabs */}
          <button type="button" onClick={leave} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          <button type="button" onClick={() => save()} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">Save Rule</button>
        </div>
      </div>

      {/* Comparing layouts: every tab edits the same draft. Hidden once only one layout is offered. */}
      {false && SHOWN.length > 1 && <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[#DFE5ED] bg-[#FAFBFC] px-4 py-1.5">
        <span className="flex-shrink-0 text-[11px] text-[#7B8FA5]">Layout</span>
        <div className="pill-track flex-shrink-0">
          {SHOWN.map((id) => VERSIONS.find((v) => v.id === id)!).map((v) => (
            <button key={v.id} type="button" aria-pressed={version === v.id} title={v.hint} onClick={() => setVersion(v.id)}>{v.label}</button>
          ))}
        </div>
        <span className="truncate text-[11px] text-[#7B8FA5]">{VERSIONS.find((v) => v.id === version)?.hint}</span>
      </div>}

      {body}
      {introEl}
      {relDrawer}

      {review && (version === 'G' || version === 'G2') && (
        /* G's review: conflicts are many-to-many (one rule on many fields, one field under many
           rules, one pair clashing in several ways), so they get their own explorer. */
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setReview(null)}>
          <div className={'flex h-[min(700px,90vh)] ' + (version === 'G2' ? 'w-[min(860px,95vw)]' : 'w-[min(1100px,95vw)]') + ' flex-col overflow-hidden rounded-xl bg-white shadow-xl'} onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex flex-shrink-0 items-start gap-3 px-3 pt-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[#364658]">{review === 'save' ? 'Review before saving' : 'Rule check'}</h3>
                <p className="mt-0.5 text-[12px] text-[#64748B]">
                  <span className="font-medium text-[#364658]">{draft.name || 'This rule'}</span> — {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} and {similar.length} similar rule{similar.length === 1 ? '' : 's'}.{review === 'save' ? ' Fix them now, or save and deal with them later.' : ''}
                </p>
              </div>
              <button type="button" onClick={() => setReview(null)} title="Close" className="ml-auto flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><XIcon size={16} className="text-[#64748B]" /></button>
            </div>
            <div className="mb-3 flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-3">
              {([['conflicts', 'Conflicts', conflicts.length], ['similar', 'Similar rules', similar.length], ['order', 'Run order', null]] as const).map(([id, text, n]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors ' + (tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]')}>
                  {text}
                  {n !== null && <span className={'rounded-sm px-1.5 text-[11px] font-semibold ' + (n > 0 ? (id === 'conflicts' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FFF4E5] text-[#B45309]') : 'bg-[#F1F5F9] text-[#64748B]')}>{n}</span>}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {tab === 'conflicts'
                ? <FormRuleConflictReview accordion={version === 'G2'} conflicts={conflicts} rules={rules} currentExecution={draft.execution} fieldLabel={(id) => fieldById(id)?.label ?? id}
                    onOpenRule={(id) => { setReview(null); openOther(id); }}
                    onJump={(id) => { setReview(null); requestAnimationFrame(() => jumpTo(id)); }} />
                : <FormRuleInsights {...railProps} bare only={tab} onJump={(id) => { setReview(null); requestAnimationFrame(() => jumpTo(id)); }} />}
            </div>
            {review === 'save' && (
              <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#DFE5ED] px-3 py-3">
                <button type="button" onClick={() => setReview(null)} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Go back and fix</button>
                <button type="button" onClick={() => { setReview(null); save(true); }} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5]">Save anyway</button>
              </div>
            )}
          </div>
        </div>
      )}

      {review && version !== 'G' && version !== 'G2' && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setReview(null)}>
          <div className="flex h-[min(640px,86vh)] w-[min(760px,92vw)] flex-col overflow-hidden rounded-lg bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            {review === 'save' && (
              <div className="flex-shrink-0 border-b border-[#DFE5ED] px-5 py-4">
                <h3 className="text-[15px] font-semibold text-[#364658]">Review before saving</h3>
                <p className="mt-0.5 text-[12px] text-[#64748B]">
                  This rule has {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} and {similar.length} similar rule{similar.length === 1 ? '' : 's'}. Fix them now, or save and deal with them later.
                </p>
              </div>
            )}
            <div className="min-h-0 flex-1">
              <FormRuleInsights {...railProps} bare onCloseDialog={review === 'view' ? () => setReview(null) : undefined}
                onJump={(id) => { setReview(null); requestAnimationFrame(() => jumpTo(id)); }} />
            </div>
            {review === 'save' && (
              <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#DFE5ED] px-5 py-3">
                <button type="button" onClick={() => setReview(null)} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Go back and fix</button>
                <button type="button" onClick={() => { setReview(null); save(true); }} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5]">Save anyway</button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmLeave !== false && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setConfirmLeave(false)}>
          <div className="w-[400px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Discard your changes?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">This rule has edits that haven't been saved. Leaving now loses them.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmLeave(false)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Keep editing</button>
              <button type="button" onClick={() => (confirmLeave === 'list' ? onCancel() : onOpenRule(confirmLeave as string))} className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
