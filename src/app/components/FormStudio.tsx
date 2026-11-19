import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  AlignLeft, ArrowDown, ArrowUp, Banknote, BookOpen, Calendar, Check, ChevronRight, CircleHelp, Columns2, Copy, Download, RectangleHorizontal, Upload, CheckSquare, ChevronDown, ChevronUp, CircleDot, GripVertical, Hash, Heading,
  Bold, Braces, CloudUpload, Italic, Link as LinkGlyph, List as ListGlyph, RefreshCw, Underline, type LucideIcon,
  Globe, Info, ListChecks, Lock, MousePointerClick, Network, Paperclip, PenLine, Pencil, Plug, Plus, Search, SquareDashed, SquareTerminal, Trash2, Type, User, X,
} from 'lucide-react';
import { RuleSelect, ToggleSwitch, inputCls } from './FormRuleControls';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PALETTE_GROUPS, PEOPLE, kindLabel, uid } from './formRuleData';
import type { FieldKind, FormField, OptionNode } from './formRuleData';
import { ADDABLE_KINDS, BUILD_GUIDE, REQ_MODE_HELP, TYPE_HELP, reqModeOf, reqModePatch, typeHelp } from './formStudioData';
import type { ReqMode } from './formStudioData';
import { useFormStudioUi } from './formStudioUi';

/* Form Studio — the admin form builder (Zeni, 2 Nov 2026; flow from the "ServiceOps Form Builder
 * Prototype" canvas). The form IS the canvas: sections hold fields on a 1–3 column grid, and whatever
 * is selected — the form, a section or a field — has its configuration open on the right, with its
 * help on top. No left field drawer. Build ⇄ Preview (as requester or technician) → Publish.
 *
 * Builder numbers were re-dealt on 16 Nov 2026 (see formStudioUi.ts): pill V1 is the old product builder
 * (AdminFormBuilder, not this file), pill V2 is the NEW design below called "V3" in the code names
 * (fieldV3 / canvasV3 / paletteV3, flag `neo`), pill V3 is the "+" builder and pill V4 the Jira-style one.
 *
 * The "+" builder adds fields where they will sit, from a "+" between rows or "Add a field" at a section's end.
 * The Jira-style builder ends every section with "Type / to add a field" and a drop slot, and its right
 * panel is Fields | Settings | Guide, so field types can be DRAGGED onto a section.
 *
 * V3 (Zeni, 15 Nov 2026) answers the old builder's layout: the form (its predefined fields) fills the
 * left, and ONE right panel is either Custom fields — search on top, each type an icon and a name,
 * dragged or clicked in — or Field settings. Clicking a field lights it, dims every other field and
 * swaps the panel to that field's settings; clicking another field swaps them again; Esc or a click
 * on empty space goes back to Custom fields. A switch at the panel's top moves between the two by hand.
 *
 * The form is the product's flat field list: a `section` field opens a section and carries its
 * settings. Fields before the first section form an untitled group. */

const KIND_ICON: Record<FieldKind, React.ReactNode> = {
  text: <Type size={15} />, textarea: <AlignLeft size={15} />, richtext: <PenLine size={15} />,
  dropdown: <ChevronDown size={15} />, multiselect: <ListChecks size={15} />, date: <Calendar size={15} />,
  number: <Hash size={15} />, checkbox: <CheckSquare size={15} />, radio: <CircleDot size={15} />,
  attachment: <Paperclip size={15} />, section: <SquareDashed size={15} />, label: <Heading size={15} />,
  dependent: <Network size={15} />, user: <User size={15} />,
  url: <Globe size={15} />, currency: <Banknote size={15} />, api: <Plug size={15} />, dynamic: <SquareTerminal size={15} />,
};

/* ── V4's field tiles: one small drawing per field type — the control it adds, as a wireframe. 72 × 44, drawn 1:1:
 * every outline is a 1-unit stroke on a half-unit edge (so it lands on whole pixels), every drawing is centred on (36, 22). ── */
const A = { line: '#A3AFBF', soft: '#D5DCE6', fill: '#F1F5F9', blue: '#3D8BD0', tint: '#DCEBFA' };
const box = (x: number, y: number, w: number, h: number, extra: React.SVGProps<SVGRectElement> = {}) => <rect x={x} y={y} width={w} height={h} rx={3} fill="#fff" stroke={A.line} strokeWidth={1} {...extra} />;
const bar = (x: number, y: number, w: number, c = A.soft, h = 2) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;
const ln = (d: string, c: string = A.line, extra: React.SVGProps<SVGPathElement> = {}) => <path d={d} fill="none" stroke={c} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" {...extra} />;
/** A real lucide glyph nested in the drawing, `s` units square, its stroke held at 1 unit whatever its size. */
const ic = (C: LucideIcon, x: number, y: number, s: number, color: string = A.line) => <C x={x} y={y} size={s} strokeWidth={1} absoluteStrokeWidth color={color} />;
/** lucide ChevronDown, centred on (x + 3, y + 1.5). */
const chev = (x: number, y: number, color: string = A.line) => ic(ChevronDown, x - 2, y - 3.5, 10, color);
const KIND_ART: Record<FieldKind, React.ReactNode> = {
  text: <>{box(10.5, 13.5, 51, 17)}{bar(16, 21, 20, A.line)}<rect x={39} y={17} width={1} height={10} rx={0.5} fill={A.blue} /></>,
  textarea: <>{box(10.5, 6.5, 51, 31)}{bar(16, 14, 34)}{bar(16, 21, 24)}{ln('M53.5 33.5l4-4M57 33.5l.5-.5')}</>,
  richtext: <>{box(10.5, 5.5, 51, 33)}{ln('M11 16.5h50', A.soft)}{ic(Bold, 15, 7.5, 7, A.blue)}{ic(Italic, 24, 7.5, 7)}{ic(Underline, 33, 7.5, 7)}{bar(16, 23, 34)}{bar(16, 30, 22)}</>,
  dropdown: <>{box(10.5, 13.5, 51, 17)}{bar(16, 21, 20, A.line)}{ln('M49.5 14v16', A.soft)}{chev(52.5, 20.5, A.blue)}</>,
  multiselect: <>{box(10.5, 13.5, 51, 17)}<rect x={14.5} y={17.5} width={15} height={9} rx={4.5} fill={A.tint} />{bar(18, 21, 8, A.blue)}<rect x={31.5} y={17.5} width={15} height={9} rx={4.5} fill={A.tint} />{bar(35, 21, 8, A.blue)}{chev(52.5, 20.5)}</>,
  date: <>{box(10.5, 13.5, 51, 17)}{bar(16, 21, 20, A.line)}{ln('M49.5 14v16', A.soft)}{ic(Calendar, 52, 18.5, 7, A.blue)}</>,
  number: <>{box(10.5, 13.5, 51, 17)}<text x={16} y={25.2} fontSize={9} fontWeight={500} fill={A.line}>123</text>{ln('M50.5 14v16')}{ln('M53.5 20l2.5-2.5 2.5 2.5M53.5 24l2.5 2.5 2.5-2.5', A.blue)}</>,
  checkbox: <><rect x={18.5} y={16.5} width={11} height={11} rx={2.5} fill="#fff" stroke={A.blue} strokeWidth={1} />{ic(Check, 20, 18, 8, A.blue)}{bar(34, 21, 20, A.line)}</>,
  radio: <><circle cx={24} cy={22} r={5.5} fill="#fff" stroke={A.blue} strokeWidth={1} /><circle cx={24} cy={22} r={2.5} fill={A.blue} />{bar(34, 21, 20, A.line)}</>,
  attachment: <>{box(12.5, 7.5, 47, 29, { strokeDasharray: '3 2.5', fill: '#F8FAFC' })}{ic(CloudUpload, 30, 11, 12, A.blue)}{bar(26, 28, 20, A.line)}</>,
  section: <>{bar(11, 8, 16, A.blue)}{ln('M31 9h30', A.soft)}{box(11.5, 15.5, 23, 9, { rx: 2 })}{box(38.5, 15.5, 23, 9, { rx: 2 })}{box(11.5, 28.5, 50, 9, { rx: 2 })}</>,
  label: <><text x={12} y={20} fontSize={15} fontWeight={500} fill={A.blue}>Aa</text>{bar(12, 26, 48)}{bar(12, 32, 32)}</>,
  url: <>{box(12.5, 14.5, 47, 15)}{ic(LinkGlyph, 16, 18.5, 7, A.blue)}{ln('M27.5 18.5v7', A.soft)}{bar(31, 21, 16, A.line)}{bar(49, 21, 7)}</>,
  currency: <>{box(10.5, 13.5, 51, 17)}<rect x={11.5} y={14.5} width={14} height={15} rx={2} fill={A.tint} /><text x={15.6} y={25.6} fontSize={10} fontWeight={500} fill={A.blue}>$</text><text x={31} y={25.2} fontSize={9} fontWeight={500} fill={A.line}>0.00</text></>,
  dependent: <>{box(10.5, 5.5, 30, 13)}{bar(14, 11, 12, A.line)}{chev(32, 10.5)}{ln('M18.5 18.5v11a2 2 0 0 0 2 2h11', A.blue)}{box(31.5, 25.5, 30, 13, { stroke: A.blue })}{bar(35, 31, 12, A.blue)}{chev(53, 30.5, A.blue)}</>,
  api: <>{box(8.5, 14.5, 30, 15)}{bar(12, 21, 13, A.line)}{chev(28, 20.5)}{ln('M40.5 22h5', A.line, { strokeDasharray: '1.5 2' })}<rect x={47} y={13} width={18} height={18} rx={4} fill={A.tint} />{ic(Braces, 50, 16, 12, A.blue)}</>,
  dynamic: <>{box(10.5, 13.5, 51, 17)}{bar(16, 21, 20, A.line)}{ln('M49.5 14v16', A.soft)}{ic(RefreshCw, 52, 18.5, 7, A.blue)}</>,
  user: <>{box(10.5, 13.5, 51, 17)}<circle cx={20} cy={22} r={5} fill={A.tint} />{ic(User, 16.5, 18.5, 7, A.blue)}{bar(29, 21, 20, A.line)}{chev(52, 20.5)}</>,
};
const KindArt = ({ kind }: { kind: FieldKind }) => <svg viewBox="0 0 72 44" width={72} height={44} aria-hidden fontFamily="Inter, system-ui, sans-serif">{KIND_ART[kind]}</svg>;

