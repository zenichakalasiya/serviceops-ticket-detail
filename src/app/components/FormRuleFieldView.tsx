import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, EyeOff, Lock, MousePointerClick } from 'lucide-react';
import { PEOPLE, uid } from './formRuleData';
import type { ActionType, FormField, FormRule, RuleAction } from './formRuleData';
import { effectsOf } from './formRuleEngine';
import type { Dim, RuleConflict } from './formRuleEngine';
import { RuleSelect, inputCls } from './FormRuleControls';
import { KIND_TONE } from './FormRuleInsights';

/* D · Field-centric builder. The canvas is the request form itself: the admin clicks a field and
 * says what this rule does to it, instead of assembling "action + field" rows. Every field shows
 * what THIS rule does (chips) and how many OTHER rules touch it, so a clash is visible on the
 * field it is about — no separate list needed to answer "why is this field hidden?". */

const DIMS: { dim: Dim; label: string; opts: { type: ActionType | null; text: string }[] }[] = [
  { dim: 'vis', label: 'Visibility', opts: [{ type: null, text: 'No change' }, { type: 'Show', text: 'Show' }, { type: 'Hide', text: 'Hide' }] },
  { dim: 'req', label: 'Required', opts: [{ type: null, text: 'No change' }, { type: 'Mandate', text: 'Mandatory' }, { type: 'Make optional', text: 'Optional' }] },
  { dim: 'edit', label: 'Editing', opts: [{ type: null, text: 'No change' }, { type: 'Enable', text: 'Editable' }, { type: 'Disable', text: 'Read-only' }] },
  { dim: 'val', label: 'Value', opts: [{ type: null, text: 'No change' }, { type: 'Set value', text: 'Set to…' }, { type: 'Clear value', text: 'Clear' }] },
];
const DIM_OF: Record<ActionType, Dim> = {
  Mandate: 'req', 'Make optional': 'req', Hide: 'vis', Show: 'vis', Disable: 'edit', Enable: 'edit', 'Set value': 'val', 'Clear value': 'val',
};
const CHIP: Record<ActionType, string> = {
  Mandate: 'Mandatory', 'Make optional': 'Optional', Hide: 'Hidden', Show: 'Shown', Disable: 'Read-only', Enable: 'Editable', 'Set value': 'Set', 'Clear value': 'Cleared',
};

