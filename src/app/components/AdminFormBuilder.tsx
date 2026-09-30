import { useState } from 'react';
import {
  AlignLeft, Calendar, CheckSquare, ChevronDownSquare, GitBranch, GripVertical, Hash, ListChecks, Lock,
  Paperclip, Plus, Trash2, Type, User, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { FIELD_KINDS, kindLabel, uid } from './formRuleData';
import type { FieldKind, FormField, FormRule } from './formRuleData';
import { FieldLabel, ToggleSwitch, inputCls } from './FormRuleControls';

/* The Form Builder tab — a basic one. Palette on the left (click or drag a field type in), the
 * request form as it will render in the middle, the chosen field's properties on the right.
 *
 * It edits the SAME field list the rule editor picks from, so the two tabs cannot disagree about
 * what is on the form. System fields ship with the product: they can be moved, relabelled and
 * resized, never deleted — and a field a rule depends on says so before it goes. */

const KIND_ICON: Record<FieldKind, React.ReactNode> = {
  text: <Type size={15} />, textarea: <AlignLeft size={15} />, dropdown: <ChevronDownSquare size={15} />,
  multiselect: <ListChecks size={15} />, user: <User size={15} />, number: <Hash size={15} />,
  date: <Calendar size={15} />, checkbox: <CheckSquare size={15} />, attachment: <Paperclip size={15} />,
};

const hasOptions = (k: FieldKind) => k === 'dropdown' || k === 'multiselect';

const newField = (kind: FieldKind, taken: FormField[]): FormField => {
  const base = `${kindLabel(kind)} field`;
  let label = base;
  for (let n = 2; taken.some((f) => f.label === label); n++) label = `${base} ${n}`;
  return {
    id: uid('fld'), label, kind, width: kind === 'textarea' || kind === 'attachment' ? 'full' : 'half',
    options: hasOptions(kind) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
  };
};

/** How a field will look on the form — a still, not a working control. */
function FieldPreview({ f }: { f: FormField }) {
  const box = 'flex h-9 w-full items-center rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px] text-[#9CA3AF]';
  switch (f.kind) {
    case 'textarea': return <div className={`${box} h-[68px] items-start pt-2`}>{f.placeholder || 'Enter text'}</div>;
    case 'checkbox': return <div className="flex items-center gap-2 text-[13px] text-[#64748B]"><span className="size-4 rounded border border-[#CBD5E1] bg-white" />{f.placeholder || f.label}</div>;
    case 'attachment': return <div className="flex h-12 items-center justify-center gap-2 rounded border border-dashed border-[#CBD5E1] bg-[#F9FAFB] text-[12px] text-[#7B8FA5]"><Paperclip size={14} /> Drop files or browse</div>;
    case 'dropdown': case 'multiselect': case 'user':
      return <div className={`${box} justify-between`}><span>{f.placeholder || (f.kind === 'user' ? 'Select a person' : `Select ${f.label.toLowerCase()}`)}</span><ChevronDownSquare size={14} className="text-[#CBD5E1]" /></div>;
    case 'date': return <div className={`${box} justify-between`}><span>{f.placeholder || 'Pick a date'}</span><Calendar size={14} className="text-[#CBD5E1]" /></div>;
    default: return <div className={box}>{f.placeholder || (f.kind === 'number' ? '0' : 'Enter text')}</div>;
  }
}

export function AdminFormBuilder({ fields, onFields, rules }: {
  fields: FormField[];
  onFields: (f: FormField[]) => void;
  rules: FormRule[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  /** A field some rule depends on waits here for the admin to confirm. */
  const [pendingRemove, setPendingRemove] = useState<FormField | null>(null);
  const selected = fields.find((f) => f.id === selectedId);

  /** Rules that read or write a field — shown on the field, and asked about before it is deleted. */
  const rulesUsing = (id: string) => rules.filter((r) =>
    r.groups.some((g) => g.conditions.some((c) => c.fieldId === id)) || r.actions.some((a) => a.fieldIds.includes(id)));

  const patch = (id: string, p: Partial<FormField>) => onFields(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const insert = (kind: FieldKind, beforeId?: string | null) => {
    const f = newField(kind, fields);
    const i = beforeId ? fields.findIndex((x) => x.id === beforeId) : -1;
    onFields(i < 0 ? [...fields, f] : [...fields.slice(0, i), f, ...fields.slice(i)]);
    setSelectedId(f.id);
    toast.success(`${f.label} added to the form`);
  };

  const move = (id: string, beforeId: string | null) => {
    if (id === beforeId) return;
    const moving = fields.find((f) => f.id === id)!;
    const rest = fields.filter((f) => f.id !== id);
    const i = beforeId ? rest.findIndex((f) => f.id === beforeId) : -1;
    onFields(i < 0 ? [...rest, moving] : [...rest.slice(0, i), moving, ...rest.slice(i)]);
  };

  const remove = (f: FormField, confirmed = false) => {
    if (!confirmed && rulesUsing(f.id).length) { setPendingRemove(f); return; }
    setPendingRemove(null);
    const i = fields.findIndex((x) => x.id === f.id);
    const next = fields.filter((x) => x.id !== f.id);
    onFields(next);
    setSelectedId(next[Math.min(i, next.length - 1)]?.id ?? null);
    toast.success(`${f.label} removed`);
  };

  const onDrop = (e: React.DragEvent, beforeId: string | null) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('text/form-kind') as FieldKind;
    if (kind) insert(kind, beforeId);
    else if (dragId) move(dragId, beforeId);
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)_320px] items-start gap-4">
      {/* Palette */}
      <aside className="sticky top-4 rounded-lg border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <div className="text-[13px] font-semibold text-[#364658]">Add a field</div>
          <p className="mt-0.5 text-[12px] text-[#7B8FA5]">Click to add, or drag onto the form.</p>
        </div>
        <div className="p-2">
          {FIELD_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/form-kind', k.kind); e.dataTransfer.effectAllowed = 'copy'; }}
              onClick={() => insert(k.kind, null)}
              className="group flex w-full cursor-grab items-center gap-2.5 rounded px-2 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="flex size-7 items-center justify-center rounded bg-[#F1F5F9] text-[#64748B]">{KIND_ICON[k.kind]}</span>
              <span className="flex-1">{k.label}</span>
              <Plus size={14} className="text-[#3D8BD0] opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </aside>

      {/* Canvas */}
      <section
        className="min-h-[480px] rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, null)}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-[#364658]">Request Form</div>
            <div className="text-[12px] text-[#7B8FA5]">{fields.length} fields · what requesters and technicians fill in</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => {
            const on = f.id === selectedId;
            const used = rulesUsing(f.id).length;
            return (
              <div
                key={f.id}
                draggable
                onDragStart={(e) => { setDragId(f.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverId(f.id); }}
                onDragLeave={() => setOverId((o) => (o === f.id ? null : o))}
                onDrop={(e) => { e.stopPropagation(); onDrop(e, f.id); }}
                onClick={() => setSelectedId(f.id)}
                className={`group relative cursor-pointer rounded-lg border bg-white p-3 transition-all ${f.width === 'full' ? 'col-span-2' : ''} ${on ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'} ${dragId === f.id ? 'opacity-40' : ''}`}
              >
                {overId === f.id && dragId !== f.id && <span className="absolute -top-2 left-0 right-0 h-0.5 rounded bg-[#3D8BD0]" />}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <GripVertical size={14} className="-ml-1 cursor-grab text-[#CBD5E1] opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="truncate text-[13px] text-[#364658]">{f.label}</span>
                  {f.required && <span className="text-[#DC2626]">*</span>}
                  <span className="ml-auto flex items-center gap-1.5">
                    {used > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-sm bg-[#FFF4E5] px-1.5 py-px text-[11px] font-medium text-[#B45309]"><GitBranch size={10} />{used}</span>
                        </TooltipTrigger>
                        <TooltipContent>{used} form rule{used > 1 ? 's' : ''} use this field</TooltipContent>
                      </Tooltip>
                    )}
                    {f.system && (
                      <Tooltip>
                        <TooltipTrigger asChild><span className="text-[#98A2B3]"><Lock size={12} /></span></TooltipTrigger>
                        <TooltipContent>System field — it can be moved and edited, not removed</TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
                <FieldPreview f={f} />
                {f.helpText && <p className="mt-1 text-[11px] text-[#7B8FA5]">{f.helpText}</p>}
              </div>
            );
          })}
        </div>
        {fields.length === 0 && (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] text-[13px] text-[#7B8FA5]">
            Drag a field type here to start the form
          </div>
        )}
      </section>

      {/* Properties */}
      <aside className="sticky top-4 rounded-lg border border-[#E5E7EB] bg-white">
        {!selected ? (
          <div className="px-5 py-10 text-center text-[13px] text-[#7B8FA5]">Select a field on the form to edit it.</div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] px-4 py-3">
              <span className="flex size-7 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]">{KIND_ICON[selected.kind]}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[#364658]">{selected.label}</div>
                <div className="text-[12px] text-[#7B8FA5]">{kindLabel(selected.kind)}{selected.system ? ' · System field' : ' · Custom field'}</div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <FieldLabel required>Label</FieldLabel>
                <input value={selected.label} onChange={(e) => patch(selected.id, { label: e.target.value })} className={inputCls} />
              </div>
              {selected.kind !== 'attachment' && (
                <div>
                  <FieldLabel>Placeholder</FieldLabel>
                  <input value={selected.placeholder ?? ''} onChange={(e) => patch(selected.id, { placeholder: e.target.value })} placeholder="Shown before anything is entered" className={inputCls} />
                </div>
              )}
              <div>
                <FieldLabel>Help text</FieldLabel>
                <input value={selected.helpText ?? ''} onChange={(e) => patch(selected.id, { helpText: e.target.value })} placeholder="A line under the field" className={inputCls} />
              </div>
              <div>
                <FieldLabel>Width</FieldLabel>
                <div className="pill-track">
                  {(['half', 'full'] as const).map((w) => (
                    <button key={w} type="button" aria-pressed={selected.width === w} onClick={() => patch(selected.id, { width: w })}>
                      {w === 'half' ? 'Half width' : 'Full width'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] text-[#364658]">Required</div>
                  <div className="text-[12px] text-[#7B8FA5]">Form rules can still change this per case</div>
                </div>
                <ToggleSwitch on={!!selected.required} onChange={(required) => patch(selected.id, { required })} />
              </div>
              {hasOptions(selected.kind) && (
                <div>
                  <FieldLabel>Options</FieldLabel>
                  <div className="space-y-1.5">
                    {(selected.options ?? []).map((o, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input value={o} onChange={(e) => patch(selected.id, { options: selected.options!.map((x, j) => (j === i ? e.target.value : x)) })} className={`${inputCls} h-8`} />
                        <button type="button" onClick={() => patch(selected.id, { options: selected.options!.filter((_, j) => j !== i) })} disabled={(selected.options?.length ?? 0) <= 1}
                          title="Remove option" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:opacity-40">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const v = newOption.trim();
                        if (!v) return;
                        patch(selected.id, { options: [...(selected.options ?? []), v] });
                        setNewOption('');
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Add an option" className={`${inputCls} h-8`} />
                      <button type="submit" title="Add option" className="flex size-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] text-[#3D8BD0] transition-colors hover:bg-[#F9FAFB]"><Plus size={14} /></button>
                    </form>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-[#E5E7EB] px-4 py-3">
              {selected.system ? (
                <p className="flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><Lock size={12} /> System fields can't be removed.</p>
              ) : (
                <button type="button" onClick={() => remove(selected)} className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2]">
                  <Trash2 size={14} /> Remove field
                </button>
              )}
            </div>
          </>
        )}
      </aside>

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