type Sel = { kind: 'form' } | { kind: 'section'; id: string } | { kind: 'field'; id: string };
interface Group { sec: FormField | null; items: FormField[]; start: number; end: number }

const CHOICE: FieldKind[] = ['dropdown', 'radio', 'multiselect', 'dependent', 'checkbox'];
const TEXTUAL: FieldKind[] = ['text', 'textarea', 'richtext', 'number', 'date', 'dropdown', 'multiselect', 'dependent', 'user', 'url', 'currency', 'api', 'dynamic'];
const LISTED: FieldKind[] = ['dropdown', 'multiselect', 'user', 'dependent', 'api', 'dynamic'];
const WITH_OPTIONS: FieldKind[] = ['dropdown', 'multiselect', 'radio', 'checkbox'];

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

/** One labelled CHECKBOX (Zeni, 16 Nov 2026 — they were switches): the box on the left, its name and one line beside it. */
function SwitchRow({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={() => onChange(!on)} className="group/cb flex w-full items-start gap-2.5 text-left">
      <span className={'mt-[2px] flex size-4 flex-shrink-0 items-center justify-center rounded-[4px] border transition-colors ' + (on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#B8C4D2] bg-white group-hover/cb:border-[#3D8BD0]')}>{on && <Check size={12} strokeWidth={3} />}</span>
      <span className="min-w-0 text-[13px] text-[#364658]">{label}{hint && <span className="block text-[11.5px] leading-[1.4] text-[#7B8FA5]">{hint}</span>}</span>
    </button>
  );
}
const GroupTitle = ({ children }: { children: React.ReactNode }) => <div className="border-t border-[#EEF2F6] pt-4 text-[12px] font-semibold text-[#1D2A3E]">{children}</div>;
const iconBtn = 'flex size-7 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#1D2A3E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/* ── Options (as on the product's Edit panel): one row per option — drag to reorder, type to rename, x to
   delete — Add under the list, Import / Export a file. A Dependent field's options NEST: + on a row adds a child. ── */
const mapTree = (t: OptionNode[], id: string, fn: (n: OptionNode) => OptionNode | null): OptionNode[] =>
  t.flatMap((x) => { if (x.id === id) { const r = fn(x); return r ? [r] : []; } return [{ ...x, children: mapTree(x.children, id, fn) }]; });
/** Move `id` in front of `before` when both sit under the same parent. */
const moveSibling = (t: OptionNode[], id: string, before: string): OptionNode[] => {
  const from = t.findIndex((x) => x.id === id); const to = t.findIndex((x) => x.id === before);
  if (from >= 0 && to >= 0) { const a = [...t]; const [m] = a.splice(from, 1); a.splice(a.findIndex((x) => x.id === before), 0, m); return a; }
  return t.map((x) => ({ ...x, children: moveSibling(x.children, id, before) }));
};
const treePaths = (t: OptionNode[], pre: string[] = []): string[] => t.flatMap((x) => (x.children.length ? treePaths(x.children, [...pre, x.label]) : [[...pre, x.label].join(' > ')]));
function pathsToTree(lines: string[], nested: boolean): OptionNode[] {
  const root: OptionNode[] = [];
  lines.forEach((raw) => {
    const line = raw.trim().replace(/^"(.*)"$/, '$1'); if (!line) return;
    const parts = nested ? line.split('>').map((x) => x.trim()).filter(Boolean) : [line];
    let level = root;
    parts.forEach((label) => { let node = level.find((x) => x.label === label); if (!node) { node = { id: uid('o'), label, children: [] }; level.push(node); } level = node.children; });
  });
  return root;
}
function OptionsEditor({ tree, nested, onChange, fileName }: { tree: OptionNode[]; nested: boolean; onChange: (t: OptionNode[]) => void; fileName: string }) {
  const [shut, setShut] = useState<string[]>([]);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const add = (parent?: string) => {
    const node: OptionNode = { id: uid('o'), label: '', children: [] };
    onChange(parent ? mapTree(tree, parent, (x) => ({ ...x, children: [...x.children, node] })) : [...tree, node]);
    if (parent) setShut((x) => x.filter((i) => i !== parent));
    /* A flat list is rebuilt from plain labels, so its rows are numbered: the new one is the last. */
    setFresh(nested ? node.id : 'o' + tree.length);
  };
  const importFile = (file: File) => file.text().then((text) => {
    const t = pathsToTree(text.split(/\r?\n/), nested);
    if (!t.length) { toast.error('No options found in that file'); return; }
    onChange(t); toast.success(`${treePaths(t).length} options imported`);
  });
  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([treePaths(tree).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = fileName + '-options.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const row = (x: OptionNode, depth: number): React.ReactNode => {
    const open = !shut.includes(x.id);
    return (
      <div key={x.id}>
        <div draggable={drag === x.id} onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/option', x.id); }}
          onDragOver={(e) => { if (drag && drag !== x.id) { e.preventDefault(); setOver(x.id); } }} onDragLeave={() => setOver((o) => (o === x.id ? null : o))}
          onDrop={(e) => { e.preventDefault(); if (drag) onChange(moveSibling(tree, drag, x.id)); setDrag(null); setOver(null); }} onDragEnd={() => { setDrag(null); setOver(null); }}
          style={{ marginLeft: depth * 14 }}
          className={'group/o flex h-8 items-center gap-0.5 rounded bg-[#F4F6FA] pr-0.5 ' + (over === x.id ? 'shadow-[inset_0_2px_0_#3D8BD0] ' : '') + (drag === x.id ? 'opacity-40' : '')}>
          <span title="Drag to change the order" onMouseDown={() => setDrag(x.id)} onMouseUp={() => setDrag(null)} className="flex h-8 w-5 flex-shrink-0 cursor-grab items-center justify-center text-[#B0BAC7] hover:text-[#64748B] active:cursor-grabbing"><GripVertical size={13} /></span>
          {nested && (x.children.length > 0
            ? <button type="button" aria-label={open ? 'Fold' : 'Unfold'} aria-expanded={open} onClick={() => setShut((v) => (open ? [...v, x.id] : v.filter((i) => i !== x.id)))} className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[#64748B] hover:bg-white">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>
            : <span className="w-5 flex-shrink-0" />)}
          <input value={x.label} autoFocus={fresh === x.id} placeholder="Option" aria-label="Option name" onChange={(e) => onChange(mapTree(tree, x.id, (v) => ({ ...v, label: e.target.value })))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            className="h-7 min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 text-[13px] text-[#364658] placeholder:text-[#B0BAC7] hover:border-[#DFE5ED] focus:border-[#3D8BD0] focus:bg-white focus:outline-none" />
          {nested && <button type="button" title="Add an option under this one" aria-label="Add an option under this one" onClick={() => add(x.id)} className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] opacity-0 transition-opacity hover:bg-white hover:text-[#3D8BD0] group-hover/o:opacity-100 focus:opacity-100"><Plus size={14} /></button>}
          <button type="button" title="Delete" aria-label="Delete option" onClick={() => onChange(mapTree(tree, x.id, () => null))} className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] opacity-0 transition-opacity hover:bg-white hover:text-[#DC2626] group-hover/o:opacity-100 focus:opacity-100"><X size={14} /></button>
        </div>
        {nested && open && x.children.length > 0 && <div className="mt-1 flex flex-col gap-1">{x.children.map((c) => row(c, depth + 1))}</div>}
      </div>
    );
  };
  const link = 'inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline disabled:cursor-not-allowed disabled:text-[#B0BAC7] disabled:no-underline';
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        <span className="flex-1 text-[12px] text-[#7B8FA5]">Options</span>
        <button type="button" className={link} onClick={() => fileRef.current?.click()}><Upload size={13} />Import</button>
        <button type="button" className={link} disabled={!tree.length} onClick={exportFile}><Download size={13} />Export</button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) importFile(file); e.target.value = ''; }} />
      </div>
      <div className="flex flex-col gap-1">{tree.map((x) => row(x, 0))}</div>
      {!tree.length && <p className="rounded border border-dashed border-[#DFE5ED] px-3 py-2.5 text-[12px] text-[#94A3B8]">No options yet. Add one, or import a file.</p>}
      <button type="button" className={link + ' mt-2'} onClick={() => add()}><Plus size={13} />Add</button>
      <Help>{nested ? 'Drag to reorder. Use + on an option to add the options under it. A file has one path per line, for example Hardware > Laptop.' : 'Drag to reorder. A file has one option per line.'}</Help>
    </div>
  );
}

/** An empty section, drawn SMALL and grey (the blue, centred picture is "Add a section" — the two must not look alike):
 *  one field being dropped into an open slot. `big` is the whole-form empty state. */
function EmptySectionArt({ lit, big }: { lit?: boolean; big?: boolean }) {
  const c = lit ? '#3D8BD0' : '#B8C4D2';
  return (
    <svg width={big ? 96 : 56} height={big ? 62 : 36} viewBox="0 0 56 36" fill="none" aria-hidden="true" className="flex-shrink-0">
      {/* the slot waiting for it */}
      <rect x="1" y="19" width="54" height="16" rx="4" fill={lit ? '#EBF5FF' : '#F4F6FA'} stroke={c} strokeDasharray="3 3" />
      {/* the field on its way down */}
      <rect x="9" y="1" width="38" height="13" rx="3.5" fill="#fff" stroke={c} />
      <rect x="14" y="5" width="12" height="2.5" rx="1.25" fill={c} />
      <rect x="14" y="9" width="22" height="2" rx="1" fill="#E2E8F0" />
      <path d="M28 17v9M24.5 23l3.5 3.5 3.5-3.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** "Add a section", drawn: the form's existing section, faint, and a NEW section opening under it —
 *  its own heading and rule, room for fields, and the plus that makes it. */
function SectionGlyph() {
  return (
    <svg width="120" height="64" viewBox="0 0 120 64" fill="none" aria-hidden="true">
      {/* the section already on the form */}
      <rect x="10" y="2" width="26" height="5" rx="2.5" fill="#CBD5E1" />
      <path d="M42 4.5h68" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="12" width="47" height="9" rx="3" fill="#fff" stroke="#E2E8F0" />
      <rect x="63" y="12" width="47" height="9" rx="3" fill="#fff" stroke="#E2E8F0" />
      {/* the new section */}
      <rect x="1" y="28" width="118" height="35" rx="7" fill="#F5FAFF" stroke="#3D8BD0" strokeDasharray="4 3" />
      <rect x="10" y="35" width="30" height="5" rx="2.5" fill="#3D8BD0" />
      <path d="M46 37.5h46" stroke="#BFDBF3" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="46" width="38" height="9" rx="3" fill="#fff" stroke="#BFDBF3" />
      <rect x="54" y="46" width="38" height="9" rx="3" fill="#fff" stroke="#BFDBF3" />
      <circle cx="106" cy="45.5" r="8" fill="#3D8BD0" />
      <path d="M106 41.5v8M102 45.5h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
/** The attachment field — the upload box the BOM ingest form uses. */
function AttachBox({ f, small }: { f: FormField; small?: boolean }) {
  return (
    <span className={'flex flex-col items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-white px-4 text-center ' + (small ? 'py-4' : 'py-6')}>
      <Upload size={20} className="mb-1.5 text-[#7B8FA5]" />
      <span className="text-[13px] font-medium text-[#364658]">Drop files here, or click to choose</span>
      <span className="mt-0.5 text-[12px] text-[#7B8FA5]">{f.buttonText || 'Attach Files'} · you can add more than one</span>
    </span>
  );
}

/** Field types matching a search, in menu order. */
const matchKinds = (query: string) => TYPE_HELP.filter((t) => ADDABLE_KINDS.includes(t.kind) && (kindLabel(t.kind) + ' ' + t.desc).toLowerCase().includes(query.trim().toLowerCase()));

/** The add menu: search plus every type, each with what it is for. */
/** The grouped field list the V3 and V4 add popups show — filtered by the search, empty groups dropped. */
const groupedKinds = (query: string) => {
  const needle = query.trim().toLowerCase();
  return PALETTE_GROUPS.map((grp) => ({ ...grp, kinds: grp.kinds.filter((k) => !needle || (kindLabel(k) + ' ' + typeHelp(k).desc).toLowerCase().includes(needle)) })).filter((grp) => grp.kinds.length);
};
function AddMenu({ onPick, onClose, query, onQuery, below, typed, grouped }: {
  onPick: (k: FieldKind) => void; onClose: () => void; query: string; onQuery: (q: string) => void; below?: boolean; grouped?: boolean;
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
  /* V3's popup: the right sidebar's own groups, an icon before each field, no one-liners. */
  if (grouped) {
    const shown = groupedKinds(query);
    const first = shown[0]?.kinds[0];
    return (
      <div ref={ref} data-rule-menu className={'absolute z-30 w-[430px] rounded-lg border border-[#DFE5ED] bg-white shadow-lg ' + (below ? 'left-0 top-[calc(100%+6px)]' : 'left-1/2 top-5 -translate-x-1/2')}>
        {typed ? <p className="px-3.5 pb-1 pt-2.5 text-[11.5px] text-[#94A3B8]">Keep typing to filter · Enter adds the first</p> : <div className="relative p-2 pb-1">
          <Search size={14} className="pointer-events-none absolute left-[18px] top-[calc(50%+2px)] -translate-y-1/2 text-[#94A3B8]" />
          <input autoFocus value={query} onChange={(e) => onQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && first) onPick(first); }}
            placeholder="Search fields" aria-label="Search fields" className={inputCls + ' !rounded pl-8'} />
        </div>}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
          {shown.map((grp) => (
            <div key={grp.title} className="mt-4 first:mt-0">
              <div className="px-1.5 pb-1.5 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{grp.title}</div>
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                {grp.kinds.map((k) => (
                  <button key={k} type="button" onClick={() => onPick(k)} className="group/a flex h-8 min-w-0 items-center gap-2 rounded px-1.5 text-left transition-colors hover:bg-[#F1F5F9]">
                    <span className="grid size-6 flex-shrink-0 place-items-center rounded bg-[#F1F5F9] text-[#475569] transition-colors group-hover/a:bg-[#EBF5FF] group-hover/a:text-[#3D8BD0]">{KIND_ICON[k]}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#1D2A3E]">{kindLabel(k)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!shown.length && <p className="px-2 py-4 text-center text-[12px] text-[#7B8FA5]">No field matches “{query}”.</p>}
        </div>
      </div>
    );
  }
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
  if (f.kind === 'checkbox') return <span className="flex flex-wrap gap-x-4 gap-y-1">{(optionsOf(f).filter((o) => o.trim()).length ? optionsOf(f).filter((o) => o.trim()) : [f.placeholder || 'Yes / No']).slice(0, 5).map((o) => <span key={o} className="flex items-center gap-2 text-[12px] text-[#7B8FA5]"><span className="size-3.5 rounded-[3px] border border-[#CBD5E1]" />{o}</span>)}</span>;
  if (f.kind === 'radio' || (f.kind === 'dependent' && optionsOf(f).length)) return <span className="flex flex-wrap gap-1">{optionsOf(f).slice(0, 4).map((o) => <Chip key={o}>{o}</Chip>)}{optionsOf(f).length > 4 && <Chip>+{optionsOf(f).length - 4}</Chip>}</span>;
  if (f.kind === 'attachment') return <AttachBox f={f} small />;
  const tall = f.kind === 'textarea' || f.kind === 'richtext';
  return <span className={'flex rounded border border-[#E5E9F0] bg-[#F8FAFC] px-2.5 text-[11.5px] text-[#94A3B8] ' + (tall ? 'h-12 items-start pt-1.5' : 'h-8 items-center')}>{f.placeholder || (WITH_OPTIONS.includes(f.kind) || LISTED.includes(f.kind) ? 'Select' : '')}</span>;
}

export interface FormStudioProps {
  title: string;
  noun: string;
  fields: FormField[];
  onFields: (next: FormField[]) => void;
  /** How many form rules use a field — shown in its settings. */
  rulesUsing?: (fieldId: string) => number;
  /** The new builder (pill V2) puts Build / Preview / Save draft / Publish here — the page heading's right side. */
  toolbarSlot?: HTMLElement | null;
  /** Where the Draft / Published chip goes — beside the page heading. Without it the chip stays with the controls. */
  statusSlot?: HTMLElement | null;
}

export function FormStudio({ title, noun, fields, onFields, rulesUsing, toolbarSlot, statusSlot }: FormStudioProps) {
  const ui = useFormStudioUi();
  const [mode, setMode] = useState<'build' | 'preview'>('build');
  const [sel, setSel] = useState<Sel>({ kind: 'form' });
  const [menu, setMenu] = useState<string | null>(null);
  const [q, setQ] = useState('');
  /** V3: the Custom fields search. */
  const [pq, setPq] = useState('');
  const [tab, setTab] = useState<'fields' | 'settings' | 'guide'>('fields');
  /** Settings is only reachable while a field or section is selected (Zeni, 19 Nov 2026); with nothing picked the tab is disabled and says why. */
  const noPick = sel.kind === 'form';
  useEffect(() => { if (noPick && tab === 'settings') setTab('fields'); }, [noPick, tab]);
  /** The Help guide takes the right panel only when asked for — remembered, closed by default. */
  /* Each builder remembers its own choice: V3 shows the guide (in its empty panel) until it is hidden, V2 / V4 only when asked. */
  const readGuide = () => { try { const v = localStorage.getItem('formStudioGuide:' + ui); return v === 'open'; } catch { return false; } };
  const [guide, setGuideRaw] = useState(readGuide);
  useEffect(() => { setGuideRaw(readGuide()); }, [ui]); // eslint-disable-line react-hooks/exhaustive-deps
  const setGuide = (v: boolean) => { setGuideRaw(v); try { localStorage.setItem('formStudioGuide:' + ui, v ? 'open' : 'closed'); } catch { /* private mode */ } };
  const [published, setPublished] = useState(() => ({ version: 1, snap: JSON.stringify(fields) }));
  const [publishOpen, setPublishOpen] = useState(false);
  const [note, setNote] = useState('');
  /* Preview shows the WHOLE form — its Requester | Technician switch was removed (Zeni, 16 Nov 2026). */
  const [role] = useState<'req' | 'tech'>('tech');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dropAt, setDropAt] = useState<number | null>(null);
  /** A section being dragged: the group it would land beside, and on which side. */
  const [secDrop, setSecDrop] = useState<{ gi: number; after: boolean } | null>(null);
  /** V2's "Type / to add a field" boxes, by section — the menu treats a click in its box as inside. */
  const typeBoxes = useRef<Record<string, HTMLInputElement | null>>({});
  const dirty = JSON.stringify(fields) !== published.snap;
  const groups = useMemo(() => groupsOf(fields), [fields]);
  const values = fields.filter((f) => f.kind !== 'section');
  const sections = fields.filter((f) => f.kind === 'section');

  /* ── edits ── */
  const patch = (id: string, p: Partial<FormField>) => onFields(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const insertAt = (i: number, f: FormField[]) => { const a = [...fields]; a.splice(i, 0, ...f); onFields(a); };
  const select = (s: Sel) => {
    setSel(s); setMenu(null);
    if (ui === 'v4' && s.kind !== 'form') setTab('settings');
    /* V3: the panel follows the selection — a field's settings, or back to Custom fields. */
    if (ui === 'v2') setTab(s.kind === 'form' ? 'fields' : 'settings');
  };
  const newField = (kind: FieldKind): FormField => ({
    id: uid('f'), label: kindLabel(kind) === 'Datetime' ? 'Date' : kindLabel(kind), kind, width: kind === 'textarea' || kind === 'richtext' || kind === 'attachment' ? 'full' : 'half',
    ...(WITH_OPTIONS.includes(kind) ? { options: ['Option 1', 'Option 2'] } : {}),
    ...(kind === 'dependent' ? { optionTree: parseTree('Level 1\n\tLevel 2'), options: ['Level 1'] } : {}),
    ...(kind === 'label' ? { helpText: 'Write the note people should read here.' } : {}),
  });
  /** Add a field at a flat index; on an empty form a section is made for it first. */
  const addAt = (i: number, kind: FieldKind) => {
    if (kind === 'section') return addSection();
    const f = newField(kind);
    if (!fields.length) { const s: FormField = { id: uid('s'), label: 'Custom fields', kind: 'section', width: 'full', cols: 2 }; onFields([s, f]); }
    else insertAt(i, [f]);
    setMenu(null); setQ(''); setSel({ kind: 'field', id: f.id }); if (ui !== 'v3') setTab('settings');
    if (ui === 'v2') requestAnimationFrame(() => document.querySelector(`[data-field="${f.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };
  const addSection = () => {
    const s: FormField = { id: uid('s'), label: 'New section', kind: 'section', width: 'full', cols: 2 };
    onFields([...fields, s]); setSel({ kind: 'section', id: s.id }); if (ui !== 'v3') setTab('settings');
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
  /** Drag a whole section (its heading and its fields) to sit before or after another one. Fields with no
   *  section always lead the form, so nothing lands above them. */
  const moveSectionTo = (id: string, target: number, after: boolean) => {
    const gi = groups.findIndex((g) => g.sec?.id === id); if (gi < 0 || gi === target || !groups[target]) return;
    const blocks = groups.map((g) => (g.sec ? fields.slice(g.start - 1, g.end) : g.items));
    const [b] = blocks.splice(gi, 1);
    blocks.splice((target > gi ? target - 1 : target) + (after || !groups[target].sec ? 1 : 0), 0, b);
    onFields(blocks.flat());
  };
  const secDnd = (g: Group) => {
    const gi = groups.findIndex((x) => (g.sec ? x.sec?.id === g.sec.id : !x.sec));
    const isSec = (e: React.DragEvent) => [...e.dataTransfer.types].includes('text/form-section');
    return {
      props: {
        onDragOver: (e: React.DragEvent) => { if (!isSec(e)) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const after = !g.sec || e.clientY > r.top + r.height / 2; if (secDrop?.gi !== gi || secDrop.after !== after) setSecDrop({ gi, after }); },
        onDrop: (e: React.DragEvent) => { const id = e.dataTransfer.getData('text/form-section'); if (!id) return; e.preventDefault(); e.stopPropagation(); moveSectionTo(id, gi, secDrop?.gi === gi ? secDrop.after : true); setSecDrop(null); },
      },
      line: secDrop?.gi === gi ? <span className={'pointer-events-none absolute inset-x-0 z-10 h-[3px] rounded-full bg-[#3D8BD0] ' + (secDrop.after ? '-bottom-3' : '-top-3')} /> : null,
    };
  };
  const moveTo = (id: string, secId: string) => {
    const f = fields.find((x) => x.id === id)!; const rest = fields.filter((x) => x.id !== id);
    const g = groupsOf(rest).find((x) => x.sec?.id === secId); if (!g) return;
    const a = [...rest]; a.splice(g.end, 0, f); onFields(a);
  };
  const duplicateField = (f: FormField) => {
    let label = f.label + ' copy';
    for (let k = 2; fields.some((x) => x.label === label); k++) label = f.label + ' copy ' + k;
    /* A copy is never a product field: the product ships one Priority, not two. */
    const copy: FormField = { ...structuredClone(f), id: uid('f'), label, system: false };
    insertAt(fields.findIndex((x) => x.id === f.id) + 1, [copy]);
    select({ kind: 'field', id: copy.id });
  };
  /** Drag · half / full width · copy · remove — shown at a field's top right on hover or when it is selected. */
  const fieldActions = (f: FormField, on: boolean) => (
    <span data-pick className={'absolute right-1.5 top-1.5 z-10 flex items-center rounded-md bg-white/95 transition-opacity ' + (on ? 'opacity-100' : 'opacity-0 group-hover/fw:opacity-100 group-focus-within/fw:opacity-100')}>
      <span draggable title="Drag to move" aria-label="Drag to move" onDragStart={(e) => { e.dataTransfer.setData('text/form-field', f.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDropAt(null)}
        className={iconBtn + ' !size-6 cursor-grab active:cursor-grabbing'}><GripVertical size={14} /></span>
      <button type="button" title={f.width === 'full' ? 'Make it half width' : 'Make it full width'} aria-label={f.width === 'full' ? 'Make it half width' : 'Make it full width'} className={iconBtn + ' !size-6'} onClick={() => patch(f.id, { width: f.width === 'full' ? 'half' : 'full' })}>{f.width === 'full' ? <Columns2 size={14} /> : <RectangleHorizontal size={14} />}</button>
      <button type="button" title="Copy" aria-label="Copy" className={iconBtn + ' !size-6'} onClick={() => duplicateField(f)}><Copy size={13} /></button>
      <span title={f.system ? 'A product field can be hidden, not removed' : 'Remove'}><button type="button" aria-label="Remove" disabled={f.system} className={iconBtn + ' !size-6 hover:!bg-[#FEF2F2] hover:!text-[#DC2626]'} onClick={() => removeField(f.id)}><X size={14} /></button></span>
    </span>
  );
  const removeField = (id: string) => { onFields(fields.filter((f) => f.id !== id)); select({ kind: 'form' }); };
  /** Deleting a section keeps its fields: they join the section above. */
  const removeSection = (id: string) => { onFields(fields.filter((f) => f.id !== id)); select({ kind: 'form' }); toast.success('Section removed — its fields joined the section above'); };
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
  /* V3: Esc lets go of the selected field (not while typing, not while a menu is open). */
  useEffect(() => {
    if (ui !== 'v2' || sel.kind === 'form' || mode !== 'build') return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || menu || publishOpen) return;
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [data-rule-menu]') || document.querySelector('[data-rule-menu]')) return;
      setSel({ kind: 'form' }); setTab('fields');
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [ui, sel.kind, mode, menu, publishOpen]);
  const groupOfField = (id: string) => groups.find((g) => g.items.some((f) => f.id === id));
  const stats = [
    { v: values.length, label: `fields in ${sections.length} section${sections.length === 1 ? '' : 's'}` },
    { v: values.filter((f) => reqModeOf(f) === 'required').length, label: 'required for requesters' },
    { v: values.filter((f) => reqModeOf(f) === 'hidden').length + sections.filter((s) => s.techOnly).length, label: 'hidden from requesters' },
    { v: sections.filter((s) => s.showWhen).length, label: 'conditional sections' },
  ];

  /* ── configuration (shared by V1's panel and V2's Settings tab) ── */
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

  const settingsHead = (f: FormField, caption: string, remove: () => void) => (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 flex-shrink-0 place-items-center rounded-md bg-[#F1F5F9] text-[#475569]">{KIND_ICON[f.kind]}</span>
      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold text-[#1D2A3E]">{f.label || 'Untitled'}</div><div className="text-[12px] text-[#7B8FA5]">{caption}</div></div>
      {f.system ? (
        <Tooltip><TooltipTrigger asChild><span><button type="button" disabled aria-label="Remove field" className={iconBtn}><Trash2 size={15} /></button></span></TooltipTrigger><TooltipContent side="left">A product field can be hidden, not removed.</TooltipContent></Tooltip>
      ) : <button type="button" title="Remove" aria-label="Remove" className={iconBtn + ' hover:!bg-[#FEF2F2] hover:!text-[#DC2626]'} onClick={remove}><Trash2 size={15} /></button>}
    </div>
  );
  const fieldSettingsNeo = (f: FormField) => {
    const used = rulesUsing?.(f.id) ?? 0;
    const view = f.requesterView !== false;
    const edit = view && f.requesterEdit !== false;
    const isLabel = f.kind === 'label';
    const custom = !f.system;
    const txt = (key: 'placeholder' | 'helpText' | 'defaultValue' | 'buttonText' | 'min' | 'max' | 'validation', label: string, ph = '') => (
      <div><Lbl htmlFor={'nf-' + key}>{label}</Lbl><input id={'nf-' + key} className={inputCls + ' !rounded'} value={(f[key] as string | undefined) ?? ''} placeholder={ph} onChange={(e) => patch(f.id, { [key]: e.target.value })} /></div>
    );
    const isText = f.kind === 'text' || f.kind === 'textarea' || f.kind === 'url';
    const isNum = f.kind === 'number' || f.kind === 'currency';
    return (
      <div className="flex flex-col gap-4">
        {settingsHead(f, kindLabel(f.kind), () => removeField(f.id))}
        <div><Lbl htmlFor="nf-l">{isLabel ? 'Heading' : 'Name'}</Lbl><input id="nf-l" className={inputCls + ' !rounded'} value={f.label} onChange={(e) => patch(f.id, { label: e.target.value })} /></div>
        {isLabel && <div><Lbl htmlFor="nf-tx">Text shown on the form</Lbl><textarea id="nf-tx" rows={3} className={inputCls + ' !h-auto !rounded py-2'} value={f.helpText ?? ''} onChange={(e) => patch(f.id, { helpText: e.target.value })} /></div>}
        {f.kind === 'attachment' ? txt('buttonText', 'Button Text', 'Attach Files') : TEXTUAL.includes(f.kind) && f.kind !== 'user' && txt('placeholder', 'Hint Text', 'Shown inside the empty field')}
        {!isLabel && f.kind !== 'attachment' && txt('helpText', 'Description', 'Shown under the field')}
        {custom && !isLabel && !['attachment', 'dependent', 'richtext', 'api', 'dynamic'].includes(f.kind) && (WITH_OPTIONS.includes(f.kind)
          ? <div><Lbl>Default Value</Lbl><RuleSelect className="!rounded" value={f.defaultValue ? [f.defaultValue] : []} placeholder="None" options={(f.options ?? []).filter((o) => o.trim()).map((o) => ({ value: o, label: o }))} onChange={(v) => patch(f.id, { defaultValue: v[0] ?? '' })} /></div>
          : txt('defaultValue', 'Default Value', 'Filled in when the form opens'))}
        {WITH_OPTIONS.includes(f.kind) && (
          <OptionsEditor key={f.id} nested={false} fileName={f.label} tree={(f.options ?? []).map((label, i) => ({ id: 'o' + i, label, children: [] }))}
            onChange={(t) => patch(f.id, { options: t.map((x) => x.label) })} />
        )}
        {f.kind === 'dependent' && (
          <>
            <OptionsEditor key={f.id} nested fileName={f.label} tree={f.optionTree ?? []} onChange={(t) => patch(f.id, { optionTree: t, options: t.map((x) => x.label) })} />
            <SwitchRow label="Allow user to select leaf node only" hint="People must pick the last level, not a parent." on={!!f.leafOnly} onChange={(v) => patch(f.id, { leafOnly: v })} />
            <SwitchRow label="Display Entire Hierarchy in Report" hint="Reports show the full path, for example Hardware › Laptop." on={!!f.fullHierarchy} onChange={(v) => patch(f.id, { fullHierarchy: v })} />
          </>
        )}
        {(f.kind === 'api' || f.kind === 'dynamic') && <p className="text-[12px] leading-[1.5] text-[#7B8FA5]">{f.kind === 'api' ? 'The list is filled from an API. The API is set up in the product.' : 'The list is filled by a script. The script is set up in the product.'}</p>}
        {custom && isText && <div className="grid grid-cols-2 gap-3">{txt('min', 'Minimum Characters', '0')}{txt('max', 'Maximum Characters', 'No limit')}</div>}
        {custom && isNum && <>
          <div className="grid grid-cols-2 gap-3">{txt('min', 'Minimum Value', 'No limit')}{txt('max', 'Maximum Value', 'No limit')}</div>
          <SwitchRow label="Allow Decimal in number" on={!!f.allowDecimal} onChange={(v) => patch(f.id, { allowDecimal: v })} />
        </>}
        {custom && f.kind === 'date' && <SwitchRow label="Allow to select time" hint="Off: people pick a date only." on={f.allowTime !== false} onChange={(v) => patch(f.id, { allowTime: v })} />}
        {!isLabel && <>
          <GroupTitle>Requester</GroupTitle>
          <SwitchRow label="View" hint="Requesters see this field on the portal." on={view} onChange={(v) => patch(f.id, reqModePatch(v ? 'optional' : 'hidden'))} />
          {view && <SwitchRow label="Edit" hint="Off: requesters see the value but cannot change it." on={edit} onChange={(v) => patch(f.id, reqModePatch(v ? 'optional' : 'readonly'))} />}
          {edit && <SwitchRow label="Required" hint="Requesters must fill it to submit." on={!!f.requesterRequired} onChange={(v) => patch(f.id, reqModePatch(v ? 'required' : 'optional'))} />}
          <GroupTitle>Technician</GroupTitle>
          <SwitchRow label="Required" hint="Technicians must fill it to save the record." on={!!f.required} onChange={(v) => patch(f.id, { required: v })} />
          <GroupTitle>More</GroupTitle>
          {custom && f.kind !== 'attachment' && <SwitchRow label="System Managed Field" hint="Only the system fills this field, through automation or an integration. People cannot edit it." on={!!f.systemManaged} onChange={(v) => patch(f.id, { systemManaged: v })} />}
          {custom && <SwitchRow label="PII" hint="Personal data, such as a phone number or an ID. The value is hidden from people without permission." on={!!f.pii} onChange={(v) => patch(f.id, { pii: v })} />}
          {f.kind !== 'attachment' && <SwitchRow label="AI Accessible" hint="AI can read this field for summaries and suggestions." on={f.aiAccessible !== false} onChange={(v) => patch(f.id, { aiAccessible: v })} />}
          {custom && f.kind === 'text' && <>
            <SwitchRow label="Validation" hint="Accept only answers that match a pattern (regex)." on={f.validation !== undefined} onChange={(v) => patch(f.id, { validation: v ? '' : undefined })} />
            {f.validation !== undefined && txt('validation', 'Pattern', 'For example ^[A-Z]{3}-[0-9]{4}$')}
          </>}
        </>}
        <SwitchRow label="Use the full row" hint="Off: the field takes one column of its section." on={f.width === 'full'} onChange={(v) => patch(f.id, { width: v ? 'full' : 'half' })} />
        {used > 0 && <p className="text-[12px] text-[#7B8FA5]">Used in {used} form rule{used === 1 ? '' : 's'}.</p>}
      </div>
    );
  };
  const sectionSettingsNeo = (s: FormField) => {
    const gi = groups.findIndex((g) => g.sec?.id === s.id);
    const choices = values.filter((f) => CHOICE.includes(f.kind) && !groups[gi]?.items.some((x) => x.id === f.id));
    const src = s.showWhen && fields.find((f) => f.id === s.showWhen!.fieldId);
    return (
      <div className="flex flex-col gap-4">
        {settingsHead(s, 'Section', () => removeSection(s.id))}
        <div><Lbl htmlFor="ns-t">Title</Lbl><input id="ns-t" className={inputCls + ' !rounded'} value={s.label} onChange={(e) => patch(s.id, { label: e.target.value })} /></div>
        <div><Lbl htmlFor="ns-d">Description</Lbl><input id="ns-d" className={inputCls + ' !rounded'} value={s.helpText ?? ''} placeholder="Shown under the title" onChange={(e) => patch(s.id, { helpText: e.target.value })} /></div>
        <div><Lbl>Columns</Lbl><RuleSelect className="!rounded" value={[String(s.cols ?? 2)]} options={[{ value: '1', label: '1 column' }, { value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }]} onChange={(v) => v[0] && patch(s.id, { cols: Number(v[0]) as 1 | 2 | 3 })} /></div>
        {/* As on the product's Edit Section panel (.185, 17 Nov 2026): Requester › View, applying to every field in the section. */}
        <GroupTitle>Requester</GroupTitle>
        <SwitchRow label="View" hint="Off: requesters do not see this section." on={!s.techOnly} onChange={(v) => patch(s.id, { techOnly: !v })} />
        <p className="text-[12px] text-[#7B8FA5]">This applies to all fields of this section.</p>
      </div>
    );
  };
  const nothingSelected = (
    <div className="flex flex-col items-center gap-2 px-2 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><MousePointerClick size={18} /></span>
      <p className="text-[13px] font-medium text-[#1D2A3E]">Nothing selected</p>
      <p className="text-[12px] leading-[1.5] text-[#7B8FA5]">Click a field or a section on the form to change its settings here.</p>
    </div>
  );
  const settings = selected?.kind === 'section' ? sectionSettingsNeo(selected) : selected ? fieldSettingsNeo(selected) : nothingSelected;
  /* Help (Zeni, 16 Nov 2026): a small button at the form's bottom right opens a compact card of SHORT POINTS —
     about the selected field first, then how to build a form. The right panel stays for fields and settings. */
  const points = (items: string[]) => (
    <ul className="mt-1.5 flex flex-col gap-1">{items.map((t) => <li key={t} className="flex gap-2 text-[12px] leading-[1.5] text-[#475569]"><span className="mt-[7px] size-1 flex-shrink-0 rounded-full bg-[#3D8BD0]" />{t}</li>)}</ul>
  );
  const sentences = (t: string) => t.split(/(?<=\.)\s+/).map((x) => x.trim()).filter(Boolean);
  const helpFloat = (
    <div className="pointer-events-none absolute bottom-4 right-[396px] z-30 flex flex-col items-end gap-2">
      {guide && (
        <div role="dialog" aria-label="Help" className="pointer-events-auto flex max-h-[min(460px,calc(100vh-260px))] w-[300px] flex-col rounded-xl border border-[#DFE5ED] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.14)]">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EEF2F6] py-1.5 pl-3.5 pr-1.5">
            <CircleHelp size={15} className="text-[#3D8BD0]" /><span className="flex-1 text-[13px] font-semibold text-[#1D2A3E]">Help</span>
            <button type="button" aria-label="Close help" onClick={() => setGuide(false)} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={15} /></button>
          </div>
          <div className="flex min-h-0 flex-col gap-3.5 overflow-y-auto p-3.5">
            {selected && (() => { const h = typeHelp(selected.kind); return (
              <div>
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1D2A3E]"><span className="grid size-6 place-items-center rounded bg-[#F1F5F9] text-[#475569]">{KIND_ICON[selected.kind]}</span>{kindLabel(selected.kind)}</div>
                {points([...sentences(h.what), ...sentences(h.how), 'Example: ' + h.example])}
              </div>
            ); })()}
            <div className={selected ? 'border-t border-[#EEF2F6] pt-3' : ''}>
              <div className="text-[12.5px] font-semibold text-[#1D2A3E]">Build a form</div>
              {points([
                'Group fields under sections.',
                'Add a field: drag it from the list, or click it.',
                'Click a field to change its settings.',
                'Hover a field to move, resize, copy or remove it.',
                'Requester and Technician switches decide who sees and fills it.',
                'Preview, then Publish. Nothing changes until you publish.',
              ])}
            </div>
          </div>
        </div>
      )}
      <button type="button" aria-expanded={guide} onClick={() => setGuide(!guide)}
        className={'pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium shadow-[0_2px_8px_rgba(15,23,42,0.10)] transition-colors ' + (guide ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#2F6FAE]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F9FAFB]')}>
        <CircleHelp size={14} className="text-[#3D8BD0]" />Help
      </button>
    </div>
  );

  /* ── canvas ── */
  const sectionHead = (g: Group, v2: boolean, on = false) => {
    if (!g.sec) return null;
    const gi = groups.findIndex((x) => x.sec?.id === g.sec!.id);
    return (
      <div className="group/sec flex items-center gap-2">
        <button type="button" aria-pressed={on} onClick={() => select({ kind: 'section', id: g.sec!.id })} className="flex min-w-0 items-center gap-2 text-left">
          <span className={'truncate text-[14px] font-semibold ' + (on ? 'text-[#2F6FAE]' : 'text-[#1D2A3E]')}>{g.sec.label}</span>
          {g.sec.techOnly && <Chip tone="amber">Technicians only</Chip>}
          {g.sec.showWhen && <Chip tone="blue">Shown when {fields.find((x) => x.id === g.sec!.showWhen!.fieldId)?.label ?? '…'} is {g.sec.showWhen.value || '…'}</Chip>}
        </button>
        <span className="h-px min-w-4 flex-1 bg-[#EEF2F6]" />
        <span className={'flex items-center transition-opacity ' + (on ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100 group-focus-within/sec:opacity-100')}>
          <span draggable title="Drag to move this section" aria-label="Drag to move this section" className={iconBtn + ' cursor-grab active:cursor-grabbing'} onDragStart={(e) => { e.dataTransfer.setData('text/form-section', g.sec!.id); e.dataTransfer.effectAllowed = 'move'; const box = e.currentTarget.closest('[data-sec]'); if (box) e.dataTransfer.setDragImage(box, 24, 16); }} onDragEnd={() => setSecDrop(null)}><GripVertical size={14} /></span>
          <button type="button" title="Section settings" aria-label="Section settings" className={iconBtn} onClick={() => select({ kind: 'section', id: g.sec!.id })}><Pencil size={14} /></button>
          <button type="button" title="Remove section, keep its fields" aria-label="Remove section" className={iconBtn + ' hover:!bg-[#FEF2F2] hover:!text-[#DC2626]'} onClick={() => removeSection(g.sec!.id)}><Trash2 size={14} /></button>
        </span>
      </div>
    );
  };

  const fieldCard = (f: FormField, cols: number, v2: boolean) => {
    const i = fields.findIndex((x) => x.id === f.id);
    const on = sel.kind === 'field' && sel.id === f.id;
    return (
      <div key={f.id} style={{ gridColumn: `span ${f.width === 'full' ? cols : 1}` }} className="group/fw relative min-w-0"
        onDragOver={(e) => { const r = e.currentTarget.getBoundingClientRect(); dragOver(e.clientY < r.top + r.height / 2 ? i : i + 1)(e); }}
        onDrop={(e) => dropTo(dropAt ?? i, e)}>
        {dropAt === i && <span className="absolute -top-[5px] left-0 right-0 h-[3px] rounded-full bg-[#3D8BD0]" />}
        {dropAt === i + 1 && <span className="absolute -bottom-[5px] left-0 right-0 h-[3px] rounded-full bg-[#3D8BD0]" />}
        {fieldActions(f, on)}
        <button type="button" onClick={() => select({ kind: 'field', id: f.id })} draggable
          onDragStart={(e) => { e.dataTransfer.setData('text/form-field', f.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragEnd={() => setDropAt(null)}
          className={'group flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors ' + (on ? 'border-[#3D8BD0] ring-2 ring-[#EBF5FF]' : 'border-[#DFE5ED] hover:border-[#94A3B8]') + (reqModeOf(f) === 'hidden' ? ' bg-[#FAFBFC]' : ' bg-white')}>
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-[13px] font-medium text-[#1D2A3E]">{f.label}</span>
            {f.kind !== 'label' && (f.required || reqModeOf(f) === 'required') && <span className="text-[#F25C4E]">*</span>}
          </span>
          <FieldFace f={f} />
        </button>
      </div>
    );
  };

  /** A section with nothing in it: the picture says what goes here, and the whole block takes a dropped field. */
  const emptySection = (g: Group, extra?: React.ReactNode) => (
    <div data-pick onDragOver={dragOver(g.end)} onDragLeave={() => setDropAt(null)} onDrop={(e) => dropTo(g.end, e)}
      className={'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ' + (dropAt === g.end ? 'bg-[#EBF5FF]' : 'bg-[#F7F9FC]')}>
      <EmptySectionArt lit={dropAt === g.end} />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-[#364658]">{dropAt === g.end ? 'Drop it here' : 'No fields in this section yet'}</div>
        <p className="text-[12px] leading-[1.5] text-[#7B8FA5]">Drag a field in from the list, or click a field in the list to add it here.</p>
        {extra && <div className="mt-2">{extra}</div>}
      </div>
    </div>
  );
  /** "Drop a field here": the outline of a field that is not there yet. */
  const dropSlot = (at: number) => (
    <div onDragOver={dragOver(at)} onDragLeave={() => setDropAt(null)} onDrop={(e) => dropTo(at, e)}
      className={'flex flex-col gap-1.5 rounded-lg border border-dashed px-3 py-2.5 transition-colors ' + (dropAt === at ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#DFE5ED]')}>
      <span className={'h-2 w-20 rounded-full ' + (dropAt === at ? 'bg-[#BFDBF3]' : 'bg-[#E8EDF3]')} />
      <span className={'flex h-8 items-center rounded border border-dashed px-2.5 text-[12px] ' + (dropAt === at ? 'border-[#93C5EE] text-[#2F6FAE]' : 'border-[#DFE5ED] text-[#94A3B8]')}>{dropAt === at ? 'Drop it here' : 'Drop a field here'}</span>
    </div>
  );
  const addSectionCard = (cls = '') => (
    <button type="button" data-pick onClick={addSection} className={'flex flex-col items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] px-4 py-4 text-center transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FBFF] ' + cls}>
      <SectionGlyph />
      <span><span className="block text-[13px] font-medium text-[#3D8BD0]">Add a section</span><span className="mt-0.5 block text-[12px] text-[#7B8FA5]">A heading with its own fields, columns and visibility.</span></span>
    </button>
  );

  /* V1 — "+" between rows and "Add a field" at the end */
  const canvasV1 = (g: Group, gi: number) => {
    const cols = colsOf(g);
    const rows = rowsOf(g);
    let idx = g.start;
    const on = sel.kind === 'section' && g.sec && sel.id === g.sec.id;
    return (
      <section key={g.sec?.id ?? 'lead'} data-sec={g.sec?.id} className="relative flex flex-col gap-2" {...secDnd(g).props}>{secDnd(g).line}
        {sectionHead(g, false, !!on)}
        {g.sec?.helpText && <p className="-mt-1.5 text-[12px] text-[#7B8FA5]">{g.sec.helpText}</p>}
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
                  {menu === key && <AddMenu grouped={ui === 'v3'} query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(after, k)} />}
                </div>
              </div>
            );
          })}
          <div className="relative">
            {g.items.length === 0 ? emptySection(g, <button type="button" onClick={() => { setMenu(`${gi}:end`); setQ(''); }} className={btn2}>+ Add a field</button>) :
            <button type="button" onClick={() => { setMenu(`${gi}:end`); setQ(''); }} className="w-full rounded-lg border border-dashed border-[#CBD5E1] py-2 text-[12.5px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F8FBFF]">
              + Add a field{g.sec ? ` to ${g.sec.label}` : ''}
            </button>}
            {menu === `${gi}:end` && <AddMenu below grouped={ui === 'v3'} query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(g.end, k)} />}
          </div>
        </div>
      </section>
    );
  };

  /* V2 — Jira-style: "Type / to add a field" and a drop slot at the end of every section */
  const canvasV2 = (g: Group, gi: number) => {
    const cols = colsOf(g);
    const on = sel.kind === 'section' && g.sec && sel.id === g.sec.id;
    return (
      <section key={g.sec?.id ?? 'lead'} data-sec={g.sec?.id} className="relative flex flex-col gap-3" {...secDnd(g).props}>{secDnd(g).line}
        {sectionHead(g, true, !!on)}
        {g.sec?.helpText && <p className="-mt-2.5 text-[12px] text-[#7B8FA5]">{g.sec.helpText}</p>}
        {g.items.length > 0 && <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{g.items.map((f) => fieldCard(f, cols, true))}</div>}
        {/* No "Type / to add a field" box and no drop slot (Zeni, 19 Nov 2026): fields come from the panel, by click or drag. */}
        {g.items.length === 0 && emptySection(g)}
      </section>
    );
  };

  /* V3 — the form reads as the real form: label over its control, no card per field. The selected
     field is lit and every other field dims, so the eye stays on what the panel is editing. */
  const focusing = sel.kind === 'field';
  const fieldV3 = (f: FormField, cols: number) => {
    const i = fields.findIndex((x) => x.id === f.id);
    const on = sel.kind === 'field' && sel.id === f.id;
    return (
      <div key={f.id} style={{ gridColumn: `span ${f.width === 'full' ? cols : 1}` }} className="group/fw relative min-w-0"
        onDragOver={(e) => { const r = e.currentTarget.getBoundingClientRect(); dragOver(e.clientY < r.top + r.height / 2 ? i : i + 1)(e); }}
        onDrop={(e) => dropTo(dropAt ?? i, e)}>
        {dropAt === i && <span className="absolute -top-[3px] left-2 right-2 z-10 h-[3px] rounded-full bg-[#3D8BD0]" />}
        {dropAt === i + 1 && <span className="absolute -bottom-[3px] left-2 right-2 z-10 h-[3px] rounded-full bg-[#3D8BD0]" />}
        {(!focusing || on) && fieldActions(f, on)}
        <button type="button" data-pick data-field={f.id} aria-pressed={on} onClick={() => select(on ? { kind: 'form' } : { kind: 'field', id: f.id })} draggable
          onDragStart={(e) => { e.dataTransfer.setData('text/form-field', f.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDropAt(null)}
          className={'group/f flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 '
            + (on ? 'border-[#3D8BD0] bg-white shadow-[0_0_0_3px_#EBF5FF]' : 'border-transparent hover:border-[#DFE5ED] hover:bg-[#FAFBFC]')
            + (focusing && !on ? ' opacity-40 hover:opacity-100' : '')}>
          <span className="flex h-[18px] items-center gap-1.5">
            <span className={'min-w-0 truncate text-[12px] ' + (on ? 'font-medium text-[#1D2A3E]' : 'text-[#64748B]')}>{f.label}</span>
            {f.kind !== 'label' && (f.required || reqModeOf(f) === 'required') && <span className="text-[12px] text-[#F25C4E]">*</span>}
          </span>
          <FieldFace f={f} />
        </button>
      </div>
    );
  };
  const canvasV3 = (g: Group) => {
    const cols = colsOf(g);
    const on = sel.kind === 'section' && g.sec && sel.id === g.sec.id;
    return (
      <section key={g.sec?.id ?? 'lead'} data-sec={g.sec?.id} className="relative flex flex-col gap-1" {...secDnd(g).props}>{secDnd(g).line}
        {g.sec && (() => {
          const gi = groups.findIndex((x) => x.sec?.id === g.sec!.id);
          return (
            <div data-pick className={'group/sec flex items-center gap-1 rounded-lg border pr-1.5 transition-all duration-150 '
              + (on ? 'border-[#3D8BD0] bg-white shadow-[0_0_0_3px_#EBF5FF]' : 'border-transparent hover:border-[#DFE5ED] hover:bg-[#FAFBFC]') + (focusing ? ' opacity-40 hover:opacity-100' : '')}>
              <button type="button" aria-pressed={!!on} onClick={() => select(on ? { kind: 'form' } : { kind: 'section', id: g.sec!.id })} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-3 text-left">
                <span className="truncate text-[14px] font-semibold text-[#1D2A3E]">{g.sec.label}</span>
                {g.sec.techOnly && <Chip tone="amber">Technicians only</Chip>}
                {g.sec.showWhen && <Chip tone="blue">Shown when {fields.find((x) => x.id === g.sec!.showWhen!.fieldId)?.label ?? '…'} is {g.sec.showWhen.value || '…'}</Chip>}
                <span className="h-px min-w-4 flex-1 bg-[#EEF2F6]" />
              </button>
              <span className={'flex items-center transition-opacity ' + (on ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100 group-focus-within/sec:opacity-100')}>
                <span draggable title="Drag to move this section" aria-label="Drag to move this section" className={iconBtn + ' cursor-grab active:cursor-grabbing'} onDragStart={(e) => { e.dataTransfer.setData('text/form-section', g.sec!.id); e.dataTransfer.effectAllowed = 'move'; const box = e.currentTarget.closest('[data-sec]'); if (box) e.dataTransfer.setDragImage(box, 24, 16); }} onDragEnd={() => setSecDrop(null)}><GripVertical size={14} /></span>
                <button type="button" title="Section settings" aria-label="Section settings" className={iconBtn} onClick={() => select({ kind: 'section', id: g.sec!.id })}><Pencil size={14} /></button>
                <button type="button" title="Remove section, keep its fields" aria-label="Remove section" className={iconBtn + ' hover:!bg-[#FEF2F2] hover:!text-[#DC2626]'} onClick={() => removeSection(g.sec!.id)}><Trash2 size={14} /></button>
              </span>
            </div>
          );
        })()}
        {g.sec?.helpText && <p className={'-mt-2 mb-1 px-3 text-[12px] text-[#7B8FA5] ' + (focusing ? 'opacity-40' : '')}>{g.sec.helpText}</p>}
        {g.items.length > 0
          ? <div className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{g.items.map((f) => fieldV3(f, cols))}</div>
          : <div className="mx-3 mt-1">{emptySection(g)}</div>}
      </section>
    );
  };
  /** Where a clicked palette field lands: after the selected field, else the end of the selected (or last) section. */
  const addFromPalette = (k: FieldKind) => {
    if (sel.kind === 'field') { const i = fields.findIndex((f) => f.id === sel.id); if (i >= 0) return addAt(i + 1, k); }
    const g = (sel.kind === 'section' && groups.find((x) => x.sec?.id === sel.id)) || groups[groups.length - 1];
    addAt(g ? g.end : 0, k);
  };
  const paletteV3 = () => {
    const needle = pq.trim().toLowerCase();
    const shown = PALETTE_GROUPS.map((grp) => ({ ...grp, kinds: grp.kinds.filter((k) => !needle || (kindLabel(k) + ' ' + typeHelp(k).desc).toLowerCase().includes(needle)) })).filter((grp) => grp.kinds.length);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex-shrink-0 px-3 pt-3">
          <Search size={14} className="pointer-events-none absolute left-[22px] top-[calc(50%+6px)] -translate-y-1/2 text-[#94A3B8]" />
          <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Search fields" aria-label="Search custom fields" className={inputCls + ' !rounded pl-8'} />
          {pq && <button type="button" aria-label="Clear search" onClick={() => setPq('')} className="absolute right-[18px] top-[calc(50%+6px)] grid size-6 -translate-y-1/2 place-items-center rounded text-[#94A3B8] hover:bg-[#F1F5F9]"><X size={13} /></button>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {shown.map((grp) => (
            <div key={grp.title}>
              <div className="px-1 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{grp.title}</div>
              <div className="flex flex-col gap-0.5">
                {grp.kinds.map((k) => (
                  <Tooltip key={k}>
                    <TooltipTrigger asChild>
                      <button type="button" draggable onDragStart={(e) => { e.dataTransfer.setData('text/form-kind', k); e.dataTransfer.effectAllowed = 'copy'; }} onDragEnd={() => setDropAt(null)}
                        onClick={() => addFromPalette(k)}
                        className="group/p flex h-10 w-full cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2 text-left transition-colors hover:border-[#DFE5ED] hover:bg-[#F8FAFC] active:cursor-grabbing">
                        <span className="grid size-7 flex-shrink-0 place-items-center rounded-md bg-[#F1F5F9] text-[#475569] transition-colors group-hover/p:bg-[#EBF5FF] group-hover/p:text-[#3D8BD0]">{KIND_ICON[k]}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[#1D2A3E]">{kindLabel(k)}</span>
                        <span className="grid size-6 flex-shrink-0 place-items-center rounded bg-[#F1F5F9] text-[#3D8BD0] opacity-0 transition-opacity group-hover/p:opacity-100"><Plus size={14} /></span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-wrap">{typeHelp(k).desc}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
          {!shown.length && <p className="px-1 py-6 text-center text-[12.5px] text-[#7B8FA5]">No field matches “{pq}”.</p>}
        </div>
        <p className="flex-shrink-0 border-t border-[#EEF2F6] px-4 py-2.5 text-[11.5px] leading-[1.45] text-[#94A3B8]">Drag a field onto the form, or click it to add it {sel.kind === 'field' ? 'after the selected field' : 'to the last section'}.</p>
      </div>
    );
  };

  const empty = (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center">
      <EmptySectionArt big />
      <div className="text-[14px] font-semibold text-[#1D2A3E]">This form has no fields yet</div>
      <p className="max-w-[420px] text-[12.5px] text-[#64748B]">Custom fields appear on every {noun} beside the product’s own fields. Start with a section, then add the fields that belong in it.</p>
      <div className="flex gap-2"><button type="button" className={btn1} onClick={addSection}>+ Add a section</button>
        <div className="relative"><button type="button" className={btn2} onClick={() => { setMenu('empty'); setQ(''); }}>+ Add a field</button>
          {menu === 'empty' && <AddMenu below grouped={ui === 'v3'} query={q} onQuery={setQ} onClose={() => setMenu(null)} onPick={(k) => addAt(0, k)} />}</div>
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
      case 'dropdown': case 'multiselect': case 'user': case 'dependent': case 'api': case 'dynamic': {
        const o = f.kind === 'user' ? PEOPLE.map((p) => p.name) : optionsOf(f);
        return <RuleSelect className="!rounded" disabled={ro} multi={f.kind === 'multiselect'} value={val ? [val] : []} options={o.map((x) => ({ value: x, label: x }))} onChange={(v) => set(v[0] ?? '')} />;
      }
      case 'radio': return <div className="flex flex-wrap gap-3">{optionsOf(f).map((o) => <label key={o} className="flex items-center gap-1.5 text-[12.5px] text-[#364658]"><input type="radio" disabled={ro} name={f.id} checked={val === o} onChange={() => set(o)} />{o}</label>)}</div>;
      case 'checkbox': if (optionsOf(f).filter((o) => o.trim()).length) return <div className="flex flex-wrap gap-x-4 gap-y-1.5">{optionsOf(f).filter((o) => o.trim()).map((o) => <label key={o} className="flex items-center gap-1.5 text-[12.5px] text-[#364658]"><input type="checkbox" disabled={ro} />{o}</label>)}</div>;
        return <label className="flex items-center gap-2 text-[12.5px] text-[#364658]"><input type="checkbox" disabled={ro} checked={val === 'Checked'} onChange={(e) => set(e.target.checked ? 'Checked' : '')} />{f.placeholder || 'Yes'}</label>;
      case 'attachment': return <AttachBox f={f} />;
      case 'date': return <input type="datetime-local" disabled={ro} className={inputCls + ' !rounded'} />;
      case 'number': case 'currency': return <input type="number" disabled={ro} placeholder={f.placeholder} className={inputCls + ' !rounded'} />;
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
        {[[isReq ? 'Requester on the portal' : 'The whole form', isReq ? 'Technician-only sections and hidden fields are left out. * must be filled to submit. Read-only fields are greyed.' : 'Every section and field is shown. * must be filled before the record can be saved.'],
          ...(isReq ? [['Not shown to this role', hiddenNow.length ? hiddenNow.join(' · ') : 'Nothing — this role sees every field.']] : []),
          ['Appears on an answer', condNow.length ? condNow.join(' · ') : 'No conditional sections.']].map(([t, d]) => (
          <div key={t} className="rounded-lg bg-[#F4F6FA] p-3"><div className="text-[12.5px] font-semibold text-[#1D2A3E]">{t}</div><p className="mt-1 text-[12px] leading-[1.5] text-[#64748B]">{d}</p></div>
        ))}
        <p className="text-[12px] text-[#7B8FA5]">Answer the fields to test the conditions. Nothing you type here is saved.</p>
      </aside>
    </div>
  );

  /* ── page ── */
  const v2 = ui === 'v4';
  const v3 = ui === 'v2';
  /** The "+" builder keeps the guide in its EMPTY panel only; a selected field always shows its settings. */
  const plusUi = ui === 'v3';
  /** Nothing selected in the "+" builder: the open guide is all the panel has to show. */
  const guideFills = guide && plusUi && sel.kind === 'form';
  return (
    <div className="flex h-full min-h-0 flex-col">
      {(() => {
        const controls = (
          <>
            {statusSlot ? createPortal(<>{dirty ? <span title="You have changes that are not published yet"><Chip tone="amber">Draft</Chip></span> : <Chip>Published · v{published.version}</Chip>}</>, statusSlot) : (dirty ? <span title="You have changes that are not published yet"><Chip tone="amber">Draft</Chip></span> : <Chip>Published · v{published.version}</Chip>)}
            <div className="ml-auto flex items-center gap-2">
              <div className="pill-track" role="group" aria-label="Mode">
                <button type="button" aria-pressed={mode === 'build'} onClick={() => setMode('build')}>{v2 ? 'Edit' : 'Build'}</button>
                <button type="button" aria-pressed={mode === 'preview'} onClick={() => { setMode('preview'); setAnswers({}); setMenu(null); }}>Preview</button>
              </div>
              <button type="button" className={btn2} onClick={() => toast.success('Draft saved')}>Save draft</button>
              <button type="button" className={btn1} onClick={() => setPublishOpen(true)}>Publish</button>
            </div>
          </>
        );
        /* The new builder hands its controls to the page heading; the others keep their own bar. */
        if (toolbarSlot) return createPortal(<div className="flex items-center gap-3">{controls}</div>, toolbarSlot);
        return <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#EEF2F6] px-4 py-2.5">{controls}</div>;
      })()}

      {mode === 'preview' ? preview : v3 ? (
        <div className="relative flex min-h-0 flex-1">
          {helpFloat}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white" onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-pick]')) select({ kind: 'form' }); }}>
            {/* 4px + a field's own 12px = the page heading's 16px edge. */}
            <div className="mx-auto max-w-[1040px] pb-16 pl-1 pr-4 pt-3">
              {groups.length ? (
                <div className="flex flex-col gap-4">
                  {groups.map((g) => canvasV3(g))}
                  {addSectionCard('mx-3 ' + (focusing ? 'opacity-40 hover:opacity-100' : ''))}
                </div>
              ) : empty}
            </div>
          </div>
          <aside className="flex w-[380px] flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white">
            <>
            <div className="flex-shrink-0 border-b border-[#EEF2F6] p-3">
              <div className="pill-track w-full" role="group" aria-label="Panel">
                <button type="button" aria-pressed={tab === 'fields'} onClick={() => setTab('fields')}>Custom fields</button>
                <Tooltip delayDuration={0}><TooltipTrigger asChild><button type="button" aria-pressed={tab !== 'fields' && !noPick} aria-disabled={noPick} onClick={() => { if (!noPick) setTab('settings'); }} className={noPick ? '!cursor-not-allowed opacity-50' : ''}>Field settings</button></TooltipTrigger>{noPick && <TooltipContent side="bottom" className="text-wrap">Select a field on the form to edit its settings.</TooltipContent>}</Tooltip>
              </div>
            </div>
            {tab === 'fields' ? paletteV3() : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {sel.kind === 'form' ? (
                  <div className="flex flex-col items-center gap-2 px-2 py-12 text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]"><MousePointerClick size={18} /></span>
                    <p className="text-[13px] font-medium text-[#1D2A3E]">No field selected</p>
                    <p className="text-[12px] leading-[1.5] text-[#7B8FA5]">Click a field on the form to see and change its settings here.</p>
                    <button type="button" onClick={() => setTab('fields')} className="mt-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">Browse custom fields</button>
                  </div>
                ) : settings}
              </div>
            )}
            </>
          </aside>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {helpFloat}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white" onClick={(e) => { if (e.target === e.currentTarget) select({ kind: 'form' }); }}>
            <div className={'mx-auto flex max-w-[1040px] flex-col ' + (v2 ? 'gap-4 pb-16 pl-1 pr-4 pt-3' : 'gap-6 px-4 pb-16 pt-4')} onClick={(e) => { if (e.target === e.currentTarget) select({ kind: 'form' }); }}>
              {groups.length ? groups.map((g, gi) => (v2 ? canvasV3(g) /* V4 draws its form exactly as V2 does — plain fields, no outlines (Zeni, 19 Nov 2026) */ : canvasV1(g, gi))) : empty}
              {groups.length > 0 && addSectionCard()}
            </div>
          </div>
          <aside className={'flex flex-shrink-0 flex-col border-l border-[#DFE5ED] bg-white ' + (v2 ? 'w-[300px]' : 'w-[380px]')}>
            <>
            {v2 && (
              <div className="flex-shrink-0 px-3 pt-3">
                <div className="pill-track w-full" role="group" aria-label="Panel">
                  <button type="button" aria-pressed={tab === 'fields'} onClick={() => setTab('fields')}>Fields</button>
                  <Tooltip delayDuration={0}><TooltipTrigger asChild><button type="button" aria-pressed={tab !== 'fields' && !noPick} aria-disabled={noPick} onClick={() => { if (!noPick) setTab('settings'); }} className={noPick ? '!cursor-not-allowed opacity-50' : ''}>Settings</button></TooltipTrigger>{noPick && <TooltipContent side="bottom" className="text-wrap">Select a field on the form to edit its settings.</TooltipContent>}</Tooltip>
                </div>
              </div>
            )}
            <div className={'min-h-0 flex-1 overflow-y-auto ' + (v2 && tab === 'fields' ? '' : 'p-4')}>
              {v2 && tab === 'fields' ? (() => {
                /* Same logic as V2's panel: search by name or description; a click adds after the selected field, else to the selected (or last) section. */
                const needle = pq.trim().toLowerCase();
                const shown = PALETTE_GROUPS.map((grp) => ({ ...grp, kinds: grp.kinds.filter((k) => !needle || (kindLabel(k) + ' ' + typeHelp(k).desc).toLowerCase().includes(needle)) })).filter((grp) => grp.kinds.length);
                return (
                <div className="flex flex-col">
                  <div className="px-3 pb-3 pt-3">
                    <div className="relative">
                      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Search fields" aria-label="Search fields" className={inputCls + ' !rounded pl-8'} />
                      {pq && <button type="button" aria-label="Clear search" onClick={() => setPq('')} className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-[#94A3B8] hover:bg-[#F1F5F9]"><X size={13} /></button>}
                    </div>
                    <p className="mt-2 px-0.5 text-[11.5px] leading-[1.45] text-[#94A3B8]">Drag a field onto the form, or click it to add it {sel.kind === 'field' ? 'after the selected field' : 'to the last section'}.</p>
                  </div>
                  {shown.map((grp) => (
                    <div key={grp.title}>
                      <div className="border-y border-[#E8ECF1] bg-[#F6F8FA] px-3.5 py-1.5 text-[12px] font-semibold text-[#364658]">{grp.title}</div>
                      {/* 1px gaps over a grey ground draw the hairlines; an odd count gets a blank cell so the last row stays white. */}
                      <div className="grid grid-cols-2 gap-px bg-[#E8ECF1]">
                        {grp.kinds.map((k) => (
                          <Tooltip key={k}>
                            <TooltipTrigger asChild>
                              <button type="button" draggable onDragStart={(e) => { e.dataTransfer.setData('text/form-kind', k); e.dataTransfer.effectAllowed = 'copy'; }} onDragEnd={() => setDropAt(null)}
                                onClick={() => addFromPalette(k)}
                                className="group/t flex h-[92px] cursor-grab flex-col items-center justify-start gap-1 bg-white px-2 pt-3 text-center transition-colors hover:bg-[#F3F8FD] active:cursor-grabbing">
                                <KindArt kind={k} />
                                <span className="line-clamp-2 w-full text-[12px] leading-[1.3] text-[#1D2A3E] transition-colors group-hover/t:text-[#3D8BD0]">{kindLabel(k)}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-wrap">{typeHelp(k).desc}</TooltipContent>
                          </Tooltip>
                        ))}
                        {grp.kinds.length % 2 === 1 && <span aria-hidden className="bg-white" />}
                      </div>
                    </div>
                  ))}
                  {shown.length > 0 && <div className="border-t border-[#E8ECF1]" />}
                  {!shown.length && <p className="px-1 py-6 text-center text-[12.5px] text-[#7B8FA5]">No field matches “{pq}”.</p>}
                </div>
                );
              })() : settings}
            </div>
            </>
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
