import { useEffect, useRef, useState } from 'react';
import { CheckIcon, Download, GripVertical, Info, Pencil, Plus, PlusCircle, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { kindLabel, uid } from './formRuleData';
import type { FormField, OptionNode } from './formRuleData';
import { ErrorText, FieldLabel, inputCls } from './FormRuleControls';

/* Edit Field — the side panel the pencil on a Form Builder field opens (Zeni, 21 Oct 2026, from the
 * product's "Edit Dependent Field" screen). It edits a DRAFT: Update commits, Cancel / ✕ / Esc / a
 * click on the scrim throw it away. Rebuilt in the product's own controls — 4px inputs, the blue
 * primary, pill-track for Type, the blue checkbox. */

export const hasOptionList = (k: FormField['kind']) => k === 'dropdown' || k === 'multiselect' || k === 'radio' || k === 'dependent';

/** A field's options as a tree (a flat list is a tree with no children). */
const treeOf = (f: FormField): OptionNode[] =>
  f.optionTree ?? (f.options ?? []).map((label) => ({ id: uid('opt'), label, children: [] }));

const labelsOf = (nodes: OptionNode[]): string[] => nodes.flatMap((n) => [n.label, ...labelsOf(n.children)]);
const pathsOf = (nodes: OptionNode[], pre = ''): string[] =>
  nodes.flatMap((n) => { const p = pre ? `${pre} > ${n.label}` : n.label; return [p, ...pathsOf(n.children, p)]; });

/** Every node change goes through one walk, so nesting depth never needs its own code. */
const mapTree = (nodes: OptionNode[], fn: (list: OptionNode[], parentId: string | null) => OptionNode[], parentId: string | null = null): OptionNode[] =>
  fn(nodes, parentId).map((n) => ({ ...n, children: mapTree(n.children, fn, n.id) }));

function Check({ checked, onChange, disabled, children }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex w-fit items-center gap-2 text-[13px] text-[#364658] ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <CheckboxPrimitive.Root
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange(v === true)}
        className="flex size-4 flex-shrink-0 items-center justify-center rounded-[4px] border border-[#CBD5E1] bg-white text-white transition-colors data-[state=checked]:border-[#3D8BD0] data-[state=checked]:bg-[#3D8BD0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D8BD0]/30"
      >
        <CheckboxPrimitive.Indicator><CheckIcon className="size-3" strokeWidth={3} /></CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {children}
    </label>
  );
}

const linkBtn = 'inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2C6CA8] disabled:cursor-not-allowed disabled:text-[#98A2B3]';
const rowBtn = 'flex size-7 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]';

/** One option row: grip · label (pencil turns it into an input) · edit · delete · add child (Dependent). */
function OptionRow({ node, depth, nested, editing, onEdit, onRename, onDelete, onAddChild, drag }: {
  node: OptionNode; depth: number; nested: boolean; editing: boolean;
  onEdit: () => void; onRename: (v: string) => void; onDelete: () => void; onAddChild: () => void;
  drag: { onStart: () => void; onOver: () => void; onDrop: () => void; onEnd: () => void; over: boolean; dragging: boolean };
}) {
  const [val, setVal] = useState(node.label);
  useEffect(() => setVal(node.label), [node.label, editing]);
  const commit = () => onRename(val.trim() || node.label);
  return (
    <div
      draggable={!editing}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; drag.onStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); drag.onOver(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); drag.onDrop(); }}
      onDragEnd={drag.onEnd}
      style={{ marginLeft: depth * 24 }}
      className={`group/opt relative flex h-10 items-center gap-1 rounded border bg-[#F9FAFB] pl-1 pr-1.5 transition-colors ${drag.dragging ? 'opacity-40' : ''} ${drag.over ? 'border-[#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'}`}
    >
      <span className="flex h-7 w-5 cursor-grab items-center justify-center text-[#CBD5E1] group-hover/opt:text-[#98A2B3]"><GripVertical size={14} /></span>
      {editing ? (
        <input
          autoFocus
          onFocus={(e) => e.target.select()}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { e.stopPropagation(); onRename(node.label); } }}
          className="h-7 min-w-0 flex-1 rounded border border-[#3D8BD0] bg-white px-2 text-[13px] text-[#364658] outline-none ring-1 ring-[#3D8BD0]"
        />
      ) : (
        <button type="button" onDoubleClick={onEdit} className="min-w-0 flex-1 truncate text-left text-[13px] text-[#364658]">{node.label}</button>
      )}
      <span className="flex items-center gap-0.5">
        <button type="button" onClick={onEdit} title="Rename" className={rowBtn}><Pencil size={14} /></button>
        <button type="button" onClick={onDelete} title="Delete option" className={`${rowBtn} hover:!bg-[#FEF2F2] hover:!text-[#DC2626]`}><X size={15} /></button>
        {nested && <button type="button" onClick={onAddChild} title="Add a child option" className={rowBtn}><PlusCircle size={15} /></button>}
      </span>
    </div>
  );
}

