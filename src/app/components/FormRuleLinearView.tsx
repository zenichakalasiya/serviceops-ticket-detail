import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowUpRight, ChevronDown, ChevronRight, Copy, Diamond, EyeOff, Pencil, Play, Plus, Search, X } from 'lucide-react';
import {
  ACTION_TYPES, APPLIES_OPTIONS, EVENT_OPTIONS, EXECUTION_OPTIONS, NO_VALUE, PEOPLE, operatorsFor,
} from './formRuleData';
import type { ActionType, Condition, ConditionGroup, FormField, FormRule, RuleAction } from './formRuleData';
import type { RuleConflict } from './formRuleEngine';
import { RuleSelect, StatusToggle } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { KIND_TONE } from './FormRuleInsights';

/* C · Linear rule builder — modelled on the linear-workflow-builder reference
 * (https://pranjalgupta-motadata.github.io/linear-workflow-builder/).
 *
 * The rule is a centred column read top to bottom on a rail: a WHEN block, one CHECK IF block per
 * condition group (its extra conditions as indented AND/OR sub-lines), one THEN block per action,
 * then "Add step" and END. Values are words with a dashed underline. Hovering a block tints it and
 * puts its actions on the right of the SAME line; hovering the gap between two blocks offers
 * "Add step here", which opens the "What happens next" menu. */

const VERB: Record<string, string> = {
  Mandate: 'make mandatory', 'Make optional': 'make optional', Hide: 'hide', Show: 'show',
  Disable: 'make read-only', Enable: 'make editable', 'Set value': 'set', 'Clear value': 'clear',
};
const EVENT_WORD: Record<string, string> = { 'On Field Change': 'is being filled', 'On Form Load': 'opens', 'On Form Submit': 'is submitted' };
const EXEC_WORD: Record<string, string> = { 'On Create': 'a new request', 'On Edit': 'an existing request', 'On Create and Edit': 'new and existing requests' };
const APPLIES_WORD: Record<string, string> = { Requesters: 'requesters', Technicians: 'technicians', Everyone: 'everyone' };
const TONE = { when: '#3D8BD0', ifc: '#D97706', then: '#4D8A1A' };
const choiceKinds = ['dropdown', 'multiselect', 'user'];
const flip = (j: 'And' | 'Or'): 'And' | 'Or' => (j === 'And' ? 'Or' : 'And');

type Kind = 'when' | 'if' | 'then';
const TINT: Record<Kind, { row: string; badge: string }> = {
  /* Written out whole: Tailwind only generates classes it can read literally in the source. */
  when: { row: 'group-hover/block:bg-[#F2F8FD]', badge: 'bg-[#E2EDF5] text-[#2F74B5]' },
  if: { row: 'group-hover/block:bg-[#FFFAF2]', badge: 'bg-[#FDEFD9] text-[#B45309]' },
  then: { row: 'group-hover/block:bg-[#F6FBF1]', badge: 'bg-[#E7F4D9] text-[#4D8A1A]' },
};

function Marker({ kind }: { kind: Kind }) {
  return (
    <span className="relative z-[1] flex h-8 w-5 flex-shrink-0 items-center justify-center">
      {kind === 'when' && <span className="size-3.5 rounded-full border-2 border-[#3D8BD0] bg-white" />}
      {kind === 'if' && <span className="size-3 rotate-45 rounded-[2px] bg-[#F59E0B] ring-4 ring-white" />}
      {kind === 'then' && <span className="size-3 rounded-full bg-[#89C540] ring-4 ring-white" />}
    </span>
  );
}

function Badge({ kind, text, onFlip, title }: { kind: Kind; text: string; onFlip?: () => void; title?: string }) {
  const cls = 'mt-1 flex-shrink-0 rounded-md px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.08em] ' + TINT[kind].badge;
  return onFlip
    ? <button type="button" onClick={onFlip} title={title} className={cls + ' transition-shadow hover:ring-1 hover:ring-current'}>{text}</button>
    : <span className={cls}>{text}</span>;
}

