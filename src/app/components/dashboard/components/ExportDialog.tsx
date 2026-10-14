/**
 * ExportDialog — anchored under the Export button in the board header.
 *
 * Replaces the old Download popover *and* the "Export dashboard as a PDF" half of the
 * share popover. Exporting a board has exactly three destinations, and they differ only
 * in where the file ends up:
 *   Image        → a PNG of the board, downloaded
 *   PDF          → the same board as a PDF, downloaded
 *   Email as PDF → that same PDF, delivered instead of downloaded
 *
 * Email is a destination, not a separate feature, so it is a third segment rather than
 * a second dialog — the password option is shared by both PDF routes, and stating it
 * once is what keeps the two from drifting apart.
 *
 * Port: the Download | Export tabs and the Image | PDF switch are the product's pill-track;
 * the password switch is the product's ToggleSwitch.
 */
import { useEffect, useRef, useState } from 'react';
import './ExportDialog.css';
import { Icon } from '../ui/primitives';
import { ToggleSwitch } from '../../FormRuleControls';
import { toast } from '../store.js';

/* Two levels, not three flat segments. The three destinations were never siblings:
 * Image and PDF both put a file on your disk, Email puts it in someone's inbox. The
 * top level is therefore WHERE it goes (Download | Export) and the format switcher
 * lives inside Download, where it is the only remaining question. */
const MODES = [
  { id: 'download', label: 'Download' },
  { id: 'export', label: 'Export' },
];
const DL_FORMATS = [
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'pdf', label: 'PDF', icon: 'file-text' },
];

export function ExportDialog({ d, onClose }: any) {
  const [mode, setMode] = useState('download');
  const [dlFmt, setDlFmt] = useState('pdf');
  const isEmail = mode === 'export';
  // an image has no container to encrypt, so protection only exists on the PDF routes
  const isPdf = isEmail || dlFmt === 'pdf';

  const [pwd, setPwd] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  /* Recipients, added one at a time: committing an address turns it into a row and brings
   * the [+] back, so an empty input never sits on screen pretending to be a required field. */
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const emailEl = useRef<HTMLInputElement>(null);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.trim());
  useEffect(() => { if (adding) requestAnimationFrame(() => emailEl.current?.focus()); }, [adding]);
  const startEmail = () => setAdding(true);
  const cancelEmail = () => { setAdding(false); setNewEmail(''); };
  function addEmail() {
    if (!emailValid) return;
    setEmails([...emails, newEmail.trim()]);
    setNewEmail('');
    setAdding(false);
  }
  const removeEmail = (i: number) => setEmails(emails.filter((_, k) => k !== i));

  function run() {
    // asking for protection and leaving it blank would produce an unprotected file
    if (pwd && isPdf && !password.trim()) { toast('Set an attachment password, or turn the protection off', 'warn'); return; }
    const prot = pwd && isPdf ? ' — password protected' : '';
    if (isEmail) {
      if (!emails.length) { toast('Add at least one email address', 'warn'); return; }
      toast(`“${d.name}” sent as PDF to ${emails.length} recipient${emails.length > 1 ? 's' : ''}${prot}`, 'success');
    } else {
      toast(`Exporting “${d.name}” as ${dlFmt === 'pdf' ? 'PDF' : 'an image'}${prot}`, 'success');
    }
    onClose?.();
  }

  return (
    <div className="dc-ExportDialog" style={{ display: 'contents' }}>
      <div className="pv-back" onClick={() => onClose?.()} />
      <div className="pv card" onClick={(e) => e.stopPropagation()}>
        <header className="pv-head"><span className="pv-title">Export dashboard</span></header>

        <div className="pill-track pv-modes" role="tablist">
          {MODES.map((m) => (
            <button key={m.id} role="tab" aria-selected={mode === m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>

        {/* Download: the only question left is which file */}
        {!isEmail && (
          <div className="pill-track pv-fmt">
            {DL_FORMATS.map((f) => (
              <button key={f.id} aria-pressed={dlFmt === f.id} onClick={() => setDlFmt(f.id)}><Icon name={f.icon} size={15} /> {f.label}</button>
            ))}
          </div>
        )}

        {/* Export: one destination, named in full so the tab label can stay short */}
        {isEmail && (
          <>
            <div className="sec-h">Export (Email as a PDF)</div>
            <label className="fl">Add Email <i>*</i></label>
            <div className="emails">
              {emails.map((e, i) => (
                <div key={i} className="erow">
                  <span className="eaddr">{e}</span>
                  <button className="ex" title="Remove" onClick={() => removeEmail(i)}><Icon name="x" size={13} /></button>
                </div>
              ))}
              {adding ? (
                <div className="erow">
                  <input ref={emailEl} className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@company.com"
                    onKeyUp={(e) => { if (e.key === 'Enter') addEmail(); if (e.key === 'Escape') cancelEmail(); }} />
                  <button className="ex" title="Cancel" onClick={cancelEmail}><Icon name="x" size={13} /></button>
                </div>
              ) : (
                <button className="add-btn" title="Add an email address" onClick={startEmail}><Icon name="plus" size={16} /></button>
              )}
            </div>
          </>
        )}

        {isPdf && (
          <div className="tgl-row" onClick={() => setPwd(!pwd)}>
            <span className="tgl-txt">
              <b>Password Protected</b>
              <em>The PDF is encrypted, and anyone opening it needs this password.</em>
            </span>
            <span onClick={(e) => e.stopPropagation()}><ToggleSwitch on={pwd} onChange={setPwd} /></span>
          </div>
        )}

        {pwd && isPdf && (
          <>
            <label className="fl">Attachment Password <i>*</i></label>
            <div className="pw">
              <input className="input" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <button className="eye" title={showPwd ? 'Hide' : 'Show'} onClick={() => setShowPwd(!showPwd)}><Icon name="eye" size={15} /></button>
            </div>
          </>
        )}

        <footer className="pv-foot">
          <button className="btn" onClick={() => onClose?.()}>Cancel</button>
          <button className="btn btn-primary" onClick={run}>
            <Icon name={isEmail ? 'mail' : 'download'} size={15} /> {isEmail ? 'Send PDF' : 'Export'}
          </button>
        </footer>
      </div>
    </div>
  );
}
