/* Create / Clone / Edit dashboard — a right-edge drawer, matching Add New Widget and every
 * other side panel in the module.
 *
 * Port: the product's controls — FieldLabel labels, .input fields, the Dropdown (RuleSelect),
 * pill-track for the Dashboard Access Level radios, ToggleSwitch for the two ON/OFF settings. */
import { useState } from 'react';
import './CreateDashboardPanel.css';
import { Icon, Dropdown } from '../ui/primitives';
import { FieldLabel, ToggleSwitch } from '../../FormRuleControls';
import { store, createDashboard, addCategory } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router } from '../nav.js';
import { ACCESS, uid } from '../data/mock.js';

const ACC_DESC: any = {
  public: 'Everyone with portal access can open this dashboard.',
  private: 'Only you can open and manage this dashboard.',
  restricted: 'Only the technicians / groups you pick below can open it.',
};
const groupOptions = ['Service Desk', 'Network Team', 'NOC Viewers'];

// Clone naming: "{base} - copy N" — strip any existing "- copy N" suffix to find the
// base, then pick the lowest N not already used (so a 2nd copy becomes "- copy 2").
function cloneName(srcName: string) {
  const base = srcName.replace(/\s*-\s*copy\s*\d+$/i, '').trim();
  const taken = new Set(store.dashboards.map((d: any) => d.name.toLowerCase()));
  let n = 1;
  while (taken.has(`${base} - copy ${n}`.toLowerCase())) n++;
  return `${base} - copy ${n}`;
}

