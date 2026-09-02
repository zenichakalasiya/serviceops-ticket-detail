/* Support Portal — the Record List's custom filter, as a condition builder.
 *
 * A flyout to the LEFT of the design panel: rows of field / operator / value, joined by one word
 * per group, with nested groups for precedence.
 *
 * ⚠️ ONE JOIN PER GROUP, not one per row. "A and B or C" has no meaning until somebody states a
 * precedence, and a row-by-row list of And/Or dropdowns quietly picks one for you. The join belongs
 * to the bracket: it is set once, on the group's SECOND row, and every row after it repeats the
 * same word as plain text. What you read down the left edge is what will be evaluated.
 *
 * ⚠️ Precedence comes from NESTING, which is the only unambiguous way to draw it. A group inside a
 * group is a bracket you can see.
 *
 * ⚠️ WHY IT IS NOT A VIEW INSIDE THE DROPDOWN. The dropdown is 320px, and a row that shows the
 * field, the operator and the value at once needs about 520 — which is why the old in-dropdown
 * builder rendered each condition as a line of prose you clicked to edit.
 *
 * ⚠️ Portalled to document.body with fixed positioning. The design panel is `overflow-y-auto`, and
 * an absolutely-positioned surface inside it is clipped the moment it is taller than the space
 * below its trigger — the trap that has caught the colour picker, the icon picker, the table's
 * alignment flyout and the listing's kebab.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, MoreVertical, Plus, Repeat2, Search, X } from 'lucide-react';
import {
  DATE_PRESETS, OPERATORS, PEOPLE, TAG_SUGGESTIONS, UNASSIGNED,
  emptyGroup, fieldByKey, fieldsFor, isGroup, personAvatar,
} from './portalRecordFilters';
import type { Condition, FilterJoin, FilterNode, FilterField, GroupNode } from './portalRecordFilters';

const W = 620;

/* ── a small popover, anchored under whatever opened it ─────────────────────── */

/* ⚠️ How many value/field popovers are open, so the BUILDER can leave Escape alone while one is.
 * Both listen on `document`, so pressing Escape to dismiss a value list also closed the whole
 * builder and threw away everything typed into it — the two handlers cannot be told apart by
 * propagation because neither is in the other's tree. A count rather than a boolean: two popovers
 * can overlap for a frame while one replaces another, and a boolean would clear on the first
 * unmount and let the next Escape through. */
let openPops = 0;

function Pop({ anchor, onClose, children, width = 240 }: {
  anchor: DOMRect; onClose: () => void; children: React.ReactNode; width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { openPops += 1; return () => { openPops -= 1; }; }, []);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    /* A frame's delay, or the very click that opened this closes it again. */
    const t = setTimeout(() => document.addEventListener('mousedown', away), 0);
    document.addEventListener('keydown', esc);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);
  /* Flipped up when there is more room above — a value list opened on the last row of a tall group
     would otherwise run off the bottom of the window. */
  const below = window.innerHeight - anchor.bottom > 260;
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[10060] rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
      style={{
        width,
        left: Math.min(anchor.left, window.innerWidth - width - 12),
        ...(below ? { top: anchor.bottom + 4 } : { bottom: window.innerHeight - anchor.top + 4 }),
      }}
    >{children}</div>,
    document.body,
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-1">
      <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 w-full rounded border border-[#d1d5db] pl-7 pr-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
      />
    </div>
  );
}

/* Every control on a row shares one shape, so a row reads as one sentence rather than three
   controls that happen to be adjacent. */
const cell = 'flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-left text-[12.5px] text-[#364658] transition-colors hover:border-[#CBD5E1]';

/* ── the value cell — five shapes, one control ──────────────────────────────── */

