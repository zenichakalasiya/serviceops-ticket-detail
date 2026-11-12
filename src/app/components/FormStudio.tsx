import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, ChevronUp, GripVertical, Info, Lock, Plus, Search, X } from 'lucide-react';
import { RuleSelect, ToggleSwitch, inputCls } from './FormRuleControls';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PEOPLE, kindLabel, uid } from './formRuleData';
import type { FieldKind, FormField, OptionNode } from './formRuleData';
import { ADDABLE_KINDS, BUILD_GUIDE, REQ_MODE_HELP, TYPE_HELP, reqModeOf, reqModePatch, typeHelp } from './formStudioData';
import type { ReqMode } from './formStudioData';
import { useFormStudioUi } from './formStudioUi';

/* Form Studio — the admin form builder (Zeni, 2 Nov 2026; flow from the "ServiceOps Form Builder
 * Prototype" canvas). The form IS the canvas: sections hold fields on a 1–3 column grid, and whatever
 * is selected — the form, a section or a field — has its configuration open on the right, with its
 * help on top. No left field drawer. Build ⇄ Preview (as requester or technician) → Publish.
 *
 * V1 adds fields where they will sit, from a "+" between rows or "Add a field" at a section's end.
 * V2 (Jira-style) ends every section with "Type / to add a field" and a drop slot, and its right
 * panel is Fields | Settings | Guide, so field types can be DRAGGED onto a section.
 *
 * The form is the product's flat field list: a `section` field opens a section and carries its
 * settings. Fields before the first section form an untitled group. */

type Sel = { kind: 'form' } | { kind: 'section'; id: string } | { kind: 'field'; id: string };
interface Group { sec: FormField | null; items: FormField[]; start: number; end: number }

const CHOICE: FieldKind[] = ['dropdown', 'radio', 'multiselect', 'dependent', 'checkbox'];
const TEXTUAL: FieldKind[] = ['text', 'textarea', 'richtext', 'number', 'date', 'dropdown', 'multiselect', 'dependent', 'user'];
const WITH_OPTIONS: FieldKind[] = ['dropdown', 'multiselect', 'radio'];

function groupsOf(fields: FormField[]): Group[] {
  const out: Group[] = [];
  let cur: Group = { sec: null, items: [], start: 0, end: 0 };
  fields.forEach((f, i) => {
    if (f.kind === 'section') {
      if (cur.sec || cur.items.length) out.push({ ...cur, end: i });
      cur = { sec: f, items: [], start: i + 1, end: i + 1 };
    } else cur.items.push(f);
  });
  if (cur.sec || cur.items.length) out.push({ ...cur, end: fields.length });
  return out;
}
const colsOf = (g: Group) => (g.sec?.cols ?? 2) as 1 | 2 | 3;
/** Rows of a section: fields fill the columns in order, a full-row field takes a row to itself. */
function rowsOf(g: Group) {
  const cols = colsOf(g);
  const rows: { items: FormField[]; end: number }[] = [];
  let cur: FormField[] = []; let w = 0;
  g.items.forEach((f) => {
    const span = f.width === 'full' ? cols : 1;
    if (w + span > cols && cur.length) { rows.push({ items: cur, end: 0 }); cur = []; w = 0; }
    cur.push(f); w += span;
  });
  if (cur.length) rows.push({ items: cur, end: 0 });
  return rows;
}
const optionsOf = (f: FormField) => (f.kind === 'dependent' ? (f.optionTree ?? []).map((n) => n.label) : f.options ?? []);
const treeText = (t: OptionNode[], d = 0): string => t.map((n) => '\t'.repeat(d) + n.label + (n.children.length ? '\n' + treeText(n.children, d + 1) : '')).join('\n');
function parseTree(text: string): OptionNode[] {
  const root: OptionNode[] = []; const stack: { d: number; node: OptionNode }[] = [];
  text.split('\n').forEach((line) => {
    if (!line.trim()) return;
    const d = (line.match(/^\t*/)?.[0].length ?? 0);
    const node: OptionNode = { id: uid('o'), label: line.trim(), children: [] };
    while (stack.length && stack[stack.length - 1].d >= d) stack.pop();
    (stack.length ? stack[stack.length - 1].node.children : root).push(node);
    stack.push({ d, node });
  });
  return root;
}
const roleWords = (f: FormField) => {
  if (f.kind === 'label') return '';
  const m = reqModeOf(f);
  const r = m === 'hidden' ? 'Hidden from requesters' : m === 'readonly' ? 'Read-only for requesters' : m === 'required' ? 'Required' : 'Optional';
  return f.required && m !== 'required' ? `${r} · technician must fill` : r;
};

/* ── Small shared bits ── */
const btn2 = 'h-8 rounded border border-[#DFE5ED] bg-white px-3 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50';
const btn1 = 'h-8 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]';
const Lbl = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] text-[#7B8FA5]">{children}</label>;
const Help = ({ children }: { children: React.ReactNode }) => <p className="mt-1 text-[12px] leading-[1.45] text-[#7B8FA5]">{children}</p>;
function Pills<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="pill-track w-full" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}
const Chip = ({ children, tone = 'grey' }: { children: React.ReactNode; tone?: 'grey' | 'amber' | 'blue' }) => (
  <span className={'whitespace-nowrap rounded-full px-2 py-px text-[11px] font-medium ' + (tone === 'amber' ? 'bg-[#FFF7E6] text-[#B45309]' : tone === 'blue' ? 'bg-[#EBF5FF] text-[#2F6FAE]' : 'bg-[#EEF2F6] text-[#475569]')}>{children}</span>
);

/** Field types matching a search, in menu order. */
const matchKinds = (query: string) => TYPE_HELP.filter((t) => ADDABLE_KINDS.includes(t.kind) && (kindLabel(t.kind) + ' ' + t.desc).toLowerCase().includes(query.trim().toLowerCase()));

