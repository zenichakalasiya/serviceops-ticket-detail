/**
 * GroupEditDrawer — a group's properties, one per row.
 *
 * Edits apply to the group LIVE, so the header on the board changes as you choose — the
 * drawer is narrow and the board beside it is the preview. Nothing is final until Save:
 * the X, Cancel, Escape and a click on the scrim all put back the snapshot taken when the
 * drawer opened. Reset returns every field to its default but, like the Layout drawer's
 * Reset, is itself part of the draft — Cancel undoes it too.
 *
 * Every control is one the rest of the product already uses (the product input, ColorPicker,
 * Dropdown and the pill-track), so a group is configured the way a widget is.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, Dropdown, DashPortal } from '../ui/primitives';
import { ColorPicker } from './ColorPicker';
import { GRP_BGS, GRP_SIZES, GRP_DEFAULTS, grpStyleOf } from '../data/groups.js';
import { toast } from '../store.js';
import { useDashStore } from '../reactivity.js';
import './GroupEditDrawer.css';

const SIZE_OPTS = (GRP_SIZES as any[]).map((s) => ({ value: s.id, label: s.id }));
/* No date filter here (2026-09-28): a group's range is set ONLY from the calendar icon that
   always sits on its header. Padding and Share group were removed from this drawer too —
   a group keeps whatever those were (the defaults: padded, public). */
const ALIGN = [
  { v: 'left', icon: 'align-left', tip: 'Align title left' },
  { v: 'center', icon: 'align-center', tip: 'Centre the title' },
];

export function GroupEditDrawer({ group, onClose }: any) {
  useDashStore();
  // the group carries its style on `style`; give an older group one to write into (once)
  const init = useRef(false);
  if (!init.current) {
    init.current = true;
    if (!group.style) group.style = { ...GRP_DEFAULTS };
    else Object.assign(group.style, grpStyleOf(group));
  }
  const st = group.style;
  const snap = useRef({ name: group.name, style: { ...st } });
  const [nameErr, setNameErr] = useState('');

  const reset = () => { Object.assign(st, GRP_DEFAULTS); };
  const cancel = () => {
    group.name = snap.current.name;
    Object.assign(st, snap.current.style);
    onClose?.();
  };
  const save = () => {
    const n = (group.name || '').trim();
    if (!n) { setNameErr('A group needs a title'); return; }
    group.name = n;
    toast(`Group “${n}” saved`, 'success');
    onClose?.();
  };
  const cancelRef = useRef(cancel); cancelRef.current = cancel;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelRef.current(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <DashPortal>
      <div className="dc-GroupEditDrawer ge-overlay" onClick={(e) => e.target === e.currentTarget && cancel()}>
        <aside className="ge" role="dialog" aria-label="Edit group">
          <header className="ge-head">
            <h3>Edit group</h3>
            <button className="dlg-x" title="Close" onClick={cancel}><Icon name="x" size={18} /></button>
          </header>

          <div className="ge-body">
            <div className="fld">
              <label>Group title <i className="req">*</i></label>
              <input
                value={group.name || ''} onChange={(e) => { group.name = e.target.value; setNameErr(''); }}
                className={`input ge-in ${nameErr ? 'err' : ''}`} maxLength={60}
                placeholder="Name this group" onKeyUp={(e) => e.key === 'Enter' && save()}
              />
              {nameErr && <p className="ge-err">{nameErr}</p>}
            </div>

            <div className="fld">
              <label>Header colour</label>
              <ColorPicker modelValue={st.bg} options={GRP_BGS} onUpdateModelValue={(v: string) => { st.bg = v; }} />
            </div>

            <div className="fld">
              <label>Title size</label>
              <Dropdown modelValue={st.size} options={SIZE_OPTS} onUpdateModelValue={(v) => { st.size = v; }} />
            </div>

            <div className="fld">
              <label>Alignment</label>
              <div className="pill-track ge-seg">
                {ALIGN.map((a) => (
                  <button key={a.v} aria-pressed={st.align === a.v} className="ge-ic" title={a.tip} onClick={() => { st.align = a.v; }}>
                    <Icon name={a.icon} size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="ge-foot">
            <button className="ge-reset" onClick={reset}><Icon name="reset" size={14} /> Reset</button>
            <span className="grow" />
            <button className="btn" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </footer>
        </aside>
      </div>
    </DashPortal>
  );
}
