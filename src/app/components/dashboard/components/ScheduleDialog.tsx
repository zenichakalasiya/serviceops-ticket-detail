/* ScheduleDialog — `d` is whatever is being scheduled — a dashboard (has `name`) or a single widget
 * (has `title`). The dialog is identical either way: same recipients, same format, same recurrence,
 * so it takes both rather than being forked.
 *
 * Product controls (Zeni's rule): Format, Export Option and the Monthly mode are pill-tracks; the
 * Password switch is ToggleSwitch; a schedule's Enabled column is StatusToggle.
 */
import { useRef, useState } from 'react';
import { Icon, Dropdown } from '../ui/primitives';
import { store, toast } from '../store.js';
import { uid } from '../data/mock.js';
import { useDashStore, useReactive } from '../reactivity.js';
import { ToggleSwitch, StatusToggle } from '../../FormRuleControls';
import './ScheduleDialog.css';

// ---- option lists ----
const TIME_FILTERS = ['Today', 'Last 7 days', 'Last 15 days', 'Last 30 days', 'This Week', 'This Month'];
const SCHEDULE_TYPES = ['Once', 'Daily', 'Weekly', 'Monthly'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const OCCUR = ['First', 'Second', 'Third', 'Fourth', 'Last'];
const GROUPS = ['Service Desk', 'Network Team', 'NOC Viewers'];
const HH = [...Array(24)].map((_, i) => String(i).padStart(2, '0'));
const MM = [...Array(12)].map((_, i) => String(i * 5).padStart(2, '0'));
const DATES = [...Array(31)].map((_, i) => String(i + 1));

const blank = () => ({
  name: '', emails: [] as string[], newEmail: '', format: 'PDF', pwd: false, password: '', showPwd: false,
  timeFilter: '', technician: '', group: '', exportOption: 'attachment',
  type: 'Once', monthlyMode: 'date', startAt: '', hh: '00', mm: '00',
  weekDay: '', dateNum: '', month: '', occurrence: '',
});

export function ScheduleDialog({ d, onClose }: any) {
  useDashStore();
  const subject = d.name || d.title || 'this item';
  if (!d.schedules) d.schedules = [];
  const [view, setView] = useState<'list' | 'form'>('list');
  const [search, setSearch] = useState('');
  const list = d.schedules.filter((s: any) => s.name.toLowerCase().includes(search.trim().toLowerCase()));

  // ---- create form ----
  const f: any = useReactive(blank());
  const editId = useRef<string | null>(null);
  function openCreate() { Object.assign(f, blank()); editId.current = null; setView('form'); }
  function openEdit(s: any) { Object.assign(f, blank(), { name: s.name, type: s.type, timeFilter: s.timeFilter }); editId.current = s.id; setView('form'); }

  function addEmail() { const e = f.newEmail.trim(); if (e) { f.emails.push(e); f.newEmail = ''; } }
  function removeEmail(i: number) { f.emails.splice(i, 1); }

  function createSchedule() {
    if (!f.name.trim()) { toast('Give the schedule a name.', 'warn'); return; }
    if (editId.current) {
      const s = d.schedules.find((x: any) => x.id === editId.current);
      if (s) Object.assign(s, { name: f.name, type: f.type, timeFilter: f.timeFilter || '—' });
    } else {
      d.schedules.push({ id: uid('sch'), name: f.name, type: f.type, timeFilter: f.timeFilter || '—', enabled: true });
    }
    toast(`Schedule “${f.name}” saved`, 'success');
    setView('list');
  }
  function delSchedule(s: any) { d.schedules = d.schedules.filter((x: any) => x.id !== s.id); }

  const Req = () => <i>*</i>;

  return (
    <div className="dc-ScheduleDialog sc-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="sc-panel">
        {view === 'list' ? (
          /* ===== LIST ===== */
          <>
            <div className="dlg-head"><h3>Schedule: {subject}</h3><button className="dlg-x" onClick={() => onClose?.()}><Icon name="x" size={18} /></button></div>
            <div className="lst-top">
              <div className="qbox"><Icon name="search" size={15} className="muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" /></div>
              <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={15} /> Create Schedule</button>
            </div>
            <div className="lst-body">
              <table className="stbl">
                <thead><tr><th>Name</th><th>Schedule Type</th><th>Time Filter</th><th>Enabled</th><th className="ta-r">Actions</th></tr></thead>
                <tbody>
                  {list.map((s: any) => (
                    <tr key={s.id}>
                      <td><b>{s.name}</b></td><td>{s.type}</td><td>{s.timeFilter}</td>
                      <td><StatusToggle on={!!s.enabled} onChange={(v) => { s.enabled = v; }} /></td>
                      <td className="ta-r">
                        <button className="act" title="Edit" onClick={() => openEdit(s)}><Icon name="edit" size={15} /></button>
                        <button className="act del" title="Delete" onClick={() => delSchedule(s)}><Icon name="trash" size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {!list.length && <tr><td colSpan={5} className="none">No schedules yet — create one.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="dlg-foot"><span className="muted spread">Showing {list.length} of {d.schedules.length} items</span><button className="btn" onClick={() => onClose?.()}>Close</button></div>
          </>
        ) : (
          /* ===== CREATE / EDIT FORM ===== */
          <>
            <div className="dlg-head">
              <div className="row gap-10"><button className="ic" title="Back to schedules" onClick={() => setView('list')}><Icon name="arrow-left" size={18} /></button><h3>{editId.current ? 'Edit Schedule' : 'Create Schedule'}</h3></div>
              <button className="dlg-x" onClick={() => onClose?.()}><Icon name="x" size={18} /></button>
            </div>
            <div className="body">
              <div className="grid2">
                <div className="fld"><label>Name <Req /></label><input className="input" value={f.name} onChange={(e) => { f.name = e.target.value; }} placeholder="Name" /></div>
                <div className="fld"><label>Emails</label>
                  {/* the prototype's own chip field — TagEditor's "Add tag" copy is wrong for addresses */}
                  <div className="emails">
                    {f.emails.map((e: string, i: number) => (
                      <span key={i} className="echip">{e} <button onClick={() => removeEmail(i)}><Icon name="x" size={12} /></button></span>
                    ))}
                    <input className="einput" value={f.newEmail} onChange={(e) => { f.newEmail = e.target.value; }} placeholder="add email…" onKeyUp={(e) => { if (e.key === 'Enter') addEmail(); }} />
                    <button className="eadd" onClick={addEmail}><Icon name="plus" size={15} /></button>
                  </div>
                </div>

                <div className="fld"><label>Format <Req /></label>
                  <div className="pill-track">
                    {['PDF', 'CSV', 'Image'].map((x) => (
                      <button key={x} type="button" aria-pressed={f.format === x} onClick={() => { f.format = x; }}>{x}</button>
                    ))}
                  </div>
                </div>
                <div className="fld"><label>Password Protected</label><ToggleSwitch on={f.pwd} onChange={(v) => { f.pwd = v; }} /></div>
                {f.pwd && (
                  <div className="fld span2"><label>Attachment Password <Req /></label>
                    <div className="pwd-input">
                      <Icon name="lock" size={14} className="muted" />
                      <input type={f.showPwd ? 'text' : 'password'} value={f.password} onChange={(e) => { f.password = e.target.value; }} placeholder="Attachment Password" />
                      <button className="eye" onClick={() => { f.showPwd = !f.showPwd; }}><Icon name="eye" size={15} /></button>
                    </div>
                  </div>
                )}

                <div className="fld"><label>Time Filter <Req /></label><Dropdown modelValue={f.timeFilter} onUpdateModelValue={(v) => { f.timeFilter = v; }} options={TIME_FILTERS} placeholder="Select" /></div>
                <div className="fld"><label>Technician</label><Dropdown modelValue={f.technician} onUpdateModelValue={(v) => { f.technician = v; }} options={store.owners} placeholder="Select" /></div>

                <div className="fld"><label>Technician Group</label><Dropdown modelValue={f.group} onUpdateModelValue={(v) => { f.group = v; }} options={GROUPS} placeholder="Select" /></div>
                <div className="fld"><label>Export Option</label>
                  <div className="pill-track">
                    <button type="button" aria-pressed={f.exportOption === 'attachment'} onClick={() => { f.exportOption = 'attachment'; }}>Attachment</button>
                    <button type="button" aria-pressed={f.exportOption === 'link'} onClick={() => { f.exportOption = 'link'; }}>Attachment Link</button>
                  </div>
                </div>

                <div className="fld"><label>Schedule Type <Req /></label><Dropdown modelValue={f.type} onUpdateModelValue={(v) => { f.type = v; }} options={SCHEDULE_TYPES} /></div>
                <div />
              </div>

              {/* Monthly: specific date vs specific day */}
              {f.type === 'Monthly' && (
                <div className="fld">
                  <label>When should this scheduler run? <Req /></label>
                  <div className="pill-track">
                    <button type="button" aria-pressed={f.monthlyMode === 'date'} onClick={() => { f.monthlyMode = 'date'; }}>On Specific Date</button>
                    <button type="button" aria-pressed={f.monthlyMode === 'day'} onClick={() => { f.monthlyMode = 'day'; }}>On Specific Day</button>
                  </div>
                </div>
              )}

              {/* Start At + conditional time/day fields */}
              <div className="grid2">
                <div className="fld"><label>Start At <Req /></label><input className="input" type="datetime-local" value={f.startAt} onChange={(e) => { f.startAt = e.target.value; }} /></div>

                {/* Daily/Weekly/Monthly show a Time picker */}
                {f.type !== 'Once' ? (
                  <div className="fld"><label>Time</label>
                    <div className="time-row">
                      <Dropdown modelValue={f.hh} onUpdateModelValue={(v) => { f.hh = v; }} options={HH} />
                      <span className="colon">:</span>
                      <Dropdown modelValue={f.mm} onUpdateModelValue={(v) => { f.mm = v; }} options={MM} />
                    </div>
                  </div>
                ) : <div />}

                {/* Weekly → Day */}
                {f.type === 'Weekly' && (
                  <div className="fld"><label>Day <Req /></label><Dropdown modelValue={f.weekDay} onUpdateModelValue={(v) => { f.weekDay = v; }} options={WEEKDAYS} placeholder="Select" /></div>
                )}

                {/* Monthly · On Specific Date → Date + Month */}
                {f.type === 'Monthly' && f.monthlyMode === 'date' && (
                  <>
                    <div className="fld"><label>Date <Req /></label><Dropdown modelValue={f.dateNum} onUpdateModelValue={(v) => { f.dateNum = v; }} options={DATES} placeholder="Select" /></div>
                    <div className="fld"><label>Month <Req /></label><Dropdown modelValue={f.month} onUpdateModelValue={(v) => { f.month = v; }} options={MONTHS} placeholder="Select" /></div>
                  </>
                )}

                {/* Monthly · On Specific Day → Occurrence + Weekday + Month */}
                {f.type === 'Monthly' && f.monthlyMode === 'day' && (
                  <>
                    <div className="fld"><label>Occurrence <Req /></label><Dropdown modelValue={f.occurrence} onUpdateModelValue={(v) => { f.occurrence = v; }} options={OCCUR} placeholder="Select" /></div>
                    <div className="fld"><label>Weekday <Req /></label><Dropdown modelValue={f.weekDay} onUpdateModelValue={(v) => { f.weekDay = v; }} options={WEEKDAYS} placeholder="Select" /></div>
                    <div className="fld"><label>Month <Req /></label><Dropdown modelValue={f.month} onUpdateModelValue={(v) => { f.month = v; }} options={MONTHS} placeholder="Select" /></div>
                  </>
                )}
              </div>
            </div>
            <div className="dlg-foot">
              <button className="btn btn-primary" onClick={createSchedule}><Icon name="check" size={16} /> {editId.current ? 'Save' : 'Create'}</button>
              <button className="btn" onClick={() => setView('list')}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