export function FormFieldEditPanel({ field, onClose, onUpdate }: {
  field: FormField;
  onClose: () => void;
  onUpdate: (f: FormField) => void;
}) {
  const [d, setD] = useState<FormField>(() => ({
    requesterView: true, requesterEdit: true, ...field,
  }));
  const [tree, setTree] = useState<OptionNode[]>(() => treeOf(field));
  const [editingOpt, setEditingOpt] = useState<string | null>(null);
  const [dragOpt, setDragOpt] = useState<string | null>(null);
  const [overOpt, setOverOpt] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<FormField>) => setD((x) => ({ ...x, ...p }));

  const nested = d.kind === 'dependent';
  const withOptions = hasOptionList(d.kind);
  const decorative = d.kind === 'section' || d.kind === 'label';

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !editingOpt) onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, editingOpt]);

  // ── option tree edits ─────────────────────────────────────────────────────
  const siblingsOf = (id: string, nodes = tree): OptionNode[] | null => {
    if (nodes.some((n) => n.id === id)) return nodes;
    for (const n of nodes) { const s = siblingsOf(id, n.children); if (s) return s; }
    return null;
  };
  const addOption = (parentId: string | null) => {
    const sibs = parentId ? siblingsOf(parentId)?.find((n) => n.id === parentId)?.children ?? [] : tree;
    let label = 'New option';
    for (let n = 2; sibs.some((s) => s.label === label); n++) label = `New option ${n}`;
    const node: OptionNode = { id: uid('opt'), label, children: [] };
    setTree((t) => (parentId
      ? mapTree(t, (list) => list.map((n) => (n.id === parentId ? { ...n, children: [...n.children, node] } : n)))
      : [...t, node]));
    setEditingOpt(node.id);
  };
  const renameOption = (id: string, label: string) => {
    setTree((t) => mapTree(t, (list) => list.map((n) => (n.id === id ? { ...n, label } : n))));
    setEditingOpt(null);
  };
  const deleteOption = (id: string) => setTree((t) => mapTree(t, (list) => list.filter((n) => n.id !== id)));
  /* Drag reorders among SIBLINGS only — dropping a child among the parents would silently change
     what it depends on, which is a different edit from changing its order. */
  const dropOption = (targetId: string) => {
    const from = dragOpt;
    setDragOpt(null); setOverOpt(null);
    if (!from || from === targetId) return;
    const sibs = siblingsOf(from);
    if (!sibs || !sibs.some((n) => n.id === targetId)) { toast.error('Options can only be reordered within the same level'); return; }
    setTree((t) => mapTree(t, (list) => {
      if (!list.some((n) => n.id === from)) return list;
      const moving = list.find((n) => n.id === from)!;
      const rest = list.filter((n) => n.id !== from);
      const i = rest.findIndex((n) => n.id === targetId);
      return [...rest.slice(0, i), moving, ...rest.slice(i)];
    }));
  };

  const renderTree = (nodes: OptionNode[], depth: number): React.ReactNode => nodes.map((n) => (
    <div key={n.id} className="space-y-1.5">
      <OptionRow
        node={n} depth={depth} nested={nested} editing={editingOpt === n.id}
        onEdit={() => setEditingOpt(n.id)}
        onRename={(v) => renameOption(n.id, v)}
        onDelete={() => deleteOption(n.id)}
        onAddChild={() => addOption(n.id)}
        drag={{
          onStart: () => setDragOpt(n.id), onOver: () => setOverOpt(n.id), onDrop: () => dropOption(n.id),
          onEnd: () => { setDragOpt(null); setOverOpt(null); }, over: overOpt === n.id && dragOpt !== n.id, dragging: dragOpt === n.id,
        }}
      />
      {n.children.length > 0 && renderTree(n.children, depth + 1)}
    </div>
  ));

  // ── import / export ───────────────────────────────────────────────────────
  const exportOptions = () => {
    const rows = nested ? pathsOf(tree) : tree.map((n) => n.label);
    const csv = ['Option', ...rows.map((r) => `"${r.replace(/"/g, '""')}"`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${(d.label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-options.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast.success(`${rows.length} option${rows.length === 1 ? '' : 's'} exported`);
  };
  /** One option per line. A Dependent field reads "Parent > Child" as a path and nests it. */
  const importOptions = async (file: File) => {
    const lines = (await file.text()).split(/\r?\n/).map((l) => l.replace(/^"|"$/g, '').replace(/""/g, '"').trim()).filter(Boolean);
    const body = /^option$/i.test(lines[0] ?? '') ? lines.slice(1) : lines;
    let added = 0;
    setTree((t) => {
      const next: OptionNode[] = structuredClone(t);
      for (const line of body) {
        const parts = nested ? line.split('>').map((p) => p.trim()).filter(Boolean) : [line];
        let level = next;
        for (const part of parts) {
          let hit = level.find((n) => n.label.toLowerCase() === part.toLowerCase());
          if (!hit) { hit = { id: uid('opt'), label: part, children: [] }; level.push(hit); added++; }
          level = hit.children;
        }
      }
      return next;
    });
    setTimeout(() => toast.success(added ? `${added} option${added === 1 ? '' : 's'} imported` : 'Every option in that file is already here'), 0);
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const dupSibling = (nodes: OptionNode[]): boolean => {
    const seen = new Set<string>();
    for (const n of nodes) { const k = n.label.trim().toLowerCase(); if (seen.has(k)) return true; seen.add(k); if (dupSibling(n.children)) return true; }
    return false;
  };
  const nameErr = !d.label.trim() ? 'Enter a name for the field' : '';
  const optErr = withOptions ? (!tree.length ? 'Add at least one option' : dupSibling(tree) ? 'Two options at the same level share a name' : '') : '';
  const update = () => {
    setTried(true);
    if (nameErr || optErr) return;
    onUpdate({
      ...d,
      label: d.label.trim(),
      options: withOptions ? labelsOf(tree) : d.options,
      optionTree: nested ? tree : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onMouseDown={onClose}>
      <div className="flex h-full w-[720px] max-w-full flex-col bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-[#1D2A3E]">
            Edit {kindLabel(field.kind)} Field <span className="font-normal text-[#98A2B3]">:</span> {d.label || field.label}
          </h2>
          <button type="button" onClick={onClose} title="Close" className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <FieldLabel required>{d.kind === 'label' ? 'Label text' : 'Name'}</FieldLabel>
              <input value={d.label} onChange={(e) => set({ label: e.target.value })} className={`${inputCls} ${tried && nameErr ? '!border-[#F25C4E]' : ''}`} autoFocus />
              {tried && nameErr && <ErrorText>{nameErr}</ErrorText>}
            </div>
            {!decorative && (
              <div>
                <FieldLabel>Hint Text</FieldLabel>
                <input value={d.placeholder ?? ''} onChange={(e) => set({ placeholder: e.target.value })} placeholder="Shown inside the field before anything is entered" className={inputCls} />
              </div>
            )}
            <div className={decorative ? '' : 'col-span-1'}>
              <FieldLabel>Description</FieldLabel>
              <input value={d.helpText ?? ''} onChange={(e) => set({ helpText: e.target.value })} placeholder="A line under the field" className={inputCls} />
            </div>
          </div>

          {!decorative && (
            <div className="mt-4">
              <FieldLabel required>Type</FieldLabel>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="pill-track w-fit">
                    <button type="button" aria-pressed={!d.system} disabled>Custom</button>
                    <button type="button" aria-pressed={!!d.system} disabled>System Field</button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{d.system ? 'Ships with the product — it can be edited and moved, not removed' : 'Added by your team — it can be removed'}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {nested && (
            <div className="mt-4 space-y-2.5">
              <Check checked={!!d.leafOnly} onChange={(v) => set({ leafOnly: v })}>Allow user to select leaf node only</Check>
              <Check checked={d.fullHierarchy ?? true} onChange={(v) => set({ fullHierarchy: v })}>Display Entire Hierarchy in Report</Check>
            </div>
          )}

          {withOptions && (
            <section className="mt-6 border-t border-[#E5E7EB] pt-5">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[14px] font-semibold text-[#1D2A3E]">Options</h3>
                <span className="text-[12px] text-[#7B8FA5]">Drag an option to change its order</span>
              </div>
              <div className="mt-3 flex items-center">
                <button type="button" onClick={() => addOption(null)} className={linkBtn}><Plus size={15} /> Add option</button>
                <span className="ml-auto flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className={linkBtn}><Upload size={14} /> Import</button>
                  <span className="h-4 w-px bg-[#DFE5ED]" />
                  <button type="button" onClick={exportOptions} disabled={!tree.length} className={linkBtn}><Download size={14} /> Export</button>
                </span>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importOptions(f); e.target.value = ''; }} />
              </div>
              <div className="mt-3 space-y-1.5">
                {tree.length ? renderTree(tree, 0) : (
                  <button type="button" onClick={() => addOption(null)} className="flex h-16 w-full items-center justify-center gap-1.5 rounded border border-dashed border-[#CBD5E1] text-[13px] text-[#7B8FA5] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
                    <Plus size={14} /> Add the first option
                  </button>
                )}
              </div>
              {nested && tree.length > 0 && <p className="mt-2 text-[12px] text-[#98A2B3]">Use ⊕ on an option to add the options that depend on it. Import reads “Parent &gt; Child” as a path.</p>}
              {tried && optErr && <ErrorText>{optErr}</ErrorText>}
            </section>
          )}

          {!decorative && (
            <section className="mt-6 grid grid-cols-2 gap-5 border-t border-[#E5E7EB] pt-5">
              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-[#1D2A3E]">Requester</h3>
                <div className="space-y-2.5">
                  {/* Each permission needs the one above it: you cannot edit what you cannot see. */}
                  <Check checked={!!d.requesterView} onChange={(v) => set(v ? { requesterView: true } : { requesterView: false, requesterEdit: false, requesterRequired: false })}>View</Check>
                  <Check checked={!!d.requesterEdit} onChange={(v) => set(v ? { requesterView: true, requesterEdit: true } : { requesterEdit: false, requesterRequired: false })}>Edit</Check>
                  <Check checked={!!d.requesterRequired} onChange={(v) => set(v ? { requesterView: true, requesterEdit: true, requesterRequired: true } : { requesterRequired: false })}>Required</Check>
                  <span className="flex items-center gap-1.5">
                    <Check checked={!!d.aiAccessible} onChange={(v) => set({ aiAccessible: v })}>AI Accessible</Check>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild><span className="cursor-help text-[#98A2B3]"><Info size={14} /></span></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[260px] text-wrap">Lets ServiceOps AI read this field's value when it answers the requester or summarises the request.</TooltipContent>
                    </Tooltip>
                  </span>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-[#1D2A3E]">Technician</h3>
                <Check checked={!!d.required} onChange={(v) => set({ required: v })}>Required</Check>
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]">Cancel</button>
          <button type="button" onClick={update} className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5]">Update</button>
        </div>
      </div>
    </div>
  );
}
