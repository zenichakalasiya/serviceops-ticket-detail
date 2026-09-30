/* Conflict + similar-rule detection for form rules. Pure functions over the rule data, so the
 * editor (live, against the draft), the listing (the "N conflicts" pill) and the rail all read ONE
 * answer.
 *
 * A CONFLICT is two rules that can run on the same form at the same time and leave a field in two
 * states. Three kinds:
 *   Opposite — reverse actions on one field (Hide/Show, Mandate/Make optional, Disable/Enable).
 *   Override — both set the field's value, to different values (or one clears it). Run order decides.
 *   Blocking — one rule hides or disables a field the other makes mandatory. The form can't be saved.
 * "Can run at the same time" = who overlaps (Everyone covers both), execution overlaps (Create and
 * Edit covers both), and the two rules' conditions are not provably exclusive.
 *
 * A SIMILAR rule already uses this rule's trigger and conditions — its actions may differ. It is
 * where the admin should add an action instead of creating a near-duplicate rule. */

import { NO_VALUE } from './formRuleData';
import type { Condition, ConditionGroup, FormField, FormRule, RuleAction, RuleApplies, RuleEvent, RuleExecution } from './formRuleData';

export type ConflictKind = 'Opposite' | 'Override' | 'Blocking';

/** The shape the engine needs — a saved rule or the editor's draft. */
export interface RuleShape {
  id?: string;
  name: string;
  applies: RuleApplies | '';
  event: RuleEvent | '';
  execution: RuleExecution | '';
  groups: ConditionGroup[];
  actions: RuleAction[];
  enabled?: boolean;
}

export interface RuleConflict {
  key: string;
  kind: ConflictKind;
  fieldId: string;
  /** The action in THIS rule that causes it. */
  actionId: string;
  mine: string;
  other: FormRule;
  theirs: string;
  /** When both run, in words. */
  scope: string;
  why: string;
  /** Who ends up deciding the field today, or why nobody can. */
  outcome: string;
}

export interface SimilarRule {
  rule: FormRule;
  /** Actions both rules do. */
  common: string[];
  /** Actions only the similar rule does. */
  others: string[];
  /** This rule's actions the similar rule lacks — what extending it would take. */
  missing: string[];
}

export interface TimelineEntry {
  rule: RuleShape;
  isSelf: boolean;
  order: number;
  lines: { text: string; clash: boolean }[];
}

// ── words ───────────────────────────────────────────────────────────────────

const label = (fields: FormField[], id: string) => fields.find((f) => f.id === id)?.label ?? id;

export const actionText = (type: RuleAction['type'], field: string, value?: string) => {
  switch (type) {
    case 'Mandate': return `Makes ${field} mandatory`;
    case 'Make optional': return `Makes ${field} optional`;
    case 'Hide': return `Hides ${field}`;
    case 'Show': return `Shows ${field}`;
    case 'Disable': return `Makes ${field} read-only`;
    case 'Enable': return `Makes ${field} editable`;
    case 'Set value': return `Sets ${field} → ${value || '…'}`;
    case 'Clear value': return `Clears ${field}`;
    default: return field;
  }
};

export const conditionText = (c: Condition, fields: FormField[]) => {
  const f = label(fields, c.fieldId);
  if (!c.op) return f;
  if (NO_VALUE.includes(c.op as never)) return `${f} ${c.op}`;
  const v = c.value.filter(Boolean);
  const list = v.length > 2 ? `${v.slice(0, 2).join(', ')} +${v.length - 2}` : v.join(' or ');
  return `${f} ${c.op} ${list}`;
};

// ── scope ───────────────────────────────────────────────────────────────────

const appliesOverlap = (a: string, b: string) => !!a && !!b && (a === b || a === 'Everyone' || b === 'Everyone');
const execOverlap = (a: string, b: string) => !!a && !!b && (a === b || a === 'On Create and Edit' || b === 'On Create and Edit');
const execShared = (a: string, b: string) => (a === 'On Create and Edit' ? b : a);

const complete = (c: Condition) => !!c.fieldId && !!c.op && (NO_VALUE.includes(c.op as never) || c.value.filter(Boolean).length > 0);

/** The rule's conditions as OR-of-ANDs, or null when the shape is too mixed to reason about
 *  (then the rule is treated as able to match anything — the safe side for a warning). */
