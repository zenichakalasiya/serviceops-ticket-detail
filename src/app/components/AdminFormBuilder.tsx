import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, CircleDot, Copy, Grip, Hash, Heading, ListChecks, Menu, Move,
  Network, Paperclip, PenLine, Pencil, Settings, SquareDashed, Type, User, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PALETTE_GROUPS, holdsValue, kindLabel, uid } from './formRuleData';
import type { FieldKind, FormField, FormRule } from './formRuleData';
import { FormFieldEditPanel, hasOptionList } from './FormFieldEditPanel';
import { FieldConfigurePanel, FieldRulesPanel } from './FormFieldRulesPanel';

/* The Form Builder tab, redesigned to the product's own builder (Zeni, 21 Oct 2026).
 *
 * Palette on the left in the product's groups (click or drag a field type in), the request form on
 * the right in two columns. Hovering a field outlines it and shows its toolbar:
 *   Create Rule · move (drag) · half/full width · duplicate · edit · remove
 * and a field that rules use carries an "N Rules" chip. Create Rule and the chip open ONE panel —
 * create a rule from this field, or reuse a rule that already uses it; both land in the rule editor
 * with the field added as a condition.
 *
 * It edits the SAME field list the rule editor picks from, so the two tabs cannot disagree about
 * what is on the form. System fields can be moved, resized and edited, never removed — and a field
 * a rule depends on says so before it goes. */

const KIND_ICON: Record<FieldKind, React.ReactNode> = {
  text: <Type size={14} />, textarea: <AlignLeft size={14} />, richtext: <PenLine size={14} />,
  dropdown: <ChevronDown size={14} />, multiselect: <ListChecks size={14} />, date: <Calendar size={14} />,
  number: <Hash size={14} />, checkbox: <CheckSquare size={14} />, radio: <CircleDot size={14} />,
  attachment: <Paperclip size={14} />, section: <SquareDashed size={14} />, label: <Heading size={14} />,
  dependent: <Network size={14} />, user: <User size={14} />,
};

const newField = (kind: FieldKind, taken: FormField[]): FormField => {
  const base = kind === 'section' ? 'New Section' : kind === 'label' ? 'New Label' : `New ${kindLabel(kind)}`;
  let label = base;
  for (let n = 2; taken.some((f) => f.label === label); n++) label = `${base} ${n}`;
  return {
    id: uid('fld'), label, kind,
    width: ['textarea', 'richtext', 'attachment', 'section'].includes(kind) ? 'full' : 'half',
    options: hasOptionList(kind) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    requesterView: true, requesterEdit: true,
  };
};

/** How a field will look on the form — a still, not a working control. */
function FieldPreview({ f }: { f: FormField }) {
  const box = 'flex h-9 w-full items-center rounded border border-[#DFE5ED] bg-white px-3 text-[13px] text-[#B0BAC7]';
  const hint = f.placeholder;
  switch (f.kind) {
    case 'textarea': return <div className={`${box} h-[72px] items-start pt-2`}>{hint}</div>;
    case 'richtext': return (
      <div className="overflow-hidden rounded border border-[#DFE5ED] bg-white">
        <div className="flex h-7 items-center gap-2.5 border-b border-[#EEF2F6] bg-[#F9FAFB] px-2.5 text-[12px] font-semibold text-[#98A2B3]"><span>B</span><span className="italic">I</span><span className="underline">U</span></div>
        <div className="h-[52px] px-3 pt-1.5 text-[13px] text-[#B0BAC7]">{hint}</div>
      </div>
    );
    case 'checkbox': return <div className="flex h-9 items-center gap-2 text-[13px] text-[#64748B]"><span className="size-4 rounded-[4px] border border-[#CBD5E1] bg-white" />{hint || f.label}</div>;
    case 'radio': return (
      <div className="flex h-9 flex-wrap items-center gap-x-4 text-[13px] text-[#64748B]">
        {(f.options ?? []).slice(0, 3).map((o) => <span key={o} className="flex items-center gap-1.5"><span className="size-4 rounded-full border border-[#CBD5E1] bg-white" />{o}</span>)}
      </div>
    );
    case 'attachment': return <div className="flex h-9 items-center justify-center gap-2 rounded border border-dashed border-[#CBD5E1] bg-white text-[12px] text-[#7B8FA5]"><Paperclip size={13} /> Drop files or browse</div>;
    case 'dropdown': case 'multiselect': case 'user': case 'dependent':
      return <div className={`${box} justify-between`}><span className="truncate">{hint}</span><ChevronDown size={14} className="flex-shrink-0 text-[#B0BAC7]" /></div>;
    case 'date': return <div className={`${box} justify-between`}><span>{hint}</span><Calendar size={14} className="text-[#B0BAC7]" /></div>;
    default: return <div className={box}>{hint}</div>;
  }
}

