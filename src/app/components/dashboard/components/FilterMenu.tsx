/**
 * FilterMenu — one filter icon, two levels.
 *
 *   click the icon        → the list of filterable FIELDS, each with a ▸
 *   hover / click a field → its VALUES, multi-select with checkboxes
 *
 * Used by both the Manage-all list and the Shortcut tables, so the two filter the same way. Values
 * within a field are OR (Open *or* In Progress); fields are AND (Status is Open AND Priority is P1).
 *
 * v-model is { [fieldKey]: string[] }. An empty array means "no filter on this field", never
 * "match nothing".
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import './FilterMenu.css';

const W = 210, SUB_W = 210, GAP = 4, EDGE = 8;

export function FilterMenu({ fields, modelValue = {}, label = 'Filter', onUpdateModelValue }: any) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, subRight: true });
  const [activeField, setActiveField] = useState<string | null>(null); // which field's value list is showing

  const active = fields.find((f: any) => f.key === activeField) || null;
  const count = Object.values(modelValue).reduce((n: number, v: any) => n + (v?.length ? 1 : 0), 0) as number;
  const picked = (key: string): string[] => modelValue[key] || [];
  const isOn = (key: string, v: string) => picked(key).includes(v);

  function toggle(key: string, v: string) {
    const cur = picked(key);
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    const m = { ...modelValue };
    if (next.length) m[key] = next;
    else delete m[key]; // drop the key entirely — an empty array is not a filter
    onUpdateModelValue?.(m);
  }
  function clearField(key: string) { const m = { ...modelValue }; delete m[key]; onUpdateModelValue?.(m); }
  function clearAll() { onUpdateModelValue?.({}); }

  /* The trigger usually sits at the right of a toolbar, so the panel gets clamped to the right
   * edge — and the submenu, opening at left:100%, then landed entirely OFF-SCREEN. So the submenu
   * flips to the left of the panel whenever the right won't fit. */
  function place() {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(EDGE, Math.min(r.left, window.innerWidth - W - EDGE));
    setPos({ top: r.bottom + 6, left, subRight: left + W + GAP + SUB_W + EDGE <= window.innerWidth });
  }
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(place);
    addEventListener('scroll', place, true);
    addEventListener('resize', place);
    return () => { removeEventListener('scroll', place, true); removeEventListener('resize', place); };
  }, [open]);

  function toggleOpen(e: React.MouseEvent) { e.stopPropagation(); setOpen(!open); setActiveField(null); }
  function close() { setOpen(false); setActiveField(null); }

  return (
    <div className="dc-FilterMenu fm">
      <button ref={btn} className={`fm-btn ${open || count ? 'on' : ''}`} title={label} onClick={toggleOpen}>
        <Icon name="filter" size={15} />
        {!!count && <span className="fm-dot">{count}</span>}
      </button>

      {open && (
        <DashPortal>
          <div className="dc-FilterMenu">
            <div className="fm-back" onClick={close} />
            <div className="fm-pop" style={{ top: pos.top + 'px', left: pos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
              {/* level 1: the fields */}
              <div className="fm-head">
                <span>{label} by</span>
                {!!count && <button className="fm-clr" onClick={clearAll}>Clear all</button>}
              </div>
              {fields.map((f: any) => (
                <button
                  key={f.key}
                  className={`fm-item ${activeField === f.key ? 'on' : ''} ${picked(f.key).length ? 'has' : ''}`}
                  onMouseEnter={() => setActiveField(f.key)}
                  onClick={() => setActiveField(activeField === f.key ? null : f.key)}
                >
                  <span className="fm-l">{f.label}</span>
                  {!!picked(f.key).length && <span className="fm-n">{picked(f.key).length}</span>}
                  <Icon name="chevron-right" size={15} className="fm-c" />
                </button>
              ))}

              {/* level 2: that field's values, multi-select */}
              {active && (
                <div className={`fm-sub ${!pos.subRight ? 'left' : ''}`} onMouseEnter={() => setActiveField(active.key)}>
                  <div className="fm-head">
                    <span>{active.label}</span>
                    {!!picked(active.key).length && <button className="fm-clr" onClick={() => clearField(active.key)}>Clear</button>}
                  </div>
                  <div className="fm-vals">
                    {active.options.map((o: string) => (
                      <label key={o} className={`fm-val ${isOn(active.key, o) ? 'on' : ''}`}>
                        <input type="checkbox" checked={isOn(active.key, o)} onChange={() => toggle(active.key, o)} />
                        <span className="ellip">{o}</span>
                      </label>
                    ))}
                    {!active.options.length && <p className="fm-empty">Nothing to filter on.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashPortal>
      )}
    </div>
  );
}