const dnf = (groups: ConditionGroup[]): Condition[][] | null => {
  const gs = groups.map((g) => g.conditions.filter(complete)).filter((cs) => cs.length);
  if (!gs.length) return [];
  const innerOr = groups.some((g) => g.conditions.length > 1 && g.conditions[1]?.join === 'Or');
  if (innerOr) return null;
  const joins = groups.slice(1).map((g) => g.join);
  if (joins.every((j) => j === 'And')) return [gs.flat()];
  if (joins.every((j) => j === 'Or')) return gs;
  return null;
};

const exclusivePair = (a: Condition, b: Condition) => {
  if (a.fieldId !== b.fieldId) return false;
  const inter = a.value.filter((v) => b.value.includes(v));
  if (a.op === 'is' && b.op === 'is') return inter.length === 0;
  if (a.op === 'is' && b.op === 'is not') return a.value.every((v) => b.value.includes(v));
  if (a.op === 'is not' && b.op === 'is') return b.value.every((v) => a.value.includes(v));
  if ((a.op === 'is empty' && b.op === 'is not empty') || (a.op === 'is not empty' && b.op === 'is empty')) return true;
  if ((a.op === 'is checked' && b.op === 'is not checked') || (a.op === 'is not checked' && b.op === 'is checked')) return true;
  return false;
};

/** Can both rules' conditions be true on the same request? */
export const canCoincide = (a: ConditionGroup[], b: ConditionGroup[]) => {
  const da = dnf(a);
  const db = dnf(b);
  if (!da || !db || !da.length || !db.length) return true;
  return da.some((ca) => db.some((cb) => !ca.some((x) => cb.some((y) => exclusivePair(x, y)))));
};

const scopeOverlap = (a: RuleShape, b: RuleShape) =>
  appliesOverlap(a.applies, b.applies) && execOverlap(a.execution, b.execution) && canCoincide(a.groups, b.groups);

// ── effects ─────────────────────────────────────────────────────────────────

export type Dim = 'vis' | 'req' | 'edit' | 'val';
export interface Effect { fieldId: string; dim: Dim; v: boolean | string; action: RuleAction; text: string }

export const effectsOf = (r: RuleShape, fields: FormField[]): Effect[] =>
  r.actions.flatMap((a) => {
    if (!a.type) return [];
    const map: Record<string, [Dim, boolean | string]> = {
      Mandate: ['req', true], 'Make optional': ['req', false], Hide: ['vis', false], Show: ['vis', true],
      Disable: ['edit', false], Enable: ['edit', true], 'Set value': ['val', a.value.filter(Boolean).join(', ')], 'Clear value': ['val', ''],
    };
    const [dim, v] = map[a.type];
    return a.fieldIds.map((fieldId) => ({ fieldId, dim, v, action: a, text: actionText(a.type, label(fields, fieldId), a.value.filter(Boolean).join(', ')) }));
  });

const blocks = (x: Effect) => (x.dim === 'vis' || x.dim === 'edit') && x.v === false;
const demands = (x: Effect) => x.dim === 'req' && x.v === true;

const whyText = (me: RuleShape, other: FormRule, fields: FormField[]) => {
  const mine = me.groups.flatMap((g) => g.conditions.filter(complete));
  const theirs = other.groups.flatMap((g) => g.conditions.filter(complete));
  if (!mine.length && !theirs.length) return 'Neither rule has a condition, so both run on every matching event.';
  if (!theirs.length) return `${other.name} has no condition — it runs whenever this rule does.`;
  if (!mine.length) return `This rule has no condition — it runs whenever ${other.name} does.`;
  return `Both can match the same request: ${conditionText(mine[0], fields)} and ${conditionText(theirs[0], fields)}.`;
};

/**
 * Every conflict between `me` and the other rules. `order` is the full rule list in run order;
 * `meIndex` is where `me` sits in it (a new rule runs last).
 */