const tb = 'flex size-8 items-center justify-center rounded text-[#1D2A3E] transition-colors hover:bg-white hover:text-[#1D2A3E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
/** The field's toolbar is two light-blue TABS attached to the top of its outline (the product's look). */
const TAB = 'flex h-10 items-center rounded-t-lg bg-[#EAF2FB] px-1.5';

/** A toolbar button whose name shows at once — every control here is a glyph. */
function TipBtn({ tip, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tip: string }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        {/* A disabled button fires no pointer events, so its reason needs a wrapper to hover. */}
        <span className="inline-flex"><button type="button" aria-label={tip} className={tb} {...p}>{children}</button></span>
      </TooltipTrigger>
      <TooltipContent side="top">{tip}</TooltipContent>
    </Tooltip>
  );
}

export function AdminFormBuilder({ fields, onFields, rules, onCreateRule, onReuseRule }: {
  fields: FormField[];
  onFields: (f: FormField[]) => void;
  rules: FormRule[];
  /** Open the rule editor on a new rule with this field as a condition. */
  onCreateRule: (fieldId: string) => void;
  /** Open an existing rule with this field added as a condition. */
  onReuseRule: (ruleId: string, fieldId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  /** Only the Move handle starts a drag — a field you are simply clicking must not lift off. */
  const [armed, setArmed] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  /** Create Rule opens Configure (create or reuse); the N Rules chip opens what those rules do. */
  const [panel, setPanel] = useState<{ id: string; kind: 'configure' | 'rules' } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  /** A field some rule depends on waits here for the admin to confirm. */
  const [pendingRemove, setPendingRemove] = useState<FormField | null>(null);
  const tiles = useRef<Record<string, HTMLDivElement | null>>({});

  /** Rules that read or write a field — the chip, the panel, and the question before it is deleted. */
  const rulesUsing = (id: string) => rules.filter((r) =>
    r.groups.some((g) => g.conditions.some((c) => c.fieldId === id)) || r.actions.some((a) => a.fieldIds.includes(id)));

  useEffect(() => {
    if (!flash) return;
    tiles.current[flash]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  const patch = (id: string, p: Partial<FormField>) => onFields(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const insert = (kind: FieldKind, beforeId?: string | null) => {
    const f = newField(kind, fields);
    const i = beforeId ? fields.findIndex((x) => x.id === beforeId) : -1;
    onFields(i < 0 ? [...fields, f] : [...fields.slice(0, i), f, ...fields.slice(i)]);
    setFlash(f.id);
    setEditId(f.id); // a new field has a placeholder name — the panel is where it gets its real one
  };

  const move = (id: string, beforeId: string | null) => {
    if (id === beforeId) return;
    const moving = fields.find((f) => f.id === id)!;
    const rest = fields.filter((f) => f.id !== id);
    const i = beforeId ? rest.findIndex((f) => f.id === beforeId) : -1;
    onFields(i < 0 ? [...rest, moving] : [...rest.slice(0, i), moving, ...rest.slice(i)]);
    setFlash(id);
  };

  const duplicate = (f: FormField) => {
    let label = `${f.label} copy`;
    for (let n = 2; fields.some((x) => x.label === label); n++) label = `${f.label} copy ${n}`;
    /* A copy is never a system field: the product ships one Priority, not two. */
    const copy: FormField = { ...structuredClone(f), id: uid('fld'), label, system: false };
    const i = fields.findIndex((x) => x.id === f.id);
    onFields([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setFlash(copy.id);
    toast.success(`${f.label} duplicated`);
  };

  const remove = (f: FormField, confirmed = false) => {
    if (!confirmed && rulesUsing(f.id).length) { setPendingRemove(f); return; }
    setPendingRemove(null);
    onFields(fields.filter((x) => x.id !== f.id));
    toast.success(`${f.label} removed`);
  };

  const onDrop = (e: React.DragEvent, beforeId: string | null) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('text/form-kind') as FieldKind;
    if (kind) insert(kind, beforeId);
    else if (dragId) move(dragId, beforeId);
    setDragId(null); setArmed(null); setOverId(null);
  };

  const editing = fields.find((f) => f.id === editId);
  const panelField = panel && fields.find((f) => f.id === panel.id);

  return (
    <div className="flex min-h-[560px] items-start">
      {/* Palette */}
      <aside className="sticky top-4 w-[240px] flex-shrink-0 border-r border-[#E5E7EB] pr-3">
        <div className="px-2 pb-1 text-[13px] font-semibold text-[#3D8BD0]">Custom Fields</div>
        <p className="px-2 pb-2 text-[12px] text-[#98A2B3]">Click or drag onto the form</p>
        {PALETTE_GROUPS.map((g) => (
          <div key={g.title} className="mb-1.5">
            <div className="px-2 pb-1 pt-2 text-[12px] text-[#7B8FA5]">{g.title}</div>
            {g.kinds.map((k) => (
              <button
                key={k}
                type="button"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/form-kind', k); e.dataTransfer.effectAllowed = 'copy'; }}
                onClick={() => insert(k, null)}
                className="group flex h-8 w-full items-center gap-2.5 rounded px-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                <span className="flex-shrink-0 text-[#3D8BD0]">{KIND_ICON[k]}</span>
                <span className="flex-1 truncate">{kindLabel(k)}</span>
                <Grip size={14} className="cursor-grab text-[#CBD5E1] group-hover:text-[#98A2B3]" />
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Canvas */}
      <section
        className="min-w-0 flex-1 pl-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, null)}
      >
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold text-[#1D2A3E]">Request Form</h2>
          <span className="text-[12px] text-[#98A2B3]">{fields.length} fields</span>
        </div>

        {fields.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] text-[13px] text-[#7B8FA5]">
            Drag a field type here to start the form
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-10">
            {fields.map((f) => {
              const used = holdsValue(f) ? rulesUsing(f.id).length : 0;
              const full = f.width === 'full' || f.kind === 'section';
              const over = overId === f.id && dragId !== f.id;
              return (
                <div
                  key={f.id}
                  ref={(el) => { tiles.current[f.id] = el; }}
                  draggable={armed === f.id}
                  onDragStart={(e) => { setDragId(f.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', f.id); }}
                  onDragEnd={() => { setDragId(null); setArmed(null); setOverId(null); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverId(f.id); }}
                  onDragLeave={() => setOverId((o) => (o === f.id ? null : o))}
                  onDrop={(e) => { e.stopPropagation(); onDrop(e, f.id); }}
                  onDoubleClick={() => setEditId(f.id)}
                  className={`group relative rounded-lg border border-dashed px-3 pb-3 pt-2.5 transition-colors focus-within:border-[#CBD5E1] hover:border-[#CBD5E1] ${full ? 'col-span-2' : ''} ${flash === f.id ? '!border-solid !border-[#3D8BD0] bg-[#F5FAFF]' : 'border-transparent'} ${dragId === f.id ? 'opacity-40' : ''}`}
                >
                  {over && <span className="absolute -top-[7px] left-3 right-3 h-0.5 rounded bg-[#3D8BD0]" />}

                  {/* Hover toolbar — two tabs sitting on the outline's top edge, right-aligned. */}
                  <div className="pointer-events-none absolute bottom-full right-4 z-10 flex items-end gap-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    {holdsValue(f) && (
                      <button type="button" onClick={() => setPanel({ id: f.id, kind: 'configure' })}
                        className={`${TAB} gap-2 !px-4 text-[14px] text-[#1D2A3E] transition-colors hover:bg-[#DCEBFA]`}>
                        <Settings size={16} fill="currentColor" stroke="#EAF2FB" strokeWidth={1.5} /> Create Rule
                      </button>
                    )}
                    <div className={`${TAB} gap-1 !px-2`}>
                      <TipBtn tip="Drag to move" onMouseDown={() => setArmed(f.id)} onMouseUp={() => setArmed(null)} className={`${tb} cursor-grab active:cursor-grabbing`}><Move size={17} /></TipBtn>
                      {f.kind !== 'section' && (
                        <TipBtn tip={f.width === 'full' ? 'Collapse to half width' : 'Expand to full width'} onClick={() => patch(f.id, { width: f.width === 'full' ? 'half' : 'full' })}>
                          <Menu size={17} />
                        </TipBtn>
                      )}
                      <TipBtn tip="Duplicate" onClick={() => duplicate(f)}><Copy size={16} /></TipBtn>
                      <TipBtn tip="Edit" onClick={() => setEditId(f.id)}><Pencil size={16} /></TipBtn>
                      <TipBtn tip={f.system ? 'System field — it can be moved and edited, not removed' : 'Remove'} disabled={f.system}
                        onClick={() => remove(f)} className={`${tb} hover:!text-[#DC2626]`}><X size={17} /></TipBtn>
                    </div>
                  </div>

                  {f.kind === 'section' ? (
                    <div className="border-b border-[#E5E7EB] pb-2 pt-1">
                      <div className="text-[14px] font-semibold text-[#1D2A3E]">{f.label}</div>
                      {f.helpText && <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{f.helpText}</div>}
                    </div>
                  ) : f.kind === 'label' ? (
                    <div className="py-1">
                      <div className="text-[13px] font-medium text-[#364658]">{f.label}</div>
                      {f.helpText && <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{f.helpText}</div>}
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex h-6 items-center gap-2">
                        <span className="truncate text-[14px] text-[#7B8FA5]">{f.label}{f.required && <span className="text-[#F25C4E]">*</span>}</span>
                        {used > 0 && (
                          <button type="button" onClick={() => setPanel({ id: f.id, kind: 'rules' })}
                            className="flex-shrink-0 rounded-full bg-[#EAF2FB] px-2.5 text-[13px] font-medium leading-[24px] text-[#1D2A3E] transition-colors hover:bg-[#DCEBFA]">
                            {used} Rule{used > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                      <FieldPreview f={f} />
                      {f.helpText && <p className="mt-1 text-[12px] text-[#7B8FA5]">{f.helpText}</p>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editing && (
        <FormFieldEditPanel
          key={editing.id}
          field={editing}
          onClose={() => setEditId(null)}
          onUpdate={(f) => { onFields(fields.map((x) => (x.id === f.id ? f : x))); setEditId(null); setFlash(f.id); toast.success(`${f.label} updated`); }}
        />
      )}

      {panelField && panel!.kind === 'configure' && (
        <FieldConfigurePanel field={panelField} rules={rules} onClose={() => setPanel(null)}
          onCreate={() => onCreateRule(panelField.id)} onReuse={(id) => onReuseRule(id, panelField.id)} />
      )}
      {panelField && panel!.kind === 'rules' && (
        <FieldRulesPanel field={panelField} fields={fields} rules={rules} onClose={() => setPanel(null)}
          onCreate={() => onCreateRule(panelField.id)} onReuse={(id) => onReuseRule(id, panelField.id)} />
      )}

      {pendingRemove && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/30" onMouseDown={() => setPendingRemove(null)}>
          <div className="w-[420px] rounded-lg bg-white p-5 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#364658]">Remove “{pendingRemove.label}”?</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">
              {rulesUsing(pendingRemove.id).length} form rule{rulesUsing(pendingRemove.id).length > 1 ? 's use' : ' uses'} this field:{' '}
              <span className="text-[#364658]">{rulesUsing(pendingRemove.id).map((r) => r.name).join(', ')}</span>. They will stop matching it.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingRemove(null)} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Keep field</button>
              <button type="button" onClick={() => remove(pendingRemove, true)} className="h-9 rounded bg-[#DC2626] px-4 text-[13px] font-medium text-white hover:bg-[#B91C1C]">Remove field</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
