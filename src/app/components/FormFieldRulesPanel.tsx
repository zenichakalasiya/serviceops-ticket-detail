import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Clock, ExternalLink, Filter as FilterIcon, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { APPLIES_OPTIONS, EVENT_OPTIONS, NO_VALUE } from './formRuleData';
import type { ActionType, Condition, FormField, FormRule } from './formRuleData';

/* Two side panels for one Form Builder field (Zeni, 21 Oct 2026):
 *
 *  · CONFIGURE (the field's "Create Rule" button) — create a new rule, or reuse a rule that already
 *    uses the field. A plain table: what you need to pick one, nothing more.
 *  · RULES (the field's "N Rules" chip) — what those rules actually DO, each one unfolded into its
 *    trigger, conditions and actions.
 *
 * Both hand the field to the rule editor as a CONDITION (Create New Rule / Reuse Rule). */

type Use = 'condition' | 'action' | 'both';
type Filter = 'all' | Use;

const useOf = (r: FormRule, id: string): Use | null => {
  const c = r.groups.some((g) => g.conditions.some((x) => x.fieldId === id));
  const a = r.actions.some((x) => x.fieldIds.includes(id));
  return c && a ? 'both' : c ? 'condition' : a ? 'action' : null;
};
const BEHAVIOUR: Record<Use, string> = { condition: 'Condition', action: 'Action', both: 'Condition & Action' };
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'condition', label: 'Conditions' }, { id: 'action', label: 'Actions' }, { id: 'both', label: 'Both' },
];

const VERB: Record<ActionType, string> = {
  Mandate: 'Make mandatory', 'Make optional': 'Make optional', Hide: 'Hide', Show: 'Show',
  Disable: 'Make read-only', Enable: 'Make editable', 'Set value': 'Set', 'Clear value': 'Clear',
};

function useRulesFor(field: FormField, rules: FormRule[]) {
  return useMemo(() => rules.map((r) => ({ r, use: useOf(r, field.id) })).filter((x): x is { r: FormRule; use: Use } => !!x.use), [rules, field.id]);
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
}

