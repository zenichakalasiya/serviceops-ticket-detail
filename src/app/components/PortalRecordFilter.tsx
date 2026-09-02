/* Support Portal — the Record List's filter control.
 *
 * ONE field in the panel. It opens a popover that holds three views, because that is what fits:
 *
 *   PRESETS   the named out-of-the-box filters, searchable, pinnable — the answer nine times in ten
 *   BUILDER   the custom filter: a stacked list of conditions, and a field picker to add one
 *   EDITOR    one condition — its operator and its value, in whichever of the five shapes it needs
 *
 * ⚠️ THE PROBLEM THIS SOLVES is the width. The technician list page runs its filter across the top
 * of the page, so conditions sit side by side as chips and each opens a popup beneath itself. This
 * panel is 340px. Laying the same thing out horizontally there gives you three chips wrapping onto
 * four lines with their popups clipped by the panel's own scroll — so conditions STACK, one per
 * row, and the popups are views WITHIN the one popover rather than popups on top of a popup. The
 * content is identical: same presets, same fields, same operators, same value editors.
 *
 * ⚠️ Portalled to document.body with fixed positioning. The design panel is `overflow-y-auto`, and
 * an absolutely-positioned popover inside it is clipped the moment it is taller than the space
 * below its field — the trap that has caught the colour picker, the icon picker and the table's
 * alignment flyout in this file's siblings.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  DATE_PRESETS, OPERATORS, PEOPLE, TAG_SUGGESTIONS, UNASSIGNED,
  activeConditions, activeTree, describeCondition, fieldByKey, fieldsFor, personAvatar, presetById, presetsFor, summarise,
} from './portalRecordFilters';
import type { Condition, FilterField, GroupNode, RecordFilter } from './portalRecordFilters';
import { PortalConditionBuilder } from './PortalConditionBuilder';

/** The hover card’s width, shared by the flip test and the card itself so the two cannot drift. */
const PEEK_W = 260;

/* ── small shared bits ─────────────────────────────────────────────────────── */

