import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, ChevronRight, ChevronsLeft, Copy, X as XIcon, ExternalLink, History, Plus, RefreshCcw, Split, Trash2, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import {
  ACTION_TYPES, APPLIES_OPTIONS, EVENT_OPTIONS, EXECUTION_OPTIONS, NO_VALUE, PEOPLE,
  blankAction, blankCondition, blankGroup, operatorsFor, uid,
} from './formRuleData';
import type { Condition, ConditionGroup, FormField, FormRule, RuleAction } from './formRuleData';
import { ErrorText, FieldLabel, RuleSelect, StatusToggle, TagEditor, inputCls, rowInputCls } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { actionText, conditionText, findConflicts, findSimilar, runOrder } from './formRuleEngine';
import { FormRuleInsights, KIND_TONE, eventLabel } from './FormRuleInsights';
import type { InsightTab } from './FormRuleInsights';
import { FormRuleFieldView } from './FormRuleFieldView';
import { FormRuleFlowView } from './FormRuleFlowView';
import { FormRuleLinearView } from './FormRuleLinearView';
import { FormRuleConflictReview } from './FormRuleConflictReview';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

/** The four layouts being compared. They share ONE draft, so switching compares the same rule. */
export type EditorVersion = 'A' | 'B' | 'B2' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
/** Favourites (Zeni, 30 Sep 2026) lead the switcher; the rest follow a divider. */
const VERSIONS: { id: EditorVersion; label: string; hint: string; fav?: boolean }[] = [
  { id: 'A', fav: true, label: 'A · Split', hint: 'Builder + a resizable, collapsible Rule check rail' },
  { id: 'B2', fav: true, label: 'B2 · 3 steps', hint: 'Three steps: Rule details → Build the rule (conflicts beside it) → Review & save' },
  { id: 'C', fav: true, label: 'C · Linear', hint: 'A centred step-by-step flow — hover a line for its actions, hover a gap to add a step' },
  { id: 'E', fav: true, label: 'E · Flow', hint: 'The rule as a node pipeline; clashes branch off as red lines' },
  { id: 'I', fav: true, label: 'I · Details', hint: 'Rule logic in the centre; details and the rule check in a right panel' },
  { id: 'F', label: 'F · Problems', hint: 'Full-width builder with a bottom Problems dock' },
  { id: 'B', label: 'B · Stepper', hint: 'One step at a time: Details → When → Check if → Then → Review' },
  { id: 'D', label: 'D · Field', hint: 'Click fields on the form preview to say what the rule does to them' },
  { id: 'G', label: 'G · Review', hint: 'Inline warnings while building; a review before it is saved' },
  { id: 'H', label: 'H · Similar-first', hint: 'Start from the trigger — extend an existing rule before creating one' },
];
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