function ValueCell({ field, cond, onChange }: {
  field: FilterField; cond: Condition; onChange: (c: Condition) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [q, setQ] = useState('');

  const toggle = (v: string) => onChange({
    ...cond,
    values: cond.values.includes(v) ? cond.values.filter((x) => x !== v) : [...cond.values, v],
  });

  /* ⚠️ TEXT is typed in place. It is the one kind whose value is not chosen from a list, so a
     popover would be a click and a second surface to reach a plain input. */
  /* ⚠️ `number` shares the text control rather than the option list. Falling through to the
     select below would have drawn a dropdown over a field that declares no options — a control
     that opens on nothing, which is the worst of the three possible answers. */
  if (field.kind === 'text' || field.kind === 'number') {
    return (
      <input
        type={field.kind === 'number' ? 'number' : 'text'}
        value={cond.values[0] ?? ''}
        onChange={(e) => onChange({ ...cond, values: e.target.value ? [e.target.value] : [] })}
        placeholder={field.kind === 'number' ? '0' : 'Value'}
        className="h-8 min-w-0 flex-1 rounded-md border border-[#E5E7EB] px-2.5 text-[12.5px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
      />
    );
  }

  /* ⚠️ An operator that asks nothing of a value takes none. "Status is not empty" is complete on its
     own, and a Select-value control beside it is a field the row will never use — the reference
     draws that row with two controls, and so does this. */
  if (/empty$/i.test(cond.op)) return <span className="min-w-0 flex-1" />;

  const options = field.kind === 'person'
    ? [UNASSIGNED, ...PEOPLE.map((p) => p.name)]
    : field.kind === 'date' ? DATE_PRESETS
      : field.kind === 'tags' ? TAG_SUGGESTIONS
        : (field.options ?? []);
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const [head, ...rest] = cond.values;

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setAnchor(anchor ? null : ref.current!.getBoundingClientRect())}
        className={`${cell} flex-1`}
      >
        {/* ⚠️ The first value as a CHIP and the remainder as "+N", the reference's shape. A comma
            list of five statuses truncates into something you cannot read either end of; a chip
            plus a count says how many there are and keeps the first one legible. */}
        {head ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11.5px] font-medium text-[#364658]">{head}</span>
            {rest.length > 0 && <span className="flex-shrink-0 rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[11.5px] font-medium text-[#3D8BD0]">+{rest.length}</span>}
          </span>
        ) : <span className="min-w-0 flex-1 truncate text-[#9CA3AF]">Select value</span>}
        <ChevronDown size={13} className="ml-auto flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {anchor && (
        <Pop anchor={anchor} onClose={() => { setAnchor(null); setQ(''); }}>
          {options.length > 8 && <SearchRow value={q} onChange={setQ} placeholder="Search" />}
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {shown.map((o) => {
              const on = cond.values.includes(o);
              const av = field.kind === 'person' && o !== UNASSIGNED ? personAvatar(o) : null;
              return (
                <button
                  key={o}
                  type="button"
                  /* ⚠️ A DATE is one value, so picking replaces rather than adds — "due today or
                     tomorrow" is not a question Equals asks. */
                  onClick={() => (field.kind === 'date' ? onChange({ ...cond, values: [o] }) : toggle(o))}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
                >
                  <span className="flex size-3.5 flex-shrink-0 items-center justify-center">
                    {on && <Check size={12} className="text-[#3D8BD0]" />}
                  </span>
                  {av && (
                    <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: av.bg }}>{av.initials}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{o}</span>
                </button>
              );
            })}
            {shown.length === 0 && <p className="px-1.5 py-2 text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
            {field.kind === 'tags' && q && !options.includes(q) && (
              <button type="button" onClick={() => { toggle(q); setQ(''); }}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-[12px] text-[#3D8BD0] hover:bg-[#F5F7FA]">
                <Plus size={11} /> Add “{q}”
              </button>
            )}
          </div>
        </Pop>
      )}
    </>
  );
}

/* ── a picker cell: the field, and the operator ─────────────────────────────── */