function SearchBox({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded border border-[#d1d5db] pl-7 pr-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
      />
    </div>
  );
}

function ViewHead({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-2 flex w-full items-center gap-1.5 text-[12px] font-semibold text-[#364658] hover:text-[#3D8BD0]"
    >
      <ChevronLeft size={14} />
      {title}
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const { initials, bg } = personAvatar(name);
  return (
    <span
      className="flex size-5 flex-shrink-0 items-center justify-center rounded-sm text-[9px] font-semibold text-white"
      style={{ background: bg }}
    >{initials || '—'}</span>
  );
}

/** A checkbox row — the shape shared by Type, Priority, Assignee and every other multi-select. */
function CheckRow({ label, on, onToggle, avatar }: {
  label: string; on: boolean; onToggle: () => void; avatar?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
    >
      <span className={`flex size-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border ${
        on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1] bg-white'
      }`}>{on && <Check size={10} strokeWidth={3} />}</span>
      {avatar && <Avatar name={label} />}
      <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]">{label}</span>
    </button>
  );
}

/* ── the condition editor (one view, five shapes) ──────────────────────────── */

function ConditionEditor({ field, draft, onChange, onDone, onBack }: {
  field: FilterField;
  draft: Condition;
  onChange: (c: Condition) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [q, setQ] = useState('');
  const ops = OPERATORS[field.kind];

  const toggle = (v: string) => onChange({
    ...draft,
    values: draft.values.includes(v) ? draft.values.filter((x) => x !== v) : [...draft.values, v],
  });

  const options = field.kind === 'person'
    ? [UNASSIGNED, ...PEOPLE.map((p) => p.name)]
    : (field.options ?? []);
  /* A search box appears once the list is long enough to need one. Below that it is a control that
     can only ever say "yes, those eight are all of them". */
  const searchable = field.kind === 'person' || options.length > 8;
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div>
      <ViewHead title={field.label} onBack={onBack} />

      <label className="mb-1 block text-[11px] font-medium text-[#7B8FA5]">Operator</label>
      <select
        value={draft.op}
        onChange={(e) => onChange({ ...draft, op: e.target.value })}
        className="app-select mb-2.5 h-8 w-full rounded border border-[#d1d5db] px-2.5 text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
      >
        {ops.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      {(field.kind === 'text' || field.kind === 'number') && (
        <input
          type={field.kind === 'number' ? 'number' : 'text'}
          value={draft.values[0] ?? ''}
          onChange={(e) => onChange({ ...draft, values: e.target.value ? [e.target.value] : [] })}
          placeholder={field.label}
          className="h-8 w-full rounded border border-[#d1d5db] px-2.5 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        />
      )}

      {/* ⚠️ Dates are RADIOS, not checkboxes — "due today or tomorrow" is not a question this
          operator asks, and offering two ticks for a single Equals would promise it does. */}
      {field.kind === 'date' && (
        <div className="space-y-0.5">
          {DATE_PRESETS.map((d) => {
            const on = draft.values[0] === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...draft, values: [d] })}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#F5F7FA]"
              >
                <span className={`flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border ${
                  on ? 'border-[#3D8BD0]' : 'border-[#CBD5E1]'
                }`}>{on && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}</span>
                <span className="text-[12px] text-[#364658]">{d}</span>
              </button>
            );
          })}
        </div>
      )}

      {field.kind === 'tags' && (
        <div>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {draft.values.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded bg-[#EEF2F7] px-1.5 py-0.5 text-[11px] text-[#364658]">
                {t}
                <button type="button" onClick={() => toggle(t)} className="text-[#9CA3AF] hover:text-[#DC2626]"><X size={10} /></button>
              </span>
            ))}
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="Add a tag" />
          <div className="mt-1 max-h-[150px] space-y-0.5 overflow-y-auto">
            {TAG_SUGGESTIONS.filter((t) => !draft.values.includes(t) && t.includes(q.toLowerCase())).map((t) => (
              <button key={t} type="button" onClick={() => { toggle(t); setQ(''); }}
                className="block w-full rounded px-1.5 py-1.5 text-left text-[12px] text-[#364658] hover:bg-[#F5F7FA]">{t}</button>
            ))}
            {q && !TAG_SUGGESTIONS.includes(q) && (
              <button type="button" onClick={() => { toggle(q); setQ(''); }}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-[12px] text-[#3D8BD0] hover:bg-[#F5F7FA]">
                <Plus size={11} /> Add “{q}”
              </button>
            )}
          </div>
        </div>
      )}

      {(field.kind === 'choice' || field.kind === 'person') && (
        <div>
          {searchable && <SearchBox value={q} onChange={setQ} placeholder="Search" />}
          <div className={`${searchable ? 'mt-1 ' : ''}max-h-[190px] space-y-0.5 overflow-y-auto`}>
            {shown.map((o) => (
              <CheckRow key={o} label={o} on={draft.values.includes(o)} onToggle={() => toggle(o)} avatar={field.kind === 'person'} />
            ))}
            {shown.length === 0 && <p className="px-1.5 py-2 text-[12px] text-[#9CA3AF]">Nothing matches “{q}”.</p>}
          </div>
        </div>
      )}

      <div className="mt-2.5 flex justify-end border-t border-[#F1F5F9] pt-2.5">
        <button
          type="button"
          onClick={onDone}
          className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3480c4]"
        >Done</button>
      </div>
    </div>
  );
}

/* ── the control ───────────────────────────────────────────────────────────── */