export function FormRuleEditor({ rule, rules, fields, onCancel, onSave, onOpenRule }: {
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
  const [version, setVersionState] = useState<EditorVersion>(() => (store.get('formRuleVersion') as EditorVersion) || 'A');
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
  /** Version I: the Rule details section of the right panel can fold to give the rule check room. */
  const [detailsOpen, setDetailsOpen] = useState(true);
  /** Version B: which step is showing. */
  const [step, setStep] = useState(0);
  /** Version B2: 0 details · 1 build · 2 review. */
  const [step3, setStep3] = useState(0);
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
    if (!force && version === 'G' && (conflicts.length > 0 || similar.length > 0)) { setReview('save'); return; }
    onSave({ ...draft, applies: draft.applies as FormRule['applies'], event: draft.event as FormRule['event'], execution: draft.execution as FormRule['execution'] });
  };
  const leave = () => (dirty ? setConfirmLeave('list') : onCancel());
  const openOther = (id: string) => (dirty ? setConfirmLeave(id) : onOpenRule(id));

  // ── rule check: measured live against the draft ───────────────────────────
  const selfIndex = rule ? rules.findIndex((r) => r.id === rule.id) : rules.length;
  const shape = { ...draft, id: rule?.id, name: draft.name || 'This rule' };
  const conflicts = useMemo(() => findConflicts(shape, rules, fields, selfIndex), [draft, rules, fields]); // eslint-disable-line react-hooks/exhaustive-deps
  const similar = useMemo(() => findSimilar(shape, rules, fields), [draft, rules, fields]); // eslint-disable-line react-hooks/exhaustive-deps
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
    if (version === 'A' || version === 'H') return openRail(t);
    setTab(t);
    if (version === 'I' || version === 'C') return;
    if (version === 'F') return setDockOpen(true);
    if (version === 'B') return setStep(4);
    if (version === 'B2') return step3 === 0 ? setStep3(1) : undefined;
    setReview('view');
  };
  const reviewSimilar = () => showCheck('similar');

  const similarBanner = similar.length > 0 && !(version === 'H' && !rule && !hStarted) && (
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

  const railProps = {
    ready,
    hasActions: draft.actions.some((a) => a.type && a.fieldIds.length > 0),
    conflicts, similar, timeline, tab, onTab: setTab,
    triggerChips: { event: eventLabel(draft.event), execution: draft.execution },
    conditionLines,
    fieldLabel: (id: string) => fieldById(id)?.label ?? id,
    onJump: jumpTo,
    onHover: setHoverAction,
    onOpenRule: openOther,
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
  const whenEl = (<>
            {/* WHEN */}
            <Step icon={<History size={12} />} tone="#3D8BD0" badge="#E2EDF5" lead="When" rest="this rule should run and when it should execute">
              <Panel>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </Panel>
              {!ready && (
                <p className="text-[11px] text-[#7B8FA5]">Choose the event and where it executes — the conditions and actions open up once the rule knows when it runs.</p>
              )}
            </Step>

  </>);
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
                          return (
                            <div key={act.id} data-action-row={act.id} className={'-mx-1.5 w-[calc(100%+12px)] rounded-md px-1.5 py-1 transition-colors ' + (lit ? 'bg-[#FEF2F2] ring-1 ring-[#FCA5A5]' : '')}>
                            <div className="flex w-full items-center gap-1.5">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="w-[120px] flex-shrink-0">
                                  <RuleSelect compact value={act.type ? [act.type] : []} placeholder="Action" invalid={bad && !act.type}
                                    options={ACTION_TYPES.map((t) => ({ value: t.value, label: t.value, hint: t.hint }))} menuWidth={260}
                                    onChange={([v]) => patchAction(act.id, { type: v as RuleAction['type'], fieldIds: v === 'Set value' ? act.fieldIds.slice(0, 1) : act.fieldIds, value: [] })} />
                                </div>
                                <div className={single ? 'w-[200px] flex-shrink-0' : 'min-w-0 flex-1'}>
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
                              <RowTools copyTitle="Duplicate action" deleteTitle="Remove action" onCopy={() => copyAction(act.id)} onDelete={() => setActions((as) => as.filter((x) => x.id !== act.id))} />
                            </div>
                            {clashes.length > 0 && (
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
   *  room, it does not stretch the fields, and it sits at the left edge, in line with the footer. */
  const builder = (
    <div className="max-w-[880px]">
      {identityEl}
      <div className="mx-4 border-t border-[#DFE5ED]" />
      <div className="flex flex-col gap-6 p-4 pb-8 pt-5">
        {whenEl}
        {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
      </div>
    </div>
  );

  const badge = (n: number, tone: 'red' | 'amber') => (
    <span className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 ${n === 0 ? 'bg-[#EEF2F6] text-[#98A2B3]' : tone === 'red' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>{n}</span>
  );

  /** The folded rail: a slim strip with the counts, always one click from coming back. */
  const railStrip = (
    <button
      type="button"
      onClick={() => openRail()}
      title="Open the rule check — conflicts and similar rules"
      className={`flex w-9 flex-shrink-0 flex-col items-center gap-3 border-l border-[#DFE5ED] bg-[#F9FAFB] py-3 transition-colors hover:bg-[#F1F5F9] ${pulse ? 'animate-pulse' : ''}`}
    >
      <ChevronsLeft size={16} className="text-[#7B8FA5]" />
      <span className="rotate-180 text-[12px] font-medium text-[#364658] [writing-mode:vertical-rl]">Rule check</span>
      {ready && (<><span title="Conflicts">{badge(conflicts.length, 'red')}</span><span title="Similar rules">{badge(similar.length, 'amber')}</span></>)}
    </button>
  );

  const splitBody = (
    <div className="relative flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
      {!narrow && railOpen && (
        <div className="relative flex flex-shrink-0" style={{ width: railW }}>
          {/* Drag to resize; double-click puts it back. */}
          <div
            onMouseDown={startResize}
            onDoubleClick={() => { setRailW(RAIL_DEFAULT); store.set('formRuleRailW', String(RAIL_DEFAULT)); }}
            title="Drag to resize · double-click to reset"
            className="group absolute -left-1 bottom-0 top-0 z-10 flex w-2 cursor-col-resize justify-center"
          >
            <span className="h-full w-0.5 transition-colors group-hover:bg-[#3D8BD0]" />
          </div>
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

  const detailsPanel = (
    <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white">
      <div className="flex-shrink-0">
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <span className="text-[13px] font-medium text-[#364658]">Rule details</span>
          {!detailsOpen && draft.name && <span className="min-w-0 truncate text-[12px] text-[#7B8FA5]">· {draft.name}</span>}
          {(err('name') || err('applies') || err('tags')) && <span className="size-1.5 flex-shrink-0 rounded-full bg-[#F25C4E]" title="Needs attention" />}
          <ChevronRight size={16} className={`ml-auto flex-shrink-0 text-[#7B8FA5] transition-transform ${detailsOpen ? 'rotate-90' : ''}`} />
        </button>
        {detailsOpen && (
          <div className="max-h-[46vh] overflow-y-auto">{detailsFields}</div>
        )}
      </div>
      <div className="min-h-0 flex-1 border-t border-[#DFE5ED]">
        <FormRuleInsights {...railProps} bare />
      </div>
    </aside>
  );

  const panelBody = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          {whenEl}
          {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
        </div>
      </div>
      {detailsPanel}
    </div>
  );

  // ── B · guided stepper ────────────────────────────────────────────────────
  const detailsDone = !!draft.name.trim() && !!draft.applies && draft.tags.length > 0;
  const actionsDone = draft.actions.length > 0 && !draft.actions.some(actionIncomplete);
  const STEPS = [
    { label: 'Rule details', hint: 'Name, who it is for, tags', done: detailsDone, locked: false },
    { label: 'When', hint: 'Event and create / edit', done: ready, locked: false },
    { label: 'Check if', hint: 'Optional conditions', done: ready && !draft.groups.some((g) => g.conditions.some(condIncomplete)), locked: !ready },
    { label: 'Then', hint: 'What the rule does', done: actionsDone, locked: !ready },
    { label: 'Review', hint: 'Conflicts and similar rules', done: false, locked: !ready },
  ];
  const summaryLines = [
    draft.event ? eventLabel(draft.event) + ' · ' + (draft.execution || '…') + ' · ' + (draft.applies || '…') : null,
    conditionLines.length ? 'If ' + conditionLines.join(' and ') : 'Runs on every matching event',
    ...draft.actions.filter((a) => a.type && a.fieldIds.length).map((a) => a.fieldIds.map((f) => actionText(a.type, fieldById(f)?.label ?? f, a.value.join(', '))).join(', ')),
  ].filter(Boolean) as string[];
  const stepBody = [
    <div key="d" className="-mx-4 -mt-5">{identityEl}</div>,
    whenEl,
    <div key="c" className="flex flex-col gap-4">{checkEl}
      {similar.length > 0 && (
        <div className="rounded-lg border border-[#FDE68A] bg-white p-3">
          <div className="text-[12px] font-medium text-[#B45309]">Checkpoint — these rules already use this trigger</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {similar.map((s) => (
              <div key={s.rule.id} className="flex items-center gap-2 rounded-md bg-[#FFFBEB] px-2.5 py-1.5">
                <span className="truncate text-[12px] text-[#364658]">{s.rule.name}</span>
                <span className="text-[11px] text-[#92400E]">{s.common.length} in common</span>
                <button type="button" onClick={() => openOther(s.rule.id)} className="ml-auto flex-shrink-0 text-[12px] font-medium text-[#3D8BD0] hover:underline">Open rule</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,
    <div key="t" className="flex flex-col gap-6">{thenEl}{advancedEl}</div>,
    <div key="r" className="flex flex-col gap-4">
      <div className="rounded-lg bg-[#F9FAFB] p-4">
        <div className="text-[13px] font-medium text-[#364658]">{draft.name || 'This rule'}</div>
        <ul className="mt-2 space-y-1">{summaryLines.map((l) => <li key={l} className="text-[12px] text-[#64748B]">• {l}</li>)}</ul>
      </div>
      <div className="h-[460px] overflow-hidden rounded-lg border border-[#DFE5ED]"><FormRuleInsights {...railProps} bare /></div>
    </div>,
  ];
  const stepperBody = (
    <div className="flex min-h-0 flex-1">
      <nav className="flex w-[220px] flex-shrink-0 flex-col gap-1 border-r border-[#DFE5ED] bg-[#FAFBFC] p-3">
        {STEPS.map((s, i) => (
          <button key={s.label} type="button" disabled={s.locked} onClick={() => setStep(i)}
            title={s.locked ? 'Choose when the rule runs first' : undefined}
            className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${step === i ? 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-[#DFE5ED]' : 'hover:bg-[#F1F5F9]'}`}>
            <span className={`mt-px flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${s.done ? 'bg-[#89C540] text-white' : step === i ? 'bg-[#3D8BD0] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
              {s.done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-[#364658]">
                {s.label}
                {i === 4 && ready && conflicts.length > 0 && <span className="ml-1.5 rounded-sm bg-[#FEF2F2] px-1 text-[10px] text-[#DC2626]">{conflicts.length}</span>}
              </span>
              <span className="block text-[11px] text-[#7B8FA5]">{s.hint}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          {stepBody[step]}
          <div className="flex items-center gap-2">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Back</button>}
            {step < 4 && (
              <button type="button" disabled={STEPS[step + 1].locked} onClick={() => setStep(step + 1)}
                className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50">
                Next: {STEPS[step + 1].label}
              </button>
            )}
          </div>
        </div>
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
    { label: 'Review & save', done: false, locked: !ready },
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
        {step3 < 2 && (
          <button type="button" disabled={B2_STEPS[step3 + 1].locked} onClick={() => setStep3(step3 + 1)}
            className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50">
            Next: {B2_STEPS[step3 + 1].label}
          </button>
        )}
      </div>
    </div>
  );
  const b2Body = (
    <div className="flex min-h-0 flex-1 flex-col">
      {b2Bar}
      {step3 === 0 && <div className="min-h-0 flex-1 overflow-y-auto"><div className="max-w-[880px]">{identityEl}</div></div>}
      {step3 === 1 && (
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
              {whenEl}
              {ready && (<>{checkEl}{thenEl}{advancedEl}</>)}
            </div>
          </div>
          <div className="w-[400px] flex-shrink-0"><FormRuleInsights {...railProps} /></div>
        </div>
      )}
      {step3 === 2 && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex max-w-[880px] flex-col gap-4 p-4 pt-5">
            <div className="rounded-lg bg-[#F9FAFB] p-4">
              <div className="text-[13px] font-medium text-[#364658]">{draft.name || 'This rule'}</div>
              <div className="mt-0.5 text-[11px] text-[#7B8FA5]">{draft.applies || 'Who?'}{draft.tags.length ? ' · ' + draft.tags.join(', ') : ''}</div>
              <ul className="mt-2 space-y-1">{summaryLines.map((l) => <li key={l} className="text-[12px] text-[#64748B]">• {l}</li>)}</ul>
            </div>
            <div className="h-[460px] overflow-hidden rounded-lg border border-[#DFE5ED]"><FormRuleInsights {...railProps} bare /></div>
          </div>
        </div>
      )}
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
      : version === 'B2' ? b2Body
      : version === 'D' ? fieldBody
        : version === 'E' ? flowBody
          : version === 'F' ? dockBody
            : version === 'I' ? panelBody
      : version === 'C' ? linearBody
      : version === 'G' ? <div className="min-h-0 flex-1 overflow-y-auto">{builder}</div>
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
        <button type="button" onClick={leave} title="Back to form rules" className="-ml-1.5 flex size-[30px] items-center justify-center rounded-lg text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={16} />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[16px] font-medium text-[#364658]">{rule ? 'Edit Rule' : 'Add Rule'}</h1>
          <p className="flex items-center gap-1 text-[11px] text-[#7B8FA5]">
            Automate this form - show, hide, require or set fields based on conditions you choose.
            <button type="button" onClick={() => toast.success('Opening the form rule documentation')} className="inline-flex items-center gap-1 text-[11px] text-[#3D8BD0] underline">
              Doc <ExternalLink size={12} className="no-underline" />
            </button>
          </p>
        </div>
      </div>

      {/* Comparing layouts: every tab edits the same draft. */}
      <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[#DFE5ED] bg-[#FAFBFC] px-4 py-1.5">
        <span className="flex-shrink-0 text-[11px] text-[#7B8FA5]">Layout</span>
        <div className="pill-track flex-shrink-0">
          {VERSIONS.filter((v) => v.fav).map((v) => (
            <button key={v.id} type="button" aria-pressed={version === v.id} title={v.hint} onClick={() => setVersion(v.id)}>{v.label}</button>
          ))}
        </div>
        <span className="h-5 w-px flex-shrink-0 bg-[#DFE5ED]" />
        <div className="pill-track flex-shrink-0 opacity-80">
          {VERSIONS.filter((v) => !v.fav).map((v) => (
            <button key={v.id} type="button" aria-pressed={version === v.id} title={v.hint} onClick={() => setVersion(v.id)}>{v.label}</button>
          ))}
        </div>
        <span className="truncate text-[11px] text-[#7B8FA5]">{VERSIONS.find((v) => v.id === version)?.hint}</span>
      </div>

      {body}

      {/* Footer */}
      <div className="flex h-[54px] flex-shrink-0 items-center gap-2.5 border-t border-[#E2E8F0] px-4">
        {statusChip}
        <div className="ml-auto flex items-center gap-2.5">
          <button type="button" onClick={leave} className="rounded-md border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          <button type="button" onClick={() => save()} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]">Save Rule</button>
        </div>
      </div>

      {review && version === 'G' && (
        /* G's review: conflicts are many-to-many (one rule on many fields, one field under many
           rules, one pair clashing in several ways), so they get their own explorer. */
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setReview(null)}>
          <div className="flex h-[min(700px,90vh)] w-[min(1100px,95vw)] flex-col overflow-hidden rounded-xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex flex-shrink-0 items-start gap-3 px-5 pt-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[#364658]">{review === 'save' ? 'Review before saving' : 'Rule check'}</h3>
                <p className="mt-0.5 text-[12px] text-[#64748B]">
                  <span className="font-medium text-[#364658]">{draft.name || 'This rule'}</span> — {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} and {similar.length} similar rule{similar.length === 1 ? '' : 's'}.{review === 'save' ? ' Fix them now, or save and deal with them later.' : ''}
                </p>
              </div>
              <button type="button" onClick={() => setReview(null)} title="Close" className="ml-auto flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><XIcon size={16} className="text-[#64748B]" /></button>
            </div>
            <div className="mb-3 flex flex-shrink-0 gap-2.5 border-b border-[#DFE5ED] px-5">
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
                ? <FormRuleConflictReview conflicts={conflicts} rules={rules} currentExecution={draft.execution} fieldLabel={(id) => fieldById(id)?.label ?? id}
                    onOpenRule={(id) => { setReview(null); openOther(id); }}
                    onJump={(id) => { setReview(null); requestAnimationFrame(() => jumpTo(id)); }} />
                : <FormRuleInsights {...railProps} bare only={tab} onJump={(id) => { setReview(null); requestAnimationFrame(() => jumpTo(id)); }} />}
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

      {review && version !== 'G' && (
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