export function FormRuleFieldView({
  actions, setActions, fields, rules, selfId, conflicts, ready, triggerSlot, detailsSlot, onOpenRule, actionsError,
}: {
  actions: RuleAction[];
  setActions: (fn: (a: RuleAction[]) => RuleAction[]) => void;
  fields: FormField[];
  rules: FormRule[];
  selfId?: string;
  conflicts: RuleConflict[];
  ready: boolean;
  triggerSlot: React.ReactNode;
  detailsSlot: React.ReactNode;
  onOpenRule: (id: string) => void;
  actionsError?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const field = fields.find((f) => f.id === selected);

  /** What this rule does to a field, one entry per dimension. */
  const mine = (fid: string) => {
    const out: Partial<Record<Dim, RuleAction>> = {};
    actions.forEach((a) => { if (a.type && a.fieldIds.includes(fid)) out[DIM_OF[a.type]] = a; });
    return out;
  };

  /** Set one dimension for one field: drop it from that dimension's actions, then add it back. */
  const setDim = (fid: string, dim: Dim, type: ActionType | null, value: string[] = []) =>
    setActions((as) => {
      let next = as
        .map((a) => (a.type && DIM_OF[a.type] === dim ? { ...a, fieldIds: a.fieldIds.filter((x) => x !== fid) } : a))
        .filter((a) => !a.type || a.fieldIds.length > 0);
      if (!type) return next;
      if (type === 'Set value') return [...next, { id: uid('a'), type, fieldIds: [fid], value }];
      const host = next.find((a) => a.type === type);
      if (host) next = next.map((a) => (a === host ? { ...a, fieldIds: [...a.fieldIds, fid] } : a));
      else next = [...next, { id: uid('a'), type, fieldIds: [fid], value: [] }];
      return next;
    });

  const othersOn = (fid: string) =>
    rules.filter((r) => r.id !== selfId && r.enabled)
      .flatMap((r) => effectsOf(r, fields).filter((e) => e.fieldId === fid).map((e) => ({ rule: r, text: e.text })));

  const valueEditor = (f: FormField, act: RuleAction) => {
    const set = (v: string[]) => setDim(f.id, 'val', 'Set value', v);
    if (f.kind === 'user') return <RuleSelect value={act.value} onChange={set} placeholder="Choose a person" searchable options={PEOPLE.map((p) => ({ value: p.name, label: p.name, avatar: { initials: p.initials, color: p.color } }))} />;
    if (f.options?.length) return <RuleSelect value={act.value} onChange={set} multi={f.kind === 'multiselect'} placeholder="Choose a value" options={f.options.map((o) => ({ value: o, label: o }))} />;
    return <input value={act.value[0] ?? ''} onChange={(e) => set([e.target.value])} placeholder="Value to set" className={inputCls} type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'} />;
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex max-w-[880px] flex-col gap-6 p-4 pb-8 pt-5">
          {triggerSlot}
          <section className="flex items-start gap-2.5">
            <span className="flex flex-shrink-0 items-center rounded-full bg-[#F3F9EC] p-1 text-[#89C540]"><MousePointerClick size={14} /></span>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-0.5">
              <h2 className="text-[13px] font-medium text-[#7B8FA5]"><span className="text-[#89C540]">Then</span> click a field on the form to choose what this rule does to it</h2>
              <div className={`relative rounded-lg bg-[#F9FAFB] p-4 ${actionsError ? 'ring-1 ring-[#FCA5A5]' : ''}`}>
                {!ready && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-[12px] text-[#7B8FA5] backdrop-blur-[1px]">
                    Choose when the rule runs first — then pick fields here.
                  </div>
                )}
                <div className="mb-3 text-[12px] font-medium text-[#364658]">Request Form <span className="font-normal text-[#7B8FA5]">· {actions.filter((a) => a.type).length ? `${new Set(actions.flatMap((a) => a.fieldIds)).size} fields changed by this rule` : 'nothing changed yet'}</span></div>
                <div className="grid grid-cols-2 gap-2.5">
                  {fields.map((f) => {
                    const m = mine(f.id);
                    const clashes = conflicts.filter((c) => c.fieldId === f.id);
                    const others = othersOn(f.id);
                    const hidden = m.vis?.type === 'Hide';
                    const on = selected === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelected(on ? null : f.id)}
                        className={`group flex flex-col gap-1.5 rounded-lg border bg-white p-2.5 text-left transition-all ${f.width === 'full' ? 'col-span-2' : ''} ${on ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : clashes.length ? 'border-[#FCA5A5]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`truncate text-[12px] font-medium ${hidden ? 'text-[#98A2B3] line-through' : 'text-[#364658]'}`}>{f.label}</span>
                          {(f.required || m.req?.type === 'Mandate') && m.req?.type !== 'Make optional' && <span className="text-[#F25C4E]">*</span>}
                          <span className="ml-auto flex flex-shrink-0 items-center gap-1">
                            {clashes.length > 0 && <span title={clashes.map((c) => `${c.kind}: ${c.other.name}`).join('\n')} className="inline-flex items-center gap-0.5 rounded-sm bg-[#FEF2F2] px-1 text-[10px] font-medium leading-4 text-[#DC2626]"><AlertTriangle size={9} />{clashes.length}</span>}
                            {others.length > 0 && <span title={`${others.length} other rule${others.length > 1 ? 's' : ''} change this field`} className="rounded-sm bg-[#EEF2F6] px-1 text-[10px] leading-4 text-[#64748B]">{others.length} other</span>}
                          </span>
                        </div>
                        <div className={`flex h-7 items-center rounded border px-2 text-[11px] text-[#98A2B3] ${hidden ? 'border-dashed border-[#CBD5E1] bg-[repeating-linear-gradient(135deg,#F8FAFC_0,#F8FAFC_6px,#EEF2F6_6px,#EEF2F6_7px)]' : m.edit?.type === 'Disable' ? 'border-[#E5E7EB] bg-[#F1F5F9]' : 'border-[#E5E7EB] bg-[#F9FAFB]'}`}>
                          {hidden ? <span className="inline-flex items-center gap-1"><EyeOff size={11} /> Hidden by this rule</span>
                            : m.edit?.type === 'Disable' ? <span className="inline-flex items-center gap-1"><Lock size={11} /> Read-only</span>
                              : m.val?.type === 'Set value' ? <span className="font-medium text-[#364658]">{m.val.value.join(', ') || '…'}</span>
                                : m.val?.type === 'Clear value' ? 'Cleared' : `${f.kind === 'user' ? 'Select a person' : f.kind === 'dropdown' ? 'Select' : 'Enter a value'}`}
                        </div>
                        {Object.values(m).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.values(m).map((a) => (
                              <span key={a!.type} className="rounded-sm bg-[#F3F9EC] px-1.5 text-[10px] font-medium leading-4 text-[#4D8A1A]">{CHIP[a!.type as ActionType]}{a!.type === 'Set value' && a!.value.length ? ` → ${a!.value.join(', ')}` : ''}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {actionsError && <p data-form-error className="text-[11px] text-[#F25C4E]">{actionsError}</p>}
            </div>
          </section>
        </div>
      </div>

      {/* Inspector: the chosen field, or the rule's own details when nothing is chosen. */}
      <aside className="flex w-[340px] flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white">
        {!field ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-[#EEF2F6] px-4 py-3 text-[13px] font-medium text-[#364658]">Rule details</div>
            {detailsSlot}
            <p className="mx-4 mb-4 rounded-md bg-[#F9FAFB] px-3 py-2.5 text-[12px] leading-[1.6] text-[#7B8FA5]">Pick a field on the form to say what this rule does to it — show or hide it, make it mandatory, lock it or set its value.</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[#EEF2F6] px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[#364658]">{field.label}</div>
                <div className="text-[11px] text-[#7B8FA5]">What this rule does to it</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="ml-auto rounded-md px-2 py-1 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF]">Done</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                {DIMS.map((d) => {
                  const cur = mine(field.id)[d.dim];
                  return (
                    <div key={d.dim}>
                      <div className="mb-1.5 text-[12px] text-[#7B8FA5]">{d.label}</div>
                      <div className="pill-track">
                        {d.opts.map((o) => (
                          <button key={o.text} type="button" aria-pressed={(cur?.type ?? null) === o.type}
                            onClick={() => setDim(field.id, d.dim, o.type, o.type === 'Set value' ? cur?.value ?? [] : [])}>
                            {o.text}
                          </button>
                        ))}
                      </div>
                      {d.dim === 'val' && cur?.type === 'Set value' && field.kind !== 'attachment' && <div className="mt-2">{valueEditor(field, cur)}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <div className="mb-2 text-[12px] font-medium text-[#364658]">Other rules on this field</div>
                {othersOn(field.id).length === 0 ? (
                  <p className="text-[12px] text-[#7B8FA5]">No other rule changes {field.label}.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {othersOn(field.id).map((o, i) => {
                      const clash = conflicts.find((c) => c.fieldId === field.id && c.other.id === o.rule.id);
                      return (
                        <div key={i} className={`rounded-md px-2.5 py-2 ${clash ? 'bg-[#FEF6F6]' : 'bg-[#F9FAFB]'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-medium text-[#364658]">{o.rule.name}</span>
                            {clash && <span className="rounded-sm px-1 text-[10px] font-medium leading-4" style={{ color: KIND_TONE[clash.kind].fg, backgroundColor: KIND_TONE[clash.kind].bg }}>{clash.kind}</span>}
                            <button type="button" onClick={() => onOpenRule(o.rule.id)} className="ml-auto flex-shrink-0 text-[#3D8BD0]" title="Open rule"><ArrowUpRight size={12} /></button>
                          </div>
                          <div className="text-[12px] text-[#64748B]">{o.text}</div>
                          {clash && <div className="mt-1 text-[11px] text-[#7B8FA5]">{clash.outcome}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