export function RecordFilterField({ value, moduleKey, statuses, onChange }: {
  value: RecordFilter | undefined;
  moduleKey: string;
  statuses: string[];
  onChange: (v: RecordFilter) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'build' | 'edit'>('list');
  const [q, setQ] = useState('');
  /* Which preset the pointer is on, so the list can show what that preset actually filters by. */
  const [peek, setPeek] = useState<{ id: string; top: number; left: number; right: number } | null>(null);
  const [editing, setEditing] = useState<{ index: number; draft: Condition } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  /* The condition builder's anchor — the filter FIELD's rect, since the flyout sits beside the
     field rather than beside the row that opened it. Null means closed. */
  const [building, setBuilding] = useState<DOMRect | null>(null);

  const fields = fieldsFor(moduleKey, statuses);
  const presets = presetsFor(moduleKey);
  const conds = value?.conditions ?? [];
  const chosen = presetById(moduleKey, value?.preset);

  /* Position under the trigger, clamped so a popover opened near the foot of a tall panel is not
     half off the bottom of the window. */
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const h = Math.min(430, window.innerHeight - 24);
    const top = Math.min(r.bottom + 6, window.innerHeight - h - 12);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - 332);
    setPos({ top: Math.max(12, top), left });
  }, [open, view, picking]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  /* ⚠️ A pin is keyed `module:id`, not `id`. Every module's catalogue ends in an "All …" preset
     and they all carry the id `all`, so a bare id meant pinning "All Changes" silently pinned
     "All Requests", "All Assets" and every other module's too — one gesture quietly changing nine
     other lists the admin was not looking at. */
  /* ⚠️ The PIN is gone, and so is the localStorage behind it. Reordering a twelve-row list that is
     already searchable bought very little, and it bought it with an icon that appeared under the
     pointer on every row — on the one surface whose job is to let you read the rows. What the hover
     is for now is saying what a preset DOES.
     ⚠️ Catalogue order, therefore, exactly as the product lists them. */
  const listed = q ? presets.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : presets;

  const openEditor = (index: number, draft: Condition) => { setEditing({ index, draft }); setView('edit'); setPicking(false); };

  const commitEditor = () => {
    if (!editing) return;
    const next = [...conds];
    if (editing.index === -1) next.push(editing.draft); else next[editing.index] = editing.draft;
    /* ⚠️ Writing conditions CLEARS the preset. The two are one setting shown two ways, and a card
       claiming "All Open Requests" while running three conditions of somebody's own would be the
       panel telling a straight lie about what the requester will see. */
    onChange({ conditions: next });
    setEditing(null);
    setView('build');
  };

  const removeCond = (i: number) => onChange({ conditions: conds.filter((_, x) => x !== i) });

  const labelOf = (key: string) => fieldByKey(moduleKey, key, statuses)?.label ?? key;

  /* Everything in force right now, whichever half of the control set it — this is what the chips
     under the closed field show, so a chosen preset is never a name with nothing behind it. */
  const inForce = activeConditions(value, moduleKey);

  /* ── what the hovered preset actually filters by ──
   *
   * ⚠️ Portalled and fixed, like the popover itself: this card is wider than the 320px popover and
   * the list inside it scrolls, so rendered in place it would be clipped on two edges at once.
   * ⚠️ It sits to the RIGHT of the row, never over the list — the whole point is to read the name
   * and its conditions together, and a card covering the names makes you hover blind.
   * ⚠️ An empty preset says so in words rather than showing an empty card. "All Requests" genuinely
   * has no conditions, and a card with nothing in it looks like a card that failed to load. */
  const peeked = peek ? presets.find((p) => p.id === peek.id) : undefined;
  const peekCard = peek && peeked && createPortal(
    <div
      /* ⚠️ It FLIPS to the left of the list rather than being clamped onto it. Clamping was the
         first version and it was wrong in the one case that matters: this popover opens beside a
         panel pinned to the right of the window, so there is usually no room on the right — and a
         clamped card landed ON the names, which is the one thing this card must never cover. */
      style={{
        position: 'fixed',
        left: peek.right + 8 + PEEK_W <= window.innerWidth - 8
          ? peek.right + 8
          : Math.max(8, peek.left - 8 - PEEK_W),
        top: Math.min(peek.top - 6, window.innerHeight - 190),
      }}
      className="pointer-events-none z-[10001] w-[260px] rounded-lg border border-[#E5E7EB] bg-white p-2.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Filters by</p>
      {peeked.scope && (
        <p className="mb-1 flex items-start gap-1.5 text-[12px] text-[#364658]">
          <span className="mt-[5px] size-1 flex-shrink-0 rounded-full bg-[#3D8BD0]" />
          {peeked.scope}
        </p>
      )}
      {peeked.conditions.map((c, i) => (
        <p key={`${c.field}-${i}`} className="mb-1 flex items-start gap-1.5 text-[12px] text-[#364658]">
          <span className="mt-[5px] size-1 flex-shrink-0 rounded-full bg-[#3D8BD0]" />
          {describeCondition(c, labelOf(c.field))}
        </p>
      ))}
      {peeked.conditions.length === 0 && !peeked.scope && (
        <p className="text-[12px] leading-[1.5] text-[#9CA3AF]">
          No conditions — every record in this module.
        </p>
      )}
    </div>,
    document.body,
  );

  const pop = open && createPortal(
    <div
      ref={popRef}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[10000] flex max-h-[430px] w-[320px] flex-col rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]"
    >
      {view === 'list' && (
        <>
          <SearchBox value={q} onChange={setQ} placeholder="Search filters" />
          {/* ⚠️ A TITLE, because a bare list of twelve names does not say what kind of thing they
              are. These are the module's own out-of-the-box filters — an admin should not have to
              work out from the names alone that they came with the product rather than from
              somebody's earlier session. */}
          <p className="mt-2.5 px-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Predefined filters
          </p>
          <div className="-mx-1 mt-1 flex-1 space-y-0.5 overflow-y-auto px-1">
            {listed.map((p) => {
              const on = value?.preset === p.id;
              return (
                /* ⚠️ Hovering a row says what that preset FILTERS BY. A name like "My Overdue
                    Requests" is a promise the list cannot keep on its own — two of these differ by
                    one condition — so the conditions are what the pointer reveals, in the place the
                    pin used to appear and take the row's width with it. */
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={(e) => {
                    /* ⚠️ Measured off the POPOVER, not off the row. A row sits ~13px inside the
                       popover's padding, so flipping the card off the row's left edge left it
                       ending 5px INSIDE the list — covering the first characters of every name,
                       which is the one thing this card exists not to do. The card has to clear the
                       surface, so the surface is what it is placed against. */
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const box = popRef.current?.getBoundingClientRect();
                    setPeek({ id: p.id, top: r.top, left: box?.left ?? r.left, right: box?.right ?? r.right });
                  }}
                  onMouseLeave={() => setPeek((s) => (s?.id === p.id ? null : s))}
                  onClick={() => { onChange({ preset: p.id }); setOpen(false); }}
                  className={`block w-full truncate rounded px-2 py-1.5 text-left text-[12px] ${
                    on ? 'bg-[#EAF3FB] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
                  }`}
                >{p.name}</button>
              );
            })}
            {listed.length === 0 && <p className="px-1.5 py-3 text-[12px] text-[#9CA3AF]">No filter matches “{q}”.</p>}
          </div>
          {/* ⚠️ It opens the BUILDER FLYOUT, it does not swap this dropdown's view. A row of field
              + operator + value needs about 520px and this popover is 320 — which is why the old
              in-dropdown builder had to render each condition as a line of prose you clicked to
              edit. The flyout has the room to show the whole rule at once.
              ⚠️ The dropdown stays OPEN behind it. It is where the preset that seeded the builder is
              named, and closing it would take that context away at the moment it starts mattering. */}
          <button
            type="button"
            onClick={() => { setQ(''); setBuilding(btnRef.current!.getBoundingClientRect()); }}
            className="mt-2 flex items-center gap-2 rounded border-t border-[#F1F5F9] px-1.5 pt-2.5 text-[12px] font-medium text-[#3D8BD0]"
          >
            <SlidersHorizontal size={13} />
            <span className="flex-1 text-left">Custom filter</span>
            <ChevronRight size={13} />
          </button>
        </>
      )}

      {view === 'build' && (
        <>
          <ViewHead title="Custom filter" onBack={() => { setView('list'); setPicking(false); }} />
          <div className="-mx-1 flex-1 overflow-y-auto px-1">
            {conds.length === 0 && !picking && (
              <p className="rounded border border-dashed border-[#E5E7EB] px-2.5 py-3 text-[12px] leading-[1.5] text-[#9CA3AF]">
                No conditions yet — the card lists every record in this module.
              </p>
            )}
            {/* ⚠️ Conditions STACK. The technician toolbar runs them across as chips because it has
                the width of the page; three of them in a 320px popover would wrap to four lines and
                stop being readable as a list of rules. */}
            <div className="space-y-1">
              {conds.map((c, i) => {
                const f = fieldByKey(moduleKey, c.field, statuses);
                return (
                  <div key={`${c.field}-${i}`} className="flex items-center gap-1 rounded border border-[#E5E7EB] bg-white pl-2 pr-1 hover:border-[#CBD5E1]">
                    <button
                      type="button"
                      onClick={() => f && openEditor(i, { ...c })}
                      className="min-w-0 flex-1 truncate py-1.5 text-left text-[12px] text-[#364658]"
                    >{describeCondition(c, labelOf(c.field))}</button>
                    <button
                      type="button"
                      title="Remove this condition"
                      onClick={() => removeCond(i)}
                      className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] hover:text-[#DC2626]"
                    ><X size={12} /></button>
                  </div>
                );
              })}
            </div>

            {picking ? (
              <div className="mt-2">
                <SearchBox value={q} onChange={setQ} placeholder="Select field or enter a keyword to search…" />
                <div className="mt-1 max-h-[210px] space-y-0.5 overflow-y-auto">
                  {fields.filter((f) => f.label.toLowerCase().includes(q.toLowerCase())).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => { setQ(''); openEditor(-1, { field: f.key, op: OPERATORS[f.kind][0], values: [] }); }}
                      className="block w-full rounded px-1.5 py-1.5 text-left text-[12px] text-[#364658] hover:bg-[#F5F7FA]"
                    >{f.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setPicking(true); setQ(''); }}
                className="mt-2 flex w-full items-center gap-1.5 rounded border border-dashed border-[#CBD5E1] px-2.5 py-1.5 text-[12px] font-medium text-[#3D8BD0] hover:border-[#3D8BD0] hover:bg-[#F8FBFE]"
              ><Plus size={12} /> Add condition</button>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-[#F1F5F9] pt-2.5">
            <button
              type="button"
              onClick={() => onChange({ conditions: [] })}
              disabled={conds.length === 0}
              className="text-[12px] text-[#6B7280] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:text-[#D1D5DB]"
            >Clear all</button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#3480c4]"
            >Done</button>
          </div>
        </>
      )}

      {view === 'edit' && editing && (() => {
        const f = fieldByKey(moduleKey, editing.draft.field, statuses);
        if (!f) return null;
        return (
          <div className="flex-1 overflow-y-auto">
            <ConditionEditor
              field={f}
              draft={editing.draft}
              onChange={(c) => setEditing({ ...editing, draft: c })}
              onDone={commitEditor}
              onBack={() => { setEditing(null); setView('build'); }}
            />
          </div>
        );
      })()}
    </div>,
    document.body,
  );

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen(!open); setView(chosen || conds.length === 0 ? 'list' : 'build'); setQ(''); setPicking(false); }}
        className={`flex h-9 w-full items-center gap-2 rounded border bg-white px-2.5 text-left text-[13px] transition-colors ${
          open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#d1d5db] hover:border-[#9CA3AF]'
        }`}
      >
        <ListFilter size={14} className="flex-shrink-0 text-[#7B8FA5]" />
        <span className={`min-w-0 flex-1 truncate ${chosen || conds.length ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>
          {summarise(value, moduleKey)}
        </span>
        <ChevronRight size={13} className="flex-shrink-0 rotate-90 text-[#9CA3AF]" />
      </button>

      {/* ⚠️ The conditions in force, under the closed field. Without them a chosen preset is a name
          and nothing else — you would have to open the popover and remember what it contained to
          know what the card is actually showing. */}
      {inForce.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {inForce.map((c, i) => (
            <span key={`${c.field}-${i}`} className="inline-flex max-w-full items-center truncate rounded bg-[#EEF2F7] px-1.5 py-0.5 text-[11px] text-[#5A6B80]">
              {describeCondition(c, labelOf(c.field))}
            </span>
          ))}
        </div>
      )}

      {pop}
      {peekCard}

      {/* ⚠️ SEEDED from whatever is in force. A preset resolves to its own conditions as one editable
          group, so "All Open Requests" is a starting point you can refine rather than an opaque
          name you must first reproduce by hand. `activeGroups` already answers this for a preset,
          a legacy flat list and real groups alike, so the builder never has to know which of the
          three it opened on. */}
      {building && (
        <PortalConditionBuilder
          anchor={building}
          moduleKey={moduleKey}
          statuses={statuses}
          seed={activeTree(value, moduleKey)}
          seedFrom={chosen?.name}
          onClose={() => setBuilding(null)}
          onApply={(tree) => {
            /* ⚠️ The preset is DROPPED. The filter is now these conditions — keeping the name would
               leave the field claiming "All Open Requests" while the card obeys something the admin
               has since edited, and the two would never agree again. What the preset gave was the
               starting point, which is already in the groups. */
            onChange({ tree });
            setBuilding(null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
