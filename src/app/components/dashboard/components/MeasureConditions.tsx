/**
 * MeasureConditions — the one condition editor every chart type shares (§5 of the
 * PMG-ACT-01 configuration reference). Rows are ANDed: `field is value`, drawn from
 * the categorical vocabulary in records.js. Changing a row's field snaps its value to
 * that field's first option. Booleans (Reopened/Escalated) present as Yes/No.
 *
 * v-model is the conds array [{ field, value }]. Gauge's Measurement reuses this twice
 * (base population + numerator), which is why the empty-state copy is a prop.
 */
import { Icon, Dropdown } from '../ui/primitives';
import { CONDITION_FIELD_LABELS, valuesFor } from '../data/records.js';
import './MeasureConditions.css';

export function MeasureConditions({ modelValue = [], emptyText = 'No conditions — every record counts.', onUpdateModelValue }: any) {
  const rows: any[] = modelValue || [];
  const set = (next: any[]) => onUpdateModelValue?.(next);

  const add = () => {
    const field = (CONDITION_FIELD_LABELS as any)[0];
    set([...rows, { field, value: (valuesFor as any)(field)[0] }]);
  };
  const remove = (i: number) => set(rows.filter((_, k) => k !== i));
  // changing the field invalidates the old value → snap to the new field's first option
  const setField = (i: number, field: any) => set(rows.map((r, k) => (k === i ? { field, value: (valuesFor as any)(field)[0] } : r)));
  const setValue = (i: number, value: any) => set(rows.map((r, k) => (k === i ? { ...r, value } : r)));

  return (
    <div className="dc-MeasureConditions mconds">
      {!rows.length && emptyText && <p className="hint mc-empty">{emptyText}</p>}
      {rows.map((row, i) => (
        <div key={i} className="mc-row">
          <div className="mc-dd"><Dropdown modelValue={row.field} options={CONDITION_FIELD_LABELS as any} onUpdateModelValue={(v) => setField(i, v)} /></div>
          <span className="mc-is">is</span>
          <div className="mc-dd"><Dropdown modelValue={row.value} options={(valuesFor as any)(row.field)} onUpdateModelValue={(v) => setValue(i, v)} /></div>
          <button className="mc-x" title="Remove condition" onClick={() => remove(i)}><Icon name="x" size={14} /></button>
        </div>
      ))}
      <button className="btn btn-sm mc-add" onClick={add}><Icon name="plus" size={13} /> Add Condition</button>
    </div>
  );
}