function PickCell({ label, placeholder, options, value, onPick, width, searchable }: {
  label?: string; placeholder: string; options: { key: string; label: string }[];
  value?: string; onPick: (key: string) => void; width: string; searchable?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [q, setQ] = useState('');
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <>
      <button ref={ref} type="button" onClick={() => setAnchor(anchor ? null : ref.current!.getBoundingClientRect())} className={`${cell} ${width} flex-shrink-0`}>
        <span className={`min-w-0 flex-1 truncate ${label ? '' : 'text-[#9CA3AF]'}`}>{label ?? placeholder}</span>
        <ChevronDown size={13} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {anchor && (
        <Pop anchor={anchor} onClose={() => { setAnchor(null); setQ(''); }}>
          {searchable && <SearchRow value={q} onChange={setQ} placeholder="Search" />}
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {shown.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => { onPick(o.key); setAnchor(null); setQ(''); }}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
              >
                <span className="flex size-3.5 flex-shrink-0 items-center justify-center">
                  {o.key === value && <Check size={12} className="text-[#3D8BD0]" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{o.label}</span>
              </button>
            ))}
            {shown.length === 0 && <p className="px-1.5 py-2 text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
          </div>
        </Pop>
      )}
    </>
  );
}

/* ── the per-row menu ───────────────────────────────────────────────────────── */

function RowMenu({ canGroup, onGroup, onDelete }: { canGroup: boolean; onGroup: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setAnchor(anchor ? null : ref.current!.getBoundingClientRect())}
        className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
      ><MoreVertical size={15} /></button>
      {anchor && (
        <Pop anchor={anchor} onClose={() => setAnchor(null)} width={190}>
          {/* ⚠️ Only where it can happen: a row already inside a nested group cannot be nested again,
              because this builder brackets one level deep. The item is absent rather than greyed —
              the same rule the canvas toolbars follow. */}
          {canGroup && (
            <button type="button" onClick={() => { setAnchor(null); onGroup(); }}
              className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-[#364658] hover:bg-[#F5F7FA]">Turn into a group</button>
          )}
          <button type="button" onClick={() => { setAnchor(null); onDelete(); }}
            className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]">Delete</button>
        </Pop>
      )}
    </>
  );
}

/* ── the join word down the left edge ───────────────────────────────────────── */

/** The first row says "Where"; the second carries the group's toggle; the rest repeat it as text. */
function JoinCell({ index, join, onToggle }: { index: number; join: FilterJoin; onToggle: () => void }) {
  const word = join === 'and' ? 'And' : 'Or';
  if (index === 0) return <span className="w-[74px] flex-shrink-0 pl-1 text-[12.5px] text-[#7B8FA5]">Where</span>;
  /* ⚠️ Only the SECOND row is a control. It sets the join for the whole group, so putting the same
     control on every row would be four ways to change one value — and the moment two of them showed
     different words the group would be describing something it cannot do. */
  if (index === 1) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={`Switch this group to ${join === 'and' ? 'Or' : 'And'}`}
        className="flex h-8 w-[74px] flex-shrink-0 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12.5px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
      >{word}<Repeat2 size={13} className="text-[#9CA3AF]" /></button>
    );
  }
  return <span className="w-[74px] flex-shrink-0 pl-1 text-[12.5px] text-[#7B8FA5]">{word}</span>;
}

/* ── the builder ───────────────────────────────────────────────────────────── */