/** A step on the rail: marker on the rail, then a row that tints on hover and shows its actions. */
function Block({ kind, children, actions, sub }: { kind: Kind; children: React.ReactNode; actions?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="group/block relative flex items-start gap-2">
      <Marker kind={kind} />
      <div className={'min-w-0 flex-1 rounded-lg px-2.5 py-1 transition-colors ' + TINT[kind].row}>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[15px] leading-8 text-[#7B8FA5]">{children}</div>
          {actions && <div className="flex flex-shrink-0 items-center gap-1 pt-1 opacity-0 transition-opacity group-hover/block:opacity-100 focus-within:opacity-100">{actions}</div>}
        </div>
        {sub}
      </div>
    </div>
  );
}

const RowBtn = ({ onClick, title, children, danger }: { onClick: () => void; title: string; children: React.ReactNode; danger?: boolean }) => (
  <button type="button" onClick={onClick} title={title}
    className={'flex size-7 items-center justify-center rounded-md transition-colors ' + (danger ? 'text-[#98A2B3] hover:bg-[#FEF2F2] hover:text-[#DC2626]' : 'text-[#98A2B3] hover:bg-white hover:text-[#364658]')}>
    {children}
  </button>
);
const RowAdd = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-white hover:text-[#364658]">
    <Plus size={13} /> {children}
  </button>
);
const Sep = () => <span className="mx-0.5 h-4 w-px bg-[#DFE5ED]" />;

// ── the "What happens next" menu ────────────────────────────────────────────

type Pick = { what: 'condition' } | { what: 'action'; type?: ActionType };
interface MenuItem { key: string; label: string; hint: string; tag: string; detail: string; icon: React.ReactNode; pick: Pick; section: string }

const MENU: MenuItem[] = [
  { key: 'action', section: 'Actions', label: 'Add action', tag: 'do', hint: 'Change a field — hide, require, lock or set it', detail: 'Tell the form what to do when this rule runs: show or hide a field, make it mandatory or optional, lock it, or fill in a value. Add as many as you need.', icon: <Play size={12} className="fill-current" />, pick: { what: 'action' } },
  { key: 'condition', section: 'Flow control', label: 'Add condition', tag: 'if', hint: 'Continue only when a check is true', detail: 'Only run the actions when the request matches — for example Priority is High. A new condition group is OR-ed or AND-ed with the one above.', icon: <Diamond size={12} className="fill-current" />, pick: { what: 'condition' } },
];
const QUICK: { label: string; type: ActionType; icon: React.ReactNode }[] = [
  { label: 'Hide', type: 'Hide', icon: <EyeOff size={12} /> },
  { label: 'Mandate', type: 'Mandate', icon: <AlertTriangle size={12} /> },
  { label: 'Set value', type: 'Set value', icon: <Pencil size={12} /> },
];

function StepMenu({ anchor, onPick, onClose }: { anchor: DOMRect; onPick: (p: Pick) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<MenuItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [onClose]);
  const items = MENU.filter((m) => !q || (m.label + m.hint).toLowerCase().includes(q.toLowerCase()));
  const top = Math.min(anchor.bottom + 6, window.innerHeight - 360);
  const left = Math.min(anchor.left, window.innerWidth - 360 - 280);
  let last = '';
  return createPortal(
    <div ref={ref} style={{ top, left }} className="fixed z-[10060] flex items-start gap-2">
      <div className="w-[340px] rounded-xl border border-[#DFE5ED] bg-white p-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
        <div className="px-1 pb-2 text-[13px] font-semibold text-[#364658]">What happens next</div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
            className="h-9 w-full rounded-lg border border-[#3D8BD0] bg-white pl-9 pr-3 text-[13px] text-[#364658] outline-none ring-2 ring-[#3D8BD0]/15 placeholder:text-[#98A2B3]" />
        </div>
        {!q && (
          <div className="mb-1 flex items-center gap-1.5 px-1 pb-1">
            <span className="text-[11px] text-[#98A2B3]">Quick</span>
            {QUICK.map((c) => (
              <button key={c.type} type="button" onClick={() => onPick({ what: 'action', type: c.type })}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-[#DFE5ED] px-2.5 text-[12px] font-medium text-[#364658] hover:bg-[#F5F7FA]">
                {c.icon}{c.label}
              </button>
            ))}
          </div>
        )}
        {items.length === 0 && <div className="px-2 py-4 text-center text-[12px] text-[#98A2B3]">Nothing matches “{q}”</div>}
        {items.map((m) => {
          const head = m.section !== last ? m.section : null;
          last = m.section;
          const tone = m.pick.what === 'condition' ? 'bg-[#FDEFD9] text-[#D97706]' : 'bg-[#E7F4D9] text-[#4D8A1A]';
          return (
            <div key={m.key}>
              {head && <div className="px-1.5 pb-1 pt-2 text-[11px] font-medium text-[#98A2B3]">{head}</div>}
              <button type="button" onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} onClick={() => onPick(m.pick)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#F5F7FA]">
                <span className={'flex size-8 flex-shrink-0 items-center justify-center rounded-lg ' + tone}>{m.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[#364658]">{m.label}</span>
                  <span className="block truncate text-[11px] text-[#7B8FA5]">{m.hint}</span>
                </span>
                <span className="rounded bg-[#F1F5F9] px-1.5 text-[10px] text-[#64748B]">{m.tag}</span>
                <ChevronRight size={14} className="text-[#98A2B3]" />
              </button>
            </div>
          );
        })}
      </div>
      {hover && (
        <div className="mt-[88px] w-[240px] rounded-lg border border-[#DFE5ED] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.1)]">
          <div className="text-[13px] font-semibold text-[#364658]">{hover.pick.what === 'condition' ? 'Condition' : 'Action'}</div>
          <p className="mt-1 text-[12px] leading-[1.55] text-[#64748B]">{hover.detail}</p>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** The seam between two blocks: invisible until hovered, then "Add step here". */
function Gap({ onOpen, disabled }: { onOpen: (r: DOMRect) => void; disabled?: boolean }) {
  if (disabled) return <div className="h-3" />;
  return (
    /* Opens up in place, pushing the blocks below down — it never sits on top of a block. */
    <div className="group/gap relative flex h-3 items-center overflow-hidden transition-[height] duration-150 hover:h-10">
      <button type="button" onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
        className="relative z-[2] flex h-8 w-full items-center gap-2 rounded-lg pr-3 opacity-0 transition-opacity hover:bg-[#EEF2F6] group-hover/gap:opacity-100">
        <span className="flex h-8 w-5 flex-shrink-0 items-center justify-center"><span className="flex size-5 items-center justify-center rounded-full border border-[#CBD5E1] bg-white text-[#64748B]"><Plus size={11} /></span></span>
        <span className="text-[12px] font-medium text-[#64748B]">Add step here</span>
      </button>
    </div>
  );
}

export interface LinearApi {
  event: FormRule['event'] | '';
  execution: FormRule['execution'] | '';
  applies: FormRule['applies'] | '';
  groups: ConditionGroup[];
  actions: RuleAction[];
  reverse: boolean;
  ready: boolean;
  tried: boolean;
  fields: FormField[];
  conflicts: RuleConflict[];
  errors: { event: string; execution: string; applies: string; conditions: string; actions: string };
  set: (p: { event?: FormRule['event']; execution?: FormRule['execution']; applies?: FormRule['applies']; reverse?: boolean }) => void;
  setGroups: (fn: (g: ConditionGroup[]) => ConditionGroup[]) => void;
  setActions: (fn: (a: RuleAction[]) => RuleAction[]) => void;
  patchCond: (gid: string, cid: string, p: Partial<Condition>) => void;
  setGroupJoin: (gid: string, j: 'And' | 'Or') => void;
  addCond: (gid: string) => void;
  removeCond: (gid: string, cid: string) => void;
  duplicateGroup: (gid: string) => void;
  patchAction: (aid: string, p: Partial<RuleAction>) => void;
  copyAction: (aid: string) => void;
  newGroup: (join?: 'And' | 'Or') => ConditionGroup;
  newAction: (type?: ActionType) => RuleAction;
  condIncomplete: (c: Condition) => boolean;
  actionIncomplete: (a: RuleAction) => boolean;
  openOther: (id: string) => void;
  banner?: React.ReactNode;
}

export function FormRuleLinearView({ api, side }: { api: LinearApi; side: React.ReactNode }) {
  const {
    event, execution, applies, groups, actions, reverse, ready, tried, fields, conflicts, errors,
    set, setGroups, setActions, patchCond, setGroupJoin, addCond, removeCond, duplicateGroup, patchAction, copyAction,
    newGroup, newAction, condIncomplete, actionIncomplete, openOther, banner,
  } = api;
  const [menu, setMenu] = useState<{ at: DOMRect; pos: number } | null>(null);
  const fieldById = (id: string) => fields.find((f) => f.id === id);
  const fieldOptions: SelectOption[] = fields.map((f) => ({ value: f.id, label: f.label, group: f.system ? 'System fields' : 'Custom fields' }));

  /* Positions run over the blocks in order: 0 = after WHEN, then one per condition group, then one
     per action. Conditions always come before actions (that is how a rule reads), so a condition
     picked in the actions part lands at the end of the conditions, and an action picked among the
     conditions lands first among the actions. */
  const insert = (pos: number, p: Pick) => {
    if (p.what === 'condition') {
      const at = Math.min(pos, groups.length);
      setGroups((gs) => [...gs.slice(0, at), newGroup(at === 0 ? 'And' : 'Or'), ...gs.slice(at)]);
    } else {
      const at = Math.max(0, pos - groups.length);
      setActions((as) => [...as.slice(0, at), newAction(p.type), ...as.slice(at)]);
    }
    setMenu(null);
  };

  const valueOf = (f: FormField | undefined, value: string[], onChange: (v: string[]) => void, invalid: boolean) => {
    if (!f) return null;
    if (f.kind === 'user') return <RuleSelect token={TONE.ifc} multi searchable value={value} onChange={onChange} invalid={invalid} placeholder="choose people"
      options={PEOPLE.map((p) => ({ value: p.name, label: p.name, avatar: { initials: p.initials, color: p.color } }))} />;
    if (choiceKinds.includes(f.kind)) return <RuleSelect token={TONE.ifc} multi value={value} onChange={onChange} invalid={invalid} placeholder="choose values"
      options={(f.options ?? []).map((o) => ({ value: o, label: o }))} />;
    const v = value[0] ?? '';
    return (
      <input value={v} onChange={(e) => onChange([e.target.value])} placeholder="type a value" size={Math.max(10, v.length + 1)}
        type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'}
        className={'border-b border-dashed bg-transparent align-baseline text-[15px] font-medium leading-7 text-[#1D2A3E] placeholder:font-normal placeholder:text-[#98A2B3] focus:border-solid focus:outline-none ' + (invalid ? 'border-[#F25C4E]' : 'border-[#A5BAD0] focus:border-[#3D8BD0]')} />
    );
  };

  const condWords = (grp: ConditionGroup, cnd: Condition) => {
    const f = fieldById(cnd.fieldId);
    const bad = tried && condIncomplete(cnd);
    const needsValue = !!cnd.op && !NO_VALUE.includes(cnd.op as never);
    return (
      <>
        <RuleSelect token={TONE.ifc} searchable value={cnd.fieldId ? [cnd.fieldId] : []} options={fieldOptions} placeholder="choose a field" invalid={bad && !cnd.fieldId} menuWidth={240}
          onChange={([v]) => patchCond(grp.id, cnd.id, { fieldId: v, op: operatorsFor(fieldById(v)!.kind)[0], value: [] })} />
        {f && (
          <RuleSelect token={TONE.ifc} value={cnd.op ? [cnd.op] : []} placeholder="operator" invalid={bad && !cnd.op}
            options={operatorsFor(f.kind).map((o) => ({ value: o, label: o }))}
            onChange={([v]) => patchCond(grp.id, cnd.id, { op: v as Condition['op'], value: NO_VALUE.includes(v as never) ? [] : cnd.value })} />
        )}
        {needsValue && valueOf(f, cnd.value, (value) => patchCond(grp.id, cnd.id, { value }), bad && cnd.value.filter(Boolean).length === 0)}
      </>
    );
  };

  let pos = 0; // running gap position

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFBFC] bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:18px_18px]">
        <div className="mx-auto w-full max-w-[760px] px-6 py-10">
          <div className="relative">
            {/* the rail */}
            <span className="absolute bottom-7 left-[9.5px] top-4 w-px bg-[#CBD5E1]" />

            {/* WHEN */}
            <Block kind="when"
              actions={ready ? <RowAdd onClick={() => insert(0, { what: 'condition' })}>add condition</RowAdd> : undefined}>
              <Badge kind="when" text="When" />
              <span>the form</span>
              <RuleSelect token={TONE.when} value={event ? [event] : []} onChange={([v]) => set({ event: v as FormRule['event'] })} invalid={!!errors.event} placeholder="is… (choose an event)"
                options={EVENT_OPTIONS.map((o) => ({ value: o.value, label: EVENT_WORD[o.value], hint: o.hint }))} menuWidth={280} />
              <span>on</span>
              <RuleSelect token={TONE.when} value={execution ? [execution] : []} onChange={([v]) => set({ execution: v as FormRule['execution'] })} invalid={!!errors.execution} placeholder="create, edit or both"
                options={EXECUTION_OPTIONS.map((o) => ({ value: o.value, label: EXEC_WORD[o.value], hint: o.label }))} menuWidth={260} />
              <span>for</span>
              <RuleSelect token={TONE.when} value={applies ? [applies] : []} onChange={([v]) => set({ applies: v as FormRule['applies'] })} invalid={!!errors.applies} placeholder="who"
                options={APPLIES_OPTIONS.map((o) => ({ value: o.value, label: APPLIES_WORD[o.value], hint: o.label }))} menuWidth={220} />
            </Block>

            <Gap disabled={!ready} onOpen={(at) => setMenu({ at, pos: 0 })} />

            {/* CHECK IF — one block per group, extra conditions as sub-lines */}
            {groups.map((grp, gi) => {
              const join = grp.conditions[1]?.join ?? 'And';
              const first = grp.conditions[0];
              const myPos = ++pos;
              return (
                <div key={grp.id}>
                  <Block kind="if"
                    actions={<>
                      <RowAdd onClick={() => addCond(grp.id)}>new condition</RowAdd>
                      <Sep />
                      <RowBtn title="Duplicate group" onClick={() => duplicateGroup(grp.id)}><Copy size={13} /></RowBtn>
                      <RowBtn title="Remove group" danger onClick={() => setGroups((gs) => gs.filter((g) => g.id !== grp.id))}><X size={14} /></RowBtn>
                    </>}
                    sub={grp.conditions.length > 1 && (
                      <div className="pb-1">
                        {grp.conditions.slice(1).map((cnd) => (
                          <div key={cnd.id} className="group/sub flex items-baseline gap-2 pl-[86px] text-[15px] leading-8 text-[#7B8FA5]">
                            <button type="button" onClick={() => setGroupJoin(grp.id, flip(join))} title="Switch and / or for this group"
                              className="inline-flex translate-y-[-1px] items-center gap-0.5 rounded-md bg-[#F1F5F9] px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wider text-[#64748B] hover:bg-[#E2E8F0]">
                              {join} <ChevronDown size={10} />
                            </button>
                            <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">{condWords(grp, cnd)}</span>
                            <button type="button" onClick={() => removeCond(grp.id, cnd.id)} title="Remove condition"
                              className="flex size-6 flex-shrink-0 items-center justify-center self-center rounded text-[#98A2B3] opacity-0 hover:bg-[#FEF2F2] hover:text-[#DC2626] group-hover/sub:opacity-100">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}>
                    {gi === 0
                      ? <Badge kind="if" text="Check if" />
                      : <Badge kind="if" text={grp.join === 'And' ? 'And if' : 'Or if'} title="Switch how this group joins the one above"
                          onFlip={() => setGroups((gs) => gs.map((g) => (g.id === grp.id ? { ...g, join: flip(g.join) } : g)))} />}
                    {first && condWords(grp, first)}
                  </Block>
                  <Gap onOpen={(at) => setMenu({ at, pos: myPos })} />
                </div>
              );
            })}

            {/* THEN — one block per action */}
            {actions.map((act, ai) => {
              const bad = tried && actionIncomplete(act);
              const single = act.type === 'Set value';
              const clashes = conflicts.filter((x) => x.actionId === act.id);
              const target = single ? fieldById(act.fieldIds[0]) : undefined;
              const myPos = ++pos;
              return (
                <div key={act.id}>
                  <Block kind="then"
                    actions={<>
                      <RowAdd onClick={() => insert(myPos, { what: 'action' })}>new action</RowAdd>
                      <Sep />
                      <RowBtn title="Duplicate action" onClick={() => copyAction(act.id)}><Copy size={13} /></RowBtn>
                      <RowBtn title="Remove action" danger onClick={() => setActions((as) => as.filter((x) => x.id !== act.id))}><X size={14} /></RowBtn>
                    </>}>
                    <Badge kind="then" text={ai === 0 ? 'Then' : 'And'} />
                    <RuleSelect token={TONE.then} value={act.type ? [act.type] : []} placeholder="choose an action" invalid={bad && !act.type} menuWidth={260}
                      options={ACTION_TYPES.map((t) => ({ value: t.value, label: VERB[t.value], hint: t.hint }))}
                      onChange={([v]) => patchAction(act.id, { type: v as RuleAction['type'], fieldIds: v === 'Set value' ? act.fieldIds.slice(0, 1) : act.fieldIds, value: [] })} />
                    <RuleSelect token={TONE.then} multi={!single} searchable wavy={clashes.length > 0} value={act.fieldIds} placeholder={single ? 'which field' : 'which fields'} invalid={bad && act.fieldIds.length === 0} menuWidth={240}
                      options={fields.filter((f) => !single || f.kind !== 'attachment').map((f) => ({ value: f.id, label: f.label, group: f.system ? 'System fields' : 'Custom fields' }))}
                      onChange={(v) => patchAction(act.id, { fieldIds: v, value: single ? [] : act.value })} />
                    {single && target && <><span>to</span>{valueOf(target, act.value, (value) => patchAction(act.id, { value }), bad && act.value.filter(Boolean).length === 0)}</>}
                    {clashes.length > 0 && (
                      <HoverCard openDelay={120} closeDelay={80}>
                        <HoverCardTrigger asChild>
                          <button type="button" className="inline-flex items-center gap-1 self-center rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium leading-4 text-[#DC2626]">
                            <AlertTriangle size={11} /> {clashes.length} conflict{clashes.length > 1 ? 's' : ''}
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent align="start" className="z-[10070] w-[340px] border-[#DFE5ED] p-3">
                          <div className="mb-2 text-[12px] font-medium text-[#364658]">{clashes.length} conflict{clashes.length > 1 ? 's' : ''} on this action</div>
                          <div className="flex flex-col gap-2.5">
                            {clashes.map((x) => (
                              <div key={x.key} className="rounded-md bg-[#F9FAFB] p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-medium" style={{ color: KIND_TONE[x.kind].fg }}>{x.kind}</span>
                                  <span className="truncate text-[11px] text-[#64748B]">· {x.other.name}</span>
                                  <button type="button" onClick={() => openOther(x.other.id)} className="ml-auto flex-shrink-0 text-[#3D8BD0]" title="Open rule"><ArrowUpRight size={12} /></button>
                                </div>
                                <div className="mt-1.5 text-[12px] leading-[1.5] text-[#364658]">This rule: {x.mine.charAt(0).toLowerCase() + x.mine.slice(1)}. They: {x.theirs.charAt(0).toLowerCase() + x.theirs.slice(1)}.</div>
                                <div className="mt-1 text-[11px] leading-[1.5] text-[#7B8FA5]">{x.outcome}</div>
                              </div>
                            ))}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </Block>
                  {ai < actions.length - 1 && <Gap onOpen={(at) => setMenu({ at, pos: myPos })} />}
                </div>
              );
            })}

            {/* Add step, then END */}
            <div className="relative mt-2 flex items-center gap-2">
              <span className="relative z-[1] flex h-8 w-5 flex-shrink-0 items-center justify-center">
                <span className={'flex size-5 items-center justify-center rounded-full border bg-white ' + (ready ? 'border-[#CBD5E1] text-[#64748B]' : 'border-[#E2E8F0] text-[#CBD5E1]')}><Plus size={11} /></span>
              </span>
              <button type="button" disabled={!ready}
                onClick={(e) => setMenu({ at: e.currentTarget.getBoundingClientRect(), pos: groups.length + actions.length })}
                title={ready ? undefined : 'Choose the event, where it runs and who it is for first'}
                className="flex h-10 flex-1 items-center rounded-lg px-2.5 text-left text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#EEF2F6] disabled:cursor-not-allowed disabled:text-[#CBD5E1] disabled:hover:bg-transparent">
                {ready ? (actions.length ? 'Add step' : 'Add step — a condition or the first action') : 'Add step — finish the WHEN line first'}
              </button>
            </div>
            <div className="relative flex items-center gap-2 pt-5">
              <span className="absolute left-[9.5px] top-0 h-5 border-l border-dashed border-[#CBD5E1]" />
              <span className="flex w-5 justify-center"><span className="size-2 rounded-full bg-[#CBD5E1]" /></span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">End</span>
            </div>
          </div>

          <label className={'mt-8 flex items-center gap-2.5 rounded-lg border border-[#EEF2F6] bg-white px-3 py-2.5 text-[12px] ' + (groups.length ? 'text-[#364658]' : 'text-[#98A2B3]')}>
            <StatusToggle on={reverse && groups.length > 0} disabled={groups.length === 0} onChange={(v) => set({ reverse: v })} />
            <span className="flex-1">Undo the actions when the conditions stop matching{groups.length ? '' : ' — needs a condition'}</span>
          </label>

          {(errors.conditions || errors.actions) && <p data-form-error className="mt-3 text-[11px] text-[#F25C4E]">{errors.conditions || errors.actions}</p>}
          {banner && <div className="mt-4">{banner}</div>}
        </div>
      </div>
      {side}
      {menu && <StepMenu anchor={menu.at} onPick={(p) => insert(menu.pos, p)} onClose={() => setMenu(null)} />}
    </div>
  );
}