export function findConflicts(me: RuleShape, rules: FormRule[], fields: FormField[], meIndex = rules.length): RuleConflict[] {
  if (!me.event || !me.execution || !me.applies) return [];
  const mine = effectsOf(me, fields);
  if (!mine.length) return [];
  const out: RuleConflict[] = [];
  rules.forEach((other, oi) => {
    if (other.id === me.id || !other.enabled || !scopeOverlap(me, other)) return;
    const theirs = effectsOf(other, fields);
    const meLater = meIndex > oi;
    for (const m of mine) {
      for (const t of theirs) {
        if (m.fieldId !== t.fieldId) continue;
        let kind: ConflictKind | null = null;
        if (m.dim === t.dim && m.dim !== 'val' && m.v !== t.v) kind = 'Opposite';
        else if (m.dim === 'val' && t.dim === 'val' && m.v !== t.v) kind = 'Override';
        else if ((blocks(m) && demands(t)) || (demands(m) && blocks(t))) kind = 'Blocking';
        if (!kind) continue;
        const f = label(fields, m.fieldId);
        const outcome = kind === 'Blocking'
          ? `${f} is mandatory but ${blocks(m) ? (m.dim === 'vis' ? 'hidden' : 'read-only') : (t.dim === 'vis' ? 'hidden' : 'read-only')} — the form can't be submitted.`
          : meLater ? `This rule wins today — it runs after ${other.name}.` : `${other.name} wins today — it runs after this rule.`;
        const key = `${other.id}|${m.action.id}|${m.fieldId}|${kind}`;
        if (out.some((c) => c.key === key)) continue;
        out.push({
          key, kind, fieldId: m.fieldId, actionId: m.action.id, mine: m.text, other, theirs: t.text,
          scope: execShared(me.execution, other.execution), why: whyText(me, other, fields), outcome,
        });
      }
    }
  });
  return out;
}

const sameCondition = (a: Condition, b: Condition) =>
  a.fieldId === b.fieldId && a.op === b.op
  && (NO_VALUE.includes(a.op as never) || a.value.some((v) => b.value.includes(v)));

/** Rules that already use this trigger and these conditions. Needs at least one condition —
 *  without one, "same trigger" alone matches half the list and says nothing. */
export function findSimilar(me: RuleShape, rules: FormRule[], fields: FormField[]): SimilarRule[] {
  const mineConds = me.groups.flatMap((g) => g.conditions.filter(complete));
  if (!me.event || !me.execution || !mineConds.length) return [];
  const myEffects = effectsOf(me, fields);
  return rules
    .filter((r) => r.id !== me.id && r.event === me.event && execOverlap(r.execution, me.execution) && (!me.applies || appliesOverlap(r.applies, me.applies)))
    .filter((r) => {
      const theirs = r.groups.flatMap((g) => g.conditions.filter(complete));
      return mineConds.every((c) => theirs.some((t) => sameCondition(c, t)));
    })
    .map((rule) => {
      const eff = effectsOf(rule, fields);
      const common = eff.filter((e) => myEffects.some((m) => m.fieldId === e.fieldId && m.dim === e.dim && m.v === e.v)).map((e) => e.text);
      const others = eff.map((e) => e.text).filter((t) => !common.includes(t));
      const missing = myEffects.filter((m) => !eff.some((x) => x.fieldId === m.fieldId && x.dim === m.dim && x.v === m.v)).map((m) => m.text);
      return { rule, common, others, missing };
    })
    .sort((a, b) => b.common.length - a.common.length);
}

/** Every rule that touches this rule's fields, in the order they run, with this rule placed. */
export function runOrder(me: RuleShape, rules: FormRule[], fields: FormField[], conflicts: RuleConflict[], meIndex = rules.length): TimelineEntry[] {
  const myFields = new Set(effectsOf(me, fields).map((e) => e.fieldId));
  if (!myFields.size) return [];
  const clashFields = new Set(conflicts.map((c) => c.fieldId));
  const list: { rule: RuleShape; isSelf: boolean; idx: number }[] = rules
    .map((r, idx) => ({ rule: r as RuleShape, isSelf: false, idx }))
    .filter((x) => x.rule.id !== me.id && x.rule.enabled && scopeOverlap(me, x.rule))
    .filter((x) => effectsOf(x.rule, fields).some((e) => myFields.has(e.fieldId)));
  list.push({ rule: me, isSelf: true, idx: meIndex - 0.5 });
  list.sort((a, b) => a.idx - b.idx);
  return list.map((x, i) => ({
    rule: x.rule,
    isSelf: x.isSelf,
    order: i + 1,
    lines: effectsOf(x.rule, fields)
      .filter((e) => myFields.has(e.fieldId))
      .map((e) => ({ text: e.text, clash: clashFields.has(e.fieldId) && (x.isSelf || conflicts.some((c) => c.other.id === x.rule.id && c.fieldId === e.fieldId)) })),
  }));
}

/** Conflict count for a saved rule — what the listing's pill shows. */
export const conflictCount = (r: FormRule, rules: FormRule[], fields: FormField[]) =>
  r.enabled ? findConflicts(r, rules, fields, rules.findIndex((x) => x.id === r.id)).length : 0;