export function PortalConditionBuilder({ anchor, moduleKey, statuses, seed, seedFrom, onApply, onClose }: {
  /** The filter field's rect — the flyout sits to the left of it. */
  anchor: DOMRect;
  moduleKey: string;
  statuses: string[];
  seed: GroupNode;
  /** The preset the seed came from, named so the header can say the work started somewhere. */
  seedFrom?: string;
  onApply: (tree: GroupNode) => void;
  onClose: () => void;
}) {
  const fields = fieldsFor(moduleKey, statuses);
  /* ⚠️ A DRAFT, committed by Apply. Every other control in this panel writes live, but a filter is
     read as one statement — an admin part-way through "status is X **or** priority is Y" has, for a
     few seconds, said something they do not mean, and watching the card empty and refill under a
     half-built rule teaches them the builder is broken. */
  const [tree, setTree] = useState<GroupNode>(() =>
    (seed.children.length ? JSON.parse(JSON.stringify(seed)) : emptyGroup('and')));
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const left = Math.max(12, anchor.left - W - 10);
    const top = Math.min(Math.max(12, anchor.top), Math.max(12, window.innerHeight - 480));
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    /* ⚠️ Escape closes the innermost thing only. With a value list open it belongs to that list, and
       closing the builder underneath it would discard a filter half-written. */
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && openPops === 0) onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  /* Every edit is "replace the children of the group at this path", which keeps one updater rather
     than one per operation and makes an immutable copy the only thing any of them has to get right. */
  const edit = (path: number[], fn: (g: GroupNode) => GroupNode) => setTree((t) => {
    const walk = (node: GroupNode, depth: number): GroupNode => {
      if (depth === path.length) return fn(node);
      const i = path[depth];
      return {
        ...node,
        children: node.children.map((c, j) => (j === i && isGroup(c) ? walk(c, depth + 1) : c)),
      };
    };
    return walk(t, 0);
  });

  const setRow = (path: number[], i: number, c: Condition) =>
    edit(path, (g) => ({ ...g, children: g.children.map((x, j) => (j === i ? { kind: 'cond', ...c } : x)) }));
  const addRow = (path: number[]) =>
    edit(path, (g) => ({ ...g, children: [...g.children, { kind: 'cond', field: '', op: '', values: [] }] }));
  /* ⚠️ Removing a nested group's last row removes the GROUP. An empty bracket matches everything and
     is drawn as though it were a rule — with an Or join beside it, it would quietly widen the
     filter to every record. */
  const dropRow = (path: number[], i: number) => setTree((t) => {
    const walk = (node: GroupNode, depth: number): GroupNode => {
      if (depth === path.length) return { ...node, children: node.children.filter((_, j) => j !== i) };
      const k = path[depth];
      const next = node.children.map((c, j) => (j === k && isGroup(c) ? walk(c, depth + 1) : c));
      return { ...node, children: next.filter((c) => !(isGroup(c) && c.children.length === 0)) };
    };
    return walk(t, 0);
  });
  /* Turning a row into a group wraps it, so the row it started from is the group's first member and
     nothing the admin had already written is lost. */
  const groupRow = (i: number) => edit([], (g) => ({
    ...g,
    children: g.children.map((c, j) => (j === i && !isGroup(c)
      ? { kind: 'group', join: 'and', children: [c] } as FilterNode
      : c)),
  }));

  const opsFor = (f?: FilterField) => (f ? OPERATORS[f.kind].map((o) => ({ key: o, label: o })) : []);
  const fieldOpts = fields.map((f) => ({ key: f.key, label: f.label }));
  const complete = (r: Condition) => !!r.field && !!r.op && (r.values.length > 0 || /empty$/i.test(r.op));

  const Row = ({ node, path, i, join, onJoin }: {
    node: Condition; path: number[]; i: number; join: FilterJoin; onJoin: () => void;
  }) => {
    const f = node.field ? fieldByKey(moduleKey, node.field, statuses) : undefined;
    return (
      <div className="flex items-center gap-2">
        <JoinCell index={i} join={join} onToggle={onJoin} />
        <PickCell
          width="w-[136px]" placeholder="Select field" searchable
          label={f?.label} value={node.field} options={fieldOpts}
          /* ⚠️ Changing the field RESETS the operator and the value. An operator belongs to a KIND,
             so "Contains" left on a status field is a comparison that field cannot make. */
          onPick={(k) => {
            const nf = fields.find((x) => x.key === k)!;
            setRow(path, i, { field: k, op: OPERATORS[nf.kind][0], values: [] });
          }}
        />
        <PickCell
          width="w-[120px]" placeholder="—"
          label={node.op || undefined} value={node.op} options={opsFor(f)}
          onPick={(k) => setRow(path, i, { ...node, op: k })}
        />
        {f
          ? <ValueCell field={f} cond={node} onChange={(c) => setRow(path, i, c)} />
          : <span className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-dashed border-[#E5E7EB] px-2.5 text-[12.5px] text-[#9CA3AF]">Pick a field first</span>}
        <RowMenu
          canGroup={path.length === 0}
          onGroup={() => groupRow(i)}
          onDelete={() => dropRow(path, i)}
        />
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed z-[10050] flex max-h-[calc(100vh-24px)] flex-col rounded-xl border border-[#E5E7EB] bg-white shadow-[0_16px_40px_-8px_rgba(16,24,40,0.24)]"
      style={{ width: W, top: pos.top, left: pos.left }}
    >
      <div className="flex flex-shrink-0 items-start gap-3 px-4 pb-1 pt-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#364658]">Filters</p>
          {seedFrom && (
            <p className="mt-0.5 text-[11.5px] text-[#7B8FA5]">Started from <span className="font-medium text-[#5A6B80]">{seedFrom}</span></p>
          )}
        </div>
        <button type="button" onClick={onClose} className="flex size-7 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={15} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {tree.children.map((child, i) => (
          isGroup(child) ? (
            /* ⚠️ A nested group is drawn as a TINTED BLOCK with the parent's join beside it, not as
               indented rows. The tint is the bracket: without a visible edge, "and" three rows above
               a differently-joined run is a rule the reader has to hold in their head. */
            <div key={i} className="flex items-stretch gap-2">
              <span className="flex w-[74px] flex-shrink-0 items-center pl-1 text-[12.5px] text-[#7B8FA5]">
                {i === 0 ? 'Where' : tree.join === 'and' ? 'And' : 'Or'}
              </span>
              <div className="min-w-0 flex-1 space-y-2 rounded-lg bg-[#F7F8FA] p-2.5">
                {child.children.map((c, j) => (
                  !isGroup(c) && (
                    <Row
                      key={j} node={c} path={[i]} i={j} join={child.join}
                      onJoin={() => edit([i], (g) => ({ ...g, join: g.join === 'and' ? 'or' : 'and' }))}
                    />
                  )
                ))}
                <button
                  type="button"
                  onClick={() => addRow([i])}
                  className="flex items-center gap-1.5 rounded px-1 py-1 text-[12.5px] font-medium text-[#3D8BD0] hover:underline"
                ><Plus size={13} /> Add filter</button>
              </div>
              <RowMenu canGroup={false} onGroup={() => {}} onDelete={() => dropRow([], i)} />
            </div>
          ) : (
            <Row
              key={i} node={child} path={[]} i={i} join={tree.join}
              onJoin={() => edit([], (g) => ({ ...g, join: g.join === 'and' ? 'or' : 'and' }))}
            />
          )
        ))}

        {tree.children.length === 0 && (
          <p className="rounded-md border border-dashed border-[#E5E7EB] px-3 py-3 text-[12.5px] text-[#9CA3AF]">
            No conditions yet — the card lists every record in this module.
          </p>
        )}

        <button
          type="button"
          onClick={() => addRow([])}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
        ><Plus size={13} /> Add filter</button>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-[#F0F2F5] px-4 py-3">
        <button
          type="button"
          onClick={() => setTree(emptyGroup('and'))}
          className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-[12.5px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
        >Clear all</button>
        <button
          type="button"
          /* ⚠️ Incomplete rows are DROPPED on apply. A row with a field and no value filters nothing,
             so keeping it would put a rule on screen that does not do anything — and the count under
             the field would disagree with the card. */
          onClick={() => {
            const prune = (g: GroupNode): GroupNode => ({
              ...g,
              children: g.children
                .map((c) => (isGroup(c) ? prune(c) : c))
                .filter((c) => (isGroup(c) ? c.children.length > 0 : complete(c))),
            });
            onApply(prune(tree));
          }}
          className="inline-flex h-8 items-center gap-2 rounded-md bg-[#3D8BD0] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#3480c4]"
        >Apply</button>
      </div>
    </div>,
    document.body,
  );
}
