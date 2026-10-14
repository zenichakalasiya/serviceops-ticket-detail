/**
 * TableFilterBar — the Requests-style filter bar for a Shortcut tile.
 *
 * One field does two jobs, which is the whole point of the pattern: TYPE to search the records,
 * or CLICK to pick a field and build a condition. Splitting them into a search box and a separate
 * filter widget is what the design replaces.
 *
 * Picking a field adds its chip immediately and opens the operator popover under it, so the chip
 * is visible while you configure it rather than appearing only once you commit. An unfinished chip
 * filters nothing (condReady), so a half-built condition never silently empties the table.
 *
 * Lives in its own component because WidgetCard is already long, and this owns three layered
 * popovers of its own.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, Dropdown, DashPortal } from '../ui/primitives';
import { conditionFields, TEXT_OPS, ENUM_OPS, opLabelFor, condValueText, condReady } from '../data/filters.js';
import './TableFilterBar.css';

export function TableFilterBar({
  columns = [], rows = [], modelValue = [], search = '',
  /* A caller that already knows its filterable fields passes them straight in — the Manage grid's
   * columns are computed properties of a dashboard, not raw cells. */
  fields: fieldsProp = null,
  /* the Shortcut tile's bar is opened from a filter icon and has to close again; a screen whose
   * bar is permanent has nothing to close, so it hides the ✕ */
  closable = true,
  placeholder = 'Select field or enter a keyword to search…',
  onUpdateModelValue, onUpdateSearch, onClose,
}: any) {
  const fields: any[] = fieldsProp || conditionFields(columns, rows);
  const fieldOf = (c: any) => fields.find((f) => f.key === c.key);
  const conds: any[] = modelValue || [];
  const setConds = (next: any[]) => onUpdateModelValue?.(next);

  // ---- field list ---------------------------------------------------------
  const boxEl = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [fieldPos, setFieldPos] = useState({ top: 0, left: 0 });
  function openFields() {
    const r = boxEl.current?.getBoundingClientRect(); if (!r) return;
    setFieldPos({ top: r.bottom + 6, left: Math.min(r.left + 8, window.innerWidth - 232) });
    setFieldsOpen(true);
  }
  // the chip has to exist before it can be anchored to — editCond runs once the new list renders
  const [pendingEdit, setPendingEdit] = useState(-1);
  function pickField(f: any) {
    setFieldsOpen(false);
    const cond = { key: f.key, op: f.type === 'enum' ? 'is' : 'contains', values: [], value: '' };
    setConds([...conds, cond]);
    setPendingEdit(conds.length);
  }
  useEffect(() => {
    if (pendingEdit >= 0 && conds[pendingEdit]) { const i = pendingEdit; setPendingEdit(-1); requestAnimationFrame(() => editCond(i)); }
  });

  // ---- operator / value popover ------------------------------------------
  const [editing, setEditing] = useState(-1);
  const [editPos, setEditPos] = useState({ top: 0, left: 0 });
  const chipEls = useRef<any[]>([]);
  const [draft, setDraft] = useState<any>(null);
  const valueEl = useRef<HTMLInputElement>(null);
  function editCond(i: number) {
    const c = conds[i]; if (!c) return;
    const el = chipEls.current[i] || boxEl.current;
    const r = el?.getBoundingClientRect(); if (!r) return;
    setEditPos({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left, window.innerWidth - 312)) });
    setDraft({ op: c.op, values: [...(c.values || [])], value: c.value || '' });
    setEditing(i);
    requestAnimationFrame(() => valueEl.current?.focus?.());
  }
  const editField = editing >= 0 && conds[editing] ? fieldOf(conds[editing]) : null;
  const opOptions = editField?.type === 'enum' ? ENUM_OPS : TEXT_OPS;
  function toggleValue(v: string) {
    const cur = draft.values;
    setDraft({ ...draft, values: cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v] });
  }
  function done() {
    const next = conds.map((c, i) => (i === editing ? { ...c, ...draft } : c));
    // a chip you opened and left empty is abandoned rather than kept as a no-op
    setConds(next.filter((c, i) => (i === editing ? condReady(c) : true)));
    setEditing(-1);
  }
  function cancelEdit() {
    // closing without choosing anything discards a brand-new, still-empty chip
    setConds(conds.filter((c, i) => !(i === editing && !condReady(c))));
    setEditing(-1);
  }
  function removeCond(i: number) {
    if (editing === i) setEditing(-1);
    setConds(conds.filter((_, k) => k !== i));
  }

  const chipText = (c: any) => ({ field: fieldOf(c)?.label || c.key, op: opLabelFor(c, fieldOf(c)), val: condValueText(c) });

  const escRef = useRef<() => void>(() => {});
  escRef.current = () => { setFieldsOpen(false); if (editing >= 0) cancelEdit(); };
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') escRef.current(); };
    addEventListener('keydown', onEsc);
    return () => removeEventListener('keydown', onEsc);
  }, []);

  return (
    <div className="dc-TableFilterBar tfb">
      <div ref={boxEl} className={`tfb-box ${fieldsOpen || editing >= 0 ? 'act' : ''}`} onClick={openFields}>
        {/* a FILTER icon, not a magnifier: typing here searches, but clicking builds a typed
            condition, and the leading glyph is what says which control this is */}
        <Icon name="filter" size={15} className="mu" />

        {conds.map((c, i) => (
          <span
            key={i}
            ref={(el) => { chipEls.current[i] = el; }}
            className={`fchip ${editing === i ? 'on' : ''} ${!condReady(c) ? 'draft' : ''}`}
            title="Edit this condition"
            onClick={(e) => { e.stopPropagation(); editCond(i); }}
          >
            <b>{chipText(c).field}</b>
            {condReady(c) && <><em>{chipText(c).op}</em><b className="v">{chipText(c).val}</b></>}
            <button title="Remove" onClick={(e) => { e.stopPropagation(); removeCond(i); }}><Icon name="x" size={10} /></button>
          </span>
        ))}

        <input
          ref={inputEl}
          value={search}
          onChange={(e) => onUpdateSearch?.(e.target.value)}
          className="tfb-in"
          placeholder={placeholder}
          onFocus={openFields}
          onClick={(e) => { e.stopPropagation(); openFields(); }}
        />
        {/* inside the field, not beside it: the ✕ clears and closes THIS control */}
        {closable && (
          <button className="tfb-x" title="Clear and close" onClick={(e) => { e.stopPropagation(); onClose?.(); }}><Icon name="x" size={14} /></button>
        )}
      </div>

      {(fieldsOpen || editing >= 0) && (
        <DashPortal>
          <div className="dc-TableFilterBar">
            {/* fields */}
            {fieldsOpen && <div className="tfb-back" onClick={() => setFieldsOpen(false)} />}
            {fieldsOpen && (
              <div className="tfb-fields" style={{ top: fieldPos.top + 'px', left: fieldPos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
                {fields.map((f) => <button key={f.key} className="tfb-f" onClick={() => pickField(f)}>{f.label}</button>)}
                {!fields.length && <p className="tfb-empty">No fields to filter on.</p>}
              </div>
            )}

            {/* operator + value */}
            {editing >= 0 && <div className="tfb-back" onClick={cancelEdit} />}
            {editing >= 0 && draft && (
              <div className="tfb-cond" style={{ top: editPos.top + 'px', left: editPos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
                <label className="tfb-l">Operator</label>
                <Dropdown modelValue={draft.op} onUpdateModelValue={(v) => setDraft({ ...draft, op: v })} options={opOptions} />

                {editField?.type === 'enum' ? (
                  <div className="tfb-vals">
                    {editField.options.map((o: string) => (
                      <label key={o} className={`tfb-v ${draft.values.includes(o) ? 'on' : ''}`}>
                        <input type="checkbox" checked={draft.values.includes(o)} onChange={() => toggleValue(o)} />
                        <span className="ellip">{o}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    ref={valueEl}
                    className="input tfb-t"
                    value={draft.value}
                    onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                    placeholder={editField?.label}
                    onKeyUp={(e) => { if (e.key === 'Enter') done(); }}
                  />
                )}

                <div className="tfb-foot"><button className="btn btn-sm" onClick={done}>Done</button></div>
              </div>
            )}
          </div>
        </DashPortal>
      )}
    </div>
  );
}