/** The panel shell both share: scrim, 640px sheet, a head with title + one line, close. */
function Sheet({ title, sub, onClose, children, wide }: { title: string; sub: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onMouseDown={onClose}>
      <div className={`flex h-full ${wide ? 'w-[760px]' : 'w-[640px]'} max-w-full flex-col bg-white shadow-xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-semibold text-[#1D2A3E]">{title}</h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#7B8FA5]">{sub}</p>
          </div>
          <button type="button" onClick={onClose} title="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-6">{children}</div>
      </div>
    </div>
  );
}

const DocLink = () => (
  <button type="button" onClick={() => toast.success('Opening the Form Rules docs')} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
    Doc <ExternalLink size={12} />
  </button>
);

/** The dashed "Create New Rule" button both panels open with. */
const CreateCta = ({ onCreate }: { onCreate: () => void }) => (
  <button type="button" onClick={onCreate}
    className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#3D8BD0] bg-[#F7FAFD] text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
    <Plus size={16} /> Create New Rule
  </button>
);

function Toolbar({ q, setQ, filter, setFilter, count, placeholder }: {
  q: string; setQ: (v: string) => void; filter: Filter; setFilter: (f: Filter) => void; count: (f: Filter) => number; placeholder: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
        {q && <button type="button" onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={14} /></button>}
      </div>
      <div className="pill-track">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} disabled={f.id !== 'all' && !count(f.id)} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
    </div>
  );
}

const ReuseBtn = ({ onClick, field }: { onClick: () => void; field: string }) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
      <button type="button" onClick={onClick}
        className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-md bg-[#EBF5FF] px-3 text-[14px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#DCEBFA]">
        Reuse Rule <ArrowUpRight size={15} />
      </button>
    </TooltipTrigger>
    <TooltipContent side="left">Open this rule with “{field}” added as a condition</TooltipContent>
  </Tooltip>
);

// ── Configure: Create Rule ───────────────────────────────────────────────────

/** "All ⏷" — the reference's filter button: a bordered box opening a short menu. */
function FilterMenu({ filter, setFilter, count }: { filter: Filter; setFilter: (f: Filter) => void; count: (f: Filter) => number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={'inline-flex h-10 items-center gap-1.5 rounded-md border bg-white px-3 text-[14px] text-[#364658] transition-colors hover:bg-[#F9FAFB] ' + (open || filter !== 'all' ? 'border-[#3D8BD0]' : 'border-[#DFE5ED]')}>
        {FILTERS.find((f) => f.id === filter)!.label} <FilterIcon size={15} className="text-[#64748B]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onMouseDown={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-[180px] rounded-md border border-[#DFE5ED] bg-white py-1 shadow-lg">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" disabled={f.id !== 'all' && !count(f.id)} onClick={() => { setFilter(f.id); setOpen(false); }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-40">
                <span className={filter === f.id ? 'font-medium text-[#3D8BD0]' : ''}>{f.label}</span>
                <span className="tabular-nums text-[#98A2B3]">{count(f.id)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function FieldConfigurePanel({ field, rules, onClose, onCreate, onReuse }: {
  field: FormField; rules: FormRule[]; onClose: () => void; onCreate: () => void; onReuse: (ruleId: string) => void;
}) {
  const using = useRulesFor(field, rules);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const count = (f: Filter) => (f === 'all' ? using.length : using.filter((x) => x.use === f).length);
  const term = q.trim().toLowerCase();
  const rows = using.filter((x) => (filter === 'all' || x.use === filter) && (!term || x.r.name.toLowerCase().includes(term)));
  useEscape(onClose);

  /* Laid out as Zeni's reference (Configure Priority), element for element. */
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onMouseDown={onClose}>
      <div className="flex h-full w-[840px] max-w-full flex-col bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <button type="button" onClick={onClose} title="Back" className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><ChevronLeft size={16} /></button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-medium leading-7 text-[#1D2A3E]">Configure {field.label}</h2>
            <p className="mt-1 text-[14px] text-[#7B8FA5]">Create a new rule or add this condition to an existing rule that already uses the {field.label} field. <DocLink /></p>
          </div>
          <button type="button" onClick={onClose} title="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={20} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">
          <h3 className="mb-3 text-[16px] font-medium text-[#1D2A3E]">Configure a new rule</h3>
          <button type="button" onClick={onCreate}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#3D8BD0] bg-[#F7F9FC] text-[15px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
            <Plus size={18} /> Create New Rule
          </button>

          <h3 className="mb-3 mt-7 text-[16px] font-medium text-[#1D2A3E]">Reuse an existing rule that already uses condition or action logic for {field.label}</h3>
          <div className="flex items-center gap-2.5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Select by rule name..."
              className="h-10 min-w-0 flex-1 rounded-md border border-[#DFE5ED] bg-white px-3.5 text-[14px] text-[#364658] placeholder:text-[#98A2B3] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            <FilterMenu filter={filter} setFilter={setFilter} count={count} />
          </div>

          <table className="mt-4 w-full table-fixed">
            <colgroup><col /><col className="w-[170px]" /><col className="w-[190px]" /><col className="w-[140px]" /></colgroup>
            <thead className="border-b border-[#E5E9F0]">
              <tr>{['Rule', 'Execute On', 'Behaviour', 'Action'].map((h) => (
                <th key={h} className="pb-3 pr-3 text-left text-[12px] font-medium uppercase tracking-[0.08em] text-[#98A2B3]">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-[13px] text-[#9CA3AF]">{using.length ? 'No rules match your search.' : 'No rule uses ' + field.label + ' yet.'}</td></tr>
              ) : rows.map(({ r, use }) => (
                <tr key={r.id}>
                  <td className="py-5 pr-3"><div className="truncate text-[14px] font-medium text-[#1D2A3E]" title={r.name}>{r.name}</div></td>
                  <td className="py-5 pr-3 text-[14px] text-[#364658]">{r.execution}</td>
                  <td className="py-5 pr-3 text-[14px] text-[#364658]">{BEHAVIOUR[use]}</td>
                  <td className="py-4"><ReuseBtn onClick={() => onReuse(r.id)} field={field.label} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Rules: the "N Rules" chip ───────────────────────────────────────────────

/** A list that shows its first `max` items and keeps the rest behind "+N more" (dark tooltip). */
function Clipped({ items, max, title }: { items: string[]; max: number; title: string }) {
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  return (
    <>
      {shown.join(', ')}
      {rest.length > 0 && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button type="button" className="ml-1.5 rounded-sm bg-[#EEF2F6] px-1.5 align-[1px] text-[11px] font-medium leading-[18px] text-[#364658] hover:bg-[#E2E8F0]">+{rest.length} more</button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[240px] p-0">
            <div className="px-3 pb-1 pt-2 text-[11px] font-medium text-white/60">{title}</div>
            <ul className="max-h-[200px] overflow-y-auto px-3 pb-2">
              {rest.map((x) => <li key={x} className="flex items-center gap-2 py-0.5 text-[12px]"><span className="size-1 rounded-full bg-[#F58518]" />{x}</li>)}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

function RuleBody({ rule, field, fields }: { rule: FormRule; field: FormField; fields: FormField[] }) {
  const label = (id: string) => fields.find((f) => f.id === id)?.label ?? id;
  const name = (id: string) => <span className={id === field.id ? 'font-medium text-[#2C6CA8]' : 'font-medium text-[#1D2A3E]'}>{label(id)}</span>;
  const cond = (c: Condition) => {
    const v = c.value.filter(Boolean);
    return <>{name(c.fieldId)} <span className="text-[#7B8FA5]">{c.op}</span>{c.op && !NO_VALUE.includes(c.op as never) && v.length > 0 && <> <Clipped items={v} max={2} title={`${label(c.fieldId)} ${c.op}`} /></>}</>;
  };
  const groups = rule.groups.map((g) => ({ ...g, conditions: g.conditions.filter((c) => c.fieldId) })).filter((g) => g.conditions.length);
  const actions = rule.actions.filter((a) => a.type);
  const applies = APPLIES_OPTIONS.find((o) => o.value === rule.applies)?.label ?? rule.applies;
  const event = EVENT_OPTIONS.find((o) => o.value === rule.event)?.label ?? rule.event;
  const Head = ({ children }: { children: React.ReactNode }) => <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[#98A2B3]">{children}</div>;

  return (
    <div className="border-t border-[#EEF2F6] px-5 pb-5 pt-4">
      <div className="flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><Clock size={13} /> {applies} · {event} · {rule.execution}</div>

      <div className="mt-5">
        <Head>Condition</Head>
        {groups.length === 0 ? <p className="text-[13px] text-[#7B8FA5]">None — runs every time</p> : groups.map((g, gi) => (
          <div key={g.id}>
            {gi > 0 && <div className="my-2 text-[12px] font-medium text-[#C2620E]">{g.join}</div>}
            <div className="border-l-2 border-[#E5E9F0] pl-3">
              {groups.length > 1 && <div className="mb-1 text-[12px] text-[#98A2B3]">Group {gi + 1}</div>}
              <ul className="space-y-1.5">
                {g.conditions.map((c, ci) => (
                  <li key={c.id} className="text-[13px] leading-[1.6] text-[#364658]">
                    {ci > 0 && <span className="mr-1 text-[12px] text-[#98A2B3]">{c.join.toLowerCase()}</span>}{cond(c)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Head>Action</Head>
        <ul className="space-y-1.5">
          {actions.map((a) => {
            /* The field this panel is about leads, so it is never the one hidden behind +N. */
            const ids = [...a.fieldIds.filter((x) => x === field.id), ...a.fieldIds.filter((x) => x !== field.id)];
            return (
              <li key={a.id} className="flex items-start gap-2 text-[13px] leading-[1.6] text-[#364658]">
                <span className="mt-[9px] size-1 flex-shrink-0 rounded-full bg-[#CBD5E1]" />
                <span>
                  <span className="text-[#7B8FA5]">{VERB[a.type as ActionType]}</span>{' '}
                  {ids.slice(0, 2).map((id, i) => <span key={id}>{i > 0 && ', '}{name(id)}</span>)}
                  {ids.length > 2 && <Clipped items={ids.slice(2).map(label)} max={0} title={VERB[a.type as ActionType]} />}
                  {a.type === 'Set value' && a.value[0] && <> <span className="text-[#7B8FA5]">to</span> <span className="font-medium text-[#1D2A3E]">{a.value[0]}</span></>}
                </span>
              </li>
            );
          })}
        </ul>
        {rule.reverse && <p className="mt-3 text-[12px] text-[#98A2B3]">Reverses its actions when the conditions stop matching.</p>}
      </div>
    </div>
  );
}

/** Read-only from the Form Builder (Zeni, 23 Oct 2026): Show Rules opens this to SEE what the
 *  rules do — no Create New Rule, no Reuse Rule. Both stay available to a caller that passes them. */
export function FieldRulesPanel({ field, fields, rules, onClose, onCreate, onReuse }: {
  field: FormField; fields: FormField[]; rules: FormRule[]; onClose: () => void; onCreate?: () => void; onReuse?: (ruleId: string) => void;
}) {
  const using = useRulesFor(field, rules);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Set<string>>(() => new Set(using[0] ? [using[0].r.id] : []));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const count = (f: Filter) => (f === 'all' ? using.length : using.filter((x) => x.use === f).length);
  const term = q.trim().toLowerCase();
  const shown = using.filter((x) => (filter === 'all' || x.use === filter) && (!term || x.r.name.toLowerCase().includes(term)));
  const SECTIONS: { use: Use; title: string; line: string }[] = [
    { use: 'condition', title: 'Used as condition', line: `Uses ${field.label} as a condition` },
    { use: 'action', title: 'Used as action', line: `Uses ${field.label} as an action` },
    { use: 'both', title: 'Used as condition and action', line: `Uses ${field.label} as a condition and an action` },
  ];

  return (
    <Sheet title={`Rules on ${field.label}`} onClose={onClose} sub={`${using.length} rule${using.length === 1 ? '' : 's'} check or change this field.`}>
      {onCreate && <CreateCta onCreate={onCreate} />}
      <div className={onCreate ? 'mt-6' : ''}><Toolbar q={q} setQ={setQ} filter={filter} setFilter={setFilter} count={count} placeholder="Search rules" /></div>
      {shown.length === 0 && <p className="py-12 text-center text-[13px] text-[#9CA3AF]">{using.length ? 'No rules match your search.' : `No rule uses ${field.label} yet.`}</p>}

      {SECTIONS.map((s) => {
        const list = shown.filter((x) => x.use === s.use);
        if (!list.length) return null;
        return (
          <section key={s.use} className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[14px] font-medium text-[#64748B]">{s.title}</span>
              <span className="h-px flex-1 bg-[#E5E9F0]" />
              <span className="text-[13px] tabular-nums text-[#64748B]">{list.length}</span>
            </div>
            <div className="space-y-3">
              {list.map(({ r }) => {
                const isOpen = open.has(r.id);
                return (
                  <div key={r.id} className="rounded-lg border border-[#E5E9F0] bg-white">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <button type="button" onClick={() => toggle(r.id)} aria-expanded={isOpen} className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-[#1D2A3E]">{r.name}</span>
                          {!r.enabled && <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 text-[11px] font-medium text-[#64748B]">Disabled</span>}
                        </span>
                        <span className="mt-1 block text-[13px] text-[#7B8FA5]">{s.line}</span>
                      </button>
                      {onReuse && <ReuseBtn onClick={() => onReuse(r.id)} field={field.label} />}
                      <button type="button" onClick={() => toggle(r.id)} aria-label={isOpen ? 'Collapse' : 'Expand'} className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6]">
                        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isOpen && <RuleBody rule={r} field={field} fields={fields} />}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </Sheet>
  );
}