/** The add menu: search plus every type, each with what it is for. */
function AddMenu({ onPick, onClose, query, onQuery, below, typed }: {
  onPick: (k: FieldKind) => void; onClose: () => void; query: string; onQuery: (q: string) => void; below?: boolean;
  /** V2's "Type / to add a field": the box above IS the search, so the menu has none of its own. */
  typed?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node) && !typed?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [onClose, typed]);
  const list = matchKinds(query);
  return (
    <div ref={ref} data-rule-menu className={'absolute z-30 w-[340px] rounded-lg border border-[#DFE5ED] bg-white p-2 shadow-lg ' + (below ? 'left-0 top-[calc(100%+6px)]' : 'left-1/2 top-5 -translate-x-1/2')}>
      {typed ? <p className="px-2 pb-1 text-[11.5px] text-[#94A3B8]">Keep typing to filter · Enter adds the first</p> : <div className="relative mb-1">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input autoFocus value={query} onChange={(e) => onQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) onPick(list[0].kind); }}
          placeholder="Search field types…" aria-label="Field type" className={inputCls + ' !rounded pl-8'} />
      </div>}
      <div className="max-h-[300px] overflow-y-auto">
        {list.map((t) => (
          <button key={t.kind} type="button" onClick={() => onPick(t.kind)} className="flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-[#F1F5F9]">
            <span className="text-[13px] font-medium text-[#1D2A3E]">{kindLabel(t.kind)}</span>
            <span className="text-[11.5px] text-[#7B8FA5]">{t.desc}</span>
          </button>
        ))}
        {!list.length && <p className="px-2 py-3 text-[12px] text-[#7B8FA5]">No field type matches “{query}”.</p>}
      </div>
    </div>
  );
}

/** A field as it will look, small: the control's empty shape. */
function FieldFace({ f }: { f: FormField }) {
  if (f.kind === 'label') return <span className="text-[12.5px] text-[#475569]">{f.helpText || f.label}</span>;
  if (f.kind === 'checkbox') return <span className="flex items-center gap-2 text-[12px] text-[#7B8FA5]"><span className="size-3.5 rounded-[3px] border border-[#CBD5E1]" />{f.placeholder || 'Yes / No'}</span>;
  if (f.kind === 'radio' || (f.kind === 'dependent' && optionsOf(f).length)) return <span className="flex flex-wrap gap-1">{optionsOf(f).slice(0, 4).map((o) => <Chip key={o}>{o}</Chip>)}{optionsOf(f).length > 4 && <Chip>+{optionsOf(f).length - 4}</Chip>}</span>;
  if (f.kind === 'attachment') return <span className="flex h-8 items-center justify-center rounded border border-dashed border-[#CBD5E1] text-[11.5px] text-[#94A3B8]">Drop files here or browse</span>;
  const tall = f.kind === 'textarea' || f.kind === 'richtext';
  return <span className={'flex items-start rounded border border-[#E5E9F0] bg-[#F8FAFC] px-2.5 text-[11.5px] text-[#94A3B8] ' + (tall ? 'h-12 pt-1.5' : 'h-8 items-center')}>{f.placeholder || (WITH_OPTIONS.includes(f.kind) || f.kind === 'user' || f.kind === 'dependent' ? 'Select' : '')}</span>;
}

export interface FormStudioProps {
  title: string;
  noun: string;
  fields: FormField[];
  onFields: (next: FormField[]) => void;
  /** How many form rules use a field — shown in its settings. */
  rulesUsing?: (fieldId: string) => number;
}

