import { useEffect, useRef, useState } from 'react';
import './AutoRefresh.css';
import { Icon } from '../ui/primitives';
import { store, toast } from '../store.js';
import { useDashStore } from '../reactivity.js';

// Off · 5s · 10s · 30s · 1m · 5m · 15m · 30m · 1h · 2h · 1d.
// "Auto" was dropped: every other row states the interval it sets, and a row that
// does not say how often it refreshes cannot be chosen on purpose.
const OPTS = [
  { k: 'off', label: 'Off', sec: 0 },
  { k: '5s', label: '5s', sec: 5 }, { k: '10s', label: '10s', sec: 10 }, { k: '30s', label: '30s', sec: 30 },
  { k: '1m', label: '1m', sec: 60 }, { k: '5m', label: '5m', sec: 300 }, { k: '15m', label: '15m', sec: 900 },
  { k: '30m', label: '30m', sec: 1800 }, { k: '1h', label: '1h', sec: 3600 }, { k: '2h', label: '2h', sec: 7200 }, { k: '1d', label: '1d', sec: 86400 },
];

export function AutoRefresh({ onRefresh }: any) {
  useDashStore();
  const [open, setOpen] = useState(false);
  const [spin, setSpin] = useState(false);
  const cb = useRef(onRefresh); cb.current = onRefresh;

  /* A MANUAL refresh replays the skeleton — the user asked for it and is watching.
   * An AUTO tick must not: a wallboard on a 5-minute cycle would strobe. (Grafana's
   * playlist reloads the page each cycle and flickers; that is the thing to avoid.)
   * So the two are told apart, and the listener decides what each one means. */
  const pulse = (isManual: boolean) => { setSpin(true); setTimeout(() => setSpin(false), 700); cb.current?.(isManual); };
  function manual() { pulse(true); toast('Dashboard refreshed'); }
  function pick(o: any) { store.autoRefresh = { interval: o.k, label: o.label }; setOpen(false); }
  const interval = store.autoRefresh.interval;
  // the store's interval is the source of truth — restarts the timer however it is changed
  useEffect(() => {
    const sec = (OPTS.find((o) => o.k === interval) || ({} as any)).sec || 0;
    if (!(sec > 0)) return;
    const timer = setInterval(() => pulse(false), sec * 1000);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="dc-AutoRefresh ar">
      <button className="refresh" onClick={manual} title="Refresh now">
        <Icon name="refresh" size={17} className={spin ? 'spin' : ''} />
      </button>
      <div className="rel">
        <button className={`interval ${open ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} title="Auto-refresh interval">
          {store.autoRefresh.label} <Icon name="chevron-down" size={13} />
        </button>
        {open && <div className="backdrop" onClick={() => setOpen(false)} />}
        {open && (
          <div className="menu" onClick={(e) => e.stopPropagation()}>
            {OPTS.map((o) => (
              <button key={o.k} className={`menu-item ${store.autoRefresh.interval === o.k ? 'on' : ''}`} onClick={() => pick(o)}>
                {o.label} {store.autoRefresh.interval === o.k && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
