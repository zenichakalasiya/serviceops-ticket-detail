// Version / change history for a dashboard — range-filtered, ServiceOps UI treatment.
import { useState } from 'react';
import './HistoryDialog.css';
import { Icon } from '../ui/primitives';
import { useDashStore } from '../reactivity.js';

export function HistoryDialog({ d, onClose }: any) {
  useDashStore();
  const [from, setFrom] = useState('2021-06-07');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState({ from: '2021-06-07', to: new Date().toISOString().slice(0, 10) });
  const search = () => setApplied({ from, to });

  const s = q.trim().toLowerCase();
  const rows = (d.history || [])
    .filter((h: any) => h.date >= applied.from && h.date <= applied.to)
    .filter((h: any) => !s || [h.event, h.user, h.summary, h.module].some((v) => String(v).toLowerCase().includes(s)));

  return (
    <div className="dc-HistoryDialog drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="hd">
        <header className="hd-head">
          <h3>History: {d.name}</h3>
          <button className="ic" onClick={() => onClose?.()}><Icon name="x" size={18} /></button>
        </header>

        <div className="hd-filters">
          <div className="fl"><label>From <i>*</i></label><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="fl"><label>To <i>*</i></label><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn btn-primary srch-btn" onClick={search}><Icon name="search" size={15} /> Search</button>
        </div>
        <div className="hd-filter2">
          <div className="qbox"><Icon name="search" size={14} className="muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter events…" /></div>
        </div>

        <div className="hd-body">
          <table className="htbl">
            <thead><tr><th>Event</th><th>Event Time</th><th>Module</th><th>User</th><th>Change Summary</th></tr></thead>
            <tbody>
              {rows.map((h: any, i: number) => (
                <tr key={i}>
                  <td><b>{h.event}</b></td>
                  <td className="muted">{h.when}</td>
                  <td>{h.module}</td>
                  <td><a className="user">{h.user}</a></td>
                  <td className="sum">{h.summary}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="none">No changes in this range.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="hd-foot"><span className="muted">Showing {rows.length} {rows.length === 1 ? 'event' : 'events'}</span></footer>
      </div>
    </div>
  );
}