export function FormStudio({ title, noun, fields, onFields, rulesUsing }: FormStudioProps) {
  const ui = useFormStudioUi();
  const [mode, setMode] = useState<'build' | 'preview'>('build');
  const [sel, setSel] = useState<Sel>({ kind: 'form' });
  const [menu, setMenu] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'fields' | 'settings' | 'guide'>('fields');
  const [aboutOpen, setAboutOpen] = useState(true);
  const [published, setPublished] = useState(() => ({ version: 1, snap: JSON.stringify(fields) }));
  const [publishOpen, setPublishOpen] = useState(false);
  const [note, setNote] = useState('');
  const [role, setRole] = useState<'req' | 'tech'>('req');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dropAt, setDropAt] = useState<number | null>(null);
  /** V2's "Type / to add a field" boxes, by section — the menu treats a click in its box as inside. */
  const typeBoxes = useRef<Record<string, HTMLInputElement | null>>({});
  const dirty = JSON.stringify(fields) !== published.snap;
  const groups = useMemo(() => groupsOf(fields), [fields]);
  const values = fields.filter((f) => f.kind !== 'section');
  const sections = fields.filter((f) => f.kind === 'section');

  /* ── edits ── */
  const patch = (id: string, p: Partial<FormField>) => onFields(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const insertAt = (i: number, f: FormField[]) => { const a = [...fields]; a.splice(i, 0, ...f); onFields(a); };
  const select = (s: Sel) => { setSel(s); setMenu(null); if (ui === 'v2' && s.kind !== 'form') setTab('settings'); };
  const newField = (kind: FieldKind): FormField => ({
    id: uid('f'), label: kindLabel(kind) === 'Datetime' ? 'Date' : kindLabel(kind), kind, width: kind === 'textarea' || kind === 'richtext' || kind === 'attachment' ? 'full' : 'half',
    ...(WITH_OPTIONS.includes(kind) ? { options: ['Option 1', 'Option 2'] } : {}),
    ...(kind === 'dependent' ? { optionTree: parseTree('Level 1\n\tLevel 2'), options: ['Level 1'] } : {}),
    ...(kind === 'label' ? { helpText: 'Write the note people should read here.' } : {}),
  });
  /** Add a field at a flat index; on an empty form a section is made for it first. */
  const addAt = (i: number, kind: FieldKind) => {
    const f = newField(kind);
    if (!fields.length) { const s: FormField = { id: uid('s'), label: 'Custom fields', kind: 'section', width: 'full', cols: 2 }; onFields([s, f]); }
    else insertAt(i, [f]);
    setMenu(null); setQ(''); setSel({ kind: 'field', id: f.id }); if (ui === 'v2') setTab('settings');
  };
  const addSection = () => {
    const s: FormField = { id: uid('s'), label: 'New section', kind: 'section', width: 'full', cols: 2 };
    onFields([...fields, s]); setSel({ kind: 'section', id: s.id }); if (ui === 'v2') setTab('settings');
    requestAnimationFrame(() => document.querySelector(`[data-sec="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
  const moveField = (id: string, dir: -1 | 1) => {
    const i = fields.findIndex((f) => f.id === id); const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const a = [...fields]; [a[i], a[j]] = [a[j], a[i]];
    /* Stepping past a section header moves the field into the next section — never above the first. */
    if (a[0].kind !== 'section' && fields[0].kind === 'section') return;
    onFields(a);
  };
  const moveSection = (id: string, dir: -1 | 1) => {
    const gi = groups.findIndex((g) => g.sec?.id === id); const gj = gi + dir;
    if (gj < 0 || gj >= groups.length || !groups[gj].sec) return;
    const block = (g: Group) => fields.slice(g.start - 1, g.end);
    const order = groups.map((g) => (g.sec ? block(g) : g.items));
    [order[gi], order[gj]] = [order[gj], order[gi]];
    onFields(order.flat());
  };
  const moveTo = (id: string, secId: string) => {
    const f = fields.find((x) => x.id === id)!; const rest = fields.filter((x) => x.id !== id);
    const g = groupsOf(rest).find((x) => x.sec?.id === secId); if (!g) return;
    const a = [...rest]; a.splice(g.end, 0, f); onFields(a);
  };
  const removeField = (id: string) => { onFields(fields.filter((f) => f.id !== id)); setSel({ kind: 'form' }); };
  /** Deleting a section keeps its fields: they join the section above. */
  const removeSection = (id: string) => { onFields(fields.filter((f) => f.id !== id)); setSel({ kind: 'form' }); toast.success('Section removed — its fields joined the section above'); };
  /** V2 drag: a new type, or an existing field, dropped at a flat index. */
  const dropTo = (i: number, e: React.DragEvent) => {
    e.preventDefault(); setDropAt(null);
    const kind = e.dataTransfer.getData('text/form-kind') as FieldKind;
    const moved = e.dataTransfer.getData('text/form-field');
    if (kind) return addAt(i, kind);
    if (moved) {
      const from = fields.findIndex((f) => f.id === moved); if (from < 0) return;
      const a = [...fields]; const [f] = a.splice(from, 1); a.splice(from < i ? i - 1 : i, 0, f); onFields(a);
    }
  };
  const dragOver = (i: number) => (e: React.DragEvent) => {
    if (![...e.dataTransfer.types].some((t) => t === 'text/form-kind' || t === 'text/form-field')) return;
    e.preventDefault(); if (dropAt !== i) setDropAt(i);
  };

  const selected = sel.kind === 'field' ? fields.find((f) => f.id === sel.id) : sel.kind === 'section' ? fields.find((f) => f.id === sel.id) : undefined;
  useEffect(() => { if ((sel.kind === 'field' || sel.kind === 'section') && !selected) setSel({ kind: 'form' }); }, [sel, selected]);
  const groupOfField = (id: string) => groups.find((g) => g.items.some((f) => f.id === id));
  const stats = [
    { v: values.length, label: `fields in ${sections.length} section${sections.length === 1 ? '' : 's'}` },
    { v: values.filter((f) => reqModeOf(f) === 'required').length, label: 'required for requesters' },
    { v: values.filter((f) => reqModeOf(f) === 'hidden').length + sections.filter((s) => s.techOnly).length, label: 'hidden from requesters' },
    { v: sections.filter((s) => s.showWhen).length, label: 'conditional sections' },
  ];

  /* ── configuration (shared by V1's panel and V2's Settings tab) ── */
  const formSettings = (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Form</div>
        <div className="text-[15px] font-semibold text-[#1D2A3E]">{title}</div>
        <p className="mt-1 text-[12px] text-[#7B8FA5]">{stats.map((s) => `${s.v} ${s.label}`).join(' · ')}</p>
      </div>
      {guideBody()}
    </div>
  );
  function guideBody() {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-[#F4F6FA] p-3">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#1D2A3E]"><BookOpen size={14} className="text-[#3D8BD0]" />How to build a custom form</div>
          <ol className="flex flex-col gap-2.5">
            {BUILD_GUIDE.map((s, i) => (
              <li key={s.title} className="flex gap-2.5">
                <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#475569] ring-1 ring-[#DFE5ED]">{i + 1}</span>
                <span className="min-w-0"><span className="block text-[12.5px] font-medium text-[#1D2A3E]">{s.title}</span><span className="block text-[12px] leading-[1.5] text-[#64748B]">{s.text}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-semibold text-[#1D2A3E]">Field types</div>
          <div className="flex flex-col gap-1.5">
            {TYPE_HELP.filter((t) => ADDABLE_KINDS.includes(t.kind)).map((t) => (
              <div key={t.kind} className="rounded-lg border border-[#EEF2F6] px-3 py-2">
                <div className="flex items-baseline gap-2"><span className="text-[12.5px] font-medium text-[#1D2A3E]">{kindLabel(t.kind)}</span><span className="text-[11.5px] text-[#94A3B8]">{t.desc}</span></div>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[#64748B]">{t.how}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sectionSettings = (s: FormField) => {
    const gi = groups.findIndex((g) => g.sec?.id === s.id);
    const choices = values.filter((f) => CHOICE.includes(f.kind) && !groups[gi]?.items.some((x) => x.id === f.id));
    const src = s.showWhen && fields.find((f) => f.id === s.showWhen!.fieldId);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Section</div><div className="truncate text-[15px] font-semibold text-[#1D2A3E]">{s.label}</div></div>
          <button type="button" className={btn2 + ' !px-2'} aria-label="Move section up" disabled={gi <= 0 || !groups[gi - 1]?.sec} onClick={() => moveSection(s.id, -1)}><ArrowUp size={14} /></button>
          <button type="button" className={btn2 + ' !px-2'} aria-label="Move section down" disabled={gi >= groups.length - 1} onClick={() => moveSection(s.id, 1)}><ArrowDown size={14} /></button>
        </div>
        <div><Lbl htmlFor="ss-t">Title</Lbl><input id="ss-t" className={inputCls + ' !rounded'} value={s.label} onChange={(e) => patch(s.id, { label: e.target.value })} /></div>
        <div><Lbl htmlFor="ss-d">Description under the title</Lbl><input id="ss-d" className={inputCls + ' !rounded'} value={s.helpText ?? ''} placeholder="Optional" onChange={(e) => patch(s.id, { helpText: e.target.value })} /></div>
        <div><Lbl>Columns</Lbl><Pills label="Columns" value={String(s.cols ?? 2) as '1' | '2' | '3'} options={[['1', '1'], ['2', '2'], ['3', '3']]} onChange={(v) => patch(s.id, { cols: Number(v) as 1 | 2 | 3 })} /><Help>Fields fill the columns in order. Any field can take the full row.</Help></div>
        <div><Lbl>Who sees this section</Lbl><Pills label="Who sees this section" value={s.techOnly ? 'tech' : 'all'} options={[['all', 'Requesters and technicians'], ['tech', 'Technicians only']]} onChange={(v) => patch(s.id, { techOnly: v === 'tech' })} /><Help>{s.techOnly ? 'Requesters never see this section or the fields in it.' : 'Every field in it follows its own requester setting.'}</Help></div>
        <div>
          <Lbl>Show only when</Lbl>
          {s.showWhen ? (
            <div className="flex flex-col gap-2">
              <RuleSelect className="!rounded" value={[s.showWhen.fieldId]} options={choices.map((f) => ({ value: f.id, label: f.label }))} onChange={(v) => v[0] && patch(s.id, { showWhen: { fieldId: v[0], value: '' } })} />
              <div className="flex items-center gap-2"><span className="text-[12px] text-[#7B8FA5]">is</span>
                <div className="min-w-0 flex-1"><RuleSelect className="!rounded" value={s.showWhen.value ? [s.showWhen.value] : []} placeholder="Choose a value" options={(src ? (src.kind === 'checkbox' ? ['Checked'] : optionsOf(src)) : []).map((o) => ({ value: o, label: o }))} onChange={(v) => patch(s.id, { showWhen: { ...s.showWhen!, value: v[0] ?? '' } })} /></div>
              </div>
              <button type="button" className="self-start text-[12px] font-medium text-[#3D8BD0] hover:underline" onClick={() => patch(s.id, { showWhen: undefined })}>Always show instead</button>
            </div>
          ) : choices.length ? (
            <><Help>Always shown.</Help><button type="button" className="mt-1 text-[12px] font-medium text-[#3D8BD0] hover:underline" onClick={() => patch(s.id, { showWhen: { fieldId: choices[0].id, value: '' } })}>+ Show only when an answer is given…</button></>
          ) : <Help>Always shown. A condition needs a choice field (dropdown, radio, checkbox) in another section.</Help>}
        </div>
        <div className="rounded-lg bg-[#F4F6FA] p-3"><div className="text-[12.5px] font-semibold text-[#1D2A3E]">About sections</div><p className="mt-1 text-[12px] leading-[1.5] text-[#64748B]">A section groups fields under a heading and carries the rules for all of them: how many columns, who sees it, and when it appears. Put fields that belong to one answer in one section so one condition covers them all.</p></div>
        <button type="button" className={btn2 + ' self-start !text-[#D92D20]'} onClick={() => removeSection(s.id)}>Delete section, keep its fields</button>
      </div>
    );
  };

  const fieldSettings = (f: FormField) => {
    const h = typeHelp(f.kind);
    const g = groupOfField(f.id);
    const used = rulesUsing?.(f.id) ?? 0;
    const mode = reqModeOf(f);
    const i = fields.findIndex((x) => x.id === f.id);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Field · {kindLabel(f.kind)}{f.system && ' · System'}</div><div className="truncate text-[15px] font-semibold text-[#1D2A3E]">{f.label}</div></div>
          <button type="button" className={btn2 + ' !px-2'} aria-label="Move up" disabled={i <= 1 && fields[0]?.kind === 'section' || i <= 0} onClick={() => moveField(f.id, -1)}><ArrowUp size={14} /></button>
          <button type="button" className={btn2 + ' !px-2'} aria-label="Move down" disabled={i >= fields.length - 1} onClick={() => moveField(f.id, 1)}><ArrowDown size={14} /></button>
        </div>
        <div className="rounded-lg bg-[#F4F6FA] px-3 py-2.5">
          <button type="button" onClick={() => setAboutOpen(!aboutOpen)} aria-expanded={aboutOpen} className="flex w-full items-center gap-2 text-left text-[12.5px] font-semibold text-[#1D2A3E]">
            <Info size={14} className="text-[#3D8BD0]" /><span className="flex-1">What this field is</span>{aboutOpen ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
          </button>
          {aboutOpen && (
            <div className="mt-1.5 flex flex-col gap-1.5 pl-[22px] text-[12px] leading-[1.5] text-[#64748B]">
              <p>{h.what}</p>
              <p><span className="font-medium text-[#1D2A3E]">How to configure it. </span>{h.how}</p>
              <p className="italic">Example: {h.example}</p>
            </div>
          )}
        </div>
        <div><Lbl htmlFor="ff-l">{f.kind === 'label' ? 'Heading' : 'Name people see'}</Lbl><input id="ff-l" className={inputCls + ' !rounded'} value={f.label} onChange={(e) => patch(f.id, { label: e.target.value })} /></div>
        {f.kind === 'label' && <div><Lbl htmlFor="ff-tx">Text shown on the form</Lbl><textarea id="ff-tx" rows={3} className={inputCls + ' !h-auto !rounded py-2'} value={f.helpText ?? ''} onChange={(e) => patch(f.id, { helpText: e.target.value })} /></div>}
        <div>
          <Lbl>Type</Lbl>
          {f.system ? <p className="flex h-8 items-center gap-1.5 rounded border border-[#EEF2F6] bg-[#F8FAFC] px-3 text-[12px] text-[#64748B]"><Lock size={12} />{kindLabel(f.kind)} — a system field keeps its type</p>
            : <RuleSelect className="!rounded" value={[f.kind]} options={ADDABLE_KINDS.map((k) => ({ value: k, label: kindLabel(k) }))} onChange={(v) => { const k = v[0] as FieldKind; if (!k) return; patch(f.id, { kind: k, ...(WITH_OPTIONS.includes(k) && !f.options?.length ? { options: ['Option 1', 'Option 2'] } : {}), ...(k === 'dependent' && !f.optionTree ? { optionTree: parseTree('Level 1\n\tLevel 2') } : {}) }); }} />}
        </div>
        {f.kind !== 'label' && (
          <>
            <div><Lbl>Requester</Lbl><Pills<ReqMode> label="Requester" value={mode} options={[['hidden', 'Hidden'], ['readonly', 'Read-only'], ['optional', 'Optional'], ['required', 'Required']]} onChange={(m) => patch(f.id, reqModePatch(m))} /><Help>{REQ_MODE_HELP[mode]}{g?.sec?.techOnly ? ' The whole section is technicians only, so requesters do not see it either way.' : ''}</Help></div>
            <div><Lbl>Technician</Lbl><Pills label="Technician" value={f.required ? 'req' : 'opt'} options={[['opt', 'Optional'], ['req', 'Required to save']]} onChange={(v) => patch(f.id, { required: v === 'req' })} /></div>
          </>
        )}
        <div><Lbl>Width</Lbl><Pills label="Width" value={f.width} options={[['half', 'One column'], ['full', 'Full row']]} onChange={(v) => patch(f.id, { width: v })} /><Help>The section has {colsOf(g ?? groups[0])} column{colsOf(g ?? groups[0]) === 1 ? '' : 's'}.</Help></div>
        {WITH_OPTIONS.includes(f.kind) && (
          <div><Lbl htmlFor="ff-o">Options — one per line</Lbl>
            <textarea id="ff-o" rows={5} spellCheck={false} className="w-full rounded border border-[#DFE5ED] px-3 py-2 font-mono text-[12px] leading-[1.55] text-[#364658] focus:border-[#3D8BD0] focus:outline-none" value={(f.options ?? []).join('\n')} onChange={(e) => patch(f.id, { options: e.target.value.split('\n') })} onBlur={() => patch(f.id, { options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) })} />
            <Help>{(f.options ?? []).filter((o) => o.trim()).length} options · paste a column from Excel.</Help></div>
        )}
        {f.kind === 'dependent' && (
          <div><Lbl htmlFor="ff-d">Levels — Tab for a child line</Lbl>
            <textarea id="ff-d" rows={6} spellCheck={false} className="w-full rounded border border-[#DFE5ED] px-3 py-2 font-mono text-[12px] leading-[1.55] text-[#364658] [tab-size:3] focus:border-[#3D8BD0] focus:outline-none" defaultValue={treeText(f.optionTree ?? [])} key={f.id}
              onKeyDown={(e) => { if (e.key !== 'Tab') return; e.preventDefault(); const el = e.currentTarget; const s = el.selectionStart; const ls = el.value.lastIndexOf('\n', s - 1) + 1; el.value = e.shiftKey ? (el.value[ls] === '\t' ? el.value.slice(0, ls) + el.value.slice(ls + 1) : el.value) : el.value.slice(0, ls) + '\t' + el.value.slice(ls); el.selectionStart = el.selectionEnd = s + (e.shiftKey ? -1 : 1); }}
              onBlur={(e) => { const t = parseTree(e.target.value); patch(f.id, { optionTree: t, options: t.map((x) => x.label) }); }} />
            <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[12px] text-[#364658]">Must pick the most specific level</span><ToggleSwitch on={!!f.leafOnly} onChange={(v) => patch(f.id, { leafOnly: v })} /></div>
          </div>
        )}
        {TEXTUAL.includes(f.kind) && f.kind !== 'user' && <div><Lbl htmlFor="ff-h">Hint text</Lbl><input id="ff-h" className={inputCls + ' !rounded'} value={f.placeholder ?? ''} placeholder="Grey text inside the empty box — show an example" onChange={(e) => patch(f.id, { placeholder: e.target.value })} /></div>}
        {f.kind !== 'label' && <div><Lbl htmlFor="ff-ds">Help under the field</Lbl><input id="ff-ds" className={inputCls + ' !rounded'} value={f.helpText ?? ''} placeholder="Optional — one line that answers the usual question" onChange={(e) => patch(f.id, { helpText: e.target.value })} /></div>}
        {f.kind !== 'label' && <div className="flex items-center justify-between gap-3"><span className="text-[12px] text-[#364658]">AI can read this field<span className="block text-[11.5px] text-[#7B8FA5]">Used for summaries and suggestions.</span></span><ToggleSwitch on={f.aiAccessible !== false} onChange={(v) => patch(f.id, { aiAccessible: v })} /></div>}
        {sections.length > 0 && <div><Lbl>Move to section</Lbl><RuleSelect className="!rounded" value={g?.sec ? [g.sec.id] : []} options={sections.map((s) => ({ value: s.id, label: s.label }))} onChange={(v) => v[0] && moveTo(f.id, v[0])} /></div>}
        {used > 0 && <p className="flex items-center gap-1.5 rounded-lg bg-[#EBF5FF] px-3 py-2 text-[12px] text-[#2F6FAE]"><Info size={13} />Used in {used} form rule{used === 1 ? '' : 's'}.</p>}
        {f.system ? (
          <Tooltip><TooltipTrigger asChild><span className="self-start"><button type="button" disabled className={btn2}>Delete field</button></span></TooltipTrigger><TooltipContent side="top">System fields can be hidden from requesters but not deleted.</TooltipContent></Tooltip>
        ) : <button type="button" className={btn2 + ' self-start !text-[#D92D20]'} onClick={() => removeField(f.id)}>Delete field</button>}
      </div>
    );
  };
  const settings = selected?.kind === 'section' ? sectionSettings(selected) : selected ? fieldSettings(selected) : formSettings;

  /* ── canvas ── */
  const sectionHead = (g: Group, v2: boolean) => g.sec ? (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => select({ kind: 'section', id: g.sec!.id })} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left">
        <span className="text-[15px] font-semibold text-[#1D2A3E]">{g.sec.label}</span>
        {!v2 && <Chip>{colsOf(g)} column{colsOf(g) === 1 ? '' : 's'}</Chip>}
        {g.sec.techOnly && <Chip tone="amber">Technicians only</Chip>}
        {g.sec.showWhen && <Chip tone="blue">Shown when {fields.find((x) => x.id === g.sec!.showWhen!.fieldId)?.label ?? '…'} is {g.sec.showWhen.value || '…'}</Chip>}
      </button>
      {v2 ? (
        <button type="button" className={btn2 + ' !h-7'} onClick={() => { select({ kind: 'section', id: g.sec!.id }); const c = values.find((f) => CHOICE.includes(f.kind) && !g.items.includes(f)); if (!g.sec!.showWhen && c) patch(g.sec!.id, { showWhen: { fieldId: c.id, value: '' } }); }}>
          {g.sec.showWhen ? 'Edit condition' : '+ Add condition'}
        </button>
      ) : <span className="text-[12px] text-[#94A3B8]">Section settings →</span>}
    </div>
  ) : null;

  const fieldCard = (f: FormField, cols: number, v2: boolean) => {
    const i = fields.findIndex((x) => x.id === f.id);
    const on = sel.kind === 'field' && sel.id === f.id;
    return (
      <div key={f.id} style={{ gridColumn: `span ${f.width === 'full' ? cols : 1}` }} className="relative min-w-0"
        onDragOver={v2 ? (e) => { const r = e.currentTarget.getBoundingClientRect(); dragOver(e.clientY < r.top + r.height / 2 ? i : i + 1)(e); } : undefined}
        onDrop={v2 ? (e) => dropTo(dropAt ?? i, e) : undefined}>
        {v2 && dropAt === i && <span className="absolute -top-[5px] left-0 right-0 h-[3px] rounded-full bg-[#3D8BD0]" />}
        {v2 && dropAt === i + 1 && <span className="absolute -bottom-[5px] left-0 right-0 h-[3px] rounded-full bg-[#3D8BD0]" />}
        <button type="button" onClick={() => select({ kind: 'field', id: f.id })} draggable={v2}
          onDragStart={v2 ? (e) => { e.dataTransfer.setData('text/form-field', f.id); e.dataTransfer.effectAllowed = 'move'; } : undefined}
          onDragEnd={() => setDropAt(null)}
          className={'group flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors ' + (on ? 'border-[#3D8BD0] ring-2 ring-[#EBF5FF]' : 'border-[#DFE5ED] hover:border-[#94A3B8]') + (reqModeOf(f) === 'hidden' ? ' bg-[#FAFBFC]' : ' bg-white')}>
          <span className="flex items-center gap-1.5">
            {v2 && <GripVertical size={14} className="-ml-1 flex-shrink-0 cursor-grab text-[#CBD5E1] group-hover:text-[#94A3B8]" />}
            <span className="min-w-0 truncate text-[13px] font-medium text-[#1D2A3E]">{f.label}</span>
            {f.kind !== 'label' && reqModeOf(f) === 'required' && <span className="text-[#F25C4E]">*</span>}
            {f.system && <Lock size={11} className="flex-shrink-0 text-[#94A3B8]" aria-label="System field" />}
            <span className="ml-auto flex-shrink-0 text-[11.5px] text-[#94A3B8]">{v2 ? kindLabel(f.kind) : roleWords(f)}</span>
          </span>
          <FieldFace f={f} />
          {!v2 && <span className="text-[11px] text-[#94A3B8]">{kindLabel(f.kind)}</span>}
        </button>
      </div>
    );
  };

  /* V1 — "+" between rows and "Add a field" at the end */
  const canvasV1 = (g: Group, gi: number) => {
    const cols = colsOf(g);
    const rows = rowsOf(g);
    let idx = g.start;
    const on = sel.kind === 'section' && g.sec && sel.id === g.sec.id;
    return (
      <section key={g.sec?.id ?? 'lead'} data-sec={g.sec?.id} className={'flex flex-col gap-2 rounded-xl border bg-white p-4 ' + (on ? 'border-[#3D8BD0]' : 'border-[#DFE5ED]')}>
        {sectionHead(g, false)}
        {g.sec?.helpText && <p className="-mt-1 text-[12px] text-[#7B8FA5]">{g.sec.helpText}</p>}
        <div className="flex flex-col">
          {rows.map((r) => {
            idx += r.items.length; const after = idx; const key = `${gi}:${after}`;
            return (
              <div key={key}>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{r.items.map((f) => fieldCard(f, cols, false))}</div>
                <div className={'group/plus relative grid h-4 place-items-center ' + (menu === key ? 'z-30' : '')}>
                  <span className={'absolute inset-x-0 top-1/2 h-px bg-[#CBD5E1] transition-opacity ' + (menu === key ? 'opacity-100' : 'opacity-0 group-hover/plus:opacity-100')} />
                  <button type="button" aria-label="Add a field here" onClick={() => { setMenu(key); setQ(''); }}
                    className={'relative z-[1] grid size-[22px] place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#3D8BD0] transition-opacity ' + (menu === key ? 'opacity-100' : 'opacity-0 group-hover/plus:opacity-100 focus:opacity-100')}><Plus size={13} /></button>
                  {menu === key && <AddMenu query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(after, k)} />}
                </div>
              </div>
            );
          })}
          <div className="relative">
            <button type="button" onClick={() => { setMenu(`${gi}:end`); setQ(''); }} className="w-full rounded-lg border border-dashed border-[#CBD5E1] py-2 text-[12.5px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FBFF]">
              + Add a field{g.sec ? ` to ${g.sec.label}` : ''}
            </button>
            {menu === `${gi}:end` && <AddMenu below query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(g.end, k)} />}
          </div>
        </div>
      </section>
    );
  };

  /* V2 — Jira-style: "Type / to add a field" and a drop slot at the end of every section */
  const canvasV2 = (g: Group, gi: number) => {
    const cols = colsOf(g);
    const on = sel.kind === 'section' && g.sec && sel.id === g.sec.id;
    const key = `${gi}:type`;
    return (
      <section key={g.sec?.id ?? 'lead'} data-sec={g.sec?.id} className={'flex flex-col gap-3 rounded-xl border bg-white p-4 ' + (on ? 'border-[#3D8BD0]' : 'border-[#DFE5ED]')}>
        {sectionHead(g, true)}
        {g.sec?.helpText && <p className="-mt-2 text-[12px] text-[#7B8FA5]">{g.sec.helpText}</p>}
        {g.items.length > 0 && <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{g.items.map((f) => fieldCard(f, cols, true))}</div>}
        <div className="relative">
          <input ref={(el) => { typeBoxes.current[key] = el; }} value={menu === key ? q : ''} placeholder="Type / to add a field" aria-label={`Add a field to ${g.sec?.label ?? 'the form'}`}
            onFocus={() => { setMenu(key); }} onChange={(e) => { setMenu(key); setQ(e.target.value.replace(/^\//, '')); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const m = matchKinds(q)[0]; if (m) addAt(g.end, m.kind); } if (e.key === 'Escape') { setMenu(null); setQ(''); e.currentTarget.blur(); } }}
            className="h-9 w-full rounded-lg border border-dashed border-[#CBD5E1] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#94A3B8] focus:border-[#3D8BD0] focus:outline-none" />
          {menu === key && <AddMenu below typed={typeBoxes.current[key]} query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(g.end, k)} />}
        </div>
        <div onDragOver={dragOver(g.end)} onDragLeave={() => setDropAt(null)} onDrop={(e) => dropTo(g.end, e)}
          className={'flex h-10 items-center rounded-lg border border-dashed px-3 text-[13px] transition-colors ' + (dropAt === g.end ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#2F6FAE]' : 'border-[#CBD5E1] text-[#94A3B8]')}>
          Drop a field here
        </div>
      </section>
    );
  };

  const empty = (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center">
      <div className="text-[14px] font-semibold text-[#1D2A3E]">This form has no fields yet</div>
      <p className="max-w-[420px] text-[12.5px] text-[#64748B]">Custom fields appear on every {noun} beside the product’s own fields. Start with a section, then add the fields that belong in it.</p>
      <div className="flex gap-2"><button type="button" className={btn1} onClick={addSection}>+ Add a section</button>
        <div className="relative"><button type="button" className={btn2} onClick={() => { setMenu('empty'); setQ(''); }}>+ Add a field</button>
          {menu === 'empty' && <AddMenu below query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(0, k)} />}</div>
      </div>
    </div>
  );

  /* ── preview ── */
  const isReq = role === 'req';
  const secVisible = (g: Group) => {
    if (!g.sec) return true;
    if (isReq && g.sec.techOnly) return false;
    if (!g.sec.showWhen?.value) return true;
    return (answers[g.sec.showWhen.fieldId] ?? '') === g.sec.showWhen.value;
  };
  const control = (f: FormField) => {
    const ro = isReq && reqModeOf(f) === 'readonly';
    const set = (v: string) => setAnswers((a) => ({ ...a, [f.id]: v }));
    const val = answers[f.id] ?? '';
    switch (f.kind) {
      case 'label': return null;
      case 'textarea': case 'richtext': return <textarea disabled={ro} rows={3} placeholder={f.placeholder} className={inputCls + ' !h-auto !rounded py-2'} />;
      case 'dropdown': case 'multiselect': case 'user': case 'dependent': {
        const o = f.kind === 'user' ? PEOPLE.map((p) => p.name) : optionsOf(f);
        return <RuleSelect className="!rounded" disabled={ro} multi={f.kind === 'multiselect'} value={val ? [val] : []} options={o.map((x) => ({ value: x, label: x }))} onChange={(v) => set(v[0] ?? '')} />;
      }
      case 'radio': return <div className="flex flex-wrap gap-3">{optionsOf(f).map((o) => <label key={o} className="flex items-center gap-1.5 text-[12.5px] text-[#364658]"><input type="radio" disabled={ro} name={f.id} checked={val === o} onChange={() => set(o)} />{o}</label>)}</div>;
      case 'checkbox': return <label className="flex items-center gap-2 text-[12.5px] text-[#364658]"><input type="checkbox" disabled={ro} checked={val === 'Checked'} onChange={(e) => set(e.target.checked ? 'Checked' : '')} />{f.placeholder || 'Yes'}</label>;
      case 'attachment': return <div className="flex h-9 items-center justify-center rounded border border-dashed border-[#CBD5E1] text-[12px] text-[#94A3B8]">Drop files here or browse</div>;
      case 'date': return <input type="datetime-local" disabled={ro} className={inputCls + ' !rounded'} />;
      case 'number': return <input type="number" disabled={ro} placeholder={f.placeholder} className={inputCls + ' !rounded'} />;
      default: return <input disabled={ro} placeholder={f.placeholder} className={inputCls + ' !rounded'} />;
    }
  };
  const hiddenNow = isReq ? [...sections.filter((s) => s.techOnly).map((s) => `${s.label} (whole section)`), ...values.filter((f) => reqModeOf(f) === 'hidden').map((f) => f.label)] : [];
  const condNow = sections.filter((s) => s.showWhen && !(isReq && s.techOnly)).map((s) => `${s.label} — when ${fields.find((x) => x.id === s.showWhen!.fieldId)?.label ?? '…'} is ${s.showWhen!.value || '…'}`);
  const preview = (
    <div className="flex min-h-0 flex-1">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-6">
        <div className="mx-auto flex max-w-[820px] flex-col gap-5 rounded-xl border border-[#DFE5ED] bg-white p-6">
          <div className="text-[16px] font-semibold text-[#1D2A3E]">{isReq ? `New ${noun}` : title}</div>
          {groups.filter(secVisible).map((g) => {
            const items = g.items.filter((f) => !isReq || reqModeOf(f) !== 'hidden');
            if (!items.length) return null;
            const cols = colsOf(g);
            return (
              <div key={g.sec?.id ?? 'lead'} className="flex flex-col gap-3">
                {g.sec && <div><div className="text-[14px] font-semibold text-[#1D2A3E]">{g.sec.label}</div>{g.sec.helpText && <div className="text-[12px] text-[#7B8FA5]">{g.sec.helpText}</div>}</div>}
                <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {items.map((f) => (
                    <div key={f.id} style={{ gridColumn: `span ${f.width === 'full' ? cols : 1}` }} className="min-w-0">
                      {f.kind === 'label' ? <p className="text-[12.5px] text-[#475569]"><span className="font-semibold text-[#1D2A3E]">{f.label}</span> {f.helpText}</p> : <>
                        <label className="mb-1.5 block text-[12px] text-[#7B8FA5]">{f.label}{(isReq ? reqModeOf(f) === 'required' : f.required) && <span className="text-[#F25C4E]"> *</span>}</label>
                        {control(f)}
                        {f.helpText && <p className="mt-1 text-[11.5px] text-[#94A3B8]">{f.helpText}</p>}
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div><button type="button" className={btn1} onClick={() => toast('Preview only — nothing is submitted')}>{isReq ? `Submit ${noun}` : 'Save'}</button></div>
        </div>
      </div>
      <aside className="flex w-[360px] flex-shrink-0 flex-col gap-3 overflow-y-auto border-l border-[#DFE5ED] bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Preview checks</div>
        {[[isReq ? 'Requester on the portal' : 'Technician on the record', isReq ? 'Technician-only sections and hidden fields are left out. * must be filled to submit. Read-only fields are greyed.' : 'Every section and field. * must be filled before the record can be saved.'],
          ['Not shown to this role', hiddenNow.length ? hiddenNow.join(' · ') : 'Nothing — this role sees every field.'],
          ['Appears on an answer', condNow.length ? condNow.join(' · ') : 'No conditional sections.']].map(([t, d]) => (
          <div key={t} className="rounded-lg bg-[#F4F6FA] p-3"><div className="text-[12.5px] font-semibold text-[#1D2A3E]">{t}</div><p className="mt-1 text-[12px] leading-[1.5] text-[#64748B]">{d}</p></div>
        ))}
        <p className="text-[12px] text-[#7B8FA5]">Answer the fields to test the conditions. Nothing you type here is saved.</p>
      </aside>
    </div>
  );

  /* ── page ── */
  const v2 = ui === 'v2';
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#EEF2F6] px-4 py-2.5">
        {dirty ? <Chip tone="amber">Draft · changes not published</Chip> : <Chip>Published · v{published.version}</Chip>}
        <div className="ml-auto flex items-center gap-2">
          {mode === 'preview' && (
            <div className="pill-track" role="group" aria-label="See it as">
              <button type="button" aria-pressed={isReq} onClick={() => { setRole('req'); setAnswers({}); }}>Requester</button>
              <button type="button" aria-pressed={!isReq} onClick={() => { setRole('tech'); setAnswers({}); }}>Technician</button>
            </div>
          )}
          <div className="pill-track" role="group" aria-label="Mode">
            <button type="button" aria-pressed={mode === 'build'} onClick={() => setMode('build')}>{v2 ? 'Edit' : 'Build'}</button>
            <button type="button" aria-pressed={mode === 'preview'} onClick={() => { setMode('preview'); setAnswers({}); setMenu(null); }}>Preview</button>
          </div>
          <button type="button" className={btn2} onClick={() => toast.success('Draft saved')}>Save draft</button>
          <button type="button" className={btn1} onClick={() => setPublishOpen(true)}>Publish</button>
        </div>
      </div>

      {mode === 'preview' ? preview : (
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#F7F9FC]" onClick={(e) => { if (e.target === e.currentTarget) select({ kind: 'form' }); }}>
            <div className="mx-auto flex max-w-[860px] flex-col gap-4 p-6" onClick={(e) => { if (e.target === e.currentTarget) select({ kind: 'form' }); }}>
              {groups.length ? groups.map((g, gi) => (v2 ? canvasV2(g, gi) : canvasV1(g, gi))) : empty}
              {groups.length > 0 && <button type="button" onClick={addSection} className="rounded-xl border border-dashed border-[#CBD5E1] py-2.5 text-[12.5px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FBFF]">+ Add a section</button>}
            </div>
          </div>
          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white">
            {v2 && (
              <div className="flex flex-shrink-0 gap-2.5 border-b border-[#EEF2F6] px-4" role="tablist">
                {(['fields', 'settings', 'guide'] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={'border-b-2 px-2 py-3 text-[13px] capitalize transition-colors ' + (tab === t ? 'border-[#3D8BD0] font-medium text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]')}>{t}</button>
                ))}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {v2 && tab === 'fields' ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Drag onto a section</div>
                  <p className="-mt-1 text-[12px] text-[#7B8FA5]">Or click one to add it to {selected?.kind === 'section' ? selected.label : 'the selected section'}.</p>
                  {ADDABLE_KINDS.map((k) => (
                    <button key={k} type="button" draggable onDragStart={(e) => { e.dataTransfer.setData('text/form-kind', k); e.dataTransfer.effectAllowed = 'copy'; }} onDragEnd={() => setDropAt(null)}
                      onClick={() => { const g = (sel.kind === 'section' && groups.find((x) => x.sec?.id === sel.id)) || (sel.kind === 'field' && groupOfField(sel.id)) || groups[groups.length - 1]; addAt(g ? g.end : 0, k); }}
                      className="flex cursor-grab items-center gap-2 rounded-lg border border-[#DFE5ED] bg-white px-3 py-2 text-left transition-colors hover:border-[#94A3B8] active:cursor-grabbing">
                      <GripVertical size={14} className="text-[#CBD5E1]" />
                      <span className="min-w-0"><span className="block text-[13px] font-medium text-[#1D2A3E]">{kindLabel(k)}</span><span className="block truncate text-[11.5px] text-[#7B8FA5]">{typeHelp(k).desc}</span></span>
                    </button>
                  ))}
                  <button type="button" onClick={addSection} className={btn2 + ' mt-1'}>+ Add a section</button>
                </div>
              ) : v2 && tab === 'guide' ? guideBody() : (
                v2 && sel.kind === 'form' ? <div className="flex flex-col items-center gap-2 py-10 text-center"><p className="text-[13px] font-medium text-[#1D2A3E]">Nothing selected</p><p className="text-[12px] text-[#7B8FA5]">Click a section or a field on the form to change its settings.</p></div> : settings
              )}
            </div>
          </aside>
        </div>
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F172A]/40" onClick={() => setPublishOpen(false)}>
          <div className="w-[480px] rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Publish ${title}`}>
            <div className="flex items-center"><h2 className="flex-1 text-[16px] font-semibold text-[#1D2A3E]">Publish {title}</h2>
              <button type="button" aria-label="Close" onClick={() => setPublishOpen(false)} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} /></button></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.map((s) => <div key={s.label} className="rounded-lg border border-[#EEF2F6] px-3 py-2"><div className="text-[20px] font-semibold tabular-nums text-[#1D2A3E]">{s.v}</div><div className="text-[12px] text-[#7B8FA5]">{s.label}</div></div>)}
            </div>
            <div className="mt-4"><Lbl htmlFor="pb-n">What changed (optional)</Lbl><input id="pb-n" className={inputCls + ' !rounded'} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Added Laptop model; Asset tag now required" /></div>
            <p className="mt-3 text-[12px] text-[#7B8FA5]">The new version applies to every new {noun} at once. The previous version stays in History.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btn2} onClick={() => { setPublishOpen(false); setMode('preview'); }}>Preview once more</button>
              <button type="button" className={btn1} onClick={() => { setPublished({ version: published.version + 1, snap: JSON.stringify(fields) }); setPublishOpen(false); setNote(''); toast.success(`${title} published — version ${published.version + 1}`); }}>Publish version {published.version + 1}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