export function CreateDashboardPanel() {
  useDashStore();
  // Clone / Edit when a source dashboard is set; otherwise Create. Read once, at open.
  const [src] = useState(() => store.ui.cloneTarget || store.ui.editTarget);
  const isClone = !!store.ui.cloneTarget;
  const isEdit = !!store.ui.editTarget;
  /* Editing a PREDEFINED dashboard: its identity ships with the product and can't be
   * changed. Cloning one is unrestricted — the copy is yours. */
  const lockedDash = isEdit && !!store.ui.editTarget?.predefined;

  const [name, setName] = useState(() => (store.ui.cloneTarget ? cloneName(src.name) : src ? src.name : ''));
  const [access, setAccess] = useState(() => src?.access || 'public');
  const [category, setCategory] = useState(() => src?.category || '');
  const [description, setDescription] = useState(() => src?.description || '');
  const [techAccess, setTechAccess] = useState<any[]>(() => (src?.techAccess?.length ? [...src.techAccess] : [store.currentUser]));
  const [groupAccess, setGroupAccess] = useState(() => (src?.groupAccess && src.groupAccess[0]) || '');
  const [defaultLanding, setDefaultLanding] = useState(() => src?.default || false);
  const [layoutLock, setLayoutLock] = useState(() => src?.layoutLock === true);
  const [err, setErr] = useState('');

  /* Dashboard names must be unique. The board being edited is excluded by id; archived
   * boards still count, because restoring one would produce a duplicate. */
  const nameTaken = (() => {
    const n = name.trim().toLowerCase();
    if (!n || lockedDash) return false;
    const selfId = store.ui.editTarget?.id;
    return store.dashboards.some((d: any) => d.id !== selfId && d.name.trim().toLowerCase() === n);
  })();
  const canSave = lockedDash || (!!name.trim() && !nameTaken);

  // the empty option reads as the prompt ("Select Category"), not as a category called None
  const catOptions = [{ value: '', label: 'Select Category' }, ...store.categories.map((c: string) => ({ value: c, label: c }))];

  // Category → Add New popover
  const [catAdd, setCatAdd] = useState(false);
  const [newCat, setNewCat] = useState('');
  function saveCat() {
    const n = addCategory(newCat);
    if (n) setCategory(n);
    setNewCat(''); setCatAdd(false);
  }

  function close() { store.ui.createOpen = false; store.ui.cloneTarget = null; store.ui.editTarget = null; }
  function submit() {
    if (!lockedDash && !name.trim()) { setErr('Give your dashboard a name.'); return; }
    if (nameTaken) return; // the field already says why; never save a duplicate
    const ta = access === 'restricted' ? techAccess : undefined;
    const ga = access === 'restricted' && groupAccess ? [groupAccess] : undefined;
    // ---- edit in place ----
    if (isEdit) {
      Object.assign(src, {
        // a predefined board keeps its identity
        ...(lockedDash ? {} : {
          name: name.trim(), access, description,
          ...(ta ? { techAccess: ta } : {}), ...(ga ? { groupAccess: ga } : {}),
        }),
        category,
        layoutLock,
        updated: new Date().toISOString(),
      });
      // the default landing board is a single global flag — setting one clears the rest
      if (defaultLanding) { store.dashboards.forEach((x: any) => (x.default = false)); src.default = true; }
      else src.default = false;
      close();
      return;
    }
    // ---- create / clone ----
    const opts: any = { name, access, category, description, techAccess: ta, groupAccess: ga, makeDefault: defaultLanding, layoutLock };
    if (isClone) opts.tiles = src.tiles.map((t: any) => ({ ...JSON.parse(JSON.stringify(t)), id: uid('t') }));
    const d = createDashboard(opts);
    // a brand-new (non-clone) board lands empty → auto-open the Add-Widget drawer
    if (!isClone) store.ui.pendingAddWidget = true;
    close();
    router.push(`/dashboard/${d.id}`);
  }

  return (
    <div className="dc-CreateDashboardPanel drawer-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="drawer">
        <div className="dlg-head">
          <div>
            <h3>{isEdit ? 'Edit Dashboard' : isClone ? 'Clone Dashboard' : 'Create Dashboard'}</h3>
            {(isEdit || isClone) && <p className="muted">{isEdit ? 'Update this dashboard’s details.' : 'Duplicate this board with its widgets, then tweak it.'}</p>}
          </div>
          <button className="dlg-x" onClick={close}><Icon name="x" size={16} /></button>
        </div>

        <div className="body">
          {/* A predefined board's identity ships with the product — shown disabled, so the
              value is legible and the dead control says it is fixed. */}
          {lockedDash && (
            <p className="pd-note">
              <Icon name="verified" size={14} />
              <span>This is a <b>predefined dashboard</b> — its <b>Name</b>, <b>Description</b> and <b>Visibility &amp; Sharing</b> ship with the product and are shown here read-only. You can still change its Category and the widgets on it.</span>
            </p>
          )}

          <div className="sec-h">Basics</div>

          <div className="grp">
            <FieldLabel required={!lockedDash}>Name</FieldLabel>
            <input className={`input ${nameTaken ? 'bad' : ''}`} value={name} placeholder="Name" disabled={lockedDash} autoFocus={!lockedDash}
              onChange={(e) => { setName(e.target.value); setErr(''); }} />
            {nameTaken ? (
              <p className="dup-err">
                <Icon name="alert" size={13} />
                <span>A dashboard named “{name.trim()}” already exists. <b>Dashboard names must be unique</b> — pick another.</span>
              </p>
            ) : err ? <div className="err">{err}</div> : null}
          </div>

          <div className="grp">
            <FieldLabel required={!lockedDash}>Description</FieldLabel>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" disabled={lockedDash} />
          </div>

          {/* Category + Add New */}
          <div className="grp">
            <FieldLabel>Category</FieldLabel>
            <div className="cat-row">
              <Dropdown modelValue={category} onUpdateModelValue={setCategory} options={catOptions} placeholder="Select Category" />
              <button className="btn cat-new" onClick={() => setCatAdd(!catAdd)}>New Category <Icon name="plus" size={15} /></button>
              {catAdd && (
                <div className="cat-pop card" onClick={(e) => e.stopPropagation()}>
                  <FieldLabel required>Category Name</FieldLabel>
                  <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Security" onKeyUp={(e) => e.key === 'Enter' && saveCat()} autoFocus />
                  <div className="cat-pop-btns">
                    <button className="btn btn-sm" onClick={() => { setCatAdd(false); setNewCat(''); }}>Cancel</button>
                    <button className="btn btn-sm btn-primary" disabled={!newCat.trim()} onClick={saveCat}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Access + one-liner */}
          <div className="sec-h">Visibility &amp; sharing</div>
          <div className="grp">
            <FieldLabel required={!lockedDash}>Dashboard Access Level</FieldLabel>
            <div className={`pill-track acc-seg ${lockedDash ? 'ro' : ''}`}>
              {Object.entries(ACCESS as any).map(([k, a]: any) => (
                <button key={k} aria-pressed={access === k} disabled={lockedDash} onClick={() => setAccess(k)}>{a.label}</button>
              ))}
            </div>
            <p className="oneliner"><Icon name="info" size={14} /> {ACC_DESC[access]}</p>
          </div>

          {/* Restricted targeting — belongs to Visibility, so it goes when Visibility does */}
          {!lockedDash && access === 'restricted' && (
            <div className="two">
              <div className="grp">
                <FieldLabel required>Technician Access Level</FieldLabel>
                <Dropdown modelValue={techAccess} onUpdateModelValue={setTechAccess} options={store.owners} multiple placeholder="Select technicians" />
              </div>
              <div className="grp">
                <FieldLabel required>Technician Group Access Level</FieldLabel>
                <Dropdown modelValue={groupAccess} onUpdateModelValue={setGroupAccess} options={groupOptions} placeholder="Select" />
              </div>
            </div>
          )}

          {/* Default landing — a personal preference: this board is the one YOU land on. */}
          <div className="grp toggle-grp">
            <div className="tg-text">
              <label className="field" style={{ margin: 0 }}>Default landing dashboard</label>
              <span className="oneliner plain">When set as default, this dashboard opens first on sign-in.</span>
            </div>
            <ToggleSwitch on={defaultLanding} onChange={setDefaultLanding} />
          </div>

          {/* Layout Lock — freezes position AND size for everyone viewing the board */}
          <div className="grp toggle-grp">
            <div className="tg-text">
              <label className="field" style={{ margin: 0 }}>Layout Lock</label>
              <span className="oneliner plain">A per-dashboard lock that freezes every widget’s position and size, so viewing, presenting, or screen-sharing a board can never accidentally rearrange it.</span>
            </div>
            <ToggleSwitch on={layoutLock} onChange={setLayoutLock} />
          </div>
        </div>

        <div className="dlg-foot">
          <button className="btn btn-primary" disabled={!canSave} title={nameTaken ? 'That name is already taken — dashboard names must be unique' : ''} onClick={submit}>
            <Icon name={isEdit ? 'check' : isClone ? 'copy' : 'plus'} size={16} /> {isEdit ? 'Save changes' : isClone ? 'Clone Dashboard' : 'Create'}
          </button>
          <button className="btn" onClick={close}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
